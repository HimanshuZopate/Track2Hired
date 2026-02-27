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

const recruiterFeatureGuard = (res) => {
  const isEnabled = String(process.env.ENABLE_RECRUITER_MODULE || "false").toLowerCase() === "true";
  if (!isEnabled) {
    res.status(503).json({
      message: "Recruiter module is disabled. This is a future wireframe endpoint."
    });
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
      return res.status(400).json({ message: "companyName, recruiterName, email, password are required" });
    }

    const existing = await Recruiter.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Recruiter already exists" });
    }

    const recruiter = await Recruiter.create({
      companyName,
      recruiterName,
      email,
      password,
      companyWebsite,
      companySize
    });

    return res.status(201).json({
      _id: recruiter._id,
      companyName: recruiter.companyName,
      recruiterName: recruiter.recruiterName,
      email: recruiter.email,
      token: createRecruiterToken(recruiter)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/recruiter/login
exports.loginRecruiter = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const recruiter = await Recruiter.findOne({ email: String(email).toLowerCase() });
    if (!recruiter) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, recruiter.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.json({
      _id: recruiter._id,
      companyName: recruiter.companyName,
      recruiterName: recruiter.recruiterName,
      email: recruiter.email,
      token: createRecruiterToken(recruiter)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
      return res.status(400).json({ message: "recruiterId, jobTitle and jobDescription are required" });
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

    return res.status(201).json({ job });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    return res.json({ candidates });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/recruiter/candidates/snapshot/:userId
exports.generateSnapshot = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const snapshot = await generateCandidateSnapshot(req.params.userId);
    return res.status(201).json({ snapshot });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/recruiter/candidates/match/:jobId
exports.getCandidateMatches = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const matches = await calculateCandidateMatch(req.params.jobId);
    return res.json({ matches });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/recruiter/shortlist
exports.shortlist = async (req, res) => {
  try {
    if (!recruiterFeatureGuard(res)) return;

    const { recruiterId, jobId, candidateId, status, notes } = req.body;
    if (!recruiterId || !jobId || !candidateId) {
      return res.status(400).json({ message: "recruiterId, jobId and candidateId are required" });
    }

    const entry = await shortlistCandidate({ recruiterId, jobId, candidateId, status, notes });
    return res.status(201).json({ shortlist: entry });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
