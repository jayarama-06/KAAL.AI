import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserProfile } from '../hooks/useProfile';

export interface ProfileData {
  // Identity & Contact
  fullName: string;
  professionalTitle: string;
  pronouns: string;
  dateOfBirth: string;
  dobPrivate: boolean;
  phoneNumber: string;
  website: string;
  bio: string;
  email: string;
  
  // Profile Photo
  profileImage: string;
  
  // Skills & Expertise
  skills: string[];
  interests: string[];
  
  // Focus Preferences
  deepWorkMode: boolean;
  quietMode: boolean;
  weeklyDigest: boolean;
}

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  resetProfile: () => void;
  loading: boolean;
  error: string | null;
  refreshProfile?: () => Promise<void>;
}

// Empty default profile - no static data!
const defaultProfile: ProfileData = {
  fullName: '',
  professionalTitle: '',
  pronouns: '',
  dateOfBirth: '',
  dobPrivate: true,
  phoneNumber: '',
  website: '',
  bio: '',
  email: '',
  profileImage: '',
  skills: [],
  interests: [],
  deepWorkMode: false,
  quietMode: false,
  weeklyDigest: false,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { profile: supabaseProfile, loading, error, updateProfile: supabaseUpdate, refreshProfile: supabaseRefresh } = useUserProfile();
  
  // CRITICAL: Clear any old localStorage data on mount
  useEffect(() => {
    const oldData = localStorage.getItem('kaal_user_profile');
    if (oldData) {
      console.warn('🧹 Removing old localStorage profile data');
      localStorage.removeItem('kaal_user_profile');
      localStorage.removeItem('profileImage');
      localStorage.removeItem('profile');
      localStorage.removeItem('user_profile');
    }
  }, []);
  
  // Use Supabase profile or fallback to default
  const profile = supabaseProfile || defaultProfile;

  const updateProfile = async (updates: Partial<ProfileData>) => {
    try {
      console.log('📝 ProfileContext - updateProfile called with:', updates);
      if (supabaseProfile) {
        await supabaseUpdate(updates);
      } else {
        // Don't error if user is not logged in yet
        if (!loading) {
          console.warn('⚠️ No Supabase profile loaded - user may not be logged in');
          throw new Error('Please log in to update your profile');
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err; // Re-throw so the UI can handle it
    }
  };

  const resetProfile = () => {
    console.log('Reset profile - not implemented for Supabase');
    // Note: For Supabase, you might want to reset to default values
    // rather than deleting the profile
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, resetProfile, loading, error, refreshProfile: supabaseRefresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}