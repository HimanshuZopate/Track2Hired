const mongoose = require("mongoose");
const User = require("../models/User");
const Skill = require("../models/Skill");
const ReadinessScore = require("../models/ReadinessScore");
const UserStreak = require("../models/UserStreak");
const UserActivity = require("../models/UserActivity");
const ResumeDocument = require("../models/ResumeDocument");
const JobPosting = require("../models/JobPosting");
const CandidateEvaluation = require("../models/CandidateEvaluation");
const Shortlist = require("../models/Shortlist");

const toObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) {
    throw new Error("Invalid ObjectId");
  }
  return new mongoose.Types.ObjectId(String(id));
};

const normalizeSkill = (value = "") => String(value).trim().toLowerCase();

const generateCandidateSnapshot = async (userId) => {
  const candidateId = toObjectId(userId);

  const [readiness, latestResume, streak, latestActivity, skills] = await Promise.all([
    ReadinessScore.findOne({ userId: candidateId }).lean(),
    ResumeDocument.findOne({ userId: candidateId }).sort({ createdAt: -1 }).lean(),
    UserStreak.findOne({ userId: candidateId }).lean(),
    UserActivity.findOne({ userId: candidateId }).sort({ activityDate: -1 }).lean(),
    Skill.find({ userId: candidateId }).lean()
  ]);

  const readinessScore = Number(readiness?.overallScore || 0);
  const atsScore = Number(latestResume?.atsScore || 0);
  const highConfidenceSkills = skills.filter((skill) => Number(skill.confidenceScore || 0) >= 3).length;
  const skillMatchPercentage =
    skills.length > 0 ? Math.round((highConfidenceSkills / skills.length) * 100) : 0;
  const streakScore = Number(streak?.currentStreak || 0);
  const lastActive = streak?.lastActiveDate || latestActivity?.activityDate || null;

  const snapshot = await CandidateEvaluation.findOneAndUpdate(
    { userId: candidateId },
    {
      $set: {
        readinessScore,
        atsScore,
        skillMatchPercentage,
        streakScore,
        lastActive,
        generatedAt: new Date()
      }
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  return snapshot;
};

const filterCandidates = async (criteria = {}) => {
  const query = {};

  if (criteria.minReadinessScore !== undefined) {
    query.readinessScore = { $gte: Number(criteria.minReadinessScore) || 0 };
  }

  if (criteria.minATSScore !== undefined) {
    query.atsScore = { $gte: Number(criteria.minATSScore) || 0 };
  }

  if (criteria.minStreakDays !== undefined) {
    query.streakScore = { $gte: Number(criteria.minStreakDays) || 0 };
  }

  if (criteria.minSkillMatchPercentage !== undefined) {
    query.skillMatchPercentage = { $gte: Number(criteria.minSkillMatchPercentage) || 0 };
  }

  if (criteria.lastActiveAfter) {
    query.lastActive = { $gte: new Date(criteria.lastActiveAfter) };
  }

  const snapshots = await CandidateEvaluation.find(query)
    .sort({ readinessScore: -1, atsScore: -1, streakScore: -1, generatedAt: -1 })
    .lean();

  if (!snapshots.length) {
    return [];
  }

  const users = await User.find({ _id: { $in: snapshots.map((item) => item.userId) } })
    .select("name email")
    .lean();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return snapshots.map((snapshot) => ({
    ...snapshot,
    user: userMap.get(String(snapshot.userId)) || null
  }));
};

const calculateCandidateMatch = async (jobId) => {
  const postingId = toObjectId(jobId);
  const job = await JobPosting.findById(postingId).lean();

  if (!job) {
    throw new Error("Job posting not found");
  }

  const requiredSkills = (job.requiredSkills || []).map(normalizeSkill).filter(Boolean);
  const users = await User.find({ role: "student" }).select("_id name email").lean();

  const matches = [];

  for (const user of users) {
    const [readiness, resume, streak, skills] = await Promise.all([
      ReadinessScore.findOne({ userId: user._id }).lean(),
      ResumeDocument.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean(),
      UserStreak.findOne({ userId: user._id }).lean(),
      Skill.find({ userId: user._id }).lean()
    ]);

    const candidateSkillSet = new Set(skills.map((skill) => normalizeSkill(skill.skillName)).filter(Boolean));
    const matchedSkills = requiredSkills.filter((required) => candidateSkillSet.has(required));
    const skillMatchPercentage = requiredSkills.length
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 100;

    const readinessScore = Number(readiness?.overallScore || 0);
    const atsScore = Number(resume?.atsScore || 0);
    const streakScore = Number(streak?.currentStreak || 0);

    const passedThresholds =
      readinessScore >= Number(job.minReadinessScore || 0) &&
      atsScore >= Number(job.minATSScore || 0) &&
      streakScore >= Number(job.minStreakDays || 0);

    await CandidateEvaluation.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          readinessScore,
          atsScore,
          skillMatchPercentage,
          streakScore,
          lastActive: streak?.lastActiveDate || null,
          generatedAt: new Date()
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    if (passedThresholds) {
      matches.push({
        user,
        readinessScore,
        atsScore,
        streakScore,
        skillMatchPercentage,
        matchedSkills
      });
    }
  }

  return matches.sort((a, b) => {
    const scoreA = a.skillMatchPercentage * 0.4 + a.readinessScore * 0.3 + a.atsScore * 0.2 + a.streakScore * 0.1;
    const scoreB = b.skillMatchPercentage * 0.4 + b.readinessScore * 0.3 + b.atsScore * 0.2 + b.streakScore * 0.1;
    return scoreB - scoreA;
  });
};

const shortlistCandidate = async ({ recruiterId, jobId, candidateId, status = "Shortlisted", notes = "" }) => {
  const payload = {
    recruiterId: toObjectId(recruiterId),
    jobId: toObjectId(jobId),
    candidateId: toObjectId(candidateId),
    status,
    notes
  };

  const shortlistEntry = await Shortlist.findOneAndUpdate(
    {
      recruiterId: payload.recruiterId,
      jobId: payload.jobId,
      candidateId: payload.candidateId
    },
    { $set: payload },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, runValidators: true }
  );

  return shortlistEntry;
};

module.exports = {
  filterCandidates,
  calculateCandidateMatch,
  generateCandidateSnapshot,
  shortlistCandidate
};
