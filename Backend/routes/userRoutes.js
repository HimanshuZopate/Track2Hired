const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

router.get("/profile",protect, async(req, res) => {
    res.json(req.user);
})

router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
