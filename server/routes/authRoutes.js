import express from "express";
const router = express.Router();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { TIER_LIMITS } from "../config/constants.js";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "../helpers/emailHelper.js";
import {
  exchangeCodeForToken,
  getOAuthUserInfo,
  findOrCreateOAuthUser,
} from "../helpers/oauthHelper.js";
import protect from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const defaultTier = "Free";
  const limits = TIER_LIMITS[defaultTier];

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpires = Date.now() + 30 * 60 * 1000; // 30 minutes from now

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      passwordIsUserSet: true, // User set their own password during signup
      tier: defaultTier,
      limits,
      isVerified: false,
      verificationCode,
      verificationCodeExpires: codeExpires,
    });

    // Send verification email in background (non-blocking)
    sendVerificationEmail(email, verificationCode).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    res.status(201).json({
      message:
        "Registration successful! Please check your email for the verification code.",
      userId: user._id,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first.",
        needsVerification: true,
        userId: user._id,
      });
    }

    // Check if user has a password to compare against
    if (!user.password) {
      return res.status(401).json({
        message:
          "This account was created with OAuth. Please sign in with Google or GitHub, or set a password in settings.",
        isOAuthAccount: true,
      });
    }

    // Compare password (works for both regular users and OAuth users with password)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Check if user has connected OAuth accounts
      if (user.connectedAccounts) {
        const connectedObj = user.connectedAccounts.toObject
          ? user.connectedAccounts.toObject()
          : user.connectedAccounts;
        const providers = Object.keys(connectedObj)
          .filter((key) => ["google", "github"].includes(key))
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" or ");

        if (providers) {
          return res.status(401).json({
            message: `Invalid credentials. You registered with ${providers}. Please use that instead or check your password.`,
          });
        }
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Track session - capture real IP and device info
    const userAgent = req.headers["user-agent"] || "";

    // Get real IP address - try multiple sources
    let ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    // Remove IPv6 prefix if present (::ffff:)
    if (ipAddress.includes("::")) {
      ipAddress = ipAddress.replace(/^.*:/, "") || "127.0.0.1";
    }

    // Fallback for localhost
    if (ipAddress === "-1" || !ipAddress) {
      ipAddress = "127.0.0.1";
    }

    // Extract browser/device info from user agent
    let deviceName = "";
    if (userAgent.includes("Windows NT 10")) deviceName = "Windows 10";
    else if (userAgent.includes("Windows NT 11")) deviceName = "Windows 11";
    else if (userAgent.includes("Windows")) deviceName = "Windows";
    else if (userAgent.includes("Macintosh")) deviceName = "Mac";
    else if (userAgent.includes("iPhone")) deviceName = "iPhone";
    else if (userAgent.includes("iPad")) deviceName = "iPad";
    else if (userAgent.includes("Android")) deviceName = "Android";
    else if (userAgent.includes("Linux")) deviceName = "Linux";
    else deviceName = "Unknown Device";

    // Extract browser info
    let browserInfo = "";
    if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) {
      const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
      browserInfo = chromeMatch ? `Chrome ${chromeMatch[1]}` : "Chrome";
    } else if (userAgent.includes("Firefox")) {
      const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
      browserInfo = firefoxMatch ? `Firefox ${firefoxMatch[1]}` : "Firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browserInfo = "Safari";
    } else if (userAgent.includes("Edge")) {
      const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);
      browserInfo = edgeMatch ? `Edge ${edgeMatch[1]}` : "Edge";
    }

    const displayDeviceName = browserInfo
      ? `${deviceName} - ${browserInfo}`
      : deviceName;

    // Add new session
    user.sessions = user.sessions || [];
    const newSession = {
      deviceName: displayDeviceName,
      userAgent,
      ipAddress,
      lastActive: new Date(),
      isCurrent: true,
      createdAt: new Date(),
    };
    user.sessions.push(newSession);

    // Mark old sessions as not current
    user.sessions.forEach((session, idx) => {
      session.isCurrent = idx === user.sessions.length - 1;
    });

    console.log(
      `New session created for user ${user._id}: ${displayDeviceName} (${ipAddress})`
    );

    await user.save();

    // Sign token with session id so per-session logout can be enforced
    const sessionId = user.sessions[user.sessions.length - 1]._id;
    const token = jwt.sign({ id: user._id, sessionId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
        connectedAccounts: user.connectedAccounts,
        passwordIsUserSet: user.passwordIsUserSet,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Verify email with code
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (Date.now() > user.verificationCodeExpires) {
      return res.status(400).json({
        message: "Verification code expired. Please register again.",
        codeExpired: true,
      });
    }

    // Check if code is correct
    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Create a session for this verification flow and sign a token with sessionId
    const userAgent = req.headers["user-agent"] || "";
    let ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    // Remove IPv6 prefix if present
    if (ipAddress.includes("::")) {
      ipAddress = ipAddress.replace(/^.*:/, "") || "127.0.0.1";
    }

    // Fallback for localhost
    if (ipAddress === "-1" || !ipAddress) {
      ipAddress = "127.0.0.1";
    }

    user.sessions = user.sessions || [];
    user.sessions.push({
      deviceName: userAgent.split(" ")[0] || "Unknown Device",
      userAgent,
      ipAddress,
      lastActive: new Date(),
      isCurrent: true,
      createdAt: new Date(),
    });

    // Mark old sessions as not current
    user.sessions.forEach((session, idx) => {
      session.isCurrent = idx === user.sessions.length - 1;
    });

    await user.save();

    const sessionId = user.sessions[user.sessions.length - 1]._id;
    const token = jwt.sign({ id: user._id, sessionId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Email verified successfully!",
      token,
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Resend verification code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const codeExpires = Date.now() + 30 * 60 * 1000;

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = codeExpires;
    await user.save();

    // Send new code in background (non-blocking)
    sendVerificationEmail(email, verificationCode).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    res.status(200).json({
      message: "Verification code sent to your email",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.post("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.userId);
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete account
router.delete("/delete-account", protect, async (req, res) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active sessions (mock - in production, you'd track actual sessions)
router.get("/sessions", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout from specific session
router.delete("/sessions/:sessionId/logout", protect, async (req, res) => {
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
        console.log(
          `Session ${sessionId} removed for user ${user._id}. Sessions remaining: ${newLength}`
        );

        const currentSessionDeleted =
          String(sessionId) === String(req.sessionId);

        res.status(200).json({
          message: "Session logout successful",
          sessionsRemaining: newLength,
          currentSessionDeleted,
        });
      } else {
        console.warn(`Session ${sessionId} not found for user ${user._id}`);
        res.status(404).json({ message: "Session not found" });
      }
    } else {
      res.status(200).json({
        message: "Session logout successful",
        sessionsRemaining: 0,
      });
    }
  } catch (err) {
    console.error("Session logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout from all devices
router.post("/logout-all", protect, async (req, res) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Setup 2FA
router.post("/2fa/setup", protect, async (req, res) => {
  const { method } = req.body; // 'totp' or 'sms'

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!["totp", "sms"].includes(method)) {
      return res.status(400).json({ message: "Invalid 2FA method" });
    }

    // Mock 2FA setup - in production, generate TOTP secret or send SMS verification
    const setupData = {
      method,
      status: "pending",
      message: `2FA setup via ${method.toUpperCase()} initiated. Follow the instructions to complete setup.`,
    };

    res.status(200).json(setupData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// OAuth callback handler
router.post("/oauth/callback", async (req, res) => {
  const { provider, code, redirectUri } = req.body;

  try {
    // Validate provider
    if (!["google", "github"].includes(provider)) {
      return res.status(400).json({ message: "Invalid OAuth provider" });
    }

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(provider, code, redirectUri);

    const oauthUser = await getOAuthUserInfo(provider, accessToken);

    // Find or create user (this also links OAuth accounts)
    const user = await findOrCreateOAuthUser(User, oauthUser);

    // Refresh user to get latest data
    const updatedUser = await User.findById(user._id);

    // Track session
    const userAgent = req.headers["user-agent"] || "Unknown";
    let ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    // Remove IPv6 prefix if present
    if (ipAddress.includes("::")) {
      ipAddress = ipAddress.replace(/^.*:/, "") || "127.0.0.1";
    }

    // Fallback for localhost
    if (ipAddress === "-1" || !ipAddress) {
      ipAddress = "127.0.0.1";
    }

    // Extract browser/device info from user agent
    let deviceName = "Unknown Device";
    if (userAgent.includes("Windows")) deviceName = "Windows Device";
    else if (userAgent.includes("Mac")) deviceName = "Mac Device";
    else if (userAgent.includes("iPhone")) deviceName = "iPhone";
    else if (userAgent.includes("Android")) deviceName = "Android Device";
    else if (userAgent.includes("Linux")) deviceName = "Linux Device";

    // Add new session
    updatedUser.sessions = updatedUser.sessions || [];
    updatedUser.sessions.push({
      deviceName,
      userAgent,
      ipAddress,
      lastActive: new Date(),
      isCurrent: true,
    });

    // Mark old sessions as not current
    updatedUser.sessions.forEach((session, idx) => {
      if (idx !== updatedUser.sessions.length - 1) {
        session.isCurrent = false;
      }
    });

    await updatedUser.save();

    // Sign token with session id
    const sessionId = updatedUser.sessions[updatedUser.sessions.length - 1]._id;
    const token = jwt.sign({ id: updatedUser._id, sessionId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "OAuth authentication successful",
      token,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        tier: updatedUser.tier,
        stats: updatedUser.stats,
        limits: updatedUser.limits,
        connectedAccounts: updatedUser.connectedAccounts,
        passwordIsUserSet: updatedUser.passwordIsUserSet,
      },
    });
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.status(500).json({
      message: "OAuth authentication failed",
      error: err.message,
    });
  }
});

// Link OAuth account to existing user
router.post("/oauth/link", protect, async (req, res) => {
  const { provider, code, redirectUri } = req.body;

  try {
    if (!["google", "github"].includes(provider)) {
      return res.status(400).json({ message: "Invalid OAuth provider" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(provider, code, redirectUri);

    // Get user info from OAuth provider
    const oauthUserData = await getOAuthUserInfo(provider, accessToken);

    // Link OAuth account
    if (!user.connectedAccounts) {
      user.connectedAccounts = {};
    }

    user.connectedAccounts[provider] = {
      id: oauthUserData.providerId,
      email: oauthUserData.email,
      connectedAt: new Date(),
    };

    await user.save();

    res.status(200).json({
      message: `${provider} account linked successfully`,
      user: {
        id: user._id,
        email: user.email,
        connectedAccounts: user.connectedAccounts,
        passwordIsUserSet: user.passwordIsUserSet,
      },
    });
  } catch (err) {
    console.error("OAuth link error:", err);
    res
      .status(500)
      .json({ message: "Failed to link OAuth account", error: err.message });
  }
});

// Disconnect OAuth account
router.delete("/oauth/disconnect/:provider", protect, async (req, res) => {
  const { provider } = req.params;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.connectedAccounts && user.connectedAccounts[provider]) {
      delete user.connectedAccounts[provider];
      await user.save();

      res.status(200).json({
        message: `${provider} account disconnected successfully`,
      });
    } else {
      res.status(404).json({ message: "OAuth account not connected" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
