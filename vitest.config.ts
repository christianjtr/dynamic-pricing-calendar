import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "jsdom",
		exclude: [...configDefaults.exclude, "**/dist/**"],
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
	},
});
