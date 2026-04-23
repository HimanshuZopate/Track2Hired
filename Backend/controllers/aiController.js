const mongoose = require("mongoose");
const GeneratedQuestion = require("../models/GeneratedQuestion");
const QuestionAttempt = require("../models/QuestionAttempt");
const { generateQuestions, ALLOWED_DIFFICULTIES, ALLOWED_TYPES } = require("../services/aiService");
const { updateSkillConfidence } = require("../services/skillProgressionService");
const { calculateAndUpsertReadiness } = require("../services/readinessService");
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

    if (result.usedFallback) {
      return res.status(200).json({
        success: false,
        error: "AI generation failed",
        message: "AI service temporarily busy. Showing curated backup questions.",
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
    const { questionId, userAnswer, isCorrect, generatedId, skillName, difficulty } = req.body;

    if (!questionId || userAnswer === undefined || typeof isCorrect !== "boolean") {
      return res.status(400).json({
        message: "questionId, userAnswer and isCorrect(boolean) are required"
      });
    }

    let generatedSession = null;
    if (generatedId && mongoose.Types.ObjectId.isValid(String(generatedId))) {
      generatedSession = await GeneratedQuestion.findOne({
        _id: generatedId,
        userId: req.user._id
      }).lean();
    }

    const resolvedSkillName = String(skillName || generatedSession?.skill || "").trim();
    const resolvedDifficulty = String(difficulty || generatedSession?.difficulty || "Intermediate").trim();

    const existingAttempt = await QuestionAttempt.findOne({
      userId: req.user._id,
      questionId: String(questionId)
    });

    const attempt = await QuestionAttempt.findOneAndUpdate(
      { userId: req.user._id, questionId: String(questionId) },
      {
        $set: {
          userAnswer: String(userAnswer),
          isCorrect,
          skillName: resolvedSkillName || null,
          difficulty: resolvedDifficulty || null
        },
        $inc: { attemptCount: 1 }
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        returnDocument: "after"
      }
    );

    let skillProgress = {
      improved: false,
      created: false,
      delta: 0,
      oldConfidence: null,
      newConfidence: null,
      skillName: resolvedSkillName || null
    };

    let readiness;

    if (isCorrect && !existingAttempt?.isCorrect && resolvedSkillName) {
      const progression = await updateSkillConfidence(
        req.user._id,
        resolvedSkillName,
        resolvedDifficulty,
        { category: "Technical" }
      );

      skillProgress = {
        improved: progression.improved,
        created: progression.created,
        delta: progression.delta,
        oldConfidence: progression.oldConfidence,
        newConfidence: progression.newConfidence,
        skillName: resolvedSkillName
      };

      readiness = progression.readiness;
    } else {
      readiness = await calculateAndUpsertReadiness(req.user._id);
    }

    await recordUserActivity(req.user._id, "question_answered", attempt._id);

    return res.status(201).json({
      message: "Attempt recorded",
      attempt,
      skillProgress,
      readiness
    });
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
