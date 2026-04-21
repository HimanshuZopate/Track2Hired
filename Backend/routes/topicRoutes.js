const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { searchTopics, getAllTopics } = require("../controllers/topicController");

router.use(protect);

router.get("/search", searchTopics);
router.get("/", getAllTopics);

module.exports = router;
