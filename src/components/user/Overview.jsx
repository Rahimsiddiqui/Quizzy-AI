import { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  Clock,
  Search,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import StorageService from "../../services/storageService.js";
import { generateAndSaveReview } from "../../services/geminiService.js";
import { useSidebar } from "../../context/SidebarContext";

const formatQuizDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const formatUpdateTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function useTailwindDark() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  bgColorClass,
  textColorClass,
  diffClass,
  loading,
}) => (
  <div className="bg-surface p-6 rounded-2xl border border-border shadow-md-custom flex items-center gap-4 transition-shadow">
    <div className={`p-3 ${bgColorClass} ${textColorClass} rounded-xl`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
        {title}
      </p>
      <p
        className={`${
          diffClass ? "text-xl" : "text-2xl"
        } font-bold text-textMain dark:text-textMain/95`}
      >
        {loading ? "..." : value}
      </p>
    </div>
  </div>
);

const Overview = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [aiReview, setAiReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [timeframe, setTimeframe] = useState("weekly");
  const itemsPerPage = 8;

  const { completedQuizzes, avgScore } = useMemo(() => {
    const completed = quizzes.filter((q) => q?.score !== undefined);
    const totalScore = completed.reduce((acc, q) => acc + (q?.score ?? 0), 0);
    const average = completed.length
      ? Math.round(totalScore / completed.length)
      : 0;
    return { completedQuizzes: completed, avgScore: average };
  }, [quizzes]);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const userQuizzes = await StorageService?.getQuizzes(user?.id);
        const quizList = userQuizzes?.quizzes || userQuizzes;
        setQuizzes(quizList ?? []);

        const storedReview = await StorageService?.getLastReview();
        if (storedReview) {
          setAiReview(storedReview?.text ?? "");
        } else if (quizList?.filter((q) => q?.score !== undefined).length > 0) {
          try {
            const reviewText = await generateAndSaveReview(user, quizList);
            setAiReview(reviewText ?? "");
          } catch (reviewErr) {
            console.error("AI Review Generation Error:", reviewErr);
            setAiReview("Could not generate initial review at this time.");
          }
        }
      } catch (err) {
        console.error("Error loading overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [user?.id]);

  const { sidebarCollapsed } = useSidebar();

  const filteredQuizzes = useMemo(() => {
    return quizzes
      .filter((q) => {
        const matchesSearch =
          q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.topic.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDiff =
          filterDifficulty === "All" || q.difficulty === filterDifficulty;
        return matchesSearch && matchesDiff;
      })
      .slice()
      .reverse();
  }, [quizzes, searchTerm, filterDifficulty]);

  const paginatedQuizzes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuizzes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuizzes, currentPage]);

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDifficulty]);

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const chartData = useMemo(() => {
    const days = timeframe === "weekly" ? 7 : 30;
    const lastDays = [...Array(days)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    return lastDays.map((date) => {
      const dayQuizzes = completedQuizzes.filter(
        (q) => new Date(q.createdAt).toISOString().split("T")[0] === date,
      );
      const avg = dayQuizzes.length
        ? Math.round(
            dayQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) /
              dayQuizzes.length,
          )
        : 0;

      const dateObj = new Date(date);
      return {
        name:
          timeframe === "weekly"
            ? dateObj.toLocaleDateString("en-US", { weekday: "short" })
            : dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
        fullDate: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        score: avg,
      };
    });
  }, [completedQuizzes, timeframe]);

  const isDark = useTailwindDark();

  const navigate = useNavigate();

  const handleRowClick = (quizId) => {
    if (quizId) navigate(`/quiz/${quizId}`);
  };

  const formatReviewText = (text) => {
    if (typeof text !== "string") text = String(text ?? "");

    return text.split("\n").map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <p key={idx} className="mb-2">
          {parts.map((part, i) =>
            part?.startsWith("**") && part?.endsWith("**") ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : part?.startsWith("*") && part?.endsWith("*") ? (
              <i key={i}>{part.slice(1, -1)}</i>
            ) : (
              part
            ),
          )}
        </p>
      );
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 border border-border rounded-xl shadow-xl">
          <p className="text-xs font-bold text-textMuted uppercase mb-1">
            {payload[0].payload.fullDate || payload[0].payload.name}
          </p>
          <p className="text-lg font-bold text-primary dark:text-blue-500">
            {payload[0].value}%{" "}
            <span className="text-xs font-normal text-textMuted ml-1">
              Avg Score
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-textMain dark:text-textMain/95 tracking-tight">
          Performance Overview
        </h1>
        <div className="text-sm text-textMuted bg-surface px-4 py-2 rounded-full border border-border shadow-sm-custom flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Last Updated: {formatUpdateTime()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Trophy}
          title="Completed Quizzes"
          value={completedQuizzes.length}
          bgColorClass="bg-blue-100 dark:bg-blue-900"
          textColorClass="text-blue-600 dark:text-blue-300"
          diffClass={false}
          loading={loading}
        />
        <StatCard
          icon={Target}
          title="Avg Score"
          value={avgScore ? avgScore + "%" : "N/A"}
          bgColorClass="bg-green-100 dark:bg-green-900"
          textColorClass="text-green-600 dark:text-green-300"
          diffClass={false}
          loading={loading}
        />
        <StatCard
          icon={Calendar}
          title="Joined Since"
          value={formatQuizDate(user?.limits?.lastReset ?? Date.now())}
          bgColorClass="bg-purple-100 dark:bg-purple-900"
          textColorClass="text-purple-600 dark:text-purple-300"
          diffClass={true}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-3xl border border-border shadow-md-custom">
          <div className="flex flex-col gap-4 xs:flex-row xs:gap-0 items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-textMain dark:text-textMain/95 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary dark:text-blue-500" />
                {timeframe === "weekly" ? "Weekly" : "Monthly"} Progress
              </h3>
              <p className="text-sm text-textMuted">
                Average score performance
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 gap-2 rounded-xl border border-border/60 relative overflow-hidden">
              <button
                onClick={() => setTimeframe("weekly")}
                className={`px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all duration-300 uppercase tracking-widest z-10 point ${
                  timeframe === "weekly"
                    ? "bg-white dark:bg-blue-600 text-primary dark:text-white shadow-md"
                    : "text-textMuted hover:text-textMain/80 hover:bg-white/80 dark:hover:bg-slate-700/30"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe("monthly")}
                className={`px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all duration-300 uppercase tracking-widest z-10 point ${
                  timeframe === "monthly"
                    ? "bg-white dark:bg-blue-600 text-primary dark:text-white shadow-md"
                    : "text-textMuted hover:text-textMain/80 hover:bg-white/80 dark:hover:bg-slate-700/30"
                }`}
              >
                Monthly
              </button>
            </div>
            <div className="hidden sm:block text-xs font-bold text-primary bg-primary/10 dark:bg-blue-800/20 dark:text-blue-500 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {timeframe === "weekly" ? "Last 7 Days" : "Last 30 Days"}
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isDark ? "#3b82f6" : "#4f46e5"}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={isDark ? "#3b82f6" : "#4f46e5"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#334155" : "#e2e8f0"}
                  opacity={isDark ? 0.3 : 0.8}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: isDark ? "#94a3b8" : "#64748b",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                  dy={12}
                  interval={timeframe === "weekly" ? 0 : "preserveStartEnd"}
                  minTickGap={timeframe === "weekly" ? 5 : 40}
                  padding={{ left: 25, right: 25 }}
                />
                <YAxis hide={true} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={isDark ? "#3b82f6" : "#4f46e5"}
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Performance Coach */}
        <div className="relative bg-indigo-600 dark:bg-indigo-700/70 p-6 rounded-2xl shadow-lg-custom overflow-hidden h-full">
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white drop-shadow-sm">
                AI Coach
              </h3>
            </div>

            {/* Content Area */}
            <div
              className="flex-1 text-white/95 text-sm leading-relaxed max-h-[250px] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor:
                  "rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)",
              }}
            >
              <style>{`
                .ai-coach-content::-webkit-scrollbar {
                  width: 6px;
                }
                .ai-coach-content::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 10px;
                }
                .ai-coach-content::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.3);
                  border-radius: 10px;
                }
                .ai-coach-content::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.4);
                }
              `}</style>
              <div className="ai-coach-content h-full">
                {loading ? (
                  <div className="space-y-2.5">
                    <div className="h-3 bg-white/20 rounded-full w-full animate-pulse"></div>
                    <div className="h-3 bg-white/20 rounded-full w-4/5 animate-pulse"></div>
                    <div className="h-3 bg-white/20 rounded-full w-full animate-pulse"></div>
                    <div className="h-3 bg-white/20 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                ) : completedQuizzes.length > 0 ? (
                  <div className="text-white/90 prose prose-sm prose-invert max-w-none">
                    {formatReviewText(aiReview)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/80 text-center">
                      Complete a quiz to unlock AI-powered insights! 🎯
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-2xl border border-border shadow-md-custom">
        <div
          className={`flex flex-col ${
            sidebarCollapsed ? "min-[950px]:flex-row" : "min-[950px]:flex-col"
          } min-[1130px]:flex-row justify-between items-center mb-6 gap-4`}
        >
          <div>
            <h2 className="text-2xl font-bold text-textMain dark:text-textMain/95 text-center md:text-left">
              Recent History
            </h2>
            <p className="text-xs text-textMuted mt-2 mb-1">
              Total: {quizzes.length} | Avg Score: {avgScore}%
            </p>
          </div>

          <div
            className={`${
              totalPages === 0 ? "hidden" : "flex"
            } flex-col min-[450px]:flex-row items-center gap-4 mb-2 min-[450px]:gap-3`}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3.5 py-2 border border-border rounded-xl text-xs font-bold text-textMain hover:bg-surfaceHighlight shadow-sm transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            <div className="flex items-center gap-1 mx-2">
              {totalPages <= 5 ? (
                [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all point shadow-sm ${
                      currentPage === i + 1
                        ? "bg-primary dark:bg-blue-700 text-white shadow-lg shadow-primary/20"
                        : "text-textMuted hover:text-textMain dark:hover:text-textMain/95 bg-surface border border-border"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
              ) : (
                <>
                  {totalPages > 2 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-surface border border-border transition-all shadow-sm"
                      >
                        1
                      </button>
                      {totalPages > 3 && (
                        <span className="px-1 text-textMuted">...</span>
                      )}
                    </>
                  )}
                  {[
                    Math.max(1, currentPage - 1),
                    currentPage,
                    Math.min(totalPages, currentPage + 1),
                  ]
                    .filter((p, i, arr) => arr.indexOf(p) === i)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          currentPage === p
                            ? "bg-primary dark:bg-blue-700/80 text-white shadow-lg shadow-primary/20"
                            : "text-textMuted hover:text-textMain dark:hover:text-textMain/95 bg-surface border border-border"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <span className="px-1 text-textMuted">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain dark:hover:text-textMain/95 bg-surface border border-border transition-all shadow-sm"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-1 px-3.5 py-2 bg-primary hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-700/80 text-white dark:text-white/95 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col min-[450px]:flex-row gap-3 w-full min-[1130px]:w-auto">
            <div className="relative flex-1 min-[1130px]:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-surfaceHighlight border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm-custom text-textMain dark:text-textMain/95"
              />
              {searchTerm && (
                <XCircle
                  className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 point hover:text-gray-500 transition-colors"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
            <div className="relative">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm bg-surfaceHighlight border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer w-full shadow-sm-custom font- medium text-textMain dark:text-textMain/95"
              >
                <option value="All">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <Filter className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto border border-border rounded-2xl">
          <table className="w-full text-left text-sm table-auto min-w-[600px]">
            <thead className="bg-surfaceHighlight text-textMuted dark:text-textMuted/80 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 pl-6 w-55">Quiz Title</th>
                <th className="p-5 text-center w-20">Date Taken</th>
                <th className="p-5 text-center w-20">Difficulty</th>
                <th className="p-5 text-center w-20">Score</th>
                <th className="p-5 text-center w-30">Marks Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? /* Skeleton Loading State for Table */
                  [...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="p-5 pl-6">
                        <div className="h-4 bg-surfaceHighlight rounded w-3/4"></div>
                      </td>
                      <td className="p-5">
                        <div className="h-4 bg-surfaceHighlight rounded w-1/2 mx-auto"></div>
                      </td>
                      <td className="p-5">
                        <div className="h-6 bg-surfaceHighlight rounded-lg w-16 mx-auto"></div>
                      </td>
                      <td className="p-5">
                        <div className="h-5 bg-surfaceHighlight rounded w-10 mx-auto"></div>
                      </td>
                      <td className="p-5">
                        <div className="h-5 bg-surfaceHighlight rounded w-20 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                : paginatedQuizzes.map((q) => {
                    const obtainedMarks =
                      q?.score !== undefined && q?.totalMarks
                        ? Math.round((q.score / 100) * q.totalMarks)
                        : null;

                    return (
                      <tr
                        key={q?.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer"
                        onClick={() =>
                          (q?._id || q?.id) && handleRowClick(q._id || q.id)
                        }
                      >
                        <td className="p-5 pl-6 font-semibold text-textMain dark:text-textMain/95 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                          {truncateText(q?.title ?? "", 40)}
                        </td>
                        <td className="p-5 text-textMuted text-center whitespace-nowrap">
                          {formatQuizDate(q?.createdAt ?? Date.now())}
                        </td>
                        <td className="p-5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                              q?.difficulty === "Easy"
                                ? "bg-green-200/70 text-green-600 dark:bg-green-800/45 dark:text-green-500"
                                : q?.difficulty === "Medium"
                                  ? "bg-orange-200/50 text-orange-600 dark:bg-orange-800/50 dark:text-amber-500"
                                  : "bg-red-200/60 text-red-600 dark:bg-red-800/45"
                            }`}
                          >
                            {q?.difficulty ?? "Unknown"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          {q?.score === undefined ? (
                            <span className="text-textMuted">-</span>
                          ) : (
                            <span
                              className={`font-bold text-base ${
                                q?.score >= 80
                                  ? "text-green-600 dark:text-green-500"
                                  : q?.score >= 50
                                    ? "text-amber-600 dark:text-amber-500"
                                    : "text-red-600 dark:text-red-500"
                              }`}
                            >
                              {q?.score}%
                            </span>
                          )}
                        </td>
                        <td className="p-5 font-medium">
                          {obtainedMarks !== null ? (
                            <div className="flex items-baseline gap-1 justify-center">
                              <span className="text-textMain dark:text-textMain/95 font-bold text-lg">
                                {obtainedMarks}
                              </span>
                              <span className="text-textMuted text-xs">
                                / {q?.totalMarks ?? 0}
                              </span>
                            </div>
                          ) : (
                            <span className="text-textMuted flex justify-center">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              {!loading && filteredQuizzes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-textMuted">
                    <BarChart3 className="w-6 h-6 mx-auto mb-3" />
                    {searchTerm || filterDifficulty !== "All"
                      ? "No quizzes found matching your filters."
                      : "No history available yet. Start a quiz to see your progress!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
