const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true },
    institution: { type: String, trim: true },
    year: { type: String, trim: true },
    cgpa: { type: String, trim: true }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    techStack: { type: String, trim: true },
    link: { type: String, trim: true }
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    duration: { type: String, trim: true },
    description: { type: String, trim: true }
  },
  { _id: false }
);

const resumeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    personalInfo: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      portfolio: { type: String, trim: true }
    },
    education: {
      type: [educationSchema],
      default: []
    },
    skills: {
      type: [{ type: String, trim: true }],
      default: []
    },
    projects: {
      type: [projectSchema],
      default: []
    },
    certifications: {
      type: [{ type: String, trim: true }],
      default: []
    },
    experience: {
      type: [experienceSchema],
      default: []
    },
    achievements: {
      type: [{ type: String, trim: true }],
      default: []
    },
    targetJobDescription: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

resumeProfileSchema.index({ userId: 1 });

module.exports = mongoose.model("ResumeProfile", resumeProfileSchema);