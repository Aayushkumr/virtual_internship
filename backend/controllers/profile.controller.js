const Profile = require('../models/Profile.model');
// const User = require('../models/User.model'); // Not strictly needed here if Profile model handles FK errors

exports.browseProfiles = async (req, res, next) => {
  try {
    const { role, skills, interests, page, limit } = req.query;
    const filters = {
      role,
      skills: skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [], // Filter out empty strings
      interests: interests ? interests.split(',').map(i => i.trim()).filter(i => i) : [], // Filter out empty strings
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };

    const results = await Profile.findAll(filters); // Model now returns { profiles, currentPage, totalPages, totalProfiles }
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findByUserId(userId);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

exports.createProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From authMiddleware
    // All validated fields are in req.body
    const profileData = req.body;

    // Check if user already has a profile (Model also has a unique constraint on user_id)
    const existingProfile = await Profile.findByUserId(userId);
    if (existingProfile) {
      return res.status(409).json({ message: 'Profile already exists for this user. Use PUT to update.' });
    }

    const newProfile = await Profile.create(userId, profileData);
    res.status(201).json({
      message: 'Profile created successfully.',
      profile: newProfile,
    });
  } catch (error) {
    // The model handles unique constraint errors (e.g., profile already exists)
    // and foreign key errors (user not found)
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id; // From authMiddleware
    const userIdToUpdate = parseInt(req.params.userId, 10);

    if (loggedInUserId !== userIdToUpdate) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }

    // All validated fields to update are in req.body
    const profileUpdates = req.body;

    // Check if the profile exists before attempting to update
    const existingProfile = await Profile.findByUserId(userIdToUpdate);
    if (!existingProfile) {
      return res.status(404).json({ message: 'Profile not found to update.' });
    }

    // The model's updateByUserId will only update fields present in profileUpdates
    const updatedProfile = await Profile.updateByUserId(userIdToUpdate, profileUpdates);

    res.status(200).json({
      message: 'Profile updated successfully.',
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id;
    const userIdToDelete = parseInt(req.params.userId, 10);

    if (loggedInUserId !== userIdToDelete) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own profile.' });
    }

    const profileExists = await Profile.findByUserId(userIdToDelete);
    if (!profileExists) {
      return res.status(404).json({ message: 'Profile not found to delete.' });
    }

    const wasDeleted = await Profile.deleteByUserId(userIdToDelete);
    if (!wasDeleted) {
      // This case should ideally not be hit if profileExists check passed,
      // but good for robustness.
      return res.status(404).json({ message: 'Profile not found or could not be deleted.' });
    }

    res.status(200).json({ message: 'Profile deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
