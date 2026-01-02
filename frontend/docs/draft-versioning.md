# Versioned Drafts (CDN-safe)

Problem: question content can change on the CDN while a user still has a local draft for the same `id`. Loading the old draft into the new question can cause confusing failures (tests/starter mismatch) and can overwrite the user’s work.

FrontendAtlas treats a draft as **(baseKey + contentVersion)**:
- When `contentVersion` changes, the app creates a **fresh draft from the new starter**.
- Any older drafts are **kept** and surfaced via UI. Nothing is deleted or overwritten automatically.

## Storage model

- Draft key: `makeDraftKey(baseKey, contentVersion)` → `${baseKey}@${contentVersion}`
- Draft index (localStorage): `fa:draftIndex:${baseKey}` stores:
  - `latestVersion`
  - `versions[]` entries like `{ version, updatedAt, lang? }`
- Banner dismissal (localStorage): `fa:draftUpdateDismissed:${baseKey}:${currentVersion}`

Implementation helpers:
- `frontend/src/app/core/utils/versioned-drafts.util.ts`
- `frontend/src/app/core/services/code-storage.service.ts`

## Migration (legacy unversioned drafts)

If a legacy (unversioned) draft exists at `baseKey`, on next open:
- It is **archived** to `${baseKey}@legacy` and added to the index.
- A new draft is created at `${baseKey}@${currentVersion}` from the latest starter.
- The UI shows a “question updated” banner so the user can open/copy the older draft explicitly.

## `contentVersion` computation

If a question JSON provides an explicit `contentVersion`, it is used as-is. Otherwise a deterministic hash is computed from the “breaking surface” (fields that change the expected runtime contract).

Hashing is implemented in `frontend/src/app/core/utils/content-version.util.ts`:
- JS coding questions: `starterCode`, `starterCodeTs`, plus test code (`tests`/`testsJs` and `testsTs`).
- Web questions: starter HTML/CSS plus DOM tests.
- Framework workspaces: SDK `files` (path + content), `entryFile`, and `dependencies` (sorted).

## UI behavior

When an older draft exists for the same question `id`:
- The app starts a new draft for the latest version.
- A non-blocking banner offers:
  - “Open older draft”
  - “Copy older draft into latest” (explicit action; old draft remains intact)
  - “Dismiss”

Banner component: `frontend/src/app/shared/components/draft-update-banner/`.

