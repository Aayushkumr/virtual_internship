const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { profileCreationValidationRules, profileUpdateValidationRules, validate } = require('../middleware/validation.middleware');

// GET /api/profiles - Browse profiles (with filters)
router.get('/', authMiddleware, profileController.browseProfiles);

// GET /api/profiles/:userId - Get a specific user's profile
router.get('/:userId', authMiddleware, profileController.getProfile);

// POST /api/profiles - Create a new profile for the logged-in user
router.post('/', authMiddleware, profileCreationValidationRules(), validate, profileController.createProfile);

// PUT /api/profiles/:userId - Update the logged-in user's own profile
router.put('/:userId', authMiddleware, profileUpdateValidationRules(), validate, profileController.updateProfile);

// DELETE /api/profiles/:userId - Delete the logged-in user's own profile
router.delete('/:userId', authMiddleware, profileController.deleteProfile);

module.exports = router;