CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics(p_restaurant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue numeric;
  v_total_orders int;
  v_active_tables int;
  v_total_tables int;
  v_monthly_revenue json;
  v_recent_orders json;
  v_status_counts json;
  v_staff_on_duty json;
  v_today timestamptz := current_date;
  v_six_months_ago timestamptz := date_trunc('month', current_date - interval '5 months');
BEGIN
  -- 1. Total Revenue (Today)
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_revenue
  FROM orders
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= v_today
    AND status IN ('paid', 'completed');

  -- 2. Total Orders (Today)
  SELECT COUNT(*)
  INTO v_total_orders
  FROM orders
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= v_today;

  -- 3. Active Tables (Today, not paid/completed/cancelled)
  SELECT COUNT(DISTINCT table_id)
  INTO v_active_tables
  FROM orders
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= v_today
    AND table_id IS NOT NULL
    AND status NOT IN ('paid', 'completed', 'cancelled');

  -- 4. Total Tables
  SELECT COUNT(*)
  INTO v_total_tables
  FROM tables
  WHERE restaurant_id = p_restaurant_id;

  -- 5. Staff On Duty
  SELECT COALESCE(json_agg(row_to_json(st)), '[]'::json)
  INTO v_staff_on_duty
  FROM (
    SELECT id, name, role, is_active 
    FROM restaurant_staff
    WHERE restaurant_id = p_restaurant_id
      AND is_active = true
  ) st;

  -- 6. Status Counts (for Donut Chart, last 6 months)
  SELECT COALESCE(json_object_agg(status, count), '{}'::json)
  INTO v_status_counts
  FROM (
    SELECT COALESCE(status, 'unknown') as status, COUNT(*) as count
    FROM orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= v_six_months_ago
    GROUP BY status
  ) s;

  -- 7. Monthly Revenue (last 6 months)
  SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
  INTO v_monthly_revenue
  FROM (
    SELECT 
      to_char(date_trunc('month', created_at), 'Mon') as label,
      SUM(total_amount) as value
    FROM orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= v_six_months_ago
      AND status IN ('paid', 'completed', 'confirmed')
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
  ) m;

  -- 8. Recent Orders (10 most recent)
  SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json)
  INTO v_recent_orders
  FROM (
    SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
           json_build_object('table_number', t.table_number) as tables
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.restaurant_id = p_restaurant_id
    ORDER BY o.created_at DESC
    LIMIT 10
  ) r;

  -- Build final JSON
  RETURN json_build_object(
    'total_revenue', v_total_revenue,
    'total_orders', v_total_orders,
    'active_tables', v_active_tables,
    'total_tables', v_total_tables,
    'staff_on_duty', v_staff_on_duty,
    'status_counts', v_status_counts,
    'monthly_revenue', v_monthly_revenue,
    'recent_orders', v_recent_orders
  );
END;
$$;
