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
    GROQ_API_KEY:   process.env.GROQ_API_KEY   ? '✓ Loaded' : '✗ Missing',
    GROK_API_KEY:   process.env.GROK_API_KEY   ? '✓ Loaded' : '✗ Missing',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✓ Loaded' : '✗ Missing',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✓ Loaded' : '✗ Missing',
    AI_PROVIDER:    process.env.AI_PROVIDER    || '(default: cascade)',
  };
  console.log('[AI] Provider keys at startup:', keys);
  
  // Validate API key formats
  if (process.env.GROK_API_KEY && process.env.GROK_API_KEY.startsWith('gsk_')) {
    console.warn('[AI] WARNING: GROK_API_KEY contains a Groq key (starts with "gsk_"). xAI Grok keys should start with "xai-". This will cause the Grok provider to redirect to Groq, wasting a cascade slot.');
  }
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith('gsk_')) {
    console.warn('[AI] WARNING: GROQ_API_KEY does not start with "gsk_". Groq API keys should start with "gsk_". Please verify your key.');
  }
  if (process.env.GROK_API_KEY && !process.env.GROK_API_KEY.startsWith('xai-') && !process.env.GROK_API_KEY.startsWith('gsk_')) {
    console.warn('[AI] WARNING: GROK_API_KEY format is unexpected. xAI Grok keys should start with "xai-".');
  }
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

// ─── 1. Groq (api.groq.com — OpenAI-compatible, key starts with gsk_) ──────────
const callGroq = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey || !apiKey.startsWith('gsk_')) throw Object.assign(new Error('GROQ_API_KEY not configured or invalid format. Add GROQ_API_KEY=gsk_... to Backend/.env file. Groq keys start with "gsk_".'), { _noKey: true });

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: 'You are an expert interview question generator. Return strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: Number(process.env.GROQ_TEMPERATURE || 0.6),
      max_tokens: Number(process.env.GROQ_MAX_TOKENS || 1400),
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 25000,
    }
  );
  return response?.data?.choices?.[0]?.message?.content || '';
};

// ─── 2. Grok (xAI) ───────────────────────────────────────────────────────────
const callGrok = async (prompt) => {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GROK_API_KEY not configured. Add GROK_API_KEY=xai-... to Backend/.env file if using xAI Grok provider. xAI keys start with 'xai-'."), { _noKey: true });
  
  // If the key starts with gsk_, it's actually a Groq key.
  // xAI (Grok) keys typically start with 'xai-'
  if (apiKey.startsWith('gsk_')) {
    console.warn("[AI] WARNING: GROK_API_KEY contains a Groq key (starts with 'gsk_'). xAI Grok keys should start with 'xai-'. Redirecting to Groq caller. To fix: Remove GROK_API_KEY from .env or replace with a valid xAI key.");
    return callGroq(prompt);
  }

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
  if (!apiKey) throw Object.assign(new Error("OPENAI_API_KEY not configured. Add OPENAI_API_KEY=sk-... to Backend/.env file."), { _noKey: true });

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
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY not configured. Add GEMINI_API_KEY=... to Backend/.env file."), { _noKey: true });

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

const BASE_PROVIDER_CHAIN = [
  { name: "groq", caller: callGroq },
  { name: "grok", caller: callGrok },
  { name: "openai", caller: callOpenAI },
  { name: "gemini", caller: callGemini },
];

const getProviderChain = () => {
  const preferred = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const chain = [...BASE_PROVIDER_CHAIN];
  const index = chain.findIndex((p) => p.name === preferred);

  if (index > 0) {
    const [p] = chain.splice(index, 1);
    chain.unshift(p);
  }
  return chain;
};

const tryProviderChain = async (prompt, { skill, type }) => {
  const errors = [];
  const providers = getProviderChain();

  for (const { name, caller } of providers) {
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
          console.error(`[AI] To fix: Check ${name.toUpperCase()}_API_KEY in Backend/.env. Verify the key is valid and has available credits/quota.`);
          errors.push({ provider: name, error: `No credits/license: ${msg}`, status: 403 });
          continue;
        }
        console.error(`[AI] ✗ ${name}: Forbidden (403): ${msg}. Cascading.`);
        console.error(`[AI] To fix: Check ${name.toUpperCase()}_API_KEY in Backend/.env. Verify the key is valid and has available credits/quota.`);
        errors.push({ provider: name, error: `Forbidden: ${msg}`, status: 403 });
        continue;
      }

      // 401 — bad key
      if (status === 401) {
        console.error(`[AI] ✗ ${name}: Invalid API key (401). Cascading.`);
        console.error(`[AI] To fix: Check ${name.toUpperCase()}_API_KEY in Backend/.env. Ensure the key is valid and not expired.`);
        errors.push({ provider: name, error: "Invalid API key", status: 401 });
        continue;
      }

      // Missing key — skip silently to next
      if (error._noKey) {
        console.log(`[AI] ✗ ${name}: No API key configured. Skipping.`);
        console.log(`[AI] To fix: Add ${name.toUpperCase()}_API_KEY to Backend/.env file.`);
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

// ═══════════════════════════════════════════════════════════════════════════════
// STRICT MCQ GENERATION (isolated — does not touch existing generateQuestions)
// ═══════════════════════════════════════════════════════════════════════════════

// Difficulty alias map (Easy/Medium/Hard ↔ Beginner/Intermediate/Advanced)


const DIFFICULTY_FORWARD = {
  Easy: "Beginner", Medium: "Intermediate", Hard: "Advanced",
  Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced",
};

const buildMcqPrompt = ({ skill, difficulty, count }) =>
  `Generate exactly ${count} multiple choice questions for the topic "${skill}" at ${difficulty} level.
Each question MUST have exactly 4 options and one correct answer that matches one of the options exactly.
Return a JSON object:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."}]}`;

// Curated MCQ fallback — real questions per topic
const MCQ_FALLBACK_BANK = {
  react: [
    { question: "What hook is used to manage state in a functional React component?", options: ["useEffect", "useState", "useReducer", "useRef"], correctAnswer: "useState", explanation: "useState returns a state variable and a setter function for managing local component state." },
    { question: "Which lifecycle method is equivalent to componentDidMount in hooks?", options: ["useEffect with no deps", "useEffect with empty array", "useMemo", "useCallback"], correctAnswer: "useEffect with empty array", explanation: "useEffect with an empty dependency array runs once after the first render, mimicking componentDidMount." },
    { question: "What does the Virtual DOM do in React?", options: ["Directly updates the browser DOM", "Stores component styles", "Acts as an in-memory representation to batch DOM updates", "Handles routing"], correctAnswer: "Acts as an in-memory representation to batch DOM updates", explanation: "React's Virtual DOM diffs changes and applies only the minimal necessary updates to the real DOM." },
    { question: "Which prop is used to pass children to a React component?", options: ["content", "children", "slots", "nodes"], correctAnswer: "children", explanation: "The special 'children' prop holds the content between opening and closing JSX tags." },
    { question: "What is the purpose of React.memo?", options: ["To create memoized selectors", "To prevent re-renders of components when props haven't changed", "To cache API responses", "To optimize CSS"], correctAnswer: "To prevent re-renders of components when props haven't changed", explanation: "React.memo is a higher-order component that shallow-compares props to skip unnecessary re-renders." },
  ],
  javascript: [
    { question: "What is the output of typeof null in JavaScript?", options: ["null", "undefined", "object", "string"], correctAnswer: "object", explanation: "typeof null returns 'object' — a long-standing quirk of JavaScript's type system." },
    { question: "Which method converts a JSON string to a JavaScript object?", options: ["JSON.stringify", "JSON.parse", "JSON.convert", "Object.fromJSON"], correctAnswer: "JSON.parse", explanation: "JSON.parse() parses a JSON string and returns the corresponding JavaScript object." },
    { question: "What does the 'use strict' directive do?", options: ["Enables TypeScript", "Forces synchronous execution", "Enables strict mode to catch common coding mistakes", "Minifies code"], correctAnswer: "Enables strict mode to catch common coding mistakes", explanation: "Strict mode prevents silent errors, disables deprecated features, and catches undeclared variables." },
    { question: "Which of the following is NOT a JavaScript primitive?", options: ["string", "boolean", "array", "number"], correctAnswer: "array", explanation: "Arrays are objects in JavaScript. The primitives are: string, number, bigint, boolean, undefined, symbol, null." },
    { question: "What does the spread operator (...) do?", options: ["Merges functions", "Deletes object keys", "Expands an iterable into individual elements", "Creates a deep clone"], correctAnswer: "Expands an iterable into individual elements", explanation: "The spread operator expands arrays/objects, useful for copying, merging, and passing arguments." },
  ],
  nodejs: [
    { question: "Which module system does Node.js use natively?", options: ["ES Modules only", "CommonJS (require/module.exports)", "AMD", "UMD"], correctAnswer: "CommonJS (require/module.exports)", explanation: "Node.js uses CommonJS by default; ES Modules are supported with .mjs extension or 'type':'module'." },
    { question: "What is the Event Loop in Node.js?", options: ["A DOM rendering cycle", "A mechanism that offloads async operations and processes callbacks", "A built-in HTTP server", "A REPL feature"], correctAnswer: "A mechanism that offloads async operations and processes callbacks", explanation: "The Event Loop allows Node.js to be non-blocking by delegating I/O to the OS and handling callbacks." },
    { question: "Which built-in module is used for file system operations?", options: ["path", "fs", "os", "stream"], correctAnswer: "fs", explanation: "The 'fs' module provides an API for interacting with the file system (read, write, delete, etc.)." },
    { question: "What does process.env hold?", options: ["Runtime errors", "Application environment variables", "Installed packages", "Memory usage"], correctAnswer: "Application environment variables", explanation: "process.env is an object containing the user environment variables passed at runtime." },
    { question: "Which flag runs a Node.js script with the inspector?", options: ["--debug", "--trace", "--inspect", "--watch"], correctAnswer: "--inspect", explanation: "node --inspect enables the V8 Inspector Protocol, allowing debugging via Chrome DevTools." },
  ],
  mongodb: [
    { question: "Which MongoDB method inserts a single document?", options: ["insertMany", "insertOne", "addOne", "create"], correctAnswer: "insertOne", explanation: "insertOne() inserts a single document and returns an InsertOneResult with the generated _id." },
    { question: "What is an index in MongoDB?", options: ["A type of document", "A data structure that improves query performance", "A collection backup", "A schema validator"], correctAnswer: "A data structure that improves query performance", explanation: "Indexes allow MongoDB to quickly locate documents without scanning the entire collection." },
    { question: "Which aggregation stage filters documents?", options: ["$group", "$project", "$match", "$sort"], correctAnswer: "$match", explanation: "$match filters the document stream and is similar to a WHERE clause in SQL." },
    { question: "What does mongoose provide over the native MongoDB driver?", options: ["Faster queries", "Schema validation and ODM features", "Authentication", "Caching"], correctAnswer: "Schema validation and ODM features", explanation: "Mongoose adds schema definitions, validation, middleware hooks, and model methods as an ODM layer." },
    { question: "Which MongoDB operator checks if a field exists?", options: ["$has", "$exists", "$contains", "$defined"], correctAnswer: "$exists", explanation: "$exists matches documents that have (or don't have) a specified field: { field: { $exists: true } }." },
  ],
  default: [
    { question: "What does REST stand for?", options: ["Remote Execution State Transfer", "Representational State Transfer", "Resource Entity State Transfer", "Remote State Transfer"], correctAnswer: "Representational State Transfer", explanation: "REST is an architectural style for distributed hypermedia systems, defining stateless client-server communication." },
    { question: "Which HTTP status code indicates a successful resource creation?", options: ["200", "201", "204", "301"], correctAnswer: "201", explanation: "HTTP 201 Created is returned when a resource is successfully created via POST." },
    { question: "What is the purpose of a foreign key in a relational database?", options: ["Indexes a table", "Links rows in one table to rows in another", "Enforces unique values", "Encrypts data"], correctAnswer: "Links rows in one table to rows in another", explanation: "A foreign key creates a referential integrity constraint, ensuring valid relationships between tables." },
    { question: "What does Git rebase do?", options: ["Merges two branches with a merge commit", "Replays commits from one branch onto another", "Resets the HEAD", "Deletes a branch"], correctAnswer: "Replays commits from one branch onto another", explanation: "Rebase moves or replays commits, creating a linear history — common before merging to keep history clean." },
    { question: "Which data structure uses LIFO (Last In, First Out)?", options: ["Queue", "Stack", "Heap", "Graph"], correctAnswer: "Stack", explanation: "A Stack operates LIFO — the last element pushed is the first one popped." },
  ],
};

const getMcqFallback = ({ skill, count }) => {
  const key = normalizeSkillText(skill);
  const bankKey = Object.keys(MCQ_FALLBACK_BANK).find((k) => key.includes(k)) || "default";
  const pool = MCQ_FALLBACK_BANK[bankKey];
  const size = Math.max(3, Math.min(10, Number(count) || 5));
  const shuffled = shuffleQuestions(pool);
  return Array.from({ length: size }, (_, i) => ({
    id: `fallback-mcq-${i + 1}`,
    question: shuffled[i % shuffled.length].question,
    type: "MCQ",
    options: shuffleQuestions([...shuffled[i % shuffled.length].options]),
    correctAnswer: shuffled[i % shuffled.length].correctAnswer,
    explanation: shuffled[i % shuffled.length].explanation,
  }));
};

/**
 * generateMcqQuestions — strict MCQ generation via Groq (json_object mode).
 * Falls back to curated MCQ bank if all providers fail.
 * Returns: { questions: [{id, question, type, options, correctAnswer, explanation}], usedFallback, provider }
 */
const generateMcqQuestions = async ({ userId, skill, difficulty, count = 5 }) => {
  const finalCount = Math.max(3, Math.min(10, Number(count) || 5));
  const normalDiff = DIFFICULTY_FORWARD[difficulty] || difficulty;
  const prompt = buildMcqPrompt({ skill, difficulty: normalDiff, count: finalCount });

  // Try each provider
  for (const provider of BASE_PROVIDER_CHAIN) {
    try {
      console.log(`[AI-MCQ] Trying provider: ${provider.name}`);
      const raw = await provider.caller(prompt);
      const text = String(raw || "").trim();

      // Parse {questions: [...]} or [...] response
      let parsed = null;
      try { parsed = JSON.parse(text); } catch { /* try strip */ }
      if (!parsed) {
        const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        try { parsed = JSON.parse(stripped); } catch { /* fall through */ }
      }

      const raw_questions = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.questions)
        ? parsed.questions
        : Object.values(parsed || {}).find(Array.isArray) || [];

      // Validate each has 4 options and a correctAnswer
      const valid = raw_questions.filter((q) =>
        q.question &&
        Array.isArray(q.options) && q.options.length === 4 &&
        q.correctAnswer &&
        q.options.some((o) => String(o).trim() === String(q.correctAnswer).trim())
      );

      if (valid.length >= 2) {
        const questions = valid.slice(0, finalCount).map((q, i) => ({
          id: `mcq-${i + 1}`,
          question: String(q.question),
          type: "MCQ",
          options: q.options.map(String),
          correctAnswer: String(q.correctAnswer),
          explanation: String(q.explanation || ""),
        }));
        console.log(`[AI-MCQ] ✓ ${provider.name} returned ${questions.length} MCQ questions for "${skill}"`);
        return { questions, usedFallback: false, provider: provider.name };
      }
    } catch (err) {
      console.warn(`[AI-MCQ] ${provider.name} failed: ${err.message}`);
    }
  }

  // All providers failed — use curated bank
  console.warn(`[AI-MCQ] All providers failed for "${skill}" — using curated fallback`);
  return {
    questions: getMcqFallback({ skill, count: finalCount }),
    usedFallback: true,
    provider: "fallback",
  };
};

// Expose difficulty map for reuse in controller

module.exports = {
  generateQuestions,
  generateMcqQuestions,
  ALLOWED_DIFFICULTIES,
  ALLOWED_TYPES,
  DIFFICULTY_FORWARD,
};
