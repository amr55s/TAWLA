-- migration name: 20260318231000_add_onboarding_fields.sql

-- Task 1: Add cuisine_type and slug to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS cuisine_type TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Task 2: Fix RLS for restaurant_staff
DROP POLICY IF EXISTS "owners_manage_staff" ON public.restaurant_staff;
DROP POLICY IF EXISTS "owners_manage_staff_select" ON public.restaurant_staff;
DROP POLICY IF EXISTS "owners_manage_staff_insert" ON public.restaurant_staff;
DROP POLICY IF EXISTS "owners_manage_staff_update" ON public.restaurant_staff;
DROP POLICY IF EXISTS "owners_manage_staff_delete" ON public.restaurant_staff;

CREATE POLICY "owners_manage_staff_select" 
  ON public.restaurant_staff FOR SELECT 
  USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()) OR
    restaurant_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'restaurant_id')::uuid)
  );

CREATE POLICY "owners_manage_staff_insert" 
  ON public.restaurant_staff FOR INSERT 
  WITH CHECK (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );

CREATE POLICY "owners_manage_staff_update" 
  ON public.restaurant_staff FOR UPDATE 
  USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );

CREATE POLICY "owners_manage_staff_delete" 
  ON public.restaurant_staff FOR DELETE 
  USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );
