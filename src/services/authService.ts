
import apiClient, { setAuthToken } from '../lib/apiClient';

// Register a new user
export const registerUser = async (userData: { name: string; email: string; password: string }) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

// Login user
export const loginUser = async (credentials: { email: string; password: string }) => {
  try {
    const response = await apiClient.post('/auth/token', {
      username: credentials.email,
      password: credentials.password
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, user } = response.data;
    
    // Store token
    setAuthToken(access_token);
    
    return {
      access_token,
      user
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Invalid email or password');
  }
};

// Logout user
export const logoutUser = () => {
  setAuthToken(null);
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to get user data');
  }
};

export { apiClient };
