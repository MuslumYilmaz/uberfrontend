import type { AuthoredSectionCopy } from '../../../shared/company-previews/authored-company-preview.model';

/**
 * OpenAI frontend interview guide. The page keeps its own branch of the preview template; its reported questions live
 * with the process table (COMPANY_INTERVIEW_PROCESSES.openai), and the prompts below are the answer guides of two of
 * them. Count tokens (`{questions}`, `{#questions}`) are filled from the page's evidence.
 */
export type OpenAiPracticePrompt = {
  readonly id: string;
  readonly title: string;
  readonly intent: string;
  readonly rubric: readonly string[];
};

export type OpenAiPrepDay = {
  readonly day: string;
  readonly focus: string;
};

export type OpenAiResourceLink = {
  readonly label: string;
  readonly route: readonly string[];
  readonly path: string;
};

export type OpenAiPreviewFaq = {
  readonly question: string;
  readonly answer: string;
};

export const OPENAI_PREVIEW_TITLE = 'OpenAI Frontend Interview: {#questions} Reported Questions + Prep Guide';
export const OPENAI_PREVIEW_H1 = 'OpenAI Frontend Interview Questions';
export const OPENAI_PREVIEW_DESCRIPTION =
  'OpenAI frontend interview: the recruiter call, a two-part screen with a ChatGPT-in-a-text-area design, the agentic option and {#questions} reported questions.';
export const OPENAI_PREVIEW_CANONICAL_PATH = '/companies/openai/preview';
export const OPENAI_TRUST_NOTE =
  'The questions come from a senior frontend account on Taro, posts on Blind, a full-stack account on Aced and a software engineer account that PracHub says it curated and edited, all written in our words; OpenAI has confirmed none of them. Its interview guide says formats vary by team, so prepare for the screen your recruiter describes.';

/** The page's prose outside the lists, in the order it renders. */
export const OPENAI_COPY = {
  subtitle:
    'Frontend and full-stack accounts from 2023 to 2026 describe a recruiter call, then a technical screen in two parts, coding and system design; in October 2026 one candidate could swap the coding hour for an agentic one in a Python codebase. Below the table are the questions candidates reported; the first is open to everyone.',
  chip: 'Public accounts, 2023–2026',
  studyKicker: 'What to study first',
  studyTitle: 'What OpenAI\'s screens test: a chat product to design, and an hour of general coding',
  studyParagraphs: [
    'The systems design half of the 2024 senior frontend screen was ChatGPT, but in a text area, set by an interviewer who was not a frontend engineer. Design it from the user\'s side first: the text area, the reply streaming in, stop and retry, and what survives a reload. Two general loops asked for OpenAI products too: the Playground for developers, from its screens down, in a 2025 full-stack screen, and ChatGPT again in a 2026 onsite, with follow-ups on SSE against WebSocket and on long conversations.',
    'The coding half is general rather than frontend. The 2024 senior candidate refactored existing code in a language the interviewer asked them to choose, a 2024 frontend candidate remembers a piece of JavaScript to fix and stresses edge cases, and the general loops set data-structure tasks: a map over a list of tuples, a credit pool with expirations, a simplified vector store. The prep guide a 2026 recruiter sent for the JavaScript option covers arrays, queues, maps, trees, sorting, searching, dynamic programming and backtracking; the agentic option runs in a Python codebase with AI tools.',
  ],
  walkthroughTitle: 'Scope ChatGPT in a text area before you draw components',
  walkthroughParagraphs: [
    'Start where the 2024 candidate says the interviewer was unsure: how the application works for the person using it. One text area holds the draft; Enter sends, the prompt appears at once, and the reply streams in beneath it with a way to stop it. Ask whether history survives a reload and whether there is more than one conversation before you choose any storage.',
    'Then name the state: messages with stable ids, the draft, the id of the request that is streaming, and a status per reply (streaming, done, stopped, failed). Read the response with fetch and a ReadableStream reader, append each chunk to one reply, and ignore chunks whose request id is no longer current. End on the edges: a stop mid-reply, a failure that keeps the prompt, a very long reply, and someone using only the keyboard.',
  ],
  planTitle: 'A 7-day OpenAI frontend interview preparation plan',
  planIntro: 'One day per stage of the OpenAI process, from the recruiter call to the final interviews, then a mock of the two-part screen.',
  freeTitle: 'Free practice for the open question',
  freeIntro:
    'Streamed replies in the browser, requests that must not overwrite newer ones, and a story structure for the behavioural questions.',
} as const;

/** What the accounts cover and what only a recruiter can say; shown with the sources at the end of the page. */
export const OPENAI_SOURCE_BOUNDARY: AuthoredSectionCopy = {
  kicker: 'Source boundary · checked November 2026',
  title: 'What the public accounts describe, and what you still need to confirm',
  paragraphs: [
    'Frontend and full-stack accounts from 2023 to 2026 agree on the front of the process: a call with a recruiter or hiring manager, then a technical screen of coding and system design, run back to back in 2024 and 2025. Neither interviewer in the 2024 senior frontend screen was a frontend engineer. In October 2026 one senior candidate could choose a 60-minute JavaScript interview or a 60-minute agentic coding interview in a Python codebase with AI tools.',
    'OpenAI\'s interview guide says formats vary by team and may include pair coding, take-home projects or technical tests, that some formats allow AI tools while others do not, and that final interviews run 4 to 6 hours with 4 to 6 people over 1 to 2 days. No frontend-titled account read for this page reaches that final loop; the onsite accounts are software engineer and full-stack loops from 2023, 2025 and 2026. Ask your recruiter which coding format, tools and language your screen uses.',
  ],
};

/**
 * Questions the page answers from its sources. "openai online assessment" reaches the guide from search; no account
 * read for it mentions a test before or instead of the live screen.
 */
export const OPENAI_PREVIEW_FAQS: readonly OpenAiPreviewFaq[] = [
  {
    question: 'Does OpenAI send an online assessment before the screen?',
    answer:
      'None of the accounts behind this page mentions one. Those that describe the start of the process, from 2024 to 2026, go from a call with a recruiter or hiring manager to a live technical screen: coding and system design back to back in 2024 and 2025, and for one senior candidate in October 2026 a choice between a 60-minute JavaScript interview and an agentic one. OpenAI\'s interview guide says formats vary by team and may include pair coding, take-home projects or technical tests, so ask your recruiter which your team uses.',
  },
];

export const OPENAI_RESOURCE_LINKS: readonly OpenAiResourceLink[] = [
  {
    label: 'ReadableStream to text',
    route: ['/javascript', 'coding', 'js-stream-to-text'],
    path: '/javascript/coding/js-stream-to-text',
  },
  {
    label: 'takeLatest request handling',
    route: ['/javascript', 'coding', 'js-take-latest'],
    path: '/javascript/coding/js-take-latest',
  },
  {
    label: 'AI UX integration challenges',
    route: ['/javascript', 'trivia', 'ai-ux-integration-challenges'],
    path: '/javascript/trivia/ai-ux-integration-challenges',
  },
  {
    label: 'Behavioral stories',
    route: ['/guides', 'behavioral', 'stories'],
    path: '/guides/behavioral/stories',
  },
];

export const OPENAI_PRACTICE_PROMPTS: readonly OpenAiPracticePrompt[] = [
  {
    id: 'streaming-chat-composer',
    title: 'ChatGPT in a text area: composer and streamed reply',
    intent:
      'Design, then build the core of, ChatGPT in a text area: a composer that sends a message, shows it at once, and appends the assistant\'s reply as streamed chunks arrive.',
    rubric: [
      'Start from how the product works for the user: one text area, a reply streaming below the prompt, stop, retry, and what survives a reload.',
      'Readable state shape for messages, draft input, pending request id, and stream status.',
      'Incremental text rendering without blocking typing, selection, or scroll position.',
      'Error and retry states that preserve the user prompt and partial assistant text.',
      'Clear separation between transport code and rendering logic.',
    ],
  },
  {
    id: 'frontend-system-design-conversation-history',
    title: 'Frontend system design: ChatGPT and long conversations',
    intent:
      'Design the frontend of ChatGPT: how a reply streams in, which transport carries it, and how a long conversation keeps rendering well.',
    rubric: [
      'Transport for streamed replies: SSE against WebSocket, and what each means for reconnecting, stopping and proxies.',
      'Data model for threads, messages, streaming drafts and pagination cursors.',
      'Virtualized rendering and scroll anchoring for long conversations.',
      'Cache and persistence plan for recent conversations, offline recovery, and invalidation.',
      'Privacy, retention, and redaction considerations for sensitive chat content.',
      'Observability for latency, stream failures, and client-side rendering errors.',
    ],
  },
];

export const OPENAI_PREP_SEQUENCE: readonly OpenAiPrepDay[] = [
  {
    day: 'Day 1',
    focus: 'Recruiter call: a 2024 frontend candidate\'s call was about motivation, starting with why OpenAI, and a 2025 full-stack recruiter screen asked the same. Prepare that answer and two minutes on your recent work.',
  },
  {
    day: 'Day 2',
    focus: 'The open question: design ChatGPT in a text area out loud, from the user\'s side first, then the state behind each message and how a reply streams in.',
  },
  {
    day: 'Day 3',
    focus: 'Streaming in the browser: read a streamed response with a ReadableStream reader, decode it, render it as it arrives, and stop it cleanly with AbortController.',
  },
  {
    day: 'Day 4',
    focus: 'Coding half: an hour of timed coding without a framework; the prep guide a 2026 recruiter sent for the JavaScript option covers arrays, queues, maps, trees, sorting, searching, dynamic programming and backtracking.',
  },
  {
    day: 'Day 5',
    focus: 'Agentic option: if your recruiter offers it, practise reading an unfamiliar Python codebase with an AI assistant, planning before you prompt, and checking what it writes before you own it.',
  },
  {
    day: 'Day 6',
    focus: 'Final interviews: 4 to 6 hours with 4 to 6 people. Prepare a past project to present, as a 2023 loop asked, with slides as a 2025 onsite asked, and a story about a conflict you resolved.',
  },
  {
    day: 'Day 7',
    focus: 'Mock screen: one hour of system design and one of coding back to back, the shape of the 2024 and 2025 screens, then write down what to ask your recruiter about format, tools and language.',
  },
];
