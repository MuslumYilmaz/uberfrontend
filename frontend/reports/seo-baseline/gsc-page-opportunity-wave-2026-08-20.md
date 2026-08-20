# GSC Page Opportunity Wave Baseline

- Recorded: 2026-08-20
- GSC data through: 2026-08-18
- Reporting window: 2026-07-22 through 2026-08-18 (28 completed days)
- Search type: Web
- Market and device view: Worldwide, all devices
- Comparison unit: Exact page with visible query rows

## Pre-change evidence

| Route | Visible impressions | Clicks | Impression-weighted position | Impressions in positions 21–50 | Decision |
|---|---:|---:|---:|---:|---|
| `/javascript/trivia/js-compare-two-objects` | 70 | 0 | 25.45 | 57 | Strengthen the existing answer and JavaScript-query ownership without changing the current SEO title. |
| `/react/coding/react-counter` | 36 | 0 | 34.60 | 36 | Align the page with React counter component and `useState` intent while preserving the free exercise. |
| `/css/interview-questions` | 29 | 0 | 58.84 | 3 | Make this the CSS-only owner. |
| `/html-css/interview-questions` | 74 | 0 | 42.52 | 38 | Narrow this page to combined HTML and CSS interview intent. |
| `/machine-coding` | 8 | 0 | 28.25 | 8 | Diagnostic control only; do not rewrite in this wave. |

The position values above are weighted from the visible GSC query rows. Search Console can omit anonymized low-volume queries, and its positions average countries, devices, and result contexts. These values are directional baselines, not complete query demand.

## CSS query ownership

For the bare query `css interview questions`, the pre-change split is:

| Route | Impressions | Average position |
|---|---:|---:|
| `/css/interview-questions` | 11 | 61.2 |
| `/html-css/interview-questions` | 6 | 38.0 |

The dedicated CSS route should own CSS-only queries about cascade, specificity, Flexbox, Grid, responsive CSS, and debugging. The combined route should own interviews that explicitly join HTML semantics and accessibility with CSS layout and UI implementation.

At the first meaningful ownership review, at least 70% of visible FrontendAtlas impressions for bare CSS-only queries should land on `/css/interview-questions`.

## Product measurement

The React counter remains a public, free exercise. Reuse the existing conversion path rather than adding a competing CTA:

1. A guest completes the framework checks.
2. The existing save-result prompt offers `Create free account`.
3. Registration is measured by `sign_up`.
4. Activation is a successful `challenge_completion_saved` within seven days of registration.

GSC measures acquisition and query ownership; GA4 and product analytics measure signup and activation. Do not infer conversion from GSC alone.

## Evaluation schedule

| Checkpoint | Decision |
|---|---|
| T0 | Record deployment, request indexing where useful, and verify 200 status, self-canonical, indexability, one H1, structured data, internal links, and free access to the React counter. |
| T+14 | Check recrawl, index status, query-to-URL ownership, and unexpected visibility loss only. Do not make a performance decision. |
| Recrawl +35 days | Compare rank and position-bucket CTR, require at least a five-position improvement or a meaningful move into the top 20, and evaluate organic signup plus seven-day first-completion activation. |

Do not make another material title, H1, description, or primary internal-link change to these treatment routes before the first recrawl-plus-35-day decision unless a factual, canonical, indexing, or accessibility defect is found.

## Frozen controls

- `/system-design/dashboard-widgets-draggable-resizable`: freeze through 2026-09-10.
- `/system-design` and its preparation/RADIO ownership cluster: freeze through 2026-09-16.
- React and Vue interview hubs, infinite scroll, and CSS positioning: freeze through 2026-09-17 or 2026-09-18 according to their existing baselines.
- `/css/trivia/css-position-sticky-not-working`: freeze through 2026-09-24.
- `/javascript/interview-questions`: freeze until its new title is recrawled, then wait 35 days.
- Existing first-page winners, including Angular cancellation and JavaScript async-race pages, are guardrails and receive no treatment in this wave.

Second-wave candidates `/html/trivia/html-head-tag` and `/angular/trivia/angular-forroot-forchild` remain unchanged until the first wave has been crawled and ownership has been reviewed.
