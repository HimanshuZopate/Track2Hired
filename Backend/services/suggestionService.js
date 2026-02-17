const Skill = require("../models/Skill");
const ReadinessScore = require("../models/ReadinessScore");
const QuestionAttempt = require("../models/QuestionAttempt");

const getStartAndEndOfTodayUTC = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const getRecentFailuresCount = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return QuestionAttempt.countDocuments({
    userId,
    isCorrect: false,
    updatedAt: { $gte: sevenDaysAgo }
  });
};

const buildSuggestion = async ({ userId, companyFocus }) => {
  const lowestConfidenceSkill = await Skill.findOne({ userId })
    .sort({ confidenceScore: 1, updatedAt: -1 })
    .select("skillName confidenceScore category");

  const readiness = await ReadinessScore.findOne({ userId }).select("overallScore");
  const recentFailures = await getRecentFailuresCount(userId);

  const readinessPercent = readiness ? Math.round((readiness.overallScore / 5) * 100) : 0;

  if (companyFocus && String(companyFocus).trim()) {
    return {
      suggestionText: `Today's Focus: Practice company-specific interview questions for ${companyFocus}.`,
      type: "Practice",
      generatedFrom: "Company focus selected by user"
    };
  }

  if (lowestConfidenceSkill && lowestConfidenceSkill.confidenceScore < 3) {
    return {
      suggestionText: `Today's Focus: Practice ${lowestConfidenceSkill.skillName} (Confidence ${lowestConfidenceSkill.confidenceScore}/5).`,
      type: "Skill",
      generatedFrom: "Lowest confidence skill detected below threshold"
    };
  }

  if (recentFailures >= 2) {
    return {
      suggestionText:
        "Daily Interview Task: Review your last incorrect answers and solve 3 similar questions today.",
      type: "Practice",
      generatedFrom: "Recent failed attempts detected in the last 7 days"
    };
  }

  if (readinessPercent < 60) {
    return {
      suggestionText:
        "Today's Focus: Do a 45-minute technical practice sprint to improve your readiness score.",
      type: "Practice",
      generatedFrom: "Overall readiness is below 60%"
    };
  }

  return {
    suggestionText: "Daily Interview Task: Attempt one full mock interview and review your responses.",
    type: "Practice",
    generatedFrom: "No critical weak skill found, defaulting to growth practice"
  };
};

module.exports = {
  buildSuggestion,
  getStartAndEndOfTodayUTC
};