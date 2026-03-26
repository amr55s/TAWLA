ALTER TABLE public.restaurants
  ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '15 days');

CREATE OR REPLACE FUNCTION public.sync_restaurant_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'trial' THEN
    NEW.max_tables := 30;
    NEW.max_orders_monthly := 300;
    IF NEW.trial_ends_at IS NULL THEN
      NEW.trial_ends_at := NOW() + INTERVAL '15 days';
    END IF;
  ELSIF NEW.plan = 'starter' THEN
    NEW.max_tables := 15;
    NEW.max_orders_monthly := NULL;
  ELSIF NEW.plan = 'pro' THEN
    NEW.max_tables := 30;
    NEW.max_orders_monthly := 300;
  ELSIF NEW.plan = 'enterprise' THEN
    NEW.max_tables := 999;
    NEW.max_orders_monthly := 9999;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE public.restaurants
SET trial_ends_at = created_at + INTERVAL '15 days'
WHERE plan = 'trial'
  AND created_at IS NOT NULL
  AND (
    trial_ends_at IS NULL OR
    ABS(EXTRACT(EPOCH FROM (trial_ends_at - (created_at + INTERVAL '14 days')))) < 60
  );
