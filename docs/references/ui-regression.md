# UI regression

`.github/workflows/ui-regression.yml` replaces the Angular 17 comparison with
the current application's reviewed screenshots. It builds production output
once, copies the untouched inline SSR output, then optimizes the candidate.
Both the screenshot suite and three-browser SSR/control suite use that build.

## Coverage

- `frontend/e2e/ui-visual.spec.ts`: 90 scenarios / 138 screenshots at widths
  360, 390, 768, 834, 1366 and 1440. Covers public routes, authenticated
  dashboard/profile, select overlays and their empty state, dialogs and the
  Interview lifecycle. It also asserts no horizontal page overflow.
- `frontend/playwright.ssr-styles.config.ts`: Chromium, Firefox and WebKit
  compare optimized CSS against untouched inline SSR and check keyboard/focus
  interactions. The inline copy is a transformation reference, not a previous
  version of the UI.
- Screenshot assertions cover the visible 900px viewport. They do not claim
  to cover every lower-page section, loading/error state or premium flow;
  existing unit, critical E2E and full-stack checks remain necessary.

## Reviewing an intentional UI change

Normal PR runs use `--update-snapshots=none`. Missing references and unexpected
differences fail. CI never silently accepts new screenshots.

1. Inspect `ui-visual-evidence` in the failed run: the Playwright report includes
   expected, actual and diff images.
2. For an intended change, manually run the **UI Regression** workflow on the
   feature branch with **update_baselines** enabled. It captures the branch's
   current UI using the same Linux browser environment as PR verification.
3. Download `ui-visual-linux-baselines`, review the changed PNGs, and copy them
   into `frontend/e2e/ui-visual.spec.ts-snapshots/`.
4. Commit the intended screenshot changes alongside the UI change. The next
   PR run compares without updating references. The workflow does not commit
   or push on your behalf.

If a test is renamed or removed, remove its obsolete reference images in the
same change. Screenshot review is still required; refreshing everything is not
evidence that an unintended layout change is acceptable.

## Local verification

From `frontend/`:

```sh
npm run build:ui-test
npm run test:e2e:ui
PLAYWRIGHT_ENABLE_FIREFOX=1 PLAYWRIGHT_ENABLE_WEBKIT=1 npx playwright test --config=playwright.ssr-styles.config.ts --project=chromium --project=firefox --project=webkit --workers=2
```

`npm run test:e2e:ui:update` explicitly updates screenshots for the current OS.
Darwin references support local Mac runs; CI uses the Linux references.
Linux references must be generated in the workflow's pinned Playwright
container on **linux/amd64**, with the lockfile's Playwright version. Keep the
container image and `@playwright/test` version aligned when upgrading browsers.
Do not rename Darwin images to Linux: fonts and browser rendering differ.
If the bundled WebKit requires a newer host OS, run its checks in the pinned
Linux container; keep the CI browser coverage enabled.

## Change scope and required checks

`scripts/ci-change-scope.mjs` compares the PR base with the tested merge commit.
UI checks run for frontend, CDN, content-draft and shared CI/tooling changes.
Interview matrices additionally run for backend changes. Shared frontend
dependencies stay deliberately broad so auth, routing, editors and global
styles cannot bypass coverage. Unrelated documentation skips these suites.

Manual UI runs and manual/main-push Interview runs execute the full scope.
The existing nightly perf schedule is unchanged. New PR runs cancel older
runs of the same workflow/PR.

Keep **UI Regression** and **Interview Cross-browser Gate** as the stable
required checks. The Interview gate distinguishes a deliberate scope skip
from a failed/cancelled matrix or a failed scope detector. The UI job likewise
fails when scope detection fails. Configure repository branch rules separately
when adopting a new required check; changing workflow YAML does not update
GitHub rulesets.
