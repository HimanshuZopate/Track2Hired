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
const INTERNAL_SERVER_ERROR = "Internal server error";

// GET /api/streak
exports.getUserStreak = async (req, res) => {
  try {
    const streak = await getUserStreakSummary(req.user._id);

    return res.json({ streak });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/streak/history
exports.getStreakHistory = async (req, res) => {
  try {
    const history = await getUserActivityHistory(req.user._id);

    return res.json({
      history,
      totalRecords: history.length
    });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/streak/consistency
exports.getConsistency = async (req, res) => {
  try {
    const consistency = await calculateConsistencyScore(req.user._id);

    return res.json({ consistency });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/streak/heatmap
exports.getHeatmap = async (req, res) => {
  try {
    const heatmap = await getHeatmapData(req.user._id);

    return res.json(heatmap);
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/streak/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user._id);

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/streak/suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await getUserSuggestions(req.user._id);

    return res.json({ suggestions });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/streak/dashboard
exports.getStreakDashboard = async (req, res) => {
  try {
    const dashboard = await getStreakDashboardData(req.user._id);

    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/leaderboard
exports.getLeaderboard = async (_req, res) => {
  try {
    const leaderboard = await getLeaderboard();

    return res.json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};
