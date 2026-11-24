# ADR-0011: Integrated OpenAPI documentation

- **Status**: Accepted
- **Date**: 2026-11-25
- **Deciders**: project owner, implementation agent

## Context and problem statement

Backend teams need a place to read and download the language-neutral contract, plus enough integration guidance to implement it without depending on the React SDK. OpenAPI is already canonical per ADR-0010; the documentation must display that same artifact rather than maintaining another API description.

## Decision drivers

- Keep the specification available as a downloadable YAML artifact.
- Make endpoint details browsable and interactive in the existing reference frontend.
- Explain property context, deployment-specific authentication, canonical updates and the fixture boundary.
- Avoid copying the OpenAPI document into a second manually maintained file.
- Keep Scalar out of the SDK package and avoid evaluating its React wrapper during SSR.

## Considered options

1. Keep only Markdown and link to the YAML file in the repository.
2. Host an interactive API reference as a separate documentation application.
3. Serve the canonical YAML from the existing Start playground and render it at `/docs/api`.

## Decision outcome

Chosen option: **Option 3**.

`apps/playground` serves the canonical `packages/contracts/openapi.yaml` at `/openapi.yaml` and renders it with Scalar at `/docs/api`. The file is imported as a Vite raw asset, so the documented/downloaded artifact is the same source used by Orval. The playground configures Scalar's Try Request UI to use its local `/api` fixtures; this server override is not written into the backend-neutral OpenAPI document. Scalar's React wrapper is dynamically imported and mounted after hydration because its documentation does not claim SSR support. The SDK remains independent of the playground and Scalar.

The page supplements the reference with implementation notes, including that the fixture API is not a production backend and `x-property-id` is not authorization.

## Justification

Reusing the existing playground avoids a second app and deployment surface, while serving the spec directly keeps it usable by clients and backend teams that do not install the private TypeScript workspace package.

## Consequences

### Positive

- The same versioned YAML drives runtime validators and interactive documentation.
- Backend developers can download the specification without consuming React packages.
- The reference app demonstrates the SDK and its backend contract in one place.

### Negative and mitigations

- The interactive reference adds a documentation dependency and a large client chunk to the playground — keep it out of `packages/react`, lazy-load it only on the docs route, and its stylesheet only with that route.
- Scalar's React integration is not verified for SSR — mount it after client hydration and keep the page's explanatory content and spec download available without it.
- The spec route is part of the playground deployment — retain the repository link as the portable source artifact.

## Compliance and verification

- `/openapi.yaml` serves the exact contents of `packages/contracts/openapi.yaml` with a YAML content type and download filename.
- `/docs/api` loads Scalar from `/openapi.yaml`, explains the integration boundaries and provides a direct download link.
- Scalar's Try Request uses `/api` fixtures and is labeled as a local demo, while the OpenAPI document itself declares no deployment server.
- Home page links to `/docs/api`; the document route does not import Scalar into the SDK.
- Typecheck, lint, tests and both app builds pass.

## Links

- [ADR-0007](./0007-playground-start-ssr-and-query-boundaries.md)
- [ADR-0010](./0010-openapi-canonical-api-contract.md)
- [Scalar React integration](https://github.com/scalar/scalar/blob/main/documentation/integrations/react.md)
