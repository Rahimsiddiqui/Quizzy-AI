import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Visibility from "@mui/icons-material/Visibility";
import { User, ArrowRight, Loader2 } from "lucide-react";
import blogService from "../../services/blogService";
import SEO from "./SEO";

const BlogList = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await blogService.getAllBlogs();
      setBlogs(data);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-background text-textMain animate-fade-in-up flex flex-col">
      <SEO
        title="AI Learning Blog"
        description="Explore the latest insights on AI-powered study techniques, exam preparation tips, and Qubli AI feature updates."
      />
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6"
          >
            The Qubli AI Blog
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            Latest Insights
            <br />
            <span className="text-primary dark:text-blue-500 bg-clip-text">
              & Updates
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-textMuted mb-8 max-w-2xl mx-auto"
          >
            Explore the latest trends in AI learning, study tips, and
            educational technology.
          </motion.p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="grow py-12 px-4 sm:px-6 lg:px-8 bg-surface/50">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-textMuted">No blog posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog, index) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-surface dark:bg-gray-800 rounded-2xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full relative"
                >
                  {/* Image Container */}
                  <div
                    className="relative h-48 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/blogs/${blog.slug}`)}
                  >
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {blog.tags[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col grow">
                    <div className="flex items-center gap-4 text-xs text-textMuted mb-3">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{blog.author?.name || "Qubli Team"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Visibility
                          sx={{ fontSize: 16, color: "var(--primary)" }}
                        />
                        <span>{(blog.views || 0).toLocaleString()} views</span>
                      </div>
                    </div>

                    <h2
                      className="text-xl font-bold text-textMain dark:text-white mb-3 line-clamp-2 cursor-pointer group-hover:text-primary transition-colors"
                      onClick={() => navigate(`/blogs/${blog.slug}`)}
                    >
                      {blog.title}
                    </h2>

                    <p className="text-textMuted text-sm line-clamp-3 mb-6 grow">
                      {blog.excerpt}
                    </p>

                    <button
                      onClick={() => navigate(`/blogs/${blog.slug}`)}
                      className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all"
                    >
                      Read Article <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogList;
