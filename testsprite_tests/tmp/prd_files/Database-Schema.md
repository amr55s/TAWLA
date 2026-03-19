# Database Schema (Supabase / PostgreSQL)

## 1. `restaurants` (Tenants)
- `id` (UUID, Primary Key)
- `name` (String)
- `slug` (String, unique) - e.g., "dajajy-restaurant"
- `logo_url` (String)
- `theme_colors` (JSONB) - e.g., `{"primary": "#FF5733", "background": "#FAFAFA", "fontFamily": "Tajawal"}`
- `table_count` (Integer) - number of tables shown in waiter/cashier dashboards

## 2. `categories` (Menu Categories)
- `id` (UUID, Primary Key)
- `restaurant_id` (UUID, Foreign Key)
- `name_ar` (String)
- `name_en` (String)
- `sort_order` (Integer)

## 3. `menu_items` (Dishes)
- `id` (UUID, Primary Key)
- `category_id` (UUID, Foreign Key)
- `name_ar`, `name_en` (String)
- `description_ar`, `description_en` (Text)
- `price` (Decimal)
- `image_url` (String)
- `cross_sell_items` (Array of UUIDs) - Linking to other menu items

## 4. `tables` (Restaurant Tables)
- `id` (UUID, Primary Key)
- `restaurant_id` (UUID, Foreign Key)
- `table_number` (Integer)
- `qr_code_url` (String)

## 5. `orders`
- `id` (UUID, Primary Key)
- `restaurant_id` (UUID, Foreign Key)
- `table_id` (UUID, Foreign Key)
- `guest_id` (String/UUID, nullable) - anonymous guest session id for strict order privacy
- `status` (Enum: 'pending', 'confirmed_by_waiter', 'in_kitchen', 'ready', 'served', 'paid', 'cancelled', 'completed')
- `total_amount` (Decimal)
- `created_at` (Timestamp)

## 6. `order_items`
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key)
- `menu_item_id` (UUID, Foreign Key)
- `quantity` (Integer)
- `price_at_time` (Decimal)
- `special_requests` (Text)

## 7. `waiter_calls`
- `id` (UUID, Primary Key)
- `restaurant_id` (UUID, Foreign Key)
- `table_id` (UUID, Foreign Key)
- `type` (Enum: 'assistance', 'bill')
- `status` (Enum: 'active', 'resolved')
- `created_at` (Timestamp)