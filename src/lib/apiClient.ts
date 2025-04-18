
import axios from 'axios';

// You should replace this with your actual API URL in production
const API_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('authToken', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Auth token set and header added.");
  } else {
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    console.log("Auth token removed and header deleted.");
  }
};

// Check for token on initial load
const initialToken = localStorage.getItem('authToken');
if (initialToken) {
  setAuthToken(initialToken); // Set header if token exists
}

export default apiClient;
