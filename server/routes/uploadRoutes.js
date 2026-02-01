import express from "express";
import protect from "../middleware/auth.js";

const router = express.Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

// @route   POST /api/upload
// @desc    Upload base64 image (Returns base64, no disk storage)
// @access  Private (Admin only)
router.post("/", protect, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "No image provided" });
    }

    // Check if it's a base64 string
    const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    const data = matches[2];
    const buffer = Buffer.from(data, "base64");

    // Security: Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      });
    }

    // Security: Validate File Signature (Magic Numbers)
    const getFileType = (buf) => {
      const arr = new Uint8Array(buf).subarray(0, 12);
      let header = "";
      for (let i = 0; i < Math.min(arr.length, 8); i++) {
        header += arr[i].toString(16).padStart(2, "0");
      }

      // Traditional formats
      if (header.startsWith("89504e47")) return "png";
      if (header.startsWith("ffd8ff")) return "jpg";
      if (header.startsWith("47494638")) return "gif";
      if (header.startsWith("524946")) return "webp";

      // AVIF: check for 'ftypavif' at offset 4
      const ftyp = buf.toString("ascii", 4, 12);
      if (ftyp === "ftypavif") return "avif";

      return null;
    };

    const detectedType = getFileType(buffer);
    if (!detectedType) {
      return res.status(400).json({
        message: "Invalid file type. Only PNG, JPG, GIF, WebP, and AVIF are allowed.",
      });
    }

    // Refinement: No disk writing, no folder creation.
    // Return the original base64 directly so it can be previewed/saved in DB
    res.status(200).json({ url: image });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error during upload" });
  }
});

export default router;
