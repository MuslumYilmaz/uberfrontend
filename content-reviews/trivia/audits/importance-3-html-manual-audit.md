# Importance-3 HTML Manual Audit

## Lane Summary
- Current machine truth is clean: `lint:trivia-competitive-readiness` reports `0 warning`, all `importance=3` HTML review snapshots exist, and the current lint-derived loser manifest is empty.
- That does **not** prove the content is competitively strong. It only proves the snapshots pass the repo's calibration rules.
- This manual audit re-checked all `3` HTML `importance=3` pages against the current competitor set and replaced two weaker coverage-first comparators with more topic-direct references.
- Lane verdict: `do not open an HTML rewrite lane; move to Angular audit next`.

## Audit Method
- Starting point: the current shipped trivia page plus its existing review snapshot under `content-reviews/trivia/html/`.
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
  - `html-tags`: replaced the broader web.dev document-structure page with web.dev `Semantic HTML`, which is more directly about choosing the right tags and semantics.
  - `html-iframe-tag`: replaced the broader web.dev third-party-loading page with web.dev `Best practices for using third-party embeds`, which is more directly about iframe-style embed cost and controls.

## Batch-01 Findings
| Content ID | Verdict | Hardest competitor | Why it landed there |
| --- | --- | --- | --- |
| `html-tags` | `no-action` | `developer.mozilla.org`, `web.dev` | The first fold frames tags as structural and semantic decisions, not just syntax, which is exactly the real interview follow-up. |
| `html-input-placeholder` | `no-action` | `developer.mozilla.org` | The page is already disciplined around the only thing that really matters here: placeholder is a hint, not a label. |
| `html-iframe-tag` | `no-action` | `developer.mozilla.org`, `web.dev` | The answer stays grounded in permissions, performance, accessibility, and trust boundaries instead of stopping at “embed another page.” |

### `html-tags`
- Query: `What are HTML tags?`
- Competitor set:
  - MDN `HTML elements reference`: `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements`
  - GreatFrontEnd `HTML Interview Questions`: `https://www.greatfrontend.com/questions/quiz/html-interview-questions`
  - web.dev `Semantic HTML`: `https://web.dev/articles/use-semantic-html`
- Hardest competitor: `developer.mozilla.org`, `web.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the broad question directly, then quickly narrows to why tags matter in real work. |
| `decisionQuality` | `ours` | It correctly pushes the semantic-choice rule early instead of treating tags as interchangeable syntax wrappers. |
| `actionableExamples` | `tie` | The tag examples and paired-vs-void distinction are useful, though the strongest references naturally have broader catalogs. |
| `followUpCoverage` | `ours` | It covers DOM structure, semantics, heading hierarchy, and missing critical attributes in one compact answer. |
| `edgeCaseCoverage` | `tie` | It could later say more about obsolete tags or custom elements, but that is outside the likely interview core. |
| `differentiation` | `ours` | The “not just angle brackets” framing is stronger than generic intro material because it connects directly to accessibility and debugging. |

- Hard gaps:
  - A future polish pass could add one short contrast between a semantic card and an all-`div` card, but the current answer does not justify rewrite work.
- Verdict: `no-action`

### `html-input-placeholder`
- Query: `What is the placeholder attribute used for in input fields?`
- Competitor set:
  - MDN `placeholder`: `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/placeholder`
  - GreatFrontEnd `HTML Interview Questions`: `https://www.greatfrontend.com/questions/quiz/html-interview-questions`
  - web.dev `The form element`: `https://web.dev/learn/forms/form-element`
- Hardest competitor: `developer.mozilla.org`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the exact purpose question while immediately surfacing the most important misuse. |
| `decisionQuality` | `ours` | It gives the right decision rule right away: placeholders are hints, not durable labels or full instructions. |
| `actionableExamples` | `tie` | The example is simple but enough for this question; the official references remain strong baselines. |
| `followUpCoverage` | `ours` | Accessibility, validation clarity, disappearing text, and label pairing are all addressed. |
| `edgeCaseCoverage` | `tie` | It could later mention `textarea` support or contrast styling in more detail, but the main trap is already handled. |
| `differentiation` | `ours` | The page is sharper than generic form docs because it focuses on the actual production mistake teams make with placeholder text. |

- Hard gaps:
  - A future refresh could add one explicit “bad placeholder-only form vs correct label-plus-placeholder form” comparison, but there is no rewrite debt now.
- Verdict: `no-action`

### `html-iframe-tag`
- Query: `How does the iframe tag work and what is it used for?`
- Competitor set:
  - MDN `iframe`: `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe`
  - GreatFrontEnd `HTML Interview Questions`: `https://www.greatfrontend.com/questions/quiz/html-interview-questions`
  - web.dev `Best practices for using third-party embeds`: `https://web.dev/articles/embed-best-practices`
- Hardest competitor: `developer.mozilla.org`, `web.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers both parts of the prompt: how iframes work and why they are used. |
| `decisionQuality` | `ours` | It gives the real production decision frame: permissions, performance, source trust, and accessibility. |
| `actionableExamples` | `tie` | The basic and sandbox examples are good, though the best references still go deeper on provider-specific embed tuning. |
| `followUpCoverage` | `ours` | The answer covers `title`, `sandbox`, `loading`, source trust, and common embed scenarios. |
| `edgeCaseCoverage` | `tie` | It could later say more about cross-origin scripting limits or allow-list nuances, but the main interview edges are already present. |
| `differentiation` | `ours` | The first fold is more useful than generic iframe explainers because it centers risk and operational trade-offs, not just attributes. |

- Hard gaps:
  - If revisited later, add one compact note on same-origin restrictions and why sandbox flags should stay minimal, but this is not rewrite debt.
- Verdict: `no-action`

## Final Lane Recommendation
- `Do not open an HTML rewrite lane; move to Angular audit next.`
- There are no HTML `importance=3` pages that currently justify either `rewrite-required` or `watchlist` status.
- Practical sequencing:
  1. Keep HTML closed.
  2. Move to Angular manual audit next.
  3. Reopen HTML only if business priorities later make one of these commodity questions worth incremental polish rather than debt cleanup.
