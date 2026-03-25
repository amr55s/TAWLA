import { test, expect } from "@playwright/test";

const slug = process.env.E2E_RESTAURANT_SLUG;

/**
 * Browser-level checks for guest order UX.
 * Full DB concurrency is covered in tests/integration/guest-orders-concurrency.integration.test.ts
 */
test.describe("Guest orders — UI & session", () => {
	test("orders page handles missing guest session without crash", async ({ page }) => {
		await page.goto("/demo-restaurant/orders", { waitUntil: "domcontentloaded" });
		// Should render shell (may show empty or prompt)
		const main = page.locator("main, [class*='min-h-screen']").first();
		await expect(main).toBeVisible({ timeout: 15_000 });
	});

	test("persisted guest session key is readable after set", async ({
		page,
		context,
	}) => {
		test.skip(!slug, "Set E2E_RESTAURANT_SLUG to enable this test");
		await context.addInitScript(() => {
			localStorage.setItem("tawla_guest_session_id", "playwright_guest_test_1");
		});
		await page.goto(`/${slug}/orders`, { waitUntil: "networkidle" });
		const stored = await page.evaluate(() =>
			localStorage.getItem("tawla_guest_session_id"),
		);
		expect(stored).toBe("playwright_guest_test_1");
	});
});
