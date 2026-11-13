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
        'Walmart Global Tech loops reported from India and the US, from the 2024 multiple-choice assessment to the 2026 HackerRank Frontend Engineering Assessment. The page sets out the three loop shapes round by round, then what candidates were asked, with the first question open to every reader.',
    },
    intro: [
      'Walmart has no public interview guide for frontend roles, so everything here comes from candidates: loop accounts from 2021 to 2026 and questions going back to 2018. Most of the question detail comes from Walmart Global Tech India; the US accounts mostly describe the shape of the loop. Some question accounts come from full-stack and React Native loops, and from those only the frontend and algorithm questions are kept.',
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
          text: 'Senior onsites mix coding rounds, one or two design rounds and a behavioural or hiring manager round. In a 2025 Software Engineer III loop the hiring manager ran the design round, starting from the resume.',
        },
      ],
    },
    roundSpotlights: [
      {
        id: 'frontend-engineering-assessment',
        kicker: 'Round decoder',
        title: 'Walmart Frontend Engineering Assessment and Karat interview: how each one runs',
        lede: [
          'A May 2026 invitation email described a HackerRank Frontend Engineering Assessment with two parts: a language-agnostic coding problem and a React or Angular debugging task, with AI assistance for UI navigation, syntax and clarification. The recruiter had first mentioned DSA and low-level design. A September 2026 full-stack invite adds a back-end section, and a commenter who took that test reports 140 minutes split between a medium DSA question, an Angular section and a simpler Java task.',
          'Software Engineer III and senior loops report a coding screen instead: a Karat interview with about ten minutes of short answers and then coding, a one-hour HackerRank interview, two React tasks on HackerRank, or a 45-minute JavaScript coding round. Your invitation names the platform that applies to your loop.',
        ],
        facts: [
          { label: '2026 frontend assessment', value: 'Two sections on HackerRank: a language-agnostic coding problem, and debugging a React or Angular app with AI assistance for UI navigation, syntax and clarification. It comes from one pre-interview post quoting the invitation email (May 2026), which gives no length.' },
          { label: '2026 full-stack assessment', value: 'Three sections: one language-agnostic coding question, front-end bug fixing or features in React or Angular with AI assist, and a back-end task in Node, Spring or Django with AI assist. One commenter who took it reports 140 minutes, a medium DSA question, an Angular section and a simpler Java task (September 2026).' },
          { label: '2024 assessment (India)', value: 'An older shape in one account: 20 multiple-choice questions on HTML, CSS and JavaScript, two easy coding questions in JavaScript only, and 10 multiple-choice questions on React or Angular.' },
          { label: 'Karat interview', value: 'About ten minutes of short answers, then coding; reported for software engineer to senior roles.' },
          { label: 'Other screens', value: 'A one-hour HackerRank interview (on CodePair for one React Native team), two React tasks on HackerRank, or a 45-minute JavaScript coding round.' },
          { label: 'After the screen', value: 'One or two coding rounds (React coding, a debugging session, two medium DSA problems, a UI and JavaScript round), one or two design rounds, and a behavioural or hiring-manager round.' },
          { label: 'Sources', value: 'LeetCode, May and September 2026 and October 2024; Taro and Blind accounts from 2022 to 2025, all in the sources list that closes the page.' },
        ],
        practiceLink: { label: 'Debug a product search that misuses its API', path: '/react/coding/react-debug-api-misuse' },
        processLink: { label: 'See the 2026 assessment row in the reported process', fragment: 'walmart-interview-process-3-stage-online-assessment-2026-accounts' },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the reported rounds in order',
      intro: 'The open bracket problem first, then one item for each kind of round: the JavaScript and React fundamentals, the 2026 debugging section and the design rounds.',
      steps: [
        {
          label: 'Valid Parentheses',
          path: '/javascript/coding/js-valid-parentheses',
          access: 'free',
          why: 'The open question, from the DSA round of two of the three SDE 3 (UI) accounts and from a 2020 front-end developer account.',
        },
        {
          label: 'Frontend fundamentals quiz',
          path: '/guides/interview-blueprint/quiz',
          access: 'free',
          why: 'Short JavaScript, React, CSS and browser answers, for the fundamentals round and the short-answer screens.',
        },
        {
          label: 'Debug a product search that misuses its API',
          path: '/react/coding/react-debug-api-misuse',
          access: 'premium',
          why: 'The 2026 Frontend Engineering Assessment has a React or Angular debugging section; this one is in React.',
        },
        {
          label: 'Design a real-time messaging inbox',
          path: '/system-design/messaging-inbox-frontend',
          access: 'premium',
          why: 'For the design rounds of Software Engineer III and senior loops. A Walmart-badged user on Blind gave a chat app as an example of the frontend design asked; this is a practice version of it.',
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
            'Senior and Software Engineer III accounts, mostly from the US, report one or two design rounds. The three SDE 3 (UI) accounts report none, and none of them mentions an online assessment either.',
        },
        {
          question: 'What is the Walmart Frontend Engineering Assessment, and which platform runs the screen?',
          answer:
            'A May 2026 invite describes a HackerRank Frontend Engineering Assessment with two parts: a language-agnostic coding problem and a React or Angular debugging task, with AI assistance allowed for UI navigation, syntax and clarification. A September 2026 full-stack invite adds a back-end section, and a commenter who took it reports 140 minutes. Other reports name HackerRank, including CodePair, and Karat. Your invitation names the platform that applies to your loop.',
        },
        {
          question: 'Where do the reported questions come from?',
          answer:
            'From posts by candidates on LeetCode, Taro, Blind, Medium, Hashnode, dev.to, Code360, GeeksforGeeks and frontendgeek, between 2018 and 2026, written here in our words. They are not leaked or confirmed Walmart questions; most come from Walmart Global Tech India, and several from full-stack loops.',
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
    description: 'How candidates from 2020 to 2026 describe Tesla frontend interviews: a Codility assessment, a one-hour screen, a three or four round onsite and intern rounds.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'A recruiter call, an online assessment that is often on Codility, a one-hour screen, then a virtual onsite of three or four rounds, as frontend candidates described them between 2020 and 2026. Intern loops, which one intern called very team dependent, have a table of their own, and the search bar from a 2025 screen opens the reported questions.',
    },
    intro: ['Tesla has no public interview page for frontend roles, so this page rests on candidates’ posts on Taro, Blind, LeetCode and Code360. Most frontend accounts are from the US and one 2025 account is from Amsterdam; several Blind posts record what a recruiter planned before the interview rather than how it went. The question list also draws on intern loops, a 2022 full-stack new-grad loop on Autopilot and a 2020 general SDE-1 loop, from which only frontend, web and algorithm questions are kept.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'Assessment, screen, then a three or four round onsite',
      paragraphs: ['Two accounts open with a recruiter or HR call; most start with an online assessment, often on Codility, then a one-hour technical screen. The onsite mixes frontend coding, an algorithm round, frontend system design and a behavioural or hiring manager conversation. A 2020 recruiter planned a 60-minute hiring manager interview, a 30-minute product manager interview and two 45-minute engineer rounds, and said two of three coding rounds would be frontend-focused and the third on algorithms; which interview holds the third is not stated. A 2022 account gives its virtual onsite three and a half hours.'],
      bullets: [
        {
          text: 'Assessments vary: two hours for five questions on Codility in a 2022 account; three hours in a 2021 one, with an HTML and CSS question, a React question and a string problem; basic front-end framework tasks in a 2020 one.',
          link: {
            label: 'See the assessment stage',
            fragment: 'tesla-interview-process-1',
          },
        },
        {
          text: 'The one-hour screen took different shapes. In 2025 it was live React coding with basic JavaScript questions and a search bar, the question that opens the list below; in 2022 a senior developer on the team asked React questions about the candidate’s take-home and an easy LeetCode problem.',
          link: {
            label: 'See the technical screen',
            fragment: 'tesla-interview-process-1-stage-technical-screen',
          },
        },
        {
          text: 'Frontend coding is mostly React; a 2024 Fremont loop ran an Angular round with a coding test, then a TypeScript and JavaScript round.',
        },
        {
          text: 'Team match matters: a 2026 account passed four technical rounds and got no offer because the team wanted a full-stack engineer.',
        },
        {
          text: 'Interns describe one or two rounds that vary by team, and one intern loop ended with a system design final.',
          link: {
            label: 'See the internship stages',
            fragment: 'tesla-interview-process-2',
          },
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Start with the search bar, then the onsite rounds',
      intro: 'The open search bar question leads, with a warm-up for the easy problem a 2022 screen added. The React path and the design and behavioural guides follow the order of the loop, and the Premium rehearsal of the one-hour screen comes last.',
      steps: [
        {
          label: 'React autocomplete search',
          path: '/react/coding/react-autocomplete-search-starter',
          access: 'free',
          why: 'The open question: a search bar built in live React coding during a 2025 screen. This version adds the suggestion list.',
        },
        {
          label: 'Valid parentheses',
          path: '/javascript/coding/js-valid-parentheses',
          access: 'free',
          why: 'A warm-up for the easy LeetCode problem in a 2022 screen; which problem it was is not stated.',
        },
        {
          label: 'React interview preparation path',
          path: '/guides/framework-prep/react-prep-path',
          access: 'free',
          why: 'Most onsite coding rounds in these accounts were in React; the 2024 Fremont loop used Angular and TypeScript instead.',
        },
        {
          label: 'Frontend system design blueprint',
          path: '/guides/system-design-blueprint',
          access: 'free',
          why: 'The 2020 and 2024 onsites each had one frontend system design round, and one intern loop ended with one.',
        },
        {
          label: 'Behavioral interview guide',
          path: '/guides/behavioral',
          access: 'free',
          why: 'A 2020 recruiter planned a 60-minute hiring manager interview and a 30-minute product manager interview; the behavioural questions candidates reported are open beside the list.',
        },
        {
          label: 'The one-hour screen, rehearsed',
          path: '/react/trivia/react-phone-screen-search-bar-rehearsal',
          access: 'premium',
          why: 'The one-hour screen in three parts: short JavaScript answers and a search bar, as in the 2025 screen, and an easy problem talked through, as in the 2022 one.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Tesla frontend interviews',
      items: [
        {
          question: 'Does Tesla use a take-home?',
          answer: 'One account mentions one: in 2022 a senior developer on the team asked React questions about a take-home assessment the candidate had submitted; most other accounts describe a timed online assessment, often on Codility. One intern called the format very team dependent, so ask the recruiter what your team sets.',
        },
        {
          question: 'Is there a system design round?',
          answer: 'The 2020 and 2024 onsite accounts each had one frontend system design round, and one intern loop ended with a system design final. A 2025 intern account lists system design for UI components among its technical questions.',
        },
        {
          question: 'Where do the reported questions come from?',
          answer: 'From candidates’ posts on Taro, LeetCode and Code360 dated 2020 to 2025, written here in our words; one behavioural question comes from a Blind commenter. Some come from intern, full-stack and general software engineer loops. None is confirmed by Tesla.',
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
      subtitle: 'Booking.com publishes a four-step hiring journey. Frontend accounts from 2021 to 2023 fill in the rounds: a HackerRank test of 90 to 100 minutes, one or two live coding rounds of about an hour with two engineers, in plain JavaScript or React, and a fit interview, with engineering managers in one account. Each round follows in turn, then the questions candidates reported, with the first one open.',
    },
    intro: ['The official page, linked below, describes Application, Interview, Business and Feedback steps over three to six weeks, with technical tests and coding interviews for some technical roles. The frontend detail comes from candidate accounts from 2021 to mid-2023, most of them for Amsterdam roles. Three 2025 accounts say less: a frontend developer describes a recruiter call and a live-coding round with two engineers, and two software engineer loops add a take-home, an easy React exercise and system design.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'HackerRank test, recruiter call, coding rounds, fit interview',
      paragraphs: ['The HackerRank test runs 90 to 100 minutes with about five items: two algorithm problems, mostly easy (one account had a medium), two HTML and CSS multiple-choice questions and one React component. A short recruiter call follows, 15 minutes in one full-stack account, sometimes with a few technical questions, then one or two coding rounds of about 60 minutes with two engineers, and a fit interview, with engineering managers in one account and 60 minutes in that same full-stack account.'],
      bullets: [
        {
          text: 'In the coding rounds the candidate builds a UI component live with two engineers, in plain JavaScript, HTML and CSS or in React. An autocomplete search box recurs from 2021 to 2023 and opens the question list below; the other tasks candidates reported are in the same list.',
          link: {
            label: 'See the coding stage',
            fragment: 'booking-com-interview-process-1',
          },
        },
        {
          text: 'Backend coding and system design appear only in full-stack and senior accounts; no frontend-titled account describes a system design round.',
        },
        {
          text: 'One 2023 account describes a monitored 40-minute HackerRank session with three engineers, a live round rather than the timed test.',
        },
        {
          text: 'An August 2025 software engineer account describes a take-home followed by a technical session, then system design and an engineering manager round; a May 2025 senior software engineer loop had an easy React exercise and system design.',
        },
      ],
    },
    roundSpotlights: [
      {
        id: 'fit-interview',
        kicker: 'Round decoder',
        title: 'The Booking.com fit interview: who runs it and where it falls',
        lede: [
          'The fit interview is the final round in the public frontend accounts from 2021 to 2023, after the HackerRank test, the recruiter call and one or two coding rounds. One account calls it a team fit with the engineering managers, another a behavioral interview, and two others a culture fit interview; one full-stack account gives it 60 minutes. Booking.com’s own journey page describes Application, Interview, Business and Feedback steps over three to six weeks.',
          'None of these accounts lists a question from this round, so what it asks is not on record. They agree on its place at the end of the loop; one 2022 account names the engineering managers as the interviewers, and a 2025 software engineer loop also closed with an engineering manager round. The recruiter can tell you who joins and how long it lasts.',
        ],
        facts: [
          { label: 'Position in the loop', value: 'The final round, after the HackerRank test, the recruiter call and one or two coding rounds.' },
          { label: 'What accounts call it', value: 'A team fit with the engineering managers (2022), a behavioral interview (2023), a culture fit interview (2021 and 2022).' },
          { label: 'Length', value: '60 minutes in one full-stack account; the frontend accounts give no duration.' },
          { label: 'Questions', value: 'None of the accounts lists a fit-interview question; the questions they report come from the coding rounds and the HackerRank test.' },
          { label: 'Recent loops', value: 'An August 2025 software engineer loop closed with an engineering manager round after a take-home, a technical session and system design; a September 2025 frontend account describes a recruiter call and a live-coding round.' },
          { label: 'Sources', value: 'Taro frontend accounts from 2021 to 2023 and the Booking.com careers journey page, listed with the other sources at the end of this page.' },
        ],
        practiceLink: { label: 'Prepare with the behavioural interview guide', path: '/guides/behavioral' },
        processLink: { label: 'See the fit interview row in the reported process', fragment: 'booking-com-interview-process-1-stage-fit-interview' },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the autocomplete round first',
      intro: 'The autocomplete leads because it is the task these accounts repeat; warm-ups for the HackerRank test and the premium search items follow.',
      steps: [
        {
          label: 'React autocomplete search',
          path: '/react/coding/react-autocomplete-search-starter',
          access: 'free',
          why: 'The open question, a search box with suggestions, here in React; one 2023 account asked for plain JavaScript.',
        },
        {
          label: 'Debounce',
          path: '/javascript/coding/js-debounce',
          access: 'free',
          why: 'One autocomplete account lists debounce or throttle among the features to weigh.',
        },
        {
          label: 'Flatten one level',
          path: '/javascript/coding/js-flatten-once',
          access: 'free',
          why: 'A warm-up for the easy algorithm problems of the HackerRank test; flattening is our pick, not a reported problem.',
        },
        {
          label: 'The CSS box model',
          path: '/css/trivia/css-box-model',
          access: 'free',
          why: 'For the HTML and CSS multiple-choice questions of the HackerRank test, whose topics the accounts do not give.',
        },
        {
          label: 'Vue autocomplete search',
          path: '/vue/coding/vue-autocomplete-search',
          access: 'free',
          why: 'The same search box in Vue, for a round that lets you pick the framework.',
        },
        {
          label: 'Autocomplete engine in plain JavaScript',
          path: '/javascript/coding/js-autocomplete-engine',
          access: 'premium',
          why: 'The typeahead logic without a page: debounce, a guard against stale responses and a cache.',
        },
        {
          label: 'Throttle',
          path: '/javascript/coding/js-throttle',
          access: 'premium',
          why: 'The other half of the debounce or throttle choice in that autocomplete account.',
        },
        {
          label: 'React debounced search',
          path: '/react/coding/react-debounced-search',
          access: 'premium',
          why: 'Suggestions fetched from an API as the user types, with stale results dropped.',
        },
        {
          label: 'Real-time search with debounce and cache',
          path: '/system-design/realtime-search-debounce-cache',
          access: 'premium',
          why: 'The autocomplete as a design discussion: caching, keyboard navigation and error states.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Booking.com frontend interviews',
      items: [
        {
          question: 'Is there a system design round for frontend roles?',
          answer: 'Not in the frontend-titled accounts. Backend coding and system design appear in full-stack and senior accounts, and system design in both 2025 software engineer loops.',
        },
        {
          question: 'Is the HackerRank test monitored?',
          answer: 'One 2023 account describes a monitored 40-minute session with three engineers, which was a live round. The timed test in the other accounts ran 90 to 100 minutes on its own.',
        },
        {
          question: 'How recent are these reports?',
          answer: 'The detailed frontend accounts run from 2021 to mid-2023. The three 2025 accounts are short: a frontend developer describes a recruiter call and one live-coding round with two engineers, a software engineer a take-home, a technical session, system design and an engineering manager round, and a senior software engineer an easy React exercise and system design.',
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
      subtitle: 'Zalando publishes two process pages; frontend accounts posted from 2020 to 2024, two of them from Berlin, add the loop they went through: a Codility take-home of two to three hours, a hiring manager call, then a final day that reviews the take-home and covers JavaScript fundamentals, system design and a manager conversation. The 2024 take-home, a search box with suggestions, heads the reported questions and is open to all.',
    },
    intro: ['The two official pages, linked below, describe a 30-minute talent acquisition call, a case study or coding exercise, a hiring manager interview and three to five final interviews of 45 to 60 minutes; the 2023 blog post adds that the coding, system design and general tech interviews last an hour each. Three public accounts describe a whole frontend loop: a 2019 interview posted in 2021, and 2020 and 2024 loops in Berlin; a 2022 Blind post adds the Codility test. Only the 2024 account, a senior frontend engineer’s, is from after 2022, and it supplies nearly every reported question on this page.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'A take-home, a hiring manager call and a final day',
      paragraphs: ['The take-home is a Codility challenge of two to three hours in 2022 and 2024, a React and Node app or easy algorithm problems; the 2020 assessment named no platform and gave three working days for a React question plus an API design question. The hiring manager interview is sometimes non-technical. The final day of the 2024 account had a 45-minute take-home review, an hour of JavaScript fundamentals with two senior frontend engineers, an hour of system design and 45 minutes with the engineering manager, and the candidate then waited about two weeks for the offer.'],
      bullets: [
        {
          text: 'The 2024 take-home, a React and Node search box with suggestions, opens the question list below; on the final day a senior software engineer spent 45 minutes going back over the submitted code.',
          link: {
            label: 'See the challenge stage',
            fragment: 'zalando-interview-process-1',
          },
        },
        {
          text: 'System design leaned backend in 2024: a senior principal engineer set a design with a load balancer for HTTP requests and optimised database reads and writes. An account posted in 2021 about a 2019 interview advises expecting something related to e-commerce.',
        },
        {
          text: 'The official pages differ: the Tech tab puts the case study before the hiring manager, and the 2023 blog lists the hiring manager before a live coding interview and treats a take-home as an optional extra. The blog gives two to three weeks for the loop.',
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the take-home, then the fundamentals hour',
      intro: 'The search box comes first: it is the open question and the code the 2024 review went back over. The fundamentals hour and the manager round follow.',
      steps: [
        {
          label: 'React autocomplete search',
          path: '/react/coding/react-autocomplete-search-starter',
          access: 'free',
          why: 'The open question, the search box with suggestions from the 2024 Codility take-home, as a React exercise without the Node part.',
        },
        {
          label: 'Frontend fundamentals quiz',
          path: '/guides/interview-blueprint/quiz',
          access: 'free',
          why: 'Short spoken answers on JavaScript, CSS, HTML and the browser, for the hour of questions with two senior frontend engineers.',
        },
        {
          label: 'Common behavioral questions',
          path: '/guides/behavioral/common-questions',
          access: 'free',
          why: 'For the 45-minute engineering manager round, whose 2024 questions on teamwork and leading a team are open beside the list.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Zalando frontend interviews',
      items: [
        {
          question: 'Does the hiring manager come before or after the challenge?',
          answer: 'The two official pages disagree, and in the 2024 account the engineering manager came on the final day. Ask your talent acquisition partner for the order of your loop.',
        },
        {
          question: 'How long does the loop take?',
          answer: 'The 2023 blog gives two to three weeks. The 2020 account had three working days for the take-home alone, and the 2024 candidate waited about two weeks for the offer.',
        },
        {
          question: 'Where do the reported questions come from?',
          answer: 'All but one come from a senior frontend engineer’s 2024 Berlin account on LeetCode: the take-home, the review that followed it and the fundamentals hour. The other, from a 2022 Blind post, comes from the Codility test. They are in our words and are not confirmed by Zalando.',
        },
      ],
    },
    about: ['Zalando frontend interview preparation'],
  },
  stripe: {
    slug: 'stripe',
    title: 'Stripe Frontend Interview Process and Practice Questions',
    h1: 'Stripe Frontend Interview Questions and Process',
    description: 'How public reports describe Stripe frontend interviews: a 60-minute coding screen, then an onsite with a bug squash, integration and frontend design.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle:
        'Stripe describes its process only in general terms, so the frontend loop here comes from people who went through it between 2022 and 2026: a recruiter call, an hour of live coding with an engineer, then four or five onsite interviews built around a bug squash, an integration exercise, a programming exercise, frontend design and a talk with the hiring manager. After the rounds come the questions they reported; the bug squash is open to every reader.',
    },
    intro: [
      'Stripe’s careers FAQ, linked below, says most processes include a recruiter screen, a technical or skills-based assessment and a series of interviews with the team you would join, and that timelines vary by role, level and location. The rest comes from candidates: frontend accounts on Taro from 2022 to 2026 written from Canada, the United States, Spain, India, Sweden and Ireland, two Blind threads, a LeetCode post on a 2024 software engineer screen, a 2025 intern account on Medium, and web developer accounts from 2017 and 2018 that add behavioural questions.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'A multi-part screen, then an onsite of four or five rounds',
      paragraphs: [
        'The recruiter call runs about 30 minutes. The screen is about an hour with an engineer, in CoderPad or in your own editor, on one exercise in parts or two to four short ones, and several accounts let the candidate pick the language. The onsite, virtual in the 2022 and 2024 accounts, held four or five interviews: a bug squash, an integration exercise, one or more programming exercises, a frontend design discussion and a conversation with the hiring manager.',
      ],
      bullets: [
        {
          text: 'A 2022 account from India found the bug squash and the integration round the hardest, and a commenter on a 2024 Blind thread had a hiring manager interview in place of the bug squash.',
          link: {
            label: 'See the onsite stages',
            fragment: 'stripe-interview-process-1',
          },
        },
        {
          text: 'Timing varies: three weeks of interviews and two more for an answer in a 2023 account, four weeks from screen to offer in 2022, two weeks for a 2025 senior loop.',
        },
        {
          text: 'Accounts from 2022 to 2025 say the tasks are set in realistic work scenarios rather than puzzle-style problems. In 2022 a recruiter told a senior candidate to expect a small, self-contained JavaScript component of the kind a component library holds.',
        },
      ],
    },
    roundSpotlights: [
      {
        id: 'bug-squash',
        kicker: 'Round decoder',
        title: 'The Stripe bug squash: what the round asks and how it runs',
        lede: [
          'The bug squash is an onsite round in which you fix a bug in a codebase you have not seen. In a 2022 loop that ended in an offer, the code was a fork of a real open-source project with an issue describing the problem and failing test cases: the candidate reproduced the failure, walked the code to the root cause, explained the fix, implemented it and ran the whole test suite.',
          'A 2022 Seattle account describes the same kind of task in a forked open-source repository, and a 2024 Canada account a failing unit test in an existing codebase. A 2022 account from India called this round and the integration round the hardest of the loop.',
        ],
        facts: [
          { label: 'Position in the loop', value: 'One of four or five onsite interviews after the screen; a recruiter’s 2024 plan, posted on Blind, put it second, after the programming exercise.' },
          { label: 'What you get', value: 'An existing repository with a reported bug and failing tests; in two 2022 accounts, a fork of an open-source project.' },
          { label: 'What you do', value: 'Reproduce the failing test, find the root cause, explain the cleanest fix, implement it, then run the full suite, in the order the 2022 candidate with an offer gives.' },
          { label: 'Environment', value: 'In the 2024 account most onsite tasks were cloned from GitHub and worked on in the candidate’s own setup.' },
          { label: 'Swaps', value: 'A commenter on the 2024 Blind thread had a hiring manager interview instead, and a 2025 Barcelona account lists bug fixing among four onsite rounds next to deployment, testing and CI/CD.' },
          { label: 'Sources', value: 'Taro accounts from 2022 (two from the United States, one from India), 2023 (Spain), 2024 (Canada) and 2025 (Spain), and the 2024 Blind thread with the recruiter’s plan, listed at the end of the page.' },
        ],
        practiceLink: { label: 'Rehearse it on an unfamiliar invoicing repository (Premium)', path: '/javascript/debug/js-debug-bug-squash-invoices' },
        processLink: { label: 'See the bug squash row in the reported process', fragment: 'stripe-interview-process-1-stage-onsite-bug-squash' },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Start with the bug squash',
      intro: 'The bug squash leads because its question is the one open to every reader, and a 2022 account gives the round’s steps in order. The free tasks train the habit of reading code you did not write; the Premium repository is the full rehearsal.',
      steps: [
        {
          label: 'Fix an off-by-one in a chunk helper',
          path: '/javascript/debug/js-debug-off-by-one',
          access: 'free',
          why: 'A teammate’s helper with a boundary bug: write the failing case before you touch the code, as the 2022 candidate did with the issue’s test.',
        },
        {
          label: 'Stop a helper mutating its input',
          path: '/javascript/debug/js-debug-mutating-input',
          access: 'free',
          why: 'A second fix in code you did not write, where the existing behaviour has to survive the change.',
        },
        {
          label: 'Fetch and render a list with loading, error and empty states',
          path: '/react/coding/react-fetch-list-states',
          access: 'free',
          why: 'For the hour-long screen: a small component with honest request states, built while you explain it.',
        },
        {
          label: 'Bug squash an unfamiliar invoicing repo',
          path: '/javascript/debug/js-debug-bug-squash-invoices',
          access: 'premium',
          why: 'Five files you have not seen and four bug reports, the shape of the bug squash round.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Stripe frontend interviews',
      items: [
        {
          question: 'What is the bug squash round?',
          answer: 'An onsite round in which you fix a bug in a codebase you have not seen; in two 2022 accounts it was a fork of a real open-source project with an issue and failing tests. A 2022 account from India called it and the integration round the hardest parts of the loop.',
        },
        {
          question: 'Which language does the screen use?',
          answer: 'Your choice in several accounts: the 2025 screens in Barcelona and San Francisco and a 2024 Toronto screen. A 2025 Canada account calls its screen a JavaScript and React interview. Confirm the language with your recruiter.',
        },
        {
          question: 'Does Stripe publish preparation material?',
          answer: 'The careers FAQ describes the process in general terms only. In 2022 and 2024 accounts the recruiter explained each interview in advance, and one told a senior candidate what kind of component the screen would ask for.',
        },
      ],
    },
    about: ['Stripe frontend interview preparation', 'Stripe bug squash interview round'],
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
    intro: ['The Apple careers site has a general interview-tips page, linked below, with advice before, during and after an interview and a note that some roles include a technical assessment or coding exercises; it lists no stages and no frontend content. Of the twelve public accounts behind this page, ten are for frontend roles; five of those describe both a screen and a team loop, mostly of frontend coding, the rest describe one stage, and all differ on what the team decides.'],
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
          text: 'Two accounts ended with a director: a meeting after the loop in 2025, and a round on behaviour and culture fit in 2024.',
        },
      ],
    },
    // The hiring manager row of the process table links here. Apple publishes nothing on these interviews, so every
    // fact and question comes from the accounts on that row and the team loop row (read 2026-11-09).
    roundSpotlights: [
      {
        id: 'team-conversations',
        kicker: 'Round decoder',
        title: 'Apple frontend team conversations: the hiring manager, cross-functional and director interviews',
        lede: [
          'Apple publishes no interview process and its frontend loops differ by team, but most accounts include conversations beside the coding: a hiring manager conversation before or as the screen, behavioural or cross-functional interviews in some team loops, and a director at the end of a few.',
          'They are conversations about your own work and your reasons for the move: past projects and responsibilities, why you are changing jobs, why Apple, and the team and product you would join.',
        ],
        facts: [
          { label: 'Hiring manager conversation', value: 'Before the screen, or as the screen itself. In a 2024 senior account it covered past experience, the projects worked on, behavioural questions, the reasons for changing jobs and the motivation to join Apple (Taro, 2024).' },
          { label: 'In the team loop', value: 'Two cross-functional interviews and a joint hiring manager and senior manager interview among five (Taro, 2025); a behaviour round about what you work on, your roles and responsibilities, then the team and product (Medium, 2022). One 2025 senior loop had four coding rounds and none of these.' },
          { label: 'The director', value: 'A director of engineering round on behavioural questions and culture fit closed a 2024 senior loop (Taro, 2024); a 2025 account ended with a meeting with the director (Taro, 2025).' },
          { label: 'What Apple publishes', value: 'Nothing on these interviews: the Apple careers site has general interview tips, linked in the official pages table, and no description of the rounds.' },
          { label: 'Sources', value: 'Public frontend accounts from 2022 to 2025, on the hiring manager and team loop rows of the process table.' },
        ],
        practiceLink: { label: 'Draft your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
        processLink: { label: 'See the hiring manager row in the reported process', fragment: 'apple-interview-process-1-stage-hiring-manager-conversation' },
        // One question per topic the accounts name.
        drill: {
          note: 'Apple publishes no questions for these interviews; each question here is a topic an account names, asked as one question.',
          questions: [
            { id: 'project', text: 'Walk me through a project you worked on: what you built and what you were responsible for.', source: 'Medium, 2022' },
            { id: 'why-change', text: 'Why are you looking to change jobs?', source: 'Taro, 2024', kind: 'view' },
            { id: 'why-apple', text: 'Why do you want to join Apple?', source: 'Taro, 2024', kind: 'view' },
            { id: 'team-and-product', text: 'What interests you about this team and its product?', source: 'Medium, 2022', kind: 'view' },
            { id: 'cross-functional', text: 'Tell me about working closely with a designer or a product manager.', source: 'Taro, 2025: cross-functional interviews' },
            { id: 'accessibility', text: 'Tell me about accessibility work you have done.', source: 'Medium, 2022' },
          ],
          checks: [
            'I can say why this team and its product, not only why Apple.',
            'My reasons for changing jobs fit in two sentences.',
            'I can walk through my role on each project on my résumé.',
          ],
        },
      },
    ],
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
          label: 'Vue autocomplete search',
          path: '/vue/coding/vue-autocomplete-search',
          access: 'free',
          why: 'The autocomplete search bar reported in a 2022 screen, in one of the two frameworks offered.',
        },
        {
          label: 'Remove Duplicates',
          path: '/javascript/coding/js-unique-array',
          access: 'premium',
          why: 'Reported in a 2019 account as concatenating two arrays and finding the unique elements.',
        },
        {
          label: 'Stack and queue, with a min stack',
          path: '/javascript/coding/js-stack-queue-implementation',
          access: 'premium',
          why: 'Reported as a min stack.',
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
          answer: 'Rarely in the frontend-titled accounts: the onsite technical round of a 2024 senior account included frontend system design questions, and one 2025 account says its loop had four coding rounds with no behavioural and no system design round.',
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
    description: 'How public Airbnb frontend accounts and the official careers FAQ describe the loop: a technical screen, UI and JavaScript coding, and frontend system design.',
    hero: {
      kicker: 'Public preview',
      subtitle: 'Two coding components, one of them in three frameworks, a system design case and two concept items grouped under Airbnb, plus the official careers FAQ and a sourced table of what public frontend accounts describe.',
    },
    intro: ['The official careers FAQ, linked below, says the process can involve a test, a video or an event, that candidates meet several members of the team, and gives response times; it also warns about recruiting scams. Public frontend accounts fill in the rest: the table below lists what they report, with a link to each one.'],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'The booking widget screen and the chat design',
      intro: 'Free items first, then the premium set. The booking widget and the messaging inbox are practice versions modelled on reported rounds, not leaked questions: a 2025 full-stack account describes the booking widget screen, and two accounts report a chat app design. Closures and the event loop are named as JavaScript fundamentals in a 2024 Blind comment about an Airbnb frontend loop. The chips input is an editorial grouping with no Airbnb account behind it.',
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
          label: 'Listing booking widget in React',
          path: '/react/coding/react-listing-booking-widget',
          access: 'premium',
          why: 'The 40-minute build of the reported screen: price a stay from dates and guests, grey out booked dates and confirm in a dialog.',
        },
        {
          label: 'Real-time messaging inbox',
          path: '/system-design/messaging-inbox-frontend',
          access: 'premium',
          why: 'A design-level practice version of the chat app round: WebSocket reconnects, offline sends and message order.',
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
          question: 'Do Airbnb frontend interviews include algorithm questions?',
          answer: 'Accounts disagree. One from 2024 reports no algorithms, while two from 2025 report a LeetCode-hard problem, one in the technical screen and one as a 45-minute coding round. Ask your recruiter which rounds your loop has.',
        },
        {
          question: 'How current are these reports?',
          answer: 'The newest frontend account cited here is from about September 2025, so confirm the current format with your recruiter.',
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
