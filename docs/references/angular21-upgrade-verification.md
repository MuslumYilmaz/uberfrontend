# Angular 21 / PrimeNG 21 verification

## Reference

The immutable application reference is `68d4939b049e266c1f68efc6b0cf0b94a8854274`.
The upgrade must preserve its design and public application contracts.

The visual suite covers 360, 390, 768, 834, 1366 and 1440 px widths. It uses
synthetic API responses and never requires production credentials or a database.
It includes public and authenticated pages, open and empty select panels,
profile and bug-report dialogs, and the interview lifecycle. The existing
768 px minimum for starting an interview remains covered; mobile recovery is
captured after starting at a supported width. Timestamps and editor cursors are
the only masked dynamic UI.

macOS reference images were captured before dependency changes. CI captures
Linux references from the immutable Angular 17 application using the same test
scenarios and Playwright version as the candidate, then compares the candidate
without `--update-snapshots`. The two runs share the same runner and font setup.
Do not update candidate snapshots to hide migration differences.

## Angular 17 baseline

- Production build and 615 prerender routes: passed.
- Visual comparisons without updating snapshots: 90 passed.
- Initial bytes: 1,170,168; modulepreload bytes: 771,680 (45 modules).
- Coding HTML bytes: 575,674; total prerender HTML bytes: 103,412,579.
- These four performance metrics already exceed warning thresholds. Thresholds
  must remain unchanged and migration deltas must be reported.

## Commands

- `cd frontend && npm run test:e2e:upgrade-visual`
- `cd frontend && npm run verify:unit-and-content`
- `cd frontend && npm run verify:seo-prerender-guard`
- `cd frontend && npm run verify:e2e-critical`
- `cd frontend && npm run lint:design-system:strict`
- `cd backend && npm run verify:ci`

The production interview harness must use its isolated database and non-conflicting
ports. The machine's `frontendatlas` database is not test data.

Final migration results and remaining limitations will be recorded below after
the corresponding checks finish.
