// Keep this tiny and framework-agnostic so it can be shared by Header + Dashboard.

export type PrepareGroupKey =
    | 'foundations'
    | 'practice'
    | 'system'
    | 'companies'
    | 'courses'
    | 'resources';

export type TargetName = 'practice' | 'system' | 'companies' | 'courses' | 'guides' | 'tracks' | 'warmup' | 'tools';

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
                title: 'FrontendAtlas Interview Blueprint',
                subtitle: 'A starter guide to front end interviews',
                pi: 'pi pi-file',
                intent: 'route',
                target: { name: 'guides', params: { section: 'interview-blueprint' } }
            },
            {
                key: 'framework-prep',
                title: 'Framework Prep Guide',
                subtitle: 'JavaScript, React, Angular, Vue, HTML, CSS',
                pi: 'pi pi-compass',
                intent: 'route',
                target: { name: 'guides', params: { section: 'framework-prep' } }
            },
            // NEW
            {
                key: 'behavioral',
                title: 'Behavioral Prep',
                subtitle: 'STAR stories, signals, examples',
                pi: 'pi pi-comments',
                intent: 'route',
                target: { name: 'guides', params: { section: 'behavioral' } }
            },
            {
                key: 'cv-linter',
                title: 'CV Linter',
                subtitle: 'ATS-style resume scan with fix suggestions',
                pi: 'pi pi-check-circle',
                intent: 'route',
                target: { name: 'tools', params: { tool: 'cv' } }
            }
        ]
    },
    {
        key: 'practice',
        title: 'Practice',
        items: [
            {
                key: 'practice-coding',
                title: 'Question Library',
                subtitle: 'Solve individual coding and concept questions',
                pi: 'pi pi-bolt',
                intent: 'route',
                target: { name: 'practice' },
            },
            {
                key: 'practice-tracks',
                title: 'Study Plans',
                subtitle: 'Run a structured multi-day sequence',
                pi: 'pi pi-directions',
                intent: 'route',
                target: { name: 'tracks' },
            },
            {
                key: 'practice-warmup',
                title: 'Guided interview warm-up',
                subtitle: 'Warm-up index and discovery surface',
                pi: 'pi pi-list',
                intent: 'route',
                target: { name: 'warmup' },
            },
            {
                key: 'practice-js',
                title: 'JavaScript',
                subtitle: 'Targeted JavaScript coding and trivia',
                pi: 'pi-code',
                intent: 'route',
                target: { name: 'practice', params: { tech: 'javascript' } },
            },
            {
                key: 'practice-angular',
                title: 'Angular',
                subtitle: 'Targeted Angular coding and trivia',
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
                title: 'Frontend System Design Blueprint',
                subtitle: 'Concepts, patterns, interview tactics',
                pi: 'pi pi-sitemap',
                intent: 'route',
                target: { name: 'system', params: { section: 'guide' } } // maps to /guides/system-design-blueprint
            },
            {
                key: 'sd-practice',
                title: 'System Design',
                subtitle: 'Practice problems & walkthroughs',
                pi: 'pi pi-list',
                intent: 'route',
                target: { name: 'system', params: { section: 'practice' } } // maps to /system-design
            },
        ]
    },
    {
        key: 'companies',
        title: 'Company Prep',
        items: [
            {
                key: 'companies-home',
                title: 'Company Prep',
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
