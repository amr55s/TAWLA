# PostHog Setup Report

## Integration Summary

**Project:** Tawla — Multi-tenant restaurant SaaS
**Framework:** Next.js 16.1.6 (App Router)
**PostHog SDK:** posthog-js ^1.362.0
**Date:** 2026-03-19

---

## Initialization

**Method:** `instrumentation-client.ts` (Next.js 15.3+ native pattern — no provider required)

**File:** `instrumentation-client.ts`
- Initializes via `posthog.init()` with reverse proxy host `/ingest`
- `capture_exceptions: true` for automatic error capture
- Debug mode enabled in development

**Reverse Proxy:** `next.config.ts`
- `/ingest/static/:path*` → PostHog static assets
- `/ingest/:path*` → PostHog event ingestion
- `skipTrailingSlashRedirect: true` set for PostHog compatibility

**Environment Variables (`.env.local`):**
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `NEXT_PUBLIC_POSTHOG_HOST`

---

## Events Tracked

| Event | File | Description |
|-------|------|-------------|
| `item_added_to_cart` | `src/app/[slug]/menu/MenuContentClient.tsx` | Guest adds item from menu card or item detail sheet |
| `checkout_started` | `src/app/[slug]/cart/page.tsx` | Guest proceeds from cart to checkout |
| `order_placed` | `src/app/[slug]/checkout/page.tsx` | Guest submits order successfully |
| `waiter_called` | `src/components/ui/CallWaiterSheet.tsx` | Guest calls waiter (assistance, bill, water, etc.) |
| `staff_pin_login` | `src/app/[slug]/login/page.tsx` | Staff member logs in via PIN |
| `admin_signed_in` | `src/app/login/page.tsx` | Admin logs in via email/password |
| `restaurant_registered` | `src/app/register/page.tsx` | New restaurant owner completes registration |
| `menu_item_created` | `src/app/[slug]/admin/menu/page.tsx` | Admin creates a new menu item |
| `menu_item_updated` | `src/app/[slug]/admin/menu/page.tsx` | Admin updates an existing menu item |
| `menu_item_deleted` | `src/app/[slug]/admin/menu/page.tsx` | Admin deletes a menu item |
| `waiter_order_confirmed` | `src/app/[slug]/waiter/page.tsx` | Waiter confirms/serves pending orders |
| `waiter_call_resolved` | `src/app/[slug]/waiter/page.tsx` | Waiter resolves a guest call |
| `order_settled` | `src/app/[slug]/cashier/page.tsx` | Cashier marks order as paid |
| `cashier_order_created` | `src/app/[slug]/cashier/page.tsx` | Cashier creates a new order (table or takeaway) |

---

## User Identification

| Trigger | Identity |
|---------|----------|
| Admin email login | `posthog.identify(user.id, { email })` using Supabase auth user ID |
| Staff PIN login | `posthog.identify('staff_' + staff.id, { staff_name, role, restaurant_id })` |
| Guest ordering | Anonymous — PostHog auto-generates distinct_id; guestId from Zustand cart store is passed on `order_placed` |

---

## Error Capture

`posthog.captureException(err)` is called in catch blocks for:
- Checkout order submission errors
- Waiter call submission errors
- Staff PIN login errors
- Cashier mark-paid errors
- Cashier new order creation errors

---

## Dashboard

**Name:** Analytics basics
**URL:** https://us.posthog.com/project/349447/dashboard/1379562

### Insights

| # | Name | Type | URL |
|---|------|------|-----|
| 1 | Guest Order Conversion Funnel | Funnel | https://us.posthog.com/project/349447/insights/vFhDpNbx |
| 2 | Daily Orders & Revenue Activity | Trends | https://us.posthog.com/project/349447/insights/djdiTAot |
| 3 | Waiter Calls Activity | Trends | https://us.posthog.com/project/349447/insights/qwMfgLJn |
| 4 | Order Lifecycle: Confirmed vs Settled | Trends | https://us.posthog.com/project/349447/insights/p1vKDCr1 |
| 5 | Staff Login Activity | Trends | https://us.posthog.com/project/349447/insights/dwRpQjYA |
