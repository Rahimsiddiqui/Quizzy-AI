import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true }, // Markdown content
    image: { type: String, required: true }, // URL to featured image
    tags: [{ type: String }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    views: { type: Number, default: 0 },
    readTime: { type: String, default: "5 min read" },
  },
  { timestamps: true }
);

// Index for getting latest published blogs efficiently
BlogSchema.index({ isPublished: 1, publishedAt: -1 });

const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;
