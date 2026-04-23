const mongoose = require("mongoose");

const atsReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeDocument",
      default: null
    },
    sourceType: {
      type: String,
      trim: true,
      default: "uploaded"
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true
    },
    extractedResumeText: {
      type: String,
      default: ""
    },
    matchedKeywords: {
      type: [{ type: String, trim: true }],
      default: []
    },
    missingKeywords: {
      type: [{ type: String, trim: true }],
      default: []
    },
    matchedSkills: {
      type: [{ type: String, trim: true }],
      default: []
    },
    missingSkills: {
      type: [{ type: String, trim: true }],
      default: []
    },
    keywordMatchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    scoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    suggestions: {
      type: [{ type: String, trim: true }],
      default: []
    },
    sectionsStatus: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    sectionWarnings: {
      type: [{ type: String, trim: true }],
      default: []
    },
    pitfalls: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    improvementChecklist: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    readyForATS: {
      type: Boolean,
      default: false
    },
    readyBadge: {
      type: String,
      trim: true,
      default: "Needs Optimization"
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

atsReportSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });

module.exports = mongoose.model("ATSReport", atsReportSchema);