/**
 * Interview stages that official pages and public interview reports describe, rendered as a table on the
 * company preview. Companies without an entry render nothing.
 *
 * Every stage cites at least one source that was read in full. Never cite Glassdoor, 1point3acres or
 * templated question sites, and never link take-home briefs. Reports describe one candidate's loop, so
 * stage text says what the reports describe instead of what the company always does.
 */
export type InterviewProcessSource = {
  readonly label: string;
  readonly url: string;
  /** Official pages keep the default rel; interview reports get rel="nofollow". */
  readonly kind: 'official' | 'report';
  /** YYYY-MM: the interview month an account gives, else its publication month; for official pages, the month read. */
  readonly date: string;
};

export type InterviewProcessPractice = {
  readonly label: string;
  readonly path: string;
};

export type InterviewProcessStage = {
  readonly stage: string;
  readonly format: string;
  readonly appliesTo: string;
  readonly sources: readonly InterviewProcessSource[];
  readonly practice?: InterviewProcessPractice;
};

export type InterviewProcessVariant = {
  readonly title: string;
  readonly note?: string;
  readonly stages: readonly InterviewProcessStage[];
};

export type CompanyInterviewProcess = {
  /** Overrides the default "<Company> frontend interview process" heading. */
  readonly title?: string;
  readonly summary: string;
  readonly caveat: string;
  /** YYYY-MM-DD, the day the sources were last read. */
  readonly checkedAt: string;
  readonly variants: readonly InterviewProcessVariant[];
};

const AMAZON_FEE_PREP: InterviewProcessSource = {
  label: 'Amazon FEE prep page',
  url: 'https://amazon.jobs/content/en/how-we-hire/fee-interview-prep',
  kind: 'official',
  date: '2026-10',
};
const AMAZON_STUDENT_PREP: InterviewProcessSource = {
  label: 'Amazon student prep page',
  url: 'https://amazon.jobs/content/en/how-we-hire/university/front-end-engineer',
  kind: 'official',
  date: '2026-10',
};
const report = (label: string, url: string, date: string): InterviewProcessSource => ({ label, url, kind: 'report', date });
const amazonReport = (id: number, date: string) => report('LeetCode', `https://leetcode.com/discuss/post/${id}/`, date);
const AMAZON_PHONE_2020 = amazonReport(546992, '2020-03');
const AMAZON_SEATTLE_2020 = amazonReport(591141, '2020-04');
const AMAZON_OFFER_2020 = amazonReport(694045, '2020-06');
const AMAZON_PHONE_NO_LP_2020 = amazonReport(678045, '2020-06');
const AMAZON_ONSITE_2021 = amazonReport(1503301, '2021-10');
const AMAZON_VANCOUVER_2022 = amazonReport(1984996, '2022-04');
const AMAZON_SEATTLE_2024 = amazonReport(5934170, '2024-10');
const AMAZON_BLIND_2022 = report(
  'Blind',
  'https://www.teamblind.com/post/amazon-frontend-fee-i-oa-phone-screen-loop-interview-2022-qqdjoknw',
  '2023-01',
);
const AMAZON_ROLE = 'All FEE candidates';

// No official Walmart page is cited, so every Walmart stage comes from public accounts. Blind "comment"
// sources are answers from Walmart-badged commenters, not the poster's own loop.
const WALMART_W10_SDE3_UI = report('Hashnode', 'https://jaynil-gaglani.hashnode.dev/frontend-interview-experience-at-walmart', '2024-01');
const WALMART_W11_SDE3_UI = report(
  'Medium',
  'https://medium.com/@phalgun99/my-interview-experience-at-walmart-global-tech-for-the-software-engineer-3-ui-position-9751c81988ee',
  '2024-11',
);
const WALMART_W35_SDE3 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5331800/SDE3-at-walmart/', '2024-06');
const WALMART_W34_OA_INDIA = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5988869/', '2024-10');
const WALMART_W2_SDE2_BENGALURU = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/walmart/experiences/software-development-engineer-ii-frontend-bengaluru-november-1-2024-no-offer-neutral-3a8dbb51/',
  '2024-11',
);
const WALMART_W33_SDE2 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/6156237/Walmart-SDE-2-or-Front-end/', '2024-12');
const WALMART_W7_SWE_US = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/walmart/experiences/software-engineer-united-states-july-1-2022-declined-offer-positive-32d8d783/',
  '2022-07',
);
const WALMART_W21_KARAT = report('Blind comment', 'https://www.teamblind.com/post/karat-interview-for-walmart-m8ayatus', '2024-09');
const WALMART_W23_SENIOR_FE = report('Blind', 'https://www.teamblind.com/post/walmart-senior-frontend-engineer-m5munrjx', '2024-06');
const WALMART_W6_SENIOR = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/walmart/experiences/senior-software-engineer-sunnyvale-ca-april-1-2025-no-offer-negative-6350f1a2/',
  '2025-04',
);
const WALMART_W19_SENIOR_FE = report('Blind', 'https://www.teamblind.com/post/upcoming-walmart-sr-software-engineer-frontend-interview-gkvn233z', '2024-01');
const WALMART_W20_SWE3_FE = report('Blind', 'https://www.teamblind.com/post/walmart-global-tech-software-engineer-lll-front-end-k8ewxjrm', '2023-04');
const WALMART_W24_SENIOR = report('Blind comment', 'https://www.teamblind.com/post/walmart-senior-software-engineer-interview-experience-j3hexss7', '2024-07');
const WALMART_W25_SWE3 = report('Blind comment', 'https://www.teamblind.com/post/Have-an-interview-with-walmart-SWE3-2-4-YOEneed-advice-0JOeTkW6', '2023-10');
const WALMART_W31_FE_2026 = report('LeetCode', 'https://leetcode.com/discuss/post/8288813/walmart-interview-for-frontend-role-by-a-s7fk/', '2026-05');

// Taro shows its own dates (often the 1st of a month) and its locations are not reliable, so Tesla labels
// carry no city. Blind posts written before an interview are cited only for what the recruiter said.
const TESLA_TARO = 'https://www.jointaro.com/interviews/companies/tesla/experiences';
const TESLA_T1_FE_2025 = report('Taro', `${TESLA_TARO}/frontend-developer-october-15-2025-no-offer-positive-3c909dee/`, '2025-10');
const TESLA_T2_FE_2021 = report('Taro', `${TESLA_TARO}/frontend-developer-san-francisco-ca-january-1-2021-no-offer-positive-8db5ee50/`, '2021-01');
const TESLA_T3_FE_2025 = report('Taro', `${TESLA_TARO}/front-end-developer-united-states-november-17-2025-no-offer-positive-868af7da/`, '2025-11');
const TESLA_T4_FE_2024 = report('Taro', `${TESLA_TARO}/front-end-developer-fremont-ca-january-1-2024-no-offer-neutral-9e5d4e3f/`, '2024-01');
const TESLA_T5_FE_2022 = report('Taro', `${TESLA_TARO}/front-end-developer-los-angeles-ca-january-1-2022-no-offer-negative-eadce28f/`, '2022-01');
const TESLA_T6_FE_2020 = report('Taro', `${TESLA_TARO}/front-end-developer-fremont-ca-december-1-2020-no-offer-positive-5152922f/`, '2020-12');
const TESLA_T7_INTERN_2025 = report(
  'Taro',
  `${TESLA_TARO}/software-engineerinternship-fremont-ca-march-5-2025-accepted-offer-positive-461baf2a/`,
  '2025-03',
);
const TESLA_T8_INTERN_2025 = report(
  'Taro',
  `${TESLA_TARO}/software-engineerinternship-fremont-ca-january-7-2025-accepted-offer-neutral-2d53a629/`,
  '2025-01',
);
const TESLA_T9_INTERN_2024 = report(
  'Taro',
  `${TESLA_TARO}/software-engineerinternship-palo-alto-ca-november-30-2024-accepted-offer-positive-5f2e19b5/`,
  '2024-11',
);
const TESLA_B1_ONSITE_PLAN = report('Blind', 'https://www.teamblind.com/post/tesla-frontend-onsite-bvg7rws6', '2020-06');
const TESLA_B2_TAKE_HOME = report('Blind', 'https://www.teamblind.com/post/Tesla-Frontend-Interview-SbEAx1rM', '2022-04');
const TESLA_B3_CODILITY = report('Blind', 'https://www.teamblind.com/post/Tesla-front-end-software-engineer-interview-PfuGrTKB', '2023-02');
const TESLA_B4_CODILITY = report('Blind', 'https://www.teamblind.com/post/tesla-codility-assessment-for-frontend-software-engineer-pvjhqzke', '2023-01');
const TESLA_B7_INTERN = report('Blind', 'https://www.teamblind.com/post/tesla-frontendmobile-swe-intern-interview-tips-pz6gagjy', '2025-02');
const TESLA_B8_TEAM_MATCH = report('Blind', 'https://www.teamblind.com/post/onsite-experience-8-companies-in-the-past-6-months-0-offers-1niasf5x', '2026-05');
const TESLA_ROLE = 'Frontend roles';

export const COMPANY_INTERVIEW_PROCESSES: Readonly<Record<string, CompanyInterviewProcess>> = {
  amazon: {
    title: 'Amazon Front End Engineer interview process',
    summary:
      'Amazon\'s Front End Engineer preparation page describes three stages: an online assessment, a 60-minute phone screen and a loop of four 55-minute interviews. Public accounts from 2020 to 2024 describe loops of four or five interviews.',
    caveat:
      'Each account describes one loop. Some added a bar raiser or a hiring-manager round, one 2020 phone screen had no behavioural questions, and one 2024 loop asked backend rather than frontend design. Confirm the format with your recruiter.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Front End Engineer, experienced hires',
        stages: [
          {
            stage: 'Online assessment',
            format:
              '90 minutes for two coding questions in JavaScript, then 20 minutes of system design scenarios and an 8-minute multiple-choice work style survey. The code must compile for every question to move forward.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_OFFER_2020, AMAZON_BLIND_2022],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'Phone screen',
            format:
              '60 minutes with a leader on the team: half Leadership Principles questions, half front-end coding. Accounts vary: one 2020 screen had no behavioural questions, and a 2022 screen used two LeetCode problems.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_PHONE_2020, AMAZON_PHONE_NO_LP_2020, AMAZON_BLIND_2022],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'Loop: coding interviews',
            format:
              'The page asks you to prepare for three interviews on logical and maintainable code, problem solving, and data structures and algorithms, written as syntactically correct code rather than pseudo code. Accounts describe live interface widgets and medium algorithm problems.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_SEATTLE_2020, AMAZON_VANCOUVER_2022, AMAZON_SEATTLE_2024],
            practice: { label: 'Implement the new operator', path: '/javascript/coding/js-implement-new' },
          },
          {
            stage: 'Loop: front-end system design',
            format:
              'At least one front-end system design question. You define the contract between the front end and the back end but are not expected to design the back-end API. One 2024 account was asked mostly backend design instead.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_OFFER_2020, AMAZON_ONSITE_2021, AMAZON_VANCOUVER_2022, AMAZON_BLIND_2022, AMAZON_SEATTLE_2024],
            practice: { label: 'Resilient checkout and payment flow', path: '/system-design/resilient-checkout-payment-flow' },
          },
          {
            stage: 'Loop: Leadership Principles',
            format:
              'Each interviewer typically asks two or three behavioural questions. Accounts also describe a bar raiser interview and a round with the hiring manager.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_OFFER_2020, AMAZON_ONSITE_2021, AMAZON_VANCOUVER_2022, AMAZON_BLIND_2022],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
      {
        title: 'Students and new graduates',
        note: 'Amazon\'s student page does not mention an assessment, a phone screen or system design for this track.',
        stages: [
          {
            stage: 'Internship interviews',
            format: 'One round of two interviews, each about 45 to 60 minutes, mixing technical and behavioural questions.',
            appliesTo: 'Interns',
            sources: [AMAZON_STUDENT_PREP],
          },
          {
            stage: 'New graduate first round',
            format: 'One interview with an Amazonian, about 45 to 60 minutes.',
            appliesTo: 'Full-time new graduates',
            sources: [AMAZON_STUDENT_PREP],
          },
          {
            stage: 'New graduate final stage',
            format: 'Three to four interviews of 45 to 60 minutes each, coded in LiveCode.',
            appliesTo: 'Full-time new graduates',
            sources: [AMAZON_STUDENT_PREP],
          },
        ],
      },
    ],
  },
  tesla: {
    summary:
      'Public accounts from 2020 to 2026 describe an online assessment, often on Codility, a one-hour technical screen, and a final loop of three or four rounds: frontend coding in React or Angular, data structures and algorithms, frontend system design, and a hiring-manager or behavioural round.',
    caveat:
      'Accounts say the format depends on the team, and several Blind posts were written before the interview, so they describe what a recruiter planned rather than a finished loop. Confirm the format with your recruiter.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend developer and engineer roles',
        stages: [
          {
            stage: 'Recruiter or HR call',
            format: 'A recruiter or HR call came first in two accounts; in another, a brief introductory call followed the online assessment.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T4_FE_2024, TESLA_T1_FE_2025, TESLA_T5_FE_2022],
          },
          {
            stage: 'Online assessment',
            format:
              'Often on Codility. One account lists 2 hours for 5 questions, another a three-hour assessment with a React like button question, and a third basic front-end framework tasks.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T5_FE_2022, TESLA_B4_CODILITY, TESLA_B3_CODILITY, TESLA_T2_FE_2021, TESLA_T6_FE_2020],
            practice: { label: 'Color Contrast Ratio', path: '/javascript/coding/js-color-contrast-ratio' },
          },
          {
            stage: 'Technical screen',
            format:
              'A one-hour phone or video interview. Accounts mention React questions about a take-home assessment plus a LeetCode easy problem, and a live React session with basic JavaScript questions and a search bar.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T5_FE_2022, TESLA_T2_FE_2021, TESLA_B2_TAKE_HOME, TESLA_T1_FE_2025],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Final loop: frontend coding',
            format:
              'One or two frontend coding rounds in React, or an Angular round followed by a TypeScript and JavaScript round in one account. One recruiter said two of three coding rounds would be frontend-focused.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T6_FE_2020, TESLA_T4_FE_2024, TESLA_B1_ONSITE_PLAN, TESLA_T3_FE_2025],
            practice: { label: 'Forms: validation and required fields', path: '/html/coding/html-forms-validation-required' },
          },
          {
            stage: 'Final loop: data structures and algorithms',
            format: 'One algorithm round, such as a LeetCode-style card game built on a deque.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T6_FE_2020, TESLA_B1_ONSITE_PLAN, TESLA_T3_FE_2025],
            practice: { label: 'Shallow Clone', path: '/javascript/coding/js-shallow-clone' },
          },
          {
            stage: 'Final loop: frontend system design',
            format:
              'A design round on a shared component, its API and the technologies to build it in one account, and on a car rental company in another.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T6_FE_2020, TESLA_T4_FE_2024],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Final loop: hiring manager and behavioural',
            format: 'A behavioural round; one recruiter\'s plan listed a 60-minute hiring-manager interview and a 30-minute product manager interview.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T6_FE_2020, TESLA_B1_ONSITE_PLAN],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Team match',
            format: 'One 2026 account passed four technical rounds but got no offer because the team wanted a full-stack engineer.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_B8_TEAM_MATCH],
          },
        ],
      },
      {
        title: 'Internships',
        note: 'One intern account says the format was very team dependent.',
        stages: [
          {
            stage: 'Recruiter call',
            format: 'A phone call with a recruiter, in one account.',
            appliesTo: 'Interns',
            sources: [TESLA_T9_INTERN_2024],
          },
          {
            stage: 'Technical rounds',
            format:
              'One or two rounds: a React app with an API-backed autocomplete and a debounce discussion, then a medium binary search problem; React, CSS and JavaScript fundamentals with UI component design; or a 45-minute interview, half behavioural and half technical.',
            appliesTo: 'Interns',
            sources: [TESLA_T7_INTERN_2025, TESLA_T8_INTERN_2025, TESLA_B7_INTERN, TESLA_T9_INTERN_2024],
            practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
          },
          {
            stage: 'System design final',
            format: 'A final-round system design interview, in one account.',
            appliesTo: 'Interns',
            sources: [TESLA_T9_INTERN_2024],
          },
        ],
      },
    ],
  },
  walmart: {
    summary:
      'Public accounts from 2022 to 2026 describe different loops by role. SDE 3 (UI) accounts describe three 60-minute rounds, SDE-2 and frontend engineer accounts from India start with an online assessment, and Software Engineer III and senior accounts add one or two system design rounds.',
    caveat:
      'Each account describes one candidate, and several Blind posts record what a recruiter said before the interview rather than a finished loop. Teams and levels differ, so confirm the format with your recruiter.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Software Development Engineer 3 (UI), Walmart Global Tech',
        note: 'None of these accounts mentions an online assessment or a system design round. One candidate was turned down for having two years of experience against the three or more the role required.',
        stages: [
          {
            stage: 'DSA round',
            format: '60 minutes on two or three easy-to-medium problems.',
            appliesTo: 'SDE 3 (UI)',
            sources: [WALMART_W10_SDE3_UI, WALMART_W11_SDE3_UI, WALMART_W35_SDE3],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'JavaScript, React and web fundamentals',
            format: '60 minutes of JavaScript problem solving plus questions on React, CSS, HTML and how the web works.',
            appliesTo: 'SDE 3 (UI)',
            sources: [WALMART_W10_SDE3_UI, WALMART_W11_SDE3_UI, WALMART_W35_SDE3],
            practice: { label: 'React SSR and hydration', path: '/react/trivia/react-ssr-hydration' },
          },
          {
            stage: 'Hiring manager',
            format: 'A 60-minute hiring-manager round, focused on past projects and experience in one account.',
            appliesTo: 'SDE 3 (UI)',
            sources: [WALMART_W10_SDE3_UI, WALMART_W11_SDE3_UI, WALMART_W35_SDE3],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'HR call',
            format: 'A 30-minute HR call about two weeks after the hiring-manager round, in one account.',
            appliesTo: 'SDE 3 (UI)',
            sources: [WALMART_W11_SDE3_UI],
          },
        ],
      },
      {
        title: 'SDE-2 and frontend engineer roles in India',
        note: 'Two of these accounts may describe the same candidate: both report the same assessment, two technical rounds and a final round on OOP and DBMS.',
        stages: [
          {
            stage: 'Online assessment',
            format:
              'One 2024 assessment had 20 multiple-choice questions on HTML, CSS and JavaScript, two easy coding questions in JavaScript only, and 10 multiple-choice questions on React or Angular.',
            appliesTo: 'SDE-2 and frontend engineer roles',
            sources: [WALMART_W34_OA_INDIA, WALMART_W2_SDE2_BENGALURU, WALMART_W33_SDE2],
            practice: { label: 'Shallow Clone', path: '/javascript/coding/js-shallow-clone' },
          },
          {
            stage: 'Technical rounds',
            format: 'Two technical rounds: a medium LeetCode problem in any language, then a round focused on React.',
            appliesTo: 'SDE-2',
            sources: [WALMART_W33_SDE2, WALMART_W2_SDE2_BENGALURU],
            practice: { label: 'Redux vs Context vs useState', path: '/react/trivia/react-state-management-redux' },
          },
          {
            stage: 'Final round',
            format:
              'Questions on OOP, DBMS and past experience, with Java and React in one account. One account calls it the hiring-manager round, the other an HR round.',
            appliesTo: 'SDE-2',
            sources: [WALMART_W33_SDE2, WALMART_W2_SDE2_BENGALURU],
          },
        ],
      },
      {
        title: 'Software Engineer III, senior and frontend engineer roles',
        note: 'Several of these posts record what a recruiter said before the interview. Rounds lasted 30 to 60 minutes.',
        stages: [
          {
            stage: 'Online assessment (2026 account)',
            format:
              'A HackerRank Frontend Engineering Assessment with a language-agnostic coding problem and a React or Angular debugging task, with AI assistance for UI navigation, syntax and clarification. The recruiter had first mentioned DSA and low-level design.',
            appliesTo: 'Frontend engineer, level not stated',
            sources: [WALMART_W31_FE_2026],
          },
          {
            stage: 'Coding screen',
            format:
              'A Karat screen with about ten minutes of short answers and then coding, a one-hour HackerRank interview, two React code challenges on HackerRank, or a 45-minute JavaScript coding round.',
            appliesTo: 'Software engineer to senior',
            sources: [WALMART_W7_SWE_US, WALMART_W21_KARAT, WALMART_W23_SENIOR_FE, WALMART_W6_SENIOR, WALMART_W19_SENIOR_FE],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Coding rounds',
            format: 'One or two coding rounds. Accounts mention React coding, a debugging session, two medium DSA problems and a UI and JavaScript technical round.',
            appliesTo: 'SWE III and senior',
            sources: [WALMART_W20_SWE3_FE, WALMART_W19_SENIOR_FE, WALMART_W24_SENIOR, WALMART_W25_SWE3],
            practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
          },
          {
            stage: 'System design',
            format:
              'One or two design rounds: high-level system design, or design questions about past projects. In one senior loop, a final round planned as behavioural became system design.',
            appliesTo: 'SWE III and senior',
            sources: [WALMART_W20_SWE3_FE, WALMART_W19_SENIOR_FE, WALMART_W24_SENIOR, WALMART_W25_SWE3, WALMART_W7_SWE_US, WALMART_W6_SENIOR],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Behavioural and hiring manager',
            format: 'A behavioural, team-fit or managerial round. One 2022 account added a conversation with a director.',
            appliesTo: 'SWE III and senior',
            sources: [WALMART_W20_SWE3_FE, WALMART_W19_SENIOR_FE, WALMART_W24_SENIOR, WALMART_W25_SWE3, WALMART_W7_SWE_US],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
  },
};
