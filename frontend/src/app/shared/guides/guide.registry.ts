import { Type } from '@angular/core';

export type GuideEntry = {
    slug: string;
    title: string;
    minutes?: number;
    summary?: string;
    load: () => Promise<Type<any>>;
};

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

export function navFor(list: GuideEntry[], slug: string) {
    const idx = list.findIndex(e => e.slug === slug);
    const current = idx >= 0 ? list[idx] : undefined;
    const prev = idx > 0 ? ['/', 'guides', 'playbook', list[idx - 1].slug] : null;
    const next = idx >= 0 && idx + 1 < list.length
        ? ['/', 'guides', 'playbook', list[idx + 1].slug]
        : null;
    return { current, prev, next };
}
