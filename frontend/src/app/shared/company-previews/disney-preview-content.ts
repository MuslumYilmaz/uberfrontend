import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Disney frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the prompts here are the answer guides of the scoreboard, take-home, review,
 * feature flag and API service rows. The accounts are reviews re-hosted on Taro (2015 to 2025), Blind posts and
 * comments (2022 and 2025), a lead account that PracHub curated (2025) and a LeetCode post (2021); Disney's Candidate
 * Resources, AI Usage Guidelines, Life at Disney interview tips and recruiter podcast give the official steps. All were
 * read again between 11 and 14 November 2026. Every source is one the process table already cites, so the sources list
 * adds none. No take-home brief is public, and the guide names each task only in its account's words. Disney teams each
 * run their own loop, and nothing here is a leaked, confirmed or official Disney question.
 */
const DISNEY_TARO = 'https://www.jointaro.com/interviews/companies/disney/experiences';
const DISNEY_D1_URL = `${DISNEY_TARO}/software-engineer-ii-frontend-bergen-op-zoom-may-1-2025-no-offer-positive-1707e185/`;
const DISNEY_D1_LABEL = 'Public report: Taro software engineer II (frontend) round, 2025';
const DISNEY_D7_URL = `${DISNEY_TARO}/full-stack-web-developer-united-states-june-16-2021-no-offer-negative-5fbbceee/`;
const DISNEY_D7_LABEL = 'Public report: Taro full-stack web developer loop, 2021';
const DISNEY_D20_URL = `${DISNEY_TARO}/software-engineer-glendale-ca-september-27-2024-no-offer-positive-a4213d93/`;
const DISNEY_D20_LABEL = 'Public report: Taro frontend-focused contract role loop, 2024';
const DISNEY_D21_URL = `${DISNEY_TARO}/software-engineer-new-york-ny-august-18-2023-accepted-offer-neutral-1e34dfa8/`;
const DISNEY_D21_LABEL = 'Public report: Taro software engineer loop with a React take-home, 2023';
const DISNEY_DC8_URL =
  'https://prachub.com/interview-experiences/disney-seniorplus-lead-software-engineer-interview-experience-four-part-onsite-with-a-code-review-and-whiteboard-system-design';
const DISNEY_DC8_LABEL = 'Public report: PracHub lead software engineer (frontend) loop, 2025';

export const DISNEY_PREVIEW_TITLE = 'Disney Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const DISNEY_PREVIEW_H1 = 'Disney Frontend Interview Questions';
export const DISNEY_PREVIEW_DESCRIPTION =
  'Disney frontend interview: a live React round or a take-home and the code review after it, STAR behavioural rounds, AI limits and {#questions} reported questions.';
export const DISNEY_PREVIEW_CANONICAL_PATH = '/companies/disney/preview';
export const DISNEY_PREVIEW_TRUST_NOTE =
  "Each question here traces back to a candidate's account on Taro, Blind, PracHub or LeetCode: most are reviews that Taro re-hosts in its own wording, and the PracHub account is one that PracHub curated and edited. We retell each one in our own words, staying close to what its account says: they are candidates' reports, not leaked material, and Disney has neither confirmed nor published any of them. FrontendAtlas wrote every answer guide. Read an account as a record of one team's loop in one year, not as a process Disney runs everywhere.";

export const DISNEY_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'disney',
  label: 'Disney',
  title: DISNEY_PREVIEW_TITLE,
  h1: DISNEY_PREVIEW_H1,
  description: DISNEY_PREVIEW_DESCRIPTION,
  canonicalPath: DISNEY_PREVIEW_CANONICAL_PATH,
  trustNote: DISNEY_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Disney prep guide',
    subtitle:
      "Candidates' accounts of frontend and web loops between 2020 and 2025 describe a recruiter screen, a call with a hiring manager, a tech lead or a director, then a coding stage that is a live round on some teams and a take-home on others, a code review with engineers, frontend system design and a talk with a product manager or a director. Below the table sit the {questions} questions candidates reported between 2015 and 2025; the first, a one-hour React build, is open to read.",
    caveat:
      "A Disney Streaming Services employee wrote in 2022 that each team decides how it interviews, so confirm your rounds with the recruiter, as Disney's own interview tips advise. Most accounts are from 2022 or earlier, and Disney's AI Usage Guidelines rule out AI in coding exercises unless you are told otherwise.",
    chips: ['{#questions} reported questions', '{#reports} public reports, 2015–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare to defend code you wrote and to review code you did not',
    paragraphs: [
      'In some 2021 accounts the take-home is checked twice: once when the team reviews it on its own, and again when engineers walk through it with you. In a 2021 full-stack loop the brief carried test cases for every level and extra specs for senior candidates, and the reviewers asked mostly about those specs, which the candidate, applying below senior, had not built: read the whole brief and know how you would meet each spec. A 2024 review asked the candidate to make one revision live; a 2021 panel spent about half of its roughly 90 minutes on the code the candidate had written, asking why many of the decisions were made and what they traded off; and a 2023 take-home asked for changes to an existing React app, which the in-person interview then went through.',
      'Reading code is a round of its own on some teams. A 2022 Disney Streaming Services first round had no coding: the candidate went over given code, answered trick questions about scope and did a mock pull request review. In the 2025 lead loop a principal engineer showed badly written frontend code, asked for suggestions, then asked how the candidate would help the junior who might have written it. Practise reading a short component aloud, naming its scope and closure traps, and turning each problem into a comment a junior could act on.',
      'The live rounds are short and practical, and the concept questions lean on React. The 2025 round was a React scoreboard banner in five steps in an hour, of which the candidate finished two; a 2024 call held an on-screen JavaScript test in which the candidate completed code to produce a given result; and a 2020 onsite hour built the UI the candidate was shown and wired it to the provided API with event listeners. The concept questions covered managing React component state, which hooks handle which lifecycle events, why state should not be mutated and what window.history does, and in a 2022 onsite a round meant to be behavioural turned to how React DOM works underneath.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What the Disney accounts cover, and what to settle with your recruiter',
    paragraphs: [
      'The {reports} public reports behind this guide are mostly anonymous reviews that Taro re-hosts in its own wording, from 2015 to 2025, many of them dated to a month rather than a day; the rest are Blind posts and comments from 2022 and 2025, a 2025 lead account that PracHub curated and edited, and a 2021 LeetCode post. Many come from full-stack or general software titles, some of them cited only for algorithm or behavioural questions; most are from 2022 or earlier, and where an account names a place it is mostly in the United States, with single accounts from the United Kingdom, Canada, Switzerland and China.',
      "Disney's own pages, {official} of them read for this guide, describe a recruiter screen, interviews with the hiring team and a selection step, and suggest STAR answers to behavioural questions; none describes an engineering round. They cannot tell you how your team interviews, so confirm with the recruiter which team it is, whether the coding stage is live or a take-home, who reviews it and whether AI is allowed, as Disney's tips page itself advises confirming what an interview will cover.",
    ],
  },
  roundSpotlights: [
    {
      id: 'take-home-code-review',
      kicker: 'Round decoder',
      title: 'Disney frontend take-home and the code review that follows',
      lede: [
        'When a Disney team sets a take-home, the accounts that describe a round after it say that round went through the work with you: interviewers open what you built, by video or in person, and ask about your technical choices.',
        'Other teams run a live round instead, such as the one-hour React build that opens the question list, and some make reading code the round itself: a 2022 Disney Streaming Services first round had no coding at all, and in a 2025 lead loop a principal engineer ran a code review on frontend code.',
      ],
      facts: [
        {
          label: 'Position in the loop',
          value:
            'After a screening call and, in most accounts that give an order, a call with a director, a tech lead, the hiring manager, senior developers or an interviewer who explained the task. A system design round, a product manager or a manager from another team came before or after the review in some loops.',
        },
        {
          label: 'The build',
          value:
            "The accounts name a streaming app from a visual mockup (2021), changes to an existing React app (2023), a project with tests for every level (2021) and a UI (2025). A 2020 take-home in Switzerland took about four hours and an intern's under ten, and in 2021 a senior candidate was offered it as optional and chose a deeper technical assessment with senior engineers instead.",
        },
        {
          label: 'The review',
          value:
            'Two senior engineers in 2021; two engineers on Zoom in 2024, who then set a LeetCode medium problem; an in-person interview in 2023 that went on to system design exercises and questions with management; and, for a 2021 associate, three interviews of two interviewers each on technical choices, other projects and the company culture.',
        },
        {
          label: 'Code you did not write',
          value:
            'A 2022 Disney Streaming Services frontend loop opened with code reading and a mock PR review, and no coding. In the 2025 lead loop, the second part of a four-part round was a code review with a principal engineer, on frontend code.',
        },
        {
          label: 'After you submit',
          value:
            'A 2025 commenter who built a UI for a take-home was rejected without knowing whether anyone had graded it, and a 2020 candidate in Switzerland heard nothing for three months after a take-home of about four hours, then learned the position had been filled.',
        },
        {
          label: 'Where this comes from',
          value:
            "Reviews re-posted on Taro from 2020 to 2024, a 2022 Blind post by a Disney Streaming Services candidate, a 2025 Blind comment and the 2025 PracHub lead account; each one is listed, with its date, in the closing source list.",
        },
      ],
      practiceLink: { label: "Rehearse a review on a teammate's fetch helper with the free async race debug", path: '/javascript/debug/js-debug-async-race' },
      processLink: { label: 'See the code review row in the reported process', fragment: 'disney-interview-process-1-stage-code-review' },
    },
    {
      id: 'behavioural',
      kicker: 'Round decoder',
      title: 'Disney behavioural interview: STAR answers and the questions candidates were asked',
      lede: [
        "Disney's own candidate pages speak of behavioural interviews: Candidate Resources says its hiring teams use them and recommends answering in the STAR form of situation, task, action and result. In the frontend accounts the behavioural questions come from the recruiter, from team calls that mix them with technical questions, and from a product manager, a director or a manager from another team near the end of the loop.",
        'Many reported questions ask why Disney, what you have built and how you work with others, and a few are Disney-themed; the 2025 lead loop added collaboration style and stakeholder management.',
      ],
      facts: [
        {
          label: 'Who asks',
          value:
            "A recruiter on the first call, with basic behavioural questions on culture fit in 2024 and questions on the résumé in 2019; a team call with technical and behavioural questions (2021); a product manager on Zoom (2024); a long day with a product manager, two senior engineers and the hiring manager, from process questions to leadership fundamentals (2021); lunch with the team's director and product manager (2020); and a last talk with the department's director or with a manager from another team (2021).",
        },
        {
          label: "What Disney's pages advise",
          value:
            'Candidate Resources recommends STAR answers. The 2026 Top 5 Tips page says many questions are designed to understand what you have already done and how you approach challenges, and that STAR shows whether your approach was successful. The 2026 recruiter podcast suggests preparing a few situations that show different strengths, such as solving a problem, influencing a stakeholder or learning from a setback, rather than a word-for-word script.',
        },
        {
          label: 'Why Disney',
          value:
            'Candidates from 2016 to 2020 were asked why Disney or why this job, and Disney\'s tips page puts knowing your "why" first: why the role and the organisation specifically.',
        },
        {
          label: 'Disney-themed questions',
          value:
            'A 2022 commenter warned that some behavioural questions are Disney-themed. A 2021 web developer was asked for a favourite Disney character, and a 2017 phone interview for a web developer role asked whether a roller coaster should run four trains of five carts or five trains of four.',
        },
        {
          label: 'Lead roles',
          value:
            'The 2025 lead loop opened its second round with a half-hour Senior TPM chat about working and collaboration style, and a few days later the hiring manager asked to talk more about stakeholder management.',
        },
        {
          label: 'Sources',
          value:
            "Disney Careers' Candidate Resources, the Life at Disney tips page and recruiter podcast, and the accounts on Taro, Blind and PracHub from 2016 to 2025 that this decoder names, each account dated in the closing source list.",
        },
      ],
      practiceLink: { label: 'Build a bank of STAR stories with the free stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the product manager and director row in the reported process', fragment: 'disney-interview-process-1-stage-pm-director-and-behavioral' },
      // The behavioural group of the question list, one question each, in close to each account's words.
      drill: {
        note: 'A Disney candidate reported each of these questions, and we retell them in our own words, staying close to what each account says; the roller coaster question is the what-if a 2017 phone interview asked, answered as a view.',
        questions: [
          { id: 'built-something-with-a-team', text: 'Tell us about a time you developed something with a team.', source: 'Taro, 2021' },
          { id: 'why-disney', text: 'Why do you want to work for Disney, or why are you applying to this job?', source: 'Taro, 2016 to 2020', kind: 'view' },
          { id: 'stakeholder-management', text: 'Tell me about your stakeholder management experience.', source: 'PracHub, 2025' },
          { id: 'roadblock', text: 'What would you do when you hit a roadblock?', source: 'Taro, 2023', kind: 'approach' },
          { id: 'approach-to-other-projects', text: 'Talk about your approach to other projects, with a focus on state management.', source: 'Taro, 2021', kind: 'approach' },
          { id: 'previous-work', text: 'Tell us about your previous work experience and the projects you worked on.', source: 'Taro, 2019 to 2024' },
          { id: 'working-style', text: 'What is your working style, and how do you collaborate?', source: 'PracHub, 2025', kind: 'view' },
          { id: 'greatest-strengths', text: 'What are your greatest strengths?', source: 'Taro, 2024', kind: 'view' },
          { id: 'environment', text: 'What kind of environment do you thrive in?', source: 'Taro, 2023', kind: 'view' },
          { id: 'motivation-to-code', text: 'What is your motivation for learning to code?', source: 'Taro, 2022', kind: 'view' },
          { id: 'about-yourself', text: 'Tell me a bit about yourself and your hobbies.', source: 'Taro, 2020', kind: 'view' },
          { id: 'favorite-character', text: 'What is your favorite Disney character?', source: 'Taro, 2021', kind: 'view' },
          {
            id: 'roller-coaster',
            text: 'You are designing a roller coaster: would you make four trains of five carts each, or five trains of four carts each, and why?',
            source: 'Taro, 2017',
            kind: 'view',
          },
        ],
        checks: [
          "The result says what changed and whether my approach worked, which Disney's tips page says a STAR answer shows.",
          "It shows how I worked with others, which Disney's recruiters say teams look at beyond the work itself.",
          "My next story shows a different strength: Disney's recruiter podcast suggests a few situations, from solving a problem to learning from a setback.",
        ],
        viewChecks: [
          "It ties my answer to this role and organisation, which Disney's tips page asks candidates to explain specifically.",
          'It sounds like a conversation, not a script: a Disney recruiter advises against word-for-word answers.',
        ],
      },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Interns, engineers and leads: how the accounts change with the title',
    intro:
      'The accounts run from internships to a lead role, and the rounds change with the title. These lenses group them by the title each account gives; none is a claim about a particular team.',
    items: [
      {
        title: 'Interns, associates and junior developers',
        description:
          'Intern accounts run from 2019 to 2022. The 2020 ones open with a recruiter call, half an hour long for a web developer intern, before interviews with developers, and one of those interns took home a coding challenge that took under ten hours; in 2019 a virtual interview on web protocols and React had no coding, and in 2022 a Disney Streaming Services intern had hashmap and tech-stack questions beside many culture-fit ones. A 2021 associate built a streaming app from a visual mockup and was encouraged to reapply after gaining more enterprise experience, and a 2022 junior developer in the United Kingdom had behavioural interviews and a technical assessment, with very detailed feedback.',
        practiceFocus:
          'Web and React basics explained without code, a small UI built from a picture in a few hours, and stories about learning to code and building something with a team.',
      },
      {
        title: 'Engineers and developers without a senior title',
        description:
          'The newest of these accounts describe a one-hour React build with a senior engineer (Software Engineer II, 2025), a 45-minute hiring manager round that asked how to manage React component state (2024), an on-screen JavaScript test in a call of about 45 minutes with three people (2024), and a frontend-focused contract loop of six steps, from the recruiter to a principal engineer\'s system design round (2024). In 2025 a Software Engineer II candidate at Disney Streaming heard little from the recruiter beyond the language of a React-focused interview, and had a systems design interview booked after it.',
        practiceFocus:
          'A React build from an API against the clock, React state explained with a case from a past project, and one frontend design drawn and explained.',
      },
      {
        title: 'Senior and lead engineers',
        description:
          "A 2021 senior candidate could skip an optional take-home for a deeper technical assessment with senior engineers, then had one long day with the product manager, two senior engineers and the hiring manager on process, a technical assessment and leadership fundamentals. The 2025 lead loop's second round had four parts: a Senior TPM chat, a code review with a principal engineer that turned to mentoring, and two frontend design sessions on a whiteboard, a shopping cart and feature flags, after which the hiring manager asked to talk more about stakeholder management. The candidate found it pretty easy overall and wondered whether that was because the role was a lead one.",
        practiceFocus:
          "Reviewing someone else's frontend code the way a mentor would, two whiteboard designs back to back, and stories about stakeholders, process and leading others.",
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the reported Disney questions',
    intro:
      'FrontendAtlas wrote these answer guides, {prompts} in all, for the open scoreboard build, the take-home and its review and the design rounds; none is an official Disney question.',
    itemListName: 'Disney answer guides',
    items: [
      {
        id: 'scoreboard-banner-from-api',
        title: 'Build a scoreboard banner from an API in one hour, one step at a time',
        statement:
          "In one hour with a senior engineer, build a scoreboard banner for the top of a website in React, working from the company's API, through five steps. Searching Google was permitted and AI tools were not; the account does not describe the steps.",
        whatThisMeasures:
          'Reading an unfamiliar API quickly, getting a working banner on screen early, and structuring React code so that each new step changes as little as possible.',
        clarifyFirst: [
          'Ask to see what the API returns for a typical game and for a day with no games, and whether the scores change during the hour.',
          'Ask whether the steps build on each other and whether you may read all of them before you start.',
          "Ask which React setup, styling and libraries are allowed, and confirm the tools: web search was fine in this account and AI tools were not, as Disney's AI Usage Guidelines say for coding exercises unless you are told otherwise.",
          'Ask how the banner should behave on a narrow screen: wrap, scroll sideways or show fewer games.',
        ],
        strongAnswer: [
          'Call the API first and log one response, then name the fields the banner needs, such as the teams, the score and the game status, before writing any JSX.',
          'Model the request as one status, loading, ready or failed, and render each of them plus an empty state, so the first step is complete before the second starts.',
          'Keep fetching in one custom hook and pass plain data to a banner component and a game component, so a later step changes one piece.',
          "Key each game by the API's id rather than its position, and compute derived values such as the leading team instead of storing them.",
          'If a step asks for live scores, poll inside the effect with a cleanup, and ignore a response from a request that is no longer the latest.',
          'Say which step you are on and what you will cut if the clock runs short; in this account the hour ended after two of the five steps.',
        ],
        commonMiss: 'Styling the banner before any data is on screen, so the hour runs out with the first step still unfinished.',
        resourceLabel: 'Load a list from an API with every request state handled (free)',
        resourcePath: '/react/coding/react-fetch-list-states',
        reportedRound: { label: DISNEY_D1_LABEL, url: DISNEY_D1_URL },
      },
      {
        id: 'defend-take-home-choices',
        title: 'Walk the reviewers through your take-home and its trade-offs',
        statement:
          'Engineers open the take-home you submitted and go through it with you: why you made each decision and what it traded off. In a 2024 loop the candidate also made one revision live on the call, and the same call moved on to a LeetCode medium problem.',
        whatThisMeasures:
          'Whether you understand the code you submitted, can weigh its trade-offs honestly and can change it safely while someone watches.',
        clarifyFirst: [
          'Ask who will review the take-home, how long the review lasts and whether you will share your screen and edit code during it.',
          'Ask whether a README is welcome, and use it for your trade-offs, known gaps and what you would do next.',
          'Ask whether anything else, such as a coding problem, follows the review in the same call.',
        ],
        strongAnswer: [
          'Before the call, list each decision a reviewer could question, with the alternative you rejected and why, one sentence each.',
          'Open with a two-minute tour: what the app does, how the code is organised and what you left out on purpose.',
          'When a reviewer hints at a better way, weigh it aloud and say where they are right; a 2021 candidate read such hints as a check that they understood the trade-offs of their choices.',
          'For a live revision, restate the change, find where it belongs, make the smallest edit, run it and say what you would test next.',
          'Name your weak spots before the reviewers find them, each with how you would fix it.',
          'Keep some energy for what follows: the 2024 review call went straight on to a LeetCode medium problem.',
        ],
        commonMiss: 'Defending every line as if the review were an attack, or meeting a suggestion with silence instead of reasoning about it.',
        resourceLabel: 'Rehearse take-home review questions on a files table (Premium)',
        resourcePath: '/react/trivia/react-take-home-table-review-questions',
        reportedRound: { label: DISNEY_D20_LABEL, url: DISNEY_D20_URL },
      },
      {
        id: 'change-existing-react-app',
        title: 'Change an existing React app at home, then explain the changes in person',
        statement:
          'A take-home asks you to implement changes to a React app someone else wrote; an in-person interview then goes through the changes before system design exercises and behavioural questions with management. The account shares neither the app nor the changes.',
        whatThisMeasures:
          'Reading a codebase you did not write, changing it in its own style without breaking it, and explaining each change, its risk and how you checked it.',
        clarifyFirst: [
          'Ask whether you may refactor the code you touch or should keep its structure and style.',
          'Ask how the app is built and tested, and whether new tests are expected.',
          'Ask how long the work should take, so the scope you choose matches it.',
        ],
        strongAnswer: [
          'Start the app and run its tests before changing anything, and note how it handles state, data fetching and styling.',
          'Make each requested change in its own commit, with a message that says why, so the history reads as your explanation.',
          'Follow the existing patterns even where you would choose differently, and list those preferences in the README instead of rewriting.',
          'Add or update a test for each change, including the edge case most likely to break.',
          'Prepare the walkthrough: for each change, the files it touched, what could break and how you checked it.',
        ],
        commonMiss:
          'Rewriting parts of the app nobody asked about, which makes the diff hard to review and turns the interview into a defence of the rewrite.',
        resourceLabel: 'Fix a React product search that misuses its API (Premium)',
        resourcePath: '/react/coding/react-debug-api-misuse',
        reportedRound: { label: DISNEY_D21_LABEL, url: DISNEY_D21_URL },
      },
      {
        id: 'take-home-every-level',
        title: 'Read a take-home brief that has specs for every level',
        statement:
          'A take-home comes with test cases for all levels, and senior candidates have certain specs to meet. In the review that followed, two senior engineers asked mostly about those senior specs, although the candidate had not applied for a senior role and had not built them.',
        whatThisMeasures:
          'Reading a brief to the end, deciding what to build for your level, and explaining how you would meet the requirements you left out.',
        clarifyFirst: [
          'Ask which level the role is and which specs in the brief apply to it.',
          'Ask whether passing the provided tests is the bar, or whether the reviewers also judge the code itself.',
          'Ask how many hours the task is meant to take, so you can judge whether a higher-level spec fits.',
        ],
        strongAnswer: [
          'Read every spec in the brief before writing code, including the ones written for levels above yours.',
          'Make every test for your level pass, with no test skipped or edited to pass.',
          'Build a higher-level spec if it fits the time; if it does not, write in the README how you would design it and what it would change.',
          'Prepare to discuss the senior specs in the review anyway: in this account they took up most of it.',
          'Run the whole suite before you submit, and list any failure you know about with its cause.',
        ],
        commonMiss: "Reading only your own level's specs, then having nothing to say when the review turns to the ones you skipped.",
        resourceLabel: 'Testing strategy: edge cases and boundaries (free)',
        resourcePath: '/javascript/trivia/js-testing-edge-cases-strategy',
        reportedRound: { label: DISNEY_D7_LABEL, url: DISNEY_D7_URL },
      },
      {
        id: 'frontend-feature-flags',
        title: 'Design feature flags for the front end at a whiteboard',
        statement:
          'Design feature flags with the focus on the front end, drawn on a whiteboard: the second of two frontend system design sessions, in person, in a 2025 lead loop whose first design was a shopping cart.',
        whatThisMeasures:
          'Frontend architecture beyond one screen: where configuration comes from, how it reaches components, how it stays consistent and how it fails safely.',
        clarifyFirst: [
          'Ask who turns flags on and off, engineers, product managers or an experiment system, and how fast a change must reach users.',
          'Ask what flags target, such as users, regions, percentages or devices, and whether pages render on the server.',
          'Ask what the app should do when the flag service is slow or down.',
        ],
        strongAnswer: [
          'Fetch flags once when the app starts, cache them with a version, and give every flag a safe default so a failed fetch changes nothing.',
          'Expose flags through one provider and a small hook, so components never call the flag service themselves.',
          "Resolve targeting on the server where you can, and keep a user's flags stable for the session so the screen does not change under them.",
          'Load the code behind a flag lazily, so users without the feature do not download it.',
          'Plan the life cycle: a staged rollout, a kill switch, logging which variant each user saw, and removing the flag and its dead branch after launch.',
        ],
        commonMiss: 'Scattering flag checks through components and never deleting them, so old flags pile up as hidden branches in every screen.',
        resourceLabel: 'Work through the cross-device preferences sync case: versioned settings that reach every screen (Premium)',
        resourcePath: '/system-design/cross-device-preferences-sync',
        reportedRound: { label: DISNEY_DC8_LABEL, url: DISNEY_DC8_URL },
      },
      {
        id: 'front-end-api-service-design',
        title: 'Design an API service for a front-end application',
        statement:
          'How would you design an API service for a front-end application? A 2023 candidate reported it from a loop whose in-person interview included system design exercises.',
        whatThisMeasures:
          "Shaping an API around what screens need, and reasoning about pagination, errors, caching and change over time from the client's side.",
        clarifyFirst: [
          'Ask whether they mean the server API the front end calls or the client-side layer that wraps it, and cover both briefly if it stays open.',
          'Ask which screens use it, how much data each one shows and how often the data changes.',
          'Ask who else calls the API, such as mobile apps, since that decides how closely it can follow one front end.',
        ],
        strongAnswer: [
          'Start from the screens: list what each one shows, and design resources or a backend-for-frontend endpoint that returns it in one request.',
          'Page long lists with cursors, filter and sort on the server, and keep response shapes stable and typed.',
          'Define one error format with codes the UI can act on, and make writes idempotent so a retry cannot apply twice.',
          'Cache with HTTP headers and ETags where the data allows, and say what the client caches and when it fetches again.',
          'Version the API or add fields without breaking old clients, and cover authentication and rate limits briefly.',
        ],
        commonMiss: 'Designing endpoints from the database outward, so every screen needs several round trips and reshapes the data itself.',
        resourceLabel: 'Work through the offline email client case: sync and idempotent sends against an API (free)',
        resourcePath: '/system-design/offline-email-client',
        reportedRound: { label: DISNEY_D21_LABEL, url: DISNEY_D21_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Plan the scoreboard banner before the first step',
    intro:
      "The 2025 account sums up the task in a few lines: a scoreboard banner for the top of the website, in React, from the company's API, over five steps in an hour. Settle six points before you type, so each later step lands on code that already works.",
    steps: [
      {
        title: 'Read one response',
        description: 'Call the API, log one game and the empty case, and name the fields the banner shows before writing any JSX.',
      },
      {
        title: 'Pick the shape of state',
        description:
          'A list of games keyed by id, plus one status of loading, ready or failed; values such as the leading team are computed from the list, not stored beside it.',
      },
      {
        title: 'Split the pieces',
        description: 'A data hook, a banner that lays out the strip, and one component per game, so a later step changes one file.',
      },
      {
        title: 'Leave room to refresh',
        description:
          'Put the fetch in an effect with a cleanup, so turning on polling later is a small change and a stale response cannot overwrite a newer one.',
      },
      {
        title: 'Fit the top of a page',
        description:
          'A horizontal strip that scrolls on a narrow screen, with names that do not wrap word by word, and a label a screen reader can announce.',
      },
      {
        title: 'Narrate the clock',
        description: 'Say which step you are on and what you will leave out if time runs short, so the interviewer can follow your choices.',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Disney frontend interview preparation plan',
    intro:
      "One day for each step the Disney accounts describe, from the recruiter screen through a live React build, a take-home and its review, someone else's code and a whiteboard design to the behavioural conversations.",
    days: [
      {
        day: 'Day 1',
        focus:
          "Recruiter screen and your why: two minutes on your frontend work and recent projects, why Disney and why this team, then what to confirm with the recruiter, as Disney's tips page advises: which team, which rounds, a live round or a take-home, and whether AI is allowed.",
        artifact: 'A two-minute introduction, a two-sentence answer to why Disney, and a list of points to confirm with the recruiter.',
      },
      {
        day: 'Day 2',
        focus:
          'One-hour React build: the open scoreboard question against a clock, with a public API of your choice standing in for theirs, web search allowed and AI tools off, as in the 2025 round.',
        artifact: 'A banner that works after its first step, with the minutes each step took written down.',
      },
      {
        day: 'Day 3',
        focus:
          'Take-home build: a small React app from a picture or a short brief in one sitting of up to four hours, with tests and a README of your trade-offs and gaps.',
        artifact: 'The app, its tests and the README.',
      },
      {
        day: 'Day 4',
        focus:
          'Review rehearsal: walk a friend through the Day 3 app for half an hour and answer why you made each choice and what you rejected, without defending every line.',
        artifact: 'A list of their questions, with what you would change in the app.',
      },
      {
        day: 'Day 5',
        focus:
          'Reviewing someone else\'s code: take a short component or helper written by another developer, say aloud what it does, then write review comments with the most important first.',
        artifact: 'A written review of one file, ordered by importance.',
      },
      {
        day: 'Day 6',
        focus:
          'Frontend system design: one feature drawn on a whiteboard in an hour, from its screens and their state to the calls behind them, as a 2020 onsite gave its first hour to a whiteboard design.',
        artifact: 'One diagram with the components, the data flow and the API calls, explained aloud.',
      },
      {
        day: 'Day 7',
        focus:
          'Behavioural conversations: stories from the drill above, told in STAR parts for a product manager, a director or a manager from another team, plus answers to a Disney-themed question or two.',
        artifact: 'Five stories with their results, and a short answer to each Disney-themed question in the drill.',
      },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Disney frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real Disney interview questions?',
        answer:
          "They come from candidates' accounts dated 2015 to 2025: reviews that Taro re-hosts, Blind posts and comments, an account that PracHub curated and a LeetCode post. FrontendAtlas retells them in its own words, staying close to what each account says, and wrote the answer guides; Disney has confirmed none. A question from one team's loop may never come up in another's: a Disney Streaming Services employee wrote in 2022 that each team decides how it interviews.",
      },
      {
        question: 'Will I get a take-home or a live coding round?',
        answer:
          'The accounts differ. A 2025 Software Engineer II (frontend) candidate had a one-hour live React build with a senior engineer, a 2024 candidate had an on-screen JavaScript test in a call of about 45 minutes with three people, and take-homes appear in accounts from 2020 to 2025. In 2021 a senior candidate was offered the take-home as optional and took a deeper technical assessment with senior engineers instead. Ask the recruiter which your team uses; a 2020 front end candidate was given a broad summary of what the interview would cover.',
      },
      {
        question: 'What happens in the Disney code review round?',
        answer:
          'In the accounts that describe a round after the take-home, interviewers go through it with you and ask about your technical choices, in a single interview or over several. Some teams review code you did not write: a 2022 Disney Streaming Services frontend first round was code reading and a mock PR review with no coding at all, and the 2025 lead loop had a code review with a principal engineer on frontend code. The questions candidates reported from these rounds are in the list above.',
      },
      {
        question: 'Does Disney allow AI tools in its interviews?',
        answer:
          "Disney's AI Usage Guidelines welcome AI for research, résumé help and interview practice, but rule it out for completing assessments such as coding exercises unless you are told otherwise, for generating answers in real time, and for note-taking, recording or transcribing during the process; Disney says it will clearly communicate when an assessment allows AI. In the 2025 live React round the candidate could research on Google but not use AI tools.",
      },
      {
        question: 'Do Disney frontend interviews include algorithm questions?',
        answer:
          "Some loops do. A 2024 frontend-focused contract role had a LeetCode medium problem after its take-home review, but none of the list's algorithm questions comes from an account with a frontend title. A 2020 full-stack candidate described the onsite as focused on real-world experience rather than a whole day of solving algorithms.",
      },
      {
        question: 'Is the interview in React?',
        answer:
          'React is the only frontend framework the accounts name: the 2025 live round was a React build, a 2023 take-home asked for changes to a React app, and in 2025 a Software Engineer II candidate heard little from the recruiter beyond the language of a React-focused interview. Several concept questions in the list are about React state and hooks. Confirm the framework with your recruiter, since the accounts differ from loop to loop.',
      },
      {
        question: 'How long does it take to hear back?',
        answer:
          'Accounts differ. A 2021 web developer called the process super quick and had the news within two weeks; a 2022 candidate learned two weeks after a coding challenge that the position had been cancelled; a 2020 candidate in Switzerland heard nothing for three months after a take-home; and a 2025 commenter called the communication vague and slow. Disney\'s recruiters on the Life at Disney podcast advise taking a no as a "not yet", staying connected with the recruiter and applying again.',
      },
      {
        question: 'Do the teams that build Disney+, Hulu and ESPN apps interview differently?',
        answer:
          'No account compares them, and the accounts that name a streaming unit vary like the rest: a 2022 Disney Streaming Services frontend first round was code reading with no coding, a frontend candidate in a 2022 thread about Disney Streaming Services had more behavioural questions than coding, and a 2025 Software Engineer II candidate at Disney Streaming was told the interview would be React-focused.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free tasks for a live React build, a code review and a design round',
    intro:
      "Free tasks that match what the Disney accounts describe: a React build from an API, a teammate's code to review, tests for a take-home, a whiteboard design and STAR stories. None is a reported Disney question.",
    items: [
      {
        label: 'Fetch and render a list',
        description: 'Loading, error and empty states for data from an API: the first step of a build like the open scoreboard question.',
        path: '/react/coding/react-fetch-list-states',
      },
      {
        label: 'Poll until a condition holds',
        description: 'A timeout and a clean stop, in case a build step asks a banner to refresh.',
        path: '/javascript/coding/js-poll-until',
      },
      {
        label: 'React autocomplete starter',
        description: 'A React task with tests and a recommended 35 to 45 minutes, for practising a live round against the clock.',
        path: '/react/coding/react-autocomplete-search-starter',
      },
      {
        label: "Fix the async race in a teammate's fetch helper",
        description: 'Code someone else wrote, read and fixed: a rehearsal for a code review round.',
        path: '/javascript/debug/js-debug-async-race',
      },
      {
        label: 'Testing strategy for edge cases',
        description: 'The few tests that catch the inputs that break code, for a take-home someone else will run and read.',
        path: '/javascript/trivia/js-testing-edge-cases-strategy',
      },
      {
        label: 'Frontend system design blueprint',
        description: 'A method for a design round drawn on a whiteboard or shared over Zoom.',
        path: '/guides/system-design-blueprint',
      },
      {
        label: 'STAR stories',
        description: "A structure for the stories Disney's candidate pages recommend.",
        path: '/guides/behavioral/stories',
      },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro:
      'Every account and Disney page that the process table and the question list cite, once each, with where this page uses it: {reports} public reports and {official} official pages.',
    items: [],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Disney practice set',
    copy: 'Premium opens every locked Disney question, with its answer guide and its practice task where it has one.',
    buttonLabel: 'Unlock the full Disney practice set',
    src: 'company_preview_disney',
  },
  about: [
    'Disney frontend interview preparation',
    'Disney frontend take-home and code review',
    'Disney behavioural interview questions',
    'React live coding round from an API',
  ],
  indexAnchorLabel: 'Disney frontend interview questions',
};
