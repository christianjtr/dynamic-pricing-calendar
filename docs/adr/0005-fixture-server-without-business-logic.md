# ADR-0005: Fixture server without business logic

- **Status**: Accepted
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

The previous `api/index.ts` generated 365 days of random prices, applied 4% variations and decided error states inside the repository. That conflicts with the headless direction: the external backend owns every business decision. The local server is only a development stand-in used to validate the fixed contracts. It is not a transport layer for the published SDK: the SDK calls the external backend directly through TanStack Query.

## Decision drivers

- No randomness, thresholds or price derivation in this repository.
- Responses must validate against `@hpc/contracts`.
- Keep the existing Vinxi/Nitro runtime until Stage 7 replaces the app.
- Make routing testable without starting an HTTP server.
- Writes must return a canonical backend response, never a locally calculated value.

## Considered options

1. Keep the random generator and only change its response shape.
2. Generate fixtures from typed rules at startup.
3. Serve explicit, static, precomputed fixtures and do transport-only filtering.

## Decision outcome

Chosen option: **Option 3**, because static fixtures cannot silently reintroduce business rules.

The server is split into:

- `api/fixtures.ts` — explicit settings, room, day and canonical-update fixtures. A small `day()` helper only assembles static values; it does not compute them.
- `api/router.ts` — a pure function that maps path, method, query and body to a status and contract-shaped body. It only filters by room and date range.
- `api/index.ts` — a thin Vinxi `eventHandler` adapter that reads the URL/body, calls the router and sets the response status.

The fixture range is seven days (`2026-11-23` to `2026-11-29`) for three rooms, including auto, manual, closed, restricted, sold-out and error days. `PATCH /prices/:roomId/:date` validates the request and returns a precomputed canonical day; the requested price is never echoed back as truth.

The contract was adjusted in this stage to allow `price: null` on closed days and an `unavailable` availability value.

### Justification

A pure router keeps the HTTP adapter trivial and makes it possible to assert the entire contract in unit tests. Static fixtures are deterministic, reviewable and cannot drift into business logic. The reduced date range is sufficient for development and avoids pretending the local server can emulate a revenue engine.

## Consequences

### Positive

- No `Math.random`, percentage thresholds or derived prices remain in the API layer.
- Contract schemas are the single source of truth for fixture validation.
- HTTP responses were smoke-checked through `pnpm dev` for settings and filtered prices.
- `pnpm build` is now available and passes with Vite 8.

### Negative and mitigations

- The legacy client still expects the old nested shape — mitigation: Stages 5–7 migrate the client and UI to the new contract.
- Vinxi 0.4.3 reads Vite manifests from the outDir root while Vite 8 writes them to `.vite/` — mitigation: a small `enforce: "post"` Vite plugin in `app.config.mjs` sets `build.manifest: "manifest.json"` for both routers.
- `postcss.config.js` used CommonJS while the package is ESM — mitigation: converted it to `export default`.
- Vinxi/Vite still report legacy `@/` alias and chunk-size notices — mitigation: Stage 7 replaces that client; neither notice blocks dev or build.
- Build artifacts are generated under `.output/` and `.vinxi/` — mitigation: ignored in `.gitignore`, Biome and Vitest.
- The fixture server must never become the client default — mitigation: Stage 5 injects an external backend base URL into TanStack Query; Stage 8 removes Vinxi entirely.
- The fixture range is shorter than the previous 365 days — mitigation: the external backend, not the fixture server, remains authoritative for production ranges.

## Compliance and verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass; 5 test files and 27 tests pass.
- `GET /api/settings`, `GET /api/prices` and `PATCH /api/prices/:roomId/:date` are covered by router tests.
- HTTP smoke check against `pnpm dev` returned contract-valid JSON for settings and filtered prices.

## Links

- [Memory](../Memory.md)
- [ADR-0002](./0002-start-and-fixture-runtime-boundaries.md)
- [ADR-0004](./0004-external-api-contracts.md)
- https://github.com/nksaraf/vinxi/blob/main/docs/api/server/request.md
- https://github.com/nksaraf/vinxi/blob/main/docs/api/server/response.md
