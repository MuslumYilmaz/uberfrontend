# Importance-3 CSS Manual Audit

## Lane Summary
- Current machine truth is clean: `lint:trivia-competitive-readiness` reports `0 warning`, all `importance=3` CSS review snapshots exist, and the current lint-derived loser manifest is empty.
- That does **not** prove the content is competitively strong. It only proves the snapshots pass the repo's calibration rules.
- This manual audit re-checked all `4` CSS `importance=3` pages against the current competitor set.
- No competitor replacements were necessary. The existing MDN, web.dev, CSS-Tricks, and GreatFrontEnd selections were already topic-direct enough for a stricter editorial audit.
- Lane verdict: `do not open a CSS rewrite lane; move to HTML audit next`.

## Audit Method
- Starting point: the current shipped trivia page plus its existing review snapshot under `content-reviews/trivia/css/`.
- Scoring rubric for every page:
  - `intentMatch`
  - `decisionQuality`
  - `actionableExamples`
  - `followUpCoverage`
  - `edgeCaseCoverage`
  - `differentiation`
- Verdict scale: `ours | tie | theirs`, with `tie` as default.
- Rewrite threshold:
  - a page is `rewrite-required` if it loses on `2+` criteria against `2+` competitors, or
  - its first visible text block loses both `intentMatch` and `differentiation` against the hardest competitor.
- Competitor replacements used in this audit:
  - none

## Batch-01 Findings
| Content ID | Verdict | Hardest competitor | Why it landed there |
| --- | --- | --- | --- |
| `css-center-text` | `no-action` | `developer.mozilla.org` | The first fold immediately separates text centering from layout centering, which is the real interview trap behind this simple question. |
| `css-font-family` | `no-action` | `developer.mozilla.org`, `web.dev` | The fallback-plan framing, glyph coverage note, and layout-shift angle make it stronger than a generic property definition. |
| `css-border-property` | `no-action` | `developer.mozilla.org`, `css-tricks.com` | The page turns a basic shorthand question into a production answer about layout shift, focus states, and border-vs-outline trade-offs. |
| `css-hardware-acceleration` | `no-action` | `web.dev` | The rendering-pipeline explanation, compositing cost table, and `will-change` caveats keep it competitive with stronger performance guides. |

### `css-center-text`
- Query: `How do you center text horizontally in CSS?`
- Competitor set:
  - MDN `text-align`: `https://developer.mozilla.org/en-US/docs/Web/CSS/text-align`
  - GreatFrontEnd `CSS Interview Questions`: `https://www.greatfrontend.com/questions/quiz/css-interview-questions`
  - web.dev `Alignment`: `https://web.dev/learn/css/alignment`
- Hardest competitor: `developer.mozilla.org`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the exact question directly and surfaces the real trap immediately: centering text is not the same as centering the box. |
| `decisionQuality` | `ours` | It gives the right decision rule early: ask whether the problem is inline-content alignment or layout alignment. |
| `actionableExamples` | `tie` | The examples are sufficient and concrete, though they stay simpler than the broadest centering guides. |
| `followUpCoverage` | `ours` | It covers the expected follow-up boundary between `text-align`, auto margins, flexbox, and grid. |
| `edgeCaseCoverage` | `tie` | Long-text readability and block-vs-inline confusion are covered, even if the page does not go deeper into vertical alignment or writing-mode cases. |
| `differentiation` | `ours` | The first fold is sharper than generic property docs because it is framed around the most common production misuse. |

- Hard gaps:
  - A future refresh could add one shorter side-by-side snippet comparing `text-align: center` with flexbox centering, but that is not rewrite debt.
- Verdict: `no-action`

### `css-font-family`
- Query: `What is the purpose of the font-family property?`
- Competitor set:
  - MDN `font-family`: `https://developer.mozilla.org/en-US/docs/Web/CSS/font-family`
  - GreatFrontEnd `CSS Interview Questions`: `https://www.greatfrontend.com/questions/quiz/css-interview-questions`
  - web.dev `Typography`: `https://web.dev/learn/css/typography`
- Hardest competitor: `developer.mozilla.org`, `web.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the purpose question directly instead of stopping at syntax and family-name rules. |
| `decisionQuality` | `ours` | It correctly reframes `font-family` as fallback strategy, not just typeface choice. |
| `actionableExamples` | `tie` | The stack example and Google Fonts example are useful, though the official docs still remain a strong baseline. |
| `followUpCoverage` | `ours` | Fallbacks, glyph coverage, generic families, and cross-device drift are all covered. |
| `edgeCaseCoverage` | `tie` | It could say more about `font-display` or variable fonts later, but the main interview traps are already handled. |
| `differentiation` | `ours` | The production-pitfall framing is more interview-useful than a plain definition of the property. |

- Hard gaps:
  - If revisited later, add one short note connecting `font-family` decisions to loading behavior and `font-display`, but there is no rewrite debt.
- Verdict: `no-action`

### `css-border-property`
- Query: `How can you add a border around an element?`
- Competitor set:
  - MDN `border`: `https://developer.mozilla.org/en-US/docs/Web/CSS/border`
  - GreatFrontEnd `CSS Interview Questions`: `https://www.greatfrontend.com/questions/quiz/css-interview-questions`
  - CSS-Tricks `border`: `https://css-tricks.com/almanac/properties/b/border/`
- Hardest competitor: `developer.mozilla.org`, `css-tricks.com`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `tie` | The page answers the shorthand question cleanly, even though the query itself is commodity-level. |
| `decisionQuality` | `ours` | It adds the right production layer: borders are not just decorative, they affect sizing, focus behavior, and contrast. |
| `actionableExamples` | `tie` | The shorthand and per-side examples are sufficient, though the syntax coverage is naturally similar to strong references. |
| `followUpCoverage` | `ours` | It covers side-specific overrides, layout shift, and when `outline` is safer. |
| `edgeCaseCoverage` | `ours` | It handles dynamic focus and hover-state pitfalls better than generic border syntax explainers. |
| `differentiation` | `ours` | The accessibility and box-model angle gives the answer a clearer reason to exist beyond MDN syntax docs. |

- Hard gaps:
  - A future refresh could add one compact before/after example showing hover-border layout shift versus an `outline` alternative, but the page is already competitive.
- Verdict: `no-action`

### `css-hardware-acceleration`
- Query: `How do hardware acceleration and compositing affect CSS animation performance?`
- Competitor set:
  - MDN `CSS and JavaScript animation performance`: `https://developer.mozilla.org/en-US/docs/Web/Performance/CSS_JavaScript_animation_performance`
  - GreatFrontEnd `CSS Interview Questions`: `https://www.greatfrontend.com/questions/quiz/css-interview-questions`
  - web.dev `How to create high-performance CSS animations`: `https://web.dev/animations-guide/`
- Hardest competitor: `web.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page is centered on the exact interview question: compositing, hardware acceleration, and animation debugging. |
| `decisionQuality` | `ours` | It gives the correct decision rule: prefer composite-only properties when possible, but do not treat GPU promotion as free. |
| `actionableExamples` | `tie` | The rendering-pipeline explanation and examples are strong, although web.dev remains a very strong hands-on baseline. |
| `followUpCoverage` | `ours` | It covers pipeline stages, property-cost tiers, `will-change`, and profiling in DevTools. |
| `edgeCaseCoverage` | `tie` | The page could be more precise later about how layer promotion varies by browser, but it already covers the important misuse patterns. |
| `differentiation` | `ours` | The page is tighter and more interview-ready than broader performance articles because it keeps the explanation anchored to debugging decisions. |

- Hard gaps:
  - If revisited later, refine the language around layer promotion so it stays accurate across browser implementations, but this is not rewrite debt.
- Verdict: `no-action`

## Final Lane Recommendation
- `Do not open a CSS rewrite lane; move to HTML audit next.`
- There are no CSS `importance=3` pages that currently justify either `rewrite-required` or `watchlist` status.
- Practical sequencing:
  1. Keep CSS closed.
  2. Move to HTML manual audit next.
  3. Reopen CSS only if future business priorities elevate one of these commodity questions enough to justify incremental polish rather than competitive debt cleanup.
