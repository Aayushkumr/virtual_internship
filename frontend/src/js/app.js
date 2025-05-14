import { isAuthenticated, logoutUser, getCurrentUserId } from './services/auth.service.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('App.js loaded, DOM fully parsed and loaded.');

    const setActiveNavLink = () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Default to index.html if path is '/'
        const navLinks = document.querySelectorAll('header nav ul li a');

        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    };

    const updateNavigation = () => {
        const navUl = document.querySelector('header nav ul'); // Assuming your nav links are in a <ul>
        if (!navUl) {
            console.error('Navigation UL element not found.');
            return;
        }

        const loggedIn = isAuthenticated();
        let navItemsHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="profiles.html">Find a Mentor</a></li>
        `;

        if (loggedIn) {
            const userId = getCurrentUserId(); // For the "My Profile" link
            navItemsHTML += `
                <li><a href="dashboard.html">Dashboard</a></li>
                <li><a href="profile.html?userId=${userId}" id="nav-my-profile">My Profile</a></li>
                <li><a href="#" id="nav-logout">Logout</a></li>
            `;
        } else {
            navItemsHTML += `
                <li><a href="login.html">Login</a></li>
                <li><a href="register.html">Register</a></li>
            `;
        }
        navUl.innerHTML = navItemsHTML;

        if (loggedIn) {
            const logoutLink = document.getElementById('nav-logout');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    logoutUser(); // Clears localStorage
                    window.location.href = 'login.html'; // Redirect to login
                });
            }
        }
        setActiveNavLink(); // Re-apply active class after updating nav
    };

    // Initial setup
    updateNavigation();

    // Expose functions to global scope if needed by other scripts, or use as ES module exports
    window.app = {
        updateNavigation,
        requireAuth: (redirectUrl = 'login.html') => {
            if (!isAuthenticated()) {
                window.location.href = redirectUrl;
                return false; // Not authenticated
            }
            return true; // Authenticated
        },
        redirectIfAuth: (redirectUrl = 'dashboard.html') => {
            if (isAuthenticated()) {
                window.location.href = redirectUrl;
                return true; // Is authenticated, redirected
            }
            return false; // Not authenticated, no redirect
        }
    };
});
