/**
 * Achievements Configuration
 * Defines all achievements, their unlock conditions, EXP rewards, and rarities
 */

export const ACHIEVEMENTS = {
  // Getting Started Achievements
  FIRST_QUIZ: {
    id: "first_quiz",
    name: "Quiz Creator",
    description: "Create your first quiz",
    icon: "📝",
    rarity: "common",
    expReward: 10,
    condition: (data) => data.quizzesCreated >= 1,
  },
  FIRST_FLASHCARD: {
    id: "first_flashcard",
    name: "Flashcard Maker",
    description: "Create your first flashcard set",
    icon: "🎴",
    rarity: "common",
    expReward: 10,
    condition: (data) => data.flashcardsCreated >= 1,
  },
  PROFILE_SETUP: {
    id: "profile_setup",
    name: "Profile Pioneer",
    description: "Complete your user profile",
    icon: "👤",
    rarity: "common",
    expReward: 5,
    condition: (data) => data.profileComplete === true,
  },

  // Quiz Milestones
  QUIZ_CREATOR_5: {
    id: "quiz_creator_5",
    name: "Quiz Enthusiast",
    description: "Create 5 quizzes",
    icon: "📚",
    rarity: "common",
    expReward: 25,
    condition: (data) => data.quizzesCreated >= 5,
  },
  QUIZ_CREATOR_25: {
    id: "quiz_creator_25",
    name: "Quiz Master",
    description: "Create 25 quizzes",
    icon: "🏆",
    rarity: "rare",
    expReward: 100,
    condition: (data) => data.quizzesCreated >= 25,
  },
  QUIZ_CREATOR_100: {
    id: "quiz_creator_100",
    name: "Quiz Legend",
    description: "Create 100 quizzes",
    icon: "👑",
    rarity: "epic",
    expReward: 500,
    condition: (data) => data.quizzesCreated >= 100,
  },

  // Quiz Taking Achievements
  QUIZ_TAKER_10: {
    id: "quiz_taker_10",
    name: "Quiz Solver",
    description: "Take 10 quizzes",
    icon: "✏️",
    rarity: "common",
    expReward: 30,
    condition: (data) => data.quizzesTaken >= 10,
  },
  QUIZ_TAKER_50: {
    id: "quiz_taker_50",
    name: "Quiz Conqueror",
    description: "Take 50 quizzes",
    icon: "⚔️",
    rarity: "rare",
    expReward: 150,
    condition: (data) => data.quizzesTaken >= 50,
  },

  // Performance Achievements
  PERFECT_SCORE: {
    id: "perfect_score",
    name: "Flawless",
    description: "Score 100% on a quiz",
    icon: "🌟",
    rarity: "rare",
    expReward: 75,
    condition: (data) => data.perfectScores >= 1,
  },
  PERFECT_SCORE_5: {
    id: "perfect_score_5",
    name: "Ace",
    description: "Get 5 perfect scores",
    icon: "💎",
    rarity: "epic",
    expReward: 250,
    condition: (data) => data.perfectScores >= 5,
  },
  AVERAGE_SCORE_90: {
    id: "average_score_90",
    name: "Consistent Scholar",
    description: "Maintain 90%+ average score",
    icon: "📊",
    rarity: "rare",
    expReward: 100,
    condition: (data) => data.averageScore >= 90,
  },

  // Flashcard Milestones
  FLASHCARD_CREATOR_10: {
    id: "flashcard_creator_10",
    name: "Flashcard Fanatic",
    description: "Create 10 flashcard sets",
    icon: "🎯",
    rarity: "common",
    expReward: 40,
    condition: (data) => data.flashcardsCreated >= 10,
  },
  FLASHCARD_CREATOR_50: {
    id: "flashcard_creator_50",
    name: "Flashcard Master",
    description: "Create 50 flashcard sets",
    icon: "🎪",
    rarity: "rare",
    expReward: 200,
    condition: (data) => data.flashcardsCreated >= 50,
  },

  // Streak Achievements
  STREAK_7: {
    id: "streak_7",
    name: "On Fire",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    rarity: "rare",
    expReward: 100,
    condition: (data) => data.streakDays >= 7,
  },
  STREAK_30: {
    id: "streak_30",
    name: "Unstoppable",
    description: "Maintain a 30-day streak",
    icon: "⚡",
    rarity: "epic",
    expReward: 500,
    condition: (data) => data.streakDays >= 30,
  },
  STREAK_100: {
    id: "streak_100",
    name: "Immortal",
    description: "Maintain a 100-day streak",
    icon: "🧿",
    rarity: "legendary",
    expReward: 2000,
    condition: (data) => data.streakDays >= 100,
  },

  // Premium Achievements
  BASIC_SUBSCRIBER: {
    id: "basic_subscriber",
    name: "Premium Member",
    description: "Upgrade to Basic tier",
    icon: "💳",
    rarity: "rare",
    expReward: 50,
    condition: (data) => data.tier === "Basic",
  },
  PRO_SUBSCRIBER: {
    id: "pro_subscriber",
    name: "Elite Pro",
    description: "Upgrade to Pro tier",
    icon: "🚀",
    rarity: "epic",
    expReward: 200,
    condition: (data) => data.tier === "Pro",
  },

  // PDF Achievements
  PDF_UPLOAD_5: {
    id: "pdf_upload_5",
    name: "PDF Collector",
    description: "Upload 5 PDFs",
    icon: "📄",
    rarity: "common",
    expReward: 30,
    condition: (data) => data.pdfsUploaded >= 5,
  },
  PDF_EXPORT_10: {
    id: "pdf_export_10",
    name: "PDF Exporter",
    description: "Export 10 PDFs",
    icon: "📥",
    rarity: "common",
    expReward: 25,
    condition: (data) => data.pdfsExported >= 10,
  },

  // Level Achievements
  LEVEL_5: {
    id: "level_5",
    name: "Rising Star",
    description: "Reach Level 5",
    icon: "⭐",
    rarity: "common",
    expReward: 0, // No extra reward since level is the achievement
    condition: (data) => data.level >= 5,
  },
  LEVEL_10: {
    id: "level_10",
    name: "Prolific Scholar",
    description: "Reach Level 10",
    icon: "🌠",
    rarity: "rare",
    expReward: 0,
    condition: (data) => data.level >= 10,
  },
  LEVEL_25: {
    id: "level_25",
    name: "Legendary Educator",
    description: "Reach Level 25",
    icon: "✨",
    rarity: "legendary",
    expReward: 0,
    condition: (data) => data.level >= 25,
  },

  // Leaderboard Achievements
  LEADERBOARD_TOP_10: {
    id: "leaderboard_top_10",
    name: "Top Performer",
    description: "Rank in top 10 globally",
    icon: "🥇",
    rarity: "epic",
    expReward: 100,
    condition: (data) => data.leaderboardRank <= 10,
  },
  LEADERBOARD_TOP_1: {
    id: "leaderboard_top_1",
    name: "Reigning Champion",
    description: "Reach #1 on leaderboard",
    icon: "👑",
    rarity: "legendary",
    expReward: 500,
    condition: (data) => data.leaderboardRank === 1,
  },
};

/**
 * EXP required per level (cumulative)
 * Level 1 = 0, Level 2 = 100, Level 3 = 300, etc.
 */
export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2100,
  8: 2800,
  9: 3600,
  10: 4500,
  11: 5500,
  12: 6600,
  13: 7800,
  14: 9100,
  15: 10500,
  16: 12000,
  17: 13600,
  18: 15300,
  19: 17100,
  20: 19000,
  21: 21000,
  22: 23100,
  23: 25300,
  24: 27600,
  25: 30000,
};

/**
 * Calculate current level from total EXP
 * @param {number} totalExp - Total EXP earned
 * @returns {number} Current level
 */
export const calculateLevel = (totalExp) => {
  for (let level = 25; level >= 1; level--) {
    if (totalExp >= LEVEL_THRESHOLDS[level]) {
      return level;
    }
  }
  return 1;
};

/**
 * Calculate EXP progress toward next level
 * @param {number} totalExp - Total EXP earned
 * @returns {Object} {currentLevelExp, nextLevelExp, progress}
 */
export const calculateLevelProgress = (totalExp) => {
  const currentLevel = calculateLevel(totalExp);
  const nextLevel = currentLevel + 1;

  const currentLevelExp = LEVEL_THRESHOLDS[currentLevel] || 0;
  const nextLevelExp = LEVEL_THRESHOLDS[nextLevel] || LEVEL_THRESHOLDS[25];

  const expInCurrentLevel = totalExp - currentLevelExp;
  const expNeededForNextLevel = nextLevelExp - currentLevelExp;

  const progress = Math.min(
    100,
    (expInCurrentLevel / expNeededForNextLevel) * 100
  );

  return {
    currentLevel,
    currentLevelExp,
    nextLevelExp,
    expInCurrentLevel,
    expNeededForNextLevel,
    progress,
  };
};

/**
 * EXP rewards for various actions
 */
export const EXP_REWARDS = {
  QUIZ_CREATED: 5,
  QUIZ_CREATED_10_QUESTIONS: 10,
  QUIZ_COMPLETED: 10,
  QUIZ_PERFECT_SCORE: 25,
  QUIZ_HIGH_SCORE: (score) => Math.floor(score / 10), // 1 EXP per 10% score
  FLASHCARD_SET_CREATED: 8,
  FLASHCARD_SET_10_CARDS: 10,
  PDF_UPLOADED: 5,
  PDF_EXPORTED: 3,
};

export default {
  ACHIEVEMENTS,
  LEVEL_THRESHOLDS,
  calculateLevel,
  calculateLevelProgress,
  EXP_REWARDS,
};
