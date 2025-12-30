# Topics Report

## What This Adds

- A curated `topic-registry.json` that groups canonical tags into higher-level topics.
- A resolver utility that derives topic ids from a question’s tags via intersection.
- A linter + CI gate to keep the topic registry consistent and tag-valid.

## Registry Location

- `frontend/src/assets/questions/topic-registry.json`

## Topics Added

| Topic Id | Title | Tags |
| --- | --- | --- |
| `css-layout` | CSS Layout | `border`, `box-model`, `centering`, `css`, `flexbox`, `grid`, `layout`, `margin`, `padding`, `positioning`, `responsive`, `spacing`, `z-index` |
| `js-async` | Async & Concurrency | `async-await`, `cancellation`, `event-loop`, `microtasks`, `promise` |
| `state-reactivity` | State & Reactivity | `derived-state`, `global-state`, `immutability`, `lifting-state`, `reactivity`, `rxjs`, `signals`, `state`, `state-management` |
| `web-accessibility` | Accessibility & Semantics | `accessibility`, `aria-describedby`, `aria-labelledby`, `labels`, `semantics` |
| `web-dom-events` | DOM & Events | `bubbling`, `capturing`, `dom`, `event-delegation`, `event-handlers`, `event-propagation`, `events` |
| `web-forms-validation` | Forms & Validation | `autosave`, `controlled-inputs`, `forms`, `inputs`, `labels`, `local-storage`, `reactive-forms`, `required`, `user-input`, `validation` |
| `web-performance` | Performance | `backpressure`, `cache`, `caching`, `debounce`, `intersection-observer`, `loading-states`, `optimization`, `pagination`, `performance`, `virtualization` |

## Tag Validation Summary

- All tags referenced by topics are canonical tags from `frontend/src/assets/questions/tag-registry.json`.
- Missing/unknown canonical tags referenced by topics: none.

## How Topics Are Derived

- A topic matches a question if `intersection(question.tags, topic.tags)` is non-empty.
- `deriveTopicIdsFromTags()` returns matched topic ids sorted for determinism.

## Expanding Topics To Tags (For Query/Filtering)

- `expandTopicsToTags(topicIds)` returns the union of tags defined by those topics (sorted, deduped).
- This enables a selector like “topicsAny: [..]” to be expanded into “tagsAny: [..]” before filtering questions.

## Linting Rules

- Topic id must be kebab-case.
- Topic title must be non-empty.
- Topic tags must be kebab-case.
- Topic tags must exist in tag-registry canonicals (no aliases).
- No duplicate tags within a topic.
- (Warning only) Topics with fewer than 3 tags.

## Commands

- `npm -C frontend run lint:topics`
- `npm -C frontend run lint:topics:fix`

