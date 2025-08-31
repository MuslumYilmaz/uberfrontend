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
                pi: 'pi pi-file',
                intent: 'route',
                target: { name: 'guides', params: { section: 'playbook' } }
            },
            {
                key: 'gfe75',
                title: 'GFE 75',
                subtitle: 'The 75 most important front end questions',
                pi: 'pi pi-list',
                badge: 'Coming soon',
                disabled: true,
                intent: 'placeholder'
            },
            // NEW
            {
                key: 'behavioral',
                title: 'Behavioral Interview Guide',
                subtitle: 'STAR stories, signals, examples',
                pi: 'pi pi-comments',
                intent: 'route',
                target: { name: 'guides', params: { section: 'behavioral' } }
            }
        ]
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
                key: 'sd-guide',
                title: 'System Design Playbook',
                subtitle: 'Concepts, patterns, interview tactics',
                pi: 'pi pi-sitemap',
                intent: 'route',
                target: { name: 'system', params: { section: 'guide' } } // maps to /guides/system-design
            },
            {
                key: 'sd-practice',
                title: 'System Design',
                subtitle: 'Practice problems & walkthroughs',
                pi: 'pi pi-list',
                intent: 'route',
                target: { name: 'system', params: { section: 'practice' } } // maps to /system-design
            },
            {
                key: 'sd-challenges',
                title: 'System Design Challenges',
                subtitle: 'Time-boxed interview-style prompts',
                pi: 'pi pi-bolt',
                intent: 'route',
                target: { name: 'system', params: { section: 'challenges' } } // /system-design for now
            },
        ]
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