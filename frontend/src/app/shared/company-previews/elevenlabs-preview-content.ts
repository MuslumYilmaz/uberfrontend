import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * ElevenLabs frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the prompts here are the answer guides of nineteen of them. The sources are public,
 * candidate-sourced pages on Taro, Aced and PracHub and a question bank ElevenLabs candidates add to on Aced. Nothing
 * here is a leaked, confirmed or official ElevenLabs question, and the accounts cannot establish a fixed loop.
 */
const ELEVENLABS_BANK_URL = 'https://www.aced.io/guides/elevenlabs-software-engineer-interview/questions';
const ELEVENLABS_BANK_LABEL = 'Public report: ElevenLabs candidate-sourced question bank on Aced, read November 2026';
const ELEVENLABS_EXPERIENCE_URL =
  'https://www.aced.io/experiences/eleven-labs-senior-frontend-engineer-interview-925c04';
const ELEVENLABS_EXPERIENCE_LABEL =
  'Public report: ElevenLabs senior full-stack (frontend-leaning) interview account on Aced, 2026';
const ELEVENLABS_TARO_2024_URL =
  'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-united-states-august-1-2024-no-offer-positive-675ce47d/';
const ELEVENLABS_TARO_2024_LABEL = 'Public report: ElevenLabs full-stack engineer interview on Taro, 2024';
const ELEVENLABS_ACED_FE_2025_URL = 'https://www.aced.io/experiences/eleven-labs-frontend-engineer-interview-c79e72';
const ELEVENLABS_ACED_FE_2025_LABEL = 'Public report: ElevenLabs full-stack, frontend-leaning interview account on Aced, 2025';
// The accounts the other answer guides are modelled on; each is a source of its question in the process data.
const ELEVENLABS_TARO_NY_2026 = {
  label: 'Public report: ElevenLabs senior software engineer interview on Taro, New York, 2026',
  url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/senior-software-engineer-new-york-new-york-january-24-2026-no-offer-neutral-ae62f4d3/',
};
const ELEVENLABS_ACED_SWE_2025 = {
  label: 'Public report: ElevenLabs software engineer interview account on Aced, 2025',
  url: 'https://www.aced.io/experiences/eleven-labs-software-engineer-interview-8e1b37',
};
const ELEVENLABS_ACED_FDE_2025 = {
  label: 'Public report: ElevenLabs forward deployed engineer interview account on Aced, 2025',
  url: 'https://www.aced.io/experiences/eleven-labs-solutions-architect-interview-ce0689',
};
const ELEVENLABS_ACED_SWE_2026 = {
  label: 'Public report: ElevenLabs software engineer interview account on Aced, 2026',
  url: 'https://www.aced.io/experiences/eleven-labs-software-engineer-interview-605512',
};
const ELEVENLABS_TARO_GROWTH_2026 = {
  label: 'Public report: ElevenLabs growth engineer interview on Taro, 2026',
  url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/growth-engineer-february-1-2026-accepted-offer-positive-b700cab8/',
};
const ELEVENLABS_TARO_LONDON_2026 = {
  label: 'Public report: ElevenLabs software engineer interview on Taro, London, 2026',
  url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/software-engineer-london-england-march-9-2026-no-offer-neutral-9f916c8f/',
};
const ELEVENLABS_PRACHUB_OA_2026 = {
  label: 'Public report: ElevenLabs software engineer assessment on PracHub, 2026',
  url: 'https://prachub.com/interview-experiences/elevenlabs-software-engineer-interview-experience-three-question-oa-with-a-surprise-2-minute-ai-follow-up',
};
const ELEVENLABS_PRACHUB_ONSITE_2026 = {
  label: 'Public report: ElevenLabs software engineer onsite on PracHub, 2026',
  url: 'https://prachub.com/interview-experiences/elevenlabs-software-engineer-interview-experience-live-coding-and-product-decomposition-onsite-rejected',
};

export const ELEVENLABS_PREVIEW_TITLE = 'ElevenLabs Frontend Interview Questions and Coding Assessment Guide';
export const ELEVENLABS_PREVIEW_H1 = 'ElevenLabs Frontend Interview Questions';
export const ELEVENLABS_PREVIEW_DESCRIPTION =
  'ElevenLabs frontend interview: the coding assessment (a timed test, sometimes on CoderPad, or a take-home), the live technical round and {#questions} reported questions.';
export const ELEVENLABS_PREVIEW_CANONICAL_PATH = '/companies/elevenlabs/preview';
export const ELEVENLABS_PREVIEW_TRUST_NOTE =
  'The questions are candidates\' public reports retold in our own wording, not leaked, confirmed or official ElevenLabs questions; the answer guides are ours. {reports} public reports show what some loops asked; anything your recruiter tells you comes first.';

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
      'Accounts from 2024 to 2026 describe a timed coding assessment that often comes before the recruiter call, an hour-long round with an engineer, a product or design round and a final conversation with the CTO or a founder. Below: how each round runs, and the {questions} questions those candidates reported. The first question is open to every reader with its answer guide, as is every question without one; the other answer guides come with Premium.',
    caveat:
      'Most accounts come from Taro and Aced and describe full-stack or general software engineering loops; none is for a purely frontend title, and the assessment\'s shape varies from loop to loop.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2024–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Study in the order the loop runs: the assessment, the live round, then product',
    paragraphs: [
      'Start with the assessment, the first technical step in most accounts. In 2026 it came before the recruiter call in four accounts: four React, JavaScript and algorithm tasks in an hour and a half with the last the hardest, two front-end and two LeetCode questions, basic React and JavaScript algorithm questions, or a 90-minute test. A 2026 software engineer had three problems with 25, 30 and 45 minutes each. Drill small React components until their loading, empty and error states come without thought, and medium LeetCode problems until one takes you about twenty minutes; the rehearsal below sets the clock.',
      'Then the live round. Three accounts from 2024, 2025 and 2026 describe a React component that talks to a voice service; in two of them the service was known only from its types and the code was never run, so the round rewards reading an interface and reasoning aloud more than typing. Other candidates built a transcript highlight into an audio player or fixed a practical problem with the interviewer. Practise saying what each method of an unfamiliar interface must do before you call it, then work the transcript and debugging tasks linked under those questions.',
      'Last, the coding tasks that cross roles, and the product round. A hierarchical permission system came up for software and backend engineers in 2024, a 2025 forward deployed engineer had folders whose permissions children inherit, and the question bank adds overrides and timestamps; a 2025 software engineering loop asked how a re-recorded line sends its file back to review, then had the same workflow redesigned as an interface. Practise a tree walk that resolves the nearest rule, a status that rolls up from line to file, and one product decomposition, from feature list to roadmap, talked through without code.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What the accounts settle, what they leave open, and what to ask',
    paragraphs: [
      'Every account used here is a candidate\'s own report of a loop from 2024 to 2026, published on Taro, Aced or PracHub (PracHub marks one of its two as curated and edited), and ElevenLabs candidates fill the Aced question bank. Most loops were full-stack or general software engineering; no account is for a purely frontend title. Together they show which rounds and questions some loops had, but rarely how a question was worded, which format runs this year or how a particular team interviews.',
      'Ask the recruiter which assessment you will get, what the live round is built on and whether AI tools are allowed; a 2025 Python round banned LLMs. The careers site lists the teams and roles, which helps with product context; its FAQ names only the usual steps (a pre-screen, virtual interviews, a hiring-manager conversation and a final round with a founder or Bar Raiser) and leaves the details to your recruiting partner.',
    ],
  },
  roundSpotlights: [
    {
      id: 'coding-assessment',
      kicker: 'Round decoder',
      title: 'ElevenLabs coding assessment and live technical round: how each one runs',
      lede: [
        'In most accounts the first technical step is a timed coding assessment, followed by a live technical round with an engineer. In several 2026 accounts the assessment came first, before the recruiter call: about 90 minutes, mixing React or JavaScript tasks with LeetCode-style problems. Earlier loops set an asynchronous task of no stated length, a take-home or a Python algorithm round.',
        'The live round is about an hour with an engineer, often in React on a small app or component. A product or design round follows in most loops, and the final conversation is usually with the CTO, a co-founder or the head of the organisation; the careers FAQ names a founder or Bar Raiser.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'The first technical step in most accounts; in several 2026 accounts the assessment arrived before the recruiter call.' },
        { label: 'Assessment', value: 'About 90 minutes in three accounts from 2025 and 2026: the two from 2026 mixed React or JavaScript tasks with LeetCode-style problems, and the 2025 one set two LeetCode problems on CoderPad. Other loops used an asynchronous task (2024), a take-home (2025) or a Python algorithm round (2025).' },
        { label: 'Live technical round', value: 'About an hour with an engineer, often in React on a small app or component; in a 2024 loop the constraints changed during the task.' },
        { label: 'What follows', value: 'A product discussion, a product decomposition or a system design interview in most loops, then usually a call with the CTO, a co-founder or the head of the organisation. A 2025 account had no system design round.' },
        { label: 'Stack', value: 'React is the safe default: most full-stack accounts set React tasks in the assessment, the live round or both, and a 2025 account calls its exercises TypeScript and React problem-solving.' },
      ],
      // Question 3 links no practice task of its own, so this free starter gives nothing of its lock away.
      practiceLink: { label: 'Rehearse the assessment with the free React autocomplete starter', path: '/react/coding/react-autocomplete-search-starter' },
      processLink: { label: 'See the coding assessment row in the reported process', fragment: 'elevenlabs-interview-process-1-stage-coding-assessment' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Full-stack, software engineering or growth and forward deployed: what each group was asked',
    intro:
      'Many accounts are from full-stack engineers, and software, backend, growth and forward deployed candidates reported rounds of their own. Start with the group your title falls in.',
    items: [
      {
        title: 'Full-stack and frontend-leaning engineers',
        description:
          'Loops from 2024 to 2026: the timed assessment, often before the recruiter call; a live round, which was a React component wired to a voice service (two senior software engineers had that round too), a transcript highlight in a React audio player or a practical problem fixed with the interviewer; a product round or a system design interview; and a final call with the CTO, a co-founder or the head of the organisation.',
        practiceFocus:
          'Small React components against a clock, reasoning from an interface\'s types without running the code, media timing, and one product decomposition.',
      },
      {
        title: 'Software and backend engineers',
        description:
          'Algorithm-heavier loops: a 2026 assessment of three problems with 25, 30 and 45 minutes each, Python coding that a 2026 London candidate said needed both strong algorithms and sophisticated Python, a hierarchical permission system to implement in 2024, merging sorted lists without duplicates, and a system design on voice chat for product search in a shop.',
        practiceFocus:
          'Medium LeetCode problems under a clock per problem, a tree of rules resolved by the nearest ancestor, and a voice search design that names its latency and failure states.',
      },
      {
        title: 'Growth and forward deployed engineers',
        description:
          'A 2026 growth hire had two conversations about experience, a product interview on adapting an ElevenLabs product to a key account and a culture call with the CTO. A 2025 forward deployed candidate had a recruiter screen, a timed coding assessment, live coding in a Google Doc, a customer-style case study and a CTO or founder interview.',
        practiceFocus: 'Product judgment out loud: who the customer is, what changes for them, and what you would build first.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for the reported ElevenLabs questions',
    intro:
      'Under each question: the accounts behind it, what to ask before you start, the points an interviewer listens for, and the mistake that sinks it most often.',
    itemListName: 'ElevenLabs answer guides',
    items: [
      {
        id: 'audio-transcript-sync',
        title: 'Synchronise audio playback with transcript highlighting',
        statement:
          'In a 2025 frontend-leaning loop the highlight logic was missing from a small React audio player, and the candidate built it with a timer. Given an audio element and a transcript with start and end times per word or segment, highlight the segment being spoken as playback runs, and keep it correct through play, pause, seek and speed changes.',
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
          'Relying on the timeupdate event alone, which browsers may fire as rarely as four times a second, so the highlight lags and skips short words.',
        resourceLabel: 'Practice high-frequency UI updates (Premium)',
        resourcePath: '/system-design/live-chart-high-frequency-updates',
        reportedRound: { label: ELEVENLABS_ACED_FE_2025_LABEL, url: ELEVENLABS_ACED_FE_2025_URL },
      },
      {
        id: 'dubbing-review-interface',
        title: 'Design a review and collaboration interface for a voice-dubbing project',
        statement:
          'An editor manages a dubbing project in a spreadsheet today. Design the interface that replaces it: review progress across languages and lines, collect and resolve feedback, and work with the voice actors who record the lines. A 2025 loop then asked for it to feel more like a video player than a document.',
        whatThisMeasures:
          'Product decomposition, state ownership across roles, review and approval workflows, optimistic edits with conflict handling, and what to show when a job is still processing.',
        clarifyFirst: [
          'Confirm the unit of work (a line, a segment, a whole language track) and who may approve, reject or re-record it.',
          'Confirm whether generation and review happen in the same screen and what the latency of a regenerated line is.',
        ],
        strongAnswer: [
          'Make review media-first: the dub plays beside the original and the transcript, and a reviewer pauses, comments at a timestamp and asks for a re-record in context. A 2025 candidate who started too document-centric had to pivot to exactly that.',
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
        title: 'Fix a practical problem live with the interviewer',
        statement:
          'A 2026 senior full-stack account, frontend-leaning, says only that the live round was coding with the interviewer to fix a practical problem; it names neither the framework nor the bug. Practise on a small app you have not seen, in React or plain JavaScript, with a real bug, such as a result that lags behind the input, an effect that runs with stale values or a request whose late response overwrites a newer one: reproduce it, explain the cause and fix it while talking.',
        whatThisMeasures:
          'Reading unfamiliar component code, reproducing before editing, reasoning about effects, closures and request ordering, and communicating a root cause under time.',
        clarifyFirst: [
          'Ask how the bug was observed and whether you may change the component contract or only its internals.',
          'Ask whether a test exists that should go green, and how the interviewer wants decisions narrated.',
        ],
        strongAnswer: [
          'Make the bug happen first, then say which value on screen is wrong and which state produced it, before editing anything.',
          'Check the usual suspects: an effect or timer holding an old value, two requests racing so the slower answer wins, or a value kept in state that should be computed from the current props.',
          'Fix the cause with the smallest change, keep behaviour and test ids intact, and say what each edit does.',
          'Add the guard that prevents the regression, such as a latest-request check or a cleanup in the effect.',
          'Say each finding in three sentences, symptom, cause and fix: "The list shows results for ca while the box says cat. The request for ca answered last and overwrote the newer one. I will tag each request and drop any answer that is not the latest."',
        ],
        commonMiss:
          'Patching the symptom, for example forcing a re-render or adding a delay, while the race or stale closure stays in place.',
        resourceLabel: 'Fix four support-reported bugs in an unfamiliar five-file repo; it comes with tests and a reference solution (Premium)',
        resourcePath: '/javascript/debug/js-debug-bug-squash-invoices',
        reportedRound: { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL },
      },
      {
        id: 'timed-assessment-react-and-algorithms',
        title: 'Clear a 90-minute technical assessment, often set before the first call',
        statement:
          'Four 2026 accounts put an assessment before the recruiter call: four React, JavaScript and algorithm tasks in an hour and a half, the last the hardest; two front-end and two LeetCode questions; basic React and JavaScript algorithm questions; and a 90-minute test. A 2024 loop sent one asynchronous LeetCode question with a React knowledge check. Practise that mix against a 90-minute clock: allocate the time, ship working code and move on.',
        whatThisMeasures:
          'Time allocation under a clock, clean React fundamentals without a library or AI to lean on, and the ability to produce correct, tested code for mid-level algorithm problems.',
        clarifyFirst: [
          'Read every question first and decide the order by expected value, not by position.',
          'Check the environment: which React version, whether tests run locally and how answers are submitted.',
        ],
        strongAnswer: [
          'Give each question a time box and leave a working partial solution rather than an unfinished perfect one.',
          'Rehearse one full set before the real one: the free React task that loads a list with loading, empty and error states, the filterable user list, then Valid Anagram (a map count) and Maze Traversal (a search through a grid), the map, queue and breadth-first mix a July 2026 assessment held. Give them 20, 20, 20 and 25 minutes, the hardest last, and keep five to run everything.',
          'When the tasks grow harder towards the end, as in the October 2026 account, give the last one the largest box and do not let the first eat into it.',
          'For React tasks, keep state minimal and derived values computed, and handle loading, empty and error states explicitly.',
          'For algorithm problems, state the complexity, write the edge cases first and keep the code readable.',
        ],
        commonMiss:
          'Spending half the clock polishing the first React task and leaving an algorithm problem untouched.',
        resourceLabel: 'Build the React autocomplete against a clock; it comes with tests and a reference solution (free)',
        resourcePath: '/react/coding/react-autocomplete-search-starter',
        reportedRound: { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL },
      },
      {
        id: 'coderpad-react-bug',
        title: 'Fix a React bug in the CoderPad round, beside three other tasks',
        statement:
          'A 2024 full-stack account lists "Fix React bug" as the first task of its CoderPad round, beside finishing a React component and two LeetCode problems, and does not describe the bug. Practise fixing a small, unfamiliar React app on your own: find the wrong behaviour, name its cause and fix it without breaking the rest.',
        whatThisMeasures:
          'Reading a small React app quickly, telling a rendering bug from a state or effect bug, and fixing the cause in minutes while three other tasks wait.',
        clarifyFirst: [
          'Read the task text and any tests before the code: they define what fixed means, and a failing test is the fastest way to reproduce the bug.',
          'Run the app once and write down the exact wrong behaviour, such as a list that does not update or a value one step behind, before you open the components.',
        ],
        strongAnswer: [
          'Check the causes a small React task usually hides: state changed in place so React sees the same reference, an effect with a missing dependency, a timer or handler holding a stale value, a handler called during render (`onClick={save()}`), and props copied into state that never update.',
          'Know each fix on sight: `items.push(item); setItems(items)` becomes `setItems([...items, item])`; an effect that reads `query` lists it in its dependencies; `onClick={save()}` becomes `onClick={save}`; and a `useState(props.value)` that must follow the prop becomes the prop itself, or a `key` that resets the component.',
          'Fix the cause with the smallest change and keep names, props and test ids as they are, so a grader that checks behaviour still finds them.',
          'If you work alone in the pad, leave one comment at the fix that names the cause, since nobody heard you find it.',
          'Box it at about fifteen minutes: the same round held a component to finish and two LeetCode problems, so move on and come back rather than sink the clock into one bug.',
        ],
        commonMiss:
          'Rewriting the component instead of finding the wrong line, which spends the time the LeetCode problems needed and can break behaviour the tests expect.',
        resourceLabel: 'Fix four reported bugs in a React search page; it comes with tests and a reference solution (Premium)',
        resourcePath: '/react/coding/react-debug-api-misuse',
        reportedRound: { label: ELEVENLABS_TARO_2024_LABEL, url: ELEVENLABS_TARO_2024_URL },
      },
      {
        id: 'finish-a-partly-written-component',
        title: 'Finish a partly written React component in the CoderPad round',
        statement:
          'A 2024 full-stack account lists "Finish React component implementation" as the second task of its CoderPad round, after fixing a React bug and before Valid Sudoku and one more LeetCode problem, and does not describe the component. Practise finishing a component someone else started: keep its structure, fill in what is missing and make it behave in every state.',
        whatThisMeasures:
          'Reading a half-built component quickly, working inside its existing props, state and markup instead of replacing them, and finishing the states a real screen needs while three other tasks wait.',
        clarifyFirst: [
          'Read the task text, the existing code and any tests before typing: the TODOs, the props the component receives and the markup already in place tell you what finished means.',
          'Check what the pad gives you: which React version, whether TypeScript is on, whether tests or a preview run, and whether you may add a file or a library.',
        ],
        strongAnswer: [
          'Run it first and list what is missing: a handler that does nothing, a state that is never set, a list that is never rendered, a request with no loading or error branch.',
          'Finish inside the existing shape: keep the component\'s name, props, class names and test ids, and add state only where nothing existing can be derived from.',
          'Cover every state a user can reach: loading, empty, an error with a way to retry and the success view, with the submit button disabled while a request runs.',
          'Keep inputs controlled, validate on submit, and show each error next to the field it belongs to.',
          'Box it at about twenty minutes: the same round held a bug fix and two LeetCode problems, so leave a working component and a note on what you would add rather than a perfect one that is half done.',
        ],
        commonMiss:
          'Deleting the starter and writing the component from scratch, which spends the clock and can break the names and test ids a grader checks.',
        resourceLabel: 'Finish a contact form from its starter: validation, a POST and its loading and error states; it comes with tests and a reference solution (Premium)',
        resourcePath: '/react/coding/react-contact-form-starter',
        reportedRound: { label: ELEVENLABS_TARO_2024_LABEL, url: ELEVENLABS_TARO_2024_URL },
      },
      {
        id: 'voice-service-from-types',
        title: 'Wire a React component to a voice service you only know from its types',
        statement:
          'Three accounts describe this live round. In 2026 a senior candidate had an hour\'s call with a senior engineer, most of it on the skeleton of a React component that renders a child they were told to assume works, plus a fake ElevenLabs service exposing a couple of methods through fake types; the task was to set the service up so the child works from the props it already has, without running any code. A 2024 account describes a text-to-speech component built the same way from type declarations, and a 2025 one a small React app calling a voice SDK.',
        whatThisMeasures:
          'Reading an unfamiliar interface and inferring its behaviour, deciding where a call belongs, modelling request state and reasoning aloud when nothing can run; the 2026 candidate found it closer to a logic puzzle than a build.',
        clarifyFirst: [
          'Read every type before writing: what each method takes and returns (a value, a promise, a stream or callbacks), what an error looks like, and which props the child expects.',
          'Ask what the types cannot tell you: can two calls overlap, does a call need cancelling, and what should the child show while it waits? The 2026 candidate describes the round as a lot of pseudocoding and asking the interviewer for more information.',
        ],
        strongAnswer: [
          'Work backwards from the child\'s props: if it takes a status, an audio URL and an error, keep exactly those in the parent and derive nothing twice.',
          'Put the call where its trigger is: in an event handler when a user action such as "speak this text" starts it, in an effect only when a change of props should.',
          'Model the request as idle, loading, ready and failed, set in one place, so the child never sees loading and an error at once.',
          'Guard against stale results: tag each call with an id or an AbortController, drop a result that is not the latest, and cancel on unmount.',
          'Trace one run aloud from the trigger to the rendered child, then the failure path; with nothing to execute, the trace is your proof.',
        ],
        commonMiss:
          'Typing in silence and guessing what a method returns; when the code never runs, the interviewer can only judge the reasoning you say out loud.',
        resourceLabel: 'Wire a speech panel to a speech service known from its types; it comes with tests and a reference solution (Premium)',
        resourcePath: '/react/coding/react-voice-service-wiring',
        reportedRound: ELEVENLABS_TARO_NY_2026,
      },
      {
        id: 'transcription-studio-roadmap',
        title: 'Turn a transcription studio for dubbing teams into a ranked roadmap, out loud',
        statement:
          'The final round of a 2025 frontend-leaning loop, which ElevenLabs called a decomposition interview: an hour, mostly verbal, on feature ideas for an audio transcription studio that dubbing teams use, how to rank them and how to turn them into a roadmap. The interviewers gave short prompts and asked about the task list view, the transcription view, authentication and roles; the candidate had expected technical decomposition and found the round much more about product.',
        whatThisMeasures:
          'Product judgment from an engineer: who uses the studio, which problems come first and how to sequence work so every release is usable, said clearly with little reaction from the other side.',
        clarifyFirst: [
          'Ask who uses the studio (transcribers, translators, reviewers, a project lead) and what slows them down today; if the answer stays short, state your assumption and carry on.',
          'Ask whether they want product thinking, technical thinking or both. The 2025 candidate never got a clear signal, so say your plan at the start and offer to go deeper on either.',
        ],
        strongAnswer: [
          'Frame the studio around its work: a project holds files, a file holds timed segments with a speaker and a status, and people are assigned segments to transcribe, translate or review.',
          'Group ideas under the views the interviewers named: the task list (what is mine, what is blocked, what is due), the transcription view (waveform, segment editing, playback that follows the text, keyboard shortcuts) and authentication with roles (who may edit, approve or export).',
          'Rank them by value to the user against effort, with one sentence of reasoning each, and name what you are leaving out.',
          'Turn the ranking into releases: first a usable loop for one team, then review and collaboration, then bulk actions and automation, each with the measure that would show it worked.',
          'Expect quiet interviewers: talk in short sections and say where you are going next instead of waiting for a reaction. The 2025 candidate would stop after a couple of minutes and sense they wanted more.',
        ],
        commonMiss: 'Waiting for the interviewers to steer, or listing features with no ranking and no first release.',
        resourceLabel: 'Turn an open prompt into users, scope and constraints with a requirements checklist (free)',
        resourcePath: '/guides/system-design-blueprint/radio-requirements',
        reportedRound: { label: ELEVENLABS_ACED_FE_2025_LABEL, url: ELEVENLABS_ACED_FE_2025_URL },
      },
      {
        id: 're-review-status-roll-up',
        title: 'Mark re-recorded dubbing lines for review and roll the status up to the file',
        statement:
          'A 2025 software engineering loop had a practical coding round on replacing a dubbing workflow\'s spreadsheet with functions: each row was a line that editors could approve or send back for changes, a line a voice actor re-recorded had to come back up for review, and the status had to propagate upward. The candidate wrote it in Python with dictionaries. The question bank lists the same workflow, with edits, reviews, approvals and re-reviews to track.',
        whatThisMeasures:
          'Modelling a small domain cleanly, keeping a derived status right after every change, and choosing between recomputing it and maintaining counts.',
        clarifyFirst: [
          'Ask for the statuses and their transitions: can an approved line go straight back to needing review, and does an editor\'s text edit count like a re-recording?',
          'Ask how far upward goes: from line to file only, or on to the language track and the project, and what a file shows while its lines disagree.',
        ],
        strongAnswer: [
          'Keep lines in a map by id, each with its file, its status and a version that every edit or re-recording raises.',
          'Make an approval name the version it approved, so a line re-recorded afterwards drops back to needing review instead of staying approved.',
          'Derive a file\'s status from its lines (approved only when every line is, needing review when any line does), and say whether you compute it on read or keep per-status counts on the file and adjust them on each change.',
          'Update the counts on every transition, including a line deleted or moved to another file, and test each transition once.',
          'Record who changed what and when; in a review workflow that history is usually the next question.',
        ],
        commonMiss:
          'Setting a file\'s status by hand and missing one transition, so a file reads approved while one of its lines still waits for review.',
        resourceLabel: 'Track takes through review and roll their statuses up to files; it comes with tests and a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-dubbing-review-status',
        reportedRound: ELEVENLABS_ACED_SWE_2025,
      },
      {
        id: 'folder-access-at-a-time',
        title: 'Decide whether a user could open a file at a given time, through inherited folder permissions',
        statement:
          'The question bank states it this way: folders allow or deny users or groups, permissions propagate down unless overridden, and each change has a timestamp, so decide whether a user had access to a file at a given time. A 2025 forward deployed candidate wrote a version without timestamps live in Python in a Google Doc, added timestamps to settle the latest change, and was asked about inheritance from parent folders and about nested folders whose permissions change over time; 2024 software and backend loops asked for a hierarchical permission system too.',
        whatThisMeasures:
          'Turning a tree and a history into one precise rule, picking structures that keep the check fast, and finding the edge case before the interviewer does; the 2025 candidate said the hard part was the inheritance case, not the syntax.',
        clarifyFirst: [
          'Ask which wins when a parent and a child folder disagree: the nearest folder, as "unless overridden" suggests, or the latest change anywhere on the path, which is how the 2025 candidate resolved it. Agree on one before you code.',
          'Ask how a user rule and a group rule on the same folder combine, whether deny beats allow, and whether group membership can change over time as well.',
          'Ask what holds when no folder on the path has a rule: denied by default?',
        ],
        strongAnswer: [
          'Store each folder\'s changes per subject, a user or a group, as a list sorted by time, each change setting allow, deny or clearing the rule.',
          'For a check at time t, walk from the file\'s folder to the root and, at each folder, binary-search the latest change at or before t for the user and for each of the user\'s groups.',
          'Apply the rule you agreed: with nearest-wins, the first folder with a rule in force decides; with latest-wins, keep the newest change seen on the whole path. A cleared rule falls through to the parent either way.',
          'Give the cost: the path length times the subjects checked times a logarithm of the changes per subject, with no scan of the whole history.',
          'Test a change made after t, an override deeper in the tree, a deny on a parent above an allow on the child, and a path with no rules at all.',
        ],
        commonMiss:
          'Coding before agreeing which rule wins when a parent and a child disagree, then rebuilding the walk when the follow-up about nested folders changing over time arrives.',
        resourceLabel: 'Check folder access at a point in time, nearest folder first; it comes with tests and a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-folder-access-over-time',
        reportedRound: ELEVENLABS_ACED_FDE_2025,
      },
      {
        id: 'spoken-prefix-with-repeats',
        title: 'Work out how much of the intended text an agent has said when its speech repeats itself',
        statement:
          'The live coding round of a November 2026 onsite, set in an AI product: the text a model generated is always right, while what the agent actually said may repeat characters, words or phrases, and the task is the longest prefix of the intended text that has been spoken. Part one was reviewing a junior\'s solution built on the longest common subsequence, which had two mistakes; part two was writing a better version, given that the speech only repeats and never drops or swaps words.',
        whatThisMeasures:
          'Reviewing someone else\'s code for both a crash and a wrong idea, then using the constraint you are given to replace a quadratic method with a linear one.',
        clarifyFirst: [
          'Ask whether to compare characters or words, and whether the answer may end in the middle of a word.',
          'Ask what to do when a repeat looks like the next words of the intended text, since then how much was said has two readings.',
        ],
        strongAnswer: [
          'In the review, name both faults. A table index that runs out of range is a crash; the account\'s other example shows a wrong idea: a common subsequence may take letters from anywhere, so for the intended "I can help you book an air ticket" and the spoken "I can can" the code answered "I can an" instead of "I can".',
          'For the rewrite, walk two pointers left to right: when the characters match, advance both; when they differ, advance only the spoken one, since the extra text must be a repeat. The intended text up to its pointer is the answer.',
          'Say why it is right: this greedy match finds the longest prefix of the intended text that appears in order inside the spoken text, in O(n + m) time and constant extra memory, where the table needed O(n × m).',
          'If the answer must end on a whole word, cut back to the last space unless the pointer stopped at a word\'s end. Comparing lists of words instead misses a stuttered letter, and the cut also stops a repeat that starts like the next word ("the the" against "the thing") from showing "the th".',
          'Test no repeats, a repeat at the start, a repeat at the very end ("I can can"), a stuttered letter and an empty spoken text.',
        ],
        commonMiss:
          'Fixing the out-of-range index and keeping the subsequence table, which still returns words from later in the text because a common subsequence need not be a prefix.',
        resourceLabel: 'Review a junior\'s caption code, then rewrite it in one pass; it comes with a sample review, tests and a reference solution (Premium)',
        resourcePath: '/javascript/debug/js-debug-spoken-prefix-review',
        reportedRound: ELEVENLABS_PRACHUB_ONSITE_2026,
      },
      {
        id: 'adapt-product-for-key-account',
        title: 'Adapt an ElevenLabs product for a kind of key account',
        statement:
          'A 2026 growth engineer, who got the offer, had one product interview about an ElevenLabs use case and gives its question: how would you adapt this ElevenLabs product to be used by this kind of key account? The account names neither the product nor the customer, so expect the interviewer to set both.',
        whatThisMeasures:
          'Product sense aimed at one customer: finding out what a large account needs, deciding what to change and what to leave, and saying how you would know it worked.',
        clarifyFirst: [
          'Ask what the account does with the product today or wants to, how large it is, and what blocks it: compliance, languages, volume, its own tools or control over who can do what.',
          'Ask what success means for the account and for ElevenLabs: a signed contract, steady usage or fewer support requests.',
        ],
        strongAnswer: [
          'Restate the account\'s job in one sentence before proposing anything.',
          'Sort the changes into settings the product already has, small features other accounts would use too, and one-off work you would avoid or price separately.',
          'For a large team, cover what such accounts usually need: single sign-on, workspaces with roles and approvals, usage limits and reports, and an API for their own pipeline.',
          'Choose the first change that unblocks the account and the number you would watch, then the follow-ups.',
          'Work one example through if the interviewer leaves it open; this one is ours, not the account\'s. Dubbing for a streaming service that localises its back catalogue into ten languages: the job is hundreds of hours a month by a release date; the blockers are its own linguists who must review, character names that must stay the same in every episode, and a budget per title; the first change is a review queue its linguists sign into with single sign-on, plus a glossary per series; the number is hours delivered per week without a re-record.',
          'Use the product before the interview, so your example rests on a workflow you have tried rather than on its marketing page.',
        ],
        commonMiss:
          'Listing features before asking who the account is and what it is trying to do, or promising a custom build that no other customer will use.',
        resourceLabel: 'Use a requirements checklist to find out what the account needs before proposing anything (free)',
        resourcePath: '/guides/system-design-blueprint/radio-requirements',
        reportedRound: ELEVENLABS_TARO_GROWTH_2026,
      },
      {
        id: 'voice-shopping-search-design',
        title: 'Design voice chat that helps shoppers find products',
        statement:
          'Two 2026 accounts. A London software engineer had system design on voice chat for retail product search and said they overcomplicated it while the interviewers wanted something simple. A November onsite\'s open product decomposition round asked for a voice chat system on a retailer\'s website; the candidate kept asking what it should look like, and the rejection named gaps in AI fluency and product design.',
        whatThisMeasures:
          'Product decomposition with a model in the loop: choosing the simplest loop that works, saying where the model sits and what it may not do, and designing the states a voice interface needs.',
        clarifyFirst: [
          'Ask a few framing questions, then state your own assumptions once the interviewer hands the question back: web or app, voice alone or voice with a screen, and how far the assistant goes (finding products, comparing them, adding to the basket).',
          'Ask what the catalogue can be searched by (attributes, stock, prices) and how soon an answer must start.',
        ],
        strongAnswer: [
          'Say the simple loop first: the shopper holds a button and speaks, the speech becomes text, a model turns it into a search with fields such as category, size, colour and price, the catalogue answers, and the assistant reads a short summary while the results appear on screen.',
          'Name the model\'s limits: it fills the search fields and words the answer from real results, never invents a product, price or stock level, and asks before anything that changes the basket.',
          'Design the states: listening with a live transcript, thinking, speaking, results, and the failures (a blocked microphone, nothing heard, nothing found, a dropped connection), each with a way to type instead.',
          'Keep the conversation: a follow-up such as "cheaper" or "in blue" edits the current filters instead of starting over, and the shopper can talk over the voice to stop it.',
          'Only then scale it: stream speech both ways to cut waiting, cache common searches, and measure how often a spoken search ends in a product view.',
        ],
        commonMiss:
          'Designing a large system before a simple working loop, or waiting for the interviewer to define the product; one candidate said they overcomplicated it, the other kept asking what it should look like.',
        resourceLabel: 'Design an AI voice shopping assistant: phases, a model that only fills search fields, and a typed path (Premium)',
        resourcePath: '/system-design/ai-voice-shopping-assistant',
        reportedRound: ELEVENLABS_TARO_LONDON_2026,
      },
      {
        id: 'next-larger-with-no-shared-digit',
        title: 'Find the next number above n that shares no digit with it',
        statement:
          'The first of three timed problems in a September 2026 assessment, with 25 minutes for it. PracHub gives the problem only in its own summary: the next number larger than n that shares no digit with n, where n is below 2³¹ and the answer can be -1.',
        whatThisMeasures:
          'Seeing that the answer can be built digit by digit instead of searched for, and handling the step to one more digit and the leading zero.',
        clarifyFirst: [
          'Ask when the answer is -1: when no such number exists, or also when it would not fit in a 32-bit integer.',
          'Ask whether n can be 0 or negative.',
        ],
        strongAnswer: [
          'Collect the allowed digits, the ten digits minus those in n; if none are left, there is no answer.',
          'Every digit of the answer differs from the digit of n in the same place, so an answer as long as n must beat n at its first digit: take the smallest allowed digit greater than n\'s first digit, then fill the rest with the smallest allowed digit.',
          'If no allowed digit beats n\'s first digit, the answer has one more digit: the smallest allowed digit other than 0, then the smallest allowed digit in each of the other places. If 0 is the only allowed digit, there is no answer.',
          'Check the result against the limit you agreed, and give the cost: a fixed amount of work per digit of n.',
          'Test n = 9 (answer 10), n = 23 (answer 40), n = 89 (answer 100), a number that uses all ten digits, and one that leaves only 0.',
        ],
        commonMiss:
          'Counting upward from n until a number qualifies: for n = 1,000,000,000 the first one is 2,222,222,222, more than a billion steps away and above 2³¹ anyway.',
        resourceLabel: 'Revise the algorithm patterns frontend assessments use (free)',
        resourcePath: '/guides/interview-blueprint/dsa-for-fe',
        reportedRound: ELEVENLABS_PRACHUB_OA_2026,
      },
      {
        id: 'fewest-stones-after-merging',
        title: 'Merge stones of equal level and leave as few as possible',
        statement:
          'The second problem of the September 2026 assessment, with 30 minutes, known only from PracHub\'s summary: stones of the same level merge into one stone of the next level, and the task is the fewest stones that can remain.',
        whatThisMeasures:
          'Finding the invariant behind a merging game instead of simulating every order, and asking for the one rule that decides the method.',
        clarifyFirst: [
          'Ask whether any two stones of the same level can merge, or only neighbours in a row; the answer changes the method completely.',
          'Ask whether two stones make one of the next level, as the summary suggests, and whether levels have a ceiling.',
        ],
        strongAnswer: [
          'If any two equal stones may merge, order does not matter: count the stones per level and carry pairs upward like binary addition (the next level gains half the count, rounded down, and the remainder stays). The answer is the sum of the remainders, in time linear in the stones plus the levels.',
          'If only neighbours may merge, order matters and merging the first pair you see can lose: in levels [1, 1, 1, 2], merging the first two leaves three stones, merging the second and third leaves two. Describe a dynamic programme over ranges, which ranges can collapse into one stone and of which level, then the fewest pieces the row splits into, and give its cubic cost before writing it.',
          'Test one stone, stones all of one level, levels with gaps, and a merge that creates a new pair, such as two stones of level 1 beside one of level 2.',
        ],
        commonMiss:
          'Simulating merges in one fixed order, which gives a wrong count when only neighbours can merge and is needless work when any pair can.',
        resourceLabel: 'Revise the algorithm patterns frontend assessments use (free)',
        resourcePath: '/guides/interview-blueprint/dsa-for-fe',
        reportedRound: ELEVENLABS_PRACHUB_OA_2026,
      },
      {
        id: 'cheapest-shirt-colours',
        title: 'Pick a shirt colour for each day at the lowest cost, never the same colour twice in a row',
        statement:
          'The last and longest problem of the September 2026 assessment, with 45 minutes, known only from PracHub\'s summary: over n days, choose a shirt colour for each day at the lowest total cost with no colour on two days running. The page\'s title adds a surprise two-minute AI follow-up after the assessment.',
        whatThisMeasures:
          'Recognising a small dynamic programme, cutting each day from k² to k work, and explaining any step of it in a sentence.',
        clarifyFirst: [
          'Ask for the input: a cost per day and colour, or one cost per colour, and how many colours there are.',
          'Ask whether to return the cost or the colours, and what to return for zero days or for one colour over several days.',
        ],
        strongAnswer: [
          'Let best[c] be the cheapest total so far when today\'s colour is c: today\'s cost of c plus the smallest of yesterday\'s totals over every other colour.',
          'Taking that minimum afresh for each colour costs k² per day; keep yesterday\'s smallest and second-smallest totals and the colour of the smallest, and each day costs k, so the run is O(n × k) with O(k) memory.',
          'With one colour and more than one day there is no valid plan; with one cost per colour whatever the day, the answer alternates the two cheapest colours, starting with the cheaper.',
          'Keep each day\'s choice if the colours must be returned, and walk back from the last day.',
          'Name each step as you write it: the 2026 account\'s title mentions a surprise two-minute AI follow-up after the assessment.',
        ],
        commonMiss:
          'Taking the cheapest colour each day on its own, which breaks when that colour is cheapest two days running and can cost more overall than the right plan.',
        resourceLabel: 'Revise the algorithm patterns frontend assessments use (free)',
        resourcePath: '/guides/interview-blueprint/dsa-for-fe',
        reportedRound: ELEVENLABS_PRACHUB_OA_2026,
      },
      {
        id: 'maps-queues-breadth-first',
        title: 'Clear three assessment problems on maps, queues and breadth-first search',
        statement:
          'A July 2026 software engineer account describes its assessment as three parts with one question each, the first two easy and the last medium to hard, on maps, queues and breadth-first traversal; it gives none of the problems. Practise the three patterns until the easy ones take minutes, so the last problem gets most of the clock.',
        whatThisMeasures:
          'Picking the right structure fast (a map for counts and lookups, a queue for order, breadth-first search for levels and shortest paths) and writing it without the visited-set and boundary mistakes that cost the hard part.',
        clarifyFirst: [
          'Check the input size first: it tells you whether one map lookup per item is enough and whether the queue must avoid copying.',
          'For a graph or a grid, settle the moves (four or eight directions), what blocks a step, and what to return when the target cannot be reached.',
        ],
        strongAnswer: [
          'Maps: count, group and look up in one pass (`counts.set(key, (counts.get(key) ?? 0) + 1)`), and give the cost: linear time, and memory for the distinct keys.',
          'Queues: in JavaScript `shift()` moves every remaining element, so keep an array with a head index, or two stacks, to make each dequeue constant time.',
          'Breadth-first search: mark a node visited when you enqueue it, not when you dequeue it, and process the queue one level at a time to get the shortest distance in steps.',
          'On a grid, check the bounds before reading a neighbour, and when several cells start the spread, put them all in the queue at the start.',
          'Aim to finish each easy part in about ten minutes and keep the rest of the clock for the last one; test an empty input, a single node, an unreachable target and a cycle.',
        ],
        commonMiss:
          'Marking a cell visited only when it leaves the queue, which lets the same cell enter from several neighbours, multiplies the work and can time out the last problem.',
        resourceLabel: 'Find a path through a grid maze with breadth-first search; it comes with tests and a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-maze-path',
        reportedRound: ELEVENLABS_ACED_SWE_2026,
      },
      {
        id: 'merge-sorted-and-dedupe',
        title: 'Merge sorted lists into one without duplicates',
        statement:
          'From a 2026 London software engineer\'s loop, whose coding the candidate said needed both strong algorithms and sophisticated Python: merge sorted lists and drop the duplicates. The same account lists an asynchronous database-processing question and the voice chat design for product search.',
        whatThisMeasures:
          'The two-pointer merge written cleanly, its extension to many lists, and idiomatic code in the language you choose.',
        clarifyFirst: [
          'Ask how many lists there are, two or k of them, and how long they get.',
          'Ask whether duplicates inside one list count as well, and whether to return a new list or a stream.',
        ],
        strongAnswer: [
          'For two lists, walk two indexes and append the smaller head, skipping a value equal to the last one appended; that drops duplicates within each list and across them.',
          'For k lists, keep a min-heap of each list\'s current head: pop the smallest, append it unless it equals the last value out, and push that list\'s next value, for O(N log k) over N values.',
          'In Python, `heapq.merge` does the k-way merge lazily and a check against the last value finishes it in a few lines; be ready to write the loop yourself if asked.',
          'Test empty lists, one list running out first, every value equal, and negative numbers.',
        ],
        commonMiss:
          'Concatenating, sorting and deduplicating with a set, which throws away the order the input already has and costs O(N log N).',
        resourceLabel: 'Merge two sorted arrays; it comes with tests and a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-merge-sorted-arrays',
        reportedRound: ELEVENLABS_TARO_LONDON_2026,
      },
      {
        id: 'longest-run-without-repeats',
        title: 'Find the longest stretch of a string with no repeated character',
        statement:
          'Listed in the ElevenLabs question bank as asked, with no round or date. It is the classic longest substring without repeating characters, which many other companies ask too.',
        whatThisMeasures: 'The sliding window: two ends that only move forward, and why that makes the work linear.',
        clarifyFirst: [
          'Ask whether to return the length or the substring, and which characters can appear (ASCII or any Unicode text).',
          'Ask what an empty string should return.',
        ],
        strongAnswer: [
          'Keep a window with no repeats, from left to the current index, and a map from each character to the last index it was seen at.',
          'When the current character was last seen at or after left, move left to just past that index, never backwards.',
          'Update the best length at each step; every index enters and leaves the window once, so the run is O(n) with memory bounded by the alphabet.',
          'For Unicode text, step through code points (`for…of` in JavaScript) rather than UTF-16 units, or an emoji counts as two characters.',
          'Test "abcabcbb" (3), "bbbbb" (1), "pwwkew" (3), "abba" (2, which catches a left edge moved backwards) and the empty string.',
        ],
        commonMiss:
          'Restarting the window at each repeat, which is quadratic, or moving the left edge back to an older index, which counts "abba" as 3.',
        resourceLabel: 'Write the sliding window against tests, with a reference solution to compare (Premium)',
        resourcePath: '/javascript/coding/js-longest-substring-without-repeating',
        reportedRound: { label: ELEVENLABS_BANK_LABEL, url: ELEVENLABS_BANK_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Rehearse the timed assessment on one clock',
    intro:
      'Accounts from 2026 describe the assessment as a mix of React, JavaScript and LeetCode-style tasks against a clock. Sit that shape once at home before the real one arrives.',
    steps: [
      { title: 'Pick four tasks you have not seen', description: 'Two React tasks and two algorithm problems, the second harder than the first; the set in question 3\'s answer guide fits if you have not seen it. Unseen tasks make the clock measure reading as well as writing.' },
      { title: 'Read all four first', description: 'Spend the first five minutes on the four statements and choose the order: open with the task you are surest to finish, and save the hardest for when the others pass.' },
      { title: 'Box the time', description: 'Give each task about twenty minutes and keep the last five for one more run of everything. When a box runs out, leave the task in a state that runs and switch.' },
      { title: 'Work without help', description: 'Rehearse with no AI tools unless the recruiter allows them; a 2025 Python round banned LLMs, so ask before you rely on one.' },
      { title: 'Find the stall', description: 'Write down how long each task ran and where you stopped making progress. That point, not the whole set, is what to drill before the real assessment.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day ElevenLabs frontend interview preparation plan',
    intro: 'Seven days built around what the ElevenLabs accounts describe: media timing, shared review screens, live debugging and a timed assessment.',
    days: [
      { day: 'Day 1', focus: 'Media timing: requestAnimationFrame loops, currentTime, binary search over timestamps, rendering only the active segment.', artifact: 'A transcript highlighter that survives seek and rate changes.' },
      { day: 'Day 2', focus: 'Shared review screens: work several people change, and what each screen shows while it changes.', artifact: 'A one-page state and recovery diagram for a screen several people review at once.' },
      { day: 'Day 3', focus: 'Debugging live: reproduce first, name the root cause, then fix it; narrate every step.', artifact: 'The async-race fix with a written root cause.' },
      { day: 'Day 4', focus: 'Timed drills: React tasks and LeetCode-style problems in ninety minutes, the mix two 2026 accounts describe.', artifact: 'Submissions with a time log.' },
      { day: 'Day 5', focus: 'Streaming playback: request identity, AbortController, media element control, status states.', artifact: 'A streaming player that ignores chunks from a cancelled request.' },
      { day: 'Day 6', focus: 'Product thinking: decompose one creator workflow into UI, API and jobs; name the failure states.', artifact: 'A written decomposition with open questions for the interviewer.' },
      { day: 'Day 7', focus: 'Mock loop: one timed assessment, one live fix, one design walkthrough, each narrated.', artifact: 'Your questions for the recruiter: which assessment you get, whether AI tools are allowed and how long the live round runs.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common ElevenLabs frontend interview preparation questions',
    items: [
      { question: 'Are these the real ElevenLabs questions?', answer: 'Candidates reported each of them on a public page; the wording here is ours. None is an official or confirmed ElevenLabs question, and none came from a leak. FrontendAtlas wrote the answer guides, the practice tasks and their tests.' },
      { question: 'What is the ElevenLabs coding assessment?', answer: 'A timed test that is usually the first technical step, in several 2026 accounts before the recruiter call: about 90 minutes in three accounts from 2025 and 2026, with React or JavaScript tasks beside LeetCode-style problems in the two from 2026. CoderPad is the only assessment tool the accounts name. Other loops used an asynchronous task, a take-home or a Python algorithm round. The accounts give few of the prompts, so confirm the format with the recruiter.' },
      { question: 'Do I need audio engineering knowledge?', answer: 'The reported audio and voice tasks are about interface behaviour, such as keeping a transcript in step with playback, not signal processing. Comfort with media elements, timing and streaming matters more.' },
      { question: 'Is the loop React-specific?', answer: 'Mostly: most full-stack accounts set React tasks in the assessment or the live round, and a 2025 account calls its exercises TypeScript and React problem-solving. One 2025 loop added a Python algorithm round. If React is not your daily framework, practise the reported tasks in React before the loop.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free tasks for skills near the ElevenLabs rounds',
    intro:
      'Free tasks for skills near the ElevenLabs rounds: reading a stream, polling a long-running job, fixing a race or a stale closure, a timed React task and handling streamed AI output. None of them is a reported question or a locked question\'s practice task.',
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
    intro: 'Each link below is a source this guide draws on; its note says what that source shows and where it stops.',
    items: [
      { label: ELEVENLABS_BANK_LABEL, url: ELEVENLABS_BANK_URL, note: 'A question bank ElevenLabs candidates add to. It shows which exercises candidates list, with role labels and interview counts that candidates supply; it cannot establish wording or how often each is really asked.', kind: 'report' },
      { label: ELEVENLABS_EXPERIENCE_LABEL, url: ELEVENLABS_EXPERIENCE_URL, note: 'One self-reported senior account, marked in progress and not verified by Aced: a 90-minute technical assessment, then a recruiter screen, then a live round with the interviewer. One loop, still running when it was written.', kind: 'report' },
      { label: ELEVENLABS_ACED_FE_2025_LABEL, url: ELEVENLABS_ACED_FE_2025_URL, note: 'One self-reported account, rejected: a recruiter screen, a LeetCode-style Python round in which the candidate was told not to use LLMs, a practical front-end debugging round in a small React app and a product-focused decomposition interview, with no system design.', kind: 'report' },
      { label: ELEVENLABS_TARO_2024_LABEL, url: ELEVENLABS_TARO_2024_URL, note: 'A technical recruiter call, a CoderPad round with React and LeetCode problems, a live React task with an engineer and a final interview the candidate did not reach. Taro dates are approximate.', kind: 'report' },
      { label: 'Public report: ElevenLabs full-stack engineer offer on Taro, 2024', url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-poland-august-1-2024-accepted-offer-positive-766f1de3/', note: 'An async LeetCode easy or medium question with a React knowledge check, a coding interview with changing constraints and a system design interview. Taro dates are approximate.', kind: 'report' },
      { label: 'Public report: ElevenLabs full-stack engineer offer on Taro, 2025', url: 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-united-kingdom-may-1-2025-accepted-offer-positive-8ac03948/', note: 'A take-home technical exercise, a technical interview, a product interview and a call with the CTO, over about a month; the candidate calls the exercises fairly typical TypeScript and React problem-solving. Taro dates are approximate.', kind: 'report' },
      { label: 'ElevenLabs careers', url: 'https://elevenlabs.io/careers', note: 'ElevenLabs\' own roles and teams, and an FAQ naming the steps most processes include: a pre-screen, virtual interviews, a hiring-manager conversation and a final round with a founder or Bar Raiser.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full ElevenLabs practice set',
    copy:
      'Premium unlocks every reported question with its answer guide and practice task, and the broader company-tagged set.',
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
