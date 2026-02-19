const mongoose = require("mongoose");

const skillHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: true,
    index: true
  },
  oldConfidence: {
    type: Number,
    min: 1,
    max: 5
  },
  newConfidence: {
    type: Number,
    min: 1,
    max: 5
  },
  changeDate: {
    type: Date,
    default: Date.now,
    index: true
  }
});

skillHistorySchema.index({ userId: 1, skillId: 1, changeDate: -1 });

module.exports = mongoose.model("SkillHistory", skillHistorySchema);