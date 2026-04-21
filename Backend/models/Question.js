const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"]
    },
    type: {
      type: String,
      required: true,
      enum: ["MCQ", "Theory"]
    },
    options: {
      type: [String],
      default: []
    },
    explanation: {
      type: String,
      default: "",
      trim: true
    },
    keywords: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast filtered queries
questionSchema.index({ topicId: 1, difficulty: 1, type: 1 });

module.exports = mongoose.model("Question", questionSchema);
