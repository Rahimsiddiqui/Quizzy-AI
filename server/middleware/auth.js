import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

const JWT_SECRET = process.env.JWT_SECRET;

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
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Auto-fix invalid tier values (migrate from old "Admin" tier)
      const validTiers = ["Free", "Basic", "Pro"];
      if (!validTiers.includes(user.tier)) {
        user.tier = "Free";
        await user.save();
      }

      // CHECK: User is banned or disabled - FORCE LOGOUT immediately
      if (user.banned) {
        return res.status(403).json({
          message: "Your account has been banned",
          banned: true,
        });
      }

      if (!user.active) {
        return res.status(403).json({
          message:
            "Your account has been temporarily disabled. For help restoring access, please reach out to our support team at rahimsiddiqui122@gmail.com",
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
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      res.status(401).json({ message: "Not authorized, token failed." });
    }
  } else {
    res.status(401).json({ message: "No authorization header provided" });
  }
});

export default protect;
