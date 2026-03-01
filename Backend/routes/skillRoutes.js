const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { skillCreateValidator, skillUpdateValidator } = require("../middleware/validators");
const {
  addSkill,
  getUserSkills,
  updateSkill,
  deleteSkill
} = require("../controllers/skillController");

router.use(protect);

router.route("/").post(skillCreateValidator, validateRequest, addSkill).get(getUserSkills);
router.route("/:id").put(skillUpdateValidator, validateRequest, updateSkill).delete(deleteSkill);

module.exports = router;
