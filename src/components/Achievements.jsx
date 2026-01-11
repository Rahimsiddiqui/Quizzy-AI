import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Select, MenuItem, TextField } from "@mui/material";
import confetti from "canvas-confetti";
import StorageService from "../services/storageService.js";
import useDarkMode, { isDarkMode } from "../hooks/useDarkMode.js";
import AchievementCelebration from "./AchievementCelebration.jsx";

// Confetti function with falling animation and shapes
const triggerConfetti = () => {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
  };

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Falling confetti with circles
    confetti(
      Object.assign({}, defaults, {
        particleCount: Math.floor(particleCount / 2),
        origin: { x: randomInRange(0.1, 0.9), y: -0.5 },
        gravity: 0.5,
        scalar: 1.2,
        shapes: ["circle"],
        colors: ["#2563eb", "#6366f1", "#a855f7", "#f59e0b"],
      })
    );

    // Falling squares
    confetti(
      Object.assign({}, defaults, {
        particleCount: Math.floor(particleCount / 2),
        origin: { x: randomInRange(0.1, 0.9), y: -0.5 },
        gravity: 0.5,
        scalar: 1.2,
        shapes: ["square"],
        colors: ["#2563eb", "#6366f1", "#a855f7", "#f59e0b"],
      })
    );
  }, 50);
};

// Achievements data definitions
const ACHIEVEMENTS = {
  FIRST_QUIZ: {
    id: "first_quiz",
    name: "Quiz Creator",
    description: "Create your first quiz",
    icon: "📝",
    rarity: "common",
  },
  FIRST_FLASHCARD: {
    id: "first_flashcard",
    name: "Flashcard Maker",
    description: "Create your first flashcard set",
    icon: "🎴",
    rarity: "common",
  },
  PROFILE_SETUP: {
    id: "profile_setup",
    name: "Profile Pioneer",
    description: "Complete your user profile",
    icon: "👤",
    rarity: "common",
  },
  QUIZ_CREATOR_5: {
    id: "quiz_creator_5",
    name: "Quiz Enthusiast",
    description: "Create 5 quizzes",
    icon: "📚",
    rarity: "common",
  },
  QUIZ_CREATOR_25: {
    id: "quiz_creator_25",
    name: "Quiz Master",
    description: "Create 25 quizzes",
    icon: "🏆",
    rarity: "rare",
  },
  QUIZ_CREATOR_100: {
    id: "quiz_creator_100",
    name: "Quiz Legend",
    description: "Create 100 quizzes",
    icon: "👑",
    rarity: "epic",
  },
  QUIZ_TAKER_10: {
    id: "quiz_taker_10",
    name: "Quiz Solver",
    description: "Take 10 quizzes",
    icon: "✏️",
    rarity: "common",
  },
  QUIZ_TAKER_50: {
    id: "quiz_taker_50",
    name: "Quiz Conqueror",
    description: "Take 50 quizzes",
    icon: "⚔️",
    rarity: "rare",
  },
  PERFECT_SCORE: {
    id: "perfect_score",
    name: "Flawless",
    description: "Score 100% on a quiz",
    icon: "🌟",
    rarity: "rare",
  },
  PERFECT_SCORE_5: {
    id: "perfect_score_5",
    name: "Ace",
    description: "Get 5 perfect scores",
    icon: "💎",
    rarity: "epic",
  },
  AVERAGE_SCORE_90: {
    id: "average_score_90",
    name: "Consistent Scholar",
    description: "Maintain 90%+ average score",
    icon: "📊",
    rarity: "rare",
  },
  FLASHCARD_CREATOR_10: {
    id: "flashcard_creator_10",
    name: "Flashcard Fanatic",
    description: "Create 10 flashcard sets",
    icon: "🎯",
    rarity: "common",
  },
  FLASHCARD_CREATOR_50: {
    id: "flashcard_creator_50",
    name: "Flashcard Master",
    description: "Create 50 flashcard sets",
    icon: "🎪",
    rarity: "rare",
  },
  STREAK_7: {
    id: "streak_7",
    name: "On Fire",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    rarity: "rare",
  },
  STREAK_30: {
    id: "streak_30",
    name: "Unstoppable",
    description: "Maintain a 30-day streak",
    icon: "⚡",
    rarity: "epic",
  },
  STREAK_100: {
    id: "streak_100",
    name: "Immortal",
    description: "Maintain a 100-day streak",
    icon: "🧿",
    rarity: "legendary",
  },
  BASIC_SUBSCRIBER: {
    id: "basic_subscriber",
    name: "Premium Member",
    description: "Upgrade to Basic tier",
    icon: "💳",
    rarity: "rare",
  },
  PRO_SUBSCRIBER: {
    id: "pro_subscriber",
    name: "Elite Pro",
    description: "Upgrade to Pro tier",
    icon: "🚀",
    rarity: "epic",
  },
  PDF_UPLOAD_5: {
    id: "pdf_upload_5",
    name: "PDF Collector",
    description: "Upload 5 PDFs",
    icon: "📄",
    rarity: "common",
  },
  PDF_EXPORT_10: {
    id: "pdf_export_10",
    name: "PDF Exporter",
    description: "Export 10 PDFs",
    icon: "📥",
    rarity: "common",
  },
  LEVEL_5: {
    id: "level_5",
    name: "Rising Star",
    description: "Reach Level 5",
    icon: "⭐",
    rarity: "common",
  },
  LEVEL_10: {
    id: "level_10",
    name: "Prolific Scholar",
    description: "Reach Level 10",
    icon: "🌠",
    rarity: "rare",
  },
  LEVEL_25: {
    id: "level_25",
    name: "Legendary Educator",
    description: "Reach Level 25",
    icon: "✨",
    rarity: "legendary",
  },
  LEADERBOARD_TOP_10: {
    id: "leaderboard_top_10",
    name: "Top Performer",
    description: "Rank in top 10 globally",
    icon: "🥇",
    rarity: "epic",
  },
  LEADERBOARD_TOP_1: {
    id: "leaderboard_top_1",
    name: "Reigning Champion",
    description: "Reach #1 on leaderboard",
    icon: "👑",
    rarity: "legendary",
  },
};

const Achievements = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [celebratingAchievement, setCelebratingAchievement] = useState(null);

  useDarkMode();

  useEffect(() => {
    fetchUserStats();
    // Set up interval to refresh achievements every 2 seconds
    const interval = setInterval(fetchUserStats, 2000);
    return () => clearInterval(interval);
  }, [user]);

  const closeCelebration = () => {
    setCelebratingAchievement(null);
  };

  const fetchUserStats = async () => {
    try {
      const response = await StorageService.getUserAchievements();
      console.log("Fetched achievements:", response?.achievements?.length);

      // Detect newly unlocked achievements
      if (stats && response) {
        const previousIds = new Set(stats.achievements.map((a) => a.id));
        console.log("Previous achievement IDs:", previousIds);

        const newly = response.achievements.filter(
          (a) => !previousIds.has(a.id)
        );

        console.log("Newly unlocked achievements:", newly);

        if (newly.length > 0) {
          // Show celebration for the first new achievement
          console.log("Setting celebrating achievement:", newly[0].name);
          setCelebratingAchievement(newly[0]);
          triggerConfetti();
        }
      }

      setStats(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error("Failed to load achievements");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-blue-400"></div>
      </div>
    );
  }

  if (!stats) return null;

  // Get all achievements with unlock status
  const allAchievements = Object.values(ACHIEVEMENTS).map((achievement) => ({
    ...achievement,
    unlocked: stats.achievements.some((a) => a.id === achievement.id),
    unlockedAt: stats.achievements.find((a) => a.id === achievement.id)
      ?.unlockedAt,
  }));

  // Rarity order for sorting
  const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };

  // Filter achievements by rarity and search
  let filteredAchievements = allAchievements;

  if (filter !== "all") {
    filteredAchievements = filteredAchievements.filter(
      (a) => a.rarity === filter
    );
  }

  if (search.trim()) {
    filteredAchievements = filteredAchievements.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort by rarity when showing all
  if (filter === "all") {
    filteredAchievements.sort(
      (a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]
    );
  }

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const totalCount = allAchievements.length;

  // Rarity colors
  const rarityColors = {
    common: "#6b7280",
    rare: "#3b82f6",
    epic: "#a855f7",
    legendary: "#f59e0b",
  };

  const rarityBgColors = {
    common: "bg-gray-50 dark:bg-gray-900",
    rare: "bg-blue-50 dark:bg-blue-900/20",
    epic: "bg-purple-50 dark:bg-purple-900/20",
    legendary: "bg-amber-50 dark:bg-amber-900/20",
  };

  return (
    <>
      {/* Achievement Celebration */}
      {celebratingAchievement && (
        <AchievementCelebration
          achievement={celebratingAchievement}
          onClose={closeCelebration}
        />
      )}

      {/* Main Content */}
      <div className="min-h-screen bg-background text-textMain py-8">
        {/* Header Stats */}
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <h1 className="text-4xl font-bold mb-8">Achievements</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Level Card */}
            <div className="bg-linear-to-br from-primary to-primary/70 dark:bg-linear-to-br dark:from-bg-blue-700 dark:bg-blue-80 text-white rounded-lg p-6 shadow-md-custom">
              <p className="text-sm opacity-90 mb-2">Current Level</p>
              <h2 className="text-5xl font-bold mb-2">{stats.level}</h2>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${stats.levelProgress.progress}%` }}
                ></div>
              </div>
              <p className="text-xs opacity-90 mt-2">
                <span className="pr-0.5">
                  {Math.floor(stats.levelProgress.expInCurrentLevel)}
                </span>
                /{stats.levelProgress.expNeededForNextLevel} EXP to next level
              </p>
            </div>

            {/* Total EXP Card */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-md-custom">
              <p className="text-textMuted text-sm mb-2">Total Experience</p>
              <h2 className="text-4xl font-bold text-primary dark:text-blue-400">
                {stats.totalExp.toLocaleString()}
              </h2>
              <p className="text-textMuted text-xs mt-4">EXP Points</p>
            </div>

            {/* Achievements Card */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-md-custom">
              <p className="text-textMuted text-sm mb-2">
                Achievements Unlocked
              </p>
              <h2 className="text-4xl font-bold text-primary dark:text-blue-400">
                {unlockedCount}
                <span className="text-lg text-textMuted pl-1">
                  /{totalCount}
                </span>
              </h2>
              <p className="text-textMuted text-xs mt-4">
                {Math.round((unlockedCount / totalCount) * 100)}% Complete
              </p>
            </div>
          </div>

          {/* Weekly/Monthly EXP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface border border-border rounded-lg p-6 shadow-md-custom">
              <p className="text-textMuted text-sm mb-3">This Week</p>
              <p className="text-3xl font-bold text-primary dark:text-blue-400">
                {stats.weeklyExp.toLocaleString()}
              </p>
              <p className="text-textMuted text-xs mt-2">Weekly EXP</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-6 shadow-md-custom">
              <p className="text-textMuted text-sm mb-3">This Month</p>
              <p className="text-3xl font-bold text-primary dark:text-blue-400">
                {stats.monthlyExp.toLocaleString()}
              </p>
              <p className="text-textMuted text-xs mt-2">Monthly EXP</p>
            </div>
          </div>
        </div>

        {/* Achievements Filter and Grid */}
        <div className="max-w-7xl mx-auto px-4">
          {/* Search and Filter */}
          <div className="mb-12 flex flex-col md:flex-row gap-6">
            {/* Search Input */}
            <TextField
              label="Search achievements"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="outlined"
              className="flex-1"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: isDarkMode() ? "#1e293b" : "#ffffff",
                  color: isDarkMode() ? "#f1f5f9" : "#0f172a",
                  "& fieldset": {
                    borderColor: isDarkMode() ? "#475569" : "#cbd5e1",
                  },
                  "&:hover fieldset": {
                    borderColor: isDarkMode() ? "#64748b" : "#94a3b8",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563eb",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputBase-input": {
                  color: isDarkMode() ? "#f1f5f9" : "#0f172a",
                },
                "& .MuiInputLabel-root": {
                  color: isDarkMode() ? "#94a3b8" : "#cbd5e1",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#2563eb",
                },
              }}
            />

            {/* Filter Select */}
            <div className="w-48">
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full"
                MenuProps={{
                  disableScrollLock: true,
                  PaperProps: {
                    sx: {
                      backgroundColor: isDarkMode() ? "#1e293b" : "#ffffff",
                      color: isDarkMode() ? "#f1f5f9" : "#0f172a",
                      "& .MuiMenuItem-root": {
                        "&:hover": {
                          backgroundColor: isDarkMode() ? "#334155" : "#f1f5f9",
                        },
                        "&.Mui-selected": {
                          backgroundColor: isDarkMode() ? "#334155" : "#e0e7ff",
                          color: isDarkMode() ? "#63b3ed" : "#2563eb",
                          fontWeight: "600",
                        },
                      },
                    },
                  },
                }}
                sx={{
                  backgroundColor: isDarkMode() ? "#1e293b" : "#2563eb",
                  color: isDarkMode() ? "#63b3ed" : "white",
                  fontWeight: "600",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode() ? "#475569" : "#2563eb",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode() ? "#64748b" : "#1d4ed8",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode() ? "#64748b" : "#1d4ed8",
                  },
                  "& .MuiSvgIcon-root": {
                    color: isDarkMode() ? "#63b3ed" : "white",
                    fontWeight: "600",
                  },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="common">Common</MenuItem>
                <MenuItem value="rare">Rare</MenuItem>
                <MenuItem value="epic">Epic</MenuItem>
                <MenuItem value="legendary">Legendary</MenuItem>
              </Select>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAchievements.map((achievement) => {
              return (
                <div key={achievement.id} className="relative">
                  <div
                    className={`rounded-lg p-4 shadow-md-custom border transition-all ${
                      achievement.unlocked
                        ? `${
                            rarityBgColors[achievement.rarity]
                          } border-l-4 bg-opacity-70 border-gray-300 dark:border-gray-600`
                        : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-50 border"
                    }`}
                    style={
                      achievement.unlocked
                        ? {
                            borderLeftColor: rarityColors[achievement.rarity],
                          }
                        : {}
                    }
                  >
                    {/* Icon and Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{achievement.icon}</div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded"
                        style={{
                          backgroundColor:
                            rarityColors[achievement.rarity] + "20",
                          color: rarityColors[achievement.rarity],
                        }}
                      >
                        {achievement.rarity.toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="font-bold text-base mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-xs text-textMuted mb-3">
                      {achievement.description}
                    </p>

                    {/* EXP Reward */}
                    {achievement.expReward > 0 && (
                      <p className="text-xs font-semibold text-primary dark:text-blue-400 mb-3">
                        +{achievement.expReward} EXP
                      </p>
                    )}

                    {/* Unlock Status */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      {achievement.unlocked ? (
                        <p className="text-xs text-textMuted">
                          Unlocked{" "}
                          {new Date(
                            achievement.unlockedAt
                          ).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-xs text-textMuted">Locked</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-textMuted text-lg">
                No achievements in this category
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Achievements;
