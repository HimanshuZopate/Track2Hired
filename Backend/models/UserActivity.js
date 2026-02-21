const mongoose = require("mongoose");

const ACTIVITY_TYPES = [
  "SkillUpdate",
  "QuestionAttempt",
  "TaskComplete",
  "AIPractice"
];

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    activityType: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    activityDate: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

userActivitySchema.index({ userId: 1, activityDate: 1 });

module.exports = mongoose.model("UserActivity", userActivitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
