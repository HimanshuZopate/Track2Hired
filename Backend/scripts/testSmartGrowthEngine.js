const base = "http://localhost:5000";

const req = async (path, opts = {}) => {
  const res = await fetch(base + path, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
};

const pass = "Test@12345";
const makeEmail = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;

const report = [];
const check = (name, ok, detail) => {
  report.push(`${ok ? "PASS" : "FAIL"} | ${name} | ${detail}`);
};

const register = async (prefix) => {
  const email = makeEmail(prefix);
  const result = await req("/api/users/register", {
    method: "POST",
    body: {
      name: prefix,
      email,
      password: pass
    }
  });

  if (result.status !== 201 || !result.data?.token) {
    throw new Error(`register failed for ${prefix} (status=${result.status})`);
  }

  return result.data.token;
};

const addSkill = (token, skillName, category, confidenceScore) => {
  return req("/api/skills", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: {
      skillName,
      category,
      level: "Intermediate",
      confidenceScore
    }
  });
};

const getSuggestion = (token, query = "") => {
  return req(`/api/suggestions/today${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

const getMotivation = (token) => {
  return req("/api/motivation", {
    headers: { Authorization: `Bearer ${token}` }
  });
};

const recordAttempt = (token, questionId, isCorrect) => {
  return req("/api/ai/attempt", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: {
      questionId,
      userAnswer: "sample",
      isCorrect
    }
  });
};

const run = async () => {
  try {
    const root = await fetch(base + "/");
    check("Server reachable", root.status === 200, `status=${root.status}`);

    // 1) Weak skill branch
    const t1 = await register("weakskill");
    await addSkill(t1, "React Hooks", "Technical", 2);
    const s1 = await getSuggestion(t1);
    check(
      "Suggestion weak skill branch",
      s1.status === 200 && String(s1.data?.suggestion?.generatedFrom || "").includes("Lowest confidence skill"),
      `status=${s1.status} from=${s1.data?.suggestion?.generatedFrom || "n/a"}`
    );

    // 2) Company focus override
    const t2 = await register("companyfocus");
    await addSkill(t2, "DSA", "Technical", 5);
    const s2 = await getSuggestion(t2, "?companyFocus=Google");
    check(
      "Suggestion company focus override",
      s2.status === 200 && String(s2.data?.suggestion?.suggestionText || "").includes("Google"),
      `status=${s2.status} text=${s2.data?.suggestion?.suggestionText || "n/a"}`
    );

    // 3) Recent failures branch (no weak skill)
    const t3 = await register("recentfail");
    await addSkill(t3, "Node.js", "Technical", 4);
    await recordAttempt(t3, `rf-${Date.now()}-1`, false);
    await recordAttempt(t3, `rf-${Date.now()}-2`, false);
    const s3 = await getSuggestion(t3);
    check(
      "Suggestion recent failures branch",
      s3.status === 200 && String(s3.data?.suggestion?.generatedFrom || "").includes("Recent failed attempts"),
      `status=${s3.status} from=${s3.data?.suggestion?.generatedFrom || "n/a"}`
    );

    // 4) Readiness < 60 branch (no weak, no failures)
    const t4 = await register("readinesslow");
    await addSkill(t4, "Express", "Technical", 3);
    const s4 = await getSuggestion(t4);
    check(
      "Suggestion readiness < 60 branch",
      s4.status === 200 && String(s4.data?.suggestion?.generatedFrom || "").includes("Overall readiness is below 60%"),
      `status=${s4.status} from=${s4.data?.suggestion?.generatedFrom || "n/a"}`
    );

    // 5) Default branch (no weak, no failures, readiness >= 60)
    const t5 = await register("defaultbranch");
    await addSkill(t5, "System Design", "Technical", 5);
    const s5 = await getSuggestion(t5);
    check(
      "Suggestion default branch",
      s5.status === 200 && String(s5.data?.suggestion?.generatedFrom || "").includes("defaulting to growth practice"),
      `status=${s5.status} from=${s5.data?.suggestion?.generatedFrom || "n/a"}`
    );

    // 6) Same-day caching behavior
    const s5b = await getSuggestion(t5);
    check(
      "Suggestion cached for same day",
      s5.status === 200 && s5b.status === 200 && s5.data?.suggestion?._id === s5b.data?.suggestion?._id,
      `id1=${s5.data?.suggestion?._id || "n/a"} id2=${s5b.data?.suggestion?._id || "n/a"}`
    );

    // 7) Motivation low readiness context-aware
    const m1 = await getMotivation(t4);
    check(
      "Motivation low-readiness context-aware",
      m1.status === 200 && m1.data?.type === "context-aware" && Number(m1.data?.readinessPercent) < 50,
      `status=${m1.status} type=${m1.data?.type || "n/a"} readiness=${m1.data?.readinessPercent}`
    );

    // 8) Motivation high readiness context-aware
    const t6 = await register("readinesshigh");
    await addSkill(t6, "Algorithms", "Technical", 5);
    await addSkill(t6, "Communication", "HR", 5);
    const m2 = await getMotivation(t6);
    check(
      "Motivation high-readiness context-aware",
      m2.status === 200 && m2.data?.type === "context-aware" && Number(m2.data?.readinessPercent) >= 80,
      `status=${m2.status} type=${m2.data?.type || "n/a"} readiness=${m2.data?.readinessPercent}`
    );

    console.log(report.join("\n"));
  } catch (error) {
    console.log(`FAIL | Test runner crashed | ${error.message}`);
  }
};

run();