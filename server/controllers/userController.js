import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// @desc    Change Full Name
// @route   POST /api/auth/change-fullname
// @access  Private
export const changeFullName = asyncHandler(async (req, res) => {
  const { newFullName } = req.body;

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!newFullName || newFullName.trim() === "") {
    return res.status(400).json({ message: "Full name cannot be empty" });
  }

  if (newFullName.length < 6) {
    return res
      .status(400)
      .json({ message: "Full name must be at least 6 characters" });
  }

  // Prevent full name being identical to username
  if (user.username && newFullName === user.username) {
    return res
      .status(400)
      .json({ message: "Full name cannot be the same as username" });
  }

  // Check if full name already exists on another user
  const existing = await User.findOne({ name: newFullName }).lean();
  if (existing && String(existing._id) !== String(user._id)) {
    return res.status(400).json({ message: "Full name already taken" });
  }

  user.name = newFullName;
  await user.save();

  res.status(200).json({
    message: "Full name updated",
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
    },
  });
});

// @desc    Update Profile Picture
// @route   POST /api/auth/update-picture
// @access  Private
export const updateProfilePicture = async (req, res) => {
  const { picture } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Allow clearing the picture (set to null)
    if (picture === null || picture === "") {
      user.picture = null;
      await user.save();
      return res.status(200).json({
        message: "Profile picture removed",
        user: {
          id: user._id,
          name: user.name,
          picture: null,
        },
      });
    }

    // Validate base64 image or URL
    if (typeof picture !== "string") {
      return res.status(400).json({ message: "Invalid picture format" });
    }

    // Check if it's a base64 image
    if (picture.startsWith("data:image/")) {
      // Validate size (max 2MB for base64)
      const base64Size = (picture.length * 3) / 4;
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (base64Size > maxSize) {
        return res.status(400).json({
          message: "Image too large. Maximum size is 2MB.",
        });
      }

      // Validate image type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const mimeMatch = picture.match(/data:(image\/[a-z]+);base64,/);
      if (!mimeMatch || !validTypes.includes(mimeMatch[1])) {
        return res.status(400).json({
          message: "Invalid image type. Use JPEG, PNG, GIF, or WebP.",
        });
      }
    } else if (
      picture.startsWith("http://") ||
      picture.startsWith("https://")
    ) {
      if (picture.length > 2048) {
        return res.status(400).json({ message: "URL too long" });
      }
    } else {
      return res.status(400).json({ message: "Invalid picture format" });
    }

    user.picture = picture;
    await user.save();

    res.status(200).json({
      message: "Profile picture updated",
      user: {
        id: user._id,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error updating picture" });
  }
};

// @desc    Confirm Password
// @route   POST /api/auth/confirm-password
// @access  Private
export const confirmPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.trim() === "") {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const user = await User.findById(req.userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
      return res
        .status(400)
        .json({ message: "No password set for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.status(200).json({ message: "Password confirmed" });
  } catch {
    // Server error
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has set a password, verify current password
    // OAuth users with unset passwords don't need verification
    if (user.passwordIsUserSet) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter and one digit",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordIsUserSet = true; // Mark password as user-set
    await user.save();

    res.status(200).json({
      message: "Password changed successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
        passwordIsUserSet: user.passwordIsUserSet,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Check Username Availability
// @route   GET /api/auth/check-username
// @access  Public
export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Username is required" });
    }

    // Basic validation to short-circuit invalid usernames
    if (
      username.length < 6 ||
      /\s/.test(username) ||
      /[A-Z]/.test(username)
    ) {
      return res.status(200).json({ available: false });
    }

    const existing = await User.findOne({ username }).lean();
    if (existing) return res.status(200).json({ available: false });

    return res.status(200).json({ available: true });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Change Username
// @route   POST /api/auth/change-username
// @access  Private
export const changeUsername = async (req, res) => {
  const { newUsername } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate new username
    if (!newUsername || newUsername.trim() === "") {
      return res.status(400).json({ message: "Username cannot be empty" });
    }

    if (newUsername.length < 6) {
      return res
        .status(400)
        .json({ message: "Username must be at least 6 characters" });
    }

    // Check for spaces
    if (/\s/.test(newUsername)) {
      return res
        .status(400)
        .json({ message: "Username cannot contain spaces" });
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(newUsername)) {
      return res
        .status(400)
        .json({ message: "Username cannot contain uppercase letters" });
    }

    // Check if username is the same as current
    if (newUsername === user.username) {
      return res.status(400).json({
        message: "New username must be different from current username",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Prevent username matching full name
    if (newUsername === user.name) {
      return res
        .status(400)
        .json({ message: "Username cannot be the same as full name" });
    }

    user.username = newUsername;
    await user.save();

    res.status(200).json({
      message: "Username changed successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete Account
// @route   DELETE /api/auth/delete-account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user
    await User.findByIdAndDelete(req.userId);

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get Active Sessions
// @route   GET /api/auth/sessions
// @access  Private
export const getActiveSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId, "sessions").lean();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Return user's actual sessions
  const sessions = (user.sessions || []).map((session) => ({
    _id: session._id,
    id: session._id,
    deviceName: session.deviceName || "Unknown Device",
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    lastActive: session.lastActive,
    isCurrent: session.isCurrent || false,
  }));

  res.status(200).json({ sessions });
});

// @desc    Logout from specific session
// @route   DELETE /api/auth/sessions/:sessionId/logout
// @access  Private
export const logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the session from user's sessions array
    const originalLength = user.sessions?.length || 0;
    if (user.sessions && Array.isArray(user.sessions)) {
      user.sessions = user.sessions.filter(
        (session) => String(session._id) !== String(sessionId)
      );
      const newLength = user.sessions.length;

      // Only save if something was actually removed
      if (originalLength !== newLength) {
        await user.save();

        const currentSessionDeleted =
          String(sessionId) === String(req.sessionId);

        res.status(200).json({
          message: "Session logout successful",
          sessionsRemaining: newLength,
          currentSessionDeleted,
        });
      } else {
        res.status(404).json({ message: "Session not found" });
      }
    } else {
      res.status(200).json({
        message: "Session logout successful",
        sessionsRemaining: 0,
      });
    }
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear all sessions
    user.sessions = [];
    await user.save();

    res.status(200).json({
      message: "Logged out from all devices successfully",
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Link OAuth Account
// @route   POST /api/auth/oauth/link
// @access  Private
export const linkOAuth = async (req, res) => {
  const { provider } = req.body;
  
  // Logic not fully implemented in original route beyond validation
  // Keeping consistent with existing code which stopped here in snippets
  if (!["google", "github"].includes(provider)) {
    return res.status(400).json({ message: "Invalid OAuth provider" });
  }
  
  // Note: Full implementation depends on remaining logic in authRoutes
  res.status(501).json({ message: "Endpoint under construction" });
};
