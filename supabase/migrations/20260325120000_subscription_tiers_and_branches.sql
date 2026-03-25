-- Subscription tiers + branch hierarchy for Tawla

DO $$
BEGIN
  CREATE TYPE public.restaurant_plan AS ENUM ('trial', 'starter', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS plan public.restaurant_plan DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS max_tables INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS max_orders_monthly INTEGER DEFAULT 300,
  ADD COLUMN IF NOT EXISTS parent_id UUID NULL,
  ADD COLUMN IF NOT EXISTS is_master BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.restaurants
  DROP CONSTRAINT IF EXISTS restaurants_parent_id_fkey;

ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.restaurants(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_parent_id ON public.restaurants(parent_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_plan ON public.restaurants(plan);

CREATE OR REPLACE FUNCTION public.sync_restaurant_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'trial' THEN
    NEW.max_tables := 30;
    NEW.max_orders_monthly := 300;
    IF NEW.trial_ends_at IS NULL THEN
      NEW.trial_ends_at := NOW() + INTERVAL '14 days';
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

DROP TRIGGER IF EXISTS trg_sync_restaurant_plan_limits ON public.restaurants;

CREATE TRIGGER trg_sync_restaurant_plan_limits
  BEFORE INSERT OR UPDATE OF plan, trial_ends_at
  ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_restaurant_plan_limits();

DO $$
DECLARE
  has_subscription_plan BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restaurants'
      AND column_name = 'subscription_plan'
  )
  INTO has_subscription_plan;

  IF has_subscription_plan THEN
    EXECUTE $sql$
      UPDATE public.restaurants
      SET plan = CASE
        WHEN subscription_plan = 'enterprise' THEN 'enterprise'::public.restaurant_plan
        WHEN subscription_plan = 'pro' THEN 'pro'::public.restaurant_plan
        WHEN subscription_plan = 'starter' OR subscription_plan = 'free' THEN 'starter'::public.restaurant_plan
        ELSE COALESCE(plan, 'trial'::public.restaurant_plan)
      END
      WHERE subscription_plan IS NOT NULL
    $sql$;
  END IF;
END $$;

UPDATE public.restaurants
SET trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '14 days', NOW() + INTERVAL '14 days')
WHERE trial_ends_at IS NULL;

UPDATE public.restaurants
SET plan = COALESCE(plan, 'trial'::public.restaurant_plan);

UPDATE public.restaurants
SET is_master = true
WHERE id IN (
  SELECT DISTINCT parent_id
  FROM public.restaurants
  WHERE parent_id IS NOT NULL
);

UPDATE public.restaurants
SET updated_at = NOW()
WHERE plan IS NOT NULL;
