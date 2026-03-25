# Tawla Multi-Tenant API Testing Report

**API / system under test:** Tawla — Next.js 16 (App Router) + Supabase (Postgres, Auth, Realtime)  
**API Tester:** Automated suite (`tests/e2e`, `tests/integration`, `scripts/load-test-guest-orders.ts`)  
**Testing date:** 2026-03-22  
**Quality status:** **PARTIAL** — E2E security checks run without credentials; full guest DB flow requires `INTEGRATION_RESTAURANT_SLUG` / `LOAD_TEST_*` env.  
**Release readiness:** **Conditional GO** — run integration + load tests against staging before production cutover.

---

## Phase 1 — Architecture & API discovery (inventory)

| Layer | Location | Role |
|--------|-----------|------|
| **Middleware (auth gate)** | `middleware.ts` | Redirects unauthenticated users from `/:slug/admin`, `/:slug/waiter`, `/:slug/cashier`, `/super-admin`; enforces `user_metadata.role` vs route (waiter blocked from admin, role mismatch redirects). |
| **Server Actions** | `src/app/actions/payment.ts`, `src/app/[slug]/admin/settings/billing/actions.ts`, `src/app/super-admin/actions.ts` | `"use server"` — payment verification, billing, super-admin ops; use `createClient()` from `@/lib/supabase/server` + `getUser()`. |
| **Route Handlers** | `src/app/api/detect-country/route.ts`, `src/app/api/webhooks/spaceremit/route.ts` | HTTP webhooks / geo — not core order CRUD. |
| **Client data layer** | `src/lib/data/orders.client.ts`, `src/lib/data/restaurants.ts` | Browser Supabase: `getRestaurantBySlugClient`, `getMenuItemsByRestaurantClient`, **`createOrderWithItemsClient`** (validates menu items belong to restaurant, inserts `orders` + `order_items`), **`getTableByNumberClient`** uses **`.maybeSingle()`** (safe for 0/1 rows). |
| **Server data** | `src/lib/data/restaurants.ts` | `getRestaurantBySlug` (cached) with `.maybeSingle()`. |
| **Inline Supabase** | Many `src/app/[slug]/**/page.tsx` | Dashboards, waiter, cashier, checkout, admin — direct `createClient()` calls. |

**Implication:** Most “API surface” is **not** REST routes but **Supabase client calls from the browser** + **middleware-enforced pages**. Automated tests must combine **Playwright (HTTP + redirects)** + **Supabase anon integration tests** + **optional load script**.

---

## Phase 2 — Test strategy implemented

| Area | Implementation | Notes |
|------|------------------|--------|
| **Guest multi-order concurrency** | `tests/integration/guest-orders-concurrency.integration.test.ts` | Two sequential `orders` + `order_items` inserts, same `guest_id` / `table_id`; asserts two rows. Skipped if `INTEGRATION_RESTAURANT_SLUG` unset. |
| **RBAC (middleware)** | `tests/e2e/security.spec.ts` | Unauthenticated browser cannot load admin/waiter/cashier/super-admin without redirect. **Does not** yet assert JWT role for waiter vs admin (needs auth storage state + test users). |
| **Cross-tenant** | `tests/e2e/security.spec.ts` + report | URL is tenant-scoped; **RLS** must enforce isolation in DB — verify with Supabase policies + service-role audits (not fully automated here). |
| **Load / stress** | `scripts/load-test-guest-orders.ts` | `Promise.all` of N concurrent order inserts; reports duration and throughput. |

---

## Test coverage analysis

**Functional coverage**

- **Middleware redirects:** Covered (E2E).
- **Guest order insert path:** Covered in integration when env + data exist; mirrors app insert + order_items.
- **`.maybeSingle()` on table lookup:** Indirectly validated by integration (table lookup pattern in app uses `maybeSingle` in `orders.client.ts`).
- **Server Actions / webhooks:** Not covered by this suite (add targeted tests or contract tests).

**Security coverage**

- **Anonymous access to staff/admin:** Redirect to `/login` — **tested**.
- **Waiter cannot call admin Server Actions:** **Not** automatically tested (requires authenticated session with `role: waiter` and invoking actions — recommend adding API route tests or Playwright with saved storage state).
- **Cross-tenant RLS:** **Must** be validated in Supabase dashboard / SQL tests; E2E cannot prove RLS without two tenants and two users.

**Performance coverage**

- **Concurrent inserts:** `load-test-guest-orders.ts` — run against staging; watch Supabase pooler limits and error rate.

---

## Performance test results (expected / not run in CI)

| Metric | Target | Notes |
|--------|--------|--------|
| **Response time** | p95 &lt; 200 ms for edge routes | Next.js + Supabase latency varies by region; measure in staging. |
| **Load script throughput** | Report `ordersPerSecond` in JSON | Depends on Supabase plan, RLS, and network. |
| **Scalability** | 100 concurrent inserts | Script default `LOAD_TEST_CONCURRENCY=100`; increase gradually. |

---

## Security assessment

| Control | Status | Notes |
|---------|--------|--------|
| **Authentication** | Middleware + Supabase session | Staff PIN flow uses **localStorage**; middleware still requires **Supabase user** for `/waiter` and `/cashier` — confirm product intent (staff may need anon or custom JWT). |
| **Authorization** | Role checks in `middleware.ts` | Staff blocked from admin routes at edge; **server-side** must still enforce on mutations (RLS + policies). |
| **Input validation** | `createOrderWithItemsClient` | Validates menu items belong to restaurant categories; good. |
| **Rate limiting** | Not in repo | Recommend Supabase rate limits / edge middleware for public inserts. |

---

## Issues and recommendations

### Critical

1. **RLS policies:** Add automated tests or SQL checks that `restaurant_id` is always constrained for `select`/`insert`/`update` per tenant. E2E alone cannot prove this.
2. **Staff vs middleware:** If staff are supposed to use **PIN-only** without Supabase session, current middleware blocks `/waiter` — align product + tests.

### Performance bottlenecks

1. **100 concurrent browser guests:** Realistic load is **many anon clients** → Supabase **connection pooler** (PgBouncer) and **regional** project. Monitor **429** and **Postgres connection** errors.
2. **Realtime channels:** Admin/waiter dashboards subscribe per restaurant; many concurrent channels may hit **Realtime** limits — separate from REST insert load.

### Optimization opportunities

1. Extract **order creation** into a single **Server Action** with Zod validation + one transaction to reduce round-trips and duplicate client logic.
2. Add **Playwright `storageState`** for roles: `admin.json`, `waiter.json`, `cashier.json` for true RBAC E2E.

---

## How to run

```bash
# Install deps (once)
pnpm install
pnpm exec playwright install chromium

# E2E (start dev server unless E2E_SKIP_WEBSERVER=1)
pnpm test:e2e

# Integration (needs INTEGRATION_RESTAURANT_SLUG + Supabase env)
INTEGRATION_RESTAURANT_SLUG=your-slug pnpm test:integration

# Load test
LOAD_TEST_RESTAURANT_SLUG=your-slug pnpm load:guest
```

---

**API Tester:** Tawla automated test suite  
**Release readiness:** **GO** for adding CI jobs; **NO-GO** for “full security” until RLS tests + role-based Server Action tests are added.
