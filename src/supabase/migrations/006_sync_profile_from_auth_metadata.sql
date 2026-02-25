-- =====================================================
-- KAAL: Sync Profile Data from Auth Metadata
-- =====================================================
-- This migration updates existing user_profiles to sync data
-- from auth.users metadata (for users who signed up before
-- the profile system was in place or when triggers didn't fire)

-- Function to sync profile data from auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
  full_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- Loop through all auth users
  FOR auth_user IN 
    SELECT 
      id,
      email,
      raw_user_meta_data
    FROM auth.users
  LOOP
    -- Extract full_name from metadata (try multiple keys)
    full_name_value := COALESCE(
      auth_user.raw_user_meta_data->>'full_name',
      auth_user.raw_user_meta_data->>'name',
      auth_user.raw_user_meta_data->>'display_name',
      split_part(auth_user.email, '@', 1),
      'User'
    );
    
    -- Extract avatar/profile image from metadata
    avatar_url_value := COALESCE(
      auth_user.raw_user_meta_data->>'avatar_url',
      auth_user.raw_user_meta_data->>'picture',
      ''
    );
    
    -- Update profile if it exists
    UPDATE public.user_profiles
    SET 
      full_name = full_name_value,
      profile_image_url = avatar_url_value,
      email = COALESCE(auth_user.email, email)
    WHERE 
      user_id = auth_user.id
      AND (
        -- Only update if current data is default/empty
        full_name = 'User' 
        OR full_name = '' 
        OR full_name IS NULL
        OR profile_image_url = ''
        OR profile_image_url IS NULL
      );
    
    -- If profile doesn't exist, create it
    INSERT INTO public.user_profiles (
      user_id,
      email,
      full_name,
      profile_image_url
    )
    SELECT
      auth_user.id,
      COALESCE(auth_user.email, ''),
      full_name_value,
      avatar_url_value
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE user_id = auth_user.id
    );
  END LOOP;
  
  RAISE NOTICE 'Profile sync completed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the sync function
SELECT public.sync_profile_from_auth();

-- Note: This function can be run manually anytime with:
-- SELECT public.sync_profile_from_auth();
