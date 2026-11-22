---
title: "Design an AI Voice Shopping Assistant for an Online Store"
slug: "ai-voice-shopping-assistant"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design and product decomposition interviews"
intent: "Teach a concrete AI voice shopping answer: a simple loop first, one phase machine for voice and text, a model limited to a validated filter patch, follow-ups that edit the filters, cancellation, and a recovery path for every failure."
target_words: 1800
primary_keyword: "ai voice shopping assistant frontend system design"
status: "converted"
content_schema_version: 2
target_level: "senior"
timebox_minutes: 20
candidate_prompt: "Design the frontend of an AI voice assistant that helps shoppers find products in an online store. A shopper presses a talk button and asks for something, such as running shoes in size 42 under 120. Products appear while a short spoken summary plays, and the shopper can refine by voice or by typing. Walk through the voice states, where the model sits, and how follow-ups and failures are handled."
constraints:
  - "Every product, price and stock level comes from the catalog."
  - "Every voice action has a typed alternative."
  - "The shopper can interrupt the voice."
expected_decisions:
  - "Start with a simple loop of talk, transcript, filter patch, catalog search, results and a templated summary, run by one store with idle, listening, thinking and speaking phases."
  - "Give the model the transcript, the filters, the facet values and any pending choice; parse its reply into a patch, a facet choice or out-of-scope, and commit a patch when its search lands."
  - "Use tap to talk with a visible Cancel, and let talk cancel a busy turn, stopping speech and keeping the results."
prerequisites:
  - "Microphone permissions in the browser"
  - "Streaming speech services"
  - "ARIA live regions"
core_skills:
  - "Voice interaction states"
  - "Model output as structured data"
  - "Conversational search state"
  - "Accessible voice and text input"
guided_mock: false
evaluation_must_cover:
  - "One phase machine drives listening, thinking and speaking."
  - "The model returns a filter patch; the catalog supplies products."
evaluation_strong_signals:
  - "A follow-up edits the current filters."
  - "Every voice state has a typed path."
evaluation_expert_stretch: "Speculating on a stable partial, shown only if the final draft matches."
evaluation_red_flag: "Showing products the model invented."
notes_for_conversion:
  - "Practice version of the voice chat for retail product search question in a March 2026 London software engineer account on Taro and the product decomposition round of a November 2026 onsite on PracHub; it is not the reported wording and names no retailer."
  - "Keep speech recognition, speech synthesis and the model behind service contracts; the browser owns the conversation and the catalog owns every product fact."
  - "Maintain exact V2 practice parity across the draft, index and metadata, and ship exactly two local SVG diagrams."
search_intent: "Prepare a frontend system design answer for an AI voice assistant that helps shoppers search an online store."
reader_promise: "The reader can explain a simple voice search loop, one phase machine for voice and text, a model limited to a validated filter patch, follow-ups that edit the filters, cancellation in every phase, and a recovery path for every failure."
unique_angle: "Follow one spoken search, an interruption and an empty result, with the browser owning the conversation, the model owning only the words-to-filters step and the catalog owning every product fact."
what_this_adds_beyond_basics: "Turns a vague voice assistant brief into the decisions a design round probes: where the model sits and what it may not do, which states a voice interface needs, how a follow-up changes the search instead of starting over, how the shopper stops the voice, and what the page does when the microphone, the speech service or the catalog fails."
competitor_query: "voice shopping assistant frontend system design"
competitor_takeaways:
  - "Strong conversational designs ground the assistant's answers in retrieved data instead of letting the model answer from its own knowledge."
  - "Voice interfaces need explicit listening, thinking and speaking states with visible feedback and a way to stop."
competitor_gaps:
  - "Public answers rarely say how a follow-up such as cheaper or in blue changes the current search, or how a late reply for an older request is dropped."
  - "Accessibility is usually reduced to adding voice, without a typed path, announced states or a microphone that only opens on a press."
sources:
  - "https://www.jointaro.com/interviews/companies/elevenlabs/experiences/software-engineer-london-england-march-9-2026-no-offer-neutral-9f916c8f/"
  - "https://prachub.com/interview-experiences/elevenlabs-software-engineer-interview-experience-live-coding-and-product-decomposition-onsite-rejected"
  - "https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
  - "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html"
last_fact_checked_at: "2026-11-22"
reviewed_by: "FrontendAtlas editorial"
confidence: "high"
---

# Prompt

This AI voice shopping assistant frontend system design exercise follows one shopper from a spoken request to a product page. The shopper presses a talk button, says what they want, watches matching products appear and hears a short summary, then narrows the search by voice or by typing. The rounds it practices are open: one 2026 candidate said they overcomplicated it while the interviewers wanted something simple, and another was handed the question of what it should look like. Bring a simple loop that works, then the states, the model's limits and the failures.

Candidate prompt: Design the frontend of an AI voice assistant that helps shoppers find products in an online store. A shopper presses a talk button and asks for something, such as running shoes in size 42 under 120. Products appear while a short spoken summary plays, and the shopper can refine by voice or by typing. Walk through the voice states, where the model sits, and how follow-ups and failures are handled.

The browser-facing scope covers the talk button and the microphone, the conversation store and its phases, the transcript, the filters and their chips, the results grid, the spoken summary, the typed path, accessibility and consent. Speech recognition, the intent model and the catalog are service contracts, not implementation targets.

# Clarifying Questions

- **Voice alone, or voice with a screen?** Voice with a screen: the products appear in a grid, and the voice summarizes them. A voice-only answer would have to read whole lists aloud.
- **How far does the assistant go?** It finds and narrows products. Questions about a product or the basket are out of scope, and the assistant says what it can do.
- **What can the catalog be searched by?** Category, size, color, a price range and stock. Those facets are all the model may fill.
- **How does a voice request start and end?** Tap to talk: a tap starts listening once the microphone is live, a second tap ends it, and silence after speech or a 15-second cap is the fallback; a visible Cancel in every busy phase drops it. An open microphone would hear the assistant itself, so talking over the summary means tapping talk.
- **What if the shopper cannot or will not speak?** A text box runs the same search in every phase, the transcript can be edited and sent again, and spoken replies can be switched off.

# Architecture

Start with the simple loop: talk, transcript, a filter patch from the model, a catalog search, the results grid and a short summary filled from those results. Everything else refines it. The browser splits into an assistant panel, a speech client, a conversation store, an intent client, a catalog gateway and a results grid. The store owns the phase, the active turn with its AbortController, the filters, the results and any problem, validates every model reply, and is the only place that decides what happens next.

The canonical flow: the shopper presses talk, which opens turn t_1, says running shoes in size 42 under 120 and presses talk again. The store shows skeleton cards and sends the transcript, the current filters and the facet values to the intent service. The store validates the model's raw reply into a patch that sets a category, a size and a maximum price; the store checks the category first, fetches that category's facets, checks the size, and applies the patch to the turn's draft. The search returns 14 products, the draft commits, three chips and 14 cards appear, and the browser's speechSynthesis reads a summary filled from the first card. Halfway through, the shopper presses talk and says in blue: the voice is cancelled before the microphone opens, the cards stay, and turn t_2 commits a fourth chip with six products.

# Tradeoffs

**A model that patches filters versus a model that answers.** Letting the model recommend products in its own words feels natural, but it will name items, prices and stock the store does not have. A validated filter patch whose free-text query may only use words from the transcript, a choice among facet values, or an out-of-scope reply keeps every product fact in the catalog.

**A templated summary versus a written one.** A summary the model writes reads better and can still misstate a price. A template filled from catalog records says less and says it correctly, and the browser's own speech synthesis can read it with no extra service.

**Committing on success versus applying at once.** Applying a patch as soon as the model replies leaves a chip on screen when the search is cancelled or fails. Applying it to a draft that commits only when its search lands keeps the chips and the grid in step.

**Browser speech recognition versus a speech service.** The [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) recognition is uneven across browsers. Streaming audio from [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) to a speech service, with a short-lived token fetched after consent, gives the same partial and final text everywhere. The short summary still uses the browser's speechSynthesis, unlocked inside the tap on mobile Safari, and a branded server voice can replace it later.

**Starting over versus editing the search.** Treating every request as new loses follow-ups such as in blue. Sending the current filters with each transcript lets the model return a patch, and the chips show exactly what the search now is.

# Failure Modes

**The microphone is denied, missing, busy or failing.** NotAllowedError from a dismissed prompt keeps talk for a retry; when the permission state is denied, talk becomes aria-disabled with how to allow it in site settings. NotFoundError or an insecure page without mediaDevices marks talk aria-disabled with the reason. NotReadableError or an AbortError from getUserMedia keeps talk for a retry, and a stream that arrives after a cancel has its tracks stopped at once.

**Nothing is heard.** listen resolves null, and the store returns to idle with a message.

**The model replies with bad JSON, too slowly, or out of scope.** The results stay; the transcript goes back into the text box, or the assistant says what it can do. The store aborts a slow turn with the reason timeout, so a timeout is never mistaken for a cancel.

**A value the catalog does not have.** A size or color outside the category's facets becomes a choice that keeps the rest of the patch, so tapping 42 still searches running shoes under 120. Crossing price bounds clear the bound the patch did not set.

**No products match.** The search lands with total 0. The chips stay to show what was asked, the voice says no matches, and Undo restores the previous search without a model call.

**The shopper cancels.** Escape in any phase, a typed submit, or talk during thinking or speaking aborts the turn through its [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController). The store reads the abort reason, treats cancel as no failure whatever error follows, shows nothing, and ignores any reply for a turn that is no longer active.

# Metrics

Track the time from the end of listening to the first cards, the share of spoken searches that end in a product view, how often the shopper interrupts the voice, how often a follow-up patches rather than replaces the filters, the rate of each problem, how often a choice or Undo appears, and the share of typed turns. None of these needs what the shopper said. Model quality is measured separately: a JSON schema makes the category an enum while size, color and query stay strings for validation to check, and recorded transcripts with expected patches catch regressions. Check the short announcements against [WCAG Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) in accessibility reviews.

# Rollout

Ship the typed path first: the text box, the intent service, the catalog search and the chips, so the filter patch, the facet checks and the commit on success are proven without audio. Then add push to talk with consent, where declining keeps the text box, and partial transcripts, and the spoken summary last, behind a setting the shopper can turn off. Before each step, automate an interruption during the summary, a cancelled thinking turn, a size outside the facets, an empty result and Undo, a denied and a missing microphone, and keyboard and screen-reader passes over the talk button, the choices and the announcements.
