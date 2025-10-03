import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  loginUser as loginUserService,
  logoutUser as logoutUserService,
  getCurrentUser,
} from '../services/authService';
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

// --- helper: safe role normalization
function normalizeRole(raw: unknown): UserRole {
  const r = String(raw || '').toLowerCase();
  if (r === 'admin' || r === 'editor' || r === 'viewer') return r as UserRole;
  return 'viewer';
}

// --- helper: fallback to read role from JWT if /me omitted it
function getRoleFromToken(token: string | null): UserRole | null {
  try {
    if (!token) return null;
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const json = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    return normalizeRole(json.role);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // load user via API when token exists
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // MUST return role from your FastAPI /me (or equivalent)
        const userData = await getCurrentUser(); // should include: id, username, email?, role
        const roleFromApi = normalizeRole((userData as any).role);
        const role = roleFromApi || getRoleFromToken(token) || 'viewer';

        const fullUser: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email || `${userData.username}@company.com`,
          role, // <--- use real role
          permissions: ['*'],
          departments: ['development'],
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        setUser(fullUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to load user data', err);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [token]);

  const login = async (credentials: { username: string; password: string }) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await loginUserService(credentials);
      localStorage.setItem('authToken', data.access_token);
      setToken(data.access_token);

      // fetch /me immediately after login to get role
      const userData = await getCurrentUser();
      const roleFromApi = normalizeRole((userData as any).role);
      const role = roleFromApi || getRoleFromToken(data.access_token) || 'viewer';

      const fullUser: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email || `${userData.username}@company.com`,
        role, // <--- use real role
        permissions: ['*'],
        departments: ['development'],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      setUser(fullUser);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to login');
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem('authToken');
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
    if (user) setUser({ ...user, role: normalizeRole(role) });
  };

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
    updateUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export type { User };
