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

The demo uses explicit static fixtures, visibly labelled as fixture data. They demonstrate the contract and the UI flow; they are not an integration with a real backend and do not derive business rules. The room selector follows the backend's `rooms` array without a hard-coded count and shows the active room's optional `description`. The **Today** button resolves the current date in the hotel's timezone and selects it, shifting the `?from=`/`?to=` range when needed. The selected room, date, visible range and `?edit=1` editor state are encoded in the URL for sharing; periods outside the fixture range show a blank state with a shortcut back to the demo range. Selecting a day only changes the selection; the pencil action in that row opens a native dialog anchored to the button, with a bottom-sheet layout on narrow screens. The table groups In PMS under Price, variance under Recommended and occupancy under Availability. Currency is shown once in the card header; numeric values use `Intl` so separators follow the active locale.

The header switch toggles dark and light tokens and stores the choice locally. It is a user preference, not shared URL state. Swagger UI keeps its own styles on `/docs`. An in-app FAQ at `/faq` explains navigation, selection versus editing, URL parameters and saving a manual price intent.

## Calendar locale

The calendar ships with an English message registry and stable keys. There is no runtime i18n dependency and no repository-authored translation bundle. The integrator supplies locale data before the app boots, either inline or from a same-host JSON file:

```html
<script>
	window.pricingCalendarI18n = {
		locale: "fr-FR",
		title: "Calendrier des tarifs",
		messagesUrl: "/i18n/pricing-calendar.fr.json",
	};
</script>
```

The JSON file is a flat map of the published keys, for example `{ "calendar.title": "…", "empty.body": "…" }`. Inline `messages` are supported as well. `messagesUrl` must stay on the same origin; cross-origin URLs are ignored. Missing keys fall back to English, unknown keys are ignored, and the app waits for the file before the first render so translated users never see an English flash. That wait is bounded to three seconds: a stalled or failed request falls back to English instead of blocking the app. `locale` sets `<html lang>` and `title` overrides `document.title`.

The scope is the calendar UI only: `/faq` body copy, Swagger UI on `/docs`, and shared chrome such as the site header and theme switch remain owned by the integrator. Contract enums use registry keys (`status.*`, `availability.*`) when translated and fall back to the raw value otherwise. Open-ended backend strings — room names and descriptions, restrictions, error messages, currencies — are shown verbatim and marked `translate="no"` where appropriate.

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
