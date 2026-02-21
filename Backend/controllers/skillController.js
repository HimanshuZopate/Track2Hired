const mongoose = require("mongoose");
const Skill = require("../models/Skill");
const ReadinessScore = require("../models/ReadinessScore");
const SkillHistory = require("../models/SkillHistory");
const { calculateAndUpsertReadiness } = require("../services/readinessService");
const { recordUserActivity } = require("../services/streakService");

// POST /api/skills
exports.addSkill = async (req, res) => {
  try {
    const { skillName, category, level, confidenceScore } = req.body;

    if (!skillName || !category || !level || confidenceScore === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const skill = await Skill.create({
      userId: req.user._id,
      skillName,
      category,
      level,
      confidenceScore
    });

    const readiness = await calculateAndUpsertReadiness(req.user._id);

    return res.status(201).json({ skill, readiness });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Skill already exists for this user" });
    }
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/skills
exports.getUserSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const readiness = await ReadinessScore.findOne({ userId: req.user._id });

    return res.json({ skills, readiness });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/skills/:id
exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid skill id" });
    }

    const allowedUpdates = ["skillName", "category", "level", "confidenceScore"];
    const updateData = {};

    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const existingSkill = await Skill.findOne({ _id: id, userId: req.user._id }).select(
      "confidenceScore"
    );

    if (!existingSkill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    const oldConfidence = Number(existingSkill.confidenceScore);
    const hasConfidenceUpdate = updateData.confidenceScore !== undefined;
    const newConfidence = hasConfidenceUpdate ? Number(updateData.confidenceScore) : oldConfidence;

    const skill = await Skill.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { returnDocument: "after", runValidators: true }
    );

    if (hasConfidenceUpdate && oldConfidence !== newConfidence) {
      await SkillHistory.create({
        userId: req.user._id,
        skillId: skill._id,
        oldConfidence,
        newConfidence,
        changeDate: new Date()
      });
    }

    const readiness = await calculateAndUpsertReadiness(req.user._id);

    await recordUserActivity(req.user._id, "SkillUpdate", skill._id);

    return res.json({ skill, readiness });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Skill already exists for this user" });
    }
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/skills/:id
exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid skill id" });
    }

    const skill = await Skill.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    const readiness = await calculateAndUpsertReadiness(req.user._id);

    return res.json({ message: "Skill deleted successfully", readiness });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
