const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT = 30000; // 30 second timeout
const REQUEST_CACHE = new Map(); // Simple in-memory cache for GET requests
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for GET requests

/** Generic request helper with auto user storage and caching */
async function request(endpoint, method = "GET", body) {
  const token = localStorage.getItem("token");

  // Allow unauthenticated requests for auth endpoints (login, register, verify-email, resend-code)
  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/verify-email") ||
    endpoint.includes("/auth/resend-code");

  if (!token && method !== "GET" && !isAuthEndpoint) {
    throw new Error("Authentication token missing");
  }

  // Check cache for GET requests
  if (method === "GET" && REQUEST_CACHE.has(endpoint)) {
    const cached = REQUEST_CACHE.get(endpoint);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    } else {
      REQUEST_CACHE.delete(endpoint); // Invalidate expired cache
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      // If token or session is invalid, clear local auth state and redirect to login
      // BUT do not automatically redirect for auth endpoints (e.g. failed login)
      if (res.status === 401) {
        // Clear any stored auth state
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        REQUEST_CACHE.clear();
        if (!isAuthEndpoint) {
          // Only redirect when hitting protected endpoints - keep user on same page for login failures
          window.location.href = "/";
        }
        throw new Error(errorData.message || "Unauthorized");
      }
      throw new Error(
        errorData.message || `Request failed with status ${res.status}`
      );
    }

    const data = await res.json();

    // Cache GET requests
    if (method === "GET") {
      REQUEST_CACHE.set(endpoint, { data, timestamp: Date.now() });
    }

    // Clear cache on DELETE/PUT/POST operations to ensure fresh data
    if (
      method === "DELETE" ||
      method === "PUT" ||
      (method === "POST" && endpoint.includes("/api/quizzes"))
    ) {
      REQUEST_CACHE.delete("/api/quizzes");
      REQUEST_CACHE.delete("/api/flashcards");
      REQUEST_CACHE.delete("/api/reviews");
      REQUEST_CACHE.delete("/api/users/me");
    }

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));

      // Invalidate user-related caches on updates
      REQUEST_CACHE.delete("/api/users/me");

      // Dispatch events based on the endpoint
      if (endpoint.includes("/limits/decrement/")) {
        if (endpoint.includes("flashcard")) {
          window.dispatchEvent(new Event("quizGenerated"));
        } else if (endpoint.includes("pdfupload")) {
          window.dispatchEvent(new Event("pdfUploaded"));
        } else if (endpoint.includes("pdfexport")) {
          window.dispatchEvent(new Event("pdfExported"));
        }
      }
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      // Request aborted due to timeout (handled by throwing a descriptive error)
      throw new Error("Request timeout. The server took too long to respond.");
    }
    // Propagate error to caller for centralized handling
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Generic decrement function */
async function decrementLimit(type) {
  const data = await request(`/api/limits/decrement/${type}`, "POST");
  return data.success;
}

const StorageService = {
  // --- AUTH ---
  register: async (name, email, password) => {
    const data = await request("/api/auth/register", "POST", {
      name,
      email,
      password,
    });
    // Registration doesn't return a token - user must verify email first
    return data;
  },

  login: async (email, password) => {
    const data = await request("/api/auth/login", "POST", { email, password });
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data.user;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear cache on logout
    REQUEST_CACHE.clear();
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  // Clear cache when user logs out
  clearCache: () => {
    REQUEST_CACHE.clear();
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    // Handle edge case where "undefined" string was stored
    if (!user || user === "undefined") {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (err) {
      // Failed to parse stored user — clear corrupted value
      localStorage.removeItem("user");
      return null;
    }
  },

  refreshUser: async () => {
    const data = await request("/api/users/me");
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      // Dispatch event so Layout component re-syncs state
      window.dispatchEvent(
        new CustomEvent("userUpdated", { detail: data.user })
      );
    }
    return data.user || data;
  },

  // --- QUIZZES ---
  getQuizzes: async (userId) => {
    try {
      // Use the request function which handles auth and base URL
      const data = await request("/api/quizzes");

      // Ensure an array
      let quizzes = [];
      if (Array.isArray(data)) quizzes = data;
      else if (data?.quizzes && Array.isArray(data.quizzes))
        quizzes = data.quizzes;
      else if (data) quizzes = [data]; // fallback if single object returned

      // Normalize quiz objects to ensure both _id and id are present
      quizzes = quizzes.map((q) => ({
        ...q,
        _id: q._id || q.id,
        id: q.id || q._id,
      }));

      if (!userId) return quizzes;
      return quizzes.filter((q) => q.userId === userId);
    } catch (err) {
      // Failed to fetch quizzes - return empty list to avoid breaking UI
      return [];
    }
  },

  saveQuiz: async (quiz) => {
    const quizId = quiz._id || quiz.id;
    if (quizId) return request(`/api/quizzes/${quizId}`, "PUT", quiz);
    return request("/api/quizzes", "POST", quiz);
  },

  deleteQuiz: async (quizId) => request(`/api/quizzes/${quizId}`, "DELETE"),

  // --- FLASHCARDS ---
  getFlashcards: async (userId) => {
    const data = await request("/api/flashcards");

    // Ensure we have an array
    let flashcards = [];
    if (Array.isArray(data)) flashcards = data;
    else if (data?.flashcards && Array.isArray(data.flashcards))
      flashcards = data.flashcards;
    else if (data) flashcards = [data];

    // Normalize flashcard objects to ensure both _id and id are present
    flashcards = flashcards.map((c) => ({
      ...c,
      _id: c._id || c.id,
      id: c.id || c._id,
      quizId: c.quizId, // Keep quizId as-is for filtering
    }));

    if (!userId) return flashcards;
    return flashcards.filter((c) => c.userId === userId);
  },

  saveFlashcards: async (cards) =>
    request("/api/flashcards/bulk", "POST", cards),

  updateFlashcard: async (card) =>
    request(`/api/flashcards/${card.id}`, "PUT", card),

  // --- TIERS & LIMITS ---
  upgradeTier: async (tier) => {
    const data = await request("/api/subscription/upgrade", "POST", { tier });
    return data.user || data;
  },

  requestRefund: async () => {
    const data = await request("/api/subscription/refund", "POST", {});
    return data;
  },

  decrementFlashcardGeneration: async () => decrementLimit("flashcard"),
  decrementPdfUpload: async () => decrementLimit("pdfupload"),
  decrementPdfExport: async () => decrementLimit("pdfexport"),

  // --- AI REVIEWS ---
  getLastReview: async () => {
    try {
      // Check localStorage first for instant access
      const cachedReview = localStorage.getItem("lastAIReview");
      if (cachedReview) {
        try {
          return JSON.parse(cachedReview);
        } catch (err) {
          console.warn("Failed to parse cached review:", err);
        }
      }

      // Fall back to fetching from server if not in cache
      const data = await request("/api/reviews/last");
      return data.review || null;
    } catch (err) {
      // No previous AI review found or an error occurred
      return null;
    }
  },

  saveReview: async (reviewText) => {
    const payload = {
      text: reviewText,
      createdAt: Date.now(),
    };
    const result = await request("/api/reviews", "POST", payload);

    // Also save to localStorage for instant access on overview page
    try {
      localStorage.setItem(
        "lastAIReview",
        JSON.stringify({
          text: reviewText,
          createdAt: Date.now(),
        })
      );
    } catch (err) {
      console.warn("Failed to save review to localStorage:", err);
    }

    return result;
  },
};

export default StorageService;
