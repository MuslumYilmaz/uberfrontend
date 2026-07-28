---
title: "Multi-step Form with Autosave"
slug: "multi-step-form-autosave"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "multi-step form autosave frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Multi-step Form with Autosave."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Multi-step Form with Autosave."
unique_angle: "Design a multi-step form with versioned drafts, validation boundaries, autosave scheduling, conflict-safe restoration, submission recovery, and accessible navigation."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Multi-step Form with Autosave."
competitor_query: "Multi-step Form with Autosave frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API"
  - "https://www.w3.org/WAI/tutorials/forms/validation/"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

multi-step form autosave frontend system design. Design a multi-step form with versioned drafts, validation boundaries, autosave scheduling, conflict-safe restoration, submission recovery, and accessible navigation.

## Requirements

Design a four-step form whose local draft survives reloads and whose optional remote draft can follow the user across devices. Editing, validation, navigation, local durability, remote acknowledgement, and final submission must remain distinct states.

---

What you are solving:
A four-step form persists a versioned local draft immediately enough to survive reloads and may synchronize that draft to a versioned remote resource. On return, the user reviews any meaningful difference before one source replaces another.

Decision surface:
- Ownership of field values, step navigation, validation, and save state.
- Debounced local persistence with explicit flush boundaries.
- Optional remote synchronization with a base revision and stale-response guard.
- Schema migration, corrupt storage, quota failure, and conflict recovery.
- Clear local-saved, remote-pending, remote-confirmed, and submission states.
- Predictable keyboard focus across validation and step transitions.

---

### Draft-aware form journey

1. Load the form: Parse and migrate the local envelope, fetch the optional remote draft, and show a restore summary when their values or revisions differ. Invalid storage is quarantined rather than injected into form state.
2. Fill fields: As the user types, the form updates local state. On blur/change, inline validation may show errors immediately.
3. Persist captured local generation: A debounced coordinator writes an atomic local envelope and updates lastLocalSavedAt. It then schedules an optional remote command based on the confirmed server revision without claiming that local persistence means remote success.
4. Step transition: When the user clicks Next/Back, the form validates required fields and navigates to the next step. The progress bar updates accordingly.
5. Submission: Run final validation, issue one idempotent submit command, and clear only the matching local and remote draft identities after confirmed success.

### Draft and navigation guarantees

- Local persistence frequency must be controlled and flushed at safe navigation boundaries.
- Navigation between steps should not cause re-renders that reset inputs.
- The form must be resilient to page reloads and tab closures.
- Autosave must be silent and unobtrusive.
- Draft restore must be predictable and validate restored data.
- The draft envelope must serialize cleanly, exclude transient focus and error objects, and carry schema plus remote base revisions.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Autosave frequency | ≈ 500–1500ms | Fast enough to feel safe, slow enough not to spam localStorage. |
| Form complexity | 4 logical groups | Each step cleanly owns its fields and validation rules. |
| Draft contents | JSON + step index | Minimal but complete model to restore progress. |

### Scope checkpoint

The difficulty here is not the UI—it’s managing form state in a clean, scalable way. Show that you understand autosave timing, dirty-state tracking, and restoring large JSON safely. This instantly signals senior-level experience with complex forms.

### Frontend boundary

The client owns field state, validation timing, draft serialization, local persistence, restore review, submission coordination, and navigation warnings. Server validation and final persistence remain abstract versioned contracts.

# Clarifying Questions

- Do we run validation on every field change, on blur, or only on step submission?
- Should every step be independently valid before moving forward?
- Should autosave run on every keystroke or only after debounced delay?
- Do we need versioning for saved drafts, in case the form schema changes?
- What is the maximum size of the form JSON (performance concerns)?
- Do users need a "Discard draft" button to start fresh?

# Architecture

---

Use a MultiStepForm controller for field and step state, pure validation rules, a local draft repository for durable envelopes, and an optional remote draft adapter behind one autosave coordinator. Step components emit edits; they do not write storage or network state.

Boundary checks:
- One form model spans every step.
- Validation results derive from current values and interaction state.
- One coordinator owns debounce, local writes, remote generations, and cancellation.
- Local save time and remote acknowledgement time are never conflated.
- The progress indicator derives from step identity and completion rules.

---

### Core building blocks

| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| MultiStepFormController | Owns values, current step, touched fields, dirty paths, and navigation. | The controller exposes only the active slice and typed edit commands while retaining one form-wide model. |
| Step components (Step1–Step4) | Render fields for one step, trigger validation and updates, but do not own global state. | "Each step is a dumb-ish component that receives its values and an onChange from the container. It can run field-level validation but writes back into the central store." |
| Validation layer | Encapsulates validation rules per step/field, returns errors in a consistent format. | Pure step validators are reusable for blur, blocked navigation, and final submission. |
| Autosave coordinator | Debounces local envelopes, flushes at safe boundaries, and reconciles optional remote versions. | The coordinator records local durability separately from a pending or acknowledged remote command. |
| Progress bar | Pure view derived from step index and/or completion status. | "The progress bar is derived state: (currentStep + 1) / totalSteps or based on which steps pass validation." |

---

Option: flat vs nested form store
Choose one and justify it for a 4-step form:

```text
// Nested by step (often easier to reason about for multi-step):
interface FormModel {
  step1: { name: string; email: string; };
  step2: { address: string; city: string; };
  step3: { preferences: string[]; };
  step4: { confirmation: boolean; };
}

// Alternatively, flat with logical grouping:
// interface FormModel {
//   name: string;
//   email: string;
//   address: string;
//   city: string;
//   preferences: string[];
//   confirmation: boolean;
// }
```

You don’t have to be dogmatic. For a 4-step form, nested-by-step is often easier to connect with the UI, but the ownership consequences should remain explicit.

### Form ownership decisions

- There is one central form model and one currentStep state.
- Each step gets a slice of that model and update callbacks.
- Step navigation (Next/Back) is handled in the container, not in random components.
- Autosave observes typed edit commands and dirty paths, not individual storage calls.
- Validation functions are step-aware and reusable (inline + on submit).
- Progress bar is derived from the current step and/or validation state.

### Form architecture failure patterns

- Each step having its own isolated store with no single source of truth.
- Sprinkling localStorage.setItem calls in multiple components.
- Putting heavy validation logic directly inside component render functions.
- Letting the progress bar reimplement step logic instead of deriving it.
- Not knowing where "dirty" and "last saved" timestamps live.

### High-level flow

1. Initialization & draft restore: On mount, the controller parses and migrates the local envelope, then fetches the optional remote draft. It restores directly only when authority is unambiguous; otherwise it presents a comparison.
2. Step rendering: Based on currentStep, the container renders the appropriate Step component, passing that step’s slice of data and onChange handlers.
3. Updates & validation: When fields change, steps call onChange, which updates the central form model and marks the form as dirty. Inline validation can run on blur/change using the shared validation layer.
4. Persist versioned envelope: After a quiet period, the coordinator writes { schemaVersion, baseRevision, values, currentStep, dirtyPaths, updatedAt } atomically. Local dirty state clears only for the captured generation; optional remote acknowledgement clears matching pending paths later.
5. Navigation & submit: Next validates the current step and flushes the latest local envelope before navigation. Submit validates all steps, sends an idempotent command, and clears only the matching draft after confirmed completion.

| Signal | Value | Interpretation |
| --- | --- | --- |
| State ownership | Centered in container | One place owns the full form, step index, and dirty state. |
| Autosave strategy | Observer + debounce | A single effect watches changes and serializes JSON responsibly. |
| Extensibility | Add steps safely | New steps mean new slices + validators, no rewrite of core flow. |

### Form and draft ownership

A good architecture here is about one clean form model, clear step navigation, and a dedicated autosave layer. If you can explain how those three pieces fit together, you’re already showing strong system-design skills for complex forms.

### Worked example: older local draft meets a newer server version

A user resumes a checkout draft saved locally at schema version 3 while the server reports version 5 containing an address edited on another device. Blind last-write-wins would lose meaningful input.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Local draft loads | Parse, validate schema, and quarantine unsupported fields. | Show a restore summary before replacing current values. | Untrusted storage is not application state. |
| Server version 5 arrives | Keep server base and local edits as separate layers. | Highlight fields that differ. | Neither source silently overwrites the other. |
| User keeps local phone | Record an explicit field-level resolution based on version 5. | The form reflects the chosen value and remains dirty. | Resolution is user intent. |
| Autosave runs | Persist a new local envelope and send a versioned draft command. | Saved status follows confirmed local and remote outcomes. | A timer does not claim server success. |

# Tradeoffs

## Data

---

Keep one FormModel for field values, a FormUiState for navigation and interaction, a DraftEnvelope for durable local recovery, and a RemoteSaveState for optional synchronization. The two timestamps identify local durability and remote acknowledgement separately.

State-model checks:
- One form model spans every step.
- Dirty field paths identify edits captured by each save generation.
- schemaVersion governs client migration while baseRevision governs remote conflicts.
- lastLocalSavedAt and lastRemoteAcknowledgedAt communicate different facts.
- AbortController remains runtime state rather than serialized draft data.

---

```typescript
type StepKey = 'step1' | 'step2' | 'step3' | 'step4';
type FieldPath = `${StepKey}.${string}`;

interface FormModel {
  step1: { name: string; email: string };
  step2: { address: string; city: string };
  step3: { preferences: string[] };
  step4: { acceptTerms: boolean };
}

type ValidationErrors = Partial<Record<FieldPath, string>>;

interface FormUiState {
  currentStep: StepKey;
  touched: Set<FieldPath>;
  submitAttempted: boolean;
  validationErrors: ValidationErrors;
}

interface DraftEnvelope {
  draftId: string;
  schemaVersion: number;
  baseRevision: string | null;
  values: FormModel;
  currentStep: StepKey;
  dirtyPaths: FieldPath[];
  updatedAt: number;
}

interface RemoteSaveState {
  generation: number;
  phase: 'idle' | 'pending' | 'conflict' | 'error';
  lastLocalSavedAt: number | null;
  lastRemoteAcknowledgedAt: number | null;
  confirmedRevision: string | null;
}

```

### Core entities

| Entity | Fields (example) | Design rationale |
| --- | --- | --- |
| FormModel | step1, step2, step3, step4 (each with its own fields) | "FormModel holds all user-entered data. I group fields by step so each step component can receive its own slice cleanly." |
| FormUiState | currentStep, touched, submitAttempted, validationErrors | Interaction state drives validation presentation and navigation without being persisted as permanent truth. |
| ValidationErrors | map of step → field → error message | "Errors are a simple nested map: for each step, each field can have a string error. This format works for inline validation and submit-time validation." |
| DraftEnvelope | draftId, schemaVersion, baseRevision, values, currentStep, dirtyPaths, updatedAt | The local envelope carries migration and conflict information while remaining independent from runtime requests. |

### Required fields

- A single FormModel representing all 4 steps.
- A currentStep value in UI state.
- Dirty field paths that are cleared only for the save generation that captured them.
- A validationErrors structure, not ad-hoc booleans everywhere.
- A DraftEnvelope with schemaVersion, baseRevision, values, currentStep, dirtyPaths, and updatedAt.

### Draft-model pitfalls

- Scattering field values into many unrelated states instead of one model.
- Encoding dirty state only implicitly (e.g. comparing JSON each time) instead of tracking it.
- Storing huge, unstructured blobs in localStorage without a version field.
- Mixing transient UI flags (loading spinners, focus) into the persisted draft.
- Making the draft format inconsistent with the in-memory FormModel.

### How the data typically evolves over time

1. Initialize form and save generations: Form starts with a default FormModel (empty strings, defaults, etc.) and FormUiState with currentStep = 0, dirty = false, validationErrors = {}.
2. Advance one field generation: An edit updates one field, marks its path dirty, and advances the local save generation. Blur may mark the field touched and derive a validation message.
3. Persist captured envelope: The coordinator captures a DraftEnvelope, serializes it, and writes it atomically to local storage. Success updates lastLocalSavedAt and clears only unchanged paths captured by that generation; it does not update remote acknowledgement.
4. Resume from draft: On return, the app parses and migrates the DraftEnvelope, compares its baseRevision with the optional remote draft, and restores or presents differences according to explicit authority rules.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Core model | FormModel + FormUiState | Keeps user data and UI metadata clearly separated. |
| Persistence unit | DraftEnvelope | The versioned recovery record written to the local repository. |
| Key concept | Dirty vs saved snapshot | You always know whether the in-memory form matches the last persisted draft. |

### State checkpoint

A strong data model for this problem makes autosave almost trivial: one normalized form object, a small UI state wrapper, and a well-defined draft snapshot. If your types are clear, validation, dirty detection and serialization all fall into place.

### Form and draft state ownership

Use a DraftEnvelope with schema version, base server version, updated timestamp, current step, field values, and dirty field paths. Keep validation results derived from values and submission attempt, not serialized as permanent truth. A pending save record stores generation, based-on version, and AbortController outside the value object.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| DraftEnvelope | schema, baseVersion, step, values, dirtyPaths | Local persistence |
| FormState | values, touched, submitAttempt | Active session |
| SaveState | generation, phase, lastLocalAt, lastRemoteAt | Autosave controller |
| ConflictState | serverValues, conflictingPaths | Recovery view |

## Interfaces

---

Expose a form controller that accepts initial values, typed validation, a durable local repository, an optional versioned remote adapter, and an idempotent submit callback. Consumers render steps while the controller owns restore, autosave, conflict, and navigation state.

Contract checks:
- Local persistence and remote synchronization have separate adapters and outcomes.
- Remote writes carry base revision, idempotency key, generation, and AbortSignal.
- Save status distinguishes local durability from remote acknowledgement.
- Restore, conflict resolution, discard, and submission are explicit commands.

---

```typescript
interface LocalDraftRepository {
  read(draftId: string): Promise<DraftEnvelope | null>;
  write(draft: DraftEnvelope): Promise<void>;
  remove(draftId: string): Promise<void>;
}

interface RemoteDraftResult {
  draft: DraftEnvelope;
  revision: string;
}

interface RemoteDraftAdapter {
  read(draftId: string, signal: AbortSignal): Promise<RemoteDraftResult | null>;
  save(input: {
    draft: DraftEnvelope;
    baseRevision: string | null;
    idempotencyKey: string;
    signal: AbortSignal;
  }): Promise<RemoteDraftResult>;
  remove(input: { draftId: string; revision: string; idempotencyKey: string }): Promise<void>;
}

interface MultiStepFormOptions {
  draftId: string;
  initialValues: FormModel;
  localDrafts: LocalDraftRepository;
  remoteDrafts?: RemoteDraftAdapter;
  validateStep(step: StepKey, values: FormModel): ValidationErrors;
  validateAll(values: FormModel): ValidationErrors;
  submit(input: { values: FormModel; idempotencyKey: string }): Promise<void>;
}

interface UseMultiStepFormResult {
  values: FormModel;
  formUi: FormUiState;
  save: RemoteSaveState;
  setField(path: FieldPath, value: unknown): void;
  goToStep(step: StepKey): Promise<void>;
  submit(): Promise<void>;
  resolveConflict(source: 'local' | 'remote' | 'field-by-field'): void;
  discardDraft(): Promise<void>;
}

```

### Core interfaces

| Interface / prop | Shape (example) | Design rationale |
| --- | --- | --- |
| MultiStepFormOptions.initialValues | FormModel | A complete clean baseline prevents ambiguous missing fields during migration and reset. |
| localDrafts | LocalDraftRepository | The repository owns storage technology, schema parsing, atomic replacement, quota errors, and deletion. |
| remoteDrafts | Optional RemoteDraftAdapter | Remote sync remains optional but, when present, uses explicit revision, idempotency, cancellation, and conflict outcomes. |
| submit(input) | Validated values plus idempotency key | Submission is separate from autosave and clears drafts only after confirmed success. |
| resolveConflict(source) | Local, remote, or field-by-field decision | A meaningful local/remote divergence cannot be erased by an implicit last-write-wins rule. |
| Hook result | { values, formUi, save, setField, goToStep, submit, resolveConflict, discardDraft } | The view can distinguish field interaction, local save, remote conflict, navigation, and final submission. |

### Required public behavior

- A stable draft identity and durable local repository.
- Step and full-form validation over one FormModel.
- An optional remote adapter with revision and cancellation contracts.
- Explicit restore, conflict-resolution, discard, and submit commands.
- Separate local-save and remote-acknowledgement status.
- A controller result exposing values, navigation, errors, save state, and recovery actions.

### Keep outside the API

- Forcing consumers to manually call localStorage.setItem.
- Returning different shapes depending on step (inconsistent contracts).
- Hiding validation behind magic: callers can’t plug in their own rules.
- Mixing UI details (progress bar rendering) into the core form API.
- Making submit fire even when some steps are invalid (undefined behavior).

### Integration flow

1. Create draft-aware controller: The page creates the form controller with a draft ID, local repository, optional remote adapter, initial values, validation, and submit command. Initialization compares validated local and remote drafts before choosing a base.
2. Edit & validate: Inputs call setFieldValue (or onChange props), which updates the form model and sets dirty = true. Inline validation uses validateStep to populate validationErrors.
3. Write local, then optional remote draft: The coordinator writes a versioned local envelope for the captured generation, then optionally starts a remote save with its base revision and AbortSignal. Each outcome updates only the matching generation.
4. Step navigation: nextStep() runs validateStep for the current step; if there are no errors it increments currentStep. prevStep() just decrements (no validation needed).
5. Submit idempotent final values: When submit() is called, the component runs full validation (all steps). On success it calls onSubmit(form) and clears the draft key. On failure it surfaces errors without losing any data.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Public surface | Tiny & consistent | A small set of props and helpers that stay stable over time. |
| Data direction | Props in, callbacks out | Consumers configure behavior; the form reports events and results. |
| Strong signal | Draft lifecycle is explicit | You clearly define how drafts are created, restored and discarded. |

### Contract checkpoint

A good API makes complex behavior (multi-step + autosave + validation) feel simple to use. If another engineer can wire this form into their page just from the props and hook signatures you described, you’ve nailed the interface.

### UI-facing contract

Draft reads and writes include schema and remote revisions. A remote save uses a precondition and returns the new revision. The UI aborts obsolete transport work when possible but still rejects stale generations. Submission is a separate idempotent command and successful completion clears only the matching draft identity.

### Edit-to-save-and-submit path

1. Capture field change: Update field state and mark one path dirty without validating unrelated steps.
2. Schedule captured generation: Debounce storage work from input and flush at safe navigation boundaries.
3. Commit draft envelope: Write an atomic local envelope, then reconcile a versioned remote draft if enabled.
4. Finalize form: Run final validation, send one idempotent command, and clear the draft only after success.

# Failure Modes

Cover performance, robustness, and how you’d evolve the form as it grows.

---

Begin with central form state, versioned local envelopes, explicit remote acknowledgement, and focused validation. Measure draft size, write latency, save conflicts, and lost-work recovery before tuning debounce, storage technology, or dirty-path tracking.

Autosave quality checks:
- Local durability is correct before remote synchronization is enabled.
- Schema migration and storage failures have visible recovery paths.
- Validation cost is isolated from input rendering.
- Debounce, storage choice, and conflict policy follow observed risk rather than folklore.

---

### Baseline safeguards

- Use debounce (or throttle) for autosave, not setItem on every keystroke.
- Avoid running full-form validation on every single change; use step/field-level validation most of the time.
- Serialize only the form model + step index into the draft, not transient UI state.
- Guard JSON.parse with try/catch so a corrupt draft doesn’t break the page.
- Clear the draft on successful submit to avoid restoring stale data later.

### Autosave depth checks

- Versioning: what happens when you add/remove fields or steps?
- Dirty detection: how do you avoid writing the exact same snapshot again and again?
- Validation cost: can you validate just the current step instead of everything?
- LocalStorage limits: what if the JSON grows larger over time?
- Offline and multiple tabs: how do you behave when two tabs edit the same form?

### Optimization decision matrix

| Topic | Angle | Decision rationale |
| --- | --- | --- |
| Autosave debounce tuning | Safety vs performance | Choose an initial debounce as a product hypothesis, flush at safe boundaries, and tune it from measured write cost and acceptable lost-work exposure. |
| Dirty-state detection | Avoid unnecessary writes | Track dirty field paths and the generation that captured them so a late save cannot clear newer edits. |
| Schema changes & versioning | Long-lived drafts | "The draft contains a version. When the app loads, if the version is older, I can migrate it: add new fields with defaults, drop removed fields, or in the worst case discard the draft with a clear message. That prevents runtime errors from unexpected shapes." |
| Large form JSON | Managing size & cost | Persist only fields needed for recovery. Move larger or structured drafts to IndexedDB and separate binary attachments rather than treating compression as a substitute for a storage model. |
| Validation strategy | UX vs correctness | "Inline validation should be lightweight—field-level checks on blur/change. Full, cross-step validation only runs on Next or Submit so we don’t block typing with heavy rules. This keeps the form snappy while still catching global issues." |

### Autosave optimization rollout

1. Ship local-draft baseline: Central form model, step-aware validation, debounced autosave, clean draft restore/discard flow. No premature micro-optimizations.
2. Observe real usage: Track how often autosave runs, average draft size, and how often drafts are actually restored. Watch for errors parsing drafts in the wild.
3. Reduce noise and cost: Adjust debounce interval, avoid saving when nothing changed, and consider only saving on certain events (e.g. leaving a step) for very large forms.
4. Harden drafts: Add versioning, migration paths, and better error handling so drafts from older releases don’t break newer forms.
5. Polish UX: Surface subtle feedback like "Saving… / Saved" indicators, show last saved time, and ensure validation messages are clear and step-specific.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Autosave strategy | Debounced snapshot | Write only when the user pauses, not on every keystroke. |
| Key risk | Stale or broken drafts | Solved by versioning + safe parsing + clear fallbacks. |
| Strong senior signal | Data-driven tuning | You talk about measuring autosave behavior and adjusting, not guessing. |

### Draft durability invariant

A complete design explains local durability, remote acknowledgement, real-change detection, schema migration, focused validation, and conflict recovery as separate decisions.

### Draft and submission failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Storage quota fails | Keep the in-memory form and show saved-locally failure. | Typing remains available. |
| Schema migration fails | Quarantine the old draft and offer safe discard or export. | Invalid data is not injected. |
| Remote save conflicts | Present field differences against the newest base. | User choices create the next version. |
| Tab closes mid-save | Use the latest atomic local envelope as recovery evidence. | No optimistic remote claim is shown. |

### Accessibility behavior

Steps use real headings and an ordered progress indicator rather than color alone. Validation summaries link to fields and focus only after a submit or blocked step transition. Autosave status is polite and rate-limited. Back and Next preserve focus at the step heading, while hidden steps are removed from the accessibility tree.

### Rollout and measurement

Ship local versioned drafts before remote synchronization. Exercise corrupt storage, quota pressure, schema upgrades, multi-tab edits, offline recovery, and final submission. Track restoration success, draft loss, save conflict, blocked navigation, and validation correction rather than save-call volume alone.

### Technical references

- [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) — Browser storage behavior and synchronous storage considerations.
- [W3C forms validation tutorial](https://www.w3.org/WAI/tutorials/forms/validation/) — Accessible error identification and recovery patterns.

# Metrics

- Autosave frequency: ≈ 500–1500ms. Fast enough to feel safe, slow enough not to spam localStorage.
- Form complexity: 4 logical groups. Each step cleanly owns its fields and validation rules.
- Draft contents: JSON + step index. Minimal but complete model to restore progress.
- State ownership: Centered in container. One place owns the full form, step index, and dirty state.
- Autosave strategy: Observer + debounce. A single effect watches changes and serializes JSON responsibly.
- Extensibility: Add steps safely. New steps mean new slices + validators, no rewrite of core flow.
- Core model: FormModel + FormUiState. Keeps user data and UI metadata clearly separated.
- Persistence unit: DraftEnvelope. The versioned recovery record written to the local repository.
- Key concept: Dirty vs saved snapshot. You always know whether the in-memory form matches the last persisted draft.
- Public surface: Tiny & consistent. A small set of props and helpers that stay stable over time.
- Data direction: Props in, callbacks out. Consumers configure behavior; the form reports events and results.
- Strong signal: Draft lifecycle is explicit. You clearly define how drafts are created, restored and discarded.
- Autosave strategy: Debounced snapshot. Write only when the user pauses, not on every keystroke.
- Key risk: Stale or broken drafts. Solved by versioning + safe parsing + clear fallbacks.
- Strong senior signal: Data-driven tuning. You talk about measuring autosave behavior and adjusting, not guessing.

# Rollout

### Autosave optimization rollout

1. Ship local-draft baseline: Central form model, step-aware validation, debounced autosave, clean draft restore/discard flow. No premature micro-optimizations.
2. Observe real usage: Track how often autosave runs, average draft size, and how often drafts are actually restored. Watch for errors parsing drafts in the wild.
3. Reduce noise and cost: Adjust debounce interval, avoid saving when nothing changed, and consider only saving on certain events (e.g. leaving a step) for very large forms.
4. Harden drafts: Add versioning, migration paths, and better error handling so drafts from older releases don’t break newer forms.
5. Polish UX: Surface subtle feedback like "Saving… / Saved" indicators, show last saved time, and ensure validation messages are clear and step-specific.

### Technical references

- [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) — Browser storage behavior and synchronous storage considerations.
- [W3C forms validation tutorial](https://www.w3.org/WAI/tutorials/forms/validation/) — Accessible error identification and recovery patterns.
