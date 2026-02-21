const mongoose = require("mongoose");
const UserActivity = require("../models/UserActivity");
const UserStreak = require("../models/UserStreak");

const CONSISTENCY_WINDOW_DAYS = 30;

const normalizeDate = (date = new Date()) => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) {
    return false;
  }

  return normalizeDate(dateA).getTime() === normalizeDate(dateB).getTime();
};

const updateUserStreak = async (userId) => {
  const today = normalizeDate(new Date());
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  let streak = await UserStreak.findOne({ userId });

  if (!streak) {
    streak = await UserStreak.create({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      totalActiveDays: 1
    });

    return streak;
  }

  if (isSameDay(streak.lastActiveDate, today)) {
    return streak;
  }

  const continuedStreak = isSameDay(streak.lastActiveDate, yesterday)
    ? Number(streak.currentStreak || 0) + 1
    : 1;

  streak.currentStreak = continuedStreak;
  streak.longestStreak = Math.max(Number(streak.longestStreak || 0), continuedStreak);
  streak.lastActiveDate = today;
  streak.totalActiveDays = Number(streak.totalActiveDays || 0) + 1;

  await streak.save();

  return streak;
};

const recordUserActivity = async (userId, activityType, referenceId = null) => {
  const activityDate = normalizeDate(new Date());
  const parsedReferenceId =
    referenceId && mongoose.Types.ObjectId.isValid(referenceId) ? referenceId : null;

  const activity = await UserActivity.create({
    userId,
    activityType,
    referenceId: parsedReferenceId,
    activityDate
  });

  const streak = await updateUserStreak(userId);

  return { activity, streak };
};

const calculateConsistencyScore = async (userId) => {
  const fromDate = normalizeDate(new Date());
  fromDate.setUTCDate(fromDate.getUTCDate() - (CONSISTENCY_WINDOW_DAYS - 1));

  const activity = await UserActivity.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        activityDate: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: "$activityDate"
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

module.exports = {
  normalizeDate,
  updateUserStreak,
  recordUserActivity,
  calculateConsistencyScore
};
