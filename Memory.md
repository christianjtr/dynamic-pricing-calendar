# Memory

Living record of project decisions. Inspired by the Architecture Decision Records in [`docs/adr`](docs/adr), but intentionally shorter: this file answers "what is currently true and why" without replacing the ADRs. All project documentation is written in English.

Last updated: 2026-11-23 — Stage 0 (repository audit).

## Product direction

A lightweight, developer-friendly, **headless pricing calendar**. The external backend owns every business decision (prices, recommendations, variance, availability, occupancy, restrictions, currency, timezone, validation and persistence). This repository only transports, validates, caches and renders that information.

> One external backend. One simple React integration package. Multiple experiences. No business logic in this repository.

## Locked decisions

| # | Decision | Rationale | ADR |
|---|----------|-----------|-----|
| 1 | Headless SDK with an optional default UI; Mantine is never part of the headless contract | Host applications must be able to replace the entire presentation | [0001](docs/adr/0001-headless-backend-driven-direction.md) |
| 2 | The 4% threshold and every other rule are computed externally; responses carry precomputed fields | Business logic must not be duplicated in the client | [0001](docs/adr/0001-headless-backend-driven-direction.md) |
| 3 | TanStack Start is used only in the reference apps; the SDK stays framework-agnostic | Keeps the SDK embeddable while retaining the previously chosen framework | [0002](docs/adr/0002-start-and-fixture-runtime-boundaries.md) |
| 4 | The existing Vinxi/Nitro HTTP runtime becomes a deterministic fixture server, with no business logic | Preserves the current runtime and enables local development without the external backend | [0002](docs/adr/0002-start-and-fixture-runtime-boundaries.md) |
| 5 | The second presentation is a separate Vite SPA app with its own tokens | Proves the SDK is independent of Start and Mantine | [0002](docs/adr/0002-start-and-fixture-runtime-boundaries.md) |
| 6 | Property ID identifies context; it never authorizes. Credentials are injected by the consumer | Backend must enforce access permissions | [0001](docs/adr/0001-headless-backend-driven-direction.md) |
| 7 | Writes show `pending` state only, then render the canonical backend response; no local price calculation | The backend is the single source of truth | [0001](docs/adr/0001-headless-backend-driven-direction.md) |
| 8 | Contract is defined from scratch with fully precomputed fields | The external API schema is not available yet | [0004](docs/adr/0004-external-api-contracts.md) (planned) |
| 9 | Design tokens are CSS variables (`--rpg-*`) with a Mantine theme derived from them | White-label without touching component internals | [0008](docs/adr/0008-design-tokens-and-white-label.md) (planned) |
| 10 | Default calendar is a rooms × dates matrix; price editing happens in a contextual side panel | Information density for operational pricing work | [0009](docs/adr/0009-matrix-and-contextual-editing.md) (planned) |
| 11 | All documentation is written in English | Shared project language for docs and ADRs | — |

## Toolchain targets

Node.js 26 LTS (installed locally and pinned in `engines`, `.nvmrc` and CI) · pnpm 12 with a committed lockfile and `packageManager` · TypeScript 7.x (native compiler; compatibility spike required) · React 19.3 · Vite 8.x · Mantine 9.x (optional, UI package only) · TanStack Query 5.x · Zod 4.x · date-fns 4.x · Biome 2.6.x · Vitest 5.1.x.

No bulk dependency upgrade before the baseline is green. Compatibility is validated in Stage 2 and recorded in ADR-0003.

## ADR index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](docs/adr/0001-headless-backend-driven-direction.md) | Headless Pricing Calendar with externally computed business logic | Accepted |
| [0002](docs/adr/0002-start-and-fixture-runtime-boundaries.md) | TanStack Start in reference apps only; fixture server runtime | Accepted |
| 0003 | Toolchain compatibility and upgrade order | Planned — Stage 2 |
| 0004 | External API contracts | Planned — Stage 3 |
| 0005 | Fixture server without business logic | Planned — Stage 4 |
| 0006 | React SDK core and injected authentication | Planned — Stage 5 |
| 0007 | SSR query integration in the playground | Planned — Stage 8 |
| 0008 | Design tokens and white-label | Planned — Stage 6 |
| 0009 | Calendar matrix and contextual editing | Planned — Stage 6 |

## Working agreement

- Sequential stages, one branch per stage: `<type>/<action-verb>-<slug>` (for example `feat/add-fixture-api-server`).
- Conventional Commits: `type(scope): imperative summary`; reference ADRs in the commit footer when applicable.
- Tandem workflow: implement, verify, show the diff and test results, **wait for explicit approval**, then commit and merge locally to `main`. No push unless requested.
- Every stage ends with `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` (where applicable).
- Never store secrets in the repository; credentials are injected by the consumer at runtime.

## Stage tracker

| Stage | Branch | Status |
|-------|--------|--------|
| 0 | `docs/add-architecture-audit` | In progress — awaiting review |
| 1 | `test/stabilize-baseline` | Pending |
| 2 | `chore/upgrade-toolchain` | Pending |
| 3 | `feat/create-contracts-package` | Pending |
| 4 | `feat/add-fixture-api-server` | Pending |
| 5 | `feat/build-react-sdk-core` | Pending |
| 6 | `feat/build-mantine-ui` | Pending |
| 7 | `feat/add-contextual-pricing-indicators` | Pending |
| 8 | `refactor/move-playground-to-start` | Pending |
| 9 | `feat/add-headless-demo-app` | Pending |
| 10 | `docs/finalize-guides` | Pending |
