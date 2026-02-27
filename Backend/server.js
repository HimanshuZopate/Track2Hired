const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Test Route
app.get("/", (req, res) => {
  res.send("Interview Readiness Tracker API Running");
});

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/suggestions", require("./routes/suggestionRoutes"));
app.use("/api/motivation", require("./routes/motivationRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/streak", require("./routes/streakRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));

// Future recruiter module wiring (feature-flagged; disabled by default).
if (String(process.env.ENABLE_RECRUITER_MODULE || "false").toLowerCase() === "true") {
  app.use("/api/recruiter", require("./routes/recruiterRoutes"));
}

const PORT = process.env.PORT || 5000;
const connectDB = require("./config/db");
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
