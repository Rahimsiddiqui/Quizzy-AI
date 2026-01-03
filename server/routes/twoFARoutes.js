import express from "express";
import protect from "../middleware/auth.js";
import User from "../models/User.js";
import {
  initiate2FA,
  verify2FAToken,
  generateBackupCodes,
  useBackupCode,
} from "../helpers/twoFAHelper.js";

const router = express.Router();

router.get("/initiate", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.twoFAEnabled) {
      return res
        .status(400)
        .json({ message: "2FA is already enabled for this account" });
    }

    // Generate 2FA setup data
    const setup = await initiate2FA(user.email);

    res.status(200).json({
      message: "2FA setup initiated",
      secret: setup.secret,
      qrCode: setup.qrCode,
      manualEntryKey: setup.manualEntryKey,
    });
  } catch (err) {
    // Server error
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/enable", protect, async (req, res) => {
  try {
    const { token, secret } = req.body;

    if (!token || !secret) {
      return res.status(400).json({
        message: "Token and secret are required",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.twoFAEnabled) {
      return res
        .status(400)
        .json({ message: "2FA is already enabled for this account" });
    }

    // Verify the TOTP token
    const isValid = verify2FAToken(secret, token);
    if (!isValid) {
      return res.status(400).json({
        message: "Invalid verification code. Please try again.",
      });
    }

    const backupCodes = generateBackupCodes(10);

    user.twoFAEnabled = true;
    user.twoFAMethod = "totp";
    user.twoFASecret = secret;
    user.twoFABackupCodes = backupCodes;

    await user.save();

    res.status(200).json({
      message: "2FA enabled successfully",
      backupCodes: backupCodes,
      warningMessage:
        "Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.",
    });
  } catch (err) {
    // Server error
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify", protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.twoFAEnabled) {
      return res
        .status(400)
        .json({ message: "2FA is not enabled for this account" });
    }

    // Try regular TOTP token
    let isValid = verify2FAToken(user.twoFASecret, token);

    // If not valid, try backup code
    if (!isValid) {
      isValid = useBackupCode(user.twoFABackupCodes, token);
      if (isValid) {
        await user.save();
      }
    }

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid verification code. Please try again.",
      });
    }

    res.status(200).json({
      message: "2FA token verified",
      verified: true,
    });
  } catch (err) {
    // Server error
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/disable", protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to disable 2FA" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.twoFAEnabled) {
      return res
        .status(400)
        .json({ message: "2FA is not enabled for this account" });
    }

    if (!user.password) {
      const bcryptjs = await import("bcryptjs");
      const isMatch = await bcryptjs.default.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    user.twoFAEnabled = false;
    user.twoFAMethod = "none";
    user.twoFASecret = null;
    user.twoFAPhone = null;
    user.twoFABackupCodes = [];

    await user.save();

    res.status(200).json({
      message: "2FA disabled successfully",
    });
  } catch (err) {
    // Server error
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      twoFAEnabled: user.twoFAEnabled,
      twoFAMethod: user.twoFAMethod,
      backupCodesCount: user.twoFABackupCodes.length,
    });
  } catch (err) {
    // Server error
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
