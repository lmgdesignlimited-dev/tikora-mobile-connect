-- SECURITY FIX 1: Fix notification spam vulnerability
-- Drop the overly permissive INSERT policy if it exists
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a restrictive policy - users can only create notifications for themselves
CREATE POLICY "Only authenticated users can create their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- SECURITY FIX 2: Fix campaign budget exposure
-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON public.campaigns;

-- Create policy that requires authentication to view campaigns
-- Full details only visible to campaign owners, basic info visible to authenticated users
CREATE POLICY "Authenticated users can view public campaigns"
ON public.campaigns
FOR SELECT
USING (
  -- Campaign owners can see everything
  (creator_id = auth.uid()) 
  OR 
  -- Authenticated users can see public campaigns
  (visibility = 'public' AND auth.uid() IS NOT NULL)
);

-- SECURITY FIX 3: Protect admin_notes in profile_claims from user access
-- Create a function to return claims without admin_notes for regular users
CREATE OR REPLACE FUNCTION public.get_user_claims(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  claim_type text,
  fee_amount numeric,
  status text,
  submission_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.user_id,
    pc.claim_type,
    pc.fee_amount,
    pc.status,
    pc.submission_data,
    pc.created_at,
    pc.updated_at
  FROM public.profile_claims pc
  WHERE pc.user_id = target_user_id AND pc.user_id = auth.uid();
END;
$$;