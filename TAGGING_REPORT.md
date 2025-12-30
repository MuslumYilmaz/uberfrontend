# Tagging Report

## Scope

Question data scanned under `frontend/src/assets/questions/**/*.json` (including system design `index.json` + `meta.json`).

## Summary

- Taggable entries found: 153
- Unique tags found (pre-normalization): 260
- Unique canonical tags (post-normalization + safe merges): 243
- Alias mappings: 20

## Registry

- Canonical tag list + aliases live in `frontend/src/assets/questions/tag-registry.json`.
- Canonical keys are normalized to kebab-case.
- Near-duplicate aliases were only created when mechanically safe (case/spacing/camelCase, hyphenless variants, and simple singular/plural pairs where both existed).

## Canonical Choices (Fragmentation Reductions)

| Variants | Usage | Canonical | Rationale |
| --- | --- | --- | --- |
| `async` vs `asynchronous` | `13` vs `1` | `async` | Most-used form (minimizes edits). |
| `accessibility` vs `a11y` | `15` vs `2` | `accessibility` | Most-used form (minimizes edits). |
| `utilities` vs `utility` | `1` vs `1` | `utilities` | Tie; chose plural to match existing category-style tags like `arrays`/`functions`/`objects`. |

## Alias Mappings

| Alias | Canonical |
| --- | --- |
| `*ngFor` | `ng-for` |
| `Async` | `async` |
| `Design Patterns` | `design-patterns` |
| `OOP` | `oop` |
| `a11y` | `accessibility` |
| `abortController` | `abort-controller` |
| `array` | `arrays` |
| `asynchronous` | `async` |
| `callback` | `callbacks` |
| `closures` | `closure` |
| `function` | `functions` |
| `image` | `images` |
| `localstorage` | `local-storage` |
| `ngFor` | `ng-for` |
| `number` | `numbers` |
| `object` | `objects` |
| `promises` | `promise` |
| `semantic` | `semantics` |
| `textDecoder` | `text-decoder` |
| `utility` | `utilities` |

## Files Changed (Auto-fix)

Safe auto-fixes were applied only to question files that contained aliases or non-kebab-case tags:

- Total: 6 files
- `frontend/src/assets/questions/angular/coding.json`
- `frontend/src/assets/questions/html/coding.json`
- `frontend/src/assets/questions/html/trivia.json`
- `frontend/src/assets/questions/javascript/coding.json`
- `frontend/src/assets/questions/javascript/debug.json`
- `frontend/src/assets/questions/javascript/trivia.json`

## Linting

- Report-only (CI): `npm run lint:tags` (from `frontend/`)
- Auto-fix (local): `npm run lint:tags:fix` (from `frontend/`)

## Unresolved Issues

- None (tag lint passes).

## Tags Left As-Is (Not Safe To Merge)

- `sessionstorage` → `session-storage`: `session-storage` does not exist anywhere in current repo tags; creating it would introduce a new tag variant beyond mechanical normalization rules.
- `eventloop` / `event-loop`: no `eventloop` variant exists in current repo tags.
- `microtask` / `microtasks`: no `microtask` variant exists in current repo tags.
