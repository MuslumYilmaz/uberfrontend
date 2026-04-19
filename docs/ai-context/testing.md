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

## Deep reference
- `docs/references/trusted-vibe-coding.md`
- `docs/audits/test-quality-audit.md`
- `docs/audits/seo-audit.md`
