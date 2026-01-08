import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Layers,
  BarChart3,
  Calendar,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Filter,
  MoreVertical,
  TrendingUp,
  ArrowUpRight,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import {
  getQuizzes,
  enableQuiz,
  disableQuiz,
  deleteQuiz,
} from "../services/adminService";
import { toast } from "react-toastify";

export default function AdminQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [avgScore, setAvgScore] = useState("...");
  const [completionRate, setCompletionRate] = useState("...");
  const [avgDifficulty, setAvgDifficulty] = useState("...");
  const [prevAvgScore, setPrevAvgScore] = useState(null);
  const [prevCompletionRate, setPrevCompletionRate] = useState(null);
  const [prevTotalQuizzes, setPrevTotalQuizzes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const latestFetchId = useRef(0);
  const mounted = useRef(true);

  // Debounce search term
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchQuizzes();
    // Set up interval to fetch stats every 15 seconds
    const interval = setInterval(() => {
      fetchQuizzes();
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedDifficulty, pagination.page, debouncedSearchTerm]);

  const fetchQuizzes = async () => {
    setLoading(true);
    const fetchId = ++latestFetchId.current;
    try {
      const data = await getQuizzes(
        pagination.page,
        pagination.limit,
        selectedDifficulty,
        null, // isActive
        debouncedSearchTerm
      );
      if (!mounted.current || fetchId !== latestFetchId.current) return;
      setQuizzes(data.quizzes || []);
      // Save previous values before updating
      setPrevAvgScore(avgScore === "..." ? null : parseFloat(avgScore));
      setPrevCompletionRate(
        completionRate === "..." ? null : parseFloat(completionRate)
      );
      setPrevTotalQuizzes(pagination.total);
      // Update current values
      setAvgScore(data.avgScore || 0);
      setCompletionRate(data.completionRate || 0);
      setAvgDifficulty(data.avgDifficulty || "Medium");
      setPagination(
        data.pagination || { page: 1, limit: 10, pages: 1, total: 0 }
      );
    } catch {
      if (!mounted.current || fetchId !== latestFetchId.current) return;
      toast.error("Failed to load quizzes");
    } finally {
      if (mounted.current && fetchId === latestFetchId.current) {
        setLoading(false);
        setStatsLoading(false);
      }
    }
  };

  const handleReset = () => {
    setLoading(true);
    setSearchTerm("");
    setDebouncedSearchTerm(""); // Immediately clear debounced state
    setSelectedDifficulty(null);
    setPagination((p) => ({ ...p, page: 1 }));
    toast.info("Filters reset to default");
  };

  const calculateTrend = (current, previous) => {
    if (previous === null || previous === undefined || previous === 0)
      return null;
    const numCurrent = isNaN(current) ? 0 : Number(current);
    const numPrevious = isNaN(previous) ? 0 : Number(previous);
    if (numPrevious === 0) return null;
    const percentChange =
      ((numCurrent - numPrevious) / Math.abs(numPrevious)) * 100;
    if (isNaN(percentChange) || !isFinite(percentChange)) return null;
    return `${Math.round(percentChange)}%`;
  };

  return (
    <div className="space-y-8 animate-fade-in-up w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-textMain tracking-tight mb-3">
            Quizzes
          </h1>
          <p className="text-textMuted mb-1">
            Manage and monitor platform curriculum.
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
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => {
                setLoading(true);
                setSearchTerm(e.target.value);
              }}
              className="pl-10 pr-4 py-2 bg-surfaceHighlight/30 border border-border rounded-xl text-textMain text-sm focus:outline-none focus:ring-2 focus:ring-primary/80 w-full transition-all shadow-md-custom"
            />
          </div>

          <div className="flex items-center gap-3 w-full xs:w-auto">
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-bold text-textMuted hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-all point shadow-md-custom group"
              title="Reset all filters"
            >
              <RotateCcw
                size={16}
                className="group-hover:rotate-180 transition-transform duration-500"
              />
              <span className="hidden lg:inline">Reset</span>
            </button>

            {/* Difficulty Filter Dropdown */}
            <div className="relative flex-1 xs:flex-none">
              <button
                onClick={() =>
                  setShowDifficultyDropdown(!showDifficultyDropdown)
                }
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-semibold text-textMain dark:text-textMain/90 hover:bg-surfaceHighlight/50 transition-all point min-w-[140px] w-full shadow-md-custom"
              >
                <div className="flex items-center gap-2">
                  {!selectedDifficulty ? (
                    <Filter size={16} className="text-textMuted" />
                  ) : (
                    <Layers
                      size={16}
                      className={
                        selectedDifficulty === "Easy"
                          ? "text-emerald-500"
                          : selectedDifficulty === "Medium"
                          ? "text-amber-500"
                          : "text-rose-500"
                      }
                    />
                  )}
                  <span>{selectedDifficulty || "All Levels"}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-textMuted transition-transform duration-300 ${
                    showDifficultyDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDifficultyDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-in-top">
                  <button
                    onClick={() => {
                      setLoading(true);
                      setSelectedDifficulty(null);
                      setShowDifficultyDropdown(false);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surfaceHighlight/50 ${
                      selectedDifficulty === null
                        ? "text-primary dark:text-blue-500 font-bold bg-primary/5 dark:bg-blue-500/5"
                        : "text-textMain font-medium"
                    }`}
                  >
                    <Filter
                      size={16}
                      className={
                        selectedDifficulty === null
                          ? "text-primary dark:text-blue-400"
                          : "text-textMuted"
                      }
                    />
                    <span>All Levels</span>
                    {selectedDifficulty === null && (
                      <CheckCircle size={14} className="ml-auto" />
                    )}
                  </button>
                  {["Easy", "Medium", "Hard"].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        setLoading(true);
                        setSelectedDifficulty(diff);
                        setShowDifficultyDropdown(false);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surfaceHighlight/50 ${
                        selectedDifficulty === diff
                          ? "text-primary dark:text-blue-500 font-bold bg-primary/5 dark:bg-blue-500/5"
                          : "text-textMain font-medium"
                      }`}
                    >
                      <Layers
                        size={16}
                        className={
                          selectedDifficulty === diff
                            ? diff === "Easy"
                              ? "text-emerald-500"
                              : diff === "Medium"
                              ? "text-amber-500"
                              : "text-rose-500"
                            : "text-textMuted"
                        }
                      />
                      <span>{diff}</span>
                      {selectedDifficulty === diff && (
                        <CheckCircle size={14} className="ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Quizzes",
            val: pagination.total,
            icon: BookOpen,
            color: "text-blue-500",
            bg: "bg-blue-500/10 dark:bg-blue-800/30",
            isLoading: loading,
            trend: calculateTrend(pagination.total, prevTotalQuizzes),
          },
          {
            label: "Completion Rate",
            val: `${completionRate}%`,
            icon: BarChart3,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10 dark:bg-emerald-800/30",
            isLoading: statsLoading,
            trend: calculateTrend(completionRate, prevCompletionRate),
          },
          {
            label: "Avg. Difficulty",
            val: avgDifficulty,
            icon: Layers,
            color: "text-amber-500 dark:text-amber-600",
            bg: "bg-amber-500/10 dark:bg-amber-800/30",
            isLoading: statsLoading,
          },
          {
            label: "Avg. Score",
            val: `${avgScore}%`,
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-500/10 dark:bg-purple-800/30",
            isLoading: statsLoading,
            trend: calculateTrend(avgScore, prevAvgScore),
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
              {stat.trend && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  <ArrowUpRight size={14} />
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-textMain mt-4 mb-1">
              {stat.isLoading ? "..." : stat.val}
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
                  Quiz Content
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Curator
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Classification
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Difficulty
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-textMuted uppercase tracking-[0.2em] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                // Skeleton Rows
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
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surfaceHighlight"></div>
                        <div className="h-4 bg-surfaceHighlight rounded w-24"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="h-6 bg-surfaceHighlight rounded-lg w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="h-6 bg-surfaceHighlight rounded-full w-20"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="h-8 bg-surfaceHighlight rounded-lg w-8"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : quizzes.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-20 text-center text-textMuted font-medium"
                  >
                    No quizzes found in the database.
                  </td>
                </tr>
              ) : (
                quizzes.map((quiz) => (
                  <tr
                    key={quiz._id}
                    onClick={() => navigate(`/admin/quizzes/${quiz._id}`)}
                    className="bg-surfaceHighlight/30 hover:bg-surfaceHighlight/50 transition-colors group point"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary dark:text-blue-500 dark:bg-blue-800/30">
                          <BookOpen size={18} />
                        </div>
                        <div className="max-w-50 sm:max-w-75">
                          <p className="text-sm font-bold text-textMain dark:text-textMain/90 truncate leading-tight group-hover:text-primary transition-colors">
                            {quiz.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-textMuted">
                            <Calendar size={12} />
                            <span className="text-[11px]">
                              {new Date(quiz.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-textMuted flex items-center justify-center text-[10px] font-bold">
                          {quiz.creator?.charAt(0)}
                        </div>
                        <span className="text-sm text-textMain font-medium dark:text-textMain/90">
                          {quiz.creator}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-lg text-sm text-textMain truncate max-w-50">
                        {quiz.topic}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.difficulty === "Easy"
                            ? "bg-emerald-200/70 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-500"
                            : quiz.difficulty === "Medium"
                            ? "bg-amber-200/70 text-amber-600 dark:bg-amber-800/30"
                            : "bg-red-200 text-red-600 dark:bg-red-800/30 dark:text-red-500"
                        }`}
                      >
                        {quiz.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(
                              openDropdown === quiz._id ? null : quiz._id
                            );
                          }}
                          className="p-2 hover:bg-surfaceHighlight rounded-lg text-textMuted transition-all point"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openDropdown === quiz._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-500 dark:bg-slate-900">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  if (!quiz.isActive) {
                                    await disableQuiz(quiz._id);
                                    toast.success("Quiz disabled successfully");
                                  } else {
                                    await enableQuiz(quiz._id);
                                    toast.success("Quiz enabled successfully");
                                  }
                                  // Update quiz state locally
                                  setQuizzes(
                                    quizzes.map((q) =>
                                      q._id === quiz._id
                                        ? { ...q, isActive: !q.isActive }
                                        : q
                                    )
                                  );
                                  setOpenDropdown(null);
                                } catch (error) {
                                  toast.error(
                                    error.response?.data?.message ||
                                      `Failed to ${
                                        !quiz.isActive ? "disable" : "enable"
                                      } quiz`
                                  );
                                }
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-textMain dark:text-textMain/90 hover:bg-surfaceHighlight/50 transition-colors flex items-center gap-2 first:rounded-t-lg point"
                            >
                              {!quiz.isActive ? (
                                <>
                                  <EyeOff size={16} />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Eye size={16} />
                                  Enable
                                </>
                              )}
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this quiz?"
                                  )
                                ) {
                                  try {
                                    await deleteQuiz(quiz._id);
                                    toast.success("Quiz deleted successfully");
                                    fetchQuizzes();
                                    setOpenDropdown(null);
                                  } catch (error) {
                                    toast.error(
                                      error.response?.data?.message ||
                                        "Failed to delete quiz"
                                    );
                                  }
                                }
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 last:rounded-b-lg point"
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
            Showing <span className="text-textMain">{quizzes.length}</span> of{" "}
            <span className="text-textMain">{pagination.total}</span> Quizzes
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
                [...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: i + 1 }))
                    }
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all point shadow-sm ${
                      pagination.page === i + 1
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-textMuted hover:text-textMain bg-surface border border-border"
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
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-surface border border-border transition-all shadow-sm"
                      >
                        1
                      </button>
                      {pagination.page > 3 && (
                        <span className="px-1 text-textMuted">...</span>
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
                            : "text-textMuted hover:text-textMain bg-surface border border-border"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  {pagination.page < pagination.pages - 1 && (
                    <>
                      {pagination.page < pagination.pages - 2 && (
                        <span className="px-1 text-textMuted">...</span>
                      )}
                      <button
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            page: pagination.pages,
                          }))
                        }
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-surface border border-border transition-all shadow-sm"
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
    </div>
  );
}
