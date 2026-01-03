// Load environment variables (only in development)
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// 1. Packages
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// 2. Models
import User from "./models/User.js";

// 3. Middleware & Helpers
import checkMonthlyReset from "./middleware/limitReset.js";
import protect from "./middleware/auth.js";
import { generateReceiptHTML, getTierPrice } from "./helpers/receiptHelper.js";
import {
  awardQuizCreationExp,
  awardQuizCompletionExp,
  awardFlashcardCreationExp,
  awardPdfUploadExp,
  awardPdfExportExp,
  checkExpReset,
} from "./helpers/achievementHelper.js";

// 4. Constants
import { TIER_LIMITS } from "./config/constants.js";
import { calculateLevel } from "./config/achievements.js";

// 5. App setup
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Trust proxy to capture real IP addresses
app.set("trust proxy", 1);

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://quizzy-ai-d6yb.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// 6. Routes
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import twoFARoutes from "./routes/twoFARoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

app.get("/api/users/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const updatedUser = await checkMonthlyReset(user, TIER_LIMITS);
    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error, Try Again!" });
  }
});

// Decrement Limits
app.post("/api/limits/decrement/:type", protect, async (req, res) => {
  const { type } = req.params;
  let limitField;
  let success = false;
  let message = "Unknown limit type.";

  switch (type) {
    case "quiz":
      limitField = "limits.generationsRemaining";
      break;
    case "flashcard":
      limitField = "limits.flashcardGenerationsRemaining";
      break;
    case "pdfupload":
      limitField = "limits.pdfUploadsRemaining";
      break;
    case "pdfexport":
      limitField = "limits.pdfExportsRemaining";
      break;
    default:
      return res.status(400).json({ success: false, message });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // Admins have unlimited access to all features
    if (user.role === "admin") {
      return res.status(200).json({
        success: true,
        message: "Admin user - no limits applied.",
        remaining: "Unlimited",
      });
    }

    const remaining = user.get(limitField);
    if (typeof remaining === "string" || remaining > 0) {
      if (typeof remaining === "number") user.set(limitField, remaining - 1);
      await user.save();
      success = true;
      message = "Limit successfully decremented.";
    } else {
      message = "Monthly limit reached for this feature.";
    }

    res.status(200).json({ success, message, remaining: user.get(limitField) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during limit decrement.",
    });
  }
});

// Upgrade Subscription
app.post("/api/subscription/upgrade", protect, async (req, res) => {
  const { tier } = req.body;
  const newLimits = TIER_LIMITS[tier];

  if (!newLimits || tier === "free")
    return res.status(400).json({ message: "Invalid subscription tier." });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.tier = tier;
    user.limits.generationsRemaining = newLimits.monthlyGenerations;
    user.limits.flashcardGenerationsRemaining =
      newLimits.monthlyFlashcardGenerations;
    user.limits.pdfUploadsRemaining = newLimits.monthlyPdfUploads;
    user.limits.pdfExportsRemaining = newLimits.monthlyPdfExports;
    user.limits.maxQuestions = newLimits.maxQuestions;
    user.limits.maxMarks = newLimits.maxMarks;
    user.limits.lastReset = Date.now();

    await user.save();

    // Send receipt email to user
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const billingDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const nextBillingDate = new Date(
        new Date().setMonth(new Date().getMonth() + 1)
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const receiptHTML = generateReceiptHTML({
        userName: user.name || "Valued User",
        email: user.email,
        tier: tier === "pro" ? "Pro" : "Basic",
        amount: getTierPrice(tier === "pro" ? "Pro" : "Basic"),
        billingDate,
        nextBillingDate,
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Payment Receipt - Quizzy AI ${
          tier === "pro" ? "Pro" : "Basic"
        } Subscription`,
        html: receiptHTML,
      });
    } catch (emailError) {
      console.error("Receipt email sending error:", emailError);
      // Don't fail the upgrade if email fails
    }

    res.status(200).json({
      message: `Successfully upgraded to ${tier} tier.`,
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during upgrade." });
  }
});

// Request Refund
app.post("/api/subscription/refund", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.tier === "Free") {
      return res
        .status(400)
        .json({ message: "Free tier users cannot request refunds." });
    }

    const previousTier = user.tier;
    const refundAmount = previousTier === "Pro" ? "$11.99" : "$4.99";

    // Reset user to Free tier
    const freeLimits = TIER_LIMITS["Free"];
    user.tier = "Free";
    user.limits = freeLimits;
    user.limits.lastReset = Date.now();
    await user.save();

    // Send refund confirmation email to user
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Refund Confirmation</h2>
            <p style="color: #666; line-height: 1.6;">Hi ${
              user.name || "User"
            },</p>
            
            <p style="color: #666; line-height: 1.6;">Thank you for using Quizzy AI. Your refund request has been processed successfully.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;">
              <h3 style="color: #333; margin-top: 0;">Refund Details</h3>
              <p style="color: #666; margin: 8px 0;"><strong>Previous Plan:</strong> ${previousTier}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Refund Amount:</strong> ${refundAmount}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="color: #666; margin: 8px 0;"><strong>New Plan:</strong> Free Tier</p>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Free Tier Features</h3>
              <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
                <li>7 Quiz generation per day</li>
                <li>3 Flashcard sets per day</li>
                <li>Max 10 Questions per quiz</li>
                <li>Max 30 Marks per quiz</li>
                <li>3 PDF imports per day</li>
                <li>3 PDF exports per day</li>
                <li>Upload 1 PDF per quiz</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Best regards,<br>Quizzy AI Team</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Refund Confirmation - Quizzy AI (${previousTier} → Free)`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the refund if email fails
    }

    res.status(200).json({
      message:
        "Refund request submitted. Your plan has been downgraded to Free tier. A confirmation email has been sent to your email address.",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during refund request." });
  }
});

// ==================== GAMIFICATION ENDPOINTS ====================

// Award EXP for quiz creation
app.post("/api/gamification/award-quiz-creation", protect, async (req, res) => {
  try {
    const { questionCount = 1 } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    checkExpReset(user); // Check if weekly/monthly resets needed
    const result = await awardQuizCreationExp(user, { questionCount });
    await user.save();

    res.status(200).json({
      success: true,
      exp: result.expAwarded,
      levelUp: result.levelUp,
      newLevel: result.newLevel,
      achievements: result.newAchievements,
      totalExp: user.totalExpEarned,
      level: calculateLevel(user.totalExpEarned),
    });
  } catch (error) {
    console.error("Error awarding quiz creation exp:", error);
    res.status(500).json({ message: "Error awarding EXP." });
  }
});

// Award EXP for quiz completion
app.post(
  "/api/gamification/award-quiz-completion",
  protect,
  async (req, res) => {
    try {
      const { score = 0, totalMarks = 100 } = req.body;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found." });

      checkExpReset(user);
      const result = await awardQuizCompletionExp(user, { score, totalMarks });

      // Update stats
      user.stats.quizzesTaken = (user.stats?.quizzesTaken || 0) + 1;
      if (score === totalMarks) {
        user.perfectScores = (user.perfectScores || 0) + 1;
      }

      await user.save();

      res.status(200).json({
        success: true,
        exp: result.expAwarded,
        levelUp: result.levelUp,
        newLevel: result.newLevel,
        achievements: result.newAchievements,
        totalExp: user.totalExpEarned,
        level: calculateLevel(user.totalExpEarned),
      });
    } catch (error) {
      console.error("Error awarding quiz completion exp:", error);
      res.status(500).json({ message: "Error awarding EXP." });
    }
  }
);

// Award EXP for flashcard creation
app.post(
  "/api/gamification/award-flashcard-creation",
  protect,
  async (req, res) => {
    try {
      const { cardCount = 1 } = req.body;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found." });

      checkExpReset(user);
      const result = await awardFlashcardCreationExp(user, { cardCount });
      user.flashcardsCreated = (user.flashcardsCreated || 0) + 1;
      await user.save();

      res.status(200).json({
        success: true,
        exp: result.expAwarded,
        levelUp: result.levelUp,
        newLevel: result.newLevel,
        achievements: result.newAchievements,
        totalExp: user.totalExpEarned,
        level: calculateLevel(user.totalExpEarned),
      });
    } catch (error) {
      console.error("Error awarding flashcard creation exp:", error);
      res.status(500).json({ message: "Error awarding EXP." });
    }
  }
);

// Award EXP for PDF upload
app.post("/api/gamification/award-pdf-upload", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    checkExpReset(user);
    const result = await awardPdfUploadExp(user);
    user.pdfsUploaded = (user.pdfsUploaded || 0) + 1;
    await user.save();

    res.status(200).json({
      success: true,
      exp: result.expAwarded,
      achievements: result.newAchievements,
    });
  } catch (error) {
    console.error("Error awarding PDF upload exp:", error);
    res.status(500).json({ message: "Error awarding EXP." });
  }
});

// Award EXP for PDF export
app.post("/api/gamification/award-pdf-export", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    checkExpReset(user);
    const result = await awardPdfExportExp(user);
    user.pdfsExported = (user.pdfsExported || 0) + 1;
    await user.save();

    res.status(200).json({
      success: true,
      exp: result.expAwarded,
      achievements: result.newAchievements,
    });
  } catch (error) {
    console.error("Error awarding PDF export exp:", error);
    res.status(500).json({ message: "Error awarding EXP." });
  }
});

// Get user achievements and EXP stats
app.get("/api/gamification/user-stats", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const { calculateLevelProgress } = await import("./config/achievements.js");
    const levelProgress = calculateLevelProgress(user.totalExpEarned);

    res.status(200).json({
      totalExp: user.totalExpEarned,
      level: calculateLevel(user.totalExpEarned),
      levelProgress,
      achievements: user.achievements || [],
      weeklyExp: user.weeklyExp || 0,
      monthlyExp: user.monthlyExp || 0,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Error fetching stats." });
  }
});

// Get leaderboard (with weekly/monthly filtering)
app.get("/api/gamification/leaderboard", async (req, res) => {
  try {
    const { period = "all" } = req.query; // all, weekly, monthly
    let sortField = "totalExpEarned";

    if (period === "weekly") sortField = "weeklyExp";
    else if (period === "monthly") sortField = "monthlyExp";

    const leaderboard = await User.find({})
      .select(
        "name picture level totalExpEarned weeklyExp monthlyExp achievements tier"
      )
      .sort({ [sortField]: -1 })
      .limit(100);

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      picture: user.picture,
      level: calculateLevel(user.totalExpEarned),
      totalExp: user.totalExpEarned,
      weeklyExp: user.weeklyExp || 0,
      monthlyExp: user.monthlyExp || 0,
      achievements: user.achievements?.length || 0,
      tier: user.tier,
    }));

    res.status(200).json(rankedLeaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Error fetching leaderboard." });
  }
});

// Mount route handlers
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth/2fa", twoFARoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin", adminRoutes);

async function startServer() {
  try {
    // Check if MONGODB_URI exists
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // Connect to MongoDB with options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB Atlas Connected successfully! 🚀");

    // Disable logs after startup
    if (isProduction) {
      console.log = () => {};
    }

    // Create HTTP server with socket.io
    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    // Socket.io event handlers
    io.on("connection", (socket) => {
      // User connected
      socket.on("disconnect", () => {
        // User disconnected
      });
    });

    // Make io available globally for routes
    app.locals.io = io;

    // Start server
    httpServer.listen(PORT, () =>
      console.log(`Server running in ${process.env.NODE_ENV} mode on ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

try {
  startServer();
} catch (err) {
  console.error("❌ Error starting server:", err);
}
