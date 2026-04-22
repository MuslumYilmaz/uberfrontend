# Importance-3 Watchlist Rewrite Queue

## Summary
- This queue ranks the surviving `importance=3` watchlist pages by `impact × signal`.
- `Impact` means likely user value if improved: query usefulness, interview frequency, architectural importance, and strength of the hardest competitors.
- `Signal` means how clearly the audit identified the weakness and how straightforward the rewrite direction is.
- This is a rewrite queue, not a new audit. It is built from the completed lane-level manual audits.
- Resolved in the current rewrite pass:
  - `react-hooks-youve-used`
  - `vuex-state-management`

## Queue
| Rank | Content ID | Tech | Priority | Why it is here |
| --- | --- | --- | --- | --- |
| 1 | `ai-streaming-data-handling` | JavaScript | `high` | Strong primary-source competitors and a concrete missing edge-case set: request correlation, reconnect, and resume failure handling. |
| 2 | `angular-forroot-forchild` | Angular | `medium-high` | The page is correct but risks sounding dated because it does not clearly frame the pattern as mostly legacy NgModule context in standalone-first Angular. |
| 3 | `vue-sfc-vs-global-components` | Vue | `medium` | Useful but too descriptive; needs a sharper ownership and dependency-visibility rule rather than more generic explanation. |
| 4 | `js-design-patterns` | JavaScript | `low` | Still competitive enough, but broad and generic; rewrite value is real yet lower than the more decision-heavy state and architecture topics above. |

## Per-Item Rationale

### 1. `ai-streaming-data-handling`
- Impact: high
- Signal: medium-high
- Why now:
  - Strong primary-source competitors make any shallow answer look weak quickly.
  - The current page is good but too short for the topic.
  - The missing pieces are concrete and production-relevant: request IDs, stale responses, reconnect, and resume logic.
- Rewrite shape:
  - Keep the current state-machine framing.
  - Add one stale-request example with request correlation.
  - Add one reconnect or resume failure scenario.

### 2. `angular-forroot-forchild`
- Impact: medium-high
- Signal: high
- Why now:
  - The current page is historically correct, but modern Angular readers need explicit standalone-era framing.
  - The fix is small and high confidence.
  - This is more modernization debt than deep conceptual debt.
- Rewrite shape:
  - Add one early block that says the pattern mainly matters in legacy NgModule-based apps.
  - Contrast router setup with `providedIn` and `provideRouter`.
  - Keep the router examples, but stop implying the pattern is equally central in new Angular code.

### 3. `vue-sfc-vs-global-components`
- Impact: medium
- Signal: medium
- Why now:
  - The page is not wrong; it is just too descriptive.
  - The missing value is a stronger ownership rule, not more explanation.
  - Compared with the higher-ranked items, the business payoff is smaller.
- Rewrite shape:
  - Replace part of the overview with a local-first decision rule.
  - Add a short list of legitimate global-component exceptions.
  - Emphasize dependency visibility and maintenance cost.

### 4. `js-design-patterns`
- Impact: low-medium
- Signal: medium
- Why now:
  - The page is broad and somewhat generic, but it is not close to failing.
  - The strongest improvement would be a problem-to-pattern decision model, which is useful but less urgent than the architecture and streaming pages above.
  - This is the easiest one to defer without real quality risk.
- Rewrite shape:
  - Replace part of the inventory with a problem-to-pattern matrix.
  - Add one stronger JavaScript-native example.

## Recommended Rewrite Waves

### Wave 1
- `ai-streaming-data-handling`
- `angular-forroot-forchild`

Reason:
- These two now carry the strongest remaining combination of user value, clear rewrite direction, and competitor pressure.

### Wave 2
- `vue-sfc-vs-global-components`

Reason:
- This is a smaller framing fix with a clear ownership-rule upgrade path.

### Wave 3
- `js-design-patterns`

Reason:
- This is the easiest page to defer because it is still broadly acceptable and the value lift is lower.

## Recommendation
- Open the next rewrite pass with `Wave 1`.
- If only one page should be rewritten next, start with `ai-streaming-data-handling`.
- If two pages should be rewritten next, use:
  1. `ai-streaming-data-handling`
  2. `angular-forroot-forchild`
