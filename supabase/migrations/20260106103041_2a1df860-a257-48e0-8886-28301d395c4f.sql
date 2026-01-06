-- Add new columns to campaigns table for expanded campaign types
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_category text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'tiktok',
ADD COLUMN IF NOT EXISTS content_style text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS video_quality text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS event_date date,
ADD COLUMN IF NOT EXISTS event_location text,
ADD COLUMN IF NOT EXISTS app_store_url text,
ADD COLUMN IF NOT EXISTS app_name text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS movie_title text,
ADD COLUMN IF NOT EXISTS trailer_url text,
ADD COLUMN IF NOT EXISTS streaming_link text,
ADD COLUMN IF NOT EXISTS requires_physical_product boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_physical_coverage boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS production_package text,
ADD COLUMN IF NOT EXISTS production_location text,
ADD COLUMN IF NOT EXISTS escrow_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'pending';

-- Create logistics_tracking table for physical products
CREATE TABLE IF NOT EXISTS public.logistics_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.campaign_applications(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_product',
  shipping_address text,
  tracking_number text,
  carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create campaign_pricing table for configurable pricing
CREATE TABLE IF NOT EXISTS public.campaign_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_type text NOT NULL,
  content_style text NOT NULL,
  influencer_tier text NOT NULL,
  base_price numeric NOT NULL DEFAULT 1000,
  region text DEFAULT 'NG',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_type, content_style, influencer_tier, region)
);

-- Create production_packages table for physical coverage campaigns
CREATE TABLE IF NOT EXISTS public.production_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  includes text[],
  crew_size integer DEFAULT 1,
  video_quality text DEFAULT 'hd',
  delivery_days integer DEFAULT 7,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.logistics_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for logistics_tracking
CREATE POLICY "Users can view their own logistics" ON public.logistics_tracking
  FOR SELECT USING (
    influencer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = logistics_tracking.campaign_id AND campaigns.creator_id = auth.uid())
  );

CREATE POLICY "Campaign owners can create logistics" ON public.logistics_tracking
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.creator_id = auth.uid())
  );

CREATE POLICY "Campaign owners can update logistics" ON public.logistics_tracking
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = logistics_tracking.campaign_id AND campaigns.creator_id = auth.uid())
  );

-- RLS policies for campaign_pricing (public read)
CREATE POLICY "Anyone can view active pricing" ON public.campaign_pricing
  FOR SELECT USING (is_active = true);

-- RLS policies for production_packages (public read)
CREATE POLICY "Anyone can view active packages" ON public.production_packages
  FOR SELECT USING (is_active = true);

-- Insert default campaign pricing
INSERT INTO public.campaign_pricing (campaign_type, content_style, influencer_tier, base_price, region) VALUES
  -- Music campaigns
  ('music', 'dance', 'starter', 1000, 'NG'),
  ('music', 'dance', 'mid', 3000, 'NG'),
  ('music', 'dance', 'top', 8000, 'NG'),
  ('music', 'dance', 'super', 20000, 'NG'),
  ('music', 'lip_sync', 'starter', 800, 'NG'),
  ('music', 'lip_sync', 'mid', 2500, 'NG'),
  ('music', 'lip_sync', 'top', 6000, 'NG'),
  ('music', 'lip_sync', 'super', 15000, 'NG'),
  -- Product campaigns
  ('product', 'review', 'starter', 2000, 'NG'),
  ('product', 'review', 'mid', 5000, 'NG'),
  ('product', 'review', 'top', 12000, 'NG'),
  ('product', 'review', 'super', 30000, 'NG'),
  ('product', 'unboxing', 'starter', 2500, 'NG'),
  ('product', 'unboxing', 'mid', 6000, 'NG'),
  ('product', 'unboxing', 'top', 15000, 'NG'),
  ('product', 'unboxing', 'super', 35000, 'NG'),
  -- App campaigns
  ('app', 'demo', 'starter', 1500, 'NG'),
  ('app', 'demo', 'mid', 4000, 'NG'),
  ('app', 'demo', 'top', 10000, 'NG'),
  ('app', 'demo', 'super', 25000, 'NG'),
  ('app', 'tutorial', 'starter', 2000, 'NG'),
  ('app', 'tutorial', 'mid', 5000, 'NG'),
  ('app', 'tutorial', 'top', 12000, 'NG'),
  ('app', 'tutorial', 'super', 30000, 'NG'),
  -- Website campaigns
  ('website', 'promo', 'starter', 1500, 'NG'),
  ('website', 'promo', 'mid', 4000, 'NG'),
  ('website', 'promo', 'top', 10000, 'NG'),
  ('website', 'promo', 'super', 25000, 'NG'),
  -- Event campaigns
  ('event', 'announcement', 'starter', 1500, 'NG'),
  ('event', 'announcement', 'mid', 4000, 'NG'),
  ('event', 'announcement', 'top', 10000, 'NG'),
  ('event', 'announcement', 'super', 25000, 'NG'),
  ('event', 'hype', 'starter', 2000, 'NG'),
  ('event', 'hype', 'mid', 5000, 'NG'),
  ('event', 'hype', 'top', 12000, 'NG'),
  ('event', 'hype', 'super', 30000, 'NG'),
  -- Movie campaigns
  ('movie', 'trailer', 'starter', 2000, 'NG'),
  ('movie', 'trailer', 'mid', 5000, 'NG'),
  ('movie', 'trailer', 'top', 12000, 'NG'),
  ('movie', 'trailer', 'super', 30000, 'NG'),
  ('movie', 'review', 'starter', 2500, 'NG'),
  ('movie', 'review', 'mid', 6000, 'NG'),
  ('movie', 'review', 'top', 15000, 'NG'),
  ('movie', 'review', 'super', 35000, 'NG')
ON CONFLICT (campaign_type, content_style, influencer_tier, region) DO NOTHING;

-- Insert default production packages
INSERT INTO public.production_packages (name, description, price, includes, crew_size, video_quality, delivery_days) VALUES
  ('Basic Coverage', 'Single camera coverage with basic editing', 50000, ARRAY['1 camera', 'Basic editing', 'Music overlay', '1 minute video'], 1, 'hd', 5),
  ('Standard Coverage', 'Multi-camera with professional editing', 150000, ARRAY['2 cameras', 'Professional editing', 'Color grading', 'Sound design', '3 minute video'], 2, 'hd', 7),
  ('Premium Coverage', 'Cinematic production with full crew', 350000, ARRAY['3+ cameras', 'Cinematic editing', 'Drone footage', 'Color grading', 'Sound design', 'Motion graphics', '5 minute video'], 4, '4k', 14),
  ('Enterprise Coverage', 'Full production team with live streaming', 750000, ARRAY['Full production team', 'Live streaming', 'Multiple locations', 'Same-day highlights', 'Extended video options'], 8, '4k', 21)
ON CONFLICT DO NOTHING;

-- Create function to calculate campaign pricing
CREATE OR REPLACE FUNCTION public.get_campaign_price(
  p_campaign_type text,
  p_content_style text,
  p_influencer_tier text,
  p_region text DEFAULT 'NG'
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
BEGIN
  SELECT base_price INTO v_price
  FROM campaign_pricing
  WHERE campaign_type = p_campaign_type
    AND content_style = p_content_style
    AND influencer_tier = p_influencer_tier
    AND region = p_region
    AND is_active = true;
  
  IF v_price IS NULL THEN
    -- Return default price if no specific pricing found
    RETURN 1000;
  END IF;
  
  RETURN v_price;
END;
$$;

-- Create trigger for logistics updated_at
CREATE TRIGGER update_logistics_tracking_updated_at
  BEFORE UPDATE ON public.logistics_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for campaign_pricing updated_at
CREATE TRIGGER update_campaign_pricing_updated_at
  BEFORE UPDATE ON public.campaign_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for production_packages updated_at
CREATE TRIGGER update_production_packages_updated_at
  BEFORE UPDATE ON public.production_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();