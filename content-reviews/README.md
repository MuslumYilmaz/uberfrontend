# Content Reviews

`content-reviews/` stores manual competitor-review snapshots used by repository lint rules.

Current scope:

- `trivia` only

Trivia review files must live at:

- `content-reviews/trivia/<tech>/<id>.json`

Each file compares one shipped trivia entry against three real competitor pages across:

- `realWorldUseCases`
- `actionableExamples`
- `followUpConfusion`

The review file is a repo-tracked editorial snapshot, not a runtime asset.

Rules enforced by lint:

- new or draft-backed converted trivia must have a matching review file
- each review must include `selection.querySource` and a `selection.greatFrontendRelevant` decision
- each competitor must use verdicts `ours | theirs | tie`
- each competitor must declare a `category` and `selectionReason`
- if a criterion is marked `ours`, `ourEvidence` must quote shipped trivia text exactly enough to be matched
- if we claim at least `2/3` wins against one competitor, `winReason` is required
- `theirEvidence` is required for every criterion
- if a criterion is `theirs` or `tie`, `nextActions` must explain what to improve
- directly relevant GreatFrontEnd pages are mandatory for new or draft-backed trivia, and warning-first for legacy reviews

Use `content-drafts/trivia/trivia.md` as the authoring starting point and link the review file through `competitor_review_file`.

Authoring standard:

- `content-reviews/TRIVIA_REVIEW_STANDARD.md`

## Workflow

Competitor reviews now follow an `AI draft + reviewer approval` workflow with strict evidence:

1. Create a batch manifest in `content-reviews/trivia/batches/<batch>.json`
2. Run the scaffolder:
   - `node frontend/scripts/scaffold-trivia-competitive-reviews.mjs content-reviews/trivia/batches/<batch>.json`
3. Fill each generated review by reading three real competitor pages
4. Keep every `ours` verdict tied to an exact shipped-trivia snippet in `ourEvidence`
5. Keep every criterion tied to a real competitor note in `theirEvidence`
6. If a criterion is `tie` or `theirs`, add a concrete improvement note in `nextActions`
7. Run `npm run lint:trivia-competitive-readiness`
8. Review the batch before merge

The scaffolder is only a starting point. It seeds `ourEvidence` from the first shipped text blocks and adds placeholder competitor notes. Do not treat scaffold output as a finished review.

## Batch Rules

- Default rollout is `10 review / batch`
- Legacy backfill starts with `importance = 5` trivia
- New or draft-backed converted trivia still require a finished competitor review before shipping
- Current cadence is `1 review batch -> 1 content-improvement batch`
- Current priority order is `Angular fundamentals -> Angular advanced -> React/Vue -> CSS/HTML`
- If a review batch creates too many honest threshold losses, pause coverage and open a loser-focused content-improvement batch before continuing

Recommended batch manifest shape:

```json
{
  "batchId": "importance-5-batch-01",
  "scope": "trivia competitor review backfill",
  "items": [
    { "tech": "javascript", "id": "js-closures" }
  ]
}
```

## Reviewer Approval

A batch is ready for approval when:

- every generated review file exists for the batch
- every competitor uses real URLs, not scaffold placeholders
- every `ours` verdict has shipped-text evidence
- every `tie` or `theirs` verdict has a real `nextActions` follow-up
- `npm run lint:trivia-competitive-readiness` passes without new schema errors

Reviewer approval is meant to catch bad verdicts, lazy ties, and overly generous wins before merge.
