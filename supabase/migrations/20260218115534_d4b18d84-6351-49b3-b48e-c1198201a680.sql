-- Allow admins to manage campaign_pricing
CREATE POLICY "Admins can manage campaign pricing"
ON public.campaign_pricing
FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

-- Allow admins to manage coin_packages
CREATE POLICY "Admins can manage coin packages"
ON public.coin_packages
FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));