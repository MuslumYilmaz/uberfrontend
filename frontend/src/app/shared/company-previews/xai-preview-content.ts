import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * xAI (now SpaceXSI) frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the one prompt here is the answer guide of the open question, the chat
 * interface from the London account on Taro (August 2025). The frontend rounds come from closed official
 * postings (March 2025 to February 2026); the other questions come from a Specialist account on Taro and
 * general software-engineer accounts on Aced and Taro. Nothing here is a leaked, confirmed or official xAI
 * question, and closed postings plus a few accounts cannot establish the current loop.
 */
const XAI_LONDON_REPORT_URL =
  'https://www.jointaro.com/interviews/companies/xai/experiences/frontend-engineer-london-england-august-13-2025-no-offer-positive-45b410e6/';
const XAI_LONDON_REPORT_LABEL = 'Public report: xAI Frontend Engineer interview account on Taro, August 2025';
const XAI_SPECIALIST_REPORT_URL =
  'https://www.jointaro.com/interviews/companies/xai/experiences/software-engineer-specialist-yerevan-yerevan-august-1-2025-accepted-offer-negative-c940c932/';
const XAI_SPECIALIST_REPORT_LABEL = 'Public report: xAI Software Engineer Specialist interview account on Taro, 2025 (Taro, approximate date)';
const XAI_MTS_REPORT_URL = 'https://www.aced.io/experiences/x-ai-software-engineer-interview-7fbd12';
const XAI_MTS_REPORT_LABEL = 'Public report: xAI Member of Technical Staff (L3) interview account on Aced, 2025';
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

export const XAI_PREVIEW_TITLE = 'xAI (now SpaceXSI) Frontend Interview Questions and Process Guide';
export const XAI_PREVIEW_H1 = 'xAI (now SpaceXSI) Frontend Interview Questions';
export const XAI_PREVIEW_DESCRIPTION =
  'Prepare for an xAI (SpaceXSI) frontend interview with {#questions} reported questions and the rounds from public postings and reports: chat UI, TS app, CSS screenshot.';
export const XAI_PREVIEW_CANONICAL_PATH = '/companies/xai/preview';
export const XAI_PREVIEW_TRUST_NOTE =
  'The questions come from candidates\' public pages on Taro and Aced and are given in our words, not leaked, confirmed or official xAI questions; the answer guide is our own. The frontend rounds rest on closed postings and one London account, and what the engineers running your process tell you outranks both.';

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
      'Closed xAI postings from 2025 to early 2026 describe a 15-minute screen, a small React app written in TypeScript, a UI rebuilt from a screenshot in HTML and CSS and a last stage with the team or a founding engineer; the London postings say every interview runs on Google Meet. Under the table are the {questions} questions candidates reported; the first, a chat interface built in React while an engineer reviews the code, is open.',
    caveat:
      'xAI merged into SpaceX (the merger closed on 2 February 2026), rebranded as SpaceXAI in July 2026 and as SpaceXSI in October 2026, with SpaceXAI LLC as the legal entity; on 21 October 2026 the job board still lived at the xai slug. Every frontend posting that described a loop had been removed by 25 February 2026, most of them in January and February 2026, and only one candidate account comes from a frontend role.',
    chips: ['{#questions} reported questions', 'React, TypeScript, HTML/CSS, Tailwind', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not xAI trivia',
    paragraphs: [
      'The closed postings and the London account reward a frontend engineer who gets a small React app working in 45 minutes to an hour while someone reads the code. In the account that meant a chat interface built in pair coding, with an engineer from the team reviewing live and asking React questions as it grew, so have a one-sentence reason ready for every hook you write and a working send before any styling.',
      'The rest depends on the team. The London, grok.com & API and Enterprise postings added an HTML/CSS round built from a screenshot, with Tailwind in London, and London ended with 30 minutes with founding engineer Toby Pohlen; Grok Studio and Autonomous Agents added a coding assessment in a language of your choice and a "Meet the Team" presentation of past exceptional work. General software-engineer loops in late 2025 used a four-hour take-home and practical coding on classes. Rehearse the screenshot build in Tailwind and in plain CSS, and the story behind the "statement of exceptional work" the application asks for.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What closed postings and a few accounts can show, and what to ask your interviewers',
    paragraphs: [
      '{sources} public pages stand behind this guide, all listed under Sources. The frontend rounds come from closed official postings for London and Bay Area roles between March 2025 and February 2026, and from one Frontend Engineer account on Taro (August 2025) with a 15-minute phone interview and an hour of pair coding on a chat interface in React. The other questions come from a "Software Engineer Specialist" account with JavaScript and React interviews after a CodeSignal assessment, and from general software-engineer accounts on Aced and Taro from 2025; none of those is a frontend loop.',
      'Every posting with a loop is closed, so the table is a record of 2025 and early 2026, not of the merged company: on 21 October 2026 the job board at the xai slug listed one frontend-titled opening and no engineering posting with an interview section. The careers page says engineers rather than recruiters evaluate applications; ask whoever contacts you which of these rounds your team still runs, whether the CSS round expects Tailwind and whether AI tools are allowed.',
    ],
  },
  prompts: {
    kicker: 'Answer guide',
    title: 'Answer guide for the reported xAI chat interface question',
    intro:
      'Clarify the contract, explain ownership and trade-offs, build the smallest working slice and test the failure cases.',
    itemListName: 'xAI answer guide',
    items: [
      {
        id: 'react-chat-interface-pairing',
        title: 'Build a chat interface in React during a one-hour pairing session',
        statement:
          'One Taro account from London describes a one-hour pair-coding session: build a chat interface in React while an engineer from the team reviews the code live and asks React questions along the way. Practise the same shape: a message list, a composer, a status per message, and an assistant reply that renders as it arrives.',
        whatThisMeasures:
          'Scoping under a clock, component and state boundaries, controlled inputs and list rendering, explaining hooks while typing, and taking live review without losing the thread.',
        clarifyFirst: [
          'Confirm whether the reply arrives at once or as a stream, whether a mock is acceptable, and what the interviewer wants to see working first.',
          'Confirm the setup: TypeScript or JavaScript, any starter code, and whether styling matters inside the hour.',
        ],
        strongAnswer: [
          'Say the plan before coding: one messages array as the source of truth, a composer with a controlled value, and a status per message (sending, sent, failed).',
          'Render the list from state, key each item by a stable id, and keep the scroll pinned to the latest message until the reader scrolls up.',
          'Explain each hook as you write it, in one sentence: what it changes and what would break without it, so the reviewer\'s questions land on code you can defend.',
          'Keep Send disabled on a blank draft and while a reply is in flight, and give a failed send a visible retry that does not duplicate the user turn.',
        ],
        commonMiss:
          'Building a polished layout first and reaching the end of the hour with a composer that cannot send, or reaching for hooks you cannot explain when the reviewer asks.',
        resourceLabel: 'Practice the chat UI with a streaming response (Premium)',
        resourcePath: '/react/coding/react-chat-streaming-ui',
        reportedRound: { label: XAI_LONDON_REPORT_LABEL, url: XAI_LONDON_REPORT_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the chat interface before the first line of the pairing session',
    intro:
      'In the London account an engineer read the code as it was written, so these five steps are the order to build things in during the hour and to say them out loud.',
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
    intro: 'Seven days in the order of the closed London loop, React first and the screenshot build second, then the coding and presentation stages other xAI teams added.',
    days: [
      { day: 'Day 1', focus: 'React under review: a one-sentence reason for every hook you write, and effects with their cleanup.', artifact: 'Thirty-second spoken answers for the hooks a chat interface needs, written down.' },
      { day: 'Day 2', focus: 'A small typed React app: fetch, abort, loading, error, empty, filter.', artifact: 'The fetch-and-render drill passing with all four states, timed at 45 minutes.' },
      { day: 'Day 3', focus: 'HTML/CSS from a screenshot: the grid gallery, then the flexbox navbar, with Tailwind if the role names it.', artifact: 'Two layouts rebuilt from a picture, checked at a narrow and a wide width.' },
      { day: 'Day 4', focus: 'The chat interface in one hour: message list, composer, status per message, the assistant reply.', artifact: 'A chat interface built in one timed hour with a written list of what you cut.' },
      { day: 'Day 5', focus: 'Coding outside React: a stateful class written live in the language you know best, extended when the interviewer adds a requirement.', artifact: 'Two solutions with the added requirements in place and a note of the inputs you tested.' },
      { day: 'Day 6', focus: 'Exceptional work: the statement the application asks for and the "Meet the Team" presentation the Bay Area postings described.', artifact: 'A ten-minute walkthrough of one piece of work you are proud of, with the decisions and the result.' },
      { day: 'Day 7', focus: 'Mock loop: a 15-minute screen, a 45-minute React build and a 45-minute CSS build, each narrated.', artifact: 'Questions for the engineer running your process: which of these rounds your team still uses after the merger, whether Tailwind is expected and whether AI tools are allowed.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common xAI frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real xAI questions?',
        answer:
          'They are questions candidates reported on Taro and Aced, given here in our words, not leaked or confirmed xAI questions. The React ones come from a London frontend loop and a Specialist loop, the rest from general software-engineer loops; the closed postings describe rounds, not questions. The answer guide and the practice tasks are FrontendAtlas\'s own.',
      },
      {
        question: 'Is xAI still called xAI?',
        answer:
          'No. The company merged into SpaceX, with the merger closing on 2 February 2026, was rebranded as SpaceXAI in July 2026 and as SpaceXSI in October 2026; the legal entity is SpaceXAI LLC and the job board still uses the xai slug. This guide keeps the xAI name because the postings, the public accounts and search queries use it.',
      },
      {
        question: 'What does the xAI frontend interview loop look like?',
        answer:
          'The closed postings from March 2025 to February 2026 shared one pattern: engineers review the CV and a "statement of exceptional work", then a 15-minute phone interview with basic technical questions, then the team\'s main process on Google Meet with the goal of finishing "within one week". For frontend roles that meant a React coding interview in TypeScript (45 minutes in London), an HTML/CSS interview from a screenshot (with Tailwind in London), and either a 30-minute final stage with a founding engineer in London or a "Meet the Team" presentation of exceptional work in the Bay Area; some Bay Area postings added a coding assessment in a language of your choice. Those postings are closed and the loop varies by team.',
      },
      {
        question: 'Is there a take-home?',
        answer:
          'No frontend posting mentions one. A Member of Technical Staff loop from December 2025, on Aced, had a 15-minute recruiter chat, a four-hour take-home with AI coding assistants allowed, handed in as a repository and a Loom video within 24 hours, and a one-hour in-person coding round. A developer\'s blog post from October 2025 about a recruiter approach for a Grok role mentions a "4-hour intensive programming challenge". Ask whether your loop includes one.',
      },
      {
        question: 'Do I need Next.js or Tailwind?',
        answer:
          'The grok.com & API posting named React with Next.js and Tailwind, and the London posting called its CSS round "HTML/CSS/Tailwind". Prepare the same layouts in plain CSS first, then once with Tailwind utilities.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'Free tasks for the rounds the postings and the London account describe: a typed React app, a layout rebuilt from a picture, a chat reply that arrives in parts, and the exceptional-work story. None of them is a reported xAI question.',
    items: [
      { label: 'React fetch and render a list', description: 'Loading, error and empty states around a typed response.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Grid card gallery', description: 'A two-to-four column gallery built from a layout brief.', path: '/css/coding/css-grid-card-gallery' },
      { label: 'Flexbox responsive navbar', description: 'The second screenshot drill: a navigation bar that reflows.', path: '/css/coding/css-flexbox-navbar' },
      { label: 'Streaming data from an AI model', description: 'Concept answer on handling streamed responses.', path: '/javascript/trivia/ai-streaming-data-handling' },
      { label: 'Conversation state in a chat app', description: 'How to keep chat state truthful across turns.', path: '/javascript/trivia/chat-conversation-state-management' },
      { label: 'AI chat composer and streaming turn', description: 'Send that turns into Stop, and what to do with stream events that arrive after it.', path: '/system-design/ai-chat-textarea-design' },
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
          'One self-reported Frontend Engineer loop from London, no offer: a 15-minute phone interview, then a one-hour pair-coding session building a chat interface in React, with an engineer from the team reviewing the code live and asking React questions. No HTML/CSS round is mentioned, so the loop may have ended after the React round.',
        kind: 'report',
      },
      {
        label: XAI_SPECIALIST_REPORT_LABEL,
        url: XAI_SPECIALIST_REPORT_URL,
        note:
          'One self-reported loop on a "Software Engineer Specialist" title: a CodeSignal assessment, then two interviews on JavaScript and React, then an offer followed by silence from HR. The title looks like a separate track from the product frontend teams, so its loop stays out of the table, and the city Taro shows for it is not trusted.',
        kind: 'report',
      },
      {
        label: XAI_MTS_REPORT_LABEL,
        url: XAI_MTS_REPORT_URL,
        note:
          'One Member of Technical Staff (L3) loop in the United States, rejected after four weeks: a 15-minute recruiter chat, a four-hour take-home with AI coding assistants allowed and a one-hour in-person coding round. A general software-engineer loop, not a frontend posting.',
        kind: 'report',
      },
      {
        label: 'Public report: a developer blog on a recruiter-sourced xAI Grok role, October 2025',
        url: 'https://andys.blog/xai/',
        note:
          'A personal post from 9 October 2025 about a recruiter approach for a Grok position that mentioned a 4-hour intensive programming challenge, which the author did not take. Used for that phrase only.',
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
        label: 'xAI careers (SpaceXSI)',
        url: XAI_CAREERS_URL,
        note:
          'Checked on 21 October 2026: four generic steps (application review of the CV and a statement of exceptional work, a screening interview with short technical questions, technical interviews, offer) and "We generally do not use recruiters for assessments." That day the job board listed no frontend posting with interview text.',
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
      'Premium opens the other reported xAI questions with their practice tasks, the chat UI with a streaming response and the rest of the Premium React and system design catalogue.',
    buttonLabel: 'Unlock the full xAI practice set',
    src: 'company_preview_xai',
  },
  about: [
    'xAI frontend interview preparation',
    'React chat interface pair coding',
    'HTML and CSS implementation from a screenshot',
    'xAI take-home and coding rounds',
  ],
  indexAnchorLabel: 'xAI frontend interview questions',
};
