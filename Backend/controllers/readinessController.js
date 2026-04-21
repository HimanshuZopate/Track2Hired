const ReadinessScore = require("../models/ReadinessScore");
const { calculateAndUpsertReadiness } = require("../services/readinessService");

const INTERNAL_SERVER_ERROR = "Internal server error";

// GET /api/readiness
exports.getUserReadiness = async (req, res) => {
  try {
    let readiness = await ReadinessScore.findOne({ userId: req.user._id });

    if (!readiness) {
      readiness = await calculateAndUpsertReadiness(req.user._id);
    }

    return res.json({
      readiness: readiness || {
        userId: req.user._id,
        technicalScore: 0,
        hrScore: 0,
        overallScore: 0,
        lastUpdated: null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};
