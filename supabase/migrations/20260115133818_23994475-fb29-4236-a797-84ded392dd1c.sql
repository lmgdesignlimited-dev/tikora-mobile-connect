-- =====================================================
-- ADS / PROMOTE VIDEO MODULE
-- =====================================================

-- Promotion goals enum
CREATE TYPE public.promotion_goal AS ENUM ('views', 'clicks', 'engagement');

-- Promotion status enum  
CREATE TYPE public.promotion_status AS ENUM ('pending', 'active', 'paused', 'completed', 'cancelled', 'rejected');

-- Video promotions table (simple ad system)
CREATE TABLE public.video_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    platform TEXT DEFAULT 'tiktok',
    goal promotion_goal NOT NULL DEFAULT 'views',
    budget NUMERIC NOT NULL CHECK (budget > 0),
    spent_amount NUMERIC DEFAULT 0,
    target_views INTEGER,
    target_clicks INTEGER,
    target_engagement INTEGER,
    achieved_views INTEGER DEFAULT 0,
    achieved_clicks INTEGER DEFAULT 0,
    achieved_engagement INTEGER DEFAULT 0,
    status promotion_status DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.video_promotions ENABLE ROW LEVEL SECURITY;

-- Users can view their own promotions
CREATE POLICY "Users can view own promotions"
ON public.video_promotions FOR SELECT
USING (auth.uid() = user_id);

-- Users can create promotions
CREATE POLICY "Users can create promotions"
ON public.video_promotions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own pending promotions
CREATE POLICY "Users can update own pending promotions"
ON public.video_promotions FOR UPDATE
USING (auth.uid() = user_id AND status IN ('pending', 'paused'));

-- Admins can view all promotions
CREATE POLICY "Admins can view all promotions"
ON public.video_promotions FOR SELECT
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations']::app_role[]));

-- Admins can update all promotions
CREATE POLICY "Admins can update all promotions"
ON public.video_promotions FOR UPDATE
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations']::app_role[]));

-- =====================================================
-- GROWTH SERVICES MODULE
-- =====================================================

-- Service type enum
CREATE TYPE public.service_type AS ENUM (
    'tiktok_artist_claim',
    'audiomack_monetization', 
    'capcut_template',
    'music_blog_basic',
    'music_blog_pro',
    'music_blog_premium',
    'gmb_setup',
    'google_maps_optimization',
    'business_blog_basic',
    'business_blog_pro',
    'business_blog_premium',
    'seo_content'
);

-- Service order status
CREATE TYPE public.service_order_status AS ENUM (
    'pending',
    'in_review',
    'processing',
    'completed',
    'rejected',
    'refunded'
);

-- Service packages/pricing
CREATE TABLE public.service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type service_type NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    currency TEXT DEFAULT 'NGN',
    features TEXT[],
    delivery_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    category TEXT NOT NULL, -- 'artist', 'business', 'general'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active service packages
CREATE POLICY "Anyone can view active service packages"
ON public.service_packages FOR SELECT
USING (is_active = true);

-- Admins can manage service packages
CREATE POLICY "Admins can manage service packages"
ON public.service_packages FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'super_admin']::app_role[]));

-- Service orders
CREATE TABLE public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    service_type service_type NOT NULL,
    package_id UUID REFERENCES public.service_packages(id),
    status service_order_status DEFAULT 'pending',
    price_paid NUMERIC NOT NULL,
    currency TEXT DEFAULT 'NGN',
    submission_data JSONB, -- Flexible data for each service type
    proof_documents TEXT[], -- URLs to uploaded proofs
    admin_notes TEXT,
    rejection_reason TEXT,
    assigned_to UUID, -- Staff member handling
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own service orders"
ON public.service_orders FOR SELECT
USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create service orders"
ON public.service_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all service orders"
ON public.service_orders FOR SELECT
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations', 'support']::app_role[]));

-- Admins can update orders
CREATE POLICY "Admins can update service orders"
ON public.service_orders FOR UPDATE
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations']::app_role[]));

-- =====================================================
-- INSERT DEFAULT SERVICE PACKAGES
-- =====================================================

INSERT INTO public.service_packages (service_type, name, description, price, category, features, delivery_days) VALUES
-- Artist Services
('tiktok_artist_claim', 'TikTok for Artists Claim', 'Get verified as an official artist on TikTok with access to analytics and promotional tools', 25000, 'artist', ARRAY['Official artist verification', 'Access to TikTok analytics', 'Promotional tools access', 'Priority support'], 14),
('audiomack_monetization', 'Audiomack Monetization Setup', 'Full setup of your Audiomack artist profile with monetization enabled', 15000, 'artist', ARRAY['Profile optimization', 'Monetization activation', 'Payment setup assistance', 'Strategy consultation'], 7),
('capcut_template', 'Custom CapCut Template', 'Professional custom CapCut template designed for your brand', 10000, 'artist', ARRAY['Custom branded template', 'Multiple variations', 'Usage rights', 'Tutorial included'], 5),
('music_blog_basic', 'Music Blog - Basic', 'Feature article on partner music blogs', 5000, 'artist', ARRAY['1 blog feature', 'Social media share', 'Basic SEO optimization'], 3),
('music_blog_pro', 'Music Blog - Pro', 'Premium multi-platform blog coverage', 15000, 'artist', ARRAY['3 blog features', 'Social media campaign', 'SEO optimization', 'Spotify playlist pitch'], 7),
('music_blog_premium', 'Music Blog - Premium', 'Complete press package with major outlets', 35000, 'artist', ARRAY['5+ blog features', 'Press release', 'Major outlet pitching', 'Interview feature', 'Full PR campaign'], 14),

-- Business Services
('gmb_setup', 'Google My Business Setup', 'Professional GMB profile creation and optimization', 20000, 'business', ARRAY['Profile creation', 'Category optimization', 'Photo upload', 'Post scheduling setup', 'Review strategy'], 5),
('google_maps_optimization', 'Google Maps Optimization', 'Improve your visibility in Google Maps local search', 30000, 'business', ARRAY['Local SEO audit', 'NAP consistency', 'Citation building', 'Review generation strategy', 'Monthly reporting'], 14),
('business_blog_basic', 'Business Blog - Basic', 'SEO-optimized article for your business', 8000, 'business', ARRAY['1 blog article', '500+ words', 'Basic SEO', 'Social share'], 3),
('business_blog_pro', 'Business Blog - Pro', 'Content marketing package', 25000, 'business', ARRAY['4 blog articles', '800+ words each', 'Advanced SEO', 'Keyword research', 'Internal linking'], 14),
('business_blog_premium', 'Business Blog - Premium', 'Full content strategy implementation', 50000, 'business', ARRAY['8 blog articles', '1000+ words', 'Content calendar', 'Competitor analysis', 'Link building', 'Monthly reporting'], 30),
('seo_content', 'SEO Content Package', 'Comprehensive SEO content creation', 40000, 'business', ARRAY['Site audit', '5 optimized pages', 'Meta tags', 'Schema markup', 'Performance tracking'], 21);

-- =====================================================
-- ADMIN ACTIVITY TRACKING
-- =====================================================

-- Update admin_logs to support more action types
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS module TEXT;

-- =====================================================
-- PLATFORM SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    category TEXT NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage platform settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'super_admin']::app_role[]));

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description, category) VALUES
('escrow_enabled', '{"enabled": true}', 'Enable escrow for campaign payments', 'payments'),
('platform_fee_percentage', '{"artist": 20, "business": 25, "influencer": 30}', 'Platform fee percentage by user type', 'payments'),
('min_withdrawal_amount', '{"NGN": 5000, "USD": 10}', 'Minimum withdrawal amount by currency', 'payments'),
('promotion_pricing', '{"views": 0.5, "clicks": 2, "engagement": 1}', 'Cost per goal unit for promotions', 'promotions'),
('auto_approve_threshold', '{"amount": 10000, "user_rating": 4.5}', 'Auto-approve criteria for transactions', 'automation');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get service orders for admin
CREATE OR REPLACE FUNCTION public.get_service_orders(
    p_status service_order_status DEFAULT NULL,
    p_service_type service_type DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    service_type service_type,
    service_name TEXT,
    status service_order_status,
    price_paid NUMERIC,
    submission_data JSONB,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations', 'support']::app_role[]) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        so.id,
        so.user_id,
        p.full_name as user_name,
        p.email as user_email,
        so.service_type,
        sp.name as service_name,
        so.status,
        so.price_paid,
        so.submission_data,
        so.admin_notes,
        so.created_at
    FROM service_orders so
    LEFT JOIN profiles p ON p.user_id = so.user_id
    LEFT JOIN service_packages sp ON sp.id = so.package_id
    WHERE (p_status IS NULL OR so.status = p_status)
      AND (p_service_type IS NULL OR so.service_type = p_service_type)
    ORDER BY so.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to get video promotions for admin
CREATE OR REPLACE FUNCTION public.get_video_promotions(
    p_status promotion_status DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    title TEXT,
    video_url TEXT,
    goal promotion_goal,
    budget NUMERIC,
    spent_amount NUMERIC,
    status promotion_status,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations']::app_role[]) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        vp.id,
        vp.user_id,
        p.full_name as user_name,
        vp.title,
        vp.video_url,
        vp.goal,
        vp.budget,
        vp.spent_amount,
        vp.status,
        vp.created_at
    FROM video_promotions vp
    LEFT JOIN profiles p ON p.user_id = vp.user_id
    WHERE (p_status IS NULL OR vp.status = p_status)
    ORDER BY vp.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to process service order
CREATE OR REPLACE FUNCTION public.process_service_order(
    p_order_id UUID,
    p_action TEXT,
    p_admin_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
BEGIN
    IF NOT has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations']::app_role[]) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    SELECT * INTO v_order FROM service_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF p_action = 'approve' THEN
        UPDATE service_orders SET
            status = 'processing',
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            started_at = now(),
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_order_id;
        
    ELSIF p_action = 'complete' THEN
        UPDATE service_orders SET
            status = 'completed',
            completed_at = now(),
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_order_id;
        
    ELSIF p_action = 'reject' THEN
        UPDATE service_orders SET
            status = 'rejected',
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            rejection_reason = p_rejection_reason,
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_order_id;
        
        -- Refund to wallet
        UPDATE profiles SET
            wallet_balance = COALESCE(wallet_balance, 0) + v_order.price_paid
        WHERE user_id = v_order.user_id;
        
    ELSIF p_action = 'refund' THEN
        UPDATE service_orders SET
            status = 'refunded',
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_order_id;
        
        UPDATE profiles SET
            wallet_balance = COALESCE(wallet_balance, 0) + v_order.price_paid
        WHERE user_id = v_order.user_id;
    END IF;

    -- Log admin action
    INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, module)
    VALUES (auth.uid(), p_action, 'service_order', p_order_id, 
            jsonb_build_object('notes', p_admin_notes, 'reason', p_rejection_reason),
            'services');

    RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;

-- Function to process video promotion
CREATE OR REPLACE FUNCTION public.process_video_promotion(
    p_promotion_id UUID,
    p_action TEXT,
    p_admin_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_promotion RECORD;
BEGIN
    IF NOT has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations']::app_role[]) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    SELECT * INTO v_promotion FROM video_promotions WHERE id = p_promotion_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Promotion not found');
    END IF;

    IF p_action = 'approve' THEN
        UPDATE video_promotions SET
            status = 'active',
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            start_date = now(),
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_promotion_id;
        
    ELSIF p_action = 'pause' THEN
        UPDATE video_promotions SET
            status = 'paused',
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_promotion_id;
        
    ELSIF p_action = 'complete' THEN
        UPDATE video_promotions SET
            status = 'completed',
            end_date = now(),
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_promotion_id;
        
    ELSIF p_action = 'reject' THEN
        UPDATE video_promotions SET
            status = 'rejected',
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            rejection_reason = p_rejection_reason,
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_promotion_id;
        
        -- Refund to wallet
        UPDATE profiles SET
            wallet_balance = COALESCE(wallet_balance, 0) + v_promotion.budget
        WHERE user_id = v_promotion.user_id;
        
    ELSIF p_action = 'cancel' THEN
        UPDATE video_promotions SET
            status = 'cancelled',
            end_date = now(),
            admin_notes = COALESCE(p_admin_notes, admin_notes)
        WHERE id = p_promotion_id;
        
        -- Refund remaining budget
        UPDATE profiles SET
            wallet_balance = COALESCE(wallet_balance, 0) + (v_promotion.budget - COALESCE(v_promotion.spent_amount, 0))
        WHERE user_id = v_promotion.user_id;
    END IF;

    -- Log admin action
    INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, module)
    VALUES (auth.uid(), p_action, 'video_promotion', p_promotion_id,
            jsonb_build_object('notes', p_admin_notes, 'reason', p_rejection_reason),
            'promotions');

    RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_video_promotions_updated_at
    BEFORE UPDATE ON public.video_promotions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_service_packages_updated_at
    BEFORE UPDATE ON public.service_packages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_service_orders_updated_at
    BEFORE UPDATE ON public.service_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();