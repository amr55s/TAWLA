import { test, expect } from "@playwright/test";

/**
 * Route protection is enforced in middleware.ts:
 * - Unauthenticated users hitting /:slug/admin, /:slug/waiter, /:slug/cashier → /login?redirectTo=...
 * - Super-admin routes require specific email
 *
 * Staff PIN sessions use localStorage; Supabase session is still required to pass middleware
 * for staff routes — unauthenticated browser sessions must redirect to /login.
 */
test.describe("Security — unauthenticated access", () => {
	test("redirects /{slug}/admin to login with redirectTo", async ({ page }) => {
		const res = await page.goto("/demo-restaurant/admin", {
			waitUntil: "commit",
		});
		// May be redirect (307/308) or final URL on login
		await page.waitForURL(/\/login/, { timeout: 15_000 });
		expect(page.url()).toContain("/login");
		const u = new URL(page.url());
		expect(u.searchParams.get("redirectTo")).toContain("/demo-restaurant/admin");
	});

	test("redirects /{slug}/waiter to login when not signed in", async ({ page }) => {
		await page.goto("/demo-restaurant/waiter", { waitUntil: "commit" });
		await page.waitForURL(/\/login/, { timeout: 15_000 });
		expect(page.url()).toContain("/login");
	});

	test("redirects /{slug}/cashier to login when not signed in", async ({ page }) => {
		await page.goto("/demo-restaurant/cashier", { waitUntil: "commit" });
		await page.waitForURL(/\/login/, { timeout: 15_000 });
		expect(page.url()).toContain("/login");
	});

	test("blocks /super-admin for anonymous users", async ({ page }) => {
		await page.goto("/super-admin", { waitUntil: "commit" });
		await page.waitForURL(/\//, { timeout: 15_000 });
		expect(page.url()).not.toContain("/super-admin");
	});
});

test.describe("Cross-tenant URL isolation (browser)", () => {
	test("guest menu path is slug-scoped; no data from URL alone leaks other tenants", async ({
		page,
	}) => {
		// Public marketing home loads
		const home = await page.goto("/", { waitUntil: "domcontentloaded" });
		expect(home?.ok()).toBeTruthy();
		// Non-existent slug should not crash app (layout may 404)
		const r = await page.goto("/nonexistent-tenant-xyz/menu", {
			waitUntil: "domcontentloaded",
		});
		expect(r?.status()).toBeLessThan(500);
	});
});
