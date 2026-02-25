-- =====================================================
-- KAAL User Profiles Migration
-- =====================================================
-- This migration creates the user_profiles table with all profile data
-- Including personal info, skills, interests, and preferences

-- Drop table if exists (for clean re-runs)
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Key to auth.users
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Identity & Contact Information
  full_name TEXT NOT NULL DEFAULT 'User',
  professional_title TEXT DEFAULT '',
  pronouns TEXT DEFAULT '',
  date_of_birth DATE,
  dob_private BOOLEAN DEFAULT true,
  phone_number TEXT DEFAULT '',
  website TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  email TEXT NOT NULL,
  
  -- Profile Photo
  profile_image_url TEXT DEFAULT '',
  
  -- Skills & Expertise (stored as JSON arrays)
  skills JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  
  -- Focus Preferences
  deep_work_mode BOOLEAN DEFAULT false,
  quiet_mode BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Index on user_id for faster lookups
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Index on email for searches
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Function: Auto-create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Note: Uncomment below to insert sample data for testing
-- Make sure to replace 'YOUR_USER_ID' with an actual user_id from auth.users

/*
INSERT INTO public.user_profiles (
  user_id,
  email,
  full_name,
  professional_title,
  pronouns,
  date_of_birth,
  dob_private,
  phone_number,
  website,
  bio,
  profile_image_url,
  skills,
  interests,
  deep_work_mode,
  quiet_mode,
  weekly_digest
) VALUES (
  'YOUR_USER_ID',
  'demo@kaal.work',
  'Johnathan Doe',
  'Senior Product Architect',
  'He/Him',
  '1992-06-15',
  true,
  '+1 (415) 555-8920',
  'https://johndoe.design',
  'Passionate about building minimalist interfaces and optimizing workflow efficiency. Deep work enthusiast.',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  '["UI Design", "Product Strategy", "React", "TypeScript", "Figma"]'::jsonb,
  '["Machine Learning", "System Design", "Accessibility"]'::jsonb,
  false,
  true,
  false
);
*/
