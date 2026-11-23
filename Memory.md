# Memory

Last updated: Stage 7 (Contextual pricing indicators in progress).

## Project goal

Transform `dynamic-pricing-calendar` into a **Headless Pricing Calendar**: a reusable React component library that displays prices computed by an external backend. This repository must not calculate prices, recommendations, variance, availability, occupancy, restrictions, closed dates, currency, timezone or validation. It only transports, validates, caches and renders backend data.

Backend author: project owner. Product owner instruction: “toda la lógica se computa en un backend externo, nuestro producto sólo muestra la información”. UI team focus: product and presentation layer.

## Locked decisions (do not revisit without explicit approval)

1. Backend is the single source of truth for all pricing logic and data shape.
2. Frontend must not implement fallback pricing logic, random generation, business thresholds or optimistic local business decisions.
3. Vinxi/Nitro remains only as the temporary local fixture server, ADR-0002 / ADR-0005.
4. React SDK will be framework-agnostic; TanStack Start exists only in the playground, ADR-0002 / ADR-0007.
5. `@tanstack/react-query` is the client cache/write layer.
6. Zod is the runtime validator, centralized in `@hpc/contracts`, ADR-0004.
7. Headless hooks and UI components must be in separate package exports, ADR-0006.
8. Rooms × dates matrix is the base visualization; contextual panel edits one day.
9. Manual prices, restrictions, closed dates and occupancy need non-color-only indicators from Stage 4 onward.
10. Design tokens must be neutral (`--hpc-*`, not `--rpg-*`) and consumer-overridable, ADR-0008.
11. Wallet/auth, tenant and property context are injected by the consuming app; `propertyId` identifies context but never authorizes. ADR-0009.
12. All legacy branding references will disappear as stages progress.
13. Fixture server serves explicit static data only; it never derives prices or computes business rules, ADR-0005.
14. The published SDK must consume the external backend directly through TanStack Query and `@hpc/contracts`; it must never call or depend on the local Vinxi fixture server.

## Toolchain baseline

- Node: `v26.13.1` via `pnpm runtime set node 26 -g -y`. There is no nvm-managed Node in this shell. `pnpm shim add node` failed with `ERR_PNPM_SHIM_BIN_CONFLICT`, but the runtime works and `pnpm` selects Node 26.
- pnpm: `12.9.1`. Workspace config lives in `pnpm-workspace.yaml`; the `pnpm` field in `package.json` is ignored by pnpm 12.
- pnpm config: `allowBuilds` plus `minimumReleaseAgeExclude` entries for TanStack packages were auto-added by pnpm; keep them unless intentionally updated.
- Versions installed: React `19.3.1`, Vite `8.3.8`, Mantine `9.8.2`, TypeScript `7.0.2`, TanStack Query `5.108.4`, Zod `4.6.7`, date-fns `4.4.0`, Biome `2.6.8`, Vitest `5.1.1`.
- `vite: ^8.3.8` is pinned via pnpm overrides; legacy Vinxi peer metadata still mentions older Vite ranges, but `pnpm dev` already served API routes successfully on Vite 8.
- `tsconfig.json` uses `skipLibCheck: true` due to optional peer declarations in Vinxi/Nitro.
- Biome 2: `organizeImports` moved under `assist`; Markdown files are excluded from Biome with `!**/*.md`.
- Vitest 5: `@/*` alias is configured via `resolve.alias` using `fileURLToPath(new URL('./client/src', import.meta.url))`.
- `package.json` has `"type": "module"` and a `test:run` script (`vitest run`).

## Repository structure target

```text
apps/
  api/                 # Vinxi/Nitro fixture server (contract-serving only)
  playground/          # TanStack Start reference app, SSR, per-request QueryClient
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

## External API contract (Stage 3, refined in Stage 4)

Package: `packages/contracts` (`@hpc/contracts`):

```text
src/common.ts    IsoDateSchema, IsoDateTimeSchema, CurrencyCodeSchema, ApiErrorSchema, parseContract
src/settings.ts  RoomSchema, SettingsResponseSchema
src/prices.ts    PriceStatusSchema, DayVarianceSchema, DayAvailabilitySchema, DayPriceSchema,
                 PricesResponseSchema, PricesQuerySchema, UpdatePriceRequestSchema,
                 UpdatePriceResponseSchema, apiPaths
src/contracts.test.ts
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
| 7 | `feat/add-contextual-pricing-indicators` | In progress — awaiting review | Render backend restrictions, closed dates, manual price, occupancy accessibly |
| 8 | `refactor/move-playground-to-start` | Pending | Start playground, SSR, per-request QueryClient, ADR-0007 |
| 9 | `feat/add-headless-demo-app` | Pending | Separate Vite SPA with independent tokens |
| 10 | `docs/finalize-guides` | Pending | English README, integration examples, complete CI, closure |

## ADR index

- [ADR-0001](docs/adr/0001-headless-backend-driven-direction.md) — Headless backend-driven direction. Accepted.
- [ADR-0002](docs/adr/0002-start-and-fixture-runtime-boundaries.md) — Start and fixture runtime boundaries. Accepted.
- [ADR-0003](docs/adr/0003-toolchain-compatibility-and-upgrade-order.md) — Toolchain compatibility and upgrade order. Accepted.
- [ADR-0004](docs/adr/0004-external-api-contracts.md) — External API contracts. Accepted.
- [ADR-0005](docs/adr/0005-fixture-server-without-business-logic.md) — Fixture server without business logic. Accepted.
- [ADR-0006](docs/adr/0006-public-sdk-and-headless-ui-separation.md) — Public SDK and headless/UI separation. Accepted.
- ADR-0007 — Playground Start SSR and query boundaries. Planned for Stage 8.
- [ADR-0008](docs/adr/0008-neutral-and-overridable-ui-tokens.md) — Neutral and overridable UI tokens. Accepted.
- [ADR-0009](docs/adr/0009-backend-and-property-context-injection.md) — Backend and property context injection. Accepted.

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
- `pnpm build` runs `vinxi build`, which remains the legacy Vite/Vinxi validation until Stage 8.
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
- No `RoomPriceGenie`, `BRAND_COLORS`, `#5B48EE`, `--rpg-*`, `vinxi`, `rateComputations`, `hasHighDisparity` or `Math.random` references exist under `packages/react/src/ui`.

### Outcome

1. Reviewed and approved the Stage 6 diff.
2. Committed on `feat/build-mantine-ui` (`881fde6`), fast-forwarded `main`, and created `feat/add-contextual-pricing-indicators`.
3. Stage 7 started from the merged Mantine UI.

## Stage 7 (current) — contextual pricing indicators

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

### Next actions

1. Review the Stage 7 diff after verification.
2. After approval, commit on `feat/add-contextual-pricing-indicators`, fast-forward `main`, and create `refactor/move-playground-to-start`.
3. Stage 8: replace the Vinxi client app with a TanStack Start playground, per-request QueryClient and ADR-0007; remove the temporary fixture runtime.
