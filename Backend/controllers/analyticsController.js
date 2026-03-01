const {
  calculateImprovementRate,
  detectWeakSkills,
  calculateConsistencyScore,
  detectStagnation,
  generatePerformanceSummary,
  getPerformanceTrends
} = require("../services/analyticsService");
const INTERNAL_SERVER_ERROR = "Internal server error";

// GET /api/analytics/summary
exports.getPerformanceSummary = async (req, res) => {
  try {
    const summary = await generatePerformanceSummary(req.user._id);

    return res.json({
      summary
    });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/analytics/trends
exports.getPerformanceTrends = async (req, res) => {
  try {
    const trends = await getPerformanceTrends(req.user._id);
    const [improvementRate, consistencyScore] = await Promise.all([
      calculateImprovementRate(req.user._id),
      calculateConsistencyScore(req.user._id)
    ]);

    return res.json({
      trends,
      metrics: {
        improvementRate,
        consistencyScore
      }
    });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/analytics/weak-areas
exports.getWeakAreas = async (req, res) => {
  try {
    const [weakestSkills, stagnationFlag] = await Promise.all([
      detectWeakSkills(req.user._id),
      detectStagnation(req.user._id)
    ]);

    return res.json({
      weakAreas: {
        weakestSkills,
        stagnationFlag
      }
    });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};