import { getProfileByUserId, updateProfile, createProfile, deleteProfile } from '../services/profile.service.js'; // Corrected import
import { getCurrentUserId } from '../services/auth.service.js';
import { requireAuth } from '../utils/authGuard.js'; // Import requireAuth

document.addEventListener('DOMContentLoaded', () => {
    // Protect this page
    if (!requireAuth()) { // Use imported requireAuth
        console.warn('Profile.js: Authentication required, redirection should have occurred via authGuard.');
        // authGuard should handle the redirection. If it doesn't, this return prevents further script execution.
        return;
    }

    const loggedInUserId = getCurrentUserId();
    if (!loggedInUserId) {
        console.error('Profile.js: Logged-in User ID not found. Cannot load profile page.');
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.innerHTML = '<p class="error-message" style="text-align:center; padding:20px;">Could not load profile. User information is missing. Please try logging in again.</p>';
        return;
    }

    // This page always operates on the logged-in user's profile
    const profileUserId = loggedInUserId;

    const profileViewSectionContainer = document.getElementById('profile-view'); // Container for view details and buttons
    const profileViewDetailsElement = document.getElementById('profile-view-details');
    const profileEditSection = document.getElementById('profile-edit-form-section');
    const profileForm = document.getElementById('profile-edit-form');

    const generalMessageElement = document.getElementById('profile-general-message');
    const formErrorMessageElement = document.getElementById('profile-form-error-message');

    // Form input elements
    const firstNameInput = document.getElementById('profile-first-name');
    const lastNameInput = document.getElementById('profile-last-name');
    const roleSelect = document.getElementById('profile-role');
    const headlineInput = document.getElementById('profile-headline');
    const bioTextarea = document.getElementById('profile-bio');
    const skillsInput = document.getElementById('profile-skills');
    const interestsInput = document.getElementById('profile-interests');
    const linkedinInput = document.getElementById('profile-linkedin');
    const githubInput = document.getElementById('profile-github');
    const availabilityInput = document.getElementById('profile-availability');

    const editProfileButton = document.getElementById('edit-profile-btn');
    const deleteProfileButton = document.getElementById('delete-profile-btn');
    const cancelEditButton = document.getElementById('cancel-edit-btn');


    let currentProfileData = null;
    let isCreatingNewProfile = false;

    const displayMessage = (element, message, isError = false) => {
        if (element) {
            element.textContent = message;
            element.className = isError ? 'message error' : 'message success'; // Use general message classes
            element.style.color = isError ? 'red' : 'green'; // Simple color
            element.style.display = 'block';
            element.style.padding = '10px';
            element.style.marginBottom = '15px';
            element.style.border = `1px solid ${isError ? 'red' : 'green'}`;
            element.style.borderRadius = '4px';


            if (!isError) {
                setTimeout(() => {
                    element.style.display = 'none';
                    element.textContent = '';
                }, 4000);
            }
        } else {
            isError ? console.error(message) : console.log(message);
        }
    };

    const clearMessages = () => {
        if (generalMessageElement) {
            generalMessageElement.style.display = 'none';
            generalMessageElement.textContent = '';
        }
        if (formErrorMessageElement) {
            formErrorMessageElement.style.display = 'none';
            formErrorMessageElement.textContent = '';
        }
    };

    const renderProfileView = (profile) => {
        if (!profileViewDetailsElement) {
            console.error("profile-view-details element not found");
            return;
        }
        // Assuming profile object contains user's email from a join or separate fetch if needed
        // For now, let's assume email is not directly on the profile object from profileService
        // It's usually better to keep profile specific data in the Profiles table.
        // If email is needed, it should be added to the profile data by the backend.

        profileViewDetailsElement.innerHTML = `
            <p><strong>Name:</strong> ${profile.first_name || ''} ${profile.last_name || ''}</p>
            <!-- <p><strong>Email:</strong> ${profile.email || 'N/A'}</p> -->
            <p><strong>Role:</strong> ${profile.role || 'N/A'}</p>
            <p><strong>Headline:</strong> ${profile.headline || 'N/A'}</p>
            <p><strong>Bio:</strong> ${profile.bio || 'N/A'}</p>
            <p><strong>Skills:</strong> ${profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? profile.skills.join(', ') : 'N/A'}</p>
            <p><strong>Interests:</strong> ${profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 ? profile.interests.join(', ') : 'N/A'}</p>
            <p><strong>LinkedIn:</strong> ${profile.linkedin_url ? `<a href="${profile.linkedin_url}" target="_blank" rel="noopener noreferrer">${profile.linkedin_url}</a>` : 'N/A'}</p>
            <p><strong>GitHub:</strong> ${profile.github_url ? `<a href="${profile.github_url}" target="_blank" rel="noopener noreferrer">${profile.github_url}</a>` : 'N/A'}</p>
            <p><strong>Availability:</strong> ${profile.availability || 'N/A'}</p>
        `;
    };

    const populateForm = (profile) => {
        if (!profileForm) return;
        if (firstNameInput) firstNameInput.value = profile.first_name || '';
        if (lastNameInput) lastNameInput.value = profile.last_name || '';
        if (roleSelect) roleSelect.value = profile.role || 'mentee';
        if (headlineInput) headlineInput.value = profile.headline || '';
        if (bioTextarea) bioTextarea.value = profile.bio || '';
        if (skillsInput) skillsInput.value = profile.skills && Array.isArray(profile.skills) ? profile.skills.join(', ') : '';
        if (interestsInput) interestsInput.value = profile.interests && Array.isArray(profile.interests) ? profile.interests.join(', ') : '';
        if (linkedinInput) linkedinInput.value = profile.linkedin_url || '';
        if (githubInput) githubInput.value = profile.github_url || '';
        if (availabilityInput) availabilityInput.value = profile.availability || '';
    };

    const toggleMode = (editMode) => {
        clearMessages();
        if (profileViewSectionContainer) profileViewSectionContainer.style.display = editMode ? 'none' : 'block';
        // The edit and delete buttons are inside profileViewSectionContainer, so they'll be hidden with it.
        // No need to toggle them separately if they are children.
        // if (editProfileButton) editProfileButton.style.display = editMode ? 'none' : 'block';
        // if (deleteProfileButton) deleteProfileButton.style.display = editMode ? 'none' : 'block';

        if (profileEditSection) profileEditSection.style.display = editMode ? 'block' : 'none';

        if (editMode) {
            populateForm(currentProfileData || {}); // Populate with current or empty if creating
        }
    };

    const loadProfile = async () => {
        if (!profileViewDetailsElement) {
             console.error("Cannot load profile: profile-view-details element is missing.");
             return;
        }
        profileViewDetailsElement.innerHTML = '<p>Loading profile...</p>'; // Set loading message
        try {
            clearMessages();
            const profile = await getProfileByUserId(profileUserId); // Corrected function call
            currentProfileData = profile;
            isCreatingNewProfile = false;
            renderProfileView(profile);
            toggleMode(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            currentProfileData = {}; // Reset
            isCreatingNewProfile = true; // Assume creation if load fails (e.g. 404)
            populateForm({}); // Clear form for new profile
            toggleMode(true); // Switch to edit mode to create
            if (error.response && error.response.status === 404) {
                 displayMessage(generalMessageElement, 'No profile found. Please create your profile.', false);
            } else {
                displayMessage(generalMessageElement, `Failed to load profile: ${error.message || 'Unknown error'}. Please try again or create a new profile.`, true);
            }
        }
    };

    if (profileForm) {
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearMessages();

            // Basic frontend validation (example)
            if (firstNameInput && !firstNameInput.value.trim()) {
                displayMessage(formErrorMessageElement, 'First name is required.', true);
                return;
            }
            if (roleSelect && !roleSelect.value) {
                displayMessage(formErrorMessageElement, 'Role is required.', true);
                return;
            }

            const profileDataPayload = {
                // user_id is not sent; backend uses authenticated user's ID
                firstName: firstNameInput ? firstNameInput.value.trim() : undefined, // Ensure this is camelCase if backend expects it
                lastName: lastNameInput ? lastNameInput.value.trim() : undefined,   // Ensure this is camelCase if backend expects it
                role: roleSelect ? roleSelect.value : 'mentee',
                headline: headlineInput ? headlineInput.value.trim() : undefined,
                bio: bioTextarea ? bioTextarea.value.trim() : undefined,
                // Ensure skills and interests are arrays of strings
                skills: skillsInput ? skillsInput.value.split(',').map(s => s.trim()).filter(s => s) : [],
                interests: interestsInput ? interestsInput.value.split(',').map(i => i.trim()).filter(i => i) : [],
                linkedinUrl: linkedinInput ? (linkedinInput.value.trim() || null) : null, // CHANGED to camelCase
                githubUrl: githubInput ? (githubInput.value.trim() || null) : null,     // CHANGED to camelCase
                availability: availabilityInput ? availabilityInput.value.trim() : undefined,
            };
            
            // Remove undefined properties, backend should handle missing optional fields
            Object.keys(profileDataPayload).forEach(key => {
                if (profileDataPayload[key] === undefined) {
                    delete profileDataPayload[key];
                }
            });

            try {
                let response;
                const submitButton = profileForm.querySelector('button[type="submit"]');
                if(submitButton) submitButton.disabled = true; submitButton.textContent = 'Saving...';

                if (isCreatingNewProfile || !currentProfileData || !currentProfileData.id) { // Check if we should create
                    response = await createProfile(profileDataPayload);
                    displayMessage(generalMessageElement, 'Profile created successfully!', false);
                } else {
                    response = await updateProfile(profileUserId, profileDataPayload); // profileUserId is loggedInUserId
                    displayMessage(generalMessageElement, 'Profile updated successfully!', false);
                }
                currentProfileData = response.profile || response; // API might wrap in 'profile' or return directly
                isCreatingNewProfile = false; // Successfully saved, so not creating anymore
                renderProfileView(currentProfileData);
                toggleMode(false);
                if(submitButton) submitButton.disabled = false; submitButton.textContent = 'Save Changes';

            } catch (error) {
                console.error('Error saving profile:', error);
                const submitButton = profileForm.querySelector('button[type="submit"]');
                if(submitButton) submitButton.disabled = false; submitButton.textContent = 'Save Changes';
                displayMessage(formErrorMessageElement, `Failed to save profile: ${error.message || 'Unknown error'}. Check console for details.`, true);
            }
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', () => {
            clearMessages();
            if (isCreatingNewProfile && (!currentProfileData || !currentProfileData.id)) {
                // If was creating a new profile and cancels, perhaps redirect or just clear form
                displayMessage(generalMessageElement, 'Profile creation cancelled.', false);
                // Optionally, redirect to dashboard if they cancel creation of a new profile
                // window.location.href = 'dashboard.html';
                // For now, just go back to a "create profile" state or load empty view
                profileViewDetailsElement.innerHTML = '<p>No profile created. Click "Edit Profile" to start.</p>';
                toggleMode(false); // Show view mode (which will be empty)
                // Or, if you want to allow them to try creating again immediately:
                // populateForm({});
                // toggleMode(true);
            } else {
                // If editing an existing profile, reload original data and switch to view mode
                if (currentProfileData && currentProfileData.id) {
                    renderProfileView(currentProfileData); // Re-render with existing data
                    toggleMode(false);
                } else { // Should not happen if not creating, but as a fallback:
                    loadProfile();
                }
            }
        });
    }


    if (editProfileButton) {
        editProfileButton.addEventListener('click', () => {
            // isCreatingNewProfile should be set by loadProfile if profile not found
            // If currentProfileData is null or has no id, it implies we are creating
            isCreatingNewProfile = !currentProfileData || !currentProfileData.id;
            toggleMode(true);
        });
    }

    if (deleteProfileButton) {
        deleteProfileButton.addEventListener('click', async () => {
            clearMessages();
            if (!currentProfileData || !currentProfileData.id) {
                displayMessage(generalMessageElement, 'No profile to delete.', true);
                return;
            }
            if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
                try {
                    deleteProfileButton.disabled = true; deleteProfileButton.textContent = 'Deleting...';
                    await deleteProfile(profileUserId); // profileUserId is loggedInUserId
                    displayMessage(generalMessageElement, 'Profile deleted successfully. Redirecting to dashboard...', false);
                    currentProfileData = null;
                    isCreatingNewProfile = true; // After deletion, next save would be a create
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2500);
                } catch (error) {
                    deleteProfileButton.disabled = false; deleteProfileButton.textContent = 'Delete Profile';
                    console.error('Error deleting profile:', error);
                    displayMessage(generalMessageElement, `Failed to delete profile: ${error.message || 'Unknown error'}.`, true);
                }
            }
        });
    }

    // Initial load
    loadProfile();
});