"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/auth';
import { removeStoredToken } from '@/lib/auth/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      // Try to get user data from API (httpOnly cookies sent automatically)
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: include cookies in request
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.user) {
          console.log('✅ User authenticated via cookie:', userData.user);
          setUser(userData.user);
        } else {
          console.log('❌ Invalid response from /api/auth/me:', userData);
          setUser(null);
        }
      } else {
        // No valid auth cookie or expired
        console.log('❌ Auth failed, status:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    // Tokens are now handled by httpOnly cookies from server
    // Just update the user state
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear httpOnly cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local state
    setUser(null);
    
    // Force page reload to ensure clean state
    window.location.href = '/';
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}