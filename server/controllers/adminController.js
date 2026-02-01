import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import dns from "dns";
import { createSession } from "../helpers/sessionHelper.js";
import { escapeRegex } from "../helpers/utils.js";

// Fix for MongoDB Atlas connection issues locally (querySrv ECONNREFUSED)
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  console.warn("Could not set custom DNS servers, using system defaults.");
}

const JWT_SECRET = process.env.JWT_SECRET;

// Admin Login
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const admin = await User.findOne({ email }).select("+password");

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

  // Generate Session using helper (caps at 10 sessions)
  const session = createSession(req, admin);
  await admin.save();

  const sessionId = session._id;

  // Generate JWT token
  const token = jwt.sign(
    { id: admin._id, role: admin.role, sessionId },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.json({
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      picture: admin.picture,
    },
  });
});

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
export const getDashboardStats = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Execute independent queries in parallel
  const [
    totalUsers,
    totalQuizzes,
    newUsersToday,
    attemptsAggregation,
    averageScoresPerQuiz,
    storageStats,
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ["user", "admin"] } }),
    Quiz.countDocuments(),
    User.countDocuments({
      createdAt: { $gte: today },
      role: { $in: ["user", "admin"] },
    }),
    Quiz.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Quiz.aggregate([
      { $match: { score: { $exists: true } } },
      {
        $group: {
          _id: "$title",
          avgScore: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      {
        $project: {
          quiz: { $substr: ["$_id", 0, 15] },
          average: { $round: ["$avgScore", 0] },
          _id: 0,
        },
      },
    ]),
    getStorageUsedStats(),
  ]);

  // Calculate total quiz attempts (Each doc is an attempt per existing logic)
  const totalAttempts = totalQuizzes;

  // Build complete 7-day array with all days present
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const attemptsMap = new Map(attemptsAggregation.map((a) => [a._id, a.count]));
  const quizAttemptsPerDay = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    quizAttemptsPerDay.push({
      day: dayNames[date.getDay()],
      date: dateStr,
      attempts: attemptsMap.get(dateStr) || 0,
    });
  }

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
});

// Get Users with Pagination
export const getUsers = asyncHandler(async (req, res) => {
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

  // Apply search filter
  if (search) {
    const escapedSearch = escapeRegex(search);
    conditions.push({
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
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

  const [result] = await User.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "quizzes", // Collection name derived from Quiz model
              localField: "_id",
              foreignField: "userId",
              as: "userQuizzes",
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              role: 1,
              active: 1,
              banned: 1,
              createdAt: 1,
              lastLogin: 1,
              picture: 1,
              quizzesTaken: { $size: "$userQuizzes" },
              averageScore: {
                $round: [
                  {
                    $avg: {
                      $filter: {
                        input: "$userQuizzes",
                        as: "quiz",
                        cond: { $ne: ["$$quiz.score", null] },
                      },
                      in: "$$this.score",
                    },
                  },
                  0, // Round to 0 decimal places
                ],
              },
            },
          },
        ],
      },
    },
  ]);

  const usersWithStats = result.data || [];
  const total = result.metadata[0]?.total || 0;

  res.json({
    users: usersWithStats,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get User Details
export const getUserDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .select("-password")
    .populate("statusHistory.adminId", "name email")
    .lean();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const quizzes = await Quiz.find({ userId }).lean();
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
});

// Toggle User Active Status
export const toggleUserActive = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body; // Reason for disabling

  // First fetch the user to get current active status
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.active = !user.active;

  // Record in status history
  user.statusHistory = user.statusHistory || [];
  user.statusHistory.push({
    action: user.active ? "enabled" : "disabled",
    timestamp: new Date(),
    reason: reason || null,
    adminId: req.adminId,
  });

  // If disabling, invalidate all sessions immediately
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
});

// Toggle User Ban Status
export const toggleUserBan = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body; // Reason for banning

  // First fetch the user to get current banned status
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

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
});

// Promote User to Admin
export const promoteUserToAdmin = asyncHandler(async (req, res) => {
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
});

// Demote Admin to User
export const demoteAdminToUser = asyncHandler(async (req, res) => {
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
});

// Get Quiz Results
export const getQuizResults = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const quizFilter = req.query.quiz || "";

  const skip = (page - 1) * limit;

  const filter = { score: { $ne: null } }; // Only completed quizzes have scores
  if (quizFilter) {
    filter.title = { $regex: escapeRegex(quizFilter), $options: "i" };
  }

  const quizzes = await Quiz.find(filter)
    .populate("userId", "name email picture")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Quiz.countDocuments(filter);

  const results = quizzes.map((quiz) => ({
    _id: quiz._id,
    user: quiz.userId?.name || "Unknown",
    userEmail: quiz.userId?.email || "",
    userPicture: quiz.userId?.picture || null,
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
});

// Get All Quizzes
export const getQuizzes = asyncHandler(async (req, res) => {
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
    const escapedSearch = escapeRegex(search);
    filterQuery.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { topic: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const quizzes = await Quiz.find(filterQuery)
    .populate("userId", "name email picture")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Quiz.countDocuments(filterQuery);

  // Calculate aggregate stats for all quizzes in a single query
  const [globalStats] = await Quiz.aggregate([
    {
      $group: {
        _id: null,
        totalQuizzes: { $sum: 1 },
        totalScore: { $sum: { $ifNull: ["$score", 0] } },
        passedQuizzes: { $sum: { $cond: [{ $gte: ["$score", 60] }, 1, 0] } },
        difficultySum: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ["$difficulty", "Easy"] }, then: 1 },
                { case: { $eq: ["$difficulty", "Hard"] }, then: 3 },
              ],
              default: 2, // Medium
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        avgScore: {
          $cond: [
            { $gt: ["$totalQuizzes", 0] },
            { $round: [{ $divide: ["$totalScore", "$totalQuizzes"] }, 1] }, // Round to 1 decimal place
            0,
          ],
        },
        completionRate: {
          $cond: [
            { $gt: ["$totalQuizzes", 0] },
            { $round: [{ $multiply: [{ $divide: ["$passedQuizzes", "$totalQuizzes"] }, 100] }] },
            0,
          ],
        },
        avgDifficultyValue: {
          $cond: [{ $gt: ["$totalQuizzes", 0] }, { $divide: ["$difficultySum", "$totalQuizzes"] }, 0],
        },
      },
    },
  ]);

  let avgScore = 0;
  let completionRate = 0;
  let avgDifficulty = "Medium";

  if (globalStats) {
    avgScore = globalStats.avgScore;
    completionRate = globalStats.completionRate;
    const avgDiffValue = globalStats.avgDifficultyValue;

    if (avgDiffValue < 1.5) avgDifficulty = "Easy";
    else if (avgDiffValue < 2.5) avgDifficulty = "Medium";
    else avgDifficulty = "Hard";
  }

  const data = quizzes.map((quiz) => ({
    _id: quiz._id,
    title: quiz.title,
    creator: quiz.userId?.name || "Unknown",
    creatorPicture: quiz.userId?.picture || null,
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
});

// Get Quiz Detail
export const getQuizDetail = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findById(quizId)
    .populate("userId", "name email")
    .lean();

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
});

// Get Admin Info
export const getAdminInfo = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.adminId)
    .select("name email role lastLogin picture")
    .lean();

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  res.json({ admin });
});

// Enable Quiz
export const enableQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findByIdAndUpdate(
    quizId,
    { isActive: true },
    { new: true }
  ).lean();

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  res.json({ message: "Quiz enabled successfully", quiz });
});

// Disable Quiz
export const disableQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findByIdAndUpdate(
    quizId,
    { isActive: false },
    { new: true }
  ).lean();

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  res.json({ message: "Quiz disabled successfully", quiz });
});

// Delete Quiz
export const deleteQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findByIdAndDelete(quizId);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  res.json({ message: "Quiz deleted successfully" });
});
