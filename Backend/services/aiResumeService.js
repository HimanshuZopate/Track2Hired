const {
  STRONG_ACTION_VERBS,
  WEAK_VERB_REPLACEMENTS,
  extractKeywordBuckets
} = require("./atsAnalyzerService");

const DEFAULT_TEMPLATE_KEY = "minimal-professional";
const MAX_SKILLS = 14;
const MAX_PROJECTS = 4;
const MAX_EXPERIENCE = 4;
const MAX_CERTIFICATIONS = 6;
const MAX_ACHIEVEMENTS = 4;

const RESUME_TEMPLATES = [
  {
    key: "minimal-professional",
    name: "Minimal Professional",
    description: "Classic ATS-friendly single-column layout with crisp hierarchy.",
    previewLabel: "Best for software, analytics, and general professional roles"
  },
  {
    key: "modern-clean",
    name: "Modern Clean",
    description: "Balanced modern styling with clean chips and stronger visual grouping.",
    previewLabel: "Best for product, design, frontend, and startup-friendly roles"
  },
  {
    key: "compact-one-page",
    name: "Compact One-Page",
    description: "Dense ATS-safe layout optimized to fit maximum value on one page.",
    previewLabel: "Best for fresher and early-career one-page resumes"
  }
];

const safeString = (value = "") => String(value || "").trim();
const normalizeText = (value = "") => safeString(value).toLowerCase();
const unique = (items = []) => [...new Set(items.filter(Boolean))];
const escapeHtml = (value = "") =>
  safeString(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const asArray = (value) => (Array.isArray(value) ? value : []);

const asStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => safeString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => safeString(item))
      .filter(Boolean);
  }

  return [];
};

const chunkTextToBullets = (value = "") =>
  safeString(value)
    .split(/\r?\n|•|\|/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);

const replaceWeakVerb = (text = "") => {
  const original = safeString(text);
  if (!original) return "";

  const lower = original.toLowerCase();
  const weakMatch = WEAK_VERB_REPLACEMENTS.find(({ phrase }) => lower.startsWith(phrase));
  if (!weakMatch) return original;

  const remainder = original.slice(weakMatch.phrase.length).trim();
  return `${weakMatch.replacement}${remainder ? ` ${remainder}` : ""}`;
};

const ensureStrongVerb = (text = "", fallbackVerb = STRONG_ACTION_VERBS[0]) => {
  const cleaned = replaceWeakVerb(safeString(text).replace(/^[-•*]\s*/, ""));
  if (!cleaned) return "";

  const hasStrongVerb = STRONG_ACTION_VERBS.some((verb) => cleaned.startsWith(verb));
  if (hasStrongVerb) return cleaned;

  const firstChar = cleaned.charAt(0).toLowerCase();
  return `${fallbackVerb} ${firstChar}${cleaned.slice(1)}`;
};

const keywordPresent = (text = "", keyword = "") => normalizeText(text).includes(normalizeText(keyword));

const injectKeywordsIntoSentence = (sentence = "", keywords = []) => {
  const cleaned = safeString(sentence);
  if (!cleaned || !keywords.length) return cleaned;

  const missing = keywords.filter((keyword) => !keywordPresent(cleaned, keyword)).slice(0, 2);
  if (!missing.length) return cleaned;

  const base = cleaned.endsWith(".") ? cleaned.slice(0, -1) : cleaned;
  return `${base}, leveraging ${missing.join(" and ")}.`;
};

const resolveTemplate = (templateKey = DEFAULT_TEMPLATE_KEY) =>
  RESUME_TEMPLATES.find((template) => template.key === templateKey) || RESUME_TEMPLATES[0];

const getResumeTemplates = () => RESUME_TEMPLATES;

const normalizeProfileData = (profileData = {}) => {
  const education = asArray(profileData.education).map((item) => ({
    degree: safeString(item?.degree),
    institution: safeString(item?.institution),
    year: safeString(item?.year),
    cgpa: safeString(item?.cgpa)
  }));

  const projects = asArray(profileData.projects).map((item) => ({
    title: safeString(item?.title),
    description: safeString(item?.description),
    techStack: safeString(item?.techStack),
    link: safeString(item?.link)
  }));

  const experience = asArray(profileData.experience).map((item) => ({
    company: safeString(item?.company),
    role: safeString(item?.role),
    duration: safeString(item?.duration),
    description: safeString(item?.description)
  }));

  return {
    personalInfo: {
      name: safeString(profileData?.personalInfo?.name),
      email: safeString(profileData?.personalInfo?.email),
      phone: safeString(profileData?.personalInfo?.phone),
      linkedin: safeString(profileData?.personalInfo?.linkedin),
      github: safeString(profileData?.personalInfo?.github),
      portfolio: safeString(profileData?.personalInfo?.portfolio)
    },
    education,
    skills: asStringArray(profileData.skills),
    projects,
    certifications: asStringArray(profileData.certifications),
    experience,
    achievements: asStringArray(profileData.achievements),
    targetJobDescription: safeString(profileData.targetJobDescription),
    targetJobRole: safeString(profileData.targetJobRole),
    templateKey: safeString(profileData.templateKey) || DEFAULT_TEMPLATE_KEY
  };
};

const mergeSkillsWithKeywords = (skills = [], keywordBuckets = {}) => {
  const normalizedSkills = unique(skills.map((item) => safeString(item))).slice(0, MAX_SKILLS);
  const injectedKeywords = unique([...(keywordBuckets.skills || []), ...(keywordBuckets.tools || [])]).filter(
    (keyword) => !normalizedSkills.some((skill) => normalizeText(skill) === normalizeText(keyword))
  );

  const mergedSkills = unique([...normalizedSkills, ...injectedKeywords.slice(0, Math.max(0, MAX_SKILLS - normalizedSkills.length))]).slice(
    0,
    MAX_SKILLS
  );

  return {
    mergedSkills,
    injectedSkills: mergedSkills.filter(
      (skill) => !normalizedSkills.some((existing) => normalizeText(existing) === normalizeText(skill))
    )
  };
};

const buildProjectEntries = (projects = [], keywordBuckets = {}) => {
  const projectKeywords = unique([...(keywordBuckets.skills || []), ...(keywordBuckets.tools || [])]).slice(0, 8);

  const entries = projects.slice(0, MAX_PROJECTS).map((project, index) => {
    const techStack = unique([
      ...asStringArray(project.techStack),
      ...projectKeywords.filter((keyword) => keywordPresent(project.description, keyword) || keywordPresent(project.techStack, keyword))
    ]).slice(0, 6);

    const sourceBullets = chunkTextToBullets(project.description);
    const bullets = (sourceBullets.length ? sourceBullets : [
      `${STRONG_ACTION_VERBS[index % STRONG_ACTION_VERBS.length]} ${safeString(project.title) || "a project"} using ${techStack.join(", ") || "relevant technologies"} to solve user-facing workflows.`
    ]).map((bullet, bulletIndex) => {
      const candidateKeywords = projectKeywords.slice(bulletIndex, bulletIndex + 2);
      return ensureStrongVerb(injectKeywordsIntoSentence(bullet, candidateKeywords), STRONG_ACTION_VERBS[(index + bulletIndex) % STRONG_ACTION_VERBS.length]);
    });

    const injectedKeywords = projectKeywords.filter(
      (keyword) =>
        bullets.some((bullet) => keywordPresent(bullet, keyword)) &&
        !keywordPresent(project.description, keyword) &&
        !keywordPresent(project.techStack, keyword)
    );

    return {
      title: safeString(project.title) || `Project ${index + 1}`,
      techStack,
      link: safeString(project.link),
      bullets,
      injectedKeywords
    };
  });

  return {
    entries,
    injectedKeywords: unique(entries.flatMap((entry) => entry.injectedKeywords)).slice(0, 8)
  };
};

const buildExperienceEntries = (experience = [], keywordBuckets = {}) => {
  const experienceKeywords = unique([...(keywordBuckets.skills || []), ...(keywordBuckets.tools || [])]).slice(0, 8);

  return experience.slice(0, MAX_EXPERIENCE).map((item, index) => {
    const baseBullets = chunkTextToBullets(item.description);
    const bullets = (baseBullets.length ? baseBullets : [
      `${STRONG_ACTION_VERBS[index % STRONG_ACTION_VERBS.length]} solutions aligned to business goals and delivered measurable execution support.`
    ]).map((bullet, bulletIndex) => {
      const keywords = experienceKeywords.slice(bulletIndex, bulletIndex + 2);
      return ensureStrongVerb(injectKeywordsIntoSentence(bullet, keywords), STRONG_ACTION_VERBS[(index + bulletIndex + 1) % STRONG_ACTION_VERBS.length]);
    });

    return {
      company: safeString(item.company),
      role: safeString(item.role),
      duration: safeString(item.duration),
      bullets
    };
  });
};

const buildSummary = (profileData = {}, mergedSkills = [], keywordBuckets = {}) => {
  const role = profileData.targetJobRole || keywordBuckets.roles?.[0] || "Full Stack Developer";
  const topSkills = mergedSkills.slice(0, 4);
  const keywordLine = unique([...(keywordBuckets.skills || []).slice(0, 2), ...(keywordBuckets.tools || []).slice(0, 2)]).slice(0, 4);

  if (!topSkills.length && !keywordLine.length) {
    return `ATS-ready ${role} focused on building structured, measurable, and recruiter-friendly resume narratives.`;
  }

  return `ATS-ready ${role} with hands-on experience across ${topSkills.join(", ") || "modern tools and workflows"}. Built practical, outcome-driven work using ${keywordLine.join(", ") || "high-value technologies"} while focusing on clean execution, collaboration, and measurable business impact.`;
};

const buildHeader = (personalInfo = {}) => ({
  name: safeString(personalInfo.name) || "Candidate Name",
  contacts: [
    safeString(personalInfo.email),
    safeString(personalInfo.phone),
    safeString(personalInfo.linkedin),
    safeString(personalInfo.github),
    safeString(personalInfo.portfolio)
  ].filter(Boolean)
});

const buildResumeData = (profileInput = {}, options = {}) => {
  const profile = normalizeProfileData({ ...profileInput, ...options.profileOverrides });
  const template = resolveTemplate(options.templateKey || profile.templateKey);
  const keywordBuckets = extractKeywordBuckets(options.jobDescription || profile.targetJobDescription || "");
  const skillsState = mergeSkillsWithKeywords(profile.skills, keywordBuckets);
  const projectsState = buildProjectEntries(profile.projects, keywordBuckets);
  const experienceEntries = buildExperienceEntries(profile.experience, keywordBuckets);
  const certifications = profile.certifications.slice(0, MAX_CERTIFICATIONS);
  const achievements = profile.achievements.slice(0, MAX_ACHIEVEMENTS).map((item, index) =>
    ensureStrongVerb(item, STRONG_ACTION_VERBS[(index + 2) % STRONG_ACTION_VERBS.length])
  );

  return {
    template,
    templateKey: template.key,
    header: buildHeader(profile.personalInfo),
    personalInfo: profile.personalInfo,
    targetJobRole: profile.targetJobRole,
    summary: buildSummary(profile, skillsState.mergedSkills, keywordBuckets),
    skills: skillsState.mergedSkills,
    education: profile.education,
    projects: projectsState.entries,
    experience: experienceEntries,
    certifications,
    achievements,
    keywordBuckets,
    injectedKeywords: {
      skills: skillsState.injectedSkills,
      projects: projectsState.injectedKeywords
    }
  };
};

const renderTextSection = (title, rows = []) => {
  if (!rows.length) return "";
  return [title, ...rows, ""].join("\n");
};

const renderPlainTextResume = (resumeData = {}) => {
  const header = [resumeData.header.name, resumeData.header.contacts.join(" | "), ""].join("\n");

  const summarySection = renderTextSection("PROFESSIONAL SUMMARY", [resumeData.summary]);
  const skillsSection = renderTextSection("SKILLS", [resumeData.skills.join(", ")]);

  const experienceSection = renderTextSection(
    "EXPERIENCE",
    resumeData.experience.flatMap((entry) => {
      const titleLine = [entry.role, entry.company].filter(Boolean).join(" | ");
      const metaLine = entry.duration ? [entry.duration] : [];
      return [titleLine || "Experience", ...metaLine, ...entry.bullets.map((bullet) => `- ${bullet}`), ""];
    }).filter(Boolean)
  );

  const projectsSection = renderTextSection(
    "PROJECTS",
    resumeData.projects.flatMap((project) => {
      const titleLine = `${project.title}${project.techStack.length ? ` | Tech: ${project.techStack.join(", ")}` : ""}`;
      const linkLine = project.link ? [project.link] : [];
      return [titleLine, ...linkLine, ...project.bullets.map((bullet) => `- ${bullet}`), ""];
    }).filter(Boolean)
  );

  const educationSection = renderTextSection(
    "EDUCATION",
    resumeData.education.map((item) =>
      [item.degree, item.institution, item.year, item.cgpa ? `CGPA: ${item.cgpa}` : ""].filter(Boolean).join(" | ")
    )
  );

  const certificationsSection = renderTextSection(
    "CERTIFICATIONS",
    resumeData.certifications.map((item) => `- ${item}`)
  );

  const achievementsSection = renderTextSection(
    "ACHIEVEMENTS",
    resumeData.achievements.map((item) => `- ${item}`)
  );

  return [
    header,
    summarySection,
    skillsSection,
    experienceSection,
    projectsSection,
    educationSection,
    certificationsSection,
    achievementsSection
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const renderBulletList = (items = []) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

const renderHtmlResume = (resumeData = {}) => {
  const template = resumeData.template || resolveTemplate(resumeData.templateKey);
  const isModern = template.key === "modern-clean";
  const isCompact = template.key === "compact-one-page";

  const section = (title, content) =>
    content
      ? `<section class="resume-section"><h2>${escapeHtml(title)}</h2>${content}</section>`
      : "";

  const skillsContent = resumeData.skills.length
    ? `<div class="chip-grid">${resumeData.skills
        .map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`)
        .join("")}</div>`
    : "";

  const experienceContent = resumeData.experience.length
    ? resumeData.experience
        .map(
          (entry) => `
            <article class="entry-block">
              <div class="entry-heading">
                <div>
                  <h3>${escapeHtml(entry.role || "Experience")}</h3>
                  <p>${escapeHtml(entry.company)}</p>
                </div>
                <span>${escapeHtml(entry.duration)}</span>
              </div>
              <ul>${renderBulletList(entry.bullets)}</ul>
            </article>
          `
        )
        .join("")
    : "";

  const projectsContent = resumeData.projects.length
    ? resumeData.projects
        .map(
          (project) => `
            <article class="entry-block">
              <div class="entry-heading">
                <div>
                  <h3>${escapeHtml(project.title)}</h3>
                  <p>${escapeHtml(project.techStack.join(" • "))}</p>
                </div>
                ${project.link ? `<span>${escapeHtml(project.link)}</span>` : ""}
              </div>
              <ul>${renderBulletList(project.bullets)}</ul>
            </article>
          `
        )
        .join("")
    : "";

  const educationContent = resumeData.education.length
    ? resumeData.education
        .map(
          (item) => `
            <article class="entry-block compact-entry">
              <div class="entry-heading">
                <div>
                  <h3>${escapeHtml(item.degree || "Education")}</h3>
                  <p>${escapeHtml(item.institution)}</p>
                </div>
                <span>${escapeHtml(item.year)}</span>
              </div>
              ${item.cgpa ? `<p class="meta-line">CGPA: ${escapeHtml(item.cgpa)}</p>` : ""}
            </article>
          `
        )
        .join("")
    : "";

  const certificationsContent = resumeData.certifications.length
    ? `<ul>${renderBulletList(resumeData.certifications)}</ul>`
    : "";

  const achievementsContent = resumeData.achievements.length
    ? `<ul>${renderBulletList(resumeData.achievements)}</ul>`
    : "";

  const content = isCompact
    ? `
        <div class="resume-grid compact-grid">
          <div class="main-column">
            ${section("Professional Summary", `<p>${escapeHtml(resumeData.summary)}</p>`)}
            ${section("Experience", experienceContent)}
            ${section("Projects", projectsContent)}
          </div>
          <aside class="side-column">
            ${section("Skills", skillsContent)}
            ${section("Education", educationContent)}
            ${section("Certifications", certificationsContent)}
            ${section("Achievements", achievementsContent)}
          </aside>
        </div>
      `
    : `
        <div class="resume-grid">
          ${section("Professional Summary", `<p>${escapeHtml(resumeData.summary)}</p>`)}
          ${section("Skills", skillsContent)}
          ${section("Experience", experienceContent)}
          ${section("Projects", projectsContent)}
          ${section("Education", educationContent)}
          ${section("Certifications", certificationsContent)}
          ${section("Achievements", achievementsContent)}
        </div>
      `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(resumeData.header.name)} Resume</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #f8fafc;
          }
          .page {
            width: 794px;
            min-height: 1123px;
            margin: 0 auto;
            padding: ${isCompact ? "28px 34px" : "36px 44px"};
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid ${isModern ? "#0ea5e9" : isCompact ? "#334155" : "#1e293b"};
            padding-bottom: 16px;
            margin-bottom: 18px;
          }
          .header h1 {
            margin: 0 0 8px;
            font-size: ${isCompact ? "28px" : "32px"};
            letter-spacing: 0.3px;
            color: ${isModern ? "#0369a1" : "#0f172a"};
          }
          .contact-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 12px;
            font-size: 12px;
            color: #334155;
          }
          .resume-grid { display: grid; gap: 14px; }
          .compact-grid {
            grid-template-columns: 1.6fr 0.95fr;
            gap: 18px;
          }
          .resume-section h2 {
            margin: 0 0 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid ${isModern ? "#bae6fd" : "#cbd5e1"};
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 1.2px;
            color: ${isModern ? "#0284c7" : "#334155"};
          }
          .resume-section p,
          .resume-section li,
          .resume-section span {
            font-size: ${isCompact ? "11.6px" : "12.2px"};
            line-height: 1.5;
          }
          .resume-section p { margin: 0; }
          .entry-block { margin-bottom: 10px; }
          .entry-block:last-child { margin-bottom: 0; }
          .entry-heading {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 6px;
          }
          .entry-heading h3 {
            margin: 0;
            font-size: ${isCompact ? "13px" : "14px"};
            color: #0f172a;
          }
          .entry-heading p,
          .meta-line {
            margin: 2px 0 0;
            color: #475569;
          }
          .entry-heading span {
            color: #475569;
            white-space: nowrap;
          }
          ul {
            margin: 0;
            padding-left: 18px;
          }
          li { margin-bottom: 4px; }
          .chip-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .chip {
            padding: 4px 8px;
            border: 1px solid ${isModern ? "#7dd3fc" : "#cbd5e1"};
            border-radius: 999px;
            background: ${isModern ? "#f0f9ff" : "#f8fafc"};
            font-size: 11.5px;
          }
          .side-column .resume-section:first-child,
          .main-column .resume-section:first-child {
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="page ${escapeHtml(template.key)}">
          <header class="header">
            <h1>${escapeHtml(resumeData.header.name)}</h1>
            <div class="contact-row">
              ${resumeData.header.contacts.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
          </header>
          ${content}
        </div>
      </body>
    </html>
  `;
};

const buildSimplePdfBuffer = (content = "") => {
  const text = safeString(content) || "Resume";
  const lines = text.split("\n").slice(0, 130);
  const escapedLines = lines.map((line) =>
    line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  );

  const textCommands = ["BT", "/F1 10 Tf", "45 800 Td"];
  escapedLines.forEach((line, index) => {
    if (index > 0) textCommands.push("0 -13 Td");
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

const renderPdfBufferWithPuppeteer = async (htmlContent = "") => {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    return null;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm"
      }
    });
  } finally {
    await browser.close();
  }
};

const formatResumeTemplate = (resumeData = {}, templateKey) => {
  const normalizedResume = {
    ...resumeData,
    template: resolveTemplate(templateKey || resumeData.templateKey || resumeData.template?.key)
  };

  return {
    ...normalizedResume,
    templateKey: normalizedResume.template.key,
    plainText: renderPlainTextResume(normalizedResume),
    htmlContent: renderHtmlResume(normalizedResume)
  };
};

const generateResumeContent = async (profileData = {}, options = {}) => {
  const built = buildResumeData(profileData, options);
  return formatResumeTemplate(built, options.templateKey || built.templateKey);
};

const optimizeForATS = async (contentOrProfile = {}, jobDescription = "", options = {}) => {
  if (typeof contentOrProfile === "string") {
    return safeString(contentOrProfile);
  }

  return generateResumeContent(contentOrProfile, {
    ...options,
    jobDescription: jobDescription || contentOrProfile.targetJobDescription,
    templateKey: options.templateKey || contentOrProfile.templateKey
  });
};

const generatePDF = async (payload = {}) => {
  const htmlContent = safeString(payload.htmlContent);
  const plainText = safeString(payload.plainText || payload.generatedContent || payload.content);
  const pdfBuffer = (await renderPdfBufferWithPuppeteer(htmlContent).catch(() => null)) || buildSimplePdfBuffer(plainText);
  return `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
};

module.exports = {
  DEFAULT_TEMPLATE_KEY,
  getResumeTemplates,
  generateResumeContent,
  optimizeForATS,
  formatResumeTemplate,
  generatePDF
};