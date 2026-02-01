import express from "express";
import rateLimit from "express-rate-limit";
import protect from "../middleware/auth.js";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  oauthCallback,
  setup2FA,
} from "../controllers/authController.js";
import {
  changeFullName,
  updateProfilePicture,
  confirmPassword,
  changePassword,
  checkUsernameAvailability,
  changeUsername,
  deleteAccount,
  getActiveSessions,
  logoutSession,
  logoutAllSessions,
} from "../controllers/userController.js";

const router = express.Router();

// Auth-specific rate limiter (stricter limits for auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for sensitive operations (resend code, username check)
const sensitiveOpsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 operations per hour
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OAuth callback to prevent brute force
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 OAuth attempts per 15 minutes
  message: {
    success: false,
    message: "Too many OAuth attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Routes
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", sensitiveOpsLimiter, resendVerificationCode);
router.post("/oauth/callback", oauthLimiter, oauthCallback);

// User Profile Routes (Protected)
router.post("/change-fullname", protect, changeFullName);
router.post("/update-picture", protect, updateProfilePicture);
router.post("/confirm-password", protect, confirmPassword);
router.post("/change-password", protect, changePassword);
router.post("/change-username", protect, changeUsername);
router.delete("/delete-account", protect, deleteAccount);

// Username Availability (Public but rate limited)
router.get("/check-username", sensitiveOpsLimiter, checkUsernameAvailability);

// Session Management
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId/logout", protect, logoutSession);
router.post("/logout-all", protect, logoutAllSessions);

// 2FA Routes
router.post("/2fa/setup", protect, setup2FA);

export default router;
