const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// ==================== Security Middleware ====================

// CORP "same-origin" blocks cross-origin browser reads (e.g. SPA on :5173 calling API on :3000)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

/**
 * One allowed origin from env (strips trailing junk like inline // comments dotenv kept)
 */
function normalizeOriginEntry(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const firstToken = trimmed.split(/\s+/)[0];
  try {
    return new URL(firstToken).origin;
  } catch {
    return null;
  }
}

// CORS — allow Vite dev (5173) and same-port setups; FRONTEND_URL can be comma-separated
function parseAllowedOrigins(value) {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  const origins = value
    .split(",")
    .map((s) => normalizeOriginEntry(s))
    .filter(Boolean);
  return origins.length ? origins : null;
}

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const isProduction = process.env.NODE_ENV === "production";
const envOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);
// In dev, merge env + defaults so a single wrong/stale FRONTEND_URL never blocks Vite
const resolvedOrigins =
  !isProduction && envOrigins?.length
    ? [...new Set([...defaultAllowedOrigins, ...envOrigins])]
    : envOrigins?.length
      ? envOrigins
      : defaultAllowedOrigins;

// CORS configuration
const corsOptions = {
  origin: resolvedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
};

app.use(cors(corsOptions));

// Player / team images (served at /uploads/...)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ==================== Rate Limiting ====================

// General rate limiter for all API routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Don't rate limit GET requests (optional)
    return req.method === "GET" && !req.path.includes("/auth");
  },
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  skipSuccessfulRequests: false, // Count all requests
  message: "Too many login/register attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ==================== Routes ====================

// Import routes
const authRoutes = require("./routes/authRoutes");
const teamSeasonStatRoutes = require("./routes/teamSeasonStatRoutes");
const teamRoutes = require("./routes/teamRoutes");
const playerRoutes = require("./routes/playerRoutes");
const statRoutes = require("./routes/statRoutes");
const userRoutes = require("./routes/userRoute");
const realPlayerRoutes = require("./routes/realPlayerRoutes");

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running!",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamSeasonStatRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/users", userRoutes);
app.use("/api/real-players", realPlayerRoutes);

// ==================== Error Handling ====================

/**
 * 404 Not Found handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

/**
 * Global error handler middleware
 */
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Default error
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation Error";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    status = 400;
    message = "Duplicate field value entered";
  } else if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token expired";
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

module.exports = app;
