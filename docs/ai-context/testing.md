# Testing Context

Load this for verification strategy, CI, regression risk, or test-quality work.

## When to load
- The task is about tests, CI, coverage tradeoffs, regression gaps, or release confidence.
- The change touches auth/session, billing/premium access, progress/xp/streak/dashboard, content/registry integrity, or route/SEO/prerender contracts.
- The user asks for review with a test-quality or risk focus.

## When not to load
- The task is a routine backend or frontend code fix with no special verification or CI question.
- The work is content authoring, trivia review, or UI styling without test-strategy impact.

## Non-negotiables
- Local hooks and coverage numbers are filters, not the trust boundary; run the closest meaningful checks.
- Prefer high-signal tests that protect user-visible behavior, business invariants, state transitions, routing/SEO contracts, and async race handling.
- Final reports must state what was verified, what was not verified, and residual risk.
- If a critical-path change lacks meaningful coverage, add or strengthen the nearest high-signal test instead of relying on manual hope.

## Path triggers
- `backend/tests/**`
- `frontend/**/*.spec.ts`
- `frontend/e2e/**`
- `.github/workflows/**`

## UI and CI scope

- `UI Regression` compares the current production UI with reviewed Linux screenshots and checks SSR styles/keyboard controls using one build.
- UI and Interview checks use `scripts/ci-change-scope.mjs`; retain shared frontend/CDN/content dependencies when changing its scope.
- `Playwright Extended` runs `test:e2e:extended` (dev server: mobile layout, accessibility, offline replay) and `test:e2e:extended:prod` (production build: SEO SSR, editorial copy, labs, premium exposure) on every PR and main push. Specs that live in `frontend/e2e/` but in neither suite nor `test:e2e:critical` do not run anywhere; wire new specs into one of them.
- `Full-stack Smoke` is the only place frontend and backend meet without mocks: real signup/session (`auth.real.spec.ts`), the progress loop against the real API (`gamification.real.spec.ts`: completion -> summary -> dashboard -> practice-progress) and a test-mode checkout attempt that never opens a hosted checkout. Add a flow here when the frontend mocks of an endpoint change shape.
- `Playwright Critical` runs `perf:contract:strict`; the thresholds in `frontend/scripts/perf-contract.mjs` and the Angular initial budget fail the job instead of warning. Raise them deliberately in the same change when a regression is intended.
- Backend Verify runs `npm run lint` (ESLint recommended + no-undef/no-unused-vars) before Jest.
- Scheduled: `WebKit Critical` (Mondays) runs the critical suite in WebKit; `Production Smoke` (after each production deployment and every six hours) probes the live API health, checkout config mode and the crawl surfaces, read-only.
- Payment rule: no automated test may complete a real checkout. Billing coverage is webhook/lifecycle integration tests, mocked frontend flows and the test-mode backend smoke; the hosted LemonSqueezy checkout stays a manual, test-mode-only dispatch.
- See `docs/references/ui-regression.md` for coverage, intentional screenshot updates, and runtime requirements.

## Deep reference
- `docs/references/trusted-vibe-coding.md`
- `docs/audits/test-quality-audit.md`
- `docs/audits/seo-audit.md`
