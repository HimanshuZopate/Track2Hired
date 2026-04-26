const {
  calculateConsistencyScore,
  getHeatmapData,
  getLeaderboard,
  getStreakDashboardData,
  getUserActivityHistory,
  getUserNotifications,
  getUserStreakSummary,
  getUserSuggestions
} = require("../services/streakService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// GET /api/streak
exports.getUserStreak = async (req, res) => {
  try {
    const streak = await getUserStreakSummary(req.user._id);

    return sendSuccess(res, { streak }, "Streak retrieved successfully", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/streak/history
exports.getStreakHistory = async (req, res) => {
  try {
    const history = await getUserActivityHistory(req.user._id);

    return sendSuccess(res, {
      history,
      totalRecords: history.length
    }, "Streak history retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/streak/consistency
exports.getConsistency = async (req, res) => {
  try {
    const consistency = await calculateConsistencyScore(req.user._id);

    return sendSuccess(res, { consistency }, "Consistency retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/streak/heatmap
exports.getHeatmap = async (req, res) => {
  try {
    const heatmap = await getHeatmapData(req.user._id);

    return sendSuccess(res, heatmap, "Heatmap retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/streak/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user._id);

    return sendSuccess(res, notifications, "Notifications retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/streak/suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await getUserSuggestions(req.user._id);

    return sendSuccess(res, { suggestions }, "Suggestions retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/streak/dashboard
exports.getStreakDashboard = async (req, res) => {
  try {
    const dashboard = await getStreakDashboardData(req.user._id);

    return sendSuccess(res, dashboard, "Dashboard retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/leaderboard
exports.getLeaderboard = async (_req, res) => {
  try {
    const leaderboard = await getLeaderboard();

    return sendSuccess(res, { leaderboard }, "Leaderboard retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};
