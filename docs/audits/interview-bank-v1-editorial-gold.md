# Frontend interview bank v1 — editorial gold audit

- Audit date: 2026-07-27
- Bank: `frontend-interview-gold-bank`
- Version: `1.0.0`
- Status: `editorial-gold`
- Bank content hash: `cb3ae89566f78347493c588f0690a162dc83a2a13327a10ab9735d12db8d7f8e`

## Verdict

The project owner approved the exact 60-item candidate hash recorded in the
previous audit. Before promotion, deterministic generation from the authoring
records reproduced that hash with no drift. The only lifecycle edits were the
manifest/review status and a bank-level approval bound to version `1.0.0` and
the unchanged content hash.

The approval record is:

- `approvedBy`: `project-owner`
- `approvedAt`: `2026-07-27` UTC
- `bankContentHash`:
  `cb3ae89566f78347493c588f0690a162dc83a2a13327a10ab9735d12db8d7f8e`

No item prompt, code, option, answer, rationale, remediation topic, provenance
record, item revision, or item content hash changed during promotion.

## Gold artifact record

| Artifact | SHA-256 |
| --- | --- |
| Public | `0a05a6d1edb27a7e628d49bb187d0eb04ddeeb56d9c57563274c07fcd97e7097` |
| Private | `ce2577fdc6b1e0379f09678415615836f7abc65263d0b12f142ec63970af9dc8` |

The public SHA changed from the candidate release because the public package
now reports `editorial-gold`. The private SHA also incorporates the final
approval. The bank content hash remains unchanged because lifecycle metadata
is outside item content.

Exact runtime copies are stored under `backend/content/interview/`. The public
copy contains no answer key, rationale, answer proof, remediation, provenance,
review, or calibration field. The private package remains backend-only.

## Revalidated quality gates

The gold lint repeated the full candidate audit:

- 60 questions with the exact approved technology, level, format, difficulty,
  and answer-position distributions;
- three opaque stable options and one keyed option per question;
- option-ID evaluation over all permutations;
- no-waiver answer-length, lexical clue, containment, similarity, or
  all/none-of-the-above checks;
- complete technical, blind, and editorial evidence bound to each current
  revision and content hash;
- official-source, license, freshness, originality, and copied-text checks;
- deterministic public/private/release generation and artifact hashes;
- all six code-output questions executed with exact output in real headless
  Chromium.

Blind reviewers still place 28 questions in a different relative difficulty
band than the authored band. These are retained warnings, not hidden or
represented as measured calibration. They do not change the exact 5/10/5
foundation/core/stretch blueprint within each level.

## Verification record

Passed on 2026-07-27:

- `npm run generate:interview-bank`
- `npm run generate:interview-bank:check`
- `npm run lint:interview-gold`
- `npm run test:interview-bank`
- `node backend/content/interview/tools/generate-interview-content.mjs --check`
- `node backend/content/interview/tools/validate-interview-content.mjs`
- Git whitespace validation for the interview content and audit paths

The Chromium checks required execution outside the filesystem/process sandbox;
the final unrestricted runs passed. The earlier sandbox-only launch failures
were environment failures, not item failures.

## Remaining limits

- Item reviews are AI-labelled; the project-owner record is the human
  editorial release decision, not a claim that every review stage was human.
- `editorial-gold` is not `calibrated-gold`. Difficulty and distractor behavior
  still require target-level response data.
- Five MCQs cannot support a defensible hire or strong-hire prediction.
- Repository readers can see backend-private authoring and answer artifacts;
  production delivery must continue to expose only the public projection.
