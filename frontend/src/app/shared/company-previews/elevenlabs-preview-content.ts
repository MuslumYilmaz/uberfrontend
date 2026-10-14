import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * ElevenLabs frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on two
 * public, candidate-sourced pages on Aced (a question bank updated by ElevenLabs candidates and one senior
 * full-stack, frontend-leaning interview account). Nothing here is a leaked, confirmed or official
 * ElevenLabs question, and two pages cannot establish a fixed loop.
 */
const ELEVENLABS_BANK_URL = 'https://www.aced.io/guides/elevenlabs-software-engineer-interview/questions';
const ELEVENLABS_BANK_LABEL = 'Public report: ElevenLabs candidate-sourced question bank on Aced, October 2026';
const ELEVENLABS_EXPERIENCE_URL =
  'https://www.aced.io/experiences/eleven-labs-senior-frontend-engineer-interview-925c04';
const ELEVENLABS_EXPERIENCE_LABEL =
  'Public report: ElevenLabs senior full-stack (frontend-leaning) interview account on Aced, 2026';

export const ELEVENLABS_PREVIEW_TITLE = 'ElevenLabs Frontend Interview Questions: 5 Prompts + Guide';
export const ELEVENLABS_PREVIEW_H1 = 'ElevenLabs Frontend Interview Questions';
export const ELEVENLABS_PREVIEW_DESCRIPTION =
  'Prepare for an ElevenLabs frontend interview with 5 prompts modelled on public reports: audio-transcript sync, dubbing review UI, live fix, timed assessment.';
export const ELEVENLABS_PREVIEW_CANONICAL_PATH = '/companies/elevenlabs/preview';
export const ELEVENLABS_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official ElevenLabs questions. Two public pages cannot establish a fixed loop; use recruiter-provided material as the source of truth.';

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
      'Prepare with five practice prompts shaped by two public candidate pages: synchronising audio playback with transcript highlighting, designing a review interface for a voice-dubbing project, fixing a practical React problem live, clearing a 90-minute assessment that mixes React tasks with medium algorithms, and streaming generated audio and text to the screen.',
    caveat:
      'This guide uses public, candidate-sourced pages to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every ElevenLabs team.',
    chips: ['5 practice prompts', 'React, audio UI, product design', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not ElevenLabs trivia',
    paragraphs: [
      'The public accounts reward engineers who can make a media interface truthful under time: a highlight that follows playback without drifting, a review screen that keeps an editor and voice actors in sync, a fix that addresses the cause of a bug rather than its symptom. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'The senior account describes a timed assessment of four questions in about 90 minutes, mixing React tasks with medium algorithm problems, followed by a live session fixing a practical problem with the interviewer. Practice both shapes with a clock running, and narrate your decisions while you type.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public pages establish, and what you still need to confirm',
    paragraphs: [
      'Two public pages on Aced inform this guide: a question bank updated by ElevenLabs candidates that lists the audio-transcript synchronisation exercise and the voice-dubbing review prompt alongside classic algorithm problems and behavioural questions, and one senior full-stack, frontend-leaning account describing a recruiter screen, a 90-minute four-question assessment and a live practical fix. They establish that those exercises and that shape occurred; they do not establish exact wording, the current format, or how other teams interview.',
      'Confirm the exercise types, the allowed tools, the expected stack and the timing with the recruiter and the job description. ElevenLabs publishes its roles on its careers site; use that for product context, not as evidence of interview content.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the public prompts and the kinds of screens an AI voice company runs, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
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
    title: 'Five ElevenLabs frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Prompts modelled on a public report link to it; the fifth prompt is derived from the product domain and carries no report.',
    itemListName: 'Five ElevenLabs frontend interview practice prompts',
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
        resourceLabel: 'Fix the async race in fetchWithCache',
        resourcePath: '/javascript/debug/js-debug-async-race',
        reportedRound: { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL },
      },
      {
        id: 'timed-assessment-react-and-algorithms',
        title: 'Clear a timed assessment that mixes React tasks with medium algorithms',
        statement:
          'Four questions in about ninety minutes: React tasks alongside medium algorithm problems such as reversing a linked list or finding the longest substring without repeating characters. Allocate time, ship working code and move on.',
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
      {
        id: 'streaming-audio-and-text-ui',
        title: 'Stream generated audio and text to the screen without losing control',
        statement:
          'Build the playback surface for a text-to-speech request: start playing as chunks arrive, show the text being voiced, let the user stop or regenerate, and never let a late chunk from an old request reach the new one. This prompt is derived from the product domain, not from a public report.',
        whatThisMeasures:
          'Streaming reads, request identity and cancellation, media element control, and truthful status while a generation is in flight.',
        clarifyFirst: [
          'Confirm the transport and chunk format, and whether playback may start before the whole file exists.',
          'Confirm what Stop must guarantee: a server-side cancel or only a local abort with partial audio kept.',
        ],
        strongAnswer: [
          'Give every generation request a stable identity and ignore chunks whose request is no longer active.',
          'Use an AbortController for cancellation and release media resources on stop or unmount.',
          'Keep play, pause and seek controls usable from the keyboard and announce status changes to assistive technology.',
          'Show queued, streaming, done and failed states, and make regenerate reuse the same request id to avoid duplicate work.',
        ],
        commonMiss:
          'Appending chunks to the player without checking which request they belong to, so a regenerated line plays two voices.',
        resourceLabel: 'Practice reading a stream to text',
        resourcePath: '/javascript/coding/js-stream-to-text',
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the transcript highlight before writing the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the contract toward the loop, and say each decision out loud.',
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
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Media timing: requestAnimationFrame loops, currentTime, binary search over timestamps, rendering only the active segment.', artifact: 'A transcript highlighter that survives seek and rate changes.' },
      { day: 'Day 2', focus: 'Review workflows: entities with explicit status, comments bound to versions, conflict handling.', artifact: 'A one-page state and recovery diagram for a dubbing review screen.' },
      { day: 'Day 3', focus: 'Debugging live: stale closures, overlapping requests, derived state; narrate every step.', artifact: 'The async-race fix with a written root cause.' },
      { day: 'Day 4', focus: 'Timed drills: two React tasks and two medium algorithm problems in ninety minutes.', artifact: 'Four submissions with a time log.' },
      { day: 'Day 5', focus: 'Streaming playback: request identity, AbortController, media element control, status states.', artifact: 'A streaming player that ignores chunks from a cancelled request.' },
      { day: 'Day 6', focus: 'Product thinking: decompose one creator workflow into UI, API and jobs; name the failure states.', artifact: 'A written decomposition with open questions for the interviewer.' },
      { day: 'Day 7', focus: 'Mock loop: one timed assessment, one live fix, one design walkthrough, each narrated.', artifact: 'A list of the questions you will ask the recruiter about format, tools and stack.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common ElevenLabs frontend interview preparation questions',
    items: [
      { question: 'Are these the real ElevenLabs questions?', answer: 'No. They are FrontendAtlas practice versions modelled on prompts listed in a candidate-sourced bank and on one senior interview account. The wording, the data and the test cases are ours.' },
      { question: 'How long is the assessment?', answer: 'One public account describes about ninety minutes for four questions mixing React tasks with medium algorithm problems. One account cannot establish the current format; confirm it with the recruiter.' },
      { question: 'Do I need audio engineering knowledge?', answer: 'The public prompts are about interface behaviour around audio: synchronising a highlight with playback and reviewing dubbing work. Comfort with media elements, timing and streaming matters more than signal processing.' },
      { question: 'Is the loop React-specific?', answer: 'The public account mentions React tasks and the senior role was titled full-stack, frontend-leaning. Prepare the same contracts in your own framework first, then once in React.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the streaming, timing, debugging and communication skills used by the practice prompts. They are supporting drills, not claimed ElevenLabs questions.',
    items: [
      { label: 'Stream to text', description: 'Read a ReadableStream chunk by chunk.', path: '/javascript/coding/js-stream-to-text' },
      { label: 'Poll until a job finishes', description: 'Timeouts and abort for long-running generation jobs.', path: '/javascript/coding/js-poll-until' },
      { label: 'Fix the async race in fetchWithCache', description: 'A late response overwrites a newer one.', path: '/javascript/debug/js-debug-async-race' },
      { label: 'Fix the stale closure in delayed autosave', description: 'An effect or timer captures an old value.', path: '/javascript/debug/js-debug-stale-closure-autosave' },
      { label: 'React autocomplete starter', description: 'A timed React task with keyboard semantics.', path: '/react/coding/react-autocomplete-search-starter' },
      { label: 'Streaming data from an AI model', description: 'Concept answer on handling streamed responses.', path: '/javascript/trivia/ai-streaming-data-handling' },
      { label: 'AI chat composer and streaming turn', description: 'System design case for Send, Stop and stale stream events.', path: '/system-design/ai-chat-textarea-design' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: ELEVENLABS_BANK_LABEL, url: ELEVENLABS_BANK_URL, note: 'A question bank marked as updated by ElevenLabs candidates. It establishes that the audio-transcript synchronisation exercise and the voice-dubbing review prompt were listed; it cannot establish wording, frequency or which role each belongs to.', kind: 'report' },
      { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL, note: 'One self-reported senior account: recruiter screen, a 90-minute four-question assessment mixing React tasks and medium algorithms, then a live practical fix. It cannot establish the current format or the loops of other teams.', kind: 'report' },
      { label: 'ElevenLabs careers', url: 'https://elevenlabs.io/careers', note: 'Official roles and teams for product context only, not evidence of interview content or format.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full ElevenLabs practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the AI-assisted review flow case, the timer-manager drill and the broader company-tagged editorial set.',
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
