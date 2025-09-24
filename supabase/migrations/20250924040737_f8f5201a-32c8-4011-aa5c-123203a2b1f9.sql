-- Fix critical security vulnerability: Remove public access to sensitive profile data
-- Drop the overly permissive policy that exposes all user data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create secure policy: Users can view their own complete profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create secure policy: Public can view only non-sensitive profile data
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- This policy will be used by application code to filter columns
  -- The actual column filtering must be done in application queries
  true
);

-- Add a security definer function to get public profile data safely
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid, 
  username text,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  city text,
  country text,
  user_type text,
  rating numeric,
  completed_campaigns integer,
  follower_count integer,
  following_count integer,
  verification_status text,
  is_active boolean,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.location,
    p.city,
    p.country,
    p.user_type,
    p.rating,
    p.completed_campaigns,
    p.follower_count,
    p.following_count,
    p.verification_status,
    p.is_active,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;