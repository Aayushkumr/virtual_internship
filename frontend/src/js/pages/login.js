import { loginUser } from '../services/auth.service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if already logged in
    if (window.app && window.app.redirectIfAuth) {
        window.app.redirectIfAuth('dashboard.html');
    }

    const loginForm = document.getElementById('login-form');
    const errorMessageElement = document.getElementById('login-error-message'); // Assuming you have an element with this ID

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (errorMessageElement) errorMessageElement.textContent = ''; // Clear previous errors

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                if (errorMessageElement) {
                    errorMessageElement.textContent = 'Please enter both email and password.';
                } else {
                    alert('Please enter both email and password.');
                }
                return;
            }

            try {
                const data = await loginUser({ email, password });
                console.log('Login successful:', data);
                // auth.service.loginUser now stores token, userId, userRole.
                // app.js will update navigation on the next page load.
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Login failed:', error);
                if (errorMessageElement) {
                    errorMessageElement.textContent = error.message || 'Login failed. Please check your credentials.';
                } else {
                    alert(error.message || 'Login failed. Please check your credentials.');
                }
            }
        });
    }
});
