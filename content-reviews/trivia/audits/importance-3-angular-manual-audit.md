# Importance-3 Angular Manual Audit

## Lane Summary
- Current machine truth is clean: `lint:trivia-competitive-readiness` reports `0 warning`, all `importance=3` Angular review snapshots exist, and the current lint-derived loser manifest is empty.
- That does **not** prove the content is competitively strong. It only proves the snapshots pass the repo's calibration rules.
- This manual audit re-checked both `importance=3` Angular pages against the current competitor set and replaced one weaker non-primary comparator with a stronger official Angular guide.
- Lane verdict: `do not open an Angular rewrite lane; close the lane-level audit sweep and keep only the surviving watchlist item on file`.

## Audit Method
- Starting point: the current shipped trivia page plus its existing review snapshot under `content-reviews/trivia/angular/`.
- Scoring rubric for every page:
  - `intentMatch`
  - `decisionQuality`
  - `actionableExamples`
  - `followUpCoverage`
  - `edgeCaseCoverage`
  - `differentiation`
- Verdict scale: `ours | tie | theirs`, with `tie` as default.
- Rewrite threshold:
  - a page is `rewrite-required` if it loses on `2+` criteria against `2+` competitors, or
  - its first visible text block loses both `intentMatch` and `differentiation` against the hardest competitor.
- Competitor replacements used in this audit:
  - `angular-forroot-forchild`: replaced the GeeksforGeeks comparator with Angular's `Singleton services` guide because it explains the `forRoot()` pattern, singleton duplication risk, and modern `providedIn` default more authoritatively.

## Batch-01 Findings
| Content ID | Verdict | Hardest competitor | Why it landed there |
| --- | --- | --- | --- |
| `angular-vs-angularjs` | `no-action` | `telerik.com`, `geeksforgeeks.org` | The shipped page is already framed around the only thing that matters in practice: Angular is a rewrite with migration cost, not a version bump. |
| `angular-forroot-forchild` | `watchlist` | `angular.dev`, `v18.angular.dev` | The page explains the legacy NgModule pattern well, but it still underplays the modern Angular context where `providedIn` and standalone APIs reduce how often this pattern should appear in new code. |

### `angular-vs-angularjs`
- Query: `What is the difference between Angular and AngularJS?`
- Competitor set:
  - Angular `Overview`: `https://angular.dev/overview`
  - GeeksforGeeks `Difference Between Angular and AngularJS`: `https://www.geeksforgeeks.org/difference-between-angular-and-angularjs/`
  - Telerik `Making the Switch from AngularJS to Angular in an Enterprise Dev Shop`: `https://www.telerik.com/blogs/making-switch-angularjs-angular-enterprise-dev-shop`
- Hardest competitor: `telerik.com`, `geeksforgeeks.org`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the exact interview question directly instead of drifting into a generic Angular overview. |
| `decisionQuality` | `ours` | It correctly frames the real decision boundary: rewrite and migration cost, not surface syntax changes. |
| `actionableExamples` | `tie` | The side-by-side table and code sample are useful, although longer migration write-ups still offer broader project detail. |
| `followUpCoverage` | `ours` | It covers controllers vs components, digest cycle vs change detection, tooling, RxJS, and migration approach in one compact answer. |
| `edgeCaseCoverage` | `tie` | It could later mention hybrid upgrade paths such as `ngUpgrade` more explicitly in the first fold, but the migration notes already point there. |
| `differentiation` | `ours` | The migration-first framing is stronger than generic “Angular is newer than AngularJS” comparison pages. |

- Hard gaps:
  - A future polish pass could pull the hybrid migration option one block higher, but there is no rewrite debt.
- Verdict: `no-action`

### `angular-forroot-forchild`
- Query: `What are Angular modules forRoot and forChild used for?`
- Competitor set:
  - Angular `RouterModule`: `https://angular.dev/api/router/RouterModule`
  - Angular `Singleton services`: `https://v18.angular.dev/guide/ngmodules/singleton-services`
  - Angular `Lazy-loading feature modules`: `https://v18.angular.dev/guide/ngmodules/lazy-loading/`
- Hardest competitor: `angular.dev`, `v18.angular.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the exact question clearly and anchors it in the duplicate-provider / duplicate-router bug that interviewers usually care about. |
| `decisionQuality` | `tie` | The root-vs-feature distinction is strong, but the page does not push the modern “this is mostly legacy NgModule context now” point hard enough. |
| `actionableExamples` | `tie` | The root and feature routing examples are useful and concrete. |
| `followUpCoverage` | `theirs` | The strongest official docs do a better job linking `forRoot()` to singleton-service guidance and clarifying that `providedIn` is now the default for most services. |
| `edgeCaseCoverage` | `theirs` | The shipped answer underplays the standalone-era follow-up: new Angular code often reaches for `provideRouter` and `providedIn` instead of leaning on this pattern broadly. |
| `differentiation` | `tie` | The page is interview-usable, but not as distinct as it could be because it still reads partly like a legacy router explainer rather than a sharper migration-context answer. |

- Hard gaps:
  - The answer needs one compact block that says this pattern mainly matters in legacy NgModule-based apps and is less central in standalone-first Angular.
  - It should explicitly contrast router setup with service provisioning: routing still uses the pattern, but most singleton services should now prefer `providedIn`.
  - It would benefit from one “how this changes in modern Angular” note near the top, not only in the description metadata.
- Verdict: `watchlist`
- Rewrite direction if prioritized later:
  - Add one short modern-context block near the first fold that explains `forRoot()`/`forChild()` as a legacy NgModule pattern, then contrast it with `providedIn` and `provideRouter` so the page feels current instead of only historically correct.

## Final Lane Recommendation
- `Do not open an Angular rewrite lane; close the lane-level manual audit sweep.`
- Remaining Angular watchlist:
  - `angular-forroot-forchild`
- Practical sequencing:
  1. Keep Angular closed as a lane.
  2. Preserve `angular-forroot-forchild` as a low-priority watchlist item.
  3. The manual audit sweep across `importance=3` lanes is now complete; the next sensible step is a consolidated cross-lane summary of surviving watchlist and rewrite candidates rather than another lane audit.
