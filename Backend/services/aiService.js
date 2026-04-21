"use strict";

const axios = require("axios");
const GeneratedQuestion = require("../models/GeneratedQuestion");
const { getQuestions: getCuratedQuestions } = require("../data/questionsData");

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const ALLOWED_TYPES = ["MCQ", "Theory", "Coding", "Mixed"];

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const USER_MIN_INTERVAL_MS = Number(process.env.AI_USER_MIN_INTERVAL_MS || 1500);
const DB_CACHE_TTL_MS = Number(process.env.AI_DB_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const MEM_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── Startup diagnostics (runs once on require) ──────────────────────────────
(() => {
  const keys = {
    GROK_API_KEY:   process.env.GROK_API_KEY   ? "✓ Loaded" : "✗ Missing",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✓ Loaded" : "✗ Missing",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✓ Loaded" : "✗ Missing",
    AI_PROVIDER:    process.env.AI_PROVIDER    || "(default: cascade)",
  };
  console.log("[AI] Provider keys at startup:", keys);
})();

// ─── Retry helpers ────────────────────────────────────────────────────────────

// Only retry transient / rate-limit errors — NOT auth/billing (401/403)
const isRetryable = (error) => {
  const status = error?.response?.status;
  if (status === 429) return true;
  if ([502, 503, 504].includes(status)) return true;
  const code = error?.code;
  if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNABORTED"].includes(code)) return true;
  if (!error?.response && code) return true;
  return false;
};

// Returns true if the error is a permanent provider issue (no credits, wrong key, etc.)
// These should NOT be retried — cascade to next provider instead
const isPermanentProviderFailure = (error) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403) return true;
  return false;
};

// ─── In-memory cache ──────────────────────────────────────────────────────────
const _cache = new Map();
const _inFlightByRequest = new Map();
const _perUserQueue = new Map();
const _userNextAllowedAt = new Map();

const cacheKey = ({ skill, difficulty, type }) =>
  `${skill.trim().toLowerCase()}|${difficulty}|${type}`;

const getFromCache = (params) => {
  const key = cacheKey(params);
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > MEM_CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.questions;
};

const setCache = (params, questions) => {
  if (_cache.size >= MAX_CACHE_ENTRIES) {
    _cache.delete(_cache.keys().next().value);
  }
  _cache.set(cacheKey(params), { questions, cachedAt: Date.now() });
};

// ─── DB cache ─────────────────────────────────────────────────────────────────
const getFromDbCache = async ({ skill, difficulty, type, count }) => {
  const earliestCreatedAt = new Date(Date.now() - DB_CACHE_TTL_MS);
  const skillRegex = new RegExp(`^${escapeRegex(skill.trim())}$`, "i");

  const latest = await GeneratedQuestion.findOne({
    skill: skillRegex,
    difficulty,
    type,
    createdAt: { $gte: earliestCreatedAt },
    questions: { $exists: true, $ne: [] },
  })
    .sort({ createdAt: -1 })
    .select({ questions: 1 })
    .lean();

  if (!latest?.questions?.length) return null;

  // Skip entries that are all curated backup questions
  const allFallback = latest.questions.every((q) => isBackupQuestionId(q?.id));
  if (allFallback) return null;

  return normalizeQuestions(latest.questions, type).slice(0, count);
};

// ─── Per-user throttle queue ──────────────────────────────────────────────────
const enqueuePerUser = async (userId, taskFn) => {
  const key = String(userId || "anon");
  const previous = _perUserQueue.get(key) || Promise.resolve();

  const current = previous.catch(() => undefined).then(async () => {
    const now = Date.now();
    const nextAllowed = _userNextAllowedAt.get(key) || 0;
    if (now < nextAllowed) {
      const wait = nextAllowed - now;
      console.warn(`[AI] Throttling user ${key}: ${wait}ms delay`);
      await sleep(wait);
    }
    _userNextAllowedAt.set(key, Date.now() + USER_MIN_INTERVAL_MS);
    return taskFn();
  });

  _perUserQueue.set(key, current.finally(() => {
    if (_perUserQueue.get(key) === current) _perUserQueue.delete(key);
  }));
  return current;
};

// ─── Prompt (concise to save tokens) ──────────────────────────────────────────
const buildPrompt = ({ skill, difficulty, type, count }) => {
  const typeHint =
    type === "MCQ"
      ? "Each MUST have 4 options and answer must be one of the options."
      : type === "Coding"
      ? "Include practical code challenges with expected output."
      : "Ask clear questions requiring textual answers.";

  return (
    `Generate exactly ${count} ${difficulty}-level interview questions about ${skill}.\n` +
    `Format: ${type}. ${typeHint}\n\n` +
    `Return ONLY a JSON array. No markdown. Schema per item:\n` +
    `{"id":"q-1","question":"...","type":"${type === "Mixed" ? "Theory|MCQ|Coding" : type}",` +
    `"options":[],"answer":"...","explanation":"..."}`
  );
};

// ─── JSON parsing ─────────────────────────────────────────────────────────────
const safeParse = (raw) => { try { return JSON.parse(raw); } catch { return null; } };

const extractQuestions = (rawText) => {
  const text = String(rawText || "").trim();

  // Direct array
  const direct = safeParse(text);
  if (Array.isArray(direct) && direct.length) return direct;

  // Object with .questions array
  if (direct && Array.isArray(direct.questions) && direct.questions.length) return direct.questions;

  // Strip markdown fences
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const s2 = safeParse(stripped);
  if (Array.isArray(s2) && s2.length) return s2;
  if (s2 && Array.isArray(s2.questions)) return s2.questions;

  // Extract first [...] block
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) {
    const slice = safeParse(text.slice(start, end + 1));
    if (Array.isArray(slice) && slice.length) return slice;
  }

  // Last resort: split lines into question strings
  const lines = text.split("\n").map((l) => l.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
  if (lines.length >= 2) return lines;

  return null;
};

const normalizeQuestions = (questions, fallbackType) =>
  questions.map((q, idx) => {
    if (typeof q === "string") {
      return {
        id: `q-${idx + 1}`,
        question: q,
        type: fallbackType,
        options: [],
        answer: "",
        explanation: "",
      };
    }
    return {
      id: String(q.id || `q-${idx + 1}`),
      question: String(q.question || "Untitled question"),
      type: String(q.type || fallbackType),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      answer: String(q.answer || ""),
      explanation: String(q.explanation || ""),
    };
  });

const isBackupQuestionId = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized.startsWith("fallback-") || normalized.startsWith("backup-");
};

const AI_TO_CURATED_DIFFICULTY = {
  Beginner: "Easy",
  Intermediate: "Medium",
  Advanced: "Hard"
};

const CODING_FALLBACK_LIBRARY = [
  {
    skills: ["javascript", "js", "frontend"],
    question: "Write a JavaScript function `debounce(fn, delay)` that delays execution until the user stops triggering the event for `delay` milliseconds.",
    answer: "Use a closure to store a timeout ID. Clear the existing timer each time the function is called, then create a new timeout that invokes `fn` after `delay` milliseconds.",
    explanation: "Debouncing is commonly used for search inputs and resize handlers to prevent unnecessary repeated work."
  },
  {
    skills: ["react", "frontend"],
    question: "Implement a React component that fetches a list of users on mount, handles loading and error state, and prevents state updates after unmount.",
    answer: "Use `useEffect` with an AbortController or a cleanup flag. Track `loading`, `error`, and `users` in state, fetch the data inside the effect, and cancel the request in the cleanup function.",
    explanation: "The key interview point is safe async cleanup and predictable state handling in React."
  },
  {
    skills: ["node", "node.js", "express", "backend"],
    question: "Build an Express middleware that rate-limits requests by IP to 100 requests per 15 minutes and returns HTTP 429 when the limit is exceeded.",
    answer: "Store request counts by IP with timestamps, reset the window after 15 minutes, and short-circuit with status 429 when the count exceeds 100. In production, use Redis or a proven middleware package to support multiple instances.",
    explanation: "Interviewers look for correct HTTP semantics, time-window logic, and awareness of distributed deployments."
  },
  {
    skills: ["mongo", "mongodb", "database"],
    question: "Write a MongoDB aggregation query that returns each department with the number of employees in it, sorted by employee count descending.",
    answer: "Use an aggregation pipeline with `$group` on department, count employees using `{ $sum: 1 }`, and then `$sort` by count descending.",
    explanation: "This tests your ability to use aggregation rather than application-side loops for reporting queries."
  },
  {
    skills: ["sql", "dbms", "database"],
    question: "Write a SQL query to return the second highest salary from an Employees table.",
    answer: "A common solution is to select `MAX(salary)` where salary is less than `(SELECT MAX(salary) FROM Employees)`. Window functions such as `DENSE_RANK()` are also valid.",
    explanation: "Interviewers often look for both a simple nested query approach and awareness of window function solutions."
  }
];

const normalizeSkillText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const shuffleQuestions = (items = []) => {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }
  return clone;
};

const matchesRequestedSkill = (skill, question = {}) => {
  const requestedSkill = normalizeSkillText(skill);
  const candidate = normalizeSkillText(question.skillName || question.topicName || "");

  if (!requestedSkill || !candidate) return false;
  if (requestedSkill.includes(candidate) || candidate.includes(requestedSkill)) return true;

  const aliasGroups = [
    ["javascript", "js", "typescript", "frontend"],
    ["node", "node.js", "express", "backend"],
    ["mongo", "mongodb", "mongoose", "database"],
    ["react", "frontend"],
    ["rest", "api", "http"],
    ["network", "networking", "dns", "tcp", "udp"],
    ["aws", "cloud"],
    ["dsa", "data structures", "algorithms"]
  ];

  return aliasGroups.some((group) => {
    const requestMatches = group.some((alias) => requestedSkill.includes(alias));
    const candidateMatches = group.some((alias) => candidate.includes(alias));
    return requestMatches && candidateMatches;
  });
};

const buildCodingFallbackQuestions = ({ skill, count }) => {
  const requestedSkill = normalizeSkillText(skill);
  const matchingChallenges = CODING_FALLBACK_LIBRARY.filter((item) =>
    item.skills.some((alias) => requestedSkill.includes(alias) || alias.includes(requestedSkill))
  );

  const pool = shuffleQuestions(matchingChallenges.length ? matchingChallenges : CODING_FALLBACK_LIBRARY);
  const size = Math.max(3, Number(count) || 5);

  return Array.from({ length: size }, (_, index) => {
    const source = pool[index % pool.length];
    return {
      id: `backup-coding-${index + 1}`,
      question: source.question,
      type: "Coding",
      options: [],
      answer: source.answer,
      explanation: source.explanation
    };
  });
};

const buildFallbackQuestions = ({ skill, difficulty, type, count }) => {
  if (type === "Coding") {
    return buildCodingFallbackQuestions({ skill, count });
  }

  const requestedDifficulty = AI_TO_CURATED_DIFFICULTY[difficulty] || "Medium";
  const targetTypes = type === "Mixed" ? ["Theory", "MCQ"] : [type];
  const allQuestions = getCuratedQuestions();

  const matchingSkillQuestions = allQuestions.filter((question) => matchesRequestedSkill(skill, question));
  const typeScopedQuestions = (matchingSkillQuestions.length ? matchingSkillQuestions : allQuestions).filter((question) =>
    targetTypes.includes(question.type)
  );

  const difficultyFirstPool = shuffleQuestions([
    ...typeScopedQuestions.filter((question) => question.difficulty === requestedDifficulty),
    ...typeScopedQuestions.filter((question) => question.difficulty !== requestedDifficulty)
  ]);

  const finalPool = difficultyFirstPool.length
    ? difficultyFirstPool
    : shuffleQuestions(allQuestions.filter((question) => targetTypes.includes(question.type)));

  const size = Math.max(5, Number(count) || 5);
  const selected = finalPool.slice(0, size);
  const requestedSkill = normalizeSkillText(skill).replace(/\s+/g, "-") || "general";

  return selected.map((source, index) => ({
    id: `backup-${requestedSkill}-${index + 1}`,
    question: source.question,
    type: source.type,
    options: source.type === "MCQ" ? shuffleQuestions((source.options || []).map(String)) : [],
    answer: source.answer,
    explanation: source.explanation
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER CALLERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Grok (xAI) ───────────────────────────────────────────────────────────
const callGrok = async (prompt) => {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GROK_API_KEY not configured"), { _noKey: true });

  const model = process.env.GROK_MODEL || "grok-3-mini";
  const response = await axios.post(
    "https://api.x.ai/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: "You are an expert interview question generator. Return strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: Number(process.env.GROK_TEMPERATURE || 0.6),
      max_tokens: Number(process.env.GROK_MAX_TOKENS || 1400),
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      timeout: 25000,
    }
  );
  return response?.data?.choices?.[0]?.message?.content || "";
};

// ─── 2. OpenAI ────────────────────────────────────────────────────────────────
const callOpenAI = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("OPENAI_API_KEY not configured"), { _noKey: true });

  const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      temperature: 0.6,
      max_tokens: 1400,
      messages: [
        { role: "system", content: "You are an expert interview question generator. Output strict JSON only — no markdown." },
        { role: "user", content: prompt },
      ],
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      timeout: 25000,
    }
  );
  return response?.data?.choices?.[0]?.message?.content || "";
};

// ─── 3. Gemini ────────────────────────────────────────────────────────────────
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY not configured"), { _noKey: true });

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1400, responseMimeType: "application/json" },
    },
    { headers: { "Content-Type": "application/json" }, timeout: 25000 }
  );
  return response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

// ─── Retry wrapper (retries only transient errors) ────────────────────────────
const callWithRetry = async (callerFn, prompt) => {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callerFn(prompt);
    } catch (error) {
      lastError = error;

      // Permanent failures (401/403/no key) → don't retry, let cascade handle it
      if (isPermanentProviderFailure(error) || error._noKey) throw error;

      // Only retry transient errors
      if (!isRetryable(error)) throw error;

      if (attempt < MAX_RETRIES) {
        const retryAfter = error?.response?.headers?.["retry-after"];
        const delayMs = retryAfter ? Number(retryAfter) * 1000 : BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[AI] Retry ${attempt + 1}/${MAX_RETRIES} after ${delayMs}ms (${error?.response?.status || error.code})`);
        await sleep(delayMs);
      }
    }
  }
  throw lastError;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PROVIDER CASCADE: Grok → OpenAI → Gemini → Fallback
// ═══════════════════════════════════════════════════════════════════════════════

const PROVIDER_CHAIN = [
  { name: "grok",   caller: callGrok   },
  { name: "openai", caller: callOpenAI },
  { name: "gemini", caller: callGemini },
];

const tryProviderChain = async (prompt, { skill, type }) => {
  const errors = [];

  for (const { name, caller } of PROVIDER_CHAIN) {
    try {
      console.log(`[AI] Trying provider: ${name}`);
      const rawText = await callWithRetry(caller, prompt);
      const content = String(rawText || "").trim();

      if (!content) {
        console.warn(`[AI] ${name} returned empty content — skipping`);
        errors.push({ provider: name, error: "Empty response" });
        continue;
      }

      const parsed = extractQuestions(content);
      if (!parsed || !parsed.length) {
        console.warn(`[AI] ${name} returned unparseable content — skipping`);
        errors.push({ provider: name, error: "Unparseable JSON" });
        continue;
      }

      const questions = normalizeQuestions(
        parsed.map((item, idx) =>
          typeof item === "string"
            ? { id: `q-${idx + 1}`, question: item, type, options: [], answer: "", explanation: "" }
            : item
        ),
        type
      );

      console.log(`[AI] ✓ ${name} returned ${questions.length} questions for "${skill}"`);
      return { provider: name, questions, errors };
    } catch (error) {
      const status = error?.response?.status;
      const body = error?.response?.data;
      const msg = body?.error?.message || body?.message || body?.error || error.message;

      // Specific 403 "no credits" detection
      if (status === 403) {
        const lc = String(msg).toLowerCase();
        if (lc.includes("credit") || lc.includes("license") || lc.includes("billing")) {
          console.error(`[AI] ✗ ${name}: No credits/license (HTTP 403). Cascading to next provider.`);
          errors.push({ provider: name, error: `No credits/license: ${msg}`, status: 403 });
          continue;
        }
        console.error(`[AI] ✗ ${name}: Forbidden (403): ${msg}. Cascading.`);
        errors.push({ provider: name, error: `Forbidden: ${msg}`, status: 403 });
        continue;
      }

      // 401 — bad key
      if (status === 401) {
        console.error(`[AI] ✗ ${name}: Invalid API key (401). Cascading.`);
        errors.push({ provider: name, error: "Invalid API key", status: 401 });
        continue;
      }

      // Missing key — skip silently to next
      if (error._noKey) {
        console.log(`[AI] ✗ ${name}: No API key configured. Skipping.`);
        errors.push({ provider: name, error: "API key not configured" });
        continue;
      }

      // All other errors after retry exhaustion
      console.error(`[AI] ✗ ${name} failed after retries: ${msg}`);
      errors.push({ provider: name, error: msg, status });
      continue;
    }
  }

  // All providers failed
  return { provider: null, questions: null, errors };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const generateQuestions = async ({ userId, skill, difficulty, type, count = 5 }) => {
  if (!skill || !difficulty || !type) throw new Error("skill, difficulty and type are required");
  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) throw new Error("Invalid difficulty");
  if (!ALLOWED_TYPES.includes(type)) throw new Error("Invalid type");

  return enqueuePerUser(userId, async () => {
    // ── 1) In-memory cache ──
    const memCached = getFromCache({ skill, difficulty, type });
    if (memCached) {
      console.log(`[AI] Memory cache hit: "${skill}" | ${difficulty} | ${type}`);
      return {
        provider: "memory-cache", usedFallback: false, fromCache: true,
        questions: memCached.slice(0, count),
      };
    }

    // ── 2) DB cache ──
    const dbCached = await getFromDbCache({ skill, difficulty, type, count });
    if (dbCached?.length) {
      setCache({ skill, difficulty, type }, dbCached);
      console.log(`[AI] DB cache hit: "${skill}" | ${difficulty} | ${type}`);
      return {
        provider: "db-cache", usedFallback: false, fromCache: true,
        questions: dbCached,
      };
    }

    // ── 3) Deduplicate in-flight ──
    const rk = cacheKey({ skill, difficulty, type });
    if (_inFlightByRequest.has(rk)) {
      console.log(`[AI] Joining in-flight request for "${skill}"`);
      const shared = await _inFlightByRequest.get(rk);
      return { provider: "inflight", usedFallback: false, fromCache: true, questions: shared.slice(0, count) };
    }

    // ── 4) Live multi-provider cascade ──
    const prompt = buildPrompt({ skill, difficulty, type, count });

    const genPromise = (async () => {
      const result = await tryProviderChain(prompt, { skill, type });

      if (result.questions?.length) {
        setCache({ skill, difficulty, type }, result.questions);
        return result;
      }
      return result;
    })();

    _inFlightByRequest.set(rk, genPromise.then((r) => r.questions || []));

    try {
      const result = await genPromise;

      if (result.questions?.length) {
        return {
          provider: result.provider,
          usedFallback: false,
          fromCache: false,
          questions: result.questions.slice(0, count),
          providerErrors: result.errors.length ? result.errors : undefined,
        };
      }

      // ── 5) All providers failed → graceful fallback ──
      const errorSummary = result.errors.map((e) => `${e.provider}: ${e.error}`).join(" | ");
      console.error(`[AI] All providers failed. Errors: ${errorSummary}`);

      const fallback = buildFallbackQuestions({ skill, difficulty, type, count });
      return {
        provider: "fallback",
        usedFallback: true,
        fromCache: false,
        error: `AI service temporarily busy. ${errorSummary}`,
        questions: fallback,
      };
    } finally {
      _inFlightByRequest.delete(rk);
    }
  });
};

module.exports = {
  generateQuestions,
  ALLOWED_DIFFICULTIES,
  ALLOWED_TYPES,
};
