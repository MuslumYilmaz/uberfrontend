# Metadata repair and paired CTR experiment

Prepared: 2026-09-23. Deployment and Google recrawl have **not** been recorded.

## Package 1: metadata correctness

- Preserve complete selected trivia titles, descriptions, and intermediate concepts. Length is a review warning, not a destructive string cutoff.
- Preserve technical literals such as `<a>`, `<head>`, `<link rel="stylesheet">`, `Array<T>`, and JSX while removing editorial formatting wrappers.
- Read public debug descriptions from nonblank `summary`, then nonblank `text`, with the existing fallback only when both are empty. Solutions are not a metadata source.
- Describe company practice accurately while retaining its editorial provenance qualifier.
- Audit actual prerendered head metadata, including singleton/nonempty tags, social metadata parity, canonical title uniqueness, and known regressions.
- Preserve question-owned metadata after client navigation: the route title strategy must not overwrite resolved trivia, coding, or debug metadata with generic route defaults.

The before/after inventory is recorded in the adjacent metadata diff JSON. Canonical URLs, robots, question H1s, access, identities, answer bodies, and draft-version inputs are outside the treatment.

The inventory covers 615 prerendered pages: 206 repair URLs and two treatment URLs changed metadata. All canonical, robots, and H1 values match the starting inventory. A complete scan found 32 titles ending in a dangling connector (the earlier estimate was 31); none remain. All eight generic debug descriptions were replaced with question-specific text. A ninth debug description also regained its complete ending when the debug cutoff was removed.

## Package 2: paired title and description treatment

The user chose to change title and description together. Effects cannot be attributed to either field separately.

| Route | Field | Before | Treatment |
|---|---|---|---|
| `/angular/trivia/angular-http-what-actually-cancels-request` | Title | Angular HttpClient Unsubscribe: 6 Tests & DevTools | Does Angular HttpClient Unsubscribe Cancel Requests? |
| Same | Description | Run six tests for unsubscribe, switchMap, AsyncPipe, mergeMap, and shareReplay. Prove RxJS teardown, browser abort, and stale-UI protection. | Test when unsubscribe cancels Angular HTTP requests, why server work may continue, and how six runnable tests expose stale UI bugs. |
| `/react/trivia/react-render-nothing-return-value` | Title | Can React Return undefined? React 18 vs null | React Return null vs undefined: React 18+ Explained |
| Same | Description | React 18+ permits undefined component returns. Practice when it renders nothing, why null is clearer, how React 17 differed, and lint catches return bugs. | Compare null and undefined returns in React 18+, see what changed since React 17, and catch accidental missing returns with TypeScript and lint rules. |

The JavaScript async-race title and description remain unchanged as an observation reference, not a randomized control. RxJS operator comparison receives its complete authored title in package 1 and no immediate second rewrite.

The existing intent classifier also recognizes “missing returns” as a problem-oriented description so the approved React treatment is used as written. No other current question changes selection because of that addition.

Concurrent workspace edits outside this task changed the async-race answer and simulator wording, plus dashboard system-design content. These edits were preserved. If deployed together, async-race is only an unchanged-metadata reference: it is not an unchanged-page control, and its content changes are a measurement confounder.

## GSC baseline observed before implementation

Read from Search Console on 2026-09-23. Search type: Web; worldwide; all devices. The current 28 completed days were 2026-08-25 through 2026-09-21; the previous period was 2026-07-28 through 2026-08-24.

| Property metric | Previous period | Current period |
|---|---:|---:|
| Clicks | 101 | 91 |
| Impressions | 37,837 | 19,281 |
| CTR, calculated | 0.2669% | 0.4720% |
| Average position | 17.4 | 17.8 |

| Page | Current impressions | Current clicks | Current average position |
|---|---:|---:|---:|
| Angular HTTP cancellation | 2,482 | 2 | 7.3 |
| React return undefined | 704 | 0 | 7.9 |
| RxJS operator comparison | 578 | 2 | 8.1 |
| JavaScript async race | 1,465 | 9 | 6.9 |

These are observed UI totals, not a raw query export. They do not establish a causal metadata effect. Refresh the last 28 completed days at deployment if deployment is later; do not reuse this snapshot as though it covers a later window.

## Release and measurement record

| Milestone | Package 1 | Package 2 |
|---|---|---|
| Local verification | Passed; details below | Passed; details below |
| Deployment timestamp / revision | Not deployed | Not deployed |
| Live HTTP, canonical, robots and metadata check | Pending deployment | Pending deployment |
| Google recrawl date for treatment URLs | Not observed | Not observed |
| First performance decision | Recrawl + at least 35 days | Recrawl + at least 35 days |

During the first 14 days, check crawling/indexing health only. Compare completed windows by query, country, device and position range; inspect clicks and impressions alongside CTR. If volume or comparability is insufficient, report the result as inconclusive. Do not roll back based on a few daily clicks. Revert the relevant package if live metadata, indexability or access regresses.

## Local verification record

Final verification completed on 2026-09-24; this record was started on 2026-09-23. No production deployment was performed.

| Check (run from `frontend/`) | Result |
|---|---|
| `npm run test:unit` | 1,396 tests passed |
| `SENTRY_AUTH_TOKEN= npm run build` | Passed; production prerender generated; local source-map upload disabled |
| `npm run test:seo-meta-check` | 15 fixture tests passed |
| `npm run seo:meta-check` | 615 pages; zero failures; 353 length warnings (204 titles, 149 descriptions) |
| `npm run seo:smoke` | Passed, including unknown/404/private shells and treatment metadata |
| `npm run check:prerender-sitemap` | 615 routes / 437 sitemap URLs; zero missing |
| `npm run lint:questions:check` | Passed; 457 question identities agree |
| `npm run lint:trivia-editorial-quality` | Passed |
| `npm run lint:indexability-readiness` | Passed; supplementary content check only |
| `npm run lint:shipped-draft-parity` | Passed |
| `npx tsc --noEmit -p tsconfig.spec.json` | Passed |
| Targeted Chromium SSR/hydration/navigation tests in `e2e/seo-ssr.spec.ts` | Seven distinct tests passed across the final targeted runs |
| `npm run perf:contract -- --no-write` | Exited successfully with size warnings; no strict performance pass claimed |
| `git diff --check -- frontend cdn` | Passed |

The build warns about the initial JavaScript bundle (~1.04 MB against 900 kB) and showcase CSS (58.98 kB against 40 kB). The performance contract warns about module preload (751,416 bytes), `/coding` HTML (575,655 bytes), and total prerender HTML (103,244,373 bytes). Chunk-level checks could not run because bundle statistics were absent. These warnings were not addressed by broad performance or content edits in this metadata task.

- Angular and React CDN records were compared structurally with HEAD: all fields other than `seo` are unchanged, including content-version inputs, access, question titles, and answers. Generated data version was refreshed through the owning build script.
- The SEO check reads actual HTML through parse5. Its length findings are review warnings; the older readiness linter is not the metadata correctness oracle.
- The browser regression discovered the route-reuse metadata overwrite and now exercises forward/back navigation without document reload. Router tests cover free/premium transitions, query addition/removal, static routes, and missing-question fallbacks. A query-only navigation refreshes only robots through the existing access and query policy.
- Existing browser assertions were repaired to use the current premium preview summary and React counter skill label, to distinguish CSS lab SSR fallback labels from interactive labels, and to count resource links within the full answer, separately from sidebar links. Product content and access were not changed to satisfy those assertions.
- Local test servers initially hit sandbox port-bind restrictions; reruns with the required local-server permission completed. No production API or database migration was performed. The full cross-browser/E2E suite, live deployment verification, Google recrawl, and post-release GSC assessment remain outside this local verification.

Browser commands used `CI=1 PLAYWRIGHT_WEB_SERVER=1 PLAYWRIGHT_SSR=1 PLAYWRIGHT_PORT=4235 npx playwright test e2e/seo-ssr.spec.ts --project=chromium --workers=1` with targeted `--grep` selections. Passing coverage: literal HTML metadata through SSR and forward/back navigation; the full CASES SSR and hydrated shells; premium raw HTML access/indexability; Angular cancellation raw and hydrated contracts including mobile containment; unchanged JavaScript async-race metadata. The stale assertion failures listed above were corrected and their affected tests rerun successfully.
