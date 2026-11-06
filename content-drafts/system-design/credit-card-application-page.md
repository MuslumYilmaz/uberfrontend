---
title: "Design a Credit Card Application Page and Its Confirmation Page"
slug: "credit-card-application-page"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete credit card application answer with one form store and layered validation, sensitive fields kept out of logs and storage, an idempotent submit with five outcomes and a confirmation that reads status."
target_words: 1900
primary_keyword: "credit card application page frontend system design"
status: "converted"
content_schema_version: 2
target_level: "senior"
timebox_minutes: 20
candidate_prompt: "Design the frontend of a credit card application page and the confirmation page after it. An applicant enters identity, address, income and housing costs, reviews the terms and submits. The decision can be approved, declined, pending review or a request to verify identity. Walk through the components, where form state and validation live, how sensitive fields are protected, and what the confirmation shows after a refresh."
constraints:
  - "Sensitive fields never reach logs, URLs or storage."
  - "One submit creates one application."
  - "A decision can take minutes."
expected_decisions:
  - "Keep every field in one form store, validate on blur, per section and on the server, and map the server's field errors back by name."
  - "Send each submit with an idempotency key and give every outcome its own screen: approved, declined, pending review, verify identity and failure."
  - "Replace the submit entry with a status route that reads the application by id and shows masked values, so a refresh reads instead of posting."
prerequisites:
  - "HTML form validation"
  - "HTTP idempotency"
  - "ARIA error messages"
core_skills:
  - "Form state ownership"
  - "Sensitive data handling"
  - "Idempotent submits"
  - "Accessible error recovery"
guided_mock: false
evaluation_must_cover:
  - "One form store owns every field and its errors."
  - "Each submit carries an idempotency key."
evaluation_strong_signals:
  - "Sensitive values are masked and never logged."
  - "The confirmation reads status, so a refresh never resubmits."
evaluation_expert_stretch: "Resuming a draft on another device without sensitive fields."
evaluation_red_flag: "Refreshing the confirmation posts the form again."
notes_for_conversion:
  - "Practice version of the Power Day design round described in Capital One senior frontend accounts on Taro from July and August 2024; it is not the reported wording and names no product data."
  - "Keep the credit decision and identity checks behind the application service contract."
  - "Maintain exact V2 practice parity across the draft, index and metadata, and ship exactly two local SVG diagrams."
search_intent: "Prepare a frontend system design answer for a credit card application page and its confirmation page."
reader_promise: "The reader can explain one form store with layered validation, sensitive fields kept out of logs and storage, an idempotent submit with five outcomes and a confirmation that reads status for a card application."
unique_angle: "Follow one application through a double click, a slow submit, a pending decision and a refresh, with the browser owning the form and the application service owning the record."
what_this_adds_beyond_basics: "Turns the usual form advice into the follow-ups a design round asks: where validation runs and who has the final word, what keeps a retried submit from creating a second application, which values may never leave memory, and why the confirmation has to be a read rather than the page that posted."
competitor_query: "credit card application form frontend system design"
competitor_takeaways:
  - "Strong form designs keep one source of truth for field values and errors and validate in layers, with the server as the final authority."
  - "Payment and application flows use an idempotency key so a retry after a timeout cannot create a duplicate."
competitor_gaps:
  - "Public answers rarely say what the confirmation page does on refresh, in a second tab or after Back, which is where most duplicate submits come from."
  - "Sensitive-field handling is usually reduced to HTTPS, without saying which values stay out of logs, analytics, URLs and browser storage."
sources:
  - "https://www.jointaro.com/interviews/companies/capital-one/experiences/senior-frontend-engineer-washington-dc-july-1-2024-no-offer-neutral-3e4968d4/"
  - "https://www.jointaro.com/interviews/companies/capital-one/experiences/senior-frontend-engineer-chicago-il-august-1-2024-no-offer-negative-958c2993/"
  - "https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/"
  - "https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState"
  - "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete"
  - "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html"
last_fact_checked_at: "2026-11-06"
reviewed_by: "FrontendAtlas editorial"
confidence: "high"
---

# Prompt

This credit card application page frontend system design exercise follows one applicant from an empty form to a decision. The page asks for identity, address, income and housing costs, shows the terms, and submits; the confirmation page that follows has to make sense after a refresh, in a second tab and after Back. The round it practices is conversational, with a whiteboard for notes, so what you bring is a design you can explain, not code you write.

Candidate prompt: Design the frontend of a credit card application page and the confirmation page after it. An applicant enters identity, address, income and housing costs, reviews the terms and submits. The decision can be approved, declined, pending review or a request to verify identity. Walk through the components, where form state and validation live, how sensitive fields are protected, and what the confirmation shows after a refresh.

The browser-facing scope covers the sections, the form store, validation, the submit and its retries, the outcome screens, the confirmation route, accessibility and telemetry. The application service is a contract, not an implementation target: it owns the record, the final validation and the decision. The credit check and identity verification stay behind it.

# Clarifying Questions

- **Is it one page or several steps?** Several sections on one route: identity, address, income and review. The applicant can move back and forth, and progress shows which sections are complete.
- **Can the applicant save and come back?** Not by default. If the product wants it, a signed-in applicant gets a server draft of the non-sensitive sections; the sensitive fields are entered again.
- **What happens after submit?** The service answers with an application and a status: approved, declined, pending review or verify identity. Pending review can take minutes, so the confirmation has to work without the form.
- **What counts as sensitive?** The Social Security number, the full date of birth and income. They never go into URLs, logs, analytics or browser storage, and the confirmation shows masked values only.
- **What does accessibility require?** Visible labels with autocomplete tokens, errors tied to fields and listed in a summary, focus moved to that summary after a failed submit, announcements in a polite live region, and a timeout warning that offers more time.

# Architecture

The browser splits into a shell, four section components, one form store, a gateway, the confirmation route and a telemetry client. The shell owns the route, the section order, progress and the leave warning. The sections own layout, labels and help text, and bind their inputs to the store. The store holds every field with its value, touched flag and error, plus the open section, the idempotency key and the submit phase. The gateway is the only code that talks to the application service.

The canonical flow: an applicant fills the four sections and opens review, which creates idempotency key k_7. The applicant double-clicks Submit; the first click moves the phase to submitting and the second does nothing, so one request leaves. The reply is slow and the client times out, so the phase becomes failed with a retry and the fields stay filled. The retry sends k_7 again, and the service, which had already created application a_19 for that key, answers with a_19 and pending review. The shell replaces the history entry with the status route for a_19, and the confirmation reads the record, shows the masked name and the last four digits of the Social Security number, and polls until the decision arrives.

# Tradeoffs

**One form store versus state in each section.** Section-local state is simple until review has to show everything, the server returns errors for fields in other sections, or Back has to restore values. One store with field names as keys makes server errors map back by name and keeps review honest.

**Layered validation versus server-only or client-only.** Format checks on blur catch typos early, completeness checks gate the next section, and the server has the final word because only it knows the rules that change. Client-only validation drifts from the service; server-only validation makes the applicant wait for every typo.

**An idempotency key versus disabling the button.** Disabling the button stops a double click but not a retry after a timeout, a second tab or a flaky network that repeats the request. A key sent with the [Idempotency-Key header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) lets the service return the first application for every repeat. The button still turns into a progress state, because the key protects the record and the progress state protects the applicant from wondering.

**A confirmation that reads versus one that posted.** If the confirmation is the response to the POST, a refresh asks to resubmit and Back shows a filled form. Replacing the entry with a status route through [History.replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState) turns every refresh into a read of the same record.

**Masking on the client versus masked data from the service.** Masking in the browser still means the full value was in memory and maybe in a payload. The confirmation asks the service for a masked record, so the full values never come back after submit.

# Failure Modes

**Double click on Submit.** The phase is already submitting, so the second click does nothing and one request leaves.

**A slow reply or a timeout.** The fields stay, the phase becomes failed, and the retry sends the same key, which returns the existing application if there is one.

**The session expires mid-form.** The gateway sees 401, the applicant signs in again in a dialog, the fields stay in memory, and the submit goes out again with the same key.

**The service rejects fields.** Errors map back by field name, the summary takes focus, and the corrected submit gets a new key, because the rejected attempt created nothing.

**A key reused with different fields.** The service answers 422. It is a client bug: keep the fields, log the code and start a new attempt.

**The decision is pending.** The confirmation explains what happens next, polls with growing intervals, pauses while the tab is hidden and says the page can be closed.

**Identity needs checking.** The status route opens the verification step and comes back to the same applicationId.

# Metrics

Track the completion rate per section, the share of submits that needed a retry, the share of retries that returned an existing application, the time from submit to a final decision, field error rates by field name and error code, and how often the confirmation was refreshed or opened in a second tab. None of these needs a field value. Watch error identification against [WCAG Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) in accessibility reviews.

# Rollout

Ship the form store and the status route first, behind the existing form, so the confirmation stops posting before anything else changes. Then add the idempotency key to the submit and confirm on the service side that a replay returns the same application. Add the server draft for signed-in applicants last, after a review of which fields it may hold. Before each step, automate a double click during a slow reply, a timeout followed by a retry, a refresh and a second tab on the confirmation, a search of logs, URLs, analytics payloads and both browser storages for sensitive values, and keyboard and screen-reader passes over the error summary and the decision announcement.
