# Repository Audit

Scope: read-only inspection of the repository at `main` (commit `55fcc29`), performed before any migration. This document covers the six requested deliverables: current architecture assessment, comparison with the target direction, technology migration plan, proposed minimal structure, phased roadmap, and functionality that must not be lost.

## 1. Current architecture assessment

### Backend and data

- `app.config.mjs` defines two Vinxi routers: an SPA (`./index.html`) and an HTTP router mounted at `/api` with handler `api/index.ts`.
- `api/index.ts` is a single `eventHandler` that dispatches by pathname prefix. There is no HTTP method check, no 404 for unknown paths, no request validation, no authentication, no persistence and no write operation.
- `/api/prices` generates 365 days × 3 rooms on every request with `Math.random()`. Room IDs (`1001`, `1002`, `1003`) and base prices are hardcoded. `last_run_pricing_time` is formatted in the server's local timezone with no offset.
- `/api/settings` hardcodes `Pacific/Auckland`, `en-NZ`, one reference room and two derived rooms.
- `nitro.config.ts` derives `compatibilityDate` from the build clock, making builds non-reproducible. `api/tsconfig.json` includes `api/src/**/*`, which does not exist, so a standalone `tsc -p api` cannot work.

### Integration layer

- There is no package and no public API surface. Fetch calls live in `client/src/services/hotel-api/{prices,settings}.ts`; query hooks live in `client/src/hooks/queries/*`; a module-scope `QueryClient` is created in `client/src/index.tsx`.
- Everything is coupled to the application: `@/*` path aliases, relative `/api/*` URLs, and `HotelSettingsContext` (a Mantine-aware UI context).
- Zod validation exists only in the client (`client/src/types/Pricing.ts`, `HotelSettings.ts`). `shared/types/*` is plain TypeScript with no runtime validation, producing drift: the wire shape uses `price_in_pms` / `error_reason`, while the transformed client shape uses `priceInPms` / `errorReason`.
- No credential injection mechanism exists, and `propertyId` is not part of any request.
- There are no price modification operations in the codebase.

### Frontend and state

- React 18 with TanStack Query v5 for server state, React Context for ephemeral UI state (`locale`, display timezone, `selectedRoomId`), and component-local state for navigation.
- `useCalendar` is instantiated twice: once in `PricingCalendar.tsx` and once in `BaseCalendar/index.tsx`. `PricingCalendar` writes `_activeDate` but never reads it, so navigation state can diverge.
- `BaseCalendar` exposes a `renderDay` render prop, a useful seed for headless rendering, but it imports `useHotelSettingsContext` and owns its own calendar hook, so it is not presentational.
- Business rules live in the frontend: `rateComputations.ts` decides the 4% high-disparity threshold and the error/empty states. This must not exist in the target product.
- Known functional bugs:
  - `rateComputations.ts:17` checks `price === null` before `dayData.error`, so "NO MARKET DATA" / "PRICING ERROR" is unreachable for API error days (the API returns `price: null` with `error: true`).
  - `date.ts:getWeekDaysLabels` derives labels from "now" instead of the Monday that starts the rendered grid; weekday headers misalign with columns.
  - `browserAPI.ts:getCurrencyFromLocale` always formats with `USD` and uses a manual symbol map, ignoring the `currency` returned by `/api/prices`.
  - `SettingsPanel.tsx` resets the timezone twice on locale change and depends on the experimental `Intl.Locale.getTimeZones()`.
  - `PricingCalendar` and `BaseCalendar` maintain independent month state.
- Styling: Mantine 7 components and tokens, Tabler icons, inline style objects. Tailwind 3 and PostCSS are configured but unused (no `@tailwind` directives, no `className` usages, and the Tailwind content glob misses `client/src/**/*.tsx`).

### Tests, tooling and documentation

- Three tests exist: `useCalendar.test.ts`, `BaseCalendar.test.tsx`, `settings.test.ts`. Three assertions in `settings.test.ts` expect `null` on error paths while the implementation throws; the README explicitly describes these as a structural sample, but this makes the suite misleading.
- No lockfile exists and `pnpm-lock.yaml` is ignored. `package.json` has no `build`, `start`, `preview`, `engines` or `packageManager`. README says pnpm; CHALLENGE.md says npm.
- `@vinxi/react` and `@mantine/hooks` are declared but unused. Build plugins are in `dependencies`.
- No CI configuration. `vitest.config.ts` puts `alias` under `test` rather than top-level `resolve`; `vitest.setup.ts` mocks `matchMedia` but not `ResizeObserver`.
- No client-side router; the only navigation is month state.

## 2. Comparison with the proposed direction

| Capability | Current state | Target | Action |
|---|---|---|---|
| Property context | Hardcoded in the HTTP handler | Owned by the external backend, selected by property ID | Define contract; fixture server mirrors it |
| Business rules (4%, recommendation, availability) | Computed in React | Computed only by the external backend | Remove from repository |
| Calendar data | Two unfiltered endpoints | Typed query by property, date range and rooms | New contract and SDK client |
| Availability, occupancy, restrictions, closed dates | Absent | Provided precomputed by external backend | Add to contract and UI progressively |
| Price modification | Absent | Intent forwarded to backend; canonical result returned | Add to SDK and UI side panel |
| API contracts | Plain TS shared types + client-only Zod | Single shared Zod contract | Consolidate in `packages/contracts` |
| Ready-to-use integration | Absent | `<PricingCalendar apiUrl propertyId />` | New `ui` entry point |
| Headless integration | Absent | `usePricingCalendar()` | New `headless` entry point |
| Theming / white-label | Internal Mantine tokens | CSS variables and consumer overrides | New token layer |
| Two presentations | One SPA | Start playground + separate Vite SPA | New apps consuming one SDK |
| Authentication | Absent | Injected by consumer; backend enforces permissions | New client option |
| Timezone | Browser/hooks with `date-fns-tz` | Property IANA timezone from backend, presentation-only formatting | Refactor |
| Tooling and DX | Incomplete scripts, no lockfile or CI | Pinned pnpm/Node, full scripts, CI, reliable tests | Refactor |

## 3. Technology migration plan and compatibility

| Area | Current | Target | Note |
|---|---|---|---|
| Runtime | Node 25.8.2 locally, unpinned | Node 26 LTS | Install locally; pin in `engines`, `.nvmrc` and CI. `@types/node` 26 is available |
| Package manager | pnpm 12.9.1, lockfile ignored | pnpm 12.x, committed lockfile | `packageManager` field; shared workspace lockfile |
| Language | TypeScript 6.0.3 | TypeScript 7.x | Native Go compiler: same `tsc` command from RC, JS API needs Node ≥ 20.16, own LSP (VS Code `js/ts.experimental.useTsgo`), `baseUrl` removed. Current config uses only `paths`, so no blocking issue |
| UI runtime | React 18.3 | React 19.3 | Verify peers of Mantine 9 and `react-error-boundary` 6 |
| Build | Vinxi 0.4 | Vite 8.x | `build.lib` for the SDK, externalizing React/Query. Start plugin must precede React plugin |
| UI library | Mantine 7.13 | Mantine 9.x | Optional peer in `packages/react/src/ui` only |
| Server state | Query 5.59 | Query 5.108 | No major change |
| Validation | Zod 4.4 | Zod 4.6 | Single source of truth for wire shapes |
| Dates | date-fns 4.1 + date-fns-tz 3.2 | date-fns 4.4 | Evaluate `@date-fns/tz` compatibility |
| Tooling | Biome 1.9.4, Vitest 4 | Biome 2.6.8, Vitest 5.1.1 | Biome schema and `assist.actions.source` migration; Vitest alias at `resolve.alias` |

Migration order (no bulk upgrade up front):

1. Stabilize baseline with current versions: fix stale tests, repair tsconfigs, add `test:run`, commit a lockfile, minimal CI.
2. Run a compatibility spike for TypeScript 7, React 19, Mantine 9, Vite 8 and TanStack Start; record results in ADR-0003.
3. Upgrade the toolchain in one commit.
4. Add contracts, fixture server, SDK, UI and apps incrementally.

References: [Vite library mode](https://vite.dev/guide/build#library-mode), [pnpm workspaces](https://pnpm.io/workspaces), [TypeScript native preview](https://github.com/microsoft/typescript/blob/main/packages/typescript/README.md), [TanStack Start + Query](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query), [TanStack Router search params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params).

## 4. Proposed minimal repository structure

```text
dynamic-pricing-calendar/
├── apps/
│   ├── api/                     # deterministic fixture server, existing runtime, no business logic
│   ├── playground/              # TanStack Start reference app (SSR)
│   └── headless-demo/           # Vite SPA, second presentation, own tokens
├── packages/
│   ├── contracts/               # Zod schemas for the external API
│   └── react/                   # single public package
│       └── src/{client,headless,ui}
├── docs/adr/                    # numbered ADRs, English
├── docs/repository-audit.md
├── Memory.md
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

Public exports: `.` (ready-to-use), `./headless`, `./ui`, `./contracts`. React, Query, Zod and date-fns are peer dependencies; Mantine is an optional peer used only by `./ui`. A single lockfile is shared by the workspace. Contracts are a separate package from the beginning because both the fixture server and the SDK consume them.

## 5. Phased implementation roadmap

| Stage | Branch | Deliverable |
|---|---|---|
| 0 | `docs/add-architecture-audit` | This audit, `Memory.md`, ADR template, ADR-0001 and ADR-0002 |
| 1 | `test/stabilize-baseline` | Correct stale tests, repair tsconfigs, `test:run`, lockfile with current versions, minimal CI |
| 2 | `chore/upgrade-toolchain` | Install Node 26, compatibility spike and upgrade, ADR-0003 |
| 3 | `feat/create-contracts-package` | External API schemas, ADR-0004 |
| 4 | `feat/add-fixture-api-server` | Deterministic fixtures, no business logic, ADR-0005 |
| 5 | `feat/build-react-sdk-core` | Client and headless hooks, injected auth, pending/refetch writes, ADR-0006 |
| 6 | `feat/build-mantine-ui` | Tokens, rooms × dates matrix, contextual edit panel, base indicators, ADR-0008 and ADR-0009 |
| 7 | `feat/add-contextual-pricing-indicators` | Render backend-provided restrictions, closed dates, manual price and occupancy accessibly |
| 8 | `refactor/move-playground-to-start` | Start playground with SSR and per-request QueryClient, ADR-0007 |
| 9 | `feat/add-headless-demo-app` | Separate Vite SPA with independent presentation and tokens |
| 10 | `docs/finalize-guides` | English README and integration examples, complete CI, Memory.md closure |

Each stage is one branch and one commit after review. Verification per stage: `pnpm lint`, `pnpm typecheck`, `pnpm test:run`, `pnpm build`; from Stage 4 onward, a contract → fixture → SDK → UI smoke check; from Stage 6 onward, responsive and accessibility checks.

## 6. Existing functionality that must not be lost

- 365-day pricing grid for three rooms with reference/derived room definitions.
- Month navigation (previous, next, today) and locale-aware month labels.
- User-selectable display timezone backed by IANA data.
- Current versus recommended price display, with variance direction and the ≥ 4% alert semantics (now delivered by the backend).
- Error states: "NO MARKET DATA", "PRICING ERROR", "NO INVENTORY", plus loading overlay and retry actions.
- Room selection and room category labels.
- Desktop grid and mobile list presentations, tooltips and "today" highlighting.
- RoomPriceGenie branding assets and basic theme tokens.
- Runtime validation of API responses and typed client hooks with caching, retries and devtools.
- The working agreement: ADRs, Memory.md, conventional commits, branch convention and tandem review before every commit.
