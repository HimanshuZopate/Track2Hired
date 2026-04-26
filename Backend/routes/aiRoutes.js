const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  generateAiQuestions,
  answerQuestion,
  evaluateAllAnswers,
  recordQuestionAttempt,
  getGeneratedHistory,
} = require("../controllers/aiController");
const validateRequest = require("../middleware/validateRequest");
const { aiGenerateValidator, aiAnswerValidator } = require("../middleware/validators");

router.use(protect);

// Primary endpoints
router.post("/generate",      aiGenerateValidator, validateRequest, generateAiQuestions);   // POST /api/ai/generate
router.post("/answer",        aiAnswerValidator, validateRequest, answerQuestion);         // POST /api/ai/answer  (single, theory)
router.post("/evaluate-all",  evaluateAllAnswers);     // POST /api/ai/evaluate-all (batch MCQ)

// Backward-compat
router.post("/attempt",       recordQuestionAttempt);  // legacy self-report
router.get("/history",        getGeneratedHistory);    // stub

module.exports = router;
