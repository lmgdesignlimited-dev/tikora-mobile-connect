-- Add profile claiming and monetization features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_claim_status text DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_claim_fee numeric DEFAULT 5000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS audiomack_status text DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS audiomack_fee numeric DEFAULT 20000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS audiomack_username text;

-- Add campaign pricing tiers and types
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS campaign_subtype text DEFAULT 'standard';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS influencer_tier text DEFAULT 'starter';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS videos_requested integer DEFAULT 1;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS videos_submitted integer DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS videos_approved integer DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS cost_per_video numeric DEFAULT 1000;

-- Create profile claims table for tracking claims
CREATE TABLE IF NOT EXISTS public.profile_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  claim_type text NOT NULL, -- 'tiktok' or 'audiomack'
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  fee_amount numeric NOT NULL,
  submission_data jsonb DEFAULT '{}',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_claims
CREATE POLICY "Users can view their own claims" 
ON public.profile_claims 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own claims" 
ON public.profile_claims 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims" 
ON public.profile_claims 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create video submissions table for better tracking
CREATE TABLE IF NOT EXISTS public.video_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL,
  influencer_id uuid NOT NULL,
  video_url text NOT NULL,
  platform text NOT NULL, -- 'tiktok', 'instagram', 'youtube'
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_feedback text,
  earnings numeric DEFAULT 0,
  submission_date timestamp with time zone DEFAULT now(),
  approved_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_submissions
CREATE POLICY "Users can view relevant video submissions" 
ON public.video_submissions 
FOR SELECT 
USING (
  influencer_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = video_submissions.campaign_id 
    AND campaigns.creator_id = auth.uid()
  )
);

CREATE POLICY "Influencers can create submissions" 
ON public.video_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = influencer_id);

CREATE POLICY "Users can update relevant submissions" 
ON public.video_submissions 
FOR UPDATE 
USING (
  influencer_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = video_submissions.campaign_id 
    AND campaigns.creator_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_profile_claims_updated_at
BEFORE UPDATE ON public.profile_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_submissions_updated_at
BEFORE UPDATE ON public.video_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();