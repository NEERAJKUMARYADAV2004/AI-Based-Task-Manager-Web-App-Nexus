// The URL of your running backend server
export const API_URL = 'http://localhost:5000/api';

// Helper to get headers with the JWT token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('nexus-token');
  return {
    'Content-Type': 'application/json',
    'x-auth-token': token
  };
};