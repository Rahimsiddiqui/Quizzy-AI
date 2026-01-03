import mongoose from "mongoose";
import LimitsSchema from "./Limits.js";

const UserSchema = new mongoose.Schema(
  {
    // `name` is the user's full name (display name)
    // Enforce uniqueness on full name per new requirement
    name: { type: String, required: true, unique: true, sparse: true },
    // `username` is a separate unique handle for login/mentions etc.
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Make optional for OAuth users
    passwordIsUserSet: { type: Boolean, default: false }, // Track if password was set by user or OAuth
    picture: { type: String }, // Profile picture URL
    tier: {
      type: String,
      enum: ["Free", "Basic", "Pro"],
      default: "Free",
    },

    // Admin fields
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    active: { type: Boolean, default: true },
    banned: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },

    // Account status history - track ban/disable events
    statusHistory: [
      {
        action: {
          type: String,
          enum: ["disabled", "enabled", "banned", "unbanned"],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String, default: null },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],

    // Email verification fields
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Number, default: null },

    // OAuth connected accounts
    connectedAccounts: {
      type: Map,
      of: {
        id: String,
        email: String,
        connectedAt: Date,
      },
      default: {},
    },

    // Two-Factor Authentication
    twoFAEnabled: { type: Boolean, default: false },
    twoFAMethod: {
      type: String,
      enum: ["totp", "sms", "none"],
      default: "none",
    }, // totp or sms
    twoFASecret: { type: String, default: null }, // Encrypted secret for TOTP
    twoFAPhone: { type: String, default: null }, // Phone number for SMS
    twoFABackupCodes: [{ type: String }], // Backup codes in case of lost device

    // Sessions
    sessions: [
      {
        deviceName: String,
        userAgent: String,
        ipAddress: String,
        lastActive: { type: Date, default: Date.now },
        isCurrent: { type: Boolean, default: false },
      },
    ],

    // Embed the Limits Schema
    limits: { type: LimitsSchema, required: true, default: {} },

    stats: {
      quizzesTaken: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      streakDays: { type: Number, default: 0 },
      lastActive: { type: Number, default: Date.now },
    },

    // Gamification: EXP and Level System
    exp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    totalExpEarned: { type: Number, default: 0 }, // Track cumulative EXP for stats
    quizzesCreated: { type: Number, default: 0 },
    flashcardsCreated: { type: Number, default: 0 },
    perfectScores: { type: Number, default: 0 },
    pdfsUploaded: { type: Number, default: 0 },
    pdfsExported: { type: Number, default: 0 },

    // Achievements
    achievements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        icon: { type: String }, // emoji or icon identifier
        unlockedAt: { type: Date, default: Date.now },
        rarity: {
          type: String,
          enum: ["common", "rare", "epic", "legendary"],
          default: "common",
        },
      },
    ],

    // Leaderboard tracking
    leaderboardLastReset: { type: Date, default: Date.now }, // For weekly/monthly resets
    weeklyExp: { type: Number, default: 0 },
    monthlyExp: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
