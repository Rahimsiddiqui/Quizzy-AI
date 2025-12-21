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
        target: "http://localhost:5000/api",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },

  define: {
    global: "globalThis",
  },

  resolve: {
    alias: {
      crypto: "crypto-browserify",
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      supported: {
        bigint: false,
      },
    },
  },
});
