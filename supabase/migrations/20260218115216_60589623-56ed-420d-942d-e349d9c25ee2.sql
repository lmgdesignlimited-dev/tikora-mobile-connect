-- Add influencer tier and custom pricing fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS influencer_tier text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS custom_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipment_quality text DEFAULT 'basic';

-- Comment: influencer_tier auto-assigned based on follower_count
-- starter: 0-999, mid: 1000-9999, top: 10000-99999, super: 100000+
-- custom_price: influencer's self-set rate for direct/selected campaigns