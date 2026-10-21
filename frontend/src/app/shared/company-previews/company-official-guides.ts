/**
 * Preparation pages that companies publish themselves. Rendered as a table on every company preview that has
 * rows; companies without a published page (Apple, for example) render nothing.
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
const CHECKED_OCT_20 = '2026-10-20';
const CHECKED_OCT_21 = '2026-10-21';

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
    {
      label: 'Preparing for your full loop Front End Engineer interview',
      url: 'https://www.metacareers.com/FEE-prep-onsite/',
      covers:
        'At least three conversations with engineers, with a downloadable full-loop guide: 4 to 6 interviews covering JavaScript coding without dynamic programming, a 45-minute UI architecture and design interview without code, and a 45-minute behavioural session.',
      checkedAt: CHECKED_OCT_20,
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
      covers:
        'The same early-careers guidance as the ByteDance page, plus a note that some roles and regions invite candidates to an assessment that can take a few hours, sometimes alongside other candidates.',
      checkedAt: CHECKED_OCT_20,
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
  datadog: [
    {
      label: 'Candidate experience',
      url: 'https://careers.datadoghq.com/candidate-experience/',
      covers:
        'The hiring steps: an initial screen with a recruiter and/or the hiring manager, interviews that may run in several rounds or panels with one step expected in person, a take-home project and an executive interview for some roles, then selection.',
      checkedAt: CHECKED_OCT_20,
    },
    {
      label: 'AI guidelines for interviews',
      url: 'https://careers.datadoghq.com/candidate-experience/interviewing-at-datadog-ai-guidelines/',
      covers: 'AI-assisted coding interviews for certain roles, announced in advance; otherwise no AI tools during live coding interviews.',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  elevenlabs: [
    {
      label: 'Careers FAQ',
      url: 'https://elevenlabs.io/careers',
      covers:
        'Most processes include a pre-screen, virtual interviews (sometimes with a take-home or case study), a hiring manager conversation and a final round with a founder or Bar Raiser.',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  stripe: [
    {
      label: 'Careers FAQ',
      url: 'https://stripe.com/careers',
      covers: 'Most processes include a recruiter screen, a technical or skills-based assessment and a series of interviews with the team the candidate would join.',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  intuit: [
    {
      label: 'Hiring process',
      url: 'https://www.intuit.com/careers/hiring-process/',
      covers:
        'An interview day that starts with set-up and a craft demonstration (engineers get 90 minutes to prepare a technical question they then present), followed by assessor, team member and manager interviews, with the length and panel size of each.',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  waymo: [
    {
      label: 'How we hire',
      url: 'https://careers.withwaymo.com/how-we-hire',
      covers:
        'A first conversation with a sourcer or recruiter, one or two behavioural or technical phone or video interviews, then a virtual onsite with up to five interviewers of about 45 minutes each; AI tools are not allowed unless the instructions say so.',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  servicenow: [
    {
      label: 'How we hire',
      url: 'https://careers.servicenow.com/how-we-hire/',
      covers:
        'Three steps (application, interview, decision); interview rounds vary by position and may include a technical coding assessment or a presentation, followed by a debrief and a final decision.',
      checkedAt: '2026-10-07',
    },
  ],
  spotify: [
    {
      label: 'Start your journey',
      url: 'https://www.lifeatspotify.com/start-your-journey',
      covers:
        'A video or telephone interview with a recruiter, a second interview with one or two team members, and a final round with several team members, where one interviewer leads and the others shadow.',
      checkedAt: CHECKED_OCT_20,
    },
    {
      label: 'Interview FAQ',
      url: 'https://www.lifeatspotify.com/start-your-journey/faq',
      covers: 'Practical questions about the process, including the tools used for technical interviews (CoderPad and Mural).',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  'booking-com': [
    {
      label: 'Start your journey',
      url: 'https://careers.booking.com/start-your-journey/',
      covers:
        'The steps from application to feedback: a call with a sourcer or recruiter, several interview rounds with the manager, teammates and colleagues that depend on department and seniority, technical tests and coding interviews for some technical roles, and feedback within a week.',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  zalando: [
    {
      label: 'How we hire (Tech)',
      url: 'https://jobs.zalando.com/en/how-we-hire',
      covers:
        'A 30-minute call with a Talent Acquisition Partner, a case study such as a coding exercise, a 45–60 minute conversation with the hiring manager or team lead, and final interviews (3–5 interviews of 45–60 minutes each).',
      checkedAt: CHECKED_OCT_20,
    },
    {
      label: 'Technical interviews for software engineers',
      url: 'https://jobs.zalando.com/en/blog/technical-interview-for-software-engineers',
      covers:
        'A 2023 article on the engineering loop: a talent acquisition call, a hiring manager interview, a coding interview, a system design and architecture interview and a general tech interview, over two to three weeks.',
      checkedAt: CHECKED_OCT_20,
    },
  ],
  xai: [
    {
      label: 'Careers page: What to expect',
      url: 'https://x.ai/careers',
      covers:
        'Four steps: the team reviews the CV and a statement of exceptional work; a short screening interview with short technical questions and a review of your background; technical interviews that dive deep into your technical expertise; then an offer. The page says "We generally do not use recruiters for assessments." and that applications are evaluated by technical team members.',
      checkedAt: CHECKED_OCT_21,
    },
    {
      label: 'Frontend Engineer posting, London (closed February 2026)',
      url: 'https://www.builtinlondon.uk/job/frontend-engineer/7805551',
      covers:
        'An initial technical screening with basic technical questions (15 minutes), a React coding interview (45 minutes), an HTML/CSS/Tailwind coding interview (45 minutes) and a final stage with founding engineer Toby Pohlen (30 minutes), all conducted via Google Meet.',
      checkedAt: CHECKED_OCT_21,
    },
    {
      label: 'React Frontend Engineer posting, grok.com & API (closed January 2026)',
      url: 'https://builtin.com/job/react-frontend-engineer-grokcom-api/4446453',
      covers:
        'A 15-minute phone interview with some basic technical questions, then two technical interviews: a coding interview in TypeScript to write a small app in React, and an HTML/CSS interview implementing a UI from a screenshot.',
      checkedAt: CHECKED_OCT_21,
    },
  ],
  jpmorgan: [
    {
      label: 'How we hire',
      url: 'https://www.jpmorganchase.com/careers/how-we-hire',
      covers:
        'The four steps (Explore, Apply, Interview, Decision) and the statement that the interview process will differ for each position, with several people met across multiple rounds.',
      checkedAt: CHECKED_OCT_21,
    },
    {
      label: 'Hiring FAQs',
      url: 'https://www.jpmorganchase.com/careers/how-we-hire/faqs',
      covers:
        'The assessment types (structured live interviews, on-demand recorded interviews and virtual skills assessments), technical assessments as online tests or live technical interviews with an interviewer, and the note that many assessments may not be retaken for a designated timeframe.',
      checkedAt: CHECKED_OCT_21,
    },
    {
      label: 'Software Engineer Program',
      url: 'https://www.jpmorganchase.com/careers/explore-opportunities/programs/software-engineer-fulltime',
      covers:
        'The full-time programme\'s Front-end Developer track: AI-powered interfaces such as chat assistants with streaming responses and citations, design systems and accessibility standards, secure authentication, and frameworks such as React, Swift and Kotlin. It describes no interview format.',
      checkedAt: CHECKED_OCT_21,
    },
  ],
  agoda: [
    {
      label: 'How we hire: the Tech team interview process',
      url: 'https://careersatagoda.com/blog/how-we-hire-agodas-tech-team-interview-process/',
      covers:
        'A HackerRank online test as the coding assessment, the four rounds the Tech interview process typically includes (Coding, Platform, System Design and Agoda Culture Fit), a final decision typically within two weeks of the last interview round, and the front-end stack (TypeScript with React and Redux, Rspack and Vite for bundling, micro-front-end and cross-platform solutions).',
      checkedAt: CHECKED_OCT_21,
    },
    {
      label: 'Interview guide',
      url: 'https://careersatagoda.com/interview/',
      covers:
        'The CAR method (Context, Action, Results) used in interviews, two rounds of video interviews before the final stages for most candidates, and the parts of the process (live system design, technical Q&A and behavioural interviews) that must be completed without AI unless the candidate is asked to use it.',
      checkedAt: CHECKED_OCT_21,
    },
    {
      label: 'Preparing for an interview at Agoda (Agoda Engineering)',
      url: 'https://medium.com/agoda-engineering/preparing-for-interview-at-agoda-2c07b7d13ca5',
      covers:
        'A 2023 interviewer\'s guide to the Coding round (testing skills, critical and systematic thinking, code efficiency and readability, computer science knowledge) and the Platform round (implementing something related to Agoda, and reviewing, fixing and improving a given code snippet as a lint tool would).',
      checkedAt: CHECKED_OCT_21,
    },
  ],
  shopee: [
    {
      label: 'How we hire',
      url: 'https://careers.shopee.sg/how-we-hire',
      covers:
        'Shopee\'s five hiring steps: Apply; Getting to Know You (a conversation with a recruiter); Putting Your Skills to the Test (depending on the role, additional tasks or assessments such as a coding, technical or role-specific assessment); Meet the Hiring Manager (questions about experiences, hypothetical scenarios or role-specific cases); and Preparing to Join Us (the offer by phone or email). Its FAQ says the number of rounds varies depending on the role and seniority and that the recruiter shares the details.',
      checkedAt: CHECKED_OCT_21,
    },
  ],
};
