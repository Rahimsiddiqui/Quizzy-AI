import { useState, useEffect } from "react";
import {
  Activity,
  Search,
  CheckCircle,
  PlusCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { getQuizResults, getQuizzes } from "../../services/adminService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AdminActivity() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch and combine data
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Fetch both completions and new quizzes to combine into a feed
      const [resultsRes, quizzesRes] = await Promise.all([
        getQuizResults(1, 50), // Fetch more to allow client-side sorting/filtering for now
        getQuizzes(1, 50),
      ]);

      const completions = (resultsRes.results || []).map((r) => ({
        type: "completion",
        title: "Quiz Completed",
        description: `completed ${r.quiz}`,
        user: r.user,
        details: `${r.score}% Score`,
        date: new Date(r.date),
        id: r._id,
        link: `/admin/quizzes/${r._id}`,
        data: r,
      }));

      const generations = (quizzesRes.quizzes || []).map((q) => ({
        type: "generation",
        title: "Quiz Created",
        description: `created ${q.title}`,
        user: q.creator,
        details: `${q.difficulty} • ${q.topic}`,
        date: new Date(q.date),
        id: q._id,
        link: `/admin/quizzes/${q._id}`,
        data: q,
      }));

      // Combine and sort by date descending
      const allActivities = [...completions, ...generations].sort(
        (a, b) => b.date - a.date
      );

      setActivities(allActivities);
      setPagination((prev) => ({
        ...prev,
        total: allActivities.length,
        totalPages: Math.ceil(allActivities.length / prev.limit),
      }));
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".filter-dropdown")) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Filter and Search Logic
  const handleReset = () => {
    setSearch("");
    setFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    toast.info("Filters reset to default");
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesFilter = filter === "all" || activity.type === filter;
    const matchesSearch =
      activity.user.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      activity.description
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
      activity.details.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination Logic
  const paginatedActivities = filteredActivities.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
          <div>
            <h1 className="text-3xl font-bold text-textMain tracking-tight mb-3">
              Activity Logs
            </h1>
            <p className="text-textMuted mb-2">
              Monitor system-wide events and user actions.
            </p>
          </div>
          <button
            onClick={fetchActivities}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-textMain shadow-md-custom hover:bg-surfaceHighlight disabled:opacity-50 transition-all point mb-2"
          >
            <RotateCcw
              size={14}
              className={`${isLoading ? "animate-spin" : ""} text-primary`}
            />
            {isLoading ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface p-4 border border-border rounded-2xl shadow-md-custom flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary dark:group-focus-within:text-blue-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search logs by user, quiz, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-surfaceHighlight/30 border border-border rounded-xl text-textMain text-sm focus:outline-none focus:ring-2 focus:ring-primary/80 w-full transition-all shadow-md-custom"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-bold text-textMuted hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-all point shadow-sm group"
            title="Reset all filters"
          >
            <RotateCcw
              size={16}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
            <span className="hidden lg:inline">Reset</span>
          </button>

          <div className="relative flex-1 md:w-48 filter-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-semibold text-textMain dark:text-textMain/90 hover:bg-surfaceHighlight/50 transition-all point w-full shadow-md-custom"
            >
              <div className="flex items-center gap-2">
                {filter === "all" ? (
                  <Filter
                    size={16}
                    className="text-primary dark:text-blue-500"
                  />
                ) : filter === "generation" ? (
                  <PlusCircle size={16} className="text-blue-500" />
                ) : (
                  <CheckCircle size={16} className="text-emerald-500" />
                )}
                <span>
                  {filter === "all"
                    ? "All Events"
                    : filter === "generation"
                    ? "Generations"
                    : "Completions"}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-textMuted transition-transform duration-300 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 md:w-56 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setFilter("all");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all point ${
                      filter === "all"
                        ? "bg-primary dark:bg-blue-800/60 text-white"
                        : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                    }`}
                  >
                    <Activity size={16} />
                    <span>All Events</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter("generation");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 transition-all point ${
                      filter === "generation"
                        ? "bg-primary dark:bg-blue-800/60 text-white"
                        : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                    }`}
                  >
                    <PlusCircle size={16} />
                    <span>Generations</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter("completion");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 transition-all point ${
                      filter === "completion"
                        ? "bg-emerald-500 dark:bg-emerald-700/60 text-white"
                        : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                    }`}
                  >
                    <CheckCircle size={16} />
                    <span>Completions</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-md-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surfaceHighlight/30">
                <th className="px-6 py-4 text-xs font-bold text-center text-textMuted uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-4 text-xs font-bold text-center text-textMuted uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-xs font-bold text-center text-textMuted uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-bold text-center text-textMuted uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-xs font-bold text-center text-textMuted uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                // High-Fidelity Table Skeletons
                [...Array(6)].map((_, i) => (
                  <tr
                    key={i}
                    className="animate-pulse border-b border-border/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div className="w-9 h-9 rounded-xl bg-surfaceHighlight/50"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-4 bg-surfaceHighlight/50 rounded w-3/4"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="h-6 bg-surfaceHighlight/40 rounded-full w-24"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-surfaceHighlight/50 rounded w-20 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3 bg-surfaceHighlight/30 rounded w-28 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedActivities.length > 0 ? (
                paginatedActivities.map((activity) => (
                  <tr
                    key={activity.id + activity.type}
                    onClick={() => navigate(activity.link)}
                    className="group hover:bg-surfaceHighlight/30 transition-colors point"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            activity.type === "generation"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-800/40 dark:text-blue-400"
                              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-400"
                          }`}
                        >
                          {activity.type === "generation" ? (
                            <PlusCircle size={20} />
                          ) : (
                            <CheckCircle size={20} />
                          )}
                        </div>
                        <span className="font-semibold text-textMain dark:text-textMain/90 text-sm">
                          {activity.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-textMuted transition-colors group-hover:text-primary dark:group-hover:text-blue-500 font-medium flex items-center gap-2 duration-200">
                        {activity.description}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800/60 flex items-center justify-center text-[10px] font-bold text-primary dark:text-blue-400 overflow-hidden">
                          {activity.type === "generation" ? (
                            activity.data.creatorPicture ? (
                              <img
                                src={activity.data.creatorPicture}
                                alt={activity.user}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              activity.user?.charAt(0)
                            )
                          ) : activity.data.userPicture ? (
                            <img
                              src={activity.data.userPicture}
                              alt={activity.user}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            activity.user?.charAt(0)
                          )}
                        </div>
                        <span className="text-sm text-textMain dark:text-textMain/90 font-medium">
                          {activity.user}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                          activity.type === "generation"
                            ? "bg-blue-100/30 text-primary dark:bg-blue-800/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            : "bg-emerald-100/30 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {activity.details}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-textMain dark:text-textMain/90">
                          {activity.date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs text-textMuted flex items-center gap-1">
                          <Clock size={10} />
                          {activity.date.toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-surfaceHighlight flex items-center justify-center text-textMuted">
                        <Filter size={32} />
                      </div>
                      <p className="text-lg font-semibold text-textMain">
                        No activities found
                      </p>
                      <p className="text-sm text-textMuted">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && filteredActivities.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] font-bold text-textMuted uppercase tracking-widest">
              Showing{" "}
              <span className="text-textMain">
                {Math.min(
                  pagination.limit,
                  filteredActivities.length -
                    (pagination.page - 1) * pagination.limit
                )}
              </span>{" "}
              of{" "}
              <span className="text-textMain">{filteredActivities.length}</span>{" "}
              Results
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    page: Math.max(1, p.page - 1),
                  }))
                }
                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-textMain hover:bg-surfaceHighlight disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Math.ceil(filteredActivities.length / pagination.limit) <=
                5 ? (
                  [
                    ...Array(
                      Math.ceil(filteredActivities.length / pagination.limit)
                    ),
                  ].map((_, i) => (
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
                      Math.min(
                        Math.ceil(filteredActivities.length / pagination.limit),
                        pagination.page + 1
                      ),
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
                    {pagination.page <
                      Math.ceil(filteredActivities.length / pagination.limit) -
                        1 && (
                      <>
                        {pagination.page <
                          Math.ceil(
                            filteredActivities.length / pagination.limit
                          ) -
                            2 && (
                          <span className="px-1 text-textMuted">...</span>
                        )}
                        <button
                          onClick={() =>
                            setPagination((p) => ({
                              ...p,
                              page: Math.ceil(
                                filteredActivities.length / pagination.limit
                              ),
                            }))
                          }
                          className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-surface border border-border transition-all shadow-sm"
                        >
                          {Math.ceil(
                            filteredActivities.length / pagination.limit
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              <button
                disabled={
                  pagination.page >=
                  Math.ceil(filteredActivities.length / pagination.limit)
                }
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all disabled:opacity-30 shadow-lg shadow-primary/20 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
