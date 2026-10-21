import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * xAI (now SpaceXAI) frontend interview guide. Every prompt is a FrontendAtlas practice version modelled
 * on one public London interview account (Taro, August 2025) and on the stage lists in closed official
 * frontend postings (March 2025 to February 2026). Nothing here is a leaked, confirmed or official xAI
 * question, and one account plus closed postings cannot establish the current loop.
 */
const XAI_LONDON_REPORT_URL =
  'https://www.jointaro.com/interviews/companies/xai/experiences/frontend-engineer-london-england-august-13-2025-no-offer-positive-45b410e6/';
const XAI_LONDON_REPORT_LABEL = 'Public report: xAI Frontend Engineer interview account, London, on Taro, August 2025';
const XAI_SPECIALIST_REPORT_URL =
  'https://www.jointaro.com/interviews/companies/xai/experiences/software-engineer-specialist-yerevan-yerevan-august-1-2025-accepted-offer-negative-c940c932/';
const XAI_SPECIALIST_REPORT_LABEL = 'Public report: xAI Software Engineer Specialist interview account on Taro, August 2025';
const XAI_MTS_REPORT_URL = 'https://www.aced.io/experiences/x-ai-software-engineer-interview-7fbd12';
const XAI_MTS_REPORT_LABEL = 'Public report: xAI Member of Technical Staff (L3) interview account on Aced, December 2025';
const XAI_GROK_API_POSTING_URL = 'https://builtin.com/job/react-frontend-engineer-grokcom-api/4446453';
const XAI_GROK_API_POSTING_LABEL = 'Official posting: xAI React Frontend Engineer, grok.com & API, Built In, January 2026';
const XAI_ENTERPRISE_POSTING_URL = 'https://builtin.com/job/frontend-engineer-enterprise/7383404';
const XAI_ENTERPRISE_POSTING_LABEL = 'Official posting: xAI Frontend Engineer, Enterprise, Built In, February 2026';
const XAI_GROK_STUDIO_POSTING_URL = 'https://jobs.8vc.com/companies/x-ai/jobs/48336005-senior-frontend-engineer-grok-studio';
const XAI_GROK_STUDIO_POSTING_LABEL = 'Official posting: xAI Senior Frontend Engineer, Grok Studio (Agents UX), 8VC job board, April 2025';
const XAI_LONDON_POSTING_URL = 'https://www.builtinlondon.uk/job/frontend-engineer/7805551';
const XAI_LONDON_POSTING_LABEL = 'Official posting: xAI Frontend Engineer, London, Built In London, February 2026';
const XAI_CAREERS_URL = 'https://x.ai/careers';
const XAI_MERGER_NEWS_URL = 'https://driveteslacanada.ca/news/spacex-completes-merger-with-xai/';
const XAI_REBRAND_NEWS_URL = 'https://www.freepressjournal.in/tech/elon-musks-xai-rebrands-to-spacexai-unveils-new-logo';

export const XAI_PREVIEW_TITLE = 'xAI (now SpaceXAI) Frontend Interview Questions: 4 Prompts + Guide';
export const XAI_PREVIEW_H1 = 'xAI (now SpaceXAI) Frontend Interview Questions';
export const XAI_PREVIEW_DESCRIPTION =
  'Prepare for an xAI (SpaceXAI) frontend interview with 4 practice prompts modelled on public postings and reports: chat UI, TS app, CSS screenshot, AI composer.';
export const XAI_PREVIEW_CANONICAL_PATH = '/companies/xai/preview';
export const XAI_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports and official postings, not leaked, confirmed or official xAI questions. One London account and closed postings cannot establish the current loop; use the material your interviewers provide as the source of truth.';

export const XAI_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'xai',
  label: 'xAI',
  title: XAI_PREVIEW_TITLE,
  h1: XAI_PREVIEW_H1,
  description: XAI_PREVIEW_DESCRIPTION,
  canonicalPath: XAI_PREVIEW_CANONICAL_PATH,
  trustNote: XAI_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public xAI prep guide',
    subtitle:
      'Prepare with four practice prompts shaped by one public London account and the stage lists in closed official postings: a chat interface built in React during a one-hour pairing session, a small React app written in TypeScript, a UI implemented from a screenshot in HTML and CSS, and the composer and streaming turn of a grok.com-style chat product.',
    caveat:
      'xAI merged into SpaceX (the merger closed on 2 February 2026) and rebranded as SpaceXAI in July 2026; on 21 October 2026 the careers page title read SpaceXSI and the job board still lived at the xai slug. The frontend postings that described a loop were removed between June 2025 and February 2026, so the loop below describes 2025 to early 2026. This guide does not claim access to private interview material, a fixed format, or the stack of every team.',
    chips: ['4 practice prompts', 'React, TypeScript, HTML/CSS, AI chat design', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not xAI trivia',
    paragraphs: [
      'The public pages reward engineers who ship a working slice under a clock while explaining it: a small React app in TypeScript that handles its loading and failure states, a layout rebuilt from a screenshot that still reflows, a chat interface that can send, show a reply arriving and stop it. The one London account adds React questions asked in passing, such as what useCallback does, so each hook you use should come with a one-sentence reason. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'Treat the postings as a shape, not a script. The closed London posting gave 45 minutes each to a React round and an HTML/CSS/Tailwind round; the Bay Area postings described a coding assessment in a language of your choice, one or two React/TypeScript interviews and a "Meet the Team" session where you present past exceptional work. Practise the timed builds first, then rehearse the ten-minute story of work you are proud of, because the application itself asks for a "statement of exceptional work".',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public pages establish, and what you still need to confirm',
    paragraphs: [
      'Three public interview reports read in full inform this guide: one London Frontend Engineer account on Taro (August 2025) describing a 15-minute phone interview and a one-hour pair-coding session building a chat interface in React; one "Software Engineer Specialist" account with JavaScript and React interviews after a CodeSignal assessment, a title that looks like a separate track from the product frontend teams; and one general Member of Technical Staff account on Aced (December 2025) with a four-hour take-home. Two Bay Area frontend onsite accounts sit behind a login wall and only confirm that more accounts exist. The stage lists come from closed official postings for London and Bay Area frontend roles between March 2025 and February 2026, and the careers page read on 21 October 2026 keeps four generic steps.',
      'These pages establish that those rounds and stages were described; they do not establish exact wording, the current format after the merger, or how each team interviews now. On 21 October 2026 the job board at the xai slug listed one frontend-titled opening and no engineering posting with an interview section. Confirm the exercise types, the allowed tools, the expected stack and the timing with whoever runs your process; the careers page says engineers, not recruiters, evaluate applications.',
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Four xAI frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report or official posting it is modelled on and to a runnable practice page; the fourth prompt is modelled on the reported chat-interface round plus the product domain and carries no account of a design round.',
    itemListName: 'Four xAI frontend interview practice prompts',
    items: [
      {
        id: 'react-chat-interface-pairing',
        title: 'Build a chat interface in React during a one-hour pairing session',
        statement:
          'One London account describes a one-hour pair-coding session: build a chat interface in React while an engineer from the team reviews the code live, with React questions along the way such as what useCallback does. Practise the same shape: a message list, a composer, a status per message, and an assistant reply that renders as it arrives.',
        whatThisMeasures:
          'Scoping under a clock, component and state boundaries, controlled inputs and list rendering, explaining hooks while typing, and taking live review without losing the thread.',
        clarifyFirst: [
          'Confirm whether the reply arrives at once or as a stream, whether a mock is acceptable, and what the interviewer wants to see working first.',
          'Confirm the setup: TypeScript or JavaScript, any starter code, and whether styling matters inside the hour.',
        ],
        strongAnswer: [
          'Say the plan before coding: one messages array as the source of truth, a composer with a controlled value, and a status per message (sending, sent, failed).',
          'Render the list from state, key each item by a stable id, and keep the scroll pinned to the latest message until the reader scrolls up.',
          'Explain each hook as you use it: useCallback keeps a stable handler reference for a memoised child and changes nothing where no child memoises.',
          'Keep Send disabled on a blank draft and while a reply is in flight, and give a failed send a visible retry that does not duplicate the user turn.',
        ],
        commonMiss:
          'Building a polished layout first and reaching the end of the hour with a composer that cannot send, or wrapping every handler in useCallback without being able to say what it changes.',
        resourceLabel: 'Practice the chat UI with a streaming response (Premium)',
        resourcePath: '/react/coding/react-chat-streaming-ui',
        reportedRound: { label: XAI_LONDON_REPORT_LABEL, url: XAI_LONDON_REPORT_URL },
      },
      {
        id: 'small-react-app-typescript',
        title: 'Write a small app in React with TypeScript in 45 minutes',
        statement:
          'The closed grok.com & API and Enterprise postings describe a "Coding interview in TypeScript: Write a small app in React"; the closed London posting gave its React coding interview 45 minutes. Practise a complete small app: fetch a list, render loading, error and empty states, and add a filter, with types on the data and the props.',
        whatThisMeasures:
          'Typed React under time, request handling with cancellation, truthful loading, empty and error states, and whether the app works end to end before any polish.',
        clarifyFirst: [
          'Confirm the data source (a real endpoint, a mock or a fixture) and which feature the interviewer wants first.',
          'Confirm the TypeScript strictness and whether any library beyond React is allowed.',
        ],
        strongAnswer: [
          'Type the response and the component props before fetching, and keep the raw list separate from the filtered view.',
          'Start the request in an effect with an AbortController and ignore a response that belongs to a superseded render or an unmounted component.',
          'Render four explicit states, loading, error with retry, empty and populated, instead of inferring them from the length of an array.',
          'Finish a working vertical slice early, then add the filter and say what you would do with another hour.',
        ],
        commonMiss:
          'Spending the first fifteen minutes on folder structure and styling, so the fetch and its failure states are untested when time runs out.',
        resourceLabel: 'Practice fetching and rendering a list with every state',
        resourcePath: '/react/coding/react-fetch-list-states',
        reportedRound: { label: XAI_GROK_API_POSTING_LABEL, url: XAI_GROK_API_POSTING_URL },
      },
      {
        id: 'html-css-from-screenshot',
        title: 'Implement a UI from a screenshot in HTML and CSS',
        statement:
          'Three closed postings describe an "HTML/CSS interview: Given a screenshot of a UI, implement it"; the closed London posting gave the round 45 minutes and named Tailwind. Practise rebuilding a card gallery, then a navigation bar, from a picture alone: match spacing, alignment and responsive reflow without a design file.',
        whatThisMeasures:
          'Reading layout from a picture, choosing grid or flexbox per region, spacing and typography discipline, responsive behaviour and semantic markup under time.',
        clarifyFirst: [
          'Confirm which breakpoints matter, whether pixel accuracy or structure is being judged, and whether Tailwind or plain CSS is expected.',
          'Confirm the content: real text and images or placeholders, and whether hover and focus states are in scope.',
        ],
        strongAnswer: [
          'Name the regions first (header, grid, card, footer) and decide grid versus flexbox for each before writing markup.',
          'Write semantic HTML (nav, ul, article, button) so the structure reads correctly without styles.',
          'Use a spacing scale and a handful of tokens instead of per-element magic numbers, so the result stays consistent when a breakpoint changes.',
          'Check reflow at a narrow width, keep focus styles visible, and move to the second drill, the responsive flexbox navbar, once the gallery holds.',
        ],
        commonMiss:
          'Positioning everything absolutely to match the screenshot at one width, so the layout breaks as soon as the viewport or the text changes.',
        resourceLabel: 'Practice the grid card gallery from a layout brief',
        resourcePath: '/css/coding/css-grid-card-gallery',
        reportedRound: { label: XAI_LONDON_POSTING_LABEL, url: XAI_LONDON_POSTING_URL },
      },
      {
        id: 'ai-chat-composer-streaming-design',
        title: 'Design the AI chat composer and streaming turn for a grok.com-style product',
        statement:
          'Design the composer and the streaming turn for a grok.com-style chat product: Send that becomes Stop while a reply streams, regenerate that does not duplicate a turn, stale stream events that cannot touch the new turn, and token-by-token rendering that stays readable. This practice version is modelled on the reported chat-interface round plus the product domain of the Grok postings; no public account describes a design round for an xAI frontend role.',
        whatThisMeasures:
          'State ownership across draft, active turn and history; stream and command identity; cancellation and recovery; rendering performance under a token stream; and accessibility of streamed text.',
        clarifyFirst: [
          'Confirm the transport (SSE, WebSocket or a fetch stream) and whether the server can resume a stream by sequence number.',
          'Confirm what Stop must guarantee: a server-side stop or only a local abort with partial text kept.',
        ],
        strongAnswer: [
          'Give each send and each stream a stable identity and drop events whose id does not match the active turn.',
          'Model the turn as a small state machine (idle, sending, streaming, stopped, failed) and derive the Send or Stop button from it instead of from scattered booleans.',
          'Batch rendered tokens per animation frame and keep the scroll pinned to the bottom until the reader scrolls up.',
          'Define regenerate as a new turn that reuses the prompt and retires the old stream, and announce status changes to assistive technology.',
        ],
        commonMiss:
          'Showing Stop as done while the old stream keeps appending, because the abort was local and the stream id was not checked.',
        resourceLabel: 'Work through the AI chat composer case',
        resourcePath: '/system-design/ai-chat-textarea-design',
        reportedRound: { label: XAI_LONDON_REPORT_LABEL, url: XAI_LONDON_REPORT_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the chat interface before the first line of the pairing session',
    intro:
      'Treat this as a representative exercise, not a description of the reported session. Work from the contract toward the components, and say each decision out loud so the engineer reviewing your code can follow it.',
    steps: [
      {
        title: 'Pin the message model',
        description:
          'One array of messages with id, role, text and status is the source of truth. The list and the latest assistant turn are derived from it, not stored twice.',
      },
      {
        title: 'Build the composer',
        description:
          'A controlled textarea, Enter to send and Shift+Enter for a newline, Send disabled on a blank draft, and the draft cleared only once the send is accepted.',
      },
      {
        title: 'Show the streaming state',
        description:
          'Append an assistant message with status streaming, update its text as chunks arrive, and render a visible indicator so the reader knows more is coming.',
      },
      {
        title: 'Add Stop and retry',
        description:
          'Stop aborts the request through an AbortController and marks the message stopped; a failed send keeps the draft and offers a retry that does not duplicate the user turn.',
      },
      {
        title: 'Keep it reachable from the keyboard',
        description:
          'Focus returns to the composer after a send, the message list is a polite live region, and Stop is a real button with an accessible name.',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day xAI frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'React fundamentals you may be asked to explain while coding: useCallback and useMemo, useRef versus useState, effects and cleanup.', artifact: 'Thirty-second spoken answers for useCallback, useMemo and useRef, written down.' },
      { day: 'Day 2', focus: 'A small typed React app: fetch, abort, loading, error, empty, filter.', artifact: 'The fetch-and-render drill passing with all four states, timed at 45 minutes.' },
      { day: 'Day 3', focus: 'HTML/CSS from a screenshot: the grid gallery, then the flexbox navbar, with Tailwind if the role names it.', artifact: 'Two layouts rebuilt from a picture, checked at a narrow and a wide width.' },
      { day: 'Day 4', focus: 'The chat interface in one hour: message list, composer, status per message, streamed reply.', artifact: 'A chat interface built in one timed hour with a written list of what you cut.' },
      { day: 'Day 5', focus: 'AI chat design: stream identity, Stop versus abort, regenerate, token batching.', artifact: 'A one-page state and recovery diagram for the composer and the active turn.' },
      { day: 'Day 6', focus: 'Exceptional work: the statement the application asks for and the "Meet the Team" presentation the Bay Area postings described.', artifact: 'A ten-minute walkthrough of one piece of work you are proud of, with the decisions and the result.' },
      { day: 'Day 7', focus: 'Mock loop: a 15-minute screen, a 45-minute React build and a 45-minute CSS build, each narrated.', artifact: 'A list of the questions you will ask about format, tools, stack and the current name of the team.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common xAI frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real xAI questions?',
        answer:
          'No. They are FrontendAtlas practice versions modelled on one public London account and on the stage descriptions in closed official postings. The wording, the data and the test cases are ours.',
      },
      {
        question: 'Is xAI still called xAI?',
        answer:
          'The company merged into SpaceX, with the merger closing on 2 February 2026, and rebranded as SpaceXAI in July 2026. On 21 October 2026 the careers page title read SpaceXSI while its footer named SpaceXAI LLC, and the job board still lived at the xai slug. This guide keeps the xAI name because the postings, the public accounts and search queries use it.',
      },
      {
        question: 'What does the xAI frontend interview loop look like?',
        answer:
          'The closed postings from March 2025 to February 2026 shared one pattern: engineers review the CV and a "statement of exceptional work", then a 15-minute phone interview with basic technical questions, then the team\'s main process on Google Meet with the goal of finishing "within one week". For frontend roles that meant a React coding interview in TypeScript (45 minutes in London), an HTML/CSS interview from a screenshot (with Tailwind in London), and either a 30-minute final stage with a founding engineer in London or a "Meet the Team" presentation of exceptional work in the Bay Area; some Bay Area postings added a coding assessment in a language of your choice. Those postings are closed and the loop varies by team, so confirm the current stages before relying on this.',
      },
      {
        question: 'Is there a take-home?',
        answer:
          'No frontend posting mentions one. Two general software-engineer accounts do: a Member of Technical Staff loop in December 2025 had a four-hour build with your own IDE and AI tools, the provided X and xAI API keys, a GitHub repository and a Loom walkthrough due within 24 hours, followed by a one-hour in-person session reading an existing class; a recruiter-sourced Grok role in October 2025 mentioned a "4-hour intensive programming challenge". Ask whether your loop includes one.',
      },
      {
        question: 'Do I need Next.js or Tailwind?',
        answer:
          'The grok.com & API posting named React with Next.js and Tailwind, and the London posting called its CSS round "HTML/CSS/Tailwind". Prepare the same layouts in plain CSS first, then once with Tailwind utilities, and confirm the stack with whoever runs your process; the careers page says technical team members, not recruiters, evaluate applications.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the React, CSS, streaming, design and communication skills used by the practice prompts. They are supporting drills, not claimed xAI questions.',
    items: [
      { label: 'React fetch and render a list', description: 'Loading, error and empty states around a typed response.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Grid card gallery', description: 'A two-to-four column gallery built from a layout brief.', path: '/css/coding/css-grid-card-gallery' },
      { label: 'Flexbox responsive navbar', description: 'The second screenshot drill: a navigation bar that reflows.', path: '/css/coding/css-flexbox-navbar' },
      { label: 'useMemo vs useCallback', description: 'When memoising makes a component slower.', path: '/react/trivia/react-usememo-vs-usecallback' },
      { label: 'useRef vs useState', description: 'Why changing a ref does not re-render.', path: '/react/trivia/react-useref-vs-usestate' },
      { label: 'Streaming data from an AI model', description: 'Concept answer on handling streamed responses.', path: '/javascript/trivia/ai-streaming-data-handling' },
      { label: 'Conversation state in a chat app', description: 'How to keep chat state truthful across turns.', path: '/javascript/trivia/chat-conversation-state-management' },
      { label: 'AI chat composer and streaming turn', description: 'System design case for Send, Stop and stale stream events.', path: '/system-design/ai-chat-textarea-design' },
      { label: 'Behavioural stories', description: 'Prepare the exceptional-work story the application and the team stage ask for.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      {
        label: XAI_LONDON_REPORT_LABEL,
        url: XAI_LONDON_REPORT_URL,
        note:
          'One self-reported London loop: a 15-minute phone interview, then a one-hour pair-coding session building a chat interface in React with live code review and React questions such as what useCallback does. It establishes the round this guide is modelled on; it cannot establish wording, the current format or the loops of other teams.',
        kind: 'report',
      },
      {
        label: XAI_SPECIALIST_REPORT_LABEL,
        url: XAI_SPECIALIST_REPORT_URL,
        note:
          'One self-reported loop: a CodeSignal assessment, then two interviews on JavaScript and React including "What is useRef and how is it used?", and an offer followed by silence from HR. The title looks like a separate track from the product frontend teams, and the city Taro shows for it is not trusted, so none is given here.',
        kind: 'report',
      },
      {
        label: XAI_MTS_REPORT_LABEL,
        url: XAI_MTS_REPORT_URL,
        note:
          'One general software-engineer loop, not a frontend posting: a 15-minute screen, a four-hour AI-assisted take-home (one of six prompts, X and xAI API keys, a GitHub repository and a Loom video within 24 hours) and a one-hour in-person final reading an existing class. Used only for the take-home question.',
        kind: 'report',
      },
      {
        label: XAI_GROK_API_POSTING_LABEL,
        url: XAI_GROK_API_POSTING_URL,
        note:
          'Closed: listed from 11 to 27 January 2026 for London and Palo Alto. It described a 15-minute phone interview with basic technical questions, then two technical interviews: "Coding interview in TypeScript: Write a small app in React" and "HTML/CSS interview: Given a screenshot of a UI, implement it". The team text named React with Next.js and Tailwind.',
        kind: 'official',
      },
      {
        label: XAI_ENTERPRISE_POSTING_LABEL,
        url: XAI_ENTERPRISE_POSTING_URL,
        note:
          'Closed: listed from 21 to 25 February 2026 for Palo Alto. It described the same two interviews as the grok.com & API posting and said "at least two technical interviews".',
        kind: 'official',
      },
      {
        label: XAI_GROK_STUDIO_POSTING_LABEL,
        url: XAI_GROK_STUDIO_POSTING_URL,
        note:
          'Closed: posted on 3 April 2025 under the title "Agents UX"; the Built In copy was removed on 27 January 2026. It described a coding assessment in a language of your choice, two frontend technical interviews in React/TypeScript and a "Meet the Team" session presenting past exceptional work, with the goal of finishing the main process within one week.',
        kind: 'official',
      },
      {
        label: XAI_LONDON_POSTING_LABEL,
        url: XAI_LONDON_POSTING_URL,
        note:
          'Closed: removed on 17 February 2026. It described an initial technical screening of basic technical questions (15 minutes), a React coding interview (45 minutes), an HTML/CSS/Tailwind coding interview (45 minutes) and a final stage with founding engineer Toby Pohlen (30 minutes), all on Google Meet.',
        kind: 'official',
      },
      {
        label: 'xAI careers (SpaceXAI)',
        url: XAI_CAREERS_URL,
        note:
          'Read on 21 October 2026. Four generic steps (application review of the CV and a statement of exceptional work, a screening interview with short technical questions, technical interviews, offer) and "We generally do not use recruiters for assessments." Product context and the generic shape only; the job board that day listed no frontend posting with interview text.',
        kind: 'official',
      },
      {
        label: 'News: SpaceX completes its merger with xAI, Drive Tesla Canada, February 2026',
        url: XAI_MERGER_NEWS_URL,
        note: 'Establishes naming only: merger documents dated 2 February 2026. Not evidence of interview content.',
        kind: 'report',
      },
      {
        label: 'News: xAI rebrands to SpaceXAI, Free Press Journal, July 2026',
        url: XAI_REBRAND_NEWS_URL,
        note: 'Establishes naming only: the SpaceXAI rebrand went live in the first week of July 2026. Not evidence of interview content.',
        kind: 'report',
      },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full xAI practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the chat UI with a streaming response and the rest of the Premium React and system design catalogue.',
    buttonLabel: 'Unlock the full xAI practice set',
    src: 'company_preview_xai',
  },
  about: [
    'xAI frontend interview preparation',
    'React chat interface pair coding',
    'HTML and CSS implementation from a screenshot',
    'AI chat composer and streaming turn design',
  ],
  indexAnchorLabel: 'xAI frontend interview questions',
};
