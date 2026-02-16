const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  generateAiQuestions,
  recordQuestionAttempt,
  getGeneratedHistory
} = require("../controllers/aiController");

router.use(protect);

router.post("/generate", generateAiQuestions);
router.post("/attempt", recordQuestionAttempt);
router.get("/history", getGeneratedHistory);

module.exports = router;
