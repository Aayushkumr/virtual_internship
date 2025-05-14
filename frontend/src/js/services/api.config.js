export const API_BASE_URL = 'http://localhost:5001/api';

export const HEADERS = {
    'Content-Type': 'application/json',
};

// Function to get headers with Authorization token if available
export const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        return { ...HEADERS, 'Authorization': `Bearer ${token}` };
    }
    return HEADERS;
};
