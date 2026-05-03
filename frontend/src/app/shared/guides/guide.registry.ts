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
            updatedAt: '2026-04-19',
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
        title: 'React Interview Prep Path: State, Effects, Performance',
        minutes: 9,
        summary: 'Use this React interview prep path to stabilize hooks, rerender reasoning, stale-state fixes, and performance trade-offs with a 7/14/30-day study plan for frontend engineers.',
        seo: {
            title: 'React Interview Prep Path: State, Effects, Performance',
            description: 'Use this React interview prep path to stabilize hooks, rerender reasoning, stale-state fixes, and performance trade-offs with a 7/14/30-day study plan for frontend engineers.',
            primaryKeyword: 'react prep path',
            keywords: ['react prep path', 'react interview prep path', 'react interview study plan', 'react state effects performance'],
            publishedAt: '2026-02-12',
            updatedAt: '2026-04-19',
            searchIntent: 'Find a React interview study plan that makes hooks, rerender logic, state design, and performance trade-offs easier to explain under pressure.',
            readerPromise: 'Use this to turn React hooks, rerender, and performance interviews into a 7/14/30-day prep plan with clear state-design and effect-debugging priorities.',
            uniqueAngle: 'React-specific render and state-design failure patterns tied directly to trivia and coding drills.',
            factCheckedAt: '2026-04-19',
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
            updatedAt: '2026-04-19',
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
            updatedAt: '2026-04-19',
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
            description: 'Learn what a front-end system design interview really scores, the senior trade-offs backend-heavy guides miss, and how to structure answers under pressure.',
            primaryKeyword: 'front-end system design',
            keywords: ['front-end system design', 'frontend system design overview', 'what frontend system design tests'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
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
            description: 'Clarify requirements fast, define constraints, and prioritize trade-offs before architecture so your frontend system design interview answers stay structured.',
            primaryKeyword: 'frontend system design interview foundations',
            keywords: ['frontend system design interview foundations', 'system design scope constraints tradeoffs', 'frontend requirements and tradeoffs'],
            publishedAt: '2025-08-31',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-foundations')
                .then(m => m.SystemDesignFoundationsArticle)
    },
    {
        slug: 'framework',
        title: 'A Reusable 5-Step Approach',
        minutes: 10,
        summary: 'A simple, repeatable structure for tackling any FE system design interview question.',
        seo: {
            title: 'Frontend System Design Interview Framework: A Reusable 5-Step Method',
            description: 'Use a repeatable 5-step interview framework to answer frontend system design prompts clearly, cover trade-offs, and avoid rambling under time pressure.',
            primaryKeyword: 'frontend system design interview framework',
            keywords: ['frontend system design interview framework', 'frontend system design 5 step method', 'system design answer framework'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-framework')
                .then(m => m.SystemDesignFrameworkArticle)
    },
    {
        slug: 'radio-framework',
        title: 'RADIO Framework for Frontend System Design Interviews',
        minutes: 20,
        summary: 'Use the RADIO framework to ace frontend system design interviews with reusable artifacts, timelines, and scripts for focused preparation.',
        seo: {
            title: 'RADIO Framework for Frontend System Design Interviews',
            description: 'Use the RADIO framework to ace frontend system design interviews with reusable artifacts, timelines, and scripts for focused preparation.',
            primaryKeyword: 'radio framework for frontend system design interviews',
            keywords: ['radio framework for frontend system design interviews', 'radio framework frontend', 'frontend system design radio method'],
            publishedAt: '2026-02-18',
            updatedAt: '2026-05-03',
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
            title: 'R - Requirements Deep Dive for Frontend System Design Interviews',
            description: 'Master requirements in frontend system design interviews with a repeatable script, scope box, metrics, and edge-case checklist before architecture.',
            primaryKeyword: 'requirements deep dive for frontend system design interviews',
            keywords: ['requirements deep dive for frontend system design interviews', 'frontend system design requirements', 'radio requirements frontend'],
            publishedAt: '2026-02-18',
            updatedAt: '2026-04-04',
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
            description: 'Use this interview guide to structure frontend system design architecture decisions, from rendering boundaries and caching to clear trade-off framing.',
            primaryKeyword: 'frontend system design architecture guide',
            keywords: ['frontend system design architecture guide', 'frontend architecture interview guide', 'rendering caching boundaries'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
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
            title: 'D - Data Model Deep Dive for Frontend System Design Interviews',
            description: 'Master data modeling in a frontend system design interview with entity contracts, UI-state matrix, cache invalidation rules, and mutation rollback patterns.',
            primaryKeyword: 'data model deep dive for frontend system design interviews',
            keywords: ['data model deep dive for frontend system design interviews', 'frontend state and data model', 'cache invalidation interview'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
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
            title: 'I - Interface Deep Dive for Frontend System Design Interviews',
            description: 'Master interface design in a frontend system design interview with component boundaries, UI-state mapping, accessibility contracts, and interaction scripts.',
            primaryKeyword: 'interface deep dive for frontend system design interviews',
            keywords: ['interface deep dive for frontend system design interviews', 'frontend system design interface guide', 'a11y interaction states'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-ux')
                .then(m => m.SystemDesignCrossCuttingArticle)
    },
    {
        slug: 'performance',
        title: 'O - Optimizations Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master optimization strategy in a frontend system design interview with performance budgets, bottleneck prioritization, trade-offs, and rollout validation.',
        seo: {
            title: 'O - Optimizations Deep Dive for Frontend System Design Interviews',
            description: 'Master optimization strategy in a frontend system design interview with performance budgets, bottleneck prioritization, trade-offs, and rollout validation.',
            primaryKeyword: 'optimizations deep dive for frontend system design interviews',
            keywords: ['optimizations deep dive for frontend system design interviews', 'frontend system design performance', 'performance budgets interview'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-performance')
                .then(m => m.SystemDesignPerformanceArticle)
    },
    {
        slug: 'evaluation',
        title: 'What Interviewers Really Look For',
        minutes: 9,
        summary: 'Signals that matter most: clarity, prioritization, and reasoning about trade-offs.',
        seo: {
            title: 'Frontend System Design Interview Signals: What Interviewers Actually Score',
            description: 'Learn the exact interview signals hiring teams evaluate: clarity, prioritization, trade-off reasoning, and communication quality in system design rounds.',
            primaryKeyword: 'frontend system design interview signals',
            keywords: ['frontend system design interview signals', 'what interviewers score in system design', 'system design evaluation criteria'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-evaluation')
                .then(m => m.SystemDesignSignalsArticle)
    },
    {
        slug: 'pitfalls',
        title: 'Traps and Anti-Patterns to Avoid',
        minutes: 8,
        summary: 'Common mistakes candidates fall into and how to avoid them under pressure.',
        seo: {
            title: 'Frontend System Design Interview Pitfalls and How to Avoid Them',
            description: 'Avoid common interview mistakes like over-design, vague assumptions, and missing trade-offs, with practical fixes you can apply during real rounds.',
            primaryKeyword: 'frontend system design interview pitfalls',
            keywords: ['frontend system design interview pitfalls', 'system design anti patterns', 'system design mistakes to avoid'],
            publishedAt: '2025-09-28',
            updatedAt: '2026-04-04',
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
