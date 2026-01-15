import express from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import protect from "../middleware/auth.js";

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// @route   POST /api/upload
// @desc    Upload base64 image
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

    const type = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, "base64");

    // Security: Validate File Signature (Magic Numbers)
    const getFileType = (buf) => {
      const arr = new Uint8Array(buf).subarray(0, 4);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }

      if (header.startsWith("89504e47")) return "png";
      if (header.startsWith("ffd8ff")) return "jpg";
      if (header.startsWith("47494638")) return "gif";
      if (header.startsWith("524946")) return "webp"; // RIFF
      return null;
    };

    const detectedType = getFileType(buffer);
    if (!detectedType) {
      return res
        .status(400)
        .json({
          message:
            "Invalid file type. Only PNG, JPG, GIF, and WebP are allowed.",
        });
    }

    const filename = `${uuidv4()}.${detectedType}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Write file
    fs.writeFileSync(filePath, buffer);

    // Return public URL
    const publicUrl = `${
      process.env.API_URL || "http://localhost:5000"
    }/uploads/${filename}`;

    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error during upload" });
  }
});

export default router;
