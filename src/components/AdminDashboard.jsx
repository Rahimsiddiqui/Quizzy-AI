import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Clock,
  ArrowUpRight,
  BookOpen,
  BarChart3,
  Trophy,
  Activity,
  PlusCircle,
  CheckCircle,
  Search,
  HardDrive,
} from "lucide-react";
import {
  getDashboardStats,
  getQuizzes,
  getQuizResults,
} from "../services/adminService";
import useAdminSocket from "../hooks/useAdminSocket";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    stats: {},
    charts: { quizAttemptsPerDay: [], averageScoresPerQuiz: [] },
    quizzesMetadata: { total: 0, completionRate: 0, avgScore: 0 },
    recentActivity: [],
    generationActivity: [],
    pendingActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Completed"); // Generation, Completed, Pending
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 15 seconds
    const id = setInterval(fetchStats, 15000);
    return () => clearInterval(id);
  }, []);

  useAdminSocket((evt, payload) => {
    if (evt === "dashboardUpdate") setData((prev) => ({ ...prev, ...payload }));
  });

  async function fetchStats() {
    setLoading(true);
    try {
      // Parallel fetch for dashboard stats, global quiz metadata, recent activity, generation activity, and pending activity
      const [
        dashboardStats,
        metadataResponse,
        completedResponse,
        generationResponse,
        pendingResponse,
      ] = await Promise.all([
        getDashboardStats(),
        getQuizzes(1, 1),
        getQuizResults(1, 15), // Fetch more for filtering
        getQuizzes(1, 10), // Most recent quizzes
        getQuizzes(1, 10, null, false), // Fetch inactive quizzes for "Pending"
      ]);

      setData({
        stats: dashboardStats.stats || {},
        charts: dashboardStats.charts || {
          quizAttemptsPerDay: [],
          averageScoresPerQuiz: [],
        },
        quizzesMetadata: {
          total: metadataResponse.pagination?.total || 0,
          completionRate: metadataResponse.completionRate || 0,
          avgScore: metadataResponse.avgScore || 0,
        },
        recentActivity: completedResponse.results || [],
        generationActivity: generationResponse.quizzes || [],
        pendingActivity: pendingResponse.quizzes || [],
      });
    } catch (e) {
      console.error(e?.message || e);
    } finally {
      setLoading(false);
    }
  }

  // Custom Tooltip using your Clean Classes
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surfaceHighlight border border-border p-3 rounded-lg shadow-xl shadow-black/5">
          <p className="text-sm font-semibold text-textMain">{label}</p>
          <p className="text-sm text-primary font-bold">
            {payload[0].value} {payload[0].name === "average" ? "%" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  const {
    stats = {},
    charts = { quizAttemptsPerDay: [], averageScoresPerQuiz: [] },
    quizzesMetadata = { total: 0, completionRate: 0, avgScore: 0 },
    recentActivity = [],
    generationActivity = [],
    pendingActivity = [],
  } = data;

  const filteredCompleted = recentActivity.filter((item) => {
    const searchStr = filterText.toLowerCase();
    return (
      (item.user || "").toLowerCase().includes(searchStr) ||
      (item.quiz || "").toLowerCase().includes(searchStr) ||
      (item._id || "").toLowerCase().includes(searchStr)
    );
  });

  const calculateTrend = (current, previous = 0) => {
    if (previous === 0 || current === 0) return null;
    const percentChange = ((current - previous) / previous) * 100;
    return percentChange > 0
      ? `+${Math.round(percentChange)}%`
      : `${Math.round(percentChange)}%`;
  };

  const estimatedDailyAverage = stats.totalUsers
    ? Math.max(1, Math.floor(stats.totalUsers / 30))
    : 0;
  const newUsersTrend = calculateTrend(
    stats.newUsersToday || 0,
    estimatedDailyAverage
  );

  const MetricCard = ({ title, value, iconComponent, trend, bgColor }) => {
    const isNegativeTrend = trend && trend.startsWith("-");
    return (
      <div className="bg-surface border border-border p-5 rounded-2xl shadow-md-custom transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${bgColor}`}>{iconComponent}</div>
          {trend != 0 && trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                isNegativeTrend
                  ? "text-red-600 bg-red-50 dark:bg-red-900/20"
                  : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
              }`}
            >
              <ArrowUpRight
                size={12}
                style={{
                  transform: isNegativeTrend ? "rotate(180deg)" : "none",
                }}
              />
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-textMain tracking-tight">
            {loading ? "..." : value}
          </h3>
          <p className="text-sm text-textMuted font-medium mt-1">{title}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-textMain tracking-tight mb-4">
            Overview
          </h2>
          <p className="text-sm text-textMuted mb-5">
            Welcome back, here's what's happening with your app today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-textMuted shadow-md-custom w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Updates
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Space Usage"
          value={`${stats.storageUsedMB || "0.00"} MB / 512 MB`}
          iconComponent={<HardDrive size={22} className="text-blue-500" />}
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          trend={null}
        />

        <MetricCard
          title="New Users Today"
          value={stats.newUsersToday || 0}
          iconComponent={<Users size={22} className="text-emerald-500" />}
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          trend={null}
        />

        <MetricCard
          title="Global Avg Score"
          value={
            quizzesMetadata.avgScore !== undefined
              ? `${quizzesMetadata.avgScore}%`
              : "0%"
          }
          iconComponent={<Trophy size={22} className="text-amber-500" />}
          bgColor="bg-amber-100 dark:bg-amber-900/30"
        />

        <MetricCard
          title="Total Attempts"
          value={stats.totalAttempts || 0}
          iconComponent={<Activity size={22} className="text-indigo-500" />}
          bgColor="bg-indigo-100 dark:bg-indigo-900/30"
          trend={null}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-md-custom">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-textMain">
              Attempts Over Time
            </h3>
            <p className="text-xs text-textMuted">Daily quiz participation</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.quizAttemptsPerDay || []}>
                <defs>
                  <linearGradient
                    id="colorAttempts"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-textMuted)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-textMuted)", fontSize: 12 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="attempts"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAttempts)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-md-custom">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-textMain">
              Score Distribution
            </h3>
            <p className="text-xs text-textMuted">
              Average performance per quiz
            </p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.averageScoresPerQuiz || []} barSize={40}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="quiz"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-textMuted)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-textMuted)", fontSize: 12 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--color-surfaceHighlight)" }}
                />
                <Bar
                  dataKey="average"
                  fill="var(--color-secondary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="bg-surface border border-border rounded-2xl shadow-md-custom overflow-hidden min-h-[500px] flex flex-col">
        {/* Activity Header & Tabs */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-textMain">Recent Activity</h3>
            <div className="flex p-1 bg-surfaceHighlight/50 rounded-xl w-fit">
              {[
                {
                  id: "Generation",
                  label: "Quiz Generation",
                  icon: PlusCircle,
                },
                {
                  id: "Completed",
                  label: "Completed Quizzes",
                  icon: CheckCircle,
                },
                { id: "Pending", label: "Pending Activities", icon: Clock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all point ${
                    activeTab === tab.id
                      ? "bg-surface shadow-sm text-primary dark:text-blue-400"
                      : "text-textMuted hover:text-textMain hover:bg-surface/50"
                  }`}
                >
                  <tab.icon size={16} />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTab === "Completed" && (
            <div className="relative group max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary dark:group-focus-within:text-blue-400 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Filter by student, quiz or ID..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surfaceHighlight/30 border border-border rounded-xl text-textMain text-sm focus:outline-none focus:ring-2 focus:ring-primary/80 w-full transition-all shadow-md-custom"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "Generation" && (
            <div className="divide-y divide-border">
              {loading ? (
                <ActivitySkeleton />
              ) : generationActivity && generationActivity.length > 0 ? (
                generationActivity.map((activity, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/admin/quizzes/${activity._id}`)}
                    className="p-5 hover:bg-surfaceHighlight/30 transition-colors flex items-center gap-4 point"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center text-primary dark:text-blue-400 shrink-0">
                      <PlusCircle size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-textMain dark:text-textMain/90 truncate">
                        {activity.creator || "System"}{" "}
                        <span className="font-normal text-textMuted">
                          created
                        </span>{" "}
                        {activity.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activity.difficulty === "Easy"
                              ? "bg-emerald-200/70 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-500"
                              : activity.difficulty === "Medium"
                              ? "bg-amber-200/70 text-amber-600 dark:bg-amber-800/30"
                              : "bg-red-200 text-red-600 dark:bg-red-800/30 dark:text-red-500"
                          }`}
                        >
                          {activity.difficulty}
                        </span>
                        <span className="text-xs text-textMuted flex items-center gap-1">
                          <Activity size={12} />
                          {activity.topic}
                        </span>
                        <span className="text-xs text-textMuted">•</span>
                        <span className="text-xs text-textMuted">
                          {new Date(activity.date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No quizzes generated recently." />
              )}
            </div>
          )}

          {activeTab === "Completed" && (
            <div className="divide-y divide-border">
              {loading ? (
                <ActivitySkeleton />
              ) : filteredCompleted && filteredCompleted.length > 0 ? (
                filteredCompleted.map((activity, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/admin/quizzes/${activity._id}`)}
                    className="p-5 hover:bg-surfaceHighlight/30 transition-colors flex items-center gap-4 point"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0">
                      <CheckCircle size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-sm font-bold text-textMain dark:text-textMain/90 truncate">
                            {activity.user || "Unknown"}{" "}
                            <span className="font-normal text-textMuted">
                              completed
                            </span>{" "}
                            {activity.quiz}
                          </p>
                          <p className="text-[10px] text-textMuted font-mono mt-0.5">
                            ID: {activity._id}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-black ${
                              activity.score >= 80
                                ? "text-emerald-600 dark:text-emerald-500"
                                : activity.score >= 50
                                ? "text-amber-600"
                                : "text-red-600 dark:text-red-500"
                            }`}
                          >
                            {activity.score}%
                          </div>
                          <p className="text-[10px] text-textMuted font-bold uppercase tracking-widest">
                            Score
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-border/30 h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              activity.score >= 80
                                ? "bg-emerald-600 dark:bg-emerald-500"
                                : activity.score >= 50
                                ? "bg-amber-600"
                                : "bg-red-600 dark:bg-red-500"
                            }`}
                            style={{ width: `${activity.score}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-textMuted font-medium">
                          {new Date(activity.date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  message={
                    filterText
                      ? "No results matching your filter."
                      : "No completed quizzes yet."
                  }
                />
              )}
            </div>
          )}

          {activeTab === "Pending" && (
            <div className="divide-y divide-border">
              {loading ? (
                <ActivitySkeleton />
              ) : pendingActivity && pendingActivity.length > 0 ? (
                pendingActivity.map((activity, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/admin/quizzes/${activity._id}`)}
                    className="p-5 hover:bg-surfaceHighlight/30 transition-colors flex items-center justify-between gap-4 point"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-textMain dark:text-textMain/90 truncate">
                          {activity.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="text-xs text-amber-600 font-bold bg-amber-100 dark:bg-amber-800/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/30">
                            Inactive
                          </span>
                          <span className="text-xs text-textMuted flex items-center gap-1">
                            <Users size={12} />
                            By: {activity.creator || "System"}
                          </span>
                          <span className="text-xs text-textMuted">•</span>
                          <span className="text-xs text-textMuted">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="p-6 bg-surfaceHighlight/30 rounded-full mb-4">
                    <CheckCircle
                      size={40}
                      className="text-emerald-500 opacity-50"
                    />
                  </div>
                  <h4 className="text-lg font-bold text-textMain mb-2">
                    All Activities Clear
                  </h4>
                  <p className="text-sm text-textMuted max-w-xs mx-auto">
                    No inactive quizzes or pending evaluations requiring your
                    attention right now.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ActivitySkeleton = () => (
  <div className="divide-y divide-border">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-surfaceHighlight/50 shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-surfaceHighlight/50 rounded w-2/3"></div>
          <div className="flex items-center gap-3">
            <div className="h-3 bg-surfaceHighlight/30 rounded w-16"></div>
            <div className="h-3 bg-surfaceHighlight/30 rounded w-24"></div>
            <div className="h-3 bg-surfaceHighlight/30 rounded w-20"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="p-12 flex flex-col items-center justify-center text-textMuted gap-3">
    <div className="p-4 bg-surfaceHighlight/30 rounded-full">
      <Activity size={32} className="opacity-20" />
    </div>
    <p className="text-sm font-medium">{message}</p>
  </div>
);
