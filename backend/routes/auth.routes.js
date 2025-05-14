const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registrationValidationRules, loginValidationRules, validate } = require('../middleware/validation.middleware'); // Added loginValidationRules
const { authLimiter } = require('../middleware/rateLimit.middleware');

// POST /api/auth/register
router.post('/register', authLimiter, registrationValidationRules(), validate, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidationRules(), validate, authController.login); // Added loginValidationRules and validate

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;