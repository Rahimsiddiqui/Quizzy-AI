import Blog from "../models/Blog.js";
import asyncHandler from "express-async-handler";

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public (published only)
export const getAllBlogs = asyncHandler(async (_, res) => {
  const query = { isPublished: true };
  const blogs = await Blog.find(query)
    .populate("author", "name picture")
    .sort({ publishedAt: -1 })
    .lean();

  res.status(200).json(blogs);
});

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlogBySlug = asyncHandler(async (req, res) => {
  let blog = await Blog.findOne({ slug: req.params.slug }).populate(
    "author",
    "name picture"
  );

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  // Real View Tracking System (Cookie-based, 1 hour expiry)
  const cookieName = `viewed_blog_${blog._id}`;
  const cookies =
    req.headers.cookie?.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      acc[key] = val;
      return acc;
    }, {}) || {};

  if (!cookies[cookieName]) {
    // Atomic increment
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
    
    // Update local object to reflect change in response
    blog.views += 1;

    // Set cookie for 1 hour
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=true; Max-Age=3600; HttpOnly; Path=/; SameSite=Lax`
    );
  }

  res.status(200).json(blog);
});

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, image, tags, isPublished } = req.body;

  const existingBlog = await Blog.findOne({ slug }).lean();
  if (existingBlog) {
    return res
      .status(400)
      .json({ message: "Blog with this slug already exists" });
  }

  const blog = new Blog({
    title,
    slug,
    excerpt,
    content,
    image,
    tags,
    isPublished,
    publishedAt: isPublished ? Date.now() : null,
    author: req.userId,
  });

  const createdBlog = await blog.save();
  res.status(201).json(createdBlog);
});

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
export const updateBlog = asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, image, tags, isPublished } = req.body;

  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  // Check for slug collision if slug is being updated
  if (slug && slug !== blog.slug) {
    const slugExists = await Blog.findOne({ slug });
    if (slugExists) {
      return res.status(400).json({ message: "Blog with this slug already exists" });
    }
  }

  blog.title = title || blog.title;
  blog.slug = slug || blog.slug;
  blog.excerpt = excerpt || blog.excerpt;
  blog.content = content || blog.content;
  blog.image = image || blog.image;
  blog.tags = tags || blog.tags;

  // Handle publishing date logic
  if (isPublished !== undefined) {
    if (isPublished && !blog.isPublished) {
      blog.publishedAt = Date.now(); // Newly published
    }
    blog.isPublished = isPublished;
  }

  await blog.save();
  const updatedBlog = await Blog.findById(blog._id)
    .populate("author", "name picture")
    .lean();
  res.status(200).json(updatedBlog);
});

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  await blog.deleteOne();
  res.status(200).json({ message: "Blog removed" });
});

// @desc    Get all blogs (Admin view - includes drafts)
// @route   GET /api/blogs/admin/all
// @access  Private/Admin
export const getAdminBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({})
    .populate("author", "name picture")
    .sort({ views: -1, createdAt: -1 })
    .lean();

  res.status(200).json(blogs);
});
