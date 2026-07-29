# Frontend interview bank v1.1 — editorial gold audit

- Audit date: 2026-07-29
- Bank: `frontend-interview-gold-bank`
- Version: `1.1.0`
- Status: `editorial-gold`
- Bank content hash: `e879b419e877f84088171eda3af9f327242435c4b99728c27e38d176fc0517e3`

## Verdict

The project owner approved the exact version and content hash published in the
v1.1 candidate audit. Deterministic generation reproduced the approved
120-question corpus before promotion. The manifest and review lifecycle were
then advanced to `editorial-gold`, and the final approval was bound to:

- `approvedBy`: `project-owner`
- `approvedAt`: `2026-07-29`
- `bankVersion`: `1.1.0`
- `bankContentHash`:
  `e879b419e877f84088171eda3af9f327242435c4b99728c27e38d176fc0517e3`

No question prompt, option, answer, rationale, provenance record, item
revision, or item content hash changed during promotion. The staged candidate
package remains under
`content-drafts/interview-mcq/generated/candidate-1.1.0/` as the immutable
pre-approval record.

## Gold artifact record

| Artifact | SHA-256 |
| --- | --- |
| Public | `b75d8c6c991bf30fbb245ce61b33b0f71d4b7163096acd5c398d6a247b457968` |
| Private | `8f01d61eda38bf3464c296bd6ba4371e4250c2c39c14073f15ab022bef657562` |
| Release | `d5450dcfc9c7bfa87a157b57ea70c793c9cfa070d3e023cb551d768869d82e3e` |

The default generated artifacts and the runtime copies under
`backend/content/interview/` are byte-identical. The backend runtime pin now
requires the approved content hash and rejects drift.

The public projection contains no answer key, rationale, remediation,
provenance, review, calibration, or authoring runtime field. Structured
authoring snippets are exposed only as the backwards-compatible `code` and
`codeLanguage` fields.

## Revalidated corpus and coverage

The promoted bank contains:

- 120 unique questions: 40 Junior, 40 Mid, and 40 Senior;
- 24 each for JavaScript, React, Angular, and Vue, plus 12 each for HTML and
  CSS;
- 10 foundation, 20 core, and 10 stretch questions at every level;
- 83 production scenarios, 31 conceptual questions, and the existing six
  code-output questions;
- 360 globally unique opaque option IDs, exactly three options per question,
  and a 40/40/40 keyed source-position balance.

Every question appears in at least one valid five-question form. The selector
retains the track ratios and deterministic question/option shuffling, and
unseen expansion questions are preferred whenever they can form a valid
session. The measured local selection cost remains 14.12 ms per form.

All 120 current revisions passed technical, editorial, and answer-hidden blind
review under quality checklist `1.2.0`. Blind review selected the keyed answer
for every item, found no alternative valid answer or clue flag, and matched all
authored levels. Fifty-one relative difficulty-band differences remain
visible validator warnings; they are not represented as measured calibration.

## Verification record

Passed on 2026-07-29:

- deterministic candidate and Gold interview-bank generation checks;
- candidate lint, Gold lint, validator tests, private-field leak checks, and
  all six code-output questions in real headless Chromium;
- backend interview-content generation, parity, and validation;
- 44 targeted backend artifact, selection, scoring, snapshot serialization,
  and System Design content tests;
- 25 Interview Mode route integration tests using an isolated in-memory
  MongoDB replica set;
- the full Angular unit suite: 968 tests;
- 27 Interview Mode Playwright tests, including Guided System Design,
  recovery, and snippet overflow at mobile and desktop widths;
- the production frontend build with 610 prerendered routes;
- Git whitespace validation.

The production build retained the repository's existing non-fatal budget
warnings: the initial bundle is 1,012.55 kB against a 900 kB warning budget,
and showcase component CSS is approximately 19 kB over its 40 kB warning
budget.

## Remaining limits

- Review stages are AI-labelled; the project-owner approval is the human
  editorial release decision, not a claim that every review was human.
- `editorial-gold` is not `calibrated-gold`. Difficulty and distractor
  behavior still require target-level response data.
- A five-question session cannot by itself support a defensible hiring
  decision.
- Repository readers can access backend-private and authoring artifacts;
  production delivery must continue to expose only the public projection.
