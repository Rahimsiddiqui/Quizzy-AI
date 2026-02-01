import express from "express";
import User from "../models/User.js";
import protect from "../middleware/auth.js";
import { TIER_LIMITS } from "../config/constants.js";
import { generateReceiptHTML, getTierPrice } from "../helpers/receiptHelper.js";

const router = express.Router();

// @route   POST /api/subscription/upgrade
// @desc    Upgrade Subscription
// @access  Private
router.post("/upgrade", protect, async (req, res) => {
  const { tier } = req.body;
  const newLimits = TIER_LIMITS[tier];

  if (!newLimits || tier === "free")
    return res.status(400).json({ message: "Invalid subscription tier." });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.tier = tier;
    user.limits.generationsRemaining = newLimits.monthlyGenerations;
    user.limits.flashcardGenerationsRemaining =
      newLimits.monthlyFlashcardGenerations;
    user.limits.pdfUploadsRemaining = newLimits.monthlyPdfUploads;
    user.limits.pdfExportsRemaining = newLimits.monthlyPdfExports;
    user.limits.maxQuestions = newLimits.maxQuestions;
    user.limits.maxMarks = newLimits.maxMarks;
    user.limits.lastReset = Date.now();

    await user.save();

    // Send receipt email to user
    try {
      const billingDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const nextBillingDate = new Date(
        new Date().setMonth(new Date().getMonth() + 1),
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const receiptHTML = generateReceiptHTML({
        userName: user.name || "Valued User",
        email: user.email,
        tier: tier === "Pro" ? "Pro" : "Basic",
        amount: getTierPrice(tier === "Pro" ? "Pro" : "Basic"),
        billingDate,
        nextBillingDate,
      });

      // Use the globally set transporter from app.locals
      await req.app.locals.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Payment Receipt - Qubli AI ${
          tier === "Pro" ? "Pro" : "Basic"
        } Subscription`,
        html: receiptHTML,
      });
    } catch (emailError) {
      console.error("Receipt email sending error:", emailError);
      // Don't fail the upgrade if email fails
    }

    res.status(200).json({
      message: `Successfully upgraded to ${tier} tier.`,
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error during upgrade." });
  }
});

// @route   POST /api/subscription/refund
// @desc    Request Refund
// @access  Private
router.post("/refund", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.tier === "Free") {
      return res
        .status(400)
        .json({ message: "Free tier users cannot request refunds." });
    }

    const previousTier = user.tier;
    const refundAmount = previousTier === "Pro" ? "$11.99" : "$4.99";

    // Reset user to Free tier
    const freeLimits = TIER_LIMITS["Free"];
    user.tier = "Free";
    user.limits = freeLimits;
    user.limits.lastReset = Date.now();
    await user.save();

    // Send refund confirmation email to user
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Refund Confirmation</h2>
            <p style="color: #666; line-height: 1.6;">Hi, ${
              user.name || "User"
            }!</p>
            
            <p style="color: #666; line-height: 1.6;">Thank you for using Qubli AI. Your refund request has been processed successfully.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;">
              <h3 style="color: #333; margin-top: 0;">Refund Details</h3>
              <p style="color: #666; margin: 8px 0;"><strong>Previous Plan:</strong> ${previousTier}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Refund Amount:</strong> ${refundAmount}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="color: #666; margin: 8px 0;"><strong>New Plan:</strong> Free Tier</p>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Free Tier Features</h3>
              <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
                <li>7 Quiz generation per day</li>
                <li>3 Flashcard sets per day</li>
                <li>Max 10 Questions per quiz</li>
                <li>Max 30 Marks per quiz</li>
                <li>3 PDF imports per day</li>
                <li>3 PDF exports per day</li>
                <li>Upload 1 PDF per quiz</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Best regards,<br>Qubli AI Team!</p>
          </div>
        </div>
      `;

      await req.app.locals.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Refund Confirmation - Qubli AI (${previousTier} → Free)`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the refund if email fails
    }

    res.status(200).json({
      message:
        "Refund request submitted. Your plan has been downgraded to Free tier. A confirmation email has been sent to your email address.",
      user: { ...user.toObject(), password: undefined },
    });
  } catch {
    res.status(500).json({ message: "Server error during refund request." });
  }
});

export default router;
