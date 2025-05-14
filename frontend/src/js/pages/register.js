import { registerUser } from '../services/auth.service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if already logged in
    if (window.app && window.app.redirectIfAuth) {
        window.app.redirectIfAuth('dashboard.html');
    }

    const registerForm = document.getElementById('register-form');
    const errorMessageElement = document.getElementById('register-error-message'); // Assuming you have an element with this ID

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (errorMessageElement) errorMessageElement.textContent = ''; // Clear previous errors

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            // Optional: Add a role selection field in the form if users can choose at registration
            // const role = document.getElementById('role').value; // Example

            if (!email || !password || !confirmPassword) {
                const msg = 'Please fill in all fields.';
                if (errorMessageElement) errorMessageElement.textContent = msg; else alert(msg);
                return;
            }

            if (password !== confirmPassword) {
                const msg = 'Passwords do not match.';
                if (errorMessageElement) errorMessageElement.textContent = msg; else alert(msg);
                return;
            }

            // Basic password strength check (example: min length already handled by backend validation)
            if (password.length < 6) {
                 const msg = 'Password must be at least 6 characters long.';
                 if (errorMessageElement) errorMessageElement.textContent = msg; else alert(msg);
                 return;
            }

            try {
                // If you add role selection on the frontend:
                // const data = await registerUser({ email, password, role });
                const data = await registerUser({ email, password }); // Default role 'mentee' is set by backend if not provided
                console.log('Registration successful:', data);
                // auth.service.registerUser now stores token, userId, userRole.
                // Redirect to dashboard for auto-login experience
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Registration failed:', error);
                if (errorMessageElement) {
                    errorMessageElement.textContent = error.message || 'Registration failed. Please try again.';
                } else {
                    alert(error.message || 'Registration failed. Please try again.');
                }
            }
        });
    }
});
