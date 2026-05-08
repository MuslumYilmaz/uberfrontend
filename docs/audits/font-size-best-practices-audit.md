# Font-Size Best-Practice Audit

_Historical audit. Do not load by default; route into context only for typography, font-size, design-token, readability, or UI-density investigations._

## Summary
- The app has a typography token foundation, but component-level `font-size` declarations now dominate the system.
- The current global body baseline is `14px`; the recommended target baseline is `16px`, expressed through rem-based tokens so user font preferences and browser zoom remain effective.
- Keep product density explicit: compact metadata, badges, counters, and code-runner surfaces may use smaller semantic roles, while body copy, forms, navigation, guide/article content, and primary controls should converge on readable tokens.
- Do not migrate every literal in one large patch. Start with tokens and shared utilities, then migrate high-traffic surfaces, then enforce drift with a static audit.

## Local Baseline
Source of truth:
- `frontend/src/styles/tokens.scss` defines `--uf-body-size: 14px`, `--uf-meta-size: 13px`, `--uf-page-title-size: 28px`, `--uf-section-title-size: 20px`, and `--uf-subsection-title-size: 16px`.
- `frontend/src/styles/utilities.scss` applies `--uf-body-size` globally to `html`, `body`, form controls, buttons, and common text elements.

Static audit, scoped to `frontend/src/app` and `frontend/src/styles`:
- `1042` total `font-size:` declarations.
- `99` files contain explicit `font-size:` declarations.
- Most common values: `12px` (`241`), `13px` (`155`), `11px` (`112`), `14px` (`82`), `16px` (`32`).
- `628` literal small `px` declarations match `8px`, `9px`, `10px`, `11px`, `12px`, `12.5px`, `13px`, `13.5px`, or `14px`.
- `162` declarations are `16px+` or fluid `clamp(...)` sizes.

Reproduce the counts:

```bash
rg -n "font-size\s*:" frontend/src/app frontend/src/styles --glob '*.{css,scss,ts}' | wc -l
rg -n "font-size\s*:" frontend/src/app frontend/src/styles --glob '*.{css,scss,ts}' | cut -d: -f1 | sort -u | wc -l
rg -o "font-size\s*:\s*[^;]+" frontend/src/app frontend/src/styles --glob '*.{css,scss,ts}' | sed 's/.*font-size[[:space:]]*:[[:space:]]*//' | sort | uniq -c | sort -nr
rg -n "font-size\s*:\s*(8|9|10|11|12|12\.5|13|13\.5|14)px" frontend/src/app frontend/src/styles --glob '*.{css,scss,ts}' | wc -l
rg -n "font-size\s*:\s*1[6-9]px|font-size\s*:\s*[2-9][0-9]px|font-size\s*:\s*clamp" frontend/src/app frontend/src/styles --glob '*.{css,scss,ts}' | wc -l
```

## External Patterns
- Atlassian separates design text styles from code typography tokens, includes font size and line height in those tokens, and uses `rem` for typography token output.
- USWDS treats font tokens as the official path for component font family and size, outputs font size in `rem`, and explicitly supports respecting user font size through a `100%` root.
- Carbon uses calibrated type tokens and distinguishes compact product typography from larger expressive/editorial typography.
- Shopify Polaris exposes a tight product scale from `11px` through larger display sizes, but does so through named tokens instead of arbitrary component literals.
- Material 3 defines role-based styles such as body, label, title, headline, and display; it also notes products can use a reduced subset instead of all default styles.
- MDN recommends relative values for accessibility and explains `rem` avoids `em` compounding.
- WCAG 2.2 Resize Text requires text to scale up to 200% without loss of content or functionality; Reflow expects readable horizontal-language content to fit at a 320 CSS px equivalent width without page-level two-dimensional scrolling for normal text.

Competitor/reference scan:
- GreatFrontEnd exposes a Tailwind-like typography ladder from `text-2xs` to `text-4xl`.
- Zen Frontend uses CSS variables such as `--text-xs` through `--text-5xl`.
- The common pattern is not one exact base size; it is tokenized roles, restrained scales, and clear separation between dense UI and reading surfaces.

## Recommended Scale
Add rem-based primitive tokens:

```scss
--uf-text-xs: 0.75rem;   /* 12px */
--uf-text-sm: 0.875rem;  /* 14px */
--uf-text-base: 1rem;    /* 16px */
--uf-text-lg: 1.125rem;  /* 18px */
--uf-text-xl: 1.25rem;   /* 20px */
--uf-text-2xl: 1.5rem;   /* 24px */
--uf-text-3xl: 1.875rem; /* 30px */
--uf-text-4xl: 2.25rem;  /* 36px */
```

Add semantic aliases:

```scss
--uf-body-size: var(--uf-text-base);
--uf-body-sm-size: var(--uf-text-sm);
--uf-label-size: var(--uf-text-sm);
--uf-caption-size: var(--uf-text-xs);
--uf-page-title-size: var(--uf-text-3xl);
--uf-section-title-size: var(--uf-text-xl);
--uf-card-title-size: var(--uf-text-base);
--uf-control-size: var(--uf-text-sm);
--uf-code-size: var(--uf-text-sm);
```

Keep specialized compact tokens for code-runner/results surfaces, but convert them to rem and document them as exceptions:

```scss
--fa-runner-font: 0.75rem;
--fa-runner-font-sm: 0.6875rem;
--fa-runner-title: 0.75rem;
```

## Migration Roadmap
1. Token foundation:
   - Introduce the primitive and semantic tokens above in `frontend/src/styles/tokens.scss`.
   - Update `frontend/src/styles/utilities.scss` helper classes to consume semantic tokens instead of literal `11px`, `13px`, `14px`, and `16px`.
   - Keep legacy `--fa-*` aliases mapped to `--uf-*` tokens for compatibility.

2. High-impact surfaces:
   - Migrate header, auth forms, pricing, dashboard, guide/article shells, coding detail, and trivia/detail pages first.
   - Use `--uf-body-size` for primary reading text, `--uf-control-size` for inputs/buttons/navigation, `--uf-label-size` for form labels and compact list labels, and `--uf-caption-size` only for nonessential metadata.
   - Preserve `16px+` for guide/article content with line-height around `1.6-1.75`.

3. Exceptions:
   - Allow `11px`-equivalent text only through `--fa-runner-font-sm` or a clearly named exception token for nonessential dense metadata.
   - Avoid direct `10px`/`11px` literals for actionable controls, navigation, form text, or user-facing body copy.
   - Monaco/editor internals and vendored CSS stay out of this audit unless intentionally themed.

4. Enforcement:
   - Add a static lint or script once the first migration batch lands.
   - Fail on new literal `font-size` values under `14px` outside approved exception files/tokens.
   - Prefer semantic tokens over raw primitive tokens in components.

## QA Checklist
- Visual QA at desktop and mobile widths for: header, auth forms, coding detail, guide/content pages, dashboard, pricing, and trivia/detail flows.
- 200% browser zoom check for text clipping, hidden controls, fixed/sticky overlap, and form usability.
- 320 CSS px reflow check for reading surfaces and dense product screens; page-level horizontal scroll should not be introduced for normal text.
- Build check after runtime CSS changes: `cd frontend && npm run build`.
- Add focused Playwright or unit checks only when a migration touches routed/user-visible workflows.

## Sources
- Atlassian typography: https://atlassian.design/foundations/typography/
- USWDS font tokens: https://designsystem.digital.gov/design-tokens/typesetting/font/
- Carbon typography overview: https://carbondesignsystem.com/elements/typography/overview/
- Shopify Polaris font tokens: https://polaris-react.shopify.com/tokens/font
- Material 3 typography scale: https://developer.android.google.cn/develop/ui/compose/designsystems/material3
- MDN `font-size`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-size
- WCAG 2.2 Resize Text: https://www.w3.org/WAI/WCAG22/Understanding/resize-text
- WCAG 2.2 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- GreatFrontEnd design system: https://www.greatfrontend.com/design-system
- Zen Frontend: https://zenfrontend.com/
