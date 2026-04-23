const mongoose = require("mongoose");

const BADGE_TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

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
    },
    totalActivityCount: {
      type: Number,
      default: 0,
      min: 0
    },
    currentBadge: {
      type: String,
      enum: [...BADGE_TIERS, null],
      default: null
    },
    lastWarningDate: {
      type: Date,
      default: null
    },
    lastResetDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: false, updatedAt: true }
  }
);

module.exports = mongoose.model("UserStreak", userStreakSchema);
module.exports.BADGE_TIERS = BADGE_TIERS;
