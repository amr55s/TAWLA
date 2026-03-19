# Tawla Architecture

Tawla is designed as a modern, multi-tenant B2B SaaS platform that empowers restaurant owners to independently manage their digital presence, menus, and operations from a centralized ecosystem. To achieve robust tenant isolation and real-time synchronicity, the architecture relies heavily on PostgreSQL's Row Level Security (RLS) policies within Supabase, alongside React's Context API on the frontend, ensuring data integrity, performance, and security.

## Core Multi-Tenant Architecture

### The Tenant Boundaries
Every operational entity in Tawla is strictly bound to a tenant (the restaurant owner). The `restaurants` table serves as the root tenant record. 
- **`owner_id`**: Links directly to Supabase Auth `auth.users(id)`. When an owner registers, their `owner_id` becomes the ultimate authorization check for any subsequent data mutations.
- **Tenant Isolation**: All sub-resources (staff, menu items, orders, tables) cascade down from the `restaurants` table via a mandatory `restaurant_id` foreign key.

### Strict Row Level Security (RLS)
The database enforces strict tenant isolation at the postgres level. Frontend applications cannot bypass these constraints.
- Every table has `# ENABLE ROW LEVEL SECURITY;`.
- **Policy Enforcement**: Policies strictly evaluate `auth.uid()` against the `owner_id` or `restaurant_id`. For example, a user attempting to manage staff can only do so if:
  `restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())`
- **Granular Operation Policies**: We mandate separate RLS policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` actions, utilizing `WITH CHECK` clauses for `INSERT` payloads to actively block malicious schema mapping manipulations.

## Database Schema (Core Tables)

1. **`restaurants`**
   - The primary multi-tenant wrapper.
   - Contains: `id`, `owner_id` (refs `auth.users`), `name`, `slug`, `cuisine_type`, `table_count`, etc.

2. **`restaurant_staff`**
   - Manages POS access and internal operational roles ('waiter', 'cashier').
   - Contains: `id`, `restaurant_id`, `name`, `role`, `pin_code`.

3. **`menu_items` & `categories`**
   - The foundational data for the digital menus and cashier systems.
   - Tied rigorously to `restaurant_id` with ordering properties for visual lists.

4. **`tables`**
   - Represents the physical floor plan of the restaurant. Generates the QR codes for guest scanning and ordering.
   - Contains: `id`, `restaurant_id`, `table_number`.

5. **`orders`**
   - The operational nexus tracking guest requests. Links together the `restaurant_id`, `table_number`, `guest_id`, and items. Powers the real-time workflows for both waitstaff and the kitchen/cashier.

## Application Architecture

### State Management & Tenant Context (`RestaurantContext`)
The frontend application avoids propagating user roles via URL parameters or prop-drilling for security and maintainability.
- We utilize a global `RestaurantContext` wrapper that asynchronously evaluates the authenticated `auth.user`.
- It dynamically resolves the user's `restaurant_id` either by pulling it directly from the authentication JWT (`user_metadata.restaurant_id` for staff members) or natively querying the database for the active `owner_id`.
- Every Admin Dashboard dashboard component dynamically queries Supabase combining `.eq('restaurant_id', context.restaurantId)` immediately fetching isolated metrics. This zero-mock-data approach completely synchronizes the interactive UX with live database transactions. 

### Real-Time Infrastructure
All live coordination features (e.g., Cashier dashboards tracking new orders, Waiter apps responding to "Call Waiter" triggers) use Supabase Realtime Channels.
- We subscribe exclusively to `postgres_changes` mapped explicitly to the authenticated `restaurant_id` to guarantee isolated web-socket streams that prevent data leakage between competing restaurants.
