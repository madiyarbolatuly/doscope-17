
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient, { setAuthToken } from '../lib/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to load user data when token exists
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      if (token) {
        try {
          // Get current user from backend API
          const response = await apiClient.get('/users/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to load user data", err);
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          setAuthToken(null); // Clear token in storage and headers
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    setError(null);
    try {
      // Send login request to backend API
      const response = await apiClient.post('/auth/token', {
        username: credentials.email, // FastAPI often uses username instead of email
        password: credentials.password
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const data = response.data;
      setToken(data.access_token);
      setAuthToken(data.access_token);
      
      // Get user profile if not included in token response
      if (!data.user) {
        const userResponse = await apiClient.get('/users/me');
        setUser(userResponse.data);
      } else {
        setUser(data.user);
      }
      
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Не удалось войти";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
