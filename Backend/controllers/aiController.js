"use strict";

/**
 * aiController.js — Isolated AI question module
 *
 * POST /api/ai/generate  → MCQ (strict) or Theory generation; no DB storage
 * POST /api/ai/answer    → MCQ exact match | Theory keyword match; auto-upsert skill
 * POST /api/ai/attempt   → backward-compat self-report
 * GET  /api/ai/history   → stub
 */

const crypto = require("crypto");
const { generateQuestions, generateMcqQuestions, DIFFICULTY_FORWARD } = require("../services/aiService");
const { updateSkillConfidence } = require("../services/skillProgressionService");
const { recordUserActivity } = require("../services/streakService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// ─── Session cache ─────────────────────────────────────────────────────────────
// Stores full question objects (with correctAnswer/answer/keywords) — NEVER sent to client
const _sessionCache = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000;

function makeSessionId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

// ─── MCQ exact-match evaluator ────────────────────────────────────────────────
function evaluateMcq(userAnswer, cachedQuestion) {
  const correct = String(userAnswer || "").trim() ===
    String(cachedQuestion?.correctAnswer || cachedQuestion?.answer || "").trim();
  return { correct, matchScore: correct ? 100 : 0 };
}

// ─── Theory keyword evaluator ─────────────────────────────────────────────────
function normaliseText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evaluateTheory(userAnswer, question) {
  const userText = normaliseText(userAnswer);

  if (!question) {
    return { correct: userText.length >= 40, matchScore: userText.length >= 40 ? 65 : 20 };
  }

  const explicitKeywords = Array.isArray(question.keywords) ? question.keywords.map(normaliseText) : [];
  const answerWords = normaliseText(question.answer || "")
    .split(/\s+/)
    .filter((w) => w.length >= 5);

  const allKeywords = [...new Set([...explicitKeywords, ...answerWords])].filter(Boolean);

  if (!allKeywords.length) {
    return { correct: userText.length >= 40, matchScore: userText.length >= 40 ? 65 : 20 };
  }

  const matched = allKeywords.filter((k) => userText.includes(k));
  const matchScore = Math.round((matched.length / allKeywords.length) * 100);

  return { correct: matchScore >= 40, matchScore };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate
// Body: { skill|topic, difficulty, type: "MCQ"|"Theory"|"Mixed", count? }
// ─────────────────────────────────────────────────────────────────────────────
exports.generateAiQuestions = async (req, res) => {
  try {
    const { skill, topic, difficulty, type, count } = req.body;

    const resolvedTopic = String(skill || topic || "").trim();
    const resolvedDifficulty = String(difficulty || "Intermediate").trim();
    const resolvedType = String(type || "Theory").trim();
    const finalCount = Math.max(3, Math.min(10, Number(count) || 5));

    if (!resolvedTopic) {
      return sendError(res, "topic / skill is required", 400);
    }

    const aiDifficulty = DIFFICULTY_FORWARD[resolvedDifficulty] || "Intermediate";

    let result;

    // ── Route based on type ───────────────────────────────────────────────
    if (resolvedType === "MCQ") {
      // Strict MCQ path — dedicated generator
      result = await generateMcqQuestions({
        userId: req.user?._id,
        skill: resolvedTopic,
        difficulty: aiDifficulty,
        count: finalCount,
      });
    } else {
      // Theory / Mixed / Coding path
      result = await generateQuestions({
        userId: req.user?._id,
        skill: resolvedTopic,
        difficulty: aiDifficulty,
        type: resolvedType === "Theory" ? "Theory" : resolvedType,
        count: finalCount,
      });
    }

    // ── Cache full questions (with correctAnswer/answer) server-side ──────
    const sessionId = makeSessionId();
    _sessionCache.set(sessionId, {
      questions: result.questions,
      topic: resolvedTopic,
      difficulty: resolvedDifficulty,
      type: resolvedType,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    setTimeout(() => _sessionCache.delete(sessionId), SESSION_TTL_MS);

    // ── Build safe questions for client ───────────────────────────────────
    // For MCQ: keep options visible, strip correctAnswer
    // For Theory: strip answer + keywords
    const safeQuestions = result.questions.map((q) => {
      if (q.type === "MCQ" || resolvedType === "MCQ") {
        // eslint-disable-next-line no-unused-vars
        const { correctAnswer, answer, keywords, ...rest } = q;
        return rest; // options remain visible
      }
      // eslint-disable-next-line no-unused-vars
      const { answer, keywords, ...rest } = q;
      return rest;
    });

    return sendSuccess(res, {
      sessionId,
      generatedId: sessionId, // backward compat
      questions: safeQuestions,
      source: result.usedFallback ? "fallback" : "ai",
      usedFallback: !!result.usedFallback,
      providerError: result.usedFallback ? (result.error || null) : null,
    }, "Questions generated successfully", 200);
  } catch (error) {
    console.error("[AI] generateAiQuestions failed:", error.message);
    return sendError(res, "Failed to generate questions", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/answer  — backend evaluates
// Body: { sessionId, questionId, userAnswer, topic, difficulty }
// ─────────────────────────────────────────────────────────────────────────────
exports.answerQuestion = async (req, res) => {
  try {
    const { sessionId, questionId, userAnswer, topic, difficulty } = req.body;

    const trimmedAnswer = String(userAnswer || "").trim();
    if (trimmedAnswer.length < 1) {
      return sendError(res, "userAnswer is required", 400);
    }

    // ── Lookup cached question ────────────────────────────────────────────
    let cachedQuestion = null;
    let cachedTopic = topic;
    let cachedDifficulty = difficulty;
    let questionType = "Theory";

    if (sessionId && _sessionCache.has(sessionId)) {
      const session = _sessionCache.get(sessionId);
      if (session.expiresAt > Date.now()) {
        cachedQuestion = (session.questions || []).find(
          (q) => String(q.id) === String(questionId)
        ) || null;
        cachedTopic = cachedTopic || session.topic;
        cachedDifficulty = cachedDifficulty || session.difficulty;
        questionType = session.type || cachedQuestion?.type || "Theory";
      }
    }

    // ── Evaluate: MCQ = exact match, Theory = keyword match ──────────────
    const isMcq = questionType === "MCQ" || cachedQuestion?.type === "MCQ";
    const evaluation = isMcq
      ? evaluateMcq(trimmedAnswer, cachedQuestion)
      : evaluateTheory(trimmedAnswer, cachedQuestion);

    // ── Auto-upsert skill if correct ─────────────────────────────────────
    let skillProgress = {
      improved: false, created: false, delta: 0,
      oldConfidence: null, newConfidence: null,
      skillName: cachedTopic || "General",
    };

    if (evaluation.correct && cachedTopic) {
      try {
        const progression = await updateSkillConfidence(
          req.user._id,
          cachedTopic,
          cachedDifficulty || "Medium",
          { category: "Technical" }
        );
        skillProgress = {
          improved: progression.improved,
          created: progression.created,
          delta: progression.delta,
          oldConfidence: progression.oldConfidence,
          newConfidence: progression.newConfidence,
          skillName: cachedTopic,
        };
      } catch (skillErr) {
        console.warn("[AI] Skill update failed (non-fatal):", skillErr.message);
      }
    }

    try { await recordUserActivity(req.user._id, "question_answered", null); } catch { /* non-fatal */ }

    return sendSuccess(res, {
      correct: evaluation.correct,
      matchScore: evaluation.matchScore || 0,
      isMcq,
      // Reveal answers after submission
      correctAnswer: cachedQuestion?.correctAnswer || cachedQuestion?.answer || null,
      explanation: cachedQuestion?.explanation || null,
      skillProgress,
    }, "Answer evaluated successfully", 200);
  } catch (error) {
    console.error("[AI] answerQuestion failed:", error.message);
    return sendError(res, "Failed to evaluate answer", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/attempt  — backward-compat self-report
// ─────────────────────────────────────────────────────────────────────────────
exports.recordQuestionAttempt = async (req, res) => {
  try {
    const { questionId, userAnswer, isCorrect, skillName, difficulty } = req.body;

    if (!questionId || userAnswer === undefined || typeof isCorrect !== "boolean") {
      return sendError(res, "questionId, userAnswer and isCorrect (boolean) are required", 400);
    }

    let skillProgress = { improved: false, created: false, delta: 0 };

    if (isCorrect && skillName) {
      try {
        const progression = await updateSkillConfidence(
          req.user._id, skillName, difficulty || "Medium", { category: "Technical" }
        );
        skillProgress = {
          improved: progression.improved, created: progression.created,
          delta: progression.delta, oldConfidence: progression.oldConfidence,
          newConfidence: progression.newConfidence, skillName,
        };
      } catch { /* non-fatal */ }
    }

    try { await recordUserActivity(req.user._id, "question_answered", null); } catch { /* non-fatal */ }

    return sendSuccess(res, {
      attempt: { questionId, userAnswer, isCorrect, attemptCount: 1 },
      skillProgress,
    }, "Attempt recorded", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/ai/history — stub
exports.getGeneratedHistory = async (_req, res) => sendSuccess(res, { history: [] }, "History retrieved", 200);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/evaluate-all  — batch MCQ evaluation
// Body: { sessionId, answers: { "q1": "selected option text", ... } }
// ─────────────────────────────────────────────────────────────────────────────
exports.evaluateAllAnswers = async (req, res) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers || typeof answers !== "object") {
      return sendError(res, "sessionId and answers object are required", 400);
    }

    const session = _sessionCache.get(sessionId);
    if (!session || session.expiresAt <= Date.now()) {
      return sendError(res, "Session expired or not found. Please generate questions again.", 404);
    }

    // Evaluate each submitted answer
    const results = {};
    let correctCount = 0;

    for (const q of session.questions) {
      const userAnswer = answers[q.id];
      if (!userAnswer) continue; // not answered

      const correct = String(userAnswer).trim() === String(q.correctAnswer || q.answer || "").trim();
      if (correct) correctCount++;

      results[q.id] = {
        correct,
        userAnswer,
        correctAnswer: q.correctAnswer || q.answer || null,
        explanation: q.explanation || null,
      };
    }

    // Update skill ONCE per session if any correct answers
    let skillProgress = { improved: false, created: false, delta: 0, skillName: session.topic };
    if (correctCount > 0 && session.topic) {
      try {
        const progression = await updateSkillConfidence(
          req.user._id,
          session.topic,
          session.difficulty || "Medium",
          { category: "Technical" }
        );
        skillProgress = {
          improved: progression.improved,
          created: progression.created,
          delta: progression.delta,
          oldConfidence: progression.oldConfidence,
          newConfidence: progression.newConfidence,
          skillName: session.topic,
        };
      } catch (e) {
        console.warn("[AI] Skill update failed (non-fatal):", e.message);
      }
    }

    try { await recordUserActivity(req.user._id, "question_answered", null); } catch { /* non-fatal */ }

    return sendSuccess(res, {
      results,
      correctCount,
      total: Object.keys(results).length,
      skillProgress,
    }, "All answers evaluated successfully", 200);
  } catch (error) {
    console.error("[AI] evaluateAllAnswers failed:", error.message);
    return sendError(res, "Failed to evaluate answers", 500);
  }
};
