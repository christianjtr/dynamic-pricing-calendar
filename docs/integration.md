# Integration guide

This repository is a reference implementation, not a published SDK and not a backend. A backend implements one small HTTP contract; the demo renders those responses, using labelled fixtures by default and a live `baseUrl` when configured. No pricing logic lives in this repository.

## Who owns what

| Concern | Your backend | This repository |
| --- | --- | --- |
| Prices, recommendations, variance | Computes them | Displays the returned values verbatim |
| Availability, occupancy, restrictions, closed dates | Computes them | Displays them with non-color-only indicators |
| Timezone, locale, currency | Owns them | Formats numbers and dates with them |
| Manual price intent | Decides, persists, returns the canonical day | Sends the request and shows the response |
| Property context and authorization | Authenticates and authorizes | Sends `x-property-id` only |
| Wire contract | Implements it | Publishes it in OpenAPI and validates responses with Zod |

A backend can be written in any language. It does not need to install a TypeScript package from this repository.

## 1. Implement the contract

The canonical artifact is [`packages/contracts/openapi.yaml`](../packages/contracts/openapi.yaml), OpenAPI 3.1.1. It defines three operations:

- `GET /settings` — property settings, rooms and the available date range.
- `GET /prices?from=…&to=…&room=…` — backend-computed days, inclusive range, repeatable `room`.
- `PATCH /prices/{roomId}/{date}` — a manual price intent; the response is canonical.

Every request carries the required `x-property-id` header. It identifies property context; it is **not** an authorization mechanism. Authentication is deployment-specific and stays in your backend.

### `GET /settings`

```http
GET /api/settings
x-property-id: hotel-42
Accept: application/json
```

```json
{
  "hotel": {
    "timezone": "Pacific/Auckland",
    "locale": "en-NZ",
    "currency": "NZD"
  },
  "rooms": [
    {
      "id": "1001",
      "name": "Single Room",
      "description": "One guest, one queen bed, 18 m².",
      "isReference": true
    },
    {
      "id": "1002",
      "name": "Double Room",
      "isReference": false
    }
  ],
  "dateRange": {
    "from": "2026-11-23",
    "to": "2026-12-31"
  }
}
```

`isReference` marks the room selected on first load. `description` is optional. The room selector follows this array, so adding a room needs no frontend change.

### `GET /prices`

```http
GET /api/prices?from=2026-11-23&to=2026-11-23&room=1001
x-property-id: hotel-42
Accept: application/json
```

```json
{
  "timezone": "Pacific/Auckland",
  "currency": "NZD",
  "generatedAt": "2026-11-23T22:30:00.000Z",
  "rooms": [
    {
      "roomId": "1001",
      "name": "Single Room",
      "days": [
        {
          "roomId": "1001",
          "date": "2026-11-23",
          "status": "auto",
          "currency": "NZD",
          "price": 189,
          "priceInPms": 182,
          "recommendedPrice": 185,
          "variance": {
            "value": 4.2,
            "direction": "up",
            "severity": "high",
            "label": "+4.2%"
          },
          "availability": "restricted",
          "occupancy": 0.72,
          "restrictions": ["min-stay:2"],
          "isClosed": false,
          "error": null
        }
      ]
    }
  ]
}
```

Every field in `DayPrice` is required. Nullable fields must be present as `null`, not omitted. `occupancy` is a fraction from `0` to `1`. `generatedAt` must be a UTC timestamp ending in `Z`. Enums are `auto | manual | closed | unavailable` for `status` and `available | restricted | sold_out | unavailable` for `availability`.

### `PATCH /prices/{roomId}/{date}`

```http
PATCH /api/prices/1001/2026-11-26
x-property-id: hotel-42
Content-Type: application/json

{ "price": 199, "reason": "Peak demand" }
```

```json
{
  "day": {
    "roomId": "1001",
    "date": "2026-11-26",
    "status": "manual",
    "currency": "NZD",
    "price": 199,
    "priceInPms": 182,
    "recommendedPrice": 185,
    "variance": null,
    "availability": "available",
    "occupancy": 0.77,
    "restrictions": [],
    "isClosed": false,
    "error": null
  },
  "acceptedAt": "2026-11-25T22:30:00.000Z"
}
```

The backend decides whether to accept the intent. The returned `day` is the only value the UI shows after a write: no optimistic price, no local recalculation of variance or occupancy. Errors use the envelope `{"error": {"code": "…", "message": "…"}}`; the message is displayed as returned.

### Minimal handler sketch

Framework-agnostic, using the platform `Request` and `Response`. Replace `pricing` with your own service that owns all business decisions.

```ts
const pricing = createYourPricingService();

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const propertyId = request.headers.get("x-property-id");
  if (!propertyId) return json({ error: { code: "missing_property", message: "x-property-id is required" } }, 400);

  if (url.pathname === "/api/settings" && request.method === "GET") {
    return json(await pricing.settings(propertyId));
  }

  if (url.pathname === "/api/prices" && request.method === "GET") {
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!from || !to) return json({ error: { code: "bad_range", message: "from and to are required" } }, 400);
    return json(await pricing.prices(propertyId, {
      from,
      to,
      rooms: url.searchParams.getAll("room"),
    }));
  }

  const update = url.pathname.match(/^\/api\/prices\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/);
  if (update && request.method === "PATCH") {
    const body = await request.json();
    return json(await pricing.update(propertyId, update[1], update[2], body));
  }

  return json({ error: { code: "not_found", message: "Unknown operation" } }, 404);
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}
```

Validate your responses against the canonical schema before wiring the demo. `pnpm --filter @hpc/contracts check:generated` confirms the published Zod validators match the YAML.

## 2. Connect the demo to your backend

The demo calls its own fixture router by default. Set `window.pricingCalendarApi` before the app script in `apps/demo/index.html` to call a real backend instead:

```html
<script>
  window.pricingCalendarApi = {
    baseUrl: "https://pricing.example.com/api",
    propertyId: "hotel-42",
  };
</script>
```

`baseUrl` may be relative (`"/api"`) or absolute. Trailing slashes are ignored. `propertyId` defaults to `"demo-property"`. With a `baseUrl`, the fixture badge becomes **Backend connected**, the intro describes the live source, and the same Zod validation and error handling stay in place. Without it, nothing changes: the demo remains explicit static fixtures.

```bash
pnpm install
pnpm dev
```

A cross-origin `baseUrl` needs CORS headers on your backend for the demo origin, including the `x-property-id` request header. There is no proxy in this repository.

## 3. Check your integration

- `GET /settings` returns at least one room with a stable `id`.
- `from` and `to` are inclusive ISO full dates; a reversed range returns empty day arrays.
- Every `DayPrice` field is present, including `null` values.
- `generatedAt` and `acceptedAt` end in `Z`.
- Errors use the `error.code` / `error.message` envelope.
- `PATCH` returns the canonical day after a successful write.
- The backend, not this app, decides authorization for `x-property-id`.

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Calendar still shows fixture data | `baseUrl` not set | Add the config before the app script |
| Browser CORS error | Backend does not allow the demo origin | Allow the origin and `x-property-id`, or use a relative `baseUrl` |
| "Pricing API request failed…" | Status outside 2xx | Check the response code and error envelope |
| Validation error after fetch | Response does not match the schema | Compare with `/docs` and the examples above |
| `400` on price requests | Missing or malformed `from` / `to`, unknown room | Check the query string |
| Price does not change after save | `PATCH` response missing the canonical day | Return the updated `day` |

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

The scope is the calendar UI only: `/faq`, `/integrate`, Swagger UI on `/docs`, and shared chrome such as the site header and theme switch remain owned by the integrator. Contract enums use registry keys (`status.*`, `availability.*`) when translated and fall back to the raw value otherwise. Open-ended backend strings — room names and descriptions, restrictions, error messages, currencies — are shown verbatim and marked `translate="no"` where appropriate.

## Demo behavior

The room selector follows the backend's `rooms` array without a hard-coded count and shows the active room's optional description. The **Today** button resolves the current date in the hotel's timezone and selects it, shifting the `?from=`/`?to=` range when needed. The selected room, date, visible range and `?edit=1` editor state are encoded in the URL for sharing; periods outside the returned range show a blank state with a shortcut back to the demo range. Selecting a day only changes the selection; the pencil action in that row opens a native dialog anchored to the button, with a bottom-sheet layout on narrow screens. Currency is shown once in the card header and numbers use `Intl` so separators follow the active locale. The header switch toggles dark and light tokens and stores the choice locally.

## API documentation

Swagger UI at `/docs` in the demo app renders the canonical OpenAPI file and offers a download link for the YAML. The docs chunk is loaded only on that route. Implementing the contract does not by itself prove that a backend is conformant; that requires testing against a real implementation.

## Limitations

- Zod validation confirms shape, types and enums. It does not prove business correctness or conformance of a real backend; that needs end-to-end testing against your implementation.
- No backend, SDK, proxy, authentication UI or backend persistence is provided. `x-property-id` is sent as data and must be authorized server-side; it is fixed at boot, so there is no runtime property switcher.
- A cross-origin backend must allow the demo origin and the `x-property-id` header through CORS.
- The demo caps a visible range at 366 days and has no realtime refresh or offline mode.
- Calendar locale is an English key registry with simple `{name}` interpolation: no plural rules and no bundled translations. `messagesUrl` is same-origin and waits at most three seconds. `/faq`, `/integrate`, `/docs` and shared chrome are not translated.
- `PATCH` is an intent: the backend decides whether to accept it, and the UI shows only the canonical day returned. There is no optimistic price.
- The contract is version `0.1.0`. Breaking changes require a version bump, regenerated validators and a new review of the demo.

## Verification

```bash
pnpm --filter @hpc/contracts check:generated
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

The UI was reviewed against the pinned Web Interface Guidelines during the final quality pass.
