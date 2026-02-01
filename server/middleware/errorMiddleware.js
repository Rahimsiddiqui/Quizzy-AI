/**
 * Error Middleware
 * Handles 404 Not Found errors and global error responses.
 * Provides improved error handling for Mongoose validation and duplicate key errors.
 */

/**
 * Handle 404 errors for routes that do not exist.
 * Creates a new Error object with a 404 status and passes it to the global error handler.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler.
 * Formats validation errors, cast errors, and duplicate key errors into user-friendly messages.
 * Returns valid JSON error responses.
 *
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next function (unused)
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Check for Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    message = "Resource not found";
    statusCode = 404;
  }

  // Check for Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    statusCode = 400;
  }

  // Check for Mongoose duplicate key
  if (err.code === 11000) {
    message = "Duplicate field value entered";
    statusCode = 400;
  }

  res.status(statusCode);

  res.json({
    message: message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
