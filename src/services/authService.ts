import axios from 'axios';
import { AUTH_ENDPOINTS } from '@/config/api';
import type { User } from '@/context/AuthContext';

// Types to match our backend
interface LoginCredentials {
  username: string;
  password: string;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Create axios instance with auth header handling
const apiClient = axios.create();

// Add auth token to all requests if available
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register a new user
export const registerUser = async (userData: SignupData): Promise<User> => {
  const response = await apiClient.post<User>(AUTH_ENDPOINTS.SIGNUP, userData);
  return response.data;
};

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  // Create form data for OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  formData.append('grant_type', 'password');

  const response = await axios.post<AuthTokens>(AUTH_ENDPOINTS.LOGIN, formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  // Store tokens
  localStorage.setItem('authToken', response.data.access_token);
  if (response.data.refresh_token) {
    localStorage.setItem('refreshToken', response.data.refresh_token);
  }
  
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
  
  return response.data;
};

// Refresh the access token
export const refreshAccessToken = async (): Promise<AuthTokens | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  
  try {
    const formData = new URLSearchParams();
    formData.append('refresh_token', refreshToken);
    formData.append('grant_type', 'refresh_token');
    
    const response = await axios.post<AuthTokens>(AUTH_ENDPOINTS.LOGIN, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Update stored tokens
    localStorage.setItem('authToken', response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refreshToken', response.data.refresh_token);
    }
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    
    return response.data;
  } catch (error) {
    // If refresh fails, clear tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
    return null;
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  delete apiClient.defaults.headers.common['Authorization'];
};

// Get current user info - return mock user for development
export const getCurrentUser = async (): Promise<User> => {
  // For development, return a mock admin user
  return {
    id: 'mock-admin-user',
    username: 'admin',
    email: 'admin@company.com',
    role: 'admin'
  };
};

// Initialize auth header if token exists or set mock token
const initialToken = localStorage.getItem('authToken');
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
} else {
  // Set mock token for development
  const mockToken = 'mock-admin-token-12345';
  localStorage.setItem('authToken', mockToken);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
}

export { apiClient };
