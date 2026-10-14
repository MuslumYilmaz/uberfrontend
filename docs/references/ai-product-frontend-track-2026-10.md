# AI product frontend: the track and the pages around it

> Working reference for the one content bet chosen on 2026-10-14. It records what "AI product frontend" means here, the evidence that the territory is open on search and asked for in interviews, what the catalog already holds, the track design, the sequence, and how to judge it. Companion documents: `docs/references/seo-growth-roadmap-2026-10.md` (measurement protocol, content acceptance rule), `docs/references/new-site-growth-2026-10.md` (why search alone will not carry a new site).

## Decisions recorded on 2026-10-14

- The AI product frontend track is the content bet. Round-type prep (take-home grading, machine-coding guides), framework-neutral platform labs and the interviewer kit were researched and set aside.
- Angular gets zero-cost repositioning of pages that already rank, and the Angular variant of the flagship challenge. No new Angular trivia, no new Angular coding questions beyond that variant (26 exist, 23 premium).
- No new trivia for search. Trivia stays the free entry layer; new effort goes to the challenge, the cases, the company pages and the hub.
- New pages are still added one decision at a time (acceptance rule in the roadmap, Step 3c). This document lists the candidates; it does not approve them.

## What "AI product frontend" means

The interface engineering of products whose core is a language model or an agent. Out of scope: using AI tools to write frontend code, AI-generated UI, model training.

| Mechanic | What an interviewer asks |
|---|---|
| Streaming | Read a token stream from a fetch `ReadableStream`, SSE or WebSocket; render incrementally; batch tokens (requestAnimationFrame or a time slice) so the UI does not re-render per token; design the wait before the first token |
| Stop, cancel, retry, regenerate | `AbortController`; keep or discard partial text; status transitions; idempotent resend; resume after a dropped connection (`Last-Event-ID`) |
| Partial markdown and code | Render markdown while a code fence is still open; highlight code that is still arriving |
| Conversation state | A message tree (edit and regenerate create branches); queued, streaming, done and error states; optimistic user message; history persistence and offline reads |
| Long conversations | Virtualize thousands of messages; stick to the bottom while streaming, release when the reader scrolls up; memory |
| Agent interfaces | Render tool calls, approval steps with a human in the loop, a run trace or timeline, multi-step progress, inline diffs |
| Composer | Slash commands, mentions, attachments, IME-safe Enter (the existing case), voice input |
| Retrieval and citations | A sources panel, inline citation anchors, highlight on hover |
| Cross-cutting | `aria-live` for streamed text, latency and skeleton states, rate limits and cost display, error recovery, observability |

Where it is asked, from public candidate reports and company guides read on 2026-10-13 and 2026-10-14: OpenAI's coding round (build a ChatGPT-style interface from a function that streams chunks; follow-ups on typewriter rendering, concurrent requests and cancelling mid-stream), Anthropic ("design a desktop AI chat frontend": token streaming, virtualized rendering for long conversations, offline-first history), Waymo ("design the frontend of an AI chat application"), Harvey. GreatFrontEnd's OpenAI guide lists the focus areas as rendering, state ownership, streaming, optimistic updates, cancellation, accessibility, performance, observability and error recovery. Beyond the labs, any company adding an AI feature runs some version of the same round.

## Evidence

### Search is open, the shelf is not

Search checks were run through a web search tool that is a proxy for Google (it returns a result set, not positions, and ignores the `site:` operator). On 2026-10-14, 17 candidate-phrased queries returned no interview-prep site at all:

| Query | What came back |
|---|---|
| streaming llm response frontend interview | dev.to posts, a Microsoft tech community post, reintech |
| render markdown while streaming react | Vercel's streamdown, langchain docs, stream-md, markstream |
| sse vs websocket for llm streaming | four locale copies of one vendor post, one 2026-04 blog post |
| cancel streaming fetch abortcontroller react | egghead, LinkedIn noise, two personal blogs |
| stop generating button react streaming | GitHub pull requests and issues, getstream docs, a Streamlit forum |
| chat auto scroll while streaming react | mui, shadcn, heroui docs, react-scroll-to-bottom |
| token streaming ui performance react | hackernoon, sitepoint, dev.to |
| ai agent ui patterns frontend | logrocket, langchain, copilotkit |

Where interview-prep sites do appear: "design chatgpt ui system design interview" (educative and designgurus, backend-centric), "ai chat frontend architecture interview" (educative, PracHub's two question pages, GreatFrontEnd's OpenAI guide), and the company queries ("openai frontend interview" is held by GreatFrontEnd, educative, designgurus, dataford and 1point3acres; Anthropic and Cursor are contested; Perplexity and Waymo return only job boards and forum threads).

On the shelf, two competitors already have material:

- HelloFrontend (`hellofrontend.com/frontend-ai-interview`) sells a "Frontend AI" track: machine-coding problems (AI Streaming Chat Window, Slash-Command Prompt Input, Inline Diff Viewer, Agent Trace Renderer), guides on streaming, agents and RAG, a glossary, and system design problems (Perplexity-style retrieval with citations, ChatGPT-style streaming chat). Parts are paywalled. It surfaced for none of the 17 queries; it was found only by name and through a Product Hunt listing. Its pricing could not be read with the tools used.
- GreatFrontEnd names the topics in its OpenAI and Anthropic guides but has no question or practice pages for them. It can add them quickly.
- PracHub has two question pages ("Design the Frontend for an AI Chat Application", "... With Streaming Replies") and "build a streaming chat input".

Reading: the territory is open in search and occupied on the shelf, so the order matters. Pages that let a candidate run and test a streaming UI are the part nobody has in search.

### Demand

- Five company guides (GreatFrontEnd, educative, dataford, designgurus, techprep) independently describe the OpenAI or Anthropic coding round as a streaming chat UI with cancellation follow-ups.
- One query for "ai product frontend engineer skills" returned eight live job postings asking for streaming or real-time AI interfaces. An InterviewStack job-board analysis from June 2026 put explicit AI skills in 12.7% of frontend postings and 16.1% of senior postings (self-reported by the analysis).
- Five libraries were published in 2025-2026 for exactly these problems: streamdown, stream-md, markstream, use-stick-to-bottom, react-scroll-to-bottom. OpenAI community threads and GitHub issues (chatbox #35, hyprnote #1381) ask about stop buttons and streaming markdown.
- Site data (Search Console, 2026-07 to 2026-10): `/companies/openai/preview` is the most-clicked company page (9 clicks from 209 impressions over 90 days; 9.1% CTR in the 2026-10-08 28-day export); `/system-design/ai-chat-textarea-design` is the third most-clicked system design case (8 clicks from 286; 3.9% CTR in the 28-day export against a site average of 0.6%); `/javascript/trivia/chat-conversation-state-management` sits at position 4.6. Visible AI-chat queries total about 19 impressions in three months, so search volume is unproven; the signal is conversion of what little traffic exists, not volume.

### Limits of the claim

Nineteen visible impressions is not demand. FrontendLead and Hello Interview rank for the ChatGPT system design query. HelloFrontend's AI track did not carry that site (its launch scored 1 to 4 points on Hacker News and the site was unreachable on 2026-10-13). Postings naming AI skills are 12.7% of the market: a wedge, not the whole site.

## What the catalog already holds

Eighteen items, twelve indexable, no hub, track, tag page or Angular variant. Tags that already exist in `cdn/questions/tag-registry.json`: `streaming`, `real-time`, `cancellation`, `abort-controller`.

| Item | Kind | Access |
|---|---|---|
| `/system-design/ai-chat-textarea-design` (composer and streaming turn) | system design | free |
| `/system-design/ai-agent-run-inspector` | system design | free |
| `/system-design/ai-image-generation-mvp` | system design | premium |
| `/system-design/ai-ux-considerations` (AI-assisted bulk edit review) | system design | premium |
| `/system-design/model-training-progress-dashboard` | system design | premium |
| `/react/coding/react-chat-streaming-ui` (no framework tests) | coding | premium |
| `/javascript/coding/js-stream-to-text` | coding | free |
| `/javascript/coding/js-take-latest` (abort previous requests) | coding | free |
| `/javascript/coding/js-fetch-json-timeout` | coding | free |
| `/javascript/coding/js-poll-until` | coding | free |
| `/javascript/coding/js-streaming-ndjson-parser` | coding | premium |
| `/javascript/coding/js-abortable-helpers` | coding | premium |
| `/javascript/trivia/ai-streaming-data-handling` | trivia | free |
| `/javascript/trivia/chat-conversation-state-management` | trivia | free |
| `/javascript/trivia/ai-ux-integration-challenges` | trivia | free |
| `/javascript/trivia/prompt-engineering-frontend` | trivia | free |
| `/javascript/trivia/sse-vs-websocket-real-time` (crawled, not indexed since 2026-06) | trivia | free |
| `/tradeoffs/sse-vs-websocket-live-dashboard` | tradeoff | free |

Related: the Angular HTTP cancellation lab (`/angular/trivia/angular-http-what-actually-cancels-request`), `/javascript/trivia/js-async-race-conditions`, `/incidents/stale-search-race`, and `/companies/openai/preview`, the only AI-themed landing page (custom preview with five prompts, a stale-stream walkthrough and a prep sequence).

What is thin: only one coding challenge is about an AI interface directly, and it has no tests; no case covers the conversation view (streaming markdown, virtualization, history); the AI chat case is titled around the textarea while interviews ask for the whole chat frontend; nothing groups the items; there is no Angular version of anything.

## Track design

The money pages come first; the free pages exist to be found and to hand the reader to them.

### 1. Flagship challenge: "Streaming chat: stream, stop, retry"

A tested coding challenge in the existing browser workspace, mirroring the reported OpenAI task. The stages are separate catalog entries so that the first one can be free and indexed while the rest stay premium.

| Stage | Task | Tests that decide pass or fail | Access (proposal) |
|---|---|---|---|
| 1 | Render a reply that arrives as chunks from an async iterable or `ReadableStream`; show it as it arrives | text grows monotonically, final text equals the joined chunks, no chunk rendered twice, a loading state before the first chunk | free, indexable |
| 2 | Stop button with `AbortController`; keep partial text; status queued → streaming → stopped | abort is called once, partial text stays, status transitions in order, no state update after abort | premium |
| 3 | Retry and regenerate; resume a dropped stream from the last event id against a mocked SSE server | duplicate events are discarded, retry uses the same request id, regenerate creates a new assistant message | premium |
| 4 | Token batching with `requestAnimationFrame` and a virtualized list of 10,000 messages; stick to the bottom while streaming, release when the user scrolls up | render count stays under a threshold for 1,000 chunks, scroll position follows the stream and stops following after a user scroll | premium |

Variants: React first (the market), then Angular (signals wrapping a fetch stream, stop through `AbortController`; the author's lane and a variant no competitor has). Check whether the Angular workspace runs tests before promising "tested"; `react-chat-streaming-ui` ships without framework tests today. Vue later if the Vue audience justifies it.

### 2. System design cases

- Reframe `ai-chat-textarea-design` as the spine of the AI chat frontend: the composer stays, the streaming turn becomes the first section, and the case links to the challenge stages by fragment. The slug does not change (a slug change needs a retired-manifest record and a 301).
- New case, conversation view: streaming markdown, virtualization of long conversations, history and offline reads, edit-and-regenerate branches. This is the case interviews describe at Anthropic and Waymo.
- New case, retrieval answer with citations: sources panel, inline anchors, streaming while citations resolve. HelloFrontend has a Perplexity-style version; search shows nobody.
- `ai-agent-run-inspector` already covers the agent trace; link it from the hub.

Access is an owner decision. Three of the five existing AI cases are premium and premium pages are `noindex`; whichever case is meant to be found must be free.

### 3. Company pages

`/companies/openai/preview` stays as the AI landing page and links to the track; its query is saturated (GreatFrontEnd, educative, designgurus, dataford, 1point3acres), so it is not grown further. A four-segment check on 2026-10-14 (AI labs, US scale-ups, Europe and Turkey, India and remote-first; about 140 searches, US-only proxy, no volume tool) found that GreatFrontEnd's 37 guides are all US companies (OpenAI, Anthropic and Harvey from the AI segment), while Dataford, Prepfully, PracHub and techinterview.org publish templated pages for nearly any employer. "No competitor" therefore means "no sourced guide", and a page only wins if it cites real candidate reports.

AI companies that are open and sourced, in order: Waymo (a verified May 2026 senior loop on PracHub: tree filter rendered as an indented UI, a Promise problem, debounced autocomplete, AI-chat frontend system design, Angular debugging from user bug reports; no FE guide anywhere; zero FE-titled openings today), ElevenLabs (Glassdoor reports from 2024 and 2026 with React tasks and voice-streaming expectations; Aced holds a paywalled experience page), Scale AI (the "fullstack practical" on HackerRank with a React/TS part; large Blind footprint), Perplexity (a 2026 frontend online assessment report: infinite-scroll page, components, CSS; PracHub says the loop is Python-first), Mistral (official loop in the Paris posting: TypeScript live coding and system design; zero prep coverage) and Glean (thin). Covered: Anthropic and Harvey (GreatFrontEnd), xAI and Replit (Dataford). Known format but no frontend content: Cursor, Sierra, Cohere, Lovable, Runway, Cognition.

Every page keeps the existing "editorial grouping, no official questions" framing, cites its reports by URL, and is written only when a report with actual questions exists.

### 4. Hub and mechanic pages

- Hub under the interview-questions landing pattern (`/interview-questions/essential` is the model): one page that groups the eighteen items, the challenge stages, the cases and the company pages. It needs a `criticalRouteContracts` entry in `frontend/scripts/seo-meta-check.mjs`.
- Seven free question pages, one per mechanic, each written as the interviewer's follow-up and ending in a link to the challenge stage that proves it: stream reading, stop and cancel, token batching, partial markdown, stick-to-bottom scroll, reconnect and dedupe, message status and optimistic send. These are the entry layer, not the goal. Titles must not copy PracHub's.
- Reposition `/javascript/trivia/sse-vs-websocket-real-time` as "SSE vs WebSocket vs fetch streaming for LLM responses" with a decision table and a build-it block. The dashboard tradeoff page keeps its own angle, so the two do not compete.

### 5. Track entry

`cdn/questions/track-registry.json` tracks are filter-based (`browseParams`) plus a `featured` list. An "AI product frontend" track can start as a hidden track with the challenge stages, the AI cases and the free building blocks as `featured` entries; make it visible once the challenge exists. If `browseParams` cannot filter by tag, the featured list carries it.

## Sequence

| Phase | Work | Gate |
|---|---|---|
| A | Reposition the SSE page; build challenge stage 1 (free) and stages 2 to 4 (premium); hub; link blocks from the twelve indexable AI items and the OpenAI page | Stage 1 passes its tests in the workspace; hub and stage 1 in the sitemap; `seo:meta-check` green |
| B | Conversation-view case; seven mechanic pages; Angular variant of stage 1 and 2 | Each page meets the trivia editorial lint (title 60 characters or fewer, answer-first description) |
| C | Perplexity and Waymo pages; citations case; track visible | Reports cited on every company page |

Each phase is its own yes or no. Phase A alone is enough to test the bet.

## How to judge it

- Search Console, per query family, 6 to 8 weeks after each phase: "streaming llm response frontend", "sse vs websocket llm", "stop generating button", "chat auto scroll while streaming", "openai / anthropic / perplexity frontend interview". Targets follow the roadmap protocol: indexed, impressions above zero for the new families, and for the SSE page at least 150 impressions per 28 days at CTR 2% or better.
- GA4: `challenge_viewed` → `challenge_attempt_started` → `challenge_attempt_result` → `challenge_completion_saved` for stage 1 (the activation funnel in `docs/references/ga4-conversion-baseline.md`); the share of `purchase` and `sign_up` whose landing page is an AI page. Today no purchase is attributed to a landing page in the repo, so the first reading is also the baseline.
- Links: whether the free stage or a case earns a link without an ask (resource lists, newsletters). The CSS sticky lab did; the framework-specific labs did not.
- Stop rule: if after phase B the AI families still show no impressions and stage 1 has under 25% attempt rate among qualified views, keep the pages and stop expanding.

## Risks

- HelloFrontend is on the shelf and GreatFrontEnd has named the topics in its guides; the open window is in search, and it closes when either adds question pages. Phase A should ship before anything else.
- Volume is unproven (19 visible impressions). The bet is on conversion of high-intent visitors, not traffic.
- Premium pages are `noindex`; the free stage and at least one free case are the only searchable surface.
- A streaming challenge depends on web standards (`fetch`, `ReadableStream`, `AbortController`, SSE), so churn is low; the agent-UI vocabulary is the only part that may date.

## Open decisions

- Free versus premium split for the stages and the cases.
- React or Angular first for the flagship (React has the market, Angular has the author and no competitor).
- The hub slug and title.
- Whether the site gets a byline (open since 2026-10-12); audience-led distribution of a free runnable challenge depends on it.
- Pricing: the paid-product survey of 2026-10-14 (GreatFrontEnd, BigFrontEnd, FrontendLead, Hello Interview, Aced, interviewing.io, Dataford, PracHub, NamasteDev, HelloFrontend) found no evidence that an AI track sells on its own; vendors bolt AI tiers onto a bank, and the one standalone AI track (HelloFrontend) is paused. The only product with verified revenue is company-specific content (Dataford, about $36.8K MRR on TrustMRR). Sell the AI material inside the bank, make the company-tagged pages the gate, and consider an annual anchor (the observed band is $48 to $120 a year) next to the monthly plan and the limited lifetime offer.
- Adjacent gap found in the same research: candidates report debugging rounds ("12 bugs to resolve", "debug UI code from user reports", AI-assisted rounds at Meta and Google) and no frontend product practises them. The catalog already has a debug kind (9 questions) and 10 incidents; an AI-chat debugging stage (fix a broken streaming UI) would sit inside this track without a new format.
