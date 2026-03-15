# Question Governance For Gamification

This repo treats shipped question content as a gamification contract.

## Immutable identity

For coding, trivia, and debug catalogs, a shipped question identity is the tuple:

- `tech`
- `kind`
- `id`

That identity is locked in `frontend/scripts/question-id-manifest.json` and validated by:

- `node scripts/validate-question-identities.mjs`

If you add a new question intentionally, refresh the snapshot with:

```bash
cd frontend
node scripts/update-question-id-manifest.mjs
```

Do not rename, delete, or move a shipped question to another `tech/kind` without an explicit migration plan. Historical gamification records depend on this identity remaining stable.

## Removed questions and progress

Progress summaries only count questions that still exist in the current catalog.

That means:

- stale `solvedQuestionIds` for removed questions are ignored in dashboard progress
- removed questions drop out of solved totals and percentages
- historical XP is not rewritten when content leaves the catalog

This keeps current coverage metrics aligned with the current catalog while preserving historical activity records.

## Difficulty snapshot

XP is awarded from the difficulty at the time of the first logical completion.

That snapshot is stored on the logical completion record and reused on re-completion. Later catalog edits must not rewrite historical difficulty or XP semantics.

## Guest solve policy

Guest users do not write canonical progress.

That means:

- guest solve attempts do not write XP or level
- guest solve attempts do not persist solved progress locally for later merge
- login prompts may interrupt a solve flow, but the solve is not counted until an authenticated completion is submitted

The authenticated completion flow under `/api/activity/*` is the only canonical write path for gamification state.
