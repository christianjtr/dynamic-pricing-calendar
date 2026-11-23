import reactRefresh from "@vitejs/plugin-react";
import { createApp } from "vinxi";
import tsconfigPaths from "vite-tsconfig-paths";

const vite8ManifestPath = () => ({
	name: "vinxi-vite8-manifest-path",
	enforce: "post",
	config() {
		return { build: { manifest: "manifest.json" } };
	},
});

export default createApp({
	routers: [
		{
			name: "client",
			type: "spa",
			handler: "./index.html",
			target: "browser",
			plugins: () => [tsconfigPaths(), reactRefresh(), vite8ManifestPath()],
		},
		{
			name: "api",
			type: "http",
			base: "/api",
			handler: "./api/index.ts",
			plugins: () => [vite8ManifestPath()],
		},
	],
});
