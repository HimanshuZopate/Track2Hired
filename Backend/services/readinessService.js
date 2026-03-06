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

  const technicalAvg = average(technicalScores);
  const hrAvg = average(hrScores);

  // Convert 1-5 confidence averages to percentage scale (0-100).
  const technicalScore = Number(((technicalAvg / 5) * 100).toFixed(2));
  const hrScore = Number(((hrAvg / 5) * 100).toFixed(2));

  // Weighted overall score: 70% technical + 30% HR (percentage scale)
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

const migrateLegacyReadinessScale = async () => {
  await ReadinessScore.updateMany(
    { overallScore: { $gt: 0, $lte: 5 } },
    [
      {
        $set: {
          technicalScore: {
            $cond: [
              { $and: [{ $gt: ["$technicalScore", 0] }, { $lte: ["$technicalScore", 5] }] },
              { $round: [{ $multiply: ["$technicalScore", 20] }, 2] },
              "$technicalScore"
            ]
          },
          hrScore: {
            $cond: [
              { $and: [{ $gt: ["$hrScore", 0] }, { $lte: ["$hrScore", 5] }] },
              { $round: [{ $multiply: ["$hrScore", 20] }, 2] },
              "$hrScore"
            ]
          },
          overallScore: {
            $round: [{ $multiply: ["$overallScore", 20] }, 2]
          },
          lastUpdated: new Date()
        }
      }
    ],
    { updatePipeline: true }
  );
};

module.exports = {
  calculateAndUpsertReadiness,
  migrateLegacyReadinessScale
};
