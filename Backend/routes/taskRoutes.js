const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createTask,
  getUserTasks,
  updateTask,
  deleteTask,
  markTaskCompleted
} = require("../controllers/taskController");

router.use(protect);

router.route("/").post(createTask).get(getUserTasks);
router.route("/:id").put(updateTask).delete(deleteTask);
router.patch("/:id/complete", markTaskCompleted);

module.exports = router;