import { useState, useEffect } from "react";

// Hook to track dark mode changes
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

// Check if dark mode is active (for inline use)
const isDarkMode = () => document.documentElement.classList.contains("dark");

export default useDarkMode;
export { isDarkMode };
