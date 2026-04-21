const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  generateQuestions,
  attemptQuestion,
  validateAnswer,
  getUserStats
} = require("../controllers/questionController");

router.use(protect);

router.post("/generate", generateQuestions);
router.post("/attempt", attemptQuestion);
router.post("/validate", validateAnswer);
router.get("/stats", getUserStats);

module.exports = router;
