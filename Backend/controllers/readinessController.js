const ReadinessScore = require("../models/ReadinessScore");
const { calculateAndUpsertReadiness } = require("../services/readinessService");

const { sendSuccess, sendError } = require("../utils/responseHandler");

// GET /api/readiness
exports.getUserReadiness = async (req, res) => {
  try {
    let readiness = await ReadinessScore.findOne({ userId: req.user._id });

    if (!readiness) {
      readiness = await calculateAndUpsertReadiness(req.user._id);
    }

    return sendSuccess(res, {
      readiness: readiness || {
        userId: req.user._id,
        technicalScore: 0,
        hrScore: 0,
        overallScore: 0,
        lastUpdated: null
      }
    }, "Readiness retrieved successfully", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};
