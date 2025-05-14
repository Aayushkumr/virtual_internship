import { browseProfiles } from '../services/profile.service.js';
import { sendMentorshipRequest } from '../services/request.service.js';
import { getCurrentUserId } from '../services/auth.service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Protect this page
    if (!window.app || !window.app.requireAuth || !window.app.requireAuth()) {
        console.warn('Authentication required, redirecting to login.');
        return; // requireAuth will redirect
    }

    const currentUserId = getCurrentUserId(); // To prevent connecting with oneself

    const profilesListContainer = document.getElementById('profiles-list-container'); // Changed from 'profiles-list' to a more generic container
    const messageElement = document.getElementById('profiles-message'); // For general messages/errors

    // Filter controls
    const roleFilterSelect = document.getElementById('filter-role'); // Assuming a select for role
    const skillsFilterInput = document.getElementById('filter-skills'); // Assuming an input for skills
    const interestsFilterInput = document.getElementById('filter-interests'); // Assuming an input for interests
    const applyFiltersButton = document.getElementById('apply-filters-btn');

    // Pagination controls
    const prevPageButton = document.getElementById('prev-page-btn');
    const nextPageButton = document.getElementById('next-page-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');

    let currentPage = 1;
    const limit = 10; // Profiles per page
    let currentFilters = {}; // To store current filter values

    const displayMessage = (message, isError = false) => {
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = isError ? 'error-message' : 'success-message';
            messageElement.style.display = 'block';
            if (!isError) setTimeout(() => { messageElement.style.display = 'none'; }, 3000);
        } else {
            isError ? console.error(message) : console.log(message);
        }
    };

    const renderProfileCard = (profile) => {
        const card = document.createElement('div');
        card.className = 'profile-card'; // Add a class for styling

        // Basic profile info
        card.innerHTML = `
            <h3>${profile.first_name || ''} ${profile.last_name || 'User'} (${profile.role || 'N/A'})</h3>
            <p><strong>Email:</strong> ${profile.email || 'N/A'}</p>
            <p><strong>Headline:</strong> ${profile.headline || 'N/A'}</p>
            <p><strong>Skills:</strong> ${profile.skills && profile.skills.length > 0 ? profile.skills.join(', ') : 'N/A'}</p>
            <p><strong>Interests:</strong> ${profile.interests && profile.interests.length > 0 ? profile.interests.join(', ') : 'N/A'}</p>
            <p><strong>Availability:</strong> ${profile.availability || 'N/A'}</p>
        `;

        // "Connect" button if the profile is not the current user's
        if (profile.user_id.toString() !== currentUserId) {
            const connectButton = document.createElement('button');
            connectButton.textContent = 'Send Mentorship Request';
            connectButton.className = 'cta-button connect-btn';
            connectButton.dataset.mentorId = profile.user_id;
            connectButton.addEventListener('click', async (e) => {
                const mentorId = e.target.dataset.mentorId;
                // Optional: Prompt for a message
                // const message = prompt("Enter an optional message for your request:");
                try {
                    await sendMentorshipRequest(mentorId /*, message */);
                    displayMessage('Mentorship request sent successfully!', false);
                } catch (error) {
                    displayMessage(`Failed to send request: ${error.message || 'Unknown error'}.`, true);
                }
            });
            card.appendChild(connectButton);
        }
        return card;
    };

    const loadProfiles = async (page = 1, filters = {}) => {
        if (!profilesListContainer) {
            console.error('Profiles list container not found.');
            return;
        }
        profilesListContainer.innerHTML = '<p>Loading profiles...</p>'; // Loading state
        if (messageElement) messageElement.style.display = 'none';

        currentFilters = filters; // Store filters for pagination
        currentPage = page;

        try {
            const data = await browseProfiles({ ...filters, page, limit });
            // data = { profiles: [], currentPage: 1, totalPages: 1, totalProfiles: 0 }

            profilesListContainer.innerHTML = ''; // Clear loading/previous profiles

            if (data.profiles && data.profiles.length > 0) {
                data.profiles.forEach(profile => {
                    const profileCard = renderProfileCard(profile);
                    profilesListContainer.appendChild(profileCard);
                });
            } else {
                profilesListContainer.innerHTML = '<p>No profiles found matching your criteria.</p>';
            }

            // Update pagination display
            if (currentPageSpan) currentPageSpan.textContent = data.currentPage;
            if (totalPagesSpan) totalPagesSpan.textContent = data.totalPages;

            if (prevPageButton) prevPageButton.disabled = data.currentPage <= 1;
            if (nextPageButton) nextPageButton.disabled = data.currentPage >= data.totalPages;

        } catch (error) {
            console.error('Error fetching profiles:', error);
            profilesListContainer.innerHTML = `<p class="error-message">Failed to load profiles: ${error.message || 'Unknown error'}. Please try again.</p>`;
            if (prevPageButton) prevPageButton.disabled = true;
            if (nextPageButton) nextPageButton.disabled = true;
        }
    };

    // Event Listeners for Filters
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            const filters = {
                role: roleFilterSelect ? roleFilterSelect.value : undefined,
                skills: skillsFilterInput ? skillsFilterInput.value.split(',').map(s => s.trim()).filter(s => s) : [],
                interests: interestsFilterInput ? interestsFilterInput.value.split(',').map(i => i.trim()).filter(i => i) : [],
            };
            // Remove empty filters
            Object.keys(filters).forEach(key => {
                if (!filters[key] || (Array.isArray(filters[key]) && filters[key].length === 0)) {
                    delete filters[key];
                }
            });
            loadProfiles(1, filters); // Load first page with new filters
        });
    }

    // Event Listeners for Pagination
    if (prevPageButton) {
        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                loadProfiles(currentPage - 1, currentFilters);
            }
        });
    }
    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => {
            // Check against totalPages which should be updated by loadProfiles
            loadProfiles(currentPage + 1, currentFilters);
        });
    }

    // Initial load
    loadProfiles(currentPage, currentFilters);
});