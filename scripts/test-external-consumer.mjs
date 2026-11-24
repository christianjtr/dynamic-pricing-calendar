import { spawnSync } from "node:child_process";
import {
	access,
	cp,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(join(tmpdir(), "hpc-external-consumer-"));
const artifacts = join(temp, "artifacts");
const consumer = join(temp, "consumer");

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const run = (command, args, cwd) => {
	const result = spawnSync(command, args, { cwd, stdio: "inherit" });
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		throw new Error(
			`${command} ${args.join(" ")} failed with ${result.status}`,
		);
	}
};
const tarballName = ({ name, version }) =>
	`${name.replace(/^@/, "").replace("/", "-")}-${version}.tgz`;
const exact = (range) => range.replace(/^[~^]/, "");

try {
	await mkdir(artifacts, { recursive: true });
	const sdk = await readJson(join(root, "packages/react/package.json"));
	const contracts = await readJson(
		join(root, "packages/contracts/package.json"),
	);
	const rootPackage = await readJson(join(root, "package.json"));
	const playground = await readJson(join(root, "apps/playground/package.json"));

	run(
		"pnpm",
		["--filter", contracts.name, "pack", "--pack-destination", artifacts],
		root,
	);
	run(
		"pnpm",
		["--filter", sdk.name, "pack", "--pack-destination", artifacts],
		root,
	);

	await cp(join(root, "examples/external-consumer"), consumer, {
		recursive: true,
	});
	const fileDependency = (name, version) =>
		`file:${relative(consumer, join(artifacts, tarballName({ name, version })))
			.split(sep)
			.join("/")}`;
	const consumerPackage = {
		name: "hpc-external-consumer",
		private: true,
		type: "module",
		scripts: {
			typecheck: "tsc --noEmit",
			build: "vite build",
		},
		dependencies: {
			"@hpc/contracts": fileDependency(contracts.name, contracts.version),
			"@hpc/pricing-calendar": fileDependency(sdk.name, sdk.version),
			"@mantine/core": exact(sdk.peerDependencies["@mantine/core"]),
			"@mantine/hooks": exact(sdk.peerDependencies["@mantine/hooks"]),
			"@tanstack/react-query": exact(
				sdk.peerDependencies["@tanstack/react-query"],
			),
			react: exact(sdk.peerDependencies.react),
			"react-dom": exact(rootPackage.dependencies["react-dom"]),
		},
		devDependencies: {
			"@types/react": exact(rootPackage.devDependencies["@types/react"]),
			"@types/react-dom": exact(
				rootPackage.devDependencies["@types/react-dom"],
			),
			"@vitejs/plugin-react": exact(
				playground.devDependencies["@vitejs/plugin-react"],
			),
			typescript: exact(rootPackage.devDependencies.typescript),
			vite: exact(playground.devDependencies.vite),
		},
	};
	await writeFile(
		join(consumer, "package.json"),
		`${JSON.stringify(consumerPackage, null, 2)}\n`,
	);

	run("npm", ["install", "--no-audit", "--no-fund"], consumer);
	await access(join(consumer, "node_modules/@hpc/contracts/openapi.yaml"));
	run("npm", ["run", "typecheck"], consumer);
	run("npm", ["run", "build"], consumer);
} finally {
	await rm(temp, { recursive: true, force: true });
}
