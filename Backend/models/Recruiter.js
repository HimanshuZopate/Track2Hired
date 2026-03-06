const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Future module model: not used by active student workflows yet.
const recruiterSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    recruiterName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: ""
    },
    companySize: {
      type: String,
      trim: true,
      default: ""
    },
    role: {
      type: String,
      default: "recruiter",
      enum: ["recruiter", "admin"]
    }
  },
  {
    timestamps: true
  }
);

recruiterSchema.index({ companyName: 1, createdAt: -1 });

recruiterSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("Recruiter", recruiterSchema);
