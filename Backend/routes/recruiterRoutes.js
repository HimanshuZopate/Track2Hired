const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { recruiterRegisterValidator, recruiterLoginValidator } = require("../middleware/validators");
const {
  registerRecruiter,
  loginRecruiter,
  createJobPosting,
  getCandidates,
  generateSnapshot,
  getCandidateMatches,
  shortlist
} = require("../controllers/recruiterController");

/**
 * FUTURE MODULE ROUTES
 * - These routes are intended for recruiter workflows.
 * - They are mounted only when ENABLE_RECRUITER_MODULE=true.
 * - Even when mounted, controller-level feature guard keeps them safely disabled by default.
 */

router.post("/register", recruiterRegisterValidator, validateRequest, registerRecruiter);
router.post("/login", recruiterLoginValidator, validateRequest, loginRecruiter);

router.use(protect);
router.use(authorizeRoles("recruiter", "admin"));

router.post("/jobs", createJobPosting);
router.get("/candidates", getCandidates);
router.post("/candidates/snapshot/:userId", generateSnapshot);
router.get("/candidates/match/:jobId", getCandidateMatches);
router.post("/shortlist", shortlist);

module.exports = router;
