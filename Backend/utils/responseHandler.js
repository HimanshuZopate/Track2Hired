/**
 * Standardized API Response Handlers
 */

exports.sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data: data || {},
    message
  });
};

exports.sendError = (res, message = "Something went wrong", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message
  });
};
