const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  addSkill,
  getUserSkills,
  updateSkill,
  deleteSkill
} = require("../controllers/skillController");

router.use(protect);

router.route("/").post(addSkill).get(getUserSkills);
router.route("/:id").put(updateSkill).delete(deleteSkill);

module.exports = router;
