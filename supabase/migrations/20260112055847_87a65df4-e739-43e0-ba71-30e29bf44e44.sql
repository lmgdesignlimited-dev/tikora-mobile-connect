-- Fix the bootstrap_first_admin function to properly cast user_id
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- Return false if no user is authenticated
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if any admin exists
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  
  -- Make the current user an admin
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (current_user_id, 'admin', current_user_id);
  
  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$$;

-- Create a function to get user roles (fix return type)
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Add bank account fields to profiles if not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_account_name text,
ADD COLUMN IF NOT EXISTS crypto_wallet_address text,
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'NGN';

-- Create crypto payment requests table for manual admin approval
CREATE TABLE IF NOT EXISTS public.crypto_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  crypto_type text NOT NULL DEFAULT 'USDT',
  wallet_address text NOT NULL,
  tx_hash text,
  payment_proof_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on crypto_payment_requests
ALTER TABLE public.crypto_payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own crypto requests" ON public.crypto_payment_requests;
DROP POLICY IF EXISTS "Users can create their own crypto requests" ON public.crypto_payment_requests;
DROP POLICY IF EXISTS "Admins can view all crypto requests" ON public.crypto_payment_requests;
DROP POLICY IF EXISTS "Admins can update crypto requests" ON public.crypto_payment_requests;

-- RLS policies for crypto_payment_requests
CREATE POLICY "Users can view their own crypto requests"
ON public.crypto_payment_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own crypto requests"
ON public.crypto_payment_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all crypto requests"
ON public.crypto_payment_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update crypto requests"
ON public.crypto_payment_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create onboarding_progress table for tracking wizard completion
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  user_type text NOT NULL,
  current_step integer NOT NULL DEFAULT 1,
  total_steps integer NOT NULL DEFAULT 5,
  steps_completed jsonb DEFAULT '[]'::jsonb,
  is_completed boolean DEFAULT false,
  tiktok_verified boolean DEFAULT false,
  spotify_verified boolean DEFAULT false,
  profile_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on onboarding_progress
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can create their own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update their own onboarding progress" ON public.onboarding_progress;

-- RLS policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress"
ON public.onboarding_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding progress"
ON public.onboarding_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
ON public.onboarding_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Update notifications table to add more fields
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS action_url text,
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Create trigger for updated_at on new tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS set_crypto_payment_requests_updated_at ON public.crypto_payment_requests;
CREATE TRIGGER set_crypto_payment_requests_updated_at
  BEFORE UPDATE ON public.crypto_payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_onboarding_progress_updated_at ON public.onboarding_progress;
CREATE TRIGGER set_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();