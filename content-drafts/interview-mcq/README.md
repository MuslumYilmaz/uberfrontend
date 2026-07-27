# Interview MCQ bank

This directory is the authoring and review boundary for the frontend interview
MCQ bank. It is not imported by the frontend, backend, or CDN runtime.

## Lifecycle

- `candidate`: all automated, technical, editorial, and blind checks pass, but
  the bank has no final user approval.
- `editorial-gold`: the current bank content hash has a bank-level approval.
- `calibrated-gold`: editorial approval remains valid and every item also meets
  the measured-attempt, discrimination, difficulty, and distractor thresholds.

Changing substantive public or private item content changes its `contentHash`.
Reviews bind to both the item revision and that hash. Author metadata and future
calibration measurements are deliberately excluded from the content hash.
Substantive quality-policy edits must also increment `checklistVersion`; review
records using an older checklist are invalid and must be rerun.

## Data boundaries

- `items/` contains the single authoring records with `public` and `private`
  sections.
- `reviews/` binds technical, editorial, and blind evidence to current hashes.
- `manifests/` allowlists the exact revisions in a release candidate.
- `generated/` contains deterministic public, private, and release projections.
- `reference-set-v1.*.json` remains a pinned five-item regression fixture. Its
  five items retain revision-2-or-later migration lineage in the v2 bank while
  the historical v1 files remain byte-for-byte pinned.

The public generator uses an explicit allowlist, so answer keys, explanations,
provenance, remediation topics, verification output, and reviews cannot enter
the public package. Answer evaluation uses stable option IDs, not positions.
Those public IDs are opaque `choice-<hash>` values, so developer tools do not
expose semantic answer clues.

## Editorial and source policy

Prompts, code, and options are original. Official documentation is used to
verify claims, and each source records its URL, retrieval date, revision,
license, and `copiedText: false`. Review records explicitly distinguish human,
AI, and AI-assisted reviewers. The quality policy applies a one-best-answer
method based on the referenced NBME guide without copying its items or wording.

## Commands

Run from `frontend/`:

```text
npm run generate:interview-bank
npm run generate:interview-bank:check
npm run lint:interview-bank
npm run lint:interview-gold
npm run test:interview-bank
```

`lint:interview-gold` intentionally rejects a candidate until a matching
bank-level approval is recorded. It does not promote content by itself.
