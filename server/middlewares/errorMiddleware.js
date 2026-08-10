export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || error.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : error.message,
    ...(process.env.NODE_ENV !== "production" && { error: error.message }),
  });
}
