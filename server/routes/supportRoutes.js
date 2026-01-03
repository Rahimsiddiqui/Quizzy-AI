import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
const router = express.Router();

// Submit feedback (allow unauthenticated submissions, send email to admin)
router.post("/feedback", async (req, res) => {
  const { feedback, email } = req.body;

  try {
    if (!email || email.trim().length === 0) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ message: "Feedback cannot be empty" });
    }

    // Send email to admin
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333;">New Feedback from Quizzy AI</h2>
          <p style="color: #666;"><strong>From:</strong> ${email}</p>
          <p style="color: #666;"><strong>Message:</strong></p>
          <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;">
            <p style="color: #333; margin: 0; white-space: pre-wrap;">${feedback}</p>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px; margin-top: 20px;">
            This is an automated message from Quizzy AI feedback form.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "rahimsiddiqui122@gmail.com",
      replyTo: email,
      subject: `New Feedback from ${email}`,
      html: htmlContent,
    });

    res.status(200).json({
      message: "Feedback submitted successfully. Thank you!",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
