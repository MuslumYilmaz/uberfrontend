// shared/guides/guide.registry.ts
import { Type } from '@angular/core';

/** A single article entry */
export type GuideEntry = {
    slug: string;
    title: string;
    /** lazy loader for the article component (it should render <uf-guide-shell> inside) */
    load: () => Promise<Type<any>>;
    /** Optional metadata some UIs may use (kept for back-compat with FE Playbook listings) */
    minutes?: number;
    summary?: string;
};

/** Section groups used to build the left navigator */
export type GuideGroup = {
    title: string;
    items: Array<{ slug: string }>;
};

/** Generic helper: find current/prev/next for a given registry.
 *  If `base` is omitted, we’ll try to infer it from the registry identity.
 */
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

/** Try to infer the route base segment from the registry reference. */
function inferBase(registry: GuideEntry[]): string | null {
    if (registry === PLAYBOOK) return 'playbook';
    if (registry === SYSTEM) return 'system-design';
    if (registry === BEHAVIORAL) return 'behavioral';
    return null;
}

/* ---------------------------------- PLAYBOOK (existing) ---------------------------------- */

export const PLAYBOOK: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Front End Interviews: An Introduction',
        minutes: 18,
        summary:
            'Everything you need to know — from types of questions to preparation tactics.',
        load: () =>
            import('../../features/guides/playbook/fe-intro-article.component')
                .then(m => m.FeIntroArticle),
    },
    {
        slug: 'coding-interviews',
        title: 'Front End Coding Interviews',
        minutes: 21,
        summary:
            'Question types to expect, handy coding tips and the best resources to use.',
        load: () =>
            import('../../features/guides/playbook/fe-coding-article.component')
                .then(m => m.FeCodingArticle),
    },
];

export const PLAYBOOK_GROUPS: Array<{
    key: string; title: string; items: Array<{ slug: string }>;
}> = [
        { key: 'intro', title: 'Introduction', items: [{ slug: 'intro' }] },
        { key: 'coding', title: 'Coding interviews', items: [{ slug: 'coding-interviews' }] },
    ];

/* ---------------------------------- SYSTEM DESIGN ---------------------------------- */

// shared/guides/guide.registry.ts
export const SYSTEM: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'System Design Interviews: An Introduction',
        load: () =>
            import('../../features/guides/system-design/intro.component')
                .then(m => m.SystemDesignIntroArticle)
    },
    {
        slug: 'foundations',
        title: 'Foundations & Constraints',
        load: () =>
            import('../../features/guides/system-design/system-design-foundations')
                .then(m => m.SystemDesignFoundationsArticle)
    },
    // add more only when they exist; or remove from SYSTEM_GROUPS until ready
];

export const SYSTEM_GROUPS = [
    { title: 'Introduction', items: [{ slug: 'intro' }] },
    { title: 'Core concepts', items: [{ slug: 'foundations' }] } // keep only implemented ones
];

/* ---------------------------------- BEHAVIORAL ---------------------------------- */

// shared/guides/guide.registry.ts

export const BEHAVIORAL: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Behavioral Interviews: An Introduction',
        minutes: 12,
        summary: 'What’s evaluated and how to prepare strong examples.',
        load: () =>
            import('../../features/guides/behavioral/intro')
                .then(m => m.BehavioralIntroArticle),
    },
    {
        slug: 'stories',
        title: 'Crafting STAR Stories',
        minutes: 14,
        summary: 'A practical recipe to structure concise, high-signal stories.',
        load: () =>
            import('../../features/guides/behavioral/stories')
                .then(m => m.BehavioralStoriesArticle),
    },
    // (optional) add 'signals' later
];

export const BEHAVIORAL_GROUPS = [
    { title: 'Overview', items: [{ slug: 'intro' }] },
    { title: 'Practice', items: [{ slug: 'stories' }] }, // add { slug: 'signals' } when implemented
];
