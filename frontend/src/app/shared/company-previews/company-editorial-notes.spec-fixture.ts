import type { CompanyEditorialNotes } from './company-editorial-notes.model';

/** A complete fixture for specs; not referenced by application code. */
export function buildCompanyEditorialNotesFixture(
  overrides: Partial<CompanyEditorialNotes> = {},
): CompanyEditorialNotes {
  return {
    slug: 'acme',
    title: 'Acme Frontend Interview Process and Practice Questions',
    h1: 'Acme Frontend Interview Questions and Process',
    description: 'How public reports describe Acme frontend interviews: a CoderPad screen, two coding rounds and a design conversation.',
    hero: {
      kicker: 'Public preview and process notes',
      subtitle: 'Public reports from 2025 describe a CoderPad screen and a two-round onsite; the items below rehearse each stage.',
    },
    intro: ['Acme publishes no interview guide, so this page rests on public reports.'],
    reportsDescribe: {
      kicker: 'What public interview reports describe',
      title: 'The Acme frontend loop as reported',
      paragraphs: ['Two accounts describe a 60-minute CoderPad screen followed by two coding rounds.'],
      bullets: [
        { text: 'A recruiter call, then a CoderPad screen.', link: { label: 'See the screen stage', fragment: 'acme-interview-process' } },
        { text: 'Two coding rounds with one engineer each.', link: { label: 'Practice the UI build', path: '/react/coding/react-counter' } },
      ],
    },
    prepSteps: {
      kicker: 'How to prepare with this grouping',
      title: 'Rehearse the reported stages in order',
      intro: 'Free items first, then the premium set.',
      steps: [
        { label: 'React counter', path: '/react/coding/react-counter', access: 'free', why: 'The screen opens with a small stateful component.' },
        { label: 'Debounced search', path: '/react/coding/react-debounced-search', access: 'premium', why: 'The second coding round reported a search box.' },
      ],
    },
    faqs: {
      kicker: 'Preparation FAQ',
      title: 'Common Acme frontend interview questions',
      items: [
        { question: 'Is there a system design round?', answer: 'Not in the two accounts read for this page.' },
        { question: 'Are these the real Acme questions?', answer: 'No. They are practice versions modelled on public reports.' },
      ],
    },
    about: ['Acme frontend interview preparation'],
    ...overrides,
  };
}
