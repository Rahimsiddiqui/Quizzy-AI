import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import useDarkMode, { isDarkMode } from "../hooks/useDarkMode.js";

export default function NotFound() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useDarkMode();

  useEffect(() => {
    document.title = "404 — Page Not Found";
    // focus the search input for faster recovery
    inputRef.current?.focus();
  }, []);

  const container = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
  };

  const float = {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 4, ease: "easeInOut", repeat: Infinity },
    },
  };

  return (
    <main
      role="main"
      className="min-h-screen bg-background text-textMain flex flex-col items-center justify-center p-6 lg:p-20 transition-colors duration-300"
    >
      <motion.section
        initial="hidden"
        animate="visible"
        variants={container}
        className="xs:max-w-2xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto text-center"
      >
        <span className="inline-block mb-10 lg:mb-7 px-4 py-1.5 text-sm font-semibold tracking-wide uppercase text-primary dark:text-blue-300 bg-primary/10 dark:bg-primary/20 rounded-full">
          404 — Page not found
        </span>

        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
          <div className="w-full lg:w-1/2 text-left">
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -6 },
                visible: { opacity: 1, x: 0 },
                transition: { duration: 2, ease: "easeInOut" },
              }}
            >
              <h1 className="text-4xl text-textMain dark:text-textMain/95 text-center sm:text-5xl lg:text-6xl lg:text-left font-extrabold leading-tight mb-6 sm:mb-8 md:mb-10">
                Oops — we couldn’t find that page.
              </h1>
              <p className="text-textMuted text-center sm:text-lg lg:text-left font-semibold leading-tight mb-8">
                It looks like this link is broken or outdated. Try going back,
                using the menu, or heading to the homepage.
              </p>
            </motion.div>

            <motion.div
              className="flex justify-center lg:justify-start flex-wrap gap-7"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            >
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surfaceHighlight transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 point"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                Go back
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-700/80 text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 point"
                aria-label="Back to home"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </motion.div>
          </div>

          {/* Illustration / decorative column */}
          <motion.div
            className="w-full lg:w-1/2 flex items-center justify-center"
            variants={{
              hidden: { opacity: 0, x: 6 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <motion.div
              variants={float}
              animate="animate"
              className="max-w-xs w-full"
            >
              {/* Simple, accessible SVG illustration that scales nicely */}
              <svg
                viewBox="0 0 300 220"
                className="w-full h-auto"
                role="img"
                aria-label="Illustration of a lost explorer and a glowing 404 sign"
              >
                <defs>
                  <linearGradient id="g" x1="0" x2="1">
                    <stop
                      offset="0%"
                      stopColor={isDarkMode() ? "#1e293b" : "#eef2ff"}
                    />
                    <stop
                      offset="100%"
                      stopColor={isDarkMode() ? "#1e293b" : "#eef2ff"}
                    />
                  </linearGradient>
                </defs>

                <rect
                  x="0"
                  y="0"
                  width="300"
                  height="220"
                  rx="16"
                  fill="url(#g)"
                />

                <g transform="translate(30,40)">
                  <circle
                    cx="200"
                    cy="39.5"
                    r="40"
                    fill={isDarkMode() ? "#334155" : "#fff"}
                    stroke={isDarkMode() ? "#818cd8" : "#c7d2fe"}
                    strokeWidth="2"
                  />
                  <text
                    x="200"
                    y="50"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="700"
                    fill={isDarkMode() ? "#fffff2" : "#1e293b"}
                  >
                    404
                  </text>

                  <g transform="translate(16,90)">
                    <rect
                      x="0"
                      y="0"
                      width="110"
                      height="12"
                      rx="6"
                      fill={isDarkMode() ? "#e5e7eb" : "#fff"}
                      opacity="0.6"
                    />
                    <rect
                      x="0"
                      y="16"
                      width="72"
                      height="10"
                      rx="5"
                      fill={isDarkMode() ? "#e5e7eb" : "#fff"}
                      opacity="0.5"
                    />
                  </g>
                </g>
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* subtle, full-bleed background accent */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-transparent" />
      </div>
    </main>
  );
}
