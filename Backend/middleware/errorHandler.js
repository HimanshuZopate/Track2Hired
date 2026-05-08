const { errorHandler, notFoundHandler } = (() => {
  const errorHandler = (err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error("[ERROR]", {
      message: err?.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
      path: req.originalUrl,
      method: req.method
    });

    if (res.headersSent) {
      return next(err);
    }

    // ── MongoDB duplicate key error ───────────────────────────────────────
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        data: null,
        message: `Duplicate value for ${field}. This ${field} already exists.`
      });
    }

    // ── Mongoose validation error ─────────────────────────────────────────
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors || {}).map((e) => e.message).join(", ");
      return res.status(400).json({
        success: false,
        data: null,
        message: `Validation failed: ${messages}`
      });
    }

    // ── Mongoose CastError (invalid ObjectId, etc.) ───────────────────────
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid request data format"
      });
    }

    // ── Multer file upload errors ─────────────────────────────────────────
    if (err.name === "MulterError") {
      const multerMessages = {
        LIMIT_FILE_SIZE: "File is too large. Maximum size is 5MB.",
        LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
        LIMIT_FILE_COUNT: "Too many files uploaded.",
      };
      return res.status(400).json({
        success: false,
        data: null,
        message: multerMessages[err.code] || `File upload error: ${err.message}`
      });
    }

    // ── Payload too large ─────────────────────────────────────────────────
    if (err.type === "entity.too.large") {
      return res.status(413).json({
        success: false,
        data: null,
        message: "Request body is too large. Maximum size is 1MB."
      });
    }

    // ── CORS error ────────────────────────────────────────────────────────
    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Cross-origin request blocked"
      });
    }

    const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

    if (statusCode >= 500) {
      return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }

    return res.status(statusCode).json({ success: false, data: null, message: err.message || "Request failed" });
  };

  const notFoundHandler = (req, res) => {
    return res.status(404).json({ success: false, data: null, message: "Route not found" });
  };

  return { errorHandler, notFoundHandler };
})();

module.exports = {
  errorHandler,
  notFoundHandler
};
