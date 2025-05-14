import { isAuthenticated } from '../services/auth.service.js';

/**
 * Checks if the user is authenticated.
 * If not, redirects to the login page.
 * @returns {boolean} True if authenticated, false otherwise (though redirection usually happens).
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        console.log('AuthGuard: User not authenticated. Redirecting to login.html');
        // Ensure 'login.html' is the correct path to your login page
        // relative to the current page in the browser's address bar.
        // If your pages are in the root of the frontend folder, 'login.html' is usually fine.
        window.location.href = 'login.html'; 
        return false; // Indicate that authentication failed and redirection is occurring
    }
    return true; // User is authenticated
}