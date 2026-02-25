/**
 * KAAL Authentication Context
 * Provides authentication state and methods throughout the app
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthState, AuthUser } from '../services/auth-service';
import { identifyUser, setCustomTag } from '../services/clarity-service';
import * as Sentry from '@sentry/react';
import { GoogleAnalytics } from '../services/google-analytics-service';
import { mixpanel } from '../services/mixpanel-service';

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { fullName?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Initialize auth service
    authService.initialize();

    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState);
      
      // Identify user in analytics when authenticated
      if (newState.isAuthenticated && newState.user) {
        const user = newState.user;
        
        // Microsoft Clarity - Identify user
        identifyUser(user.id, {
          email: user.email,
          name: user.fullName || user.email?.split('@')[0],
        });
        
        // Sentry - Set user context
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.fullName || undefined,
        });
        
        // Google Analytics - Set user ID
        GoogleAnalytics.setUserId(user.id);
        GoogleAnalytics.setUserProperties({
          email: user.email,
          has_full_name: !!user.fullName,
        });
        
        // Mixpanel - Track user sign in
        mixpanel.track('User Signed In', {
          user_id: user.id,
          email: user.email,
          full_name: user.fullName,
        });
        
        setCustomTag('user_authenticated', 'true');
      } else {
        // Clear user context on sign out
        Sentry.setUser(null);
        setCustomTag('user_authenticated', 'false');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    ...authState,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signOut: authService.signOut.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    updateProfile: authService.updateProfile.bind(authService)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}