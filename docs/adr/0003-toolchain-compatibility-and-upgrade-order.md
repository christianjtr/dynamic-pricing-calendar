# ADR-0003: Toolchain compatibility and upgrade order

- **Status**: Accepted
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

The repository had a green baseline after Stage 1, but it still used Node 25, TypeScript 6, React 18, Mantine 7, Vite 6, Biome 1 and Vitest 4. Several packages were held together by pnpm overrides that were declared in `package.json`, which pnpm 12 ignores. Before introducing the contracts package and the SDK structure, the toolchain had to be moved to supported major versions and made reproducible; otherwise later migrations would be stacked on top of each other.

## Decision drivers

- Keep `pnpm lint`, `pnpm typecheck` and `pnpm test:run` green after every stage.
- Pin one runtime and one package-manager version for local development and CI.
- Upgrade toolchain majors before changing the repository structure, so compatibility failures are isolated.
- Avoid changes to product behavior or business logic during the upgrade.
- Keep the Vinxi/Nitro fixture runtime temporarily; it is removed in Stage 7.

## Considered options

1. Upgrade the whole toolchain in Stage 2, then restructure the repository in later stages.
2. Defer all upgrades until the SDK packages exist, then migrate everything at once.
3. Upgrade only Node and TypeScript, keeping React, Mantine, Vite, Biome and Vitest on their current majors.

## Decision outcome

Chosen option: **Option 1**, because it isolates compatibility work, gives later stages a modern baseline and avoids a large multi-migration commit at the end.

The baseline is now pinned to:

- Node.js 26.13.1 via `engines`, `.nvmrc` and CI; pnpm 12.9.1 via `packageManager`.
- TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Mantine 9.8.2, TanStack Query 5.108.4, Zod 4.6.7, date-fns 4.4.0, Biome 2.6.8 and Vitest 5.1.1.
- pnpm settings in `pnpm-workspace.yaml` (`overrides`, `allowBuilds`); the `pnpm` field in `package.json` was removed.
- `skipLibCheck: true` in `tsconfig.json` to avoid errors from Vinxi/Nitro declarations that reference optional peers.
- Vitest aliases in `resolve.alias` and `"type": "module"` in `package.json`.
- Biome 2 configuration migrated; Markdown files excluded from Biome formatting.

### Justification

TypeScript 7 keeps the `tsc` command for the 7.0 release, Mantine 9 keeps `@mantine/core/styles.css`, and Vitest 5 requires Vite 8. Upgrading them together removes the old override stack and keeps a single coherent dependency graph. The Vinxi/Nitro runtime is left untouched because its replacement is already scheduled for Stage 7.

## Consequences

### Positive

- One pinned runtime and package manager across local development, lockfile and CI.
- No `pnpm` configuration is silently ignored.
- Later stages start from current major versions of React, Mantine, TypeScript, Vite, Biome and Vitest.
- Import ordering and Biome 2 configuration are normalized once, before the repository is split into packages.

### Negative and mitigations

- Vinxi 0.4.3 remains on an older major while Vite is overridden to 8 — mitigation: Stage 7 replaces the Vinxi app with TanStack Start.
- Biome 2 import sorting touches many existing files — mitigation: changes are mechanical and limited to import/export order.
- Markdown is excluded from Biome formatting — mitigation: documentation remains manually reviewed in English.

## Compliance and verification

- `pnpm install --frozen-lockfile` succeeds with Node 26.
- `pnpm lint`, `pnpm typecheck` and `pnpm test:run` pass; 3 test files and 11 tests pass.
- CI uses Node 26 and runs the same three checks plus frozen-lockfile installation.

## Links

- [Memory](../Memory.md)
- [ADR-0001](./0001-headless-backend-driven-direction.md)
- [ADR-0002](./0002-start-and-fixture-runtime-boundaries.md)
- https://github.com/pnpm/pnpm/blob/main/pnpm/docs/cli/runtime.md
- https://github.com/microsoft/typescript/blob/v7.0.2/tsc/_packages/native-preview/README.md
- https://github.com/mantinedev/mantine/blob/9.0.0/apps/mantine.dev/src/pages/getting-started.mdx
