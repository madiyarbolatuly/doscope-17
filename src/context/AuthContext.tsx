
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser as loginUserService, logoutUser as logoutUserService, getCurrentUser, refreshAccessToken } from '../services/authService';

// Update User interface to match backend API
export interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
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
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to load user data", err);
          
          // Try to refresh the token
          try {
            const refreshResult = await refreshAccessToken();
            if (refreshResult) {
              const userData = await getCurrentUser();
              setUser(userData);
              setIsAuthenticated(true);
              setToken(refreshResult.access_token);
              return;
            }
          } catch (refreshErr) {
            console.error("Failed to refresh token", refreshErr);
          }
          
          // If we get here, both attempts failed
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [token]);

  const login = async (credentials: { username: string; password: string }) => {
    setError(null);
    try {
      const data = await loginUserService(credentials);
      setToken(data.access_token);
      setIsAuthenticated(true);
      
      // Fetch user data after successful login
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (userErr) {
        console.error("Failed to fetch user data after login", userErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to login");
      throw err;
    }
  };

  const logout = () => {
    logoutUserService();
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
