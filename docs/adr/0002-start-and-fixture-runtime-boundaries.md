# ADR-0002: TanStack Start in reference apps only; fixture server for local development

- **Status**: Partially superseded by [ADR-0007](./0007-playground-start-ssr-and-query-boundaries.md) for the fixture runtime; otherwise Accepted
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

TanStack Start was selected earlier as the modernization framework. The product direction subsequently specified a headless, embeddable SDK, a backend that is external to this repository, and a preference for keeping the existing backend framework unless there is a concrete reason to change it. Local development must also work without the external service.

We need to decide where TanStack Start lives, what happens to the existing Vinxi/Nitro HTTP handler in `api/index.ts`, and how the second presentation is hosted.

## Decision drivers

- Keep the React SDK independent of any full-stack framework.
- Preserve the previously chosen TanStack Start investment where it adds value.
- Avoid framework proliferation and unnecessary infrastructure.
- Make local development deterministic and independent of the external backend.

## Considered options

1. **TanStack Start everywhere, including as the backend runtime** — replaces the existing HTTP handler with server functions.
2. **TanStack Start only in reference apps; keep the HTTP runtime as a fixture server** — chosen.
3. **Drop TanStack Start; plain Vite SPA for every app** — contradicts the earlier decision.
4. **Remove the local server; mock in the browser with MSW/Vite plugins** — contradicts the preference to keep the existing runtime.

## Decision outcome

Chosen option: **2**.

- `apps/playground` is a TanStack Start application and the main reference integration. It may use SSR and file-based routing, but it consumes the public SDK exactly as a third-party application would.
- `apps/headless-demo` is a plain Vite SPA with its own presentation and tokens, proving that neither Start nor Mantine leaks into the headless contract.
- `apps/api` originally kept the Vinxi/Nitro HTTP runtime as a deterministic fixture server. Stage 8 supersedes this hosting choice; ADR-0007 moves the fixture endpoints into Start server routes while keeping the same no-business-logic rule.
- The runtime baseline is Node.js 26 LTS with pnpm pinned; TypeScript 7 adoption is gated by the compatibility check in ADR-0003.

### Justification

The SDK remains portable because neither app framework is imported by `packages/react/src/client` or `headless`. The fixture server preserves existing runtime knowledge, removes non-determinism that would break SSR hydration and lets both apps develop against one stable contract.

## Consequences

### Positive

- Two different hosts (Start SSR and Vite SPA) validate the "one package, multiple experiences" claim.
- Local development and tests are reproducible: fixtures are fixed, not random.
- No migration of the existing HTTP runtime is needed in the initial phases.

### Negative and mitigations

- Two app frameworks increase setup surface — mitigate by keeping both apps minimal and sharing one SDK package.
- Fixture data can drift from the real external API — mitigate by validating it at runtime with Zod schemas generated from the canonical OpenAPI contract.
- The fixture server is not a business backend — mitigate by documenting that it never computes values and must not receive rule logic.

## Compliance and verification

- `packages/react` has no dependency on `@tanstack/react-start`.
- `apps/headless-demo` has no dependency on `@mantine/*` or `@tanstack/react-start`.
- Fixture endpoints contain no threshold, pricing formula or random data generation; responses are static fixtures validated against the shared schemas.
- Both apps consume the same SDK entry points and property context.

## Links

- [Repository audit](../repository-audit.md)
- [ADR-0001](0001-headless-backend-driven-direction.md)
- [ADR-0010](0010-openapi-canonical-api-contract.md)
