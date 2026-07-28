---
title: "Cross-device Preferences Sync"
slug: "cross-device-preferences-sync"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "cross-device preferences sync frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Cross-device Preferences Sync."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Cross-device Preferences Sync."
unique_angle: "Design preference synchronization across devices and tabs with versioned values, optimistic edits, offline queues, conflict policy, and stable UI reconciliation."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Cross-device Preferences Sync."
competitor_query: "Cross-device Preferences Sync frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API"
  - "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

cross-device preferences sync frontend system design. Design preference synchronization across devices and tabs with versioned values, optimistic edits, offline queues, conflict policy, and stable UI reconciliation.

## Requirements

---

What you're solving:
A preferences system where users can change settings on one device (theme, language, notifications) and expect them to appear on their other devices. The frontend owns local state, optimistic updates, offline support, and a durable sync queue.

Decision surface:
- Can you define consistency expectations (instant vs eventual)?
- Do you handle offline edits and retries safely?
- Do you model conflict resolution across devices?
- Can you separate local UI state from sync state?
- Do you expose clear UX states: synced, saving, offline, conflict?

---

### Local edit and sync journey

1. App launch and hydration: Load preferences from local cache immediately for fast UI, then fetch the latest server version in the background and reconcile if needed.
2. User updates a setting: Apply the change optimistically in the UI and mark the preference as dirty. The user sees the new setting immediately.
3. Enqueue and persist: Record one idempotent per-key command in a durable queue so the change survives app reloads or offline periods.
4. Flush queued commands online: When online, batch queued commands, reconcile each outcome, and clear only acknowledged identities. Retry transport failures with backoff.
5. Conflict handling: If a command's per-key base revision is stale, apply that key's product policy: accept authoritative server state, retry an explicitly mergeable change, or ask the user. Never use client arrival time as a universal conflict rule.

### Convergence and offline guarantees

- Local changes must feel instant (no blocking UI).
- No data loss: queued changes should survive reloads.
- Network failures should be transparent and retryable.
- Conflicts should be resolved deterministically.
- Payloads should be small (send only changed fields).
- Respect privacy: only sync what is needed.

### Consistency strategies you can mention

| Approach | Why teams pick it | Trade-offs |
| --- | --- | --- |
| Server policy per key | The service evaluates one key against its authoritative revision and product rule. | The client must explain rejected or superseded intent. |
| Independent-key convergence | Commands for unrelated keys can succeed independently. | Requires a revision and outcome for each changed key. |
| Server authoritative | Server resolves conflicts and sends the final state. | Less control on the client; needs clear UX if changes are rejected. |

| Signal | Value | Interpretation |
| --- | --- | --- |
| Sync trigger | On change + debounce | Batch small updates and avoid spamming the network. |
| Conflict signal | Revision or ETag | Use version tokens to detect mismatches. |
| Local durability | Cache + queue | Confirmed preferences cached, commands queued for retry. |

### Scope checkpoint

A defensible decision separates fast local feedback from eventual sync. Credibility comes from connecting optimistic updates, a durable command queue, and an explicit conflict policy to observable recovery behavior.

### Frontend boundary

The client owns local preference application, optimistic edits, offline command queues, tab coordination, version reconciliation, and user-visible conflicts. The preference service is an abstract versioned contract; account persistence and authorization are outside the browser design.

# Clarifying Questions

- Which preferences are in scope (theme, language, notifications, privacy)?
- Do we need real-time sync or is eventual consistency acceptable?
- Should the UI show a saving/synced indicator?
- How should we handle offline edits and long offline sessions?
- What is the conflict rule if two devices change the same setting?
- Do we need per-device settings or truly global settings?

# Architecture

---

Use a PreferencesStore with confirmed per-key values plus optimistic overlays, a durable command queue, and a SyncEngine that consumes server outcomes and advances an opaque sync cursor. Settings controls dispatch commands; they never mutate revision metadata or call transport directly.

Boundary checks:
- Confirmed values and optimistic overlays are distinct.
- Every queued command has identity, key, value, and that key's base revision.
- A document sync cursor is not used as a preference revision.
- Conflict policy is explicit per key and supplied by the product contract.
- Same-origin tab messages are deduplicated by command identity.

---

### Core building blocks

| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| PreferencesStore | Owns the local preferences state and exposes a small API to update it. | "The store is the single source of truth for settings; UI reads from it and writes through it." |
| LocalCache | Persists the current preferences and the queue locally for fast boot. | "On startup we load from cache so the UI is instant, then reconcile with the server." |
| SyncQueue | Stores pending commands with identity and per-key base revision. | Every local change creates one durable command that can be retried safely. |
| SyncEngine | Batches commands, sends them, and applies per-command outcomes. | The engine runs outside control components and never blocks local interaction. |
| ConflictResolver | Resolves version mismatches and decides merge strategy. | "If the server says our base revision is stale, we merge or reapply." |
| Settings UI | Renders controls and shows sync state. | "The UI shows saving/synced states but does not handle network logic." |

---

```text
type PreferenceKey = 'theme' | 'language' | 'notifications';
type PreferenceValue = string | boolean;

interface ConfirmedPreference {
  key: PreferenceKey;
  value: PreferenceValue;
  revision: string;
  updatedAt: number;
}

interface PreferenceCommand {
  commandId: string;
  key: PreferenceKey;
  value: PreferenceValue;
  baseRevision: string;
  createdAt: number;
}

interface PreferencesState {
  confirmed: Record<PreferenceKey, ConfirmedPreference>;
  optimisticByKey: Partial<Record<PreferenceKey, PreferenceCommand>>;
  syncCursor: string | null;
  syncStatus: 'synced' | 'saving' | 'offline' | 'conflict';
}

interface SyncQueue {
  enqueue(command: PreferenceCommand): Promise<void>;
  peekBatch(limit: number): Promise<PreferenceCommand[]>;
  remove(commandIds: string[]): Promise<void>;
}
```

### Preference sync policy decisions

- UI updates local state first for instant feedback.
- A durable queue captures changes for offline retry.
- Sync runs in the background and is decoupled from UI.
- Conflicts are detected against the changed key's revision.
- The store exposes a small API for settings screens.

### Synchronization architecture failure patterns

- Settings UI calling fetch directly for every change.
- No persistent queue, so offline changes are lost.
- Multiple competing sources of truth for preferences.
- No plan for conflict resolution or version mismatch.
- Sync state baked into every component instead of a central store.

### High-level flow

1. Boot and hydrate: Load cached preferences + queue from storage, render UI immediately, then fetch server state to reconcile.
2. Local updates: User toggles a setting; the store applies an overlay and writes one command to the durable queue.
3. Batch version-aware commands: SyncEngine batches durable commands. Each command retains its key-specific base revision while the request carries the latest opaque sync cursor.
4. Server response: Apply per-command outcomes, replace confirmed values only with newer key revisions, clear acknowledged commands, and retain retryable or conflict outcomes with their original intent.
5. UI feedback: Store updates syncStatus to show saving, offline, or conflict states in the settings UI.

| Signal | Value | Interpretation |
| --- | --- | --- |
| State ownership | PreferencesStore | Single source of truth for UI and sync. |
| Sync backbone | Queue + engine | Durable commands plus background sync. |
| Conflict handling | Revision-aware | Compare each command with the changed key's revision. |

### Local-first sync ownership

The best architecture keeps the UI fast and simple, and pushes sync complexity into a dedicated engine. If you can describe clean boundaries and a durable queue, you will stand out.

### Worked example: theme changes offline on two devices

Laptop and phone both start at theme revision 8. The laptop chooses dark while offline; the phone chooses system and reaches server revision 9. Reconnect needs a policy that is explicit per preference rather than generic arrival order.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Laptop edits offline | Apply dark locally and queue command l1 based on revision 8. | Theme changes immediately with pending status. | Optimism does not alter server revision. |
| Phone saves system | Server commits revision 9. | Phone confirms system. | Authority advances once. |
| Laptop reconnects | Send l1 and receive a version conflict. | Keep current view stable while explaining conflict policy. | A stale base is detected. |
| Policy resolves | For theme, accept the newest explicit user action or ask when timestamps are unreliable. | Apply the resolved server revision once. | All tabs converge on one value. |

# Tradeoffs

## Data

The data model should separate user preferences, sync metadata, and queued changes.

---

Model each confirmed preference with its own field revision, overlay at most one current local intent per key, and persist every command with the key-scoped revision it was based on. Keep the opaque document sync cursor in coordinator state.

State-model checks:
- Each key has one authoritative confirmed value and revision.
- Optimistic intent is an overlay, not a rewritten server revision.
- Command identity and base revision survive retries.
- The sync cursor resumes change delivery but never resolves a key conflict.
- Retry metadata stays with the durable queue item.

---

### Core entities

| Entity | What it represents | Why it matters |
| --- | --- | --- |
| ConfirmedPreference | key, typed value, revision, updatedAt | The server-cache record is authoritative for one key. |
| PreferenceCommand | commandId, key, value, baseRevision, createdAt | One durable intent can be retried and reconciled independently. |
| SyncQueueItem | A durable entry that wraps a command with retry metadata. | Allows retries, ordering, and conflict detection. |
| SyncStatus | Client-visible state (synced, saving, offline, conflict). | Lets the UI show accurate feedback. |

```typescript
type PreferenceKey = 'theme' | 'language' | 'notifications';
type PreferenceValue = string | boolean;
type SyncStatus = 'synced' | 'saving' | 'offline' | 'conflict';

interface ConfirmedPreference {
  key: PreferenceKey;
  value: PreferenceValue;
  revision: string;
  updatedAt: number;
}

interface PreferenceCommand {
  commandId: string;
  key: PreferenceKey;
  value: PreferenceValue;
  baseRevision: string;
  createdAt: number;
}

interface SyncQueueItem {
  command: PreferenceCommand;
  attempts: number;
  lastAttemptAt?: number;
}

interface PreferencesState {
  confirmed: Record<PreferenceKey, ConfirmedPreference>;
  optimisticByKey: Partial<Record<PreferenceKey, PreferenceCommand>>;
  syncCursor: string | null;
  syncStatus: SyncStatus;
}
```

### Explicit state

- A revision per confirmed key for conflict detection.
- Queued commands with commandId and baseRevision.
- A sync status for the UI.
- Timestamps for ordering and retry backoff.

### Preference-state pitfalls

- Only storing final values and losing change history.
- No per-key revision, so conflicts are invisible.
- No per-item retry metadata.
- Mixing UI state (toggles) with sync state (offline).

| Signal | Value | Interpretation |
| --- | --- | --- |
| Primary entity | ConfirmedPreference | One authoritative value and revision per key. |
| Change unit | PreferenceCommand | One idempotent intent for one key. |
| Durability | Queue persisted | Survives offline and reloads. |

### State checkpoint

A reliable model explains confirmed per-key revisions, optimistic overlays, durable commands, queue metadata, and the distinct sync cursor.

### Confirmed, optimistic, and queued state ownership

A ConfirmedPreference contains key, typed value, revision, and updatedAt. Optimistic overlays and queued commands remain separate records with command identity and base revision. Conflict policy is configured per preference because theme, privacy, and notification settings can require different authority.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| ConfirmedPreference | key, value, revision, source | Server cache |
| PendingPreference | commandId, key, value, baseRevision | Optimistic overlay |
| SyncState | cursor, phase, lastSuccessAt | Coordinator |
| Policy | key, conflict rule, validation | Product config |

## Interfaces

Expose a small, clear client API (hook/service) and outline the server endpoints used for sync.

---

Expose a usePreferences controller that returns projected values, sync status, pending keys, and typed update and refresh commands. Queueing stays private, but a conflict remains visible enough for the settings screen to explain overwritten intent.

Contract checks:
- Reads return confirmed per-key revisions plus an opaque sync cursor.
- Updates are idempotent commands with a key-specific base revision.
- Batch responses contain one outcome per command.
- Conflicts return the current confirmed value and revision.
- Transport cancellation and retry timers remain private.

---

```typescript
interface PreferenceSnapshot {
  values: ConfirmedPreference[];
  syncCursor: string | null;
}

type PreferenceCommandOutcome =
  | { commandId: string; status: 'applied'; confirmed: ConfirmedPreference }
  | { commandId: string; status: 'conflict'; current: ConfirmedPreference }
  | { commandId: string; status: 'rejected'; reason: string };

interface PreferencesAdapter {
  read(signal: AbortSignal): Promise<PreferenceSnapshot>;
  sync(input: {
    commands: PreferenceCommand[];
    syncCursor: string | null;
    signal: AbortSignal;
  }): Promise<{ outcomes: PreferenceCommandOutcome[]; syncCursor: string }>;
}

interface UsePreferencesResult {
  values: Record<PreferenceKey, PreferenceValue>;
  syncStatus: SyncStatus;
  pendingKeys: PreferenceKey[];
  setPreference(key: PreferenceKey, value: PreferenceValue): void;
  refresh(): Promise<void>;
}

declare function usePreferences(adapter: PreferencesAdapter): UsePreferencesResult;
```

```http
GET /api/preferences

200 OK
{
  "values": [
    { "key": "theme", "value": "dark", "revision": "theme-r8", "updatedAt": 1785190000 }
  ],
  "syncCursor": "cursor-41"
}

POST /api/preferences/sync
Content-Type: application/json

{
  "syncCursor": "cursor-41",
  "commands": [
    {
      "commandId": "cmd-7",
      "key": "theme",
      "value": "system",
      "baseRevision": "theme-r8",
      "createdAt": 1785190042
    }
  ]
}

200 OK
{
  "outcomes": [
    {
      "commandId": "cmd-7",
      "status": "applied",
      "confirmed": { "key": "theme", "value": "system", "revision": "theme-r9", "updatedAt": 1785190043 }
    }
  ],
  "syncCursor": "cursor-42"
}
```

### Core interfaces

| Preference contract | Shape (example) | How you explain it |
| --- | --- | --- |
| usePreferences | { values, syncStatus, setPreference } | "UI uses this hook, not raw API calls." |
| GET /api/preferences | values with per-key revisions + syncCursor | Fetch confirmed values and a cursor for later change delivery. |
| POST /api/preferences/sync | commands + syncCursor | Batch independent idempotent commands without replacing their key-specific base revisions. |
| 409 Conflict | current confirmed value + key revision | The UI retains local intent while product policy chooses accept, retry, or explicit review. |

### Public behavior

- Current values and a syncStatus for UI.
- A setPreference method that is local-first.
- A refresh method for manual re-sync.
- A clear contract for conflicts and retries.

### Sync-engine internals

- Queue internals or retry timers in the UI layer.
- Raw network errors that leak transport details.
- Direct fetch calls sprinkled across settings screens.
- Low-level conflict resolution details in every component.

### Integration flow

1. Initialize: Settings page calls usePreferences() and renders current values immediately.
2. Update: User toggles a setting; setPreference applies an overlay and durably queues one command based on that key's confirmed revision.
3. Send version-aware command batch: The engine batches commands without changing their per-key base revisions and includes the latest sync cursor.
4. Resolve: Reconcile each outcome independently: advance confirmed key revisions, retain conflicts for policy or review, and clear only acknowledged commands.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Primary API | usePreferences | Simple hook or service for UI. |
| Conflict signal | If-Match / ETag | Detects stale updates. |
| Sync shape | Batch commands | Reduces network chatter. |

### Contract checkpoint

The app should feel like it reads from and writes to a simple preferences store, while sync happens behind the scenes. If your API keeps UI code clean, you are solving the right problem.

### UI-facing contract

Read returns a versioned preference document and sync cursor. Update accepts key, typed value, base revision, and idempotency key. A conflict returns the current value and version. BroadcastChannel may coordinate same-origin tabs, but server confirmation remains authoritative across devices.

### Edit-to-reconciliation path

1. Create preference command: Validate locally, apply an overlay, and create one command.
2. Coordinate tabs: Broadcast intent or confirmed values while deduplicating command identity.
3. Flush durable preference commands: Send queued commands in a stable order and stop on policy-relevant conflicts.
4. Converge: Merge server revisions, remove matching overlays, and announce meaningful changes.

# Failure Modes

Cover batching, retry policies, conflict reduction, and privacy.

---

Begin with confirmed per-key values, optimistic overlays, and a durable command queue. Measure queue age, per-key conflict rate, convergence, and rejected intent before tuning batching, retry, or tab coordination.

Preference sync quality checks:
- Batching preserves command identity and each key's base revision.
- Retry uses backoff and stops on policy-relevant conflicts.
- Independent keys converge without silently overwriting the same key.
- Privacy and data minimization apply to storage, transport, and telemetry.

---

### Sync efficiency controls

| Lever | What it does | Why it helps |
| --- | --- | --- |
| Batching | Combine multiple commands into one request without changing their base revisions. | Reduces request overhead and saves battery. |
| Debounce | Wait briefly before syncing rapid changes. | Avoids sending a request for every toggle. |
| Idle/background sync | Use idle time or app background events. | Keeps UI responsive and reduces contention. |
| Per-key outcomes | Apply unrelated successful commands independently. | Prevents one conflicting key from blocking the whole batch. |
| Payload minimization | Send only changed fields. | Lower bandwidth usage and faster sync. |

### Measured optimizations

- Batch updates with a short debounce window.
- Retry with exponential backoff and jitter.
- Store the queue in IndexedDB for durability.
- Use If-Match/ETag to avoid blind overwrites.
- Expose a light sync indicator, not noisy toasts.

### Synchronization failure and recovery

- Conflict storms when multiple devices edit frequently.
- Queue growth during long offline sessions.
- Silent failures that leave the UI stuck in saving.
- Over-eager polling that drains battery.
- Syncing more data than necessary.

### Scenario: offline cross-device conflict

1. Device A offline changes: User changes theme and language while offline; separate commands accumulate in the durable queue.
2. Device B online changes: User updates notifications on another device; server revision advances.
3. Device A reconnects: SyncEngine sends queued commands; the theme command carries a stale theme revision and receives a conflict.
4. Merge and retry: The client applies successful per-command outcomes, advances those key revisions, and retains only conflicting or retryable commands.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Primary metric | Sync success rate | Measure how often commands apply on the first attempt. |
| Secondary metric | Conflict rate | High conflict rate signals a merge strategy issue. |
| UX budget | Instant local apply | The UI should never wait on the network. |

### Convergence invariant

Optimizing preference sync is about reliability and user trust. If you can show durable queues, smart retry, and conflict-aware merging, your design feels production-grade.

### Conflict and synchronization failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Offline queue is corrupt | Quarantine invalid records and keep confirmed preferences. | The app starts safely. |
| Tab echoes its own event | Ignore source and command identity already seen. | No update loop forms. |
| Permission changes | Reject the overlay and restore the confirmed value. | Restricted settings remain authoritative. |
| Theme applies during paint | Use early validated bootstrap data and stable tokens. | The page avoids a persistent flash. |

### Accessibility behavior

Preference controls use native labels, current values, and clear save or sync status. A remote change does not steal focus. Theme, contrast, motion, and text settings apply without removing visible focus or making controls unreachable. Conflicts explain the old and new values in text, not color alone.

### Rollout and measurement

Begin with one low-risk preference and same-tab persistence, then add tab and device sync. Observe queue age, conflicts, rollback, cross-tab loops, unauthorized writes, initial-theme flashes, and convergence time. Privacy-sensitive keys receive stricter review than cosmetic values.

### Technical references

- [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) — Same-origin communication between browsing contexts.
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — Transactional browser storage for structured offline state.

# Metrics

- Sync trigger: On change + debounce. Batch small updates and avoid spamming the network.
- Conflict signal: Revision or ETag. Use version tokens to detect mismatches.
- Local durability: Cache + queue. Confirmed preferences cached, commands queued for retry.
- State ownership: PreferencesStore. Single source of truth for UI and sync.
- Sync backbone: Queue + engine. Durable commands plus background sync.
- Conflict handling: Revision-aware. Compare each command with the changed key's revision.
- Primary entity: ConfirmedPreference. One authoritative value and revision per key.
- Change unit: PreferenceCommand. One idempotent intent for one key.
- Durability: Queue persisted. Survives offline and reloads.
- Primary API: usePreferences. Simple hook or service for UI.
- Conflict signal: If-Match / ETag. Detects stale updates.
- Sync shape: Batch commands. Reduces network chatter.
- Primary metric: Sync success rate. Measure how often commands apply on the first attempt.
- Secondary metric: Conflict rate. High conflict rate signals a merge strategy issue.
- UX budget: Instant local apply. The UI should never wait on the network.

# Rollout

### Scenario: offline cross-device conflict

1. Device A offline changes: User changes theme and language while offline; separate commands accumulate in the durable queue.
2. Device B online changes: User updates notifications on another device; server revision advances.
3. Device A reconnects: SyncEngine sends queued commands; the theme command carries a stale theme revision and receives a conflict.
4. Merge and retry: The client applies successful per-command outcomes, advances those key revisions, and retains only conflicting or retryable commands.

### Technical references

- [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) — Same-origin communication between browsing contexts.
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — Transactional browser storage for structured offline state.
