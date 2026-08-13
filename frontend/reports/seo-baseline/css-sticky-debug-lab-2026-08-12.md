# CSS Sticky Debugging Lab SEO Baseline

- Recorded: 2026-08-12
- Treatment route: `/css/trivia/css-position-sticky-not-working`
- Primary query: `css sticky not working`
- Market: United States
- Primary reporting view after launch: Google Search Console, Web, United States, all devices, exact-page filter
- Diagnostic view: Google Search Console, Web, worldwide, all devices, exact-page filter

## Pre-launch evidence

| Query | Semrush US volume | KD | AI Overview in reviewed SERP | Role |
|---|---:|---:|---|---|
| `css sticky not working` | 70 | 8 | Not observed on 2026-08-12 | Primary click-intent query |
| `css position sticky not working` | 110 | 10 | Observed on 2026-08-12 | Secondary diagnostic query |
| `position sticky not working` | 390 | 5 | Observed on 2026-08-12 | Broad parent query; discovery rather than click forecast |

The AI Overview observation is a dated SERP snapshot, not a permanent query property. Recheck the live US SERP at each decision point. Do not infer expected clicks by applying the broad parent volume to this page.

The new URL has no historical exact-page GSC baseline. On deploy day, export the last 28 completed days for the existing positioning and z-index sibling pages as diagnostic controls, then begin the new page's first complete observation window.

## Search ownership

The new route owns sticky failure diagnosis: missing inset, unexpected scroll owner, insufficient containing-block runway, flex/grid stretching, and “sticks but is covered.”

- `/css/trivia/css-position-relative-absolute-fixed` continues to own the relative/absolute/fixed positioning model.
- `/css/trivia/css-z-index` continues to own stacking contexts and layer-order failures.
- `/css/trivia/css-make-element-responsive` continues to own responsive layout constraints.

Success requires the new route to become the most visible FrontendAtlas URL for sticky-failure queries without reducing those sibling pages to duplicate sticky explainers.

## Evaluation schedule

| Checkpoint | Decision |
|---|---|
| T0 | Record the deploy date, request indexing, verify 200 status, self-canonical, indexability, one H1, rendered lab placeholder, full crawlable answer, and valid JSON-LD. |
| T+14 | Confirm indexing and inspect query ownership only. Recheck whether AI Overview appears for the primary US query; do not judge traffic yet. |
| T+42 | Review the first useful ranking and click window. Segment CTR by average-position bucket so ranking movement is not mislabeled as a snippet effect. |
| T+84 | Decide whether to continue investing in additional diagnostic cases using ranking, non-brand clicks, position-bucket CTR, and qualified lab completion together. |

Avoid a second material title, H1, description, or internal-link change before T+42 unless a technical indexing or factual defect is found.

## Product and search signals

Track these signals together:

- Exact-page non-brand impressions and clicks for sticky-failure queries
- Average position and CTR within comparable position buckets
- Which FrontendAtlas URL receives the impressions for the query cluster
- `trivia_lab_viewed`, `trivia_lab_interacted`, and `trivia_lab_completed`
- Completion quality: the same attempt first produces a broken finding and later reaches `working`

Never send pasted CSS, DOM content, URLs, or raw error messages in analytics.

If an AI Overview appears later, do not automatically remove or retarget the page. At T+84, distinguish ranking failure, snippet/zero-click pressure, and weak product engagement. A weak combined result pauses investment in more lab cases; it does not require deleting this canonical.

## URL Inspection order after deploy

1. `/css/trivia/css-position-sticky-not-working`
2. `/css/interview-questions`
3. `/html-css/interview-questions`
4. `/css/trivia/css-position-relative-absolute-fixed`
5. `/css/trivia/css-z-index`
