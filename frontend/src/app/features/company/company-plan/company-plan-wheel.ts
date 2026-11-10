/**
 * The companies the plan sentences rotate through before anyone picks: the four most visitors look for first, then
 * the ones with the clearest signature round. The form on /companies and the panel on the home page show the same
 * ones; every other company is one link away.
 */
export const COMPANY_PLAN_WHEEL: readonly { readonly slug: string; readonly name: string }[] = [
  { slug: 'google', name: 'Google' },
  { slug: 'meta', name: 'Meta' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'uber', name: 'Uber' },
  { slug: 'elevenlabs', name: 'ElevenLabs' },
  { slug: 'agoda', name: 'Agoda' },
  { slug: 'capital-one', name: 'Capital One' },
  { slug: 'intuit', name: 'Intuit' },
  { slug: 'revolut', name: 'Revolut' },
  { slug: 'stripe', name: 'Stripe' },
  { slug: 'gitlab', name: 'GitLab' },
  { slug: 'walmart', name: 'Walmart' },
];
