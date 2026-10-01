# Angular 21 / PrimeNG 21 verification

## Reference

The immutable application reference is `68d4939b049e266c1f68efc6b0cf0b94a8854274`.
The upgrade must preserve its design and public application contracts.

The visual suite covers 360, 390, 768, 834, 1366 and 1440 px widths. It uses
synthetic API responses and never requires production credentials or a database.
It includes public and authenticated pages, open and empty select panels,
profile and bug-report dialogs, and the interview lifecycle. The existing
768 px minimum for starting an interview remains covered; mobile recovery is
captured after starting at a supported width. Timestamps and editor cursors are
the only masked dynamic UI.

macOS reference images were captured before dependency changes. CI captures
Linux references from the immutable Angular 17 application using the same test
scenarios and Playwright version as the candidate, then compares the candidate
without `--update-snapshots`. The two runs share the same runner and font setup.
Do not update candidate snapshots to hide migration differences.

## Angular 17 baseline

- Production build and 615 prerender routes: passed.
- Visual comparisons without updating snapshots: 90 passed.
- Initial bytes: 1,170,168; modulepreload bytes: 771,680 (45 modules).
- Coding HTML bytes: 575,757; total prerender HTML bytes: 103,410,753 (fresh build with stats).
- Sentry lazy chunk: 413,529 bytes; showcase lazy-heavy chunks: 956,372 bytes.
- These six performance metrics already exceed warning thresholds. Thresholds
  must remain unchanged and migration deltas must be reported.

## Commands

- `cd frontend && npm run test:e2e:upgrade-visual`
- `cd frontend && npm run verify:unit-and-content`
- `cd frontend && npm run verify:seo-prerender-guard`
- `cd frontend && npm run verify:e2e-critical`
- `cd frontend && npm run lint:design-system:strict`
- `cd backend && npm run verify:ci`

The production interview harness must use its isolated database and non-conflicting
ports. The machine's `frontendatlas` database is not test data.

CI status is authoritative in the draft PR checks. Local results and limitations
are recorded below; unavailable or failing checks are not counted as passes.

## Angular 18 checkpoint

- Angular 18.2.14 / CLI 18.2.21 / PrimeNG 18.0.2 installed with compatible peers. npm 11 could not reconcile the Angular 17 lock tree; npm regenerated it with unrelated direct dependencies temporarily pinned to their existing resolved versions, then restored their original ranges. No peer override flags were used.
- Official core and CLI migrations ran. The optional application-builder migration was unnecessary because the app already uses that builder. TransferState imports moved to core; server bootstrap now accepts BootstrapContext. Component-local HttpClientModule imports were removed in favor of the existing central HTTP provider/interceptors.
- Production build: passed, all 615 prerender routes retained. Closest unit suite: 116/116 passed. Strict design-system check passed.
- Visual comparison identified CSS reset precedence, input padding, and changed PrimeNG overlay geometry/focus defaults. Heading/reset precedence and list padding were restored against the unchanged Angular 17 references. Dialog and multiselect parity remains part of the final theme adaptation, not an accepted baseline change.

## Angular 19 checkpoint

- Angular 19.2.25 / CLI 19.2.27 / CDK 19.2.19 / PrimeNG 19.1.4; TypeScript 5.8.3 and Zone.js 0.15.1.
- Official standalone-default migration applied; no signals or template control-flow conversion. Optional migrations were not applied.
- Production build passed with 615 prerender routes. The same 116 affected unit tests passed. Angular's revised budget units also expose an existing trivia CSS warning; budget values remain unchanged.
- Added `.nvmrc` (22.23.0), matching frontend engine requirement and CI setup. Only the immutable Angular 17 visual-reference job intentionally runs Node 20.19.6.

## Angular 20 checkpoint

- Angular 20.3.33 / CLI and SSR 20.3.37 / CDK 20.2.14 / PrimeNG 20.4.0; theme imports moved to `@primeuix/themes` 2.0.3.
- Official DOCUMENT, server-rendering, TypeScript module-resolution, and CLI configuration migrations applied. Three test-only DOCUMENT imports omitted by the migration were repaired explicitly.
- Production build passed and retained all 615 prerender routes. Closest unit suite including HTML sanitization: 117/117 passed.
- Profile password dialog explicitly restores initial focus to the current-password input, preserving the existing keyboard contract despite PrimeNG's changed focus order.

## Angular 21 checkpoint

- Angular/compiler-cli 21.2.25, CLI/build/SSR 21.2.24, CDK 21.2.14, PrimeNG 21.1.10, PrimeUIX themes 2.0.3, TypeScript 5.9.3, Zone.js 0.16.3 and DOMPurify 3.4.16. The official migrations ran; the optional bulk control-flow conversion was excluded. Zone change detection is explicit. Karma/Jasmine, Tailwind 3 and Monaco 0.52.2 remain in use.
- Removed unused Angular animation providers/package. PrimeNG uses CSS animations with reduced-motion overrides. Dialog opener restoration, multiselect filter autofocus/close control, body-appended dark overlays and legacy Lara spacing/font metrics were restored against Angular 17 screenshots.
- Angular 21 requires workspace-local asset inputs. `sync-cdn-assets.mjs` stages only the existing public CDN entries under `.angular/cdn-assets`; canonical sources and published URLs are unchanged. Its regression verifies exact content, stale removal and excluded entries. Monaco and xhr2 patches remain required.
- Angular 21 prerender emits meta-refresh redirects for private route guards. Server-only `RedirectCommand` with `skipLocationChange` retains the signed-out shell at the requested path so browser cookie authorization can run. Browser guard decisions are unchanged. The admin direct-load/reload production regression passed after the fix; six guard unit cases passed.
- The same redirect compatibility applies to the prerendered `/guides` alias: its destination content, canonical and JSON-LD must remain in the HTML. Browser navigation still redirects to `/guides/interview-blueprint`, preserving query parameters and fragments. The SEO guard caught this separately before push.
- Prerender now uses a synthetic localhost origin. SEO distinguishes static rendering (no incoming `REQUEST`) from real SSR hostnames so public, premium and private indexing policies survive prerender. Twelve SEO unit cases passed, including preview-host exclusion; production validation follows below.
- Before final clean-install verification: 1,444 unit tests, 1,069 backend tests (82 suites), 100 Chromium critical/accessibility E2E, 96 mocked interview tests (Chromium/Firefox), and isolated real-backend interview flows in both engines passed. Shared-control keyboard/focus tests passed in Chromium and Firefox. All 90 Chromium visual comparisons passed at six widths.
- The interview visual fixture freezes its server/client clock only when explicitly requested by the screenshot suite. Three affected review references were recaptured from the immutable Angular 17 application; no candidate image became a reference.
- Local WebKit cannot launch on macOS 14.2.1 with the installed Playwright build (requires macOS 14.5+). Linux CI runs the WebKit interaction and interview suites. Local unavailability is not a passing result.

## Final local verification

- Clean `npm ci` passed on Node 22.23.0; Monaco and xhr2 patches applied successfully. `npm ls --depth=0` passed without peer overrides. The CDN staging regression also runs in the frontend CI job.
- `npm audit --omit=dev --json` reports zero vulnerabilities for frontend and backend. The frontend audit allowlist has no entries. The full frontend audit, including development tools, still reports 15 findings (8 moderate, 2 high, 5 critical), including build/deployment-tool dependency chains; that broader audit is not clean and is not the production audit gate.
- Final pre-push unit/content and SEO prerender guards passed, followed by **91/91 critical E2E**. Frontend unit total is **1,456/1,456**. Strict design-system and design-budget checks passed. Backend verification remains **82 suites / 1,069 tests passed**.
- Visual parity: **90/90** Chromium scenarios / **138 image pairs** at six widths. Gallery adds four actual-JavaScript-worker failure captures (0/2 and 1/2 at desktop/mobile) and two splitter captures. No candidate screenshots were accepted as references.
- Shared controls: **8/8** across Chromium and Firefox, in both development and production builds. Covers selection retention, empty search, disabled reset, filter autofocus, close/Escape focus, dark OS-independent overlays, tooltip bounds, modal focus trap and scroll unlock. The tests wait for hydration and completed overlay removal before reopening. The legacy PrimeNG slider component remains compiled but is not mounted by the current public routes.
- Mock interviews: **48/48 per available engine**, plus isolated real-backend flows in Chromium and Firefox. The existing late-check response, draft/hash recovery, splitter, runner and report contracts are retained.
- Production runner/public/auth suite initially passed 110 cases and caught three SSR regressions. All three passed after fixes; the additional `/guides` alias regression also passed, including query/fragment preservation. The React/framework runner cases passed in the initial production run.
- SEO metadata: **0 failures** across the 615 retained prerender routes. Existing content-length warnings remain. Production bundle error budgets were not changed; existing size warnings and new compiler/Sass deprecation diagnostics remain visible.

## Performance comparison and remaining risk

The same macOS machine, Playwright version and original Angular 17 application were
used for comparisons. Values below are bytes from build output, not elapsed-time
claims. The final Angular 21 figures use the build with stats after the alias fix;
generated timestamp lengths can change HTML totals by a few bytes.

| Metric | Angular 17 | Angular 21 |
| --- | ---: | ---: |
| Full initial static import graph (JS + CSS) | 1,115,193 | 1,213,026 |
| HTML-linked resources counted by `perf:contract` | 1,170,168 | 407,536 |
| Modulepreload resources | 771,680 (45 files) | 27,948 (10 files) |
| `/coding` raw HTML | 575,757 | 598,031 |
| Total prerender HTML | 103,410,753 | 121,587,526 |
| Sentry lazy chunk | 413,529 | 413,923 |
| Showcase lazy-heavy chunks | 956,372 | 956,847 |

**Medium — payload growth remains:** the full initial import graph increases 8.8%
and total prerender HTML increases 17.6%. PrimeNG's runtime theme and inline SSR
styles account for the main tradeoff. The smaller HTML-linked-resource metric
reflects different preload emission and does **not** mean the whole initial bundle
became smaller. Representative compressed HTML comparisons add approximately
3.4–6.7 KB per page. All existing build error budgets still pass. `perf:contract
--no-write` completes with four warnings (six on the fully measured baseline);
strict warning-free performance acceptance has not been achieved.

An optional postbuild transformation to externalize PrimeNG SSR styles was
rejected by automatic approval review because it rewrites all prerendered routes
and introduces hydration, cascade, CSP, first-paint and cache risks. It was not
applied. Standard PrimeNG SSR remains in use; this optimization needs separate
explicit approval and validation.

The performance smoke package had stale navigation text and pricing assumptions.
Its selectors now follow the existing preparation-guide CTA, and it asserts one
deferred pricing-config request when pricing is revealed (none on landing).
Routing and CPU budgets were not increased. With other builds/tests idle, the
two production timing cases were run sequentially on the original and upgraded
apps using the canonical homepage:

| 4× CPU measurement | Angular 17 | Angular 21 | Existing limit |
| --- | ---: | ---: | ---: |
| Warm route p75 | 451.9 ms | 390.4 ms | <350 ms |
| Maximum long task | 369 ms | 370 ms | ≤190 ms |
| Total long tasks | 1,231 ms | 1,195 ms | ≤1,000 ms |
| Total blocking time | 681 ms | 695 ms | ≤500 ms |

Both timing tests fail on both versions locally; they are **not** reported as
passes. The standard development-mode performance run passed five cases and
failed those two. An exploratory production run also exposed the existing mobile
demo prerender behavior; that failure reproduced on Angular 17. These findings
do not establish a new visual regression, but the full performance package is
not green and needs follow-up before claiming every acceptance criterion is met.

Evidence is stored outside Git at `/private/tmp/angular21-evidence/`, including
the before/after gallery, standalone screenshot archive, build statistics,
audit JSON and individual test logs. The user's original worktree and uncommitted
documentation changes were left untouched. No production database, payment,
email, merge, deployment or feature-access flag was used or changed.
