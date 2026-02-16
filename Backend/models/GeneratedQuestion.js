const mongoose = require("mongoose");

const generatedQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    skill: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true
    },
    type: {
      type: String,
      enum: ["MCQ", "Theory", "Coding", "Mixed"],
      required: true
    },
    questions: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("GeneratedQuestion", generatedQuestionSchema);
