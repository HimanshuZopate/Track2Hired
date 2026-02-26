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
      required: true
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true
    },
    matchedKeywords: {
      type: [{ type: String, trim: true }],
      default: []
    },
    missingKeywords: {
      type: [{ type: String, trim: true }],
      default: []
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    suggestions: {
      type: [{ type: String, trim: true }],
      default: []
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

atsReportSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });

module.exports = mongoose.model("ATSReport", atsReportSchema);