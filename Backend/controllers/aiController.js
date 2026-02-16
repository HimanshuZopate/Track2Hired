const GeneratedQuestion = require("../models/GeneratedQuestion");
const QuestionAttempt = require("../models/QuestionAttempt");
const { generateQuestions, ALLOWED_DIFFICULTIES, ALLOWED_TYPES } = require("../services/aiService");

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

    return res.status(201).json({
      message: result.usedFallback
        ? "Questions generated using fallback due to AI provider issue"
        : "Questions generated successfully",
      provider: result.provider,
      usedFallback: result.usedFallback,
      providerError: result.error || null,
      generatedId: generated._id,
      questions: result.questions
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

    return res.status(201).json({ message: "Attempt recorded", attempt });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    return res.status(500).json({ message: error.message });
  }
};
