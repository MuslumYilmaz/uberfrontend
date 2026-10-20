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
const GOOGLE_GO7 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/1274542/', '2021-06');
const GOOGLE_GO8 = report('Blind comment', 'https://www.teamblind.com/post/Google-Frontend-interview-78mvqUW2', '2021-06');
const GOOGLE_PHONE_2020 = report('LeetCode', 'https://leetcode.com/discuss/post/592667/', '2020-04');

const META_HIRING = official('Meta: Hiring process', 'https://www.metacareers.com/hiring-process/');
const META_FEE_INITIAL = official('Meta: FEE initial interview prep', 'https://www.metacareers.com/FEE-prep-initial/');
const META_FEE_ONSITE = official('Meta: FEE full loop prep', 'https://www.metacareers.com/FEE-prep-onsite/');
const META_TARO = 'https://www.jointaro.com/interviews/companies/meta/experiences';
const META_ME1 = report('Taro', `${META_TARO}/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/`, '2021-12');
const META_ME2 = report('Taro', `${META_TARO}/front-end-engineer-intern-united-states-january-1-2022-accepted-offer-positive-2e0f20e4/`, '2022-01');
const META_ME2B = report('Taro', `${META_TARO}/front-end-engineer-intern-united-states-december-5-2021-accepted-offer-positive-825fe97b/`, '2021-12');
const META_ME3 = report('Medium', 'https://medium.com/@stylus07/meta-interview-experience-cdf53eea63f3', '2022-03');
const META_ME4 = report('Blind', 'https://www.teamblind.com/post/meta-frontend-system-design-yexyrusi', '2022-03');
const META_ME5 = report('Blind', 'https://www.teamblind.com/post/Frontend-interview-experience-CPR8odiD', '2021-10');
const META_ME6 = report('Blind', 'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob', '2021-10');
const META_ME7 = report('Taro', `${META_TARO}/front-end-developer-new-york-ny-november-1-2020-no-offer-positive-b0918a8e/`, '2020-11');
const META_ME8 = report('Blind', 'https://www.teamblind.com/post/meta-front-end-phone-interview-beroc46d', '2023-06');
const META_ME9 = report('Taro', `${META_TARO}/front-end-developer-san-francisco-ca-march-6-2024-no-offer-positive-609eb715/`, '2024-03');
const META_ME10 = report('Taro', `${META_TARO}/frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20/`, '2025-04');
const META_ME11 = report('Taro', `${META_TARO}/frontend-engineer-menlo-park-ca-june-1-2025-accepted-offer-positive-143f4163/`, '2025-06');
const META_ROLE = 'FEE, IC4 to IC6';

const MICROSOFT_HIRING_TIPS = official('Microsoft: Hiring tips', 'https://careers.microsoft.com/v2/global/en/hiring-tips');
const MICROSOFT_STUDENTS = official('Microsoft: Student interviewing', 'https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing');
const MICROSOFT_TARO = 'https://www.jointaro.com/interviews/companies/microsoft/experiences';
const MICROSOFT_MS1 = report('dev.to', 'https://dev.to/dhilipkmr/software-engineer-2-ui-interview-at-microsoft-1i0b', '2020-10');
const MICROSOFT_MS2 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/1254448/', '2021-06');
const MICROSOFT_MS3 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/489795/', '2020-01');
const MICROSOFT_MS4 = report('Taro', `${MICROSOFT_TARO}/front-end-developer-tel-aviv-yafo-october-1-2022-no-offer-negative-7d7887be/`, '2022-10');
const MICROSOFT_MS5 = report('Taro', `${MICROSOFT_TARO}/senior-frontend-engineer-new-york-ny-january-27-2022-no-offer-negative-54d03a33/`, '2022-01');
const MICROSOFT_MS6 = report('LeetCode', 'https://leetcode.com/discuss/interview-question/5335067/', '2024-06');
const MICROSOFT_MS7 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5456468/', '2024-07');
const MICROSOFT_MS8 = report('Taro', `${MICROSOFT_TARO}/frontend-developer-belgrade-central-serbia-may-1-2024-no-offer-negative-380c5ce5/`, '2024-05');
const MICROSOFT_MS9 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/7347058/', '2025-11');
const MICROSOFT_ROLE = 'Frontend roles; varies by team';

const APPLE_TARO = 'https://www.jointaro.com/interviews/companies/apple/experiences';
const APPLE_AP1 = report('LeetCode', 'https://leetcode.com/discuss/post/6979238/', '2025-06');
const APPLE_AP2 = report('Medium', 'https://srijansinghgulati.medium.com/my-apple-interview-experience-and-why-i-declined-the-offer-5ff442962bd8', '2022-07');
const APPLE_AP3 = report('Taro', `${APPLE_TARO}/front-end-developer-cupertino-ca-july-1-2022-no-offer-negative-9299c7ea/`, '2022-07');
const APPLE_AP4 = report('Blind', 'https://www.teamblind.com/post/Apple-frontend-interview-advice-d64Fd3BM', '2022-02');
const APPLE_AP5 = report('Taro', `${APPLE_TARO}/front-end-developer-united-states-august-25-2022-no-offer-positive-ceece13a/`, '2022-08');
const APPLE_AP6 = report('Taro', `${APPLE_TARO}/frontend-engineer-san-francisco-ca-october-1-2023-accepted-offer-positive-e5223424/`, '2023-10');
const APPLE_AP7 = report('Taro', `${APPLE_TARO}/frontend-developer-united-states-february-1-2025-no-offer-neutral-01c585c0/`, '2025-02');
const APPLE_AP8 = report('Blind', 'https://www.teamblind.com/post/my-apple-interview-was-absolutely-brutal-tjrprfjx', '2025-03');
const APPLE_AP9 = report('Taro', `${APPLE_TARO}/front-end-engineer-united-states-august-1-2021-no-offer-negative-2d79a1e7/`, '2021-08');
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
const STRIPE_ST1 = report('Taro', `${STRIPE_TARO}/frontend-engineer-barcelona-october-1-2023-no-offer-neutral-ceb407e7/`, '2023-10');
const STRIPE_ST3 = report('Taro', `${STRIPE_TARO}/frontend-engineer-san-francisco-ca-august-1-2025-no-offer-neutral-8ad7d78f/`, '2025-08');
const STRIPE_ST4 = report('Taro', `${STRIPE_TARO}/front-end-developer-india-november-15-2022-no-offer-positive-f4ea85cd/`, '2022-11');
const STRIPE_ST5 = report('Taro', `${STRIPE_TARO}/frontend-developer-barcelona-march-1-2025-no-offer-positive-c1c921ed/`, '2025-03');
const STRIPE_ST6_PLAN = report('Blind (recruiter plan)', 'https://www.teamblind.com/post/Stripe-frontend-onsite-SfaGgc1a', '2024-11');
const STRIPE_ST7 = report('Blind', 'https://www.teamblind.com/post/stripe-frontend-interview-be7f1ymm', '2024-07');
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
const BYTEDANCE_TT3 = report('Taro', `${BYTEDANCE_TARO}/frontend-engineer-united-states-june-1-2024-declined-offer-neutral-363898ae/`, '2024-06');
const BYTEDANCE_TT4 = report('Taro', `${BYTEDANCE_TARO}/front-end-engineer-united-states-july-8-2024-no-offer-neutral-d83a6ff3/`, '2024-07');
const BYTEDANCE_TT5 = report('Taro', `${BYTEDANCE_TARO}/front-end-developer-san-jose-ca-march-1-2024-no-offer-neutral-fc19c254/`, '2024-03');
const BYTEDANCE_TT6 = report('Taro', `${BYTEDANCE_TARO}/front-end-developer-october-22-2025-accepted-offer-positive-59a98129/`, '2025-10');
const BYTEDANCE_TT7 = report('Taro', `${BYTEDANCE_TARO}/frontend-developer-singapore-november-1-2023-accepted-offer-positive-31530cbd/`, '2023-11');
const BYTEDANCE_TT8 = report('Taro', `${BYTEDANCE_TARO}/frontend-engineer-sydney-september-1-2024-no-offer-neutral-5db123fe/`, '2024-09');
const BYTEDANCE_TT9 = report('Taro', `${BYTEDANCE_TARO}/frontend-developer-singapore-august-1-2025-no-offer-neutral-4e4e5cf8/`, '2025-08');
const BYTEDANCE_TT10 = report('Taro', `${BYTEDANCE_TARO}/frontend-developer-seattle-washington-october-27-2025-no-offer-positive-1abce1a2/`, '2025-10');
const BYTEDANCE_TT11 = report('Taro', `${BYTEDANCE_TARO}/graduate-front-end-developer-sydney-may-1-2024-no-offer-neutral-11f1f10b/`, '2024-05');
const BYTEDANCE_TT12 = report('Taro', `${BYTEDANCE_TARO}/front-end-software-engineer-intern-united-states-august-1-2024-no-offer-neutral-56f0627e/`, '2024-08');
const BYTEDANCE_TT15 = report('Taro', `${BYTEDANCE_TARO}/frontend-developer-singapore-may-1-2024-no-offer-neutral-8a86f039/`, '2024-05');
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
const BOOKINGCOM_BK5 = report('Taro', `${BOOKINGCOM_TARO}/junior-frontend-developer-amsterdam-march-1-2022-accepted-offer-positive-88561605/`, '2022-03');
const BOOKINGCOM_BK6 = report('Taro', `${BOOKINGCOM_TARO}/front-end-software-engineer-ii-amsterdam-june-1-2022-accepted-offer-positive-2d3acd6d/`, '2022-06');
const BOOKINGCOM_BK7 = report('Taro', `${BOOKINGCOM_TARO}/frontend-software-engineer-ii-turkey-january-1-2023-accepted-offer-positive-e4aeb759/`, '2023-01');
const BOOKINGCOM_BK8 = report('Taro', `${BOOKINGCOM_TARO}/junior-frontend-engineer-amsterdam-march-1-2022-accepted-offer-positive-9743e14f/`, '2022-03');
const BOOKINGCOM_BK9 = report('Blind', 'https://www.teamblind.com/post/bookingcom-frontend-interview-experience-owh781q6', '2021-12');
const BOOKINGCOM_BK10 = report('Blind', 'https://www.teamblind.com/post/bookingcom-interview-frontend-fzudnfhv', '2021-11');
const BOOKINGCOM_BK11 = report('Taro', `${BOOKINGCOM_TARO}/frontend-developer-turkey-september-1-2021-no-offer-neutral-8e3079d9/`, '2021-09');

// Datadog, Intuit and ServiceNow.
const DATADOG_CANDIDATE_EXPERIENCE = official('Datadog: Candidate experience', 'https://careers.datadoghq.com/candidate-experience/');
const DATADOG_TARO = 'https://www.jointaro.com/interviews/companies/datadog/experiences';
const DATADOG_DD1 = report('Taro', `${DATADOG_TARO}/senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048/`, '2024-10');
const DATADOG_DD2 = report('Taro', `${DATADOG_TARO}/senior-frontend-engineer-paris-september-1-2025-accepted-offer-positive-2a1ddfe8/`, '2025-09');
const DATADOG_DD3 = report('Taro', `${DATADOG_TARO}/senior-software-engineer-frontend-france-july-1-2023-accepted-offer-positive-b4edf2ad/`, '2023-07');
const DATADOG_DD4 = report('Taro', `${DATADOG_TARO}/senior-software-engineer-frontend-france-october-1-2024-accepted-offer-positive-3bd8f875/`, '2024-10');
const DATADOG_DD5 = report('Taro', `${DATADOG_TARO}/software-engineer-front-end-paris-september-1-2024-accepted-offer-positive-ba0b1dd8/`, '2024-09');
const DATADOG_DD6 = report('Taro', `${DATADOG_TARO}/frontend-engineer-madrid-february-1-2024-accepted-offer-positive-a8de35e5/`, '2024-02');
const DATADOG_DD7 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/7080135', '2025-05');
const DATADOG_DD8 = report('Taro', `${DATADOG_TARO}/senior-frontend-engineer-madrid-community-of-madrid-july-1-2025-no-offer-positive-f1c8b321/`, '2025-07');
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
const INTUIT_IN12 = report('Taro', `${INTUIT_TARO}/staff-frontend-engineer-united-states-august-1-2024-no-offer-negative-3a91fb0d/`, '2024-08');
const INTUIT_IN13 = report('Taro', `${INTUIT_TARO}/senior-software-engineer-frontend-bengaluru-march-1-2022-no-offer-negative-93ee0992/`, '2022-03');
const INTUIT_IN15 = report('Taro', `${INTUIT_TARO}/senior-fullstack-engineer-united-states-december-1-2023-accepted-offer-positive-09501015/`, '2023-12');
const INTUIT_HR_2022 = report('Taro', `${INTUIT_TARO}/senior-front-end-developer-united-states-april-1-2022-no-offer-negative-cd8e79ed/`, '2022-04');
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
const REVOLUT_TARO = 'https://www.jointaro.com/interviews/companies/revolut/experiences';
const REVOLUT_RV1 = report('Taro', `${REVOLUT_TARO}/frontend-developer-warsaw-masovia-april-1-2025-no-offer-neutral-71032bb4/`, '2025-04');
const REVOLUT_RV2 = report('Taro', `${REVOLUT_TARO}/frontend-engineer-barcelona-may-1-2025-no-offer-neutral-3c58f9b9/`, '2025-05');
const REVOLUT_RV3 = report('Taro', `${REVOLUT_TARO}/frontend-engineer-barcelona-march-1-2025-no-offer-neutral-fd597039/`, '2025-03');
const REVOLUT_RV4 = report('Taro', `${REVOLUT_TARO}/senior-frontend-developer-poland-may-1-2024-no-offer-negative-b869132a/`, '2024-05');
const REVOLUT_RV5 = report('Taro', `${REVOLUT_TARO}/senior-frontend-engineer-madrid-april-1-2024-no-offer-neutral-c98763a9/`, '2024-04');
const REVOLUT_RV6 = report('Taro', `${REVOLUT_TARO}/senior-frontend-engineer-react-georgia-february-7-2024-no-offer-neutral-9a9832e4/`, '2024-02');
const REVOLUT_RV7 = report('Taro', `${REVOLUT_TARO}/web-engineer-krakow-september-1-2023-no-offer-neutral-349ae671/`, '2023-09');
const REVOLUT_RV8 = report('Taro', `${REVOLUT_TARO}/senior-front-end-developer-lisbon-lisbon-district-april-24-2023-no-offer-positive-025ce14f/`, '2023-04');
const REVOLUT_RV9 = report('Taro', `${REVOLUT_TARO}/senior-frontend-engineer-berlin-april-1-2022-accepted-offer-positive-aa0a7d87/`, '2022-04');
const REVOLUT_RV10 = report('Taro', `${REVOLUT_TARO}/frontend-developer-portugal-november-5-2025-no-offer-neutral-c06a19bc/`, '2025-11');
const REVOLUT_RV12 = report('Taro', `${REVOLUT_TARO}/senior-frontend-software-engineer-porto-oporto-may-1-2024-no-offer-neutral-90611f7c/`, '2024-05');
const REVOLUT_ROLE = 'Frontend engineers in European hubs';

const SPOTIFY_JOURNEY = official('Spotify: Start your journey', 'https://www.lifeatspotify.com/start-your-journey');
const SPOTIFY_TARO = 'https://www.jointaro.com/interviews/companies/spotify/experiences';
const SPOTIFY_SP1 = report('Blind', 'https://www.teamblind.com/post/spotify-final-round-web-interview-qyug2zqx', '2022-04');
const SPOTIFY_SP1_DESIGN = report('Blind', 'https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg', '2022-04');
const SPOTIFY_SP2 = report('Blind', 'https://www.teamblind.com/post/spotify-senior-web-engineer-interview-k27u5vu7', '2022-04');
const SPOTIFY_SP4 = report('Taro', `${SPOTIFY_TARO}/senior-web-engineer-united-states-august-30-2022-no-offer-neutral-e746c706/`, '2022-08');
const SPOTIFY_SP5 = report('Taro', `${SPOTIFY_TARO}/web-engineer-toronto-on-april-1-2022-no-offer-positive-a2f8744e/`, '2022-04');
const SPOTIFY_SP6 = report('Taro', `${SPOTIFY_TARO}/web-engineer-new-york-ny-april-1-2023-no-offer-negative-5bce68df/`, '2023-04');
const SPOTIFY_SP7 = report('Taro', `${SPOTIFY_TARO}/senior-web-engineer-united-states-september-1-2023-no-offer-negative-890b3570/`, '2023-09');
const SPOTIFY_SP8 = report('Taro', `${SPOTIFY_TARO}/web-engineer-united-states-may-1-2022-no-offer-neutral-70fb53e8/`, '2022-05');
const SPOTIFY_SP9 = report('Taro', `${SPOTIFY_TARO}/software-engineer-new-york-ny-february-1-2025-no-offer-positive-0dc5e197/`, '2025-02');
const SPOTIFY_ROLE = 'Web engineers';

const ZALANDO_HOW_WE_HIRE = official('Zalando: How we hire', 'https://jobs.zalando.com/en/how-we-hire');
const ZALANDO_BLOG = official('Zalando: Technical interviews for software engineers', 'https://jobs.zalando.com/en/blog/technical-interview-for-software-engineers');
const ZALANDO_ZA1 = report('LeetCode', 'https://leetcode.com/discuss/interview-experience/5501338/', '2024-07');
const ZALANDO_ZA2 = report('LeetCode', 'https://leetcode.com/discuss/post/1076335/', '2020-12');
const ZALANDO_ZA3 = report('LeetCode', 'https://leetcode.com/discuss/post/1249280/', '2021-07');
const ZALANDO_ZA4 = report('Blind', 'https://www.teamblind.com/post/zalando-frontend-interviews-asih8pba', '2022-02');
const ZALANDO_ROLE = 'Frontend engineers, Berlin';

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
      'The number of frontend rounds varies, and one account had none. Google\'s pages say AI tools are not permitted in interviews, while a May 2026 news report describes a pilot that allows an approved assistant in one round for some US teams. Confirm the loop with your recruiter.',
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
            format: '45–60 minutes of coding in a shared document, in JavaScript or on an algorithm problem; some candidates have two screens.',
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
            format: 'A design round with a frontend and API focus.',
            appliesTo: 'L5 and above',
            sources: [GOOGLE_GO1, GOOGLE_GO2, GOOGLE_GO8],
            practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
          },
          {
            stage: 'Hiring committee and team match',
            format: 'A committee review after the loop, then team matching.',
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
      'Older accounts from Bangalore describe five or six rounds, more than the official two to four, and some frontend candidates were interviewed mostly on non-frontend material. Ask the recruiter which rounds your team runs.',
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
            format: 'A UI build: one to two hours in plain JavaScript in 2020–2021 accounts from Bangalore, React components in 2024–2025 accounts.',
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
            format: 'Conversations about past work and behaviour.',
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
      'Apple publishes no interview process page. Frontend accounts from 2021 to 2025 describe a recruiter or hiring manager conversation, a 45–60 minute technical screen and a team loop of four to seven interviews that are mostly JavaScript, React and CSS coding.',
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
            sources: [UBER_GUIDE, UBER_UB1, UBER_UB3, UBER_UB4, UBER_UB5],
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
            sources: [UBER_GUIDE, UBER_STORY, UBER_UB2, UBER_UB3, UBER_UB4, UBER_UB5, UBER_UB6],
            practice: { label: 'Todo list with local state', path: '/react/coding/react-todo-list' },
          },
          {
            stage: 'System design',
            format: 'Frontend architecture; two accounts were asked to design a calendar.',
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
            format: '60 minutes of live, multi-part coding in CoderPad, sometimes building a UI component.',
            appliesTo: STRIPE_ROLE,
            sources: [STRIPE_CAREERS, STRIPE_ST3, STRIPE_ST5, STRIPE_ST7],
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
            format: 'HackerRank or CodeSignal with multiple-choice and LeetCode-style questions; a frontend task in 2025.',
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
      'Full-stack and senior roles add backend coding and a system design round. Accounts from 2025 for general software engineer roles describe a take-home assignment instead, so recent frontend loops may differ.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'Frontend engineers, 2021 to 2023',
        stages: [
          {
            stage: 'HackerRank assessment',
            format: '90–100 minutes, about five items: two easy algorithm problems, two HTML and CSS multiple-choice questions and a React component.',
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
            format: 'About 60 minutes with engineering managers.',
            appliesTo: 'All candidates',
            sources: [BOOKINGCOM_BK5, BOOKINGCOM_BK7, BOOKINGCOM_BK8, BOOKINGCOM_BK11],
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
      'ServiceNow\'s hiring page says interview rounds vary by position and may include a technical coding assessment or a presentation. Accounts from India between 2022 and 2025 describe a screening call, two JavaScript-heavy technical rounds, sometimes a design or machine-coding round, and a hiring manager round.',
    caveat:
      'This table covers India only. Accounts from the US describe algorithm-focused loops and plans with the hiring manager first, but they are too few for a table. One 2025 account added a final round with a director.',
    checkedAt: '2026-10-20',
    variants: [
      {
        title: 'UI and frontend engineers in India',
        stages: [
          {
            stage: 'Screening call',
            format: 'A short screening conversation.',
            appliesTo: SERVICENOW_ROLE,
            sources: [SERVICENOW_SN1, SERVICENOW_SN4],
          },
          {
            stage: 'JavaScript fundamentals',
            format: 'One hour on closures, promises, polyfills and output prediction, or JavaScript, HTML and CSS with algorithm problems.',
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
            format: 'One hour mixing JavaScript questions such as Map versus Object, a design task and behavioural questions.',
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
      'Revolut publishes no interview process page. Frontend accounts from 2022 to 2025 across European hubs describe a recruiter or HR screen, a HackerRank test with three algorithm tasks, an hour of React live coding, a system design round for mid and senior roles, a team fit conversation and a Bar Raiser interview.',
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
            sources: [REVOLUT_RV2, REVOLUT_RV3, REVOLUT_RV5, REVOLUT_RV7, REVOLUT_RV12],
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
            sources: [SPOTIFY_JOURNEY, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP8, SPOTIFY_SP9],
            practice: { label: 'The event loop', path: '/javascript/trivia/js-event-loop' },
          },
          {
            stage: 'Final: web practical',
            format: 'A plain HTML, CSS and JavaScript build, such as a form that fetches from an API into the DOM or a traffic light, or web domain questions.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_SP1_DESIGN, SPOTIFY_SP2, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP7, SPOTIFY_SP9],
            practice: { label: 'Forms: validation and required fields', path: '/html/coding/html-forms-validation-required' },
          },
          {
            stage: 'Final: algorithms',
            format: 'An easy to medium LeetCode-style problem.',
            appliesTo: SPOTIFY_ROLE,
            sources: [SPOTIFY_SP1, SPOTIFY_SP2, SPOTIFY_SP4, SPOTIFY_SP5, SPOTIFY_SP6, SPOTIFY_SP9],
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
      'Zalando\'s hiring page describes a 30-minute talent acquisition call, a case study such as a coding exercise, a hiring manager conversation and three to five final interviews. Frontend accounts from Berlin between 2019 and 2024 describe a Codility take-home, then a final day with a review of the take-home, JavaScript fundamentals, coding, system design and a manager conversation.',
    caveat:
      'Zalando\'s own pages disagree on whether the hiring manager comes before or after the coding challenge. Only one detailed account is from after 2022, and all accounts are from Berlin.',
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
            format: 'A Codility challenge done at home in two to three hours: a React and Node app in 2024, easy algorithm problems in 2022.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_ZA1, ZALANDO_ZA2, ZALANDO_ZA4],
            practice: { label: 'React fetch and render a list', path: '/react/coding/react-fetch-list-states' },
          },
          {
            stage: 'Hiring manager',
            format: '30–60 minutes; one account describes it as non-technical.',
            appliesTo: ZALANDO_ROLE,
            sources: [ZALANDO_HOW_WE_HIRE, ZALANDO_BLOG, ZALANDO_ZA2, ZALANDO_ZA3],
          },
          {
            stage: 'Final: take-home review',
            format: '45 minutes discussing the submitted code.',
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
};
