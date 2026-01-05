import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import { useOneSignal } from '@/hooks/useOneSignal';

export type UserRole = 'user' | 'admin' | 'superadmin' | 'police' | 'hospital';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePhoto?: string;
  hospitalPreference?: 'government' | 'private' | 'both';
  hospitalType?: 'government' | 'private'; // For hospital role users
  accidentAlerts?: boolean;
  smsNotifications?: boolean;
  locationTracking?: boolean;
  isActive?: boolean;
  onDuty?: boolean;
  specialization?: string; // For hospital role users
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPolice: boolean;
  isHospital: boolean;
  userRole: UserRole | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setExternalUserId, removeExternalUserId, requestPermission, isInitialized } = useOneSignal();

  useEffect(() => {
    // Load auth state from localStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Set OneSignal external user ID on app load if user is logged in
      if (isInitialized && parsedUser?.id) {
        setExternalUserId(parsedUser.id, parsedUser.role);
      }
    }
    setIsLoading(false);
  }, [isInitialized, setExternalUserId]);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Set OneSignal external user ID on login
    if (newUser?.id) {
      setExternalUserId(newUser.id, newUser.role);
      // Request notification permission after login
      requestPermission().catch(console.error);
    }
  }, [setExternalUserId, requestPermission]);

  const logout = useCallback(() => {
    // Remove OneSignal external user ID on logout
    removeExternalUserId();
    
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }, [removeExternalUserId]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      const updatedUser = response.data;
      console.log('[Auth] Refreshed user data:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  // Role helpers
  const userRole = user?.role || null;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isSuperAdmin = userRole === 'superadmin';
  const isPolice = userRole === 'police';
  const isHospital = userRole === 'hospital';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isSuperAdmin,
        isPolice,
        isHospital,
        userRole,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
