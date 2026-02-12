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
        title: 'Frontend JavaScript Interviews: Problems, Patterns, and Answer Strategy',
        minutes: 15,
        summary: 'Learn the JavaScript problem types interviewers ask most, the patterns to apply fast, and how to explain decisions clearly under pressure.',
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
        title: 'JavaScript Interview Preparation Path: Async, Closures, and State Transitions',
        minutes: 9,
        summary: 'JavaScript interview prep path for async flow, event loop, closures, stale state, race conditions, cleanup, and state transitions with practical drills.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'react-prep-path',
        title: 'React Interview Preparation Path: Components, State, and Performance',
        minutes: 9,
        summary: 'A React interview prep path covering high-signal question types, what to practice first, and mistakes that reduce interview scores.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'angular-prep-path',
        title: 'Angular Interview Preparation Path: RxJS, Architecture, and Testing',
        minutes: 9,
        summary: 'A structured Angular interview roadmap with practical outcomes, common anti-patterns, and focused prep steps for frontend interviews.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'vue-prep-path',
        title: 'Vue Interview Preparation Path: Reactivity, Rendering, and Patterns',
        minutes: 9,
        summary: 'A Vue-focused interview preparation sequence with key outcomes, common mistakes, and targeted practice order.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'html-prep-path',
        title: 'HTML Interview Preparation Path: Semantics, Forms, and Accessibility',
        minutes: 8,
        summary: 'A focused HTML interview prep path for semantic structure, forms, and accessibility questions that appear in frontend screens.',
        load: () =>
            import('../../features/guides/playbook/framework-prep-path-article.component')
                .then(m => m.FrameworkPrepPathArticle),
    },
    {
        slug: 'css-prep-path',
        title: 'CSS Interview Preparation Path: Layout, Specificity, and Responsiveness',
        minutes: 8,
        summary: 'A CSS interview roadmap for layout systems, debugging style conflicts, and building production-quality UI under interview constraints.',
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
            { slug: 'html-prep-path' },
            { slug: 'css-prep-path' },
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
        slug: 'architecture',
        title: 'Rendering & App Architecture',
        minutes: 14,
        summary: 'CSR, SSR, islands, microfrontends—how to reason about architecture choices and trade-offs.',
        load: () =>
            import('../../features/guides/system-design/system-design-architecture')
                .then(m => m.SystemDesignArchitectureArticle)
    },
    {
        slug: 'state-data',
        title: 'State, Data Flow, and Caching',
        minutes: 15,
        summary: 'Patterns for managing state, syncing with backends, and improving performance with caching.',
        load: () =>
            import('../../features/guides/system-design/system-design-state')
                .then(m => m.SystemDesignStateArticle)
    },
    {
        slug: 'performance',
        title: 'Performance & Web Vitals at Scale',
        minutes: 12,
        summary: 'How to reason about load times, rendering speed, and runtime optimizations during interviews.',
        load: () =>
            import('../../features/guides/system-design/system-design-performance')
                .then(m => m.SystemDesignPerformanceArticle)
    },
    {
        slug: 'ux',
        title: 'Accessibility, i18n & Offline First',
        minutes: 10,
        summary: 'Covering cross-cutting concerns that separate good answers from great ones.',
        load: () =>
            import('../../features/guides/system-design/system-design-ux')
                .then(m => m.SystemDesignCrossCuttingArticle)
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
    { title: 'Core concepts', items: [{ slug: 'foundations' }, { slug: 'framework' }, { slug: 'architecture' }, { slug: 'state-data' }] },
    { title: 'Advanced topics', items: [{ slug: 'performance' }, { slug: 'ux' }] },
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
        title: 'Behavioral Interview Scoring Rubric: What Interviewers Evaluate',
        minutes: 10,
        summary: 'A clear rubric for communication, collaboration, ownership, growth, and leadership so you can map each story to what interviewers actually score.',
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
