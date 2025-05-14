const rateLimit = require('express-rate-limit');

// Rate limiter for general API requests (can be adjusted)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login/register attempts per windowMs
  userAttribute: 'body.email', // Use email to track attempts if available, otherwise IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Do not count successful authentication attempts towards the limit
});

module.exports = {
  generalLimiter,
  authLimiter,
};