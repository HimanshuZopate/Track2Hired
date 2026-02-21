const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getUserStreak,
  getStreakHistory,
  getConsistency
} = require("../controllers/streakController");

router.use(protect);

router.get("/", getUserStreak);
router.get("/history", getStreakHistory);
router.get("/consistency", getConsistency);

module.exports = router;
