const mongoose = require("mongoose");
const Question = require("../models/Question");
const Topic = require("../models/Topic");
const QuestionAttempt = require("../models/QuestionAttempt");
const ReadinessScore = require("../models/ReadinessScore");
const { calculateAndUpsertReadiness } = require("../services/readinessService");
const { updateSkillConfidence } = require("../services/skillProgressionService");
const { recordUserActivity } = require("../services/streakService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const shuffleArray = (items = []) => {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }
  return clone;
};

const clampCount = (count) => Math.min(10, Math.max(1, Number(count) || 5));

const selectQuestions = (questions, { difficulty, type, count }) => {
  const typedPool = type === "Mixed" ? questions : questions.filter((question) => question.type === type);
  const exactDifficulty = shuffleArray(
    typedPool.filter((question) => question.difficulty === difficulty)
  );
  const remainingDifficulty = shuffleArray(
    typedPool.filter((question) => question.difficulty !== difficulty)
  );

  const combined = [...exactDifficulty, ...remainingDifficulty];
  const selected = combined.slice(0, count);

  if (type === "Mixed" && selected.length < count) {
    const selectedIds = new Set(selected.map((question) => String(question._id)));
    const fallbackQuestions = shuffleArray(
      questions.filter((question) => !selectedIds.has(String(question._id)))
    );
    return shuffleArray([...selected, ...fallbackQuestions].slice(0, count));
  }

  return shuffleArray(selected);
};

const toResponseQuestion = (question, topicName) => ({
  id: String(question._id),
  question: question.question,
  type: question.type,
  options: Array.isArray(question.options) ? shuffleArray(question.options.map(String)) : [],
  tags: question.tags || [],
  difficulty: question.difficulty,
  topicName,
  topicId: question.topicId,
  skillName: question.skillName,
  explanation: question.explanation
});

const evaluateTheoryAnswer = (question, userAnswer) => {
  const normalizedAnswer = normalizeText(userAnswer);
  const keywords = Array.isArray(question.keywords)
    ? question.keywords.map(normalizeText).filter(Boolean)
    : [];

  const totalKeywords = keywords.length;
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(keyword)).length;

  if (!totalKeywords) {
    const isCorrect = normalizedAnswer.split(" ").filter(Boolean).length >= 12;
    return {
      isCorrect,
      score: isCorrect ? 70 : 35,
      matchedKeywords: 0,
      totalKeywords: 0
    };
  }

  const score = Math.round((matchedKeywords / totalKeywords) * 100);
  const threshold = Math.max(2, Math.ceil(totalKeywords * 0.6));

  return {
    isCorrect: matchedKeywords >= threshold,
    score,
    matchedKeywords,
    totalKeywords
  };
};

// POST /api/questions/generate
exports.generateQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, type, count = 5, excludeQuestionIds = [] } = req.body;

    if (!topic || !difficulty || !type) {
      return sendError(res, "Topic, difficulty, and type are required.", 400);
    }

    const topicDoc = await Topic.findOne({
      name: new RegExp(`^${escapeRegex(String(topic).trim())}$`, "i")
    });
    if (!topicDoc) {
      return sendError(res, "Topic not found.", 404);
    }

    const excludedIds = Array.isArray(excludeQuestionIds)
      ? excludeQuestionIds
          .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
          .map((id) => new mongoose.Types.ObjectId(String(id)))
      : [];

    const query = { topicId: topicDoc._id };
    if (excludedIds.length) {
      query._id = { $nin: excludedIds };
    }

    const topicQuestions = await Question.find(query).lean();

    if (!topicQuestions.length) {
      return sendSuccess(res, {
        topic: topicDoc.name,
        topicId: topicDoc._id,
        requestedCount: clampCount(count),
        returnedCount: 0,
        questions: [],
      }, "No more curated questions are available for this session and topic.", 200);
    }

    const selectedQuestions = selectQuestions(topicQuestions, {
      difficulty,
      type,
      count: clampCount(count)
    });

    return sendSuccess(res, {
      topic: topicDoc.name,
      topicId: topicDoc._id,
      requestedCount: clampCount(count),
      returnedCount: selectedQuestions.length,
      questions: selectedQuestions.map((question) => toResponseQuestion(question, topicDoc.name))
    }, "Questions retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

const attemptQuestion = async (req, res, next) => {
  try {
    const { questionId, userAnswer } = req.body;

    if (!questionId || userAnswer === undefined) {
      return sendError(res, "questionId and userAnswer are required.", 400);
    }

    const question = await Question.findById(questionId).populate("topicId", "name");
    if (!question) {
      return sendError(res, "Question not found.", 404);
    }

    let evaluation;
    if (question.type === "MCQ") {
      const isCorrect = normalizeText(question.answer) === normalizeText(userAnswer);
      evaluation = {
        isCorrect,
        score: isCorrect ? 100 : 0,
        matchedKeywords: 0,
        totalKeywords: 0
      };
    } else {
      evaluation = evaluateTheoryAnswer(question, userAnswer);
    }

    const existingAttempt = await QuestionAttempt.findOne({
      userId: req.user._id,
      questionId: String(questionId)
    });

    const attempt = await QuestionAttempt.findOneAndUpdate(
      { userId: req.user._id, questionId: String(questionId) },
      {
        $set: {
          userAnswer: String(userAnswer).trim(),
          isCorrect: evaluation.isCorrect,
          score: evaluation.score,
          difficulty: question.difficulty,
          topicId: question.topicId?._id || question.topicId,
          skillName: question.skillName
        },
        $inc: { attemptCount: 1 }
      },
      { upsert: true, setDefaultsOnInsert: true, returnDocument: "after" }
    );

    const shouldImproveSkill = evaluation.isCorrect && !existingAttempt?.isCorrect;

    let skillProgress = {
      improved: false,
      created: false,
      delta: 0,
      oldConfidence: null,
      newConfidence: null,
      skillName: question.skillName
    };

    let readiness = await ReadinessScore.findOne({ userId: req.user._id });

    if (shouldImproveSkill) {
      const progression = await updateSkillConfidence(
        req.user._id,
        question.skillName,
        question.difficulty,
        { category: "Technical" }
      );

      skillProgress = {
        improved: progression.improved,
        created: progression.created,
        delta: progression.delta,
        oldConfidence: progression.oldConfidence,
        newConfidence: progression.newConfidence,
        skillName: question.skillName
      };

      readiness = progression.readiness;
    } else if (!readiness) {
      readiness = await calculateAndUpsertReadiness(req.user._id);
    }

    await recordUserActivity(req.user._id, "question_answered", attempt._id);

    return sendSuccess(res, {
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      matchedKeywords: evaluation.matchedKeywords,
      totalKeywords: evaluation.totalKeywords,
      correctAnswer: question.answer,
      explanation: question.explanation,
      topicName: question.topicId?.name || "",
      skillName: question.skillName,
      difficulty: question.difficulty,
      skillProgress,
      readiness,
      attempt: {
        questionId: String(questionId),
        attemptCount: attempt.attemptCount,
        isCorrect: attempt.isCorrect,
        score: attempt.score,
        skillName: attempt.skillName,
        difficulty: attempt.difficulty
      }
    }, "Attempt evaluated successfully", 200);
  } catch (error) {
    next(error);
  }
};

// POST /api/questions/attempt
exports.attemptQuestion = attemptQuestion;
// Backward-compatible alias
exports.validateAnswer = attemptQuestion;

// GET /api/questions/stats
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [attempts, readiness] = await Promise.all([
      QuestionAttempt.find({ userId }).populate("topicId", "name").lean(),
      ReadinessScore.findOne({ userId }).lean()
    ]);

    const totalAttempts = attempts.reduce(
      (sum, attempt) => sum + Number(attempt.attemptCount || 1),
      0
    );
    const answeredQuestions = attempts.length;
    const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length;
    const accuracy = answeredQuestions > 0 ? Math.round((correctAttempts / answeredQuestions) * 100) : 0;

    const topicStats = {};
    attempts.forEach((attempt) => {
      const topicName = attempt.topicId?.name || attempt.skillName || "General";
      if (!topicStats[topicName]) {
        topicStats[topicName] = { total: 0, correct: 0 };
      }
      topicStats[topicName].total += 1;
      if (attempt.isCorrect) {
        topicStats[topicName].correct += 1;
      }
    });

    const topics = Object.entries(topicStats)
      .map(([topicName, values]) => ({
        topic: topicName,
        total: values.total,
        accuracy: Math.round((values.correct / values.total) * 100)
      }))
      .sort((left, right) => left.accuracy - right.accuracy || right.total - left.total);

    const weakTopics = topics.filter((topic) => topic.accuracy < 60);
    const suggestions = weakTopics.length
      ? weakTopics.map(
          (topic) =>
            `Focus on ${topic.topic}: review the explanation, revisit fundamentals, and retry medium questions to push accuracy beyond ${topic.accuracy}%.`
        )
      : ["Great consistency so far. Increase the difficulty or switch topics to keep improving."];

    return sendSuccess(res, {
      totalAttempts,
      answeredQuestions,
      accuracy,
      topics,
      weakTopics,
      suggestions,
      readiness
    }, "Stats retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};
