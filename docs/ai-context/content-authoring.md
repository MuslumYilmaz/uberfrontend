# Content Authoring Context

Load this for `content-drafts/` workflow, frontmatter discipline, and manual conversion rules.

## When to load
- The task creates or edits files under `content-drafts/`.
- The prompt is about frontmatter, outline-first drafting, editor pass, fact-check metadata, or manual conversion targets.

## When not to load
- The task is shipped trivia competitor review only; prefer `trivia-review.md` as the secondary doc in that case.
- The work is regular product code, backend/API, or Angular UI with no draft-authoring workflow.

## Non-negotiables
- `content-drafts/` is an authoring area only; do not treat it as runtime source of truth.
- Do not build a `.md -> JSON/TS` generator yet; conversion stays manual.
- Fill required frontmatter before AI drafting, use outline-first workflow, then editor pass and fact-check pass.
- Run `cd frontend && npm run lint:content-drafts` before treating a piece as publish-ready.
- Do not approve content with missing competitor/fact-check metadata or unresolved `VERIFY:` markers.

## Path triggers
- `content-drafts/**`
- `frontend/scripts/**`

## Deep reference
- `content-drafts/README.md`
- `content-drafts/playbooks/playbook.md`
- `content-drafts/system-design/system-design.md`
- `content-drafts/trivia/trivia.md`
