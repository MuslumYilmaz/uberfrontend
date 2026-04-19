# AGENTS

## Default Context
- Load only this file by default.
- Use `docs/ai-context/router.yaml` to select optional task docs. The router is the source of truth for `keywords`, `paths`, `load`, `avoid`, `priority`, and `max_docs`.
- Topic summaries live under `docs/ai-context/`. Historical audits live under `docs/audits/`. Deeper policy references live under `docs/references/`.

## Repository Shape
- `backend/`: Express API, MongoDB models, services, middleware, Jest tests.
- `frontend/`: Angular 17 app, shared UI, scripts, Karma/Jasmine, Playwright, Tailwind/PostCSS.
- `cdn/`: question banks and sandbox assets consumed by backend and frontend flows.

## Commands
- Package manager: `npm` with separate lockfiles in `backend/` and `frontend/`.
- Backend (`cd backend`): `npm install`, `npm run dev`, `npm start`, `npm test`, `npm run test:cv-calibration`.
- Frontend (`cd frontend`): `npm install`, `npm run start:e2e`, `npm run start:prod`, `npm run build`, `npm test`, `npm run test:unit`, `npm run test:e2e`, `npm run test:e2e:full`, `npm run e2e:perf`.
- Frontend lint/data commands: `npm run lint:tags`, `npm run lint:topics`, `npm run lint:tracks`, `npm run lint:questions`, `npm run lint:design-system`, `npm run lint:design-system:strict`.
- Prerender target: `cd frontend && npx ng run frontendatlas:prerender`.

## Guardrails
- If startup logs `MongoDB URI: mongodb://127.0.0.1:27017/frontendatlas`, treat `frontendatlas` as production data for this machine. Do not use it for local testing unless the user explicitly tells you to.
- Keep backend HTTP handlers in `backend/routes/`, reusable domain logic in `backend/services/`, persistence in `backend/models/`, and cross-cutting guards/rate limiting in `backend/middleware/`.
- Backend tests live in `backend/tests/` and match `*.test.js`.
- Frontend app layers are `src/app/core/`, `src/app/features/`, `src/app/shared/`, and `src/app/store/`.
- Use shared UI primitives from `frontend/src/app/shared/ui/` for interactive controls. Reuse `frontend/src/styles/tokens.scss` and existing typography/spacing patterns instead of one-off styles.
- Treat `cdn/questions/` changes as backend-impacting because `backend/services/gamification/question-catalog.js` reads from that catalog.
- Preserve cookie auth, CSRF, and CORS behavior in auth/billing paths. Never commit secrets.

## Verification
- Run the closest meaningful checks for every non-trivial change and report what was verified, what was not verified, and residual risk.
- Prefer high-signal tests that protect business invariants, routing/SEO contracts, async races, auth/session flows, billing/premium access, progress/xp/streak behavior, and content/registry integrity.
- Avoid low-signal smoke tests that only prove construction, static copy, or incidental DOM shape unless that shell contract is the thing being protected.
- Watch Angular bundle budgets when touching performance-sensitive flows and use `npm run perf:contract` or `npm run e2e:perf` when the change warrants it.
