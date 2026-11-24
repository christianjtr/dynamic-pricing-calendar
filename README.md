# Headless Pricing Calendar

A React SDK for displaying prices computed by an external backend. This repository owns transport, structural contract validation, caching and presentation only. Pricing logic, recommendations, variance decisions, availability decisions, restrictions, currency and business validation belong to the backend.

## Repository layout

```text
apps/
  playground/          TanStack Start SSR reference app with local fixture routes
  headless-demo/       Plain Vite SPA with independent presentation and tokens
packages/
  contracts/           Canonical OpenAPI contract and SDK runtime schemas
  react/               Public SDK: client, headless and UI entry points
docs/
  integration.md       Integration guide and code examples
  adr/                 Architecture decision records
```

## Public entry points

| Import | Purpose |
|---|---|
| `@hpc/pricing-calendar` | `PricingCalendarProvider`, `createPricingClient`, query hooks, `usePricingCalendar` |
| `@hpc/pricing-calendar/headless` | Headless selectors and hook without UI dependencies |
| `@hpc/pricing-calendar/ui` | Optional Mantine-based ready-to-use UI |
| `@hpc/pricing-calendar/contracts` | Re-exported contract schemas and types |

`@hpc/contracts` is an internal workspace package. Consumers should import contract types from `@hpc/pricing-calendar/contracts`.

The language-neutral wire contract is [`packages/contracts/openapi.yaml`](packages/contracts/openapi.yaml); OpenAPI is canonical, while the TypeScript package serves the React SDK.

## Architecture

```mermaid
flowchart LR
  B[External pricing backend] -->|contract HTTP API| S[@hpc/pricing-calendar]
  S --> P[Start playground]
  S --> H[Headless Vite demo]
```

The SDK never defaults to `/api`. Consumers inject `baseUrl`, `propertyId`, optional `fetch`, headers and credentials through `PricingCalendarProvider` or `createPricingClient`. The `/api` routes in `apps/playground` are a deterministic local stand-in for development only.

See [the integration guide](docs/integration.md) for ready-made UI, headless and transport-only examples.

## Getting started

Prerequisites: Node 26 and pnpm 12.9.1.

```bash
pnpm install
pnpm dev
```

The Start playground runs on port `3000`. To run the independent headless SPA on port `3001`:

```bash
pnpm dev:demo
```

## Available scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the TanStack Start playground |
| `pnpm dev:demo` | Start the headless Vite demo |
| `pnpm build` | Build both apps |
| `pnpm start` | Preview the playground build |
| `pnpm start:demo` | Preview the headless demo build |
| `pnpm lint` | Run Biome checks |
| `pnpm lint:fix` | Apply Biome fixes |
| `pnpm typecheck` | Type-check the workspace and both apps |
| `pnpm test` | Run Vitest in watch mode |
| `pnpm test:run` | Run Vitest once |

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

The same commands run in CI on pushes and pull requests to `main`.

## Documentation

- [Integration guide](docs/integration.md)
- [OpenAPI contract](packages/contracts/openapi.yaml)
- [Architecture decision records](docs/adr/0001-headless-backend-driven-direction.md)
- [ADR-0010 — OpenAPI as the canonical API contract](docs/adr/0010-openapi-canonical-api-contract.md)
- [Repository audit](docs/repository-audit.md) — historical pre-migration snapshot

## License

MIT — Christian Torrealba
