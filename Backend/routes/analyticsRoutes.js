const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getPerformanceSummary,
  getPerformanceTrends,
  getWeakAreas
} = require("../controllers/analyticsController");

router.use(protect);

router.get("/summary", getPerformanceSummary);
router.get("/trends", getPerformanceTrends);
router.get("/weak-areas", getWeakAreas);

module.exports = router;