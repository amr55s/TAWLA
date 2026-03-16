-- Su Sushi - Restaurant Menu Seed Data
-- Data from sukwt.com with real prices in KWD

-- Clear existing data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM waiter_calls;
DELETE FROM menu_items;
DELETE FROM categories;
DELETE FROM tables;
DELETE FROM restaurants;

-- ============================================
-- RESTAURANT: Su Sushi
-- ============================================
INSERT INTO restaurants (id, name, slug, logo_url, theme_colors) VALUES
(
  'a0000001-0000-4000-8000-000000000001',
  'Su Sushi',
  'susushi',
  '/menu/logo.png',
  '{"primary": "#1B4332", "background": "#FAF8F5", "secondary": "#C4956A"}'::jsonb
);

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (id, restaurant_id, name_ar, name_en, sort_order) VALUES
('c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'المقبلات', 'Appetizers', 1),
('c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001', 'السلطات', 'Salads', 2),
('c0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 'سوشي وماكي', 'Sushi & Maki', 3);

-- ============================================
-- MENU ITEMS - APPETIZERS
-- ============================================
INSERT INTO menu_items (id, category_id, name_ar, name_en, description_ar, description_en, price, image_url, badge) VALUES
('d0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 
 'إدامامي حار', 'Spicy Edamame',
 'إدامامي، صلصة إدامامي حارة، بذور السمسم',
 'Edamame, Spicy Edamame Sauce, Sesame Seed',
 2.100, '/menu/spicy-edamame.jpg', NULL),

('d0000002-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001',
 'تونا كريسبي رايس', 'Tuna Crispy Rice',
 'تونا حارة، أرز مقرمش، صلصة مايو حارة، ثوم مقرمش، هالابينو',
 'Spicy Tuna, Crispy Rice, Spicy Mayo Sauce, Crispy Garlic, Jalapeno',
 2.950, '/menu/tuna-crispy-rice.jpg', 'Popular'),

('d0000003-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000001',
 'أونيغيري لحم واغيو', 'Wagyu Beef Onigiri',
 'لحم واغيو، صلصة ياكيتوري، جبنة موزاريلا، جبنة بارميزان، صلصة ليمون حلو، ثوم معمر',
 'Wagyu Beef, Yakitori Sauce, Mozzarella cheese, Parmesan Cheese, Sweet Lime Sauce, Chives',
 4.000, '/menu/wagyu-beef-onigiri.jpg', 'Chef Choice'),

('d0000004-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000001',
 'دجاج كاراج', 'Chicken Karaage',
 'دجاج مقلي مقرمش، صلصة كيمتشي مايو، ليمون، بصل أخضر، هالابينو أحمر',
 'Crispy Fried Chicken, Kimchi Mayo Sauce, Lime, Spring Onion, Red Jalapeno',
 3.500, '/menu/chicken-karaage.jpg', NULL),

('d0000005-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000001',
 'تمبورا روبيان حار', 'Spicy Prawn Tempura',
 'روبيان نمر، بطاطا حلوة مقرمشة، مايو حار، ثوم معمر',
 'Tiger Prawns, Crispy Sweet Potato, Spicy Mayo, Chives',
 3.500, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800', NULL),

('d0000006-0000-4000-8000-000000000006', 'c0000001-0000-4000-8000-000000000001',
 'تمبورا ذرة مقلية', 'Fried Corn Tempura',
 'ذرة مقلية مقرمشة، جبنة كريمية، صلصة ليمون حلو، ثوم معمر، بذور سمسم، تونغاراشي',
 'Crispy Fried Corn, Cream Cheese, Sweet Lime Sauce, Chives, Sesame Seeds, Tongarashi',
 2.250, '/menu/fried-corn-tempura.jpg', NULL),

('d0000007-0000-4000-8000-000000000007', 'c0000001-0000-4000-8000-000000000001',
 'روبيان بالعسل الكريمي', 'Creamy Honey Shrimp',
 'روبيان مقلي، صلصة أيولي كريمية، بذور سمسم',
 'Fried Shrimp, Creamy Aioli Sauce, Sesame Seeds',
 3.750, '/menu/creamy-honey-shrimp.jpg', 'Popular'),

('d0000008-0000-4000-8000-000000000008', 'c0000001-0000-4000-8000-000000000001',
 'غيوزا روبيان', 'Shrimp Gyoza',
 'خليط روبيان، ورق وونتون، تونغاراشي، بصل أخضر، صلصة غيوزا',
 'Shrimp Mixture, Wonton Sheet, Tongarashi, Spring Onion, Gyoza Sauce',
 3.500, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800', NULL),

('d0000009-0000-4000-8000-000000000009', 'c0000001-0000-4000-8000-000000000001',
 'نيغيري لحم واغيو مشوي', 'Torched Wagyu Beef Nigiri',
 'لحم واغيو مشوي، صلصة ياكيتوري بالكراميل، أرز',
 'Torched Wagyu Beef, Caramel Yakitori Sauce, Rice',
 5.000, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', 'Premium'),

('d0000010-0000-4000-8000-000000000010', 'c0000001-0000-4000-8000-000000000001',
 'نيغيري تونا', 'Tuna Nigiri',
 'تونا طازجة، أرز، صلصة صويا',
 'Fresh Tuna, Rice, Soy Sauce',
 4.250, 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800', NULL),

('d0000011-0000-4000-8000-000000000011', 'c0000001-0000-4000-8000-000000000001',
 'نيغيري سلمون', 'Salmon Nigiri',
 'سلمون طازج، أرز، صلصة صويا',
 'Fresh Salmon, Rice, Soy Sauce',
 4.000, 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800', NULL);

-- ============================================
-- MENU ITEMS - SALADS
-- ============================================
INSERT INTO menu_items (id, category_id, name_ar, name_en, description_ar, description_en, price, image_url, badge) VALUES
('d0000012-0000-4000-8000-000000000012', 'c0000002-0000-4000-8000-000000000002',
 'سلطة دجاج مقرمش', 'Crispy Chicken Salad',
 'دجاج مقلي، صلصة ميسو بالعسل، خضار مشكلة، رقائق مقرمشة، بذور سمسم، ثوم معمر',
 'Fried Chicken, Honey Miso Sauce, Mix Green, Crispy Chips, Sesame Seeds, Chives',
 2.750, '/menu/crispy-chicken-salad.jpg', NULL),

('d0000013-0000-4000-8000-000000000013', 'c0000002-0000-4000-8000-000000000002',
 'سلطة سلطعون كاني مقرمش', 'Crispy Kani Crab Salad',
 'سلطعون مقرمش، أفوكادو، صلصة ميسو بالعسل، صلصة كيمتشي مايو، عيدان سلطعون، بذور سمسم، ثوم معمر، خضار مشكلة',
 'Crispy Crab, Avocado, Honey Miso Sauce, Kimchi Mayo Sauce, Crab Sticks, Sesame Seeds, Chives, Mix Green',
 2.950, '/menu/crispy-kani-crab-salad.jpg', 'Popular'),

('d0000014-0000-4000-8000-000000000014', 'c0000002-0000-4000-8000-000000000002',
 'سلطة شمندر وجبنة فيتا', 'Beetroot Feta Cheese Salad',
 'شمندر مطبوخ، جبنة فيتا، صلصة سافا فينيغريت، خضار مشكلة، بذور سمسم، ثوم معمر، تمر',
 'Cooked Beetroot, Feta Cheese, Sava Vinaigrette Sauce, Mix Green, Sesame Seeds, Chives, Dates',
 2.500, '/menu/beetroot-feta-cheese-salad.jpg', NULL),

('d0000015-0000-4000-8000-000000000015', 'c0000002-0000-4000-8000-000000000002',
 'سلطة تونا', 'Tuna Salad',
 'تونا، مايو حار، صلصة ميسو بالعسل، خضار مشكلة، بذور سمسم، ثوم معمر',
 'Tuna, Spicy Mayo, Honey Miso Sauce, Mix Green, Sesame Seeds, Chives',
 3.500, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', NULL),

('d0000016-0000-4000-8000-000000000016', 'c0000002-0000-4000-8000-000000000002',
 'سلطة سلمون', 'Salmon Salad',
 'سلمون، مايو حار، صلصة ميسو بالعسل، خضار مشكلة، بذور سمسم، ثوم معمر',
 'Salmon, Spicy Mayo, Honey Miso Sauce, Mix Green, Sesame Seeds, Chives',
 3.000, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800', NULL);

-- ============================================
-- MENU ITEMS - SUSHI & MAKI
-- ============================================
INSERT INTO menu_items (id, category_id, name_ar, name_en, description_ar, description_en, price, image_url, badge) VALUES
('d0000017-0000-4000-8000-000000000017', 'c0000003-0000-4000-8000-000000000003',
 'ماكي تمبورا سلطعون كاني', 'Kani Crab Tempura Maki',
 'سلطعون كاني، خيار، أفوكادو، جبنة كريمية، صلصة ليمون حلو، ثوم معمر',
 'Kani Crab, Cucumber, Avocado, Cream cheese, Sweet Lime Sauce, Chives',
 3.950, '/menu/kani-crab-tempura-maki.jpg', NULL),

('d0000018-0000-4000-8000-000000000018', 'c0000003-0000-4000-8000-000000000003',
 'ماكي روبيان وأفوكادو', 'Shrimp Avocado Maki',
 'روبيان مقلي، خيار، أفوكادو، جزر، صلصة تشيلي بالعسل، صلصة مايو حارة',
 'Fried Shrimp, Cucumber, Avocado, Carrot, Honey Chilli Sauce, Spicy Mayo sauce',
 3.750, '/menu/shrimp-avocado-maki.jpg', 'Popular'),

('d0000019-0000-4000-8000-000000000019', 'c0000003-0000-4000-8000-000000000003',
 'ماكي روبيان حار', 'Spicy Prawn Maki',
 'روبيان مقلي، خيار، أفوكادو، جزر، بطاطا حلوة مقرمشة، صلصة مايو حارة',
 'Fried Shrimp, Cucumber, Avocado, Carrot, Crispy Sweet potato, Spicy Mayo sauce',
 3.500, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', NULL),

('d0000020-0000-4000-8000-000000000020', 'c0000003-0000-4000-8000-000000000003',
 'ماكي تونا ملتهبة', 'Flaming Tuna Maki',
 'تونا، خيار، أفوكادو، جزر، تمبورا كرانش حارة، صلصة كيمتشي مايو',
 'Tuna, Cucumber, Avocado, Carrot, Spicy Tempura Crunch, Kimchi Mayo sauce',
 3.250, 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800', NULL),

('d0000021-0000-4000-8000-000000000021', 'c0000003-0000-4000-8000-000000000003',
 'ماكي لحم واغيو مقلي', 'Fried Wagyu Beef Maki',
 'لحم واغيو مطبوخ، خيار، أفوكادو، جزر، صلصة مايو حارة، ثوم معمر',
 'Cooked Wagyu Beef, Cucumber, Avocado, Carrot, Spicy Mayo Sauce, Chives',
 4.900, '/menu/fried-wagyu-beef-maki.jpg', 'Premium'),

('d0000022-0000-4000-8000-000000000022', 'c0000003-0000-4000-8000-000000000003',
 'ماكي دجاج كاراج', 'Karaage Chicken Maki',
 'دجاج مقلي، خيار، أفوكادو، جزر، صلصة كيمتشي مايو، بصل أخضر',
 'Fried Chicken, Cucumber, Avocado, Carrot, Kimchi Mayo Sauce, Spring Onion',
 3.500, '/menu/karaage-chicken-maki.jpg', NULL),

('d0000023-0000-4000-8000-000000000023', 'c0000003-0000-4000-8000-000000000003',
 'ماكي لحم واغيو مشوي', 'Torched Wagyu Beef Maki',
 'لحم واغيو مشوي، خيار، أفوكادو، فطر، بطاطا مهروسة، صلصة ياكيتوري',
 'Torched Wagyu Beef, Cucumber, Avocado, Mushroom, Mashed Potato, Yakitori Sauce',
 5.000, '/menu/torched-wagyu-beef-maki.jpg', 'Chef Choice'),

('d0000024-0000-4000-8000-000000000024', 'c0000003-0000-4000-8000-000000000003',
 'ماكي سلطعون بالكراميل', 'Caramel Crab Maki',
 'سلطعون كاني، روبيان تمبورا، خيار، أفوكادو، جزر، صلصة كراميل، ثوم معمر',
 'Kani Crab, Tempura Shrimp, Cucumber, Avocado, Carrot, Caramel Sauce, Chives',
 4.350, 'https://images.unsplash.com/photo-1617196035303-07136794e001?w=800', NULL),

('d0000025-0000-4000-8000-000000000025', 'c0000003-0000-4000-8000-000000000003',
 'ماكي دجاج كرانشي', 'Crunch Chicken Maki',
 'دجاج مقلي، تمبورا كرانش، خيار، أفوكادو، جزر، صلصة ميسو مايو، ثوم معمر',
 'Fried Chicken, Tempura Crunch, Cucumber, Avocado, Carrot, Miso Mayo Sauce, Chives',
 3.500, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800', NULL),

('d0000026-0000-4000-8000-000000000026', 'c0000003-0000-4000-8000-000000000003',
 'ماكي تارتار تونا', 'Tuna Tartare Maki',
 'خليط تونا، خيار، أفوكادو، جزر، صلصة مايو حارة، بصل أخضر، هالابينو أحمر',
 'Tuna Mix, Cucumber, Avocado, Carrot, Spicy Mayo Sauce, Spring Onion, Red Jalapeno',
 4.500, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', NULL),

('d0000027-0000-4000-8000-000000000027', 'c0000003-0000-4000-8000-000000000003',
 'ماكي سلمون مشوي', 'Torched Salmon Maki',
 'سلمون، خيار، أفوكادو، جزر، صلصة مابل ميسو',
 'Salmon, Cucumber, Avocado, Carrot, Maple Miso Sauce',
 4.500, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800', 'Popular'),

('d0000028-0000-4000-8000-000000000028', 'c0000003-0000-4000-8000-000000000003',
 'ماكي نادي التونا', 'Tuna Club Maki',
 'تونا، سلطعون كاني، أفوكادو، صلصة كيمتشي مايو، صلصة أيولي كريمية، بصل أخضر، هالابينو أحمر',
 'Tuna, Kani Crab, Avocado, Kimchi Mayo Sauce, Creamy Aioli Sauce, Spring Onion, Red Jalapeno',
 5.500, 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800', 'Premium');

-- ============================================
-- TABLES (10 tables for Su Sushi)
-- ============================================
INSERT INTO tables (id, restaurant_id, table_number, section) VALUES
('e0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 1, 'Main'),
('e0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001', 2, 'Main'),
('e0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 3, 'Main'),
('e0000004-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000001', 4, 'Main'),
('e0000005-0000-4000-8000-000000000005', 'a0000001-0000-4000-8000-000000000001', 5, 'Window'),
('e0000006-0000-4000-8000-000000000006', 'a0000001-0000-4000-8000-000000000001', 6, 'Window'),
('e0000007-0000-4000-8000-000000000007', 'a0000001-0000-4000-8000-000000000001', 7, 'Bar'),
('e0000008-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001', 8, 'Bar'),
('e0000009-0000-4000-8000-000000000009', 'a0000001-0000-4000-8000-000000000001', 9, 'VIP'),
('e0000010-0000-4000-8000-000000000010', 'a0000001-0000-4000-8000-000000000001', 10, 'VIP');
