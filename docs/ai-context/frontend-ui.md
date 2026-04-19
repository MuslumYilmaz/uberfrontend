# Frontend UI Context

Load this for Angular UI, styling, shared-ui, and design-system work.

## When to load
- The task changes Angular components, templates, shared UI primitives, tokens, or visual styling.
- The prompt mentions PrimeNG, shared-ui, typography, spacing, design-system, or theme consistency.

## When not to load
- The task is backend-only, question-content-only, or content authoring/review.
- The change is a pure logic/service update with no UI surface or styling consequence.

## Non-negotiables
- Use shared UI primitives in `frontend/src/app/shared/ui/` for interactive controls.
- Do not introduce new raw PrimeNG usage or new `::ng-deep` outside approved bridge layers.
- Reuse `frontend/src/styles/tokens.scss` and existing shared-ui typography/spacing patterns instead of one-off colors or font styles.
- Keep layout classes local to features and keep reusable visual treatment in primitives/tokens.

## Path triggers
- `frontend/src/app/shared/ui/**`
- `frontend/src/app/shared/components/**`
- `frontend/src/app/features/**/*.html`
- `frontend/src/app/features/**/*.scss`
- `frontend/src/styles/**`

## Deep reference
- `frontend/src/app/shared/ui/README.md`
- `AGENTS.md`
