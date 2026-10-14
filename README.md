# FrontendAtlas

[FrontendAtlas](https://frontendatlas.com) is an independent frontend interview-preparation platform: an in-browser coding workspace, interactive labs, and source-checked questions across JavaScript, HTML/CSS, Angular, React, Vue, and frontend system design. This repository is the complete production codebase behind the site, not a demo extract.

[Live product](https://frontendatlas.com) · [Interactive labs](#interactive-labs) · [Architecture](#architecture) · [Local development](#local-development) · [Editorial policy](https://frontendatlas.com/legal/editorial-policy)

If the labs or the codebase are useful to you, a star helps other frontend engineers find them.

## Why this repository is worth a look

- **A production Angular 21 application.** Server-side rendering with prerendered public routes, signal-based component state, deferred loading for heavy surfaces, and bundle budgets that fail CI instead of warning.
- **An in-browser coding workspace.** Monaco editors, a web-worker preview builder, framework-aware checks for JavaScript, React, Angular, and Vue challenges, and draft versioning that survives content updates.
- **Interactive labs instead of static answers.** Six explainers ask you to predict an outcome, run it, and compare. See the [lab table](#interactive-labs) below.
- **Content treated like code.** Question banks are versioned JSON with registries, generators, lint rules for tags, topics, tracks, and indexability readiness, and regression tests that fail when authored and generated content drift apart.
- **The unglamorous production parts.** Cookie authentication with CSRF protection, rate limiting, Lemon Squeezy billing with webhook reconciliation, Sentry, and eleven GitHub Actions workflows covering unit, backend, Playwright critical and extended suites, visual regression against reviewed screenshots, an SEO guard, security checks, and production smoke.

## What is inside

Counts from the `cdn/` catalog as of October 2026.

| Content | Count |
| --- | --- |
| Practice items: coding challenges, concept questions, debug tasks, system design cases | 456, of which 311 are free |
| Debugging incidents | 11 |
| Engineering tradeoff scenarios | 34 |
| Timed pressure modes | 10 |
| Interactive labs | 6 |

## Interactive labs

| Lab | What you do |
| --- | --- |
| [Angular change detection visualizer](https://frontendatlas.com/angular/trivia/angular-change-detection-strategies) | Watch which components Default and OnPush check on each pass, and what triggers a check under OnPush. |
| [RxJS flattening operators](https://frontendatlas.com/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use) | Compare switchMap, exhaustMap, mergeMap, and concatMap on overlapping requests, on a virtual-time engine built on the real RxJS. |
| [What actually cancels an Angular HTTP request](https://frontendatlas.com/angular/trivia/angular-http-what-actually-cancels-request) | Six runnable tests show when unsubscribe cancels the request and when server work continues. |
| [JavaScript event loop visualizer](https://frontendatlas.com/javascript/trivia/js-event-loop) | Predict the output order, then step through the call stack, microtasks, timers, and the render opportunity. |
| [React stale closures: six pull requests](https://frontendatlas.com/react/trivia/react-stale-state-closures) | Review six pull requests, predict the failure, and reveal the minimal safe diff. |
| [CSS sticky debugging lab](https://frontendatlas.com/css/trivia/css-position-sticky-not-working) | Diagnose five broken `position: sticky` layouts by inspecting overflow, insets, container height, and flex or grid stretch. |

## Architecture

| Area | Responsibility |
| --- | --- |
| `frontend/` | Angular 21 application with TypeScript, RxJS, and signals; shared UI primitives in `src/app/shared/ui/`; the Monaco-based coding workspace; Karma/Jasmine unit tests; Playwright end-to-end, visual regression, accessibility, and performance-contract suites. |
| `backend/` | Express 5 API on MongoDB with Mongoose: cookie authentication with CSRF protection, progress and interview workflows, billing integrations, rate limiting, and Jest tests. |
| `cdn/` | Versioned question banks, sandbox assets for the coding workspace, debugging incidents, and tradeoff scenarios consumed by the application and the backend catalog logic. |
| Build and content tooling | Repository scripts generate registries, metadata, data versions, sitemaps, and prerender routes, then validate that generated and authored content stay aligned. |

Frontend code is layered as `src/app/core/`, `src/app/features/`, `src/app/shared/`, and `src/app/store/`. The frontend calls the backend through `/api`; in local development the Angular dev server proxies that path to `http://localhost:3001`, and the backend keeps persistence and integration credentials server-side.

## Local development

### Prerequisites

- Node.js 22 and npm (see `.nvmrc`).
- A local MongoDB instance only if you need authenticated or persisted backend flows.
- A Chrome-compatible browser for the frontend unit-test runner.

This repository has separate lockfiles for the frontend and backend, so install each package independently:

```bash
git clone https://github.com/MuslumYilmaz/uberfrontend.git
cd uberfrontend/frontend
npm ci
cd ../backend
npm ci
```

### Run the frontend

From `frontend/`:

```bash
npm run start:e2e
```

The script refreshes the generated frontend data used by the app and starts the development server at [http://127.0.0.1:4200](http://127.0.0.1:4200). Public, content-backed routes can be developed without configuring production services; authenticated and persisted flows also need the local backend.

### Run the backend safely

From `backend/`, copy the tracked template and fill in only local or test credentials:

```bash
cp .env.example .env
```

Use an isolated local database. A minimal development configuration is:

```dotenv
NODE_ENV=development
PORT=3001
MONGO_TARGET=test
MONGO_URL_TEST=mongodb://127.0.0.1:27017/frontendatlas_dev
EXPECTED_MONGO_DB_NAME_TEST=frontendatlas_dev
FRONTEND_ORIGINS=http://127.0.0.1:4200,http://localhost:4200
FRONTEND_BASE=http://127.0.0.1:4200
COOKIE_SECURE=false
PAYMENTS_MODE=test
```

Then start the API:

```bash
npm run dev
```

Do not point routine development or tests at `mongodb://127.0.0.1:27017/frontendatlas`; that database name is reserved as production data on the maintainer's machine. Never reuse production MongoDB, OAuth, email, billing, Redis, or signing credentials locally. Provider-specific test configuration is documented in [`backend/README.md`](backend/README.md), and frontend build details are documented in [`frontend/README.md`](frontend/README.md).

## Verification

Run checks from the package they belong to.

Frontend unit, design-system, build, and prerender contracts:

```bash
cd frontend
npm run test:unit
npm run lint:design-system
npm run check:prerender-sitemap
npm run build
npx ng run frontendatlas:prerender
```

Backend lint, content validation, and Jest suite:

```bash
cd backend
npm run verify:ci
```

For browser coverage, install the Playwright browsers once and run the critical suite from `frontend/`:

```bash
npx playwright install chromium webkit
npm run test:e2e
```

The package-level READMEs list the narrower content, SEO, accessibility, performance, billing, and full-stack checks.

## Maintainer and project ownership

FrontendAtlas is built and maintained by [Müslim Yılmaz](https://www.linkedin.com/in/mslm-yilmaz/), a Senior Frontend Engineer focused on Angular, TypeScript, frontend architecture, performance, and testing.

- Product: [frontendatlas.com](https://frontendatlas.com)
- GitHub: [MuslumYilmaz](https://github.com/MuslumYilmaz)
- LinkedIn: [Müslim Yılmaz](https://www.linkedin.com/in/mslm-yilmaz/)
- Editorial process: [FrontendAtlas Editorial Policy](https://frontendatlas.com/legal/editorial-policy)

FrontendAtlas is an independent project. References to technologies, companies, or interview formats are editorial and do not imply affiliation or endorsement.

## License and reuse

This repository does not currently grant permission to copy, modify, distribute, or reuse its source code or content. Source visibility on GitHub is not a license. Unless the maintainer publishes an explicit license in the future, all rights are reserved by Müslim Yılmaz.
