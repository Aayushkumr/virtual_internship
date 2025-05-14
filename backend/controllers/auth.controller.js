const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET } = require('../config');

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Validation is now handled by registrationValidationRules middleware

    const user = await User.create(email, password);
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'User registered successfully.',
      accessToken,
      user: { // Consistent user object
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Validation is now handled by loginValidationRules middleware

    const user = await User.findByEmail(email);
    if (!user) {
      // Use a generic message to avoid disclosing whether an email exists
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await User.comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Logged in successfully.',
      accessToken,
      user: { // Consistent user object
        id: user.id,
        email: user.email,
        role: user.role,
        // created_at: user.created_at, // Optionally include, or keep minimal
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Clear the refresh token cookie
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Set expiry to a past date
    });
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: 'Refresh token not found.' });
  }

  try {
    const decoded = jwt.verify(incomingRefreshToken, JWT_REFRESH_SECRET);
    const userId = decoded.userId;

    // Optionally: Check if refresh token is revoked or user still exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token: User not found.' });
    }

    // Generate new tokens (implementing refresh token rotation)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken,
      message: 'Tokens refreshed successfully.'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      // Clear the potentially compromised/invalid refresh token cookie
      res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
      });
      return res.status(403).json({ message: 'Invalid or expired refresh token. Please log in again.' });
    }
    next(error);
  }
};