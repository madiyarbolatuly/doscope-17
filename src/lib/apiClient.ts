
import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set auth token (call after login)
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

// Auth API functions
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email); // FastAPI often uses 'username' for email
    formData.append('password', credentials.password);
    
    const response = await apiClient.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },
  
  register: async (userData: { email: string; password: string; name: string }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  
  logout: () => {
    setAuthToken(null);
  }
};

// Document API functions
export const documentsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },
  
  create: async (documentData: FormData) => {
    const response = await apiClient.post('/documents', documentData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  update: async (id: string, documentData: any) => {
    const response = await apiClient.put(`/documents/${id}`, documentData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  }
};

export default apiClient;
