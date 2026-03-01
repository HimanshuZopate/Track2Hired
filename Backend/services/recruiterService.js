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

const toNumberOrDefault = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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
  const requiredSkillsCount = requiredSkills.length;

  const minReadinessScore = toNumberOrDefault(job.minReadinessScore, 0);
  const minATSScore = toNumberOrDefault(job.minATSScore, 0);
  const minStreakDays = toNumberOrDefault(job.minStreakDays, 0);

  const candidates = await User.aggregate([
    { $match: { role: "student" } },
    {
      $lookup: {
        from: "readinessscores",
        localField: "_id",
        foreignField: "userId",
        as: "readiness"
      }
    },
    {
      $lookup: {
        from: "resumedocuments",
        let: { uid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { atsScore: 1 } }
        ],
        as: "latestResume"
      }
    },
    {
      $lookup: {
        from: "userstreaks",
        localField: "_id",
        foreignField: "userId",
        as: "streak"
      }
    },
    {
      $lookup: {
        from: "skills",
        localField: "_id",
        foreignField: "userId",
        as: "skills"
      }
    },
    {
      $addFields: {
        readinessScore: {
          $ifNull: [{ $arrayElemAt: ["$readiness.overallScore", 0] }, 0]
        },
        atsScore: {
          $ifNull: [{ $arrayElemAt: ["$latestResume.atsScore", 0] }, 0]
        },
        streakScore: {
          $ifNull: [{ $arrayElemAt: ["$streak.currentStreak", 0] }, 0]
        },
        lastActive: {
          $ifNull: [{ $arrayElemAt: ["$streak.lastActiveDate", 0] }, null]
        },
        normalizedSkills: {
          $map: {
            input: "$skills",
            as: "skill",
            in: { $toLower: "$$skill.skillName" }
          }
        }
      }
    },
    {
      $addFields: {
        matchedSkills: {
          $cond: [
            { $gt: [requiredSkillsCount, 0] },
            { $setIntersection: ["$normalizedSkills", requiredSkills] },
            []
          ]
        },
        skillMatchPercentage: {
          $cond: [
            { $gt: [requiredSkillsCount, 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $size: {
                            $setIntersection: ["$normalizedSkills", requiredSkills]
                          }
                        },
                        requiredSkillsCount
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            },
            100
          ]
        }
      }
    },
    {
      $match: {
        readinessScore: { $gte: minReadinessScore },
        atsScore: { $gte: minATSScore },
        streakScore: { $gte: minStreakDays }
      }
    },
    {
      $addFields: {
        rankingScore: {
          $add: [
            { $multiply: ["$skillMatchPercentage", 0.4] },
            { $multiply: ["$readinessScore", 0.3] },
            { $multiply: ["$atsScore", 0.2] },
            { $multiply: ["$streakScore", 0.1] }
          ]
        }
      }
    },
    { $sort: { rankingScore: -1 } },
    {
      $project: {
        _id: 0,
        user: {
          _id: "$_id",
          name: "$name",
          email: "$email"
        },
        readinessScore: 1,
        atsScore: 1,
        streakScore: 1,
        skillMatchPercentage: 1,
        matchedSkills: 1,
        lastActive: 1
      }
    }
  ]);

  if (candidates.length) {
    const now = new Date();
    await CandidateEvaluation.bulkWrite(
      candidates.map((candidate) => ({
        updateOne: {
          filter: { userId: candidate.user._id },
          update: {
            $set: {
              readinessScore: candidate.readinessScore,
              atsScore: candidate.atsScore,
              skillMatchPercentage: candidate.skillMatchPercentage,
              streakScore: candidate.streakScore,
              lastActive: candidate.lastActive,
              generatedAt: now
            }
          },
          upsert: true
        }
      }))
    );
  }

  return candidates;
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
