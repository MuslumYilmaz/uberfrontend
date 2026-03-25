# AGENTS

## Repository shape
- `backend/`: Express API + MongoDB models/services/tests.
- `frontend/`: Angular 17 app, scripts, and Playwright E2E.
- `cdn/`: question banks and sandbox assets used by backend services.

## Package manager and workspace tooling
- Package manager: `npm` (lockfiles at `backend/package-lock.json`, `frontend/package-lock.json`).
- Backend tooling: `jest` (`backend/jest.config.js`), `nodemon`.
- Frontend tooling: Angular CLI/workspace (`frontend/angular.json`), Karma/Jasmine, Playwright (`frontend/playwright.config.ts`), Tailwind (`frontend/tailwind.config.js`), PostCSS (`frontend/postcss.config.js`), `patch-package`.
- Not detected: `nx`, `pnpm`, `yarn` workspace files.

## Install / dev / build / test / lint commands

### Backend (`cd backend`)
- Install: `npm install`
- Dev server: `npm run dev`
- Start: `npm start`
- Test: `npm test`
- Focused test: `npm run test:cv-calibration`
- Lint: no npm lint script is defined in `backend/package.json`.
- Environment safety: if startup logs `MongoDB URI: mongodb://127.0.0.1:27017/frontendatlas`, treat `frontendatlas` as the production environment/database for this machine. Do not use it for local testing, do not switch local test work onto it, and do not override this rule unless the user explicitly instructs otherwise. Use the test environment/database for local work by default.

### Frontend (`cd frontend`)
- Install: `npm install`
- Dev server: `npm run start:e2e`
- Prod-mode serve: `npm run start:prod`
- Build: `npm run build` (same as `npm run build:prod`)
- Unit + script tests: `npm test`
- Unit only: `npm run test:unit`
- E2E critical / full: `npm run test:e2e` / `npm run test:e2e:full`
- E2E perf: `npm run e2e:perf`
- Lint commands: `npm run lint:tags`, `npm run lint:topics`, `npm run lint:tracks`, `npm run lint:questions`, `npm run lint:design-system`, `npm run lint:design-system:strict`
- Angular workspace target: `npx ng run frontendatlas:prerender` (target exists in `frontend/angular.json`).

## Module boundaries and conventions
- Keep backend HTTP handlers in `backend/routes/`; put reusable domain logic in `backend/services/` (billing providers, gamification, CV tools).
- Keep persistence models in `backend/models/`; keep cross-cutting guards/rate limiting in `backend/middleware/`.
- Backend tests live in `backend/tests/` and are matched by `*.test.js` (`backend/jest.config.js`).
- `backend/services/gamification/question-catalog.js` reads catalog data from `cdn/questions`; treat `cdn/` updates as backend-impacting.
- Frontend app is layered: `src/app/core/` (guards/interceptors/resolvers/services/security), `src/app/features/` (route features), `src/app/shared/` (reusable UI/content), `src/app/store/` (state slices).
- Use shared UI primitives in `frontend/src/app/shared/ui/` for interactive controls; `lint:design-system` enforces no new raw PrimeNG usage, `::ng-deep`, or raw visual/color drift outside allowlisted files.
- Keep theme consistency for new UI work: reuse tokens in `frontend/src/styles/tokens.scss` and existing shared-ui typography/spacing patterns, not one-off colors or font styles.
- Question content and registries live under `frontend/src/assets/questions/`; related generators/lints live in `frontend/scripts/` and are wired into `gen:data`/test flows.

## Review guidelines
- Security: preserve cookie auth + CSRF/CORS behavior in backend auth/billing paths; validate/sanitize external input; never commit secrets.
- Correctness: keep question/track/topic/tag registries schema-valid; when editing routes/services/components, run the closest package tests and relevant lint scripts.
- Performance: watch Angular bundle budgets (`frontend/angular.json`), avoid unnecessary heavy client bundles, and run `npm run perf:contract` / `npm run e2e:perf` when touching performance-sensitive flows.
