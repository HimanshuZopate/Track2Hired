const GeneratedQuestion = require("../models/GeneratedQuestion");
const QuestionAttempt = require("../models/QuestionAttempt");
const { generateQuestions, ALLOWED_DIFFICULTIES, ALLOWED_TYPES } = require("../services/aiService");
const { recordUserActivity } = require("../services/streakService");
const INTERNAL_SERVER_ERROR = "Internal server error";

// POST /api/ai/generate
exports.generateAiQuestions = async (req, res) => {
  try {
    const { skill, difficulty, type, count } = req.body;

    if (!skill || !difficulty || !type) {
      return res.status(400).json({ message: "skill, difficulty and type are required" });
    }

    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        message: `Invalid difficulty. Allowed: ${ALLOWED_DIFFICULTIES.join(", ")}`
      });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}`
      });
    }

    const requestedCount = Number(count || 5);
    const finalCount = Number.isFinite(requestedCount)
      ? Math.max(1, Math.min(10, requestedCount))
      : 5;

    const result = await generateQuestions({
      userId: req.user?._id,
      skill,
      difficulty,
      type,
      count: finalCount
    });

    const generated = await GeneratedQuestion.create({
      userId: req.user._id,
      skill,
      difficulty,
      type,
      questions: result.questions
    });

    await recordUserActivity(req.user._id, "AIPractice", generated._id);

    if (result.usedFallback) {
      return res.status(200).json({
        success: false,
        error: "AI generation failed",
        message: "AI service temporarily busy. Showing fallback questions.",
        fallbackUsed: true,
        provider: result.provider,
        usedFallback: true,
        providerError: result.error || null,
        generatedId: generated._id,
        questions: result.questions
      });
    }

    return res.status(201).json({
      success: true,
      message: "Questions generated successfully",
      fallbackUsed: false,
      provider: result.provider,
      usedFallback: false,
      providerError: null,
      generatedId: generated._id,
      questions: result.questions
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[AI_CONTROLLER] generateAiQuestions failed:", error?.message || error);

    if (error?.message === "AI API FAILED") {
      return res.status(502).json({
        success: false,
        error: "AI generation failed",
        fallbackUsed: false
      });
    }

    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// POST /api/ai/attempt
exports.recordQuestionAttempt = async (req, res) => {
  try {
    const { questionId, userAnswer, isCorrect } = req.body;

    if (!questionId || userAnswer === undefined || typeof isCorrect !== "boolean") {
      return res.status(400).json({
        message: "questionId, userAnswer and isCorrect(boolean) are required"
      });
    }

    const attempt = await QuestionAttempt.findOneAndUpdate(
      { userId: req.user._id, questionId: String(questionId) },
      {
        $set: {
          userAnswer: String(userAnswer),
          isCorrect
        },
        $inc: { attemptCount: 1 }
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        returnDocument: "after"
      }
    );

    await recordUserActivity(req.user._id, "QuestionAttempt", attempt._id);

    return res.status(201).json({ message: "Attempt recorded", attempt });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};

// GET /api/ai/history
exports.getGeneratedHistory = async (req, res) => {
  try {
    const history = await GeneratedQuestion.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ message: INTERNAL_SERVER_ERROR });
  }
};
