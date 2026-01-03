import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import {
  generateQuizHelper,
  generatePerformanceReviewHelper,
} from "../helpers/aiHelper.js";

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
      try {
        res.write(
          `data: ${JSON.stringify({
            type: "progress",
            stage,
            percentage,
            questionsGenerated,
          })}\n\n`
        );
      } catch (err) {
        console.error("Error writing progress:", err);
      }
    };

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const quizData = await generateQuizHelper(req.body, user, sendProgress);

    // Send final result
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        data: quizData,
      })}\n\n`
    );

    // Only decrement limits for non-admin users
    if (user.role !== "admin") {
      user.limits.generationsRemaining -= 1;
    }
    await user.save();

    res.end();
  } catch (error) {
    console.error("Quiz generation error:", error);
    try {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: error.message || "Internal server error",
        })}\n\n`
      );
    } catch (err) {
      console.error("Error writing error response:", err);
    }
    res.end();
  }
};

export const generateReviewEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { quizzes } = req.body;

  const reviewText = await generatePerformanceReviewHelper(user, quizzes);

  res.status(200).json({ review: reviewText });
});
