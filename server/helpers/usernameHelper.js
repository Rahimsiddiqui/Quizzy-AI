import crypto from "crypto";
import User from "../models/User.js";

/**
 * Generate a unique random username based on full name
 * @param {string} fullName - The user's full name
 * @returns {Promise<string>} - A unique username
 */
export const generateUniqueUsername = async (fullName) => {
  // 1. Normalize name: lowercase, remove non-alphanumeric
  let baseName = (fullName || "user").toLowerCase().replace(/[^a-z0-9]/g, "");

  // 2. Ensure base availability
  if (baseName.length < 3) {
    baseName = "user" + baseName;
  }

  // Cap base length to prevent overly long usernames
  if (baseName.length > 20) {
    baseName = baseName.substring(0, 20);
  }

  let username;
  let isUnique = false;
  let attempts = 0;
  const maxRetries = 10;

  // 3. Loop until unique
  while (!isUnique && attempts < maxRetries) {
    const suffix = crypto.randomInt(100000, 1000000);
    username = `${baseName}${suffix}`;

    // Check availability
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  // Fallback if still not unique after max retries (highly unlikely with 6 digits)
  if (!isUnique) {
    const shortBase = baseName.substring(0, 15);
    username = `${shortBase}${Date.now()}`;
  }

  return username;
};
