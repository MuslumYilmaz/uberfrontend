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
    description:
      'How public reports describe ByteDance and TikTok frontend loops: HackerRank or CodeSignal assessments, a DSA round, a frontend round and a design round.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle:
        'ByteDance and TikTok publish interview tips for students and graduates only, so the loops on this page come from candidates who posted between 2020 and 2025, in the United States, Singapore and Australia. A table for each loop shape sets out the rounds, then come the questions candidates reported; the first, a tooltip component built and run in HackerRank in a 2024 loop, is open to every reader.',
    },
    intro: [
      'The two early-careers pages, linked below, tell candidates to expect two to three interviews on coding, algorithms and design, and suggest practising on HackerRank and Nowcoder; the TikTok page adds that an assessment depends on the role and region. Everything else comes from candidates: Blind threads posted in 2023 and 2024, LeetCode posts from 2020 to 2025, a summer 2022 loop written up on ExplainThis in January 2023, and Taro accounts from 2021 to 2025. Three of the Blind posters wrote before they had a result.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'Two technical rounds and a hiring manager round, by region',
      paragraphs: [
        'Most accounts from 2022 to 2024, the bulk of them from the United States, start with a short call: 15 minutes in a 2022 Seattle loop, 30 in a 2024 loop. Two live coding rounds follow, one LeetCode-style and one frontend, then a hiring manager round that turned to system design in three 2024 loops. The 2025 US accounts open with a timed online test instead, and two of them close with a behavioural round. A summer 2022 loop of three technical rounds and an HR round took two weeks from application to the last interview.',
      ],
      bullets: [
        {
          text: 'The online test: four questions in 70 minutes on CodeSignal in a 2025 Seattle account, in React, Vue or Angular, and multiple-choice questions with two LeetCode-medium problems in another 2025 US account. A 2025 Singapore test was one frontend problem in four levels.',
          link: {
            label: 'See the US stages',
            fragment: 'bytedance-interview-process-1',
          },
        },
        {
          text: 'In the frontend round you build a UI component or write a JavaScript utility live, with short questions on JavaScript, React and CSS. Two 2024 candidates did it on HackerRank, one of them building the tooltip that opens the question list below, and a 2022 Seattle candidate could pick two algorithm problems or one algorithm and one frontend problem.',
        },
        {
          text: 'One 2024 loop added a product manager round on cross-functional work and a final round with a department leader, which a TikTok employee replying on the thread called a wildcard. On a December 2023 Blind thread, TikTok and ByteDance employees disagreed on whether the hiring manager round is behavioural only.',
        },
        {
          text: 'Singapore and Australia loops run two or three technical rounds of about an hour that mix fundamentals with coding; several add a hiring manager or director round, and most end with HR. Two Singapore candidates had no online test, and a 2025 Singapore loop took a week.',
          link: {
            label: 'See the Singapore and Australia stages',
            fragment: 'bytedance-interview-process-2',
          },
        },
        {
          text: 'New graduates and interns take a timed test of up to two hours, on HackerRank where the platform is named, then one to three technical interviews, often LeetCode-style, and a manager or behavioural round; in a 2020 and a 2021 loop the manager round ended with a coding question.',
          link: {
            label: 'See the early-careers stages',
            fragment: 'bytedance-interview-process-3',
          },
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Build and run a component first, then the design round',
      intro: 'The open question is a component built and run in front of the interviewer, so a free component task leads. Short spoken answers, a JavaScript utility and the guides for the design and behavioural rounds follow, in the order of the US table.',
      steps: [
        {
          label: 'Build a dropdown as a JavaScript class, then port it to React',
          path: '/react/coding/react-vanilla-dropdown-port',
          access: 'free',
          why: 'For the open question, a tooltip built in HackerRank and run for the interviewer: a small component that opens and closes, written in plain JavaScript and then in React. The dropdown is our pick; no account reports one.',
        },
        {
          label: 'Frontend fundamentals quiz',
          path: '/guides/interview-blueprint/quiz',
          access: 'free',
          why: 'Short spoken answers on JavaScript, React, CSS and the browser, which the technical rounds in these accounts mix with coding.',
        },
        {
          label: 'Debounce',
          path: '/javascript/coding/js-debounce',
          access: 'free',
          why: 'A small JavaScript utility written from scratch, the other shape the frontend round takes; debounce is our pick, not a reported task.',
        },
        {
          label: 'Frontend system design blueprint',
          path: '/guides/system-design-blueprint',
          access: 'free',
          why: 'For the hiring manager round, which turned to system design in three 2024 loops, and for the design discussion that closed a 2022 technical round.',
        },
        {
          label: 'Behavioral interview guide',
          path: '/guides/behavioral',
          access: 'free',
          why: 'For the product manager, department leader and HR conversations; the behavioural questions from these accounts sit open below the reported questions.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about ByteDance and TikTok frontend interviews',
      items: [
        {
          question: 'Is the hiring manager round behavioural only?',
          answer: 'Accounts disagree. In three 2024 loops the hiring manager asked a system design question, and in one also React and JavaScript questions and a short coding problem; one poster later called the design in their loop front end specific. On a December 2023 Blind thread the poster’s recruiter said it could include technical questions, and TikTok and ByteDance employees replying split between behavioural only and likely coding.',
        },
        {
          question: 'Does every loop start with an online test?',
          answer: 'No. The 2025 US accounts open with one, but most 2022 to 2024 accounts start with a recruiter call, and two Singapore candidates had no test at all. The TikTok early-careers page says an assessment depends on the role and region.',
        },
        {
          question: 'Where do the reported questions come from?',
          answer: 'From candidates’ posts on Blind, LeetCode and Taro and one blog post on ExplainThis, dated 2020 to 2025, written here in our words. Many come from new-graduate, intern and Singapore loops, and none is confirmed by ByteDance or TikTok.',
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
      subtitle:
        'Microsoft’s hiring tips give the loop in general terms; frontend candidates interviewed in Bangalore, Tel Aviv, Belgrade and the United States between 2020 and 2025 add the rounds: a machine-coding build in plain JavaScript or React, JavaScript and React concepts, algorithms, design and a hiring manager. The first reported question, a weekly calendar view from a 2020 machine-coding round, is open to every reader.',
    },
    intro: [
      'Microsoft’s own hiring pages, linked below, explain how its loop works and what candidates may not do, with nothing specific to frontend. The rounds and questions come from candidates: a 2020 dev.to post by a Software Engineer II (UI) who accepted an offer in Bangalore, LeetCode posts from 2020 to 2025 and Taro accounts from Bangalore, Tel Aviv, New York and Belgrade. Two of these candidates, in 2022 and 2024, applied for frontend roles and were interviewed almost only on algorithms.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'From a single interview to six rounds',
      paragraphs: [
        'Microsoft’s hiring tips describe, for some candidates, a brief screening conversation, then usually two to four conversations of up to an hour with potential teammates and cross-functional colleagues, by phone, on Teams or in person. The frontend accounts vary more: a 2020 Bangalore loop ran six rounds and a 2021 one five, the 2024 senior and SDE 2 loops four, and a 2022 Tel Aviv loop two one-hour interviews after a short HR call.',
      ],
      bullets: [
        {
          text: 'In three Bangalore loops from 2020 and 2021 machine coding came first: a UI build, two hours long in one of them and limited to plain JavaScript, HTML and CSS in the two prompts that name a stack. A fourth 2020 Bangalore candidate had about 40 minutes of an hour-long phone round for a UI build, and three accounts from 2024 and 2025 build React components.',
          link: {
            label: 'See the frontend stages',
            fragment: 'microsoft-interview-process-1',
          },
        },
        {
          text: 'Concept rounds ask for output predictions, polyfills and promise work in JavaScript and React; a 2020 round began with ten minutes on the candidate’s own machine-coding code.',
        },
        {
          text: 'Algorithm problems appear in six of the accounts. In 2022 and 2024 two frontend candidates were interviewed on little else, one of them by a backend developer.',
        },
        {
          text: 'Design meant class design in a 2020 and a 2021 loop; in 2024 a senior loop opened with system design and an SDE 2 loop had a component design round.',
        },
        {
          text: 'A 2020 loop ended with an As Appropriate round: an hour with an interviewer at GM or Partner level, which the candidate warns is not a formality.',
          link: {
            label: 'See the As Appropriate round',
            fragment: 'microsoft-interview-process-1-stage-as-appropriate-round',
          },
        },
        {
          text: 'Students get an initial interview and, if selected, a final one, both virtual.',
          link: {
            label: 'See the student stages',
            fragment: 'microsoft-interview-process-2',
          },
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Start with the calendar, then the concept rounds',
      intro: 'The open weekly calendar leads, with the grid layout and date handling it needs. The promise and output questions of the concept rounds follow, then a small React component and a short algorithm warm-up; the design and hiring manager rounds have their guides in the process table.',
      steps: [
        {
          label: 'CSS grid card gallery',
          path: '/css/coding/css-grid-card-gallery',
          access: 'free',
          why: 'The open weekly calendar is seven day columns side by side, and the 2020 Software Engineer II (UI) account advises knowing flexbox or grid for the machine-coding round.',
        },
        {
          label: 'Format a date in a time zone',
          path: '/javascript/coding/js-format-date-timezone',
          access: 'free',
          why: 'The calendar moves a week at a time, jumps back to today and places events that start at any minute, so its date arithmetic has to be right before the layout matters.',
        },
        {
          label: 'Promise chains and async/await',
          path: '/javascript/trivia/js-promises-async-await',
          access: 'free',
          why: 'Promises come up in the concept rounds of five accounts between 2020 and 2025.',
        },
        {
          label: 'The event loop',
          path: '/javascript/trivia/js-event-loop',
          access: 'free',
          why: 'Rounds in 2020, 2021 and 2025 asked what a snippet prints or returns; work out the order before you run the code.',
        },
        {
          label: 'React fetch and render a list',
          path: '/react/coding/react-fetch-list-states',
          access: 'free',
          why: 'Three accounts from 2024 and 2025 built React components in their coding rounds; start with a small one that fetches data and shows its loading, error and empty states.',
        },
        {
          label: 'Valid Parentheses',
          path: '/javascript/coding/js-valid-parentheses',
          access: 'free',
          why: 'Six of the accounts include algorithm problems. This one is a warm-up we picked, not a reported Microsoft question.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Microsoft frontend interviews',
      items: [
        {
          question: 'How many rounds should I expect?',
          answer:
            'Microsoft’s hiring tips say most interviews include two to four conversations of up to an hour. The accounts run from a single live-coding interview in a 2024 Belgrade loop, after an HR introduction and a test task it gives no detail on, to six rounds in a 2020 Bangalore loop; the 2024 senior and SDE 2 loops had four. Your recruiter can confirm the number for your team.',
        },
        {
          question: 'What happens in the machine coding round?',
          answer:
            'You build a UI within the round. A 2020 Software Engineer II (UI) candidate had two hours, could put questions to the interviewer and notes that a starter zip may be provided; another 2020 Bangalore candidate coded for about 40 minutes of an hour-long phone round with two interviewers and was asked to run the code when time ran out. Two Bangalore prompts from 2020 and 2021 allowed only JavaScript, HTML and CSS, while three accounts from 2024 and 2025 built React components. The weekly calendar at the top of the reported questions can be read in full.',
        },
        {
          question: 'Are these questions confirmed by Microsoft?',
          answer:
            'No. They come from candidates’ posts on LeetCode, dev.to and Taro between 2020 and 2025, and the wording here is ours.',
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
    description: 'Uber publishes its frontend loop: a HackerRank assessment, a coding and design phone screen, and three 60-minute interviews. Public reports add the detail.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle:
        'Uber publishes its frontend interview loop on its careers site. This page sets those steps beside what candidates reported between 2018 and 2026, round by round, then lists the questions they were asked; the poll widget reported in 2025 and 2026 is open to every reader.',
    },
    intro: [
      'Uber’s frontend engineering interview guide, linked below, covers levels L3 to L6+ and says the steps may vary by role, location and business needs; a senior engineer based in Chile describes his own loop on the same careers site. The rest comes from candidates: LeetCode posts from 2021 to 2026, a 2022 Medium account of a frontend loop that brought an offer, Taro accounts from Bengaluru (2018 and 2022) and Brazil (2025), and two full-stack loops, on Medium in 2024 and LeetCode in 2026, used only for their frontend, algorithm and behavioural questions. Four accounts place the candidate in India and one in Brazil; the others do not say where.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'The official loop and what candidates met',
      paragraphs: [
        'The guide describes a 30-minute call with a recruiter or sourcer, a HackerRank coding assessment, a 60-minute online phone screen on coding plus design and architecture, then three 60-minute interviews: algorithms and data structures, depth in specialization, and collaboration and leadership. The senior engineer’s story and the accounts that describe the onsite also have a separate design round.',
      ],
      bullets: [
        {
          text: 'Accounts from 2021 and 2022 name CodeSignal rather than HackerRank: a 2021 phone screen in its sandbox, a 2022 senior screen, and a 35-minute test in 2022 of two algorithm questions and eight multiple-choice questions, mostly on what JavaScript and CSS code outputs.',
          link: { label: 'See the assessment stage', fragment: 'uber-interview-process-1-stage-online-assessment' },
        },
        {
          text: 'The phone screen was a UI build (in any framework, in React or on CodeSignal), a JavaScript utility, or algorithm and JavaScript questions. A 2022 interviewer did not expect a working solution, and a 2025 India screen decided within ten minutes whether the other four rounds ran the same day.',
          link: { label: 'See the phone screen stage', fragment: 'uber-interview-process-1-stage-phone-screen' },
        },
        {
          text: 'The specialization round was a UI build or a JavaScript problem: vanilla JavaScript in a 2022 loop and, at the interviewer’s request, in a 2025 India loop; React with MDN open in a 2025 L5A loop. The 2022 Medium account, whose loop brought an offer, says Uber scored the two coding rounds together before the design and hiring manager rounds, and the 2025 L5A account says both had to be passed.',
        },
        {
          text: 'Recruiter labels can differ from what a round holds: a 2025 candidate whom HR told to expect an algorithms round got something else, and a 2026 candidate, after recruiters and Uber’s documents pointed to algorithms, got the poll widget. In a 2025 India loop the recruiter said a strong hire from the hiring manager was needed to move forward.',
        },
      ],
    },
    roundSpotlights: [
      {
        id: 'depth-in-specialization',
        kicker: 'Round decoder',
        title: 'The Uber depth in specialization round: a UI build or a JavaScript problem',
        lede: [
          'Uber’s frontend guide lists it as Interview 2, Software Engineering: Depth in Specialization (Coding 2), a 60-minute interview that follows the algorithms interview; the senior engineer’s story on Uber’s site calls it Specialization (Web). Candidates describe one UI build or one JavaScript problem in the hour, and two loops asked for vanilla JavaScript.',
          'A 2025 candidate called it the riskiest interview of the loop because it can be either kind, and got a JavaScript problem after preparing a UI build. A 2022 candidate who received an offer and a 2025 L5A candidate say the two coding rounds decide whether the design and hiring manager rounds go ahead.',
        ],
        facts: [
          { label: 'Position in the loop', value: 'Interview 2 of the three after the phone screen in the official guide. A 2022 Medium loop and a 2025 L5A loop had it as the second of two coding rounds that decided whether the design and hiring manager rounds went ahead; a 2022 Bengaluru loop and a 2025 loop held it after the design round.' },
          { label: 'What you build', value: 'A UI component or small app, or a JavaScript problem. A 2022 round tested DOM manipulation and asynchronous code in vanilla JavaScript; a 2025 L5A round was a React build.' },
          { label: 'Framework', value: 'Vanilla JavaScript in a 2022 loop and, at the interviewer’s request, in a 2025 India loop; any framework or vanilla JavaScript in a 2022 Bengaluru loop; React in the 2025 L5A loop in Bangalore.' },
          { label: 'What you may look up', value: 'MDN documentation in the 2025 L5A loop; in another 2025 loop the interviewer let the candidate search the web during a JavaScript problem.' },
          { label: 'What the interviewer looks for', value: 'Modular, functional JavaScript, DOM manipulation, ES6 and problem solving, in the 2022 Medium loop that brought an offer.' },
          { label: 'Sources', value: 'Uber’s frontend guide and the engineer’s story, a 2022 Medium account, a 2022 Taro account from Bengaluru and LeetCode posts from 2025; the page’s closing sources list links each of them.' },
        ],
        practiceLink: { label: 'Build a dropdown in vanilla JavaScript, then port it to React', path: '/react/coding/react-vanilla-dropdown-port' },
        processLink: { label: 'See the specialization row in the reported process', fragment: 'uber-interview-process-1-stage-frontend-specialization' },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the screen, then the specialization round',
      intro:
        'Uber’s accounts differ most in the screen and the specialization round: a UI build in one loop, a JavaScript problem or an algorithm in the next, and vanilla JavaScript whenever the interviewer asks for it. The free tasks rehearse each of those shapes; the Premium case is for the separate design round that mid-level and senior accounts describe.',
      steps: [
        {
          label: 'Fetch and render a list with loading, error and empty states',
          path: '/react/coding/react-fetch-list-states',
          access: 'free',
          why: 'For screens like the 2022 Bengaluru one, which asked for a UI component in React: one component with every request state, finished and talked through within the hour.',
        },
        {
          label: 'Build a dropdown as a JavaScript class, then port it to React',
          path: '/react/coding/react-vanilla-dropdown-port',
          access: 'free',
          why: 'Specialization rounds in 2022 and 2025 asked for vanilla JavaScript, and a 2025 L5A round for React: build the widget without a framework first, then port it.',
        },
        {
          label: 'Retry a promise-returning function with delay',
          path: '/javascript/coding/js-retry-with-delay',
          access: 'free',
          why: 'Promises and timers without a UI, for the JavaScript problems candidates reported from 2018 to 2025.',
        },
        {
          label: 'Valid Parentheses',
          path: '/javascript/coding/js-valid-parentheses',
          access: 'free',
          why: 'A short algorithm in JavaScript: a 2025 candidate with four years of React called it a mistake not to have practised LeetCode-style problems in JavaScript before the specialization round.',
        },
        {
          label: 'Design a real-time messaging inbox',
          path: '/system-design/messaging-inbox-frontend',
          access: 'premium',
          why: 'For the hour-long design round: requirements, components, API and data flow, data models, client storage and performance, the areas the 2022 and 2025 accounts were questioned on, on a product none of them reports.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Uber frontend interviews',
      items: [
        {
          question: 'Is design a separate round?',
          answer: 'The guide folds design and architecture into the phone screen and lists no design interview after it. The senior engineer’s story on Uber’s site and the accounts that describe the onsite have a separate design round, an hour long where the 2022 and 2025 accounts give its length.',
        },
        {
          question: 'Do recruiter labels match the rounds?',
          answer: 'Not reliably. A 2025 candidate whom HR told to expect an algorithms round got something else, a 2026 candidate got the poll widget after recruiters and Uber’s documents pointed to algorithms, and a 2025 candidate who prepared a UI build for the specialization round got a JavaScript problem. The 2026 candidate’s advice is to be ready for JavaScript and asynchronous code, React, and a medium algorithm with a hard follow-up in any round.',
        },
        {
          question: 'Which language should I use?',
          answer: 'The senior engineer’s story on Uber’s site says the algorithms interview accepts any language. Two specialization rounds asked for vanilla JavaScript, and a 2025 candidate with four years of React called it a mistake to arrive at that round without LeetCode-style practice in JavaScript.',
        },
      ],
    },
    about: ['Uber frontend interview preparation', 'Uber depth in specialization interview round'],
  },
  apple: {
    slug: 'apple',
    title: 'Apple Frontend Interview Process and Practice Questions',
    h1: 'Apple Frontend Interview Questions and Process',
    description: 'How public reports describe Apple frontend interviews: a recruiter call, a 45 to 60 minute coding screen in React, JS or TS, and a team loop of 4 to 7 rounds.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle:
        'Apple’s careers site has interview tips but no process page, so the loop here comes from frontend candidates who posted between 2019 and 2026: a recruiter call, in some teams a hiring manager conversation, a 45 to 60 minute screen in JavaScript, TypeScript or React, then a team loop, usually four to seven interviews, whose mix each team sets. The reported questions follow the table, opening with a 2025 screen task: nested tabs built from a flat list.',
    },
    intro: [
      'Apple’s careers site has an interview tips page, linked below, with general advice, three example questions on how you have performed in the past and a note that some roles add a presentation, a case study, a technical assessment or coding exercises; it lists no stages. Everything else comes from candidates: frontend, UI and web engineering accounts on Taro from 2019 to 2026, mostly from the United States with others from India, Sweden and Denmark; two Blind threads from senior candidates; a 2022 Hyderabad account on Medium; a 2025 IC3 post on LeetCode; and two full-stack loops posted on LeetCode in 2025 and 2026, whose frontend and algorithm questions are kept. Two of the 2026 Taro accounts came through outside channels: a contract interview in Austin and a loop run through a consultancy in Malmö.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'A screen, then a team loop of four to seven rounds in most accounts',
      paragraphs: [
        'Most accounts that describe the start open with a recruiter call, and in some teams a hiring manager conversation comes before the screen or is the screen. Screens that give a length run 45 to 60 minutes, by video or phone, mostly JavaScript, TypeScript or React coding with questions on the stack. In most accounts the team loop runs four to seven interviews of 30 to 60 minutes, mostly JavaScript, React and CSS coding and concepts, with algorithm problems in some loops; a 2026 loop in Malmö had two interviews on site.',
      ],
      bullets: [
        {
          text: 'A 2025 IC3 account began with a one-hour online assessment of two coding questions and 20 multiple-choice questions; the recruiter called about a week later.',
          link: {
            label: 'See the assessment stage',
            fragment: 'apple-interview-process-1',
          },
        },
        {
          text: 'Screens differ: about 15 minutes of coding in a mostly conversational 2022 screen, about six small JavaScript tasks in a 2022 account from Denmark and six JavaScript coding challenges in a 2023 account from Sweden, no coding at all in a 2026 first round, and two 30-minute halves, an algorithm problem and frontend theory, in a 2026 full-stack screen.',
          link: {
            label: 'See the technical screen',
            fragment: 'apple-interview-process-1-stage-technical-screen',
          },
        },
        {
          text: 'Loops differ by team: four coding rounds and no behavioural or system design round in a 2025 senior loop, two cross-functional interviews and a joint hiring manager and senior manager interview in another 2025 loop, and two interviews on site after a remote one in a 2026 loop in Malmö, run through a consultancy.',
        },
        {
          text: 'A few loops end with a director or department lead: a final chat with the department lead in a 2021 loop that ended in an offer, a director of engineering round on behaviour and culture fit in 2024, and a meeting with the director in 2025.',
        },
        {
          text: 'Silence comes up in several accounts: two 2022 candidates got no detail of the rounds beforehand, one heard nothing for six weeks after seven interviews, and a 2025 Cupertino process ran for more than four months.',
        },
      ],
    },
    // The hiring manager row of the process table links here. Apple publishes no description of these interviews, so
    // every fact comes from the accounts on the hiring manager and team loop rows, and three drill questions from
    // Apple's interview tips page (the tips page and the Taro accounts re-read 2026-11-13).
    roundSpotlights: [
      {
        id: 'team-conversations',
        kicker: 'Round decoder',
        title: 'Apple frontend team conversations: the hiring manager, cross-functional and director interviews',
        lede: [
          'Apple publishes no description of its interview rounds and its frontend loops differ by team, but many accounts include conversations beside the coding: a hiring manager conversation before or as the screen, behavioural or cross-functional interviews in some team loops, and a director or department lead at the end of a few.',
          'They are conversations about your own work and your reasons for the move: past projects and responsibilities, why you are changing jobs, why Apple and why this role, how you collaborate, and in one 2025 round with a senior manager, Apple’s values.',
        ],
        facts: [
          { label: 'Hiring manager conversation', value: 'Before the screen, or as the screen itself. A 2024 senior account from Hyderabad lists past experience, projects, behavioural questions, reasons for changing jobs and the motivation to join Apple; a 2025 full-stack account adds why the role and where you see yourself. In 2020 and 2021 accounts the hiring manager ran a technical interview instead.' },
          { label: 'In the team loop', value: 'Two cross-functional interviews and a joint hiring manager and senior manager interview among five (Taro, 2025); a behaviour round on what you work on, your roles and responsibilities, then the team and product (Medium, 2022); a behavioural round with a senior manager on how you have shown Apple’s values (LeetCode, 2025). One 2025 senior loop had four coding rounds and none of these (Blind, 2025).' },
          { label: 'The director', value: 'A director of engineering round on behavioural questions and culture fit closed a 2024 senior loop on site in Hyderabad (Taro, 2024); a 2025 account ended with a meeting with the director, and a 2021 account that ended in an offer with a final chat with the department lead (Taro).' },
          { label: 'What Apple publishes', value: 'An interview tips page, linked in the official pages table, that says to prepare for open-ended questions about how you performed in past work and gives three examples: working with a team to accomplish a goal, working under pressure to meet a deadline, and the areas you need to develop further. It describes no rounds.' },
          { label: 'Sources', value: 'Frontend and full-stack accounts from 2020 to 2026 on the hiring manager and team loop rows of the process table, and Apple’s interview tips page.' },
        ],
        practiceLink: { label: 'Draft your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
        processLink: { label: 'See the hiring manager row in the reported process', fragment: 'apple-interview-process-1-stage-hiring-manager-conversation' },
        drill: {
          note: 'Three questions come from Apple’s interview tips page; each of the others is a topic an account names, asked as one question.',
          questions: [
            { id: 'project', text: 'Walk me through a project you worked on: what you built and what you were responsible for.', source: 'Medium, 2022' },
            { id: 'biggest-challenge', text: 'What was the biggest challenge in your project work, and how did you handle it?', source: 'Taro, 2021' },
            { id: 'why-change', text: 'Why are you looking to change jobs?', source: 'Taro, 2024', kind: 'view' },
            { id: 'why-apple', text: 'Why do you want to join Apple?', source: 'Taro, 2024', kind: 'view' },
            { id: 'apple-values', text: 'How have you shown Apple’s values, such as deep expertise and a drive for excellence, in your career?', source: 'LeetCode, 2025' },
            { id: 'team-goal', text: 'Tell me about a time when you worked with a team to accomplish a goal.', source: 'Apple’s interview tips page' },
            { id: 'deadline', text: 'Give me an example of when you worked under pressure to meet a deadline.', source: 'Apple’s interview tips page' },
            { id: 'develop-further', text: 'What areas do you think you need to develop further?', source: 'Apple’s interview tips page', kind: 'view' },
            { id: 'cross-functional', text: 'Tell me about a project where you worked closely with people from another team or function.', source: 'Taro, 2025: cross-functional interviews' },
            { id: 'accessibility', text: 'Tell me about accessibility work you have done.', source: 'Medium, 2022' },
            { id: 'team-and-product', text: 'What interests you about this team and its product?', source: 'Medium, 2022', kind: 'view' },
          ],
          checks: [
            'I can say why this team and its product, not only why Apple.',
            'My reasons for changing jobs fit in two sentences.',
            'I can walk through my role on each project on my résumé.',
            'I have one story about a deadline under pressure and one about reaching a goal with a team.',
            'I can name one area I am still developing and what I am doing about it.',
          ],
        },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the screen, then the coding loop',
      intro: 'The open nested-tabs question leads: build the tree from the flat list, then render it level by level. A small stateful React component follows for the timed loop rounds, an algorithm warm-up for the problems some screens and loops add, and the stories guide for the hiring manager, cross-functional and director conversations.',
      steps: [
        {
          label: 'Build a tree from a flat list of nodes',
          path: '/javascript/coding/js-build-tree-from-flat-list',
          access: 'free',
          why: 'The open question: a 2025 IC3 screen asked for nested tabs from a flat list of tabs with parent ids. This is the first half, turning the list into a tree.',
        },
        {
          label: 'Filter a tree by substring and render it indented',
          path: '/javascript/coding/js-filter-tree-render-indented',
          access: 'free',
          why: 'The second half of the same task: walk the tree and render each level under its parent.',
        },
        {
          label: 'Todo list with local state',
          path: '/react/coding/react-todo-list',
          access: 'free',
          why: 'Team loops in these accounts are mostly React and JavaScript coding against the clock; a 2025 senior loop gave two of its seven problems about 12 minutes each.',
        },
        {
          label: 'Valid parentheses',
          path: '/javascript/coding/js-valid-parentheses',
          access: 'free',
          why: 'A warm-up for the LeetCode-style problems that several screens and loops add beside the frontend work, from easy ones in screens to a hard one in a 2025 senior loop.',
        },
        {
          label: 'STAR stories guide',
          path: '/guides/behavioral/stories',
          access: 'free',
          why: 'For the hiring manager, cross-functional and director conversations; the round decoder above lists the topics the accounts name and the three example questions on Apple’s tips page.',
        },
        {
          label: 'File explorer tree with keyboard navigation',
          path: '/react/coding/react-file-explorer',
          access: 'premium',
          why: 'The nested-tabs task taken further in React: a tree component that expands, collapses and answers the keyboard.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Apple frontend interviews',
      items: [
        {
          question: 'Is there a system design round?',
          answer: 'Not as a fixed round. A 2025 senior loop had four coding rounds and no system design; in other loops design came up inside a technical round, and the system design round of a 2025 full-stack loop went deep into the candidate’s own past projects instead of a new design.',
        },
        {
          question: 'Is the loop the same for every team?',
          answer: 'No. A 2025 Cupertino candidate wrote that each team has its own rounds. One account had seven 30-minute interviews, another five 45-minute ones, a 2025 loop added two cross-functional interviews, and a 2026 loop in Malmö, run through a consultancy, had two interviews on site after a remote one.',
        },
        {
          question: 'Where do the reported questions come from?',
          answer: 'From candidates’ posts on Taro, Blind, Medium and LeetCode dated 2019 to 2026, written here in our words; two full-stack loops and two 2026 interviews that came through outside channels add their frontend and algorithm questions. None is confirmed by Apple.',
        },
      ],
    },
    about: ['Apple frontend interview preparation'],
  },
  airbnb: {
    slug: 'airbnb',
    title: 'Airbnb Frontend Interview Practice and Official FAQ',
    h1: 'Airbnb Frontend Interview Practice',
    description:
      'How public Airbnb frontend accounts and the official careers FAQ describe the loop: a technical screen, UI and JavaScript coding, and frontend system design.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle:
        'Airbnb’s careers FAQ gives only the general shape of its process, so the loop here comes from people who interviewed for frontend, front-end-heavy and full-stack roles between 2019 and 2025: a recruiter call, a technical screen that changes from one account to the next, then UI and JavaScript coding, a frontend design round and a deep dive into a past project. The questions they reported follow the rounds, and the first, a card game to build and style, is open to every reader.',
    },
    intro: [
      'The careers FAQ, linked below, says the process depends on the position and may involve a test, a video or an event, that meeting several people on the current team is a priority, and that Airbnb aims to answer applications within three to four weeks; it also warns about recruiting scams. The rest comes from candidates: anonymous reviews re-posted on Taro from 2022 to 2025, Blind threads from 2021 to 2024, LeetCode posts from 2019 and 2025, and two PracHub pages about 2025 software engineer loops, edited by PracHub and published in August 2026. Several accounts carry a software engineer or full-stack title but describe frontend rounds.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'A screen that changes, then coding, design and one project in depth',
      paragraphs: [
        'After the recruiter call, short in a 2025 account, the technical screen is where accounts differ most: a UI build followed by product questions, a LeetCode-hard problem for a candidate whose prep material promised frontend concepts, and, in one poster’s later edit, a common UI component or a design question. The later rounds, a virtual onsite in a 2022 account, are drawn from one or two UI coding rounds in React or plain DOM code, a JavaScript round, a frontend design discussion, a deep dive into a past project and a core values interview or behavioural questions. Most accounts list tasks without naming their round, so the table groups them by type.',
      ],
      bullets: [
        {
          text: 'The card game, styled in the 2025 version, comes from a 2025 staff loop and a 2022 loop and opens the question list; the other builds the accounts name are listed after it.',
          link: { label: 'See the UI coding stage', fragment: 'airbnb-interview-process-1-stage-coding-ui-or-react' },
        },
        {
          text: 'Algorithms divide the accounts: none for a 2024 front-end developer in Mexico, not much for a 2022 commenter joining as a senior front end engineer, and a LeetCode-hard problem for two 2025 candidates.',
          link: { label: 'See the algorithms stage', fragment: 'airbnb-interview-process-1-stage-algorithms' },
        },
        {
          text: 'Slow recruiting comes up in several accounts: almost two weeks to hear back after a 2022 onsite, a final round months after the first in a 2024 senior account, and months of recruiter silence after team matching in another.',
        },
      ],
    },
    roundSpotlights: [
      {
        id: 'ui-coding-round',
        kicker: 'Round decoder',
        title: 'The Airbnb UI coding round: what candidates built and how it went',
        lede: [
          'In the UI coding round you build an interface live, in React or with plain DOM code. A 2025 staff frontend candidate and a 2022 front-end engineer were both asked for a card game, and the 2025 prompt asked for styling as well; that question opens the list below and is open to every reader.',
          'The 2025 staff loop had two coding challenges, which the candidate found unrelated to the job. In 2024 a frontend candidate whose loop had a DOM or React round and a separate JavaScript round finished neither before time ran out, and a software engineer who found the loop not difficult advised studying vanilla JavaScript.',
        ],
        facts: [
          {
            label: 'Position in the loop',
            value: 'One or two rounds after the technical screen. The rest of the loop can hold a JavaScript round, a design round and a project deep dive, in no order the accounts agree on.',
          },
          {
            label: 'What you build',
            value: 'A card game in a 2025 and a 2022 account, styled as well in the 2025 one. The other builds that accounts name are in the question list, under this round or with no round stated.',
          },
          {
            label: 'Framework',
            value: 'React or plain DOM code in the round list of a 2024 frontend loop. A 2021 onsite had an HTML, CSS and JavaScript round, and a 2022 commenter joining as a senior front end engineer found the interviews mostly JavaScript and CSS with some React.',
          },
          {
            label: 'Length',
            value: 'No account gives this round a length. The 2024 candidate who ran out of time did so in both coding rounds.',
          },
          {
            label: 'Sources',
            value: 'Taro reviews from 2022, 2024 and 2025 and Blind posts from 2021, 2022 and 2024, each listed in the sources at the foot of this page.',
          },
        ],
        practiceLink: { label: 'Rehearse a turn-based game in React (Premium)', path: '/react/coding/react-tictactoe' },
        processLink: { label: 'See the UI coding row in the reported process', fragment: 'airbnb-interview-process-1-stage-coding-ui-or-react' },
      },
    ],
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'One item for each reported round',
      intro: 'Free items first, for the rounds a free task fits; then two Premium items, a small game for the UI coding round, where the open card game sits, and a design case built from a mock.',
      steps: [
        {
          label: 'React autocomplete search',
          path: '/react/coding/react-autocomplete-search-starter',
          access: 'free',
          why: 'A common UI component, the kind a 2025 poster says the screen can ask for. A 2024 screen counted only code that passed every test case.',
        },
        {
          label: 'Frontend fundamentals quiz',
          path: '/guides/interview-blueprint/quiz',
          access: 'free',
          why: 'Fifteen minutes on browser rendering, CSS layout, JavaScript and HTTP caching, for the JavaScript round a 2024 frontend loop listed beside its DOM or React round.',
        },
        {
          label: 'Frontend system design blueprint',
          path: '/guides/system-design-blueprint',
          access: 'free',
          why: 'For the design round, which a 2024 frontend candidate describes as state, data, APIs, trade-offs and optimisations.',
        },
        {
          label: 'Behavioural stories',
          path: '/guides/behavioral/stories',
          access: 'free',
          why: 'For the deep dive into one past project, which an Airbnb-badged commenter called the technical experience interview.',
        },
        {
          label: 'DSA for frontend loops',
          path: '/guides/interview-blueprint/dsa-for-fe',
          access: 'free',
          why: 'Accounts disagree on algorithms, and two 2025 candidates got a LeetCode-hard problem.',
        },
        {
          label: 'React tic-tac-toe',
          path: '/react/coding/react-tictactoe',
          access: 'premium',
          why: 'A turn-based game kept in React state, the nearest task in our library to the card game; our pick, not a reported Airbnb task.',
        },
        {
          label: 'UI component and state design from a mock',
          path: '/system-design/ui-component-state-from-mock',
          access: 'premium',
          why: 'Components, state and data worked out from a given screen, for a design round on a frontend app or component.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Airbnb frontend interviews',
      items: [
        {
          question: 'Do Airbnb frontend interviews include algorithm questions?',
          answer:
            'Accounts disagree. A 2024 front-end developer in Mexico had none and a 2022 commenter joining as a senior front end engineer had not much, while a 2021 onsite had one array problem. In 2025 two candidates got a LeetCode-hard problem, one in a technical screen they had been told would cover frontend concepts and one as a 45-minute onsite puzzle. Ask your recruiter which rounds your loop has.',
        },
        {
          question: 'How recent are these accounts?',
          answer:
            'The newest interviews described took place in 2025, the latest around September. Two PracHub pages about 2025 software engineer loops came out in August 2026, and no account of a 2026 frontend interview was found, so check the current format with your recruiter.',
        },
        {
          question: 'Where do the reported questions come from?',
          answer:
            'From anonymous reviews re-posted on Taro, Blind threads, LeetCode posts and two PracHub pages edited by PracHub, about interviews from 2019 to 2025. Each question is paraphrased, none is confirmed by Airbnb, and several come from software engineer and full-stack loops, kept because their content is frontend, JavaScript or algorithms.',
        },
      ],
    },
    about: ['Airbnb frontend interview preparation', 'Airbnb UI coding round'],
  },
};

export type CompanyEditorialNotesRegistry = Readonly<Record<string, CompanyEditorialNotes>>;
