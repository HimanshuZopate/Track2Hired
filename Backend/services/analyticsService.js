const Skill = require("../models/Skill");
const SkillHistory = require("../models/SkillHistory");
const PerformanceSummary = require("../models/PerformanceSummary");

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const calculateImprovementRate = async (userId) => {
  const result = await SkillHistory.aggregate([
    {
      $match: {
        userId,
        oldConfidence: { $ne: null },
        newConfidence: { $ne: null }
      }
    },
    {
      $project: {
        delta: { $subtract: ["$newConfidence", "$oldConfidence"] }
      }
    },
    {
      $group: {
        _id: null,
        avgDelta: { $avg: "$delta" }
      }
    }
  ]);

  const avgDelta = result.length ? result[0].avgDelta : 0;

  // Confidence score is on a 1-5 scale. Convert average delta to percentage.
  return round((avgDelta / 5) * 100);
};

const detectWeakSkills = async (userId) => {
  const weakSkills = await Skill.find({ userId })
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
    {
      $match: {
        userId,
        changeDate: { $gte: fromDate }
      }
    },
    {
      $project: {
        day: {
          $dateToString: { format: "%Y-%m-%d", date: "$changeDate" }
        }
      }
    },
    {
      $group: {
        _id: "$day"
      }
    },
    {
      $count: "activeDays"
    }
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
    changeDate: { $gte: fromDate }
  }).select("oldConfidence newConfidence");

  if (!recentEntries.length) {
    return true;
  }

  const hasPositiveProgress = recentEntries.some(
    (entry) => Number(entry.newConfidence) > Number(entry.oldConfidence)
  );

  return !hasPositiveProgress;
};

const generatePerformanceSummary = async (userId) => {
  const [improvementRate, weakestSkills, consistencyScore, stagnationFlag] = await Promise.all([
    calculateImprovementRate(userId),
    detectWeakSkills(userId),
    calculateConsistencyScore(userId),
    detectStagnation(userId)
  ]);

  const summary = await PerformanceSummary.findOneAndUpdate(
    { userId },
    {
      userId,
      improvementRate,
      weakestSkills,
      consistencyScore,
      stagnationFlag,
      lastAnalyzed: new Date()
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return summary;
};

const getPerformanceTrends = async (userId, days = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const trends = await SkillHistory.aggregate([
    {
      $match: {
        userId,
        changeDate: { $gte: fromDate }
      }
    },
    {
      $project: {
        day: {
          $dateToString: { format: "%Y-%m-%d", date: "$changeDate" }
        },
        delta: { $subtract: ["$newConfidence", "$oldConfidence"] }
      }
    },
    {
      $group: {
        _id: "$day",
        averageDelta: { $avg: "$delta" },
        updatesCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return trends.map((item) => ({
    date: item._id,
    averageDelta: round(item.averageDelta),
    updatesCount: item.updatesCount
  }));
};

module.exports = {
  calculateImprovementRate,
  detectWeakSkills,
  calculateConsistencyScore,
  detectStagnation,
  generatePerformanceSummary,
  getPerformanceTrends
};