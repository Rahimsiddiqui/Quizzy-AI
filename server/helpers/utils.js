/**
 * Utility functions for server-side logic
 */

/**
 * Escape special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} Escaped string safe for regex
 */
export const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

/**
 * Set up Server-Sent Events (SSE) headers
 * @param {Object} res - Express response object
 */
export const setupSSE = (res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
};

/**
 * Send an SSE message
 * @param {Object} res - Express response object
 * @param {string} type - Message type (progress, complete, error)
 * @param {Object} data - Data to send
 */
export const streamResponse = (res, type, data) => {
  try {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  } catch (err) {
    console.error("Error writing SSE response:", err);
  }
};

/**
 * Handle SSE errors
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
export const handleStreamError = (res, error) => {
  console.error("Stream error:", error);
  streamResponse(res, "error", {
    message: error.message || "Internal server error",
  });
  res.end();
};
