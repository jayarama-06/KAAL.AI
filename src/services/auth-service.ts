/**
 * KAAL Authentication Service
 * Handles user authentication, session management, and profile sync
 * 
 * LOCK TIMEOUT FIX:
 * - Added retry logic with exponential backoff
 * - Prevents Navigator LockManager timeout errors
 * - Caches user state to reduce concurrent auth calls
 */

import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase-client';
import { storageService } from './storage-service';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthStateListener = (state: AuthState) => void;

/**
 * Retry function with exponential backoff for lock timeout errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Only retry on lock timeout errors
      if (!lastError.message?.includes('LockManager') && !lastError.message?.includes('lock')) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`[Auth] Lock timeout, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

class AuthService {
  private client: SupabaseClient = supabase;
  private authState: AuthState = {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true
  };
  private listeners: Set<AuthStateListener> = new Set();

  /**
   * Initialize the auth service
   */
  async initialize(): Promise<void> {
    try {
      // Check for existing session with retry logic
      const { data: { session } } = await retryWithBackoff(
        () => this.client.auth.getSession(),
        3,
        500
      );
      
      if (session) {
        await this.handleSessionChange(session);
      } else {
        this.updateAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false
        });
      }

      // Listen for auth state changes
      this.client.auth.onAuthStateChange(async (_event, session) => {
        await this.handleSessionChange(session);
      });

      console.log('✅ Auth service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize auth service:', error);
      this.updateAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }

  /**
   * Handle session changes
   */
  private async handleSessionChange(session: Session | null): Promise<void> {
    if (session?.user) {
      const authUser = this.mapSupabaseUser(session.user);
      
      this.updateAuthState({
        user: authUser,
        session,
        isAuthenticated: true,
        isLoading: false
      });

      // Sync profile with localStorage
      await this.syncUserProfile(authUser);
    } else {
      this.updateAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }

  /**
   * Map Supabase user to AuthUser
   */
  private mapSupabaseUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      createdAt: user.created_at
    };
  }

  /**
   * Sync user profile data from auth to storage
   * @deprecated Profile now syncs directly to Supabase via ProfileContext
   */
  private async syncUserProfile(authUser: AuthUser): Promise<void> {
    // No-op: Profile is now managed by ProfileContext and saved directly to Supabase
    // Auth metadata (name, avatar) is stored in Supabase auth.users table
  }

  /**
   * Update auth state and notify listeners
   */
  private updateAuthState(newState: AuthState): void {
    this.authState = newState;
    this.listeners.forEach(listener => listener(newState));
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.authState);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return this.authState;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.authState.user;
  }

  /**
   * Get current user (alias for backward compatibility)
   */
  getUser(): AuthUser | null {
    return this.authState.user;
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, fullName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to sign in' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Google OAuth initiated');
      return { success: true };
    } catch (error) {
      console.error('❌ Google OAuth exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.client.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update user profile metadata
   */
  async updateProfile(updates: { fullName?: string; avatarUrl?: string }): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.client.auth.updateUser({
        data: {
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get Supabase client (for advanced usage)
   */
  getClient(): SupabaseClient | null {
    return this.client;
  }
}

export const authService = new AuthService();