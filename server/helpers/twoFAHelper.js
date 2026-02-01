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

    const qrCode = QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      manualEntryKey: secret.base32,
    };
  } catch {
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
  } catch {
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

// Helper to ensure key is 32 bytes
const getKey = (key) => crypto.createHash("sha256").update(key).digest();

// Encrypt secret for storage (securely with IV)
export function encryptSecret(secret, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getKey(key), iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Return IV and encrypted data separated by colon
  return iv.toString("hex") + ":" + encrypted;
}

// Decrypt secret for use
export function decryptSecret(encryptedSecret, key) {
  const textParts = encryptedSecret.split(":");
  if (textParts.length < 2) { 
     throw new Error("Invalid encrypted secret format. Missing IV.");
  }

  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = textParts.join(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", getKey(key), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
