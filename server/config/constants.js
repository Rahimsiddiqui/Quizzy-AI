import { SubscriptionTier } from "./types.js";

export const APP_NAME = "Qubli AI";

// Options available for selection
export const QUESTION_COUNTS = [3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45];
export const MARK_COUNTS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  100,
];

/**
 * @typedef {Object} ExamStyle
 * @property {string} id
 * @property {string} label
 * @property {SubscriptionTier} tier
 * @property {string} description
 */
export const EXAM_STYLES = [
  {
    id: "standard",
    label: "Standard / Generic",
    tier: SubscriptionTier.Free,
    description: "General knowledge quiz format suitable for quick practice.",
  },
  {
    id: "class_test",
    label: "Class / Unit Test",
    tier: SubscriptionTier.Basic,
    description:
      "School-level assessment focus on specific chapter definitions and concepts.",
  },
  {
    id: "sindh_board",
    label: "Sindh Board (Matric/Inter)",
    tier: SubscriptionTier.Basic,
    description: "Follows Sindh Board curriculum style and textbook phrasing.",
  },
  {
    id: "caie_o",
    label: "CAIE O Level / IGCSE",
    tier: SubscriptionTier.Basic,
    description:
      "Cambridge style questions using command words (State, Define, Explain).",
  },
  {
    id: "caie_a",
    label: "CAIE A Level",
    tier: SubscriptionTier.Pro,
    description:
      "Advanced Cambridge level analysis, evaluation, and structured essays.",
  },
  {
    id: "sat",
    label: "SAT / Entrance Exam",
    tier: SubscriptionTier.Pro,
    description:
      "Aptitude test style focusing on logic, reading comprehension, and math.",
  },
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
