const mongoose = require("mongoose");
const fs = require("fs/promises");
const ResumeProfile = require("../models/ResumeProfile");
const ResumeDocument = require("../models/ResumeDocument");
const ATSReport = require("../models/ATSReport");
const {
  DEFAULT_TEMPLATE_KEY,
  getResumeTemplates,
  generateResumeContent,
  formatResumeTemplate,
  generatePDF
} = require("../services/aiResumeService");
const { analyzeResumeText } = require("../services/atsAnalyzerService");

const INTERNAL_SERVER_ERROR = "Internal server error";
const ATS_THRESHOLD = 70;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const safeString = (value = "") => String(value || "").trim();

const handleError = (res, error) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid request data" });
  }

  return res.status(error.statusCode || 500).json({ message: error.message || INTERNAL_SERVER_ERROR });
};

const parseMaybeJson = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return value;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

const toArray = (value) => {
  const parsed = parseMaybeJson(value, value);
  return Array.isArray(parsed) ? parsed : [];
};

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => safeString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    const parsed = parseMaybeJson(value, value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => safeString(item)).filter(Boolean);
    }

    return value
      .split(/\r?\n|,/)
      .map((item) => safeString(item))
      .filter(Boolean);
  }

  return [];
};

const logResumeDebug = (label, payload) => {
  // eslint-disable-next-line no-console
  console.log(`[ResumeDebug] ${label}:`, payload);
};

const normalizeProfilePayload = (body = {}) => {
  const personalInfo = parseMaybeJson(body.personalInfo, body.personalInfo || {});

  return {
    personalInfo: {
      name: safeString(personalInfo?.name || body?.name),
      email: safeString(personalInfo?.email || body?.email),
      phone: safeString(personalInfo?.phone || body?.phone),
      linkedin: safeString(personalInfo?.linkedin || body?.linkedin),
      github: safeString(personalInfo?.github || body?.github),
      portfolio: safeString(personalInfo?.portfolio || body?.portfolio)
    },
    education: toArray(body.education).map((item) => ({
      degree: safeString(item?.degree),
      institution: safeString(item?.institution),
      year: safeString(item?.year),
      cgpa: safeString(item?.cgpa)
    })),
    skills: toStringArray(body.skills),
    projects: toArray(body.projects).map((item) => ({
      title: safeString(item?.title),
      description: safeString(item?.description),
      techStack: safeString(item?.techStack),
      link: safeString(item?.link)
    })),
    certifications: toStringArray(body.certifications),
    experience: toArray(body.experience).map((item) => ({
      company: safeString(item?.company),
      role: safeString(item?.role),
      duration: safeString(item?.duration),
      description: safeString(item?.description)
    })),
    achievements: toStringArray(body.achievements),
    targetJobRole: safeString(body.targetJobRole),
    templateKey: safeString(body.templateKey) || DEFAULT_TEMPLATE_KEY,
    targetJobDescription: safeString(body.targetJobDescription || body.jobDescription)
  };
};

const hasInlineProfileData = (body = {}) => {
  const keys = [
    "personalInfo",
    "name",
    "email",
    "phone",
    "skills",
    "education",
    "projects",
    "experience",
    "certifications",
    "achievements",
    "targetJobRole",
    "targetJobDescription",
    "templateKey"
  ];

  return keys.some((key) => body[key] !== undefined);
};

const findOwnedProfile = async (userId, profileId) => {
  if (!profileId || !isValidObjectId(profileId)) {
    return null;
  }

  return ResumeProfile.findOne({ _id: profileId, userId });
};

const saveOrUpdateProfile = async (userId, body = {}) => {
  const payload = normalizeProfilePayload(body);
  const profileId = safeString(body.profileId);

  if (!payload.personalInfo.name || !payload.personalInfo.email) {
    const error = new Error("personalInfo.name and personalInfo.email are required");
    error.statusCode = 400;
    throw error;
  }

  if (profileId) {
    const existing = await findOwnedProfile(userId, profileId);
    if (!existing) {
      const error = new Error("Resume profile not found");
      error.statusCode = 404;
      throw error;
    }

    existing.set(payload);
    await existing.save();
    return existing;
  }

  return ResumeProfile.create({ userId, ...payload });
};

const ensureProfileForGeneration = async (userId, body = {}) => {
  const profileId = safeString(body.profileId);
  const shouldMergeInlineData = hasInlineProfileData(body);

  if (profileId) {
    const existing = await findOwnedProfile(userId, profileId);

    if (!existing) {
      const error = new Error("Resume profile not found");
      error.statusCode = 404;
      throw error;
    }

    if (shouldMergeInlineData) {
      const mergedPayload = normalizeProfilePayload({
        ...existing.toObject(),
        ...body,
        personalInfo: {
          ...(existing.personalInfo || {}),
          ...(parseMaybeJson(body.personalInfo, body.personalInfo || {}) || {})
        }
      });

      existing.set(mergedPayload);
      await existing.save();
    }

    return existing.toObject();
  }

  const created = await saveOrUpdateProfile(userId, body);
  return created.toObject();
};

const createAnalysisRecord = async ({ userId, resumeId = null, sourceType, resumeText, jobDescription, analysis }) =>
  ATSReport.create({
    userId,
    resumeId,
    sourceType,
    jobDescription,
    extractedResumeText: resumeText,
    matchedKeywords: analysis.matchedKeywords,
    missingKeywords: analysis.missingKeywords,
    matchedSkills: analysis.matchedSkills,
    missingSkills: analysis.missingSkills,
    keywordMatchPercentage: analysis.keywordMatchPercentage,
    atsScore: analysis.score,
    scoreBreakdown: analysis.scoreBreakdown,
    suggestions: analysis.suggestions,
    sectionsStatus: analysis.sectionsStatus,
    sectionWarnings: analysis.sectionWarnings,
    pitfalls: analysis.pitfalls,
    improvementChecklist: analysis.improvementChecklist,
    readyForATS: analysis.readyForATS,
    readyBadge: analysis.readyBadge
  });

const readResumeTextFromPdf = async (buffer) => {
  let pdfParse;

  try {
    pdfParse = require("pdf-parse");
  } catch {
    const error = new Error("pdf-parse is not installed. Run npm install in Backend to enable PDF analysis.");
    error.statusCode = 500;
    throw error;
  }

  const result = await pdfParse(buffer);
  return safeString(result?.text);
};

const readResumeFile = async (file) => {
  if (!file) {
    const error = new Error("Resume file is undefined");
    error.statusCode = 400;
    throw error;
  }

  const filePath = safeString(file.path);
  logResumeDebug("Uploaded file metadata", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: filePath || null
  });

  if (!filePath) {
    const error = new Error("Uploaded file path is missing");
    error.statusCode = 400;
    throw error;
  }

  try {
    await fs.access(filePath);
  } catch {
    const error = new Error("Uploaded file path does not exist");
    error.statusCode = 400;
    throw error;
  }

  const buffer = await fs.readFile(filePath);
  const isPdf =
    file.mimetype === "application/pdf" ||
    String(file.originalname || "").toLowerCase().endsWith(".pdf");

  const extractedText = isPdf ? await readResumeTextFromPdf(buffer) : safeString(buffer.toString("utf8"));

  if (!safeString(extractedText)) {
    const error = new Error("Extracted resume text is empty");
    error.statusCode = 422;
    throw error;
  }

  return {
    sourceType: isPdf ? "uploaded-pdf" : "uploaded-text",
    text: extractedText,
    filePath
  };
};

const extractResumeTextFromRequest = async (req) => {
  const resumeId = safeString(req.body?.resumeId);
  const resumeText = safeString(req.body?.resumeText);

  if (resumeId) {
    if (!isValidObjectId(resumeId)) {
      const error = new Error("Valid resumeId is required");
      error.statusCode = 400;
      throw error;
    }

    const resume = await ResumeDocument.findOne({ _id: resumeId, userId: req.user._id }).select("generatedContent");

    if (!resume) {
      const error = new Error("Resume not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      sourceType: "generated",
      resumeId,
      text: safeString(resume.generatedContent)
    };
  }

  if (req.file) {
    const extractedFile = await readResumeFile(req.file);

    return {
      sourceType: extractedFile.sourceType,
      resumeId: null,
      text: extractedFile.text,
      filePath: extractedFile.filePath
    };
  }

  if (resumeText) {
    return {
      sourceType: "text",
      resumeId: null,
      text: resumeText
    };
  }

  const error = new Error("Provide a resume PDF/text file, resume text, or resumeId");
  error.statusCode = 400;
  throw error;
};

exports.getResumeTemplates = async (req, res) => {
  return res.json({
    templates: getResumeTemplates(),
    defaultTemplateKey: DEFAULT_TEMPLATE_KEY
  });
};

exports.getLatestResumeWorkspace = async (req, res) => {
  try {
    const [profile, resume, report] = await Promise.all([
      ResumeProfile.findOne({ userId: req.user._id }).sort({ updatedAt: -1, createdAt: -1 }).lean(),
      ResumeDocument.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).lean(),
      ATSReport.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).lean()
    ]);

    return res.json({
      latestProfile: profile,
      latestResume: resume,
      latestReport: report,
      templates: getResumeTemplates(),
      defaultTemplateKey: DEFAULT_TEMPLATE_KEY
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/resume/profile
exports.saveResumeProfile = async (req, res) => {
  try {
    const profile = await saveOrUpdateProfile(req.user._id, req.body);

    return res.status(req.body?.profileId ? 200 : 201).json({
      message: req.body?.profileId ? "Resume profile updated" : "Resume profile saved",
      profile,
      templates: getResumeTemplates()
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/resume/generate
exports.generateResume = async (req, res) => {
  try {
    const profile = await ensureProfileForGeneration(req.user._id, req.body);
    const targetJobDescription = safeString(req.body?.jobDescription || profile.targetJobDescription);
    const templateKey = safeString(req.body?.templateKey || profile.templateKey) || DEFAULT_TEMPLATE_KEY;

    const generatedResume = await generateResumeContent(
      {
        ...profile,
        templateKey,
        targetJobDescription,
        targetJobRole: safeString(req.body?.targetJobRole || profile.targetJobRole)
      },
      {
        templateKey,
        jobDescription: targetJobDescription
      }
    );

    const formattedResume = formatResumeTemplate(generatedResume, templateKey);
    const analysis = analyzeResumeText(formattedResume.plainText, targetJobDescription, { threshold: ATS_THRESHOLD });
    const pdfUrl = await generatePDF(formattedResume);

    const resumeDoc = await ResumeDocument.create({
      userId: req.user._id,
      profileId: profile._id,
      generatedContent: formattedResume.plainText,
      htmlContent: formattedResume.htmlContent,
      templateKey,
      pdfUrl,
      atsScore: analysis.score,
      analysisSnapshot: analysis
    });

    return res.status(201).json({
      message: "Resume generated successfully",
      profile,
      resume: {
        _id: resumeDoc._id,
        profileId: resumeDoc.profileId,
        generatedContent: resumeDoc.generatedContent,
        htmlContent: resumeDoc.htmlContent,
        templateKey: resumeDoc.templateKey,
        pdfUrl: resumeDoc.pdfUrl,
        atsScore: resumeDoc.atsScore,
        createdAt: resumeDoc.createdAt
      },
      analysis,
      injectedKeywords: formattedResume.injectedKeywords,
      templates: getResumeTemplates(),
      shouldPromptBuilder: analysis.score < ATS_THRESHOLD
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

    const resume = await ResumeDocument.findOne({ _id: id, userId: req.user._id }).select("pdfUrl templateKey");

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.json({
      pdfUrl: resume.pdfUrl,
      fileName: `${resume.templateKey || "resume"}-${id}.pdf`
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/resume/analyze
exports.analyzeResumeATS = async (req, res) => {
  try {
    const jobDescription = safeString(req.body?.jobDescription);

    if (!jobDescription) {
      return res.status(400).json({ message: "jobDescription is required" });
    }

    const extracted = await extractResumeTextFromRequest(req);
    const analysis = analyzeResumeText(extracted.text, jobDescription, { threshold: ATS_THRESHOLD });

    logResumeDebug("Resume text", extracted.text);
    logResumeDebug("Job Description", jobDescription);
    logResumeDebug("Score", analysis.score);

    const report = await createAnalysisRecord({
      userId: req.user._id,
      resumeId: extracted.resumeId,
      sourceType: extracted.sourceType,
      resumeText: extracted.text,
      jobDescription,
      analysis
    });

    if (extracted.resumeId) {
      await ResumeDocument.updateOne(
        { _id: extracted.resumeId, userId: req.user._id },
        {
          $set: {
            atsScore: analysis.score,
            analysisSnapshot: analysis
          }
        }
      );
    }

    return res.status(201).json({
      message: "ATS analysis completed",
      reportId: report._id,
      sourceType: extracted.sourceType,
      ...analysis
    });
  } catch (error) {
    return handleError(res, error);
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path).catch(() => undefined);
    }
  }
};