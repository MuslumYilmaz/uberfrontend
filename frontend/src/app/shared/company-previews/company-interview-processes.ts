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
const GOOGLE_GO6 = report('Medium (preview)', 'https://shubhamjangle.medium.com/google-swe-iii-interview-the-round-by-round-breakdown-nobody-wrote-fd2c10fe52ff', '2026-04');
const GOOGLE_GO7 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/1274542/', '2021-06');
const GOOGLE_GO8 = report('Blind comment', 'https://www.teamblind.com/post/Google-Frontend-interview-78mvqUW2', '2021-06');
const GOOGLE_PHONE_2020 = report('LeetCode', 'https://leetcode.com/discuss/post/592667/', '2020-04');

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
const META_ME6 = report('Blind', 'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob', '2021-10');
const META_ME7 = report('Taro (approx.)', `${META_TARO}/front-end-developer-new-york-ny-november-1-2020-no-offer-positive-b0918a8e/`, '2020-11');
const META_ME8 = report('Blind', 'https://www.teamblind.com/post/meta-front-end-phone-interview-beroc46d', '2023-06');
const META_ME9 = report('Taro', `${META_TARO}/front-end-developer-san-francisco-ca-march-6-2024-no-offer-positive-609eb715/`, '2024-03');
const META_ME10 = report('Taro (approx.)', `${META_TARO}/frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20/`, '2025-04');
const META_ME11 = report('Taro (approx.)', `${META_TARO}/frontend-engineer-menlo-park-ca-june-1-2025-accepted-offer-positive-143f4163/`, '2025-06');
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
const BOOKINGCOM_BK1 = report(
  'Code360',
  'https://www.naukri.com/code360/interview-experiences/booking-com/interview-experience-frontend-engineer-apr-2023-exp-0-2-years',
  '2023-04',
);
const BOOKINGCOM_BK2 = report('enginebogie', 'https://enginebogie.com/interview/experience/booking-com-frontend-engineer/84', '2023-05');
const BOOKINGCOM_BK3 = report('LeetCode', 'https://leetcode.com/discuss/post/3673403/', '2023-06');
const BOOKINGCOM_BK5 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/junior-frontend-developer-amsterdam-march-1-2022-accepted-offer-positive-88561605/`, '2022-03');
const BOOKINGCOM_BK6 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/front-end-software-engineer-ii-amsterdam-june-1-2022-accepted-offer-positive-2d3acd6d/`, '2022-06');
const BOOKINGCOM_BK7 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/frontend-software-engineer-ii-turkey-january-1-2023-accepted-offer-positive-e4aeb759/`, '2023-01');
const BOOKINGCOM_BK8 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/junior-frontend-engineer-amsterdam-march-1-2022-accepted-offer-positive-9743e14f/`, '2022-03');
const BOOKINGCOM_BK9 = report('Blind', 'https://www.teamblind.com/post/bookingcom-frontend-interview-experience-owh781q6', '2021-12');
const BOOKINGCOM_BK10 = report('Blind', 'https://www.teamblind.com/post/bookingcom-interview-frontend-fzudnfhv', '2021-11');
const BOOKINGCOM_BK11 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/frontend-developer-turkey-september-1-2021-no-offer-neutral-8e3079d9/`, '2021-09');
const BOOKINGCOM_BK12 = report('Taro (approx.)', `${BOOKINGCOM_TARO}/full-stack-software-engineer-bangladesh-may-1-2022-accepted-offer-positive-8784f953/`, '2022-05');

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
const INTUIT_IN1 = report('LeetCode', 'https://leetcode.com/discuss/post/7320927/', '2025-11');
const INTUIT_IN2 = report('LeetCode', 'https://leetcode.com/discuss/post/6770567/', '2025-05');
const INTUIT_IN3 = report('LeetCode', 'https://leetcode.com/discuss/post/4167001/', '2023-10');
const INTUIT_IN4 = report('LeetCode', 'https://leetcode.com/discuss/post/4980666/', '2024-04');
const INTUIT_IN5 = report('LeetCode', 'https://leetcode.com/discuss/post/2052880/', '2022-05');
const INTUIT_IN8_PLAN = report(
  'Blind (recruiter plan)',
  'https://www.teamblind.com/post/final-interview-for-front-end-engineer-at-intuit-new-coding-format-5jbsqcv5',
  '2024-10',
);
const INTUIT_IN9_PLAN = report('Blind (plan)', 'https://www.teamblind.com/post/intuit-a4a-interview-staff-swe-fe-bay-area-8-yoe-8ppjug5d', '2026-08');
const INTUIT_IN10 = report('Blind', 'https://www.teamblind.com/post/intuit-team-matching-53d3l6c6', '2025-10');
const INTUIT_IN11 = report('Taro', `${INTUIT_TARO}/staff-frontend-engineer-india-january-8-2025-no-offer-negative-8dde40c5/`, '2025-01');
const INTUIT_IN12 = report('Taro (approx.)', `${INTUIT_TARO}/staff-frontend-engineer-united-states-august-1-2024-no-offer-negative-3a91fb0d/`, '2024-08');
const INTUIT_IN13 = report('Taro (approx.)', `${INTUIT_TARO}/senior-software-engineer-frontend-bengaluru-march-1-2022-no-offer-negative-93ee0992/`, '2022-03');
const INTUIT_IN15 = report('Taro (approx.)', `${INTUIT_TARO}/senior-fullstack-engineer-united-states-december-1-2023-accepted-offer-positive-09501015/`, '2023-12');
const INTUIT_HR_2022 = report('Taro (approx.)', `${INTUIT_TARO}/senior-front-end-developer-united-states-april-1-2022-no-offer-negative-cd8e79ed/`, '2022-04');
const INTUIT_ROLE = 'Frontend engineers';

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
const XAI_X7_MTS_2025 = report('Aced', 'https://www.aced.io/experiences/x-ai-software-engineer-interview-7fbd12', '2025-12');
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
const JPMORGAN_JP1 = report('Aced', 'https://www.aced.io/experiences/jp-morgan-chase-senior-frontend-engineer-interview-6faa4e', '2026-05');
const JPMORGAN_JP2 = report('Blind', 'https://www.teamblind.com/post/jp-morgan-interview-tips-ohvqbeuy', '2023-05');
const JPMORGAN_JP2_PLAN = report('Blind', 'https://www.teamblind.com/post/jp-morgan-swe-interview-guide-tsoukjaf', '2023-05');
const JPMORGAN_JP3 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/associate-software-engineer-united-kingdom-february-1-2025-no-offer-negative-7f96780a/', '2025-02');
const JPMORGAN_JP4 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-january-1-2021-accepted-offer-positive-e00df0d2/', '2021-01');
const JPMORGAN_JP5 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-july-1-2017-no-offer-negative-5853573b/', '2017-07');
const JPMORGAN_JP6 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-april-1-2022-no-offer-neutral-a3d9886a/', '2022-04');
const JPMORGAN_JP7 = report('Taro', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/lead-software-engineer-united-states-march-13-2025-no-offer-positive-5ec74572/', '2025-03');
const JPMORGAN_JP8 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/react-developer-united-states-june-1-2022-no-offer-positive-87452f0d/', '2022-06');
const JPMORGAN_JP9 = report('Blind (briefing)', 'https://www.teamblind.com/post/JPMorgan-Front-End-position---HELP-uwhCeSaA', '2021-12');
const JPMORGAN_JP10 = report('Blind (briefing)', 'https://www.teamblind.com/post/JPMorgan-Chase---Front-End-Developer-Interview-Mb7vx1A6', '2021-03');
const JPMORGAN_JP11 = report(
  'frontendgeek',
  'https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-jp-morgan-refused-offer---9f684f90-12ee-45ec-ac82-e40d2010260e',
  '2024-04',
);
const JPMORGAN_JP12 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-engineer-bengaluru-karnataka-april-1-2024-no-offer-negative-77dc2081/', '2024-04');
const JPMORGAN_JP13 = report('Blind (briefing)', 'https://www.teamblind.com/post/jpmorgan-chase-interview-rounds-expectation-bengaluru-ta1v2q0n', '2024-05');
const JPMORGAN_JP14 = report('LeetCode', 'https://leetcode.com/discuss/post/1076639/', '2021-02');
const JPMORGAN_JP15 = report('Taro (approx.)', 'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/software-engineer-united-states-august-1-2025-declined-offer-negative-5c2f81ca/', '2025-08');
const JPMORGAN_JP16 = report('Blind', 'https://www.teamblind.com/post/jpmc-interview-expectations-d0ed5ppz', '2026-04');
const JPMORGAN_JP17A = report('LeetCode', 'https://leetcode.com/discuss/post/7421234/', '2025-12');
const JPMORGAN_JP17B = report('LeetCode', 'https://leetcode.com/discuss/post/7455878/', '2026-01');
const JPMORGAN_JP17C = report('LeetCode', 'https://leetcode.com/discuss/post/5438765/', '2024-07');
const JPMORGAN_JP17D = report('LeetCode', 'https://leetcode.com/discuss/post/7275188/', '2025-10');
const JPMORGAN_JP17E = report('LeetCode', 'https://leetcode.com/discuss/post/6830133/', '2025-06');
const JPMORGAN_ROLE = 'Frontend-titled roles; varies by team';

// Agoda. The live careersatagoda.com returns a Cloudflare 403 to automated readers, so the careers pages were read
// from archive captures (the interview-process post captured 2026-04-06, the interview guide 2026-10-19, the hiring
// process post 2025-10-25); the interviewer's guide is on the Agoda Engineering Medium publication.
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
const AGODA_A1_BANGKOK_2026 = report('LeetCode', 'https://leetcode.com/discuss/post/8459009/', '2026-07'); // AGD1
const AGODA_A2_GURGAON_2025 = report(
  'Code360',
  'https://www.naukri.com/code360/interview-experiences/agoda/agoda-interview-experience-by-brijesh-verma-may-2025-exp-0-2-years',
  '2025-05',
); // AGD8
const AGODA_A3_OFFER_2025 = report(
  'Medium',
  'https://kr-viku.medium.com/%EF%B8%8F-my-agoda-interview-journey-from-first-call-to-offer-086385b03d33',
  '2025-09',
); // AGD2
const AGODA_A4_STAFF_2025 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/6398233', '2025-02'); // AGD3
const AGODA_A5_FULL_STACK_2025 = report('LeetCode', 'https://leetcode.com/discuss/post/7199643/', '2025-09'); // AGD4
const AGODA_A7_GURGAON_URL = 'https://www.teamblind.com/post/my-interview-experience-with-agoda-zhhgctzk';
const AGODA_A7_GURGAON_2025 = report('Blind', AGODA_A7_GURGAON_URL, '2025-06'); // AGD7, the poster's own loop
const AGODA_A7_GURGAON_COMMENT = report('Blind comment', AGODA_A7_GURGAON_URL, '2025-06'); // AGD7 (c), commenters on the Staff track
const AGODA_A8_CULTURE_FIT_2025 = report(
  'Blind',
  'https://www.teamblind.com/post/what-can-i-expect-in-agodas-sse-frontend-culture-fit-round-xchtevrv',
  '2025-06',
); // AGD5
const AGODA_A9_HEADCOUNT_2025 = report(
  'Medium',
  'https://beyondthecode.medium.com/my-agoda-interview-journey-a-candid-reflection-55de22d2276b',
  '2025-07',
); // AGD6, archive capture
const AGODA_A12_BANGALORE_2025 = report(
  'frontendgeek',
  'https://www.frontendgeek.com/interview-experience/staff-frontend-interview-experience-at-agoda-rejected-thailand-relocation---f13f1824-08d9-4385-a219-269aaeb3d301',
  '2025-07',
); // AGD10
const AGODA_A13_SDE2_2024 = report('Substack', 'https://nerddesignlab.substack.com/p/interview-experience-agoda-gurgaon', '2024-10'); // AGD9
const AGODA_A16_PREP_GUIDE_2024 = report('Blind comment', 'https://www.teamblind.com/post/agoda-bankok-platform-interview-wlgcyzeh', '2024-10'); // AGD12 (p, c)
const AGODA_ROLE = 'Front-end engineers, Senior and Staff';

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

// ElevenLabs accounts cover full-stack, frontend-leaning titles. The two Aced entries show relative dates only,
// so their dates are the interview months the pages implied when read.
const ELEVENLABS_CAREERS_FAQ = official('ElevenLabs careers FAQ', 'https://elevenlabs.io/careers');
const ELEVENLABS_EL1_SENIOR_2026 = report('Aced', 'https://www.aced.io/experiences/eleven-labs-senior-frontend-engineer-interview-925c04', '2026-07');
const ELEVENLABS_EL2_FE_2025 = report('Aced', 'https://www.aced.io/experiences/eleven-labs-frontend-engineer-interview-c79e72', '2025-11');
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

// Waymo's hiring page gives the stage structure. The one complete frontend loop is a PracHub account that the
// site marks as curated and edited, so its label says so.
const WAYMO_HOW_WE_HIRE = official('Waymo how we hire page', 'https://careers.withwaymo.com/how-we-hire');
const WAYMO_WM1_SENIOR_FE_2026 = report(
  'PracHub (curated)',
  'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process',
  '2026-05',
);
const WAYMO_WM2_SWE_2026 = report('LeetCode', 'https://leetcode.com/discuss/post/7949696/', '2026-04');
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
const ANDURIL_AN1_ONSITE_2025 = report('Blind', 'https://www.teamblind.com/post/front-end-interviews-at-anduril-3hihnhlv', '2025-04');
const ANDURIL_AN2_OFFER_2023 = report('Blind', 'https://www.teamblind.com/post/anduril-front-end-interviews-bugagvca', '2023-10');
const ANDURIL_AN6_SCREEN_2025 = report('Blind comment', 'https://www.teamblind.com/post/anduril-front-end-interview-yt3cx1bt', '2025-03');

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
  google: {
    summary:
      'Google\'s hiring pages describe recruiter conversations, possible assessments and a panel of interviews by video or in person. Front-end accounts from 2021 to 2026 describe one or two technical screens, then four or five interviews mixing algorithm coding, usually one JavaScript or frontend round and Googleyness, with a frontend-leaning design round from L5.',
    caveat:
      'The number of frontend rounds varies; one 2026 account, read as a preview only, had none. Google\'s pages say AI tools are not permitted in interviews, while a May 2026 news report describes a pilot that allows an approved assistant in one round for some US teams. Confirm the loop with your recruiter.',
    checkedAt: '2026-10-20',
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
            format: 'Four or five interviews by video or onsite: algorithm coding, usually one JavaScript or frontend round (more in one account), and a Googleyness interview.',
            appliesTo: 'All candidates',
            sources: [GOOGLE_HOW_WE_HIRE, GOOGLE_GO1, GOOGLE_GO2, GOOGLE_GO4, GOOGLE_GO7, GOOGLE_GO8],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
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
            sources: [META_FEE_ONSITE, META_ME4, META_ME5, META_ME7, META_ME11],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
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
            sources: [APPLE_AP7, APPLE_AP9, APPLE_ICT3_2025, APPLE_FULLSTACK_2026],
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
            sources: [APPLE_AP2, APPLE_AP3, APPLE_AP4, APPLE_AP7, APPLE_AP8, APPLE_ICT3_2025],
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
            sources: [STRIPE_CAREERS, STRIPE_ST3, STRIPE_ST5, STRIPE_ST7, STRIPE_ST8],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Onsite: bug squash',
            format: 'Find and fix bugs in an unfamiliar codebase.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST4, STRIPE_ST5, STRIPE_ST6_PLAN],
            practice: { label: 'Fix an async race', path: '/javascript/debug/js-debug-async-race' },
          },
          {
            stage: 'Onsite: integration',
            format: 'Combine provided tools or APIs into a working feature.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST4, STRIPE_ST6_PLAN],
          },
          {
            stage: 'Onsite: programming exercise',
            format: 'A coding exercise.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_ST1, STRIPE_ST6_PLAN],
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
      'Full-stack and senior roles add backend coding and a system design round. One August 2025 software engineer account describes a take-home followed by a technical session, a May 2025 senior full-stack loop had an easy React exercise and system design, and a thin September 2025 frontend account describes a recruiter call and a live-coding round, so recent frontend loops may differ.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers, 2021 to 2023',
        stages: [
          {
            stage: 'HackerRank assessment',
            format: '90–100 minutes, about five items: two algorithm problems, mostly easy (one account had a medium), two HTML and CSS multiple-choice questions and a React component.',
            appliesTo: 'Junior to FE II',
            sources: [BOOKINGCOM_BK3, BOOKINGCOM_BK5, BOOKINGCOM_BK8, BOOKINGCOM_BK9, BOOKINGCOM_BK10, BOOKINGCOM_BK11],
            practice: { label: 'Valid Parentheses', path: '/javascript/coding/js-valid-parentheses' },
          },
          {
            stage: 'Recruiter call',
            format: 'A short call; some calls include a few technical questions.',
            appliesTo: 'All candidates',
            sources: [BOOKINGCOM_JOURNEY, BOOKINGCOM_BK1, BOOKINGCOM_BK5, BOOKINGCOM_BK8, BOOKINGCOM_BK11],
          },
          {
            stage: 'Frontend coding',
            format: 'One or two rounds of about 60 minutes with two engineers: build a component in plain JavaScript or React, such as an autocomplete or a tooltip, follow a design spec with API data, or add a feature to a prepared app.',
            appliesTo: 'Frontend roles',
            sources: [BOOKINGCOM_BK1, BOOKINGCOM_BK2, BOOKINGCOM_BK5, BOOKINGCOM_BK6, BOOKINGCOM_BK7, BOOKINGCOM_BK9, BOOKINGCOM_BK10, BOOKINGCOM_BK11],
            practice: { label: 'React autocomplete search', path: '/react/coding/react-autocomplete-search-starter' },
          },
          {
            stage: 'Fit interview',
            format: 'A conversation with engineering managers; 60 minutes in one full-stack account.',
            appliesTo: 'All candidates',
            sources: [BOOKINGCOM_BK5, BOOKINGCOM_BK7, BOOKINGCOM_BK8, BOOKINGCOM_BK11, BOOKINGCOM_BK12],
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
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
      'The official page is undated and generic, and its durations differ from recent recruiter plans (a 90-minute craft round, a 60-minute technical round and 30 minutes each with an AI assessor and the manager). The AI round rests mostly on candidates\' plans. One 2025 account describes team matching before the offer.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers',
        stages: [
          {
            stage: 'Recruiter or HR call',
            format: 'A short check of background.',
            appliesTo: INTUIT_ROLE,
            sources: [INTUIT_IN12, INTUIT_HR_2022],
          },
          {
            stage: 'Technical phone interview',
            format: '45–75 minutes: JavaScript output and closures, promises, performance and security, React and an algorithm problem; 2025 accounts add AI questions.',
            appliesTo: INTUIT_ROLE,
            sources: [INTUIT_IN1, INTUIT_IN2, INTUIT_IN3, INTUIT_IN11, INTUIT_IN12],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Craft demonstration',
            format: 'Build a task from user stories, received a day to a week ahead or built during the onsite, then present it, walk through the code and add features live.',
            appliesTo: INTUIT_ROLE,
            sources: [INTUIT_HIRING, INTUIT_IN1, INTUIT_IN3, INTUIT_IN4, INTUIT_IN5, INTUIT_IN12, INTUIT_IN13, INTUIT_IN15],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Assessor or technical rounds',
            format: 'One or two rounds of 30–60 minutes: JavaScript polyfills, promises, React internals, security, algorithm problems and changes to the craft code.',
            appliesTo: INTUIT_ROLE,
            sources: [INTUIT_HIRING, INTUIT_IN1, INTUIT_IN3, INTUIT_IN4, INTUIT_IN12, INTUIT_IN13],
            practice: { label: 'Sleep and delay with a promise', path: '/javascript/coding/js-sleep' },
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
            sources: [INTUIT_HIRING, INTUIT_IN1, INTUIT_IN4, INTUIT_IN5, INTUIT_IN11, INTUIT_IN12, INTUIT_IN13, INTUIT_IN15],
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
            sources: [REVOLUT_BAR_RAISER],
          },
        ],
      },
    ],
  },
  spotify: {
    summary:
      'Spotify\'s hiring page describes a recruiter interview, a second interview with one or two team members and a final round with several team members. Web engineer accounts from 2022 to 2025, mostly from the US and Canada, describe a technical screen and a final round with a plain HTML, CSS and JavaScript build, algorithms, system design and a values interview.',
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
            practice: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
          },
        ],
      },
    ],
  },
  xai: {
    title: 'xAI (now SpaceXSI) frontend interview process',
    summary:
      'The careers page describes four generic steps and says technical team members, not recruiters, evaluate applications. The closed frontend postings from March 2025 to February 2026 shared one template: a review of the CV and a "statement of exceptional work", a 15-minute phone interview with basic technical questions, then the team\'s main process on Google Meet with the goal of finishing within one week. For frontend roles that meant a React coding interview in TypeScript, an HTML/CSS interview from a screenshot, and a team or founding-engineer stage. One London account from August 2025 matches the React round.',
    caveat:
      'Every frontend posting with a loop was removed between June 2025 and February 2026, and on 21 October 2026 the board had no frontend posting with interview text, so this table describes the 2025 to early-2026 loops. The loop varies by team: Bay Area postings added a coding assessment and a systems session, London postings did not, and the take-home row comes from one general software-engineer account rather than a frontend posting. The "Software Engineer Specialist" loops with a CodeSignal assessment are left out as a separate track.',
    checkedAt: '2026-10-21',
    variants: [
      {
        title: 'Frontend engineers, London and Bay Area, from postings 2025-03 to 2026-02 and one London account',
        note: 'Thin evidence: one public frontend account read in full. Stages marked "postings only" rest on the closed postings alone.',
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
              '"Write a small app in React" in TypeScript; 45 minutes in London; one or two interviews on Bay Area teams. The one account built a chat interface in a one-hour pair-coding session with live review and React questions such as what useCallback does.',
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
            format: 'A general coding round before the frontend interviews. Postings only.',
            appliesTo: 'Grok Studio and Autonomous Agents postings',
            sources: [XAI_O_GROK_STUDIO, XAI_O_AUTONOMOUS_AGENTS],
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
              'A four-hour AI-assisted product build from one of six prompts, submitted as a GitHub repository with a Loom walkthrough within 24 hours, then a one-hour in-person session on an existing class.',
            appliesTo: 'One general software-engineer loop from 2025; not on any frontend posting',
            sources: [XAI_X7_MTS_2025],
          },
        ],
      },
    ],
  },
  jpmorgan: {
    summary:
      'JPMorgan Chase\'s How we hire page says the interview process will differ for each position and that candidates meet several people in multiple rounds, and JPMorgan Chase-badged employees on Blind describe decentralised, team-run loops. Frontend accounts from 2021 to 2026 in the UK, the US and India describe a recruiter screen, a one-hour React and JavaScript conversation often split between two interviewers, 30 to 90 minutes of live coding, and a hiring-manager or leadership round. The online-assessment and super-day rows come from generic software-engineer accounts that Software Engineer II and III requisitions probably share.',
    caveat:
      'No standard loop exists: the format depends on the line of business and the team, so the order and count of stages vary between accounts, and most accounts describe two to four of these stages rather than all of them. The super-day shape rests on generic software-engineer accounts, and no frontend-titled report confirms it. Several frontend accounts are one to three lines long and some dates are approximate; one candidate met an interviewer assigned to a back-end role, and another heard nothing after a cleared round.',
    checkedAt: '2026-10-21',
    variants: [
      {
        title: 'Front-end and React engineers, team-run loops, 2021 to 2026',
        note: 'Stage order varies by team. The security-and-framework row is one Bengaluru loop; the super-day row is the generic Software Engineer II and III shape.',
        stages: [
          {
            stage: 'Recruiter contact',
            format: 'A phone screen about the CV.',
            appliesTo: 'Most loops',
            sources: [JPMORGAN_HOW_WE_HIRE, JPMORGAN_JP4, JPMORGAN_JP15],
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
            format: 'About an hour, often split between two interviewers or a panel of three: JavaScript fundamentals (closures, clones, Object.assign, reduce), React hooks and lifecycle, framework choice, resume-driven questions.',
            appliesTo: JPMORGAN_ROLE,
            sources: [JPMORGAN_JP2, JPMORGAN_JP3, JPMORGAN_JP5, JPMORGAN_JP6, JPMORGAN_JP7, JPMORGAN_JP9, JPMORGAN_JP10, JPMORGAN_JP12, JPMORGAN_JP13, JPMORGAN_JP14],
            practice: { label: 'Explain closures', path: '/javascript/trivia/js-closures' },
          },
          {
            stage: 'Live coding',
            format: '30 to 90 minutes: a small React build (a to-do list with priorities, functional components, generic types with a useEffect cleanup) or paper coding; one London briefing planned 90 minutes of live coding plus a 30-minute behavioural stage, other accounts give 30 to 45 minutes.',
            appliesTo: 'Most frontend loops',
            sources: [JPMORGAN_JP1, JPMORGAN_JP2_PLAN, JPMORGAN_JP4, JPMORGAN_JP6, JPMORGAN_JP8, JPMORGAN_JP10],
            practice: { label: 'React to-do list', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'Security and framework rounds',
            format: 'Three 60-minute rounds in one sitting: security and React (XSS, lifecycle, a memoization function), JavaScript and framework (promises, generators, a reduce polyfill, currying), hiring manager.',
            appliesTo: 'One Bengaluru SDE2 loop, 2024',
            sources: [JPMORGAN_JP11],
            practice: { label: 'DOM XSS prevention', path: '/javascript/trivia/js-xss-dom-sinks' },
          },
          {
            stage: 'Super day',
            format: 'Three rounds of 45 to 60 minutes in one day, in any order: a pull-request review plus a medium problem, high-level design on a HackerRank whiteboard or CodePair (a rate limiter recurs), and a behavioural round with a Director or a senior executive; a short team-match call may follow.',
            appliesTo: 'Generic Software Engineer II and III loops, US and India, 2024 to 2026; probably shared by React-titled requisitions, unconfirmed',
            sources: [JPMORGAN_JP15, JPMORGAN_JP16, JPMORGAN_JP17A, JPMORGAN_JP17B, JPMORGAN_JP17C, JPMORGAN_JP17D, JPMORGAN_JP17E],
            practice: { label: 'Create an LRU cache', path: '/javascript/coding/js-create-lru-cache' },
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
  },
  agoda: {
    summary:
      'Agoda\'s interview-process page describes a HackerRank online test as the coding assessment and four rounds: Coding, Platform, System Design and Agoda Culture Fit, with a decision typically within two weeks of the last round. Front-end accounts from Bangkok relocation loops in 2025 and 2026 describe a recruiter prep call, a 60-minute coding interview, a Frontend Platform interview and an architecture interview, all on HackerRank about a week apart, a preliminary call in which the level is set, a culture-fit conversation with an engineering manager, and the manager presenting the offer.',
    caveat:
      'The careers pages could only be read from archive captures. The Platform round\'s content varies by interviewer: a pure question-and-answer hour, a JavaScript implementation or an architecture discussion. Rejections after clearing the technical rounds are reported, over headcount or without a managerial round. Gurgaon loops differ by team; Manila and Bangalore rest on too little to state a loop. On 2026-10-21 the front-end postings were Staff, Lead and Manager level, all Bangkok-based with relocation.',
    checkedAt: '2026-10-21',
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
              '60 minutes on HackerRank with an engineer: two easy-to-medium DSA problems in JavaScript, then verbal questions on test cases and the pull-request process.',
            appliesTo: AGODA_ROLE,
            sources: [AGODA_A1_BANGKOK_2026, AGODA_A4_STAFF_2025, AGODA_A5_FULL_STACK_2025, AGODA_A12_BANGALORE_2025, AGODA_INTERVIEWER_GUIDE],
            practice: { label: 'DSA for frontend loops', path: '/guides/interview-blueprint/dsa-for-fe' },
          },
          {
            stage: 'Frontend Platform interview',
            format:
              '60 minutes on HackerRank: a web-fundamentals question-and-answer hour, a JavaScript implementation grown from the resume, or a discussion of component reuse, state, API data and rendering performance; the prep guide promises a code snippet to improve.',
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
            practice: { label: 'Cookie vs sessionStorage vs localStorage', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
          },
          {
            stage: 'Preliminary call',
            format:
              '30 minutes with the recruiter on compensation, relocation and feedback; the level is set here or after the Platform round (a Staff applicant was moved to Senior after round two, strong Senior candidates to the Staff track).',
            appliesTo: AGODA_ROLE,
            sources: [AGODA_A1_BANGKOK_2026, AGODA_A3_OFFER_2025, AGODA_A4_STAFF_2025, AGODA_A8_CULTURE_FIT_2025, AGODA_A9_HEADCOUNT_2025, AGODA_A7_GURGAON_COMMENT],
          },
          {
            stage: 'Architecture interview',
            format:
              '60 minutes: a frontend-flavoured product design such as a hotel search page or a booking app, with no diagram expected; the Staff track adds a BE Platform hour on a hotel booking system.',
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
          'Team-specific: three accounts with different stage orders. Interviewers may sit in Bangkok, and one 2026 senior full-stack account was rejected in Gurgaon\'s second round and received an offer from a Bangkok loop after the six-month cooling period. On 2026-10-21 the board listed no Gurugram front-end-titled role.',
        stages: [
          {
            stage: 'Online assessment or take-home',
            format:
              'HTML/CSS and JavaScript questions in an online assessment, or a take-home such as a React and TypeScript stock dashboard listed as a 120-minute online coding interview.',
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
            format: '60 minutes of JavaScript or DSA problems, on HackerRank in one account; another pairs a substring problem with a debounce utility.',
            appliesTo: 'Front-end and full-stack engineers',
            sources: [AGODA_A7_GURGAON_2025, AGODA_A2_GURGAON_2025, AGODA_A13_SDE2_2024],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
          },
          {
            stage: 'Platform or architecture round',
            format:
              'JavaScript depth (hoisting, class behaviour, SSR versus CSR, atomic design, testing), an hour of frontend architecture for a travel booking site, or a system architecture with a frontend that integrates backend API calls.',
            appliesTo: 'Front-end and full-stack engineers',
            sources: [AGODA_A7_GURGAON_2025, AGODA_A2_GURGAON_2025, AGODA_A13_SDE2_2024],
            practice: { label: 'SSR and hydration in React', path: '/react/trivia/react-ssr-hydration' },
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
      'Thin evidence: one complete 2020 loop, one 2025 screen, one recruiter plan and commenters. The order differs between accounts, some loops use a take-home and others a live screen, and a 2024 senior account counted eight stages without naming them.',
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
              'One coding interview, a take-home review and two behavioural interviews in 2020, with no LeetCode-type questions; a 2024 recruiter plan for an L4 Web UI role lists two technical and two behavioural rounds, possibly algorithms and system design.',
            appliesTo: 'All candidates',
            sources: [NETFLIX_NF2_SENIOR_FE_2020, NETFLIX_NF5_PLAN_2024],
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
      'ElevenLabs says steps vary by role and most processes include a pre-screen, virtual interviews with a possible skills assessment, a hiring-manager conversation and a final round with a founder or Bar Raiser. Five full-stack, frontend-leaning accounts from 2024 to 2026 describe a recruiter call, a coding assessment whose format changes from loop to loop, a live technical round and a final conversation.',
    caveat:
      'Thin evidence: no account covers a purely frontend title, and the assessment formats differ (a 90-minute assessment, an asynchronous CoderPad task, a Python algorithm round, a take-home). A 2025 account had no system design round; a 2024 account did.',
    checkedAt: '2026-10-22',
    variants: [
      {
        title: 'Full-stack engineers, frontend-leaning',
        stages: [
          {
            stage: 'Recruiter call',
            format: 'Background and what interests you about ElevenLabs; in the 2026 account it came after the technical assessment.',
            appliesTo: 'All candidates',
            sources: [ELEVENLABS_CAREERS_FAQ, ELEVENLABS_EL1_SENIOR_2026, ELEVENLABS_EL2_FE_2025, ELEVENLABS_EL3_2024, ELEVENLABS_EL5_2025],
          },
          {
            stage: 'Coding assessment',
            format:
              'The format varies: four questions in 90 minutes (2026), an asynchronous easy or medium algorithm question with a React knowledge check (2024), React and algorithm problems on CoderPad such as fixing a React bug (another 2024 account), a LeetCode-style Python round (2025) or a take-home exercise (another 2025 account).',
            appliesTo: 'All candidates',
            sources: [ELEVENLABS_EL1_SENIOR_2026, ELEVENLABS_EL2_FE_2025, ELEVENLABS_EL3_2024, ELEVENLABS_EL4_2024, ELEVENLABS_EL5_2025],
            practice: { label: 'Poll until, with timeout and abort', path: '/javascript/coding/js-poll-until' },
          },
          {
            stage: 'Live technical round',
            format:
              'Pair work with an engineer: fixing a practical problem (2026), debugging a small React app (2025), building a text-to-speech React component (2024) or a real-life problem with changing constraints (another 2024 account).',
            appliesTo: 'All candidates',
            sources: [ELEVENLABS_EL1_SENIOR_2026, ELEVENLABS_EL2_FE_2025, ELEVENLABS_EL3_2024, ELEVENLABS_EL4_2024],
            practice: { label: 'Fix an async race', path: '/javascript/debug/js-debug-async-race' },
          },
          {
            stage: 'Product or design round',
            format: 'A product interview or a product-focused decomposition interview in the two 2025 accounts, a system design interview in a 2024 account.',
            appliesTo: 'Most loops',
            sources: [ELEVENLABS_EL2_FE_2025, ELEVENLABS_EL4_2024, ELEVENLABS_EL5_2025],
          },
          {
            stage: 'Final conversation',
            format: 'A call with the CTO (2025) or with the head of the organisation, planned but not reached (2024); the careers FAQ names a founder or Bar Raiser.',
            appliesTo: 'All candidates',
            sources: [ELEVENLABS_CAREERS_FAQ, ELEVENLABS_EL3_2024, ELEVENLABS_EL5_2025],
          },
        ],
      },
    ],
  },
  waymo: {
    summary:
      'Waymo\'s hiring page describes a sourcer or recruiter conversation, one or two phone or video interviews with a potential peer or manager, and a virtual onsite of up to five 45-minute interviews. One senior frontend account from 2026 supplies the frontend rounds; a 2026 software engineer loop with a UI round, a 2023 Waymo-tagged commenter and a 2022 intern account add the mix of algorithm and frontend questions.',
    caveat:
      'Thin evidence: one complete frontend loop, curated and edited by PracHub, plus one software engineer loop, one commenter and one intern account. The commenter says the questions vary by interviewer. Waymo does not permit AI tools or LLMs in assessments or live interviews unless the instructions say so.',
    checkedAt: '2026-10-22',
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
              'One or two behavioural or technical interviews with a potential peer or manager, per the hiring page. The 2026 frontend account had a two-part screen: remove the subtrees whose node values contain a substring, then build a UI for the filtered tree. The 2022 intern loop had two back-to-back 45-minute technical interviews, one on JavaScript and one on algorithms.',
            appliesTo: 'All candidates',
            sources: [WAYMO_HOW_WE_HIRE, WAYMO_WM1_SENIOR_FE_2026, WAYMO_WM4_INTERN_2022],
            practice: { label: 'Filter a tree and render it indented', path: '/javascript/coding/js-filter-tree-render-indented' },
          },
          {
            stage: 'Virtual onsite',
            format:
              'Up to five interviews of about 45 minutes with potential teammates and cross-functional partners, per the hiring page. The 2026 frontend account had four frontend rounds: debugging Angular UI code from user-reported issues, a Promise question in plain TypeScript, a frontend-focused design of an AI chat interface, and an autocomplete search bar with debounce. A 2023 Waymo-tagged commenter described two LeetCode and two frontend questions, in Angular and JavaScript, varying by interviewer.',
            appliesTo: 'All candidates',
            sources: [WAYMO_HOW_WE_HIRE, WAYMO_WM1_SENIOR_FE_2026, WAYMO_WM3_COMMENT_2023],
            practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
          },
        ],
      },
      {
        title: 'Software engineers with a UI round, 2026',
        note: 'One account for a software engineer title outside frontend, included because one of its four rounds was a JavaScript UI build.',
        stages: [
          {
            stage: 'Recruiter screen',
            format: 'Current role and backend experience, interest in Waymo and an overview of the process.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
          },
          {
            stage: 'Progressive coding round',
            format: 'One problem whose constraints kept changing, judged on correctness, complexity and adapting the solution while debugging live.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
          },
          {
            stage: 'JavaScript and UI round',
            format: 'Build a generic tree viewer component for hierarchical data, like a file explorer: recursive rendering, semantic lists, expand and collapse, event delegation and its trade-offs.',
            appliesTo: 'The one account',
            sources: [WAYMO_WM2_SWE_2026],
            practice: { label: 'Build a tree from a flat list', path: '/javascript/coding/js-build-tree-from-flat-list' },
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
  },
  anduril: {
    summary:
      'Anduril describes a recruiter call, technical and behavioral interviews and role-specific assessments that could include live coding. Frontend accounts from 2022 to 2025 describe one technical screen with an applied frontend problem, then an onsite of two coding rounds, a system design round and a behavioral interview.',
    caveat:
      'Nine accounts from 2022 to 2025: five on Blind and four reviews re-hosted on Taro.',
    checkedAt: '2026-10-23',
    variants: [
      {
        title: 'Frontend engineers, United States',
        stages: [
          {
            stage: 'Recruiter call',
            format:
              'Resume and past experience. In 2025 one recruiter predicted an algorithm-heavy round that turned out to be two simple JavaScript and React tasks; in another account the coordinator preparation document described the frontend test correctly.',
            appliesTo: 'All candidates',
            sources: [ANDURIL_EARLY_CAREERS, ANDURIL_AN9_OFFER_2022, ANDURIL_AN11_FE_FOCUS_2024, ANDURIL_AN12_CLASS_2025, ANDURIL_AN1_ONSITE_2025],
          },
          {
            stage: 'Technical screen',
            format:
              'About an hour with an applied frontend problem: a file explorer in React in two accounts, or a JavaScript class or component written in an empty file and then moved into React, Vue or Angular. By video in 2022 and on HackerRank in 2025.',
            appliesTo: 'Frontend candidates',
            sources: [ANDURIL_AN12_CLASS_2025, ANDURIL_AN11_FE_FOCUS_2024, ANDURIL_AN9_OFFER_2022, ANDURIL_AN2_OFFER_2023, ANDURIL_AN6_SCREEN_2025],
            practice: { label: 'File explorer tree', path: '/react/coding/react-file-explorer' },
          },
          {
            stage: 'Onsite',
            format:
              'Three or four interviews: two coding rounds, usually one in React and one in plain JavaScript or data structures, one system design round and one behavioral interview. A 2024 candidate flew to Costa Mesa for it.',
            appliesTo: 'Candidates who pass the screen',
            sources: [ANDURIL_AN1_ONSITE_2025, ANDURIL_AN2_OFFER_2023, ANDURIL_AN9_OFFER_2022, ANDURIL_AN11_FE_FOCUS_2024],
            practice: { label: 'React countdown timer', path: '/react/coding/react-countdown-timer' },
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
            format: 'Build a small application; the reported task is a file explorer in React where clicking a folder shows its children.',
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
            practice: { label: 'Fix an async race', path: '/javascript/debug/js-debug-async-race' },
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
      'Capital One describes a recruiter screen, an assessment and a Power Day of four hour-long interviews. Frontend accounts from 2022 to 2024 describe a CodeSignal assessment, then a Power Day with a frontend design round, a frontend technical round, a case built on reading code and a behavioral round.',
    caveat:
      'Built from frontend accounts dated 2022 to 2024, all reviews re-hosted on Taro.',
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
            format: 'CodeSignal, about 70 minutes, four LeetCode-style questions in most accounts and three in one; candidates who solved two or three were still invited.',
            appliesTo: 'All candidates',
            sources: [CAPITALONE_AI_ML_GUIDE, CAPITALONE_CO4_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022, CAPITALONE_CO2_SENIOR_2024],
          },
          {
            stage: 'Power Day: frontend design',
            format:
              'A conversational design of a credit card application page and its confirmation page, with a whiteboard for notes, or the structure of a web app or single-page application from requirements: components, routing, data flow and API calls.',
            appliesTo: 'Frontend engineers',
            sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO3_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022],
            practice: { label: 'Multi-step form with autosave', path: '/system-design/multi-step-form-autosave' },
          },
          {
            stage: 'Power Day: frontend technical',
            format:
              'A small framework task judged on structure, syntax and coding style: a React project, an Angular form with validations, or a form in the candidate framework of choice.',
            appliesTo: 'Frontend engineers',
            sources: [CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022],
            practice: { label: 'Form validation basics', path: '/html/coding/html-forms-validation-required' },
          },
          {
            stage: 'Power Day: case',
            format:
              'A business scenario read through code: find the bug in a budgeting program written by an intern without coding the fix, work example cost calculations and fix a faulty algorithm, or refactor badly written code.',
            appliesTo: 'All candidates',
            sources: [CAPITALONE_AI_ML_GUIDE, CAPITALONE_CO2_SENIOR_2024, CAPITALONE_CO5_SENIOR_2023, CAPITALONE_CO6_FRONTEND_2022],
            practice: { label: 'Fix a defaults bug', path: '/javascript/debug/js-debug-nullish-defaults' },
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
            format: 'A timed assessment; in 2024, four LeetCode questions in 70 minutes, and solving two still led to an invitation.',
            appliesTo: 'The two accounts',
            sources: [CAPITALONE_CO1_LEAD_2024, CAPITALONE_CO7_LEAD_2022],
          },
          {
            stage: 'Power Day',
            format:
              'Four interviews. In 2024: front-end design, behavioral, a case study, and a technical round that built a single-page application like pair programming. In 2022: framework basics, a deployment process design, behavioral, and code to read and improve.',
            appliesTo: 'The two accounts',
            sources: [CAPITALONE_CO1_LEAD_2024, CAPITALONE_CO7_LEAD_2022],
            practice: { label: 'Rewrite a mutating helper', path: '/javascript/debug/js-debug-mutating-input' },
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
  },
};
