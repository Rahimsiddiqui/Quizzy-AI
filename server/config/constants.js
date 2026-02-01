import { SubscriptionTier } from "./types.js";

// Options available for selection
export const QUESTION_COUNTS = [3, ...Array.from({ length: 8 }, (_, i) => (i + 1) * 5)]; 
/* [3, 5, 10, 15, 20, 25, 30, 35, 40, 45] */

export const MARK_COUNTS = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);
/* [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100] */

/**
 * @typedef {Object} ExamStyle
 * @property {string} id
 * @property {string} label
 * @property {SubscriptionTier} tier
 * @property {string} description
 */
function createExamStyle(id, label, tierKey, description) {
  return {
    id,
    label,
    tier: SubscriptionTier[tierKey],
    description,
  };
}

export const EXAM_STYLES = [
  // Standard
  createExamStyle("standard", "Standard / Generic", "Free", "General knowledge quiz format suitable for quick practice."),

  // Class Test
  createExamStyle("class_test", "Class / Unit Test", "Basic", "School-level assessment focus on specific chapter definitions and concepts."),

  // Sindh Board
  createExamStyle("sindh_board", "Sindh Board (Matric/Inter)", "Basic", "Follows Sindh Board curriculum style and textbook phrasing."),

  // CAIE O Levels
  createExamStyle("caie_o", "CAIE O Level / IGCSE", "Basic", "Cambridge style questions using command words (State, Define, Explain)."),

  // CAIE A Levels
  createExamStyle("caie_a", "CAIE A Level", "Pro", "Advanced Cambridge level analysis, evaluation, and structured essays."),

  // SAT Exams
  createExamStyle("sat", "SAT / Entrance Exam", "Pro", "Aptitude test style focusing on logic, reading comprehension, and math."),
];
/**
 * @typedef {Object} TierLimits
 * @property {number} monthlyGenerations - Monthly limit for new quiz generations.
 * @property {number} monthlyFlashcardGenerations - Monthly limit for generating flashcards.
 * @property {number} monthlyPdfUploads - Monthly limit for uploading context PDFs.
 * @property {number} monthlyPdfExports - Monthly limit for exporting quizzes to PDF.
 * @property {number} maxQuestions - Maximum questions allowed in one generation.
 * @property {number} maxMarks - Maximum total marks allowed in one generation.
 * @property {number} flashcardLimit - Total storage limit for flashcards.
 * @property {number} price - Monthly price of the tier.
 */

/** @type {Object.<SubscriptionTier, TierLimits>} */
export const TIER_LIMITS = {
  [SubscriptionTier.Free]: {
    monthlyGenerations: 7,
    monthlyFlashcardGenerations: 3,
    monthlyPdfUploads: 3,
    monthlyPdfExports: 3,
    maxQuestions: 10,
    maxMarks: 30,
    flashcardLimit: 50,
    price: 0,
  },
  [SubscriptionTier.Basic]: {
    monthlyGenerations: 35,
    monthlyFlashcardGenerations: 17,
    monthlyPdfUploads: 15,
    monthlyPdfExports: 15,
    maxQuestions: 25,
    maxMarks: 60,
    flashcardLimit: 200,
    price: 4.99,
  },
  [SubscriptionTier.Pro]: {
    monthlyGenerations: Infinity,
    monthlyFlashcardGenerations: Infinity,
    monthlyPdfUploads: Infinity,
    monthlyPdfExports: Infinity,
    maxQuestions: 45,
    maxMarks: 100,
    flashcardLimit: Infinity,
    price: 12.99,
  },
};
