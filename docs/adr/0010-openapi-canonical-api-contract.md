# ADR-0010: OpenAPI as the canonical API contract

- **Status**: Accepted
- **Date**: 2026-11-25
- **Deciders**: project owner, implementation agent

## Context and problem statement

The pricing calendar is intended to work with backends implemented in different languages and platforms. The current contract is defined as Zod schemas in the private `@hpc/contracts` TypeScript workspace package. That validates the React SDK at runtime but is not a language-neutral artifact that backend teams can adopt directly.

The API surface already exists as `GET /settings`, `GET /prices` and `PATCH /prices/{roomId}/{date}`. We need one public, versioned wire contract that documents operations and data shapes without coupling its source to React or TypeScript.

## Decision drivers

- Backend teams must be able to implement the API without using TypeScript or React.
- The contract must describe HTTP operations as well as request and response schemas.
- Runtime validation in the React SDK must remain available.
- Documentation and fixtures must derive from, or be checked against, the same contract.
- The fixture server remains a test double and does not become the production pricing backend.

## Considered options

1. Keep Zod as the source and generate OpenAPI from TypeScript.
2. Make OpenAPI 3.1.1 canonical and generate the SDK's runtime schemas from it.
3. Maintain OpenAPI and Zod separately by hand.

## Decision outcome

Chosen option: **Option 2**. `packages/contracts/openapi.yaml` is the canonical, versioned HTTP contract. The SDK keeps using Zod for runtime validation, and its schemas are generated from OpenAPI; the two definitions must not evolve independently.

The OpenAPI document describes the current endpoints, the repeated `room` query parameter, the required `x-property-id` context header, request and response models, and the shared API error envelope. Orval 8.48.0 generates the SDK's Zod component and operation schemas, including query, path, header, body and response validation; the existing HTTP client and `apiPaths` remain hand-written. The property header is context only; each backend remains responsible for authentication and authorization. No server URL or authentication scheme is mandated because these vary by deployment.

## Justification

OpenAPI is an HTTP-level, language-neutral artifact that can be read by backend teams and tooling without requiring the private TypeScript package. Keeping Zod as a generated runtime layer preserves the SDK's current boundary validation without making its implementation language the public contract.

## Consequences

### Positive

- Backend implementations in different stacks can target the same downloadable contract.
- The same artifact can drive the interactive API reference and client/server tooling.
- React, TanStack Query and the local fixture runtime remain implementation details.

### Negative and mitigations

- OpenAPI generators may not preserve every runtime constraint, especially parameter and date semantics — verify generation coverage and keep conformance tests for generated schemas.
- Generated schemas must be regenerated when OpenAPI changes; CI runs Orval's `--outdated` check to detect drift.
- An OpenAPI contract alone does not prove that a backend conforms — test implementations against shared examples and conformance cases when they become available.

## Compliance and verification

- `packages/contracts/openapi.yaml` is valid OpenAPI 3.1.1 and covers the implemented endpoint shapes.
- Operation paths, methods, headers, parameters and response schemas agree with `apiPaths`, the SDK client and fixture routes.
- Orval generation covers query, path, header, body and response schemas; contract tests cover representative valid and invalid parameters.
- `pnpm --filter @hpc/contracts check:generated` passes against the committed generated output.
- `apiPaths` serialization and the SDK client use the generated parameter schemas.

## Links

- [ADR-0004](./0004-external-api-contracts.md)
- [ADR-0006](./0006-public-sdk-and-headless-ui-separation.md)
- [OpenAPI Specification 3.1.1](https://spec.openapis.org/oas/v3.1.1.html)
- [Orval Zod generation guide](https://orval.dev/docs/guides/zod)
