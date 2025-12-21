const API_URL = `${import.meta.env.VITE_API_URL}`;

/** Generic request helper with auto user storage */
async function request(endpoint, method = "GET", body) {
  const token = localStorage.getItem("token");
  if (!token && method !== "GET") {
    throw new Error("Authentication token missing");
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${res.status}`
      );
    }

    const data = await res.json();

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));

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
    console.error(`Request failed for ${endpoint}:`, err);
    throw err;
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
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  },

  login: async (email, password) => {
    const data = await request("/api/auth/login", "POST", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
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
      const data = await request("/api/quizzes");

      // Ensure an array
      let quizzes = [];
      if (Array.isArray(data)) quizzes = data;
      else if (data?.quizzes && Array.isArray(data.quizzes))
        quizzes = data.quizzes;
      else if (data) quizzes = [data]; // fallback if single object returned

      if (!userId) return quizzes;
      return quizzes.filter((q) => q.userId === userId);
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
      return [];
    }
  },

  saveQuiz: async (quiz) => {
    if (quiz._id) return request(`/api/quizzes/${quiz._id}`, "PUT", quiz);
    return request("/api/quizzes", "POST", quiz);
  },

  deleteQuiz: async (quizId) => request(`/api/quizzes/${quizId}`, "DELETE"),

  // --- FLASHCARDS ---
  getFlashcards: async (userId) => {
    const data = await request("/api/flashcards");
    if (!userId) return data;
    return data.filter((c) => c.userId === userId);
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

  decrementFlashcardGeneration: async () => decrementLimit("flashcard"),
  decrementPdfUpload: async () => decrementLimit("pdfupload"),
  decrementPdfExport: async () => decrementLimit("pdfexport"),

  // --- AI REVIEWS ---
  getLastReview: async () => {
    try {
      const data = await request("/api/reviews/last");
      return data.review || null;
    } catch (err) {
      console.error("No previous AI review found.");
      return null;
    }
  },

  saveReview: async (reviewText) => {
    const payload = {
      text: reviewText,
      createdAt: Date.now(),
    };
    return request("/api/reviews", "POST", payload);
  },
};

export default StorageService;
