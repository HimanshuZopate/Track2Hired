const mongoose = require("mongoose");
const Skill = require("../models/Skill");
const ReadinessScore = require("../models/ReadinessScore");
const SkillHistory = require("../models/SkillHistory");
const { calculateAndUpsertReadiness } = require("../services/readinessService");
const { recordUserActivity } = require("../services/streakService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// POST /api/skills
exports.addSkill = async (req, res) => {
  try {
    const { skillName, category, level, confidenceScore } = req.body;

    if (!skillName || !category || !level || confidenceScore === undefined) {
      return sendError(res, "All fields are required", 400);
    }

    const skill = await Skill.create({
      userId: req.user._id,
      skillName,
      category,
      level,
      confidenceScore
    });

    const readiness = await calculateAndUpsertReadiness(req.user._id);

    await recordUserActivity(req.user._id, "skill_added", skill._id);

    return sendSuccess(res, { skill, readiness }, "Skill added successfully", 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, "Skill already exists for this user", 409);
    }
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/skills
exports.getUserSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const readiness = await ReadinessScore.findOne({ userId: req.user._id });

    return sendSuccess(res, { skills, readiness }, "Skills retrieved successfully", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// PUT /api/skills/:id
exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid skill id", 400);
    }

    const allowedUpdates = ["skillName", "category", "level", "confidenceScore"];
    const updateData = {};

    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return sendError(res, "No valid fields provided for update", 400);
    }

    const existingSkill = await Skill.findOne({ _id: id, userId: req.user._id }).select(
      "confidenceScore"
    );

    if (!existingSkill) {
      return sendError(res, "Skill not found", 404);
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

    await recordUserActivity(req.user._id, "skill_added", skill._id);

    return sendSuccess(res, { skill, readiness }, "Skill updated successfully", 200);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, "Skill already exists for this user", 409);
    }
    return sendError(res, "Internal server error", 500);
  }
};

// DELETE /api/skills/:id
exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid skill id", 400);
    }

    const skill = await Skill.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!skill) {
      return sendError(res, "Skill not found", 404);
    }

    const readiness = await calculateAndUpsertReadiness(req.user._id);

    return sendSuccess(res, { readiness }, "Skill deleted successfully", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};
