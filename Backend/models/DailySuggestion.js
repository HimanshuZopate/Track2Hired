const mongoose = require("mongoose");

const dailySuggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    suggestionText: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["Skill", "Practice", "Motivation"],
      required: true
    },
    generatedFrom: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

dailySuggestionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailySuggestion", dailySuggestionSchema);