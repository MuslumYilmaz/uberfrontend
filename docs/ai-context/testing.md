# Testing Context

Load this for verification strategy, CI, regression risk, or test-quality work, and before committing or pushing any change under `frontend/`, `cdn/`, `backend/` or `content-drafts/`. Most CI failures come from feature work, not test work. Of about 63 failed runs on feature branches between 2026-09-20 and 2026-10-25, about 19 were stale Linux screenshots, 10 were Extended or production e2e suites that no hook runs, 6 were a stale `cdn/data-version.json`, 6 were flaky e2e tests, 2 were the strict perf contract and 1 was an interview source pin; most of the rest were new security advisories and CI environment changes.

## When to load
- The task is about tests, CI, coverage tradeoffs, regression gaps, or release confidence.
- The change is about to be committed or pushed, or a hook or CI check failed.
- The change touches auth/session, billing/premium access, progress/xp/streak/dashboard, content/registry integrity, or route/SEO/prerender contracts.
- The user asks for review with a test-quality or risk focus.

## When not to load
- The change is documentation or research only.
- The work is content authoring or trivia review that does not touch `cdn/` or `frontend/`.

## Non-negotiables
- Local hooks and coverage numbers are filters, not the trust boundary; run the closest meaningful checks.
- Prefer high-signal tests that protect user-visible behavior, business invariants, state transitions, routing/SEO contracts, and async race handling.
- Final reports must state what was verified, what was not verified, and residual risk.
- If a critical-path change lacks meaningful coverage, add or strengthen the nearest high-signal test instead of relying on manual hope.
- A green pre-push hook does not mean CI will pass: the hooks skip several CI checks (see "Gaps"). Never loosen an assertion, raise a budget or refresh screenshots only to get green; do it in the same change as the intended behavior and say so.

## Path triggers
- `backend/tests/**`
- `frontend/**/*.spec.ts`
- `frontend/e2e/**`
- `.github/workflows/**`
- `.githooks/**`
- `frontend/scripts/perf-contract.mjs`
- `frontend/scripts/run-pre-commit-checks.mjs`

## Where checks run

### Pre-commit (staged files only)
`.githooks/pre-commit` calls `frontend/scripts/run-pre-commit-checks.mjs`:
- `bash -n` for staged hooks, `node --check` for staged root and `frontend/scripts/` JS.
- `lint:questions:hook` when `cdn/questions|incidents|tradeoff-battles|practice/`, `cdn/data-version.json`, `frontend/package.json`, `frontend/angular.json`, the generated content metadata or a content pipeline script is staged.
- `generate-seo-content-dates.mjs --staged` for `frontend/src/app/**` or `cdn/(questions|incidents|tradeoff-battles|practice|sb)/**`.
- Coding assist sync for `coding.json`, decision graphs and explain artifacts.
- `lint:design-system:strict` for app `.html/.scss/.css`, `src/styles/**`, `shared/ui/**/*.ts` and `shared/components/**/*.ts`.
- Targeted `ng test` when 1–12 specs match the staged files (skipped above 12).
- Backend: `node --check` and `jest --findRelatedTests` for staged backend JS.

### Pre-push (files in the pushed commits)
`.githooks/pre-push`, in order:
- Backend changes: `node --check`, `jest --findRelatedTests` for changed sources (2 workers), changed test files by path. Not the full suite.
- Interview content changes (`backend/content/interview/`, `content-drafts/interview-mcq/generated/`, `cdn/questions/system-design/`, any `cdn/questions/*/coding.json`, `cdn/questions/pressure-modes/`, `cdn/sb/`): `generate:interview-content:check` and `validate:interview-content`.
- Frontend changes (`frontend/`, `content-drafts/interview-mcq/`, `cdn/questions|incidents|tradeoff-battles|practice/`, `cdn/data-version.json`): coding assist sync; `lint:tags`, `lint:topics`, `lint:tracks`; `verify:unit-and-content:prepush` (text/spelling/draft/interview-bank/guide/trivia/indexability lints, `lint:questions:hook`, prerender-sitemap and design-budget checks, Karma, content regressions); `verify:seo-prerender-guard` (`gen:data`, production build, meta/link/link-equity/prep-menu/footer audits, `seo:smoke`, non-strict `perf:contract`); `verify:e2e-critical` on port 4310 with server reuse off, in WebKit too when local WebKit is healthy.

### CI (pull requests and pushes to `main` only)
A push to `dev` runs no workflow; `dev` is first tested in CI by the open dev→main pull request, so problems the hooks miss surface there.

| Workflow / job | Runs | What it adds beyond the hooks |
|---|---|---|
| Frontend Unit Verify | PR, main | `verify:unit-and-content`: the pre-push set with `lint:questions:check`, which also runs `gen-data-version.mjs --check` |
| Backend Verify | PR, main | `verify:ci`: ESLint, `generate:interview-content:check`, `validate:interview-content`, the full Jest suite |
| Playwright Critical | PR, main | `lint:questions`, `lint:design-system:strict`, build, `perf:contract:strict`, critical e2e, then `test:e2e:react:prod`, `test:e2e:framework-catalog:prod`, `test:e2e:public:prod`, `test:e2e:incidents:prod` |
| Playwright Extended | PR, main | `test:e2e:extended:prod` (SEO SSR, editorial copy, labs, premium exposure) and `test:e2e:extended` (mobile layout, accessibility, offline replay) |
| UI Regression | PR only | Linux screenshots (`ui-visual.spec.ts`, 138 images) and three-browser SSR style/keyboard checks |
| Interview mocked / production full-stack, Cross-browser Gate | PR, main, when backend or shared paths change | `interview-mode.spec.ts` and the production-config lifecycle in Chromium, Firefox and WebKit |
| Full-stack Smoke | PR, main | real signup/session (`auth.real.spec.ts`), the progress loop against the real API (`gamification.real.spec.ts`), a test-mode checkout attempt that never opens a hosted checkout |
| SEO Prerender Guard | PR only | same `verify:seo-prerender-guard` as pre-push |
| Security Verify | PR, main, Mondays | backend `npm audit --omit=dev --audit-level=high`; frontend audit against `docs/security/npm-audit-allowlist.json` (entries expire, criticals cannot be allowlisted); secret scan; CodeQL |
| Action Policy | PR, main | every GitHub Action pinned to a full SHA |
| WebKit Critical | Mondays | the critical suite in WebKit |
| Production Smoke | after each production deploy, every 6 h | live API health, checkout config mode, crawl surfaces, read-only |
| IndexNow | after each `frontendatlas-fe` production deploy, manual `all` | see below |
| LemonSqueezy Test Checkout, Perf Smoke | manual only | hosted test-mode checkout (production refused); `e2e:perf` with `run_perf` |

UI Regression and the Interview matrices use `scripts/ci-change-scope.mjs`: any change under `frontend/`, `cdn/`, `content-drafts/`, `scripts/`, `.github/` or a root package file counts as UI-relevant, and backend changes add the Interview matrices. Retain these shared dependencies when changing the scope. Keep **UI Regression** and **Interview Cross-browser Gate** as the stable required checks.

## Gaps: passes locally, fails in CI
1. **Data version.** `lint:questions:hook` is `lint:questions:check` without `gen-data-version.mjs --check`, and the pre-push SEO guard runs `gen:data`, which rewrites `cdn/data-version.json` in the working tree after the commits exist. The push succeeds and Frontend Unit Verify fails with `[gen-data] ERROR: data version is stale.`, hiding any Karma or content failure behind it.
2. **Perf contract.** Pre-push runs `perf:contract -- --no-write`, where overruns are warnings; Playwright Critical runs `--strict`, where any warning fails.
3. **Suites no hook runs.** Both Extended suites, the four production e2e steps of Playwright Critical, UI Regression, the Interview cross-browser matrices and Full-stack Smoke.
4. **Backend tests.** Hooks run related tests only; CI runs the full suite and ESLint.
5. **Unrelated failures.** New security advisories or an expired allowlist entry fail any pull request; WebKit problems surface up to a week late through the Monday schedule.

## Before pushing, by change type
Run from `frontend/` unless noted. After every push, run `git status --short` and commit anything the hook regenerated.
- **Any change to `frontend/src/app/**/*.ts`, the JSON or Markdown under `cdn/questions|incidents|tradeoff-battles|practice/`, `frontend/package.json` or `frontend/angular.json`, dependency bumps included:** `node scripts/gen-data-version.mjs`, then commit `cdn/data-version.json` with the change. `node scripts/gen-data-version.mjs --check` must pass before pushing.
- **Anything visible on a screenshotted page:** layout, shared header or footer, copy, and content that changes counts or dates on public pages. Expect UI Regression to fail. Dispatch `gh workflow run ui-regression.yml --ref <branch> -f update_baselines=true`, download `ui-visual-linux-baselines`, review the PNGs, copy them into `frontend/e2e/ui-visual.spec.ts-snapshots/` and commit the whole refreshed set for shared-chrome changes; a partial refresh leaves other screenshots failing. Linux references come only from the workflow; never rename darwin images to linux. Refresh darwin references for local runs with `npm run test:e2e:ui -- --update-snapshots=changed`. See `docs/references/ui-regression.md`.
- **Shared header/footer, links or labels, premium flags, a new or renamed page:** `npm run build`, then `npm run test:e2e:extended:prod`, `npm run test:e2e:extended`, `npm run test:e2e:public:prod`, `npm run test:e2e:framework-catalog:prod` and `npm run test:e2e:react:prod`. Typical breaks are a second link with the same accessible name (`strict mode violation`), a changed label, or a premium item turning its free neighbor's footer "Next" into a button in `seo-question-navigation`.
- **New pages, routes, prerendered HTML or heavier eager imports:** `rm -rf dist && npm run build && npm run perf:contract:strict`. The JS budget is the static import closure of the entry scripts (`eagerJsBytes`), not the `modulepreload` hints: Angular emits hints only for the first ten static imports of `main`. Raise thresholds in `frontend/scripts/perf-contract.mjs` deliberately, in the same change, when the growth is intended.
- **`coding.json`, system-design bundles, `cdn/sb/` or pressure modes:** from the repo root, `npm -C backend run generate:interview-content:check && npm -C backend run validate:interview-content && npm -C backend test -- interview-artifacts interview-system-design-content`. A drifted source pin (`source bundle drifted; expected … received …`) is re-pinned in `backend/content/interview/*-registry-v1.*.json`, `interview-artifact-pins-v1.json` and the hash in the backend interview tests, with a maintenance review note.
- **Renaming a title, slug or company, or changing a catalog count:** grep the old value first, `grep -rn "<old value>" frontend/e2e frontend/scripts frontend/src --include=*.spec.ts --include=*.mjs`. Known pins: `frontend/scripts/seo-smoke.mjs` (authored titles), `frontend/e2e/seo-ssr.spec.ts` (company lists and cases), `shared/company-previews/company-interview-processes.spec.ts`, `frontend/scripts/seo-content-inventory.test.mjs`, `frontend/scripts/question-tags.test.mjs` (correction dates) and `frontend/scripts/public-trust-regressions.test.mjs` (track sizes). Then run `npm run verify:seo-prerender-guard`.
- **Backend change:** `npm -C backend run verify:ci` (ESLint, interview content checks, full Jest), not only the related tests.
- **Dependency bump:** `npm ci` in the touched package, the data version, and `npm --prefix backend audit --omit=dev --audit-level=high`.

## Local environment pitfalls
- Run `rm -rf frontend/dist` before a local build or `verify:seo-prerender-guard`; the SSR asset reader falls back to the previous `dist` copy and reports stale pages.
- Never run the production build and a Playwright dev-server start at the same time; the second exits 1 on the Monaco asset-sync lock.
- Another `ng serve` may hold port 4200. Run local e2e like the hook does, with `PLAYWRIGHT_PORT=4310 PLAYWRIGHT_REUSE_SERVER=0`.
- The pre-push critical e2e web server (`gen:data` plus `ng serve`, 180 s limit) can time out right after the hook's own build; rerun the push.
- A Mac sleeping on battery makes the hook time out or Karma disconnect with 0 tests; check `pmset -g batt` first.

## Flaky or real
- `header.mobile` has clicked before hydration and timed out (`waiting for element to be visible, enabled and stable`), and WebKit has failed with `Importing a module script failed`; both passed on the same code elsewhere. Rerun once; if it repeats, run the spec with `--repeat-each=5` before treating it as flaky, and record the flake instead of weakening the test.
- Dependabot pull requests fail often for their own reasons (the Angular 22 bump fails `npm ci` with ERESOLVE; backend bumps break Jest). Do not treat them as feature regressions.

## CI environment
- Playwright jobs are pinned to `ubuntu-24.04`: Playwright 1.57 cannot install browsers on ubuntu-26.04, which `ubuntu-latest` became on 2026-10-22. Unpin after a Playwright upgrade.
- UI Regression runs in a pinned Playwright container on linux/amd64; keep the container image and `@playwright/test` version aligned when upgrading browsers.
- `IndexNow` runs after each successful production deployment of the site's Vercel project, `frontendatlas-fe` (the `frontendatlas` CDN and `frontendatlas-be` API deployments are skipped), or by hand with scope `all` for a first run or key rotation. `frontend/scripts/indexnow-submit.mjs` reads the live sitemap and pings `api.indexnow.org` with the URLs whose `lastmod` falls in the last two days; Google does not take part. The key lives in `frontend/src/indexnow/<key>.txt`, which `angular.json` copies to the site root; `test:indexnow` and `e2e/seo.spec.ts` guard that placement.
- Payment rule: no automated test may complete a real checkout. Billing coverage is webhook/lifecycle integration tests, mocked frontend flows and the test-mode backend smoke; the hosted LemonSqueezy checkout stays a manual, test-mode-only dispatch.
- Specs in `frontend/e2e/` that are in neither `test:e2e:critical` nor an Extended suite run nowhere; wire new specs into one of them. Add a Full-stack Smoke flow when the frontend mocks of an endpoint change shape.

## Deep reference
- `docs/references/ui-regression.md`
- `docs/references/trusted-vibe-coding.md`
- `docs/audits/test-quality-audit.md`
- `docs/audits/seo-audit.md`
