const mongoose = require("mongoose");

const questionAttemptSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    userAnswer: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    attemptCount: {
      type: Number,
      min: 1,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

questionAttemptSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("QuestionAttempt", questionAttemptSchema);
