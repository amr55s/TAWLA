-- ============================================================
-- Phase 1: SaaS Multi-Tenant Schema Migration
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- 1. Add owner_id and cuisine_type to restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cuisine_type TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create staff_role enum
DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('waiter', 'cashier');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create restaurant_staff table
CREATE TABLE IF NOT EXISTS public.restaurant_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role public.staff_role NOT NULL DEFAULT 'waiter',
  pin_code TEXT NOT NULL CHECK (pin_code ~ '^\d{4}$'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for restaurants
-- Owner can see their own restaurants
CREATE POLICY "owners_select_own_restaurants" ON public.restaurants
  FOR SELECT USING (owner_id = auth.uid());

-- Owner can insert their own restaurants
CREATE POLICY "owners_insert_own_restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Owner can update their own restaurants
CREATE POLICY "owners_update_own_restaurants" ON public.restaurants
  FOR UPDATE USING (owner_id = auth.uid());

-- Public can read restaurants by slug (for guest menu access)
CREATE POLICY "public_read_restaurants_by_slug" ON public.restaurants
  FOR SELECT USING (is_active = true);

-- 6. RLS Policies for restaurant_staff
CREATE POLICY "owners_manage_staff" ON public.restaurant_staff
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- 7. RLS Policies for tables
CREATE POLICY "owners_manage_tables" ON public.tables
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Public can read tables for guest access
CREATE POLICY "public_read_tables" ON public.tables
  FOR SELECT USING (true);

-- 8. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant_id ON public.restaurant_staff(restaurant_id);
