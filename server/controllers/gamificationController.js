import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { calculateLevel, calculateLevelProgress } from "../config/achievements.js";
import {
  checkExpReset,
  awardQuizCreationExp,
  awardQuizCompletionExp,
  awardFlashcardCreationExp,
  awardPdfUploadExp,
  awardPdfExportExp,
} from "../helpers/achievementHelper.js";

// @desc    Award EXP for quiz creation
// @route   POST /api/gamification/award-quiz-creation
// @access  Private
export const awardQuizCreation = asyncHandler(async (req, res) => {
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
});

// @desc    Award EXP for quiz completion
// @route   POST /api/gamification/award-quiz-completion
// @access  Private
export const awardQuizCompletion = asyncHandler(async (req, res) => {
  const { score = 0, totalMarks = 100 } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  checkExpReset(user);
  const result = await awardQuizCompletionExp(user, { score, totalMarks });

  // Atomic update for stats to prevent race conditions
  const updateQuery = {
    $inc: { "stats.quizzesTaken": 1 }
  };

  if (score === totalMarks) {
    updateQuery.$inc.perfectScores = 1;
  }

  await User.findByIdAndUpdate(req.userId, updateQuery);
  await user.save(); // Save EXP changes from helper

  res.status(200).json({
    success: true,
    exp: result.expAwarded,
    levelUp: result.levelUp,
    newLevel: result.newLevel,
    achievements: result.newAchievements,
    totalExp: user.totalExpEarned,
    level: calculateLevel(user.totalExpEarned),
  });
});

// @desc    Award EXP for flashcard creation
// @route   POST /api/gamification/award-flashcard-creation
// @access  Private
export const awardFlashcardCreation = asyncHandler(async (req, res) => {
  const { cardCount = 1 } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  checkExpReset(user);
  const result = await awardFlashcardCreationExp(user, { cardCount });
  
  // Atomic increment
  await User.findByIdAndUpdate(req.userId, { $inc: { flashcardsCreated: 1 } });
  await user.save(); // Save EXP changes

  res.status(200).json({
    success: true,
    exp: result.expAwarded,
    levelUp: result.levelUp,
    newLevel: result.newLevel,
    achievements: result.newAchievements,
    totalExp: user.totalExpEarned,
    level: calculateLevel(user.totalExpEarned),
  });
});

// @desc    Award EXP for PDF upload
// @route   POST /api/gamification/award-pdf-upload
// @access  Private
export const awardPdfUpload = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  checkExpReset(user);
  const result = await awardPdfUploadExp(user);
  
  // Atomic increment
  await User.findByIdAndUpdate(req.userId, { $inc: { pdfsUploaded: 1 } });
  await user.save();

  res.status(200).json({
    success: true,
    exp: result.expAwarded,
    achievements: result.newAchievements,
  });
});

// @desc    Award EXP for PDF export
// @route   POST /api/gamification/award-pdf-export
// @access  Private
export const awardPdfExport = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  checkExpReset(user);
  const result = await awardPdfExportExp(user);
  
  // Atomic increment
  await User.findByIdAndUpdate(req.userId, { $inc: { pdfsExported: 1 } });
  await user.save();

  res.status(200).json({
    success: true,
    exp: result.expAwarded,
    achievements: result.newAchievements,
  });
});

// @desc    Get user achievements and EXP stats
// @route   GET /api/gamification/user-stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const levelProgress = calculateLevelProgress(user.totalExpEarned);

  res.status(200).json({
    totalExp: user.totalExpEarned,
    level: calculateLevel(user.totalExpEarned),
    levelProgress,
    achievements: user.achievements || [],
    weeklyExp: user.weeklyExp || 0,
    monthlyExp: user.monthlyExp || 0,
  });
});

// @desc    Get leaderboard (with weekly/monthly filtering)
// @route   GET /api/gamification/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { period = "all" } = req.query; // all, weekly, monthly
  let sortField = "totalExpEarned";

  if (period === "weekly") sortField = "weeklyExp";
  else if (period === "monthly") sortField = "monthlyExp";

  const leaderboard = await User.find({})
    .select(
      "name picture level totalExpEarned weeklyExp monthlyExp achievements tier",
    )
    .sort({ [sortField]: -1 })
    .limit(100)
    .lean(); // Use lean() for read-only query

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
});
