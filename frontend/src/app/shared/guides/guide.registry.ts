// shared/guides/guide.registry.ts
import { Type } from '@angular/core';

/** A single article entry */
export type GuideEntry = {
    slug: string;
    title: string;
    load: () => Promise<Type<any>>;
    minutes?: number;
    summary?: string;
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
        load: () =>
            import('../../features/guides/playbook/fe-intro-article.component')
                .then(m => m.FeIntroArticle),
    },
    {
        slug: 'coding-interviews',
        title: 'Frontend Coding Interviews: Solve Prompts Under Pressure',
        minutes: 12,
        summary: 'A practical framework to turn ambiguous prompts into working solutions fast, avoid common coding-round mistakes, and communicate clearly under time limits.',
        load: () =>
            import('../../features/guides/playbook/fe-coding-article.component')
                .then(m => m.FeCodingArticle),
    },
    {
        slug: 'javascript-interviews',
        title: 'JavaScript Interview Patterns and Answers',
        minutes: 15,
        summary: 'Practice high-frequency JavaScript interview problems, apply fast solution patterns, and explain trade-offs clearly with examples that mirror real rounds.',
        load: () =>
            import('../../features/guides/playbook/js-problems-article.component')
                .then(m => m.JsProblemsArticle),
    },
    {
        slug: 'dsa-for-fe',
        title: 'DSA for Frontend Interviews: Just Enough to Pass Coding Rounds',
        minutes: 18,
        summary: 'Learn the exact arrays/maps/queues patterns frontend interviews test and what problems you should solve confidently after this guide.',
        load: () =>
            import('../../features/guides/playbook/fe-dsa-article.component')
                .then(m => m.FeDsaArticle),
    },
    {
        slug: 'ui-interviews',
        title: 'Frontend UI Interviews: Build Accessible Components Under Time',
        minutes: 20,
        summary: 'Learn exactly what to build first, how to add accessibility and polish, and how to finish UI interview prompts with a complete, explainable result.',
        load: () =>
            import('../../features/guides/playbook/fe-ui-in-60.component')
                .then(m => m.FeUiIn60Article),
    },
    {
        slug: 'api-design',
        title: 'Component API Design for Frontend Interviews: Props, Events, Trade-offs',
        minutes: 14,
        summary: 'Interview-focused patterns for designing reusable components with clear APIs, accessibility, and scalable composition decisions.',
        load: () =>
            import('../../features/guides/playbook/component-api-design-article.component')
                .then(m => m.ComponentApiDesignArticle),
    },
    {
        slug: 'javascript-prep-path',
        title: 'JavaScript Prep Path: Async, Closures, State',
        minutes: 9,
        summary: 'Follow a JavaScript prep path covering async flow, closures, stale state, race conditions, and cleanup drills so your interview answers stay reliable.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'react-prep-path',
        title: 'React Prep Path: State, Effects, Performance',
        minutes: 9,
        summary: 'Use this React prep path to practice hooks, rerender reasoning, stale-state fixes, and performance trade-offs through targeted coding and trivia drills.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'angular-prep-path',
        title: 'Angular Prep Path: RxJS, Architecture, Tests',
        minutes: 9,
        summary: 'Practice Angular interview decisions on RxJS flows, change detection, DI boundaries, and testing strategy with a step-by-step prep sequence.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'vue-prep-path',
        title: 'Vue Prep Path: Reactivity, Rendering, State',
        minutes: 9,
        summary: 'Build Vue interview confidence with a focused path on reactivity traps, nextTick timing, component communication, and practical coding/trivia drills.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'system-design',
        title: 'Frontend System Design Interviews: A Fast Answer Framework',
        minutes: 8,
        summary: 'Use a step-by-step framework to answer frontend system design questions, cover trade-offs clearly, and avoid common interview anti-patterns.',
        load: () =>
            import('../../features/guides/playbook/fe-system-design-fast-framework-article.component')
                .then(m => m.FeSystemDesignFastFrameworkArticle),
    },
    {
        slug: 'quiz',
        title: 'Frontend Interview Fundamentals Quiz: Browser, CSS, JavaScript, HTTP',
        minutes: 10,
        summary: 'Use this quick fundamentals check to find weak spots before interviews and practice concise, high-signal answers hiring teams expect.',
        load: () =>
            import('../../features/guides/playbook/fundamentals-check-article.component')
                .then(m => m.FundamentalsCheckArticle),
    },
    {
        slug: 'resume',
        title: 'Frontend Resume for Interviews: What Gets Calls and What Gets Rejected',
        minutes: 12,
        summary: 'A practical frontend resume blueprint with impact-focused bullets, section-by-section rules, and common mistakes to remove before applying.',
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
    { key: 'quiz', title: 'Quiz interviews', items: [{ slug: 'quiz' }] },
    { key: 'resume', title: 'Resume preparation', items: [{ slug: 'resume' }] },
];

/* ---------------------------------- SYSTEM DESIGN ---------------------------------- */

export const SYSTEM: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Front-End System Design: What It Really Tests',
        minutes: 8,
        summary: 'How FE system design differs from backend, what interviewers evaluate, and how to approach these rounds.',
        load: () =>
            import('../../features/guides/system-design/system-design-intro.component')
                .then(m => m.SystemDesignIntroArticle)
    },
    {
        slug: 'foundations',
        title: 'Scope, Constraints, and Trade-offs',
        minutes: 12,
        summary: 'Clarifying requirements, identifying constraints, and making principled trade-offs before you draw boxes.',
        load: () =>
            import('../../features/guides/system-design/system-design-foundations')
                .then(m => m.SystemDesignFoundationsArticle)
    },
    {
        slug: 'framework',
        title: 'A Reusable 5-Step Approach',
        minutes: 10,
        summary: 'A simple, repeatable structure for tackling any FE system design interview question.',
        load: () =>
            import('../../features/guides/system-design/system-design-framework')
                .then(m => m.SystemDesignFrameworkArticle)
    },
    {
        slug: 'radio-framework',
        title: 'RADIO Framework for Frontend System Design Interviews',
        minutes: 20,
        summary: 'Use the RADIO framework to ace frontend system design interviews with reusable artifacts, timelines, and scripts for focused preparation.',
        load: () =>
            import('../../features/guides/system-design/system-design-radio-framework')
                .then(m => m.SystemDesignRadioFrameworkArticle)
    },
    {
        slug: 'radio-requirements',
        title: 'R - Requirements Deep Dive for Frontend System Design Interviews',
        minutes: 16,
        summary: 'Master requirements in frontend system design interviews with a repeatable script, scope box, metrics, and edge-case checklist before architecture.',
        load: () =>
            import('../../features/guides/system-design/system-design-radio-requirements')
                .then(m => m.SystemDesignRadioRequirementsArticle)
    },
    {
        slug: 'architecture',
        title: 'Frontend System Design Architecture Guide',
        minutes: 18,
        summary: 'Use this interview guide to structure frontend system design architecture decisions, from rendering boundaries and caching to clear trade-off framing.',
        load: () =>
            import('../../features/guides/system-design/system-design-architecture')
                .then(m => m.SystemDesignArchitectureArticle)
    },
    {
        slug: 'state-data',
        title: 'D - Data Model Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master data modeling in a frontend system design interview with entity contracts, UI-state matrix, cache invalidation rules, and mutation rollback patterns.',
        load: () =>
            import('../../features/guides/system-design/system-design-state')
                .then(m => m.SystemDesignStateArticle)
    },
    {
        slug: 'ux',
        title: 'I - Interface Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master interface design in a frontend system design interview with component boundaries, UI-state mapping, accessibility contracts, and interaction scripts.',
        load: () =>
            import('../../features/guides/system-design/system-design-ux')
                .then(m => m.SystemDesignCrossCuttingArticle)
    },
    {
        slug: 'performance',
        title: 'O - Optimizations Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master optimization strategy in a frontend system design interview with performance budgets, bottleneck prioritization, trade-offs, and rollout validation.',
        load: () =>
            import('../../features/guides/system-design/system-design-performance')
                .then(m => m.SystemDesignPerformanceArticle)
    },
    {
        slug: 'evaluation',
        title: 'What Interviewers Really Look For',
        minutes: 9,
        summary: 'Signals that matter most: clarity, prioritization, and reasoning about trade-offs.',
        load: () =>
            import('../../features/guides/system-design/system-design-evaluation')
                .then(m => m.SystemDesignSignalsArticle)
    },
    {
        slug: 'pitfalls',
        title: 'Traps and Anti-Patterns to Avoid',
        minutes: 8,
        summary: 'Common mistakes candidates fall into and how to avoid them under pressure.',
        load: () =>
            import('../../features/guides/system-design/system-design-pitfalls')
                .then(m => m.SystemDesignTrapsArticle)
    },
    {
        slug: 'checklist',
        title: 'One-Page Checklist for Interviews',
        minutes: 6,
        summary: 'A quick mental map to keep in mind for any system design question.',
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
        summary: 'Signals interviewers care about and how to prepare high-signal stories.',
        load: () =>
            import('../../features/guides/behavioral/behavioral-intro')
                .then(m => m.BehavioralIntroArticle),
    },
    {
        slug: 'big-picture',
        title: 'Behavioral Interview Big Picture: How It Impacts Screening and Onsite',
        minutes: 8,
        summary: 'Understand where behavioral rounds affect screening and onsite decisions, and how to frame answers around the exact signals hiring teams score.',
        load: () =>
            import('../../features/guides/behavioral/behavioral-big-picture')
                .then(m => m.BehavioralBigPictureArticle),
    },
    {
        slug: 'evaluation-areas',
        title: 'Behavioral Interview Evaluation Areas',
        minutes: 10,
        summary: 'Use this behavioral interview scorecard for communication, collaboration, ownership, growth, and leadership so each story maps to clear hiring signals.',
        load: () =>
            import('../../features/guides/behavioral/behavioral-evaluation-areas')
                .then(m => m.BehavioralEvaluationAreasArticle),
    },
    {
        slug: 'prep',
        title: 'How to Prepare (Fast and Effectively)',
        minutes: 9,
        summary: 'Build a story bank, map stories to competencies, and practice without sounding scripted.',
        load: () =>
            import('../../features/guides/behavioral/behavioral-prep')
                .then(m => m.BehavioralPrepArticle),
    },
    {
        slug: 'stories',
        title: 'Crafting STAR Stories',
        minutes: 14,
        summary: 'A practical recipe to structure concise, memorable examples.',
        load: () =>
            import('../../features/guides/behavioral/behavioral-stories')
                .then(m => m.BehavioralStoriesArticle),
    },
    {
        slug: 'common-questions',
        title: 'Behavioral Interview Questions: How to Answer Common Prompts',
        minutes: 18,
        summary: 'Use clear frameworks and sample answer structures for top behavioral interview questions like conflict, failure, leadership, and “tell me about yourself.”',
        load: () =>
            import('../../features/guides/behavioral/behavioral-common-questions')
                .then(m => m.BehavioralQuestionsArticle),
    },
    {
        slug: 'fe-advanced',
        title: 'Frontend Behavioral Interview Scenarios: How to Answer Technical Prompts',
        minutes: 13,
        summary: 'Answer frontend-specific behavioral prompts on trade-offs, accessibility, performance, and cross-team collaboration with structured, interview-ready examples.',
        load: () =>
            import('../../features/guides/behavioral/behavioral-fe-advanced')
                .then(m => m.BehavioralFeAdvancedArticle),
    },
    {
        slug: 'practical-tips',
        title: 'Behavioral Interview Tips: Common Mistakes and Better Answers',
        minutes: 8,
        summary: 'Fix the delivery mistakes that weaken behavioral interviews: rambling, vague answers, weak impact, and poor remote interview habits.',
        load: () =>
            import('../../features/guides/behavioral/behavioral-practical-tips')
                .then(m => m.BehavioralTipsArticle),
    },
    {
        slug: 'checklist',
        title: 'Behavioral Interview Checklist: Last-Minute Prep Before the Call',
        minutes: 5,
        summary: 'A fast pre-interview checklist for behavioral rounds: story bank, company research, questions to ask, and final delivery checks.',
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
