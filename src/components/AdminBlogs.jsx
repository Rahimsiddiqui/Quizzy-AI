import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  Filter,
  MoreVertical,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  FileText,
  Edit,
} from "lucide-react";
import blogService from "../services/blogService";
import { toast } from "react-toastify";
import BlogEditor from "./admin/BlogEditor";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, published, draft
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await blogService.getAdminBlogs();
      setBlogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load blogs");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Filter and Pagination Logic
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch = blog.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
          ? blog.isPublished
          : !blog.isPublished;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, searchTerm, statusFilter]);

  const paginatedBlogs = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredBlogs.slice(start, start + pagination.limit);
  }, [filteredBlogs, pagination]);

  const totalPages = Math.ceil(filteredBlogs.length / pagination.limit);

  const stats = useMemo(() => {
    return {
      total: blogs.length,
      published: blogs.filter((b) => b.isPublished).length,
      drafts: blogs.filter((b) => !b.isPublished).length,
    };
  }, [blogs]);

  const handlePublishToggle = async (blog) => {
    try {
      await blogService.updateBlog(blog._id, {
        isPublished: !blog.isPublished,
      });
      toast.success(
        `Blog ${!blog.isPublished ? "published" : "unpublished"} successfully`
      );
      fetchBlogs();
      setOpenDropdown(null);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (blog) => {
    if (
      window.confirm(
        "Are you sure you want to delete this blog? This action cannot be undone."
      )
    ) {
      try {
        await blogService.deleteBlog(blog._id);
        toast.success("Blog deleted successfully");
        fetchBlogs();
        setOpenDropdown(null);
      } catch {
        toast.error("Failed to delete blog");
      }
    }
  };

  const handleEdit = (blog) => {
    setSelectedBlog(blog);
    setShowEditor(true);
    setOpenDropdown(null);
  };

  const handleCreate = () => {
    setSelectedBlog(null);
    setShowEditor(true);
  };

  return (
    <div className="space-y-8 animate-fade-in-up w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-textMain tracking-tight mb-3">
            Blogs
          </h1>
          <p className="text-textMuted mb-1">
            Manage and publish blog posts for the platform.
          </p>
        </div>
        <div className="flex items-center flex-col xs:flex-row gap-3">
          <div className="relative group w-full xs:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="pl-10 pr-4 py-2 bg-surfaceHighlight/30 border border-border rounded-xl text-textMain text-sm focus:outline-none focus:ring-2 focus:ring-primary/80 w-full transition-all shadow-md-custom"
            />
          </div>

          <div className="flex items-center gap-3 w-full xs:w-auto">
            {/* Status Filter */}
            <div className="relative flex-1 xs:flex-none">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-semibold text-textMain hover:bg-surfaceHighlight/50 transition-all point min-w-[140px] w-full shadow-md-custom"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-textMuted" />
                  <span className="capitalize">{statusFilter}</span>
                </div>
              </button>

              {showStatusDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-in-top">
                  {["all", "published", "draft"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surfaceHighlight/50 capitalize ${
                        statusFilter === status
                          ? "text-primary font-bold bg-primary/5"
                          : "text-textMain font-medium"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-blue-700 transition-all point whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: "Total Blogs",
            val: stats.total,
            icon: FileText,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Published",
            val: stats.published,
            icon: BookOpen,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Drafts",
            val: stats.drafts,
            icon: CustomEditIcon, // Using a custom wrapper or just Edit
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-surface border border-border p-5 rounded-2xl shadow-md-custom transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={25} />
              </div>
            </div>
            <p className="text-2xl font-bold text-textMain mt-4 mb-1">
              {loading ? "..." : stat.val}
            </p>
            <p className="text-textMuted font-semibold text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-surface border border-border rounded-2xl shadow-lg-custom overflow-hidden dark:bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surfaceHighlight/50 border-b border-border dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em]">
                  Blog Post
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em]">
                  Author
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Views
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                /* Skeleton Rows */
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surfaceHighlight"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-surfaceHighlight rounded w-32 sm:w-48"></div>
                          <div className="h-3 bg-surfaceHighlight rounded w-20"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-surfaceHighlight rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-surfaceHighlight rounded w-16 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-surfaceHighlight rounded-full w-20 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-surfaceHighlight rounded-lg w-8 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedBlogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-20 text-center text-textMuted font-medium"
                  >
                    No blogs found.
                  </td>
                </tr>
              ) : (
                paginatedBlogs.map((blog) => (
                  <tr
                    key={blog._id}
                    className="bg-surfaceHighlight/30 hover:bg-surfaceHighlight/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surfaceHighlight overflow-hidden shrink-0">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-textMain truncate leading-tight group-hover:text-primary transition-colors">
                            {blog.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-textMuted">
                            <Calendar size={12} />
                            <span className="text-[11px]">
                              {new Date(
                                blog.publishedAt || blog.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-textMain font-medium">
                        {blog.author?.name || "Qubli Team"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs font-semibold text-textMuted bg-surfaceHighlight/50 px-2 py-1 rounded-lg border border-border/50">
                        <Eye size={12} />
                        {blog.views?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          blog.isPublished
                            ? "bg-emerald-200/70 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-500"
                            : "bg-amber-200/70 text-amber-600 dark:bg-amber-800/30"
                        }`}
                      >
                        {blog.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(
                              openDropdown === blog._id ? null : blog._id
                            );
                          }}
                          className="p-2 hover:bg-surfaceHighlight rounded-lg text-textMuted transition-all point"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openDropdown === blog._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-500 dark:bg-slate-900">
                            <button
                              onClick={() => handleEdit(blog)}
                              className="w-full text-left px-4 py-2.5 text-sm text-textMain hover:bg-surfaceHighlight/50 transition-colors flex items-center gap-2 first:rounded-t-lg point"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handlePublishToggle(blog)}
                              className="w-full text-left px-4 py-2.5 text-sm text-textMain hover:bg-surfaceHighlight/50 transition-colors flex items-center gap-2 point"
                            >
                              {blog.isPublished ? (
                                <>
                                  <EyeOff size={16} /> Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye size={16} /> Publish
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(blog)}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 last:rounded-b-lg point"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-bold text-textMuted uppercase tracking-widest">
            Showing{" "}
            <span className="text-textMain">{paginatedBlogs.length}</span> of{" "}
            <span className="text-textMain">{filteredBlogs.length}</span> Blogs
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-textMain hover:bg-surfaceHighlight shadow-sm transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            <span className="text-xs font-bold text-textMuted mx-2">
              Page {pagination.page} of {Math.max(1, totalPages)}
            </span>

            <button
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(totalPages, p.page + 1),
                }))
              }
              disabled={pagination.page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <BlogEditor
          blog={selectedBlog}
          onClose={() => setShowEditor(false)}
          onSave={fetchBlogs}
        />
      )}
    </div>
  );
}

// Helper icon
const CustomEditIcon = (props) => <Edit {...props} />;
