# FrontendAtlas

FrontendAtlas — High-signal frontend interview preparation platform.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.9.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

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

## Draft versioning

To safely handle “CDN updates a question (same id) while users have local drafts”, drafts are versioned by content. See `frontend/docs/draft-versioning.md`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
