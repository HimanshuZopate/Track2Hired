const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  resumeProfileValidator,
  resumeGenerateValidator,
  resumeAnalyzeValidator
} = require("../middleware/validators");
const {
  saveResumeProfile,
  generateResume,
  downloadResume,
  analyzeResumeATS
} = require("../controllers/resumeController");

router.use(protect);

router.post("/profile", resumeProfileValidator, validateRequest, saveResumeProfile);
router.post("/generate", resumeGenerateValidator, validateRequest, generateResume);
router.post("/analyze", resumeAnalyzeValidator, validateRequest, analyzeResumeATS);
router.get("/download/:id", downloadResume);

module.exports = router;