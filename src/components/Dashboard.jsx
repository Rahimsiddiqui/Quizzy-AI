import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

import {
  Trophy,
  Target,
  Trash2,
  Zap,
  AlertTriangle,
  Search,
  Filter,
  BookOpen,
  XCircle,
} from "lucide-react";

import StorageService from "../services/storageService.js";
import { Difficulty } from "../../server/config/types.js";

const KPI_STATS = [
  {
    label: "Completed Quizzes",
    dataKey: (quizzes) => quizzes.filter((q) => q.score !== undefined).length,
    icon: <Trophy className="w-6 h-6" />,
    colorClasses: {
      bg: "bg-blue-100 dark:bg-blue-900",
      text: "text-blue-600 dark:text-blue-300",
    },
    diffClass: false,
  },
  {
    label: "Avg Score",
    dataKey: (quizzes, totalAvgScore) =>
      quizzes.filter((q) => q.score !== undefined).length > 0
        ? totalAvgScore + "%"
        : "N/A",
    icon: <Target className="w-6 h-6" />,
    colorClasses: {
      bg: "bg-green-100 dark:bg-green-900",
      text: "text-green-600 dark:text-green-300",
    },
    diffClass: false,
  },
  {
    label: "Weakest Topic",
    dataKey: (quizzes, totalAvgScore, stats) => stats.weakestTopic,
    icon: <AlertTriangle className="w-6 h-6" />,
    colorClasses: {
      bg: "bg-red-100 dark:bg-red-900",
      text: "text-red-600 dark:text-red-300",
    },
    diffClass: true,
  },
  {
    label: "Flashcards Left",
    dataKey: (quizzes, totalAvgScore, stats, user) =>
      user.tier === "Pro"
        ? "Unlimited"
        : user.limits.flashcardGenerationsRemaining,

    icon: <Zap className="w-6 h-6" />,
    colorClasses: {
      bg: "bg-indigo-100 dark:bg-indigo-900",
      text: "text-indigo-600 dark:text-indigo-300",
    },
    diffClass: false,
  },
];

// Difficulty Badge Styling Constant
const DIFFICULTY_STYLES = {
  [Difficulty.Easy]: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-600 dark:text-green-300",
  },
  [Difficulty.Medium]: {
    bg: "bg-orange-100 dark:bg-orange-900/60",
    text: "text-orange-700 dark:text-orange-300",
  },
  [Difficulty.Hard]: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-600 dark:text-red-300",
  },
};
// --- END EXTRACTED CONSTANTS ---

function useTailwindDark() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
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

const Dashboard = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDots, setLoadingDots] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    quizId: null,
    quizTitle: "",
    isDeleting: false,
  });
  const [stats, setStats] = useState({
    avgEasy: 0,
    avgMedium: 0,
    avgHard: 0,
    weakestTopic: "N/A",
    weakestType: "N/A",
  });

  useEffect(() => {
    if (user) refreshQuizzes();
  }, [user]);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const refreshQuizzes = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userQuizzes = await StorageService.getQuizzes(user._id);
      setQuizzes(userQuizzes);
      calculateAdvancedStats(userQuizzes);
    } catch (err) {
      console.error("Failed to refresh quizzes:", err);
      toast.error("Failed to load quizzes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = useTailwindDark();

  const calculateAdvancedStats = (data) => {
    if (!data || data.length === 0) return;
    const completed = data.filter((q) => q.score !== undefined);
    if (!completed.length) return;

    const diffStats = {
      [Difficulty.Easy]: { total: 0, sum: 0 },
      [Difficulty.Medium]: { total: 0, sum: 0 },
      [Difficulty.Hard]: { total: 0, sum: 0 },
    };
    const typeStats = {};
    const topicStats = {};

    completed.forEach((q) => {
      diffStats[q.difficulty].total++;
      diffStats[q.difficulty].sum += q.score || 0;

      const topic = q.topic.toLowerCase();
      if (!topicStats[topic]) topicStats[topic] = { total: 0, sum: 0 };
      topicStats[topic].total++;
      topicStats[topic].sum += q.score || 0;

      q.questions.forEach((ques) => {
        if (!typeStats[ques.type])
          typeStats[ques.type] = { total: 0, correct: 0 };
        typeStats[ques.type].total++;
        if (ques.isCorrect) typeStats[ques.type].correct++;
      });
    });

    let minTopicScore = 101,
      weakTopic = "N/A";
    Object.entries(topicStats).forEach(([t, s]) => {
      const avg = s.sum / s.total;
      if (avg < minTopicScore) {
        minTopicScore = avg;
        weakTopic = t;
      }
    });

    let minTypeScore = 1.1,
      weakType = "N/A";
    Object.entries(typeStats).forEach(([t, s]) => {
      const avg = s.correct / s.total;
      if (avg < minTypeScore) {
        minTypeScore = avg;
        weakType = t;
      }
    });

    setStats({
      avgEasy: diffStats[Difficulty.Easy].total
        ? Math.round(
            diffStats[Difficulty.Easy].sum / diffStats[Difficulty.Easy].total
          )
        : 0,
      avgMedium: diffStats[Difficulty.Medium].total
        ? Math.round(
            diffStats[Difficulty.Medium].sum /
              diffStats[Difficulty.Medium].total
          )
        : 0,
      avgHard: diffStats[Difficulty.Hard].total
        ? Math.round(
            diffStats[Difficulty.Hard].sum / diffStats[Difficulty.Hard].total
          )
        : 0,
      weakestTopic: weakTopic.charAt(0).toUpperCase() + weakTopic.slice(1),
      weakestType: weakType,
    });
  };

  const handleDeleteClick = (e, id, title) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      quizId: id,
      quizTitle: title,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await StorageService.deleteQuiz(deleteModal.quizId);
      await refreshQuizzes();
      toast.success("Quiz deleted successfully!");
      setDeleteModal({
        isOpen: false,
        quizId: null,
        quizTitle: "",
        isDeleting: false,
      });
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete quiz.");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCancelDelete = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({
        isOpen: false,
        quizId: null,
        quizTitle: "",
        isDeleting: false,
      });
    }
  };

  const difficultyData = useMemo(
    () => [
      {
        name: "Easy",
        score: stats.avgEasy,
        fill: isDark ? "#ffffff" : "#10b981",
      },
      {
        name: "Medium",
        score: stats.avgMedium,
        fill: isDark ? "#ffffff" : "#f59e0b",
      },
      {
        name: "Hard",
        score: stats.avgHard,
        fill: isDark ? "#ffffff" : "#ef4444",
      },
    ],
    [stats, isDark]
  );

  const typeChartData = useMemo(() => {
    const typeMap = {};
    quizzes
      .filter((q) => q.score !== undefined)
      .forEach((q) => {
        q.questions.forEach((ques) => {
          if (!typeMap[ques.type])
            typeMap[ques.type] = { total: 0, correct: 0 };
          typeMap[ques.type].total++;
          if (ques.isCorrect) typeMap[ques.type].correct++;
        });
      });
    return Object.keys(typeMap).map((key) => ({
      subject: key,
      A: Math.round((typeMap[key].correct / typeMap[key].total) * 100),
      fullMark: 100,
    }));
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiff =
        filterDifficulty === "All" || q.difficulty === filterDifficulty;
      return matchesSearch && matchesDiff;
    });
  }, [quizzes, searchTerm, filterDifficulty]);

  const totalAvgScore =
    quizzes.filter((q) => q.score !== undefined).length > 0
      ? Math.round(
          quizzes.reduce((acc, q) => acc + (q.score || 0), 0) /
            quizzes.filter((q) => q.score !== undefined).length
        )
      : 0;

  if (!user)
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textMain tracking-tight">
            Dashboard
          </h1>
          <p className="text-textMuted mt-1">
            Overview of your learning progress.
          </p>
        </div>
        <div className="text-left md:text-right flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-textMuted">Current Plan</div>
            <div
              className={`text-lg font-bold ${
                user.tier === "Pro"
                  ? "shimmerTextLight dark:shimmerTextDark"
                  : "text-textMain"
              }`}
            >
              {user.tier} Plan
            </div>
          </div>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_STATS.map((stat, idx) => (
          <div
            key={idx}
            className="bg-surface p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 ${stat.colorClasses.bg} rounded-xl ${stat.colorClasses.text} shrink-0`}
              >
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
                  {stat.label}
                </p>
                <h3
                  className={`
                  ${
                    stat.diffClass
                      ? "text-lg"
                      : user.tier === "Pro" && stat.label === "Flashcards Left"
                      ? "text-xl"
                      : "text-2xl"
                  }
                  font-bold text-textMain truncate
                `}
                >
                  {/* Calculate value using the dataKey function from the constant */}
                  {stat.dataKey(quizzes, totalAvgScore, stats, user)}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm h-87.5">
          <h2 className="text-lg font-bold text-textMain mb-6 text-center md:text-left">
            Performance by Difficulty
          </h2>
          <div className="h-62.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={difficultyData}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={isDark ? "#cbd5e1" : "#475569"}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={isDark ? "#cbd5e1" : "#475569"}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "#334155" : "#f0f9ff" }}
                  contentStyle={{
                    backgroundColor: isDark ? "#334155" : "#ffffff",
                    borderColor: isDark ? "#475569" : "#e2e8f0",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{
                    fontSize: 14,
                    color: isDark ? "#f1f5f9" : "#0f172a",
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Question Type Radar */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm h-87.5">
          <h2 className="text-lg font-bold text-textMain mb-2">
            Weak Areas by Question Type
          </h2>
          {typeChartData.length > 0 ? (
            <div className="h-70 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={typeChartData}
                >
                  <PolarGrid stroke={isDark ? "#cbd5e1" : "#64748b"} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: isDark ? "#cbd5e1" : "#64748b",
                      fontSize: 10,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="#4f46e5"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#334155" : "#ffffff",
                      borderColor: isDark ? "#475569" : "#e2e8f0",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{
                      fontSize: 14,
                      color: isDark ? "#f1f5f9" : "#0f172a",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-textMuted">
              Not enough data yet.
            </div>
          )}
        </div>
      </div>

      {/* All Quizzes Section */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-textMain text-center md:text-left">
              All Quizzes
            </h2>
            <p className="text-xs text-textMuted mt-1">
              Total: {quizzes.length} | Avg Score: {totalAvgScore}%
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-surfaceHighlight border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {searchTerm && (
                <XCircle
                  className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
            <div className="relative">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm bg-surfaceHighlight border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-all"
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

        {/* Quiz List */}
        {isLoading && quizzes.length === 0 ? (
          <div className="col-span-full text-center text-textMuted py-10">
            Loading Quizzes{loadingDots}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuizzes.length === 0 ? (
              <div className="col-span-full text-center text-textMuted py-10">
                {quizzes.length === 0 ? (
                  <>
                    No quizzes yet.{" "}
                    <Link
                      to="/generate"
                      className="text-primary dark:text-blue-400 hover:underline"
                    >
                      Create one!
                    </Link>
                  </>
                ) : (
                  <>No quizzes found matching your filters.</>
                )}
              </div>
            ) : (
              filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="group relative bg-surfaceHighlight rounded-xl hover:bg-surface transition-all duration-300 border border-transparent hover:border-primary/20 hover:shadow-lg hover:-translate-y-1"
                >
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, quiz._id, quiz.title)}
                    className="absolute top-3 right-3 z-50 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4 pointer-events-none" />
                  </button>

                  <Link
                    to={`/quiz/${quiz._id}`}
                    className="block p-5 h-full z-10"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          DIFFICULTY_STYLES[quiz.difficulty]?.bg ||
                          "bg-gray-100"
                        } ${
                          DIFFICULTY_STYLES[quiz.difficulty]?.text ||
                          "text-gray-600"
                        }`}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>
                    <h3
                      className="font-bold text-textMain truncate mb-1 pr-8 text-lg"
                      title={quiz.title}
                    >
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-textMuted mb-4 flex items-center gap-2">
                      <span className="bg-slate-200/50 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-xs font-medium">
                        {quiz.questions.length} Qs
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs">
                        {new Date(quiz.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {quiz.isFlashcardSet && (
                        <BookOpen className="w-3 h-3 text-indigo-500 ml-auto" />
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                      <span className="text-xs text-textMuted font-medium">
                        {quiz.score !== undefined ? "Score" : "Incomplete"}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          quiz.score === undefined
                            ? "text-textMain dark:text-textMainDark"
                            : quiz.score >= 80
                            ? "text-green-600 dark:text-green-400"
                            : quiz.score >= 50
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {quiz.score !== undefined ? `${quiz.score}%` : "-"}
                      </span>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in duration-300">
            <div className="p-6 text-center">
              {deleteModal.isDeleting ? (
                <div className="flex flex-col items-center justify-center py-12">
                  {/* Animated gradient spinner */}
                  <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-red-200 dark:border-red-900/40"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 dark:border-t-red-400 animate-spin"></div>
                    <div
                      className="absolute inset-2 rounded-full border-4 border-transparent border-b-red-400 dark:border-b-red-300 animate-spin"
                      style={{
                        animationDirection: "reverse",
                        animationDuration: "1.5s",
                      }}
                    ></div>
                  </div>

                  {/* Status text with animation */}
                  <p className="text-textMain font-semibold mb-2">
                    Deleting quiz{loadingDots}
                  </p>
                  <p className="text-textMuted text-xs">
                    Please wait, this won't take long
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-textMain mb-3">
                    Delete Quiz?
                  </h3>
                  <p className="text-textMuted text-sm mb-6">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-textMain">
                      "{deleteModal.quizTitle}"
                    </span>
                    ? This cannot be undone.
                  </p>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleCancelDelete}
                      disabled={deleteModal.isDeleting}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border text-textMain hover:bg-surfaceHighlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium point"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={deleteModal.isDeleting}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors font-medium point"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
