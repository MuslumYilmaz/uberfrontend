# FrontendAtlas

FrontendAtlas — High-signal frontend interview preparation platform.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.9.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Payments config

Set these build-time values in `frontend/src/environments/environment.ts` (and `environment.prod.ts` for production):

- `PAYMENTS_PROVIDER`: `gumroad` (default), `lemonsqueezy`, or `stripe`
- `PAYMENTS_MODE`: `test` (default for dev), `live` (prod)
- `GUMROAD_MONTHLY_URL`, `GUMROAD_QUARTERLY_URL`, `GUMROAD_ANNUAL_URL`
- `GUMROAD_MANAGE_URL`
- `LEMONSQUEEZY_MONTHLY_URL`, `LEMONSQUEEZY_QUARTERLY_URL`, `LEMONSQUEEZY_ANNUAL_URL`, `LEMONSQUEEZY_LIFETIME_URL`
- `LEMONSQUEEZY_MANAGE_URL`
- `LEMONSQUEEZY_MONTHLY_URL_TEST`, `LEMONSQUEEZY_QUARTERLY_URL_TEST`, `LEMONSQUEEZY_ANNUAL_URL_TEST`, `LEMONSQUEEZY_LIFETIME_URL_TEST`
- `LEMONSQUEEZY_MANAGE_URL_TEST`
- `LEMONSQUEEZY_MONTHLY_URL_LIVE`, `LEMONSQUEEZY_QUARTERLY_URL_LIVE`, `LEMONSQUEEZY_ANNUAL_URL_LIVE`, `LEMONSQUEEZY_LIFETIME_URL_LIVE`
- `LEMONSQUEEZY_MANAGE_URL_LIVE`
- `STRIPE_MONTHLY_URL`, `STRIPE_QUARTERLY_URL`, `STRIPE_ANNUAL_URL` (reserved)
- `STRIPE_MANAGE_URL`

Notes:
- Local dev: update `environment.ts`.
- Vercel/prod build: update `environment.prod.ts` before deploying.
- E2E safety: keep `PAYMENTS_MODE=test` for local/CI.

### How to run safely (payments)

- Keep `PAYMENTS_MODE=test` in local/CI builds.
- E2E will refuse to run if `PAYMENTS_MODE=live` unless `E2E_ALLOW_LIVE_PAYMENTS=true` is set.

## Analytics traffic hygiene

- Local/test builds do not load GA because their measurement ID is empty, and browser automation is suppressed even in a production build.
- GA loads only after a session qualifies as human: a trusted pointer, key or touch interaction, or 15 cumulative seconds with the tab visible. Page views queue until then, so scripted visitors that render a page and leave never reach GA.
- Self-declared crawlers, HTTP clients and automation runtimes never load GA. Browsers that only look scripted (no accepted languages, a zero-sized window, desktop Chrome without the `chrome` runtime) still load GA but send `traffic_type=bot_suspect`; a GA4 internal-traffic data filter for that value excludes them from reports once it is switched from Testing to Active.
- To mark a real production browser tab used by the team, open any page once with `?fa_traffic=internal`. Use `?fa_traffic=test` for an intentional live analytics verification. The PII-free `traffic_type` marker remains only for that tab.
- Open a page with `?fa_traffic=external` to clear the tab marker. Qualified-visitor reporting should exclude `traffic_type` values `internal` and `test`.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## E2E tests (Playwright)

Install the Playwright browser (one-time):

`npx playwright install chromium webkit`

Run critical suite locally (headed by default):

`npm run test:e2e`

Run the real auth smoke against a real backend (local or staging):

1. Start the backend locally if you are using `PLAYWRIGHT_WEB_SERVER=1`.
2. Use a non-production target by default.
3. Run:

`PLAYWRIGHT_WEB_SERVER=1 E2E_REAL_AUTH=1 npm run test:e2e:auth:real`

Or against staging:

`PLAYWRIGHT_BASE_URL=https://<your-staging-host> E2E_REAL_AUTH=1 npm run test:e2e:auth:real`

Notes:
- This creates a fresh email/password user, verifies signup, reload-triggered `/api/auth/me`, and logout.
- The spec refuses to target `frontendatlas.com` unless `E2E_ALLOW_PROD_REAL_AUTH=1` is set.

Run the CI full-stack smoke against a local test backend:

1. Start the backend with `NODE_ENV=test`, `MONGO_TARGET=test`, `MONGO_URL_TEST` pointing at an isolated `frontendatlas_ci` database, and `PAYMENTS_MODE=test`.
2. Run:

`npm run test:e2e:fullstack-smoke`

Notes:
- This uses the Angular dev-server proxy to hit the local backend.
- It verifies real auth plus backend-owned LemonSqueezy test checkout config/attempt creation.
- It does not open hosted checkout and does not enter card details.

Run the real GitHub OAuth smoke on staging:

1. Use a dedicated staging GitHub account.
2. Prefer an account without extra 2FA prompts for automation.
3. Run:

`PLAYWRIGHT_BASE_URL=https://<your-staging-host> E2E_REAL_OAUTH=1 E2E_REAL_OAUTH_LOGIN=your-github-login E2E_REAL_OAUTH_PASSWORD=your-github-password E2E_REAL_OAUTH_EXPECTED_EMAIL=you@example.com npm run test:e2e:oauth:real`

Notes:
- This is intentionally a sparse staging smoke, not an every-push test.
- It verifies the real GitHub redirect/callback roundtrip, session establishment, and logout.
- The spec refuses to target `frontendatlas.com` unless `E2E_ALLOW_PROD_REAL_OAUTH=1` is set.

Run the real LemonSqueezy smoke test in test mode only:

1. Start the backend locally with the LemonSqueezy test webhook secret configured.
2. Keep `PAYMENTS_MODE=test` in `src/environments/environment.ts`.
3. Set `E2E_LS_EXPECTED_TEST_BUY_ID` to the expected test buy id.
4. Set `E2E_LS_TEST_CARD_ALLOWED=1` only when you are intentionally running the hosted test-card flow.
5. Run:

`PLAYWRIGHT_WEB_SERVER=1 E2E_REAL_LS=1 E2E_LS_TEST_CARD_ALLOWED=1 E2E_LS_EXPECTED_TEST_BUY_ID=<test-buy-id> npm run test:e2e:lemonsqueezy:real`

Notes:
- This exercises the real hosted LemonSqueezy checkout flow in test mode and verifies the app unlocks premium afterwards.
- It should be run manually, nightly, or before release, not on every PR CI run.
- The spec refuses production targets, requires backend checkout config to report `mode: test`, and will not enter card details unless explicitly allowed.

Run full suite (critical + extended + optional specs):

`npm run test:e2e:full`

Run the extended experience suite (mobile layout, accessibility, offline replay) against the dev server:

`npm run test:e2e:extended`

Run the extended production contracts (SEO SSR, editorial copy, labs, premium exposure, system design V2) against a production build (`npm run build` first):

`npm run test:e2e:extended:prod`

Both extended suites run in the `Playwright Extended` CI job on every pull request and main push, next to `Playwright Critical`.

Enable WebKit locally (optional, for whichever suite you run):

`PLAYWRIGHT_ENABLE_WEBKIT=1 npm run test:e2e`

Verify the same browser set as GitHub before pushing:

`npm run verify:e2e-critical:all-browsers`

If your local machine cannot launch Playwright WebKit but you still need to push and let GitHub be the WebKit gate, set a Git-level override once:

`git config hooks.allowMissingWebkit true`

Run critical suite in CI mode (headless, retries enabled):

`CI=true npm run test:e2e`

Stress locally (shake out flakes):

`npx playwright test --repeat-each=10 --workers=4`

Notes:
- Tests fail on `console.error`, `pageerror`, and `unhandledrejection` by default (allowlist: `frontend/e2e/console-allowlist.ts`).
- Reports/artifacts are written to `frontend/playwright-report/` and `frontend/test-results/`.

## Performance smoke tests (Playwright)

The perf smoke test measures long tasks on `/showcase` under CPU throttling.

Run locally:

`npm run e2e:perf`

Artifacts:
- `frontend/test-results/perf/showcase.longtasks.json`
- `frontend/test-results/perf/showcase-trace.zip`
- `frontend/test-results/perf/showcase.png` (and `showcase-fail.png` on failure)

## SSR/SEO regression tests (Playwright)

These tests validate SSR/prerender output (JS-disabled) versus hydrated DOM (JS-enabled).

Run against a deployed SSR/prerender build:

`PLAYWRIGHT_BASE_URL=https://frontendatlas.com npx playwright test e2e/seo-ssr.spec.ts`

Or run locally with a prerendered build:

1) `ng run frontendatlas:prerender`
2) Serve `dist/frontendatlas/browser` with a static server (any tool you prefer).
3) `PLAYWRIGHT_BASE_URL=http://localhost:4200 PLAYWRIGHT_SSR=1 npx playwright test e2e/seo-ssr.spec.ts`

### Incident content and UI contracts

Build first with `npm run build:prod`, then run `npm run test:e2e:incidents:prod`.
The suite checks every public incident's real prerendered educational markup,
Premium solution exclusion, saved-session hydration, scoring, navigation, and
keyboard accessibility. Backend requests are mocked. This suite also runs in
the Playwright CI job against the production output.

On macOS, `npm run test:e2e:incidents:visual` compares the same production output
with 93 Chromium reference images captured before the renderer change
(application revision `28a133614deb`). It covers every free incident at 390/1440px
and the full Stale Search Race flow at 360/390/834/1366/1440px, with zero differing
pixels allowed. The visual suite is opt-in (`INCIDENT_VISUAL=1`) and skips other
operating systems because the committed references use macOS font rendering.
Do not use `--update-snapshots` to verify a rendering change: investigate the
diff first. New platform references must come from a known-good application
using the same Chromium and font environment as the candidate.

## Draft versioning

To safely handle “CDN updates a question (same id) while users have local drafts”, drafts are versioned by content. See `frontend/docs/draft-versioning.md`.

## Deployment (Vercel)

### Vercel project settings (frontend)

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist/frontendatlas/browser`

Notes:
- Do not use a global catch-all SPA rewrite to `index.html`.
- Use filesystem-first routing so prerendered routes are served as static HTML.
- Apply targeted rewrites only for private CSR paths (for this repo: `/dashboard`, `/profile`, `/admin/*`, `/billing/*`, `/onboarding/*`, premium `/tracks/:slug`, premium `/companies/:slug/*`).
- Keep unknown URLs as real `404` responses.

## Sitemap content dates

`npm run gen:seo` generates sitemap XML under `.angular/seo/sitemaps/` and the
ignored Angular module `src/app/generated/seo-content-dates.ts`. These artifacts
are generated before builds and tests, and are not committed. Angular copies only
the XML files to the public build; Git provenance remains in
`.angular/seo/content-dates.json` on the build machine.
The generated date module is excluded from `data-version` hashing, so assigning
commit dates does not invalidate user drafts or require another content commit.

Dates come from the last meaningful content transition in the target commit's
first-parent Git history, using the committer's UTC day. A merge counts when its
content enters that branch; a revert is also a content update. Build time, file
mtime and editorial `updatedAt` fields do not determine SEO dates. Existing
publication and editorial dates remain separate from `dateModified`.

The inventory selects individual catalog objects, article content and explicitly
mapped page dependencies. It ignores date fields, generated files, tests,
comments and visual styles. Adding a public route requires a content mapping.
Question, debug, system design, incident and tradeoff pages are dated only by
their own catalog object, the CDN assets it references, per-entry bundles and
page-specific lab components. The shared detail components, templates,
parameterized route metadata and SEO helpers that render every entry of a
family are not part of a per-entry projection, so a shared edit never re-dates
a whole family. Hub, landing, guide and company pages still follow their own
components and templates.
When changing the meaning of a projection, increment `PROJECTION_VERSION` and
rebuild the historical baseline from Git; do not stamp the current date. A build
with an older projection checkpoint recomputes dates from full Git history
without rewriting the checkpoint.

- Generate: `npm run gen:seo` (also part of `gen:data`, install and test commands).
- Verify existing output without writes: `npm run check:seo-dates`.
- Validate staged sources without writes or staging: `node scripts/generate-seo-content-dates.mjs --staged`.
- Rebuild the historical checkpoint: `node scripts/seo-content-history.mjs --baseline --target <existing-commit>`.
- Regression tests: `npm run test:seo-dates`.

The tracked `scripts/seo-content-baseline.json` is a historical checkpoint, not an
always-current generated manifest. Review its source commits and date changes
when deliberately refreshing it. The normal build resolves later transitions
without changing this file. Unknown historical dates are omitted with a reason.

Local uncommitted content is reported as pending and has no published lastmod.
CI and Vercel builds reject pending semantic content. `--strict` enables that
check explicitly for local generation. The pre-commit check validates the staged
snapshot; it never treats unstaged files as staged or assigns a publication date
before the commit exists.

A Git checkout is required. CI checks out full history; `ensure-seo-history.mjs`
completes a shallow checkout from its existing `origin` using existing credentials.
For [Vercel's shallow checkout](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel)
without `origin`, it fetches the checked-out commit directly from GitHub using the
validated `VERCEL_GIT_PROVIDER`, `VERCEL_GIT_REPO_OWNER` and `VERCEL_GIT_REPO_SLUG`
[system metadata](https://vercel.com/docs/environment-variables/system-environment-variables).
It does not add remotes or change credentials. Private repositories need an
authenticated `origin` or a full Git checkout; inaccessible history still fails.
`node scripts/ensure-seo-history.mjs --check` checks without fetching. Missing Git,
unavailable history, invalid dates or missing content mappings fail explicitly;
there is no build-time date fallback. Verify this prerequisite in a Vercel preview
before releasing a change to the deployment pipeline.

After building, `npm run seo:meta-check` verifies sitemap/JSON-LD date agreement,
and `npm run seo:link-equity` verifies public URL reachability and inclusion.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
