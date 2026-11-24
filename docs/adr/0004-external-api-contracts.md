# ADR-0004: External API contracts

- **Status**: Superseded in part by [ADR-0010](./0010-openapi-canonical-api-contract.md) for the contract source format; domain shape remains accepted
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

The external backend owns every business decision, but its schema is not available yet. The repository still contained loose, legacy-shaped types for settings and prices. Before building the fixture server and the React SDK, we need an explicit, versionable contract that describes only transport data and already contains every derived field the UI will render.

## Decision drivers

- No business rule may be inferred or recomputed in this repository.
- All rendered indicators (variance, status, availability, occupancy, restrictions) must arrive precomputed.
- The contract must be usable by the fixture server, the SDK and the demo apps without importing UI or framework code.
- Validation must fail loudly on malformed responses, including missing derived fields.
- Naming must be neutral and must not introduce legacy branding.

## Considered options

1. Reuse the legacy nested price shape and add optional fields over time.
2. Define a new explicit schema from scratch with fully precomputed fields.
3. Keep loosely typed `unknown` payloads and validate them later in the SDK.

## Decision outcome

Chosen option: **Option 2**, because a new schema can express the backend-driven contract precisely without inheriting legacy ambiguities.

The original implementation placed the contract in a private `@hpc/contracts` workspace package containing Zod schemas and inferred TypeScript types for:

- `GET /settings` — hotel timezone, locale, currency, rooms and date range.
- `GET /prices?from=&to=&room=` — room/day arrays with canonical price, PMS price, recommended price, variance, status, availability, occupancy, restrictions, closed flag and precomputed errors.
- `PATCH /prices/:roomId/:date` — price intent request and canonical day response.
- A generic API error envelope and a labelled `parseContract` helper.

Paths are base-relative: the consumer supplies the base URL and credentials. The contract never handles authentication or authorization.

The decision to use Zod as the canonical wire-contract source is superseded by ADR-0010. The endpoint and domain shapes remain the basis of `packages/contracts/openapi.yaml`; Orval generates the SDK's Zod runtime validators from that OpenAPI document.

### Justification

The schema mirrors the product decision that the backend is the single source of truth. Variance carries `value`, `direction`, `severity` and `label` together, so the client cannot reapplies thresholds. Status is a closed enum (`auto`, `manual`, `closed`, `unavailable`) and the update response returns the canonical day, so optimistic business calculation is impossible by construction.

## Consequences

### Positive

- Fixture server, SDK and demo apps share validated contract shapes; ADR-0010 makes OpenAPI the language-neutral source of truth.
- Missing derived fields fail validation in tests and at runtime.
- The package has no React, Mantine or Start dependency.
- All new names are neutral; no legacy branding is introduced.

### Negative and mitigations

- The legacy client currently uses a different nested shape — mitigation: Stages 4–7 adapt the fixture server and client to this contract before the UI rewrite.
- The schema is a proposal until the real external backend is available — mitigation: changing it later is a contract-version decision, not a UI change.

## Compliance and verification

- `pnpm lint`, `pnpm typecheck` and `pnpm test:run` pass.
- Contract tests accept complete payloads and reject missing variance fields, unknown statuses and malformed settings.
- No file in `packages/contracts` imports business calculation code.

## Links

- [Memory](../Memory.md)
- [ADR-0001](./0001-headless-backend-driven-direction.md)
- [ADR-0003](./0003-toolchain-compatibility-and-upgrade-order.md)
- [ADR-0010](./0010-openapi-canonical-api-contract.md)
- https://zod.dev/?id=basic-usage
