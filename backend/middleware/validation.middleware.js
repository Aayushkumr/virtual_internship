const { body, validationResult, param } = require('express-validator');

// Middleware to run validation checks and return errors if any
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(422).json({
    message: 'Validation failed',
    errors: extractedErrors,
  });
};

const registrationValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Must be a valid email address.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    // Add more rules as needed, e.g., password complexity
  ];
};

const loginValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Must be a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ];
};

const profileCreationValidationRules = () => {
  return [
    body('role').isIn(['mentor', 'mentee']).withMessage('Role must be either mentor or mentee.'),
    body('firstName').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters.'),
    body('lastName').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters.'),
    body('headline').optional().isString().trim().isLength({ max: 255 }).withMessage('Headline must be at most 255 characters.'),
    body('bio').optional().isString().trim(),
    body('skills').optional().isArray().withMessage('Skills must be an array of strings.'),
    body('skills.*').optional().isString().trim(),
    body('interests').optional().isArray().withMessage('Interests must be an array of strings.'),
    body('interests.*').optional().isString().trim(),
    body('linkedinUrl').optional().isURL().withMessage('LinkedIn URL must be a valid URL.'),
    body('githubUrl').optional().isURL().withMessage('GitHub URL must be a valid URL.'),
    body('profilePictureUrl').optional().isURL().withMessage('Profile picture URL must be a valid URL.'),
    body('availability').optional().isString().trim(),
  ];
};

const profileUpdateValidationRules = () => {
  return [
    param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer.'),
    // All fields are optional for update
    body('role').optional().isIn(['mentor', 'mentee']).withMessage('Role must be either mentor or mentee.'),
    body('firstName').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters.'),
    body('lastName').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters.'),
    body('headline').optional().isString().trim().isLength({ max: 255 }).withMessage('Headline must be at most 255 characters.'),
    body('bio').optional().isString().trim(),
    body('skills').optional().isArray().withMessage('Skills must be an array of strings.'),
    body('skills.*').optional().isString().trim(),
    body('interests').optional().isArray().withMessage('Interests must be an array of strings.'),
    body('interests.*').optional().isString().trim(),
    body('linkedinUrl').optional().isURL().withMessage('LinkedIn URL must be a valid URL.'),
    body('githubUrl').optional().isURL().withMessage('GitHub URL must be a valid URL.'),
    body('profilePictureUrl').optional().isURL().withMessage('Profile picture URL must be a valid URL.'),
    body('availability').optional().isString().trim(),
  ];
};

const mentorshipRequestCreationValidationRules = () => {
  return [
    body('receiverId')
      .isInt({ gt: 0 })
      .withMessage('Receiver ID must be a positive integer.'),
    // Optional: body('message').isString()...
  ];
};

const mentorshipRequestUpdateValidationRules = () => {
  return [
    param('requestId')
      .isInt({ gt: 0 })
      .withMessage('Request ID must be a positive integer.'),
    body('status')
      .isIn(['accepted', 'declined', 'completed', 'cancelled']) // Added 'completed', 'cancelled'
      .withMessage('Invalid status. Must be one of: accepted, declined, completed, cancelled.'),
  ];
};

module.exports = {
  validate,
  registrationValidationRules,
  loginValidationRules,
  profileCreationValidationRules,
  profileUpdateValidationRules,
  mentorshipRequestCreationValidationRules,
  mentorshipRequestUpdateValidationRules,
};