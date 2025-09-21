-- Extend existing tables and add new tables for the complete Tikora workflow

-- Update profiles table to include additional fields for user tiers and verification
ALTER TABLE public.profiles 
ADD COLUMN tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'rising_star', 'super')),
ADD COLUMN instagram_handle TEXT,
ADD COLUMN tiktok_handle TEXT,
ADD COLUMN youtube_handle TEXT,
ADD COLUMN niche TEXT,
ADD COLUMN location_city TEXT,
ADD COLUMN location_country TEXT DEFAULT 'Nigeria',
ADD COLUMN delivery_address TEXT,
ADD COLUMN bank_account_name TEXT,
ADD COLUMN bank_account_number TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN content_creation_rate NUMERIC DEFAULT 0,
ADD COLUMN minimum_videos_per_campaign INTEGER DEFAULT 1,
ADD COLUMN kyc_verified BOOLEAN DEFAULT false,
ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0;

-- Create campaigns table for both song promotion and business campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('song_promotion', 'product_promotion', 'video_only')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Song promotion specific fields
    song_url TEXT,
    song_title TEXT,
    artist_name TEXT,
    
    -- Product promotion specific fields
    product_name TEXT,
    product_description TEXT,
    product_images JSONB DEFAULT '[]',
    requires_product_delivery BOOLEAN DEFAULT false,
    
    -- Campaign requirements
    target_audience TEXT,
    content_guidelines TEXT,
    hashtags TEXT[] DEFAULT '{}',
    required_platforms TEXT[] DEFAULT '{}',
    videos_per_influencer INTEGER DEFAULT 1,
    
    -- Budget and targeting
    total_budget NUMERIC NOT NULL,
    budget_per_influencer NUMERIC,
    max_influencers INTEGER DEFAULT 10,
    target_cities TEXT[] DEFAULT '{}',
    target_tiers TEXT[] DEFAULT '{}',
    target_niches TEXT[] DEFAULT '{}',
    target_demographics JSONB DEFAULT '{}',
    
    -- Campaign status and dates
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
    application_deadline DATE,
    campaign_start_date DATE,
    campaign_end_date DATE,
    
    -- Tracking
    current_applications INTEGER DEFAULT 0,
    approved_influencers INTEGER DEFAULT 0,
    completed_videos INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Campaigns are viewable by everyone or creator" 
ON public.campaigns FOR SELECT 
USING (visibility = 'public' OR creator_id = auth.uid());

CREATE POLICY "Users can create their own campaigns" 
ON public.campaigns FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own campaigns" 
ON public.campaigns FOR UPDATE 
USING (auth.uid() = creator_id);

-- Create campaign applications table
CREATE TABLE IF NOT EXISTS public.campaign_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Application details
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    proposed_rate NUMERIC,
    estimated_reach INTEGER,
    portfolio_links TEXT[] DEFAULT '{}',
    proposal TEXT,
    
    -- Content submission
    submitted_content JSONB DEFAULT '[]',
    submission_date TIMESTAMP WITH TIME ZONE,
    
    -- Payment and rating
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'escrowed', 'paid', 'disputed')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(campaign_id, influencer_id)
);

-- Enable RLS for campaign applications
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign applications
CREATE POLICY "Users can view applications for their campaigns or their own applications" 
ON public.campaign_applications FOR SELECT 
USING (
    influencer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_applications.campaign_id AND campaigns.creator_id = auth.uid())
);

CREATE POLICY "Influencers can create applications" 
ON public.campaign_applications FOR INSERT 
WITH CHECK (auth.uid() = influencer_id);

CREATE POLICY "Users can update their own applications or campaign creator can update" 
ON public.campaign_applications FOR UPDATE 
USING (
    influencer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_applications.campaign_id AND campaigns.creator_id = auth.uid())
);

-- Create wallet transactions table for comprehensive payment tracking
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'commission', 'promotion_fee', 'escrow_hold', 'escrow_release')),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'NGN',
    description TEXT,
    
    -- Reference information
    reference_id TEXT UNIQUE,
    campaign_id UUID REFERENCES campaigns(id),
    payment_method TEXT CHECK (payment_method IN ('korapay', 'flutterwave', 'bank_transfer', 'wallet')),
    
    -- Payment gateway data
    gateway_reference TEXT,
    gateway_response JSONB DEFAULT '{}',
    
    -- Status and metadata
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for wallet transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet transactions
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.wallet_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create promotions table for video promotion feature
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    
    -- Promotion details
    video_url TEXT NOT NULL,
    promotion_type TEXT NOT NULL CHECK (promotion_type IN ('views', 'clicks', 'engagement')),
    target_quantity INTEGER NOT NULL,
    cost_per_unit NUMERIC NOT NULL DEFAULT 1,
    total_cost NUMERIC NOT NULL,
    
    -- Targeting options
    target_demographics JSONB DEFAULT '{}',
    target_locations TEXT[] DEFAULT '{}',
    target_interests TEXT[] DEFAULT '{}',
    
    -- Tracking and status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
    current_quantity INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    analytics_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Create policies for promotions
CREATE POLICY "Users can view their own promotions" 
ON public.promotions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own promotions" 
ON public.promotions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promotions" 
ON public.promotions FOR UPDATE 
USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Notification details
    type TEXT NOT NULL CHECK (type IN ('campaign_match', 'application_status', 'payment_update', 'delivery_update', 'promotion_update', 'system_alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Additional data
    data JSONB DEFAULT '{}',
    action_url TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Create delivery tracking table for product campaigns
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Delivery details
    status TEXT DEFAULT 'awaiting_pickup' CHECK (status IN ('awaiting_pickup', 'in_transit', 'delivered', 'failed', 'returned')),
    tracking_number TEXT UNIQUE,
    delivery_address TEXT NOT NULL,
    
    -- Logistics information
    logistics_partner TEXT DEFAULT 'tikora_logistics',
    estimated_delivery_date DATE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_notes TEXT,
    
    -- Timestamps
    pickup_date TIMESTAMP WITH TIME ZONE,
    dispatch_date TIMESTAMP WITH TIME ZONE,
    delivery_confirmed_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(campaign_id, application_id)
);

-- Enable RLS for delivery tracking
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery tracking
CREATE POLICY "Users can view delivery tracking for their campaigns or applications" 
ON public.delivery_tracking FOR SELECT 
USING (
    influencer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = delivery_tracking.campaign_id AND campaigns.creator_id = auth.uid())
);

-- Create admin activities table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Activity details
    action_type TEXT NOT NULL CHECK (action_type IN ('user_approval', 'user_suspension', 'content_approval', 'dispute_resolution', 'payment_processing', 'campaign_moderation')),
    target_user_id UUID REFERENCES profiles(user_id),
    target_campaign_id UUID REFERENCES campaigns(id),
    target_application_id UUID REFERENCES campaign_applications(id),
    
    -- Action details
    description TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for admin activities
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

-- Create blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Post content
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    
    -- Metadata
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for blog posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for blog posts
CREATE POLICY "Published blog posts are viewable by everyone" 
ON public.blog_posts FOR SELECT 
USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Users can create their own blog posts" 
ON public.blog_posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own blog posts" 
ON public.blog_posts FOR UPDATE 
USING (auth.uid() = author_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_applications_updated_at BEFORE UPDATE ON public.campaign_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delivery_tracking_updated_at BEFORE UPDATE ON public.delivery_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();