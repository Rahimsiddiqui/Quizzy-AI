import nodemailer from "nodemailer";
import crypto from "crypto";

// Singleton transporter instance
let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000,
  });

  return transporter;
};

// Generate a 6-digit random code securely
export const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code) => {
  try {
    const transport = createTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
          <p style="color: #666; text-align: center; font-size: 16px;">
            Your verification code is:
          </p>
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; letter-spacing: 5px; margin: 0; font-size: 32px;">
              ${code}
            </h1>
          </div>
          <p style="color: #666; text-align: center;">
            This code will expire in 30 minutes.
          </p>
          <p style="color: #999; text-align: center; font-size: 12px;">
            If you didn't sign up for Qubli AI, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await transport.sendMail({
      from: `"Qubli AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Qubli AI - Verify Your Email",
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};
