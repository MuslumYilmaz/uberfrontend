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
- `GUMROAD_MONTHLY_URL`, `GUMROAD_QUARTERLY_URL`, `GUMROAD_ANNUAL_URL`
- `LEMONSQUEEZY_MONTHLY_URL`, `LEMONSQUEEZY_QUARTERLY_URL`, `LEMONSQUEEZY_ANNUAL_URL` (reserved)
- `STRIPE_MONTHLY_URL`, `STRIPE_QUARTERLY_URL`, `STRIPE_ANNUAL_URL` (reserved)

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## E2E tests (Playwright)

Install the Playwright browser (one-time):

`npx playwright install chromium webkit`

Run locally (headed by default):

`npm run test:e2e`

Enable WebKit locally (optional):

`PLAYWRIGHT_ENABLE_WEBKIT=1 npm run test:e2e`

Run in CI (headless, retries enabled):

`CI=true npm run test:e2e`

Stress locally (shake out flakes):

`npx playwright test --repeat-each=10 --workers=4`

Notes:
- Tests fail on `console.error`, `pageerror`, and `unhandledrejection` by default (allowlist: `frontend/e2e/console-allowlist.ts`).
- Reports/artifacts are written to `frontend/playwright-report/` and `frontend/test-results/`.

## SSR/SEO regression tests (Playwright)

These tests validate SSR/prerender output (JS-disabled) versus hydrated DOM (JS-enabled).

Run against a deployed SSR/prerender build:

`PLAYWRIGHT_BASE_URL=https://frontendatlas.com npm run test:e2e -- seo-ssr`

Or run locally with a prerendered build:

1) `ng run frontendatlas:prerender`
2) Serve `dist/frontendatlas/browser` with a static server (any tool you prefer).
3) `PLAYWRIGHT_BASE_URL=http://localhost:4200 npm run test:e2e -- seo-ssr`

## Draft versioning

To safely handle “CDN updates a question (same id) while users have local drafts”, drafts are versioned by content. See `frontend/docs/draft-versioning.md`.

## Deployment (Vercel)

### Vercel project settings (frontend)

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist/frontendatlas/browser`

Notes:
- The app uses client-side routing, so ensure your hosting has an SPA fallback to `index.html` (Vercel’s Angular preset handles this automatically).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
