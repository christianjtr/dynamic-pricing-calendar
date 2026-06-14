import reactRefresh from "@vitejs/plugin-react";
import { createApp } from "vinxi";
import tsconfigPaths from "vite-tsconfig-paths";

export default createApp({
	routers: [
		{
			name: "client",
			type: "spa",
			handler: "./index.html",
			target: "browser",
			plugins: () => [
				tsconfigPaths(),
				reactRefresh(),
			],
		},
		{
			name: "api",
			type: "http",
			base: "/api",
			handler: "./api/index.ts",
		},
	],
});
