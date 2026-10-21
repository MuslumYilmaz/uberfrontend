import type { CompanyEditorialNotes } from './company-editorial-notes.model';

/**
 * Editorial notes for catalog-driven company previews, keyed by company slug.
 * A company without an entry renders the shared template copy unchanged. The SEO inventory
 * scopes this registry per company (COMPANY_SCOPED_REGISTRIES in scripts/seo-content-inventory.mjs),
 * so an entry re-dates only its own page; keep the keys mirrored in
 * frontend/scripts/authored-companies.mjs (EDITORIAL_NOTE_COMPANIES).
 * The preview component imports this object directly: an injection token or a service wrapper
 * would be projected into every company page by the inventory and re-date all of them at once.
 */
export const COMPANY_EDITORIAL_NOTES: Readonly<Record<string, CompanyEditorialNotes>> = {
  walmart: {
    slug: 'walmart',
    title: 'Walmart Frontend Interview Process and Practice Questions',
    h1: 'Walmart Frontend Interview Questions and Process',
    description:
      'How public reports describe Walmart frontend interviews: HackerRank and Karat screens, React fundamentals rounds, and practice items for each stage.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle:
        'Walmart Global Tech loops reported from India and the US, from the 2024 multiple-choice assessment to the 2026 HackerRank Frontend Engineering Assessment, with free and premium practice items for each round.',
    },
    intro: [
      'Walmart publishes no frontend interview guide, so this page rests on public interview reports from 2022 to 2026. Most of the detail comes from Walmart Global Tech India; US accounts mostly describe the shape of the loop rather than its questions.',
    ],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'Three loop shapes, by role and region',
      paragraphs: [
        'The loop depends on the role and the office. SDE 3 (UI) accounts from India describe three 60-minute rounds. SDE-2 and frontend engineer accounts from India open with an online assessment. Software Engineer III and senior accounts, mostly from the US, add a coding screen, design rounds and a hiring manager conversation.',
      ],
      bullets: [
        {
          text: 'SDE 3 (UI): a DSA round, a JavaScript, React and web fundamentals round, then a hiring manager round, each about 60 minutes. One account adds a 30-minute HR call about two weeks later.',
          link: { label: 'See the SDE 3 (UI) stages', fragment: 'walmart-interview-process-1' },
        },
        {
          text: 'SDE-2 and frontend engineer roles in India: a 2024 assessment with 20 multiple-choice questions on HTML, CSS and JavaScript, two easy coding questions in JavaScript and 10 multiple-choice questions on React or Angular, then a LeetCode-medium round, a React round and a final round.',
          link: { label: 'See the SDE-2 stages', fragment: 'walmart-interview-process-2' },
        },
        {
          text: 'Software Engineer III and senior: a Karat screen with about ten minutes of short answers before coding, or a HackerRank screen. The 2026 HackerRank Frontend Engineering Assessment pairs a coding problem with debugging a React or Angular app, with AI assistance allowed for UI navigation, syntax and clarification.',
          link: { label: 'See the senior stages', fragment: 'walmart-interview-process-3' },
        },
        {
          text: 'Senior onsites mix coding rounds, one or two design rounds and a behavioural or hiring manager round. A staff candidate for an advertising team was sent a backend-only guide, so the team sets the format.',
        },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the reported rounds in order',
      intro: 'Free items first, then the premium set. Each item is a practice version modelled on a reported round, not a leaked question.',
      steps: [
        {
          label: 'Valid Parentheses',
          path: '/javascript/coding/js-valid-parentheses',
          access: 'free',
          why: 'A warm-up in the shape of the DSA round that opens the SDE 3 (UI) loop.',
        },
        {
          label: 'How SSR and hydration work in React',
          path: '/react/trivia/react-ssr-hydration',
          access: 'free',
          why: 'The fundamentals round asks how React renders and how the web works.',
        },
        {
          label: 'When a React app needs Redux',
          path: '/react/trivia/react-state-management-redux',
          access: 'free',
          why: 'State management questions recur in the React rounds.',
        },
        {
          label: 'Code splitting and module federation',
          path: '/react/trivia/react-code-splitting-module-federation',
          access: 'free',
          why: 'One SDE 3 (UI) account went deep on module federation.',
        },
        {
          label: 'Debug a product search that misuses its API',
          path: '/react/coding/react-debug-api-misuse',
          access: 'premium',
          why: 'The 2026 assessment and one senior onsite reported a debugging session on a React app.',
        },
        {
          label: 'Select with compound components',
          path: '/react/coding/react-select-compound-api',
          access: 'premium',
          why: 'A component API design task reported in an SDE 3 (UI) round.',
        },
        {
          label: 'Implement useMemo and a Context data provider',
          path: '/react/coding/react-implement-usememo-context',
          access: 'premium',
          why: 'Reported as a from-scratch hooks task that then extends to API results.',
        },
        {
          label: 'Design a real-time messaging inbox',
          path: '/system-design/messaging-inbox-frontend',
          access: 'premium',
          why: 'A practice version for the design rounds. The chat prompt comes from published advice, not from a reported round.',
        },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common questions about Walmart frontend interviews',
      items: [
        {
          question: 'Is there a system design round?',
          answer:
            'Senior and Software Engineer III accounts from the US report one or two design rounds. The SDE 3 (UI) accounts from India report none, and none of them mentions an online assessment either.',
        },
        {
          question: 'Which platform runs the screen?',
          answer:
            'Reports name HackerRank, including CodePair and the 2026 Frontend Engineering Assessment, and Karat. Your invitation names the platform that applies to your loop.',
        },
        {
          question: 'Are these the real Walmart questions?',
          answer:
            'No. They are practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Walmart questions. Treat recruiter material as the source of truth.',
        },
      ],
    },
    about: ['Walmart frontend interview preparation', 'Walmart Global Tech hiring loop'],
  },
};

export type CompanyEditorialNotesRegistry = Readonly<Record<string, CompanyEditorialNotes>>;
