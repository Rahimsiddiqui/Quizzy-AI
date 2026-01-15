import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: false,
    }, // Optional link to source quiz
    front: { type: String, required: true },
    back: { type: String, required: true },
    interval: { type: Number, default: 0 }, // SRS interval in days
    easeFactor: { type: Number, default: 2.5 }, // SRS ease factor
    nextReview: { type: Number, default: Date.now }, // Timestamp for next review
    repetition: { type: Number, default: 0 }, // Number of times reviewed
    lastReviewed: { type: Number, default: Date.now },
    createdAt: { type: Number, default: Date.now },
  },
  { collection: "flashcards", timestamps: true }
);

// Index for efficient retrieval of due cards
FlashcardSchema.index({ userId: 1, nextReview: 1 });

const Flashcard = mongoose.model("Flashcard", FlashcardSchema);

export default Flashcard;
