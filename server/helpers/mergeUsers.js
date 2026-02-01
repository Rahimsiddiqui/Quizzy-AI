import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";
import Review from "../models/Review.js";

/**
 * Merges duplicate user accounts found with the same email address.
 * Normalizes emails to lowercase before merging.
 * Transfers all data (quizzes, flashcards, reviews) to the primary account.
 */
export const mergeDuplicateUsers = async () => {
  console.log("Starting user merge process...");

  const duplicates = await User.aggregate([
    {
      $group: {
        _id: { $toLower: "$email" },
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);

  let mergedCount = 0;

  for (const group of duplicates) {
    const email = group._id;
    const userIds = group.ids;

    // Skip valid single accounts
    if (userIds.length <= 1) continue;

    console.log(`Found ${userIds.length} accounts for email: ${email}`);

    const users = await User.find({ _id: { $in: userIds } });

    // Sort users to pick a primary one
    // Criteria: 1. Has password set, 2. Oldest created
    users.sort((a, b) => {
      if (a.passwordIsUserSet && !b.passwordIsUserSet) return -1;
      if (!a.passwordIsUserSet && b.passwordIsUserSet) return 1;
      return a.createdAt - b.createdAt;
    });

    const primary = users[0];
    const duplicatesToMerge = users.slice(1);

    console.log(`Primary account ID: ${primary._id}`);

    for (const duplicate of duplicatesToMerge) {
      console.log(
        `Merging duplicate account ID: ${duplicate._id} into primary`
      );

      // Transfer Quizzes
      await Quiz.updateMany(
        { userId: duplicate._id },
        { $set: { userId: primary._id } }
      );

      // Transfer Flashcards
      await Flashcard.updateMany(
        { userId: duplicate._id },
        { $set: { userId: primary._id } }
      );

      // Transfer Reviews
      await Review.updateMany(
        { userId: duplicate._id },
        { $set: { userId: primary._id } }
      );

      // Merge connectedAccounts if primary doesn't have them
      if (duplicate.connectedAccounts) {
        const primaryAccounts = primary.connectedAccounts || new Map();
        const dupAccounts =
          duplicate.connectedAccounts instanceof Map
            ? duplicate.connectedAccounts
            : new Map(Object.entries(duplicate.connectedAccounts));

        for (const [provider, data] of dupAccounts.entries()) {
          if (!primaryAccounts.has(provider)) {
            primaryAccounts.set(provider, data);
          }
        }
        primary.connectedAccounts = primaryAccounts;
      }

      // Merge stats 
      if (duplicate.stats) {
        primary.stats = primary.stats || {};
        primary.stats.quizzesTaken =
          (primary.stats.quizzesTaken || 0) +
          (duplicate.stats.quizzesTaken || 0);
      }

      // Merge other gamification fields
      primary.exp = (primary.exp || 0) + (duplicate.exp || 0);
      primary.totalExpEarned =
        (primary.totalExpEarned || 0) + (duplicate.totalExpEarned || 0);
      primary.quizzesCreated =
        (primary.quizzesCreated || 0) + (duplicate.quizzesCreated || 0);
      primary.flashcardsCreated =
        (primary.flashcardsCreated || 0) + (duplicate.flashcardsCreated || 0);
    }

    // Save primary before deleting duplicates
    await primary.save();

    // safe to delete duplicates
    for (const duplicate of duplicatesToMerge) {
      await User.findByIdAndDelete(duplicate._id);
      mergedCount++;
    }
  }

  console.log(
    `User merge process completed. Total duplicate accounts merged: ${mergedCount}`
  );
  return mergedCount;
};
