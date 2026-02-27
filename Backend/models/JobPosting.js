const mongoose = require("mongoose");

// Future recruiter module: schema prepared for scalable hiring filters.
const jobPostingSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      index: true
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true
    },
    requiredSkills: {
      type: [{ type: String, trim: true }],
      default: []
    },
    minReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    minATSScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    minStreakDays: {
      type: Number,
      min: 0,
      default: 0
    },
    experienceLevel: {
      type: String,
      enum: ["Intern", "Fresher", "Junior", "Mid", "Senior", "Lead"],
      default: "Fresher"
    },
    location: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

jobPostingSchema.index({ recruiterId: 1, createdAt: -1 });
jobPostingSchema.index({ requiredSkills: 1 });

module.exports = mongoose.model("JobPosting", jobPostingSchema);
