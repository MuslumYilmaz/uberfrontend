export type PublicChangelogEntry = {
  weekOf: string;
  title: string;
  changes: string[];
};

export const PUBLIC_CHANGELOG_ENTRIES: PublicChangelogEntry[] = [
  {
    weekOf: '2026-02-09',
    title: 'Activation flow update',
    changes: [
      'Landing primary CTA now opens a known free challenge directly.',
      'Login/signup now preserve redirect intent for locked questions.',
      'Added first-pass onboarding prompt for faster next-action setup.',
    ],
  },
  {
    weekOf: '2026-02-02',
    title: 'Preview routes for trust-first gating',
    changes: [
      'Added public preview pages for track and company routes.',
      'Preview pages now show free-vs-premium scope before paywall.',
      'Kept full premium routes protected without hard paywall bounce first.',
    ],
  },
  {
    weekOf: '2026-01-26',
    title: 'Pricing clarity and instrumentation',
    changes: [
      'Reframed pricing around Free Explorer and decision-first comparison.',
      'Moved refund/legal context above paid CTA area.',
      'Added activation and checkout analytics events for conversion analysis.',
    ],
  },
];

