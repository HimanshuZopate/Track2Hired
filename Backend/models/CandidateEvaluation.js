const mongoose = require("mongoose");

// Future recruiter module snapshot model.
// Stores precomputed metrics for efficient candidate filtering/search.
const candidateEvaluationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    readinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    skillMatchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    streakScore: {
      type: Number,
      min: 0,
      default: 0
    },
    lastActive: {
      type: Date,
      default: null
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

candidateEvaluationSchema.index({ readinessScore: -1, atsScore: -1, streakScore: -1 });

module.exports = mongoose.model("CandidateEvaluation", candidateEvaluationSchema);
