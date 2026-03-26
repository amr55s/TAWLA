ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_payment_method
ON public.orders (restaurant_id, payment_method);
