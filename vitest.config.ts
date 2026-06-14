import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		globals: true,
		alias: {
			"@": path.resolve(__dirname, "./client/src"),
		},
	},
});
