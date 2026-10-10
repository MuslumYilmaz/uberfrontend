# SEO growth roadmap: October 2026

> Working roadmap for raising Search Console impressions and clicks. It records the evidence behind each step, what already shipped, and the checklists for the steps that are still open. Raw Search Console exports are gitignored (`frontend/tmp/gsc-monitor/`), so the numbers here are the durable copy.

## Evidence (Search Console, 2026-10-08 snapshot)

| Signal | Value | Reading |
|---|---|---|
| 28-day performance (2026-09-08 to 2026-10-05) | 89 clicks, 13.8K impressions, 0.6% CTR, average position 14.9 | Impressions fell every window since July: 37.8K, then 19.3K, then 13.8K per 28 days |
| Index coverage | 321 indexed of 437 sitemap URLs | 96 "Crawled, currently not indexed", 49 "Discovered, currently not indexed" |
| Deindexed former earners | react-render-nothing-return-value (about 1,000 impressions per 28 days lost around 2026-09-04), react-stale-state-closures, css-position-relative-absolute-fixed, vue-destructuring, ngrx-selectors | Prerendered HTML is sound (index,follow, canonical, 30 to 45 inlinks), so this is a quality judgment, not a technical block |
| Query mix on position 5 to 10 trivia pages | "... official docs", "+site.angular.dev ...", "+mdn ..." style queries | LLM-agent traffic that never clicks; explains near-zero CTR on several technically healthy pages |
| Human striking-distance clusters (90 days) | href definition/meaning/example (position 12 to 16, about 1K impressions), RxJS flattening operators (7 to 11, about 450), ngOnInit vs ngAfterViewInit (7 to 9), RADIO framework (8 to 9, about 370), img alt (9 to 30), "jsxs" (13) | The only query families with real people behind them; measured in `frontend/reports/seo-baseline/trivia-query-gap-wave-2026-10-09.md` |
| Change detection family | Zero visible queries in 90 days for change detection, OnPush, or zoneless | The visualizer below is a deliberate bet on demand that Search Console cannot see yet, not a striking-distance play |

## Shipped (dev branch, 2026-10-09 and 2026-10-10)

| Commit | Change | Why |
|---|---|---|
| e4ec7101 | Per-entry sitemap dating (`PROJECTION_VERSION` seo-content-v2, baseline rebuilt) | Shared component edits used to re-date all 261 trivia and 75 coding pages; 351 of 437 URLs showed the same lastmod |
| 0a540f6b | Content wave on 8 trivia entries (href, RxJS operators, lifecycle, img alt, anchor target, JSX transform, props immutability, a tag) | Direct answers for the human query clusters above |
| 2dbe92c7 | Exact-match internal anchors to the wave pages | Anchor text now carries the target query |
| b96530e6 | Trivia SEO gate: authored title/description win unless docs-style or too short | 99 pages were serving template descriptions; now 0 |
| 12b9f739 | 29 long trivia titles shortened to 60 characters or fewer | SERP truncation on low-impression pages |
| d5f6c9c9 | GA4 loads only for qualified sessions; suspect browsers tagged `traffic_type=bot_suspect` | About half of GA users were bot-like; reports were not usable for decisions |
| 2026-10-09 | Indexing requested through URL Inspection for the wave pages; sitemap resubmitted | Daily quota of about 10 requests |

## Step 3 (current): Angular Change Detection Visualizer

Target page: `/angular/trivia/angular-change-detection-strategies` (never crawled, question id unchanged). The page gets a deterministic simulator that shows which of seven components Angular checks after ten trigger types, in Default vs OnPush and in zone vs zoneless mode, with five preset production bugs and a diagnosis plus fix for each. The sibling page `angular-onpush-change-detection-debugging-real-bug` stays and links its bug stories to the preset scenarios by fragment.

Implementation lives in `frontend/src/app/features/trivia/trivia-detail/angular-change-detection-visualizer/` and follows the event-loop lab pattern (deferred on viewport, crawlable placeholder, qualified-view analytics, completion hand-off). The content rewrite keeps the eight competitor-review evidence sentences verbatim.

### Measurement protocol

| Checkpoint | Check |
|---|---|
| Deploy day | Live `<title>`, `<meta name="description">`, H1, placeholder test id and the five fragment anchors on the sibling page; sitemap lastmod; URL Inspection request for both pages; GA4 receives `trivia_lab_viewed`, `trivia_lab_interacted`, `trivia_lab_completed` with `lab_id=angular_change_detection_visualizer` |
| Plus 14 days | Index status only. No performance decision |
| Plus 6 to 8 weeks | Indexed; at least 150 impressions per 28 days and CTR at or above 2%; "angular change detection strategies" at position 25 or better, "angular onpush vs default" and "angular zoneless change detection" at 30 or better; at least 25% of qualified views interact and at least 10% complete; sibling page impressions do not fall more than 20% |

Second iteration (only if engagement is healthy): a real Default/OnPush mini demo behind the `CdEngine` seam, counting actual renders instead of simulating them.

## Step 3b (current): RxJS overlap playground

Target page: `/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use` (503 impressions per 28 days at position 7.9, one click; human pairwise queries such as "exhaustmap vs switchmap" at 7.0 to 7.6 with zero clicks in the 14-day query report). Title, description and H1 stay frozen for the 2026-10-07 measurement window; only the body gained a lab and one linking block.

The lab runs the real RxJS operators on a `VirtualTimeScheduler`: the visitor places up to six triggers on a 1200 ms axis, sets request durations, predicts which responses reach the UI, reveals, and compares all four operators; seven presets reproduce typeahead, double submit, parallel loads, ordered saves and three production bugs, each with a verdict, hazards and a one-click fix. Code: `frontend/src/app/features/trivia/trivia-detail/rxjs-overlap-playground/`.

| Checkpoint | Check |
|---|---|
| Deploy day | Placeholder text and the seven `overlap-scenario-*` anchors in live HTML; URL Inspection request; GA4 `trivia_lab_*` with `lab_id=rxjs_overlap_playground` |
| Plus 14 days | Recrawl only |
| Plus 6 to 8 weeks | Pairwise queries ("exhaustmap vs switchmap", "switchmap vs mergemap", "switchmap vs concatmap") at position 5 or better; at least 700 impressions and 10 clicks per 28 days; at least 30% of qualified views reveal and 15% complete |

## Step 4 (open): descriptions that answer instead of describe

- 28 trivia `seo.description` values still start with "Explain" and 84 are longer than 160 characters (prerender audit, 2026-10-09).
- Rewrite rule: first sentence answers the question or names the decision; second sentence names the proof on the page (code, table, lab). No "Learn", "Understand", "Explain", no docs-intent words (the editorial lint rejects them).
- Freeze: do not touch the eight wave pages or the three lab pages before their own measurement windows close.
- Verify with `npm run build && npm run seo:meta-check` from a clean `frontend/dist` (a stale dist feeds old JSON into the prerender).

## Step 5 (open): direct answers on coding pages

- Candidates with impressions but no snippet ownership: js-is-object-empty, js-sleep, js-debounce, react-todo-list, js-check-data-type-with-typeof.
- Add a short answer block above the challenge (the solution idea in two or three sentences plus the smallest working snippet) without exposing premium solutions.
- Keep `seo-smoke` schema rules: coding pages keep their existing schema types; no FAQPage.

## Step 6 (open): new interview hubs

- RxJS, Angular Signals, React 19 hubs under the existing interview-questions landing pattern.
- Each hub needs 8 to 12 owned question pages, exact-match anchors from the tech hubs, and its own `criticalRouteContracts` entry in `scripts/seo-meta-check.mjs`.

## Later and operational

- GA4 data filters "Bot suspect" and "Internal Traffic" are in Testing; switch both to Active after about a week of `bot_suspect` share data.
- Day-2 indexing requests: vue-native-vs-component-events, html-anchor-target, react-useeffect-purpose, js-check-data-type-with-typeof, react-why-batching-state-updates, rxjs-tap-vs-map, react-diffing-algorithm, rxjs-subject pages, html-a-tag, vue-computed-properties.
- `e2e/trivia.mobile-visual.spec.ts` sweeps three routes that no longer exist in the catalog (css-flexbox-basics, react-state-vs-props, js-promises-basics); fix or replace them.
- Vercel Attack Challenge Mode is on (`x-vercel-mitigated: challenge`); Googlebot gets 200 but SEO tools and unverified AI crawlers get 429. Decision pending.
- Backlinks: run the registry, GitHub PR/issue search and Gmail search before proposing targets (`docs/references/backlink-outreach-registry.tsv`).
