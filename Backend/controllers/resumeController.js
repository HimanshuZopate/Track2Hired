const mongoose = require("mongoose");
const ResumeProfile = require("../models/ResumeProfile");
const ResumeDocument = require("../models/ResumeDocument");
const ATSReport = require("../models/ATSReport");
const {
  generateResumeContent,
  optimizeForATS,
  formatResumeTemplate,
  generatePDF
} = require("../services/aiResumeService");
const {
  extractKeywords,
  extractKeywordsFromResume,
  calculateATSScore,
  generateSuggestions
} = require("../services/atsAnalyzerService");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));

const handleError = (res, error) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid request data" });
  }

  return res.status(500).json({ message: error.message || "Internal server error" });
};

const normalizeProfilePayload = (body = {}) => {
  const toArray = (value) => (Array.isArray(value) ? value : []);

  return {
    personalInfo: {
      name: body?.personalInfo?.name,
      email: body?.personalInfo?.email,
      phone: body?.personalInfo?.phone,
      linkedin: body?.personalInfo?.linkedin,
      github: body?.personalInfo?.github,
      portfolio: body?.personalInfo?.portfolio
    },
    education: toArray(body.education),
    skills: toArray(body.skills),
    projects: toArray(body.projects),
    certifications: toArray(body.certifications),
    experience: toArray(body.experience),
    achievements: toArray(body.achievements),
    targetJobDescription: body.targetJobDescription || ""
  };
};

// POST /api/resume/profile
exports.saveResumeProfile = async (req, res) => {
  try {
    const payload = normalizeProfilePayload(req.body);

    if (!payload.personalInfo.name || !payload.personalInfo.email) {
      return res.status(400).json({ message: "personalInfo.name and personalInfo.email are required" });
    }

    const profile = await ResumeProfile.create({
      userId: req.user._id,
      ...payload
    });

    return res.status(201).json({ message: "Resume profile saved", profile });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/resume/generate
exports.generateResume = async (req, res) => {
  try {
    const { profileId } = req.body;

    if (!profileId || !isValidObjectId(profileId)) {
      return res.status(400).json({ message: "Valid profileId is required" });
    }

    const profile = await ResumeProfile.findOne({
      _id: profileId,
      userId: req.user._id
    }).lean();

    if (!profile) {
      return res.status(404).json({ message: "Resume profile not found" });
    }

    const generatedContent = await generateResumeContent(profile);
    const optimized = await optimizeForATS(generatedContent, profile.targetJobDescription);
    const formattedContent = formatResumeTemplate(optimized);
    const pdfUrl = await generatePDF(formattedContent);

    let atsScore = 0;
    if (profile.targetJobDescription) {
      const jdKeywords = extractKeywords(profile.targetJobDescription);
      const resumeKeywords = extractKeywordsFromResume(formattedContent);
      const matchedKeywords = jdKeywords.filter((keyword) => resumeKeywords.includes(keyword));
      const missingKeywords = jdKeywords.filter((keyword) => !resumeKeywords.includes(keyword));
      atsScore = calculateATSScore(matchedKeywords, missingKeywords);
    }

    const resumeDoc = await ResumeDocument.create({
      userId: req.user._id,
      profileId: profile._id,
      generatedContent: formattedContent,
      pdfUrl,
      atsScore
    });

    return res.status(201).json({
      message: "Resume generated successfully",
      resume: resumeDoc
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/resume/download/:id
exports.downloadResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid resume id" });
    }

    const resume = await ResumeDocument.findOne({ _id: id, userId: req.user._id }).select("pdfUrl");

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.json({ pdfUrl: resume.pdfUrl });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/resume/analyze
exports.analyzeResumeATS = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !isValidObjectId(resumeId)) {
      return res.status(400).json({ message: "Valid resumeId is required" });
    }

    if (!jobDescription || !String(jobDescription).trim()) {
      return res.status(400).json({ message: "jobDescription is required" });
    }

    const resume = await ResumeDocument.findOne({
      _id: resumeId,
      userId: req.user._id
    }).select("generatedContent");

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywordsFromResume(resume.generatedContent);

    const matchedKeywords = jdKeywords.filter((keyword) => resumeKeywords.includes(keyword));
    const missingKeywords = jdKeywords.filter((keyword) => !resumeKeywords.includes(keyword));
    const atsScore = calculateATSScore(matchedKeywords, missingKeywords);
    const suggestions = generateSuggestions(missingKeywords);

    const report = await ATSReport.create({
      userId: req.user._id,
      resumeId,
      jobDescription,
      matchedKeywords,
      missingKeywords,
      atsScore,
      suggestions
    });

    return res.status(201).json({
      message: "ATS analysis completed",
      reportId: report._id,
      atsScore,
      missingSkills: missingKeywords,
      suggestions
    });
  } catch (error) {
    return handleError(res, error);
  }
};