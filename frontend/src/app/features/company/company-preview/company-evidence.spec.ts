import { buildAuthoredCompanyPreviewFixture } from '../../../shared/company-previews/authored-company-preview.spec-fixture';
import type { CompanyInterviewProcess } from '../../../shared/company-previews/company-interview-processes';
import { authoredCountFields, companyEvidence, countWord, fillAuthoredPreview, fillCompanyCounts } from './company-evidence';

const TABLE: CompanyInterviewProcess = {
  summary: '',
  caveat: '',
  checkedAt: '2026-10-20',
  variants: [
    {
      title: 'Engineers',
      stages: [
        { stage: 'Phone screen', format: '', appliesTo: '', sources: [{ label: 'LeetCode', url: 'https://reports.example.com/acme-phone', kind: 'report', date: '2025-03' }, { label: 'Acme careers', url: 'https://careers.example.com/acme', kind: 'official', date: '2026-10' }] },
        { stage: 'Onsite', format: '', appliesTo: '', sources: [{ label: 'LeetCode', url: 'https://reports.example.com/acme-phone', kind: 'report', date: '2025-03' }, { label: 'Acme hiring page', url: 'https://careers.example.com/acme/hiring', kind: 'official', date: '2026-10' }] },
      ],
    },
  ],
};

describe('companyEvidence', () => {
  const acme = buildAuthoredCompanyPreviewFixture();

  it('counts the guide sources and the table sources once by URL, and lists the table-only ones after the guide ones', () => {
    const { counts, sources } = companyEvidence(acme, TABLE);
    expect(counts).toEqual({ reports: 2, official: 2, sources: 4, prompts: 2, questions: 0 });
    expect(sources.slice(0, 2)).toEqual(acme.sources.items);
    expect(sources[2]).toEqual({
      label: 'LeetCode account, March 2025',
      url: 'https://reports.example.com/acme-phone',
      kind: 'report',
      note: 'A public account read for the process table, where it describes the Phone screen and Onsite.',
    });
    expect(sources[3].label).toBe('Acme hiring page');
    expect(sources[3].note).toBe('An official page read for the process table, where it describes the Onsite. Process context, not interview content.');
  });

  it('counts only the guide sources when there is no table', () => {
    expect(companyEvidence(acme, null).counts).toEqual({ reports: 1, official: 1, sources: 2, prompts: 2, questions: 0 });
  });

  it('says a question bank lists no rounds and a press report is no candidate account', () => {
    const bank = { label: 'Blind question thread', url: 'https://reports.example.com/acme-bank', kind: 'report' as const, date: '2026-11', reportForm: 'question-bank' as const };
    const press = { label: 'Business Insider', url: 'https://news.example.com/acme-pilot', kind: 'report' as const, date: '2026-05', reportForm: 'press' as const };
    const table: CompanyInterviewProcess = {
      ...TABLE,
      variants: [{ title: 'Engineers', stages: [{ stage: 'Onsite', format: '', appliesTo: '', sources: [press] }] }],
      questions: [
        { id: 'debounce', round: 'Phone screen', kind: 'JavaScript', topic: 'Debounce', question: 'Write a debounce.', sources: [bank] },
        { id: 'tabs', kind: 'UI build', topic: 'Tabs', question: 'Build tabs.', sources: [bank] },
      ],
    };
    const { sources } = companyEvidence({ ...acme, sources: { ...acme.sources, items: [] } }, table);
    expect(sources).toEqual([
      { label: 'Business Insider report, May 2026', url: press.url, kind: 'report', note: "A press report read for the process table, where it describes the Onsite, not a candidate's account." },
      { label: 'Blind question thread', url: bank.url, kind: 'report', note: 'A question bank candidates add to, read for two reported questions. It lists questions without the loop around them.' },
    ]);
  });
});

describe('fillCompanyCounts', () => {
  const counts = { reports: 7, official: 2, sources: 9, prompts: 5, questions: 0 };

  it('writes words, capitalised at a sentence start, and digits on request', () => {
    expect(fillCompanyCounts('{reports} public accounts inform this guide. It cites {official} official pages and {sources} sources in all: {#prompts} prompts.', counts))
      .toBe('Seven public accounts inform this guide. It cites two official pages and nine sources in all: 5 prompts.');
    expect(fillCompanyCounts('Shaped by {reports} accounts', counts)).toBe('Shaped by seven accounts');
    expect(fillCompanyCounts('{reports} accounts', { ...counts, reports: 23 })).toBe('Twenty-three accounts');
    expect(countWord(0)).toBe('zero');
    expect(countWord(21)).toBe('twenty-one');
    expect(countWord(30)).toBe('thirty');
    expect(countWord(31)).toBe('31');
  });

  it('leaves an unknown token alone for the lint to catch', () => {
    expect(fillCompanyCounts('{reportz} accounts', counts)).toBe('{reportz} accounts');
  });
});

describe('fillAuthoredPreview', () => {
  it('fills every field the lint reads and nothing else', () => {
    const acme = buildAuthoredCompanyPreviewFixture();
    const tokened = {
      ...acme,
      title: 'Acme: {#prompts} Prompts',
      description: '{#prompts} prompts from {reports} accounts.',
      trustNote: '{reports} accounts cannot fix a loop.',
      hero: { ...acme.hero, subtitle: 'Shaped by {reports} public accounts.', caveat: '{official} official page.', chips: ['{#prompts} practice prompts'] },
      studyPriorities: { ...acme.studyPriorities, paragraphs: ['{reports} accounts agree.'] },
      sourceBoundary: { ...acme.sourceBoundary, paragraphs: ['{reports} self-reported accounts inform this guide.', 'Plain.'] },
      prompts: { ...acme.prompts, intro: '{prompts} prompts follow.' },
      sources: { ...acme.sources, intro: '{sources} sources.' },
    };
    const filled = fillAuthoredPreview(tokened, companyEvidence(tokened, null).counts);
    expect(authoredCountFields(filled).map((entry) => entry.text)).toEqual([
      'Acme: 2 Prompts',
      '2 prompts from one accounts.',
      'One accounts cannot fix a loop.',
      'Shaped by one public accounts.',
      'One official page.',
      '2 practice prompts',
      'One accounts agree.',
      'One self-reported accounts inform this guide.',
      'Plain.',
      'Two prompts follow.',
      'Two sources.',
    ]);
    expect(filled.prompts.items).toBe(tokened.prompts.items);
    expect(filled.sources.items).toBe(tokened.sources.items);
  });
});
