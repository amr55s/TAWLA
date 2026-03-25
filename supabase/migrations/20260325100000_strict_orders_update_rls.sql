-- ============================================================
-- Strict RLS for orders UPDATE
-- ============================================================
-- Model:
--   Server Actions use the Supabase SERVICE_ROLE key,
--   which bypasses RLS entirely. That's how Waiter/KDS
--   status transitions happen securely.
--
--   On the client side, only the restaurant owner
--   (auth.uid() = restaurants.owner_id) may update orders.
--   All other direct-client mutations are blocked.
-- ============================================================

-- 1. Drop the dangerous permissive policy
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

-- 2. Create a strict owner-only UPDATE policy
CREATE POLICY "owner_can_update_orders"
  ON public.orders
  FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );
