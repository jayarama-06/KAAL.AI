import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase-client';
import { toast } from 'sonner@2.0.3';

/**
 * KAAL User Profile Hook
 * 
 * Manages user profile data with Supabase backend integration.
 * Includes automatic camelCase <-> snake_case transformation.
 * 
 * IMPORTANT: Empty date strings are converted to null to avoid PostgreSQL errors.
 */

// Profile data type matching the database schema
export interface UserProfile {
  id?: string;
  userId?: string;
  fullName: string;
  professionalTitle: string;
  pronouns: string;
  dateOfBirth: string;
  dobPrivate: boolean;
  phoneNumber: string;
  website: string;
  bio: string;
  email: string;
  profileImage: string;
  skills: string[];
  interests: string[];
  deepWorkMode: boolean;
  quietMode: boolean;
  weeklyDigest: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Transform database snake_case to camelCase
function transformFromDb(dbProfile: any): UserProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    fullName: dbProfile.full_name || 'User',
    professionalTitle: dbProfile.professional_title || '',
    pronouns: dbProfile.pronouns || '',
    dateOfBirth: dbProfile.date_of_birth || '',
    dobPrivate: dbProfile.dob_private ?? true,
    phoneNumber: dbProfile.phone_number || '',
    website: dbProfile.website || '',
    bio: dbProfile.bio || '',
    email: dbProfile.email || '',
    profileImage: dbProfile.profile_image_url || '',
    skills: Array.isArray(dbProfile.skills) ? dbProfile.skills : [],
    interests: Array.isArray(dbProfile.interests) ? dbProfile.interests : [],
    deepWorkMode: dbProfile.deep_work_mode ?? false,
    quietMode: dbProfile.quiet_mode ?? true,
    weeklyDigest: dbProfile.weekly_digest ?? false,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

// Transform camelCase to database snake_case
function transformToDb(profile: Partial<UserProfile>): any {
  const dbProfile: any = {};
  
  if (profile.fullName !== undefined) dbProfile.full_name = profile.fullName;
  if (profile.professionalTitle !== undefined) dbProfile.professional_title = profile.professionalTitle;
  if (profile.pronouns !== undefined) dbProfile.pronouns = profile.pronouns;
  if (profile.dateOfBirth !== undefined) dbProfile.date_of_birth = profile.dateOfBirth || null; // Empty string → null
  if (profile.dobPrivate !== undefined) dbProfile.dob_private = profile.dobPrivate;
  if (profile.phoneNumber !== undefined) dbProfile.phone_number = profile.phoneNumber;
  if (profile.website !== undefined) dbProfile.website = profile.website;
  if (profile.bio !== undefined) dbProfile.bio = profile.bio;
  if (profile.email !== undefined) dbProfile.email = profile.email;
  if (profile.profileImage !== undefined) dbProfile.profile_image_url = profile.profileImage;
  if (profile.skills !== undefined) dbProfile.skills = profile.skills;
  if (profile.interests !== undefined) dbProfile.interests = profile.interests;
  if (profile.deepWorkMode !== undefined) dbProfile.deep_work_mode = profile.deepWorkMode;
  if (profile.quietMode !== undefined) dbProfile.quiet_mode = profile.quietMode;
  if (profile.weeklyDigest !== undefined) dbProfile.weekly_digest = profile.weeklyDigest;
  
  return dbProfile;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Starting fetchProfile...');

      // Check if Supabase is available (won't work in Figma preview)
      if (!supabase) {
        console.log('⚠️ Supabase client not available (preview mode)');
        setLoading(false);
        return;
      }

      // Get current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // Silently handle session errors (happens in preview mode)
        console.log('⚠️ Session error (expected in preview):', sessionError.message);
        setLoading(false);
        return;
      }
      
      if (!session) {
        console.log('⚠️ No session - user not logged in');
        setLoading(false);
        setProfile(null);
        return; // Not an error, just not logged in yet - no toast needed
      }

      console.log('👤 Current user:', session.user.id, session.user.email);

      console.log('📡 Fetching profile from database for user:', session.user.id);

      // Fetch profile from database
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      console.log('📦 Database response:', { data, error: fetchError });

      if (fetchError) {
        // If profile doesn't exist, create a default one
        if (fetchError.code === 'PGRST116') {
          console.log('⚠️ Profile not found, creating default profile...');
          await createProfile(session.user.id, session.user.email || '');
          return;
        }
        throw fetchError;
      }

      if (data) {
        console.log('✅ Profile loaded successfully:', data);
        setProfile(transformFromDb(data));
      }
    } catch (err: any) {
      // Format error details for debugging
      const errorDetails = {
        message: err.message || 'Unknown error',
        details: err.toString(),
        hint: err.hint || '',
        code: err.code || ''
      };
      
      // Check if it's a network error (happens in preview/offline mode)
      const isNetworkError = err.message?.includes('Failed to fetch') || 
                            err.message?.includes('NetworkError') ||
                            err.message?.includes('fetch') ||
                            err.name === 'TypeError';
      
      if (isNetworkError) {
        // This is expected in Figma Make preview - log as info, not error
        console.log('🌐 Supabase connection unavailable (preview mode or not configured)');
        console.log('💡 This is normal in Figma Make preview. To enable backend features:');
        console.log('   1. Create a Supabase project at https://supabase.com');
        console.log('   2. Connect your project using the Supabase Connect tool');
        console.log('   3. See ADD-YOUR-API-KEY.md for detailed instructions');
        setError('Preview mode - Supabase not connected');
        setLoading(false);
        // Don't show toast in preview mode or for network errors
        return;
      }
      
      // Real errors (not network issues)
      console.error('❌ Error fetching profile:', errorDetails);
      setError(err.message);
      
      // Only show toast for real errors, not auth or network issues
      if (!err.message?.includes('session') && 
          !err.message?.includes('auth') && 
          !isNetworkError) {
        toast.error('Failed to load profile', {
          description: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Create a new profile
  const createProfile = async (userId: string, email: string) => {
    try {
      console.log('🆕 Creating new profile for user:', userId);
      
      // Get current session to access user metadata
      const { data: { session } } = await supabase.auth.getSession();
      const userMetadata = session?.user?.user_metadata || {};
      
      // Extract full name from various possible metadata fields
      const fullName = userMetadata.full_name || 
                      userMetadata.name || 
                      userMetadata.display_name ||
                      email.split('@')[0] || 
                      'User';
      
      // Extract avatar URL from metadata
      const profileImageUrl = userMetadata.avatar_url || 
                              userMetadata.picture || 
                              '';
      
      console.log('📝 Using metadata:', { fullName, profileImageUrl, userMetadata });

      const defaultProfile = {
        user_id: userId,
        email: email,
        full_name: fullName,
        professional_title: '',
        pronouns: '',
        date_of_birth: null,
        dob_private: true,
        phone_number: '',
        website: '',
        bio: '',
        profile_image_url: profileImageUrl,
        skills: [],
        interests: [],
        deep_work_mode: false,
        quiet_mode: true,
        weekly_digest: false,
      };

      console.log('💾 Inserting profile:', defaultProfile);

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        console.log('✅ Profile created successfully:', data);
        setProfile(transformFromDb(data));
        toast.success('Profile created!');
      }
    } catch (err: any) {
      console.error('❌ Error creating profile:', err);
      toast.error('Failed to create profile', {
        description: err.message
      });
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!profile?.userId) {
        throw new Error('No profile loaded');
      }

      console.log('🔄 Update Profile - Input:', updates);
      const dbUpdates = transformToDb(updates);
      console.log('🔄 Update Profile - Transformed to DB:', dbUpdates);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('user_id', profile.userId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        console.log('✅ Update Profile - Success, data from DB:', data);
        setProfile(transformFromDb(data));
        toast.success('Profile updated successfully!');
      }
    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      toast.error('Failed to update profile', {
        description: err.message
      });
      throw err;
    }
  };

  // Delete profile
  const deleteProfile = async () => {
    try {
      if (!profile?.userId) {
        throw new Error('No profile loaded');
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', profile.userId);

      if (error) throw error;

      setProfile(null);
      toast.success('Profile deleted');
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      toast.error('Failed to delete profile', {
        description: err.message
      });
      throw err;
    }
  };

  // Load profile on mount and listen to auth changes
  useEffect(() => {
    fetchProfile();

    try {
      // Subscribe to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in - fetching profile');
          fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out - clearing profile');
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed - refreshing profile');
          fetchProfile();
        }
      });

      // Subscribe to profile changes
      const channel = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_profiles'
          },
          (payload) => {
            console.log('📬 Profile changed in database:', payload);
            fetchProfile();
          }
        )
        .subscribe();

      return () => {
        subscription?.unsubscribe();
        supabase.removeChannel(channel);
      };
    } catch (err) {
      // Silently handle subscription errors in preview mode
      console.log('⚠️ Could not set up subscriptions (preview mode):', err);
      return () => {}; // Return empty cleanup function
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    profile,
    loading,
    error,
    updateProfile,
    deleteProfile,
    refreshProfile: fetchProfile,
  };
}