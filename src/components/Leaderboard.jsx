import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Select, MenuItem } from "@mui/material";
import StorageService from "../services/storageService.js";
import useDarkMode, { isDarkMode } from "../hooks/useDarkMode.js";

// Medal Image Component
const Medal = ({ type }) => {
  const imageMap = {
    gold: "/icons/1st-position.png",
    silver: "/icons/2nd-position.png",
    bronze: "/icons/3rd-position.png",
  };

  return (
    <img
      src={imageMap[type]}
      alt={`${type} medal`}
      className="w-8 h-8 object-contain"
    />
  );
};

const Leaderboard = ({ user }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [userRank, setUserRank] = useState(null);
  const darkMode = useDarkMode();

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await StorageService.getLeaderboard(period);

      // Remove duplicates - keep only unique users by name/email
      const uniqueUsers = [];
      const seenNames = new Set();

      response.forEach((user) => {
        if (!seenNames.has(user.name)) {
          uniqueUsers.push(user);
          seenNames.add(user.name);
        }
      });

      setLeaderboard(uniqueUsers);

      // Find current user's rank
      const rank = uniqueUsers.findIndex((u) => u.name === user?.name);
      if (rank !== -1) {
        setUserRank(rank + 1);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get EXP field based on period
  const getExpField = () => {
    switch (period) {
      case "weekly":
        return "weeklyExp";
      case "monthly":
        return "monthlyExp";
      default:
        return "totalExp";
    }
  };

  // Get medal for top 3 with colors
  const getMedalIcon = (rank) => {
    if (rank === 1) return { type: "gold", color: "#fbbf24" }; // Gold
    if (rank === 2) return { type: "silver", color: "#e5e7eb" }; // Silver
    if (rank === 3) return { type: "bronze", color: "#d97706" }; // Bronze
    return { type: null, color: null };
  };

  // Generate consistent avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      "#2563eb", // blue
      "#7c3aed", // violet
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
      "#06b6d4", // cyan
      "#8b5cf6", // purple
      "#f97316", // orange
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Tier colors
  const tierColors = {
    Free: "#6b7280",
    Basic: "#6366f1",
    Pro: "#f59e0b",
  };

  return (
    <div className="min-h-screen bg-background text-textMain py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-7 space-y-5">
          <h1 className="text-4xl font-bold">Global Leaderboard</h1>
          <p className="text-textMuted">
            Compete with other learners and climb the ranks
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-8 w-48">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full"
            disableScrollLock={true}
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
                      fontWeight: "550",
                    },
                  },
                },
              },
            }}
            sx={{
              backgroundColor: isDarkMode() ? "#1e293b" : "#2563eb",
              color: isDarkMode() ? "#63b3ed" : "white",
              fontWeight: "550",
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
              },
            }}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="monthly">This Month</MenuItem>
            <MenuItem value="weekly">This Week</MenuItem>
          </Select>
        </div>

        {/* Your Rank Card */}
        {userRank && (
          <div className="bg-linear-to-r from-primary/10 to-primary/5 dark:bg-linear-to-r dark:from-blue-800/30 dark:to-blue-800/20 border border-primary/20 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="text-center xs:text-left">
                <p className="text-textMuted text-sm mb-1">Your Rank</p>
                <h2 className="text-3xl font-bold">#{userRank}</h2>
              </div>
              <div className="text-right">
                <p className="text-textMuted text-sm mb-1">
                  Your{" "}
                  {period === "all"
                    ? "Total"
                    : period === "weekly"
                    ? "Weekly"
                    : "Monthly"}{" "}
                  EXP
                </p>
                <h2 className="text-3xl font-bold text-primary dark:text-blue-400">
                  {leaderboard[userRank - 1]?.[getExpField()] || 0}
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-surface border border-border rounded-lg overflow-x-auto">
          <table className="w-full border-collapse min-w-max md:min-w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-3 md:px-6 py-4 text-center font-bold text-sm md:text-sm text-textMuted">
                  Rank
                </th>
                <th className="px-3 md:px-6 py-4 text-left font-bold text-sm md:text-sm text-textMuted">
                  Player
                </th>
                <th className="px-3 md:px-6 py-4 text-center font-bold text-sm md:text-sm text-textMuted">
                  Level
                </th>
                <th className="px-3 md:px-6 py-4 text-center font-bold text-sm md:text-sm text-textMuted">
                  EXP
                </th>
                <th className="px-3 md:px-6 py-4 text-center font-bold text-sm md:text-sm text-textMuted">
                  Achievements
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, 100).map((player, index) => {
                const rank = index + 1;
                const medalData = getMedalIcon(rank);
                const isCurrentUser = player.name === user?.name;
                const isTopThree = rank <= 3;
                const rowBgClass =
                  isCurrentUser && !isTopThree
                    ? "bg-primary/5 border-l-4 border-primary dark:border-blue-400"
                    : rank === 1
                    ? "bg-amber-100 dark:bg-amber-800/30"
                    : rank === 2
                    ? "bg-slate-100 dark:bg-slate-700/30"
                    : rank === 3
                    ? "bg-orange-100/50 dark:bg-orange-900/10"
                    : "hover:bg-gray-50/50 dark:hover:bg-gray-800/50";

                return (
                  <tr
                    key={rank}
                    className={`border-b border-border transition-all ${rowBgClass}`}
                  >
                    {/* Rank & Medal */}
                    <td className="px-3 md:px-6 py-4 min-w-25 md:min-w-20">
                      <div className="flex items-center gap-2 justify-center">
                        {medalData.type && <Medal type={medalData.type} />}
                        {!medalData.type && (
                          <span className="font-bold text-base md:text-lg text-primary dark:text-blue-400 whitespace-nowrap">
                            #{rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Player Info */}
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex justify-start items-center gap-2 md:gap-3 min-w-0 max-w-xs md:max-w-sm lg:max-w-md w-full">
                        <div
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br flex items-center justify-center text-white font-bold text-sm md:text-sm shrink-0 overflow-hidden"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${getAvatarColor(
                              player.name
                            )} 0%, ${getAvatarColor(player.name + "2")} 100%)`,
                          }}
                        >
                          {player.picture ? (
                            <img
                              src={player.picture}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            player.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-semibold text-xs md:text-sm truncate tracking-tight"
                            title={player.name}
                          >
                            {player.name}
                          </p>
                          <p
                            className="text-xs font-medium truncate tracking-tight"
                            style={{ color: tierColors[player.tier] }}
                          >
                            {player.tier}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-3 md:px-6 py-4 text-center min-w-25 lg:min-w-10">
                      <div>
                        <p className="font-bold text-base md:text-lg">
                          {player.level}
                        </p>
                        <p className="text-xs text-textMuted">LVL</p>
                      </div>
                    </td>

                    {/* EXP */}
                    <td className="px-3 md:px-6 py-4 text-center min-w-25 lg:min-w-10">
                      <p className="font-bold text-primary dark:text-blue-400 text-base md:text-lg whitespace-nowrap">
                        {player[getExpField()].toLocaleString()}
                      </p>
                    </td>

                    {/* Achievements */}
                    <td className="px-3 md:px-6 py-4 text-center">
                      <p className="font-semibold text-sm md:text-base">
                        {player.achievements}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-textMuted text-lg">No leaderboard data yet</p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-800/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💡 <strong>Pro Tip:</strong> Earn EXP by creating quizzes,
            completing quizzes, creating flashcards, and more! Level up and
            unlock achievements to rank higher on the leaderboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
