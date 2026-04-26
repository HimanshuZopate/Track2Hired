"use strict";

const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Topic = require("../models/Topic");
const Question = require("../models/Question");

// ─── Topics to seed ───────────────────────────────────────────────────────────
const TOPICS = [
  { name: "React",               category: "MERN" },
  { name: "Node.js",             category: "MERN" },
  { name: "MongoDB",             category: "MERN" },
  { name: "Express",             category: "MERN" },
  { name: "JavaScript",          category: "Fundamentals" },
  { name: "DBMS",                category: "Fundamentals" },
  { name: "Operating System",    category: "Fundamentals" },
  { name: "Networking",          category: "Networking" },
  { name: "REST APIs",           category: "Fundamentals" },
  { name: "Cloud (AWS basics)",  category: "Cloud" },
  { name: "Git",                 category: "Tools" },
  { name: "SQL",                 category: "Data Analyst" },
  { name: "Data Structures",     category: "Programming" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Call Groq API (OpenAI-compatible, key starts with gsk_) ────────────────────
async function callGrok(prompt) {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("No GROQ_API_KEY set in .env");

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a senior interview question author for software engineering placements. " +
            "Output ONLY a valid JSON array. No markdown, no explanation, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );
  return res.data.choices[0].message.content.trim();
}

// ─── Build prompt ─────────────────────────────────────────────────────────────
function buildPrompt(topic, batch) {
  const diffMap = batch === 1
    ? "4 Easy (2 MCQ + 2 Theory) and 3 Medium (2 MCQ + 1 Theory)"
    : "4 Hard (2 MCQ + 2 Theory) and 3 Medium (1 MCQ + 2 Theory)";

  return `Generate exactly 7 real ${topic} interview questions: ${diffMap}.

Rules:
- MCQ: exactly 4 options; answer must exactly match one option text
- Theory: include a detailed answer, explanation, and 4-5 keywords
- Every question needs 1 tag from: ["Frequently Asked","Important","Tricky"]
- No placeholder text, no "Variation X", all options must be realistic

Return a JSON object in this exact format:
{"questions":[{"type":"MCQ"|"Theory","difficulty":"Easy"|"Medium"|"Hard","question":"...","answer":"...","options":[],"explanation":"...","keywords":[],"tags":[]}]}`;
}

// ─── Parse Grok response ──────────────────────────────────────────────────────
function parseResponse(raw) {
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(text);
    // json_object mode returns {questions: [...]}
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    if (Array.isArray(parsed)) return parsed;
    // search for any array value in the object
    const arrVal = Object.values(parsed).find(Array.isArray);
    if (arrVal) return arrVal;
  } catch { /* fall through */ }
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { return []; }
  }
  return [];
}

// ─── Validate a single question ───────────────────────────────────────────────
function isValid(q) {
  if (!q || typeof q !== "object") return false;
  if (!["MCQ", "Theory"].includes(q.type)) return false;
  if (!["Easy", "Medium", "Hard"].includes(q.difficulty)) return false;
  if (!q.question || q.question.length < 15) return false;
  if (!q.answer || q.answer.length < 2) return false;
  if (q.type === "MCQ") {
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;
    if (!q.options.includes(q.answer)) return false;
  }
  return true;
}

// ─── Seed one topic (two batches of 7 = 14+ questions) ───────────────────────
async function seedTopic(topicDoc) {
  let total = 0;

  for (const batch of [1, 2]) {
    const prompt = buildPrompt(topicDoc.name, batch);
    let inserted = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`  [${topicDoc.name}] Batch ${batch}, attempt ${attempt}...`);
        const raw = await callGrok(prompt);
        const questions = parseResponse(raw);
        const valid = questions.filter(isValid);

        if (valid.length < 3) {
          console.warn(`  [${topicDoc.name}] Batch ${batch}: only ${valid.length} valid — retrying...`);
          await sleep(2000);
          continue;
        }

        const docs = valid.map((q) => ({
          topicId: topicDoc._id,
          skillName: topicDoc.name,
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty,
          type: q.type,
          options: Array.isArray(q.options) ? q.options : [],
          explanation: q.explanation || "",
          keywords: Array.isArray(q.keywords) ? q.keywords : [],
          tags: Array.isArray(q.tags) ? q.tags : [],
        }));

        await Question.insertMany(docs);
        console.log(`  ✓ [${topicDoc.name}] Batch ${batch}: inserted ${docs.length} questions.`);
        total += docs.length;
        inserted = true;
        break;
      } catch (err) {
        const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error(`  ✗ [${topicDoc.name}] Batch ${batch} attempt ${attempt}: ${detail}`);
        if (attempt < 3) await sleep(3000);
      }
    }

    if (!inserted) console.warn(`  ⚠ [${topicDoc.name}] Batch ${batch} failed — skipping.`);
    await sleep(1500); // rate limit between batches
  }

  return total;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.GROQ_API_KEY && !process.env.GROK_API_KEY) {
    console.error("❌ GROQ_API_KEY not set in .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected.\n");

  // Upsert topics
  const topicDocs = [];
  for (const t of TOPICS) {
    const doc = await Topic.findOneAndUpdate(
      { name: new RegExp(`^${t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      { $setOnInsert: t },
      { upsert: true, new: true }
    );
    topicDocs.push(doc);
  }
  console.log(`📚 ${topicDocs.length} topics ready.\n`);

  // Clear old questions
  const deleted = await Question.deleteMany({});
  console.log(`🗑  Cleared ${deleted.deletedCount} existing questions.\n`);

  // Generate + insert for each topic
  let total = 0;
  for (const topicDoc of topicDocs) {
    const count = await seedTopic(topicDoc);
    total += count;
    // Rate-limit: wait 2s between topics to avoid 429
    await sleep(2000);
  }

  console.log(`\n🎉 Done! Total questions inserted: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
