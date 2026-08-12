# System Design Quality Audit — 2026-08-12

## Summary

The review covered all 22 shipped System Design question bundles and all 7
guided System Design scenarios. The shipped content and generated interview
artifacts passed their existing structural, editorial, source-pinning, scoring,
and public/private leakage checks before this change.

The audit found three scoring defects worth fixing immediately:

- Autocomplete could score a strong architecture without the input and results
  UI boundaries, and it penalized a cache/async decision that was already safe
  before the production twist.
- Ranked Feed could score a strong architecture without the normalized entity
  store and complete page/view boundary, while its twist repeated facts already
  present in the prompt and rewarded a performative decision change.
- Toast penalized a lifecycle or overflow decision that was already safe before
  the hidden-tab twist.

The change associated with this audit adds a Mid-level resilient checkout case
to fill the catalog's transaction-flow gap and fixes those three defects.
Final review also tightened two cross-cutting correctness boundaries: partial
rounds cannot receive the top practice signal, and checkout replacement cannot
create a new payment identity until merchant state reports terminal failure or
cancellation. Provider action tokens remain transient rather than part of the
durable attempt model.

## Public Question Library

The public catalog is mechanically healthy. The full System Design editorial
lint passes, but reports 298 legacy advisories:

- 275 numbered prefixes inside step titles
- 13 sections that begin with a divider
- 10 legacy bundles above the 3,200-word advisory threshold

Only 3 of the 22 existing questions use the prompt-first V2 contract. The
remaining long-form bundles still meet the current minimum content and semantic
contracts, so the advisories are editorial debt rather than correctness
failures. Converting all legacy questions to V2 is intentionally deferred.

## Guided Scenario Calibration

The seven guided scenarios have valid public/private projections, pinned source
bundles, six rubric axes, four executable fixtures each, and no private-answer
leakage. Their content quality is not uniform:

- AI Chat is the strongest Mid-level calibration and accepts more than one
  defensible architecture.
- Autocomplete needs the UI boundaries and pre-correct adaptation regression
  described above.
- Ranked Feed needs complete normalized-data evidence and a genuinely new
  production twist.
- Toast is otherwise a focused Junior case; only its forced-change rule is
  defective.
- Dashboard is strong but its adaptation evidence has disproportionate weight.
- Image Upload is unusually dense for a ten-minute Junior session and repeats
  stale-attempt evidence across axes.
- Live Chart is technically strong but near Senior density and repeats some
  pipeline evidence across axes.

Dashboard, Image Upload, and Live Chart recalibration is deferred because it
requires a broader cross-level scoring pass rather than a localized correctness
fix.

## Acceptance Criteria

- An already-correct Toast, Autocomplete, or Ranked Feed baseline can remain
  Strong after selecting safe twist responses; changing a decision is not
  required for its own sake.
- Strong Autocomplete fixtures include both input and results UI boundaries.
- Strong Ranked Feed fixtures include the view, normalized entities, and page
  membership boundaries.
- The resilient checkout case ships as a free V2 question and a 15-minute Mid
  guided candidate scenario.
- A local abandon or tab decision cannot replace an uncertain payment attempt;
  only terminal merchant state or successful merchant cancellation can.
- Missing twist/baseline evidence caps the overall practice signal below
  Strong without penalizing an already-correct completed design.
- Existing advisory count does not increase, and all generated artifacts remain
  source-pinned and leak-free.
