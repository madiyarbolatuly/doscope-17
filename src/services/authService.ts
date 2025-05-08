
import axios from 'axios';
import { AUTH_ENDPOINTS } from '@/config/api';

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

interface UserData {
  id: string;
  username: string;
}

interface AuthTokens {
  access_token: string;
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
export const registerUser = async (userData: SignupData): Promise<UserData> => {
  const response = await apiClient.post<UserData>(AUTH_ENDPOINTS.SIGNUP, userData);
  return response.data;
};

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  // Create form data for OAuth2 password flow (as shown in the API spec)
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  formData.append('grant_type', 'password');

  const response = await axios.post<AuthTokens>(AUTH_ENDPOINTS.LOGIN, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  // Store token
  localStorage.setItem('authToken', response.data.access_token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
  
  return response.data;
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  delete apiClient.defaults.headers.common['Authorization'];
};

// Get current user info
export const getCurrentUser = async (): Promise<UserData> => {
  const response = await apiClient.get<UserData>(AUTH_ENDPOINTS.ME);
  return response.data;
};

// Initialize auth header if token exists
const initialToken = localStorage.getItem('authToken');
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export { apiClient };
