const UserActivity = require("../models/UserActivity");
const UserStreak = require("../models/UserStreak");
const { calculateConsistencyScore } = require("../services/streakService");

// GET /api/streak
exports.getUserStreak = async (req, res) => {
  try {
    const streak = await UserStreak.findOne({ userId: req.user._id }).lean();

    return res.json({
      streak: streak || {
        userId: req.user._id,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        totalActiveDays: 0,
        updatedAt: null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/streak/history
exports.getStreakHistory = async (req, res) => {
  try {
    const history = await UserActivity.find({ userId: req.user._id })
      .sort({ activityDate: -1, createdAt: -1 })
      .limit(60)
      .select("activityType referenceId activityDate createdAt")
      .lean();

    return res.json({
      history,
      totalRecords: history.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/streak/consistency
exports.getConsistency = async (req, res) => {
  try {
    const consistency = await calculateConsistencyScore(req.user._id);

    return res.json({ consistency });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
