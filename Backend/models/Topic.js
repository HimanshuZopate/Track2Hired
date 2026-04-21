const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        "MERN",
        "Cloud",
        "Networking",
        "Data Analyst",
        "Programming",
        "DevOps",
        "Fundamentals",
        "Tools"
      ],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Text index for autocomplete search
topicSchema.index({ name: "text" });

module.exports = mongoose.model("Topic", topicSchema);
