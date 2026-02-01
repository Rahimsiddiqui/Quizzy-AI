import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { m as motion } from "framer-motion";
import { ArrowLeft, Calendar, Share2, Loader2, List, Eye } from "lucide-react";
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
  const [activeId, setActiveId] = useState("");

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

        // Extract headers AND sub-items for TOC from content
        if (data.content) {
          const lines = data.content.split(/\r?\n/);
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
              
              const headerId = generateSlug(text);
              tocItems.push({ level, text, id: headerId, isClickable: true });
              currentHeaderLevel = level;
              continue;
            }
            
            const bulletMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
            if (bulletMatch && currentHeaderLevel > 0) {
              let text = bulletMatch[1].trim();
              // Extract just the bold text if present, otherwise use the full text
              const boldMatch = text.match(/^\*\*(.+?)\*\*/);
              if (boldMatch) {
                text = boldMatch[1].replace(/:$/, ""); // Remove trailing colon
              } else {
                // Clean markdown syntax and take text before colon/period
                text = text.replace(/[*_~`]/g, "").split(/[:.]/)[0].trim();
              }
              
              if (text && text.length > 2 && text.length < 60) {
                // Add as a sub-item (one level deeper than current header)
                tocItems.push({ 
                  level: currentHeaderLevel + 1, 
                  text, 
                  id: null, // No ID = non-clickable
                  isClickable: false 
                });
              }
              continue;
            }
            
            // If we hit a non-list, non-header line (like a paragraph), reset
            if (trimmedLine && !trimmedLine.startsWith("-") && !trimmedLine.startsWith("*") && !trimmedLine.startsWith("+")) {
              // Keep currentHeaderLevel for paragraphs, only reset on new headers
            }
          }
          
          setToc(tocItems);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Scroll Spy Logic
  useEffect(() => {
    if (toc.length === 0) return;

    const clickableHeadings = toc.filter((h) => h.id && h.isClickable);
    if (clickableHeadings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120; // Offset for header
      
      let currentActiveId = "";
      
      // Find the heading that is currently in view
      for (let i = clickableHeadings.length - 1; i >= 0; i--) {
        const heading = clickableHeadings[i];
        const element = document.getElementById(heading.id);
        
        if (element) {
          const elementTop = element.getBoundingClientRect().top + window.scrollY;
          
          if (scrollPosition >= elementTop) {
            currentActiveId = heading.id;
            break;
          }
        }
      }
      
      // If no heading is found (user is above first heading), set the first one as active
      if (!currentActiveId && clickableHeadings.length > 0) {
        const firstElement = document.getElementById(clickableHeadings[0].id);
        if (firstElement) {
          const firstTop = firstElement.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition < firstTop) {
            currentActiveId = clickableHeadings[0].id;
          }
        }
      }
      
      if (currentActiveId !== activeId) {
        setActiveId(currentActiveId);
      }
    };

    // Initial check
    handleScroll();

    // Add scroll listener with throttle for performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [toc, activeId]);

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
        <h1 className="text-4xl xs:text-4xl sm:text-5xl font-bold mb-6 sm:mb-9">
          Blog Not Found
        </h1>
        <button
          onClick={() => navigate("/blogs")}
          className="text-primary bg-primary/10 dark:bg-blue-800/25 py-2 px-5 font-medium rounded-xl flex items-center gap-1.5 point group"
        >
          <span className="inline-block group-hover:-translate-x-0.5 transition-transform duration-200">←</span> Back to Blogs
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
            className="group flex items-center gap-2 text-textMuted hover:text-textMain/80 dark:hover:text-textMain transition-colors mb-8 point bg-gray-200/50 hover:bg-gray-200/60 dark:bg-surfaceHighlight/50 dark:hover:bg-surfaceHighlight/60 rounded-full py-2 px-4 group"
          >
            <span className="inline-block group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
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
                    className="bg-primary/10 dark:bg-blue-800/25 px-3 py-1 rounded-full"
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
                    <Eye className="w-5 h-5 text-primary dark:text-blue-500" />
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
                <ul className="space-y-1 text-sm border-l-2 border-border pl-0">
                  {toc.map((heading, idx) => (
                    <li 
                      key={idx} 
                      className="transition-all duration-200"
                      style={{ 
                        marginLeft: "-2px",
                        paddingLeft: `${(heading.level - 1) * 12 + 16}px` 
                      }}
                    >
                      {heading.isClickable ? (
                        <a
                          href={`#${heading.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(heading.id);
                            if (el) {
                              const offset = 100;
                              const elementPosition =
                                el.getBoundingClientRect().top;
                              const offsetPosition =
                                elementPosition + window.scrollY - offset;

                              window.scrollTo({
                                top: offsetPosition,
                                behavior: "smooth",
                              });
                              setActiveId(heading.id);
                            }
                          }}
                          className={`transition-all duration-300 block py-1 line-clamp-1 relative ${
                            activeId === heading.id
                              ? "text-primary dark:text-blue-500 font-semibold"
                              : "text-textMuted hover:text-textMain dark:hover:text-white"
                          }`}
                          title={heading.text}
                        >
                          {activeId === heading.id && (
                            <motion.div 
                              layoutId="toc-indicator"
                              className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary dark:bg-blue-500 rounded-full"
                            />
                          )}
                          {heading.text}
                        </a>
                      ) : (
                        // Non-clickable sub-item (bullet point)
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
                {blog.content}
              </ReactMarkdown>
            </motion.div>

            {/* Footer Navigation */}
            <div className="mt-16 pt-8 border-t border-border flex flex-col gap-5 sm:flex-row justify-between items-center mb-12">
              <h3 className="text-2xl font-bold text-textMain dark:text-textMain/95">
                Continued Learning
              </h3>
              <button
                onClick={() => navigate("/blogs")}
                className="md:px-6 px-6 py-2 bg-primary gap-2 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700/80 transition-colors font-medium hover:shadow-sm shadow-primary/25 point text-md group"
              >
                Read More Articles <span className="inline-block group-hover:translate-x-0.75 transition-transform duration-200">→</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPost;
