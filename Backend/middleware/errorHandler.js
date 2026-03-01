const errorHandler = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error("[ERROR]", {
    message: err?.message,
    stack: err?.stack,
    path: req.originalUrl,
    method: req.method
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  if (statusCode >= 500) {
    return res.status(500).json({ message: "Internal server error" });
  }

  return res.status(statusCode).json({ message: err.message || "Request failed" });
};

const notFoundHandler = (req, res) => {
  return res.status(404).json({ message: "Route not found" });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
