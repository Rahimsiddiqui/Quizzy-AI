const difficultyLevels = ["Easy", "Medium", "Hard"];
export const Difficulty = Object.fromEntries(difficultyLevels.map(level => [level, level])); 
/* {
   Easy: "Easy",
   Medium: "Medium",
   Hard: "Hard"
} */

const questionTypes = [
  ["MCQ", "Multiple Choice"],
  ["TrueFalse", "True/False"],
  ["ShortAnswer", "Short Answer"],
  ["FillInTheBlank", "Fill in the Blank"],
  ["Essay", "Essay"]
];
export const QuestionType = Object.fromEntries(questionTypes); 
/* {
   MCQ: "Multiple Choice",
   TrueFalse: "True/False",
   ShortAnswer: "Short Answer",
   FillInTheBlank: "Fill in the Blank",
   Essay: "Essay"
} */

const subscriptionTiers = ["Free", "Basic", "Pro"];
export const SubscriptionTier = Object.fromEntries(subscriptionTiers.map(tier => [tier, tier]));
/* {
   Free: "Free",
   Basic: "Basic",
   Pro: "Pro"
} */

// --- INTERFACES (Mapped to JSDoc typedefs) ---

/**
 * @typedef {object} Question
 * @property {string} id
 * @property {QuestionType} type
 * @property {string} text
 * @property {string[]} [options] - For MCQ
 * @property {string} correctAnswer
 * @property {string} explanation
 * @property {string} [userAnswer]
 * @property {boolean} [isCorrect]
 * @property {number} [marks]
 */

/**
 * @typedef {object} Quiz
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} topic
 * @property {Difficulty} difficulty
 * @property {Question[]} questions
 * @property {number} createdAt
 * @property {number} [completedAt]
 * @property {number} [score]
 * @property {number} totalQuestions
 * @property {number} [totalMarks]
 * @property {boolean} [isFlashcardSet]
 * @property {string} [examStyle] - Exam Style ID
 */

/**
 * @typedef {object} Flashcard
 * @property {string} id
 * @property {string} userId
 * @property {string} quizId
 * @property {string} front - Question
 * @property {string} back - Answer
 * @property {number} nextReview - Timestamp
 * @property {number} interval - Days
 * @property {number} easeFactor
 * @property {number} repetition
 */

/**
 * @typedef {object} UserStats
 * @property {number} quizzesTaken
 * @property {number} averageScore
 * @property {number} streakDays
 * @property {number} lastActive
 */

/**
 * @typedef {object} UserLimits
 * @property {number} generationsRemaining
 * @property {number} flashcardGenerationsRemaining
 * @property {number} pdfUploadsRemaining
 * @property {number} pdfExportsRemaining
 * @property {number} lastReset
 * @property {number} maxQuestions - Max values allowed per generation
 * @property {number} maxMarks - Max values allowed per generation
 */

/**
 * @typedef {object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string} [password]
 * @property {string} name
 * @property {SubscriptionTier} tier
 * @property {UserStats} stats
 * @property {UserLimits} limits
 */

/**
 * @typedef {object} AuthState
 * @property {boolean} isAuthenticated
 * @property {UserProfile | null} user
 */
