import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: String,

    // The complex quiz structure (questions, options, explanations) is stored as an Array
    questions: { type: Array, default: [] },

    totalMarks: Number,
    examStyle: String,
    score: Number,
    timeSpentMinutes: { type: Number, default: 0 }, // Track time spent on quiz
    isActive: { type: Boolean, default: true }, // Track if quiz is enabled/disabled
    isFlashcardSet: { type: Boolean, default: false }, // Track if flashcards are created for this quiz
    behavioralData: { type: mongoose.Schema.Types.Mixed, default: {} }, // Detailed question-level tracking
    createdAt: { type: Number, default: Date.now },
  },
  { collection: "quizzes" }
); // Explicit collection name

const Quiz = mongoose.model("Quiz", QuizSchema);

export default Quiz;
