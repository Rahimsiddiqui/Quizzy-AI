import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Save,
  Eye,
  FileText,
  Edit,
  Calendar,
  Image as ImageIcon,
  Tag,
  Link as LinkIcon,
  ChevronLeft,
  List,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Visibility from "@mui/icons-material/Visibility";
import blogService from "../../services/blogService";
import { uploadImage } from "../../services/adminService";
import { toast } from "react-toastify";

const BlogEditor = ({ blog, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    tags: "",
    isPublished: false,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toc, setToc] = useState([]);
  const [activeId, setActiveId] = useState("");
  const fileInputRef = useRef(null);

  // TOC Extraction Logic
  useEffect(() => {
    if (previewMode && formData.content) {
      const lines = formData.content.split(/\r?\n/);
      const tocItems = [];
      let currentHeaderLevel = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if it's a header
        const headerMatch = trimmedLine.match(/^(#+)\s*(.*)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          if (level > 6) continue;
          
          let text = headerMatch[2].trim().replace(/[*_~`]/g, "");
          if (!text) continue;
          
          const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/^-+|-+$/g, "");
          tocItems.push({ level, text, id, isClickable: true });
          currentHeaderLevel = level;
          continue;
        }
        
        const bulletMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
        if (bulletMatch && currentHeaderLevel > 0) {
          let text = bulletMatch[1].trim();
          const boldMatch = text.match(/^\*\*(.+?)\*\*/);
          if (boldMatch) {
            text = boldMatch[1].replace(/:$/, ""); // Remove trailing colon
          } else {
            text = text.replace(/[*_~`]/g, "").split(/[:.]/)[0].trim();
          }
          
          if (text && text.length > 2 && text.length < 60) {
            tocItems.push({ 
              level: currentHeaderLevel + 1, 
              text, 
              id: null,
              isClickable: false 
            });
          }
        }
      }
      
      setToc(tocItems);
    }
  }, [previewMode, formData.content]);

  // Scroll Spy for Preview
  useEffect(() => {
    if (!previewMode || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-80px 0% -70% 0%",
        threshold: 0,
      }
    );

    toc.forEach((heading) => {
      if (heading.id && heading.isClickable) {
        const element = document.getElementById(heading.id);
        if (element) observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [previewMode, toc]);

  // Heading sync helper
  const MarkdownHeading = ({ level, children, ...props }) => {
    const getText = (node) => {
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(getText).join("");
      if (node?.props?.children) return getText(node.props.children);
      return "";
    };
    const text = getText(children);
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");
    const Tag = `h${level}`;
    return (
      <Tag id={id} className="scroll-mt-32" {...props}>
        {children}
      </Tag>
    );
  };

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || "",
        slug: blog.slug || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
        image: blog.image || "",
        tags: blog.tags ? blog.tags.join(", ") : "",
        isPublished: blog.isPublished || false,
      });
    }
  }, [blog]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSlugGen = () => {
    if (!formData.title) return;
    const generatedSlug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    toast.info("Slug generated from title");
    setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    toast.info("Slug generated from title");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setLoading(true);
        const base64 = reader.result;
        const res = await uploadImage(base64);
        setFormData((prev) => ({ ...prev, image: res.url }));
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((t) => t),
      };

      if (blog && blog._id) {
        await blogService.updateBlog(blog._id, dataToSubmit);
        toast.success("Blog updated successfully");
      } else {
        await blogService.createBlog(dataToSubmit);
        toast.success("Blog created successfully");
      }
      onSave(); // Refresh list
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error saving blog");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-background w-full max-w-[1100px] h-full sm:h-[95vh] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-border/40 animate-scale-in">
        {/* Sticky Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-surfaceHighlight dark:bg-gray-800 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-textMuted transition-colors point"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <span className="text-sm font-bold text-textMain hidden sm:block">
              {blog ? "Edit Post" : "New Blog"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all point bg-surfaceHighlight hover:bg-surfaceHighlight/90 dark:bg-surface/80 dark:hover:bg-surface/90 text-textMain dark:text-textMain/95"
            >
              {previewMode ? <Edit size={14} /> : <Eye size={14} />}
              <span>{previewMode ? "Continue Editing" : "Preview Mode"}</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>{blog ? "Save Changes" : "Publish"}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-slate-900/10">
          <div className="max-w-[850px] mx-auto py-12 px-6 sm:px-12">
            {previewMode ? (
              /*  Preview Mode */
              <div className="animate-fade-in min-h-screen">
                <div className="max-w-4xl mx-auto px-4 mb-12">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-primary dark:text-blue-500 font-semibold mb-4">
                    {formData.tags &&
                      formData.tags.split(",").map((tag) => (
                        <span
                          key={tag}
                          className="bg-primary/10 dark:bg-blue-800/15 px-3 py-1 rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    <span className="text-textMuted font-normal flex items-center gap-1">
                      <Calendar size={14} /> {new Date().toLocaleDateString()}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-bold text-textMain dark:text-textMain/95 leading-tight mb-6">
                    {formData.title || "Untitled Masterpiece"}
                  </h1>

                  <div className="flex items-center justify-between border-b border-border pb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-md overflow-hidden">
                        Q
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-textMain dark:text-gray-200">
                          {blog?.author?.name || "Qubli Team"}
                        </p>
                        <p className="text-xs text-textMuted flex items-center gap-2">
                          <Visibility
                            sx={{ fontSize: 16, color: "var(--primary)" }}
                          />{" "}
                          {(blog?.views || 0).toLocaleString()} views
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {formData.image && (
                  <div className="max-w-5xl mx-auto px-4 mb-16">
                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-surface">
                      <img
                        src={formData.image}
                        alt={formData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-12 relative">
                  {/* TOC - Desktop */}
                  {toc.length > 0 && (
                    <aside className="hidden lg:block w-64 shrink-0">
                      <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 pb-16 custom-scrollbar">
                        <h3 className="text-lg text-textMain dark:text-textMain/95 font-bold mb-4 flex items-center gap-2">
                          <List size={18} /> Table of Contents
                        </h3>
                        <ul className="space-y-1 text-sm border-l-2 border-border pl-0">
                          {toc.map((heading, idx) => (
                            <li
                              key={idx}
                              style={{
                                marginLeft: "-2px",
                                paddingLeft: `${(heading.level - 1) * 12 + 16}px`,
                              }}
                            >
                              {heading.isClickable ? (
                                <a
                                  href={`#${heading.id}`}
                                  className={`transition-all duration-300 block py-1 line-clamp-1 relative ${
                                    activeId === heading.id
                                      ? "text-primary dark:text-blue-500 font-semibold"
                                      : "text-textMuted hover:text-primary transition-colors"
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById(heading.id);
                                    if (el) {
                                      el.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                      });
                                      setActiveId(heading.id);
                                    }
                                  }}
                                >
                                  {activeId === heading.id && (
                                    <motion.div 
                                      layoutId="toc-preview-indicator"
                                      className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary dark:bg-blue-500 rounded-full"
                                    />
                                  )}
                                  {heading.text}
                                </a>
                              ) : (
                                <span className="block py-0.5 text-xs text-textMuted/70 line-clamp-1 cursor-default">
                                  {heading.text}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </aside>
                  )}

                  <div className="max-w-3xl grow mx-auto lg:mx-0">
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none 
                        prose-headings:font-bold prose-headings:text-textMain dark:prose-headings:text-white
                        prose-p:text-textMuted prose-p:leading-relaxed
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-textMain dark:prose-strong:text-gray-200
                        prose-li:text-textMuted
                        prose-img:rounded-xl prose-img:shadow-lg"
                    >
                      <ReactMarkdown
                        components={{
                          h1: ({ _node, ...props }) => (
                            <MarkdownHeading level={1} {...props} />
                          ),
                          h2: ({ _node, ...props }) => (
                            <MarkdownHeading level={2} {...props} />
                          ),
                          h3: ({ _node, ...props }) => (
                            <MarkdownHeading level={3} {...props} />
                          ),
                          h4: ({ _node, ...props }) => (
                            <MarkdownHeading level={4} {...props} />
                          ),
                          h5: ({ _node, ...props }) => (
                            <MarkdownHeading level={5} {...props} />
                          ),
                          h6: ({ _node, ...props }) => (
                            <MarkdownHeading level={6} {...props} />
                          ),
                        }}
                      >
                        {formData.content ||
                          "*Your content will appear here...*"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Editor Mode */
              <form
                id="blog-form"
                onSubmit={handleSubmit}
                className="space-y-16 pb-20 animate-fade-in"
              >
                {/* Visual Header Section */}
                <section className="space-y-8">
                  <div
                    className={`relative w-full aspect-21/9 rounded-[40px] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden group ${
                      formData.image
                        ? "border-transparent"
                        : "border-border bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/20 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    {formData.image ? (
                      <>
                        <img
                          src={formData.image}
                          className="w-full h-full object-cover"
                          alt="Banner"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((p) => ({ ...p, image: "" }));
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full text-xs font-bold backdrop-blur-md transition-all border border-white/20 point"
                          >
                            Remove Photo
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center group-hover:scale-105 transition-transform">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-4 border border-border">
                          <ImageIcon size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-textMain">
                          Add Featured Image
                        </p>
                        <p className="text-[11px] text-textMuted mt-1">
                          Paste a URL in the field below
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      onChange={handleImageUpload}
                    />
                    {!formData.image && (
                      <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      />
                    )}
                  </div>

                  <div className="relative">
                    <ImageIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted"
                      size={18}
                    />
                    <input
                      type="text"
                      name="image"
                      value={formData.image ? "" : formData.image}
                      onChange={handleChange}
                      disabled={!!formData.image}
                      placeholder={
                        formData.image
                          ? ""
                          : "Paste cover image URL or upload above..."
                      }
                      className={`w-full pl-12 pr-6 py-4 rounded-2xl bg-surface border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm shadow-sm-custom ${
                        formData.image ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800" : ""
                      }`}
                    />
                  </div>
                </section>

                {/* Content Section */}
                <section className="space-y-8">
                  <textarea
                    name="title"
                    value={formData.title}
                    onChange={(e) => {
                      handleChange(e);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onBlur={!formData.slug ? handleSlugGen : null}
                    rows="1"
                    placeholder="Blog Title"
                    className="w-full bg-transparent text-5xl sm:text-6xl font-bold text-textMain dark:text-textMain/90 placeholder:text-slate-200 dark:placeholder:text-slate-600/60 outline-none resize-none leading-[1.15] tracking-tight overflow-y-auto"
                    required
                  />

                  <div className="flex items-center gap-3 text-textMuted text-xs font-bold uppercase tracking-widest bg-surface/80 w-fit px-4 py-2 rounded-full border border-border/50 shadow-sm-custom">
                    <Visibility
                      className="text-primary dark:text-blue-500"
                      sx={{ fontSize: 18 }}
                    />
                    {(blog?.views || 0).toLocaleString()} views
                  </div>

                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Short subtitle or summary..."
                    className="w-full bg-transparent text-lg text-textMuted font-medium leading-relaxed outline-none resize-none border-l-4 border border-border py-3 pl-5 focus:border-primary transition-colors rounded-md shadow-sm-custom"
                    required
                  />

                  <div className="h-px bg-surface w-full" />

                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Write your Blog content as markdown here..."
                    className="w-full bg-transparent text-lg text-textMain/90 placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none resize-none min-h-[400px] leading-relaxed rounded-md border border-border py-3 pl-4 shadow-sm-custom"
                    required
                  />
                </section>

                {/* Post Settings Cards */}
                <section className="pt-20 border-t border-border space-y-8">
                  <h4 className="text-md font-bold uppercase tracking-[0.15em] text-textMuted ml-1">
                    Post Configuration
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Slug Card */}
                    <div className="bg-surface dark:bg-surface/70 p-6 rounded-3xl border border-border shadow-sm-custom group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-800/20 rounded-xl text-blue-500">
                          <LinkIcon size={16} />
                        </div>
                        <span className="text-md font-bold text-textMain dark:text-textMain/95">
                          Permalink
                        </span>
                      </div>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-border focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm"
                        required
                      />
                    </div>

                    {/* Tags Card */}
                    <div className="bg-surface dark:bg-surface/70 p-6 rounded-3xl border border-border shadow-sm-custom group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-800/20 rounded-xl text-emerald-500">
                          <Tag size={16} />
                        </div>
                        <span className="text-md font-bold text-textMain dark:text-textMain/95">
                          Classification
                        </span>
                      </div>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="Comma separated tags..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-border focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Publish Settings */}
                  <div className="bg-surface dark:bg-surface/70 p-6 rounded-3xl border border-border flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gray-200/60 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-textMuted group-hover:text-primary dark:group-hover:text-blue-500 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="text-md font-bold text-textMain dark:text-textMain/95">
                          Visibility
                        </h4>
                        <p className="text-sm text-textMuted">
                          Make this post visible to the public.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          isPublished: !p.isPublished,
                        }))
                      }
                      className={`relative point w-14 h-7 rounded-full transition-all flex items-center p-1 ${
                        formData.isPublished
                          ? "bg-primary"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          formData.isPublished
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </section>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BlogEditor;
