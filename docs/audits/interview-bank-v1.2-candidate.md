# Frontend interview bank v1.2 — candidate audit

- Audit date: 2026-08-05
- Bank: `frontend-interview-gold-bank`
- Version: `1.2.0`
- Status: `candidate`
- Bank content hash: `1a46bf07d68d0825cc6a6971bb1d95e0d10cc6bc10f586f7185ffddf0debabf8`
- Final approval: `null`

## Verdict

The Interview Mode MCQ authoring bank now contains 170 English questions and
passes the candidate quality, source, projection, deterministic-generation,
selection, scoring, serialization, frontend, and end-to-end gates. This adds
50 original questions without adding a code-output item.

The active 120-question `1.1.0` editorial-gold runtime remains byte-for-byte
unchanged. Candidate artifacts exist only under
`content-drafts/interview-mcq/generated/candidate-1.2.0/`; they were not copied
to the default generated directory or `backend/content/interview/`. Promotion
requires a separate project-owner approval of the exact version and content
hash above. Approval of the blind-calibration warning policy is not a Gold
promotion approval.

## Corpus census

| Dimension | Candidate result |
| --- | --- |
| Questions | 170 |
| Level | 56 Junior, 57 Mid, 57 Senior |
| Technology | 34 JavaScript, 17 HTML, 17 CSS, 34 React, 34 Angular, 34 Vue |
| Difficulty | Junior 14/28/14; Mid 14/29/14; Senior 14/29/14 foundation/core/stretch |
| Format | 43 conceptual, 6 code output, 121 production scenario |
| Correct authoring position | 57 first, 57 second, 56 third |
| Options | 510 globally unique opaque IDs; exactly three per question |
| New questions | 50: 12 conceptual, 38 production scenario, 0 code output |
| Review waivers | 0 |

The exact format distribution by level is:

| Level | Conceptual | Code output | Production | Total |
| --- | ---: | ---: | ---: | ---: |
| Junior | 21 | 2 | 33 | 56 |
| Mid | 15 | 2 | 40 | 57 |
| Senior | 7 | 2 | 48 | 57 |

The two content repairs explicitly accepted during candidate preparation are
revision 2 of `int-html-data-table-header-association-mid-v1` and revision 2
of `int-vue-next-tick-dom-read-timing-mid-v1`. The other 118 pre-existing
items retain their revision and content hash. Active and completed session
snapshot/scoring contracts remain unchanged.

## Independent review record

All 170 current revisions have independent technical, editorial, and
answer-hidden blind reviews under checklist `1.3.0`:

- `codex-mcq-technical-v1.2`
- `codex-mcq-editorial-v1.2`
- `codex-mcq-blind-v1.2`

The final post-merge technical pass reported 170/170 unique coverage, zero
blockers, no placeholder or provisional evidence, and only the two summarized
calibration-warning classes described below. Its report SHA-256 is
`6c2f0a968308a716d440621cc04330cee1b1ed91925851bd1698d4ed44e71144`.

The editorial pass reported 170 reviewed items, zero blockers, and zero
warnings. Its report SHA-256 is
`140f79d489f2063a13a6a58cfa83926c06a3f745a80434749d12431e8b949186`.

The final answer-hidden pass reviewed all 170 items without the answer key.
Every selected answer matched the keyed answer, no alternative valid answer
or clue flag remained, and answer positions were exactly `57/57/56`. It also
reproduced the exact level, technology-by-level, format-by-level, and
difficulty-band-by-level cohorts without quota forcing. The blind result and
summary report SHA-256 values are respectively
`6e617b6955b9fc6c343faf28e592fd36ace5d4415ce5f155d6495c88f3d2fa94`
and
`97b721e9ad6ccde1e00aa449a25991c6f55b6831b88a14a0830e33edfa731f0c`.

One answer-hidden clerical inconsistency in blind item 166 was caught before
review merge: its selected option ID did not match the reviewer's own
rationale. The item was reopened without revealing the key, corrected by the
blind reviewer, regenerated, and revalidated. The final merged records contain
no answer mismatch.

Blind reviewers disagreed with 22 individual authored levels and 84
individual relative difficulty bands. These are retained as calibration
warnings, not rejected questions: an answer-hidden reviewer can reasonably
place an individual item differently without proving a content defect. Exact
blind cohort distributions remain hard blockers, as do wrong or ambiguous
answers, answer clues, source/claim failures, stale or non-independent
reviews, and public/private leakage. No warning was waived or silently
discarded.

## Source and originality gates

The 50 new items use `wordingOrigin: original` and `copiedText: false`.
Decisive claims are attached to allowlisted official sources; framework
versions are pinned where the contract depends on them. React uses 19.2, Vue
uses 3, and the required-input, incremental-hydration, and prerender Angular
items explicitly use Angular 22 contracts.

The full corpus originality scan found no exact eight-word prompt/option
overlap in 265 local CDN JSON files. The highest local CDN Jaccard similarity
was 0.333, below the rejection threshold. The existing six code-output items
remain the only code-output items and passed real Chromium verification.

## Form coverage and selection cost

The blueprint now exposes `eligiblePoolByLevelAndTrack`. Every one of the 170
questions is reachable from at least one valid five-question form. Valid form
counts are:

| Level | Core web | React | Angular | Vue |
| --- | ---: | ---: | ---: | ---: |
| Junior | 1,026 | 3,870 | 3,870 | 3,732 |
| Mid | 824 | 2,956 | 3,905 | 3,680 |
| Senior | 679 | 3,900 | 2,907 | 3,580 |

The selector combines only the required technology subsets and then restores
the previous source-order enumeration. Equivalence tests compare its complete
candidate set with brute-force enumeration. Stable seeds, unseen-first,
minimum-seen, oldest-seen, and option-ID/label attachment behavior remain
unchanged. A local 120-selection benchmark measured 2,907.57 ms total, or
24.23 ms per selection.

## Candidate artifact record

| Artifact | SHA-256 |
| --- | --- |
| Public candidate | `61f7e40144c39cb3a48dad51069c767381d8fd611e736a7a3466279dc0b0a3aa` |
| Private candidate | `7fbf1a4bfa8e2c05dce0e9e284dae2eaccd916fb434873e3b38b2494e47d34ef` |
| Release candidate | `b3664d0078cbabaf560c20d96563393cc867f456e17f9a7699557d9fbfeb2b68` |

The release binds all 170 item revisions and hashes to the exact bank content
hash. Regeneration followed by candidate-only `--check` reproduced the staged
bytes. The public artifact contains no answer, rationale, remediation,
clarification, provenance, review, fixture, or other private authoring field.
The output guard rejects candidate generation into the active Gold locations.

The still-active runtime is `1.1.0` editorial-gold with 120 questions and
content hash
`e879b419e877f84088171eda3af9f327242435c4b99728c27e38d176fc0517e3`.
Its artifact SHA-256 values remain:

| Artifact | SHA-256 |
| --- | --- |
| Public Gold | `b75d8c6c991bf30fbb245ce61b33b0f71d4b7163096acd5c398d6a247b457968` |
| Private Gold | `8f01d61eda38bf3464c296bd6ba4371e4250c2c39c14073f15ab022bef657562` |
| Release Gold | `d5450dcfc9c7bfa87a157b57ea70c793c9cfa070d3e023cb551d768869d82e3e` |

The default generated and backend runtime Gold files are byte-identical.

## Verification record

Passed on 2026-08-05:

- `npm run test:interview-bank`;
- `npm run lint:interview-bank` for all 170 items, including the six real
  Chromium code-output checks;
- candidate generation and deterministic candidate-only `--check`;
- targeted backend artifact, selection, scoring, session-serialization, and
  System Design content tests: 5 suites and 74 tests;
- full backend Jest: 50 suites and 709 tests with `--runInBand --forceExit`;
- active-Gold interview-content generation check and validation, including all
  seven Guided System Design scenarios;
- the Angular unit suite: 1,004 tests;
- 28 Interview Mode Playwright tests, including candidate 170-item loading,
  active Gold behavior, auth/quota flows, and mobile/desktop layouts;
- Git whitespace validation.

The first full backend run completed all tests but retained an existing open
handle and did not exit. A forced-exit rerun exposed one transient Interview
Mode ownership-test failure; that suite then passed 25/25 in isolation, and a
clean full forced-exit rerun passed 709/709 with exit code 0. No product code
was changed to mask the transient result.

The frontend package-script change legitimately advances
`cdn/data-version.json` through its owning generator. It is a cache-busting
metadata update; it does not change library question identity, the 120-item
Gold bank, or generated Gold artifacts.

`lint:interview-gold` is intentionally not a candidate-stage command. It will
remain closed until the exact candidate hash receives a separate promotion
approval.

## Promotion rule and residual risk

- Reviews are explicitly AI-labelled. Project-owner approval is still
  required to advance this exact `1.2.0` candidate to `editorial-gold`.
- Per-item level and band warnings are editorial calibration observations, not
  empirical calibration. `calibrated-gold` requires target-level response
  data.
- A five-question session is practice feedback, not a defensible standalone
  hiring decision.
- Repository readers can access private authoring artifacts; production must
  continue serving only the public projection.
- Promotion may occur only after explicit approval of version `1.2.0` and
  content hash
  `1a46bf07d68d0825cc6a6971bb1d95e0d10cc6bc10f586f7185ffddf0debabf8`.
