const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Future-ready role support (student/recruiter/admin).
    // For now, active flows use student users, so role defaults safely.
    req.userRole = decoded.role || req.user.role || "student";

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Role-based gate for future recruiter/admin modules.
// Not enforced anywhere yet unless specifically wired in routes.
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const currentRole = req.userRole || req.user?.role || "student";

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient role permissions" });
    }

    return next();
  };
};

module.exports = protect;
module.exports.authorizeRoles = authorizeRoles;
