const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { registerValidator, loginValidator } = require("../middleware/validators");
const { sendSuccess } = require("../utils/responseHandler");

router.get("/profile", protect, async (req, res) => {
    return sendSuccess(res, req.user, "Profile retrieved");
});

router.post("/register", registerValidator, validateRequest, registerUser);
router.post("/login", loginValidator, validateRequest, loginUser);

module.exports = router;
