import axios from 'axios';
import { AUTH_ENDPOINTS } from '@/config/api';
import { api } from '@/services/apiclient';
import type { User } from '@/types/auth';

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

// NOTE:
// Use the shared axios instance (`api`) which is configured with baseURL=API_ROOT ("/api")
// and adds Authorization automatically. This prevents calls like "http://localhost:8080/v2/u/login"
// (which would hit the frontend dev server and 404).

// Register a new user
export const registerUser = async (userData: SignupData): Promise<User> => {
  const response = await api.post<User>(AUTH_ENDPOINTS.SIGNUP, userData);
  return response.data;
};

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  // Create form data for OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  formData.append('grant_type', 'password');

  const response = await api.post<AuthTokens>(AUTH_ENDPOINTS.LOGIN, formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  // Store tokens
  localStorage.setItem('authToken', response.data.access_token);
  if (response.data.refresh_token) {
    localStorage.setItem('refreshToken', response.data.refresh_token);
  }
  
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
    
    const response = await api.post<AuthTokens>(AUTH_ENDPOINTS.LOGIN, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Update stored tokens
    localStorage.setItem('authToken', response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refreshToken', response.data.refresh_token);
    }
    
    return response.data;
  } catch (error) {
    // If refresh fails, clear tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>(AUTH_ENDPOINTS.ME);
  return response.data;
};

