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
   * was read, so it adds nothing to a question's freshness.
   */
  readonly reportForm?: 'question-bank';
};

/** The kind of a reported question. A locked row shows it beside the round, so it never names the task itself. */
export type ReportedQuestionKind =
  | 'React build'
  | 'React debugging'
  | 'React concepts'
  | 'Angular concepts'
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
const AMAZON_PHONE_2020 = amazonReport(546992, '2020-03');
const AMAZON_SEATTLE_2020 = amazonReport(591141, '2020-04');
const AMAZON_OFFER_2020 = amazonReport(694045, '2020-06');
const AMAZON_PHONE_NO_LP_2020 = amazonReport(678045, '2020-06');
const AMAZON_ONSITE_2021 = amazonReport(1503301, '2021-10');
const AMAZON_VANCOUVER_2022 = amazonReport(1984996, '2022-04');
const AMAZON_SEATTLE_2024 = amazonReport(5934170, '2024-10');
const AMAZON_INTERVIEW_LOOP: InterviewProcessSource = {
  label: 'Amazon interview loop page',
  url: 'https://www.amazon.jobs/content/en/how-we-hire/interview-loop',
  kind: 'official',
  date: '2026-11',
};
const AMAZON_HM_2019 = amazonReport(336727, '2019-07');
const AMAZON_FEE_I_2025 = amazonReport(6968134, '2025-07');
const AMAZON_BLIND_2022 = report(
  'Blind',
  'https://www.teamblind.com/post/amazon-frontend-fee-i-oa-phone-screen-loop-interview-2022-qqdjoknw',
  '2023-01',
);
const AMAZON_ROLE = 'All FEE candidates';

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
const TESLA_TARO = 'https://www.jointaro.com/interviews/companies/tesla/experiences';
const TESLA_T1_FE_2025 = report('Taro', `${TESLA_TARO}/frontend-developer-october-15-2025-no-offer-positive-3c909dee/`, '2025-10');
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
const TESLA_B1_ONSITE_PLAN = report('Blind', 'https://www.teamblind.com/post/tesla-frontend-onsite-bvg7rws6', '2020-06');
const TESLA_B2_TAKE_HOME = report('Blind', 'https://www.teamblind.com/post/Tesla-Frontend-Interview-SbEAx1rM', '2022-04');
const TESLA_B3_CODILITY = report('Blind', 'https://www.teamblind.com/post/Tesla-front-end-software-engineer-interview-PfuGrTKB', '2023-02');
const TESLA_B4_CODILITY = report('Blind', 'https://www.teamblind.com/post/tesla-codility-assessment-for-frontend-software-engineer-pvjhqzke', '2023-01');
const TESLA_B7_INTERN = report('Blind', 'https://www.teamblind.com/post/tesla-frontendmobile-swe-intern-interview-tips-pz6gagjy', '2025-02');
const TESLA_B8_TEAM_MATCH = report('Blind', 'https://www.teamblind.com/post/onsite-experience-8-companies-in-the-past-6-months-0-offers-1niasf5x', '2026-05');
const TESLA_ROLE = 'Frontend roles';

// Google, Meta, Microsoft and Apple: research and sources in docs/references/company-interview-processes-2026-10.md.
const official = (label: string, url: string): InterviewProcessSource => ({ label, url, kind: 'official', date: '2026-10' });
const GOOGLE_HOW_WE_HIRE = official('Google: How we hire', 'https://www.google.com/about/careers/applications/how-we-hire/');
const GOOGLE_GO1 = report('Blind', 'https://www.teamblind.com/post/Google-L5-interview-experience-uyV7evLt', '2022-06');
const GOOGLE_GO2 = report('Blind comment', 'https://www.teamblind.com/post/is-there-a-separate-frontend-interview-process-at-google-e6sbbcao', '2022-07');
const GOOGLE_GO3 = report('Medium', 'https://medium.com/@stylus07/google-software-engineer-interview-experience-d31c16c1e309', '2022-07');
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
const GOOGLE_GO6 = report('Medium', 'https://shubhamjangle.medium.com/google-swe-iii-interview-the-round-by-round-breakdown-nobody-wrote-fd2c10fe52ff', '2026-04');
// The question bank cites this post at its current address; one spelling keeps the task on the rounds that cite it.
const GOOGLE_GO7 = report('LeetCode', 'https://leetcode.com/discuss/post/1274542/', '2021-06');
const GOOGLE_GO8 = report('Blind comment', 'https://www.teamblind.com/post/Google-Frontend-interview-78mvqUW2', '2021-06');
const GOOGLE_PHONE_2020 = report('LeetCode', 'https://leetcode.com/discuss/post/592667/', '2020-04');
// Read in the browser on 2026-11-06: a Sunnyvale front end onsite of five rounds, three of them JavaScript (combining
// callback results, a delayed-run API, a sequential queue), one app design and one algorithm; no phone screen.
const GOOGLE_ONSITE_2019 = report('LeetCode', 'https://leetcode.com/discuss/post/342364/', '2019-07');
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
const GOOGLE_GL_NEW_GRAD_2024 = report('LeetCode', 'https://leetcode.com/discuss/post/6022505/', '2024-10');
const GOOGLE_GL_ML_2025 = report('LeetCode', 'https://leetcode.com/discuss/post/7093123/google-gl-googleyness-round-swe-iii-ml-b-0fe9/', '2025-08');
const GOOGLE_GL_L4_US_2026 = report('LeetCode', 'https://leetcode.com/discuss/post/7571793/', '2026-02');
const GOOGLE_GL_L3_2026 = report('LeetCode', 'https://leetcode.com/discuss/post/8543506/', '2026-09');
const GOOGLE_GL_L4_2024 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/5584385/', '2024-08');
const GOOGLE_GL_L4_BLR_2026 = report('LeetCode', 'https://leetcode.com/discuss/post/8319665/', '2026-06');

const META_HIRING = official('Meta: Hiring process', 'https://www.metacareers.com/hiring-process/');
const META_FEE_INITIAL = official('Meta: FEE initial interview prep', 'https://www.metacareers.com/FEE-prep-initial/');
const META_FEE_ONSITE = official('Meta: FEE full loop prep', 'https://www.metacareers.com/FEE-prep-onsite/');
const META_TARO = 'https://www.jointaro.com/interviews/companies/meta/experiences';
const META_ME1 = report('Taro (approx.)', `${META_TARO}/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/`, '2021-12');
const META_ME2 = report('Taro (approx.)', `${META_TARO}/front-end-engineer-intern-united-states-january-1-2022-accepted-offer-positive-2e0f20e4/`, '2022-01');
const META_ME2B = report('Taro', `${META_TARO}/front-end-engineer-intern-united-states-december-5-2021-accepted-offer-positive-825fe97b/`, '2021-12');
const META_ME3 = report('Medium', 'https://medium.com/@stylus07/meta-interview-experience-cdf53eea63f3', '2022-03');
const META_ME4 = report('Blind', 'https://www.teamblind.com/post/meta-frontend-system-design-yexyrusi', '2022-03');
const META_ME5 = report('Blind', 'https://www.teamblind.com/post/Frontend-interview-experience-CPR8odiD', '2021-10');
const META_ME6 = report('Blind (question list)', 'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob', '2021-10');
const META_ME7 = report('Taro (approx.)', `${META_TARO}/front-end-developer-new-york-ny-november-1-2020-no-offer-positive-b0918a8e/`, '2020-11');
const META_ME8 = report('Blind', 'https://www.teamblind.com/post/meta-front-end-phone-interview-beroc46d', '2023-06');
const META_ME9 = report('Taro', `${META_TARO}/front-end-developer-san-francisco-ca-march-6-2024-no-offer-positive-609eb715/`, '2024-03');
const META_ME10 = report('Taro (approx.)', `${META_TARO}/frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20/`, '2025-04');
const META_ME11 = report('Taro (approx.)', `${META_TARO}/frontend-engineer-menlo-park-ca-june-1-2025-accepted-offer-positive-143f4163/`, '2025-06');
// Read 2026-11-09 for the behavioural decoder: the account names no round, only the question.
const META_ME12 = report('Taro', `${META_TARO}/frontend-engineer-menlo-park-ca-november-25-2024-accepted-offer-positive-f6a8939b/`, '2024-11');
const META_ROLE = 'FEE, IC4 to IC6';

const MICROSOFT_HIRING_TIPS = official('Microsoft: Hiring tips', 'https://careers.microsoft.com/v2/global/en/hiring-tips');
const MICROSOFT_STUDENTS = official('Microsoft: Student interviewing', 'https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing');
const MICROSOFT_TARO = 'https://www.jointaro.com/interviews/companies/microsoft/experiences';
const MICROSOFT_MS1 = report('dev.to', 'https://dev.to/dhilipkmr/software-engineer-2-ui-interview-at-microsoft-1i0b', '2020-10');
const MICROSOFT_MS2 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/1254448/', '2021-06');
const MICROSOFT_MS3 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/489795/', '2020-01');
const MICROSOFT_MS4 = report('Taro (approx.)', `${MICROSOFT_TARO}/front-end-developer-tel-aviv-yafo-october-1-2022-no-offer-negative-7d7887be/`, '2022-10');
const MICROSOFT_MS5 = report('Taro', `${MICROSOFT_TARO}/senior-frontend-engineer-new-york-ny-january-27-2022-no-offer-negative-54d03a33/`, '2022-01');
const MICROSOFT_MS6 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/5335067/', '2024-06');
const MICROSOFT_MS7 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5456468/', '2024-07');
const MICROSOFT_MS8 = report('Taro (approx.)', `${MICROSOFT_TARO}/frontend-developer-belgrade-central-serbia-may-1-2024-no-offer-negative-380c5ce5/`, '2024-05');
const MICROSOFT_MS9 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/7347058/', '2025-11');
const MICROSOFT_ROLE = 'Frontend roles; varies by team';

const APPLE_TARO = 'https://www.jointaro.com/interviews/companies/apple/experiences';
const APPLE_AP1 = report('LeetCode', 'https://leetcode.com/discuss/post/6979238/', '2025-06');
const APPLE_AP2 = report('Medium', 'https://srijansinghgulati.medium.com/my-apple-interview-experience-and-why-i-declined-the-offer-5ff442962bd8', '2022-07');
const APPLE_AP3 = report('Taro (approx.)', `${APPLE_TARO}/front-end-developer-cupertino-ca-july-1-2022-no-offer-negative-9299c7ea/`, '2022-07');
const APPLE_AP4 = report('Blind', 'https://www.teamblind.com/post/Apple-frontend-interview-advice-d64Fd3BM', '2022-02');
const APPLE_AP5 = report('Taro', `${APPLE_TARO}/front-end-developer-united-states-august-25-2022-no-offer-positive-ceece13a/`, '2022-08');
const APPLE_AP6 = report('Taro (approx.)', `${APPLE_TARO}/frontend-engineer-san-francisco-ca-october-1-2023-accepted-offer-positive-e5223424/`, '2023-10');
const APPLE_AP7 = report('Taro (approx.)', `${APPLE_TARO}/frontend-developer-united-states-february-1-2025-no-offer-neutral-01c585c0/`, '2025-02');
const APPLE_AP8 = report('Blind', 'https://www.teamblind.com/post/my-apple-interview-was-absolutely-brutal-tjrprfjx', '2025-03');
const APPLE_AP9 = report('Taro (approx.)', `${APPLE_TARO}/front-end-engineer-united-states-august-1-2021-no-offer-negative-2d79a1e7/`, '2021-08');
const APPLE_ICT3_2025 = report('LeetCode', 'https://leetcode.com/discuss/post/6579616/', '2025-03');
const APPLE_FULLSTACK_2026 = report('LeetCode', 'https://leetcode.com/discuss/post/8354843/', '2026-06');
// Read 2026-11-09 for the team conversation decoder: the hiring manager's topics and a director round on culture fit.
const APPLE_AP10 = report('Taro (approx.)', `${APPLE_TARO}/senior-frontend-developer-hyderabad-july-1-2024-no-offer-neutral-ac6e61a6/`, '2024-07');
const APPLE_ROLE = 'Frontend roles; varies by team';

// Uber, Stripe, ByteDance/TikTok and Booking.com.
const UBER_GUIDE = official('Uber: Frontend engineering interview guide', 'https://jobs.uber.com/en/uber-interview-guide/frontend-engineering-interview-guide/');
const UBER_STORY = official(
  'Uber: Landing the job as a front end engineer',
  'https://jobs.uber.com/en/people-stories/interview-prep/landing-the-job-at-uber-front-end-engineer/',
);
const UBER_UB1 = report('LeetCode', 'https://leetcode.com/discuss/post/2409192/', '2022-08');
const UBER_UB_CODESIGNAL_2021 = report('LeetCode', 'https://leetcode.com/discuss/post/1064199/', '2021-02');
const UBER_UB_ROUNDS_2025 = report('LeetCode', 'https://leetcode.com/discuss/post/6840169/', '2025-06');
const UBER_UB2 = report('Medium', 'https://medium.com/@iamjaasi/uber-sde-2-frontend-interview-experience-40c1a7437cc0', '2022-11');
const UBER_UB3 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/uber/experiences/frontend-engineer-ii-bengaluru-april-1-2022-no-offer-positive-f0d40cc2/',
  '2022-04',
);
const UBER_UB4 = report('LeetCode', 'https://leetcode.com/discuss/post/6820731/', '2025-06');
const UBER_UB5 = report('LeetCode', 'https://leetcode.com/discuss/post/7322609/', '2025-11');
const UBER_UB6 = report('LeetCode', 'https://leetcode.com/discuss/post/7822801/', '2026-04');
const UBER_UB8 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/uber/experiences/frontend-developer-brazil-november-5-2025-no-offer-negative-0b9b9ae1/',
  '2025-10',
);
const UBER_ROLE = 'Frontend engineers, L3 to L5A';

const STRIPE_CAREERS = official('Stripe: Careers FAQ', 'https://stripe.com/careers');
const STRIPE_TARO = 'https://www.jointaro.com/interviews/companies/stripe/experiences';
const STRIPE_ST1 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-engineer-barcelona-october-1-2023-no-offer-neutral-ceb407e7/`, '2023-10');
const STRIPE_ST3 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-engineer-san-francisco-ca-august-1-2025-no-offer-neutral-8ad7d78f/`, '2025-08');
const STRIPE_ST4 = report('Taro', `${STRIPE_TARO}/front-end-developer-india-november-15-2022-no-offer-positive-f4ea85cd/`, '2022-11');
const STRIPE_ST5 = report('Taro (approx.)', `${STRIPE_TARO}/frontend-developer-barcelona-march-1-2025-no-offer-positive-c1c921ed/`, '2025-03');
const STRIPE_ST6_PLAN = report('Blind (recruiter plan)', 'https://www.teamblind.com/post/Stripe-frontend-onsite-SfaGgc1a', '2024-11');
const STRIPE_ST7 = report('Blind', 'https://www.teamblind.com/post/stripe-frontend-interview-be7f1ymm', '2024-07');
const STRIPE_ST8 = report('Taro', `${STRIPE_TARO}/frontend-developer-canada-september-19-2025-no-offer-positive-caea53c0/`, '2025-09');
const STRIPE_ST9 = report('LeetCode Discuss', 'https://leetcode.com/discuss/post/5883632/', '2024-10');
const STRIPE_ROLE = 'Frontend engineers';

const BYTEDANCE_CAMPUS = official('ByteDance: Early careers interview tips', 'https://jobs.bytedance.com/en/campus/interview-tips');
const BYTEDANCE_TIKTOK_CAMPUS = official('TikTok: Early careers interview tips', 'https://careers.tiktok.com/m/campus/interview-tips');
const BYTEDANCE_BD1 = report('Blind', 'https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l', '2023-01');
const BYTEDANCE_BD2 = report(
  'Blind',
  'https://www.teamblind.com/post/my-tiktok-front-end-interview-experience-any-idea-what-end-result-might-look-like-jfcdhq5r',
  '2024-09',
);
const BYTEDANCE_BD4 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/979478/', '2020-12');
const BYTEDANCE_BD5 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/4881233/', '2024-03');
const BYTEDANCE_BD6 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/6450891/', '2025-02');
const BYTEDANCE_BD7 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/6437333/', '2025-02');
const BYTEDANCE_BD8 = report('Blind', 'https://www.teamblind.com/post/tiktok-behavioral-with-hiring-manager-round-utpnj2vx', '2023-12');
const BYTEDANCE_BD9 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/2270634/', '2022-06');
const BYTEDANCE_TARO = 'https://www.jointaro.com/interviews/companies/tiktok/experiences';
const BYTEDANCE_TT1 = report('Taro', `${BYTEDANCE_TARO}/frontend-engineer-united-states-october-27-2025-no-offer-neutral-22728914/`, '2025-10');
const BYTEDANCE_TT2 = report('Taro', `${BYTEDANCE_TARO}/front-end-developer-united-states-march-4-2025-no-offer-positive-8082b9a5/`, '2025-03');
const BYTEDANCE_TT3 = report('Taro (approx.)', `${BYTEDANCE_TARO}/frontend-engineer-united-states-june-1-2024-declined-offer-neutral-363898ae/`, '2024-06');
const BYTEDANCE_TT4 = report('Taro', `${BYTEDANCE_TARO}/front-end-engineer-united-states-july-8-2024-no-offer-neutral-d83a6ff3/`, '2024-07');
const BYTEDANCE_TT5 = report('Taro (approx.)', `${BYTEDANCE_TARO}/front-end-developer-san-jose-ca-march-1-2024-no-offer-neutral-fc19c254/`, '2024-03');
const BYTEDANCE_TT6 = report('Taro', `${BYTEDANCE_TARO}/front-end-developer-october-22-2025-accepted-offer-positive-59a98129/`, '2025-10');
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

// Datadog, Intuit and ServiceNow.
const DATADOG_CANDIDATE_EXPERIENCE = official('Datadog: Candidate experience', 'https://careers.datadoghq.com/candidate-experience/');
const DATADOG_TARO = 'https://www.jointaro.com/interviews/companies/datadog/experiences';
const DATADOG_DD1 = report('Taro (approx.)', `${DATADOG_TARO}/senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048/`, '2024-10');
const DATADOG_DD2 = report('Taro (approx.)', `${DATADOG_TARO}/senior-frontend-engineer-paris-september-1-2025-accepted-offer-positive-2a1ddfe8/`, '2025-09');
const DATADOG_DD3 = report('Taro (approx.)', `${DATADOG_TARO}/senior-software-engineer-frontend-france-july-1-2023-accepted-offer-positive-b4edf2ad/`, '2023-07');
const DATADOG_DD4 = report('Taro (approx.)', `${DATADOG_TARO}/senior-software-engineer-frontend-france-october-1-2024-accepted-offer-positive-3bd8f875/`, '2024-10');
const DATADOG_DD5 = report('Taro (approx.)', `${DATADOG_TARO}/software-engineer-front-end-paris-september-1-2024-accepted-offer-positive-ba0b1dd8/`, '2024-09');
const DATADOG_DD6 = report('Taro (approx.)', `${DATADOG_TARO}/frontend-engineer-madrid-february-1-2024-accepted-offer-positive-a8de35e5/`, '2024-02');
const DATADOG_DD7 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/7080135', '2025-05');
const DATADOG_DD8 = report('Taro (approx.)', `${DATADOG_TARO}/senior-frontend-engineer-madrid-community-of-madrid-july-1-2025-no-offer-positive-f1c8b321/`, '2025-07');
const DATADOG_DD9 = report('Taro', `${DATADOG_TARO}/senior-frontend-developer-lisbon-lisbon-district-november-23-2025-no-offer-positive-1a88bdda/`, '2025-11');
const DATADOG_DD10 = report('Taro', `${DATADOG_TARO}/front-end-software-engineer-brazil-january-25-2024-accepted-offer-positive-c193fd19/`, '2024-01');
const DATADOG_ROLE = 'Frontend engineers';

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

const SERVICENOW_SN1 = report(
  'Medium',
  'https://medium.com/@karunakumari000532/my-servicenow-software-engineer-ui-interview-experience-2025-23f315b960dc',
  '2025-09',
);
const SERVICENOW_SN2 = report('LeetCode', 'https://leetcode.com/discuss/post/6508672/', '2025-03');
const SERVICENOW_SN3 = report('LeetCode', 'https://leetcode.com/discuss/post/4096867/', '2023-09');
const SERVICENOW_SN4 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/servicenow/experiences/senior-software-engineer-frontend-hyderabad-march-1-2022-no-offer-positive-83f4f1a9/',
  '2022-03',
);
const SERVICENOW_SN5 = report(
  'Taro',
  'https://www.jointaro.com/interviews/companies/servicenow/experiences/frontend-engineer-hyderabad-february-1-2024-no-offer-positive-1799e9aa/',
  '2024-02',
);
const SERVICENOW_ROLE = 'UI and frontend, IC2 to senior';

// Revolut, Spotify and Zalando.
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
const REVOLUT_RV15_PLAN = report(
  'Blind (plan)',
  'https://www.teamblind.com/post/what-to-expect-in-revolut-frontend-engineer-interview-screening-technical-team-bar-raiser-qpgmtoum',
  '2026-03',
);
const REVOLUT_RV12 = report('Taro (approx.)', `${REVOLUT_TARO}/senior-frontend-software-engineer-porto-oporto-may-1-2024-no-offer-neutral-90611f7c/`, '2024-05');
const REVOLUT_ROLE = 'Frontend engineers in European hubs';

const SPOTIFY_JOURNEY = official('Spotify: Start your journey', 'https://www.lifeatspotify.com/start-your-journey');
const SPOTIFY_TARO = 'https://www.jointaro.com/interviews/companies/spotify/experiences';
const SPOTIFY_SP1 = report('Blind', 'https://www.teamblind.com/post/spotify-final-round-web-interview-qyug2zqx', '2022-04');
const SPOTIFY_SP1_DESIGN = report('Blind', 'https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg', '2022-04');
const SPOTIFY_SP2 = report('Blind', 'https://www.teamblind.com/post/spotify-senior-web-engineer-interview-k27u5vu7', '2022-04');
const SPOTIFY_SP3 = report('Blind', 'https://www.teamblind.com/post/Spotify-Web-Engineer-Interview-hNTex8N7', '2021-10');
const SPOTIFY_SP4 = report('Taro', `${SPOTIFY_TARO}/senior-web-engineer-united-states-august-30-2022-no-offer-neutral-e746c706/`, '2022-08');
const SPOTIFY_SP5 = report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-toronto-on-april-1-2022-no-offer-positive-a2f8744e/`, '2022-04');
const SPOTIFY_SP6 = report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-new-york-ny-april-1-2023-no-offer-negative-5bce68df/`, '2023-04');
const SPOTIFY_SP7 = report('Taro (approx.)', `${SPOTIFY_TARO}/senior-web-engineer-united-states-september-1-2023-no-offer-negative-890b3570/`, '2023-09');
const SPOTIFY_SP8 = report('Taro (approx.)', `${SPOTIFY_TARO}/web-engineer-united-states-may-1-2022-no-offer-neutral-70fb53e8/`, '2022-05');
const SPOTIFY_SP9 = report('Taro (approx.)', `${SPOTIFY_TARO}/software-engineer-new-york-ny-february-1-2025-no-offer-positive-0dc5e197/`, '2025-02');
const SPOTIFY_ROLE = 'Web engineers';

const ZALANDO_HOW_WE_HIRE = official('Zalando: How we hire', 'https://jobs.zalando.com/en/how-we-hire');
const ZALANDO_BLOG = official('Zalando: Technical interviews for software engineers', 'https://jobs.zalando.com/en/blog/technical-interview-for-software-engineers');
const ZALANDO_ZA1 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5501338/', '2024-07');
const ZALANDO_ZA2 = report('LeetCode', 'https://leetcode.com/discuss/post/1076335/', '2020-12');
const ZALANDO_ZA3 = report('LeetCode', 'https://leetcode.com/discuss/post/1249280/', '2021-07');
const ZALANDO_ZA4 = report('Blind', 'https://www.teamblind.com/post/zalando-frontend-interviews-asih8pba', '2022-02');
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
// Public reports, all read in full. Dates are the interview month where the account gives one.
const SHOPEE_S1_HCMC_2025 = report(
  'Viblo',
  'https://viblo.asia/p/luyen-tap-that-bai-va-thanh-cong-hanh-trinh-cua-anh-dat-hoc-vien-engineer-pro-vao-shopee-EbNVQnP04vR',
  '2025-02',
); // SH1
const SHOPEE_S3_JUEJIN_2020 = report('Juejin', 'https://juejin.cn/post/6880722165982429197', '2020-03'); // SH3
const SHOPEE_S4_NOWCODER_2022 = report('Nowcoder', 'https://www.nowcoder.com/discuss/353159545788768256', '2022-04'); // SH4
const SHOPEE_S6_SG_CAMPUS_2020 = report('Nowcoder', 'https://www.nowcoder.com/discuss/495162', '2020-09'); // SH6
const SHOPEE_S7_CAMPUS_2020 = report('Nowcoder', 'https://www.nowcoder.com/discuss/463919', '2020-07'); // SH7
const SHOPEE_S8_CAMPUS_2020 = report('Nowcoder', 'https://www.nowcoder.com/discuss/353156107927494656', '2020-03'); // SH8
const SHOPEE_S9_CAMPUS_2021 = report('Nowcoder', 'https://www.nowcoder.com/discuss/353157728422010880', '2021-03'); // SH9
const SHOPEE_S10_CAMPUS_2019 = report('Nowcoder', 'https://www.nowcoder.com/discuss/247729', '2019-09'); // SH10
const SHOPEE_S36_MEDIUM_2020 = report('Medium', 'https://medium.com/@g4691821/2020-new-grad-面試心得-3-shopee-eaabf411c35b', '2020-04'); // SH36
const SHOPEE_S37_MEDIUM_2022 = report(
  'Medium',
  'https://medium.com/@julianachang/2022-新鮮人軟體工程師面試心得-yahoo-foodpanda-shopee-dell-d576d6c004b6',
  '2022-01',
); // SH37
const SHOPEE_S39_PTT_2021 = report('PTT', 'https://www.ptt.cc/bbs/Soft_Job/M.1613320989.A.BD5.html', '2021-02'); // SH39
// SH41, a 2020 Shenzhen backend campus timeline hosted on GitHub (a Nowcoder test on 28 March, rounds on 3 and
// 10 April, HR on 15 April), is not cited because the spec bans github.com as a source host.
const SHOPEE_FE_ROLE = 'Front-end engineers';

// OpenAI's interview guide answers 403 to automated clients; its sentences were read on the Wayback Machine copy
// of 2026-10-09. Blind posts written before the interview are cited only for the plan the recruiter gave.
const OPENAI_INTERVIEW_GUIDE = official('OpenAI interview guide', 'https://openai.com/interview-guide/');
const OPENAI_TARO = 'https://www.jointaro.com/interviews/companies/openai/experiences';
const OPENAI_OA1_SENIOR_FE_2024 = report(
  'Taro',
  `${OPENAI_TARO}/senior-frontend-software-engineer-united-states-may-30-2024-no-offer-negative-32a807aa/`,
  '2024-05',
);
const OPENAI_OA2_FE_2024 = report('Blind', 'https://www.teamblind.com/post/preparing-for-openai-frontend-engineer-interview-hb1zxdy6', '2024-11');
const OPENAI_OA3_COMMENT_2023 = report('Blind comment', 'https://www.teamblind.com/post/openai-front-end-interview-aqcvdppv', '2023-08');
const OPENAI_OA4_SWE_2023 = report('Blind', 'https://www.teamblind.com/post/openai-full-stack-swe-interview-experience-4zgmdu7u', '2023-02');
const OPENAI_OA5_PLAN_2025 = report('Blind (recruiter plan)', 'https://www.teamblind.com/post/open-ai-frontend-interview-dxwheejy', '2025-04');
const OPENAI_OA6_PLAN_2026 = report('Blind (recruiter plan)', 'https://www.teamblind.com/post/openai-agentic-code-interview-up8jhuiq', '2026-10');
const OPENAI_OA7_FE_2024 = report(
  'Taro (approx.)',
  `${OPENAI_TARO}/front-end-developer-san-francisco-ca-december-1-2024-no-offer-neutral-550d792a/`,
  '2024-12',
);
const OPENAI_ROLE = 'Frontend candidates';

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
const NETFLIX_NF3_SCREEN_2025 = report('LeetCode', 'https://leetcode.com/discuss/post/7421643/', '2025-12');
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

// CrowdStrike: research in docs/references/crowdstrike-questions-and-process-2026-10.md. Frontend accounts are
// reviews re-hosted on Taro (placeholder dates are labelled approx.) plus one Blind post; Blind commenters support
// the record only.
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
const CROWDSTRIKE_CS20_SENIOR_FE_2024 = report('Blind', 'https://www.teamblind.com/post/crowdstrike-frontend-interview-jmjmpz0w', '2024-07');
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

// Airbnb's careers FAQ gives only the general shape, so the stages come from public accounts. Taro reports are
// Glassdoor re-hosts and those dated the 1st of a month carry placeholder dates. Some accounts carry a general
// software engineer title but describe a frontend loop.
const AIRBNB_TARO = 'https://www.jointaro.com/interviews/companies/airbnb/experiences';
const AIRBNB_AB1_FE_2022 = report(
  'Taro (approx.)',
  `${AIRBNB_TARO}/front-end-engineer-san-francisco-ca-june-1-2022-declined-offer-negative-afab47f0/`,
  '2022-06',
);
const AIRBNB_AB2_POSTER_2024 = report('Blind', 'https://www.teamblind.com/post/airbnb-frontend-interview-fyzmjrb5', '2024-02');
const AIRBNB_AB2_COMMENT_2024 = report('Blind comment', 'https://www.teamblind.com/post/airbnb-frontend-interview-fyzmjrb5', '2024-05');
const AIRBNB_AB3_COMMENT_2022 = report('Blind comment', 'https://www.teamblind.com/post/Airbnb-front-end-interview-L5-gkNsa6jg', '2022-02');
const AIRBNB_AB4_COMMENT_2022 = report('Blind comment', 'https://www.teamblind.com/post/Airbnb-Frontend-Engineer-Interview-H7oqkCqu', '2022-04');
const AIRBNB_AB6_FE_2021 = report(
  'Blind',
  'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob',
  '2021-10',
);
const AIRBNB_AB7_SCREEN_2025 = report('LeetCode', 'https://leetcode.com/discuss/post/7110255/', '2025-08');
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
const AIRBNB_AB12_FE_2024 = report('Blind', 'https://www.teamblind.com/post/just-bombed-my-airbnb-coding-interviews-a3idwxsm', '2024-10');
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
const AIRBNB_AB17_FULLSTACK_2025 = report(
  'PracHub (curated)',
  'https://prachub.com/interview-experiences/airbnb-software-engineer-interview-experience-full-stack-phone-screen-lands-an-onsite-invite',
  '2025-08',
);

export const COMPANY_INTERVIEW_PROCESSES: Readonly<Record<string, CompanyInterviewProcess>> = {
  amazon: {
    title: 'Amazon Front End Engineer interview process',
    summary:
      'Amazon\'s Front End Engineer preparation page describes three stages: an online assessment, a 60-minute phone screen and a loop of four 55-minute interviews. Public accounts from 2020 to 2024 describe loops of four or five interviews, and accounts from 2019 and 2025 add the Leadership Principles questions.',
    caveat:
      'Each account describes one loop. Some added a bar raiser or a hiring-manager round, one 2020 phone screen had no behavioural questions, and one 2024 loop asked backend rather than frontend design. Confirm the format with your recruiter.',
    checkedAt: '2026-11-06',
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
              'Each interviewer typically asks two or three behavioural questions. Accounts also describe a bar raiser interview and a round with the hiring manager, which is often all behavioural.',
            appliesTo: AMAZON_ROLE,
            sources: [AMAZON_FEE_PREP, AMAZON_INTERVIEW_LOOP, AMAZON_HM_2019, AMAZON_OFFER_2020, AMAZON_ONSITE_2021, AMAZON_VANCOUVER_2022, AMAZON_BLIND_2022, AMAZON_FEE_I_2025],
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
            format: 'One interview with an Amazonian, about 45 to 60 minutes.',
            appliesTo: 'Full-time new graduates',
            sources: [AMAZON_STUDENT_PREP],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'New graduate final stage',
            format: 'Three to four interviews of 45 to 60 minutes each, coded in LiveCode.',
            appliesTo: 'Full-time new graduates',
            sources: [AMAZON_STUDENT_PREP],
            practice: { label: 'Implement the new operator', path: '/javascript/coding/js-implement-new' },
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
            practice: { label: 'The one-hour screen, rehearsed', path: '/react/trivia/react-phone-screen-search-bar-rehearsal' },
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
            practice: { label: 'React interview preparation path', path: '/guides/interview-blueprint/react-prep-path' },
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
        question:
          'Check whether a string of brackets is balanced, with every opening bracket closed in the right order (LeetCode Valid Parentheses).',
        sources: [WALMART_W11_SDE3_UI, WALMART_W10_SDE3_UI, WALMART_W3_FE_INDIA],
        practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'closures',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        question: 'Explain closures; one account went on to self-invoking functions.',
        sources: [WALMART_W10_SDE3_UI, WALMART_W55_FE, WALMART_W16_ENGINEER3],
        practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
      },
      {
        id: 'let-var-const',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        question: 'Explain how let, var and const differ; one account added the kinds of functions JavaScript has.',
        sources: [WALMART_W10_SDE3_UI, WALMART_W3_FE_INDIA],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'why-react',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        question: 'Why use React rather than other libraries or frameworks, such as Angular?',
        sources: [WALMART_W11_SDE3_UI, WALMART_W15_SDE2],
      },
      {
        id: 'virtual-dom',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        question: 'What is the virtual DOM, and how does it differ from the DOM?',
        sources: [WALMART_W11_SDE3_UI, WALMART_W9_FE],
      },
      {
        id: 'first-missing-positive',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Find the smallest positive integer missing from an unsorted array (LeetCode First Missing Positive).',
        sources: [WALMART_W11_SDE3_UI],
      },
      {
        id: 'two-sum',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Find the two numbers in an array that add up to a target (LeetCode Two Sum), given as a bonus after the first two problems.',
        sources: [WALMART_W11_SDE3_UI],
      },
      {
        id: 'rotated-array-search-variation',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'A variation of searching a rotated sorted array, where the interviewer cared more about the approach than about complete code.',
        sources: [WALMART_W10_SDE3_UI],
      },
      {
        id: 'rotated-array-search',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Search for a value in a rotated sorted array.',
        sources: [WALMART_W17_SDE3],
      },
      {
        id: 'sort-a-stack',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'A stack problem close to sorting a stack, optimised with small hints from the interviewer.',
        sources: [WALMART_W10_SDE3_UI],
      },
      {
        id: 'dp-and-sliding-window',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Problems on dynamic programming and sliding windows.',
        promptNotShared: true,
        sources: [WALMART_W35_SDE3],
      },
      {
        id: 'predict-the-winner',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Two players take numbers from either end of an array in turn: can the first player win? (LeetCode Predict the Winner)',
        sources: [WALMART_W8_SDE3],
      },
      {
        id: 'meeting-rooms-variant',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'A problem close to Meeting Rooms II, the fewest rooms a set of meetings needs, discussed but not coded for lack of time.',
        sources: [WALMART_W8_SDE3],
      },
      {
        id: 'combination-sum-no-duplicates',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'A Combination Sum variant: find the combinations that add up to a target without counting duplicate elements.',
        sources: [WALMART_W17_SDE3],
      },
      {
        id: 'all-subsets',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Print every possible subset of an array.',
        sources: [WALMART_W17_SDE3],
      },
      {
        id: 'next-greater-element',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'For each number of one array, find the next greater number in a second array (LeetCode Next Greater Element I).',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'add-one-to-number',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Add one to a number given as an array of its digits.',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'median-of-data-stream',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Keep the median of a stream of numbers as they arrive (LeetCode Find Median from Data Stream).',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'minimum-taps',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Find the fewest taps to open so that a whole garden is watered (LeetCode Minimum Number of Taps to Open to Water a Garden).',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'zigzag-diagonal-traversal',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Traverse a matrix along its diagonals in zigzag order.',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'number-of-islands',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Count the islands in a grid of land and water (LeetCode Number of Islands).',
        sources: [WALMART_W55_FE, WALMART_W16_ENGINEER3],
      },
      {
        id: 'max-profit-day-modified',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'A modified version of finding the most profitable day to sell, written on paper in a timed round.',
        sources: [WALMART_W16_ENGINEER3],
      },
      {
        id: 'noble-integer',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'Find a noble integer: a value in an array equal to the number of elements greater than it.',
        sources: [WALMART_W16_ENGINEER3],
      },
      {
        id: 'dam-walls',
        round: 'DSA round',
        kind: 'Algorithm',
        question: 'A real-world problem: place walls against water overflowing from a dam so that as much water as possible is saved, solvable with dynamic programming.',
        sources: [WALMART_W16_ENGINEER3],
      },
      {
        id: 'optimise-heavy-recursion',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        question: 'How would you optimise a heavy recursive operation in JavaScript? The candidate answered with currying.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
      },
      {
        id: 'usecontext-rerenders',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        question:
          'How do you keep components that use useContext from re-rendering needlessly, and how does Context remove prop drilling? The same round covered useMemo, useReducer and React design patterns.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Why Context causes performance issues', path: '/react/trivia/react-context-performance-issues' },
      },
      {
        id: 'ssr-above-the-fold',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Frontend system design',
        question:
          'The part of a page above the fold is rendered on the server and a React component below it on the client: how do hydration and the parsing of HTML and JavaScript play out?',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'React SSR and hydration', path: '/react/trivia/react-ssr-hydration' },
      },
      {
        id: 'dropdown-component-api',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React build',
        question: 'Write the high-level API of a dropdown component that works as a single-select or a multi-select and accepts custom child components.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Select with compound components', path: '/react/coding/react-select-compound-api' },
      },
      {
        id: 'flexbox-positioning-stacking',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        question: 'CSS questions on flexbox layout, relative and absolute positioning, and how z-index and stacking contexts behave with absolute positioning.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'How z-index works', path: '/css/trivia/css-z-index' },
      },
      {
        id: 'module-federation-performance',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        question: 'Performance techniques in the browser and in React, and the advanced concepts of module federation.',
        sources: [WALMART_W10_SDE3_UI],
        practice: { label: 'Code splitting and module federation', path: '/react/trivia/react-code-splitting-module-federation' },
      },
      {
        id: 'implement-usememo',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React build',
        question: 'Explain what useMemo is for, then implement it yourself.',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Implement useMemo and a Context data provider', path: '/react/coding/react-implement-usememo-context' },
      },
      {
        id: 'implement-context-api',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React build',
        question: 'Implement the Context API yourself, then extend it to hold the results of an API call.',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Implement useMemo and a Context data provider', path: '/react/coding/react-implement-usememo-context' },
      },
      {
        id: 'responsive-vs-adaptive',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        question: 'What is the difference between responsive and adaptive design, and which would you choose?',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Making an element responsive', path: '/css/trivia/css-make-element-responsive' },
      },
      {
        id: 'two-pointer-problem',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Algorithm',
        question: 'An easy-to-medium two-pointer problem, in a 60-minute online round that also covered frontend concepts.',
        promptNotShared: true,
        sources: [WALMART_W9_FE],
      },
      {
        id: 'output-prediction-scope',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        question: 'Predict what given code prints, with questions on JavaScript basics and scope.',
        sources: [WALMART_W9_FE],
        practice: { label: 'Predict var hoisting and function shadowing', path: '/javascript/trivia/js-var-hoisting-shadowing-output' },
      },
      {
        id: 'hooks-useeffect',
        round: 'JavaScript, React and web fundamentals',
        kind: 'React concepts',
        question: 'Questions on React hooks, most of them about useEffect.',
        sources: [WALMART_W9_FE],
        practice: { label: 'What useEffect is for', path: '/react/trivia/react-useeffect-purpose' },
      },
      {
        id: 'block-inline-flexbox',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        question: 'How block and inline elements differ, and how flexbox lays out its children.',
        sources: [WALMART_W9_FE],
        practice: { label: 'Block and inline elements', path: '/html/trivia/html-block-inline-elements' },
      },
      {
        id: 'class-vs-id',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Web fundamentals',
        question: 'CSS questions such as when to use a class and when an id, in a UI round set for a full-stack candidate.',
        sources: [WALMART_W16_ENGINEER3],
        practice: { label: 'id and class attributes', path: '/html/trivia/html-id-vs-class' },
      },
      {
        id: 'sum-both-call-styles',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        question: 'Write one sum function that works both as sum(a, b, c) and as sum(a)(b)(c).',
        sources: [WALMART_W37_SDE3_CHENNAI],
        practice: { label: 'Curry function', path: '/javascript/coding/js-curry-function' },
      },
      {
        id: 'chunk-array',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        question: 'Split an array into chunks of a given size.',
        sources: [WALMART_W37_SDE3_CHENNAI],
      },
      {
        id: 'snippets-closures-currying-hoisting',
        round: 'JavaScript, React and web fundamentals',
        kind: 'JavaScript',
        question: 'Code snippets on closures, currying and hoisting, and when to use call, bind and apply.',
        sources: [WALMART_W37_SDE3_CHENNAI],
        practice: { label: 'call, apply and bind', path: '/javascript/trivia/js-call-apply-bind' },
      },
      {
        id: 'angular-lifecycle-services',
        round: 'JavaScript, React and web fundamentals',
        kind: 'Angular concepts',
        question: 'Angular questions on the component lifecycle, services and how components talk to each other.',
        sources: [WALMART_W37_SDE3_CHENNAI],
        practice: { label: 'Angular lifecycle hooks', path: '/angular/trivia/angular-lifecycle-hooks' },
      },
      {
        id: 'async-await-single-thread',
        round: 'DSA round',
        kind: 'JavaScript',
        question: 'Write an async and await snippet and a Promise snippet and explain how each runs, then how JavaScript runs on a single thread.',
        sources: [WALMART_W17_SDE3],
        practice: { label: 'JavaScript event loop', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'measure-react-performance',
        round: 'Hiring manager',
        kind: 'React concepts',
        question: 'How do you measure the performance of a React application?',
        sources: [WALMART_W11_SDE3_UI],
        practice: { label: 'Performance profiling in browser DevTools', path: '/javascript/trivia/js-performance-profiling-workflow' },
      },
      {
        id: 'redux-hooks-shadow-dom',
        round: 'Technical rounds',
        kind: 'React concepts',
        question: 'Questions on Redux, React hooks and the Shadow DOM.',
        sources: [WALMART_W2_SDE2_BENGALURU],
        practice: { label: 'Redux vs Context vs useState', path: '/react/trivia/react-state-management-redux' },
      },
      {
        id: 'circular-linked-list-delete',
        round: 'Technical rounds',
        kind: 'Algorithm',
        question: 'Find a key in a circular linked list and delete it, leaving the list unchanged when the key is not there.',
        sources: [WALMART_W15_SDE2],
      },
      {
        id: 'implement-queue',
        round: 'Technical rounds',
        kind: 'Algorithm',
        question: 'Implement a queue of integers on a singly linked list or an array, with its enqueue and dequeue operations.',
        sources: [WALMART_W15_SDE2],
        practice: { label: 'Implement a stack and a queue', path: '/javascript/coding/js-stack-queue-implementation' },
      },
      {
        id: 'react-event-box-model',
        round: 'Technical rounds',
        kind: 'Web fundamentals',
        question: 'What is an event in React, what makes up the CSS box model, what does the universal selector do, and how do HTML elements differ from tags?',
        sources: [WALMART_W15_SDE2],
        practice: { label: 'The CSS box model', path: '/css/trivia/css-box-model' },
      },
      {
        id: 'angular-feature-until-tests-pass',
        round: 'Online assessment (2026 accounts)',
        kind: 'Practical coding',
        question: 'Add a feature to an existing Angular project until its test cases pass.',
        promptNotShared: true,
        sources: [WALMART_W56_FULLSTACK_2026],
      },
      {
        id: 'react-event-listener-challenges',
        round: 'Coding screen',
        kind: 'React build',
        question: 'React code challenges built around event listeners: not difficult, but slow to finish in the time.',
        promptNotShared: true,
        sources: [WALMART_W6_SENIOR],
      },
      {
        id: 'binary-search-tree',
        round: 'Coding screen',
        kind: 'Algorithm',
        question: 'A binary search tree problem, set as the code test of a staff frontend loop.',
        promptNotShared: true,
        sources: [WALMART_W1_STAFF_FE],
      },
      {
        id: 'stack-and-counting',
        round: 'Coding screen',
        kind: 'Algorithm',
        question: 'A problem solved with a stack and a count, in a CodePair interview for a team that works mostly in React Native.',
        promptNotShared: true,
        sources: [WALMART_W26_CODEPAIR],
      },
      {
        id: 'es6-output-snippets',
        round: 'Coding screen',
        kind: 'JavaScript',
        question: 'Say what basic ES6 code snippets print, on closures, hoisting and object methods, in a 30-minute exploratory call.',
        sources: [WALMART_W12_REACT_NATIVE],
        practice: { label: 'this in detached methods', path: '/javascript/trivia/js-this-keyword' },
      },
      {
        id: 'html-css-component-then-list',
        round: 'Coding rounds',
        kind: 'UI build',
        question: 'Write the HTML and CSS of a simple UI component in VS Code, then a horizontal list component with simple styles in a React Native playground.',
        sources: [WALMART_W12_REACT_NATIVE],
      },
      {
        id: 'js-engine-react-optimisation',
        round: 'Coding rounds',
        kind: 'JavaScript',
        question:
          'How the JavaScript engine runs synchronous and asynchronous functions, and the React optimisation techniques: memoisation, code splitting, lazy loading, error boundaries, debouncing and throttling.',
        sources: [WALMART_W12_REACT_NATIVE],
        practice: { label: 'Debounce vs throttle for a search input', path: '/javascript/trivia/debounce-vs-throttle-search-input' },
      },
      {
        id: 'hooks-and-their-use',
        round: 'Coding rounds',
        kind: 'React concepts',
        question: 'What useState, useEffect, useMemo, useCallback, useRef and useReducer are for, and how a component uses each, with sample snippets.',
        sources: [WALMART_W12_REACT_NATIVE],
        practice: { label: 'Which React hooks to choose', path: '/react/trivia/react-hooks-youve-used' },
      },
      {
        id: 'hard-recursion-problem',
        round: 'Coding rounds',
        kind: 'Algorithm',
        question: 'A hard coding problem built on recursion, which the candidate answered in pseudo-code.',
        promptNotShared: true,
        sources: [WALMART_W20_SWE3_FE],
      },
      {
        id: 'vanilla-accordion',
        round: 'Coding rounds',
        kind: 'UI build',
        question: 'Build an accordion in plain JavaScript, in a round with no React questions.',
        sources: [WALMART_W55_FE],
        practice: { label: 'React accordion', path: '/react/coding/react-accordion-faq' },
      },
      {
        id: 'add-two-numbers-with-promises',
        round: 'Coding rounds',
        kind: 'JavaScript',
        question: 'Add two numbers using promises.',
        sources: [WALMART_W55_FE],
        practice: { label: 'Add two promises', path: '/javascript/coding/js-add-two-promises' },
      },
      {
        id: 'valid-anagram',
        round: 'Coding rounds',
        kind: 'Algorithm',
        question: 'Check whether two strings are anagrams of each other (LeetCode Valid Anagram).',
        sources: [WALMART_W55_FE],
        practice: { label: 'Valid Anagram', path: '/javascript/coding/js-valid-anagram' },
      },
      {
        id: 'best-time-to-buy-and-sell',
        round: 'Coding rounds',
        kind: 'Algorithm',
        question: 'Find the best day to buy and the best later day to sell a stock (LeetCode Best Time to Buy and Sell Stock).',
        sources: [WALMART_W55_FE],
      },
      {
        id: 'hoisting-callback-hell-es6',
        round: 'Coding rounds',
        kind: 'JavaScript',
        question: 'Explain hoisting, show callback hell with an example, and go through the ES6 features in detail.',
        sources: [WALMART_W55_FE],
        practice: { label: 'Promise chains and async and await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'react-components-and-apis-design',
        round: 'System design',
        kind: 'Frontend system design',
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
        question:
          'How would you make the page load and render faster: lazy loading, resource hints, fewer and smaller requests, async or defer scripts, list virtualisation, and which Lighthouse metrics (FCP, LCP, TTI) you would track?',
        sources: [WALMART_W13_SWE3],
        practice: { label: 'Optimise page load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'xss-protection',
        round: 'System design',
        kind: 'Web fundamentals',
        question: 'How do you protect a web application against cross-site scripting?',
        sources: [WALMART_W13_SWE3],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
      },
      {
        id: 'react-ui-with-performance',
        kind: 'React build',
        question: 'Build a UI application in React with optimisation and browser performance in mind, after theory questions on HTML, CSS, JavaScript and React.',
        promptNotShared: true,
        sources: [WALMART_W32_FE],
      },
      {
        id: 'debug-frontend-issues',
        kind: 'Web fundamentals',
        question: 'How would you go about debugging front-end issues? It was the only frontend question in that loop.',
        sources: [WALMART_W20_SWE3_FE],
      },
      {
        id: 'phone-keypad-words',
        kind: 'Algorithm',
        question: 'Print every word that a string of phone keypad digits can spell.',
        sources: [WALMART_W5_SDE3_UI_2019],
      },
      {
        id: 'type-conversion',
        kind: 'JavaScript',
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
      'The number of frontend rounds varies; one 2026 account had none, and a 2019 candidate went from a hiring-manager quiz straight to the onsite. Google\'s pages say AI tools are not permitted in interviews, while a May 2026 news report describes a pilot for junior to mid-level roles on some US teams: an approved AI assistant in a code comprehension round, and a technical design discussion about a past project in the Googleyness round. Confirm the loop with your recruiter.',
    checkedAt: '2026-11-06',
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
            format: 'About an hour of coding in a shared document, in JavaScript or on an algorithm problem; some candidates have two screens.',
            appliesTo: 'Front-end candidates',
            sources: [GOOGLE_GO3, GOOGLE_GO4, GOOGLE_GO5, GOOGLE_GO6, GOOGLE_PHONE_2020],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
          },
          {
            stage: 'Interview loop',
            format: 'Four or five interviews by video or onsite: algorithm coding and usually one JavaScript or frontend round (more in two accounts), plus the Googleyness interview in its own row below.',
            appliesTo: 'All candidates',
            sources: [GOOGLE_HOW_WE_HIRE, GOOGLE_GO1, GOOGLE_GO2, GOOGLE_GO4, GOOGLE_GO7, GOOGLE_GO8, GOOGLE_ONSITE_2019],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'Googleyness interview',
            format:
              'About 45 minutes of behavioural and hypothetical questions, which several accounts call Googleyness and Leadership; in three 2026 accounts it sat in a first, virtual stage with one technical round, before the onsite coding, and one early-career loop added 15 minutes of it to a technical interview.',
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
            ],
            practice: { label: 'Googleyness questions and story drill', path: '/companies/google/preview', fragment: 'google-round-googleyness', drill: true },
          },
          {
            stage: 'System design',
            format: 'A design round with a frontend and API focus in most accounts; one L5 candidate reported a non-frontend design round.',
            appliesTo: 'L5 and above',
            sources: [GOOGLE_GO1, GOOGLE_GO2, GOOGLE_GO8],
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
  },
  meta: {
    title: 'Meta Front End Engineer interview process',
    summary:
      'Meta publishes Front End Engineer guides for the screen and the full loop: a recruiter conversation, a JavaScript screen with an engineer, then 4 to 6 interviews covering JavaScript coding, UI architecture and design, and behavioural questions. Public accounts from 2020 to 2025 match that shape.',
    caveat:
      'The guides differ on details: the screen is 45 minutes in the downloadable guide and 60 on the prep page, and the loop is at least three conversations on the page and 4 to 6 interviews in the guide. Meta\'s hiring page describes an AI-assisted coding interview for select roles, while the FEE guides ask for JavaScript and rule out AI tools. Confirm the format with your recruiter.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Front End Engineer, IC4 to IC6',
        stages: [
          {
            stage: 'Recruiter call',
            format: 'Background and interest; some recruiters ask a short JavaScript quiz.',
            appliesTo: 'All candidates',
            sources: [META_HIRING, META_ME1, META_ME2, META_ME3, META_ME11],
          },
          {
            stage: 'Initial technical screen',
            format: 'Coding with an engineer in CoderPad, in JavaScript: one or two problems in 45–60 minutes.',
            appliesTo: 'IC4 to IC5',
            sources: [META_FEE_INITIAL, META_ME3, META_ME6, META_ME8, META_ME9, META_ME10],
            practice: { label: 'Flatten an array one level', path: '/javascript/coding/js-flatten-once' },
          },
          {
            stage: 'Full loop: coding',
            format: 'About two problems in about 40 minutes, in JavaScript, with no dynamic programming; accounts describe DOM and utility problems.',
            appliesTo: META_ROLE,
            sources: [META_FEE_ONSITE, META_ME4, META_ME5, META_ME6, META_ME7, META_ME11],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
            rehearsal: { label: 'Meta coding round, 2 problems in 40 minutes', path: '/javascript/coding/js-debounce' },
          },
          {
            stage: 'Full loop: UI architecture and design',
            format: '45 minutes without code: the front end of a product, or a component such as autocomplete or typeahead.',
            appliesTo: META_ROLE,
            sources: [META_FEE_ONSITE, META_ME4, META_ME5, META_ME6, META_ME7, META_ME11],
            practice: { label: 'Infinite scroll list design', path: '/system-design/infinite-scroll-list' },
          },
          {
            stage: 'Full loop: behavioural',
            format: 'A 45-minute session.',
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
            stage: 'Recruiter call',
            format: 'A screening call; some recruiters ask basic JavaScript questions.',
            appliesTo: 'Interns',
            sources: [META_ME1, META_ME2],
          },
          {
            stage: 'Technical interviews',
            format: 'One or two JavaScript interviews by video.',
            appliesTo: 'Interns',
            sources: [META_ME1, META_ME2, META_ME2B],
          },
        ],
      },
    ],
  },
  microsoft: {
    summary:
      'Microsoft\'s hiring tips describe a brief screening conversation and two to four interviews of up to an hour each. Frontend accounts from 2020 to 2025 describe two to six interviews mixing machine coding, JavaScript and React concepts, algorithms, design and a hiring manager conversation; the mix depends on the team.',
    caveat:
      'Two older Bangalore accounts describe five or six rounds and a third four, against the official two to four, and some frontend candidates were interviewed mostly on non-frontend material. Ask the recruiter which rounds your team runs.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend roles (the loop varies by team)',
        stages: [
          {
            stage: 'Recruiter or HR call',
            format: 'A short call.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_HIRING_TIPS, MICROSOFT_MS1, MICROSOFT_MS4, MICROSOFT_MS8],
          },
          {
            stage: 'Machine coding',
            format: 'A UI build, two hours in the one account that gives a duration: plain JavaScript in 2020–2021 accounts from Bangalore, React components in 2024–2025 accounts.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS3, MICROSOFT_MS6, MICROSOFT_MS7, MICROSOFT_MS9],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'JavaScript and React concepts',
            format: 'Output questions, polyfills and promises.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS4, MICROSOFT_MS7, MICROSOFT_MS9],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Algorithms and problem solving',
            format: 'Coding problems; some frontend candidates were asked mostly non-frontend questions.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS3, MICROSOFT_MS5, MICROSOFT_MS7, MICROSOFT_MS8],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Design',
            format: 'Low-level design in 2020–2021 accounts; application or component design in 2024 accounts.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS6, MICROSOFT_MS7],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Behavioural and hiring manager',
            format: 'Hiring-manager rounds that were technical in the 2020 and 2021 accounts and behavioural in 2024.',
            appliesTo: MICROSOFT_ROLE,
            sources: [MICROSOFT_MS1, MICROSOFT_MS2, MICROSOFT_MS6, MICROSOFT_MS7],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
      {
        title: 'Students',
        stages: [
          {
            stage: 'Initial interview',
            format: 'A first interview.',
            appliesTo: 'Students',
            sources: [MICROSOFT_STUDENTS],
          },
          {
            stage: 'Final interview',
            format: 'A second, final interview for those selected; student interviews are virtual.',
            appliesTo: 'Students',
            sources: [MICROSOFT_STUDENTS],
          },
        ],
      },
    ],
  },
  apple: {
    summary:
      'Apple publishes interview tips but no process page. Frontend accounts from 2021 to 2025 describe a recruiter or hiring manager conversation, a 45–60 minute technical screen and a team loop of four to seven interviews that are mostly JavaScript, React and CSS coding.',
    caveat:
      'Each team runs its own process: one 2025 senior loop had four coding rounds and no behavioural or design round, while other loops included behavioural or cross-functional interviews. Confirm the format with your recruiter.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend roles (the loop varies by team)',
        stages: [
          {
            stage: 'Online assessment',
            format: 'One hour: two coding questions and 20 multiple-choice questions.',
            appliesTo: 'One IC3 account',
            sources: [APPLE_AP1],
          },
          {
            stage: 'Recruiter call',
            format: 'A short call.',
            appliesTo: APPLE_ROLE,
            sources: [APPLE_AP1, APPLE_AP3, APPLE_AP9, APPLE_ICT3_2025],
          },
          {
            stage: 'Hiring manager conversation',
            format: 'Before the screen, or as the screen itself.',
            appliesTo: 'Some teams',
            sources: [APPLE_AP7, APPLE_AP9, APPLE_AP10, APPLE_ICT3_2025, APPLE_FULLSTACK_2026],
            practice: { label: 'Apple team conversation questions and story drill', path: '/companies/apple/preview', fragment: 'apple-round-team-conversations', drill: true },
          },
          {
            stage: 'Technical screen',
            format: '45–60 minutes of React, JavaScript or TypeScript coding, sometimes with an algorithm problem; one screen was mostly conversation.',
            appliesTo: APPLE_ROLE,
            sources: [APPLE_AP1, APPLE_AP3, APPLE_AP4, APPLE_AP5, APPLE_AP6, APPLE_AP8, APPLE_AP9],
            practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
          },
          {
            stage: 'Team loop',
            format: 'Four to seven interviews of 30–45 minutes, mostly JavaScript, React and CSS coding and concepts; some teams add behavioural or cross-functional interviews.',
            appliesTo: APPLE_ROLE,
            sources: [APPLE_AP2, APPLE_AP3, APPLE_AP4, APPLE_AP7, APPLE_AP8, APPLE_AP10, APPLE_ICT3_2025],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
        ],
      },
    ],
  },
  uber: {
    summary:
      'Uber\'s frontend interview guide lists a recruiter call, a HackerRank assessment, a 60-minute phone screen, then three 60-minute interviews: algorithms and data structures, depth in specialization, and collaboration and leadership. Accounts from 2022 to 2026, mostly from India, add a separate frontend system design round.',
    caveat:
      'Accounts from 2021 and 2022 used CodeSignal rather than HackerRank, and two candidates found that rounds the recruiter called algorithm rounds were frontend builds instead. The guide says steps may vary by role, location and business needs.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers, L3 to L5A',
        stages: [
          {
            stage: 'Recruiter call',
            format: '30 minutes; one 2025 account had technical questions at this stage.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_UB3, UBER_UB8],
          },
          {
            stage: 'Online assessment',
            format: 'HackerRank in the official guide; a 35-minute CodeSignal test with algorithm and frontend multiple-choice questions in a 2022 account.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Phone screen',
            format: '60 minutes of coding, sometimes a React UI component.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_UB_CODESIGNAL_2021, UBER_UB1, UBER_UB3, UBER_UB4, UBER_UB5],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Algorithms and data structures',
            format: '60 minutes; one account calls it the bar raiser round.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB5],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
          },
          {
            stage: 'Frontend specialization',
            format: '60 minutes: a UI build or a JavaScript problem, in plain JavaScript in two accounts.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5, UBER_UB6, UBER_UB_ROUNDS_2025],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'System design',
            format: 'Frontend architecture; three accounts were asked to design a calendar, a collaborative one in 2022 and Google Calendar in two 2025 loops.',
            appliesTo: 'Mid and senior levels',
            sources: [UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Collaboration and leadership',
            format: '60 minutes with the hiring manager on past projects and behaviour.',
            appliesTo: UBER_ROLE,
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
  },
  stripe: {
    summary:
      'Stripe\'s careers FAQ describes a recruiter screen, a technical or skills-based assessment and a series of interviews with the team. Frontend accounts from 2022 to 2025 describe a 60-minute multi-part CoderPad screen, then an onsite with a bug squash, an integration exercise, a programming exercise, frontend design and a manager conversation.',
    caveat:
      'The onsite rows rest on a few accounts and one recruiter\'s plan, and one candidate had a hiring manager interview instead of the bug squash. Confirm the rounds with your recruiter.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers',
        stages: [
          {
            stage: 'Recruiter screen',
            format: '30 minutes.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_CAREERS, STRIPE_ST1, STRIPE_ST3, STRIPE_ST5],
          },
          {
            stage: 'Technical screen',
            format: '60 minutes of live, multi-part coding in CoderPad, sometimes building a UI component; one screen was a three-part exercise.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_CAREERS, STRIPE_ST3, STRIPE_ST5, STRIPE_ST7, STRIPE_ST8, STRIPE_ST9],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Onsite: bug squash',
            format: 'Find and fix bugs in an unfamiliar codebase.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST4, STRIPE_ST5, STRIPE_ST6_PLAN],
            practice: { label: 'Bug squash an unfamiliar invoicing repo', path: '/javascript/debug/js-debug-bug-squash-invoices' },
          },
          {
            stage: 'Onsite: integration',
            format: 'Combine provided tools or APIs into a working feature.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST4, STRIPE_ST6_PLAN],
            // Each onsite row gets its own practice, so the plan can fill all three rounds instead of one.
            practice: { label: 'Fetch JSON with a timeout and abort', path: '/javascript/coding/js-fetch-json-timeout' },
          },
          {
            stage: 'Onsite: programming exercise',
            format: 'A coding exercise.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST6_PLAN],
            practice: { label: 'Parse a query string', path: '/javascript/coding/js-querystring-parse-1' },
          },
          {
            stage: 'Onsite: frontend design',
            format: 'Design a frontend system or component.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST6_PLAN],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Onsite: manager conversation',
            format: 'A conversation about goals and past work.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST6_PLAN],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
  },
  bytedance: {
    title: 'ByteDance and TikTok frontend interview process',
    summary:
      'ByteDance and TikTok publish interview tips for early careers only. Experienced frontend accounts from 2022 to 2025 describe an online assessment for some candidates, a recruiter call, two technical rounds (one algorithm round, one frontend round), a hiring manager round that often includes design, and an HR round.',
    caveat:
      'Accounts disagree on whether the hiring manager round is behavioural only or includes design or coding, and some candidates skipped the online assessment. Loops differ by region, so confirm yours with the recruiter.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers, United States',
        stages: [
          {
            stage: 'Online assessment',
            format: 'CodeSignal in one 2025 account and an unnamed platform in two others, with multiple-choice and LeetCode-style questions and a frontend task; HackerRank appears in the early-careers accounts.',
            appliesTo: 'Some candidates',
            sources: [BYTEDANCE_TT1, BYTEDANCE_TT2, BYTEDANCE_TT10],
          },
          {
            stage: 'Recruiter call',
            format: '15–30 minutes.',
            appliesTo: 'All candidates',
            sources: [BYTEDANCE_BD2, BYTEDANCE_BD5, BYTEDANCE_BD9, BYTEDANCE_TT3, BYTEDANCE_TT5],
          },
          {
            stage: 'Technical rounds',
            format: 'Usually two rounds of about an hour: one algorithm round and one frontend round, such as a React component or a JavaScript utility.',
            appliesTo: 'All candidates',
            sources: [BYTEDANCE_BD2, BYTEDANCE_BD5, BYTEDANCE_BD8, BYTEDANCE_TT1, BYTEDANCE_TT2, BYTEDANCE_TT3, BYTEDANCE_TT4],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
          },
          {
            stage: 'Hiring manager round',
            format: 'Experience questions plus frontend system design or React and JavaScript questions; some candidates describe it as behavioural only.',
            appliesTo: 'Most candidates',
            sources: [BYTEDANCE_BD2, BYTEDANCE_BD8, BYTEDANCE_TT3, BYTEDANCE_TT4, BYTEDANCE_TT5],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'HR or behavioural round',
            format: 'Behavioural and culture questions.',
            appliesTo: 'Some accounts',
            sources: [BYTEDANCE_TT1, BYTEDANCE_TT2, BYTEDANCE_TT5],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
      {
        title: 'Frontend engineers, Singapore and Australia',
        stages: [
          {
            stage: 'Online assessment',
            format: 'A CodeSignal task for some candidates; others skipped the assessment.',
            appliesTo: 'Some candidates',
            sources: [BYTEDANCE_TT9, BYTEDANCE_TT15, BYTEDANCE_TT16],
          },
          {
            stage: 'Technical rounds',
            format: 'Two or three rounds of about an hour on JavaScript and React fundamentals and LeetCode-style problems.',
            appliesTo: 'All candidates',
            sources: [BYTEDANCE_TT6, BYTEDANCE_TT7, BYTEDANCE_TT8, BYTEDANCE_BDT1, BYTEDANCE_BD6],
          },
          {
            stage: 'Hiring manager round',
            format: 'A round with the hiring manager; in one account it was the third technical round.',
            appliesTo: 'Most candidates',
            sources: [BYTEDANCE_TT6, BYTEDANCE_TT7],
          },
          {
            stage: 'HR round',
            format: 'A final HR conversation.',
            appliesTo: 'Most candidates',
            sources: [BYTEDANCE_TT6, BYTEDANCE_BDT1],
          },
        ],
      },
      {
        title: 'New graduates and interns',
        stages: [
          {
            stage: 'Online assessment',
            format: 'Multiple-choice, algorithm and debugging questions, up to about 110 minutes; the TikTok early-careers page says some roles and regions use an assessment.',
            appliesTo: 'Students',
            sources: [BYTEDANCE_TIKTOK_CAMPUS, BYTEDANCE_BD7, BYTEDANCE_TT11, BYTEDANCE_TT12],
          },
          {
            stage: 'Technical interviews',
            format: 'Two to three interviews on coding, algorithms and design, per the early-careers pages; accounts describe one to three.',
            appliesTo: 'Students',
            sources: [BYTEDANCE_CAMPUS, BYTEDANCE_BD1, BYTEDANCE_BD4, BYTEDANCE_TT11],
          },
          {
            stage: 'Manager or behavioural round',
            format: 'A final manager or behavioural interview.',
            appliesTo: 'Students',
            sources: [BYTEDANCE_BD4, BYTEDANCE_TT11],
          },
        ],
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
        question:
          'Build an autocomplete search box that suggests matches in a dropdown as the user types, and say which features are must-haves and which can wait; one 2023 account required plain JavaScript, HTML and CSS. Another lists API calls, highlighting the matched text, debounce or throttle, caching, keyboard navigation and error states.',
        sources: [BOOKINGCOM_BK2, BOOKINGCOM_BK1, BOOKINGCOM_BK11],
        practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
      },
      {
        id: 'tooltip',
        round: 'Frontend coding',
        kind: 'UI build',
        question: 'Implement a tooltip, in the first of two live coding rounds.',
        sources: [BOOKINGCOM_BK11],
      },
      {
        id: 'react-component-api-design-spec',
        round: 'Frontend coding',
        kind: 'React build',
        question: 'With two senior frontend engineers, build a React component that renders data from an API endpoint and matches a given design spec.',
        sources: [BOOKINGCOM_BK5],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'prepared-app-new-feature',
        round: 'Frontend coding',
        kind: 'Practical coding',
        question: 'Add a new feature to an application prepared in advance, in the framework of your choice.',
        promptNotShared: true,
        sources: [BOOKINGCOM_BK6],
      },
      {
        id: 'get-api-display-components',
        round: 'Frontend coding',
        kind: 'UI build',
        question: 'Make a GET request to an API and build the components that display what it returns, in the frontend round of a senior full-stack loop.',
        sources: [BOOKINGCOM_BK13_SENIOR_FULLSTACK],
        practice: { label: 'React debounced search with a fake API', path: '/react/coding/react-debounced-search' },
      },
      {
        id: 'attractions-by-review-score',
        round: 'HackerRank assessment',
        kind: 'React build',
        question: 'Build the React side of a small app that lists the attractions whose average review score is at or above a score the user enters.',
        sources: [BOOKINGCOM_BK17_DEVTO],
        practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
      },
      {
        id: 'rxjs-angular-questions',
        kind: 'Angular concepts',
        question: 'Questions on RxJS, on how Angular components are structured and on the Angular component lifecycle, in an interview without coding.',
        sources: [BOOKINGCOM_BK16_ANGULAR],
        practice: { label: 'Angular lifecycle hooks', path: '/angular/trivia/angular-lifecycle-hooks' },
      },
    ],
  },
  datadog: {
    summary:
      'Datadog\'s candidate experience page describes an initial screen, interviews in rounds or panels with one step expected in person, and a take-home project for some roles. Frontend accounts from 2023 to 2025, mostly from Europe, describe a recruiter screen, an algorithm screen, React live coding, a second coding round, frontend system design, experience and values, then team matching.',
    caveat:
      'One 2024 candidate could choose a take-home project instead of React live coding, and some loops had an interview in person at an office while others were fully virtual. Evidence from the US is thin.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers, mostly in Europe',
        stages: [
          {
            stage: 'Recruiter screen',
            format: 'About 30 minutes on background and a past project.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_CANDIDATE_EXPERIENCE, DATADOG_DD1, DATADOG_DD3, DATADOG_DD5, DATADOG_DD6, DATADOG_DD9, DATADOG_DD10],
          },
          {
            stage: 'Technical screen',
            format: '40–60 minutes in CoderPad: two easy or medium algorithm problems in JavaScript or TypeScript.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD6, DATADOG_DD10],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'React live coding',
            format: 'One hour: render a table or JSON data, then add search, sorting or filtering step by step.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD2, DATADOG_DD3, DATADOG_DD5, DATADOG_DD6, DATADOG_DD7, DATADOG_DD8, DATADOG_DD10],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Second coding round',
            format: 'A harder or product-focused coding round with follow-up changes.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD8, DATADOG_DD10],
          },
          {
            stage: 'Frontend system design',
            format: 'One hour on a whiteboard tool: the UI, API endpoints and performance; held in person at an office in some loops.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_CANDIDATE_EXPERIENCE, DATADOG_DD1, DATADOG_DD2, DATADOG_DD3, DATADOG_DD5, DATADOG_DD6, DATADOG_DD8, DATADOG_DD10],
            practice: { label: 'Dashboard widgets design', path: '/system-design/dashboard-widgets-draggable-resizable' },
          },
          {
            stage: 'Experience and values',
            format: 'A project deep dive and behavioural questions, sometimes split into two rounds.',
            appliesTo: DATADOG_ROLE,
            sources: [DATADOG_DD1, DATADOG_DD2, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD6, DATADOG_DD7, DATADOG_DD8],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Team match',
            format: 'Short calls with prospective teams after the interviews.',
            appliesTo: 'Candidates who pass',
            sources: [DATADOG_DD1, DATADOG_DD3, DATADOG_DD4, DATADOG_DD5, DATADOG_DD7],
          },
        ],
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
        question: 'Write a function that retries a promise-returning function a given number of times, waiting a set delay between attempts.',
        sources: [INTUIT_IN1],
        practice: { label: 'Retry a promise-returning function with delay', path: '/javascript/coding/js-retry-with-delay' },
        answerGuide: 'promise-retry-and-race-polyfill',
      },
      {
        id: 'promise-race-polyfill',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        question: 'Explain how Promise.race differs from Promise.any, then implement Promise.race without the built-in.',
        sources: [INTUIT_IN1],
        practice: { label: 'Promise.any, the sibling combinator', path: '/javascript/coding/js-promise-any' },
        answerGuide: 'promise-retry-and-race-polyfill',
      },
      {
        id: 'llm-story-streaming',
        round: 'Assessor or technical rounds',
        kind: 'Practical coding',
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
        question: 'Write a function that curries another function, so its arguments can be passed one call at a time.',
        sources: [INTUIT_IN3],
        practice: { label: 'Curry function', path: '/javascript/coding/js-curry-function' },
        answerGuide: 'javascript-fundamentals-under-questioning',
      },
      {
        id: 'memoize-function',
        round: 'Technical phone interview',
        kind: 'JavaScript',
        question: 'Write a function that memoizes another function, returning cached results for arguments it has seen.',
        sources: [INTUIT_IN3],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
        answerGuide: 'javascript-fundamentals-under-questioning',
      },
      {
        id: 'identical-dom-trees',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        question: 'Write a function that checks whether two DOM trees are identical, comparing them node by node.',
        sources: [INTUIT_IN1],
        practice: { label: 'Walk twin DOM trees in step', path: '/javascript/coding/js-dom-twin-node' },
        answerGuide: 'javascript-fundamentals-under-questioning',
      },
      {
        id: 'nested-comments-indexeddb',
        round: 'Craft demonstration',
        kind: 'React build',
        question:
          'Build a nested comment component that keeps its state in IndexedDB, with a test for adding a comment, as one of the stories you pick.',
        sources: [INTUIT_IN1],
        practice: { label: 'React nested comments', path: '/react/coding/react-nested-comments' },
      },
      {
        id: 'meeting-rooms-app',
        round: 'Craft demonstration',
        kind: 'UI build',
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
        question:
          'Build a web app whose form adds an entry through a CRUD API and whose page shows the updated data, choosing what to build fully and what to stub within the hour.',
        sources: [INTUIT_IN15],
        answerGuide: 'craft-demo-build-and-extend',
      },
      {
        id: 'api-data-on-the-spot',
        round: 'Craft demonstration',
        kind: 'UI build',
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
        question: 'Build a small transactions application as the craft task.',
        promptNotShared: true,
        sources: [INTUIT_HR_2022],
      },
      {
        id: 'chessboard-layout',
        round: 'Craft demonstration',
        kind: 'UI build',
        question: 'Lay out a chessboard with HTML, CSS and JavaScript, as the small project to finish before the interview.',
        sources: [INTUIT_IN5],
        practice: { label: 'React chessboard', path: '/react/coding/react-chessboard-click-highlight' },
      },
      {
        id: 'rendering-path-and-performance',
        round: 'Craft demonstration',
        kind: 'Web fundamentals',
        question: 'Explain the critical rendering path, the DOM and the CSSOM, and how you would optimise a page\'s performance.',
        sources: [INTUIT_IN13],
        practice: { label: 'How the browser parses and renders HTML', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'todo-machine-coding',
        round: 'Technical phone interview',
        kind: 'UI build',
        question: 'Build a to-do app as a machine-coding task inside the phone interview.',
        promptNotShared: true,
        sources: [INTUIT_IN2],
        practice: { label: 'React to-do list', path: '/react/coding/react-todo-list' },
      },
      {
        id: 'balanced-brackets',
        round: 'Technical phone interview',
        kind: 'Algorithm',
        question: 'Check whether the brackets in a string are balanced when the string also holds other characters.',
        sources: [INTUIT_IN1],
        practice: { label: 'Valid parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'connected-components',
        round: 'Technical phone interview',
        kind: 'Algorithm',
        question: 'Solve a graph problem about connected components.',
        promptNotShared: true,
        sources: [INTUIT_IN1],
      },
      {
        id: 'coin-change',
        round: 'Technical phone interview',
        kind: 'Algorithm',
        question: 'Solve the coin change problem in the shortlisting round.',
        sources: [INTUIT_IN11],
      },
      {
        id: 'performance-security-output',
        round: 'Technical phone interview',
        kind: 'Web fundamentals',
        question: 'Questions on web performance and security, and snippets whose output you predict.',
        promptNotShared: true,
        sources: [INTUIT_IN3],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
      },
      {
        id: 'promises-and-classes',
        round: 'Technical phone interview',
        kind: 'JavaScript',
        question: 'Questions on JavaScript promises and classes.',
        promptNotShared: true,
        sources: [INTUIT_IN2],
      },
      {
        id: 'debounce-like-api-calls',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        question: 'In a scenario-based round with an architect, write a function that controls repeated API calls the way debounce does.',
        sources: [INTUIT_IN13],
        practice: { label: 'Debounce function', path: '/javascript/coding/js-debounce' },
      },
      {
        id: 'currency-string-helper',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        question:
          'Rewrite a helper from your craft project that converts a currency string to an integer, this time without String prototype methods or other built-ins.',
        sources: [INTUIT_IN12],
      },
      {
        id: 'performance-and-react-internals',
        round: 'Assessor or technical rounds',
        kind: 'React concepts',
        question: 'Questions on front-end performance and React internals.',
        promptNotShared: true,
        sources: [INTUIT_IN12],
      },
      {
        id: 'three-sum-then-k-sum',
        round: 'Assessor or technical rounds',
        kind: 'Algorithm',
        question: 'Solve 3Sum, then generalise the solution to kSum.',
        sources: [INTUIT_IN6_SDE2_2021],
        practice: { label: '3Sum', path: '/javascript/coding/js-three-sum' },
      },
      {
        id: 'polyfills-and-recursion',
        round: 'Assessor or technical rounds',
        kind: 'JavaScript',
        question: 'JavaScript questions on polyfills and recursion in an hour-long round.',
        promptNotShared: true,
        sources: [INTUIT_IN6_SDE2_2021],
      },
      {
        id: 'microfrontends-vitals-workers',
        round: 'Hiring manager',
        kind: 'Frontend system design',
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
      'ServiceNow\'s hiring page says interview rounds vary by position and may include a technical coding assessment or a presentation. Accounts from 2022 to 2025, two of them placed in India by Taro, describe a screening call, two JavaScript-heavy technical rounds, sometimes a design or machine-coding round, and a hiring manager round.',
    caveat:
      'This table covers the accounts that state India or no location. Accounts from the US describe algorithm-focused loops and plans with the hiring manager first, but they are too few for a table. One 2025 account added a final round with a director.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'UI and frontend engineers, 2022 to 2025',
        stages: [
          {
            stage: 'Screening call',
            format: 'A short screening conversation.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN4],
          },
          {
            stage: 'JavaScript fundamentals',
            format: 'About an hour in one account: closures, promises, polyfills and output prediction, or JavaScript, HTML and CSS with algorithm problems.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN2, SERVICENOW_SN3, SERVICENOW_SN4],
            practice: { label: 'Closures', path: '/javascript/trivia/js-closures' },
          },
          {
            stage: 'Second technical round',
            format: 'Deeper JavaScript, algorithm problems, or high- and low-level design.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN2, SERVICENOW_SN3, SERVICENOW_SN4],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Design or machine coding',
            format: 'A small web app in plain JavaScript, or a UI in React, Angular or plain JavaScript.',
            appliesTo: 'Some loops',
            sources: [SERVICENOW_SN4, SERVICENOW_SN5],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'Hiring manager',
            format: 'A hiring-manager round, short in one account and an hour in another, mixing JavaScript questions such as Map versus Object, a design task and behavioural questions.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN2, SERVICENOW_SN3, SERVICENOW_SN4],
            practice: { label: 'Map versus Object', path: '/javascript/trivia/js-map-vs-object' },
          },
        ],
      },
    ],
  },
  revolut: {
    summary:
      'The Revolut engineering careers page lists four steps, an intro call with an IT recruiter, tech interviews, team fit and offer, without formats or durations; the Bar Raiser stage appears in the careers video, not in that list. Frontend accounts from 2022 to 2025 across European hubs describe a recruiter or HR screen, a HackerRank test with three algorithm tasks, an hour of React live coding, a system design round for mid and senior roles, a team fit conversation and a Bar Raiser interview.',
    caveat:
      'Almost every account is on Taro. The only account with an offer (2022) had neither a system design round nor a Bar Raiser, and the order of the HackerRank test and the recruiter call varies.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers in European hubs',
        stages: [
          {
            stage: 'Recruiter or HR screen',
            format: 'Background and salary; some recruiters ask a few JavaScript questions.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_ENGINEERING, REVOLUT_RV2, REVOLUT_RV3, REVOLUT_RV5, REVOLUT_RV7, REVOLUT_RV12],
          },
          {
            stage: 'HackerRank assessment',
            format: 'Three algorithm tasks in 85–110 minutes, done at home before a deadline; sometimes before the recruiter call.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_RV4, REVOLUT_RV5, REVOLUT_RV6, REVOLUT_RV7, REVOLUT_RV9, REVOLUT_RV10],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
            rehearsal: { label: 'Revolut HackerRank assessment, 3 problems in 85 minutes', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Live coding',
            format: 'About an hour of React and TypeScript: fetch data from an API and render it with loading and error states, or extend a small app.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_RV1, REVOLUT_RV2, REVOLUT_RV4, REVOLUT_RV5, REVOLUT_RV6, REVOLUT_RV8],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'System design',
            format: 'Product features and API contracts, or a whole system such as card delivery.',
            appliesTo: 'Mid and senior roles',
            sources: [REVOLUT_RV2, REVOLUT_RV4, REVOLUT_RV7],
            practice: { label: 'Resilient checkout and payment flow', path: '/system-design/resilient-checkout-payment-flow' },
          },
          {
            stage: 'Team fit',
            format: 'A behavioural conversation with the team.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_RV2, REVOLUT_RV9],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Bar Raiser',
            format: 'An interview on how you work and make decisions; listed in recent plans, with no first-hand account since 2022.',
            appliesTo: REVOLUT_ROLE,
            sources: [REVOLUT_BAR_RAISER, REVOLUT_RV1, REVOLUT_RV15_PLAN],
            // The guide's own Bar Raiser section, so the team-fit round keeps the behavioural guide in the plan.
            practice: { label: 'What the Bar Raiser covers', path: '/companies/revolut/preview', fragment: 'revolut-round-bar-raiser' },
          },
        ],
      },
    ],
  },
  spotify: {
    summary:
      'Spotify\'s hiring page describes a recruiter interview, a second interview with one or two team members and a final round with several team members. Web engineer accounts from 2021 to 2025, mostly from the US and Canada, describe a technical screen and a final round with a plain HTML, CSS and JavaScript build, algorithms, system design and a values interview.',
    caveat:
      'The detailed accounts are from the US and Canada; evidence from Europe is limited to full-stack accounts. One hired candidate had no debugging round.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Web engineers, United States and Canada',
        stages: [
          {
            stage: 'Recruiter call',
            format: 'A short call on background and why Spotify.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_JOURNEY, SPOTIFY_SP1, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP8, SPOTIFY_SP9],
          },
          {
            stage: 'Technical screen',
            format: '60–75 minutes with one or two engineers: JavaScript and CSS questions, an easy algorithm problem, or rebuilding an HTML and CSS mockup.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_JOURNEY, SPOTIFY_SP2, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP8, SPOTIFY_SP9],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Final: web practical',
            format: 'A plain HTML, CSS and JavaScript build, such as a form that fetches from an API into the DOM or a traffic light, or web domain questions.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_SP1_DESIGN, SPOTIFY_SP3, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP7, SPOTIFY_SP9],
            practice: { label: 'Forms: validation and required fields', path: '/html/coding/html-forms-validation-required' },
          },
          {
            stage: 'Final: algorithms',
            format: 'An easy to medium LeetCode-style problem.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_SP1_DESIGN, SPOTIFY_SP3, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP6, SPOTIFY_SP9],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Final: system design',
            format: 'Product design that includes the backend.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_SP1_DESIGN, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP6, SPOTIFY_SP9],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Final: values',
            format: 'A values interview; one account had it with the hiring manager.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_SP1, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP6, SPOTIFY_SP9],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
  },
  zalando: {
    summary:
      'Zalando\'s hiring page describes a 30-minute talent acquisition call, a case study such as a coding exercise, a hiring manager conversation and three to five final interviews. Frontend accounts, two of them from Berlin, between 2019 and 2024 describe a Codility take-home, then a final day with a review of the take-home, JavaScript fundamentals, coding, system design and a manager conversation.',
    caveat:
      'Zalando\'s own pages disagree on whether the hiring manager comes before or after the coding challenge. Only one detailed account is from after 2022, and two of the three complete loops are from Berlin.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers, Berlin',
        stages: [
          {
            stage: 'Talent acquisition call',
            format: '30 minutes on motivation and salary.',
            appliesTo: 'Tech roles',
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_BLOG],
          },
          {
            stage: 'Coding challenge',
            format: 'An assessment at home: a Codility challenge of two to three hours in 2022 and 2024 (a React and Node app, easy algorithm problems); the 2020 account named no platform and had three working days.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_ZA1, ZALANDO_ZA2, ZALANDO_ZA4],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Hiring manager',
            format: '30–60 minutes on the official pages; a Blind commenter describes it as non-technical, and in 2020 it was half of a two-hour phone stage.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_BLOG, ZALANDO_ZA2, ZALANDO_ZA3, ZALANDO_ZA4],
          },
          {
            stage: 'Final: take-home review',
            format: 'A discussion of the submitted code, 45 minutes in the 2024 account.',
            appliesTo: 'Senior roles',
            sources: [ZALANDO_ZA1, ZALANDO_ZA3],
          },
          {
            stage: 'Final: JavaScript fundamentals',
            format: 'One hour with frontend engineers.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_BLOG, ZALANDO_ZA1, ZALANDO_ZA2, ZALANDO_ZA3],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Final: coding',
            format: 'One hour of live coding.',
            appliesTo: 'Some loops',
            sources: [ZALANDO_BLOG, ZALANDO_ZA2],
          },
          {
            stage: 'Final: system design',
            format: 'One hour, leaning toward backend topics such as a load balancer.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_BLOG, ZALANDO_ZA1, ZALANDO_ZA2, ZALANDO_ZA3],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Final: engineering manager or HR',
            format: '45 minutes.',
            appliesTo: 'Senior roles',
            sources: [ZALANDO_ZA1, ZALANDO_ZA2],
            // The hiring-manager round takes the general behavioural guide; this one gets its own page.
            practice: { label: 'Common behavioral questions', path: '/guides/behavioral/common-questions' },
          },
        ],
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
        question: 'In a one-hour pair-coding session, build a chat interface in React while an engineer from the team reviews your code live.',
        sources: [XAI_X1_FE_2025],
        practice: { label: 'Chat UI with a streaming response', path: '/react/coding/react-chat-streaming-ui' },
        answerGuide: 'react-chat-interface-pairing',
      },
      {
        id: 'what-usecallback-does',
        round: 'React coding interview',
        kind: 'React concepts',
        question: 'What does the useCallback hook do? One of the React questions asked during the pair-coding build.',
        sources: [XAI_X1_FE_2025],
        practice: { label: 'useMemo vs useCallback: when memoising makes it slower', path: '/react/trivia/react-usememo-vs-usecallback' },
      },
      {
        id: 'what-useref-is-for',
        round: 'React coding interview',
        kind: 'React concepts',
        question: 'Explain what useRef is for and how you would use it in a component.',
        sources: [XAI_X2_SPECIALIST_2025],
        practice: { label: 'useRef vs useState: why changing a ref does not re-render', path: '/react/trivia/react-useref-vs-usestate' },
      },
      {
        id: 'four-hour-demo-product',
        round: 'Take-home and code-reading final',
        kind: 'Practical coding',
        question:
          'Pick one of six xAI prompts and build a demoable product in four hours, using AI assistants and the provided X and xAI API keys, then explain in a video which systems you used and why; this candidate improved X search with Grok.',
        sources: [XAI_X7_MTS_2025],
      },
      {
        id: 'token-queue-class',
        round: 'Take-home and code-reading final',
        kind: 'Practical coding',
        question:
          'Read an existing class of 70 to 100 lines and implement the missing part that splits LLM input into token-sized queues and returns them; follow-ups asked how the class is structured and where its data moves.',
        sources: [XAI_X7_MTS_2025],
      },
      {
        id: 'key-value-transactions',
        round: 'Coding assessment in a language of your choice',
        kind: 'Practical coding',
        question: 'Design and code a key-value database with set plus begin, commit and abort for transactions, then support nested transactions.',
        sources: [XAI_X8_SAFETY_2025],
      },
      {
        id: 'stateful-list-iterator',
        round: 'Coding assessment in a language of your choice',
        kind: 'Practical coding',
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
        question: 'Write a generic memoization function that caches results by their arguments.',
        sources: [JPMORGAN_JP11],
        practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
        answerGuide: 'generic-memoize-function',
      },
      {
        id: 'generic-async-promise-hook',
        round: 'Live coding',
        kind: 'React build',
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
        question: 'What is a closure in JavaScript?',
        sources: [JPMORGAN_JP2, JPMORGAN_JP4, JPMORGAN_JP12],
        practice: { label: 'Explain closures in JavaScript', path: '/javascript/trivia/js-closures' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'reduce-polyfill',
        round: 'Security and framework rounds',
        kind: 'JavaScript',
        question: 'Write a polyfill for the array reduce method.',
        sources: [JPMORGAN_JP11],
        practice: { label: 'Implement Array.prototype.reduce', path: '/javascript/coding/js-array-prototype-reduce' },
        answerGuide: 'reduce-polyfill-with-async-follow-ups',
      },
      {
        id: 'priority-todo-list',
        round: 'Live coding',
        kind: 'React build',
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
        question: 'What is the difference between a shallow and a deep clone, and what is a use case for Object.assign?',
        sources: [JPMORGAN_JP2],
        practice: { label: 'Shallow copy versus deep copy', path: '/javascript/trivia/js-shallow-vs-deep-copy' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'usecallback-vs-usememo',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        question: 'What is the difference between useCallback and useMemo?',
        sources: [JPMORGAN_JP2],
        practice: { label: 'useMemo versus useCallback', path: '/react/trivia/react-usememo-vs-usecallback' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'usestate-vs-useref',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        question: 'What is the difference between the useState hook and the useRef hook?',
        sources: [JPMORGAN_JP3],
        practice: { label: 'useRef versus useState', path: '/react/trivia/react-useref-vs-usestate' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'search-bar-suggestions',
        kind: 'React build',
        question:
          'Write a function component with a search bar over a group of strings that shows matching suggestions as the user types.',
        sources: [JPMORGAN_J14_FULLSTACK_2025],
        practice: { label: 'React autocomplete search bar', path: '/react/coding/react-autocomplete-search-starter' },
      },
      {
        id: 'pull-request-review',
        round: 'Super day',
        kind: 'Practical coding',
        question:
          'Spend about ten minutes reviewing a pull request and say what is wrong with it; the code held hardcoded credentials and poor variable names.',
        sources: [JPMORGAN_JP15],
      },
      {
        id: 'how-react-works-react-over-angular',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        question: 'How does React work, and why would a developer choose React over Angular?',
        sources: [JPMORGAN_JP7],
        practice: { label: 'What problem React solves', path: '/react/trivia/react-core-problem-and-non-goals' },
      },
      {
        id: 'promises-generators-currying',
        round: 'Security and framework rounds',
        kind: 'JavaScript',
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
        question: 'Questions on the JavaScript event loop and on React optimisation techniques.',
        promptNotShared: true,
        sources: [JPMORGAN_JP12],
        practice: { label: 'JavaScript event loop visualiser', path: '/javascript/trivia/js-event-loop' },
      },
      {
        id: 'var-let-const-scope-hooks',
        kind: 'JavaScript',
        question:
          'What is the difference between var, let and const? The list then moved on to scope, promises, useEffect and higher-order components.',
        sources: [JPMORGAN_J14_FULLSTACK_2025],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'context-then-hoc',
        kind: 'React concepts',
        question:
          'What is React context? An answer that mentioned higher-order components drew a follow-up on when a higher-order component would be used.',
        sources: [JPMORGAN_J3_FE_2022],
        practice: { label: 'Higher-order components in React', path: '/react/trivia/react-higher-order-components' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'benefits-of-reduce',
        kind: 'JavaScript',
        question: 'Explain the benefits of the array reduce method.',
        sources: [JPMORGAN_J3_FE_2022],
        practice: { label: 'map, filter and reduce', path: '/javascript/trivia/js-map-filter-reduce' },
      },
      {
        id: 'function-component-coding',
        round: 'Live coding',
        kind: 'React build',
        question: 'Coding on React function components, in a panel whose other questions followed the CV.',
        promptNotShared: true,
        sources: [JPMORGAN_JP6],
      },
      {
        id: 'count-weekdays-in-a-year',
        round: 'Live coding',
        kind: 'Algorithm',
        question: 'Count how often each weekday occurs in a given year, in Python.',
        sources: [JPMORGAN_JP8],
      },
      {
        id: 'what-is-cors',
        round: 'Frontend technical conversation',
        kind: 'Web fundamentals',
        question: 'What is CORS?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Handle CORS in a frontend app', path: '/javascript/trivia/js-secure-cors-handling' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'cookie-session-local-storage',
        round: 'Frontend technical conversation',
        kind: 'Web fundamentals',
        question: 'What is the difference between a cookie, session storage and local storage?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Cookie, sessionStorage and localStorage', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
        answerGuide: 'react-and-javascript-conversation-round',
      },
      {
        id: 'javascript-prototype',
        round: 'Frontend technical conversation',
        kind: 'JavaScript',
        question: 'What is a prototype in JavaScript?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Prototypal inheritance in JavaScript', path: '/javascript/trivia/js-prototypal-inheritance' },
      },
      {
        id: 'arrow-vs-normal-function',
        round: 'Frontend technical conversation',
        kind: 'JavaScript',
        question: 'What is the difference between an arrow function and a normal function?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Arrow functions versus regular functions', path: '/javascript/trivia/js-arrow-vs-regular-functions' },
      },
      {
        id: 'lru-cache',
        round: 'Frontend technical conversation',
        kind: 'Algorithm',
        question: 'How would you implement an LRU cache?',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Create an LRU cache', path: '/javascript/coding/js-create-lru-cache' },
      },
      {
        id: 'balanced-brackets',
        round: 'Frontend technical conversation',
        kind: 'Algorithm',
        question: 'Check whether the brackets in a string are balanced.',
        sources: [JPMORGAN_JP14],
        practice: { label: 'Valid parentheses', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'delete-linked-list-node',
        round: 'Frontend technical conversation',
        kind: 'Algorithm',
        question: 'Delete a node from a linked list.',
        sources: [JPMORGAN_JP14],
      },
      {
        id: 'react-redux-typescript-experience',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
        question:
          'How much have you used React, what do you know about Redux, what is going on in React lately, and which new TypeScript features do you like?',
        sources: [JPMORGAN_JP5],
        practice: { label: 'When a React app needs Redux', path: '/react/trivia/react-state-management-redux' },
      },
      {
        id: 'stateless-component-lifecycle',
        round: 'Frontend technical conversation',
        kind: 'React concepts',
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
            practice: { label: 'DSA for frontend loops', path: '/guides/interview-blueprint/dsa-for-fe' },
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
        question: 'What are CSRF and XSS, how does each happen, and how do you mitigate them?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'pipeline-then-async-limit',
        round: 'Frontend Platform interview',
        kind: 'JavaScript',
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
        question: 'Explain SSG, SSR, CSR and ISR.',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'SSR and hydration in React', path: '/react/trivia/react-ssr-hydration' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'cdn-caching-and-updates',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        question: 'How does a CDN work, what would you cache in it, and how do updates reach the cached copies?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'CDN and HTTP caching for frontend delivery', path: '/javascript/trivia/content-delivery-caching-strategies-streaming' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'react-state-and-filter-state',
        round: 'Frontend Platform interview',
        kind: 'React concepts',
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
        question: 'Which techniques make a page land faster, and how do you measure a page\'s performance with Core Web Vitals?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'hotel-booking-page-entities',
        round: 'Frontend Platform interview',
        kind: 'Frontend system design',
        question: 'List the core entities of a hotel booking page.',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'The web-fundamentals hour on a hotel booking page', path: '/javascript/trivia/js-web-fundamentals-hour-hotel-booking' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'search-to-pay-funnel',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        question: 'How would you track how many users go from search to view to booking to payment, and how many remain at each step?',
        sources: [AGODA_A1_BANGKOK_2026],
        practice: { label: 'The web-fundamentals hour on a hotel booking page', path: '/javascript/trivia/js-web-fundamentals-hour-hotel-booking' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'testing-strategies-and-outside-failures',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
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
        question: 'How would you improve a page\'s Lighthouse scores, covering LCP, FID, TTI and TBT?',
        sources: [AGODA_A5_FULL_STACK_2025],
        practice: { label: 'Optimise a page\'s load time', path: '/javascript/trivia/web-performance-optimize-load-time' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'session-management-and-promises',
        round: 'Frontend Platform interview',
        kind: 'JavaScript',
        question: 'JavaScript questions on session management and promises, with scenario-based follow-ups.',
        promptNotShared: true,
        sources: [AGODA_A5_FULL_STACK_2025],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'react-unit-integration-e2e',
        round: 'Frontend Platform interview',
        kind: 'Web fundamentals',
        question: 'Compare unit, integration and end-to-end testing for a React app.',
        sources: [AGODA_A5_FULL_STACK_2025],
        practice: { label: 'Testing strategy: edge cases and boundaries', path: '/javascript/trivia/js-testing-edge-cases-strategy' },
      },
      {
        id: 'rank-transform-array',
        round: 'Coding interview',
        kind: 'Algorithm',
        question: 'Replace each number in an array with its rank among the distinct values (LeetCode 1331, Rank Transform of an Array).',
        sources: [AGODA_A1_BANGKOK_2026],
      },
      {
        id: 'climbing-stairs-three-steps',
        round: 'Coding interview',
        kind: 'Algorithm',
        question: 'Count the ways to climb n stairs taking 1, 2 or 3 steps at a time, a variant of LeetCode 70, Climbing Stairs.',
        sources: [AGODA_A1_BANGKOK_2026],
      },
      {
        id: 'coding-hour-tests-and-pr-checklist',
        round: 'Coding interview',
        kind: 'Practical coding',
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
        question:
          'Compute the molecular weight of a chemical formula that may contain nested parentheses and multipliers, where C is 12, H is 1 and O is 8.',
        sources: [AGODA_A12_BANGALORE_2025],
        practice: { label: 'Valid parentheses, a stack warm-up', path: '/javascript/coding/js-valid-parentheses' },
      },
      {
        id: 'js-basics-and-promises',
        round: 'Coding interview',
        kind: 'JavaScript',
        question: 'JavaScript basics and promises, asked in a phone screen of an hour or more.',
        promptNotShared: true,
        sources: [AGODA_A12_BANGALORE_2025],
        practice: { label: 'Promise chains and async/await', path: '/javascript/trivia/js-promises-async-await' },
      },
      {
        id: 'sliding-window-problem',
        round: 'Coding interview',
        kind: 'Algorithm',
        question: 'A sliding-window problem in the same phone screen.',
        promptNotShared: true,
        sources: [AGODA_A12_BANGALORE_2025],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
      },
      {
        id: 'sort-array-in-place',
        round: 'Coding interview',
        kind: 'Algorithm',
        question: 'Sort an array in place.',
        sources: [AGODA_T1_SENIOR_FE_2024],
      },
      {
        id: 'doctor-appointment-booking',
        round: 'Architecture interview',
        kind: 'Frontend system design',
        question: 'Design a doctor appointment booking application in the high-level design round.',
        sources: [AGODA_A4_STAFF_2025],
        practice: { label: 'Design a car rental booking frontend', path: '/system-design/car-rental-booking-frontend' },
      },
      {
        id: 'cdn-and-cdn-services',
        round: 'Architecture interview',
        kind: 'Web fundamentals',
        question: 'What is a CDN, and which CDN services can you name?',
        sources: [AGODA_A33_STAFF_2025],
        practice: { label: 'CDN and HTTP caching for frontend delivery', path: '/javascript/trivia/content-delivery-caching-strategies-streaming' },
        answerGuide: 'web-fundamentals-platform-hour',
      },
      {
        id: 'hackerrank-rest-api-question',
        round: 'HackerRank assessment',
        kind: 'Practical coding',
        question: 'Basic coding questions in the HackerRank test, one of them using a REST API.',
        promptNotShared: true,
        sources: [AGODA_T6_FULL_STACK_2024],
        practice: { label: 'Fetch JSON with a timeout and abort', path: '/javascript/coding/js-fetch-json-timeout' },
      },
      {
        id: 'stock-dashboard-take-home',
        round: 'Online assessment or take-home',
        kind: 'React build',
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
        question: 'Find the longest substring without repeating characters.',
        sources: [AGODA_A2_GURGAON_2025],
        practice: { label: 'Longest substring without repeating characters', path: '/javascript/coding/js-longest-substring-without-repeating' },
      },
      {
        id: 'debounce-utility',
        round: 'Coding round',
        kind: 'JavaScript',
        question: 'Write a debounced utility function in JavaScript.',
        sources: [AGODA_A2_GURGAON_2025],
        practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
      },
      {
        id: 'array-and-hash-map-problems',
        round: 'Coding round',
        kind: 'Algorithm',
        question: 'A straightforward array question and a medium hash-map problem.',
        promptNotShared: true,
        sources: [AGODA_A13_SDE2_2024],
      },
      {
        id: 'travel-booking-frontend-architecture',
        round: 'Platform or architecture round',
        kind: 'Frontend system design',
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
        question: 'Questions on JavaScript hoisting, how classes behave, and SSR versus CSR.',
        promptNotShared: true,
        sources: [AGODA_A7_GURGAON_2025],
        practice: { label: 'Hoisting and the temporal dead zone', path: '/javascript/trivia/js-hoisting' },
      },
      {
        id: 'atomic-design-and-testing',
        round: 'Platform or architecture round',
        kind: 'Web fundamentals',
        question: 'Questions on structuring a front end with atomic design, and on testing and debugging practice.',
        promptNotShared: true,
        sources: [AGODA_A7_GURGAON_2025],
      },
      {
        id: 'add-functionality-to-react-page',
        kind: 'React build',
        question: 'Add functionality to an existing React web page in an online session, with Google allowed and the interviewer helping.',
        promptNotShared: true,
        sources: [AGODA_T5_FULL_STACK_2025],
      },
      {
        id: 'react-usecontext-and-hooks',
        kind: 'React concepts',
        question: 'What is useContext in React, and how would you use each of the React hooks?',
        sources: [AGODA_A32_SWE_2025],
        practice: { label: 'Which React hooks you have used, and when', path: '/react/trivia/react-hooks-youve-used' },
      },
      {
        id: 'website-load-steps',
        kind: 'Web fundamentals',
        question: 'What does your device go through from requesting a website until the page has loaded?',
        sources: [AGODA_A32_SWE_2025],
        practice: { label: 'How the browser parses and renders HTML', path: '/html/trivia/html-parsing-rendering' },
      },
      {
        id: 'react-app-performance',
        kind: 'React concepts',
        question: 'How would you improve the performance of a React application?',
        sources: [AGODA_A32_SWE_2025],
        practice: { label: 'Why a component re-renders when its props did not change', path: '/react/trivia/react-rerender-decision-and-render' },
      },
      {
        id: 'flashcard-after-explaining-a-tool',
        kind: 'UI build',
        question: 'Explain a tool from your own project as simply as you would to a child, then machine-code a flashcard.',
        sources: [AGODA_A6_FULL_STACK_2024],
      },
      {
        id: 'planes-stopped-before-landing',
        kind: 'Algorithm',
        question: 'Planes descend at given speeds and you can shoot down one per second: find the most planes you can stop from landing.',
        sources: [AGODA_A6_FULL_STACK_2024],
      },
      {
        id: 'grid-paths-with-obstacles',
        kind: 'Algorithm',
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
      'Shopee\'s How we hire page lists five steps (Apply, Getting to Know You, Putting Your Skills to the Test, Meet the Hiring Manager, Preparing to Join Us) and says the number of rounds varies depending on the role and seniority. Public frontend accounts describe three shapes: a 2025 Ho Chi Minh City loop with an HR call, a two-hour frontend round, a CS-fundamentals round, a behavioural interview a week later and a final conversation; Singapore campus loops from 2020 to 2022 with an online assessment, video rounds of 60 to 90 minutes and an HR call; and mainland-China campus and social-hire loops run in Chinese, with a written test for some campus roles, two technical interviews per department and an HR conversation.',
    caveat:
      'The Singapore experienced-hire loop that English searches point at (an HR call, a coding test on HTML, CSS and JavaScript, two technical rounds heavy on verbal JavaScript, an engineering-manager round and an offer in about two weeks) rests on search snippets only and gets no table. Taipei has two accounts and no table: a 2021 frontend loop with a 30-minute HR call, a 90-minute junior-level written test and same-day panels with a product manager and a tech lead, and a 2023 senior software-engineer loop of HR, a manager round on technology, a peer round and a senior-manager chat. Most full-text accounts are from 2020 to 2022 and written in Chinese, and on 2026-10-21 the Shopee job board listed no frontend-titled opening in Singapore or South-East Asia.',
    checkedAt: '2026-10-21',
    variants: [
      {
        title: 'Front-end engineers, Ho Chi Minh City, 2025',
        note: 'One full account (Viblo, February 2025, an offer) carries this table; the stage order rests on it alone.',
        stages: [
          {
            stage: 'HR call',
            format: 'Personal details, expected salary and whether the candidate is willing to move to Saigon.',
            appliesTo: 'All candidates',
            sources: [SHOPEE_S1_HCMC_2025],
          },
          {
            stage: 'Frontend technical round',
            format:
              'About two hours in clear parts: CSS (the position values), JavaScript (the event loop, promises, async/await, a Promise written without using Promise), a React build (a recursive multi-level hover menu) and an algorithm on mapping characters between two data sets.',
            appliesTo: SHOPEE_FE_ROLE,
            sources: [SHOPEE_S1_HCMC_2025],
            practice: { label: 'Create a deferred promise', path: '/javascript/coding/js-create-deferred-promise' },
          },
          {
            stage: 'CS-fundamentals round',
            format:
              'Design a system based on the candidate\'s current work, then HTTP, TCP/UDP, WebSocket, how an API gateway and a load balancer work, and encryption, hashing and encoding.',
            appliesTo: SHOPEE_FE_ROLE,
            sources: [SHOPEE_S1_HCMC_2025],
            practice: { label: 'HTTP caching basics', path: '/javascript/trivia/http-caching-basics' },
          },
          {
            stage: 'Behavioural interview',
            format: 'A week later: how the candidate had worked with a colleague who held a different view, and how it was resolved.',
            appliesTo: 'All candidates',
            sources: [SHOPEE_S1_HCMC_2025],
            practice: { label: 'Behavioural stories', path: '/guides/behavioral/stories' },
          },
          {
            stage: 'Final conversation and offer',
            format: 'Future direction and expectations at Shopee compared with the previous job; the offer came a few days later.',
            appliesTo: 'Candidates who pass',
            sources: [SHOPEE_S1_HCMC_2025],
          },
        ],
      },
      {
        title: 'Fresh graduates, Singapore, 2020 to 2022',
        note:
          'One frontend first round (Nowcoder, September 2020) plus three campus loops in other tracks for the assessment and round shape. Singapore experienced hires get no table.',
        stages: [
          {
            stage: 'Online assessment',
            format:
              'A 70-minute test in the 2022 account: ten multiple-choice questions on operating systems and networking plus two array coding problems; twenty-odd multiple-choice questions plus one LeetCode problem in the 2021 account.',
            appliesTo: 'Campus candidates; backend and platform accounts',
            sources: [SHOPEE_S37_MEDIUM_2022, SHOPEE_S39_PTT_2021],
          },
          {
            stage: 'Technical video rounds',
            format:
              'One to three rounds of 60 to 90 minutes on a shared editor, each with one or two problems, CS fundamentals and a design-concept question; the frontend first round had a string-compression algorithm plus JavaScript versus CSS animation, specificity, React keys, HTTPS and man-in-the-middle attacks, and session versus cookie versus token.',
            appliesTo: 'All campus candidates; frontend content from the 2020 first round',
            sources: [SHOPEE_S6_SG_CAMPUS_2020, SHOPEE_S36_MEDIUM_2020, SHOPEE_S37_MEDIUM_2022, SHOPEE_S39_PTT_2021],
            practice: { label: 'Cascade, specificity and !important', path: '/css/trivia/css-cascade-order' },
          },
          {
            stage: 'HR call with a verbal offer',
            format:
              'A verbal offer from HR about five weeks after applying, with cost-of-living and relocation material for overseas hires in the 2020 account; one 2022 loop ended in a rejection sixteen days after applying.',
            appliesTo: 'Candidates who pass',
            sources: [SHOPEE_S36_MEDIUM_2020, SHOPEE_S37_MEDIUM_2022],
          },
        ],
      },
      {
        title: 'Campus and social hires, mainland China, in Chinese, 2019 to 2025',
        note:
          'All loops in Chinese. The official line comes from a reprinted 2027 campus posting; the accounts are campus loops from 2019 to 2021 and social-hire loops from 2020 and 2022, each social hire re-interviewed by a second department.',
        stages: [
          {
            stage: 'Application or referral, then a written test',
            format:
              'The campus posting lists 网申/内推 (online application or referral), then 笔试 (a written test) that some roles skip (部分岗位不设笔试), before two to three technical rounds.',
            appliesTo: 'Campus candidates',
            sources: [SHOPEE_CHINA_CAMPUS_REPRINT],
          },
          {
            stage: 'First technical interview',
            format:
              'JavaScript, CSS, HTTP and framework basics plus one or two small algorithms: event-loop and promise output questions, handwritten new, flatten and deep clone, XSS and CSRF, caching headers, CSS centring, binary search, set intersection or quicksort; the 2019 account says the interviewer guides the candidate\'s thinking.',
            appliesTo: 'Front-end engineers, campus and social hires',
            sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_S7_CAMPUS_2020, SHOPEE_S8_CAMPUS_2020, SHOPEE_S9_CAMPUS_2021, SHOPEE_S10_CAMPUS_2019],
            practice: { label: 'Implement the new operator', path: '/javascript/coding/js-implement-new' },
          },
          {
            stage: 'Second technical interview',
            format:
              'React internals and diffing, HTTP/2 and status codes, webpack performance and async chunks, CDN questions, scenario questions such as a user reporting a button that cannot be clicked, project depth, and a second coding task such as a function cache; the 2019 account had three questions only.',
            appliesTo: SHOPEE_FE_ROLE,
            sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_S7_CAMPUS_2020, SHOPEE_S10_CAMPUS_2019],
            practice: { label: 'Memoization', path: '/javascript/coding/js-memoize-function' },
          },
          {
            stage: 'HR interview and offer',
            format:
              'The posting lists an HR conversation (HR沟通) before the offer. In the social-hire accounts the loop runs per department, sometimes both technical rounds and HR on one day; a rejection after the first round can come back with feedback such as 算法有待加强 (algorithms need strengthening), and a second department can re-interview the same candidate.',
            appliesTo: 'All candidates',
            sources: [SHOPEE_S3_JUEJIN_2020, SHOPEE_S4_NOWCODER_2022, SHOPEE_CHINA_CAMPUS_REPRINT],
          },
        ],
      },
    ],
  },
  openai: {
    summary:
      'OpenAI\'s interview guide describes résumé review, introductory calls, team-specific assessments and 4 to 6 hours of final interviews. Frontend accounts from 2023 to 2026 confirm the recruiter call and a two-part technical screen; no frontend account read for this page describes the final loop.',
    caveat:
      'Thin evidence: one senior frontend account, one 2023 software engineer onsite, one commenter and three Blind posts written before the interview. Whether algorithm problems appear is not settled by the accounts read, and the guide says formats vary by team.',
    checkedAt: '2026-10-22',
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
              'A recruiting coordinator schedules a conversation with the hiring manager or recruiter about work experience, motivations and goals. One 2024 account ended after this video screening.',
            appliesTo: 'All candidates',
            sources: [OPENAI_INTERVIEW_GUIDE, OPENAI_OA1_SENIOR_FE_2024, OPENAI_OA2_FE_2024, OPENAI_OA6_PLAN_2026, OPENAI_OA7_FE_2024],
          },
          {
            stage: 'Technical screen',
            format:
              'Two back-to-back parts in one 2024 senior account: refactoring existing code, then a systems design question, with neither interviewer a frontend engineer. Another 2024 candidate fixed a piece of JavaScript; a 2023 commenter had a React exercise in CoderPad; a 2025 plan lists frontend coding, then system design or architecture.',
            appliesTo: OPENAI_ROLE,
            sources: [OPENAI_OA1_SENIOR_FE_2024, OPENAI_OA2_FE_2024, OPENAI_OA3_COMMENT_2023, OPENAI_OA5_PLAN_2025],
            practice: { label: 'AI chat composer and streaming turn', path: '/system-design/ai-chat-textarea-design' },
          },
          {
            stage: 'Agentic coding option',
            format:
              'In October 2026 one senior candidate could choose between a 60-minute JavaScript coding interview and a 60-minute agentic coding interview in a Python codebase with AI tools. The guide says some formats allow AI tools and others assess independent problem solving.',
            appliesTo: 'One 2026 plan',
            sources: [OPENAI_OA6_PLAN_2026, OPENAI_INTERVIEW_GUIDE],
          },
          {
            stage: 'Final interviews',
            format:
              '4 to 6 hours with 4 to 6 people over 1 to 2 days, virtual by default with an onsite option in San Francisco, per the guide. The one onsite account, a 2023 software engineer loop, had a project presentation, a design round mixing backend and frontend, and frontend coding.',
            appliesTo: 'All candidates',
            sources: [OPENAI_INTERVIEW_GUIDE, OPENAI_OA4_SWE_2023],
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
  },
  netflix: {
    summary:
      'Netflix publishes a process only for new graduates and interns: a take-home assessment, then two or about two to three rounds. Accounts for experienced frontend and UI roles from 2020 to 2025 describe recruiter and hiring-manager conversations, a live JavaScript screen or a take-home, and an onsite of about four interviews; Netflix-tagged commenters say each team runs its own loop.',
    caveat:
      'Thin evidence: two complete 2020 loops, one 2025 screen, one recruiter plan and commenters. The order differs between accounts, some loops use a take-home and others a live screen, and a 2024 senior account counted eight stages without naming them.',
    checkedAt: '2026-10-22',
    variants: [
      {
        title: 'Experienced frontend and UI engineers',
        note: 'Netflix-tagged commenters describe a process that is not centralised and differs by team, so each row says which account it comes from.',
        stages: [
          {
            stage: 'Recruiter conversation',
            format:
              'A long conversation in the 2020 account. A 2024 commenter was rejected after a recruiter screen that included a few light technical questions.',
            appliesTo: 'All candidates',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF4_COMMENT_2024, NETFLIX_NF5_PLAN_2024, NETFLIX_NF6_FE_2022],
          },
          {
            stage: 'Hiring-manager conversation',
            format:
              'A long behavioural interview with a UI manager before the take-home in the 2020 account; a Netflix-tagged commenter in 2024 expects a manager screen before any technical round. A 2021 senior account describes only a confrontational talk with the would-be manager.',
            appliesTo: 'Most loops',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF4_COMMENT_2024, NETFLIX_NF6_FE_2022, NETFLIX_NF8_SENIOR_FE_2021],
            practice: { label: 'Netflix culture questions and story drill', path: '/companies/netflix/preview', fragment: 'netflix-round-culture', drill: true },
          },
          {
            stage: 'Technical screen',
            format:
              'One hour with three small JavaScript tasks in a 2025 Poland screen for an L4 or L5 frontend role: flatten a nested object, write expect and toBe style matchers, and combine two async calls so that one failure still shows the other result. A 2024 recruiter plan also opens with a technical screen.',
            appliesTo: 'Loops without a take-home',
            sources: [NETFLIX_NF3_SCREEN_2025, NETFLIX_NF5_PLAN_2024, NETFLIX_NF6_FE_2022],
            practice: { label: 'Promise.all vs allSettled', path: '/javascript/trivia/js-promise-combinators-all-allsettled-race-any' },
          },
          {
            stage: 'Take-home',
            format: 'A build exercise reviewed later in the loop, in the 2020 account and in a loop from before 2022 that ended with a culture conversation.',
            appliesTo: 'Some loops',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF6_FE_2022],
          },
          {
            stage: 'Onsite',
            format:
              'One coding interview, a take-home review and two behavioural interviews in 2020, with no LeetCode-type questions; another 2020 account had half a day of technical interviews and half a day of behavioural ones with senior leadership and product. A 2024 recruiter plan for an L4 Web UI role lists two technical and two behavioural rounds, possibly algorithms and system design.',
            appliesTo: 'All candidates',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF9_SENIOR_UI_2020, NETFLIX_NF5_PLAN_2024],
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
        question:
          'Build a small React component or app around an ElevenLabs voice service with an engineer; in the 2026 account the service was a fake known only from its types, and the code was never run.',
        sources: [ELEVENLABS_EL8_SENIOR_2026, ELEVENLABS_EL9_SENIOR_2025, ELEVENLABS_EL3_2024],
      },
      {
        id: 'assessment-react-and-algorithm-tasks',
        round: 'Coding assessment',
        kind: 'React and algorithms',
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
        question: 'Fix a bug in a React component, in a CoderPad round that also held LeetCode problems.',
        promptNotShared: true,
        sources: [ELEVENLABS_EL3_2024],
        answerGuide: 'fix-a-practical-react-problem',
      },
      {
        id: 'coderpad-finish-react-component',
        round: 'Coding assessment',
        kind: 'React build',
        question: 'Finish the implementation of a partly written React component, in the same CoderPad round.',
        promptNotShared: true,
        sources: [ELEVENLABS_EL3_2024],
      },
      {
        id: 'live-practical-fix',
        round: 'Live technical round',
        kind: 'Practical coding',
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
        question:
          'For an audio transcription studio used by dubbing teams, propose features, prioritise them and turn them into a roadmap; the follow-ups covered the task list view, the transcription view, authentication and roles.',
        sources: [ELEVENLABS_EL2_FE_2025, ELEVENLABS_BANK],
      },
      {
        id: 'dubbing-re-review-status',
        round: 'Live technical round',
        kind: 'Practical coding',
        question:
          'Write functions for a dubbing workflow kept in a spreadsheet that apply edits and approvals, and mark which lines, and the files above them, need review again after a line is re-recorded.',
        sources: [ELEVENLABS_EC3_2025, ELEVENLABS_BANK],
      },
      {
        id: 'folder-permissions',
        round: 'Live technical round',
        kind: 'Practical coding',
        question:
          'Folders allow or deny users and groups, permissions are inherited unless a folder overrides them, and each change is timestamped: check whether a user can open a file at a given time.',
        sources: [ELEVENLABS_EC5_FDE_2025, ELEVENLABS_EL22_2024, ELEVENLABS_EL23_2024, ELEVENLABS_BANK],
      },
      {
        id: 'adapt-product-key-account',
        round: 'Product or design round',
        kind: 'Product design',
        question: 'Adapt an ElevenLabs product so that a particular kind of key account can use it.',
        sources: [ELEVENLABS_EL20_GROWTH_2026],
      },
      {
        id: 'valid-sudoku',
        round: 'Coding assessment',
        kind: 'Algorithm',
        question: 'Check whether a partly filled Sudoku board is valid (LeetCode\'s Valid Sudoku).',
        sources: [ELEVENLABS_EL3_2024],
      },
      {
        id: 'next-larger-distinct-digits',
        round: 'Coding assessment',
        kind: 'Algorithm',
        question: 'Find the next number larger than n that shares no digit with n.',
        sources: [ELEVENLABS_EC6_2026],
      },
      {
        id: 'merge-equal-level-stones',
        round: 'Coding assessment',
        kind: 'Algorithm',
        question: 'Repeatedly merge stones of equal level and return the fewest stones that can remain.',
        sources: [ELEVENLABS_EC6_2026],
      },
      {
        id: 'shirt-colours-no-repeat',
        round: 'Coding assessment',
        kind: 'Algorithm',
        question: 'Choose the lowest-cost sequence of shirt colours with no colour used twice in a row.',
        sources: [ELEVENLABS_EC6_2026],
      },
      {
        id: 'map-queue-bfs-problems',
        round: 'Coding assessment',
        kind: 'Algorithm',
        question: 'Three assessment problems on maps, queues and breadth-first traversal, the first two easy and the last medium to hard.',
        promptNotShared: true,
        sources: [ELEVENLABS_EC4_2026],
      },
      {
        id: 'merge-sorted-drop-duplicates',
        kind: 'Algorithm',
        question: 'Merge sorted lists into one and drop the duplicates.',
        sources: [ELEVENLABS_EL16_2026],
        practice: { label: 'Merge two sorted arrays', path: '/javascript/coding/js-merge-sorted-arrays' },
      },
      {
        id: 'reverse-linked-list',
        kind: 'Algorithm',
        question: 'Reverse a linked list.',
        sources: [ELEVENLABS_BANK],
      },
      {
        id: 'longest-substring-no-repeats',
        kind: 'Algorithm',
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
        question: 'Design an AI chat application, frontend focused.',
        sources: [WAYMO_WM1_SENIOR_FE_2026],
        practice: { label: 'Design an AI chat composer and streaming turn', path: '/system-design/ai-chat-textarea-design' },
        answerGuide: 'ai-chat-frontend-design',
      },
      {
        id: 'debounced-autocomplete',
        round: 'Virtual onsite',
        kind: 'UI build',
        question: 'Build an autocomplete search bar that debounces what the user types.',
        sources: [WAYMO_WM1_SENIOR_FE_2026],
        practice: { label: 'React autocomplete starter', path: '/react/coding/react-autocomplete-search-starter' },
        answerGuide: 'debounced-autocomplete',
      },
      {
        id: 'generic-tree-viewer',
        round: 'JavaScript and UI round',
        kind: 'UI build',
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
        question: 'Write a timer class in JavaScript, then build a React app around it.',
        sources: [ANDURIL_AN11_FE_FOCUS_2024],
        practice: { label: 'React countdown timer with start, pause and reset', path: '/react/coding/react-countdown-timer' },
        answerGuide: 'timer-class-then-react-app',
      },
      {
        id: 'autocomplete-search-react',
        kind: 'React build',
        question: 'Design an autocomplete search feature in React.',
        sources: [ANDURIL_AN5_TIP_2024],
        practice: { label: 'React autocomplete starter', path: '/react/coding/react-autocomplete-search-starter' },
        answerGuide: 'autocomplete-search-react',
      },
      {
        id: 'lodash-style-utilities',
        kind: 'JavaScript',
        question: 'Lodash-style utility questions: write your own flatten, map and reduce.',
        sources: [ANDURIL_AN4_CLEARED_2024],
        practice: { label: 'Flatten one level', path: '/javascript/coding/js-flatten-once' },
        answerGuide: 'lodash-style-helpers',
      },
      {
        id: 'drone-zone-sensor-class',
        round: 'Technical screen',
        kind: 'Practical coding',
        question:
          'A drone senses objects in a zone and reports what it finds: write a class with two methods that retrieve and send data to an external source.',
        sources: [ANDURIL_AN30_SWE_2024],
      },
      {
        id: 'largest-sensor-distance',
        round: 'Technical screen',
        kind: 'Algorithm',
        question:
          'Given two integer arrays, take each number in the first array and its closest number in the second; their difference is a sensor distance. Return the largest sensor distance.',
        sources: [ANDURIL_AN34_SWE_2023],
      },
      {
        id: 'course-schedule-topological-sort',
        kind: 'Algorithm',
        question: 'Decide whether all the courses can be finished given their prerequisites, a topological sort (LeetCode\'s Course Schedule).',
        sources: [ANDURIL_AN31_SWE_2025],
      },
      {
        id: 'medium-dynamic-programming',
        kind: 'Algorithm',
        question: 'A dynamic programming problem of LeetCode medium difficulty, in an interview the candidate called friendly.',
        promptNotShared: true,
        sources: [ANDURIL_AN35_DP_2022],
      },
      {
        id: 'bfs-dfs-with-follow-ups',
        kind: 'Algorithm',
        question: 'Breadth-first and depth-first search questions of LeetCode medium difficulty, each pushed further by harder follow-ups.',
        promptNotShared: true,
        sources: [ANDURIL_AN35_BFS_2023],
      },
      {
        id: 'hard-graph-problems',
        kind: 'Algorithm',
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
      'GitLab publishes one frontend loop for every level: a short written assessment, a recruiter screening call, a merge request you review on your own time and then improve in a 90-minute technical interview, a behavioral interview and an interview with a Director of Engineering. Public accounts from 2018 to 2025 describe the same order.',
    caveat:
      'Stages and durations come from the GitLab handbook; exercise details come from accounts dated 2018 to 2025.',
    checkedAt: '2026-10-23',
    variants: [
      {
        title: 'Frontend engineers, all levels',
        stages: [
          {
            stage: 'Written assessment',
            format:
              'A short written assessment after applying. Older accounts describe open-ended technical questions answered in writing, such as what happens in the browser while a page loads.',
            appliesTo: 'Selected applicants',
            sources: [GITLAB_JOB_FAMILY, GITLAB_GL27_FE_2019, GITLAB_GL35_FE_2018, GITLAB_GL24_FE_2019],
            practice: { label: 'How browsers parse and render', path: '/html/trivia/html-parsing-rendering' },
          },
          {
            stage: 'Recruiter screening call',
            format: '30 to 40 minutes on video: background, motivation, experience with each listed skill, location, notice period and salary range.',
            appliesTo: 'All candidates',
            sources: [GITLAB_JOB_FAMILY, GITLAB_CANDIDATE_FAQ, GITLAB_GL4_FE_2024, GITLAB_GL1_FE_2025],
          },
          {
            stage: 'Merge request review',
            format:
              'A self-contained merge request on a small application arrives at least 72 hours before the call; up to an hour of review, finished a day ahead. Reports name Vue, HTML, CSS, Haml and Jest unit tests.',
            appliesTo: 'Frontend engineers',
            sources: [GITLAB_TECHNICAL_INTERVIEW, GITLAB_GL3_FE_2024, GITLAB_GL4_FE_2024, GITLAB_GL10_FE_2021, GITLAB_GL16_FE_2020],
            practice: { label: 'Review a Vue merge request', path: '/vue/coding/vue-issue-list-merge-request-review' },
          },
          {
            stage: 'Technical interview',
            format:
              '90 minutes on video with screen sharing: walk through your review, then write code to improve the merge request, with a frontend engineer or a frontend engineering manager.',
            appliesTo: 'Frontend engineers',
            sources: [GITLAB_JOB_FAMILY, GITLAB_TECHNICAL_INTERVIEW, GITLAB_GL4_FE_2024, GITLAB_GL21_FE_2019, GITLAB_GL28_FE_2019],
            practice: { label: 'Build a spy function', path: '/javascript/coding/js-create-spy-function' },
          },
          {
            stage: 'Behavioral interview',
            format: '45 minutes with an engineering manager: STAR questions, sometimes with high-level technical questions.',
            appliesTo: 'All candidates',
            sources: [GITLAB_JOB_FAMILY, GITLAB_GL20_FE_2019, GITLAB_GL21_FE_2019, GITLAB_GL28_FE_2019],
          },
          {
            stage: 'Director interview',
            format: '60 minutes with a Director of Engineering on past experience and values, with a few technical questions in some accounts.',
            appliesTo: 'All candidates',
            sources: [GITLAB_JOB_FAMILY, GITLAB_GL20_FE_2019, GITLAB_GL21_FE_2019],
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
        note: 'Full-stack candidates get two technical interviews, each on its own merge request.',
        stages: [
          {
            stage: 'Recruiter screening call',
            format: 'About 30 minutes on motivation, experience with Ruby on Rails and Vue, and compensation.',
            appliesTo: 'All candidates',
            sources: [GITLAB_GL18_FULLSTACK_2020, GITLAB_GL7_FULLSTACK_2022, GITLAB_GL44_FULLSTACK_2025],
          },
          {
            stage: 'Backend technical interview',
            format: '90 minutes on a merge request reviewed before the call and improved during it; Ruby, Rails, testing and database topics.',
            appliesTo: 'Full-stack engineers',
            sources: [GITLAB_GL7_FULLSTACK_2022, GITLAB_GL44_FULLSTACK_2025],
          },
          {
            stage: 'Frontend technical interview',
            format: '90 minutes on a second merge request that needs Vue, HTML and CSS changes; JavaScript, Vue.js and testing.',
            appliesTo: 'Full-stack engineers',
            sources: [GITLAB_GL7_FULLSTACK_2022, GITLAB_GL44_FULLSTACK_2025, GITLAB_GL18_FULLSTACK_2020],
          },
          {
            stage: 'Manager and director interviews',
            format: 'About an hour each on behavioral and situational questions, values and how you work.',
            appliesTo: 'All candidates',
            sources: [GITLAB_GL18_FULLSTACK_2020, GITLAB_GL44_FULLSTACK_2025],
          },
        ],
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
        question: 'Design a credit card account.',
        promptNotShared: true,
        sources: [CAPITALONE_CO4_SENIOR_2024],
      },
      {
        id: 'spa-structure-from-requirements',
        round: 'Power Day: frontend design',
        kind: 'Frontend system design',
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
        question:
          'Design the web app of an electric-meter system, where customers and admins see their utility usage; the account\'s tip was to give the UI and UX design real attention.',
        sources: [CAPITALONE_CO52_2021],
      },
      {
        id: 'spa-build-pair-programming',
        round: 'Power Day: frontend technical',
        kind: 'UI build',
        question: 'Build a single-page application with the interviewer, in a round that ran more like pair programming than a coding test.',
        promptNotShared: true,
        sources: [CAPITALONE_CO1_LEAD_2024],
        answerGuide: 'single-page-app-from-requirements',
      },
      {
        id: 'react-project-components',
        round: 'Power Day: frontend technical',
        kind: 'React build',
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
        question: 'Wire validation into an existing Angular form so that the right rules fire on its fields.',
        sources: [CAPITALONE_CO5_SENIOR_2023],
        practice: { label: 'Form validation with required fields', path: '/html/coding/html-forms-validation-required' },
        answerGuide: 'angular-form-validation',
      },
      {
        id: 'angular-form-message-list',
        round: 'Power Day: frontend technical',
        kind: 'UI build',
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
        question: 'Write an algorithm that finds all the permutations of a number.',
        sources: [CAPITALONE_CO12_SENIOR_2020],
      },
      {
        id: 'intern-budgeting-bug',
        round: 'Power Day: case',
        kind: 'Practical coding',
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
        question:
          'Read badly written code, say what it does, then refactor or improve it, weighing the designs and trade-offs you propose.',
        promptNotShared: true,
        sources: [CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO7_LEAD_2022, CAPITALONE_CO30_LEAD_2023],
        practice: { label: 'Stop a helper mutating its input', path: '/javascript/debug/js-debug-mutating-input' },
        answerGuide: 'read-explain-refactor-code',
      },
      {
        id: 'banking-chatbot-case',
        round: 'Power Day: case',
        kind: 'Product design',
        question:
          'A case on a bank\'s chatbot: talk through what it brings customers and how they would use it. In one 2023 loop the case went on to code read against a table of data, then improvements to that code.',
        sources: [CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO59_LEAD_2023, CAPITALONE_CO60_SENIOR_2024, CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'ai-feature-case',
        round: 'Power Day: case',
        kind: 'Practical coding',
        question: 'A case about an AI feature, then a code review in which you dry-run the code with sample input, then a small change to it.',
        promptNotShared: true,
        sources: [CAPITALONE_CO32_SENIOR_LEAD_2026],
      },
      {
        id: 'virtual-card-transaction-validation',
        round: 'Power Day: case',
        kind: 'Practical coding',
        question: 'A code-based case on a virtual credit card network: check whether its cards and transactions are valid.',
        sources: [CAPITALONE_CO16_FULLSTACK_2025, CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'ec2-cost-table-debug',
        round: 'Power Day: case',
        kind: 'Practical coding',
        question: 'Analyse a table of EC2 instances priced by CPU and location, then debug a method that sums their cost.',
        sources: [CAPITALONE_CO34_COMMENTS_2026],
        practice: { label: 'Find the bug in an intern\'s budget summary', path: '/javascript/debug/js-debug-intern-budget-summary' },
        answerGuide: 'power-day-case-budgeting-bug',
      },
      {
        id: 'testing-and-failing-script',
        round: 'Power Day: case',
        kind: 'Practical coding',
        question: 'Talk about testing and when to use it, then fix a script that throws an error, following the business rules you are given.',
        sources: [CAPITALONE_CO53_SENIOR_2024],
      },
      {
        id: 'boolean-if-else-method',
        round: 'Power Day: case',
        kind: 'Practical coding',
        question: 'Work through a method that takes three boolean values and runs them through a long chain of if-else statements.',
        promptNotShared: true,
        sources: [CAPITALONE_CO52_2021],
      },
      {
        id: 'acquired-codebase-if-else',
        round: 'Power Day: case',
        kind: 'Practical coding',
        question: 'Discuss merging an acquired company\'s codebase into your own, then debug an if-else statement.',
        sources: [CAPITALONE_CO57_TDP_2020],
      },
      {
        id: 'diagonal-matrix-traverse',
        round: 'Online assessment',
        kind: 'Algorithm',
        question: 'A variation of LeetCode\'s Diagonal Traverse (498): walk a 2D matrix diagonal by diagonal. The account rates it the set\'s medium problem.',
        sources: [CAPITALONE_CO6_FRONTEND_2022],
      },
      {
        id: 'k-diff-pairs',
        round: 'Online assessment',
        kind: 'Algorithm',
        question: 'A variation of LeetCode\'s K-diff Pairs in an Array (532): count the distinct pairs whose difference is k. The account rates it the set\'s hard problem.',
        sources: [CAPITALONE_CO6_FRONTEND_2022],
      },
      {
        id: 'array-and-weighted-graph-problems',
        round: 'Online assessment',
        kind: 'Algorithm',
        question: 'The same set\'s other problems: a simple array navigation task and a question on an undirected weighted graph.',
        promptNotShared: true,
        sources: [CAPITALONE_CO6_FRONTEND_2022],
      },
      {
        id: 'banking-system-in-levels',
        round: 'Power Day',
        kind: 'Practical coding',
        question:
          'Build a banking system as a class, part by part: create accounts and add money, transfer between accounts, then report the most active accounts, each part building on the last.',
        sources: [CAPITALONE_CO35_COMMENT_2025, CAPITALONE_CO53_SENIOR_2024, CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'trie-in-levels',
        round: 'Power Day',
        kind: 'Algorithm',
        question: 'An object-oriented exercise on a trie in three levels, each adding features to the one before.',
        promptNotShared: true,
        sources: [CAPITALONE_CO32_SENIOR_LEAD_2026],
      },
      {
        id: 'api-call-and-parse',
        round: 'Power Day',
        kind: 'Practical coding',
        question: 'Write code that calls an API and parses its response in several different ways.',
        promptNotShared: true,
        sources: [CAPITALONE_CO34_COMMENTS_2026],
      },
      {
        id: 'two-sum-closest-to-zero',
        kind: 'Algorithm',
        question: 'Given an array, find the two numbers whose sum is closest to zero.',
        sources: [CAPITALONE_CO52_2021, CAPITALONE_CO20_WEB_2022],
        practice: { label: '3Sum: triplets that sum to zero', path: '/javascript/coding/js-three-sum' },
      },
      {
        id: 'count-character-in-string',
        kind: 'Algorithm',
        question: 'Given a string, count how many times a given character appears in it.',
        sources: [CAPITALONE_CO59_LEAD_2023],
        practice: { label: 'Count vowels', path: '/javascript/coding/js-count-vowels' },
      },
      {
        id: 'rotating-box-gravity',
        kind: 'Algorithm',
        question: 'Implement gravity for the items inside a box that rotates and contains obstacles.',
        sources: [CAPITALONE_CO62_LEAD_2025],
      },
      {
        id: 'minesweeper',
        kind: 'UI build',
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
      'CrowdStrike lists eight hiring steps for all roles, from a recruiter conversation and a hiring manager interview to a skills assessment, more interviews, references, an offer and a background check. Frontend accounts from 2021 to 2025 describe a recruiter call, a manager round, spoken web fundamentals with engineers, a take-home build and a review of it.',
    caveat:
      'Built from frontend and UI accounts dated 2021 to 2025, mostly reviews re-hosted on Taro, a few intern accounts from other teams, and CrowdStrike careers pages; no frontend account from 2026 was found.',
    checkedAt: '2026-10-26',
    variants: [
      {
        title: 'Frontend and UI engineers, United States, 2021 to 2025',
        note: 'The fullest 2025 account is a manager loop, so its manager and culture rounds may not apply to individual contributors.',
        stages: [
          {
            stage: 'Recruiter call',
            format: 'A short call about the role and your background; one candidate could not learn in advance whether the technical round would include coding.',
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
            format: 'An early conversation with the hiring manager or an engineering manager about your experience; some managers add technical knowledge questions.',
            appliesTo: 'All candidates',
            sources: [
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
              'Spoken questions, often from two engineers taking turns through a list: JavaScript scope, events and promises, the CSS box model and specificity, accessibility, XSS and other security questions. The reports name no algorithm round.',
            appliesTo: 'All candidates',
            sources: [
              CROWDSTRIKE_CS1_EM_FE_2025,
              CROWDSTRIKE_CS2_UI_DEV_2025,
              CROWDSTRIKE_CS6_SENIOR_2024,
              CROWDSTRIKE_CS20_SENIOR_FE_2024,
              CROWDSTRIKE_CS9_SENIOR_FE_2023,
              CROWDSTRIKE_CS10_UI_2023,
              CROWDSTRIKE_CS12_SENIOR_FE_2022,
              CROWDSTRIKE_CS15_SENIOR_UI_2022,
            ],
            practice: { label: 'Bubbling and event delegation', path: '/javascript/trivia/js-event-delegation' },
          },
          {
            stage: 'Take-home build',
            format:
              'A small UI built at home; one report was allowed any language or framework. The one named task is a table of downloadable files and their details, built from a screenshot; one report names a 4-hour project.',
            appliesTo: 'Most candidates',
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
              'Engineers go through the submission, two of them in two reports: what you would change, how you would add filtering and sorting, generalising the component, when to load each file\'s status, thousands of rows, and select all across pages.',
            appliesTo: 'Candidates who submit the take-home',
            sources: [
              CROWDSTRIKE_CS1_EM_FE_2025,
              CROWDSTRIKE_CS6_SENIOR_2024,
              CROWDSTRIKE_CS12_SENIOR_FE_2022,
              CROWDSTRIKE_CS16_UI_2022,
            ],
            practice: { label: 'Take-home review questions, answered', path: '/react/trivia/react-take-home-table-review-questions' },
          },
          {
            stage: 'Closing round',
            format: 'A culture interview with someone outside engineering, a collaboration panel, or an informational talk with the hiring manager about the team.',
            appliesTo: 'Some candidates',
            sources: [CROWDSTRIKE_CS1_EM_FE_2025, CROWDSTRIKE_CS6_SENIOR_2024, CROWDSTRIKE_CS16_UI_2022],
            // The hiring-manager round takes the general behavioural guide; a culture round is scored on its signals.
            practice: { label: 'Behavioral interview scorecard', path: '/guides/behavioral/evaluation-areas' },
          },
          {
            stage: 'Result',
            format: 'An offer, sometimes with a level discussion, or a standard rejection email without feedback; loops took one to four months.',
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
            format:
              'One 2024 report: two stages of questions read from a list to prevent bias, about two weeks for both. Its listed questions, not tied to a stage, cover security, HTML, CSS and JavaScript (CORS, const, let and var, copying objects, the box model).',
            appliesTo: 'Senior front-end engineers',
            sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024],
            practice: { label: 'Secure CORS handling', path: '/javascript/trivia/js-secure-cors-handling' },
          },
          {
            stage: 'Home task',
            format: 'One 2024 report: a week to deliver a task estimated at 5 hours; the candidate spent 10, and the reply came nearly three weeks later.',
            appliesTo: 'Senior front-end engineers',
            sources: [CROWDSTRIKE_CS7_SENIOR_FE_2024],
          },
          {
            stage: 'Announced later stages',
            format:
              'One 2024 report: a presentation, a team meet-and-greet and a talk with HR were announced; the candidate was rejected before them, so their content is unknown.',
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
            format: 'One 2025 report: a whiteboard exercise on a system whose requirements were sent in advance. The report also lists a question on frontend optimization.',
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
              'Up to three interview rounds. A UI engineer intern had a phone screen, a technical interview and a behavioral interview that also asked technical questions; the JavaScript and front-end topics the account lists are not tied to a round.',
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
  },
  airbnb: {
    summary:
      'Airbnb\'s careers FAQ says the process depends on the position and that candidates meet several people on the team. Frontend accounts from 2024 and 2025 describe a recruiter call and a technical screen, then UI and JavaScript coding, frontend system design and a past-project deep dive.',
    caveat:
      'Accounts disagree on algorithms: one reports none, two report a LeetCode-hard problem in 2025. Most list tasks without naming the round, so the rows group them by type and do not give an order. Some accounts carry a general software engineer title but describe frontend rounds, and none of the frontend accounts cited is from 2026.',
    checkedAt: '2026-11-02',
    variants: [
      {
        title: 'Frontend engineers, mostly 2024 to 2025',
        stages: [
          {
            stage: 'Recruiter call',
            format: 'One account describes a short call about experience. Two received prep material, and one of them was told to expect frontend concepts and best practices.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB9_FE_2025, AIRBNB_AB13_SWE_2025],
          },
          {
            stage: 'Technical screen',
            format:
              'Content varies by account: a UI component or a store-style design question, tests that must pass, a 60-minute booking widget with product discussion in a full-stack account, or a LeetCode-hard problem despite frontend prep material. One interviewer said questions would keep coming until time ran out.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB9_FE_2025, AIRBNB_AB17_FULLSTACK_2025, AIRBNB_AB7_SCREEN_2025, AIRBNB_AB12_FE_2024, AIRBNB_AB2_POSTER_2024],
            practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
          },
          {
            stage: 'Coding: UI or React',
            format: 'Build UI: a styled card game, a photo gallery with live updates and timeouts, a star rating, a React component, or a DOM or React task.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB10_STAFF_FE_2025, AIRBNB_AB8_SWE_2024, AIRBNB_AB12_FE_2024, AIRBNB_AB15_SENIOR_2024, AIRBNB_AB1_FE_2022],
            practice: { label: 'React star rating', path: '/react/coding/react-star-rating' },
          },
          {
            stage: 'Coding: JavaScript',
            format:
              'Currying, callbacks, async, closures and prototypes in one account, vanilla JavaScript in another and a class that stores a data object in a third. A commenter who cleared the loop names the event loop and closures.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB8_SWE_2024, AIRBNB_AB12_FE_2024, AIRBNB_AB16_SENIOR_2024, AIRBNB_AB2_COMMENT_2024],
            practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
          },
          {
            stage: 'Frontend system design',
            format:
              'Design a frontend app or component: state, data, APIs, trade-offs and optimisations. Two accounts report a chat app, one of them going into WebSockets and online and offline flows. One account says its question matched neither the job nor the prep packet.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB13_SWE_2025, AIRBNB_AB10_STAFF_FE_2025, AIRBNB_AB11_FE_2024, AIRBNB_AB12_FE_2024, AIRBNB_AB1_FE_2022],
            practice: { label: 'Real-time messaging inbox case', path: '/system-design/messaging-inbox-frontend' },
          },
          {
            stage: 'Experience deep dive',
            format: 'An experience round on a past project in depth, in one account a project the candidate led.',
            appliesTo: 'Frontend engineers',
            sources: [AIRBNB_AB10_STAFF_FE_2025, AIRBNB_AB12_FE_2024, AIRBNB_AB4_COMMENT_2022, AIRBNB_AB3_COMMENT_2022],
            practice: { label: 'Behavioural stories', path: '/guides/behavioral/stories' },
          },
          {
            stage: 'Core values or behavioural',
            format: 'A core values interview in one account, behavioural questions in others.',
            appliesTo: 'Some loops',
            sources: [AIRBNB_AB11_FE_2024, AIRBNB_AB14_SENIOR_2024, AIRBNB_AB4_COMMENT_2022],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
          {
            stage: 'Algorithms',
            format:
              'Accounts disagree. One reports no algorithms and one not much. Reports from 2021 and 2022 name one array or LeetCode-medium problem. Two from 2025 report a LeetCode-hard problem, one in the technical screen and one as a 45-minute coding round.',
            appliesTo: 'Some loops',
            sources: [AIRBNB_AB13_SWE_2025, AIRBNB_AB9_FE_2025, AIRBNB_AB11_FE_2024, AIRBNB_AB4_COMMENT_2022, AIRBNB_AB3_COMMENT_2022, AIRBNB_AB6_FE_2021],
            practice: { label: 'DSA for frontend loops', path: '/guides/interview-blueprint/dsa-for-fe' },
          },
          {
            stage: 'Team matching',
            format: 'Conversations with hiring managers after the interviews. This candidate then heard nothing from the recruiter for months.',
            appliesTo: 'The one account',
            sources: [AIRBNB_AB14_SENIOR_2024],
          },
        ],
      },
    ],
  },
};
