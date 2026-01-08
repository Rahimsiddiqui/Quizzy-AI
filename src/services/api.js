const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT = 30000; // 30 second timeout

export async function request(endpoint, method = "GET", body) {
  const token = localStorage.getItem("token");
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

    const text = await res.text(); // Get raw response

    // Detect HTML error pages
    if (text.startsWith("<") || text.startsWith("<!DOCTYPE")) {
      throw new Error(
        "AI is busy at the moment. Please refresh or try again later."
      );
    }

    // Parse JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Invalid JSON returned from server - propagate as a user-friendly error
      throw new Error("Server returned invalid JSON.");
    }

    if (!res.ok) {
      throw new Error(
        data.message || `Request failed with status ${res.status}`
      );
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout. The server took too long to respond.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function login(email, password) {
  return request("/api/auth/login", "POST", { email, password });
}

export function register(name, email, password) {
  return request("/api/auth/register", "POST", { name, email, password });
}
