# ADR-0008: Neutral and overridable UI tokens

- **Status**: Accepted
- **Date**: 2026-11-23
- **Deciders**: project owner, implementation agent

## Context and problem statement

The legacy UI hardcodes `#5B48EE`, Mantine default palette names and inline sizes. It cannot be white-labeled, and its vocabulary still exposes the old product brand. The new published UI needs a neutral design language that consumers can override without forking components.

## Decision drivers

- Support multiple properties with different visual identities.
- Keep the embedded calendar visually consistent without importing legacy branding.
- Avoid coupling presentation tokens to backend data or pricing rules.
- Make token override points inspectable in the browser and in tests.

## Considered options

1. Keep Mantine's default palette and expose a `primaryColor` prop.
2. Define product-specific CSS variables under a neutral `--hpc-*` namespace.
3. Generate a new Mantine theme per consumer from JavaScript configuration.

## Decision outcome

Chosen option: **Option 2**.

`packages/react/src/ui/tokens.css` defines defaults for colors, radii, spacing and font sizes under `.hpc-root`:

- Color tokens: `--hpc-color-surface`, `--hpc-color-surface-muted`, `--hpc-color-border`, `--hpc-color-text`, `--hpc-color-text-muted`, `--hpc-color-accent`, `--hpc-color-accent-soft`, `--hpc-color-danger`, `--hpc-color-danger-soft`, `--hpc-color-success`.
- Shape tokens: `--hpc-radius-sm`, `--hpc-radius-md`.
- Spacing tokens: `--hpc-space-1` through `--hpc-space-4`.
- Typography tokens: `--hpc-font-size-xs`, `--hpc-font-size-sm`, `--hpc-font-size-md`.

`PricingCalendar` renders a `.hpc-root` wrapper. Consumers override any token with a more specific CSS rule or an inline `style` on their embedding container. Mantine remains the component system, but pricing UI styles read the neutral variables instead of product-brand literals.

`pricingCalendarTheme` in `src/ui/theme.ts` provides Mantine defaults. It does not encode a vendor brand.

### Follow-up: matrix cell sizing

The rooms-by-dates matrix keeps native table semantics while its rows use CSS Grid for alignment. Grid items and day buttons must be allowed to shrink to their column tracks; indicator badges wrap long backend-provided labels instead of forcing adjacent cells wider. Horizontal scrolling remains on the matrix wrapper.

### Justification

CSS variables are the smallest override surface that works for SSR, SPAs and shadow-DOM-free embedding. A neutral namespace prevents collisions with host applications and makes the removal of legacy branding explicit. Keeping defaults in CSS means the UI renders correctly without consumer configuration.

## Consequences

### Positive

- White-label changes require token overrides, not component changes.
- No `--rpg-*`, `RoomPriceGenie` or brand-color literals remain in the new UI.
- Tokens are available to both Mantine and plain CSS in the same tree.

### Negative and mitigations

- CSS variables are not typed — mitigation: tokens are documented here and centralized in `tokens.css`.
- `PricingCalendar` must be wrapped in `.hpc-root` — mitigation: the component creates it automatically; `PricingCalendarUIProvider` supplies the Mantine theme.
- Host CSS specificity can override defaults unexpectedly — mitigation: all token defaults live in one class and are namespaced.

## Compliance and verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` and `pnpm build` pass.
- UI tests assert that the calendar renders an accessible rooms-by-dates table and writes through the backend.
- Browser checks at desktop and mobile widths confirm day buttons stay within their cells while long indicators wrap.
- Grep over `packages/react/src/ui` finds no legacy brand names, `--rpg-*` tokens or `#5B48EE`.

## Links

- [Memory](../Memory.md)
- [ADR-0006](./0006-public-sdk-and-headless-ui-separation.md)
- [ADR-0001](./0001-headless-backend-driven-direction.md)
- https://mantine.dev/theming/theme-object/
