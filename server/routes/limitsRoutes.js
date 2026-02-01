import express from "express";
import User from "../models/User.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/limits/decrement/:type
// @desc    Atomically decrement a user limit
// @access  Private
router.post("/decrement/:type", protect, async (req, res) => {
  const { type } = req.params;
  let limitField;
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
    // 1. Check for user existence and admin role
    const userRole = await User.findById(req.userId).select("role");

    if (!userRole) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (userRole.role === "admin") {
      return res.status(200).json({
        success: true,
        message: "Admin user - no limits applied.",
        remaining: "Unlimited",
      });
    }

    // 2. Attempt atomic decrement: $inc the limit field if it is > 0
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.userId,
        [limitField]: { $gt: 0 },
      },
      {
        $inc: { [limitField]: -1 },
      },
      { new: true, select: limitField }
    );

    if (updatedUser) {
      // Successful decrement
      const remaining = updatedUser.get(limitField);
      return res
        .status(200)
        .json({ success: true, message: "Limit successfully decremented.", remaining });
    } else {
      // Failed to decrement: limit must be 0
      const finalUser = await User.findById(req.userId).select(limitField);
      const remaining = finalUser?.get(limitField) ?? 0;

      message = "Monthly limit reached for this feature.";
      return res
        .status(403)
        .json({ success: false, message, remaining });
    }
  } catch (error) {
    console.error("Server error during limit decrement:", error);
    res.status(500).json({
      success: false,
      message: "Server error during limit decrement.",
    });
  }
});

export default router;
