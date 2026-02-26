const mongoose = require("mongoose");

const resumeDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeProfile",
      required: true
    },
    generatedContent: {
      type: String,
      required: true
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: ""
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

resumeDocumentSchema.index({ userId: 1, profileId: 1, createdAt: -1 });

module.exports = mongoose.model("ResumeDocument", resumeDocumentSchema);