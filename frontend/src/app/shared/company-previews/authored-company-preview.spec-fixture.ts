import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/** A complete fixture for specs; not referenced by application code. */
export function buildAuthoredCompanyPreviewFixture(
  overrides: Partial<AuthoredCompanyPreview> = {},
): AuthoredCompanyPreview {
  return {
    slug: 'acme',
    label: 'Acme',
    title: 'Acme Frontend Interview Questions: 2 Prompts + Prep Guide',
    h1: 'Acme Frontend Interview Questions',
    description: 'Prepare for an Acme frontend interview with two representative prompts on request control and streaming UI.',
    canonicalPath: '/companies/acme/preview',
    trustNote: 'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Acme questions.',
    hero: {
      kicker: 'Public Acme prep guide',
      subtitle: 'Prepare with two representative prompts across request control and streaming UI.',
      caveat: 'This guide uses public interview reports to create realistic constraints. It does not claim access to private interview material.',
      chips: ['2 representative prompts', 'JavaScript, streaming UI', 'Full practice set requires Premium'],
    },
    studyPriorities: {
      kicker: 'Study priorities',
      title: 'Prepare for product judgment, not Acme trivia',
      paragraphs: ['Start with one reliable implementation slice.', 'Widen to delivery and design afterwards.'],
    },
    sourceBoundary: {
      kicker: 'Source boundary',
      title: 'What the reports establish and what you still need to confirm',
      paragraphs: ['One report cannot establish a fixed loop.'],
    },
    roleLenses: {
      kicker: 'Role lenses',
      title: 'Two product contexts',
      intro: 'Preparation lenses derived from public reports.',
      items: [{ title: 'Dashboard UI', description: 'Data-dense screens.', practiceFocus: 'Large lists and filters.' }],
    },
    prompts: {
      kicker: 'Representative practice prompts',
      title: 'Two Acme frontend interview practice questions',
      intro: 'Clarify the contract, then implement the smallest credible slice.',
      itemListName: 'Two Acme frontend interview practice prompts',
      items: [
        {
          id: 'acme-tree-filter',
          title: 'Filter a tree and render it indented',
          statement: 'Drop every subtree whose value contains a needle, then render the rest indented.',
          whatThisMeasures: 'Recursion, immutability and rendering order.',
          clarifyFirst: ['Confirm match semantics.'],
          strongAnswer: ['Prune while walking.', 'Render depth-first.'],
          commonMiss: 'Mutating the input tree.',
          resourceLabel: 'Practice the deferred promise drill',
          resourcePath: '/javascript/coding/js-create-deferred-promise',
          reportedRound: { label: 'Public report: Acme senior frontend loop, May 2026', url: 'https://reports.example.com/acme-senior-frontend' },
        },
        {
          id: 'acme-streaming-chat',
          title: 'Stream a chat reply with a stop button',
          statement: 'Render tokens as they arrive and stop cleanly.',
          whatThisMeasures: 'Stream reading and cancellation.',
          clarifyFirst: ['Confirm the transport.'],
          strongAnswer: ['Use AbortController.'],
          commonMiss: 'Dropping partial text on stop.',
          resourceLabel: 'Practice takeLatest request handling',
          resourcePath: '/javascript/coding/js-take-latest',
        },
      ],
    },
    walkthrough: {
      kicker: 'Public mini walkthrough',
      title: 'Scope the tree filter before coding',
      intro: 'Work from the contract toward the implementation.',
      steps: [{ title: 'Match semantics', description: 'Decide case sensitivity first.' }],
    },
    prepPlan: {
      kicker: 'Actionable preparation',
      title: 'A 7-day Acme frontend interview preparation plan',
      intro: 'Every day ends with an artifact.',
      days: [{ day: 'Day 1', focus: 'Recursion drills.', artifact: 'A passing tree filter.' }],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common Acme frontend interview preparation questions',
      items: [{ question: 'Are these the real Acme questions?', answer: 'No. They are practice versions modelled on public reports.' }],
    },
    resourceLinks: {
      kicker: 'Free public practice',
      title: 'Build the underlying skills with free practice',
      intro: 'Supporting drills, not claimed Acme questions.',
      items: [
        { label: 'Deferred promise drill', description: 'Control async tests.', path: '/javascript/coding/js-create-deferred-promise' },
        { label: 'takeLatest request handling', description: 'Abort stale requests.', path: '/javascript/coding/js-take-latest' },
      ],
    },
    sources: {
      kicker: 'Public interview reports and official context',
      title: 'Sources and evidence limits',
      intro: 'Each note states what the source can and cannot establish.',
      items: [
        { label: 'Public report: Acme senior frontend loop, May 2026', url: 'https://reports.example.com/acme-senior-frontend', note: 'One self-reported loop; it establishes the round list, not the wording.', kind: 'report' },
        { label: 'Acme careers', url: 'https://careers.example.com/acme', note: 'Official context only.', kind: 'official' },
      ],
    },
    cta: {
      kicker: 'Full company practice',
      title: 'Continue with the full Acme practice set',
      copy: 'Premium unlocks the broader company-tagged editorial set.',
      buttonLabel: 'Unlock the full Acme practice set',
      src: 'company_preview_acme',
    },
    about: ['Acme frontend interview preparation', 'Streaming UI'],
    indexAnchorLabel: 'Acme frontend interview questions',
    ...overrides,
  };
}
