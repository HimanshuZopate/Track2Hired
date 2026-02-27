const mongoose = require("mongoose");

const SHORTLIST_STATUS = ["Shortlisted", "Rejected", "Contacted"];

// Future recruiter module model for candidate pipeline tracking.
const shortlistSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: true,
      index: true
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: SHORTLIST_STATUS,
      default: "Shortlisted"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

shortlistSchema.index({ recruiterId: 1, jobId: 1, candidateId: 1 }, { unique: true });
shortlistSchema.index({ jobId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Shortlist", shortlistSchema);
module.exports.SHORTLIST_STATUS = SHORTLIST_STATUS;
