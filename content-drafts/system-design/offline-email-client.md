---
title: "Gmail-Style Offline Email Client Frontend System Design"
slug: "offline-email-client"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers designing data-heavy, offline-capable web applications"
intent: "Teach a browser-first architecture for a trustworthy email client without drifting into mail delivery infrastructure or claiming knowledge of Gmail's private implementation."
target_words: 3600
primary_keyword: "Gmail frontend system design"
status: "converted"
notes_for_conversion:
  - "Convert into the five normal system-design RADIO sections and keep the complete answer free and indexable."
  - "Preserve the distinction between a server-authoritative mailbox projection, durable local user intent, disposable cache data, and ephemeral view state."
  - "Keep lost-response send reconciliation, cursor-expiry recovery, HTML sanitization, remote-image privacy, accessibility, and quota handling explicit."
search_intent: "Learn how to design an offline-first web email client that reconciles mailbox sync, local drafts, and send outcomes."
reader_promise: "The reader can design a normalized, offline-capable email UI with explicit cache, outbox, security, and accessibility boundaries."
unique_angle: "Treat the mailbox as a server-authoritative projection cached locally while drafts and outbox commands remain durable user intent until they reconcile with sync."
what_this_adds_beyond_basics: "It connects incremental mailbox sync, versioned drafts, an idempotent browser outbox, cursor-expiry recovery, safe message rendering, storage pressure, multi-tab behavior, accessible virtualization, and measurable rollout in one frontend design."
competitor_query: "\"Gmail frontend system design\" OR \"email client frontend system design\" OR \"offline email client architecture\""
competitor_takeaways:
  - "Search results include short frontend summaries that name common components but do not follow offline state through cache hydration, command durability, and reconciliation."
  - "Broader Gmail system-design articles focus mainly on backend delivery, mailbox storage, queues, and distributed services rather than the browser boundary."
competitor_gaps:
  - "The reviewed results do not provide a complete browser-first answer that separates authoritative mailbox state from durable local intent and disposable IndexedDB cache entries."
  - "Lost send responses, expired sync cursors, safe HTML, remote-image privacy, multi-tab command ownership, and accessible virtualization are rarely treated as one coherent design."
sources:
  - "https://www.linkedin.com/posts/gyaansetu-webdev_frontenddevelopment-emailclient-systemdesign-activity-7415480592718573568-hdoB"
  - "https://www.techinterview.org/post/3233463497/system-design-email-system-gmail/"
  - "https://developers.google.com/workspace/gmail/api/guides/sync"
  - "https://developers.google.com/workspace/gmail/api/guides/threads"
  - "https://developers.google.com/workspace/gmail/api/guides/labels"
  - "https://developers.google.com/workspace/gmail/api/guides/drafts"
  - "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API"
  - "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
last_fact_checked_at: "2026-07-29"
reviewed_by: "FrontendAtlas editorial"
confidence: "high"
---

# Prompt

Design the frontend architecture for a Gmail-style web email client that stays useful without a network connection. A signed-in user can browse a large inbox, open cached threads, compose and revise drafts, apply labels, search, and request a send while offline. After connectivity returns, incremental mailbox sync refreshes data, submits queued intent, and converges with changes from other devices or tabs. The answer should focus on browser state, persistence, synchronization, rendering, accessibility, security, and the API contracts the frontend consumes.

This Gmail frontend system design case is based on recognizable email-client behavior and public Gmail API documentation. It is not a confirmed, leaked, or attributed Google interview question. Its example endpoints are intentionally product-neutral and do not claim to describe Gmail's private frontend or backend architecture. Gmail is a useful behavioral reference because its public documentation gives concrete vocabulary for threads, labels, drafts, and incremental synchronization; those public concepts are inspiration, not company provenance.

The central design decision is to avoid treating every locally visible value as the same kind of state. The mailbox snapshot and deltas are server-authoritative facts. IndexedDB keeps a bounded local projection so the interface can start quickly and work offline. Draft edits and outbox commands are durable user intent and must survive a cache rebuild. Selection, expansion, composer layout, and loading indicators are ephemeral view state. Sanitized message bodies and attachment previews sit behind a security boundary and may be evicted without losing intent.

Assume the typical mailbox has tens of thousands of threads, a thread list page returns dozens of summaries, and a thread can contain many messages. Header and snippet data are small compared with HTML bodies and attachments. The client may receive duplicate deltas, lose a command response after the server committed it, open in multiple tabs, exceed storage quota, or discover that its incremental-sync cursor has expired. The UI must make freshness and offline limits honest rather than presenting cached data as current.

The primary experiences are inbox and label lists, a route-addressable thread reader, a composer with durable autosave, a search surface, and responsive navigation. On desktop, list and reader can share the screen. On narrow displays they become stacked routes or panes so neither is compressed into unreadable columns. Mail delivery, SMTP routing, spam classification, server search indexing, attachment scanning infrastructure, and mailbox database sharding remain outside the frontend scope.

# Clarifying Questions

## Product and offline scope

- Which actions must work offline? Reading already cached thread summaries and bodies, creating or editing a draft, requesting a send, and changing labels are supported. Opening an uncached body or attachment explains that a connection is required.
- What does search mean offline? Online search covers the authoritative mailbox through a server endpoint. Offline search is explicitly labeled as covering cached content only. The client never implies that a partial local index searched the entire account.
- How long should intent survive? Drafts and unsent commands survive restarts, ordinary cache eviction, cursor-expiry recovery, and service-worker upgrades. They are removed only after an authoritative outcome or an explicit user action.
- Can several tabs be open? Yes. Tabs coordinate advisory ownership and invalidation through `BroadcastChannel`, but server versions and idempotency records remain the authority.
- Are all attachments cached? No. Bodies and attachment previews load lazily. Explicitly saved offline resources follow a budget and sensitivity policy; large attachments normally remain remote.
- Does an offline Send mean delivered? No. It means the command is durably queued. The UI distinguishes queued, submitting, accepted, failed, and needs-attention states.

## Identity, versions, and reconciliation

A thread ID, message ID, draft ID, command ID, and sync cursor solve different problems. A thread groups related messages. Messages are immutable records from the mailbox service, though label membership and thread summary projections can change. A draft is a stable editable container whose current content revision can be replaced. A command ID identifies one client intent, while an idempotency key makes retries converge on the same server operation. The opaque sync cursor identifies a point in mailbox change history and cannot be compared, incremented, or reconstructed by the browser.

Every draft save or send includes the last remote draft revision the client observed. Label commands include the thread revision on which the change was based. Conflicts are not solved by timestamp alone: a server response can be delayed, device clocks differ, and a later arrival can describe an older version. Version preconditions surface conflicts, while command identity and later mailbox events reconcile ambiguous outcomes.

## User-visible states

The shell needs explicit states for initial load, cache hydration, background synchronization, fresh/caught-up data, offline cached data, stale data, an expired cursor and full resync, quota pressure, authentication expiry, and account switching. The thread reader separately distinguishes summary loaded, body loading, body available, body unavailable offline, body blocked for safety, and attachment permission or scan states. The composer distinguishes clean, locally dirty, saving locally, queued for remote save, remotely saved, conflict, queued to send, submitting, sent, and failed with recovery.

An account switch is security-sensitive. The client closes channels, cancels requests, stops outbox work, clears in-memory entities, and opens the storage namespace for the selected account. It never displays account A's cached snippets under account B's shell while asynchronously cleaning up.

## Success criteria and budgets

Targets begin as fixture-based service objectives, not universal promises. On a representative mid-range phone with a warm cache, the shell and cached first page should become useful within about one second. List scrolling and keyboard movement should avoid long tasks over 50 ms in the measured fixture. A mailbox delta received while the app is active should normally become visible within 500 ms. Draft keystrokes update memory synchronously, persist locally after a short idle window, and flush on visibility loss when possible. No accepted command creates a duplicate local or remote outcome when its response is lost and retried.

At 320 and 390 CSS pixels, the document must not overflow horizontally. Long subjects, addresses, quoted text, bidirectional content, tables, and code-like message content wrap or scroll inside their own boundary. Keyboard-only users can traverse the list, open a thread, return to the same logical row, compose, label, and resolve errors. Screen-reader announcements describe meaningful state changes without reading every synchronization event.

# Architecture

## Layers and ownership

The route shell creates one mailbox session keyed by account and mailbox. A mailbox gateway fetches snapshots, deltas, thread details, bodies, drafts, and command outcomes. A sync coordinator serializes initial hydration, foreground refresh, cursor recovery, and invalidation handling. A normalized store holds server projections. An IndexedDB repository persists bounded projections plus durable draft and outbox stores. An outbox coordinator retries eligible commands. A body renderer transforms untrusted email content into a safe document fragment. A list viewport virtualizes large collections. A cross-tab coordinator advertises activity and requests refreshes without becoming authoritative.

The data path is:

```text
route -> account-scoped local repository -> normalized mailbox store -> selectors -> UI
  |              ^                            ^
  |              |                            |
  +-> snapshot/delta API -> sync coordinator --+
  +-> durable outbox -> command API -> mailbox delta
  +-> invalidation signal ---------> delta fetch
```

Push, server-sent events, or a service-worker message says only that something may have changed. It never patches the entity store directly. The sync coordinator follows the signal with `GET /mailboxes/:id/changes?after=<cursor>`, validates the response, applies one transaction, and advances the persisted cursor only after all included changes are durable. Polling can use the same path, making the transport replaceable.

## Canonical state model

The canonical browser model has four parts. First, a normalized, server-authoritative projection maps threads, messages, and labels by ID and stores ordered ID lists for the active label or query. Second, durable local intent stores stable draft documents and outbox commands independently of the projection. Third, ephemeral view state stores routes, selection, focus anchors, filters, pane layout, and transient request status. Fourth, a disposable resource cache stores sanitized bodies, remote search pages, attachment metadata, decoded images, and local indexes.

This split controls recovery. A normal delta changes the projection and may acknowledge local intent. Storage pressure evicts disposable resources before old projections. An expired cursor discards and rebuilds the server projection while leaving drafts and outbox records untouched. Logout or account removal follows the product's explicit retention policy and can delete the whole account namespace; routine sync recovery cannot.

## Snapshot and delta synchronization

On first use, fetch a snapshot containing an opaque `syncCursor`, labels, thread summaries, relevant message headers, and page tokens. Persist the snapshot and cursor in one IndexedDB transaction, then publish it to the store. On a warm start, hydrate the latest coherent local snapshot immediately, label it with its last-sync time, and request deltas from the stored cursor. If a delta page has another page token, apply every page before declaring the mailbox caught up.

Each event is idempotent by entity ID and revision. `message.upserted` inserts an unseen immutable message or fills fields allowed by its revision. `message.removed` removes the server projection but does not erase a related local draft. `thread.updated` changes membership, counts, participants, latest-message pointers, and label summaries. `label.updated` changes metadata. `draft.replaced` advances the remote draft revision and reconciles the stable local draft container.

If the server rejects the cursor because history is no longer retained, the coordinator enters a visible resync state. It downloads a fresh snapshot into a staging generation, merges it atomically into the normalized projection, replays still-pending local label overlays for presentation, and swaps generations. It preserves drafts, outbox commands, composer recovery data, and useful selection IDs. If the selected thread no longer exists, focus moves predictably to the nearest remaining list item and the UI explains the removal.

## Worked example: accepted send, missing response

The user writes draft `d7` while offline and selects Send. The client first commits the latest content and an outbox command `c92` with idempotency key `send:d7:c92` in one local transaction. The composer closes only after that transaction succeeds, and the Sent view may show a clearly labeled queued placeholder keyed by `c92`.

Connectivity returns. One tab obtains advisory outbox ownership and posts `draft.send` with the command ID, idempotency key, draft base revision, and content digest. The server accepts the send, creates message `m500`, records `clientCommandId=c92`, and removes or replaces the remote draft. The HTTP response disappears when the connection resets. The browser therefore keeps `c92` in an unknown/submitting state; it does not assume failure and create a new command.

On retry, the same idempotency key asks for the same operation. Either that response returns the existing result, or the next mailbox delta carries `message.upserted` for `m500` with `clientCommandId=c92`. The reducer inserts `m500` by message ID, finds the matching outbox command, replaces the queued placeholder, clears the local draft only after authoritative confirmation, and marks `c92` acknowledged. A later repeated response or delta becomes a no-op. There is one Sent message, not one per network attempt.

This example also handles cursor expiry. If the cursor expires before the confirmation delta arrives, full sync returns `m500` and its command correlation. The projection is rebuilt, but `c92` and draft `d7` remain available until reconciliation finds `clientCommandId=c92`. User intent is never thrown away merely to repair a cache.

# Tradeoffs

## IndexedDB versus memory or localStorage

Memory is fast but cannot support restart recovery. `localStorage` is synchronous, small, string-oriented, and blocks the main thread; it is unsuitable for normalized mailbox pages and transactional draft/outbox updates. IndexedDB provides asynchronous transactions, indexes, and structured records. Its cost is schema migration complexity, quota uncertainty, and awkward failure handling. Wrap it behind an account-scoped repository, version migrations explicitly, and keep the in-memory store optimized for rendering rather than exposing database requests to components.

## Snapshot plus delta versus polling snapshots

Repeated full snapshots simplify the client but waste bandwidth and make offline conflict windows larger. Snapshot plus incremental delta gives fast recovery and bounded updates, but requires an opaque cursor, idempotent event application, expiry handling, and atomic cursor advancement. Use incremental synchronization because mailbox changes are sparse relative to mailbox size. Keep full snapshot as the recovery path, not as an exceptional data-loss event.

## Optimistic labels versus conservative send

Applying or removing a label is reversible and can appear optimistic as a local overlay, provided a failure restores the authoritative state and preserves focus. Sending email is consequential. The UI can respond immediately by showing a queued command, but it must not claim “Sent” until a server result or correlated mailbox event confirms it. Safe optimism means acknowledging durable intent, not fabricating the remote outcome.

## Local versus server search

A local index makes cached content searchable offline and can be fast, but it is incomplete, consumes storage, and increases privacy exposure. Server search has authoritative scope and richer operators but requires connectivity. Offer both with explicit scope labels. Do not silently merge partial local results into a list presented as the complete mailbox. Build or refresh local indexes during idle periods and treat them as disposable.

## One outbox worker versus every tab

Electing one active tab reduces duplicate work, but browser lifecycle and advisory messages cannot provide a durable lock. Allow a short lease in IndexedDB and announce it with `BroadcastChannel`; every request still carries an idempotency key because two tabs may race or a service worker may retry. Correctness comes from server deduplication and version checks. Cross-tab leadership is only an optimization.

## Semantic list versus grid

An inbox that behaves as one link per row can use a semantic list with native buttons and links inside each item. A dense desktop surface with cell navigation, sortable columns, and selection semantics may justify a grid pattern, but then arrow-key behavior, row/column position, virtualization, and focus restoration must follow the pattern completely. Choose the simplest semantic model that matches actual interaction instead of adding `role=grid` for appearance.

# Failure Modes

Network loss during hydration leaves the last coherent cache visible with an offline timestamp. An uncached route presents a useful empty-offline state, not an endless spinner. A lost command response keeps the command ambiguous and retries with its existing idempotency key. A cursor-expiry error stages a full projection rebuild while preserving drafts and outbox. Missing push notifications are repaired by focus refresh, periodic polling, and the same delta endpoint.

Quota errors require an ordered policy. Estimate usage where supported, stop background body prefetch, evict decoded or derived resources, then old bodies and attachments, then old mailbox projection pages outside pinned offline scope. Never evict an unsent draft or unacknowledged command as routine cache pressure. If durable intent itself cannot be persisted, keep the composer open, show a blocking recovery message, and offer copy/export rather than pretending autosave succeeded.

Draft conflicts are versioned. If another device replaces the remote draft while local edits exist, preserve both bodies, explain the conflict, and let the user choose or merge. Blind last-write-wins can erase writing. Label conflicts can normally rebase the desired set on the latest thread revision because the command states its intended final labels, but policy-controlled labels may still produce an explicit rejection.

Authentication expiry pauses synchronization and outbox submission while preserving locally encrypted-at-rest-by-platform data according to policy. Reauthentication resumes under the same account namespace. Switching accounts cancels requests and clears memory before hydrating the new namespace. A revoked account or explicit sign-out follows the configured local-data deletion policy and communicates whether offline drafts will be removed.

Email HTML is untrusted. Parse and sanitize with a maintained sanitizer using an allowlist, block scripts, forms, event handlers, unsafe URLs, active embeds, and dangerous CSS, and render within a controlled boundary that can enforce Trusted Types. Plain text is escaped. Sender-controlled remote images do not load directly on open because they disclose the user's IP, timing, and message view; use a privacy proxy or an explicit click-to-load action. Attachment UI reflects permission, scanning, size, download, and failure states without executing content inline.

Virtualization can remove a focused row. Keep active item identity outside the DOM window, scroll the target into the rendered range before focusing it, and choose a logical neighbor after archive or move. Keyboard shortcuts are disabled while focus is in a composer control unless explicitly scoped. Announce queue, send, conflict, offline, and recovery outcomes, but batch background sync chatter.

Long subjects, internationalized addresses, right-to-left text, quoted tables, and generated URLs can overflow. Apply wrapping to metadata and prose; confine wide HTML, code, and tables to an internal scrolling region. At 320 and 390 pixels, use stacked list/reader routes and preserve large touch targets. Zoom and large text must reflow without word-by-word labels.

# Metrics

Measure time to cached shell, time to first useful mailbox page, and time from route intent to readable thread content for warm and cold storage. Track delta receipt-to-paint latency, long tasks during large synchronization batches, list interaction INP, rendered row count, body-cache hit rate, IndexedDB transaction duration, storage use, and eviction outcomes. Segment results by device class, cache state, mailbox fixture size, and online status.

Correctness telemetry includes duplicate event attempts, stale-revision rejections, cursor-expiry frequency, full-sync success, unresolved gaps, outbox age, idempotency replays, unknown send outcomes, correlated delta acknowledgements, duplicate Sent defects, draft conflicts, and drafts recovered after restart. These events use opaque IDs and coarse sizes; subjects, recipients, bodies, attachment names, and addresses must not enter analytics.

Trust metrics include local-save failure rate, command retry recovery, time spent in ambiguous sending state, remote-image loads prevented, sanitized-content rejection, attachment errors, focus-loss defects, keyboard-flow completion, and excessive announcement defects. Product measures such as successful compose-to-confirmed-send can be observed without claiming that the frontend owns mail delivery.

Test with deterministic fixtures: duplicate and reordered deltas, an expired cursor, a server-accepted send whose response is cut, two tabs racing one command, draft replacement during local typing, quota exhaustion, authentication changes, malicious HTML, direct remote images, large and bidirectional subjects, a thousand-row mailbox, slow body loading, and attachment failure. Contract tests typecheck the snapshot, draft, command, and event unions. Reducer property tests assert idempotence and monotonic revisions. Browser tests inspect offline restart, mobile overflow, keyboard focus, prerender metadata, and the absence of premium gates.

# Rollout

Ship behind an account-level capability with schema-versioned IndexedDB migrations. Start with read-only cache hydration and incremental sync, then enable durable draft save, then label commands, and finally queued send. Each stage has a kill switch that disables new work without deleting persisted intent. A rollback leaves unknown commands recoverable and keeps old readers from opening a newer incompatible database schema.

Run a shadow comparison before enabling deltas broadly: fetch a periodic compact snapshot checksum and compare it with the client projection without changing the screen. Sample by mailbox size and browser. Investigate divergence before increasing exposure. For the outbox, begin with internal accounts and synthetic lost-response tests, monitor ambiguous command age and duplicate-send defects, then expand gradually.

Storage migrations copy or transform records in bounded transactions and preserve the last readable generation until the new generation commits. If migration fails, open a recovery experience that can retain or export drafts; do not solve schema trouble by deleting the database. Service-worker and page versions agree on command schema before either may submit queued intent.

The release gate requires successful offline restart with drafts intact, no duplicate Sent message after a lost response, a full sync that preserves local intent, sanitized hostile HTML, remote images disabled by default or privacy-proxied, no account bleed during switching, and usable keyboard and screen-reader flows. It also requires exact indexable title, description, canonical URL, Article, Breadcrumb, and LearningResource structured data for the free route.

After rollout, keep freshness honest. If push is degraded, polling and focus refresh continue to use the delta contract. If quota behavior changes across browsers, adjust eviction budgets from observed data. If the server introduces a new event, older clients ignore it safely or request a compatible snapshot instead of partially applying unknown state. The durable distinction remains: mailbox projections can be rebuilt, view state can be recreated, and body caches can be evicted; unacknowledged user intent cannot be silently sacrificed.
