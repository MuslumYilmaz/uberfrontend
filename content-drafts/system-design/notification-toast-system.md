---
title: "Design a Toast Notification System"
slug: "notification-toast-system"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "toast notification system frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Design a Toast Notification System."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Design a Toast Notification System."
unique_angle: "Design a global toast system with typed commands, stacking, deduplication, lifecycle ownership, persistent actions, responsive placement, and accessible announcements."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Design a Toast Notification System."
competitor_query: "Design a Toast Notification System frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://www.w3.org/WAI/ARIA/apg/patterns/alert/"
  - "https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

toast notification system frontend system design. Design a global toast system with typed commands, stacking, deduplication, lifecycle ownership, persistent actions, responsive placement, and accessible announcements.

## Requirements

Design a global toast system with a typed command API, top-level rendering layer, predictable stacking, bounded duplicate handling, manual dismissal, optional timing for low-risk status messages, persistent actionable or critical messages, responsive placement, and restrained screen-reader announcements.

### Scope

- A global toast API.
- A ToastProvider / ToastContainer layer.
- Stacked toast rendering.
- Persistent and timed lifetime behavior with safe manual close.
- Accessible announcements.
- Timer cleanup and lifecycle handling.
- Responsive placement rules.

### Design outline

- Requirements and constraints.
- High-level architecture.
- Toast data model.
- Public API contract.
- Rendering and portal strategy.
- Timer lifecycle.
- Accessibility behavior.
- Performance and edge cases.

### Scenario

Worked example: a profile save emits a non-actionable success status with a product-configured timed lifetime. The store creates one status toast and the renderer announces it politely. If the user focuses or hovers it, the remaining-time countdown pauses. An Undo message would instead be persistent until the action expires or the user dismisses it.

### Toast system vs notification feed

A toast system is for short-lived, non-blocking feedback. A notification feed is persistent, user-specific, often server-backed, and may need unread state, pagination, realtime updates, and retention. This page focuses on designing the Toast Notification System, not a persistent notifications feed.

---

Any authorized part of the app can emit a small non-blocking status message. Variants affect presentation but do not determine urgency by themselves. Low-risk informational feedback may use an adjustable timed lifetime; actionable, critical, or user-decision messages remain persistent. The system supports manual close, predictable stacking, placement, deduplication, accessible announcements, and complete cleanup.

Cover global ownership, stacking and overflow, persistent versus timed lifetime, complete timer cleanup, layering, restrained announcements, non-stealing focus behavior, and responsive placement.

---

### User flow

1. Trigger: Some part of the app calls toast.success('Profile saved', { lifetime: { kind: 'timed' } }) after an action completes. Provider policy resolves the measured default duration.
2. Show toast: A new toast appears in the chosen corner (e.g. top-right), with the correct style and icon for its type.
3. Lifetime: A timed status begins a remaining-time countdown; focus, hover, page hiding, or relevant user timing preferences pause it without resetting elapsed time. Persistent messages have no timer. A clearly labeled close button remains available when dismissal is safe.
4. Stack behavior: If more toasts appear, they stack in a consistent order (e.g. newest on top). Old ones disappear as timers finish or the user closes them.
5. Edge cases: On small screens, the layout adapts (e.g. full-width at the top/bottom). Screen readers get the message, and timers are cleaned up on unmount or route changes.

### Explicit assumptions

- The toast system is global and should not require prop-drilling.
- Toasts are non-blocking: they should not stop the user from interacting with the page.
- Each toast has a message, presentation variant, urgency, and explicit persistent or timed lifetime.
- Multiple toasts can be visible and must stack predictably.
- Timers must be cleaned up on unmount or when the toast is removed.
- Use status and polite announcement by default, reserve alert for genuinely urgent information, never move focus merely because a toast appeared, and keep interactive actions keyboard reachable.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Main concept | Global toast layer | One place in the app renders all toasts. |
| Key UX goal | Non-blocking feedback | Users keep working while seeing notifications. |
| Key technical concern | Timers & cleanup | No dangling intervals/timeouts when toasts disappear or routes change. |

### Scope checkpoint

A toast system is more than just "show a div". In requirements, highlight that it must be global, stack correctly, clean up timers reliably, respect z-index layers, and stay accessible and readable on both desktop and mobile.

### Frontend boundary

The toast layer owns client command normalization, stacking, lifetime, deduplication, announcements, and cleanup. The server-side business operation is an abstract contract; persistence and domain recovery stay outside this transient feedback channel.

# Clarifying Questions

- From where can toasts be triggered? Only from React components, or also from plain JS utilities / services?
- Do we need different variants (success, error, warning, info) with different icons and colors?
- Which low-risk messages may be timed, which messages must persist, and how can timing be adjusted?
- What is the visible-stack budget, and how should overflow queue without losing distinct outcomes or recovery actions?
- Which placements do we need to support (top-right, top-center, bottom-right, bottom-left, mobile full-width)?
- Do we need actions inside toasts (e.g. an "Undo" button) that require focus and keyboard support?

# Architecture

Separate command normalization, durable toast records, lifecycle scheduling, rendering, and announcements so that one owner controls each transition.

### Store, viewport, and announcer boundary

toast.success() -> toast store -> ToastProvider -> portal-based ToastContainer -> ToastItem with timer and dismiss behavior

---

Use a global toast store, a root ToastProvider that renders through a portal, and one lifecycle coordinator for every deadline. The public API emits typed commands; the container renders state and sends interactions back without owning independent timers.

Boundary checks:
- One global store owns visible and queued records.
- One lifecycle coordinator owns deadlines, pause reasons, and cleanup.
- A portal or equivalent root layer provides predictable stacking.
- The layer contract defines how toasts relate to dialogs and popovers.
- The public API stays small while preserving typed lifetime and action semantics.

---

### Core building blocks

| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| Toast API (toast helper) | Public functions like toast.success(message, options?) and toast.error(message, options?) that push toasts into global state. | Authorized callers emit a normalized add command and receive the stable toast ID. |
| Global toast store / context | Keeps an array of active toasts and handles add/remove/clear actions. | The store is the single source of truth for visible and queued toast records. |
| ToastProvider | Top-level component that subscribes to the store and renders the ToastContainer via a portal. | The root provider subscribes once and renders the configured placement through a portal. |
| ToastContainer | Positions and stacks toasts for a given placement (top-right, bottom-left, etc.). | The container applies placement, bounded stacking, and the documented layer policy. |
| ToastItem | Renders a single toast: icon, message, optional actions, close button, ARIA/focus behavior. | Each item renders semantics and emits pause, resume, action, and dismiss intent; it does not create a competing timer. |

### Toast policy decisions

- There is one global toast layer mounted near the root of the app.
- Toasts are stored in a global store/context, not per-page state.
- The toast API is just a thin wrapper over that store (no UI logic inside helpers).
- The ToastProvider uses a portal (or similar) to render a fixed-position container above the main app.
- ToastContainer handles placement and stacking order (newest on top or bottom).
- The lifecycle coordinator owns every deadline and cleanup; ToastItem reports focus, hover, action, and dismiss intent.

### Architecture failure patterns

- Spreading toast state across many unrelated components.
- Requiring every page to include its own toast container.
- Triggering DOM queries (document.querySelector) all over instead of a clean portal.
- Letting every ToastItem create an independent timer, which makes pause and cleanup race.
- Hard-coding placements and not leaving room for a simple config.
- No clear z-index strategy (toasts randomly appear behind headers or modals).

### High-level flow

1. App initialization: The root renders <ToastProvider> once, which mounts a ToastContainer in a fixed overlay using a portal.
2. Triggering a toast: Any component or service calls toast.success(message, options?). The helper dispatches an addToast action with a new toast object (id, variant, message, options).
3. Rendering & stacking: The ToastProvider subscribes to the toast store, receives the updated list, and ToastContainer renders a stack of ToastItem components in the correct corner.
4. Lifetime and manual close: A lifecycle coordinator manages timed status messages with remaining-time pause and cleanup. Persistent, actionable, and critical messages have no automatic timer. ToastItem renders state and emits interaction intent rather than owning competing timers.
5. Unmount / navigation: If the ToastProvider unmounts (e.g. full app teardown), it clears remaining toasts and timers to avoid leaks.

| Signal | Value | Interpretation |
| --- | --- | --- |
| State ownership | Global store | All toasts live in one place and are easy to observe. |
| Rendering strategy | Portal overlay | Toasts render above the main layout without breaking it. |
| Developer experience | toast.*() API | Callers don’t care about implementation details, only about a simple function. |

### Toast lifecycle ownership

A good toast architecture gives you one global place for state and rendering, plus a tiny, ergonomic API for the rest of the app. If you can explain that clearly with 3–4 boxes, you’re already giving a strong senior signal.

### Worked example: save success followed by an actionable conflict

A profile save emits a low-risk success status, then a later edit conflict needs a persistent Review action. The system must avoid announcement overlap and must not let a generic duration delete the only path to resolve the conflict.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Save succeeds | Insert a polite timed status with one dedupe key. | Profile saved appears without moving focus. | Noncritical feedback may be timed. |
| Duplicate success arrives | Increment or replace the existing dedupe record. | The stack does not repeat the same sentence. | Deduplication preserves meaning. |
| Conflict arrives | Insert a persistent action toast with command identity. | Review remains until resolved or safely dismissed. | Actions do not expire invisibly. |
| Page is hidden | Pause remaining timed lifetime and suppress repeat announcement. | Returning users still have time to read. | Timing reflects actual opportunity. |

# Tradeoffs

## Data

Model durable toast content separately from lifecycle runtime so the store can reconcile update, action, dismissal, and teardown without serializing browser handles.

---

Use a ToastRecord for serializable content, ToastState for visible and queued records, and ToastRuntime for deadlines and pause reasons. Provider configuration supplies placement, timing, and overflow policy without becoming part of each caller's command.

State-model checks:
- Toast identity, variant, placement, lifetime, urgency, and action are explicit.
- Persistent and timed lifetimes are mutually exclusive.
- Runtime deadline and pause reasons stay outside the durable record.
- Action state distinguishes idle, pending, and failed recovery.

---

```typescript
type ToastVariant = 'success' | 'error' | 'warning' | 'info';
type ToastPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
type ToastLifetime =
  | { kind: 'persistent' }
  | { kind: 'timed'; durationMs: number };
type ToastActionState = 'idle' | 'pending' | 'failed';

interface ToastRecord {
  id: string;
  dedupeKey?: string;
  variant: ToastVariant;
  message: string;
  description?: string;
  placement: ToastPlacement;
  lifetime: ToastLifetime;
  urgency: 'polite' | 'urgent';
  announced: boolean;
  action?: {
    label: string;
    commandId: string;
    state: ToastActionState;
  };
}

interface ToastRuntime {
  remainingMs?: number;
  deadline?: number;
  timerHandle?: ReturnType<typeof setTimeout>;
  pausedBy: Set<'focus' | 'hover' | 'page-hidden' | 'preference'>;
}

interface ToastState {
  visible: ToastRecord[];
  queued: ToastRecord[];
  defaultPlacement: ToastPlacement;
  defaultTimedDurationMs: number;
  maxVisible: number;
}
```

### Core entities

| Entity | Fields (example) | Design rationale |
| --- | --- | --- |
| ToastRecord | id, variant, message, placement, lifetime, urgency, action? | Each toast explicitly models persistence or timing, one announcement state, and a command identity for an optional action. |
| ToastState | toasts[], defaultPlacement, defaultDurationMs, maxVisible | The global slice keeps bounded visible records, queued records, and resolved provider defaults. |
| ToastRuntime | remainingMs, deadline, timerHandle, pausedBy | The lifecycle coordinator owns runtime handles and pause accounting outside serializable store data. |

### Required model fields

- A unique id per toast so you can remove it reliably.
- A variant field for visual style and icon (success/error/etc.).
- A clear message and optional description.
- A resolved placement field to control where it appears.
- A persistent or timed lifetime; actionable and critical items resolve to persistent.
- A status role by default and an alert role only for genuine urgency.
- An optional action object for interactive toasts.

### Keep outside the data model

- Raw DOM nodes or refs inside the toast object.
- Actual timer/timeout handles in the model (keep them alongside the component logic or in a separate map).
- Random UI-only flags that can be derived (e.g. computing "isOld" from createdAt instead of storing another boolean).
- Mixing unrelated global UI state (like modals) into ToastState.
- Overcomplicating the schema for a simple notification use case.

### How toast data typically changes over time

1. Add toast: A caller triggers toast.success("Saved"). The API creates a ToastRecord with a unique ID and resolved semantic options, then inserts it into the visible stack or queue according to provider policy.
2. Start lifetime: A lifecycle coordinator starts a countdown only for a timed status. It tracks remaining time and pause reasons outside the durable toast record so focus, hover, page visibility, and user preference can pause without creating conflicting timers.
3. Manual or auto dismiss: A safe manual dismissal or an exhausted timed lifetime emits one remove command. Cleanup clears runtime handles before the toast leaves state; persistent actionable and critical messages do not disappear because a timer fired.
4. Optional action: Invoking an action moves it to pending. Success dismisses or updates it according to policy; failure keeps the toast persistent, exposes retry, and restores focus to meaningful recovery text.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Must-have entities | ToastRecord + runtime | If you clearly define these two, the rest of the design becomes much easier to explain. |
| Key idea | Model behavior as data | Variant, placement, lifetime, urgency, and announcement state are explicit data. |
| Good signal | Small, readable types | If another engineer can understand your model from a short interface snippet, you’re on the right track. |

### State checkpoint

A solid toast data model treats each toast as a small, self-contained piece of state with clear fields for variant, placement, lifetime, and accessibility. This keeps the rendering logic simple and makes the global store easy to reason about.

### Toast state ownership

Keep durable toast content separate from runtime timer handles. Toast state contains message, variant, urgency, lifetime, dedupe key, announcement state, and optional action command. Runtime state contains deadline and pause reasons. This separation prevents serialization of browser handles and makes pause, update, dismissal, and teardown deterministic.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| Toast | content, urgency, lifetime, action | Global UI store |
| ToastRuntime | deadline, pause reasons, timer handle | Lifecycle coordinator |
| OverflowPolicy | maxVisible, queue, collapse rules | Provider config |
| AnnouncementState | announced, urgency, group key | Accessibility coordinator |

## Interfaces

---

Expose a compact API: create a semantic toast, update its content or behavior, dismiss one ID, or dismiss every toast in this provider. The provider owns normalization, lifecycle, and rendering; callers never receive timer or DOM handles.

Contract checks:
- Create calls return a stable toast ID.
- Update can change message, description, lifetime, urgency, and action state.
- Dismiss-all is scoped to the provider represented by this API instance.
- DOM nodes, timer handles, and announcement internals remain private.

---

```typescript
type ToastLifetimeInput =
  | { kind: 'persistent' }
  | { kind: 'timed'; durationMs?: number };

interface ToastOptions {
  description?: string;
  placement?: ToastPlacement;
  lifetime?: ToastLifetimeInput;
  urgency?: 'polite' | 'urgent';
  dedupeKey?: string;
  action?: {
    label: string;
    command: () => Promise<void> | void;
  };
}

interface ToastPatch extends Partial<ToastOptions> {
  message?: string;
}

interface ToastApi {
  success(message: string, options?: ToastOptions): string;
  error(message: string, options?: ToastOptions): string;
  warning(message: string, options?: ToastOptions): string;
  info(message: string, options?: ToastOptions): string;
  update(id: string, patch: ToastPatch): void;
  dismiss(id: string): void;
  dismissAll(): void;
}

interface ToastProviderProps {
  children: unknown;
  placement?: ToastPlacement;
  timedDurationMs?: number;
  maxVisible?: number;
}

```

### Core interfaces

| Interface | Shape (example) | Design rationale |
| --- | --- | --- |
| ToastOptions | { description?, placement?, lifetime?, urgency?, dedupeKey?, action? } | ToastOptions makes persistence and urgency explicit. Supplying an action resolves to persistent lifetime unless the caller provides a separately governed action expiry. |
| ToastApi | create helpers, update(id, patch), dismiss(id), dismissAll() | Each create call returns a stable ID. Update accepts message as well as option fields, and dismissAll applies to the current provider. |
| ToastProviderProps | { placement?, timedDurationMs?, maxVisible?, children } | The provider resolves placement, a measured default timed lifetime, and the visible-stack limit. |
| Internal store methods | add(toastPartial), remove(id), clear(), subscribe(listener) | "Internally the store exposes methods like add, remove, clear, and subscribe. The toast API calls add, and the provider subscribes to render changes." |
| ToastContainer props (internal) | { toasts, placement } | "ToastContainer is given toasts plus a placement and is responsible for stacking them and positioning them correctly in the viewport." |

### Required public behavior

- Simple helper functions: toast.success, toast.error, toast.warning, toast.info.
- An optional options object (ToastOptions) for per-toast overrides.
- A way to dismiss a specific toast (toast.dismiss(id)) and all toasts (toast.dismissAll()).
- Provider-level props for global defaults (placement, duration, maxVisible).
- A clear contract that toast.*() can be called from anywhere that has access to the API (not tied to one component).

### Keep outside the public API

- Exposing low-level details like setTimeout handles or DOM nodes.
- Requiring callers to pass full Toast objects instead of a simple message + options.
- Needing the caller to manually manage IDs or stacking order.
- Having separate, unrelated APIs for each variant with different shapes.
- Needing UI components to know about the internal store implementation.

### Call flow

1. Caller triggers a toast: A component or service calls toast.success('Profile saved', { lifetime: { kind: 'timed' } }).
2. API builds a toast: The helper creates a ToastRecord with a new ID and resolves placement, urgency, and lifetime from explicit options plus provider policy.
3. Store update: The helper calls into the toast store’s add() method. The store updates its toasts array and notifies subscribers.
4. Provider re-renders: The ToastProvider, subscribed to the store, receives the new toasts list and re-renders the ToastContainer via a portal.
5. Dismissal: When a timed status exhausts its remaining lifetime or the user safely closes a message, the lifecycle coordinator clears runtime resources and dispatches one removal. Actionable or critical messages remain until resolved or explicitly dismissed.

| Signal | Value | Interpretation |
| --- | --- | --- |
| API surface | Tiny & focused | Most apps only need toast.*() helpers and one provider. |
| Data flow | Down via props, up via actions | Callers send events in; the provider reads state and renders UI. |
| Strong signal | Clear contracts | You can explain what each function takes and returns in one sentence. |

### Contract checkpoint

A good toast API feels effortless to use: one import, one provider, and a few tiny helpers. If another engineer can start using your system just by seeing toast.success(message, options?), you’ve designed the interface well.

### UI-facing contract

The API returns a toast ID and supports update and dismiss. Callers choose semantic urgency and lifetime rather than raw ARIA roles by default. An action implies persistent lifetime unless a separately visible business deadline exists. The provider converts polite status to role status and reserves alert for genuinely urgent information.

### Command-to-announcement path

1. Normalize: Resolve defaults, persistence, urgency, and a safe dedupe key.
2. Insert: Apply overflow policy without hiding a distinct critical outcome.
3. Announce: Group or serialize meaningful status changes so assistive technology is not flooded.
4. Dispose: Clear timer and observer resources before removing the record.

# Failure Modes

Cover performance (many toasts, frequent updates), timers and cleanup, accessibility details, z-index issues, and how you’d keep the UX sane on different devices.

---

Start with a global store, portal, one lifecycle coordinator, and semantic announcements. Measure burst size, action completion, animation cost, and reading opportunity before tuning visible limits, motion, or timed lifetimes.

Toast quality checks:
- Optimization begins from a correct lifecycle and recovery model.
- Burst handling must not hide distinct actionable or critical outcomes.
- Timer, announcement, and animation behavior are measured separately.
- Desktop, mobile, reduced-motion, keyboard, and screen-reader paths remain equivalent.

---

### Baseline safeguards

- Limit the maximum number of visible toasts (e.g. 3–5) and remove or queue older ones.
- Ensure timers are always cleared on unmount or when toasts are removed.
- Use timing only for low-risk status messages and pause remaining time for focus, hover, page hiding, or applicable user timing preferences.
- Debounce or collapse identical messages (e.g. repeated "Network error" toasts).
- Make manual close cancel the active timer before removing the toast.
- Use CSS transitions for enter/exit animations instead of heavy JS-based animation loops.

### Accessibility and UX deep-dive points

- Use status and polite announcement by default; reserve alert for genuinely urgent information.
- Announce only the important text to screen readers, not decorative content.
- For interactive toasts with buttons, ensure focus is visible and keyboard navigation works.
- Respect reduced motion preferences by disabling or simplifying animations.
- On mobile, consider full-width toasts at top/bottom with larger touch targets.

### Explicit edge cases

- Many toasts fired quickly: cap visible toasts, group only safely equivalent statuses, and queue distinct actionable or critical outcomes.
- Duplicate messages: dedupe, collapse counts, or let callers provide stable ids.
- Max visible toasts: keep layout bounded and avoid covering primary UI.
- Overflow policy: low-risk duplicate statuses may collapse, while distinct actionable or critical outcomes stay persistent and recoverable.
- Persistent actions and adjustable timing: users must have enough time to read, understand, and operate every message.
- Manual close cancels timer: no timeout should fire after the toast is gone.
- Route changes: choose whether to keep contextual toasts or clear them on navigation.
- Provider unmount: clear subscriptions, timers, and pending queues.
- Reduced motion: disable or simplify enter/exit animations.
- Screen reader announcement overload: avoid spamming live regions during bursts.
- Z-index conflicts with modals: define the toast layer relative to dialogs and popovers.
- Mobile placement/full-width layout: avoid tiny corner toasts and use larger touch targets.

### Deep-dive topics you can offer

| Topic | Angle | Decision rationale |
| --- | --- | --- |
| Z-index and layering | Toasts vs modals vs dropdowns | Reserve an overlay layer for toasts, then define its relationship to dialogs and popovers so transient feedback cannot unexpectedly cover a blocking interaction. |
| Handling toast storms | Too many notifications | Cap the visible stack. Collapse only messages with a safe dedupe key; queue distinct outcomes so overflow never deletes the sole recovery action. |
| Route changes | Navigation & cleanup | Classify each toast as route-scoped or application-scoped. Navigation clears route-scoped entries and the lifetime coordinator cancels every associated timer. |
| Performance on low-end devices | Avoid jank | Keep each item inexpensive to lay out and paint. If profiling shows jank, simplify shadows, filters, and motion before adding scheduling complexity. |
| Action toasts (Undo) | State consistency | Keep recovery actions visible until completion or explicit dismissal. Pause optional timers during interaction and expose action progress and failure through the same lifecycle coordinator. |

### Toast optimization rollout

1. Ship a clean baseline: Global store, top-level rendering, bounded stacking, polite status announcements, persistent action messages, optional timed low-risk feedback, and complete cleanup.
2. Observe usage: See how many toasts are typically active, which variants are used most, and whether users trigger bursts of notifications.
3. Fix obvious pain points: Cap visible toasts, pause remaining time for every applicable reason, keep actionable or critical messages persistent, and collapse noisy duplicates without hiding distinct outcomes.
4. Polish accessibility & responsiveness: Verify keyboard navigation, screen reader announcements, mobile layout, and behavior under reduced-motion settings.
5. Hardening & edge cases: Test route changes, app teardown, error boundaries, and ensure there are no timer leaks or orphaned toasts in weird flows.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Biggest UX risk | Toast overload | Too many notifications quickly become background noise. |
| Biggest tech risk | Timer leaks | Forgetting to clear timeouts on unmount can cause bugs and memory issues. |
| Strong senior signal | Measure → then tune | You talk about real usage, profiling and trade-offs instead of random micro-optimizations. |

### Transient-feedback invariant

A great toast system isn’t just "it shows notifications". It behaves well when spammed, respects accessibility and motion preferences, cleans up timers reliably, and stays readable and unobtrusive on both desktop and mobile.

### Toast lifecycle failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Burst of identical errors | Collapse by safe key and retain the latest useful context. | The screen is not covered by duplicates. |
| Action command fails | Keep the toast persistent and show retryable state. | User intent remains recoverable. |
| Route changes | Remove route-scoped messages and preserve global outcomes by policy. | Stale context does not linger. |
| Provider unmounts | Cancel deadlines and subscriptions before teardown. | No orphan callback mutates destroyed state. |

### Accessibility behavior

Use role status and polite announcements for ordinary feedback, with role alert reserved for urgent information that truly warrants interruption. A toast appearing never steals focus. Interactive controls participate in normal tab order, display a strong focus indicator, and remain long enough to operate. Timing pauses for focus, hover, page hiding, and applicable user preferences.

### Rollout and measurement

Instrument overflow, duplicate collapse, manual dismissal, action completion, timer pause, and announcement rate. Canary persistent-action behavior before changing default lifetimes, and keep an inline-error fallback for workflows where a toast alone cannot explain recovery.

### Technical references

- [W3C alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) — Appropriate use and focus behavior for alert messages.
- [WCAG timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) — User control requirements for time limits.

# Metrics

- Main concept: Global toast layer. One place in the app renders all toasts.
- Key UX goal: Non-blocking feedback. Users keep working while seeing notifications.
- Key technical concern: Timers & cleanup. No dangling intervals/timeouts when toasts disappear or routes change.
- State ownership: Global store. All toasts live in one place and are easy to observe.
- Rendering strategy: Portal overlay. Toasts render above the main layout without breaking it.
- Developer experience: toast.*() API. Callers don’t care about implementation details, only about a simple function.
- Must-have entities: ToastRecord + runtime. If you clearly define these two, the rest of the design becomes much easier to explain.
- Key idea: Model behavior as data. Variant, placement, lifetime, urgency, and announcement state are explicit data.
- Good signal: Small, readable types. If another engineer can understand your model from a short interface snippet, you’re on the right track.
- API surface: Tiny & focused. Most apps only need toast.*() helpers and one provider.
- Data flow: Down via props, up via actions. Callers send events in; the provider reads state and renders UI.
- Strong signal: Clear contracts. You can explain what each function takes and returns in one sentence.
- Biggest UX risk: Toast overload. Too many notifications quickly become background noise.
- Biggest tech risk: Timer leaks. Forgetting to clear timeouts on unmount can cause bugs and memory issues.
- Strong senior signal: Measure → then tune. You talk about real usage, profiling and trade-offs instead of random micro-optimizations.

# Rollout

### Toast optimization rollout

1. Ship a clean baseline: Global store, top-level rendering, bounded stacking, polite status announcements, persistent action messages, optional timed low-risk feedback, and complete cleanup.
2. Observe usage: See how many toasts are typically active, which variants are used most, and whether users trigger bursts of notifications.
3. Fix obvious pain points: Cap visible toasts, pause remaining time for every applicable reason, keep actionable or critical messages persistent, and collapse noisy duplicates without hiding distinct outcomes.
4. Polish accessibility & responsiveness: Verify keyboard navigation, screen reader announcements, mobile layout, and behavior under reduced-motion settings.
5. Hardening & edge cases: Test route changes, app teardown, error boundaries, and ensure there are no timer leaks or orphaned toasts in weird flows.

### Technical references

- [W3C alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) — Appropriate use and focus behavior for alert messages.
- [WCAG timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) — User control requirements for time limits.
