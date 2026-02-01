import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Simple in-memory cache for user lookups (5 second TTL)
const userCache = new Map();
const USER_CACHE_TTL = 5000; // 5 seconds

// Clear cache entry on user mutations
export const clearUserCache = (userId) => {
  userCache.delete(userId);
};

// Helper to clear user cache when user data is modified
export const invalidateUserCache = async (userId) => {
  if (userId) {
    clearUserCache(String(userId));
  }
};

const getCachedUser = async (userId) => {
  const now = Date.now();
  const cached = userCache.get(userId);

  if (cached && now - cached.timestamp < USER_CACHE_TTL) {
    return cached.user;
  }

  // Fetch user with selective fields only - don't fetch password/verification
  const user = await User.findById(userId)
    .select("name email picture tier role active banned sessions");

  if (user) {
    userCache.set(userId, { user, timestamp: now });
  }

  return user;
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token || token.trim() === "") {
        return res.status(401).json({ message: "No token provided" });
      }

      if (!JWT_SECRET) {
        return res.status(500).json({ message: "Server configuration error" });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      if (!decoded.id) {
        return res.status(401).json({ message: "Invalid token structure" });
      }

      // Require sessionId in token for per-session logout support
      if (!decoded.sessionId) {
        return res.status(401).json({ message: "Session ID missing in token" });
      }

      req.userId = decoded.id;
      req.sessionId = decoded.sessionId;

      // Verify that session is still active for the user
      const user = await getCachedUser(req.userId);
      req.user = user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Auto-fix invalid tier values (migrate from old "Admin" tier)
      const validTiers = ["Free", "Basic", "Pro"];
      if (!validTiers.includes(user.tier)) {
        user.tier = "Free";
        await user.save();
        clearUserCache(user._id);
      }

      // User is banned or disabled - force logout
      if (user.banned) {
        return res.status(403).json({
          message: "Your account has been banned",
          banned: true,
        });
      }

      if (!user.active) {
        return res.status(403).json({
          message:
            "Your account has been temporarily disabled. For help restoring access, please reach out to our support team at qubli.ai.app@gmail.com",
          disabled: true,
        });
      }

      if (
        !user.sessions ||
        !Array.isArray(user.sessions) ||
        !user.sessions.some((s) => String(s._id) === String(req.sessionId))
      ) {
        return res.status(401).json({ message: "Session invalid or expired" });
      }

      next();
    } catch (error) {
      console.warn(`[Auth Protect] Token failure for route ${req.originalUrl}:`, error.message);
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      res.status(401).json({ message: "Not authorized, token failed." });
    }
  } else {
    console.warn(`[Auth Protect] No authorization header for route ${req.originalUrl}`);
    res.status(401).json({ message: "No authorization header provided" });
  }
});

const admin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "moderator")
  ) {
    next();
  } else {
    res
      .status(401)
      .json({ message: "Not authorized as an admin or moderator" });
  }
};

export { admin };
export default protect;
