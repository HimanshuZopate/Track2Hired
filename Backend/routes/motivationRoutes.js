const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getMotivation } = require("../controllers/suggestionController");

router.use(protect);

router.get("/", getMotivation);

module.exports = router;