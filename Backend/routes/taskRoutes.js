const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  taskCreateValidator,
  taskUpdateValidator,
  taskIdParamValidator
} = require("../middleware/validators");
const {
  createTask,
  getUserTasks,
  updateTask,
  deleteTask,
  markTaskCompleted
} = require("../controllers/taskController");

router.use(protect);

router.route("/").post(taskCreateValidator, validateRequest, createTask).get(getUserTasks);
router.route("/:id").put(taskUpdateValidator, validateRequest, updateTask).delete(taskIdParamValidator, validateRequest, deleteTask);
router.patch("/:id/complete", taskIdParamValidator, validateRequest, markTaskCompleted);

module.exports = router;