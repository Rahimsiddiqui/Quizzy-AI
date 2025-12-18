import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Dev server configuration
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://quizzy-ai-production.up.railway.app/api",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
  },
});
