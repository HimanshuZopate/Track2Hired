const STOP_WORDS = new Set([
  "the",
  "and",
  "with",
  "for",
  "that",
  "this",
  "from",
  "have",
  "your",
  "will",
  "you",
  "are",
  "our",
  "job",
  "role",
  "team",
  "years",
  "year",
  "experience",
  "looking",
  "candidate",
  "ability",
  "skills",
  "knowledge",
  "work",
  "using",
  "strong",
  "good"
]);

const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text = "") => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
};

const uniqueKeywords = (keywords = []) => {
  const deduped = [...new Set(keywords.map((word) => normalizeText(word)).filter(Boolean))];
  return deduped.sort();
};

const extractKeywords = (jobDescription) => {
  const words = tokenize(jobDescription);
  return uniqueKeywords(words);
};

const extractKeywordsFromResume = (content) => {
  const words = tokenize(content);
  return uniqueKeywords(words);
};

const calculateATSScore = (match = [], missing = []) => {
  const total = match.length + missing.length;
  if (total === 0) return 0;

  return Math.max(0, Math.min(100, Math.round((match.length / total) * 100)));
};

const generateSuggestions = (missingSkills = []) => {
  if (!missingSkills.length) {
    return [
      "Great alignment with job description keywords.",
      "Keep measurable achievements and action verbs to improve recruiter readability."
    ];
  }

  const suggestions = missingSkills.slice(0, 10).map(
    (skill) => `Add a concrete bullet point that demonstrates ${skill} in projects or experience.`
  );

  suggestions.push("Mirror exact job-description terminology where relevant and truthful.");
  suggestions.push("Quantify impact using numbers (%, time saved, revenue, scale). ");

  return suggestions;
};

module.exports = {
  extractKeywords,
  extractKeywordsFromResume,
  calculateATSScore,
  generateSuggestions
};