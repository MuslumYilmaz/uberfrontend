import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Cloudflare frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the six prompts here are the answer guides of seven rows: the open link question,
 * the TypeScript task of the app round, the design hour on your own projects, the two debugging-method rows, DNS
 * resolution and the AI-assisted bug fixing round. The frontend rounds come from a LeetCode account of a frontend-heavy
 * loop in Bengaluru (2025), a PracHub account of a US frontend loop (2026) and Taro pages from 2024 and 2025; most rows of
 * the list come from other teams' loops and from interns and graduates. Cloudflare's careers page, its post on 2026
 * internships (September 2025) and a 2025 Cloudflare TV episode give the official context. Every page the text relies on
 * is already cited by the process entry, so the guide's own sources list is empty. Taro pages are named by country, never
 * by city. The Orange Cloud Interview is explained in full only in its decoder, and the app round's setup and tool rules
 * only in the app decoder's facts; other sections point to them. The Orange Cloud drill keeps the 2025 account's three
 * questions and adds scenarios written by FrontendAtlas, one per capability on the careers page, as its note says.
 * Nothing here is a leaked, confirmed or official Cloudflare question.
 */
const CLOUDFLARE_TARO = 'https://www.jointaro.com/interviews/companies/cloudflare/experiences';
const CLOUDFLARE_LINK_ROUND_2024_URL = `${CLOUDFLARE_TARO}/software-engineer-germany-december-1-2024-no-offer-positive-968f1ec1/`;
const CLOUDFLARE_LINK_ROUND_2024_LABEL = 'Public report: Taro software engineer loop in Germany, 2024';
const CLOUDFLARE_PORTUGAL_2025_URL = `${CLOUDFLARE_TARO}/frontend-engineer-lisbon-lisbon-district-may-1-2025-no-offer-positive-fffe2762/`;
const CLOUDFLARE_PORTUGAL_2025_LABEL = 'Public report: Taro frontend engineer loop in Portugal, 2025';
const CLOUDFLARE_BENGALURU_2025_URL = 'https://leetcode.com/discuss/post/7396827/';
const CLOUDFLARE_BENGALURU_2025_LABEL = 'Public report: LeetCode frontend-heavy full-stack loop in Bengaluru, 2025';
const CLOUDFLARE_HM_DEBUGGING_2025_URL =
  'https://prachub.com/interview-experiences/cloudflare-software-engineer-interview-experience-two-month-wait-then-advanced-to-technical-the-same-night';
const CLOUDFLARE_HM_DEBUGGING_2025_LABEL = 'Public report: PracHub software engineer hiring manager round, 2025';
// The 20-minute hiring manager round that asked "Explain DNS."; the process entry cites it on the DNS row.
const CLOUDFLARE_HM_DNS_2024_URL = `${CLOUDFLARE_TARO}/software-development-engineer-united-states-november-1-2024-no-offer-negative-bddb091b/`;
const CLOUDFLARE_HM_DNS_2024_LABEL = 'Public report: Taro hiring manager call in the United States, 2024';
const CLOUDFLARE_AUSTIN_2026_URL =
  'https://prachub.com/interview-experiences/cloudflare-software-engineer-interview-with-battleship-coding-and-austin-office-tour-3f1fddb771';
const CLOUDFLARE_AUSTIN_2026_LABEL = 'Public report: PracHub software engineer loop in Austin, 2026';

export const CLOUDFLARE_PREVIEW_TITLE = 'Cloudflare Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const CLOUDFLARE_PREVIEW_H1 = 'Cloudflare Frontend Interview Questions';
export const CLOUDFLARE_PREVIEW_DESCRIPTION =
  'Cloudflare frontend interview: the Orange Cloud Interview, the JavaScript screen, an hour of React and TypeScript coding, and {#questions} reported questions.';
export const CLOUDFLARE_PREVIEW_CANONICAL_PATH = '/companies/cloudflare/preview';
export const CLOUDFLARE_PREVIEW_TRUST_NOTE =
  "Every question in the list was reported by a candidate on Taro, LeetCode, Blind or PracHub and is rephrased here. None is confirmed by Cloudflare, and every answer guide is ours. A 2024 frontend candidate signed an NDA and shared no questions, and a commenter with a Cloudflare badge wrote on Blind in 2025 that each team has its own set, so read each account as a single team's loop.";

export const CLOUDFLARE_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'cloudflare',
  label: 'Cloudflare',
  title: CLOUDFLARE_PREVIEW_TITLE,
  h1: CLOUDFLARE_PREVIEW_H1,
  description: CLOUDFLARE_PREVIEW_DESCRIPTION,
  canonicalPath: CLOUDFLARE_PREVIEW_CANONICAL_PATH,
  trustNote: CLOUDFLARE_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Cloudflare prep guide',
    subtitle:
      "Most Cloudflare frontend accounts from 2024 to 2026 open with the hiring manager. The 2025 frontend-heavy loop that times its rounds added a 45-minute JavaScript screen and three panel rounds: the 30-minute Orange Cloud Interview on Cloudflare's values, an hour of system design and architecture, and an hour of React and TypeScript coding. The list under the table holds {questions} questions from Cloudflare's engineering and intern loops, and the first, what happens when you enter a link and press enter, is open to read.",
    caveat:
      "Few of these accounts are for a frontend title, and a 2024 frontend candidate signed an NDA, so most questions come from other teams' loops, where Cloudflare-badged commenters on Blind say the questions vary by team. Accounts also differ on AI tools: a 2025 app round allowed none, while a 2026 loop on another team included an AI-assisted coding challenge.",
    chips: ['{#questions} reported questions', '{#reports} public reports, 2020–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What the Cloudflare loops reward: speed in React and TypeScript, and the web explained in order',
    paragraphs: [
      'The 2025 frontend-heavy candidate believes the app round decided the loop. The hour was spent in a React and TypeScript repository whose mock UI and API were already there, implementing four frontend tasks; the candidate finished two, was minutes from finishing the third, was rejected, and concluded that execution speed matters as much as correctness. Set up your environment the day before, practise adding features to an app you did not write in slices of about 15 minutes, and type the data each feature touches: the 2025 loop in Portugal asked for a TypeScript type for a JSON object and for debugging an issue in a React app.',
      "On other teams the web comes first. Hiring manager screens from 2024 and 2025 asked what happens when you enter a link and press enter, how DNS resolves a name and how HTTP differs from HTTPS, in calls as short as 20 minutes, and a 2025 candidate who got deep DNS questions was rejected right after that round; keep a two-minute answer and a deeper layer for each. The 45-minute JavaScript screen asked for a basic task to be solved without loops, then a small extension, so make recursion and array methods quick. The design hour went deep into projects the interviewer picked from the résumé, so know the architecture, trade-offs and numbers of the projects you list.",
      "In the 2025 accounts that time it, the Orange Cloud round is 30 minutes of behavioural questions on Cloudflare's values. Prepare a story for each capability on the careers page and rehearse them in the drill, then add the openers a 2025 hiring manager used: why Cloudflare, which of its products you have used, a code review conflict and how you debug.",
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Frontend accounts are few; most rows come from other Cloudflare teams',
    paragraphs: [
      "This guide draws on {reports} public reports from 2020 to 2026. The frontend rounds rest on a handful of them: a 2025 LeetCode post from a frontend-heavy full-stack loop in Bengaluru, the only frontend account that times its rounds; a 2026 PracHub account of a US frontend loop; and Taro pages for frontend roles in Portugal, the United Kingdom and the United States in 2024 and 2025. Taro dates many of its accounts only to the month, and PracHub marks its accounts as curated and edited.",
      "Most rows of the question list come from software engineers on other teams and from intern and graduate loops, kept when what they ask is frontend or general; those teams' hiring manager screens are where the web fundamentals come up. Cloudflare's careers page gives the hiring steps and the behaviours it values, its post on 2026 internships the intern timeline, and a recruiting leader on Cloudflare TV in 2025 the C-level interview; none of them describes a frontend round. Before your loop, ask the recruiter what your own team's rounds are and which tools each of them allows.",
    ],
  },
  roundSpotlights: [
    {
      id: 'orange-cloud-interview',
      kicker: 'Round decoder',
      title: 'The Cloudflare Orange Cloud Interview: what it is and what candidates were asked',
      lede: [
        "The Orange Cloud Interview is Cloudflare's behavioural round, centred on the behaviours the company says it values.",
        'The 2025 accounts that time it give it 30 minutes beside the technical rounds, and a frontend-heavy candidate was asked about a mistake and what they learned, something learned outside work and fun or challenging situations in their career. A 2024 candidate, whose account gives no length, had three scenario questions and was told they were a cultural fit.',
      ],
      facts: [
        {
          label: 'What Cloudflare says',
          value:
            'Its careers page lists executive calls, a conversation with senior leadership on vision, values and long-term goals, which include "our Orange Cloud Interview focused on the behaviors we value". The same page calls those behaviours the Cloudflare Capabilities and says Cloudflare uses them when it measures success, gives feedback and rewards performance. Speaking of candidates in general, not of this round, a Cloudflare recruiting leader said on Cloudflare TV in 2025 that curiosity ranks high, as does the ability to get things done.',
        },
        {
          label: 'The capabilities',
          value:
            'Be curious to learn and grow; Communicate clearly and transparently; Do the right thing; Embrace diversity; Get your work across the finish line; Lead with empathy. The page does not say the interview scores them, but a commenter with a Cloudflare badge pointed to them on Blind in 2024 for the qualities the interviewer looks for.',
        },
        {
          label: 'Length and place',
          value:
            '30 minutes in a 2025 frontend-heavy loop, where it was one of three panel rounds, and in a 2025 mid-level onsite of four interviews. In 2026 a US frontend loop and a software engineer loop in Austin listed it among their later rounds, and a 2024 SOC engineer had it at the end of a panel. No account says who ran it.',
        },
        {
          label: 'What was asked',
          value:
            'A mistake you made and what you learned, something you learned outside your work, and fun or challenging situations in your career (2025); three scenario questions the candidate did not share (2024); "tell me about a situation" questions (2025). A 2024 SOC engineer described scripted behavioural questions and was never asked why Cloudflare.',
        },
        {
          label: 'What candidates advise',
          value:
            'The 2025 frontend-heavy candidate found the round more about culture fit and mindset than technical skills. The 2024 candidate had practised scenario questions beforehand and advised against arriving with none prepared.',
        },
        {
          label: 'What Cloudflare-badged commenters said',
          value:
            'In the 2024 Blind thread, commenters with a Cloudflare badge called it a sanity check and likened it to the behavioural round many companies now run, pointing to the STAR method for the general idea.',
        },
        {
          label: 'Where this comes from',
          value:
            "Cloudflare's careers page, read on 14 November 2026; LeetCode accounts from 2025; a 2024 Blind thread and a 2024 Taro account; accounts on PracHub from 2026; and the 2025 Cloudflare TV episode.",
        },
      ],
      practiceLink: { label: 'Shape your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the Orange Cloud Interview row in the reported process', fragment: 'cloudflare-interview-process-1-stage-orange-cloud-interview' },
      // The 2025 account's three questions as the behavioural list words them, then one scenario per capability.
      drill: {
        note: "The questions marked LeetCode, 2025 are the ones a frontend-heavy candidate lists for the round. A 2024 candidate had three scenario questions and did not share them, so the questions marked 'Our scenario' are ones we wrote in that form, one for each capability on Cloudflare's careers page.",
        questions: [
          { id: 'mistake', text: 'Tell me about a mistake you made and what you learned from it.', source: 'LeetCode, 2025' },
          { id: 'learned-outside-work', text: 'What is something you learned outside your work?', source: 'LeetCode, 2025' },
          { id: 'challenging-situation', text: 'Tell me about a fun or challenging situation in your career.', source: 'LeetCode, 2025' },
          {
            id: 'curious',
            text: 'Tell me about a situation where you went looking for a better way to do something your team already did.',
            source: 'Our scenario: Be curious to learn and grow',
          },
          {
            id: 'direct-feedback',
            text: 'Tell me about a situation where you gave someone direct feedback they did not expect.',
            source: 'Our scenario: Communicate clearly and transparently',
          },
          {
            id: 'right-thing',
            text: 'Tell me about a situation where the easy option and the right one were different.',
            source: 'Our scenario: Do the right thing',
          },
          {
            id: 'other-perspective',
            text: 'Tell me about a situation where a perspective unlike yours changed what you built.',
            source: 'Our scenario: Embrace diversity',
          },
          {
            id: 'finish-line',
            text: 'Tell me about a situation where you carried a piece of work over the finish line when it could have stalled.',
            source: 'Our scenario: Get your work across the finish line',
          },
          {
            id: 'supported-teammate',
            text: 'Tell me about a situation where you supported a teammate who was struggling.',
            source: 'Our scenario: Lead with empathy',
          },
        ],
        checks: [
          "I can name the Cloudflare capability it shows, in the careers page's words.",
          'Three answers like it, with their follow-ups, would fit in a 30-minute round.',
          'It shows how I think and treat people, not only what I built.',
        ],
      },
    },
    {
      id: 'app-coding-round',
      kicker: 'Round decoder',
      title: 'The Cloudflare React and TypeScript app round, as a 2025 frontend-heavy loop ran it',
      lede: [
        "In the 2025 frontend-heavy account that describes it, Cloudflare's app round was an hour of coding in React and TypeScript, in a setup the candidate had prepared beforehand.",
        'The candidate ran out of time with work unfinished, was rejected after this round, and took from it that in frontend-heavy roles execution speed matters as much as correctness.',
      ],
      facts: [
        {
          label: 'Position in the loop',
          value:
            'One of three panel rounds in the 2025 loop, after a 30-minute hiring manager round and a 45-minute JavaScript screen; the other panel rounds were the Orange Cloud Interview and an hour of system design and architecture. Every round was virtual.',
        },
        { label: 'Before the call', value: 'Install npm, nvm and React and have the environment ready, as the 2025 candidate was asked to.' },
        {
          label: 'Tools',
          value:
            'Google, documentation and Stack Overflow, but no AI tools, in the 2025 round. A 2026 software engineer loop included an AI-assisted coding challenge, so ask what your round allows rather than assume either rule.',
        },
        {
          label: 'What the candidate thinks decided it',
          value:
            "Time. The candidate was two or three minutes from finishing a task when the hour ran out, the interviewer said he understood the approach, and the rejection followed. The candidate's own lesson: be very fast with React basics and practise coding under time pressure.",
        },
        {
          label: 'Other frontend accounts',
          value:
            'Several live coding exercises in a 2026 US loop; a few technical stages after an HR interview in a 2025 loop in Portugal, with TypeScript and React debugging tasks; and an at-home assessment and a pair programming exercise announced to a 2025 UK candidate, who withdrew before them. Only the tasks from the Portugal loop are in the question list, by topic; the other accounts name no task.',
        },
        {
          label: 'Where this comes from',
          value:
            'A 2025 LeetCode account of a frontend-heavy full-stack loop in Bengaluru, Taro pages from Portugal and the United Kingdom in 2025, and 2026 PracHub accounts from the United States.',
        },
      ],
      practiceLink: { label: 'Rehearse an hour of React with the free autocomplete task', path: '/react/coding/react-autocomplete-search-starter' },
      processLink: { label: 'See the app coding row in the reported process', fragment: 'cloudflare-interview-process-1-stage-app-coding-and-debugging' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Which Cloudflare loop you are in: a frontend team, another engineering team, or an internship',
    intro:
      "Few Cloudflare accounts carry a frontend title, so most rows come from other teams' loops and from early-career ones. Each lens says what its own accounts asked, so you can weigh the rows that match your loop first.",
    items: [
      {
        title: 'Frontend and frontend-heavy roles',
        description:
          'Taro pages from Portugal, the United Kingdom and the United States in 2024 and 2025, a US frontend account from 2026 and the 2025 Bengaluru loop for a frontend-heavy full-stack role. Their technical rounds: a 45-minute JavaScript screen, an hour of four frontend tasks in a React and TypeScript repository, a TypeScript type for a JSON object, debugging an issue in a React app, an at-home assessment and pair programming announced to a candidate who withdrew, several live coding and architecture exercises, and a design hour on projects from your résumé.',
        practiceFocus:
          'Speed in a React and TypeScript codebase you did not write, typing API data, finding a bug in a React screen, and explaining the architecture of your own projects.',
      },
      {
        title: 'Software engineers on other teams',
        description:
          'Hiring manager screens with web fundamentals and your debugging method; HackerRank tests; technical screens with 3Sum and 4Sum, the fewest partitions to hold the data, a stack with an increment and a Battleship-style game; onsites with a hit counter, Design Twitter, a project retrospective, debugging and code review and a PM-focused interview; and in 2026 an AI-assisted coding challenge and a senior leadership round on coding agents.',
        practiceFocus:
          'Medium algorithm problems with their complexity, debugging and reviewing code aloud, a 20-minute tour of how the web works, and a clear account of how you use AI tools.',
      },
      {
        title: 'Interns and new graduates',
        description:
          "In most intern and graduate accounts from 2020 to 2023, the application began with a build: front-end, back-end and auth services deployed on Cloudflare infrastructure (2023), a React site copying Facebook's core features with its backend API (2021), a website made with Cloudflare's serverless tools plus a tool that sends it HTTP requests (2020), and a JSON API with a static HTML page (2020); a 2021 software engineer's online assessment was a front end and back end on the Cloudflare platform. Later rounds were a hiring manager screen, pair programming and HR (2023), a coding interview on HTTP requests (2023) and pair programming over video (2025). In September 2025 Cloudflare said it planned to fast-track the review of 2026 Software Engineering intern applicants who built an AI-powered application on Cloudflare, and put its interview process at three to four weeks.",
        practiceFocus:
          'Deploying a small front end with its API, HTTP requests and status codes, pair programming while you explain, and clean code.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the reported Cloudflare questions',
    intro:
      'FrontendAtlas wrote these guides for the open link question and for locked rows from the app round, the design hour, the debugging questions, DNS and the AI-assisted coding round; Cloudflare set none of them.',
    itemListName: 'Cloudflare answer guides',
    items: [
      {
        id: 'enter-a-link-end-to-end',
        title: 'Explain what happens between pressing enter and seeing the page',
        statement:
          'A hiring or engineering manager asks what happens when you enter a link in the browser and press enter. Walk the request from the address bar to the server and back to a painted page, in order, in a few minutes, and go deeper wherever the interviewer asks.',
        whatThisMeasures:
          "Whether you can lay out the web's request path in the right order and at the right depth for a short first call, and connect each step to what a frontend engineer controls: redirects, caching and what blocks rendering.",
        clarifyFirst: [
          'Ask whether they want the whole path in a couple of minutes or one part in depth: the accounts place this question in a first call with a manager, one of them about 20 minutes long, beside behavioural questions.',
          'Ask whether the link is typed or clicked, and whether the page is new to the browser or visited before, since caches change the trip.',
          'Ask whether the link uses plain HTTP, since such an address is often redirected to HTTPS first.',
          'Ask whether to stop when the response arrives or carry on to how the browser builds the page.',
        ],
        strongAnswer: [
          'The address: the browser decides whether you typed a URL or a search, and splits the URL into scheme, host, path and query; a clicked link skips the guess.',
          "The name: the browser needs an IP address for the host, so it checks its own cache and the operating system's, then asks a DNS resolver; the answer is cached for its time to live.",
          "The request: the browser makes an HTTP request to that address with a method, the path, headers and the site's cookies. With HTTPS the request and response are encrypted, and the site's certificate lets the browser confirm it reached the real host.",
          'The response: a status code (200, a 301 or 302 redirect that starts the trip again, a 304 that lets the browser reuse its cached copy, a 404 or a 500), headers such as `Content-Type`, `Cache-Control` and `Set-Cookie`, then the body.',
          'The page: the browser parses the HTML into the DOM as it arrives, requests the CSS, scripts and images it finds, builds the CSSOM, then lays out and paints; a stylesheet or a synchronous script holds up the first paint.',
          'Show it: open the Network panel, reload, and read one request aloud, its status, headers, cache use and timing, to prove the path with real data.',
        ],
        commonMiss:
          'Reciting protocol names without an order, or spending the whole answer on one step, so the interviewer never hears how the response becomes pixels or where a frontend engineer can make it faster.',
        resourceLabel: 'Read how the browser parses and renders the page (free)',
        resourcePath: '/html/trivia/html-parsing-rendering',
        reportedRound: { label: CLOUDFLARE_LINK_ROUND_2024_LABEL, url: CLOUDFLARE_LINK_ROUND_2024_URL },
      },
      {
        id: 'typescript-type-for-json',
        title: 'Write a TypeScript type for a JSON object',
        statement:
          'Given a JSON object, such as an API response in the app you are working on, write the TypeScript type that describes it, then say how you would check that the data arriving at runtime really has that shape.',
        whatThisMeasures:
          'Reading data as types: objects, arrays, optional and nullable fields, unions of literal values and recursive types, and knowing that TypeScript checks nothing once the code runs.',
        clarifyFirst: [
          'Ask for more than one sample, since a single sample hides which fields are optional, nullable or sometimes missing.',
          'Ask whether the type is for this one object or for any JSON value; the second needs a recursive type.',
          'Ask where the data comes from, your own API or an outside one, which decides how much checking it needs at runtime.',
        ],
        strongAnswer: [
          'Name the shape: a type or interface per object, arrays as `Item[]`, and nested objects as their own named types so they can be reused.',
          "Mark what varies: optional properties with `?`, values that can be null as `T | null`, and fixed sets of strings as unions such as `'active' | 'disabled'`.",
          'For any JSON value, write the recursive type: `type Json = string | number | boolean | null | Json[] | { [key: string]: Json }`.',
          "Keep JSON's own types: a date arrives as a string, so type it as `string` and convert it where you parse, not as `Date`.",
          'Type outside data as `unknown` and narrow it with a type guard or a schema check before use, because a cast with `as` only silences the compiler.',
        ],
        commonMiss: 'Typing the response as `any` or casting it with `as`, which turns the type into a promise the data may not keep.',
        resourceLabel: 'Parse untrusted JSON safely, in TypeScript (free)',
        resourcePath: '/javascript/coding/js-safe-json-parse',
        reportedRound: { label: CLOUDFLARE_PORTUGAL_2025_LABEL, url: CLOUDFLARE_PORTUGAL_2025_URL },
      },
      {
        id: 'own-project-architecture-deep-dive',
        title: 'Take the interviewer through the architecture of your own project',
        statement:
          'The interviewer picks a project from your résumé and goes deep: how it is built, which decisions you made and what they cost, and how you would improve it now.',
        whatThisMeasures:
          'Whether you owned real decisions and can defend them with alternatives, numbers and consequences, the way you would in a design review with your own team.',
        clarifyFirst: [
          'Ask which project they want, or offer the one you know best, and say plainly which parts were yours.',
          'Ask whether to cover the whole system on one diagram or one part in depth, such as state, data fetching or the build and deploy.',
          'Ask whether they want the design as it stands or as you would build it again.',
        ],
        strongAnswer: [
          'Open with the problem, the users and the numbers: traffic, data size, team size and the deadline that shaped the work.',
          "Draw the architecture once: the frontend's main parts, where state lives, the APIs it calls, and how it is built, tested and deployed.",
          'Take two or three decisions and give each its alternative, the trade-off that decided it and what it cost later.',
          'Say what broke or would not scale, how you found out, and what you changed in response.',
          'Finish with what you would change now, in order of value, and why you did not do it then.',
        ],
        commonMiss:
          "Listing features instead of the architecture, or quoting a traffic figure without showing what you did about it: in another team's 2025 project retrospective, a candidate who was fairly sure they had mentioned upwards of three million requests a minute was still marked down for lacking experience with scale.",
        resourceLabel: 'Practise naming decisions and trade-offs on the offline email client case (free)',
        resourcePath: '/system-design/offline-email-client',
        reportedRound: { label: CLOUDFLARE_BENGALURU_2025_LABEL, url: CLOUDFLARE_BENGALURU_2025_URL },
      },
      {
        id: 'debugging-method-out-loud',
        title: 'Describe your debugging method, then use it on a bug',
        statement:
          'Say how you work when something goes wrong, then talk through a bug the interviewer describes: how you would reproduce it, narrow it down, find the cause and prove the fix.',
        whatThisMeasures:
          'A method you can repeat under pressure: evidence before guesses, one change at a time, and a fix you can prove and keep from coming back.',
        clarifyFirst: [
          'Ask what is known: who saw it, where, since when, and whether it happens every time.',
          'Ask whether you can run the code and add logging, or must reason from the description alone.',
          'Ask what counts as done: the symptom gone, or the cause found and a test in place.',
        ],
        strongAnswer: [
          'Reproduce it first with the smallest case that shows it, and write down expected against actual.',
          'Narrow the search: what changed recently, which layer is wrong (data, state, rendering or the network), and halve the suspect code until one part remains.',
          'Read the evidence rather than guess: the console and stack trace, the requests in the Network panel, breakpoints and logged values.',
          'State the cause in one sentence before changing code, then make one change and check it against the reproduction.',
          'Close the loop with a test that fails without the fix, and say how the same kind of bug could be caught earlier.',
        ],
        commonMiss: 'Jumping to a fix before the bug is reproduced, or changing several things at once so nobody knows which one worked.',
        resourceLabel: 'Find the stale closure in a delayed autosave (free)',
        resourcePath: '/javascript/debug/js-debug-stale-closure-autosave',
        reportedRound: { label: CLOUDFLARE_HM_DEBUGGING_2025_LABEL, url: CLOUDFLARE_HM_DEBUGGING_2025_URL },
      },
      {
        id: 'dns-resolution-explained',
        title: 'Explain DNS and walk through how a name is resolved',
        statement:
          'Explain what DNS does, then walk through how a browser gets the IP address for a host name: the caches it checks, the resolver it asks and the servers the resolver queries, and what can go wrong on the way.',
        whatThisMeasures:
          "Exact fundamentals in a short manager call: the order of the lookups, what is cached and for how long, and where DNS shows up in a frontend engineer's work.",
        clarifyFirst: [
          "Ask whether they want the lookup from the browser's side or the whole chain of servers behind the resolver.",
          'Ask whether the name was looked up recently, since a cached answer skips most of the chain.',
          'Ask how far to go into record types and caching once the main path is clear.',
        ],
        strongAnswer: [
          'Purpose: DNS turns the names people use into the addresses machines use, through a distributed hierarchy rather than one central list.',
          "Order: the browser's cache, then the operating system's cache and hosts file, then a recursive resolver, often the internet provider's or a public one.",
          "The resolver's walk: a root server refers it to the servers for the top-level domain, which refer it to the domain's authoritative name servers, which return the record.",
          'Records: A and AAAA for IPv4 and IPv6 addresses, CNAME for an alias that needs its own lookup, NS for the authoritative servers.',
          'Caching: every answer carries a time to live, failed lookups are cached too, and a changed record reaches users only as cached copies expire.',
          'Frontend side: each new third-party host costs a lookup, which a `dns-prefetch` hint can start early, and a failed lookup shows as a network error, not an HTTP status.',
        ],
        commonMiss:
          'Saying the browser asks a single DNS server and gets an answer, or treating a record change as instant when cached answers live until their time to live runs out.',
        resourceLabel: 'Practise expiry by time to live in the storage TTL cache task (free)',
        resourcePath: '/javascript/coding/js-storage-ttl-cache',
        reportedRound: { label: CLOUDFLARE_HM_DNS_2024_LABEL, url: CLOUDFLARE_HM_DNS_2024_URL },
      },
      {
        id: 'ai-assisted-bug-fixing',
        title: 'Fix bugs with an AI assistant in a project you do not know well',
        statement:
          'In a project and environment you are not fully familiar with, fix the bugs you are given by prompting an AI tool, and show the interviewer how you check each change before you keep it.',
        whatThisMeasures:
          'Judgement with an assistant: giving it the right context, reading and testing what it writes, and staying the one who understands the fix.',
        clarifyFirst: [
          'Ask which tools you may use and whether the interviewer wants to see your prompts; accounts differ, and a 2025 Cloudflare app round allowed no AI tools at all.',
          'Ask how to run the project and its tests before you change anything.',
          'Ask whether the bugs come with steps to reproduce, or finding them is part of the task.',
        ],
        strongAnswer: [
          'Get the project running and reproduce each bug before you prompt, so you know what fixed looks like.',
          'Use the tool to read first: ask where the behaviour lives and what a module does, then check its answer against the code.',
          'Prompt with context: the wrong behaviour, the expected one, the files involved and the limits, such as not changing a public interface.',
          'Read every diff it suggests, run the reproduction and the tests, and reject any change you cannot explain.',
          'Say aloud what you accept and why, and cover each fix with a new or updated test.',
        ],
        commonMiss:
          'Pasting the error into the tool and accepting the first patch, so the bug moves elsewhere and you cannot explain the change when asked.',
        resourceLabel: 'Fix four bugs in an invoicing repo you have not seen (Premium)',
        resourcePath: '/javascript/debug/js-debug-bug-squash-invoices',
        reportedRound: { label: CLOUDFLARE_AUSTIN_2026_LABEL, url: CLOUDFLARE_AUSTIN_2026_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Rehearse the link question as a two-minute answer with a deeper layer ready',
    intro:
      'The open question came up in first calls with a manager, next to behavioural questions, and one of those calls lasted about 20 minutes. Say the whole path in about two minutes in the order below, then keep one deeper layer ready for wherever the interviewer stops you.',
    steps: [
      {
        title: 'Say the path in five beats',
        description: 'Address, name, request, response, page: one sentence each, so the interviewer hears the whole trip before any detail.',
      },
      {
        title: 'Prepare one layer under each beat',
        description:
          'How the browser tells a URL from a search; the caches and the resolver behind the name; what HTTPS adds; what a redirect or a 304 does; how parsing, layout and paint follow.',
      },
      {
        title: 'Tie each beat to frontend work',
        description:
          'Redirect chains you can remove, cache headers you set, render-blocking CSS and scripts you can defer, and the extra lookup each third-party host costs.',
      },
      {
        title: 'Show it in DevTools',
        description:
          'Load a page with the Network panel open and read one request aloud: its status, its headers, whether it came from cache, and where its time went.',
      },
      {
        title: 'Expect the neighbouring questions',
        description:
          "A 2025 hiring manager round asked about DNS and HTTP versus HTTPS beside the request's life cycle, so the layers under the name and the request double as answers to those questions.",
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Cloudflare frontend interview preparation plan',
    intro:
      'Two days on the web questions hiring managers asked across teams, then one day each for the JavaScript screen, the React and TypeScript hour, debugging, the design hour, and the Orange Cloud and closing calls.',
    days: [
      {
        day: 'Day 1',
        focus:
          'The link question, end to end: say what happens from pressing enter to the painted page in two minutes and five steps, then go one layer deeper on each step without notes.',
        artifact: 'A two-minute recording and a one-page outline with a deeper layer under each step.',
      },
      {
        day: 'Day 2',
        focus:
          'DNS and HTTP versus HTTPS: explain how a host name becomes an address and what HTTPS adds, each in under two minutes, the way hiring manager screens on other teams asked them.',
        artifact:
          'Two short answers, each tied to something you have seen at work, such as a redirect to HTTPS or a record change that took hours to reach users.',
      },
      {
        day: 'Day 3',
        focus:
          'The 45-minute JavaScript screen: small array and object tasks written with recursion and array methods, each in about 30 minutes, the time the 2025 candidate needed, then promise chains explained aloud.',
        artifact: 'Three solved tasks with their edge cases, and a paragraph on how an error travels through a promise chain.',
      },
      {
        day: 'Day 4',
        focus:
          'React and TypeScript against the clock: set up your environment the day before, then spend an hour adding small features to a React and TypeScript app with only the tools the 2025 round allowed, typing every response you use.',
        artifact: 'A timed log of what you finished in the hour and where the minutes went.',
      },
      {
        day: 'Day 5',
        focus:
          "Debugging aloud: reproduce, narrow down, state the cause, fix and test, on a broken React screen and on code someone else wrote.",
        artifact: 'Two short write-ups, each with the cause, the fix and the test that proves it.',
      },
      {
        day: 'Day 6',
        focus:
          'Architecture of your own projects: draw the project you know best, give two decisions with the alternative and the trade-off behind each, state the numbers for scale, and say what you would change now.',
        artifact: 'One diagram and a five-minute walkthrough that ends on what you would improve.',
      },
      {
        day: 'Day 7',
        focus:
          'Orange Cloud and the closing calls: a story for each Cloudflare capability, the reported questions in the drill, why Cloudflare and which of its products you have used, a story of working with a product manager, and how you use AI coding tools.',
        artifact:
          "Stories you can tell in about two minutes each, and questions for the recruiter about your team's rounds and the tools each one allows.",
      },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Cloudflare frontend interview preparation questions',
    items: [
      {
        question: 'What is the Cloudflare Orange Cloud Interview?',
        answer:
          "It is Cloudflare's behavioural round. The company's careers page places it in the executive calls and says it focuses on the behaviours Cloudflare values, while the 2025 accounts that time the round describe 30 minutes among the panel interviews. The round decoder above sets out what Cloudflare says and what candidates were asked, and its drill has the 2025 questions and a scenario of ours for each capability.",
      },
      {
        question: 'Are these real Cloudflare interview questions?',
        answer:
          "Only in the sense that candidates reported them: each row comes from an account on Taro, LeetCode, Blind or PracHub, in our words, and Cloudflare has confirmed none. Few come from frontend titles, and a 2024 frontend candidate had to sign an NDA, so most rows are from other teams' loops and from interns and graduates, kept when the question is frontend or general. Cloudflare-badged commenters on Blind wrote in 2024 and 2025 that the questions vary by team.",
      },
      {
        question: 'What does the hiring manager ask in the first call?',
        answer:
          'In the frontend accounts, mostly your background: a 2025 frontend-heavy candidate had a 30-minute résumé walkthrough on the current role, the projects and whether the experience matched. On other teams the same call often added technical questions, such as what happens when you enter a link (the open question above), DNS, HTTP versus HTTPS and how you debug, and in a 2024 account a 20-minute call set up by a recruiter turned out to be the hiring manager round. Have answers ready for why Cloudflare, which of its products you have used, a recent project and how you resolve conflicts in code review.',
      },
      {
        question: 'Do Cloudflare frontend interviews include LeetCode-style problems?',
        answer:
          "None of the frontend accounts names one. Their technical rounds were a JavaScript screen, React and TypeScript coding, debugging and design, and a 2025 account from Portugal mentions small problems beside its TypeScript and debugging tasks without saying what they were. Loops on other teams did include them, in HackerRank tests, in technical screens with problems such as 3Sum and 4Sum, and in an onsite with a hit counter, so ask whether your team's loop has a HackerRank test.",
      },
      {
        question: "Are AI tools allowed in Cloudflare's coding rounds?",
        answer:
          "In the accounts it varied by round and team. The React and TypeScript round of a 2025 frontend-heavy loop allowed no AI tools. A 2025 candidate on a Go team used Google's AI for part of the code after the interviewer agreed, a 2026 software engineer in Austin had an AI-assisted coding challenge, and a 2026 senior leadership round for a Bengaluru role was all about how the candidate uses coding agents. We found no Cloudflare page that sets a rule for candidates, so ask the recruiter about each round.",
      },
      {
        question: 'How long does the Cloudflare interview process take?',
        answer:
          "The accounts range from days to months. A 2024 frontend candidate went from the hiring manager call through a five-call onsite in eight days, then, after three weeks of unanswered follow-ups, got a generic rejection; a 2025 frontend-heavy candidate applied in July and had the first round in October, after which things moved fast. A commenter with a Cloudflare badge did about eight interviews in two weeks after pushing for speed, and wrote that a fast track compresses the timeline but not the number of interviews. Cloudflare's careers page says it moves quickly once it has found the right person, and its post on 2026 internships puts the intern interview process at three to four weeks.",
      },
      {
        question: 'Is there a final call with Cloudflare executives?',
        answer:
          "Cloudflare's careers page lists executive calls with senior leadership as a hiring step, and a Cloudflare recruiting leader said on Cloudflare TV in 2025 that everyone who joins has a C-level interview of about 20 minutes. A 2026 frontend candidate's final C-level conversation was about why they wanted the job and why they would be a good fit. A 2026 software engineer in Austin toured the office and was invited to a final call with a senior executive or co-founder, but that call never took place: the candidate was told the role's direction had changed and Cloudflare was no longer moving forward. A 2026 senior account from India says the C-suite round takes about two weeks to schedule and carries a 10 to 15 per cent chance of no offer.",
      },
      {
        question: 'Do Cloudflare internship applicants get a coding assignment?',
        answer:
          "Cloudflare's post on its 2026 internships, published in September 2025, said it planned to fast-track the review of Software Engineering applicants who completed an assignment to build an AI-powered application on Cloudflare and submitted it with their application, that it would review applications in batches, and that the interview process would take three to four weeks. Most intern and new-graduate accounts from 2020 to 2023 also began with a coding assignment, some built and deployed with Cloudflare's own tools, followed in a 2023 loop by a hiring manager screen, pair programming and an HR interview.",
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Cloudflare rounds',
    intro:
      'Tasks you can rehearse alone before a Cloudflare loop: the browser end of the link question, an hour of React, a small JavaScript helper, a debugging exercise, design method and stories for the Orange Cloud round. Cloudflare set none of them; they practise the skills its rounds test.',
    items: [
      {
        label: 'How the browser parses and renders a page',
        description: 'The last part of the open link question: HTML into the DOM, CSS into the CSSOM, and what holds up the first paint.',
        path: '/html/trivia/html-parsing-rendering',
      },
      {
        label: 'React autocomplete in under an hour',
        description: 'A React task with debounce, stale responses and keyboard support, timed like the hour of React and TypeScript coding.',
        path: '/react/coding/react-autocomplete-search-starter',
      },
      {
        label: 'Get a value by path',
        description: 'A small JavaScript data helper for the 45-minute screen: write it once with reduce and once with recursion.',
        path: '/javascript/coding/js-get-by-path-1',
      },
      {
        label: 'Fix the async race in a fetch helper',
        description: 'Code a teammate wrote, with two bugs and tests: reproduce, find the cause and fix it, the method a hiring manager may ask you to describe.',
        path: '/javascript/debug/js-debug-async-race',
      },
      {
        label: 'Frontend fundamentals quiz',
        description: 'Questions on browsers, HTTP, CSS and JavaScript, to find your gaps before a manager asks how the web works.',
        path: '/guides/interview-blueprint/quiz',
      },
      {
        label: 'Frontend system design blueprint',
        description: 'A way to structure the design hour, whether the interviewer sets a prompt or asks about a project of your own.',
        path: '/guides/system-design-blueprint',
      },
      {
        label: 'STAR stories',
        description: 'Story structure for the Orange Cloud round, the method a commenter with a Cloudflare badge pointed to in 2024.',
        path: '/guides/behavioral/stories',
      },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro:
      "Every page this guide relies on, from Cloudflare's careers page to the {reports} public reports, is cited in the reported process, so the list at the end adds none of its own.",
    items: [],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Cloudflare practice set',
    copy: 'Premium opens every locked Cloudflare row, with its practice task or answer guide where it has one, and the whole Premium library on FrontendAtlas.',
    buttonLabel: 'Unlock the full Cloudflare practice set',
    src: 'company_preview_cloudflare',
  },
  about: [
    'Cloudflare frontend interview preparation',
    'Cloudflare Orange Cloud Interview',
    'React and TypeScript app coding round',
    'What happens when you enter a URL in the browser',
  ],
  indexAnchorLabel: 'Cloudflare frontend interview questions',
};
