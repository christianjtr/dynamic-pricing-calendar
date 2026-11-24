# Memory

Last updated: Stage 14 in progress on `chore/configure-import-aliases`; Stage 13 merged to `main` at `ac8dd93`.

## Project goal

Transform `dynamic-pricing-calendar` into a **Headless Pricing Calendar**: a reusable React component library that displays prices computed by an external backend. This repository must not calculate prices, recommendations, variance, availability, occupancy, restrictions, closed dates, currency or business validation. It transports, structurally validates, caches and renders backend data.

Backend author: project owner. Product owner instruction: “toda la lógica se computa en un backend externo, nuestro producto sólo muestra la información”. UI team focus: product and presentation layer.

## Locked decisions (do not revisit without explicit approval)

1. Backend is the single source of truth for pricing logic and values; `packages/contracts/openapi.yaml` is the canonical wire shape (ADR-0010).
2. Frontend must not implement fallback pricing logic, random generation, business thresholds or optimistic local business decisions.
3. Vinxi/Nitro has been removed; deterministic fixture endpoints live only in the Start playground server routes, ADR-0005 / ADR-0007.
4. React SDK will be framework-agnostic; TanStack Start exists only in the playground, ADR-0002 / ADR-0007.
5. `@tanstack/react-query` is the client cache/write layer.
6. OpenAPI 3.1.1 is the language-neutral API contract; Orval 8.48.0 generates the SDK's Zod runtime validators, ADR-0010.
7. Headless hooks and UI components must be in separate package exports, ADR-0006.
8. Rooms × dates matrix is the base visualization; contextual panel edits one day.
9. Manual prices, restrictions, closed dates and occupancy need non-color-only indicators from Stage 4 onward.
10. Design tokens must be neutral (`--hpc-*`, not `--rpg-*`) and consumer-overridable, ADR-0008.
11. Wallet/auth, tenant and property context are injected by the consuming app; `propertyId` identifies context but never authorizes. ADR-0009.
12. Live docs, apps and code contain no legacy branding; historical ADRs and the pre-migration audit remain as decision records.
13. Fixture server serves explicit static data and deterministic in-memory canonical updates only; it never derives prices or computes business rules, ADR-0005.
14. The published SDK must consume the external backend directly through TanStack Query and `@hpc/contracts`; it must never call or depend on the local fixture endpoints.

## Toolchain baseline

- Node: `v26.13.1` via `pnpm runtime set node 26 -g -y`. There is no nvm-managed Node in this shell. `pnpm shim add node` failed with `ERR_PNPM_SHIM_BIN_CONFLICT`, but the runtime works and `pnpm` selects Node 26.
- pnpm: `12.9.1`. Workspace config lives in `pnpm-workspace.yaml`; the `pnpm` field in `package.json` is ignored by pnpm 12.
- pnpm config: `allowBuilds` permits Biome, Parcel watcher, esbuild and `vue-demi` (Scalar's Vue compatibility setup); `minimumReleaseAgeExclude` contains TanStack entries.
- Versions installed: React `19.3.1`, Vite `8.3.8`, Mantine `9.8.2`, TypeScript `7.0.2`, TanStack Query `5.108.4`, Zod `4.6.7`, date-fns `4.4.0`, Biome `2.6.8`, Vitest `5.1.1`.
- `vite: ^8.3.8` is pinned via pnpm overrides and drives both app builds.
- Orval `8.48.0` generates Zod schemas and operation parameter validators from `packages/contracts/openapi.yaml`; `check:generated` detects drift.
- Scalar API Reference React `0.9.96` is used only by the playground docs route and is mounted after hydration.
- Installed Start packages: `@tanstack/react-start 1.169.7`, `@tanstack/react-router 1.170.46`, `@tanstack/react-router-ssr-query 1.167.3`.
- TypeScript 7 checks CSS side-effect imports by default; `declare module "*.css" {}` is required in each TS project that imports stylesheets.
- Biome 2: `organizeImports` moved under `assist`; Markdown files are excluded from Biome with `!**/*.md`.
- Vitest 5 uses jsdom, `vitest.setup.ts` and no path alias; build/generated directories are excluded.
- `package.json` has `"type": "module"` and a `test:run` script (`vitest run`).

## Repository structure target

```text
apps/
  playground/          # TanStack Start reference app, SSR, per-request QueryClient, fixture routes
  headless-demo/       # Vite SPA, independent tokens, no Mantine/Start
packages/
  contracts/           # Zod schemas + inferred types for external API
  react/               # Public package: src/client, src/headless, src/ui
docs/adr/              # Decision records
```

Final public exports:

```text
@hpc/pricing-calendar           # provider, client, hooks, types
@hpc/pricing-calendar/headless  # logic-only primitives
@hpc/pricing-calendar/ui        # Mantine UI components
@hpc/pricing-calendar/contracts # re-exported contract types
```

Notes:
- No package named `roompricegenie`, `rpg`, pricing-calendar-ui or similar.
- Workspace package name for contracts: `@hpc/contracts`.
- Client injects base URL, credentials and property context. No credentials live in this repo.

## External API contract (canonical OpenAPI; runtime schemas generated in Stage 12)

Canonical source: `packages/contracts/openapi.yaml` (OpenAPI 3.1.1). Orval 8.48.0 writes Zod runtime schemas into `packages/contracts/src/generated/`; `src/common.ts`, `src/prices.ts` and `src/settings.ts` preserve the existing SDK-facing exports and `apiPaths`.

```text
openapi.yaml                     Public, language-neutral wire contract
orval.config.ts                  Reproducible OpenAPI → Zod generation
src/generated/                   Generated component and operation schemas
src/common.ts                    parseContract and validation error wrapper
src/{settings,prices}.ts          Stable aliases, SDK query shape and apiPaths
src/contracts.test.ts            Contract and parameter validation tests
```

Important contract rules:
- Paths are base-relative: `/settings`, `/prices?from=&to=&room=`, `/prices/:roomId/:date`. Consumers add their own base URL.
- `generatedAt` is required on `PricesResponse`; `acceptedAt` on `UpdatePriceResponse`.
- `DayPrice` is completely precomputed: `status`, `price`, `priceInPms`, `recommendedPrice`, `variance`, `availability`, `occupancy`, `restrictions`, `isClosed`, `error`.
- `price: null`, `priceInPms: null`, `recommendedPrice: null` and `variance: null` are valid for closed/unavailable days.
- `availability` includes `unavailable` in addition to `available`, `restricted` and `sold_out`.
- Variance requires backend-provided `direction`, `severity` and display `label`; no frontend threshold.
- `PricesQuerySchema` accepts `from`, `to` and `rooms: string[]`; `apiPaths.prices` serializes rooms as repeated `room=` params.
- `UpdatePriceRequestSchema` only accepts a non-negative `price`.
- `apiPaths` is exported; handlers should use it instead of hard-coded strings.

## Stage tracker

| Stage | Branch | Status | Notes |
|---|---|---|---|
| 0 | `docs/add-architecture-audit` | Complete and merged to `main` (`2bb6fb5`) | Memory, repository audit, ADR template, ADR-0001 and ADR-0002 |
| 1 | `test/stabilize-baseline` | Complete and merged to `main` (`3a0ebd9`) | Fixed stale settings tests, added `test:run`, CI, lockfile |
| 2 | `chore/upgrade-toolchain` | Complete and merged to `main` (`65d82bc`) | Node 26, Vite 8, React 19, Mantine 9, ADR-0003 |
| 3 | `feat/create-contracts-package` | Complete and merged to `main` (`c6f29a8`) | `@hpc/contracts`, ADR-0004, docs refreshed, legacy audit language removed |
| 4 | `feat/add-fixture-api-server` | Complete and merged to `main` (`eb60557`) | Static fixtures, pure router, thin Vinxi adapter, ADR-0005 |
| 5 | `feat/build-react-sdk-core` | Complete and merged to `main` (`25292ef`) | `@hpc/pricing-calendar` client, headless selectors/hooks, injected fetch/auth, ADR-0006 |
| 6 | `feat/build-mantine-ui` | Complete and merged to `main` (`881fde6`) | Tokens, rooms × dates matrix, contextual panel, ADR-0008 and ADR-0009 |
| 7 | `feat/add-contextual-pricing-indicators` | Complete and merged to `main` (`55b3bba`) | Backend-only indicators rendered accessibly |
| 8 | `refactor/move-playground-to-start` | Complete and merged to `main` (`2fce3d6`) | Start playground, SSR, per-request QueryClient, fixture routes, ADR-0007 |
| 9 | `feat/add-headless-demo-app` | Complete and merged to `main` (`7c2ea3e`) | Separate Vite SPA, independent tokens, injected fixture fetch, deterministic PATCH state |
| 10 | `docs/finalize-guides` | Complete and merged to `main` (`48ef608`) | English README, integration examples, complete CI, final branding cleanup |
| 11 | `feat/publish-openapi-contract` | Complete and merged to `main` (`822687a`) | Canonical OpenAPI 3.1.1 spec and ADR-0010; ADR-0004 now superseded in part |
| 12 | `chore/generate-zod-from-openapi` | Complete and merged to `main` (`712f895`) | Orval-generated Zod component/operation validators, CI drift check, request parameter validation; ADRs 0001, 0002, 0005, 0006 and 0010 updated |
| 13 | `feat/add-api-contract-docs` | Complete and merged to `main` (`ac8dd93`) | Scalar reference and YAML download use canonical OpenAPI; ADR-0011, ADR-0007 updated |
| 14 | `chore/configure-import-aliases` | In progress | App-scoped `@/*` aliases resolved by TypeScript, Vite and Vitest; ADR-0003 updated |

## ADR index

- [ADR-0001](docs/adr/0001-headless-backend-driven-direction.md) — Headless backend-driven direction. Accepted.
- [ADR-0002](docs/adr/0002-start-and-fixture-runtime-boundaries.md) — Start and fixture runtime boundaries. Accepted.
- [ADR-0003](docs/adr/0003-toolchain-compatibility-and-upgrade-order.md) — Toolchain compatibility and upgrade order. Accepted.
- [ADR-0004](docs/adr/0004-external-api-contracts.md) — External API domain contract. Superseded in part by ADR-0010 for source format.
- [ADR-0005](docs/adr/0005-fixture-server-without-business-logic.md) — Fixture server without business logic. Accepted.
- [ADR-0006](docs/adr/0006-public-sdk-and-headless-ui-separation.md) — Public SDK and headless/UI separation. Accepted.
- [ADR-0007](docs/adr/0007-playground-start-ssr-and-query-boundaries.md) — Playground Start SSR and query boundaries. Accepted.
- [ADR-0008](docs/adr/0008-neutral-and-overridable-ui-tokens.md) — Neutral and overridable UI tokens. Accepted.
- [ADR-0009](docs/adr/0009-backend-and-property-context-injection.md) — Backend and property context injection. Accepted.
- [ADR-0010](docs/adr/0010-openapi-canonical-api-contract.md) — OpenAPI as the canonical API contract. Accepted.
- [ADR-0011](docs/adr/0011-integrated-openapi-documentation.md) — Integrated OpenAPI documentation. Accepted.

## Stage 4 recap — fixture server

### Implemented

- Added root dependency `"@hpc/contracts": "workspace:*"` and refreshed the lockfile.
- Replaced random `api/index.ts` with:
  - `api/fixtures.ts` — fixed 3 rooms, 7 days (`2026-11-23` to `2026-11-29`), precomputed status/variance/availability/occupancy/errors and canonical update responses.
  - `api/router.ts` — pure `handleFixtureRequest({ pathname, method, searchParams, body })`, contract-safe filtering by room/date, 400/404 errors, no business rules.
  - `api/index.ts` — thin Vinxi `eventHandler` using `getRequestURL`, `readBody`, `setResponseStatus`.
- Adjusted `@hpc/contracts` after fixture validation exposed missing cases: `price` is nullable and `unavailable` is a valid availability value.
- Added `api/router.test.ts` plus a contract test for closed days.
- Added ADR-0005.
- The fixture server is developer tooling only. No client/SDK code may point to `/api`; Stage 5 consumes the external backend directly with TanStack Query and `@hpc/contracts`.
- Added `"build": "vinxi build"`, converted `postcss.config.js` to ESM, and added an `enforce: "post"` Vite plugin in `app.config.mjs` so Vite 8 writes manifests where Vinxi 0.4.3 reads them.
- Excluded `.output/` and `.vinxi/` from Biome, Vitest and git so build artifacts do not pollute checks or the working tree.

### Verification

- `pnpm install`, `pnpm lint:fix`, `pnpm lint`, `pnpm typecheck`, `pnpm test:run` pass.
- 5 test files, 27 tests pass.
- HTTP smoke check with `pnpm dev` returned correct JSON for `GET /api/settings` and filtered `GET /api/prices?from=2026-11-23&to=2026-11-24&room=1001`.

### Known issue

- Vinxi/Vite 8 dependency scan warns about legacy `@/` aliases in the old client. It does not block API routes; Stage 7 replaces that client.

## Stage 3 — discoveries

- `packages/contracts` is a private workspace package exporting `./src/index.ts` directly; no build step is needed yet.
- `@hpc/contracts` must be added as a dependency to every package/app that imports it; pnpm workspaces do not expose it globally.
- Contract tests use `parseContract` to produce a consistent `ContractValidationError` with path/code.
- Zod v4 verifies ISO dates/datetimes via `z.iso.date()` / `z.iso.datetime()`.

## Stage 2 — discoveries

- `pnpm-lock.yaml` is committed and is part of the implementation, not an artifact.
- Node 26 is mandatory; CI must use the same major version.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:run`, `pnpm build` are the canonical checks.
- `pnpm build` delegates to the playground's Vite production build.
- pnpm 12 overrides are necessary to keep transitive dev server deps aligned with Vite 8.
- Markdown files must be excluded from Biome until the docs are migrated to a formatter-compatible style.

## Workflow / working agreement

- Branch convention: `<type>/<action-verb>-<slug>`, one branch and one commit per stage.
- Commit convention: Conventional Commits, `type(scope): imperative summary`.
- Tandem workflow: implement → verify → show diff → wait for approval → commit → fast-forward `main` → next branch.
- The user often creates the commit themselves before approving the merge; always inspect `git status` and `git log --oneline -4` before merging.
- No push unless explicitly requested.
- Do not jump stages. Do not start the next stage until the current one is committed and merged.
- No comments in code unless asked.

## Stage 3 recap

- Created `packages/contracts` with settings/price/update schemas and tests.
- Added ADR-0004 and updated `Memory.md`, `docs/repository-audit.md` and `pnpm-lock.yaml`.
- Kept Vinxi as local fixture host only; no business logic was moved into contracts.
- Verified with `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test:run`.

## Stage 5 — discoveries and review record

### Implemented

- Created `packages/react` as `@hpc/pricing-calendar` with exports `.`, `./headless`, `./ui`, `./contracts`.
- `client/client.ts`: `createPricingClient({ baseUrl, propertyId, fetch?, headers?, credentials? })` builds paths from `apiPaths`, validates with `@hpc/contracts`, sends `x-property-id`, maps API errors to `PricingApiError`, forwards abort signals and returns canonical backend data.
- `client/provider.tsx`: `PricingCalendarProvider` accepts an optional per-request `QueryClient` and never creates one at module scope.
- `client/queryKeys.ts`, `client/hooks.ts`: stable keys, `useSettings`, `usePrices`, `useUpdatePrice`.
- Writes expose `isPending`, snapshot/cancel price queries, replace only the canonical day, roll back on error and invalidate on settle. No optimistic business recalculation.
- `headless/selectors.ts` and `headless/usePricingCalendar.ts`: room/day selection without Mantine or UI imports.
- `./ui` is an intentionally empty barrel reserved for Stage 6; Mantine is an optional peer.

### Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- 8 test files and 37 tests pass, covering injected headers/fetch, abort signal, contract validation, error mapping, pending writes, canonical cache replacement and headless selectors.

### Outcome

1. Reviewed and approved the Stage 5 diff.
2. Committed on `feat/build-react-sdk-core` (`25292ef`), fast-forwarded `main`, and created `feat/build-mantine-ui`.
3. Stage 6 started from the merged SDK.

## Stage 6 — Mantine UI

### Implemented

- `packages/react/src/ui/tokens.css`: neutral `--hpc-*` defaults for colors, radii, spacing, typography and grid states under `.hpc-root`.
- `theme.ts` and `Provider.tsx`: `pricingCalendarTheme` and `PricingCalendarUIProvider` supply Mantine defaults without legacy branding.
- `dateRange.ts` and `format.ts`: pure presentation helpers for inclusive ISO date columns, currency formatting from `day.currency`, and backend status labels.
- `DayCell.tsx`: accessible button in a table cell with an `aria-label` containing date, backend status, price and backend variance label when present.
- `RoomDateMatrix.tsx`: native table with `scope="col"`/`scope="row"` headers and one button cell per room/date. Uses contract data only.
- `EditPanel.tsx`: contextual panel with price input, optional reason, pending state, backend error alert and canonical response alert. No local price calculation.
- `PricingCalendar.tsx`: composes `usePricingCalendar`, loading/error states, active-room select, matrix and panel; resets mutation state when selection changes.
- `src/ui/index.ts` imports Mantine core CSS plus tokens and exports the UI surface.
- Added ADR-0008 and ADR-0009.
- Added UI tests for rendering backend data and completing a PATCH write that displays the canonical backend response.

### Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass on `feat/build-mantine-ui`.
- 11 test files and 44 tests pass, including accessible table rendering and a PATCH write that displays the backend's canonical response.
- No legacy brand names, `--rpg-*` tokens, generated random data or local business logic remain under `packages/react/src/ui`; the neutral accent defaults are `#2563eb` and `#e8f0fe`.

### Outcome

1. Reviewed and approved the Stage 6 diff.
2. Committed on `feat/build-mantine-ui` (`881fde6`), fast-forwarded `main`, and created `feat/add-contextual-pricing-indicators`.
3. Stage 7 started from the merged Mantine UI.

## Stage 7 — contextual pricing indicators

### Implemented

- `DayIndicators.tsx` derives presentation-only indicator labels from backend fields: closed dates, manual price, non-available availability, each `restrictions` string, occupancy ratio, backend error message and backend variance label.
- No local business thresholds or recomputation: restriction strings, error messages and variance labels are rendered verbatim; occupancy is only formatted as a percentage from the backend ratio.
- `DayCell.tsx` includes indicator labels in the accessible name and renders visible text badges in addition to any background color.
- `EditPanel.tsx` shows the same indicators for the selected day above the edit controls.
- `tokens.css` adds neutral badge styles with accent/danger borders; text labels remain the primary signal.
- Added indicator tests and calendar tests for restrictions, occupancy, closed dates and accessible names.

### Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass on `feat/add-contextual-pricing-indicators`.
- 12 test files and 50 tests pass, including backend-only indicator labels, restrictions, occupancy, closed dates and accessible day names.

### Outcome

1. Reviewed and approved the Stage 7 diff.
2. Committed on `feat/add-contextual-pricing-indicators` (`55b3bba`), fast-forwarded `main`, and created `refactor/move-playground-to-start`.
3. Stage 8 started from the merged UI with indicators.

## Stage 8 — TanStack Start playground

### Implemented

- Added `apps/playground` as `@hpc/playground` with TanStack Start, Vite 8 and file-based routes.
- `src/router.tsx` creates one `QueryClient` inside `getRouter()` and wires `setupRouterSsrQueryIntegration` for SSR dehydration/hydration.
- `src/routes/__root.tsx` provides the SSR document, Mantine stylesheet and playground stylesheet.
- `src/routes/index.tsx` derives an absolute API base URL from the SSR request origin, prefetches settings and prices into the per-request QueryClient, then renders the public SDK providers and `PricingCalendar`.
- Moved static fixtures and the pure router from `api/` to `apps/playground/src/fixtures/`.
- Replaced the Vinxi adapter with Start server routes for `GET /api/settings`, `GET /api/prices` and `PATCH /api/prices/:roomId/:date`.
- Removed root Vinxi/Nitro config, root SPA entry, legacy client, Tailwind/PostCSS config and Vinxi dependencies.
- Root `dev`, `build` and `start` scripts now delegate to `@hpc/playground`.
- Added ADR-0007 and marked the runtime-hosting portions of ADR-0002 and ADR-0005 as superseded.

### Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- 9 test files and 39 tests pass after removing legacy client tests.
- Smoke checks passed for SSR `/`, contract-valid `GET /api/settings`, filtered `GET /api/prices`, canonical `PATCH /api/prices/:roomId/:date`.
- No Vinxi/Nitro imports or scripts remain in source/config files.

### Outcome

1. Reviewed and approved the Stage 8 diff.
2. Committed on `refactor/move-playground-to-start` (`2fce3d6`), fast-forwarded `main`, and created `feat/add-headless-demo-app`.
3. Stage 9 started from the merged Start playground.

## Stage 9 — Headless demo app

### Implemented

- Added `apps/headless-demo` as `@hpc/headless-demo`, a plain Vite SPA with no Mantine and no TanStack Start dependency.
- `src/main.tsx` injects `fixtureFetch`, `baseUrl: "/api"` and `propertyId: "headless-demo-property"` into `PricingCalendarProvider`; the SDK never imports fixture data.
- `src/fixtureFetch.ts` adapts the shared pure fixture router into `Response` objects, proving injected transport works in a browser without an extra server.
- `src/App.tsx` consumes `usePricingCalendar` from the public SDK and renders its own room buttons, rooms × dates table, backend notes and manual-price form.
- Presentation uses independent `--demo-*` tokens, a dark surface, accessible focus states, native table markup and horizontal scrolling for small screens.
- No value is recalculated locally: status, variance labels, restrictions, occupancy, availability and canonical write responses come from the API.
- Fixed the fixture router so a valid `PATCH` applies the precomputed canonical day to in-memory state; later `GET /api/prices` now returns the canonical price instead of resetting to the original fixture.
- Root `build` now builds both apps; added `dev:demo` and `start:demo`; root `typecheck` includes the demo tsconfig.

### Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- 9 test files and 40 tests pass, including deterministic persistence of canonical fixture updates.
- Browser smoke check: the SPA renders settings, three rooms, seven days, backend labels and a manual-price form; submitting the default fixture update shows `Backend accepted $205.00 with status manual.` and the table row updates to `$205.00` / `manual`.
- No Mantine, Start, RoomPriceGenie, local price calculation or optimistic business logic in the demo.

### Outcome

1. Reviewed and approved the Stage 9 diff.
2. Committed on `feat/add-headless-demo-app` (`7c2ea3e`), fast-forwarded `main`, and created `docs/finalize-guides`.
3. Stage 10 started from the merged headless demo.

## Stage 10 — Documentation and CI finalization

### Implemented

- Rewrote `README.md` in English for the current headless architecture, workspace layout, public entry points, scripts and verification commands.
- Added `docs/integration.md` with ready-made UI, headless, transport-only and SSR examples based on the shipped API.
- Removed the obsolete challenge brief, demo GIF and orphaned `shared/types/` directory.
- Replaced remaining purple accent defaults in `packages/react/src/ui/tokens.css` with neutral blues.
- Removed the unused `@tanstack/react-query-devtools` dependency and updated the root package description.
- CI now pins pnpm `12.9.1`, reads Node from `.nvmrc`, keeps `--frozen-lockfile` and runs all four canonical checks including `pnpm build`.
- Marked `docs/repository-audit.md` as a historical snapshot and closed stale mitigation notes in ADR-0003, ADR-0005 and ADR-0006.

### Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- `pnpm install --frozen-lockfile` passes after dependency cleanup; CI uses the same install mode.
- Live user-facing docs and app code contain no legacy brand names; historical ADRs remain intentional decision records.

### Outcome

1. Reviewed and approved the Stage 10 diff.
2. Committed on `docs/finalize-guides` (`48ef608`) and fast-forwarded `main`.
3. Project closure: no further stages are planned.
