import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';
import { User, StudentProfile } from '../types.js';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerStudent: (formData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data.user);
          setProfile(res.data.data.profile);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data.data;
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        setProfile(receivedProfile);
        return { success: true, message: 'Login successful' };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = !navigator.onLine
        ? 'You appear to be offline. Reconnect and try signing in again.'
        : error.code === 'ECONNABORTED'
          ? 'The sign-in request timed out. Please try again.'
          : error.response?.data?.message || 'Server connection issue during login.';
      return { success: false, message: msg };
    }
  };

  const registerStudent = async (formData: any) => {
    try {
      const res = await api.post('/auth/student/register', formData);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data.data;
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        setProfile(receivedProfile);
        return { success: true, message: 'Registration successful' };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      const msg = !navigator.onLine
        ? 'You appear to be offline. Reconnect and try registration again.'
        : error.code === 'ECONNABORTED'
          ? 'The registration request timed out. Please try again.'
          : error.response?.data?.message || 'Server connection error during registration.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        login,
        registerStudent,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
