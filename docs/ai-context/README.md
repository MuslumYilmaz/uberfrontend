# AI Context Layout

This directory keeps default model context small and routable.

## Load Order
1. Load `AGENTS.md`.
2. Classify the task from the user prompt, open file paths, and changed paths.
3. Use `router.yaml` to load at most one primary topic doc, one secondary topic doc, and one conditional audit/reference doc.
4. Do not bulk-load every Markdown file in the repo.

## Directory Map
- `router.yaml`: source of truth for task-to-doc routing.
- `*.md`: short topic summaries designed for the first 20-30 lines to be enough in most turns.
- `../audits/`: historical deep dives that should only be loaded conditionally.
- `../references/`: durable policy references that back topic summaries.

## Loaded Context Log Contract
The wrapper/IDE should emit a per-turn log entry that includes:
- `path`
- `role` (`core`, `primary`, `secondary`, `reference`)
- `reason`
- `estimated_tokens`

If multiple rules match, prefer the highest-priority rule and keep the loaded set minimal.
