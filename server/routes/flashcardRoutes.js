import express from "express";
const router = express.Router();

import Flashcard from "../models/Flashcard.js";
import protect from "../middleware/auth.js";

router.get("/", protect, async (req, res) => {
  try {
    // Add pagination support to prevent loading too many flashcards at once
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 30);
    const skip = (page - 1) * limit;

    const flashcards = await Flashcard.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance when not modifying docs

    const total = await Flashcard.countDocuments({ userId: req.userId });

    res.status(200).json({
      flashcards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    // Failed to fetch flashcards
    res.status(500).json({ message: "Failed to fetch flashcards." });
  }
});

router.post("/bulk", protect, async (req, res) => {
  try {
    const cardsWithUser = req.body.map((card) => ({
      ...card,
      userId: req.userId,
      createdAt: Date.now(),
    }));
    const newCards = await Flashcard.insertMany(cardsWithUser);
    res.status(201).json(newCards);
  } catch {
    // Bulk insert failed
    res.status(400).json({ message: "Error saving flashcards." });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const card = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!card)
      return res
        .status(404)
        .json({ message: "Flashcard not found or unauthorized." });
    res.status(200).json(card);
  } catch {
    res.status(500).json({ message: "Error updating flashcard." });
  }
});

export default router;
