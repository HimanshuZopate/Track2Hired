const mongoose = require("mongoose");

const readinessScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    technicalScore: {
      type: Number,
      default: 0
    },
    hrScore: {
      type: Number,
      default: 0
    },
    overallScore: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ReadinessScore", readinessScoreSchema);
