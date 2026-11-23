import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./client/src", import.meta.url)),
		},
	},
	test: {
		exclude: [...configDefaults.exclude, "**/.output/**", "**/.vinxi/**"],
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		globals: true,
	},
});
