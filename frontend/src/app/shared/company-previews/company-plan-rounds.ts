/**
 * What the company plan needs to know about each row of COMPANY_INTERVIEW_PROCESSES: what a round tests,
 * stable ids for saved plans, which list a plan opens on, and short notes.
 *
 * It is separate from the process table because an edit to that table re-dates every company guide in the
 * SEO inventory, and no public page imports this file. company-plan-rounds.spec.ts fails when a list or a
 * stage of the table has no entry here, so a new stage goes in both files.
 *
 * Notes only shorten the table's own text: they never add a claim.
 */
export const COMPANY_PLAN_LEVELS = ['junior', 'mid', 'senior', 'staff'] as const;
export type CompanyPlanLevel = (typeof COMPANY_PLAN_LEVELS)[number];

/**
 * recruiter: a call about background and logistics.
 * coding: hands-on or spoken technical work, assessments and take-homes included.
 * design: frontend system design or architecture.
 * people: behavioural, values and manager conversations.
 * outcome: a decision, an offer or team matching, with nothing to prepare.
 * other: a real round FrontendAtlas has no practice for, such as a Rails interview.
 */
export type CompanyPlanRoundKind = 'recruiter' | 'coding' | 'design' | 'people' | 'outcome' | 'other';

export type CompanyPlanRound = {
  /** Saved on accounts: keep it when the stage is renamed. Unique within its list. */
  readonly id: string;
  /** Matches InterviewProcessStage.stage. */
  readonly stage: string;
  /** Main topic first. An onsite or another mixed round lists every topic it covers. */
  readonly kinds: readonly CompanyPlanRoundKind[];
  /** Replaces the first sentence of the stage format when that is too long or says too little. */
  readonly note?: string;
  /** Task routes an editor adds to this round beyond its process row. A plan labels them as our pick. */
  readonly picks?: readonly string[];
};

export type CompanyPlanVariant = {
  /** Saved on accounts: keep it when the list is renamed. Unique within its company. */
  readonly id: string;
  /** Matches InterviewProcessVariant.title. */
  readonly title: string;
  /** Companies with several lists: "These rounds come from <from>." */
  readonly from?: string;
  /** Companies with several lists: the question that switches a plan to this list. */
  readonly ask?: string;
  /**
   * Companies with several lists: the list every plan opens on, whatever the level. The others are one click away
   * on the switch line, also for every level.
   */
  readonly default?: true;
  /** Set only where the table names the levels its accounts come from. Other levels get a warning. */
  readonly reported?: { readonly levels: readonly CompanyPlanLevel[]; readonly who: string };
  /** The table groups these rounds by type and gives no order, so the plan says so instead of "in order". */
  readonly unordered?: true;
  /** The rounds for students, interns and new graduates; the form offers this list under the level question. */
  readonly students?: true;
  readonly rounds: readonly CompanyPlanRound[];
};

export type CompanyPlanCompany = {
  /**
   * A reported question belongs to the lists whose stages cite one of its sources. This names the lists for
   * the questions whose sources no list cites: the list the account matches, else the first list.
   */
  readonly reportVariants?: Readonly<Record<string, readonly string[]>>;
  /**
   * Round ids for a reported task whose report the process table cites on no stage, so the plan does not drop it on
   * the first coding round. Ids are looked up in whichever list the task lands on.
   */
  readonly reportRounds?: Readonly<Record<string, readonly string[]>>;
  readonly variants: readonly CompanyPlanVariant[];
};

export const COMPANY_PLAN_NOTE_MAX_LENGTH = 120;

/** The line a plan shows under a round. */
export function companyPlanRoundNote(round: CompanyPlanRound, format: string): string {
  return round.note ?? format.match(/^.+?[.!?]["”]?(?=\s+[A-Z"“]|$)/)?.[0] ?? format;
}

export const COMPANY_PLAN_ROUNDS: Readonly<Record<string, CompanyPlanCompany>> = {
  agoda: {
    variants: [
      {
        id: 'bangkok',
        title: 'Front-end engineers, Bangkok relocation loops, Senior and Staff, 2025 to 2026',
        from: 'Senior and Staff candidates in Bangkok',
        ask: 'Interviewing in Bangkok?',
        default: true,
        reported: { levels: ['senior', 'staff'], who: 'Senior and Staff candidates' },
        rounds: [
          { id: 'recruiter-prep-call', stage: 'Recruiter prep call', kinds: ['recruiter'] },
          {
            id: 'hackerrank-assessment',
            stage: 'HackerRank assessment',
            kinds: ['coding'],
            note: 'A HackerRank online test per the official page; one 2025 Senior account had an online assessment, the others none.',
          },
          {
            id: 'coding-interview',
            stage: 'Coding interview',
            kinds: ['coding'],
            note: '60 minutes on HackerRank: two easy-to-medium DSA problems in JavaScript, then questions on test cases.',
          },
          {
            id: 'frontend-platform-interview',
            stage: 'Frontend Platform interview',
            kinds: ['coding'],
            note: '60 minutes on HackerRank: web fundamentals, a JavaScript implementation or a component and state discussion.',
            picks: ['/javascript/trivia/js-web-fundamentals-hour-hotel-booking'],
          },
          {
            id: 'preliminary-call',
            stage: 'Preliminary call',
            kinds: ['recruiter'],
            note: '30 minutes with the recruiter on compensation, relocation and feedback.',
          },
          {
            id: 'architecture-interview',
            stage: 'Architecture interview',
            kinds: ['design'],
            note: '60 minutes on a frontend-flavoured product design such as a hotel search page, with no diagram expected.',
            picks: ['/system-design/hotel-search-page-frontend'],
          },
          {
            id: 'culture-fit',
            stage: 'Culture fit',
            kinds: ['people'],
            note: '60 minutes with an engineering manager on behavioural questions.',
          },
          {
            id: 'decision-and-offer',
            stage: 'Decision and offer',
            kinds: ['outcome'],
            note: 'The official target is a decision within two weeks of the last round, or under 30 days overall.',
          },
        ],
      },
      {
        id: 'gurgaon',
        title: 'Front-end engineers, Gurgaon, 2024 to 2025',
        from: 'candidates in Gurgaon',
        ask: 'Interviewing in Gurgaon?',
        rounds: [
          {
            id: 'online-assessment-or-take-home',
            stage: 'Online assessment or take-home',
            kinds: ['coding'],
            note: 'HTML, CSS and JavaScript questions online, or a take-home such as a React and TypeScript stock dashboard.',
          },
          { id: 'hr-screen', stage: 'HR screen', kinds: ['recruiter'] },
          {
            id: 'coding-round',
            stage: 'Coding round',
            kinds: ['coding'],
            note: '60 minutes of JavaScript or DSA problems, on HackerRank in one account.',
          },
          {
            id: 'platform-or-architecture-round',
            stage: 'Platform or architecture round',
            kinds: ['coding', 'design'],
            note: 'JavaScript depth such as hoisting and SSR versus CSR, or an hour of frontend architecture for a booking site.',
            picks: ['/javascript/trivia/js-web-fundamentals-hour-hotel-booking', '/system-design/hotel-search-page-frontend'],
          },
          { id: 'hr-salary-and-relocation-call', stage: 'HR salary and relocation call', kinds: ['recruiter'] },
          {
            id: 'managerial-or-technical-strategy-round',
            stage: 'Managerial or technical-strategy round',
            kinds: ['people'],
            note: 'A managerial round in a 2024 account, a 60-minute technical-strategy round in a 2025 account.',
          },
        ],
      },
    ],
  },
  airbnb: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers, mostly 2024 to 2025',
        // Most accounts list tasks without naming the round, so the table groups the rows by type and gives no order.
        unordered: true,
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: 'Varies by account: a UI component, a store-style design question, a booking widget or a LeetCode-hard problem.',
          },
          {
            id: 'coding-ui-or-react',
            stage: 'Coding: UI or React',
            kinds: ['coding'],
            note: 'Build UI: a styled card game, a photo gallery, a star rating or another React or DOM task.',
          },
          {
            id: 'coding-javascript',
            stage: 'Coding: JavaScript',
            kinds: ['coding'],
            note: 'Currying, callbacks, async, closures and prototypes in one account, vanilla JavaScript in another.',
          },
          { id: 'frontend-system-design', stage: 'Frontend system design', kinds: ['design'] },
          { id: 'experience-deep-dive', stage: 'Experience deep dive', kinds: ['people'] },
          { id: 'core-values-or-behavioural', stage: 'Core values or behavioural', kinds: ['people'] },
          {
            id: 'algorithms',
            stage: 'Algorithms',
            kinds: ['coding'],
            note: 'Accounts disagree: one reports no algorithms, two from 2025 report a LeetCode-hard problem.',
          },
          { id: 'team-matching', stage: 'Team matching', kinds: ['outcome'] },
        ],
      },
    ],
  },
  amazon: {
    reportVariants: {
      'js-array-prototype-filter': ['experienced'],
      'js-array-prototype-map': ['experienced'],
      'js-array-prototype-reduce': ['experienced'],
      'js-array-sort': ['experienced'],
      'react-accordion-faq': ['experienced'],
    },
    variants: [
      {
        id: 'experienced',
        title: 'Front End Engineer, experienced hires',
        from: 'experienced hires',
        ask: 'Interviewing as an experienced hire?',
        default: true,
        rounds: [
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: '90 minutes for two JavaScript coding questions, then system design scenarios and a work style survey.',
          },
          { id: 'phone-screen', stage: 'Phone screen', kinds: ['coding', 'people'] },
          {
            id: 'loop-coding-interviews',
            stage: 'Loop: coding interviews',
            kinds: ['coding'],
            note: 'Three interviews on maintainable code, problem solving, and data structures and algorithms.',
          },
          { id: 'loop-front-end-system-design', stage: 'Loop: front-end system design', kinds: ['design'] },
          { id: 'loop-leadership-principles', stage: 'Loop: Leadership Principles', kinds: ['people'] },
        ],
      },
      {
        id: 'students',
        title: 'Students and new graduates',
        from: 'students and new graduates',
        ask: 'Interviewing as a student or new graduate?',
        // Two tracks in one list: the internship round and the new-graduate rounds are not one sequence.
        unordered: true,
        students: true,
        rounds: [
          { id: 'internship-interviews', stage: 'Internship interviews', kinds: ['coding', 'people'] },
          { id: 'new-graduate-first-round', stage: 'New graduate first round', kinds: ['coding'] },
          { id: 'new-graduate-final-stage', stage: 'New graduate final stage', kinds: ['coding'] },
        ],
      },
    ],
  },
  anduril: {
    reportVariants: {
      'js-flatten-once': ['us'],
    },
    variants: [
      {
        id: 'us',
        title: 'Frontend engineers, United States',
        from: 'frontend engineers in the United States',
        ask: 'Interviewing for a full-time role?',
        default: true,
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: 'About an hour with an applied frontend problem, such as a file explorer in React in two accounts.',
          },
          {
            id: 'onsite',
            stage: 'Onsite',
            kinds: ['coding', 'design', 'people'],
            note: 'Three or four interviews: two coding rounds, one system design round and one behavioral interview.',
          },
          { id: 'decision', stage: 'Decision', kinds: ['outcome'] },
        ],
      },
      {
        id: 'interns',
        title: 'Frontend interns, 2023',
        from: 'a 2023 internship loop',
        ask: 'Interviewing for an internship?',
        students: true,
        rounds: [
          { id: 'introductory-interview', stage: 'Introductory interview', kinds: ['recruiter'] },
          { id: 'two-technical-rounds', stage: 'Two technical rounds', kinds: ['coding'] },
          { id: 'behavioral-interview', stage: 'Behavioral interview', kinds: ['people'] },
        ],
      },
    ],
  },
  apple: {
    variants: [
      {
        id: 'main',
        title: 'Frontend roles (the loop varies by team)',
        rounds: [
          { id: 'online-assessment', stage: 'Online assessment', kinds: ['coding'] },
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          { id: 'hiring-manager-conversation', stage: 'Hiring manager conversation', kinds: ['people'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: '45–60 minutes of React, JavaScript or TypeScript coding, sometimes with an algorithm problem.',
          },
          {
            id: 'team-loop',
            stage: 'Team loop',
            kinds: ['coding', 'people'],
            note: 'Four to seven interviews of 30–45 minutes, mostly JavaScript, React and CSS coding and concepts.',
          },
        ],
      },
    ],
  },
  'booking-com': {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers, 2021 to 2023',
        rounds: [
          {
            id: 'hackerrank-assessment',
            stage: 'HackerRank assessment',
            kinds: ['coding'],
            note: '90–100 minutes, about five items: algorithm problems, HTML and CSS questions and a React component.',
          },
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'frontend-coding',
            stage: 'Frontend coding',
            kinds: ['coding'],
            note: 'One or two rounds of about 60 minutes: build a component such as an autocomplete, or extend a prepared app.',
            picks: ['/javascript/coding/js-autocomplete-engine', '/react/coding/react-autocomplete-search-starter'],
          },
          { id: 'fit-interview', stage: 'Fit interview', kinds: ['people'] },
        ],
      },
    ],
  },
  bytedance: {
    variants: [
      {
        id: 'us',
        title: 'Frontend engineers, United States',
        from: 'candidates in the United States',
        ask: 'Interviewing in the United States?',
        default: true,
        rounds: [
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'CodeSignal or an unnamed platform, with multiple-choice and LeetCode-style questions and a frontend task.',
          },
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'technical-rounds',
            stage: 'Technical rounds',
            kinds: ['coding'],
            note: 'Usually two rounds of about an hour: one algorithm round and one frontend round.',
          },
          {
            id: 'hiring-manager-round',
            stage: 'Hiring manager round',
            kinds: ['design', 'people'],
            note: 'Experience questions plus frontend system design or React and JavaScript questions.',
          },
          { id: 'hr-or-behavioural-round', stage: 'HR or behavioural round', kinds: ['people'] },
        ],
      },
      {
        id: 'singapore-australia',
        title: 'Frontend engineers, Singapore and Australia',
        from: 'candidates in Singapore and Australia',
        ask: 'Interviewing in Singapore or Australia?',
        rounds: [
          { id: 'online-assessment', stage: 'Online assessment', kinds: ['coding'] },
          { id: 'technical-rounds', stage: 'Technical rounds', kinds: ['coding'] },
          { id: 'hiring-manager-round', stage: 'Hiring manager round', kinds: ['people', 'coding'] },
          { id: 'hr-round', stage: 'HR round', kinds: ['recruiter'] },
        ],
      },
      {
        id: 'new-grads',
        title: 'New graduates and interns',
        from: 'new graduates and interns',
        ask: 'Interviewing as a new graduate or intern?',
        students: true,
        rounds: [
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'Multiple-choice, algorithm and debugging questions, up to about 110 minutes.',
          },
          { id: 'technical-interviews', stage: 'Technical interviews', kinds: ['coding', 'design'] },
          { id: 'manager-or-behavioural-round', stage: 'Manager or behavioural round', kinds: ['people'] },
        ],
      },
    ],
  },
  'capital-one': {
    variants: [
      {
        id: 'senior',
        title: 'Senior frontend engineers, United States, 2022 to 2024',
        from: 'senior frontend engineers in the United States',
        ask: 'Interviewing as a senior engineer?',
        default: true,
        reported: { levels: ['senior'], who: 'senior candidates' },
        rounds: [
          { id: 'recruiter-screen', stage: 'Recruiter screen', kinds: ['recruiter'] },
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'CodeSignal, about 70 minutes, four LeetCode-style questions in most accounts and three in one.',
          },
          {
            id: 'power-day-frontend-design',
            stage: 'Power Day: frontend design',
            kinds: ['design'],
            note: 'A conversational design of a credit card application page, or the structure of a web app from requirements.',
          },
          {
            id: 'power-day-frontend-technical',
            stage: 'Power Day: frontend technical',
            kinds: ['coding'],
            note: 'A small framework task judged on structure, syntax and coding style, such as an Angular form with validations.',
          },
          {
            id: 'power-day-case',
            stage: 'Power Day: case',
            kinds: ['coding'],
            note: 'A business scenario read through code: find a bug, fix a faulty algorithm or refactor badly written code.',
          },
          { id: 'power-day-behavioral', stage: 'Power Day: behavioral', kinds: ['people'] },
          {
            id: 'result-and-team-matching',
            stage: 'Result and team matching',
            kinds: ['outcome'],
            note: 'Feedback within a day in one account; in others team matching stalled or the position was filled.',
          },
        ],
      },
      {
        id: 'lead',
        title: 'Lead frontend engineers, 2022 to 2024',
        from: 'lead frontend engineers',
        ask: 'Interviewing as a lead engineer?',
        reported: { levels: ['staff'], who: 'lead candidates' },
        rounds: [
          { id: 'online-assessment', stage: 'Online assessment', kinds: ['coding'] },
          {
            id: 'power-day',
            stage: 'Power Day',
            kinds: ['coding', 'design', 'people'],
            note: 'Four interviews: in 2024 front-end design, behavioral, a case study and a technical build of a single-page app.',
          },
          { id: 'result', stage: 'Result', kinds: ['outcome'] },
        ],
      },
    ],
  },
  crowdstrike: {
    reportVariants: {
      'model-training-progress-dashboard': ['us'],
    },
    // The 2025 account is cited on several stages. The table task belongs to the take-home build, and to the review,
    // whose follow-ups its Pressure Mode rounds rehearse, for someone whose build is already behind them.
    reportRounds: { 'react-files-table-select-all': ['take-home-build', 'take-home-review'] },
    variants: [
      {
        id: 'us',
        title: 'Frontend and UI engineers, United States, 2021 to 2025',
        from: 'candidates in the United States',
        ask: 'Interviewing in the United States?',
        default: true,
        rounds: [
          {
            id: 'recruiter-call',
            stage: 'Recruiter call',
            kinds: ['recruiter'],
            note: 'A short call about the role and your background.',
          },
          {
            id: 'hiring-manager',
            stage: 'Hiring manager',
            kinds: ['people'],
            note: 'An early conversation with the hiring manager or an engineering manager about your experience.',
          },
          {
            id: 'web-fundamentals-with-engineers',
            stage: 'Web fundamentals with engineers',
            kinds: ['coding'],
            note: 'Spoken questions from engineers on JavaScript, the CSS box model, accessibility, XSS and other security topics.',
          },
          { id: 'take-home-build', stage: 'Take-home build', kinds: ['coding'], picks: ['/react/coding/react-files-table-select-all'] },
          {
            id: 'take-home-review',
            stage: 'Take-home review',
            kinds: ['coding', 'design'],
            note: 'Engineers go through the submission: what you would change and how you would add filtering and sorting.',
          },
          {
            id: 'closing-round',
            stage: 'Closing round',
            kinds: ['people'],
            note: 'A culture interview, a collaboration panel, or an informational talk with the hiring manager.',
          },
          {
            id: 'result',
            stage: 'Result',
            kinds: ['outcome'],
            note: 'An offer or a standard rejection email without feedback; loops took one to four months.',
          },
        ],
      },
      {
        id: 'uk-denmark',
        title: 'Senior frontend engineers, United Kingdom and Denmark, 2024 to 2025',
        from: 'senior engineers in the United Kingdom and Denmark',
        ask: 'Interviewing in the United Kingdom or Denmark?',
        reported: { levels: ['senior'], who: 'senior candidates' },
        rounds: [
          { id: 'technical-questions-two-stages', stage: 'Technical questions, two stages', kinds: ['coding'] },
          {
            id: 'home-task',
            stage: 'Home task',
            kinds: ['coding'],
            note: 'One 2024 report: a week to deliver a task estimated at 5 hours; the candidate spent 10.',
          },
          {
            id: 'announced-later-stages',
            stage: 'Announced later stages',
            kinds: ['people'],
            note: 'One 2024 report: a presentation, a team meet-and-greet and a talk with HR were announced, content unknown.',
          },
          { id: 'live-coding', stage: 'Live coding', kinds: ['coding'] },
          { id: 'whiteboard-design', stage: 'Whiteboard design', kinds: ['design'] },
        ],
      },
      {
        id: 'interns',
        title: 'Interns and new graduates',
        from: 'interns and new graduates',
        ask: 'Interviewing as an intern or new graduate?',
        students: true,
        rounds: [
          { id: 'application-and-recruiter-contact', stage: 'Application and recruiter contact', kinds: ['recruiter'] },
          { id: 'technical-assessment', stage: 'Technical assessment', kinds: ['coding'] },
          { id: 'interviews', stage: 'Interviews', kinds: ['coding', 'people'] },
          { id: 'second-team', stage: 'Second team', kinds: ['people'] },
        ],
      },
    ],
  },
  datadog: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers, mostly in Europe',
        rounds: [
          { id: 'recruiter-screen', stage: 'Recruiter screen', kinds: ['recruiter'] },
          { id: 'technical-screen', stage: 'Technical screen', kinds: ['coding'] },
          { id: 'react-live-coding', stage: 'React live coding', kinds: ['coding'] },
          { id: 'second-coding-round', stage: 'Second coding round', kinds: ['coding'] },
          { id: 'frontend-system-design', stage: 'Frontend system design', kinds: ['design'] },
          { id: 'experience-and-values', stage: 'Experience and values', kinds: ['people'] },
          { id: 'team-match', stage: 'Team match', kinds: ['outcome'] },
        ],
      },
    ],
  },
  elevenlabs: {
    variants: [
      {
        id: 'main',
        title: 'Full-stack engineers, frontend-leaning',
        reported: { levels: ['mid', 'senior', 'staff'], who: 'senior, frontend and full-stack candidates' },
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'coding-assessment',
            stage: 'Coding assessment',
            kinds: ['coding'],
            note: 'The format varies; a 90-minute assessment in the 2026 account, React and algorithm problems in others.',
            picks: ['/javascript/coding/js-stream-to-text'],
          },
          {
            id: 'live-technical-round',
            stage: 'Live technical round',
            kinds: ['coding'],
            note: 'Pair work with an engineer: fixing a practical problem, debugging a small React app or building a component.',
            picks: ['/react/coding/react-debug-transcript-sync', '/javascript/debug/js-debug-stale-closure-autosave'],
          },
          {
            id: 'product-or-design-round',
            stage: 'Product or design round',
            kinds: ['design'],
            note: 'A product or decomposition interview in the 2025 accounts, a system design interview in a 2024 account.',
            picks: ['/system-design/live-chart-high-frequency-updates'],
          },
          {
            id: 'final-conversation',
            stage: 'Final conversation',
            kinds: ['people'],
            note: 'A call with the CTO in 2025; the careers FAQ names a founder or Bar Raiser.',
          },
        ],
      },
    ],
  },
  gitlab: {
    reportVariants: {
      'html-head-seo-basics': ['frontend'],
    },
    variants: [
      {
        id: 'frontend',
        title: 'Frontend engineers, all levels',
        from: 'frontend engineers',
        ask: 'Interviewing as a frontend engineer?',
        default: true,
        rounds: [
          { id: 'written-assessment', stage: 'Written assessment', kinds: ['coding'] },
          {
            id: 'recruiter-screening-call',
            stage: 'Recruiter screening call',
            kinds: ['recruiter'],
            note: '30 to 40 minutes on video: background, motivation, experience with each listed skill and salary range.',
          },
          {
            id: 'merge-request-review',
            stage: 'Merge request review',
            kinds: ['coding'],
            note: 'A self-contained merge request on a small application arrives at least 72 hours before the call.',
          },
          {
            id: 'technical-interview',
            stage: 'Technical interview',
            kinds: ['coding'],
            note: '90 minutes on video: walk through your review, then write code to improve the merge request.',
          },
          { id: 'behavioral-interview', stage: 'Behavioral interview', kinds: ['people'] },
          {
            id: 'director-interview',
            stage: 'Director interview',
            kinds: ['people'],
            note: '60 minutes with a Director of Engineering on past experience and values.',
          },
          { id: 'references-and-offer', stage: 'References and offer', kinds: ['outcome'] },
        ],
      },
      {
        id: 'full-stack',
        title: 'Full-stack engineers',
        from: 'full-stack engineers',
        ask: 'Interviewing as a full-stack engineer?',
        rounds: [
          { id: 'recruiter-screening-call', stage: 'Recruiter screening call', kinds: ['recruiter'] },
          { id: 'backend-technical-interview', stage: 'Backend technical interview', kinds: ['other'] },
          { id: 'frontend-technical-interview', stage: 'Frontend technical interview', kinds: ['coding'] },
          { id: 'manager-and-director-interviews', stage: 'Manager and director interviews', kinds: ['people'] },
        ],
      },
    ],
  },
  google: {
    variants: [
      {
        id: 'main',
        title: 'Software engineers in front-end roles',
        rounds: [
          { id: 'recruiter-conversations', stage: 'Recruiter conversations', kinds: ['recruiter'] },
          { id: 'assessment', stage: 'Assessment', kinds: ['coding'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: 'About an hour of coding in a shared document, in JavaScript or on an algorithm problem.',
          },
          {
            id: 'interview-loop',
            stage: 'Interview loop',
            kinds: ['coding'],
            note: 'Four or five interviews: algorithm coding and usually one JavaScript or frontend round.',
          },
          {
            id: 'googleyness-interview',
            stage: 'Googleyness interview',
            kinds: ['people'],
            note: 'About 45 minutes of behavioural and hypothetical questions, often called Googleyness and Leadership.',
          },
          { id: 'system-design', stage: 'System design', kinds: ['design'] },
          { id: 'hiring-committee-and-team-match', stage: 'Hiring committee and team match', kinds: ['outcome'] },
        ],
      },
    ],
  },
  intuit: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers',
        rounds: [
          { id: 'recruiter-or-hr-call', stage: 'Recruiter or HR call', kinds: ['recruiter'] },
          {
            id: 'technical-phone-interview',
            stage: 'Technical phone interview',
            kinds: ['coding'],
            note: '45–75 minutes on JavaScript, promises, performance, security, React and an algorithm problem.',
          },
          {
            id: 'craft-demonstration',
            stage: 'Craft demonstration',
            kinds: ['coding'],
            note: 'Build a task from user stories, present it, walk through the code and add features live.',
          },
          {
            id: 'assessor-or-technical-rounds',
            stage: 'Assessor or technical rounds',
            kinds: ['coding'],
            note: 'One or two rounds of 30–60 minutes, including changes to the craft code.',
          },
          { id: 'ai-round', stage: 'AI round', kinds: ['other'] },
          { id: 'hiring-manager', stage: 'Hiring manager', kinds: ['people'] },
          { id: 'team-matching', stage: 'Team matching', kinds: ['outcome'] },
        ],
      },
    ],
  },
  jpmorgan: {
    variants: [
      {
        id: 'main',
        title: 'Front-end and React engineers, team-run loops, 2021 to 2026',
        rounds: [
          { id: 'recruiter-contact', stage: 'Recruiter contact', kinds: ['recruiter'] },
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'HackerRank with two easy-to-medium problems, or a recorded video interview for some roles.',
          },
          {
            id: 'frontend-technical-conversation',
            stage: 'Frontend technical conversation',
            kinds: ['coding'],
            note: 'About an hour on JavaScript fundamentals, React hooks and lifecycle, framework choice and your resume.',
          },
          {
            id: 'live-coding',
            stage: 'Live coding',
            kinds: ['coding'],
            note: '30 to 90 minutes: a small React build such as a to-do list with priorities, or paper coding.',
          },
          {
            id: 'security-and-framework-rounds',
            stage: 'Security and framework rounds',
            kinds: ['coding', 'people'],
            note: 'Three 60-minute rounds in one sitting: security and React, JavaScript and framework, hiring manager.',
          },
          {
            id: 'super-day',
            stage: 'Super day',
            kinds: ['coding', 'design', 'people'],
            note: 'Three rounds of 45 to 60 minutes in one day: a pull-request review, high-level design and a behavioural round.',
          },
          {
            id: 'hiring-manager-and-leadership',
            stage: 'Hiring manager and leadership',
            kinds: ['people'],
            note: 'A team manager and a managing director, or a hiring-manager round on your project and culture fit.',
          },
        ],
      },
    ],
  },
  meta: {
    reportVariants: {
      'js-stack-queue-implementation': ['ic4-ic6'],
    },
    variants: [
      {
        id: 'ic4-ic6',
        title: 'Front End Engineer, IC4 to IC6',
        from: 'Front End Engineer candidates at IC4 to IC6',
        ask: 'Interviewing for a full-time role?',
        default: true,
        reported: { levels: ['mid', 'senior', 'staff'], who: 'IC4 to IC6 candidates' },
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          { id: 'initial-technical-screen', stage: 'Initial technical screen', kinds: ['coding'] },
          {
            id: 'full-loop-coding',
            stage: 'Full loop: coding',
            kinds: ['coding'],
            note: 'About two problems in about 40 minutes, in JavaScript, with no dynamic programming.',
          },
          { id: 'full-loop-ui-architecture-and-design', stage: 'Full loop: UI architecture and design', kinds: ['design'] },
          { id: 'full-loop-behavioural', stage: 'Full loop: behavioural', kinds: ['people'] },
        ],
      },
      {
        id: 'interns',
        title: 'Front End Engineer internships',
        from: 'internship candidates',
        ask: 'Interviewing for an internship?',
        students: true,
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          { id: 'technical-interviews', stage: 'Technical interviews', kinds: ['coding'] },
        ],
      },
    ],
  },
  microsoft: {
    variants: [
      {
        id: 'frontend',
        title: 'Frontend roles (the loop varies by team)',
        from: 'frontend roles, and the loop varies by team',
        ask: 'Interviewing for a full-time role?',
        default: true,
        rounds: [
          { id: 'recruiter-or-hr-call', stage: 'Recruiter or HR call', kinds: ['recruiter'] },
          {
            id: 'machine-coding',
            stage: 'Machine coding',
            kinds: ['coding'],
            note: 'A UI build: plain JavaScript in 2020–2021 accounts, React components in 2024–2025 accounts.',
          },
          { id: 'javascript-and-react-concepts', stage: 'JavaScript and React concepts', kinds: ['coding'] },
          { id: 'algorithms-and-problem-solving', stage: 'Algorithms and problem solving', kinds: ['coding'] },
          { id: 'design', stage: 'Design', kinds: ['design'] },
          { id: 'behavioural-and-hiring-manager', stage: 'Behavioural and hiring manager', kinds: ['people'] },
        ],
      },
      {
        id: 'students',
        title: 'Students',
        from: 'students',
        ask: 'Interviewing as a student?',
        students: true,
        rounds: [
          { id: 'initial-interview', stage: 'Initial interview', kinds: ['coding'] },
          { id: 'final-interview', stage: 'Final interview', kinds: ['coding'] },
        ],
      },
    ],
  },
  netflix: {
    reportVariants: {
      'js-debounce': ['experienced'],
      'react-debounced-search': ['experienced'],
    },
    variants: [
      {
        id: 'experienced',
        title: 'Experienced frontend and UI engineers',
        from: 'experienced engineers',
        ask: 'Interviewing as an experienced engineer?',
        default: true,
        rounds: [
          { id: 'recruiter-conversation', stage: 'Recruiter conversation', kinds: ['recruiter'] },
          {
            id: 'hiring-manager-conversation',
            stage: 'Hiring-manager conversation',
            kinds: ['people'],
            note: 'A long behavioural interview with a UI manager in the 2020 account; a 2024 commenter expects a manager screen.',
          },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: 'One hour with three small JavaScript tasks in a 2025 screen for an L4 or L5 frontend role.',
          },
          {
            id: 'take-home',
            stage: 'Take-home',
            kinds: ['coding'],
            note: 'A build exercise reviewed later in the loop, in the 2020 account and in a loop from before 2022.',
          },
          {
            id: 'onsite',
            stage: 'Onsite',
            kinds: ['coding', 'people', 'design'],
            note: 'One coding interview, a take-home review and two behavioural interviews in 2020, with no LeetCode-type questions.',
          },
        ],
      },
      {
        id: 'new-grads',
        title: 'New graduates and interns',
        from: 'new graduates and interns',
        ask: 'Interviewing as a new graduate or intern?',
        students: true,
        rounds: [
          {
            id: 'take-home-assessment',
            stage: 'Take-home assessment',
            kinds: ['coding'],
            note: 'A take-home assessment opens the process.',
          },
          { id: 'interview-rounds', stage: 'Interview rounds', kinds: ['coding', 'people'] },
        ],
      },
    ],
  },
  openai: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers',
        rounds: [
          { id: 'resume-review', stage: 'Résumé review', kinds: ['recruiter'] },
          {
            id: 'recruiter-or-hiring-manager-call',
            stage: 'Recruiter or hiring-manager call',
            kinds: ['recruiter'],
            note: 'A conversation with the hiring manager or recruiter about work experience, motivations and goals.',
          },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding', 'design'],
            note: 'Refactoring then systems design in one 2024 account; a JavaScript fix or a React exercise in others.',
          },
          {
            id: 'agentic-coding-option',
            stage: 'Agentic coding option',
            kinds: ['coding'],
            note: 'In October 2026 one senior candidate could choose a JavaScript interview or an agentic coding interview.',
          },
          {
            id: 'final-interviews',
            stage: 'Final interviews',
            kinds: ['coding', 'design', 'people'],
            note: '4 to 6 hours with 4 to 6 people over 1 to 2 days, per the guide.',
          },
          { id: 'decision', stage: 'Decision', kinds: ['outcome'] },
        ],
      },
    ],
  },
  revolut: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers in European hubs',
        rounds: [
          { id: 'recruiter-or-hr-screen', stage: 'Recruiter or HR screen', kinds: ['recruiter'] },
          { id: 'hackerrank-assessment', stage: 'HackerRank assessment', kinds: ['coding'] },
          {
            id: 'live-coding',
            stage: 'Live coding',
            kinds: ['coding'],
            note: 'About an hour of React and TypeScript: render API data with loading and error states, or extend a small app.',
          },
          { id: 'system-design', stage: 'System design', kinds: ['design'] },
          { id: 'team-fit', stage: 'Team fit', kinds: ['people'] },
          { id: 'bar-raiser', stage: 'Bar Raiser', kinds: ['people'] },
        ],
      },
    ],
  },
  servicenow: {
    variants: [
      {
        id: 'main',
        title: 'UI and frontend engineers, 2022 to 2025',
        reported: { levels: ['junior', 'mid', 'senior'], who: 'IC2 to senior candidates' },
        rounds: [
          { id: 'screening-call', stage: 'Screening call', kinds: ['recruiter'] },
          {
            id: 'javascript-fundamentals',
            stage: 'JavaScript fundamentals',
            kinds: ['coding'],
            note: 'About an hour in one account: closures, promises, polyfills and output prediction.',
          },
          { id: 'second-technical-round', stage: 'Second technical round', kinds: ['coding', 'design'] },
          { id: 'design-or-machine-coding', stage: 'Design or machine coding', kinds: ['coding'] },
          {
            id: 'hiring-manager',
            stage: 'Hiring manager',
            // Spoken JavaScript questions and a design task, so a polyfill drill does not land here.
            kinds: ['people', 'design'],
            note: 'A hiring-manager round mixing JavaScript questions, a design task and behavioural questions.',
          },
        ],
      },
    ],
  },
  shopee: {
    reportVariants: {
      'css-inline-centering': ['ho-chi-minh'],
      'js-shallow-clone': ['ho-chi-minh'],
    },
    variants: [
      {
        id: 'ho-chi-minh',
        title: 'Front-end engineers, Ho Chi Minh City, 2025',
        from: 'candidates in Ho Chi Minh City',
        ask: 'Interviewing in Ho Chi Minh City?',
        default: true,
        rounds: [
          { id: 'hr-call', stage: 'HR call', kinds: ['recruiter'] },
          {
            id: 'frontend-technical-round',
            stage: 'Frontend technical round',
            kinds: ['coding'],
            note: 'About two hours in clear parts: CSS, JavaScript, a React build and an algorithm.',
          },
          {
            id: 'cs-fundamentals-round',
            stage: 'CS-fundamentals round',
            kinds: ['coding', 'design'],
            note: 'Design a system based on your current work, then HTTP, TCP/UDP, WebSocket and encryption questions.',
          },
          { id: 'behavioural-interview', stage: 'Behavioural interview', kinds: ['people'] },
          { id: 'final-conversation-and-offer', stage: 'Final conversation and offer', kinds: ['people'] },
        ],
      },
      {
        id: 'singapore',
        title: 'Fresh graduates, Singapore, 2020 to 2022',
        from: 'fresh graduates in Singapore',
        ask: 'Interviewing as a fresh graduate in Singapore?',
        students: true,
        rounds: [
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'A 70-minute test in the 2022 account: multiple-choice on systems and networking plus two array problems.',
          },
          {
            id: 'technical-video-rounds',
            stage: 'Technical video rounds',
            kinds: ['coding'],
            note: 'One to three rounds of 60 to 90 minutes on a shared editor: coding problems, CS fundamentals and a design concept.',
          },
          {
            id: 'hr-call-with-a-verbal-offer',
            stage: 'HR call with a verbal offer',
            kinds: ['outcome'],
            note: 'A verbal offer from HR about five weeks after applying in the 2020 account; a 2022 loop ended in a rejection.',
          },
        ],
      },
      {
        id: 'mainland-china',
        title: 'Campus and social hires, mainland China, in Chinese, 2019 to 2025',
        from: 'candidates in mainland China',
        ask: 'Interviewing in mainland China?',
        rounds: [
          {
            id: 'application-or-referral-then-a-written-test',
            stage: 'Application or referral, then a written test',
            kinds: ['coding'],
            note: 'The campus posting lists an online application or referral, then a written test that some roles skip.',
          },
          {
            id: 'first-technical-interview',
            stage: 'First technical interview',
            kinds: ['coding'],
            note: 'JavaScript, CSS, HTTP and framework basics plus one or two small algorithms.',
          },
          {
            id: 'second-technical-interview',
            stage: 'Second technical interview',
            kinds: ['coding'],
            note: 'React internals, HTTP/2, webpack performance, CDN and scenario questions, project depth and a second coding task.',
          },
          {
            id: 'hr-interview-and-offer',
            stage: 'HR interview and offer',
            kinds: ['recruiter'],
            note: 'The posting lists an HR conversation before the offer.',
          },
        ],
      },
    ],
  },
  spotify: {
    variants: [
      {
        id: 'main',
        title: 'Web engineers, United States and Canada',
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: '60–75 minutes with one or two engineers: JavaScript and CSS questions, an easy algorithm or an HTML and CSS mockup.',
          },
          {
            id: 'final-web-practical',
            stage: 'Final: web practical',
            kinds: ['coding'],
            note: 'A plain HTML, CSS and JavaScript build, such as a form that fetches from an API, or web domain questions.',
          },
          { id: 'final-algorithms', stage: 'Final: algorithms', kinds: ['coding'] },
          { id: 'final-system-design', stage: 'Final: system design', kinds: ['design'] },
          { id: 'final-values', stage: 'Final: values', kinds: ['people'] },
        ],
      },
    ],
  },
  stripe: {
    // The LeetCode Discuss post behind both tasks describes a software engineer 2 initial screen, not the onsite.
    reportRounds: { 'js-group-by': ['technical-screen'], 'js-lodash-get': ['technical-screen'] },
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers',
        rounds: [
          { id: 'recruiter-screen', stage: 'Recruiter screen', kinds: ['recruiter'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: '60 minutes of live, multi-part coding in CoderPad, sometimes building a UI component.',
          },
          { id: 'onsite-bug-squash', stage: 'Onsite: bug squash', kinds: ['coding'] },
          { id: 'onsite-integration', stage: 'Onsite: integration', kinds: ['coding'] },
          { id: 'onsite-programming-exercise', stage: 'Onsite: programming exercise', kinds: ['coding'] },
          { id: 'onsite-frontend-design', stage: 'Onsite: frontend design', kinds: ['design'] },
          { id: 'onsite-manager-conversation', stage: 'Onsite: manager conversation', kinds: ['people'] },
        ],
      },
    ],
  },
  tesla: {
    reportVariants: {
      'js-deep-clone': ['engineers'],
      'js-shallow-clone': ['engineers'],
      'react-battery-site-layout': ['engineers'],
    },
    variants: [
      {
        id: 'engineers',
        title: 'Frontend developer and engineer roles',
        from: 'frontend developer and engineer roles',
        ask: 'Interviewing for a full-time role?',
        default: true,
        rounds: [
          { id: 'recruiter-or-hr-call', stage: 'Recruiter or HR call', kinds: ['recruiter'] },
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'Often on Codility: one account lists 2 hours for 5 questions, another a three-hour assessment.',
          },
          { id: 'technical-screen', stage: 'Technical screen', kinds: ['coding'] },
          {
            id: 'final-loop-frontend-coding',
            stage: 'Final loop: frontend coding',
            kinds: ['coding'],
            note: 'One or two frontend coding rounds in React, or an Angular round followed by a TypeScript and JavaScript round.',
          },
          { id: 'final-loop-data-structures-and-algorithms', stage: 'Final loop: data structures and algorithms', kinds: ['coding'] },
          {
            id: 'final-loop-frontend-system-design',
            stage: 'Final loop: frontend system design',
            kinds: ['design'],
            note: 'A design round on a shared component and its API in one account, on a car rental company in another.',
          },
          {
            id: 'final-loop-hiring-manager-and-behavioural',
            stage: 'Final loop: hiring manager and behavioural',
            kinds: ['people'],
            note: "A behavioural round; one recruiter's plan listed a hiring-manager and a product manager interview.",
          },
          { id: 'team-match', stage: 'Team match', kinds: ['outcome'] },
        ],
      },
      {
        id: 'interns',
        title: 'Internships',
        from: 'internship candidates',
        ask: 'Interviewing for an internship?',
        students: true,
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'technical-rounds',
            stage: 'Technical rounds',
            kinds: ['coding'],
            note: 'One or two rounds, such as a React autocomplete backed by an API, then a medium binary search problem.',
          },
          { id: 'system-design-final', stage: 'System design final', kinds: ['design'] },
        ],
      },
    ],
  },
  uber: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers, L3 to L5A',
        reported: { levels: ['junior', 'mid', 'senior'], who: 'L3 to L5A candidates' },
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'HackerRank in the official guide; a 35-minute CodeSignal test in a 2022 account.',
          },
          { id: 'phone-screen', stage: 'Phone screen', kinds: ['coding'] },
          { id: 'algorithms-and-data-structures', stage: 'Algorithms and data structures', kinds: ['coding'] },
          { id: 'frontend-specialization', stage: 'Frontend specialization', kinds: ['coding'] },
          {
            id: 'system-design',
            stage: 'System design',
            kinds: ['design'],
            note: 'Frontend architecture; three accounts were asked to design a calendar.',
          },
          { id: 'collaboration-and-leadership', stage: 'Collaboration and leadership', kinds: ['people'] },
        ],
      },
    ],
  },
  walmart: {
    reportVariants: {
      'js-add-two-promises': ['swe3'],
      'js-curry-function': ['sde3-ui'],
      'js-stack-queue-implementation': ['sde2'],
      'js-valid-anagram': ['swe3'],
      'messaging-inbox-frontend': ['swe3'],
      'react-accordion-faq': ['swe3'],
    },
    // The 2022 loop's tasks belong to the onsite coding rounds, not to the 2026 assessment or the Karat screen.
    reportRounds: {
      'js-add-two-promises': ['coding-rounds'],
      'js-valid-anagram': ['coding-rounds'],
      'react-accordion-faq': ['coding-rounds'],
    },
    variants: [
      {
        id: 'sde3-ui',
        title: 'Software Development Engineer 3 (UI), Walmart Global Tech',
        from: 'SDE 3 (UI) roles at Walmart Global Tech',
        ask: 'Interviewing for SDE 3 (UI)?',
        reported: { levels: ['senior'], who: 'SDE 3 candidates' },
        rounds: [
          { id: 'dsa-round', stage: 'DSA round', kinds: ['coding'] },
          { id: 'javascript-react-and-web-fundamentals', stage: 'JavaScript, React and web fundamentals', kinds: ['coding'] },
          { id: 'hiring-manager', stage: 'Hiring manager', kinds: ['people'] },
          { id: 'hr-call', stage: 'HR call', kinds: ['recruiter'] },
        ],
      },
      {
        id: 'sde2',
        title: 'SDE-2 and frontend engineer roles in India',
        from: 'SDE-2 and frontend engineer roles in India',
        ask: 'Interviewing for an SDE-2 role in India?',
        reported: { levels: ['mid'], who: 'SDE-2 and frontend engineer candidates' },
        rounds: [
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'One 2024 assessment: multiple-choice on HTML, CSS, JavaScript and React or Angular, plus two easy coding questions.',
          },
          { id: 'technical-rounds', stage: 'Technical rounds', kinds: ['coding'] },
          { id: 'final-round', stage: 'Final round', kinds: ['people'] },
        ],
      },
      {
        id: 'swe3',
        title: 'Software Engineer III, senior and frontend engineer roles',
        from: 'Software Engineer III and senior roles',
        ask: 'Interviewing for Software Engineer III or a senior role?',
        default: true,
        rounds: [
          {
            id: 'online-assessment',
            stage: 'Online assessment (2026 accounts)',
            kinds: ['coding'],
            note: 'A HackerRank assessment with a coding problem and a React or Angular debugging task.',
          },
          {
            id: 'coding-screen',
            stage: 'Coding screen',
            kinds: ['coding'],
            note: 'A Karat screen, a one-hour HackerRank interview, two React code challenges or a JavaScript coding round.',
          },
          {
            id: 'coding-rounds',
            stage: 'Coding rounds',
            kinds: ['coding'],
            note: 'One or two coding rounds: React coding, a debugging session, medium DSA problems or a UI and JavaScript round.',
          },
          { id: 'system-design', stage: 'System design', kinds: ['design'] },
          { id: 'behavioural-and-hiring-manager', stage: 'Behavioural and hiring manager', kinds: ['people'] },
        ],
      },
    ],
  },
  waymo: {
    // The PracHub May 2026 account is cited on both the phone screen and the onsite. The guide puts the tree filter on
    // the screen and the account's other tasks on the onsite, so the plan does too.
    reportRounds: {
      'js-filter-tree-render-indented': ['phone-or-video-interviews'],
      'js-debounce': ['virtual-onsite'],
      'angular-autocomplete-search-starter': ['virtual-onsite'],
      'angular-debounced-search': ['virtual-onsite'],
      'js-create-deferred-promise': ['virtual-onsite'],
      'js-fetch-json-timeout': ['virtual-onsite'],
      'js-promise-all': ['virtual-onsite'],
      'ng-debug-fleet-status-bug-reports': ['virtual-onsite'],
    },
    variants: [
      {
        id: 'frontend',
        title: 'Frontend engineers',
        from: 'frontend engineers',
        ask: 'Interviewing as a frontend engineer?',
        default: true,
        rounds: [
          { id: 'sourcer-or-recruiter-conversation', stage: 'Sourcer or recruiter conversation', kinds: ['recruiter'] },
          { id: 'phone-or-video-interviews', stage: 'Phone or video interviews', kinds: ['coding', 'people'] },
          { id: 'virtual-onsite', stage: 'Virtual onsite', kinds: ['coding', 'design'] },
        ],
      },
      {
        id: 'software',
        title: 'Software engineers with a UI round, 2026',
        from: 'a software engineer loop with a UI round',
        ask: 'Interviewing as a software engineer with a UI round?',
        rounds: [
          { id: 'recruiter-screen', stage: 'Recruiter screen', kinds: ['recruiter'] },
          {
            id: 'progressive-coding-round',
            stage: 'Progressive coding round',
            kinds: ['coding'],
            note: 'One problem whose constraints kept changing, judged on correctness and complexity.',
          },
          {
            id: 'javascript-and-ui-round',
            stage: 'JavaScript and UI round',
            kinds: ['coding'],
            note: 'Build a generic tree viewer component for hierarchical data, like a file explorer.',
          },
          {
            id: 'hiring-manager-round',
            stage: 'Hiring-manager round',
            kinds: ['people'],
            note: 'Conversational and scenario-based: production ownership, reliability and cross-team collaboration.',
          },
          { id: 'algorithms-round', stage: 'Algorithms round', kinds: ['coding'] },
        ],
      },
    ],
  },
  xai: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers, London and Bay Area, from postings 2025-03 to 2026-02 and one London account',
        rounds: [
          { id: 'application-review', stage: 'Application review', kinds: ['recruiter'] },
          { id: 'screening', stage: 'Screening', kinds: ['recruiter'] },
          { id: 'react-coding-interview', stage: 'React coding interview', kinds: ['coding'] },
          {
            id: 'html-css-interview',
            stage: 'HTML/CSS interview',
            kinds: ['coding'],
            note: 'Implement a UI from a screenshot; 45 minutes with Tailwind in London. Postings only.',
          },
          {
            id: 'coding-assessment-in-a-language-of-your-choice',
            stage: 'Coding assessment in a language of your choice',
            kinds: ['coding'],
            note: 'A general coding round before the frontend interviews. Postings only.',
          },
          {
            id: 'systems-hands-on',
            stage: 'Systems hands-on',
            kinds: ['coding', 'design'],
            note: 'A live problem-solving session on practical skills. Posting only.',
          },
          {
            id: 'meet-the-team-or-founding-engineer',
            stage: 'Meet the team or founding engineer',
            kinds: ['people'],
            note: 'Bay Area: present your past work to a small audience. London: 30 minutes with a founding engineer.',
          },
          {
            id: 'ui-design-exercise-and-presentation',
            stage: 'UI design exercise and presentation',
            kinds: ['other'],
            note: 'A UI design in a tool of your choice and a 20-minute presentation of past design work. Posting only.',
          },
          {
            id: 'take-home-and-code-reading-final',
            stage: 'Take-home and code-reading final',
            kinds: ['coding'],
            note: 'A four-hour AI-assisted product build, then a one-hour in-person session on an existing class.',
          },
        ],
      },
    ],
  },
  zalando: {
    variants: [
      {
        id: 'main',
        title: 'Frontend engineers, Berlin',
        rounds: [
          { id: 'talent-acquisition-call', stage: 'Talent acquisition call', kinds: ['recruiter'] },
          {
            id: 'coding-challenge',
            stage: 'Coding challenge',
            kinds: ['coding'],
            note: 'An assessment at home: a Codility challenge of two to three hours in 2022 and 2024.',
          },
          {
            id: 'hiring-manager',
            stage: 'Hiring manager',
            kinds: ['people'],
            note: '30–60 minutes on the official pages; a Blind commenter describes it as non-technical.',
          },
          // The review discusses the take-home's design and further optimisation, so a design case modelled on it fits here.
          { id: 'final-take-home-review', stage: 'Final: take-home review', kinds: ['coding', 'design'] },
          { id: 'final-javascript-fundamentals', stage: 'Final: JavaScript fundamentals', kinds: ['coding'] },
          { id: 'final-coding', stage: 'Final: coding', kinds: ['coding'] },
          { id: 'final-system-design', stage: 'Final: system design', kinds: ['design'] },
          { id: 'final-engineering-manager-or-hr', stage: 'Final: engineering manager or HR', kinds: ['people'] },
        ],
      },
    ],
  },
};
