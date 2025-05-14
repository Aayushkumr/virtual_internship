const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { mentorshipRequestCreationValidationRules, mentorshipRequestUpdateValidationRules, validate } = require('../middleware/validation.middleware');

// POST /api/requests - Send a mentorship request
router.post('/', authMiddleware, mentorshipRequestCreationValidationRules(), validate, requestController.sendRequest);

// GET /api/requests - Get requests for the logged-in user (incoming and outgoing)
router.get('/', authMiddleware, requestController.getRequests);

// PATCH /api/requests/:requestId - Accept or decline a request
router.patch('/:requestId', authMiddleware, mentorshipRequestUpdateValidationRules(), validate, requestController.updateRequestStatus);

module.exports = router;