---
title: "UI Component and State Design From a Mock"
slug: "ui-component-state-from-mock"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "UI component and state design from a mock"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Learn how to translate a concrete UI mock into component boundaries and an explicit frontend state model."
reader_promise: "The reader can derive component boundaries, classify state, reconcile background data, preserve drafts, and design responsive focus behavior from a mock."
unique_angle: "Use a realistic support inbox where URL selection, cached tickets, composer drafts, background updates, and optimistic commands evolve independently."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for UI Component and State Design From a Mock."
competitor_query: "UI Component and State Design From a Mock frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/"
  - "https://developer.mozilla.org/en-US/docs/Web/API/History_API"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

UI component and state design from a mock. Turn a support-inbox mock into clear component boundaries, URL and server state, local drafts, optimistic mutations, responsive behavior, and accessible focus.

## Requirements from the mock

A mock is visual evidence, not a complete specification. Begin by naming the user, primary task, responsive states, and data that the picture cannot reveal. For this case, design a customer-support inbox used by an agent who filters tickets, opens a deep link, reads a conversation, drafts a reply, changes status or assignee, and continues working while background updates arrive. The backend ticket system remains an abstract service contract; the task is to design frontend ownership, composition, asynchronous behavior, and recovery.

```text
Desktop mock
┌──────────────────────────────────────────────────────────────────────┐
│ Support inbox        Search tickets...       Agent: Maya            │
├───────────────┬─────────────────────────┬────────────────────────────┤
│ Filters       │ Ticket list             │ Ticket #1842              │
│ ○ All         │ [Open] Login broken     │ Customer and message      │
│ ● Mine        │ [Pending] Refund issue  │ Activity timeline          │
│ Status        │ [Open] Export timeout   │ Assignee [Maya ▾]         │
│ Assignee      │                         │ Status   [Open ▾]          │
│               │                         │ Reply composer             │
│               │                         │ [Send reply]               │
└───────────────┴─────────────────────────┴────────────────────────────┘

Mobile mock
┌──────────────────────────┐
│ ← Mine       Search      │
├──────────────────────────┤
│ Ticket list or details   │
│ uses a nested route      │
└──────────────────────────┘
```

### Turn pixels into questions

### Ambiguities in the mock
| Visible clue | Question | Starting decision |
| --- | --- | --- |
| Three desktop panes | Must all panes stay visible on narrow screens? | Desktop uses a split workspace; mobile navigates between list and details. |
| Selected ticket | Should refresh and sharing preserve selection? | Ticket identity lives in the URL as a route or query parameter. |
| Search and filters | Are they shareable or temporary? | Committed query state lives in the URL; incomplete input can remain local. |
| Reply composer | Can a draft survive ticket changes or reload? | Drafts are keyed by ticket and saved separately from server entities. |
| Status and assignee controls | Can another agent update the ticket concurrently? | Commands use ticket versions and reconcile conflicts explicitly. |
| Live timeline | How are background messages merged? | Stable event IDs and versions prevent duplicate or stale replacement. |

### Functional requirements

### Core workflow
- Load a paginated ticket list with loading, empty, partial, error, and retry states.
- Filter by status and assignee, search by supported fields, and preserve committed query state in a shareable URL.
- Open a selected ticket through direct navigation, browser back and forward, or pointer and keyboard input.
- Render ticket messages and activity without allowing one malformed event to break the entire details pane.
- Keep one reply draft per ticket while background ticket updates continue to merge.
- Send a reply and change status or assignee with immediate pending feedback and server-confirmed reconciliation.
- Reflect an update made in another tab or by another agent without overwriting unsent local text.
- Respect ticket permissions by hiding or disabling unavailable actions while still showing an understandable read-only state.
- Move between list and details on mobile without losing query, scroll position, draft, or a meaningful return focus target.

### Non-functional requirements

The list should stay responsive for the measured ticket volume and device mix. Virtualization is a profiling decision, not an item-count rule. Search requests are cancellable and stale responses cannot replace the current query. Components expose predictable loading and recovery states. Keyboard users can traverse filters, list items, details actions, and composer controls in a logical order. Screen-reader announcements cover meaningful events such as reply sent, conflict detected, or connection lost instead of every background activity item.

### Requirement checkpoint

Before drawing a component tree, explain which state must survive refresh, which state must be shareable, which state belongs to the server cache, and which state must remain local to one unfinished interaction.

# Clarifying Questions

- Which user journey and input modes must UI Component and State Design From a Mock support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow screen widths?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

Derive component boundaries from independent responsibilities and update frequency, not from every rectangle in the mock. The route shell coordinates query state and responsive composition. A ticket-query controller owns paginated server data. A selection controller derives the active ticket from the URL. A draft repository owns unsent text by ticket. A mutation coordinator tracks commands and conflicts. Presentational components receive narrow data and emit user intent.

```text
SupportInboxRoute
├─ InboxToolbar
│  ├─ TicketSearch
│  └─ SavedViewControls
├─ TicketFilterPanel
├─ TicketListRegion
│  ├─ TicketListStatus
│  └─ TicketListItem × visible tickets
└─ TicketDetailRoute
   ├─ TicketHeaderActions
   ├─ ConversationTimeline
   ├─ TicketProperties
   └─ ReplyComposer

Controllers
URL state → QueryController → normalized ticket cache
URL ticket id → SelectionController → detail query
DraftRepository(ticket id) → ReplyComposer
MutationCoordinator → pending overlay → server reconciliation
```

### Component and controller boundaries
| Boundary | Inputs | Outputs | Reason |
| --- | --- | --- | --- |
| SupportInboxRoute | URL query, breakpoint state, permissions | Pane composition and navigation intent | Owns page-level coordination without absorbing every ticket field. |
| TicketQueryController | Committed search, filters, cursor, AbortSignal | Ticket IDs, pagination status, retry | Keeps request and cache policy outside visual list items. |
| TicketListRegion | Visible ticket summaries and selected ID | Select and load-more intents | Can change rendering strategy without changing data ownership. |
| SelectionController | Route ticket ID and detail cache | Selected ticket view and not-found state | Makes deep links and back navigation deterministic. |
| DraftRepository | Ticket ID and text edits | Versioned local draft snapshots | Background server merges cannot overwrite unfinished text. |
| MutationCoordinator | Reply, status, assignee commands | Pending overlays, conflicts, and outcome messages | Optimistic presentation remains separate from authoritative entities. |

### Data flow

### Read and interaction paths
1. **Commit query state:** Debounce only the text input; when committed, update the URL and derive a complete cache key from search, filters, sort, and workspace.
2. **Load ticket summaries:** Cancel the obsolete request, normalize accepted results, and preserve the previous list when a background refresh starts.
3. **Select through navigation:** Update the ticket route and derive selection from it rather than maintaining a competing selected-ticket field.
4. **Edit a local draft:** Write text to a ticket-keyed repository; keep draft state independent from messages received from the server.
5. **Coordinate commands:** Overlay pending status, assignee, or reply intent, then reconcile against server versions and stream updates.

### Worked example: background update during an unsent reply

```text
URL: /support/inbox?assignee=me&ticket=1842
server ticket 1842: version 17, status open, assignee Maya
local draft 1842: "I checked your export..."

background event: ticket.updated version 18, assignee Jordan
local command: status pending based on version 17
server response: 409 current version 18
```

### One scenario through each state layer
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Deep link opens ticket 1842 | The URL supplies selection; summary and detail queries normalize version 17. | The matching list item is selected and details receive focus only after explicit navigation. | There is one selection source. |
| Agent types a reply | DraftRepository saves text under ticket 1842 with a local draft revision. | Composer shows saved-local status without changing ticket messages. | Unsent text is never server entity state. |
| Background version 18 changes assignee | Merge the newer assignee while leaving the draft repository untouched. | Header shows Jordan; composer text remains exactly as typed. | Server changes cannot erase a local draft. |
| Agent changes status based on version 17 | Create a pending overlay and send a version precondition. | Status control says Updating while the base entity remains version 18. | Optimistic feedback is not authoritative truth. |
| Server rejects stale command | Clear the overlay, preserve version 18, and attach a recoverable conflict. | Show the current status and a concise message; move focus to the message only when the action requires correction. | The newest server version wins without resetting unrelated UI. |

### Responsive and focus model

Desktop can keep list and detail visible when each pane retains a useful minimum width. Mobile uses nested routes or an equivalent explicit view state: list navigation opens details, Back returns to the same query and list anchor. Record the initiating ticket identity so focus can return after the list remounts. Use semantic form controls, headings, links, buttons, and lists before introducing composite ARIA widgets. A ticket list with ordinary links usually does not need grid keyboard behavior.

# Tradeoffs

The central tradeoff is Use a realistic support inbox where URL selection, cached tickets, composer drafts, background updates, and optimistic commands evolve independently. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Classify state by authority, lifetime, and addressability. Server entities are normalized by ticket identity and protected by versions. Committed URL state carries the shareable query and selected ticket; incomplete search input can remain local until committed. Draft text is local, keyed by ticket, and versioned independently. Pending commands are overlays with idempotency keys. Ephemeral UI details such as an open menu remain local to the component that renders them.

```typescript
type TicketStatus = 'open' | 'pending' | 'resolved';

interface TicketQuery {
  workspaceId: string;
  search: string;
  statuses: TicketStatus[];
  assignee: 'me' | 'unassigned' | string;
  sort: 'updated-desc' | 'priority-desc';
  cursor?: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  assigneeId?: string;
  priority: 'low' | 'normal' | 'high';
  messageIds: string[];
  version: number;
  updatedAt: string;
  capabilities: Array<'reply' | 'assign' | 'change-status'>;
}

type TicketMessage = {
  id: string;
  ticketId: string;
  authorLabel: string;
  safeBody: string;
  createdAt: string;
};

type TicketPage = {
  items: readonly Ticket[];
  nextCursor?: string;
};

type TicketDetail = {
  ticket: Ticket;
  messages: readonly TicketMessage[];
};

type TicketCommandResult =
  | { status: 'accepted'; commandId: string; ticket: Ticket }
  | { status: 'conflict'; ticket: Ticket };

type ReplyResult = TicketCommandResult;
type UpdateTicketResult = TicketCommandResult;

type TicketEvent = {
  eventId: string;
  workspaceId: string;
  cursor: string;
  ticket: Ticket;
};

interface ComposerDraft {
  ticketId: string;
  text: string;
  attachmentIds: string[];
  localRevision: number;
  savedAt: string;
}

interface PendingMutation {
  commandId: string;
  ticketId: string;
  kind: 'reply' | 'assign' | 'change-status';
  basedOnVersion: number;
  phase: 'sending' | 'conflicted' | 'failed';
  optimisticPatch?: Partial<Ticket>;
}

interface InboxViewState {
  listAnchorTicketId?: string;
  mobilePane: 'list' | 'detail';
  openMenu?: { ticketId: string; name: string };
}
```

### State placement
| State | Owner | Why |
| --- | --- | --- |
| Search, filters, sort, selected ticket | URL and route parser | Shareable, refresh-safe, and compatible with browser history. |
| Ticket summaries and details | Normalized server cache | Multiple panes can subscribe to one versioned entity. |
| Reply drafts | Ticket-keyed draft repository | Their lifetime differs from server messages and selection. |
| Pending status or assignee | Mutation coordinator overlay | Rollback and conflicts do not rewrite the base entity. |
| Open menu and transient validation | Nearest rendering component | No other consumer needs it and it should disappear with the view. |
| List anchor and return focus | Route-session view state | Responsive navigation can remount the list without losing context. |

### Cache keys and derived values

A stable list-query key includes workspace, committed search, filters, sort, and locale-sensitive behavior when relevant; it never includes the page cursor. Each page request key pairs that query key with its opaque cursor, using an explicit first-page sentinel when no cursor exists. Pages then append to one query record without changing its identity. The selected list item is derived from the route ticket ID. Permission flags are server facts and actions are derived from them plus local pending state. Do not store filtered arrays, unread labels, or status display text when selectors can derive them cheaply from stable inputs.

### Invariants
- One ticket ID resolves to one newest accepted server entity in a workspace scope.
- An older fetch or event cannot replace a newer ticket version.
- Changing selection does not delete or submit a ticket-keyed draft.
- A failed optimistic command removes only its overlay and keeps the server entity intact.
- Browser Back restores a URL-defined query and selection without a second hidden selection state.
- Permissions are rechecked after every authoritative update before rendering actions.
- Untrusted message content is rendered as escaped or sanitized content according to its contract.

# Failure Modes

## Optimizations for recovery, performance, and accessibility

### Failure and recovery

### Failure modes
| Failure | Preserved state | Recovery behavior |
| --- | --- | --- |
| List request fails | Committed URL query and any validated cached page | Show retry near the list while keeping navigation and filters usable. |
| Selected ticket is missing | List query, draft repository, and return anchor | Show a not-found detail state and let the user return without resetting the inbox. |
| Background event arrives out of order | Newest accepted entity version | Ignore older versions; request a focused refresh when a version gap matters. |
| Reply response is lost | Draft plus idempotency key and uncertain command record | Retry the same command identity or reconcile from the event stream before sending new text. |
| Another agent changes status | Local draft and current selection | Merge the server version, clear a conflicting overlay, and announce one meaningful update. |
| Session expires | Local draft according to product security policy | Pause commands, offer sign-in, then revalidate permissions before resuming. |
| Mobile detail closes | Query, list anchor, and ticket-keyed draft | Return to the initiating ticket and restore focus after it is mounted. |
| Large conversation loads | Ticket header and composer | Page older messages, preserve reading anchor, and introduce windowing only after measurement. |

### Performance decisions

Begin with paginated semantic lists, targeted entity subscriptions, and stable keys. Measure list length, row complexity, update frequency, main-thread work, memory, and focus behavior on representative hardware. Virtualization is useful when those measurements show the mounted list is the bottleneck; it is not triggered by a universal threshold such as one hundred items. If introduced, pin the selected or focused item, preserve scroll anchors when rows change height, and test screen-reader and browser-find consequences.

### Render and request controls
- Debounce only incomplete search input; commit a complete query to the URL and cache key.
- Abort obsolete list and detail reads while retaining generation and entity-version guards.
- Normalize shared summaries so a background ticket update rerenders only affected consumers.
- Keep composer keystrokes in a local draft store rather than updating the entire ticket entity.
- Page conversation history from a stable anchor and preserve the reading position when older messages prepend.
- Move heavy message formatting or search indexing off the main thread only after profiling identifies it as meaningful.
- Use skeletons only when they preserve layout and do not hide a useful cached state.

### Accessibility and responsive behavior

The page uses landmarks and visible headings for filters, ticket list, ticket details, and reply composition. Ticket rows are ordinary links or buttons unless interaction requirements genuinely need a composite widget. The selected item has a visual and programmatic current state. Form controls have persistent labels, errors are associated with the relevant field, and status announcements are polite unless immediate danger requires stronger interruption. Only a true modal dialog or drawer contains focus; an ordinary popover menu follows its keyboard pattern and returns focus to the control that opened it.

On mobile, list and detail are explicit navigation states rather than CSS-hidden desktop panes that remain in the tab order. Browser Back returns to the list query and anchor. A conflict message does not steal focus for a background-only change; after a failed submitted action, focus can move to a concise correction summary or first invalid field. Long customer names, ticket IDs, translated labels, and message code blocks wrap or scroll inside bounded containers without widening the page.

### Test and rollout

### Release sequence
1. **Lock state invariants:** Test URL selection, draft isolation, version merges, idempotent commands, and focus restoration with deterministic reducer fixtures.
2. **Exercise interruption:** Use slow requests, cancellation, offline transitions, duplicate events, version conflicts, permission changes, and lost responses.
3. **Validate responsive navigation:** Test direct mobile detail links, browser Back, list-anchor restoration, large text, bidirectional text, and keyboard-only operation.
4. **Measure field behavior:** Track query acceptance, list usefulness, reply outcome, conflict recovery, draft loss, and responsiveness by device cohort.
5. **Expand gradually:** Release by workspace cohort and retain a compatible read-only fallback if command behavior regresses.

### Interview answer checkpoint

Be ready to explain five decisions: derive selection from the URL, normalize versioned server entities, isolate ticket-keyed drafts, model mutations as overlays, and restore responsive navigation by stable identity.

### Technical references
- [W3C WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) — Keyboard focus, persistence, and predictable interaction guidance.
- [MDN History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) — Browser session-history concepts for query and selection navigation.
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Cancellation primitives for obsolete browser requests.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface contracts for components and services

Define UI-facing service interfaces around cancellable reads and versioned commands. The route and controllers depend on these contracts rather than endpoint details. Every accepted response is validated before entering the cache. Cancellation means the result is no longer wanted; request generation and entity version checks still prevent a response that could not be aborted from replacing current state.

```typescript
interface TicketClient {
  listTickets(query: TicketQuery, signal: AbortSignal): Promise<TicketPage>;
  getTicket(ticketId: string, signal: AbortSignal): Promise<TicketDetail>;
  sendReply(input: {
    ticketId: string;
    body: string;
    basedOnVersion: number;
    idempotencyKey: string;
  }): Promise<ReplyResult>;
  updateTicket(input: {
    ticketId: string;
    patch: { status?: TicketStatus; assigneeId?: string };
    basedOnVersion: number;
    idempotencyKey: string;
  }): Promise<UpdateTicketResult>;
  subscribe(input: {
    workspaceId: string;
    cursor?: string;
    signal: AbortSignal;
  }): AsyncIterable<TicketEvent>;
}
```

```http
PATCH /ui/tickets/1842
Idempotency-Key: status-cf21
If-Match: "ticket-1842-v18"
Content-Type: application/json

{ "status": "pending" }

409 Conflict
{
  "code": "TICKET_VERSION_CHANGED",
  "currentVersion": 19,
  "ticket": {
    "id": "1842",
    "subject": "Refund issue",
    "status": "open",
    "assigneeId": "agent-jordan",
    "priority": "high",
    "messageIds": ["message-91", "message-94"],
    "version": 19,
    "updatedAt": "2026-07-28T10:12:00Z",
    "capabilities": ["reply", "assign", "change-status"]
  }
}
```

### Controller-facing results
| Result | UI interpretation | State transition |
| --- | --- | --- |
| Cancelled read | No error message because user intent changed. | Leave current query state alone. |
| Offline or network failure | Keep useful cached tickets and expose retry. | Mark freshness or command outcome as uncertain. |
| Version conflict | Explain that the ticket changed elsewhere. | Merge the returned newer entity and clear only the stale overlay. |
| Permission denied | Remove the unavailable action and preserve readable context when allowed. | Refresh capabilities from authoritative data. |
| Validation failure | Associate safe field-level feedback with the composer or property control. | Keep the draft and focus the first correctable field. |
| Duplicate event | No visible change. | Ignore by event identity or entity version. |

### URL adapter

```typescript
interface InboxLocation {
  query: Omit<TicketQuery, 'cursor'>;
  selectedTicketId?: string;
}

declare function parseInboxLocation(url: URL): InboxLocation;
declare function updateInboxLocation(
  current: URL,
  next: Partial<InboxLocation>,
  mode: 'push' | 'replace',
): URL;
```

Typing can replace the current history entry after debounce so each character does not create a Back stop. Explicit filter submission or ticket selection can push an entry because the user expects to navigate back. Parsing applies defaults and rejects unknown values without crashing. The route owns serialization so components do not assemble query strings independently.

### Component contracts

TicketList receives ticket summary IDs or render-ready summaries, selected identity, paging status, and selection intent. ReplyComposer receives a draft snapshot, validation state, send capability, and explicit edit and submit callbacks. Neither component imports the server client. This separation allows the same components to render cached, live, or fixture data and makes loading, failure, permission, and conflict states testable without network timing.
