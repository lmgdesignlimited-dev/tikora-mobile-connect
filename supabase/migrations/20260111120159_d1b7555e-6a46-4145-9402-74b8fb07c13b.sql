-- Bootstrap first admin user (one-time)
-- This allows the first authenticated user to become admin *only if* no admin exists yet.

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_admin_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  ) INTO v_admin_exists;

  IF v_admin_exists THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_at, granted_by)
  VALUES (v_user_id::text, 'admin', now(), v_user_id::text)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;