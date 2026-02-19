const mongoose = require("mongoose");

const performanceSummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  improvementRate: {
    type: Number,
    default: 0
  },
  weakestSkills: {
    type: [String],
    default: []
  },
  consistencyScore: {
    type: Number,
    default: 0
  },
  stagnationFlag: {
    type: Boolean,
    default: false
  },
  lastAnalyzed: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("PerformanceSummary", performanceSummarySchema);