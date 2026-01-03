import express from "express";
import { adminProtect } from "../middleware/adminAuth.js";
import {
  adminLogin,
  getDashboardStats,
  getUsers,
  getUserDetail,
  toggleUserActive,
  toggleUserBan,
  promoteUserToAdmin,
  demoteAdminToUser,
  getQuizResults,
  getQuizzes,
  getQuizDetail,
  getAdminInfo,
  enableQuiz,
  disableQuiz,
  deleteQuiz,
} from "../controllers/adminController.js";

const router = express.Router();

// Public route
router.post("/login", adminLogin);

// Protected routes
router.get("/me", adminProtect, getAdminInfo);
router.get("/dashboard", adminProtect, getDashboardStats);
router.get("/users", adminProtect, getUsers);
router.get("/users/:userId", adminProtect, getUserDetail);
router.patch("/users/:userId/toggle-active", adminProtect, toggleUserActive);
router.patch("/users/:userId/toggle-ban", adminProtect, toggleUserBan);
router.patch("/users/:userId/promote-admin", adminProtect, promoteUserToAdmin);
router.patch("/users/:userId/demote-admin", adminProtect, demoteAdminToUser);
router.get("/results", adminProtect, getQuizResults);
router.get("/quizzes", adminProtect, getQuizzes);
router.get("/quizzes/:quizId", adminProtect, getQuizDetail);
router.patch("/quizzes/:quizId/enable", adminProtect, enableQuiz);
router.patch("/quizzes/:quizId/disable", adminProtect, disableQuiz);
router.delete("/quizzes/:quizId", adminProtect, deleteQuiz);

export default router;
