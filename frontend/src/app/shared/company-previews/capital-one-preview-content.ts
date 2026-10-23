import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Capital One frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported frontend accounts (Taro re-hosts of Glassdoor reviews, 2020 to 2025, United States and Canada,
 * with Blind threads for context) and on Capital One careers pages and frontend job postings. Nothing here is a
 * leaked, confirmed or official Capital One question, and the detailed frontend accounts stop in late 2024.
 */
const CAPITALONE_TARO = 'https://www.jointaro.com/interviews/companies/capital-one/experiences';
const CAPITALONE_CARD_DESIGN_2024_URL = `${CAPITALONE_TARO}/senior-frontend-engineer-washington-dc-july-1-2024-no-offer-neutral-3e4968d4/`;
const CAPITALONE_CARD_DESIGN_2024_LABEL = 'Public report: Taro senior frontend engineer Power Day, 2024';
const CAPITALONE_LEAD_SPA_2024_URL = `${CAPITALONE_TARO}/lead-software-engineer-front-end-mclean-va-october-1-2024-no-offer-positive-6427acda/`;
const CAPITALONE_LEAD_SPA_2024_LABEL = 'Public report: Taro lead front-end software engineer Power Day, 2024';
const CAPITALONE_ANGULAR_2023_URL = `${CAPITALONE_TARO}/senior-web-front-end-engineer-mclean-va-february-1-2023-no-offer-negative-b9f0a15e/`;
const CAPITALONE_ANGULAR_2023_LABEL = 'Public report: Taro senior web front end engineer Power Day, 2023';
const CAPITALONE_SPA_DESIGN_2022_URL = `${CAPITALONE_TARO}/senior-software-engineer-united-states-august-1-2022-accepted-offer-neutral-9d67e812/`;
const CAPITALONE_SPA_DESIGN_2022_LABEL = 'Public report: Taro software engineer loop for a frontend position, 2022';
const CAPITALONE_LEAD_CASE_2022_URL = `${CAPITALONE_TARO}/front-end-lead-plano-tx-august-1-2022-declined-offer-neutral-c94a48a3/`;
const CAPITALONE_LEAD_CASE_2022_LABEL = 'Public report: Taro front end lead Power Day, 2022';
const CAPITALONE_CARD_SYSTEM_DESIGN_2024_URL = `${CAPITALONE_TARO}/senior-frontend-engineer-chicago-il-august-1-2024-no-offer-negative-958c2993/`;
const CAPITALONE_CARD_SYSTEM_DESIGN_2024_LABEL = 'Public report: Taro senior frontend engineer who passed Power Day, 2024';
const CAPITALONE_CARD_ACCOUNT_2024_URL = `${CAPITALONE_TARO}/senior-frontend-engineer-united-states-november-1-2024-no-offer-neutral-52591f09/`;
const CAPITALONE_CARD_ACCOUNT_2024_LABEL = 'Public report: Taro senior frontend engineer loop with a card account design, 2024';
const CAPITALONE_FULLSTACK_2025_URL = `${CAPITALONE_TARO}/senior-software-engineer-full-stack-united-states-may-1-2025-no-offer-neutral-ba6cae5b/`;
const CAPITALONE_FULLSTACK_2025_LABEL = 'Public report: Taro full-stack loop of a front-end-focused engineer, 2025';
const CAPITALONE_BLIND_LOOP_2024_URL = 'https://www.teamblind.com/post/help-capital-one-senior-software-engineer-front-end-help-zzkg7yoj';
const CAPITALONE_BLIND_LOOP_2024_LABEL = 'Public report: Blind front end loop thread with an employee account, October 2024';
const CAPITALONE_AI_ML_GUIDE_URL = 'https://www.capitalonecareers.com/insider-tips-for-ai-and-machine-learning-interviews-tech-101-cdev';
const CAPITALONE_WHAT_TO_EXPECT_URL = 'https://www.capitalonecareers.com/what-to-expect-during-your-capital-one-interview-students-101';
const CAPITALONE_VIRTUAL_INTERVIEW_URL = 'https://www.capitalonecareers.com/7-tips-to-nail-your-virtual-interview-101-cul-cdev';
const CAPITALONE_FRONTEND_POSTING_URL =
  'https://capitalone.wd12.myworkdayjobs.com/Capital_One/job/McLean-VA/Front-End-Engineer-4--JavaScript--TypeScript--Angular-_R1003500-1';

export const CAPITALONE_PREVIEW_TITLE = 'Capital One Frontend Interview Questions: 5 Prompts + Guide';
export const CAPITALONE_PREVIEW_H1 = 'Capital One Frontend Interview Questions';
export const CAPITALONE_PREVIEW_DESCRIPTION =
  'Prepare for a Capital One frontend interview with 5 practice prompts modelled on public reports: card application design, SPA build, Angular forms, case code.';
export const CAPITALONE_PREVIEW_CANONICAL_PATH = '/companies/capital-one/preview';
export const CAPITALONE_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Capital One questions.';

export const CAPITALONE_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'capital-one',
  label: 'Capital One',
  title: CAPITALONE_PREVIEW_TITLE,
  h1: CAPITALONE_PREVIEW_H1,
  description: CAPITALONE_PREVIEW_DESCRIPTION,
  canonicalPath: CAPITALONE_PREVIEW_CANONICAL_PATH,
  trustNote: CAPITALONE_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Capital One prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by fifteen public frontend accounts from 2020 to 2025 and by Capital One careers pages: a CodeSignal assessment, then a Power Day of four one-hour interviews covering frontend design, a frontend technical round, a case built on reading code, and behavioral questions.',
    caveat:
      'The evidence is thin and dated: all fifteen accounts are reviews re-hosted on Taro, the newest with round detail is from late 2024, and the official process text is written for AI and ML roles. A front-end-focused candidate on a 2025 full-stack loop met generic coding and backend design rounds instead, so confirm the rounds with your recruiter.',
    chips: ['5 practice prompts', 'React, Angular, TypeScript, case code', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Capital One frontend loops reward: designing a card application out loud and reading code critically',
    paragraphs: [
      'The detailed frontend accounts, from 2022 to 2024, describe a CodeSignal assessment of about 70 minutes with four LeetCode-style questions, where solving two or three can still lead to an invitation, then a Power Day of four one-hour interviews on Zoom, back to back. One is a frontend design round, often a credit card application page with its confirmation page, one is a frontend technical round in React or Angular, one is a case and one is behavioral.',
      'The case is the round candidates prepare least for. In the frontend accounts it is a business scenario read through code: find the bug in a budgeting program written by an intern without coding the fix, work example cost calculations and then fix a faulty algorithm, or refactor badly written code. The Capital One guide for AI and ML candidates describes the case as built around its publicly available products and says no financial background is needed.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish',
    paragraphs: [
      'Fifteen frontend-titled accounts inform this guide, all of them Taro re-hosts of Glassdoor reviews from the United States and Canada, 2020 to 2025, and nine describe Power Day rounds. Blind threads add Capital One employees describing the assessment and their own loops.',
      'Capital One publishes a Power Day description for AI and ML roles and a general interview guide, but no frontend-specific one. Employees on Blind mentioned a hiring freeze in April 2026, while seven frontend postings were open in October 2026.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Micro frontends and AI-assisted engineering as practice contexts',
    intro:
      'These lenses come from Capital One frontend job postings. Choose the one closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Micro frontends and backend-for-frontend layers',
        description:
          'The Front-End Engineer 4 posting asks you to lead the design of client backend-for-frontends and micro frontend or federated application architectures, with automated testing frameworks and web performance tuning.',
        practiceFocus:
          'Ownership boundaries between frontends, a backend-for-frontend that shapes API data for one client, shared dependencies, contract tests and performance budgets per route.',
      },
      {
        title: 'AI-native development practices',
        description:
          'The same posting asks for expertise with agentic AI coding tools and for mentoring engineers in AI-native development practices.',
        practiceFocus:
          'Reviewing and testing AI-generated code and explaining your decisions, which also helps in a case round that asks you to read and improve code.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five Capital One frontend interview practice questions',
    intro:
      'For each prompt, clarify the requirements, say your structure out loud before you build, handle the failure states, and test the edges. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five Capital One frontend interview practice prompts',
    items: [
      {
        id: 'credit-card-application-page-design',
        title: 'Design a credit card application page and its confirmation page',
        statement:
          'In a conversational round with a whiteboard for notes, walk through the components, field validation, submit states and the confirmation page for a card application, from an empty screen to a confirmed result.',
        whatThisMeasures:
          'Component decomposition, form state and validation strategy, handling of sensitive data, and how you communicate a design without writing full code.',
        clarifyFirst: [
          'Ask which fields and steps are required, whether the application can be saved and resumed, and what happens after submit: an instant decision, a pending review or an error.',
          'Confirm accessibility and device expectations, and whether the design covers only the page or also the follow-up messages.',
        ],
        strongAnswer: [
          'Split the page into steps or sections with one owner for form state, and say where validation runs: on blur, before moving to the next step, and on the server.',
          'Keep sensitive fields out of logs, URLs and long-lived client storage, and mask them on the confirmation page.',
          'Design every submit state: idle, submitting, success, decline, review pending and failure, with a retry that cannot submit twice.',
          'Make it accessible: labels, an error summary tied to fields, focus moved to the first error, and keyboard support across steps.',
        ],
        commonMiss:
          'Drawing the happy path only, with no answer for a double submit, a failed request or a pending decision.',
        resourceLabel: 'Work through the multi-step form with autosave case (Premium)',
        resourcePath: '/system-design/multi-step-form-autosave',
        reportedRound: { label: CAPITALONE_CARD_DESIGN_2024_LABEL, url: CAPITALONE_CARD_DESIGN_2024_URL },
      },
      {
        id: 'single-page-app-from-requirements',
        title: 'Structure a single-page application from requirements, then build it with the interviewer',
        statement:
          'Given a short list of requirements, plan the component tree, routes, data flow, state and API calls, then build the first screen together with the interviewer as a pair.',
        whatThisMeasures:
          'Turning requirements into structure, choosing where state lives, and collaborating while you code.',
        clarifyFirst: [
          'Ask which screens and data come first, and what the API returns.',
          'Agree on the framework and whether a state library is expected or optional.',
        ],
        strongAnswer: [
          'Sketch the routes and the component tree first, then name the source of truth for each piece of data: server, URL or local state.',
          'Use a state library only for data many screens share, and say why the rest stays local.',
          'Build one vertical slice end to end, including loading and error states, before adding screens.',
          'Narrate trade-offs and invite the interviewer in, since one account describes this round as more pair programming than interview.',
        ],
        commonMiss:
          'Starting to code components before agreeing on routes and data, then rewriting halfway through.',
        resourceLabel: 'Work through the component state from a mock case (Premium)',
        resourcePath: '/system-design/ui-component-state-from-mock',
        reportedRound: { label: CAPITALONE_LEAD_SPA_2024_LABEL, url: CAPITALONE_LEAD_SPA_2024_URL },
      },
      {
        id: 'angular-form-validation',
        title: 'Add validation to an existing Angular form',
        statement:
          'Starting from a base Angular component, wire a form that adds messages to a list, block invalid input with field validators, and show clear error messages.',
        whatThisMeasures:
          'Angular forms fluency, validation design, and the data flow from form control to list.',
        clarifyFirst: [
          'Ask whether to use reactive or template-driven forms, and which rules apply to each field.',
          'Confirm when errors should appear: on blur, on submit or as the user types.',
        ],
        strongAnswer: [
          'Use reactive forms with a form group, built-in validators and one custom validator where a rule needs it.',
          'Disable submit while the form is invalid or submitting, and reset the form after a successful add.',
          'Show errors next to their fields and announce them to screen readers.',
          'Test a valid add, each invalid case and the reset.',
        ],
        commonMiss:
          'Validating only in the submit handler, so the form shows no errors until it is too late.',
        resourceLabel: 'Compare template-driven and reactive forms (free)',
        resourcePath: '/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales',
        reportedRound: { label: CAPITALONE_ANGULAR_2023_LABEL, url: CAPITALONE_ANGULAR_2023_URL },
      },
      {
        id: 'power-day-case-budgeting-bug',
        title: 'Power Day case: find the bug in budgeting code written by an intern',
        statement:
          'Agree on the requirements of a small budgeting feature, work one example calculation by hand, then read a short function, find the bug and explain the fix without running the code.',
        whatThisMeasures:
          'Reading unfamiliar code, reasoning with concrete numbers, and explaining a fix clearly under time pressure.',
        clarifyFirst: [
          'Restate the business rule in your own words and agree on one worked example before reading the code.',
          'Ask which language the code is in, since accounts mention Java, C++, Node.js and Python.',
        ],
        strongAnswer: [
          'Trace the function with your example values and write down each variable as it changes.',
          'Name the bug precisely: the line, the input that triggers it and the wrong output it produces.',
          'Propose the smallest fix, then one test case that would have caught it.',
          'Mention a second risk you notice, such as rounding or an empty input, without derailing the main fix.',
        ],
        commonMiss:
          'Rewriting the whole function instead of finding the one defect, or guessing without tracing an example.',
        resourceLabel: 'Fix a defaults bug in a teammate helper (free)',
        resourcePath: '/javascript/debug/js-debug-nullish-defaults',
        reportedRound: { label: CAPITALONE_CARD_DESIGN_2024_LABEL, url: CAPITALONE_CARD_DESIGN_2024_URL },
      },
      {
        id: 'read-explain-refactor-code',
        title: 'Read, explain and refactor badly written code',
        statement:
          'Explain what a messy helper does, name its risks, and propose the smallest refactor that keeps its behaviour, then improve it step by step.',
        whatThisMeasures:
          'Code comprehension, risk spotting and safe refactoring, which the case round tests in the accounts.',
        clarifyFirst: [
          'Ask what the function is supposed to do before judging how it does it.',
          'Confirm whether you may change its signature or only its body.',
        ],
        strongAnswer: [
          'Summarize the behaviour in one sentence, including side effects such as mutating its input.',
          'List the risks in order: wrong results, hidden mutation, unreadable logic, performance.',
          'Refactor in small steps that keep behaviour, and say how you would test each step.',
          'Use clear names and extract small pure functions so the result reads like the requirement.',
        ],
        commonMiss:
          'Making the code shorter and cleverer instead of clearer, or changing behaviour without saying so.',
        resourceLabel: 'Rewrite a helper that mutates its input (free)',
        resourcePath: '/javascript/debug/js-debug-mutating-input',
        reportedRound: { label: CAPITALONE_LEAD_CASE_2022_LABEL, url: CAPITALONE_LEAD_CASE_2022_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the card application design before you draw',
    intro:
      'The accounts describe a conversational round with a whiteboard for notes, so say each decision out loud.',
    steps: [
      { title: 'Pin the flow', description: 'Name the steps: basic details, personal information, income, review, submit and confirmation. Ask which are required.' },
      { title: 'Decide state ownership', description: 'One form state for the whole application, saved per step if resume is required, with the server as the final source of truth.' },
      { title: 'Plan validation', description: 'Field rules on blur, a step check before moving on, and server errors mapped back to their fields.' },
      { title: 'Design the submit', description: 'Idle, submitting, success, decline and review pending, with protection against a double submit.' },
      { title: 'Protect sensitive data', description: 'Nothing sensitive in logs, URLs or long-lived storage, and masked values on the confirmation page.' },
      { title: 'Test the edges', description: 'A refresh mid-flow, a slow network, a validation error from the server, and the back button after submit.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Capital One frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'The CodeSignal assessment: four LeetCode-style problems in 70 minutes, roughly easy to hard, with partial credit.', artifact: 'A timed run with notes on which problem to park first.' },
      { day: 'Day 2', focus: 'Frontend design: a card application page and its confirmation page, then a second design from a short requirement list.', artifact: 'Two whiteboard-style designs you can explain in 20 minutes each.' },
      { day: 'Day 3', focus: 'The framework round: a small React or Angular build with a form, validation and a list, judged on structure and style.', artifact: 'A clean component with tests for valid and invalid input.' },
      { day: 'Day 4', focus: 'The case: read short functions in a language you know less well, trace examples by hand and find one bug in each.', artifact: 'Five traced examples with the bug and the smallest fix written down.' },
      { day: 'Day 5', focus: 'Refactoring: take messy helpers, explain them, and refactor in small steps that keep behaviour.', artifact: 'Three before-and-after helpers with a test each.' },
      { day: 'Day 6', focus: 'Behavioral: STAR stories on learning something quickly, a disagreement, shifting priorities and a project you led.', artifact: 'Five stories with a measurable result each.' },
      { day: 'Day 7', focus: 'Mock Power Day: four one-hour rounds back to back with short breaks.', artifact: 'Questions for the recruiter about the rounds, the framework and team matching.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Capital One frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real Capital One questions?',
        answer:
          'No. They are FrontendAtlas practice versions modelled on round types in public, self-reported accounts. Some accounts repeat the same prompts, such as the card application page, but treat the exact wording as unknown.',
      },
      {
        question: 'What is Power Day?',
        answer:
          'Capital One calls its final round Power Day: a series of virtual interviews on Zoom with video on. In the frontend accounts it was four one-hour interviews back to back: frontend design, a frontend technical round, a case and behavioral questions.',
      },
      {
        question: 'What is on the CodeSignal assessment?',
        answer:
          'Four LeetCode-style problems in about 70 minutes in most accounts, roughly easy to hard. Candidates solved two or three and were still invited. The Capital One guide for AI and ML roles calls its version of the assessment pass or fail.',
      },
      {
        question: 'Is the 2026 frontend loop still frontend-specific?',
        answer:
          'The public accounts cannot tell. The newest detailed frontend account is from late 2024, and a front-end-focused engineer on a 2025 full-stack loop met a three-level coding exercise and a backend system design. Ask your recruiter which rounds the Front-end Engineer roles use.',
      },
      {
        question: 'Can I use AI tools in the interview?',
        answer:
          'We found no public Capital One rule on it. Its frontend postings value experience with agentic AI coding tools, so ask your recruiter before the assessment which tools, if any, are allowed in each round.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the form validation, code reading, refactoring, state and routing skills used by the practice prompts.',
    items: [
      { label: 'Form validation with required fields', description: 'Required fields, constraints and validation messages for the application and framework rounds.', path: '/html/coding/html-forms-validation-required' },
      { label: 'Fix a defaults bug in a teammate helper', description: 'Read code someone else wrote and find the defect, as the case round asks.', path: '/javascript/debug/js-debug-nullish-defaults' },
      { label: 'Rewrite a helper that mutates its input', description: 'Explain and refactor clever code safely, for the read-and-improve case.', path: '/javascript/debug/js-debug-mutating-input' },
      { label: 'When does a React app need Redux?', description: 'Local state, Context and external stores for the single-page application round.', path: '/react/trivia/react-state-management-redux' },
      { label: 'Template-driven versus reactive forms in Angular', description: 'Which form approach scales, for the Angular validation round.', path: '/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales' },
      { label: 'Routing in Angular', description: 'Routes, guards and lazy loading for structuring a single-page application.', path: '/angular/trivia/angular-routing' },
      { label: 'Fetch and render a list with loading, error and empty states', description: 'The request-state core of a small React project.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Behavioral stories', description: 'A structure for the STAR questions in the behavioral round.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: CAPITALONE_CARD_DESIGN_2024_LABEL, url: CAPITALONE_CARD_DESIGN_2024_URL, note: 'A re-hosted Glassdoor review with a placeholder date and no offer. It establishes a CodeSignal assessment, a credit card application page and confirmation page design, a React project round, a behavioral round and a case built on finding a bug in an intern budgeting program.', kind: 'report' },
      { label: CAPITALONE_LEAD_SPA_2024_LABEL, url: CAPITALONE_LEAD_SPA_2024_URL, note: 'A re-hosted Glassdoor review of a lead loop without an offer. It establishes four LeetCode questions in 70 minutes and a Power Day with front-end design, behavioral, case study and a technical round that built a single-page application like pair programming.', kind: 'report' },
      { label: CAPITALONE_ANGULAR_2023_LABEL, url: CAPITALONE_ANGULAR_2023_URL, note: 'A re-hosted Glassdoor review of an Angular role. It establishes four CodeSignal tasks passed with two, an Angular-specific round with a form validation task, web app design from requirements, case studies with a refactoring exercise, and a pass followed by a filled position.', kind: 'report' },
      { label: CAPITALONE_SPA_DESIGN_2022_LABEL, url: CAPITALONE_SPA_DESIGN_2022_URL, note: 'A re-hosted Glassdoor review whose author applied for a frontend position. It establishes a 70-minute CodeSignal assessment, a forms prompt in a framework of choice, a single-page application design prompt, and a cost-calculation case ending in a faulty algorithm.', kind: 'report' },
      { label: CAPITALONE_LEAD_CASE_2022_LABEL, url: CAPITALONE_LEAD_CASE_2022_URL, note: 'A re-hosted Glassdoor review of a lead loop that reached an offer in about a month. It establishes a timed assessment, a four-hour Power Day, a framework question, a deployment process design and a read-and-improve code question.', kind: 'report' },
      { label: CAPITALONE_CARD_SYSTEM_DESIGN_2024_LABEL, url: CAPITALONE_CARD_SYSTEM_DESIGN_2024_URL, note: 'A re-hosted Glassdoor review from a candidate who passed Power Day and waited for a team fit call that did not come. It establishes a frontend system design of the credit card application page.', kind: 'report' },
      { label: CAPITALONE_CARD_ACCOUNT_2024_LABEL, url: CAPITALONE_CARD_ACCOUNT_2024_URL, note: 'A re-hosted Glassdoor review without an offer. It establishes a recruiter call, three of four CodeSignal problems passed, four one-hour interviews back to back, and a credit card account design question.', kind: 'report' },
      { label: CAPITALONE_FULLSTACK_2025_LABEL, url: CAPITALONE_FULLSTACK_2025_URL, note: 'A re-hosted Glassdoor review from a front-end-focused engineer on a 2025 full-stack loop. It establishes the generic rounds: a three-level coding exercise, a code-based case on virtual card transactions, a behavioral round and a backend system design.', kind: 'report' },
      { label: CAPITALONE_BLIND_LOOP_2024_LABEL, url: CAPITALONE_BLIND_LOOP_2024_URL, note: 'A thread opened during a frontend loop. A Capital One employee describes their own process: a short recruiter call, four CodeSignal questions, a Power Day of coding, case, system design and behavioral rounds, then team matching; their role is not stated.', kind: 'report' },
      { label: 'Capital One Careers: Insider tips for AI and machine learning interviews', url: CAPITALONE_AI_ML_GUIDE_URL, note: 'Official page for AI and ML candidates. It describes a 70-minute assessment of four questions, a hiring manager interview and a Power Day of four hour-long interviews in coding, system design, behavioral and a case built on public products. It is not a frontend page.', kind: 'official' },
      { label: 'Capital One Careers: What to expect during your interview', url: CAPITALONE_WHAT_TO_EXPECT_URL, note: 'Official general guide: a recruiter screen, a virtual test depending on the position, a 30-minute hiring manager pre-screen, then job fit, behavioral and case interviews, with video required.', kind: 'official' },
      { label: 'Capital One Careers: Tips to nail your virtual interview', url: CAPITALONE_VIRTUAL_INTERVIEW_URL, note: 'Official page defining Power Day as a series of virtual interviews on Zoom, saying not all positions require a case interview, and asking candidates to stay on video.', kind: 'official' },
      { label: 'Capital One: Front-End Engineer 4 posting, McLean', url: CAPITALONE_FRONTEND_POSTING_URL, note: 'Official posting read in October 2026. It asks for TypeScript and modern frameworks, automated testing and performance tuning, backend-for-frontends and micro frontends, and agentic AI coding tools; it says nothing about the interview.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Capital One practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the multi-step form with autosave case, the component state from a mock case and the wider premium library for the same skills.',
    buttonLabel: 'Unlock the full Capital One practice set',
    src: 'company_preview_capital_one',
  },
  about: [
    'Capital One frontend interview preparation',
    'Power Day frontend design and case interviews',
    'Credit card application page design',
    'React and Angular form validation',
  ],
  indexAnchorLabel: 'Capital One frontend interview questions',
};
