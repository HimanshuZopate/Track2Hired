const { body, param } = require("express-validator");

const AUTH_PASSWORD_MIN = 6;

const registerValidator = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: AUTH_PASSWORD_MIN })
    .withMessage(`password must be at least ${AUTH_PASSWORD_MIN} characters`)
];

const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("password is required")
];

const recruiterRegisterValidator = [
  body("companyName").trim().notEmpty().withMessage("companyName is required"),
  body("recruiterName").trim().notEmpty().withMessage("recruiterName is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: AUTH_PASSWORD_MIN })
    .withMessage(`password must be at least ${AUTH_PASSWORD_MIN} characters`)
];

const recruiterLoginValidator = [...loginValidator];

const skillCreateValidator = [
  body("skillName").trim().notEmpty().withMessage("skillName is required"),
  body("category")
    .isIn(["Technical", "HR", "Behavioral"])
    .withMessage("category must be one of Technical, HR, Behavioral"),
  body("level")
    .isIn(["Beginner", "Intermediate", "Advanced"])
    .withMessage("level must be one of Beginner, Intermediate, Advanced"),
  body("confidenceScore")
    .isFloat({ min: 1, max: 5 })
    .withMessage("confidenceScore must be between 1 and 5")
];

const skillUpdateValidator = [
  param("id").isMongoId().withMessage("Invalid skill id"),
  body().custom((value) => {
    const allowed = ["skillName", "category", "level", "confidenceScore"];
    const hasAny = allowed.some((key) => value[key] !== undefined);
    if (!hasAny) {
      throw new Error("At least one valid field is required for update");
    }
    return true;
  }),
  body("skillName").optional().trim().notEmpty().withMessage("skillName cannot be empty"),
  body("category")
    .optional()
    .isIn(["Technical", "HR", "Behavioral"])
    .withMessage("category must be one of Technical, HR, Behavioral"),
  body("level")
    .optional()
    .isIn(["Beginner", "Intermediate", "Advanced"])
    .withMessage("level must be one of Beginner, Intermediate, Advanced"),
  body("confidenceScore")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("confidenceScore must be between 1 and 5")
];

const taskCreateValidator = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("status")
    .optional()
    .isIn(["Pending", "In Progress", "Completed"])
    .withMessage("status must be one of Pending, In Progress, Completed"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("priority must be one of Low, Medium, High"),
  body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date")
];

const taskUpdateValidator = [
  param("id").isMongoId().withMessage("Invalid task id"),
  body().custom((value) => {
    const allowed = ["title", "description", "status", "priority", "dueDate"];
    const hasAny = allowed.some((key) => value[key] !== undefined);
    if (!hasAny) {
      throw new Error("At least one valid field is required for update");
    }
    return true;
  }),
  body("title").optional().trim().notEmpty().withMessage("title cannot be empty"),
  body("status")
    .optional()
    .isIn(["Pending", "In Progress", "Completed"])
    .withMessage("status must be one of Pending, In Progress, Completed"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("priority must be one of Low, Medium, High"),
  body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date")
];

const taskIdParamValidator = [param("id").isMongoId().withMessage("Invalid task id")];

const resumeProfileValidator = [
  body("profileId").optional({ checkFalsy: true }).isMongoId().withMessage("Valid profileId is required"),
  body("personalInfo.name").trim().notEmpty().withMessage("personalInfo.name is required"),
  body("personalInfo.email")
    .isEmail()
    .withMessage("personalInfo.email must be a valid email")
    .normalizeEmail(),
  body("templateKey").optional().isString().withMessage("templateKey must be a string"),
  body("targetJobRole").optional().isString().withMessage("targetJobRole must be a string")
];

const resumeGenerateValidator = [
  body("profileId").optional({ checkFalsy: true }).isMongoId().withMessage("Valid profileId is required"),
  body().custom((value, { req }) => {
    if (req.body?.profileId) {
      return true;
    }

    const name = req.body?.personalInfo?.name || req.body?.name;
    const email = req.body?.personalInfo?.email || req.body?.email;

    if (!String(name || "").trim() || !String(email || "").trim()) {
      throw new Error("Either profileId or personalInfo.name and personalInfo.email are required");
    }

    return true;
  })
];

const resumeAnalyzeValidator = [
  body("resumeId").optional({ checkFalsy: true }).isMongoId().withMessage("Valid resumeId is required"),
  body("jobDescription").trim().notEmpty().withMessage("jobDescription is required"),
  body().custom((value, { req }) => {
    const hasResumeText = Boolean(String(req.body?.resumeText || "").trim());
    const hasResumeId = Boolean(String(req.body?.resumeId || "").trim());
    const hasFile = Boolean(req.file);

    if (!hasResumeText && !hasResumeId && !hasFile) {
      throw new Error("Provide a resume PDF/text file, resume text, or resumeId");
    }

    return true;
  })
];

const aiGenerateValidator = [
  body("skill").optional().trim(),
  body("topic").optional().trim(),
  body("difficulty").optional().trim(),
  body("type").optional().trim(),
  body("count").optional().isInt({ min: 1, max: 20 })
];

const aiAnswerValidator = [
  body("questionId").trim().notEmpty().withMessage("questionId is required"),
  body("userAnswer").trim().notEmpty().withMessage("userAnswer is required")
];

module.exports = {
  registerValidator,
  loginValidator,
  skillCreateValidator,
  skillUpdateValidator,
  taskCreateValidator,
  taskUpdateValidator,
  taskIdParamValidator,
  resumeProfileValidator,
  resumeGenerateValidator,
  resumeAnalyzeValidator,
  recruiterRegisterValidator,
  recruiterLoginValidator,
  aiGenerateValidator,
  aiAnswerValidator
};
