const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getTodaySuggestion } = require("../controllers/suggestionController");

router.use(protect);

router.get("/today", getTodaySuggestion);

module.exports = router;