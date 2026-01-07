-- Add rejection reasons and resubmission tracking to video_submissions
ALTER TABLE public.video_submissions 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS rejection_category text,
ADD COLUMN IF NOT EXISTS resubmission_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_resubmissions integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS original_submission_id uuid REFERENCES public.video_submissions(id),
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_admin_override boolean DEFAULT false;

-- Create rejection_reasons lookup table for consistent rejection options
CREATE TABLE IF NOT EXISTS public.rejection_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  reason text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rejection_reasons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active rejection reasons
CREATE POLICY "Anyone can view active rejection reasons"
  ON public.rejection_reasons FOR SELECT
  USING (is_active = true);

-- Insert default rejection reasons
INSERT INTO public.rejection_reasons (category, reason, description) VALUES
  ('brief', 'Brief not followed', 'The content does not follow the campaign brief or requirements'),
  ('brief', 'Missing CTA', 'The video is missing the required call-to-action'),
  ('brief', 'Wrong hashtags', 'The required hashtags were not used or used incorrectly'),
  ('quality', 'Poor video quality', 'Video resolution, lighting, or audio quality is below standards'),
  ('quality', 'Low engagement potential', 'The content does not appear likely to generate engagement'),
  ('content', 'Wrong sound/song', 'The specified sound or song was not used correctly'),
  ('content', 'Wrong platform', 'Content was posted on the wrong platform'),
  ('content', 'Content too short', 'Video duration does not meet minimum requirements'),
  ('content', 'Inappropriate content', 'Contains inappropriate, offensive, or brand-unsafe content'),
  ('technical', 'Link not accessible', 'The submitted video link is broken or private'),
  ('technical', 'Video deleted', 'The video has been deleted or is no longer available'),
  ('other', 'Other', 'Custom reason provided by reviewer');

-- Create content_reviews table for tracking review history
CREATE TABLE IF NOT EXISTS public.content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.video_submissions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewer_type text NOT NULL DEFAULT 'advertiser', -- 'advertiser' or 'admin'
  action text NOT NULL, -- 'approve', 'reject', 'admin_override'
  rejection_reason_id uuid REFERENCES public.rejection_reasons(id),
  custom_feedback text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view reviews for their submissions or campaigns
CREATE POLICY "Users can view relevant content reviews"
  ON public.content_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_submissions vs
      WHERE vs.id = content_reviews.submission_id
      AND (
        vs.influencer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM campaigns c
          WHERE c.id = vs.campaign_id AND c.creator_id = auth.uid()
        )
      )
    )
  );

-- Advertisers can create reviews for their campaign submissions
CREATE POLICY "Advertisers can create reviews for their campaigns"
  ON public.content_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_submissions vs
      JOIN campaigns c ON c.id = vs.campaign_id
      WHERE vs.id = content_reviews.submission_id
      AND c.creator_id = auth.uid()
    )
  );

-- Create updated_at trigger for rejection_reasons
CREATE TRIGGER update_rejection_reasons_updated_at
  BEFORE UPDATE ON public.rejection_reasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle content approval/rejection
CREATE OR REPLACE FUNCTION public.review_content(
  p_submission_id uuid,
  p_action text,
  p_rejection_reason_id uuid DEFAULT NULL,
  p_custom_feedback text DEFAULT NULL,
  p_is_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission RECORD;
  v_campaign RECORD;
  v_rejection_reason RECORD;
  v_review_id uuid;
  v_can_resubmit boolean;
BEGIN
  -- Get submission details
  SELECT * INTO v_submission FROM video_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission not found');
  END IF;

  -- Get campaign details
  SELECT * INTO v_campaign FROM campaigns WHERE id = v_submission.campaign_id;
  
  -- Check authorization (admin or campaign owner)
  IF NOT p_is_admin AND v_campaign.creator_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to review this submission');
  END IF;

  -- Get rejection reason if provided
  IF p_rejection_reason_id IS NOT NULL THEN
    SELECT * INTO v_rejection_reason FROM rejection_reasons WHERE id = p_rejection_reason_id;
  END IF;

  -- Create review record
  INSERT INTO content_reviews (
    submission_id, reviewer_id, reviewer_type, action, rejection_reason_id, custom_feedback
  ) VALUES (
    p_submission_id, 
    auth.uid(), 
    CASE WHEN p_is_admin THEN 'admin' ELSE 'advertiser' END,
    p_action,
    p_rejection_reason_id,
    p_custom_feedback
  ) RETURNING id INTO v_review_id;

  -- Update submission based on action
  IF p_action = 'approve' THEN
    UPDATE video_submissions SET
      status = 'approved',
      approved_date = now(),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      is_admin_override = p_is_admin AND v_submission.status = 'rejected'
    WHERE id = p_submission_id;

    -- Update campaign stats
    UPDATE campaigns SET
      videos_approved = COALESCE(videos_approved, 0) + 1
    WHERE id = v_submission.campaign_id;

    -- Credit influencer earnings (70% of cost_per_video)
    UPDATE profiles SET
      wallet_balance = COALESCE(wallet_balance, 0) + (v_campaign.cost_per_video * 0.7),
      total_earnings = COALESCE(total_earnings, 0) + (v_campaign.cost_per_video * 0.7),
      completed_campaigns = COALESCE(completed_campaigns, 0) + 1
    WHERE user_id = v_submission.influencer_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'approved',
      'review_id', v_review_id,
      'earnings_credited', v_campaign.cost_per_video * 0.7
    );

  ELSIF p_action = 'reject' THEN
    -- Check if resubmission is allowed
    v_can_resubmit := v_submission.resubmission_count < v_submission.max_resubmissions;

    UPDATE video_submissions SET
      status = 'rejected',
      rejection_reason = COALESCE(v_rejection_reason.reason, p_custom_feedback),
      rejection_category = v_rejection_reason.category,
      admin_feedback = p_custom_feedback,
      reviewed_by = auth.uid(),
      reviewed_at = now()
    WHERE id = p_submission_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'rejected',
      'review_id', v_review_id,
      'can_resubmit', v_can_resubmit,
      'resubmissions_remaining', v_submission.max_resubmissions - v_submission.resubmission_count,
      'rejection_reason', COALESCE(v_rejection_reason.reason, p_custom_feedback)
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
END;
$$;

-- Create function for influencer to resubmit content
CREATE OR REPLACE FUNCTION public.resubmit_content(
  p_original_submission_id uuid,
  p_new_video_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission RECORD;
  v_new_submission_id uuid;
BEGIN
  -- Get original submission
  SELECT * INTO v_submission FROM video_submissions WHERE id = p_original_submission_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Original submission not found');
  END IF;

  -- Check if user owns the submission
  IF v_submission.influencer_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Check if submission was rejected
  IF v_submission.status != 'rejected' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only rejected submissions can be resubmitted');
  END IF;

  -- Check resubmission limit
  IF v_submission.resubmission_count >= v_submission.max_resubmissions THEN
    RETURN jsonb_build_object('success', false, 'error', 'Maximum resubmissions reached');
  END IF;

  -- Create new submission
  INSERT INTO video_submissions (
    campaign_id, influencer_id, video_url, platform, status,
    resubmission_count, max_resubmissions, original_submission_id
  ) VALUES (
    v_submission.campaign_id,
    v_submission.influencer_id,
    p_new_video_url,
    v_submission.platform,
    'pending',
    v_submission.resubmission_count + 1,
    v_submission.max_resubmissions,
    COALESCE(v_submission.original_submission_id, v_submission.id)
  ) RETURNING id INTO v_new_submission_id;

  -- Update original submission to mark as resubmitted
  UPDATE video_submissions SET
    status = 'resubmitted'
  WHERE id = p_original_submission_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_submission_id', v_new_submission_id,
    'resubmission_count', v_submission.resubmission_count + 1,
    'remaining_resubmissions', v_submission.max_resubmissions - v_submission.resubmission_count - 1
  );
END;
$$;