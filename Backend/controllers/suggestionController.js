const path = require("path");
const DailySuggestion = require("../models/DailySuggestion");
const ReadinessScore = require("../models/ReadinessScore");
const { buildSuggestion, getStartAndEndOfTodayUTC } = require("../services/suggestionService");

const quotes = require(path.join(__dirname, "..", "data", "quotes.json"));

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// GET /api/suggestions/today
exports.getTodaySuggestion = async (req, res) => {
  try {
    const { start, end } = getStartAndEndOfTodayUTC();

    let suggestion = await DailySuggestion.findOne({
      userId: req.user._id,
      date: { $gte: start, $lt: end }
    });

    if (!suggestion) {
      const generated = await buildSuggestion({
        userId: req.user._id,
        companyFocus: req.query.companyFocus
      });

      suggestion = await DailySuggestion.create({
        userId: req.user._id,
        date: start,
        suggestionText: generated.suggestionText,
        type: generated.type,
        generatedFrom: generated.generatedFrom
      });
    }

    return res.json({ suggestion });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/motivation
exports.getMotivation = async (req, res) => {
  try {
    const readiness = await ReadinessScore.findOne({ userId: req.user._id }).select("overallScore");
    const readinessPercent = readiness ? Math.round((readiness.overallScore / 5) * 100) : 0;

    let quote = randomFrom(quotes);
    let type = "random";

    if (readinessPercent < 50) {
      quote = "Don’t worry about being ready. Worry about improving 1% today.";
      type = "context-aware";
    } else if (readinessPercent >= 80) {
      quote = "You’re closer than you think—now sharpen execution and stay consistent.";
      type = "context-aware";
    }

    return res.json({
      quote,
      type,
      readinessPercent
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};