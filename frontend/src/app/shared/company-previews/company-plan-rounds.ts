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

/** Capital One's CodeSignal test is the same in both of its lists, and so is the practice the plan picks for it. */
const CAPITAL_ONE_ASSESSMENT_PICKS: readonly string[] = [
  '/javascript/coding/js-valid-parentheses',
  '/javascript/coding/js-maze-path',
  '/javascript/coding/js-longest-substring-without-repeating',
];

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
            note: '60 minutes on HackerRank: two easy-to-medium DSA problems in JavaScript, then a few spoken follow-up questions.',
          },
          {
            id: 'frontend-platform-interview',
            stage: 'Frontend Platform interview',
            kinds: ['coding'],
            note: '60 minutes on HackerRank: spoken questions, a JavaScript implementation or a front-end architecture discussion.',
            // Prompt 5 practises the utility a Staff account's JavaScript implementation round asked for; its report is
            // also cited on the coding hour, which would otherwise take the task as a DSA problem.
            picks: ['/javascript/trivia/js-web-fundamentals-hour-hotel-booking', '/javascript/coding/js-debounce'],
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
            note: 'An online assessment of HTML/CSS and JavaScript questions, or a React and TypeScript take-home.',
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
            note: 'Spoken JavaScript and front-end questions, or a 60-minute front-end architecture design.',
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
            note: 'Content varies by account, from building UI to a LeetCode-hard algorithm problem.',
          },
          {
            id: 'coding-ui-or-react',
            stage: 'Coding: UI or React',
            kinds: ['coding'],
            note: 'UI built live in React or plain DOM code; a card game in a 2025 and a 2022 account.',
          },
          {
            id: 'coding-javascript',
            stage: 'Coding: JavaScript',
            kinds: ['coding'],
            note: 'JavaScript coding without a framework, a round of its own in a 2024 frontend loop.',
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
  airwallex: {
    variants: [
      {
        id: 'singapore',
        title: 'Frontend engineers, Singapore, 2025',
        from: 'three frontend loops in 2025, two of them in Singapore',
        ask: 'Interviewing for a frontend role in Singapore?',
        default: true,
        rounds: [
          { id: 'hr-screen', stage: 'Recruiter or HR screen', kinds: ['recruiter'] },
          {
            id: 'technical-round-1',
            stage: 'Technical round 1',
            kinds: ['coding'],
            note: 'Live coding: a React task or coding problems explained on a shared screen.',
          },
          { id: 'technical-round-2', stage: 'Technical round 2', kinds: ['coding', 'people'] },
          { id: 'third-round', stage: 'Third round', kinds: ['other'] },
        ],
      },
      {
        id: 'australia',
        title: 'Frontend engineers, Australia, 2023 and 2025',
        from: 'frontend loops in Sydney and Melbourne in 2023 and 2025',
        ask: 'Interviewing for a frontend role in Australia?',
        rounds: [
          { id: 'recruiter-screen', stage: 'Recruiter screen', kinds: ['recruiter'] },
          {
            id: 'project-interview',
            stage: 'Project and behaviour interview',
            kinds: ['people'],
            note: 'An hour with an engineering manager and a lead engineer on a recent project and its decisions.',
          },
          { id: 'coding-exercise', stage: 'Coding exercise', kinds: ['coding'] },
          { id: 'take-home-review', stage: 'Take-home review panel', kinds: ['coding'] },
          {
            id: 'final',
            stage: 'Final',
            kinds: ['people', 'coding'],
            note: 'An hour with a director and a senior engineer: a project deep dive, architecture and brain teasers.',
          },
        ],
      },
      {
        id: 'official-2022',
        title: 'The engineering process Airwallex published in 2022',
        from: "Airwallex's own 2022 post on getting hired",
        ask: 'Interviewing for a general engineering role?',
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          { id: 'tech-screen', stage: 'Tech screen', kinds: ['coding'] },
          {
            id: 'take-home-or-live',
            stage: 'Take-home or live coding',
            kinds: ['coding'],
            note: 'A take-home of about 3 to 4 hours, or a harder problem coded live in 60 minutes.',
          },
          { id: 'design-and-problem-solving', stage: 'System design and problem solving', kinds: ['design', 'coding'] },
          { id: 'final-senior-leader', stage: 'Final with a senior leader', kinds: ['people'] },
        ],
      },
      {
        id: 'london-2026',
        title: 'Engineering roles in London, 2026',
        from: "Airwallex's own 2026 post on London",
        ask: 'Interviewing for an engineering role in London?',
        rounds: [
          { id: 'coding-interview', stage: 'Coding interview', kinds: ['coding'] },
          { id: 'system-design-interview', stage: 'System design interview', kinds: ['design'] },
          { id: 'hiring-manager-interview', stage: 'Hiring manager interview', kinds: ['people'] },
          {
            id: 'bar-raiser',
            stage: 'Bar raiser',
            kinds: ['people'],
            note: 'Motivations, behaviours, fit with the values and operating principles, and how you use AI.',
          },
        ],
      },
      {
        id: 'early-careers',
        title: 'Early careers, 2026',
        from: "Airwallex's early-careers page and a 2026 intern account",
        ask: 'Interviewing as an intern or graduate?',
        students: true,
        rounds: [
          { id: 'early-careers-recruiter-screen', stage: 'Early-careers recruiter screen', kinds: ['recruiter'] },
          { id: 'working-sessions', stage: 'Technical or working sessions', kinds: ['coding'] },
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
            note: 'About an hour on one applied frontend problem rather than a LeetCode puzzle, built live and usually in React.',
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
    // The 2025 IC3 account is cited on the assessment, the recruiter call and the screen; its nested-tabs task was the
    // screen's main coding task, not an assessment question.
    reportRounds: {
      'js-build-tree-from-flat-list': ['technical-screen'],
    },
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
            note: 'Usually 45–60 minutes of React, JavaScript or TypeScript coding, sometimes with an algorithm problem.',
          },
          {
            id: 'team-loop',
            stage: 'Team loop',
            kinds: ['coding', 'people'],
            note: 'Usually four to seven interviews of 30–60 minutes, mostly JavaScript, React and CSS coding and concepts.',
          },
        ],
      },
    ],
  },
  binance: {
    variants: [
      {
        id: 'frontend',
        title: 'Frontend engineers, Taiwan and remote, 2020 to 2022',
        from: 'Taiwan and remote loops from 2020 to 2022',
        ask: 'Interviewing in Taiwan or remotely?',
        default: true,
        rounds: [
          {
            id: 'hr-contact',
            stage: 'HR contact',
            kinds: ['recruiter'],
            note: 'Taiwan and remote loops: an HR invitation on LinkedIn or a referral; in 2020, HR scheduled remote rounds.',
          },
          { id: 'technical-round-1', stage: 'Technical round 1', kinds: ['coding'] },
          {
            id: 'technical-round-2',
            stage: 'Technical round 2',
            kinds: ['coding'],
            note: 'Short implementations, the event loop, redux, token storage and an order book fed by a socket, in 2022.',
          },
          {
            id: 'technical-round-3',
            stage: 'Technical round 3',
            kinds: ['coding', 'people'],
            note: 'By account: the résumé and a design question; SSR, bundlers and performance; or Vue against React and a slow page.',
          },
          {
            id: 'team-or-fourth-technical-round',
            stage: 'Team or fourth technical round',
            kinds: ['coding', 'people'],
            note: 'A fourth round in two accounts, on topics such as caching and a CDN, fiber, a list component and English.',
          },
          { id: 'hr-and-offer', stage: 'HR and offer', kinds: ['outcome'] },
        ],
      },
      {
        id: 'juejin-and-senior',
        title: 'Juejin account, 2020, and a senior loop, 2024',
        from: 'a 2020 account on Juejin and a 2024 senior account',
        ask: 'Interviewing for a senior role?',
        rounds: [
          {
            id: 'first-technical-interview',
            stage: 'First technical interview',
            kinds: ['coding'],
            note: 'A compose and a deep copy to write, then closures, hooks and fiber, redux, design patterns and permissions.',
          },
          { id: 'second-technical-interview', stage: 'Second technical interview', kinds: ['coding', 'people'] },
          {
            id: 'senior-question-drill',
            stage: 'Senior question drill',
            kinds: ['coding'],
            note: 'One stream of questions on CSS, React, JavaScript, Webpack and algorithms, with no résumé questions.',
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
            note: 'One or two live rounds of about 60 minutes, building a UI component in plain JavaScript, HTML and CSS or React.',
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
          { id: 'online-assessment', stage: 'Online assessment', kinds: ['coding'] },
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          { id: 'technical-rounds', stage: 'Technical rounds', kinds: ['coding'] },
          { id: 'hiring-manager-round', stage: 'Hiring manager round', kinds: ['design', 'people'] },
          { id: 'product-manager-round', stage: 'Product manager round', kinds: ['people'] },
          { id: 'department-leader-round', stage: 'Department leader round', kinds: ['people', 'design'] },
          { id: 'hr-or-behavioural-round', stage: 'HR or behavioural round', kinds: ['people'] },
        ],
      },
      {
        id: 'singapore-australia',
        title: 'Frontend engineers, Singapore and Australia',
        from: 'candidates in Singapore and Australia',
        ask: 'Interviewing in Singapore or Australia?',
        rounds: [
          { id: 'online-assessment', stage: 'CodeSignal assessment', kinds: ['coding'] },
          { id: 'technical-rounds', stage: 'Technical rounds (Singapore and Australia)', kinds: ['coding', 'design'] },
          { id: 'hiring-manager-round', stage: 'Hiring manager or director round', kinds: ['people', 'coding'] },
          { id: 'hr-round', stage: 'HR round', kinds: ['people'] },
        ],
      },
      {
        id: 'new-grads',
        title: 'New graduates and interns',
        from: 'new graduates and interns',
        ask: 'Interviewing as a new graduate or intern?',
        students: true,
        rounds: [
          { id: 'online-assessment', stage: 'Early-careers online assessment', kinds: ['coding'] },
          { id: 'technical-interviews', stage: 'Technical interviews', kinds: ['coding', 'design'] },
          { id: 'manager-or-behavioural-round', stage: 'Manager or behavioural round', kinds: ['people', 'coding'] },
        ],
      },
    ],
  },
  'capital-one': {
    // The 2024 account behind the case task is cited on most Power Day stages; the task practises the case.
    reportRounds: {
      'js-debug-intern-budget-summary': ['power-day-case'],
    },
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
            // Problems for the CodeSignal test, which no reported task practises: a stack, a grid walk and a hash-map
            // window, the skills the reported matrix, array navigation and pair-counting problems call for.
            picks: CAPITAL_ONE_ASSESSMENT_PICKS,
          },
          {
            id: 'power-day-frontend-design',
            stage: 'Power Day: frontend design',
            kinds: ['design'],
          },
          {
            id: 'power-day-frontend-technical',
            stage: 'Power Day: frontend technical',
            kinds: ['coding'],
            note: 'About an hour of hands-on work in a frontend framework, graded on component structure, syntax and coding style.',
          },
          {
            id: 'power-day-case',
            stage: 'Power Day: case',
            kinds: ['coding'],
            note: 'A business scenario worked through existing code: reading it, tracing example numbers and explaining what to fix.',
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
          { id: 'online-assessment', stage: 'Online assessment', kinds: ['coding'], picks: CAPITAL_ONE_ASSESSMENT_PICKS },
          {
            id: 'power-day',
            stage: 'Power Day',
            kinds: ['coding', 'design', 'people'],
            note: 'Four interviews in one day: in 2024 frontend design, a behavioral round, a case study and a frontend technical round.',
          },
          { id: 'result', stage: 'Result', kinds: ['outcome'] },
        ],
      },
    ],
  },
  cloudflare: {
    // The four-task app item belongs to the app round; its newest source (PracHub, 2026-02) is also cited on the
    // JavaScript phone screen, which would otherwise bind the task there too.
    reportRounds: { 'react-webhook-deliveries-four-tasks': ['app-coding-and-debugging'] },
    variants: [
      {
        id: 'frontend',
        title: 'Frontend engineers, 2024 to 2026',
        from: 'frontend engineers',
        ask: 'Interviewing for a frontend role?',
        default: true,
        rounds: [
          {
            id: 'recruiter-conversation',
            stage: 'Recruiter conversation',
            kinds: ['recruiter'],
            note: 'A first conversation with a recruiter about your background, your interests and the role.',
          },
          {
            id: 'hiring-manager',
            stage: 'Hiring manager',
            kinds: ['people'],
            note: 'The first round in four of the five frontend accounts: a conversation about your background.',
          },
          {
            id: 'javascript-phone-screen',
            stage: 'JavaScript phone screen',
            kinds: ['coding'],
            note: 'A 45-minute technical phone screen in JavaScript with one interviewer, in a 2025 account.',
          },
          {
            id: 'app-coding-and-debugging',
            stage: 'App coding and debugging',
            kinds: ['coding'],
            note: 'One hour of coding in React and TypeScript in a 2025 account, with AI tools not allowed.',
          },
          { id: 'architecture-or-system-design', stage: 'Architecture or system design', kinds: ['design'] },
          {
            id: 'orange-cloud-interview',
            stage: 'Orange Cloud Interview',
            kinds: ['people'],
            note: "A 30-minute behavioural round based on Cloudflare's values, in a 2025 account.",
          },
          {
            id: 'pm-and-executive-conversations',
            stage: 'PM and executive conversations',
            kinds: ['people'],
            note: 'PM and cross-collaboration rounds and a final C-level executive conversation, in a 2026 account.',
          },
          { id: 'offer-or-result', stage: 'Offer or result', kinds: ['outcome'] },
        ],
      },
      {
        id: 'engineers',
        title: 'Engineers on other teams, 2024 to 2026',
        from: 'engineers on other teams',
        ask: 'Interviewing for another engineering team?',
        rounds: [
          {
            id: 'hiring-manager-screen',
            stage: 'Hiring manager screen',
            kinds: ['people'],
            note: 'The first round in most accounts: a conversation about your background and experience.',
          },
          { id: 'hr-screen', stage: 'HR screen', kinds: ['recruiter'] },
          {
            id: 'online-test',
            stage: 'Online test',
            kinds: ['coding'],
            note: 'A coding test on HackerRank, announced after the hiring manager round in one 2024 account.',
          },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: 'A coding round after the hiring manager round, live with an interviewer in most accounts.',
          },
          { id: 'interview-loop', stage: 'Interview loop', kinds: ['people', 'coding', 'design'] },
          {
            id: 'senior-leadership-round',
            stage: 'Senior leadership round',
            kinds: ['people'],
            note: 'One 2026 senior loop: a 45-minute virtual round with senior leadership, announced as mostly behavioural.',
          },
          { id: 'ai-assisted-coding', stage: 'AI-assisted coding', kinds: ['coding'] },
          {
            id: 'executive-call-and-office-visit',
            stage: 'Executive call and office visit',
            kinds: ['people'],
            note: 'A 2026 account was invited to a final call with a senior executive or co-founder; the careers page lists such calls.',
          },
          {
            id: 'team-fit-and-offer',
            stage: 'Team fit and offer',
            kinds: ['outcome'],
            note: 'Announced to a 2025 candidate: a hiring manager call on which team fits you, then an offer round.',
          },
        ],
      },
      {
        id: 'early-career',
        title: 'Interns and new graduates',
        from: 'interns and new graduates',
        ask: 'Interviewing for an internship or a graduate role?',
        students: true,
        rounds: [
          {
            id: 'application-and-assignment',
            stage: 'Application and assignment',
            kinds: ['coding'],
            note: 'Several intern and new-graduate accounts from 2020 to 2023 begin with a coding assignment.',
          },
          {
            id: 'intern-and-graduate-interviews',
            stage: 'Intern and graduate interviews',
            kinds: ['coding', 'people'],
            note: 'A screening interview with the hiring manager, a pair programming interview and an HR interview, in a 2023 account.',
          },
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
          // The format's first sentence is the note: the old note named the subjects of locked questions.
          { id: 'web-fundamentals-with-engineers', stage: 'Web fundamentals with engineers', kinds: ['coding'] },
          { id: 'take-home-build', stage: 'Take-home build', kinds: ['coding'], picks: ['/react/coding/react-files-table-select-all'] },
          // The format's first sentence is the note: the old note named the review's locked follow-up questions.
          { id: 'take-home-review', stage: 'Take-home review', kinds: ['coding', 'design'] },
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
          // The table links the fundamentals quiz here, a guide; the plan also needs a free task, and every free
          // CrowdStrike-tagged task but the take-home's table practises a locked row.
          { id: 'technical-questions-two-stages', stage: 'Technical questions, two stages', kinds: ['coding'], picks: ['/javascript/trivia/js-event-loop'] },
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
          {
            id: 'take-home-project',
            stage: 'Take-home project',
            kinds: ['coding'],
            note: 'A small frontend app built at home, with 4–6 suggested hours; one 2024 candidate chose it over React live coding.',
          },
          { id: 'second-coding-round', stage: 'Second coding round', kinds: ['coding'] },
          { id: 'frontend-system-design', stage: 'Frontend system design', kinds: ['design'] },
          { id: 'experience-and-values', stage: 'Experience and values', kinds: ['people'] },
          { id: 'team-match', stage: 'Team match', kinds: ['outcome'] },
        ],
      },
    ],
  },
  disney: {
    variants: [
      {
        id: 'frontend',
        title: 'Frontend and web engineers, 2020 to 2025',
        from: 'frontend and web engineers',
        ask: 'Interviewing for a frontend or web role?',
        default: true,
        rounds: [
          { id: 'recruiter-screen', stage: 'Recruiter screen', kinds: ['recruiter'] },
          { id: 'hiring-manager-or-tech-lead', stage: 'Hiring manager or tech lead', kinds: ['people'] },
          { id: 'technical-interview-or-take-home', stage: 'Technical interview or take-home', kinds: ['coding'] },
          { id: 'code-review', stage: 'Code review', kinds: ['coding'] },
          { id: 'frontend-system-design', stage: 'Frontend system design', kinds: ['design'] },
          { id: 'pm-director-and-behavioral', stage: 'PM, director and behavioral', kinds: ['people'] },
          { id: 'result', stage: 'Result', kinds: ['outcome'] },
        ],
      },
      {
        id: 'lead',
        title: 'Lead frontend engineer, Seattle, 2025',
        from: 'a lead frontend loop in Seattle',
        ask: 'Interviewing for a lead frontend role?',
        reported: { levels: ['senior', 'staff'], who: 'lead candidates' },
        rounds: [
          { id: 'senior-tpm-conversation', stage: 'Senior TPM conversation', kinds: ['people'] },
          { id: 'code-review-with-a-principal-engineer', stage: 'Code review with a principal engineer', kinds: ['coding'] },
          { id: 'frontend-design-at-the-whiteboard', stage: 'Frontend design at the whiteboard', kinds: ['design'] },
          { id: 'hiring-manager-follow-up', stage: 'Hiring manager follow-up', kinds: ['people'] },
        ],
      },
      {
        id: 'early-career',
        title: 'Interns, 2019 to 2022',
        from: 'interns',
        ask: 'Interviewing for an internship?',
        students: true,
        rounds: [
          { id: 'recruiter-and-technical-interviews', stage: 'Recruiter and technical interviews', kinds: ['recruiter', 'coding'] },
          { id: 'take-home-challenge', stage: 'Take-home challenge', kinds: ['coding'] },
        ],
      },
    ],
  },
  elevenlabs: {
    // The 2026 Aced account behind the async-race task is cited on the assessment too, but the task practises its live
    // round, where the candidate fixed a practical problem with the interviewer; the guide links it there as well.
    // Each account below is cited on both coding stages, so without an entry its task would land on both; the entry
    // keeps the round the account put it in.
    reportRounds: {
      'js-debug-async-race': ['live-technical-round'],
      'react-debug-transcript-sync': ['live-technical-round'],
      'react-voice-service-wiring': ['live-technical-round'],
      'react-chat-streaming-ui': ['live-technical-round'],
      'js-dubbing-review-status': ['live-technical-round'],
      'react-debug-api-misuse': ['coding-assessment'],
      'react-autocomplete-search-starter': ['coding-assessment'],
    },
    variants: [
      {
        id: 'main',
        title: 'Full-stack and software engineers',
        reported: { levels: ['mid', 'senior'], who: 'senior, full-stack and frontend-leaning candidates' },
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'coding-assessment',
            stage: 'Coding assessment',
            kinds: ['coding'],
            note: 'Usually a timed test of about 90 minutes, sometimes on CoderPad: React or JS tasks beside LeetCode-style problems.',
            picks: ['/javascript/coding/js-stream-to-text'],
          },
          {
            id: 'live-technical-round',
            stage: 'Live technical round',
            kinds: ['coding'],
            picks: ['/react/coding/react-debug-transcript-sync', '/javascript/debug/js-debug-stale-closure-autosave'],
          },
          {
            id: 'product-or-design-round',
            stage: 'Product or design round',
            kinds: ['design'],
            picks: ['/system-design/live-chart-high-frequency-updates'],
          },
          {
            id: 'final-conversation',
            stage: 'Final conversation',
            kinds: ['people'],
            note: 'A call with the CTO, a co-founder or the head of the organisation; the careers FAQ names a founder or Bar Raiser.',
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
            note: '45–75 minutes with an engineer: spoken JavaScript and React questions and an algorithm problem.',
          },
          {
            id: 'craft-demonstration',
            stage: 'Craft demonstration',
            kinds: ['coding'],
            note: 'Build a small app against a brief, then demo it to a panel, walk through the code and change it on request.',
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
        title: 'Front-end and React engineers, team-run loops, 2017 to 2026',
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
            note: 'About an hour of spoken questions on JavaScript, React and browser fundamentals and on your CV.',
          },
          {
            id: 'live-coding',
            stage: 'Live coding',
            kinds: ['coding'],
            note: '30 to 90 minutes with an interviewer: a small React build, or simple paper coding with a tech lead.',
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
          { id: 'recruiter-call', stage: 'Internship recruiter call', kinds: ['recruiter'] },
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
        // The accounts run their rounds in different orders (machine coding first in 2020 and 2021, system design or
        // algorithms first in 2024, and one senior loop calls its order random), so the table groups the rows by type.
        unordered: true,
        rounds: [
          { id: 'recruiter-or-hr-call', stage: 'Recruiter or HR call', kinds: ['recruiter'] },
          {
            id: 'machine-coding',
            stage: 'Machine coding',
            kinds: ['coding'],
            note: 'A UI build: plain JavaScript in the 2020–2021 prompts that name a stack, mostly React in 2024–2025 accounts.',
          },
          { id: 'javascript-and-react-concepts', stage: 'JavaScript and React concepts', kinds: ['coding'] },
          { id: 'algorithms-and-problem-solving', stage: 'Algorithms and problem solving', kinds: ['coding'] },
          { id: 'design', stage: 'Design', kinds: ['design'] },
          {
            id: 'behavioural-and-hiring-manager',
            stage: 'Behavioural and hiring manager',
            // Technical in the 2020 and 2021 loops: output, performance and browser questions and coding problems.
            kinds: ['people', 'coding'],
          },
          // A senior leader's round that can be a conversation or a data-structure problem.
          { id: 'as-appropriate', stage: 'As Appropriate round', kinds: ['people', 'coding'] },
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
  notion: {
    variants: [
      {
        id: 'frontend',
        title: 'Front End track and frontend-leaning loops, experienced, 2022 to 2026',
        from: 'the Front End guide and frontend and software loops from 2022 to 2026',
        ask: 'Interviewing for the Front End track or a software role?',
        default: true,
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: '60 minutes of live React coding on CodeSignal: a practical build in parts, with AI tools restricted.',
          },
          {
            id: 'ai-enabled-coding',
            stage: 'Onsite: AI-enabled coding',
            kinds: ['coding'],
            note: 'A small TypeScript codebase that may have failing tests, slow code or messy code, with AI tools encouraged.',
          },
          { id: 'code-review', stage: 'Onsite: code review', kinds: ['coding'], note: 'Listed in the 2026 Front End guide; no candidate describes it.' },
          {
            id: 'software-design',
            stage: 'Onsite: software design',
            kinds: ['design'],
            note: 'An open-ended design on a diagramming tool; a calendar UI and data modelling are reported.',
          },
          {
            id: 'career-history',
            stage: 'Onsite: career history',
            kinds: ['people'],
            note: 'An hour with an engineering leader on your past teams, successes, challenges and transitions, and why Notion.',
          },
          {
            id: 'second-coding-round',
            stage: 'Before 2026: a second coding round',
            kinds: ['coding'],
            note: 'Onsites from 2022 to 2025 had a second coding round, an algorithm or backend one, beside frontend coding.',
          },
          {
            id: 'hiring-manager-call',
            stage: 'Hiring manager or executive call, and team match',
            kinds: ['people', 'outcome'],
            note: 'A talk about past projects; 2026 staff posts say it probed team conflicts. Then a team search.',
          },
          {
            id: 'final-interview',
            stage: 'Final interview',
            kinds: ['people'],
            note: 'With a leader; two 2026 accounts name the CEO: your experience, values and motivations.',
          },
          {
            id: 'references',
            stage: 'References and background check',
            kinds: ['outcome'],
            note: 'Reference checks, sometimes before the level and offer are discussed, and a background check.',
          },
        ],
      },
      {
        id: 'early-career',
        title: 'Interns and new grads, 2024 to 2026',
        from: 'the intern and new-grad guides and loops from 2024 to 2026',
        ask: 'Interviewing as an intern or new grad?',
        students: true,
        rounds: [
          { id: 'initial-call', stage: 'Initial call', kinds: ['recruiter'] },
          {
            id: 'online-assessment',
            stage: 'Online assessment',
            kinds: ['coding'],
            note: 'An online assessment before the take-home, in some 2025 and 2026 intern loops.',
          },
          { id: 'take-home', stage: 'Take-home', kinds: ['coding'] },
          {
            id: 'debugging',
            stage: 'Onsite: debugging',
            kinds: ['coding'],
            note: 'A 10-minute review of your take-home, then 40 minutes of debugging a codebase.',
          },
          {
            id: 'practical-coding',
            stage: 'Onsite: practical coding',
            kinds: ['coding'],
            note: 'A practical coding interview that accounts call not LeetCode-style, such as a class for storing documents.',
          },
          { id: 'final-conversation', stage: 'Final conversation', kinds: ['people'] },
          { id: 'values-capstone', stage: 'New grads: values capstone and references', kinds: ['people'] },
          { id: 'background-check', stage: 'Background check', kinds: ['outcome'] },
        ],
      },
      {
        id: 'india',
        title: 'India, 2023 to 2025',
        from: 'three loops in India from 2023 to 2025',
        ask: 'Interviewing in India?',
        rounds: [
          { id: 'assignment', stage: 'Assignment', kinds: ['coding'] },
          {
            id: 'technical-rounds',
            stage: 'Technical rounds',
            kinds: ['coding'],
            note: 'React and JavaScript questions, text-editor functions, or code quality and pair programming, by account.',
          },
          { id: 'hr-round', stage: 'HR round', kinds: ['recruiter'] },
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
        // No notes: the first sentence of each format is short and names no reported question.
        rounds: [
          { id: 'screening-call', stage: 'Screening call', kinds: ['recruiter'] },
          { id: 'javascript-fundamentals', stage: 'JavaScript fundamentals', kinds: ['coding'] },
          { id: 'second-technical-round', stage: 'Second technical round', kinds: ['coding', 'design'] },
          { id: 'design-or-machine-coding', stage: 'Design or machine coding', kinds: ['coding'] },
          {
            id: 'hiring-manager',
            stage: 'Hiring manager',
            // Spoken JavaScript questions and a design task, so a polyfill drill does not land here.
            kinds: ['people', 'design'],
          },
        ],
      },
    ],
  },
  shopee: {
    // No reportVariants: SH5 (GoodJob, Taipei 2021), the only report behind css-inline-centering and js-shallow-clone,
    // is now cited on the Taipei stages, so those tasks land on the Taipei list by their source.
    variants: [
      {
        id: 'ho-chi-minh',
        title: 'Front-end engineers, Ho Chi Minh City, 2025',
        // The table rests on one account, so the plan says so beside the company's whole source count.
        from: 'one account of a Ho Chi Minh City loop',
        ask: 'Interviewing in Ho Chi Minh City?',
        default: true,
        rounds: [
          {
            id: 'hr-call',
            stage: 'HR call',
            kinds: ['recruiter'],
            // The first round the form offers names the loop, since the form shows no list title.
            note: 'Ho Chi Minh City loop, from one account: personal details, expected salary and whether you would move to Saigon.',
          },
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
            note: 'A design discussion that starts from your current work, then networking and security fundamentals.',
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
            note: 'A 70-minute test in the 2022 account: multiple-choice on systems and networking plus two coding problems.',
          },
          {
            id: 'technical-video-rounds',
            stage: 'Technical rounds on a shared editor',
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
        title: 'Campus and social hires, mainland China, in Chinese, 2019 to 2022',
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
            note: 'JavaScript, CSS, HTTP and framework basics plus one to three short coding tasks.',
          },
          {
            id: 'second-technical-interview',
            stage: 'Second technical interview',
            kinds: ['coding'],
            note: 'Deeper framework, tooling and performance questions, scenarios, project depth and often a second coding task.',
          },
          {
            id: 'hr-interview-and-offer',
            stage: 'HR interview and offer',
            kinds: ['recruiter'],
            note: 'The posting lists an HR conversation before the offer.',
          },
        ],
      },
      {
        id: 'taipei',
        title: 'Front-end and software engineers, Taipei, 2021 to 2023',
        from: 'candidates in Taipei',
        ask: 'Interviewing in Taipei?',
        rounds: [
          { id: 'hr-phone-screen', stage: 'HR phone screen', kinds: ['recruiter'] },
          { id: 'onsite-written-test', stage: 'Onsite written test', kinds: ['coding'] },
          {
            id: 'team-interviews',
            stage: 'Team interviews',
            kinds: ['coding', 'people'],
            note: 'Panels with a product manager and a tech lead on practical work, or a manager round and a peer round.',
          },
          { id: 'senior-manager-conversation', stage: 'Senior-manager conversation', kinds: ['people'] },
        ],
      },
    ],
  },
  spotify: {
    variants: [
      {
        id: 'main',
        title: 'Web and full-stack engineers',
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: '60 to 90 minutes with one or two engineers: JavaScript and CSS questions and a coding task.',
          },
          {
            id: 'final-web-practical',
            stage: 'Final: web practical',
            kinds: ['coding'],
            // The accounts' web hour has no framework, so the extra build renders into the DOM by hand.
            picks: ['/javascript/coding/js-dom-renderer'],
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
    // The bug squash rehearsal's accounts list every onsite round, and it rehearses one of them.
    reportRounds: {
      'js-group-by': ['technical-screen'],
      'js-lodash-get': ['technical-screen'],
      'js-debug-bug-squash-invoices': ['onsite-bug-squash'],
    },
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
    // The 2022 and 2021 accounts are cited on both the assessment and the screen. Their tasks were assessment items
    // (the 2022 one lists five for a two-hour, five-question Codility test; the 2021 like button was in a three-hour
    // assessment), so the screen gets its own rehearsal instead.
    reportRounds: {
      'css-positioning-badge': ['online-assessment'],
      'html-forms-validation-required': ['online-assessment'],
      'html-semantic-layout': ['online-assessment'],
      'js-color-contrast-ratio': ['online-assessment'],
      'react-fetch-list-states': ['online-assessment'],
      'react-like-button': ['online-assessment'],
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
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            picks: ['/react/coding/react-autocomplete-search-starter', '/javascript/coding/js-valid-parentheses'],
          },
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
        reported: { levels: ['mid', 'senior'], who: 'L4 to L5A candidates' },
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
          // The table's first sentence says the format; the old note named the design task of a locked question.
          { id: 'system-design', stage: 'System design', kinds: ['design'] },
          { id: 'collaboration-and-leadership', stage: 'Collaboration and leadership', kinds: ['people'] },
        ],
      },
    ],
  },
  verkada: {
    variants: [
      {
        id: 'frontend',
        title: 'Frontend engineers, mid level to senior, United States, 2023 to 2026',
        from: 'frontend loops from 2023 to 2026, in the United States where a place is given',
        ask: 'Interviewing for a frontend role in the United States?',
        default: true,
        reported: { levels: ['mid', 'senior'], who: 'mid-level and senior frontend engineers' },
        rounds: [
          { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
          {
            id: 'hiring-manager-screen',
            stage: 'Hiring-manager screen',
            kinds: ['people'],
            note: 'Officially, behavioural and role-specific questions with the hiring manager; in 2023 it was the technical screen.',
          },
          {
            id: 'technical-screen',
            stage: 'Technical screen',
            kinds: ['coding'],
            note: 'Live coding on video; most screens reported in 2025 that name a task asked for a video player built from still frames.',
          },
          {
            id: 'onsite',
            stage: 'Onsite at the San Mateo office',
            kinds: ['coding', 'design', 'people'],
            note: 'Several technical interviews and a manager interview: selection in a grid, broken JavaScript, a camera grid design.',
          },
          { id: 'offer-and-checks', stage: 'Offer and checks', kinds: ['outcome'] },
        ],
      },
      {
        id: 'canada',
        title: 'Software roles with a frontend round, Canada, 2024 to 2025',
        from: 'two software loops in Canada in 2024 and 2025',
        ask: 'Interviewing for a software role in Canada?',
        rounds: [
          { id: 'screening', stage: 'Recruiter call or screening', kinds: ['recruiter'] },
          { id: 'frontend-technical-interview', stage: 'Frontend technical interview', kinds: ['coding'] },
          { id: 'second-technical-interview', stage: 'Second technical interview', kinds: ['coding'] },
          { id: 'behavioural-interview', stage: 'Behavioural interview', kinds: ['people'] },
        ],
      },
      {
        id: 'take-home-2019',
        title: 'A frontend loop with a take-home, United States, 2019',
        from: 'a 2019 frontend loop with a take-home',
        ask: 'Interviewing through a staffing agency?',
        rounds: [
          { id: 'agency-and-recruiter-call', stage: 'Agency and recruiter call', kinds: ['recruiter'] },
          { id: 'take-home', stage: 'Take-home', kinds: ['coding'] },
        ],
      },
    ],
  },
  walmart: {
    reportVariants: {
      'js-add-two-promises': ['swe3'],
      'js-curry-function': ['sde3-ui'],
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
          {
            id: 'javascript-react-and-web-fundamentals',
            stage: 'JavaScript, React and web fundamentals',
            kinds: ['coding'],
            note: '60 minutes of JavaScript problem solving plus questions on React, CSS, HTML and how the web works.',
          },
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
          {
            id: 'technical-rounds',
            stage: 'Technical rounds',
            kinds: ['coding'],
            note: 'Two technical rounds of about an hour: data structures or a medium LeetCode problem, then React questions.',
          },
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
          {
            id: 'react-coding-interview',
            stage: 'React coding interview',
            kinds: ['coding'],
            note: 'A small React app in TypeScript on Google Meet: 45 minutes in London, one or two interviews on Bay Area teams.',
          },
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
            note: 'A four-hour take-home with AI coding assistants allowed, then a one-hour in-person coding round on existing code.',
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
            note: '45 to 60 minutes on the official pages; a Blind commenter describes it as non-technical.',
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
