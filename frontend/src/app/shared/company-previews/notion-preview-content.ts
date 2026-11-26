import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Notion frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts), and the prompts here are the answer guides of its ten locked rows. The guide names
 * no source (`sourceDisplay: 'year'`): rows and rounds show the years their accounts give, and the method note says how
 * the questions were collected. Notion's own interview guides are public, so their facts appear in open sections; the
 * 2026/27 take-home is described only in its locked row, in our own words. Open sections (decoders, FAQ, free
 * practice, plan days) name a locked row by its topic only and never link its practice task. Nothing here is a leaked
 * or confirmed Notion question.
 */
export const NOTION_PREVIEW_TITLE = 'Notion Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const NOTION_PREVIEW_H1 = 'Notion Frontend Interview Questions';
export const NOTION_PREVIEW_DESCRIPTION =
  'Notion frontend interview: a React screen on CodeSignal, an AI-enabled coding round, the intern take-home and {#questions} reported questions.';
export const NOTION_PREVIEW_CANONICAL_PATH = '/companies/notion/preview';
export const NOTION_PREVIEW_TRUST_NOTE =
  "The rows come from candidates' own accounts of Notion loops and from Notion's published interview guides, retold in our words. Notion has not confirmed any candidate's account, none of it is a leak, and the answer guides come from FrontendAtlas. Most accounts are Software Engineer loops that do not name their track, so weigh each row as a single candidate's report.";

export const NOTION_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'notion',
  label: 'Notion',
  title: NOTION_PREVIEW_TITLE,
  h1: NOTION_PREVIEW_H1,
  description: NOTION_PREVIEW_DESCRIPTION,
  canonicalPath: NOTION_PREVIEW_CANONICAL_PATH,
  trustNote: NOTION_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Notion prep guide',
    subtitle:
      "Notion's own guides lay out the 2026 Front End loop: a 60-minute screen in React on CodeSignal by default, then a 4-hour virtual onsite with an AI-enabled coding round, code review, software design and career history. Most accounts from 2022 to 2026 describe practical, product-shaped coding rather than LeetCode-style problems, though some onsites before 2026 also had an algorithm round. {questions} reported questions follow the table; the React trivia and the homepage assignment are open, and the product builds are locked.",
    caveat:
      "Most accounts are Software Engineer loops that do not name their track, and only a few name the frontend one. No candidate describes the 2026 code review round, and the AI-enabled round is known mainly from Notion's own guide.",
    chips: ['{#questions} reported questions', '{#reports} public reports, 2022–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Build product pieces in React, then rehearse with an AI assistant',
    paragraphs: [
      'The coding rounds are product-shaped builds in parts, not puzzles. Accounts from 2024 to 2026 were asked to build a JSON viewer in React in stages, to build a to-do list with insertion anywhere and then nesting (50 minutes in 2026), to add undo and redo to text edits and discuss the design, and to build a menu component; the coding runs in React on CodeSignal by default, with AI tools restricted. Practise each so that every stage keeps working before the next, and say your data model aloud before you write the UI.',
      'The 2026 onsite adds an AI-enabled round: a small TypeScript codebase from a simplified part of the product that may have failing tests, performance problems or poorly written code, where AI coding tools are encouraged. Set up the tool you will use, practise reading the failing tests first and checking every change the assistant makes by running them, and be ready to say why a change is right whoever wrote it. A 2026 candidate who got an offer said the round needs a good understanding of tools such as Claude Code and Cursor.',
      "Design and career history are two of the four onsite interviews, so prepare them as you prepare the code. Reported designs are a calendar UI (2025) and a round on data modelling and APIs more than scale (2024). Notion's guide asks for fewer stories told in more detail, 2026 accounts describe a final values interview, held by the CEO in two of them, and two 2026 posts by staff candidates describe stalling or failing at hiring-manager calls that probed team conflict. Read Notion's operating values, and prepare stories about coordination and disagreement, not only fast solo work.",
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: "Notion's guides against Software Engineer accounts: what each can tell you",
    paragraphs: [
      'The rows and the process table rest on {reports} public reports and on Notion\'s own guides. Interview-experience pages from 2023 to 2026 give most rows; forum posts from 2026 add two phone screens; a 2025 newsletter write-up covers a whole general loop; an entry-level account from 2026 adds a recruiter question; and discussion threads from 2022 to 2026 add the onsite, the final interview and the calls after it. Most of these are Software Engineer loops whose track is not stated, and only a few name the frontend track.',
      "Notion publishes interview guides for its Front End, Intern and New Grad tracks and a general one for software engineers. With its page on interviewing and its post on how it hires, these {official} pages are Notion's own word. The Front End guide lists a code review round, and neither the guide as we read it nor any candidate says what it covers. Before your loop, ask the recruiter for the prep material, since one account says its screen question was very similar to it, and ask which onsite rounds your team runs and which AI tool you may bring to the AI-enabled round.",
    ],
  },
  roundSpotlights: [
    {
      id: 'ai-enabled-round',
      kicker: 'Round decoder',
      title: "Notion's AI-enabled coding round: a small codebase to fix with an assistant",
      lede: [
        "New in Notion's 2026 Front End onsite: a small TypeScript codebase in CodeSignal, taken from a simplified part of the product, which may have failing tests, performance problems or poorly written code to fix together with the interviewer.",
        'AI coding tools are available and encouraged in this round only; the other coding rounds restrict them.',
      ],
      facts: [
        {
          label: 'Format',
          value:
            'Part of a 4-hour virtual onsite beside code review, software design and career history. The code is TypeScript, but the round is not a TypeScript quiz and has no LeetCode-style traps.',
        },
        {
          label: 'Tools',
          value:
            'An AI-enabled IDE such as Cursor, or VS Code with GitHub Copilot, or a command-line agent such as Claude Code beside another IDE. The guide marks the round as one to prepare for.',
        },
        {
          label: 'What candidates say',
          value:
            'A 2026 candidate who got an offer said it requires a good understanding of modern AI tools, and a 2026 software engineer found an AI-enabled interview and a system design on the onsite schedule. No account describes the codebase itself.',
        },
        {
          label: 'Where this comes from',
          value: "Notion's 2026 Front End guide, and accounts from 2026.",
        },
      ],
      practiceLink: { label: 'Read the AI-enabled round answer guide', fragment: 'ai-enabled-round' },
      processLink: { label: 'See the AI-enabled round in the reported process', fragment: 'notion-interview-process-1-stage-onsite-ai-enabled-coding' },
    },
    {
      id: 'early-career',
      kicker: 'Round decoder',
      title: "Notion's intern and new-grad loop: a take-home, then debugging and practical coding",
      lede: [
        'Interns and new grads take a 3-hour take-home, then a 2-hour virtual onsite: one slot holds a 10-minute review of the take-home and 40 minutes of debugging a codebase, and the other is a practical coding interview.',
        'A 45-minute career conversation follows, and new grads add a 30-minute values capstone and references.',
      ],
      facts: [
        {
          label: 'The take-home',
          value: 'Three hours, on a feature like one Notion has, according to a 2026 account. The locked take-home row describes the 2026/27 task in our words.',
        },
        {
          label: 'Debugging',
          value: 'A codebase to debug in 40 minutes. CodeSignal is the default, and you can use your own editor if you tell the coordinator.',
        },
        {
          label: 'Practical coding',
          value: 'Two accounts call it not LeetCode-style: a 2024 account was asked for a class to store and retrieve documents, and a 2026 account compares building a feature with object-oriented code to a LeetCode round.',
        },
        {
          label: 'Before the take-home',
          value: 'Some 2025 and 2026 intern loops opened with an online assessment; one 2025 intern\'s was CodeSignal\'s general coding assessment, and that intern was then scheduled for a third-party data-structures take-home.',
        },
        {
          label: 'Where this comes from',
          value: "Notion's Intern and New Grad guides, and 2024 to 2026 accounts, mostly from interns.",
        },
      ],
      practiceLink: { label: 'Warm up on a free debugging task', path: '/javascript/debug/js-debug-stale-closure-autosave' },
      processLink: { label: 'See the intern and new-grad rounds in the reported process', fragment: 'notion-interview-process-2-stage-take-home' },
    },
    {
      id: 'career-history',
      kicker: 'Round decoder',
      title: "Notion's career history and final interview: what they ask",
      lede: [
        "The onsite ends with an hour of career history with an engineering leader, and the loop with a final interview on your experience, values and motivations, held by the CEO in two 2026 accounts.",
        "Notion's guide asks for fewer stories in more detail, and for what you did yourself.",
      ],
      facts: [
        {
          label: 'Career history',
          value: 'Past teams, successes and challenges, high and low points, transitions, strengths and weaknesses, and why Notion, per the Front End guide.',
        },
        {
          label: 'The final interview',
          value: '30 to 45 minutes with a member of the leadership team. In 2026 accounts it came after the onsite as a values interview, and in two of them it was with the CEO.',
        },
        {
          label: 'Calls after the onsite',
          value:
            'Two 2026 posts by staff candidates describe hiring-manager calls that turned to team challenges and conflicts; one passed the onsite and found no team match, and the other failed only at the hiring-manager or executive round.',
        },
        {
          label: 'References',
          value: "Notion checks references, in one 2022 account before the level and the offer were discussed, and its 2023 post calls them a strong predictor of success.",
        },
        {
          label: 'Where this comes from',
          value: "Notion's guides and its post on how it hires, and discussion threads and interview-experience pages from 2022 to 2026.",
        },
      ],
      practiceLink: { label: 'Prepare stories with the STAR stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the career history round in the reported process', fragment: 'notion-interview-process-1-stage-onsite-career-history' },
      drill: {
        note: "The questions come from Notion's Front End guide, accounts from 2025 and 2026, a 2025 loop's project retrospective and 2026 calls after the onsite.",
        questions: [
          { id: 'why-notion', text: 'Why Notion? Why are you interested in the company?', source: 'Accounts from 2025 and 2026, one a recruiter screen', kind: 'view' },
          { id: 'what-next', text: 'What do you want next in your career?', source: 'A 2026 account', kind: 'view' },
          { id: 'project-retrospective', text: 'Walk me through a past project as a retrospective.', source: 'A 2025 loop, where it was used to assess which team you fit' },
          { id: 'team-conflict', text: 'Tell me about a challenge or a conflict on your team, and what you did about it.', source: 'Calls after the onsite, 2026' },
          { id: 'high-and-low-points', text: 'What were the high and low points of your career so far?', source: "Notion's Front End guide" },
          { id: 'ai-tools', text: 'What AI tools have you used?', source: 'A 2026 loop', kind: 'view' },
        ],
        checks: [
          'It says what I did myself, not only what the team did.',
          "It ends with the result and what I would do differently, ready for the follow-ups Notion's guide expects, such as what I did then.",
        ],
        viewChecks: ['It names something specific about Notion, a product decision, a value or a team, rather than praise any company could get.', 'It fits in about a minute.'],
      },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Which Notion loop you are in: the Front End track, intern or new grad, or India',
    intro: "Notion's evidence comes from three kinds of loop. Begin with the lens nearest your own; each sticks to what its accounts and guides describe.",
    items: [
      {
        title: 'Front End track and frontend-leaning software engineers',
        description:
          'Coding rounds from 2024 to 2026 are product-shaped builds in parts: a JSON viewer in stages, a to-do list with insertion anywhere and nesting, undo and redo with a design discussion, a menu component. The 2026 onsite is the AI-enabled round, code review, software design (a calendar UI was reported) and career history; before 2026, onsites had a second coding round, an algorithm or backend one. A 2024 senior loop ran seven coding exercises and ended with a React build from a blurry screenshot.',
        practiceFocus: 'Staged React builds that keep working at every step, a clean undo history, working with an AI assistant on failing tests, and a calendar design you can defend.',
      },
      {
        title: 'Interns and new grads',
        description:
          'A 15-minute call, a 3-hour take-home, then a 2-hour virtual onsite of debugging, which includes a 10-minute review of your take-home, and practical coding such as classes that manage documents. A 45-minute career conversation follows, and new grads add a values capstone and references. Some intern loops opened with an online assessment.',
        practiceFocus: 'Scoping a take-home to one direction and defending it, a method for debugging code you have not seen, and object-oriented coding with clear class boundaries.',
      },
      {
        title: 'Frontend and software engineers in India',
        description:
          "A 2023 frontend loop in Pune began with an assignment to rebuild Notion's homepage, then React and JavaScript questions on hooks, re-renders and useEffect against useState, ending with a data-structures question, then HR. A 2024 first coding round set text-editor functions against test cases, and a 2025 loop included a screen on code quality and SOLID principles and a pair-programming session with a follow-up on readability.",
        practiceFocus: 'A responsive page built from your own design, React fundamentals said in two sentences each, and a small class written test by test.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the locked Notion questions',
    intro:
      'Each locked row comes with an answer guide that FrontendAtlas wrote; Notion wrote none of them. Where a guide links a practice task, the task runs checks against your code and comes with a reference solution.',
    itemListName: 'Notion frontend interview answer guides',
    items: [
      {
        id: 'ai-enabled-round',
        title: 'Work a failing codebase with an AI assistant, and show your judgment',
        statement:
          "In Notion's AI-enabled round you get a small TypeScript codebase from a simplified part of the product, which may hold failing tests, performance problems or poorly written code, and AI coding tools are encouraged. Fix what you can and explain each change.",
        whatThisMeasures:
          'Whether you can read code you did not write, let the tests decide, use an assistant for speed without handing it your judgment, and explain why each change is right.',
        clarifyFirst: [
          'Ask whether you may run the tests and the app as often as you like, and whether the order of the problems matters.',
          'Ask whether to fix only what fails or also improve what you notice, such as a poorly written module.',
          'Ask whether to talk through each change as you make it or to sum up at the end.',
          'Ask which assistant and editor you are expected to use, if the invitation did not say.',
        ],
        strongAnswer: [
          'Run the whole suite before changing anything, and read each failing test as the spec: what it sets up, what it expects and which file it reaches.',
          'Ask the assistant for a map of the files and how data flows between them, then check that map against the code before you trust it.',
          'Fix one cause at a time and re-run the suite after each change, so a fix that breaks a passing test shows at once.',
          'If there is a performance problem, measure before and after, such as counting renders or timing the slow path, so you can say what got faster and why.',
          'If a module is messy, rewrite it in small steps with the tests green between them, and keep its exported names and arguments as they are.',
          "Say why each change is right, whoever wrote it, and turn down the assistant's suggestions that the tests or the code do not support.",
        ],
        commonMiss:
          "Accepting the assistant's first patch without running the tests, or asking it to fix everything at once, so a change that passes one test breaks two others and you cannot tell which edit caused it.",
        resourceLabel: 'Practise on a small notes app with failing tests, a slow path and messy code (Premium; checks and a reference fix)',
        resourcePath: '/javascript/debug/js-debug-notes-app-repo',
      },
      {
        id: 'json-viewer-stages',
        title: 'Build a JSON viewer in React in stages, with a toggle on every object',
        statement:
          'Render a JSON value as a collapsible tree in React, one stage at a time: an object of primitives with an expand and collapse state, nested objects with their own toggles, deep nesting, then arrays.',
        whatThisMeasures:
          "Whether you model the tree by type and by path, keep every stage working before the next, and render recursively without losing a node's open state.",
        clarifyFirst: [
          'Ask what a collapsed value shows: a summary with its count, or only the brackets.',
          'Ask whether the tree starts open or closed, and whether there should be expand all and collapse all.',
          'Ask whether the input is a parsed value or a JSON string, and what to show when it does not parse.',
          'Ask how large the data can get, since a few hundred nodes and a million need different rendering.',
        ],
        strongAnswer: [
          'Split rendering by type: strings in quotes, numbers and booleans plain, null as null, and objects and arrays as containers with a toggle.',
          "Recurse with one component that takes a value, its key and its path, and keep open state by path, so collapsing a child leaves its parent open and a sibling's update does not reset it.",
          'Show a collapsed container as a summary with its count, such as {…} 3 keys or […] 6 items, and an empty one as {} or [] with no toggle.',
          'Make each toggle a button with aria-expanded and a name that includes its key, and keep focus on it as it opens.',
          'Finish one stage before the next and keep the earlier ones passing, since the screen is built in parts.',
          'Then name the follow-ups: a default depth, expand all, lazy children for large data, and parsing a string with a readable error.',
        ],
        commonMiss:
          'Keeping one open flag for the whole tree, or keying state by array index, so toggling one node opens or closes others; or treating arrays as objects, so their indices and summaries come out wrong.',
        resourceLabel: 'Build the JSON viewer in stages (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-json-tree-viewer',
      },
      {
        id: 'calendar-frontend-design',
        title: 'Design the frontend of a calendar',
        statement:
          'Design the frontend of a team calendar with day, week and month views: how events are laid out, how people create and change them, and how the data loads and stays current.',
        whatThisMeasures:
          'Whether you can turn an open product prompt into a client data model, a loading plan and an interaction design, and name the hard parts: overlapping events, time zones and edits that collide.',
        clarifyFirst: [
          'Ask which views matter most, and whether recurring events and shared calendars are in scope.',
          'Ask how many events a busy week holds, which decides whether you can render everything.',
          'Ask whether other people edit the same calendar at once, and how fast their changes must show.',
          'Ask what must work offline or on a slow connection.',
        ],
        strongAnswer: [
          'Keep events by id in a client store, and expand recurring events only for the visible range instead of storing every occurrence.',
          'Load by visible range, prefetch the neighbouring range, and cache by calendar and range so moving between weeks is instant.',
          'Lay out overlapping events in columns: group events that overlap, give each a column inside its group, and size them so none hides another.',
          'Make creating, moving and resizing direct, with an optimistic update, a rollback when the server refuses, and a keyboard path for each.',
          "Handle time zones and daylight-saving changes in one place: store one-off events as instants, recurring events as a local time with their time zone, so a 9:00 meeting stays at 9:00 when the clocks change, and all-day events as dates; render in the viewer's zone, and test the week the clocks change.",
          'Keep it current with polling or push, and reconcile remote changes with local edits still in flight, saying which one wins and why.',
        ],
        commonMiss:
          'Drawing components before a data model, so recurring events, overlaps and time zones come up as afterthoughts, or storing every occurrence of a recurring event, so one change has to touch hundreds of records.',
        resourceLabel: 'Structure the answer with the free system design blueprint',
        resourcePath: '/guides/system-design-blueprint',
      },
      {
        id: 'nested-to-do-outliner',
        title: 'Build a nested to-do list',
        statement: 'Build a bulleted to-do list whose items can nest under one another; Notion\'s frontend screen codes in React by default.',
        whatThisMeasures:
          'Whether you keep a tree model apart from the UI, keep ids stable, and make insert, indent and outdent work without corrupting the order.',
        clarifyFirst: [
          'Ask where a new item goes: after the current one, at an index under a parent, or at the end.',
          'Ask what indent and outdent do at the edges: on a first child, on a top-level item, and to the siblings that follow.',
          'Ask whether checking a parent checks its children.',
          'Ask which keys should work: Enter, Tab and Shift+Tab, and Backspace on an empty item.',
        ],
        strongAnswer: [
          'Model items as a tree of id, text, done and children, or as a flat list with parent ids and order keys, and write insert, indent, outdent and remove as pure functions you can test without the UI.',
          'Insert after an item or at an index under a parent, and give new items stable ids so focus and keys survive.',
          'Let indent make an item the last child of its previous sibling and do nothing to a first child; let outdent make it the next sibling of its parent, and say what happens to the siblings after it.',
          'Render recursively with nested lists, focus a new item when Enter creates it, and give keyboard users a way out of the list, since Tab is taken by indent.',
          'Find a node by its id rather than by a path of indexes, which every move makes stale; a 2025 candidate who tracked parent-to-child indexes was told there was an easier way to move through the tree.',
          'Then talk about moving a subtree from the keyboard, collapsing a parent, and undo.',
        ],
        commonMiss:
          'Tracking children by arrays of indexes that every insert and indent invalidates, or editing the tree in place, which React never notices, so nothing re-renders and undo has nothing to return to.',
        resourceLabel: 'Build the nested to-do outliner (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-nested-todo-outliner',
      },
      {
        id: 'undo-redo-history',
        title: 'Add undo and redo to text edits',
        statement: 'Implement undo and redo for edits to a text buffer, then discuss the design.',
        whatThisMeasures:
          'Whether you record edits so they can be reversed exactly, restore the cursor as well as the text, drop the redo history at the right moment, and can defend the design.',
        clarifyFirst: [
          'Ask what an edit is: an insert and a delete at the cursor, or the replacement of a selection too.',
          'Ask whether undo restores the cursor as well as the text.',
          'Ask whether typing a word is one undo step or one per character.',
          'Ask how long the history may grow.',
        ],
        strongAnswer: [
          'Record each edit as where it happened, the text it removed and inserted, and the cursor before and after; undo applies the inverse and restores the cursor from before, and redo reapplies it and restores the cursor from after.',
          'Keep two stacks, and empty the redo stack whenever a new edit is recorded, because its edits were made against a text that no longer exists.',
          'Skip edits that change nothing, such as an empty insert or a delete at the start, so undo never seems to do nothing; moving the cursor is not an edit and keeps redo.',
          'Compare recording commands with storing snapshots: commands cost memory in proportion to the change, snapshots in proportion to the document.',
          'Then discuss merging consecutive typing into one step, a cap on the history, selections and branching history.',
        ],
        commonMiss:
          'Restoring the text but not the cursor, or keeping the redo stack after a new edit, so redo replays an edit onto text it was not made for.',
        resourceLabel: 'Build the text editor with undo and redo (Premium; checks and a reference solution)',
        resourcePath: '/javascript/coding/js-text-editor-undo-redo',
      },
      {
        id: 'menu-component',
        title: 'Build a menu component in React',
        statement: 'Build a menu component for a product UI in React. The account that reports it records no requirements, so settle them with your interviewer.',
        whatThisMeasures:
          'Whether you can settle a sensible spec when the prompt is one line and build an accessible menu: a trigger, a list of items, keyboard support, and closing at the right moments.',
        clarifyFirst: [
          'Ask what the menu holds: actions, links, or options with a selected state, and whether it has submenus.',
          'Ask how it opens: a click on a button, a right-click on content, or a shortcut.',
          'Ask where it renders, inside the layout or in a portal that escapes a scrolling container.',
          'Ask how it should behave on a phone.',
        ],
        strongAnswer: [
          'Open a list with role="menu" from a button with aria-haspopup="menu" and aria-expanded, and give the items role="menuitem".',
          'Move focus into the menu when it opens: arrow keys move between items, Home and End jump, Enter or Space activates, and Escape closes it and returns focus to the button.',
          'Close it on an outside click, on Escape, after an action and when focus leaves, with a document listener you remove when the menu closes.',
          'Keep it on screen by flipping it above the trigger near the bottom edge, and render it in a portal when a parent clips overflow.',
          'Keep the API small and composable, such as a Menu with Trigger and Item parts, so a product team can use it without reading its code.',
        ],
        commonMiss:
          'Opening the menu on hover with no keyboard path, or closing it with a document listener that also catches the click that opened it, so it closes as soon as it appears.',
        resourceLabel: 'Build a dropdown as a JavaScript class, then port it to React (free; checks and a reference solution)',
        resourcePath: '/react/coding/react-vanilla-dropdown-port',
      },
      {
        id: 'ui-from-a-screenshot',
        title: 'Build a UI from a screenshot with a partner',
        statement: 'Build a fairly simple UI in React from a screenshot, in a paired session.',
        whatThisMeasures:
          'Whether you can read layout and spacing off an image, keep the React plain and readable, and talk through choices with a partner as you build.',
        clarifyFirst: [
          'Ask which parts must match closely and which can be approximate, since a blurry image hides exact values.',
          'Ask what should be interactive and what is static.',
          'Ask which styling approach the codebase uses.',
          'Ask whether they want the simplest working React or a reusable component.',
        ],
        strongAnswer: [
          'Break the screenshot into regions first and name the components aloud before writing any.',
          'Lay it out with flex or grid and one spacing scale instead of pixel values the image cannot confirm.',
          'Use plain useState and props unless your partner asks for more; in the 2024 loop the interviewers told the candidate not to use the fancier hook APIs they offered.',
          'Ask your partner before each decision that changes the shape of the code, and take their steer.',
          'Leave time for the states the screenshot does not show: empty, long text and a narrow screen.',
        ],
        commonMiss:
          'Reaching for fancier hook APIs, context or a state library for a small UI, which can read as over-building in a paired session and costs the time the details need.',
        resourceLabel: 'Build an event log from a design spec, with style checks (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-event-log-design-spec',
      },
      {
        id: 'text-editor-class',
        title: 'Implement a text editor class against test cases',
        statement: 'Implement the functions of a small text editor class and make the given test cases pass.',
        whatThisMeasures: 'Whether you keep the text and the cursor consistent through string operations and handle the edges the tests probe.',
        clarifyFirst: [
          'Ask what the methods are: insert at the cursor, delete before it, move it, read the text.',
          'Ask what happens past the ends: does a delete stop at the start, does a move clamp?',
          'Ask whether undo and redo come next, so the design leaves room for them.',
          'Ask how the tests call the class and which inputs count as invalid.',
        ],
        strongAnswer: [
          'Keep the text and a cursor index, and write each method as one string operation and a cursor update.',
          'Clamp a delete at the start of the text and a cursor move inside it, and make the clamping visible in the code.',
          'Decide what bad input does, and check it, before writing the happy path.',
          'Run the tests after each method, then add your own for the edges: an empty text, the cursor at either end, a count larger than the text.',
          "Shape each change as a record of what was removed and inserted if undo and redo may follow, as they do in the undo and redo question.",
        ],
        commonMiss:
          'Moving the cursor back by the requested count instead of by what was actually deleted, so after a clamped delete the cursor lands before the start of the text.',
        resourceLabel: 'Build the text editor with undo and redo; its first part is this class (Premium; checks and a reference solution)',
        resourcePath: '/javascript/coding/js-text-editor-undo-redo',
      },
      {
        id: 'debugging-method',
        title: 'Debug a small codebase you have not seen',
        statement: 'Find, diagnose and fix bugs in a small codebase in about 40 minutes; the accounts name TypeScript, and one names React.',
        whatThisMeasures: 'Whether you have a method: reproduce, read the failing test or report, find the code path, form a hypothesis, fix the cause and verify.',
        clarifyFirst: [
          'Ask what is reported: failing tests, a bug report from a user, or both.',
          'Ask whether you may add logs or tests.',
          'Ask whether the goal is one deep fix or as many as you can find.',
          'Ask whether you may use your own editor, which Notion allows if you tell the coordinator.',
        ],
        strongAnswer: [
          'Reproduce first: run the tests or the app and watch the bug happen, so you know when it is gone.',
          'Read the failing test as the spec, then trace from the entry point it calls to the code that produces the wrong value.',
          'State a hypothesis before you change code, and check it with a log or a breakpoint.',
          'Fix the cause rather than the symptom, keep the fix where the cause is, and re-run everything.',
          'Narrate as you go, since the round tests how you find and diagnose bugs, not only whether you fix them, and leave a minute to say what you would test next.',
        ],
        commonMiss:
          'Changing code where the symptom shows rather than where the wrong value is made, so a test passes while the bug stays, or fixing several things at once and losing track of which change mattered.',
        resourceLabel: 'Debug a product search that misuses its API (Premium; checks and a reference fix)',
        resourcePath: '/react/coding/react-debug-api-misuse',
      },
      {
        id: 'take-home-one-direction',
        title: 'Plan and defend a 3-hour take-home',
        statement: 'Build and defend a feature in a 3-hour take-home.',
        whatThisMeasures:
          "Whether you can scope: pick the direction that shows the most judgment, finish it well, and write down what you left and why, which matches what Notion's guide says reviewers look for.",
        clarifyFirst: [
          'Read the brief twice and list every direction it allows before choosing one.',
          'Note what the starter does wrong today, such as one request per keystroke or a trigger check that ignores the caret.',
          'Check how the submission is run and tested, and what the write-up must cover.',
          'Decide how you will show the direction works: a few focused tests, or a short note on how to see it.',
        ],
        strongAnswer: [
          'Pick one direction and finish it end to end, for example fast typing with debounce, cancellation and stale responses handled, or one ranking across result kinds with a documented score.',
          'Fix the starter problems your direction touches, and leave the rest alone.',
          'Write a few focused tests for the logic you added, with ranking or date resolution as plain functions.',
          'Resolve a relative date against the clock when it is used, instead of storing it as a word.',
          'Write the trade-offs plainly: what you chose, what you left, and what you would do next with more time.',
          'Prepare for the review: after 5 minutes of introductions, the onsite debugging slot gives 10 minutes to your take-home.',
        ],
        commonMiss:
          'Spreading three hours over every direction, so nothing is finished, or writing the write-up as a list of features instead of the trade-offs behind the choice.',
        resourceLabel: 'Practise a command palette with three sources of different speeds (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-command-palette-sources',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Notion frontend interview preparation plan',
    intro:
      'A day per stage of the loop: the product builds of the screen, the AI-enabled round, design, React knowledge, and the conversations that close the loop. Interns and new grads can trade days 4 and 5 for a timed take-home and a debugging drill.',
    days: [
      {
        day: 'Day 1',
        focus: 'A JSON viewer in React: built in stages within an hour.',
        artifact: 'A viewer that keeps working at every stage, and the stage that took longest.',
        practice: [{ label: 'JSON viewer in stages', path: '/react/coding/react-json-tree-viewer' }],
      },
      {
        day: 'Day 2',
        focus: 'A nested to-do list: the tree model first, then the UI with the keyboard, in about an hour.',
        artifact: 'Model functions with tests, and a list you can drive without a mouse.',
        practice: [{ label: 'To-do list with local state', path: '/react/coding/react-todo-list' }, { label: 'Nested to-do outliner', path: '/react/coding/react-nested-todo-outliner' }],
      },
      {
        day: 'Day 3',
        focus: 'Undo and redo for text edits: 45 minutes of code, then the design discussion around them.',
        artifact: 'A working history and a two-minute explanation of its design.',
        practice: [{ label: 'Text editor with undo and redo', path: '/javascript/coding/js-text-editor-undo-redo' }],
      },
      {
        day: 'Day 4',
        focus:
          'The AI-enabled round: set up your tool, then fix failing tests, a slow path and messy code in a small codebase, checking every change by running the tests, in an hour.',
        artifact: 'A short checklist for working with the assistant, and a list of suggestions you rejected and why.',
        practice: [{ label: 'Debug, speed up and tidy a small notes app', path: '/javascript/debug/js-debug-notes-app-repo' }],
      },
      {
        day: 'Day 5',
        focus: 'Frontend design: a calendar UI with its data model, loading, event layout and editing, drawn on the tool you will use, in 60 minutes.',
        artifact: 'A one-page diagram with the three hardest parts named.',
        practice: [{ label: 'System design blueprint', path: '/guides/system-design-blueprint' }],
      },
      {
        day: 'Day 6',
        focus: 'React out loud: hooks, re-renders and useEffect against useState, then a menu component with full keyboard support.',
        artifact: 'Two-sentence answers, and a menu you can use without a mouse.',
        practice: [{ label: "Why a component re-renders when its props didn't change", path: '/react/trivia/react-rerender-decision-and-render' }, { label: 'Which React hooks have you used, and when would you choose each?', path: '/react/trivia/react-hooks-youve-used' }, { label: 'Build a dropdown as a JavaScript class, then port it to React', path: '/react/coding/react-vanilla-dropdown-port' }],
      },
      {
        day: 'Day 7',
        focus:
          "Career history and values: fewer stories in more detail, why Notion, a conflict on a team and the AI tools you use; read Notion's operating values.",
        artifact: 'The drill stories, and questions for the recruiter: the onsite rounds, the AI tool and the prep material.',
        practice: [{ label: 'STAR stories guide', path: '/guides/behavioral/stories' }],
      },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Notion frontend interview preparation questions',
    items: [
      {
        question: 'How many interview rounds does Notion have for frontend engineers?',
        answer:
          "Notion's Front End guide gives a 30-minute initial interview, a 60-minute technical screen, a 4-hour virtual onsite of four interviews (AI-enabled coding, code review, software design and career history), then one or more final interviews of 30 to 45 minutes, references and a background check. Before 2026, accounts describe onsites with two or three coding rounds instead of the AI-enabled one.",
      },
      {
        question: 'Are these real Notion interview questions?',
        answer:
          "Candidates reported them from their own Notion interviews, and some facts come from Notion's published guides; the wording is ours. None of them is a leak, and Notion has confirmed none of the candidates' accounts. Most accounts are Software Engineer loops, so read each row as a single report.",
      },
      {
        question: 'Does Notion ask LeetCode questions?',
        answer:
          "Sometimes. Most accounts from 2022 to 2026 describe practical coding rather than LeetCode-style problems, and Notion's Front End guide says the AI-enabled round has no LeetCode-style traps. But the frontend accounts from 2023 and 2025 each had a data-structures question, some onsites before 2026 had an algorithm round beside frontend coding, and a 2022 onsite question came down to a topological sort.",
      },
      {
        question: "Are AI tools allowed in Notion's interviews?",
        answer:
          'In the Front End loop, only in the AI-enabled coding round, where Notion encourages them, names AI-enabled IDEs and command-line agents, and marks the round as one to prepare for; its other coding rounds restrict AI. A 2026 entry-level candidate said AI help was allowed but felt a little judged for using it, so confirm the rule for your loop with the recruiter.',
      },
      {
        question: 'What is the Notion intern take-home?',
        answer:
          'A 3-hour take-home before a 2-hour virtual onsite, for interns and new grads. A 2026 account describes building a feature like one Notion has, and the onsite\'s debugging slot includes a 10-minute review of it. The locked take-home row describes the 2026/27 task in our words.',
      },
      {
        question: 'Is the Notion frontend interview in React?',
        answer:
          "Yes, by default. Notion's Front End guide says its frontend coding interviews are designed for React, on CodeSignal, and the AI-enabled round's code is TypeScript. Its 2026 frontend postings list React and TypeScript among the skills.",
      },
      {
        question: 'Does the CEO interview candidates at Notion?',
        answer:
          "Often, by Notion's own account: its 2023 post says its CEO and founder is involved in hiring for almost every role, and two 2026 candidates say their final values interview was with him. Read Notion's operating values before it.",
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Notion rounds',
    intro:
      'Free practice for a Notion loop: the React questions that open rows ask, a simple list to warm up for the screen, a debugging task, a page layout, and stories for the career history round. Notion set none of them; they train what its rounds ask.',
    items: [
      {
        label: "Why a component re-renders when its props didn't change",
        description: 'For the question on stopping re-renders, with the causes and the fixes that work.',
        path: '/react/trivia/react-rerender-decision-and-render',
      },
      {
        label: 'Which React hooks have you used, and when?',
        description: 'For the question on hooks: what each common hook is for and when to reach for it.',
        path: '/react/trivia/react-hooks-youve-used',
      },
      {
        label: 'useEffect: timing, dependencies and cleanup',
        description: 'Half of the useEffect against useState question: when effects run and why they clean up.',
        path: '/react/trivia/react-useeffect-purpose',
      },
      {
        label: 'Why useState exists, and what it guarantees',
        description: 'The other half of that question: what state is for and what React promises about it.',
        path: '/react/trivia/react-usestate-purpose',
      },
      {
        label: 'To-do list with local state',
        description: 'A flat list to warm up on before the nested builds the screen asks for.',
        path: '/react/coding/react-todo-list',
      },
      {
        label: 'Fix a stale closure in a delayed autosave callback',
        description: 'A free debugging task to rehearse reproducing, reading and fixing code you did not write.',
        path: '/javascript/debug/js-debug-stale-closure-autosave',
      },
      {
        label: 'Semantic page layout',
        description: 'For the homepage assignment: a responsive page built on your own design.',
        path: '/html/coding/html-semantic-layout',
      },
      {
        label: 'STAR stories guide',
        description: 'For career history, the final values interview and the calls after the onsite.',
        path: '/guides/behavioral/stories',
      },
    ],
  },
  methodNote: {
    kicker: 'Method',
    title: 'How we collected these questions',
    paragraphs: [
      "We read candidates' own accounts of Notion interviews on interview-experience pages, forums, a newsletter and discussion threads, Notion's published interview guides and job postings, and code that candidates published while preparing. A row is listed when a first-hand account or Notion's own guide describes the question; question lists on prep sites served only as a cross-check and are not the basis of any row.",
      'Each question shows the year it was reported, not who reported it. Tasks are retold in our words: we do not reproduce take-home briefs, starter code or anything Notion asks candidates to keep private, and every practice task uses our own specification, data and tests. Interviews change between teams and years, so read every row as a single report.',
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Notion practice set',
    copy: 'Premium unlocks every locked Notion row and its answer guide, plus practice tasks with checks and reference solutions, among them the JSON viewer, the nested outliner, undo and redo, the command palette and a notes app to debug.',
    buttonLabel: 'Unlock the full Notion practice set',
    src: 'company_preview_notion',
  },
  about: [
    'Notion frontend interview preparation',
    'Notion AI-enabled coding interview',
    'Notion software engineer intern interview process',
    'JSON viewer in React interview question',
  ],
  indexAnchorLabel: 'Notion frontend interview questions',
};
