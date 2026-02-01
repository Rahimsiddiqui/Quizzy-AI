import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { TIER_LIMITS } from "../config/constants.js";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "../helpers/emailHelper.js";
import { createSession } from "../helpers/sessionHelper.js";
import {
  exchangeCodeForToken,
  getOAuthUserInfo,
  findOrCreateOAuthUser,
} from "../helpers/oauthHelper.js";
import { generateUniqueUsername } from "../helpers/usernameHelper.js";
import { mergeDuplicateUsers } from "../helpers/mergeUsers.js";

const JWT_SECRET = process.env.JWT_SECRET;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const defaultTier = "Free";
  const limits = TIER_LIMITS[defaultTier];

  const normalizedEmail = email.toLowerCase().trim();

  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(400).json({ message: "User already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification code
  const verificationCode = generateVerificationCode();
  const codeExpires = Date.now() + 30 * 60 * 1000; // 30 minutes from now

  // Generate random unique username
  const username = await generateUniqueUsername(name);

  const user = await User.create({
    name,
    username,
    email: normalizedEmail,
    picture: null, // Explicitly null to trigger auto-generated avatar
    password: hashedPassword,
    passwordIsUserSet: true, // User set their own password during signup
    tier: defaultTier,
    limits,
    isVerified: false,
    verificationCode,
    verificationCodeExpires: codeExpires,
  });

  // Emit real-time event for new user signup (for admin dashboard)
  if (req.app.locals.io) {
    req.app.locals.io.emit("newUserSignup", {
      userId: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  }

  // Send verification email in background (non-blocking)
  sendVerificationEmail(email, verificationCode).catch(() => {});

  res.status(201).json({
    message:
      "Registration successful! Please check your email for the verification code.",
    userId: user._id,
    email: user.email,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password"
  );
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

  // Create new session via helper
  const session = createSession(req, user);

  await user.save();

  // Trigger merge of duplicates (if any) in background
  mergeDuplicateUsers().catch(console.error);

  // Sign token with session id so per-session logout can be enforced
  const sessionId = session._id;
  const token = jwt.sign({ id: user._id, sessionId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.status(200).json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      tier: user.tier,
      stats: user.stats,
      limits: user.limits,
      connectedAccounts: user.connectedAccounts,
      passwordIsUserSet: user.passwordIsUserSet,
    },
  });
});

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+verificationCode +verificationCodeExpires"
  );

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

  // Create new session via helper
  const session = createSession(req, user);

  await user.save();

  const sessionId = session._id;
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
      picture: user.picture,
      tier: user.tier,
      stats: user.stats,
      limits: user.limits,
      passwordIsUserSet: user.passwordIsUserSet,
    },
  });
});

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });

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
    sendVerificationEmail(email, verificationCode).catch(() => {});

    res.status(200).json({
      message: "Verification code sent to your email",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    OAuth Callback Handler
// @route   POST /api/auth/oauth/callback
// @access  Public
export const oauthCallback = async (req, res) => {
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

    // Create new session via helper
    const session = createSession(req, updatedUser);

    await updatedUser.save();

    // Trigger merge of duplicates (if any) in background
    mergeDuplicateUsers().catch(console.error);

    // Refresh user to get latest data (in case merge happened)
    const finalUser = await User.findById(updatedUser._id);
    const useUser = finalUser || updatedUser;

    // Sign token with session id
    const sessionId = session._id;
    const token = jwt.sign({ id: useUser._id, sessionId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "OAuth authentication successful",
      token,
      user: {
        id: useUser._id,
        email: useUser.email,
        name: useUser.name,
        picture: useUser.picture,
        tier: useUser.tier,
        stats: useUser.stats,
        limits: useUser.limits,
        connectedAccounts: useUser.connectedAccounts,
        passwordIsUserSet: useUser.passwordIsUserSet,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "OAuth authentication failed",
      error: err.message,
    });
  }
};

// @desc    Initialize 2FA Setup
// @route   POST /api/auth/2fa/setup
// @access  Private
export const setup2FA = async (req, res) => {
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
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
