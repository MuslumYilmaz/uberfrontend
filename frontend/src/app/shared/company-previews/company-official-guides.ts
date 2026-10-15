/**
 * Preparation pages that companies publish themselves. Rendered as a table on every company preview that has
 * rows; companies without a published page (Apple, Stripe and the registry companies) render nothing.
 * Keep `covers` to what the page actually says; these are official pages, so links keep the default rel.
 */
export type CompanyOfficialGuide = {
  readonly label: string;
  readonly url: string;
  readonly covers: string;
  /** YYYY-MM-DD, the day the page was last read. */
  readonly checkedAt: string;
};

const CHECKED = '2026-10-15';

export const COMPANY_OFFICIAL_GUIDES: Readonly<Record<string, readonly CompanyOfficialGuide[]>> = {
  amazon: [
    {
      label: 'Front End Engineer interview prep',
      url: 'https://amazon.jobs/content/en/how-we-hire/fee-interview-prep',
      covers:
        'An online assessment (90-minute coding, 20-minute system design scenarios and a work-style survey), a 60-minute phone screen split between Leadership Principles and front-end coding, and a loop of four 55-minute interviews with at least one front-end system design question.',
      checkedAt: CHECKED,
    },
    {
      label: 'Front End Engineer interview prep for students',
      url: 'https://amazon.jobs/content/en/how-we-hire/university/front-end-engineer',
      covers:
        'The intern and new-graduate rounds, the technical topics (logical and maintainable code, data structures and algorithms, JavaScript, CSS, HTML) and the behavioural format with the STAR method.',
      checkedAt: CHECKED,
    },
    {
      label: 'Interviewing at Amazon',
      url: 'https://www.amazon.jobs/en/landing_pages/interviewing-at-amazon',
      covers: 'The hub for every role-specific preparation page, remote interview setup and accommodations.',
      checkedAt: CHECKED,
    },
    {
      label: 'Leadership Principles',
      url: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles',
      covers: 'The principles behind the behavioural questions that open every interview in the loop.',
      checkedAt: CHECKED,
    },
    {
      label: 'Software development interview topics',
      url: 'https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics',
      covers:
        'The general technical topic list: data structures, algorithms, object-oriented design, databases, distributed computing, operating systems and internet topics.',
      checkedAt: CHECKED,
    },
  ],
  google: [
    {
      label: 'How we hire',
      url: 'https://www.google.com/about/careers/applications/how-we-hire/',
      covers: 'Google\'s description of its hiring process, with links to interview preparation and the careers help centre.',
      checkedAt: CHECKED,
    },
    {
      label: 'Interviewing at Google: best practices, advice and tips',
      url: 'https://www.google.com/about/careers/applications/interview-tips',
      covers: 'Google\'s own preparation page with its interview best practices and advice.',
      checkedAt: CHECKED,
    },
  ],
  meta: [
    {
      label: 'Hiring process',
      url: 'https://www.metacareers.com/hiring-process/',
      covers:
        'The stages from application to offer, role-specific prep guides and a CoderPad practice environment in the Career Profile, and the AI-native coding interview with a built-in assistant.',
      checkedAt: CHECKED,
    },
    {
      label: 'Preparing for your initial Front End Engineer interview',
      url: 'https://www.metacareers.com/FEE-prep-initial/',
      covers:
        'A 60-minute conversation with an engineer that assesses technical and behavioural skills, with a downloadable initial interview guide written by Meta\'s front-end engineers.',
      checkedAt: CHECKED,
    },
  ],
  microsoft: [
    {
      label: 'Hiring tips',
      url: 'https://careers.microsoft.com/v2/global/en/hiring-tips',
      covers:
        'The seven hiring stages, typically two to four interview conversations of up to an hour each, and the candidate code of conduct on AI use.',
      checkedAt: CHECKED,
    },
    {
      label: 'Interview tips',
      url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html',
      covers:
        'Advice to clarify requirements, state assumptions and explain your approach on coding tasks, the six culture focus areas and the STAR(R) answer structure.',
      checkedAt: CHECKED,
    },
  ],
  uber: [
    {
      label: 'Frontend Engineering Interview Guide',
      url: 'https://jobs.uber.com/en/uber-interview-guide/frontend-engineering-interview-guide/',
      covers:
        'A recruiter conversation, a HackerRank assessment, a 60-minute technical phone screen on coding and design, then three 60-minute interviews: algorithms and data structures, depth in specialisation, and collaboration and leadership.',
      checkedAt: CHECKED,
    },
    {
      label: 'Landing the job at Uber: Front-End Engineer',
      url: 'https://jobs.uber.com/en/people-stories/interview-prep/landing-the-job-at-uber-front-end-engineer/',
      covers:
        'An Uber engineer\'s account of the loop: a vanilla JavaScript assessment, algorithms, web specialisation, system design and a hiring manager conversation, with advice to cap practice problems at 20 minutes.',
      checkedAt: CHECKED,
    },
    {
      label: 'Get interview ready',
      url: 'https://jobs.uber.com/en/get-interview-ready/',
      covers: 'The hub that links every Uber interview guide, including the engineering guides by domain.',
      checkedAt: CHECKED,
    },
  ],
  openai: [
    {
      label: 'Interview guide',
      url: 'https://openai.com/interview-guide/',
      covers:
        'OpenAI\'s own description of its process, starting with application review by the recruiting team and introductory calls with a recruiter or hiring manager.',
      checkedAt: CHECKED,
    },
  ],
  bytedance: [
    {
      label: 'Interview tips (ByteDance early careers)',
      url: 'https://jobs.bytedance.com/en/campus/interview-tips',
      covers:
        'Two to three interviews; technical interviews assess problem solving and computer science fundamentals through coding, algorithm and design skills, with advice to practise on HackerRank and Nowcoder, test solutions and think out loud.',
      checkedAt: CHECKED,
    },
    {
      label: 'Interview tips (TikTok early careers)',
      url: 'https://careers.tiktok.com/m/campus/interview-tips',
      covers: 'The same early-careers guidance published on the TikTok careers site.',
      checkedAt: CHECKED,
    },
  ],
  netflix: [
    {
      label: 'New grads',
      url: 'https://jobs.netflix.com/careers/new-grads',
      covers:
        'The new-graduate process: a take-home assessment followed by two rounds of interviews, with roles typically posted in late September or October.',
      checkedAt: CHECKED,
    },
    {
      label: 'Internships',
      url: 'https://jobs.netflix.com/careers/internships',
      covers:
        'A take-home assessment followed by two to three interview rounds that assess technical, role-specific and behavioural skills.',
      checkedAt: CHECKED,
    },
    {
      label: 'Netflix culture memo',
      url: 'https://jobs.netflix.com/culture',
      covers: 'The culture memo that interview questions draw on, including which parts resonate with you and which do not.',
      checkedAt: CHECKED,
    },
  ],
  airbnb: [
    {
      label: 'Careers FAQ',
      url: 'https://careers.airbnb.com/faq/',
      covers:
        'What the interview process can involve (a test, a video or an event), meeting multiple members of the team, response times and the recruiting-scam warning.',
      checkedAt: CHECKED,
    },
  ],
};
