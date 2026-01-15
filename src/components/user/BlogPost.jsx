import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import Visibility from "@mui/icons-material/Visibility";
import { ArrowLeft, Calendar, Share2, Loader2, List } from "lucide-react";
import { toast } from "react-toastify";
import blogService from "../../services/blogService";
import SEO from "./SEO";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  // TOC
  const [toc, setToc] = useState([]);

  // Helper to generate slugs from text
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Space to dash
      .replace(/^-+|-+$/g, ""); // Trim dashes
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await blogService.getBlogBySlug(id);
        setBlog(data);

        // Extract headers for TOC from content
        if (data.content) {
          const lines = data.content.split("\n");
          const headers = lines
            .filter((line) => line.startsWith("#"))
            .map((line) => {
              const match = line.match(/^(#+)\s+(.*)$/);
              if (!match) return null;
              const level = match[1].length;
              // Remove markdown syntax like **bold** or *italic* for the TOC text
              let text = match[2];
              text = text.replace(/[*_~`]/g, ""); // Simple cleanup
              const id = generateSlug(text);
              return { level, text, id };
            })
            .filter(Boolean);
          setToc(headers);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // Helper component to render headers with IDs
  const MarkdownHeading = ({ level, children, ...props }) => {
    // Extract text content recursively
    const getText = (node) => {
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(getText).join("");
      if (node?.props?.children) return getText(node.props.children);
      return "";
    };

    const text = getText(children);
    const id = generateSlug(text);
    const Tag = `h${level}`;

    return (
      <Tag id={id} className="scroll-mt-32" {...props}>
        {children}
      </Tag>
    );
  };

  const blogSchema = useMemo(() => {
    if (!blog) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: blog.title,
      description: blog.excerpt,
      image: blog.image,
      author: {
        "@type": "Organization",
        name: "Qubli AI",
        url: "https://qubli-ai.vercel.app",
      },
      publisher: {
        "@type": "Organization",
        name: "Qubli AI",
        logo: {
          "@type": "ImageObject",
          url: "https://qubli-ai.vercel.app/logo.png",
        },
      },
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt || blog.publishedAt,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://qubli-ai.vercel.app/blogs/${id}`,
      },
    };
  }, [blog, id]);

  const breadcrumbSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://qubli-ai.vercel.app",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://qubli-ai.vercel.app/blogs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: blog?.title || "Post",
          item: `https://qubli-ai.vercel.app/blogs/${id}`,
        },
      ],
    };
  }, [blog, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-textMain">
        <SEO
          title="Post Not Found"
          description="The blog post you're looking for doesn't exist."
        />
        <h1 className="text-4xl xs:text-4xl sm:text-5xl font-bold mb-6 sm:mb-8">
          Blog Not Found
        </h1>
        <button
          onClick={() => navigate("/blogs")}
          className="text-primary bg-primary/10 py-2 px-5 font-medium rounded-xl flex items-center gap-2 point"
        >
          <ArrowLeft size={20} /> Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={blog.title}
        description={blog.excerpt}
        image={blog.image}
        type="article"
        schema={[blogSchema, breadcrumbSchema]}
      />
      <article className="min-h-screen pt-28 pb-0 bg-background dark:bg-gray-900 transition-colors duration-300">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/blogs")}
            className="group flex items-center gap-2 text-textMuted hover:text-textMain/80 dark:hover:text-textMain transition-colors mb-8 point bg-gray-200/50 hover:bg-gray-200/60 dark:bg-surfaceHighlight/50 dark:hover:bg-surfaceHighlight/60 rounded-full py-2 px-4"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Blogs</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary dark:text-blue-500 font-semibold mb-4">
              {blog.tags &&
                blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/10 dark:bg-blue-800/15 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              {blog.publishedAt && (
                <span className="text-textMuted font-normal flex items-center gap-1">
                  <Calendar size={14} />{" "}
                  {new Date(blog.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-textMain dark:text-textMain/95 leading-tight mb-6">
              {blog.title}
            </h1>

            <div className="flex items-center justify-between border-b border-border pb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-md overflow-hidden">
                  {blog.author?.picture ? (
                    <img
                      src={blog.author.picture}
                      alt={blog.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    blog.author?.name?.charAt(0) || "Q"
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-textMain dark:text-gray-200">
                    {blog.author?.name || "Qubli Team"}
                  </p>
                  <p className="text-xs text-textMuted flex items-center gap-2">
                    <Visibility
                      sx={{ fontSize: 16, color: "var(--primary)" }}
                    />{" "}
                    {(blog.views || 0).toLocaleString()} views
                  </p>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-primary/10 dark:hover:bg-blue-800/20 text-textMuted hover:text-primary dark:hover:text-blue-500 transition-colors point"
                title="Share"
              >
                <Share2 size={20} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-surface">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12 relative">
          {/* Table of Contents - Desktop */}
          {toc.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 pb-16 custom-scrollbar">
                <h3 className="text-lg text-textMain dark:text-textMain/95 font-bold mb-4 flex items-center gap-2">
                  <List size={18} /> Table of Contents
                </h3>
                <ul className="space-y-2 text-sm border-l-2 border-border pl-4">
                  {toc.map((heading, idx) => (
                    <li key={idx} className={`pl-${(heading.level - 1) * 2}`}>
                      <a
                        href={`#${heading.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(heading.id);
                          if (el) {
                            // Manual scroll with offset just in case specific browsers ignore scroll-margin
                            const offset = 100;
                            const elementPosition =
                              el.getBoundingClientRect().top;
                            const offsetPosition =
                              elementPosition + window.scrollY - offset;

                            window.scrollTo({
                              top: offsetPosition,
                              behavior: "smooth",
                            });
                          }
                        }}
                        className="text-textMuted hover:text-primary transition-colors block py-0.5 line-clamp-1"
                        title={heading.text}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Content */}
          <div className="max-w-3xl grow mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
                  h1: ({ _, ...props }) => (
                    <MarkdownHeading level={1} {...props} />
                  ),
                  h2: ({ _, ...props }) => (
                    <MarkdownHeading level={2} {...props} />
                  ),
                  h3: ({ _, ...props }) => (
                    <MarkdownHeading level={3} {...props} />
                  ),
                }}
              >
                {blog.content}
              </ReactMarkdown>
            </motion.div>

            {/* Footer Navigation */}
            <div className="mt-16 pt-8 border-t border-border flex justify-between items-center mb-12">
              <h3 className="text-xl font-bold text-textMain dark:text-textMain/95">
                Continued Learning
              </h3>
              <button
                onClick={() => navigate("/blogs")}
                className="md:px-6 px-4 py-2 bg-primary dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700/80 transition-colors font-medium shadow-lg shadow-primary/25 point"
              >
                Read More Articles
              </button>
            </div>
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPost;
