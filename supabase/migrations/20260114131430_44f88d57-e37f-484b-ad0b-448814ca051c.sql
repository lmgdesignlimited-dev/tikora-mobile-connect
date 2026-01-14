-- Create payment gateway configuration table
CREATE TABLE IF NOT EXISTS public.payment_gateway_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment gateway logs table
CREATE TABLE IF NOT EXISTS public.payment_gateway_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  reference_id TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'NGN',
  status TEXT,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create email notification logs table  
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.payment_gateway_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateway_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_gateway_config (admin only)
CREATE POLICY "Admin can view payment config"
ON public.payment_gateway_config
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can update payment config"
ON public.payment_gateway_config
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert payment config"
ON public.payment_gateway_config
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_gateway_logs (admin/finance only)
CREATE POLICY "Admin can view payment logs"
ON public.payment_gateway_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for email_notifications
CREATE POLICY "Users can view their own email notifications"
ON public.email_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all email notifications"
ON public.email_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default gateway configurations
INSERT INTO public.payment_gateway_config (gateway_name, is_active, settings)
VALUES 
  ('korapay', false, '{"display_name": "KoraPay", "supported_methods": ["card", "bank_transfer", "mobile_money"]}'),
  ('flutterwave', false, '{"display_name": "Flutterwave", "supported_methods": ["card", "bank_transfer", "ussd"]}')
ON CONFLICT (gateway_name) DO NOTHING;

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_payment_gateway_config_updated_at
BEFORE UPDATE ON public.payment_gateway_config
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to check multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
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
      AND role = ANY(_roles)
  )
$$;

-- Create function to get all admin roles for display
CREATE OR REPLACE FUNCTION public.get_all_roles()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enum_range(NULL::app_role)::text[]
$$;

-- Function to review crypto payment requests
CREATE OR REPLACE FUNCTION public.review_crypto_payment(
  p_request_id UUID,
  p_action TEXT,
  p_admin_notes TEXT DEFAULT NULL,
  p_tx_hash TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Check if user is admin or finance
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get request details
  SELECT * INTO v_request FROM crypto_payment_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already processed');
  END IF;

  IF p_action = 'approve' THEN
    -- Update request status
    UPDATE crypto_payment_requests SET
      status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      admin_notes = p_admin_notes,
      tx_hash = COALESCE(p_tx_hash, tx_hash)
    WHERE id = p_request_id;

    -- Credit user wallet
    UPDATE profiles SET
      wallet_balance = COALESCE(wallet_balance, 0) + v_request.amount
    WHERE user_id = v_request.user_id;

    -- Create wallet transaction
    INSERT INTO wallet_transactions (
      user_id, transaction_type, amount, description, status, reference_id
    ) VALUES (
      v_request.user_id, 'deposit', v_request.amount, 
      'Crypto deposit approved: ' || v_request.crypto_type,
      'completed', p_request_id::text
    );

    RETURN jsonb_build_object('success', true, 'action', 'approved', 'amount', v_request.amount);

  ELSIF p_action = 'reject' THEN
    UPDATE crypto_payment_requests SET
      status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      admin_notes = p_admin_notes
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'action', 'rejected');
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
END;
$$;

-- Function to get crypto payment requests for admin
CREATE OR REPLACE FUNCTION public.get_crypto_payment_requests(
  p_status TEXT DEFAULT 'pending',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  amount NUMERIC,
  crypto_type TEXT,
  wallet_address TEXT,
  payment_proof_url TEXT,
  tx_hash TEXT,
  status TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  user_name TEXT,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin or finance
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    cpr.id,
    cpr.user_id,
    cpr.amount,
    cpr.crypto_type,
    cpr.wallet_address,
    cpr.payment_proof_url,
    cpr.tx_hash,
    cpr.status,
    cpr.admin_notes,
    cpr.created_at,
    cpr.reviewed_at,
    p.full_name as user_name,
    p.email as user_email
  FROM crypto_payment_requests cpr
  LEFT JOIN profiles p ON p.user_id = cpr.user_id
  WHERE cpr.status = p_status
  ORDER BY cpr.created_at ASC
  LIMIT p_limit;
END;
$$;