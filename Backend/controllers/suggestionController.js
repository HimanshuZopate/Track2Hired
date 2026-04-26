const path = require("path");
const DailySuggestion = require("../models/DailySuggestion");
const ReadinessScore = require("../models/ReadinessScore");
const { buildSuggestion, getStartAndEndOfTodayUTC } = require("../services/suggestionService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const quotes = require(path.join(__dirname, "..", "data", "quotes.json"));

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// GET /api/suggestions/today
exports.getTodaySuggestion = async (req, res) => {
  try {
    const { start } = getStartAndEndOfTodayUTC();

    const generated = await buildSuggestion({
      userId: req.user._id,
      companyFocus: req.query.companyFocus
    });

    const suggestion = await DailySuggestion.findOneAndUpdate(
      {
        userId: req.user._id,
        date: start
      },
      {
        $set: {
          userId: req.user._id,
          date: start,
          suggestionText: generated.suggestionText,
          type: generated.type,
          generatedFrom: generated.generatedFrom
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true
      }
    );

    return sendSuccess(res, { suggestion }, "Suggestion retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

// GET /api/motivation
exports.getMotivation = async (req, res) => {
  try {
    const readiness = await ReadinessScore.findOne({ userId: req.user._id }).select("overallScore");
    const readinessPercent = readiness ? Math.round(readiness.overallScore) : 0;

    let quote = randomFrom(quotes);
    let type = "random";

    if (readinessPercent < 50) {
      quote = "Don’t worry about being ready. Worry about improving 1% today.";
      type = "context-aware";
    } else if (readinessPercent >= 80) {
      quote = "You’re closer than you think—now sharpen execution and stay consistent.";
      type = "context-aware";
    }

    return sendSuccess(res, {
      quote,
      type,
      readinessPercent
    }, "Motivation retrieved", 200);
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};