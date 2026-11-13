import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Capital One frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the five prompts here are the answer guides of the frontend design, framework and case rows. The frontend rounds
 * come from Taro re-hosts of Glassdoor reviews (2022 to 2024); the question list adds full-stack and general
 * engineering loops on Taro, Blind and LeetCode (2020 to 2026), kept by content. Nothing here is a leaked, confirmed
 * or official Capital One question, and no frontend account after 2024 describes Power Day.
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
const CAPITALONE_CASE_TIPS_URL = 'https://www.capitalonecareers.com/4-tips-to-ace-your-capital-one-case-interview-101-students';
const CAPITALONE_FRONTEND_POSTING_URL =
  'https://capitalone.wd12.myworkdayjobs.com/Capital_One/job/McLean-VA/Front-End-Engineer-4--JavaScript--TypeScript--Angular-_R1003500-1';

export const CAPITALONE_PREVIEW_TITLE = 'Capital One Frontend Interview Questions and Power Day Guide';
export const CAPITALONE_PREVIEW_H1 = 'Capital One Frontend Interview Questions';
export const CAPITALONE_PREVIEW_DESCRIPTION =
  'Capital One frontend interview: Power Day explained (frontend design, React or Angular technical, case and behavioral hours), CodeSignal and {#questions} reported questions.';
export const CAPITALONE_PREVIEW_CANONICAL_PATH = '/companies/capital-one/preview';
export const CAPITALONE_PREVIEW_TRUST_NOTE =
  'The questions come from public candidate accounts, most of them Glassdoor reviews re-posted on Taro, and are written in our words: they are not leaked, confirmed or official Capital One questions. The answer outlines and practice tasks are written by FrontendAtlas. Your recruiter sends the Power Day schedule, and what they say about each hour outranks these accounts.';

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
      'Senior and lead frontend accounts from 2022 to 2024 describe a CodeSignal assessment, then a Power Day of four one-hour interviews on Zoom: frontend design, a framework round, a case worked through existing code and behavioral questions. The table shows how each round ran; under it are the {questions} questions candidates reported, with the first open.',
    caveat:
      'Most accounts are Glassdoor reviews re-posted on Taro, and none after 2024 describes a frontend Power Day. A front-end-focused engineer on a 2025 full-stack loop met the general coding and backend design rounds instead.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2020–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Capital One frontend loops reward: designing a card application out loud and reading code critically',
    paragraphs: [
      'Two Power Day hours carry the frontend-specific weight in these accounts. In the design hour, three 2024 candidates were handed a credit card screen to design out loud: the application page twice, a card account once. In the case hour the work is reading code someone else wrote: an intern\'s budgeting program, a cost calculation, a cost-summing method, a failing script. Trace example numbers by hand before you name the bug; one candidate had to explain the fix without coding it.',
      'Each frontend loop used one framework: a React project graded on components, syntax and style in 2024, an Angular form in 2023, a form in the candidate\'s chosen framework in 2022. If your recruiter describes a general loop instead, the coding hour is an object-oriented exercise built in levels, such as a banking system or a trie, and the design hour is a backend system; the case and behavioral hours keep the shape described here.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the accounts cover, and the gap after 2024',
    paragraphs: [
      'The frontend rounds come from Glassdoor reviews that senior and lead frontend candidates in the United States wrote between 2022 and 2024, re-posted on Taro, most with a placeholder first-of-the-month date. The question list adds full-stack and general engineering loops from 2020 to 2026 on Taro, Blind and LeetCode, because a front-end-focused engineer on a 2025 full-stack loop met those rounds, and keeps a question only when its subject is frontend or general.',
      'No account after November 2024 describes a frontend Power Day, so whether the 2026 Front-end Engineer 4 and 5 loops keep the design and framework hours is not known; ask the recruiter which rounds you will get and which languages the case code comes in. Capital One\'s careers pages describe Power Day for AI and ML roles and in general terms, not for frontend roles. Employees on Blind reported a hiring freeze in April 2026, while seven frontend postings were open in October 2026.',
    ],
  },
  roundSpotlights: [
    {
      id: 'power-day',
      kicker: 'Round decoder',
      title: 'Capital One Power Day for frontend engineers: the four interviews, hour by hour',
      lede: [
        'Power Day is Capital One\'s final round: four one-hour interviews in one day, virtual on Zoom with video on, after a recruiter screen and a CodeSignal assessment. In the frontend accounts from 2022 to 2024 the four hours are a frontend design round, a frontend technical round, a case built on reading code, and a behavioral round.',
        'The design hour is talked through on a screen whiteboard rather than coded; in 2024 it was about a credit card screen. The technical hour is hands-on work in React, Angular or the framework you pick, graded on component structure, syntax and coding style. The case hands you a business scenario and someone else\'s code to read, and in one account the fix was explained rather than written. The behavioral hour is STAR questions, in one account all about a single past project.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'The final round, after a recruiter screen and a CodeSignal assessment of about 70 minutes with four LeetCode-style problems; candidates who solved two or three were still invited.' },
        { label: 'Length and tool', value: 'Four one-hour interviews in one day, virtual on Zoom with video on. Two 2024 accounts had them back to back, another 2024 day had two 30-minute breaks, and a Capital One employee put their own day at about four and a half hours.' },
        { label: 'Frontend design hour', value: 'Conversational, with a screen whiteboard for notes and no code to write. In the 2024 accounts the subject was a credit card screen.' },
        { label: 'Frontend technical hour', value: 'Hands-on work in React (2024), Angular (2023) or the candidate\'s choice of framework (2022), graded on component structure, syntax and coding style; the 2024 lead loop ran it more like pair programming than an interview.' },
        { label: 'Case hour', value: 'A business scenario worked through existing code, in Java, C++, Node.js or Python in one account, with example numbers to trace and a fix to explain. Capital One\'s page for AI and ML roles says the case is built on its publicly available products and needs no financial background.' },
        { label: 'Behavioral hour', value: 'STAR questions; in one account all about one past project. The behavioral questions candidates reported are open below the question list.' },
        { label: 'After Power Day', value: 'Feedback within a day in one account; in others a pass led to team matching that stalled, a filled position, or a call from another team.' },
        { label: 'Behind these facts', value: 'Glassdoor reviews of senior and lead frontend loops from 2022 to 2024, re-posted on Taro, and Capital One\'s careers pages on Power Day and virtual interviews.' },
      ],
      // The case's own catalog task is Premium, so the rehearsal leads to a free debug task instead.
      practiceLink: { label: 'Rehearse the Power Day case with the free nullish-defaults debug', path: '/javascript/debug/js-debug-nullish-defaults' },
      processLink: { label: 'See the four Power Day rows in the reported process', fragment: 'capital-one-interview-process-1-stage-power-day-frontend-design' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Micro frontends and AI-assisted engineering as practice contexts',
    intro:
      'Both lenses come from the 2026 Front-End Engineer 4 posting, not from an interview account: no frontend Power Day report mentions micro frontends or agentic AI tools, though a 2026 general loop closed its behavioral hour on the use of AI.',
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
    title: 'Answer guides behind the Capital One question list',
    intro:
      'For each question, clarify the requirements, say your structure out loud before you build, handle the failure states, and test the edges.',
    itemListName: 'Capital One answer guides',
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
        resourceLabel: 'Work through the credit card application page case (Premium)',
        resourcePath: '/system-design/credit-card-application-page',
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
        resourceLabel: "Work the intern's budget case: find the bug without coding the fix",
        resourcePath: '/javascript/debug/js-debug-intern-budget-summary',
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
        // The senior account the default list cites names "badly written code"; the 2022 lead account asks the same
        // ("read some code, tell me what it does, and improve it") and stays in the sources.
        reportedRound: { label: CAPITALONE_ANGULAR_2023_LABEL, url: CAPITALONE_ANGULAR_2023_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the card application design before you draw',
    intro:
      'A worked start on the open question: six decisions about the card application, in the order you would talk through them on the screen whiteboard the 2024 round provided.',
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
    intro: 'A week shaped like the Capital One loop: a day for CodeSignal, a day for each Power Day hour, a day for the general rounds some front-end candidates meet, and a full mock day.',
    days: [
      { day: 'Day 1', focus: 'CodeSignal: four LeetCode-style problems in 70 minutes in one sitting, finishing the first two before chasing partial credit on the rest.', artifact: 'A timed run with a note of where the minutes went.' },
      { day: 'Day 2', focus: 'Card application design: the open question\'s application and confirmation pages, talked through on a whiteboard without code.', artifact: 'One sketch of components, form state, submit states and the confirmation page, explained aloud from start to finish.' },
      { day: 'Day 3', focus: 'Framework hour: a small build in React or Angular, written for an engineer who grades component structure, syntax and coding style.', artifact: 'One component you can walk through line by line, with its tests.' },
      { day: 'Day 4', focus: 'The case: short programs in a language you use less, a business rule, and example numbers traced by hand.', artifact: 'Three traced programs, each with its defect and the fix written in a sentence.' },
      { day: 'Day 5', focus: 'General loop fallback: a coding exercise built in levels on CodeSignal, the format a front-end-focused candidate met in a 2025 full-stack loop.', artifact: 'One exercise taken through three levels inside 55 minutes.' },
      { day: 'Day 6', focus: 'Behavioral: STAR stories on learning something new quickly, a disagreement, shifting priorities, mentoring and how you use AI.', artifact: 'Five stories, each saying what you did yourself and how it ended.' },
      { day: 'Day 7', focus: 'Mock Power Day: four one-hour rounds in one day, back to back or with two 30-minute breaks, as 2024 accounts report both.', artifact: 'Your questions for the recruiter: whether your loop has the frontend design and framework hours or the general coding and system design ones, and which languages the case code comes in.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Capital One frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real Capital One questions?',
        answer:
          'They are questions candidates said they were asked, from Glassdoor reviews re-posted on Taro and from posts on Blind and LeetCode, written here in our words. Capital One has not confirmed any of them. Two 2024 accounts name the same credit card application page; most other questions rest on one account each.',
      },
      {
        question: 'What is Capital One\'s Power Day for frontend engineers?',
        answer:
          'Capital One calls its final round Power Day: a series of virtual interviews on Zoom with video on. In the frontend accounts it was four one-hour interviews in one day, back to back in most of them: frontend design, a frontend technical round, a case and behavioral questions.',
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
        question: 'React or Angular: which framework do the rounds use?',
        answer:
          'Both appear. The 2024 frontend technical round used React, the 2023 one was Angular-specific, and a 2022 candidate picked their own framework. The October 2026 Front-end Engineer postings list React, Angular, Vue and Svelte, and one title names JavaScript, TypeScript and Angular.',
      },
      {
        question: 'What is the case interview for an engineer?',
        answer:
          'A business scenario worked through code rather than slides: you read code someone else wrote, trace example numbers and say what is wrong or what you would change. Capital One\'s case tips page uses a business example about raising a bus route\'s profits, but the engineering accounts describe code instead, offered in Java, C++, Node.js or Python in one 2024 loop.',
      },
      {
        question: 'Can I use AI tools in the interview?',
        answer:
          'We found no public Capital One rule on it. Its frontend postings value experience with agentic AI coding tools, and a 2026 loop ended its behavioral hour on the use of AI, so ask your recruiter before the assessment which tools, if any, are allowed in each round.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'Free tasks for what the Capital One hours draw on: reading and fixing code someone else wrote, state and routing in a React or Angular app, and STAR stories. None of them is a reported Capital One question.',
    items: [
      { label: 'Fix a defaults bug in a teammate helper', description: 'Find the defect in code someone else wrote, the core of the case hour.', path: '/javascript/debug/js-debug-nullish-defaults' },
      { label: 'When does a React app need Redux?', description: 'Local state, Context and external stores, for the design and framework hours.', path: '/react/trivia/react-state-management-redux' },
      { label: 'Routing in Angular', description: 'Routes, guards and lazy loading in an Angular app.', path: '/angular/trivia/angular-routing' },
      { label: 'Fetch and render a list with loading, error and empty states', description: 'The request states of a small React component.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Behavioral stories', description: 'A structure for STAR answers.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: CAPITALONE_CARD_DESIGN_2024_LABEL, url: CAPITALONE_CARD_DESIGN_2024_URL, note: 'No offer; Taro gives a placeholder date. After a LinkedIn message to the recruiter, a three-problem CodeSignal assessment, then four back-to-back interviews: the credit card application page with its confirmation page, a React project, a behavioral hour on one past project and a case worked through code. Feedback came in under 24 hours.', kind: 'report' },
      { label: CAPITALONE_LEAD_SPA_2024_LABEL, url: CAPITALONE_LEAD_SPA_2024_URL, note: 'A lead loop: four LeetCode problems in 70 minutes, two solved and an invitation anyway, then frontend design, a behavioral round, a case study and a frontend technical round that felt like pair programming. Rejected by an automated message with no feedback.', kind: 'report' },
      { label: CAPITALONE_ANGULAR_2023_LABEL, url: CAPITALONE_ANGULAR_2023_URL, note: 'An Angular role: four CodeSignal tasks passed with two, then an Angular-specific technical round, a design round, case studies and STAR questions. The candidate passed, but the position had been filled and two weeks of realignment found no team.', kind: 'report' },
      { label: CAPITALONE_SPA_DESIGN_2022_LABEL, url: CAPITALONE_SPA_DESIGN_2022_URL, note: 'Applied for a frontend position: a 70-minute CodeSignal assessment of four problems, then four Zoom interviews, a framework round set on CodeSignal, a frontend design round, STAR questions and a case. Taro labels it an offer; the text says the first team said no and another team\'s hiring manager called a week later.', kind: 'report' },
      { label: CAPITALONE_LEAD_CASE_2022_LABEL, url: CAPITALONE_LEAD_CASE_2022_URL, note: 'A front end lead: an internal recruiter, a timed online assessment, then a four-hour Power Day with four people covering framework basics, a deployment design question, behavioral questions and a code-reading case. About a month from the first call to an offer.', kind: 'report' },
      { label: CAPITALONE_CARD_SYSTEM_DESIGN_2024_LABEL, url: CAPITALONE_CARD_SYSTEM_DESIGN_2024_URL, note: 'Passed Power Day, then waited a month and a half for a team-fit call that did not come. The one question it names is the frontend system design of the credit card application page.', kind: 'report' },
      { label: CAPITALONE_CARD_ACCOUNT_2024_LABEL, url: CAPITALONE_CARD_ACCOUNT_2024_URL, note: 'A recruiter call, three of four CodeSignal problems passed and four one-hour interviews back to back, then a rejection. It names one design question and no other.', kind: 'report' },
      { label: CAPITALONE_FULLSTACK_2025_LABEL, url: CAPITALONE_FULLSTACK_2025_URL, note: 'A front-end-focused engineer on a 2025 full-stack loop: four CodeSignal problems in 70 minutes, then a three-level coding exercise in 55 minutes, a code-based case, a 20-minute behavioral round and a backend system design. A rejection email came the next business day.', kind: 'report' },
      { label: CAPITALONE_BLIND_LOOP_2024_LABEL, url: CAPITALONE_BLIND_LOOP_2024_URL, note: 'A thread opened during a frontend loop. A Capital One employee describes their own process: a five-minute recruiter call, four CodeSignal problems, a Power Day of coding, case, system design and behavioral rounds that ran about four and a half hours, then team matching with two managers; their role is not stated.', kind: 'report' },
      { label: 'Capital One Careers: Insider tips for AI and machine learning interviews', url: CAPITALONE_AI_ML_GUIDE_URL, note: 'Official page for AI and ML candidates. It describes a 70-minute assessment of four questions, a hiring manager interview and a Power Day of four hour-long interviews in coding, system design, behavioral and a case built on public products. It is not a frontend page.', kind: 'official' },
      { label: 'Capital One Careers: What to expect during your interview', url: CAPITALONE_WHAT_TO_EXPECT_URL, note: 'Official general guide: a recruiter screen, a virtual test depending on the position, a 30-minute hiring manager pre-screen, then job fit, behavioral and case interviews, with video required.', kind: 'official' },
      { label: 'Capital One Careers: Tips to nail your virtual interview', url: CAPITALONE_VIRTUAL_INTERVIEW_URL, note: 'Official page defining Power Day as a series of virtual interviews on Zoom, saying not all positions require a case interview, and asking candidates to stay on video.', kind: 'official' },
      { label: 'Capital One Careers: Tips to ace your case interview', url: CAPITALONE_CASE_TIPS_URL, note: 'Official tips written for business cases: a hypothetical scenario close to the job, such as raising a bus route\'s profits, run as an open conversation. The engineering accounts describe a case built on code instead.', kind: 'official' },
      { label: 'Capital One: Front-End Engineer 4 posting, McLean', url: CAPITALONE_FRONTEND_POSTING_URL, note: 'Official posting read in October 2026. It asks for TypeScript and modern frameworks, automated testing and performance tuning, backend-for-frontends and micro frontends, and agentic AI coding tools; it says nothing about the interview.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Capital One practice set',
    copy:
      'Premium unlocks the credit card application page case, the multi-step form with autosave case, the component state from a mock case and the wider premium library for the same skills.',
    buttonLabel: 'Unlock the full Capital One practice set',
    src: 'company_preview_capital_one',
  },
  about: [
    'Capital One frontend interview preparation',
    'Power Day frontend design and case interviews',
    'Credit card application page design',
    'React and Angular framework interviews',
  ],
  indexAnchorLabel: 'Capital One frontend interview questions',
};
