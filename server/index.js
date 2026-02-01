// Load environment variables (only in development)
import dotenv from "dotenv";
import dns from "dns";

// Fix for MongoDB Atlas connection issues locally (querySrv ECONNREFUSED)
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  console.warn("Could not set custom DNS servers, using system defaults.");
}

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// 1. Packages
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App setup
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === "production";

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Trust proxy to capture real IP addresses
app.set("trust proxy", 1);

// CORS Configuration
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Rate limiting configuration
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use(globalLimiter);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import userRoutes from "./routes/userRoutes.js"; 
import limitsRoutes from "./routes/limitsRoutes.js"; 
import subscriptionRoutes from "./routes/subscriptionRoutes.js"; 
import authRoutes from "./routes/authRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import twoFARoutes from "./routes/twoFARoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js"; 

// Mount route handlers
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes); 
app.use("/api/limits", limitsRoutes); 
app.use("/api/subscription", subscriptionRoutes); 
app.use("/api/auth", authRoutes);
app.use("/api/auth/2fa", twoFARoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/admin/upload", uploadRoutes);
app.use("/api/gamification", gamificationRoutes);

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    // Check if MONGODB_URI exists
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // Connect to MongoDB with options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB Atlas Connected successfully! 🚀");

    // Configure logging based on environment
    if (isProduction) {
      console.log = (message, ...args) => {
        if (typeof message === 'string' && message.includes('🚀')) {
          // Allow startup messages in production
          process.stdout.write(message + (args.length ? ' ' + args.join(' ') : '') + '\n');
        }
      };
      console.error = (message, ...args) => {
        // Always log errors
        process.stderr.write('ERROR: ' + message + (args.length ? ' ' + args.join(' ') : '') + '\n');
      };
    }

    // Create HTTP server with socket.io
    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    // Socket.io event handler
    io.on("connection", (socket) => {
      socket.on("disconnect", () => {
      });
    });

    // Make io available globally for routes
    app.locals.io = io;

    // Start server
    httpServer.listen(PORT, () =>
      console.log(`Server running in ${process.env.NODE_ENV} mode on ${PORT}`),
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

try {
  startServer();
} catch (err) {
  console.error("❌ Error starting server:", err);
}
