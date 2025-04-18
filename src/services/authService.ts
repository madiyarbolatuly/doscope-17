
import axios from 'axios';

// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123' // In a real app, this would be hashed
  }
];

// Mock token generation
const generateToken = (userId: string) => {
  return `mock-jwt-token-${userId}-${Date.now()}`;
};

const API_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Register a new user
export const registerUser = async (userData: { name: string; email: string; password: string }) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if user already exists
  if (MOCK_USERS.find(user => user.email === userData.email)) {
    throw new Error("User already exists");
  }

  // Create new user
  const newUser = {
    id: String(MOCK_USERS.length + 1),
    ...userData
  };
  
  MOCK_USERS.push(newUser);
  
  return {
    message: "Registration successful",
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  };
};

// Login user
export const loginUser = async (credentials: { email: string; password: string }) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find user
  const user = MOCK_USERS.find(u => u.email === credentials.email);
  
  if (!user || user.password !== credentials.password) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user.id);
  
  // Store token
  localStorage.setItem('authToken', token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return {
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  delete apiClient.defaults.headers.common['Authorization'];
};

// Get current user info
export const getCurrentUser = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error("Not authenticated");
  }
  
  // Extract user ID from mock token
  const userId = token.split('-')[2];
  const user = MOCK_USERS.find(u => u.id === userId);
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
};

// Initialize auth header if token exists
const initialToken = localStorage.getItem('authToken');
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export { apiClient };
