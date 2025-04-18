
import axios from 'axios';

// Use a constant instead of env variables since we don't have access to those in this setup
const API_URL = 'http://localhost:8000'; 

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Register a new user
export const registerUser = async (userData: { name: string; email: string; password: string }) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    console.log('Registration Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error("Registration error:", error.response?.data || error.message);
    throw error.response?.data || new Error("Registration failed");
  }
};

// Login user
export const loginUser = async (credentials: { email: string; password: string }) => {
  try {
    // Assuming your FastAPI uses a standard JSON request for login
    // Adjust as needed for your specific backend implementation
    const response = await apiClient.post('/auth/login', credentials);

    console.log('Login Response:', response.data);
    if (response.data && response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
      // Set auth header for future requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      return response.data;
    } else {
      throw new Error("Токен не получен");
    }
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message);
    localStorage.removeItem('authToken');
    throw error.response?.data || new Error("Ошибка входа");
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  delete apiClient.defaults.headers.common['Authorization'];
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user:", error.response?.data || error.message);
    throw error.response?.data || new Error("Ошибка получения данных пользователя");
  }
};

// Initialize auth header if token exists on app load
const initialToken = localStorage.getItem('authToken');
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export { apiClient };
