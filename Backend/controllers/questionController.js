const Question = require("../models/Question");
const Topic = require("../models/Topic");
const QuestionAttempt = require("../models/QuestionAttempt");
const mongoose = require("mongoose");

// Generate Questions using Aggregation Framework $sample
exports.generateQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, type, count = 5 } = req.body;
    
    if (!topic || !difficulty || !type) {
        return res.status(400).json({ message: "Topic, difficulty, and type are required." });
    }

    const topicDoc = await Topic.findOne({ name: new RegExp(`^${topic}$`, "i") });
    if (!topicDoc) {
        return res.status(404).json({ message: "Topic not found." });
    }

    const query = { topicId: topicDoc._id, difficulty };
    if (type !== "Mixed") {
        query.type = type;
    }

    // Find requested count using $sample for randomness
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: Number(count) } },
      { $project: { topicId: 0, createdAt: 0, updatedAt: 0, __v: 0 } }
    ]);

    res.status(200).json({ 
        success: true,
        topic: topicDoc.name,
        topicId: topicDoc._id,
        questions: questions.map(q => ({
            id: q._id.toString(),
            question: q.question,
            type: q.type,
            options: q.options,
            tags: q.tags,
            difficulty: q.difficulty,
            topicName: topicDoc.name,
            answer: q.answer,
            explanation: q.explanation
        })) 
    });
  } catch (error) {
    next(error);
  }
};

// Validate Answer
exports.validateAnswer = async (req, res, next) => {
    try {
        const { questionId, userAnswer } = req.body;
        
        if (!questionId || userAnswer === undefined) {
             return res.status(400).json({ message: "questionId and userAnswer are required." });
        }

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        let isCorrect = false;
        let score = 0;
        let matchedKeywords = 0;
        let totalKeywords = 0;

        if (question.type === "MCQ") {
            isCorrect = question.answer.trim() === userAnswer.trim();
            score = isCorrect ? 100 : 0;
        } else {
            // Theory keyword validation
            if (question.keywords && question.keywords.length > 0) {
                totalKeywords = question.keywords.length;
                const answerLower = userAnswer.toLowerCase();
                question.keywords.forEach(kw => {
                    if (answerLower.includes(kw.toLowerCase())) {
                        matchedKeywords++;
                    }
                });
                score = Math.round((matchedKeywords / totalKeywords) * 100);
                isCorrect = score >= 60; // 60% threshold for theory
            } else {
                // simple length-based or contains validation if no keywords
                isCorrect = userAnswer.length >= 10;
                score = isCorrect ? 60 : 0;
            }
        }

        // Record attempt
        await QuestionAttempt.findOneAndUpdate(
            { userId: req.user._id, questionId: questionId },
            {
              $set: {
                userAnswer: userAnswer,
                isCorrect,
                score,
                difficulty: question.difficulty,
                topicId: question.topicId
              },
              $inc: { attemptCount: 1 }
            },
            { upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            isCorrect,
            score,
            matchedKeywords,
            totalKeywords,
            correctAnswer: question.answer,
            explanation: question.explanation
        });
    } catch(error) {
        next(error);
    }
};

// Get User Stats
exports.getUserStats = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const attempts = await QuestionAttempt.find({ userId }).populate("topicId");

        let totalAttempts = attempts.length;
        let correctAttempts = attempts.filter(a => a.isCorrect).length;
        let accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        const topicStats = {};
        attempts.forEach(a => {
            if (!a.topicId) return;
            const tName = a.topicId.name;
            if (!topicStats[tName]) topicStats[tName] = { total: 0, correct: 0 };
            topicStats[tName].total++;
            if (a.isCorrect) topicStats[tName].correct++;
        });

        const topicsArray = Object.keys(topicStats).map(t => ({
            topic: t,
            total: topicStats[t].total,
            accuracy: Math.round((topicStats[t].correct / topicStats[t].total) * 100)
        }));

        const weakTopics = topicsArray.filter(t => t.accuracy < 50);

        const suggestions = weakTopics.map(t => `Focus on improving ${t.topic}. Your accuracy is ${t.accuracy}%.`);
        if (suggestions.length === 0) suggestions.push("Great job! Keep practicing to maintain your accuracy.");

        res.status(200).json({
            totalAttempts,
            accuracy,
            topics: topicsArray,
            weakTopics,
            suggestions
        });

    } catch(error) {
        next(error);
    }
};
