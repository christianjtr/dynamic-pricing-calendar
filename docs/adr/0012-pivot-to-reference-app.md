# ADR-0012: Pivot to a contract-first reference app

- **Status**: Accepted
- **Date**: 2026-11-25
- **Deciders**: project owner, implementation agent

## Context and problem statement

The repository grew a published-style React SDK, a TanStack Start playground, a second Vite demo, Scalar API docs, a tarball smoke test and eleven ADRs. The promise — any backend can implement the contract and any client can consume the SDK — is larger than the artifact: there is no registry release, `@hpc/contracts` is private, the SDK exports TypeScript source, and no external backend has been tested for conformance. Most of the effort went into packaging and process instead of into a demo a reader can understand.

## Decision drivers

- Keep the promise small and verifiable.
- Keep the backend as the only source of pricing logic.
- Keep OpenAPI as the language-neutral contract.
- Reduce the repository to one application with a polished, accessible UI.
- Keep documentation in English and follow web interface best practices.

## Considered options

1. Keep the SDK and finish the release work.
2. Slim the SDK but keep it as a distributable package.
3. Drop the SDK; keep the contract, interactive API docs and one reference app.

## Decision outcome

Chosen option: **3**. This repository is a reference implementation, not a distributable SDK.

> This repository is a reference implementation: an OpenAPI contract for prices computed by an external backend, interactive API documentation, and one demo application that displays backend-provided data. It does not compute prices, ship an SDK, or claim that a conforming external backend exists.

Target layout:

- `packages/contracts` — OpenAPI 3.1.1 plus generated Zod validators.
- `apps/demo` — one Vite app: fixture-driven calendar, date navigation, shadcn/ui + Tailwind, and Swagger UI at `/docs`.
- No `packages/react`, no Start playground, no external-consumer app and no tarball smoke test.

ADR-0001 and ADR-0010 remain accepted. The property-context rule from ADR-0009 is retained here: `x-property-id` identifies context; the backend authorizes.

### Superseded decisions

- ADR-0002 and ADR-0007 — Start and fixture runtime boundaries; the runtime is now one Vite app.
- ADR-0003 — app-scoped aliases are no longer a decision worth recording separately.
- ADR-0004 — contract source format, absorbed by ADR-0010.
- ADR-0005 — fixture hosting; fixtures stay explicit, but the fixture server is gone.
- ADR-0006 — public SDK and headless/UI separation; the SDK is dropped.
- ADR-0008 — Mantine tokens; the UI moves to shadcn/ui + Tailwind.
- ADR-0009 — property context, folded into this decision.
- ADR-0011 — Scalar docs, replaced by Swagger UI inside the demo app.

## Consequences

### Positive

- The promise matches the artifact a reader can run.
- One app to build, test and deploy.
- The contract stays usable by any backend team without installing TypeScript packages.

### Negative and mitigations

- Consumers cannot import a React SDK — mitigation: the contract and a working demo are the integration surface; publishing a package is out of scope.
- Swagger UI adds a bundle — mitigation: load it only on `/docs`.
- shadcn/ui is copied source — mitigation: keep the component set small and review changes against the pinned Web Interface Guidelines.

## Compliance and verification

- Documentation describes only the target above; SDK language is removed or marked superseded.
- Implementation branches remove the SDK, the Start playground and the smoke-test artifacts, then build a single Vite app.
- `/docs` renders `packages/contracts/openapi.yaml` with Swagger UI.
- The UI was reviewed against the pinned Web Interface Guidelines in `chore/ux-and-quality-pass`.

## Links

- [ADR-0001](./0001-headless-backend-driven-direction.md)
- [ADR-0010](./0010-openapi-canonical-api-contract.md)
- [OpenAPI contract](../../packages/contracts/openapi.yaml)
