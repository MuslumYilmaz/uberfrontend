---
title: "Design a Toast Notification System"
slug: "notification-toast-system"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2900
primary_keyword: "toast notification system frontend system design"
status: "converted"
content_schema_version: 2
target_level: "junior"
timebox_minutes: 10
candidate_prompt: "Design the toast feedback layer for a multi-route web app. After a user saves a profile, any feature or service can show a success message; an edit conflict may show Review or Undo. Focus first on the race where manual dismiss and an expiry timer fire together: the toast and timer must be cleaned up once. Explain where records, rendering, and timers live, then show how a burst, route change, and screen-reader update remain safe."
constraints:
  - "Show no more than three toasts."
  - "Actions and critical messages persist."
  - "Services can trigger global feedback."
  - "Rerenders never repeat speech."
expected_decisions:
  - "Choose the owner of global commands, ordered records, and rendering."
  - "Define one timer lifecycle that resolves dismiss-timeout races safely."
  - "Separate visible stacking policy from accessible announcement policy."
prerequisites:
  - "Component state"
  - "Timeout cleanup"
  - "ARIA live regions"
core_skills:
  - "State ownership"
  - "Lifecycle cleanup"
  - "Race handling"
  - "Accessibility"
guided_mock: true
evaluation_must_cover:
  - "One global owner orders the visible stack and overflow queue."
  - "Dismiss and timeout share cleanup; only the first changes state."
evaluation_strong_signals:
  - "Actionable messages persist; the viewport owns no timers."
  - "Separate announcement identity prevents repeat speech after rerenders."
evaluation_expert_stretch: "Route scope, pause/resume, and measured fair overflow."
evaluation_red_flag: "Each component owns timers or announces again on every render."
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Design a Toast Notification System."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Design a Toast Notification System."
unique_angle: "Design a global toast system with typed commands, stacking, deduplication, lifecycle ownership, persistent actions, responsive placement, and accessible announcements."
what_this_adds_beyond_basics: "Adds a scenario-led junior answer, explicit ownership, a dismiss-timeout race, accessible announcement identity, and measurable verification."
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
last_fact_checked_at: "2026-08-06"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

This toast notification system frontend system design exercise is deliberately smaller than a notification center. The actor is a person editing a profile, the immediate goal is trustworthy feedback, and the main failure is a cleanup race. The answer should follow two messages: a low-risk Profile saved status and a conflict that exposes Review or Undo. Starting with those messages makes each architecture choice observable.

Candidate prompt: Design the toast feedback layer for a multi-route web app. After a user saves a profile, any feature or service can show a success message; an edit conflict may show Review or Undo. Focus first on the race where manual dismiss and an expiry timer fire together: the toast and timer must be cleaned up once. Explain where records, rendering, and timers live, then show how a burst, route change, and screen-reader update remain safe.

The reference answer stays on the browser feedback layer. The server still owns profile persistence, conflict detection, and the authoritative result of Review or Undo. A toast reports that result and can invoke a domain command, but it is not the system of record. A separate notification feed, unread counts, server retention, delivery across devices, and push notifications are outside the baseline.

## A 10-minute answer

- **Open with the user story.** A user saves a profile and sees Profile saved without losing focus. A later edit conflict shows Review or Undo and remains available until it is resolved or safely dismissed. Either event may come from a component or a service, so callers need one global command API rather than a container on every page.
- **Set the boundary.** Accept typed commands, keep at most three records visible, and put additional distinct records into an ordered overflow queue. Low-risk status messages may expire. Actionable and critical messages are persistent because a timer must not remove the user’s only recovery path.
- **Assign one owner per job.** The store owns normalized records and order. A lifecycle coordinator owns expiry handles and cleanup. The viewport renders the store through one root portal and returns interaction intent. A separate announcer tracks which announcement IDs have already been emitted.
- **Resolve the required race.** Manual dismiss and timeout both request removal for the same ID. The first request changes state and disposes runtime. The second sees a terminal or missing ID and does nothing. There is one removal transition and no late callback that can delete a newer toast.
- **Close with behavior.** A burst never renders more than three messages. The narrow layout reflows without changing identity. Ordinary feedback is announced politely once, urgent feedback is reserved for real interruption, appearance never steals focus, and action controls remain keyboard reachable.

# Clarifying Questions

Ask only questions that can change the baseline model, then state assumptions so the design can proceed.

- **Who can trigger a toast?** Assume React components, request handlers, and plain services can all emit commands. That rules out prop drilling and page-local containers.
- **Which messages may expire?** Assume an informational success can use a product-configured timed lifetime. Any message containing Review, Undo, retry, or another recovery control is persistent unless the underlying domain action visibly expires.
- **How much can appear at once?** Use three visible records as the given product constraint on desktop and mobile. Extra distinct outcomes wait in insertion order. This is an admission rule, not permission to erase data.
- **When may duplicates collapse?** Only when the caller supplies a stable dedupe key that means the events represent the same outcome. Equal sentence text is insufficient because two failures can need different recovery actions.
- **What does accessible feedback mean here?** Ordinary status should be polite, urgent interruption should be rare, toast appearance should not move focus, interactive controls should be operable by keyboard, and a visual rerender should not cause repeated speech.
- **Where does rendering live?** Assume one application root can mount a provider and portal-backed viewport. The public API remains usable by code that is not under a particular feature component.

These assumptions keep the junior answer focused: global state, explicit lifetime, bounded rendering, one cleanup gate, and independent announcement identity. Placement variants, animation themes, a history panel, and cross-device delivery do not need to appear in the first diagram.

# Architecture

Draw four boxes after the public command API: store, lifecycle coordinator, viewport, and announcer. Arrows should show commands entering the store, the coordinator reacting to timed records, the viewport deriving rows from the store, and the announcer consuming eligible announcement events. No rendered item owns an independent copy of these responsibilities.

## Ownership map

**Toast store.** The store owns normalized `ToastRecord` values, their visible order, their queued order, and whether an ID has reached its removal transition. It accepts add, update, and remove commands. With fewer than three visible records, an add enters the visible list; otherwise a distinct record enters the ordered queue. Removing a visible record promotes the next queued record. The store does not retain browser handles or DOM references.

**Lifecycle coordinator.** The lifecycle coordinator owns one optional expiry handle for each timed record. It receives the resolved duration only after normalization, submits an expiry signal when needed, and disposes the handle when removal wins. Persistent records never receive a handle. Central ownership makes it possible to prove that manual dismissal and expiry converge through one operation.

**Toast viewport.** The viewport subscribes to visible store records and renders them through a root portal. It applies placement and the three-record visual bound, gives action and close controls accessible names, and sends interaction intent back to the command layer. It does not start timeouts, mutate the queue, or decide whether a message has already been announced.

**Announcer.** The announcer owns a stable live region and a set of emitted announcement IDs. It receives a semantic event when a record first becomes eligible for speech. A component rerender, reorder, or responsive move does not create a new event. Polite messages use status behavior; urgent messages may use alert behavior when interruption is justified. Appearance itself never moves focus.

## Rendering and action semantics

The portal is a rendering tool, not another state owner. Mount one container beside the application root, subscribe it to the store, and use the design system’s overlay layer instead of scattering high `z-index` values through features. The viewport can choose top-end placement on a wide screen and an inset full-width row on a narrow one, but both layouts render the same IDs in the same logical order. A dialog remains the blocking surface; toast feedback must not cover its primary controls or pretend to replace its validation.

Interactive messages need a clear focus story. Toast appearance leaves current focus where the user is working. Review, Undo, retry, and close enter ordinary tab order when the user reaches the viewport. If an action removes the focused toast, focus returns to a meaningful workflow target chosen by the feature contract, not to the document body. Action state is rendered from the store, so pending disables duplicate activation and failure exposes retry without creating a second toast for the same task.

The command and lifecycle diagram should read as: global command to store; store to lifecycle coordinator, viewport, and announcer; dismiss or expiry back to one removal gate. The text fallback says that the viewport renders no more than three records, the coordinator schedules or cancels expiry, and the announcer speaks each eligible ID once.

## Data contracts

The store record contains semantic content. Runtime contains browser-only cleanup state. Announcement history is a third record owned by the announcer, not a boolean on each visual toast.

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
  action?: {
    label: string;
    commandId: string;
    state: ToastActionState;
  };
}

interface ToastRuntime {
  toastId: string;
  deadline?: number;
  timerHandle?: ReturnType<typeof setTimeout>;
  status: 'scheduled' | 'removing' | 'disposed';
}

interface AnnouncementState {
  emittedIds: Set<string>;
}

interface ToastState {
  visible: ToastRecord[];
  queued: ToastRecord[];
  defaultPlacement: ToastPlacement;
  defaultTimedDurationMs: number;
  maxVisible: number;
}
```

Each identity has one purpose. `id` names a single lifecycle. `dedupeKey` joins repeated reports of the same outcome. `commandId` names an action invocation. `emittedIds` prevents repeat speech. Combining these identities would make update, cleanup, and accessibility behavior depend on accidental message equality.

## Public interface

Feature code supplies semantic options. It must not select raw ARIA roles, create a timeout, query the portal, or know whether its record is visible or queued.

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

Returning the ID lets a caller update progress or dismiss one known result without searching by sentence text. `persistent` is an explicit lifetime rather than a magic duration. Provider configuration sets one viewport policy. An action implies persistent lifetime during normalization; if the action fails, the same record moves to failed state and exposes retry.

## Scenario walkthrough

When profile save succeeds, the caller emits a polite timed command with a stable dedupe key. The store assigns an ID and admits it. The lifecycle coordinator creates one runtime entry, the viewport displays Profile saved, and the announcer emits that ID once. A repeated report with the same safe key updates or collapses the existing result rather than adding a second sentence.

An edit conflict then emits a persistent Review record. It receives no expiry handle. Selecting Review changes its action state to pending and prevents repeated activation. Failure keeps the record visible with retry and useful context. Success updates or removes the same ID, while the profile domain remains authoritative about whether the conflict was resolved.

If manual dismiss and expiry race for the success record, both submit `remove(id, cause)`. The first accepted request moves runtime to removing, clears its handle, removes the store record, and promotes queued work. The second request sees disposed state or a missing ID and returns unchanged. This is the central invariant, not an edge detail delegated to each row.

## Removal transaction

Treat removal as a small transaction keyed by toast ID. Read the runtime state, reject a terminal or unknown ID, mark the accepted ID as removing, dispose its browser handle, update visible and queued lists, then publish the next snapshot. Publishing after disposal prevents a rerender from observing a removed record with a live callback. Promotion also happens inside this transaction, so two racing signals cannot admit two queued records into one slot. `dismissAll` applies the same operation to a captured set of IDs rather than clearing arrays first and leaving runtime behind.

The cause is useful evidence, not a second control path. Record whether removal came from dismiss, expiry, action success, replacement, or provider teardown, but keep cleanup identical. This makes telemetry explain behavior without allowing metrics code to influence lifecycle semantics.

# Tradeoffs

## Global store versus component ownership

A global store adds one shared dependency, but it matches the requirement that a service can trigger feedback and that one viewport controls visual capacity. Component-local state would be simpler for a single form, yet it would duplicate containers, lose feedback when that component disappears, and make cross-feature ordering undefined. Keep the public helper thin so the store remains replaceable.

## Ordered queue versus rendering every command

Rendering every command is direct but can cover content and overwhelm assistive technology during a burst. A three-record viewport plus an ordered queue keeps layout bounded while preserving distinct outcomes. Dedupe is opt-in through a meaningful key. Matching only by message text is unsafe because equal wording can refer to different entities or actions.

## Explicit lifetime versus one default duration

A universal duration is easy to configure but wrong for Review, Undo, critical errors, and retry. A lifetime union forces the caller or normalization policy to choose timed or persistent behavior. Low-risk statuses can still inherit one product default. The distinction remains inspectable in tests and avoids special values such as zero meaning forever.

## Announcement events versus DOM observation

Watching inserted DOM nodes requires little application state, but presentation churn can look like new information. Explicit announcement identity needs a small emitted-ID set, yet it makes one-time delivery testable and decouples screen-reader output from animation, position, and framework rendering. The announcer can also serialize meaningful updates without stealing focus.

## Expert stretch

Cover route scope, pause and resume, and measured policies for fair overflow. Define whether navigation clears route-scoped records while application-scoped outcomes survive. If research shows users need more reading time, store remaining lifetime and resume from it instead of resetting a duration. If queue telemetry shows starvation, compare admission policies using observed urgency, age, and recovery value rather than inventing an unmeasured priority rule. These are extensions after the baseline ownership and race are correct.

# Failure Modes

**Dismiss and expiry arrive together.** Both signals enter the same removal gate. The first transition changes state and disposes the timeout. The late signal is a no-op. Tests must fire the two callbacks in both orders and assert one store removal, one disposal, and one queue promotion. A timer inside every `ToastItem` would make this invariant depend on render timing and is therefore rejected.

**A burst exceeds visual capacity.** The store keeps three records visible and appends additional distinct records to the ordered queue. Removing a visible record admits the next item once. The viewport never slices an independent array and never silently loses the remainder. A safe dedupe key may collapse repeated reports, but unrelated outcomes and recovery actions stay distinct.

**The action command fails.** Review or Undo remains persistent while pending. Repeat activation is disabled for that command ID. Failure updates the same record with retry and context; success updates or removes it. The toast does not claim success based only on a click, and a generic status duration cannot erase the recovery path.

**The viewport unmounts.** Teardown unsubscribes the viewport and disposes lifecycle resources before a callback can publish to a destroyed subscriber. Store and coordinator ownership make that work independent of child row unmount order. Repeated disposal is safe. A later command requires a mounted application provider to become visible.

**Visual updates repeat speech.** The announcer checks `emittedIds` before writing its live region. Changing placement, responsive width, action state, or list order does not re-emit the original sentence. A meaningfully new failure can use a new announcement event. Ordinary statuses remain polite, while alert is reserved for information that warrants interruption.

**Keyboard or narrow layout hides recovery.** Toast appearance never moves focus. Action and close controls have descriptive labels, visible focus treatment, and predictable order. Long localized text wraps, the viewport uses available inline width, and controls remain reachable without horizontal clipping. Reduced-motion settings remove decorative transitions without changing lifecycle semantics.

The dismiss-timeout diagram should show both signals converging on one terminal transition. Its text fallback states that dismiss can mark the ID removing and clear the handle before a late timeout, or timeout can win before a late dismiss; either late signal observes terminal state and does nothing.

# Metrics

Begin with correctness signals tied to the model rather than arbitrary performance targets.

- Record removal count and runtime disposal count by toast ID in automated tests; each lifecycle should finish once.
- Observe visible count and queue depth during bursts; the rendered count respects provider capacity while queued distinct outcomes remain accounted for.
- Track duplicate collapse by dedupe key and sample false joins during review; message text alone should never be the joining rule.
- Track action start, success, failure, retry, and manual dismissal so product teams can see whether a transient surface is hiding unresolved work.
- Count announcement events by ID in accessibility tests and compare them with eligible semantic events, not React render count.
- Exercise localized long text and keyboard controls at narrow and wide viewports, recording clipping, overlap, and unreachable-action regressions.

Runtime profiling should concentrate on burst rendering, layout, paint, and subscription churn on representative devices. If measurement shows jank, simplify shadows and motion before adding scheduling machinery. Page-level or inline error presentation remains the recovery fallback when a toast cannot carry enough context.

For manual review, perform the profile scenario with keyboard only, then repeat it with a screen reader. Trigger one save result twice, open the conflict action, force its failure, resize to a narrow viewport, and complete the action. Reviewers should hear the save once, retain access to retry, see no clipped control, and find focus in a meaningful place after the action record leaves. This short script connects the metrics to behavior a candidate can explain.

# Rollout

Ship the baseline behind the existing provider boundary: typed commands, one store, a three-record viewport, an ordered overflow queue, explicit timed or persistent lifetime, one lifecycle coordinator, and a stable announcer. Keep Review and Undo persistent from the first release rather than migrating away from a risky duration later.

Before broad adoption, add deterministic tests for both dismiss-expiry orders, four-command admission, safe duplicate collapse, action failure and retry, teardown disposal, one-time announcements, keyboard operation, reduced motion, and narrow localized layouts. Integrate two low-risk producers first, such as profile save and settings save, so command and dedupe semantics can be reviewed before every feature adopts the helper.

Instrument queue depth, removal cause, action outcomes, duplicate collapse, and announcement emission. Review those signals by viewport class and with assistive-technology test runs. Canary changes to provider defaults rather than changing every caller at once. Document that toasts are feedback, not authoritative recovery storage, and require an inline or page-level error whenever the user needs durable context to complete a task.

After the baseline proves stable, teams can evaluate the Expert stretch from observed behavior. The acceptance bar remains simple: feature code describes feedback, each piece of runtime has one owner, late signals cannot change completed state, persistent actions remain usable, and screen-reader output reflects semantic events rather than render churn.
