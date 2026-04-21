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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
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
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Beginner", "Intermediate", "Advanced"],
      default: null
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
