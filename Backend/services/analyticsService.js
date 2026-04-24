/**
 * analyticsService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-grade analytics engine for Track2Hired.
 * All calculations are derived from real DB collections — zero dummy logic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Skill = require("../models/Skill");
const SkillHistory = require("../models/SkillHistory");
const PerformanceSummary = require("../models/PerformanceSummary");
const QuestionAttempt = require("../models/QuestionAttempt");
const ReadinessScore = require("../models/ReadinessScore");
const Task = require("../models/Task");
const UserStreak = require("../models/UserStreak");
const UserActivity = require("../models/UserActivity");

// ─── helpers ──────────────────────────────────────────────────────────────────
const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUMMARY  — GET /api/analytics/summary
// ─────────────────────────────────────────────────────────────────────────────
const getSummary = async (userId) => {
  const [readiness, attempts, tasks, streak] = await Promise.all([
    ReadinessScore.findOne({ userId }).lean(),
    QuestionAttempt.find({ userId }).select("isCorrect").lean(),
    Task.countDocuments({ userId, status: "Completed" }),
    UserStreak.findOne({ userId }).select("currentStreak").lean(),
  ]);

  const totalAttempts = attempts.length;
  const correctAnswers = attempts.filter((a) => a.isCorrect).length;
  const accuracy =
    totalAttempts > 0 ? round((correctAnswers / totalAttempts) * 100) : 0;

  return {
    readinessScore: round(readiness?.overallScore ?? 0),
    accuracy,
    tasksCompleted: tasks,
    currentStreak: streak?.currentStreak ?? 0,
    totalAttempts,
    correctAnswers,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SKILLS  — GET /api/analytics/skills
// ─────────────────────────────────────────────────────────────────────────────
const getSkillsAnalysis = async (userId) => {
  const skills = await Skill.find({ userId })
    .sort({ confidenceScore: -1 })
    .lean();

  const weakSkills = skills.filter((s) => s.confidenceScore < 3);
  const strongSkills = skills.filter((s) => s.confidenceScore > 4);
  const averageConfidence =
    skills.length > 0
      ? round(
          skills.reduce((sum, s) => sum + s.confidenceScore, 0) / skills.length
        )
      : 0;

  return {
    all: skills.map((s) => ({
      skillName: s.skillName,
      category: s.category,
      level: s.level,
      confidenceScore: s.confidenceScore,
    })),
    weakSkills: weakSkills.map((s) => s.skillName),
    strongSkills: strongSkills.map((s) => s.skillName),
    averageConfidence,
    totalSkills: skills.length,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. READINESS TREND  — GET /api/analytics/readiness-trend
// ─────────────────────────────────────────────────────────────────────────────
const getReadinessTrend = async (userId, days = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Build a date-wise confidence delta aggregation from SkillHistory
  const trend = await SkillHistory.aggregate([
    {
      $match: {
        userId,
        changeDate: { $gte: fromDate },
      },
    },
    {
      $project: {
        day: {
          $dateToString: { format: "%Y-%m-%d", date: "$changeDate" },
        },
        delta: { $subtract: ["$newConfidence", "$oldConfidence"] },
        newConfidence: 1,
      },
    },
    {
      $group: {
        _id: "$day",
        avgConfidence: { $avg: "$newConfidence" },
        avgDelta: { $avg: "$delta" },
        totalUpdates: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Convert avgConfidence (1-5 scale) → readiness score (0-100)
  const points = trend.map((item) => ({
    date: item._id,
    score: round(((item.avgConfidence - 1) / 4) * 100),
    delta: round(item.avgDelta),
    updates: item.totalUpdates,
  }));

  // Also include current overall score as the latest data point if no recent history
  if (points.length === 0) {
    const readiness = await ReadinessScore.findOne({ userId }).lean();
    if (readiness) {
      points.push({
        date: new Date().toISOString().slice(0, 10),
        score: round(readiness.overallScore ?? 0),
        delta: 0,
        updates: 0,
      });
    }
  }

  return points;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. PERFORMANCE  — GET /api/analytics/performance
// ─────────────────────────────────────────────────────────────────────────────
const getPerformance = async (userId) => {
  const attempts = await QuestionAttempt.find({ userId })
    .select("isCorrect difficulty skillName createdAt")
    .lean();

  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const incorrect = total - correct;
  const accuracy = total > 0 ? round((correct / total) * 100) : 0;

  // Breakdown by difficulty
  const byDifficulty = {};
  for (const attempt of attempts) {
    const key = attempt.difficulty || "Unknown";
    if (!byDifficulty[key]) {
      byDifficulty[key] = { total: 0, correct: 0 };
    }
    byDifficulty[key].total += 1;
    if (attempt.isCorrect) byDifficulty[key].correct += 1;
  }

  const difficultyBreakdown = Object.entries(byDifficulty).map(
    ([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      correct: stats.correct,
      incorrect: stats.total - stats.correct,
      accuracy:
        stats.total > 0 ? round((stats.correct / stats.total) * 100) : 0,
    })
  );

  // Breakdown by skill
  const bySkill = {};
  for (const attempt of attempts) {
    const key = attempt.skillName || "General";
    if (!bySkill[key]) {
      bySkill[key] = { total: 0, correct: 0 };
    }
    bySkill[key].total += 1;
    if (attempt.isCorrect) bySkill[key].correct += 1;
  }

  const skillBreakdown = Object.entries(bySkill)
    .map(([skill, stats]) => ({
      skill,
      total: stats.total,
      correct: stats.correct,
      accuracy:
        stats.total > 0 ? round((stats.correct / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    totalAttempts: total,
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    accuracy,
    difficultyBreakdown,
    skillBreakdown,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. SUGGESTIONS  — GET /api/analytics/suggestions
// ─────────────────────────────────────────────────────────────────────────────
const getSuggestions = async (userId) => {
  const [skills, attempts, streak, activity] = await Promise.all([
    Skill.find({ userId }).lean(),
    QuestionAttempt.find({ userId }).select("isCorrect").lean(),
    UserStreak.findOne({ userId }).lean(),
    UserActivity.countDocuments({
      userId,
      activityDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const suggestions = [];

  // Rule 1 — Weak skills → suggest improvement
  const weakSkills = skills.filter((s) => s.confidenceScore < 3);
  if (weakSkills.length > 0) {
    const names = weakSkills
      .slice(0, 3)
      .map((s) => s.skillName)
      .join(", ");
    suggestions.push({
      type: "weak_skill",
      priority: "high",
      icon: "AlertTriangle",
      message: `You have ${weakSkills.length} weak skill(s): ${names}. Focus on improving confidence in these areas.`,
      action: "Go to Skills",
      route: "/skills",
    });
  }

  // Rule 2 — Low activity → suggest consistency
  if (activity < 3) {
    const currentStreak = streak?.currentStreak ?? 0;
    if (currentStreak === 0) {
      suggestions.push({
        type: "consistency",
        priority: "high",
        icon: "Flame",
        message:
          "You haven't been active in the last 7 days. Start today to rebuild your streak!",
        action: "Practice Now",
        route: "/practice",
      });
    } else {
      suggestions.push({
        type: "consistency",
        priority: "medium",
        icon: "Flame",
        message: `Low activity this week (${activity} sessions). Consistency is key — aim for at least one session per day.`,
        action: "Practice Now",
        route: "/practice",
      });
    }
  }

  // Rule 3 — Low accuracy → suggest more practice
  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const accuracy = total > 0 ? (correct / total) * 100 : null;

  if (accuracy !== null && accuracy < 60) {
    suggestions.push({
      type: "accuracy",
      priority: "high",
      icon: "Target",
      message: `Your accuracy is ${round(accuracy)}%. Review incorrect answers and revisit core concepts to improve.`,
      action: "View Practice",
      route: "/practice",
    });
  } else if (accuracy !== null && accuracy >= 60 && accuracy < 80) {
    suggestions.push({
      type: "accuracy",
      priority: "medium",
      icon: "Target",
      message: `Your accuracy is ${round(accuracy)}%. You are making progress — target 80%+ for placement readiness.`,
      action: "Keep Practicing",
      route: "/practice",
    });
  }

  // Rule 4 — No tasks completed recently
  const recentTasks = await Task.countDocuments({
    userId,
    status: "Completed",
    completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });
  if (recentTasks === 0) {
    suggestions.push({
      type: "productivity",
      priority: "medium",
      icon: "CheckSquare",
      message:
        "No tasks completed in the past 7 days. Break your preparation into small daily tasks.",
      action: "Manage Tasks",
      route: "/tasks",
    });
  }

  // Rule 5 — Strong performance, acknowledge
  if (accuracy !== null && accuracy >= 80 && (streak?.currentStreak ?? 0) >= 7) {
    suggestions.push({
      type: "praise",
      priority: "low",
      icon: "Sparkles",
      message: `Excellent! ${round(accuracy)}% accuracy and a ${streak.currentStreak}-day streak. Keep this momentum going!`,
      action: null,
      route: null,
    });
  }

  // Rule 6 — No skills added
  if (skills.length === 0) {
    suggestions.push({
      type: "setup",
      priority: "high",
      icon: "PlusCircle",
      message:
        "You haven't added any skills yet. Start by adding your technical and HR skills to get personalized analytics.",
      action: "Add Skills",
      route: "/skills",
    });
  }

  // Sort: high → medium → low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return suggestions;
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy functions kept for backward compatibility
// ─────────────────────────────────────────────────────────────────────────────
const calculateImprovementRate = async (userId) => {
  const result = await SkillHistory.aggregate([
    {
      $match: {
        userId,
        oldConfidence: { $ne: null },
        newConfidence: { $ne: null },
      },
    },
    { $project: { delta: { $subtract: ["$newConfidence", "$oldConfidence"] } } },
    { $group: { _id: null, avgDelta: { $avg: "$delta" } } },
  ]);
  const avgDelta = result.length ? result[0].avgDelta : 0;
  return round((avgDelta / 5) * 100);
};

const detectWeakSkills = async (userId) => {
  const weakSkills = await Skill.find({ userId, confidenceScore: { $lt: 3 } })
    .sort({ confidenceScore: 1, updatedAt: -1 })
    .limit(3)
    .select("skillName -_id");
  return weakSkills.map((skill) => skill.skillName);
};

const calculateConsistencyScore = async (userId) => {
  const daysWindow = 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysWindow);

  const activity = await SkillHistory.aggregate([
    { $match: { userId, changeDate: { $gte: fromDate } } },
    {
      $project: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$changeDate" } },
      },
    },
    { $group: { _id: "$day" } },
    { $count: "activeDays" },
  ]);

  const activeDays = activity.length ? activity[0].activeDays : 0;
  return round((activeDays / daysWindow) * 100);
};

const detectStagnation = async (userId) => {
  const daysWindow = 14;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysWindow);

  const recentEntries = await SkillHistory.find({
    userId,
    changeDate: { $gte: fromDate },
  }).select("oldConfidence newConfidence");

  if (!recentEntries.length) return true;
  return !recentEntries.some(
    (entry) => Number(entry.newConfidence) > Number(entry.oldConfidence)
  );
};

const generatePerformanceSummary = async (userId) => {
  const [improvementRate, weakestSkills, consistencyScore, stagnationFlag] =
    await Promise.all([
      calculateImprovementRate(userId),
      detectWeakSkills(userId),
      calculateConsistencyScore(userId),
      detectStagnation(userId),
    ]);

  const summary = await PerformanceSummary.findOneAndUpdate(
    { userId },
    {
      userId,
      improvementRate,
      weakestSkills,
      consistencyScore,
      stagnationFlag,
      lastAnalyzed: new Date(),
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
  return summary;
};

const getPerformanceTrends = async (userId, days = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const trends = await SkillHistory.aggregate([
    { $match: { userId, changeDate: { $gte: fromDate } } },
    {
      $project: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$changeDate" } },
        delta: { $subtract: ["$newConfidence", "$oldConfidence"] },
      },
    },
    {
      $group: {
        _id: "$day",
        averageDelta: { $avg: "$delta" },
        updatesCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return trends.map((item) => ({
    date: item._id,
    averageDelta: round(item.averageDelta),
    updatesCount: item.updatesCount,
  }));
};

module.exports = {
  // New dashboard APIs
  getSummary,
  getSkillsAnalysis,
  getReadinessTrend,
  getPerformance,
  getSuggestions,
  // Legacy (kept for backward compat)
  calculateImprovementRate,
  detectWeakSkills,
  calculateConsistencyScore,
  detectStagnation,
  generatePerformanceSummary,
  getPerformanceTrends,
};