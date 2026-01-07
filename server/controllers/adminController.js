import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET;

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await User.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is admin
    if (admin.role !== "admin" && admin.role !== "moderator") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    if (admin.banned || !admin.active) {
      return res
        .status(403)
        .json({ message: "Your admin account is disabled or banned" });
    }

    if (!admin.password) {
      return res
        .status(401)
        .json({ message: "Please set a password for your account" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update lastLogin
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

const getStorageUsedStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    // Return both dataSize and storageSize for more context
    return {
      dataMB: (stats.dataSize / (1024 * 1024)).toFixed(2),
      storageMB: (stats.storageSize / (1024 * 1024)).toFixed(2),
      indexMB: (stats.indexSize / (1024 * 1024)).toFixed(2),
    };
  } catch (err) {
    console.error("Storage stat error:", err);
    return { dataMB: "0.00", storageMB: "0.00", indexMB: "0.00" };
  }
};

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    // Count all users (both regular users and admins)
    const totalUsers = await User.countDocuments({
      role: { $in: ["user", "admin"] },
    });
    const totalQuizzes = await Quiz.countDocuments();

    // Get new users today (both regular users and admins)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today },
      role: { $in: ["user", "admin"] },
    });

    // Calculate total quiz attempts
    const quizzes = await Quiz.find();
    const totalAttempts = quizzes.length;

    // Get quiz attempts per day (last 7 days)
    const quizAttemptsPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await Quiz.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      quizAttemptsPerDay.push({
        day: dayNames[date.getDay()],
        date: date.toISOString().split("T")[0],
        attempts: count,
      });
    }

    // Calculate average score per quiz
    const averageScoresPerQuiz = [];
    const quizGroups = {};

    quizzes.forEach((quiz) => {
      if (!quizGroups[quiz.title]) {
        quizGroups[quiz.title] = [];
      }
      if (quiz.score !== undefined) {
        quizGroups[quiz.title].push(quiz.score);
      }
    });

    Object.entries(quizGroups).forEach(([title, scores]) => {
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        averageScoresPerQuiz.push({
          quiz: title.substring(0, 15),
          average: Math.round(avg),
        });
      }
    });

    const storageStats = await getStorageUsedStats();

    const statsData = {
      stats: {
        totalUsers,
        totalQuizzes,
        storageUsedMB: storageStats.storageMB,
        dataUsedMB: storageStats.dataMB,
        totalAttempts,
        newUsersToday,
      },
      charts: {
        quizAttemptsPerDay,
        averageScoresPerQuiz,
      },
    };

    // Emit real-time update to all connected admin dashboards
    if (req.app.locals.io) {
      req.app.locals.io.emit("dashboardUpdate", statsData);
    }

    res.json(statsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Users with Pagination
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const roleFilter = req.query.role || "";
    const statusFilter = req.query.status || "";

    const skip = (page - 1) * limit;

    // Build filter conditions
    const conditions = [];

    // Apply role filter only if specified
    if (roleFilter === "admin") {
      conditions.push({ role: "admin" });
    } else if (roleFilter === "user") {
      conditions.push({ role: "user" });
    }
    // If roleFilter is empty string, don't filter by role (show all users)

    // Apply search filter
    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Apply status filter
    if (statusFilter === "active") {
      conditions.push({ active: true, banned: false });
    } else if (statusFilter === "banned") {
      conditions.push({ banned: true });
    }

    // Combine all conditions with $and
    const filter =
      conditions.length > 1 ? { $and: conditions } : conditions[0] || {};

    const users = await User.find(filter)
      .select("_id name email role active banned createdAt lastLogin picture")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const quizzes = await Quiz.find({ userId: user._id });
        const scores = quizzes
          .map((q) => q.score)
          .filter((s) => s !== undefined);
        const avgScore =
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          banned: user.banned,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          picture: user.picture,
          quizzesTaken: quizzes.length,
          averageScore: avgScore,
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User Details
export const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password")
      .populate("statusHistory.adminId", "name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const quizzes = await Quiz.find({ userId });
    const scores = quizzes
      .map((q) => q.score)
      .filter((s) => s !== undefined && s !== null);

    // Calculate stats
    const totalQuizzes = quizzes.length;
    const quizzesPassed = quizzes.filter((q) => (q.score || 0) >= 60).length;
    const quizzesFailed = totalQuizzes - quizzesPassed;
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const accuracy = totalQuizzes > 0 ? quizzesPassed : 0;
    const accuracyPercent =
      totalQuizzes > 0 ? Math.round((quizzesPassed / totalQuizzes) * 100) : 0;

    // Calculate time spent (in minutes)
    const timeSpent = quizzes.reduce(
      (total, q) => total + (q.timeSpentMinutes || 0),
      0
    );

    // Get last activity
    const lastActivity =
      quizzes.length > 0 ? quizzes[0].createdAt : user.lastLogin;

    // Get sessions/device info
    const devices = (user.sessions || []).map((session) => ({
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
    }));

    res.json({
      user,
      stats: {
        totalQuizzes,
        quizzesPassed,
        quizzesFailed,
        averageScore,
        accuracy: quizzesPassed,
        accuracyPercent,
        timeSpentMinutes: timeSpent,
        firstQuizDate:
          quizzes.length > 0 ? quizzes[quizzes.length - 1].createdAt : null,
        lastQuizDate: quizzes.length > 0 ? quizzes[0].createdAt : null,
        lastActivity,
        devices,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle User Active Status
export const toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body; // Reason for disabling

    // First fetch the user to get current active status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wasActive = user.active;
    user.active = !user.active;

    // Record in status history
    user.statusHistory = user.statusHistory || [];
    user.statusHistory.push({
      action: user.active ? "enabled" : "disabled",
      timestamp: new Date(),
      reason: reason || null,
      adminId: req.adminId,
    });

    // If disabling, INVALIDATE ALL SESSIONS immediately
    if (!user.active) {
      user.sessions = [];
    }

    await user.save();

    res.json({
      message: `User ${user.active ? "enabled" : "disabled"}`,
      user: {
        _id: user._id,
        name: user.name,
        active: user.active,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle User Ban Status
export const toggleUserBan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body; // Reason for banning

    // First fetch the user to get current banned status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wasBanned = user.banned;
    user.banned = !user.banned;

    // Record in status history
    user.statusHistory = user.statusHistory || [];
    user.statusHistory.push({
      action: user.banned ? "banned" : "unbanned",
      timestamp: new Date(),
      reason: reason || null,
      adminId: req.adminId,
    });

    // If banning, INVALIDATE ALL SESSIONS immediately
    if (user.banned) {
      user.sessions = [];
    }

    await user.save();

    res.json({
      message: `User ${user.banned ? "banned" : "unbanned"}`,
      user: {
        _id: user._id,
        name: user.name,
        banned: user.banned,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Promote User to Admin
export const promoteUserToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    user.role = "admin";
    user.tier = "Pro"; // Admins get Pro tier
    await user.save();

    res.json({
      message: "User promoted to admin",
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        tier: user.tier,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Demote Admin to User
export const demoteAdminToUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admins from demoting themselves (adminProtect middleware sets req.adminId)
    if (String(req.adminId) === String(userId)) {
      return res.status(400).json({
        message: "You cannot demote yourself. Contact another admin for help.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ message: "User is not an admin" });
    }

    user.role = "user";
    // Keep tier unchanged - demotion doesn't affect tier
    await user.save();

    res.json({
      message: "Admin demoted to user",
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        tier: user.tier,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Quiz Results
export const getQuizResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const quizFilter = req.query.quiz || "";

    const skip = (page - 1) * limit;

    const filter = { score: { $ne: null } }; // Only completed quizzes have scores
    if (quizFilter) {
      filter.title = { $regex: quizFilter, $options: "i" };
    }

    const quizzes = await Quiz.find(filter)
      .populate("userId", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Quiz.countDocuments(filter);

    const results = quizzes.map((quiz) => ({
      _id: quiz._id,
      user: quiz.userId?.name || "Unknown",
      userEmail: quiz.userId?.email || "",
      quiz: quiz.title,
      score: quiz.score || 0,
      totalMarks: quiz.totalMarks || 0,
      date: quiz.createdAt,
    }));

    res.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Quizzes
export const getQuizzes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const difficulty = req.query.difficulty || null;
    const search = req.query.search || "";
    const isActive =
      req.query.isActive === "false"
        ? false
        : req.query.isActive === "true"
        ? true
        : null;

    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery = {};
    if (difficulty) {
      filterQuery.difficulty = difficulty;
    }
    if (isActive !== null) {
      filterQuery.isActive = isActive;
    }
    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { topic: { $regex: search, $options: "i" } },
      ];
    }

    const quizzes = await Quiz.find(filterQuery)
      .populate("userId", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Quiz.countDocuments(filterQuery);

    // Calculate average score from all quizzes
    const allQuizzes = await Quiz.find();
    const avgScore =
      allQuizzes.length > 0
        ? (
            allQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) /
            allQuizzes.length
          ).toFixed(1)
        : 0;

    // Calculate completion rate (quizzes with score >= 60)
    const passedQuizzes = allQuizzes.filter((quiz) => (quiz.score || 0) >= 60);
    const completionRate =
      allQuizzes.length > 0
        ? Math.round((passedQuizzes.length / allQuizzes.length) * 100)
        : 0;

    // Calculate average difficulty
    let avgDifficulty = "Medium";
    if (allQuizzes.length > 0) {
      const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 };
      const avgDiffValue =
        allQuizzes.reduce((sum, quiz) => {
          return sum + (difficultyMap[quiz.difficulty] || 2);
        }, 0) / allQuizzes.length;

      if (avgDiffValue < 1.5) avgDifficulty = "Easy";
      else if (avgDiffValue < 2.5) avgDifficulty = "Medium";
      else avgDifficulty = "Hard";
    }

    const data = quizzes.map((quiz) => ({
      _id: quiz._id,
      title: quiz.title,
      creator: quiz.userId?.name || "Unknown",
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      attempts: 1, // Each quiz doc is one attempt
      date: quiz.createdAt,
    }));

    res.json({
      quizzes: data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      avgScore,
      completionRate,
      avgDifficulty,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Quiz Detail
export const getQuizDetail = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("userId", "name email");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quizData = {
      _id: quiz._id,
      title: quiz.title,
      creator: quiz.userId?.name || "Unknown",
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questions: quiz.questions || [],
      totalMarks: quiz.totalMarks,
      examStyle: quiz.examStyle,
      score: quiz.score,
      timeSpentMinutes: quiz.timeSpentMinutes || 0,
      createdAt: quiz.createdAt,
    };

    res.json({ quiz: quizData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Admin Info
export const getAdminInfo = async (req, res) => {
  try {
    const admin = await User.findById(req.adminId).select(
      "name email role lastLogin"
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enable Quiz
export const enableQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      { isActive: true },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ message: "Quiz enabled successfully", quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Disable Quiz
export const disableQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      { isActive: false },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ message: "Quiz disabled successfully", quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByIdAndDelete(quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
