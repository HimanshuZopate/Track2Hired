const mongoose = require("mongoose");

const ACTIVITY_TYPES = ["task_completed", "question_answered", "skill_added"];
const LEGACY_ACTIVITY_TYPES = ["SkillUpdate", "QuestionAttempt", "TaskComplete", "AIPractice"];
const ALL_ACTIVITY_TYPES = [...ACTIVITY_TYPES, ...LEGACY_ACTIVITY_TYPES];

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
      enum: ALL_ACTIVITY_TYPES,
      required: true
    },
    date: {
      type: String,
      default: null,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true
    },
    count: {
      type: Number,
      default: 1,
      min: 0
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

userActivitySchema.pre("validate", function deriveDateFields(next) {
  if (!this.date && this.activityDate instanceof Date && !Number.isNaN(this.activityDate.getTime())) {
    this.date = this.activityDate.toISOString().slice(0, 10);
  }

  if (!this.activityDate && this.date) {
    this.activityDate = new Date(`${this.date}T00:00:00.000Z`);
  }

  next();
});

userActivitySchema.index({ userId: 1, activityDate: 1 });
userActivitySchema.index({ userId: 1, date: 1, activityType: 1 });

module.exports = mongoose.model("UserActivity", userActivitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
module.exports.LEGACY_ACTIVITY_TYPES = LEGACY_ACTIVITY_TYPES;
module.exports.ALL_ACTIVITY_TYPES = ALL_ACTIVITY_TYPES;
