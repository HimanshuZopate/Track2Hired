const express = require("express");

const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getLeaderboard } = require("../controllers/streakController");

router.use(protect);

router.get("/", getLeaderboard);

module.exports = router;