export type PublicChangelogEntry = {
  id: string;
  weekOf: string;
  title: string;
  summary: string;
  category: 'New' | 'Improved' | 'Fixed';
  area: string;
  changes: string[];
  cta?: {
    label: string;
    route: string;
    queryParams?: Record<string, string>;
  };
};

export const PUBLIC_CHANGELOG_ENTRIES: PublicChangelogEntry[] = [
  {
    id: 'react-check-reliability-and-content-accuracy',
    weekOf: '2026-07-15',
    title: 'React checks are reliable and Premium previews are clearer',
    summary: 'Practice checks, framework guidance, and public product information are now more reliable and easier to evaluate.',
    category: 'Fixed',
    area: 'Practice and content',
    changes: [
      'React checks now use a commit-based preview handshake, report bounded failure categories, and reset cleanly across rebuilds and repeated runs.',
      'Premium previews now use complete summaries and concrete practice outcomes without rendering or automatically requesting solution content while locked.',
      'Angular exercises now use modern template control flow, and refund, editorial, authorship, traction, score, and company-attribution copy reflects verifiable evidence.',
    ],
    cta: {
      label: 'Try React Counter',
      route: '/react/coding/react-counter',
      queryParams: { src: 'changelog' },
    },
  },
  {
    id: 'earned-badges-are-easier-to-see',
    weekOf: '2026-05-04',
    title: 'Earned badges are easier to see',
    summary: 'Progress now feels more collectible, easier to understand, and visible when a badge is earned.',
    category: 'New',
    area: 'Progress',
    changes: [
      'Profile activity now has a collectible badge shelf with visual awards and clear earning criteria.',
      'Dashboard progress now highlights badges as the primary progress snapshot while keeping XP details secondary.',
      'Newly earned badges now appear as lightweight in-app notifications and stay permanently available in Profile.',
    ],
    cta: {
      label: 'View badge progress',
      route: '/profile',
      queryParams: { tab: 'activity', src: 'changelog' },
    },
  },
  {
    id: 'start-practice-faster',
    weekOf: '2026-02-09',
    title: 'Start practice faster',
    summary: 'It is easier to jump from the first visit or sign-in flow into a useful practice task.',
    category: 'Improved',
    area: 'Practice',
    changes: [
      'The main CTA now opens a known free challenge directly.',
      'Login and signup remember the question you were trying to open.',
      'New users get a clearer first step toward practice.',
    ],
    cta: {
      label: 'Try free challenge',
      route: '/react/coding/react-counter',
      queryParams: { src: 'changelog' },
    },
  },
  {
    id: 'preview-premium-tracks-before-upgrading',
    weekOf: '2026-02-02',
    title: 'Preview premium tracks before upgrading',
    summary: 'You can understand what a track or company prep page includes before deciding whether Premium is worth it.',
    category: 'Improved',
    area: 'Access',
    changes: [
      'Track and company pages now show a public preview before Premium is required.',
      'Each preview separates what you can try for free from what Premium unlocks.',
      'Locked sections now explain the upgrade value instead of ending at a generic access wall.',
    ],
  },
  {
    id: 'clearer-pricing-before-checkout',
    weekOf: '2026-01-26',
    title: 'Clearer pricing before checkout',
    summary: 'Pricing now makes the free plan, refund policy, and checkout expectations easier to evaluate before paying.',
    category: 'Improved',
    area: 'Pricing',
    changes: [
      'The pricing page now explains Free Explorer before paid plans.',
      'Refund and legal links are easier to find before choosing a plan.',
      'Checkout messaging is clearer when payments are unavailable or blocked.',
    ],
  },
];
