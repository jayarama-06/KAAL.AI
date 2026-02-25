import { useState, useEffect } from 'react';

/**
 * DEPRECATED: This hook is no longer used.
 * Profile images now come from Supabase via useProfile hook.
 * Keeping this file for backwards compatibility but it returns null.
 */
export function useProfileImage() {
  const [profileImage, setProfileImageState] = useState<string | null>(null);

  // Clear any old localStorage profile image data on mount
  useEffect(() => {
    const oldImage = localStorage.getItem('profileImage');
    if (oldImage) {
      console.warn('🧹 Removing old profileImage from localStorage');
      localStorage.removeItem('profileImage');
    }
  }, []);

  // Return null - use useProfile() instead for profile images
  return profileImage;
}