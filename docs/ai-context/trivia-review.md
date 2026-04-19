# Trivia Review Context

Load this for shipped trivia competitor reviews and evidence-based review batches.

## When to load
- The task changes `content-reviews/**` or asks for trivia competitor review policy.
- The prompt mentions `ours`, `theirs`, `tie`, GreatFrontEnd inclusion, competitor evidence, or `nextActions`.

## When not to load
- The task is a normal content draft with no shipped-trivia comparison.
- The work is UI, backend, or generic testing without competitor-review semantics.

## Non-negotiables
- Start from `tie`, not `ours`; only record `ours` when the advantage is clear and specific.
- Every `ours` verdict needs exact enough shipped-text evidence; every `tie` or `theirs` verdict needs concrete `nextActions`.
- Use real competitor URLs and read the relevant explanation section, not just titles or intros.
- Include a directly relevant GreatFrontEnd page when one exists, or explain why it is omitted.
- Run `cd frontend && npm run lint:trivia-competitive-readiness` before treating a batch as ready.

## Path triggers
- `content-reviews/**`
- `content-reviews/trivia/batches/**`
- `cdn/questions/**/trivia.json`

## Deep reference
- `content-reviews/README.md`
- `content-reviews/TRIVIA_REVIEW_STANDARD.md`
