const mongoose = require("mongoose");

const userStreakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActiveDate: {
      type: Date,
      default: null
    },
    totalActiveDays: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: { createdAt: false, updatedAt: true }
  }
);

module.exports = mongoose.model("UserStreak", userStreakSchema);
