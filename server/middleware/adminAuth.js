import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Verify admin JWT token and check admin role
const adminProtect = asyncHandler(async (req, res, next) => {
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

      req.adminId = decoded.id;

      if (!decoded.sessionId) {
        return res.status(401).json({ message: "Session ID missing in token" });
      }
      req.sessionId = decoded.sessionId;

      // Verify user is admin
      const user = await User.findById(req.adminId);
      if (!user) {
        return res.status(401).json({ message: "Admin not found" });
      }

      if (user.role !== "admin" && user.role !== "moderator") {
        return res
          .status(403)
          .json({ message: "Access denied. Admin role required." });
      }

      if (user.banned || !user.active) {
        return res
          .status(403)
          .json({ message: "Admin account is disabled or banned" });
      }

      // Validate that the session is still active
      if (
        !user.sessions ||
        !Array.isArray(user.sessions) ||
        !user.sessions.some((s) => String(s._id) === String(req.sessionId))
      ) {
        return res.status(401).json({ message: "Session invalid or expired" });
      }

      req.admin = user;
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

// check if user is admin
const isAdminRole = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
  next();
});

export { adminProtect, isAdminRole };
