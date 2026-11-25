# ADR-0006: Public SDK and headless/UI separation

- **Status**: Superseded by [ADR-0012](./0012-pivot-to-reference-app.md)
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

The legacy client hardcoded `/api` URLs, created a module-scope `QueryClient`, inferred currency from the browser locale and recalculated variance locally. That couples the product to the temporary Vinxi fixture server and violates ADR-0001. The published package must instead work with any external backend, validate every response with the fixed contracts, and leave presentation to a separate entry point.

## Decision drivers

- The external backend is the only source of pricing truth.
- The SDK must never call the local fixture server or hardcode `/api`.
- React Query state must be instance-scoped so SSR and multiple embedders can coexist.
- `headless` primitives must not import Mantine or any UI implementation.
- Consumers must inject base URL, fetch, credentials, headers and property context.
- Writes must expose pending state and show only the canonical response returned by the backend.

## Considered options

1. Adapt the existing `client/src` services in place and publish that folder.
2. Put transport, hooks and Mantine components in a single `@hpc/pricing-calendar` entry point.
3. Create `@hpc/pricing-calendar` with separate `client`, `headless`, `ui` and `contracts` exports.

## Decision outcome

Chosen option: **Option 3**.

The new workspace package `packages/react` exposes:

- `@hpc/pricing-calendar` — client provider, query hooks and headless primitives.
- `@hpc/pricing-calendar/headless` — selectors and `usePricingCalendar` with no Mantine imports.
- `@hpc/pricing-calendar/ui` — Mantine-based ready-to-use UI; Mantine is an optional peer.
- `@hpc/pricing-calendar/contracts` — re-export of `@hpc/contracts`.

`createPricingClient(config)` accepts `baseUrl`, `propertyId`, an optional injected `fetch`, async `headers`, and `credentials`. It builds paths from `apiPaths`, validates request parameters and bodies plus responses with Zod schemas generated from the canonical OpenAPI contract, sends `x-property-id`, and maps API errors to `PricingApiError`.

`PricingCalendarProvider` owns or accepts a `QueryClient`; it never creates one at module scope. Consumers running SSR can pass a per-request instance.

Query hooks use stable factories from `pricingKeys`. `useSettings` and `usePrices` are read-only. `useUpdatePrice` exposes TanStack Query's `isPending`, cancels in-flight price queries, snapshots caches, replaces only the canonical day returned by the backend, rolls back on error and invalidates price queries on settle. It never computes a local price.

### Justification

Separate exports make it possible to embed logic-only hooks without paying for Mantine, while still offering a batteries-included UI. Injected transport keeps the SDK framework-agnostic and testable. The write path satisfies the headless rule: pending state is UI information; the returned day is backend truth.

## Consequences

### Positive

- No SDK code depends on Vinxi, `/api`, the legacy `PriceData` shape or local variance math.
- Currency, timezone, room metadata and day status all come from `@hpc/contracts`.
- Generated contract validation happens at the HTTP boundary, so malformed backend data and invalid request parameters fail early.
- SSR embedders can supply their own `QueryClient`.

### Negative and mitigations

- `./ui` started as an empty barrel — mitigation: Stage 6 filled it with Mantine components; the headless demo deliberately does not import it.
- The legacy UI initially consumed `client/src` data — mitigation: Stages 6–7 replaced it with the new SDK and headless selectors.
- CI initially did not run `pnpm build` — mitigation: Stage 10 added it to the workflow.
- The SDK is not released to a registry, `@hpc/contracts` remains private, and exports target TypeScript source — mitigation: the tarball smoke test verifies Vite consumers; registry release and Node-native package output remain future work. Backend teams can use the standalone OpenAPI artifact without either package.

## Compliance and verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- 8 test files and 37 tests pass, including injected fetch/headers, abort signal, contract validation, API error mapping, pending writes, canonical cache replacement and headless selectors.
- Client and headless entry points import neither `vinxi`, `@mantine/*` nor a hard-coded `/api` path. Mantine is confined to `./ui`.
- `pnpm test:external-consumer` packs the SDK and contracts, installs their tarballs into a clean Vite app without workspace links, and type-checks/builds that app.
- The external consumer smoke asserts the contract package tarball includes `openapi.yaml`.
- The SDK has no registry release yet; its exports point to TypeScript source and are verified with a TypeScript-aware bundler.

## Links

- [Memory](../Memory.md)
- [ADR-0001](./0001-headless-backend-driven-direction.md)
- [ADR-0004](./0004-external-api-contracts.md)
- [ADR-0005](./0005-fixture-server-without-business-logic.md)
- [ADR-0010](./0010-openapi-canonical-api-contract.md)
- https://tanstack.com/query/latest/docs/framework/react/overview
