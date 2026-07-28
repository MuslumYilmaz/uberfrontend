---
title: "News Feed / Timeline Front-End System Design"
slug: "news-feed-timeline"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "news feed timeline frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for News Feed / Timeline Front-End System Design."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for News Feed / Timeline Front-End System Design."
unique_angle: "Design a news-feed timeline with cursor pagination, ranked and live updates, deterministic merge rules, stable scroll anchors, media loading, and recovery."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for News Feed / Timeline Front-End System Design."
competitor_query: "News Feed / Timeline Front-End System Design frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://www.w3.org/WAI/ARIA/apg/patterns/feed/"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

news feed timeline frontend system design. Design a news-feed timeline with cursor pagination, ranked and live updates, deterministic merge rules, stable scroll anchors, media loading, and recovery.

## Requirements

Design a mixed-media feed that combines cursor paging, server-authoritative ranked order, buffered live updates, optimistic interactions, and stable scrolling on mid-range devices.

---

What you are solving:
A timeline that mixes text, images, video, and ads with infinite scroll and live updates. The UI must be fast on mid-range devices and resilient to bursty updates.

Decision surface:
- Pagination vs cursor-based loading.
- Virtualization and media lazy-loading.
- Dedupe + ordering of live updates.
- Optimistic interactions without re-render storms.
- Scroll anchoring and UX stability.

### Ordering and stability goal

The feed should become useful quickly, preserve the reader's position, and display one server-authoritative ranked projection even when pages, refreshes, and live events overlap.

---

### Feed loading and update journey

1. 1) Load first ranked page: Fetch first page, render above-the-fold quickly with skeletons and placeholders.
2. 2) Scroll: Prefetch next page near the end, append to store, and keep scroll position stable.
3. 3) Media: Lazy-load images/video via IntersectionObserver and reserve space to avoid layout shift.
4. 4) Real-time: Buffer incoming items and show a 'New posts' banner to prevent jumpy scroll.
5. 5) Interactions: Optimistically update likes/comments and reconcile server responses.
6. 6) Refresh: Periodic refresh to pick up missed items and revalidate cache.

### Non-functional expectations

- Smooth scroll (avoid layout thrash).
- Bounded DOM size via virtualization.
- Fast first item render and low CLS.
- Stable UI under bursty updates.
- Efficient network usage and caching.
- Accessible interactions (keyboard + focus states).

### Ordering strategies

| Strategy | Pros | Cons | When to use |
| --- | --- | --- | --- |
| Chronological | Simple mental model | May reduce relevance | Small or time-driven feeds |
| Ranked | Personalized relevance | Needs ranking infra | Large social feeds |
| Hybrid | Balance recency + relevance | More complex merges | Most modern feeds |

| Signal | Value | Interpretation |
| --- | --- | --- |
| Scroll quality | Measured per device | Track long tasks, input delay, and visible jumps. |
| Page size | Product hypothesis | Tune from payload, rendering cost, and pagination behavior. |
| Live presentation | Buffered affordance | Retain accepted events while coalescing visible updates. |

### Pitfall to avoid

Inserting real-time items directly into the list while the user scrolls can cause jumpy scroll. Use a buffer + banner and let the user choose when to insert.

### Frontend boundary

The frontend owns cursor paging, live-update buffering, entity merge, ranked-order revisions, scroll anchoring, media priority, mutations, and accessible feed controls. The ranking service is an abstract contract; fan-out, moderation authority, and durable storage remain outside the client.

# Clarifying Questions

- How fresh must the feed be (seconds vs minutes)?
- Is strict ordering required or is eventual ordering OK?
- What content types are present (text, image, video, ads)?
- What is the expected feed length and update rate?
- Do we need offline caching or only in-memory cache?
- Do we support editing/deleting posts and how do we reflect that?
- Is ranking/personalization done on the server or client?
- Are there privacy or visibility rules per item?

# Architecture

Separate ingestion, normalized entities, server-versioned order, optimistic overlays, and rendering. Pages and live events may update entities, but only a server-authoritative FeedOrder determines ranked placement.

### Authoritative ranked-order boundary

The UI should render from a single source of truth (ids + entities). All merges, dedupe, and ordering happen before state hits the view layer.

---

### Suggested flow

```text
Paged order API ──→ normalize posts ──→ entity store ─┐
Rank refresh ─────→ accept newer FeedOrder revision ────────────┼─→ anchored visible projection
Live event stream ─→ dedupe event → update entity / pending set ┘             ↑
Media loader ───────────────────────────────────────────────────→ viewport tracker
```

---

### Read/write paths

1. Hydrate normalized first page: Fetch page -> normalize -> store -> render window.
2. Paging: Prefetch next cursor -> dedupe -> append ids.
3. Realtime: Stream -> buffer -> merge -> banner -> insert on user action.
4. Mutations: Optimistic update -> server ack -> reconcile or rollback.

Key modules:
- PageLoader (pagination + prefetch)
- StreamBuffer (batch realtime items)
- Merge/Dedupe (avoid duplicates, keep order)
- FeedStore (normalized state)
- VirtualizedList (render window only)
- MediaLoader (lazy + prefetch)

Tradeoffs to explain:
- Cursor vs offset.
- Chronological vs ranked ordering.
- Immediate insert vs buffered banner.
- Client cache size vs memory footprint.

### Update paths (how data changes the UI)

| Source | Flow | UI impact |
| --- | --- | --- |
| Paging | API -> merge -> store | Append items to bottom |
| Realtime | Stream -> buffer -> merge | Show banner, insert on user action |
| Mutations | Optimistic update -> server ack | Instant UI + reconcile |
| Refresh | Refetch first page | Dedupe + update existing |

### Worked example: ranked refresh while reading mid-feed

The reader is anchored on post p20 when a refresh returns a new rank revision that moves existing posts and adds p3. Replacing the array would jump the viewport and can duplicate an item already received live.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Reader pauses mid-feed | Store anchor p20 and intra-item offset. | The current reading position remains stable. | Array index is not the anchor. |
| Live p3 arrives | Normalize entity and hold its ID in a pending-new set. | Show one new-post affordance. | Live arrival does not force placement. |
| Rank revision 14 returns | Merge entities, deduplicate p3, and accept one ordered ID document. | Keep the old projection until anchor correction is ready. | One ID has one entity. |
| Reader applies refresh | Render revision 14, mount p20, and restore its offset. | The feed changes once without losing context. | Ordering and anchoring reconcile together. |

### Rank revision and projection

Treat ranked order as a server-authoritative versioned document rather than sorting client entities by timestamps, scores, or live arrival. A refresh can replace order while reusing normalized posts. Before committing the newer projection, locate the current anchor, mount it in the new order, and compute offset correction. If the anchor no longer exists, use the documented surviving-neighbor policy.

# Tradeoffs

## Data

Model the feed as ordered ids + entity map. Track cursors, loading state, and a realtime buffer for bursty updates.

### Normalization principle

Keep a single entity per id so likes/comments and edits are O(1) updates without scanning the whole list.

```typescript
type PostId = string;

interface Post {
  id: PostId;
  entityVersion: number;
  type: 'text' | 'image' | 'video' | 'ad';
  authorId: string;
  body: string;
  createdAt: number;
  likeCount: number;
  viewerLiked: boolean;
  mediaUrl?: string;
}

interface FeedOrder {
  queryKey: string;
  rankRevision: number;
  orderedIds: PostId[];
  nextCursor: string | null;
}

interface LiveFeedEvent {
  eventId: string;
  sequence: number;
  resumeCursor: string;
  type: 'post-upserted' | 'post-deleted' | 'rank-invalidated';
  post?: Post;
  postId?: PostId;
  rankRevision?: number;
}

interface PendingReaction {
  commandId: string;
  postId: PostId;
  desiredLiked: boolean;
  basedOnVersion: number;
}

interface FeedState {
  entities: Record<PostId, Post>;
  order: FeedOrder | null;
  pendingLiveIds: PostId[];
  acceptedEventIds: Record<string, true>;
  resumeCursor: string | null;
  optimisticReactions: Record<PostId, PendingReaction>;
}

```

### State buckets (how to explain ownership)

| Category | Examples | Where stored |
| --- | --- | --- |
| Server state | Feed items, counts | entities + ids |
| UI state | loading, errors, scroll position | local UI state |
| Ephemeral | realtime buffer, optimistic changes | transient store |

### Data invariants

- FeedOrder IDs are unique and retain server-authoritative ranked order.
- Entities accept only newer entityVersion values.
- Buffered live IDs do not gain ranked placement until an order revision includes them.
- Optimistic reactions overlay one entity and reconcile by command identity.

### Entity, order, and view ownership

Store Post entities separately from FeedOrder documents. A FeedOrder has rank revision, ordered IDs, page cursors, and freshness. Pending live IDs are a view overlay until the reader applies them. FeedViewState stores anchor identity, offset, filters, and visible range. Optimistic reaction commands overlay one post entity.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| Post | id, author, body, media, version | Entity cache |
| FeedOrder | rankRevision, orderedIds, cursors | Query cache |
| LiveBuffer | pendingIds, resumeCursor, gap | Stream state |
| FeedView | anchorId, offset, visibleRange | Local view |

### Entity freshness and media state

Post content, reaction counts, viewer reaction, moderation visibility, and ranked position can change on different revisions. Record field or entity version where the contract provides it, and keep a pending reaction overlay separate from confirmed counts. Media load phase, selected candidate, and decoded resource are local view resources; they do not belong in the durable Post entity. This separation lets a media retry occur without replacing textual content or rank order.

A compact LiveBuffer stores event IDs already accepted, resume cursor, pending post IDs, and any detected sequence gap. Its pending IDs are not automatically appended to ranked order. The visible new-post count is derived from the pending set after deduplication. FeedView stores anchor ID, intra-item offset, filters, visible range, and whether the reader has requested placement of new material.

## Interfaces

Expose a small API to the UI. The UI should not know about dedupe or buffering internals.

```typescript
interface FeedQuery {
  accountId: string;
  locale: string;
  filters: Record<string, string[]>;
  experimentKey: string;
}

interface FeedPage {
  posts: Post[];
  order: FeedOrder;
}

interface ReactionCommand {
  commandId: string;
  postId: PostId;
  desiredLiked: boolean;
  basedOnVersion: number;
}

interface FeedAdapter {
  loadFeed(query: FeedQuery, cursor: string | null, signal: AbortSignal): Promise<FeedPage>;
  refreshFeed(query: FeedQuery, signal: AbortSignal): Promise<FeedPage>;
  subscribeFeed(
    query: FeedQuery,
    resumeCursor: string | null,
    onEvent: (event: LiveFeedEvent) => void,
  ): () => void;
  react(command: ReactionCommand, signal: AbortSignal): Promise<Post>;
}

```

### API considerations

| Endpoint | Purpose | Notes |
| --- | --- | --- |
| GET /feed?cursor=... | Paging | Prefer cursor over offset |
| GET /feed/updates?since=... | Refresh | Fetch missed items |
| POST /feed/:id/like | Like | Optimistic UI |
| POST /feed/:id/comment | Comment | Reconcile counts |

### Dedupe rule

All sources must de-duplicate by id before updating state. The UI should never show the same item twice even if it arrives from paging + realtime.

### UI-facing contract

Paged responses carry an opaque cursor and server-authoritative rank revision. Live events carry event ID, sequence, resume cursor, entity version, and optional rank invalidation. A refresh returns a complete ordered projection; the client applies it with anchor correction. Reaction commands use idempotency and post version without changing rank order.

### Page-and-event-to-feed path

1. Page: Load the first order, normalize posts, and request later cursors once.
2. Buffer live: Validate events and show a pending count unless the user is at the live edge.
3. Refresh order: Accept a newer rank revision and compute the anchor-preserving projection.
4. Mutate: Overlay reactions or hides and reconcile the authoritative post version.

### Versioned read and mutation contracts

loadFeed accepts a complete query, opaque cursor, and AbortSignal, then returns posts plus one server-authoritative FeedOrder. refreshFeed may return a newer complete order. subscribeFeed resumes from a cursor and emits event ID, sequence, entity version, rank revision, and the next resume cursor. react accepts desired state, based-on entity version, and command identity; hiding or reporting uses a separate capability-checked command.

The adapter validates required fields and quarantines one malformed post rather than rejecting an otherwise useful page. Unknown optional post modules render a safe unsupported block. Components never concatenate cursor strings, infer ranking scores, or issue fetch calls directly. All accepted reads and events enter the same normalization and version checks, which keeps pagination, refresh, and live delivery from creating competing stores.

# Failure Modes

Show that you can keep the feed smooth under heavy load. Optimize rendering, media, and update frequency.

### Performance techniques

- Virtualize the list; cap DOM nodes.
- Retain accepted events and coalesce visible projection updates at a measured cadence.
- Lazy-load media and use placeholders to avoid layout shifts.
- Memoize row components to reduce re-rendering.
- Prefetch the next page when near the end.
- Schedule deferrable work during measured idle periods only when the platform capability and product priority permit it.

### Common bottlenecks and fixes

| Problem | Cause | Fix |
| --- | --- | --- |
| Janky scroll | Too many DOM nodes | Virtualize + reduce row complexity |
| Layout shift | Unknown media size | Reserve space + aspect ratio boxes |
| Duplicate items | Multiple sources | Merge + dedupe by id |
| Stale ordering | Out-of-order arrivals | Accept only a newer server-authoritative FeedOrder revision |

| Signal | Value | Interpretation |
| --- | --- | --- |
| Mounted content | Measured bound | Window only when DOM and layout evidence justify it. |
| Media prefetch | Viewport evidence | Balance direction, connection, decoding cost, and waste. |
| Projection cadence | Measured hypothesis | Coalesce paint without losing accepted events. |

### High-risk pitfall

Do not insert items above the viewport without anchoring; it will shift scroll position and feel broken. Use a banner or scroll anchoring APIs.

### Observability

- Track CLS, INP, and long tasks during scroll.
- Measure drop-off at page boundaries.
- Log dedupe rate and buffer size to detect stream bursts.

### Paging, ranking, and mutation failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Page overlaps previous IDs | Deduplicate without reordering committed earlier pages. | No repeated card appears. |
| Rank refresh drops anchor | Choose the nearest surviving neighbor and explain major filter changes. | Navigation remains meaningful. |
| Media fails | Keep text, dimensions, and controls with a fallback. | One asset does not collapse the card. |
| Stream gap persists | Mark live freshness and request snapshot repair. | Paged reading remains usable. |

### Accessibility behavior

Use a feed or semantic list with named articles and a visible Load More path. New ranked or live items never steal focus or auto-scroll a reader. Media has appropriate alternatives, reaction controls expose state, and grouped loading or new-item status avoids a stream of announcements. Windowing must preserve reachable focus and article context.

### Rollout and measurement

Prove paging, deduplication, and anchor restoration before enabling live inserts or aggressive windowing. Test overlapping pages, rank revisions, removed anchors, media failures, offline retry, mobile layout, keyboard navigation, and long sessions. Track jumps, duplicate IDs, missing pages, and recovery.

### Long-session performance and content stability

Prioritize text and geometry for the first useful cards, then schedule media from viewport direction and connection evidence. Reserve image aspect ratios, cancel obsolete preloads, and cap decoded resources. Measure mounted DOM, layout work, memory, and focus behavior before adding windowing. When windowing is justified, keep the anchor and focused article mounted until a safe handoff, and test variable-height corrections caused by translated text, media, and moderation changes.

Cache isolation includes account, locale, filters, and experiment assignment when they affect content. Signing out clears personal feed state. Telemetry records cursor, rank revision, merge outcome, gap, layout shift, and user-visible recovery without copying post bodies. Rollout can separate new rank projection, live buffering, media policy, and windowing behind independent flags so a scroll-jump regression does not require disabling basic pagination.

### Technical references

- [W3C ARIA feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) — Feed semantics and progressive loading interaction.
- [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — Asynchronous viewport observation for prefetch hints.

# Metrics

- Scroll quality: Measured per device. Track long tasks, input delay, and visible jumps.
- Page size: Product hypothesis. Tune from payload, rendering cost, and pagination behavior.
- Live presentation: Buffered affordance. Retain accepted events while coalescing visible updates.
- Mounted content: Measured bound. Window only when DOM and layout evidence justify it.
- Media prefetch: Viewport evidence. Balance direction, connection, decoding cost, and waste.
- Projection cadence: Measured hypothesis. Coalesce paint without losing accepted events.

# Rollout

### Technical references

- [W3C ARIA feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) — Feed semantics and progressive loading interaction.
- [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — Asynchronous viewport observation for prefetch hints.
