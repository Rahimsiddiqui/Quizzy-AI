import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
import Visibility from "@mui/icons-material/Visibility";
import blogService from "../../services/blogService";
import { toast } from "react-toastify";
import BlogEditor from "./BlogEditor";
import ConfirmActionModal from "../user/ConfirmActionModal";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, published, draft
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0,
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

  // Close dropdown on scroll or resize
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdown) setOpenDropdown(null);
    };

    if (openDropdown) {
      window.addEventListener("scroll", handleScroll, true); // Capture phase for all scrollables
      window.addEventListener("resize", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [openDropdown]);

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

  // Sync pagination meta when filtered results change
  useEffect(() => {
    const newPages = Math.ceil(filteredBlogs.length / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      pages: Math.max(1, newPages),
      total: filteredBlogs.length,
      // Reset to page 1 if current page is out of bounds
      page: prev.page > newPages && newPages > 0 ? 1 : prev.page,
    }));
  }, [filteredBlogs.length, pagination.limit]);

  const stats = useMemo(() => {
    return {
      total: blogs.length,
      published: blogs.filter((b) => b.isPublished).length,
      drafts: blogs.filter((b) => !b.isPublished).length,
    };
  }, [blogs]);

  const handlePublishToggle = async (blog) => {
    setActionLoadingId(blog._id);
    try {
      const updatedBlog = await blogService.updateBlog(blog._id, {
        isPublished: !blog.isPublished,
      });

      // Update local state instead of re-fetching to avoid skeleton flash "refresh"
      setBlogs((prev) =>
        prev.map((b) => (b._id === blog._id ? { ...b, ...updatedBlog } : b))
      );

      toast.success(
        `Blog ${updatedBlog.isPublished ? "published" : "drafted"} successfully`
      );
      setOpenDropdown(null);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClick = (blog) => {
    setBlogToDelete(blog);
    setIsDeleteModalOpen(true);
    setOpenDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!blogToDelete) return;
    setActionLoadingId(blogToDelete._id);
    try {
      await blogService.deleteBlog(blogToDelete._id);
      toast.success("Blog deleted successfully");

      // Update local state instead of re-fetching
      setBlogs((prev) => prev.filter((b) => b._id !== blogToDelete._id));
      setIsDeleteModalOpen(false);
      setBlogToDelete(null);
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setActionLoadingId(null);
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
      <div className="flex flex-col min-[850px]:flex-row min-[850px]:items-end justify-between gap-4">
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
              className="pl-10 pr-4 py-2 bg-surfaceHighlight/30 border border-border rounded-xl text-textMain text-sm focus:outline-none focus:ring-2 focus:ring-primary/80 w-full transition-all shadow-sm-custom"
            />
          </div>

          <div className="flex items-center gap-3 w-full xs:w-auto">
            {/* Status Filter */}
            <div className="relative flex-1 xs:flex-none">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-semibold text-textMuted hover:bg-surfaceHighlight/50 transition-all point min-w-[140px] w-full shadow-sm-custom"
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
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surfaceHighlight/50 capitalize point ${
                        statusFilter === status
                          ? "text-primary dark:text-blue-500 font-bold bg-primary/5 dark:bg-blue-800/15"
                          : "text-textMain dark:text-textMain/95 font-medium"
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
              className="flex items-center gap-2 px-4 py-2.5 bg-primary dark:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-blue-700 dark:hover:bg-blue-700/80 transition-all point whitespace-nowrap"
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
            icon: Edit,
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
      <div className="bg-surface border border-border rounded-2xl shadow-lg-custom dark:bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surfaceHighlight/50 border-b border-border dark:bg-slate-800/50">
                <th className="px-6 py-5 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em]">
                  Blog Post
                </th>
                <th className="px-6 py-5 text-[11px] font-bold text-textMuted text-center uppercase tracking-[0.2em]">
                  Author
                </th>
                <th className="px-6 py-5 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Views
                </th>
                <th className="px-6 py-5 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Status
                </th>
                <th className="px-6 py-5 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                /* Skeleton Rows */
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surfaceHighlight shrink-0"></div>
                        <div className="space-y-2.5">
                          <div className="h-4 bg-surfaceHighlight rounded-md w-32 sm:w-48"></div>
                          <div className="h-3 bg-surfaceHighlight rounded-md w-20"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-surfaceHighlight rounded-md w-24"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-5 bg-surfaceHighlight rounded-lg w-16 mx-auto"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-surfaceHighlight rounded-full w-20 mx-auto"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-9 bg-surfaceHighlight rounded-xl w-9 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedBlogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                      <div className="p-4 bg-surfaceHighlight rounded-full">
                        <FileText size={32} className="text-textMuted" />
                      </div>
                      <div>
                        <p className="text-textMain font-bold">
                          No posts found
                        </p>
                        <p className="text-textMuted text-xs font-medium">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBlogs.map((blog) => (
                  <tr
                    key={blog._id}
                    className="hover:bg-slate-50 dark:bg-surface/50 dark:hover:bg-surface/60 transition-all group cursor-pointer"
                    onClick={() => handleEdit(blog)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surfaceHighlight overflow-hidden shrink-0 shadow-sm border border-border/10">
                          {blog.image ? (
                            <img
                              src={blog.image}
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-textMuted/30">
                              <FileText size={20} />
                            </div>
                          )}
                        </div>
                        <div className="max-w-120">
                          <p className="text-sm font-bold text-textMain dark:text-textMain/95 truncate leading-tight group-hover:text-primary dark:group-hover:text-blue-500 transition-colors">
                            {blog.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-textMuted">
                            <span className="text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                              <Calendar size={10} />{" "}
                              {new Date(
                                blog.publishedAt || blog.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center min-w-50 sm:min-w-60">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden">
                          {blog.author?.picture ? (
                            <img
                              src={blog.author.picture}
                              alt={blog.author.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            blog.author?.name?.charAt(0).toUpperCase() || "Q"
                          )}
                        </div>
                        <span className="text-xs text-textMain font-bold">
                          {blog.author?.name || "Qubli Team"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center justify-center gap-2 text-xs font-bold text-textMuted bg-surfaceHighlight/30 px-2.5 py-1.5 rounded-xl border border-border/40">
                        <Visibility
                          sx={{ fontSize: 16, color: "var(--primary)" }}
                        />
                        {(blog.views || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {actionLoadingId === blog._id ? (
                        <div className="flex justify-center">
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      ) : (
                        <span
                          className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            blog.isPublished
                              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                          }`}
                        >
                          {blog.isPublished ? "Published" : "Drafted"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div
                        className="relative inline-block text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setDropdownPos({
                              top: rect.bottom + window.scrollY,
                              left: rect.right + window.scrollX,
                            });
                            setOpenDropdown(
                              openDropdown === blog._id ? null : blog._id
                            );
                          }}
                          className="hover:bg-surfaceHighlight text-textMuted p-2 rounded-xl transition-all active:scale-90 point"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openDropdown === blog._id &&
                          createPortal(
                            <div
                              style={{
                                position: "absolute",
                                top: `${dropdownPos.top}px`,
                                left: `${dropdownPos.left}px`,
                                transform: "translateX(-100%)",
                              }}
                              className="mt-3 w-52 bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-9999 overflow-hidden animate-slide-in-top ring-1 ring-black/5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleEdit(blog)}
                                className="w-full text-left px-5 py-3.5 text-sm text-textMuted hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-3 font-semibold first:rounded-t-2xl point"
                              >
                                <Edit size={16} />
                                Review Content
                              </button>
                              <button
                                onClick={() => handlePublishToggle(blog)}
                                disabled={actionLoadingId === blog._id}
                                className="w-full text-left px-5 py-3.5 text-sm text-textMuted hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 transition-all flex items-center gap-3 font-semibold point disabled:opacity-50"
                              >
                                {blog.isPublished ? (
                                  <>
                                    <EyeOff size={16} /> Mark as Draft
                                  </>
                                ) : (
                                  <>
                                    <Eye size={16} /> Make Public
                                  </>
                                )}
                              </button>
                              <div className="h-px bg-border/50 mx-4 my-1" />
                              <button
                                onClick={() => handleDeleteClick(blog)}
                                disabled={actionLoadingId === blog._id}
                                className="w-full text-left px-5 py-3.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-3 font-semibold last:rounded-b-2xl point disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                                Delete Post
                              </button>
                            </div>,
                            document.body
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
            Showing <span className="text-textMain">{pagination.page}</span> of{" "}
            <span className="text-textMain">{pagination.pages}</span> Page
            {pagination.pages === 1 ? "" : "s"}
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

            <div className="flex items-center gap-1 mx-2">
              {pagination.pages <= 5 ? (
                [...Array(Math.max(1, pagination.pages))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: i + 1 }))
                    }
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all point shadow-sm ${
                      pagination.page === i + 1
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-textMuted hover:text-textMain bg-white dark:bg-slate-800 border border-border"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
              ) : (
                <>
                  {pagination.page > 2 && (
                    <>
                      <button
                        onClick={() =>
                          setPagination((p) => ({ ...p, page: 1 }))
                        }
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-white dark:bg-slate-800 border border-border transition-all shadow-sm"
                      >
                        1
                      </button>
                      {pagination.page > 3 && (
                        <span className="px-1 text-textMuted text-xs">...</span>
                      )}
                    </>
                  )}
                  {[
                    Math.max(1, pagination.page - 1),
                    pagination.page,
                    Math.min(pagination.pages, pagination.page + 1),
                  ]
                    .filter((p, i, arr) => arr.indexOf(p) === i)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: p }))
                        }
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          pagination.page === p
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-textMuted hover:text-textMain bg-white dark:bg-slate-800 border border-border"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  {pagination.page < pagination.pages - 1 && (
                    <>
                      {pagination.page < pagination.pages - 2 && (
                        <span className="px-1 text-textMuted text-xs">...</span>
                      )}
                      <button
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            page: pagination.pages,
                          }))
                        }
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-white dark:bg-slate-800 border border-border transition-all shadow-sm"
                      >
                        {pagination.pages}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(pagination.pages, p.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.pages}
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

      {/* Deletion Confirmation */}
      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${blogToDelete?.title}"? This action cannot be undone and will remove the post completely from the platform.`}
        confirmText="Delete Permanently"
        isDangerous={true}
        isLoading={actionLoadingId === blogToDelete?._id}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setBlogToDelete(null);
        }}
      />
    </div>
  );
}
