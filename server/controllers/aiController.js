import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import {
  generateQuizHelper,
  generatePerformanceReviewHelper,
  chatWithAIHelper,
  gradeAnswerHelper,
} from "../helpers/aiHelper.js";
import {
  setupSSE,
  streamResponse,
  handleStreamError,
} from "../helpers/utils.js";

export const generateQuizEndpoint = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.limits.generationsRemaining <= 0 && user.role !== "admin") {
      return res.status(403).json({
        message: "Monthly generation limit reached. Please upgrade your tier.",
      });
    }

    // Function to send progress updates
    const sendProgress = (stage, percentage, questionsGenerated = null) => {
      streamResponse(res, "progress", { stage, percentage, questionsGenerated });
    };

    setupSSE(res);

    const quizData = await generateQuizHelper(req.body, user, sendProgress);

    streamResponse(res, "complete", { data: quizData });

    // Only decrement limits for non-admin users
    if (user.role !== "admin") {
      user.limits.generationsRemaining -= 1;
    }
    await user.save();

    res.end();
  } catch (error) {
    console.error("Quiz generation error:", error);
    handleStreamError(res, error);
  }
};

export const generateReviewEndpoint = asyncHandler(async (req, res) => {
  console.log(`[AI Review] Request received for User: ${req.userId}`);
  const user = await User.findById(req.userId);
  const { quizzes } = req.body;

  const reviewText = await generatePerformanceReviewHelper(user, quizzes);

  res.status(200).json({ review: reviewText });
});

export const chatWithAIEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { messages, context } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required." });
  }

  const reply = await chatWithAIHelper(user, messages, context);
  res.status(200).json({ reply });
});

export const generateDemoEndpoint = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // Hardcoded "Demo User" - effectively free tier
    const demoUser = {
      _id: "demo",
      name: "Demo User",
      role: "user",
      tier: "Free",
      limits: { generationsRemaining: 1 }, // Virtual limit
    };

    // Hardcoded strict limits for demo
    const demoPayload = {
      topic,
      difficulty: "Easy",
      questionCount: 5,
      types: ["MCQ"],
      totalMarks: 5,
      examStyleId: "standard",
    };

    // Function to send progress updates
    const sendProgress = (stage, percentage, questionsGenerated = null) => {
      streamResponse(res, "progress", { stage, percentage, questionsGenerated });
    };

    setupSSE(res);

    const quizData = await generateQuizHelper(
      demoPayload,
      demoUser,
      sendProgress
    );

    streamResponse(res, "complete", { data: quizData });

    res.end();
  } catch (error) {
    console.error("Demo generation error:", error);
    handleStreamError(res, error);
  }
};

export const gradeAnswerEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { question, userAnswer, topic } = req.body;

  if (!question || !question.text) {
    return res.status(400).json({ message: "Question object is required." });
  }

  const result = await gradeAnswerHelper(user, question, userAnswer, topic);
  res.status(200).json(result);
});
