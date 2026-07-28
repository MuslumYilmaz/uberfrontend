---
title: "Flashcard-based Language Learning App"
slug: "flashcard-language-trainer"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "flashcard language trainer frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Flashcard-based Language Learning App."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Flashcard-based Language Learning App."
unique_angle: "Design a flashcard study experience with session state, offline progress, conflict-safe sync, input-independent reveal, reduced motion, and accessible feedback."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Flashcard-based Language Learning App."
competitor_query: "Flashcard-based Language Learning App frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/CSS/will-change"
  - "https://www.w3.org/WAI/ARIA/apg/patterns/button/"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

flashcard language trainer frontend system design. Design a flashcard study experience with session state, offline progress, conflict-safe sync, input-independent reveal, reduced motion, and accessible feedback.

## Requirements

Design a language-study session that records each recall durably, reconciles scheduling revisions across devices, and provides equivalent pointer, touch, keyboard, reduced-motion, and nonvisual interaction.

---

Design a language-study app where each card reveals its answer through an explicit click, tap, or keyboard command. Pointer hover may preview affordance but is never the only reveal mechanism. The experience must support repeated sessions, progress sync, reduced motion, multiple writing systems, and nonvisual access to both sides.

Quality criteria:
- Learning flow takes priority over flip animation.
- Deck content, session state, scheduling state, and pending answers have clear owners.
- Pointer, touch, keyboard, reduced-motion, and nonvisual paths are equivalent.
- Every answer is durably recorded before network batching.
- Offline caching and synchronization remain bounded and recoverable.

---

### User flow

1. Choose language and deck: User signs in (optional), picks source/target languages and a specific deck (e.g. "Spanish A1 – Food").
2. Load a study session: App fetches a batch of cards for this deck, shows the first card front (user's language) with instant feel (skeletons / cached data if needed).
3. Flip the card: Click, tap, Enter, or Space reveals the card's back, including an optional hint or example. The state change remains clear when motion is reduced or disabled; hover alone never changes required study state.
4. Mark recall: User marks "I knew this" / "I didn’t know this" or similar. The app records this and immediately moves to the next card.
5. Persist progress: Progress is sent to the backend (or queued offline) so that future sessions can prioritize harder cards.
6. Session summary: User sees a short summary (cards reviewed, accuracy, streak) and can continue or switch decks.

### Explicit assumptions

- Card flips must feel instant, even on slow networks.
- The same deck should be consistent across devices for a logged-in user.
- The UI must work with keyboard only (no hover-only interactions).
- Animations should be smooth but not block accessibility.
- We can batch progress updates instead of sending every action individually.
- We can store some data on the client (localStorage/IndexedDB) for faster reloads.
- The system can preload the next card(s) to avoid visible loading.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Key UX goal | Frictionless study sessions | Users should be able to flip through many cards quickly with minimal waiting or distractions. |
| Key performance idea | Batch & cache cards | Fetch cards in batches and cache them so the next flip is always instant, even with flaky networks. |
| Key FE decision | Where to run SRS logic? | Decide whether spaced-repetition scheduling lives on the client, server, or a hybrid model. |

### Critical trade-offs

More client-side scheduling can make offline sessions immediate but increases reconciliation risk. Server-authoritative scheduling simplifies cross-device consistency but adds latency, so the design mirrors only the state needed for responsive study and reconciles by command identity and revision.

### Frontend boundary

The client owns study-session state, reveal interaction, local progress queue, offline cache, sync reconciliation, and accessible feedback. Scheduling authority and account persistence remain abstract versioned service contracts.

# Clarifying Questions

- Do we support authenticated users with persistent progress, or anonymous sessions too?
- Is there a spaced-repetition model (e.g. Leitner / SM-2), or just simple counts and accuracy?
- How many decks and cards per deck should we expect (hundreds, thousands, more)?
- Do we need offline or spotty-network support for study sessions?
- Do cards only contain single words, or can they have phrases, audio, images, and example sentences?
- Are we targeting mobile web heavily? Is this PWA-like usage (add to home screen)?
- Is RTL support (e.g. Arabic, Hebrew) in scope from day one?

# Architecture

Describe the system in terms of clear components: where cards come from, where progress is stored, how flipping works, and how the client and server communicate.

---

Split the client into a StudySession controller, FlashcardViewer, card repository, durable progress-command queue, and SyncCoordinator. The viewer owns reveal presentation; the controller advances only after the recall command is durably appended.

Boundary checks:
- Reveal presentation, session position, content loading, and sync are separate.
- Answer commands are persisted before transport batching.
- Server schedule revisions remain authoritative across devices.
- Click, tap, Enter, and Space perform the same reveal action.
- One controlled viewer supports multiple decks and study modes.

---

### Core building blocks

| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| StudySession Screen | Chooses deck, manages session-level state, loads initial batch of cards. | "This screen decides which deck to load, fetches the first batch via the data service, and controls the study flow." |
| FlashcardViewer component | Handles flip animation, keyboard/touch controls, and displays front/back content. | The viewer owns presentational reveal state, supports click, tap, and keyboard activation, exposes both sides to assistive technology according to the chosen disclosure pattern, and emits recall intent without performing network writes. |
| CardDataService | Fetches batches of cards, preloads next ones, abstracts API details. | Expose loadBatch(deckId) and preloadNext() so pagination and prefetch policy stay behind the repository boundary. |
| ProgressSync module | Persists answer commands, batches transport, and reconciles per-command outcomes. | Each answer receives a command ID, base schedule revision, and durable queue record before the session advances. |
| Client cache (IndexedDB) | Keeps decks and recent cards locally for fast reloads and offline sessions. | "Caching lets the app feel instant — even if the network is slow or the user reopens a deck multiple times." |

### Study-session policy decisions

- FlashcardViewer owns UI state only (flip, front/back, animation).
- StudySession screen owns learning flow state (current card index, batch management).
- Data service isolates API calls so UI never worries about endpoints.
- Progress is recorded optimistically and synced in batches.
- Client caching improves perceived speed and allows partial offline work.
- A transform-based reveal avoids layout-heavy geometry changes, but animation and layer behavior are profiled on representative devices.

### Failure patterns

- Putting fetch logic and animation logic inside the same component.
- Triggering API calls directly from the flip animation.
- Keeping each card as separate network request.
- Not accounting for mobile interactions (tap instead of hover).
- Relying on hover-only effects that break accessibility.
- No strategy for batching or syncing progress.

### Data flow

1. User enters StudySession screen: Screen requests the first batch of cards from CardDataService using the selected deck.
2. Data loads & viewer renders: The FlashcardViewer shows the first card front-side immediately. Meanwhile, next cards are preloaded.
3. User flips and marks recall: The viewer reveals the card's back and emits recall intent. The controller creates a versioned command and waits for durable queue acknowledgement before advancing.
4. Progress batches accumulate: The durable queue stores idempotent commands independently from the current batch or page lifecycle.
5. Sync to server: The SyncCoordinator batches queued commands for transport, then removes only acknowledged identities and retains retryable failures.

| Signal | Value | Interpretation |
| --- | --- | --- |
| State ownership | Split cleanly | UI state in components, learning flow in the screen, data logic in services. |
| Side-effects | Isolated | Fetching, caching, and syncing live in dedicated modules. |
| Reusability | High | The same FlashcardViewer can power multiple decks and study modes. |

### Study-session ownership

Good architecture keeps responsibilities tight: UI flips cards, services fetch data, sync modules handle progress. The moment you mix these responsibilities, performance and maintainability both suffer.

### Worked example: offline answer syncs after another device

A learner marks card c7 incorrect while offline. Before reconnection, another device records c7 correct with a newer server revision. The UI must preserve the offline attempt as history without blindly replacing scheduling state.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Offline answer occurs | Append a command with client ID and base revision 4. | Advance immediately and mark progress pending. | Study flow does not wait for network. |
| Other device reaches revision 5 | Server scheduling state changes independently. | Local session remains intact. | Remote authority is versioned. |
| Reconnect sends command | Submit idempotently and receive conflict plus merged history. | Explain that progress synced with an updated schedule. | An attempt is not silently discarded. |
| Next batch loads | Use the server-confirmed schedule and clear the pending command. | Card order updates at a safe session boundary. | Current card does not jump mid-answer. |

# Tradeoffs

## Data

Show that you understand what a deck looks like, how a single card is represented, and how user progress and session state are modeled on the frontend.

---

Keep the data model simple: one type for a deck, one for each card, one for per-user progress, and one for the UI/session state (current index, side shown, loading, error). The server might store more, but the frontend only needs a subset to run smooth study sessions.

State-model checks:
- Deck and card content stays separate from user-specific progress and preferences.
- Session state makes the current card, visible side, loading state, and error explicit.
- The browser model includes only the subset required for a study session, not a storage schema.
- Each entity has a clear client, cache, or service-contract owner.

---

### Core entities

| Entity | Fields (example) | Design rationale |
| --- | --- | --- |
| Deck | id, name, sourceLang, targetLang, description?, cardCount, levelTag? | "A Deck represents a collection of cards, like 'Spanish A1 – Food'. It has an id, a name, language pair, and maybe a card count and level tag for the UI." |
| Card | id, deckId, frontText, backText, hint?, exampleSentence?, tags[]? | "A Card is the unit we show in the viewer: front text in the user's language, back text in the target language, plus optional hint or example sentence." |
| UserProgress | userId, deckId, cardId, lastReviewedAt, successStreak, timesSeen, timesCorrect, bucketOrEase? | "UserProgress ties a user to a card: how many times they've seen it, how often they were correct, and maybe which spaced-repetition bucket it's in." |
| StudySessionState | deckId, cards[], currentIndex, side, status, errorMessage?, queuedCommands[] | StudySessionState tracks the loaded deck, current card, visible side, view status, and identities of durable recall commands awaiting reconciliation. |
| UserSettings | userId, dailyGoalCards, reducedMotion, revealMode, showHintsByDefault? | UserSettings contains study and presentation preferences, but the primary reveal action always remains available to pointer, touch, and keyboard users. |
| SrsConfig (optional) | algorithm ('leitner'\|'simple'), reviewIntervals[], maxNewPerDay | "If the app uses spaced repetition, SrsConfig describes the algorithm and intervals so both client and server can agree on scheduling." |

```typescript
type RecallResult = 'correct' | 'incorrect';

interface Card {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  contentVersion: number;
  hint?: string;
}

interface StudySession {
  sessionId: string;
  deckId: string;
  cardIds: string[];
  currentCardId: string | null;
  revealed: boolean;
}

interface ScheduleState {
  cardId: string;
  dueAt: number;
  revision: string;
}

interface ProgressCommand {
  commandId: string;
  sessionId: string;
  deckId: string;
  cardId: string;
  result: RecallResult;
  answeredAt: number;
  baseRevision: string;
}

interface ProgressQueueItem {
  command: ProgressCommand;
  attempts: number;
  lastAttemptAt?: number;
}
```

### Explicit entities

- A clear Card type with front/back text and optional hint/example.
- A Deck entity that groups cards and carries language pair metadata.
- A per-user UserProgress model that tracks recall quality per card.
- StudySessionState holding current card index, which side is visible, and loading/error flags.
- Durable recall commands with stable identity, base schedule revision, and reconciliation state.
- Optional UserSettings that affect the flip behavior and UI.

### Avoid

- Designing a huge relational schema when the question is about frontend data.
- Mixing UI-only fields (like DOM refs) into Card or Deck.
- Hiding session state in local variables instead of a clear state model.
- Letting 'no data yet' and 'error' both be represented as cards.length === 0.
- Embedding algorithm details everywhere instead of having a small, dedicated SRS config.

### How data changes over time

1. Session starts: StudySessionState starts with status = 'loading', cards = [], currentIndex = 0, side = 'front' while the app loads a batch of cards for the chosen deck.
2. Cards loaded: Cards fill in from the API, status = 'ready', currentIndex = 0, and the first card’s front is shown. UserProgress for those cards may be fetched or lazy-loaded.
3. Persist recall before advance: When the learner answers, the controller creates a ProgressCommand with command ID, session ID, answer, timestamp, and base schedule revision. The durable queue acknowledges the write before the session advances.
4. Move to next card: currentIndex increments, side resets to 'front'. If the end of the batch is near, the app may prefetch more cards and append them to cards.
5. Sync and update progress: The SyncCoordinator batches durable commands. Per-command outcomes advance confirmed schedule revisions, remove acknowledgements, and retain retryable failures without resending successful answers.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Must-have entities | Deck + Card + UserProgress + SessionState | These cover content, personalization, and UI behavior. |
| Key idea | Separate content from progress | Cards are shared; progress is per user and per deck. |
| Good signal | Explicit session model | Current card, side, and status live in one clear structure instead of scattered flags. |

### State checkpoint

A strong data model for this app separates what is being learned (cards, decks) from how well the user knows it (progress, SRS) and from what is currently happening on screen (session state). Keeping these layers clean makes both the UI and the sync logic much easier to reason about.

### Content, session, and progress ownership

Separate immutable card content, session position, reveal state, server scheduling metadata, and queued progress commands. A progress command records answer, timestamp, session ID, base revision, and idempotency key. User settings may reduce motion or hints but never remove click, tap, and keyboard reveal paths.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| Card | id, front, back, hint, contentVersion | Content cache |
| StudySession | batch IDs, currentId, revealed, stats | Local session |
| ScheduleState | cardId, dueAt, revision | Server cache |
| ProgressCommand | commandId, answer, baseRevision | Offline queue |

## Interfaces

Show that you can define simple, focused interfaces: what props the flashcard viewer takes, what the data service returns, and how progress updates are sent to the backend.

---

Keep the surface small: load a versioned card batch, render one controlled FlashcardViewer, durably append ProgressCommand records, and synchronize batches through a service that returns one outcome per command.

Contract checks:
- Viewer, content loading, durable queue, and sync remain separate.
- Commands carry identity, base schedule revision, and answer time.
- Sync returns applied, conflict, rejected, or retryable outcomes per command.
- Animation details and transport batching do not leak into viewer props.

---

### Core interfaces

| Interface | Shape (example) | Design rationale |
| --- | --- | --- |
| LoadCardsParams | { deckId: string; batchSize?: number; cursor?: string; includeProgress?: boolean; } | "LoadCardsParams tells the backend which deck to load, how many cards we want, and optionally a cursor and flag to include user progress." |
| CardBatchResult | { cards: Card[]; nextCursor?: string; hasMore: boolean; } | "CardBatchResult returns a batch of cards plus hasMore and an optional nextCursor for subsequent calls." |
| ProgressCommand | { commandId, sessionId, deckId, cardId, result, answeredAt, baseRevision } | The durable unit of intent can be retried idempotently and reconciled against one schedule revision. |
| SyncProgressResult | { outcomes: ProgressOutcome[]; scheduleCursor: string } | Per-command outcomes prevent a partial batch failure from resending acknowledged learning history. |
| FlashcardViewerProps | { card: Card; mode?: 'study' \| 'review'; side: 'front' \| 'back'; disabled?: boolean; onFlip(nextSide: 'front' \| 'back'): void; onAnswer(result: 'correct' \| 'incorrect'): void; } | "FlashcardViewer receives a card, knows which side to show, and emits callbacks when the user flips or answers. It doesn’t know about networking." |
| StudySessionScreenProps | { deckId: string; loadCards: (params: LoadCardsParams) => Promise<CardBatchResult>; syncProgress: (payload: SyncProgressPayload) => Promise<SyncProgressResult>; } | "The StudySession screen gets injected with loadCards and syncProgress so it orchestrates the flow but doesn’t hardcode how the backend works." |

### Required public behavior

- A loadCards(deckId, ...) API for fetching a batch with cursor or simple pagination.
- A syncProgress(commands[]) API that returns one outcome for each command identity.
- A FlashcardViewer props interface with controlled side and onFlip / onAnswer callbacks.
- A simple Card shape with fields front/back/hint/example.
- Clear error handling conventions (e.g. rejected promises or { error } in the result).
- Optional includeProgress flag if you want the server to pre-resolve which cards to show based on SRS.

### Keep outside the API

- Exposing low-level animation details (e.g. duration, easing) as required props for basic use.
- Making FlashcardViewer call the network directly.
- Forcing the caller to send one HTTP request per card instead of batched updates.
- Returning different shapes for the same endpoint depending on random flags.
- Hiding crucial information like hasMore or nextCursor inside opaque strings.

### Client request lifecycle

1. Start session: StudySession screen calls loadCards({ deckId, batchSize }) to fetch the first batch. On success it updates its state and renders FlashcardViewer with the first card.
2. Emit and persist recall: The viewer emits reveal and answer intent. The controller creates a ProgressCommand and waits for the durable queue append before advancing to the next card.
3. Advance & prefetch: The screen advances currentIndex and, if near the end of the batch, calls loadCards({ deckId, cursor }) again to prefetch the next cards.
4. Sync progress: The SyncCoordinator sends a bounded batch of durable commands. It removes only applied identities, reconciles conflicts using returned revisions, and retains retryable outcomes.
5. Handle errors: If loadCards or syncProgress rejects, the screen sets an error state, shows a retry option, and retains every durable recall command that has not been acknowledged.

| Signal | Value | Interpretation |
| --- | --- | --- |
| UI surface | Small & focused | Viewer focuses on rendering and callbacks; screen orchestrates flow. |
| Backend surface | 2 main endpoints | loadCards and syncProgress cover most of the required behavior. |
| Good signal | Contracts before code | You can explain props and API signatures clearly without touching implementation details. |

### Contract checkpoint

A strong interface here means the flashcard viewer stays dumb and reusable, while the session screen and data service handle networking and progress. If another engineer can plug in a different backend or experiment with a new viewer just by honoring these contracts, you’ve designed the APIs well.

### UI-facing contract

loadBatch returns versioned card content and schedule summaries. syncProgress accepts ordered idempotent commands and returns per-command outcomes plus new scheduling revisions. The viewer emits reveal and answer intent; it does not call the network or mutate the schedule directly.

### Recall-to-schedule-reconciliation path

1. Load: Hydrate a bounded batch and validate content versions.
2. Reveal: Use click, tap, Enter, or Space and expose a clear revealed state.
3. Answer: Append one local progress command and advance at a stable boundary.
4. Reconcile recall-command outcomes: Batch commands, reconcile each outcome, and retain failures for retry.

```typescript
interface LoadCardsParams {
  deckId: string;
  cursor?: string;
  signal: AbortSignal;
}

interface CardBatchResult {
  cards: Card[];
  schedules: ScheduleState[];
  nextCursor: string | null;
}

type ProgressOutcome =
  | { commandId: string; status: 'applied'; schedule: ScheduleState }
  | { commandId: string; status: 'conflict'; schedule: ScheduleState }
  | { commandId: string; status: 'rejected'; reason: string }
  | { commandId: string; status: 'retryable'; reason: string };

interface StudyService {
  loadCards(params: LoadCardsParams): Promise<CardBatchResult>;
  syncProgress(commands: ProgressCommand[], signal: AbortSignal): Promise<{
    outcomes: ProgressOutcome[];
    scheduleCursor: string;
  }>;
}

interface FlashcardViewerProps {
  card: Card;
  revealed: boolean;
  onReveal(): void;
  onAnswer(result: RecallResult): void;
}
```

# Failure Modes

Cover: animation performance, batching of progress updates, caching for fast sessions, offline behavior, and accessibility for different users.

---

Begin with deterministic reveal, a durable answer-command queue, bounded card caching, and per-command reconciliation. Measure first-card readiness, queue age, interaction latency, and offline recovery before tuning preload, transport batches, or motion.

Study experience quality checks:
- Every answer is durable before network optimization begins.
- Animation, cold-start, sync, and cache behavior are measured independently.
- Scheduling authority and offline client behavior have an explicit boundary.
- Accessibility remains equivalent when motion or media is unavailable.

---

### Baseline safeguards

- Prefer transform and opacity for the optional reveal animation, profile actual composition behavior, and avoid layout-heavy geometry changes.
- Keep the FlashcardViewer component small and memoized so flipping doesn’t re-render unrelated UI.
- Preload a measured bounded lookahead while the learner views the current card.
- Persist each progress command first, then batch queued commands for transport.
- Use IndexedDB/localStorage to cache deck metadata and recent card batches for faster cold-start.
- Respect prefers-reduced-motion and provide a non-animated flip mode.

### When usage and data grow

- Introduce smarter SRS scheduling to avoid huge card batches and keep sessions focused on problematic cards.
- Use background sync (where available) or a retry queue to flush progress when connectivity returns.
- Implement lightweight analytics to detect where users drop out (e.g. slow first load, laggy flips, sync errors).
- Consider splitting card content and media (e.g. audio, images) so text loads instantly while heavier assets stream in.
- Cap local caches by deck and size so the app doesn’t grow unbounded on the client.
- Resolve cross-device answers through idempotent command history and authoritative schedule revisions rather than a client last-write-wins rule.

### Optimization decision matrix

| Topic | Angle | Decision rationale |
| --- | --- | --- |
| Flip animation performance | Smooth UX vs accessibility | Use a simple transform-based reveal as the baseline and verify it on representative devices. Apply will-change only briefly and only if profiling shows a real benefit, because persistent layer promotion can increase memory use. Reduced-motion users receive an immediate state change or restrained fade. |
| Batching & sync of progress | Network efficiency vs data safety | Append each ProgressCommand to a durable queue before advancing. Flush bounded batches by product policy, remove only acknowledged IDs, and retain retryable outcomes with backoff. |
| Client vs server SRS logic | Performance vs consistency | Keep the service schedule authoritative. Offline sessions may mirror the algorithm for provisional ordering, but every local result carries a base revision and reconciles with the returned schedule revision. |
| Offline-first experience | Reliability for travelers/commuters | Cache only decks selected for offline use or supported by observed repeat access. Every offline recall is appended to the durable command queue and synchronized when connectivity returns. |
| Cold-start and navigation speed | Time-to-first-card | Load required deck metadata and the first card batch in parallel when their contracts allow it. Defer optional audio until intent or measured prefetch policy justifies the transfer. |
| Accessibility and input diversity | Keyboard, screen reader, touch | Click, tap, Enter, and Space perform the same reveal action. The control communicates its expanded or revealed state, nonvisible content is not read accidentally, and progress announcements are concise. |

### Study-client optimization rollout

1. Build the simple version: Use one batch-at-a-time content loading, restrained reveal motion, durable answer commands, bounded transport batches, and minimal card caching.
2. Measure real usage: Instrument metrics: time-to-first-card, average latency per flip/answer, error rate for sync, and frame drops during animations on mid-range devices.
3. Fix obvious bottlenecks: Reduce unnecessary renders in the study screen, ensure flip uses cheap transforms, prefetch the next cards, and improve progress batching to avoid chatty calls.
4. Add advanced behavior: Introduce more robust offline mode, tune SRS (server or hybrid), refine caching limits, and add better conflict resolution for cross-device progress once the basics are solid.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Biggest UX win | Instant next card | Users should never feel a lag between answering one card and seeing the next. |
| Biggest backend win | Batched progress sync | Fewer, smarter network calls make the app faster and cheaper to run. |
| Strong senior signal | Measure → optimize → iterate | You only introduce complexity like offline SRS or conflict resolution after profiling and real feedback. |

### Learning-progress durability invariant

Optimization remains tied to evidence: time to first usable card, reveal responsiveness, durable-queue health, synchronization latency, and offline recovery. Each added cache or scheduling layer needs an observable benefit and a bounded failure mode.

### Study and synchronization failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Card content is unavailable | Skip with an explanation and preserve session position. | One card does not end study. |
| Sync partially fails | Clear acknowledged commands and retain only retryable failures. | No successful answer is resent. |
| Animation is costly | Disable motion or use an immediate state change. | Learning remains operable. |
| Cache schema changes | Migrate or invalidate by content version. | Old fields do not corrupt sessions. |

### Accessibility behavior

The reveal control has a persistent label and works with pointer, touch, Enter, and Space. Front and back content are exposed according to the disclosed state so both are not read at once. Recall buttons have clear names, progress updates are concise, focus moves predictably to the next card, and reduced motion removes the three-dimensional transition.

### Rollout and measurement

Ship deterministic sessions and local command IDs before offline persistence. Test IME and multilingual content, RTL, large text, reduced motion, cross-device conflicts, partial sync, cache migration, and lost responses. Measure first-card readiness, draft queue age, conflict recovery, and study completion.

### Technical references

- [MDN will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — Guidance to use layer hints sparingly and as a last resort.
- [W3C button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) — Keyboard interaction for button-like reveal controls.

# Metrics

- Key UX goal: Frictionless study sessions. Users should be able to flip through many cards quickly with minimal waiting or distractions.
- Key performance idea: Batch & cache cards. Fetch cards in batches and cache them so the next flip is always instant, even with flaky networks.
- Key FE decision: Where to run SRS logic?. Decide whether spaced-repetition scheduling lives on the client, server, or a hybrid model.
- State ownership: Split cleanly. UI state in components, learning flow in the screen, data logic in services.
- Side-effects: Isolated. Fetching, caching, and syncing live in dedicated modules.
- Reusability: High. The same FlashcardViewer can power multiple decks and study modes.
- Must-have entities: Deck + Card + UserProgress + SessionState. These cover content, personalization, and UI behavior.
- Key idea: Separate content from progress. Cards are shared; progress is per user and per deck.
- Good signal: Explicit session model. Current card, side, and status live in one clear structure instead of scattered flags.
- UI surface: Small & focused. Viewer focuses on rendering and callbacks; screen orchestrates flow.
- Backend surface: 2 main endpoints. loadCards and syncProgress cover most of the required behavior.
- Good signal: Contracts before code. You can explain props and API signatures clearly without touching implementation details.
- Biggest UX win: Instant next card. Users should never feel a lag between answering one card and seeing the next.
- Biggest backend win: Batched progress sync. Fewer, smarter network calls make the app faster and cheaper to run.
- Strong senior signal: Measure → optimize → iterate. You only introduce complexity like offline SRS or conflict resolution after profiling and real feedback.

# Rollout

### Study-client optimization rollout

1. Build the simple version: Use one batch-at-a-time content loading, restrained reveal motion, durable answer commands, bounded transport batches, and minimal card caching.
2. Measure real usage: Instrument metrics: time-to-first-card, average latency per flip/answer, error rate for sync, and frame drops during animations on mid-range devices.
3. Fix obvious bottlenecks: Reduce unnecessary renders in the study screen, ensure flip uses cheap transforms, prefetch the next cards, and improve progress batching to avoid chatty calls.
4. Add advanced behavior: Introduce more robust offline mode, tune SRS (server or hybrid), refine caching limits, and add better conflict resolution for cross-device progress once the basics are solid.

### Technical references

- [MDN will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — Guidance to use layer hints sparingly and as a last resort.
- [W3C button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) — Keyboard interaction for button-like reveal controls.
