export const PUBLIC_EDITORIAL_FACTS = {
  author: {
    name: 'FrontendAtlas Editorial',
    schemaType: 'Organization' as const,
  },
  descriptor: 'Built and maintained as an independent frontend interview-prep project',
  workflow: [
    'Runnable examples',
    'Regression tests',
    'Official-source checks where relevant',
    'Correction reports',
    'Dated updates',
  ],
} as const;

export const PUBLIC_EDITORIAL_WORKFLOW_DESCRIPTION =
  'Content checks use runnable examples, regression tests, official-source checks where relevant, correction reports, and dated updates.';

export const COMPANY_PRACTICE_DISCLAIMER =
  'Editorial practice groupings, not verified official interview questions or endorsements.';

export function publicEditorialAuthorSchema(): { '@type': 'Organization'; name: string } {
  return {
    '@type': PUBLIC_EDITORIAL_FACTS.author.schemaType,
    name: PUBLIC_EDITORIAL_FACTS.author.name,
  };
}
