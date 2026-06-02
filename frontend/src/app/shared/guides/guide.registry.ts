// shared/guides/guide.registry.ts
import { Type } from '@angular/core';

export type GuideAuthor = {
    type: 'Organization' | 'Person';
    name: string;
};

export type GuideSeo = {
    title?: string;
    description?: string;
    primaryKeyword?: string;
    keywords?: string[];
    faqPage?: {
        name?: string;
        items: Array<{
            question: string;
            answer: string;
        }>;
    };
    publishedAt?: string;
    updatedAt?: string;
    author?: GuideAuthor;
    draftSource?: string;
    searchIntent?: string;
    readerPromise?: string;
    uniqueAngle?: string;
    factCheckedAt?: string;
    reviewedBy?: string;
};

/** A single article entry */
export type GuideEntry = {
    slug: string;
    title: string;
    load: () => Promise<Type<any>>;
    minutes?: number;
    summary?: string;
    seo?: GuideSeo;
};

export type GuideGroup = {
    title: string;
    items: Array<{ slug: string }>;
};

export function navFor(
    registry: GuideEntry[],
    slug: string,
    base?: string
) {
    const idx = registry.findIndex(e => e.slug === slug);
    const current = idx >= 0 ? registry[idx] : null;

    const baseSeg = base ?? inferBase(registry) ?? '';
    const prev =
        idx > 0 ? (['/', 'guides', baseSeg, registry[idx - 1].slug] as any[]) : null;
    const next =
        idx >= 0 && idx < registry.length - 1
            ? (['/', 'guides', baseSeg, registry[idx + 1].slug] as any[])
            : null;

    return { current, prev, next, idx };
}

function inferBase(registry: GuideEntry[]): string | null {
    if (registry === PLAYBOOK) return 'interview-blueprint';
    if (registry === SYSTEM) return 'system-design-blueprint';
    if (registry === BEHAVIORAL) return 'behavioral';
    return null;
}

/* ---------------------------------- PLAYBOOK ---------------------------------- */

export const PLAYBOOK: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Frontend Interview Preparation Guide: Process, Rounds, and Plan',
        minutes: 10,
        summary: 'Understand each interview stage, what frontend hiring teams evaluate, and how to build a realistic prep plan that leads to stronger interview performance.',
        seo: {
            title: 'Frontend Interview Preparation Guide: Process, Rounds, and Plan',
            description: 'Understand each interview stage, what frontend hiring teams evaluate, and how to build a realistic prep plan that leads to stronger interview performance.',
            primaryKeyword: 'frontend interview preparation guide',
            keywords: ['frontend interview preparation guide', 'frontend interview process', 'frontend interview rounds'],
            publishedAt: '2025-08-30',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/fe-intro-article.component')
                .then(m => m.FeIntroArticle),
    },
    {
        slug: 'coding-interviews',
        title: 'Frontend Coding Interviews: Solve Prompts Under Pressure',
        minutes: 12,
        summary: 'A practical framework to turn ambiguous prompts into working solutions fast, avoid common coding-round mistakes, and communicate clearly under time limits.',
        seo: {
            title: 'Frontend Coding Interviews: Solve Prompts Under Pressure',
            description: 'A practical framework to turn ambiguous prompts into working solutions fast, avoid common coding-round mistakes, and communicate clearly under time limits.',
            primaryKeyword: 'frontend coding interviews',
            keywords: ['frontend coding interviews', 'frontend coding interview tips', 'frontend coding rounds'],
            publishedAt: '2025-08-30',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/fe-coding-article.component')
                .then(m => m.FeCodingArticle),
    },
    {
        slug: 'javascript-interviews',
        title: 'JavaScript Interview Patterns and Answers',
        minutes: 15,
        summary: 'Practice high-frequency JavaScript interview problems, apply fast solution patterns, and explain trade-offs clearly with examples that mirror real rounds.',
        seo: {
            title: 'JavaScript Interview Patterns and Answers',
            description: 'Practice high-frequency JavaScript interview problems, apply fast solution patterns, and explain trade-offs clearly with examples that mirror real rounds.',
            primaryKeyword: 'javascript interview patterns',
            keywords: ['javascript interview patterns', 'javascript interview questions', 'javascript interview answers'],
            publishedAt: '2025-09-27',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/js-problems-article.component')
                .then(m => m.JsProblemsArticle),
    },
    {
        slug: 'dsa-for-fe',
        title: 'DSA for Frontend Interviews: Just Enough to Pass Coding Rounds',
        minutes: 18,
        summary: 'A minimum frontend interview toolkit with worked examples, prep anti-patterns, and the arrays/maps/queues patterns interviewers actually test.',
        seo: {
            title: 'Frontend Interview DSA: The Minimum Toolkit and Prep Anti-Patterns',
            description: 'A minimum frontend interview toolkit with worked examples, prep anti-patterns, and the arrays/maps/queues patterns interviewers actually test.',
            primaryKeyword: 'dsa for frontend interviews',
            keywords: ['dsa for frontend interviews', 'frontend dsa interview prep', 'javascript data structures interview'],
            publishedAt: '2025-09-27',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/fe-dsa-article.component')
                .then(m => m.FeDsaArticle),
    },
    {
        slug: 'ui-interviews',
        title: 'Frontend UI Interviews: Build Accessible Components Under Time',
        minutes: 20,
        summary: 'Learn exactly what to build first, how to add accessibility and polish, and how to finish UI interview prompts with a complete, explainable result.',
        seo: {
            title: 'Frontend UI Interviews: Build Accessible Components Under Time',
            description: 'Learn exactly what to build first, how to add accessibility and polish, and how to finish UI interview prompts with a complete, explainable result.',
            primaryKeyword: 'frontend ui interviews',
            keywords: ['frontend ui interviews', 'frontend ui interview prep', 'frontend component interview'],
            publishedAt: '2025-09-27',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/fe-ui-in-60.component')
                .then(m => m.FeUiIn60Article),
    },
    {
        slug: 'api-design',
        title: 'Component API Design for Frontend Interviews: Props, Events, Trade-offs',
        minutes: 14,
        summary: 'Interview-focused patterns for designing reusable components with clear APIs, accessibility, and scalable composition decisions.',
        seo: {
            title: 'Component API Design for Frontend Interviews: Props, Events, Trade-offs',
            description: 'Interview-focused patterns for designing reusable components with clear APIs, accessibility, and scalable composition decisions.',
            primaryKeyword: 'component api design for frontend interviews',
            keywords: ['component api design for frontend interviews', 'frontend component api design', 'props events tradeoffs'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/component-api-design-article.component')
                .then(m => m.ComponentApiDesignArticle),
    },
    {
        slug: 'javascript-prep-path',
        title: 'JavaScript Interview Prep Path: Async, Closures, State',
        minutes: 9,
        summary: 'Use this JavaScript interview prep path to stabilize async ordering, closure bugs, stale responses, and utility prompts with a 7/14/30-day study plan for frontend engineers.',
        seo: {
            title: 'JavaScript Interview Prep Path: Async, Closures, State',
            description: 'Use this JavaScript interview prep path to stabilize async ordering, closure bugs, stale responses, and utility prompts with a 7/14/30-day study plan for frontend engineers.',
            primaryKeyword: 'javascript prep path',
            keywords: ['javascript prep path', 'javascript interview prep path', 'javascript interview study plan', 'javascript async closures state'],
            publishedAt: '2026-02-12',
            updatedAt: '2026-05-20',
            searchIntent: 'Find a JavaScript interview study plan that turns async, closures, stale state, and utility prompts into a repeatable 7/14/30-day prep system.',
            readerPromise: 'Use this to turn JavaScript screens and frontend loop follow-ups into a 7/14/30-day study plan with concrete async, closure, and utility-drill priorities.',
            uniqueAngle: 'Framework-specific bug families and direct drill mapping, not a generic topic list.',
            factCheckedAt: '2026-04-19',
            reviewedBy: 'FrontendAtlas Editor',
        },
        load: () =>
            import('../../features/guides/playbook/javascript-prep-path-article.component')
                .then(m => m.JavascriptPrepPathArticle),
    },
    {
        slug: 'react-prep-path',
        title: 'How to Prepare for a React Interview: 7/14/30-Day Plan',
        minutes: 9,
        summary: 'Use this React interview preparation path to learn how to prepare for a React interview with hooks, state, rendering, coding drills, testing, and a 7/14/30-day study plan.',
        seo: {
            title: 'How to Prepare for a React Interview: 7/14/30-Day Plan',
            description: 'React interview preparation study plan for hooks, state, rendering, coding drills, testing, performance, and how to prepare in 7, 14, or 30 days.',
            primaryKeyword: 'how to prepare for react interview',
            keywords: [
                'how to prepare for react interview',
                'react interview preparation',
                'react interview study plan',
                'react interview prep path',
                'react hooks interview prep',
                'react coding interview preparation',
                'senior react interview preparation',
                'react interview preparation 7 days',
            ],
            faqPage: {
                name: 'React interview preparation FAQ',
                items: [
                    {
                        question: 'How do I prepare for a React interview?',
                        answer: 'Use a repeatable loop: review one React concept, answer a short trivia prompt, build one UI coding drill, then write one mistake and one prevention rule. Prioritize hooks, effects, state ownership, rendering behavior, forms, testing, and performance before broad topic browsing. Where to practice in FrontendAtlas: start with /guides/framework-prep/react-prep-path, then pair /coding?tech=react&kind=trivia with /coding?tech=react&kind=coding.',
                    },
                    {
                        question: 'What should I study first for a React interview?',
                        answer: 'Start with components, JSX, props, state, one-way data flow, keys, controlled inputs, hooks, useEffect cleanup, and stale closures. These topics support most React coding prompts and make advanced rendering or performance questions easier to reason about. Practical rule: do not move into architecture until you can explain state snapshots and cleanup without guessing.',
                    },
                    {
                        question: 'How long does it take to prepare for a React interview?',
                        answer: 'A 7-day pass can refresh high-risk gaps, 14 days can make the practice loop repeatable, and 30 days can build mock-ready depth. Extend the plan when the same miss repeats across trivia, coding, or review notes. Practical rule: timeline is less important than whether your misses stop repeating.',
                    },
                    {
                        question: 'How should I practice React coding interview questions?',
                        answer: 'Build small UI prompts under time pressure, then harden the result with loading, error, empty, cleanup, accessibility, and state-reset cases. Pair each coding drill with one related concept answer so implementation and explanation improve together. Where to practice in FrontendAtlas: use /coding?tech=react&kind=coding and review linked React trivia immediately after.',
                    },
                    {
                        question: 'How do I prepare for a senior React interview?',
                        answer: 'Focus on state ownership, effect cleanup, rendering internals, Context boundaries, Server Components, testing strategy, profiling, and trade-off communication. Senior preparation should include why a design scales, what can fail, and how you would validate the decision. Practical rule: every answer should include a correctness risk, a performance risk, or a maintainability trade-off.',
                    },
                ],
            },
            publishedAt: '2026-02-12',
            updatedAt: '2026-05-20',
            searchIntent: 'Find how to prepare for a React interview with a practical study plan for hooks, state, rendering, coding drills, testing, and performance.',
            readerPromise: 'Use this React interview preparation path to turn hooks, rendering, coding, testing, and performance practice into a 7/14/30-day study plan.',
            uniqueAngle: 'React-specific render and state-design failure patterns tied directly to trivia and coding drills.',
            factCheckedAt: '2026-05-20',
            reviewedBy: 'FrontendAtlas Editor',
        },
        load: () =>
            import('../../features/guides/playbook/react-prep-path-article.component')
                .then(m => m.ReactPrepPathArticle),
    },
    {
        slug: 'angular-prep-path',
        title: 'Angular Interview Prep Path: RxJS, Architecture, Tests',
        minutes: 9,
        summary: 'Practice Angular interview decisions on RxJS flows, change detection, DI boundaries, and testing strategy with a 7/14/30-day prep plan for frontend engineers.',
        seo: {
            title: 'Angular Interview Prep Path: RxJS, Architecture, Tests',
            description: 'Practice Angular interview decisions on RxJS flows, change detection, DI boundaries, and testing strategy with a 7/14/30-day prep plan for frontend engineers.',
            primaryKeyword: 'angular prep path',
            keywords: ['angular prep path', 'angular interview prep path', 'angular interview study plan', 'angular rxjs architecture tests'],
            publishedAt: '2026-02-12',
            updatedAt: '2026-05-20',
            searchIntent: 'Find an Angular interview study plan that makes RxJS, change detection, DI, forms, and testing choices easier to explain and implement.',
            readerPromise: 'Use this to turn Angular loops on RxJS, change detection, DI, and tests into a 7/14/30-day prep plan with concrete operator and architecture priorities.',
            uniqueAngle: 'Angular-specific debugging and architecture decisions connected directly to operator choice, state boundaries, and tests.',
            factCheckedAt: '2026-04-19',
            reviewedBy: 'FrontendAtlas Editor',
        },
        load: () =>
            import('../../features/guides/playbook/angular-prep-path-article.component')
                .then(m => m.AngularPrepPathArticle),
    },
    {
        slug: 'vue-prep-path',
        title: 'Vue Interview Prep Path: Reactivity, Rendering, State',
        minutes: 9,
        summary: 'Build Vue interview confidence with a 7/14/30-day prep path on reactivity traps, nextTick timing, component contracts, and practical coding/trivia drills.',
        seo: {
            title: 'Vue Interview Prep Path: Reactivity, Rendering, State',
            description: 'Build Vue interview confidence with a 7/14/30-day prep path on reactivity traps, nextTick timing, component contracts, and practical coding/trivia drills.',
            primaryKeyword: 'vue prep path',
            keywords: ['vue prep path', 'vue interview prep path', 'vue interview study plan', 'vue reactivity rendering state'],
            publishedAt: '2026-02-12',
            updatedAt: '2026-05-20',
            searchIntent: 'Find a Vue interview study plan that makes reactivity, nextTick, emits, router, and state trade-offs easier to explain under follow-ups.',
            readerPromise: 'Use this to turn Vue reactivity, emits, nextTick, router, and state-tradeoff interviews into a 7/14/30-day prep plan with concrete debugging and coding priorities.',
            uniqueAngle: 'Vue-specific reactivity and component-contract pitfalls tied directly to drills instead of generic topic buckets.',
            factCheckedAt: '2026-04-19',
            reviewedBy: 'FrontendAtlas Editor',
        },
        load: () =>
            import('../../features/guides/playbook/vue-prep-path-article.component')
                .then(m => m.VuePrepPathArticle),
    },
    {
        slug: 'system-design',
        title: 'Frontend System Design Interviews: A Fast Answer Framework',
        minutes: 8,
        summary: 'Use a step-by-step framework to answer frontend system design questions, cover trade-offs clearly, and avoid common interview anti-patterns.',
        seo: {
            title: 'Frontend System Design Interviews: A Fast Answer Framework',
            description: 'Use a step-by-step framework to answer frontend system design questions, cover trade-offs clearly, and avoid common interview anti-patterns.',
            primaryKeyword: 'frontend system design interviews',
            keywords: ['frontend system design interviews', 'frontend system design framework', 'frontend architecture interview'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/fe-system-design-fast-framework-article.component')
                .then(m => m.FeSystemDesignFastFrameworkArticle),
    },
    {
        slug: 'quiz',
        title: 'Frontend Interview Fundamentals Quiz: Browser, CSS, JavaScript, HTTP',
        minutes: 10,
        summary: 'Use this quick fundamentals check to find weak spots before interviews and practice concise, high-signal answers hiring teams expect.',
        seo: {
            title: 'Frontend Interview Fundamentals Quiz: Browser, CSS, JavaScript, HTTP',
            description: 'Use this quick fundamentals check to find weak spots before interviews and practice concise, high-signal answers hiring teams expect.',
            primaryKeyword: 'frontend interview fundamentals quiz',
            keywords: ['frontend interview fundamentals quiz', 'frontend fundamentals check', 'browser css javascript http quiz'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/fundamentals-check-article.component')
                .then(m => m.FundamentalsCheckArticle),
    },
    {
        slug: 'resume',
        title: 'Frontend Resume for Interviews: What Gets Calls and What Gets Rejected',
        minutes: 12,
        summary: 'A frontend resume interview checklist covering recruiter skim patterns, rejection triggers, and the anti-patterns that cost callbacks.',
        seo: {
            title: 'Frontend Resume Interview Checklist: What Gets Calls and What Gets Rejected',
            description: 'A frontend resume interview checklist covering recruiter skim patterns, rejection triggers, and the anti-patterns that cost callbacks.',
            primaryKeyword: 'frontend resume for interviews',
            keywords: ['frontend resume for interviews', 'frontend resume guide', 'frontend resume tips'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/playbook/resume-article.component')
                .then(m => m.ResumeArticle),
    },
];

export const PLAYBOOK_GROUPS: Array<{ key: string; title: string; items: Array<{ slug: string }> }> = [
    { key: 'intro', title: 'Introduction', items: [{ slug: 'intro' }] },
    {
        key: 'coding', title: 'Coding interviews', items: [
            { slug: 'coding-interviews' },
            { slug: 'javascript-interviews' },
            { slug: 'dsa-for-fe' },
        ]
    },
    {
        key: 'ui', title: 'User interface', items: [
            { slug: 'ui-interviews' },
            { slug: 'api-design' },
        ]
    },
    {
        key: 'framework-paths', title: 'Framework prep paths', items: [
            { slug: 'javascript-prep-path' },
            { slug: 'react-prep-path' },
            { slug: 'angular-prep-path' },
            { slug: 'vue-prep-path' },
        ]
    },
    { key: 'system', title: 'System design', items: [{ slug: 'system-design' }] },
    { key: 'quiz', title: 'Fundamentals', items: [{ slug: 'quiz' }] },
    { key: 'resume', title: 'Resume preparation', items: [{ slug: 'resume' }] },
];

/* ---------------------------------- SYSTEM DESIGN ---------------------------------- */

export const SYSTEM: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Front-End System Design: What It Really Tests',
        minutes: 8,
        summary: 'Learn what a front-end system design interview really scores, the senior trade-offs backend-heavy guides miss, and how to structure answers under pressure.',
        seo: {
            title: 'Front-End System Design Interview: What It Really Tests',
            description: 'Learn what frontend system design interviews test, how frontend scope differs from backend design, what interviewers score, and where to practice next.',
            primaryKeyword: 'what frontend system design interviews test',
            keywords: [
                'frontend system design interview overview',
                'frontend vs backend system design',
                'frontend system design interview signals',
                'what interviewers look for frontend system design',
                'frontend system design for senior frontend engineers',
            ],
            faqPage: {
                name: 'Frontend system design interview overview FAQ',
                items: [
                    {
                        question: 'What do frontend system design interviews test?',
                        answer: 'Frontend system design interviews test how you clarify requirements, choose client architecture, model state and API contracts, handle UX and accessibility, and explain performance or reliability tradeoffs.',
                    },
                    {
                        question: 'How is frontend system design different from backend system design?',
                        answer: 'Frontend system design focuses on browser rendering, component boundaries, client state, API consumption, accessibility, and user-visible failures. Backend design focuses more on services, storage, queues, replication, and infrastructure scaling.',
                    },
                    {
                        question: 'What do interviewers look for in frontend system design?',
                        answer: 'Interviewers look for clear scoping, structured architecture, practical state and data decisions, user-aware edge cases, performance reasoning, and tradeoff communication.',
                    },
                    {
                        question: 'Do frontend engineers need backend depth for system design interviews?',
                        answer: 'Frontend engineers need enough backend awareness to define contracts, pagination, auth boundaries, caching, and failure behavior, but scoring usually prioritizes client architecture and user experience decisions.',
                    },
                    {
                        question: 'Where should I practice after this frontend system design intro?',
                        answer: 'After the intro, learn the RADIO framework, review the weakest deep dive, then practice real prompts such as infinite scroll, realtime search, news feeds, notifications, AI chat UI, and design system architecture.',
                    },
                ],
            },
            readerPromise: 'Use this intro to understand what frontend system design interviews test, how frontend scope differs from backend design, which signals interviewers score, and when to move into RADIO and practice prompts.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-intro.component')
                .then(m => m.SystemDesignIntroArticle)
    },
    {
        slug: 'foundations',
        title: 'Scope, Constraints, and Trade-offs',
        minutes: 12,
        summary: 'Clarifying requirements, identifying constraints, and making principled trade-offs before you draw boxes.',
        seo: {
            title: 'Frontend System Design Interview Foundations: Scope and Trade-offs',
            description: 'Clarify frontend system design interview requirements, constraints, scope questions, and trade-offs in the first 5-8 minutes before architecture.',
            primaryKeyword: 'frontend system design requirements and tradeoffs',
            keywords: [
                'frontend system design constraints',
                'frontend system design scope questions',
                'system design clarification questions frontend',
                'frontend system design tradeoffs',
                'requirements clarification frontend system design',
                'frontend system design interview foundations',
                'frontend system design requirements checklist',
            ],
            faqPage: {
                name: 'Frontend system design requirements and tradeoffs FAQ',
                items: [
                    {
                        question: 'What requirements should I clarify in a frontend system design interview?',
                        answer: 'Clarify users, core flow, included and excluded features, device and network assumptions, data freshness, accessibility, security, performance budgets, and success metrics.',
                    },
                    {
                        question: 'How long should requirements clarification take?',
                        answer: 'In a 45-minute frontend system design interview, spend roughly the first 5-8 minutes on scope, constraints, and trade-offs before moving into architecture.',
                    },
                    {
                        question: 'What frontend constraints matter most before architecture?',
                        answer: 'SEO, realtime freshness, mobile performance, low-connectivity behavior, accessibility, auth boundaries, data volume, and observability requirements usually change frontend architecture.',
                    },
                    {
                        question: 'How do I explain trade-offs in a frontend system design interview?',
                        answer: 'Name the decision, connect it to the requirement, state what you gain, state what you give up, and explain when you would revisit the choice.',
                    },
                    {
                        question: 'What mistakes should I avoid before drawing architecture?',
                        answer: 'Avoid drawing before scope is clear, skipping non-functional requirements, making every feature v1, naming tools without trade-offs, and ignoring interviewer priorities.',
                    },
                ],
            },
            readerPromise: 'Use this foundations guide to clarify frontend system design requirements, constraints, and trade-offs in the first 5-8 minutes before moving into RADIO requirements and architecture.',
            publishedAt: '2025-08-31',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-foundations')
                .then(m => m.SystemDesignFoundationsArticle)
    },
    {
        slug: 'framework',
        title: 'Frontend System Design 5-Step Answer Method',
        minutes: 14,
        summary: 'A quick-start answer flow for structuring frontend system design interviews before going deeper with RADIO.',
        seo: {
            title: 'Frontend System Design 5-Step Answer Method',
            description: 'Use a 5-step frontend system design interview flow to clarify requirements, map components, define data contracts, choose architecture, and close trade-offs.',
            primaryKeyword: 'frontend system design 5 step method',
            keywords: [
                'frontend system design answer flow',
                'frontend system design interview structure',
                'how to structure frontend system design interview',
                'frontend system design interview framework',
                'frontend system design answer method',
                '45 minute frontend system design interview',
            ],
            faqPage: {
                name: 'Frontend system design 5-step answer method FAQ',
                items: [
                    {
                        question: 'What is a frontend system design answer method?',
                        answer: 'A frontend system design answer method is a repeatable interview structure for clarifying requirements, mapping UI surfaces, defining state and API contracts, choosing architecture, and closing with trade-offs.',
                    },
                    {
                        question: 'How should I structure a frontend system design interview answer?',
                        answer: 'Start with requirements, map the main surfaces and components, define state/data/API contracts, choose the architecture and rendering model, then stress-test the design and summarize trade-offs.',
                    },
                    {
                        question: 'How much time should each step take?',
                        answer: 'In a 45-minute frontend system design interview, spend about 0-5 minutes clarifying, 5-12 on surfaces, 12-22 on state/data/API, 22-35 on architecture, and 35-45 on risks and recap.',
                    },
                    {
                        question: 'What is the difference between this 5-step method and RADIO?',
                        answer: 'This 5-step method is a quick answer flow for staying organized. RADIO is the deeper frontend system design framework that expands Requirements, Architecture, Data, Interface, and Optimizations.',
                    },
                    {
                        question: 'What should I say at the end of a frontend system design answer?',
                        answer: 'Close by naming the v1 design, the biggest trade-offs, the risks you would monitor, and which improvements you would make if scale, reliability, or product needs changed.',
                    },
                ],
            },
            readerPromise: 'Use this 5-step frontend system design answer method to structure a 45-minute interview before going deeper with the RADIO framework.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-framework')
                .then(m => m.SystemDesignFrameworkArticle)
    },
    {
        slug: 'radio-framework',
        title: 'Frontend System Design Interview Framework: RADIO Answer Template',
        minutes: 20,
        summary: 'Use RADIO as a frontend system design interview answer template with a 45-minute structure, checklist, and examples.',
        seo: {
            title: 'RADIO Framework: Frontend System Design Answer Template',
            description: 'Use RADIO to structure a 45-minute frontend system design interview answer: clarify scope, draw architecture, define data/API contracts, and close trade-offs.',
            primaryKeyword: 'RADIO framework frontend system design',
            keywords: [
                'frontend system design interview answer template',
                'RADIO answer template',
                'RADIO framework for frontend system design interviews',
                'frontend system design interview checklist',
                'frontend system design 45 minute framework',
                'how to answer frontend system design interview',
                'requirements architecture data interface optimizations',
                'what is the RADIO framework in frontend system design',
                'how to use RADIO framework for frontend system design interview',
                'frontend system design answer template 45 minutes',
                'what should I draw during a frontend system design interview',
                'RADIO framework autocomplete frontend system design',
                'RADIO framework news feed frontend system design',
                'RADIO framework chat frontend system design',
                'frontend system design interface API taxonomy',
            ],
            faqPage: {
                name: 'RADIO framework frontend system design interview FAQ',
                items: [
                    {
                        question: 'What is the RADIO framework in frontend system design?',
                        answer: 'RADIO is a frontend system design answer template that moves through Requirements, Architecture, Data, Interface, and Optimizations so the answer has scope, system shape, contracts, user behavior, and production trade-offs.',
                    },
                    {
                        question: 'How do I use RADIO to answer a frontend system design interview question?',
                        answer: 'Start by clarifying the user flow and constraints, then sketch the frontend architecture, model server and client state, define component and API interfaces, and close with the highest-risk optimizations. Keep one core flow as the thread so every RADIO step supports the same answer.',
                    },
                    {
                        question: 'What should I draw during a RADIO answer?',
                        answer: 'Draw a scope box, client architecture, request flow, data contract, component/interface ownership, UI state map, and optimization backlog. Each artifact should connect to the same core user flow.',
                    },
                    {
                        question: 'How do I use RADIO for autocomplete, news feed, or chat?',
                        answer: 'Keep the RADIO steps stable while the prompt changes. For autocomplete, go deep on stale requests and combobox behavior; for news feed, pagination and cache consistency; for chat, realtime events, drafts, and recovery.',
                    },
                    {
                        question: 'Is RADIO the best framework for frontend system design interviews?',
                        answer: 'RADIO is a strong default because it keeps frontend answers ordered from scope to architecture, data contracts, interface behavior, and optimization trade-offs. Adapt it when the interviewer asks to go deeper in one area.',
                    },
                ],
            },
            publishedAt: '2026-02-18',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-radio-framework')
                .then(m => m.SystemDesignRadioFrameworkArticle)
    },
    {
        slug: 'radio-requirements',
        title: 'R - Requirements Deep Dive for Frontend System Design Interviews',
        minutes: 16,
        summary: 'Master requirements in frontend system design interviews with a repeatable script, scope box, metrics, and edge-case checklist before architecture.',
        seo: {
            title: 'Frontend System Design Requirements Exploration',
            description: 'Use RADIO Requirements to clarify frontend system design interview scope, constraints, functional requirements, NFRs, and success metrics before architecture.',
            primaryKeyword: 'frontend system design requirements exploration',
            keywords: [
                'frontend system design clarifying questions',
                'frontend system design requirements checklist',
                'RADIO requirements frontend system design',
                'first 5 minutes frontend system design interview',
                'functional and non-functional requirements frontend system design',
                'requirements questions frontend system design interview',
                'requirements deep dive for frontend system design interviews',
                'frontend system design requirements',
                'what clarifying questions should I ask in frontend system design',
                'frontend system design requirements before architecture',
                'frontend system design scope box',
                'frontend system design success metrics',
                'frontend system design assumptions and risk log',
                'frontend system design architecture handoff',
                'requirements exploration autocomplete frontend system design',
                'requirements questions news feed frontend system design',
                'requirements checklist dashboard frontend system design',
            ],
            faqPage: {
                name: 'Frontend system design requirements exploration FAQ',
                items: [
                    {
                        question: 'What is Requirements exploration in frontend system design?',
                        answer: 'Requirements exploration is the RADIO step where you clarify the user flow, scope, constraints, functional requirements, non-functional requirements, success metrics, and risks before drawing architecture.',
                    },
                    {
                        question: 'What clarifying questions should I ask first?',
                        answer: 'Start with the primary user, core task, v1 scope, out-of-scope work, scale assumptions, freshness needs, accessibility baseline, latency target, and failure states that would change the design.',
                    },
                    {
                        question: 'What is the difference between functional and non-functional requirements?',
                        answer: 'Functional requirements describe what the UI must do, such as search, filter, drag, submit, or notify. Non-functional requirements describe quality constraints such as latency, accessibility, reliability, security, offline behavior, and observability.',
                    },
                    {
                        question: 'How long should Requirements take in a frontend system design interview?',
                        answer: 'In a 45-minute frontend system design interview, spend roughly the first 5-8 minutes on Requirements. Use more time only when the prompt is ambiguous or the interviewer signals that constraints are the main challenge.',
                    },
                    {
                        question: 'What should I produce before moving to architecture?',
                        answer: 'Produce a one-line user flow, a Must/Nice/Out scope box, top constraints, two or three success metrics, an assumptions and risk log, and a clear handoff statement into architecture.',
                    },
                ],
            },
            readerPromise: 'Use RADIO Requirements to turn clarifying questions into a scope box, functional and non-functional requirements, success metrics, and a clean architecture handoff.',
            publishedAt: '2026-02-18',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-radio-requirements')
                .then(m => m.SystemDesignRadioRequirementsArticle)
    },
    {
        slug: 'architecture',
        title: 'A - Frontend System Design Architecture Guide',
        minutes: 18,
        summary: 'Use this interview guide to structure frontend system design architecture decisions, from rendering boundaries and caching to clear trade-off framing.',
        seo: {
            title: 'Frontend System Design Architecture Guide',
            description: 'Design frontend system architecture with client-side boundaries, rendering strategy, data flow, caching, BFF trade-offs, and interview-ready diagrams.',
            primaryKeyword: 'frontend system design architecture guide',
            keywords: [
                'frontend architecture interview guide',
                'frontend client side architecture interview',
                'frontend rendering strategy system design',
                'frontend architecture diagram interview',
                'CSR vs SSR frontend system design',
                'frontend system design BFF',
                'route by route rendering strategy',
                'frontend system design tradeoffs',
                'what is frontend system design architecture',
                'what should I draw in a frontend architecture interview',
                'how to choose CSR SSR SSG edge rendering',
                'when to use BFF in frontend system design',
                'frontend system design client side boundaries',
                'frontend system design data flow caching',
                'frontend architecture interview rendering strategy',
                'frontend system design architecture diagram',
                'autocomplete frontend architecture interview',
                'news feed frontend architecture system design',
                'dashboard widgets frontend architecture',
                'AI chat frontend architecture system design',
                'design system architecture frontend interview',
            ],
            faqPage: {
                name: 'Frontend system design architecture FAQ',
                items: [
                    {
                        question: 'What is frontend system design architecture?',
                        answer: 'Frontend system design architecture is the part of the interview where you choose client-side boundaries, rendering strategy, data flow, cache layers, BFF or API boundaries, and resilience guardrails that satisfy the requirements.',
                    },
                    {
                        question: 'How do I choose CSR, SSR, SSG, or edge rendering?',
                        answer: 'Choose rendering per route. Use SSR or SSG for SEO and fast public entry routes, CSR for highly interactive authenticated tools, and edge rendering when global latency or cacheable personalization changes the user experience.',
                    },
                    {
                        question: 'What should I draw in a frontend architecture interview?',
                        answer: 'Draw the browser, app shell, router and rendering boundary, server-state cache, UI state, API or BFF boundary, downstream services, failure paths, and observability hooks that prove the design can run in production.',
                    },
                    {
                        question: 'When should I use a BFF in frontend system design?',
                        answer: 'Use a BFF when it reduces client orchestration, aggregates multiple APIs, shapes auth/session-aware responses, enables partial responses, or gives a cleaner caching and latency boundary. Skip it when it is backend topology noise.',
                    },
                    {
                        question: 'How is frontend architecture different from data model or interface design?',
                        answer: 'Architecture chooses system boundaries, rendering modes, data flow, cache layers, and resilience paths. Data model details entities and ownership, while interface design details components, interactions, accessibility, and UI states.',
                    },
                ],
            },
            readerPromise: 'Use this architecture guide to choose client-side boundaries, rendering strategy, BFF trade-offs, cache layers, and an interview-ready frontend architecture diagram.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-architecture')
                .then(m => m.SystemDesignArchitectureArticle)
    },
    {
        slug: 'state-data',
        title: 'D - Data Model Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master data modeling in a frontend system design interview with entity contracts, UI-state matrix, cache invalidation rules, and mutation rollback patterns.',
        seo: {
            title: 'Frontend State and Data Model System Design Guide',
            description: 'Design frontend state and data models for interviews with server/client state, API contracts, cache keys, invalidation, optimistic updates, and UI states.',
            primaryKeyword: 'frontend state and data model system design',
            keywords: [
                'frontend system design state management',
                'frontend data model interview',
                'frontend API contracts interview',
                'frontend cache invalidation interview',
                'server state vs client state frontend',
                'frontend optimistic updates interview',
                'frontend URL state query params',
                'frontend normalized cache interview',
                'frontend system design data flow',
                'frontend system design cache keys',
                'what is a frontend state and data model in system design',
                'how to separate server state client state and URL state',
                'what should frontend API contracts include',
                'how to explain cache invalidation in frontend interview',
                'when should I use optimistic updates',
                'frontend UI states idle loading error stale partial',
                'frontend query keys TTL invalidation interview',
                'real time search frontend data model',
                'news feed normalized cache frontend system design',
                'dashboard widgets state ownership frontend',
                'AI chat streaming state frontend system design',
            ],
            faqPage: {
                name: 'Frontend state and data model system design FAQ',
                items: [
                    {
                        question: 'What is a frontend state and data model in system design?',
                        answer: 'It is the part of a frontend system design answer where you define entities, API contracts, server state, client state, URL state, cache keys, invalidation, UI states, and mutation behavior.',
                    },
                    {
                        question: 'How do I separate server state, client state, and URL state?',
                        answer: 'Keep server state in API-backed cache, transient interaction state in components or UI stores, and shareable navigation state such as search, filters, sort, and cursor in the URL.',
                    },
                    {
                        question: 'What should frontend API contracts include?',
                        answer: 'Frontend API contracts should include stable IDs, timestamps or versions, pagination shape, error shape, stale or partial metadata, permission-sensitive fields, and the UI state each response can produce.',
                    },
                    {
                        question: 'How should I explain cache invalidation in a frontend interview?',
                        answer: 'Define query keys first, then name TTLs, mutation-triggered invalidation, permission-change invalidation, background refresh behavior, and what the user sees when data is stale.',
                    },
                    {
                        question: 'When should I use optimistic updates?',
                        answer: 'Use optimistic updates when the action is low risk, the rollback path is explicit, conflicts are modeled, and the UI can reconcile the server response without hiding divergence.',
                    },
                ],
            },
            readerPromise: 'Use this data guide to separate server state, client state, URL state, API contracts, cache keys, invalidation, optimistic updates, and interview-ready UI states.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-state')
                .then(m => m.SystemDesignStateArticle)
    },
    {
        slug: 'ux',
        title: 'I - Interface Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master interface design in a frontend system design interview with component boundaries, UI-state mapping, accessibility contracts, and interaction scripts.',
        seo: {
            title: 'Frontend Interface Design System Design Guide',
            description: 'Design frontend interface contracts for interviews with component boundaries, component APIs, UI states, keyboard focus, accessibility, and degraded UX.',
            primaryKeyword: 'frontend interface design system design',
            keywords: [
                'frontend system design interface guide',
                'frontend component API design interview',
                'frontend accessibility system design',
                'frontend UI states interview',
                'frontend interaction flow interview',
                'keyboard navigation frontend interview',
                'ARIA live regions frontend interview',
                'frontend state to UI mapping',
                'frontend degraded UX interview',
                'frontend responsive interface design',
                'what is frontend interface design in system design interviews',
                'what should a frontend component API include',
                'how to explain keyboard and focus behavior in frontend interview',
                'how to map UI states in frontend system design',
                'frontend component props events callbacks interview',
                'frontend accessibility contract system design',
                'combobox keyboard navigation frontend interview',
                'frontend interface design autocomplete system design',
                'notification toast ARIA live region system design',
                'dashboard widgets keyboard drag resize frontend system design',
            ],
            faqPage: {
                name: 'Frontend interface design system design FAQ',
                items: [
                    {
                        question: 'What is frontend interface design in system design interviews?',
                        answer: 'Frontend interface design is the RADIO step where you turn architecture and data choices into component boundaries, component APIs, user interaction flows, UI states, accessibility behavior, and degraded UX.',
                    },
                    {
                        question: 'What should a frontend component API include?',
                        answer: 'A frontend component API should include props, callbacks or events, controlled and uncontrolled state boundaries, error and loading states, accessibility semantics, and extension points that do not leak implementation details.',
                    },
                    {
                        question: 'How do I explain keyboard and focus behavior?',
                        answer: 'Describe the keyboard map, tab order, arrow-key behavior where relevant, focus transitions after async updates or dialogs, and ARIA/live-region announcements for loading, error, and success states.',
                    },
                    {
                        question: 'How should I map UI states in a frontend system design interview?',
                        answer: 'Map each state to what the user sees, which actions remain available, how focus behaves, and what telemetry proves the state is working: idle, loading, success, empty, error, stale, and partial.',
                    },
                    {
                        question: 'How is Interface different from Data or Optimizations?',
                        answer: 'Data defines entities, ownership, cache keys, and API contracts. Interface defines component responsibility, component APIs, interactions, accessibility, responsive behavior, and user-visible failure states. Optimizations tune performance and rollout risk.',
                    },
                ],
            },
            readerPromise: 'Use this interface guide to define component boundaries, component APIs, UI states, keyboard/focus behavior, accessibility, degraded UX, and interview-ready prompt decisions.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-ux')
                .then(m => m.SystemDesignCrossCuttingArticle)
    },
    {
        slug: 'performance',
        title: 'Frontend System Design Performance Optimization Guide',
        minutes: 18,
        summary: 'Learn frontend system design performance optimization for interviews with Core Web Vitals, budgets, bottleneck diagnosis, trade-offs, rollout, and validation.',
        seo: {
            title: 'Frontend System Design Performance Optimization Guide',
            description: 'Discuss frontend system design performance in interviews with Core Web Vitals, budgets, bottleneck diagnosis, trade-offs, rollout, and validation.',
            primaryKeyword: 'frontend system design performance optimization',
            keywords: [
                'frontend system design performance',
                'frontend system design interview optimization',
                'frontend performance budget interview',
                'Core Web Vitals interview',
                'INP frontend interview',
                'LCP frontend interview',
                'frontend performance metrics interview',
                'performance budget frontend system design',
                'frontend bottleneck diagnosis interview',
                'frontend rendering performance interview',
                'frontend caching tradeoffs interview',
                'frontend system design observability',
                'frontend performance SLO interview',
                'typeahead performance system design',
                'infinite scroll virtualization system design',
                'dashboard performance system design',
                'live chart performance system design',
                'form interaction latency frontend interview',
            ],
            faqPage: {
                name: 'Frontend system design performance optimization FAQ',
                items: [
                    {
                        question: 'How should I discuss performance in a frontend system design interview?',
                        answer: 'Start with the primary user journey, set measurable budgets, diagnose the dominant bottleneck, prioritize the top two fixes, and close with trade-offs, monitoring, rollout, and rollback criteria.',
                    },
                    {
                        question: 'What is a frontend performance budget in a system design interview?',
                        answer: 'A frontend performance budget is a small set of measurable limits for the critical journey, such as LCP, INP, CLS, route p95 latency, JavaScript cost, error rate, and task completion. It turns optimization from preference into an explicit interview constraint.',
                    },
                    {
                        question: 'Which Core Web Vitals should I mention in a frontend interview?',
                        answer: 'Mention LCP for perceived load speed, INP for responsiveness, and CLS for visual stability. Then connect those Core Web Vitals to route p95 latency, JavaScript execution cost, error budget, and the business task in the prompt.',
                    },
                    {
                        question: 'How do I diagnose frontend performance bottlenecks in a system design interview?',
                        answer: 'Trace the primary user path across network, server response, payload size, JavaScript parse and execution, rendering, data joins, and interaction work. Use p75 Core Web Vitals and p95 route or interaction latency so the slow tail is visible.',
                    },
                    {
                        question: 'Is INP better than FID for frontend interview answers?',
                        answer: 'Yes. INP is the current Core Web Vitals responsiveness metric, so interview answers should prefer INP while mentioning FID only as an older metric if the prompt uses it.',
                    },
                    {
                        question: 'What trade-offs should I call out for frontend performance optimization?',
                        answer: 'Common trade-offs include faster first paint versus server cost, aggressive caching versus stale data, code splitting versus waterfalls, virtualization versus accessibility, and optimistic UI versus rollback complexity.',
                    },
                ],
            },
            searchIntent: 'Find an interview-focused frontend system design performance optimization guide that explains budgets, Core Web Vitals, bottleneck diagnosis, scenario trade-offs, rollout, and validation.',
            readerPromise: 'Use this performance optimization guide to explain Core Web Vitals, bottleneck diagnosis, top-two prioritization, trade-offs, observability, rollout, and interview-ready scripts.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-01',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-performance')
                .then(m => m.SystemDesignPerformanceArticle)
    },
    {
        slug: 'evaluation',
        title: 'Frontend System Design Interview Rubric and Scorecard',
        minutes: 12,
        summary: 'Use a frontend system design interview rubric to score requirements, architecture, state, interfaces, performance, trade-offs, and communication.',
        seo: {
            title: 'Frontend System Design Interview Rubric and Scorecard',
            description: 'Use a frontend system design interview rubric to score requirements, architecture, state, interfaces, performance, trade-offs, and communication.',
            primaryKeyword: 'frontend system design interview rubric',
            keywords: [
                'frontend system design interview scorecard',
                'frontend system design evaluation criteria',
                'what interviewers look for frontend system design',
                'frontend system design interview signals',
                'senior frontend system design interview rubric',
                'frontend architecture interview rubric',
                'frontend system design strong hire signals',
                'system design interview scorecard frontend',
                'frontend system design self review',
                'frontend system design mock interview rubric',
                'frontend system design weak signals',
                'frontend system design communication signals',
                'frontend system design tradeoff evaluation',
                'frontend state management interview rubric',
                'frontend API contract interview rubric',
                'frontend performance accessibility interview rubric',
                'autocomplete frontend system design rubric',
                'infinite scroll system design evaluation',
                'dashboard frontend system design scorecard',
                'design system architecture interview rubric',
            ],
            faqPage: {
                name: 'Frontend system design interview rubric FAQ',
                items: [
                    {
                        question: 'How are frontend system design interviews scored?',
                        answer: 'Interviewers score how clearly you scope requirements, choose frontend architecture, model state and data, define interfaces, handle performance and accessibility, and communicate trade-offs under time pressure.',
                    },
                    {
                        question: 'What is a strong hire signal in frontend system design?',
                        answer: 'A strong hire signal is a decision that connects product constraints to browser behavior, names alternatives, explains trade-offs, and includes validation or rollback criteria.',
                    },
                    {
                        question: 'How do I use a frontend system design scorecard after a mock interview?',
                        answer: 'Score each rubric axis from 1 to 5, write the weakest missing evidence, pick one practice prompt that targets that gap, and repeat the answer with a clearer artifact or script cue.',
                    },
                    {
                        question: 'What do senior frontend system design answers include?',
                        answer: 'Senior answers show ownership of scope, rendering strategy, state boundaries, API contracts, accessibility, performance budgets, failure modes, observability, and realistic rollout trade-offs.',
                    },
                    {
                        question: 'What are red flags in frontend system design interviews?',
                        answer: 'Common red flags include jumping to diagrams before scope, giving backend-only answers, skipping constraints, ignoring accessibility or performance, listing tools without trade-offs, and rambling without checkpoints.',
                    },
                ],
            },
            searchIntent: 'Find a frontend system design interview rubric that explains what interviewers score, what weak and strong signals look like, and how to self-review a mock answer.',
            readerPromise: 'Use this scorecard to grade frontend system design answers across requirements, architecture, state, interfaces, performance, accessibility, trade-offs, and communication.',
            uniqueAngle: 'RADIO-mapped rubric with weak, solid, and strong-hire signals plus a self-review loop tied to FrontendAtlas practice prompts.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-01',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-evaluation')
                .then(m => m.SystemDesignSignalsArticle)
    },
    {
        slug: 'pitfalls',
        title: 'Frontend System Design Interview Pitfalls and Red Flags',
        minutes: 11,
        summary: 'Avoid frontend system design mistakes with red flags, repair scripts, RADIO mapping, and scenario-specific fixes.',
        seo: {
            title: 'Frontend System Design Interview Pitfalls and Red Flags',
            description: 'Avoid frontend system design interview pitfalls with red flags, repair scripts, and fixes for architecture, state, APIs, performance, and accessibility.',
            primaryKeyword: 'frontend system design interview pitfalls',
            keywords: [
                'frontend system design mistakes',
                'frontend system design red flags',
                'frontend system design anti patterns',
                'frontend system design interview mistakes',
                'frontend system design common mistakes',
                'system design mistakes to avoid frontend',
                'frontend architecture interview mistakes',
                'frontend performance interview mistakes',
                'frontend accessibility system design mistakes',
                'frontend state management interview mistakes',
                'frontend API contract interview mistakes',
                'frontend system design interviewer hints',
                'frontend system design loading error empty states',
                'frontend system design over engineering',
                'frontend system design tradeoff mistakes',
            ],
            faqPage: {
                name: 'Frontend system design interview pitfalls FAQ',
                items: [
                    {
                        question: 'What are the biggest frontend system design interview pitfalls?',
                        answer: 'The biggest pitfalls are skipping requirements, giving backend-only answers, listing buzzwords, ignoring state ownership, hand-waving API and component contracts, missing accessibility or performance, and rambling without checkpoints.',
                    },
                    {
                        question: 'How do I recover if my frontend system design answer gets messy?',
                        answer: 'Pause, restate the primary user flow, name the constraint you are optimizing for, choose the next artifact, and ask the interviewer whether to go deeper on architecture, data, interface, or performance.',
                    },
                    {
                        question: 'Why are backend-only answers a red flag in frontend system design?',
                        answer: 'Frontend rounds score browser rendering, client state, component contracts, user-visible failure states, accessibility, and performance. Backend awareness helps, but it should support the UI design instead of replacing it.',
                    },
                    {
                        question: 'What frontend performance mistakes should I avoid in system design interviews?',
                        answer: 'Avoid random optimization lists. Tie performance work to a bottleneck, metric, budget, trade-off, rollout plan, and validation method for the user-critical path.',
                    },
                    {
                        question: 'How do pitfalls differ from a frontend system design checklist?',
                        answer: 'A checklist confirms coverage before you finish. Pitfalls identify weak signals as they happen and give repair scripts for recovering during the interview.',
                    },
                ],
            },
            searchIntent: 'Find frontend system design interview mistakes, red flags, and repair scripts that explain what to avoid and what to say instead during real rounds.',
            readerPromise: 'Use this pitfalls guide to catch weak signals, recover messy answers, and connect fixes to RADIO, rubric scoring, checklist review, and practice prompts.',
            uniqueAngle: 'Frontend-specific red flags with repair scripts, RADIO mapping, and scenario prompts instead of a generic system design mistake list.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-pitfalls')
                .then(m => m.SystemDesignTrapsArticle)
    },
    {
        slug: 'checklist',
        title: 'One-Page Checklist for Interviews',
        minutes: 6,
        summary: 'A quick mental map to keep in mind for any system design question.',
        seo: {
            title: 'Frontend System Design Interview Checklist: One-Page Final Review',
            description: 'Use this one-page interview checklist before system design rounds to verify requirements, architecture, trade-offs, risks, and communication flow.',
            primaryKeyword: 'frontend system design interview checklist',
            keywords: ['frontend system design interview checklist', 'system design final review checklist', 'system design prep checklist'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-checklist')
                .then(m => m.SystemDesignChecklistArticle)
    },
];

export const SYSTEM_GROUPS = [
    { title: 'Introduction', items: [{ slug: 'intro' }] },
    { title: 'Core concepts', items: [{ slug: 'foundations' }, { slug: 'framework' }] },
    { title: 'RADIO guide', items: [{ slug: 'radio-framework' }, { slug: 'radio-requirements' }, { slug: 'architecture' }, { slug: 'state-data' }, { slug: 'ux' }, { slug: 'performance' }] },
    { title: 'Interview focus', items: [{ slug: 'evaluation' }, { slug: 'pitfalls' }, { slug: 'checklist' }] },
];

/* ---------------------------------- BEHAVIORAL ---------------------------------- */

export const BEHAVIORAL: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Behavioral Interviews: What Great Answers Look Like',
        minutes: 12,
        summary: 'A behavioral interview rubric for scoring signals, judgment, and high-signal stories that hiring teams remember.',
        seo: {
            title: 'Behavioral Interview Guide: Scoring Signals and High-Signal Answers',
            description: 'A behavioral interview rubric for scoring signals, judgment, and high-signal stories that hiring teams remember.',
            primaryKeyword: 'behavioral interviews',
            keywords: ['behavioral interviews', 'behavioral interview overview', 'what great behavioral answers look like'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-intro')
                .then(m => m.BehavioralIntroArticle),
    },
    {
        slug: 'big-picture',
        title: 'Behavioral Interview Big Picture: How It Impacts Screening and Onsite',
        minutes: 8,
        summary: 'Understand where behavioral rounds affect screening and onsite decisions, and how to frame answers around the exact signals hiring teams score.',
        seo: {
            title: 'Behavioral Interview Big Picture: How It Impacts Screening and Onsite',
            description: 'Understand where behavioral rounds affect screening and onsite decisions, and how to frame answers around the exact signals hiring teams score.',
            primaryKeyword: 'behavioral interview big picture',
            keywords: ['behavioral interview big picture', 'behavioral screening and onsite', 'behavioral interview process'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-big-picture')
                .then(m => m.BehavioralBigPictureArticle),
    },
    {
        slug: 'evaluation-areas',
        title: 'Behavioral Interview Evaluation Areas',
        minutes: 10,
        summary: 'Use this behavioral interview scorecard for communication, collaboration, ownership, growth, and leadership so each story maps to clear hiring signals.',
        seo: {
            title: 'Behavioral Interview Scorecard: The Areas Hiring Teams Evaluate',
            description: 'Use this interview scorecard to map stories to communication, collaboration, ownership, leadership, and growth signals that drive hiring decisions.',
            primaryKeyword: 'behavioral interview scorecard',
            keywords: ['behavioral interview scorecard', 'behavioral evaluation areas', 'behavioral interview competencies'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-evaluation-areas')
                .then(m => m.BehavioralEvaluationAreasArticle),
    },
    {
        slug: 'prep',
        title: 'How to Prepare (Fast and Effectively)',
        minutes: 9,
        summary: 'Build a story bank, map stories to competencies, and practice without sounding scripted.',
        seo: {
            title: 'Behavioral Interview Prep Plan: Fast, Structured, and Effective',
            description: 'Build an interview prep routine with a reusable story bank, competency mapping, and practice loops so answers stay concise and high-signal.',
            primaryKeyword: 'behavioral interview prep plan',
            keywords: ['behavioral interview prep plan', 'behavioral interview preparation', 'behavioral story bank'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-prep')
                .then(m => m.BehavioralPrepArticle),
    },
    {
        slug: 'stories',
        title: 'Crafting STAR Stories',
        minutes: 14,
        summary: 'A practical recipe to structure concise, memorable examples.',
        seo: {
            title: 'STAR Stories for Behavioral Interviews: A Practical Answer Framework',
            description: 'Learn a practical interview framework to craft STAR stories that are concise, credible, and memorable across common behavioral prompts.',
            primaryKeyword: 'star stories for behavioral interviews',
            keywords: ['star stories for behavioral interviews', 'behavioral story framework', 'how to craft star stories'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-stories')
                .then(m => m.BehavioralStoriesArticle),
    },
    {
        slug: 'common-questions',
        title: 'Behavioral Interview Questions: How to Answer Common Prompts',
        minutes: 18,
        summary: 'Use clear frameworks and sample answer structures for top behavioral interview questions like conflict, failure, leadership, and “tell me about yourself.”',
        seo: {
            title: 'Behavioral Interview Questions: How to Answer Common Prompts',
            description: 'Use clear frameworks and sample answer structures for top behavioral interview questions like conflict, failure, leadership, and “tell me about yourself.”',
            primaryKeyword: 'behavioral interview questions',
            keywords: ['behavioral interview questions', 'common behavioral prompts', 'behavioral interview answers'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-common-questions')
                .then(m => m.BehavioralQuestionsArticle),
    },
    {
        slug: 'fe-advanced',
        title: 'Frontend Behavioral Interview Scenarios: How to Answer Technical Prompts',
        minutes: 13,
        summary: 'Answer frontend-specific behavioral prompts on trade-offs, accessibility, performance, and cross-team collaboration with structured, interview-ready examples.',
        seo: {
            title: 'Frontend Behavioral Interview Scenarios: How to Answer Technical Prompts',
            description: 'Answer frontend-specific behavioral prompts on trade-offs, accessibility, performance, and cross-team collaboration with structured, interview-ready examples.',
            primaryKeyword: 'frontend behavioral interview scenarios',
            keywords: ['frontend behavioral interview scenarios', 'technical behavioral interview examples', 'frontend collaboration tradeoffs stories'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-fe-advanced')
                .then(m => m.BehavioralFeAdvancedArticle),
    },
    {
        slug: 'practical-tips',
        title: 'Behavioral Interview Tips: Common Mistakes and Better Answers',
        minutes: 8,
        summary: 'Fix the delivery mistakes that weaken behavioral interviews: rambling, vague answers, weak impact, and poor remote interview habits.',
        seo: {
            title: 'Behavioral Interview Tips: Common Mistakes and Better Answers',
            description: 'Fix the delivery mistakes that weaken behavioral interviews: rambling, vague answers, weak impact, and poor remote interview habits.',
            primaryKeyword: 'behavioral interview tips',
            keywords: ['behavioral interview tips', 'behavioral interview mistakes', 'better behavioral answers'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-practical-tips')
                .then(m => m.BehavioralTipsArticle),
    },
    {
        slug: 'checklist',
        title: 'Behavioral Interview Checklist: Last-Minute Prep Before the Call',
        minutes: 5,
        summary: 'A fast pre-interview checklist for behavioral rounds: story bank, company research, questions to ask, and final delivery checks.',
        seo: {
            title: 'Behavioral Interview Checklist: Last-Minute Prep Before the Call',
            description: 'A fast pre-interview checklist for behavioral rounds: story bank, company research, questions to ask, and final delivery checks.',
            primaryKeyword: 'behavioral interview checklist',
            keywords: ['behavioral interview checklist', 'last minute behavioral interview prep', 'behavioral interview review'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-checklist')
                .then(m => m.BehavioralChecklistArticle),
    },
];

export const BEHAVIORAL_GROUPS = [
    { title: 'Overview', items: [{ slug: 'intro' }, { slug: 'big-picture' }, { slug: 'evaluation-areas' }] },
    { title: 'Preparation', items: [{ slug: 'prep' }, { slug: 'stories' }] },
    { title: 'Solving Common Questions', items: [{ slug: 'common-questions' }] },
    { title: 'Front-End Specifics', items: [{ slug: 'fe-advanced' }] },
    { title: 'Practical', items: [{ slug: 'practical-tips' }, { slug: 'checklist' }] },
];
