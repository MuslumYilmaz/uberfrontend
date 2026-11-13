import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * ElevenLabs frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the prompts here are the answer guides of four of them. The sources are public,
 * candidate-sourced pages on Taro, Aced and PracHub and a question bank ElevenLabs candidates add to on Aced. Nothing
 * here is a leaked, confirmed or official ElevenLabs question, and the accounts cannot establish a fixed loop.
 */
const ELEVENLABS_BANK_URL = 'https://www.aced.io/guides/elevenlabs-software-engineer-interview/questions';
const ELEVENLABS_BANK_LABEL = 'Public report: ElevenLabs candidate-sourced question bank on Aced, October 2026';
const ELEVENLABS_EXPERIENCE_URL =
  'https://www.aced.io/experiences/eleven-labs-senior-frontend-engineer-interview-925c04';
const ELEVENLABS_EXPERIENCE_LABEL =
  'Public report: ElevenLabs senior full-stack (frontend-leaning) interview account on Aced, 2026';

export const ELEVENLABS_PREVIEW_TITLE = 'ElevenLabs Frontend Interview Questions and Coding Assessment Guide';
export const ELEVENLABS_PREVIEW_H1 = 'ElevenLabs Frontend Interview Questions';
export const ELEVENLABS_PREVIEW_DESCRIPTION =
  'ElevenLabs frontend interview: the coding assessment (a 90-minute test, often on CoderPad, or a take-home), the live technical round and {#questions} reported questions.';
export const ELEVENLABS_PREVIEW_CANONICAL_PATH = '/companies/elevenlabs/preview';
export const ELEVENLABS_PREVIEW_TRUST_NOTE =
  'The questions come from candidates\' public pages and are given in our words, not leaked, confirmed or official ElevenLabs questions; the answer guides are our own. {reports} public reports show what came up in some loops, and what your recruiter sends outranks them.';

export const ELEVENLABS_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'elevenlabs',
  label: 'ElevenLabs',
  title: ELEVENLABS_PREVIEW_TITLE,
  h1: ELEVENLABS_PREVIEW_H1,
  description: ELEVENLABS_PREVIEW_DESCRIPTION,
  canonicalPath: ELEVENLABS_PREVIEW_CANONICAL_PATH,
  trustNote: ELEVENLABS_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public ElevenLabs prep guide',
    subtitle:
      'Accounts from 2024 to 2026 describe a timed coding assessment that often comes before the recruiter call, an hour of pair work with an engineer, a product or design round and a final conversation with the CTO or a founder. Below: how each round runs, then the {questions} questions candidates reported, the first one open.',
    caveat:
      'Most accounts come from Taro and Aced and describe full-stack loops; none is for a purely frontend title, and the assessment changed shape between 2024 and 2026.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2024–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not ElevenLabs trivia',
    paragraphs: [
      'The reported rounds reward engineers who can make a media interface truthful under time: a highlight that follows playback without drifting, a review screen that keeps an editor and voice actors in step, a fix that addresses the cause of a bug rather than its symptom. Each answer guide lists what to ask before coding, what a strong answer covers and the miss that most often costs the round.',
      'Several 2026 accounts describe the timed assessment arriving before the recruiter call and an hour of pair work after it. Practise both shapes with a clock running, and say your decisions out loud while you type.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What these accounts can tell you, and what to ask the recruiter',
    paragraphs: [
      'The accounts behind this guide are candidates\' own posts on Taro, Aced and PracHub from 2024 to 2026, plus a question bank that ElevenLabs candidates add to on Aced. Most describe full-stack or general software engineering loops; none is for a purely frontend title. They show which rounds and questions came up in some loops between 2024 and 2026; they cannot tell you the exact wording, this year\'s format or how a given team interviews.',
      'Ask the recruiter which assessment you will get, what the live round is built on and whether AI tools are allowed; the 2025 Python round banned LLMs. The careers site lists the teams and roles, which helps with product context but says nothing about the interview.',
    ],
  },
  roundSpotlights: [
    {
      id: 'coding-assessment',
      kicker: 'Round decoder',
      title: 'ElevenLabs coding assessment and live technical round: how each one runs',
      lede: [
        'ElevenLabs usually opens with a timed coding assessment and follows it with a live technical round with an engineer. In the 2026 accounts the assessment came first, often before the recruiter call: about 90 minutes, mixing React or JavaScript tasks with LeetCode-style problems. Earlier loops used an asynchronous task, a take-home or a Python algorithm round.',
        'The live round is about an hour of pair work, mostly in React on a small app or component. A product or design round follows in most loops, and the final conversation is with the CTO, a co-founder or the head of the organisation; the careers FAQ names a founder or Bar Raiser.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'The first technical step; in several 2026 accounts the assessment arrived before the recruiter call.' },
        { label: 'Assessment', value: 'About 90 minutes in three accounts from 2025 and 2026, often on CoderPad, mixing React or JavaScript tasks with LeetCode-style problems. Other loops used an asynchronous task (2024), a take-home (2025) or a Python algorithm round (2025).' },
        { label: 'Live technical round', value: 'About an hour of pair work with an engineer, mostly in React on a small app or component; in a 2024 loop the constraints changed during the task.' },
        { label: 'What follows', value: 'A product discussion, a product decomposition or a system design interview in most loops, then a call with the CTO, a co-founder or the head of the organisation. A 2025 account had no system design round.' },
        { label: 'Stack', value: 'React is the safe default: React tasks appear in the assessment and the live round of most accounts, and a 2025 take-home used TypeScript and React.' },
      ],
      // Prompt 4 sits past the open prompts, so the rehearsal leads to its free starter rather than a locked card.
      practiceLink: { label: 'Rehearse the assessment with the free React autocomplete starter', path: '/react/coding/react-autocomplete-search-starter' },
      processLink: { label: 'See the coding assessment row in the reported process', fragment: 'elevenlabs-interview-process-1-stage-coding-assessment' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Creator tools or developer screens: two contexts to practise in',
    intro:
      'Two product contexts recur in the reported tasks: creator tools built around audio and transcripts, and developer-facing screens for generating speech. Pick the one nearer the role you applied for; neither is a claimed team assignment.',
    items: [
      {
        title: 'Creator tools and editors',
        description:
          'Dubbing and voice-editing screens combine timelines, playback, transcripts, review states and feedback from several people on one project.',
        practiceFocus:
          'Time-driven rendering, playback-synchronised highlighting, review and approval state, optimistic edits with recovery, and keyboard-driven editing.',
      },
      {
        title: 'Developer platform and streaming playback',
        description:
          'Consoles and demos that generate audio from text, stream the result, show usage and quotas, and must stay honest while a request is in flight.',
        practiceFocus:
          'Streaming reads, cancellation, loading and failure states, idempotent generation requests, and accessible controls for play, pause and seek.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for the reported ElevenLabs questions',
    intro:
      'For each question, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases.',
    itemListName: 'ElevenLabs answer guides',
    items: [
      {
        id: 'audio-transcript-sync',
        title: 'Synchronise audio playback with transcript highlighting',
        statement:
          'Given an audio element and a transcript with start and end times per word or segment, highlight the segment being spoken as playback runs, and keep it correct through play, pause, seek and speed changes.',
        whatThisMeasures:
          'Choosing a time source and update loop, mapping a timestamp to a segment efficiently, rendering only what changed, and reasoning about drift and edge timings.',
        clarifyFirst: [
          'Confirm the granularity (word or sentence), whether timings can overlap or have gaps, and how to treat the moment between segments.',
          'Confirm the update budget: is an update per animation frame acceptable, and must the highlight survive seeking backwards?',
        ],
        strongAnswer: [
          'Drive updates from a requestAnimationFrame loop that reads the current time, not only from the coarse timeupdate event.',
          'Map time to a segment with a binary search over sorted start times, and cache the last index to make the common forward step cheap.',
          'Update only the active segment so a long transcript does not re-render on every frame.',
          'Handle pause, seek, playback-rate changes and the end of playback explicitly, and keep the highlighted element in view without hijacking the reader\'s scroll.',
        ],
        commonMiss:
          'Relying on the timeupdate event alone, which fires a few times per second, so the highlight lags and skips short words.',
        resourceLabel: 'Practice high-frequency UI updates (Premium)',
        resourcePath: '/system-design/live-chart-high-frequency-updates',
        reportedRound: { label: ELEVENLABS_BANK_LABEL, url: ELEVENLABS_BANK_URL },
      },
      {
        id: 'dubbing-review-interface',
        title: 'Design a review and collaboration interface for a voice-dubbing project',
        statement:
          'An editor manages a dubbing project in a spreadsheet today. Design the interface that replaces it: review progress across languages and lines, collect and resolve feedback, and let voice actors collaborate without overwriting each other.',
        whatThisMeasures:
          'Product decomposition, state ownership across roles, review and approval workflows, optimistic edits with conflict handling, and what to show when a job is still processing.',
        clarifyFirst: [
          'Confirm the unit of work (a line, a segment, a whole language track) and who may approve, reject or re-record it.',
          'Confirm whether generation and review happen in the same screen and what the latency of a regenerated line is.',
        ],
        strongAnswer: [
          'Model the project as entities with explicit status per line and per language, owned by one store, with comments attached to a line version rather than to free text.',
          'Separate the review queue from the editing surface so an editor can work through feedback in order.',
          'Make every long-running action visible: queued, processing, ready, failed, with a retry that does not duplicate work.',
          'Handle concurrent edits with versions and a clear conflict message instead of silent overwrites.',
        ],
        commonMiss:
          'Designing the happy path only, with no story for a failed regeneration, a stale comment or two people editing the same line.',
        resourceLabel: 'Work through the AI-assisted review flow case (Premium)',
        resourcePath: '/system-design/ai-ux-considerations',
        reportedRound: { label: ELEVENLABS_BANK_LABEL, url: ELEVENLABS_BANK_URL },
      },
      {
        id: 'fix-a-practical-react-problem',
        title: 'Fix a practical React problem live with the interviewer',
        statement:
          'You receive a small working app with a real bug: a result that lags behind the input, an effect that runs with stale values, or a request whose late response overwrites a newer one. Reproduce it, explain the cause and fix it while talking.',
        whatThisMeasures:
          'Reading unfamiliar component code, reproducing before editing, reasoning about effects, closures and request ordering, and communicating a root cause under time.',
        clarifyFirst: [
          'Ask how the bug was observed and whether you may change the component contract or only its internals.',
          'Ask whether a test exists that should go green, and how the interviewer wants decisions narrated.',
        ],
        strongAnswer: [
          'Reproduce the bug first and name the state that is wrong before touching code.',
          'Look for the usual causes: a stale closure captured by an effect or timer, a race between overlapping requests, or derived state computed from a previous result.',
          'Fix the cause with the smallest change, keep behaviour and test ids intact, and say what each edit does.',
          'Add the guard that prevents the regression, such as a latest-request check or a cleanup in the effect.',
        ],
        commonMiss:
          'Patching the symptom, for example forcing a re-render or adding a delay, while the race or stale closure stays in place.',
        resourceLabel: 'Debug the transcript player that lags behind the audio',
        resourcePath: '/react/coding/react-debug-transcript-sync',
        reportedRound: { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL },
      },
      {
        id: 'timed-assessment-react-and-algorithms',
        title: 'Clear a 90-minute technical assessment before the first call',
        statement:
          'One account describes a 90-minute technical assessment that arrives before the recruiter screen, without listing its questions. Practise a timed mix of frontend tasks and medium algorithm problems: allocate time, ship working code and move on.',
        whatThisMeasures:
          'Time allocation under a clock, clean React fundamentals without a framework crutch, and the ability to produce correct, tested code for mid-level algorithm problems.',
        clarifyFirst: [
          'Read every question first and decide the order by expected value, not by position.',
          'Check the environment: which React version, whether tests run locally and how answers are submitted.',
        ],
        strongAnswer: [
          'Give each question a time box and leave a working partial solution rather than an unfinished perfect one.',
          'For React tasks, keep state minimal and derived values computed, and handle loading, empty and error states explicitly.',
          'For algorithm problems, state the complexity, write the edge cases first and keep the code readable.',
          'Reserve the last minutes to run everything once more.',
        ],
        commonMiss:
          'Spending half the clock polishing the first React task and leaving an algorithm problem untouched.',
        resourceLabel: 'Practice the React autocomplete starter against a clock',
        resourcePath: '/react/coding/react-autocomplete-search-starter',
        reportedRound: { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the transcript highlight before writing the first line',
    intro:
      'A worked start on the open question\'s transcript highlight: four decisions to make before the first line of code, in the order an interviewer would hear them.',
    steps: [
      { title: 'Pick the time source', description: 'The timeupdate event fires a few times per second. Read currentTime inside a requestAnimationFrame loop while playing, and stop the loop on pause.' },
      { title: 'Map time to a segment', description: 'Keep start times sorted and binary-search the active index. Cache the last index so a forward step checks one neighbour first.' },
      { title: 'Render only the change', description: 'Store the active index, not a flag on every segment, so a long transcript does not re-render on each frame.' },
      { title: 'Test the edges', description: 'Seek backwards, change the playback rate, pause mid-word, reach the end, and handle a gap between two segments.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day ElevenLabs frontend interview preparation plan',
    intro: 'Seven days built around what the ElevenLabs accounts describe: media timing, versioned data, live debugging and a timed assessment.',
    days: [
      { day: 'Day 1', focus: 'Media timing: requestAnimationFrame loops, currentTime, binary search over timestamps, rendering only the active segment.', artifact: 'A transcript highlighter that survives seek and rate changes.' },
      { day: 'Day 2', focus: 'Versioned data: entities with explicit status, comments bound to versions, conflict handling.', artifact: 'A one-page state and recovery diagram for a screen several people review at once.' },
      { day: 'Day 3', focus: 'Debugging live: stale closures, overlapping requests, derived state; narrate every step.', artifact: 'The async-race fix with a written root cause.' },
      { day: 'Day 4', focus: 'Timed drills: React tasks and LeetCode-style problems in ninety minutes, the mix two Taro accounts describe for the CoderPad round.', artifact: 'Submissions with a time log.' },
      { day: 'Day 5', focus: 'Streaming playback: request identity, AbortController, media element control, status states.', artifact: 'A streaming player that ignores chunks from a cancelled request.' },
      { day: 'Day 6', focus: 'Product thinking: decompose one creator workflow into UI, API and jobs; name the failure states.', artifact: 'A written decomposition with open questions for the interviewer.' },
      { day: 'Day 7', focus: 'Mock loop: one timed assessment, one live fix, one design walkthrough, each narrated.', artifact: 'Your questions for the recruiter: which assessment you get, whether AI tools are allowed and how long the live round runs.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common ElevenLabs frontend interview preparation questions',
    items: [
      { question: 'Are these the real ElevenLabs questions?', answer: 'They are questions candidates reported on public pages, given here in our words, not leaked or confirmed ElevenLabs questions. The answer guides, the practice tasks and their test cases are FrontendAtlas\'s own.' },
      { question: 'What is the ElevenLabs coding assessment?', answer: 'A timed test that usually comes first, often before the recruiter call: about 90 minutes in three accounts from 2025 and 2026, often on CoderPad, mixing React or JavaScript tasks with LeetCode-style problems. Other loops used an asynchronous task, a take-home or a Python algorithm round. The accounts give few of the prompts, so confirm the format with the recruiter.' },
      { question: 'Do I need audio engineering knowledge?', answer: 'The reported tasks are about interface behaviour around audio and voice, such as keeping a transcript in step with playback, not signal processing. Comfort with media elements, timing and streaming matters more.' },
      { question: 'Is the loop React-specific?', answer: 'Mostly: the assessment and the live round used React in most accounts, and a 2025 take-home used TypeScript and React. One 2025 loop added a Python algorithm round. Prepare the contracts in your own framework first, then once in React.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'Free tasks for the skills the ElevenLabs rounds lean on: reading a stream, polling a long-running job, fixing a race or a stale closure, and a timed React task. None of them is a reported ElevenLabs question.',
    items: [
      { label: 'Stream to text', description: 'Read a ReadableStream chunk by chunk.', path: '/javascript/coding/js-stream-to-text' },
      { label: 'Poll until a job finishes', description: 'Timeouts and abort for long-running generation jobs.', path: '/javascript/coding/js-poll-until' },
      { label: 'Fix the async race in fetchWithCache', description: 'A late response overwrites a newer one.', path: '/javascript/debug/js-debug-async-race' },
      { label: 'Fix the stale closure in delayed autosave', description: 'An effect or timer captures an old value.', path: '/javascript/debug/js-debug-stale-closure-autosave' },
      { label: 'React autocomplete starter', description: 'A timed React task with keyboard semantics.', path: '/react/coding/react-autocomplete-search-starter' },
      { label: 'Streaming data from an AI model', description: 'Concept answer on handling streamed responses.', path: '/javascript/trivia/ai-streaming-data-handling' },
      { label: 'AI chat composer and streaming turn', description: 'A design case on stopping a streamed reply and ignoring its late events.', path: '/system-design/ai-chat-textarea-design' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: ELEVENLABS_BANK_LABEL, url: ELEVENLABS_BANK_URL, note: 'A question bank ElevenLabs candidates add to, each item marked "I was asked this". It shows which exercises candidates list; it cannot establish wording, frequency or which role each belongs to.', kind: 'report' },
      { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL, note: 'One self-reported senior account, marked in progress and not verified by Aced: a 90-minute technical assessment, then a recruiter screen, then a live round with the interviewer. One loop, still running when it was written.', kind: 'report' },
      { label: 'Public report: ElevenLabs full-stack, frontend-leaning interview account on Aced, 2025', url: 'https://www.aced.io/experiences/eleven-labs-frontend-engineer-interview-c79e72', note: 'One self-reported account, rejected: a recruiter screen, a LeetCode-style Python round in which the candidate was told not to use LLMs, a practical front-end debugging round in a small React app and a product-focused decomposition interview, with no system design.', kind: 'report' },
      { label: 'Public report: ElevenLabs full-stack engineer interview on Taro, 2024', url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-united-states-august-1-2024-no-offer-positive-675ce47d/', note: 'A technical recruiter call, a CoderPad round with React and LeetCode problems, a live React task with an engineer and a final interview the candidate did not reach. Taro dates are approximate.', kind: 'report' },
      { label: 'Public report: ElevenLabs full-stack engineer offer on Taro, 2024', url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-poland-august-1-2024-accepted-offer-positive-766f1de3/', note: 'An async LeetCode easy or medium question with a React knowledge check, a coding interview with changing constraints and a system design interview. Taro dates are approximate.', kind: 'report' },
      { label: 'Public report: ElevenLabs full-stack engineer offer on Taro, 2025', url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-united-kingdom-may-1-2025-accepted-offer-positive-8ac03948/', note: 'A take-home technical exercise in TypeScript and React, a technical interview, a product interview and a call with the CTO, over about a month. Taro dates are approximate.', kind: 'report' },
      { label: 'ElevenLabs careers', url: 'https://elevenlabs.io/careers', note: 'ElevenLabs\' own roles and teams, and an FAQ naming the steps most processes include: a pre-screen, virtual interviews, a hiring-manager conversation and a final round with a founder or Bar Raiser.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full ElevenLabs practice set',
    copy:
      'Premium unlocks the AI-assisted review flow case, the timer-manager drill and the broader company-tagged editorial set.',
    buttonLabel: 'Unlock the full ElevenLabs practice set',
    src: 'company_preview_elevenlabs',
  },
  about: [
    'ElevenLabs frontend interview preparation',
    'Audio playback and transcript synchronisation',
    'Voice-dubbing review interface design',
    'Streaming audio and text user interfaces',
  ],
  indexAnchorLabel: 'ElevenLabs frontend interview questions',
};
