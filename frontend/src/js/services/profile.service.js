import { API_BASE_URL, getAuthHeaders } from './api.config.js';

/**
 * Browse profiles with optional filters and pagination.
 * @param {object} filters - Optional filters.
 * @param {string} [filters.role] - Filter by role ('mentor', 'mentee').
 * @param {string[]} [filters.skills] - Filter by skills (array of strings).
 * @param {string[]} [filters.interests] - Filter by interests (array of strings).
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of profiles per page.
 * @returns {Promise<object>} The server response including profiles and pagination info.
 */
export const browseProfiles = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.skills && filters.skills.length > 0) params.append('skills', filters.skills.join(','));
  if (filters.interests && filters.interests.length > 0) params.append('interests', filters.interests.join(','));
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/profiles?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch profiles');
    return data; // Backend returns { profiles, currentPage, totalPages, totalProfiles }
  } catch (error) {
    console.error('Browse profiles error:', error);
    throw error;
  }
};

/**
 * Get a specific profile by user ID.
 * @param {string|number} userId - The ID of the user whose profile to fetch.
 * @returns {Promise<object>} The profile data.
 */
export const getProfileByUserId = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
    return data;
  } catch (error) {
    console.error('Get profile by ID error:', error);
    throw error;
  }
};

/**
 * Create a profile for the currently authenticated user.
 * @param {object} profileData - The profile data.
 * @returns {Promise<object>} The created profile data.
 */
export const createProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles`, {
      method: 'POST',
      headers: getAuthHeaders(), // getAuthHeaders includes Content-Type
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create profile');
    return data;
  } catch (error) {
    console.error('Create profile error:', error);
    throw error;
  }
};

/**
 * Update a profile by user ID (typically the authenticated user's profile).
 * @param {string|number} userId - The ID of the user whose profile to update.
 * @param {object} profileData - The profile data to update.
 * @returns {Promise<object>} The updated profile data.
 */
export const updateProfile = async (userId, profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update profile');
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Delete a profile by user ID (typically the authenticated user's profile).
 * @param {string|number} userId - The ID of the user whose profile to delete.
 * @returns {Promise<object>} The server response.
 */
export const deleteProfile = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json(); // Or response.text() if backend sends no body on success
    if (!response.ok) throw new Error(data.message || 'Failed to delete profile');
    return data; // Contains { message: 'Profile deleted successfully.' }
  } catch (error) {
    console.error('Delete profile error:', error);
    throw error;
  }
};