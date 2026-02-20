
-- Add thumbnail_url to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;

-- Add admin_approval fields to campaigns (admin must approve before influencers can claim)
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT NULL;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS admin_approved_by UUID DEFAULT NULL;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT DEFAULT NULL;

-- Add influencer_category to profiles (micro / creator)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS influencer_category TEXT DEFAULT 'micro';

-- Add followers table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_id);

CREATE POLICY "Users can view follows"
ON public.user_follows FOR SELECT
USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Admins can view all follows
CREATE POLICY "Admins can view all follows"
ON public.user_follows FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add campaign_ratings table for star ratings
CREATE TABLE IF NOT EXISTS public.campaign_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL,
  rated_by UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, influencer_id, rated_by)
);

ALTER TABLE public.campaign_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign owners can rate influencers"
ON public.campaign_ratings FOR INSERT
WITH CHECK (
  auth.uid() = rated_by AND
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND creator_id = auth.uid())
);

CREATE POLICY "Users can view ratings"
ON public.campaign_ratings FOR SELECT
USING (true);

CREATE POLICY "Campaign owners can update their ratings"
ON public.campaign_ratings FOR UPDATE
USING (auth.uid() = rated_by);

-- Function to update influencer's average rating
CREATE OR REPLACE FUNCTION public.update_influencer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM campaign_ratings
    WHERE influencer_id = NEW.influencer_id
  )
  WHERE user_id = NEW.influencer_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_influencer_rating
AFTER INSERT OR UPDATE ON public.campaign_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_influencer_rating();

-- Seed payment gateway config if not exists
INSERT INTO public.payment_gateway_config (gateway_name, is_active, is_configured, test_mode, settings)
SELECT 'korapay', false, false, true, '{"display_name":"KoraPay","supported_methods":["card","bank_transfer","ussd"],"description":"Nigerian payment gateway"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.payment_gateway_config WHERE gateway_name = 'korapay');

INSERT INTO public.payment_gateway_config (gateway_name, is_active, is_configured, test_mode, settings)
SELECT 'flutterwave', false, false, true, '{"display_name":"Flutterwave","supported_methods":["card","bank_transfer","mobile_money"],"description":"Pan-African payment gateway"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.payment_gateway_config WHERE gateway_name = 'flutterwave');

-- Allow admins to view all campaigns (not just their own)
CREATE POLICY "Admins can view all campaigns"
ON public.campaigns FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'moderator'::app_role, 'operations'::app_role]));

-- Allow admins to update campaigns (approve/reject)
CREATE POLICY "Admins can update any campaign"
ON public.campaigns FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'operations'::app_role]));

-- Allow admins to view all campaign applications
CREATE POLICY "Admins can view all applications"
ON public.campaign_applications FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'operations'::app_role]));

-- Allow admins to update any application (approve/reject influencer gig applications)
CREATE POLICY "Admins can update any application"
ON public.campaign_applications FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'operations'::app_role]));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'moderator'::app_role, 'support'::app_role, 'operations'::app_role]));

-- Allow admins to update any profile (suspend, verify, etc.)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'support'::app_role]));
