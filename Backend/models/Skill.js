const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    skillName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["Technical", "HR", "Behavioral"],
      required: true
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true
    },
    confidenceScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  {
    timestamps: true
  }
);

skillSchema.index({ userId: 1, skillName: 1 }, { unique: true });

module.exports = mongoose.model("Skill", skillSchema);
