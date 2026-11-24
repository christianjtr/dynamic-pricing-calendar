import { defineConfig } from "orval";

export default defineConfig({
	pricingCalendar: {
		input: {
			target: "./openapi.yaml",
		},
		output: {
			client: "zod",
			mode: "single",
			target: "./src/generated/operations.zod.ts",
			schemas: "./src/generated/schemas",
			schemaFileExtension: ".zod.ts",
			override: {
				zod: {
					version: 4,
					generateReusableSchemas: true,
					generate: {
						param: true,
						body: true,
						response: true,
						query: true,
						header: true,
					},
				},
			},
		},
	},
});
