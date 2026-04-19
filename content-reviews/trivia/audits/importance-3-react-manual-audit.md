# Importance-3 React Manual Audit

## Lane Summary
- Current machine truth is clean: `lint:trivia-competitive-readiness` reports `0 warning`, all `importance=3` React review snapshots exist, and the current lint-derived loser manifest is empty.
- That does **not** prove the content is competitively strong. It only proves the snapshots pass the repo's calibration rules.
- This manual audit re-checked all `6` React `importance=3` pages against the current competitor set and replaced one clearly weak comparator.
- Lane verdict: `do not open a React rewrite lane; move to Vue audit next`.

## Audit Method
- Starting point: the current shipped trivia page plus its existing review snapshot under `content-reviews/trivia/react/`.
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
  - `react-functional-vs-class-components`: replaced the weak freeCodeCamp forum thread with Telerik's direct function-vs-class article.

## Batch-01 Findings
| Content ID | Verdict | Hardest competitor | Why it landed there |
| --- | --- | --- | --- |
| `react-core-problem-and-non-goals` | `no-action` | `react.dev`, `greatfrontend.com` | Clear problem framing, explicit non-goals, and strong architecture guidance make this sharper than generic React intros. |
| `react-functional-vs-class-components` | `no-action` | `greatfrontend.com`, `telerik.com` | Strong lifecycle mapping, modern migration guidance, and realistic trade-offs keep it competitive. |
| `react-why-event-delegation` | `no-action` | `react.dev` | Strong event-system mental model, root-listener explanation, and React-specific trade-offs make it interview-ready. |
| `react-fragments-dom-and-reconciliation` | `no-action` | `react.dev` | Specific DOM-vs-React-tree framing and reconciliation consequences make it stronger than generic fragment explainers. |
| `react-hooks-youve-used` | `watchlist` | `greatfrontend.com` | The page is useful but still reads like a hook inventory more than a harder decision matrix with production trade-offs. |
| `react-18-whats-new` | `no-action` | `react.dev` | Strong migration-first framing and practical React 18 adoption notes keep it competitive despite the commodity query. |

### `react-core-problem-and-non-goals`
- Query: `What core problem does React solve, and what does it deliberately not solve?`
- Competitor set:
  - React `Thinking in React`: `https://react.dev/learn/thinking-in-react`
  - GreatFrontEnd `React Interview Playbook`: `https://www.greatfrontend.com/react-interview-playbook`
  - Telerik `What Is React?`: `https://www.telerik.com/faqs/react/what-is-react`
- Hardest competitor: `react.dev`, `greatfrontend.com`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the exact interview question directly instead of only teaching general React thinking. |
| `decisionQuality` | `ours` | It clearly separates React's job from routing, data fetching, and state-library decisions. |
| `actionableExamples` | `tie` | The counter example is enough, but the best competitor tutorials still have richer walkthroughs. |
| `followUpCoverage` | `ours` | The non-goals section handles the obvious follow-up better than most generic React intros. |
| `edgeCaseCoverage` | `tie` | It could mention meta-framework/server-component boundaries more explicitly, but it already covers the main architecture trap. |
| `differentiation` | `ours` | The explicit "problem solved vs problem not solved" angle is sharper than broad React introductions. |

- Hard gaps:
  - A future refresh could add one concrete router/data-layer example, but that is not rewrite debt.
- Verdict: `no-action`

### `react-functional-vs-class-components`
- Query: `Functional vs class components in React`
- Competitor set:
  - React `Component`: `https://react.dev/reference/react/Component`
  - GreatFrontEnd `Basic React Concepts for Interviews`: `https://www.greatfrontend.com/pt-BR/react-interview-playbook/react-basic-concepts`
  - Telerik `React Class Component vs. Functional Component: How To Choose`: `https://www.telerik.com/blogs/react-class-component-vs-functional-component-how-choose-whats-difference`
- Hardest competitor: `greatfrontend.com`, `telerik.com`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped answer is directly about the comparison, not just the class API or beginner component intro. |
| `decisionQuality` | `ours` | It gives a modern default, explains legacy realities, and avoids the lazy "functions are just faster" claim. |
| `actionableExamples` | `tie` | The lifecycle map and paired code example are good, though the best tutorials still have fuller side-by-side demos. |
| `followUpCoverage` | `ours` | It covers lifecycle mapping, migration advice, code reuse patterns, and performance nuance in one answer. |
| `edgeCaseCoverage` | `tie` | It could mention class-only error boundaries more explicitly, but the current trade-off coverage is already good enough. |
| `differentiation` | `ours` | The answer is more interview-useful than most generic class-vs-function articles because it centers on practical choice. |

- Hard gaps:
  - If revisited later, add one short note that error boundaries are still class-based in mainstream React.
- Verdict: `no-action`

### `react-why-event-delegation`
- Query: `Why does React use event delegation instead of native listeners?`
- Competitor set:
  - React `Responding to Events`: `https://react.dev/learn/responding-to-events`
  - GreatFrontEnd `React Interview Playbook`: `https://www.greatfrontend.com/react-interview-playbook`
  - MDN `Event bubbling and capturing`: `https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling`
- Hardest competitor: `react.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page is centered on the exact "why delegation?" interview prompt rather than general event handling. |
| `decisionQuality` | `ours` | It explains the architectural benefits clearly: fewer listeners, dynamic-tree stability, cross-browser behavior, and scheduling integration. |
| `actionableExamples` | `tie` | The delegation mental model and native example are solid, but the canonical docs remain a strong baseline. |
| `followUpCoverage` | `ours` | Root-container listeners, SyntheticEvent, non-bubbling cases, and portal/tree semantics are all covered. |
| `edgeCaseCoverage` | `tie` | The page is already strong on gotchas; only a few lower-level event exceptions remain outside scope. |
| `differentiation` | `ours` | It is much sharper than a generic DOM-bubbling explainer because it stays React-specific throughout. |

- Hard gaps:
  - A future refresh could add one compact portal example, but that does not justify rewrite work.
- Verdict: `no-action`

### `react-fragments-dom-and-reconciliation`
- Query: `How do fragments affect the rendered DOM and reconciliation?`
- Competitor set:
  - React `Fragment`: `https://react.dev/reference/react/Fragment`
  - GreatFrontEnd `React Interview Playbook`: `https://www.greatfrontend.com/react-interview-playbook`
  - DigitalOcean `Returning Multiple Children Using React Fragments`: `https://www.digitalocean.com/community/tutorials/react-fragments`
- Hardest competitor: `react.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The question is specifically about DOM output plus reconciliation, and the shipped page addresses both directly. |
| `decisionQuality` | `ours` | It explains when fragment wrappers can change identity and remount behavior instead of stopping at "no extra DOM node." |
| `actionableExamples` | `tie` | The reconciliation explanation is good, though a fully worked keyed-fragment diff could still add more punch. |
| `followUpCoverage` | `ours` | Keyed fragments, remount/state-loss gotchas, and DOM-shape implications are already there. |
| `edgeCaseCoverage` | `ours` | It handles the main traps better than generic fragment tutorials that focus only on wrapper avoidance. |
| `differentiation` | `ours` | The reconciliation-first angle is much stronger than ordinary fragment intros. |

- Hard gaps:
  - One explicit before/after keyed-fragment remount example would improve teaching quality later, but the page is already competitive.
- Verdict: `no-action`

### `react-hooks-youve-used`
- Query: `Which React Hooks have you used, and when would you choose each?`
- Competitor set:
  - GreatFrontEnd `React Hooks for Interviews`: `https://www.greatfrontend.com/react-interview-playbook/react-hooks`
  - React `API Reference`: `https://react.dev/reference/react`
  - Epic React `React Hooks Workshop`: `https://www.epicreact.dev/workshops/react-hooks`
- Hardest competitor: `greatfrontend.com`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `tie` | The page matches the prompt directly, but the first fold still feels more like a grouped inventory than a sharper interview answer. |
| `decisionQuality` | `theirs` | It does not make the harder choice boundaries concrete enough, such as `useState` vs `useReducer` or `useRef` vs state. |
| `actionableExamples` | `tie` | The list examples are useful, but they stay short and generic. |
| `followUpCoverage` | `theirs` | The page mentions custom hooks and the Rules of Hooks, but misses stronger follow-ups like memoization overuse or hook-selection trade-offs inside one component. |
| `edgeCaseCoverage` | `theirs` | It is lighter than the strongest competitors on misuse patterns and deeper decision traps. |
| `differentiation` | `theirs` | Many React hook guides can list common hooks; this page still needs a sharper angle to feel distinct. |

- Hard gaps:
  - The page reads like a competent hook inventory, but not yet like a strong decision matrix.
  - It needs one richer worked example showing why a single component reaches for `useState`, `useEffect`, `useRef`, and maybe a custom hook for different jobs.
  - It should surface a few higher-signal trade-offs: `useState` vs `useReducer`, `useRef` vs state, and when `useMemo/useCallback` are unnecessary.
- Verdict: `watchlist`
- Rewrite direction if prioritized later:
  - Replace part of the inventory with a decision table and one component-level example that maps each hook choice to a concrete production need.

### `react-18-whats-new`
- Query: `What is new in React 18?`
- Competitor set:
  - React `React v18.0`: `https://react.dev/blog/2022/03/29/react-v18`
  - GreatFrontEnd `React Interview Playbook`: `https://www.greatfrontend.com/react-interview-playbook`
  - Telerik `Everything You Need To Know About the React 18 RC`: `https://www.telerik.com/blogs/everything-need-know-react-18-rc`
- Hardest competitor: `react.dev`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The page is tighter on the interview-style "what changed and why it matters" question than the longer release post. |
| `decisionQuality` | `ours` | It translates the feature set into migration decisions and production consequences. |
| `actionableExamples` | `tie` | The list is strong, but the canonical release post still has broader official examples. |
| `followUpCoverage` | `ours` | `createRoot`, StrictMode effect auditing, transitions, and deferred values are all surfaced clearly. |
| `edgeCaseCoverage` | `tie` | A future refresh could say more about streaming SSR or gradual adoption, but the page already covers the main interview edges. |
| `differentiation` | `ours` | The migration-first framing gives it a better angle than a plain feature recap. |

- Hard gaps:
  - If revisited later, add one compact SSR/Suspense adoption note, but there is no rewrite debt now.
- Verdict: `no-action`

## Final Lane Recommendation
- `Do not open a React rewrite lane; move to Vue audit next.`
- Watchlist pages:
  - `react-hooks-youve-used`
- Practical sequencing:
  1. Keep React closed unless the hooks page becomes strategically important.
  2. Move to Vue manual audit next.
  3. Reopen React only if `react-hooks-youve-used` proves important enough to justify a single-page rewrite pass later.
