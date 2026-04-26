const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, "All fields are required", 400);
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return sendError(res, "User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = generateToken(user._id, user.role || "student");

    return sendSuccess(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    }, "Registration successful", 201);

  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};


// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, "Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, "Invalid credentials", 401);
    }

    const token = generateToken(user._id, user.role || "student");

    return sendSuccess(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    }, "Login successful", 200);

  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};


// ================= TOKEN GENERATOR =================
const generateToken = (id, role = "student") => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
