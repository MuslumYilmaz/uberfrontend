---
title: "Real-time Search with Debounce & Caching"
slug: "realtime-search-debounce-cache"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "real-time search frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Real-time Search with Debounce & Caching."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Real-time Search with Debounce & Caching."
unique_angle: "Design real-time search with debounced intent, true request cancellation, stale-result suppression, complete cache keys, predictable UI states, and keyboard access."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Real-time Search with Debounce & Caching."
competitor_query: "Real-time Search with Debounce & Caching frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
  - "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

real-time search frontend system design. Design real-time search with debounced intent, true request cancellation, stale-result suppression, complete cache keys, predictable UI states, and keyboard access.

## Requirements

Design a cancellable autocomplete surface that separates live input from accepted query intent, keys cached results by every result-shaping dimension, and commits only the latest matching response.

---

What you’re solving:
A search input calls an asynchronous search function as the query changes. The frontend owns intent, debounce, cancellation, cache identity, and result acceptance while ranking stays abstract.

The goal is responsive feedback across different typing cadences, useful reuse for repeated queries, and no flicker or stale rendering when responses arrive out of order.

The design must distinguish debounce from throttle, define a complete query-and-filter cache key, handle slow and fast typing, abort obsolete transport work with AbortController, suppress any stale result that still resolves, define cache expiry and bounds, and represent empty query, loading, no-results, and error states separately.

---

### Query intent journey

1. Empty state: The user sees an empty input and a neutral state such as guidance, recent searches, or popular queries. No accepted search request is running.
2. User starts typing: As the user types, the raw input updates immediately. A debounced handler waits for a short pause before triggering a search for the current query.
3. Debounced search + cache check: When the debounce fires, the system first checks the cache. If we already have results for this query, show them instantly. If not, mark the state as loading and call the async search function.
4. Cancel obsolete work and reject stale results: Starting a new accepted query aborts the previous controller. Each request also captures a generation and complete cache key. A result is applied only when both still match, because cancellation may race with resolution or may not stop every underlying operation.
5. UX for no results / errors: If results are empty, show a clear "No results" state. If the search function rejects or times out, show a small inline error with an option to retry, without breaking the input.

### Search interaction guarantees

- Typing should feel instant; debouncing should not block input updates.
- We should avoid spamming the search function on every keystroke.
- Repeated queries should feel instant thanks to caching.
- Out-of-order responses must not overwrite newer results.
- Empty query should not show stale results from previous searches.
- Error states should be subtle (inline) and allow retry without losing the query.

### Debounce vs throttle for search intent

| Concept | What it does | How you position it for this problem |
| --- | --- | --- |
| Debounce | Waits for the user to stop typing for X ms, then fires once. | Prefer it when results should represent a settled query and a short wait is acceptable. |
| Throttle | Fires at most once every X ms, ignoring extra calls between intervals. | Prefer it when continuous intermediate updates matter; it is rarely the default for ordinary text search. |

| Signal | Value | Interpretation |
| --- | --- | --- |
| Typical debounce delay | 300–500ms | Fast enough to feel responsive, slow enough to avoid spam. |
| Cache key | Complete search identity | Normalized query plus locale, filters, sort, and any permission scope that changes results. |
| Key safety rule | Ignore stale responses | Only apply results if they match the latest query/request id. |

### Scope checkpoint

Real-time search is less about calling search on every change than controlling intent timing, reusing work with a complete cache key, and protecting the interface from stale or failed responses. Those guarantees belong in requirements before implementation details.

### Frontend boundary

The frontend owns input intent, debounce scheduling, AbortController lifetime, stale-result acceptance, cache identity, selection, and status rendering. Search ranking and index execution remain an abstract cancellable service contract.

# Clarifying Questions

- What is the typical latency of the search function (tens vs hundreds of ms)?
- Do we expect users to type short queries (2–3 chars) or longer phrases?
- Should we avoid searching for very short queries (e.g. fewer than 2–3 characters)?
- Do we need to show suggestions for the empty query (popular items, history)?
- How long can a cache entry stay valid before we consider it stale?
- Do we need to distinguish between "no results" and "request failed" in the UI?

# Architecture

---

Use a SearchBox for immediate input, a controller for accepted intent and request generations, and a bounded cache keyed by the complete result scope. Each accepted intent may abort obsolete transport work, but only the active generation and key can publish results.

Boundary checks:
- Live input and accepted search intent are separate.
- Cache identity includes query, locale, filters, sort, and permission scope when relevant.
- AbortSignal releases obsolete work while a generation guard protects correctness.
- Cache bounds and freshness are explicit.
- Idle, loading, refreshing, results, no-results, and error map to distinct UI states.

---

### Core building blocks

| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| SearchInput component | Renders the text input, updates query state on every keystroke. | "SearchInput is responsible for capturing user typing and updating a query string immediately so typing always feels instant." |
| Search controller / hook (useSearch) | Owns debounced query, loading flag, error, results and cache access. | "A useSearch(query) hook manages debouncing, calls the async search function when needed, checks the cache, and exposes { results, loading, error } back to the UI." |
| Cache module | Stores complete SearchKey hashes → results plus freshness metadata and handles bounded eviction. | Cache identity includes every input that can change results: canonical query, locale, filters, sort, and permission scope. |
| Async search function (abstract) | Represents the backend call; returns a Promise of results. | Inject a cancellable search function so the browser architecture does not depend on ranking or index implementation details. |
| Results / states view | Maps search state into UI: loading, results, no results, error. | "A Results area reads { loading, results, error, query } and shows skeletons or spinners, empty state, or error message based on that state." |

---

State and request tracking at a glance
The minimal shape supports debounced intent, complete cache identity, AbortController cancellation, and stale-result suppression:

```text
type SearchStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'no-results' | 'error';

interface SearchKey {
  query: string;
  locale: string;
  filters: Record<string, string[]>;
  sort: string;
  permissionScope: string;
}

interface SearchViewState<T> {
  input: string;
  acceptedKey: SearchKey | null;
  status: SearchStatus;
  results: T[];
  error: string | null;
  activeGeneration: number;
}

interface ActiveSearch {
  generation: number;
  keyHash: string;
  controller: AbortController;
}
```

Each outgoing search owns an AbortController, generation, and complete key hash. A newer accepted intent aborts obsolete transport work. A response updates state only if its generation and key still match, which protects the UI even when cancellation races or is unsupported below the adapter.

### Intent, cache, and selection decisions

- Typing updates query instantly; debouncing happens in a separate effect or handler.
- When intent is accepted, apply the same documented query canonicalization as the service and check the complete cache key.
- If cached and fresh, we skip the async call and use the cached results.
- If no compatible cache entry exists, advance the generation, create an AbortController, and mark loading or refreshing.
- A response publishes only when both generation and complete key still match active intent.
- We store results in the cache along with a timestamp for basic expiry.

### Architecture pitfalls

- Calling the async search function directly on every keystroke without debounce.
- Letting older responses overwrite newer ones because there is no request tracking.
- Using the raw query string without normalization as a cache key ("Foo" vs "foo ").
- Mixing cache access logic directly into the input component instead of a controller/hook.
- Having no clear states for empty query vs no results vs error.

### High-level flow

1. Capture live query input: Every keypress updates query state immediately. The UI always reflects the latest characters the user entered.
2. Debounced trigger: A debounced handler watches live input. After a product-configured quiet period, it accepts the current intent. Explicit filter submission can bypass the typing debounce.
3. Cache check: The controller builds the complete SearchKey using the documented canonicalization contract. A compatible fresh entry can publish immediately; a stale entry may remain visible with refreshing status.
4. Async search, abort, and acceptance guard: If no fresh cache entry exists, abort the previous controller, create a new AbortController, increment the request generation, mark loading, and call search with its signal. Apply the result only when its generation and complete cache key still match the active intent.
5. Update state & cache: On a valid response, it updates results, sets status = 'success', clears error, and stores the results in the cache with fetchedAt. On failure, it sets status = 'error' and a user-friendly error message.

| Signal | Value | Interpretation |
| --- | --- | --- |
| State ownership | Search hook / controller | One place manages input, accepted key, results, cache, generation, and cancellation. |
| Key pattern | Debounce + abort + guard | Cancellation releases work; generation and key matching protect correctness. |
| UX goal | Always reflect latest query | Results on screen must match what’s in the input, no matter the timing. |

### Intent and result ownership

The architecture centralizes accepted intent, cache identity, transport cancellation, and result acceptance. Debounce controls when work begins; it does not replace the stale-response guard.

### Worked example: locale changes while a query is in flight

The user searches for cafe in en-US, then switches locale to fr-FR before the first request resolves. Query text alone is not a complete cache key and abort alone is not a complete correctness rule.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| English query is accepted | Create key hash from query, locale, filters, sort, and permission scope; start generation 11. | Keep previous useful results with a refreshing state. | Visible data names its intent. |
| Locale changes | Abort generation 11 and start generation 12 with a new key. | Input remains stable while locale-aware loading begins. | Different result spaces do not share entries. |
| English response resolves | Reject its generation and key even if abort raced. | No English result flashes into the French view. | Acceptance is stricter than completion. |
| French response succeeds | Cache under the full key and publish generation 12. | Results, count, and active-descendant state update together. | UI state matches the current key. |

# Tradeoffs

## Data

Keep input intent, accepted search identity, request runtime, cache entries, and visible selection separate so cancellation and late resolution cannot corrupt the current result space.

---

Keep one SearchViewState for live input and visible results, a complete SearchKey for accepted intent, a bounded cache keyed by stable serialization, and an ActiveSearch runtime record with generation, key hash, and AbortController.

Keep one source of truth for search UI state, distinguish raw input from accepted query intent, model complete cache keys and expiry explicitly, retain an AbortController outside serializable state, use a generation to suppress stale resolution, and represent no-results and error as separate states.

---

```typescript
type SearchStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'no-results' | 'error';

interface SearchKey {
  query: string;
  locale: string;
  filters: Record<string, string[]>;
  sort: string;
  permissionScope: string;
}

interface SearchViewState<T> {
  input: string;
  acceptedKey: SearchKey | null;
  status: SearchStatus;
  results: T[];
  error: string | null;
  activeGeneration: number;
  activeResultId: string | null;
}

interface SearchCacheEntry<T> {
  key: SearchKey;
  results: T[];
  fetchedAt: number;
  lastUsedAt: number;
}

type SearchCache<T> = Map<string, SearchCacheEntry<T>>;

interface ActiveSearch {
  generation: number;
  keyHash: string;
  controller: AbortController;
}

```

### Core entities

| Entity | Fields (example) | Design rationale |
| --- | --- | --- |
| SearchViewState | input, acceptedKey, status, results, error, activeGeneration, activeResultId | The UI state identifies which accepted intent produced visible results and which result owns keyboard selection. |
| SearchCacheEntry | complete key, results, fetchedAt, lastUsedAt | Freshness and bounded recency are explicit without allowing locale, filters, sort, or permission scope to collide. |
| ActiveSearch | generation, keyHash, AbortController | Runtime cancellation is separate from the generation-and-key acceptance rule. |

### Required fields

- A query field for the live input value.
- An accepted SearchKey for the intent that triggered the active result space.
- A status enum covering idle, loading, refreshing, success, no-results, and error.
- A results array and an error string.
- A bounded cache map from complete serialized key to a timestamped entry.
- A generation and key-hash guard in addition to AbortController.

### Search-state pitfalls

- Only storing results without keeping track of which query produced them.
- Not distinguishing between empty results and error in the data.
- Relying on Promise completion order instead of an active generation plus accepted-key equality check.
- Using raw query (with spaces / case differences) as the cache key without normalization.
- Embedding the whole cache inside each component instance when a shared controller would do.

### How the data typically evolves over time

1. Initialize empty query intent: input is empty, acceptedKey is null, status is idle, results are empty, activeGeneration is zero, and no ActiveSearch exists.
2. Advance the input generation: Every keystroke updates input immediately. The debounce later accepts a complete SearchKey using the current locale, filters, sort, and permission scope.
3. Cache check & request tracking: The controller serializes the canonical key and checks the bounded cache. A miss advances activeGeneration, creates an AbortController, and calls the search adapter.
4. Response handling: A response publishes only if its generation and key hash still match. The controller sets success or no-results, updates the matching cache entry, and repairs activeResultId by stable identity.
5. Subsequent queries: When the user repeats a previous query, the controller hits cache first and can fill results immediately, skipping the async call if the entry is still considered fresh.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Core model | SearchView + cache | Together they describe what the user sees and what we can reuse. |
| Key safety field | generation + key | Prevents stale responses from overriding active intent. |
| Cache key rule | query + locale + filters + sort + scope | Normalize each dimension that can change the result set. |

### State checkpoint

A clear model separates live input, accepted intent, a complete cache key, transport cancellation, and stale-result acceptance. AbortController releases obsolete work when possible; the generation guard protects correctness even when cancellation races with resolution.

### Intent, request, and result ownership

Keep live input separate from accepted SearchInput. The accepted key contains normalized query, locale, filters, sort, and permission scope when it changes results. Runtime request state stores AbortController, generation, and key hash. Cache entries contain typed results, timestamps, and bounded eviction metadata.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| SearchInput | query, locale, filters, sort, scope | URL or controller |
| ActiveSearch | generation, keyHash, AbortController | Runtime |
| CacheEntry | key, results, fetchedAt, lastUsedAt | Bounded cache |
| SearchView | status, activeResultId, error | UI state |

## Interfaces

---

Expose a search controller that accepts a cancellable SearchFn, a complete non-query scope, and measured debounce and cache policy. It returns live input, explicit status, current results, selection identity, and clear or retry commands.

Contract checks:
- SearchFn receives the complete SearchKey and AbortSignal.
- Scope includes locale, filters, sort, and permission identity.
- Status distinguishes idle, loading, refreshing, success, no-results, and error.
- Timer, generation, controller, and raw cache stay private.
- Clear and retry preserve predictable input and selection behavior.

---

```typescript
type SearchScope = Omit<SearchKey, 'query'>;

interface UseSearchOptions {
  debounceMs?: number;
  cacheTtlMs?: number;
  maxCacheEntries?: number;
  minQueryLength?: number;
}

type SearchFn<T> = (
  key: SearchKey,
  context: { signal: AbortSignal },
) => Promise<T[]>;

interface UseSearchResult<T> {
  input: string;
  setInput(value: string): void;
  status: SearchStatus;
  results: T[];
  error: string | null;
  activeResultId: string | null;
  clear(): void;
  retry(): void;
}

declare function useSearch<T>(
  searchFn: SearchFn<T>,
  scope: SearchScope,
  options?: UseSearchOptions,
): UseSearchResult<T>;

```

### Core interfaces

| Interface / prop | Shape (example) | Design rationale |
| --- | --- | --- |
| SearchFn | (input, { signal }) => Promise<Result[]> | The caller receives the complete search input and AbortSignal, so obsolete network work can be cancelled without exposing controller ownership to the view. |
| UseSearchOptions.debounceMs | number configured from product evidence | debounceMs controls when typing intent is accepted; explicit submission may bypass it. |
| UseSearchOptions.cacheTtlMs | number (ms) | "cacheTtlMs defines how long cached results are considered fresh. If a query is repeated within that window, we serve cached results instantly." |
| UseSearchResult | { input, setInput, status, results, error, activeResultId, clear, retry } | The view can render every state and preserve keyboard selection without seeing request runtime. |
| Status enum | 'idle' \| 'loading' \| 'refreshing' \| 'success' \| 'no-results' \| 'error' | Status distinguishes empty input, first load, background refresh, useful results, zero results, and failure. |

### Required public behavior

- A way to update the query (setQuery) while keeping typing instant.
- A status field and error string to distinguish loading/success/error.
- A results array that always reflects the latest valid query.
- A clear() helper to reset query + results in one call.
- A retry() helper to re-run the last debounced search after an error.
- Config for debounceMs, cacheTtlMs, and minQueryLength.

### Controller-internal state

- Timer handles or raw setTimeout references.
- Internal request ids or the full internal cache map.
- Low-level flags like isDebouncing that don’t map directly to UX decisions.
- APIs that require the caller to manage their own request ordering.
- APIs that change shape depending on which state you’re in.

### Integration flow

1. Setup: The component calls useSearch(searchFn, { locale, filters, sort, permissionScope }, measuredOptions) and binds the field to search.input and search.setInput.
2. Typing: As the user types, setInput updates input immediately. The controller debounces accepted intent without delaying composition or field rendering.
3. Cache + async search: When intent is accepted, the controller checks the exact complete key. A miss or stale entry starts SearchFn with AbortSignal and a private generation guard.
4. Response / error: On success, the hook updates results, sets status = 'success', clears error, and writes to cache. On failure, it sets status = 'error', populates error, and exposes retry() so the UI can render a Retry button.
5. Clear: Clear aborts obsolete work, empties input and visible state, resets selection, and returns to idle without exposing or necessarily deleting the bounded cache.

| Signal | Value | Interpretation |
| --- | --- | --- |
| API style | Hook + options | One call wires in debouncing, caching, and state. |
| UI contract | Query + state | Components only need query, setters, and status flags. |
| Strong signal | No implementation leaks | Callers never see timers, request ids, or cache internals. |

### Contract checkpoint

A good search API makes complex behavior (debounce, caching, stale-response handling) invisible to consumers. If another engineer can build a polished search box using just your hook’s signature and state fields, you’ve designed the interface well.

### UI-facing contract

SearchFn receives the complete SearchKey and AbortSignal. A cancelled promise is not shown as an error. Every success passes the active generation and key check before cache or UI commit. Result identities and accessible labels are stable enough to preserve keyboard selection across a background refresh.

### Keystroke-to-accepted-result path

1. Accept intent: Debounce incomplete text but react immediately to explicit filter submission.
2. Check cache: Read only the exact full key; optionally show stale data while revalidating.
3. Cancel and call: Abort obsolete work, create the next generation, and start the service.
4. Publish: Commit results only when generation and key still match, then repair selection by result identity.

# Failure Modes

Cover performance, robustness, and how you’d tune the experience over time.

---

Start with debounced intent, a bounded cache, AbortController cancellation, and a generation acceptance guard. Measure request acceptance, cache usefulness, abandoned work, and perceived latency before tuning debounce or expiry.

Correctness comes first: complete cache identity, bounded expiry, true transport cancellation when supported, stale-result suppression regardless of cancellation, stable previous results during refresh, and distinct empty, loading, no-results, and error states.

---

### Baseline safeguards

- Use a product-configured debounce for typing intent rather than starting a request on every change.
- Apply one documented query canonicalization contract before caching or calling search; do not blindly lowercase locale-sensitive text.
- Do not search for very short queries (configurable minQueryLength).
- Accept a response only when both its generation and complete SearchKey still match current intent.
- Reset results or show a dedicated state when the query becomes empty.
- Show small, inline error states with a Retry action instead of blocking the whole UI.

### Search robustness checks

- Tuning debounce delay based on typical latency and user behavior.
- Choosing cache TTL (time-based) vs LRU-style (size-based) eviction.
- Distinguishing "no results" from "failed request" in the UI and state.
- Avoiding visual flicker (e.g. not showing a spinner for ultra-fast responses).
- Supporting keyboard navigation and ARIA roles in result lists (accessibility).
- Handling multiple search inputs on the same page (separate vs shared cache).

### Optimization decision matrix

| Topic | Angle | Decision rationale |
| --- | --- | --- |
| Debounce tuning | Responsiveness vs load | Choose an initial debounce as a testable product hypothesis, then tune it from accepted-query latency, request volume, typing patterns, and device evidence. |
| Abort plus stale-result suppression | Out-of-order responses | Every call receives AbortSignal and captures generation plus complete key. Aborting releases obsolete work; matching generation and key remains the commit rule. |
| Cache invalidation | TTL and size limits | Each entry stores freshness and recency metadata. Product data determines the freshness window, while a hard entry or memory bound prevents unbounded growth. |
| Slow vs fast typing | UX consistency | A measured debounce should work across different typing cadences: pauses may produce progressive searches, while rapid edits coalesce obsolete intent. The input always shows the current query even when results still represent an earlier accepted key. |
| Empty / error states | Clarity for the user | "Empty query shows a neutral state or suggestions, not stale results. An error sets status = 'error' and shows a small message with a Retry button that calls the same query again, without wiping what the user typed." |

### Search tuning rollout

1. Ship cancellation-safe baseline: Implement measured debounce, a complete-key cache, transport cancellation, and generation-plus-key stale-response suppression. Handle idle, loading, refreshing, success, no-results, and error as distinct states.
2. Observe behavior: Log how often searchFn is called, how often cache hits occur, and how often errors happen. Check if users experience noticeable lag or flickering loaders.
3. Tune debounce & cache: Adjust debounceMs, cacheTtlMs, and minQueryLength. If you see too many calls, increase debounce or min length; if the UI feels laggy, reduce debounce slightly.
4. Harden the cache: Add freshness and hard size bounds. If the product later persists search cache across reloads, validate its schema before hydration; an in-memory cache has no parse-recovery path to invent.
5. Polish UX & accessibility: Ensure loading indicators are subtle, error messages are clear, "no results" is differentiated from empty input, and the results list is keyboard- and screen-reader-friendly.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Key performance lever | Debounce delay | Controls request volume vs perceived responsiveness. |
| Key safety lever | Request id check | Prevents stale responses from overwriting newer queries. |
| Key robustness lever | Cache TTL + size | Keeps cached data fresh and prevents unbounded growth. |

### Latest-intent invariant

A great real-time search isn’t just "it updates as you type". It calls search at the right times, reuses results intelligently, survives flaky responses, and keeps the UI in sync with the latest query—especially when users type fast and networks are slow.

### Request, cache, and selection failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Abort races success | Generation and key still reject the obsolete result. | Stale data never replaces current intent. |
| Cache grows | Evict by bounded recency and scope. | Long sessions do not retain every query. |
| Request fails | Keep compatible previous results and expose retry. | Error is distinct from empty results. |
| Selected result disappears | Move active identity to the nearest valid option. | Keyboard focus remains predictable. |

### Accessibility behavior

Use a labeled search field and implement combobox behavior only when interactive suggestions require it. Maintain active descendant and result count deliberately, preserve text composition events, and announce loading or result-count changes without repeating every keystroke. Empty, no-results, error, and offline states need distinct readable copy.

### Rollout and measurement

Measure accepted queries, cancelled work, stale-result rejection, cache hit usefulness, time to first useful result, and keyboard selection stability. Tune debounce by query and device evidence, not a universal delay, and canary cache changes independently from result presentation.

### Technical references

- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Browser cancellation controller and AbortSignal.
- [W3C combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — Keyboard and focus behavior for suggestion popups.

# Metrics

- Typical debounce delay: 300–500ms. Fast enough to feel responsive, slow enough to avoid spam.
- Cache key: Complete search identity. Normalized query plus locale, filters, sort, and any permission scope that changes results.
- Key safety rule: Ignore stale responses. Only apply results if they match the latest query/request id.
- State ownership: Search hook / controller. One place manages input, accepted key, results, cache, generation, and cancellation.
- Key pattern: Debounce + abort + guard. Cancellation releases work; generation and key matching protect correctness.
- UX goal: Always reflect latest query. Results on screen must match what’s in the input, no matter the timing.
- Core model: SearchView + cache. Together they describe what the user sees and what we can reuse.
- Key safety field: generation + key. Prevents stale responses from overriding active intent.
- Cache key rule: query + locale + filters + sort + scope. Normalize each dimension that can change the result set.
- API style: Hook + options. One call wires in debouncing, caching, and state.
- UI contract: Query + state. Components only need query, setters, and status flags.
- Strong signal: No implementation leaks. Callers never see timers, request ids, or cache internals.
- Key performance lever: Debounce delay. Controls request volume vs perceived responsiveness.
- Key safety lever: Request id check. Prevents stale responses from overwriting newer queries.
- Key robustness lever: Cache TTL + size. Keeps cached data fresh and prevents unbounded growth.

# Rollout

### Search tuning rollout

1. Ship cancellation-safe baseline: Implement measured debounce, a complete-key cache, transport cancellation, and generation-plus-key stale-response suppression. Handle idle, loading, refreshing, success, no-results, and error as distinct states.
2. Observe behavior: Log how often searchFn is called, how often cache hits occur, and how often errors happen. Check if users experience noticeable lag or flickering loaders.
3. Tune debounce & cache: Adjust debounceMs, cacheTtlMs, and minQueryLength. If you see too many calls, increase debounce or min length; if the UI feels laggy, reduce debounce slightly.
4. Harden the cache: Add freshness and hard size bounds. If the product later persists search cache across reloads, validate its schema before hydration; an in-memory cache has no parse-recovery path to invent.
5. Polish UX & accessibility: Ensure loading indicators are subtle, error messages are clear, "no results" is differentiated from empty input, and the results list is keyboard- and screen-reader-friendly.

### Technical references

- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Browser cancellation controller and AbortSignal.
- [W3C combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — Keyboard and focus behavior for suggestion popups.
