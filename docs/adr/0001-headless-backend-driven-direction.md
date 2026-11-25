# ADR-0001: Headless Pricing Calendar with externally computed business logic

- **Status**: Accepted
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

> Scope note: ADR-0012 keeps the headless boundary but drops the published SDK. The demo app now owns the client and presentation.

## Context and problem statement

The repository currently contains a single React application that combines three responsibilities: a mock API that generates prices at request time, API client hooks that fetch and project data, and a Mantine UI that also computes business rules (the 4% variance threshold in `client/src/features/OptimizedRates/services/rateComputations.ts`). The product direction calls for an embeddable, white-label pricing calendar whose backend is an external service: all pricing, availability and validation decisions are computed there. The client must therefore become a thin integration layer and a replaceable presentation.

The question is: what boundary separates this repository from the external backend, and how much logic is allowed inside the SDK?

## Decision drivers

- Backend owns the business; the frontend owns the experience.
- A developer must integrate the calendar with an API URL, a property ID and injected credentials.
- The visual layer must be replaceable without reimplementing data access or interactions.
- The repository must stay lightweight: no RMS, no plugin system, no premature multi-tenancy.

## Considered options

1. **Headless SDK plus optional default UI** — one public React package with `client`, `headless` and `ui` entry points; all business values arrive precomputed from the external backend.
2. **Full-stack revenue management implementation in this repository** — implement pricing rules, availability and persistence locally behind a local backend.
3. **UI-only component library** — ship presentation components and let each consumer implement data access.

## Decision outcome

Chosen option: **1. Headless SDK plus optional default UI**.

The external backend is the single source of truth for property context, currency, timezone, rooms, prices, recommendations, variance, availability, occupancy, restrictions, business validation and persistence. The language-neutral wire shape is specified by OpenAPI per ADR-0010; structural validation in this repository checks conformance to that contract. This repository contains only:

- `packages/contracts`: the canonical OpenAPI contract and generated Zod runtime schemas, with precomputed values (for example `variance { value, direction, severity }` and `status: auto | manual | closed | unavailable`). No threshold constants and no business formulas.
- `packages/react/src/client`: typed transport and credential injection. Property IDs identify context; they never authorize.
- `packages/react/src/headless`: server state, selection and navigation; `updatePrice` forwards an intent and exposes a `pending` state.
- `packages/react/src/ui`: a default Mantine presentation and centralized design tokens. Mantine is an optional peer dependency and is never imported by `client` or `headless`.

Writes always render the canonical value returned by the backend. No local price calculation or optimistic business recalculation is permitted; an optimistic update may only express submission state.

The default presentation is a rooms × dates matrix with a contextual side panel for editing. A second, independent presentation in another app proves that the headless contract is sufficient.

### Justification

Option 1 satisfies every driver: it is embeddable, UI-agnostic and small, and it removes the risk of client/server rule drift. Option 2 contradicts the direction by duplicating the external backend. Option 3 would force every consumer to reimplement API communication, state and error handling.

## Consequences

### Positive

- No business rule can diverge between the external backend and this repository.
- Consumers can replace the whole presentation without touching data access.
- The local fixture server can be verified against the same contract used in production.
- Tests focus on contracts, transport, state and rendering of backend-provided states.

### Negative and mitigations

- The SDK depends on an external API that is not available yet — mitigate by versioning the OpenAPI contract and validating SDK boundaries with generated Zod schemas.
- Local development needs an external service — mitigate with the deterministic fixture server described in ADR-0002.
- Contract drift is possible once the real API appears — mitigate by keeping all wire shapes in `packages/contracts` and changing them in one place.

## Compliance and verification

- No business threshold, pricing formula or availability decision exists in this repository (reviewed during Stage 4 and each later stage).
- `packages/react/src/headless` has no import from `@mantine/*` or from `packages/react/src/ui`.
- The second presentation app runs against the same contract without importing the default UI.
- Write interactions display backend-returned values, never client-computed prices.

## Links

- [Repository audit](../repository-audit.md)
- [ADR-0002](0002-start-and-fixture-runtime-boundaries.md)
- [ADR-0010](0010-openapi-canonical-api-contract.md)
