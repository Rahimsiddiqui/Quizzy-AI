import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom"; // Import if you pass state from Layout
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
  FileQuestion,
  Activity,
  Trophy,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { getDashboardStats } from "../services/adminService";
import useAdminSocket from "../hooks/useAdminSocket";

export default function AdminDashboard() {
  const [data, setData] = useState({
    stats: {},
    charts: { quizAttemptsPerDay: [], averageScoresPerQuiz: [] },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 15 seconds
    const id = setInterval(fetchStats, 15000);
    return () => clearInterval(id);
  }, []);

  useAdminSocket((evt, payload) => {
    if (evt === "dashboardUpdate") setData(payload);
  });

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setData(res);
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

  const { stats, charts } = data;

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

  const MetricCard = ({
    title,
    value,
    iconComponent,
    trend,
    bgColor,
    textColor,
  }) => {
    const isNegativeTrend = trend && trend.startsWith("-");
    return (
      <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${bgColor}`}>{iconComponent}</div>
          {trend && (
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
          <h3 className="text-3xl font-bold text-textMain tracking-tight">
            {loading ? "..." : value}
          </h3>
          <p className="text-sm text-textMuted font-medium mt-1">{title}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-textMain tracking-tight mb-4">
            Overview
          </h2>
          <p className="text-sm text-textMuted mb-5">
            Welcome back, here's what's happening with your quizzes today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-textMuted shadow-sm w-fit">
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
          title="Total Users"
          value={stats.totalUsers ?? 0}
          iconComponent={<Users size={22} className="text-blue-500" />}
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          trend={newUsersTrend}
        />
        <MetricCard
          title="Active Quizzes"
          value={stats.totalQuizzes ?? 0}
          iconComponent={<FileQuestion size={22} className="text-violet-500" />}
          bgColor="bg-violet-100 dark:bg-violet-900/30"
        />
        <MetricCard
          title="Total Attempts"
          value={stats.totalAttempts ?? 0}
          iconComponent={<Activity size={22} className="text-amber-500" />}
          bgColor="bg-amber-100 dark:bg-amber-900/30"
        />
        <MetricCard
          title="Avg. Score"
          value={`${Math.round(stats.averageScore || 0)}%`}
          iconComponent={<Trophy size={22} className="text-emerald-500" />}
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
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
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
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

      {/* Activity Feed Placeholder */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-textMain">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 text-sm text-textMuted">
            <div className="p-2 bg-surfaceHighlight rounded-full">
              <Clock size={16} />
            </div>
            <span>No recent activity recorded today.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
