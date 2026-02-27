const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    // Future-proof role support. Current active users remain "student".
    role: {
      type: String,
      enum: ["student", "recruiter", "admin"],
      default: "student"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
