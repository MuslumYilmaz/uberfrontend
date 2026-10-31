import type { CompanyEditorialNotes } from './company-editorial-notes.model';

/**
 * Editorial notes for catalog-driven company previews, keyed by company slug.
 * A company without an entry renders the shared template copy unchanged. The SEO inventory
 * scopes this registry per company (COMPANY_SCOPED_REGISTRIES in scripts/seo-content-inventory.mjs),
 * so an entry re-dates only its own page; keep the keys mirrored in
 * frontend/scripts/authored-companies.mjs (EDITORIAL_NOTE_COMPANIES).
 * The preview component imports this object directly: an injection token or a service wrapper
 * would be projected into every company page by the inventory and re-date all of them at once.
 */
export const COMPANY_EDITORIAL_NOTES: Readonly<Record<string, CompanyEditorialNotes>> = {
  walmart: {
    slug: 'walmart',
    title: 'Walmart Frontend Interview: 2026 Assessment and Karat Screen',
    h1: 'Walmart Frontend Interview Questions and Process',
    description:
      'How public reports describe Walmart frontend interviews: the 2026 HackerRank Frontend Engineering Assessment, the Karat screen, React rounds and practice items.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle:
        'Walmart Global Tech loops reported from India and the US, from the 2024 multiple-choice assessment to the 2026 HackerRank Frontend Engineering Assessment, with free and premium practice items for each round.',
    },
    intro: [
      'Walmart publishes no frontend interview guide, so this page rests on public interview reports: process accounts from 2022 to 2026 and question sources from 2020. Most of the detail comes from Walmart Global Tech India; US accounts mostly describe the shape of the loop rather than its questions.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'Three loop shapes, by role and region',
      paragraphs: [
        'The loop depends on the role and the office. Two SDE 3 (UI) accounts describe three 60-minute rounds, and a third lists the same rounds without durations. SDE-2 and frontend engineer accounts from India open with an online assessment. Software Engineer III and senior accounts, mostly from the US, add a coding screen, design rounds and a hiring manager conversation.',
      ],
      bullets: [
        {
          text: 'SDE 3 (UI): a DSA round, a JavaScript, React and web fundamentals round, then a hiring manager round, each about 60 minutes. One account adds a 30-minute HR call about two weeks later.',
          link: { label: 'See the SDE 3 (UI) stages', fragment: 'walmart-interview-process-1' },
        },
        {
          text: 'SDE-2 and frontend engineer roles in India: a 2024 assessment with 20 multiple-choice questions on HTML, CSS and JavaScript, two easy coding questions in JavaScript and 10 multiple-choice questions on React or Angular, then a LeetCode-medium round, a React round and a final round.',
          link: { label: 'See the SDE-2 stages', fragment: 'walmart-interview-process-2' },
        },
        {
          text: 'Software Engineer III and senior: a Karat screen with about ten minutes of short answers before coding, or a HackerRank screen. The 2026 HackerRank Frontend Engineering Assessment pairs a coding problem with debugging a React or Angular app, with AI assistance allowed for UI navigation, syntax and clarification.',
          link: { label: 'See the senior stages', fragment: 'walmart-interview-process-3' },
        },
        {
          text: 'Senior onsites mix coding rounds, one or two design rounds and a behavioural or hiring manager round. A staff candidate for an advertising team was sent a backend-only guide, so the team sets the format.',
        },
      ],
    },
    roundSpotlights: [
      {
        id: 'frontend-engineering-assessment',
        kicker: 'Round decoder',
        title: 'Walmart Frontend Engineering Assessment and Karat interview: what each one asks',
        lede: [
          'A May 2026 invitation email described a HackerRank Frontend Engineering Assessment with two parts: a language-agnostic coding problem and a React or Angular debugging task, with AI assistance for UI navigation, syntax and clarification. The recruiter had first mentioned DSA and low-level design. A September 2026 full-stack invite adds a back-end section, and a commenter who took that test reports 140 minutes, a medium DSA question and an Angular task that adds a feature to an existing project until the test cases pass.',
          'Software Engineer III and senior loops report a coding screen instead: a Karat interview with about ten minutes of short answers and then coding, a one-hour HackerRank interview, two React code challenges on HackerRank, or a 45-minute JavaScript coding round. The team sets the format, so your invitation names the platform that applies to your loop.',
        ],
        facts: [
          { label: '2026 frontend assessment', value: 'Two sections on HackerRank: a language-agnostic coding problem, and debugging a React or Angular app with AI assistance for UI navigation, syntax and clarification. It comes from one pre-interview post quoting the invitation email (May 2026), which gives no length.' },
          { label: '2026 full-stack assessment', value: 'Three sections: one language-agnostic coding question, front-end bug fixing or features in React or Angular with AI assist, and a back-end task in Node, Spring or Django with AI assist. One commenter who took it reports 140 minutes, a medium DSA question, an Angular feature added to an existing project until the test cases pass, and a simpler Java task (September 2026).' },
          { label: '2024 assessment (India)', value: 'An older shape in one account: 20 multiple-choice questions on HTML, CSS and JavaScript, two easy coding questions in JavaScript only, and 10 multiple-choice questions on React or Angular.' },
          { label: 'Karat interview', value: 'About ten minutes of short answers, then coding; reported for software engineer to senior roles.' },
          { label: 'Other screens', value: 'A one-hour HackerRank interview, two React code challenges on HackerRank, or a 45-minute JavaScript coding round.' },
          { label: 'After the screen', value: 'One or two coding rounds (React coding, a debugging session, two medium DSA problems, a UI and JavaScript round), one or two design rounds, and a behavioural or hiring-manager round.' },
          { label: 'Sources', value: 'LeetCode, May and September 2026 and October 2024; Taro and Blind accounts from 2022 to 2025. All are linked in the reported process below.' },
        ],
        practiceLink: { label: 'Rehearse the React debugging task (Premium)', path: '/react/coding/react-debug-api-misuse' },
        processLink: { label: 'See the 2026 assessment row in the reported process', fragment: 'walmart-interview-process-3-stage-online-assessment-2026-accounts' },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the reported rounds in order',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'Valid Parentheses',
          path: '/javascript/coding/js-valid-parentheses',
          access: 'free',
          why: 'A warm-up in the shape of the DSA round that opens the SDE 3 (UI) loop.',
        },
        {
          label: 'How SSR and hydration work in React',
          path: '/react/trivia/react-ssr-hydration',
          access: 'free',
          why: 'The fundamentals round asks how React renders and how the web works.',
        },
        {
          label: 'When a React app needs Redux',
          path: '/react/trivia/react-state-management-redux',
          access: 'free',
          why: 'State management questions recur in the React rounds.',
        },
        {
          label: 'Code splitting and module federation',
          path: '/react/trivia/react-code-splitting-module-federation',
          access: 'free',
          why: 'One SDE 3 (UI) account was asked about module federation.',
        },
        {
          label: 'Debug a product search that misuses its API',
          path: '/react/coding/react-debug-api-misuse',
          access: 'premium',
          why: 'The 2026 assessment describes debugging a React or Angular app, and a Walmart-badged commenter on a Software Engineer III thread listed a React coding round and a debug session.',
        },
        {
          label: 'Select with compound components',
          path: '/react/coding/react-select-compound-api',
          access: 'premium',
          why: 'A component API design task reported in an SDE 3 (UI) round.',
        },
        {
          label: 'Implement useMemo and a Context data provider',
          path: '/react/coding/react-implement-usememo-context',
          access: 'premium',
          why: 'Reported as a from-scratch hooks task that then extends to API results.',
        },
        {
          label: 'Design a real-time messaging inbox',
          path: '/system-design/messaging-inbox-frontend',
          access: 'premium',
          why: 'A practice version for the design rounds. The chat prompt comes from published advice, not from a reported round.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Walmart frontend interviews',
      items: [
        {
          question: 'Is there a system design round?',
          answer:
            'Senior and Software Engineer III accounts, mostly from the US, report one or two design rounds. The SDE 3 (UI) accounts from India report none, and none of them mentions an online assessment either.',
        },
        {
          question: 'What is the Walmart Frontend Engineering Assessment, and which platform runs the screen?',
          answer:
            'A May 2026 invite describes a HackerRank Frontend Engineering Assessment with two parts: a language-agnostic coding problem and a React or Angular debugging task, with AI assistance allowed for UI navigation, syntax and clarification. A September 2026 full-stack invite adds a back-end section, and a commenter who took it reports 140 minutes. Other reports name HackerRank, including CodePair, and Karat. Your invitation names the platform that applies to your loop.',
        },
        {
          question: 'Are these the real Walmart questions?',
          answer:
            'No. They are practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Walmart questions. Treat recruiter material as the source of truth.',
        },
      ],
    },
    about: ['Walmart frontend interview preparation', 'Walmart Global Tech hiring loop'],
  },
  bytedance: {
    slug: 'bytedance',
    title: 'ByteDance and TikTok Frontend Interview Process and Prep',
    h1: 'ByteDance and TikTok Frontend Interview Questions',
    description: 'How public reports describe ByteDance and TikTok frontend loops: HackerRank or CodeSignal assessments, a DSA round, a frontend round and a design round.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Early-careers pages from ByteDance and TikTok plus public interview reports from 2020 to 2025: assessments on HackerRank or CodeSignal, two technical rounds and a hiring manager round, with regional variants.',
    },
    intro: ['ByteDance and TikTok publish interview tips for early careers only, linked below. The experienced loop comes from public accounts, nine outside Taro and about sixteen on it, six of them new-graduate or intern loops, which agree on the core shape and differ on what the hiring manager round contains.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'Two technical rounds and a hiring manager round, by region',
      paragraphs: ['US accounts describe an online assessment for some candidates, a 15 to 30 minute recruiter call, two technical rounds of about an hour, one on algorithms and one on frontend, then a hiring manager round that often includes frontend system design, and an HR conversation.'],
      bullets: [
        {
          text: 'Assessments run on CodeSignal in one 2025 account and on an unnamed platform in two others; HackerRank appears in the new-graduate and intern accounts. One 2025 Singapore CodeSignal task was a single frontend problem in four levels; a US assessment had four questions in 70 minutes.',
          link: {
            label: 'See the US stages',
            fragment: 'bytedance-interview-process-1',
          },
        },
        {
          text: 'The frontend round builds a React component or a JavaScript utility: a tooltip component in one account, a throttle function with a fetch-and-render task in another, LeetCode 784 plus React coding in a third.',
        },
        {
          text: 'Singapore and Australia loops add an HR call and two or three technical rounds; two candidates skipped the assessment.',
          link: {
            label: 'See the Singapore and Australia stages',
            fragment: 'bytedance-interview-process-2',
          },
        },
        {
          text: 'New graduates and interns take an assessment with multiple-choice, algorithm and debugging questions, then one to three technical interviews and a manager or behavioural round.',
          link: {
            label: 'See the early-careers stages',
            fragment: 'bytedance-interview-process-3',
          },
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the reported rounds in order',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'Build a tree from a flat list',
          path: '/javascript/coding/js-build-tree-from-flat-list',
          access: 'free',
          why: 'Reported in a 2023 new-graduate loop: create a tree from a flat array of objects.',
        },
        {
          label: 'The event loop',
          path: '/javascript/trivia/js-event-loop',
          access: 'free',
          why: 'Output-order questions on setTimeout and promises recur in the frontend round.',
        },
        {
          label: 'CSS cascade and specificity',
          path: '/css/trivia/css-cascade-order',
          access: 'free',
          why: 'Specificity questions appear in the same round.',
        },
        {
          label: 'Implement Array.prototype.map',
          path: '/javascript/coding/js-array-prototype-map',
          access: 'premium',
          why: 'A representative drill for the reported task of implementing a built-in method.',
        },
        {
          label: 'Implement Array.prototype.reduce',
          path: '/javascript/coding/js-array-prototype-reduce',
          access: 'premium',
          why: 'A second drill for the same reported task.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about ByteDance and TikTok frontend interviews',
      items: [
        {
          question: 'Is the hiring manager round behavioural only?',
          answer: 'Accounts disagree. Several describe frontend system design or React and JavaScript questions in it; others describe a conversation about experience only.',
        },
        {
          question: 'Where does system design appear?',
          answer: 'It varies by account: inside a technical round in a 2022 loop, inside the hiring manager round in three others.',
        },
        {
          question: 'Does every loop start with an assessment?',
          answer: 'No. Two Singapore accounts had none, and the TikTok early-careers page says the assessment depends on the role and region.',
        },
      ],
    },
    about: ['ByteDance frontend interview preparation', 'TikTok frontend interview preparation'],
  },
  microsoft: {
    slug: 'microsoft',
    title: 'Microsoft Frontend Interview Process and Practice Guide',
    h1: 'Microsoft Frontend Interview Questions and Process',
    description: 'What Microsoft publishes about its hiring loop and what public reports add for frontend roles: machine coding, JS and React concepts, DSA and design rounds.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Microsoft publishes its own hiring tips; public interview reports from 2020 to 2025 add the frontend detail: a short recruiter call, machine coding in JavaScript or React, concept rounds, algorithms and design. Loops differ by team and country.',
    },
    intro: ['Microsoft publishes official hiring guidance, linked below. It covers the shape of the loop and its rules rather than frontend content, so the round-by-round detail comes from public interview reports.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'Two to six rounds, set by the team',
      paragraphs: ['The official pages describe a brief screening conversation and two to four conversations of up to an hour each, by phone, on Teams or in person, with no outside assistance unless explicitly permitted. Frontend accounts fill in the rounds.'],
      bullets: [
        {
          text: 'Machine coding, two hours in the one account that gives a duration: plain JavaScript in the 2020 to 2021 accounts from Bangalore, React components in the 2024 to 2025 accounts.',
          link: {
            label: 'See the frontend stages',
            fragment: 'microsoft-interview-process-1',
          },
        },
        {
          text: 'JavaScript and React concepts: output questions, polyfills and promises. One 2025 account wrote a useEffect polyfill and built a step form in React.',
        },
        {
          text: 'Algorithms and problem solving, where two frontend candidates were asked mostly non-frontend questions.',
        },
        {
          text: 'Design rounds: low-level design in the older accounts, an application or component design in 2024.',
        },
        {
          text: 'Loop sizes run from two interviews to five or six; a 2020 account ended with a senior leader conversation.',
        },
        {
          text: 'Students get an initial and a final interview, both virtual.',
          link: {
            label: 'See the student stages',
            fragment: 'microsoft-interview-process-2',
          },
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the concept rounds, then the builds',
      intro: 'Free items first, then the premium set. The coding items here are editorial groupings; no public account reports them as Microsoft prompts.',
      steps: [
        {
          label: 'Promises and async/await',
          path: '/javascript/trivia/js-promises-async-await',
          access: 'free',
          why: 'Promises are a reported theme of the concept rounds.',
        },
        {
          label: 'Arrow functions versus regular functions',
          path: '/javascript/trivia/js-arrow-vs-regular-functions',
          access: 'free',
          why: 'Output questions in the concept rounds lean on this and scope rules.',
        },
        {
          label: 'Passing by value and by reference',
          path: '/javascript/trivia/js-passing-by-value-and-by-reference',
          access: 'free',
          why: 'A frequent output-prediction topic.',
        },
        {
          label: 'Spread versus rest parameters',
          path: '/javascript/trivia/js-spread-vs-rest-parameters',
          access: 'free',
          why: 'Syntax questions from the JavaScript concept round that follows machine coding.',
        },
        {
          label: 'Compare two objects',
          path: '/javascript/trivia/js-compare-two-objects',
          access: 'free',
          why: 'A warm-up for the problem-solving round.',
        },
        {
          label: 'Snake game in Angular',
          path: '/angular/coding/angular-snake-game',
          access: 'free',
          why: 'An editorial grouping that rehearses a timed UI build like the machine coding round.',
        },
        {
          label: 'Chessboard click highlight in React',
          path: '/react/coding/react-chessboard-click-highlight',
          access: 'premium',
          why: 'An editorial grouping for a React component build under time.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Microsoft frontend interviews',
      items: [
        {
          question: 'How many rounds should I expect?',
          answer: 'The official page says two to four conversations. Two Bangalore accounts from 2020 and 2021 report five or six rounds, a third reports four, and 2024 accounts report four, so the team decides.',
        },
        {
          question: 'Are the interviews virtual or on site?',
          answer: 'The student page says every student interview is virtual; the general hiring page allows phone, Teams or in person.',
        },
        {
          question: 'Can I use AI or other help during the interview?',
          answer: 'The official page allows no outside assistance unless it is explicitly permitted.',
        },
      ],
    },
    about: ['Microsoft frontend interview preparation'],
  },
  tesla: {
    slug: 'tesla',
    title: 'Tesla Frontend Interview Process and Practice Questions',
    h1: 'Tesla Frontend Interview Questions and Process',
    description: 'How public reports describe Tesla frontend interviews: a Codility assessment, a one-hour technical screen, 3 or 4 onsite rounds and team-specific take-homes.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Recruiter call, Codility assessment, technical screen and a three or four round onsite, as described in public interview reports from 2020 to 2026, with the free and premium items that rehearse each stage.',
    },
    intro: ['Tesla publishes no frontend interview guide, so this page rests on public interview reports from 2020 to 2026. Several accounts say the format depends on the team, and a few describe what a recruiter planned rather than a finished loop.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'Assessment, screen, then a three or four round onsite',
      paragraphs: ['Two accounts open with a recruiter or HR call; most start with an online assessment, often on Codility, then a one-hour technical screen. The onsite runs three or four rounds of about 45 minutes and mixes frontend coding, an algorithm round, frontend system design and a behavioural or hiring manager conversation.'],
      bullets: [
        {
          text: 'Assessments vary: two hours for five questions on Codility in one account, a three-hour assessment with HTML, CSS, a like button and a string puzzle in another.',
          link: {
            label: 'See the assessment stage',
            fragment: 'tesla-interview-process-1',
          },
        },
        {
          text: 'Frontend coding is mostly React; one 2024 loop ran an Angular round followed by a TypeScript and JavaScript round.',
        },
        {
          text: 'Take-homes are team-specific. Candidates have published two briefs, an energy site layout and a creative technology control; this page describes their shape and does not reproduce them.',
        },
        {
          text: 'Team match matters: a 2026 account passed four technical rounds and got no offer because the team wanted a full-stack engineer.',
        },
        {
          text: 'Interns get one or two rounds, sometimes with a system design final.',
          link: {
            label: 'See the internship stages',
            fragment: 'tesla-interview-process-2',
          },
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the reported stages in order',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'Color contrast ratio',
          path: '/javascript/coding/js-color-contrast-ratio',
          access: 'free',
          why: 'A JavaScript task listed in a 2022 account that also had a Codility assessment.',
        },
        {
          label: 'Forms: validation and required fields',
          path: '/html/coding/html-forms-validation-required',
          access: 'free',
          why: 'The same account lists a login form among its tasks.',
        },
        {
          label: 'Semantic HTML layout',
          path: '/html/coding/html-semantic-layout',
          access: 'free',
          why: 'Reported as replacing divs with semantic HTML5 elements.',
        },
        {
          label: 'CSS positioning badge',
          path: '/css/coding/css-positioning-badge',
          access: 'free',
          why: 'Reported as positioning boxes with CSS.',
        },
        {
          label: 'React fetch and render a list',
          path: '/react/coding/react-fetch-list-states',
          access: 'free',
          why: 'Reported as fetching photos and rendering them with a theme context.',
        },
        {
          label: 'Shallow clone',
          path: '/javascript/coding/js-shallow-clone',
          access: 'free',
          why: 'Copy semantics came up in a published round-one file.',
        },
        {
          label: 'Deep clone',
          path: '/javascript/coding/js-deep-clone',
          access: 'premium',
          why: 'The deep copy half of the same reported task.',
        },
        {
          label: 'React like button',
          path: '/react/coding/react-like-button',
          access: 'premium',
          why: 'Reported in a three-hour assessment.',
        },
        {
          label: 'Battery site layout',
          path: '/react/coding/react-battery-site-layout',
          access: 'premium',
          why: 'A practice version of a published take-home, built on our own catalog and wording.',
        },
        {
          label: 'Car rental booking frontend design',
          path: '/system-design/car-rental-booking-frontend',
          access: 'premium',
          why: 'A practice version for the system design round that discussed a car rental company.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Tesla frontend interviews',
      items: [
        {
          question: 'Does Tesla use a take-home?',
          answer: 'Some teams do. Candidates have published two briefs, one of them marked confidential, so this page describes their shape only and the battery item uses our own catalog and wording.',
        },
        {
          question: 'Which framework should I expect?',
          answer: 'React in most accounts. One 2024 loop ran an Angular round and a TypeScript and JavaScript round, so ask the recruiter which stack the team uses.',
        },
        {
          question: 'Is there a system design round?',
          answer: 'Several onsite accounts include one, on a shared component and its API in one case and a car rental company in another. One intern loop ended with a system design final.',
        },
      ],
    },
    about: ['Tesla frontend interview preparation'],
  },
  'booking-com': {
    slug: 'booking-com',
    title: 'Booking.com Frontend Interview Process and Fit Interview',
    h1: 'Booking.com Frontend Interview Questions and Process',
    description: 'How public reports from 2021 to 2023 describe Booking.com frontend interviews: a HackerRank test, coding rounds with two engineers and the fit interview.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Booking.com publishes a four-step journey; public frontend reports from 2021 to 2023 add the detail: a 90 to 100 minute HackerRank test, one or two 60 minute coding rounds in vanilla JavaScript or React, and a fit interview. One 2025 software engineer account adds a take-home.',
    },
    intro: ['The official page, linked below, describes Application, Interview, Business and Feedback steps over three to six weeks, with technical tests and coding interviews for technical roles. The frontend detail comes from public accounts from 2021 to mid-2023, most of them for Amsterdam roles; a thin September 2025 frontend developer account describes a recruiter call and a live-coding round with two engineers.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'HackerRank test, recruiter call, coding rounds, fit interview',
      paragraphs: ['The HackerRank test runs 90 to 100 minutes with about five items: two algorithm problems, mostly easy (one account had a medium), two HTML and CSS multiple-choice questions and one React component. A short recruiter call follows, 15 minutes in one full-stack account, sometimes with a few technical questions, then one or two coding rounds of about 60 minutes with two engineers, and a fit interview with engineering managers, 60 minutes in that same full-stack account.'],
      bullets: [
        {
          text: 'The coding rounds build a component in plain JavaScript or React. An autocomplete or typeahead recurs; other accounts mention a tooltip, a component fed by API data to a design spec and a new feature added to a prepared app.',
          link: {
            label: 'See the coding stage',
            fragment: 'booking-com-interview-process-1',
          },
        },
        {
          text: 'Backend coding and system design appear only in full-stack and senior accounts; no frontend-titled account describes a system design round.',
        },
        {
          text: 'One account describes a monitored 40-minute HackerRank session with three engineers, a live round rather than the take-home test.',
        },
        {
          text: 'One August 2025 software engineer account describes a take-home followed by a technical session, then system design and an engineering manager round; a May 2025 senior full-stack loop had an easy React exercise and system design.',
        },
      ],
    },
    roundSpotlights: [
      {
        id: 'fit-interview',
        kicker: 'Round decoder',
        title: 'Booking.com fit interview for frontend engineers: what it is and how to prepare',
        lede: [
          'The fit interview is the final round in the public frontend accounts from 2021 to 2023, after the HackerRank test, the recruiter call and one or two coding rounds. One account calls it a team fit with the engineering managers, another a behavioral interview, and two others a culture fit interview; one full-stack account gives it 60 minutes. Booking.com’s own journey page describes Application, Interview, Business and Feedback steps over three to six weeks.',
          'These accounts name the round but list no questions, so treat it as a behavioural conversation: prepare stories with a decision, a trade-off and a measured result, and ask the recruiter who runs it and how long it takes.',
        ],
        facts: [
          { label: 'Position in the loop', value: 'The final round, after the HackerRank test, the recruiter call and one or two coding rounds.' },
          { label: 'What accounts call it', value: 'A team fit with the engineering managers (2022), a behavioral interview (2023), a culture fit interview (2021 and 2022).' },
          { label: 'Length', value: '60 minutes in one full-stack account; the frontend accounts give no duration.' },
          { label: 'Questions', value: 'The frontend accounts name the round but list no questions; the questions they report belong to the coding rounds.' },
          { label: 'Recent loops', value: 'An August 2025 software engineer account describes a take-home, a technical session, system design and an engineering manager round; a thin September 2025 frontend account describes a recruiter call and a live-coding round.' },
          { label: 'Sources', value: 'Taro frontend accounts from 2021 to 2023, linked in the reported process below, and the Booking.com careers journey page.' },
        ],
        practiceLink: { label: 'Prepare with the behavioural interview guide', path: '/guides/behavioral' },
        processLink: { label: 'See the fit interview row in the reported process', fragment: 'booking-com-interview-process-1-stage-fit-interview' },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the autocomplete round first',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'React autocomplete search',
          path: '/react/coding/react-autocomplete-search-starter',
          access: 'free',
          why: 'The autocomplete that recurs across the coding rounds.',
        },
        {
          label: 'Debounce',
          path: '/javascript/coding/js-debounce',
          access: 'free',
          why: 'The debounce discussed inside the autocomplete rounds.',
        },
        {
          label: 'Flatten one level',
          path: '/javascript/coding/js-flatten-once',
          access: 'free',
          why: 'An editorial grouping for the easy algorithm items of the HackerRank test.',
        },
        {
          label: 'Forms: validation and required fields',
          path: '/html/coding/html-forms-validation-required',
          access: 'free',
          why: 'An editorial grouping for the HTML and CSS questions of the test.',
        },
        {
          label: 'Throttle',
          path: '/javascript/coding/js-throttle',
          access: 'premium',
          why: 'The throttle variant discussed in a 2023 machine coding round.',
        },
        {
          label: 'React debounced search',
          path: '/react/coding/react-debounced-search',
          access: 'premium',
          why: 'A practice version of the component fed by API data to a design spec.',
        },
        {
          label: 'Vue autocomplete search',
          path: '/vue/coding/vue-autocomplete-search',
          access: 'premium',
          why: 'The same autocomplete in Vue, one of the frameworks candidates could choose.',
        },
        {
          label: 'Real-time search with debounce and cache',
          path: '/system-design/realtime-search-debounce-cache',
          access: 'premium',
          why: 'A design-level practice version for the autocomplete with caching and keyboard navigation.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Booking.com frontend interviews',
      items: [
        {
          question: 'Is there a system design round for frontend roles?',
          answer: 'Not in the frontend-titled accounts. Backend coding and system design appear in full-stack and senior accounts only.',
        },
        {
          question: 'Is the HackerRank test monitored?',
          answer: 'One account describes a monitored 40-minute session with three engineers, which was a live round. The take-home test in the other accounts ran 90 to 100 minutes on its own.',
        },
        {
          question: 'How recent are these reports?',
          answer: 'Detailed frontend accounts run from 2021 to mid-2023; a thin September 2025 frontend developer account describes a recruiter call and a live-coding round with two engineers. The 2025 software engineer accounts describe a take-home followed by a technical session in one case and an easy React exercise plus system design in another.',
        },
      ],
    },
    about: ['Booking.com frontend interview preparation'],
  },
  zalando: {
    slug: 'zalando',
    title: 'Zalando Frontend Interview Process and Practice',
    h1: 'Zalando Frontend Interview Questions and Process',
    description: 'What Zalando publishes about its hiring loop and what public reports add for frontend roles: a Codility take-home, JS fundamentals and system design rounds.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Zalando publishes two process pages; public interview reports from 2019 to 2024 add the Berlin frontend loop: a two to three hour Codility take-home, a hiring manager call, then a final day that reviews the take-home and covers JavaScript fundamentals, system design and a manager conversation.',
    },
    intro: ['The two official pages, linked below, describe a 30-minute talent acquisition call, a case study or coding exercise, a hiring manager interview and three to five final interviews of 45 to 60 minutes. Only three complete frontend loops are public, two of them from Berlin, and only one is from after 2022.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'A take-home, a hiring manager call and a final day',
      paragraphs: ['The take-home is a Codility challenge of two to three hours in 2022 and 2024, a React and Node app or easy algorithm problems; the 2020 assessment named no platform and gave three working days for a React question plus an API design question. The hiring manager interview is sometimes non-technical. The final day of the 2024 account had a 45-minute take-home review, an hour of JavaScript fundamentals with two senior frontend engineers, an hour of system design and 45 minutes with the engineering manager.'],
      bullets: [
        {
          text: 'The 2024 take-home was a search box with suggestions on every keystroke, with a hand-written debounce and a discussion of further optimisation.',
          link: {
            label: 'See the challenge stage',
            fragment: 'zalando-interview-process-1',
          },
        },
        {
          text: 'The system design round leaned backend in 2024, a load balancer for HTTP requests; a 2019 account expected something related to e-commerce.',
        },
        {
          text: 'The official pages differ: the Tech tab puts the case study before the hiring manager, and the 2023 blog lists the hiring manager before a live coding interview and treats a take-home as an optional extra. The blog gives two to three weeks for the loop.',
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the take-home, then the fundamentals hour',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'React autocomplete search',
          path: '/react/coding/react-autocomplete-search-starter',
          access: 'free',
          why: 'The search box with suggestions from the 2024 take-home.',
        },
        {
          label: 'Debounce',
          path: '/javascript/coding/js-debounce',
          access: 'free',
          why: 'The debounce the same account wrote by hand.',
        },
        {
          label: 'Deferred and async scripts',
          path: '/javascript/trivia/js-deferred-scripts',
          access: 'free',
          why: 'async versus defer, asked in the JavaScript fundamentals hour.',
        },
        {
          label: 'HTML parsing and rendering',
          path: '/html/trivia/html-parsing-rendering',
          access: 'free',
          why: 'The CSSOM and rendering questions from the same hour.',
        },
        {
          label: 'Web performance: optimise load time',
          path: '/javascript/trivia/web-performance-optimize-load-time',
          access: 'free',
          why: 'Metrics such as FCP and TTI came up in the fundamentals hour.',
        },
        {
          label: 'XSS and DOM sinks',
          path: '/javascript/trivia/js-xss-dom-sinks',
          access: 'free',
          why: 'Security questions, including XSS, from the fundamentals hour.',
        },
        {
          label: 'Real-time search with debounce and cache',
          path: '/system-design/realtime-search-debounce-cache',
          access: 'premium',
          why: 'A practice version of the optimisation discussion that followed the take-home.',
        },
        {
          label: 'Memoize a function',
          path: '/javascript/coding/js-memoize-function',
          access: 'premium',
          why: 'An editorial grouping for the JavaScript fundamentals hour.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Zalando frontend interviews',
      items: [
        {
          question: 'Is the take-home a React app?',
          answer: 'The 2024 account built a React and Node search box. Earlier accounts had easy algorithm tasks in 2022 and a React plus API design question in 2020, so the challenge changes.',
        },
        {
          question: 'Does the hiring manager come before or after the challenge?',
          answer: 'The two official pages disagree, and in the 2024 account the engineering manager came on the final day. Ask your talent acquisition partner for the order of your loop.',
        },
        {
          question: 'How long does the loop take?',
          answer: 'The 2023 blog gives two to three weeks. The 2020 account had three working days for the take-home alone.',
        },
      ],
    },
    about: ['Zalando frontend interview preparation'],
  },
  stripe: {
    slug: 'stripe',
    title: 'Stripe Frontend Interview Process and Practice Questions',
    h1: 'Stripe Frontend Interview Questions and Process',
    description: 'How public reports describe Stripe frontend interviews: a 60 minute multi-part CoderPad screen, then an onsite with bug squash, integration and frontend design.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Stripe describes its process only in general terms; public interview reports from 2022 to 2025 fill in the frontend loop: a multi-part CoderPad screen and an onsite built around a bug squash, an integration exercise and frontend design.',
    },
    intro: ['The careers FAQ, linked below, describes a recruiter screen, a technical or skills-based assessment and interviews with the team, and says timelines vary by role, level and location. Candidates mention a preparation document that recruiters share; the detail here comes from public accounts.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'A multi-part screen, then an onsite of four or five rounds',
      paragraphs: ['Accounts describe a 30-minute recruiter call and a 60-minute CoderPad screen with two to four exercises; one screen was a three-part exercise, another a four-digit code entry form. The onsite rows rest on fewer accounts: a programming exercise, a bug squash in an unfamiliar project, an integration of two provided tools, frontend design and a conversation about experience and goals.'],
      bullets: [
        {
          text: 'The bug squash and integration rounds were the hardest in a 2022 account, and one candidate got a hiring manager interview instead of the bug squash.',
          link: {
            label: 'See the onsite stages',
            fragment: 'stripe-interview-process-1',
          },
        },
        {
          text: 'One account describes about three weeks for the loop plus two more for an answer.',
        },
        {
          text: 'A 2024 account of a JSON traversal and manipulation screen says the exercise suits JavaScript candidates; it does not share the exact questions.',
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the bug squash and the JSON screen',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'Debug an async race',
          path: '/javascript/debug/js-debug-async-race',
          access: 'free',
          why: 'A debugging exercise in the shape of the bug squash round.',
        },
        {
          label: 'Debug a stale closure in autosave',
          path: '/javascript/debug/js-debug-stale-closure-autosave',
          access: 'free',
          why: 'A second bug squash rehearsal, on a stale closure.',
        },
        {
          label: 'BigInt in JavaScript',
          path: '/javascript/trivia/js-bigint-data-type',
          access: 'free',
          why: 'An editorial grouping for the JavaScript fundamentals a screen can touch.',
        },
        {
          label: 'Group by',
          path: '/javascript/coding/js-group-by',
          access: 'premium',
          why: 'Practice for the JSON traversal and manipulation screen.',
        },
        {
          label: 'Implement lodash get',
          path: '/javascript/coding/js-lodash-get',
          access: 'premium',
          why: 'A second drill for the same screen: safe nested access.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Stripe frontend interviews',
      items: [
        {
          question: 'What is the bug squash round?',
          answer: 'Finding and fixing bugs in a project you have not seen before. One account called it and the integration round the hardest parts of the loop.',
        },
        {
          question: 'Is the screen in JavaScript?',
          answer: 'The screen runs in CoderPad, and the account of the JSON manipulation exercise says it suits JavaScript candidates. Confirm the language with your recruiter.',
        },
        {
          question: 'Does Stripe publish preparation material?',
          answer: 'The careers FAQ describes the process in general terms only. Candidates mention a document that recruiters share, which is the source of truth for your loop.',
        },
      ],
    },
    about: ['Stripe frontend interview preparation'],
  },
  uber: {
    slug: 'uber',
    title: 'Uber Frontend Interview Process and Practice Questions',
    h1: 'Uber Frontend Interview Questions and Process',
    description: 'Uber publishes its frontend loop: a HackerRank assessment, a coding and design phone screen, and three 60 minute interviews. Public reports add the detail.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Uber is one of the few companies with an official frontend interview guide. This page pairs it with public interview reports from 2021 to 2026 and the practice items that fit each stage.',
    },
    intro: ['The official guide, linked below, lists every stage for levels L3 to L6+ and says the steps may vary by role, location and business need. Two of the public accounts come from India and one from Brazil; the others do not say where they interviewed.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'The official loop and what candidates met',
      paragraphs: ['The guide describes a 30-minute recruiter call, a HackerRank coding assessment, a 60-minute phone screen on coding plus design and architecture, then three 60-minute interviews: algorithms and data structures, depth in specialization, and collaboration and leadership. A published candidate story adds a separate system design round and a hiring manager conversation about past projects.'],
      bullets: [
        {
          text: 'A November 2022 account took a 35-minute CodeSignal test with two algorithm questions and eight frontend multiple-choice questions rather than HackerRank; the other 2022 accounts mention no assessment.',
          link: {
            label: 'See the assessment stage',
            fragment: 'uber-interview-process-1',
          },
        },
        {
          text: 'The phone screen sometimes builds a React component; the specialization round is a UI build or a JavaScript problem, in plain JavaScript in two accounts.',
        },
        {
          text: 'Mid-level and senior accounts report a separate system design round; three of them designed a calendar: a collaborative calendar in 2022 and Google Calendar in two 2025 loops.',
        },
        {
          text: 'Two accounts got different rounds than the recruiter had announced, and one candidate did every round in a single day.',
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the screen, then the specialization round',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'CSS position: relative, absolute and fixed',
          path: '/css/trivia/css-position-relative-absolute-fixed',
          access: 'free',
          why: 'CSS position came up in a 2025 recruiter call.',
        },
        {
          label: 'CSS visibility versus display',
          path: '/css/trivia/css-visibility-vs-display',
          access: 'free',
          why: 'CSS display came up in the same call.',
        },
        {
          label: 'Promises and async/await',
          path: '/javascript/trivia/js-promises-async-await',
          access: 'free',
          why: 'A 2025 loop had a round on promises.',
        },
        {
          label: 'Truthy, falsy and strict equality',
          path: '/javascript/trivia/js-truthy-falsy-pass-by-value-reference-strict-equality-use-case',
          access: 'free',
          why: 'An editorial grouping for the JavaScript side of the specialization round.',
        },
        {
          label: 'Concurrency map with a limit',
          path: '/javascript/coding/js-concurrency-map-limit',
          access: 'premium',
          why: 'Reported as a mapLimit task in a 2022 CodeSignal phone screen.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Uber frontend interviews',
      items: [
        {
          question: 'HackerRank or CodeSignal?',
          answer: 'The official guide names HackerRank. The 2021 and 2022 accounts used CodeSignal, so expect either and check your invitation.',
        },
        {
          question: 'Is design a separate round?',
          answer: 'The guide puts design inside the phone screen. The published candidate story and four accounts describe a separate system design round, usually for mid-level and senior candidates.',
        },
        {
          question: 'Do recruiter labels match the rounds?',
          answer: 'Not in two accounts: candidates told to expect an algorithms round got a frontend task instead. Prepare for both.',
        },
      ],
    },
    about: ['Uber frontend interview preparation'],
  },
  apple: {
    slug: 'apple',
    title: 'Apple Frontend Interview Process and Practice Questions',
    h1: 'Apple Frontend Interview Questions and Process',
    description: 'How public reports describe Apple frontend interviews: a recruiter call, a 45 to 60 minute coding screen in React, JS or TS, and a team loop of 4 to 7 rounds.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Apple publishes general interview tips but no process or frontend guide, so this page rests on public interview reports from 2021 to 2025: a technical screen, then a team loop of four to seven rounds whose mix differs by team.',
    },
    intro: ['The Apple careers site has a general interview-tips page, linked below, with advice before, during and after an interview and a note that some roles include a technical assessment or coding exercises; it lists no stages and no frontend content. Four of the nine frontend accounts behind this page describe both a screen and a team loop of mostly frontend coding; the rest describe one stage, and all differ on what the team decides.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'A screen, then a team loop of four to seven rounds',
      paragraphs: ['Most accounts start with a recruiter call, sometimes a hiring manager conversation, then a technical screen of 45 to 60 minutes in React, JavaScript or TypeScript. The team loop runs four to seven interviews of 30 to 45 minutes, mostly JavaScript, React and CSS coding and concepts.'],
      bullets: [
        {
          text: 'One 2025 account describes a one-hour online assessment with two coding questions and 20 multiple-choice questions before the recruiter call.',
          link: {
            label: 'See the assessment stage',
            fragment: 'apple-interview-process-1',
          },
        },
        {
          text: 'One screen was mostly conversational with about 15 minutes of coding in CoderPad; another asked for an autocomplete search bar in TypeScript with Vue or React.',
        },
        {
          text: 'Loop composition differs by team: four coding rounds with no behavioural and no system design round in one 2025 account, one behavioural round in another, two cross-functional interviews in a third.',
        },
        {
          text: 'One account ended with a director meeting after the loop.',
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the screen, then the coding loop',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'Theme variables and dark mode',
          path: '/css/coding/css-theme-variables-dark-mode',
          access: 'free',
          why: 'Reported as building a light and dark theme.',
        },
        {
          label: 'Build a tree from a flat list',
          path: '/javascript/coding/js-build-tree-from-flat-list',
          access: 'free',
          why: 'A nested-tabs-from-a-flat-list task described in a 2025 account.',
        },
        {
          label: 'Unique array',
          path: '/javascript/coding/js-unique-array',
          access: 'premium',
          why: 'Reported as concatenating two arrays and finding the unique elements.',
        },
        {
          label: 'Stack and queue, with a min stack',
          path: '/javascript/coding/js-stack-queue-implementation',
          access: 'premium',
          why: 'Reported as a min stack.',
        },
        {
          label: 'Vue autocomplete search',
          path: '/vue/coding/vue-autocomplete-search',
          access: 'premium',
          why: 'The autocomplete search bar reported in a 2022 screen, in one of the two frameworks offered.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Apple frontend interviews',
      items: [
        {
          question: 'Does Apple publish a preparation page?',
          answer: 'Only a general interview-tips page, linked in the official pages table; it lists no stages. Every stage here comes from public interview reports.',
        },
        {
          question: 'Is there a system design round?',
          answer: 'Not in the frontend-titled accounts. One 2025 account says its loop had four coding rounds with no behavioural and no system design round.',
        },
        {
          question: 'Is the loop the same for every team?',
          answer: 'No. One account had seven 30-minute interviews, another five 45-minute ones, and the behavioural and cross-functional rounds appear in some teams only.',
        },
      ],
    },
    about: ['Apple frontend interview preparation'],
  },
  airbnb: {
    slug: 'airbnb',
    title: 'Airbnb Frontend Interview Practice and Official FAQ',
    h1: 'Airbnb Frontend Interview Practice',
    description: 'How two public Airbnb frontend accounts and the official careers FAQ describe the loop: a screen with passing tests, React UI coding and architecture questions.',
    hero: {
      kicker: 'Public preview',
      subtitle: 'One coding component in three frameworks and two concept items grouped under Airbnb, plus the official careers FAQ and what two public frontend accounts describe.',
    },
    intro: ['The official careers FAQ, linked below, says the process can involve a test, a video or an event, that candidates meet several members of the team, and gives response times; it also warns about recruiting scams. Two public frontend accounts from 2022 and 2024 and a few Blind threads describe a technical screen where the tests must pass, UI coding in React or plain HTML, CSS and JavaScript, one algorithm question and one architecture question. They are too few for a stage-by-stage table, so this page summarises them without one.'],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'An editorial practice grouping',
      intro: 'The chips input is an editorial grouping with no Airbnb account behind it. Closures and the event loop are named as JavaScript fundamentals in a 2024 Blind comment about an Airbnb frontend loop.',
      steps: [
        {
          label: 'Closures',
          path: '/javascript/trivia/js-closures',
          access: 'free',
          why: 'A staple of JavaScript concept rounds.',
        },
        {
          label: 'The event loop',
          path: '/javascript/trivia/js-event-loop',
          access: 'free',
          why: 'A staple of JavaScript concept rounds.',
        },
        {
          label: 'Chips input with autocomplete in React',
          path: '/react/coding/react-chips-input-autocomplete',
          access: 'premium',
          why: 'A component build with keyboard handling and suggestions.',
        },
        {
          label: 'Chips input with autocomplete in Angular',
          path: '/angular/coding/angular-chips-input-autocomplete',
          access: 'premium',
          why: 'The same component in Angular.',
        },
        {
          label: 'Chips input with autocomplete in Vue',
          path: '/vue/coding/vue-chips-input-autocomplete',
          access: 'premium',
          why: 'The same component in Vue.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about this Airbnb page',
      items: [
        {
          question: 'Why is this page short?',
          answer: 'Only two full first-person Airbnb frontend accounts and a few Blind comment threads are readable, so this page summarises them without a stage table. It grows as more accounts can be read in full.',
        },
        {
          question: 'Does Airbnb publish interview guidance?',
          answer: 'The careers FAQ linked in the official pages table covers the shape of the process, response times and a warning about recruiting scams.',
        },
      ],
    },
    about: ['Airbnb frontend interview preparation'],
  },
};

export type CompanyEditorialNotesRegistry = Readonly<Record<string, CompanyEditorialNotes>>;
