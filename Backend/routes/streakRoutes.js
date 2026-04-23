const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getUserStreak,
  getStreakHistory,
  getConsistency,
  getHeatmap,
  getNotifications,
  getSuggestions,
  getStreakDashboard,
  getLeaderboard
} = require("../controllers/streakController");

router.use(protect);

router.get("/", getUserStreak);
router.get("/dashboard", getStreakDashboard);
router.get("/history", getStreakHistory);
router.get("/consistency", getConsistency);
router.get("/heatmap", getHeatmap);
router.get("/notifications", getNotifications);
router.get("/suggestions", getSuggestions);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
