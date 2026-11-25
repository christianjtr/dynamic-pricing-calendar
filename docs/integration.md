# Integration guide

This repository is a reference implementation, not a published SDK. A backend implements the OpenAPI contract; the demo app renders the responses. No pricing logic lives in this repository.

## Contract

The canonical artifact is [`packages/contracts/openapi.yaml`](../packages/contracts/openapi.yaml), OpenAPI 3.1.1. It defines `GET /settings`, `GET /prices` and `PATCH /prices/{roomId}/{date}`, with query parameters, headers, bodies, responses and errors. Generated Zod validators in `@hpc/contracts` keep the demo and its tests aligned with that artifact.

A backend can be written in any language. It does not need to install a TypeScript package from this repository.

## Backend responsibilities

- Compute prices, recommendations, variance, availability, occupancy, restrictions, currency and business validation.
- Treat the `PATCH /prices/{roomId}/{date}` response as the only canonical value after a write.
- Interpret `x-property-id` as request context and perform its own authorization. The header never authorizes by itself.

The frontend renders the returned fields and never recalculates a displayed price from `recommendedPrice`, `occupancy` or `variance`.

## Demo data

The demo uses explicit static fixtures, visibly labelled as fixture data. They demonstrate the contract and the UI flow; they are not an integration with a real backend and do not derive business rules. The selected room, date, visible `?from=`/`?to=` range and `?edit=1` editor state are encoded in the URL for sharing; periods outside the fixture range show an explicit empty state. Selecting a day only changes the selection; the pencil action in that row opens a native dialog anchored to the button, with a bottom-sheet layout on narrow screens. The table groups In PMS under Price, variance under Recommended and occupancy under Availability. Currency is shown once in the card header; numeric values use `Intl` so separators follow the active locale.

The header switch toggles dark and light tokens and stores the choice locally. It is a user preference, not shared URL state. Swagger UI keeps its own styles on `/docs`. An in-app FAQ at `/faq` explains navigation, selection versus editing, URL parameters and saving a manual price intent.

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

The UI was reviewed against the pinned Web Interface Guidelines during the final quality pass.
