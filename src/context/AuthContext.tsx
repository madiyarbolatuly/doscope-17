import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser as loginUserService, logoutUser as logoutUserService, getCurrentUser, refreshAccessToken } from '../services/authService';
import { User } from '@/types/auth';
import { UserRole } from '@/types/user';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  error: string | null;
  updateUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to load user data when token exists
  useEffect(() => {
    const loadUserData = async () => {
      if (token) {
        try {
          // Try to get real user data from API
          const userData = await getCurrentUser();
          const fullUser: User = {
            id: userData.id,
            username: userData.username,
            email: userData.email || `${userData.username}@company.com`,
            role: 'admin',
            permissions: ['*'],
            departments: ['development'],
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          setUser(fullUser);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to load user data", err);
          // If API call fails, clear token and redirect to login
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [token]);

  const login = async (credentials: { username: string; password: string }) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await loginUserService(credentials);
      setToken(data.access_token);
      localStorage.setItem('authToken', data.access_token);
      setIsAuthenticated(true);
      
      // Fetch user data after successful login
      try {
        const userData = await getCurrentUser();
        const fullUser: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email || `${userData.username}@company.com`,
          role: 'admin',
          permissions: ['*'],
          departments: ['development'],
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        setUser(fullUser);
      } catch (userErr) {
        console.error("Failed to fetch user data after login", userErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to login");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUserService();
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
    updateUserRole
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

export type { User };
