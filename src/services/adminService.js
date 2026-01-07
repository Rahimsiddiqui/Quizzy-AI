import axios from "axios";

const API_BASE = "http://localhost:5000/api/admin";

// Create axios instance with auth token
const adminApi = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminLogin = async (email, password) => {
  const res = await adminApi.post("/login", { email, password });
  return res.data;
};

export const getDashboardStats = async () => {
  const res = await adminApi.get("/dashboard");
  return res.data;
};

export const getUsers = async (
  page = 1,
  limit = 10,
  search = "",
  role = "",
  status = ""
) => {
  const res = await adminApi.get("/users", {
    params: { page, limit, search, role, status },
  });
  return res.data;
};

export const getUserDetail = async (userId) => {
  const res = await adminApi.get(`/users/${userId}`);
  return res.data;
};

export const toggleUserActive = async (userId, data = {}) => {
  const res = await adminApi.patch(`/users/${userId}/toggle-active`, data);
  return res.data;
};

export const toggleUserBan = async (userId, data = {}) => {
  const res = await adminApi.patch(`/users/${userId}/toggle-ban`, data);
  return res.data;
};

export const promoteUserToAdmin = async (userId) => {
  const res = await adminApi.patch(`/users/${userId}/promote-admin`);
  return res.data;
};

export const demoteAdminToUser = async (userId) => {
  const res = await adminApi.patch(`/users/${userId}/demote-admin`);
  return res.data;
};

export const getQuizResults = async (page = 1, limit = 10, quiz = "") => {
  const res = await adminApi.get("/results", {
    params: { page, limit, quiz },
  });
  return res.data;
};

export const getQuizzes = async (
  page = 1,
  limit = 10,
  difficulty = null,
  isActive = null,
  search = ""
) => {
  const params = { page, limit };
  if (difficulty) {
    params.difficulty = difficulty;
  }
  if (isActive !== null) {
    params.isActive = isActive;
  }
  if (search) {
    params.search = search;
  }
  const res = await adminApi.get("/quizzes", { params });
  return res.data;
};

export const getQuizDetail = async (quizId) => {
  const res = await adminApi.get(`/quizzes/${quizId}`);
  return res.data;
};

export const getAdminInfo = async () => {
  const res = await adminApi.get("/me");
  return res.data;
};

export const enableQuiz = async (quizId) => {
  const res = await adminApi.patch(`/quizzes/${quizId}/enable`);
  return res.data;
};

export const disableQuiz = async (quizId) => {
  const res = await adminApi.patch(`/quizzes/${quizId}/disable`);
  return res.data;
};

export const deleteQuiz = async (quizId) => {
  const res = await adminApi.delete(`/quizzes/${quizId}`);
  return res.data;
};

export default adminApi;
