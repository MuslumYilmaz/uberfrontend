# Question Content Context

Load this for shipped question identity, gamification semantics, and versioned draft behavior.

## When to load
- The task changes `cdn/questions/**`, question registries, gamification behavior, draft storage, or content versioning.
- The prompt mentions `tech/kind/id`, `contentVersion`, draft migration, XP, streaks, or solved-progress semantics.

## When not to load
- The task is normal frontend UI work, content drafting, or competitor-review authoring.
- The change does not affect shipped question identity, draft storage, or gamification state.

## Non-negotiables
- A shipped question identity is `tech + kind + id`; do not rename, delete, or move it without an explicit migration plan.
- Progress summaries count current catalog items only, but historical XP is not rewritten when content leaves the catalog.
- Difficulty for XP is snapped at first logical completion and later catalog edits must not rewrite that history.
- Guest solves are not canonical progress writes.
- Drafts are versioned as `baseKey@contentVersion`; older drafts are preserved and surfaced rather than overwritten.

## Path triggers
- `cdn/questions/**`
- `frontend/scripts/question-id-manifest.json`
- `frontend/src/app/core/utils/content-version.util.ts`
- `frontend/src/app/core/utils/versioned-drafts.util.ts`
- `frontend/src/app/core/services/code-storage.service.ts`
- `frontend/src/app/shared/components/draft-update-banner/**`
- `backend/services/gamification/question-catalog.js`

## Deep reference
- `frontend/docs/question-governance.md`
- `frontend/docs/draft-versioning.md`
