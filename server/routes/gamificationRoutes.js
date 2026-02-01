import express from "express";
import protect from "../middleware/auth.js";
import {
  awardQuizCreation,
  awardQuizCompletion,
  awardFlashcardCreation,
  awardPdfUpload,
  awardPdfExport,
  getUserStats,
  getLeaderboard,
} from "../controllers/gamificationController.js";

const router = express.Router();

// ==================== GAMIFICATION ENDPOINTS ====================

router.post("/award-quiz-creation", protect, awardQuizCreation);
router.post("/award-quiz-completion", protect, awardQuizCompletion);
router.post("/award-flashcard-creation", protect, awardFlashcardCreation);
router.post("/award-pdf-upload", protect, awardPdfUpload);
router.post("/award-pdf-export", protect, awardPdfExport);
router.get("/user-stats", protect, getUserStats);
router.get("/leaderboard", getLeaderboard);

export default router;