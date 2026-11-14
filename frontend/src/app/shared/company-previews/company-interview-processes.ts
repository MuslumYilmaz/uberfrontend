/**
 * Interview stages that official pages and public interview reports describe, rendered as a table on the
 * company preview. Companies without an entry render nothing.
 *
 * Every stage cites at least one source that was read in full. Never cite Glassdoor, 1point3acres or
 * templated question sites, and never link take-home briefs. Reports describe one candidate's loop, so
 * stage text says what the reports describe instead of what the company always does.
 */
export type InterviewOutcome = 'accepted offer' | 'declined offer' | 'no offer' | 'in progress';

export type InterviewProcessSource = {
  readonly label: string;
  readonly url: string;
  /** Official pages keep the default rel; interview reports get rel="nofollow". */
  readonly kind: 'official' | 'report';
  /** YYYY-MM: the interview month an account gives, else its publication month; for official pages, the month read. */
  readonly date: string;
  /** The role an account gives, as "Senior full-stack engineer (frontend-leaning)". Taro URLs supply it when absent. */
  readonly role?: string;
  /** The country an account gives. Taro URLs supply it when absent. */
  readonly location?: string;
  /** How the account's loop ended, when it says. Taro URLs supply it when absent. */
  readonly outcome?: InterviewOutcome;
  /**
   * A question bank many candidates add to, rather than one candidate's account of a loop. Its date is the month it
   * was read, so it adds nothing to a question's freshness. A press report ('press') is not an account either: it names
   * no reporter and never stands as a round's newest account.
   */
  readonly reportForm?: 'question-bank' | 'press';
};

/** The kind of a reported question. A locked row shows it beside the round, so it never names the task itself. */
export type ReportedQuestionKind =
  | 'React build'
  | 'React debugging'
  | 'React concepts'
  | 'Angular concepts'
  | 'Vue concepts'
  | 'UI debugging'
  | 'React and algorithms'
  | 'UI build'
  | 'JavaScript'
  | 'Web fundamentals'
  | 'Algorithm'
  | 'Practical coding'
  | 'Product design'
  | 'Frontend system design';

/** A question or task that public sources report, one row of a guide's question list. */
export type ReportedQuestion = {
  /** Unique within the company and never reused: a reader's free unlock is stored against it. */
  readonly id: string;
  /**
   * The stage it was asked in, by its `stage` name in this process. A question from another role's loop counts under
   * the stage whose format matches what its account describes. Absent when no source names the round.
   */
  readonly round?: string;
  readonly kind: ReportedQuestionKind;
  /**
   * What the question is about, in one to six words ("Debounced autocomplete search", "Closures"). A locked row shows it:
   * a reader sees what the lock holds, while the wording, constraints, follow-ups and answer guide stay Premium.
   */
  readonly topic: string;
  /** The question in our words, from what its sources describe. A locked row hides it. */
  readonly question: string;
  /** The sources name the task's subject but not its prompt, and the row says so. */
  readonly promptNotShared?: true;
  /** Every source that describes this same task. Two accounts share a row only when they describe the same task. */
  readonly sources: readonly InterviewProcessSource[];
  /** A catalog task that practises it. */
  readonly practice?: { readonly label: string; readonly path: string };
  /** The id of the guide's practice prompt whose answer outline covers it. */
  readonly answerGuide?: string;
};

/** A behavioural question the sources report. These stay open: a lock on "Why this company?" would only be bait. */
export type ReportedBehaviouralQuestion = {
  /** Unique within the company, across both lists. */
  readonly id: string;
  readonly question: string;
  /** Every source that asks this same question, in any wording. */
  readonly sources: readonly InterviewProcessSource[];
};

export type InterviewProcessPractice = {
  readonly label: string;
  readonly path: string;
  /** A section of the page at `path`, for a round the company's own guide answers, such as a behavioural round. */
  readonly fragment?: string;
  /** The section holds a behavioural drill: something to practise, so a plan offers it beside the tasks that run. */
  readonly drill?: true;
};

/**
 * The timed rehearsal of a stage, from cdn/questions/rehearsals/rehearsals.v1.json: its title and shape, as "Meta
 * coding round, 2 problems in 40 minutes", and the page that offers it, its first free problem when it has one, so a
 * visitor lands on the rehearsal's card rather than a lock page. The spec keeps both in step with the list.
 */
export type InterviewProcessRehearsal = {
  readonly label: string;
  readonly path: string;
};

export type InterviewProcessStage = {
  readonly stage: string;
  readonly format: string;
  readonly appliesTo: string;
  readonly sources: readonly InterviewProcessSource[];
  readonly practice?: InterviewProcessPractice;
  readonly rehearsal?: InterviewProcessRehearsal;
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
  /**
   * The questions the sources report, kept by content: frontend and general questions stay whatever the role, while
   * backend, network and security questions stay out. The first is open to every reader. A row needs the task or its
   * subject; a round an account only names ("a technical interview") stays in the stage table.
   */
  readonly questions?: readonly ReportedQuestion[];
  /** The behavioural questions the sources report, shown open as a small group beside the question list. */
  readonly behaviouralQuestions?: readonly ReportedBehaviouralQuestion[];
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
// Amazon accounts with who and when, 2026-11-13. LeetCode bodies were saved in the research sessions of 2026-10-15
// and 2026-11-06 (LeetCode is not re-readable now); the Blind FEE I post was re-read on 2026-11-13. Roles, places and
// outcomes are what each post gives. Three posts report an offer or a selection without saying it was accepted, so they
// carry no outcome.
const AMAZON_PHONE_2020: InterviewProcessSource = { ...amazonReport(546992, '2020-03'), role: 'Front End Engineer II' };
const AMAZON_SEATTLE_2020: InterviewProcessSource = {
  ...amazonReport(591141, '2020-04'),
  role: 'Front End Engineer II',
  location: 'United States',
};
const AMAZON_OFFER_2020: InterviewProcessSource = { ...amazonReport(694045, '2020-06'), role: 'Front End Engineer II' };
const AMAZON_PHONE_NO_LP_2020: InterviewProcessSource = {
  ...amazonReport(678045, '2020-06'),
  role: 'Front End Engineer I or II',
  outcome: 'no offer',
};
const AMAZON_ONSITE_2021: InterviewProcessSource = { ...amazonReport(1503301, '2021-10'), role: 'Front end engineer', outcome: 'no offer' };
const AMAZON_VANCOUVER_2022: InterviewProcessSource = {
  ...amazonReport(1984996, '2022-04'),
  role: 'Front End Engineer II (L5)',
  location: 'Canada',
};
const AMAZON_SEATTLE_2024: InterviewProcessSource = {
  ...amazonReport(5934170, '2024-10'),
  role: 'Front End Engineer II (L5)',
  location: 'United States',
  outcome: 'no offer',
};
const AMAZON_INTERVIEW_LOOP: InterviewProcessSource = {
  label: 'Amazon interview loop page',
  url: 'https://www.amazon.jobs/content/en/how-we-hire/interview-loop',
  kind: 'official',
  date: '2026-11',
};
const AMAZON_HM_2019: InterviewProcessSource = {
  ...amazonReport(336727, '2019-07'),
  role: 'Front end engineer',
  location: 'United States',
  outcome: 'no offer',
};
const AMAZON_FEE_I_2025: InterviewProcessSource = { ...amazonReport(6968134, '2025-07'), role: 'Front End Engineer I', location: 'India' };
const AMAZON_BLIND_2022: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/amazon-frontend-fee-i-oa-phone-screen-loop-interview-2022-qqdjoknw', '2023-01'),
  role: 'Front End Engineer I',
};
const AMAZON_ROLE = 'All FEE candidates';
// Added 2026-11-13 for the question list and the behavioural questions. The URLs match amazon-preview-content.ts, so
// the sources list shows each account once.
const AMAZON_INDIA_2025: InterviewProcessSource = {
  ...amazonReport(6329840, '2025-01'),
  role: 'Front End Engineer I',
  location: 'India',
  outcome: 'no offer',
};
const AMAZON_NYC_2019: InterviewProcessSource = { ...amazonReport(320613, '2019-06'), role: 'Front end engineer', location: 'United States' };
const AMAZON_L5_NYC_2020: InterviewProcessSource = {
  ...amazonReport(618601, '2020-05'),
  role: 'Front End Engineer (L5)',
  location: 'United States',
};
const AMAZON_CUSTOMER_2021: InterviewProcessSource = { ...amazonReport(1639880, '2021-12'), role: 'Front end engineer', location: 'Canada' };
const AMAZON_GRAD_SCREEN_2025: InterviewProcessSource = {
  ...amazonReport(7075953, '2025-08'),
  role: 'Front End Engineer, new graduate',
  location: 'Ireland',
};
const AMAZON_MEDIUM_2021: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/javarevisited/how-was-my-frontend-engineer-interview-experience-amazon-d10055fbdd89', '2021-07'),
  role: 'Frontend engineer',
};
// The interview is dated May 28 with no year, so the date is the post's month.
const AMAZON_MEDIUM_2025: InterviewProcessSource = {
  ...report(
    'Medium',
    'https://javascript.plainenglish.io/my-interview-experience-amazon-for-frontend-developer-and-lessons-learned-a4c23221b9c6',
    '2025-08',
  ),
  role: 'Frontend developer',
  outcome: 'no offer',
};
// A list one candidate started in July 2020 for others to add to; its date is the month it was read.
const AMAZON_LIST_2020: InterviewProcessSource = {
  ...report('LeetCode community list', 'https://leetcode.com/discuss/post/742791/', '2026-10'),
  reportForm: 'question-bank',
};

// No official Walmart page is cited, so every Walmart stage comes from public accounts. Blind "comment"
// sources are answers from Walmart-badged commenters, not the poster's own loop.
// Roles, places and outcomes are what each account gives (Hashnode, Medium RSS, dev.to, Code360 and the Taro pages
// re-read 2026-11-13; the LeetCode posts from docs/references/walmart-nvidia-tesla-questions-2026-10.md). Neither SDE 3
// (UI) account names a country, so they carry none.
const WALMART_W10_SDE3_UI: InterviewProcessSource = {
  ...report('Hashnode', 'https://jaynil-gaglani.hashnode.dev/frontend-interview-experience-at-walmart', '2024-01'),
  role: 'Software development engineer 3 (UI)',
  outcome: 'no offer',
};
const WALMART_W11_SDE3_UI: InterviewProcessSource = {
  ...report(
    'Medium',
    'https://medium.com/@phalgun99/my-interview-experience-at-walmart-global-tech-for-the-software-engineer-3-ui-position-9751c81988ee',
    '2024-11',
  ),
  role: 'Software development engineer 3 (UI)',
  outcome: 'declined offer',
};
const WALMART_W35_SDE3: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5331800/SDE3-at-walmart/', '2024-06'),
  role: 'SDE 3',
};
const WALMART_W34_OA_INDIA: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5988869/', '2024-10'),
  location: 'India',
};
const WALMART_W2_SDE2_BENGALURU = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/walmart/experiences/software-development-engineer-ii-frontend-bengaluru-november-1-2024-no-offer-neutral-3a8dbb51/',
  '2024-11',
);
const WALMART_W33_SDE2: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/6156237/Walmart-SDE-2-or-Front-end/', '2024-12'),
  role: 'SDE 2 (frontend)',
  location: 'India',
  outcome: 'no offer',
};
const WALMART_W7_SWE_US = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/walmart/experiences/software-engineer-united-states-july-1-2022-declined-offer-positive-32d8d783/',
  '2022-07',
);
const WALMART_W21_KARAT = report('Blind comment', 'https://www.teamblind.com/post/karat-interview-for-walmart-m8ayatus', '2024-09');
const WALMART_W23_SENIOR_FE: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/walmart-senior-frontend-engineer-m5munrjx', '2024-06'),
  role: 'Senior frontend engineer',
  location: 'United States',
};
const WALMART_W6_SENIOR = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/walmart/experiences/senior-software-engineer-sunnyvale-ca-april-1-2025-no-offer-negative-6350f1a2/',
  '2025-04',
);
const WALMART_W19_SENIOR_FE: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/upcoming-walmart-sr-software-engineer-frontend-interview-gkvn233z', '2024-01'),
  role: 'Senior software engineer (frontend)',
  location: 'United States',
};
// The two W20 questions come from a commenter who interviewed for the same Sunnyvale position a year earlier.
const WALMART_W20_SWE3_FE: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/walmart-global-tech-software-engineer-lll-front-end-k8ewxjrm', '2023-04'),
  role: 'Software engineer III (front end)',
  location: 'United States',
};
const WALMART_W24_SENIOR = report('Blind comment', 'https://www.teamblind.com/post/walmart-senior-software-engineer-interview-experience-j3hexss7', '2024-07');
const WALMART_W25_SWE3 = report('Blind comment', 'https://www.teamblind.com/post/Have-an-interview-with-walmart-SWE3-2-4-YOEneed-advice-0JOeTkW6', '2023-10');
const WALMART_W31_FE_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/8288813/walmart-interview-for-frontend-role-by-a-s7fk/', '2026-05'),
  role: 'Frontend engineer',
};
const WALMART_W56_FULLSTACK_2026: InterviewProcessSource = {
  ...report('LeetCode thread', 'https://leetcode.com/discuss/post/8515332/', '2026-09'),
  role: 'Full-stack engineer',
};
// Added 2026-11-13 for the question list. W37 and W55 use the URL form of cdn/questions/company-reports.json, so the
// sources list shows each account once.
const WALMART_TARO = 'https://www.jointaro.com/interviews/companies/walmart/experiences';
const WALMART_W1_STAFF_FE = report('Taro (approx.)', `${WALMART_TARO}/staff-front-end-engineer-united-states-january-1-2024-no-offer-negative-d17f5e0d/`, '2024-01');
const WALMART_W3_FE_INDIA = report('Taro', `${WALMART_TARO}/front-end-developer-india-october-19-2020-no-offer-neutral-93bed894/`, '2020-10');
const WALMART_W5_SDE3_UI_2019 = report('Taro (approx.)', `${WALMART_TARO}/sde-iii-bengaluru-october-1-2019-no-offer-negative-22235130/`, '2019-10');
const WALMART_W8_SDE3: InterviewProcessSource = {
  ...report(
    'frontendgeek',
    'https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-walmart-india-in3in4-ghosted---5b172313-fbe2-4960-908d-7c446a166ec2',
    '2023-11',
  ),
  role: 'SDE 3',
  location: 'India',
};
const WALMART_W9_FE: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6036136/', '2024-11'),
  role: 'Frontend engineer',
  location: 'India',
};
const WALMART_W12_REACT_NATIVE: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@poonkuzhali_98336/walmart-global-tech-interview-experience-cdc3509408ea', '2024-11'),
  role: 'Software engineer (React Native)',
  outcome: 'accepted offer',
};
const WALMART_W13_SWE3: InterviewProcessSource = {
  ...report('dev.to', 'https://dev.to/kriti_pare/interview-experience-at-walmart-global-tech-for-swe-iii-position-k95', '2025-03'),
  role: 'Software engineer III',
};
const WALMART_W15_SDE2: InterviewProcessSource = {
  ...report('Code360', 'https://www.naukri.com/code360/interview-experiences/walmart/walmart-interview-experience-mar-2021-exp-0-2-years', '2021-03'),
  role: 'SDE 2',
  location: 'India',
};
const WALMART_W16_ENGINEER3: InterviewProcessSource = {
  ...report('GeeksforGeeks', 'https://www.geeksforgeeks.org/walmart-engineer-3-interview-experience/', '2018-09'),
  role: 'Engineer 3 (full-stack)',
  location: 'India',
};
const WALMART_W17_SDE3: InterviewProcessSource = {
  ...report('GeeksforGeeks', 'https://www.geeksforgeeks.org/interview-experiences/walmart-global-tech-interview-experience-for-sde3/', '2021-09'),
  role: 'SDE 3',
  location: 'India',
};
const WALMART_W26_CODEPAIR = report('Blind', 'https://www.teamblind.com/post/walmart-interview-with-hackerrank-codepairs-7mck8u4m', '2023-12');
const WALMART_W32_FE: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/2105625/', '2022-06'),
  role: 'Frontend engineer',
  outcome: 'declined offer',
};
const WALMART_W37_SDE3_CHENNAI: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1436043/', '2021-01'),
  role: 'SDE III (full-stack)',
  location: 'India',
};
const WALMART_W55_FE: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/2774667/', '2022-11'),
  role: 'Front-end developer',
};

// Taro shows its own dates (often the 1st of a month) and its locations are not reliable, so Tesla labels
// carry no city. Blind posts written before an interview are cited only for what the recruiter said.
// Re-read 2026-11-13: the Taro pages (T1 to T9; Taro answered 404 to some requests and loaded on retry) and the Blind
// posts. LeetCode L1 and Code360 C1 come from docs/references/walmart-nvidia-tesla-questions-2026-10.md, read in full
// on 2026-10-19: LeetCode is not re-read, and Code360 answered 403 on 2026-11-13. Roles and outcomes are what each
// account gives; T1's page names Amsterdam.
const TESLA_TARO = 'https://www.jointaro.com/interviews/companies/tesla/experiences';
const TESLA_T1_FE_2025: InterviewProcessSource = {
  ...report('Taro', `${TESLA_TARO}/frontend-developer-october-15-2025-no-offer-positive-3c909dee/`, '2025-10'),
  location: 'Netherlands',
};
const TESLA_T2_FE_2021 = report('Taro (approx.)', `${TESLA_TARO}/frontend-developer-san-francisco-ca-january-1-2021-no-offer-positive-8db5ee50/`, '2021-01');
const TESLA_T3_FE_2025 = report('Taro', `${TESLA_TARO}/front-end-developer-united-states-november-17-2025-no-offer-positive-868af7da/`, '2025-11');
const TESLA_T4_FE_2024 = report('Taro (approx.)', `${TESLA_TARO}/front-end-developer-fremont-ca-january-1-2024-no-offer-neutral-9e5d4e3f/`, '2024-01');
const TESLA_T5_FE_2022 = report('Taro (approx.)', `${TESLA_TARO}/front-end-developer-los-angeles-ca-january-1-2022-no-offer-negative-eadce28f/`, '2022-01');
const TESLA_T6_FE_2020 = report('Taro (approx.)', `${TESLA_TARO}/front-end-developer-fremont-ca-december-1-2020-no-offer-positive-5152922f/`, '2020-12');
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
const TESLA_B1_ONSITE_PLAN: InterviewProcessSource = {
  ...report('Blind (recruiter plan)', 'https://www.teamblind.com/post/tesla-frontend-onsite-bvg7rws6', '2020-06'),
  role: 'Frontend engineer',
  location: 'United States',
  outcome: 'in progress',
};
const TESLA_B2_TAKE_HOME: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Tesla-Frontend-Interview-SbEAx1rM', '2022-04'),
  role: 'Frontend engineer',
  outcome: 'in progress',
};
const TESLA_B3_CODILITY: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Tesla-front-end-software-engineer-interview-PfuGrTKB', '2023-02'),
  role: 'Front-end software engineer (Digital Experience)',
  outcome: 'in progress',
};
// The poster's own loop; the written question after the full loop comes from a commenter whose role is not stated.
const TESLA_B4_CODILITY: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/tesla-codility-assessment-for-frontend-software-engineer-pvjhqzke', '2023-01'),
  role: 'Frontend software engineer',
  outcome: 'in progress',
};
const TESLA_B7_INTERN: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/tesla-frontendmobile-swe-intern-interview-tips-pz6gagjy', '2025-02'),
  role: 'Frontend and mobile software engineer intern',
  outcome: 'in progress',
};
const TESLA_B8_TEAM_MATCH: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/onsite-experience-8-companies-in-the-past-6-months-0-offers-1niasf5x', '2026-05'),
  role: 'Frontend engineer',
  outcome: 'no offer',
};
const TESLA_ROLE = 'Frontend roles';
const TESLA_L1_FULLSTACK_2022: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/2715209/', '2022-10'),
  role: 'Full-stack software engineer, new grad (Autopilot)',
  location: 'United States',
  outcome: 'no offer',
};
const TESLA_C1_SDE1_2020: InterviewProcessSource = {
  ...report('Code360', 'https://www.naukri.com/code360/interview-experiences/tesla/interview-experience-nov-2020-exp-0-2-years-2-4465', '2020-11'),
  role: 'Software development engineer 1',
  location: 'United States',
};

// Google, Meta, Microsoft and Apple: research and sources in docs/references/company-interview-processes-2026-10.md.
const official = (label: string, url: string): InterviewProcessSource => ({ label, url, kind: 'official', date: '2026-10' });
const GOOGLE_HOW_WE_HIRE = official('Google: How we hire', 'https://www.google.com/about/careers/applications/how-we-hire/');
// Google accounts with who and when, 2026-11-13. Blind posts and the stylus07 Medium feed were re-read on 2026-11-13;
// LeetCode bodies come from the research sessions of 2026-10-15 and 2026-11-06 (LeetCode is not re-readable now).
// Roles and places are what each post gives; "80LPA" in the April 2026 Medium title is not a stated country.
const GOOGLE_GO1: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Google-L5-interview-experience-uyV7evLt', '2022-06'),
  role: 'L5 candidate, frontend domain',
};
const GOOGLE_GO2 = report('Blind comment', 'https://www.teamblind.com/post/is-there-a-separate-frontend-interview-process-at-google-e6sbbcao', '2022-07');
const GOOGLE_GO3: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@stylus07/google-software-engineer-interview-experience-d31c16c1e309', '2022-07'),
  role: 'Software engineer applicant (also applied as UX Engineer)',
  outcome: 'no offer',
};
const GOOGLE_GO4 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/google/experiences/frontend-engineer-mountain-view-ca-july-1-2023-accepted-offer-positive-e47fc62d/',
  '2023-07',
);
const GOOGLE_GO5 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/google/experiences/front-end-developer-germany-june-23-2024-no-offer-positive-f76226db/',
  '2024-06',
);
const GOOGLE_GO6: InterviewProcessSource = {
  ...report('Medium', 'https://shubhamjangle.medium.com/google-swe-iii-interview-the-round-by-round-breakdown-nobody-wrote-fd2c10fe52ff', '2026-04'),
  role: 'SWE III (L4), frontend or software engineer track',
};
// The question bank cites this post at its current address; one spelling keeps the task on the rounds that cite it.
const GOOGLE_GO7: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1274542/', '2021-06'),
  role: 'L3/L4 frontend engineer',
  location: 'India',
  outcome: 'in progress',
};
const GOOGLE_GO8: InterviewProcessSource = {
  ...report('Blind comment', 'https://www.teamblind.com/post/Google-Frontend-interview-78mvqUW2', '2021-06'),
  role: 'L5 candidate, frontend loop',
};
const GOOGLE_PHONE_2020: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/592667/', '2020-04'),
  role: 'Software engineer, front end',
  location: 'United States',
};
// Read in the browser on 2026-11-06: a Sunnyvale front end onsite of five rounds, three of them JavaScript (combining
// callback results, a delayed-run API, a sequential queue), one app design and one algorithm; no phone screen.
const GOOGLE_ONSITE_2019: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/342364/', '2019-07'),
  role: 'Front end engineer',
  location: 'United States',
  outcome: 'no offer',
};
// The Googleyness interview. Google's current pages no longer use the word; its interview tips describe the same
// behavioural and hypothetical questions, and the archived 2020 interview page names it as one of four areas.
// LeetCode posts were read through the GraphQL endpoint (post bodies, not comments).
const GOOGLE_INTERVIEW_TIPS: InterviewProcessSource = {
  label: 'Google: Interview tips',
  url: 'https://www.google.com/about/careers/applications/interview-tips/',
  kind: 'official',
  date: '2026-11',
};
const GOOGLE_REWORK_STRUCTURED: InterviewProcessSource = {
  label: 'Google re:Work: structured interviewing',
  url: 'https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices',
  kind: 'official',
  date: '2026-11',
};
const GOOGLE_INTERVIEW_2020: InterviewProcessSource = {
  label: 'Google interview page (2020 archive)',
  url: 'https://web.archive.org/web/20200504185427/https://careers.google.com/how-we-hire/interview/',
  kind: 'official',
  date: '2020-05',
};
const GOOGLE_GL_NEW_GRAD_2024: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6022505/', '2024-10'),
  role: 'New graduate software engineer',
  location: 'India',
};
const GOOGLE_GL_ML_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7093123/google-gl-googleyness-round-swe-iii-ml-b-0fe9/', '2025-08'),
  role: 'SWE III (machine learning)',
  location: 'India',
};
const GOOGLE_GL_L4_US_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7571793/', '2026-02'),
  role: 'L4 software engineer',
  location: 'United States',
};
const GOOGLE_GL_L3_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/8543506/', '2026-09'),
  role: 'L3 software engineer',
  location: 'India',
};
const GOOGLE_GL_L4_2024: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/5584385/', '2024-08'),
  role: 'L4 software engineer',
};
const GOOGLE_GL_L4_BLR_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/8319665/', '2026-06'),
  role: 'L4 software engineer',
  location: 'India',
};
// The press report behind the 2026 pilot. The guide's time-sensitive note linked it until the sources moved to the end
// of the page; citing it here keeps the link in that list.
const GOOGLE_PILOT_PRESS_2026: InterviewProcessSource = {
  ...report('Business Insider', 'https://www.businessinsider.com/google-job-interview-software-engineers-ai-assistant-coding-2026-5', '2026-05'),
  reportForm: 'press',
};
// Added 2026-11-13 for the question list.
// A September 2021 reply in the GO8 thread: a technical call that asked "a DOM manipulation related question".
const GOOGLE_GO8_DOM_2021 = report('Blind comment', 'https://www.teamblind.com/post/Google-Frontend-interview-78mvqUW2', '2021-09');
// Known from the research record only (docs/references/company-interview-processes-2026-10.md): three algorithm
// rounds, an async and closure front-end round and a behavioural round.
const GOOGLE_L3L4_2019: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/421954/', '2019-11'),
  role: 'L3/L4 candidate',
};
// An Amazon-badged poster's list of Google frontend questions, "a few questions from my experience and few that I could
// find across the internet", without saying which is which; its date is the month it was read.
const GOOGLE_FE_THREAD: InterviewProcessSource = {
  ...report('Blind question thread', 'https://www.teamblind.com/post/google-frontend-interview-questions-thread-yqyqmvon', '2026-11'),
  reportForm: 'question-bank',
};

const META_HIRING = official('Meta: Hiring process', 'https://www.metacareers.com/hiring-process/');
const META_FEE_INITIAL = official('Meta: FEE initial interview prep', 'https://www.metacareers.com/FEE-prep-initial/');
const META_FEE_ONSITE = official('Meta: FEE full loop prep', 'https://www.metacareers.com/FEE-prep-onsite/');
const META_TARO = 'https://www.jointaro.com/interviews/companies/meta/experiences';
const META_ME1 = report('Taro (approx.)', `${META_TARO}/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/`, '2021-12');
const META_ME2 = report('Taro (approx.)', `${META_TARO}/front-end-engineer-intern-united-states-january-1-2022-accepted-offer-positive-2e0f20e4/`, '2022-01');
const META_ME2B = report('Taro', `${META_TARO}/front-end-engineer-intern-united-states-december-5-2021-accepted-offer-positive-825fe97b/`, '2021-12');
const META_ME3: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@stylus07/meta-interview-experience-cdf53eea63f3', '2022-03'),
  role: 'Front end engineer',
  outcome: 'no offer',
};
// The poster's own L5 loop, from the post and the poster's replies of March 2022.
const META_ME4: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/meta-frontend-system-design-yexyrusi', '2022-03'),
  role: 'Front end engineer (L5)',
  outcome: 'no offer',
};
// A post on several companies; only its Facebook part is used. It reports "E5 offer" without saying it was accepted.
const META_ME5: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Frontend-interview-experience-CPR8odiD', '2021-10'),
  role: 'Frontend engineer (E4 loop, E5 offer)',
};
// One candidate's list from front end interviews at several companies: its Facebook part and the poster's reply on the
// design round. No outcome is set: the poster names Facebook among their loops without saying an offer was accepted.
const META_ME6: InterviewProcessSource = {
  ...report('Blind (question list)', 'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob', '2021-10'),
  role: 'Frontend engineer',
};
const META_ME7 = report('Taro (approx.)', `${META_TARO}/front-end-developer-new-york-ny-november-1-2020-no-offer-positive-b0918a8e/`, '2020-11');
// The June 2023 post was written before the screen; the poster's replies of September and December 2023 report it.
const META_ME8: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/meta-front-end-phone-interview-beroc46d', '2023-09'),
  role: 'Front end engineer',
  outcome: 'no offer',
};
const META_ME9 = report('Taro', `${META_TARO}/front-end-developer-san-francisco-ca-march-6-2024-no-offer-positive-609eb715/`, '2024-03');
const META_ME10 = report('Taro (approx.)', `${META_TARO}/frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20/`, '2025-04');
const META_ME11 = report('Taro (approx.)', `${META_TARO}/frontend-engineer-menlo-park-ca-june-1-2025-accepted-offer-positive-143f4163/`, '2025-06');
// Read 2026-11-09 for the behavioural decoder: the account names no round, only the question.
const META_ME12 = report('Taro', `${META_TARO}/frontend-engineer-menlo-park-ca-november-25-2024-accepted-offer-positive-f6a8939b/`, '2024-11');
const META_ROLE = 'FEE, IC4 to IC6';
// Read 2026-11-13: two coding questions, the first a class of matrix operations; the account does not name the round.
const META_ME13 = report('Taro (approx.)', `${META_TARO}/frontend-engineer-united-states-october-1-2021-no-offer-neutral-ad9accfa/`, '2021-10');
// Read 2026-11-13: a recruiter quiz of 10 questions on the DOM, JavaScript and CSS, then a phone screen of two questions.
const META_ME14 = report('Taro (approx.)', `${META_TARO}/front-end-developer-palo-alto-ca-february-1-2021-no-offer-positive-7a364772/`, '2021-02');
// The guide's stack and queue answer guide is modelled on it; it backs one question and no stage.
const META_ME15 = report('Taro', `${META_TARO}/front-end-developer-san-francisco-ca-june-27-2024-no-offer-positive-07526bae/`, '2024-06');

const MICROSOFT_HIRING_TIPS = official('Microsoft: Hiring tips', 'https://careers.microsoft.com/v2/global/en/hiring-tips');
const MICROSOFT_STUDENTS = official('Microsoft: Student interviewing', 'https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing');
const MICROSOFT_TARO = 'https://www.jointaro.com/interviews/companies/microsoft/experiences';
// Microsoft accounts with who and when, 2026-11-13. The dev.to post, the five Taro pages and both official pages were
// re-read that day; the LeetCode bodies come from the research sessions of 2026-10-15 and 2026-10-20 (LeetCode is not
// re-readable now). Roles, places and outcomes are what each post gives: LC 489795 reports an offer without saying it
// was accepted, and LC 1254448 and 7347058 give no outcome.
const MICROSOFT_MS1: InterviewProcessSource = {
  ...report('dev.to', 'https://dev.to/dhilipkmr/software-engineer-2-ui-interview-at-microsoft-1i0b', '2020-10'),
  role: 'Software Engineer II (UI)',
  location: 'India',
  outcome: 'accepted offer',
};
const MICROSOFT_MS2: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/1254448/', '2021-06'),
  role: 'Software Engineer (FEE)',
  location: 'India',
};
const MICROSOFT_MS3: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/489795/', '2020-01'),
  role: 'Front End Engineer',
  location: 'India',
};
const MICROSOFT_MS4 = report('Taro (approx.)', `${MICROSOFT_TARO}/front-end-developer-tel-aviv-yafo-october-1-2022-no-offer-negative-7d7887be/`, '2022-10');
const MICROSOFT_MS5 = report('Taro', `${MICROSOFT_TARO}/senior-frontend-engineer-new-york-ny-january-27-2022-no-offer-negative-54d03a33/`, '2022-01');
const MICROSOFT_MS6: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/5335067/', '2024-06'),
  role: 'Senior Software Engineer (more front end)',
  location: 'United States',
  outcome: 'in progress',
};
const MICROSOFT_MS7: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5456468/', '2024-07'),
  role: 'SDE 2 (frontend)',
  outcome: 'declined offer',
};
const MICROSOFT_MS8 = report('Taro (approx.)', `${MICROSOFT_TARO}/frontend-developer-belgrade-central-serbia-may-1-2024-no-offer-negative-380c5ce5/`, '2024-05');
const MICROSOFT_MS9: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/7347058/', '2025-11'),
  role: 'Software Engineer II (frontend)',
};
const MICROSOFT_ROLE = 'Frontend roles; varies by team';
const MICROSOFT_MS10 = report('Taro (approx.)', `${MICROSOFT_TARO}/frontend-developer-bengaluru-april-1-2020-no-offer-negative-4d89aa0e/`, '2020-04');

const APPLE_TARO = 'https://www.jointaro.com/interviews/companies/apple/experiences';
// Apple accounts with who and when, 2026-11-13. The Taro pages and the Medium post (through its RSS feed) were re-read on
// 2026-11-13. The three LeetCode bodies and the two Blind threads were read in full in the research session of 2026-10-22
// (LeetCode is not re-readable now). Roles, places and outcomes are what each account gives; the IC3 account's role was
// filled by someone else, so it carries "no offer".
const APPLE_AP1: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6979238/', '2025-06'),
  role: 'Frontend engineer (IC3)',
  outcome: 'no offer',
};
// Posted in July 2022 about an interview "a few months back"; the date is the post's month.
const APPLE_AP2: InterviewProcessSource = {
  ...report('Medium', 'https://srijansinghgulati.medium.com/my-apple-interview-experience-and-why-i-declined-the-offer-5ff442962bd8', '2022-07'),
  role: 'Senior frontend developer',
  location: 'India',
  outcome: 'declined offer',
};
const APPLE_AP3 = report('Taro (approx.)', `${APPLE_TARO}/front-end-developer-cupertino-ca-july-1-2022-no-offer-negative-9299c7ea/`, '2022-07');
// A plan before a remote onsite for a senior role on an apple.com team, with the poster's replies after the screen and the onsite.
const APPLE_AP4: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Apple-frontend-interview-advice-d64Fd3BM', '2022-02'),
  role: 'Senior frontend engineer',
};
const APPLE_AP5 = report('Taro', `${APPLE_TARO}/front-end-developer-united-states-august-25-2022-no-offer-positive-ceece13a/`, '2022-08');
const APPLE_AP6 = report('Taro (approx.)', `${APPLE_TARO}/frontend-engineer-san-francisco-ca-october-1-2023-accepted-offer-positive-e5223424/`, '2023-10');
const APPLE_AP7 = report('Taro (approx.)', `${APPLE_TARO}/frontend-developer-united-states-february-1-2025-no-offer-neutral-01c585c0/`, '2025-02');
// Posted while the candidate waited for the result.
const APPLE_AP8: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/my-apple-interview-was-absolutely-brutal-tjrprfjx', '2025-03'),
  role: 'Senior frontend engineer',
  location: 'United States',
};
const APPLE_AP9 = report('Taro (approx.)', `${APPLE_TARO}/front-end-engineer-united-states-august-1-2021-no-offer-negative-2d79a1e7/`, '2021-08');
const APPLE_ICT3_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6579616/', '2025-03'),
  role: 'Full-stack engineer (ICT3)',
  location: 'United States',
  outcome: 'accepted offer',
};
const APPLE_FULLSTACK_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/8354843/', '2026-06'),
  role: 'Full-stack software engineer',
};
// The hiring manager's topics, the 2024 technical rounds and a director round on culture fit (re-read 2026-11-13).
const APPLE_AP10 = report('Taro (approx.)', `${APPLE_TARO}/senior-frontend-developer-hyderabad-july-1-2024-no-offer-neutral-ac6e61a6/`, '2024-07');
const APPLE_ROLE = 'Frontend roles; varies by team';
// Added 2026-11-13: the 2019 account behind the catalog's js-unique-array report, and Apple frontend, UI and web
// engineering accounts from the 2026-11-09 sweep of Taro, re-read live. Taro places the reporter does not map (Malmö,
// Austin, San Diego, Sweden) and a role that ends in a team name carry an authored role and country. The Malmö and
// Austin accounts are contract interviews.
const APPLE_HYDERABAD_2019 = report('Taro', `${APPLE_TARO}/front-end-developer-hyderabad-december-24-2019-no-offer-positive-7397b890/`, '2019-12');
const APPLE_TICTACTOE_2020 = report('Taro (approx.)', `${APPLE_TARO}/frontend-software-engineer-cupertino-ca-january-1-2020-no-offer-negative-6964aa99/`, '2020-01');
const APPLE_UI_2020 = report('Taro', `${APPLE_TARO}/ui-engineer-united-states-august-23-2020-no-offer-positive-8856e038/`, '2020-08');
const APPLE_MEDIA_2020: InterviewProcessSource = {
  ...report('Taro', `${APPLE_TARO}/ui-engineer-media-products-new-york-ny-october-4-2020-no-offer-negative-7b5c6466/`, '2020-10'),
  role: 'UI engineer, Media Products',
};
const APPLE_OFFER_2021 = report('Taro (approx.)', `${APPLE_TARO}/front-end-engineer-united-states-march-1-2021-accepted-offer-positive-9a18f02d/`, '2021-03');
const APPLE_ARRAY_2021 = report('Taro', `${APPLE_TARO}/front-end-developer-united-states-november-19-2021-no-offer-positive-fe8281ab/`, '2021-11');
const APPLE_DENMARK_2022 = report('Taro (approx.)', `${APPLE_TARO}/frontend-developer-denmark-february-1-2022-no-offer-neutral-23c96133/`, '2022-02');
const APPLE_SWEDEN_2023: InterviewProcessSource = {
  ...report('Taro', `${APPLE_TARO}/ui-engineer-sweden-january-2-2023-no-offer-neutral-7c9b8fd9/`, '2023-01'),
  role: 'UI engineer',
  location: 'Sweden',
};
const APPLE_SEARCH_BAR_2023 = report('Taro', `${APPLE_TARO}/frontend-developer-united-states-october-23-2023-no-offer-neutral-77174967/`, '2023-10');
const APPLE_SAN_DIEGO_2024: InterviewProcessSource = {
  ...report('Taro (approx.)', `${APPLE_TARO}/software-engineer-web-applications-san-diego-ca-january-1-2024-no-offer-positive-710abeb9/`, '2024-01'),
  role: 'Software engineer, web applications',
  location: 'United States',
};
const APPLE_CUPERTINO_2025 = report('Taro (approx.)', `${APPLE_TARO}/front-end-developer-cupertino-ca-june-1-2025-no-offer-positive-861d8fce/`, '2025-06');
// Through a consultancy: a panel there, a remote technical interview, then two interviews at Apple's site in Malmö.
const APPLE_MALMO_2026: InterviewProcessSource = {
  ...report('Taro', `${APPLE_TARO}/senior-frontend-engineer-malmo-scania-february-2-2026-no-offer-negative-0eaa92df/`, '2026-02'),
  role: 'Senior frontend engineer (contract)',
  location: 'Sweden',
};
const APPLE_FE_2026 = report('Taro', `${APPLE_TARO}/frontend-engineer-march-28-2026-no-offer-neutral-0ca03753/`, '2026-03');
const APPLE_AUSTIN_2026: InterviewProcessSource = {
  ...report('Taro', `${APPLE_TARO}/senior-frontend-engineer-react-austin-texas-august-12-2026-no-offer-positive-c90210be/`, '2026-08'),
  role: 'Senior frontend engineer (React), contract',
  location: 'United States',
};

// Uber, Stripe, ByteDance/TikTok and Booking.com.
const UBER_GUIDE = official('Uber: Frontend engineering interview guide', 'https://jobs.uber.com/en/uber-interview-guide/frontend-engineering-interview-guide/');
const UBER_STORY = official(
  'Uber: Landing the job as a front end engineer',
  'https://jobs.uber.com/en/people-stories/interview-prep/landing-the-job-at-uber-front-end-engineer/',
);
// Uber accounts with who and when, 2026-11-13. The Taro pages and the 2024 Medium post (through its RSS feed) were
// re-read on 2026-11-13. The LeetCode bodies and the 2022 Medium post come from the research sessions of 2026-10-15,
// 2026-10-20 and 2026-11-02 (LeetCode is not re-readable now); the 2025 L4 post was saved up to the end of its
// screening round, and the 2025 L5A Bangalore post survives as two saved excerpts of its rounds. Roles, places and
// outcomes are what each account gives. The 2022 Medium account reports an offer without saying it was accepted, so it
// carries no outcome. UB3 and the 2018 Taro page give the first of a month, so they read as approximate.
const UBER_UB1: InterviewProcessSource = { ...report('LeetCode', 'https://leetcode.com/discuss/post/2409192/', '2022-08'), role: 'Senior front end engineer' };
const UBER_UB_CODESIGNAL_2021: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1064199/', '2021-02'),
  role: 'Front end candidate',
  outcome: 'no offer',
};
const UBER_UB_ROUNDS_2025: InterviewProcessSource = { ...report('LeetCode', 'https://leetcode.com/discuss/post/6840169/', '2025-06'), role: 'SDE II (frontend)' };
const UBER_UB2: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@iamjaasi/uber-sde-2-frontend-interview-experience-40c1a7437cc0', '2022-11'),
  role: 'Software engineer II (frontend)',
};
const UBER_UB3 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/uber/experiences/frontend-engineer-ii-bengaluru-april-1-2022-no-offer-positive-f0d40cc2/',
  '2022-04',
);
const UBER_UB4: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6820731/', '2025-06'),
  role: 'SDE 2 (frontend)',
  location: 'India',
  outcome: 'no offer',
};
const UBER_UB5: InterviewProcessSource = { ...report('LeetCode', 'https://leetcode.com/discuss/post/7322609/', '2025-11'), role: 'Front end software engineer II' };
const UBER_UB6: InterviewProcessSource = { ...report('LeetCode', 'https://leetcode.com/discuss/post/7822801/', '2026-04'), role: 'Frontend engineer (L5A)' };
const UBER_UB8 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/uber/experiences/frontend-developer-brazil-november-5-2025-no-offer-negative-0b9b9ae1/',
  '2025-10',
);
const UBER_ROLE = 'Frontend engineers, L3 to L5A';
// New, 2026-11-13: two frontend posts from 2025, two full-stack loops kept for their frontend and algorithm questions,
// and a 2018 Taro account of a frontend SDE-2 interview in Bengaluru.
const UBER_L5A_BANGALORE_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7228490/', '2025-09'),
  role: 'Frontend engineer (L5A)',
  location: 'India',
};
const UBER_L4_POLL_2025: InterviewProcessSource = { ...report('LeetCode', 'https://leetcode.com/discuss/post/7279221/', '2025-10'), role: 'Frontend engineer (L4)' };
const UBER_FULLSTACK_2024: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@mohitkr.mnnit/uber-sde-2-fullstack-interview-experience-834c8ddd3698', '2024-11'),
  role: 'SDE 2 (full-stack)',
};
const UBER_FULLSTACK_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7506720/', '2026-01'),
  role: 'SDE 2 (full-stack)',
  outcome: 'no offer',
};
const UBER_FE_BENGALURU_2018: InterviewProcessSource = {
  ...report(
    'Taro (approx.)',
    'https://www.jointaro.com/interviews/companies/uber/experiences/software-engineer-ii-bengaluru-october-1-2018-no-offer-negative-52296d2f/',
    '2018-10',
  ),
  role: 'Software engineer II (frontend)',
};

const STRIPE_CAREERS = official('Stripe: Careers FAQ', 'https://stripe.com/careers');
const STRIPE_TARO = 'https://www.jointaro.com/interviews/companies/stripe/experiences';
const STRIPE_ST1 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-engineer-barcelona-october-1-2023-no-offer-neutral-ceb407e7/`, '2023-10');
const STRIPE_ST3 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-engineer-san-francisco-ca-august-1-2025-no-offer-neutral-8ad7d78f/`, '2025-08');
const STRIPE_ST4 = report('Taro', `${STRIPE_TARO}/front-end-developer-india-november-15-2022-no-offer-positive-f4ea85cd/`, '2022-11');
const STRIPE_ST5 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-developer-barcelona-march-1-2025-no-offer-positive-c1c921ed/`, '2025-03');
// Stripe accounts re-read 2026-11-13: the Taro pages, both Blind threads (through a reader, since Blind refuses plain
// requests) and the intern's post through its Medium RSS feed. The LeetCode post is not re-read (LeetCode is blocked);
// its row rests on docs/references/company-interview-processes-2026-10.md and company-sources-review-2026-10.md.
// Taro places the reporter does not map (Sweden, Vancouver, Dublin) carry an authored role and country.
// Replaces STRIPE_ST6_PLAN, STRIPE_ST7 and STRIPE_ST9 (same URLs and dates, with the role each account gives).
const STRIPE_ST6_PLAN: InterviewProcessSource = {
  ...report('Blind (recruiter plan)', 'https://www.teamblind.com/post/Stripe-frontend-onsite-SfaGgc1a', '2024-11'),
  role: 'Frontend engineer (L3)',
};
const STRIPE_ST7: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/stripe-frontend-interview-be7f1ymm', '2024-07'),
  role: 'Senior developer',
};
const STRIPE_ST8 = report('Taro', `${STRIPE_TARO}/frontend-developer-canada-september-19-2025-no-offer-positive-caea53c0/`, '2025-09');
const STRIPE_ST9: InterviewProcessSource = {
  ...report('LeetCode Discuss', 'https://leetcode.com/discuss/post/5883632/', '2024-10'),
  role: 'Software engineer 2',
};
const STRIPE_ROLE = 'Frontend engineers';
// New.
const STRIPE_ST10_FE_US_2022 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-engineer-united-states-march-1-2022-accepted-offer-positive-f4a7a2d5/`, '2022-03');
const STRIPE_ST11_FE_SEATTLE_2022 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-software-engineer-seattle-wa-april-1-2022-accepted-offer-negative-3408828e/`, '2022-04');
const STRIPE_ST12_FE_CANADA_2024 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-software-engineer-canada-april-1-2024-no-offer-positive-1dec0d98/`, '2024-04');
const STRIPE_ST13_FE_TORONTO_2024 = report('Taro', `${STRIPE_TARO}/front-end-developer-toronto-on-may-12-2024-no-offer-positive-82fbc177/`, '2024-05');
const STRIPE_ST14_FE_SWEDEN_2025: InterviewProcessSource = {
  ...report('Taro', `${STRIPE_TARO}/front-end-engineer-sweden-september-6-2025-no-offer-neutral-24f195b1/`, '2025-09'),
  role: 'Front-end engineer',
  location: 'Sweden',
};
const STRIPE_ST15_FE_TORONTO_2025 = report('Taro (approx.)', `${STRIPE_TARO}/front-end-engineer-toronto-on-july-1-2025-no-offer-positive-c811972d/`, '2025-07');
const STRIPE_ST16_FE_VANCOUVER_2025: InterviewProcessSource = {
  ...report('Taro (approx.)', `${STRIPE_TARO}/front-end-engineer-vancouver-bc-june-1-2025-no-offer-positive-f815091d/`, '2025-06'),
  role: 'Front-end engineer',
  location: 'Canada',
};
const STRIPE_ST17_FE_2026 = report('Taro', `${STRIPE_TARO}/frontend-engineer-may-15-2026-no-offer-negative-0506f93d/`, '2026-05');
const STRIPE_ST18_FE_2026 = report('Taro', `${STRIPE_TARO}/frontend-engineer-january-5-2026-no-offer-positive-67706351/`, '2026-01');
const STRIPE_ST19_FE_DUBLIN_2025: InterviewProcessSource = {
  ...report('Taro', `${STRIPE_TARO}/frontend-engineer-dublin-county-dublin-december-17-2025-no-offer-negative-8c6234dd/`, '2025-12'),
  role: 'Frontend engineer',
  location: 'Ireland',
};
const STRIPE_ST20_SENIOR_CANADA_2025 = report('Taro', `${STRIPE_TARO}/senior-frontend-developer-canada-september-29-2025-accepted-offer-positive-64d19da6/`, '2025-09');
const STRIPE_ST21_FE_CANADA_2023 = report('Taro (approx.)', `${STRIPE_TARO}/front-end-developer-canada-june-1-2023-no-offer-neutral-9365163f/`, '2023-06');
// A software engineering intern loop in Bengaluru; its integration round and its manager questions are kept by content.
const STRIPE_ST22_INTERN_2025: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@diyaag2020/my-stripe-interview-experience-2025-2026-a-journey-to-the-final-round-19990fa6876a', '2025-10'),
  role: 'Software engineering intern',
  location: 'India',
  outcome: 'no offer',
};
// Two San Francisco web roles, cited for their behavioural questions only.
const STRIPE_ST23_WEBDEV_2017 = report('Taro', `${STRIPE_TARO}/web-developer-san-francisco-ca-june-19-2017-no-offer-negative-819c5a53/`, '2017-06');
const STRIPE_ST24_WEB_2018: InterviewProcessSource = {
  ...report('Taro (approx.)', `${STRIPE_TARO}/web-designerdeveloper-san-francisco-ca-october-1-2018-no-offer-positive-f13544f0/`, '2018-10'),
  role: 'Web designer and developer',
};
// Taro lists this account twice (9c09fcb2 and f11f37bd, the same text); only the first is cited.
const STRIPE_ST25_SENIOR_2022 = report('Taro (approx.)', `${STRIPE_TARO}/senior-frontend-engineer-united-states-april-1-2022-no-offer-negative-9c09fcb2/`, '2022-04');

const BYTEDANCE_CAMPUS = official('ByteDance: Early careers interview tips', 'https://jobs.bytedance.com/en/campus/interview-tips');
const BYTEDANCE_TIKTOK_CAMPUS = official('TikTok: Early careers interview tips', 'https://careers.tiktok.com/m/campus/interview-tips');
// ByteDance and TikTok accounts with who and when. The Blind threads, the ExplainThis post and the Taro pages were
// re-read on 2026-11-13; the LeetCode bodies of 979478, 1540236 and 1735332 were saved in the research session of
// 2026-10-15, and the other LeetCode posts come from docs/references/company-interview-processes-2026-10.md. Roles,
// places and outcomes are what each account gives. BD3, BD4, BD10 and BD11 report an offer without saying it was
// accepted, and only a commenter congratulates BD2 on one, so none of them carries an outcome.
// The interview was in late December 2022 and the post is from January 2023; the poster was still waiting for a result.
const BYTEDANCE_BD1: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l', '2022-12'),
  role: 'Frontend engineer, new graduate',
};
const BYTEDANCE_BD2: InterviewProcessSource = {
  ...report(
    'Blind',
    'https://www.teamblind.com/post/my-tiktok-front-end-interview-experience-any-idea-what-end-result-might-look-like-jfcdhq5r',
    '2024-09',
  ),
  role: 'Frontend engineer',
};
const BYTEDANCE_BD4: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/979478/', '2020-12'),
  role: 'Front end software engineer, new graduate',
  location: 'United States',
};
const BYTEDANCE_BD5: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/4881233/', '2024-03'),
  role: 'Frontend engineer',
  outcome: 'no offer',
};
const BYTEDANCE_BD6: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/6450891/', '2025-02'),
  role: 'Senior frontend engineer',
  location: 'Singapore',
};
const BYTEDANCE_BD7: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/6437333/', '2025-02'),
  role: 'Front-end graduate',
};
// Written before the hiring manager round.
const BYTEDANCE_BD8: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/tiktok-behavioral-with-hiring-manager-round-utpnj2vx', '2023-12'),
  role: 'Frontend engineer',
};
// A Seattle loop that stopped over a visa question; the post gives no role title.
const BYTEDANCE_BD9: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/2270634/', '2022-06'),
  location: 'United States',
};
const BYTEDANCE_TARO = 'https://www.jointaro.com/interviews/companies/tiktok/experiences';
const BYTEDANCE_TT1 = report('Taro', `${BYTEDANCE_TARO}/frontend-engineer-united-states-october-27-2025-no-offer-neutral-22728914/`, '2025-10');
const BYTEDANCE_TT2 = report('Taro', `${BYTEDANCE_TARO}/front-end-developer-united-states-march-4-2025-no-offer-positive-8082b9a5/`, '2025-03');
const BYTEDANCE_TT3 = report('Taro (approx.)', `${BYTEDANCE_TARO}/frontend-engineer-united-states-june-1-2024-declined-offer-neutral-363898ae/`, '2024-06');
const BYTEDANCE_TT4 = report('Taro', `${BYTEDANCE_TARO}/front-end-engineer-united-states-july-8-2024-no-offer-neutral-d83a6ff3/`, '2024-07');
const BYTEDANCE_TT5 = report('Taro (approx.)', `${BYTEDANCE_TARO}/front-end-developer-san-jose-ca-march-1-2024-no-offer-neutral-fc19c254/`, '2024-03');
// Taro's address for this account names no place; its page gives Singapore.
const BYTEDANCE_TT6: InterviewProcessSource = {
  ...report('Taro', `${BYTEDANCE_TARO}/front-end-developer-october-22-2025-accepted-offer-positive-59a98129/`, '2025-10'),
  location: 'Singapore',
};
const BYTEDANCE_TT7 = report('Taro (approx.)', `${BYTEDANCE_TARO}/frontend-developer-singapore-november-1-2023-accepted-offer-positive-31530cbd/`, '2023-11');
const BYTEDANCE_TT8 = report('Taro (approx.)', `${BYTEDANCE_TARO}/frontend-engineer-sydney-september-1-2024-no-offer-neutral-5db123fe/`, '2024-09');
const BYTEDANCE_TT9 = report('Taro (approx.)', `${BYTEDANCE_TARO}/frontend-developer-singapore-august-1-2025-no-offer-neutral-4e4e5cf8/`, '2025-08');
const BYTEDANCE_TT10 = report('Taro', `${BYTEDANCE_TARO}/frontend-developer-seattle-washington-october-27-2025-no-offer-positive-1abce1a2/`, '2025-10');
const BYTEDANCE_TT11 = report('Taro (approx.)', `${BYTEDANCE_TARO}/graduate-front-end-developer-sydney-may-1-2024-no-offer-neutral-11f1f10b/`, '2024-05');
const BYTEDANCE_TT12 = report('Taro (approx.)', `${BYTEDANCE_TARO}/front-end-software-engineer-intern-united-states-august-1-2024-no-offer-neutral-56f0627e/`, '2024-08');
const BYTEDANCE_TT15 = report('Taro (approx.)', `${BYTEDANCE_TARO}/frontend-developer-singapore-may-1-2024-no-offer-neutral-8a86f039/`, '2024-05');
const BYTEDANCE_TT16 = report('Taro', `${BYTEDANCE_TARO}/frontend-engineer-singapore-september-16-2025-no-offer-neutral-cc1b7edd/`, '2025-09');
const BYTEDANCE_BDT1 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/bytedance/experiences/front-end-engineer-australia-june-1-2021-accepted-offer-positive-14ef73af/',
  '2021-06',
);
// Added 2026-11-13. BD3 is a summer 2022 loop written up in January 2023; its author posted the same account on
// LeetCode and Blind, cited here once. BD10 and BD11 are new-graduate and intern loops whose bodies were saved in the
// 2026-10-15 research session.
const BYTEDANCE_BD3: InterviewProcessSource = {
  ...report('ExplainThis', 'https://explainthis.io/en/software-engineer-note/software-engineer-career/my-tiktok-frontend-interview', '2023-01'),
  role: 'Frontend software engineer',
};
const BYTEDANCE_BD10: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1540236/', '2021-10'),
  role: 'Frontend new graduate',
};
const BYTEDANCE_BD11: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1735332/', '2022-02'),
  role: 'Front-end software engineer intern',
};
const BYTEDANCE_TT13 = report('Taro', `${BYTEDANCE_TARO}/frontend-software-engineer-intern-san-jose-ca-march-15-2025-no-offer-neutral-b48dd88e/`, '2025-03');

const BOOKINGCOM_JOURNEY = official('Booking.com: Start your journey', 'https://careers.booking.com/start-your-journey/');
const BOOKINGCOM_TARO = 'https://www.jointaro.com/interviews/companies/bookingcom/experiences';
// Code360 and enginebogie were re-read through their JSON on 2026-11-13 for role, place and outcome. Code360 marks
// BK1 "Rejection" while its text says the candidate was still being considered, so BK1 carries no outcome.
const BOOKINGCOM_BK1: InterviewProcessSource = {
  ...report(
    'Code360',
    'https://www.naukri.com/code360/interview-experiences/booking-com/interview-experience-frontend-engineer-apr-2023-exp-0-2-years',
    '2023-04',
  ),
  role: 'Frontend engineer',
  location: 'Netherlands',
};
const BOOKINGCOM_BK2: InterviewProcessSource = {
  ...report('enginebogie', 'https://enginebogie.com/interview/experience/booking-com-frontend-engineer/84', '2023-05'),
  role: 'Frontend engineer',
  outcome: 'no offer',
};
const BOOKINGCOM_BK3: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/3673403/', '2023-06'),
  role: 'Frontend engineer II',
  location: 'Netherlands',
};
const BOOKINGCOM_BK5 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/junior-frontend-developer-amsterdam-march-1-2022-accepted-offer-positive-88561605/`, '2022-03');
const BOOKINGCOM_BK6 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/front-end-software-engineer-ii-amsterdam-june-1-2022-accepted-offer-positive-2d3acd6d/`, '2022-06');
const BOOKINGCOM_BK7 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/frontend-software-engineer-ii-turkey-january-1-2023-accepted-offer-positive-e4aeb759/`, '2023-01');
const BOOKINGCOM_BK8 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/junior-frontend-engineer-amsterdam-march-1-2022-accepted-offer-positive-9743e14f/`, '2022-03');
const BOOKINGCOM_BK9: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/bookingcom-frontend-interview-experience-owh781q6', '2021-12'),
  role: 'Frontend engineer',
  location: 'Netherlands',
};
const BOOKINGCOM_BK10: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/bookingcom-interview-frontend-fzudnfhv', '2021-11'),
  role: 'Frontend engineer',
};
const BOOKINGCOM_BK11 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/frontend-developer-turkey-september-1-2021-no-offer-neutral-8e3079d9/`, '2021-09');
const BOOKINGCOM_BK12 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/full-stack-software-engineer-bangladesh-may-1-2022-accepted-offer-positive-8784f953/`, '2022-05');
// Added 2026-11-13 for the question list; the 2025 Taro accounts are the ones the 2026-10-22 addendum quotes. Taro
// has no place for "south-korea", so that account names its role itself (the slug's place would end up in the role).
const BOOKINGCOM_BK13_SENIOR_FULLSTACK = report(
  'Taro (approx.)',
  `${BOOKINGCOM_TARO}/senior-full-stack-engineer-amsterdam-july-1-2023-no-offer-negative-cb57c4dd/`,
  '2023-07',
);
const BOOKINGCOM_BK15_SENIOR_2025 = report('Taro', `${BOOKINGCOM_TARO}/senior-software-engineer-amsterdam-may-29-2025-no-offer-neutral-4678e62e/`, '2025-05');
const BOOKINGCOM_BK16_ANGULAR = report('Taro (approx.)', `${BOOKINGCOM_TARO}/front-end-developer-amsterdam-may-1-2022-no-offer-negative-f21cc7dc/`, '2022-05');
const BOOKINGCOM_BK17_DEVTO: InterviewProcessSource = {
  ...report('dev.to', 'https://dev.to/thematheusmello/how-it-went-my-bookingcom-coding-interview-26d9', '2022-10'),
  outcome: 'no offer',
};
const BOOKINGCOM_BK18_SE1_2025 = report('Taro', `${BOOKINGCOM_TARO}/software-engineer-1-amsterdam-august-19-2025-no-offer-positive-bfc9d249/`, '2025-08');
const BOOKINGCOM_BK19_FE_2025: InterviewProcessSource = {
  ...report('Taro', `${BOOKINGCOM_TARO}/frontend-developer-south-korea-september-6-2025-accepted-offer-negative-069b312f/`, '2025-09'),
  role: 'Frontend developer',
};

// The Datadog Taro pages and both official pages were read again on 2026-11-13; LeetCode was not (blocked), so DD7 rests
// on the 2026-10-20 reading in docs/references/company-interview-processes-2026-10.md.
const DATADOG_CANDIDATE_EXPERIENCE = official('Datadog: Candidate experience', 'https://careers.datadoghq.com/candidate-experience/');
const DATADOG_TARO = 'https://www.jointaro.com/interviews/companies/datadog/experiences';
const DATADOG_DD1 = report('Taro (approx.)', `${DATADOG_TARO}/senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048/`, '2024-10');
const DATADOG_DD2 = report('Taro (approx.)', `${DATADOG_TARO}/senior-frontend-engineer-paris-september-1-2025-accepted-offer-positive-2a1ddfe8/`, '2025-09');
const DATADOG_DD3 = report('Taro (approx.)', `${DATADOG_TARO}/senior-software-engineer-frontend-france-july-1-2023-accepted-offer-positive-b4edf2ad/`, '2023-07');
const DATADOG_DD4 = report('Taro (approx.)', `${DATADOG_TARO}/senior-software-engineer-frontend-france-october-1-2024-accepted-offer-positive-3bd8f875/`, '2024-10');
const DATADOG_DD5 = report('Taro (approx.)', `${DATADOG_TARO}/software-engineer-front-end-paris-september-1-2024-accepted-offer-positive-ba0b1dd8/`, '2024-09');
const DATADOG_DD6 = report('Taro (approx.)', `${DATADOG_TARO}/frontend-engineer-madrid-february-1-2024-accepted-offer-positive-a8de35e5/`, '2024-02');
// A senior frontend loop for a Paris role; the offer was withdrawn after team matching had been scheduled.
const DATADOG_DD7: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/7080135', '2025-05'),
  role: 'Senior frontend engineer',
  location: 'France',
  outcome: 'no offer',
};
const DATADOG_DD8 = report('Taro (approx.)', `${DATADOG_TARO}/senior-frontend-engineer-madrid-community-of-madrid-july-1-2025-no-offer-positive-f1c8b321/`, '2025-07');
const DATADOG_DD9 = report('Taro', `${DATADOG_TARO}/senior-frontend-developer-lisbon-lisbon-district-november-23-2025-no-offer-positive-1a88bdda/`, '2025-11');
const DATADOG_DD10 = report('Taro', `${DATADOG_TARO}/front-end-software-engineer-brazil-january-25-2024-accepted-offer-positive-c193fd19/`, '2024-01');
const DATADOG_ROLE = 'Frontend engineers';
// Added 2026-11-13: the two 2021 take-home loops from the research record and the 2024 Lisbon account the guide cites.
const DATADOG_DD11 = report('Taro (approx.)', `${DATADOG_TARO}/software-engineer-front-end-new-york-ny-july-1-2021-no-offer-positive-2833c42b/`, '2021-07');
const DATADOG_DD12 = report('Taro (approx.)', `${DATADOG_TARO}/senior-frontend-engineer-paris-april-1-2021-accepted-offer-positive-f33dca98/`, '2021-04');
const DATADOG_LISBON_2024 = report('Taro (approx.)', `${DATADOG_TARO}/software-engineer-front-end-lisbon-lisbon-district-june-1-2024-no-offer-negative-945bab75/`, '2024-06');

const INTUIT_HIRING = official('Intuit: Hiring process', 'https://www.intuit.com/careers/hiring-process/');
const INTUIT_TARO = 'https://www.jointaro.com/interviews/companies/intuit/experiences';
// The LeetCode and Blind accounts carry the role, country and outcome they state; a field an account leaves out stays
// unset. LeetCode was not re-read for the question list (blocked); its rows rest on the 2026-10-14 reading the guide's
// notes and the catalog sources record. The Taro pages and the Blind craft thread were read again on 2026-11-13.
const INTUIT_IN1: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7320927/', '2025-11'),
  role: 'Senior software engineer (frontend)',
  location: 'India',
};
const INTUIT_IN2: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6770567/', '2025-05'),
  role: 'Senior frontend engineer',
  location: 'India',
};
const INTUIT_IN3: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/4167001/', '2023-10'),
  role: 'Software engineer 2 (frontend)',
  outcome: 'no offer',
};
const INTUIT_IN4: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/4980666/', '2024-04'),
  role: 'Software engineer 2 (frontend work)',
  location: 'India',
};
const INTUIT_IN5: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/2052880/', '2022-05'),
  role: 'Frontend engineer',
  outcome: 'no offer',
};
const INTUIT_IN8_PLAN: InterviewProcessSource = {
  ...report(
    'Blind (recruiter plan)',
    'https://www.teamblind.com/post/final-interview-for-front-end-engineer-at-intuit-new-coding-format-5jbsqcv5',
    '2024-10',
  ),
  role: 'Front-end engineer (SDE-II)',
  outcome: 'in progress',
};
const INTUIT_IN9_PLAN: InterviewProcessSource = {
  ...report('Blind (plan)', 'https://www.teamblind.com/post/intuit-a4a-interview-staff-swe-fe-bay-area-8-yoe-8ppjug5d', '2026-08'),
  role: 'Staff software engineer (frontend)',
  location: 'United States',
  outcome: 'in progress',
};
const INTUIT_IN10: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/intuit-team-matching-53d3l6c6', '2025-10'),
  role: 'Frontend engineer',
  outcome: 'in progress',
};
const INTUIT_IN11 = report('Taro', `${INTUIT_TARO}/staff-frontend-engineer-india-january-8-2025-no-offer-negative-8dde40c5/`, '2025-01');
const INTUIT_IN12 = report('Taro (approx.)', `${INTUIT_TARO}/staff-frontend-engineer-united-states-august-1-2024-no-offer-negative-3a91fb0d/`, '2024-08');
const INTUIT_IN13 = report('Taro (approx.)', `${INTUIT_TARO}/senior-software-engineer-frontend-bengaluru-march-1-2022-no-offer-negative-93ee0992/`, '2022-03');
const INTUIT_IN15 = report('Taro (approx.)', `${INTUIT_TARO}/senior-fullstack-engineer-united-states-december-1-2023-accepted-offer-positive-09501015/`, '2023-12');
const INTUIT_HR_2022 = report('Taro (approx.)', `${INTUIT_TARO}/senior-front-end-developer-united-states-april-1-2022-no-offer-negative-cd8e79ed/`, '2022-04');
const INTUIT_ROLE = 'Frontend engineers';
const INTUIT_IN6_SDE2_2021: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1618037/', '2021-10'),
  role: 'SDE2 (frontend)',
  location: 'India',
};
// A general software engineer loop whose build task was a front-end app; kept by content.
const INTUIT_TARO_SWE_2022 = report('Taro (approx.)', `${INTUIT_TARO}/software-engineer-los-angeles-ca-september-1-2022-no-offer-positive-60b4e7cb/`, '2022-09');
// Posted on 2022-09-07 with the final round six days away; the poster's own account of it is a reply from 2022-10-06.
const INTUIT_BLIND_CRAFT_2022: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/intuit-craft-demo-tips-swe-2-pqztez7j', '2022-09'),
  role: 'Software engineer 2',
};

const SERVICENOW_TARO = 'https://www.jointaro.com/interviews/companies/servicenow/experiences';
// ServiceNow accounts with who and when, 2026-11-13. The Taro pages and the four Blind threads were re-read that day;
// the LeetCode and Medium bodies come from the research sessions of 2026-10-14 and 2026-10-20 (neither site is
// re-readable now). Taro dates each review to the first of a month, so its months are approximate, and Santa Clara is
// not on the reporter's place list, so those two accounts carry an authored role and country. Roles, places and
// outcomes are what each post gives: the 2025 IC2 post reports a selection without saying an offer was accepted, and
// the 2023 post ends "Selected but position got filled", so neither carries an outcome.
const SERVICENOW_SN1: InterviewProcessSource = {
  ...report(
    'Medium',
    'https://medium.com/@karunakumari000532/my-servicenow-software-engineer-ui-interview-experience-2025-23f315b960dc',
    '2025-09',
  ),
  role: 'Software engineer (UI)',
  outcome: 'no offer',
};
// Interviews from 2025-03-04 to 2025-03-06, posted 2025-03-07.
const SERVICENOW_SN2: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6508672/', '2025-03'),
  role: 'Software engineer (UI), IC2',
};
const SERVICENOW_SN3: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/4096867/', '2023-09'),
  role: 'Frontend engineer (IC2)',
};
const SERVICENOW_SN4 = report(
  'Taro (approx.)',
  `${SERVICENOW_TARO}/senior-software-engineer-frontend-hyderabad-march-1-2022-no-offer-positive-83f4f1a9/`,
  '2022-03',
);
const SERVICENOW_SN5 = report(
  'Taro (approx.)',
  `${SERVICENOW_TARO}/frontend-engineer-hyderabad-february-1-2024-no-offer-positive-1799e9aa/`,
  '2024-02',
);
const SERVICENOW_ROLE = 'UI and frontend, IC2 to senior';
const SERVICENOW_SN6: InterviewProcessSource = {
  ...report(
    'Taro (approx.)',
    `${SERVICENOW_TARO}/senior-software-engineer-frontend-santa-clara-ca-january-1-2023-no-offer-positive-b6750124/`,
    '2023-01',
  ),
  role: 'Senior software engineer (frontend)',
  location: 'United States',
};
const SERVICENOW_SN7: InterviewProcessSource = {
  ...report(
    'Taro (approx.)',
    `${SERVICENOW_TARO}/senior-front-end-engineer-santa-clara-ca-january-1-2024-no-offer-neutral-902ecc84/`,
    '2024-01',
  ),
  role: 'Senior front-end engineer',
  location: 'United States',
};
// A plan posted before the interviews: the rounds and the team the poster was told about.
const SERVICENOW_SN8: InterviewProcessSource = {
  ...report('Blind (plan)', 'https://www.teamblind.com/post/servicenow-frontend-swe-ic2-interview-n7rqq1v2', '2025-11'),
  role: 'Frontend software engineer (IC2)',
};
// The poster's recruiter call and hiring manager round (update of 2022-10-19); the technical interviews were still to come.
const SERVICENOW_SN10: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/ServiceNow-rounds-for-Software-engineer-front-end-focused-DZOzBuaO', '2022-10'),
  role: 'Software engineer (front-end focused)',
  location: 'Netherlands',
};
// One hour-long technical interview in a staff full-stack loop, posted 2025-12-11 after a hold and a rejection.
const SERVICENOW_SN11: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7406202/', '2025-12'),
  role: 'Staff software engineer (full stack)',
  outcome: 'no offer',
};
// One hiring manager round for an IC2 role, posted 2025-06-11.
const SERVICENOW_HM_IC2_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6833995/', '2025-06'),
  role: 'IC2 candidate',
};
// A ServiceNow-badged engineer's reply about their own interviews, on a thread about a staff phone screen; the reply
// does not date the interviews.
const SERVICENOW_BLIND_STAFF_2021 = report(
  'Blind comment',
  'https://www.teamblind.com/post/servicenow-phone-screen-staff-engineer-interview-8msftqw8',
  '2021-09',
);

// Revolut's Taro pages are anonymous interview reviews re-posted with Taro's own city and date, so the reporter shows
// no place for them (TARO_UNRELIABLE_LOCATION). The Taro pages and both Blind posts were read again on 2026-11-13.
const REVOLUT_BAR_RAISER = official('Revolut: Bar Raiser interview video', 'https://www.youtube.com/watch?v=zreFxR7MRuI');
const REVOLUT_ENGINEERING = official('Revolut: Engineering careers page', 'https://www.revolut.com/careers/team/engineering/');
const REVOLUT_TARO = 'https://www.jointaro.com/interviews/companies/revolut/experiences';
const REVOLUT_RV1 = report('Taro (approx.)', `${REVOLUT_TARO}/frontend-developer-warsaw-masovia-april-1-2025-no-offer-neutral-71032bb4/`, '2025-04');
const REVOLUT_RV2 = report('Taro (approx.)', `${REVOLUT_TARO}/frontend-engineer-barcelona-may-1-2025-no-offer-neutral-3c58f9b9/`, '2025-05');
const REVOLUT_RV3 = report('Taro (approx.)', `${REVOLUT_TARO}/frontend-engineer-barcelona-march-1-2025-no-offer-neutral-fd597039/`, '2025-03');
const REVOLUT_RV4 = report('Taro (approx.)', `${REVOLUT_TARO}/senior-frontend-developer-poland-may-1-2024-no-offer-negative-b869132a/`, '2024-05');
const REVOLUT_RV5 = report('Taro (approx.)', `${REVOLUT_TARO}/senior-frontend-engineer-madrid-april-1-2024-no-offer-neutral-c98763a9/`, '2024-04');
const REVOLUT_RV6 = report('Taro', `${REVOLUT_TARO}/senior-frontend-engineer-react-georgia-february-7-2024-no-offer-neutral-9a9832e4/`, '2024-02');
const REVOLUT_RV7 = report('Taro (approx.)', `${REVOLUT_TARO}/web-engineer-krakow-september-1-2023-no-offer-neutral-349ae671/`, '2023-09');
const REVOLUT_RV8 = report('Taro', `${REVOLUT_TARO}/senior-front-end-developer-lisbon-lisbon-district-april-24-2023-no-offer-positive-025ce14f/`, '2023-04');
const REVOLUT_RV9 = report('Taro (approx.)', `${REVOLUT_TARO}/senior-frontend-engineer-berlin-april-1-2022-accepted-offer-positive-aa0a7d87/`, '2022-04');
const REVOLUT_RV10 = report('Taro', `${REVOLUT_TARO}/frontend-developer-portugal-november-5-2025-no-offer-neutral-c06a19bc/`, '2025-11');
// A frontend engineer at another company lists the stages they expect, before the interview; no place is stated.
const REVOLUT_RV15_PLAN: InterviewProcessSource = {
  ...report(
    'Blind (plan)',
    'https://www.teamblind.com/post/what-to-expect-in-revolut-frontend-engineer-interview-screening-technical-team-bar-raiser-qpgmtoum',
    '2026-03',
  ),
  role: 'Frontend engineer',
  outcome: 'in progress',
};
const REVOLUT_RV12 = report('Taro (approx.)', `${REVOLUT_TARO}/senior-frontend-software-engineer-porto-oporto-may-1-2024-no-offer-neutral-90611f7c/`, '2024-05');
// Revolut's Taro places are not the candidates' (see above), so the role names no hub.
const REVOLUT_ROLE = 'Frontend engineers';
const REVOLUT_RV11 = report('Taro', `${REVOLUT_TARO}/front-end-developer-krakow-january-14-2025-no-offer-neutral-7759dda2/`, '2025-01');
const REVOLUT_RV13 = report('Taro (approx.)', `${REVOLUT_TARO}/frontend-developer-lisbon-lisbon-district-november-1-2022-no-offer-negative-34908269/`, '2022-11');
// Added 2026-11-13 for the question list: frontend reviews found on Taro beside the research record's accounts.
const REVOLUT_FE_2024 = report('Taro (approx.)', `${REVOLUT_TARO}/front-end-developer-germany-april-1-2024-no-offer-negative-a0d10251/`, '2024-04');
const REVOLUT_FE_2020 = report('Taro', `${REVOLUT_TARO}/frontend-engineer-united-kingdom-november-6-2020-no-offer-negative-6688b66c/`, '2020-11');
// Dubai is missing from the reporter's Taro place table, so the role is given here; Revolut places stay unset.
const REVOLUT_FE_HR_2025: InterviewProcessSource = {
  ...report('Taro', `${REVOLUT_TARO}/frontend-developer-dubai-november-6-2025-no-offer-neutral-809e615c/`, '2025-11'),
  role: 'Frontend developer',
};

// Spotify sources re-read on 2026-11-13: the two Life at Spotify pages, the Blind threads and the Taro pages below.
// Blind posts give no place; their roles are the ones the posters give. The 2021 phone-screen post and the 2022 thread
// are one senior candidate (same handle), who was working at Spotify by April 2022.
const SPOTIFY_JOURNEY: InterviewProcessSource = {
  ...official('Spotify: Start your journey', 'https://www.lifeatspotify.com/start-your-journey'),
  date: '2026-11',
};
const SPOTIFY_TARO = 'https://www.jointaro.com/interviews/companies/spotify/experiences';
const SPOTIFY_SP1: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/spotify-final-round-web-interview-qyug2zqx', '2022-04'),
  role: 'Web engineer (Personalization)',
};
const SPOTIFY_SP1_DESIGN: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg', '2022-04'),
  role: 'Web engineer (Personalization)',
};
const SPOTIFY_SP2: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/spotify-senior-web-engineer-interview-k27u5vu7', '2021-10'),
  role: 'Senior web engineer',
};
const SPOTIFY_SP3: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Spotify-Web-Engineer-Interview-hNTex8N7', '2022-04'),
  role: 'Senior web engineer',
  outcome: 'accepted offer',
};
const SPOTIFY_SP4 = report('Taro', `${SPOTIFY_TARO}/senior-web-engineer-united-states-august-30-2022-no-offer-neutral-e746c706/`, '2022-08');
const SPOTIFY_SP5 = report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-toronto-on-april-1-2022-no-offer-positive-a2f8744e/`, '2022-04');
const SPOTIFY_SP6 = report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-new-york-ny-april-1-2023-no-offer-negative-5bce68df/`, '2023-04');
const SPOTIFY_SP7 = report('Taro (approx.)', `${SPOTIFY_TARO}/senior-web-engineer-united-states-september-1-2023-no-offer-negative-890b3570/`, '2023-09');
const SPOTIFY_SP8 = report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-united-states-may-1-2022-no-offer-neutral-70fb53e8/`, '2022-05');
const SPOTIFY_SP9 = report('Taro (approx.)', `${SPOTIFY_TARO}/software-engineer-new-york-ny-february-1-2025-no-offer-positive-0dc5e197/`, '2025-02');
const SPOTIFY_ROLE = 'Web and full-stack engineers';
// Added 2026-11-13 for the stages and the question list. Taro pages dated to the first of a month are marked
// approximate. Places missing from the Taro place list (Stockholm) are authored; Italy, Nigeria and Belgium are not
// in the countries the reporter spec accepts, so those accounts show their role only. The 2018 New York account says
// the recruiter never followed up, so it carries no offer whatever Taro's URL says.
const SPOTIFY_FAQ: InterviewProcessSource = {
  ...official('Spotify: Interview FAQ', 'https://www.lifeatspotify.com/start-your-journey/faq'),
  date: '2026-11',
};
const SPOTIFY_STOCKHOLM_JS_2018: InterviewProcessSource = {
  ...report('Taro (approx.)', `${SPOTIFY_TARO}/javascript-engineer-stockholm-stockholm-march-1-2018-no-offer-positive-f2f80c88/`, '2018-03'),
  role: 'JavaScript engineer',
  location: 'Sweden',
};
const SPOTIFY_STOCKHOLM_FS_2018: InterviewProcessSource = {
  ...report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-developer-stockholm-stockholm-march-1-2018-no-offer-positive-d6838869/`, '2018-03'),
  role: 'Full-stack developer',
  location: 'Sweden',
};
const SPOTIFY_NY_2018: InterviewProcessSource = {
  ...report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-new-york-ny-october-1-2018-accepted-offer-negative-10c275cd/`, '2018-10'),
  outcome: 'no offer',
};
const SPOTIFY_NY_2019 = report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-new-york-ny-march-1-2019-no-offer-neutral-9b0609c4/`, '2019-03');
const SPOTIFY_NL_2019 = report('Taro', `${SPOTIFY_TARO}/web-engineer-netherlands-december-21-2019-accepted-offer-positive-5d4d2ae6/`, '2019-12');
const SPOTIFY_US_UI_2020 = report('Taro (approx.)', `${SPOTIFY_TARO}/ui-developer-united-states-january-1-2020-no-offer-positive-5437323c/`, '2020-01');
const SPOTIFY_NY_FS_2020 = report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-software-engineer-new-york-ny-march-1-2020-no-offer-neutral-8e56c9aa/`, '2020-03');
const SPOTIFY_LONDON_FS_2020 = report('Taro', `${SPOTIFY_TARO}/full-stack-developer-london-england-may-17-2020-no-offer-positive-bdb4fc4d/`, '2020-05');
const SPOTIFY_US_FE_2020 = report('Taro', `${SPOTIFY_TARO}/front-end-developer-united-states-august-28-2020-no-offer-neutral-16c36b8d/`, '2020-08');
const SPOTIFY_NIGERIA_FS_2021: InterviewProcessSource = {
  ...report('Taro (approx.)', `${SPOTIFY_TARO}/senior-full-stack-engineer-nigeria-february-1-2021-no-offer-positive-b81a597d/`, '2021-02'),
  role: 'Senior full-stack engineer',
  location: 'Nigeria',
};
const SPOTIFY_STOCKHOLM_FE_2021: InterviewProcessSource = {
  ...report('Taro (approx.)', `${SPOTIFY_TARO}/front-end-engineering-stockholm-stockholm-february-1-2021-accepted-offer-positive-e586bcbf/`, '2021-02'),
  role: 'Front-end engineering',
  location: 'Sweden',
};
const SPOTIFY_AMSTERDAM_FS_2022 = report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-developer-amsterdam-march-1-2022-no-offer-positive-66d52cc7/`, '2022-03');
const SPOTIFY_GERMANY_FS_2022 = report('Taro (approx.)', `${SPOTIFY_TARO}/senior-full-stack-engineer-germany-march-1-2022-no-offer-negative-8e6f68ad/`, '2022-03');
const SPOTIFY_LONDON_PDX_2022: InterviewProcessSource = {
  ...report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-developer-pdx-london-england-march-1-2022-no-offer-negative-9736521a/`, '2022-03'),
  role: 'Full-stack developer (PDX)',
};
const SPOTIFY_BERLIN_FS_2022 = report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-engineer-berlin-june-1-2022-no-offer-negative-22da0651/`, '2022-06');
const SPOTIFY_LONDON_FS_JUN_2022 = report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-developer-london-england-june-1-2022-no-offer-negative-53058b62/`, '2022-06');
const SPOTIFY_ITALY_FS_2022: InterviewProcessSource = {
  ...report('Taro (approx.)', `${SPOTIFY_TARO}/senior-fullstack-engineer-italy-june-1-2022-no-offer-negative-0f612934/`, '2022-06'),
  role: 'Senior full-stack engineer',
  location: 'Italy',
};
const SPOTIFY_NY_FS_2022 = report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-software-engineer-new-york-ny-september-1-2022-no-offer-positive-4a2958e7/`, '2022-09');
const SPOTIFY_LONDON_FS_SEP_2022 = report('Taro (approx.)', `${SPOTIFY_TARO}/fullstack-engineer-london-england-september-1-2022-no-offer-negative-ca232881/`, '2022-09');
const SPOTIFY_BELGIUM_FS_2022: InterviewProcessSource = {
  ...report('Taro', `${SPOTIFY_TARO}/full-stack-software-engineer-belgium-november-29-2022-no-offer-positive-3488a86e/`, '2022-11'),
  role: 'Full-stack software engineer',
  location: 'Belgium',
};
const SPOTIFY_NY_INTERN_2023 = report('Taro (approx.)', `${SPOTIFY_TARO}/full-stack-engineer-intern-new-york-ny-april-1-2023-accepted-offer-positive-5d2dddfd/`, '2023-04');
const SPOTIFY_LONDON_SWE_2025 = report('Taro (approx.)', `${SPOTIFY_TARO}/software-engineer-london-england-june-1-2025-no-offer-neutral-25c6c3bb/`, '2025-06');
const SPOTIFY_US_SWE_2025 = report('Taro', `${SPOTIFY_TARO}/software-engineer-united-states-june-6-2025-no-offer-neutral-9a9ddcc1/`, '2025-06');
const SPOTIFY_FS_2026: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/web-engineering-interview-spotify-gew40ym6', '2026-03'),
  role: 'Full-stack engineer',
};

// Re-read 2026-11-13: both official pages, the Blind thread (ZA4) and ZA1 through the copy its author republished on
// interviewexperiences.in (same date, role, city and rounds; LeetCode itself is not re-read). ZA2 and ZA3 come from
// docs/references/company-interview-processes-2026-10.md. ZA1 and ZA2 report an offer without saying whether it was
// accepted, so they carry no outcome; ZA3 names no role.
const ZALANDO_HOW_WE_HIRE = official('Zalando: How we hire', 'https://jobs.zalando.com/en/how-we-hire');
const ZALANDO_BLOG = official('Zalando: Technical interviews for software engineers', 'https://jobs.zalando.com/en/blog/technical-interview-for-software-engineers');
const ZALANDO_ZA1: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5501338/', '2024-07'),
  role: 'Senior frontend engineer',
  location: 'Germany',
};
const ZALANDO_ZA2: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1076335/', '2020-12'),
  role: 'Senior front-end engineer',
  location: 'Germany',
};
const ZALANDO_ZA3 = report('LeetCode', 'https://leetcode.com/discuss/post/1249280/', '2021-07');
const ZALANDO_ZA4: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/zalando-frontend-interviews-asih8pba', '2022-02'),
  role: 'Frontend engineer',
};
const ZALANDO_ROLE = 'Frontend engineers';

// xAI merged into SpaceX (closed 2026-02-02), rebranded as SpaceXAI in July 2026 and SpaceXSI in October 2026; the board slug is still
// `xai`. Taro probably re-hosts Glassdoor reviews with a changed city, so the London account's label carries
// no city. Every frontend posting with a loop was removed between 2025-06 and 2026-02, so the dates below are
// posting months, not the month read.
const XAI_X1_FE_2025 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/xai/experiences/frontend-engineer-london-england-august-13-2025-no-offer-positive-45b410e6/',
  '2025-08',
);
// Re-read 2026-11-13 for the question list
// (docs/references/jpmorgan-agoda-xai-questions-2026-10.md keeps the October quotes): the Aced pages give the role,
// the country and the outcome, and X7's question titles are public again.
const XAI_X7_MTS_2025: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/x-ai-software-engineer-interview-7fbd12', '2025-12'),
  role: 'Member of technical staff (L3)',
  location: 'United States',
  outcome: 'no offer',
};
const XAI_X8_SAFETY_2025: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/x-ai-senior-software-engineer-interview-3c2a0d', '2025-11'),
  role: 'Senior software engineer (Safety, L5)',
  location: 'United States',
  outcome: 'no offer',
};
// The Specialist title looks like a separate track, so its loop stays off the table; its React question counts under
// the React round. Taro's city for it is not trusted and is not in the reporter's place list, so the role is set here.
const XAI_X2_SPECIALIST_2025: InterviewProcessSource = {
  ...report(
    'Taro (approx.)',
    'https://www.jointaro.com/interviews/companies/xai/experiences/software-engineer-specialist-yerevan-yerevan-august-1-2025-accepted-offer-negative-c940c932/',
    '2025-08',
  ),
  role: 'Software engineer specialist',
};
const XAI_X10_SWE_2025 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/xai/experiences/software-engineer-san-francisco-california-july-1-2025-no-offer-positive-8ba06b7f/',
  '2025-07',
);
const XAI_CAREERS: InterviewProcessSource = {
  label: 'xAI careers page',
  url: 'https://x.ai/careers',
  kind: 'official',
  date: '2026-10',
};
const XAI_O_LONDON_FE: InterviewProcessSource = {
  label: 'London frontend posting',
  url: 'https://www.builtinlondon.uk/job/frontend-engineer/7805551',
  kind: 'official',
  date: '2026-02',
};
const XAI_O_GROK_API: InterviewProcessSource = {
  label: 'grok.com frontend posting',
  url: 'https://builtin.com/job/react-frontend-engineer-grokcom-api/4446453',
  kind: 'official',
  date: '2026-01',
};
const XAI_O_ENTERPRISE: InterviewProcessSource = {
  label: 'Enterprise frontend posting',
  url: 'https://builtin.com/job/frontend-engineer-enterprise/7383404',
  kind: 'official',
  date: '2026-02',
};
const XAI_O_GROK_STUDIO: InterviewProcessSource = {
  label: 'Grok Studio posting',
  url: 'https://jobs.8vc.com/companies/x-ai/jobs/48336005-senior-frontend-engineer-grok-studio',
  kind: 'official',
  date: '2025-04',
};
const XAI_O_AUTONOMOUS_AGENTS: InterviewProcessSource = {
  label: 'Autonomous Agents posting',
  url: 'https://builtin.com/job/senior-frontend-engineer-autonomous-agents/4379947',
  kind: 'official',
  date: '2025-07',
};
// The designer-hybrid posting is undated on its mirror and was removed about 2025-02, so its date is the month read.
const XAI_O_DESIGNER_HYBRID: InterviewProcessSource = {
  label: 'UI/UX designer posting',
  url: 'https://uiuxjobsboard.com/job/864124-frontend-engineer-ui-ux-designer-london-united-kingdom',
  kind: 'official',
  date: '2026-10',
};
const XAI_ROLE = 'Frontend roles on the closed 2025 to 2026 postings';

// JPMorgan Chase. The loop is team-run: the official pages say it "will differ for each position". The online-assessment
// and super-day rows rest on generic software-engineer accounts; no frontend-titled report confirms them.
const JPMORGAN_HOW_WE_HIRE: InterviewProcessSource = {
  label: 'JPMorgan How we hire page',
  url: 'https://www.jpmorganchase.com/careers/how-we-hire',
  kind: 'official',
  date: '2026-10',
};
const JPMORGAN_HIRING_FAQS: InterviewProcessSource = {
  label: 'JPMorgan hiring FAQs',
  url: 'https://www.jpmorganchase.com/careers/how-we-hire/faqs',
  kind: 'official',
  date: '2026-10',
};
const JPMORGAN_JP1: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/jp-morgan-chase-senior-frontend-engineer-interview-6faa4e', '2026-05'),
  role: 'Senior frontend engineer (L5)',
  location: 'United Kingdom',
  outcome: 'no offer',
};
// One London poster: JP2 is the first technical interview they sat, JP2_PLAN the second stage as briefed. No outcome given.
const JPMORGAN_JP2: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/jp-morgan-interview-tips-ohvqbeuy', '2023-05'),
  role: 'Software engineer III (React)',
  location: 'United Kingdom',
};
const JPMORGAN_JP2_PLAN: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/jp-morgan-swe-interview-guide-tsoukjaf', '2023-05'),
  role: 'Software engineer III (React)',
  location: 'United Kingdom',
};
const JPMORGAN_JP3 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/associate-software-engineer-united-kingdom-february-1-2025-no-offer-negative-7f96780a/', '2025-02');
const JPMORGAN_JP4 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-january-1-2021-accepted-offer-positive-e00df0d2/', '2021-01');
const JPMORGAN_JP5 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-july-1-2017-no-offer-negative-5853573b/', '2017-07');
const JPMORGAN_JP6 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-april-1-2022-no-offer-neutral-a3d9886a/', '2022-04');
const JPMORGAN_JP7 = report('Taro', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/lead-software-engineer-united-states-march-13-2025-no-offer-positive-5ec74572/', '2025-03');
const JPMORGAN_JP8 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/react-developer-united-states-june-1-2022-no-offer-positive-87452f0d/', '2022-06');
// JP9, JP10 and JP13 are briefings: the poster's plan plus JPMorgan Chase-badged commenters, cited for the format only.
const JPMORGAN_JP9: InterviewProcessSource = {
  ...report('Blind (briefing)', 'https://www.teamblind.com/post/JPMorgan-Front-End-position---HELP-uwhCeSaA', '2021-12'),
  role: 'Software engineer (front end)',
  location: 'United States',
};
const JPMORGAN_JP10: InterviewProcessSource = {
  ...report('Blind (briefing)', 'https://www.teamblind.com/post/JPMorgan-Chase---Front-End-Developer-Interview-Mb7vx1A6', '2021-03'),
  role: 'Front-end developer',
  location: 'United States',
};
const JPMORGAN_JP11: InterviewProcessSource = {
  ...report(
    'frontendgeek',
    'https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-jp-morgan-refused-offer---9f684f90-12ee-45ec-ac82-e40d2010260e',
    '2024-04',
  ),
  role: 'SDE2 (frontend)',
  location: 'India',
  outcome: 'declined offer',
};
const JPMORGAN_JP12 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-engineer-bengaluru-karnataka-april-1-2024-no-offer-negative-77dc2081/', '2024-04');
const JPMORGAN_JP13: InterviewProcessSource = {
  ...report('Blind (briefing)', 'https://www.teamblind.com/post/jpmorgan-chase-interview-rounds-expectation-bengaluru-ta1v2q0n', '2024-05'),
  role: 'Lead frontend engineer',
  location: 'India',
};
// A New York onsite across several teams; the post gives no title.
const JPMORGAN_JP14: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/1076639/', '2021-02'),
  location: 'United States',
};
const JPMORGAN_JP15 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/software-engineer-united-states-august-1-2025-declined-offer-negative-5c2f81ca/', '2025-08');
// The poster got an offer; the thread does not say whether it was taken.
const JPMORGAN_JP16: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/jpmc-interview-expectations-d0ed5ppz', '2026-04'),
  role: 'Software engineer III',
  location: 'United States',
};
// The India SDE2 and SDE3 super-day cohort; the records do not say which post is which level, so no role is given.
const jpmorganSuperDay = (id: number, date: string): InterviewProcessSource => ({
  ...report('LeetCode', `https://leetcode.com/discuss/post/${id}/`, date),
  location: 'India',
});
const JPMORGAN_JP17A = jpmorganSuperDay(7421234, '2025-12');
const JPMORGAN_JP17B = jpmorganSuperDay(7455878, '2026-01');
const JPMORGAN_JP17C = jpmorganSuperDay(5438765, '2024-07');
const JPMORGAN_JP17D = jpmorganSuperDay(7275188, '2025-10');
const JPMORGAN_JP17E = jpmorganSuperDay(6830133, '2025-06');
const JPMORGAN_ROLE = 'Frontend-titled roles; varies by team';
// Read 2026-10-21 for docs/references/jpmorgan-agoda-xai-questions-2026-10.md (ids J3, J5, J14, J30-Med there); cited
// by the question lists only.
const JPMORGAN_J3_FE_2022 = report('Taro', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-january-2-2022-no-offer-positive-5a4dea31/', '2022-01');
const JPMORGAN_J5_FE_2021 = report('Taro', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-march-26-2021-no-offer-neutral-22304fb3/', '2021-03');
const JPMORGAN_J14_FULLSTACK_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/6913307/', '2025-07'),
  role: 'Java full-stack engineer',
  location: 'India',
};
// Selected after three rounds; the post does not say whether the offer was taken.
const JPMORGAN_J30_AVP_2024: InterviewProcessSource = {
  ...report('Medium', 'https://khaniqbal.medium.com/jp-morgan-avp-sde3-interview-experience-selected-df2d199dfd20', '2024-06'),
  role: 'AVP, SDE3 (Java)',
  location: 'India',
};

// Agoda. The live careersatagoda.com returns a Cloudflare 403 to automated readers, so the careers pages were read
// from archive captures (the interview-process post captured 2026-04-06, the interview guide 2026-10-19, the hiring
// process post 2025-10-25); the interviewer's guide is on the Agoda Engineering Medium publication. Accounts give the
// country of the Agoda job: Bangkok relocation loops are Thailand even when interviewed from India. An account that
// ended in an offer without saying whether it was accepted carries no outcome.
const AGODA_HOW_WE_HIRE_TECH: InterviewProcessSource = {
  label: 'Agoda interview process page',
  url: 'https://careersatagoda.com/blog/how-we-hire-agodas-tech-team-interview-process/',
  kind: 'official',
  date: '2026-10',
}; // AO1 / AGD-O1
const AGODA_INTERVIEW_GUIDE: InterviewProcessSource = {
  label: 'Agoda interview guide',
  url: 'https://careersatagoda.com/interview/',
  kind: 'official',
  date: '2026-10',
}; // AO4 / AGD-O4
const AGODA_HIRING_PROCESS: InterviewProcessSource = {
  label: 'Agoda hiring process post',
  url: 'https://careersatagoda.com/blog/how-we-hire-agoda-hiring-process/',
  kind: 'official',
  date: '2026-10',
}; // AO5 / AGD-O5
const AGODA_INTERVIEWER_GUIDE: InterviewProcessSource = {
  label: 'Agoda interviewer guide',
  url: 'https://medium.com/agoda-engineering/preparing-for-interview-at-agoda-2c07b7d13ca5',
  kind: 'official',
  date: '2026-10',
}; // AO6 / AGD-O6
const AGODA_A1_BANGKOK_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/8459009/', '2026-07'),
  role: 'Senior software engineer (frontend)',
  location: 'Thailand',
  outcome: 'no offer',
}; // AGD1
const AGODA_A2_GURGAON_2025: InterviewProcessSource = {
  ...report(
    'Code360',
    'https://www.naukri.com/code360/interview-experiences/agoda/agoda-interview-experience-by-brijesh-verma-may-2025-exp-0-2-years',
    '2025-05',
  ),
  role: 'Frontend engineer',
  location: 'India',
  outcome: 'no offer',
}; // AGD8
const AGODA_A3_OFFER_2025: InterviewProcessSource = {
  ...report(
    'Medium',
    'https://kr-viku.medium.com/%EF%B8%8F-my-agoda-interview-journey-from-first-call-to-offer-086385b03d33',
    '2025-09',
  ),
  role: 'Senior software engineer (frontend)',
  location: 'Thailand',
}; // AGD2
const AGODA_A4_STAFF_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/6398233', '2025-02'),
  role: 'Staff frontend engineer',
  location: 'Thailand',
}; // AGD3
const AGODA_A5_FULL_STACK_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7199643/', '2025-09'),
  role: 'Full-stack engineer',
  location: 'Thailand',
}; // AGD4
const AGODA_A7_GURGAON_URL = 'https://www.teamblind.com/post/my-interview-experience-with-agoda-zhhgctzk';
const AGODA_A7_GURGAON_2025: InterviewProcessSource = {
  ...report('Blind', AGODA_A7_GURGAON_URL, '2025-06'),
  role: 'Senior software engineer',
  location: 'India',
  outcome: 'no offer',
}; // AGD7, the poster's own loop
const AGODA_A7_GURGAON_COMMENT = report('Blind comment', AGODA_A7_GURGAON_URL, '2025-06'); // AGD7 (c), commenters on the Staff track
const AGODA_A8_CULTURE_FIT_2025: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/what-can-i-expect-in-agodas-sse-frontend-culture-fit-round-xchtevrv', '2025-06'),
  role: 'Senior frontend engineer',
  location: 'Thailand',
  outcome: 'in progress',
}; // AGD5
const AGODA_A9_HEADCOUNT_2025: InterviewProcessSource = {
  ...report('Medium', 'https://beyondthecode.medium.com/my-agoda-interview-journey-a-candid-reflection-55de22d2276b', '2025-07'),
  role: 'Senior software engineer (front end)',
  location: 'Thailand',
  outcome: 'no offer',
}; // AGD6, archive capture
const AGODA_A12_BANGALORE_2025: InterviewProcessSource = {
  ...report(
    'frontendgeek',
    'https://www.frontendgeek.com/interview-experience/staff-frontend-interview-experience-at-agoda-rejected-thailand-relocation---f13f1824-08d9-4385-a219-269aaeb3d301',
    '2025-07',
  ),
  role: 'Staff software engineer',
  location: 'Thailand',
  outcome: 'no offer',
}; // AGD10
const AGODA_A13_SDE2_2024: InterviewProcessSource = {
  ...report('Substack', 'https://nerddesignlab.substack.com/p/interview-experience-agoda-gurgaon', '2024-10'),
  role: 'Full-stack engineer (SDE2)',
  location: 'India',
}; // AGD9
const AGODA_A16_PREP_GUIDE_2024: InterviewProcessSource = {
  ...report('Blind comment', 'https://www.teamblind.com/post/agoda-bankok-platform-interview-wlgcyzeh', '2024-10'),
  role: 'Front-end or full-stack engineer',
  location: 'Thailand',
}; // AGD12 (p, c)
const AGODA_ROLE = 'Front-end engineers, Senior and Staff';
// Read for the question list (docs/references/jpmorgan-agoda-xai-questions-2026-10.md, ids A6, A32, A33).
const AGODA_A6_FULL_STACK_2024: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5823525/', '2024-09'),
  role: 'Full-stack engineer (frontend developer)',
  outcome: 'no offer',
};
// Agoda's Taro slugs end in "bangkok" or "thailand", which the Taro reader does not map, so these give the role
// themselves and no place; several are probable re-hosts of other reviews.
const AGODA_TARO = 'https://www.jointaro.com/interviews/companies/agoda/experiences';
const AGODA_A32_SWE_2025: InterviewProcessSource = {
  ...report('Taro (approx.)', `${AGODA_TARO}/software-engineer-bangkok-july-1-2025-accepted-offer-positive-01180b45/`, '2025-07'),
  role: 'Software engineer',
};
const AGODA_A33_STAFF_2025 = report('Taro (approx.)', `${AGODA_TARO}/staff-software-engineer-october-1-2025-no-offer-negative-207e9184/`, '2025-10');
// Read 2026-11-13 on Taro for the question list; not in the October research record.
const AGODA_T1_SENIOR_FE_2024: InterviewProcessSource = {
  ...report('Taro', `${AGODA_TARO}/senior-frontend-developer-bangkok-july-30-2024-no-offer-neutral-8ea29b2f/`, '2024-07'),
  role: 'Senior frontend developer',
};
const AGODA_T2_FE_2024: InterviewProcessSource = {
  ...report('Taro (approx.)', `${AGODA_TARO}/front-end-developer-bangkok-december-1-2024-no-offer-neutral-a4b17bfe/`, '2024-12'),
  role: 'Front-end developer',
};
const AGODA_T3_MANILA_2024: InterviewProcessSource = {
  ...report('Taro (approx.)', `${AGODA_TARO}/senior-frontend-developer-manila-manila-september-1-2024-no-offer-neutral-16e560cf/`, '2024-09'),
  role: 'Senior frontend developer',
};
const AGODA_T4_SENIOR_FE_2024: InterviewProcessSource = {
  ...report('Taro (approx.)', `${AGODA_TARO}/senior-front-end-developer-bangkok-october-1-2024-no-offer-positive-7a75aedb/`, '2024-10'),
  role: 'Senior front-end developer',
};
const AGODA_T5_FULL_STACK_2025: InterviewProcessSource = {
  ...report('Taro', `${AGODA_TARO}/full-stack-developer-bangkok-april-11-2025-no-offer-positive-6264706b/`, '2025-04'),
  role: 'Full-stack developer',
};
const AGODA_T6_FULL_STACK_2024: InterviewProcessSource = {
  ...report('Taro', `${AGODA_TARO}/senior-full-stack-software-engineer-thailand-october-3-2024-no-offer-negative-0f06eef4/`, '2024-10'),
  role: 'Senior full-stack software engineer',
};

// Shopee (Sea Group). Research: docs/references/shopee-questions-and-process-2026-10.md. Every label is 28
// characters or shorter because the Evidence cell does not wrap at 360px.

// Official pages. The How we hire page was read in Chrome on 2026-10-21. The campus posting is a third-party
// reprint, posted 2026-04, of a Shenzhen Shopee posting for 2027 frontend development engineers.
const SHOPEE_HOW_WE_HIRE: InterviewProcessSource = {
  label: 'Shopee how we hire page',
  url: 'https://careers.shopee.sg/how-we-hire',
  kind: 'official',
  date: '2026-10',
}; // SH-O1
const SHOPEE_CHINA_CAMPUS_REPRINT: InterviewProcessSource = {
  label: 'China campus posting reprint',
  url: 'https://campus.niuqizp.com/job-vlU5ZCLtN.html',
  kind: 'official',
  date: '2026-04',
}; // SH-O3
// Public reports, all read in full. Re-read 2026-11-13 from the page bodies saved in the 2026-10-21 research session
// (LeetCode is not re-readable now), and SH11 from Nowcoder's content API. Dates are the interview month where the
// account gives one, else the month it was posted. Roles, places and outcomes are what each account gives: the accounts
// in the mainland-China table name no city, so they carry no place, and an offer an account does not say was accepted
// carries no outcome.
const SHOPEE_S1_HCMC_2025: InterviewProcessSource = {
  ...report(
    'Viblo',
    'https://viblo.asia/p/luyen-tap-that-bai-va-thanh-cong-hanh-trinh-cua-anh-dat-hoc-vien-engineer-pro-vao-shopee-EbNVQnP04vR',
    '2025-02',
  ),
  role: 'Frontend engineer',
  location: 'Vietnam',
  outcome: 'accepted offer',
}; // SH1
const SHOPEE_S3_JUEJIN_2020: InterviewProcessSource = {
  ...report('Juejin', 'https://juejin.cn/post/6880722165982429197', '2020-03'),
  role: 'Frontend engineer',
  outcome: 'accepted offer',
}; // SH3
const SHOPEE_S4_NOWCODER_2022: InterviewProcessSource = {
  ...report('Nowcoder', 'https://www.nowcoder.com/discuss/353159545788768256', '2022-04'),
  role: 'Frontend engineer (social hire)',
  outcome: 'no offer',
}; // SH4
const SHOPEE_S6_SG_CAMPUS_2020: InterviewProcessSource = {
  ...report('Nowcoder', 'https://www.nowcoder.com/discuss/495162', '2020-09'),
  role: 'Frontend engineer (campus hire)',
  location: 'Singapore',
}; // SH6
const SHOPEE_S7_CAMPUS_2020: InterviewProcessSource = {
  ...report('Nowcoder', 'https://www.nowcoder.com/discuss/463919', '2020-07'),
  role: 'Frontend engineer (campus hire)',
}; // SH7
const SHOPEE_S8_CAMPUS_2020: InterviewProcessSource = {
  ...report('Nowcoder', 'https://www.nowcoder.com/discuss/353156107927494656', '2020-03'),
  role: 'Frontend engineer (campus hire)',
}; // SH8
const SHOPEE_S9_CAMPUS_2021: InterviewProcessSource = {
  ...report('Nowcoder', 'https://www.nowcoder.com/discuss/353157728422010880', '2021-03'),
  role: 'Frontend engineer (campus hire)',
  outcome: 'no offer',
}; // SH9
const SHOPEE_S10_CAMPUS_2019: InterviewProcessSource = {
  ...report('Nowcoder', 'https://www.nowcoder.com/discuss/247729', '2019-09'),
  role: 'Frontend engineer (campus hire)',
}; // SH10
const SHOPEE_S36_MEDIUM_2020: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@g4691821/2020-new-grad-面試心得-3-shopee-eaabf411c35b', '2020-04'),
  role: 'Backend engineer (new graduate)',
  location: 'Singapore',
}; // SH36
const SHOPEE_S37_MEDIUM_2022: InterviewProcessSource = {
  ...report('Medium', 'https://medium.com/@julianachang/2022-新鮮人軟體工程師面試心得-yahoo-foodpanda-shopee-dell-d576d6c004b6', '2022-01'),
  role: 'Backend engineer (new graduate)',
  location: 'Singapore',
  outcome: 'no offer',
}; // SH37
const SHOPEE_S39_PTT_2021: InterviewProcessSource = {
  ...report('PTT', 'https://www.ptt.cc/bbs/Soft_Job/M.1613320989.A.BD5.html', '2021-02'),
  role: 'Platform engineer (new graduate)',
  location: 'Singapore',
  outcome: 'accepted offer',
}; // SH39
// SH41, a 2020 Shenzhen backend campus timeline hosted on GitHub (a Nowcoder test on 28 March, rounds on 3 and
// 10 April, HR on 15 April), is not cited because the spec bans github.com as a source host.
const SHOPEE_FE_ROLE = 'Front-end engineers';
const SHOPEE_S5_TAIPEI_2021: InterviewProcessSource = {
  ...report('GoodJob', 'https://www.goodjob.life/experiences/5ff7488233dedf001238f46c', '2021-01'),
  role: 'Frontend engineer',
  location: 'Taiwan',
};
const SHOPEE_S11_CAMPUS_2020: InterviewProcessSource = {
  ...report('Nowcoder', 'https://www.nowcoder.com/discuss/353156758342410240', '2020-08'),
  role: 'Frontend engineer (campus hire)',
};
// The 2023 account does not say the role was frontend; it is cited for the Taipei stages only.
const SHOPEE_S23_TAIPEI_2023: InterviewProcessSource = {
  ...report('GoodJob', 'https://www.goodjob.life/experiences/6a38a65e0214e43e1c1c7ce6', '2023-06'),
  role: 'Senior software engineer',
  location: 'Taiwan',
};
// LeetCode posts from backend and unstated roles, kept for their algorithm and data-structure problems only.
const SHOPEE_S30_SINGAPORE_2021: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/1262091/', '2021-04'),
  location: 'Singapore',
};
const SHOPEE_S31_OA_2020: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/889293/', '2020-10'),
  role: 'Backend engineer',
  location: 'Singapore',
};
// Titled "Shopee/Garena/SeaGroup Online Assessment Questions"; it names no role or place.
const SHOPEE_S32_OA_2020 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/510525/', '2020-02');
const SHOPEE_S33_OA_2021: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/1152602/', '2021-04'),
  location: 'Singapore',
};
const SHOPEE_S34_2022 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/2016783/', '2022-05');

// OpenAI's interview guide answers 403 to automated clients; its sentences were read on the Wayback Machine copy
// of 2026-10-09. Blind posts written before the interview are cited only for the plan the recruiter gave.
const OPENAI_INTERVIEW_GUIDE = official('OpenAI interview guide', 'https://openai.com/interview-guide/');
const OPENAI_TARO = 'https://www.jointaro.com/interviews/companies/openai/experiences';
const OPENAI_OA1_SENIOR_FE_2024 = report(
  'Taro',
  `${OPENAI_TARO}/senior-frontend-software-engineer-united-states-may-30-2024-no-offer-negative-32a807aa/`,
  '2024-05',
);
// Replaces the existing OPENAI_OA2_FE_2024 (same URL and date): the poster gives the role only.
const OPENAI_OA2_FE_2024: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/preparing-for-openai-frontend-engineer-interview-hb1zxdy6', '2024-11'),
  role: 'Frontend engineer',
};
const OPENAI_OA3_COMMENT_2023 = report('Blind comment', 'https://www.teamblind.com/post/openai-front-end-interview-aqcvdppv', '2023-08');
const OPENAI_OA4_SWE_2023: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/openai-full-stack-swe-interview-experience-4zgmdu7u', '2023-02'),
  role: 'Full-stack software engineer',
};
const OPENAI_OA5_PLAN_2025 = report('Blind (recruiter plan)', 'https://www.teamblind.com/post/open-ai-frontend-interview-dxwheejy', '2025-04');
const OPENAI_OA6_PLAN_2026: InterviewProcessSource = {
  ...report('Blind (recruiter plan)', 'https://www.teamblind.com/post/openai-agentic-code-interview-up8jhuiq', '2026-10'),
  role: 'Senior software engineer (mainly frontend)',
};
const OPENAI_OA7_FE_2024 = report(
  'Taro (approx.)',
  `${OPENAI_TARO}/front-end-developer-san-francisco-ca-december-1-2024-no-offer-neutral-550d792a/`,
  '2024-12',
);
const OPENAI_ROLE = 'Frontend candidates';
// Question-list sources, read 2026-11-13: software engineer and full-stack loops, kept for their frontend and general
// questions. OA8 is the Blind post the 2026-10-15 sources review cited for a map of tuples; its poster gives no role.
const OPENAI_OA8_SCREEN_2024: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Interview-Experience-at-Open-AI-LczeSqph', '2024-04'),
  outcome: 'no offer',
};
// PracHub marks this account "Curated and edited by PracHub"; the interview month is the page's own.
const OPENAI_OA9_SWE_2026: InterviewProcessSource = {
  ...report(
    'PracHub (curated)',
    'https://prachub.com/interview-experiences/openai-software-engineer-interview-experience-chatgpt-system-design-vector-store-and-a-scheduler-debugging-round-rejected',
    '2026-07',
  ),
  role: 'Software engineer',
  outcome: 'no offer',
};
// The Aced page gives a relative date; April 2025 is the "Interviewed" month on Aced's OpenAI listing.
const OPENAI_OA10_FULLSTACK_2025: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/openai-software-engineer-interview-5a7d13', '2025-04'),
  role: 'Full-stack engineer, Applied (L5)',
  location: 'United States',
  outcome: 'no offer',
};
// Aced's question page counts four reported interviews (two software engineers, an AI engineer and a frontend
// engineer) and shares one account, OA10's.
const OPENAI_PLAYGROUND_BANK: InterviewProcessSource = {
  ...report('Aced question page', 'https://www.aced.io/questions/5827/design-openai-playground', '2026-11'),
  reportForm: 'question-bank',
};

// Netflix publishes a process only for new graduates and interns. Netflix-tagged Blind commenters say teams run
// their own loops, so every experienced-hire row names the account it comes from.
const NETFLIX_NEW_GRADS = official('Netflix new grad page', 'https://jobs.netflix.com/careers/new-grads');
const NETFLIX_INTERNSHIPS = official('Netflix internship page', 'https://jobs.netflix.com/careers/internships');
const NETFLIX_TARO = 'https://www.jointaro.com/interviews/companies/netflix/experiences';
const NETFLIX_NF2_SENIOR_FE_2020 = report(
  'Taro (approx.)',
  `${NETFLIX_TARO}/senior-front-end-engineer-los-angeles-ca-october-1-2020-no-offer-positive-86100381/`,
  '2020-10',
);
// Replaces the existing NETFLIX_NF3_SCREEN_2025 (same URL and date, now with who reported it).
const NETFLIX_NF3_SCREEN_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7421643/', '2025-12'),
  role: 'Frontend engineer (L4 or L5)',
  location: 'Poland',
  outcome: 'no offer',
};
const NETFLIX_NF4_COMMENT_2024 = report('Blind comment', 'https://www.teamblind.com/post/netflix-frontend-onsite-interview-kodnou42', '2024-01');
const NETFLIX_NF5_PLAN_2024 = report('Blind (recruiter plan)', 'https://www.teamblind.com/post/interview-rounds-for-netflix-vyxxuxco', '2024-02');
const NETFLIX_NF6_FE_2022 = report('Blind', 'https://www.teamblind.com/post/Netflix-front-end-interview-N0UJeDug', '2022-03');
const NETFLIX_NF8_SENIOR_FE_2021 = report(
  'Taro (approx.)',
  `${NETFLIX_TARO}/senior-frontend-engineer-san-jose-ca-august-1-2021-no-offer-negative-5771c678/`,
  '2021-08',
);
// Read 2026-11-09 for the culture decoder: a half day of behavioural interviews and the question the final round asked.
const NETFLIX_NF9_SENIOR_UI_2020 = report(
  'Taro (approx.)',
  `${NETFLIX_TARO}/senior-ui-developer-united-states-november-1-2020-no-offer-positive-285dbb68/`,
  '2020-11',
);
// Re-read 2026-11-13 for the question list. NF1 is also the guide's own source (netflix-preview-content.ts), spelled
// the same way so the page counts it once. NF3 is not re-read: LeetCode now refuses our tools, so its role, place and
// outcome come from docs/references/company-interview-processes-2026-10.md (read through GraphQL on 2026-10-22).
const NETFLIX_NF1_SENIOR_FE_2024 = report(
  'Taro (approx.)',
  `${NETFLIX_TARO}/senior-frontend-engineer-warsaw-masovia-november-1-2024-no-offer-negative-c999399f/`,
  '2024-11',
);
// Aced experience pages give relative dates; each month is the "Interviewed" month on Aced's Netflix listing, read
// 2026-11-13. NF10 and NF11 are both L4 UI loops in the United States from September 2024 with five onsite rounds;
// their screens differ, so they count as two accounts. NF11 says "Got offer" without saying whether it was accepted.
const NETFLIX_NF10_UI_L4_2024: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/netflix-software-engineer-interview-8a01a3', '2024-09'),
  role: 'UI engineer (L4)',
  location: 'United States',
};
const NETFLIX_NF11_UI_L4_2024: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/netflix-software-engineer-interview-622c86', '2024-09'),
  role: 'UI software engineer (L4)',
  location: 'United States',
};
const NETFLIX_NF12_FULLSTACK_2024: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/netflix-senior-software-engineer-interview-de66d8', '2024-12'),
  role: 'Senior full-stack engineer (L5)',
  location: 'United States',
};

// ElevenLabs accounts cover full-stack, frontend-leaning titles. The two Aced entries show relative dates only,
// so their dates are the interview months the pages implied when read.
const ELEVENLABS_CAREERS_FAQ = official('ElevenLabs careers FAQ', 'https://elevenlabs.io/careers');
const ELEVENLABS_EL1_SENIOR_2026: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/eleven-labs-senior-frontend-engineer-interview-925c04', '2026-07'),
  role: 'Senior full-stack engineer (frontend-leaning)',
  location: 'United Kingdom',
  outcome: 'in progress',
};
const ELEVENLABS_EL2_FE_2025: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/eleven-labs-frontend-engineer-interview-c79e72', '2025-11'),
  role: 'Full-stack engineer (frontend-leaning)',
  location: 'United States',
  outcome: 'no offer',
};
const ELEVENLABS_TARO = 'https://www.jointaro.com/interviews/companies/elevenlabs/experiences';
const ELEVENLABS_EL3_2024 = report(
  'Taro (approx.)',
  `${ELEVENLABS_TARO}/full-stack-engineer-united-states-august-1-2024-no-offer-positive-675ce47d/`,
  '2024-08',
);
const ELEVENLABS_EL4_2024 = report(
  'Taro (approx.)',
  `${ELEVENLABS_TARO}/full-stack-engineer-poland-august-1-2024-accepted-offer-positive-766f1de3/`,
  '2024-08',
);
const ELEVENLABS_EL5_2025 = report(
  'Taro (approx.)',
  `${ELEVENLABS_TARO}/full-stack-engineer-united-kingdom-may-1-2025-accepted-offer-positive-8ac03948/`,
  '2025-05',
);
// Read 2026-11-03 for the question list (docs/references/elevenlabs-questions-and-process-2026-11.md keeps the quotes).
// The Aced bank marks each item "I was asked this" without a round or a date of its own.
const ELEVENLABS_BANK: InterviewProcessSource = {
  ...report('Aced question bank', 'https://www.aced.io/guides/elevenlabs-software-engineer-interview/questions', '2026-10'),
  reportForm: 'question-bank',
};
const ELEVENLABS_EL6_2026 = report('Taro', `${ELEVENLABS_TARO}/full-stack-engineer-october-27-2026-no-offer-negative-c63c5ddb/`, '2026-10');
const ELEVENLABS_EL7_SENIOR_2026 = report('Taro', `${ELEVENLABS_TARO}/senior-software-engineer-july-7-2026-no-offer-positive-dcb455b0/`, '2026-07');
const ELEVENLABS_EL8_SENIOR_2026 = report(
  'Taro',
  `${ELEVENLABS_TARO}/senior-software-engineer-new-york-new-york-january-24-2026-no-offer-neutral-ae62f4d3/`,
  '2026-01',
);
const ELEVENLABS_EL9_SENIOR_2025 = report(
  'Taro (approx.)',
  `${ELEVENLABS_TARO}/senior-software-engineer-germany-january-1-2025-no-offer-negative-e52ed2a9/`,
  '2025-01',
);
const ELEVENLABS_EL16_2026 = report('Taro', `${ELEVENLABS_TARO}/software-engineer-london-england-march-9-2026-no-offer-neutral-9f916c8f/`, '2026-03');
const ELEVENLABS_EL20_GROWTH_2026 = report('Taro', `${ELEVENLABS_TARO}/growth-engineer-february-1-2026-accepted-offer-positive-b700cab8/`, '2026-02');
const ELEVENLABS_EL22_2024 = report('Taro (approx.)', `${ELEVENLABS_TARO}/software-engineer-spain-may-1-2024-no-offer-neutral-fec0ec2e/`, '2024-05');
const ELEVENLABS_EL23_2024 = report(
  'Taro (approx.)',
  `${ELEVENLABS_TARO}/backend-engineer-singapore-december-1-2024-no-offer-negative-d4322bee/`,
  '2024-12',
);
const ELEVENLABS_EL10_2024 = report(
  'Taro',
  `${ELEVENLABS_TARO}/full-stack-engineer-netherlands-november-4-2024-accepted-offer-positive-1e936674/`,
  '2024-11',
);
const ELEVENLABS_EL13_2024 = report('Taro', `${ELEVENLABS_TARO}/full-stack-engineer-finland-august-12-2024-accepted-offer-positive-3d462e8c/`, '2024-08');
const ELEVENLABS_EL14_2026 = report(
  'Taro',
  `${ELEVENLABS_TARO}/full-stack-software-engineer-london-england-may-29-2026-no-offer-neutral-e6e7dc8d/`,
  '2026-05',
);
const ELEVENLABS_EL12_2026 = report('Taro', `${ELEVENLABS_TARO}/fullstack-software-engineer-september-7-2026-no-offer-negative-09a41a00/`, '2026-09');
const ELEVENLABS_EL28_2025 = report('Taro', `${ELEVENLABS_TARO}/software-engineer-london-england-november-20-2025-no-offer-positive-50679eb6/`, '2025-11');
const ELEVENLABS_EL34_2025 = report('Taro', `${ELEVENLABS_TARO}/engineer-united-kingdom-august-16-2025-no-offer-negative-96661ac8/`, '2025-08');
const ELEVENLABS_EC3_2025: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/eleven-labs-software-engineer-interview-8e1b37', '2025-05'),
  role: 'Software engineer (full-stack)',
  location: 'United States',
  outcome: 'no offer',
};
const ELEVENLABS_EC4_2026: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/eleven-labs-software-engineer-interview-605512', '2026-07'),
  role: 'Software engineer',
  location: 'India',
  outcome: 'in progress',
};
const ELEVENLABS_EC5_FDE_2025: InterviewProcessSource = {
  ...report('Aced', 'https://www.aced.io/experiences/eleven-labs-solutions-architect-interview-ce0689', '2025-08'),
  role: 'Forward deployed engineer',
  location: 'United Kingdom',
  outcome: 'no offer',
};
// PracHub's page states the three problems only in its own paraphrase, so their rows paraphrase too.
const ELEVENLABS_EC6_2026: InterviewProcessSource = {
  ...report(
    'PracHub (curated)',
    'https://prachub.com/interview-experiences/elevenlabs-software-engineer-interview-experience-three-question-oa-with-a-surprise-2-minute-ai-follow-up',
    '2026-09',
  ),
  role: 'Software engineer',
};

// Waymo's hiring page gives the stage structure. The one complete frontend loop is a PracHub account that the
// site marks as curated and edited, so its label says so. Re-read 2026-11-13 for the question list: the PracHub
// account gives no country, and the Blind commenter gives no role, country or outcome.
const WAYMO_HOW_WE_HIRE = official('Waymo how we hire page', 'https://careers.withwaymo.com/how-we-hire');
const WAYMO_WM1_SENIOR_FE_2026: InterviewProcessSource = {
  ...report(
    'PracHub (curated)',
    'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process',
    '2026-05',
  ),
  role: 'Senior frontend engineer (simulation team)',
  outcome: 'no offer',
};
// Role and outcome as the research record gives them (read 2026-10-22 through LeetCode's GraphQL API); no country.
const WAYMO_WM2_SWE_2026: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7949696/', '2026-04'),
  role: 'Software engineer (fleet response)',
  outcome: 'no offer',
};
const WAYMO_WM3_COMMENT_2023 = report('Blind comment', 'https://www.teamblind.com/post/waymo-frontend-web-interview-xcpohaau', '2023-03');
const WAYMO_WM4_INTERN_2022 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/waymo/experiences/software-engineering-intern-united-states-september-12-2022-no-offer-positive-279c47ab/',
  '2022-09',
);

// Anduril accounts are all US. Taro reports are Glassdoor re-hosts; the 2022 and 2025 ones carry placeholder dates.
const ANDURIL_EARLY_CAREERS = official('Anduril early careers FAQ', 'https://www.anduril.com/early-careers');
const ANDURIL_TARO = 'https://www.jointaro.com/interviews/companies/anduril/experiences';
const ANDURIL_AN9_OFFER_2022 = report(
  'Taro (approx.)',
  `${ANDURIL_TARO}/frontend-software-engineer-costa-mesa-ca-september-1-2022-accepted-offer-positive-9ee69754/`,
  '2022-09',
);
const ANDURIL_AN10_INTERN_2023 = report(
  'Taro',
  `${ANDURIL_TARO}/software-engineerinternship-costa-mesa-ca-july-5-2023-accepted-offer-positive-dbb3fa63/`,
  '2023-07',
);
const ANDURIL_AN11_FE_FOCUS_2024 = report(
  'Taro',
  `${ANDURIL_TARO}/software-engineer-united-states-december-24-2024-no-offer-positive-64f81210/`,
  '2024-12',
);
const ANDURIL_AN12_CLASS_2025 = report(
  'Taro (approx.)',
  `${ANDURIL_TARO}/software-engineer-seattle-wa-january-1-2025-no-offer-positive-c481c905/`,
  '2025-01',
);
// Re-read 2026-11-13 for the question list. Two Blind threads hold two speakers each, so each speaker has a constant.
const ANDURIL_AN1_ONSITE_2025: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/front-end-interviews-at-anduril-3hihnhlv', '2025-04'),
  role: 'Front-end engineer',
  outcome: 'no offer',
};
const ANDURIL_AN2_OFFER_2023: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/anduril-front-end-interviews-bugagvca', '2023-10'),
  role: 'Front-end engineer',
};
// The commenter states no title, so the row shows no role.
const ANDURIL_AN6_SCREEN_2025 = report('Blind comment', 'https://www.teamblind.com/post/anduril-front-end-interview-yt3cx1bt', '2025-03');
// A commenter in the AN2 thread with a front-end onsite in Costa Mesa: the screen task, then the onsite in another thread.
const ANDURIL_AN2_FOLDER_2024: InterviewProcessSource = {
  ...report('Blind comment', 'https://www.teamblind.com/post/anduril-front-end-interviews-bugagvca', '2024-03'),
  role: 'Front-end engineer',
  location: 'United States',
};
const ANDURIL_AN4_ONSITE_2024: InterviewProcessSource = {
  ...report('Blind comment', 'https://www.teamblind.com/post/anduril-frontend-interview-eg52tpe3', '2024-04'),
  role: 'Front-end engineer',
  location: 'United States',
};
// One candidate who cleared the frontend interview, commenting in two threads.
const ANDURIL_AN4_CLEARED_2024 = report('Blind comment', 'https://www.teamblind.com/post/anduril-frontend-interview-eg52tpe3', '2024-05');
const ANDURIL_AN5_TIP_2024 = report('Blind comment', 'https://www.teamblind.com/post/anduril-frontend-interview-tip-vo3xz40g', '2024-05');
// General software engineer loops, cited only by the question lists.
const ANDURIL_AN30_SWE_2024 = report('Taro', `${ANDURIL_TARO}/software-engineer-costa-mesa-ca-april-13-2024-no-offer-positive-ad87266b/`, '2024-04');
// Boston is missing from the reporter's Taro place table, so this entry gives its role and country.
const ANDURIL_AN31_SWE_2025: InterviewProcessSource = {
  ...report('Taro', `${ANDURIL_TARO}/software-engineer-boston-ma-august-19-2025-no-offer-neutral-3ee554cc/`, '2025-08'),
  role: 'Software engineer',
  location: 'United States',
};
const ANDURIL_AN33_SWE_2025 = report('Taro', `${ANDURIL_TARO}/software-engineer-october-16-2025-no-offer-positive-b0151de7/`, '2025-10');
const ANDURIL_AN34_SWE_2023: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Anduril-Software-Interview-SUOhG3nC', '2023-04'),
  role: 'Software engineer',
  outcome: 'no offer',
};
// Two commenters on a thread about the one-hour tech screen; the first dates theirs "about a year ago".
const ANDURIL_AN35_DP_2022 = report('Blind comment (approx.)', 'https://www.teamblind.com/post/anduril-interview---experiences-AEsA1VUQ', '2022-04');
const ANDURIL_AN35_BFS_2023 = report('Blind comment', 'https://www.teamblind.com/post/anduril-interview---experiences-AEsA1VUQ', '2023-04');

// GitLab publishes the frontend loop in its handbook; Taro reports are Glassdoor re-hosts, most with placeholder dates.
const GITLAB_JOB_FAMILY = official('GitLab frontend job family', 'https://handbook.gitlab.com/job-description-library/engineering/development/frontend/');
const GITLAB_TECHNICAL_INTERVIEW = official('GitLab technical interview', 'https://handbook.gitlab.com/handbook/hiring/interviewing/technical/');
const GITLAB_CANDIDATE_FAQ = official('GitLab candidate FAQ', 'https://handbook.gitlab.com/handbook/hiring/candidate-faq/');
const GITLAB_TARO = 'https://www.jointaro.com/interviews/companies/gitlab/experiences';
const GITLAB_GL1_FE_2025 = report('Taro', `${GITLAB_TARO}/frontend-developer-india-october-18-2025-no-offer-positive-b6eb8eea/`, '2025-10');
const GITLAB_GL3_FE_2024 = report('Taro (approx.)', `${GITLAB_TARO}/front-end-engineer-canada-march-1-2024-no-offer-negative-fbb295a4/`, '2024-03');
const GITLAB_GL4_FE_2024 = report('Taro (approx.)', `${GITLAB_TARO}/front-end-engineer-united-states-february-1-2024-no-offer-neutral-031df9b0/`, '2024-02');
const GITLAB_GL7_FULLSTACK_2022 = report('Taro (approx.)', `${GITLAB_TARO}/full-stack-engineer-india-july-1-2022-no-offer-negative-6c945f7b/`, '2022-07');
const GITLAB_GL10_FE_2021 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-united-states-december-1-2021-no-offer-positive-f05a7545/`, '2021-12');
const GITLAB_GL16_FE_2020 = report(
  'Taro (approx.)',
  `${GITLAB_TARO}/frontend-developer-amsterdam-north-holland-february-1-2020-no-offer-negative-14a19a13/`,
  '2020-02',
);
const GITLAB_GL18_FULLSTACK_2020 = report(
  'Taro (approx.)',
  `${GITLAB_TARO}/full-stack-engineer-san-francisco-california-january-1-2020-accepted-offer-positive-6152258b/`,
  '2020-01',
);
const GITLAB_GL20_FE_2019 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-united-states-december-1-2019-accepted-offer-positive-8e8c9001/`, '2019-12');
const GITLAB_GL21_FE_2019 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-seattle-washington-december-1-2019-accepted-offer-positive-b630c835/`, '2019-12');
const GITLAB_GL24_FE_2019 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-montreal-quebec-november-1-2019-accepted-offer-positive-8b61c9a4/`, '2019-11');
const GITLAB_GL27_FE_2019 = report('Taro', `${GITLAB_TARO}/frontend-engineer-united-kingdom-august-5-2019-no-offer-negative-d1e1bab6/`, '2019-08');
const GITLAB_GL28_FE_2019 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-australia-july-1-2019-accepted-offer-positive-0dcaf872/`, '2019-07');
const GITLAB_GL35_FE_2018 = report('Taro (approx.)', `${GITLAB_TARO}/front-end-engineer-saint-louis-missouri-june-1-2018-accepted-offer-positive-0a133d02/`, '2018-06');
const GITLAB_GL44_FULLSTACK_2025 = report('Medium', 'https://medium.com/@vedantj03/how-i-got-into-gitlab-an-open-source-journey-7ecdad137307', '2025-04');
// Added 2026-11-13 for the question list; every Taro page here was re-read that day. Places the Taro reporter does not
// map (Paraguay, Texas, Israel, Colorado, Dublin, Cyprus) carry an authored role and country; the two engineering
// manager accounts carry an authored role, since the reporter expects a role ending in a job word.
const GITLAB_GL2_FE_2025 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-developer-canada-july-1-2025-no-offer-neutral-0819a05d/`, '2025-07');
const GITLAB_GL6_FE_2022 = report('Taro', `${GITLAB_TARO}/frontend-developer-australia-november-24-2022-no-offer-neutral-5579e0b8/`, '2022-11');
// Cited 2026-11-13 from the GitLab record: GL9 and GL5 met a hiring manager or the director before any technical round,
// and GL11's loop added a quiz on frontend trivia. The reporter would read GL11's Amsterdam into the role, so it carries
// an authored role and country.
const GITLAB_GL9_SENIOR_FE_2022 = report('Taro (approx.)', `${GITLAB_TARO}/senior-frontend-developer-united-kingdom-march-1-2022-no-offer-negative-cbc54aec/`, '2022-03');
const GITLAB_GL5_FULLSTACK_2023 = report('Taro', `${GITLAB_TARO}/full-stack-developer-united-states-january-18-2023-no-offer-positive-c1d15e3a/`, '2023-01');
const GITLAB_GL11_SENIOR_2021: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/senior-software-engineer-amsterdam-netherlands-december-1-2021-no-offer-positive-c052e208/`, '2021-12'),
  role: 'Senior software engineer',
  location: 'Netherlands',
};
const GITLAB_GL8_FE_2022: InterviewProcessSource = {
  ...report('Taro', `${GITLAB_TARO}/frontend-developer-paraguay-may-3-2022-no-offer-positive-0f872bc9/`, '2022-05'),
  role: 'Frontend developer',
  location: 'Paraguay',
};
const GITLAB_GL12_FE_2021: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/fronted-engineer-dallas-texas-august-1-2021-no-offer-negative-93c15bef/`, '2021-08'),
  role: 'Frontend engineer',
  location: 'United States',
};
const GITLAB_GL13_FE_2020: InterviewProcessSource = {
  ...report('Taro', `${GITLAB_TARO}/front-end-developer-israel-october-27-2020-no-offer-negative-5ddef8c6/`, '2020-10'),
  role: 'Front-end developer',
  location: 'Israel',
};
const GITLAB_GL14_FULLSTACK_2020: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/full-stack-web-developer-denver-colorado-october-1-2020-accepted-offer-positive-8e27eabe/`, '2020-10'),
  role: 'Full-stack web developer',
  location: 'United States',
};
const GITLAB_GL15_FE_2020 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-united-states-march-1-2020-no-offer-negative-f66d2219/`, '2020-03');
const GITLAB_GL17_FE_2020 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-germany-january-1-2020-no-offer-negative-faafe0e4/`, '2020-01');
const GITLAB_GL26_FE_2019 = report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-united-states-october-1-2019-no-offer-negative-85ec2e9d/`, '2019-10');
const GITLAB_GL30_SENIOR_2019 = report('Taro (approx.)', `${GITLAB_TARO}/senior-frontend-engineer-united-kingdom-april-1-2019-accepted-offer-positive-0ed9be90/`, '2019-04');
const GITLAB_GL31_SENIOR_2019: InterviewProcessSource = {
  ...report('Taro', `${GITLAB_TARO}/senior-front-end-developer-dublin-leinster-april-18-2019-no-offer-negative-bd947d4b/`, '2019-04'),
  role: 'Senior front-end developer',
  location: 'Ireland',
};
const GITLAB_GL32_FE_2019 = report('Taro (approx.)', `${GITLAB_TARO}/front-end-engineer-india-march-1-2019-no-offer-negative-488bc8ff/`, '2019-03');
const GITLAB_GL33_SENIOR_2019: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/senior-front-end-engineer-cyprus-march-1-2019-no-offer-negative-d0ee6c70/`, '2019-03'),
  role: 'Senior front-end engineer',
  location: 'Cyprus',
};
const GITLAB_GL34_FE_2019: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/frontend-engineer-austin-texas-march-1-2019-no-offer-neutral-48782c3c/`, '2019-03'),
  role: 'Frontend engineer',
  location: 'United States',
};
const GITLAB_GL37_FE_2018: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/front-end-developer-paraguay-february-1-2018-no-offer-neutral-470ce452/`, '2018-02'),
  role: 'Front-end developer',
  location: 'Paraguay',
};
// Engineering manager candidates; only their frontend questions are used.
const GITLAB_GLA1_EM_FE_2018: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/engineering-manager-united-states-march-1-2018-no-offer-negative-a9778509/`, '2018-03'),
  role: 'Engineering manager (frontend)',
};
const GITLAB_GLA2_EM_2019: InterviewProcessSource = {
  ...report('Taro (approx.)', `${GITLAB_TARO}/engineering-manager-germany-march-1-2019-no-offer-negative-11a35430/`, '2019-03'),
  role: 'Engineering manager',
};

// Capital One frontend accounts are Taro re-hosts of Glassdoor reviews with placeholder dates; the generic loop
// and the official page are written for other roles, so they only back the shared stages.
const CAPITALONE_AI_ML_GUIDE = official('Capital One AI and ML guide', 'https://www.capitalonecareers.com/insider-tips-for-ai-and-machine-learning-interviews-tech-101-cdev');
const CAPITALONE_WHAT_TO_EXPECT = official('Capital One interview guide', 'https://www.capitalonecareers.com/what-to-expect-during-your-capital-one-interview-students-101');
const CAPITALONE_TARO = 'https://www.jointaro.com/interviews/companies/capital-one/experiences';
const CAPITALONE_CO1_LEAD_2024 = report('Taro (approx.)', `${CAPITALONE_TARO}/lead-software-engineer-front-end-mclean-va-october-1-2024-no-offer-positive-6427acda/`, '2024-10');
const CAPITALONE_CO2_SENIOR_2024 = report('Taro (approx.)', `${CAPITALONE_TARO}/senior-frontend-engineer-washington-dc-july-1-2024-no-offer-neutral-3e4968d4/`, '2024-07');
const CAPITALONE_CO3_SENIOR_2024 = report('Taro (approx.)', `${CAPITALONE_TARO}/senior-frontend-engineer-chicago-il-august-1-2024-no-offer-negative-958c2993/`, '2024-08');
const CAPITALONE_CO4_SENIOR_2024 = report('Taro (approx.)', `${CAPITALONE_TARO}/senior-frontend-engineer-united-states-november-1-2024-no-offer-neutral-52591f09/`, '2024-11');
const CAPITALONE_CO5_SENIOR_2023 = report(
  'Taro (approx.)',
  `${CAPITALONE_TARO}/senior-web-front-end-engineer-mclean-va-february-1-2023-no-offer-negative-b9f0a15e/`,
  '2023-02',
);
const CAPITALONE_CO6_FRONTEND_2022 = report(
  'Taro (approx.)',
  `${CAPITALONE_TARO}/senior-software-engineer-united-states-august-1-2022-accepted-offer-neutral-9d67e812/`,
  '2022-08',
);
const CAPITALONE_CO7_LEAD_2022 = report('Taro (approx.)', `${CAPITALONE_TARO}/front-end-lead-plano-tx-august-1-2022-declined-offer-neutral-c94a48a3/`, '2022-08');
const CAPITALONE_CO9_SENIOR_2024 = report('Taro (approx.)', `${CAPITALONE_TARO}/senior-front-end-developer-mclean-va-may-1-2024-no-offer-positive-3ea6b6f9/`, '2024-05');
// Question-list sources. Frontend-titled Taro accounts from 2020 and 2021, then full-stack and general engineering
// loops on Taro, Blind and LeetCode, kept for their frontend and general questions only. Read 2026-10-23
// (docs/references/capital-one-questions-and-process-2026-10.md keeps the quotes).
const CAPITALONE_CO12_SENIOR_2020 = report('Taro (approx.)', `${CAPITALONE_TARO}/senior-frontend-engineer-mclean-va-september-1-2020-no-offer-neutral-25b15c66/`, '2020-09');
const CAPITALONE_CO14_FE_2020 = report('Taro', `${CAPITALONE_TARO}/front-end-developer-san-francisco-ca-march-11-2020-no-offer-positive-918799ef/`, '2020-03');
const CAPITALONE_CO15_SENIOR_2021 = report('Taro', `${CAPITALONE_TARO}/senior-front-end-developer-canada-september-30-2021-no-offer-positive-0676ea25/`, '2021-09');
// "A front-end-focused engineer" on a full-stack loop; the slug's "full-stack" suffix would end the role.
const CAPITALONE_CO16_FULLSTACK_2025: InterviewProcessSource = {
  ...report('Taro (approx.)', `${CAPITALONE_TARO}/senior-software-engineer-full-stack-united-states-may-1-2025-no-offer-neutral-ba6cae5b/`, '2025-05'),
  role: 'Senior full-stack software engineer',
};
// Rocklin, CA is missing from the reporter's Taro place table.
const CAPITALONE_CO20_WEB_2022: InterviewProcessSource = {
  ...report('Taro (approx.)', `${CAPITALONE_TARO}/web-masterfull-stack-web-developer-rocklin-ca-march-1-2022-no-offer-neutral-e3966ca7/`, '2022-03'),
  role: 'Web master and full-stack web developer',
  location: 'United States',
};
const CAPITALONE_CO59_LEAD_2023 = report('Taro (approx.)', `${CAPITALONE_TARO}/lead-software-engineer-new-york-ny-april-1-2023-declined-offer-negative-1fe8f5c0/`, '2023-04');
// The slug misspells "engineer".
const CAPITALONE_CO60_SENIOR_2024: InterviewProcessSource = {
  ...report('Taro', `${CAPITALONE_TARO}/senior-software-enginner-united-states-july-26-2024-no-offer-positive-eb965594/`, '2024-07'),
  role: 'Senior software engineer',
};
// Dallas, TX is missing from the reporter's Taro place table.
const CAPITALONE_CO62_LEAD_2025: InterviewProcessSource = {
  ...report('Taro (approx.)', `${CAPITALONE_TARO}/lead-software-engineer-dallas-tx-july-1-2025-accepted-offer-positive-3d3b2e43/`, '2025-07'),
  role: 'Lead software engineer',
  location: 'United States',
};
// Blind: the poster's own loop (CO30, CO32) or commenters' own loops on someone else's plan (CO34, CO35, CO49). CO34's
// three commenters (Capital One, Microsoft and JPMorgan Chase badges) give no role, so one constant covers them.
const CAPITALONE_CO30_LEAD_2023: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/Capital-One-interview-TLCMvyqY', '2023-02'),
  role: 'Lead software engineer',
  location: 'United States',
};
const CAPITALONE_CO32_SENIOR_LEAD_2026: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/capital-one-senior-lead-software-engineer-interview-power-day-experience-ojk3afdm', '2026-10'),
  role: 'Senior lead software engineer',
  outcome: 'no offer',
};
const CAPITALONE_CO34_COMMENTS_2026 = report('Blind comment', 'https://www.teamblind.com/post/cap1-power-day-tips-senior-swe-eh33amqa', '2026-02');
const CAPITALONE_CO35_COMMENT_2025 = report('Blind comment', 'https://www.teamblind.com/post/Capital-One-Power-Day-info-tjm3vr5C', '2025-01');
const CAPITALONE_CO49_COMMENT_2023 = report('Blind comment', 'https://www.teamblind.com/post/capital-one-power-day-prep-wkbajzyr', '2023-01');
const CAPITALONE_CO52_2021 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/1277236/capital-one-power-day-questions/', '2021-06');
const CAPITALONE_CO53_SENIOR_2024: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-question/5181885/Capital-One-Senior-SDE-Powerday/', '2024-05'),
  role: 'Senior SDE',
  outcome: 'no offer',
};
const CAPITALONE_CO57_TDP_2020: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/interview-experience/848455/Capital-One-or-TDP-New-Grad-or-September-2020-Offer', '2020-09'),
  role: 'New graduate software engineer (TDP)',
};

// CrowdStrike: research in docs/references/crowdstrike-questions-and-process-2026-10.md; every cited page was read again
// on 2026-11-13. Frontend accounts are anonymous reviews re-hosted on Taro (placeholder dates are labelled approx.) plus
// one Blind post. Commenters' own accounts in two other Blind threads back the question list and the behavioural
// questions; Blind commenters who give no account of their own support the record only.
const CROWDSTRIKE_INTERVIEWING = official('CrowdStrike interviewing page', 'https://www.crowdstrike.com/en-us/careers/interviewing/');
const CROWDSTRIKE_EMERGING_TALENT = official('CrowdStrike Emerging Talent page', 'https://www.crowdstrike.com/en-us/careers/university-interns/');
const CROWDSTRIKE_UK_UNIVERSITY = official('CrowdStrike UK university page', 'https://www.crowdstrike.com/en-gb/careers/university-interns/');
const CROWDSTRIKE_CS1_EM_FE_2025 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/engineering-manager-frontend-united-states-september-3-2025-accepted-offer-neutral-6cbb594c/',
  '2025-09',
);
const CROWDSTRIKE_CS2_UI_DEV_2025 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/ui-developer-new-york-new-york-november-5-2025-no-offer-positive-83b7272b/',
  '2025-11',
);
const CROWDSTRIKE_CS3_SENIOR_FE_2025 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-frontend-engineer-denmark-march-26-2025-no-offer-positive-775974f1/',
  '2025-03',
);
const CROWDSTRIKE_CS6_SENIOR_2024 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-software-engineer-sunnyvale-ca-july-1-2024-no-offer-negative-760e6b0c/',
  '2024-07',
);
const CROWDSTRIKE_CS7_SENIOR_FE_2024 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-front-end-developer-london-england-june-1-2024-no-offer-negative-2b30d254/',
  '2024-06',
);
const CROWDSTRIKE_CS8_FE_2024 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/front-end-developer-united-states-may-1-2024-no-offer-positive-92944bf7/',
  '2024-05',
);
const CROWDSTRIKE_CS9_SENIOR_FE_2023 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-front-end-engineer-united-states-december-1-2023-no-offer-negative-08d0c99b/',
  '2023-12',
);
const CROWDSTRIKE_CS10_UI_2023 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/ui-engineer-united-states-november-1-2023-accepted-offer-positive-229b6510/',
  '2023-11',
);
const CROWDSTRIKE_CS11_UI_INTERN_2023 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/ui-engineer-intern-sunnyvale-ca-march-1-2023-accepted-offer-positive-0aad53bf/',
  '2023-03',
);
const CROWDSTRIKE_CS12_SENIOR_FE_2022 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-frontend-engineer-united-states-june-23-2022-no-offer-positive-e9222bd2/',
  '2022-06',
);
const CROWDSTRIKE_CS13_FE_2022 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/frontend-engineer-united-states-june-14-2022-no-offer-negative-cb1aa154/',
  '2022-06',
);
const CROWDSTRIKE_CS14_FE_2022 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/frontend-developer-united-states-may-11-2022-no-offer-negative-b051c42d/',
  '2022-05',
);
const CROWDSTRIKE_CS15_SENIOR_UI_2022 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-ui-developer-united-states-march-1-2022-no-offer-negative-7d6f1130/',
  '2022-03',
);
const CROWDSTRIKE_CS16_UI_2022 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/ui-engineer-united-states-february-1-2022-accepted-offer-positive-26130ab1/',
  '2022-02',
);
const CROWDSTRIKE_CS17_UI_2021 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/ui-engineer-united-states-november-1-2021-no-offer-negative-50438a74/',
  '2021-11',
);
const CROWDSTRIKE_CS18_SENIOR_UI_2021 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-ui-engineer-united-states-august-20-2021-declined-offer-negative-e3ad88c5/',
  '2021-08',
);
// The poster's account of the round is a reply of August 2024 to their July 2024 post; neither gives a country or outcome.
const CROWDSTRIKE_CS20_SENIOR_FE_2024: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/crowdstrike-frontend-interview-jmjmpz0w', '2024-08'),
  role: 'Senior frontend engineer',
};
const CROWDSTRIKE_TB_ML_INTERN_2024 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/applied-machine-learning-internship-bucharest-bucuresti-april-1-2024-no-offer-negative-fb1210be/',
  '2024-04',
);
const CROWDSTRIKE_TB_DATA_INTERN_2024 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/data-engineering-intern-united-states-january-1-2024-no-offer-positive-f7ff8a15/',
  '2024-01',
);
const CROWDSTRIKE_TB_ENG_INTERN_2024 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/engineering-intern-pune-june-1-2024-no-offer-neutral-b3b466f9/',
  '2024-06',
);
const CROWDSTRIKE_TB_SWE_INTERN_2025 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/software-developer-intern-united-states-january-5-2025-no-offer-neutral-c6753340/',
  '2025-01',
);
// Added 2026-11-13 for the question list: the Canada and 2020 accounts the guide's sources already cite or the record
// lists, and a general Senior Software Engineer loop whose one question is a web fundamentals question.
const CROWDSTRIKE_CS4_SENIOR_FE_2025 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-front-end-engineer-canada-january-1-2025-no-offer-neutral-476ef9db/',
  '2025-01',
);
const CROWDSTRIKE_CS19_FE_2020 = report(
  'Taro (approx.)',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/front-end-engineer-united-states-march-1-2020-no-offer-positive-44f84f29/',
  '2020-03',
);
const CROWDSTRIKE_CS21_SENIOR_SWE_2024 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-software-engineer-united-states-april-4-2024-no-offer-negative-4e18dce2/',
  '2024-04',
);
// A commenter in a 2022 thread on the senior frontend loop who declined an offer at the Senior level; the comment gives no
// role type, country or interview date, so the date is the comment's month.
const CROWDSTRIKE_CSC1_SENIOR_2022: InterviewProcessSource = {
  ...report('Blind comment', 'https://www.teamblind.com/post/crowdstrike-frontend-interview-5n8jmgs4', '2022-10'),
  role: 'Senior candidate',
  outcome: 'declined offer',
};
// Two commenters in a 2026 thread about a full-stack automation role, on their own hiring manager rounds; neither states a
// role, so one constant covers both.
const CROWDSTRIKE_CSP3_COMMENTS_2026 = report('Blind comment', 'https://www.teamblind.com/post/crowdstrike-interview-bgj0l4js', '2026-08');

// Airbnb's careers FAQ gives only the general shape, so the stages come from public accounts. Taro reports are
// Glassdoor re-hosts and those dated the 1st of a month carry placeholder dates. Some accounts carry a general
// software engineer title but describe a frontend loop.
const AIRBNB_TARO = 'https://www.jointaro.com/interviews/companies/airbnb/experiences';
const AIRBNB_AB1_FE_2022 = report(
  'Taro (approx.)',
  `${AIRBNB_TARO}/front-end-engineer-san-francisco-ca-june-1-2022-declined-offer-negative-afab47f0/`,
  '2022-06',
);
// Airbnb accounts with who and when, re-read 2026-11-13: the Taro pages, the Blind threads, both PracHub pages and the
// careers FAQ. LeetCode is not re-readable now; the 2019 StoreData post and the 2025 phone-screen post rest on the
// bodies saved in the research session of 2026-10-20. Roles, places and outcomes are what each account gives: the
// Blind commenters on the AB2, AB3 and AB20 threads give no role, and AB6's offer post does not say it was accepted.
// AB2's poster and its commenter share one URL, so the sources list shows that thread once, under the poster.
const AIRBNB_AB2_POSTER_2024: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/airbnb-frontend-interview-fyzmjrb5', '2024-02'),
  role: 'Frontend engineer',
};
const AIRBNB_AB2_COMMENT_2024 = report('Blind comment', 'https://www.teamblind.com/post/airbnb-frontend-interview-fyzmjrb5', '2024-05');
const AIRBNB_AB3_COMMENT_2022 = report('Blind comment', 'https://www.teamblind.com/post/Airbnb-front-end-interview-L5-gkNsa6jg', '2022-02');
// The DoorDash-badged commenter was about to join Airbnb as a senior front end engineer.
const AIRBNB_AB4_COMMENT_2022: InterviewProcessSource = {
  ...report('Blind comment', 'https://www.teamblind.com/post/Airbnb-Frontend-Engineer-Interview-H7oqkCqu', '2022-04'),
  role: 'Senior front end engineer',
  outcome: 'accepted offer',
};
const AIRBNB_AB6_FE_2021: InterviewProcessSource = {
  ...report(
    'Blind',
    'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob',
    '2021-10',
  ),
  role: 'Frontend engineer',
};
const AIRBNB_AB7_SCREEN_2025: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/7110255/', '2025-08'),
  role: 'Frontend engineer',
};
const AIRBNB_AB8_SWE_2024 = report(
  'Taro (approx.)',
  `${AIRBNB_TARO}/software-engineer-united-states-december-1-2024-no-offer-negative-4a03cdeb/`,
  '2024-12',
);
const AIRBNB_AB9_FE_2025 = report('Taro', `${AIRBNB_TARO}/front-end-engineer-united-states-may-5-2025-no-offer-negative-f31948ca/`, '2025-05');
const AIRBNB_AB10_STAFF_FE_2025 = report(
  'Taro',
  `${AIRBNB_TARO}/staff-frontend-engineer-united-states-february-22-2025-no-offer-positive-80b29888/`,
  '2025-02',
);
const AIRBNB_AB11_FE_2024 = report('Taro', `${AIRBNB_TARO}/front-end-developer-mexico-december-6-2024-no-offer-neutral-f0413553/`, '2024-12');
const AIRBNB_AB12_FE_2024: InterviewProcessSource = {
  ...report('Blind', 'https://www.teamblind.com/post/just-bombed-my-airbnb-coding-interviews-a3idwxsm', '2024-10'),
  role: 'Frontend engineer',
};
const AIRBNB_AB13_SWE_2025 = report(
  'Taro (approx.)',
  `${AIRBNB_TARO}/software-engineer-united-states-september-1-2025-no-offer-negative-8231f149/`,
  '2025-09',
);
const AIRBNB_AB14_SENIOR_2024 = report(
  'Taro (approx.)',
  `${AIRBNB_TARO}/senior-software-engineer-united-states-december-1-2024-no-offer-negative-1f4f28c4/`,
  '2024-12',
);
const AIRBNB_AB15_SENIOR_2024 = report(
  'Taro (approx.)',
  `${AIRBNB_TARO}/senior-software-engineer-united-states-june-1-2024-no-offer-neutral-1ca3bb85/`,
  '2024-06',
);
const AIRBNB_AB16_SENIOR_2024 = report(
  'Taro (approx.)',
  `${AIRBNB_TARO}/senior-software-engineer-new-york-ny-july-1-2024-no-offer-negative-4d27b9bc/`,
  '2024-07',
);
// The interview month the page gives; PracHub published its edited version in August 2026. The job was in San
// Francisco, and the onsite invite was the last news.
const AIRBNB_AB17_FULLSTACK_2025: InterviewProcessSource = {
  ...report(
    'PracHub (curated)',
    'https://prachub.com/interview-experiences/airbnb-software-engineer-interview-experience-full-stack-phone-screen-lands-an-onsite-invite',
    '2025-08',
  ),
  role: 'Software engineer (full-stack)',
  location: 'United States',
  outcome: 'in progress',
};
// Added 2026-11-13 for the question list. AB18 is a September 2025 loop that PracHub published, edited, in August 2026;
// its correction note moves the tree problem to the phone screen and the retry function to the onsite algorithm round.
const AIRBNB_AB18_SWE_2025: InterviewProcessSource = {
  ...report(
    'PracHub (curated)',
    'https://prachub.com/interview-experiences/airbnb-software-engineer-interview-experience-tree-sums-a-retry-hof-and-a-rental-watchlist-design-question',
    '2025-09',
  ),
  role: 'Software engineer',
};
const AIRBNB_AB19_SCREEN_2019: InterviewProcessSource = {
  ...report('LeetCode', 'https://leetcode.com/discuss/post/348436/', '2019-08'),
  role: 'Senior front end engineer',
  outcome: 'no offer',
};
// An Airbnb-badged commenter describing the technical experience interview, hedged in the comment itself; no role.
const AIRBNB_AB20_COMMENT_2024 = report('Blind comment', 'https://www.teamblind.com/post/airbnb-coding-interviews-yf2ppofe', '2024-03');

export const COMPANY_INTERVIEW_PROCESSES: Readonly<Record<string, CompanyInterviewProcess>> = {
  amazon: {
    title: 'Amazon Front End Engineer interview process',
    summary:
      'Amazon\'s Front End Engineer preparation page describes three stages: an online assessment, a 60-minute phone screen and a loop of four 55-minute interviews. Front end candidates\' accounts from 2019 to 2025 describe loops of four or five interviews, most of them opening with Leadership Principles questions before the coding or design.',
    caveat:
      'Each account describes one loop. Some added a bar raiser or a hiring-manager round, one 2020 phone screen had no behavioural questions, and one 2024 loop asked backend rather than frontend design. No US account is newer than October 2024, so confirm the format with your recruiter.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Front End Engineer, experienced hires',
        stages: [
          {
            stage: 'Online assessment',
            format:
              'Two coding questions in JavaScript in 90 minutes, then 20 minutes of system design scenarios. An 8-minute multiple-choice work style survey follows; Amazon links a sample challenge on HackerRank, and the code must compile for every question to move forward. Accounts from 2020 and 2022 describe two LeetCode-medium problems; a 2025 Front End Engineer I candidate in India took a Mettl test with one coding question and multiple-choice questions, then a frontend assignment.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_OFFER_2020, AMAZON_BLIND_2022, AMAZON_INDIA_2025],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'Phone screen',
            format:
              '60 minutes with a leader on the team: half Leadership Principles questions, half front-end coding. In the accounts a front end engineer or a development manager ran it. One 2020 screen had no behavioural questions and was eight short technical questions instead, and a Front End Engineer I screen from 2022, posted in January 2023, used LeetCode-style problems.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_PHONE_2020, AMAZON_SEATTLE_2020, AMAZON_OFFER_2020, AMAZON_PHONE_NO_LP_2020, AMAZON_BLIND_2022],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'Loop: coding interviews',
            format:
              'Three coding interviews on maintainable code, problem solving, and data structures and algorithms. Amazon\'s page asks for syntactically correct code rather than pseudo code. Accounts describe interface widgets built live, in React or in plain HTML, CSS and JavaScript, and algorithm problems of easy to medium difficulty, most hours opening with two Leadership Principles questions.',
            appliesTo: AMAZON_ROLE,
            sources: [
              AMAZON_FEE_PREP,
              AMAZON_SEATTLE_2020,
              AMAZON_OFFER_2020,
              AMAZON_ONSITE_2021,
              AMAZON_VANCOUVER_2022,
              AMAZON_SEATTLE_2024,
              AMAZON_BLIND_2022,
              AMAZON_INDIA_2025,
            ],
            practice: { label: 'Autocomplete search bar', path: '/react/coding/react-autocomplete-search-starter' },
          },
          {
            stage: 'Loop: front-end system design',
            format:
              'At least one front-end system design question, drawn on Bluescape. Amazon\'s page lists six objectives, from usability to scalability; you define the contract between the front end and the back end but are not expected to design the back-end API. In the accounts it filled one loop interview, run by the hiring manager in a 2022 Front End Engineer I loop; one 2024 round was mostly backend design.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_OFFER_2020, AMAZON_ONSITE_2021, AMAZON_VANCOUVER_2022, AMAZON_BLIND_2022, AMAZON_SEATTLE_2024],
            practice: { label: 'Design an infinite scrolling list', path: '/system-design/infinite-scroll-list' },
          },
          {
            stage: 'Loop: Leadership Principles',
            format:
              'Each interviewer typically asks two or three behavioural questions. Accounts describe two or three opening most loop interviews, 30 minutes of them in each round of a 2024 loop, a bar raiser interview, and a hiring manager round that is often all behavioural.',
            appliesTo: AMAZON_ROLE,
            sources: [
              AMAZON_FEE_PREP,
              AMAZON_INTERVIEW_LOOP,
              AMAZON_HM_2019,
              AMAZON_SEATTLE_2020,
              AMAZON_OFFER_2020,
              AMAZON_ONSITE_2021,
              AMAZON_VANCOUVER_2022,
              AMAZON_BLIND_2022,
              AMAZON_SEATTLE_2024,
              AMAZON_FEE_I_2025,
            ],
            practice: { label: 'Leadership Principles questions and story drill', path: '/companies/amazon/preview', fragment: 'amazon-round-leadership-principles', drill: true },
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
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'New graduate first round',
            format:
              'One interview with an Amazonian, about 45 to 60 minutes. A 2025 new-graduate phone screen in Dublin spent more than 40 minutes on Leadership Principles and asked no frontend questions.',
            appliesTo: 'Full-time new graduates',
            sources: [AMAZON_STUDENT_PREP, AMAZON_GRAD_SCREEN_2025],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'New graduate final stage',
            format: 'Three to four interviews of 45 to 60 minutes each, coded in LiveCode.',
            appliesTo: 'Full-time new graduates',
            sources: [AMAZON_STUDENT_PREP],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
          },
        ],
      },
    ],
    // Left out for want of a subject: assessment and phone-screen problems given only as "LeetCode medium" or
    // "LeetCode (easy to medium)", the 2025 India Mettl coding question and frontend assignment, "a few CSS questions"
    // before the 2020 countdown timer, a 2020 "front end widget" and "really hard question", a 2021 round of "Leetcode
    // questions off of amazon list", a 2022 bar raiser's coding "similar to the Thesaurus", and the 2022 FEE I
    // "implementing a component" and hiring-manager design rounds, which name no prompt. The community list's "Star
    // Rating" item carries no Amazon tag, so the star rating row cites the 2020 phone screen alone. Behavioural questions
    // are in behaviouralQuestions, open.
    questions: [
      {
        id: 'five-star-rating-widget',
        round: 'Phone screen',
        kind: 'UI build',
        topic: 'Star rating widget',
        question:
          'Build a small star rating widget from scratch in HTML, CSS and vanilla JavaScript: five grey stars in a row that turn gold when one is hovered or selected, together with every star rated below it. A star could be any element.',
        sources: [AMAZON_PHONE_2020],
        practice: { label: 'Star rating widget', path: '/react/coding/react-star-rating' },
        answerGuide: 'five-star-rating-vanilla',
      },
      {
        id: 'carousel-component',
        round: 'Phone screen',
        kind: 'UI build',
        topic: 'Carousel component',
        question:
          'Implement a carousel component, then answer questions on how its state is managed and on other ways to handle it. The candidate built it in React.',
        sources: [AMAZON_SEATTLE_2020],
        practice: { label: 'Image slider with dots and previous and next', path: '/react/coding/react-image-slider' },
        answerGuide: 'carousel-with-state-follow-ups',
      },
      {
        id: 'coin-change',
        round: 'Phone screen',
        kind: 'Algorithm',
        topic: 'Coin change',
        question:
          'The coin change problem, with a fixed set of coins that a greedy approach can solve, so dynamic programming was not needed.',
        sources: [AMAZON_SEATTLE_2020],
      },
      {
        id: 'modal-screen-to-requirements',
        round: 'Phone screen',
        kind: 'UI build',
        topic: 'Modal screen',
        question: 'Design and build a modal screen to a set of specific requirements, in a coding interview with a development manager.',
        promptNotShared: true,
        sources: [AMAZON_OFFER_2020],
      },
      {
        id: 'block-vs-inline-elements',
        round: 'Phone screen',
        kind: 'Web fundamentals',
        topic: 'Block vs inline elements',
        question: 'What is the difference between block and inline elements?',
        sources: [AMAZON_PHONE_NO_LP_2020],
        practice: { label: 'Block-level and inline elements', path: '/html/trivia/html-block-inline-elements' },
      },
      {
        id: 'reflow-vs-repaint',
        round: 'Phone screen',
        kind: 'Web fundamentals',
        topic: 'Reflow vs repaint',
        question: 'What is the difference between reflow and repaint?',
        sources: [AMAZON_PHONE_NO_LP_2020],
        practice: { label: 'Reflow and repaint in browsers', path: '/javascript/trivia/js-repaint-reflow' },
      },
      {
        id: 'span-inside-div-with-dom-apis',
        round: 'Phone screen',
        kind: 'JavaScript',
        topic: 'Adding an element with DOM APIs',
        question: 'How do you add a span element inside a div element using web APIs?',
        sources: [AMAZON_PHONE_NO_LP_2020],
      },
      {
        id: 'css-preprocessors',
        round: 'Phone screen',
        kind: 'Web fundamentals',
        topic: 'CSS preprocessors',
        question: 'What are CSS preprocessors such as Sass and Less used for?',
        sources: [AMAZON_PHONE_NO_LP_2020],
      },
      {
        id: 'microtasks-and-macrotasks',
        round: 'Phone screen',
        kind: 'JavaScript',
        topic: 'Microtasks and macrotasks',
        question: 'How does the event loop handle microtasks and macrotasks?',
        sources: [AMAZON_PHONE_NO_LP_2020],
        practice: { label: 'Microtasks vs macrotasks', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
      },
      {
        id: 'unit-vs-integration-testing',
        round: 'Phone screen',
        kind: 'Web fundamentals',
        topic: 'Unit vs integration testing',
        question: 'What is the difference between unit testing and integration testing?',
        sources: [AMAZON_PHONE_NO_LP_2020],
      },
      {
        id: 'browser-memory-leaks',
        round: 'Phone screen',
        kind: 'Web fundamentals',
        topic: 'Browser memory leaks',
        question: 'How do you find memory leaks in the browser? The interviewer called it an open-ended question.',
        sources: [AMAZON_PHONE_NO_LP_2020],
        practice: { label: 'Memory leak debugging', path: '/javascript/trivia/js-memory-leaks-common-sources' },
      },
      {
        id: 'primes-up-to-n',
        round: 'Phone screen',
        kind: 'Algorithm',
        topic: 'Primes up to n',
        question: 'Find all the prime numbers up to n, then optimise the solution. It was the last of eight questions in a screen with no behavioural part.',
        sources: [AMAZON_PHONE_NO_LP_2020],
      },
      {
        id: 'array-function-polyfills',
        round: 'Phone screen',
        kind: 'JavaScript',
        topic: 'Map, filter, reduce and sort polyfills',
        question: 'Implement your own versions of the higher-order array functions map, reduce, filter and sort.',
        sources: [AMAZON_LIST_2020],
        practice: { label: 'Implement Array.prototype.map', path: '/javascript/coding/js-array-prototype-map' },
      },
      {
        id: 'language-tabs-modal',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'Language tabs in a modal',
        question:
          'From an image of a modal with three tabs named English, Spanish and French above a block of text, build it so that clicking a tab switches the text to that language. The candidate used React.',
        sources: [AMAZON_SEATTLE_2020],
        practice: { label: 'Tabs and multi-view switcher', path: '/react/coding/react-tabs-switcher' },
        answerGuide: 'language-tabs-modal',
      },
      {
        id: 'roman-numeral-conversion',
        round: 'Loop: coding interviews',
        kind: 'Algorithm',
        topic: 'Integer and Roman numeral conversion',
        question: 'Convert an integer to Roman numerals (LeetCode 12), then the reverse, Roman numerals to an integer (LeetCode 13).',
        sources: [AMAZON_SEATTLE_2020],
      },
      {
        id: 'countdown-timer',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'Countdown timer',
        question:
          'After a few CSS questions, build a countdown timer. The interviewer called it a tough task for 30 minutes; the candidate designed it and wrote the state management but did not finish.',
        sources: [AMAZON_SEATTLE_2020],
        practice: { label: 'Countdown timer with start, pause and reset', path: '/react/coding/react-countdown-timer' },
        answerGuide: 'countdown-timer-in-thirty-minutes',
      },
      {
        id: 'referral-log-dependency',
        round: 'Loop: coding interviews',
        kind: 'Algorithm',
        topic: 'Transitive dependency in referral logs',
        question:
          'Given logs that each hold a referral URL and a source URL, find whether two given URLs have a transitive dependency. The round opened with this problem before the Leadership Principles questions.',
        sources: [AMAZON_SEATTLE_2020],
      },
      {
        id: 'binary-tree-problem',
        round: 'Loop: coding interviews',
        kind: 'Algorithm',
        topic: 'Binary tree problem',
        question:
          'An easy to medium binary tree problem, then questions on optimising its time and space, and finally a request to rework it so that it uses more memory.',
        promptNotShared: true,
        sources: [AMAZON_OFFER_2020],
      },
      {
        id: 'constructor-and-prototype-method',
        round: 'Loop: coding interviews',
        kind: 'JavaScript',
        topic: 'Constructor functions and prototypes',
        question:
          'An easy custom data structure question in JavaScript, then a follow-up: create a new constructor function and add your function to it as a method through its prototype.',
        sources: [AMAZON_ONSITE_2021],
        practice: { label: 'Implement the new operator', path: '/javascript/coding/js-implement-new' },
      },
      {
        id: 'closures-event-loop-utilities',
        round: 'Loop: coding interviews',
        kind: 'JavaScript',
        topic: 'Closures, event loop and utilities',
        question: 'Questions on JavaScript closures and the event loop, then small JavaScript implementations of the kind BFE.dev collects.',
        sources: [AMAZON_ONSITE_2021],
      },
      {
        id: 'form-from-a-picture',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'Form from a picture',
        question: 'Implement a component from a picture using HTML; the picture was a simple form.',
        sources: [AMAZON_ONSITE_2021],
      },
      {
        id: 'paginated-seller-addresses',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'Paginated address list',
        question:
          'As a seller with a list of addresses you ship to, show them five per page with previous and next buttons. The interviewer focused on when to disable and enable the buttons for the data size, the CSS layout, and modelling the data and props.',
        sources: [AMAZON_VANCOUVER_2022],
        practice: { label: 'Paginated data table', path: '/react/coding/react-pagination-table' },
        answerGuide: 'paginated-address-widget',
      },
      {
        id: 'thesaurus-class',
        round: 'Loop: coding interviews',
        kind: 'Practical coding',
        topic: 'Thesaurus class',
        question:
          'An object-oriented design round: implement a Thesaurus class with easy access, insertion and search, storing related words without duplication or too much memory. The interviewer cared more about scalable, maintainable code than a clever algorithm.',
        sources: [AMAZON_VANCOUVER_2022],
      },
      {
        id: 'frontend-library-api',
        round: 'Loop: coding interviews',
        kind: 'JavaScript',
        topic: 'API from a frontend library',
        question: 'In a frontend whiteboarding round, implement an API from a frontend library; the account does not say which.',
        promptNotShared: true,
        sources: [AMAZON_BLIND_2022],
      },
      {
        id: 'graph-search-topological-sort',
        round: 'Loop: coding interviews',
        kind: 'Algorithm',
        topic: 'Graph search and topological sort',
        question: 'A graph problem that depth-first or breadth-first search solves, then a follow-up that a topological sort solves.',
        promptNotShared: true,
        sources: [AMAZON_BLIND_2022],
      },
      {
        id: 'file-explorer-from-ascii-sketch',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'File explorer interface',
        question:
          'Build something like the interface of a file explorer from an ASCII diagram of numbered entries with nested comments, which the interviewer described as comments on GitHub or in a readme. React was allowed.',
        sources: [AMAZON_SEATTLE_2024],
        practice: { label: 'File explorer tree with keyboard navigation', path: '/react/coding/react-file-explorer' },
        answerGuide: 'file-explorer-from-ascii-sketch',
      },
      {
        id: 'find-all-anagrams',
        round: 'Loop: coding interviews',
        kind: 'Algorithm',
        topic: 'Find all anagrams in a string',
        question: 'LeetCode\'s Find All Anagrams in a String (438), asked before the round\'s Leadership Principles questions.',
        sources: [AMAZON_SEATTLE_2024],
      },
      {
        id: 'unit-tests-for-a-small-problem',
        round: 'Loop: coding interviews',
        kind: 'Practical coding',
        topic: 'Unit tests for a small problem',
        question: 'Solve a simple coding problem, then write unit tests for it, in what the candidate took to be the bar raiser round.',
        promptNotShared: true,
        sources: [AMAZON_SEATTLE_2024],
      },
      {
        id: 'zero-sum-triplet-in-bst',
        round: 'Loop: coding interviews',
        kind: 'Algorithm',
        topic: 'Zero-sum triplet in a BST',
        question: 'Find a triplet with sum 0 in a binary search tree; the candidate went from an in-order traversal to a sorted array and the 3Sum approach.',
        sources: [AMAZON_INDIA_2025],
        practice: { label: '3Sum: triplets that sum to zero', path: '/javascript/coding/js-three-sum' },
      },
      {
        id: 'row-with-most-ones',
        round: 'Loop: coding interviews',
        kind: 'Algorithm',
        topic: 'Row with the most 1s',
        question: 'In a row-wise sorted matrix of 0s and 1s, up to 100,000 by 100,000, find the row with the most 1s, from brute force to a two-pointer approach.',
        sources: [AMAZON_INDIA_2025],
      },
      {
        id: 'recreate-ui-in-html-css',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'UI recreated in HTML and CSS',
        question: 'Recreate a given UI live with HTML and CSS. The candidate built it in React with Tailwind CSS and also attempted plain HTML and CSS.',
        sources: [AMAZON_INDIA_2025],
      },
      {
        id: 'accordion',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'Accordion',
        question: 'Design an accordion, listed under front end whiteboard questions as an Amazon onsite question.',
        promptNotShared: true,
        sources: [AMAZON_LIST_2020],
        practice: { label: 'Accordion and FAQ component', path: '/react/coding/react-accordion-faq' },
      },
      {
        id: 'grid-with-search-and-sort',
        round: 'Loop: coding interviews',
        kind: 'UI build',
        topic: 'Grid with search and sort',
        question: 'Design a grid with HTML, CSS and JavaScript that supports search and sort, with event bubbling in scope, listed as an Amazon onsite question.',
        sources: [AMAZON_LIST_2020],
      },
      {
        id: 'image-service-design',
        round: 'Loop: front-end system design',
        kind: 'Frontend system design',
        topic: 'Image service',
        question:
          'Design an image service, with two Leadership Principles questions in the same hour. The candidate, new to front-end design, started from database tables and backend API calls before page authorisation and cookies.',
        sources: [AMAZON_OFFER_2020],
        practice: { label: 'Image upload and preview case', path: '/system-design/image-upload-preview' },
        answerGuide: 'image-service-frontend-design',
      },
      {
        id: 'component-architecture-with-auth',
        round: 'Loop: front-end system design',
        kind: 'Frontend system design',
        topic: 'Application component architecture',
        question:
          'Walk through the component architecture of an application, with questions on authentication.',
        sources: [AMAZON_ONSITE_2021],
      },
      {
        id: 'restaurant-ordering-app',
        round: 'Loop: front-end system design',
        kind: 'Frontend system design',
        topic: 'Restaurant ordering app',
        question: 'Design a restaurant listing application where users place orders and customise them with extras such as toppings and salads.',
        sources: [AMAZON_VANCOUVER_2022],
        answerGuide: 'image-service-frontend-design',
      },
      {
        id: 'web-file-browser-design',
        round: 'Loop: front-end system design',
        kind: 'Frontend system design',
        topic: 'Web file browser',
        question:
          'Design a file browser for the web. It replaced a backend design question once the candidate mentioned frontend experience, but the account says the questions that followed were mostly on the backend.',
        sources: [AMAZON_SEATTLE_2024],
      },
    ],
    // Left out: "Tell me about a time you went about the status quo?" (Seattle, 2019), whose wording is unclear, and
    // questions from replies whose author cannot be confirmed as the poster. Amazon's own example questions stay in the
    // Leadership Principles decoder on the guide.
    behaviouralQuestions: [
      {
        id: 'negative-feedback',
        question: 'Tell me about negative or tough feedback you received, and how you dealt with it.',
        sources: [AMAZON_SEATTLE_2020, AMAZON_NYC_2019],
      },
      {
        id: 'beyond-your-role',
        question: 'Tell me about a time you went beyond what your role or responsibility required.',
        sources: [AMAZON_SEATTLE_2020, AMAZON_NYC_2019, AMAZON_FEE_I_2025],
      },
      {
        id: 'no-idea-what-was-going-on',
        question: 'Tell me about a time you jumped into a problem with no idea what was going on.',
        sources: [AMAZON_SEATTLE_2020],
      },
      {
        id: 'favourite-language',
        question: 'Which is your favourite programming language, and why?',
        sources: [AMAZON_SEATTLE_2020],
      },
      {
        id: 'few-requirements',
        question: 'Tell me about a time you had too few requirements but had to start the work and deliver it.',
        sources: [AMAZON_SEATTLE_2020, AMAZON_MEDIUM_2021],
      },
      {
        id: 'messed-up',
        question: 'Describe a time you messed up. What were the consequences?',
        sources: [AMAZON_SEATTLE_2020],
      },
      {
        id: 'handover',
        question: 'Describe a time you had to hand something over to someone else.',
        sources: [AMAZON_SEATTLE_2020],
      },
      {
        id: 'tight-deadline',
        question: 'Tell me about a time you worked to a tight deadline. How did you prioritise?',
        sources: [AMAZON_HM_2019, AMAZON_FEE_I_2025],
      },
      {
        id: 'disagreement-with-a-coworker',
        question: 'Tell me about a disagreement or conflict with a coworker, and how you handled it.',
        sources: [AMAZON_HM_2019, AMAZON_NYC_2019, AMAZON_MEDIUM_2025],
      },
      {
        id: 'why-amazon',
        question: 'Why Amazon?',
        sources: [AMAZON_HM_2019, AMAZON_NYC_2019],
      },
      {
        id: 'hardest-work',
        question: 'What is the hardest problem or the toughest piece of work you have solved and are proud of?',
        sources: [AMAZON_NYC_2019, AMAZON_MEDIUM_2025],
      },
      {
        id: 'learned-something-new',
        question: 'Tell me about a time you learned something new to deliver a task.',
        sources: [AMAZON_NYC_2019],
      },
      {
        id: 'failed-to-deliver',
        question: 'Tell me about a time you could not deliver, or delivered something below the mark, and how you handled it.',
        sources: [AMAZON_NYC_2019, AMAZON_MEDIUM_2021, AMAZON_MEDIUM_2025],
      },
      {
        id: 'calculated-risk',
        question: 'Tell me about a time you took a calculated risk.',
        sources: [AMAZON_L5_NYC_2020],
      },
      {
        id: 'short-versus-long-term',
        question: 'Tell me about a time you had to weigh short-term against long-term costs.',
        sources: [AMAZON_L5_NYC_2020],
      },
      {
        id: 'shortcomings',
        question: 'What are some of your shortcomings?',
        sources: [AMAZON_L5_NYC_2020],
      },
      {
        id: 'urgent-customer',
        question: 'Tell me about a time you went out of your way to help a customer urgently. What did you do to make sure it never happened again?',
        sources: [AMAZON_CUSTOMER_2021],
      },
      {
        id: 'fifteen-day-deadline',
        question: 'You have 15 days for work that would take two or three months. How do you handle it?',
        sources: [AMAZON_FEE_I_2025],
      },
      {
        id: 'without-telling-manager',
        question: 'Tell me about something you did without telling your manager. Why did you not tell them?',
        sources: [AMAZON_FEE_I_2025],
      },
      {
        id: 'without-team-approval',
        question: 'Tell me about a time you acted on requirements straight away, without your team\'s approval.',
        sources: [AMAZON_MEDIUM_2021],
      },
    ],
  },
  tesla: {
    summary:
      'Public accounts from 2020 to 2026 describe an online assessment, often on Codility, a one-hour technical screen, and a final loop of three or four rounds: frontend coding in React or Angular, data structures and algorithms, frontend system design, and a hiring-manager or behavioural round.',
    caveat:
      'One intern called the format very team dependent, and several Blind posts were written before the interview, so they record what a recruiter planned rather than a finished loop. The question list also draws on intern loops, a 2022 full-stack new-grad loop and a 2020 general SDE-1 loop, keeping only their frontend, web and algorithm questions. Ask the recruiter which rounds your team runs.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend developer and engineer roles',
        stages: [
          {
            stage: 'Recruiter or HR call',
            format:
              'A recruiter or HR call came first in two accounts; in a third, a short introductory call followed the assessment. In 2024 the recruiter checked visa status and availability for an on-site.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T4_FE_2024, TESLA_T1_FE_2025, TESLA_T5_FE_2022],
          },
          {
            stage: 'Online assessment',
            format:
              'Often on Codility: 2 hours for 5 questions in a 2022 account, basic front-end framework tasks in a 2020 one. A 2021 assessment ran three hours: an HTML and CSS question, a React question and a string problem.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T5_FE_2022, TESLA_B4_CODILITY, TESLA_B3_CODILITY, TESLA_T2_FE_2021, TESLA_T6_FE_2020],
          },
          {
            stage: 'Technical screen',
            format:
              'A one-hour phone or video interview, or a live React coding session. A 2025 session had basic JavaScript questions and a search bar; in 2022 a senior developer on the team asked React questions about the candidate\'s take-home and an easy LeetCode problem; a 2021 video round mixed JavaScript, HTML and React questions with a coding problem.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T5_FE_2022, TESLA_T2_FE_2021, TESLA_B2_TAKE_HOME, TESLA_T1_FE_2025],
            practice: { label: 'The one-hour screen, rehearsed', path: '/react/trivia/react-phone-screen-search-bar-rehearsal' },
          },
          {
            stage: 'Final loop: frontend coding',
            format:
              'One or two React coding rounds, or an Angular round with a coding test and then a TypeScript and JavaScript round. The Angular loop is a 2024 Fremont one; a 2020 recruiter said two of three coding rounds would be frontend-focused, and a 2025 loop put its frontend round after the algorithm round.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T6_FE_2020, TESLA_T4_FE_2024, TESLA_B1_ONSITE_PLAN, TESLA_T3_FE_2025],
            practice: { label: 'React interview preparation path', path: '/guides/framework-prep/react-prep-path' },
          },
          {
            stage: 'Final loop: data structures and algorithms',
            format: 'One LeetCode-style algorithm round, which a 2020 recruiter planned as one of three coding rounds.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T6_FE_2020, TESLA_B1_ONSITE_PLAN, TESLA_T3_FE_2025],
          },
          {
            stage: 'Final loop: frontend system design',
            format:
              'One frontend system design round in the 2020 and 2024 onsite accounts. In the 2024 Fremont loop it was the last of three back-to-back interviews, run by a panel of the hiring manager, a back-end engineer and two full-stack engineers.',
            appliesTo: TESLA_ROLE,
            sources: [TESLA_T6_FE_2020, TESLA_T4_FE_2024],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Final loop: hiring manager and behavioural',
            format: 'A behavioural or hiring-manager round, with a product manager added in one recruiter\'s plan. That plan gave the hiring manager 60 minutes and the product manager 30.',
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
              'One or two rounds that vary by team, mixing React coding, algorithms and UI component design. A 2025 frontend and mobile intern had a 45-minute interview with a staff engineer, half behavioural and half technical.',
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
    // Kept by content: the frontend, web and algorithm questions of intern loops (T7, T8), a 2022 full-stack new-grad
    // loop (L1) and a 2020 general SDE-1 loop (C1). The five questions of the 2022 Los Angeles account (T5) carry no
    // round: the page lists them apart from its stages. Left out for want of a subject: the HTML and CSS question of the
    // 2021 assessment and its video round's JavaScript, HTML and React questions (T2), "basic front-end framework tasks",
    // "Front end using React" and "Algorithm" (T6), the Angular round with a coding test and the TypeScript and
    // JavaScript round (T4), React questions about a take-home and a LeetCode easy (B2), React, CSS and JavaScript
    // fundamentals (T8), a first-round React interview (T9), and an SDE-1 problem on consecutive elements that the
    // research record names too loosely to state. Left out by content: Python dictionary problems and the Python
    // backend round (L1), and "Design movements of Model X wings dancing" (T9), a vehicle design question with no
    // interface named. Left out for their source: questions known only from Glassdoor, 1point3acres or GitHub (a
    // JSON.stringify screen, a pull-request disagreement prompt, a React counter and tabs assessment, the round-one
    // file with copy, dedupe and masking tasks, and published take-home briefs).
    questions: [
      {
        id: 'search-bar',
        round: 'Technical screen',
        kind: 'React build',
        topic: 'Search bar in React',
        question: 'Implement a search bar in a live React coding session that also had basic JavaScript questions.',
        sources: [TESLA_T1_FE_2025],
        practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
      },
      {
        id: 'like-button',
        round: 'Online assessment',
        kind: 'React build',
        topic: 'Like button in React',
        question: 'Make a like button in React, the second of three questions in a three-hour online assessment.',
        sources: [TESLA_T2_FE_2021],
        practice: { label: 'React like button', path: '/react/coding/react-like-button' },
      },
      {
        id: 'string-to-number-puzzle',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'String manipulation puzzle',
        question:
          'Work through a string and delete some of its characters to arrive at a particular number, the last question of the same assessment; the account does not give the exact rule.',
        promptNotShared: true,
        sources: [TESLA_T2_FE_2021],
      },
      {
        id: 'two-duplicate-numbers',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Duplicate numbers in an array',
        question: 'Find the two numbers that appear twice in an array, the coding question of a one-hour video interview.',
        sources: [TESLA_T2_FE_2021],
      },
      {
        id: 'styled-react-component',
        round: 'Final loop: frontend coding',
        kind: 'React build',
        topic: 'React component styled with CSS',
        question:
          'Implement a basic React component and style it with CSS, in the 45-minute frontend round of a full-stack new-grad loop. The candidate was turned down for the depth of their CSS.',
        promptNotShared: true,
        sources: [TESLA_L1_FULLSTACK_2022],
      },
      {
        id: 'data-extraction-mock-ui',
        round: 'Final loop: frontend coding',
        kind: 'UI build',
        topic: 'Data extraction and a mock UI',
        question: 'A frontend round of data extraction and building a mock UI, which followed the algorithm round.',
        promptNotShared: true,
        sources: [TESLA_T3_FE_2025],
      },
      {
        id: 'deque-card-game',
        round: 'Final loop: data structures and algorithms',
        kind: 'Algorithm',
        topic: 'Card game with a deque',
        question: 'Design a card game built on a deque, in a round of LeetCode-style questions that the candidate found straightforward.',
        sources: [TESLA_T3_FE_2025],
      },
      {
        id: 'shared-component-design',
        round: 'Final loop: frontend system design',
        kind: 'Frontend system design',
        topic: 'Shared component and its API',
        question: 'Design a component shared across the application, with its API and the technologies you would build it with.',
        promptNotShared: true,
        sources: [TESLA_T6_FE_2020],
        practice: { label: 'Component-driven design system architecture', path: '/system-design/component-design-system-architecture' },
      },
      {
        id: 'car-rental-company-design',
        round: 'Final loop: frontend system design',
        kind: 'Frontend system design',
        topic: 'Car rental company design',
        question: 'Design a system for a car rental company, the last of three back-to-back interviews in a front-end developer loop.',
        sources: [TESLA_T4_FE_2024],
        practice: { label: 'Design a car rental booking frontend', path: '/system-design/car-rental-booking-frontend' },
      },
      {
        id: 'semantic-html5-tags',
        kind: 'UI build',
        topic: 'Semantic HTML5 tags',
        question: 'Given a web page, swap its div elements for the HTML5 tags that fit each part.',
        sources: [TESLA_T5_FE_2022],
        practice: { label: 'Semantic page layout', path: '/html/coding/html-semantic-layout' },
      },
      {
        id: 'position-boxes-css',
        kind: 'UI build',
        topic: 'Positioning boxes with CSS',
        question: 'Place a given set of boxes on the page with CSS positioning.',
        sources: [TESLA_T5_FE_2022],
        practice: { label: 'Positioning: relative and absolute badge', path: '/css/coding/css-positioning-badge' },
      },
      {
        id: 'login-form',
        kind: 'UI build',
        topic: 'Login form',
        question: 'Build a simple login form.',
        sources: [TESLA_T5_FE_2022],
        practice: { label: 'Forms: validation and required fields', path: '/html/coding/html-forms-validation-required' },
      },
      {
        id: 'react-context-themed-photos',
        kind: 'React build',
        topic: 'Themed photo list with React Context',
        question: 'Fetch a set of photos and render them in the right theme, with the theme passed through React Context.',
        sources: [TESLA_T5_FE_2022],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'colour-contrast',
        kind: 'JavaScript',
        topic: 'Colour contrast calculation',
        question: 'Work out the contrast between given colours.',
        sources: [TESLA_T5_FE_2022],
        practice: { label: 'Colour contrast ratio', path: '/javascript/coding/js-color-contrast-ratio' },
      },
      {
        id: 'api-autocomplete-react-app',
        round: 'Technical rounds',
        kind: 'React build',
        topic: 'API-backed autocomplete in React',
        question:
          'Code a React app that calls an API and shows the results as an autocomplete list, then talk through debouncing and other optimisations.',
        sources: [TESLA_T7_INTERN_2025],
        practice: { label: 'React debounced search with a fake API', path: '/react/coding/react-debounced-search' },
      },
      {
        id: 'binary-search-medium',
        round: 'Technical rounds',
        kind: 'Algorithm',
        topic: 'Binary search problem',
        question: 'A LeetCode medium solved with binary search, asked after the React app in the same round.',
        promptNotShared: true,
        sources: [TESLA_T7_INTERN_2025],
      },
      {
        id: 'user-table-design',
        kind: 'Frontend system design',
        topic: 'User table design',
        question: 'Design a user table, the question an intern on the Digital Experience team listed for the frontend role.',
        sources: [TESLA_T8_INTERN_2025],
        practice: { label: 'React paginated data table', path: '/react/coding/react-pagination-table' },
      },
      {
        id: 'linked-list-intersection',
        kind: 'Algorithm',
        topic: 'Intersection of two linked lists',
        question: 'Find the node where two linked lists meet.',
        sources: [TESLA_L1_FULLSTACK_2022],
      },
      {
        id: 'bucket-sort-two-pointers',
        kind: 'Algorithm',
        topic: 'Bucket sort with two pointers',
        question: 'An algorithm problem solved with bucket sort and two pointers; the account does not name the problem.',
        promptNotShared: true,
        sources: [TESLA_L1_FULLSTACK_2022],
      },
      {
        id: 'cookies-css-quiz',
        kind: 'Web fundamentals',
        topic: 'Cookies and CSS declarations',
        question: 'A web quiz with questions on cookies and CSS declarations, in a general SDE-1 loop.',
        promptNotShared: true,
        sources: [TESLA_C1_SDE1_2020],
        practice: { label: 'Cookie attributes', path: '/javascript/trivia/js-cookie-options' },
      },
      {
        id: 'rotate-array',
        kind: 'Algorithm',
        topic: 'Rotate an array',
        question: 'Rotate the elements of an array.',
        sources: [TESLA_C1_SDE1_2020],
      },
      {
        id: 'ways-to-reach-nth-stair',
        kind: 'Algorithm',
        topic: 'Ways to reach the n-th stair',
        question: 'Count the ways to reach the n-th stair of a staircase.',
        sources: [TESLA_C1_SDE1_2020],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'work-under-pressure',
        question: 'Show that you can work under pressure and run several projects at the same time.',
        sources: [TESLA_T6_FE_2020],
      },
      {
        id: 'past-projects',
        question: 'What projects have you worked on? In March 2025 an intern was also taken through the resume in depth.',
        sources: [TESLA_T3_FE_2025, TESLA_T7_INTERN_2025],
      },
      {
        id: 'why-tesla',
        question: 'Why Tesla?',
        sources: [TESLA_L1_FULLSTACK_2022],
      },
      {
        id: 'busy-work-culture',
        question: 'Would you accept a busy work culture?',
        sources: [TESLA_L1_FULLSTACK_2022],
      },
      {
        id: 'three-minutes-with-elon',
        question: 'If you had three minutes with Elon, what would you tell him? A commenter had to answer it in writing after passing the full loop.',
        sources: [TESLA_B4_CODILITY],
      },
    ],
  },
  walmart: {
    summary:
      'Public accounts from 2021 to 2026 describe loops that differ by role; older accounts, back to 2018, are cited for their questions only. SDE 3 (UI) accounts describe three 60-minute rounds, SDE-2 and frontend engineer accounts from India start with an online assessment, and Software Engineer III and senior accounts add one or two system design rounds.',
    caveat:
      'Each account describes one candidate, and several Blind posts record what a recruiter said before the interview rather than a finished loop. Some questions come from full-stack and React Native loops; their frontend and algorithm questions are kept. Teams and levels differ, so confirm the format with your recruiter.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Software Development Engineer 3 (UI), Walmart Global Tech',
        note: 'None of these accounts mentions an online assessment or a system design round. One candidate was turned down for having two years of experience against the three or more the role required.',
        stages: [
          {
            stage: 'DSA round',
            format: '60 minutes on two or three easy-to-medium problems, with a discussion of time complexity.',
            appliesTo: 'SDE 3 (UI)',
            sources: [WALMART_W10_SDE3_UI, WALMART_W11_SDE3_UI, WALMART_W35_SDE3],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'JavaScript, React and web fundamentals',
            format: '60 minutes of JavaScript problem solving plus questions on React, CSS, HTML and how the web works, with one or two small implementation tasks.',
            appliesTo: 'SDE 3 (UI)',
            sources: [WALMART_W10_SDE3_UI, WALMART_W11_SDE3_UI, WALMART_W35_SDE3],
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Hiring manager',
            format: 'A 60-minute hiring-manager round on past projects and experience, with some technical follow-ups in one account.',
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
            format:
              'Two technical rounds of about an hour: data structures or a medium LeetCode problem in any language, then a round of React questions, with CSS and HTML theory in a 2021 account.',
            appliesTo: 'SDE-2',
            sources: [WALMART_W33_SDE2, WALMART_W2_SDE2_BENGALURU, WALMART_W15_SDE2],
            practice: { label: 'React interview preparation path', path: '/guides/framework-prep/react-prep-path' },
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
            stage: 'Online assessment (2026 accounts)',
            format:
              'A HackerRank Frontend Engineering Assessment with a language-agnostic coding problem and a React or Angular debugging section, with AI assistance allowed for UI navigation, syntax and clarification; the recruiter had first mentioned DSA and low-level design. A September 2026 full-stack invite adds a back-end section, and a commenter who took that version reports 140 minutes in three parts: a medium DSA question, an Angular section and a simpler Java task.',
            appliesTo: 'Frontend and full-stack engineers, level not stated',
            sources: [WALMART_W31_FE_2026, WALMART_W56_FULLSTACK_2026],
          },
          {
            stage: 'Coding screen',
            format:
              'A Karat screen with about ten minutes of short answers and then coding, a one-hour HackerRank interview (on CodePair for one React Native team), two React tasks on HackerRank, or a 45-minute JavaScript coding round.',
            appliesTo: 'Software engineer to senior',
            sources: [WALMART_W7_SWE_US, WALMART_W21_KARAT, WALMART_W23_SENIOR_FE, WALMART_W6_SENIOR, WALMART_W19_SENIOR_FE, WALMART_W26_CODEPAIR],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
            rehearsal: { label: 'Walmart Karat screen, 8 short answers and 2 problems in 55 minutes', path: '/javascript/coding/js-valid-parentheses' },
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
              'One or two design rounds: high-level system design, or design questions about past projects. In a 2025 loop the hiring manager ran it, from a walk through the resume to a design problem; in one senior loop, a final round planned as behavioural became system design.',
            appliesTo: 'SWE III and senior',
            sources: [WALMART_W20_SWE3_FE, WALMART_W19_SENIOR_FE, WALMART_W24_SENIOR, WALMART_W25_SWE3, WALMART_W7_SWE_US, WALMART_W6_SENIOR, WALMART_W13_SWE3],
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
    // Kept by content: algorithm and frontend questions from full-stack (W16, W17, W37) and React Native (W12, W26)
    // loops. Left out by content: Java, SQL, hashmap internals, OOP and DBMS, a calendar low-level design, a
    // point-of-sale design, "Design Uber app", an event-driven Kafka scenario, React Native internals, the infrastructure
    // and database half of the 2025 design round, CSRF tokens, GraphQL and Next.js experience questions and the
    // unsold-products problem solved with an LFU cache. Left out for want of a subject: the 2024 assessment sections,
    // the 2026 assessment's coding problem and debugging section, "a medium DSA question", "multiple JS, CSS, HTML and
    // React questions", "simple questions from BFE.dev", Karat short answers and round names alone. Left out for their
    // source: Glassdoor and 1point3acres questions, devtools.tech company tags, GitHub take-homes and the Medium post
    // that is member-only. A Blind commenter's "reverse an array" aside and the "LinkedIn chat or search autocomplete"
    // examples in Walmart-badged advice are left out as asides, not accounts of a round.
    questions: [
      {
        id: 'valid-parentheses',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Valid Parentheses',
        question:
          'Check whether a string of brackets is balanced, with every opening bracket closed in the right order (LeetCode Valid Parentheses).',
        sources: [WALMART_W11_SDE3_UI, WALMART_W10_SDE3_UI, WALMART_W3_FE_INDIA],
        practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'closures',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        topic: 'JavaScript closures',
        question: 'Explain closures; one account went on to self-invoking functions.',
        sources: [WALMART_W10_SDE3_UI, WALMART_W55_FE, WALMART_W16_ENGINEER3],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'let-var-const',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        topic: 'Differences between let, var and const',
        question: 'Explain how let, var and const differ; one account added the kinds of functions JavaScript has.',
        sources: [WALMART_W10_SDE3_UI, WALMART_W3_FE_INDIA],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'why-react',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        topic: 'Why choose React over other frameworks',
        question: 'Why use React rather than other libraries or frameworks, such as Angular?',
        sources: [WALMART_W11_SDE3_UI, WALMART_W15_SDE2],
      },
      {
        id: 'virtual-dom',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        topic: 'Virtual DOM vs the DOM',
        question: 'What is the virtual DOM, and how does it differ from the DOM?',
        sources: [WALMART_W11_SDE3_UI, WALMART_W9_FE],
      },
      {
        id: 'first-missing-positive',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'First Missing Positive',
        question: 'Find the smallest positive integer missing from an unsorted array (LeetCode First Missing Positive).',
        sources: [WALMART_W11_SDE3_UI],
      },
      {
        id: 'two-sum',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Two Sum',
        question: 'Find the two numbers in an array that add up to a target (LeetCode Two Sum), given as a bonus after the first two problems.',
        sources: [WALMART_W11_SDE3_UI],
      },
      {
        id: 'rotated-array-search-variation',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Variation on rotated sorted array search',
        question: 'A variation of searching a rotated sorted array, where the interviewer cared more about the approach than about complete code.',
        sources: [WALMART_W10_SDE3_UI],
      },
      {
        id: 'rotated-array-search',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Search in a rotated sorted array',
        question: 'Search for a value in a rotated sorted array.',
        sources: [WALMART_W17_SDE3],
      },
      {
        id: 'sort-a-stack',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Variant of sorting a stack',
        question: 'A stack problem close to sorting a stack, optimised with small hints from the interviewer.',
        sources: [WALMART_W10_SDE3_UI],
      },
      {
        id: 'dp-and-sliding-window',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Dynamic programming and sliding windows',
        question: 'Problems on dynamic programming and sliding windows.',
        promptNotShared: true,
        sources: [WALMART_W35_SDE3],
      },
      {
        id: 'predict-the-winner',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Predict the Winner',
        question: 'Two players take numbers from either end of an array in turn: can the first player win? (LeetCode Predict the Winner)',
        sources: [WALMART_W8_SDE3],
      },
      {
        id: 'meeting-rooms-variant',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Variant of Meeting Rooms II',
        question: 'A problem close to Meeting Rooms II, the fewest rooms a set of meetings needs, discussed but not coded for lack of time.',
        sources: [WALMART_W8_SDE3],
      },
      {
        id: 'combination-sum-no-duplicates',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Combination Sum variant',
        question: 'A Combination Sum variant: find the combinations that add up to a target without counting duplicate elements.',
        sources: [WALMART_W17_SDE3],
      },
      {
        id: 'all-subsets',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'All subsets of an array',
        question: 'Print every possible subset of an array.',
        sources: [WALMART_W17_SDE3],
      },
      {
        id: 'next-greater-element',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Next Greater Element I',
        question: 'For each number of one array, find the next greater number in a second array (LeetCode Next Greater Element I).',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'add-one-to-number',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Add one to a digit array',
        question: 'Add one to a number given as an array of its digits.',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'median-of-data-stream',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Find Median from Data Stream',
        question: 'Keep the median of a stream of numbers as they arrive (LeetCode Find Median from Data Stream).',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'minimum-taps',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Minimum taps to water a garden',
        question: 'Find the fewest taps to open so that a whole garden is watered (LeetCode Minimum Number of Taps to Open to Water a Garden).',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'zigzag-diagonal-traversal',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Zigzag diagonal matrix traversal',
        question: 'Traverse a matrix along its diagonals in zigzag order.',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'number-of-islands',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Number of Islands',
        question: 'Count the islands in a grid of land and water (LeetCode Number of Islands).',
        sources: [WALMART_W55_FE, WALMART_W16_ENGINEER3],
      },
      {
        id: 'max-profit-day-modified',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Most profitable selling day variant',
        question: 'A modified version of finding the most profitable day to sell, written on paper in a timed round.',
        sources: [WALMART_W16_ENGINEER3],
      },
      {
        id: 'noble-integer',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Noble integer',
        question: 'Find a noble integer: a value in an array equal to the number of elements greater than it.',
        sources: [WALMART_W16_ENGINEER3],
      },
      {
        id: 'dam-walls',
        round: 'DSA round',
        kind: 'Algorithm',
        topic: 'Dam wall placement to save water',
        question: 'A real-world problem: place walls against water overflowing from a dam so that as much water as possible is saved, solvable with dynamic programming.',
        sources: [WALMART_W16_ENGINEER3],
      },
      {
        id: 'optimise-heavy-recursion',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        topic: 'Optimising heavy recursive operations',
        question: 'How would you optimise a heavy recursive operation in JavaScript? The candidate answered with currying.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
      },
      {
        id: 'usecontext-rerenders',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        topic: 'useContext re-renders and prop drilling',
        question:
          'How do you keep components that use useContext from re-rendering needlessly, and how does Context remove prop drilling? The same round covered useMemo, useReducer and React design patterns.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Why Context causes performance issues', path: '/react/trivia/react-context-performance-issues' },
      },
      {
        id: 'ssr-above-the-fold',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Frontend system design',
        topic: 'Above-the-fold SSR and hydration',
        question:
          'The part of a page above the fold is rendered on the server and a React component below it on the client: how do hydration and the parsing of HTML and JavaScript play out?',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'React SSR and hydration', path: '/react/trivia/react-ssr-hydration' },
      },
      {
        id: 'dropdown-component-api',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React build',
        topic: 'Dropdown component API',
        question: 'Write the high-level API of a dropdown component that works as a single-select or a multi-select and accepts custom child components.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Select with compound components', path: '/react/coding/react-select-compound-api' },
      },
      {
        id: 'flexbox-positioning-stacking',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        topic: 'Flexbox, positioning and stacking contexts',
        question: 'CSS questions on flexbox layout, relative and absolute positioning, and how z-index and stacking contexts behave with absolute positioning.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'How z-index works', path: '/css/trivia/css-z-index' },
      },
      {
        id: 'module-federation-performance',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        topic: 'Web performance and module federation',
        question: 'Performance techniques in the browser and in React, and the advanced concepts of module federation.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Code splitting and module federation', path: '/react/trivia/react-code-splitting-module-federation' },
      },
      {
        id: 'implement-usememo',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React build',
        topic: 'useMemo implementation',
        question: 'Explain what useMemo is for, then implement it yourself.',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Implement useMemo and a Context data provider', path: '/react/coding/react-implement-usememo-context' },
      },
      {
        id: 'implement-context-api',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React build',
        topic: 'Context API implementation',
        question: 'Implement the Context API yourself, then extend it to hold the results of an API call.',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Implement useMemo and a Context data provider', path: '/react/coding/react-implement-usememo-context' },
      },
      {
        id: 'responsive-vs-adaptive',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        topic: 'Responsive vs adaptive design',
        question: 'What is the difference between responsive and adaptive design, and which would you choose?',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Making an element responsive', path: '/css/trivia/css-make-element-responsive' },
      },
      {
        id: 'two-pointer-problem',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Algorithm',
        topic: 'Two-pointer problem',
        question: 'An easy-to-medium two-pointer problem, in a 60-minute online round that also covered frontend concepts.',
        promptNotShared: true,
        sources: [WALMART_W9_FE],
      },
      {
        id: 'output-prediction-scope',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        topic: 'Code output prediction and scope',
        question: 'Predict what given code prints, with questions on JavaScript basics and scope.',
        sources: [WALMART_W9_FE],
        practice: { label: 'Predict var hoisting and function shadowing', path: '/javascript/trivia/js-var-hoisting-shadowing-output' },
      },
      {
        id: 'hooks-useeffect',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        topic: 'React hooks and useEffect',
        question: 'Questions on React hooks, most of them about useEffect.',
        sources: [WALMART_W9_FE],
        practice: { label: 'What useEffect is for', path: '/react/trivia/react-useeffect-purpose' },
      },
      {
        id: 'block-inline-flexbox',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        topic: 'Block vs inline elements and flexbox',
        question: 'How block and inline elements differ, and how flexbox lays out its children.',
        sources: [WALMART_W9_FE],
        practice: { label: 'Block and inline elements', path: '/html/trivia/html-block-inline-elements' },
      },
      {
        id: 'class-vs-id',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        topic: 'CSS class vs id',
        question: 'CSS questions such as when to use a class and when an id, in a UI round set for a full-stack candidate.',
        sources: [WALMART_W16_ENGINEER3],
        practice: { label: 'id and class attributes', path: '/html/trivia/html-id-vs-class' },
      },
      {
        id: 'sum-both-call-styles',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        topic: 'Sum with normal and curried calls',
        question: 'Write one sum function that works both as sum(a, b, c) and as sum(a)(b)(c).',
        sources: [WALMART_W37_SDE3_CHENNAI],
        practice: { label: 'Curry function', path: '/javascript/coding/js-curry-function' },
      },
      {
        id: 'chunk-array',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        topic: 'Split an array into chunks',
        question: 'Split an array into chunks of a given size.',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'snippets-closures-currying-hoisting',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        topic: 'Closures, currying, hoisting and call/bind/apply',
        question: 'Code snippets on closures, currying and hoisting, and when to use call, bind and apply.',
        sources: [WALMART_W37_SDE3_CHENNAI],
        practice: { label: 'call, apply and bind', path: '/javascript/trivia/js-call-apply-bind' },
      },
      {
        id: 'angular-lifecycle-services',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Angular concepts',
        topic: 'Angular lifecycle, services and communication',
        question: 'Angular questions on the component lifecycle, services and how components talk to each other.',
        sources: [WALMART_W37_SDE3_CHENNAI],
        practice: { label: 'Angular lifecycle hooks', path: '/angular/trivia/angular-lifecycle-hooks' },
      },
      {
        id: 'async-await-single-thread',
        round: 'DSA round',
        kind: 'JavaScript',
        topic: 'Async/await, Promises and single threading',
        question: 'Write an async and await snippet and a Promise snippet and explain how each runs, then how JavaScript runs on a single thread.',
        sources: [WALMART_W17_SDE3],
        practice: { label: 'JavaScript event loop', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'measure-react-performance',
        round: 'Hiring manager',
        kind: 'React concepts',
        topic: 'Measuring React performance',
        question: 'How do you measure the performance of a React application?',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Performance profiling in browser DevTools', path: '/javascript/trivia/js-performance-profiling-workflow' },
      },
      {
        id: 'redux-hooks-shadow-dom',
        round: 'Technical rounds',
        kind: 'React concepts',
        topic: 'Redux, React hooks and Shadow DOM',
        question: 'Questions on Redux, React hooks and the Shadow DOM.',
        sources: [WALMART_W2_SDE2_BENGALURU],
        practice: { label: 'Redux vs Context vs useState', path: '/react/trivia/react-state-management-redux' },
      },
      {
        id: 'circular-linked-list-delete',
        round: 'Technical rounds',
        kind: 'Algorithm',
        topic: 'Delete from a circular linked list',
        question: 'Find a key in a circular linked list and delete it, leaving the list unchanged when the key is not there.',
        sources: [WALMART_W15_SDE2],
      },
      {
        id: 'implement-queue',
        round: 'Technical rounds',
        kind: 'Algorithm',
        topic: 'Linked list or array queue',
        question: 'Implement a queue of integers on a singly linked list or an array, with its enqueue and dequeue operations.',
        sources: [WALMART_W15_SDE2],
        practice: { label: 'Implement a stack and a queue', path: '/javascript/coding/js-stack-queue-implementation' },
      },
      {
        id: 'react-event-box-model',
        round: 'Technical rounds',
        kind: 'Web fundamentals',
        topic: 'React events, box model, HTML basics',
        question: 'What is an event in React, what makes up the CSS box model, what does the universal selector do, and how do HTML elements differ from tags?',
        sources: [WALMART_W15_SDE2],
        practice: { label: 'The CSS box model', path: '/css/trivia/css-box-model' },
      },
      {
        id: 'angular-feature-until-tests-pass',
        round: 'Online assessment (2026 accounts)',
        kind: 'Practical coding',
        topic: 'Angular feature against existing tests',
        question: 'Add a feature to an existing Angular project until its test cases pass.',
        promptNotShared: true,
        sources: [WALMART_W56_FULLSTACK_2026],
      },
      {
        id: 'react-event-listener-challenges',
        round: 'Coding screen',
        kind: 'React build',
        topic: 'React event listener challenges',
        question: 'React code challenges built around event listeners: not difficult, but slow to finish in the time.',
        promptNotShared: true,
        sources: [WALMART_W6_SENIOR],
      },
      {
        id: 'binary-search-tree',
        round: 'Coding screen',
        kind: 'Algorithm',
        topic: 'Binary search tree problem',
        question: 'A binary search tree problem, set as the code test of a staff frontend loop.',
        promptNotShared: true,
        sources: [WALMART_W1_STAFF_FE],
      },
      {
        id: 'stack-and-counting',
        round: 'Coding screen',
        kind: 'Algorithm',
        topic: 'Stack-based counting problem',
        question: 'A problem solved with a stack and a count, in a CodePair interview for a team that works mostly in React Native.',
        promptNotShared: true,
        sources: [WALMART_W26_CODEPAIR],
      },
      {
        id: 'es6-output-snippets',
        round: 'Coding screen',
        kind: 'JavaScript',
        topic: 'ES6 snippet output prediction',
        question: 'Say what basic ES6 code snippets print, on closures, hoisting and object methods, in a 30-minute exploratory call.',
        sources: [WALMART_W12_REACT_NATIVE],
        practice: { label: 'this in detached methods', path: '/javascript/trivia/js-this-keyword' },
      },
      {
        id: 'html-css-component-then-list',
        round: 'Coding rounds',
        kind: 'UI build',
        topic: 'HTML/CSS component and React Native list',
        question: 'Write the HTML and CSS of a simple UI component in VS Code, then a horizontal list component with simple styles in a React Native playground.',
        sources: [WALMART_W12_REACT_NATIVE],
      },
      {
        id: 'js-engine-react-optimisation',
        round: 'Coding rounds',
        kind: 'JavaScript',
        topic: 'JavaScript engine and React optimisation',
        question:
          'How the JavaScript engine runs synchronous and asynchronous functions, and the React optimisation techniques: memoisation, code splitting, lazy loading, error boundaries, debouncing and throttling.',
        sources: [WALMART_W12_REACT_NATIVE],
        practice: { label: 'Debounce vs throttle for a search input', path: '/javascript/trivia/debounce-vs-throttle-search-input' },
      },
      {
        id: 'hooks-and-their-use',
        round: 'Coding rounds',
        kind: 'React concepts',
        topic: 'Core React hooks and their uses',
        question: 'What useState, useEffect, useMemo, useCallback, useRef and useReducer are for, and how a component uses each, with sample snippets.',
        sources: [WALMART_W12_REACT_NATIVE],
        practice: { label: 'Which React hooks to choose', path: '/react/trivia/react-hooks-youve-used' },
      },
      {
        id: 'hard-recursion-problem',
        round: 'Coding rounds',
        kind: 'Algorithm',
        topic: 'Hard recursion problem',
        question: 'A hard coding problem built on recursion, which the candidate answered in pseudo-code.',
        promptNotShared: true,
        sources: [WALMART_W20_SWE3_FE],
      },
      {
        id: 'vanilla-accordion',
        round: 'Coding rounds',
        kind: 'UI build',
        topic: 'Vanilla JavaScript accordion',
        question: 'Build an accordion in plain JavaScript, in a round with no React questions.',
        sources: [WALMART_W55_FE],
        practice: { label: 'React accordion', path: '/react/coding/react-accordion-faq' },
      },
      {
        id: 'add-two-numbers-with-promises',
        round: 'Coding rounds',
        kind: 'JavaScript',
        topic: 'Adding two numbers with Promises',
        question: 'Add two numbers using promises.',
        sources: [WALMART_W55_FE],
        practice: { label: 'Add two promises', path: '/javascript/coding/js-add-two-promises' },
      },
      {
        id: 'valid-anagram',
        round: 'Coding rounds',
        kind: 'Algorithm',
        topic: 'Valid Anagram',
        question: 'Check whether two strings are anagrams of each other (LeetCode Valid Anagram).',
        sources: [WALMART_W55_FE],
        practice: { label: 'Valid Anagram', path: '/javascript/coding/js-valid-anagram' },
      },
      {
        id: 'best-time-to-buy-and-sell',
        round: 'Coding rounds',
        kind: 'Algorithm',
        topic: 'Best stock buy and sell days',
        question: 'Find the best day to buy and the best later day to sell a stock (LeetCode Best Time to Buy and Sell Stock).',
        sources: [WALMART_W55_FE],
      },
      {
        id: 'hoisting-callback-hell-es6',
        round: 'Coding rounds',
        kind: 'JavaScript',
        topic: 'Hoisting, callback hell and ES6 features',
        question: 'Explain hoisting, show callback hell with an example, and go through the ES6 features in detail.',
        sources: [WALMART_W55_FE],
        practice: { label: 'Promise chains and async and await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'react-components-and-apis-design',
        round: 'System design',
        kind: 'Frontend system design',
        topic: 'React components and back-end API design',
        question:
          'A design problem taken from a high-level design down to how React components talk to the back-end APIs, including the choice between polling and WebSockets.',
        promptNotShared: true,
        sources: [WALMART_W13_SWE3],
        practice: { label: 'SSE vs WebSocket', path: '/javascript/trivia/sse-vs-websocket-real-time' },
      },
      {
        id: 'page-load-performance',
        round: 'System design',
        kind: 'Frontend system design',
        topic: 'Page load and render performance',
        question:
          'How would you make the page load and render faster: lazy loading, resource hints, fewer and smaller requests, async or defer scripts, list virtualisation, and which Lighthouse metrics (FCP, LCP, TTI) you would track?',
        sources: [WALMART_W13_SWE3],
        practice: { label: 'Optimise page load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'xss-protection',
        round: 'System design',
        kind: 'Web fundamentals',
        topic: 'Cross-site scripting protection',
        question: 'How do you protect a web application against cross-site scripting?',
        sources: [WALMART_W13_SWE3],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
      },
      {
        id: 'react-ui-with-performance',
        kind: 'React build',
        topic: 'React UI built for performance',
        question: 'Build a UI application in React with optimisation and browser performance in mind, after theory questions on HTML, CSS, JavaScript and React.',
        promptNotShared: true,
        sources: [WALMART_W32_FE],
      },
      {
        id: 'debug-frontend-issues',
        kind: 'Web fundamentals',
        topic: 'Debugging front-end issues',
        question: 'How would you go about debugging front-end issues? It was the only frontend question in that loop.',
        sources: [WALMART_W20_SWE3_FE],
      },
      {
        id: 'phone-keypad-words',
        kind: 'Algorithm',
        topic: 'Words from phone keypad digits',
        question: 'Print every word that a string of phone keypad digits can spell.',
        sources: [WALMART_W5_SDE3_UI_2019],
      },
      {
        id: 'type-conversion',
        kind: 'JavaScript',
        topic: 'JavaScript type conversion',
        question: 'How does JavaScript convert types internally?',
        sources: [WALMART_W5_SDE3_UI_2019],
        practice: { label: 'Type coercion', path: '/javascript/trivia/js-type-coercion' },
      },
    ],
    // Role-specific asides are left out: a question on AI and ML interests (W17) and Walmart work ethics (W15).
    behaviouralQuestions: [
      {
        id: 'why-walmart',
        question: 'Why do you want to join Walmart?',
        sources: [WALMART_W11_SDE3_UI, WALMART_W15_SDE2],
      },
      {
        id: 'why-leaving',
        question: 'Why are you leaving your current company? One hiring manager questioned every reason the candidate gave.',
        sources: [WALMART_W10_SDE3_UI, WALMART_W17_SDE3, WALMART_W55_FE],
      },
      {
        id: 'most-challenging-work',
        question: 'What is the most challenging task or feature you have worked on?',
        sources: [WALMART_W10_SDE3_UI, WALMART_W17_SDE3],
      },
      {
        id: 'strengths-weaknesses',
        question: 'What are your strengths and weaknesses, and how would you overcome the weaknesses?',
        sources: [WALMART_W10_SDE3_UI],
      },
      {
        id: 'innovation-in-projects',
        question: 'What innovation have you brought to your projects?',
        sources: [WALMART_W11_SDE3_UI],
      },
      {
        id: 'testing-ci-cd-reviews',
        question: 'Which testing frameworks and kinds of testing do you use, how do your CI/CD pipelines work, and how do you review pull requests?',
        sources: [WALMART_W11_SDE3_UI],
      },
      {
        id: 'between-designer-and-backend',
        question: 'Where does a frontend engineer contribute between the designer and the back-end engineer?',
        sources: [WALMART_W12_REACT_NATIVE],
      },
      {
        id: 'task-from-product-manager',
        question: 'What would you weigh before taking on a task from the product manager?',
        sources: [WALMART_W12_REACT_NATIVE],
      },
      {
        id: 'approach-a-problem',
        question: 'What steps do you take when you approach a problem?',
        sources: [WALMART_W12_REACT_NATIVE],
      },
      {
        id: 'agile-releases',
        question: 'Do you follow Agile, and what does it change when you release a feature?',
        sources: [WALMART_W12_REACT_NATIVE],
      },
      {
        id: 'day-at-work-architecture',
        question: 'Walk through a full day at work and the frontend architecture of your current project.',
        sources: [WALMART_W55_FE],
      },
      {
        id: 'biggest-achievement',
        question: 'What is your biggest achievement so far?',
        sources: [WALMART_W15_SDE2],
      },
    ],
  },
  google: {
    summary:
      'Google\'s hiring pages describe recruiter conversations, possible assessments and a panel of interviews by video or in person. Front-end accounts from 2019 to 2026 describe one or two technical screens, then four or five interviews mixing algorithm coding, usually one JavaScript or frontend round and Googleyness, with a frontend-leaning design round from L5.',
    caveat:
      'The number of frontend rounds varies; one 2026 account had none, and a 2019 candidate went from a hiring-manager quiz straight to the onsite. Google\'s pages say AI tools are not permitted in interviews, while a May 2026 news report describes a pilot for junior to mid-level roles on some US teams with an approved AI assistant in a code comprehension round. Confirm the loop with your recruiter.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Software engineers in front-end roles',
        stages: [
          {
            stage: 'Recruiter conversations',
            format: 'One or two short calls by phone or video.',
            appliesTo: 'All candidates',
            sources: [GOOGLE_HOW_WE_HIRE, GOOGLE_GO5, GOOGLE_GO7],
          },
          {
            stage: 'Assessment',
            format: 'A workstyle assessment, and a coding exercise for some roles.',
            appliesTo: 'Some candidates',
            sources: [GOOGLE_HOW_WE_HIRE],
          },
          {
            stage: 'Technical screen',
            format:
              'About an hour of coding in a plain shared document, in JavaScript or on an algorithm problem. Some candidates have two screens, the second a JavaScript round in Google Docs in a 2023 account, and a 2022 account\'s editor had no syntax highlighting and no way to run the code.',
            appliesTo: 'Front-end candidates',
            sources: [GOOGLE_GO3, GOOGLE_GO4, GOOGLE_GO5, GOOGLE_GO6, GOOGLE_PHONE_2020],
            practice: { label: 'Safe nested-path lookup', path: '/javascript/coding/js-get-by-path-1' },
          },
          {
            stage: 'Interview loop',
            format:
              'Four or five interviews by video or onsite: algorithm coding and usually one JavaScript or frontend round. Two accounts had more frontend rounds, and in a 2021 account every question started easy and grew to medium or hard once solved. The Googleyness interview has its own row below.',
            appliesTo: 'All candidates',
            sources: [GOOGLE_HOW_WE_HIRE, GOOGLE_GO1, GOOGLE_GO2, GOOGLE_GO4, GOOGLE_GO7, GOOGLE_GO8, GOOGLE_ONSITE_2019, GOOGLE_L3L4_2019],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'Googleyness interview',
            format:
              'About 45 minutes of behavioural and hypothetical questions, which several accounts call Googleyness and Leadership. In three 2026 accounts it sat in a first, virtual stage with one technical round, before the onsite coding, and one early-career loop added 15 minutes of it to a technical interview. A May 2026 press report describes a pilot on some US teams that adds a technical design discussion about a past project to this round.',
            appliesTo: 'All candidates',
            sources: [
              GOOGLE_INTERVIEW_TIPS,
              GOOGLE_REWORK_STRUCTURED,
              GOOGLE_INTERVIEW_2020,
              GOOGLE_GO8,
              GOOGLE_GO1,
              GOOGLE_GO7,
              GOOGLE_GO6,
              GOOGLE_GL_NEW_GRAD_2024,
              GOOGLE_GL_ML_2025,
              GOOGLE_GL_L4_US_2026,
              GOOGLE_GL_L3_2026,
              GOOGLE_GL_L4_2024,
              GOOGLE_GL_L4_BLR_2026,
              GOOGLE_PILOT_PRESS_2026,
            ],
            practice: { label: 'Googleyness questions and story drill', path: '/companies/google/preview', fragment: 'google-round-googleyness', drill: true },
          },
          {
            stage: 'System design',
            format:
              'A design round with a frontend and API focus in most accounts; one L5 candidate reported a non-frontend design round. A 2019 front end onsite, level not stated, included an app design round.',
            appliesTo: 'L5 and above',
            sources: [GOOGLE_GO1, GOOGLE_GO2, GOOGLE_GO8, GOOGLE_ONSITE_2019],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Hiring committee and team match',
            format: 'A hiring committee review and team matching after the loop; the order varies between accounts.',
            appliesTo: 'All candidates',
            sources: [GOOGLE_GO2, GOOGLE_GO7],
          },
        ],
      },
    ],
    // Row 1 is the question behind the guide's first prompt (a depth-first walk over a tree of nodes). It rests on the
    // December 2020 Blind thread, a question bank whose poster mixed their own questions with ones found online; its
    // other frontend items are rows without a round, and its algorithm puzzles stay out (see the proposal). Left out by
    // content: the 2019 hiring manager's quiz on SQL and deadlocks, and a 2021 L5 design round spent implementing backend
    // APIs. Left out for want of a subject: the 2022 L5 JavaScript round's two questions, unnamed design and screen tasks
    // in Taro accounts, and the April 2026 Medium account's three algorithm rounds.
    questions: [
      {
        id: 'dfs-over-html-nodes',
        kind: 'JavaScript',
        topic: 'DFS over HTML nodes',
        question: 'Perform a depth-first search over the nodes of an HTML document.',
        sources: [GOOGLE_FE_THREAD],
        practice: { label: 'Find a node in a DOM tree', path: '/javascript/coding/js-dom-find-node' },
        answerGuide: 'nested-navigation-tree',
      },
      {
        id: 'throttle-wrapper',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Throttle',
        question:
          'Write a throttle wrapper for an expensive function, so that it runs at most once per time interval and calls in between do nothing, then handle parameters, including an unknown number of them.',
        sources: [GOOGLE_PHONE_2020, GOOGLE_FE_THREAD],
        practice: { label: 'Throttle function', path: '/javascript/coding/js-throttle' },
      },
      {
        id: 'ambigram-problem',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Ambigram problem',
        question:
          'A problem about ambigrams that the candidate had not seen on any practice site, solved with left and right pointers, then an added requirement that took it from easy to medium.',
        promptNotShared: true,
        sources: [GOOGLE_GO3],
      },
      {
        id: 'large-data-display',
        round: 'Technical screen',
        kind: 'Practical coding',
        topic: 'Displaying large sets of data',
        question:
          'How would you handle a large set of data and represent or display it to the user? The question then asked for a function that displays a large set of IP addresses.',
        sources: [GOOGLE_GO3],
      },
      {
        id: 'dom-manipulation-call',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'DOM manipulation',
        question: 'A DOM manipulation question in a technical call; the commenter gives no further detail.',
        promptNotShared: true,
        sources: [GOOGLE_GO8_DOM_2021],
      },
      {
        id: 'combine-callback-results',
        round: 'Interview loop',
        kind: 'JavaScript',
        topic: 'Combining callback results',
        question:
          'Write a function that takes a list of functions, such as a fetcher that takes user input and a callback, and consolidates all their results into one array, or returns an empty array.',
        sources: [GOOGLE_ONSITE_2019],
        practice: { label: 'Implement Promise.all', path: '/javascript/coding/js-promise-all' },
      },
      {
        id: 'delayed-run-api',
        round: 'Interview loop',
        kind: 'JavaScript',
        topic: 'Delayed-run API',
        question:
          'Design an API that takes a function and a duration and runs the function after that interval; a call made before the interval ends still waits for it.',
        sources: [GOOGLE_ONSITE_2019],
        practice: { label: 'Debounce function', path: '/javascript/coding/js-debounce' },
        answerGuide: 'debounce-cancel-flush',
      },
      {
        id: 'sequential-execution-queue',
        round: 'Interview loop',
        kind: 'JavaScript',
        topic: 'Sequential execution queue',
        question:
          'Design an API that takes objects and runs each one only after the previous object in the queue has finished, and say how you know the previous one finished.',
        sources: [GOOGLE_ONSITE_2019],
      },
      {
        id: 'minimum-window-substring',
        round: 'Interview loop',
        kind: 'Algorithm',
        topic: 'Minimum window substring',
        question: 'A problem told as a story that reduced to LeetCode\'s Minimum Window Substring (76).',
        sources: [GOOGLE_ONSITE_2019],
      },
      {
        id: 'async-and-closures',
        round: 'Interview loop',
        kind: 'JavaScript',
        topic: 'Async JavaScript and closures',
        question: 'A front-end round on asynchronous JavaScript and closures, beside three algorithm rounds.',
        promptNotShared: true,
        sources: [GOOGLE_L3L4_2019],
      },
      {
        id: 'promise-task-sequencing',
        round: 'Interview loop',
        kind: 'JavaScript',
        topic: 'Task sequencing with promises',
        question:
          'A task-sequencing problem that began as a topological sort, then moved to promise methods for running the tasks in the order the interviewer wanted, coded in JavaScript.',
        sources: [GOOGLE_GO7],
      },
      {
        id: 'retry-and-promise-methods',
        round: 'Interview loop',
        kind: 'JavaScript',
        topic: 'Retry function and promise methods',
        question: 'In the one frontend round, implement a retry function, then the promise methods then, catch and finally.',
        sources: [GOOGLE_GO7],
        practice: { label: 'Retry a promise-returning function with delay', path: '/javascript/coding/js-retry-with-delay' },
      },
      {
        id: 'critical-rendering-path',
        round: 'Interview loop',
        kind: 'Web fundamentals',
        topic: 'Critical rendering path',
        question: 'Later in the same frontend round, talk about the critical rendering path and ways to optimise it.',
        sources: [GOOGLE_GO7],
        answerGuide: 'frontend-performance-network-security',
      },
      {
        id: 'hash-map-and-set-problem',
        round: 'Interview loop',
        kind: 'Algorithm',
        topic: 'Hash map and hash set problem',
        question: 'An easy problem built on a hash map and a hash set, coded and run against test cases in about 30 minutes.',
        promptNotShared: true,
        sources: [GOOGLE_GO7],
      },
      {
        id: 'paths-in-2d-array',
        round: 'Interview loop',
        kind: 'Algorithm',
        topic: 'Paths in a 2D array',
        question: 'A second problem in that round: manipulating a 2D array to find paths.',
        promptNotShared: true,
        sources: [GOOGLE_GO7],
      },
      {
        id: 'string-manipulation-autocomplete',
        round: 'Interview loop',
        kind: 'JavaScript',
        topic: 'String manipulation and autocomplete',
        question: 'A string manipulation problem that led to implementing a basic autocomplete.',
        sources: [GOOGLE_GO7],
        practice: { label: 'React autocomplete', path: '/react/coding/react-autocomplete-search-starter' },
        answerGuide: 'accessible-autocomplete',
      },
      {
        id: 'graph-problem-bfs',
        round: 'Interview loop',
        kind: 'Algorithm',
        topic: 'Graph problem',
        question: 'A graph problem in a general coding round; the candidate solved about three quarters of it with breadth-first search.',
        promptNotShared: true,
        sources: [GOOGLE_GO1],
      },
      {
        id: 'quad-tree-problem',
        round: 'Interview loop',
        kind: 'Algorithm',
        topic: 'Quad tree problem',
        question:
          'A coding problem the interviewer expected to be solved with a quad tree; the candidate took a graph approach, wrote part of it and talked through the quad tree steps afterwards.',
        promptNotShared: true,
        sources: [GOOGLE_GO1],
      },
      {
        id: 'drone-shopping-app',
        round: 'System design',
        kind: 'Product design',
        topic: 'Drone shopping app',
        question: 'Design an app like Google Express in which drones shop for the items you order.',
        sources: [GOOGLE_ONSITE_2019],
      },
      {
        id: 'dom-number-table',
        kind: 'UI build',
        topic: 'Number table in the DOM',
        question: 'Given N, print a table in the DOM filled with numbers in a set pattern.',
        sources: [GOOGLE_FE_THREAD],
      },
      {
        id: 'timeout-function-wrapper',
        kind: 'JavaScript',
        topic: 'Timeout function wrapper',
        question: 'Write a function that takes f and returns a version of f that runs on a timeout.',
        sources: [GOOGLE_FE_THREAD],
      },
      {
        id: 'minesweeper-reveal',
        kind: 'Algorithm',
        topic: 'Minesweeper reveal',
        question:
          'Write Minesweeper\'s reveal(): return how many tiles a click shows, where clicking a bomb ends the game and clicking a zero reveals its neighbours.',
        sources: [GOOGLE_FE_THREAD],
      },
      {
        id: 'link-click-in-browser',
        kind: 'Web fundamentals',
        topic: 'What happens on a link click',
        question: 'Describe what happens in the browser when a user clicks a link.',
        sources: [GOOGLE_FE_THREAD],
      },
      {
        id: 'google-doc-outline-view',
        kind: 'UI build',
        topic: 'Google Doc outline view',
        question: 'Implement the outline view of a Google Doc page.',
        sources: [GOOGLE_FE_THREAD],
      },
    ],
    // Google's own example questions stay in the Googleyness decoder on the guide; these are the ones accounts report.
    behaviouralQuestions: [
      {
        id: 'current-project-walkthrough',
        question: 'Walk me through your current project, how it is structured and your role in it.',
        sources: [GOOGLE_GO6],
      },
      {
        id: 'unclear-requirements',
        question: 'You have just joined a project with unclear requirements. How do you move forward?',
        sources: [GOOGLE_GO6],
      },
      {
        id: 'tight-deadline',
        question:
          'Tell me about a time you worked to a tight or strict deadline, and how you managed it. Follow-ups asked what you would do differently and how the team responded.',
        sources: [GOOGLE_GO6, GOOGLE_GL_NEW_GRAD_2024],
      },
      {
        id: 'teammate-takes-credit',
        question: 'On a team project where everyone contributed, one teammate takes the credit. What do you do, and what if it keeps happening?',
        sources: [GOOGLE_GL_ML_2025, GOOGLE_GL_NEW_GRAD_2024],
      },
      {
        id: 'everything-is-p0',
        question: 'You are overwhelmed with work and everything is marked P0. How do you tackle it?',
        sources: [GOOGLE_GL_ML_2025],
      },
      {
        id: 'too-many-tasks',
        question: 'Tell me about a time you could not handle several tasks at once. How did you react and make amends?',
        sources: [GOOGLE_GL_ML_2025],
      },
      {
        id: 'helping-someone-fit-in',
        question: 'Tell me about a time someone found it hard to fit into a culturally diverse team, and how you helped them.',
        sources: [GOOGLE_GL_ML_2025],
      },
      {
        id: 'overwhelmed-team-as-manager',
        question: 'As a manager, you learn that people on your team feel overwhelmed. How do you approach it?',
        sources: [GOOGLE_GL_ML_2025],
      },
      {
        id: 'biggest-disappointment',
        question: 'What is your biggest disappointment, and why do you think it happened?',
        sources: [GOOGLE_GL_ML_2025],
      },
      {
        id: 'most-rewarding-part',
        question: 'What is the most rewarding part of developing something, for you?',
        sources: [GOOGLE_GL_NEW_GRAD_2024],
      },
      {
        id: 'conflicting-perspectives',
        question: 'Tell me about a time you had conflicting perspectives with your teammates. Were your suggestions considered?',
        sources: [GOOGLE_GL_NEW_GRAD_2024],
      },
      {
        id: 'tough-decision',
        question: 'Tell me about a tough decision you had to make, and what you weighed.',
        sources: [GOOGLE_GL_NEW_GRAD_2024],
      },
      {
        id: 'build-a-team',
        question: 'How would you build a team?',
        sources: [GOOGLE_GL_L4_2024],
      },
      {
        id: 'underperforming-team',
        question: 'You are appointed manager of an underperforming team. How do you handle it?',
        sources: [GOOGLE_GL_L4_2024],
      },
      {
        id: 'resolve-team-conflict',
        question: 'How would you resolve a conflict within a team?',
        sources: [GOOGLE_GL_L4_2024],
      },
    ],
  },
  meta: {
    title: 'Meta Front End Engineer interview process',
    summary:
      'Meta\'s hiring page describes a recruiter conversation, an initial screening and a full loop, and its Front End Engineer guides describe a JavaScript screen with an engineer, then 4 to 6 interviews of JavaScript coding, UI architecture and design, and behavioural questions. Full-time accounts from 2020 to 2025 describe rounds of the same kinds; internship candidates in 2021 and 2022 had a recruiter call and one or two JavaScript interviews.',
    caveat:
      'Meta\'s pages and guides differ on details: the screen is 60 minutes on the prep page and 45 in its guide, and the loop is at least three conversations on the page and 4 to 6 interviews in the guide. Meta\'s hiring page says select roles now have an AI assistant in CoderPad that candidates are expected to use, and lists TypeScript but not JavaScript for its AI-native coding interview, while the front end guides ask for JavaScript and rule out AI tools. No account mentions the assistant, so confirm the format with your recruiter.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Front End Engineer, IC4 to IC6',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'A call about your background and interest in Meta; some recruiters add a short JavaScript quiz. In a 2021 full-time account the quiz was 10 questions on the DOM, JavaScript and CSS, two of the accounts cited here are internship processes, and a 2025 recruiter screen took 20 minutes.',
            // Meta's page says the process "typically" starts here; ME9, ME10 and ME12 do not mention the call.
            appliesTo: 'Most candidates',
            sources: [META_HIRING, META_ME1, META_ME2, META_ME3, META_ME11, META_ME14],
          },
          {
            stage: 'Initial technical screen',
            format:
              'A JavaScript coding interview with an engineer: 60 minutes on Meta\'s prep page, 45 in its guide. The guide gives 35 of the 45 minutes to code; most accounts from 2021 to 2025 describe two problems, and candidates in 2022 and 2025 ran out of time.',
            appliesTo: 'IC4 to IC5',
            sources: [META_FEE_INITIAL, META_ME3, META_ME6, META_ME8, META_ME9, META_ME10, META_ME14],
            // The flatten task practises a locked question, so the open link is another built-in written by hand.
            practice: { label: 'Implement arrayForEach', path: '/javascript/coding/js-array-foreach' },
          },
          {
            stage: 'Full loop: coding',
            format:
              'About two problems in about 40 minutes, in JavaScript, with no dynamic programming, in Meta\'s guide. Loops in accounts from 2020, 2021, 2022 and 2025 had two coding interviews each, and a 2021 onsite was HTML, CSS and JavaScript throughout.',
            appliesTo: META_ROLE,
            sources: [META_FEE_ONSITE, META_ME4, META_ME5, META_ME6, META_ME7, META_ME11],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
            rehearsal: { label: 'Meta coding round, 2 problems in 40 minutes', path: '/javascript/coding/js-debounce' },
          },
          {
            stage: 'Full loop: UI architecture and design',
            format:
              'A 45-minute design interview with no coding, in Meta\'s guide, which names Excalidraw among the loop\'s tools. Meta\'s hiring page now says design interviews are held in CoderPad with Mermaid markdown and the same AI assistant as the coding interview. A 2022 L5 candidate was told in feedback that both coding rounds and the behavioural interview went well and this one did not.',
            appliesTo: META_ROLE,
            sources: [META_FEE_ONSITE, META_HIRING, META_ME4, META_ME5, META_ME6, META_ME7, META_ME11],
            practice: { label: 'Infinite scroll list design', path: '/system-design/infinite-scroll-list' },
          },
          {
            stage: 'Full loop: behavioural',
            format:
              'A 45-minute interview about your background, past projects and the impact you want to make, in Meta\'s guide. A 2021 E4 loop had two behavioural interviews, and in a 2025 loop the last round mixed behavioural questions with light HTML and CSS coding.',
            appliesTo: META_ROLE,
            sources: [META_FEE_ONSITE, META_ME4, META_ME5, META_ME7, META_ME11, META_ME12],
            practice: { label: 'Behavioural questions and story drill', path: '/companies/meta/preview', fragment: 'meta-round-behavioural', drill: true },
          },
        ],
      },
      {
        title: 'Front End Engineer internships',
        stages: [
          {
            stage: 'Internship recruiter call',
            format: 'A screening call with a recruiter, with basic JavaScript questions in the 2021 and 2022 accounts.',
            appliesTo: 'Interns',
            sources: [META_ME1, META_ME2],
          },
          {
            stage: 'Technical interviews',
            format:
              'One or two JavaScript coding interviews; the 2022 account says its two were by video call. A 2021 candidate was told to be comfortable with plain JavaScript and that no framework questions, such as React, would come up.',
            appliesTo: 'Interns',
            sources: [META_ME1, META_ME2, META_ME2B],
          },
        ],
      },
    ],
    // Left out for want of a task: the 2021 E4 account's phone interview "relevant to frontend" and its onsite, the
    // December 2021 internship's "phone screen + 2 technicals" with no question named, the 2020 loop's app design
    // interview and its behavioural talk on previous experience, the 2025 offer's phone round on core JavaScript, its
    // recursion and its light HTML and CSS coding, the February 2021 recruiter quiz of 10 unlisted questions and the DOM
    // question of its phone screen, the "synchronization" topic of the 2021 London recruiter call, the L5 candidate's
    // note of about 12 recurring questions, and a Meta-badged reply on the 2023 thread about DOM walks, which is advice
    // rather than the poster's loop. Rounds are left out where the accounts of one question name different rounds
    // (clear-all-timeout, flatten-nested-array) or none (matrix-operations-class). Behavioural questions are in
    // behaviouralQuestions, open.
    questions: [
      {
        id: 'map-from-scratch',
        round: 'Technical interviews',
        kind: 'JavaScript',
        topic: 'Array.prototype.map from scratch',
        question:
          'Write your own version of JavaScript\'s array map without calling the built-in, in the first coding round of a 2021 front end internship process in London.',
        sources: [META_ME1],
        practice: { label: 'Implement Array.prototype.map', path: '/javascript/coding/js-array-prototype-map' },
        answerGuide: 'implement-map-from-scratch',
      },
      {
        id: 'twin-dom-tree-node',
        round: 'Technical interviews',
        kind: 'JavaScript',
        topic: 'Corresponding node in twin DOM trees',
        question:
          'Traverse up a DOM tree from a given node, then repeat the same traversal on a similar tree. It came in the same internship coding round as the map question.',
        sources: [META_ME1],
        practice: { label: 'Find the corresponding node in twin DOM trees', path: '/javascript/coding/js-dom-twin-node' },
        answerGuide: 'twin-dom-tree-node',
      },
      {
        id: 'closures',
        round: 'Internship recruiter call',
        kind: 'JavaScript',
        topic: 'Closures',
        question: 'What is a closure? One of the basic JavaScript questions recruiters asked in internship processes in 2021 and 2022.',
        sources: [META_ME2, META_ME1],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'var-let-const',
        round: 'Internship recruiter call',
        kind: 'JavaScript',
        topic: 'Differences between var, let and const',
        question: 'How do var, let and const differ? Part of a recruiter\'s short JavaScript quiz for a 2022 internship.',
        sources: [META_ME2],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'arrow-functions-and-this',
        round: 'Internship recruiter call',
        kind: 'JavaScript',
        topic: 'Arrow functions and this',
        question: 'A recruiter\'s screening call for a 2021 London internship covered arrow functions and the this keyword among basic JavaScript concepts.',
        promptNotShared: true,
        sources: [META_ME1],
        practice: { label: 'Arrow functions versus regular functions', path: '/javascript/trivia/js-arrow-vs-regular-functions' },
      },
      {
        id: 'stacks-and-queues',
        round: 'Internship recruiter call',
        kind: 'Algorithm',
        topic: 'Stacks and queues',
        question: 'A recruiter\'s screening call for a 2021 London internship covered stacks and queues among basic JavaScript concepts.',
        promptNotShared: true,
        sources: [META_ME1],
        practice: { label: 'Stack versus queue in JavaScript', path: '/javascript/trivia/js-queue-vs-stack' },
      },
      {
        id: 'dom-element-store',
        round: 'Initial technical screen',
        kind: 'JavaScript',
        topic: 'Store keyed by DOM elements',
        question:
          'Write a DOMStore class whose set, get and has methods take a DOM element as the key, so a value stored for one element is found again for that element. It was the first of two problems in a 2022 first technical interview.',
        sources: [META_ME3],
        practice: { label: 'Map versus a plain object', path: '/javascript/trivia/js-map-vs-object' },
      },
      {
        id: 'memoization',
        round: 'Initial technical screen',
        kind: 'JavaScript',
        topic: 'Memoization',
        question:
          'Explain memoization, then write a function that caches the results of earlier calls: the second of two problems in a 2022 first technical interview that the interviewer stopped after 50 minutes.',
        sources: [META_ME3],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
        answerGuide: 'memoize-with-cache-keys',
      },
      {
        id: 'hash-map-class',
        round: 'Initial technical screen',
        kind: 'JavaScript',
        topic: 'Hash map class in JavaScript',
        question:
          'Create your own map class, a hash map, in JavaScript: listed among the JavaScript questions of a 2021 Facebook screen, and the one question of a 2023 phone screen.',
        sources: [META_ME8, META_ME6],
      },
      {
        id: 'event-emitter',
        round: 'Initial technical screen',
        kind: 'JavaScript',
        topic: 'Event emitter',
        question:
          'Build an event emitter that keeps the events registered on it and calls them later: one of two problems on the browser and JavaScript, not algorithms, in a 2024 technical video interview.',
        sources: [META_ME9],
        practice: { label: 'Event emitter', path: '/javascript/coding/js-event-emitter-mini' },
      },
      {
        id: 'settimeout-in-the-browser',
        round: 'Initial technical screen',
        kind: 'JavaScript',
        topic: 'Timers and setTimeout in the browser',
        question: 'A question on setTimeout in the browser, one of two in a 2021 technical phone screen; the other was on the DOM.',
        promptNotShared: true,
        sources: [META_ME14],
      },
      {
        id: 'stack-in-javascript',
        kind: 'Algorithm',
        topic: 'Writing a stack in JavaScript',
        question: 'Explain how you would write a stack in JavaScript, in a 2024 first round on basic data structures such as stacks and queues.',
        sources: [META_ME15],
        practice: { label: 'Implement a stack and a queue', path: '/javascript/coding/js-stack-queue-implementation' },
        answerGuide: 'stack-and-queue-in-javascript',
      },
      {
        id: 'circular-linked-list-insert',
        round: 'Initial technical screen',
        kind: 'Algorithm',
        topic: 'Insert into a circular linked list',
        question: 'Insert a value into a circular linked list: the first of two problems in a 2025 technical screen that the candidate could not finish in time.',
        sources: [META_ME10],
      },
      {
        id: 'children-sum-tree-check',
        round: 'Initial technical screen',
        kind: 'Algorithm',
        topic: 'Tree check on children sums',
        question:
          'Check a tree to see whether, at every node, the sum of the children\'s values is less than the node\'s own value: the second of two problems in a 2025 technical screen.',
        sources: [META_ME10],
      },
      {
        id: 'dom-traversal-collect-nodes',
        round: 'Full loop: coding',
        kind: 'JavaScript',
        topic: 'DOM traversal that collects nodes',
        question: 'Traverse the DOM and collect nodes: the one DOM algorithm problem in a 2021 onsite that was otherwise HTML, CSS and JavaScript.',
        sources: [META_ME6],
        practice: { label: 'Find a node in a DOM tree', path: '/javascript/coding/js-dom-find-node' },
        answerGuide: 'traverse-dom-collect-nodes',
      },
      {
        id: 'dom-traversal-style-problems',
        round: 'Full loop: coding',
        kind: 'JavaScript',
        topic: 'DOM traversal problems',
        question:
          'Two of the coding questions in a 2022 L5 loop were in the style of DOM traversal; none was a pure tree, depth-first or breadth-first search problem.',
        promptNotShared: true,
        sources: [META_ME4],
      },
      {
        id: 'number-of-islands',
        round: 'Full loop: coding',
        kind: 'Algorithm',
        topic: 'Number of islands',
        question:
          'Given a two-dimensional grid of 1s and 0s, count the connected islands: asked in a 2020 New York loop whose four 45-minute interviews included two on basic algorithms.',
        sources: [META_ME7],
      },
      {
        id: 'dom-from-json',
        round: 'Full loop: coding',
        kind: 'JavaScript',
        topic: 'Building a DOM from JSON',
        question:
          'Build a DOM from JSON: one of the JavaScript function tasks, beside flattening nested arrays and recursion, in the two coding rounds of a 2025 Menlo Park loop that ended in an offer.',
        sources: [META_ME11],
        practice: { label: 'Build a DOM renderer from a nested object', path: '/javascript/coding/js-dom-renderer' },
      },
      {
        id: 'autocomplete-component-design',
        round: 'Full loop: UI architecture and design',
        kind: 'Frontend system design',
        topic: 'Autocomplete component design',
        question:
          'Design the front end of one specific component, such as an autocomplete or a typeahead, rather than of a whole product. A 2022 L5 candidate who had prepared the front end of systems such as Facebook or Instagram was caught out by it.',
        sources: [META_ME4, META_ME6],
        practice: { label: 'Real-time search with debounce and caching', path: '/system-design/realtime-search-debounce-cache' },
        answerGuide: 'autocomplete-component-design',
      },
      {
        id: 'messaging-frontend-architecture',
        round: 'Full loop: UI architecture and design',
        kind: 'Frontend system design',
        topic: 'Messaging system front end',
        question:
          'How would you architect the front end of a messaging system? A 2025 account lists it for its design round in nearly the same words as an example in Meta\'s full loop guide, and describes the round\'s scenarios only as like a messaging UI or a dashboard.',
        sources: [META_ME11],
        practice: { label: 'Design a real-time messaging inbox', path: '/system-design/messaging-inbox-frontend' },
      },
      {
        id: 'clear-all-timeout',
        kind: 'JavaScript',
        topic: 'Clearing all pending timeouts',
        question:
          'Write a clearAllTimeout that cancels every timer still pending: listed among the JavaScript questions of a 2021 Facebook screen, and asked in a 2022 internship technical interview whose coding questions, the candidate says, came from BigFrontend.',
        sources: [META_ME2, META_ME6],
        practice: { label: 'Timer manager', path: '/javascript/coding/js-timer-manager' },
        answerGuide: 'clear-all-timeout',
      },
      {
        id: 'flatten-nested-array',
        kind: 'JavaScript',
        topic: 'Flattening a nested array',
        question:
          'Flatten a nested array: listed among the JavaScript questions of a 2021 Facebook screen, and among the tasks of the two coding rounds in a 2025 loop.',
        sources: [META_ME11, META_ME6],
        practice: { label: 'Flatten with depth', path: '/javascript/coding/js-flatten-depth' },
      },
      {
        id: 'matrix-operations-class',
        kind: 'Algorithm',
        topic: 'Matrix operations class',
        question:
          'Implement a class with several functions for matrix operations, such as rotating a matrix; one function was easy and another harder. It was the first of two coding questions in a 2021 interview.',
        sources: [META_ME13],
      },
    ],
    // Only questions an account reports: the drill's questions written from Meta's guide stay in the drill, since a row
    // needs an account. The 2020 loop's "previous experiences" names a subject, not a question.
    behaviouralQuestions: [
      {
        id: 'hard-bug-story',
        question: 'Tell me about a bug you had to debug.',
        sources: [META_ME11],
      },
      {
        id: 'past-ui-challenge',
        question: 'Tell me about a UI challenge in a past project.',
        sources: [META_ME11],
      },
      {
        id: 'conflict-resolution',
        question: 'Tell me about a conflict you resolved, and how it shaped the way you approach project work.',
        sources: [META_ME12],
      },
    ],
  },
  microsoft: {
    summary:
      'Microsoft\'s hiring tips describe a brief screening conversation for some candidates, then usually two to four conversations of up to an hour each. Frontend accounts from 2020 to 2025 run from a single technical interview to six rounds, mixing machine coding, JavaScript and React concepts, algorithms, design and a hiring manager conversation; a 2020 Bangalore loop ended with an As Appropriate round.',
    caveat:
      'A 2020 Bangalore loop ran six rounds and a 2021 one five, more than the two to four conversations on Microsoft\'s page, and in 2022 and 2024 two frontend candidates were interviewed almost only on algorithms. Check the rounds of your own loop with the recruiter.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend roles (the loop varies by team)',
        stages: [
          {
            stage: 'Recruiter or HR call',
            format:
              'A short call before the interviews. Microsoft\'s hiring tips say a team may hold a brief screening conversation before deciding whom to invite; a 2022 Tel Aviv account had a short HR phone call, a 2024 Belgrade one an HR introduction, and in 2020 a headhunting firm working for Microsoft made the first call.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_HIRING_TIPS, MICROSOFT_MS1, MICROSOFT_MS4, MICROSOFT_MS8],
          },
          {
            stage: 'Machine coding',
            format:
              'A UI build within the round: plain JavaScript, HTML and CSS in 2020–2021 Bangalore accounts, mostly React in 2024–2025. In 2020 a Software Engineer II (UI) loop gave it two hours, with the interviewer there for questions and possibly a starter zip; another 2020 Bangalore candidate built one in an hour-long phone round with two interviewers and was told to run the code when time ran out.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS3, MICROSOFT_MS10, MICROSOFT_MS6, MICROSOFT_MS7, MICROSOFT_MS9],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'JavaScript and React concepts',
            format:
              'Questions and short coding tasks on JavaScript and React: output prediction, polyfills and promises. A 2020 round of an hour began with ten minutes on the candidate\'s own machine-coding code; a 2022 Tel Aviv loop held two one-hour technical interviews on Teams, and a 2024 SDE 2 loop paired the questions with algorithm problems.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS4, MICROSOFT_MS7, MICROSOFT_MS9],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Algorithms and problem solving',
            format:
              'Data-structure and algorithm problems, usually one or two per round. A 2020 round of an hour judged how quickly the candidate reached an optimised solution; in 2022 and 2024 two frontend candidates were set almost nothing but such problems, one of them by a backend developer.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS3, MICROSOFT_MS5, MICROSOFT_MS7, MICROSOFT_MS8],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Design',
            format:
              'Low-level class design in two Bangalore loops from 2020 and 2021, application or component design in 2024. The 2020 round took an hour in a VS Code editor, on design code that did not have to run; in 2021 the design work shared a round with problem solving and questions on the candidate\'s own application. In 2024 a senior loop opened with system design, and an SDE 2 loop had a component design round with behavioural questions.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS6, MICROSOFT_MS7],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Behavioural and hiring manager',
            format:
              'A hiring manager round, technical in a 2020 and a 2021 Bangalore loop. The 2020 account gives it 45 minutes to an hour and had code run in the browser console; in 2024 an SDE 2 hiring manager asked for a past project\'s design and some behavioural answers, and a senior loop had a relaxed behavioural round on the candidate\'s experience.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS6, MICROSOFT_MS7],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'As Appropriate round',
            format:
              'A final one-hour round with an interviewer at GM or Partner level, in a 2020 Bangalore loop. The candidate says it can be anything from your interests and past projects to complex data structures, that this one was a data-structure problem, and that it is not a formality: they had read of people rejected in it.',
            appliesTo: 'One 2020 account',
            sources: [MICROSOFT_MS1],
          },
        ],
      },
      {
        title: 'Students',
        stages: [
          {
            stage: 'Initial interview',
            format: 'An initial interview, held virtually like every student interview.',
            appliesTo: 'Students',
            sources: [MICROSOFT_STUDENTS],
          },
          {
            stage: 'Final interview',
            format: 'A second and final interview for students selected after the first, also virtual.',
            appliesTo: 'Students',
            sources: [MICROSOFT_STUDENTS],
          },
        ],
      },
    ],
    // Kept by content: all ten accounts are frontend loops (the 2024 senior one calls itself "more front end"), and
    // their algorithm problems stay. Rounds follow what each account calls the round; MS9's two unnamed rounds count
    // under the stage their tasks match. MS1's machine-coding row holds the three examples the post gives for the
    // round, and says so. Left out for want of a question: "write promise syntax" (MS2, too slight beside the
    // promise rows), "React concepts in depth" and two sets of "some behavioural questions" (MS7), "typical questions
    // about my experience" (MS6), an output question "like round 1" (MS9), "data structures" (MS5, kept in the
    // table), MS10's first-round performance questions and a layout problem asked as an approach only, and MS8's test
    // task, which the account names without detail. MS2's fourth-round questions on the candidate's own application
    // (its client architecture, caching and web performance, and web workers) join the open project walkthrough below.
    questions: [
      {
        id: 'weekly-calendar-view',
        round: 'Machine coding',
        kind: 'UI build',
        topic: 'Weekly calendar view',
        question:
          'Build a weekly calendar with no framework, only JavaScript, HTML and CSS: seven columns, one per day, filled with events from an API endpoint, with buttons for the previous and next week and a today button that returns to the current week. Events can start at any time, not only on the hour or half hour, and events in the same time slot sit side by side.',
        sources: [MICROSOFT_MS3],
      },
      {
        id: 'react-step-form',
        round: 'Machine coding',
        kind: 'React build',
        topic: 'Multi-step form with drafts',
        question:
          'Build a multi-step form in React: each step has a few fields with validation, such as a start date that cannot fall after the end date, and a save-draft button that keeps what was entered up to that step, with one final submit button.',
        sources: [MICROSOFT_MS9],
        practice: { label: 'Multi-step signup form', path: '/react/coding/react-multi-step-signup' },
      },
      {
        id: 'css-spinner',
        round: 'Machine coding',
        kind: 'UI build',
        topic: 'CSS spinner',
        question: 'Create a spinner with CSS, in a round that paired two data-structure problems with frontend questions.',
        sources: [MICROSOFT_MS7],
      },
      {
        id: 'react-autocomplete',
        round: 'Machine coding',
        kind: 'React build',
        topic: 'Autocomplete in React',
        question: 'Implement an autocomplete feature in React, the first of two React coding rounds in a senior loop the candidate called more front end.',
        sources: [MICROSOFT_MS6],
        practice: { label: 'React autocomplete', path: '/react/coding/react-autocomplete-search-starter' },
      },
      {
        id: 'dom-from-nested-json',
        round: 'Machine coding',
        kind: 'React build',
        topic: 'DOM from nested JSON',
        question:
          'In React, create the DOM that a nested JSON object describes; the candidate finished the code but struggled with a few questions on the introduction and the explanation.',
        sources: [MICROSOFT_MS6],
        practice: { label: 'Build a DOM renderer from a nested object', path: '/javascript/coding/js-dom-renderer' },
      },
      {
        id: 'full-page-search',
        round: 'Machine coding',
        kind: 'UI build',
        topic: 'Full-page search with highlighting',
        question:
          'Using only JavaScript, HTML and CSS, build a full-page search: an input in the top bar fetches results for the search string, the results are paginated, and each shows a preview of about 500 characters with the search string highlighted.',
        sources: [MICROSOFT_MS2],
        practice: { label: 'React paginated data table', path: '/react/coding/react-pagination-table' },
      },
      {
        id: 'bus-booking-calendar',
        round: 'Machine coding',
        kind: 'UI build',
        topic: 'Calendar from a bus-booking site',
        question:
          'Open redbus.in, a bus-booking site, and build the calendar it shows in HTML, CSS and JavaScript, in a round of about an hour. After 20 minutes the interviewer steered the candidate from templates to the logic; the candidate had asked whether leap years and different month lengths counted.',
        sources: [MICROSOFT_MS10],
      },
      {
        id: 'promise-polyfill',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Promise polyfill',
        question:
          'Implement Promise yourself in JavaScript. In 2020 it was the polyfill the round asked for, picked from the APIs that ES6 and ES2020 added.',
        sources: [MICROSOFT_MS1, MICROSOFT_MS4],
      },
      {
        id: 'use-effect-and-batching',
        round: 'JavaScript and React concepts',
        kind: 'React concepts',
        topic: 'useEffect behaviour and batching',
        question: 'How does useEffect work, and what does a given snippet that uses it log? How does React batch state updates?',
        sources: [MICROSOFT_MS9],
        practice: { label: 'Why React batches state updates', path: '/react/trivia/react-why-batching-state-updates' },
      },
      {
        id: 'promise-and-timer-output',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Promise chain and timer output',
        question:
          'Predict the order of the logs from a snippet, as the candidate recalled it: two setTimeout calls of 10 ms and 0 ms, a promise executor that logs, rejects and logs again, then a chain of then, catch and finally handlers.',
        sources: [MICROSOFT_MS9],
        practice: { label: 'Predict the output of a nested microtask', path: '/javascript/trivia/js-event-loop-nested-microtask-output' },
      },
      {
        id: 'use-effect-polyfill',
        round: 'JavaScript and React concepts',
        kind: 'React build',
        topic: 'useEffect polyfill',
        question: 'Write a polyfill of React\'s useEffect.',
        sources: [MICROSOFT_MS9],
        practice: { label: 'useEffect timing, dependencies and cleanup', path: '/react/trivia/react-useeffect-purpose' },
      },
      {
        id: 'web-security-questions',
        round: 'JavaScript and React concepts',
        kind: 'Web fundamentals',
        topic: 'Web security',
        question: 'Questions on web security, in a second round that also had an output question and a React form build.',
        promptNotShared: true,
        sources: [MICROSOFT_MS9],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
      },
      {
        id: 'closures-and-promises',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Closures and promises',
        question: 'JavaScript concepts in depth, closures and promises among them, in a first round that also set two algorithm problems.',
        promptNotShared: true,
        sources: [MICROSOFT_MS7],
        practice: { label: 'Closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'debounce-function',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Debounce function',
        question: 'Implement a debounce function in JavaScript.',
        sources: [MICROSOFT_MS4],
        practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
      },
      {
        id: 'same-instance-per-key',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'One instance per key',
        question:
          'A function takes a string and returns an object it creates. How do you make it return the same instance every time it gets the same key?',
        sources: [MICROSOFT_MS4],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
      },
      {
        id: 'promise-all',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Promise.all',
        question: 'Implement Promise.all: a function that takes an array of promises and returns a single promise.',
        sources: [MICROSOFT_MS4],
        practice: { label: 'Implement Promise.all', path: '/javascript/coding/js-promise-all' },
      },
      {
        id: 'css-variables-from-javascript',
        round: 'JavaScript and React concepts',
        kind: 'Web fundamentals',
        topic: 'CSS variables from JavaScript',
        question: 'How do you change CSS variables from JavaScript?',
        sources: [MICROSOFT_MS4],
        practice: { label: 'CSS custom properties', path: '/css/trivia/css-custom-properties' },
      },
      {
        id: 'material-ui-theme',
        round: 'JavaScript and React concepts',
        kind: 'React concepts',
        topic: 'Material UI theming',
        question: 'How does Material UI\'s design system use the theme to decide the colours of its components?',
        sources: [MICROSOFT_MS4],
      },
      {
        id: 'react-lifecycle-hooks-redux',
        round: 'JavaScript and React concepts',
        kind: 'React concepts',
        topic: 'React lifecycle, hooks and Redux',
        question: 'Questions on React lifecycle methods, hooks, Redux and React\'s internals.',
        promptNotShared: true,
        sources: [MICROSOFT_MS2],
      },
      {
        id: 'add-five',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Adder function',
        question: 'Implement addFive so that addFive(10) returns 15 and addFive(15) returns 20.',
        sources: [MICROSOFT_MS2],
        practice: { label: 'Currying', path: '/javascript/trivia/js-currying' },
      },
      {
        id: 'duplicate-function-declarations',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Duplicate function declarations',
        question:
          'Predict what alert(a()) shows when a declares an inner function b that returns 3, returns b(), then declares b again after the return statement, returning 8.',
        sources: [MICROSOFT_MS2],
        practice: { label: 'Predict var hoisting and function shadowing', path: '/javascript/trivia/js-var-hoisting-shadowing-output' },
      },
      {
        id: 'spreadsheet-evaluation',
        round: 'JavaScript and React concepts',
        kind: 'Algorithm',
        topic: 'Spreadsheet formula evaluation',
        question:
          'Given a 3 by 3 sheet whose cells hold numbers or expressions such as a1+b1, copy it into another sheet in which every expression is replaced by the number it evaluates to.',
        sources: [MICROSOFT_MS2],
      },
      {
        id: 'promise-memoization-lru',
        round: 'JavaScript and React concepts',
        kind: 'JavaScript',
        topic: 'Promise memoization with an LRU cache',
        question:
          'Memoize a promise-returning function with a cache of a given size that evicts like an LRU cache, with an expiry time and automatic cache busting.',
        sources: [MICROSOFT_MS1],
        practice: { label: 'Create an LRU cache', path: '/javascript/coding/js-create-lru-cache' },
      },
      {
        id: 'min-stack',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Min stack',
        question: 'Implement a min stack: a stack that can also return its smallest element.',
        sources: [MICROSOFT_MS7],
      },
      {
        id: 'matrix-zeroes',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Moving zeroes in a matrix',
        question: 'A matrix problem on moving its zeroes, asked in the same round as the min stack.',
        promptNotShared: true,
        sources: [MICROSOFT_MS7],
      },
      {
        id: 'binary-tree-right-view',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Right view of a binary tree',
        question: 'Return the right view of a binary tree: the nodes you see when you look at it from the right.',
        sources: [MICROSOFT_MS7],
      },
      {
        id: 'linked-list-duplicates',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Duplicate nodes in a linked list',
        question: 'Remove duplicate nodes from a linked list.',
        sources: [MICROSOFT_MS7],
      },
      {
        id: 'array-manipulation-tasks',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Array manipulation',
        question: 'Two live-coding tasks on algorithms with array manipulation, in an interview the candidate said had nothing to do with frontend.',
        promptNotShared: true,
        sources: [MICROSOFT_MS8],
      },
      {
        id: 'meeting-overlap',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Meeting overlap check',
        question: 'Given existing meetings as start and end times, decide whether a new meeting overlaps any of them.',
        sources: [MICROSOFT_MS2],
      },
      {
        id: 'word-break-check',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Word break check',
        question: 'Given a dictionary and a string, return whether the string can be split with spaces into dictionary words.',
        sources: [MICROSOFT_MS2],
      },
      {
        id: 'repeated-character-runs',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Runs of repeated characters',
        question:
          'Return the start and end indices of every run of a repeated character in a string: for "hellooooloo", (2,3), (4,7) and (9,10).',
        sources: [MICROSOFT_MS1],
      },
      {
        id: 'dictionary-word-from-repeats',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Dictionary word by dropping repeats',
        question:
          'Building on those runs: can the string become a dictionary word by deleting one or more of its repeated letters, as "hellooooloo" becomes "hellolo"?',
        sources: [MICROSOFT_MS1],
      },
      {
        id: 'non-overlapping-intervals',
        round: 'Algorithms and problem solving',
        kind: 'Algorithm',
        topic: 'Non-overlapping intervals',
        question:
          'LeetCode\'s Non-overlapping Intervals, in the round after machine coding: the fewest intervals to remove so that the rest do not overlap.',
        sources: [MICROSOFT_MS3],
      },
      {
        id: 'react-grid-component',
        round: 'Design',
        kind: 'React build',
        topic: 'Grid component in React',
        question: 'Create a grid component with React, in a component design round that also had behavioural questions.',
        sources: [MICROSOFT_MS7],
        practice: { label: 'React dynamic table', path: '/react/coding/react-dynamic-table' },
      },
      {
        id: 'netflix-like-application',
        round: 'Design',
        kind: 'Product design',
        topic: 'Netflix-like application design',
        question: 'Design a Netflix-like application, in the first round of a senior loop the candidate called more front end.',
        sources: [MICROSOFT_MS6],
        practice: { label: 'Netflix Continue Watching frontend design', path: '/system-design/netflix-scale-expansion' },
      },
      {
        id: 'ludo-class-design',
        round: 'Design',
        kind: 'Practical coding',
        topic: 'Ludo game class design',
        question: 'Design a Ludo game: the interviewer wanted its class structure and a high-level overview of how you think it through.',
        sources: [MICROSOFT_MS2],
      },
      {
        id: 'snakes-and-ladders-classes',
        round: 'Design',
        kind: 'Practical coding',
        topic: 'Snakes and ladders class design',
        question:
          'Write the classes and methods of a snakes and ladders game, without running them. The interviewer first asked for a chessboard and switched when the candidate did not know chess.',
        sources: [MICROSOFT_MS1],
      },
      {
        id: 'website-speed',
        round: 'Behavioural and hiring manager',
        kind: 'Web fundamentals',
        topic: 'Making a website faster',
        question: 'How would you improve a website\'s performance, and which strategies do you follow to speed a site up?',
        sources: [MICROSOFT_MS1, MICROSOFT_MS2],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'largest-k-from-file',
        round: 'Behavioural and hiring manager',
        kind: 'Algorithm',
        topic: 'Largest k integers in a file',
        question: 'Write findLargestK(k) to return the k largest integers in a 50 GB file.',
        sources: [MICROSOFT_MS2],
      },
      {
        id: 'when-to-use-ssr',
        round: 'Behavioural and hiring manager',
        kind: 'Web fundamentals',
        topic: 'When to use server-side rendering',
        question: 'When would you use server-side rendering?',
        sources: [MICROSOFT_MS2],
        practice: { label: 'SSR and hydration in React', path: '/react/trivia/react-ssr-hydration' },
      },
      {
        id: 'task-queue-output',
        round: 'Behavioural and hiring manager',
        kind: 'JavaScript',
        topic: 'Macrotask and microtask output',
        question: 'Give the output of a JavaScript snippet and explain what happens under the hood, in terms of the macrotask and microtask queues.',
        sources: [MICROSOFT_MS1],
        practice: { label: 'Microtasks and macrotasks', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
      },
      {
        id: 'web-vitals',
        round: 'Behavioural and hiring manager',
        kind: 'Web fundamentals',
        topic: 'Web Vitals',
        question: 'What are the Web Vitals, and how are they measured?',
        sources: [MICROSOFT_MS1],
      },
      {
        id: 'browser-document-execution',
        round: 'Behavioural and hiring manager',
        kind: 'Web fundamentals',
        topic: 'How the browser executes a document',
        question: 'How does the browser execute a document?',
        sources: [MICROSOFT_MS1],
        practice: { label: 'HTML parsing and rendering order', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'space-separator',
        round: 'Behavioural and hiring manager',
        kind: 'Algorithm',
        topic: 'Spacing a string into words',
        question:
          'Insert spaces so that a string splits into dictionary words, as "helloworld" becomes "hello world", returning an empty string when it cannot.',
        sources: [MICROSOFT_MS1],
      },
      {
        id: 'tweet-word-window',
        round: 'As Appropriate round',
        kind: 'Algorithm',
        topic: 'Word count over a moving window',
        question:
          'Millions of tweets arrive every second: raise an alert whenever a particular word appears a billion times within any one-hour moving window, choosing how to represent each tweet and how to hold the counts in memory.',
        sources: [MICROSOFT_MS1],
      },
    ],
    // Same-question accounts share a row.
    behaviouralQuestions: [
      {
        id: 'about-yourself',
        question: 'Tell me about yourself and your background. A 2020 phone round spent its first 15 minutes on it.',
        sources: [MICROSOFT_MS10, MICROSOFT_MS1],
      },
      {
        id: 'project-walkthrough',
        question:
          'Take the interviewer through a project you worked on. A 2021 round asked about the current project, web performance, the application\'s client architecture and caching, and web workers; in 2024 a hiring manager asked for the high-level design of a past project, and a 2025 round opened on a past project and web optimisation.',
        sources: [MICROSOFT_MS2, MICROSOFT_MS7, MICROSOFT_MS9],
      },
    ],
  },
  apple: {
    summary:
      'Apple publishes interview tips but no process page. Frontend accounts from 2020 to 2026, with two full-stack loops, describe a recruiter call, in some teams a hiring manager conversation, a technical screen of 45 to 60 minutes where a length is given, then a team loop, usually four to seven interviews, that is mostly JavaScript, React and CSS coding.',
    caveat:
      'Each team runs its own process, as a 2025 Cupertino candidate put it: that senior loop had four coding rounds and no behavioural or design round, while other loops added behavioural, cross-functional or director interviews. In two 2022 accounts the recruiter shared nothing about the rounds in advance, and one candidate who asked got no reply. The question list also draws on two full-stack loops and two 2026 interviews that came through outside channels, a contract role in Austin and a consultancy in Malmö, keeping their frontend and algorithm questions.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend roles (the loop varies by team)',
        stages: [
          {
            stage: 'Online assessment',
            format:
              'One hour: two coding questions and 20 multiple-choice questions. The coding mixed JavaScript with data structures and algorithms, the multiple choice covered JavaScript, React and frontend concepts, and the candidate found the time limit the hardest part.',
            appliesTo: 'One IC3 account',
            sources: [APPLE_AP1],
          },
          {
            stage: 'Recruiter call',
            format:
              'A call with a recruiter about your experience and the role. Recruiters in 2020 and 2025 accounts also asked why Apple and about pay expectations, the 2020 one about sponsorship too, and a 2022 recruiter in Denmark described the project the team was hiring for.',
            appliesTo: APPLE_ROLE,
            sources: [APPLE_AP1, APPLE_AP3, APPLE_AP9, APPLE_ICT3_2025, APPLE_UI_2020, APPLE_DENMARK_2022],
          },
          {
            stage: 'Hiring manager conversation',
            format:
              'A conversation with the hiring manager before the screen, or as the screen itself. Accounts from 2024 to 2026 describe questions on past experience and projects, how you work, your reasons for the move and why Apple; in 2020 and 2021 accounts the hiring manager ran a technical interview instead, one of them on algorithms.',
            appliesTo: 'Some teams',
            sources: [APPLE_AP7, APPLE_AP9, APPLE_AP10, APPLE_ICT3_2025, APPLE_FULLSTACK_2026, APPLE_UI_2020],
            practice: { label: 'Apple team conversation questions and story drill', path: '/companies/apple/preview', fragment: 'apple-round-team-conversations', drill: true },
          },
          {
            stage: 'Technical screen',
            format:
              '45 to 60 minutes where a length is given, with an engineer or the hiring manager, by video or phone. CoderPad is named in several accounts, and most screens mixed JavaScript, TypeScript or React coding with spoken questions on the stack, sometimes with an algorithm problem; a 2022 screen from Denmark had about six small JavaScript tasks and a 2023 screen from Sweden six JavaScript coding challenges, a 2022 screen had about 15 minutes of coding, a 2026 first round had none, and a 2026 full-stack screen was two 30-minute halves, one an algorithm problem and one frontend theory.',
            appliesTo: APPLE_ROLE,
            sources: [
              APPLE_AP1,
              APPLE_AP3,
              APPLE_AP4,
              APPLE_AP5,
              APPLE_AP6,
              APPLE_AP8,
              APPLE_AP9,
              APPLE_AP10,
              APPLE_ICT3_2025,
              APPLE_FULLSTACK_2026,
              APPLE_TICTACTOE_2020,
              APPLE_DENMARK_2022,
              APPLE_SWEDEN_2023,
              APPLE_MALMO_2026,
              APPLE_FE_2026,
            ],
            // The open question's practice task: a locked row's task or subject would be readable here.
            practice: { label: 'Build a tree from a flat list of nodes', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'Team loop',
            format:
              'Usually four to seven interviews of 30 to 60 minutes, mostly JavaScript, React and CSS coding and concepts. Some loops add algorithm problems or behavioural, cross-functional and hiring manager interviews, and a few end with a director or department lead; a 2025 senior loop was four coding rounds with no behavioural or design round, and a 2026 loop in Malmö, run through a consultancy, had two interviews on site.',
            appliesTo: APPLE_ROLE,
            sources: [
              APPLE_AP2,
              APPLE_AP3,
              APPLE_AP4,
              APPLE_AP7,
              APPLE_AP8,
              APPLE_AP10,
              APPLE_ICT3_2025,
              APPLE_FULLSTACK_2026,
              APPLE_UI_2020,
              APPLE_MEDIA_2020,
              APPLE_OFFER_2021,
              APPLE_MALMO_2026,
            ],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
        ],
      },
    ],
    // The first eight rows are the ones a reader sees before "Show all", so they mix rounds; the rest follow the table's
    // order, newest account first. Kept by content: the frontend and algorithm questions of two full-stack loops (2025
    // and 2026) and of two 2026 contract interviews. Left out for want of a subject: the assessment's two coding and 20
    // multiple-choice questions (2025), the easy coding question of a 2022 screen, the 30-minute JavaScript machine coding
    // task and three algorithms in 55 minutes (2024), about six small JavaScript problems (Denmark 2022, Sweden 2023), the
    // "simple JavaScript and React coding" round and one behavioural question in the back-end round of the 2026 full-stack
    // loop. Left out by content: the logs monitoring system design of the 2026 full-stack loop and RESTful concepts in the
    // 2026 Malmö loop, both back-end design. Behavioural questions are open, below.
    questions: [
      {
        id: 'nested-tabs-from-flat-list',
        round: 'Technical screen',
        kind: 'React build',
        topic: 'Nested tabs from a flat list',
        question:
          'Given a flat array of tab objects, each with an id, a name and a parent id, render them in React as nested tabs or an accordion with every tab under its parent.',
        sources: [APPLE_AP1],
        practice: { label: 'Build a tree from a flat list of nodes', path: '/javascript/coding/js-build-tree-from-flat-list' },
      },
      {
        id: 'autocomplete-search-bar',
        round: 'Technical screen',
        kind: 'UI build',
        topic: 'Autocomplete search bar',
        question:
          'Build an autocomplete search bar like the one on apple.com in TypeScript, with Vue or React, in a 45-minute interview that also asked basic TypeScript and framework questions.',
        sources: [APPLE_AP5],
        practice: { label: 'Vue autocomplete search', path: '/vue/coding/vue-autocomplete-search' },
      },
      {
        id: 'usecontext-output',
        round: 'Technical screen',
        kind: 'React concepts',
        topic: 'useContext output prediction',
        question:
          'Predict what a small React snippet built on useContext outputs and explain why, then answer follow-ups on useContext for prop drilling and state, and on useMemo and useCallback for performance.',
        sources: [APPLE_AP1],
        practice: { label: 'Context performance issues and fixes', path: '/react/trivia/react-context-performance-issues' },
      },
      {
        id: 'large-react-list',
        round: 'Team loop',
        kind: 'React build',
        topic: 'Large list in React',
        question: 'Build a React component that can display a million records.',
        sources: [APPLE_ICT3_2025],
        practice: { label: 'Infinite scroll list design', path: '/system-design/infinite-scroll-list' },
      },
      {
        id: 'react-form-component',
        round: 'Team loop',
        kind: 'React build',
        topic: 'React form component',
        question: 'Build a fairly simple form component in React, one task of a remote onsite of five 45-minute sessions for a senior role on an apple.com team.',
        sources: [APPLE_AP4],
        practice: { label: 'React contact form', path: '/react/coding/react-contact-form-starter' },
      },
      {
        id: 'dice-roller',
        kind: 'React build',
        topic: 'Dice roller component',
        question:
          'Build a React dice roller: a click on a button picks a number from 1 to 6, the die rolls that many times and the number is shown.',
        sources: [APPLE_AUSTIN_2026],
      },
      {
        id: 'html-css-api-basics',
        round: 'Technical screen',
        kind: 'Web fundamentals',
        topic: 'HTML, CSS, API and security basics',
        question:
          'Basic questions on HTML, CSS, APIs and web security, such as what an API is and how to adjust a border or a margin; a CoderPad link came with the invite, but no coding was asked.',
        sources: [APPLE_FE_2026],
        practice: { label: 'Box model: margin, padding and border', path: '/css/coding/css-box-model-margin-padding-border' },
      },
      {
        id: 'light-dark-theme',
        round: 'Team loop',
        kind: 'UI build',
        topic: 'Light and dark theme',
        question: 'How would you build a light and a dark theme for a website?',
        sources: [APPLE_AP2],
        practice: { label: 'Theme variables and dark mode', path: '/css/coding/css-theme-variables-dark-mode' },
      },
      {
        id: 'frontend-architecture-and-security',
        round: 'Hiring manager conversation',
        kind: 'Frontend system design',
        topic: 'Frontend architecture and web security',
        question: 'A technical interview with the hiring manager on frontend architecture and web security issues.',
        promptNotShared: true,
        sources: [APPLE_UI_2020],
      },
      {
        id: 'react-fundamentals-and-css',
        round: 'Technical screen',
        kind: 'React concepts',
        topic: 'React fundamentals and CSS concepts',
        question: 'Theory questions on React fundamentals and CSS concepts, in the frontend half of a screen split into two 30-minute parts.',
        promptNotShared: true,
        sources: [APPLE_FULLSTACK_2026],
      },
      {
        id: 'valid-sudoku',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Valid Sudoku',
        question: 'Check that a completed Sudoku board follows the rules, with no repeat in any row, column or 3x3 box, in the other 30-minute half of the same screen.',
        sources: [APPLE_FULLSTACK_2026],
      },
      {
        id: 'mocha-unit-tests',
        round: 'Technical screen',
        kind: 'Practical coding',
        topic: 'Unit tests in Mocha',
        question: 'Write unit tests with Mocha in CoderPad, in a remote technical interview.',
        promptNotShared: true,
        sources: [APPLE_MALMO_2026],
        practice: { label: 'Create a spy function', path: '/javascript/coding/js-create-spy-function' },
      },
      {
        id: 'website-security',
        round: 'Technical screen',
        kind: 'Web fundamentals',
        topic: 'Securing a website',
        question: 'How would you secure a website? The discussion covered HTTPS, Content Security Policy, CORS and securing cookies.',
        sources: [APPLE_AP1],
        practice: { label: 'Cookie attributes', path: '/javascript/trivia/js-cookie-options' },
      },
      {
        id: 'ranked-vote-counter',
        round: 'Technical screen',
        kind: 'Practical coding',
        topic: 'Ranked vote counter',
        question: 'From a deliberately vague prompt, pin down the problem and build a class that reads a long ballot list and counts the votes by rank.',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'binary-tree-level-lookup',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Binary tree level lookup',
        question:
          'In a binary tree of 0s and 1s where a left child repeats its parent\'s value and a right child flips it, find the value of the nth node on level l.',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'react-angular-vue-tradeoffs',
        round: 'Technical screen',
        kind: 'React concepts',
        topic: 'React, Angular and Vue trade-offs',
        question:
          'Compare the trade-offs between React, Angular and Vue, after questions on past projects and how you solved particular problems; a 30-minute JavaScript machine coding task followed.',
        sources: [APPLE_AP10],
      },
      {
        id: 'two-sum',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Two Sum',
        question: 'Solve Two Sum, one of two coding challenges in the second half of an hour-long screen.',
        sources: [APPLE_AP6],
      },
      {
        id: 'react-redux-typescript-questions',
        round: 'Technical screen',
        kind: 'React concepts',
        topic: 'React, Redux and TypeScript questions',
        question:
          'Half an hour of spoken questions on your past teams, React, Redux, JavaScript and TypeScript, including whether you have used Jest, then a JavaScript knowledge assessment as one of two coding challenges.',
        promptNotShared: true,
        sources: [APPLE_AP6],
        practice: { label: 'When a React app needs Redux', path: '/react/trivia/react-state-management-redux' },
      },
      {
        id: 'well-known-sequence-digits',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Digits of a well-known sequence',
        question:
          'Return a given number of digits of a well-known number sequence, the only coding in a mostly conversational screen with about 15 minutes in CoderPad; the account does not name the sequence.',
        sources: [APPLE_AP4],
      },
      {
        id: 'repository-structure',
        round: 'Technical screen',
        kind: 'Frontend system design',
        topic: 'Structuring a new repository',
        question: 'How would you structure a GitHub repository for a project you start from scratch? A hiring manager asked it in a 45-minute screen.',
        sources: [APPLE_AP9],
      },
      {
        id: 'square-root-function',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Square root function',
        question: 'Compute a square root without the Math functions, using binary search.',
        sources: [APPLE_AP9],
      },
      {
        id: 'tic-tac-toe-game',
        round: 'Technical screen',
        kind: 'Practical coding',
        topic: 'Tic-tac-toe game',
        question:
          'Build a two-player tic-tac-toe game that takes and validates each move and detects the end of the game, given a two-dimensional array for the positions, in a phone interview.',
        sources: [APPLE_TICTACTOE_2020],
        practice: { label: 'React tic-tac-toe', path: '/react/coding/react-tictactoe' },
      },
      {
        id: 'nuts-and-bolts',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'Nuts and bolts matching',
        question: 'The nuts-and-bolts matching problem, which the account files as a quicksort problem, in the back-end coding round of a full-stack loop.',
        sources: [APPLE_FULLSTACK_2026],
      },
      {
        id: 'merge-overlapping-intervals',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'Merge overlapping intervals',
        question: 'Merge a list of overlapping intervals, in the same back-end coding round as the nuts-and-bolts problem.',
        sources: [APPLE_FULLSTACK_2026],
      },
      {
        id: 'react-and-javascript-internals',
        round: 'Team loop',
        kind: 'React concepts',
        topic: 'React and JavaScript internals',
        question:
          'Seven timed problems over four coding rounds, from 12 to 40 minutes each and with no searching allowed, heavy on React and JavaScript internals, with optional TypeScript generics.',
        promptNotShared: true,
        sources: [APPLE_AP8],
      },
      {
        id: 'leetcode-hard-problem',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'LeetCode-hard problem',
        question:
          'A LeetCode-hard problem in the last 20 minutes of the final interview, to talk through rather than code; the candidate reached only the naive O(n) solution.',
        promptNotShared: true,
        sources: [APPLE_AP8],
      },
      {
        id: 'words-from-characters',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'Words from a set of characters',
        question: 'Given a set of characters, find all the English words they can make, after settling the inputs, the outputs and how the dictionary is stored.',
        sources: [APPLE_ICT3_2025],
        practice: { label: 'Valid anagram', path: '/javascript/coding/js-valid-anagram' },
      },
      {
        id: 'sampling-with-distribution',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'Sampling that keeps a distribution',
        question: 'Sample n items from a dataset while keeping its original probability distribution.',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'input-ui-from-sketch',
        round: 'Team loop',
        kind: 'React build',
        topic: 'Input UI from a sketch',
        question: 'After a talk about your React experience, implement a basic input UI that the interviewer draws.',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'frontend-design-and-performance',
        round: 'Team loop',
        kind: 'Frontend system design',
        topic: 'Frontend design and performance',
        question: 'An on-site technical interview in Hyderabad on frontend system design, performance and optimisation, and best practices.',
        promptNotShared: true,
        sources: [APPLE_AP10],
      },
      {
        id: 'blank-page-on-load',
        round: 'Team loop',
        kind: 'UI debugging',
        topic: 'Blank page on load',
        question:
          'How would you find out why a website loads as a blank page? The interviewer wanted the likely causes rather than a fix, and the talk turned to how frameworks report errors.',
        sources: [APPLE_AP2],
      },
      {
        id: 'website-performance',
        round: 'Team loop',
        kind: 'Web fundamentals',
        topic: 'Website performance',
        question: 'How would you improve a website\'s performance? Asked in the first round, and again in the fourth as ways to cut loading time.',
        sources: [APPLE_AP2],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'load-css-dynamically',
        round: 'Team loop',
        kind: 'JavaScript',
        topic: 'Loading CSS at runtime',
        question: 'How would you load a CSS file dynamically?',
        sources: [APPLE_AP2],
      },
      {
        id: 'tooltip-library',
        round: 'Team loop',
        kind: 'Frontend system design',
        topic: 'Tooltip library',
        question:
          'How would you create a tooltip library? The interviewer wanted a plain JavaScript library that other developers could use on native HTML and CSS, not a framework component.',
        sources: [APPLE_AP2],
      },
      {
        id: 'javascript-inheritance',
        round: 'Team loop',
        kind: 'JavaScript',
        topic: 'Inheritance in JavaScript',
        question: 'How does inheritance work in JavaScript?',
        sources: [APPLE_AP2],
        practice: { label: 'Prototypal inheritance', path: '/javascript/trivia/js-prototypal-inheritance' },
      },
      {
        id: 'run-length-compression',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'Run-length string compression',
        question: 'Compress a string such as AAABB into 3A2B, then variations: AAABBAA as 3A2B2A, and the same string as 5A2B.',
        sources: [APPLE_AP2],
      },
      {
        id: 'preventdefault-and-stoppropagation',
        round: 'Team loop',
        kind: 'Web fundamentals',
        topic: 'preventDefault and stopPropagation',
        question: 'What is the difference between preventDefault and stopPropagation, and how does stopImmediatePropagation differ from stopPropagation?',
        sources: [APPLE_AP2],
        practice: { label: 'Bubbling, capturing and event delegation', path: '/javascript/trivia/js-event-delegation' },
      },
      {
        id: 'doctype-and-quirks-mode',
        round: 'Team loop',
        kind: 'Web fundamentals',
        topic: 'DOCTYPE and quirks mode',
        question: 'Why does an HTML file start with <!DOCTYPE html>, and what is quirks mode?',
        sources: [APPLE_AP2],
      },
      {
        id: 'how-the-browser-works',
        round: 'Team loop',
        kind: 'Web fundamentals',
        topic: 'How the browser works',
        question: 'How does the browser work? The discussion went through the critical rendering path: building the DOM and the CSSOM, and what blocks parsing.',
        sources: [APPLE_AP2],
        practice: { label: 'HTML parsing and rendering order', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'min-stack',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'Min stack',
        question: 'Design a stack with push, pop and getMin, asked in a round that was otherwise about your work, your role and the team.',
        sources: [APPLE_AP2],
        practice: { label: 'Stack and queue, with a min stack', path: '/javascript/coding/js-stack-queue-implementation' },
      },
      {
        id: 'multiplication-algorithm',
        round: 'Team loop',
        kind: 'Algorithm',
        topic: 'Multiplication algorithm',
        question: 'Multiply two numbers without using the * operator, in the same round as the min stack.',
        sources: [APPLE_AP2],
      },
      {
        id: 'what-is-cors',
        round: 'Team loop',
        kind: 'Web fundamentals',
        topic: 'CORS',
        question: 'What is CORS?',
        sources: [APPLE_AP2],
        practice: { label: 'Handling CORS securely', path: '/javascript/trivia/js-secure-cors-handling' },
      },
      {
        id: 'cookies-and-localstorage',
        round: 'Team loop',
        kind: 'Web fundamentals',
        topic: 'Cookies and localStorage',
        question: 'How do cookies and localStorage differ?',
        sources: [APPLE_AP2],
        practice: { label: 'Cookies, sessionStorage and localStorage', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
      },
      {
        id: 'slow-api-call',
        round: 'Team loop',
        kind: 'Web fundamentals',
        topic: 'Slow API calls',
        question: 'How would you deal with a slow API call?',
        sources: [APPLE_AP2],
      },
      {
        id: 'closures-and-definitions',
        round: 'Team loop',
        kind: 'JavaScript',
        topic: 'Closures and other definitions',
        question: 'A handful of test-style definition questions, such as what a closure is.',
        sources: [APPLE_AP4],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'utility-library-method',
        round: 'Team loop',
        kind: 'JavaScript',
        topic: 'Utility library method rewrite',
        question: 'Rewrite a method from a popular utility library; the account names neither the library nor the method.',
        promptNotShared: true,
        sources: [APPLE_AP4],
        practice: { label: 'Implement lodash.get', path: '/javascript/coding/js-lodash-get' },
      },
      {
        id: 'recreate-webpage-design',
        round: 'Team loop',
        kind: 'UI build',
        topic: 'Recreate a webpage design',
        question:
          'Recreate an existing webpage design in about an hour and walk the interviewers through your process; they pressed on why the mobile layout did not come first.',
        sources: [APPLE_MEDIA_2020],
      },
      {
        id: 'view-driven-by-router',
        round: 'Team loop',
        kind: 'UI build',
        topic: 'View that follows the router',
        question: 'In a framework of your choice, build a template that responds to router changes, with its model, in about 40 minutes.',
        sources: [APPLE_MEDIA_2020],
      },
      {
        id: 'reference-and-value-equality',
        kind: 'JavaScript',
        topic: 'Reference and value equality',
        question:
          'What is the difference between reference and value equality, what happens when you spread an object, and are two objects that look the same equal?',
        sources: [APPLE_MALMO_2026],
        practice: { label: 'Passing by value and by reference', path: '/javascript/trivia/js-passing-by-value-and-by-reference' },
      },
      {
        id: 'rendering-without-framework',
        kind: 'JavaScript',
        topic: 'Rendering without a framework',
        question: 'Trick questions on rendering with plain JavaScript and no framework.',
        promptNotShared: true,
        sources: [APPLE_MALMO_2026],
      },
      {
        id: 'react-hooks-experience',
        kind: 'React concepts',
        topic: 'Working with React hooks',
        question: 'Talk about how you work with React hooks.',
        promptNotShared: true,
        sources: [APPLE_CUPERTINO_2025],
        practice: { label: 'Which React hooks to choose', path: '/react/trivia/react-hooks-youve-used' },
      },
      {
        id: 'html-css-accessibility',
        kind: 'Web fundamentals',
        topic: 'HTML, CSS and page accessibility',
        question: 'Technical questions on HTML, CSS styling and how you would make a page accessible.',
        sources: [APPLE_AP7],
        practice: { label: 'How to make a page accessible', path: '/html/trivia/web-accessibility-make-page-accessible' },
      },
      {
        id: 'messaging-app-diagram',
        kind: 'Frontend system design',
        topic: 'Web messaging app diagram',
        question: 'How would you diagram the functionality of a basic web-based messaging app?',
        sources: [APPLE_SAN_DIEGO_2024],
        practice: { label: 'Real-time messaging inbox', path: '/system-design/messaging-inbox-frontend' },
      },
      {
        id: 'search-bar-component',
        kind: 'UI build',
        topic: 'Search bar component design',
        question: 'Design a search bar component from scratch, the main question of a one-hour in-person interview with a senior developer.',
        sources: [APPLE_SEARCH_BAR_2023],
        practice: { label: 'Real-time search with debounce and caching', path: '/system-design/realtime-search-debounce-cache' },
      },
      {
        id: 'html-form-radio-buttons',
        kind: 'UI build',
        topic: 'HTML form with radio buttons',
        question: 'Code a simple HTML form with radio buttons.',
        sources: [APPLE_AP3],
        practice: { label: 'Contact form with proper labels', path: '/html/coding/html-contact-form-labeled' },
      },
      {
        id: 'fix-html-page-errors',
        kind: 'UI debugging',
        topic: 'Errors in an existing HTML page',
        question: 'Fix as many errors as you can in an existing HTML page.',
        sources: [APPLE_AP3],
      },
      {
        id: 'array-prototype-methods',
        kind: 'JavaScript',
        topic: 'Array prototype methods',
        question: 'Implement array prototype methods such as flat, map, reduce and concat yourself, then talk through basic JavaScript and framework concepts.',
        sources: [APPLE_ARRAY_2021],
        practice: { label: 'Implement Array.prototype.map', path: '/javascript/coding/js-array-prototype-map' },
      },
      {
        id: 'lazy-loading',
        kind: 'Web fundamentals',
        topic: 'Lazy loading',
        question: 'How would you implement lazy loading yourself?',
        sources: [APPLE_MEDIA_2020],
      },
      {
        id: 'javascript-dom-api',
        kind: 'Web fundamentals',
        topic: 'JavaScript DOM API',
        question: 'Questions on the JavaScript DOM API.',
        promptNotShared: true,
        sources: [APPLE_UI_2020],
        practice: { label: 'Build a DOM renderer from a nested object', path: '/javascript/coding/js-dom-renderer' },
      },
      {
        id: 'flatten-array',
        kind: 'JavaScript',
        topic: 'Array flattening',
        question: 'Flatten a nested array.',
        sources: [APPLE_UI_2020],
        practice: { label: 'Flatten with depth', path: '/javascript/coding/js-flatten-depth' },
      },
      {
        id: 'linked-list-problem',
        kind: 'Algorithm',
        topic: 'Linked list problem',
        question: 'A linked list problem; the account names only the subject.',
        promptNotShared: true,
        sources: [APPLE_UI_2020],
      },
      {
        id: 'first-duplicate-in-string',
        kind: 'Algorithm',
        topic: 'First duplicate in a string',
        question: 'Find the position of the first duplicate character in a string, written in a provided editor where the questions called for ES6 practice.',
        sources: [APPLE_HYDERABAD_2019],
      },
      {
        id: 'unique-elements-of-two-arrays',
        kind: 'JavaScript',
        topic: 'Unique elements of two arrays',
        question: 'Concatenate two arrays and find the unique elements in the result.',
        sources: [APPLE_HYDERABAD_2019],
        practice: { label: 'Remove duplicates', path: '/javascript/coding/js-unique-array' },
      },
      {
        id: 'product-of-other-elements',
        kind: 'Algorithm',
        topic: 'Product of the other elements',
        question: 'Turn [3, 4, 5] into [20, 15, 12], so that each position holds the product of the other elements.',
        sources: [APPLE_HYDERABAD_2019],
      },
      {
        id: 'promises-in-sequence',
        kind: 'JavaScript',
        topic: 'Running promises in sequence',
        question: 'What is a promise, and how can you run an array of promises one after another using generators?',
        sources: [APPLE_HYDERABAD_2019],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'building-an-npm-package',
        kind: 'JavaScript',
        topic: 'Building an npm package',
        question: 'How do you build an npm package?',
        sources: [APPLE_HYDERABAD_2019],
        practice: { label: 'Resolve package.json exports', path: '/javascript/coding/js-resolve-package-exports' },
      },
    ],
    behaviouralQuestions: [
      {
        id: 'why-change-jobs',
        question: 'Why are you looking to change jobs?',
        sources: [APPLE_AP1, APPLE_AP10],
      },
      {
        id: 'why-apple',
        question: 'Why do you want to join Apple?',
        sources: [APPLE_AP1, APPLE_AP10, APPLE_ICT3_2025, APPLE_UI_2020],
      },
      {
        id: 'why-this-role',
        question: 'Why did you choose this role, and how does your experience fit it?',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'where-you-see-yourself',
        question: 'Where do you see yourself in the coming years?',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'past-projects',
        question: 'Walk me through the projects you have worked on: what you did, your role and the biggest challenge.',
        sources: [APPLE_AP2, APPLE_AP10, APPLE_OFFER_2021, APPLE_FULLSTACK_2026],
      },
      {
        id: 'project-deep-dive',
        question: 'Take one past project in depth: why you made the choices you did, how you measured its performance and what you would do differently today.',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'apple-values',
        question: 'How have you shown Apple\'s values, such as deep expertise and a drive for excellence, in your career?',
        sources: [APPLE_ICT3_2025],
      },
      {
        id: 'collaboration-and-values',
        question: 'How do you approach collaboration, and which values guide how you work?',
        sources: [APPLE_FULLSTACK_2026],
      },
      {
        id: 'ui-issues-and-components',
        question: 'How do you approach UI issues, and how do you structure components?',
        sources: [APPLE_FULLSTACK_2026],
      },
      {
        id: 'accessibility-work',
        question: 'What accessibility work have you done?',
        sources: [APPLE_AP2],
      },
      {
        id: 'pull-request-review',
        question: 'What makes a good review of a pull request?',
        sources: [APPLE_AP2],
      },
    ],
  },
  uber: {
    summary:
      'Uber\'s frontend interview guide lists a 30-minute recruiter call, a HackerRank assessment and a 60-minute phone screen on coding plus design and architecture, then three 60-minute interviews: algorithms and data structures, depth in specialization, and collaboration and leadership. Candidate accounts from 2018 to 2026 fill in the rounds, and every one that describes the onsite adds a separate design round.',
    caveat:
      'Three accounts from 2021 and 2022 name CodeSignal rather than HackerRank; a 2025 candidate told by HR to expect an algorithms round got something else, and a 2026 candidate says recruiters often point to algorithms when rounds hold other tasks. The guide says steps may vary by role, location and business needs. The question list also keeps the frontend, algorithm and behavioural questions of two full-stack loops, from 2024 and 2026.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, L3 to L5A',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'Virtual and 30 minutes with a recruiter or sourcer in the official guide. A 2022 Bengaluru recruiter explained the role and the rounds and asked about experience and the reasons for joining Uber; a short 2025 HR call in Brazil covered backend experience and knowledge, and a few CSS questions.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_UB3, UBER_UB8],
          },
          {
            stage: 'Online assessment',
            format:
              'A HackerRank coding assessment in the official guide, which gives no length or content. In a 2022 loop it was a 35-minute CodeSignal test of two algorithm questions and eight multiple-choice questions, mostly on what JavaScript and CSS code outputs; a senior engineer\'s story on Uber\'s careers site describes a small challenge in vanilla JavaScript.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Phone screen',
            format:
              '60 minutes online in the official guide, on coding plus design and architecture. Candidates from 2021 to 2025 got a UI build (on CodeSignal in 2021, in React in 2022, in any framework in 2025 for the poll widget that opens the question list), a JavaScript utility on CodeSignal in a 2022 senior screen, or algorithm and JavaScript questions in 2025 loops. The 2022 senior interviewer did not expect a working solution, and in a 2025 India loop this round decided within ten minutes whether the other four ran the same day.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_UB_CODESIGNAL_2021, UBER_UB1, UBER_UB3, UBER_UB4, UBER_UB5, UBER_L4_POLL_2025],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Algorithms and data structures',
            format:
              '60 minutes in the official guide, as Interview 1 (Coding 1). A senior engineer\'s story on Uber\'s site says any language is allowed. Each account from 2022 to 2025 that describes it had one problem for the hour, medium to hard in a 2022 loop that only had to pass a few test cases; a 2022 Bengaluru account calls it the bar raiser round. In a 2025 India loop the round labelled problem solving held a JavaScript question instead, and a 2025 candidate whom HR told to expect a DSA round got something else.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5, UBER_L5A_BANGALORE_2025, UBER_UB_ROUNDS_2025],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'Frontend specialization',
            format:
              '60 minutes in the official guide, as Interview 2: depth in specialization (Coding 2). Candidates from 2022 to 2025 got a UI build or a JavaScript problem: machine coding in vanilla JavaScript on DOM manipulation and asynchronous code in 2022, a UI component in any framework or vanilla JavaScript in a 2022 Bengaluru loop, vanilla JavaScript at the interviewer\'s request in a 2025 India loop and a React build with MDN open in a 2025 L5A loop. A 2025 candidate who prepared for a UI build got a JavaScript problem and was allowed to search the web.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5, UBER_L5A_BANGALORE_2025],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'System design',
            format:
              'A separate design round in every account that describes the onsite; the official guide has none after the screen. Where the 2022 and 2025 accounts give a length it is an hour on one product: requirements first, then component architecture, API design and data flow, data models, client storage and performance, on a CodeSignal whiteboard in 2022. Its place varies: after both coding rounds had been passed in a 2022 Medium loop and a 2025 L5A loop, first in a 2022 Bengaluru loop, where it opened with a project the candidate was proud of.',
            appliesTo: 'Mid and senior levels',
            sources: [UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5, UBER_L5A_BANGALORE_2025],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Collaboration and leadership',
            format:
              '60 minutes in the official guide, as Interview 3: collaboration and leadership. Accounts call it the leadership and collaboration, behavioural or hiring manager round: situations in which you applied Uber\'s values in the 2022 Medium loop, which brought an offer, past projects and work experience in 2022 and 2025 loops, and a walkthrough of previous projects over 1 hour 45 minutes in a 2025 L5A loop. In a 2025 India loop the recruiter said only a strong hire from the hiring manager would have moved the candidate forward.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5, UBER_L5A_BANGALORE_2025],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
    // Kept by content: the frontend, JavaScript, algorithm and behavioural questions of two full-stack loops (Medium 2024,
    // LeetCode 2026). Their backend design rounds stay out, and so does the 2024 loop's Google Calendar design, whose account does
    // not say whether it was a frontend design. Left out by content: the backend experience and backend knowledge
    // questions of the 2025 HR call. Left out for want of a subject: the React UI component of the 2022 screen (its React
    // questions are kept), the UI component of the 2022 Bengaluru coding round, the 2022 frontend design question on APIs,
    // components and data flow (kept in the design stage's format), the eight multiple-choice questions of the 2022 test,
    // the 2026 full-stack screen's question from a company-tagged list, and the 2025 round announced as DSA that the
    // account does not describe. Not used: the rounds after the screen in the 2025 L4 post and the round before the first
    // coding round in the 2025 L5A post, whose saved text stops or starts mid-sentence, and the 2021 screen's third part
    // without setTimeout, which that candidate only read about afterwards.
    questions: [
      {
        id: 'real-time-poll-widget',
        round: 'Phone screen',
        kind: 'UI build',
        topic: 'Real-time poll widget',
        question:
          'In a 2025 L4 screening round, build a voting poll in React or another framework: four options, each a button; a click adds a vote, and every option\'s share of the votes updates at once, drawn as a coloured bar that moves smoothly as votes come in. A 2026 L5A candidate, who calls it the famous poll widget question, was then asked to make the options dynamic, entered through a form input.',
        sources: [UBER_L4_POLL_2025, UBER_UB6],
      },
      {
        id: 'css-position-values',
        round: 'Recruiter call',
        kind: 'Web fundamentals',
        topic: 'CSS position values',
        question: 'Name five values of the CSS position property and explain what each one does, in a short HR call that also asked about backend work.',
        sources: [UBER_UB8],
        practice: { label: 'CSS position: relative, absolute and fixed', path: '/css/trivia/css-position-relative-absolute-fixed' },
      },
      {
        id: 'display-none-vs-hidden',
        round: 'Recruiter call',
        kind: 'Web fundamentals',
        topic: 'Display none versus hidden',
        question: 'Explain the difference between display: none and hidden, in the same HR call.',
        sources: [UBER_UB8],
        practice: { label: 'Visibility hidden versus display none', path: '/css/trivia/css-visibility-vs-display' },
      },
      {
        id: 'sliding-window-string',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Sliding window over a string',
        question:
          'A medium string problem for a hash map and a sliding window, which the candidate likens to Longest Substring Without Repeating Characters; some of its twenty test cases timed out on the candidate\'s solution.',
        promptNotShared: true,
        sources: [UBER_UB2],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
      },
      {
        id: 'digit-manipulation',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Digit manipulation',
        question: 'An easy maths problem on the digits of a number, the first of the test\'s two coding questions.',
        promptNotShared: true,
        sources: [UBER_UB2],
      },
      {
        id: 'map-limit',
        round: 'Phone screen',
        kind: 'JavaScript',
        topic: 'Concurrency-limited async map',
        question:
          'Implement mapLimit: run an asynchronous, callback-style function over an array of inputs with at most a given number of calls in flight, then hand every output, in input order, to a final callback. The solution has to work for any such function, not only the getNameById example the prompt supplies.',
        sources: [UBER_UB1],
        practice: { label: 'Concurrency-limited map', path: '/javascript/coding/js-concurrency-map-limit' },
      },
      {
        id: 'progress-bars-on-click',
        round: 'Phone screen',
        kind: 'UI build',
        topic: 'Progress bars added on click',
        question:
          'Make every click of a button add a progress bar that fills smoothly over a few seconds. The follow-up limits how many bars fill at once, so with a limit of three a fourth click waits until the first bar is full.',
        sources: [UBER_UB_CODESIGNAL_2021],
      },
      {
        id: 'kth-lowest-elements',
        round: 'Phone screen',
        kind: 'Algorithm',
        topic: 'Kth lowest elements of an array',
        question: 'Find the kth lowest elements of an array, which the candidate calls simple and solved with a heap kept to a fixed size.',
        sources: [UBER_UB5],
      },
      {
        id: 'promise-memoization',
        round: 'Phone screen',
        kind: 'JavaScript',
        topic: 'Memoizing async functions',
        question:
          'Memoize a function that returns a promise, so the results of asynchronous calls are cached, in the JavaScript round that opened a 2024 full-stack loop; it took 25 minutes of a 45-minute interview.',
        sources: [UBER_FULLSTACK_2024],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
      },
      {
        id: 'priority-queue-problem',
        round: 'Phone screen',
        kind: 'Algorithm',
        topic: 'Priority queue problem',
        question: 'An easy data-structure question built on a priority queue, the first of three parts of an eliminator round.',
        promptNotShared: true,
        sources: [UBER_UB4],
      },
      {
        id: 'currying',
        round: 'Phone screen',
        kind: 'JavaScript',
        topic: 'Currying',
        question: 'A JavaScript currying question, the second part of the same eliminator round.',
        promptNotShared: true,
        sources: [UBER_UB4],
        practice: { label: 'Curry function', path: '/javascript/coding/js-curry-function' },
      },
      {
        id: 'react-performance-questions',
        round: 'Phone screen',
        kind: 'React concepts',
        topic: 'React performance',
        question: 'React questions, mostly about performance, after a React UI component build in the screening round.',
        promptNotShared: true,
        sources: [UBER_UB3],
      },
      {
        id: 'driver-method-chaining',
        round: 'Algorithms and data structures',
        kind: 'JavaScript',
        topic: 'Method chaining over a promise queue',
        question:
          'Write an UberDriver class whose calls chain, as in new UberDriver().pick("TestUser").pick("Rahul").drive(2).drop("Rahul").drive(4).drop("TestUser").rest(10): it logs that the driver is online, then each pick-up and drop-off in order, waiting the given number of seconds for each drive and rest. A follow-up asked what would change if some riders had priority.',
        sources: [UBER_UB4],
      },
      {
        id: 'objects-meeting-time',
        round: 'Algorithms and data structures',
        kind: 'Algorithm',
        topic: 'Earliest meeting time of moving objects',
        question:
          'Given the positions and maximum speeds of several objects, find the minimum time at which they can meet; the candidate, who gives the gist rather than the wording, solved it with maths, binary search and overlapping intervals.',
        sources: [UBER_UB2],
      },
      {
        id: 'task-order-dependencies',
        round: 'Algorithms and data structures',
        kind: 'Algorithm',
        topic: 'Task order from dependencies',
        question: 'Print an order in which a set of tasks can run, given the tasks each one depends on: a topological sort.',
        sources: [UBER_UB3],
      },
      {
        id: 'islands-ii',
        round: 'Algorithms and data structures',
        kind: 'Algorithm',
        topic: 'Number of Islands II',
        question:
          'Keep a count of islands as land is added to a grid one cell at a time, answering after each addition (LeetCode\'s Number of Islands II); the candidate first took it for the static version and finished with union-find just in time.',
        sources: [UBER_UB5],
      },
      {
        id: 'median-data-stream',
        round: 'Algorithms and data structures',
        kind: 'Algorithm',
        topic: 'Median of a data stream',
        question:
          'LeetCode\'s Find Median from Data Stream, asked of a 2024 full-stack candidate who solved it, though the interviewer did not seem satisfied with how the heap was written.',
        sources: [UBER_FULLSTACK_2024],
      },
      {
        id: 'parked-cars-distances',
        round: 'Algorithms and data structures',
        kind: 'Algorithm',
        topic: 'Grid distances from parked cars',
        question:
          'In a grid where 0 is an empty space and 1 a parked car, find the shortest distance from a car to every empty space; the candidate, in a 2024 full-stack loop, tried breadth-first search with dynamic programming.',
        sources: [UBER_FULLSTACK_2024],
      },
      {
        id: 'largest-plus-sign-variant',
        round: 'Algorithms and data structures',
        kind: 'Algorithm',
        topic: 'Largest plus sign in a grid',
        question: 'A grid problem the candidate calls similar to, but not the same as, LeetCode\'s Largest Plus Sign, in the first of two one-hour coding rounds.',
        promptNotShared: true,
        sources: [UBER_L5A_BANGALORE_2025],
      },
      {
        id: 'course-schedule-variant',
        round: 'Algorithms and data structures',
        kind: 'Algorithm',
        topic: 'Course Schedule II variant',
        question: 'A variation of LeetCode\'s Course Schedule II, in the algorithms round of a 2026 full-stack loop.',
        promptNotShared: true,
        sources: [UBER_FULLSTACK_2026],
      },
      {
        id: 'memory-game',
        round: 'Frontend specialization',
        kind: 'UI build',
        topic: 'Memory game',
        question:
          'Build a memory game. The candidate planned it in React, but the interviewer asked for vanilla JavaScript with proper optimisation, and the feedback said the vanilla code was not optimised enough.',
        sources: [UBER_UB4],
      },
      {
        id: 'jira-drag-and-drop',
        round: 'Frontend specialization',
        kind: 'React build',
        topic: 'Jira-style drag and drop',
        question: 'Build drag and drop like Jira\'s in React, in an hour, with MDN documentation open to consult.',
        sources: [UBER_L5A_BANGALORE_2025],
      },
      {
        id: 'typeahead-search',
        round: 'Frontend specialization',
        kind: 'UI build',
        topic: 'Typeahead search',
        question:
          'Build a typeahead search and answer questions on debouncing, in the machine coding round of a 2024 full-stack loop that gave 40 minutes for a clean, modular implementation after 15 minutes on the candidate\'s projects.',
        sources: [UBER_FULLSTACK_2024],
        practice: { label: 'React debounced search', path: '/react/coding/react-debounced-search' },
      },
      {
        id: 'connect-four',
        round: 'Frontend specialization',
        kind: 'UI build',
        topic: 'Connect Four game',
        question:
          'Build the Connect Four game, in what the account calls a low-level design round of a 2026 full-stack loop; the candidate knew the game from a frontend practice site.',
        sources: [UBER_FULLSTACK_2026],
      },
      {
        id: 'sequential-click-binding',
        round: 'Frontend specialization',
        kind: 'JavaScript',
        topic: 'Sequential click binding',
        question:
          'A task the candidate sums up as binding and unbinding click handlers in sequence; follow-ups asked how to speed it up and how the code would change for a different scenario.',
        promptNotShared: true,
        sources: [UBER_UB2],
      },
      {
        id: 'async-jobs-graph',
        round: 'Frontend specialization',
        kind: 'JavaScript',
        topic: 'Graph of async jobs',
        question: 'A JavaScript problem on graphs and asynchronous jobs, worked with JavaScript sets; the candidate finished it with one line left to fix.',
        promptNotShared: true,
        sources: [UBER_UB5],
      },
      {
        id: 'calendar-app-design',
        round: 'System design',
        kind: 'Frontend system design',
        topic: 'Google Calendar design',
        question:
          'Design a calendar application like Google Calendar; in one of two 2025 loops the interviewer pressed on GraphQL queries for paginated week and month views and on how caching works with GraphQL.',
        sources: [UBER_UB4, UBER_UB5],
      },
      // A separate row: the 2022 task was a collaborative calendar, a different set of requirements.
      {
        id: 'collaborative-calendar-design',
        round: 'System design',
        kind: 'Frontend system design',
        topic: 'Collaborative calendar design',
        question: 'Design a collaborative calendar to requirements the interviewer set.',
        sources: [UBER_UB2],
      },
      {
        id: 'config-driven-widget-builder',
        round: 'System design',
        kind: 'Frontend system design',
        topic: 'Config-driven UI widget builder',
        question: 'Design a config-driven builder for UI widgets and explain how client applications would integrate it.',
        sources: [UBER_L5A_BANGALORE_2025],
      },
      {
        id: 'concurrency-scheduler',
        kind: 'JavaScript',
        topic: 'Task scheduler with a concurrency limit',
        question: 'Write a scheduler in JavaScript that runs tasks with at most a given number running at once.',
        sources: [UBER_FE_BENGALURU_2018],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'tell-me-about-yourself',
        question: 'Tell me about yourself.',
        sources: [UBER_UB_CODESIGNAL_2021],
      },
      {
        id: 'why-join-uber',
        question: 'Why do you want to join Uber?',
        sources: [UBER_UB3],
      },
      {
        id: 'previous-projects-walkthrough',
        question: 'Walk through the projects you have worked on.',
        sources: [UBER_L5A_BANGALORE_2025, UBER_UB4, UBER_FULLSTACK_2024, UBER_UB3],
      },
      {
        id: 'proud-and-not-proud',
        question: 'Talk about a project you are proud of, and about things in your work you are not proud of.',
        sources: [UBER_UB3],
      },
      {
        id: 'interesting-project-or-situation',
        question: 'Tell me about a particularly interesting project or situation.',
        sources: [UBER_UB3],
      },
      {
        id: 'uber-values-situations',
        question:
          'Describe situations in which you applied Uber\'s values; the recruiter had named a challenging project, resolving a conflict in the team and leadership among the likely topics.',
        sources: [UBER_UB2],
      },
      {
        id: 'conflict-with-team-or-pm',
        question: 'Tell me about a conflict with a team member or a product manager.',
        sources: [UBER_FULLSTACK_2026],
      },
      {
        id: 'collaborative-and-end-to-end-projects',
        question: 'Talk about projects you worked on with others, and projects you took from start to finish.',
        sources: [UBER_FULLSTACK_2026],
      },
      {
        id: 'bug-in-production',
        question: 'What did you do when you pushed a bug to production that broke the system, and how did your team react?',
        sources: [UBER_FULLSTACK_2024],
      },
    ],
  },
  stripe: {
    summary:
      'Stripe\'s careers FAQ says most processes include a recruiter screen, a technical or skills-based assessment and a series of interviews with the team you would join. Frontend accounts from 2022 to 2026 describe a recruiter call, an hour of live coding with an engineer, then an onsite of four or five interviews: a bug squash, an integration exercise, a programming exercise, frontend design and a conversation with the hiring manager.',
    caveat:
      'The onsite rows rest on a handful of accounts and one recruiter\'s plan posted on Blind, and the mix changes: one candidate had a hiring manager interview in place of the bug squash, and a 2025 account lists bug fixing, deployment, testing and CI/CD among its four onsite rounds. In 2022 and 2024 accounts the recruiter described each interview in advance, so ask for that description.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers',
        stages: [
          {
            stage: 'Recruiter screen',
            format:
              'About 30 minutes with a recruiter, by phone in the 2025 accounts, on your experience, your motivation and the role. One 2022 loop opened with a chat with the hiring manager about the team instead.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_CAREERS, STRIPE_ST1, STRIPE_ST3, STRIPE_ST5, STRIPE_ST15_FE_TORONTO_2025, STRIPE_ST10_FE_US_2022],
          },
          {
            stage: 'Technical screen',
            format:
              'About 60 minutes of live coding with an engineer, in CoderPad or in your own editor. Accounts from 2022 to 2025 describe one exercise built in parts or two to four short ones, a small UI component in some screens and work on data in others; several let you choose the language, and one 2025 screen ran 40 to 45 minutes on Zoom. A 2026 account lists a separate coding exercise between this screen and the onsite.',
            appliesTo: STRIPE_ROLE,
            sources: [
              STRIPE_CAREERS,
              STRIPE_ST3,
              STRIPE_ST5,
              STRIPE_ST7,
              STRIPE_ST8,
              STRIPE_ST9,
              STRIPE_ST10_FE_US_2022,
              STRIPE_ST13_FE_TORONTO_2024,
              STRIPE_ST14_FE_SWEDEN_2025,
              STRIPE_ST15_FE_TORONTO_2025,
              STRIPE_ST16_FE_VANCOUVER_2025,
              STRIPE_ST18_FE_2026,
              STRIPE_ST25_SENIOR_2022,
            ],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Onsite: bug squash',
            format:
              'Fix a bug in a codebase you have not seen: reproduce it, find the cause and get the existing tests passing. Two 2022 accounts name a fork of an open-source project, and in 2024 the code was cloned from GitHub and run in the candidate\'s own environment. A commenter on a 2024 Blind thread had a hiring manager interview in place of this round.',
            appliesTo: STRIPE_ROLE,
            sources: [
              STRIPE_ST1,
              STRIPE_ST4,
              STRIPE_ST5,
              STRIPE_ST6_PLAN,
              STRIPE_ST10_FE_US_2022,
              STRIPE_ST11_FE_SEATTLE_2022,
              STRIPE_ST12_FE_CANADA_2024,
            ],
            practice: { label: 'Bug squash an unfamiliar invoicing repo', path: '/javascript/debug/js-debug-bug-squash-invoices' },
          },
          {
            stage: 'Onsite: integration',
            format:
              'Build a working piece of a feature with tools or an API you are given, reading their documentation as you go. A 2023 account describes integrating two provided tools, and a 2025 intern loop gave a private repository, the API documentation and open internet access. A 2022 account from India rated this round and the bug squash the hardest.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST4, STRIPE_ST6_PLAN, STRIPE_ST10_FE_US_2022, STRIPE_ST22_INTERN_2025],
            // Each onsite row gets its own practice, so the plan can fill all three rounds instead of one.
            practice: { label: 'Fetch JSON with a timeout and abort', path: '/javascript/coding/js-fetch-json-timeout' },
          },
          {
            stage: 'Onsite: programming exercise',
            format:
              'A coding exercise with an engineer. A 2022 account from India says its questions were real-life scenarios rather than LeetCode-style problems, and a 2024 virtual onsite held three programming exercises, most cloned into the candidate\'s own environment.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST4, STRIPE_ST6_PLAN, STRIPE_ST10_FE_US_2022, STRIPE_ST12_FE_CANADA_2024],
            practice: { label: 'Parse a query string', path: '/javascript/coding/js-querystring-parse-1' },
          },
          {
            stage: 'Onsite: frontend design',
            format:
              'A design discussion, talked through rather than coded, about how you would structure a piece of frontend. Accounts from 2022 to 2024 call it frontend system design, an architecture design discussion or a deep dive into design.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST6_PLAN, STRIPE_ST10_FE_US_2022, STRIPE_ST12_FE_CANADA_2024, STRIPE_ST21_FE_CANADA_2023],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Onsite: manager conversation',
            format:
              'A conversation with the hiring manager about your past work, how you work and your goals. A 2022 account describes behavioural and past-experience questions to judge culture fit, and a 2022 Seattle loop counted two behavioural interviews among its five.',
            appliesTo: STRIPE_ROLE,
            sources: [
              STRIPE_ST1,
              STRIPE_ST6_PLAN,
              STRIPE_ST10_FE_US_2022,
              STRIPE_ST11_FE_SEATTLE_2022,
              STRIPE_ST12_FE_CANADA_2024,
              STRIPE_ST20_SENIOR_CANADA_2025,
              STRIPE_ST22_INTERN_2025,
            ],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
    // Left out for want of a subject: "build a component" (2024 Blind), a small UI component to match a working example
    // (2022), a small self-contained JavaScript component (2022 senior), a React component on a shared editor (2017), a
    // three-part coding task (2025), "everything you expect from a front-end tech interview" (2020), and the intern's
    // HackerRank test, screen and data-handling exercise. They stay in the table. Behavioural questions are open, below.
    questions: [
      {
        id: 'bug-in-unfamiliar-repository',
        round: 'Onsite: bug squash',
        kind: 'Practical coding',
        topic: 'Bug in an unfamiliar repository',
        question:
          'Fix a bug in a codebase you have not seen: in 2024 a failing unit test in an existing codebase; in a 2022 United States account, a fork of a real open-source project with an issue and failing tests, where the candidate reproduced the failure, traced the root cause, explained the cleanest fix, implemented it and ran the whole suite.',
        sources: [STRIPE_ST10_FE_US_2022, STRIPE_ST11_FE_SEATTLE_2022, STRIPE_ST12_FE_CANADA_2024, STRIPE_ST4],
        practice: { label: 'Bug squash an unfamiliar invoicing repo', path: '/javascript/debug/js-debug-bug-squash-invoices' },
      },
      {
        id: 'four-digit-code-entry',
        round: 'Technical screen',
        kind: 'UI build',
        topic: 'Four-digit code entry form',
        question: 'Build a form for entering a four-digit code, in the programming language of your choice.',
        sources: [STRIPE_ST3],
      },
      {
        id: 'passport-validation-form',
        round: 'Technical screen',
        kind: 'UI build',
        topic: 'Passport validation form',
        question:
          'Build a form that validates passport details, set as three steps; the interviewer also looked for thorough test cases and the right accessibility attributes.',
        sources: [STRIPE_ST14_FE_SWEDEN_2025],
        practice: { label: 'Form validation with required fields', path: '/html/coding/html-forms-validation-required' },
      },
      {
        id: 'nested-string-parsing',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Nested string parsing',
        question:
          'A three-part CoderPad exercise, framed as a real-life frontend scenario, on parsing a nested string; solving it called for a two-pointer approach.',
        sources: [STRIPE_ST8],
      },
      {
        id: 'employee-records-top-salaries',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Sorting and filtering employee records',
        question:
          'Given employees with a name, department, salary and years at the company: sort them by different fields, keep one department, take its three highest salaries, average them and return only the names, with filter, sort, slice, map and reduce.',
        sources: [STRIPE_ST5],
      },
      {
        id: 'transaction-data-problems',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Transaction data in a JavaScript object',
        question:
          'A series of problems in 40 to 45 minutes on a JavaScript object holding transaction data, like the data behind Stripe\'s client dashboard.',
        sources: [STRIPE_ST15_FE_TORONTO_2025],
        practice: { label: 'Group by', path: '/javascript/coding/js-group-by' },
      },
      {
        id: 'ordered-list-conditional-styles',
        round: 'Technical screen',
        kind: 'UI build',
        topic: 'Ordered list with conditional styles',
        question:
          'Given a list of items with properties, display them in a set order and style particular items when given conditions hold, in the language of your choice.',
        sources: [STRIPE_ST13_FE_TORONTO_2024],
      },
      {
        id: 'json-traversal',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'JSON traversal and manipulation',
        question:
          'Traverse and manipulate JSON objects in a timed screen; the author found it much easier for frontend engineers and JavaScript users and does not give the questions.',
        promptNotShared: true,
        sources: [STRIPE_ST9],
        practice: { label: 'Implement lodash get', path: '/javascript/coding/js-lodash-get' },
      },
      {
        id: 'finance-themed-algorithm',
        round: 'Onsite: programming exercise',
        kind: 'Algorithm',
        topic: 'Finance-themed algorithm problem',
        question: 'An algorithmic problem with a finance theme.',
        promptNotShared: true,
        sources: [STRIPE_ST10_FE_US_2022],
      },
      {
        id: 'string-shortening',
        kind: 'Algorithm',
        topic: 'String shortening',
        question:
          'A multi-part exercise that opens with shortening a string to its first letter, the number of letters in between and its last letter, so the ten letters a to j become a8j.',
        sources: [STRIPE_ST12_FE_CANADA_2024],
      },
      {
        id: 'encode-decode-forms',
        kind: 'React build',
        topic: 'String encoding and decoding forms',
        question:
          'Build React forms that encode and decode strings with an algorithm you are given, the point being to use React state properly; pasting the provided snippets into the editor was disabled.',
        sources: [STRIPE_ST17_FE_2026],
      },
      {
        id: 'async-and-loops',
        kind: 'JavaScript',
        topic: 'Async code and loops',
        question: 'JavaScript technical questions about asynchronous code and loops.',
        promptNotShared: true,
        sources: [STRIPE_ST20_SENIOR_CANADA_2025],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'live-api-calls',
        round: 'Onsite: integration',
        kind: 'Practical coding',
        topic: 'Calls to Stripe production servers',
        question: 'Program API calls against Stripe\'s real production servers, with error handling and some data manipulation.',
        sources: [STRIPE_ST10_FE_US_2022],
        practice: { label: 'Retry a promise-returning function with delay', path: '/javascript/coding/js-retry-with-delay' },
      },
      {
        id: 'files-and-external-api',
        round: 'Onsite: integration',
        kind: 'Practical coding',
        topic: 'Files and an external API',
        question:
          'Extract data from files with a library you learn from its docs, then call an external API, process its responses and keep the output updated, debugging as you go.',
        sources: [STRIPE_ST22_INTERN_2025],
      },
      {
        id: 'react-tooltip-architecture',
        round: 'Onsite: frontend design',
        kind: 'Frontend system design',
        topic: 'Reusable React tooltip component',
        question: 'Talk through how you would architect a reusable React component for tooltips.',
        sources: [STRIPE_ST12_FE_CANADA_2024],
        practice: { label: 'Component-driven design system architecture', path: '/system-design/component-design-system-architecture' },
      },
      {
        id: 'stripe-page-design',
        round: 'Onsite: frontend design',
        kind: 'Frontend system design',
        topic: 'Frontend design of a Stripe page',
        question:
          'Design the frontend of a real Stripe page: break it into components with their APIs and state, make it accessible and leave room for later changes.',
        promptNotShared: true,
        sources: [STRIPE_ST10_FE_US_2022],
        practice: { label: 'UI component and state design from a mock', path: '/system-design/ui-component-state-from-mock' },
      },
      {
        id: 'app-design-breakdown',
        round: 'Onsite: frontend design',
        kind: 'Frontend system design',
        topic: 'Design breakdown of a given app',
        question: 'Shown an app, say how you would design it, breaking it down and going deeper on the areas you prefer.',
        promptNotShared: true,
        sources: [STRIPE_ST21_FE_CANADA_2023],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'project-proud-or-impact',
        question: 'Talk about a project you are proud of, or projects where you made an impact.',
        sources: [STRIPE_ST19_FE_DUBLIN_2025, STRIPE_ST1],
      },
      {
        id: 'difficult-recent-project',
        question: 'Explain a project you worked on recently that was difficult.',
        sources: [STRIPE_ST23_WEBDEV_2017],
      },
      {
        id: 'staying-up-to-date',
        question: 'How do you stay up to date with the latest technologies?',
        sources: [STRIPE_ST23_WEBDEV_2017],
      },
      {
        id: 'ideal-team',
        question: 'What does an ideal team look like when working on a project?',
        sources: [STRIPE_ST24_WEB_2018],
      },
      {
        id: 'deadlines-and-task-breakdown',
        question: 'How do you handle deadlines, and how do you break a task down?',
        sources: [STRIPE_ST22_INTERN_2025],
      },
      {
        id: 'unclear-requirements',
        question: 'How do you work with teammates when the requirements are unclear or keep changing?',
        sources: [STRIPE_ST22_INTERN_2025],
      },
      {
        id: 'when-something-goes-wrong',
        question: 'How do you react when something goes wrong?',
        sources: [STRIPE_ST22_INTERN_2025],
      },
    ],
  },
  bytedance: {
    title: 'ByteDance and TikTok frontend interview process',
    summary:
      'ByteDance and TikTok publish interview tips for early careers only. Experienced frontend accounts from 2022 to 2025, most of them from the United States, describe a recruiter call or, in 2025, a timed online test, then two live coding rounds, one algorithm and one frontend, a hiring manager round that often turned to system design, and a behavioural or HR round. Singapore and Australia accounts from 2021 to 2025 describe two or three technical rounds, and new graduates and interns a timed test, one to three technical interviews and a manager round.',
    caveat:
      'Accounts disagree on whether the hiring manager round is behavioural only, one 2024 loop added a product manager round and a department leader round, and two Singapore candidates had no online test. In 2024 accounts from the United States and Singapore the company shared preparation material, so ask the recruiter for it and for the rounds your team runs.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, United States',
        note: 'Most accounts in this list are from the United States; some Blind, LeetCode and blog accounts give no country.',
        stages: [
          {
            stage: 'Online assessment',
            format:
              'A timed online test that opened the 2025 US accounts, before any interview. A Seattle candidate had four questions in 70 minutes on CodeSignal, two easy and two medium, on basic web development in React, Vue or Angular; another had multiple-choice questions and two LeetCode-medium problems.',
            appliesTo: 'The 2025 US accounts',
            sources: [BYTEDANCE_TT1, BYTEDANCE_TT2, BYTEDANCE_TT10],
          },
          {
            stage: 'Recruiter call',
            format:
              'A call about your experience and the interview plan, 30 minutes in a 2024 account. A 2022 Seattle account had a 15-minute phone screen, and a 2024 account says TikTok provides an interview preparation guide.',
            appliesTo: 'Most 2022 to 2024 accounts',
            sources: [BYTEDANCE_BD2, BYTEDANCE_BD5, BYTEDANCE_BD9, BYTEDANCE_TT3, BYTEDANCE_TT5],
          },
          {
            stage: 'Technical rounds',
            format:
              'Two live coding rounds in most accounts, 60 minutes in one: a LeetCode-style algorithm round and a frontend round. In the frontend round you build a UI component or write a JavaScript utility, on HackerRank in two 2024 accounts, alongside short questions on JavaScript, React and CSS. A 2024 San Jose loop mixed LeetCode and React coding in each of its two rounds, a 2024 onsite repeated both rounds, a loop from summer 2022 had three technical rounds, and a 2022 Seattle candidate could choose two algorithm problems or one algorithm and one frontend problem.',
            appliesTo: 'Every complete loop in the accounts',
            sources: [
              BYTEDANCE_BD2,
              BYTEDANCE_BD3,
              BYTEDANCE_BD5,
              BYTEDANCE_BD8,
              BYTEDANCE_BD9,
              BYTEDANCE_TT1,
              BYTEDANCE_TT2,
              BYTEDANCE_TT3,
              BYTEDANCE_TT4,
              BYTEDANCE_TT5,
            ],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
          },
          {
            stage: 'Hiring manager round',
            format:
              'A round with the hiring manager that turned to system design in three 2024 accounts. In one it opened with five minutes on experience and added React and JavaScript questions and a short coding problem. A December 2023 candidate\'s recruiter said it could include technical questions, and TikTok and ByteDance employees replying on Blind disagreed on whether it is behavioural only.',
            appliesTo: 'Most 2023 and 2024 loops',
            sources: [BYTEDANCE_BD2, BYTEDANCE_BD8, BYTEDANCE_TT3, BYTEDANCE_TT4, BYTEDANCE_TT5],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Product manager round',
            format:
              'A cross-functional interview with a product manager in one 2024 loop. It covered working with product managers, a fast-paced environment and collaboration across teams.',
            appliesTo: 'One account',
            sources: [BYTEDANCE_BD2],
          },
          {
            stage: 'Department leader round',
            format:
              'A final round with a department leader in one 2024 loop. It asked why the candidate had changed companies and why TikTok, set a system design question and asked which tools the candidate used at work; a TikTok employee replying on the thread called this round a wildcard.',
            appliesTo: 'One account',
            sources: [BYTEDANCE_BD2],
          },
          {
            stage: 'HR or behavioural round',
            format:
              'A closing behavioural or HR interview on teamwork, communication and culture fit. In a loop from summer 2022, HR first described ByteDance\'s culture and the team, and the offer came a week after the round.',
            appliesTo: 'Some accounts',
            sources: [BYTEDANCE_TT1, BYTEDANCE_TT2, BYTEDANCE_TT5, BYTEDANCE_BD3],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
      {
        title: 'Frontend engineers, Singapore and Australia',
        stages: [
          {
            stage: 'CodeSignal assessment',
            format:
              'One frontend problem in four levels on CodeSignal, after a resume screen, in a 2025 Singapore account. Each level had to be passed in full before the next, and two other Singapore candidates, in 2024 and 2025, had no assessment.',
            appliesTo: 'Some candidates',
            sources: [BYTEDANCE_TT9, BYTEDANCE_TT15, BYTEDANCE_TT16],
          },
          {
            stage: 'Technical rounds (Singapore and Australia)',
            format:
              'Two or three live rounds of about an hour that mix JavaScript, React, HTML and CSS questions with coding. A senior candidate in Singapore had a LeetCode-style problem and React coding in a 2025 first round, a 2024 Singapore first round covered HTML, CSS and JavaScript fundamentals, and a 2024 Sydney loop ran a live JavaScript and React screen with a frontend engineer, then a virtual onsite with frontend-focused system design, coding and behavioural rounds. A 2021 Australia loop held all four of its rounds online on one afternoon.',
            appliesTo: 'Every complete loop in the accounts',
            sources: [BYTEDANCE_TT6, BYTEDANCE_TT7, BYTEDANCE_TT8, BYTEDANCE_TT15, BYTEDANCE_TT16, BYTEDANCE_BDT1, BYTEDANCE_BD6],
          },
          {
            stage: 'Hiring manager or director round',
            format: 'A round with the hiring manager, the third technical round in a 2023 Singapore account. A 2021 Australia loop had one round with a director.',
            appliesTo: 'Some loops',
            sources: [BYTEDANCE_TT6, BYTEDANCE_TT7, BYTEDANCE_BDT1],
          },
          {
            stage: 'HR round',
            format:
              'A closing interview with HR, behavioural in a 2021 Australia loop. A 2025 Singapore loop of two technical rounds, a hiring manager round and an HR round took a week, and in 2024 a Singapore HR contact shared preparation material before the technical interviews.',
            appliesTo: 'Most complete loops',
            sources: [BYTEDANCE_TT6, BYTEDANCE_TT15, BYTEDANCE_BDT1],
          },
        ],
      },
      {
        title: 'New graduates and interns',
        stages: [
          {
            stage: 'Early-careers online assessment',
            format:
              'A timed test of 110 minutes to two hours, on HackerRank where the accounts name a platform. Several report LeetCode-style problems; a 2025 front-end graduate assessment had five multiple-choice questions, one algorithm question and one debugging question, and a 2024 intern had five days to take a 110-minute test. The TikTok early-careers page says an assessment depends on the role and region.',
            appliesTo: 'Students',
            sources: [
              BYTEDANCE_TIKTOK_CAMPUS,
              BYTEDANCE_BD1,
              BYTEDANCE_BD7,
              BYTEDANCE_BD10,
              BYTEDANCE_BD11,
              BYTEDANCE_TT11,
              BYTEDANCE_TT12,
            ],
          },
          {
            stage: 'Technical interviews',
            format:
              'ByteDance\'s early-careers page tells candidates to expect two to three interviews on coding, algorithms and design. Accounts describe one to three, often on LeetCode-style problems: a 2021 loop had two back-to-back 45-minute interviews, and a 2020 loop opened with ten minutes on the resume. A 2022 new-graduate first round instead mixed web and JavaScript questions with a coding task in HackerRank CodePair, and a 2024 Sydney graduate found the questions depended on the interviewer.',
            appliesTo: 'Students',
            sources: [
              BYTEDANCE_CAMPUS,
              BYTEDANCE_BD1,
              BYTEDANCE_BD4,
              BYTEDANCE_BD10,
              BYTEDANCE_BD11,
              BYTEDANCE_TT11,
              BYTEDANCE_TT13,
            ],
          },
          {
            stage: 'Manager or behavioural round',
            format:
              'A final interview with the hiring manager or a behavioural interviewer, about your projects and resume. In a 2020 and a 2021 new-graduate loop it ended with a coding question, and a 2025 intern had a behavioural interview after one technical interview.',
            appliesTo: 'Students',
            sources: [BYTEDANCE_BD4, BYTEDANCE_BD10, BYTEDANCE_TT11, BYTEDANCE_TT13],
          },
        ],
      },
    ],
    // Kept by content: the algorithm, JavaScript, React and web questions of new-graduate and intern loops (BD1, BD10,
    // BD11, TT13) and of a summer 2022 loop with no country (BD3). Questions an account lists apart from its rounds
    // carry no round (TT5, TT6). Left out for want of a subject: the hiring manager's system design, React trivia, JS
    // questions and short LeetCode-style problem (BD2), the basic JS questions of BD2's first round, React coding (BD6),
    // the LeetCode medium and React exercise of BD8, the online tests' unnamed problems (TT1, TT11, TT12, BD7, BD10,
    // BD11), JavaScript, React and resume questions (TT7), a question on JavaScript API import (TT13), the LeetCode
    // mediums of BD4's interviews and its manager's coding question, and the culture-fit questions of BD3's HR round.
    // Left out as advice rather than an account: the practice mix a ByteDance-badged commenter suggested on Blind in
    // February 2023 (an async timer among it), and the questions a ByteDance-badged commenter on BD8 said may come up.
    questions: [
      {
        id: 'tooltip-component',
        round: 'Technical rounds',
        kind: 'UI build',
        topic: 'Custom tooltip component',
        question:
          'Implement a custom tooltip component in HackerRank, then run the code and show the interviewer the working UI. It opened the first technical round of a 2024 loop, run by a frontend engineer.',
        sources: [BYTEDANCE_BD2],
      },
      {
        id: 'throttle-function',
        round: 'Technical rounds',
        kind: 'JavaScript',
        topic: 'Throttle function',
        question: 'Implement a throttle function in JavaScript. It shared a HackerRank round with a React task that fetched data and rendered it.',
        sources: [BYTEDANCE_BD5],
        practice: { label: 'Throttle function', path: '/javascript/coding/js-throttle' },
      },
      {
        id: 'react-fetch-and-render',
        round: 'Technical rounds',
        kind: 'React build',
        topic: 'Fetch and render data in React',
        question: 'Fetch data and render it in a React component, the second task of the HackerRank round that also asked for a throttle function.',
        sources: [BYTEDANCE_BD5],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'javascript-built-in-method',
        round: 'Technical rounds',
        kind: 'JavaScript',
        topic: 'JavaScript built-in method',
        question: 'Write your own version of one of JavaScript\'s built-in methods, after the tooltip in the same round; the account does not say which method.',
        promptNotShared: true,
        sources: [BYTEDANCE_BD2],
        practice: { label: 'Implement Array.prototype.map', path: '/javascript/coding/js-array-prototype-map' },
      },
      {
        id: 'lodash-get',
        round: 'Technical rounds',
        kind: 'JavaScript',
        topic: 'Lodash get helper',
        question: 'On a whiteboard, implement the get function from lodash, which reads a value from a nested object by its path.',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'Implement lodash.get', path: '/javascript/coding/js-lodash-get' },
      },
      {
        id: 'typeahead-frontend-design',
        round: 'Technical rounds',
        kind: 'Frontend system design',
        topic: 'Typeahead frontend design',
        question: 'Design the frontend of a typeahead search, discussed for about 20 minutes at the end of the last technical round.',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'Real-time search with debounce and caching', path: '/system-design/realtime-search-debounce-cache' },
      },
      {
        id: 'tiktok-landing-page-design',
        round: 'Hiring manager round',
        kind: 'Frontend system design',
        topic: 'TikTok landing page design',
        question: 'Design the TikTok landing page, in the software design round the hiring manager ran at the onsite.',
        sources: [BYTEDANCE_TT4],
        practice: { label: 'Endless short-video feed (TikTok-style)', path: '/system-design/endless-short-video-feed' },
      },
      {
        id: 'forum-cards-from-json',
        round: 'Online assessment',
        kind: 'UI build',
        topic: 'Forum cards from JSON data',
        question: 'Build cards for a forum in HTML from information read out of a JSON file, one of four questions on CodeSignal.',
        sources: [BYTEDANCE_TT10],
      },
      {
        id: 'graph-problem',
        round: 'Technical rounds',
        kind: 'Algorithm',
        topic: 'Graph problem',
        question: 'A data structures and algorithms question on graphs, in the round before the frontend coding round; the account does not give the problem.',
        promptNotShared: true,
        sources: [BYTEDANCE_TT2],
      },
      {
        id: 'three-sum-variant',
        round: 'Technical rounds',
        kind: 'Algorithm',
        topic: '3Sum variant',
        question: 'Solve a LeetCode-medium variation of 3Sum, asked at the very start of the last technical round.',
        sources: [BYTEDANCE_BD3],
        practice: { label: '3Sum', path: '/javascript/coding/js-three-sum' },
      },
      {
        id: 'string-problem',
        round: 'Technical rounds',
        kind: 'Algorithm',
        topic: 'String problem',
        question: 'A LeetCode-medium string question on a whiteboard, which ended the second technical round; the account does not name it.',
        promptNotShared: true,
        sources: [BYTEDANCE_BD3],
      },
      {
        id: 'useeffect-dependency-array',
        round: 'Technical rounds',
        kind: 'React concepts',
        topic: 'useEffect and its dependency array',
        question:
          'Which React hooks have you used? Then explain useEffect in detail: what the dependency array is for, why an empty array runs the effect once on mount, and what happens when an object, an array or a ref is in it.',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'useEffect: timing, dependencies and cleanup', path: '/react/trivia/react-useeffect-purpose' },
      },
      {
        id: 'uselayouteffect-vs-useeffect',
        round: 'Technical rounds',
        kind: 'React concepts',
        topic: 'useLayoutEffect versus useEffect',
        question: 'What is useLayoutEffect, how does it differ from useEffect, and when would you use each?',
        sources: [BYTEDANCE_BD3, BYTEDANCE_TT6],
        practice: { label: 'useEffect vs useLayoutEffect', path: '/react/trivia/react-useeffect-vs-uselayouteffect' },
      },
      {
        id: 'react-18-changes',
        round: 'Technical rounds',
        kind: 'React concepts',
        topic: 'What is new in React 18',
        question: 'Explain what is new in React 18.',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'What is new in React 18', path: '/react/trivia/react-18-whats-new' },
      },
      {
        id: 'react-fiber',
        round: 'Technical rounds',
        kind: 'React concepts',
        topic: 'React Fiber',
        question: 'What problems does React Fiber solve?',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'How concurrent rendering works', path: '/react/trivia/react-concurrent-rendering' },
      },
      {
        id: 'event-loop-task-queues',
        round: 'Technical rounds',
        kind: 'JavaScript',
        topic: 'Event loop and task queues',
        question: 'Explain the event loop and the difference between microtasks and macrotasks.',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'Microtasks vs macrotasks', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
      },
      {
        id: 'map-versus-object',
        round: 'Technical rounds',
        kind: 'JavaScript',
        topic: 'Map versus plain object',
        question: 'How does a JavaScript Map differ from a plain object?',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'Map vs plain Object', path: '/javascript/trivia/js-map-vs-object' },
      },
      {
        id: 'javascript-trends',
        round: 'Technical rounds',
        kind: 'JavaScript',
        topic: 'Current JavaScript trends',
        question: 'What are the current trends in JavaScript?',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'Evaluating JavaScript trends', path: '/javascript/trivia/js-current-trends' },
      },
      {
        id: 'http-caching',
        round: 'Technical rounds',
        kind: 'Web fundamentals',
        topic: 'HTTP caching',
        question: 'Explain HTTP caching: which of ETag and Last-Modified is preferred and why, and what the body of a 304 response holds.',
        sources: [BYTEDANCE_BD3],
        practice: { label: 'HTTP caching: ETag, Last-Modified and 304', path: '/javascript/trivia/http-caching-basics' },
      },
      {
        id: 'how-http-works',
        round: 'Technical rounds',
        kind: 'Web fundamentals',
        topic: 'How HTTP works',
        question: 'How does HTTP work, and what does the S in HTTPS stand for?',
        sources: [BYTEDANCE_BD3],
      },
      {
        id: 'css-specificity',
        round: 'Technical rounds',
        kind: 'Web fundamentals',
        topic: 'CSS specificity',
        question: 'Questions on CSS specificity in the round that opened with the tooltip; the account names the subject but not the questions.',
        promptNotShared: true,
        sources: [BYTEDANCE_BD2],
        practice: { label: 'Cascade, specificity and !important', path: '/css/trivia/css-cascade-order' },
      },
      {
        id: 'web-accessibility',
        round: 'Technical rounds',
        kind: 'Web fundamentals',
        topic: 'Web accessibility',
        question: 'Questions on accessibility in the same round; the account does not give them.',
        promptNotShared: true,
        sources: [BYTEDANCE_BD2],
        practice: { label: 'How would you make a page accessible?', path: '/html/trivia/web-accessibility-make-page-accessible' },
      },
      {
        id: 'performance-focused-design',
        round: 'Department leader round',
        kind: 'Frontend system design',
        topic: 'Performance-focused system design',
        question:
          'A system design question in which the department leader asked to discuss only performance optimisation, scalability, availability and stability; the account does not say what was designed. Asked later what kind of system design the loop had, the candidate replied front end specific.',
        promptNotShared: true,
        sources: [BYTEDANCE_BD2],
      },
      {
        id: 'fetch-retry-promise',
        kind: 'JavaScript',
        topic: 'Retrying a failed fetch',
        question:
          'Write a promise that retries a failed fetch a given number of times, waiting before each retry for the Fibonacci number of that attempt.',
        sources: [BYTEDANCE_TT5],
        practice: { label: 'Retry a promise-returning function with delay', path: '/javascript/coding/js-retry-with-delay' },
      },
      {
        id: 'promise-all',
        kind: 'JavaScript',
        topic: 'Promise.all',
        question: 'Write your own implementation of Promise.all.',
        sources: [BYTEDANCE_TT6],
        practice: { label: 'Implement Promise.all', path: '/javascript/coding/js-promise-all' },
      },
      {
        id: 'sliding-window-stack-and-queue',
        kind: 'Algorithm',
        topic: 'Sliding window, stack and queue problems',
        question: 'Two LeetCode-medium problems on a sliding window and on stacks and queues; the account does not name them.',
        promptNotShared: true,
        sources: [BYTEDANCE_TT6],
      },
      {
        id: 'useimperativehandle',
        kind: 'React concepts',
        topic: 'useImperativeHandle',
        question: 'What is useImperativeHandle in React?',
        sources: [BYTEDANCE_TT6],
      },
      {
        id: 'css-text-overflow',
        kind: 'Web fundamentals',
        topic: 'Text overflow handling',
        question: 'How do you handle text that overflows its container?',
        sources: [BYTEDANCE_TT6],
      },
      {
        id: 'ordering-app',
        round: 'CodeSignal assessment',
        kind: 'UI build',
        topic: 'Ordering app with a list',
        question: 'Build an ordering app that adds orders through different kinds of inputs and shows them in a list, set as one problem in four levels.',
        sources: [BYTEDANCE_TT9],
      },
      {
        id: 'data-fetching-hook',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'React build',
        topic: 'Custom data-fetching hook',
        question: 'How would you build a custom React hook that fetches data from an API?',
        sources: [BYTEDANCE_TT8],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'live-chat-widget-design',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Frontend system design',
        topic: 'Live chat widget design',
        question: 'Design a live chat widget that updates messages in real time and can be embedded on any website.',
        sources: [BYTEDANCE_TT8],
        practice: { label: 'Design a real-time messaging inbox', path: '/system-design/messaging-inbox-frontend' },
      },
      {
        id: 'letter-case-permutation',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Algorithm',
        topic: 'Letter Case Permutation',
        question:
          'Solve LeetCode 784, Letter Case Permutation: list every string you can make by switching the case of each letter. It was one of two problems in a first round whose other problem was React coding.',
        sources: [BYTEDANCE_BD6],
      },
      {
        id: 'url-to-rendered-page',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Web fundamentals',
        topic: 'From URL to rendered page',
        question: 'Walk through every step from entering a URL in the address bar to the finished page. It came up in two of the interviews of the same loop.',
        sources: [BYTEDANCE_BDT1],
        practice: { label: 'How the browser parses and renders HTML', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'dom-to-html',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'JavaScript',
        topic: 'DOM structure to HTML',
        question: 'Parse a JavaScript DOM structure into HTML, in the second of two one-hour interviews; the account gives no more detail.',
        sources: [BYTEDANCE_TT16],
      },
      {
        id: 'string-to-integer',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Algorithm',
        topic: 'String to integer parsing',
        question: 'Parse a string into an integer, in the first of the same two interviews.',
        sources: [BYTEDANCE_TT16],
      },
      {
        id: 'dynamic-routing',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Web fundamentals',
        topic: 'Dynamic routing',
        question: 'Describe how you would implement dynamic routing.',
        sources: [BYTEDANCE_TT16],
      },
      {
        id: 'how-the-internet-works',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Web fundamentals',
        topic: 'How the internet works',
        question: 'Describe the internet, in the first of the same two interviews.',
        sources: [BYTEDANCE_TT16],
      },
      {
        id: 'data-types-and-declarations',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'JavaScript',
        topic: 'Data types and variable declarations',
        question: 'Name the basic data types in JavaScript, then answer questions on let, const, var and this.',
        sources: [BYTEDANCE_TT15],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'html-tag-categories',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Web fundamentals',
        topic: 'HTML tag categories',
        question: 'What categories do HTML tags fall into, and how does a p element differ from a div?',
        sources: [BYTEDANCE_TT15],
        practice: { label: 'Block-level and inline elements', path: '/html/trivia/html-block-inline-elements' },
      },
      {
        id: 'css-box-model-and-layout',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Web fundamentals',
        topic: 'CSS box model and a layout',
        question: 'Explain the CSS box model, then write CSS for a given layout; the account leaves out the layout.',
        sources: [BYTEDANCE_TT15],
        practice: { label: 'box-sizing and the box model', path: '/css/trivia/css-box-model' },
      },
      {
        id: 'classes-and-functions',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'JavaScript',
        topic: 'Classes and functions',
        question: 'Explain classes and functions in JavaScript.',
        sources: [BYTEDANCE_TT15],
        practice: { label: 'What are classes in JavaScript?', path: '/javascript/trivia/js-classes' },
      },
      {
        id: 'horse-race-puzzle',
        round: 'Technical rounds (Singapore and Australia)',
        kind: 'Algorithm',
        topic: 'Horse race puzzle',
        question: 'The horse race puzzle: work out how to find the top three horses, set as a maths question in a first round on HTML, CSS and JavaScript fundamentals.',
        sources: [BYTEDANCE_TT15],
      },
      {
        id: 'tree-from-flat-array',
        round: 'Technical interviews',
        kind: 'JavaScript',
        topic: 'Tree from a flat array',
        question: 'Given a flat array of objects, build a tree out of it, in JavaScript in HackerRank CodePair.',
        sources: [BYTEDANCE_BD1],
        practice: { label: 'Build a tree from a flat list of nodes', path: '/javascript/coding/js-build-tree-from-flat-list' },
      },
      {
        id: 'virtual-dom',
        round: 'Technical interviews',
        kind: 'React concepts',
        topic: 'Virtual DOM',
        question: 'What is the virtual DOM?',
        sources: [BYTEDANCE_BD1, BYTEDANCE_TT13],
        practice: { label: 'Reconciliation, keys and element type', path: '/react/trivia/react-diffing-algorithm' },
      },
      {
        id: 'react-versus-vue',
        round: 'Technical interviews',
        kind: 'React concepts',
        topic: 'React versus Vue',
        question: 'How do React and Vue differ?',
        sources: [BYTEDANCE_BD1],
        practice: { label: 'How Vue differs from React', path: '/vue/trivia/vue-reactivity-vs-react-concepts' },
      },
      {
        id: 'visibility-and-rendering',
        round: 'Technical interviews',
        kind: 'Web fundamentals',
        topic: 'Visibility and rendering',
        question: 'Describe visibility in the context of rendering.',
        sources: [BYTEDANCE_BD1],
        practice: { label: 'visibility: hidden vs display: none', path: '/css/trivia/css-visibility-vs-display' },
      },
      {
        id: 'settimeout-versus-promises',
        round: 'Technical interviews',
        kind: 'JavaScript',
        topic: 'setTimeout versus promises',
        question: 'What is the difference between setTimeout and promises?',
        sources: [BYTEDANCE_BD1],
        practice: { label: 'Microtasks vs macrotasks', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
      },
      {
        id: 'console-log-order',
        round: 'Technical interviews',
        kind: 'JavaScript',
        topic: 'Console log output order',
        question: 'Given five console.log statements, say in what order they print.',
        sources: [BYTEDANCE_BD1],
        practice: { label: 'Event loop visualiser', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'longest-consecutive-sequence-variant',
        round: 'Early-careers online assessment',
        kind: 'Algorithm',
        topic: 'Longest Consecutive Sequence variant',
        question: 'An array problem similar to Longest Consecutive Sequence, one of three LeetCode-style problems in the HackerRank test.',
        sources: [BYTEDANCE_BD1],
      },
      {
        id: 'longest-common-substring',
        round: 'Early-careers online assessment',
        kind: 'Algorithm',
        topic: 'Longest common substring',
        question: 'Find the longest common substring, the string problem of the same test.',
        sources: [BYTEDANCE_BD1],
      },
      {
        id: 'number-of-islands-variant',
        round: 'Early-careers online assessment',
        kind: 'Algorithm',
        topic: 'Number of Islands variant',
        question: 'A graph problem like Number of Islands, the third problem of the same test.',
        sources: [BYTEDANCE_BD1],
      },
      {
        id: 'odd-cycle-in-graph',
        round: 'Technical interviews',
        kind: 'Algorithm',
        topic: 'Odd cycle in a graph',
        question: 'Detect an odd cycle in a graph, the problem of the first of two back-to-back 45-minute interviews.',
        sources: [BYTEDANCE_BD10],
      },
      {
        id: 'tree-section-between-nodes',
        round: 'Technical interviews',
        kind: 'Algorithm',
        topic: 'Tree section between two nodes',
        question: 'Given two nodes of a tree, return the section of the tree that lies between them, in the second 45-minute interview.',
        sources: [BYTEDANCE_BD10],
      },
      {
        id: 'timeout-promise-question',
        round: 'Manager or behavioural round',
        kind: 'JavaScript',
        topic: 'Timeout and promise question',
        question: 'A JavaScript question on timeouts and promises to solve, after questions on the resume and projects; the account does not give it.',
        promptNotShared: true,
        sources: [BYTEDANCE_BD10],
      },
      {
        id: 'four-points-square',
        round: 'Technical interviews',
        kind: 'Algorithm',
        topic: 'Four points forming a square',
        question: 'Given a list of points, return whether any four of them form a square.',
        sources: [BYTEDANCE_BD11],
      },
      {
        id: 'closest-dessert-cost',
        round: 'Technical interviews',
        kind: 'Algorithm',
        topic: 'Closest Dessert Cost',
        question: 'Solve Closest Dessert Cost from LeetCode, the second problem of the same intern round.',
        sources: [BYTEDANCE_BD11],
      },
      {
        id: 'daily-temperatures',
        round: 'Technical interviews',
        kind: 'Algorithm',
        topic: 'Daily Temperatures',
        question: 'Solve Daily Temperatures from LeetCode, the one coding question of the second intern round.',
        sources: [BYTEDANCE_BD11],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'most-challenging-project',
        question: 'What is the most technically challenging project you have worked on?',
        sources: [BYTEDANCE_BD3, BYTEDANCE_TT3],
      },
      {
        id: 'describe-a-finished-project',
        question: 'Describe a project you completed: its challenges, how you built it and the tech stack.',
        sources: [BYTEDANCE_BD1],
      },
      {
        id: 'why-tiktok',
        question: 'Why TikTok, and why are you leaving your current company?',
        sources: [BYTEDANCE_BD2],
      },
      {
        id: 'why-you-changed-companies',
        question:
          'Why did you leave each of your previous companies? The candidate had changed companies three times in eight years and was asked for the reason behind each move.',
        sources: [BYTEDANCE_BD2],
      },
      {
        id: 'working-with-product-managers',
        question: 'How do you work with product managers, and how do you collaborate across teams?',
        sources: [BYTEDANCE_BD2],
      },
      {
        id: 'fast-paced-environment',
        question: 'How do you work in a fast-paced environment?',
        sources: [BYTEDANCE_BD2],
      },
      {
        id: 'testing-and-telemetry-tools',
        question: 'Which tools do you use for testing and telemetry in your current role, and why did you choose them?',
        sources: [BYTEDANCE_BD2],
      },
      {
        id: 'unit-and-e2e-testing',
        question: 'What is your experience writing unit tests and end-to-end tests?',
        sources: [BYTEDANCE_BD3],
      },
      {
        id: 'your-weaknesses',
        question: 'What are your weaknesses?',
        sources: [BYTEDANCE_TT11],
      },
    ],
  },
  'booking-com': {
    summary:
      'Booking.com\'s hiring page describes a call with a sourcer or recruiter, interview rounds with the manager and team that depend on department and seniority, and technical tests and coding interviews for some technical roles. Frontend accounts from 2021 to 2023, mostly for Amsterdam, describe a HackerRank test, a recruiter call, one or two frontend coding rounds and a fit interview.',
    caveat:
      'Full-stack and senior roles add backend coding and a system design round. Three 2025 accounts are thinner: a frontend developer describes a recruiter call and one live-coding round with two engineers, a software engineer a take-home, a technical session, system design and an engineering manager round, and a senior software engineer an easy React exercise and system design, so recent frontend loops may differ.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, 2021 to 2023',
        note: 'Three 2025 accounts, one frontend and two software engineer loops, are cited on the rounds they share with this loop.',
        stages: [
          {
            stage: 'HackerRank assessment',
            format:
              'A timed HackerRank test of 90–100 minutes with about five items: two algorithm problems, mostly easy (one account had a medium), two HTML and CSS multiple-choice questions and a React component. One 2022 account had a single 120-minute project with a React front end and a Node API instead.',
            appliesTo: 'Junior to FE II',
            sources: [BOOKINGCOM_BK3, BOOKINGCOM_BK5, BOOKINGCOM_BK8, BOOKINGCOM_BK9, BOOKINGCOM_BK10, BOOKINGCOM_BK11, BOOKINGCOM_BK17_DEVTO],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
            rehearsal: {
              label: 'Booking.com HackerRank assessment, 2 multiple-choice questions and 3 problems in 90 minutes',
              path: '/javascript/coding/js-valid-parentheses',
            },
          },
          {
            stage: 'Recruiter call',
            format: 'A short call, 15 minutes in one full-stack account; some calls include a few technical questions. One 2023 candidate spoke with two recruiters over two to three weeks.',
            appliesTo: 'All candidates',
            sources: [BOOKINGCOM_JOURNEY, BOOKINGCOM_BK1, BOOKINGCOM_BK5, BOOKINGCOM_BK8, BOOKINGCOM_BK11, BOOKINGCOM_BK12, BOOKINGCOM_BK19_FE_2025],
          },
          {
            stage: 'Frontend coding',
            format:
              'One or two live rounds of about 60 minutes, usually with two engineers, building a UI component in plain JavaScript, HTML and CSS or in React; one 2022 account could choose plain JavaScript, Vue or React, and one 2023 round was a 40-minute monitored HackerRank session with three engineers. In 2025 a frontend developer had one live-coding round with two engineers, a senior software engineer an easy React exercise, and a software engineer a take-home before the first technical session.',
            appliesTo: 'Frontend roles',
            sources: [
              BOOKINGCOM_BK1,
              BOOKINGCOM_BK2,
              BOOKINGCOM_BK5,
              BOOKINGCOM_BK6,
              BOOKINGCOM_BK7,
              BOOKINGCOM_BK9,
              BOOKINGCOM_BK10,
              BOOKINGCOM_BK11,
              BOOKINGCOM_BK13_SENIOR_FULLSTACK,
              BOOKINGCOM_BK15_SENIOR_2025,
              BOOKINGCOM_BK18_SE1_2025,
              BOOKINGCOM_BK19_FE_2025,
            ],
            practice: { label: 'Autocomplete engine in plain JavaScript', path: '/javascript/coding/js-autocomplete-engine' },
          },
          {
            stage: 'Fit interview',
            format: 'A conversation, the last round, with engineering managers in one account; 60 minutes in one full-stack account. A 2025 software engineer loop ended with an engineering manager round.',
            appliesTo: 'All candidates',
            sources: [BOOKINGCOM_BK5, BOOKINGCOM_BK7, BOOKINGCOM_BK8, BOOKINGCOM_BK11, BOOKINGCOM_BK12, BOOKINGCOM_BK18_SE1_2025],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
    // Left out for want of a subject: the HackerRank items (two easy algorithm problems, two HTML and CSS
    // multiple-choice questions, one React component), "a component in vanilla JS, HTML and CSS in both rounds", the
    // recruiter's technical questions and the 2025 rounds; they stay in the table. Left out by content: the backend and
    // system design rounds of full-stack and senior loops, and the Node API of the 2022 HackerRank project. Left out for
    // their source: everything known only from Glassdoor (a form validator, a hover-intent dropdown, event delegation, a
    // polling stock widget, a lodash function, the A/B-testing and confirmation-page questions, a dynamic React form).
    questions: [
      {
        id: 'autocomplete-search-box',
        round: 'Frontend coding',
        kind: 'UI build',
        topic: 'Autocomplete search box',
        question:
          'Build an autocomplete search box that suggests matches in a dropdown as the user types, and say which features are must-haves and which can wait; one 2023 account required plain JavaScript, HTML and CSS. Another lists API calls, highlighting the matched text, debounce or throttle, caching, keyboard navigation and error states.',
        sources: [BOOKINGCOM_BK2, BOOKINGCOM_BK1, BOOKINGCOM_BK11],
        practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
      },
      {
        id: 'tooltip',
        round: 'Frontend coding',
        kind: 'UI build',
        topic: 'Tooltip component',
        question: 'Implement a tooltip, in the first of two live coding rounds.',
        sources: [BOOKINGCOM_BK11],
      },
      {
        id: 'react-component-api-design-spec',
        round: 'Frontend coding',
        kind: 'React build',
        topic: 'API-backed component to a design spec',
        question: 'With two senior frontend engineers, build a React component that renders data from an API endpoint and matches a given design spec.',
        sources: [BOOKINGCOM_BK5],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'prepared-app-new-feature',
        round: 'Frontend coding',
        kind: 'Practical coding',
        topic: 'New feature in a prepared app',
        question: 'Add a new feature to an application prepared in advance, in the framework of your choice.',
        promptNotShared: true,
        sources: [BOOKINGCOM_BK6],
      },
      {
        id: 'get-api-display-components',
        round: 'Frontend coding',
        kind: 'UI build',
        topic: 'Displaying GET request results',
        question: 'Make a GET request to an API and build the components that display what it returns, in the frontend round of a senior full-stack loop.',
        sources: [BOOKINGCOM_BK13_SENIOR_FULLSTACK],
        practice: { label: 'React debounced search with a fake API', path: '/react/coding/react-debounced-search' },
      },
      {
        id: 'attractions-by-review-score',
        round: 'HackerRank assessment',
        kind: 'React build',
        topic: 'Attractions filtered by review score',
        question: 'Build the React side of a small app that lists the attractions whose average review score is at or above a score the user enters.',
        sources: [BOOKINGCOM_BK17_DEVTO],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'rxjs-angular-questions',
        kind: 'Angular concepts',
        topic: 'RxJS, component structure and lifecycle',
        question: 'Questions on RxJS, on how Angular components are structured and on the Angular component lifecycle, in an interview without coding.',
        sources: [BOOKINGCOM_BK16_ANGULAR],
        practice: { label: 'Angular lifecycle hooks', path: '/angular/trivia/angular-lifecycle-hooks' },
      },
    ],
  },
  datadog: {
    summary:
      'Datadog\'s candidate experience page describes an initial screen, face-to-face interviews in rounds or panels with one step expected in person, and a take-home project and an executive interview for some roles. Frontend accounts from 2021 to 2025, most of them senior loops in France, Spain and Portugal, describe a recruiter screen, an algorithm screen on CoderPad, an hour of React live coding or a take-home, a harder coding round, frontend system design on Excalidraw, experience and values, then team matching.',
    caveat:
      'Round order and count vary between loops, and one 2024 candidate could choose the take-home instead of React live coding. Some loops held a round in person at an office while others stayed fully virtual, no frontend account reports the executive interview, and the only US account is a 2021 New York loop.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, mostly in Europe',
        stages: [
          {
            stage: 'Recruiter screen',
            format: 'About 30 minutes with a recruiter on your background and a past project, on Zoom in one account.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_CANDIDATE_EXPERIENCE, DATADOG_DD1, DATADOG_DD2, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD6, DATADOG_DD9, DATADOG_DD10, DATADOG_DD11],
          },
          {
            stage: 'Technical screen',
            format: '40–60 minutes on CoderPad: two easy or medium algorithm problems in JavaScript or TypeScript.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD6, DATADOG_DD9, DATADOG_DD10, DATADOG_DD12],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'React live coding',
            format: 'One hour of React on CoderPad with an engineer; in some loops the task grows one requirement at a time.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD2, DATADOG_DD3, DATADOG_DD5, DATADOG_DD6, DATADOG_DD7, DATADOG_DD8, DATADOG_DD10],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Take-home project',
            format: 'A small frontend app built at home, with 4–6 suggested hours (one 2021 account also gives 6–8); one 2024 candidate chose it over React live coding.',
            appliesTo: 'Some roles',
            sources: [DATADOG_CANDIDATE_EXPERIENCE, DATADOG_DD4, DATADOG_DD11, DATADOG_DD12],
          },
          {
            stage: 'Second coding round',
            format: 'One hour on CoderPad: a harder algorithm problem or a product-focused task, with follow-up changes.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD8, DATADOG_DD10, DATADOG_DD12],
          },
          {
            stage: 'Frontend system design',
            format: 'One hour on Excalidraw with an engineer: the UI, API endpoints and performance; at an office in some loops.',
            appliesTo: DATADOG_ROLE,
            sources: [
              DATADOG_DD1,
              DATADOG_DD2,
              DATADOG_DD3,
              DATADOG_DD4,
              DATADOG_DD5,
              DATADOG_DD6,
              DATADOG_DD8,
              DATADOG_DD10,
              DATADOG_DD12,
              DATADOG_LISBON_2024,
            ],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Experience and values',
            format: 'A project deep dive and behavioural questions, sometimes split into two rounds.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD2, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD6, DATADOG_DD7, DATADOG_DD8, DATADOG_DD12],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Team match',
            format: 'Short calls with prospective teams after the interviews.',
            appliesTo: 'Candidates who pass',
            sources: [DATADOG_DD1, DATADOG_DD2, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD7],
          },
        ],
      },
    ],
    // Left out for want of a subject: screens given only by count and difficulty (DD5, DD7, DD10), "LeetCode easy:
    // arrays, double pointers, strings, node trees" (DD6), a 2023 screen of "string manipulation" and "a graph problem"
    // (DD3; possibly the pair DD4 names, which the account does not confirm), design rounds named only by what they
    // covered (DD3, DD6), a "simple coding test" (DD5) and a medium/hard problem with system design (DD10). Taro's
    // site-wide "Datadog Interview Questions" panel is tied to no account. Behavioural questions are in
    // behaviouralQuestions, open.
    questions: [
      {
        id: 'real-time-sortable-table',
        round: 'React live coding',
        kind: 'React build',
        topic: 'Sortable table of real-time data',
        question: 'Create a React page that shows a table of real-time data, which the user can sort by any column.',
        sources: [DATADOG_DD1],
        practice: { label: 'React dynamic table', path: '/react/coding/react-dynamic-table' },
        answerGuide: 'sortable-real-time-table',
      },
      {
        id: 'incremental-table-filters-sorting',
        round: 'React live coding',
        kind: 'React build',
        topic: 'Incremental table with filters and sorting',
        question:
          'Build a simple table in React, then add features such as filters and sorting one step at a time, without the full picture up front.',
        sources: [DATADOG_DD8, DATADOG_DD2],
        practice: { label: 'React filterable and searchable list', path: '/react/coding/react-filterable-user-list' },
        answerGuide: 'incremental-live-coding-on-tables',
      },
      {
        id: 'parse-data-into-existing-app',
        round: 'React live coding',
        kind: 'React build',
        topic: 'Parsing and displaying data in React',
        question:
          'Parse some data and display it in an existing React app, with the interviewer watching hooks, efficiency and readability.',
        sources: [DATADOG_DD3],
      },
      {
        id: 'html-css-react-project',
        round: 'React live coding',
        kind: 'UI build',
        topic: 'Accessible HTML and CSS in React',
        question:
          'A small project on pre-made formatting utilities, done with the interviewer\'s help: HTML and CSS basics with attention to accessibility and semantics, and React knowledge such as hooks.',
        promptNotShared: true,
        sources: [DATADOG_DD6],
      },
      {
        id: 'load-monitoring-web-app',
        round: 'Take-home project',
        kind: 'UI build',
        topic: 'Load monitoring web app',
        question:
          'A take-home: a small web app that monitors load, with time-series data in a chart and alerts. Suggested times were 4 to 6 hours, and one account also gives 6 to 8.',
        promptNotShared: true,
        sources: [DATADOG_DD4, DATADOG_DD11, DATADOG_DD12],
      },
      {
        id: 'word-repetitions-in-paragraph',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Word repetitions in a paragraph',
        question: 'Count how many times the words in a paragraph are repeated.',
        sources: [DATADOG_DD4, DATADOG_DD1],
        practice: { label: 'Find the maximum occurring character', path: '/javascript/coding/js-max-char' },
        answerGuide: 'ordering-and-filtering-under-time',
      },
      {
        id: 'sum-of-leaf-nodes',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Sum of binary tree leaf nodes',
        question: 'A depth-first search problem: sum the leaf nodes of a binary tree.',
        sources: [DATADOG_DD4],
      },
      {
        id: 'ordering-and-filtering',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Ordering and filtering data',
        question: 'A standard LeetCode-style exercise on ordering and filtering, solved on a call.',
        promptNotShared: true,
        sources: [DATADOG_DD9],
        practice: { label: 'Implement Array.prototype.filter', path: '/javascript/coding/js-array-prototype-filter' },
        answerGuide: 'ordering-and-filtering-under-time',
      },
      {
        id: 'reshape-api-json',
        round: 'Technical screen',
        kind: 'Practical coding',
        topic: 'Reshaping a JSON API response',
        question: 'Parse a JSON object from an API into a specific format. The same account\'s on-site coding round was another JSON parsing exercise.',
        sources: [DATADOG_DD11],
      },
      {
        id: 'string-pattern-matching',
        round: 'Second coding round',
        kind: 'Algorithm',
        topic: 'String pattern matching',
        question:
          'Write a function that checks whether a string matches a pattern, without regular expressions. In the 2023 loop the interviewer brought new criteria mid-session, and approaches included two pointers, dynamic programming, depth-first search and recursion.',
        sources: [DATADOG_DD4, DATADOG_DD1, DATADOG_DD12, DATADOG_DD3],
      },
      {
        id: 'multi-select-tag-matching',
        round: 'Second coding round',
        kind: 'Algorithm',
        topic: 'Matching tags in a multi-select list',
        question:
          'Match the tags a user can add in a multi-select list, unifying tags from the same group. The candidate thought an inverted index was needed and over-complicated it; plain loops would have been simpler.',
        sources: [DATADOG_DD8],
      },
      {
        id: 'live-tail-log-view',
        round: 'Frontend system design',
        kind: 'Frontend system design',
        topic: 'Live Tail view of real-time logs',
        question: 'Design the frontend architecture to filter and display real-time logs, a Live Tail view.',
        sources: [DATADOG_DD1],
        practice: { label: 'Infinite scroll list design', path: '/system-design/infinite-scroll-list' },
        answerGuide: 'live-tail-logs-architecture',
      },
      {
        id: 'real-time-event-viewer',
        round: 'Frontend system design',
        kind: 'Frontend system design',
        topic: 'Real-time event viewer architecture',
        question: 'Sketch a possible architecture for a real-time event viewer.',
        sources: [DATADOG_LISBON_2024],
        practice: { label: 'Live comments for global streams', path: '/system-design/live-comments-global-stream' },
        answerGuide: 'live-tail-logs-architecture',
      },
      {
        id: 'log-data-visualisation',
        round: 'Frontend system design',
        kind: 'Frontend system design',
        topic: 'Component for visualising log data',
        question: 'Design a UI component that visualises arbitrary log data of arbitrary size, and discuss its performance trade-offs.',
        sources: [DATADOG_DD12],
        practice: { label: 'Infinite scroll list design', path: '/system-design/infinite-scroll-list' },
      },
      {
        id: 'dashboard-multiple-widgets',
        round: 'Frontend system design',
        kind: 'Frontend system design',
        topic: 'Dashboard with multiple widgets',
        question: 'Design a dashboard that supports multiple widgets.',
        sources: [DATADOG_DD8],
        practice: { label: 'Drag-and-drop dashboard design', path: '/system-design/dashboard-widgets-draggable-resizable' },
      },
      {
        id: 'monitors-app-design',
        round: 'Frontend system design',
        kind: 'Frontend system design',
        topic: 'App for handling monitors',
        question:
          'Design an app that handles monitors. The candidate kept to the frontend design and its key endpoints and treated the backend as a black box.',
        sources: [DATADOG_DD4],
      },
      {
        id: 'data-and-tables-design',
        round: 'Frontend system design',
        kind: 'Frontend system design',
        topic: 'Data table frontend and API design',
        question: 'A design round on frontend and API design, centred on data and tables.',
        promptNotShared: true,
        sources: [DATADOG_DD2],
      },
      {
        id: 'tree-search-dfs',
        kind: 'Algorithm',
        topic: 'Finding information in a tree',
        question: 'Find information in a tree with depth-first search, in one of the account\'s two live-coding rounds.',
        promptNotShared: true,
        sources: [DATADOG_DD12],
      },
      {
        id: 'feature-or-major-bug-approach',
        kind: 'Product design',
        topic: 'Approaching a feature or major bug',
        question: 'In an on-site interview, explain how you would approach developing a feature or fixing a major bug.',
        sources: [DATADOG_DD9],
        answerGuide: 'feature-or-major-bug-walkthrough',
      },
    ],
    behaviouralQuestions: [
      {
        id: 'why-datadog',
        question: 'Why do you want to work at Datadog, and what would you want to do there?',
        sources: [DATADOG_DD1, DATADOG_DD3, DATADOG_DD12],
      },
      {
        id: 'conflict-at-work',
        question: 'Tell me about a time you had a conflict at work.',
        sources: [DATADOG_DD1],
      },
      {
        id: 'many-production-bugs',
        question: 'A project has many bugs in production: how would you approach the situation?',
        sources: [DATADOG_DD1],
      },
      {
        id: 'disagreeing-with-manager',
        question: 'How do you handle disagreeing with your manager?',
        sources: [DATADOG_DD8],
      },
      {
        id: 'tough-feedback',
        question: 'Tell me about a time you received tough feedback.',
        sources: [DATADOG_DD6],
      },
      {
        id: 'helped-your-team',
        question: 'What did you do that helped your team?',
        sources: [DATADOG_DD5],
      },
      {
        id: 'long-difficult-project',
        question: 'What was the most interesting or difficult project you worked on that took a long time to complete?',
        sources: [DATADOG_DD12],
      },
    ],
  },
  intuit: {
    summary:
      'Intuit\'s hiring page describes an interview day that starts with set-up and a craft demonstration, followed by assessor, team member and manager interviews. Frontend accounts from 2022 to 2026 add a technical phone interview before that day, and recent loops include a 30-minute AI round.',
    caveat:
      'The official page is undated and generic, and its durations differ from recent recruiter plans (a 90-minute craft round, a 60-minute technical round and 30 minutes each with an AI assessor and the manager). Among the frontend accounts, the AI round rests on two plans and one completed 2025 staff loop. One 2025 account describes team matching before the offer.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers',
        stages: [
          {
            stage: 'Recruiter or HR call',
            format: 'A short check of background.',
            appliesTo: INTUIT_ROLE,
            sources: [INTUIT_IN12, INTUIT_HR_2022, INTUIT_TARO_SWE_2022],
          },
          {
            stage: 'Technical phone interview',
            format:
              '45–75 minutes with an engineer: spoken JavaScript and React questions, an algorithm problem and, in some calls, a short coding task; 2025 calls added questions on AI.',
            appliesTo: INTUIT_ROLE,
            sources: [INTUIT_IN1, INTUIT_IN2, INTUIT_IN3, INTUIT_IN11, INTUIT_IN12, INTUIT_HR_2022, INTUIT_TARO_SWE_2022],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Craft demonstration',
            format:
              'Build a small app against a brief, at home ahead of the day or in a block of about 90 minutes at its start, then demo it to a panel of four or five, walk through the code and change it on request.',
            appliesTo: INTUIT_ROLE,
            sources: [
              INTUIT_HIRING,
              INTUIT_IN1,
              INTUIT_IN3,
              INTUIT_IN4,
              INTUIT_IN5,
              INTUIT_IN11,
              INTUIT_IN12,
              INTUIT_IN13,
              INTUIT_IN15,
              INTUIT_HR_2022,
              INTUIT_TARO_SWE_2022,
              INTUIT_BLIND_CRAFT_2022,
            ],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Assessor or technical rounds',
            format:
              'One or two rounds of 30–60 minutes with engineers or an architect: spoken questions, short JavaScript and algorithm tasks, and changes to your own craft code.',
            appliesTo: INTUIT_ROLE,
            sources: [INTUIT_HIRING, INTUIT_IN1, INTUIT_IN3, INTUIT_IN4, INTUIT_IN12, INTUIT_IN13],
          },
          {
            stage: 'AI round',
            format: '30 minutes with an AI assessor.',
            appliesTo: 'Loops from 2024 on',
            sources: [INTUIT_IN8_PLAN, INTUIT_IN9_PLAN, INTUIT_IN11],
          },
          {
            stage: 'Hiring manager',
            format: 'About 30 minutes on projects and behaviour.',
            appliesTo: INTUIT_ROLE,
            sources: [
              INTUIT_HIRING,
              INTUIT_IN1,
              INTUIT_IN4,
              INTUIT_IN5,
              INTUIT_IN11,
              INTUIT_IN12,
              INTUIT_IN13,
              INTUIT_IN15,
              INTUIT_TARO_SWE_2022,
            ],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Team matching',
            format: 'After positive feedback and before an offer.',
            appliesTo: 'One account',
            sources: [INTUIT_IN10],
          },
        ],
      },
    ],
    // Left out by content: cloud infrastructure and reverse-proxy trivia (2024 staff loop), the 2025 Python API and SQL
    // tasks, and the AI round's subjects (generative AI, RAG, fine-tuning, an AI tooling question), which no question
    // kind covers. Left out for want of a subject: "an easy LeetCode question" and "two more easy coding questions"
    // (2022), "one normal DS/algo question and a few questions on JavaScript and React" (2022), the deep dives into a
    // 2023 build (system design, business logic, tests, CSS/HTML/React), a "full stack assignment" (2023, not cited), a
    // hard algorithm problem a Blind reply claims, and "Stack question on 1st screen" (2022), which can mean a data
    // structure or the candidate's tech stack. The first row is the countries app behind the guide's first prompt.
    questions: [
      {
        id: 'countries-api-app',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'REST Countries API app',
        question:
          'Build an app that calls the REST Countries API and lists each country with its population, flag and languages, then add the features the interviewers ask for.',
        sources: [INTUIT_TARO_SWE_2022],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
        answerGuide: 'craft-demo-build-and-extend',
      },
      {
        id: 'typeahead-with-tests',
        round: 'Craft demonstration',
        kind: 'React build',
        topic: 'Typeahead component with tests',
        question:
          'Implement a typeahead component as one of the stories you pick in the prepared repository, and test it with Jest and React Testing Library.',
        sources: [INTUIT_IN1],
        practice: { label: 'React autocomplete starter', path: '/react/coding/react-autocomplete-search-starter' },
        answerGuide: 'typeahead-in-an-unfamiliar-codebase',
      },
      {
        id: 'retry-with-delay',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        topic: 'Promise retry with delay',
        question: 'Write a function that retries a promise-returning function a given number of times, waiting a set delay between attempts.',
        sources: [INTUIT_IN1],
        practice: { label: 'Retry a promise-returning function with delay', path: '/javascript/coding/js-retry-with-delay' },
        answerGuide: 'promise-retry-and-race-polyfill',
      },
      {
        id: 'promise-race-polyfill',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        topic: 'Promise.race polyfill',
        question: 'Explain how Promise.race differs from Promise.any, then implement Promise.race without the built-in.',
        sources: [INTUIT_IN1],
        practice: { label: 'Promise.any, the sibling combinator', path: '/javascript/coding/js-promise-any' },
        answerGuide: 'promise-retry-and-race-polyfill',
      },
      {
        id: 'llm-story-streaming',
        round: 'Assessor or technical rounds',
        kind: 'Practical coding',
        topic: 'Streaming LLM output',
        question:
          'Deliver a story that calls a provided LLM endpoint and streams the generated text onto the page, handling errors and testing the different outputs; the interviewer expected Server-Sent Events.',
        sources: [INTUIT_IN1],
        practice: { label: 'Chat UI with a streaming response', path: '/react/coding/react-chat-streaming-ui' },
        answerGuide: 'llm-user-story-with-streaming',
      },
      {
        id: 'output-closures-and-concepts',
        round: 'Technical phone interview',
        kind: 'JavaScript',
        topic: 'Hoisting, promise output and closures',
        question:
          'Predict the output of hoisting and promise snippets and explain closures and their uses. The same call asked about web security, React\'s memoisation hooks, Context versus Redux and accessibility.',
        sources: [INTUIT_IN1],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
        answerGuide: 'javascript-fundamentals-under-questioning',
      },
      {
        id: 'currying-function',
        round: 'Technical phone interview',
        kind: 'JavaScript',
        topic: 'Curry function',
        question: 'Write a function that curries another function, so its arguments can be passed one call at a time.',
        sources: [INTUIT_IN3],
        practice: { label: 'Curry function', path: '/javascript/coding/js-curry-function' },
        answerGuide: 'javascript-fundamentals-under-questioning',
      },
      {
        id: 'memoize-function',
        round: 'Technical phone interview',
        kind: 'JavaScript',
        topic: 'Memoize function',
        question: 'Write a function that memoizes another function, returning cached results for arguments it has seen.',
        sources: [INTUIT_IN3],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
        answerGuide: 'javascript-fundamentals-under-questioning',
      },
      {
        id: 'identical-dom-trees',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        topic: 'Identical DOM trees',
        question: 'Write a function that checks whether two DOM trees are identical, comparing them node by node.',
        sources: [INTUIT_IN1],
        practice: { label: 'Walk twin DOM trees in step', path: '/javascript/coding/js-dom-twin-node' },
        answerGuide: 'javascript-fundamentals-under-questioning',
      },
      {
        id: 'nested-comments-indexeddb',
        round: 'Craft demonstration',
        kind: 'React build',
        topic: 'Nested comments with IndexedDB',
        question:
          'Build a nested comment component that keeps its state in IndexedDB, with a test for adding a comment, as one of the stories you pick.',
        sources: [INTUIT_IN1],
        practice: { label: 'React nested comments', path: '/react/coding/react-nested-comments' },
      },
      {
        id: 'meeting-rooms-app',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'Meeting rooms app',
        question: 'Build a Meeting Rooms app from the rough design the recruiter sent a day earlier, then extend it live with new features.',
        promptNotShared: true,
        sources: [INTUIT_IN6_SDE2_2021],
        practice: { label: 'Component and state design from a mock', path: '/system-design/ui-component-state-from-mock' },
        answerGuide: 'craft-demo-build-and-extend',
      },
      {
        id: 'event-management-system',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'Event management system',
        question: 'Build an event management system over more than a week, then take the panel through slides, the code and its tests.',
        promptNotShared: true,
        sources: [INTUIT_IN3],
        practice: { label: 'Component and state design from a mock', path: '/system-design/ui-component-state-from-mock' },
        answerGuide: 'craft-demo-build-and-extend',
      },
      {
        id: 'crud-form-and-list',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'CRUD form and list',
        question:
          'Build a web app whose form adds an entry through a CRUD API and whose page shows the updated data, choosing what to build fully and what to stub within the hour.',
        sources: [INTUIT_IN15],
        answerGuide: 'craft-demo-build-and-extend',
      },
      {
        id: 'api-data-on-the-spot',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'Fetch and display API data',
        question: 'Get data from an API and display it in a front-end-only app, from a prompt given at the start of the round.',
        promptNotShared: true,
        sources: [INTUIT_BLIND_CRAFT_2022],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
        answerGuide: 'craft-demo-build-and-extend',
      },
      {
        id: 'sort-search-filter-app',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'Sort, search and filter app',
        question: 'Build a frontend application with basic sorting, search and filtering, as a take-home you finish when it suits you.',
        promptNotShared: true,
        sources: [INTUIT_IN13],
        practice: { label: 'React filterable user list', path: '/react/coding/react-filterable-user-list' },
        answerGuide: 'craft-demo-build-and-extend',
      },
      {
        id: 'transactions-app',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'Transactions app',
        question: 'Build a small transactions application as the craft task.',
        promptNotShared: true,
        sources: [INTUIT_HR_2022],
      },
      {
        id: 'chessboard-layout',
        round: 'Craft demonstration',
        kind: 'UI build',
        topic: 'Chessboard layout',
        question: 'Lay out a chessboard with HTML, CSS and JavaScript, as the small project to finish before the interview.',
        sources: [INTUIT_IN5],
        practice: { label: 'React chessboard', path: '/react/coding/react-chessboard-click-highlight' },
      },
      {
        id: 'rendering-path-and-performance',
        round: 'Craft demonstration',
        kind: 'Web fundamentals',
        topic: 'Critical rendering path and performance',
        question: 'Explain the critical rendering path, the DOM and the CSSOM, and how you would optimise a page\'s performance.',
        sources: [INTUIT_IN13],
        practice: { label: 'How the browser parses and renders HTML', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'todo-machine-coding',
        round: 'Technical phone interview',
        kind: 'UI build',
        topic: 'To-do app',
        question: 'Build a to-do app as a machine-coding task inside the phone interview.',
        promptNotShared: true,
        sources: [INTUIT_IN2],
        practice: { label: 'React to-do list', path: '/react/coding/react-todo-list' },
      },
      {
        id: 'balanced-brackets',
        round: 'Technical phone interview',
        kind: 'Algorithm',
        topic: 'Balanced brackets',
        question: 'Check whether the brackets in a string are balanced when the string also holds other characters.',
        sources: [INTUIT_IN1],
        practice: { label: 'Valid parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'connected-components',
        round: 'Technical phone interview',
        kind: 'Algorithm',
        topic: 'Connected components',
        question: 'Solve a graph problem about connected components.',
        promptNotShared: true,
        sources: [INTUIT_IN1],
      },
      {
        id: 'coin-change',
        round: 'Technical phone interview',
        kind: 'Algorithm',
        topic: 'Coin Change',
        question: 'Solve the coin change problem in the shortlisting round.',
        sources: [INTUIT_IN11],
      },
      {
        id: 'performance-security-output',
        round: 'Technical phone interview',
        kind: 'Web fundamentals',
        topic: 'Web performance, security and output snippets',
        question: 'Questions on web performance and security, and snippets whose output you predict.',
        promptNotShared: true,
        sources: [INTUIT_IN3],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'promises-and-classes',
        round: 'Technical phone interview',
        kind: 'JavaScript',
        topic: 'Promises and classes',
        question: 'Questions on JavaScript promises and classes.',
        promptNotShared: true,
        sources: [INTUIT_IN2],
      },
      {
        id: 'debounce-like-api-calls',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        topic: 'Debouncing API calls',
        question: 'In a scenario-based round with an architect, write a function that controls repeated API calls the way debounce does.',
        sources: [INTUIT_IN13],
        practice: { label: 'Debounce function', path: '/javascript/coding/js-debounce' },
      },
      {
        id: 'currency-string-helper',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        topic: 'Currency string to integer',
        question:
          'Rewrite a helper from your craft project that converts a currency string to an integer, this time without String prototype methods or other built-ins.',
        sources: [INTUIT_IN12],
      },
      {
        id: 'performance-and-react-internals',
        round: 'Assessor or technical rounds',
        kind: 'React concepts',
        topic: 'Front-end performance and React internals',
        question: 'Questions on front-end performance and React internals.',
        promptNotShared: true,
        sources: [INTUIT_IN12],
      },
      {
        id: 'three-sum-then-k-sum',
        round: 'Assessor or technical rounds',
        kind: 'Algorithm',
        topic: '3Sum and kSum',
        question: 'Solve 3Sum, then generalise the solution to kSum.',
        sources: [INTUIT_IN6_SDE2_2021],
        practice: { label: '3Sum', path: '/javascript/coding/js-three-sum' },
      },
      {
        id: 'polyfills-and-recursion',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        topic: 'Polyfills and recursion',
        question: 'JavaScript questions on polyfills and recursion in an hour-long round.',
        promptNotShared: true,
        sources: [INTUIT_IN6_SDE2_2021],
      },
      {
        id: 'microfrontends-vitals-workers',
        round: 'Hiring manager',
        kind: 'Frontend system design',
        topic: 'Microfrontends, web vitals and workers',
        question: 'Discuss microfrontends, web vitals and workers.',
        promptNotShared: true,
        sources: [INTUIT_IN1],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'force-multiplier',
        question: 'In what ways are you a force multiplier on a project?',
        sources: [INTUIT_IN12],
      },
      {
        id: 'slides-about-yourself',
        question: 'Open the panel with a few slides about yourself: some fun facts and an overview of your career accomplishments.',
        sources: [INTUIT_IN12],
      },
    ],
  },
  servicenow: {
    summary:
      'ServiceNow\'s How we hire page says interview rounds vary by position and may include a technical coding assessment or a presentation. Accounts from 2022 to 2025, two placed in Hyderabad by Taro and one in Amsterdam, describe a short screening call, two technical rounds of JavaScript, algorithm problems or design, a design or machine-coding round in some loops, and a hiring manager round.',
    caveat:
      'The table follows the accounts from India, Amsterdam or no stated place. Two Santa Clara accounts from 2023 and 2024 are not in it: a recruiter call, a HackerRank screen and three technical rounds in one, a recruiter screen and one-hour algorithm interviews in the other; their questions are in the list without a round. Most accounts met the hiring manager after the technical rounds, while a 2022 Amsterdam loop and a 2025 plan put that round first, and one 2025 account ended with a general talk with a director.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'UI and frontend engineers, 2022 to 2025',
        stages: [
          {
            stage: 'Screening call',
            format:
              'A short call with a recruiter or HR on your background, your projects and what you want next. It lasted ten minutes in a 2022 Amsterdam account.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN4, SERVICENOW_SN10],
          },
          {
            stage: 'JavaScript fundamentals',
            format:
              'JavaScript questions and one to three coding problems, an hour long in a 2023 account. That account added HTML and CSS questions, and a 2025 account named the round JavaScript and React fundamentals.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN2, SERVICENOW_SN3, SERVICENOW_SN4],
            // The closures task practises a locked row; this free polyfill has the shape of the open map row.
            practice: { label: 'Implement arrayForEach', path: '/javascript/coding/js-array-foreach' },
          },
          {
            stage: 'Second technical round',
            format:
              'A harder JavaScript round or an hour of algorithm problems, three of them in a 2023 account. A 2025 account had high- and low-level design here, on the same day as the first round, and a 2025 plan lists a 90-minute panel on algorithms and system design.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN2, SERVICENOW_SN3, SERVICENOW_SN4, SERVICENOW_SN8],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Design or machine coding',
            format:
              'A small web app to design and build in plain JavaScript, or a coding problem and a UI to build. The 2024 account offered React, Angular or plain JavaScript, HTML and CSS for the build, and its interviewer helped when the candidate was stuck.',
            appliesTo: 'Some loops',
            sources: [SERVICENOW_SN4, SERVICENOW_SN5],
            // The todo list practises a locked row, so the open link is a general list build.
            practice: { label: 'React list with loading, error and empty states', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Hiring manager',
            format:
              'The hiring manager\'s round: JavaScript questions, a coding or design task, behavioural questions, or a mix of them. It was short in a 2025 account and an hour in a 2023 one; a 2022 Amsterdam round was competency-based, on behaviour and past projects, and a 2025 plan put a 45-minute behavioural and code-along round with the hiring manager first.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN2, SERVICENOW_SN3, SERVICENOW_SN4, SERVICENOW_SN10, SERVICENOW_HM_IC2_2025, SERVICENOW_SN8],
            // Map versus Object practises a locked row, so the open link is the behavioural guide.
            practice: { label: 'Crafting STAR stories', path: '/guides/behavioral/stories' },
          },
        ],
      },
    ],
    // Left out for want of a subject: the first rounds of the 2022 Hyderabad and 2023 accounts ("all JavaScript
    // concepts" with basic coding; JavaScript, HTML and CSS with basic problem solving), the 2022 round on trees and
    // arrays, the 2022 small web app in plain JavaScript, the 2025 high-level design problem, the 2023 Santa Clara
    // "Javascript array question", the 2021 round on UI design and data flow, and Blind advice on medium string and
    // stack problems. Left out by content: the SQL join questions of the 2025 staff full-stack interview. Left out for
    // their source: LeetCode post 7711064 (a February 2026 senior loop), unreadable and known only from search summaries;
    // questions known only from Glassdoor (debounce, setTimeout and forEach by hand, flattening nested JSON, a sticky
    // navigation bar); and Taro's site-wide "ServiceNow Interview Questions" panel, which is tied to no account. The
    // staff full-stack interview (SN11) was the first technical round of its loop and mixed problems with a frontend
    // question, so its rows count under JavaScript fundamentals. Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'array-map-polyfill',
        round: 'JavaScript fundamentals',
        kind: 'JavaScript',
        topic: 'Array map polyfill',
        question: 'Write your own polyfill for the array map method, asked with other JavaScript questions in the first technical round of a 2025 loop.',
        sources: [SERVICENOW_SN1],
        practice: { label: 'Implement Array.prototype.map', path: '/javascript/coding/js-array-prototype-map' },
        answerGuide: 'polyfills-with-edge-cases',
      },
      {
        id: 'closures-promises-console-output',
        round: 'JavaScript fundamentals',
        kind: 'JavaScript',
        topic: 'Closures, promises and console output',
        question: 'Questions on closures and promises, and on what given code snippets log to the console.',
        promptNotShared: true,
        sources: [SERVICENOW_SN1],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
        answerGuide: 'closures-and-output-prediction',
      },
      {
        id: 'output-based-questions',
        round: 'JavaScript fundamentals',
        kind: 'JavaScript',
        topic: 'Output-based JavaScript questions',
        question: 'Several questions on what a piece of JavaScript code outputs, to test knowledge of the language, beside three coding problems in the same round.',
        promptNotShared: true,
        sources: [SERVICENOW_SN2],
        practice: { label: 'Predict var hoisting and function shadowing', path: '/javascript/trivia/js-var-hoisting-shadowing-output' },
        answerGuide: 'closures-and-output-prediction',
      },
      {
        id: 'anagram-check',
        round: 'JavaScript fundamentals',
        kind: 'Algorithm',
        topic: 'Anagram check',
        question: 'Check whether two given strings are anagrams of each other.',
        sources: [SERVICENOW_SN2],
        practice: { label: 'Valid Anagram', path: '/javascript/coding/js-valid-anagram' },
      },
      {
        id: 'next-greater-element',
        round: 'JavaScript fundamentals',
        kind: 'Algorithm',
        topic: 'Next greater element',
        question: 'For every index of an array, find the next greater element to its right.',
        sources: [SERVICENOW_SN2],
      },
      {
        id: 'first-missing-positive',
        round: 'JavaScript fundamentals',
        kind: 'Algorithm',
        topic: 'First missing positive',
        question: 'Find the first missing positive number in an array, using constant extra space.',
        sources: [SERVICENOW_SN2],
      },
      {
        id: 'topological-sort-problem',
        kind: 'Algorithm',
        topic: 'Topological sort',
        question: 'A problem solved with a topological sort; the candidate began with a wrong approach and corrected it.',
        promptNotShared: true,
        sources: [SERVICENOW_SN11],
      },
      {
        id: 'drag-and-drop-events',
        kind: 'Web fundamentals',
        topic: 'Drag and drop events',
        question: 'A frontend question on drag and drop events in the same hour; the candidate felt their own approach was too complicated.',
        promptNotShared: true,
        sources: [SERVICENOW_SN11],
      },
      {
        id: 'semantic-version-validation',
        round: 'JavaScript fundamentals',
        kind: 'Practical coding',
        topic: 'Semantic version validation',
        question: 'Implement validation of semantic version strings; with time running out, the candidate could only show the approach.',
        sources: [SERVICENOW_SN11],
      },
      {
        id: 'closure-counters-in-loops',
        round: 'Second technical round',
        kind: 'JavaScript',
        topic: 'Closure counters in loops',
        question: 'Back on closures at a harder level, write functions that increment and decrement variables inside loops.',
        sources: [SERVICENOW_SN1],
        practice: { label: 'Create a counter function', path: '/javascript/coding/js-create-counter' },
        answerGuide: 'closures-and-output-prediction',
      },
      {
        id: 'built-in-method-polyfills',
        round: 'Second technical round',
        kind: 'JavaScript',
        topic: 'Built-in method polyfills',
        question: 'Implement your own versions of built-in methods; the 2025 account says the round looked at edge cases and production-ready code, and an engineer now at ServiceNow recalls implementing prototype methods in their own interviews.',
        promptNotShared: true,
        sources: [SERVICENOW_SN1, SERVICENOW_BLIND_STAFF_2021],
        practice: { label: 'Implement Function.prototype.bind', path: '/javascript/coding/js-implement-bind' },
        answerGuide: 'polyfills-with-edge-cases',
      },
      {
        id: 'string-compression',
        round: 'Second technical round',
        kind: 'Algorithm',
        topic: 'String compression',
        question: 'Solve a string compression problem and design its implementation.',
        sources: [SERVICENOW_SN2],
      },
      {
        id: 'three-value-sort',
        round: 'Second technical round',
        kind: 'Algorithm',
        topic: 'Sorting an array of three values',
        question: 'Sort an array that holds only 0s, 1s and 2s.',
        sources: [SERVICENOW_SN3],
      },
      {
        id: 'binary-matrix-path',
        round: 'Second technical round',
        kind: 'Algorithm',
        topic: 'Path through a binary matrix',
        question: 'Given a matrix of 0s and 1s and a starting point, say whether the end can be reached from that point.',
        sources: [SERVICENOW_SN3],
        practice: { label: 'Maze traversal in a grid', path: '/javascript/coding/js-maze-path' },
      },
      {
        id: 'longest-substring-without-repeats',
        round: 'Second technical round',
        kind: 'Algorithm',
        topic: 'Longest substring without repeats',
        question: 'Find the longest substring without repeating characters.',
        sources: [SERVICENOW_SN3],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
      },
      {
        id: 'string-character-sort',
        round: 'Design or machine coding',
        kind: 'Algorithm',
        topic: 'Sorting the characters of a string',
        question: 'Sort the characters of a string in O(n) time, so that dbcabb becomes abbbcd, in the language of your choice.',
        sources: [SERVICENOW_SN5],
      },
      {
        id: 'search-and-filter-screen',
        round: 'Design or machine coding',
        kind: 'UI build',
        topic: 'Search and filter screen',
        question: 'Build a search feature: all the data in a list on the left, the filtered data on the right, and a search bar with a Search button at the top that filters when clicked.',
        sources: [SERVICENOW_SN5],
        practice: { label: 'Filterable, searchable user list', path: '/react/coding/react-filterable-user-list' },
      },
      {
        id: 'map-versus-object',
        round: 'Hiring manager',
        kind: 'JavaScript',
        topic: 'Map versus Object',
        question: 'How does a Map differ from a plain object? The 2025 account adds how Map works internally and why you would pick it over an object in a real application.',
        sources: [SERVICENOW_SN1, SERVICENOW_SN3],
        practice: { label: 'Map versus plain object', path: '/javascript/trivia/js-map-vs-object' },
        answerGuide: 'fundamentals-over-frameworks',
      },
      {
        id: 'spread-versus-object-assign',
        round: 'Hiring manager',
        kind: 'JavaScript',
        topic: 'Spread versus Object.assign',
        question: 'How does the spread operator differ from Object.assign?',
        sources: [SERVICENOW_SN3],
        practice: { label: 'Shallow copy versus deep copy', path: '/javascript/trivia/js-shallow-vs-deep-copy' },
      },
      {
        id: 'equal-sum-array-split',
        round: 'Hiring manager',
        kind: 'Algorithm',
        topic: 'Splitting an array into equal sums',
        question: 'Divide an array so that its left and right parts have equal sums.',
        sources: [SERVICENOW_SN3],
      },
      {
        id: 'voting-poll',
        round: 'Hiring manager',
        kind: 'UI build',
        topic: 'Voting poll',
        question: 'Build a voting poll whose results show as percentages in charts. The candidate finished the voting logic, lost time to an error and showed the results as numbers instead.',
        sources: [SERVICENOW_SN2],
      },
      {
        id: 'sample-json-transformation',
        round: 'Hiring manager',
        kind: 'JavaScript',
        topic: 'Transforming sample JSON data',
        question: 'Given sample JSON data, write JavaScript that produces a desired output.',
        promptNotShared: true,
        sources: [SERVICENOW_SN4],
        practice: { label: 'map, filter and reduce', path: '/javascript/trivia/js-map-filter-reduce' },
      },
      {
        id: 'deep-flatten-group-by-type',
        round: 'Hiring manager',
        kind: 'JavaScript',
        topic: 'Deep flatten and group by type',
        question: 'Deep-flatten an array of mixed values, from numbers and strings to null, functions, symbols and objects, group them by typeof and, as the follow-up, count each value within its type. Further questions asked why typeof null is \'object\', how to turn symbols into keys safely and how to keep raw values instead of string keys.',
        sources: [SERVICENOW_HM_IC2_2025],
        practice: { label: 'Flatten with depth', path: '/javascript/coding/js-flatten-depth' },
      },
      {
        id: 'virtual-dom',
        kind: 'JavaScript',
        topic: 'Virtual DOM implementation',
        question: 'Implement a virtual DOM, which an engineer now at ServiceNow recalls from their own interviews.',
        promptNotShared: true,
        sources: [SERVICENOW_BLIND_STAFF_2021],
        practice: { label: 'Build a DOM renderer from a nested object', path: '/javascript/coding/js-dom-renderer' },
        answerGuide: 'tiny-virtual-dom-renderer',
      },
      {
        id: 'todo-app',
        kind: 'UI build',
        topic: 'Todo app',
        question: 'Build a todo app; the account lists it among four items for the whole loop.',
        promptNotShared: true,
        sources: [SERVICENOW_SN6],
        practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
      },
      {
        id: 'deepest-leaves-sum',
        kind: 'Algorithm',
        topic: 'Sum of the deepest leaves',
        question: 'Return the sum of the deepest leaf nodes of a tree.',
        sources: [SERVICENOW_SN6],
      },
      {
        id: 'merge-two-sorted-arrays',
        kind: 'Algorithm',
        topic: 'Merging two sorted arrays',
        question: 'Merge two sorted arrays, the problem of the final one-hour interview.',
        sources: [SERVICENOW_SN7],
        practice: { label: 'Merge two sorted arrays', path: '/javascript/coding/js-merge-sorted-arrays' },
      },
      {
        id: 'first-non-repeating-character',
        kind: 'Algorithm',
        topic: 'First non-repeating character',
        question: 'Find the first character in a string that does not repeat.',
        sources: [SERVICENOW_SN7],
      },
      {
        id: 'second-largest-value',
        kind: 'Algorithm',
        topic: 'Second largest value',
        question: 'Find the second largest value in an array of integers.',
        sources: [SERVICENOW_SN7],
      },
      {
        id: 'merge-two-linked-lists',
        kind: 'Algorithm',
        topic: 'Merging linked lists in order',
        question: 'Merge two linked lists into one list in ascending order.',
        sources: [SERVICENOW_SN7],
      },
    ],
    // Left out as screening talk: background, projects and what you want next (the 2025 screening call), and the 2025
    // director's questions on yourself, your projects and the technologies you like at your current company.
    behaviouralQuestions: [
      {
        id: 'why-servicenow',
        question: 'Why do you want to join ServiceNow, and why do you want to leave your current company?',
        sources: [SERVICENOW_SN3],
      },
    ],
  },
  revolut: {
    summary:
      'The Revolut engineering careers page lists four steps, an intro call with an IT recruiter, tech interviews, team fit and offer, without formats or durations; the Bar Raiser stage appears in the careers video, not in that list. The frontend reviews, dated 2022 to 2025, fill in the shape: a recruiter or HR call, a HackerRank test with three algorithm tasks, about an hour of live coding in TypeScript and React, a design round for mid and senior roles, a team fit conversation and a Bar Raiser interview.',
    caveat:
      'Almost every account is an anonymous interview review re-posted on Taro, which gives each review its own city and date, so no place is shown and months are approximate. The only account with an offer (2022) had neither a separate design round nor a Bar Raiser, and the order of the HackerRank test and the recruiter call varies. The question list adds a review dated 2020.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers in European hubs',
        stages: [
          {
            stage: 'Recruiter or HR screen',
            format: 'A call on your background, salary and the next steps; some recruiters add a short check of JavaScript or React theory.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_ENGINEERING, REVOLUT_RV1, REVOLUT_RV2, REVOLUT_RV3, REVOLUT_RV5, REVOLUT_RV7, REVOLUT_RV12, REVOLUT_FE_HR_2025],
          },
          {
            stage: 'HackerRank assessment',
            format: 'Three algorithm tasks in 85–110 minutes, done at home before a deadline; sometimes before the recruiter call.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_RV4, REVOLUT_RV5, REVOLUT_RV6, REVOLUT_RV7, REVOLUT_RV9, REVOLUT_RV10, REVOLUT_RV11, REVOLUT_RV12, REVOLUT_RV13],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
            rehearsal: { label: 'Revolut HackerRank assessment, 3 problems in 85 minutes', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Live coding',
            format: 'About an hour of TypeScript and React with an interviewer, from a prepared boilerplate or in CodeSandbox.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_RV1, REVOLUT_RV2, REVOLUT_RV3, REVOLUT_RV4, REVOLUT_RV5, REVOLUT_RV6, REVOLUT_RV7, REVOLUT_RV8],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'System design',
            format: 'A design round on a whiteboard, Excalidraw in a 2024 loop; a 2023 recruiter said it decides between mid and senior.',
            appliesTo: 'Mid and senior roles',
            sources: [REVOLUT_RV2, REVOLUT_RV4, REVOLUT_RV7],
            practice: { label: 'Resilient checkout and payment flow', path: '/system-design/resilient-checkout-payment-flow' },
          },
          {
            stage: 'Team fit',
            format: 'A behavioural conversation about past experience.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_RV2, REVOLUT_RV9],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Bar Raiser',
            format: 'An interview on how you work and make decisions; listed in recent plans, and no frontend review describes sitting it.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_BAR_RAISER, REVOLUT_RV1, REVOLUT_RV15_PLAN],
            // The guide's own Bar Raiser section, so the team-fit round keeps the behavioural guide in the plan.
            practice: { label: 'What the Bar Raiser covers', path: '/companies/revolut/preview', fragment: 'revolut-round-bar-raiser' },
          },
        ],
      },
    ],
    // Left out for want of a subject: HackerRank tasks given only by count or difficulty (RV4, RV5, RV6, RV9, RV11),
    // "TypeScript questions" and "algo questions" (RV11), "React and state management" and a "STAR-based question"
    // (RV9), "React questions" (RV2, RV8), "common JavaScript questions" (RV8), "some JavaScript questions" at a screen
    // (RV3), a design interview on "part of the system" (RV7) and a 2020 home test, a React widget built to 98% code
    // coverage (FE_2020). The Blind thread's replies (2022) give topics to study, not questions asked, and its bar
    // raiser reply does not name the company. Taro's site-wide "Revolut Interview Questions" panel is tied to no review.
    // The card delivery design keeps its frontend and API; the database and services the account adds are left out.
    // Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'typescript-fetch-and-render',
        round: 'Live coding',
        kind: 'Practical coding',
        topic: 'Fetching and rendering data in TypeScript',
        question:
          'In an hour, on a prepared TypeScript boilerplate, fetch data from a source and render it: a loading state, the data held in state, fetching with error handling and types throughout, with an optimisation or unit tests if time allows.',
        sources: [REVOLUT_RV1],
        practice: { label: 'Fetch and render a list with loading, error and empty states', path: '/react/coding/react-fetch-list-states' },
        answerGuide: 'fetch-and-render-in-one-hour',
      },
      {
        id: 'authenticated-api-in-react',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Authenticated API data in React',
        question: 'In a pairing session, use a service API that needs authentication to display its data in a React component.',
        sources: [REVOLUT_RV2],
        practice: { label: 'Fetch JSON with timeout and abort', path: '/javascript/coding/js-fetch-json-timeout' },
        answerGuide: 'authenticated-api-pairing',
      },
      {
        id: 'mock-api-pagination-filtering',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Paginated, filterable API data in React',
        question:
          'In an hour of live coding in CodeSandbox, get the data from a mock API with fetch or Axios, show it in React, then add pagination and filtering.',
        sources: [REVOLUT_RV6],
        practice: { label: 'React paginated data table', path: '/react/coding/react-pagination-table' },
      },
      {
        id: 'api-calls-mapping-and-tests',
        round: 'Live coding',
        kind: 'Practical coding',
        topic: 'API data mapping and unit tests',
        question: 'A live-coding round on calling an API, mapping the data and rendering it, handling errors and writing unit tests.',
        promptNotShared: true,
        sources: [REVOLUT_RV4],
        answerGuide: 'fetch-and-render-in-one-hour',
      },
      {
        id: 'improve-existing-react-app',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Improving an existing React app',
        question: 'After some React questions, a small coding task: improve an existing React app.',
        promptNotShared: true,
        sources: [REVOLUT_RV8],
      },
      {
        id: 'small-react-app',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Small React app',
        question: 'Code a small React app online, with little time for it.',
        promptNotShared: true,
        sources: [REVOLUT_RV5],
      },
      {
        id: 'react-components-and-javascript-questions',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Building a few React components',
        question: 'Implement a few components in React, then answer three JavaScript questions.',
        promptNotShared: true,
        sources: [REVOLUT_RV7],
      },
      {
        id: 'react-real-scenario-pairing',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Real-scenario React pairing task',
        question: 'A React question set as a real scenario and worked through as pair programming.',
        promptNotShared: true,
        sources: [REVOLUT_RV3],
      },
      {
        id: 'react-reconciliation',
        round: 'Recruiter or HR screen',
        kind: 'React concepts',
        topic: 'React reconciliation',
        question: 'Explain the reconciliation process in React.',
        sources: [REVOLUT_RV1, REVOLUT_RV3],
        practice: { label: 'Reconciliation, keys and element type', path: '/react/trivia/react-diffing-algorithm' },
        answerGuide: 'recruiter-theory-check',
      },
      {
        id: 'microtasks-vs-macrotasks',
        round: 'Recruiter or HR screen',
        kind: 'JavaScript',
        topic: 'Microtasks vs macrotasks',
        question: 'Explain briefly how microtasks and macrotasks work in the event loop.',
        sources: [REVOLUT_RV1],
        practice: { label: 'Microtasks vs macrotasks', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
        answerGuide: 'recruiter-theory-check',
      },
      {
        id: 'dom-tree',
        round: 'Recruiter or HR screen',
        kind: 'Web fundamentals',
        topic: 'The DOM tree',
        question: 'What is the DOM tree?',
        sources: [REVOLUT_RV1],
        practice: { label: 'DOM tree structure and depth', path: '/html/trivia/html-dom-tree-structure' },
        answerGuide: 'recruiter-theory-check',
      },
      {
        id: 'sliding-window-problem',
        round: 'HackerRank assessment',
        kind: 'Algorithm',
        topic: 'Sliding-window problem',
        question: 'A standard sliding-window problem in a HackerRank JavaScript test.',
        promptNotShared: true,
        sources: [REVOLUT_RV10],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
        answerGuide: 'hackerrank-screen-three-tasks',
      },
      {
        id: 'remove-anagrams-of-earlier-strings',
        round: 'HackerRank assessment',
        kind: 'Algorithm',
        topic: 'Anagrams in an array of strings',
        question:
          'Given an array of strings, find the anagrams and remove each string that is an anagram of an earlier one. One account rates it the easy task of the three.',
        sources: [REVOLUT_RV12, REVOLUT_RV13],
        practice: { label: 'Valid Anagram', path: '/javascript/coding/js-valid-anagram' },
      },
      {
        id: 'keypad-code-steps',
        round: 'HackerRank assessment',
        kind: 'Algorithm',
        topic: 'Distance on a number keypad',
        question: 'On a 3x3 keypad of the digits 1 to 9, count the steps needed to enter a code from the distances between the keys.',
        sources: [REVOLUT_RV12, REVOLUT_RV13],
      },
      {
        id: 'matrix-bucket-fills',
        round: 'HackerRank assessment',
        kind: 'Algorithm',
        topic: 'Bucket fills to paint a matrix',
        question:
          'Each cell of a matrix holds a colour, and a bucket fill paints only adjacent cells: count the fills needed to paint the whole matrix. One account rates it the difficult task of the three.',
        sources: [REVOLUT_RV12, REVOLUT_RV13],
      },
      {
        id: 'graph-search-dfs',
        round: 'HackerRank assessment',
        kind: 'Algorithm',
        topic: 'Graph search with depth-first search',
        question: 'The hardest of three screening problems, which needed a graph-search algorithm, depth-first search.',
        promptNotShared: true,
        sources: [REVOLUT_RV8],
      },
      {
        id: 'product-features-and-apis',
        round: 'System design',
        kind: 'Frontend system design',
        topic: 'Product features and their APIs',
        question: 'Suggest product features, then design the APIs through which the frontend talks to other services.',
        sources: [REVOLUT_RV2],
        answerGuide: 'frontend-system-design-api-contracts',
      },
      {
        id: 'card-delivery-system',
        round: 'System design',
        kind: 'Frontend system design',
        topic: 'Physical card delivery system',
        question: 'Design Revolut\'s physical card delivery system, from its API to its frontend.',
        sources: [REVOLUT_RV4],
        answerGuide: 'frontend-system-design-api-contracts',
      },
      {
        id: 'javascript-event-loop',
        kind: 'JavaScript',
        topic: 'How the JavaScript event loop works',
        question: 'Describe how the event loop works in JavaScript.',
        sources: [REVOLUT_RV7, REVOLUT_RV2],
        practice: { label: 'JavaScript event loop visualiser', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'javascript-main-thread',
        kind: 'JavaScript',
        topic: 'The JavaScript main thread',
        question: 'Explain the main thread in JavaScript.',
        sources: [REVOLUT_RV3],
      },
      {
        id: 'how-react-works',
        kind: 'React concepts',
        topic: 'How React works',
        question: 'Tell me how React works.',
        sources: [REVOLUT_FE_2024],
      },
      {
        id: 'mutating-javascript-methods',
        kind: 'JavaScript',
        topic: 'Mutating JavaScript methods',
        question: 'Which JavaScript methods mutate the value they are called on?',
        sources: [REVOLUT_FE_2020],
        practice: { label: 'References, mutation and Object.freeze', path: '/javascript/trivia/js-mutability-vs-immutability' },
      },
    ],
    behaviouralQuestions: [
      {
        id: 'most-challenging-situation',
        question: 'What was the most challenging situation or task in your work, technically, and how did you handle it?',
        sources: [REVOLUT_FE_HR_2025, REVOLUT_RV8],
      },
      {
        id: 'proudest-project',
        question: 'Which project are you most proud of?',
        sources: [REVOLUT_FE_HR_2025],
      },
      {
        id: 'working-in-a-team',
        question: 'Questions on how you work in a team; the account does not give their wording.',
        sources: [REVOLUT_RV2],
      },
    ],
  },
  spotify: {
    summary:
      'Spotify\'s hiring pages describe a recruiter call by video or phone, a second interview with one or two team members and a final round with several, one interviewer leading and the others shadowing. Accounts from 2018 to 2025, most from web and full-stack engineers, describe a screen of JavaScript and CSS questions with a coding task, then a final of about four interviews, in most accounts a plain HTML, CSS and JavaScript round, algorithms, system design and values.',
    caveat:
      'Web engineer accounts stop in 2023, most accounts are anonymous interview reviews re-posted on Taro, many dated to the first of a month, and the 2026 source is a full-stack candidate\'s Blind post written before the final. A 2022 senior full-stack loop and a 2025 software engineer loop had a case study on a production problem and no web round in the final, and one hired candidate had no debugging round.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Web and full-stack engineers',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'A video or phone call with a recruiter, 5 to 30 minutes in the accounts, on your background and why Spotify. One 2022 recruiter also asked why the candidate was looking, what a typical week looked like and which stack they used.',
            appliesTo: SPOTIFY_ROLE,
            sources: [
              SPOTIFY_JOURNEY,
              SPOTIFY_SP1,
              SPOTIFY_SP4,
              SPOTIFY_SP5,
              SPOTIFY_SP8,
              SPOTIFY_SP9,
              SPOTIFY_STOCKHOLM_FS_2018,
              SPOTIFY_NY_2018,
              SPOTIFY_LONDON_FS_JUN_2022,
              SPOTIFY_US_SWE_2025,
            ],
          },
          {
            stage: 'Technical screen',
            format:
              '60 to 90 minutes with one or two engineers by video or phone, on CoderPad in a 2022 account. About half the accounts describe JavaScript and CSS questions with a coding task, an easy algorithm problem or a small HTML and CSS build; others had an algorithm problem or JavaScript questions alone.',
            appliesTo: SPOTIFY_ROLE,
            sources: [
              SPOTIFY_JOURNEY,
              SPOTIFY_SP2,
              SPOTIFY_SP4,
              SPOTIFY_SP5,
              SPOTIFY_SP6,
              SPOTIFY_SP8,
              SPOTIFY_SP9,
              SPOTIFY_STOCKHOLM_JS_2018,
              SPOTIFY_STOCKHOLM_FS_2018,
              SPOTIFY_NY_2019,
              SPOTIFY_NL_2019,
              SPOTIFY_US_UI_2020,
              SPOTIFY_NY_FS_2020,
              SPOTIFY_LONDON_FS_2020,
              SPOTIFY_NIGERIA_FS_2021,
              SPOTIFY_AMSTERDAM_FS_2022,
              SPOTIFY_NY_FS_2022,
              SPOTIFY_US_SWE_2025,
              SPOTIFY_LONDON_SWE_2025,
            ],
            // The event-loop tasks practise locked rows of this round, so the open link is the broad fundamentals quiz.
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Final: web practical',
            format:
              'An hour in plain HTML, CSS and JavaScript: a small feature or app to build, or web domain questions. In 2022 one build was a form that fetches from an API, and that candidate needed no CSS at all.',
            appliesTo: SPOTIFY_ROLE,
            sources: [
              SPOTIFY_SP1_DESIGN,
              SPOTIFY_SP1,
              SPOTIFY_SP3,
              SPOTIFY_SP4,
              SPOTIFY_SP5,
              SPOTIFY_SP7,
              SPOTIFY_SP9,
              SPOTIFY_BERLIN_FS_2022,
              SPOTIFY_NY_FS_2022,
              SPOTIFY_FS_2026,
            ],
            practice: { label: 'Forms: validation and required fields', path: '/html/coding/html-forms-validation-required' },
          },
          {
            stage: 'Final: algorithms',
            format:
              'An hour on one or two coding problems, very basic to LeetCode medium in most accounts and hard in one 2025 loop. One 2022 final set a practical problem rather than a LeetCode-style one.',
            appliesTo: SPOTIFY_ROLE,
            sources: [
              SPOTIFY_SP1_DESIGN,
              SPOTIFY_SP3,
              SPOTIFY_SP4,
              SPOTIFY_SP5,
              SPOTIFY_SP6,
              SPOTIFY_SP9,
              SPOTIFY_STOCKHOLM_JS_2018,
              SPOTIFY_STOCKHOLM_FS_2018,
              SPOTIFY_GERMANY_FS_2022,
              SPOTIFY_BERLIN_FS_2022,
              SPOTIFY_LONDON_SWE_2025,
            ],
            practice: { label: 'Data structures and algorithms for frontend loops', path: '/guides/interview-blueprint/dsa-for-fe' },
          },
          {
            stage: 'Final: system design',
            format:
              'An hour designing a product end to end, backend included. A 2022 web engineer covered requirements, CAP trade-offs, the database, how the layers interact, load balancing, queues and caches, and in two 2022 full-stack loops the product was a Spotify feature.',
            appliesTo: SPOTIFY_ROLE,
            sources: [
              SPOTIFY_SP1_DESIGN,
              SPOTIFY_SP4,
              SPOTIFY_SP5,
              SPOTIFY_SP6,
              SPOTIFY_SP9,
              SPOTIFY_STOCKHOLM_JS_2018,
              SPOTIFY_STOCKHOLM_FS_2018,
              SPOTIFY_GERMANY_FS_2022,
              SPOTIFY_BERLIN_FS_2022,
              SPOTIFY_ITALY_FS_2022,
              SPOTIFY_LONDON_SWE_2025,
            ],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Final: values',
            format:
              'Values and behavioural questions, an hour with the hiring manager in a 2022 account and 30 minutes in a 2021 one. Spotify\'s pages name values alignment, ownership, adaptability, collaboration and drive.',
            appliesTo: SPOTIFY_ROLE,
            sources: [
              SPOTIFY_FAQ,
              SPOTIFY_SP1,
              SPOTIFY_SP4,
              SPOTIFY_SP5,
              SPOTIFY_SP6,
              SPOTIFY_SP9,
              SPOTIFY_STOCKHOLM_JS_2018,
              SPOTIFY_STOCKHOLM_FE_2021,
              SPOTIFY_GERMANY_FS_2022,
              SPOTIFY_BERLIN_FS_2022,
              SPOTIFY_LONDON_SWE_2025,
            ],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
    // Left out for want of a subject: builds named only by their form ("build a feature with JS/HTML/CSS", 2022; an app
    // in vanilla JS, HTML and CSS, 2023; a "web code specific round", 2023), coding problems given only by level or
    // category (a 2022 easy problem "based on Maps", LeetCode medium in 2022 finals, a 2023 collaboration exercise, two
    // basic Java problems in 2022, 2025 string, hashmap, graph and tree problems), a 2019 online code challenge and a
    // 2022 coding challenge, a data structure class in Python and string and API questions from 2023 intern loops, and
    // the 2018 intern's 90 minutes of CSS and JavaScript questions. Left out by content: a chat app that scales (2022
    // full-stack system design), the network-bug and production-troubleshooting case studies (2022, 2025), password
    // storage and deployment in the 2018 infrastructure interview, and a 2025 recommendation system design. Left out as
    // history: loops from 2011 to 2017. Left out for its source: anything known only from Glassdoor. The image carousel a
    // 2022 candidate gave as an example of their own was never a reported task. Behavioural questions are in
    // behaviouralQuestions, open.
    questions: [
      {
        id: 'form-fetch-and-render',
        round: 'Final: web practical',
        kind: 'UI build',
        topic: 'Form that fetches and renders results',
        question:
          'Build a form in plain HTML and JavaScript, fetch data from the Spotify API based on what the user enters, and render the result in the DOM. Two other 2022 accounts name the same parts: using fetch with the Spotify API, and a form in plain HTML and JavaScript.',
        sources: [SPOTIFY_SP1_DESIGN, SPOTIFY_SP4, SPOTIFY_ITALY_FS_2022],
        practice: { label: 'Take latest: abort previous requests', path: '/javascript/coding/js-take-latest' },
        answerGuide: 'search-form-fetch-render-dom',
      },
      {
        id: 'button-click-on-a-website',
        round: 'Recruiter call',
        kind: 'Web fundamentals',
        topic: 'Clicking a button on a website',
        question: 'What happens when you click a button on a website? The recruiter asked it as a basic question in a phone interview.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018],
      },
      {
        id: 'console-output-order',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Event loop output order',
        question:
          'Say in which order a snippet prints numbers logged directly, from setTimeout, inside a promise, in chained then calls and from a setTimeout inside a promise. One 2019 candidate expected the mix to change once their review was posted.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018, SPOTIFY_NY_2019, SPOTIFY_NL_2019, SPOTIFY_SP4],
        practice: { label: 'Predict the output of a nested microtask', path: '/javascript/trivia/js-event-loop-nested-microtask-output' },
        answerGuide: 'event-loop-output-order',
      },
      {
        id: 'closure-limit-calls',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Limiting calls with a closure',
        question:
          'Use a closure to limit how many times a function can be called: wrap a function that prints 1 with a limit of two, and three calls print 1, 1 and null.',
        sources: [SPOTIFY_NY_2019],
        practice: { label: 'Once', path: '/javascript/coding/js-once' },
        answerGuide: 'closure-call-limit',
      },
      {
        id: 'bind-result',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Result of a bind call',
        question: 'Say what a snippet that uses bind returns; in one 2019 screen, bind received several arguments with null as the first.',
        sources: [SPOTIFY_NY_2019, SPOTIFY_NL_2019],
        practice: { label: 'call, apply and bind', path: '/javascript/trivia/js-call-apply-bind' },
      },
      {
        id: 'css-box-model',
        round: 'Technical screen',
        kind: 'Web fundamentals',
        topic: 'The CSS box model',
        question: 'What is the box model, what are its gotchas, and when is each part of it used?',
        sources: [SPOTIFY_NY_2019, SPOTIFY_NL_2019],
        practice: { label: 'The box model and box-sizing', path: '/css/trivia/css-box-model' },
      },
      {
        id: 'css-specificity',
        round: 'Technical screen',
        kind: 'Web fundamentals',
        topic: 'CSS specificity',
        question: 'What is CSS specificity? One screen asked it as the priority of CSS selectors.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018, SPOTIFY_NL_2019, SPOTIFY_SP4],
        practice: { label: 'Cascade, specificity and !important', path: '/css/trivia/css-cascade-order' },
      },
      {
        id: 'flexbox',
        round: 'Technical screen',
        kind: 'Web fundamentals',
        topic: 'Flexbox',
        question:
          'Questions on Flexbox, in a 2018 screen with two developers and in a 2020 loop whose phone round had a simple CSS or JavaScript question; neither account gives the wording.',
        promptNotShared: true,
        sources: [SPOTIFY_STOCKHOLM_JS_2018, SPOTIFY_US_UI_2020],
        practice: { label: 'What display: flex does', path: '/css/trivia/css-display-flex' },
      },
      {
        id: 'event-loop',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'The event loop',
        question: 'What is the event loop? A 2022 screen asked about promises and the event loop.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018, SPOTIFY_AMSTERDAM_FS_2022],
        practice: { label: 'Microtasks and macrotasks', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
      },
      {
        id: 'balanced-brackets',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Balanced brackets in a string',
        question:
          'Write a function that checks whether the brackets and parentheses in a string are balanced and correctly nested, for input such as (1+1)[{}[))].',
        sources: [SPOTIFY_STOCKHOLM_JS_2018, SPOTIFY_STOCKHOLM_FS_2018, SPOTIFY_LONDON_FS_2020],
        practice: { label: 'Valid parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'buttons-from-mockup',
        round: 'Technical screen',
        kind: 'UI build',
        topic: 'Buttons from a mockup',
        question:
          'Recreate a mockup of two buttons in HTML and CSS; in a 2019 version the image came with notes on the buttons, and the interviewer asked about the code afterwards.',
        sources: [SPOTIFY_NL_2019, SPOTIFY_LONDON_FS_2020, SPOTIFY_SP8],
      },
      {
        id: 'global-and-local-scope',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Global and local scope',
        question: 'Define global and local scope in JavaScript.',
        sources: [SPOTIFY_NY_FS_2020],
        practice: { label: 'Block scope or function scope', path: '/javascript/trivia/js-block-scoped-or-function-scoped' },
      },
      {
        id: 'hoisting',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Hoisting',
        question: 'What is hoisting?',
        sources: [SPOTIFY_NY_FS_2020],
        practice: { label: 'Hoisting and the TDZ', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'closures',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Closures',
        question: 'Explain closures in JavaScript.',
        sources: [SPOTIFY_NY_FS_2020],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'execution-context',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Execution context',
        question: 'Questions on execution context in JavaScript, in a 2021 online coding interview; the account does not give their wording.',
        promptNotShared: true,
        sources: [SPOTIFY_NIGERIA_FS_2021],
      },
      {
        id: 'two-stage-promises',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Promise coding problem',
        question:
          'A coding problem involving promises in two stages, the harder of two problems in a 2025 screen with two engineers; the account does not give the task.',
        promptNotShared: true,
        sources: [SPOTIFY_US_SWE_2025],
      },
      {
        id: 'traffic-light',
        round: 'Final: web practical',
        kind: 'UI build',
        topic: 'Traffic light',
        question:
          'Build a traffic light in plain HTML, CSS and JavaScript that runs through its lights; one 2022 version also asked for blinking and animations.',
        sources: [SPOTIFY_BERLIN_FS_2022, SPOTIFY_NY_FS_2022, SPOTIFY_SP9],
        answerGuide: 'traffic-light-html-css-js',
      },
      {
        id: 'event-listeners-and-delegation',
        round: 'Final: web practical',
        kind: 'Web fundamentals',
        topic: 'Event listeners and delegation',
        question:
          'In the HTML and CSS interview of a final round, the task involved closures, event listeners and event delegation and was not about search queries; the account gives no more.',
        promptNotShared: true,
        sources: [SPOTIFY_SP5],
        practice: { label: 'Bubbling, capturing and event delegation', path: '/javascript/trivia/js-event-delegation' },
      },
      {
        id: 'closures-and-memoization',
        round: 'Final: algorithms',
        kind: 'JavaScript',
        topic: 'Closures and memoization',
        question:
          'A practical problem involving closures and memoization, given in the algorithms interview instead of a LeetCode-style question; the account gives no more.',
        promptNotShared: true,
        sources: [SPOTIFY_SP5],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
      },
      {
        id: 'number-to-english-words',
        round: 'Final: algorithms',
        kind: 'Algorithm',
        topic: 'Number to English words',
        question: 'Turn a number into English words, so that 123 becomes one hundred and twenty-three, building on code the interviewers supplied.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018],
      },
      {
        id: 'text-nodes-from-nested-html',
        round: 'Final: algorithms',
        kind: 'JavaScript',
        topic: 'Text nodes from nested HTML',
        question: 'Given two HTML files with different levels of nesting, write a function that extracts only the text nodes.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018],
        practice: { label: 'DOM tree walk: collect text nodes', path: '/javascript/coding/js-dom-walk-text-content-1' },
      },
      {
        id: 'median-of-a-data-stream',
        round: 'Final: algorithms',
        kind: 'Algorithm',
        topic: 'Median of a data stream',
        question:
          'A hard problem that the candidate likens to LeetCode 295, the running median of a stream of numbers; the account gives no more.',
        promptNotShared: true,
        sources: [SPOTIFY_LONDON_SWE_2025],
      },
      {
        id: 'friend-activity-feed',
        round: 'Final: system design',
        kind: 'Frontend system design',
        topic: 'Friend activity feed',
        question:
          'Design the feature that shows which songs a user\'s friends have recently played: a component in one account, a friends activity feed for the Spotify app in the other.',
        sources: [SPOTIFY_ITALY_FS_2022, SPOTIFY_LONDON_SWE_2025],
        practice: { label: 'Real-time notifications feed', path: '/system-design/scalable-notifications-feed' },
        answerGuide: 'system-design-full-stack',
      },
      {
        id: 'playlist-cover-upload',
        round: 'Final: system design',
        kind: 'Frontend system design',
        topic: 'Playlist cover image upload',
        question: 'Design the upload of cover images for playlists; the 2022 candidate found it narrower than a file-sharing system.',
        sources: [SPOTIFY_GERMANY_FS_2022],
        practice: { label: 'Image upload and preview component', path: '/system-design/image-upload-preview' },
      },
      {
        id: 'site-slow-for-distant-users',
        round: 'Final: system design',
        kind: 'Frontend system design',
        topic: 'Website slow for distant users',
        question:
          'Explain how you would build and ship a website, then what you would change when users in Germany are happy but users in Australia find it slow.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018],
        practice: { label: 'CDN, HTTP cache and frontend delivery', path: '/javascript/trivia/content-delivery-caching-strategies-streaming' },
      },
      {
        id: 'null-undefined-undeclared',
        kind: 'JavaScript',
        topic: 'Null, undefined and undeclared',
        question:
          'Explain how null differs from undefined and undeclared variables, and how you check for null; the account writes null twice, most likely meaning null and undefined.',
        sources: [SPOTIFY_US_FE_2020],
        practice: { label: 'null, undefined or undeclared', path: '/javascript/trivia/js-null-undefined-undeclared' },
      },
      {
        id: 'mutable-data-and-array-methods',
        kind: 'JavaScript',
        topic: 'Mutable data and array methods',
        question: 'What is the difference between mutable and immutable data, and which Array methods change the array they are called on?',
        sources: [SPOTIFY_US_FE_2020],
        practice: { label: 'References and Object.freeze', path: '/javascript/trivia/js-mutability-vs-immutability' },
      },
      {
        id: 'sort-filter-reduce',
        kind: 'JavaScript',
        topic: 'Sorting, filtering and reducing data',
        question: 'Sort, filter and reduce a set of data in JavaScript, then explain the Big O complexity.',
        sources: [SPOTIFY_ITALY_FS_2022],
        practice: { label: 'map, filter and reduce', path: '/javascript/trivia/js-map-filter-reduce' },
      },
      {
        id: 'recursive-fibonacci',
        kind: 'Algorithm',
        topic: 'Recursive Fibonacci function',
        question: 'Optimise a recursive function that prints the Fibonacci sequence.',
        sources: [SPOTIFY_STOCKHOLM_FS_2018],
      },
    ],
    // Left out as screening logistics: the typical week and current stack (2022 recruiter, given in the stage), and
    // openers on background and "tell me about yourself".
    behaviouralQuestions: [
      {
        id: 'why-spotify',
        question: 'Why do you want to work at Spotify?',
        sources: [SPOTIFY_SP1, SPOTIFY_SP4, SPOTIFY_LONDON_FS_JUN_2022],
      },
      {
        id: 'why-looking',
        question: 'Why are you looking for a new job?',
        sources: [SPOTIFY_SP1],
      },
      {
        id: 'why-this-role',
        question: 'You have frontend and backend experience, and this role asks only for JavaScript, HTML and CSS: why are you applying for it?',
        sources: [SPOTIFY_NY_2018],
      },
      {
        id: 'past-project',
        question: 'Talk about a project you worked on, such as one of your best or a favourite from the past.',
        sources: [SPOTIFY_SP5, SPOTIFY_LONDON_PDX_2022, SPOTIFY_BERLIN_FS_2022, SPOTIFY_LONDON_FS_SEP_2022, SPOTIFY_LONDON_SWE_2025],
      },
      {
        id: 'handling-conflict',
        question: 'How do you handle conflict?',
        sources: [SPOTIFY_STOCKHOLM_JS_2018, SPOTIFY_BERLIN_FS_2022],
      },
      {
        id: 'disagreement',
        question: 'Describe a time you disagreed with someone you were working with, and how you handled it.',
        sources: [SPOTIFY_NY_INTERN_2023],
      },
      {
        id: 'leadership',
        question: 'Questions on the leadership traits you have shown; their wording is not in the account.',
        sources: [SPOTIFY_BERLIN_FS_2022],
      },
      {
        id: 'failures',
        question: 'Tell me about times you failed.',
        sources: [SPOTIFY_STOCKHOLM_JS_2018],
      },
      {
        id: 'giving-feedback',
        question: 'When did you last give someone feedback, and how did they react?',
        sources: [SPOTIFY_STOCKHOLM_FE_2021],
      },
      {
        id: 'negative-feedback',
        question: 'Describe a situation in which you received negative feedback from colleagues.',
        sources: [SPOTIFY_ITALY_FS_2022],
      },
      {
        id: 'diversity-in-interviews',
        question: 'How do you handle diversity in interviews?',
        sources: [SPOTIFY_ITALY_FS_2022],
      },
      {
        id: 'diverse-workplace',
        question: 'How do you feel about working in a diverse workplace?',
        sources: [SPOTIFY_GERMANY_FS_2022],
      },
      {
        id: 'discrimination-towards-a-colleague',
        question: 'If you came across discrimination towards a colleague at work, what would you do?',
        sources: [SPOTIFY_BELGIUM_FS_2022],
      },
      {
        id: 'architectural-decision',
        question: 'Describe an architectural decision you made in your current role. What would you have done differently?',
        sources: [SPOTIFY_US_SWE_2025],
      },
    ],
  },
  zalando: {
    summary:
      'Zalando\'s hiring page describes a 30-minute talent acquisition call, a case study such as a coding exercise, a hiring manager conversation and three to five final interviews. Frontend accounts posted from 2020 to 2024, two of them from Berlin, describe a take-home, on Codility in 2022 and 2024, then a final day; in 2024 it held a review of the take-home, JavaScript fundamentals, system design and a manager conversation, and the 2020 onsite also had a coding interview.',
    caveat:
      'Zalando\'s own pages disagree on whether the hiring manager comes before or after the coding challenge. Only one detailed account is from after 2022, a 2024 senior one from Berlin, and all but one of the reported questions come from it.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, Berlin',
        stages: [
          {
            stage: 'Talent acquisition call',
            format: '30 minutes with a talent acquisition partner on motivation, expectations and salary.',
            appliesTo: 'Tech roles',
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_BLOG],
          },
          {
            stage: 'Coding challenge',
            format:
              'An assessment done at home: a Codility challenge of two to three hours in 2022 and 2024. In 2024 it was a React and Node app and in 2022 easy algorithm problems; the 2020 account named no platform and gave three working days for a React question and an API design question.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_ZA1, ZALANDO_ZA2, ZALANDO_ZA4],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Hiring manager',
            format:
              '45 to 60 minutes on the official pages, about past work and how you collaborate. A Blind commenter describes it as non-technical, and in 2020 it was half of a two-hour phone stage.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_BLOG, ZALANDO_ZA2, ZALANDO_ZA3, ZALANDO_ZA4],
          },
          {
            stage: 'Final: take-home review',
            format: 'A discussion of the submitted code, 45 minutes with a senior software engineer in the 2024 account.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_ZA1, ZALANDO_ZA3],
          },
          {
            stage: 'Final: JavaScript fundamentals',
            format:
              'One hour of questions from two senior frontend engineers in 2024, on JavaScript, the browser and web tooling. An account posted in 2021 about a 2019 interview lists basic and advanced JavaScript and framework questions.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_BLOG, ZALANDO_ZA1, ZALANDO_ZA2, ZALANDO_ZA3],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Final: coding',
            format: 'One hour of live coding; Zalando\'s blog says interviewers expect clarifying questions and a discussion of complexity.',
            appliesTo: 'Some loops',
            sources: [ZALANDO_BLOG, ZALANDO_ZA2],
          },
          {
            stage: 'Final: system design',
            format:
              'One hour; in 2024 a senior principal engineer set a backend-leaning problem. Zalando\'s blog lists architecture, scalability, technology choices, resilience and security among what the round assesses.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_BLOG, ZALANDO_ZA1, ZALANDO_ZA2, ZALANDO_ZA3],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Final: engineering manager or HR',
            format: '45 minutes with the engineering manager in 2024, on teamwork and leading a team; the 2020 onsite had an HR interview.',
            appliesTo: 'Senior roles',
            sources: [ZALANDO_ZA1, ZALANDO_ZA2],
            // The hiring-manager round takes the general behavioural guide; this one gets its own page.
            practice: { label: 'Common behavioral questions', path: '/guides/behavioral/common-questions' },
          },
        ],
      },
    ],
    // All but one row come from the 2024 senior account (ZA1), re-read through its republished copy. Left out for want
    // of a subject: the 2020 assessment's React question (ZA2) and the 2019 "Basic and Advanced JavaScript + FrameWork
    // questions" (ZA3); they stay in the table. Left out by content: the 2020 API design question (ZA2), the 2024 system
    // design with a load balancer and database reads and writes (ZA1), the same round's Docker, CI/CD, automated testing
    // and Git hooks topics (ZA1), and the 2019 advice to expect an e-commerce system design (ZA3), which names neither
    // the task nor whether it was frontend. Left out for their source: questions known only from Glassdoor (a memoize
    // function, a class-to-function refactor, a hover menu, the event loop, a shopping-cart design) and the 2018 to 2019
    // Codility task texts on GitHub.
    questions: [
      {
        id: 'search-box-take-home',
        round: 'Coding challenge',
        kind: 'React build',
        topic: 'Search box with suggestions',
        question:
          'In a three-hour Codility take-home, build the React side of a React and Node app: a search box that suggests matches as the user types, with thorough unit tests and performance work such as debouncing.',
        sources: [ZALANDO_ZA1],
        practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
      },
      {
        id: 'array-string-problems',
        round: 'Coding challenge',
        kind: 'Algorithm',
        topic: 'Array and string manipulation',
        question: 'Easy LeetCode-style problems on array and string manipulation, in a Codility test of about two hours.',
        promptNotShared: true,
        sources: [ZALANDO_ZA4],
      },
      {
        id: 'debounce-from-scratch',
        round: 'Final: take-home review',
        kind: 'JavaScript',
        topic: 'Debounce function',
        question: 'While reviewing the take-home, write your own debounce function.',
        sources: [ZALANDO_ZA1],
        practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
      },
      {
        id: 'removed-imports',
        round: 'Final: take-home review',
        kind: 'React concepts',
        topic: 'Removing imports from a React app',
        question: 'What would happen to the submitted React application if its imports were removed?',
        sources: [ZALANDO_ZA1],
      },
      {
        id: 'optimise-search-app',
        round: 'Final: take-home review',
        kind: 'Frontend system design',
        topic: 'Optimising the search box app',
        question: 'How could the submitted search box application be optimised further?',
        sources: [ZALANDO_ZA1],
        practice: { label: 'Real-time search with debounce and caching', path: '/system-design/realtime-search-debounce-cache' },
      },
      {
        id: 'loading-and-rendering',
        round: 'Final: JavaScript fundamentals',
        kind: 'Web fundamentals',
        topic: 'Script loading and page rendering',
        question:
          'How the browser builds and renders a page: the DOM tree and parsing, async and defer, the CSSOM, FCP and TTI, server-side rendering, and blocking versus non-blocking loading.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'HTML parsing and rendering order', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'css-specificity',
        round: 'Final: JavaScript fundamentals',
        kind: 'Web fundamentals',
        topic: 'CSS specificity',
        question: 'Questions on CSS specificity, in the same hour.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'Cascade, specificity and !important', path: '/css/trivia/css-cascade-order' },
      },
      {
        id: 'html5-semantics',
        round: 'Final: JavaScript fundamentals',
        kind: 'Web fundamentals',
        topic: 'HTML5 semantics',
        question: 'Questions on HTML5 semantics, in the same hour.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'Semantic HTML elements', path: '/html/trivia/html-semantic-elements' },
      },
      {
        id: 'web-accessibility',
        round: 'Final: JavaScript fundamentals',
        kind: 'Web fundamentals',
        topic: 'Web accessibility',
        question: 'Web accessibility: roles, alt text, aria-hidden, screen readers such as VoiceOver, and sprites versus SVG.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'ARIA roles', path: '/html/trivia/html-aria-roles' },
      },
      {
        id: 'types-objects-prototypes',
        round: 'Final: JavaScript fundamentals',
        kind: 'JavaScript',
        topic: 'Types, objects and prototypes',
        question: 'JavaScript fundamentals: types, functions, objects and prototypes.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'Prototypal inheritance', path: '/javascript/trivia/js-prototypal-inheritance' },
      },
      {
        id: 'es6-features',
        round: 'Final: JavaScript fundamentals',
        kind: 'JavaScript',
        topic: 'ES6 array methods and destructuring',
        question: 'ES6 features: map, object destructuring, filter and Array.prototype.some.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'map, filter and reduce', path: '/javascript/trivia/js-map-filter-reduce' },
      },
      {
        id: 'builder-pattern-solid',
        round: 'Final: JavaScript fundamentals',
        kind: 'JavaScript',
        topic: 'Builder pattern and SOLID',
        question: 'Design patterns: the Builder pattern and the SOLID principles.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'JavaScript design patterns', path: '/javascript/trivia/js-design-patterns' },
      },
      {
        id: 'web-security',
        round: 'Final: JavaScript fundamentals',
        kind: 'Web fundamentals',
        topic: 'Web security',
        question: 'Web security: request headers, cookies, clickjacking and XSS.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
      },
      {
        id: 'webpack-bundling',
        round: 'Final: JavaScript fundamentals',
        kind: 'Web fundamentals',
        topic: 'Webpack, minification and bundling',
        question: 'Build tools: Webpack, minification, bundling and making the bundle smaller.',
        promptNotShared: true,
        sources: [ZALANDO_ZA1],
        practice: { label: 'Tree shaking and unused imports', path: '/javascript/trivia/js-tree-shaking' },
      },
    ],
    behaviouralQuestions: [
      {
        id: 'code-breaks-production',
        question: 'What would you do straight away if your code broke production?',
        sources: [ZALANDO_ZA1],
      },
      {
        id: 'lack-of-motivation',
        question: 'How do you deal with a lack of motivation?',
        sources: [ZALANDO_ZA1],
      },
      {
        id: 'team-conflict',
        question: 'How do you resolve conflicts within a team?',
        sources: [ZALANDO_ZA1],
      },
      {
        id: 'leading-a-team',
        question: 'What is your vision for leading a team?',
        sources: [ZALANDO_ZA1],
      },
      {
        id: 'cross-functional-teams',
        question: 'How comfortable are you working with cross-functional teams?',
        sources: [ZALANDO_ZA1],
      },
    ],
  },
  xai: {
    title: 'xAI (now SpaceXSI) frontend interview process',
    summary:
      'The careers page describes four generic steps and says technical team members, not recruiters, evaluate applications. The closed frontend postings from March 2025 to February 2026 shared one template: a review of the CV and a "statement of exceptional work", a 15-minute phone interview with basic technical questions, then the team\'s main process on Google Meet with the goal of finishing within one week. For frontend roles that meant a React coding interview in TypeScript, an HTML/CSS interview from a screenshot, and a team or founding-engineer stage. One London account from August 2025 matches the React round; general software-engineer accounts from late 2025 add a take-home and coding rounds outside React.',
    caveat:
      'Every frontend posting with a loop had been removed by 25 February 2026, and on 21 October 2026 the board had no frontend posting with interview text, so this table describes the 2025 to early-2026 loops. The loop varies by team: Bay Area postings added a coding assessment and a systems session, London postings did not, and the take-home row comes from one general software-engineer account rather than a frontend posting. The "Software Engineer Specialist" loops with a CodeSignal assessment stay out of the table as a separate track, though one of their React questions is in the list, and the questions under the coding assessment come from a general software-engineer loop.',
    checkedAt: '2026-10-21',
    variants: [
      {
        title: 'Frontend engineers, London and Bay Area, from postings 2025-03 to 2026-02 and one London account',
        note: 'Thin evidence: one public frontend account. Stages marked "postings only" rest on the closed postings alone.',
        stages: [
          {
            stage: 'Application review',
            format: 'Technical team members, not recruiters, review the CV and a "statement of exceptional work".',
            appliesTo: 'All roles',
            sources: [XAI_CAREERS, XAI_O_LONDON_FE, XAI_O_GROK_STUDIO, XAI_O_DESIGNER_HYBRID],
          },
          {
            stage: 'Screening',
            format: 'A 15-minute "phone interview" with "some basic technical questions".',
            appliesTo: 'All roles',
            sources: [XAI_O_LONDON_FE, XAI_O_GROK_API, XAI_O_ENTERPRISE, XAI_X1_FE_2025],
          },
          {
            stage: 'React coding interview',
            format:
              '"Write a small app in React" in TypeScript, on Google Meet: 45 minutes in London, one or two interviews on Bay Area teams. In the one account it ran an hour as pair coding, with an engineer from the team reviewing the code live and asking React questions along the way.',
            appliesTo: XAI_ROLE,
            sources: [XAI_O_LONDON_FE, XAI_O_GROK_API, XAI_O_ENTERPRISE, XAI_O_GROK_STUDIO, XAI_O_AUTONOMOUS_AGENTS, XAI_X1_FE_2025],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'HTML/CSS interview',
            format: '"Given a screenshot of a UI, implement it"; 45 minutes with Tailwind in London. Postings only.',
            appliesTo: 'Frontend roles on the grok.com & API, Enterprise and London postings',
            sources: [XAI_O_LONDON_FE, XAI_O_GROK_API, XAI_O_ENTERPRISE, XAI_O_DESIGNER_HYBRID],
            practice: { label: 'Grid card gallery', path: '/css/coding/css-grid-card-gallery' },
          },
          {
            stage: 'Coding assessment in a language of your choice',
            format:
              'A general coding round before the frontend interviews. A 2025 Safety engineering loop had two such rounds, one over Google Meet and one on site.',
            appliesTo: 'Grok Studio and Autonomous Agents postings; one 2025 Safety loop',
            sources: [XAI_O_GROK_STUDIO, XAI_O_AUTONOMOUS_AGENTS, XAI_X8_SAFETY_2025],
          },
          {
            stage: 'Systems hands-on',
            format: '"Demonstrate practical skills in a live problem-solving session." Posting only.',
            appliesTo: 'Autonomous Agents posting',
            sources: [XAI_O_AUTONOMOUS_AGENTS],
            practice: { label: 'AI chat composer and streaming turn', path: '/system-design/ai-chat-textarea-design' },
          },
          {
            stage: 'Meet the team or founding engineer',
            format:
              'Bay Area: "Present your past exceptional work and your vision with xAI to a small audience." London: 30 minutes with founding engineer Toby Pohlen.',
            appliesTo: 'All roles',
            sources: [XAI_O_LONDON_FE, XAI_O_GROK_STUDIO, XAI_O_AUTONOMOUS_AGENTS, XAI_O_DESIGNER_HYBRID],
            practice: { label: 'Behavioural stories', path: '/guides/behavioral/stories' },
          },
          {
            stage: 'UI design exercise and presentation',
            format: '"Design a UI in a tool of your choice (e.g. Figma or Photoshop)" and a 20-minute presentation of previous design projects and complex UI flows. Posting only.',
            appliesTo: 'Frontend Engineer & UI/UX Designer posting only',
            sources: [XAI_O_DESIGNER_HYBRID],
          },
          {
            stage: 'Take-home and code-reading final',
            format:
              'A four-hour take-home with AI coding assistants allowed, handed in as a GitHub repository and a Loom video within 24 hours, then a one-hour in-person coding round on existing code.',
            appliesTo: 'One general software-engineer loop from 2025; not on any frontend posting',
            sources: [XAI_X7_MTS_2025],
          },
        ],
      },
    ],
    // Left out by content: a rate limiter design (backend system design) from the Safety loop. Left out for want of a
    // subject: a medium-hard LeetCode assessment, a 30-minute "implement some code" interview and a Java code review with
    // a translation between languages in a Specialist loop (Taro, Canada 2025); a LeetCode problem in a 2026 Blind post;
    // the "4-hour intensive programming challenge" a blog post names. Left out for their sources: the React app task
    // and the React web app task on 1point3acres and the hooks and scaling review on Glassdoor. Posting-only rounds (the
    // small React app, the screenshot build, the UI design exercise, Meet the Team) stay in the table: a row needs an
    // account. Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'react-chat-interface-live-review',
        round: 'React coding interview',
        kind: 'React build',
        topic: 'Chat interface',
        question: 'In a one-hour pair-coding session, build a chat interface in React while an engineer from the team reviews your code live.',
        sources: [XAI_X1_FE_2025],
        practice: { label: 'Chat UI with a streaming response', path: '/react/coding/react-chat-streaming-ui' },
        answerGuide: 'react-chat-interface-pairing',
      },
      {
        id: 'what-usecallback-does',
        round: 'React coding interview',
        kind: 'React concepts',
        topic: 'useCallback',
        question: 'What does the useCallback hook do? One of the React questions asked during the pair-coding build.',
        sources: [XAI_X1_FE_2025],
        practice: { label: 'useMemo vs useCallback: when memoising makes it slower', path: '/react/trivia/react-usememo-vs-usecallback' },
      },
      {
        id: 'what-useref-is-for',
        round: 'React coding interview',
        kind: 'React concepts',
        topic: 'useRef',
        question: 'Explain what useRef is for and how you would use it in a component.',
        sources: [XAI_X2_SPECIALIST_2025],
        practice: { label: 'useRef vs useState: why changing a ref does not re-render', path: '/react/trivia/react-useref-vs-usestate' },
      },
      {
        id: 'four-hour-demo-product',
        round: 'Take-home and code-reading final',
        kind: 'Practical coding',
        topic: 'Demo product on the xAI API',
        question:
          'Pick one of six xAI prompts and build a demoable product in four hours, using AI assistants and the provided X and xAI API keys, then explain in a video which systems you used and why; this candidate improved X search with Grok.',
        sources: [XAI_X7_MTS_2025],
      },
      {
        id: 'token-queue-class',
        round: 'Take-home and code-reading final',
        kind: 'Practical coding',
        topic: 'LLM token queue class',
        question:
          'Read an existing class of 70 to 100 lines and implement the missing part that splits LLM input into token-sized queues and returns them; follow-ups asked how the class is structured and where its data moves.',
        sources: [XAI_X7_MTS_2025],
      },
      {
        id: 'key-value-transactions',
        round: 'Coding assessment in a language of your choice',
        kind: 'Practical coding',
        topic: 'Key-value database with transactions',
        question: 'Design and code a key-value database with set plus begin, commit and abort for transactions, then support nested transactions.',
        sources: [XAI_X8_SAFETY_2025],
      },
      {
        id: 'stateful-list-iterator',
        round: 'Coding assessment in a language of your choice',
        kind: 'Practical coding',
        topic: 'Stateful list iterator',
        question:
          'Implement an iterator over a list with next, hasNext, getState and setState, then make a list of iterators behave as one; follow-ups asked about edge cases and input that is not a list.',
        sources: [XAI_X8_SAFETY_2025],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'why-xai',
        question: 'Why xAI, and which part do you want to work on: Grok, the enterprise API, research or more product-facing work?',
        sources: [XAI_X7_MTS_2025, XAI_X8_SAFETY_2025],
      },
      {
        id: 'background-walkthrough',
        question: 'Walk me through your background and previous experience.',
        sources: [XAI_X7_MTS_2025, XAI_X8_SAFETY_2025],
      },
      {
        id: 'what-you-did-yourself',
        question: 'What technical experience do you have, and what did you actually do yourself?',
        sources: [XAI_X7_MTS_2025],
      },
      {
        id: 'work-style',
        question: 'Are you comfortable with the way people work at xAI?',
        sources: [XAI_X7_MTS_2025],
      },
      {
        id: 'truth-seeking-mission',
        question: 'Do you connect with xAI\'s truth-seeking mission?',
        sources: [XAI_X7_MTS_2025],
      },
      {
        id: 'most-challenging-recent-project',
        question: 'What is the most challenging project you have had recently?',
        sources: [XAI_X10_SWE_2025],
      },
    ],
  },
  jpmorgan: {
    summary:
      'JPMorgan Chase\'s How we hire page says the interview process will differ for each position and that candidates meet several people in multiple rounds, and JPMorgan Chase-badged commenters on Blind say the format depends on the line of business and the team. Frontend accounts from 2017 to 2026 in the UK, the US and India describe a recruiter screen, an hour of JavaScript and React questions often split between two interviewers, 30 to 90 minutes of live coding, and a hiring-manager or leadership round. The online-assessment and super-day rows come from generic software-engineer accounts that Software Engineer II and III requisitions probably share.',
    caveat:
      'No standard loop exists: the format depends on the line of business and the team, so the order and count of stages vary between accounts, and most accounts describe two to four of these stages rather than all of them. The super-day shape rests on generic software-engineer accounts, and no frontend-titled report confirms it. Several frontend accounts are one to three lines long and some dates are approximate; one candidate met an interviewer assigned to a back-end role, and another heard nothing after a cleared round.',
    checkedAt: '2026-10-21',
    variants: [
      {
        title: 'Front-end and React engineers, team-run loops, 2017 to 2026',
        note: 'Stage order varies by team. The security-and-framework row is one Bengaluru loop; the super-day row is the generic Software Engineer II and III shape.',
        stages: [
          {
            stage: 'Recruiter contact',
            format: 'A phone screen about the CV.',
            appliesTo: 'Most loops',
            sources: [JPMORGAN_HOW_WE_HIRE, JPMORGAN_JP1, JPMORGAN_JP4, JPMORGAN_JP15],
          },
          {
            stage: 'Online assessment',
            format: 'HackerRank with two easy-to-medium problems, or a recorded video interview for some roles; weeks before the loop in some accounts.',
            appliesTo: 'Software Engineer II and III requisitions; not reported in the frontend-titled loops',
            sources: [JPMORGAN_HIRING_FAQS, JPMORGAN_JP15, JPMORGAN_JP17A, JPMORGAN_JP17B, JPMORGAN_JP17C, JPMORGAN_JP17D, JPMORGAN_JP17E],
            practice: { label: 'DSA for frontend loops', path: '/guides/interview-blueprint/dsa-for-fe' },
          },
          {
            stage: 'Frontend technical conversation',
            format:
              'About an hour of spoken questions, often split between two interviewers or put to a panel of three: JavaScript, React and browser fundamentals and questions on the CV. A 2017 UK loop ran a phone round of about 30 questions and a 90-minute face-to-face with a Glasgow dial-in; a 2021 New York onsite and a 2025 lead panel added algorithm questions.',
            appliesTo: JPMORGAN_ROLE,
            sources: [JPMORGAN_JP2, JPMORGAN_JP3, JPMORGAN_JP5, JPMORGAN_JP6, JPMORGAN_JP7, JPMORGAN_JP9, JPMORGAN_JP10, JPMORGAN_JP12, JPMORGAN_JP13, JPMORGAN_JP14],
            practice: { label: 'What memoization is', path: '/javascript/trivia/js-memoization' },
          },
          {
            stage: 'Live coding',
            format:
              '30 to 90 minutes of coding with an interviewer, over video in some loops: a small React build, or simple paper coding with a tech lead. A London React candidate in 2023 was briefed that the second stage would be 90 minutes of live coding and a 30-minute behavioural interview, and did not report back on it; other accounts give 30 to 45 minutes, and in a 2022 loop one of three video interviews was run by an interviewer assigned to a back-end Python role.',
            appliesTo: 'Most frontend loops',
            sources: [JPMORGAN_JP1, JPMORGAN_JP2_PLAN, JPMORGAN_JP4, JPMORGAN_JP6, JPMORGAN_JP8, JPMORGAN_JP10],
            practice: { label: 'Keys in React lists', path: '/react/trivia/react-keys-in-lists' },
          },
          {
            stage: 'Security and framework rounds',
            format:
              'Three 60-minute rounds in one sitting: security and React, JavaScript and framework, and hiring manager and culture fit, with a coding question in each of the first two; the offer email came on day 10.',
            appliesTo: 'One Bengaluru SDE2 loop, 2024',
            sources: [JPMORGAN_JP11],
            practice: { label: 'Async race conditions and stale UI', path: '/javascript/trivia/js-async-race-conditions' },
          },
          {
            stage: 'Super day',
            format:
              'Three rounds of 45 to 60 minutes in one day, in any order: a pull-request review followed by a medium coding problem, high-level design on a HackerRank whiteboard or CodePair, and a behavioural round with a Director or a senior executive; a short team-match call may follow.',
            appliesTo: 'Generic Software Engineer II and III loops, US and India, 2024 to 2026; probably shared by React-titled requisitions, unconfirmed',
            sources: [JPMORGAN_JP15, JPMORGAN_JP16, JPMORGAN_JP17A, JPMORGAN_JP17B, JPMORGAN_JP17C, JPMORGAN_JP17D, JPMORGAN_JP17E],
            practice: { label: 'Data structures for frontend engineers', path: '/guides/interview-blueprint/dsa-for-fe' },
          },
          {
            stage: 'Hiring manager and leadership',
            format: 'A team manager and a managing director, the application owner and lead developer, a hiring-manager round on the candidate\'s project and culture fit, or a Director or a senior executive in the super-day loops.',
            appliesTo: 'Most loops',
            sources: [JPMORGAN_JP4, JPMORGAN_JP6, JPMORGAN_JP11, JPMORGAN_JP17A, JPMORGAN_JP17D],
            practice: { label: 'Behavioural stories', path: '/guides/behavioral/stories' },
          },
        ],
      },
    ],
    // Left out by content: back-end, REST and security basics from a 2025 lead panel, ransomware from the 2024 security
    // round, and every high-level design prompt from the generic super days (rate limiter, parking lot, flash sale,
    // payments, news aggregator). Left out for want of a subject: three LeetCode-style questions in the 2025 lead panel,
    // the HackerRank problems, simple paper coding in a 2021 loop, about 30 phone questions in 2017, and the briefings'
    // expectations. Left out for their source: Glassdoor snippets, a multi-company dev.to post, an unreadable Medium post,
    // and super-day medium problems the records do not tie to one post. Behavioural questions are in
    // behaviouralQuestions, open.
    questions: [
      {
        id: 'generic-memoize-function',
        round: 'Security and framework rounds',
        kind: 'JavaScript',
        topic: 'Generic memoisation function',
        question: 'Write a generic memoization function that caches results by their arguments.',
        sources: [JPMORGAN_JP11],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
        answerGuide: 'generic-memoize-function',
      },
      {
        id: 'generic-async-promise-hook',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Generic async promise hook',
        question:
          'Live-code a generic async promise hook in React, with generic types and a useEffect cleanup function expected.',
        sources: [JPMORGAN_JP1],
        practice: { label: 'Fetch and render a list with loading, error and empty states', path: '/react/coding/react-fetch-list-states' },
        answerGuide: 'generic-async-promise-react-hook',
      },
      {
        id: 'explain-a-closure',
        round: 'Frontend technical conversation',
        kind: 'JavaScript',
        topic: 'Closures',
        question: 'What is a closure in JavaScript?',
        sources: [JPMORGAN_JP2, JPMORGAN_JP4, JPMORGAN_JP12],
        practice: { label: 'Explain closures in JavaScript', path: '/javascript/trivia/js-closures' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'reduce-polyfill',
        round: 'Security and framework rounds',
        kind: 'JavaScript',
        topic: 'Array reduce polyfill',
        question: 'Write a polyfill for the array reduce method.',
        sources: [JPMORGAN_JP11],
        practice: { label: 'Implement Array.prototype.reduce', path: '/javascript/coding/js-array-prototype-reduce' },
        answerGuide: 'reduce-polyfill-with-async-follow-ups',
      },
      {
        id: 'priority-todo-list',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Priority to-do list',
        question:
          'Build a to-do list in React where each task has a high, medium or low priority that can be updated, and whole tasks can be deleted.',
        sources: [JPMORGAN_JP8],
        practice: { label: 'React to-do list', path: '/react/coding/react-todo-list' },
        answerGuide: 'priority-todo-list',
      },
      {
        id: 'shallow-deep-clone-object-assign',
        round: 'Frontend technical conversation',
        kind: 'JavaScript',
        topic: 'Shallow vs deep clone and Object.assign',
        question: 'What is the difference between a shallow and a deep clone, and what is a use case for Object.assign?',
        sources: [JPMORGAN_JP2],
        practice: { label: 'Shallow copy versus deep copy', path: '/javascript/trivia/js-shallow-vs-deep-copy' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'usecallback-vs-usememo',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        topic: 'useCallback vs useMemo',
        question: 'What is the difference between useCallback and useMemo?',
        sources: [JPMORGAN_JP2],
        practice: { label: 'useMemo versus useCallback', path: '/react/trivia/react-usememo-vs-usecallback' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'usestate-vs-useref',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        topic: 'useState vs useRef',
        question: 'What is the difference between the useState hook and the useRef hook?',
        sources: [JPMORGAN_JP3],
        practice: { label: 'useRef versus useState', path: '/react/trivia/react-useref-vs-usestate' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'search-bar-suggestions',
        kind: 'React build',
        topic: 'Search bar with suggestions',
        question:
          'Write a function component with a search bar over a group of strings that shows matching suggestions as the user types.',
        sources: [JPMORGAN_J14_FULLSTACK_2025],
        practice: { label: 'React autocomplete search bar', path: '/react/coding/react-autocomplete-search-starter' },
      },
      {
        id: 'pull-request-review',
        round: 'Super day',
        kind: 'Practical coding',
        topic: 'Pull request review',
        question:
          'Spend about ten minutes reviewing a pull request and say what is wrong with it; the code held hardcoded credentials and poor variable names.',
        sources: [JPMORGAN_JP15],
      },
      {
        id: 'how-react-works-react-over-angular',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        topic: 'How React works, React vs Angular',
        question: 'How does React work, and why would a developer choose React over Angular?',
        sources: [JPMORGAN_JP7],
        practice: { label: 'What problem React solves', path: '/react/trivia/react-core-problem-and-non-goals' },
      },
      {
        id: 'promises-generators-currying',
        round: 'Security and framework rounds',
        kind: 'JavaScript',
        topic: 'Promises, generators and currying',
        question: 'Questions on promises and asynchronous behaviour, generator functions, object manipulation, pure functions and currying.',
        promptNotShared: true,
        sources: [JPMORGAN_JP11],
        practice: { label: 'What is currying in JavaScript?', path: '/javascript/trivia/js-currying' },
        answerGuide: 'reduce-polyfill-with-async-follow-ups',
      },
      {
        id: 'security-and-react-topics',
        round: 'Security and framework rounds',
        kind: 'Web fundamentals',
        topic: 'XSS and secure React components',
        question:
          'Questions on XSS, the security principles you apply at work, React lifecycle methods and their part in keeping a web application secure, and designing components that limit vulnerabilities and keep data private.',
        promptNotShared: true,
        sources: [JPMORGAN_JP11],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
      },
      {
        id: 'event-loop-react-optimisation',
        round: 'Frontend technical conversation',
        kind: 'JavaScript',
        topic: 'Event loop and React optimisation',
        question: 'Questions on the JavaScript event loop and on React optimisation techniques.',
        promptNotShared: true,
        sources: [JPMORGAN_JP12],
        practice: { label: 'JavaScript event loop visualiser', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'var-let-const-scope-hooks',
        kind: 'JavaScript',
        topic: 'var, let and const',
        question:
          'What is the difference between var, let and const? The list then moved on to scope, promises, useEffect and higher-order components.',
        sources: [JPMORGAN_J14_FULLSTACK_2025],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'context-then-hoc',
        kind: 'React concepts',
        topic: 'React context',
        question:
          'What is React context? An answer that mentioned higher-order components drew a follow-up on when a higher-order component would be used.',
        sources: [JPMORGAN_J3_FE_2022],
        practice: { label: 'Higher-order components in React', path: '/react/trivia/react-higher-order-components' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'benefits-of-reduce',
        kind: 'JavaScript',
        topic: 'Benefits of array reduce',
        question: 'Explain the benefits of the array reduce method.',
        sources: [JPMORGAN_J3_FE_2022],
        practice: { label: 'map, filter and reduce', path: '/javascript/trivia/js-map-filter-reduce' },
      },
      {
        id: 'function-component-coding',
        round: 'Live coding',
        kind: 'React build',
        topic: 'Function component coding',
        question: 'Coding on React function components, in a panel whose other questions followed the CV.',
        promptNotShared: true,
        sources: [JPMORGAN_JP6],
      },
      {
        id: 'count-weekdays-in-a-year',
        round: 'Live coding',
        kind: 'Algorithm',
        topic: 'Weekday counts in a year',
        question: 'Count how often each weekday occurs in a given year, in Python.',
        sources: [JPMORGAN_JP8],
      },
      {
        id: 'what-is-cors',
        round: 'Frontend technical conversation',
        kind: 'Web fundamentals',
        topic: 'CORS (cross-origin resource sharing)',
        question: 'What is CORS?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Handle CORS in a frontend app', path: '/javascript/trivia/js-secure-cors-handling' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'cookie-session-local-storage',
        round: 'Frontend technical conversation',
        kind: 'Web fundamentals',
        topic: 'Cookies vs session and local storage',
        question: 'What is the difference between a cookie, session storage and local storage?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Cookie, sessionStorage and localStorage', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'javascript-prototype',
        round: 'Frontend technical conversation',
        kind: 'JavaScript',
        topic: 'Object prototypes',
        question: 'What is a prototype in JavaScript?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Prototypal inheritance in JavaScript', path: '/javascript/trivia/js-prototypal-inheritance' },
      },
      {
        id: 'arrow-vs-normal-function',
        round: 'Frontend technical conversation',
        kind: 'JavaScript',
        topic: 'Arrow vs normal functions',
        question: 'What is the difference between an arrow function and a normal function?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Arrow functions versus regular functions', path: '/javascript/trivia/js-arrow-vs-regular-functions' },
      },
      {
        id: 'lru-cache',
        round: 'Frontend technical conversation',
        kind: 'Algorithm',
        topic: 'LRU cache',
        question: 'How would you implement an LRU cache?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Create an LRU cache', path: '/javascript/coding/js-create-lru-cache' },
      },
      {
        id: 'balanced-brackets',
        round: 'Frontend technical conversation',
        kind: 'Algorithm',
        topic: 'Balanced brackets',
        question: 'Check whether the brackets in a string are balanced.',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Valid parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'delete-linked-list-node',
        round: 'Frontend technical conversation',
        kind: 'Algorithm',
        topic: 'Deleting a linked list node',
        question: 'Delete a node from a linked list.',
        sources: [JPMORGAN_JP14],
      },
      {
        id: 'react-redux-typescript-experience',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        topic: 'React, Redux and TypeScript experience',
        question:
          'How much have you used React, what do you know about Redux, what is going on in React lately, and which new TypeScript features do you like?',
        sources: [JPMORGAN_JP5],
        practice: { label: 'When a React app needs Redux', path: '/react/trivia/react-state-management-redux' },
      },
      {
        id: 'stateless-component-lifecycle',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        topic: 'Stateless components and React lifecycle',
        question: 'What is a stateless component, and what are the benefits and drawbacks of the React lifecycle?',
        sources: [JPMORGAN_JP5],
        practice: { label: 'Function versus class components', path: '/react/trivia/react-functional-vs-class-components' },
      },
    ],
    behaviouralQuestions: [
      {
        id: 'tell-me-about-yourself',
        question: 'Tell me about yourself.',
        sources: [JPMORGAN_JP1],
      },
      {
        id: 'proudest-work',
        question: 'What accomplishment or feature from your work are you proudest of?',
        sources: [JPMORGAN_J5_FE_2021, JPMORGAN_JP11],
      },
      {
        id: 'team-conflict',
        question: 'How do you resolve conflict within a team and handle team dynamics?',
        sources: [JPMORGAN_JP11],
      },
      {
        id: 'project-as-flow-chart',
        question: 'Walk through your project and draw one of its features as a flow chart.',
        sources: [JPMORGAN_JP11],
      },
      {
        id: 'why-jpmorgan-chase',
        question: 'Why JPMorgan Chase, when a bank\'s work and pace may differ from what you are used to?',
        sources: [JPMORGAN_J30_AVP_2024],
      },
      {
        id: 'disagreement-with-manager',
        question: 'Tell me about a disagreement with your manager.',
        sources: [JPMORGAN_J30_AVP_2024],
      },
      {
        id: 'design-rejected',
        question: 'How do you behave when your design is rejected?',
        sources: [JPMORGAN_J30_AVP_2024],
      },
      {
        id: 'stuck-and-learning',
        question: 'How do you handle being stuck on a task, and how do you go about learning what you need?',
        sources: [JPMORGAN_JP15],
      },
    ],
  },
  agoda: {
    summary:
      'Agoda\'s interview-process page describes a HackerRank online test as the coding assessment and four rounds: Coding, Platform, System Design and Agoda Culture Fit, with a decision typically within two weeks of the last round. Front-end accounts from Bangkok relocation loops in 2025 and 2026 describe a recruiter prep call, a 60-minute coding interview, a Frontend Platform interview, an architecture interview, a preliminary call in which the level is set, a culture-fit conversation with an engineering manager, and the manager presenting the offer. A July 2026 account says all its rounds were on HackerRank a week apart, and a September 2025 account says its Platform interview was also on HackerRank.',
    caveat:
      'The Platform round\'s content varies by interviewer: a pure question-and-answer hour, a JavaScript implementation or an architecture discussion. Rejections after clearing the technical rounds are reported, over headcount or without a managerial round. Gurgaon loops differ by team; Manila and Bangalore rest on too little to state a loop. On 2026-10-21 the front-end postings were Staff, Lead and Manager level, all Bangkok-based with relocation.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Front-end engineers, Bangkok relocation loops, Senior and Staff, 2025 to 2026',
        stages: [
          {
            stage: 'Recruiter prep call',
            format: 'About 15 minutes in the one account that gives a duration, on background, notice period, relocation and expectations.',
            appliesTo: AGODA_ROLE,
            sources: [AGODA_HOW_WE_HIRE_TECH, AGODA_A3_OFFER_2025, AGODA_A4_STAFF_2025, AGODA_A9_HEADCOUNT_2025],
          },
          {
            stage: 'HackerRank assessment',
            format:
              'A HackerRank online test to complete within a timeframe, as the official page describes it; one 2025 Senior front-end account opened with an online assessment, while the other Senior and Staff accounts had none.',
            appliesTo: 'Some loops',
            sources: [AGODA_HOW_WE_HIRE_TECH, AGODA_A9_HEADCOUNT_2025],
          },
          {
            stage: 'Coding interview',
            format:
              '60 minutes on HackerRank with an engineer: two easy-to-medium DSA problems in JavaScript, with the complexity stated for each, then a few spoken follow-up questions.',
            appliesTo: AGODA_ROLE,
            sources: [AGODA_A1_BANGKOK_2026, AGODA_A4_STAFF_2025, AGODA_A5_FULL_STACK_2025, AGODA_A12_BANGALORE_2025, AGODA_INTERVIEWER_GUIDE],
            // A free problem rather than the DSA guide, so "Start the free task" opens a task. Not Valid Parentheses: it
            // is the practice of a locked row in this round.
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
            rehearsal: { label: 'Agoda coding interview, 2 problems in 45 minutes', path: '/javascript/coding/js-add-strings' },
          },
          {
            stage: 'Frontend Platform interview',
            format:
              '60 minutes on HackerRank with an engineer, shaped by the interviewer: a spoken question-and-answer hour with no code, a JavaScript implementation that grows out of an item on the resume, or a front-end architecture discussion. Agoda\'s prep guide tells front-end candidates to expect a code snippet to improve.',
            appliesTo: AGODA_ROLE,
            sources: [
              AGODA_A1_BANGKOK_2026,
              AGODA_A3_OFFER_2025,
              AGODA_A4_STAFF_2025,
              AGODA_A5_FULL_STACK_2025,
              AGODA_A16_PREP_GUIDE_2024,
              AGODA_HOW_WE_HIRE_TECH,
              AGODA_INTERVIEWER_GUIDE,
            ],
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Preliminary call',
            format:
              '30 minutes with the recruiter on compensation, relocation and feedback, straight after the Platform round in two accounts. Some loops changed level track around this call: a July 2026 Staff applicant was moved to Senior after round two, and a September 2025 Senior candidate was moved to the Staff track with an extra BE Platform hour.',
            appliesTo: AGODA_ROLE,
            sources: [AGODA_A1_BANGKOK_2026, AGODA_A3_OFFER_2025, AGODA_A4_STAFF_2025, AGODA_A8_CULTURE_FIT_2025, AGODA_A9_HEADCOUNT_2025, AGODA_A7_GURGAON_COMMENT],
          },
          {
            stage: 'Architecture interview',
            format:
              '60 minutes of product design talked through with the interviewer, from the front end and in one account from the backend too; the newest account says no diagram was expected. The Staff track adds a 60-minute BE Platform interview on backend design.',
            appliesTo: 'All; the extra hour on the Staff track',
            sources: [AGODA_A1_BANGKOK_2026, AGODA_A3_OFFER_2025, AGODA_A4_STAFF_2025, AGODA_A8_CULTURE_FIT_2025, AGODA_HOW_WE_HIRE_TECH],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Culture fit',
            format: '60 minutes with an engineering manager; behavioural questions, which the official interview guide frames with the CAR method (Context, Action, Results).',
            appliesTo: AGODA_ROLE,
            sources: [AGODA_A3_OFFER_2025, AGODA_A8_CULTURE_FIT_2025, AGODA_A9_HEADCOUNT_2025, AGODA_HOW_WE_HIRE_TECH, AGODA_INTERVIEW_GUIDE],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Decision and offer',
            format: 'The hiring manager presents the offer; the official target is a decision within two weeks of the last round, or under 30 days overall.',
            appliesTo: 'Candidates who pass',
            sources: [AGODA_A3_OFFER_2025, AGODA_HOW_WE_HIRE_TECH, AGODA_HIRING_PROCESS],
          },
        ],
      },
      {
        title: 'Front-end engineers, Gurgaon, 2024 to 2025',
        note:
          'Team-specific: three accounts with different stage orders. Interviewers may sit in Bangkok, and a senior front-end candidate posting in February 2026 was rejected in the second Gurgaon round, then received an offer from a Bangkok loop after applying again when the six-month cooling period ended. On 2026-10-21 the board listed no Gurugram front-end-titled role.',
        stages: [
          {
            stage: 'Online assessment or take-home',
            format:
              'An online assessment of HTML/CSS and JavaScript questions, or a React and TypeScript take-home that the 2025 Code360 account lists as a 120-minute online coding interview.',
            appliesTo: 'Some loops',
            sources: [AGODA_A7_GURGAON_2025, AGODA_A2_GURGAON_2025],
          },
          {
            stage: 'HR screen',
            format: 'A short call before the technical rounds.',
            appliesTo: 'Some loops',
            sources: [AGODA_A7_GURGAON_2025],
          },
          {
            stage: 'Coding round',
            format:
              '60 minutes of DSA and JavaScript problems: two JavaScript problems on HackerRank in one 2025 account, one DSA problem and one JavaScript utility in another, DSA alone in a 2024 full-stack loop.',
            appliesTo: 'Front-end and full-stack engineers',
            sources: [AGODA_A7_GURGAON_2025, AGODA_A2_GURGAON_2025, AGODA_A13_SDE2_2024],
            practice: { label: 'Run a function only once', path: '/javascript/coding/js-once' },
          },
          {
            stage: 'Platform or architecture round',
            format:
              'Spoken JavaScript and front-end questions in one 2025 account, a 60-minute front-end architecture design in another, and a system design with a front end built against its API in a 2024 full-stack loop.',
            appliesTo: 'Front-end and full-stack engineers',
            sources: [AGODA_A7_GURGAON_2025, AGODA_A2_GURGAON_2025, AGODA_A13_SDE2_2024],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'HR salary and relocation call',
            format: 'Compensation and relocation before a decision.',
            appliesTo: 'Some loops',
            sources: [AGODA_A7_GURGAON_2025],
          },
          {
            stage: 'Managerial or technical-strategy round',
            format:
              'A managerial round in the 2024 offer account, a 60-minute technical-strategy round in the 2025 Code360 account, and a rejection without a managerial round in the 2025 Blind account.',
            appliesTo: 'Some loops',
            sources: [AGODA_A13_SDE2_2024, AGODA_A2_GURGAON_2025, AGODA_A7_GURGAON_2025],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
    // Left out by content: backend designs (a BE Platform hotel booking system, a peak-time hotel booking system, an
    // ecommerce platform, a service the candidate built and scaled), HTTP versus HTTPS and the TLS question. Left out for
    // want of a subject: unnamed LeetCode, DSA and JavaScript problems, eight HTML/CSS assessment questions, a
    // performance scenario, "one small system design question", a frontend wired to backend API calls, the September
    // 2025 Platform topic list and the prep guide's promised code snippet. Left out for its source: Glassdoor snippets
    // and a member-only Medium post's paywalled immutable-copy task. Behavioural questions are in behaviouralQuestions.
    questions: [
      {
        id: 'hotel-search-page-design',
        round: 'Architecture interview',
        kind: 'Frontend system design',
        topic: 'Hotel search page',
        question:
          'Design the front end of a hotel search page from scratch, given a wireframe of date, city and guest inputs, filters and result cards: scalable, maintainable and observable, with real-time chat, for a million users and several teams that deploy features independently.',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'Design a hotel search page frontend for several teams', path: '/system-design/hotel-search-page-frontend' },
        answerGuide: 'hotel-search-page-frontend-architecture',
      },
      {
        id: 'client-storage-and-auth-token',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'Client storage and authentication tokens',
        question:
          'What are the ways to store data on the client, and where would you keep the authentication token, with the advantages, drawbacks and security implications of each place?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'Cookie vs sessionStorage vs localStorage', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'csrf-and-xss',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'CSRF and XSS',
        question: 'What are CSRF and XSS, how does each happen, and how do you mitigate them?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'pipeline-then-async-limit',
        round: 'Frontend Platform interview',
        kind: 'JavaScript',
        topic: 'Function pipeline with concurrency limit',
        question:
          'Implement a pipeline function that runs a value through a list of functions, then extend it so that asynchronous steps run under a concurrency limit.',
        sources: [AGODA_A4_STAFF_2025],
        practice: { label: 'Concurrency-limited map', path: '/javascript/coding/js-concurrency-map-limit' },
        answerGuide: 'javascript-pipeline-and-hackerrank-coding-hour',
      },
      {
        id: 'ssg-ssr-csr-isr',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'SSG, SSR, CSR and ISR',
        question: 'Explain SSG, SSR, CSR and ISR.',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'SSR and hydration in React', path: '/react/trivia/react-ssr-hydration' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'cdn-caching-and-updates',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'CDN caching and updates',
        question: 'How does a CDN work, what would you cache in it, and how do updates reach the cached copies?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'CDN and HTTP caching for frontend delivery', path: '/javascript/trivia/content-delivery-caching-strategies-streaming' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'react-state-and-filter-state',
        round: 'Frontend Platform interview',
        kind: 'React concepts',
        topic: 'State options and query-string filters',
        question:
          'What are the ways to hold state in React, and on a hotel booking page would you keep the selected filters in component state or in the query string?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'When does a React app need Redux?', path: '/react/trivia/react-state-management-redux' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'page-speed-and-core-web-vitals',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'Page speed and Core Web Vitals',
        question: 'Which techniques make a page land faster, and how do you measure a page\'s performance with Core Web Vitals?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'hotel-booking-page-entities',
        round: 'Frontend Platform interview',
        kind: 'Frontend system design',
        topic: 'Hotel booking page entities',
        question: 'List the core entities of a hotel booking page.',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'The web-fundamentals hour on a hotel booking page', path: '/javascript/trivia/js-web-fundamentals-hour-hotel-booking' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'search-to-pay-funnel',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'Search-to-payment funnel tracking',
        question: 'How would you track how many users go from search to view to booking to payment, and how many remain at each step?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'The web-fundamentals hour on a hotel booking page', path: '/javascript/trivia/js-web-fundamentals-hour-hotel-booking' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'testing-strategies-and-outside-failures',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'Testing strategies and external failures',
        question:
          'Which testing strategies would you use, such as unit, integration and screenshot tests, with an example and a boundary case for each, and how do you handle test failures that your own code did not cause?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'Testing strategy: edge cases and boundaries', path: '/javascript/trivia/js-testing-edge-cases-strategy' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'lighthouse-scores',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'Lighthouse score improvements',
        question: 'How would you improve a page\'s Lighthouse scores, covering LCP, FID, TTI and TBT?',
        sources: [AGODA_A5_FULL_STACK_2025],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'session-management-and-promises',
        round: 'Frontend Platform interview',
        kind: 'JavaScript',
        topic: 'Session management and promises',
        question: 'JavaScript questions on session management and promises, with scenario-based follow-ups.',
        promptNotShared: true,
        sources: [AGODA_A5_FULL_STACK_2025],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'react-unit-integration-e2e',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        topic: 'Unit, integration and end-to-end tests',
        question: 'Compare unit, integration and end-to-end testing for a React app.',
        sources: [AGODA_A5_FULL_STACK_2025],
        practice: { label: 'Testing strategy: edge cases and boundaries', path: '/javascript/trivia/js-testing-edge-cases-strategy' },
      },
      {
        id: 'rank-transform-array',
        round: 'Coding interview',
        kind: 'Algorithm',
        topic: 'Rank Transform of an Array',
        question: 'Replace each number in an array with its rank among the distinct values (LeetCode 1331, Rank Transform of an Array).',
        sources: [AGODA_A1_BANGKOK_2026],
      },
      {
        id: 'climbing-stairs-three-steps',
        round: 'Coding interview',
        kind: 'Algorithm',
        topic: 'Climbing Stairs variant',
        question: 'Count the ways to climb n stairs taking 1, 2 or 3 steps at a time, a variant of LeetCode 70, Climbing Stairs.',
        sources: [AGODA_A1_BANGKOK_2026],
      },
      {
        id: 'coding-hour-tests-and-pr-checklist',
        round: 'Coding interview',
        kind: 'Practical coding',
        topic: 'Test cases and pull request checklist',
        question:
          'After the problems: which test cases would you write for your solution, what other kinds of tests are there, and what should you check before raising a pull request?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'Testing strategy: edge cases and boundaries', path: '/javascript/trivia/js-testing-edge-cases-strategy' },
        answerGuide: 'javascript-pipeline-and-hackerrank-coding-hour',
      },
      {
        id: 'molecular-weight-formula',
        round: 'Coding interview',
        kind: 'Algorithm',
        topic: 'Chemical formula molecular weight',
        question:
          'Compute the molecular weight of a chemical formula that may contain nested parentheses and multipliers, where C is 12, H is 1 and O is 8.',
        sources: [AGODA_A12_BANGALORE_2025],
        practice: { label: 'Valid parentheses, a stack warm-up', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'js-basics-and-promises',
        round: 'Coding interview',
        kind: 'JavaScript',
        topic: 'Language basics and promises',
        question: 'JavaScript basics and promises, asked in a phone screen of an hour or more.',
        promptNotShared: true,
        sources: [AGODA_A12_BANGALORE_2025],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'sliding-window-problem',
        round: 'Coding interview',
        kind: 'Algorithm',
        topic: 'Sliding window technique',
        question: 'A sliding-window problem in the same phone screen.',
        promptNotShared: true,
        sources: [AGODA_A12_BANGALORE_2025],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
      },
      {
        id: 'sort-array-in-place',
        round: 'Coding interview',
        kind: 'Algorithm',
        topic: 'In-place array sort',
        question: 'Sort an array in place.',
        sources: [AGODA_T1_SENIOR_FE_2024],
      },
      {
        id: 'doctor-appointment-booking',
        round: 'Architecture interview',
        kind: 'Frontend system design',
        topic: 'Doctor appointment booking app',
        question: 'Design a doctor appointment booking application in the high-level design round.',
        sources: [AGODA_A4_STAFF_2025],
        practice: { label: 'Design a car rental booking frontend', path: '/system-design/car-rental-booking-frontend' },
      },
      {
        id: 'cdn-and-cdn-services',
        round: 'Architecture interview',
        kind: 'Web fundamentals',
        topic: 'CDNs and CDN services',
        question: 'What is a CDN, and which CDN services can you name?',
        sources: [AGODA_A33_STAFF_2025],
        practice: { label: 'CDN and HTTP caching for frontend delivery', path: '/javascript/trivia/content-delivery-caching-strategies-streaming' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'hackerrank-rest-api-question',
        round: 'HackerRank assessment',
        kind: 'Practical coding',
        topic: 'Basic coding with a REST API',
        question: 'Basic coding questions in the HackerRank test, one of them using a REST API.',
        promptNotShared: true,
        sources: [AGODA_T6_FULL_STACK_2024],
        practice: { label: 'Fetch JSON with a timeout and abort', path: '/javascript/coding/js-fetch-json-timeout' },
      },
      {
        id: 'stock-dashboard-take-home',
        round: 'Online assessment or take-home',
        kind: 'React build',
        topic: 'Stock data dashboard',
        question:
          'Build a React and TypeScript single-page app that fetches stock data from an API and shows it in paginated tables with summary statistics: the lowest value, the average open price for one year and the longest streak of days that closed above the open.',
        sources: [AGODA_A2_GURGAON_2025],
        practice: { label: 'Fetch and render a list with loading, error and empty states', path: '/react/coding/react-fetch-list-states' },
        answerGuide: 'react-typescript-stock-dashboard-take-home',
      },
      {
        id: 'longest-substring-without-repeating',
        round: 'Coding round',
        kind: 'Algorithm',
        topic: 'Longest substring without repeating characters',
        question: 'Find the longest substring without repeating characters.',
        sources: [AGODA_A2_GURGAON_2025],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
      },
      {
        id: 'debounce-utility',
        round: 'Coding round',
        kind: 'JavaScript',
        topic: 'Debounce utility function',
        question: 'Write a debounced utility function in JavaScript.',
        sources: [AGODA_A2_GURGAON_2025],
        practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
      },
      {
        id: 'array-and-hash-map-problems',
        round: 'Coding round',
        kind: 'Algorithm',
        topic: 'Array and hash map problems',
        question: 'A straightforward array question and a medium hash-map problem.',
        promptNotShared: true,
        sources: [AGODA_A13_SDE2_2024],
      },
      {
        id: 'travel-booking-frontend-architecture',
        round: 'Platform or architecture round',
        kind: 'Frontend system design',
        topic: 'Travel booking site architecture',
        question:
          'Design a scalable front-end architecture for a travel booking site like Agoda that handles high traffic, uses micro-frontends, renders SEO-friendly pages with SSR or SSG and includes performance optimisations.',
        sources: [AGODA_A2_GURGAON_2025],
        practice: { label: 'Design a car rental booking frontend', path: '/system-design/car-rental-booking-frontend' },
        answerGuide: 'travel-booking-frontend-architecture',
      },
      {
        id: 'hoisting-classes-ssr-csr',
        round: 'Platform or architecture round',
        kind: 'JavaScript',
        topic: 'Hoisting, classes, SSR and CSR',
        question: 'Questions on JavaScript hoisting, how classes behave, and SSR versus CSR.',
        promptNotShared: true,
        sources: [AGODA_A7_GURGAON_2025],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'atomic-design-and-testing',
        round: 'Platform or architecture round',
        kind: 'Web fundamentals',
        topic: 'Atomic design, testing and debugging',
        question: 'Questions on structuring a front end with atomic design, and on testing and debugging practice.',
        promptNotShared: true,
        sources: [AGODA_A7_GURGAON_2025],
      },
      {
        id: 'add-functionality-to-react-page',
        kind: 'React build',
        topic: 'Adding features to an existing page',
        question: 'Add functionality to an existing React web page in an online session, with Google allowed and the interviewer helping.',
        promptNotShared: true,
        sources: [AGODA_T5_FULL_STACK_2025],
      },
      {
        id: 'react-usecontext-and-hooks',
        kind: 'React concepts',
        topic: 'useContext and React hooks',
        question: 'What is useContext in React, and how would you use each of the React hooks?',
        sources: [AGODA_A32_SWE_2025],
        practice: { label: 'Which React hooks you have used, and when', path: '/react/trivia/react-hooks-youve-used' },
      },
      {
        id: 'website-load-steps',
        kind: 'Web fundamentals',
        topic: 'From website request to page load',
        question: 'What does your device go through from requesting a website until the page has loaded?',
        sources: [AGODA_A32_SWE_2025],
        practice: { label: 'How the browser parses and renders HTML', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'react-app-performance',
        kind: 'React concepts',
        topic: 'React application performance',
        question: 'How would you improve the performance of a React application?',
        sources: [AGODA_A32_SWE_2025],
        practice: { label: 'Why a component re-renders when its props did not change', path: '/react/trivia/react-rerender-decision-and-render' },
      },
      {
        id: 'flashcard-after-explaining-a-tool',
        kind: 'UI build',
        topic: 'Simple tool explanation and flashcard',
        question: 'Explain a tool from your own project as simply as you would to a child, then machine-code a flashcard.',
        sources: [AGODA_A6_FULL_STACK_2024],
      },
      {
        id: 'planes-stopped-before-landing',
        kind: 'Algorithm',
        topic: 'Stopping planes before landing',
        question: 'Planes descend at given speeds and you can shoot down one per second: find the most planes you can stop from landing.',
        sources: [AGODA_A6_FULL_STACK_2024],
      },
      {
        id: 'grid-paths-with-obstacles',
        kind: 'Algorithm',
        topic: 'Grid paths with obstacles',
        question: 'Count the paths a robot can take through a grid with obstacles, moving only right or down.',
        sources: [AGODA_A6_FULL_STACK_2024],
      },
    ],
    // Values-round topics from generic Staff loops are left out: the research record does not tie them to one URL each.
    behaviouralQuestions: [
      {
        id: 'speed-versus-maintainability',
        question: 'How do you balance shipping fast with quality and an architecture that stays maintainable?',
        sources: [AGODA_A2_GURGAON_2025, AGODA_A3_OFFER_2025],
      },
      {
        id: 'handling-conflict',
        question: 'How do you handle conflicts at work?',
        sources: [AGODA_A3_OFFER_2025],
      },
      {
        id: 'learning-from-production-issues',
        question: 'What have you learned from a production issue?',
        sources: [AGODA_A3_OFFER_2025],
      },
      {
        id: 'diverse-international-team',
        question: 'How do you work in a diverse, international team?',
        sources: [AGODA_A3_OFFER_2025],
      },
      {
        id: 'team-coding-practices',
        question: 'How do you make sure your team follows good coding practices?',
        sources: [AGODA_A2_GURGAON_2025],
      },
      {
        id: 'disagreeing-with-product-or-design',
        question: 'Have you disagreed with a product or design decision, and how did you handle it?',
        sources: [AGODA_A2_GURGAON_2025],
      },
      {
        id: 'mentoring-and-scaling-a-team',
        question: 'How do you mentor junior developers and help a team grow?',
        sources: [AGODA_A2_GURGAON_2025],
      },
      {
        id: 'future-of-frontend',
        question: 'Where do you think frontend development is heading over the next three to five years?',
        sources: [AGODA_A2_GURGAON_2025],
      },
      {
        id: 'most-challenging-project',
        question: 'Describe the most challenging project you have worked on.',
        sources: [AGODA_T3_MANILA_2024],
      },
      {
        id: 'problem-on-a-project',
        question: 'If you hit a problem on a project, how do you handle it: do you ask for help or solve it yourself?',
        sources: [AGODA_T2_FE_2024],
      },
      {
        id: 'career-journey',
        question: 'Walk through your career so far and the skills you bring.',
        sources: [AGODA_T4_SENIOR_FE_2024],
      },
    ],
  },
  shopee: {
    summary:
      'Shopee\'s How we hire page lists five steps (Apply, Getting to Know You, Putting Your Skills to the Test, Meet the Hiring Manager, Preparing to Join Us) and says the number of rounds varies with the role and seniority. The accounts behind this table describe four shapes: a Ho Chi Minh City frontend loop posted in 2025, with an HR call, a two-hour frontend round, a CS-fundamentals round, a behavioural interview and a final conversation; Singapore graduate loops from 2020 to 2022, with an online assessment, online rounds of 60 to 90 minutes on a shared editor and an HR call; Chinese-language campus and social-hire loops from 2019 to 2022, with two technical interviews and HR, run per department for the two social hires, and a written test for some campus roles in the reprinted posting; and two Taipei loops, with an HR call, a written test in 2021, interviews with the team, and a senior-manager chat in 2023.',
    caveat:
      'The Ho Chi Minh City table rests on one account and the Taipei table on two, one of them a senior software engineer whose account does not say the role was frontend. The Singapore table has one frontend first round beside three backend or platform graduates\' loops; no full account of a Singapore loop for experienced frontend engineers was found, so that loop has no table. Most accounts are from 2019 to 2022 and written in Chinese, and the accounts in the mainland-China table name no city. The question list adds LeetCode posts with online-assessment and interview problems from 2020 to 2022, kept for their algorithm and data-structure problems.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Front-end engineers, Ho Chi Minh City, 2025',
        note: 'One full account carries this table: a hire, posted on Viblo in February 2025 by a preparation course in the candidate\'s words, which gives no interview dates. The stage order rests on it alone.',
        stages: [
          {
            stage: 'HR call',
            format: 'Personal details, expected salary, why the candidate applied and whether they would move to Saigon.',
            appliesTo: 'Front-end engineers in the account',
            sources: [SHOPEE_S1_HCMC_2025],
          },
          {
            stage: 'Frontend technical round',
            format:
              'About two hours in four parts: CSS questions, JavaScript questions with an exercise, a React build and an algorithm. The open question, a Promise written without the Promise API, is the JavaScript exercise.',
            appliesTo: SHOPEE_FE_ROLE,
            sources: [SHOPEE_S1_HCMC_2025],
            practice: { label: 'Create a deferred promise', path: '/javascript/coding/js-create-deferred-promise' },
          },
          {
            stage: 'CS-fundamentals round',
            format:
              'A design discussion that starts from a system the candidate works on, then networking and security fundamentals. The candidate spent more than a week revising networking, operating systems and security for it.',
            appliesTo: SHOPEE_FE_ROLE,
            sources: [SHOPEE_S1_HCMC_2025],
          },
          {
            stage: 'Behavioural interview',
            format: 'After a pass notice a week later: how the candidate works, handles problems and communicates, and past difficulties.',
            appliesTo: 'Front-end engineers in the account',
            sources: [SHOPEE_S1_HCMC_2025],
            practice: { label: 'Behavioural stories', path: '/guides/behavioral/stories' },
          },
          {
            stage: 'Final conversation and offer',
            format: 'A light last round on future direction and expectations at Shopee, compared with the previous job. The offer came by email a few days later.',
            appliesTo: 'Candidates who pass',
            sources: [SHOPEE_S1_HCMC_2025],
          },
        ],
      },
      {
        title: 'Fresh graduates, Singapore, 2020 to 2022',
        note:
          'One frontend first round (Nowcoder, September 2020) plus three graduate loops in backend and platform roles for the assessment and round shape. No full account of an experienced frontend loop in Singapore was found.',
        stages: [
          {
            stage: 'Online assessment',
            format:
              'A 70-minute test in the 2022 account: ten multiple-choice questions on systems and networking, then two problems. A 2021 account had twenty-odd multiple-choice questions and one LeetCode problem, and a 2020 backend post names Glider.ai as the platform.',
            appliesTo: 'Backend and platform candidates in the accounts',
            sources: [SHOPEE_S37_MEDIUM_2022, SHOPEE_S39_PTT_2021, SHOPEE_S31_OA_2020],
          },
          {
            stage: 'Technical rounds on a shared editor',
            format:
              'One to three rounds of 60 to 90 minutes on a shared editor, mixing problems, CS fundamentals and design concepts. Two accounts name codebunk as the editor; the one frontend account, a 2020 first round, paired an algorithm problem with CSS, React and web questions.',
            appliesTo: 'Campus candidates in the accounts; the 2020 first round is the frontend one',
            sources: [SHOPEE_S6_SG_CAMPUS_2020, SHOPEE_S36_MEDIUM_2020, SHOPEE_S37_MEDIUM_2022, SHOPEE_S39_PTT_2021],
            practice: { label: 'Data structures and algorithms for frontend loops', path: '/guides/interview-blueprint/dsa-for-fe' },
          },
          {
            stage: 'HR call with a verbal offer',
            format:
              'A verbal offer from HR about five weeks after applying in the 2020 account, with material on living costs in Singapore. A 2022 loop ended in a rejection sixteen days after applying.',
            appliesTo: 'Candidates who pass',
            sources: [SHOPEE_S36_MEDIUM_2020, SHOPEE_S37_MEDIUM_2022],
          },
        ],
      },
      {
        title: 'Campus and social hires, mainland China, in Chinese, 2019 to 2022',
        note:
          'The official line comes from a campus posting for students graduating in 2027, in Beijing, Shanghai and Shenzhen, reprinted on a campus jobs site in April 2026. The accounts, written in Chinese on Juejin and Nowcoder, are campus loops from 2019 to 2021 and social-hire loops from 2020 and 2022, and none names its city; both social hires were re-interviewed by a second department.',
        stages: [
          {
            stage: 'Application or referral, then a written test',
            format:
              'An online application or a referral, then a written test that some roles skip, before two to three technical rounds. The campus posting writes it as 网申/内推 > 笔试（部分岗位不设笔试） > 2-3轮专业面试 > HR沟通 > Offer.',
            appliesTo: 'Campus candidates',
            sources: [SHOPEE_CHINA_CAMPUS_REPRINT],
          },
          {
            stage: 'First technical interview',
            format:
              'Quick questions on JavaScript, CSS, the browser, HTTP and Vue or React, then one to three short coding tasks. The 2019 account says the interviewer guides the candidate\'s thinking.',
            appliesTo: 'Front-end engineers, campus and social hires',
            sources: [
              SHOPEE_S3_JUEJIN_2020,
              SHOPEE_S4_NOWCODER_2022,
              SHOPEE_S7_CAMPUS_2020,
              SHOPEE_S8_CAMPUS_2020,
              SHOPEE_S9_CAMPUS_2021,
              SHOPEE_S10_CAMPUS_2019,
              SHOPEE_S11_CAMPUS_2020,
            ],
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Second technical interview',
            format:
              'Deeper framework, tooling and performance questions, scenarios, project depth and often a second coding task. The 2019 account had three questions only.',
            appliesTo: SHOPEE_FE_ROLE,
            sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_S7_CAMPUS_2020, SHOPEE_S10_CAMPUS_2019, SHOPEE_S11_CAMPUS_2020],
          },
          {
            stage: 'HR interview and offer',
            format:
              'The posting lists an HR conversation (HR沟通) before the offer. In the social-hire accounts the loop runs per department, sometimes both technical rounds and HR on one day; a rejection after the first round can come back with feedback such as 算法有待加强 (algorithms need strengthening), and a second department can re-interview the same candidate.',
            appliesTo: 'Campus and social-hire candidates',
            sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_CHINA_CAMPUS_REPRINT],
          },
        ],
      },
      {
        title: 'Front-end and software engineers, Taipei, 2021 to 2023',
        note:
          'Two accounts on GoodJob carry this table: a frontend engineer with four years of experience in January 2021, who heard nothing after the panels, and a senior software engineer who received an offer in June 2023, whose account does not say the role was frontend.',
        stages: [
          {
            stage: 'HR phone screen',
            format: 'A 30-minute HR call on background and the job in the 2021 account; the 2023 account lists an HR conversation first.',
            appliesTo: 'Both accounts',
            sources: [SHOPEE_S5_TAIPEI_2021, SHOPEE_S23_TAIPEI_2023],
          },
          {
            stage: 'Onsite written test',
            format: 'A 90-minute written test on site: seven questions on JavaScript, CSS and React, rated junior level by the candidate.',
            appliesTo: 'Front-end engineers (2021 account)',
            sources: [SHOPEE_S5_TAIPEI_2021],
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Team interviews',
            format:
              'In 2021, two panels on the day of the test with a product manager and a tech lead, four interviewers in all. They asked practical and behavioural questions and, in the candidate\'s words, cared a lot about communication and little about algorithms; the 2023 account had a manager round on technology, then a peer round.',
            appliesTo: 'Both accounts',
            sources: [SHOPEE_S5_TAIPEI_2021, SHOPEE_S23_TAIPEI_2023],
          },
          {
            stage: 'Senior-manager conversation',
            format: 'A last round with a senior manager, mostly a chat, in the 2023 account.',
            appliesTo: 'Senior software engineers (2023 account)',
            sources: [SHOPEE_S23_TAIPEI_2023],
          },
        ],
      },
    ],
    // Rows merge accounts that report the same question; a row's round is the stage its first source asked it in, and
    // the question says where the others asked it. LeetCode posts whose rounds match no stage (SH30's Singapore onsite
    // for an experienced engineer, SH34) carry no round. Left out by content: security protocols (HTTPS and TLS
    // handshakes, encryption, man-in-the-middle), network internals (TCP and UDP, network layers, gateways and load
    // balancers), operating systems (processes and threads, deadlock), databases and backend design, Java and C
    // specifics, and the Ho Chi Minh City round's design of a system from the candidate's own work, which the account
    // ties to gateways, load balancers and databases. Left out for want of a subject: problems and rounds the accounts
    // name only by count or difficulty, and a 2020 question written "CSPF". Left out as screening: salary,
    // self-introductions, "have you used Vuex?". Not cited: Glassdoor and 1point3acres snippets, unreadable Zhihu posts,
    // a bagujing.com question aggregator reposted on Nowcoder, and a 2022 Code360 loop for an analyst role.
    questions: [
      {
        id: 'promise-without-promise',
        round: 'Frontend technical round',
        kind: 'JavaScript',
        topic: 'Promise without the Promise API',
        question:
          'Write your own Promise without using the built-in Promise: the exercise in the JavaScript part of a two-hour frontend round, after questions on how asynchronous code runs.',
        sources: [SHOPEE_S1_HCMC_2025],
        practice: { label: 'Create a deferred promise', path: '/javascript/coding/js-create-deferred-promise' },
        answerGuide: 'promise-without-promise',
      },
      {
        id: 'recursive-hover-menu',
        round: 'Frontend technical round',
        kind: 'React build',
        topic: 'Recursive multi-level hover menu',
        question:
          'Build a multi-level menu in React: hovering an item drops down its sub-menu, and a sub-menu with children of its own opens in turn. The candidate called it a recursion exercise.',
        sources: [SHOPEE_S1_HCMC_2025],
        practice: { label: 'File explorer tree with keyboard navigation', path: '/react/coding/react-file-explorer' },
        answerGuide: 'recursive-hover-menu-react',
      },
      {
        id: 'css-position-values',
        round: 'Frontend technical round',
        kind: 'Web fundamentals',
        topic: 'CSS position values',
        question: 'Explain the CSS position values, fixed, absolute and sticky among them, in the opening CSS part of the round.',
        sources: [SHOPEE_S1_HCMC_2025],
        practice: { label: 'Positioning: relative and absolute badge', path: '/css/coding/css-positioning-badge' },
      },
      {
        id: 'event-loop-promises-async',
        round: 'Frontend technical round',
        kind: 'JavaScript',
        topic: 'Event loop, promises and async/await',
        question:
          'Questions that went deep into the event loop, promises and async/await, in the JavaScript part of the round before the Promise exercise; the account does not give them.',
        promptNotShared: true,
        sources: [SHOPEE_S1_HCMC_2025],
        practice: { label: 'JavaScript event loop visualizer', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'character-mapping-two-sets',
        round: 'Frontend technical round',
        kind: 'Algorithm',
        topic: 'Character mapping between two sets',
        question: 'An algorithm problem at the end of the round about mapping characters between two sets of data; the candidate did not recall the exact statement.',
        promptNotShared: true,
        sources: [SHOPEE_S1_HCMC_2025],
      },
      {
        id: 'http-and-websocket',
        round: 'CS-fundamentals round',
        kind: 'Web fundamentals',
        topic: 'HTTP and WebSocket',
        question:
          'Questions that went deep into HTTP and WebSocket, in a round that also covered TCP and UDP, API gateways, load balancers, encryption, hashing and encoding.',
        promptNotShared: true,
        sources: [SHOPEE_S1_HCMC_2025],
        practice: { label: 'SSE versus WebSocket', path: '/javascript/trivia/sse-vs-websocket-real-time' },
      },
      {
        id: 'implement-new-operator',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Implementing the new operator',
        question:
          'Explain what the new operator does and implement it as a function. A 2022 social hire was asked about new in the first rounds of two departments.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Implement the new operator', path: '/javascript/coding/js-implement-new' },
        answerGuide: 'function-cache-flatten-deep-clone-new',
      },
      {
        id: 'http-message-for-post',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Writing an HTTP message',
        question:
          'Given a URL and the response body of a POST, write out the HTTP message, request and response headers included: the first question of a 2022 digital-bank frontend round.',
        sources: [SHOPEE_S4_NOWCODER_2022],
        answerGuide: 'http-caching-cookie-security-hour',
      },
      {
        id: 'strong-and-negotiated-caching',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Strong and negotiated HTTP caching',
        question:
          'Explain HTTP caching: strong versus negotiated caching, the headers behind each (If-None-Match and If-Modified-Since among them) and the status code each returns. Under one 2020 account a commenter whose profile names Shopee frontend said the candidate had the two the wrong way round.',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S3_JUEJIN_2020, SHOPEE_S8_CAMPUS_2020],
        practice: { label: 'HTTP caching basics', path: '/javascript/trivia/http-caching-basics' },
        answerGuide: 'http-caching-cookie-security-hour',
      },
      {
        id: 'cookie-attributes-samesite',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Cookie attributes and SameSite',
        question:
          'What attributes can a cookie carry? Explain HttpOnly and Secure, the current default of SameSite, and why its Strict value exists.',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Cookie attributes', path: '/javascript/trivia/js-cookie-options' },
        answerGuide: 'http-caching-cookie-security-hour',
      },
      {
        id: 'csrf-and-xss',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'CSRF and XSS attacks',
        question:
          'How do CSRF and XSS attacks work, and how do you defend against each? In 2022 the question grew out of the SameSite attribute; a 2020 round asked about CSRF alone.',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S7_CAMPUS_2020, SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
        answerGuide: 'http-caching-cookie-security-hour',
      },
      {
        id: 'same-origin-cross-origin',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Same-origin policy and cross-origin requests',
        question:
          'Explain the same-origin policy and how to make a cross-origin request work. A 2020 campus round added what the policy restricts and whether two subdomains, or one page with two different hash fragments, count as different origins.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Handling CORS in a frontend app', path: '/javascript/trivia/js-secure-cors-handling' },
        answerGuide: 'http-caching-cookie-security-hour',
      },
      {
        id: 'simple-and-preflighted-requests',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Simple and preflighted requests',
        question: 'What separates a simple cross-origin request from one that needs a preflight, and what is the OPTIONS method for?',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022],
        answerGuide: 'http-caching-cookie-security-hour',
      },
      {
        id: 'id-number-in-cookie',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Sensitive data in a cookie',
        question: 'If a user\'s identity card number has to be carried in a cookie, how do you keep it safe in transit?',
        sources: [SHOPEE_S4_NOWCODER_2022],
        answerGuide: 'http-caching-cookie-security-hour',
      },
      {
        id: 'deep-clone',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Deep clone',
        question:
          'Write a deep clone by hand, one of two coding tasks at the end of a 2020 first round that had also asked which ways of deep copying exist.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Deep clone', path: '/javascript/coding/js-deep-clone' },
        answerGuide: 'function-cache-flatten-deep-clone-new',
      },
      {
        id: 'flatten-nested-array',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Flattening a nested array',
        question: 'Flatten a nested array: the other coding task at the end of the same 2020 first round.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Flatten with depth', path: '/javascript/coding/js-flatten-depth' },
        answerGuide: 'function-cache-flatten-deep-clone-new',
      },
      {
        id: 'arrow-and-regular-functions',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Arrow and regular functions',
        question:
          'How does an arrow function differ from a regular function, and can you call new on one? A 2022 round followed up with an output question in which apply tries to change this inside an arrow function.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_S8_CAMPUS_2020],
        practice: { label: 'Arrow versus regular functions', path: '/javascript/trivia/js-arrow-vs-regular-functions' },
      },
      {
        id: 'this-binding',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'The this keyword',
        question: 'Where does this point in a function, and where in an arrow function? The candidate recalled an output question on it but not its code.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Why this is undefined in a callback', path: '/javascript/trivia/js-this-keyword' },
      },
      {
        id: 'microtasks-and-macrotasks',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Microtasks and macrotasks',
        question:
          'Explain the event loop: does a microtask always run before a macrotask? The same candidate\'s other first round added an event-loop output question they did not recall.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Microtasks versus macrotasks', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
      },
      {
        id: 'microtasks-inside-microtasks',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Microtasks queued inside microtasks',
        question:
          'An event-loop question the candidate summed up as microtasks queued inside microtasks and inside macrotasks, falling into an endless loop.',
        sources: [SHOPEE_S7_CAMPUS_2020],
        practice: { label: 'Predict the output of a nested microtask', path: '/javascript/trivia/js-event-loop-nested-microtask-output' },
      },
      {
        id: 'promise-executor-order',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Promise executor output order',
        question: 'Predict the order of the logs when a promise executor logs, resolves and logs again, and a then callback logs last.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'JavaScript event loop visualizer', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'chained-assignment-typeof',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Chained assignment and typeof',
        question: 'Inside an immediately invoked function, const a = b = 1. Outside it, what do typeof a and typeof b return, and why?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Null, undefined and undeclared', path: '/javascript/trivia/js-null-undefined-undeclared' },
      },
      {
        id: 'promise-await-try-catch-output',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Promise output with await and try/catch',
        question: 'A promise output question involving await and try/catch, on which the candidate got one log wrong; the code was not recalled.',
        promptNotShared: true,
        sources: [SHOPEE_S4_NOWCODER_2022],
      },
      {
        id: 'prototype-inheritance-output',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Prototype inheritance output',
        question: 'An output question on prototype objects and inheritance; the code was not recalled.',
        promptNotShared: true,
        sources: [SHOPEE_S4_NOWCODER_2022],
        practice: { label: 'Prototypal inheritance', path: '/javascript/trivia/js-prototypal-inheritance' },
      },
      {
        id: 'prototype-chain-to-null',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Walking the prototype chain',
        question:
          'How do you find an object\'s prototype, a function\'s prototype, and the prototype of a constructor treated as an object, following each chain all the way to null?',
        sources: [SHOPEE_S4_NOWCODER_2022],
        practice: { label: 'prototype versus __proto__', path: '/javascript/trivia/js-prototype-vs-proto' },
      },
      {
        id: 'instanceof-internals',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'How instanceof works',
        question: 'Explain how instanceof works under the hood.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Implement instanceof', path: '/javascript/coding/js-implement-instanceof' },
      },
      {
        id: 'data-types-and-checks',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Data types and type checks',
        question: 'Which data types does JavaScript have, and how do you check a value\'s type? A 2020 campus account was asked this in its second round.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Data types, typeof and NaN checks', path: '/javascript/trivia/js-check-data-type-with-typeof' },
      },
      {
        id: 'var-let-const',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Differences between var, let and const',
        question: 'How do var, let and const differ, and when does a variable become a property of window?',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'where-variables-live',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Where JavaScript stores variables',
        question: 'Where are a function\'s variables kept, and how are primitive values and objects stored in memory?',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'scope-chain-execution-context',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Scope, scope chain and execution context',
        question: 'Which kinds of scope are there, when is the scope chain fixed, and what is an execution context?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Block scope or function scope', path: '/javascript/trivia/js-block-scoped-or-function-scoped' },
      },
      {
        id: 'call-and-apply',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Difference between call and apply',
        question: 'How do call and apply differ?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'call, apply and bind', path: '/javascript/trivia/js-call-apply-bind' },
      },
      {
        id: 'event-delegation',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Event delegation',
        question: 'Explain event delegation.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Bubbling, capturing and event delegation', path: '/javascript/trivia/js-event-delegation' },
      },
      {
        id: 'target-and-current-target',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Event target and currentTarget',
        question: 'What is the difference between e.target and e.currentTarget?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'cookie-and-web-storage',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Cookies, localStorage and sessionStorage',
        question:
          'How do cookies, localStorage and sessionStorage differ? A 2021 Taipei panel asked about the same three, along with the details of using cookies.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S5_TAIPEI_2021],
        practice: { label: 'Cookie, sessionStorage and localStorage', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
      },
      {
        id: 'xhr-with-credentials',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Sending cookies with XMLHttpRequest',
        question: 'Which XMLHttpRequest property makes a request carry cookies automatically?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'url-to-page',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'What happens after typing a URL',
        question:
          'What happens after you type a URL into the browser? A 2022 Singapore graduate round took it through the network: how DNS is organised and resolves a name, and how HTTP works.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S37_MEDIUM_2022],
      },
      {
        id: 'browser-rendering',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'How the browser renders a page',
        question:
          'How does the browser render a page from HTML, CSS and JavaScript? Asked in a 2020 first round, a 2020 second round and a 2021 Taipei account\'s question list.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S5_TAIPEI_2021, SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'How browsers parse and render HTML', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'script-defer-async',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Script defer and async',
        question: 'What do the defer and async attributes do on a script tag?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Deferred scripts', path: '/javascript/trivia/js-deferred-scripts' },
      },
      {
        id: 'http2-and-keep-alive',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'HTTP/2 and keep-alive',
        question:
          'What does HTTP/2 add over HTTP/1.1? When one candidate named multiplexing, the interviewer asked how it differs from keep-alive, which also reuses a connection.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S7_CAMPUS_2020],
      },
      {
        id: 'css-centring',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Centring horizontally and vertically',
        question: 'How do you centre an element horizontally and vertically? The 2021 Taipei written test asked for three ways.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S8_CAMPUS_2020, SHOPEE_S5_TAIPEI_2021],
        practice: { label: 'Display and centring', path: '/css/coding/css-inline-centering' },
        answerGuide: 'written-test-and-css-questions',
      },
      {
        id: 'display-none-and-visibility-hidden',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Display none versus visibility hidden',
        question: 'What is the difference between display: none and visibility: hidden?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'visibility: hidden versus display: none', path: '/css/trivia/css-visibility-vs-display' },
      },
      {
        id: 'es6-features-used',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'ES6 features in daily use',
        question: 'Which ES6 features do you use?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'newer-web-technologies',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Newer web technologies',
        question: 'Which current web technologies do you know, such as service workers?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'vue-and-react-compared',
        round: 'First technical interview',
        kind: 'React concepts',
        topic: 'Vue and React compared',
        question:
          'How well do you know React, and what is the biggest difference between Vue and React? The same candidate\'s second round asked how the two differ again.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Vue reactivity and React concepts', path: '/vue/trivia/vue-reactivity-vs-react-concepts' },
      },
      {
        id: 'vue-two-way-binding',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'How Vue two-way binding works',
        question: 'How is Vue\'s two-way data binding implemented?',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S8_CAMPUS_2020],
        practice: { label: 'The Vue reactivity system', path: '/vue/trivia/vue-reactivity-system' },
      },
      {
        id: 'vue-computed-and-watch',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'Vue computed and watch',
        question: 'How do computed properties and watchers differ in Vue?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Computed versus watch', path: '/vue/trivia/vue-computed-vs-watchers' },
      },
      {
        id: 'vue-lifecycle-dom',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'Vue lifecycle and DOM access',
        question: 'Walk through Vue\'s lifecycle hooks. From which one can you reach the DOM?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Vue lifecycle hooks', path: '/vue/trivia/vue-lifecycle-hooks' },
      },
      {
        id: 'vue-mixin-merge',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'Vue mixin merge strategy',
        question: 'When a mixin and a component both define created and data, how does Vue merge them?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Composition API versus mixins', path: '/vue/trivia/vue-composition-api-vs-mixins' },
      },
      {
        id: 'vue-attrs-and-props',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'Vue $attrs and $props',
        question: 'What is the difference between $attrs and $props in Vue?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'vue-list-keys',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'Keys in Vue lists',
        question: 'What is the key attribute for in Vue?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Keys in v-for', path: '/vue/trivia/vue-v-for-keys' },
      },
      {
        id: 'vue-array-methods',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'How Vue implements array methods',
        question: 'Do you know how Vue implements its array methods?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'vue-component-communication',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'Vue component communication',
        question: 'What are the ways Vue components communicate?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Provide and inject versus prop drilling', path: '/vue/trivia/vue-provide-inject-vs-prop-drilling-tradeoffs' },
      },
      {
        id: 'v-if-and-v-show',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'Vue v-if and v-show',
        question: 'What are v-if and v-show, and how do they differ?',
        sources: [SHOPEE_S8_CAMPUS_2020],
        practice: { label: 'v-show versus v-if', path: '/vue/trivia/vue-v-show-vs-v-if-dom-lifecycle' },
      },
      {
        id: 'vuex-internals',
        round: 'First technical interview',
        kind: 'Vue concepts',
        topic: 'How Vuex works',
        question: 'How does Vuex work, and is a Vuex getter any different from a plain function?',
        sources: [SHOPEE_S4_NOWCODER_2022],
        practice: { label: 'What Vuex is for', path: '/vue/trivia/vuex-state-management' },
      },
      {
        id: 'vue-dialog-on-demand',
        round: 'First technical interview',
        kind: 'UI build',
        topic: 'Vue dialog created on demand',
        question:
          'In Vue, write a vertically centred dialog that is not mounted as a component in the template but created when it is needed, through a createDialog call; the interviewer had Vue.extend in mind.',
        sources: [SHOPEE_S4_NOWCODER_2022],
      },
      {
        id: 'react-one-way-data-flow',
        round: 'First technical interview',
        kind: 'React concepts',
        topic: 'React one-way data flow',
        question: 'What does React\'s one-way data flow mean?',
        sources: [SHOPEE_S7_CAMPUS_2020],
        practice: { label: 'Why React enforces one-way data flow', path: '/react/trivia/react-one-way-data-flow' },
      },
      {
        id: 'higher-order-components',
        round: 'First technical interview',
        kind: 'React concepts',
        topic: 'Higher-order components',
        question: 'What is a higher-order component, what does it give you, and why use one?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Higher-order components', path: '/react/trivia/react-higher-order-components' },
      },
      {
        id: 'component-communication',
        round: 'First technical interview',
        kind: 'React concepts',
        topic: 'Communication between components',
        question: 'How do components communicate with each other? Asked right after the question on higher-order components.',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Lifting state up', path: '/react/trivia/react-lifting-state-up' },
      },
      {
        id: 'browser-tabs-and-processes',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Browser tabs and processes',
        question:
          'Is each browser tab a process or a thread? One account followed up: why does opening a tab start a process, do processes affect each other, and does a crashing tab take the others down?',
        sources: [SHOPEE_S11_CAMPUS_2020, SHOPEE_S7_CAMPUS_2020],
      },
      {
        id: 'repaint-and-reflow',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Repaint and reflow',
        question: 'What is the difference between repaint and reflow, and how do you reduce them?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Reflow and repaint', path: '/javascript/trivia/js-repaint-reflow' },
      },
      {
        id: 'collapsing-margins',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Collapsing margins',
        question: 'When two vertical margins collapse into one, how do you stop it?',
        sources: [SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'clearing-floats',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Clearing floats',
        question: 'How do you clear floats, and where does the pseudo-element go when you clear with one?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Float and clear', path: '/css/trivia/css-float-clear' },
      },
      {
        id: 'flexbox-drawbacks-ie',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Flexbox drawbacks and Internet Explorer',
        question: 'What are the drawbacks of a flex layout, and how do you handle Internet Explorer, which does not fully support it?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'What display: flex does', path: '/css/trivia/css-display-flex' },
      },
      {
        id: 'layout-in-your-project',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Layout method in your project',
        question: 'Which layout method does your project use? The candidate answered flexbox and explained it.',
        sources: [SHOPEE_S9_CAMPUS_2021],
      },
      {
        id: 'axios-and-ajax',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Axios compared with Ajax',
        question: 'You used axios: how does it differ from Ajax?',
        sources: [SHOPEE_S9_CAMPUS_2021],
      },
      {
        id: 'what-promises-are-for',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'What promises are for',
        question: 'You mentioned promises: what exactly are they for?',
        sources: [SHOPEE_S9_CAMPUS_2021],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'same-origin-iframe-messaging',
        round: 'First technical interview',
        kind: 'Web fundamentals',
        topic: 'Messaging a same-origin iframe',
        question: 'A page holds a same-origin iframe: how can the two communicate? The candidate offered postMessage and cookies and was asked for more.',
        sources: [SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'reverse-a-string',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Reversing a string',
        question: 'Reverse a string, giving as many different solutions as you can.',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Reverse a string', path: '/javascript/coding/js-reverse-string' },
      },
      {
        id: 'balanced-brackets',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Balanced brackets',
        question: 'Given a string with three kinds of brackets, check whether every bracket is closed correctly.',
        sources: [SHOPEE_S4_NOWCODER_2022],
        practice: { label: 'Valid parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'publish-subscribe',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Publish-subscribe function',
        question: 'Write a publish-subscribe function, the second coding task of the same 2022 first round.',
        sources: [SHOPEE_S4_NOWCODER_2022],
        practice: { label: 'Event emitter', path: '/javascript/coding/js-event-emitter-mini' },
      },
      {
        id: 'reverse-list-in-k-groups',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Reversing a linked list in k-groups',
        question: 'Reverse a linked list in groups of k nodes. The HR feedback afterwards said the candidate\'s algorithms needed strengthening.',
        sources: [SHOPEE_S4_NOWCODER_2022],
      },
      {
        id: 'thousands-separator',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Thousands separators',
        question: 'Format a number with a comma between every group of three digits.',
        sources: [SHOPEE_S7_CAMPUS_2020],
      },
      {
        id: 'queues-and-stacks',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Queues and stacks',
        question: 'What are queues and stacks, and how do they differ?',
        sources: [SHOPEE_S8_CAMPUS_2020],
        practice: { label: 'Stack versus queue', path: '/javascript/trivia/js-queue-vs-stack' },
      },
      {
        id: 'sorting-algorithms-complexity',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Sorting algorithms and their complexity',
        question:
          'Which sorting algorithms do you know, and what are their time complexities? One 2020 account went on to quicksort: its space and time complexity, its stopping condition, and its best and worst cases.',
        sources: [SHOPEE_S8_CAMPUS_2020, SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Big-O notation', path: '/javascript/trivia/js-big-o-notation' },
      },
      {
        id: 'count-smaller-elements',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Counting smaller elements',
        question: 'For each element of an array, count how many elements are smaller than it: [8, 1, 2, 2, 3] gives [4, 0, 1, 1, 3].',
        sources: [SHOPEE_S8_CAMPUS_2020],
      },
      {
        id: 'promise-chain-throw-catch',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Promise chain with throw and catch',
        question: 'Predict the logs of a long promise chain that alternates then, throw and catch; the candidate reconstructed it only roughly.',
        sources: [SHOPEE_S8_CAMPUS_2020],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'binary-search',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Binary search',
        question: 'Write a binary search.',
        sources: [SHOPEE_S9_CAMPUS_2021],
      },
      {
        id: 'two-set-intersection',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Intersection of two integer sets',
        question: 'Find the numbers two sets of integers have in common, then improve on a first answer that runs in O(n²).',
        sources: [SHOPEE_S9_CAMPUS_2021],
      },
      {
        id: 'quicksort',
        round: 'First technical interview',
        kind: 'Algorithm',
        topic: 'Quicksort',
        question: 'Write quicksort, the third coding task of the same round.',
        sources: [SHOPEE_S9_CAMPUS_2021],
      },
      {
        id: 'flat-records-to-tree',
        round: 'First technical interview',
        kind: 'JavaScript',
        topic: 'Flat records into a nested tree',
        question:
          'A coding task the candidate links to rather than restates: turn flat records of province, city and place into a nested tree of values and children for a cascading selector.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
      },
      {
        id: 'function-cache',
        round: 'Second technical interview',
        kind: 'JavaScript',
        topic: 'Function cache keyed by arguments',
        question:
          'Write cache(f) so that f2 = cache(f1) returns at once on a repeat call with the same arguments, objects included, where f1 takes 1000 seconds. A 2022 second round set a function cache as its coding task too.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
        answerGuide: 'function-cache-flatten-deep-clone-new',
      },
      {
        id: 'webpack-performance-lazy-loading',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Webpack performance and lazy loading',
        question:
          'How do you improve webpack performance, and how do you load components asynchronously, on demand? A 2022 second round opened with this.',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'webpack-versions-and-vite',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Webpack 4, webpack 5 and Vite',
        question: 'Have you used webpack 5 or Vite? What changed from webpack 4 to webpack 5?',
        sources: [SHOPEE_S4_NOWCODER_2022],
      },
      {
        id: 'many-svg-requests',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Optimising many SVG requests',
        question: 'A page makes 50 requests for SVG images: how do you optimise them?',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'network-request-optimisation',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Optimising network requests',
        question: 'How do you optimise a page\'s HTTP requests, and have you done frontend network optimisation in your own work?',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022],
      },
      {
        id: 'cdn-and-origin',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'CDNs and fetches from the origin',
        question:
          'What does a CDN do, and what happens when it has to go back to the origin? A 2020 first round asked whether the candidate knew CDNs.',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'CDN and HTTP caching for frontend delivery', path: '/javascript/trivia/content-delivery-caching-strategies-streaming' },
      },
      {
        id: 'html2canvas-internals',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'How html2canvas works',
        question: 'You used html2canvas in a project: how does the library work?',
        sources: [SHOPEE_S4_NOWCODER_2022],
      },
      {
        id: 'component-render-optimisation',
        round: 'Second technical interview',
        kind: 'React concepts',
        topic: 'Render optimisation in components',
        question: 'How do you optimise rendering when you write components? A 2020 campus round asked how to optimise React\'s performance.',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Why a component re-renders', path: '/react/trivia/react-rerender-decision-and-render' },
      },
      {
        id: 'web-performance-optimisation',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Web performance optimisation',
        question: 'What are the common ways to optimise a web page\'s performance? Asked in two second rounds and a first round.',
        sources: [SHOPEE_S7_CAMPUS_2020, SHOPEE_S11_CAMPUS_2020, SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Optimise load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'caching-requests-in-the-browser',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Caching requests in the browser',
        question:
          'How would you cache HTTP requests in the browser? After a service worker, the interviewer asked for an option without one, then one without the size limit of localStorage.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Storage TTL cache', path: '/javascript/coding/js-storage-ttl-cache' },
      },
      {
        id: 'async-await-errors',
        round: 'Second technical interview',
        kind: 'JavaScript',
        topic: 'Catching errors in async/await',
        question: 'How do you catch errors with async and await?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'When a Promise beats async/await', path: '/javascript/trivia/js-async-await-example-when-promise-is-preferred' },
      },
      {
        id: 'promise-resolved-with-rejection',
        round: 'Second technical interview',
        kind: 'JavaScript',
        topic: 'Promise resolved with a rejected promise',
        question:
          'Name the common ways to handle asynchronous code, then predict the output when a promise is resolved with Promise.reject() and has both a then and a catch attached.',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'vue-router-internals',
        round: 'Second technical interview',
        kind: 'Vue concepts',
        topic: 'How Vue Router works',
        question: 'How does Vue Router work under the hood?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Vue Router navigation', path: '/vue/trivia/vue-router-navigation' },
      },
      {
        id: 'schema-driven-forms',
        round: 'Second technical interview',
        kind: 'Frontend system design',
        topic: 'Schema-driven back-office forms',
        question: 'Questions about schemas for back-office forms; the account names the subject only.',
        promptNotShared: true,
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'frontend-security-overview',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Frontend security',
        question: 'How much do you know about frontend security?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'recursive-print-complexity',
        round: 'Second technical interview',
        kind: 'Algorithm',
        topic: 'Cost of a recursive loop',
        question: 'A function loops n times and calls itself with n - 1 on each pass: how many lines does it print, and what is its time complexity?',
        sources: [SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Big-O notation', path: '/javascript/trivia/js-big-o-notation' },
      },
      {
        id: 'react-introduction',
        round: 'Second technical interview',
        kind: 'React concepts',
        topic: 'Introducing React',
        question: 'Introduce React in your own words.',
        sources: [SHOPEE_S7_CAMPUS_2020],
        practice: { label: 'The problem React solves', path: '/react/trivia/react-core-problem-and-non-goals' },
      },
      {
        id: 'react-diffing',
        round: 'Second technical interview',
        kind: 'React concepts',
        topic: 'React diffing algorithm',
        question: 'How does React\'s diff algorithm work?',
        sources: [SHOPEE_S7_CAMPUS_2020],
        practice: { label: 'Reconciliation, keys and element type', path: '/react/trivia/react-diffing-algorithm' },
      },
      {
        id: 'common-status-codes',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Common HTTP status codes',
        question: 'Which HTTP status codes come up most, and is it better for a site to return more 304 responses or fewer?',
        sources: [SHOPEE_S7_CAMPUS_2020],
      },
      {
        id: 'unclickable-button',
        round: 'Second technical interview',
        kind: 'UI debugging',
        topic: 'A button users cannot click',
        question: 'Users report that a button cannot be clicked: how do you handle it, and what would you do next time? The interviewer hinted at performance and security.',
        sources: [SHOPEE_S7_CAMPUS_2020],
      },
      {
        id: 'request-animation-frame',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'When requestAnimationFrame runs',
        question: 'Why does requestAnimationFrame help performance, and when does it run relative to the browser\'s repaint?',
        sources: [SHOPEE_S7_CAMPUS_2020],
      },
      {
        id: 'position-fixed-failure',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'When fixed positioning stops working',
        question: 'What values can position take, and why might position: fixed stop working?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Relative, absolute and fixed positioning', path: '/css/trivia/css-position-relative-absolute-fixed' },
      },
      {
        id: 'trim-a-string',
        round: 'Second technical interview',
        kind: 'JavaScript',
        topic: 'Trimming a string by hand',
        question: 'Remove the spaces at the start and the end of a string.',
        sources: [SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'two-sum',
        round: 'Second technical interview',
        kind: 'Algorithm',
        topic: 'Two sum',
        question: 'Solve two sum: find two numbers in an array that add up to a target.',
        sources: [SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'list-to-tree',
        round: 'Second technical interview',
        kind: 'JavaScript',
        topic: 'Converting a list into a tree',
        question: 'Convert a flat list into a tree structure.',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
      },
      {
        id: 'react-lifecycle',
        round: 'Second technical interview',
        kind: 'React concepts',
        topic: 'React lifecycle',
        question: 'Walk through the React component lifecycle.',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'Function versus class components', path: '/react/trivia/react-functional-vs-class-components' },
      },
      {
        id: 'react-routing',
        round: 'Second technical interview',
        kind: 'React concepts',
        topic: 'Routing with React Router',
        question: 'How does routing work in React, and how does React Router handle it?',
        sources: [SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'frontend-engineering',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Frontend engineering practice',
        question:
          'Questions on frontend engineering (前端工程化), the tooling and process around building and shipping a frontend; the account names the subject only.',
        promptNotShared: true,
        sources: [SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'rem-units',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'How rem units work',
        question: 'How does the rem unit work?',
        sources: [SHOPEE_S11_CAMPUS_2020],
        practice: { label: 'em, rem, % and px', path: '/css/trivia/css-units-em-rem-percent-px' },
      },
      {
        id: 'base64-images',
        round: 'Second technical interview',
        kind: 'Web fundamentals',
        topic: 'Limits of base64 images',
        question: 'Why not inline every image as base64?',
        sources: [SHOPEE_S11_CAMPUS_2020],
      },
      {
        id: 'sort-and-dedupe-descending',
        round: 'Onsite written test',
        kind: 'JavaScript',
        topic: 'Sorting and deduplicating an array',
        question: 'In the written test: sort an array in descending order and remove its duplicate elements.',
        sources: [SHOPEE_S5_TAIPEI_2021],
        practice: { label: 'Sort numbers with Array.prototype.sort', path: '/javascript/coding/js-array-sort' },
        answerGuide: 'written-test-and-css-questions',
      },
      {
        id: 'css-specificity',
        round: 'Onsite written test',
        kind: 'Web fundamentals',
        topic: 'CSS specificity rules',
        question: 'State the rules of CSS specificity. A 2020 Singapore campus first round asked about selector priority too.',
        sources: [SHOPEE_S5_TAIPEI_2021, SHOPEE_S6_SG_CAMPUS_2020],
        practice: { label: 'Cascade, specificity and !important', path: '/css/trivia/css-cascade-order' },
        answerGuide: 'written-test-and-css-questions',
      },
      {
        id: 'shallow-and-deep-copy',
        round: 'Onsite written test',
        kind: 'JavaScript',
        topic: 'Shallow and deep copies',
        question: 'Explain the difference between a shallow copy and a deep copy. A 2020 first round asked the same.',
        sources: [SHOPEE_S5_TAIPEI_2021, SHOPEE_S3_JUEJIN_2020],
        practice: { label: 'Shallow copy versus deep copy', path: '/javascript/trivia/js-shallow-vs-deep-copy' },
        answerGuide: 'written-test-and-css-questions',
      },
      {
        id: 'css-at-scale',
        round: 'Onsite written test',
        kind: 'Web fundamentals',
        topic: 'Managing CSS at scale',
        question: 'How do you manage CSS in a large application? The test left the answer open.',
        sources: [SHOPEE_S5_TAIPEI_2021],
        answerGuide: 'written-test-and-css-questions',
      },
      {
        id: 'class-component-optimisation',
        round: 'Onsite written test',
        kind: 'React debugging',
        topic: 'Optimising a class component',
        question: 'Optimise or debug a React class component given in the test; the answer was left open.',
        sources: [SHOPEE_S5_TAIPEI_2021],
        practice: { label: 'Function versus class components', path: '/react/trivia/react-functional-vs-class-components' },
        answerGuide: 'written-test-and-css-questions',
      },
      {
        id: 'timers-in-a-var-loop',
        round: 'Onsite written test',
        kind: 'JavaScript',
        topic: 'Timers inside a var loop',
        question:
          'What does this log: a for loop with var i over a three-element array, where each pass sets a three-second timeout that logs i and arr[i]?',
        sources: [SHOPEE_S5_TAIPEI_2021],
        practice: { label: 'Block scope or function scope', path: '/javascript/trivia/js-block-scoped-or-function-scoped' },
        answerGuide: 'written-test-and-css-questions',
      },
      {
        id: 'computing-load-placement',
        kind: 'Frontend system design',
        topic: 'Frontend or backend for computation',
        question: 'Should computing load sit on the frontend or the backend?',
        sources: [SHOPEE_S5_TAIPEI_2021],
      },
      {
        id: 'word-abbreviation',
        round: 'Technical rounds on a shared editor',
        kind: 'Algorithm',
        topic: 'Abbreviating long words',
        question:
          'Shorten each word of four or more letters to its first letter, the number of letters in between and its last letter, so elephant-walk becomes e6t-w2k.',
        sources: [SHOPEE_S6_SG_CAMPUS_2020],
      },
      {
        id: 'js-animation-and-css-transform',
        round: 'Technical rounds on a shared editor',
        kind: 'Web fundamentals',
        topic: 'JavaScript animation and CSS transforms',
        question: 'Why is JavaScript animation slower than a CSS transform?',
        sources: [SHOPEE_S6_SG_CAMPUS_2020],
        practice: { label: 'Hardware acceleration and compositing', path: '/css/trivia/css-hardware-acceleration' },
      },
      {
        id: 'react-keys',
        round: 'Technical rounds on a shared editor',
        kind: 'React concepts',
        topic: 'Why React needs keys',
        question: 'Why does React need a key on list items?',
        sources: [SHOPEE_S6_SG_CAMPUS_2020],
        practice: { label: 'Keys in React lists', path: '/react/trivia/react-keys-in-lists' },
      },
      {
        id: 'session-cookie-token',
        round: 'Technical rounds on a shared editor',
        kind: 'Web fundamentals',
        topic: 'Sessions, cookies and tokens',
        question: 'How do a session, a cookie and a token differ, and what are the strengths and weaknesses of each?',
        sources: [SHOPEE_S6_SG_CAMPUS_2020],
      },
      {
        id: 'merge-k-sorted-lists',
        round: 'Technical rounds on a shared editor',
        kind: 'Algorithm',
        topic: 'Merging k sorted lists',
        question:
          'Merge k sorted linked lists. When the candidate proposed a priority queue, the interviewer asked for a merge in O(1) extra space, then for the candidate\'s own test cases.',
        sources: [SHOPEE_S37_MEDIUM_2022],
        practice: { label: 'Merge two sorted arrays', path: '/javascript/coding/js-merge-sorted-arrays' },
      },
      {
        id: 'tree-from-traversals',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Trees from pre-order and in-order',
        question:
          'Multiple-choice questions built on a tree\'s pre-order and in-order traversals: a 2020 test asked for the post-order, and a 2021 test asked to rebuild the binary search tree.',
        sources: [SHOPEE_S31_OA_2020, SHOPEE_S39_PTT_2021],
      },
      {
        id: 'building-a-heap',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Building a heap by hand',
        question: 'A multiple-choice question that has you build a heap by hand.',
        sources: [SHOPEE_S39_PTT_2021],
      },
      {
        id: 'spreadsheet-column-names',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Spreadsheet column names and numbers',
        question: 'Spreadsheet columns run from A to Z, then AA, AB and on: give the position of a column name (AB is 28) and the name at a position.',
        sources: [SHOPEE_S31_OA_2020],
      },
      {
        id: 'reorder-linked-list',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Reordering a linked list',
        question: 'Rearrange a linked list in place so that L0, L1, L2 and on to Ln becomes L0, Ln, L1, Ln-1, L2 and so on.',
        sources: [SHOPEE_S32_OA_2020],
      },
      {
        id: 'two-digit-number-series',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Numbers made of two allowed digits',
        question: 'Find the n-th number in the series of numbers whose only digits are 4 and 7.',
        sources: [SHOPEE_S32_OA_2020],
      },
      {
        id: 'busiest-gym-time',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Busiest time from tap-in records',
        question:
          'Given the tap-in and tap-out times of people entering a gym, in HH:MM:SS, print when the gym is most crowded and how many people are inside then.',
        sources: [SHOPEE_S33_OA_2021],
      },
      {
        id: 'most-overlapping-events',
        kind: 'Algorithm',
        topic: 'Period with the most overlapping events',
        question: 'Given a long list of events with start and end times, find the time period in which the most events overlap.',
        sources: [SHOPEE_S34_2022],
      },
      {
        id: 'permutation-substrings',
        kind: 'Algorithm',
        topic: 'Substrings that are permutations',
        question: 'Given strings S1 and S2, return every substring of S1 that is a permutation of S2: the first problem of a 2021 Singapore onsite.',
        sources: [SHOPEE_S30_SINGAPORE_2021],
      },
      {
        id: 'set-from-array-stack-queue',
        kind: 'Algorithm',
        topic: 'A set built from an array',
        question: 'Implement a set using only an array, a stack or a queue, with add, delete, contains and union.',
        sources: [SHOPEE_S30_SINGAPORE_2021],
      },
      {
        id: 'longest-increasing-subsequence',
        kind: 'Algorithm',
        topic: 'Longest increasing subsequence',
        question: 'Print any one longest increasing subsequence of an array.',
        sources: [SHOPEE_S30_SINGAPORE_2021],
      },
      {
        id: 'hash-map-and-balanced-trees',
        kind: 'Algorithm',
        topic: 'Hash maps and balanced trees',
        question:
          'How does a hash map work internally? What is a balanced binary search tree, with examples, and which properties does a red-black tree keep?',
        sources: [SHOPEE_S30_SINGAPORE_2021],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'disagreeing-with-a-colleague',
        question: 'Tell me about a time you disagreed with a colleague or your manager. How did you work it out?',
        sources: [SHOPEE_S1_HCMC_2025, SHOPEE_S5_TAIPEI_2021, SHOPEE_S36_MEDIUM_2020],
      },
      {
        id: 'hardest-problem',
        question:
          'What is the hardest problem you have worked on, or the one you are proudest of, and how did you solve it? One interviewer insisted on a technical difficulty.',
        sources: [SHOPEE_S4_NOWCODER_2022, SHOPEE_S3_JUEJIN_2020, SHOPEE_S5_TAIPEI_2021],
      },
      {
        id: 'strengths-and-weaknesses',
        question: 'What are your strengths and weaknesses? One interviewer wanted a word or two for each.',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S7_CAMPUS_2020],
      },
      {
        id: 'why-leave-current-job',
        question: 'Why do you want to leave your current job?',
        sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S30_SINGAPORE_2021],
      },
      {
        id: 'ready-to-relocate',
        question:
          'Are you ready to move for this job, why, and how long would you need to settle in? Asked of a Vietnamese candidate about Saigon and of Taiwanese graduates about Singapore.',
        sources: [SHOPEE_S1_HCMC_2025, SHOPEE_S36_MEDIUM_2020, SHOPEE_S39_PTT_2021],
      },
      {
        id: 'why-shopee',
        question: 'Why are you applying to Shopee?',
        sources: [SHOPEE_S1_HCMC_2025],
      },
      {
        id: 'future-and-expectations',
        question: 'Where do you want your career to go, what do you expect from working at Shopee, and how would it differ from your current job?',
        sources: [SHOPEE_S1_HCMC_2025],
      },
      {
        id: 'project-workflow',
        question: 'Describe how a project of yours runs, from the first requirement to release.',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
      {
        id: 'how-you-learn',
        question: 'How do you keep learning in your own time?',
        sources: [SHOPEE_S3_JUEJIN_2020],
      },
    ],
  },
  openai: {
    summary:
      'OpenAI\'s interview guide describes résumé review, introductory calls, team-specific assessments and 4 to 6 hours of final interviews. Frontend and full-stack accounts from 2023 to 2026 report a recruiter call, then a technical screen in two parts, coding and system design; only software engineer and full-stack accounts reach the final loop.',
    caveat:
      'Thin evidence: two frontend accounts on Taro, one of which ended at the HR screen, a frontend candidate\'s updates and a commenter on Blind, and two recruiter plans; a 2023 full-stack account adds to the final interviews, and the question list adds other loops from 2024 to 2026, kept for their frontend and general questions. The guide says formats vary by team, and the JavaScript option in a 2026 plan came with a prep guide on algorithms.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers',
        stages: [
          {
            stage: 'Résumé review',
            format: 'About one week before the recruiting team emails back, per the interview guide.',
            appliesTo: 'All candidates',
            sources: [OPENAI_INTERVIEW_GUIDE],
          },
          {
            stage: 'Recruiter or hiring-manager call',
            format:
              'A conversation with the hiring manager or recruiter about work experience, motivations and goals, per the guide. A 2024 frontend candidate\'s call and a 2025 full-stack recruiter screen were about motivation; one 2024 account ended after this video screening.',
            appliesTo: 'All candidates',
            sources: [OPENAI_INTERVIEW_GUIDE, OPENAI_OA1_SENIOR_FE_2024, OPENAI_OA2_FE_2024, OPENAI_OA6_PLAN_2026, OPENAI_OA7_FE_2024, OPENAI_OA10_FULLSTACK_2025],
          },
          {
            stage: 'Technical screen',
            format:
              'Coding, then system design, back to back in a 2024 senior frontend screen, neither run by a frontend engineer. A 2025 full-stack Applied screen ran its design and coding parts over about two and a quarter hours with a break, with googling for syntax allowed and any AI use to be declared. A 2024 frontend candidate found both parts easy; a 2023 commenter had a React exercise in CoderPad; a 2025 recruiter plan lists frontend coding, then system design or architecture.',
            appliesTo: OPENAI_ROLE,
            sources: [OPENAI_OA1_SENIOR_FE_2024, OPENAI_OA2_FE_2024, OPENAI_OA3_COMMENT_2023, OPENAI_OA5_PLAN_2025, OPENAI_OA10_FULLSTACK_2025],
            practice: { label: 'AI chat composer and streaming turn', path: '/system-design/ai-chat-textarea-design' },
          },
          {
            stage: 'Agentic coding option',
            format:
              'In October 2026 one senior candidate could pick a 60-minute JavaScript interview or a 60-minute agentic one. The agentic interview runs in a Python codebase with AI tools, and the JavaScript option came with a prep guide on arrays, queues, maps, trees, sorting, searching, dynamic programming and backtracking. The interview guide says some formats allow AI tools and others assess independent problem solving.',
            appliesTo: 'One 2026 plan',
            sources: [OPENAI_OA6_PLAN_2026, OPENAI_INTERVIEW_GUIDE],
          },
          {
            stage: 'Final interviews',
            format:
              'Per the guide, 4 to 6 hours with 4 to 6 people over 1 to 2 days, virtual by default or onsite in San Francisco. A 2023 full-stack loop had a project presentation, then an onsite with a design round mixing backend and frontend, and frontend coding. A 2025 full-stack Applied onsite of about four hours had a coding round on existing code, a project presentation with slides and a leadership conversation; a 2026 software engineer onsite had system design, coding in Python, and debugging in an existing repository from bug reports.',
            appliesTo: 'All candidates, per the guide; not reported in a frontend-titled loop',
            sources: [OPENAI_INTERVIEW_GUIDE, OPENAI_OA4_SWE_2023, OPENAI_OA10_FULLSTACK_2025, OPENAI_OA9_SWE_2026],
          },
          {
            stage: 'Decision',
            format: 'Within a week of the final interviews; the recruiter may ask for references at this stage.',
            appliesTo: 'All candidates',
            sources: [OPENAI_INTERVIEW_GUIDE],
          },
        ],
      },
    ],
    // Left out for want of a subject: a React exercise in CoderPad (2023 commenter), a phone-screen question that
    // "kept increasing in complexity" and an onsite design and frontend coding round named without subjects (2023),
    // and the coding and design rounds recruiter plans list. Left out by content: the 2024 webhook service design
    // (caching, database design, message-queue retries, a REST service), a 2026 job scheduler debugging round (a heap,
    // a thread, an async scheduler) and the database choice the 2024 text-area design asked about. Behavioural
    // questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'chatgpt-in-a-text-area',
        round: 'Technical screen',
        kind: 'Frontend system design',
        topic: 'ChatGPT-style chat in a text area',
        question:
          'Design ChatGPT, but in a text area. It was the systems design half of a two-part screen, set by an interviewer who, the candidate says, was not a frontend engineer and did not fully understand how the application would work for a user.',
        sources: [OPENAI_OA1_SENIOR_FE_2024],
        practice: { label: 'AI chat composer and streaming turn', path: '/system-design/ai-chat-textarea-design' },
        answerGuide: 'streaming-chat-composer',
      },
      {
        id: 'refactor-existing-code',
        round: 'Technical screen',
        kind: 'Practical coding',
        topic: 'Refactoring existing code',
        question:
          'Refactor existing code, in a language the interviewer asked you to pick, and cover its edge cases. A 2024 frontend candidate remembers it as a piece of JavaScript that needed fixing.',
        promptNotShared: true,
        sources: [OPENAI_OA1_SENIOR_FE_2024, OPENAI_OA2_FE_2024],
        practice: { label: 'Stop mutating caller data in unique', path: '/javascript/debug/js-debug-mutating-input' },
      },
      {
        id: 'openai-playground-design',
        round: 'Technical screen',
        kind: 'Frontend system design',
        topic: 'OpenAI Playground design',
        question:
          'Design a version of the OpenAI Playground for developers, starting from its UI screens. The interviewer left it to you what to focus on and what to abstract away, including whether serving the model was in scope.',
        sources: [OPENAI_OA10_FULLSTACK_2025, OPENAI_PLAYGROUND_BANK],
      },
      {
        id: 'credit-pool-with-expirations',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Credit pool with expirations',
        question:
          'Given issued credits, used credits and rules such as expirations, write the algorithm that computes a user\'s ending credit pool, and get it to pass the test cases.',
        sources: [OPENAI_OA10_FULLSTACK_2025],
      },
      {
        id: 'map-of-tuples-crud',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Map data structure over tuples',
        question:
          'Code a map-type data structure with create, update and delete operations, around maintaining a list of tuples; the follow-ups needed sorting and merging.',
        sources: [OPENAI_OA8_SCREEN_2024],
      },
      {
        id: 'chatgpt-system-design',
        round: 'Final interviews',
        kind: 'Frontend system design',
        topic: 'ChatGPT system design',
        question:
          'Design ChatGPT, at first without worrying about scale or persisting anything. Later: why use SSE rather than WebSocket, and how would you optimise the frontend so that long conversations still render well?',
        sources: [OPENAI_OA9_SWE_2026],
        practice: { label: 'SSE vs WebSocket trade-offs', path: '/javascript/trivia/sse-vs-websocket-real-time' },
        answerGuide: 'frontend-system-design-conversation-history',
      },
      {
        id: 'refactor-for-new-requirements',
        round: 'Final interviews',
        kind: 'Practical coding',
        topic: 'Refactoring messy code for new requirements',
        question:
          'Refactor messy code so that it handles new requirements while the existing tests keep passing. Follow-ups: which abstractions or class structure would help it scale, and can it keep its current behaviour while meeting the new cases?',
        sources: [OPENAI_OA10_FULLSTACK_2025],
      },
      {
        id: 'simplified-vector-store',
        round: 'Final interviews',
        kind: 'Algorithm',
        topic: 'Simplified vector store',
        question:
          'Implement a simplified vector store: add(index, val) inserts a string at an index and shifts everything after it back by one, and get(index) returns the value there. A plain linked list was too slow to read, so the interviewer hinted at a linked list with a checkpoint every k nodes.',
        sources: [OPENAI_OA9_SWE_2026],
      },
    ],
    // Same-question accounts share a row. Left out: questions about the candidate's own project in the 2025
    // presentation round (its LLM, evals, a vector database for SQL schemas, scale).
    behaviouralQuestions: [
      {
        id: 'why-openai',
        question: 'Why OpenAI?',
        sources: [OPENAI_OA2_FE_2024, OPENAI_OA10_FULLSTACK_2025],
      },
      {
        id: 'conflict-resolved',
        question: 'Tell me about a time you had a conflict with someone and how you resolved it.',
        sources: [OPENAI_OA10_FULLSTACK_2025],
      },
    ],
  },
  netflix: {
    summary:
      'Netflix publishes a process only for new graduates and interns: a take-home assessment, then two or about two to three rounds. Accounts of experienced frontend, UI and full-stack loops from 2020 to 2025 describe recruiter and hiring-manager conversations, a live screen or a take-home, and an onsite of four or five interviews split between technical and behavioural; Netflix-tagged commenters say each team runs its own loop.',
    caveat:
      'Thin evidence: two complete 2020 loops, a 2021 account of one manager talk and a 2024 Warsaw account on Taro, three 2024 loops on Aced, a 2025 screen, a March 2022 post about a loop a few years earlier, one recruiter plan and commenters. The order differs between accounts, some loops use a take-home and others a live screen, and the Warsaw account counts eight stages without naming them.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Experienced frontend and UI engineers',
        note: 'Netflix-tagged commenters describe a process that is not centralised and differs by team, so each row says which account it comes from.',
        stages: [
          {
            stage: 'Recruiter conversation',
            format:
              'A long conversation in the 2020 account. A 2024 full-stack recruiter screen was about the culture memo and what you want from the role, and a 2024 commenter was rejected after a recruiter screen that included a few light technical questions.',
            appliesTo: 'All candidates',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF4_COMMENT_2024, NETFLIX_NF5_PLAN_2024, NETFLIX_NF6_FE_2022, NETFLIX_NF11_UI_L4_2024, NETFLIX_NF12_FULLSTACK_2024],
          },
          {
            stage: 'Hiring-manager conversation',
            format:
              'A long behavioural interview with a UI manager came before the take-home in the 2020 account. In a 2024 full-stack loop the hiring manager\'s call came after the technical screen and was behavioural; a Netflix-tagged commenter in 2024 expects a manager screen before any technical round, and a 2021 senior account describes only a confrontational talk with the would-be manager.',
            appliesTo: 'Most loops',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF4_COMMENT_2024, NETFLIX_NF6_FE_2022, NETFLIX_NF8_SENIOR_FE_2021, NETFLIX_NF12_FULLSTACK_2024],
            practice: { label: 'Netflix culture questions and story drill', path: '/companies/netflix/preview', fragment: 'netflix-round-culture', drill: true },
          },
          {
            stage: 'Technical screen',
            format:
              'One hour of three small JavaScript tasks in a 2025 screen in Poland for an L4 or L5 frontend role. In 2024 a 60-minute CoderPad round for a senior full-stack role was a React build, and two UI engineer L4 screens were a frontend system design, one of them in place of the live coding the candidate had been promised. A 2024 recruiter plan also opens with a technical screen, and a 2020 senior UI loop began with a technical phone screen.',
            appliesTo: 'Most loops',
            sources: [NETFLIX_NF3_SCREEN_2025, NETFLIX_NF12_FULLSTACK_2024, NETFLIX_NF10_UI_L4_2024, NETFLIX_NF11_UI_L4_2024, NETFLIX_NF5_PLAN_2024, NETFLIX_NF9_SENIOR_UI_2020, NETFLIX_NF6_FE_2022],
            practice: { label: 'Debounce function', path: '/javascript/coding/js-debounce' },
          },
          {
            stage: 'Take-home',
            format:
              'A UI built at home, in two 2020 accounts, one of which reviewed it in the onsite. A March 2022 post describes a loop from a few years earlier in which questions on why it was built that way followed, then a culture conversation.',
            appliesTo: 'Some loops',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF9_SENIOR_UI_2020, NETFLIX_NF6_FE_2022],
          },
          {
            stage: 'Onsite',
            format:
              'In 2020, one coding interview, a take-home review and two behavioural interviews, with no LeetCode-type questions. Another 2020 loop had half a day of technical interviews with engineers and half a day of behavioural ones with senior leadership and product, ending with a senior manager. Two 2024 UI engineer L4 onsites had five rounds, three technical and two behavioural; a 2024 senior full-stack onsite had a React build, a system design talked through without a diagram, and two behavioural rounds, the last with a skip-level manager. A 2024 recruiter plan for an L4 Web UI role lists two technical and two behavioural rounds, possibly algorithms and system design.',
            appliesTo: 'Every complete loop in the accounts',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF9_SENIOR_UI_2020, NETFLIX_NF10_UI_L4_2024, NETFLIX_NF11_UI_L4_2024, NETFLIX_NF12_FULLSTACK_2024, NETFLIX_NF5_PLAN_2024],
          },
        ],
      },
      {
        title: 'New graduates and interns',
        note: 'From the official pages for the US new graduate programme and the internships in the United States, India, Poland and Japan.',
        stages: [
          {
            stage: 'Take-home assessment',
            format: 'A take-home assessment opens both processes.',
            appliesTo: 'New graduates and interns',
            sources: [NETFLIX_NEW_GRADS, NETFLIX_INTERNSHIPS],
          },
          {
            stage: 'Interview rounds',
            format:
              'Two rounds for new graduates and about two to three for interns, advancing on the feedback at each stage. Interviewers evaluate technical, role-specific and behavioural skills and may ask which parts of the culture memo resonate.',
            appliesTo: 'New graduates and interns',
            sources: [NETFLIX_NEW_GRADS, NETFLIX_INTERNSHIPS],
          },
        ],
      },
    ],
    // Left out for want of a subject: the subject areas a 2020 senior UI developer lists for the technical rounds
    // (software design, state management, browser capabilities, JavaScript internals, CSS), "html, css, js specific"
    // and "softball technical questions" from 2024 commenters, a take-home whose subject is not named, an algorithmic
    // or system design round a recruiter plan only expects, and two coding rounds a 2024 UI onsite names without tasks.
    // Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'filter-api-results-by-search-input',
        kind: 'JavaScript',
        topic: 'Filtering API results by search input',
        question:
          'How would you filter results from a REST API dynamically, based on what the user types into a search input? The candidate answered with a debounce, and the discussion turned to the delay a 200 ms debounce adds.',
        sources: [NETFLIX_NF1_SENIOR_FE_2024],
        practice: { label: 'React debounced search with a fake API', path: '/react/coding/react-debounced-search' },
        answerGuide: 'resilient-title-search',
      },
      {
        id: 'netflix-app-frontend-design',
        round: 'Technical screen',
        kind: 'Frontend system design',
        topic: 'Netflix app frontend design',
        question:
          'Design the frontend of the current Netflix app, talked through as a system design with the interviewer.',
        sources: [NETFLIX_NF11_UI_L4_2024],
        practice: { label: 'Netflix Continue Watching frontend system design', path: '/system-design/netflix-scale-expansion' },
        answerGuide: 'continue-watching-system-design',
      },
      {
        id: 'internal-tool-screenshot-data-structure',
        round: 'Technical screen',
        kind: 'Frontend system design',
        topic: 'Data model from a tool screenshot',
        question:
          'Given a screenshot of one of Netflix\'s internal tools, think through its frontend system design, then write out in CoderPad the data structure you would build it on.',
        sources: [NETFLIX_NF10_UI_L4_2024],
      },
      {
        id: 'event-log-config-table',
        round: 'Technical screen',
        kind: 'React build',
        topic: 'Collapsible config table in React',
        question:
          'In 60 minutes in CoderPad, build a React component that shows event log stream configurations: first as a plain table, then with each JSON configuration collapsible, then with collapse-all and expand-all controls. The interviewer asked how you were thinking about hooks, effects, memoization and data fetching.',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'flatten-nested-object',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Flattening a nested object',
        question: 'Write a function that flattens a nested object into a single level, the first of three tasks in a one-hour screen.',
        sources: [NETFLIX_NF3_SCREEN_2025],
      },
      {
        id: 'expect-tobe-matchers',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Assertion matchers like expect and toBe',
        question: 'Write expect and toBe style test matchers, the second task of the same one-hour screen.',
        sources: [NETFLIX_NF3_SCREEN_2025],
      },
      {
        id: 'two-async-calls-partial-failure',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Partial results from two async calls',
        question:
          'Combine two async calls, one fetching videos and one fetching likes, so that when one of them fails the other\'s result still shows. The last of the three tasks.',
        sources: [NETFLIX_NF3_SCREEN_2025],
        practice: { label: 'Promise.all vs allSettled', path: '/javascript/trivia/js-promise-combinators-all-allsettled-race-any' },
      },
      {
        id: 'netflix-like-ui-take-home',
        round: 'Take-home',
        kind: 'UI build',
        topic: 'Netflix-like UI',
        question: 'Build a Netflix-like UI as a take-home assignment; the account gives no brief beyond that.',
        promptNotShared: true,
        sources: [NETFLIX_NF9_SENIOR_UI_2020],
        answerGuide: 'accessible-continue-watching-row',
      },
      {
        id: 'collapsible-list-component',
        round: 'Onsite',
        kind: 'React build',
        topic: 'Collapsible list component',
        question:
          'Build a collapsible list component in React. Follow-ups: how should it behave when a filter changes the data and some items disappear, how does React handle the rendering and updates here, and what would you do if the list got very large?',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
        answerGuide: 'personalized-row-rendering',
      },
      {
        id: 'event-logging-client-libraries',
        round: 'Onsite',
        kind: 'Product design',
        topic: 'Client libraries for event logging',
        question:
          'You are building an event logging product: would you build and own the client libraries yourself, or have each team build its own from your documentation? The benefits of your choice, where it fails over time, how team bandwidth changes the answer, and the pain points across teams.',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'styling-and-state-opinions',
        round: 'Onsite',
        kind: 'Web fundamentals',
        topic: 'Opinions on styling and state management',
        question:
          'A round on your own opinions about engineering decisions such as styling and state management; the candidate advises giving personal views rather than how a former company did things.',
        promptNotShared: true,
        sources: [NETFLIX_NF11_UI_L4_2024],
      },
      {
        id: 'content-platform-caching',
        kind: 'Web fundamentals',
        topic: 'Caching strategies for a content platform',
        question:
          'Talk through caching strategies for a content platform, fitted to what the business needs; the account names the subject but not the prompt.',
        promptNotShared: true,
        sources: [NETFLIX_NF1_SENIOR_FE_2024],
        practice: { label: 'Streaming platform caching architecture', path: '/javascript/trivia/content-delivery-caching-strategies-streaming' },
        answerGuide: 'streaming-caching-failure-states',
      },
      {
        id: 'array-and-dom-manipulation',
        kind: 'JavaScript',
        topic: 'Array and DOM manipulation',
        question:
          'Coding the candidate calls trivial: array manipulation and JavaScript fundamentals, DOM manipulation in particular, with no LeetCode-type problems. The account does not say in which round.',
        promptNotShared: true,
        sources: [NETFLIX_NF2_SENIOR_FE_2020],
      },
    ],
    // Same-question accounts share a row. Left out: the 2020 advice to study the memo and discuss it at length (the
    // memo row asks it), questions about the candidate's own project, and a confrontational 2021 manager talk.
    behaviouralQuestions: [
      {
        id: 'culture-memo-resonates',
        question: 'Which parts of the culture memo resonate most with you, and which surprised you or do not resonate?',
        sources: [NETFLIX_NEW_GRADS, NETFLIX_INTERNSHIPS, NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'convince-teammates',
        question: 'Tell me about a time you had to convince your teammates of something they were originally against.',
        sources: [NETFLIX_NF9_SENIOR_UI_2020],
      },
      {
        id: 'disagreed-with-decision',
        question:
          'Tell me about a time you disagreed with a decision, and how you voiced it; a later round asked for one where you could not persuade people, and for a second example.',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'gave-feedback',
        question: 'Tell me about a time you gave feedback.',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'received-critical-feedback',
        question: 'Tell me about a time you received critical feedback from a manager or lead, and how you grew from it afterwards.',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'feedback-from-someone-you-lead',
        question: 'Tell me about a time you received feedback from someone you were leading or working closely with.',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'what-you-want-from-the-role',
        question: 'What are you looking for in a new role, and what in this job description resonates with you?',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
      {
        id: 'who-fits-the-team',
        question: 'What kind of candidate do you think fits this team best?',
        sources: [NETFLIX_NF12_FULLSTACK_2024],
      },
    ],
  },
  elevenlabs: {
    summary:
      'ElevenLabs says steps vary by role and most processes include a pre-screen, virtual interviews with a possible skills assessment, a hiring-manager conversation and a final round with a founder or Bar Raiser. Full-stack and frontend-leaning accounts from 2024 to 2026 describe a timed coding assessment that often comes before the recruiter call, a live technical round with an engineer, a product or design round and a final conversation.',
    caveat:
      'No account covers a purely frontend title: these are full-stack and general engineering loops. The assessment changed shape from loop to loop, and one 2025 loop had no system design round while a 2024 loop did.',
    checkedAt: '2026-11-03',
    variants: [
      {
        title: 'Full-stack engineers, frontend-leaning',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'A call about your background and why ElevenLabs. In several 2026 loops it came after the assessment, and in one the recruiter spent the whole call on the candidate\'s own questions.',
            appliesTo: 'All candidates',
            sources: [
              ELEVENLABS_CAREERS_FAQ,
              ELEVENLABS_EL1_SENIOR_2026,
              ELEVENLABS_EL2_FE_2025,
              ELEVENLABS_EL3_2024,
              ELEVENLABS_EL5_2025,
              ELEVENLABS_EL6_2026,
              ELEVENLABS_EL7_SENIOR_2026,
              ELEVENLABS_EL8_SENIOR_2026,
            ],
          },
          {
            stage: 'Coding assessment',
            format:
              'Usually the first technical step: a timed test of about 90 minutes, often on CoderPad, setting React or JavaScript tasks beside LeetCode-style problems. Some loops used an asynchronous task, a take-home or a Python algorithm round instead; in the 2025 Python round the candidate was told not to use LLMs.',
            appliesTo: 'All candidates',
            sources: [
              ELEVENLABS_EL1_SENIOR_2026,
              ELEVENLABS_EL2_FE_2025,
              ELEVENLABS_EL3_2024,
              ELEVENLABS_EL4_2024,
              ELEVENLABS_EL5_2025,
              ELEVENLABS_EL6_2026,
              ELEVENLABS_EL7_SENIOR_2026,
              ELEVENLABS_EL8_SENIOR_2026,
              ELEVENLABS_EL10_2024,
              ELEVENLABS_EC3_2025,
            ],
            practice: { label: 'Poll until, with timeout and abort', path: '/javascript/coding/js-poll-until' },
          },
          {
            stage: 'Live technical round',
            format:
              'About an hour of pair work with an engineer, mostly in React on a small app or component. One 2026 loop had the candidate write code in a Google Doc, and in a 2024 loop the constraints changed during the task.',
            appliesTo: 'All candidates',
            sources: [
              ELEVENLABS_EL1_SENIOR_2026,
              ELEVENLABS_EL2_FE_2025,
              ELEVENLABS_EL3_2024,
              ELEVENLABS_EL4_2024,
              ELEVENLABS_EL8_SENIOR_2026,
              ELEVENLABS_EL9_SENIOR_2025,
              ELEVENLABS_EL10_2024,
              ELEVENLABS_EL14_2026,
            ],
            practice: { label: 'Fix an async race', path: '/javascript/debug/js-debug-async-race' },
          },
          {
            stage: 'Product or design round',
            format:
              'A product discussion, a product decomposition or a system design interview. One 2025 account describes an hour of talking it through; in a 2024 account the product round was held in a sketching app.',
            appliesTo: 'Most loops',
            sources: [
              ELEVENLABS_EL2_FE_2025,
              ELEVENLABS_EL4_2024,
              ELEVENLABS_EL5_2025,
              ELEVENLABS_EL10_2024,
              ELEVENLABS_EL12_2026,
              ELEVENLABS_EL13_2024,
              ELEVENLABS_EC3_2025,
            ],
          },
          {
            stage: 'Final conversation',
            format:
              'A call with the CTO, a co-founder or the head of the organisation; one 2026 loop ended with manager calibration and team-fit interviews. The careers FAQ names a founder or Bar Raiser.',
            appliesTo: 'All candidates',
            sources: [ELEVENLABS_CAREERS_FAQ, ELEVENLABS_EL3_2024, ELEVENLABS_EL5_2025, ELEVENLABS_EL10_2024, ELEVENLABS_EL12_2026],
          },
        ],
      },
    ],
    // Left out by content: duplicate-file scanning, async database processing, an ML system design, a security
    // scenario and the airline rescheduling case. Left out for want of a subject: "one larger task live", "typical
    // TypeScript and React problem-solving exercises", a changing-constraints problem, a LeetCode variant in a Google
    // Doc and a product round in a sketching app. Left out for its source: the 2026 landing-page take-home, known only
    // from a candidate's GitHub repository. Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'audio-transcript-highlight',
        round: 'Live technical round',
        kind: 'React debugging',
        topic: 'Audio player transcript highlighting',
        question:
          'In a small React audio player with a transcript, find what is broken and build the missing logic so the text being spoken highlights as the audio plays.',
        sources: [ELEVENLABS_EL2_FE_2025, ELEVENLABS_BANK],
        practice: { label: 'Debug a transcript highlight that lags behind the audio', path: '/react/coding/react-debug-transcript-sync' },
        answerGuide: 'audio-transcript-sync',
      },
      {
        id: 'fake-voice-service-component',
        round: 'Live technical round',
        kind: 'React build',
        topic: 'Voice service component',
        question:
          'Build a small React component or app around an ElevenLabs voice service with an engineer; in the 2026 account the service was a fake known only from its types, and the code was never run.',
        sources: [ELEVENLABS_EL8_SENIOR_2026, ELEVENLABS_EL9_SENIOR_2025, ELEVENLABS_EL3_2024],
      },
      {
        id: 'assessment-react-and-algorithm-tasks',
        round: 'Coding assessment',
        kind: 'React and algorithms',
        topic: 'Front-end tasks and LeetCode-style problems',
        question:
          'React and JavaScript tasks beside LeetCode-style problems in the timed assessment: two front-end and two algorithm questions in one 2026 account, four tasks in 90 minutes with the hardest last in another.',
        promptNotShared: true,
        sources: [ELEVENLABS_EL6_2026, ELEVENLABS_EL7_SENIOR_2026, ELEVENLABS_EL1_SENIOR_2026, ELEVENLABS_EL8_SENIOR_2026, ELEVENLABS_EL4_2024],
        practice: { label: 'React autocomplete starter against a clock', path: '/react/coding/react-autocomplete-search-starter' },
        answerGuide: 'timed-assessment-react-and-algorithms',
      },
      {
        id: 'dubbing-review-interface',
        round: 'Product or design round',
        kind: 'Product design',
        topic: 'Dubbing project review interface',
        question:
          'Replace a voice-dubbing project tracked in a spreadsheet with an interface for reviewing progress, handling feedback and working with voice actors; a follow-up asked for it to feel more like a video player than a document.',
        sources: [ELEVENLABS_EC3_2025, ELEVENLABS_BANK],
        practice: { label: 'Design an AI-assisted review flow', path: '/system-design/ai-ux-considerations' },
        answerGuide: 'dubbing-review-interface',
      },
      {
        id: 'coderpad-react-bug',
        round: 'Coding assessment',
        kind: 'React debugging',
        topic: 'Component bug fix',
        question: 'Fix a bug in a React component, in a CoderPad round that also held LeetCode problems.',
        promptNotShared: true,
        sources: [ELEVENLABS_EL3_2024],
        // The asynchronous CoderPad round, so the assessment's guide; the live-fix guide is question 7's.
        answerGuide: 'timed-assessment-react-and-algorithms',
      },
      {
        id: 'coderpad-finish-react-component',
        round: 'Coding assessment',
        kind: 'React build',
        topic: 'Finishing a partly written component',
        question: 'Finish the implementation of a partly written React component, in the same CoderPad round.',
        promptNotShared: true,
        sources: [ELEVENLABS_EL3_2024],
      },
      {
        id: 'live-practical-fix',
        round: 'Live technical round',
        kind: 'Practical coding',
        topic: 'Live practical bug fix',
        question: 'Fix a practical, real-life problem live while working through it with the interviewer.',
        promptNotShared: true,
        sources: [ELEVENLABS_EL1_SENIOR_2026],
        practice: { label: 'Fix an async race in a cached fetch', path: '/javascript/debug/js-debug-async-race' },
        answerGuide: 'fix-a-practical-react-problem',
      },
      {
        id: 'transcription-studio-roadmap',
        round: 'Product or design round',
        kind: 'Product design',
        topic: 'Transcription studio feature roadmap',
        question:
          'For an audio transcription studio used by dubbing teams, propose features, prioritise them and turn them into a roadmap; the follow-ups covered the task list view, the transcription view, authentication and roles.',
        sources: [ELEVENLABS_EL2_FE_2025, ELEVENLABS_BANK],
      },
      {
        id: 'dubbing-re-review-status',
        round: 'Live technical round',
        kind: 'Practical coding',
        topic: 'Re-review marking in a dubbing workflow',
        question:
          'Write functions for a dubbing workflow kept in a spreadsheet that apply edits and approvals, and mark which lines, and the files above them, need review again after a line is re-recorded.',
        sources: [ELEVENLABS_EC3_2025, ELEVENLABS_BANK],
      },
      {
        id: 'folder-permissions',
        round: 'Live technical round',
        kind: 'Practical coding',
        topic: 'Inherited folder permissions over time',
        question:
          'Folders allow or deny users and groups, permissions are inherited unless a folder overrides them, and each change is timestamped: check whether a user can open a file at a given time.',
        sources: [ELEVENLABS_EC5_FDE_2025, ELEVENLABS_EL22_2024, ELEVENLABS_EL23_2024, ELEVENLABS_BANK],
      },
      {
        id: 'adapt-product-key-account',
        round: 'Product or design round',
        kind: 'Product design',
        topic: 'Adapting a product for key accounts',
        question: 'Adapt an ElevenLabs product so that a particular kind of key account can use it.',
        sources: [ELEVENLABS_EL20_GROWTH_2026],
      },
      {
        id: 'valid-sudoku',
        round: 'Coding assessment',
        kind: 'Algorithm',
        topic: 'Valid Sudoku',
        question: 'Check whether a partly filled Sudoku board is valid (LeetCode\'s Valid Sudoku).',
        sources: [ELEVENLABS_EL3_2024],
      },
      {
        id: 'next-larger-distinct-digits',
        round: 'Coding assessment',
        kind: 'Algorithm',
        topic: 'Next larger number sharing no digits',
        question: 'Find the next number larger than n that shares no digit with n.',
        sources: [ELEVENLABS_EC6_2026],
      },
      {
        id: 'merge-equal-level-stones',
        round: 'Coding assessment',
        kind: 'Algorithm',
        topic: 'Merging equal-level stones',
        question: 'Repeatedly merge stones of equal level and return the fewest stones that can remain.',
        sources: [ELEVENLABS_EC6_2026],
      },
      {
        id: 'shirt-colours-no-repeat',
        round: 'Coding assessment',
        kind: 'Algorithm',
        topic: 'Lowest-cost shirt colour sequence',
        question: 'Choose the lowest-cost sequence of shirt colours with no colour used twice in a row.',
        sources: [ELEVENLABS_EC6_2026],
      },
      {
        id: 'map-queue-bfs-problems',
        round: 'Coding assessment',
        kind: 'Algorithm',
        topic: 'Maps, queues and breadth-first traversal',
        question: 'Three assessment problems on maps, queues and breadth-first traversal, the first two easy and the last medium to hard.',
        promptNotShared: true,
        sources: [ELEVENLABS_EC4_2026],
      },
      {
        id: 'merge-sorted-drop-duplicates',
        kind: 'Algorithm',
        topic: 'Merging sorted lists without duplicates',
        question: 'Merge sorted lists into one and drop the duplicates.',
        sources: [ELEVENLABS_EL16_2026],
        practice: { label: 'Merge two sorted arrays', path: '/javascript/coding/js-merge-sorted-arrays' },
      },
      {
        id: 'reverse-linked-list',
        kind: 'Algorithm',
        topic: 'Linked list reversal',
        question: 'Reverse a linked list.',
        sources: [ELEVENLABS_BANK],
      },
      {
        id: 'longest-substring-no-repeats',
        kind: 'Algorithm',
        topic: 'Longest substring without repeating characters',
        question: 'Find the longest substring without repeating characters.',
        sources: [ELEVENLABS_BANK],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
      },
    ],
    // A growth-role question about inventing AI showcases is left out as specific to that role.
    behaviouralQuestions: [
      {
        id: 'why-elevenlabs',
        question: 'Why ElevenLabs: what draws you to the company, and what do you know about it?',
        sources: [
          ELEVENLABS_EL8_SENIOR_2026,
          ELEVENLABS_EL7_SENIOR_2026,
          ELEVENLABS_EL28_2025,
          ELEVENLABS_EL34_2025,
          ELEVENLABS_EL22_2024,
          ELEVENLABS_BANK,
        ],
      },
      {
        id: 'proudest-project',
        question: 'Talk about the project you are proudest of, and say exactly what you built yourself rather than what the team did.',
        sources: [ELEVENLABS_EL8_SENIOR_2026, ELEVENLABS_EC5_FDE_2025],
      },
      {
        id: 'product-experience',
        question: 'What product experience do you have, why did you build those products, and what made them hard?',
        sources: [ELEVENLABS_EC3_2025],
      },
      {
        id: 'built-end-to-end-alone',
        question: 'Tell me about something you built end to end without relying on others.',
        sources: [ELEVENLABS_BANK],
      },
      {
        id: 'ai-product-experience',
        question: 'Have you worked on AI or generative AI products before?',
        sources: [ELEVENLABS_BANK],
      },
      {
        id: 'long-hours',
        question: 'Are you ready to work up to ten hours a day and at weekends?',
        sources: [ELEVENLABS_EL12_2026],
      },
    ],
  },
  waymo: {
    summary:
      'Waymo\'s hiring page lists a sourcer or recruiter conversation, one or two behavioural or technical phone or video interviews with a potential peer or manager, and a virtual onsite with up to five interviewers, each meeting lasting about 45 minutes. A senior frontend account from May 2026 gives the frontend version of that loop. A 2026 software engineer loop with one JavaScript UI round, a 2023 comment from a Waymo-badged engineer and a 2022 intern loop fill in the rest.',
    caveat:
      'Thin evidence: one complete frontend loop, which PracHub curated and edited before publishing it, and three partial accounts from other roles or years. The Waymo-badged commenter says the questions depend on the interviewer. Waymo does not permit AI tools or LLMs in assessments or live interviews unless the instructions say so.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers',
        stages: [
          {
            stage: 'Sourcer or recruiter conversation',
            format: 'An initial conversation with a sourcer or recruiter, per the hiring page.',
            appliesTo: 'All candidates',
            sources: [WAYMO_HOW_WE_HIRE],
          },
          {
            stage: 'Phone or video interviews',
            format:
              'One or two behavioural or technical interviews with a potential peer or manager, per the hiring page. The 2026 frontend loop had a single technical screen in two parts: a recursive coding problem, then a UI that renders its result. The 2022 intern loop had two back-to-back 45-minute technical interviews, one leaning on JavaScript and one on algorithms.',
            appliesTo: 'All candidates',
            sources: [WAYMO_HOW_WE_HIRE, WAYMO_WM1_SENIOR_FE_2026, WAYMO_WM4_INTERN_2022],
            practice: { label: 'Filter a tree and render it indented', path: '/javascript/coding/js-filter-tree-render-indented' },
          },
          {
            stage: 'Virtual onsite',
            format:
              'Up to five interviewers, potential teammates and cross-functional partners, about 45 minutes each, per the hiring page. Live interviews allow no AI help. The 2026 frontend loop had four rounds, all frontend: an Angular debugging round with an interviewer who only knew Angular, a coding round in plain TypeScript or JavaScript, a frontend system design round and a UI coding round. In a March 2023 Blind comment, a Waymo-badged engineer recalls two LeetCode-style and two frontend questions, in Angular and JavaScript, from an interview of unstated year, and says they vary by interviewer.',
            appliesTo: 'All candidates',
            sources: [WAYMO_HOW_WE_HIRE, WAYMO_WM1_SENIOR_FE_2026, WAYMO_WM3_COMMENT_2023],
            practice: { label: 'Debug stale UI under OnPush', path: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug' },
          },
        ],
      },
      {
        title: 'Software engineers with a UI round, 2026',
        note: 'One account for a software engineer title outside frontend, included because one of its four rounds was a JavaScript UI build.',
        stages: [
          {
            stage: 'Recruiter screen',
            format: 'A recruiter call on the current role and backend experience, interest in Waymo and the shape of the process.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
          },
          {
            stage: 'Progressive coding round',
            format: 'One problem in Java whose constraints kept changing, judged on correctness, complexity and how the solution adapted while debugging live.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
          },
          {
            stage: 'JavaScript and UI round',
            format: 'A UI component built in plain JavaScript with no framework, followed by questions on the choices behind it.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
          },
          {
            stage: 'Hiring-manager round',
            format: 'Conversational and scenario-based: production ownership, reliability, cross-team collaboration, GenAI tools at work and a root-cause scenario.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
          },
          {
            stage: 'Algorithms round',
            format: 'A data structures and algorithms round closed the loop.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
          },
        ],
      },
    ],
    // Left out for want of a subject: the 2026 software engineer loop's Java round with changing constraints and its
    // algorithms round, the 2023 commenter's two LeetCode and two frontend questions, and the 2022 intern loop's
    // JavaScript and algorithm interviews. The hiring-manager round's root-cause scenario is named without the
    // scenario, so it stays in the table. Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'tree-filter-then-ui',
        round: 'Phone or video interviews',
        kind: 'UI build',
        topic: 'Filtering and rendering an n-ary tree',
        question:
          'In an n-ary tree, remove every node whose value contains a given substring, together with its subtree, and return the filtered tree; then build a UI that renders it with correct indentation and shows its content for the input value.',
        sources: [WAYMO_WM1_SENIOR_FE_2026],
        practice: { label: 'Filter a tree by substring and render it indented', path: '/javascript/coding/js-filter-tree-render-indented' },
        answerGuide: 'tree-filter-render',
      },
      {
        id: 'angular-debug-user-issues',
        round: 'Virtual onsite',
        kind: 'UI debugging',
        topic: 'Angular fixes from user reports',
        question: 'Debug a piece of Angular UI code and fix it from a few issues its users reported.',
        promptNotShared: true,
        sources: [WAYMO_WM1_SENIOR_FE_2026],
        practice: { label: 'Fix a fleet status board from three user bug reports', path: '/angular/debug/ng-debug-fleet-status-bug-reports' },
        answerGuide: 'angular-bug-reports-debugging',
      },
      {
        id: 'promise-coding-question',
        round: 'Virtual onsite',
        kind: 'JavaScript',
        topic: 'Promise-based coding task',
        question: 'A coding question built on Promises, in plain TypeScript or JavaScript.',
        promptNotShared: true,
        sources: [WAYMO_WM1_SENIOR_FE_2026],
        practice: { label: 'Implement Promise.all', path: '/javascript/coding/js-promise-all' },
        answerGuide: 'promise-contract-typescript',
      },
      {
        id: 'ai-chat-frontend-design',
        round: 'Virtual onsite',
        kind: 'Frontend system design',
        topic: 'AI chat application',
        question: 'Design an AI chat application, frontend focused.',
        sources: [WAYMO_WM1_SENIOR_FE_2026],
        practice: { label: 'Design an AI chat composer and streaming turn', path: '/system-design/ai-chat-textarea-design' },
        answerGuide: 'ai-chat-frontend-design',
      },
      {
        id: 'debounced-autocomplete',
        round: 'Virtual onsite',
        kind: 'UI build',
        topic: 'Debounced autocomplete search',
        question: 'Build an autocomplete search bar that debounces what the user types.',
        sources: [WAYMO_WM1_SENIOR_FE_2026],
        practice: { label: 'React autocomplete starter', path: '/react/coding/react-autocomplete-search-starter' },
        answerGuide: 'debounced-autocomplete',
      },
      {
        id: 'generic-tree-viewer',
        round: 'JavaScript and UI round',
        kind: 'UI build',
        topic: 'Generic tree viewer component',
        question:
          'Build a generic tree viewer component for hierarchical data, like a file explorer: render it recursively with semantic lists, let folders expand and collapse, and discuss event delegation and its trade-offs.',
        sources: [WAYMO_WM2_SWE_2026],
        practice: { label: 'File explorer tree with keyboard navigation', path: '/react/coding/react-file-explorer' },
        answerGuide: 'tree-filter-ui',
      },
    ],
    // From the 2026 software engineer loop's recruiter screen and hiring-manager round, which the account names by
    // topic. Its question about backend experience is left out as specific to that role.
    behaviouralQuestions: [
      {
        id: 'why-waymo',
        question: 'What draws you to Waymo?',
        sources: [WAYMO_WM2_SWE_2026],
      },
      {
        id: 'genai-tools-at-work',
        question: 'How do you use GenAI tools in your work?',
        sources: [WAYMO_WM2_SWE_2026],
      },
      {
        id: 'production-ownership',
        question: 'What have you owned in production, and how did you keep it reliable?',
        sources: [WAYMO_WM2_SWE_2026],
      },
      {
        id: 'working-across-teams',
        question: 'Tell me about a time you worked across teams to get something done.',
        sources: [WAYMO_WM2_SWE_2026],
      },
    ],
  },
  anduril: {
    summary:
      'Anduril describes a recruiter call, technical and behavioral interviews and role-specific assessments that could include live coding. Frontend accounts from 2022 to 2025 describe one technical screen with an applied frontend problem, then an onsite of two coding rounds, a system design round and a behavioral interview. General software engineer accounts follow the same order with LeetCode-style coding.',
    caveat:
      'The frontend accounts run from 2022 to April 2025, and none covers a senior, staff or 2026 frontend loop. Anduril engineers on Blind say the format depends on the team and the interviewer, and recruiters have described the wrong kind of round. The algorithm questions in the list come from general software engineer loops.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, United States',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'A call about your resume and past experience. Recruiters\' forecasts of the next round have missed: in 2025 one promised an algorithm-heavy round, trigonometry and calculus included, before an onsite of two simple JavaScript and React tasks, and another candidate\'s recruiter sent a LeetCode-style guide while the coordinator\'s preparation document pointed, correctly, to a frontend test.',
            appliesTo: 'All candidates',
            sources: [ANDURIL_EARLY_CAREERS, ANDURIL_AN9_OFFER_2022, ANDURIL_AN11_FE_FOCUS_2024, ANDURIL_AN12_CLASS_2025, ANDURIL_AN1_ONSITE_2025],
          },
          {
            stage: 'Technical screen',
            format:
              'About an hour on one applied frontend problem rather than a LeetCode puzzle, built live and usually in React. By video in 2022; on HackerRank, with no CodeSandbox, in 2025, where Vue and Angular were also allowed. A 2024 candidate said working behaviour counted for more than styling.',
            appliesTo: 'Frontend candidates',
            sources: [ANDURIL_AN12_CLASS_2025, ANDURIL_AN11_FE_FOCUS_2024, ANDURIL_AN9_OFFER_2022, ANDURIL_AN2_OFFER_2023, ANDURIL_AN6_SCREEN_2025],
            practice: { label: 'File explorer tree', path: '/react/coding/react-file-explorer' },
          },
          {
            stage: 'Onsite',
            format:
              'Three or four interviews: two coding rounds, usually one in React and one in plain JavaScript or data structures, one system design round and one behavioral interview. In person at Costa Mesa in 2022 and 2024; a 2024 candidate called it almost all React plus client-side architecture.',
            appliesTo: 'Candidates who pass the screen',
            sources: [ANDURIL_AN1_ONSITE_2025, ANDURIL_AN2_OFFER_2023, ANDURIL_AN4_ONSITE_2024, ANDURIL_AN9_OFFER_2022, ANDURIL_AN11_FE_FOCUS_2024],
            practice: { label: 'Implement a stack and a queue', path: '/javascript/coding/js-stack-queue-implementation' },
          },
          {
            stage: 'Decision',
            format: 'Within about five days in a 2022 account; a 2023 offer came about three weeks after the first interview result.',
            appliesTo: 'Candidates who finish',
            sources: [ANDURIL_AN9_OFFER_2022, ANDURIL_AN2_OFFER_2023],
          },
        ],
      },
      {
        title: 'Frontend interns, 2023',
        note: 'One account of a frontend internship loop that ended in an offer.',
        stages: [
          {
            stage: 'Introductory interview',
            format: 'A short first conversation.',
            appliesTo: 'The one account',
            sources: [ANDURIL_AN10_INTERN_2023],
          },
          {
            stage: 'Two technical rounds',
            format: 'Two technical rounds in which the candidate built a small application.',
            appliesTo: 'The one account',
            sources: [ANDURIL_AN10_INTERN_2023],
            practice: { label: 'Filter a tree and render it', path: '/javascript/coding/js-filter-tree-render-indented' },
          },
          {
            stage: 'Behavioral interview',
            format: 'Behavioral questions with a small technical question at the end.',
            appliesTo: 'The one account',
            sources: [ANDURIL_AN10_INTERN_2023],
          },
        ],
      },
    ],
    // Left out for want of a subject: "just building a react interface" and "2 fairly simple coding challenges" (AN1),
    // "easy af react" (AN2), "General LeetCode-style coding questions and React coding questions" (AN9), the onsite's
    // data-structures and system design rounds (AN11), "client side architecture" (AN4, in the Onsite cell), the
    // intern's small technical question, and one-LeetCode-medium rounds (AN32, AN34 commenter, AN36). The calendar
    // component was only asked about. Left out by content: the domain-specific system design rounds (AN37).
    // The algorithm rows come from general software engineer loops and count under the stage their account describes.
    questions: [
      {
        id: 'file-explorer-react',
        round: 'Technical screen',
        kind: 'React build',
        topic: 'Nested file explorer',
        question:
          'Build a file explorer in React from nested folder data: each row shows a file or folder icon beside its name, and clicking a folder shows its children beneath it. A 2024 candidate said it was judged on working behaviour more than styling.',
        sources: [ANDURIL_AN6_SCREEN_2025, ANDURIL_AN2_FOLDER_2024, ANDURIL_AN10_INTERN_2023],
        practice: { label: 'File explorer tree with keyboard navigation', path: '/react/coding/react-file-explorer' },
        answerGuide: 'file-explorer-from-nested-data',
      },
      {
        id: 'es6-class-then-framework',
        round: 'Technical screen',
        kind: 'UI build',
        topic: 'ES6 class component in plain JavaScript',
        question:
          'From a blank file, build a component as an ES6 class with three specified methods in plain JavaScript, then set it up in a framework of your choice.',
        promptNotShared: true,
        sources: [ANDURIL_AN12_CLASS_2025],
        practice: { label: 'A dropdown class, then its React port', path: '/react/coding/react-vanilla-dropdown-port' },
        answerGuide: 'vanilla-component-then-framework',
      },
      {
        id: 'timer-class-react-app',
        kind: 'React build',
        topic: 'Timer class and timer app',
        question: 'Write a timer class in JavaScript, then build a React app around it.',
        sources: [ANDURIL_AN11_FE_FOCUS_2024],
        practice: { label: 'React countdown timer with start, pause and reset', path: '/react/coding/react-countdown-timer' },
        answerGuide: 'timer-class-then-react-app',
      },
      {
        id: 'autocomplete-search-react',
        kind: 'React build',
        topic: 'Autocomplete search',
        question: 'Design an autocomplete search feature in React.',
        sources: [ANDURIL_AN5_TIP_2024],
        practice: { label: 'React autocomplete starter', path: '/react/coding/react-autocomplete-search-starter' },
        answerGuide: 'autocomplete-search-react',
      },
      {
        id: 'lodash-style-utilities',
        kind: 'JavaScript',
        topic: 'Lodash-style flatten, map and reduce',
        question: 'Lodash-style utility questions: write your own flatten, map and reduce.',
        sources: [ANDURIL_AN4_CLEARED_2024],
        practice: { label: 'Flatten one level', path: '/javascript/coding/js-flatten-once' },
        answerGuide: 'lodash-style-helpers',
      },
      {
        id: 'drone-zone-sensor-class',
        round: 'Technical screen',
        kind: 'Practical coding',
        topic: 'Drone zone sensor class',
        question:
          'A drone senses objects in a zone and reports what it finds: write a class with two methods that retrieve and send data to an external source.',
        sources: [ANDURIL_AN30_SWE_2024],
      },
      {
        id: 'largest-sensor-distance',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Largest sensor distance',
        question:
          'Given two integer arrays, take each number in the first array and its closest number in the second; their difference is a sensor distance. Return the largest sensor distance.',
        sources: [ANDURIL_AN34_SWE_2023],
      },
      {
        id: 'course-schedule-topological-sort',
        kind: 'Algorithm',
        topic: 'Course Schedule topological sort',
        question: 'Decide whether all the courses can be finished given their prerequisites, a topological sort (LeetCode\'s Course Schedule).',
        sources: [ANDURIL_AN31_SWE_2025],
      },
      {
        id: 'medium-dynamic-programming',
        kind: 'Algorithm',
        topic: 'Dynamic programming problem',
        question: 'A dynamic programming problem of LeetCode medium difficulty, in an interview the candidate called friendly.',
        promptNotShared: true,
        sources: [ANDURIL_AN35_DP_2022],
      },
      {
        id: 'bfs-dfs-with-follow-ups',
        kind: 'Algorithm',
        topic: 'Breadth-first and depth-first search',
        question: 'Breadth-first and depth-first search questions of LeetCode medium difficulty, each pushed further by harder follow-ups.',
        promptNotShared: true,
        sources: [ANDURIL_AN35_BFS_2023],
      },
      {
        id: 'hard-graph-problems',
        kind: 'Algorithm',
        topic: 'Data structure and graph problems',
        question: 'LeetCode-style data structure and graph problems, which the candidate found hard, in rounds of 45 to 60 minutes.',
        promptNotShared: true,
        sources: [ANDURIL_AN33_SWE_2025],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'why-anduril',
        question: 'Why do you want to work at Anduril?',
        sources: [ANDURIL_AN30_SWE_2024],
      },
      {
        id: 'about-yourself-briefly',
        question: 'Tell me a little about yourself, and keep it short.',
        sources: [ANDURIL_AN33_SWE_2025],
      },
    ],
  },
  gitlab: {
    summary:
      'GitLab publishes one frontend loop for every level: a short written assessment, a recruiter screening call, a merge request you review on your own time and then improve in a 90-minute technical interview, a behavioral interview and an interview with a Director of Engineering. Public accounts from 2018 to 2025 describe these steps, but in a 2022, a 2023 and a 2025 account a hiring manager or director came before any technical round.',
    caveat:
      'Stages and durations come from the GitLab handbook; the details come from accounts dated 2018 to 2025, most of them anonymous interview reviews re-posted on Taro with placeholder dates. The question list adds 2019 loops with an hour of JavaScript questions or a senior theory call, and a 2021 Senior Software Engineer loop added a quiz on frontend trivia; the handbook describes none of these rounds.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, all levels',
        stages: [
          {
            stage: 'Written assessment',
            format:
              'A short written assessment sent after you apply. Accounts from 2018 and 2019 describe open-ended technical questions answered in writing, by email or in an online form, one set arriving within minutes of applying; a 2022 account calls it a take-home written assignment.',
            appliesTo: 'Selected applicants',
            sources: [GITLAB_JOB_FAMILY, GITLAB_GL27_FE_2019, GITLAB_GL35_FE_2018, GITLAB_GL24_FE_2019, GITLAB_GL31_SENIOR_2019, GITLAB_GL6_FE_2022],
            // The page-load task practises a locked written question, so the open link is the broad fundamentals quiz.
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Recruiter screening call',
            format: '30 to 40 minutes on video: background, motivation and experience with each skill the posting lists. The recruiter also asks about location, notice period and salary range.',
            appliesTo: 'All candidates',
            sources: [GITLAB_JOB_FAMILY, GITLAB_CANDIDATE_FAQ, GITLAB_GL4_FE_2024, GITLAB_GL1_FE_2025, GITLAB_GL32_FE_2019],
          },
          {
            stage: 'Merge request review',
            format:
              'A self-contained merge request on a small app arrives at least 72 hours before the call. You review it for up to an hour and finish a day ahead. Accounts from 2019 to 2024 name Vue, HTML, CSS, Haml and Jest, and in 2020 the exercise was a pull request in GitLab\'s own codebase.',
            appliesTo: 'Frontend engineers',
            sources: [
              GITLAB_TECHNICAL_INTERVIEW,
              GITLAB_GL3_FE_2024,
              GITLAB_GL4_FE_2024,
              GITLAB_GL10_FE_2021,
              GITLAB_GL15_FE_2020,
              GITLAB_GL16_FE_2020,
              GITLAB_GL20_FE_2019,
              GITLAB_GL21_FE_2019,
              GITLAB_GL9_SENIOR_FE_2022,
            ],
            practice: { label: 'Review a Vue merge request', path: '/vue/coding/vue-issue-list-merge-request-review' },
          },
          {
            stage: 'Technical interview',
            format:
              '90 minutes on video with screen sharing, with a frontend engineer or a frontend engineering manager. You walk through your review, then write code to improve the merge request; in a 2024 account the interviewer stayed silent while the candidate coded.',
            appliesTo: 'Frontend engineers',
            sources: [GITLAB_JOB_FAMILY, GITLAB_TECHNICAL_INTERVIEW, GITLAB_GL4_FE_2024, GITLAB_GL3_FE_2024, GITLAB_GL21_FE_2019, GITLAB_GL28_FE_2019],
            // The spy-function task practises a locked testing row, so the open link is a plain Vue build.
            practice: { label: 'Vue todo list', path: '/vue/coding/vue-todo-list' },
          },
          {
            stage: 'Behavioral interview',
            format:
              '45 minutes with an engineering manager: STAR questions, sometimes with high-level technical questions. One 2019 account counted 20 to 25 STAR questions, and in a 2021 account the round turned into technical questions.',
            appliesTo: 'All candidates',
            sources: [GITLAB_JOB_FAMILY, GITLAB_GL20_FE_2019, GITLAB_GL21_FE_2019, GITLAB_GL28_FE_2019, GITLAB_GL12_FE_2021],
          },
          {
            stage: 'Director interview',
            format: '60 minutes with a Director of Engineering on past experience and values. Some accounts add a few technical questions.',
            appliesTo: 'All candidates',
            sources: [GITLAB_JOB_FAMILY, GITLAB_GL20_FE_2019, GITLAB_GL21_FE_2019, GITLAB_GL35_FE_2018],
            // The behavioural round takes the general guide; past experience calls for prepared stories.
            practice: { label: 'Crafting STAR stories', path: '/guides/behavioral/stories' },
          },
          {
            stage: 'References and offer',
            format: 'Three references, at least one a past manager, and a background check before the offer.',
            appliesTo: 'Candidates who pass',
            sources: [GITLAB_CANDIDATE_FAQ, GITLAB_GL21_FE_2019, GITLAB_GL18_FULLSTACK_2020],
          },
        ],
      },
      {
        title: 'Full-stack engineers',
        note: 'In full-stack accounts from 2020, 2022 and 2025 the candidate had two technical interviews, one backend and one frontend; in the 2022 account each was on its own merge request.',
        stages: [
          {
            stage: 'Recruiter screening call',
            format: 'About 30 minutes on motivation, experience with Ruby on Rails and Vue, and compensation.',
            appliesTo: 'All candidates',
            sources: [GITLAB_GL18_FULLSTACK_2020, GITLAB_GL7_FULLSTACK_2022, GITLAB_GL44_FULLSTACK_2025],
          },
          {
            stage: 'Backend technical interview',
            format: '90 minutes on a merge request reviewed before the call and improved during it. Topics: Ruby, Rails, testing and databases.',
            appliesTo: 'Full-stack engineers',
            sources: [GITLAB_GL7_FULLSTACK_2022, GITLAB_GL44_FULLSTACK_2025],
          },
          {
            stage: 'Frontend technical interview',
            format: '90 minutes on a second merge request that needs Vue, HTML and CSS changes; JavaScript, Vue.js and testing.',
            appliesTo: 'Full-stack engineers',
            sources: [GITLAB_GL7_FULLSTACK_2022, GITLAB_GL44_FULLSTACK_2025, GITLAB_GL18_FULLSTACK_2020, GITLAB_GL11_SENIOR_2021],
          },
          {
            stage: 'Manager and director interviews',
            format: 'About an hour each on behavioral and situational questions, values and how you work.',
            appliesTo: 'All candidates',
            sources: [GITLAB_GL18_FULLSTACK_2020, GITLAB_GL44_FULLSTACK_2025, GITLAB_GL5_FULLSTACK_2023],
          },
        ],
      },
    ],
    // Left out for want of a subject: the merge request accounts that describe only the format (2019 to 2023, GL9, GL10,
    // GL12, GL17, GL20 to GL23, GL28, GL35, GL5, the 2019 blog post), the 2021 "trivia quiz in FE tech", the 2019 live
    // coding "from JS standards to weird CSS selectors", the 2022 written take-home, "how your process is architecting
    // things", pros and cons of two unnamed programming languages, and a 2024 Blind round on logic, backwards
    // compatibility and design patterns (role not stated). Left out as history: the 2016 and 2017 loops, a different
    // format before the merge request. Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'vue-merge-request-review',
        round: 'Merge request review',
        kind: 'Practical coding',
        topic: 'Vue merge request review',
        question:
          'Review a merge request on a small Vue app on your own time and request the changes that would improve it, then make them in a 90-minute live coding session. In 2024 it was a simple Vue 2 app that called an API, ran some operations on the data and rendered its UI conditionally.',
        sources: [GITLAB_GL4_FE_2024, GITLAB_GL3_FE_2024],
        practice: { label: 'Review a Vue merge request', path: '/vue/coding/vue-issue-list-merge-request-review' },
        answerGuide: 'review-vue-merge-request-live',
      },
      {
        id: 'repeated-api-calls',
        round: 'Technical interview',
        kind: 'UI debugging',
        topic: 'Repeated API calls in a component',
        question:
          'Find the performance problem in the merge request\'s Vue component. One 2024 candidate cached the data in the component and cut the unnecessary API calls; another saw only afterwards that a button click called the same endpoint every time, when the data could load once, on mount or on the first click, and stay in component data. The second also suspected a retry while loop that could turn infinite, and was told to look at performance in Vue.',
        sources: [GITLAB_GL3_FE_2024, GITLAB_GL4_FE_2024],
        practice: { label: 'Fix an async race in a fetch helper', path: '/javascript/debug/js-debug-async-race' },
        answerGuide: 'stop-refetching-on-click',
      },
      {
        id: 'mobile-layout-from-mock',
        round: 'Technical interview',
        kind: 'UI build',
        topic: 'Mobile layout to match a mock',
        question:
          'Make the merge request\'s view work on mobile: one 2024 account had to match a mobile mock, and both 2024 candidates used media queries, one with Flexbox. The feedback in one account asked for deeper CSS.',
        sources: [GITLAB_GL4_FE_2024, GITLAB_GL3_FE_2024],
        practice: { label: 'Responsive Flexbox navbar', path: '/css/coding/css-flexbox-navbar' },
        answerGuide: 'fix-markup-match-mobile-mock',
      },
      {
        id: 'jest-unit-tests',
        round: 'Technical interview',
        kind: 'Practical coding',
        topic: 'Keeping Jest unit tests passing',
        question:
          'The 2024 merge request came with unit tests in Jest: resolve the issue it targets and keep the tests passing. The candidate who stopped there was turned down, with feedback to look into performance testing a Vue.js app.',
        sources: [GITLAB_GL4_FE_2024],
        practice: { label: 'Build a spy function', path: '/javascript/coding/js-create-spy-function' },
        answerGuide: 'make-unit-tests-catch-bug',
      },
      {
        id: 'gitlab-codebase-pull-request',
        round: 'Merge request review',
        kind: 'Practical coding',
        topic: 'Invalid HTML and plain JavaScript',
        question:
          'Review a 2020 pull request on a Haml page with a Vue instance attached, given no instructions beyond the review. It had two parts: badly invalid HTML to comment on and fix, and plain JavaScript inside the Vue file to convert to Vue; the unit tests and the CI pipeline were also failing.',
        sources: [GITLAB_GL16_FE_2020],
      },
      {
        id: 'scss-haml-merge-request',
        round: 'Merge request review',
        kind: 'Practical coding',
        topic: 'Small SCSS, JavaScript and Haml change',
        question:
          'Review a small merge request of about 30 lines of SCSS, 10 of JavaScript and 30 of HTML and Haml against its requirements, after running it locally. In the call the interviewer asked which changes you suggested and how you would implement them, and said there were too few.',
        sources: [GITLAB_GL15_FE_2020],
      },
      {
        id: 'flux-and-vuex',
        round: 'Written assessment',
        kind: 'Vue concepts',
        topic: 'The Flux pattern and Vuex',
        question: 'GitLab\'s frontend is mostly Vue.js with Vuex: describe in writing what the Flux model is and what the pattern gains you.',
        sources: [GITLAB_GL35_FE_2018],
        practice: { label: 'What Vuex is for', path: '/vue/trivia/vuex-state-management' },
      },
      {
        id: 'browser-page-load',
        round: 'Written assessment',
        kind: 'Web fundamentals',
        topic: 'How a browser loads a page',
        question: 'Describe in writing, in as much detail as you can, what happens in the browser while it loads a page.',
        sources: [GITLAB_GL35_FE_2018, GITLAB_GL27_FE_2019],
        practice: { label: 'How browsers parse and render HTML', path: '/html/trivia/html-parsing-rendering' },
        answerGuide: 'written-page-load-answer',
      },
      {
        id: 'xss-and-prevention',
        round: 'Written assessment',
        kind: 'Web fundamentals',
        topic: 'XSS and how to prevent it',
        question: 'Explain what XSS is and how it can be prevented, in a form of open-ended questions sent after applying.',
        sources: [GITLAB_GL31_SENIOR_2019, GITLAB_GLA2_EM_2019],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
      },
      {
        id: 'framework-or-plain-javascript',
        round: 'Written assessment',
        kind: 'Web fundamentals',
        topic: 'Framework or plain JavaScript',
        question: 'Why and when would you use a JavaScript framework, or React rather than plain JavaScript? Asked in two written forms of open-ended questions.',
        sources: [GITLAB_GL31_SENIOR_2019, GITLAB_GLA2_EM_2019],
      },
      {
        id: 'cors',
        kind: 'Web fundamentals',
        topic: 'CORS',
        question: 'Explain CORS; asked in writing in one 2019 loop and aloud in another.',
        sources: [GITLAB_GL31_SENIOR_2019, GITLAB_GL30_SENIOR_2019],
        practice: { label: 'Handling CORS in a frontend app', path: '/javascript/trivia/js-secure-cors-handling' },
      },
      {
        id: 'slow-loading-list',
        kind: 'Frontend system design',
        topic: 'Speeding up a slow-loading list',
        question: 'Explain how you would optimise a list that loads slowly.',
        sources: [GITLAB_GL30_SENIOR_2019],
        practice: { label: 'Infinite scroll list design', path: '/system-design/infinite-scroll-list' },
      },
      {
        id: 'tagged-search-box',
        kind: 'Frontend system design',
        topic: 'Tagged search box',
        question: 'Explain how you would implement a search box that takes tags.',
        sources: [GITLAB_GL30_SENIOR_2019],
        practice: { label: 'Vue chips input with autocomplete', path: '/vue/coding/vue-chips-input-autocomplete' },
      },
      {
        id: 'this-keyword',
        kind: 'JavaScript',
        topic: 'The this keyword',
        question: 'Explain the this keyword in JavaScript, in an hour of JavaScript questions.',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'Why this is undefined in a callback', path: '/javascript/trivia/js-this-keyword' },
      },
      {
        id: 'closures',
        kind: 'JavaScript',
        topic: 'Closures',
        question: 'What is a closure? Asked in the same hour of JavaScript questions.',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'call-apply-bind',
        kind: 'JavaScript',
        topic: 'Call, apply and bind',
        question: 'How do call, apply and bind differ?',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'Call, apply and bind', path: '/javascript/trivia/js-call-apply-bind' },
      },
      {
        id: 'event-loop',
        kind: 'JavaScript',
        topic: 'The event loop',
        question: 'What is the event loop?',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'Event loop visualizer', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'event-propagation',
        kind: 'Web fundamentals',
        topic: 'Event propagation and bubbling',
        question: 'Explain event propagation and bubbling.',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'Bubbling, capturing and event delegation', path: '/javascript/trivia/js-event-delegation' },
      },
      {
        id: 'es6-classes',
        kind: 'JavaScript',
        topic: 'ES6 classes',
        question: 'Why would you use ES6 classes?',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'Classes in JavaScript', path: '/javascript/trivia/js-classes' },
      },
      {
        id: 'vue-reactivity',
        kind: 'Vue concepts',
        topic: 'Vue reactivity',
        question: 'Explain how Vue\'s reactivity works.',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'The Vue reactivity system', path: '/vue/trivia/vue-reactivity-system' },
      },
      {
        id: 'virtual-dom',
        kind: 'Web fundamentals',
        topic: 'The virtual DOM',
        question: 'What is the virtual DOM?',
        sources: [GITLAB_GL34_FE_2019],
        practice: { label: 'Vue virtual DOM and diffing', path: '/vue/trivia/vue-virtual-dom-diffing' },
      },
      {
        id: 'linked-list',
        kind: 'Algorithm',
        topic: 'Linked list',
        question:
          'Build a linked list in JavaScript while sharing your screen: a 10-minute pair-programming exercise in one account; in another, finished halfway with the interviewer\'s guidance.',
        sources: [GITLAB_GL34_FE_2019, GITLAB_GLA1_EM_FE_2018],
      },
      {
        id: 'rem-and-em',
        kind: 'Web fundamentals',
        topic: 'CSS rem and em units',
        question: 'What are rem and em?',
        sources: [GITLAB_GL33_SENIOR_2019],
        practice: { label: 'em, rem, % and px', path: '/css/trivia/css-units-em-rem-percent-px' },
      },
      {
        id: 'responsive-meta-tag',
        kind: 'Web fundamentals',
        topic: 'Meta tag for responsive pages',
        question: 'Which meta tag do you need to make a web page responsive?',
        sources: [GITLAB_GL8_FE_2022],
        practice: { label: 'Essential tags in the HTML head', path: '/html/coding/html-head-seo-basics' },
      },
      {
        id: 'framework-dom-rendering',
        round: 'Behavioral interview',
        kind: 'Web fundamentals',
        topic: 'How frameworks render to the DOM',
        question: 'Explain how two different frontend frameworks render elements to the DOM.',
        promptNotShared: true,
        sources: [GITLAB_GL12_FE_2021],
      },
      {
        id: 'hotel-elevator-system',
        round: 'Director interview',
        kind: 'Product design',
        topic: 'Hotel elevator system',
        question: 'At a very high level, what would you do to build an elevator system for a hotel?',
        sources: [GITLAB_GL35_FE_2018],
      },
      {
        id: 'gitlab-ui-change',
        kind: 'Product design',
        topic: 'A UI change to GitLab',
        question: 'Name something GitLab, or another piece of software you use, should change in its UI, and say how you would implement it.',
        sources: [GITLAB_GL20_FE_2019],
      },
    ],
    // Left out as screening logistics: compensation, the current tech stack, Agile experience, Rails or Vue experience,
    // "describe your work at x", "tell me about yourself", "have you used GitLab", what you want from your next role.
    behaviouralQuestions: [
      {
        id: 'why-gitlab',
        question: 'Why do you want to work at GitLab?',
        sources: [
          GITLAB_GL1_FE_2025,
          GITLAB_GL13_FE_2020,
          GITLAB_GL17_FE_2020,
          GITLAB_GL18_FULLSTACK_2020,
          GITLAB_GL20_FE_2019,
          GITLAB_GL32_FE_2019,
          GITLAB_GLA2_EM_2019,
        ],
      },
      {
        id: 'creative-problem-solving',
        question: 'Tell me about a time you approached a problem creatively.',
        sources: [GITLAB_GL2_FE_2025, GITLAB_GL1_FE_2025],
      },
      {
        id: 'iterated-on-a-problem',
        question: 'Tell me about a time you iterated on a problem.',
        sources: [GITLAB_GL21_FE_2019],
      },
      {
        id: 'mistake-or-failure',
        question: 'Tell me about a mistake or a failure: how did you put it right, and what did you learn?',
        sources: [GITLAB_GL21_FE_2019, GITLAB_GL13_FE_2020, GITLAB_GL6_FE_2022, GITLAB_GL18_FULLSTACK_2020],
      },
      {
        id: 'bug-in-production',
        question: 'Tell me about a time you introduced a bug into production.',
        sources: [GITLAB_GL20_FE_2019],
      },
      {
        id: 'difficult-bug',
        question: 'Describe a particularly difficult bug you had to debug, and how you solved it.',
        sources: [GITLAB_GL37_FE_2018],
      },
      {
        id: 'disagreement',
        question: 'Tell me about a disagreement with a peer or coworker, such as one where you knew they were wrong, and how you resolved it.',
        sources: [GITLAB_GL13_FE_2020, GITLAB_GL18_FULLSTACK_2020],
      },
      {
        id: 'proud-project',
        question: 'Tell me about a project you were proud of.',
        sources: [GITLAB_GL7_FULLSTACK_2022, GITLAB_GL18_FULLSTACK_2020],
      },
      {
        id: 'behind-schedule',
        question: 'Tell me about a time you were under high time pressure and behind schedule. How did you approach it?',
        sources: [GITLAB_GL13_FE_2020],
      },
      {
        id: 'no-progress-problem',
        question: 'Tell me about a problem everyone was focused on while nobody made progress.',
        sources: [GITLAB_GL12_FE_2021],
      },
      {
        id: 'why-this-team',
        question: 'Why this team?',
        sources: [GITLAB_GL20_FE_2019],
      },
      {
        id: 'like-about-gitlab',
        question: 'What do you like about the GitLab product?',
        sources: [GITLAB_GL13_FE_2020],
      },
      {
        id: 'interest-in-security',
        question: 'Tell me about your interest in security.',
        sources: [GITLAB_GL13_FE_2020],
      },
      {
        id: 'complex-code',
        question: 'Explain a complex piece of code you worked on.',
        sources: [GITLAB_GL28_FE_2019],
      },
      {
        id: 'explain-to-non-programmer',
        question: 'How would you explain a technology, by analogy, to someone who knows nothing about programming?',
        sources: [GITLAB_GL24_FE_2019],
      },
      {
        id: 'why-new-position',
        question: 'Why are you looking for a new position, or leaving your current one?',
        sources: [GITLAB_GL18_FULLSTACK_2020, GITLAB_GL4_FE_2024, GITLAB_GL35_FE_2018],
      },
      {
        id: 'remote-work',
        question: 'Have you worked remotely, or for a remote organization, before?',
        sources: [GITLAB_GL35_FE_2018, GITLAB_GL26_FE_2019],
      },
      {
        id: 'time-conflict-work-style',
        question: 'Give examples of how you manage your time, handle conflict and like to work.',
        sources: [GITLAB_GL14_FULLSTACK_2020],
      },
    ],
  },
  'capital-one': {
    summary:
      'Capital One describes a recruiter screen, an assessment and a Power Day of four hour-long interviews. Senior and lead frontend accounts from 2022 to 2024 describe a CodeSignal assessment, then a Power Day with a frontend design round, a frontend technical round, a case worked through code and a behavioral round. A front-end-focused engineer on a 2025 full-stack loop met the general rounds instead: coding in levels, a code-based case and a backend system design.',
    caveat:
      'The frontend rounds rest on anonymous interview reviews re-posted on Taro and dated 2022 to 2024; no later frontend account describes Power Day. The question list also draws on full-stack and general engineering loops from 2020 to 2026 on Taro, Blind and LeetCode, kept where the question itself is frontend or general.',
    checkedAt: '2026-10-23',
    variants: [
      {
        title: 'Senior frontend engineers, United States, 2022 to 2024',
        stages: [
          {
            stage: 'Recruiter screen',
            format: 'A call about the role and your background; in one account the candidate messaged the recruiter on LinkedIn first.',
            appliesTo: 'All candidates',
            sources: [CAPITALONE_WHAT_TO_EXPECT, CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO4_SENIOR_2024, CAPITALONE_CO6_FRONTEND_2022],
          },
          {
            stage: 'Online assessment',
            format:
              'CodeSignal, about 70 minutes, four LeetCode-style problems in most accounts and three in one; candidates who solved two or three were still invited. Capital One\'s page for AI and ML roles allows ten days to start it and one sitting to finish it.',
            appliesTo: 'All candidates',
            sources: [CAPITALONE_AI_ML_GUIDE, CAPITALONE_CO4_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022, CAPITALONE_CO2_SENIOR_2024],
          },
          {
            stage: 'Power Day: frontend design',
            format:
              'About an hour of frontend design talked through with an engineer rather than coded, with a screen whiteboard for notes. In the 2024 accounts the subject was a credit card screen.',
            appliesTo: 'Frontend engineers',
            sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO3_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022],
            practice: { label: 'Credit card application page case', path: '/system-design/credit-card-application-page' },
          },
          {
            stage: 'Power Day: frontend technical',
            format:
              'About an hour of hands-on work in a frontend framework with an engineer, graded on component structure, syntax and coding style: React in a 2024 account, Angular in 2023 and the candidate\'s choice in 2022, set on CodeSignal that year.',
            appliesTo: 'Frontend engineers',
            sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022],
            practice: { label: 'Fetch and render a list with loading, error and empty states', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Power Day: case',
            format:
              'About an hour on a business scenario worked through existing code: reading it, tracing example numbers and explaining what to fix, in one account without writing the fix. The code came in Java, C++, Node.js or Python in that account; Capital One\'s page for AI and ML roles says the case is built on its publicly available products and needs no financial background.',
            appliesTo: 'Most loops; not every position',
            sources: [CAPITALONE_AI_ML_GUIDE, CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022],
            practice: { label: 'Case practice: fix wrong defaults in a settings helper', path: '/javascript/debug/js-debug-nullish-defaults' },
          },
          {
            stage: 'Power Day: behavioral',
            format: 'STAR questions, in one account all about a single past project.',
            appliesTo: 'All candidates',
            sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022, CAPITALONE_CO9_SENIOR_2024],
          },
          {
            stage: 'Result and team matching',
            format: 'Feedback within a day in one account; in others a pass led to team matching that stalled, a filled position, or a call from another team.',
            appliesTo: 'Candidates who pass',
            sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO3_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022],
          },
        ],
      },
      {
        title: 'Lead frontend engineers, 2022 to 2024',
        note: 'Two accounts.',
        stages: [
          {
            stage: 'Online assessment',
            format: 'A timed assessment; in 2024, four LeetCode problems in 70 minutes, and solving two still led to an invitation.',
            appliesTo: 'The two accounts',
            sources: [CAPITALONE_CO1_LEAD_2024, CAPITALONE_CO7_LEAD_2022],
          },
          {
            stage: 'Power Day',
            format:
              'Four interviews in one day. In 2024: frontend design, a behavioral round, a case study and a frontend technical round run more like pair programming than an interview. In 2022: a framework round, a design round on deployment, a behavioral round and a case built on reading code.',
            appliesTo: 'The two accounts',
            sources: [CAPITALONE_CO1_LEAD_2024, CAPITALONE_CO7_LEAD_2022],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Result',
            format: 'An automated rejection without feedback in 2024; an offer about a month after the first call in 2022.',
            appliesTo: 'The two accounts',
            sources: [CAPITALONE_CO1_LEAD_2024, CAPITALONE_CO7_LEAD_2022],
          },
        ],
      },
    ],
    // Left out by content: backend system designs (a bank, a credit card application system, a payment system, the
    // backend steps of a card approval), a full-stack banking application design, a database scenario, an AWS
    // question, cloud-migration and AWS-heavy cases, log-stream ingestion in Java or Python, and a deployment process
    // design. Left out for want of a subject: assessments described only by count and difficulty, "trivia and concept
    // questions", "a basic interview question" on the framework, an open-ended product design, coding exercises "in
    // levels" with no subject, and phone-screen topics (HTML, CSS, React). Generic Power Day coding rounds have no
    // stage of their own here, so they count under the lead table's Power Day. Behavioural questions are in
    // behaviouralQuestions, open.
    questions: [
      {
        id: 'credit-card-application-page',
        round: 'Power Day: frontend design',
        kind: 'Frontend system design',
        topic: 'Credit card application and confirmation',
        question:
          'Design a credit card application page, where an applicant enters their details, and the confirmation page that follows it. The round was a conversation, with a screen whiteboard for notes.',
        sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO3_SENIOR_2024],
        practice: { label: 'Credit card application page case', path: '/system-design/credit-card-application-page' },
        answerGuide: 'credit-card-application-page-design',
      },
      {
        id: 'credit-card-account-design',
        round: 'Power Day: frontend design',
        kind: 'Frontend system design',
        topic: 'Credit card account design',
        question: 'Design a credit card account.',
        promptNotShared: true,
        sources: [CAPITALONE_CO4_SENIOR_2024],
      },
      {
        id: 'spa-structure-from-requirements',
        round: 'Power Day: frontend design',
        kind: 'Frontend system design',
        topic: 'Single-page app architecture',
        question:
          'Given a set of requirements, say how you would structure and build the web application as a single-page app: component structure, routing, data flow, Redux and API calls, with deeper questions on the framework.',
        sources: [CAPITALONE_CO6_FRONTEND_2022, CAPITALONE_CO5_SENIOR_2023],
        practice: { label: 'UI component and state design from a mock', path: '/system-design/ui-component-state-from-mock' },
        answerGuide: 'single-page-app-from-requirements',
      },
      {
        id: 'electric-meter-usage-web-app',
        round: 'Power Day: frontend design',
        kind: 'Frontend system design',
        topic: 'Electric meter usage web app',
        question:
          'Design the web app of an electric-meter system, where customers and admins see their utility usage; the account\'s tip was to give the UI and UX design real attention.',
        sources: [CAPITALONE_CO52_2021],
      },
      {
        id: 'spa-build-pair-programming',
        round: 'Power Day: frontend technical',
        kind: 'UI build',
        topic: 'Pair-programmed single-page app',
        question: 'Build a single-page application with the interviewer, in a round that ran more like pair programming than a coding test.',
        promptNotShared: true,
        sources: [CAPITALONE_CO1_LEAD_2024],
        answerGuide: 'single-page-app-from-requirements',
      },
      {
        id: 'react-project-components',
        round: 'Power Day: frontend technical',
        kind: 'React build',
        topic: 'Components in a small React project',
        question:
          'Work on a small React project tied to the role while the interviewer watches how you build components, your syntax and your coding style.',
        promptNotShared: true,
        sources: [CAPITALONE_CO2_SENIOR_2024],
        practice: { label: 'React list with loading, error and empty states', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'angular-form-validations',
        round: 'Power Day: frontend technical',
        kind: 'UI build',
        topic: 'Angular form validation',
        question: 'Wire validation into an existing Angular form so that the right rules fire on its fields.',
        sources: [CAPITALONE_CO5_SENIOR_2023],
        practice: { label: 'Form validation with required fields', path: '/html/coding/html-forms-validation-required' },
        answerGuide: 'angular-form-validation',
      },
      {
        id: 'angular-form-message-list',
        round: 'Power Day: frontend technical',
        kind: 'UI build',
        topic: 'Angular message list form',
        question:
          'Starting from a base Angular component, build a form that adds messages to a list, with the form control\'s data flow in focus; the same hour covered JavaScript syntax and performance.',
        sources: [CAPITALONE_CO6_FRONTEND_2022],
        practice: { label: 'Angular todo list starter', path: '/angular/coding/angular-todo-list-starter' },
        answerGuide: 'angular-form-validation',
      },
      {
        id: 'permutations-of-a-number',
        round: 'Power Day: frontend technical',
        kind: 'Algorithm',
        topic: 'Permutations of a number',
        question: 'Write an algorithm that finds all the permutations of a number.',
        sources: [CAPITALONE_CO12_SENIOR_2020],
      },
      {
        id: 'intern-budgeting-bug',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'Budgeting program bug',
        question:
          'Find the bug in a budgeting program an intern wrote, reading it in Java, C++, Node.js or Python, and explain it without coding the fix.',
        sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO49_COMMENT_2023],
        practice: { label: 'Find the bug in an intern\'s budget summary', path: '/javascript/debug/js-debug-intern-budget-summary' },
        answerGuide: 'power-day-case-budgeting-bug',
      },
      {
        id: 'cost-calculation-faulty-algorithm',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'Cost calculation algorithm fix',
        question:
          'Work a business case on cost calculation: agree the requirements, run example calculations to a formula, then find and fix the algorithm in a faulty code sample, talking it through without formal tests.',
        sources: [CAPITALONE_CO6_FRONTEND_2022],
        practice: { label: 'Fix wrong defaults in a teammate helper', path: '/javascript/debug/js-debug-nullish-defaults' },
        answerGuide: 'power-day-case-budgeting-bug',
      },
      {
        id: 'refactor-badly-written-code',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'Refactoring badly written code',
        question:
          'Read badly written code, say what it does, then refactor or improve it, weighing the designs and trade-offs you propose.',
        promptNotShared: true,
        sources: [CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO7_LEAD_2022, CAPITALONE_CO30_LEAD_2023],
        practice: { label: 'Stop mutating caller data in unique', path: '/javascript/debug/js-debug-mutating-input' },
        answerGuide: 'read-explain-refactor-code',
      },
      {
        id: 'banking-chatbot-case',
        round: 'Power Day: case',
        kind: 'Product design',
        topic: 'Banking chatbot',
        question:
          'A case on a bank\'s chatbot: talk through what it brings customers and how they would use it. In one 2023 loop the case went on to code read against a table of data, then improvements to that code.',
        sources: [CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO59_LEAD_2023, CAPITALONE_CO60_SENIOR_2024, CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'ai-feature-case',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'AI feature case and code review',
        question: 'A case about an AI feature, then a code review in which you dry-run the code with sample input, then a small change to it.',
        promptNotShared: true,
        sources: [CAPITALONE_CO32_SENIOR_LEAD_2026],
      },
      {
        id: 'virtual-card-transaction-validation',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'Virtual card transaction validation',
        question: 'A code-based case on a virtual credit card network: check whether its cards and transactions are valid.',
        sources: [CAPITALONE_CO16_FULLSTACK_2025, CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'ec2-cost-table-debug',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'EC2 instance cost debugging',
        question: 'Analyse a table of EC2 instances priced by CPU and location, then debug a method that sums their cost.',
        sources: [CAPITALONE_CO34_COMMENTS_2026],
        practice: { label: 'Find the bug in an intern\'s budget summary', path: '/javascript/debug/js-debug-intern-budget-summary' },
        answerGuide: 'power-day-case-budgeting-bug',
      },
      {
        id: 'testing-and-failing-script',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'Testing and a failing script',
        question: 'Talk about testing and when to use it, then fix a script that throws an error, following the business rules you are given.',
        sources: [CAPITALONE_CO53_SENIOR_2024],
      },
      {
        id: 'boolean-if-else-method',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'Boolean if-else chain',
        question: 'Work through a method that takes three boolean values and runs them through a long chain of if-else statements.',
        promptNotShared: true,
        sources: [CAPITALONE_CO52_2021],
      },
      {
        id: 'acquired-codebase-if-else',
        round: 'Power Day: case',
        kind: 'Practical coding',
        topic: 'Codebase merge and if-else debugging',
        question: 'Discuss merging an acquired company\'s codebase into your own, then debug an if-else statement.',
        sources: [CAPITALONE_CO57_TDP_2020],
      },
      {
        id: 'diagonal-matrix-traverse',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Diagonal Traverse',
        question: 'A variation of LeetCode\'s Diagonal Traverse (498): walk a 2D matrix diagonal by diagonal. The account rates it the set\'s medium problem.',
        sources: [CAPITALONE_CO6_FRONTEND_2022],
      },
      {
        id: 'k-diff-pairs',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'K-diff Pairs in an Array',
        question: 'A variation of LeetCode\'s K-diff Pairs in an Array (532): count the distinct pairs whose difference is k. The account rates it the set\'s hard problem.',
        sources: [CAPITALONE_CO6_FRONTEND_2022],
      },
      {
        id: 'array-and-weighted-graph-problems',
        round: 'Online assessment',
        kind: 'Algorithm',
        topic: 'Array navigation and weighted graph',
        question: 'The same set\'s other problems: a simple array navigation task and a question on an undirected weighted graph.',
        promptNotShared: true,
        sources: [CAPITALONE_CO6_FRONTEND_2022],
      },
      {
        id: 'banking-system-in-levels',
        round: 'Power Day',
        kind: 'Practical coding',
        topic: 'Banking system class',
        question:
          'Build a banking system as a class, part by part: create accounts and add money, transfer between accounts, then report the most active accounts, each part building on the last.',
        sources: [CAPITALONE_CO35_COMMENT_2025, CAPITALONE_CO53_SENIOR_2024, CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'trie-in-levels',
        round: 'Power Day',
        kind: 'Algorithm',
        topic: 'Object-oriented trie',
        question: 'An object-oriented exercise on a trie in three levels, each adding features to the one before.',
        promptNotShared: true,
        sources: [CAPITALONE_CO32_SENIOR_LEAD_2026],
      },
      {
        id: 'api-call-and-parse',
        round: 'Power Day',
        kind: 'Practical coding',
        topic: 'Calling and parsing an API',
        question: 'Write code that calls an API and parses its response in several different ways.',
        promptNotShared: true,
        sources: [CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'two-sum-closest-to-zero',
        kind: 'Algorithm',
        topic: 'Two sum closest to zero',
        question: 'Given an array, find the two numbers whose sum is closest to zero.',
        sources: [CAPITALONE_CO52_2021, CAPITALONE_CO20_WEB_2022],
        practice: { label: '3Sum: triplets that sum to zero', path: '/javascript/coding/js-three-sum' },
      },
      {
        id: 'count-character-in-string',
        kind: 'Algorithm',
        topic: 'Character count in a string',
        question: 'Given a string, count how many times a given character appears in it.',
        sources: [CAPITALONE_CO59_LEAD_2023],
        practice: { label: 'Count vowels', path: '/javascript/coding/js-count-vowels' },
      },
      {
        id: 'rotating-box-gravity',
        kind: 'Algorithm',
        topic: 'Rotating box with gravity',
        question: 'Implement gravity for the items inside a box that rotates and contains obstacles.',
        sources: [CAPITALONE_CO62_LEAD_2025],
      },
      {
        id: 'minesweeper',
        kind: 'UI build',
        topic: 'Minesweeper game',
        question: 'Build the game Minesweeper.',
        promptNotShared: true,
        sources: [CAPITALONE_CO14_FE_2020],
      },
    ],
    // Left out as a format rather than a question: "heavily focused on a single project from my past" (the stage says
    // it). Other behavioural rounds give a count of questions without the questions.
    behaviouralQuestions: [
      {
        id: 'learned-something-new',
        question: 'Tell me about a time you had to learn something new, quickly, to get a task done.',
        sources: [CAPITALONE_CO6_FRONTEND_2022, CAPITALONE_CO16_FULLSTACK_2025],
      },
      {
        id: 'disagreement-with-a-coworker',
        question: 'Tell me about a time you disagreed with a coworker, and how you handled it.',
        sources: [CAPITALONE_CO6_FRONTEND_2022, CAPITALONE_CO9_SENIOR_2024],
      },
      {
        id: 'shifting-priorities',
        question: 'Tell me about a time you had to deal with shifting priorities.',
        sources: [CAPITALONE_CO6_FRONTEND_2022],
      },
      {
        id: 'mentoring-experience',
        question: 'Have you mentored someone before? What did that involve?',
        sources: [CAPITALONE_CO15_SENIOR_2021],
      },
      {
        id: 'use-of-ai',
        question: 'A question on the use of AI, which closed the behavioral hour of a 2026 loop.',
        sources: [CAPITALONE_CO32_SENIOR_LEAD_2026],
      },
    ],
  },
  crowdstrike: {
    summary:
      'CrowdStrike\'s interviewing page lists eight general hiring steps, from a recruiter conversation and a hiring manager interview to a skills assessment, more interviews, references, an offer and a background check, and says your recruiter will explain the steps for your role. Frontend and UI accounts from 2021 to 2025 describe a recruiter call, a manager round, spoken web fundamentals with engineers, a take-home build and a review of it; one 2022 account instead ended with an all-day virtual on-site and mentions no take-home.',
    caveat:
      'Built from frontend and UI accounts dated 2021 to 2025, most of them anonymous interview reviews re-posted on Taro, four intern accounts from other teams and CrowdStrike careers pages. The question list adds a 2020 account, a 2024 general software engineer loop and a 2022 Blind comment on a screening and an on-site; two 2026 commenters on a full-stack thread give the behavioural questions. No frontend account from 2026 was found.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend and UI engineers, United States, 2021 to 2025',
        note: 'The fullest 2025 account is a manager loop, so its manager and culture rounds may not apply to individual contributors.',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'A short call about the role and your background, 15 minutes in one 2022 account. One 2025 candidate could not find out beforehand whether the technical round would include coding; it was a question-and-answer round.',
            appliesTo: 'All candidates',
            sources: [
              CROWDSTRIKE_INTERVIEWING,
              CROWDSTRIKE_CS1_EM_FE_2025,
              CROWDSTRIKE_CS2_UI_DEV_2025,
              CROWDSTRIKE_CS8_FE_2024,
              CROWDSTRIKE_CS9_SENIOR_FE_2023,
              CROWDSTRIKE_CS12_SENIOR_FE_2022,
              CROWDSTRIKE_CS13_FE_2022,
            ],
          },
          {
            stage: 'Hiring manager',
            format:
              'An early talk with the hiring manager or an engineering manager about your experience, 30 minutes in one 2022 account. Some managers add technical knowledge questions.',
            appliesTo: 'Most candidates',
            sources: [
              CROWDSTRIKE_INTERVIEWING,
              CROWDSTRIKE_CS1_EM_FE_2025,
              CROWDSTRIKE_CS6_SENIOR_2024,
              CROWDSTRIKE_CS8_FE_2024,
              CROWDSTRIKE_CS9_SENIOR_FE_2023,
              CROWDSTRIKE_CS13_FE_2022,
              CROWDSTRIKE_CS16_UI_2022,
              CROWDSTRIKE_CS17_UI_2021,
            ],
          },
          {
            stage: 'Web fundamentals with engineers',
            format:
              'Spoken technical questions from engineers, two of them in five accounts. In one 2023 account they took turns reading from a list, one 2022 account gives the round an hour, and three accounts say there was no LeetCode-style or algorithm problem.',
            appliesTo: 'Most candidates',
            sources: [
              CROWDSTRIKE_CS1_EM_FE_2025,
              CROWDSTRIKE_CS2_UI_DEV_2025,
              CROWDSTRIKE_CS6_SENIOR_2024,
              CROWDSTRIKE_CS20_SENIOR_FE_2024,
              CROWDSTRIKE_CS8_FE_2024,
              CROWDSTRIKE_CS9_SENIOR_FE_2023,
              CROWDSTRIKE_CS10_UI_2023,
              CROWDSTRIKE_CS12_SENIOR_FE_2022,
              CROWDSTRIKE_CS13_FE_2022,
              CROWDSTRIKE_CS15_SENIOR_UI_2022,
              CROWDSTRIKE_CS17_UI_2021,
            ],
            // The event-delegation explainer now practises a locked row, so the open link is the broad fundamentals quiz.
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Take-home build',
            format:
              'A small UI built at home, from a screenshot in the 2025 account. One 2022 account could use any language or framework, and a 2021 account had 4 hours to finish its project.',
            appliesTo: 'Candidates who pass the earlier rounds, in half the US accounts',
            sources: [
              CROWDSTRIKE_CS1_EM_FE_2025,
              CROWDSTRIKE_CS6_SENIOR_2024,
              CROWDSTRIKE_CS12_SENIOR_FE_2022,
              CROWDSTRIKE_CS14_FE_2022,
              CROWDSTRIKE_CS16_UI_2022,
              CROWDSTRIKE_CS17_UI_2021,
              CROWDSTRIKE_CS18_SENIOR_UI_2021,
            ],
            practice: { label: 'Tables and accessibility', path: '/html/coding/html-tables-accessibility' },
          },
          {
            stage: 'Take-home review',
            format:
              'A call with engineers, two in two accounts, on the take-home you submitted and how you would develop it further. In 2022 one review talked through some pseudo code without a whiteboard, and in another the reviewers did not know React, the framework the candidate had chosen.',
            appliesTo: 'Most candidates who submit it',
            sources: [
              CROWDSTRIKE_CS1_EM_FE_2025,
              CROWDSTRIKE_CS6_SENIOR_2024,
              CROWDSTRIKE_CS12_SENIOR_FE_2022,
              CROWDSTRIKE_CS16_UI_2022,
            ],
            // No open link: the review answer page is the practice task of the locked review rows.
          },
          {
            stage: 'Closing round',
            format:
              'A culture interview with someone outside engineering, a collaboration panel or a final talk with the hiring manager. The 2022 final talk covered the team, the work, training and the tech stack.',
            appliesTo: 'Some candidates',
            sources: [CROWDSTRIKE_CS1_EM_FE_2025, CROWDSTRIKE_CS6_SENIOR_2024, CROWDSTRIKE_CS16_UI_2022],
            // The hiring-manager round takes the general behavioural guide; a culture round is scored on its signals.
            practice: { label: 'Behavioral interview scorecard', path: '/guides/behavioral/evaluation-areas' },
          },
          {
            stage: 'Result',
            format: 'An offer, in one 2021 account with an attempt to down-level the candidate, or a standard rejection email without feedback. Loops took one to four months.',
            appliesTo: 'All candidates',
            sources: [
              CROWDSTRIKE_CS6_SENIOR_2024,
              CROWDSTRIKE_CS9_SENIOR_FE_2023,
              CROWDSTRIKE_CS14_FE_2022,
              CROWDSTRIKE_CS16_UI_2022,
              CROWDSTRIKE_CS17_UI_2021,
              CROWDSTRIKE_CS18_SENIOR_UI_2021,
            ],
          },
        ],
      },
      {
        title: 'Senior frontend engineers, United Kingdom and Denmark, 2024 to 2025',
        note: 'Single reports: one from the United Kingdom in 2024 and one from Denmark in 2025.',
        stages: [
          {
            stage: 'Technical questions, two stages',
            format: 'One 2024 report: two stages of technical questions read from a list to prevent bias, about two weeks for both.',
            appliesTo: 'Senior front-end engineers',
            sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024],
            // The CORS explainer now practises a locked row, so the open link is the broad fundamentals quiz.
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Home task',
            format:
              'One 2024 report: a week to deliver a task estimated at 5 hours, which took the candidate 10. The submission used native web components with a little Ember, the reply came nearly three weeks later, and the only feedback was that Ember was not the candidate\'s primary framework.',
            appliesTo: 'Senior front-end engineers',
            sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024],
          },
          {
            stage: 'Announced later stages',
            format:
              'One 2024 report: a presentation, a team meet-and-greet and a talk with HR were announced. The candidate was rejected before them, so their content is unknown.',
            appliesTo: 'Candidates who pass the task',
            sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024],
          },
          {
            stage: 'Live coding',
            format: "One 2025 report: a 90-minute live coding exercise in a language of the candidate's choice.",
            appliesTo: 'Senior front-end engineers',
            sources: [CROWDSTRIKE_CS3_SENIOR_FE_2025],
          },
          {
            stage: 'Whiteboard design',
            format: 'One 2025 report: a whiteboard exercise on a system whose requirements were sent in advance, so it could be prepared.',
            appliesTo: 'Senior front-end engineers',
            sources: [CROWDSTRIKE_CS3_SENIOR_FE_2025],
          },
        ],
      },
      {
        title: 'Interns and new graduates',
        stages: [
          {
            stage: 'Application and recruiter contact',
            format: 'A recruiter reaches out with details of the position and the process if the application looks like a strong fit.',
            appliesTo: 'All applicants',
            sources: [CROWDSTRIKE_EMERGING_TALENT],
          },
          {
            stage: 'Technical assessment',
            format:
              'Technical positions add an assessment, and CrowdStrike names HackerRank for Emerging Talent technical roles. Four intern accounts from other teams (machine learning, data engineering, engineering, software development; not UI) describe online tests, three of them on HackerRank or CodeSignal.',
            appliesTo: 'Technical roles',
            sources: [
              CROWDSTRIKE_INTERVIEWING,
              CROWDSTRIKE_EMERGING_TALENT,
              CROWDSTRIKE_UK_UNIVERSITY,
              CROWDSTRIKE_TB_SWE_INTERN_2025,
              CROWDSTRIKE_TB_ENG_INTERN_2024,
              CROWDSTRIKE_TB_ML_INTERN_2024,
              CROWDSTRIKE_TB_DATA_INTERN_2024,
            ],
          },
          {
            stage: 'Interviews',
            format:
              'Up to three interview rounds. A 2023 UI engineer intern had a phone screen, a technical interview and a behavioral interview that also asked technical questions.',
            appliesTo: 'All applicants',
            sources: [CROWDSTRIKE_EMERGING_TALENT, CROWDSTRIKE_UK_UNIVERSITY, CROWDSTRIKE_CS11_UI_INTERN_2023],
          },
          {
            stage: 'Second team',
            format: 'The intern met a second team for a casual behavioral interview two weeks later and received an offer the next day.',
            appliesTo: 'Some candidates',
            sources: [CROWDSTRIKE_CS11_UI_INTERN_2023],
          },
        ],
      },
    ],
    // Rounds follow the account's own structure: CS1 lists its questions apart from its rounds, but names the round with
    // two engineers as mostly frontend fundamentals and the take-home follow-up separately; CS7's only question rounds
    // were its two stages; the intern's questions sit in its Interviews stage. A row whose accounts sit in different
    // rounds, or name none, shows no round. Left out for want of a subject: "mostly basic knowledge" (CS2), medium to
    // advanced JavaScript, HTML and CSS with some cybersecurity questions (CS10), standard JavaScript questions under an NDA (CS12),
    // questions "all over the place" (CS13), a trivia-style round (CS20), CS7's line of general topics, CS11's "HTML/CSS
    // questions", CS19's "framework-related questions", rounds withheld under an NDA (CS6, CS16, CS18) and the generic
    // loops' "LeetCode easy" problems. Left out by content: a take-home review on failure modes and concurrent uploads
    // (2026 commenter, backend design), a design of "certain aspects of a website" (CS22, UI or backend not stated) and a
    // presented design of a popular website (CS23, a general loop). Generic software engineer loops (CSG1 to CSG25 in the
    // record) were kept apart by the research and are not swept. Behavioural questions are in behaviouralQuestions, open.
    questions: [
      {
        id: 'downloadable-files-table',
        round: 'Take-home build',
        kind: 'UI build',
        topic: 'Downloadable files table from a screenshot',
        question: 'Take-home: from a screenshot the interviewers provide, code a table that lists a few downloadable files with their details.',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Downloadable files table', path: '/react/coding/react-files-table-select-all' },
        answerGuide: 'downloadable-files-table-select-all',
      },
      {
        id: 'take-home-design-changes-filtering-sorting',
        round: 'Take-home review',
        kind: 'UI build',
        topic: 'Design changes, filtering and sorting',
        question:
          'In the follow-up interview on the take-home, two engineers asked what you would change about your design and how you would implement filtering and sorting in the table.',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Take-home table review questions', path: '/react/trivia/react-take-home-table-review-questions' },
        answerGuide: 'take-home-review-defend-extend',
      },
      {
        id: 'select-all-across-pages',
        round: 'Take-home review',
        kind: 'UI build',
        topic: 'Select all across pages',
        question:
          'In the take-home follow-up: what if a user wants to select all, and what if someone selects all, goes to another page and deselects a few?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Take-home table review questions', path: '/react/trivia/react-take-home-table-review-questions' },
        answerGuide: 'take-home-review-defend-extend',
      },
      {
        id: 'thousands-of-entries',
        round: 'Take-home review',
        kind: 'Frontend system design',
        topic: 'Thousands of table entries',
        question: 'In the take-home follow-up: how would you manage thousands of entries?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Infinite scroll list design', path: '/system-design/infinite-scroll-list' },
        answerGuide: 'take-home-review-defend-extend',
      },
      {
        id: 'file-download-status',
        round: 'Take-home review',
        kind: 'Frontend system design',
        topic: 'When to load file download status',
        question: 'In the take-home follow-up: when should the app get each file\'s status, whether it is available for download or not?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Take-home table review questions', path: '/react/trivia/react-take-home-table-review-questions' },
        answerGuide: 'take-home-review-defend-extend',
      },
      {
        id: 'generalised-table-component',
        round: 'Take-home review',
        kind: 'Frontend system design',
        topic: 'Generalising the table component',
        question: 'In the take-home follow-up: should this component be a generalised one?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Take-home table review questions', path: '/react/trivia/react-take-home-table-review-questions' },
        answerGuide: 'take-home-review-defend-extend',
      },
      {
        id: 'cross-site-scripting',
        round: 'Web fundamentals with engineers',
        kind: 'Web fundamentals',
        topic: 'Cross-site scripting (XSS)',
        question: 'What is XSS, and how would you deal with cross-site scripting attacks?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025, CROWDSTRIKE_CS9_SENIOR_FE_2023],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
        answerGuide: 'explain-xss-and-cors',
      },
      {
        id: 'var-let-const',
        kind: 'JavaScript',
        topic: 'The var, let and const keywords',
        question: 'What is the difference between var, let and const?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025, CROWDSTRIKE_CS7_SENIOR_FE_2024],
        practice: { label: 'Block scope and function scope', path: '/javascript/trivia/js-block-scoped-or-function-scoped' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'event-bubbling-delegation',
        kind: 'Web fundamentals',
        topic: 'Event bubbling and delegation',
        question: 'What are event bubbling and event delegation?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025, CROWDSTRIKE_CS11_UI_INTERN_2023],
        practice: { label: 'Bubbling, capturing and event delegation', path: '/javascript/trivia/js-event-delegation' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'css-box-model',
        kind: 'Web fundamentals',
        topic: 'The CSS box model',
        question: 'Describe the CSS box model.',
        sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024, CROWDSTRIKE_CS9_SENIOR_FE_2023],
        practice: { label: 'The box model and box-sizing', path: '/css/trivia/css-box-model' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'how-cors-works',
        kind: 'Web fundamentals',
        topic: 'CORS',
        question: 'How does CORS work? A 2020 account names CORS among short front-end questions without giving their wording.',
        sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024, CROWDSTRIKE_CS19_FE_2020],
        practice: { label: 'Handling CORS in a frontend app', path: '/javascript/trivia/js-secure-cors-handling' },
        answerGuide: 'explain-xss-and-cors',
      },
      {
        id: 'url-to-page',
        round: 'Web fundamentals with engineers',
        kind: 'Web fundamentals',
        topic: 'What happens after entering a URL',
        question: 'Describe what happens after a user types a URL into the browser\'s address bar.',
        sources: [CROWDSTRIKE_CS21_SENIOR_SWE_2024, CROWDSTRIKE_CS9_SENIOR_FE_2023],
        practice: { label: 'How browsers parse and render HTML', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'closures',
        kind: 'JavaScript',
        topic: 'Closures',
        question: 'Explain closures, with clear examples of how they work.',
        sources: [CROWDSTRIKE_CS11_UI_INTERN_2023, CROWDSTRIKE_CSC1_SENIOR_2022],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'frontend-performance',
        kind: 'Web fundamentals',
        topic: 'Frontend performance and optimisation',
        question:
          'How would you improve a frontend\'s performance? One account was quizzed on tree shaking, code splitting and the browser\'s storage mechanisms; another says only that frontend optimisation came up.',
        sources: [CROWDSTRIKE_CS3_SENIOR_FE_2025, CROWDSTRIKE_CSC1_SENIOR_2022],
        practice: { label: 'Optimising page load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'real-time-dashboard',
        kind: 'Frontend system design',
        topic: 'Real-time data dashboard',
        question: 'Design a frontend dashboard that is highly interactive, stays fast and pulls in real-time data.',
        sources: [CROWDSTRIKE_CS4_SENIOR_FE_2025],
        practice: { label: 'Real-time model training dashboard', path: '/system-design/model-training-progress-dashboard' },
        answerGuide: 'real-time-dashboard-stays-fast',
      },
      {
        id: 'promises-nested',
        round: 'Web fundamentals with engineers',
        kind: 'JavaScript',
        topic: 'Promises and nested promises',
        question: 'What are promises, and how do you handle deeply nested promises?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'bind-call-apply',
        round: 'Web fundamentals with engineers',
        kind: 'JavaScript',
        topic: 'Bind, call and apply',
        question: 'What do bind, call and apply do?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Call, apply and bind', path: '/javascript/trivia/js-call-apply-bind' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'css-specificity',
        round: 'Web fundamentals with engineers',
        kind: 'Web fundamentals',
        topic: 'CSS specificity',
        question: 'What is CSS specificity?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Cascade and specificity', path: '/css/trivia/css-cascade-order' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'managing-z-index',
        round: 'Web fundamentals with engineers',
        kind: 'Web fundamentals',
        topic: 'Managing z-index',
        question: 'How do you manage z-index?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'How z-index works', path: '/css/trivia/css-z-index' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'old-and-new-functions',
        round: 'Web fundamentals with engineers',
        kind: 'JavaScript',
        topic: 'Old and new functions',
        question: 'What is the difference between old and new functions in JavaScript? The account does not say which kinds of function it means.',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
      },
      {
        id: 'accessibility-concerns',
        round: 'Web fundamentals with engineers',
        kind: 'Web fundamentals',
        topic: 'Accessibility concerns',
        question: 'Name some accessibility concerns.',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
        practice: { label: 'Making a page accessible', path: '/html/trivia/web-accessibility-make-page-accessible' },
      },
      {
        id: 'separation-of-concerns',
        kind: 'Web fundamentals',
        topic: 'Separation of concerns',
        question: 'What is separation of concerns?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
      },
      {
        id: 'single-file-components',
        kind: 'Web fundamentals',
        topic: 'Single-file components or split files',
        question: 'Do you prefer single-file components, or a component split by language into HTML, CSS and JavaScript files?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
      },
      {
        id: 'framework-pros-and-cons',
        kind: 'Web fundamentals',
        topic: 'Pros and cons of your framework',
        question: 'What are the pros and cons of your favourite frontend framework?',
        sources: [CROWDSTRIKE_CS1_EM_FE_2025],
      },
      {
        id: 'iteration-and-recursion',
        round: 'Web fundamentals with engineers',
        kind: 'JavaScript',
        topic: 'Iteration and recursion',
        question: 'What is the difference between iteration and recursion?',
        sources: [CROWDSTRIKE_CS9_SENIOR_FE_2023],
      },
      {
        id: 'javascript-threads',
        round: 'Web fundamentals with engineers',
        kind: 'JavaScript',
        topic: 'JavaScript threading model',
        question:
          'Is JavaScript single-threaded or multi-threaded? It came straight after the candidate had mentioned the single thread in an answer about promises.',
        sources: [CROWDSTRIKE_CS15_SENIOR_UI_2022],
        practice: { label: 'Web Workers and the main thread', path: '/javascript/trivia/js-web-workers-basics' },
      },
      {
        id: 'merging-objects-complexity',
        round: 'Web fundamentals with engineers',
        kind: 'JavaScript',
        topic: 'Complexity of merging two objects',
        question: 'State the time complexity of merging two objects.',
        sources: [CROWDSTRIKE_CS15_SENIOR_UI_2022],
        practice: { label: 'Big-O notation', path: '/javascript/trivia/js-big-o-notation' },
      },
      {
        id: 'event-loop',
        kind: 'JavaScript',
        topic: 'The event loop',
        question: 'In the initial screening: explain the event loop in detail.',
        sources: [CROWDSTRIKE_CSC1_SENIOR_2022],
        practice: { label: 'Event loop visualizer', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'implement-promise-api',
        kind: 'JavaScript',
        topic: 'Implementing the Promise API',
        question: 'In the same screening: implement the Promise API; which of its methods were expected is not stated.',
        sources: [CROWDSTRIKE_CSC1_SENIOR_2022],
        practice: { label: 'Implement Promise.all', path: '/javascript/coding/js-promise-all' },
      },
      {
        id: 'object-prototypes',
        kind: 'JavaScript',
        topic: 'Object prototypes',
        question: 'In the same screening: explain object prototypes.',
        sources: [CROWDSTRIKE_CSC1_SENIOR_2022],
        practice: { label: 'Prototypal inheritance', path: '/javascript/trivia/js-prototypal-inheritance' },
      },
      {
        id: 'upcoming-features',
        round: 'Technical questions, two stages',
        kind: 'Web fundamentals',
        topic: 'Upcoming features you look forward to',
        question: 'Which upcoming features are you looking forward to?',
        sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024],
      },
      {
        id: 'copying-objects',
        round: 'Technical questions, two stages',
        kind: 'JavaScript',
        topic: 'Copying objects',
        question: 'How do you copy objects in JavaScript?',
        sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024],
        practice: { label: 'Shallow and deep copies', path: '/javascript/trivia/js-shallow-vs-deep-copy' },
        answerGuide: 'web-fundamentals-rapid-round',
      },
      {
        id: 'hoisting',
        round: 'Interviews',
        kind: 'JavaScript',
        topic: 'Hoisting',
        question: 'A JavaScript question on hoisting.',
        promptNotShared: true,
        sources: [CROWDSTRIKE_CS11_UI_INTERN_2023],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'prop-drilling',
        round: 'Interviews',
        kind: 'React concepts',
        topic: 'Prop drilling',
        question: 'A front-end question on prop drilling.',
        promptNotShared: true,
        sources: [CROWDSTRIKE_CS11_UI_INTERN_2023],
        practice: { label: 'Lifting state up in React', path: '/react/trivia/react-lifting-state-up' },
      },
      {
        id: 'unit-testing-approach',
        kind: 'Web fundamentals',
        topic: 'Approach to unit testing',
        question: 'How do you handle unit testing?',
        sources: [CROWDSTRIKE_CS17_UI_2021],
      },
      {
        id: 'calculator-widget',
        kind: 'UI build',
        topic: 'Calculator widget',
        question: 'At an on-site, build a calculator widget in plain JavaScript, without React or any third-party library.',
        sources: [CROWDSTRIKE_CSC1_SENIOR_2022],
      },
      {
        id: 'minesweeper-game',
        kind: 'UI build',
        topic: 'Minesweeper game',
        question: 'At the same on-site, build a Minesweeper game in plain JavaScript, without React or any third-party library.',
        sources: [CROWDSTRIKE_CSC1_SENIOR_2022],
      },
      {
        id: 'javascript-design-patterns',
        kind: 'JavaScript',
        topic: 'JavaScript design patterns',
        question:
          'At the same on-site, a quiz on JavaScript design patterns: are classes or functions better, and why? Name five common frontend design patterns and explain each in detail.',
        sources: [CROWDSTRIKE_CSC1_SENIOR_2022],
        practice: { label: 'JavaScript design patterns', path: '/javascript/trivia/js-design-patterns' },
      },
    ],
    behaviouralQuestions: [
      {
        id: 'past-project-decisions',
        question: 'Present a project you worked on: why did you make the decisions you made?',
        sources: [CROWDSTRIKE_CSP3_COMMENTS_2026],
      },
      {
        id: 'handling-conflict',
        question: 'How do you handle conflict?',
        sources: [CROWDSTRIKE_CSP3_COMMENTS_2026],
      },
    ],
  },
  airbnb: {
    summary:
      'Airbnb\'s careers FAQ says the process depends on the position, can involve a test, a video or an event, and makes it a priority that candidates meet several people on the current team. Frontend accounts from 2024 and 2025 describe a recruiter call and a technical screen, then UI and JavaScript coding, frontend system design and a deep dive into a past project, with core values or behavioural questions in some loops.',
    caveat:
      'Accounts disagree on algorithms: a 2024 front-end developer had none, while two 2025 candidates got a LeetCode-hard problem. Most accounts list tasks without naming the round, so the rows group them by type and give no order. Several accounts carry a software engineer or full-stack title but describe frontend rounds, and no account of a 2026 frontend interview was found.',
    checkedAt: '2026-11-13',
    variants: [
      {
        title: 'Frontend engineers, mostly 2024 to 2025',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'A short call about your experience, in a 2025 front-end engineer account. Two 2025 candidates were then sent prep material, one of them told to expect frontend concepts and best practices; in 2024 a frontend candidate who asked the recruiter what to expect heard anything in JavaScript, with LeetCode problems as the practice examples.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB9_FE_2025, AIRBNB_AB13_SWE_2025, AIRBNB_AB2_POSTER_2024],
          },
          {
            stage: 'Technical screen',
            format:
              'A live coding screen whose content differs from one account to the next. In 2024 the code had to pass every test case, and one interviewer said he would keep adding questions until time ran out. A 2025 full-stack screen gave 40 of its 60 minutes to building UI and the rest to product questions, and a 2025 front-end candidate sent frontend prep material got a LeetCode-hard algorithm problem instead. A 2025 poster\'s later edit says the screen is a common UI component or a design question, and a 2021 account had two screens in HTML, CSS and JavaScript.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB9_FE_2025, AIRBNB_AB17_FULLSTACK_2025, AIRBNB_AB7_SCREEN_2025, AIRBNB_AB12_FE_2024, AIRBNB_AB2_POSTER_2024, AIRBNB_AB6_FE_2021],
            practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
          },
          {
            stage: 'Coding: UI or React',
            format:
              'UI built live, in React or with plain DOM code. A 2025 staff loop and a 2022 front-end loop both built a card game, styled in the 2025 version, and the staff candidate found both of that loop\'s coding challenges unrelated to the job. A 2024 frontend candidate finished neither the DOM or React round nor the JavaScript round before time ran out, and a 2024 software engineer who found the loop not difficult advised studying vanilla JavaScript. A 2021 onsite had one HTML, CSS and JavaScript round, and a 2022 commenter joining as a senior front end engineer found the interviews mostly JavaScript and CSS with some React.',
            appliesTo: 'Frontend engineers',
            sources: [
              AIRBNB_AB10_STAFF_FE_2025,
              AIRBNB_AB1_FE_2022,
              AIRBNB_AB8_SWE_2024,
              AIRBNB_AB12_FE_2024,
              AIRBNB_AB15_SENIOR_2024,
              AIRBNB_AB6_FE_2021,
              AIRBNB_AB4_COMMENT_2022,
            ],
            practice: { label: 'React tic-tac-toe', path: '/react/coding/react-tictactoe' },
          },
          {
            stage: 'Coding: JavaScript',
            format:
              'JavaScript coding without a framework. A 2024 frontend loop listed it as a round of its own beside the DOM or React one, a 2024 software engineer had some vanilla JavaScript questions, and a 2024 commenter whose rounds were very frontend-focused was asked about JavaScript fundamentals. In a 2024 senior loop the interviewer gave no feedback and ended the session 15 minutes early.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB12_FE_2024, AIRBNB_AB8_SWE_2024, AIRBNB_AB2_COMMENT_2024, AIRBNB_AB16_SENIOR_2024],
            practice: { label: 'Frontend fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
          },
          {
            stage: 'Frontend system design',
            format:
              'A spoken design of a frontend app or component. A 2024 frontend candidate describes state, data, APIs, trade-offs and optimisations, and in 2022 an Airbnb-badged commenter wrote that you architect a project, one of your own or one the interviewer picks, depending on level. In 2025 a staff candidate felt the design round did not fit the role, and another candidate found the question closer to a devops role than to the front-end-heavy job and its prep packet.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB13_SWE_2025, AIRBNB_AB10_STAFF_FE_2025, AIRBNB_AB11_FE_2024, AIRBNB_AB12_FE_2024, AIRBNB_AB1_FE_2022, AIRBNB_AB3_COMMENT_2022],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Experience deep dive',
            format:
              'One past project discussed in depth, in one account a project the candidate led. A 2025 staff loop had a deep dive into a past project, and in 2024 an Airbnb-badged commenter called it the technical experience interview and believed every engineer gets one. Two 2022 commenters also had an experience round, one of them recalling six interviews in all.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB10_STAFF_FE_2025, AIRBNB_AB12_FE_2024, AIRBNB_AB20_COMMENT_2024, AIRBNB_AB4_COMMENT_2022, AIRBNB_AB3_COMMENT_2022],
            practice: { label: 'Behavioural stories', path: '/guides/behavioral/stories' },
          },
          {
            stage: 'Core values or behavioural',
            format:
              'A core values interview besides the onsite, in a 2024 account from Mexico. A 2024 senior account lists behavioural questions without giving them, and a 2022 commenter recalled one behavioural interview among six.',
            appliesTo: 'Some loops',
            sources: [AIRBNB_AB11_FE_2024, AIRBNB_AB14_SENIOR_2024, AIRBNB_AB4_COMMENT_2022],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Algorithms',
            format:
              'Accounts disagree. A 2024 front-end developer in Mexico had no algorithms and a 2022 commenter joining as a senior front end engineer not much, while a 2021 onsite had one array problem and an Airbnb-badged commenter listed one LeetCode-medium problem among the frontend interviews in 2022. In 2025 two candidates got a LeetCode-hard problem, one in the technical screen and one as a 45-minute onsite puzzle.',
            appliesTo: 'Some loops',
            sources: [AIRBNB_AB13_SWE_2025, AIRBNB_AB9_FE_2025, AIRBNB_AB11_FE_2024, AIRBNB_AB4_COMMENT_2022, AIRBNB_AB3_COMMENT_2022, AIRBNB_AB6_FE_2021],
            practice: { label: 'DSA for frontend loops', path: '/guides/interview-blueprint/dsa-for-fe' },
          },
          {
            stage: 'Team matching',
            format: 'Conversations with a few hiring managers after the interviews, in one 2024 senior account. The recruiter then went silent for months despite follow-ups.',
            appliesTo: 'The one account',
            sources: [AIRBNB_AB14_SENIOR_2024],
          },
        ],
      },
    ],
    // Kept by content from software engineer and full-stack loops: the booking widget (AB17), the validated inputs, the
    // retry function and the tree problem (AB18), and the star rating, the Backbone model and the data object class
    // (AB15, AB16). AB16 and AB19 may be one recurring task, but AB16 gives one line, so they are two rows. Left out
    // for want of a subject: a simple React component (AB1), a React component and vanilla JavaScript questions (AB8),
    // the DOM or React round and the app or component design (AB12), designing a UI with best practices (the AB2
    // commenter), the unnamed LeetCode-hard problems (AB9, AB13), the front-end system design question (AB11), an array
    // problem and the HTML, CSS and JavaScript screens (AB6), and round counts (AB3, AB4, AB20). Left out as advice
    // rather than an account: the edit to AB7 naming store-style design questions. Left out by content: the rental
    // watchlist design (AB18), which matches cancellations to watches and notifies users, and the backend half of the
    // booking widget's currency follow-up. The three problems in Taro's company sidebar belong to no account.
    questions: [
      {
        id: 'card-game-ui',
        round: 'Coding: UI or React',
        kind: 'UI build',
        topic: 'Card game UI',
        question:
          'Write a simple card game with its interface, and style it as well as making it work. A 2025 staff frontend candidate had it as one of two coding challenges and found both unrelated to the job; a 2022 front-end engineer had to build the interface of a simple card game.',
        sources: [AIRBNB_AB10_STAFF_FE_2025, AIRBNB_AB1_FE_2022],
        practice: { label: 'React tic-tac-toe', path: '/react/coding/react-tictactoe' },
      },
      {
        id: 'chat-app-design',
        round: 'Frontend system design',
        kind: 'Frontend system design',
        topic: 'Chat app design',
        question:
          'Design a chat app. In the 2025 account it was a mobile chat application, and the interviewer wanted detail on WebSockets and on online and offline flows; a 2022 front-end engineer was asked to explain the architecture of a mock chat app.',
        sources: [AIRBNB_AB10_STAFF_FE_2025, AIRBNB_AB1_FE_2022],
        practice: { label: 'Real-time messaging inbox case', path: '/system-design/messaging-inbox-frontend' },
      },
      {
        id: 'listing-booking-widget',
        round: 'Technical screen',
        kind: 'UI build',
        topic: 'Listing booking widget',
        question:
          'Build a booking widget for one listing: a total price from check-in and check-out dates, adult and child counts that change the price, a booking button greyed out when the room is fully booked, and a confirmation dialog on Book Now. Follow-ups asked how to show prices in several currencies, how to cut the number of requests and how to cache booking details offline, where the interviewer noted that sensitive details need encrypting.',
        sources: [AIRBNB_AB17_FULLSTACK_2025],
        practice: { label: 'Listing booking widget in React', path: '/react/coding/react-listing-booking-widget' },
      },
      {
        id: 'photo-gallery',
        round: 'Coding: UI or React',
        kind: 'UI build',
        topic: 'Photo gallery',
        question: 'Build a photo gallery whose pictures update live, with timeouts; it was one of the two coding challenges in the same loop as the open question.',
        sources: [AIRBNB_AB10_STAFF_FE_2025],
        practice: { label: 'React image slider', path: '/react/coding/react-image-slider' },
      },
      {
        id: 'inputs-with-linked-validators',
        round: 'Coding: UI or React',
        kind: 'UI build',
        topic: 'Form inputs with validators',
        question:
          'Build three inputs with validators: one checks the length of its value, and another fails when two inputs hold the same value, so editing one input has to re-run the validator of the other. The account calls it the onsite frontend question.',
        sources: [AIRBNB_AB18_SWE_2025],
        practice: { label: 'Form validation with required fields', path: '/html/coding/html-forms-validation-required' },
      },
      {
        id: 'star-rating',
        kind: 'UI build',
        topic: 'Star rating',
        question: 'Build a star rating as a UI component; the account names the task and gives neither details nor a round.',
        sources: [AIRBNB_AB15_SENIOR_2024],
        practice: { label: 'React star rating', path: '/react/coding/react-star-rating' },
      },
      {
        id: 'currying-callbacks-prototypes',
        round: 'Coding: JavaScript',
        kind: 'JavaScript',
        topic: 'Currying, callbacks and prototypes',
        question:
          'A JavaScript coding round on currying, callbacks, async code, closures and prototypes, separate from the DOM or React round of the same loop; the candidate ran out of time before finishing.',
        promptNotShared: true,
        sources: [AIRBNB_AB12_FE_2024],
        practice: { label: 'Curry function', path: '/javascript/coding/js-curry-function' },
      },
      {
        id: 'event-loop-and-closures',
        kind: 'JavaScript',
        topic: 'Event loop and closures',
        question: 'Questions on JavaScript fundamentals, with the event loop and closures as the examples the commenter gives.',
        promptNotShared: true,
        sources: [AIRBNB_AB2_COMMENT_2024],
        practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'class-storing-data-object',
        kind: 'JavaScript',
        topic: 'Class storing a data object',
        question: 'Write a JavaScript class that stores a data object; the candidate knew the solution was correct only because the test cases passed.',
        sources: [AIRBNB_AB16_SENIOR_2024],
      },
      {
        id: 'store-data-change-listeners',
        round: 'Technical screen',
        kind: 'JavaScript',
        topic: 'Data store with change listeners',
        question:
          'Implement a StoreData class against usage code the interviewer supplies: add and has methods, and listeners registered with an on method for a key that receive the old value, the new value and the key whenever that value changes.',
        sources: [AIRBNB_AB19_SCREEN_2019],
        practice: { label: 'Event emitter', path: '/javascript/coding/js-event-emitter-mini' },
      },
      {
        id: 'backbone-model',
        kind: 'JavaScript',
        topic: 'Backbone model',
        question: 'A task the account names only as a Backbone model, without its prompt or its round.',
        promptNotShared: true,
        sources: [AIRBNB_AB15_SENIOR_2024],
      },
      {
        id: 'retry-higher-order-function',
        round: 'Algorithms',
        kind: 'JavaScript',
        topic: 'Retry higher-order function',
        question:
          'Write a higher-order function that wraps a function that may throw and retries it in three modes: once, up to n times, and with exponential backoff. The author first called it a frontend question, then filed it as the onsite algorithm question.',
        sources: [AIRBNB_AB18_SWE_2025],
        practice: { label: 'Retry with delay', path: '/javascript/coding/js-retry-with-delay' },
      },
      {
        id: 'sum-tree-node-values',
        round: 'Technical screen',
        kind: 'Algorithm',
        topic: 'Sum tree node values',
        question:
          'In a tree whose leaves hold numbers and whose other nodes equal the sum of their children, return the value of any node; then change the tree, making a node a leaf or giving a leaf a subtree, and return values again.',
        sources: [AIRBNB_AB18_SWE_2025],
      },
    ],
    behaviouralQuestions: [
      {
        id: 'past-project-in-depth',
        question: 'Talk through a past project in depth; in a 2024 frontend loop, a project you led.',
        sources: [AIRBNB_AB12_FE_2024, AIRBNB_AB10_STAFF_FE_2025],
      },
    ],
  },
};
