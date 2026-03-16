-- ============================================
-- Test Restaurant - Dummy Data Seed
-- Run this AFTER the schema migration has been applied.
-- ============================================

-- Clean up any existing test data (safe to re-run)
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE restaurant_id = 'b0000001-0000-4000-8000-000000000001'
);
DELETE FROM orders WHERE restaurant_id = 'b0000001-0000-4000-8000-000000000001';
DELETE FROM waiter_calls WHERE restaurant_id = 'b0000001-0000-4000-8000-000000000001';
DELETE FROM menu_items WHERE category_id IN (
  SELECT id FROM categories WHERE restaurant_id = 'b0000001-0000-4000-8000-000000000001'
);
DELETE FROM categories WHERE restaurant_id = 'b0000001-0000-4000-8000-000000000001';
DELETE FROM tables WHERE restaurant_id = 'b0000001-0000-4000-8000-000000000001';
DELETE FROM restaurants WHERE id = 'b0000001-0000-4000-8000-000000000001';

-- ============================================
-- RESTAURANT
-- ============================================
INSERT INTO restaurants (id, name, slug, logo_url, theme_colors) VALUES
(
  'b0000001-0000-4000-8000-000000000001',
  'Test Restaurant',
  'test',
  NULL,
  '{"primary": "#1B4332", "background": "#FAF8F5"}'::jsonb
);

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (id, restaurant_id, name_ar, name_en, sort_order) VALUES
('ca000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'بيتزا', 'Pizza', 1),
('ca000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'كريب', 'Crepes', 2),
('ca000003-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000001', 'دجاج مقرمش', 'Crispy Chicken', 3);

-- ============================================
-- MENU ITEMS - PIZZA
-- ============================================
INSERT INTO menu_items (id, category_id, name_ar, name_en, description_ar, description_en, price, image_url, badge) VALUES
('mi000001-0000-4000-8000-000000000001', 'ca000001-0000-4000-8000-000000000001',
 'بيتزا مارغريتا', 'Margherita Pizza',
 'صلصة طماطم، موزاريلا طازجة، ريحان',
 'Tomato sauce, fresh mozzarella, basil leaves',
 3.500,
 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
 'Popular'),

('mi000002-0000-4000-8000-000000000002', 'ca000001-0000-4000-8000-000000000001',
 'بيتزا بيبروني', 'Pepperoni Pizza',
 'صلصة طماطم، موزاريلا، بيبروني مقرمش',
 'Tomato sauce, mozzarella, crispy pepperoni slices',
 4.250,
 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800',
 NULL),

('mi000003-0000-4000-8000-000000000003', 'ca000001-0000-4000-8000-000000000001',
 'بيتزا خضار مشكلة', 'Veggie Supreme Pizza',
 'فلفل ألوان، زيتون، فطر، بصل، طماطم، موزاريلا',
 'Bell peppers, olives, mushrooms, onions, tomatoes, mozzarella',
 4.000,
 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
 NULL);

-- ============================================
-- MENU ITEMS - CREPES
-- ============================================
INSERT INTO menu_items (id, category_id, name_ar, name_en, description_ar, description_en, price, image_url, badge) VALUES
('mi000004-0000-4000-8000-000000000004', 'ca000002-0000-4000-8000-000000000002',
 'كريب نوتيلا', 'Nutella Crepe',
 'كريب طازج محشو بالنوتيلا مع موز وفراولة',
 'Fresh crepe filled with Nutella, banana slices, and strawberries',
 2.750,
 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800',
 'Popular'),

('mi000005-0000-4000-8000-000000000005', 'ca000002-0000-4000-8000-000000000002',
 'كريب جبنة ولحم', 'Cheese & Meat Crepe',
 'كريب بالجبنة والدجاج المشوي والخضار',
 'Savory crepe with cheese, grilled chicken, and fresh vegetables',
 3.500,
 'https://images.unsplash.com/photo-1622556498246-755f44ca76f3?w=800',
 NULL),

('mi000006-0000-4000-8000-000000000006', 'ca000002-0000-4000-8000-000000000002',
 'كريب لوتس', 'Lotus Crepe',
 'كريب بصوص اللوتس والكريمة مع بسكويت لوتس مطحون',
 'Crepe with Lotus spread, cream, and crushed Lotus biscuits',
 3.000,
 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800',
 'New');

-- ============================================
-- MENU ITEMS - CRISPY CHICKEN
-- ============================================
INSERT INTO menu_items (id, category_id, name_ar, name_en, description_ar, description_en, price, image_url, badge) VALUES
('mi000007-0000-4000-8000-000000000007', 'ca000003-0000-4000-8000-000000000003',
 'ساندوتش دجاج مقرمش', 'Crispy Chicken Sandwich',
 'دجاج مقرمش، خس، طماطم، صوص خاص، خبز بريوش',
 'Crispy fried chicken, lettuce, tomato, special sauce, brioche bun',
 3.250,
 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800',
 'Popular'),

('mi000008-0000-4000-8000-000000000008', 'ca000003-0000-4000-8000-000000000003',
 'دجاج مقرمش مع بطاطس', 'Crispy Chicken & Fries',
 'قطع دجاج مقرمشة مع بطاطس مقلية وصوص كيتشب',
 'Crispy chicken strips with french fries and ketchup dip',
 4.500,
 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800',
 NULL),

('mi000009-0000-4000-8000-000000000009', 'ca000003-0000-4000-8000-000000000003',
 'برجر دجاج حار', 'Spicy Chicken Burger',
 'دجاج مقرمش حار، كول سلو، مخلل، صوص حار، خبز بريوش',
 'Spicy crispy chicken, coleslaw, pickles, hot sauce, brioche bun',
 3.750,
 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
 'Spicy');

-- ============================================
-- TABLES (1 through 8)
-- ============================================
INSERT INTO tables (id, restaurant_id, table_number) VALUES
('tb000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 1),
('tb000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 2),
('tb000003-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000001', 3),
('tb000004-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000001', 4),
('tb000005-0000-4000-8000-000000000005', 'b0000001-0000-4000-8000-000000000001', 5),
('tb000006-0000-4000-8000-000000000006', 'b0000001-0000-4000-8000-000000000001', 6),
('tb000007-0000-4000-8000-000000000007', 'b0000001-0000-4000-8000-000000000001', 7),
('tb000008-0000-4000-8000-000000000008', 'b0000001-0000-4000-8000-000000000001', 8);

-- ============================================
-- SAMPLE ORDERS (for testing Cashier Kanban)
-- ============================================

-- Order 1: Table 3 - New order (confirmed by waiter)
INSERT INTO orders (id, restaurant_id, table_id, status, total_amount, created_at) VALUES
('or000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001',
 'tb000003-0000-4000-8000-000000000003', 'confirmed_by_waiter', 11.250, NOW() - INTERVAL '5 minutes');

INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES
('or000001-0000-4000-8000-000000000001', 'mi000001-0000-4000-8000-000000000001', 2, 3.500),
('or000001-0000-4000-8000-000000000001', 'mi000004-0000-4000-8000-000000000004', 1, 2.750);

-- Order 2: Table 7 - In kitchen
INSERT INTO orders (id, restaurant_id, table_id, status, total_amount, created_at) VALUES
('or000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001',
 'tb000007-0000-4000-8000-000000000007', 'in_kitchen', 7.750, NOW() - INTERVAL '15 minutes');

INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES
('or000002-0000-4000-8000-000000000002', 'mi000007-0000-4000-8000-000000000007', 1, 3.250),
('or000002-0000-4000-8000-000000000002', 'mi000008-0000-4000-8000-000000000008', 1, 4.500);

-- Order 3: Table 1 - Ready for pickup
INSERT INTO orders (id, restaurant_id, table_id, status, total_amount, created_at) VALUES
('or000003-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000001',
 'tb000001-0000-4000-8000-000000000001', 'ready', 4.250, NOW() - INTERVAL '25 minutes');

INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES
('or000003-0000-4000-8000-000000000003', 'mi000002-0000-4000-8000-000000000002', 1, 4.250);
