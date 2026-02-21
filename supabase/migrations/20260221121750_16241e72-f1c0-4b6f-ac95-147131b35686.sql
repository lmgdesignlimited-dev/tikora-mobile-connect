
-- Referral system: track who referred whom and 5% commission on first order
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  commission_amount NUMERIC DEFAULT 0,
  commission_paid BOOLEAN DEFAULT false,
  first_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id),
  UNIQUE(referral_code, referred_id)
);

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referred)
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- System inserts referrals (via edge function or trigger)
CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update referrals
CREATE POLICY "Admins can update referrals" ON public.referrals
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique referral code from user_id
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := 'TIK-' || UPPER(SUBSTR(REPLACE(NEW.user_id::text, '-', ''), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Auto-generate referral code on profile creation
CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();

-- Function to process referral commission (5% of first completed campaign payment)
CREATE OR REPLACE FUNCTION public.process_referral_commission(
  p_referred_id UUID,
  p_order_amount NUMERIC,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_referral RECORD;
  v_commission NUMERIC;
BEGIN
  -- Find unpaid referral for this user
  SELECT * INTO v_referral FROM referrals
    WHERE referred_id = p_referred_id AND commission_paid = false
    LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'No pending referral');
  END IF;

  -- 5% commission
  v_commission := p_order_amount * 0.05;

  -- Mark referral as paid
  UPDATE referrals SET
    commission_amount = v_commission,
    commission_paid = true,
    first_order_id = p_order_id,
    updated_at = now()
  WHERE id = v_referral.id;

  -- Credit referrer wallet
  UPDATE profiles SET
    wallet_balance = COALESCE(wallet_balance, 0) + v_commission
  WHERE user_id = v_referral.referrer_id;

  -- Create wallet transaction for referrer
  INSERT INTO wallet_transactions (user_id, transaction_type, amount, description, status)
  VALUES (v_referral.referrer_id, 'referral_commission', v_commission,
    'Referral commission (5%) from referred user''s first order', 'completed');

  -- Notify referrer
  INSERT INTO notifications (user_id, title, message, type, icon, action_url)
  VALUES (v_referral.referrer_id, 'Referral Bonus Earned! 🎉',
    'You earned ₦' || v_commission::text || ' from your referral''s first order!',
    'wallet', 'gift', '/wallet');

  RETURN jsonb_build_object('success', true, 'commission', v_commission);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
