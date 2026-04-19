# Importance-3 Vue Manual Audit

## Lane Summary
- Current machine truth is clean: `lint:trivia-competitive-readiness` reports `0 warning`, all `importance=3` Vue review snapshots exist, and the current lint-derived loser manifest is empty.
- That does **not** prove the content is competitively strong. It only proves the snapshots pass the repo's calibration rules.
- This manual audit re-checked all `4` Vue `importance=3` pages against the current competitor set and replaced two clearly weak coverage-first comparators.
- Lane verdict: `do not open a Vue rewrite lane; move to CSS audit next`.

## Audit Method
- Starting point: the current shipped trivia page plus its existing review snapshot under `content-reviews/trivia/vue/`.
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
  - `vue-sfc-vs-global-components`: replaced the generic LearnVue global-components article with the official Vue style-guide component-registration guidance.
  - `vuex-state-management`: replaced the Chinese Vue scaling-up state-management guide with the official Vue state-management guide on `vuejs.org`.

## Batch-01 Findings
| Content ID | Verdict | Hardest competitor | Why it landed there |
| --- | --- | --- | --- |
| `vue-reactive-interpolation-into-dom` | `no-action` | `vuejs.org` | Strong rendering-pipeline framing, batching detail, and compiler/runtime explanation make it sharper than generic Vue reactivity summaries. |
| `vue-architecture-decisions-scalability` | `no-action` | `vuejs.org` | Good architecture-first framing, explicit baseline stack, and practical route/code-splitting guidance keep it competitive. |
| `vue-sfc-vs-global-components` | `watchlist` | `vuejs.org` | Correct and useful, but still somewhat generic and less differentiated on ownership, dependency visibility, and registration strategy. |
| `vuex-state-management` | `watchlist` | `vuex.vuejs.org`, `vuejs.org` | The page is solid on centralized state, but still too Vuex-inventory-shaped and not sharp enough on when Vuex is the wrong abstraction in modern Vue. |

### `vue-reactive-interpolation-into-dom`
- Query: `How does Vue interpolate reactive state into the DOM?`
- Competitor set:
  - Vue `Rendering Mechanism`: `https://vuejs.org/guide/extras/rendering-mechanism.html`
  - GreatFrontEnd `Vue Interview Questions`: `https://www.greatfrontend.com/questions/vue`
  - ThisDot `Understanding Vue's Reactive Data`: `https://www.thisdot.co/blog/understanding-vues-reactive-data`
- Hardest competitor: `vuejs.org`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page answers the exact interpolation-to-DOM flow instead of just explaining generic reactivity. |
| `decisionQuality` | `ours` | It explains what Vue tracks, when it batches, and why interpolation escapes HTML by default. |
| `actionableExamples` | `tie` | The `nextTick` example and compiler explanation are strong, though the official docs remain a solid baseline. |
| `followUpCoverage` | `ours` | It covers refs in templates, batching, render tracking, and patching mechanics in one answer. |
| `edgeCaseCoverage` | `tie` | A fuller note on `v-html` or escaping boundaries could help later, but the page already covers the main interview traps. |
| `differentiation` | `ours` | The interpolation-specific pipeline framing is sharper than broader Vue reactivity primers. |

- Hard gaps:
  - A future refresh could add one explicit `v-html` safety contrast, but there is no rewrite debt here.
- Verdict: `no-action`

### `vue-architecture-decisions-scalability`
- Query: `What architectural decisions are made when creating a Vue project, and how do they affect scalability?`
- Competitor set:
  - Vue `Scaling Up`: `https://vuejs.org/guide/scaling-up/tooling.html`
  - GreatFrontEnd `Vue Interview Questions`: `https://www.greatfrontend.com/questions/vue`
  - LearnVue `Vue Best Practices`: `https://learnvue.co/articles/vue-best-practices`
- Hardest competitor: `vuejs.org`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `ours` | The shipped page is directly about architectural decisions and team-scale trade-offs, not just tooling setup. |
| `decisionQuality` | `ours` | It gives a concrete baseline stack and ties each choice to maintainability, performance, or team coordination. |
| `actionableExamples` | `tie` | The route-level code-splitting example is useful, though the best docs still offer broader ecosystem detail. |
| `followUpCoverage` | `ours` | It covers platform choice, router/state/tooling boundaries, file organization, and anti-patterns together. |
| `edgeCaseCoverage` | `tie` | A future pass could say more about SSR/SSG migration or monorepo boundaries, but current coverage is already strong enough. |
| `differentiation` | `ours` | The recommended baseline and anti-complexity framing give it more interview value than generic best-practices lists. |

- Hard gaps:
  - None strong enough to justify rewrite work.
- Verdict: `no-action`

### `vue-sfc-vs-global-components`
- Query: `What is the difference between single-file components and global components?`
- Competitor set:
  - Vue `Single-File Components`: `https://vuejs.org/guide/scaling-up/sfc.html`
  - GreatFrontEnd `Vue Interview Questions`: `https://www.greatfrontend.com/questions/vue`
  - Vue Style Guide `Component instance options order / strongly recommended style guidance`: `https://vuejs.org/style-guide/rules-strongly-recommended.html`
- Hardest competitor: `vuejs.org`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `tie` | The page answers the prompt correctly, but the first fold still starts broad before getting to the harder registration trade-off. |
| `decisionQuality` | `theirs` | It does not surface the strongest “dependency visibility and ownership” decision rule early enough. |
| `actionableExamples` | `tie` | The SFC example is useful, but the comparison still leans descriptive instead of decision-oriented. |
| `followUpCoverage` | `tie` | It covers the main difference, but it is lighter on bundle ownership, local registration clarity, and design-system exceptions. |
| `edgeCaseCoverage` | `theirs` | It is weaker on when global registration is actually justified versus when it becomes maintenance sprawl. |
| `differentiation` | `theirs` | Many Vue intros can explain SFCs and globals; this page still needs a sharper angle to feel distinct. |

- Hard gaps:
  - The answer is too descriptive and not decision-first enough.
  - It needs a stronger default rule: local/SFC-first, global only for true app-wide primitives or plugin-style registration.
  - It should explain why global registration hurts dependency visibility, tree ownership, and discoverability in larger apps.
- Verdict: `watchlist`
- Rewrite direction if prioritized later:
  - Replace part of the descriptive overview with a stronger ownership/dependency-visibility decision block and one “acceptable global component” exception list.

### `vuex-state-management`
- Query: `What is the purpose of Vuex, and how does it help manage state in large applications?`
- Competitor set:
  - Vuex `What is Vuex?`: `https://vuex.vuejs.org/`
  - GreatFrontEnd `Vue Interview Questions`: `https://www.greatfrontend.com/questions/vue`
  - Vue `State Management`: `https://vuejs.org/guide/scaling-up/state-management.html`
- Hardest competitor: `vuex.vuejs.org`, `vuejs.org`

| Criterion | Verdict | Notes |
| --- | --- | --- |
| `intentMatch` | `tie` | The page matches the prompt directly, but the first fold still feels partly like a centralized-state intro instead of a sharper “when Vuex is justified” answer. |
| `decisionQuality` | `theirs` | It explains Vuex concepts, but it does not push hard enough on when Vuex becomes overkill in modern Vue apps. |
| `actionableExamples` | `tie` | The concept table is useful, but it stays more inventory-like than the best architecture comparisons. |
| `followUpCoverage` | `theirs` | It is lighter than it should be on store boundaries, local-state leakage, and the modern Pinia / shared-state trade-off discussion. |
| `edgeCaseCoverage` | `theirs` | It does not go far enough on when centralized state hurts performance or architecture by becoming the dumping ground for UI state. |
| `differentiation` | `theirs` | Official Vuex and Vue state-management docs already explain centralized state well; the shipped answer needs a stronger architectural stance to stand out. |

- Hard gaps:
  - The answer is still too concept-table-heavy.
  - It needs a clearer rule for what belongs in global store versus local/component state.
  - It should explicitly frame Vuex as a predictability tool for shared business state, not a default home for all state in a large app.
  - It should mention modern Vue expectations more directly so the answer does not feel stuck in a legacy-store mental model.
- Verdict: `watchlist`
- Rewrite direction if prioritized later:
  - Reframe the opening around when centralized shared state is worth the ceremony, then add one global-state-vs-local-state matrix and one “why Vuex can become the wrong default” warning.

## Final Lane Recommendation
- `Do not open a Vue rewrite lane; move to CSS audit next.`
- Watchlist pages:
  - `vue-sfc-vs-global-components`
  - `vuex-state-management`
- Practical sequencing:
  1. Keep Vue closed unless one of the two watchlist pages becomes strategically important.
  2. Move to CSS manual audit next.
  3. Reopen Vue only if one of the watchlist pages later justifies a focused single-page or two-page rewrite pass.
