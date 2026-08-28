# FrontendAtlas

[FrontendAtlas](https://frontendatlas.com) is an independent frontend interview-preparation platform built around repeatable, hands-on practice. It brings coding exercises, concept questions, system-design scenarios, debugging incidents, and engineering tradeoffs into one focused workflow.

[Live product](https://frontendatlas.com) · [Editorial policy](https://frontendatlas.com/legal/editorial-policy) · [Maintainer](https://www.linkedin.com/in/mslm-yilmaz/)

## What the product emphasizes

- A real in-browser coding workspace with runnable examples, previews, and checks.
- Guided preparation across JavaScript, HTML/CSS, Angular, React, Vue, and frontend system design.
- Practice formats that go beyond recall: implementation tasks, incident diagnosis, and explicit tradeoff analysis.
- Content maintenance backed by registries, generators, validation scripts, regression tests, and primary-source checks.
- Indexable learning surfaces supported by generated metadata, sitemaps, and Angular prerendering.

The live product is the clearest way to explore the current experience: [frontendatlas.com](https://frontendatlas.com).

## Architecture

| Area | Responsibility |
| --- | --- |
| `frontend/` | Angular 17 application using TypeScript and RxJS, shared UI primitives, browser-based coding tools, Karma/Jasmine unit tests, and Playwright end-to-end coverage. |
| `backend/` | Express 5 API backed by MongoDB/Mongoose, with cookie authentication, progress and interview workflows, billing integrations, rate limiting, and Jest tests. |
| `cdn/` | Versioned question banks, practice assets, debugging incidents, and tradeoff scenarios consumed by the application and backend catalog logic. |
| Build and content tooling | Repository scripts generate registries, metadata, data versions, sitemaps, and prerender routes, then validate that generated and authored content remain aligned. |

The frontend calls the backend through `/api` in local development. Angular's development server proxies that path to `http://localhost:3001`; the backend keeps persistence and integration credentials server-side.

## Local development

### Prerequisites

- Node.js 20 and npm.
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

Do not point routine development or tests at `mongodb://127.0.0.1:27017/frontendatlas`; that database name is reserved as production data on the maintainer's machine. Never reuse production MongoDB, OAuth, email, billing, Turnstile, Redis, or signing credentials locally. Provider-specific test configuration is documented in [`backend/README.md`](backend/README.md), and frontend build details are documented in [`frontend/README.md`](frontend/README.md).

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

Backend content validation and Jest suite:

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
