import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for Tawla (Next.js App Router + Supabase).
 *
 * Run: `npx playwright install chromium` then `npm run test:e2e`
 *
 * Optional env:
 * - E2E_BASE_URL (default http://127.0.0.1:3000)
 * - E2E_RESTAURANT_SLUG — enables deeper guest-flow tests
 */
export default defineConfig({
	testDir: "./tests/e2e",
	testIgnore: /\/\._|\/\.AppleDouble\//,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: process.env.E2E_SKIP_WEBSERVER
		? undefined
		: {
				command: "rm -rf .next && npm run build && npm run start",
				url: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
				reuseExistingServer: !process.env.CI,
				timeout: 300_000,
			},
});
