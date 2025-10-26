import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AuthenticatedUser } from '../types';
import * as SupabaseService from '../services/supabaseService';
import type { LoginCredentials, SignupData } from '../services/supabaseService';

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = useCallback(async () => {
    setLoading(true);
    try {
        const sessionUser = await SupabaseService.getSession();
        if (sessionUser) {
          setUser(sessionUser);
        }
    } catch (error) {
        console.error("Failed to check user session:", error);
        setUser(null);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const login = async (credentials: LoginCredentials) => {
    const loggedInUser = await SupabaseService.login(credentials);
    setUser(loggedInUser);
  };

  const signup = async (data: SignupData) => {
    const newUser = await SupabaseService.signup(data);
    setUser(newUser);
  };

  const logout = async () => {
    await SupabaseService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
