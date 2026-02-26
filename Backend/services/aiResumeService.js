const axios = require("axios");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const safeString = (value) => String(value || "").trim();

const messagesToPrompt = (messages = []) =>
  messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

const callOpenAI = async (messages) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.2";
  const response = await axios.post(
    OPENAI_URL,
    {
      model,
      temperature: 0.7,
      messages
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 25000
    }
  );

  const content = response?.data?.choices?.[0]?.message?.content;
  return safeString(content);
};

const callGemini = async (messages) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: messagesToPrompt(messages) }] }],
      generationConfig: {
        temperature: 0.7
      }
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 25000
    }
  );

  const content = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return safeString(content);
};

const callLLM = async (messages) => {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "openai") {
    return callOpenAI(messages);
  }
  return callGemini(messages);
};

const buildProfileSummary = (profileData = {}) => {
  const {
    personalInfo = {},
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    experience = [],
    achievements = []
  } = profileData;

  return JSON.stringify(
    {
      personalInfo,
      education,
      skills,
      projects,
      certifications,
      experience,
      achievements
    },
    null,
    2
  );
};

const buildFallbackResume = (profileData = {}) => {
  const name = safeString(profileData?.personalInfo?.name) || "Candidate Name";
  const email = safeString(profileData?.personalInfo?.email) || "candidate@email.com";
  const phone = safeString(profileData?.personalInfo?.phone);
  const linkedin = safeString(profileData?.personalInfo?.linkedin);
  const github = safeString(profileData?.personalInfo?.github);
  const portfolio = safeString(profileData?.personalInfo?.portfolio);

  const skillBullets = (profileData.skills || []).slice(0, 15).join(", ");
  const achievements = (profileData.achievements || []).slice(0, 5);
  const projectLines = (profileData.projects || []).slice(0, 4).map((project) => {
    const title = safeString(project.title) || "Project";
    const description = safeString(project.description);
    const techStack = safeString(project.techStack);
    const link = safeString(project.link);
    return `- ${title}: ${description}${techStack ? ` | Tech: ${techStack}` : ""}${
      link ? ` | ${link}` : ""
    }`;
  });

  return [
    `${name}`,
    [email, phone, linkedin, github, portfolio].filter(Boolean).join(" | "),
    "",
    "PROFESSIONAL SUMMARY",
    "Detail-oriented candidate with practical project and problem-solving experience, seeking to contribute immediate impact.",
    "",
    "SKILLS",
    skillBullets || "Add relevant technical and domain skills here.",
    "",
    "PROJECTS",
    projectLines.length ? projectLines.join("\n") : "- Add 2-4 impactful projects with measurable outcomes.",
    "",
    "ACHIEVEMENTS",
    achievements.length ? achievements.map((item) => `- ${item}`).join("\n") : "- Add achievements with quantifiable impact."
  ].join("\n");
};

const generateResumeContent = async (profileData = {}) => {
  const messages = [
    {
      role: "system",
      content:
        "You are an expert resume writer. Create ATS-friendly resumes with concise, impact-oriented bullet points and clear section headings."
    },
    {
      role: "user",
      content: `Generate a professional one-page ATS-friendly resume text from the profile data below.

Requirements:
- Use section headings: PROFESSIONAL SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATIONS, ACHIEVEMENTS.
- Keep concise, recruiter-friendly language.
- Use bullet points and quantifiable impact where possible.
- Output plain text only (no markdown code fences).

Profile data:
${buildProfileSummary(profileData)}`
    }
  ];

  try {
    const content = await callLLM(messages);
    return content || buildFallbackResume(profileData);
  } catch {
    return buildFallbackResume(profileData);
  }
};

const optimizeForATS = async (content = "", jobDescription = "") => {
  if (!safeString(jobDescription)) {
    return safeString(content);
  }

  const messages = [
    {
      role: "system",
      content:
        "You are an ATS optimization assistant. Improve keyword relevance while preserving factual honesty and readability."
    },
    {
      role: "user",
      content: `Optimize the resume for this job description.

Rules:
- Keep it truthful (do not invent experiences).
- Improve ATS keyword coverage by rephrasing existing content.
- Keep output as plain text resume.

Job Description:
${jobDescription}

Resume Content:
${content}`
    }
  ];

  try {
    const optimized = await callLLM(messages);
    return optimized || safeString(content);
  } catch {
    return safeString(content);
  }
};

const formatResumeTemplate = (content = "") => {
  return safeString(content)
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
};

const buildSimplePdfBuffer = (content = "") => {
  const text = safeString(content) || "Resume";
  const lines = text.split("\n").slice(0, 120);
  const escapedLines = lines.map((line) => line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"));

  const textCommands = ["BT", "/F1 11 Tf", "50 790 Td"];
  escapedLines.forEach((line, index) => {
    if (index > 0) {
      textCommands.push("0 -14 Td");
    }
    textCommands.push(`(${line}) Tj`);
  });
  textCommands.push("ET");
  const stream = textCommands.join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj`
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${object}\n`;
  });

  const xrefPosition = Buffer.byteLength(body, "utf8");
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return Buffer.from(body, "utf8");
};

const generatePDF = async (content = "") => {
  const pdfBuffer = buildSimplePdfBuffer(content);
  return `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
};

module.exports = {
  generateResumeContent,
  optimizeForATS,
  formatResumeTemplate,
  generatePDF
};