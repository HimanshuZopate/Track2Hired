const Skill = require("../models/Skill");
const ReadinessScore = require("../models/ReadinessScore");

const average = (values) => {
  if (!values.length) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Number((sum / values.length).toFixed(2));
};

const calculateAndUpsertReadiness = async (userId) => {
  const skills = await Skill.find({ userId }).select("category confidenceScore");

  const technicalScores = skills
    .filter((s) => s.category === "Technical")
    .map((s) => s.confidenceScore);

  const hrScores = skills
    .filter((s) => s.category === "HR")
    .map((s) => s.confidenceScore);

  const technicalScore = average(technicalScores);
  const hrScore = average(hrScores);

  // Weighted overall score: 70% technical + 30% HR
  const overallScore = Number((technicalScore * 0.7 + hrScore * 0.3).toFixed(2));

  const readiness = await ReadinessScore.findOneAndUpdate(
    { userId },
    {
      userId,
      technicalScore,
      hrScore,
      overallScore,
      lastUpdated: new Date()
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return readiness;
};

module.exports = {
  calculateAndUpsertReadiness
};
