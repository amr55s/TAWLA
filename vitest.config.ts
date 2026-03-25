import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["tests/integration/**/*.test.ts"],
		testTimeout: 60_000,
		hookTimeout: 30_000,
		setupFiles: ["dotenv/config", "./tests/setup.ts"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
