# ADR-0007: Playground Start SSR and query boundaries

- **Status**: Accepted
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

The public SDK must remain framework-agnostic, but the repository still needs one reference integration that proves server rendering, client navigation and TanStack Query hydration work together. The previous playground used Vinxi/Nitro with a module-scope `QueryClient`, which risks leaking one reader's cache into another SSR request and keeps a retired runtime in the toolchain.

We need to decide where the reference app lives, how SSR query state is isolated, and how deterministic fixture endpoints survive the removal of the Vinxi fixture runtime.

## Decision drivers

- Keep `@tanstack/react-start` out of `packages/react`.
- Create one `QueryClient` per SSR request and hydrate it into the browser.
- Consume the public SDK exactly as a third-party application would.
- Remove Vinxi/Nitro from root scripts, dependencies and configuration.
- Preserve deterministic local API responses without reintroducing business logic.

## Considered options

1. Keep the Vinxi SPA and add TanStack Query hydration manually.
2. Move the playground to TanStack Start with a per-request QueryClient in router context.
3. Move all apps to a plain Vite SPA and drop SSR.
4. Keep a separate Vinxi `apps/api` fixture server beside the Start playground.

## Decision outcome

Chosen option: **2**.

- `apps/playground` is the TanStack Start reference app.
- `getRouter()` creates one `QueryClient` per router instance and passes it through typed router context. TanStack Start calls the router factory once per SSR request.
- `setupRouterSsrQueryIntegration` owns dehydration, streaming and hydration. No second independent dehydrate/hydrate path is added.
- The index route prefetches settings and prices into that request's QueryClient. The SDK provider receives the same QueryClient instead of creating a hidden module-scope cache.
- Static fixture HTTP endpoints are Start server routes under `src/routes/api`. They are a local test double for the external backend, not part of the SDK and not a business backend.
- Root `dev`, `build` and `start` scripts delegate to the playground. Vinxi, Nitro, the root SPA entry, the legacy client and legacy Tailwind/PostCSS configuration are removed.

### Justification

The Start router factory gives a natural request boundary for Query state. The SDK stays portable because SSR integration lives only in the playground. Fixture server routes keep local development reproducible while the public SDK still talks HTTP through the injected base URL and property context.

## Consequences

### Positive

- SSR request caches are isolated.
- The playground consumes the same package exports that external consumers use.
- The repository has one build tool and no Vinxi runtime.
- Fixture data remains deterministic and contract-validated.

### Negative and mitigations

- The playground depends on local fixture routes for a complete demo — mitigation: the SDK accepts any injected backend base URL, and production apps point it at the real external backend.
- Start server routes are app-local tooling — mitigation: ADR-0005's no-business-logic rule remains in force; routes only delegate to a pure router.
- SSR prefetching requires an absolute base URL on the server — mitigation: the index loader derives the request origin and uses an absolute API URL during SSR, with a relative origin-relative URL in the browser.

## Compliance and verification

- `packages/react` has no dependency on `@tanstack/react-start`.
- No `QueryClient` is created at module scope in the playground.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- HTTP smoke checks cover `GET /api/settings`, `GET /api/prices`, `PATCH /api/prices/:roomId/:date` and server-rendered `/`.
- No Vinxi/Nitro configuration, dependencies or scripts remain.

## Links

- [Repository audit](../repository-audit.md)
- [ADR-0002](./0002-start-and-fixture-runtime-boundaries.md)
- [ADR-0005](./0005-fixture-server-without-business-logic.md)
- [ADR-0006](./0006-public-sdk-and-headless-ui-separation.md)
- [TanStack Start + TanStack Query](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query)
- [TanStack Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
