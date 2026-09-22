# Internal linking implementation — 2026-09-22

All 437 sitemap URLs are reachable from the homepage within three links in the production prerender output. No sitemap page is orphaned. Changes are local and have not been deployed.

## Comparable before/after results

Both snapshots were measured with the same final `seo:link-equity` analyzer. The baseline is the previous local production output, not a live Google crawl. Only robots-allowed, indexable pages with a self-referencing canonical can contribute graph edges. Repeated source/target pairs count once; self-links, query-only variants, nofollow links, canonical aliases and noindex sources cannot conceal a missing clean link.

| Metric | Before | After |
| --- | ---: | ---: |
| Prerendered pages | 615 | 615 |
| Sitemap / eligible canonical pages | 437 | 437 |
| Orphan sitemap pages | 22 | 0 |
| Unreachable from homepage | 35 | 0 |
| Maximum reachable depth | 6 | 3 |
| Unique source/target edges | 8,125 | 20,861 |

The final depth distribution is: homepage 1; depth one 28; depth two 344; depth three 64. Critical hubs meet the two-link limit. All 336 public technology questions meet the three-link limit.

The earlier exploratory count of 21 orphans included a self-link on `/tradeoffs`. Excluding self-links correctly produces the comparable baseline of 22.

[The JSON companion](./internal-linking-2026-09-22.json) records all 437 routes with before/after depth and unique content/navigation source counts. Content and navigation source counts can overlap and must not be added together. Increased edge volume is an implementation measurement, not a claim about Google ranking weight.

## Delivered changes

- Trivia question menus now use Angular anchors with real `href` values and navigation state. Ordinary clicks retain practice state, return targets, scroll restoration and mobile menu closing; modified clicks retain native browser behavior. Delegated analytics records one event per ordinary click.
- Tradeoff details expose a hub return link in free and locked views. Available neighbors use anchors; unavailable neighbors do not emit fake URLs. The interview hub links to `/tradeoffs`.
- The existing registry generator produces a compact public navigation module containing only `tech`, `kind`, `title` and `route`. Six technology hubs render every public question inside a native disclosure. Links remain in initial HTML while closed. Editorial selections remain; master and combined HTML/CSS hubs do not duplicate the directory.
- Company routes resolve cards, counts and sample metadata before activation/prerender. Only that compact result enters TransferState. The directory has 11 company links; eight generic previews retain their existing sample limits, and Google/OpenAI/Netflix retain their authored content. Generic sample rows were already noninteractive and remain so; existing authored resource links are preserved.
- Removed the unused company-to-track `entry` parameter, added parameterized preview robots allowances, and added a visible home legal link plus the direct canonical guide link.
- Extended the existing link-equity command and SEO CI guard. It now rejects missing public directory links, orphan/unreachable pages, excessive critical depths, blocked public URLs, canonical aliases, missing company samples and stale company counts. Auth/premium URLs and historical numerical quotas remain informational.

Directory coverage: JavaScript 132, Angular 47, React 44, Vue 36, HTML 36, CSS 41; total 336. The sitemap still includes 358 free details across all families and excludes the same 165 premium details.

The count guard exposed a pre-existing trailing-comma parsing bug in `gen-showcase-stats.mjs`. Its parser now recognizes the app's framework family registry and applies the existing deduplication policy. Generated `all`/`coding` counts changed for Airbnb, Amazon, Apple, Google, Meta and Microsoft; runtime company counts and sample selection remain unchanged. The total question count remains 514. The owning generators regenerated showcase statistics, content metadata and data version (`56596c60fc6f`).

## Verification

All commands below ran from `frontend/` unless stated otherwise.

| Check | Result |
| --- | --- |
| Focused Angular tests: interview hubs, trivia, tradeoff, company index/preview, company service/resolvers | 132/132 passed |
| Resolver spec rerun after unique test selector cleanup | 1/1 passed; no selector collision warning |
| `npm run test:link-equity` | 22 graph/robots/count regressions + 3 generator regressions passed |
| `node scripts/sitemap.test.mjs` | Passed; access policy unchanged |
| `npm run check:prerender-sitemap` | Passed; 437 sitemap URLs, 615 prerender routes, zero missing |
| `SENTRY_AUTH_TOKEN= npm run build` | Passed; 615 production static routes; sourcemap upload intentionally skipped |
| `npm run seo:link-equity` | Passed; zero failures, blocked public targets or canonical aliases |
| `npm run seo:links` | 27,395 internal anchors checked; zero hard 404s |
| `npm run seo:tech-hub-links` | Passed |
| `SEO_SERVER_PORT=4232 npm run seo:smoke` | Passed on final build, including authored company HTML/schema contracts |
| Registry, showcase stats and data-version generator `--check` commands | Passed |
| `npx tsc --project tsconfig.spec.json --noEmit` | Passed |
| `npm run lint:design-system` | Passed; no new violations |
| Scoped `git diff --check` | Passed for task changes |

Covered edge cases include duplicate/self links, disconnected cycles, noindex/nofollow sources, canonical aliases, raw query robots conflicts, closed disclosure HTML, premium exclusion, absent tradeoff neighbors, empty/error company catalogs, per-slug TransferState consumption, route reuse and stale count/sample detection. Clean and query-string preview routes are allowed; private company/track routes, `/preview-extra` and `/preview/child` remain blocked.

Raw production HTML inspection confirmed the company index and Meta preview TransferState contain only the compact company keys plus Angular hydration metadata; no answer/solution/starter-code fields were present. Browser checks covered the JavaScript directory and generic company layout at 360, 390, 834, 1366 and 1440 px. The expanded directory had no overflowing links. Mobile trivia anchors wrap readably; ordinary navigation changes the question and closes the menu. Keyboard Enter followed a tradeoff neighbor, and locked tradeoff pages retained the hub return link. Existing company-row helper descriptions still use the shared component's ellipsis treatment on narrow screens; titles and metadata remain readable.

## Performance and remaining limits

`npm run perf:contract -- --no-write` exited successfully in its advisory mode, with three threshold warnings:

| Measurement | Final bytes | Threshold |
| --- | ---: | ---: |
| Initial critical assets | 1,148,302 | 1,150,000 |
| Module preload assets | 751,349 | 600,000 |
| `/coding` HTML | 575,578 | 450,000 |
| All prerender HTML | 103,191,731 | 70,000,000 |

Baseline HTML already exceeded the two HTML thresholds: `/coding` was 575,418 bytes and total HTML was 102,414,594 bytes. Total HTML increased by 777,137 bytes (about 0.76%). Baseline bundle assets were not retained, so no reliable before/after preload byte comparison is available. Angular also reports the initial bundle warning (1.04 MB versus 900 kB warning budget) and existing showcase CSS warning (58.98 kB versus 40 kB). No bundle stats file was produced; chunk-level performance checks were skipped. Performance budgets have not all passed.

The full application unit/E2E suites and authenticated backend flows were not rerun; targeted tests cover the changed contracts. Modified-click/state/analytics behavior is unit-tested; browser checks sampled ordinary and keyboard navigation. The browser DOM measurement helper intermittently timed out on company pages, so their width checks used screenshots. No production deployment, Search Console reinspection or ranking measurement occurred.

The user's pre-existing backlink registry changes were left untouched. A whole-repository whitespace check flags trailing tabs in that user-owned TSV; the changed frontend files pass their scoped check.

After deployment, inspect discovery/crawl status for Meta preview and the memoization example in GSC, then monitor the technology hubs. This implementation proves local technical discoverability; indexing and ranking outcomes require subsequent observation.
