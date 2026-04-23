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
  analyzeResumeATS
} = require("../controllers/resumeController");

const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
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

module.exports = router;