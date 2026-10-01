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
- Coding HTML bytes: 575,674; total prerender HTML bytes: 103,412,579.
- These four performance metrics already exceed warning thresholds. Thresholds
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

Final migration results and remaining limitations will be recorded below after
the corresponding checks finish.

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
- Prerender now uses a synthetic localhost origin. SEO distinguishes static rendering (no incoming `REQUEST`) from real SSR hostnames so public, premium and private indexing policies survive prerender. Twelve SEO unit cases passed, including preview-host exclusion; production validation follows below.
- Before final clean-install verification: 1,444 unit tests, 1,069 backend tests (82 suites), 100 Chromium critical/accessibility E2E, 96 mocked interview tests (Chromium/Firefox), and isolated real-backend interview flows in both engines passed. Shared-control keyboard/focus tests passed in Chromium and Firefox. All 90 Chromium visual comparisons passed at six widths.
- The interview visual fixture freezes its server/client clock only when explicitly requested by the screenshot suite. Three affected review references were recaptured from the immutable Angular 17 application; no candidate image became a reference.
- Local WebKit cannot launch on macOS 14.2.1 with the installed Playwright build (requires macOS 14.5+). Linux CI runs the WebKit interaction and interview suites. Local unavailability is not a passing result.
