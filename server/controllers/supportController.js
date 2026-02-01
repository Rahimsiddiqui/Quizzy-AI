import nodemailer from "nodemailer";
import asyncHandler from "express-async-handler";

// Helper to create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
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
};

// @desc    Submit feedback
// @route   POST /api/support/feedback
// @access  Public
export const submitFeedback = asyncHandler(async (req, res) => {
  const { feedback, email } = req.body;

  if (!email || email.trim().length === 0) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!feedback || feedback.trim().length === 0) {
    return res.status(400).json({ message: "Feedback cannot be empty" });
  }

  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">New Feedback from Qubli AI</h2>
        <p style="color: #666;"><strong>From:</strong> ${email}</p>
        <p style="color: #666;"><strong>Message:</strong></p>
        <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;">
          <p style="color: #333; margin: 0; white-space: pre-wrap;">${feedback}</p>
        </div>
        <p style="color: #999; text-align: center; font-size: 12px; margin-top: 20px;">
          This is an automated message from Qubli AI feedback form.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: "qubli.ai.app@gmail.com",
    replyTo: email,
    subject: `New Feedback from ${email}`,
    html: htmlContent,
  });

  res.status(200).json({
    message: "Feedback submitted successfully. Thank you!",
  });
});

// @desc    Submit Chatbot Feedback
// @route   POST /api/support/chatbot-feedback
// @access  Public
export const submitChatbotFeedback = asyncHandler(async (req, res) => {
  const {
    userEmail,
    feedbackType,
    selectedReasons,
    customMessage,
    chatbotResponse,
  } = req.body;

  if (!userEmail) {
    return res.status(400).json({ message: "User email is required" });
  }

  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; color: #1a202c; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: ${
        feedbackType === "good" ? "#ebf8ff" : "#fff5f5"
      }; padding: 24px; border-bottom: 4px solid ${
    feedbackType === "good" ? "#3182ce" : "#e53e3e"
  };">
        <h2 style="margin: 0; font-size: 24px; color: ${
          feedbackType === "good" ? "#2b6cb0" : "#c53030"
        }; text-transform: capitalize;">
          Chatbot Feedback: ${feedbackType}
        </h2>
        <p style="margin: 8px 0 0 0; color: #4a5568;">Received from <strong>${userEmail}</strong></p>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff;">
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Selected Reasons</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${selectedReasons
              .map(
                (reason) => `
              <span style="background-color: #edf2f7; color: #2d3748; padding: 6px 12px; border-radius: 20px; font-size: 14px; margin-right: 8px; margin-bottom: 8px; display: inline-block;">
                ${reason}
              </span>
            `
              )
              .join("")}
          </div>
        </div>

        ${
          customMessage
            ? `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Custom Message</h3>
          <div style="background-color: #f7fafc; padding: 16px; border-radius: 8px; font-style: italic; border-left: 4px solid #cbd5e0;">
            "${customMessage}"
          </div>
        </div>
        `
            : ""
        }

        <div style="margin-bottom: 8px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Chatbot Response</h3>
          <div style="background-color: #1a202c; color: #f7fafc; padding: 20px; border-radius: 8px; font-size: 14px; line-height: 1.6; max-height: 300px; overflow-y: auto;">
            ${chatbotResponse}
          </div>
        </div>
      </div>

      <div style="background-color: #f7fafc; padding: 16px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0;">
        Time: ${new Date().toLocaleString("en-US", {
          timeZone: "UTC",
        })} UTC | This feedback was submitted via Qubli AI Chatbot.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Qubli AI Feedback" <${process.env.EMAIL_USER}>`,
    to: "qubli.ai.app@gmail.com",
    subject: `Chatbot Feedback – ${userEmail} – ${
      feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)
    }`,
    html: htmlContent,
  });

  res.status(200).json({ message: "Feedback submitted successfully" });
});
