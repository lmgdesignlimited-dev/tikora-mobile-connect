-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Create a secure public profile view policy that only exposes non-sensitive fields
-- This uses a database function to restrict which columns are accessible
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_row profiles)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', profile_row.id,
    'username', profile_row.username,
    'full_name', profile_row.full_name,
    'avatar_url', profile_row.avatar_url,
    'bio', profile_row.bio,
    'user_type', profile_row.user_type,
    'rating', profile_row.rating,
    'verification_status', profile_row.verification_status,
    'completed_campaigns', profile_row.completed_campaigns,
    'follower_count', profile_row.follower_count,
    'location', profile_row.location,
    'city', profile_row.city,
    'country', profile_row.country
  );
$$;

-- Create a view for public profile data (non-sensitive fields only)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  bio,
  user_type,
  rating,
  verification_status,
  completed_campaigns,
  follower_count,
  location,
  city,
  country,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Update the profiles table policies - only owners can see their full profile
-- The existing "Users can view their own profile" policy already handles this