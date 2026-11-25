# Integration guide

This repository is a reference implementation, not a published SDK. A backend implements the OpenAPI contract; the demo app renders the responses. No pricing logic lives in this repository.

> The code is being migrated to this shape. See [ADR-0012](adr/0012-pivot-to-reference-app.md) for the pivot decision.

## Contract

The canonical artifact is [`packages/contracts/openapi.yaml`](../packages/contracts/openapi.yaml), OpenAPI 3.1.1. It defines `GET /settings`, `GET /prices` and `PATCH /prices/{roomId}/{date}`, with query parameters, headers, bodies, responses and errors. Generated Zod validators in `@hpc/contracts` keep the demo and its tests aligned with that artifact.

A backend can be written in any language. It does not need to install a TypeScript package from this repository.

## Backend responsibilities

- Compute prices, recommendations, variance, availability, occupancy, restrictions, currency and business validation.
- Treat the `PATCH /prices/{roomId}/{date}` response as the only canonical value after a write.
- Interpret `x-property-id` as request context and perform its own authorization. The header never authorizes by itself.

The frontend renders the returned fields and never recalculates a displayed price from `recommendedPrice`, `occupancy` or `variance`.

## Demo data

The demo uses explicit static fixtures, visibly labelled as fixture data. They demonstrate the contract and the UI flow; they are not an integration with a real backend and do not derive business rules.

## API documentation

Swagger UI at `/docs` in the demo app renders the canonical OpenAPI file and offers a download link for the YAML. The docs chunk is loaded only on that route. Implementing the contract does not by itself prove that a backend is conformant; that requires testing against a real implementation.

## Verification

```bash
pnpm --filter @hpc/contracts check:generated
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

The UI is reviewed against the pinned Web Interface Guidelines before the pivot is closed.
