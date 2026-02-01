import express from "express";
import {
  submitFeedback,
  submitChatbotFeedback,
} from "../controllers/supportController.js";

const router = express.Router();

router.post("/feedback", submitFeedback);
router.post("/chatbot-feedback", submitChatbotFeedback);

export default router;
