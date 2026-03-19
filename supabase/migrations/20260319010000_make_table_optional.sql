-- Migration to allow Walk-in/Takeaway orders by making table_id optional
-- Migration: 20260319010000_make_table_optional.sql

-- 1. Drop NOT NULL constraint from orders.table_id
ALTER TABLE public.orders ALTER COLUMN table_id DROP NOT NULL;

-- 2. Drop NOT NULL constraint from waiter_calls.table_id (if needed, but user specifically asked for orders)
-- Actually, waiter_calls usually ALWAYS need a table, but for consistency if we ever have "call" from a walk-in kiosk? 
-- Let's stick to orders as requested.

-- 3. Update RLS potentially? 
-- The current policies in initial_schema.sql are broad enough:
-- CREATE POLICY "Public read access for tables" ON tables FOR SELECT USING (true);
-- CREATE POLICY "Public read access for orders" ON orders FOR SELECT USING (true);
