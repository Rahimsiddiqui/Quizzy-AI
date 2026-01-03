import nodemailer from "nodemailer";

// Generate a 6-digit random code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code) => {
  try {
    // Create transporter with explicit host settings for Gmail
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // Use TLS instead of SSL
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 10000, // 10 seconds
      socketTimeout: 10000,
    });

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

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Qubli AI - Verify Your Email",
      html: htmlContent,
    });

    return true;
  } catch (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};
