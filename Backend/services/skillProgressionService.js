const Skill = require("../models/Skill");
const SkillHistory = require("../models/SkillHistory");
const { calculateAndUpsertReadiness } = require("./readinessService");

const DIFFICULTY_INCREMENT = {
  Easy: 0.2,
  Medium: 0.4,
  Hard: 0.6
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clampConfidence = (value) => Math.min(5, Math.max(1, Number(value || 1)));

const deriveLevelFromConfidence = (confidence) => {
  if (confidence >= 4) return "Advanced";
  if (confidence >= 2.5) return "Intermediate";
  return "Beginner";
};

const normalizeCategory = (category = "Technical") => {
  const allowed = ["Technical", "HR", "Behavioral"];
  return allowed.includes(category) ? category : "Technical";
};

const normalizeDifficulty = (difficulty = "Medium") => {
  const difficultyMap = {
    Beginner: "Easy",
    Intermediate: "Medium",
    Advanced: "Hard"
  };

  const mappedDifficulty = difficultyMap[difficulty] || difficulty;
  const allowed = ["Easy", "Medium", "Hard"];
  return allowed.includes(mappedDifficulty) ? mappedDifficulty : "Medium";
};

const updateSkillConfidence = async (userId, skillName, difficulty, options = {}) => {
  const normalizedSkillName = String(skillName || "").trim();
  if (!normalizedSkillName) {
    const readiness = await calculateAndUpsertReadiness(userId);
    return {
      improved: false,
      created: false,
      delta: 0,
      oldConfidence: null,
      newConfidence: null,
      skill: null,
      readiness
    };
  }

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const confidenceDelta = DIFFICULTY_INCREMENT[normalizedDifficulty] || 0.4;
  const category = normalizeCategory(options.category);

  let skill = await Skill.findOne({
    userId,
    skillName: new RegExp(`^${escapeRegex(normalizedSkillName)}$`, "i")
  });

  let created = false;
  let oldConfidence = 1;

  if (!skill) {
    created = true;
    const newConfidence = clampConfidence(Number((1 + confidenceDelta).toFixed(2)));
    skill = await Skill.create({
      userId,
      skillName: normalizedSkillName,
      category,
      level: deriveLevelFromConfidence(newConfidence),
      confidenceScore: newConfidence
    });

    await SkillHistory.create({
      userId,
      skillId: skill._id,
      oldConfidence,
      newConfidence,
      changeDate: new Date()
    });

    const readiness = await calculateAndUpsertReadiness(userId);

    return {
      improved: true,
      created,
      delta: Number((newConfidence - oldConfidence).toFixed(2)),
      oldConfidence,
      newConfidence,
      skill,
      readiness
    };
  }

  oldConfidence = clampConfidence(skill.confidenceScore);
  const nextConfidence = clampConfidence(Number((oldConfidence + confidenceDelta).toFixed(2)));
  const improved = nextConfidence > oldConfidence;

  if (improved) {
    skill.confidenceScore = nextConfidence;
    skill.level = deriveLevelFromConfidence(nextConfidence);
    if (!skill.category) {
      skill.category = category;
    }

    await skill.save();

    await SkillHistory.create({
      userId,
      skillId: skill._id,
      oldConfidence,
      newConfidence: nextConfidence,
      changeDate: new Date()
    });
  }

  const readiness = await calculateAndUpsertReadiness(userId);

  return {
    improved,
    created,
    delta: improved ? Number((nextConfidence - oldConfidence).toFixed(2)) : 0,
    oldConfidence,
    newConfidence: improved ? nextConfidence : oldConfidence,
    skill,
    readiness
  };
};

module.exports = {
  DIFFICULTY_INCREMENT,
  updateSkillConfidence
};