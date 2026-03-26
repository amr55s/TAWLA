DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'restaurants'
      AND policyname = 'super_admin_select_all_restaurants'
  ) THEN
    CREATE POLICY "super_admin_select_all_restaurants"
      ON public.restaurants
      FOR SELECT
      USING (
        COALESCE(((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean), false)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'restaurants'
      AND policyname = 'super_admin_update_all_restaurants'
  ) THEN
    CREATE POLICY "super_admin_update_all_restaurants"
      ON public.restaurants
      FOR UPDATE
      USING (
        COALESCE(((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean), false)
      )
      WITH CHECK (
        COALESCE(((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean), false)
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_override_subscription(
  p_restaurant_id uuid,
  p_plan public.restaurant_plan,
  p_expires_at timestamptz,
  p_is_active boolean
)
RETURNS public.restaurants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant public.restaurants;
  v_is_super_admin boolean := COALESCE(
    ((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean),
    false
  );
BEGIN
  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.restaurants
  SET
    plan = p_plan,
    trial_ends_at = CASE WHEN p_plan = 'trial' THEN p_expires_at ELSE NULL END,
    current_period_end = CASE WHEN p_plan = 'trial' THEN NULL ELSE p_expires_at END,
    subscription_plan = CASE WHEN p_plan = 'trial' THEN NULL ELSE p_plan::text END,
    subscription_status = CASE
      WHEN p_plan = 'trial' AND p_expires_at < NOW() THEN 'expired'
      WHEN p_plan = 'trial' THEN 'trialing'
      WHEN p_expires_at < NOW() THEN 'past_due'
      ELSE 'active'
    END,
    is_active = p_is_active,
    updated_at = NOW()
  WHERE id = p_restaurant_id
  RETURNING * INTO v_restaurant;

  IF v_restaurant.id IS NULL THEN
    RAISE EXCEPTION 'Restaurant not found';
  END IF;

  RETURN v_restaurant;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_override_subscription(uuid, public.restaurant_plan, timestamptz, boolean) TO authenticated;
