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
- Treat spacing and text wrapping as user-trust requirements. Verify user-facing changes at 360/390px mobile, 834px tablet, and 1366/1440px desktop widths.
- Give grid and flex children `min-width: 0` where content must shrink. Prefer responsive reflow and readable line lengths over squeezing content into a fixed row.
- Let prose wrap at normal word boundaries. Keep short labels and CTAs intact as flex/grid items; do not use `word-break: break-all` or `overflow-wrap: anywhere` to conceal layout problems.
- Never restructure projected or authored DOM during server rendering (wrapping tables, inserting buttons). Hydration walks the prerendered DOM expecting the template structure; a mismatch mis-binds nodes or crashes with a null node in `hasSkipHydrationAttrOnRElement`. Author wrappers such as `.table-scroll` in the template, keep attribute-only tweaks (heading ids) on the server, and run DOM enhancers in the browser after hydration via `afterNextRender`. `ngSkipHydration` is not a fix for this.
- A timer or interval that outlives the first render must run outside the Angular zone (see `AppComponent.scheduleToNextMidnight`). While one is pending the app never turns stable, and then the router skips every scroll reset and anchor jump and hydration leaves prerendered DOM in place. `seo-ssr.spec.ts` guards the scroll contract.
- A `@defer` block that takes layout space needs an `@placeholder` of the same size, or the page jumps when it mounts. The server draws the placeholder only when the `when` condition starts false; one that is already true draws nothing. See `sidebarReady` in `AppComponent`.
- Authored copy can carry backticks and `**`. Print it with `fa-inline-code`, or with `stripInlineMarkup` or `normalizeEditorialPlainText` where only plain text fits; bare interpolation shows the markers to the reader.
- The site footer (`shared/components/footer/site-footer.component.*`, links in `core/content/site-footer.json`) renders from the app shell on every public page and must stay static: no auth-dependent branches, no query-string links, no `/guides` or `/html-css/interview-questions`. Trivia detail embeds it inside its own scroll panel; coding workspaces and private routes carry none. `npm run seo:site-footer` audits the prerendered pages.

## Path triggers
- `frontend/src/app/shared/ui/**`
- `frontend/src/app/shared/components/**`
- `frontend/src/app/features/**/*.html`
- `frontend/src/app/features/**/*.scss`
- `frontend/src/styles/**`

## Deep reference
- `frontend/src/app/shared/ui/README.md`
- `AGENTS.md`
