# Coding Item Checks

Load this before adding a coding or debug item, before changing an item's starter, solution, tests or checks, and when reviewing one. It lists what an item must prove before it ships and how to prove it, and it records the runner limits that earlier items ran into. Each rule has an ID, so a review can cite it (for example "A3 fails: a `Map`-based solution is rejected").

## Rules at a glance
- **A. The checks judge solutions correctly**
  - A1 The reference solution, and every approach the page shows, passes every check.
  - A2 The starter fails the checks. A check the starter passes measures nothing.
  - A3 A correct solution that differs from ours passes. Examples: another algorithm, other markup, extra classes or inline styles, another hook.
  - A4 Each plausible wrong solution fails, and only the check written for its mistake.
  - A5 Hard-coding the expected values cannot pass. Test each rule with at least two different inputs.
- **B. The page states the contract**
  - B1 Blind solvers who only see the page and the starter can pass. A correct-looking solution that fails means the page leaves out something the checks read.
  - B2 The page does not give the answer away. No text (implementation notes, hints, check names) names the fix.
  - B3 Every example on the page gives exactly the shown output with the reference solution.
  - B4 Every edge case the page mentions is tested, and every tested edge case is on the page.
  - B5 `difficulty` and `estimatedMinutes` match what blind solvers needed.
- **C. Each check earns its place**
  - C1 Every check can fail. Drop a check the given code already satisfies.
  - C2 Checks sample an intermediate state, not only the final one.
  - C3 Checks are deterministic. Do not rely on unmocked time, network or randomness. Repeat the run to find flakes.
  - C4 Check names say what they measure, hint needles match the check names, and failure-explain rules exist.
  - C5 The TypeScript side is clean. The TS solution type-checks, and the starter shows no error markers in the editor.
- **D.** Runner limits are listed under "Runner limits".
- **E. The surface the visitor sees**
  - E1 The starter runs: preview not blank, no console errors, a `TODO` marker.
  - E2 The solution's preview does not overflow at 375 and 320 px.
  - E3 A premium item stays premium. It is `noindex` and carries no solution code, and the free neighbors' footer still works.
- **F.** Generated files and pipeline steps are listed under "Pipeline".
- **G.** `npm run review:coding-item -- <tech>/<id>` checks A–C and writes the review record that the pre-push gate requires; see "Review record and push gate".

## When to load
- The task touches `cdn/questions/<tech>/coding.json` or `debug.json`, `cdn/sb/**`, `cdn/questions/pressure-modes/**`, coding negative fixtures or framework wrong-solution fixtures.
- The prompt asks for a new coding question, a review of one, or whether its checks are fair.

## When not to load
- Trivia, system design or incident content. Use `question-content.md` or `trivia-review.md` for those.
- Changes to the check runner itself that add no item. Still read "Runner limits".

## Non-negotiables
- Do not ship an item while any rule in A fails. For `full` coverage (more than one check, or `checkCoverage: 'full'`), a passing run marks the task solved and awards progress. A wrong solution that passes therefore earns a false solve.
- Every wrong solution you find that passes becomes a permanent fixture (A4). Every correct solution that fails is fixed in the checks, never in the solution.
- Changing a shipped item's starter or tests changes its content version. `question-content.md` covers drafts and identity.
- Before committing, load `testing.md` as well. The hooks do not run the framework catalog suite.

## How to verify, per tech
Run from `frontend/` unless noted.

### JavaScript (`cdn/questions/javascript/coding.json`)
Fields: `starterCode`, `starterCodeTs`, `tests`, `testsTs` and `solutionBlock.approaches[].codeJs|codeTs`. The test code is visible to visitors on the Test cases tab, so blind solvers get it too.
- **A1:** `node scripts/catalog-solution-execution.test.mjs` runs `approaches[0]` in JS and TS against `tests` and `testsTs`. It does not run the other approaches (35 items have more than one). The review command runs every approach of the item it reviews. For a guard that CI also runs, add the others as `// Right:` fixtures.
- **A2:** the same script checks starters only for single-file debug tasks. For a coding task, run its starter by hand, or add it as a `// Wrong:` fixture whose `// Fails:` lines name every test.
- **A3, A4:** add fixtures under `scripts/coding-negative-fixtures/<id>/`.
  - A right solution starts with `// Right: <why>` and must pass both suites.
  - A wrong solution starts with `// Wrong: <why>`, followed by one `// Fails: <JS test name>` line per test it must fail. It must also fail some TS test.
  - Run `node scripts/coding-negative-fixtures.test.mjs`.
- **C5:** transpiling does not type-check, and neither script does. Type-check the TS solution against `testsTs` in strict mode, mapping the relative import to the solution file.
- **Test design that closed real gaps:**
  - Test precedence rules with different timestamps and both call orders.
  - Check "stores nothing" with valid calls before and after the rejected one.
  - Detect input mutation by walking `Reflect.ownKeys`, and include one unsorted fixture list so an in-place sort shows up.
  - `toThrow(Type)` matches by `instanceof` or by name.

### React, Angular, Vue (`frameworkTests`)
The starter is `sdk.asset` and the solution is `solutionAsset`. Both point into `cdn/sb/<tech>/`. Optional assets are `pressureModeAsset` and `decisionGraphAsset`.
- **A1:** `rm -rf dist && npm run build`, then `PLAYWRIGHT_SSR=1 PLAYWRIGHT_WEB_SERVER=1 PLAYWRIGHT_REUSE_SERVER=0 PLAYWRIGHT_PORT=4310 npx playwright test e2e/framework-catalog-solutions.prod.spec.ts -g "<id>"`. It expects N/N in the built app. CI runs the whole set as Playwright Framework Catalog, which no hook runs.
- **A2, A4:** add the item to `FULLY_CHECKED` in `e2e/framework-checks-negative.prod.spec.ts`, which makes the starter fail. Put wrong solutions in `e2e/framework-wrong-solutions/`, each with the check names it must fail.
  - A fixture that loads a revoked blob URL fails on the console-error guard. Keep such a variant out of the prod spec.
- **A3:** the framework suites have no permanent slot for right alternatives. Keep blind-solver solutions that pass as evidence. A throwaway Karma spec that feeds sources through `makeReactPreviewHtml` and `OpaqueDomCheckRunner` gives a fast loop for `variant-ok-*` and `variant-*` files. Delete it before committing, then rerun `gen-data-version.mjs`, because the hash covers `src/`.
- **Contract visibility:** the task page lists the selectors and locators the checks use (`checkSelectors` in `framework-check-coverage.util.ts`). Exact texts, formats, data attributes and state class names must still appear in the requirements (B1).
- **Coverage:** one check, or `checkCoverage: 'smoke'`, means the visitor marks the task solved after comparing with the requirements. Use `smoke` only when the checks cover the core flow alone.

### HTML, CSS (`web`, `frameworkTests`)
The starter is `web.starterHtml` and `web.starterCss`. The solution is `webSolutionHtml` and `webSolutionCss`.
- **A1, A2:** `e2e/web-catalog-checks.prod.spec.ts`, part of `npm run test:e2e:framework-catalog:prod`, requires the solution to pass every check and the starter to fail.
- Checks can set a `viewport` so media queries and grid tracks lay out. Without one, the frame is 1×1 px. `expectStyle` takes bounds such as `atMost`.

## Blind solve and blind review (A3, A4, B1, B2)
- **Solvers.** Write the page text exactly as the app renders it: summary, requirements, expected behavior, implementation notes, check names and the listed selectors. Add the starter, and for JS the tests.
  - Give it to 3–4 context-free solvers from at least two models.
  - Run every output through the A1 runner.
  - A correct-looking failure is a B1 finding.
- **Reviewer.** Give one context-free reviewer the page, starter, solution, checks JSON and the runner semantics from "Runner limits". Ask for four lists:
  - bugs in our solution;
  - checks a correct solution could fail;
  - wrong solutions that pass;
  - text that gives the answer away.
- **Second review.** A second review that reads the whole visitor surface (pressure texts, walkthrough, decision graph, hints rendered as text) finds false claims that a code-only review misses.
- **Follow-up.** For each "wrong but passes", write the variant and prove it fails only its own check. Then keep it as an A4 fixture.
- **After changing given code,** graft each earlier blind solution's own part onto the new head and rerun it. This shows whether stricter checks became over-strict.

## Runner limits (framework and web checks)
Source: `src/app/features/coding/coding-detail/opaque-dom-check-runner.ts`.
- **Isolation.** Each check runs in a fresh sandboxed iframe with a 10 s timeout. The frame sits off screen at 1×1 px unless the check sets a `viewport`.
- **Start time.** Steps start at the first commit (React: a sentinel's `componentDidMount`), before passive effects run.
  - Anything mounted in an effect needs a `waitForCount` first.
  - Given code that resets state in a mount effect wipes what the first step typed. Use the set-state-during-render pattern instead.
- **No `requestAnimationFrame`** guarantee in the frame. Ask for timers.
- **Scrolling.** A scroll box needs a CSS `min-width`, or it has no scrollable overflow in a 1 px frame. The `scroll` step sets `top`/`left` and dispatches `scroll` itself.
- **Focus.** The frame has no system focus, so `element.focus()` fires no focus events.
  - Use the `focus` step. Put a `focus` before the `click` on a trigger, so "restore the previously focused element" solutions are not failed.
  - A `key` step without a selector presses on `document.activeElement`.
  - `key` takes `shift: true`. Default actions (Tab moving focus, Enter clicking a button or `a[href]`) need `defaultAction: true`.
- **Step semantics.**
  - `setValue` uses the native value setter, fires `input` then `change`, and waits 50 ms. `click` also waits 50 ms. `wait` reads `durationMs`.
  - `expectDisabled` with `disabled: false` means "expect enabled".
  - Use `expectAttribute` with `match: 'contains'` for one declaration of an inline `style`. An exact match failed a correct solution that added its own styles.
  - `expectNoText` throws when the element is missing. To check that a stale value is gone, put the value in a data attribute and assert `expectCount '<sel>[data-x="old"]' 0`.
  - The accessible name ignores `img alt` inside a button. Check the `alt` attribute instead.
  - `expectNoPreviewTimers` counts only timers created after the check starts. Switch to a new scenario first, then `unmountPreview`.
- **Given-code traps.**
  - A given hook built on `useSyncExternalStore` breaks correct solutions that set state during render. Give stores as `useState` plus a subscription in an effect.
  - Effects run children first. An App effect that clears what a child's effect set uses a stale closure; name the symptom on the page if a check covers it.
  - `<input type="number" max>` blocks submitting out-of-range values, so a clamping task must not set `max`.
- **Pressure mode** opens only with at most 6 rounds and at most 6 checks in total (`pressure-mode.service.ts`). The catalog list has no cap, so merge the last rounds. `PressureFlowContract.checkCounts` is cumulative per round.
- **Editor.** It runs TypeScript 5.4.5 (`monaco-editor` 0.52.2), not the repo's 5.9.3. React files see only the stub in `src/app/monaco-editor.component.ts`, so a starter can compile in the repo and still show markers in the editor.
- **Runner edits.** Runner code runs inside the frame as text, and syntax the production build turns into a module helper (object spread) breaks there while Karma passes. Prove runner edits with a prod build and Playwright.

## Pipeline (generated files and side effects)
- **JSON edits.**
  - `react/coding.json` is byte-exact `JSON.stringify(list, null, 2) + '\n'`.
  - `javascript/coding.json` is not: append the entry as text before the closing `]`.
  - Either way, `git diff` must show only the new entry.
- **Sandbox CSS.** Run `node scripts/format-framework-css.mjs --write`. It formats sandbox CSS and mirrors `cdn/sb` into `frontend/src/assets/sb`.
  - `node scripts/framework-content-regressions.test.mjs` pins the corpus counts (they move with each new sandbox file) and the starter marker, `/\b(TODO|FIXME|BUG)\b|Implement in the solution|Not implemented|throw new Error\(/i`. A `TASK 1:` comment fails it; write `// TODO Task 1:`.
  - Some React decision graphs must mirror the solution's `App.tsx` exactly.
- **Hints and explain rules.** `src/app/core/utils/failure-explain-rules.ts` needs a specific and a default rule per item.
  - Needles match check names as case-insensitive substrings, so a renamed check silently disables its hint.
  - Gate specific rules on progress, so the starter's all-fail run shows the default.
  - Validate with `node scripts/validate-coding-assist-sync.mjs --staged-files <file listing the paths>`.
- **Registries.** Run `npm run lint:questions` (regenerates registries and metadata), then `npm run lint:questions:check`. If `validate-question-identities` reports a new id, run `node scripts/update-question-id-manifest.mjs`. Then `node scripts/gen-data-version.mjs`, and commit `cdn/data-version.json`.
- **Premium.** `premiumPreview` has exactly `summary`, `learningOutcomes` and `unlockDescription`.
  - A premium neighbor turns the free page's footer "Next" into a button. Check `FOOTER_PATHS` in `e2e/seo-question-navigation.spec.ts`, or run `npm run test:e2e:extended:prod`.
- **Companies and sources.**
  - A `companies` tag adds plan cards and can displace old ones. Run `node scripts/gen-company-plan-data.mjs` and read `git diff cdn/questions/company-plan-data.json`. A source cited on an unrelated stage needs `reportRounds` in `src/app/shared/company-previews/company-plan-rounds.ts`.
  - `sources[]` follows `scripts/question-sources-lib.mjs`.
- **Backend.** `backend/services/gamification/question-catalog.js` reads `cdn/questions/`. Run the backend interview content checks listed in `testing.md` for any `coding.json` or `cdn/sb/` change.

## Review record and push gate
Built 2026-11-25. The pieces:
- `scripts/review-coding-item.mjs`, run as `npm run review:coding-item`;
- `scripts/coding-review-lib.mjs`, which holds the hashes and record rules and is tested by `coding-review-lib.test.mjs`;
- `scripts/check-coding-review-records.mjs`, the gate;
- `e2e/coding-review-candidates.prod.spec.ts`, which skips unless the command sets it up.

- **Model calls happen only in the review command.** No hook and no CI job calls a model. A commit, push or CI run that fails for another reason and is retried never spends model usage.
- **Command:** `npm run review:coding-item -- <tech>/<id>`, run from `frontend/`. Options:
  - `--solver-models` (default `sonnet,sonnet,haiku`) and `--reviewer-model` (default `sonnet`; the user's usage limit is scarce, so do not raise it without asking);
  - `--new-solvers`, `--force` and `--build`;
  - `--skip "<reason>"` and `--accept <rules> "<reason>"`, which call no model.

  It then:
  - runs every reference approach (JS: each `codeJs` and `codeTs`) and the starter through the real checks (A1, A2);
  - asks the blind solvers for code and runs it (B1);
  - asks one reviewer, giving it this file's "Rules at a glance" (plus "Runner limits" for framework and web items), the page, the starter, the solution, the checks and every result so far;
  - runs the reviewer's A3 and A4 variants through the checks;
  - writes the record, and keeps solver code, variants, raw model output and `report.md` under `reports/coding-reviews/<tech>/<id>/`. `reports/` is excluded from git.
- **How each call stays blind.** Every call is `claude -p` from a fresh temp folder, with no tools, project settings only, no MCP and no session, and only `HOME`, `USER`, `LOGNAME`, `SHELL`, `PATH`, `TMPDIR`, `LANG` and `TERM` in its environment. `CODING_REVIEW_MODEL_CMD` swaps the executable for a stub, so tests cost no model usage.
- **Where candidates run.**
  - JavaScript runs one child process per candidate, with the sandbox's matchers and fake timers (`js-task-test-lib.mjs`) and a 120 s limit.
  - Framework and HTML/CSS candidates run in the production build through the candidates spec, on port 4310 (`PLAYWRIGHT_PORT` overrides it). The official solution loads through the page's "Load into editor".
  - The command first compares the built catalog entry and the starter and solution assets with `cdn/`. On a difference it stops before any model call. `--build` runs `rm -rf dist && npm run build` instead.
  - A React item took about 25 s on a fresh build.
- **Saving model calls.**
  - A record that already exists for the same `hash` ends the run with no call; `--force` reviews again. When that record is `needs-attention` or `fail`, the run stops and asks for a change or an `--accept`, since the same content would get the same answer.
  - `--skip "<reason>"` writes a record without calling a model, for edits a solver would not notice, such as a typo.
  - While `pageHash` is unchanged, the stored blind solutions and earlier variants are rerun instead of asking again. A fix to the checks, or a rerun after the reviewer hit a usage limit, costs one reviewer call.
- **Statuses.**
  - `fail` comes only from the code:
    - A1, when a reference fails a check;
    - A2, when the starter passes every check.
  - `review` marks what a person should read in `report.md`:
    - a starter that passes some checks;
    - a blind solver that failed;
    - a reviewer concern;
    - a correct variant that fails;
    - a wrong variant that passes everything.
  - `review` blocks the push until a person either fixes the item (new content, then review again) or accepts the finding. Accept with `--accept A4,B2 "<reason>"`: it writes the reason into the record's `accepted` map and calls no model. Only `review` findings can be accepted, never a `fail`.
  - Accepted reasons are public, so they must hold no solution code.
  - Acceptances belong to the content hash. A `--force` rerun of the same content keeps them; changed content starts clean.
  - `not-run` marks what could not run. C5 is always `not-run`, because type-checking is not automated.
  - The record's `result`:
    - `fail` when any rule failed;
    - `incomplete` when A1 or A2 did not run, no solver answered, or the reviewer gave no readable verdict;
    - `needs-attention` while any `review` finding is not accepted;
    - otherwise `pass`.
  - Multi-file JavaScript debug tasks are not supported; use `debug-bundle-regressions.test.mjs`.
- **Record:** `content-reviews/coding/<tech>/<id>.json`, committed. The trivia lints read only `content-reviews/trivia/`, so this folder does not affect them. Fields:
  - `id`, `tech`, `kind`;
  - `hashVersion`, `hash`, `pageHash`, `checksHash`;
  - `reviewedAt`, `mode` (`full` or `skip`), `skipReason`, `result` (`pass`, `needs-attention`, `fail`, `incomplete` or `skipped`);
  - `rules`, mapping each rule ID to its status, and `accepted`, mapping accepted rule IDs to their reasons;
  - `solvers` and `variants` counts with `passedAllChecks`, and `models`.
  - The record holds no solution code, no solver code and no finding text, because the repo is public and some items are premium.
- **Hashes:** sha256 over canonical JSON with sorted keys.
  - `pageHash` covers what the page says: `title`, `description`, and the starter (`starterCode`, `starterCodeTs`, the files of `sdk.asset`, `web.starterHtml`, `web.starterCss`).
  - `checksHash` covers what the solution is judged by: `tests`, `testsTs`, `frameworkTests`, `checkCoverage`, each approach's `codeJs`/`codeTs`, a debug task's `solution`, the files of `solutionAsset`, `webSolutionHtml`, `webSolutionCss` and the `pressureModeAsset` content.
  - `hash` combines the two.
  - Left out on purpose, so editing them needs no new review: `tags`, `companies`, `sources`, `seo`, `updatedAt`, `importance`, `difficulty`, `estimatedMinutes`, `access`, `premiumPreview`, the `solutionBlock` prose, decision graphs and hints.
  - Bump `HASH_VERSION` in the lib whenever this field list changes.
- **Push gate:** runs in `.githooks/pre-push`, git only, in about 0.3 s.
  - It lists the coding and debug items whose `hash` differs between the remote base and the pushed head, new items included. A change under `cdn/sb/` counts for every item whose assets use that file.
  - Each listed item needs a record in the pushed head whose `hash` equals the head's, and either a `mode` of `skip` or a `result` of `pass`. A passing record must also have no `fail` rule and no unaccepted `review` rule; the gate reads the rules too, so editing `result` by hand does not get past it. Otherwise the push stops and prints the command to run.
  - Items the push does not change are not checked, so existing items without a record block nothing. Run it by hand with `node scripts/check-coding-review-records.mjs --base <rev> --head <rev>`.
  - Pre-commit does not check records, so work-in-progress commits stay free. CI does not check them either.

## Reporting
List each rule ID as passed, failed or not run, with the command or the evidence: fixture paths, blind-solver pass counts, reviewer findings and what became of them. A skipped rule is reported as skipped, never as passed. The command's `report.md` holds this list, and the record is its committed summary. Every `review` status still needs a person's verdict in the final report.
