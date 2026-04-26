const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const { sendError } = require("../utils/responseHandler");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, "No token provided", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Backward compatibility: older tokens may not include role.
    // Default to student role for legacy student tokens.
    const resolvedRole = decoded.role || "student";
    const model = resolvedRole === "recruiter" ? Recruiter : User;

    req.user = await model.findById(decoded.id).select("-password");

    if (!req.user) {
      return sendError(res, "User not found", 401);
    }

    req.userRole = req.user.role || resolvedRole || "student";

    next();
  } catch (error) {
    return sendError(res, "Not authorized, token failed", 401);
  }
};

// Role-based gate for future recruiter/admin modules.
// Not enforced anywhere yet unless specifically wired in routes.
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const currentRole = req.userRole || req.user?.role || "student";

    if (!allowedRoles.includes(currentRole)) {
      return sendError(res, "Forbidden: insufficient role permissions", 403);
    }

    return next();
  };
};

module.exports = protect;
module.exports.authorizeRoles = authorizeRoles;
