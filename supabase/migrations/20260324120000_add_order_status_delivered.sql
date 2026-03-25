-- Add "delivered" for waiter pickup after kitchen marks "ready" (awaiting payment / normal active flow).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'order_status'
      AND e.enumlabel = 'delivered'
  ) THEN
    ALTER TYPE order_status ADD VALUE 'delivered';
  END IF;
END $$;
