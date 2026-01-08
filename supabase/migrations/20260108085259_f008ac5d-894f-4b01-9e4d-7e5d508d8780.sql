-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'analyst', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), '{}')
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin_logs table for audit trail
CREATE TABLE public.admin_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and moderators can view logs"
ON public.admin_logs
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator') OR
    public.has_role(auth.uid(), 'analyst')
);

CREATE POLICY "Admins can create logs"
ON public.admin_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Create system_metrics table for monitoring
CREATE TABLE public.system_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type text NOT NULL,
    metric_value numeric NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    recorded_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and analysts can view metrics"
ON public.system_metrics
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'analyst')
);

-- Function to get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats jsonb;
BEGIN
    -- Check if user is admin or moderator
    IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'analyst')) THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'active_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true),
        'total_campaigns', (SELECT COUNT(*) FROM campaigns),
        'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
        'pending_submissions', (SELECT COUNT(*) FROM video_submissions WHERE status = 'pending'),
        'approved_submissions', (SELECT COUNT(*) FROM video_submissions WHERE status = 'approved'),
        'rejected_submissions', (SELECT COUNT(*) FROM video_submissions WHERE status = 'rejected'),
        'total_applications', (SELECT COUNT(*) FROM campaign_applications),
        'pending_applications', (SELECT COUNT(*) FROM campaign_applications WHERE status = 'pending'),
        'platform_revenue', (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE transaction_type = 'platform_fee'),
        'user_breakdown', (
            SELECT jsonb_object_agg(user_type, cnt)
            FROM (SELECT user_type, COUNT(*) as cnt FROM profiles GROUP BY user_type) t
        )
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;

-- Function to get moderation queue
CREATE OR REPLACE FUNCTION public.get_moderation_queue(p_status text DEFAULT 'pending', p_limit int DEFAULT 50)
RETURNS TABLE (
    submission_id uuid,
    video_url text,
    platform text,
    status text,
    submission_date timestamp with time zone,
    campaign_id uuid,
    campaign_title text,
    campaign_type text,
    influencer_id uuid,
    influencer_name text,
    influencer_username text,
    resubmission_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is admin or moderator
    IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        vs.id as submission_id,
        vs.video_url,
        vs.platform,
        vs.status,
        vs.submission_date,
        c.id as campaign_id,
        c.title as campaign_title,
        c.campaign_type,
        p.user_id as influencer_id,
        p.full_name as influencer_name,
        p.username as influencer_username,
        vs.resubmission_count
    FROM video_submissions vs
    JOIN campaigns c ON c.id = vs.campaign_id
    JOIN profiles p ON p.user_id = vs.influencer_id
    WHERE vs.status = p_status
    ORDER BY vs.created_at ASC
    LIMIT p_limit;
END;
$$;