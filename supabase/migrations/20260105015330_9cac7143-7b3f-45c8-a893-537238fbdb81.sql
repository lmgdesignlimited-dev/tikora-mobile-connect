-- ===========================================
-- TIKORA COIN BOOST SYSTEM - DATABASE SCHEMA
-- ===========================================

-- 1. Coin Wallets for Influencers (non-withdrawable utility tokens)
CREATE TABLE public.coin_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  coin_balance INTEGER NOT NULL DEFAULT 0,
  total_coins_purchased INTEGER NOT NULL DEFAULT 0,
  total_coins_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Coin Transactions (purchase history)
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'boost_spend', 'admin_grant', 'admin_deduct')),
  coin_amount INTEGER NOT NULL,
  naira_amount NUMERIC DEFAULT 0,
  description TEXT,
  reference_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Boost Packages (admin-configurable pricing)
CREATE TABLE public.boost_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('daily', 'weekly', 'campaign_specific')),
  coin_cost INTEGER NOT NULL,
  duration_hours INTEGER NOT NULL,
  boost_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Active Boosts (influencer boost activations)
CREATE TABLE public.influencer_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID NOT NULL,
  package_id UUID REFERENCES public.boost_packages(id),
  campaign_id UUID REFERENCES public.campaigns(id), -- NULL for general boosts
  boost_type TEXT NOT NULL CHECK (boost_type IN ('daily', 'weekly', 'campaign_specific')),
  coins_spent INTEGER NOT NULL,
  boost_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Admin Boost Settings (global controls)
CREATE TABLE public.boost_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Coin Pricing Configuration
CREATE TABLE public.coin_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coin_amount INTEGER NOT NULL,
  price_naira NUMERIC NOT NULL,
  bonus_coins INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX idx_coin_wallets_user_id ON public.coin_wallets(user_id);
CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_type ON public.coin_transactions(transaction_type);
CREATE INDEX idx_influencer_boosts_influencer_id ON public.influencer_boosts(influencer_id);
CREATE INDEX idx_influencer_boosts_active ON public.influencer_boosts(is_active, expires_at);
CREATE INDEX idx_influencer_boosts_campaign_id ON public.influencer_boosts(campaign_id);

-- ===========================================
-- ADD BOOST-RELATED COLUMNS TO PROFILES
-- ===========================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS completion_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS strike_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP WITH TIME ZONE;

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.coin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Coin Wallets: Users can only see their own wallet
CREATE POLICY "Users can view their own coin wallet"
ON public.coin_wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert coin wallet"
ON public.coin_wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coin wallet"
ON public.coin_wallets FOR UPDATE
USING (auth.uid() = user_id);

-- Coin Transactions: Users can only see their own transactions
CREATE POLICY "Users can view their own coin transactions"
ON public.coin_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coin transactions"
ON public.coin_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Boost Packages: Anyone can view active packages
CREATE POLICY "Anyone can view active boost packages"
ON public.boost_packages FOR SELECT
USING (is_active = true);

-- Coin Packages: Anyone can view active coin packages
CREATE POLICY "Anyone can view active coin packages"
ON public.coin_packages FOR SELECT
USING (is_active = true);

-- Influencer Boosts: Users can view and manage their own boosts
CREATE POLICY "Users can view their own boosts"
ON public.influencer_boosts FOR SELECT
USING (auth.uid() = influencer_id);

CREATE POLICY "Users can create their own boosts"
ON public.influencer_boosts FOR INSERT
WITH CHECK (auth.uid() = influencer_id);

CREATE POLICY "Users can update their own boosts"
ON public.influencer_boosts FOR UPDATE
USING (auth.uid() = influencer_id);

-- Boost Settings: Public read for global settings
CREATE POLICY "Anyone can view boost settings"
ON public.boost_settings FOR SELECT
USING (true);

-- ===========================================
-- INSERT DEFAULT DATA
-- ===========================================

-- Default Coin Packages
INSERT INTO public.coin_packages (name, coin_amount, price_naira, bonus_coins, is_popular) VALUES
('Starter', 100, 500, 0, false),
('Basic', 500, 2000, 50, false),
('Popular', 1000, 3500, 150, true),
('Pro', 2500, 8000, 500, false),
('Elite', 5000, 15000, 1200, false);

-- Default Boost Packages
INSERT INTO public.boost_packages (name, description, boost_type, coin_cost, duration_hours, boost_multiplier) VALUES
('Daily Boost', 'Get priority visibility for 24 hours', 'daily', 50, 24, 1.5),
('Weekly Boost', 'Stay at the top for 7 days', 'weekly', 250, 168, 2.0),
('Campaign Boost', 'Boost your visibility for a specific campaign', 'campaign_specific', 100, 72, 1.8);

-- Default Boost Settings
INSERT INTO public.boost_settings (setting_key, setting_value, description) VALUES
('boost_enabled', '{"enabled": true}', 'Global toggle for boost system'),
('max_boost_multiplier', '{"value": 3.0}', 'Maximum boost multiplier cap'),
('performance_weight', '{"completion_rate": 0.4, "rating": 0.4, "strike_penalty": 0.2}', 'Performance scoring weights'),
('boost_decay_rate', '{"hourly_decay": 0.02}', 'Boost effectiveness decay rate'),
('coin_to_boost_ratio', '{"ratio": 10}', 'Coins to boost points conversion');

-- ===========================================
-- FUNCTION: Calculate Influencer Ranking Score
-- ===========================================

CREATE OR REPLACE FUNCTION public.calculate_influencer_score(
  p_influencer_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_boost_multiplier NUMERIC := 1.0;
  v_performance_score NUMERIC;
  v_boost_score NUMERIC := 0;
  v_final_score NUMERIC;
  v_active_boost RECORD;
BEGIN
  -- Get influencer profile
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_influencer_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate performance score (0-100)
  v_performance_score := (
    COALESCE(v_profile.completion_rate, 0) * 40 +
    COALESCE(v_profile.rating, 0) * 8 +  -- rating is 0-5, multiply by 8 to get 0-40
    GREATEST(0, 20 - COALESCE(v_profile.strike_count, 0) * 10)  -- 20 points minus strikes
  );
  
  -- Get active boost multiplier (highest active boost)
  SELECT boost_multiplier INTO v_boost_multiplier
  FROM influencer_boosts
  WHERE influencer_id = p_influencer_id
    AND is_active = true
    AND expires_at > now()
  ORDER BY boost_multiplier DESC
  LIMIT 1;
  
  IF v_boost_multiplier IS NULL THEN
    v_boost_multiplier := 1.0;
  END IF;
  
  -- Calculate final score with boost
  -- Boost enhances but doesn't replace performance (capped at 2x performance)
  v_boost_score := LEAST(v_performance_score * (v_boost_multiplier - 1), v_performance_score);
  v_final_score := v_performance_score + v_boost_score;
  
  RETURN v_final_score;
END;
$$;

-- ===========================================
-- FUNCTION: Activate Boost for Influencer
-- ===========================================

CREATE OR REPLACE FUNCTION public.activate_boost(
  p_influencer_id UUID,
  p_package_id UUID,
  p_campaign_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package RECORD;
  v_wallet RECORD;
  v_boost_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if boost system is enabled
  IF NOT EXISTS (
    SELECT 1 FROM boost_settings 
    WHERE setting_key = 'boost_enabled' 
    AND (setting_value->>'enabled')::boolean = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Boost system is currently disabled');
  END IF;

  -- Get package details
  SELECT * INTO v_package FROM boost_packages WHERE id = p_package_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Boost package not found or inactive');
  END IF;
  
  -- Get user wallet
  SELECT * INTO v_wallet FROM coin_wallets WHERE user_id = p_influencer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coin wallet not found');
  END IF;
  
  -- Check sufficient balance
  IF v_wallet.coin_balance < v_package.coin_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coin balance');
  END IF;
  
  -- Calculate expiration
  v_expires_at := now() + (v_package.duration_hours || ' hours')::interval;
  
  -- Deduct coins
  UPDATE coin_wallets 
  SET coin_balance = coin_balance - v_package.coin_cost,
      total_coins_spent = total_coins_spent + v_package.coin_cost,
      updated_at = now()
  WHERE user_id = p_influencer_id;
  
  -- Create coin transaction
  INSERT INTO coin_transactions (user_id, transaction_type, coin_amount, description)
  VALUES (p_influencer_id, 'boost_spend', -v_package.coin_cost, 'Boost activation: ' || v_package.name);
  
  -- Create boost record
  INSERT INTO influencer_boosts (
    influencer_id, package_id, campaign_id, boost_type, 
    coins_spent, boost_multiplier, expires_at
  )
  VALUES (
    p_influencer_id, p_package_id, p_campaign_id, v_package.boost_type,
    v_package.coin_cost, v_package.boost_multiplier, v_expires_at
  )
  RETURNING id INTO v_boost_id;
  
  -- Update profile boost status
  UPDATE profiles 
  SET is_boosted = true, 
      boost_expires_at = v_expires_at,
      boost_score = calculate_influencer_score(p_influencer_id)
  WHERE user_id = p_influencer_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'boost_id', v_boost_id,
    'expires_at', v_expires_at,
    'coins_spent', v_package.coin_cost
  );
END;
$$;

-- ===========================================
-- FUNCTION: Get Ranked Influencers (for business selection)
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_ranked_influencers(
  p_campaign_id UUID DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  rating NUMERIC,
  completion_rate NUMERIC,
  follower_count INTEGER,
  is_boosted BOOLEAN,
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  ranking_score NUMERIC,
  boost_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.rating,
    p.completion_rate,
    p.follower_count,
    p.is_boosted,
    p.boost_expires_at,
    calculate_influencer_score(p.user_id) as ranking_score,
    (
      SELECT ib.boost_type 
      FROM influencer_boosts ib 
      WHERE ib.influencer_id = p.user_id 
        AND ib.is_active = true 
        AND ib.expires_at > now()
        AND (p_campaign_id IS NULL OR ib.campaign_id IS NULL OR ib.campaign_id = p_campaign_id)
      ORDER BY ib.boost_multiplier DESC
      LIMIT 1
    ) as boost_type
  FROM profiles p
  WHERE p.user_type = 'influencer'
    AND p.is_active = true
    AND (p_city IS NULL OR p.city = p_city)
  ORDER BY 
    -- Boosted influencers first, then by score
    CASE WHEN p.is_boosted AND p.boost_expires_at > now() THEN 0 ELSE 1 END,
    calculate_influencer_score(p.user_id) DESC
  LIMIT p_limit;
END;
$$;

-- ===========================================
-- TRIGGER: Expire Boosts Automatically
-- ===========================================

CREATE OR REPLACE FUNCTION public.check_boost_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate expired boosts
  UPDATE influencer_boosts
  SET is_active = false
  WHERE is_active = true AND expires_at <= now();
  
  -- Update profile boost status for expired boosts
  UPDATE profiles
  SET is_boosted = false, boost_expires_at = NULL
  WHERE is_boosted = true 
    AND (boost_expires_at IS NULL OR boost_expires_at <= now());
    
  RETURN NULL;
END;
$$;

-- Update timestamps trigger
CREATE TRIGGER update_coin_wallets_updated_at
BEFORE UPDATE ON public.coin_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boost_packages_updated_at
BEFORE UPDATE ON public.boost_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coin_packages_updated_at
BEFORE UPDATE ON public.coin_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();