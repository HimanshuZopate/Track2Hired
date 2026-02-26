const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  saveResumeProfile,
  generateResume,
  downloadResume,
  analyzeResumeATS
} = require("../controllers/resumeController");

router.use(protect);

router.post("/profile", saveResumeProfile);
router.post("/generate", generateResume);
router.post("/analyze", analyzeResumeATS);
router.get("/download/:id", downloadResume);

module.exports = router;