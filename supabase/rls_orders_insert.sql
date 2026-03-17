-- Safety net: RLS INSERT policies for orders and order_items
-- Run this in the Supabase SQL Editor if guest checkout fails with permission errors.
-- These policies may already exist from the initial migration; Supabase will error
-- harmlessly if they are duplicates.

-- Allow anyone (including anonymous/guest users) to create orders
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Allow anyone to create order_items
CREATE POLICY "Anyone can create order_items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Allow public to read their own orders (for QR confirmation page)
CREATE POLICY "Public read access for orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Public read access for order_items"
  ON order_items FOR SELECT
  USING (true);
