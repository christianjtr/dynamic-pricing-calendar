# ADR-0009: Backend and property context injection

- **Status**: Superseded by [ADR-0012](./0012-pivot-to-reference-app.md); the property-context rule is retained there
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

The legacy client chose its API host from the browser, sent hotel parameters from a global context, inferred timezone and currency locally, and used `propertyId` as if it were an authorization boundary. An embeddable SDK must let each host application decide how to reach the backend and how to authenticate, while treating property identity as data rather than a secret.

## Decision drivers

- Every environment can point the SDK at a different backend base URL.
- Credentials and headers never live in this repository.
- SSR hosts can supply per-request fetch, cookies and headers.
- Property selection is explicit and visible in every API call.
- The temporary fixture server is not a runtime dependency of the SDK.

## Considered options

1. Read `window.location` and use relative `/api` routes.
2. Add module-level environment variables and a singleton authenticated client.
3. Inject `baseUrl`, `fetch`, `headers`, `credentials` and `propertyId` through `PricingCalendarProvider`.

## Decision outcome

Chosen option: **Option 3**.

`createPricingClient(config)` receives the full transport configuration from the consumer:

- `baseUrl` — root URL of the external backend, with no implicit `/api` suffix.
- `propertyId` — required context sent as `x-property-id`.
- `fetch` — optional injected implementation, including an SSR-bound fetch wrapper.
- `headers` — static or async function returning headers from the host's auth layer.
- `credentials` — standard Fetch credentials mode chosen by the host.

`apiPaths` returns base-relative paths only. The client joins them to `baseUrl`. No credential, token or tenant secret is stored in this repository. `propertyId` identifies the property context; authorization remains the responsibility of the backend and the host application.

`PricingCalendarProvider` memoizes the client and accepts an optional per-request `QueryClient`, making multiple embedders and SSR safe.

### Justification

Injection is the only option that satisfies framework independence, SSR and multiple property contexts without hardcoding deployment assumptions. Sending `x-property-id` on every call makes the context auditable without pretending it is a security control.

## Consequences

### Positive

- The same package works with local fixtures, staging and production backends.
- Hosts control authentication, CSRF, cookies, tracing headers and retries at the transport layer.
- No module-scope client or `window` access leaks between requests.

### Negative and mitigations

- Consumers must configure the provider correctly — mitigation: runtime errors and tests cover missing provider usage.
- Backend must still authorize requests independently — mitigation: documented explicitly here and in ADR-0006.
- Async header functions add a small per-request cost — mitigation: hosts can cache their own token lookup.

## Compliance and verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- Client tests cover injected fetch, async headers, abort signal, `x-property-id`, contract failures and mapped API errors.
- Grep over `packages/react` finds no `vinxi` import, no hard-coded `/api` request path and no stored credential.

## Links

- [Memory](../Memory.md)
- [ADR-0006](./0006-public-sdk-and-headless-ui-separation.md)
- [ADR-0004](./0004-external-api-contracts.md)
- https://developer.mozilla.org/docs/Web/API/Request/credentials
