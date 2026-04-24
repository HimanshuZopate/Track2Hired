/**
 * analyticsController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin HTTP layer — validates auth, delegates to analyticsService, formats
 * responses. All business logic lives in the service.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const {
  getSummary,
  getSkillsAnalysis,
  getReadinessTrend,
  getPerformance,
  getSuggestions,
  // Legacy
  calculateImprovementRate,
  calculateConsistencyScore,
  detectWeakSkills,
  detectStagnation,
  generatePerformanceSummary,
  getPerformanceTrends,
} = require("../services/analyticsService");

const INTERNAL_SERVER_ERROR = "Internal server error";

// ─── GET /api/analytics/summary ───────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const data = await getSummary(req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[Analytics] getSummary error:", error.message);
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// ─── GET /api/analytics/skills ────────────────────────────────────────────────
exports.getSkills = async (req, res) => {
  try {
    const data = await getSkillsAnalysis(req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[Analytics] getSkills error:", error.message);
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// ─── GET /api/analytics/readiness-trend ───────────────────────────────────────
exports.getReadinessTrend = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const data = await getReadinessTrend(req.user._id, days);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[Analytics] getReadinessTrend error:", error.message);
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// ─── GET /api/analytics/performance ──────────────────────────────────────────
exports.getPerformance = async (req, res) => {
  try {
    const data = await getPerformance(req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[Analytics] getPerformance error:", error.message);
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// ─── GET /api/analytics/suggestions ──────────────────────────────────────────
exports.getSuggestions = async (req, res) => {
  try {
    const data = await getSuggestions(req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[Analytics] getSuggestions error:", error.message);
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// ─── Legacy endpoints (backward compat) ──────────────────────────────────────

// GET /api/analytics/summary (old)
exports.getPerformanceSummary = async (req, res) => {
  try {
    const summary = await generatePerformanceSummary(req.user._id);
    return res.json({ summary });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/analytics/trends (old)
exports.getPerformanceTrends = async (req, res) => {
  try {
    const trends = await getPerformanceTrends(req.user._id);
    const [improvementRate, consistencyScore] = await Promise.all([
      calculateImprovementRate(req.user._id),
      calculateConsistencyScore(req.user._id),
    ]);
    return res.json({ trends, metrics: { improvementRate, consistencyScore } });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/analytics/weak-areas (old)
exports.getWeakAreas = async (req, res) => {
  try {
    const [weakestSkills, stagnationFlag] = await Promise.all([
      detectWeakSkills(req.user._id),
      detectStagnation(req.user._id),
    ]);
    return res.json({ weakAreas: { weakestSkills, stagnationFlag } });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};