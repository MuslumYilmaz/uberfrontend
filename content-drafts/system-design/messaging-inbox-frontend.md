---
title: "Design a Real-Time Messaging Inbox"
slug: "messaging-inbox-frontend"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete messaging inbox answer with server-owned order, deduplicated optimistic sends, reconnect catch-up, cross-device read state and an accessible message log."
target_words: 1900
primary_keyword: "real-time messaging inbox system design"
status: "converted"
content_schema_version: 2
target_level: "senior"
timebox_minutes: 20
candidate_prompt: "Design the messaging inbox for a professional network. Members see conversations with unread counts and open threads that update in real time. Messages sent during a dropped connection must not duplicate or reorder, read state must sync across devices, and old history loads on demand. Assign authority among the composer, local thread, realtime channel and server log. Explain ordering, optimistic sends, reconnect catch-up and an accessible message log."
constraints:
  - "The server assigns message order."
  - "Retries reuse one client id."
  - "Read state belongs to the member, not the tab."
expected_decisions:
  - "Separate the server message log, the optimistic outbox, thread view state and ephemeral typing signals."
  - "Reconcile sends and reconnects through clientMessageId, per-conversation sequence and an inbox cursor."
  - "Announce and navigate messages accessibly without flooding screen readers or stealing focus."
prerequisites:
  - "WebSocket basics"
  - "Cursor pagination"
  - "ARIA live regions"
core_skills:
  - "Ordering and deduplication"
  - "Reconnect recovery"
  - "Cross-device read state"
  - "Accessible live content"
guided_mock: false
evaluation_must_cover:
  - "Server sequence numbers order threads; device clocks never do."
  - "One clientMessageId survives every retry and reconnect."
evaluation_strong_signals:
  - "Reconnect replays events after the last cursor or resyncs."
  - "The thread is a polite log that summarizes bursts."
evaluation_expert_stretch: "Sharing one connection across tabs with edits and deletes."
evaluation_red_flag: "Device time orders messages or retries mint new ids."
notes_for_conversion:
  - "Practice version of the chat design shape named in a Walmart-badged reply; it is not a reported prompt and names no product."
  - "Keep push delivery, spam filtering and storage behind the backend contract."
  - "Maintain exact V2 practice parity across the draft, index and metadata, and ship exactly two local SVG diagrams."
search_intent: "Prepare a frontend system design answer for a real-time messaging inbox."
reader_promise: "The reader can explain server-ordered threads, deduplicated optimistic sends, reconnect catch-up, cross-device read state and an accessible message log for a messaging product."
unique_angle: "Follow one reply through a dropped connection, a catch-up by inbox cursor, a burst in a busy group and a read on another device, with the server owning order and read state."
what_this_adds_beyond_basics: "Brings the usually separate follow-ups into one answer: server sequence numbers, a client message id that survives retries and echoes, cursor catch-up with a resync path, read positions shared across devices, and a polite log that summarizes bursts."
competitor_query: "chat app frontend system design"
competitor_takeaways:
  - "Strong chat answers treat the socket as transport and a durable server log as the source of truth, with client-generated ids so retries do not duplicate."
  - "Frontend versions scope a browser chat around optimistic sending, offline queuing, delivery states and reconnect catch-up."
competitor_gaps:
  - "Group threads, cross-device read state and multi-tab ownership usually appear only as follow-ups."
  - "Public answers rarely specify accessibility for a live thread, such as a named log region, summarized bursts and stable focus."
sources:
  - "https://www.teamblind.com/post/Walmart-Interview-for-Frontend-software-engineer-III-TQhXf1X5"
  - "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API"
  - "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API"
  - "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/"
  - "https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/"
last_fact_checked_at: "2026-10-19"
reviewed_by: "FrontendAtlas editorial"
confidence: "high"
---
# Prompt

This real-time messaging inbox system design exercise follows one member through a conversation list, a thread and a reply. The inbox is a person-to-person product: one-to-one conversations and small groups, unread counts, history that loads on demand and messages that arrive while the member reads. Underneath the page the network is unreliable, members use several devices, and other people keep writing.

Candidate prompt: Design the messaging inbox for a professional network. Members see conversations with unread counts and open threads that update in real time. Messages sent during a dropped connection must not duplicate or reorder, read state must sync across devices, and old history loads on demand. Assign authority among the composer, local thread, realtime channel and server log. Explain ordering, optimistic sends, reconnect catch-up and an accessible message log.

The browser-facing scope covers the inbox list, the thread view, the composer and outbox, the realtime channel, read tracking and announcements. The messaging backend is a contract, not an implementation target: it owns membership, message order, delivery, read positions and history. Push notifications, spam filtering and storage stay outside the frontend design.

# Clarifying Questions

- **Who decides the order of messages?** The server. Each conversation has a sequence that grows with every accepted message; the browser sorts by it and never by device time.
- **What makes a send safe to retry?** A clientMessageId created before the first attempt. The server stores it, so a retry after a timeout returns the original message, and the realtime echo replaces the optimistic bubble.
- **What happens after a dropped connection?** The client asks for events after its last inbox cursor. If the cursor has expired, it resyncs the inbox and the open thread through the REST endpoints.
- **Where does read state live?** On the server, per member and conversation. A read on a phone clears the badge on the web through a read event.
- **Are typing and presence stored?** No. They are short-lived signals that expire on their own.
- **What does accessibility require?** The thread is an ARIA log with a name, bursts are summarized, own sends are not read back, focus never jumps on arrival, and the inbox works from the keyboard.

# Architecture

The browser splits into an inbox store, a thread store, an outbox and a realtime channel, with a gateway for REST calls. The inbox store keeps conversation summaries in server activity order with server unread counts. The thread store keeps confirmed messages by sequence, the cursor for older pages and the member's read marker. The outbox keeps pending sends with their clientMessageId, attempts and errors. The realtime channel owns the socket, the inbox cursor and reconnect backoff.

The canonical flow: Ana writes in conversation cv_9 while the channel is live at cursor 1203 and the thread is confirmed up to sequence 482. The outbox creates cm_17 and shows the reply as sending. The connection fails during the POST, the request times out and the bubble moves to retrying because the outcome is unknown. After reconnecting, the channel asks for events after 1203 and receives message 483 from Ben and message 484, which carries cm_17 because the first POST had arrived. The thread inserts 483, replaces the pending bubble with 484 and the outbox clears its retry. Ana's client then sends read position 484, and Ben's phone shows the read receipt from the read event.

# Tradeoffs

**Server sequence versus device time.** Device time looks free, but clocks drift and an outbox can hold a message for minutes. A server sequence costs one field and gives every device the same order and a way to detect gaps.

**Client message id versus disabling the button.** Disabling Send hides double clicks but not timeouts. A clientMessageId makes retries and echoes converge on one message, as the [IETF Idempotency-Key draft](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) describes for retried POST requests.

**Cursor catch-up versus trusting the socket.** A [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) delivers events while it is open, but nothing replays what was missed while it was closed. Asking for events after the inbox cursor fills the gap in order, and a resync path covers cursors the server no longer keeps.

**One socket per tab versus a shared leader.** One socket per tab is simple and survives tab crashes. A leader tab or shared worker saves connections but adds election and handover code; it becomes worth it when members keep many tabs open.

**Announcing every message versus summarizing.** The [ARIA log role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role) announces additions politely. In a busy group, one summary per burst keeps the thread usable with a screen reader.

# Failure Modes

**A send times out.** The outbox retries with the same clientMessageId and backoff. The bubble shows retrying, and the server returns the original message if the first attempt had arrived.

**A send is rejected.** The bubble shows failed with a reason and a retry that works from the keyboard. The typed text stays in place.

**The socket closes during a burst.** The channel reconnects with backoff and asks for events after the cursor; repeated events are ignored by sequence.

**The cursor has expired.** The client resyncs the inbox and the open thread from the REST endpoints instead of guessing what it missed.

**A sequence gap appears.** The thread loads the missing range before showing newer messages, so a reply never appears without its context.

**Read positions race across devices.** The client keeps the highest lastReadSequence it has seen, so read markers only move forward.

# Metrics

Track send-to-confirm latency, retry and failure rates, catch-up size after reconnects, resync frequency and time to the first message on open, split by device class and connection type. Count duplicate bubbles and out-of-order renders in tests and in sampled production logs, and alert when the share of sends that need a retry rises after a release, because that usually means the confirm path or the echo matching regressed. Run screen-reader and keyboard passes over inbox rows, the log region, failed sends and the new-messages pill.

# Rollout

Ship the sequence-ordered thread store and the outbox behind the existing messaging pages first, then cursor catch-up, then read positions across devices. Keep a kill switch that pauses new sends while history and read state stay visible. Before expansion, automate timeouts with retries, socket closes during bursts, expired cursors, duplicate events, sequence gaps and reads on another device, and review the log region, focus handling and keyboard paths with assistive technology.
