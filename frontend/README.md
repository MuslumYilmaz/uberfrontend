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

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## E2E tests (Playwright)

Install the Playwright browser (one-time):

`npx playwright install chromium webkit`

Run critical suite locally (headed by default):

`npm run test:e2e`

Run the real LemonSqueezy smoke test in test mode only:

1. Start the backend locally with the LemonSqueezy test webhook secret configured.
2. Keep `PAYMENTS_MODE=test` in `src/environments/environment.ts`.
3. Run:

`PLAYWRIGHT_WEB_SERVER=1 E2E_REAL_LS=1 npm run test:e2e:lemonsqueezy:real`

Notes:
- This exercises the real hosted LemonSqueezy checkout flow in test mode and verifies the app unlocks premium afterwards.
- It should be run manually, nightly, or before release, not on every CI run.
- The spec itself refuses to run unless checkout provider is LemonSqueezy and payments mode is `test`.

Run full suite (critical + extended + optional specs):

`npm run test:e2e:full`

Run extended/non-blocking suite only:

`npm run test:e2e:extended`

Enable WebKit locally (optional, for whichever suite you run):

`PLAYWRIGHT_ENABLE_WEBKIT=1 npm run test:e2e`

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

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
