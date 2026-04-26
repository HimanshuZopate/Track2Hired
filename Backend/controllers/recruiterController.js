const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Recruiter = require("../models/Recruiter");
const JobPosting = require("../models/JobPosting");
const {
  filterCandidates,
  calculateCandidateMatch,
  generateCandidateSnapshot,
  shortlistCandidate
} = require("../services/recruiterService");

const { sendSuccess, sendError } = require("../utils/responseHandler");

const recruiterFeatureGuard = (res) => {
  const isEnabled = String(process.env.ENABLE_RECRUITER_MODULE || "false").toLowerCase() === "true";
  if (!isEnabled) {
    sendError(res, "Recruiter module is disabled. This is a future wireframe endpoint.", 503);
    return false;
  }
  return true;
};

const createRecruiterToken = (recruiter) => {
  return jwt.sign(
    {
      id: recruiter._id,
      role: "recruiter",
      actorType: "recruiter"
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// POST /api/recruiter/register
exports.registerRecruiter = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const { companyName, recruiterName, email, password, companyWebsite, companySize } = req.body;

    if (!companyName || !recruiterName || !email || !password) {
      return sendError(res, "companyName, recruiterName, email, password are required", 400);
    }

    const existing = await Recruiter.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return sendError(res, "Recruiter already exists", 409);
    }

    const recruiter = await Recruiter.create({
      companyName,
      recruiterName,
      email,
      password,
      companyWebsite,
      companySize
    });

    return sendSuccess(res, {
      _id: recruiter._id,
      companyName: recruiter.companyName,
      recruiterName: recruiter.recruiterName,
      email: recruiter.email,
      token: createRecruiterToken(recruiter)
    }, "Registration successful", 201);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// POST /api/recruiter/login
exports.loginRecruiter = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, "email and password are required", 400);
    }

    const recruiter = await Recruiter.findOne({ email: String(email).toLowerCase() });
    if (!recruiter) {
      return sendError(res, "Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, recruiter.password);
    if (!isMatch) {
      return sendError(res, "Invalid credentials", 401);
    }

    return sendSuccess(res, {
      _id: recruiter._id,
      companyName: recruiter.companyName,
      recruiterName: recruiter.recruiterName,
      email: recruiter.email,
      token: createRecruiterToken(recruiter)
    }, "Login successful", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// POST /api/recruiter/jobs
exports.createJobPosting = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const {
      recruiterId,
      jobTitle,
      jobDescription,
      requiredSkills,
      minReadinessScore,
      minATSScore,
      minStreakDays,
      experienceLevel,
      location
    } = req.body;

    if (!recruiterId || !jobTitle || !jobDescription) {
      return sendError(res, "recruiterId, jobTitle and jobDescription are required", 400);
    }

    const job = await JobPosting.create({
      recruiterId,
      jobTitle,
      jobDescription,
      requiredSkills,
      minReadinessScore,
      minATSScore,
      minStreakDays,
      experienceLevel,
      location
    });

    return sendSuccess(res, { job }, "Job created successfully", 201);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/recruiter/candidates
exports.getCandidates = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const criteria = {
      minReadinessScore: req.query.minReadinessScore,
      minATSScore: req.query.minATSScore,
      minStreakDays: req.query.minStreakDays,
      minSkillMatchPercentage: req.query.minSkillMatchPercentage,
      lastActiveAfter: req.query.lastActiveAfter
    };

    const candidates = await filterCandidates(criteria);
    return sendSuccess(res, { candidates }, "Candidates retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// POST /api/recruiter/candidates/snapshot/:userId
exports.generateSnapshot = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const snapshot = await generateCandidateSnapshot(req.params.userId);
    return sendSuccess(res, { snapshot }, "Snapshot generated", 201);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/recruiter/candidates/match/:jobId
exports.getCandidateMatches = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const matches = await calculateCandidateMatch(req.params.jobId);
    return sendSuccess(res, { matches }, "Matches retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// POST /api/recruiter/shortlist
exports.shortlist = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const { recruiterId, jobId, candidateId, status, notes } = req.body;
    if (!recruiterId || !jobId || !candidateId) {
      return sendError(res, "recruiterId, jobId and candidateId are required", 400);
    }

    const entry = await shortlistCandidate({ recruiterId, jobId, candidateId, status, notes });
    return sendSuccess(res, { shortlist: entry }, "Shortlisted successfully", 201);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};
