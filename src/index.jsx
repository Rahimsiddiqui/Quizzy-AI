import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Initialize theme immediately before rendering
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "system";
  const htmlElement = document.documentElement;

  if (savedTheme === "dark") {
    htmlElement.classList.add("dark");
  } else if (savedTheme === "light") {
    htmlElement.classList.remove("dark");
  } else {
    // System preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }
};

initializeTheme();

// Load Vercel Analytics script in production only
if (import.meta.env.NODE_ENV === "production") {
  const script = document.createElement("script");
  script.src = "https://vercel.live/_next-live/feedback/feedback.js";
  script.defer = true;
  script.async = true;
  document.head.appendChild(script);
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
