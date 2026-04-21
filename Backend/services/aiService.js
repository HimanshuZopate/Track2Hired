"use strict";

const axios = require("axios");
const GeneratedQuestion = require("../models/GeneratedQuestion");

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

  // Skip entries that are all fallback questions
  const allFallback = latest.questions.every((q) =>
    String(q?.id || "").startsWith("fallback-")
  );
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

// ─── Rich fallback library ───────────────────────────────────────────────────
const FALLBACK_LIBRARY = {
  react: [
    { q: "Explain the Virtual DOM and how React uses it for efficient rendering.", a: "The Virtual DOM is a lightweight in-memory representation of the real DOM. React diffs previous and new states (reconciliation), applying only minimal real DOM changes.", e: "This is the core of React's performance model." },
    { q: "What is the difference between useState and useReducer?", a: "useState is for simple state. useReducer is better for complex state transitions where next state depends on previous state and has multiple sub-values.", e: "useReducer mirrors Redux-style logic inside a component." },
    { q: "What are React keys and why are they important?", a: "Keys help React identify which list items changed, were added, or removed. They should be stable and unique among siblings.", e: "Using index as key causes bugs when the list is reordered." },
    { q: "Describe the useEffect cleanup function.", a: "The cleanup runs before the next effect and on unmount. Use it to cancel subscriptions, clear timers, or abort fetch requests.", e: "No cleanup leads to stale closures and memory leaks." },
    { q: "What is prop drilling and how does Context API solve it?", a: "Prop drilling passes props through multiple layers. Context provides a way to share values globally without explicit prop passing at every level.", e: "Context is ideal for themes, auth, locale — not frequent-update data." },
    { q: "Explain React.memo and when to use it.", a: "React.memo is a HOC that prevents re-renders if props haven't changed (shallow comparison). Use for expensive components that receive the same props often.", e: "Overusing memo can hurt performance due to comparison overhead." },
    { q: "What are custom hooks and why use them?", a: "Custom hooks are functions prefixed with 'use' that encapsulate reusable stateful logic. They let you extract and share component logic without render props or HOCs.", e: "Custom hooks follow the same rules as built-in hooks." },
    { q: "Explain the difference between controlled and uncontrolled components.", a: "Controlled components have their state managed by React via props. Uncontrolled components manage their own state internally via refs.", e: "Controlled components are recommended for form validation." },
  ],
  javascript: [
    { q: "What is the event loop in JavaScript?", a: "The event loop monitors the call stack and callback queue. When the stack is empty, it moves callbacks from the queue to the stack for execution.", e: "This is what makes JS non-blocking despite being single-threaded." },
    { q: "Explain closures with a real-world example.", a: "A closure is a function that retains access to its outer scope even after the outer function has returned. Example: a counter factory or memoization.", e: "Closures are used in module patterns, memoization, and currying." },
    { q: "What is the difference between == and ===?", a: "== performs type coercion before comparison; === checks value AND type without coercion. Always prefer ===.", e: "Type coercion causes bugs like 0 == '' being true." },
    { q: "Explain Promises and async/await.", a: "A Promise represents a future value (pending/fulfilled/rejected). async/await is syntactic sugar over Promises for sequential-looking async code.", e: "async/await makes error handling with try/catch natural." },
    { q: "What is prototypal inheritance?", a: "Objects inherit properties via the prototype chain. When a property isn't found, the engine walks up until null.", e: "class syntax is syntactic sugar over prototypal inheritance." },
    { q: "Explain the difference between var, let, and const.", a: "var is function-scoped and hoisted. let and const are block-scoped. const prevents reassignment but not mutation of objects.", e: "Always prefer const, use let when reassignment is needed, avoid var." },
    { q: "What is debouncing and throttling?", a: "Debouncing delays execution until after a pause in events. Throttling limits execution to at most once per interval. Both optimize performance.", e: "Debounce for search inputs, throttle for scroll handlers." },
    { q: "Explain WeakMap and WeakSet.", a: "WeakMap/WeakSet hold weak references to objects, allowing garbage collection if no other references exist. Keys must be objects.", e: "Used for private data storage and metadata caching without memory leaks." },
  ],
  node: [
    { q: "Explain the Node.js event-driven architecture.", a: "Node registers events and handlers. When I/O completes, the event loop picks up the callback, enabling high concurrency without threads.", e: "Excellent for I/O-intensive, not CPU-intensive, tasks." },
    { q: "What is middleware in Express.js?", a: "Middleware are functions with access to req, res, next. They execute sequentially, modifying request/response or ending the cycle.", e: "Examples: authentication, logging, body parsing, error handling." },
    { q: "How does Node.js handle async operations?", a: "Via libuv's thread pool for I/O and the event loop for callbacks. Heavy I/O is offloaded so the main thread stays free.", e: "Blocking the main thread defeats Node's purpose." },
    { q: "What is the difference between process.nextTick and setImmediate?", a: "process.nextTick runs before any I/O in the current iteration. setImmediate runs in the check phase, after I/O callbacks.", e: "Overusing nextTick can starve I/O callbacks." },
    { q: "How do you handle errors in Express?", a: "Use try/catch in async handlers, pass errors to next(), and define a centralized error-handling middleware with (err, req, res, next) signature.", e: "Always have a global error handler as the last middleware." },
  ],
  mongodb: [
    { q: "What is an aggregation pipeline in MongoDB?", a: "A series of stages ($match, $group, $sort, $project, etc.) that transform documents sequentially.", e: "More powerful than simple queries for analytics." },
    { q: "Explain indexing in MongoDB.", a: "Indexes store a subset of data in an easily traversable form, speeding reads at the cost of write performance.", e: "Always index fields used in $match and $sort." },
    { q: "What is the difference between findOneAndUpdate and updateOne?", a: "findOneAndUpdate returns the document. updateOne only returns matched/modified counts.", e: "Use findOneAndUpdate when you need the document back." },
    { q: "What are Mongoose middleware (hooks)?", a: "Pre/post hooks on schema methods. Use async function() syntax in Mongoose 9+.", e: "Common uses: password hashing, setting timestamps." },
    { q: "How does MongoDB handle transactions?", a: "Multi-document ACID transactions via sessions. Use session.startTransaction(), commit, and abort.", e: "Transactions have overhead; use only when necessary." },
  ],
  default: [
    { q: "Describe your approach to debugging a production issue.", a: "Check structured logs → reproduce locally → find minimal reproducing case → hotfix with feature flag → write regression test.", e: "Systematic debugging reduces MTTR." },
    { q: "What is the difference between SQL and NoSQL databases?", a: "SQL: relational, fixed schema, ACID, complex joins. NoSQL: flexible schema, horizontally scalable, eventual consistency.", e: "Choose based on data shape and access patterns." },
    { q: "Explain REST API best practices.", a: "Correct HTTP verbs, stateless requests, resource URLs, proper status codes, versioning, pagination.", e: "Consistent conventions reduce client confusion." },
    { q: "What is JWT and how does it work?", a: "JSON Web Token: header.payload.signature. Server signs payload with secret, client sends in Authorization header, server verifies.", e: "JWTs are stateless — no session store needed." },
    { q: "What is CI/CD and why is it important?", a: "CI: run tests on every push. CD: auto-deploy to staging/prod. Reduces integration risk, speeds delivery.", e: "Small frequent deployments are safer than big-bang releases." },
    { q: "Explain the concept of microservices.", a: "Application split into small, independent services that communicate via APIs. Each service is deployable and scalable independently.", e: "Increases complexity but enables team autonomy and scaling." },
    { q: "What is rate limiting and why is it important?", a: "Restricting the number of requests a client can make in a time window. Prevents abuse, ensures fair usage, protects server resources.", e: "Implemented via middleware (token bucket, sliding window, etc.)." },
    { q: "What is CORS and why does it exist?", a: "Cross-Origin Resource Sharing prevents web pages from making requests to a different domain unless the server allows it via headers.", e: "Security mechanism to prevent unauthorized cross-origin data access." },
  ],
};

const pickFallbackBank = (skill) => {
  const s = skill.trim().toLowerCase();
  if (s.includes("react")) return FALLBACK_LIBRARY.react;
  if (s.includes("javascript") || s.includes("js") || s.includes("typescript")) return FALLBACK_LIBRARY.javascript;
  if (s.includes("node") || s.includes("express")) return FALLBACK_LIBRARY.node;
  if (s.includes("mongo") || s.includes("mongoose")) return FALLBACK_LIBRARY.mongodb;
  return FALLBACK_LIBRARY.default;
};

const buildFallbackQuestions = ({ skill, difficulty, type, count }) => {
  const bank = pickFallbackBank(skill);
  const qType = type === "Mixed" ? "Theory" : type;
  const n = Math.max(5, Number(count) || 5);

  return Array.from({ length: n }, (_, i) => {
    const src = bank[i % bank.length];
    return {
      id: `fallback-${i + 1}`,
      question: src ? `[${difficulty}] ${src.q}` : `[${difficulty}] Interview question ${i + 1} about ${skill}`,
      type: qType,
      options: qType === "MCQ" ? [src?.a || `Option A`, "Option B", "Option C", "Option D"] : [],
      answer: src?.a || "Review official documentation for a thorough answer.",
      explanation: (src?.e || "") + " (Fallback question — AI provider temporarily unavailable.)",
    };
  });
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
