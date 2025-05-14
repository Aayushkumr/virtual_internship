import { API_BASE_URL, HEADERS } from './api.config.js';

/**
 * Registers a new user.
 * @param {object} userData - The user data for registration.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.password - The user's password.
 * @returns {Promise<object>} The server response.
 */
export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to register');
        }
        // Backend now returns accessToken and user object on successful registration
        if (data.accessToken && data.user) {
            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('userId', data.user.id.toString()); // Ensure userId is stored as string
            localStorage.setItem('userRole', data.user.role);
        }
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

/**
 * Logs in an existing user.
 * @param {object} credentials - The user credentials for login.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's password.
 * @returns {Promise<object>} The server response, including the auth token and user info.
 */
export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(credentials),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to login');
        }
        // Store token and user info upon successful login
        if (data.accessToken && data.user) {
            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('userId', data.user.id.toString()); // Ensure userId is stored as string
            localStorage.setItem('userRole', data.user.role);
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

/**
 * Logs out the current user by removing auth token and user info from localStorage.
 */
export const logoutUser = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    // Potentially also call a backend endpoint to invalidate the refresh token if implemented on backend
    console.log('User logged out, local storage cleared.');
    // Redirect to login page or home page
    // window.location.href = '/login.html'; // Or handle in UI logic
};

/**
 * Checks if a user is currently authenticated.
 * @returns {boolean} True if an authToken is found in localStorage, false otherwise.
 */
export const isAuthenticated = () => {
    const token = getToken();
    // You might have more sophisticated token validation here (e.g., check expiry)
    return !!token; // Returns true if token exists, false otherwise
};

/**
 * Gets the current logged-in user's ID.
 * @returns {string|null} The user ID or null if not found.
 */
export const getCurrentUserId = () => {
    return localStorage.getItem('userId');
};

/**
 * Gets the current logged-in user's role.
 * @returns {string|null} The user role or null if not found.
 */
export const getCurrentUserRole = () => {
    return localStorage.getItem('userRole');
};

/**
 * Gets the current auth token.
 * @returns {string|null} The auth token or null if not found.
 */
export const getToken = () => {
    return localStorage.getItem('authToken');
};
