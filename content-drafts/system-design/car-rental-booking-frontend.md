---
title: "Design a Car Rental Booking Frontend"
slug: "car-rental-booking-frontend"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete car rental booking answer with explicit price authority, branch-local time, idempotent vehicle holds, expiry and conflict recovery, and accessible countdowns."
target_words: 1900
primary_keyword: "car rental booking frontend system design"
status: "converted"
content_schema_version: 2
target_level: "mid"
timebox_minutes: 15
candidate_prompt: "Design the booking frontend for a car rental company. Customers search by pickup and return branch, local times and driver age, compare vehicle classes, add extras and confirm. Prices change, classes sell out and holds expire while they decide. Assign authority among URL state, the booking draft, server offers and holds. Explain how branch-local time, hold expiry, conflicts and accessible timers keep bookings honest."
constraints:
  - "Server offers set every price and fee."
  - "Times stay branch-local."
  - "Holds expire on the server clock."
expected_decisions:
  - "Separate URL search criteria, cached offers, the booking draft, holds and the reservation."
  - "Make hold creation and confirmation idempotent commands with server-issued expiry."
  - "Recover from expiry, price changes and sold-out results without losing customer input."
prerequisites:
  - "URL and form state"
  - "Intl time zones"
core_skills:
  - "Authority boundaries"
  - "Time-zone correctness"
  - "Hold lifecycle design"
  - "Accessible timers"
guided_mock: false
evaluation_must_cover:
  - "Server offers own price lines, rental days and fees."
  - "The pickup branch time zone travels from URL to request."
evaluation_strong_signals:
  - "Countdowns follow serverNow, warn early and extend when allowed."
  - "Conflicts keep extras and driver details for the next offer."
evaluation_expert_stretch: "Modifying a reservation across a daylight-saving change."
evaluation_red_flag: "Device time zone or browser rate math decides the price."
notes_for_conversion:
  - "Practice version modelled on a reported system design round about a car rental company; it is not the reported prompt."
  - "Keep payment, fleet allocation and counter operations behind the backend contract."
  - "Maintain exact V2 practice parity across the draft, index and metadata, and ship exactly two local SVG diagrams."
search_intent: "Prepare a frontend system design answer for a car rental booking flow."
reader_promise: "The reader can explain server-owned pricing, branch-local time, idempotent vehicle holds, expiry and conflict recovery, and accessible countdowns for a rental booking."
unique_angle: "Follow one rental from a branch-local search through an expiring vehicle hold, a price change and a sold-out conflict to a confirmed reservation, with the server owning price and time policy."
what_this_adds_beyond_basics: "Moves the usual car rental object model into the browser: shareable search state, server offers with expiry, an idempotent hold with a server-timed countdown, and conflict recovery that keeps customer input."
competitor_query: "car rental system design frontend"
competitor_takeaways:
  - "Car rental design guides clarify locations, one-way returns and vehicle classes before modeling reservations."
  - "Booking UX guides show fees, deposits and cancellation terms before payment to avoid checkout surprises."
competitor_gaps:
  - "Most car rental design material models backend classes; branch-local time, hold expiry and conflict recovery in the browser are missing."
  - "No guide connects an expiring inventory hold to an accessible, extendable countdown and preserved customer input."
sources:
  - "https://www.jointaro.com/interviews/companies/tesla/experiences/front-end-developer-fremont-ca-january-1-2024-no-offer-neutral-9e5d4e3f/"
  - "https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable"
  - "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API"
  - "https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/"
  - "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/409"
last_fact_checked_at: "2026-10-19"
reviewed_by: "FrontendAtlas editorial"
confidence: "high"
---
# Prompt

This car rental booking frontend system design exercise follows one customer from a search to a confirmed reservation. The customer chooses a pickup branch, an optional different return branch, pickup and return times and a driver age, then compares vehicle classes, adds extras and confirms. Underneath the page, everything that decides the outcome can move: prices depend on dates, branches, age and promotions, inventory is shared with other customers, and a class can sell out between two clicks.

Candidate prompt: Design the booking frontend for a car rental company. Customers search by pickup and return branch, local times and driver age, compare vehicle classes, add extras and confirm. Prices change, classes sell out and holds expire while they decide. Assign authority among URL state, the booking draft, server offers and holds. Explain how branch-local time, hold expiry, conflicts and accessible timers keep bookings honest.

The browser-facing scope covers the search form and its URL, the results list and filters, the class details and extras step, the driver details step, the hold countdown, confirmation and the receipt. The rental backend is a contract, not an implementation target: it owns branch hours, availability, pricing, rental-day counting, holds and reservations. Fleet allocation, payment processing and counter operations stay outside the frontend design.

# Clarifying Questions

- **Is the booking for a specific car?** No. Customers reserve a vehicle class "or similar"; the branch assigns the car at pickup. The interface never promises a model.
- **Who computes the price?** The server. An offer carries price lines, rental days, currency, a total in minor units and an expiry. The browser displays these values and never derives a total from a cached rate table.
- **Which clock and zone apply to pickup times?** The branch's. Times are wall-clock values at a branch, stored as date, time and IANA zone, formatted in that zone and sent unchanged.
- **Does selecting a class reserve it?** Only Reserve does. It creates a server hold with an expiry, so browsing cannot starve inventory for other customers.
- **Can a hold be extended?** When policy allows. The server reports how many extensions remain, and the page warns before expiry with an extension action.
- **What does confirmation need?** A live hold, driver details and an opaque payment reference from the payment provider, sent with an idempotency key.

# Architecture

The browser splits into a search route, an offer cache, a booking coordinator and a rental gateway. The search route encodes branch ids, local times, the branch zone, driver age and filters in the URL, so links and the back button reproduce a search. The offer cache keeps responses per searchId with their expiry and the server's clock. The coordinator owns the booking draft: the selected offer, extras, driver details, the active hold and the current step.

The gateway exposes availability search, hold creation, hold extension, hold release, reservation confirmation and reservation lookup. Hold creation and confirmation carry idempotency keys. Responses that start a timer carry serverNow, so the countdown can correct a wrong device clock.

The canonical flow: a search returns offer of_42 for a compact SUV or similar, three rental days, 312.40 USD. Reserve sends of_42 with key hk_1 and receives hold h_9 with a server expiry. The customer steps away during driver details, the warning goes unanswered and the server expires h_9. Reserve again uses a new key because h_9 is terminal; the server answers price-changed with offer of_57 at 338.10 USD. The page shows both totals, the customer accepts, Reserve sends of_57 with key hk_3, and hold h_10 leads to confirmation.

# Tradeoffs

**Server offers versus client price math.** Client math feels instant, but one-way fees, young-driver surcharges, taxes, promotions and rental-day rules vary by branch and date. A server offer adds a request and an expiry, yet it is the only total the counter will honor.

**Branch zone versus device zone.** Converting a picked time with the device zone is simple and wrong for a traveler planning from another zone. Storing the branch zone with the wall-clock time keeps the URL, the screen and the request identical, and leaves daylight-saving rules to the server. [MDN documents the timeZone option of Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

**Hold on Reserve versus hold on view.** Holding a class whenever a customer opens its details would lock inventory for browsers who never book. Holding only on Reserve keeps inventory fair at the cost of a sold-out answer that the page must handle well.

**Extendable timer versus fixed limit.** [WCAG 2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable) asks for a warning and a simple way to extend a time limit unless the limit is essential. An extension endpoint with a server-side cap serves customers who type slowly or use assistive technology without letting a hold live forever.

# Failure Modes

**A hold response is lost.** The coordinator retries createHold with the same key, and the server returns the existing hold. A new key appears only after the hold is terminal. The [IETF Idempotency-Key header draft](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) describes this retry contract for POST requests.

**The class sells out.** Hold creation returns a conflict with alternatives. The page keeps extras and driver details, announces the change and moves focus to the alternatives.

**The price changes.** The conflict carries a new offer. The page shows the old and new totals and asks for a new choice; nobody confirms a price they have not seen.

**The hold expires.** The page moves to hold-expired, keeps every entered field and offers Reserve again.

**Offers expire in a hidden tab.** When the tab becomes visible again, the page reruns the search and marks changed prices instead of holding an expired offer.

**The confirmation response is lost.** The coordinator retries with the same key, then reads the reservation; the receipt renders only from a confirmed reservation.

# Metrics

Track hold expiry rate, price-changed and sold-out conflicts, search-to-hold and hold-to-reservation conversion, extension use and confirmation retries. Segment by branch, device class and network before tuning caching or warning timing. Run keyboard and screen-reader passes over date entry, the results count, the hold warning and the alternatives list, and test searches from devices set to other time zones.

# Rollout

Ship the search route and offer cache first behind the existing booking pages, then the coordinator and holds for one branch group with a kill switch that stops new holds while existing holds and reservations stay visible. Before expansion, automate double-click Reserve, lost hold and confirmation responses, expiry during driver details, price-changed and sold-out conflicts, hidden-tab expiry and searches from another time zone. Accessibility review covers the countdown warning, focus return, the results announcement and branch selection without the map.
