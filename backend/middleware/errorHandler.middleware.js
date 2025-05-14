// Centralized error handling middleware
// This middleware will catch any errors passed via next(error)
// or unhandled errors in route handlers.

// eslint-disable-next-line no-unused-vars
module.exports = (error, req, res, next) => {
  console.error('Error caught by error handler:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Specific error handling (examples)
  if (error.name === 'SequelizeValidationError') { // Example for ORM validation errors
    return res.status(400).json({
      message: 'Validation Error',
      errors: error.errors.map(e => e.message),
    });
  }

  if (error.name === 'UnauthorizedError') { // Example for JWT auth errors not caught by authMiddleware
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Generic error response
  res.status(statusCode).json({
    message: message,
    // stack: process.env.NODE_ENV === 'development' ? error.stack : undefined, // Optionally include stack in dev
  });
};