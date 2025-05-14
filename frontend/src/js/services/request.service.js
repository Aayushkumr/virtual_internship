import { API_BASE_URL, getAuthHeaders } from './api.config.js';

/**
 * Send a mentorship request from current user to receiverId
 */
export const sendMentorshipRequest = async (receiverId, message = '') => {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ receiverId: parseInt(receiverId, 10), message }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || `Failed to send request. Status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

/**
 * Get incoming and outgoing mentorship requests for current user
 */
export const getMentorshipRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || `Failed to fetch requests. Status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data.requests;
};

/**
 * Update status of a request (accepted, declined, or cancelled)
 */
export const updateRequestStatus = async (requestId, status) => {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || `Failed to update request. Status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};