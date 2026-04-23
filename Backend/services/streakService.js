const mongoose = require("mongoose");
const Skill = require("../models/Skill");
const Task = require("../models/Task");
const User = require("../models/User");
const QuestionAttempt = require("../models/QuestionAttempt");
const UserActivity = require("../models/UserActivity");
const UserStreak = require("../models/UserStreak");
const UserNotification = require("../models/UserNotification");

const CONSISTENCY_WINDOW_DAYS = 30;
const HEATMAP_WINDOW_DAYS = 90;
const DEFAULT_LEADERBOARD_LIMIT = 10;
const DEFAULT_NOTIFICATION_LIMIT = 8;

const BADGE_CONFIG = [
  { name: "Bronze", threshold: 3, icon: "🥉" },
  { name: "Silver", threshold: 7, icon: "🥈" },
  { name: "Gold", threshold: 15, icon: "🥇" },
  { name: "Platinum", threshold: 30, icon: "💎" }
];

const ACTIVITY_TYPE_ALIASES = {
  task_completed: "task_completed",
  question_answered: "question_answered",
  skill_added: "skill_added",
  TaskComplete: "task_completed",
  QuestionAttempt: "question_answered",
  SkillUpdate: "skill_added",
  AIPractice: "question_answered"
};

const normalizeDate = (date = new Date()) => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

const formatDate = (date = new Date()) => normalizeDate(date).toISOString().slice(0, 10);

const shiftDate = (date, days) => {
  const shifted = normalizeDate(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
};

const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) {
    return false;
  }

  return normalizeDate(dateA).getTime() === normalizeDate(dateB).getTime();
};

const getDaysBetween = (olderDate, newerDate) => {
  if (!olderDate || !newerDate) {
    return 0;
  }

  const diff = normalizeDate(newerDate).getTime() - normalizeDate(olderDate).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const getCanonicalActivityType = (activityType) => {
  const resolved = ACTIVITY_TYPE_ALIASES[String(activityType || "")];

  if (!resolved) {
    throw new Error(`Unsupported activity type: ${activityType}`);
  }

  return resolved;
};

const getHighestBadgeByStreak = (streakValue = 0) => {
  const badge = BADGE_CONFIG.filter((item) => Number(streakValue || 0) >= item.threshold).pop();
  return badge ? badge.name : null;
};

const getNextBadge = (streakValue = 0) => {
  const nextBadge = BADGE_CONFIG.find((item) => Number(streakValue || 0) < item.threshold);

  if (!nextBadge) {
    return null;
  }

  return {
    ...nextBadge,
    remainingDays: Math.max(nextBadge.threshold - Number(streakValue || 0), 0)
  };
};

const getEffectiveCurrentStreak = (streak, now = new Date()) => {
  if (!streak?.lastActiveDate) {
    return 0;
  }

  const today = normalizeDate(now);
  const yesterday = shiftDate(today, -1);

  if (isSameDay(streak.lastActiveDate, today) || isSameDay(streak.lastActiveDate, yesterday)) {
    return Number(streak.currentStreak || 0);
  }

  return 0;
};

const buildBadges = (longestStreak = 0, currentStreak = 0) =>
  BADGE_CONFIG.map((badge) => ({
    ...badge,
    unlocked: Number(longestStreak || 0) >= badge.threshold,
    active: Number(currentStreak || 0) >= badge.threshold,
    remainingDays: Math.max(badge.threshold - Number(currentStreak || 0), 0)
  }));

const buildStreakSummary = (streak, now = new Date(), userId = null) => {
  const currentStreak = getEffectiveCurrentStreak(streak, now);
  const longestStreak = Number(streak?.longestStreak || 0);

  return {
    userId: streak?.userId || userId || null,
    currentStreak,
    longestStreak,
    lastActiveDate: streak?.lastActiveDate || null,
    totalActiveDays: Number(streak?.totalActiveDays || 0),
    totalActivityCount: Number(streak?.totalActivityCount || 0),
    currentBadge: getHighestBadgeByStreak(longestStreak),
    activeBadge: getHighestBadgeByStreak(currentStreak),
    badges: buildBadges(longestStreak, currentStreak),
    nextBadge: getNextBadge(currentStreak),
    updatedAt: streak?.updatedAt || null
  };
};

const createNotification = async ({ userId, type, message, metadata = {}, dedupeKey = null }) => {
  if (dedupeKey) {
    return UserNotification.findOneAndUpdate(
      { userId, dedupeKey },
      {
        $setOnInsert: {
          userId,
          type,
          message,
          metadata,
          dedupeKey
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true
      }
    );
  }

  return UserNotification.create({ userId, type, message, metadata });
};

const ensureStreakStatus = async (userId, now = new Date()) => {
  const streak = await UserStreak.findOne({ userId });

  if (!streak?.lastActiveDate) {
    return streak;
  }

  const today = normalizeDate(now);
  const yesterday = shiftDate(today, -1);
  const lastActive = normalizeDate(streak.lastActiveDate);

  if (lastActive.getTime() < yesterday.getTime() && Number(streak.currentStreak || 0) > 0) {
    const previousStreak = Number(streak.currentStreak || 0);
    streak.currentStreak = 0;
    streak.lastResetDate = today;
    streak.lastWarningDate = null;
    await streak.save();

    await createNotification({
      userId,
      type: "streak_reset",
      message: "Your streak is reset",
      metadata: { previousStreak },
      dedupeKey: `streak_reset:${formatDate(today)}:${previousStreak}`
    });

    return streak;
  }

  if (
    lastActive.getTime() === yesterday.getTime() &&
    Number(streak.currentStreak || 0) > 0 &&
    !isSameDay(streak.lastWarningDate, today)
  ) {
    await createNotification({
      userId,
      type: "warning",
      message: "You are about to lose your streak",
      metadata: { currentStreak: Number(streak.currentStreak || 0) },
      dedupeKey: `streak_warning:${formatDate(today)}`
    });

    streak.lastWarningDate = today;
    await streak.save();
  }

  return streak;
};

const updateUserStreak = async (userId, activityDate = new Date(), activityIncrement = 1) => {
  const today = normalizeDate(activityDate);
  const yesterday = shiftDate(today, -1);

  let streak = await UserStreak.findOne({ userId });
  const previousEarnedBadge = getHighestBadgeByStreak(Number(streak?.longestStreak || 0));

  if (!streak) {
    streak = new UserStreak({ userId });
  }

  if (isSameDay(streak.lastActiveDate, today)) {
    streak.totalActivityCount = Number(streak.totalActivityCount || 0) + Number(activityIncrement || 1);
    streak.lastWarningDate = null;
    await streak.save();
    return buildStreakSummary(streak, today, userId);
  }

  if (streak.lastActiveDate && isSameDay(streak.lastActiveDate, yesterday)) {
    streak.currentStreak = Number(streak.currentStreak || 0) + 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(Number(streak.longestStreak || 0), Number(streak.currentStreak || 0));
  streak.lastActiveDate = today;
  streak.totalActiveDays = Number(streak.totalActiveDays || 0) + 1;
  streak.totalActivityCount = Number(streak.totalActivityCount || 0) + Number(activityIncrement || 1);
  streak.currentBadge = getHighestBadgeByStreak(streak.longestStreak);
  streak.lastWarningDate = null;

  await streak.save();

  if (streak.currentBadge && streak.currentBadge !== previousEarnedBadge) {
    await createNotification({
      userId,
      type: "badge",
      message: `You earned ${streak.currentBadge} badge!`,
      metadata: { badge: streak.currentBadge, currentStreak: streak.currentStreak },
      dedupeKey: `badge_unlock:${streak.currentBadge}`
    });
  }

  return buildStreakSummary(streak, today, userId);
};

const recordUserActivity = async (userId, activityType, referenceId = null, options = {}) => {
  const canonicalType = getCanonicalActivityType(activityType);
  const occurredAt = options.occurredAt || new Date();
  const increment = Math.max(Number(options.increment || 1), 1);
  const activityDate = normalizeDate(occurredAt);
  const date = formatDate(activityDate);
  const parsedReferenceId =
    referenceId && mongoose.Types.ObjectId.isValid(String(referenceId)) ? referenceId : null;

  await ensureStreakStatus(userId, activityDate);

  const activity = await UserActivity.findOneAndUpdate(
    {
      userId,
      activityType: canonicalType,
      date
    },
    {
      $setOnInsert: {
        userId,
        activityType: canonicalType,
        date,
        count: 0,
        activityDate,
        referenceId: parsedReferenceId
      },
      $inc: { count: increment }
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );

  const streak = await updateUserStreak(userId, activityDate, increment);

  return { activity, streak, activityType: canonicalType };
};

const calculateConsistencyScore = async (userId) => {
  const fromDate = normalizeDate(new Date());
  fromDate.setUTCDate(fromDate.getUTCDate() - (CONSISTENCY_WINDOW_DAYS - 1));

  const activity = await UserActivity.aggregate([
    {
      $match: {
        userId: toObjectId(userId),
        activityDate: { $gte: fromDate }
      }
    },
    {
      $project: {
        dateKey: {
          $ifNull: [
            "$date",
            { $dateToString: { format: "%Y-%m-%d", date: "$activityDate" } }
          ]
        }
      }
    },
    {
      $group: {
        _id: "$dateKey"
      }
    },
    {
      $count: "activeDays"
    }
  ]);

  const activeDays = activity.length ? activity[0].activeDays : 0;
  const score = Number(((activeDays / CONSISTENCY_WINDOW_DAYS) * 100).toFixed(2));

  return {
    score,
    activeDays,
    windowDays: CONSISTENCY_WINDOW_DAYS
  };
};

const getUserStreakSummary = async (userId) => {
  const streak = await ensureStreakStatus(userId);
  return buildStreakSummary(streak, new Date(), userId);
};

const getUserActivityHistory = async (userId, limit = 60) => {
  await ensureStreakStatus(userId);

  const history = await UserActivity.find({ userId })
    .sort({ activityDate: -1, createdAt: -1 })
    .limit(limit)
    .select("activityType referenceId activityDate date count createdAt")
    .lean();

  return history.map((item) => ({
    ...item,
    activityType: getCanonicalActivityType(item.activityType),
    count: Number(item.count || 1),
    date: item.date || formatDate(item.activityDate)
  }));
};

const getHeatmapData = async (userId, days = HEATMAP_WINDOW_DAYS) => {
  const fromDate = normalizeDate(new Date());
  fromDate.setUTCDate(fromDate.getUTCDate() - (days - 1));

  const aggregated = await UserActivity.aggregate([
    {
      $match: {
        userId: toObjectId(userId),
        activityDate: { $gte: fromDate }
      }
    },
    {
      $project: {
        dateKey: {
          $ifNull: [
            "$date",
            { $dateToString: { format: "%Y-%m-%d", date: "$activityDate" } }
          ]
        },
        countValue: { $ifNull: ["$count", 1] }
      }
    },
    {
      $group: {
        _id: "$dateKey",
        count: { $sum: "$countValue" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const countsMap = new Map(aggregated.map((item) => [item._id, Number(item.count || 0)]));
  const heatmap = [];

  for (let index = 0; index < days; index += 1) {
    const currentDate = shiftDate(fromDate, index);
    const date = formatDate(currentDate);
    heatmap.push({ date, count: Number(countsMap.get(date) || 0) });
  }

  const maxCount = heatmap.reduce((max, item) => Math.max(max, item.count), 0);

  return {
    windowDays: days,
    maxCount,
    heatmap: heatmap.map((item) => {
      let level = 0;

      if (item.count > 0 && maxCount > 0) {
        const ratio = item.count / maxCount;
        level = ratio < 0.34 ? 1 : ratio < 0.67 ? 2 : 3;
      }

      return {
        ...item,
        level
      };
    })
  };
};

const getLeaderboard = async (limit = DEFAULT_LEADERBOARD_LIMIT) => {
  const streaks = await UserStreak.find({}).lean();

  if (!streaks.length) {
    return [];
  }

  const users = await User.find({
    _id: { $in: streaks.map((item) => item.userId) }
  })
    .select("name email")
    .lean();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return streaks
    .map((streak) => ({
      userId: streak.userId,
      user: userMap.get(String(streak.userId)) || null,
      currentStreak: getEffectiveCurrentStreak(streak),
      longestStreak: Number(streak.longestStreak || 0),
      totalActivity: Number(streak.totalActivityCount || 0),
      totalActiveDays: Number(streak.totalActiveDays || 0),
      badge: getHighestBadgeByStreak(Number(streak.longestStreak || 0)),
      lastActiveDate: streak.lastActiveDate || null
    }))
    .filter((entry) => entry.user)
    .sort(
      (left, right) =>
        right.currentStreak - left.currentStreak ||
        right.totalActivity - left.totalActivity ||
        new Date(right.lastActiveDate || 0).getTime() -
          new Date(left.lastActiveDate || 0).getTime()
    )
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user.name,
      email: entry.user.email,
      currentStreak: entry.currentStreak,
      longestStreak: entry.longestStreak,
      totalActivity: entry.totalActivity,
      totalActiveDays: entry.totalActiveDays,
      badge: entry.badge,
      lastActiveDate: entry.lastActiveDate
    }));
};

const getUserNotifications = async (userId, limit = DEFAULT_NOTIFICATION_LIMIT) => {
  await ensureStreakStatus(userId);

  const [notifications, unreadCount] = await Promise.all([
    UserNotification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
    UserNotification.countDocuments({ userId, isRead: false })
  ]);

  return {
    notifications,
    unreadCount
  };
};

const getUserSuggestions = async (userId) => {
  const today = normalizeDate(new Date());
  const todayDate = formatDate(today);

  const [streakSummary, lowestConfidenceSkill, pendingTasks, recentIncorrectAttempts, todayActivity] =
    await Promise.all([
      getUserStreakSummary(userId),
      Skill.findOne({ userId })
        .sort({ confidenceScore: 1, updatedAt: -1 })
        .select("skillName confidenceScore")
        .lean(),
      Task.countDocuments({ userId, status: { $ne: "Completed" } }),
      QuestionAttempt.countDocuments({
        userId,
        isCorrect: false,
        updatedAt: { $gte: shiftDate(today, -7) }
      }),
      UserActivity.aggregate([
        {
          $match: {
            userId: toObjectId(userId),
            date: todayDate
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$count", 1] } }
          }
        }
      ])
    ]);

  const todayActivityCount = todayActivity.length ? Number(todayActivity[0].total || 0) : 0;
  const inactivityDays = streakSummary.lastActiveDate
    ? getDaysBetween(streakSummary.lastActiveDate, today)
    : null;

  const suggestions = [];

  if (streakSummary.currentStreak > 0 && todayActivityCount === 0) {
    suggestions.push({
      id: "maintain-streak",
      type: "streak",
      priority: "high",
      message:
        pendingTasks > 0
          ? `Complete 2 tasks today to maintain your ${streakSummary.currentStreak}-day streak.`
          : `Answer 2 questions today to maintain your ${streakSummary.currentStreak}-day streak.`,
      cta: pendingTasks > 0 ? "/tasks" : "/practice"
    });
  }

  if (
    (inactivityDays !== null && inactivityDays >= 1 && streakSummary.currentStreak === 0) ||
    !streakSummary.lastActiveDate
  ) {
    suggestions.push({
      id: "restart-streak",
      type: "recovery",
      priority: "high",
      message: "Restart your streak today by completing one task and answering one question.",
      cta: "/tasks"
    });
  }

  if (lowestConfidenceSkill && Number(lowestConfidenceSkill.confidenceScore || 0) < 3) {
    suggestions.push({
      id: "weak-skill",
      type: "skill",
      priority: "medium",
      message: `Your weakest skill is ${lowestConfidenceSkill.skillName}. Practice it today to boost confidence and consistency.`,
      cta: "/skills"
    });
  }

  if (recentIncorrectAttempts >= 2) {
    suggestions.push({
      id: "question-practice",
      type: "practice",
      priority: "medium",
      message: "Review recent incorrect answers and solve 3 similar questions to regain momentum.",
      cta: "/practice"
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      id: "keep-momentum",
      type: "growth",
      priority: "low",
      message: "You are in rhythm. Log at least 2 activities today to keep your streak energy high.",
      cta: "/dashboard"
    });
  }

  return suggestions.slice(0, 3);
};

const getStreakDashboardData = async (userId) => {
  const [streak, consistency, heatmap, leaderboard, notifications, suggestions] = await Promise.all([
    getUserStreakSummary(userId),
    calculateConsistencyScore(userId),
    getHeatmapData(userId),
    getLeaderboard(),
    getUserNotifications(userId),
    getUserSuggestions(userId)
  ]);

  return {
    streak,
    consistency,
    heatmap,
    leaderboard,
    notifications,
    suggestions
  };
};

module.exports = {
  BADGE_CONFIG,
  formatDate,
  normalizeDate,
  isSameDay,
  updateUserStreak,
  recordUserActivity,
  calculateConsistencyScore,
  getUserStreakSummary,
  getUserActivityHistory,
  getHeatmapData,
  getLeaderboard,
  getUserNotifications,
  getUserSuggestions,
  getStreakDashboardData,
  ensureStreakStatus,
  getCanonicalActivityType
};
