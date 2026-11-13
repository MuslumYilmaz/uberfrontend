import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Amazon frontend interview guide. The reported questions live with the process table (company-interview-processes.ts);
 * the seven prompts here are the answer guides of its widget, design and file explorer rows. The questions come from
 * front end candidates' own posts on LeetCode Discuss, Blind and Medium (2019 to 2025) and one community list from
 * July 2020; the loop shape comes from Amazon's own Front End Engineer preparation page. Nothing here is a leaked,
 * confirmed or official Amazon question, and no US technical account is newer than October 2024.
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

export const AMAZON_PREVIEW_TITLE = 'Amazon Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const AMAZON_PREVIEW_H1 = 'Amazon Frontend Interview Questions';
export const AMAZON_PREVIEW_DESCRIPTION =
  'Amazon front end engineer interview: the assessment, phone screen and loop explained, {#questions} reported questions and the Leadership Principles questions asked.';
export const AMAZON_PREVIEW_CANONICAL_PATH = '/companies/amazon/preview';
export const AMAZON_PREVIEW_TRUST_NOTE =
  'The questions come from front end candidates\' own posts on LeetCode Discuss, Blind and Medium between 2019 and 2025, and from one community list on LeetCode, rewritten in our words; Amazon has not confirmed any of them. FrontendAtlas wrote the answer outlines and chose the practice tasks. Amazon publishes the shape of the Front End Engineer loop on its own preparation page, and the material your recruiter sends outranks both.';

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
      'Amazon\'s preparation page sets out the Front End Engineer loop: an online assessment, a 60-minute phone screen split between Leadership Principles and front-end coding, then four 55-minute interviews. Front end candidates\' accounts from 2019 to 2025 show how each round ran, and below the table are the {questions} questions they reported, starting with an open phone-screen widget from 2020.',
    caveat:
      'Most questions come from candidates\' posts about interviews from 2020 to 2022; the newest technical account is a January 2025 Front End Engineer I loop in India. The behavioural questions come from the same kind of posts and stay open.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2019–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Amazon front end loops reward: a working widget early, and a story for every principle',
    paragraphs: [
      'Amazon publishes more of this loop than most companies: two JavaScript questions in the assessment, a phone screen split between Leadership Principles and front-end coding, then four 55-minute interviews with at least one front-end system design question. The accounts fill in the coding halves. Phone screens asked for a star rating widget in vanilla JavaScript, a carousel followed by questions on its state, a modal to a set of requirements, and in one 2020 screen eight rapid questions on fundamentals, from reflow and repaint to memory leaks. Loop coding rounds asked for language tabs in a modal, a countdown timer, a paginated address list, a form built from a picture in HTML, a given screen rebuilt in HTML and CSS, a file explorer drawn as an ASCII sketch and a thesaurus class, beside algorithm problems such as Roman numeral conversion, a dependency search over referral logs and finding anagrams. Design rounds covered an image service, a restaurant ordering app, an application\'s component architecture and a web file browser.',
      'Two lessons repeat. Most interviews open with two or three Leadership Principles questions, so ten to fifteen stories with numbers that adapt to several principles are the cheapest preparation available; the 2022 Vancouver candidate prepared that way and kept separate stories for conflict and compromise. And the coding half is short: the 2020 Seattle candidate could not finish the countdown timer in thirty minutes, and the 2024 candidate lost time decoding the ASCII sketch, so restate the task as data and state in the first minute and show working behaviour early. Five of the seven loop accounts that describe their coding rounds also name algorithm problems, and the 2020 Seattle candidate wished they had split preparation evenly between front-end work and data structures.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What Amazon\'s page fixes, what candidates add, and the gap after 2024',
    paragraphs: [
      'Amazon\'s Front End Engineer preparation page fixes the loop shape, the rule that code must be syntactically correct rather than pseudo code, and the six objectives it lists for a design answer: usability, performance, user experience, accessibility, security and scalability. Its interview loop page, principles video and worksheet describe the behavioural questions and their follow-ups. The technical questions come from candidates\' own posts: loops from 2020 to 2024, most of them Front End Engineer II in Seattle or Vancouver, two phone screens from 2020, Front End Engineer I loops from 2022 and from India in 2025, and a community list from July 2020 that tags three items as Amazon questions. The Leadership Principles questions add loops from Seattle and New York in 2019 and 2020, Vancouver in 2021, Hyderabad in 2025 and two posts on Medium.',
      'No US technical account is newer than October 2024. The other 2025 accounts, a Hyderabad loop and a Dublin new-graduate phone screen, report Leadership Principles questions only, so whether the 2026 loop keeps this mix is not known. Ask the recruiter which language, editor and framework the coding rounds allow, and whether your design round is a frontend one: one 2024 design round began as a backend question.',
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
        { label: 'Where they come', value: 'Two or three at the start of each loop interview in most accounts; the hiring manager round is often all principles, and in some loops the bar raiser round is too. Phone screens vary: a 2020 screen had no behavioural questions, and a 2025 new-graduate screen spent more than 40 minutes on them.' },
        { label: 'Amazon\'s own examples', value: 'The interview loop page asks about "a problem with multiple possible solutions", a time you took a risk, made a mistake or failed, a project you led, and how you used data to decide. The principles video on the FEE page adds a decision between two technology choices and a decision without all the data.' },
        { label: 'Decisions and ambiguity', value: 'A time you "jumped into a problem and had no idea what was going on", and a time with too few requirements (Seattle, 2020); starting to deliver with few requirements (Medium, 2021); a calculated risk, and short-term against long-term costs (New York, 2020).' },
        { label: 'Conflict and backbone', value: 'A disagreement with a coworker (Seattle, 2019); a conflict with a peer (New York, 2019); disagreement at work (Medium, 2025); something you did without telling your manager, and why (Hyderabad, 2025).' },
        { label: 'Deadlines, failure and feedback', value: 'A tight deadline, followed by how you prioritized (Seattle, 2019); negative feedback, and a time you messed up and what followed (Seattle, 2020); a delivery that was not up to the mark (Medium, 2021); a 15-day deadline for two or three months of work, asked as a hypothetical (Hyderabad, 2025).' },
        { label: 'Customers and ownership', value: 'A time you went out of your way to help a customer urgently, then "what did you do to make sure that never happened again" (Vancouver, 2021); something beyond what was required (Seattle, 2020); work outside your responsibility (Hyderabad, 2025).' },
        { label: 'How the follow-ups work', value: 'Amazon\'s principles worksheet says interviewers dive deep into each example, and the accounts describe follow-ups on the details and the data. One 2019 candidate heard the same questions from the hiring manager and the bar raiser; a 2021 account advises not to reuse a story across rounds.' },
        { label: 'Sources', value: 'Amazon\'s FEE preparation page with its principles video and worksheet, its interview loop page, and front end accounts on LeetCode and Medium from 2019 to 2025. A city and year in brackets mark a LeetCode account; every one of them is in the source list that closes the page.' },
      ],
      practiceLink: { label: 'Draft your story bank with the STAR stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the Leadership Principles row in the reported process', fragment: 'amazon-interview-process-1-stage-loop-leadership-principles' },
      // The facts above, one question each: Amazon's own examples first, then the accounts.
      drill: {
        note: 'Each question is one of Amazon\'s own examples or one an account reports; the last is a hypothetical, as the 2025 account asked it.',
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
          { id: 'without-telling-manager', text: 'Tell me about something you did without telling your manager, and why.', source: 'Hyderabad, 2025' },
          { id: 'fifteen-days', text: 'You have 15 days for two or three months of work. What do you do?', source: 'Hyderabad, 2025', kind: 'approach' },
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
    title: 'Seller screens and file or media surfaces: the two contexts in the accounts',
    intro:
      'The reported tasks sit on two kinds of Amazon surface: screens a seller or a customer works through, and surfaces built around images and files. Only the March 2020 phone screen names a team, an AWS one, so neither lens is a claim about where you would work.',
    items: [
      {
        title: 'Seller and ordering screens',
        description:
          'The 2022 Vancouver loop\'s address list for a seller and its restaurant ordering design, and the 2020 modal whose tabs switch the language of its text: dense screens where paging, options and switching content drive the state.',
        practiceFocus:
          'Derived state for paging and edge controls, props and data modelling, form semantics, keyboard access and validation.',
      },
      {
        title: 'Media and file surfaces',
        description:
          'The 2020 image service design, the 2024 file explorer and web file browser, and the carousel from a 2020 phone screen: surfaces where upload, preview, nesting and navigation drive the design.',
        practiceFocus:
          'Tree data from flat records, bounded rendering, upload and preview states, and the client-to-API boundary a design round will probe.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides behind the Amazon question list',
    intro:
      'Each guide belongs to a widget, design or file explorer row of the Amazon list, from the 2020 phone screens to the 2024 Seattle loop.',
    itemListName: 'Amazon answer guides',
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
          'Build a carousel that shows one slide at a time with previous and next controls, then explain where the current index lives and how else it could be handled. Settle what happens at the last slide before coding: the carousel either wraps round to the first slide or stops there with next disabled, as the practice task does.',
        whatThisMeasures:
          'Component state design, index arithmetic at both ends of the list, controlled versus uncontrolled components, and the ability to discuss alternatives after the code works.',
        clarifyFirst: [
          'Confirm what the ends do, wrap round to the other end or stop with the control disabled, then ask about autoplay and whether the parent needs to control or observe the active slide.',
          'Confirm the slide content: images with alternative text, arbitrary children, or a fixed list.',
        ],
        strongAnswer: [
          'Hold one active index and derive the visible slide, the indicator dots and any disabled control from it.',
          'For a carousel that wraps, compute the next index with modular arithmetic so the ends need no special case; for one that stops, clamp the index and disable previous on the first slide and next on the last.',
          'Offer a controlled mode through an optional prop and a change callback, and say when a reducer or a store would replace local state.',
          'Make the controls real buttons with labels and keep the slide list reachable by keyboard.',
        ],
        commonMiss:
          'Storing the current slide in several places, so the dots, the buttons and the slide disagree at the first or last slide.',
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
        resourceLabel: 'Practice the file explorer tree (Premium)',
        resourcePath: '/react/coding/react-file-explorer',
        reportedRound: { label: AMAZON_SEATTLE_2024_LABEL, url: AMAZON_SEATTLE_2024_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope a coding-round component before writing the first line',
    intro:
      'A worked start on one reported coding-round question, in the order the 2022 Vancouver interviewer steered the candidate: four decisions said out loud before any code.',
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
    intro: 'Seven days in the order Amazon runs its process: stories first, because most rounds open with them, then the assessment, the phone screen, the loop\'s coding and design hours, and a mock loop.',
    days: [
      { day: 'Day 1', focus: 'Leadership Principles: ten to fifteen stories with numbers that adapt to several principles, told in the STAR shape Amazon\'s page recommends, with a second story ready for each pattern.', artifact: 'A story bank with the conflict and failure stories marked.' },
      { day: 'Day 2', focus: 'Online assessment: two coding problems in JavaScript inside 90 minutes, each one compiling, then the system design scenarios and the work style survey.', artifact: 'A timed run in which every solution compiles.' },
      { day: 'Day 3', focus: 'Phone screen: half an hour of Leadership Principles, then half an hour building the open question\'s star rating widget in plain HTML, CSS and JavaScript.', artifact: 'The widget working by mouse and by keyboard.' },
      { day: 'Day 4', focus: 'Interface hours: two widgets built live against the clock, the state written down before any markup, once in React and once without a framework.', artifact: 'Two widgets and a note on what you cut when time ran short.' },
      { day: 'Day 5', focus: 'Algorithms: easy to medium problems in the language you will use, talked through aloud; five of the seven loop accounts that describe their coding rounds name at least one.', artifact: 'Four solved problems with their complexity stated before the code.' },
      { day: 'Day 6', focus: 'Front-end system design: one product drawn on a shared whiteboard and checked against usability, performance, user experience, accessibility, security and scalability.', artifact: 'A one-page design with the contract between client and server written out.' },
      { day: 'Day 7', focus: 'Mock loop: four 55-minute rounds, each opening with two Leadership Principles questions, one of them a design round.', artifact: 'Your questions for the recruiter: the language, the editor, whether React is allowed, and the round order.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Amazon frontend interview preparation questions',
    items: [
      { question: 'Are these the real Amazon questions?', answer: 'They are questions front end candidates said they were asked, from their own posts on LeetCode Discuss, Blind and Medium, plus three items a 2020 community list on LeetCode tags as Amazon questions, written here in our words. Amazon has not confirmed any of them, and each technical question rests on one account.' },
      { question: 'What is on the online assessment?', answer: 'Amazon\'s page lists two coding questions in JavaScript in 90 minutes, 20 minutes of system design scenarios and an 8-minute work style survey on the Leadership Principles, and says the code must compile for every question. Accounts from 2020 and 2022 had two LeetCode-medium problems; a January 2025 Front End Engineer I candidate in India took a Mettl test with one coding question and multiple-choice questions, then a frontend assignment.' },
      { question: 'How much of the loop is Leadership Principles?', answer: 'Amazon\'s preparation page says half of the phone screen covers the Leadership Principles and that each interviewer asks two or three behavioural questions. Most accounts describe two or three principles questions in every interview, usually first, although the 2020 Seattle and 2024 accounts each had a round that opened with coding. The 2024 account reports thirty minutes of principles in each round.' },
      { question: 'Do front end engineer rounds include algorithm problems?', answer: 'Usually. Five of the seven loop accounts that describe their coding rounds name one or two problems of easy to medium difficulty, written in JavaScript or, in one 2024 loop, Python. The 2021 onsite and the 2022 Vancouver accounts name no algorithm problem, and the 2025 Hyderabad account reports only its principles questions. The 2020 Seattle candidate advises splitting preparation evenly between front-end work and data structures, and the 2025 India candidate\'s takeaway was that data structures still matter for frontend roles.' },
      { question: 'Can I use React, or must it be vanilla JavaScript?', answer: 'The open 2020 phone-screen question asked for vanilla HTML, CSS and JavaScript. In other accounts candidates built their interface rounds in React, and Amazon\'s page asks for syntactically correct code rather than pseudo code. Practise both and ask the recruiter which your loop expects.' },
      { question: 'What does front-end system design mean here?', answer: 'Amazon\'s page promises at least one front-end system design question, drawn on Bluescape, the whiteboard Amazon links, with six objectives listed: usability, performance, user experience, accessibility, security and scalability; you define the contract between the front end and the back end but are not expected to design the back-end API. In the accounts it took one loop interview: the hiring manager ran it in a 2022 Front End Engineer I loop, a 2021 candidate\'s rejection feedback named it, and one 2024 round began as a backend question.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the skills Amazon\'s rounds draw on',
    intro:
      'Free tasks for what the rounds and Amazon\'s own page ask for: the page names a type-ahead widget and infinite scrolling among its example design prompts. None of these is a question from the list above.',
    items: [
      { label: 'Autocomplete search bar', description: 'A type-ahead widget, one of the example prompts on Amazon\'s FEE page.', path: '/react/coding/react-autocomplete-search-starter' },
      { label: 'Design an infinite scrolling list', description: 'Infinite scrolling, another FEE page example, as a free design case.', path: '/system-design/infinite-scroll-list' },
      { label: 'Build a tree from a flat list', description: 'Turn flat records into nested data, then walk it.', path: '/javascript/coding/js-build-tree-from-flat-list' },
      { label: 'Todo list with local state', description: 'List rendering, keys and local state in React.', path: '/react/coding/react-todo-list' },
      { label: 'Sleep and delay with a promise', description: 'A promise that resolves after a delay, in plain JavaScript.', path: '/javascript/coding/js-sleep' },
      { label: 'Behavioral stories', description: 'A structure for the STAR stories the Leadership Principles questions ask for.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'Amazon\'s own pages for the loop shape, then the candidates\' posts behind the question list, each with what it describes.',
    items: [
      { label: 'Amazon: Front End Engineer interview prep', url: AMAZON_FEE_PREP_URL, note: 'The official loop shape: an online assessment, a 60-minute phone screen split between Leadership Principles and front-end coding, and four 55-minute loop interviews with at least one front-end system design question. It names example design prompts, an Instagram widget, a type-ahead widget, infinite scrolling and a carousel widget, links a sample coding question, and asks for JavaScript in the online assessment; it lists no questions from real interviews.', kind: 'official' },
      { label: 'Amazon: Leadership Principles', url: AMAZON_LEADERSHIP_PRINCIPLES_URL, note: 'The sixteen principles behind the behavioural questions; it gives no interview questions.', kind: 'official' },
      { label: AMAZON_PHONE_2020_LABEL, url: AMAZON_PHONE_2020_URL, note: 'One Front End Engineer II phone screen for an AWS team. The poster says FEE interviews used different material from SDE ones, whatever the recruiter said; its task is the open question at the top of the list.', kind: 'report' },
      { label: AMAZON_LOOP_2020_LABEL, url: AMAZON_LOOP_2020_URL, note: 'A Front End Engineer II candidate with three years\' experience: a one-hour phone screen with a front end engineer, two Leadership Principles questions and two technical ones, then five virtual rounds, four mixing technical work with the principles and one all principles with the hiring manager. The poster expected a rejection.', kind: 'report' },
      { label: AMAZON_OFFER_2020_LABEL, url: AMAZON_OFFER_2020_URL, note: 'A Front End Engineer II offer: an assessment of two LeetCode-medium problems, a coding interview with a development manager, then five virtual rounds: a hiring manager round of principles only that ended at the 30-minute mark, two front-end rounds, an algorithm round and a system design round, most with two principles questions.', kind: 'report' },
      { label: 'Public report: Amazon front end engineer phone screen, June 2020', url: AMAZON_PHONE_TRIVIA_2020_URL, note: 'A phone screen for Front End Engineer I or II with no behavioural questions: eight short technical questions, seven of them on web fundamentals and one an algorithm. Rejected.', kind: 'report' },
      { label: 'Public report: Amazon frontend onsite rejection, October 2021', url: AMAZON_ONSITE_2021_URL, note: 'A rejection after five interviews: a system design round, two coding rounds with principles questions, a behavioural bar raiser and a front-end round. The feedback named system design; the poster prepared about fifteen principles stories.', kind: 'report' },
      { label: AMAZON_VANCOUVER_2022_LABEL, url: AMAZON_VANCOUVER_2022_URL, note: 'A Front End Engineer II (L5) offer after five virtual rounds: front-end coding, system design, an object-oriented design round, a bar raiser and a hiring manager round of principles only. Every session opened with two or three principles questions.', kind: 'report' },
      { label: AMAZON_SEATTLE_2024_LABEL, url: AMAZON_SEATTLE_2024_URL, note: 'A Front End Engineer II (L5) rejection after four virtual rounds, each with 30 minutes of principles: two coding rounds, a system design round that turned to backend questions, and a probable bar raiser with a coding task. React and Python were allowed; the poster felt the loop wanted an SDE with some frontend experience.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer I, India, January 2025', url: AMAZON_INDIA_2025_URL, note: 'An ex-intern contacted about an SDE role who applied for Front End Engineer I: a Mettl test with one coding question and multiple-choice questions on computer science topics, a frontend assignment, then a data structures round and a frontend round. Rejected.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer I assessment, phone screen and loop, 2022', url: AMAZON_BLIND_2022_URL, note: 'A Front End Engineer I candidate with two years\' experience, posted January 2023: an assessment of two LeetCode-medium problems, a phone screen of two principles questions and LeetCode-style coding, two frontend whiteboarding rounds, an algorithm round, and a hiring manager round of frontend system design with three principles questions.', kind: 'report' },
      { label: 'LeetCode Discuss: community list of front end interview questions, July 2020', url: AMAZON_LIST_2020_URL, note: 'A list one candidate started in July 2020 for others to add to. It tags three items as Amazon phone or onsite questions; it cannot establish wording, year or frequency.', kind: 'report' },
      { label: 'Amazon: Interview loop', url: AMAZON_INTERVIEW_LOOP_URL, note: 'The general loop page for every role. It lists five example behavioural questions, describes the Bar Raiser and gives about 45 minutes to an hour per interviewer; it is not specific to front end engineers.', kind: 'official' },
      { label: 'Amazon: Leadership Principles video, linked from the FEE preparation page', url: AMAZON_LP_VIDEO_URL, note: 'An Amazon software development manager explains the behavioural questions. The transcript gives two examples, a decision between two technology choices and a decision without all the data, and advises against using the same example every time.', kind: 'official' },
      { label: 'Amazon: Leadership Principles STAR worksheet, linked from the FEE preparation page', url: AMAZON_LP_WORKSHEET_URL, note: 'A worksheet that lists the sixteen principles and says interviewers will dive deep into each example with follow-up questions; it gives no example questions.', kind: 'official' },
      { label: 'Public report: Amazon front end engineer loop, Seattle, July 2019', url: AMAZON_HM_2019_URL, note: 'A loop without an offer, which the poster puts down to the behavioural rounds. The hiring manager round was all behavioural, and the bar raiser asked the same questions again.', kind: 'report' },
      { label: 'Public report: Amazon front end engineer loop, New York, June 2019', url: AMAZON_NYC_2019_URL, note: 'A loop with one or two principles questions per round, written in the poster\'s shorthand, and "Why Amazon" from the bar raiser.', kind: 'report' },
      { label: 'Public report: Amazon L5 front end engineer loop, New York, May 2020', url: AMAZON_L5_NYC_2020_URL, note: 'An L5 loop with about thirty minutes of behavioural questions per round, three of them quoted.', kind: 'report' },
      { label: 'Public report: Amazon front end engineer loop, Vancouver, December 2021', url: AMAZON_CUSTOMER_2021_URL, note: 'A loop that quotes one customer question, which the poster read as Customer Obsession, and its follow-up.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer I loop, Hyderabad, 2025', url: AMAZON_FEE_I_2025_URL, note: 'A candidate moved from SDE I to Front End Engineer I after three rounds and selected. One round was a full hour of principles questions with many follow-ups.', kind: 'report' },
      { label: 'Public report: Amazon Front End Engineer graduate phone screen, Dublin, August 2025', url: AMAZON_GRAD_SCREEN_2025_URL, note: 'A new-graduate screen that spent more than forty minutes on principles questions in the STAR shape and asked no front end questions.', kind: 'report' },
      { label: 'Public report: Medium frontend engineer phone round, July 2021', url: AMAZON_MEDIUM_2021_URL, note: 'A phone round on Amazon Chime that quotes three principles questions.', kind: 'report' },
      { label: 'Public report: Medium frontend developer loop, 2025', url: AMAZON_MEDIUM_2025_URL, note: 'A loop without an offer, posted in August 2025, that quotes three behavioural questions; the interview year is not stated.', kind: 'report' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Amazon practice set',
    copy:
      'Premium opens every reported question with its wording, follow-ups, practice task and answer guide, plus the study priorities, the walkthrough and the full preparation plan.',
    buttonLabel: 'Unlock the full Amazon practice set',
    src: 'company_preview_amazon',
  },
  about: [
    'Amazon front end engineer interview preparation',
    'Amazon online assessment and phone screen',
    'Front-end system design at Amazon',
    'Leadership Principles behavioural questions',
  ],
  indexAnchorLabel: 'Amazon frontend interview questions',
};
