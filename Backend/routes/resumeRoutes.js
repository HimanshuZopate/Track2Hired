const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  resumeProfileValidator,
  resumeGenerateValidator,
  resumeAnalyzeValidator
} = require("../middleware/validators");
const {
  getResumeTemplates,
  getLatestResumeWorkspace,
  saveResumeProfile,
  generateResume,
  downloadResume,
  analyzeResumeATS,
  getAtsHistory,
  getAtsHistoryById
} = require("../controllers/resumeController");

const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// SECURITY: Only accept PDF and plain text files for resume analysis
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["application/pdf", "text/plain"];
  const allowedExts = [".pdf", ".txt"];
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    return cb(null, true);
  }
  return cb(new Error("Only PDF and TXT files are accepted for resume analysis"), false);
};

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024   // 5MB max
  },
  fileFilter
});

const normalizeUploadedResume = (req, res, next) => {
  const uploadedFile = req.files?.resumeFile?.[0] || req.files?.resume?.[0] || null;
  req.file = uploadedFile;
  return next();
};

router.use(protect);

router.get("/templates", getResumeTemplates);
router.get("/workspace", getLatestResumeWorkspace);
router.post("/profile", resumeProfileValidator, validateRequest, saveResumeProfile);
router.post("/generate", resumeGenerateValidator, validateRequest, generateResume);
router.post(
  "/analyze",
  upload.fields([
    { name: "resumeFile", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]),
  normalizeUploadedResume,
  resumeAnalyzeValidator,
  validateRequest,
  analyzeResumeATS
);
router.get("/download/:id", downloadResume);

// ATS history routes (were defined in controller but never mounted)
router.get("/history", getAtsHistory);
router.get("/history/:id", getAtsHistoryById);

module.exports = router;