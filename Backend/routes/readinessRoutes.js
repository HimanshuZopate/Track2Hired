const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getUserReadiness } = require("../controllers/readinessController");

router.use(protect);

router.get("/", getUserReadiness);

module.exports = router;
