import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Verkada frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts), and the prompts here are the answer guides of its six locked rows. The guide
 * names no source (`sourceDisplay: 'year'`): the rows and rounds show the years their accounts give, and the method
 * note says how the questions were collected. The take-homes known only from solutions candidates published are
 * described in a decoder, in our own words, with no brief, data or design file. Open sections (decoders, FAQ, free
 * practice, plan days) name a locked row by its topic only and never link its practice task. Nothing here is a
 * leaked, confirmed or official Verkada question.
 */
export const VERKADA_PREVIEW_TITLE = 'Verkada Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const VERKADA_PREVIEW_H1 = 'Verkada Frontend Interview Questions';
export const VERKADA_PREVIEW_DESCRIPTION =
  'Verkada frontend interview: a video player built from still frames, a UI from a design file, a grid to select from and {#questions} reported questions.';
export const VERKADA_PREVIEW_CANONICAL_PATH = '/companies/verkada/preview';
export const VERKADA_PREVIEW_TRUST_NOTE =
  "Each row traces to a candidate's own account of a Verkada loop or, when the row says so, to a question bank. We retell every account in our own words without adding to it. Nothing here is leaked, Verkada has confirmed nothing, and the answer guides are written by FrontendAtlas. Most accounts cover a single round, so a row tells you what one candidate met in one year.";

export const VERKADA_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'verkada',
  label: 'Verkada',
  title: VERKADA_PREVIEW_TITLE,
  h1: VERKADA_PREVIEW_H1,
  description: VERKADA_PREVIEW_DESCRIPTION,
  canonicalPath: VERKADA_PREVIEW_CANONICAL_PATH,
  trustNote: VERKADA_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Verkada prep guide',
    subtitle:
      'Frontend accounts from 2023 to 2026 describe a recruiter call, a live coding screen on video and an onsite at the San Mateo office, and most screens reported in 2025 asked for a video player built from still frames. Below the table sit {questions} reported questions; the ones that name only a topic are open.',
    caveat:
      'Most 2025 and 2026 accounts are short posts about one coding round, and among the loops that reached an onsite, the newest to name a question is from 2024. No intern or new-grad frontend account could be read, and the take-homes that candidates published solutions for end in 2024.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2019–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Make the frame player dull, then style a screen from a design',
    paragraphs: [
      'Start with the frame player. Five candidates who posted in 2025, from a mid-level engineer to two with ten years of experience, say they were asked for a version of it in a phone screen or technical interview: a video player built from still frames with Play, Pause and a start from any frame, sometimes with a timeline of markers or a control bar, and once its controller alone, on timers and closures. Build it until the timer logic is dull: one timer however often Play is pressed, the current frame read fresh inside the timer, a defined stop at the last frame, a jump that keeps playing, and every timer cleared on pause and on unmount.',
      "Then build a screen from a design file and give the styling real time. From 2023 to 2025, screens in the United States and frontend interviews in Canada asked for a small UI built from a design file or in a timed session; the 2023 screen added basic interactions such as click handlers and allowed React or a framework of your choice. The 2023 senior candidate had the layout generally in place but not all of the styling details and heard nothing back, and the 2024 candidate's advice is to practise CSS and styling. Rehearse reading spacing, type and colour off a spec, getting the layout right before the details, and saying aloud what you would finish with ten more minutes.",
      'For the onsite, prepare a grid to select from, a camera grid to design and broken code to fix. The 2024 loop asked for a grid with cell selection; the 2023 loop asked for a way to select a rectangular area in a grid, the frontend architecture of a camera display grid, broken JavaScript and, mostly, questions on React. In 2025 a candidate preparing for a frontend onsite wrote that it has one algorithm round, so keep a medium problem or two warm, and have a real answer for why you want to work at Verkada.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Short posts, one round each: how far the Verkada evidence goes',
    paragraphs: [
      'Behind the rows are {reports} public reports. Short forum posts from 2025 and 2026 each describe one coding round; interview-experience pages from 2019 to 2025 give the shape of a loop and a question or two; a 2025 thread asks what the algorithm round of a frontend onsite holds; and a 2021 blog post on a backend loop for a full-time role supplies the culture questions. Three rows rest on question banks alone and say so, and no account of an intern or new-grad frontend loop could be read.',
      "Verkada's careers page lists four stages, and its candidate privacy policy says interviews may be recorded and analysed with AI tools that support human decisions and make no hiring decision. Those {official} pages are what Verkada itself says, and neither says whether candidates may use AI tools. The eight frontend and UI postings read in November 2026 are all in San Mateo, and five of them say the work is onsite. Three things only the recruiter can settle: how many rounds your team holds, whether one is an algorithm round, and whether any part is a take-home or a coding session on your own machine.",
    ],
  },
  roundSpotlights: [
    {
      id: 'frame-player-screen',
      kicker: 'Round decoder',
      title: "Verkada's frame player screen: a video built from still frames",
      lede: [
        'Most Verkada frontend screens reported in 2025 asked for a video player built from a sequence of still frames, or for the controller behind one, in live coding on video with an engineer.',
        'Five 2025 accounts describe it, from mid level to senior. The controls around the playback change from one account to the next; every version needs the same timer underneath.',
      ],
      facts: [
        {
          label: 'Format',
          value: 'Live coding on video with an engineer, in an online editor; the one account that gives a length, from 2024, says an hour. One senior screen reported in 2025 was on CodeSignal.',
        },
        {
          label: 'What the versions share',
          value: 'A list of frames played in order, with controls to stop and move around. Each version builds different controls around the playback, and one asked for the controller on its own.',
        },
        {
          label: 'What it tests',
          value: 'How the player behaves over time when its controls are pressed in quick succession; the answer guides behind the lock list what to check.',
        },
        {
          label: 'Who was asked',
          value: 'A mid-level engineer, a senior engineer with seven years of experience and two with ten. The 2025 accounts give no place.',
        },
        {
          label: 'What other screens asked',
          value: 'A small UI from a design file in 2023 and 2025, a React component in three steps in 2024, and a list fetched from an API in a 2026 report.',
        },
        {
          label: 'Where this comes from',
          value: 'Short first-person posts from 2025 that each describe this one round, and interview-experience pages from 2023 to 2025 for the format.',
        },
      ],
      practiceLink: { label: 'Read the frame player answer guide', fragment: 'frame-player-timers' },
      processLink: { label: 'See the technical screen in the reported process', fragment: 'verkada-interview-process-1-stage-technical-screen' },
    },
    {
      id: 'onsite',
      kicker: 'Round decoder',
      title: 'The Verkada frontend onsite: what the loops reported',
      lede: [
        'The frontend onsites in the accounts were at the San Mateo office: four hours of frontend rounds in 2024, and in 2023 a full day of three technical interviews and a less technical manager interview, with lunch with the team.',
        'The questions these loops report, with no round named, are selection in a grid, broken JavaScript, the frontend architecture of a camera grid and questions on React.',
      ],
      facts: [
        {
          label: 'Algorithm round',
          value:
            'The 2024 senior candidate met no LeetCode-style problem. In 2025 a candidate preparing for a frontend onsite wrote that it has one algorithm round and asked whether that meant standard LeetCode-style questions; no reply in the thread answered it. A 2025 software loop in Canada also had a LeetCode-style interview.',
        },
        {
          label: 'Manager and culture',
          value:
            "The careers page describes a hiring manager conversation with behavioural and role-specific questions. A 2025 account lists why the candidate wanted to work at Verkada among its questions, and the culture interview of a backend loop reported in 2021 asked for a challenge overcome, a favourite project and how to win the team over to an idea.",
        },
        {
          label: 'Close to the product',
          value:
            "The candidate who got an offer in 2025 found the questions close to Verkada's business and the daily work. The frontend postings name camera grids, an event timeline and interactive floor plans among the work.",
        },
        {
          label: 'Where this comes from',
          value: 'Interview-experience pages from 2023 to 2025, a 2025 thread before a frontend onsite, and, for the culture questions, a 2021 blog post on a backend loop for a full-time role.',
        },
      ],
      practiceLink: { label: 'Shape your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the onsite in the reported process', fragment: 'verkada-interview-process-1-stage-onsite-at-the-san-mateo-office' },
      drill: {
        note: 'The questions come from a 2025 software loop that ended with a behavioural interview, a 2025 intern loop and the culture interview of a backend loop reported in 2021.',
        questions: [
          { id: 'why-verkada', text: 'Why do you want to work at Verkada?', source: 'Software loop, 2025', kind: 'view' },
          { id: 'challenge-overcome', text: 'Tell me about a time you overcame a challenge.', source: 'Intern loop, 2025' },
          { id: 'favourite-project', text: 'What is your favourite project?', source: 'Culture interview, 2021' },
          { id: 'convince-your-team', text: 'How would you convince your team to adopt an idea you proposed?', source: 'Culture interview, 2021', kind: 'approach' },
          { id: 'company-you-would-most-like', text: 'Describe the company you would most like to work at.', source: 'Culture interview, 2021', kind: 'view' },
        ],
        checks: [
          'A technical interviewer could ask a follow-up about the code or the UI in it, because it names what I built or changed.',
          'It ends with what changed because of my work: a number, a decision someone made, or what I would now do differently.',
        ],
        viewChecks: [
          'It connects to what Verkada builds or how its teams work, not to something any company could say.',
          'I can say it in under a minute.',
        ],
      },
    },
    {
      id: 'take-homes',
      kicker: 'Round decoder',
      title: 'Verkada take-homes and assessments before 2025: what candidates built',
      lede: [
        'No 2025 or 2026 frontend account mentions a take-home, and the 2025 accounts that say how their screen ran describe live coding. Earlier loops had them: a 2019 account had a week for a React take-home, and the solutions candidates published from 2018 to 2024 show four tasks, three of them take-homes.',
        'We describe them in our own words from those solutions, and no brief, data or design file is reproduced.',
      ],
      facts: [
        {
          label: '2018 to 2021',
          value:
            "A page that scrolls through about a month of camera thumbnails, one every 20 seconds, three per row in time order. Each image's address comes from its timestamp, with no list to fetch; several solutions kept only the rows near the viewport while the scroll height covered the whole month.",
        },
        {
          label: '2021',
          value:
            'A floor plan given as a small grid of open cells and walls: add cameras to open cells, at most one per cell, and save a structure that describes the placements; how a user would move or remove a camera was a point to think about. Dragging a camera into place and giving it a direction were extras.',
        },
        {
          label: '2023 and 2024',
          value: 'Two tasks built from a design file: a landing-page take-home, and an assessment whose format its solutions leave open. The design-to-UI row of the list describes them with its answer guide.',
        },
        {
          label: 'The 2019 week',
          value: 'A React take-home with a week to work on it, for a candidate who came through a staffing agency. The account does not describe the task.',
        },
      ],
      practiceLink: { label: 'Practise a list that keeps only the rows on screen', path: '/react/coding/react-virtualized-list-recycling' },
      processLink: { label: 'See the 2019 take-home in the reported process', fragment: 'verkada-interview-process-3-stage-take-home' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Which Verkada loop you are in: a frontend screen, a software role in Canada, or a lead role',
    intro: 'The accounts split into three loops. Start with the one that matches yours; each lens keeps to its own accounts.',
    items: [
      {
        title: 'Mid-level and senior frontend engineers',
        description:
          'Most of the evidence. Screens reported in 2025 asked for the frame player in one of its versions or for its controller alone; screens in 2023 and 2025 a small UI from a design file; a 2024 screen a React component in three steps; a screen reported in 2026 a list fetched from an API; and a frontend coding round reported in 2026 cards that play video on hover. The 2024 loop asked for a grid with cell selection; the 2023 loop for rectangle selection in a grid, a camera grid design, broken JavaScript and questions on React.',
        practiceFocus:
          'Timers that survive repeated clicks and unmounts, styling from a spec under time pressure, pointer and keyboard selection in a grid, and the architecture of a page that shows many live streams.',
      },
      {
        title: 'Software engineers and developers in Canada',
        description:
          'Two loops, in 2024 and 2025, with a frontend technical interview in the middle: a mockup built from a design in JavaScript, React and CSS (2024), or, as the 2025 account\'s example, a UI built in a timed session. A LeetCode-style interview (2025) or another technical interview (2024) followed, then a behavioural interview, with the engineering manager in 2025; neither candidate got an offer.',
        practiceFocus: 'A timed build from a design with the styling finished, one medium algorithm problem, and why you want to work at Verkada.',
      },
      {
        title: 'Front-end lead role under marketing',
        description:
          "A 2024 video call with the lead of an engineering team under marketing: familiarity with content management systems, localisation and CSS animation, then the candidate's own questions. It is one account, and it ended without an offer.",
        practiceFocus: 'CSS animation and what keeps it smooth, translating a marketing site, and the content system behind one.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the locked Verkada questions',
    intro:
      'Every locked row has an answer guide written by FrontendAtlas, not by Verkada. Each one links a practice task: five are coding tasks whose checks run against your code, with a reference solution to compare against, and one is a system design walkthrough.',
    itemListName: 'Verkada frontend interview answer guides',
    items: [
      {
        id: 'frame-player-timers',
        title: 'Play a video built from still frames without a second timer',
        statement:
          'Frames arrive from an API as a list, each with an index, a time and an image. Build a player that shows one frame at a time with Play and Pause, starts from any frame the user picks, and keeps working however the controls are clicked.',
        whatThisMeasures:
          'Whether you treat playback as state that one timer drives: a single interval or chain of timeouts, the current frame read fresh inside it, a defined end, and cleanup on pause and on unmount.',
        clarifyFirst: [
          'Ask what happens at the last frame: stop and offer Replay, or loop back to the first.',
          'Ask whether a jump while playing keeps playing from the new frame or pauses there.',
          'Ask how fast it plays, one frame every 250 ms or a speed control, and whether each frame shows its real time.',
          'Ask what the screen shows while the frames load, when the request fails and when the list is empty.',
        ],
        strongAnswer: [
          'Load the frames first with loading, error and empty states, then show the first frame with a label such as "Frame 1 of 30" and its time.',
          'Keep the index in state and drive it with one timer: start it in an effect that depends on the playing flag and return a cleanup that clears it, so a second Play or an unmount can never leave a second timer running.',
          'Advance with a functional update, setIndex((i) => i + 1), or read the index from a ref, so the timer never works from the index it captured when it started.',
          'Stop at the last frame: clamp the index in the updater, let an effect that watches the index set playing to false so its cleanup clears the timer, and show Replay; let a Play on the last frame start again from the first.',
          'Let a jump set the index and keep the playing flag as it was, and name each control by its state (Play, Pause, Replay) so keyboard and screen-reader users know what it does.',
          'Then name what you would add: arrow keys to step, preloading the next few images, markers placed by their real times, and what a real video element would change.',
        ],
        commonMiss:
          'Starting a new setInterval on every Play, so two clicks run two timers and the video plays twice as fast, or reading the index inside the interval callback from the render that started it, so playback moves one frame and then sticks.',
        resourceLabel: 'Build the frame sequence player in four tasks (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-frame-sequence-player',
      },
      {
        id: 'frame-controller-state',
        title: 'Write the controller of a frame player as a small state machine',
        statement:
          'Implement the controller of a frame-by-frame player: it shows a frame through a callback, plays at a frame rate, pauses, jumps to any frame and changes speed, and keeps one timer however it is called.',
        whatThisMeasures:
          'Whether you can keep state in a closure or a class, schedule with one timer, check arguments before changing anything, and say what every call does in every state.',
        clarifyFirst: [
          'Ask what playback does at the last frame: stop, or loop.',
          'Ask whether a jump while playing keeps playing from the new frame, and when the next frame should come.',
          'Ask what a bad frame index or rate should do: throw, clamp or be ignored.',
          'Ask whether the render callback may call the controller back, for example to pause on a marker frame.',
        ],
        strongAnswer: [
          'Keep the frame, the rate, one timer and a destroyed flag in a closure, and let "playing" mean "a timer is pending", so the two can never disagree.',
          'Schedule one timeout at a time and clear it before every stop or re-time, so playing twice, pausing twice or playing after a jump never leaves a second timer.',
          'Check an index or a rate before touching any state, so a bad call throws and changes nothing, even while playing.',
          'On a jump while playing, show the frame at once and count the next interval from the jump; on a new rate, count it from the call.',
          'Settle the frame and the timer before calling the render callback, so a callback that pauses or jumps from inside it has the last word.',
          'Mention drift: scheduling each frame against a target time rather than from the last callback keeps a long playback on time.',
        ],
        commonMiss:
          'Setting the timer variable to null without clearing the timeout, so a frame still shows after a pause, or starting a timer on every play() while one is pending, so the frames come twice as fast.',
        resourceLabel: 'Build the frame player controller on a fake clock (Premium; checks and a reference solution)',
        resourcePath: '/javascript/coding/js-frame-player-controller',
      },
      {
        id: 'camera-wall-architecture',
        title: 'Design the frontend of a camera grid that shows many live streams',
        statement:
          'Design the frontend architecture for a camera display grid: a page that shows live video from many cameras at once, lets the user change the layout and focus on one camera, and stays responsive for hours.',
        whatThisMeasures:
          'Whether you plan around the real limits, how many streams a browser can decode and the bandwidth they need, rather than drawing boxes, and keep the grid honest when cameras drop.',
        clarifyFirst: [
          'Ask how many cameras a site has and how many tiles the user sees at once, since sixteen tiles and a wall of a hundred need different answers.',
          'Ask what the streams are: a low-resolution substream for tiles and a full stream for the focus view, or one quality only, and how the browser receives them.',
          'Ask what the user does on the page: watch, search events, jump to one camera, or arrange layouts that are saved for them.',
          'Ask what must never happen: a frozen tile that looks live, or a tab that runs out of memory after an hour.',
        ],
        strongAnswer: [
          'Separate the layout from the streams: a grid of tiles that each hold a camera id and a state (connecting, live, stalled, offline), and a stream manager that owns the players.',
          'Set a stream budget: play only the tiles in view, use the low-resolution substream for tiles and the full stream only in the focus view, and stop streams for tiles that scroll away.',
          'Drive playback from visibility: one IntersectionObserver watching the tiles starts and stops each stream, and a visibilitychange handler pauses everything in a background tab.',
          "Plan for failure: show each tile's state and the time of its last frame, reconnect with backoff, and never let a stalled stream look live.",
          'Keep the page fast for hours: reuse player elements when the layout changes, release decoders and object URLs for tiles that leave, and watch memory over a long session.',
          'Name what you would measure: how many streams a typical laptop decodes, the bandwidth of a substream, and how the saved layout is stored and shared.',
        ],
        commonMiss:
          'Rendering a video element for every camera and letting them all play, so the page decodes streams nobody is watching, runs out of memory, and still shows a frozen tile as if it were live.',
        resourceLabel: 'Practise the architecture of a feed with one active player (Premium system design)',
        resourcePath: '/system-design/endless-short-video-feed',
      },
      {
        id: 'design-file-to-ui',
        title: 'Build a screen from a design file against the clock',
        statement: 'Build a small screen from a design file, with a basic interaction such as selecting an item.',
        whatThisMeasures:
          'Whether you can turn a spec into layout and styling quickly and in the right order, and say what you finished and what you left when time runs out.',
        clarifyFirst: [
          "Ask which widths matter: the design's width only, or a responsive layout down to a phone.",
          'Ask whether a CSS framework is allowed, or plain CSS, a preprocessor or CSS-in-JS.',
          'Ask how exact the match should be: the values in the file, or close enough on a consistent scale.',
          'Ask which interactions count: selecting an item, hover and focus states, or more.',
        ],
        strongAnswer: [
          'Read the spec before you code: pull the colours, type sizes and weights, spacing steps and radii into variables, so every value comes from one place.',
          "Build the structure first with semantic elements, then the layout with grid or flex, then the styling, checking each step in the browser at the design's width.",
          'Make interactive rows real buttons, show the selected one with aria-pressed or aria-current as well as colour, and give everything a visible focus style.',
          'Handle the details that show care: long text that wraps or truncates, images that keep their aspect ratio, times formatted in one time zone, and an empty state.',
          'Keep a time check: when a quarter of the time is left, say what you would finish next, such as a hover state or the small-screen layout.',
          'Rehearse the two design-file tasks that candidates published solutions for in 2023 and 2024: a large preview that shows the selected event, with a list of events under it, and a landing page built around an autoplaying carousel, where the solutions add numbered controls, play and pause, and in some an accordion.',
        ],
        commonMiss:
          'Leaving styling for last, so the screen works but does not match the design; a 2023 candidate who had the layout generally in place but not all the styling details heard nothing back.',
        resourceLabel: 'Build an event log from a design spec, with style checks (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-event-log-design-spec',
      },
      {
        id: 'grid-rectangle-selection',
        title: 'Select cells in a grid with the pointer and the keyboard',
        statement: 'Build a grid of cells that the user can select from with the pointer and with the keyboard.',
        whatThisMeasures:
          'Whether you model the selection as two corners rather than a set of cells, handle every drag direction, and keep the grid accessible and fast.',
        clarifyFirst: [
          'Ask whether Shift with a click or with the arrow keys should extend the selection from an anchor cell.',
          'Ask whether a second rectangle with Ctrl or Cmd is needed, or one selection at a time.',
          'Ask how large the grid gets, since a 10 by 14 grid and a sheet of a million cells need different rendering.',
          'Ask what the selection is for: a summary such as "B2:D6, 15 cells", copying, or bulk edits.',
        ],
        strongAnswer: [
          'Store an anchor cell and a focus cell and derive the rectangle from the smaller and larger row and column of the two, so a drag up and to the left selects what a drag down and to the right would.',
          'Start on pointerdown, move the focus as the pointer crosses cells, and finish on pointerup; capture the pointer or listen on the document so a release outside the grid still ends the drag; with capture, read the cell under the pointer from its coordinates, because the other cells no longer get pointerenter.',
          'Give the keyboard the same model: the arrow keys move the active cell, Shift with an arrow moves the focus and keeps the anchor, and Escape clears.',
          'Show the selection with aria-selected on each role="gridcell" inside a role="grid" that has aria-multiselectable="true", and a summary that names the range and the number of cells.',
          'Keep it fast: test each cell against the rectangle instead of storing a set, handle pointer events on the grid rather than on every cell, and avoid re-rendering every cell on every move.',
          'For the 2023 version, which may have been a discussion, talk through the state shape, where it lives, and how copying, bulk edits or a second rectangle would extend it.',
        ],
        commonMiss:
          'Adding cells to a set as the pointer crosses them, so a drag that doubles back leaves stray cells selected and a drag up and to the left selects the wrong cells.',
        resourceLabel: 'Build grid rectangle selection with drag, Shift and the keyboard (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-grid-rectangle-selection',
      },
      {
        id: 'hover-video-cards',
        title: 'Cards that play video on hover',
        statement: 'Build a list of cards with image thumbnails that play their video when the pointer is over them.',
        whatThisMeasures:
          'Whether you can join two data sources into one view, handle media that loads and plays asynchronously, and keep one video playing at a time without leaking players.',
        clarifyFirst: [
          'Ask how the two APIs relate: one returns the cards and the other their media, joined by an id, or one lists ids that the other details.',
          'Ask what happens on touch screens and for keyboard users, who cannot hover.',
          'Ask whether the video starts over on every hover or resumes where it stopped.',
          'Ask how many cards the list holds, since dozens of video elements cost memory.',
        ],
        strongAnswer: [
          'Fetch both APIs in parallel, with Promise.all if one failure should fail the whole list or Promise.allSettled if a partial list is acceptable, join the results by id into one list of cards, and show loading, error and empty states.',
          'Render each card with its image; on pointerenter show the video, muted and inline, call play() and handle the promise it returns; on pointerleave pause it and show the image again.',
          'Keep one video playing at a time by holding the active card id in the parent, so a fast sweep across the list never leaves two playing.',
          'Give keyboard and touch users a way in: play on focus or on a play button and stop on blur, so nothing depends on hover alone.',
          'Release media: create the video element only for the active card, or clear its source when it stops, so a long list does not keep dozens of decoders alive.',
          'Then name the follow-ups: preloading on hover intent, a short delay before playing, prefers-reduced-motion, and what a card shows when its video fails to load.',
        ],
        commonMiss:
          'Calling play() without handling its promise, so a quick hover in and out throws an interrupted-play error, or keeping every card\'s video mounted and playing, so the list stutters and memory climbs.',
        resourceLabel: 'Implement Promise.all, the helper behind parallel requests (Premium; checks and a reference solution)',
        resourcePath: '/javascript/coding/js-promise-all',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Verkada frontend interview preparation plan',
    intro:
      'Seven days, each on one part of the loop the accounts describe: the frame player and its controller, a screen from a design file, selection in a grid, a camera grid design, React and JavaScript under questioning, and the conversations around them.',
    days: [
      {
        day: 'Day 1',
        focus: 'The frame player: frames from a list, Play and Pause, a start from any frame and a stop at the last one, built in under an hour.',
        artifact: 'A working player and a note of what broke the first time.',
        practice: [{ label: 'Frame sequence player: four tasks in one hour', path: '/react/coding/react-frame-sequence-player' }],
      },
      {
        day: 'Day 2',
        focus: 'The controller on its own: one timer, a jump while playing and cleanup, written against a fake clock in about an hour.',
        artifact: 'A controller with tests that move the clock forward.',
        practice: [{ label: 'Frame player controller: play, seek and change speed on a clock', path: '/javascript/coding/js-frame-player-controller' }],
      },
      {
        day: 'Day 3',
        focus: 'A small screen from a design spec, timed: the layout first, then spacing, type and colour, then the interactions, stopping at 60 minutes.',
        artifact: 'A screenshot beside the spec and a list of what you left.',
        practice: [{ label: 'Event log from a design spec', path: '/react/coding/react-event-log-design-spec' }],
      },
      {
        day: 'Day 4',
        focus: 'Selection in a grid: with the pointer and the keyboard, in about an hour.',
        artifact: 'A grid you can select from both ways, with a summary of the selection.',
        practice: [{ label: 'Grid rectangle selection', path: '/react/coding/react-grid-rectangle-selection' }],
      },
      {
        day: 'Day 5',
        focus: 'Frontend system design for a camera grid: what plays, when, and at what quality, talked through in 45 minutes.',
        artifact: 'A one-page diagram with the stream budget and the failure states.',
        practice: [{ label: 'Endless short-video feed (system design)', path: '/system-design/endless-short-video-feed' }, { label: 'System design blueprint', path: '/guides/system-design-blueprint' }],
      },
      {
        day: 'Day 6',
        focus: 'React and JavaScript out loud: closures and stale state, effects and cleanup, timers and the event loop; then fix a piece of broken JavaScript, about an hour in all.',
        artifact: 'Short spoken answers on each topic, and one bug fixed with its cause named.',
        practice: [{ label: 'Why React shows stale state in closures', path: '/react/trivia/react-stale-state-closures' }, { label: 'useEffect: timing, dependencies and cleanup', path: '/react/trivia/react-useeffect-purpose' }, { label: 'Fix a stale closure in a delayed autosave callback', path: '/javascript/debug/js-debug-stale-closure-autosave' }],
      },
      {
        day: 'Day 7',
        focus: 'The conversations: why Verkada, a challenge you overcame and an idea you won the team over to, and one medium algorithm problem in case the onsite has an algorithm round.',
        artifact: 'The drill stories and a short list for the recruiter: the rounds, any algorithm round and any take-home.',
        practice: [{ label: 'STAR stories guide', path: '/guides/behavioral/stories' }, { label: 'Create an LRU cache with bounded memory', path: '/javascript/coding/js-create-lru-cache' }],
      },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Verkada frontend interview preparation questions',
    items: [
      {
        question: 'How many interview rounds does Verkada have for frontend engineers?',
        answer:
          "Verkada's careers page lists four stages: a recruiter call, a hiring manager conversation, technical assessments that depend on the role, and on-site interviews. Frontend accounts describe a recruiter call, a technical screen of live coding on video (an hour in the one 2024 account that gives a length) and an onsite at the San Mateo office: four hours of frontend rounds in 2024, and in 2023 three technical interviews and a less technical manager interview over a full day. A 2025 loop went from application to offer in just under a month.",
      },
      {
        question: 'Are these real Verkada interview questions?',
        answer:
          'Apart from three rows that only question banks list, and say so, each one comes from a candidate describing their own Verkada interview, retold in our words; Verkada has confirmed none of them, and none is leaked. Treat a row as one candidate\'s experience, not a script.',
      },
      {
        question: 'Does Verkada ask LeetCode questions in frontend interviews?',
        answer:
          "Sometimes. A 2024 senior frontend candidate said every question was about frontend and none was LeetCode-style; in 2025 a candidate preparing for a frontend onsite wrote that it has one algorithm round, and a 2025 software loop in Canada had a LeetCode-style interview. Verkada's general software loops report algorithm problems often, such as periods of camera motion above a threshold, so ask your recruiter what your loop holds.",
      },
      {
        question: 'Does Verkada give frontend candidates a take-home?',
        answer:
          'No 2025 or 2026 frontend account mentions one, and the 2025 accounts that say how their screen ran describe live coding. A 2019 account had a week for a React take-home, and the solutions candidates published show three take-homes from 2018 to 2024, a scrolling timeline of camera thumbnails, cameras placed on a floor plan and a landing page built from a design file, plus a fourth design-file task whose format is not stated.',
      },
      {
        question: 'Is the Verkada frontend interview in React?',
        answer:
          'Mostly. The frontend accounts that name a framework name React, and six of the seven frontend postings for web work name it; a 2023 screen allowed React or a framework of your choice. Ask your recruiter what your screen uses.',
      },
      {
        question: 'Do Verkada frontend engineers work onsite?',
        answer:
          'The eight frontend and UI postings read in November 2026 are all in San Mateo, and five of them say the work is onsite, three of those five days a week. The onsite interviews in the accounts were at the San Mateo office too.',
      },
      {
        question: 'Does Verkada use AI in its interviews?',
        answer:
          'Its candidate privacy policy says Verkada may record and analyse interview content with AI tools where permitted, and that these tools support human decisions and do not make hiring decisions. None of the Verkada pages we read says whether candidates may use AI tools, so ask your recruiter; a 2026 web platform posting asks for interest in AI-assisted development.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Verkada rounds',
    intro:
      'Free tasks to rehearse before a Verkada loop: a list fetched from an API, the closure and effect bugs behind broken timers, a bug to fix, CSS animation, a cache, a list that keeps only the rows on screen, and stories for the conversations. None of them comes from Verkada; each trains a skill its rounds test.',
    items: [
      {
        label: 'Fetch and render a list with loading, error and empty states',
        description: 'A screen reported in 2026 asked to fetch items and display them; this adds the states an interviewer looks for.',
        path: '/react/coding/react-fetch-list-states',
      },
      {
        label: 'Why React shows stale state in closures',
        description: 'A common cause of broken timers, and the fixes compared.',
        path: '/react/trivia/react-stale-state-closures',
      },
      {
        label: 'useEffect: timing, dependencies and cleanup',
        description: 'Where an effect starts and clears a timer, and why the cleanup runs before the next effect.',
        path: '/react/trivia/react-useeffect-purpose',
      },
      {
        label: 'Fix a stale closure in a delayed autosave callback',
        description: 'A piece of broken JavaScript to fix; this one is a timer-and-closure bug.',
        path: '/javascript/debug/js-debug-stale-closure-autosave',
      },
      {
        label: 'Hardware acceleration and compositing in CSS animation',
        description: 'For the question on CSS animation: which properties animate smoothly, and why.',
        path: '/css/trivia/css-hardware-acceleration',
      },
      {
        label: 'Create an LRU cache with bounded memory',
        description: 'The cache that a question bank lists for a 2026 new-grad onsite.',
        path: '/javascript/coding/js-create-lru-cache',
      },
      {
        label: 'Virtualized list: 10,000 rows, twenty nodes',
        description: 'The idea behind several solutions to the older scrolling-timeline take-home: only the rows on screen exist in the page.',
        path: '/react/coding/react-virtualized-list-recycling',
      },
      {
        label: 'STAR stories guide',
        description: 'For why Verkada, a challenge you overcame and the other conversation questions.',
        path: '/guides/behavioral/stories',
      },
    ],
  },
  methodNote: {
    kicker: 'Method',
    title: 'How we collected these questions',
    paragraphs: [
      'We read public, first-person interview reports that candidates posted on interview-experience sites, discussion forums and personal blogs, and public code repositories where candidates shared their own solutions to take-homes and assessments. A question is listed when a report describes it well enough to practise. Summaries on prep sites confirm a report but do not replace one, except for the three questions that rest on them alone, which are marked as listed in a question bank.',
      "Every question is in our own words, and take-homes are described from what candidates published, with our own data and wording; we never copy a company's brief, data or design files. The year beside a question is the year it was reported; for a forum post, the year it was posted. We also read Verkada's careers page, its candidate privacy policy and its frontend postings. Teams and levels vary, so treat this as what candidates reported, not as a fixed script.",
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Verkada practice set',
    copy: 'Premium opens each locked Verkada row with its answer guide, and the frame player, its controller, the design-spec screen and grid selection as tasks with checks and reference solutions.',
    buttonLabel: 'Unlock the full Verkada practice set',
    src: 'company_preview_verkada',
  },
  about: [
    'Verkada frontend interview preparation',
    'Verkada frontend technical screen',
    'Frame-by-frame video player interview question',
    'Frontend system design for a camera grid',
  ],
  indexAnchorLabel: 'Verkada frontend interview questions',
};
