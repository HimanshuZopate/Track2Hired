const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const errorMessages = errors.array().map((err) => err.msg).join(", ");
  
  return res.status(400).json({
    success: false,
    data: null,
    message: `Validation failed: ${errorMessages}`
  });
};

module.exports = validateRequest;
