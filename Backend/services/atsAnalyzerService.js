const STRONG_ACTION_VERBS = [
  'Developed',
  'Implemented',
  'Designed',
  'Optimized',
  'Led',
  'Engineered',
  'Built',
  'Created',
  'Analyzed',
]

const WEAK_VERB_REPLACEMENTS = [
  { phrase: 'did', replacement: 'Developed' },
  { phrase: 'worked on', replacement: 'Implemented' },
  { phrase: 'made', replacement: 'Built' },
  { phrase: 'helped', replacement: 'Supported' },
  { phrase: 'responsible for', replacement: 'Led' },
  { phrase: 'handled', replacement: 'Managed' },
]

const COMMON_SKILLS = [
  'javascript',
  'typescript',
  'react',
  'node.js',
  'node',
  'express',
  'mongodb',
  'mongoose',
  'mysql',
  'postgresql',
  'sql',
  'html',
  'css',
  'tailwind',
  'bootstrap',
  'redux',
  'next.js',
  'rest api',
  'graphql',
  'python',
  'java',
  'c++',
  'c#',
  'golang',
  'php',
  'laravel',
  'django',
  'flask',
  'spring boot',
  'data structures',
  'algorithms',
  'oop',
  'system design',
  'unit testing',
  'integration testing',
  'jest',
  'cypress',
  'selenium',
  'machine learning',
  'deep learning',
  'nlp',
  'data analysis',
  'power bi',
  'tableau',
  'excel',
  'figma',
  'ui design',
  'ux design',
  'agile',
  'scrum',
  'problem solving',
  'communication',
]

const COMMON_TOOLS = [
  'git',
  'github',
  'gitlab',
  'jira',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'firebase',
  'vercel',
  'netlify',
  'postman',
  'linux',
  'npm',
  'yarn',
  'vite',
  'webpack',
  'babel',
  'ci/cd',
  'jenkins',
  'terraform',
  'notion',
  'slack',
]

const COMMON_ROLES = [
  'software engineer',
  'full stack engineer',
  'full stack developer',
  'frontend developer',
  'front end developer',
  'backend developer',
  'back end developer',
  'web developer',
  'mern stack developer',
  'react developer',
  'node.js developer',
  'data analyst',
  'business analyst',
  'product manager',
  'ui ux designer',
  'devops engineer',
  'machine learning engineer',
  'data scientist',
  'qa engineer',
  'sde',
]

const REQUIRED_SECTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'contactInfo', label: 'Contact info' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
  { key: 'projects', label: 'Projects' },
  { key: 'experience', label: 'Experience' },
  { key: 'certifications', label: 'Certifications' },
]

const STOP_WORDS = new Set([
  'the',
  'and',
  'with',
  'for',
  'that',
  'this',
  'from',
  'have',
  'your',
  'will',
  'you',
  'are',
  'our',
  'job',
  'role',
  'team',
  'years',
  'year',
  'experience',
  'looking',
  'candidate',
  'ability',
  'skills',
  'knowledge',
  'work',
  'using',
  'strong',
  'good',
  'must',
  'should',
  'able',
  'preferred',
  'plus',
  'etc',
  'requirements',
  'requirement',
  'responsibilities',
  'responsibility',
  'qualification',
  'qualifications',
])

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/

const safeText = (value = '') => String(value || '')

const normalizeText = (text = '') =>
  safeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const tokenize = (text = '') => {
  const normalized = normalizeText(text)
  if (!normalized) return []

  return normalized
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
}

const uniqueKeywords = (keywords = []) => {
  const deduped = [
    ...new Set(
      keywords
        .map((word) => normalizeText(word))
        .filter((word) => Boolean(word) && word.length > 1),
    ),
  ]

  return deduped.sort((left, right) => left.localeCompare(right))
}

const splitLines = (text = '') =>
  safeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

const matchesKeyword = (normalizedResumeText, keyword) => {
  const normalizedKeyword = normalizeText(keyword)
  if (!normalizedKeyword) return false

  if (/^[a-z0-9]+$/.test(normalizedKeyword)) {
    const regex = new RegExp(`(^|\\s)${escapeRegex(normalizedKeyword)}(?=\\s|$)`, 'i')
    return regex.test(normalizedResumeText)
  }

  return normalizedResumeText.includes(normalizedKeyword)
}

const scoreByCoverage = (matchedCount, totalCount) => {
  if (!totalCount) return 0
  return Math.round((matchedCount / totalCount) * 100)
}

const getCommonTermMatches = (text = '', catalog = []) => {
  const normalized = normalizeText(text)
  return uniqueKeywords(catalog.filter((term) => matchesKeyword(normalized, term)))
}

const extractFrequentWords = (text = '', limit = 20) => {
  const frequencies = tokenize(text).reduce((accumulator, word) => {
    accumulator[word] = (accumulator[word] || 0) + 1
    return accumulator
  }, {})

  return Object.entries(frequencies)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word]) => word)
}

const extractKeywordBuckets = (jobDescription = '') => {
  const skills = getCommonTermMatches(jobDescription, COMMON_SKILLS)
  const tools = getCommonTermMatches(jobDescription, COMMON_TOOLS)
  const roles = getCommonTermMatches(jobDescription, COMMON_ROLES)
  const frequentWords = extractFrequentWords(jobDescription, 20)

  const keywords = uniqueKeywords([...skills, ...tools, ...roles, ...frequentWords]).slice(0, 40)

  return {
    keywords,
    skills,
    tools,
    roles,
  }
}

const extractKeywords = (jobDescription = '') => extractKeywordBuckets(jobDescription).keywords

const extractKeywordsFromResume = (content = '') => {
  const skills = getCommonTermMatches(content, COMMON_SKILLS)
  const tools = getCommonTermMatches(content, COMMON_TOOLS)
  const roles = getCommonTermMatches(content, COMMON_ROLES)
  const frequentWords = extractFrequentWords(content, 25)

  return uniqueKeywords([...skills, ...tools, ...roles, ...frequentWords]).slice(0, 50)
}

const getMatchesAndMisses = (keywords = [], resumeText = '') => {
  const normalizedResume = normalizeText(resumeText)
  const uniqueList = uniqueKeywords(keywords)

  const matched = uniqueList.filter((keyword) => matchesKeyword(normalizedResume, keyword))
  const missing = uniqueList.filter((keyword) => !matched.includes(keyword))

  return { matched, missing }
}

const findSectionHeadings = (resumeText = '') => {
  const headingPatterns = {
    skills: /(^|\n)\s*(skills|technical skills|core skills|competencies)\s*$/im,
    education: /(^|\n)\s*(education|academic background)\s*$/im,
    projects: /(^|\n)\s*(projects|academic projects|professional projects)\s*$/im,
    experience: /(^|\n)\s*(experience|work experience|professional experience|employment|internship experience)\s*$/im,
    certifications: /(^|\n)\s*(certifications|licenses|certificates)\s*$/im,
  }

  return Object.entries(headingPatterns).reduce((accumulator, [key, pattern]) => {
    accumulator[key] = pattern.test(resumeText)
    return accumulator
  }, {})
}

const detectName = (resumeText = '') => {
  const topLines = splitLines(resumeText).slice(0, 4)

  return topLines.some(
    (line) =>
      !emailRegex.test(line) &&
      !phoneRegex.test(line) &&
      !/linkedin|github|portfolio|skills|education|projects|experience|certifications/i.test(line) &&
      /^[A-Za-z][A-Za-z .'-]{2,50}$/.test(line) &&
      line.split(/\s+/).length >= 2 &&
      line.split(/\s+/).length <= 4,
  )
}

const getSectionsStatus = (resumeText = '') => {
  const headingPresence = findSectionHeadings(resumeText)

  return {
    name: detectName(resumeText),
    contactInfo:
      emailRegex.test(resumeText) && (phoneRegex.test(resumeText) || /linkedin|github|portfolio/i.test(resumeText)),
    skills: headingPresence.skills || /\bskills\b/i.test(resumeText),
    education: headingPresence.education || /\beducation\b/i.test(resumeText),
    projects: headingPresence.projects || /\bprojects?\b/i.test(resumeText),
    experience: headingPresence.experience || /\b(experience|employment|internship|work history)\b/i.test(resumeText),
    certifications: headingPresence.certifications || /\b(certifications?|certificates?|licenses?)\b/i.test(resumeText),
  }
}

const getSectionWarnings = (sectionsStatus = {}) =>
  REQUIRED_SECTIONS.filter((section) => !sectionsStatus[section.key]).map(
    (section) => `Missing ${section.label} section`,
  )

const getFormattingScore = (resumeText = '', sectionsStatus = {}) => {
  const lines = splitLines(resumeText)
  const words = tokenize(resumeText)
  const headingCount = Object.values(findSectionHeadings(resumeText)).filter(Boolean).length
  const bulletCount = (safeText(resumeText).match(/(^|\n)\s*[-•*]/g) || []).length
  const pageLengthScore = words.length <= 700 ? 100 : words.length <= 1100 ? 88 : words.length <= 1400 ? 72 : 55
  const headingScore = headingCount >= 5 ? 100 : headingCount === 4 ? 82 : headingCount === 3 ? 65 : 40
  const bulletScore = bulletCount >= 5 ? 100 : bulletCount >= 2 ? 80 : 52
  const readabilityScore = lines.length >= 10 ? 100 : lines.length >= 6 ? 72 : 45
  const contactScore = sectionsStatus.contactInfo ? 100 : 45

  return Math.round((pageLengthScore + headingScore + bulletScore + readabilityScore + contactScore) / 5)
}

const findWeakActionVerbs = (resumeText = '') => {
  const lines = splitLines(resumeText)

  return WEAK_VERB_REPLACEMENTS.flatMap(({ phrase, replacement }) => {
    const regex = new RegExp(`(^|\\b)${escapeRegex(phrase)}(\\b|$)`, 'i')
    const foundLine = lines.find((line) => regex.test(line))

    if (!foundLine) return []

    return [
      {
        weak: phrase,
        replacement,
        sample: foundLine,
      },
    ]
  })
}

const calculateATSScore = (match = [], missing = []) => {
  const total = match.length + missing.length
  if (total === 0) return 0
  return Math.max(0, Math.min(100, Math.round((match.length / total) * 100)))
}

const buildImprovementChecklist = ({
  keywordMatch = 0,
  skillMatch = 0,
  sectionsStatus = {},
  formattingScore = 0,
  weakVerbSuggestions = [],
}) => [
  { label: 'Match at least 70% of target keywords', done: keywordMatch >= 70 },
  { label: 'Cover most role-specific skills and tools', done: skillMatch >= 65 },
  { label: 'Include all critical ATS sections', done: REQUIRED_SECTIONS.every((section) => sectionsStatus[section.key]) },
  { label: 'Keep formatting simple and scanner-friendly', done: formattingScore >= 75 },
  { label: 'Use strong action verbs in experience bullets', done: weakVerbSuggestions.length === 0 },
]

const generateSuggestions = (input = []) => {
  if (Array.isArray(input)) {
    if (!input.length) {
      return [
        'Great alignment with job description keywords.',
        'Keep measurable achievements and action verbs to improve recruiter readability.',
      ]
    }

    const suggestions = input.slice(0, 10).map(
      (skill) => `Add a concrete bullet point that demonstrates ${skill} in projects or experience.`,
    )

    suggestions.push('Mirror exact job-description terminology where relevant and truthful.')
    suggestions.push('Quantify impact using numbers (%, time saved, revenue, scale).')

    return suggestions
  }

  const report = input || {}
  const suggestions = []

  if ((report.missingKeywords || []).length) {
    suggestions.push(
      `Add these missing keywords where truthful: ${(report.missingKeywords || []).slice(0, 8).join(', ')}.`,
    )
  }

  if ((report.sectionWarnings || []).length) {
    suggestions.push(`Complete missing sections: ${report.sectionWarnings.join(', ')}.`)
  }

  if ((report.weakVerbSuggestions || []).length) {
    const verbTip = report.weakVerbSuggestions
      .slice(0, 3)
      .map((item) => `${item.weak} → ${item.replacement}`)
      .join(', ')
    suggestions.push(`Replace weak verbs with stronger ATS verbs: ${verbTip}.`)
  }

  if (report.pitfalls?.noProjects) {
    suggestions.push('Add 1–3 relevant projects to improve ATS coverage and recruiter confidence.')
  }

  if (report.pitfalls?.poorStructure) {
    suggestions.push('Use clear section headings, concise bullets, and simple one-page formatting.')
  }

  if (report.scoreBreakdown?.formatting < 70) {
    suggestions.push('Reduce clutter, use consistent bullet formatting, and keep the resume within one page when possible.')
  }

  if (!suggestions.length) {
    suggestions.push('Your resume is ATS-ready. Keep tailoring it per role for stronger keyword alignment.')
  }

  return [...new Set(suggestions)]
}

const analyzeResumeText = (resumeText = '', jobDescription = '', options = {}) => {
  const threshold = Number(options.threshold || 70)
  const keywordBuckets = extractKeywordBuckets(jobDescription)
  const keywordMatches = getMatchesAndMisses(keywordBuckets.keywords, resumeText)
  const skillUniverse = uniqueKeywords([...keywordBuckets.skills, ...keywordBuckets.tools, ...keywordBuckets.roles])
  const skillMatches = getMatchesAndMisses(skillUniverse, resumeText)
  const sectionsStatus = getSectionsStatus(resumeText)
  const sectionWarnings = getSectionWarnings(sectionsStatus)
  const sectionScore = scoreByCoverage(
    Object.values(sectionsStatus).filter(Boolean).length,
    REQUIRED_SECTIONS.length,
  )
  const formattingScore = getFormattingScore(resumeText, sectionsStatus)
  const weakVerbSuggestions = findWeakActionVerbs(resumeText)
  const keywordMatchPercentage = calculateATSScore(keywordMatches.matched, keywordMatches.missing)
  const skillsMatchPercentage = calculateATSScore(skillMatches.matched, skillMatches.missing)

  const pitfalls = {
    missingKeywords: keywordMatches.missing.slice(0, 12),
    weakActionVerbs: weakVerbSuggestions,
    noProjects: !sectionsStatus.projects,
    poorStructure:
      formattingScore < 70 ||
      Object.values(findSectionHeadings(resumeText)).filter(Boolean).length < 4 ||
      (safeText(resumeText).match(/(^|\n)\s*[-•*]/g) || []).length < 2,
  }

  const scoreBreakdown = {
    keywordMatch: keywordMatchPercentage,
    skillsMatch: skillsMatchPercentage,
    sectionCompleteness: sectionScore,
    formatting: formattingScore,
  }

  const score = Math.round(
    scoreBreakdown.keywordMatch * 0.4 +
      scoreBreakdown.skillsMatch * 0.2 +
      scoreBreakdown.sectionCompleteness * 0.2 +
      scoreBreakdown.formatting * 0.2,
  )

  const improvementChecklist = buildImprovementChecklist({
    keywordMatch: keywordMatchPercentage,
    skillMatch: skillsMatchPercentage,
    sectionsStatus,
    formattingScore,
    weakVerbSuggestions,
  })

  const report = {
    score,
    matchedKeywords: keywordMatches.matched,
    missingKeywords: keywordMatches.missing,
    matchedSkills: skillMatches.matched,
    missingSkills: skillMatches.missing,
    keywordMatchPercentage,
    scoreBreakdown,
    suggestions: [],
    sectionsStatus,
    sectionWarnings,
    pitfalls,
    strongVerbs: STRONG_ACTION_VERBS,
    weakVerbSuggestions,
    improvementChecklist,
    readyForATS:
      score >= threshold &&
      sectionWarnings.length <= 1 &&
      weakVerbSuggestions.length === 0 &&
      !pitfalls.poorStructure,
    readyBadge: score >= threshold ? 'Ready for ATS' : 'Needs Optimization',
    shouldBuildResume: score < threshold,
    jobKeywords: keywordBuckets,
  }

  report.suggestions = generateSuggestions(report)

  return report
}

module.exports = {
  STRONG_ACTION_VERBS,
  WEAK_VERB_REPLACEMENTS,
  extractKeywords,
  extractKeywordBuckets,
  extractKeywordsFromResume,
  calculateATSScore,
  generateSuggestions,
  analyzeResumeText,
}