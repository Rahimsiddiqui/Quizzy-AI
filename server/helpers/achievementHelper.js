/**
 * Achievement Helper
 * Handles EXP awarding, achievement unlocking, and level progression
 */

import {
  ACHIEVEMENTS,
  calculateLevel,
  EXP_REWARDS,
} from "../config/achievements.js";

/**
 * Award EXP to user and check for new achievements
 * @param {Object} user - User document
 * @param {number} expAmount - Amount of EXP to award
 * @param {Object} actionData - Data about the action (for achievement checking)
 * @returns {Object} {expAwarded, levelUp, newAchievements}
 */
const awardExp = async (user, expAmount, actionData = {}) => {
  const previousLevel = calculateLevel(user.totalExpEarned);

  // Award EXP
  user.exp = (user.exp || 0) + expAmount;
  user.totalExpEarned = (user.totalExpEarned || 0) + expAmount;
  user.weeklyExp = (user.weeklyExp || 0) + expAmount;
  user.monthlyExp = (user.monthlyExp || 0) + expAmount;

  const newLevel = calculateLevel(user.totalExpEarned);
  const levelUp = newLevel > previousLevel;

  // Calculate profile completion status
  const profileComplete = !!(
    user.name &&
    user.email &&
    user.picture &&
    user.tier !== "Free"
  );

  // Check for achievement unlocks
  const userData = {
    ...user.toObject(),
    totalExp: user.totalExpEarned,
    level: newLevel,
    profileComplete,
    ...actionData,
  };

  const newAchievements = checkAndUnlockAchievements(user, userData);

  return {
    expAwarded: expAmount,
    levelUp,
    newLevel,
    previousLevel,
    newAchievements,
  };
};

/**
 * Check all achievements and unlock new ones
 * @param {Object} user - User document
 * @param {Object} userData - User data for checking conditions
 * @returns {Array} Array of newly unlocked achievements
 */
const checkAndUnlockAchievements = async (user, userData) => {
  const newAchievements = [];
  const unlockedIds = new Set(user.achievements.map((a) => a.id));

  for (const [, achievement] of Object.entries(ACHIEVEMENTS)) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) continue;

    // Check if condition is met
    try {
      if (achievement.condition(userData)) {
        const newAchievement = {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          unlockedAt: new Date(),
        };

        user.achievements.push(newAchievement);
        newAchievements.push(newAchievement);

        // Award EXP for achievement unlock (if not level-based)
        if (achievement.expReward > 0) {
          user.exp += achievement.expReward;
          user.totalExpEarned += achievement.expReward;
          user.weeklyExp += achievement.expReward;
          user.monthlyExp += achievement.expReward;
        }
      }
    } catch (error) {
      console.error(`Error checking achievement ${achievement.id}:`, error);
    }
  }

  return newAchievements;
};

/**
 * Award EXP for quiz completion
 * @param {Object} user - User document
 * @param {Object} quizData - Quiz data (score, totalMarks, questionCount)
 * @returns {Object} Award result
 */
const awardQuizCompletionExp = async (user, quizData) => {
  const { score = 0, totalMarks = 100 } = quizData;

  let baseExp = EXP_REWARDS.QUIZ_COMPLETED;

  // Bonus for high scores
  if (score > 0) {
    const scorePercentage = (score / totalMarks) * 100;
    if (scorePercentage === 100) {
      baseExp += EXP_REWARDS.QUIZ_PERFECT_SCORE;
    } else {
      baseExp += Math.floor(scorePercentage / 10);
    }
  }

  return awardExp(user, baseExp, {
    quizzesTaken: (user.stats?.quizzesTaken || 0) + 1,
    averageScore: calculateAverageScore(user, score, totalMarks),
    perfectScores: (score === totalMarks ? 1 : 0) + (user.perfectScores || 0),
    tier: user.tier,
    streakDays: user.stats?.streakDays || 0,
  });
};

/**
 * Award EXP for quiz creation
 * @param {Object} user - User document
 * @param {Object} quizData - Quiz data (questionCount)
 * @returns {Object} Award result
 */
const awardQuizCreationExp = async (user, quizData) => {
  const { questionCount = 1 } = quizData;

  let expAmount = EXP_REWARDS.QUIZ_CREATED;

  // Bonus for creating larger quizzes
  if (questionCount >= 10) {
    expAmount += EXP_REWARDS.QUIZ_CREATED_10_QUESTIONS;
  }

  return awardExp(user, expAmount, {
    quizzesCreated: (user.quizzesCreated || 0) + 1,
    tier: user.tier,
    streakDays: user.stats?.streakDays || 0,
  });
};

/**
 * Award EXP for flashcard set creation
 * @param {Object} user - User document
 * @param {Object} flashcardData - Flashcard data (cardCount)
 * @returns {Object} Award result
 */
const awardFlashcardCreationExp = async (user, flashcardData) => {
  const { cardCount = 1 } = flashcardData;

  let expAmount = EXP_REWARDS.FLASHCARD_SET_CREATED;

  // Bonus for creating larger sets
  if (cardCount >= 10) {
    expAmount += EXP_REWARDS.FLASHCARD_SET_10_CARDS;
  }

  return awardExp(user, expAmount, {
    flashcardsCreated: (user.flashcardsCreated || 0) + cardCount,
    tier: user.tier,
    streakDays: user.stats?.streakDays || 0,
  });
};

/**
 * Award EXP for PDF upload
 * @param {Object} user - User document
 * @returns {Object} Award result
 */
const awardPdfUploadExp = async (user) => {
  return awardExp(user, EXP_REWARDS.PDF_UPLOADED, {
    pdfsUploaded: (user.pdfsUploaded || 0) + 1,
    tier: user.tier,
    streakDays: user.stats?.streakDays || 0,
  });
};

/**
 * Award EXP for PDF export
 * @param {Object} user - User document
 * @returns {Object} Award result
 */
const awardPdfExportExp = async (user) => {
  return awardExp(user, EXP_REWARDS.PDF_EXPORTED, {
    pdfsExported: (user.pdfsExported || 0) + 1,
    tier: user.tier,
    streakDays: user.stats?.streakDays || 0,
  });
};

/**
 * Calculate average score
 * @param {Object} user - User document
 * @param {number} newScore - New score to average
 * @param {number} totalMarks - Total marks
 * @returns {number} New average score percentage
 */
const calculateAverageScore = (user, newScore, totalMarks) => {
  const quizzesTaken = (user.stats?.quizzesTaken || 0) + 1;
  const currentAverage = user.stats?.averageScore || 0;
  const newScorePercentage = (newScore / totalMarks) * 100;

  return (
    (currentAverage * (quizzesTaken - 1) + newScorePercentage) / quizzesTaken
  );
};

/**
 * Check and reset weekly/monthly EXP
 * @param {Object} user - User document
 * @returns {boolean} Whether reset occurred
 */
const checkExpReset = (user) => {
  const lastReset = user.leaderboardLastReset ? new Date(user.leaderboardLastReset) : new Date(0); // Epoch if null
  const now = new Date();

  let weeklyReset = false;
  let monthlyReset = false;

  // Calculate start of current week (Monday 00:00:00)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Calculate start of current month (1st 00:00:00)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Check Weekly Reset
  if (lastReset < startOfWeek) {
    user.weeklyExp = 0;
    weeklyReset = true;
  }

  // Check Monthly Reset
  if (lastReset < startOfMonth) {
    user.monthlyExp = 0;
    monthlyReset = true;
  }

  if (weeklyReset || monthlyReset) {
    user.leaderboardLastReset = now;
  }

  return weeklyReset || monthlyReset;
};

export {
  awardExp,
  checkAndUnlockAchievements,
  awardQuizCompletionExp,
  awardQuizCreationExp,
  awardFlashcardCreationExp,
  awardPdfUploadExp,
  awardPdfExportExp,
  calculateAverageScore,
  checkExpReset,
};
