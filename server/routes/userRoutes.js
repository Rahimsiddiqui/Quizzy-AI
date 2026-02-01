import express from "express";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import protect from "../middleware/auth.js";
import checkMonthlyReset from "../middleware/limitReset.js";
import { TIER_LIMITS } from "../config/constants.js";

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user profile (with limit reset check)
// @access  Private
router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    // Note: User is fetched without .lean() to support in-memory updates and Mongoose .save()
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const updatedUser = await checkMonthlyReset(user, TIER_LIMITS);
    updatedUser.password = undefined; // Remove password before sending
    res.status(200).json({ user: updatedUser });
  }),
);

export default router;
