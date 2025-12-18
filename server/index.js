console.log("🔥 Server starting...");
console.log("NODE_ENV:", process.env.NODE_ENV);

// Load environment variables (only in development)
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}
console.log("✅ Dotenv loaded");

// 1. Packages
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
console.log("✅ Core packages imported");

// 2. Models
import User from "./models/User.js";
console.log("✅ Models imported");

// 3. Middleware & Helpers
import checkDailyReset from "./middleware/limitReset.js";
import protect from "./middleware/auth.js";
console.log("✅ Middleware imported");

// 4. Constants
import { TIER_LIMITS } from "./config/constants.js";
console.log("✅ Constants imported");

// 5. App setup
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === "production";

// Debug: Log if MongoDB URI is missing
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables!");
  console.error("Available vars:", Object.keys(process.env).slice(0, 10));
}

console.log("Starting middleware setup...");

app.use(express.json({ limit: "20mb" }));
console.log("✅ JSON middleware added");

app.use(express.urlencoded({ limit: "20mb", extended: true }));
console.log("✅ URLEncoded middleware added");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
console.log("✅ CORS middleware added");

// 6. Routes
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import twoFARoutes from "./routes/twoFARoutes.js";
console.log("✅ All routes imported");

app.get("/api/users/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const updatedUser = await checkDailyReset(user, TIER_LIMITS);
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

    const remaining = user.get(limitField);
    if (typeof remaining === "string" || remaining > 0) {
      if (typeof remaining === "number") user.set(limitField, remaining - 1);
      await user.save();
      success = true;
      message = "Limit successfully decremented.";
    } else {
      message = "Daily limit reached for this feature.";
    }

    res.status(200).json({ success, message, remaining: user.get(limitField) });
  } catch (error) {
    console.error("Decrement limit error:", error);
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
    user.limits.generationsRemaining = newLimits.dailyGenerations;
    user.limits.flashcardGenerationsRemaining =
      newLimits.dailyFlashcardGenerations;
    user.limits.pdfUploadsRemaining = newLimits.dailyPdfUploads;
    user.limits.pdfExportsRemaining = newLimits.dailyPdfExports;
    user.limits.maxQuestions = newLimits.maxQuestions;
    user.limits.maxMarks = newLimits.maxMarks;
    user.limits.lastReset = Date.now();

    await user.save();

    res.status(200).json({
      message: `Successfully upgraded to ${tier} tier.`,
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    res.status(500).json({ message: "Server error during upgrade." });
  }
});

// Mount route handlers
app.use("/api/ai", aiRoutes);
console.log("✅ AI routes mounted");
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes mounted");
app.use("/api/auth/2fa", twoFARoutes);
console.log("✅ 2FA routes mounted");
app.use("/api/quizzes", quizRoutes);
console.log("✅ Quiz routes mounted");
app.use("/api/reviews", reviewRoutes);
console.log("✅ Review routes mounted");
app.use("/api/flashcards", flashcardRoutes);
console.log("✅ Flashcard routes mounted");
app.use("/api/support", supportRoutes);
console.log("✅ Support routes mounted");

console.log("🚀 Starting server...");

if (isProduction) {
  console.log = () => {};
}

console.log("📍 About to call startServer()");

async function startServer() {
  console.log("📍 Inside startServer()");
  try {
    // Check if MONGODB_URI exists
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    console.log("Attempting to connect to MongoDB...");
    console.log("MONGODB_URI:", MONGODB_URI.substring(0, 30) + "..."); // Show first 30 chars

    // Connect to MongoDB with options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB Atlas Connected successfully! 🚀");

    // Start server
    app.listen(PORT, () =>
      console.log(`Server running in ${process.env.NODE_ENV} mode on ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server Not Started");
    console.error("Error details:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
}

console.log("📍 startServer function defined");

try {
  startServer();
  console.log("📍 startServer() called successfully");
} catch (err) {
  console.error("❌ Error calling startServer:", err);
}
