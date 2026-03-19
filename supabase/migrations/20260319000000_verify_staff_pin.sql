-- ============================================================
-- Migration: verify_staff_pin
-- ============================================================

CREATE OR REPLACE FUNCTION verify_staff_pin(
  p_restaurant_id UUID,
  p_pin TEXT,
  p_role TEXT
) RETURNS TABLE(id UUID, name TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.role::TEXT
  FROM public.restaurant_staff s
  WHERE s.restaurant_id = p_restaurant_id
    AND s.pin_code = p_pin
    AND s.role = p_role
    AND s.is_active = true;
END;
$$;
