const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  // New dashboard endpoints
  getSummary,
  getSkills,
  getReadinessTrend,
  getPerformance,
  getSuggestions,
  // Legacy endpoints (backward compat)
  getPerformanceSummary,
  getPerformanceTrends,
  getWeakAreas,
} = require("../controllers/analyticsController");

// All analytics routes are protected
router.use(protect);

// ─── New Analytics Dashboard APIs ────────────────────────────────────────────
router.get("/summary",          getSummary);
router.get("/skills",           getSkills);
router.get("/readiness-trend",  getReadinessTrend);
router.get("/performance",      getPerformance);
router.get("/suggestions",      getSuggestions);

// ─── Legacy APIs (kept for backward compat) ───────────────────────────────────
router.get("/trends",           getPerformanceTrends);
router.get("/weak-areas",       getWeakAreas);

module.exports = router;