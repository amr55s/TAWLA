-- ============================================================
-- Migration: init_multi_tenant_staff
-- ============================================================

-- 1. Ensure owner_id references auth.users with ON DELETE CASCADE
ALTER TABLE public.restaurants
  DROP CONSTRAINT IF EXISTS restaurants_owner_id_fkey;

ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 2. Create restaurant_staff table
CREATE TABLE IF NOT EXISTS public.restaurant_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('waiter', 'cashier')),
  pin_code TEXT NOT NULL CHECK (pin_code ~ '^\d{4}$'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

-- 4. Strict RLS Policies
-- Owners can manage (SELECT, INSERT, UPDATE, DELETE) their own staff
DROP POLICY IF EXISTS "owners_manage_staff" ON public.restaurant_staff;
CREATE POLICY "owners_manage_staff" ON public.restaurant_staff
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- 5. Index for fast lookups by tenant
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant_id ON public.restaurant_staff(restaurant_id);
