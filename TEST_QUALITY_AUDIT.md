# Test Quality Audit

## Summary
- Repo shape is mixed, not weak. The backend suite is mostly high-signal and intent-driven.
- The frontend suite has many strong behavior and contract tests, but also a thin layer of low-signal smoke and copy-coupled assertions.
- The main improvement area is not total test count. It is test signal quality, especially in UI specs that mix strong behavior checks with brittle text or markup assertions.

## Rubric
- `High-signal`: protects user-visible behavior, business invariants, state transitions, auth/session behavior, routing/SEO contracts, async race handling, or domain logic.
- `Medium-signal`: useful regression coverage, but partially coupled to copy or markup details.
- `Low-signal`: mainly proves construction, static brand/copy, or incidental DOM shape without protecting a real product contract.

## Current Assessment
### High-signal
- Most backend route and domain tests under `backend/tests/`:
  auth, billing lifecycle, gamification, daily challenge, and progress routes.
- Frontend service and logic specs that protect real invariants:
  auth synchronization, progress persistence, SEO JSON-LD generation, sanitization and URL utilities.

### Medium-signal
- Frontend component specs that protect a real branch, but still lean on visible copy:
  dashboard guest states, pricing fallbacks, some interview hub and tradeoff UI checks.
- These are worth keeping, but future edits should prefer state/contract assertions over incidental text.

### Low-signal
- Generic shell smoke assertions like component creation or static brand rendering.
- UI tests that only assert a string exists when the real contract is a branch, route, or action.
- Copy-heavy assertions where wording changes would fail the test without changing behavior.

## First Cleanup Batch
- `frontend/src/app/app.component.spec.ts`
  remove generic shell smoke checks and keep route/header branch behavior.
- `frontend/src/app/shared/components/header/header.component.spec.ts`
  keep guest/member/premium gating coverage, but assert branch behavior through route/action presence instead of broad text matching.
- `frontend/src/app/features/interview-questions/interview-questions-landing.component.spec.ts`
  keep crawlable-link and schema coverage, but trim redundant copy assertions and focus on loading, routing, and priority contracts.

## Follow-up Priorities
- Review dashboard, sidebar, and large list/detail specs for copy-heavy assertions that can be converted into branch or state checks.
- Keep utility specs when they protect transformation, sanitization, security, or URL-building behavior.
- Keep backend integration tests unless they are clearly redundant; they already align well with product intent.
