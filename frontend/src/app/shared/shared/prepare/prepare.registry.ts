// Keep this tiny and framework-agnostic so it can be shared by Header + Dashboard.

export type PrepareGroupKey =
    | 'foundations'
    | 'practice'
    | 'system'
    | 'companies'
    | 'courses'
    | 'resources';

export type TargetName = 'practice' | 'system' | 'companies' | 'courses' | 'guides';

export interface PrepareTarget {
    name: TargetName;
    params?: Record<string, any>;
}

export interface PrepareItem {
    key: string;
    title: string;
    subtitle: string;
    pi: string;                // PrimeIcon class only (e.g., 'pi-book')
    intent: 'route' | 'placeholder' | 'external';
    target?: PrepareTarget;    // required when intent === 'route'
    badge?: string | null;
    disabled?: boolean;
}

export interface PrepareGroup {
    key: PrepareGroupKey;
    title: string;
    items: PrepareItem[];
}

export const PREPARE_GROUPS: PrepareGroup[] = [
    {
        key: 'foundations',
        title: 'Foundations',
        items: [
            {
                key: 'playbook',
                title: 'Front End Interview Playbook',
                subtitle: 'A starter guide to front end interviews',
                pi: 'pi-book',
                intent: 'placeholder',
                disabled: true,
                badge: 'Coming soon',
            },
            {
                key: 'gfe75',
                title: 'GFE 75',
                subtitle: 'The 75 most important front end questions',
                pi: 'pi-list',
                intent: 'placeholder',
                disabled: true,
                badge: 'Coming soon',
            },
            {
                key: 'guides',
                title: 'Guides',
                subtitle: 'Resume, portfolio, behavioral, SD primer',
                pi: 'pi-compass',
                intent: 'placeholder',
                disabled: true,
                badge: 'Soon',
            },
        ],
    },
    {
        key: 'practice',
        title: 'Practice',
        items: [
            {
                key: 'practice-js',
                title: 'JavaScript',
                subtitle: 'Coding, Trivia & Debug practice',
                pi: 'pi-code',
                intent: 'route',
                target: { name: 'practice', params: { tech: 'javascript' } },
            },
            {
                key: 'practice-angular',
                title: 'Angular',
                subtitle: 'Coding, Trivia & Debug practice',
                pi: 'pi-code',
                intent: 'route',
                target: { name: 'practice', params: { tech: 'angular' } },
            },
        ],
    },
    {
        key: 'system',
        title: 'System Design',
        items: [
            {
                key: 'system-design',
                title: 'Front End System Design Playbook',
                subtitle: 'Core techniques + deep dives',
                pi: 'pi-sitemap',
                intent: 'route',
                target: { name: 'system' },
            },
        ],
    },
    {
        key: 'companies',
        title: 'Companies',
        items: [
            {
                key: 'companies-home',
                title: 'Companies',
                subtitle: 'Practice by company: coding & trivia',
                pi: 'pi-briefcase',
                intent: 'route',
                target: { name: 'companies' },
            },
            // Popular quick links (feel free to add more later)
            {
                key: 'companies-google',
                title: 'Google',
                subtitle: 'JS & Angular questions',
                pi: 'pi-briefcase',
                intent: 'route',
                target: { name: 'companies', params: { company: 'google' } },
            },
            {
                key: 'companies-uber',
                title: 'Uber',
                subtitle: 'JS & Angular questions',
                pi: 'pi-briefcase',
                intent: 'route',
                target: { name: 'companies', params: { company: 'uber' } },
            },
        ],
    },
    {
        key: 'courses',
        title: 'Courses',
        items: [
            {
                key: 'courses-home',
                title: 'Courses',
                subtitle: 'Structured lessons with progress tracking',
                pi: 'pi-bookmark',
                intent: 'route',
                target: { name: 'courses' },
            },
            {
                key: 'continue-course',
                title: 'Continue learning',
                subtitle: 'Jump back into your last course',
                pi: 'pi-play-circle',
                intent: 'placeholder',
                disabled: true, // becomes dynamic later
            },
        ],
    },
    {
        key: 'resources',
        title: 'Resources',
        items: [
            {
                key: 'cheatsheets',
                title: 'Cheat sheets',
                subtitle: 'Quick reference for interviews',
                pi: 'pi-bolt',
                intent: 'placeholder',
                disabled: true,
                badge: 'Soon',
            },
        ],
    },
];