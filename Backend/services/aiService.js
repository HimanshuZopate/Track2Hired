const axios = require("axios");

const ALLOWED_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const ALLOWED_TYPES = ["MCQ", "Theory", "Coding", "Mixed"];

const buildPrompt = ({ skill, difficulty, type, count }) => {
  return `Generate ${count} interview questions for skill: ${skill}.
Difficulty: ${difficulty}
Type: ${type}

Rules:
1) Return ONLY valid JSON array.
2) Each item must contain:
   - id (string)
   - question (string)
   - type (MCQ/Theory/Coding)
   - options (array, only for MCQ, else empty array)
   - answer (string)
   - explanation (string)
3) Keep questions concise and practical.
4) Do not include markdown code fences.`;
};

const safeJsonParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractArrayFromText = (rawText) => {
  const trimmed = String(rawText || "").trim();
  const direct = safeJsonParse(trimmed);
  if (Array.isArray(direct)) return direct;

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    const slice = trimmed.slice(firstBracket, lastBracket + 1);
    const parsed = safeJsonParse(slice);
    if (Array.isArray(parsed)) return parsed;
  }

  return null;
};

const normalizeQuestions = (questions, fallbackType) => {
  return questions.map((q, idx) => ({
    id: String(q.id || `q-${idx + 1}`),
    question: String(q.question || "Untitled question"),
    type: String(q.type || fallbackType),
    options: Array.isArray(q.options) ? q.options : [],
    answer: String(q.answer || ""),
    explanation: String(q.explanation || "")
  }));
};

const buildFallbackQuestions = ({ skill, difficulty, type, count }) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `fallback-${i + 1}`,
    question: `[Fallback] ${difficulty} ${type} question ${i + 1} for ${skill}`,
    type: type === "Mixed" ? "Theory" : type,
    options: [],
    answer: "",
    explanation: "AI provider unavailable. Retry when provider key/config is set."
  }));
};

const callOpenAI = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  const model = process.env.OPENAI_MODEL || "gpt-5.2";
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are an interview question generator. Return strict JSON only."
        },
        { role: "user", content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    }
  );

  return response?.data?.choices?.[0]?.message?.content || "";
};

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7
      }
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 20000
    }
  );

  return (
    response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
};

const generateQuestions = async ({ skill, difficulty, type, count = 5 }) => {
  if (!skill || !difficulty || !type) {
    throw new Error("skill, difficulty and type are required");
  }

  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
    throw new Error("Invalid difficulty");
  }

  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error("Invalid type");
  }

  const prompt = buildPrompt({ skill, difficulty, type, count });
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  try {
    const rawText =
      provider === "openai"
        ? await callOpenAI(prompt)
        : await callGemini(prompt);

    const parsed = extractArrayFromText(rawText);
    if (!parsed || !parsed.length) {
      throw new Error("AI returned non-JSON/empty questions");
    }

    return {
      provider,
      usedFallback: false,
      questions: normalizeQuestions(parsed, type)
    };
  } catch (error) {
    return {
      provider,
      usedFallback: true,
      error: error.message,
      questions: buildFallbackQuestions({ skill, difficulty, type, count })
    };
  }
};

module.exports = {
  generateQuestions,
  ALLOWED_DIFFICULTIES,
  ALLOWED_TYPES
};
