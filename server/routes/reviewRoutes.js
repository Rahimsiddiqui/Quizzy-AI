import express from "express";
const router = express.Router();

import Review from "../models/Review.js";
import protect from "../middleware/auth.js";

router.post("/", protect, async (req, res) => {
  try {
    const newReview = new Review({ ...req.body, userId: req.userId });
    await newReview.save();
    res.status(201).json({ review: newReview });
  } catch {
    // Failed to save AI review
    res.status(500).json({ message: "Failed to save AI review." });
  }
});

router.get("/last", protect, async (req, res) => {
  try {
    const lastReview = await Review.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean(); // Use lean() for better performance when not modifying docs

    res.status(200).json({ review: lastReview || null });
  } catch {
    // Failed to fetch last review
    res.status(500).json({ message: "Failed to fetch last review." });
  }
});

export default router;
