# Frontend interview bank v1.1 — candidate audit

- Audit date: 2026-07-29
- Bank: `frontend-interview-gold-bank`
- Version: `1.1.0`
- Status: `candidate`
- Bank content hash: `e879b419e877f84088171eda3af9f327242435c4b99728c27e38d176fc0517e3`
- Final approval: `null`

## Verdict

The English Interview Mode MCQ authoring bank now contains 120 questions and
passes the candidate quality, projection, deterministic-generation, runtime
contract, and end-to-end application gates. The 60-question `1.0.0`
editorial-gold runtime remains active and unchanged. Promotion of this
candidate is deliberately blocked until the project owner approves the exact
version and content hash above.

The candidate artifacts are staged under
`content-drafts/interview-mcq/generated/candidate-1.1.0/`; they have not been
copied into the default generated directory or `backend/content/interview/`.
Production candidate loading was also exercised and rejected.

## Corpus census

| Dimension | Candidate result |
| --- | --- |
| Questions | 120 |
| Level | 40 Junior, 40 Mid, 40 Senior |
| Technology | 24 JavaScript, 12 HTML, 12 CSS, 24 React, 24 Angular, 24 Vue |
| Difficulty per level | 10 foundation, 20 core, 10 stretch |
| Format | 83 production scenario, 31 conceptual, 6 code output |
| Correct authoring position | 40 first, 40 second, 40 third |
| Options | 360 globally unique opaque IDs; exactly three per question |
| New questions | 60: 53 production scenario, 7 conceptual, 0 code output |
| Review waivers | 0 |

The exact format distribution by level is:

| Level | Conceptual | Code output | Production | Total |
| --- | ---: | ---: | ---: | ---: |
| Junior | 15 | 2 | 23 | 40 |
| Mid | 11 | 2 | 27 | 40 |
| Senior | 5 | 2 | 33 | 40 |

Every item has a passed technical, editorial, and answer-hidden blind review
bound to revision and content hash under checklist `1.2.0`. Blind reviewers
selected the keyed option for all 120 items, found no alternative valid option,
retained no clue flag, and matched all authored levels. Fifty-one relative
difficulty-band differences are retained as validator warnings rather than
being presented as measured calibration.

Blind review found two level blockers before the final pass. The new Angular
ControlValueAccessor item was narrowed to a local model/view direction
contract. The existing CSS intrinsic-ratio item was upgraded to an
art-directed `<picture>` production boundary and, because its substantive
content changed, advanced from revision 3 to revision 4. No other existing
question needed a revision.

## Form coverage and selection cost

Every one of the 120 questions appears in at least one valid five-question
form. The number of valid forms per level and track is:

| Level | Core web | React | Angular | Vue |
| --- | ---: | ---: | ---: | ---: |
| Junior | 144 | 720 | 544 | 496 |
| Mid | 156 | 638 | 639 | 638 |
| Senior | 156 | 528 | 548 | 700 |

A local 120-selection benchmark measured 1,693.90 ms total, or 14.12 ms per
form. The existing selector therefore remains unchanged. Tests additionally
confirm unseen expansion questions are preferred when they can form a valid
session, stable seeds remain deterministic, and option IDs stay attached to
their labels while presentation order changes.

## Snippet contract

Authoring continues to use `{language, runtime, source}`. Candidate loading
through the backend produced 30 questions with snippets and normalized each to
`code` plus `codeLanguage`; no authoring `runtime` field crossed the API
boundary.

The backend snapshot, serializer, and scoring paths retain `codeLanguage`.
The Angular normalizer accepts structured snippets, legacy string `code`, and
snippet-free payloads. Malformed structured snippets fail artifact validation.
Session and result templates use escaped interpolation, and long lines remain
inside the page at both 834 px and 1366 px widths.

## Artifact record

| Artifact | SHA-256 |
| --- | --- |
| Public candidate | `00b4b61e81ac157bb59fe6ff1c6f5971cf14df1380ce1fd3b217dc45f39c88e8` |
| Private candidate | `7eaf0d8895e69e31b1f6b591f9b2f6daad8914987c43a8d21289fb397c3d6fb9` |
| Release candidate | `e74faaee450b2dc80b6efa6e4e4475013fd61f5265cfaf2fc6a45eabb38b73f1` |

The public package passed the private-field leak scan. The release binds all
120 item revisions and content hashes plus the public/private artifact hashes.
Regeneration followed by `--check` reproduced the staged bytes.

The still-active runtime remains:

- version `1.0.0`
- status `editorial-gold`
- 60 questions
- content hash
  `cb3ae89566f78347493c588f0690a162dc83a2a13327a10ab9735d12db8d7f8e`

The default generated release and backend runtime release are byte-identical.

## Verification record

Passed:

- candidate lint for 120 items, including all six code-output snippets in real
  Chromium;
- candidate generation and deterministic staged `--check`;
- interview-bank validator tests;
- backend artifact, selection, scoring, and session-serialization tests;
- 25 Interview Mode route integration tests with an isolated in-memory MongoDB
  replica set;
- candidate backend loading in test mode and explicit production rejection;
- 43 targeted Angular service, session, and result component unit tests;
- Angular spec TypeScript compilation;
- 27 Interview Mode Playwright tests, including active-session and result
  snippet overflow coverage;
- production frontend build with 610 prerendered routes;
- backend interview-content validation;
- content-draft lint and Git whitespace validation.

The production build completed with the repository's current non-fatal budget
warnings: the initial bundle is 1,012.55 kB against a 900 kB warning budget,
and showcase component CSS is approximately 19 kB over its 40 kB warning
budget.

The gold-only lint was also run and failed with exactly one lifecycle error:
the bank is still `candidate`. This is the intended approval gate.

## Promotion rule and residual risk

- All item reviews are explicitly AI-labelled. Project-owner approval is still
  required for `editorial-gold`.
- The 51 blind band differences remain editorial calibration observations.
  `calibrated-gold` cannot be claimed without target-level response data.
- Candidate artifacts remain repository-visible and include a private package;
  production delivery must continue to expose only the public projection.
- Promotion may occur only after explicit approval of bank version `1.1.0` and
  content hash
  `e879b419e877f84088171eda3af9f327242435c4b99728c27e38d176fc0517e3`.
