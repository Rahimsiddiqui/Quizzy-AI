/**
 * Checks if a new month has started since the last activity and resets monthly limits.
 * @param {object} user - The Mongoose User document.
 * @param {object} TIER_LIMITS - The constant object defining tier limits.
 * @returns {Promise<object>} The updated User document.
 */

const checkMonthlyReset = async (user, TIER_LIMITS) => {
  const now = Date.now();
  const lastReset = new Date(user.limits.lastReset);
  const currentDate = new Date(now);
  const limits = TIER_LIMITS[user.tier];

  // If new month (check year/month), reset all
  const lastMonth = lastReset.getMonth();
  const lastYear = lastReset.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  if (lastMonth !== currentMonth || lastYear !== currentYear) {
    user.limits.generationsRemaining = limits.monthlyGenerations;
    user.limits.flashcardGenerationsRemaining =
      limits.monthlyFlashcardGenerations;
    user.limits.pdfUploadsRemaining = limits.monthlyPdfUploads;
    user.limits.pdfExportsRemaining = limits.monthlyPdfExports;

    // Max limits should not change monthly, but are set here for safety
    user.limits.maxQuestions = limits.maxQuestions;
    user.limits.maxMarks = limits.maxMarks;

    user.limits.lastReset = now; // Update the reset timestamp

    await user.save(); // Persist changes to the database
  }
  return user;
};

export default checkMonthlyReset;
