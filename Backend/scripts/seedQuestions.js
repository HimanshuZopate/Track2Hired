const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const Topic = require("../models/Topic");
const Question = require("../models/Question");
const { topics, getQuestions } = require("../data/questionsData");

dotenv.config({ path: path.join(__dirname, "../.env") });

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");

    // 1. Seed Topics
    console.log(`Checking/Seeding ${topics.length} topics...`);
    const topicDocs = [];
    for (const t of topics) {
      let topicDoc = await Topic.findOne({
        name: new RegExp(`^${escapeRegex(t.name)}$`, "i")
      });
      if (!topicDoc) {
        topicDoc = await Topic.create(t);
        console.log(`Created topic: ${t.name}`);
      }
      topicDocs.push(topicDoc);
    }
    
    // Map topic names to ObjectIds
    const topicMap = {};
    topicDocs.forEach(t => {
      topicMap[t.name] = t._id;
    });

    // 2. Seed curated interview questions
    console.log("Preparing curated interview questions...");
    const allQuestions = getQuestions();
    
    console.log(`Total questions to process: ${allQuestions.length}`);
    
    let insertCount = 0;
    const batchSize = 100;
    
    const dbQuestions = allQuestions.map(q => {
        return {
            topicId: topicMap[q.topicName],
            skillName: q.skillName || q.topicName,
            question: q.question,
            answer: q.answer,
            difficulty: q.difficulty,
            type: q.type,
            options: q.options || [],
            explanation: q.explanation || "",
            keywords: q.keywords || [],
            tags: q.tags || []
        }
    });

    // Clear existing questions before reseeding the curated bank.
    console.log("Clearing existing question bank...");
    await Question.deleteMany({});
    
    console.log("Inserting new questions in batches...");
    for (let i = 0; i < dbQuestions.length; i += batchSize) {
        const batch = dbQuestions.slice(i, i + batchSize);
        await Question.insertMany(batch);
        insertCount += batch.length;
        console.log(`Inserted ${insertCount}/${dbQuestions.length} questions...`);
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
