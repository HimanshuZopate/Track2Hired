const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { migrateLegacyReadinessScale } = require("./services/readinessService");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,        // Disable CSP to avoid blocking frontend resources
  crossOriginEmbedderPolicy: false,    // Allow embedding from various origins
}));

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:4173"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ─── Body Parser with size limit ──────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

//Test Route
app.get("/", (req, res) => {
  res.send("Track2Hired API Running");
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// Standard protected routes
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/suggestions", require("./routes/suggestionRoutes"));
app.use("/api/motivation", require("./routes/motivationRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/streak", require("./routes/streakRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/api/readiness", require("./routes/readinessRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));
app.use("/api/topics", require("./routes/topicRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));

// Future recruiter module wiring (feature-flagged; disabled by default).
if (String(process.env.ENABLE_RECRUITER_MODULE || "false").toLowerCase() === "true") {
  app.use("/api/recruiter", require("./routes/recruiterRoutes"));
}

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const connectDB = require("./config/db");

console.log("Attempting to connect to MongoDB...");
connectDB()
  .then(async () => {
    await migrateLegacyReadinessScale();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "production"}]`);
    });
  })
  .catch((error) => {
    console.error("CRITICAL: Startup initialization failed!");
    console.error("Error Message:", error.message);
    process.exit(1);
  });
