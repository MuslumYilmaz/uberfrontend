import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Amazon frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on rounds
 * described in public, self-reported front end engineer accounts (LeetCode Discuss, Blind and Medium, 2019 to
 * 2025) and on the loop shape Amazon publishes on its own preparation page. Nothing here is a leaked,
 * confirmed or official Amazon question, and accounts spanning five years cannot establish a fixed loop.
 */
const AMAZON_PHONE_2020_URL = 'https://leetcode.com/discuss/post/546992/';
const AMAZON_PHONE_2020_LABEL = 'Public report: Amazon front end engineer II phone screen, March 2020';
const AMAZON_LOOP_2020_URL = 'https://leetcode.com/discuss/post/591141/';
const AMAZON_LOOP_2020_LABEL = 'Public report: Amazon front end engineer II loop, Seattle, April 2020';
const AMAZON_OFFER_2020_URL = 'https://leetcode.com/discuss/post/694045/';
const AMAZON_OFFER_2020_LABEL = 'Public report: Amazon virtual onsite front end engineer II offer, June 2020';
const AMAZON_PHONE_TRIVIA_2020_URL = 'https://leetcode.com/discuss/post/678045/';
const AMAZON_ONSITE_2021_URL = 'https://leetcode.com/discuss/post/1503301/';
const AMAZON_VANCOUVER_2022_URL = 'https://leetcode.com/discuss/post/1984996/';
const AMAZON_VANCOUVER_2022_LABEL = 'Public report: Amazon virtual onsite front end engineer II, Vancouver, April 2022';
const AMAZON_SEATTLE_2024_URL = 'https://leetcode.com/discuss/post/5934170/';
const AMAZON_SEATTLE_2024_LABEL = 'Public report: Amazon onsite front end engineer II, Seattle, October 2024';
const AMAZON_INDIA_2025_URL = 'https://leetcode.com/discuss/post/6329840/';
const AMAZON_LIST_2020_URL = 'https://leetcode.com/discuss/post/742791/';
const AMAZON_BLIND_2022_URL =
  'https://www.teamblind.com/post/amazon-frontend-fee-i-oa-phone-screen-loop-interview-2022-qqdjoknw';
const AMAZON_FEE_PREP_URL = 'https://amazon.jobs/content/en/how-we-hire/fee-interview-prep';
const AMAZON_LEADERSHIP_PRINCIPLES_URL = 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles';
// Leadership Principles questions, read 2026-11-06. Amazon's pages and the files its FEE page links give example
// questions; the LeetCode and Medium accounts quote the questions their interviewers asked.
const AMAZON_INTERVIEW_LOOP_URL = 'https://www.amazon.jobs/content/en/how-we-hire/interview-loop';
const AMAZON_LP_VIDEO_URL = 'https://www.youtube.com/watch?v=CpcxVE5JIX4';
const AMAZON_LP_WORKSHEET_URL =
  'https://duaa2xs5z3ldn.cloudfront.net/assets/McsJv4WXKWb_FlRc_LRX21Ro-EvUopwEW-LeadershipPrinciplesSTARtemplate.pdf';
const AMAZON_HM_2019_URL = 'https://leetcode.com/discuss/post/336727/';
const AMAZON_NYC_2019_URL = 'https://leetcode.com/discuss/post/320613/';
const AMAZON_L5_NYC_2020_URL = 'https://leetcode.com/discuss/post/618601/';
const AMAZON_CUSTOMER_2021_URL = 'https://leetcode.com/discuss/post/1639880/';
const AMAZON_FEE_I_2025_URL = 'https://leetcode.com/discuss/post/6968134/';
const AMAZON_GRAD_SCREEN_2025_URL = 'https://leetcode.com/discuss/post/7075953/';
const AMAZON_MEDIUM_2021_URL = 'https://medium.com/javarevisited/how-was-my-frontend-engineer-interview-experience-amazon-d10055fbdd89';
const AMAZON_MEDIUM_2025_URL =
  'https://javascript.plainenglish.io/my-interview-experience-amazon-for-frontend-developer-and-lessons-learned-a4c23221b9c6';

export const AMAZON_PREVIEW_TITLE = 'Amazon Frontend Interview Questions: 7 Prompts + Prep Guide';
export const AMAZON_PREVIEW_H1 = 'Amazon Frontend Interview Questions';
export const AMAZON_PREVIEW_DESCRIPTION =
  'Prepare for an Amazon front end engineer interview with 7 practice prompts: star rating, carousel, paginated addresses, countdown timer, image service design.';
export const AMAZON_PREVIEW_CANONICAL_PATH = '/companies/amazon/preview';
export const AMAZON_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports and on the loop shape Amazon publishes, not leaked, confirmed or official Amazon questions. Self-reported loops from 2019 to 2025 cannot establish a fixed format; use recruiter-provided material as the source of truth.';

export const AMAZON_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'amazon',
  label: 'Amazon',
  title: AMAZON_PREVIEW_TITLE,
  h1: AMAZON_PREVIEW_H1,
  description: AMAZON_PREVIEW_DESCRIPTION,
  canonicalPath: AMAZON_PREVIEW_CANONICAL_PATH,
  trustNote: AMAZON_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Amazon prep guide',
    subtitle:
      'Prepare with seven practice prompts shaped by Amazon\'s Front End Engineer preparation page and {reports} public interview accounts from 2019 to 2025: a star rating widget, a carousel, a countdown timer, a file explorer and an image service design.',
    caveat:
      'This guide uses public, self-reported interview accounts and Amazon\'s published preparation page to create realistic constraints. It does not claim access to private interview material. The accounts span five years, two levels and three countries, so no single loop described here is the format you will get.',
    chips: ['7 practice prompts', 'Vanilla JavaScript, React, UI widgets, front-end design', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Amazon trivia',
    paragraphs: [
      'Amazon is one of the few companies that publishes the shape of its front end engineer loop: an online assessment with two coding questions in 90 minutes, 20 minutes of system design scenarios and a short work-style survey; a 60-minute phone screen that spends half its time on the Leadership Principles and half on front-end coding; then four 55-minute interviews with at least one front-end system design question. The public accounts from 2020 to 2025 show what the coding halves looked like in practice: small interface widgets built live, medium algorithm problems, and design conversations about an image service, a restaurant ordering app, an application\'s component architecture or a file browser.',
      'Two tactical lessons repeat across the accounts. Most interviews include two or three Leadership Principles questions, usually at the start, so ten to fifteen adaptable stories with metrics are the cheapest preparation available. And the coding half is short: the 2020 Seattle account could not finish a countdown timer in thirty minutes, and the 2024 account lost time decoding an ASCII sketch of the interface, so pin the contract in a minute and show working behaviour early. Each prompt above starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What the official page and the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Amazon\'s Front End Engineer interview preparation page establishes the loop shape, the whiteboard tool used for design, the requirement to write syntactically correct code rather than pseudo code, and the objectives a design answer is judged on: usability, performance, user experience, accessibility, security and scalability. {reports} self-reported accounts, each listed under Sources, add the exercises. A March 2020 phone screen asked for a five-star rating widget in vanilla HTML, CSS and JavaScript. An April 2020 Seattle loop reports a carousel and the coin change problem in the phone screen, then a modal with three language tabs, integer and Roman numeral conversion, CSS questions followed by a countdown timer, a transitive dependency search over referral logs, and a manager round of Leadership Principles. A June 2020 offer account reports a modal screen in the phone screen, then a front-end widget, a binary tree problem, the design of an image service and a further front-end round. A June 2020 phone screen contained only short questions: block versus inline elements, reflow versus repaint, adding an element with web APIs, CSS preprocessors, micro and macro tasks, unit versus integration testing, memory leaks and prime numbers up to n.',
      'An October 2021 rejection reports the component architecture of an application with authentication, algorithm questions from a public Amazon list, a custom data structure in JavaScript with a prototype follow-up, closures and event loop questions, and a form recreated from a picture. An April 2022 Vancouver offer reports the paginated address widget, a restaurant ordering app design, a thesaurus class and a bar raiser round. An October 2024 Seattle rejection reports a file explorer interface from an ASCII sketch, an anagram problem, a file browser design that drifted to backend questions, and unit tests for a small problem, with thirty minutes of Leadership Principles in every round. A January 2025 India account for Front End Engineer I reports an online assessment with one coding question and multiple-choice questions, a frontend assignment, two data structure problems and a screen recreated with HTML and CSS. A 2022 Front End Engineer I loop on Blind reports a component implementation, an API from a frontend library, a graph problem with a topological sort follow-up and a design question with the hiring manager. Together they establish that these round types occurred; they do not establish exact wording, the current format, or how every team interviews. Confirm the language expectations, the editor, the whiteboard and the round order with the recruiter.',
    ],
  },
  roundSpotlights: [
    {
      id: 'leadership-principles',
      kicker: 'Round decoder',
      title: 'Amazon Leadership Principles questions for front end engineers: what was asked',
      lede: [
        'Leadership Principles questions run through the whole Amazon front end loop. Amazon\'s FEE page says each interviewer typically asks two or three behavioural questions, and half of the 60-minute phone screen covers the principles. Each question asks for one past situation told in the STAR shape, and the follow-ups dig into its details, its numbers and what you would do differently.',
        'Amazon publishes example questions, and front end accounts from 2019 to 2025 report the same few patterns: a decision between options or without all the data, a disagreement, a deadline, a failure or negative feedback, a customer you went out of your way for, and work beyond your role.',
      ],
      facts: [
        { label: 'Where they come', value: 'Two or three at the start of each loop interview in most accounts; the hiring manager round is often all principles, and in some loops the bar raiser round is too. Phone screens vary: two 2020 screens had no behavioural questions, and a 2025 new-graduate screen spent more than 40 minutes on them.' },
        { label: 'Amazon\'s own examples', value: 'The interview loop page asks about "a problem with multiple possible solutions", a time you took a risk, made a mistake or failed, a project you led, and how you used data to decide. The principles video on the FEE page adds a decision between two technology choices and a decision without all the data.' },
        { label: 'Decisions and ambiguity', value: 'A time you "jumped into a problem and had no idea what was going on", and a time with too few requirements (Seattle, 2020); starting to deliver with few requirements (Medium, 2021); a calculated risk, and short-term against long-term costs (New York, 2020).' },
        { label: 'Conflict and backbone', value: 'A disagreement with a coworker (Seattle, 2019); a conflict with a peer (New York, 2019); disagreement at work (Medium, 2025); something you did without telling your manager, and why (Hyderabad, 2025).' },
        { label: 'Deadlines, failure and feedback', value: 'A tight deadline, followed by how you prioritized (Seattle, 2019); negative feedback, and a time you messed up and what followed (Seattle, 2020); a delivery that was not up to the mark (Medium, 2021); a 15-day deadline for two or three months of work, asked as a hypothetical (Hyderabad, 2025).' },
        { label: 'Customers and ownership', value: 'A time you went out of your way to help a customer urgently, then "what did you do to make sure that never happened again" (Vancouver, 2021); something beyond what was required (Seattle, 2020); work outside your responsibility (Hyderabad, 2025).' },
        { label: 'How the follow-ups work', value: 'Amazon\'s principles worksheet says interviewers dive deep into each example, and the accounts describe follow-ups on the details and the data. One 2019 candidate heard the same questions from the hiring manager and the bar raiser; a 2021 account advises not to reuse a story across rounds.' },
        { label: 'Sources', value: 'Amazon\'s FEE preparation page with its principles video and worksheet, Amazon\'s interview loop page, and front end accounts on LeetCode and Medium from 2019 to 2025; a city and year in brackets mark a LeetCode account. All are listed under Sources below with what each can establish.' },
      ],
      practiceLink: { label: 'Draft your story bank with the STAR stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the Leadership Principles row in the reported process', fragment: 'amazon-interview-process-1-stage-loop-leadership-principles' },
      // The facts above, one question each: Amazon's own examples first, then the accounts.
      drill: {
        note: 'Each question is one of Amazon\'s own examples or one an account reports, asked as one past situation.',
        questions: [
          { id: 'multiple-solutions', text: 'Tell me about a problem with multiple possible solutions.', source: 'Amazon\'s interview loop page' },
          { id: 'mistake', text: 'Tell me about a time you made a mistake or failed.', source: 'Amazon\'s interview loop page' },
          { id: 'without-all-the-data', text: 'Tell me about a decision you made without all the data.', source: 'Amazon\'s principles video' },
          { id: 'disagreement', text: 'Tell me about a disagreement with a coworker.', source: 'Seattle, 2019' },
          { id: 'tight-deadline', text: 'Tell me about a tight deadline. How did you prioritize?', source: 'Seattle, 2019' },
          { id: 'negative-feedback', text: 'Tell me about negative feedback you received, and what followed.', source: 'Seattle, 2020' },
          { id: 'customer', text: 'Tell me about a time you went out of your way to help a customer urgently. What did you do to make sure it never happened again?', source: 'Vancouver, 2021' },
          { id: 'few-requirements', text: 'Tell me about a time you started to deliver with few requirements.', source: 'Medium, 2021' },
          { id: 'beyond-required', text: 'Tell me about something you did beyond what was required.', source: 'Seattle, 2020' },
        ],
        checks: [
          'I can name the Leadership Principle it shows.',
          'I have the data behind each decision ready for the follow-ups.',
          'Another story is ready for this question: Amazon\'s video advises against using the same example every time.',
        ],
      },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the public prompts, not claimed team assignments. The accounts describe seller, retail and media surfaces; choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Seller and operations tools',
        description:
          'Dense, form-heavy screens: address lists, order customisation, tables that page and sort, and modals that switch content.',
        practiceFocus:
          'Derived state for paging and edge controls, props and data modelling, form semantics, keyboard access and validation.',
      },
      {
        title: 'Media and content surfaces',
        description:
          'Image services, carousels, file explorers and listing pages where upload, preview, navigation and nested structure drive the design.',
        practiceFocus:
          'Tree data from flat records, bounded rendering, upload and preview states, and the client-to-API boundary a design round will probe.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Seven Amazon frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Seven Amazon frontend interview practice prompts',
    items: [
      {
        id: 'five-star-rating-vanilla',
        title: 'Build a five-star rating widget in vanilla HTML, CSS and JavaScript',
        statement:
          'Render five grey stars. Hovering or selecting a star turns it and every star below it gold, moving away restores the selection, and the chosen value stays readable by the page.',
        whatThisMeasures:
          'DOM construction without a framework, event delegation, separating hover preview from committed state, and keyboard and screen reader access for a control that is usually mouse-driven.',
        clarifyFirst: [
          'Confirm whether the widget must work without a framework and whether a selected value can be cleared.',
          'Confirm the accessibility expectation: a radio group with labels, or a visual-only control for this round.',
        ],
        strongAnswer: [
          'Keep two numbers, the hovered index and the selected index, and derive each star\'s class from them instead of toggling classes one by one.',
          'Attach one listener to the container and read the star index from the event target, so five stars do not need five handlers.',
          'Expose the value through a hidden input or a radio group so forms and assistive technology can read it.',
          'Reset the hover index on pointer leave, keep the selected index, and test the lower-star rule at both edges.',
        ],
        commonMiss:
          'Mutating classes star by star on every event, so hover and selection fight each other and the lower stars drift out of sync.',
        resourceLabel: 'Practice the star rating widget (Premium)',
        resourcePath: '/react/coding/react-star-rating',
        reportedRound: { label: AMAZON_PHONE_2020_LABEL, url: AMAZON_PHONE_2020_URL },
      },
      {
        id: 'carousel-with-state-follow-ups',
        title: 'Implement a carousel component, then defend its state management',
        statement:
          'Build a carousel that shows one slide at a time with previous and next controls and wraps at the ends, then explain where the current index lives and how else it could be handled.',
        whatThisMeasures:
          'Component state design, index arithmetic with wrap-around, controlled versus uncontrolled components, and the ability to discuss alternatives after the code works.',
        clarifyFirst: [
          'Confirm wrap-around, autoplay and whether the parent needs to control or observe the active slide.',
          'Confirm the slide content: images with alternative text, arbitrary children, or a fixed list.',
        ],
        strongAnswer: [
          'Hold one active index and derive the visible slide, the disabled states and the indicator dots from it.',
          'Compute the next index with modular arithmetic so wrap-around has no special cases.',
          'Offer a controlled mode through an optional prop and a change callback, and say when a reducer or a store would replace local state.',
          'Make the controls real buttons with labels and keep the slide list reachable by keyboard.',
        ],
        commonMiss:
          'Storing the current slide in several places, so the dots, the buttons and the slide disagree after a wrap-around.',
        resourceLabel: 'Practice the image slider (Premium)',
        resourcePath: '/react/coding/react-image-slider',
        reportedRound: { label: AMAZON_LOOP_2020_LABEL, url: AMAZON_LOOP_2020_URL },
      },
      {
        id: 'language-tabs-modal',
        title: 'Recreate a modal with language tabs from an image',
        statement:
          'You are shown a picture of a modal with three tabs labelled English, Spanish and French above a block of text. Clicking a tab switches the text to that language. Build it.',
        whatThisMeasures:
          'Translating a static picture into structure and state, tab semantics, dialog behaviour, and keeping content data separate from presentation.',
        clarifyFirst: [
          'Confirm whether the modal must open and close, trap focus and close on Escape, or whether the tabs alone are the exercise.',
          'Confirm where the translations come from: an inline map, props, or a fetch.',
        ],
        strongAnswer: [
          'Model the content as a map from language code to text and derive the panel from one selected key.',
          'Render the tabs with tablist, tab and tabpanel roles, arrow-key movement and a visible selected state.',
          'If the dialog is in scope, manage focus on open and close and restore it to the trigger.',
          'Keep the layout faithful to the picture with a few deliberate CSS decisions rather than pixel chasing.',
        ],
        commonMiss:
          'Three copies of the panel markup toggled with display rules, so adding a fourth language means copying code again.',
        resourceLabel: 'Practice the tabs switcher (Premium)',
        resourcePath: '/react/coding/react-tabs-switcher',
        reportedRound: { label: AMAZON_LOOP_2020_LABEL, url: AMAZON_LOOP_2020_URL },
      },
      {
        id: 'countdown-timer-in-thirty-minutes',
        title: 'Design and build a countdown timer in thirty minutes',
        statement:
          'After a few CSS questions, build a countdown timer with start, pause and reset that counts down from a user-entered duration and stops at zero. The clock is short, so plan the state first.',
        whatThisMeasures:
          'Pace under a short clock, interval lifecycle and cleanup, deriving display values from a single remaining-time number, and honest handling of the moment the timer reaches zero.',
        clarifyFirst: [
          'Confirm the input unit, the display format and what reset returns to: the entered value or zero.',
          'Confirm whether the timer must survive a re-render or a tab switch, which changes the timing source.',
        ],
        strongAnswer: [
          'Keep the remaining milliseconds and a running flag as state, and derive minutes and seconds in render.',
          'Start one interval when running, clear it when paused, unmounted or at zero, and never let two intervals overlap.',
          'Compute from timestamps rather than decrementing by a fixed tick, so a slow tab does not drift.',
          'Write the state transitions first, show the display working, then polish the controls.',
        ],
        commonMiss:
          'Decrementing a counter inside an interval that is never cleared, so pause stops the display but not the timer and reset starts a second clock.',
        resourceLabel: 'Practice the countdown timer (Premium)',
        resourcePath: '/react/coding/react-countdown-timer',
        reportedRound: { label: AMAZON_LOOP_2020_LABEL, url: AMAZON_LOOP_2020_URL },
      },
      {
        id: 'paginated-address-widget',
        title: 'Code a paginated widget of seller addresses, five per page',
        statement:
          'A seller has a list of shipping addresses. Show them five per page with previous and next controls, disable the controls at the edges, and model the data and props so the page size can change.',
        whatThisMeasures:
          'Derived state for paging, correct edge rules for small and empty lists, data and props modelling, layout with CSS, and tests for the boundaries.',
        clarifyFirst: [
          'Confirm what happens when the list is empty, shorter than a page, or exactly a multiple of the page size.',
          'Confirm whether the page index is owned by the widget or by the parent through the URL.',
        ],
        strongAnswer: [
          'Store only the page index; derive the slice, the page count and the disabled states from the list length and the page size.',
          'Clamp the page index when the list shrinks so a deleted address never leaves an empty page.',
          'Expose the page size and the active page as props with sensible defaults, and key rows by a stable id.',
          'Render the controls as buttons with disabled and aria attributes, and state the current page for assistive technology.',
        ],
        commonMiss:
          'Storing the visible slice in state and recomputing it in event handlers, so the edge rules break when the data changes.',
        resourceLabel: 'Practice the paginated table (Premium)',
        resourcePath: '/react/coding/react-pagination-table',
        reportedRound: { label: AMAZON_VANCOUVER_2022_LABEL, url: AMAZON_VANCOUVER_2022_URL },
      },
      {
        id: 'image-service-frontend-design',
        title: 'Design the frontend of an image service or a restaurant ordering app',
        statement:
          'Design the client for a product such as an image upload and viewing service, or a restaurant listing app where users customise and place orders. Cover the component architecture, the data flow, the API boundary and the failure states.',
        whatThisMeasures:
          'Front-end system design against the objectives Amazon names on its preparation page: usability, performance, user experience, accessibility, security and scalability, plus the ability to describe the API and data boundary when the interviewer probes it.',
        clarifyFirst: [
          'Confirm which journeys matter most and which device and network conditions to design for.',
          'Confirm how deep the backend discussion should go: the accounts show interviewers probing authentication and backend or API design.',
        ],
        strongAnswer: [
          'Start with the user journeys and the screens, then the component tree and where each piece of state lives.',
          'Define the API contract for uploads, listings and orders, including pagination, optimistic updates and retries.',
          'Cover upload progress, preview, validation and failure states for images, or cart state and customisation rules for orders.',
          'Close with accessibility, security such as authentication and content handling, and the performance budget for the main screen.',
        ],
        commonMiss:
          'Spending the hour on database tables and backend calls while the client architecture, the states and the failure handling stay undrawn.',
        resourceLabel: 'Work through the image upload and preview case (Premium)',
        resourcePath: '/system-design/image-upload-preview',
        reportedRound: { label: AMAZON_OFFER_2020_LABEL, url: AMAZON_OFFER_2020_URL },
      },
      {
        id: 'file-explorer-from-ascii-sketch',
        title: 'Build the interface of a file explorer from an ASCII sketch',
        statement:
          'The interviewer describes a tree of entries with nested children using an ASCII diagram. Build a file explorer that renders the tree, expands and collapses folders, and keeps working as the data grows.',
        whatThisMeasures:
          'Decoding an under-specified brief quickly, turning flat or nested data into a tree, recursive rendering with stable keys, expanded-state management, and keyboard access to a tree.',
        clarifyFirst: [
          'Restate the sketch as a data shape before coding: a nested object, or flat rows with parent ids.',
          'Confirm whether folders load their children lazily and whether the expanded state must persist across refreshes.',
        ],
        strongAnswer: [
          'Normalise the input into nodes with ids and child ids, then render recursively from the root.',
          'Keep the expanded ids in a set so toggling one folder re-renders only its subtree.',
          'Use tree and treeitem roles with aria-expanded, and move focus with the arrow keys.',
          'Spend the first two minutes confirming the shape; the 2024 account lost time to a misunderstood sketch.',
        ],
        commonMiss:
          'Coding against the ASCII sketch literally, so the first folder that nests three levels deep breaks the layout.',
        resourceLabel: 'Build a tree from a flat list (free)',
        resourcePath: '/javascript/coding/js-build-tree-from-flat-list',
        reportedRound: { label: AMAZON_SEATTLE_2024_LABEL, url: AMAZON_SEATTLE_2024_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the paginated address widget before writing the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the contract toward the data flow, and say each decision out loud.',
    steps: [
      { title: 'Pin the paging contract', description: 'Page size five, previous and next only, disabled at the edges; decide what an empty list and a partial last page show.' },
      { title: 'Model data and props', description: 'Addresses as an array of objects with stable ids; page size and an optional controlled page index as props.' },
      { title: 'Derive, do not store', description: 'Page count, the visible slice and the disabled states come from the list length and the index; only the index is state.' },
      { title: 'Lay out and test the edges', description: 'A list for the rows, two labelled buttons, then tests for the first page, the last page, a list shorter than a page and an empty list.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Amazon frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Leadership Principles: write ten to fifteen stories with metrics that adapt to any principle, in the STAR structure the official page recommends.', artifact: 'A story bank with two conflict and compromise stories marked.' },
      { day: 'Day 2', focus: 'Vanilla DOM widgets: the star rating and the language tabs without a framework, with event delegation and keyboard access.', artifact: 'Two widgets that work with a mouse and a keyboard.' },
      { day: 'Day 3', focus: 'State-heavy components under a clock: the carousel and the countdown timer, each in thirty minutes with the state written first.', artifact: 'Two components and a note on what you cut when time ran out.' },
      { day: 'Day 4', focus: 'Data widgets: the paginated address list, derived state, props modelling and edge tests.', artifact: 'A paginated list with passing edge tests.' },
      { day: 'Day 5', focus: 'Front-end system design: an image service and an ordering app, judged against usability, performance, accessibility, security and scalability.', artifact: 'Two one-page designs with the API boundary drawn.' },
      { day: 'Day 6', focus: 'Algorithms in JavaScript and browser fundamentals: medium problems on strings, trees and graphs, plus reflow and repaint, the event loop and memory leaks.', artifact: 'Four solved problems and a one-page fundamentals sheet.' },
      { day: 'Day 7', focus: 'Mock loop: four rounds that each open with two Leadership Principles questions, then a widget, an algorithm, a design and a fundamentals conversation.', artifact: 'A list of the questions you will ask the recruiter about language, editor, whiteboard and round order.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Amazon frontend interview preparation questions',
    items: [
      { question: 'Are these the real Amazon questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts and on the loop shape Amazon publishes. The wording, the data and the test cases are ours.' },
      { question: 'How much of the loop is Leadership Principles?', answer: 'Amazon\'s preparation page says half of the phone screen covers the Leadership Principles and that each interviewer asks two or three behavioural questions. Most accounts describe two or three principles questions in every interview, usually first, although the 2020 Seattle and 2024 accounts each had a round that opened with coding. The 2024 account reports thirty minutes of principles in each round.' },
      { question: 'Do front end engineer rounds include algorithm problems?', answer: 'Yes in every account that describes a full loop: coin change, integer and Roman numeral conversion, a dependency search over logs, a binary tree problem, anagrams, a thesaurus class and a graph problem with a topological sort follow-up. The 2020 Seattle account advises splitting preparation evenly between front-end work and data structures.' },
      { question: 'Can I use React, or must it be vanilla JavaScript?', answer: 'The March 2020 phone screen asked for vanilla HTML, CSS and JavaScript; the carousel, the modal tabs and the file explorer were built in React. Amazon\'s page requires syntactically correct code rather than pseudo code. Practise both and confirm the expectation with the recruiter.' },
      { question: 'What does front-end system design mean here?', answer: 'The official page promises at least one front-end system design question judged on usability, performance, user experience, accessibility, security and scalability. The accounts report an image service, a restaurant ordering app, an application\'s component architecture with authentication, and a file browser whose questions drifted to the backend. Prepare the client architecture and the API and data boundary together.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the tree, closure, prototype, timer, list and form skills used by the practice prompts. They are supporting drills, not claimed Amazon questions.',
    items: [
      { label: 'Build a tree from a flat list', description: 'The data step behind a file explorer.', path: '/javascript/coding/js-build-tree-from-flat-list' },
      { label: 'Implement the new operator', description: 'Constructors and prototypes, the follow-up in the 2021 account.', path: '/javascript/coding/js-implement-new' },
      { label: 'Create a counter function', description: 'Closures, asked directly in the October 2021 account.', path: '/javascript/coding/js-create-counter' },
      { label: 'Sleep and delay with a promise', description: 'Timer lifecycle before the countdown timer.', path: '/javascript/coding/js-sleep' },
      { label: 'Todo list with local state', description: 'List rendering and keys before the paginated widget.', path: '/react/coding/react-todo-list' },
      { label: 'Forms and pseudo-classes', description: 'Recreate a form from a picture with semantic markup.', path: '/css/coding/css-forms-pseudoclasses' },
      { label: 'Reflow versus repaint', description: 'A phone screen question in the June 2020 account.', path: '/javascript/trivia/js-repaint-reflow' },
      { label: 'Resilient checkout and payment flow', description: 'A free design case close to the ordering app prompt.', path: '/system-design/resilient-checkout-payment-flow' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: 'Amazon: Front End Engineer interview prep', url: AMAZON_FEE_PREP_URL, note: 'The official loop shape, the design objectives, the whiteboard tool and the coding expectations. It names example design prompts, an Instagram widget, a type-ahead widget, infinite scrolling and a carousel widget, and links a sample coding question, but not the questions asked in interviews.', kind: 'official' },
      { label: 'Amazon: Leadership Principles', url: AMAZON_LEADERSHIP_PRINCIPLES_URL, note: 'The principles behind the behavioural questions in each interview; official context only.', kind: 'official' },
      { label: AMAZON_PHONE_2020_LABEL, url: AMAZON_PHONE_2020_URL, note: 'One self-reported phone screen. It establishes the five-star widget in vanilla HTML, CSS and JavaScript; it cannot establish frequency or current wording.', kind: 'report' },
      { label: AMAZON_LOOP_2020_LABEL, url: AMAZON_LOOP_2020_URL, note: 'One self-reported five-round loop. It establishes the carousel, the language tabs modal, the countdown timer, the CSS questions and two algorithm problems, and it quotes the Leadership Principles questions of each round; it names no exact wording for the technical prompts.', kind: 'report' },
      { label: AMAZON_OFFER_2020_LABEL, url: AMAZON_OFFER_2020_URL, note: 'One self-reported loop with an offer. It establishes the modal screen in the phone screen, a front-end widget, a binary tree problem and the image service design; it names no exact prompt for the final round.', kind: 'report' },
      { label: 'Public report: Amazon front end engineer phone screen, June 2020', url: AMAZON_PHONE_TRIVIA_2020_URL, note: 'One self-reported phone screen with no behavioural questions. It lists eight short technical questions, from block versus inline elements to memory leaks; trivia pages on FrontendAtlas carry no company sources, so these shape the fundamentals day only.', kind: 'report' },
      { label: 'Public report: Amazon frontend onsite rejection, October 2021', url: AMAZON_ONSITE_2021_URL, note: 'One self-reported loop without an offer. It establishes the component architecture design round, the prototype follow-up and the form recreated from a picture, and reports system design as the stated reason for the rejection.', kind: 'report' },
      { label: AMAZON_VANCOUVER_2022_LABEL, url: AMAZON_VANCOUVER_2022_URL, note: 'One self-reported loop with an offer. It establishes the paginated address widget, the restaurant ordering app design and the thesaurus class, and that each session opened with two or three Leadership Principles.', kind: 'report' },
      { label: AMAZON_SEATTLE_2024_LABEL, url: AMAZON_SEATTLE_2024_URL, note: 'One self-reported loop without an offer. It establishes the file explorer interface, the anagram problem, the file browser design and the unit testing round, and reports thirty minutes of Leadership Principles per round.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer I, India, January 2025', url: AMAZON_INDIA_2025_URL, note: 'One self-reported process for a junior role in India. It establishes an online assessment with one coding question and multiple-choice questions, a frontend assignment, two data structure problems and a screen recreated with HTML and CSS; the format differs from the US accounts.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer I assessment, phone screen and loop, 2022', url: AMAZON_BLIND_2022_URL, note: 'One self-reported loop on Blind. It establishes the round shape for a junior role: a component implementation, an API from a frontend library, a graph problem and a design question with the hiring manager; it names no exact prompt.', kind: 'report' },
      { label: 'Amazon: Interview loop', url: AMAZON_INTERVIEW_LOOP_URL, note: 'The general loop page for every role. It lists five example behavioural questions, describes the Bar Raiser and gives about 45 minutes to an hour per interviewer; it is not specific to front end engineers.', kind: 'official' },
      { label: 'Amazon: Leadership Principles video, linked from the FEE preparation page', url: AMAZON_LP_VIDEO_URL, note: 'An Amazon software development manager explains the behavioural questions. The transcript gives two examples, a decision between two technology choices and a decision without all the data, and advises against using the same example every time.', kind: 'official' },
      { label: 'Amazon: Leadership Principles STAR worksheet, linked from the FEE preparation page', url: AMAZON_LP_WORKSHEET_URL, note: 'A worksheet that lists the sixteen principles and says interviewers will dive deep into each example with follow-up questions; it gives no example questions.', kind: 'official' },
      { label: 'Public report: Amazon front end engineer loop, Seattle, July 2019', url: AMAZON_HM_2019_URL, note: 'One self-reported loop without an offer, which the poster puts down to the behavioural rounds. It quotes the hiring manager\'s questions on a tight deadline and a disagreement with a coworker, and reports that the bar raiser asked the same questions again.', kind: 'report' },
      { label: 'Public report: Amazon front end engineer loop, New York, June 2019', url: AMAZON_NYC_2019_URL, note: 'One self-reported loop that lists one or two principles questions per round in the poster\'s shorthand, from a conflict with a peer to a failure to deliver; it gives topics more than exact wording.', kind: 'report' },
      { label: 'Public report: Amazon L5 front end engineer loop, New York, May 2020', url: AMAZON_L5_NYC_2020_URL, note: 'One self-reported loop. It quotes a calculated-risk question and a question on short-term against long-term costs, and reports about thirty minutes of behavioural questions per round.', kind: 'report' },
      { label: 'Public report: Amazon front end engineer loop, Vancouver, December 2021', url: AMAZON_CUSTOMER_2021_URL, note: 'One self-reported loop. It quotes a question about helping a customer urgently, which the poster read as Customer Obsession, and the follow-up about preventing a repeat.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer I loop, Hyderabad, 2025', url: AMAZON_FEE_I_2025_URL, note: 'One self-reported loop that ended in a selection after a move from SDE to Front End Engineer I. It quotes deadline, ownership and manager questions and a hypothetical about a deadline far shorter than the work.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer graduate phone screen, Dublin, August 2025', url: AMAZON_GRAD_SCREEN_2025_URL, note: 'One self-reported new-graduate screen that spent more than forty minutes on principles questions in the STAR shape and asked no front end questions.', kind: 'report' },
      { label: 'Public report: Medium frontend engineer phone round, July 2021', url: AMAZON_MEDIUM_2021_URL, note: 'One self-reported phone round. It quotes three principles questions: delivering with few requirements, a delivery that was not up to the mark, and acting on requirements without the team\'s approval.', kind: 'report' },
      { label: 'Public report: Medium frontend developer loop, 2025', url: AMAZON_MEDIUM_2025_URL, note: 'One self-reported loop without an offer, posted in August 2025. It quotes three behavioural questions, among them how you handle disagreement at work; the interview year is not stated.', kind: 'report' },
      { label: 'LeetCode Discuss: community list of front end interview questions, July 2020', url: AMAZON_LIST_2020_URL, note: 'A secondhand list compiled by one candidate. It tags custom map, reduce, filter and sort, an accordion and a grid with search and sort as Amazon questions; it cannot establish wording or frequency.', kind: 'report' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Amazon practice set',
    copy:
      'Premium unlocks the star rating, carousel, tabs, countdown timer and pagination exercises in React, Angular and Vue, the image upload case and the broader company-tagged editorial set.',
    buttonLabel: 'Unlock the full Amazon practice set',
    src: 'company_preview_amazon',
  },
  about: [
    'Amazon front end engineer interview preparation',
    'Vanilla JavaScript UI widgets',
    'Paginated and stateful React components',
    'Front-end system design for image and ordering products',
    'Leadership Principles behavioural rounds',
  ],
  indexAnchorLabel: 'Amazon frontend interview questions',
};
