import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

// Initialize 2FA secret and generate QR code
export async function initiate2FA(userEmail) {
  try {
    const secret = speakeasy.generateSecret({
      name: `Qubli AI (${userEmail})`,
      issuer: "Qubli AI",
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      manualEntryKey: secret.base32,
    };
  } catch (error) {
    throw new Error("Failed to initiate 2FA setup");
  }
}

// Verify TOTP token
export function verify2FAToken(secret, token) {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 time steps window for clock skew
    });

    return verified;
  } catch (error) {
    return false;
  }
}

// Generate backup codes
export function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate random 8-character codes
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Verify backup code and remove it
export function useBackupCode(backupCodes, code) {
  const index = backupCodes.findIndex((c) => c === code.toUpperCase().trim());
  if (index !== -1) {
    backupCodes.splice(index, 1);
    return true;
  }
  return false;
}

// Encrypt secret for storage (optional - for extra security)
export function encryptSecret(secret, key) {
  const cipher = crypto.createCipher("aes-256-cbc", key);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Decrypt secret for use
export function decryptSecret(encryptedSecret, key) {
  const decipher = crypto.createDecipher("aes-256-cbc", key);
  let decrypted = decipher.update(encryptedSecret, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
