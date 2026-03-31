# Trusted Vibe Coding

## Summary
- Local hooks are fast filters, not the source of truth.
- The real trust boundary is: local verification passes, a PR is opened, required remote checks pass, and only then is `main` considered trustworthy.
- Do not use coverage percentages as the trust metric. Prefer high-signal verification of critical paths.

## Critical-Path Test Matrix
| Capability | Minimum trusted verification |
| --- | --- |
| Auth / session | Backend integration tests, frontend service or route coverage, critical E2E |
| Billing / premium gating | Backend integration tests, frontend component or service coverage, critical E2E |
| Progress / XP / streak / dashboard | Backend integration tests, targeted frontend unit coverage |
| Content / CDN / registry / SEO | Script lint, prerender and SEO CI checks |
| Route access / premium locking | Critical E2E |

## Working Agreement
1. Codex makes the change.
2. Codex runs the closest meaningful local checks.
3. Codex reports exactly what was verified, what was not verified, and remaining risk.
4. Changes go through PRs rather than direct pushes to `main`.
5. Required GitHub checks must pass before merge.
6. Only merged code with green required checks is treated as production-trustworthy.

## Required Remote Gates
- `Backend Verify`
- `Frontend Unit Verify`
- `Playwright Critical`
- `SEO Prerender Guard`

## Manual GitHub Settings
- Protect `main`.
- Require pull requests before merge.
- Require the checks above to pass before merge.
- Do not treat local hook success by itself as release-ready proof.
