# Frontend interview bank v1 — candidate audit

- Audit date: 2026-07-22
- Bank: `frontend-interview-gold-bank`
- Version: `1.0.0`
- Status: `candidate`
- Bank content hash: `cb3ae89566f78347493c588f0690a162dc83a2a13327a10ab9735d12db8d7f8e`

## Verdict

The 60-item English MCQ bank satisfies the approved structural, technical,
editorial, blind-review, provenance, and deterministic-generation gates for a
release candidate. It is deliberately **not** editorial gold: `finalApproval`
is null, all reviewer identities are labelled as AI, and the gold-only lint
must continue to reject the bank until the user approves this exact content
hash.

This delivery does not wire the bank into the frontend, backend, or CDN. It
does not add UI, timers, coding exercises, interview scoring, or hire labels.

## Corpus census

| Dimension | Result |
| --- | --- |
| Questions | 60 |
| Estimated time if all are answered | 7,350 seconds (122.5 minutes) |
| Technology | 12 JavaScript/browser, 6 HTML/accessibility, 6 CSS/layout, 12 React, 12 Angular, 12 Vue |
| Level | 20 Junior, 20 Mid, 20 Senior |
| Format | 24 conceptual, 6 code output, 30 production scenario |
| Difficulty band | 15 foundation, 30 core, 15 stretch |
| Correct authoring position | 20 first, 20 second, 20 third |
| Competencies | 60 distinct within their technology groups |
| Options | 180 stable opaque option IDs; three per item |
| Review waivers | 0 |

The per-level format distribution is exact:

| Level | Conceptual | Code output | Production | Total |
| --- | ---: | ---: | ---: | ---: |
| Junior | 11 | 2 | 7 | 20 |
| Mid | 8 | 2 | 10 | 20 |
| Senior | 5 | 2 | 13 | 20 |

Each level has five foundation, ten core, and five stretch items. Each level
also contains four JavaScript/browser, two HTML/accessibility, two CSS/layout,
and four questions for each framework. A future level-plus-framework selection
therefore has eight core-web and four selected-framework candidates, from which
an interview can draw three plus two questions.

## Review evidence

Every current item has a passed technical, blind, and editorial record bound to
both its revision and its SHA-256 content hash. Changing public or private
substantive content invalidates those records. The consolidated evidence is in
[`bank-v1.reviews.json`](../../content-drafts/interview-mcq/reviews/bank-v1.reviews.json).

- Technical review independently confirms the keyed answer, rejects each of
  the two distractors, and verifies the exact official-source union cited by
  the answer proof.
- Blind review was performed from answer-free, level-free, band-free packets.
  It selected the keyed option for all 60 items with no alternative correct
  options or retained clue flags. All 60 independently assessed levels match
  the authored levels.
- Editorial review confirms original wording, one-best-answer constraints,
  parallel option construction, realistic framing, and corpus distinction.
- Technical, editorial, and blind roles use separate AI reviewer identities;
  no record represents AI work as human review.

Blind reviewers assigned a different relative difficulty band to 28 items.
Those disagreements are retained as warnings, not erased or presented as
empirical calibration. Difficulty bands still meet the approved 5/10/5 quota
within each level, but they remain editorial hypotheses until target-level user
data exists.

## Answer and distractor quality gates

The candidate passes the following no-waiver checks:

- exactly one keyed option and exactly two distractors per item;
- answer resolution by opaque option ID across all six option permutations;
- correct-option visible length within 15% of the distractor median;
- distinct misconception tags and a separate plausibility and falsifying
  constraint for every distractor;
- no all/none-of-the-above construction, prohibited unnecessary absolute,
  correct-only three-word stem echo, option containment, or blocking option
  similarity;
- full rationale coverage, one correct rationale, and an explicit answer proof;
- corpus-level exact and near-duplicate checks across prompts and options;
- balanced source-order answer positions, followed by runtime-safe shuffling.

Several items were revised or replaced during corpus review rather than passed
with weaker distractors. The current revision distribution is 22 revision-1,
16 revision-2, 14 revision-3, 6 revision-4, 1 revision-6, and 1 revision-8
items. Notable adjudications included removing answer-length and stem clues,
tightening lifecycle ownership constraints, separating superficially similar
framework identity questions, and reclassifying items whose blind level did not
fit the declared cohort. The final bank has zero blind level disagreement.

## Code-output execution

All six output questions are JavaScript/browser items, with exactly two at each
level. The validator executes their original snippets in a real headless
Chromium page, blocks network access, captures ordered console output, fails on
page errors or unhandled rejections, and enforces 1,500 ms and 65,536-byte
limits.

The verified items are:

- `int-js-task-order-jr-v1`
- `int-js-event-target-currenttarget-jr-v1`
- `int-js-nested-microtask-mid-v1`
- `int-js-finally-recovery-mid-v1`
- `int-js-async-return-rejection-sr-v1`
- `int-js-finally-throws-sr-v1`

All six passed with exact ordered output. Validator tests also exercise timeout,
runtime-error, unhandled-rejection, output-overflow, network-blocking, and
forbidden dynamic-code/filesystem scenarios.

## Sources, originality, and copyright

The 60 items contain 83 official technical-verification source entries covering
80 answer-proof claims. Every entry uses HTTPS, includes a retrieval date and a
version or commit, records the documentation license, and sets
`copiedText: false`. Prompts, code, and options are recorded as original.

| Official host | Entries | Recorded version basis | License |
| --- | ---: | --- | --- |
| `developer.mozilla.org` | 40 | pinned `mdn-content` commit | CC BY-SA 2.5 |
| `react.dev` | 16 | React 19.2 documentation | CC BY 4.0 |
| `angular.dev` | 8 | Angular v22.0.7 documentation build | CC BY 4.0 |
| `v17.angular.io` | 5 | archived Angular 17 documentation | CC BY 4.0 |
| `vuejs.org` | 14 | Vue 3.5/3.5.34 documentation | CC BY 4.0 |

There are 41 links to related local catalog content. They are comparators only,
not provenance and not copied question material. The quality checklist is based
on the NBME one-best-answer method without copying NBME item wording. No
unlicensed question bank is used as question, code, or option text.

## Six-wave trace

Each wave contains two JavaScript/browser, one HTML/accessibility, one CSS/layout,
two React, two Angular, and two Vue items.

- Wave 0: `int-js-nested-microtask-mid-v1`, `int-js-nullish-default-jr-v1`,
  `int-html-native-button-jr-v1`, `int-css-box-sizing-jr-v1`,
  `int-react-stale-search-sr-v1`, `int-react-derived-filter-mid-v1`,
  `int-angular-onpush-reference-sr-v1`,
  `int-angular-zoneless-view-notification-sr-v1`,
  `int-vue-computed-watch-mid-v1`, `int-vue-keepalive-active-socket-sr-v1`.
- Wave 1: `int-js-observer-lifecycle-mid-v1`,
  `int-js-async-return-rejection-sr-v1`, `int-html-dialog-focus-contract-sr-v1`,
  `int-css-flex-min-width-jr-v1`, `int-react-stable-list-key-jr-v1`,
  `int-react-profile-stable-props-sr-v1`, `int-angular-tosignal-lifetime-mid-v1`,
  `int-angular-viewchild-chart-lifecycle-mid-v1`,
  `int-vue-prop-event-ownership-jr-v1`,
  `int-vue-multiroot-fallthrough-attrs-jr-v1`.
- Wave 2: `int-js-event-target-currenttarget-jr-v1`,
  `int-js-listener-cleanup-mid-v1`, `int-html-defer-order-mid-v1`,
  `int-css-image-intrinsic-ratio-sr-v1`, `int-react-ssr-multiroot-useid-sr-v1`,
  `int-react-lift-shared-state-jr-v1`, `int-angular-reactive-form-guard-jr-v1`,
  `int-angular-switchmap-search-mid-v1`, `int-vue-custom-input-model-jr-v1`,
  `int-vue-stable-row-props-sr-v1`.
- Wave 3: `int-js-finally-recovery-mid-v1`, `int-js-dataset-boolean-jr-v1`,
  `int-html-label-submit-jr-v1`, `int-css-stacking-context-mid-v1`,
  `int-react-controlled-input-jr-v1`, `int-react-transition-input-priority-sr-v1`,
  `int-angular-binding-direction-jr-v1`,
  `int-angular-hydration-dom-mismatch-sr-v1`,
  `int-vue-composable-lifecycle-mid-v1`, `int-vue-pinia-request-scope-sr-v1`.
- Wave 4: `int-js-abort-ownership-sr-v1`, `int-js-task-order-jr-v1`,
  `int-html-valid-navigation-ssr-sr-v1`, `int-css-responsive-grid-overflow-mid-v1`,
  `int-react-effect-connection-cleanup-mid-v1`,
  `int-react-immutable-object-state-jr-v1`, `int-angular-async-pipe-mid-v1`,
  `int-angular-provider-scope-jr-v1`, `int-vue-prop-watch-getter-mid-v1`,
  `int-vue-timezone-hydration-sr-v1`.
- Wave 5: `int-js-finally-throws-sr-v1`, `int-js-worker-long-task-sr-v1`,
  `int-html-icon-button-name-mid-v1`,
  `int-css-user-preferences-containment-sr-v1`,
  `int-react-split-hot-context-mid-v1`, `int-react-functional-queue-mid-v1`,
  `int-angular-output-nonbubbling-jr-v1`,
  `int-angular-ssr-platform-service-sr-v1`, `int-vue-ref-primitive-jr-v1`,
  `int-vue-watcher-abort-cleanup-mid-v1`.

The 30-item checkpoint after Waves 0–2 checked quota trajectory, prompt and
option repetition, answer-position clues, source coverage, and level fit. The
60-item audit repeated those checks globally and added framework-pair semantic
comparison. Findings were resolved by revision, replacement, or
reclassification; no quality waiver was used.

## Projection and lifecycle controls

The authoring records keep `public` and `private` sections together outside the
runtime. A deterministic allowlist generator produces:

- [`frontend-interview-bank-v1.public.json`](../../content-drafts/interview-mcq/generated/frontend-interview-bank-v1.public.json),
  which contains no answer, rationale, proof, source, remediation, review, or
  calibration field;
- [`frontend-interview-bank-v1.private.json`](../../content-drafts/interview-mcq/generated/frontend-interview-bank-v1.private.json),
  which contains answers and review evidence and must remain server-only if the
  feature is later integrated;
- [`frontend-interview-bank-v1.release.json`](../../content-drafts/interview-mcq/generated/frontend-interview-bank-v1.release.json),
  which binds all item hashes and both artifact hashes.

The generated public artifact SHA-256 is
`2b465543f5af4eeb7ff5c74ec386c657f8e6e320936b8be22740c200a0aca01a`; the
private artifact SHA-256 is
`25ebcef3316761b9c56b34e6185631369e448cb3908aa195c7387e347030e797`.

The original five-question public/private v1 files remain pinned regression
fixtures. Their migrated v2 descendants are included in the 60-item corpus,
while fixture bytes and the existing frontend/backend APIs remain unchanged.

## Verification record

The following checks passed on 2026-07-22:

- `npm run lint:interview-bank` — 60 candidate items and six real Chromium runs;
- `npm run generate:interview-bank` followed by
  `npm run generate:interview-bank:check` — deterministic artifacts current;
- schema, projection, leakage, option-permutation, source, review-hash,
  lifecycle, calibration, timeout, error, and browser-isolation regression
  tests in `test:interview-bank`;
- frozen five-item fixture lint and regression tests;
- content-draft, repository-text, spelling-warning, and Git whitespace checks.

`npm run lint:interview-gold` is expected to fail while status is `candidate`.
That rejection is a lifecycle assertion, not an unresolved item-quality error.

## Residual risk and promotion rule

- All three review passes are AI reviews. A human editorial decision is still
  required before `editorial-gold`.
- The 28 relative-band disagreements remain visible; no behavioral evidence yet
  proves difficulty.
- `calibrated-gold` requires at least 100 matching-level attempts per item,
  positive discrimination, and functioning distractors. None of those metrics
  is claimed here.
- A repository containing private authoring or generated private files exposes
  answer keys to repository readers. Runtime integration must deliver only the
  public projection to browsers and keep the private package in a backend-only
  store.
- Five-question interviews are too small to support a defensible hire or
  strong-hire label. No such metric is produced.

Promotion to `editorial-gold` may occur only after explicit user approval of
bank version `1.0.0` and content hash
`cb3ae89566f78347493c588f0690a162dc83a2a13327a10ab9735d12db8d7f8e`.
