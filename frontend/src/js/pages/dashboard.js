import { getCurrentUserId } from '../services/auth.service.js';
import { getProfileByUserId } from '../services/profile.service.js';
import { getMentorshipRequests, updateRequestStatus } from '../services/request.service.js';
import { requireAuth } from '../utils/authGuard.js'; // Assuming authGuard.js handles redirection

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard DOMContentLoaded: Starting up.');

    // Use the authGuard to protect the page
    if (!requireAuth()) {
        console.log('Dashboard: User not authenticated, redirection should have occurred.');
        return; 
    }

    const currentUserId = getCurrentUserId();
    console.log('Dashboard User ID:', currentUserId);

    if (!currentUserId) {
        console.error('Dashboard: Current User ID not found. Redirecting to login.');
        return;
    }

    // Get DOM elements
    const profileDetailsContainer = document.getElementById('profile-summary-details');
    const incomingRequestsList = document.getElementById('incoming-requests-list');
    const outgoingRequestsList = document.getElementById('outgoing-requests-list');
    const activeConnectionsList = document.getElementById('active-connections-list');
    const dashboardMessageElement = document.getElementById('dashboard-message');

    const showMessage = (element, message, type = 'info') => {
        if (element) {
            const p = document.createElement('p');
            p.className = `message ${type}`;
            p.textContent = message;
            element.innerHTML = ''; // Clear previous messages
            element.appendChild(p);
            element.style.display = 'block'; // Ensure it's visible

            if (type !== 'error') { // Auto-hide non-error messages
                setTimeout(() => {
                    if (element.contains(p)) { // Check if the message is still the one we set
                        element.innerHTML = '';
                        element.style.display = 'none';
                    }
                }, 4000);
            }
        } else {
            console.warn('Attempted to show message on a null element.');
        }
    };

    const renderProfileSummary = (profile) => {
        if (!profileDetailsContainer) {
            console.warn('Profile details container not found in dashboard.');
            return;
        }
        if (!profile || Object.keys(profile).length === 0 || !profile.id) {
            profileDetailsContainer.innerHTML = `
                <p>You haven't set up your profile yet.</p>
                <a href="profile.html" class="cta-button">Create Profile</a>
            `;
            return;
        }

        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Your Name';
        const displayRole = profile.role || profile.user_role || 'Role not set';

        const skills = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || 'Not specified');
        const interests = Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || 'Not specified');

        profileDetailsContainer.innerHTML = `
            <h3>${fullName} <span class="role-badge">(${displayRole})</span></h3>
            <p><strong>Bio:</strong> ${profile.bio || 'No bio provided.'}</p>
            <p><strong>Skills:</strong> ${skills}</p>
            <p><strong>Interests:</strong> ${interests}</p>
            <p><strong>Availability:</strong> ${profile.availability || 'Not specified'}</p>
        `;
    };

    const renderRequests = (requests, container, type) => {
        if (!container) {
            console.warn(`${type} requests container not found.`);
            return;
        }
        if (!requests || requests.length === 0) {
            container.innerHTML = `<li>No ${type} requests.</li>`;
            return;
        }

        container.innerHTML = requests.map(req => {
            let otherPartyName = 'User';
            if (type === 'incoming') {
                otherPartyName = `${req.mentee_first_name || ''} ${req.mentee_last_name || ''}`.trim() || `User ID: ${req.mentee_id}`;
            } else {
                otherPartyName = `${req.mentor_first_name || ''} ${req.mentor_last_name || ''}`.trim() || `User ID: ${req.mentor_id}`;
            }
            let actionsHtml = '';

            if (type === 'incoming' && req.status === 'pending') {
                actionsHtml = `
                    <button class="cta-button request-action-btn" data-request-id="${req.id}" data-action="accepted">Accept</button>
                    <button class="cta-button cta-button-secondary request-action-btn" data-request-id="${req.id}" data-action="declined">Decline</button>
                `;
            } else if (type === 'outgoing' && req.status === 'pending') {
                actionsHtml = `
                    <button class="cta-button cta-button-secondary request-action-btn" data-request-id="${req.id}" data-action="cancelled">Cancel</button>
                `;
            } else if (req.status === 'accepted' || req.status === 'declined' || req.status === 'cancelled') {
                // Optionally show a message or different UI for non-pending requests if they are ever passed here
                // For now, actionsHtml remains empty for these, which is fine.
            }

            return `
                <li data-request-id="${req.id}">
                    <p><strong>${type === 'incoming' ? 'From' : 'To'}:</strong> ${otherPartyName}</p>
                    <p><strong>Message:</strong> ${req.message || 'No message provided.'}</p>
                    <p><strong>Status:</strong> <span class="status-${req.status}">${req.status}</span></p>
                    <div class="request-actions">
                        ${actionsHtml}
                    </div>
                </li>
            `;
        }).join('');

        container.querySelectorAll('.request-action-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const requestId = event.target.dataset.requestId;
                const action = event.target.dataset.action;
                await handleRequestUpdate(requestId, action);
            });
        });
    };

    const handleRequestUpdate = async (requestId, newStatus) => {
        try {
            if (dashboardMessageElement) showMessage(dashboardMessageElement, 'Updating request...', 'info');
            await updateRequestStatus(requestId, newStatus);
            if (dashboardMessageElement) showMessage(dashboardMessageElement, `Request ${newStatus} successfully.`, 'success');
            
            await loadDashboardData(false);
        } catch (error) {
            console.error(`Dashboard: Failed to ${newStatus} request ${requestId}:`, error);
            if (dashboardMessageElement) showMessage(dashboardMessageElement, `Error updating request: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const loadDashboardData = async (showMainLoadingMessage = true) => {
        if (!currentUserId) {
            if (dashboardMessageElement) showMessage(dashboardMessageElement, 'User ID not found. Cannot load dashboard.', 'error');
            return;
        }
        try {
            if (showMainLoadingMessage && dashboardMessageElement) showMessage(dashboardMessageElement, 'Loading dashboard data...', 'info');
            console.log(`Dashboard: Attempting to fetch profile for user ID: ${currentUserId}`);
            
            const userProfile = await getProfileByUserId(currentUserId); 
            console.log('Dashboard: Fetched userProfile:', userProfile);
            renderProfileSummary(userProfile);

            const allRequests = await getMentorshipRequests();
            console.log('Dashboard: Fetched allRequests:', allRequests);

            if (!Array.isArray(allRequests)) {
                console.error('Dashboard: getMentorshipRequests did not return an array.', allRequests);
                if (incomingRequestsList) incomingRequestsList.innerHTML = '<li>Error loading requests.</li>';
                if (outgoingRequestsList) outgoingRequestsList.innerHTML = '<li>Error loading requests.</li>';
                if (activeConnectionsList) activeConnectionsList.innerHTML = '<li>Error loading connections.</li>';
            } else {
                const currentUserIdString = currentUserId.toString();
                const incoming = allRequests.filter(r => r.mentor_id.toString() === currentUserIdString && r.status === 'pending');
                const outgoing = allRequests.filter(r => r.mentee_id.toString() === currentUserIdString && r.status === 'pending');
                const active = allRequests.filter(r => r.status === 'accepted' && 
                                                 (r.mentee_id.toString() === currentUserIdString || r.mentor_id.toString() === currentUserIdString));

                renderRequests(incoming, incomingRequestsList, 'incoming');
                renderRequests(outgoing, outgoingRequestsList, 'outgoing');
                
                if (activeConnectionsList) {
                    if (active && active.length > 0) {
                        activeConnectionsList.innerHTML = active.map(conn => {
                            let otherPartyName = 'User';
                            let otherPartyRole = '';
                            if (conn.mentee_id.toString() === currentUserIdString) {
                                otherPartyName = `${conn.mentor_first_name || ''} ${conn.mentor_last_name || ''}`.trim() || `User ID: ${conn.mentor_id}`;
                                otherPartyRole = 'Mentor';
                            } else {
                                otherPartyName = `${conn.mentee_first_name || ''} ${conn.mentee_last_name || ''}`.trim() || `User ID: ${conn.mentee_id}`;
                                otherPartyRole = 'Mentee';
                            }
                            return `<li>Connection with ${otherPartyRole} ${otherPartyName} (Status: ${conn.status})</li>`;
                        }).join('');
                    } else {
                        activeConnectionsList.innerHTML = '<li>No active connections.</li>';
                    }
                }
            }
            if (showMainLoadingMessage && dashboardMessageElement && dashboardMessageElement.querySelector('.info')) {
                 dashboardMessageElement.innerHTML = '';
                 dashboardMessageElement.style.display = 'none';
            }
        } catch (error) {
            console.error('Dashboard: Failed to load data:', error);
            if (dashboardMessageElement) showMessage(dashboardMessageElement, `Error loading dashboard: ${error.message || 'Unknown error'}`, 'error');
            renderProfileSummary(null);
            if (incomingRequestsList) incomingRequestsList.innerHTML = '<li>Could not load incoming requests.</li>';
            if (outgoingRequestsList) outgoingRequestsList.innerHTML = '<li>Could not load outgoing requests.</li>';
            if (activeConnectionsList) activeConnectionsList.innerHTML = '<li>Could not load active connections.</li>';
        }
    };

    loadDashboardData();
});