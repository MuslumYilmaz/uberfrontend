# Release Guardrails

This project uses repo-tracked checks first, then external enforcement after the guardrail PR is green on GitHub.

## Solo Release Flow

1. Work on `dev` or a short-lived feature branch.
2. Open a PR into `main`.
3. Wait for required checks:
   - `Backend Verify`
   - `Frontend Unit Verify`
   - `Playwright Critical`
   - `Full-stack Smoke`
   - `SEO Prerender Guard`
   - `Action Pinning`
   - `Dependency Audit`
   - `Secret Scan`
   - `CodeQL Analyze`
4. Review the diff for generated files, dependency lockfile changes, security allowlist changes, and production env changes.
5. Merge only after the required checks are green or the emergency bypass checklist below is satisfied.
6. Promote production manually from the protected production environment.

## Emergency Bypass Checklist

Use admin bypass only for urgent production recovery.

1. Confirm the issue is production-impacting and cannot wait for the normal PR cycle.
2. Confirm the patch is the smallest reversible change that addresses the incident.
3. Run the closest local checks that fit the incident window.
4. Write down skipped checks and why they were skipped.
5. Merge or deploy with admin bypass.
6. Immediately open a follow-up PR or issue to restore full verification and remove any temporary bypass.

## GitHub Enforcement To Enable After This PR Lands

Create or update a `main` ruleset with:

- Pull request required before merge.
- Required branches must be up to date before merge.
- Force pushes and branch deletion blocked.
- Required checks listed in the solo release flow.
- Admin emergency bypass allowed for `MuslumYilmaz`.
- Default `GITHUB_TOKEN` permissions set to read-only.
- Repository Actions policy set to selected actions with SHA pinning required. Allow at least `actions/*`, `github/codeql-action/*`, and `gitleaks/gitleaks-action/*`.

Protect every `Production*` GitHub environment with:

- Required reviewer: `MuslumYilmaz`.
- Deployment branch restriction: `main` only.
- Admin bypass allowed for emergency recovery.

## Vercel Production Gate

Treat production deployment protection as incomplete until Vercel production auto-deploy is disabled or gated behind manual approval.

If Vercel still auto-deploys from `main`, then branch protection is the effective production gate. GitHub environment approval alone will not stop Vercel from deploying a merged commit.

## Security Guardrails

- Backend Sentry is disabled unless `SENTRY_DSN` is configured.
- Backend security headers are always set; HSTS is enabled in production or with `SECURITY_HSTS_ENABLED=true`.
- Frontend and CDN Vercel configs set HSTS, `nosniff`, referrer policy, frame protection, permissions policy, minimal enforced CSP, and a stricter report-only CSP.
- Gitleaks scans repository history in CI.
- If the repository moves under a GitHub organization, add `GITLEAKS_LICENSE` as a repository or organization secret.
- CodeQL scans JavaScript/TypeScript in CI.
- npm production dependency audits run in CI.

## Known Residual Risk

The frontend currently has Angular/PrimeNG high-severity npm audit findings whose automated fix requires a major Angular/PrimeNG migration and Node 20+ CI/runtime work. They are tracked in `docs/security/npm-audit-allowlist.json` and expire on `2026-09-30`.

Do not extend that allowlist without creating a dated migration issue. Critical findings are not allowlisted.

## CSP Promotion Checklist

Keep the strict CSP in report-only mode until these flows show no critical blocked resources:

- Playwright critical suite.
- Visual and accessibility smoke checks.
- Monaco/editor preview flows.
- Google Analytics initialization.
- Sentry browser event delivery.
- CDN question and sandbox assets.
- Billing navigation for LemonSqueezy and Gumroad.

Promote stricter CSP to enforcement only after reviewing reports and updating the allowlist of required origins.
