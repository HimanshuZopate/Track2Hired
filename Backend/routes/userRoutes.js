const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { registerValidator, loginValidator } = require("../middleware/validators");

router.get("/profile",protect, async(req, res) => {
    res.json(req.user);
})

router.post("/register", registerValidator, validateRequest, registerUser);
router.post("/login", loginValidator, validateRequest, loginUser);

module.exports = router;
