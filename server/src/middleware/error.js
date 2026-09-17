import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) logger.error({ err, path: req.path }, "request failed");
  const message =
    status >= 500 ? "Something went wrong on the server." : err.message;
  res
    .status(status)
    .json({
      success: false,
      error: { code: err.code || "SERVER_ERROR", message },
    });
}

export function notFound(req, res) {
  throw new AppError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    "NOT_FOUND",
  );
}
