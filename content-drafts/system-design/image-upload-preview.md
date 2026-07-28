---
title: "Image Upload & Preview Component"
slug: "image-upload-preview"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "image upload and preview frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Image Upload & Preview Component."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Image Upload & Preview Component."
unique_angle: "Design an image upload flow with local validation, object-URL previews, optional preprocessing, real transfer progress, cancellation, retry, and accessible errors."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Image Upload & Preview Component."
competitor_query: "Image Upload & Preview Component frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static"
  - "https://www.w3.org/WAI/tutorials/forms/labels/"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

image upload and preview frontend system design. Design an image upload flow with local validation, object-URL previews, optional preprocessing, real transfer progress, cancellation, retry, and accessible errors.

## Requirements

In this step, treat Image Upload & Preview as a real frontend system: selection, validation, preprocessing, upload, and recovery. Your job is to show the full client-side pipeline and its states, not just a file input.

---

You are designing a reusable ImageUploadPreview component with a real client pipeline. It lets the user pick an image, validates type, size, and dimensions, generates a correctly oriented preview without layout shift, optionally preprocesses the image, uploads with progress, cancel, and retry, emits a stable asset reference, supports replacement or removal, and remains accessible on mobile.

The design needs one state machine for idle, validating, preprocessing, requesting-upload, uploading, finalizing, complete, cancelled, and error. It must handle cancellation, retry, and stale callbacks safely; keep expensive image work away from interaction-critical main-thread work; represent progress honestly; and include accessible mobile behavior from the start.

---

### User flow
1. **1. Initial state:** User sees a "Choose image" button (and/or dropzone). No preview yet.
2. **2. Select + validate:** On file selection, validate type, size, and min dimensions. If invalid, show a specific error.
3. **3. Preprocess:** If valid, generate a preview and optionally resize/compress (off the main thread if possible).
4. **4. Upload with progress:** Request a pre-signed upload URL, upload with progress, allow cancel, and retry on failure.
5. **5. Complete:** Only authoritative finalization emits a durable asset to the parent and moves the attempt to complete.
6. **6. Replace / remove:** Replace restarts the flow and cleans old previews. Remove clears state and revokes object URLs.

### Clarifying questions
- What image types are allowed (JPEG/PNG/WebP)?
- What is the max file size before and after compression?
- Minimum dimensions or aspect ratio requirements?
- Do we need cropping or just preview?
- Should uploads be resumable or chunked?
- Do we get a pre-signed URL from the backend?
- What should happen on slow networks (retry/backoff)?
- Single image only, or future multi-image support?

### Upload reliability and accessibility expectations
- Profile decoded validation and preprocessing on the supported device matrix; move expensive work off-thread when evidence justifies it.
- Upload progress updates should not cause re-render storms.
- Errors must be actionable and announced to assistive tech.
- Object URLs must be revoked when replaced/removed.
- The UI must stay responsive on slow or flaky networks.
- Mobile layout and tap targets must be reliable.

### Key states
| State | What the user sees | What you store in state |
| --- | --- | --- |
| Initial | A primary "Choose image" button (and optional drag area). No thumbnail, no status. | file: null, previewUrl: null, status: 'idle', error: null |
| Validating | Short-lived; user just sees their click. Validation happens synchronously before UI update. | file: candidate file, status: 'validating' (optional), error: null |
| Uploading | Thumbnail preview + "Uploading…" label/spinner. Replace/Remove may be disabled. | file: file, previewUrl: object URL, status: 'uploading', error: null |
| Complete | Thumbnail plus complete phase and Replace/Remove controls. | file: file, previewUrl: object URL, status: 'complete', asset: finalized asset |
| Error | Error message below control (e.g. "File too large" or "Unsupported format"). No preview. | file: null (or previous file cleared), previewUrl: null, status: 'error', error: message |

- **Max file size:** ≈ 10 MB
- **Performance budget:** Profile decode, preview, and preprocessing by device class.
- **Supported types:** JPEG, PNG, WebP

### Scope checkpoint

This is a frontend system design question. Show the full client pipeline: validate, preprocess, upload, recover. If you can talk about progress, cancel/retry, and main-thread safety, it no longer feels like a small component.

### Frontend boundary

The client owns file selection, early validation, object-URL preview, optional preprocessing, upload session coordination, transfer progress, cancellation, retry, cleanup, and accessible errors. Browser MIME and signature checks improve early UX but are not a security boundary; session authorization, trusted inspection, object storage, and asset persistence stay behind the abstract UploadClient contract.

# Clarifying Questions

- Which user journey and input modes must Image Upload & Preview Component support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow viewports?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

---

Build a small client pipeline: UI layer (control, preview, status), a validator/preprocessor (type/size/dimensions + optional resize), an UploadManager (queue, progress, cancel, retry), and a thin API client for getting upload URLs. The UI is just a state machine driven by that pipeline.

Boundary checks:
- A clear state model instead of ad-hoc booleans.
- A predictable data flow (select -> validate -> preprocess -> upload -> finalize).
- Separation of concerns: UI, validation/preprocess, upload manager, API client.
- Awareness of object URL lifecycle (create + revoke).
- Main-thread safety for image work (worker/offscreen when possible).

---

```ts
// High-level state model

type UploadStatus =
  | 'idle'
  | 'validating'
  | 'preprocessing'
  | 'uploading'
  | 'requesting-upload'
  | 'finalizing'
  | 'complete'
  | 'cancelled'
  | 'error';

interface ImageUploadState {
  file: File | null;
  previewUrl: string | null;
  status: UploadStatus;
  progress: number; // 0..100
  error: string | null;
}

// Pipeline layers
// 1) validateFile(file) -> ok/error
// 2) preprocessImage(file) -> { file, previewUrl }
// 3) uploadManager.upload(file, onProgress, signal)

```

### High-level pieces
| Piece | Responsibility | Notes |
| --- | --- | --- |
| State machine | Tracks status, file, previewUrl, error | Single source of truth for UI; every visual state maps to a combination of these fields. |
| Control area | File input + optional dropzone | Handles onChange / onDrop, forwards the File object into validation, remains keyboard-accessible. |
| Preview area | Displays thumbnail when there is a valid previewUrl | Keeps aspect ratio, responsive layout, hides itself in idle/error states. |
| Status bar | Shows indeterminate or byte progress, retry, cancel, finalizing, or complete state | Visual progress commits are coalesced only when measured. |
| Actions | Replace / Remove buttons | Replace opens picker again, Remove clears state and revokes object URL. |
| Validation + preprocess | Pure helpers or worker | Keep resize/compress off the main thread when possible. |
| Upload manager | Queue, progress, cancel, retry | Encapsulates async upload behavior and exposes lifecycle events. |

---

### Architecture decisions
- Use a single, explicit status field plus progress instead of many booleans.
- Isolate validation and preprocess in helpers/worker.
- Keep an UploadManager with cancel/retry and progress callbacks.
- Use URL.createObjectURL only after validation passes, and revoke old URLs on replace/remove.
- Make size/type limits configurable via props, so the component is reusable.
- Throttle progress updates to avoid re-render storms.

### Avoid
- Mixing file validation, preview logic, and JSX all in one huge handler.
- Never revoking object URLs, causing memory leaks on long sessions.
- Hiding errors behind console logs instead of user-visible messages.
- Tightly coupling the component to a specific backend API (keep the upload URL step abstract).
- Using only icons or color to show errors or statuses (poor accessibility).
- Relying solely on click interactions and ignoring keyboard/focus flows.

### Internal flow
1. **1. Handle file selection/drop:** On input change or drop, pass the file into validation before touching state.
2. **2. Validate + preprocess:** If validation passes, create a preview and optionally resize/compress (off-thread).
3. **3. Upload with progress:** Request a pre-signed URL, start upload via UploadManager, and emit progress updates.
4. **4. Complete or retry:** After transfer, enter finalizing. Only an authoritative asset moves the attempt to complete and triggers onChange.
5. **5. Replace / remove:** Replace restarts the flow; remove cancels upload, revokes preview URLs, and resets state.

- **Core state fields:** 5
- **Main transitions:** idle -> validating -> preprocessing -> requesting-upload -> uploading -> finalizing -> complete
- **Main layers:** UI, Preprocess, UploadManager

### Upload pipeline ownership

This is not just a widget; it is a client pipeline. If you can describe UI -> preprocess -> upload manager -> finalize, you are speaking system design language.

### Worked example: replacement while the first upload is finalizing

The user selects photo A, its transfer finishes, and finalization is pending when the user replaces it with photo B. A late result for A must not overwrite B or leak A’s object URL.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| A is selected | Create attempt a1, validate, and allocate one object URL. | Preview A appears in reserved geometry. | One attempt owns each local resource. |
| A transfer completes | Move a1 to finalizing and retain its idempotency key. | Progress becomes processing rather than falsely complete. | Transfer is not durable asset completion. |
| B replaces A | Abort a1, revoke A preview, create attempt b1. | Preview B appears and controls follow b1. | Current selection is identity-based. |
| A finalize resolves late | Ignore because a1 is obsolete; optionally issue cleanup contract. | B remains untouched. | Late callbacks cannot cross attempts. |

# Tradeoffs

The central tradeoff is Design an image upload flow with local validation, object-URL previews, optional preprocessing, real transfer progress, cancellation, retry, and accessible errors. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Model the upload as a finite client workflow with separate configuration, local file resources, transfer session, authoritative asset result, progress, and recoverable error. This prevents a preview from being mistaken for an uploaded asset and makes replace, cancel, retry, and cleanup behavior explicit.

---

Configuration contains validation and preprocessing rules. Runtime state contains the selected File, object URL, current phase, transfer progress, upload-session identity, completed asset, and a safe error. The File and object URL remain local resources and are released when replaced or removed.

The important distinctions are configuration versus runtime state, local preview versus durable asset, client phase versus transfer progress, and recoverable error versus cancellation. An explicit state machine prevents incompatible booleans, while upload session and attempt identity keep late callbacks from an obsolete file from mutating the current selection.

---

```ts
export type UploadStatus =
  | 'idle'
  | 'validating'
  | 'preprocessing'
  | 'requesting-upload'
  | 'uploading'
  | 'finalizing'
  | 'complete'
  | 'cancelled'
  | 'error';

export interface ImageUploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  minWidth?: number;
  minHeight?: number;
  preprocess?: { maxWidth: number; quality: number };
  label?: string;
}

export interface UploadSession {
  sessionId: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface UploadedAsset {
  assetId: string;
  url: string;
  width: number;
  height: number;
}

export interface ImageUploadState {
  attemptId: string | null;
  file: File | null;
  previewUrl: string | null;
  status: UploadStatus;
  progress: { loaded: number; total?: number } | null;
  session: UploadSession | null;
  asset: UploadedAsset | null;
  error: { code: string; message: string; retryable: boolean } | null;
}

```

```ts
// Optional: derived view model helpers
export interface ImageUploadViewModel {
  canShowPreview: boolean;
  isIdle: boolean;
  isUploading: boolean;
  isComplete: boolean;
  hasError: boolean;
}

export function toViewModel(state: ImageUploadState): ImageUploadViewModel {
  return {
    canShowPreview: !!state.previewUrl && state.status !== 'error',
    isIdle: state.status === 'idle',
    isUploading: state.status === 'uploading',
    isComplete: state.status === 'complete' && state.asset !== null,
    hasError: state.status === 'error' && !!state.error
  };
}

// Validation result is also just data
export interface ValidationResult {
  ok: boolean;
  error?: string; // e.g. 'File too large' or 'Unsupported file type'
}

```

### Core entities
| Entity | Fields (example) | How you explain it |
| --- | --- | --- |
| ImageUploadConfig | maxSizeBytes, allowedMimeTypes, dimensions, preprocess | ImageUploadConfig contains product rules and optional preprocessing policy without embedding transport timing. |
| UploadStatus | idle through complete, cancelled, or error | UploadStatus distinguishes validation, preprocessing, session creation, transfer, and finalization. |
| ImageUploadState | attemptId, file, previewUrl, status, progress, session, asset, error | ImageUploadState makes local resources, the active attempt, durable result, and recovery information explicit. |
| ValidationResult | ok, error | "ValidationResult is a simple object returned by a helper function so we can clearly separate validation from UI, and provide a consistent error message when something is wrong." |
| ImageUploadViewModel | canShowPreview, isIdle, isUploading, isComplete, hasError | Derives display flags from the canonical status without introducing a second lifecycle. |

### Required data
- A config object for type, size, dimension, and optional preprocessing rules.
- A status field that distinguishes validation, preprocessing, transfer, finalization, completion, cancellation, and error.
- A File reference for the currently selected image (or null when none).
- A preview URL string for img src, managed via URL.createObjectURL.
- An error message string that is shown and announced to the user.
- Optional derived booleans to simplify conditional rendering.

### Upload-state modeling traps
- No single status field; instead, many booleans like isLoading, isDone, hasError that can conflict.
- Storing raw DOM nodes or event objects in state instead of serializable data.
- Holding multiple preview URLs without revoking or tracking which is active.
- Baking max size/type limits directly into logic instead of a config object.
- Using only a boolean like invalid with no actual error message explaining why.
- Not representing the difference between idle and error states in your model.

### How state evolves over time
1. **1. Initial state:** state = { file: null, previewUrl: null, status: 'idle', error: null } and config is set from props or defaults.
2. **2. User selects a file:** You keep config the same, read the File, and pass it to a validator that returns a ValidationResult.
3. **3. Validation outcome:** If ok === false, you set status = 'error', error = result.error, and keep file/previewUrl null. If ok === true, you set file = selectedFile, generate a new previewUrl, and move status to 'uploading'.
4. **4. Transfer and finalize:** Create an upload session, transfer the processed Blob with abort support, update progress from real bytes when available, and finalize the session into an UploadedAsset. Ignore callbacks whose attemptId no longer matches.
5. **5. Replace or remove:** On replace, you revoke the old previewUrl, clear file/error if needed, and then repeat from step 2 with the new file. On remove, you revoke previewUrl and reset back to the initial state.

- **Config vs state:** 2 objects
- **Core fields in state:** 4
- **Status values:** 5

### State checkpoint

A trustworthy model distinguishes local preview resources from a server-confirmed asset and ties every asynchronous callback to one upload attempt. That makes validation, real transfer progress, cancellation, retry, cleanup, and future multi-file extensions easier to reason about.

### Attempt, session, preview, and asset ownership

Keep the selected File and object URL as local resources, not durable form values. UploadState includes attempt identity, finite phase, byte progress, session, completed asset, and retryable error. The parent form receives only a finalized asset or null, while the component reports transient status separately.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| UploadConfig | type, size, dimensions, preprocess policy | Props |
| UploadAttempt | attemptId, File, previewUrl, phase | Local state |
| UploadSession | sessionId, URL, expiry | Transport state |
| UploadedAsset | assetId, URL, dimensions | Durable form value |

# Failure Modes

## Optimizations & Deep dive

Protect the main thread, object-URL lifecycle, transfer recovery, and accessible feedback without weakening the upload state machine.

---

Even a single-image upload can be expensive: decoding, resizing, and uploading large files can jank the UI. Keep image work off the main thread when possible, throttle progress updates, and make retries safe.

Upload performance and recovery evidence:
- Awareness of image decoding/resizing cost and main-thread impact.
- Stable progress + retry behavior on flaky networks.
- Memory hygiene (object URLs, avoiding base64 blobs).
- A path to extend to multi-image or chunked uploads.

---

### Performance & memory hygiene
- Use createImageBitmap + OffscreenCanvas or a Web Worker for resize/compress.
- Throttle progress updates (e.g., 100-200ms) to avoid re-render storms.
- Revoke old previewUrl on replace/remove/unmount.
- Avoid base64 in state; keep File + object URL only.
- Use AbortController to cancel in-flight uploads on replace/remove.
- Cap memory usage if multiple previews are added later.

### UX & accessibility polish
- Ensure the main control is a clear, focusable target (button or label-wrap around file input) with descriptive text.
- Display error messages in a region with role="alert" or wired via aria-describedby so screen readers announce them immediately.
- Use distinct visual cues for idle, validating, uploading, finalizing, complete, cancelled, and error, not just color changes.
- Make sure "Replace" and "Remove" are reachable by keyboard and have clear labels (not just icons).
- On error, keep focus in a sensible place (e.g. on the control or on the first action), so the user can fix the problem quickly.
- On mobile, avoid cramped layouts: give enough padding around the button, preview, and actions so taps are reliable.

### Upload performance and recovery trade-offs
| Topic | Risk | How you address it |
| --- | --- | --- |
| Large files | Decoding/resizing blocks the main thread. | Use createImageBitmap or a worker + OffscreenCanvas for preprocessing. |
| Flaky networks | Uploads fail mid-flight; users lose progress. | Retry with backoff, allow cancel, and resume if the backend supports chunking. |
| Progress updates | High-frequency events cause re-render storms. | Reduce every byte update, then coalesce visible progress paints only when profiling shows they are too frequent. |
| Object URL lifecycle | Multiple previews leak memory over time. | Revoke URLs on replace/remove/unmount and avoid base64. |
| Mobile responsiveness | Preview/actions overflow on small screens. | Use a vertical layout and limit preview size with object-fit. |

### Example deep-dive: upload cancel + retry
1. **1. Start upload with AbortController:** Create an AbortController per attempt in a runtime registry or ref, not serializable state. Store only attempt identity and status, then expose Cancel.
2. **2. Handle cancel:** On cancel/replace, call controller.abort(), reset progress, and revoke preview URLs.
3. **3. Retry with backoff:** On failure, show Retry and attempt again with exponential backoff.
4. **4. Coalesce progress paints:** Preserve the latest byte count and coalesce only visible progress paints when measured rendering cost justifies it.

- **Main risk:** Main-thread jank
- **Key UX lever:** Progress + retry
- **Deep-dive hook:** Cancel + backoff

### Upload recovery invariant

The deep dive is about performance and reliability: keep image work off the main thread, throttle progress updates, and make retry/cancel safe.

### Validation, transfer, and finalization recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Object URL is leaked | Revoke on replace, remove, and unmount. | Long editing sessions remain bounded. |
| Session expires | Request a new session for the same active attempt. | The preview and user intent remain. |
| Transfer progress is unavailable | Show indeterminate transfer state. | The UI does not invent a percentage. |
| Finalize response is lost | Retry with the same idempotency key. | One upload produces one asset. |

### Accessibility behavior

Use a visible label and native file input, with drag and drop as an enhancement rather than the only path. Error text is associated with the input, replacement and removal are real buttons, progress has a readable status, and preview alternative text describes its purpose without repeating adjacent labels. Focus stays on the triggering control after recovery.

### Rollout and measurement

Test large files, corrupt images, EXIF orientation, unsupported formats, memory pressure, aborted preprocessing, expired sessions, lost finalization responses, replacement races, reduced motion, and mobile capture. Track preview time, upload completion, cancellation, retry, memory, and error correction.

### Technical references
- [MDN createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) — Object URL creation and lifecycle.
- [W3C file upload input](https://www.w3.org/WAI/tutorials/forms/labels/) — Accessible labeling principles for form controls.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface definition (API)

Define a small, predictable API: props to configure rules and labels, events to notify the parent about changes, and accessible markup that doesn’t require consumers to manually wire low-level ARIA attributes.

---

Expose one ImageUploadPreview surface with validation rules, labels, an UploadClient, and callbacks. Consumers never manage object URLs or cancellation resources. onChange represents only the durable UploadedAsset or null; transient phases use onStatusChange and typed failures use onError.

Contract checks:
- A simple, high-level API that hides file handling complexity.
- Configurable limits and labels via props instead of hard-coded values.
- One change callback for the finalized asset or removal, plus optional error reporting.
- Accessible by default: labels, aria-*, error messages handled internally.
- Easy to extend to drag-and-drop or multiple files without breaking the contract.

---

```ts
export interface UploadClient {
  createSession(input: {
    fileName: string;
    mimeType: string;
    size: number;
    signal: AbortSignal;
  }): Promise<UploadSession>;
  transfer(input: {
    session: UploadSession;
    body: Blob;
    signal: AbortSignal;
    onProgress: (loaded: number, total?: number) => void;
  }): Promise<void>;
  finalize(input: {
    sessionId: string;
    idempotencyKey: string;
    signal: AbortSignal;
  }): Promise<UploadedAsset>;
}

export interface ImageUploadPreviewProps {
  value?: UploadedAsset | null;
  uploadClient: UploadClient;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  label: string;
  description?: string;
  inputId?: string;
  describedBy?: string;
  enableDropzone?: boolean;
  disabled?: boolean;
  onChange: (asset: UploadedAsset | null) => void;
  onStatusChange?: (status: UploadStatus) => void;
  onError?: (error: UploadError) => void;
}

```

### Core API surfaces
| Surface | Example shape | How you explain it |
| --- | --- | --- |
| Configuration props | maxSizeBytes, allowedMimeTypes, preprocessing policy | These props configure product rules; UploadClient owns session creation, real transfer progress, and finalization. |
| Value & change | value, onChange | The parent controls only the finalized asset; local resources remain component-owned. |
| Status callbacks | onStatusChange, onError | Expose transient lifecycle and typed failures without pretending they are the form value. |
| Accessibility hooks | inputId, aria-describedby | "These hooks let the component integrate into bigger forms: external labels, shared helper text, or error messages from a form library." |
| UX options | enableDropzone, disabled | "Optional flags for nicer UX (drag-and-drop) and form states (disabling input during overall form submission)." |

### How the component behaves (from the outside)
- Selection creates a local attempt; onChange is not called until finalization returns an UploadedAsset.
- While a real transfer is running, status is uploading and progress reflects transferred bytes when the transport exposes them.
- Only server finalization produces an UploadedAsset and calls onChange with a durable value.
- If validation fails, status becomes error and onError receives a typed UploadError.
- Remove aborts the active attempt, revokes its object URL, resets local state, and calls onChange(null).

### Accessibility behavior
- The control has a visible label (from label or external <label for>).
- Errors are rendered in an element with role="alert" or wired via aria-describedby so screen readers announce them.
- "Choose image", "Replace", and "Remove" buttons are all keyboard-focusable and operable with Enter/Space.
- The preview image has an appropriate alt (e.g. "Selected image preview") or a prop to customize it.
- Focus order stays logical when the component appears in a form: label → main control → additional actions → error text.

### Typical usage from a parent component
1. **1. Configure rules:** Parent passes size/type limits and label text: <ImageUploadPreview maxSizeBytes={2 * 1024 * 1024} allowedMimeTypes={["image/jpeg", "image/png"]} label="Upload avatar" />.
2. **2. Listen for changes:** Parent subscribes to onChange and stores only UploadedAsset or null in form state.
3. **3. React to upload lifecycle:** Parent optionally uses onStatusChange and onError for page-level status, analytics, or submit availability.
4. **4. Integrate with form & a11y:** Parent wires inputId and aria-describedby to integrate with larger form labels and helper/error text without breaking accessibility.
5. **5. Reset or re-use:** On form reset, parent either clears its controlled value or relies on the component’s own "Remove" action to reset to the initial state.

- **Main prop groups:** 3
- **Core event:** onChange
- **Optional events:** onStatusChange / onError

### Contract checkpoint

From a consumer’s perspective, the API should feel small and boring: set rules via props, listen to a couple of callbacks, and treat the value as { file, previewUrl, status, error }. All the tricky parts – file input quirks, object URLs, validation order, ARIA wiring – stay inside the component.

### UI-facing contract

UploadClient creates a short-lived session, transfers a Blob with AbortSignal and progress callback when the transport supports bytes, then finalizes with an idempotency key. Progress can be indeterminate. A new selection invalidates the prior attempt before any callback can commit.

### From local file to authoritative asset
1. **Validate:** Check declared type, file signature policy, size, and decoded dimensions before upload.
2. **Preview:** Create one object URL, reserve geometry, and revoke it on replacement or teardown.
3. **Transfer:** Use the active session with abort support and throttle only visual progress commits.
4. **Finalize:** Convert the session into an asset and emit the durable parent value once.
