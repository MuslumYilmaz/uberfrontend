import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildCompanyQuestionLists, buildFromRepo, COMPANY_QUESTION_LISTS_RELATIVE_PATH, renderCompanyQuestionLists } from './gen-company-question-lists.mjs';
import { loadTsModule } from './load-ts-module.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const previewsRoot = path.resolve(here, '..', 'src', 'app', 'shared', 'company-previews');
const questionList = loadTsModule(path.join(previewsRoot, 'company-question-list.ts'));
const reporter = loadTsModule(path.join(previewsRoot, 'company-source-reporter.ts'));
const { COMPANY_INTERVIEW_PROCESSES } = loadTsModule(path.join(previewsRoot, 'company-interview-processes.ts'));

const account = (id, date, extra = {}) => ({ label: 'Blind', url: `https://www.teamblind.com/post/${id}`, kind: 'report', date, ...extra });
const BANK = { label: 'Aced question bank', url: 'https://www.aced.io/guides/acme/questions', kind: 'report', date: '2026-10', reportForm: 'question-bank' };
const OFFICIAL = { label: 'Acme careers', url: 'https://acme.example/careers', kind: 'official', date: '2026-10' };

function acme(questions, behaviouralQuestions) {
  return {
    summary: '',
    caveat: '',
    checkedAt: '2026-11-01',
    variants: [
      { title: 'Engineers', stages: [{ stage: 'Recruiter call', format: '', appliesTo: '', sources: [] }, { stage: 'Coding round', format: '', appliesTo: '', sources: [] }] },
      { title: 'Interns', stages: [{ stage: 'Design round', format: '', appliesTo: '', sources: [] }, { stage: 'Coding round', format: '', appliesTo: '', sources: [] }] },
    ],
    questions,
    ...(behaviouralQuestions ? { behaviouralQuestions } : {}),
  };
}

test('counts questions per stage in stage order, rounds not stated apart, and accounts apart from banks', () => {
  const summary = questionList.summariseQuestionList(
    acme([
      { id: 'open-one', round: 'Design round', kind: 'Product design', topic: 'Topic 1', question: 'Q', sources: [account('a', '2025-03'), BANK], answerGuide: 'p1' },
      { id: 'same-task', round: 'Coding round', kind: 'React build', topic: 'Topic 2', question: 'Q', sources: [account('a', '2025-03'), account('b', '2026-02'), account('b', '2026-02', { label: 'Blind comment' })] },
      { id: 'bank-only', kind: 'Algorithm', topic: 'Topic 3', question: 'Q', sources: [BANK], practice: { label: 'X', path: '/javascript/coding/js-x' } },
      { id: 'with-guide', round: 'Coding round', kind: 'React debugging', topic: 'Topic 4', question: 'Q', sources: [account('c', '2024-11')], answerGuide: 'p2' },
    ], [{ id: 'why-acme', question: 'Why Acme?', sources: [account('a', '2025-03'), account('b', '2026-02'), BANK] }]),
  );
  assert.equal(summary.total, 4);
  assert.deepEqual(summary.rounds, [{ stage: 'Coding round', count: 2 }, { stage: 'Design round', count: 1 }]);
  assert.equal(summary.roundNotStated, 1);
  assert.equal(summary.newestAccount, '2026-02');
  assert.deepEqual(summary.behavioural, [{ id: 'why-acme', accounts: 2, banks: 1, latest: '2026-02' }]);
  assert.deepEqual(
    summary.rows.map((row) => [row.id, row.accounts, row.banks, row.latest, row.open, row.unlockable]),
    [
      ['open-one', 1, 1, '2025-03', true, false],
      ['same-task', 2, 0, '2026-02', false, false],
      // A bank's date is the month it was read, so a bank-only question has no freshness.
      ['bank-only', 0, 1, null, false, true],
      ['with-guide', 1, 0, '2024-11', false, true],
    ],
  );
});

test('a question stays new for 60 days after its newest account month ends', () => {
  assert.equal(questionList.newUntil('2026-10'), '2026-12-30');
  assert.equal(questionList.newUntil('2026-12'), '2027-03-01');
  const row = { newUntil: '2026-12-30' };
  assert.equal(questionList.isNewQuestion(row, '2026-12-30'), true);
  assert.equal(questionList.isNewQuestion(row, '2026-12-31'), false);
  assert.equal(questionList.isNewQuestion({ newUntil: null }, '2026-01-01'), false);
});

test('flags list problems: unknown stages, reused ids, official-only rows, bad dates and a format-only open row', () => {
  const problems = questionList.questionListProblems(
    acme([
      { id: 'first', round: 'Coding round', kind: 'Algorithm', topic: 'Same topic', question: 'Q', promptNotShared: true, sources: [account('a', '2025-3')] },
      { id: 'first', round: 'Onsite', kind: 'Algorithm', topic: 'Same topic', question: 'Q', sources: [OFFICIAL] },
      { id: 'Bad_Id', kind: 'Algorithm', topic: 'Ends with a stop.', question: ' ', sources: [account('a', '2025-03'), account('a', '2025-03')] },
    ]),
  );
  assert.deepEqual(problems, [
    'question first: https://www.teamblind.com/post/a has the date "2025-3", not YYYY-MM',
    'question first: the open row must show a question, not a format',
    'question first: the id is used twice',
    'question first: only official pages back it',
    'question first: the topic "Same topic" is used twice',
    'question first: no stage is named "Onsite"',
    'question Bad_Id: the id must be kebab-case',
    'question Bad_Id: the question is empty',
    'question Bad_Id: a source is listed twice',
    'question Bad_Id: the topic "Ends with a stop." must be 1 to 6 words, at most 48 characters, with no full stop',
  ]);
  // The behavioural group shares the id space, since an id names a question wherever it is shown.
  const behavioural = questionList.questionListProblems({
    ...acme([{ id: 'why-acme', kind: 'Algorithm', topic: 'Topic 5', question: 'Q', sources: [account('a', '2025-03')] }]),
    behaviouralQuestions: [{ id: 'why-acme', question: 'Why Acme?', sources: [OFFICIAL] }],
  });
  assert.deepEqual(behavioural, ['behavioural question why-acme: the id is used twice', 'behavioural question why-acme: only official pages back it']);
});

test('the generated file carries practice access and rejects links to missing tasks or prompts', () => {
  const processes = {
    acme: acme([
      { id: 'one', round: 'Coding round', kind: 'React build', topic: 'Topic 6', question: 'Q', sources: [account('a', '2026-01')], practice: { label: 'X', path: '/react/coding/react-x' }, answerGuide: 'p1' },
      { id: 'two', kind: 'Algorithm', topic: 'Topic 7', question: 'Q', sources: [account('b', '2025-01')], practice: { label: 'Y', path: '/javascript/coding/js-y' } },
    ]),
    beta: { ...acme([]), questions: undefined },
  };
  const catalogAccess = new Map([['/react/coding/react-x', 'premium'], ['/javascript/coding/js-y', 'free']]);
  const payload = buildCompanyQuestionLists({ processes, questionList, catalogAccess, answerGuides: new Map([['acme', new Set(['p1'])]]) });
  assert.deepEqual(Object.keys(payload.companies), ['acme']);
  assert.deepEqual(payload.companies.acme.questions.map((row) => [row.id, row.practice, row.answerGuide, row.unlockable]), [
    ['one', { route: '/react/coding/react-x', access: 'premium' }, 'p1', false],
    ['two', { route: '/javascript/coding/js-y', access: 'free' }, null, true],
  ]);
  assert.throws(
    () => buildCompanyQuestionLists({ processes, questionList, catalogAccess: new Map(), answerGuides: new Map() }),
    (error) => /no catalog task at \/react\/coding\/react-x/.test(error.message) && /the guide has no practice prompt "p1"/.test(error.message),
  );
});

test('the committed question lists match the process data', () => {
  const committed = fs.readFileSync(path.resolve(here, '..', '..', 'cdn', COMPANY_QUESTION_LISTS_RELATIVE_PATH), 'utf8');
  assert.equal(committed, renderCompanyQuestionLists(buildFromRepo()));
});

test('reporters: authored fields win, Taro URLs fill the rest, and banks and official pages read as such', () => {
  const taro = (company, slug) => ({ label: 'Taro', kind: 'report', date: '2025-05', url: `https://www.jointaro.com/interviews/companies/${company}/experiences/${slug}/` });
  assert.deepEqual(reporter.sourceReporter(taro('elevenlabs', 'full-stack-engineer-united-kingdom-may-1-2025-accepted-offer-positive-8ac03948')), {
    role: 'Full-stack engineer',
    location: 'United Kingdom',
    outcome: 'accepted offer',
  });
  assert.equal(
    reporter.describeReporter(taro('datadog', 'senior-software-engineer-frontend-france-june-1-2024-no-offer-neutral-1234abcd')),
    'Senior software engineer (frontend), France',
  );
  assert.equal(reporter.describeReporter(taro('meta', 'front-end-developer-new-york-ny-november-1-2020-no-offer-positive-b0918a8e')), 'Front-end developer, United States');
  // Taro re-hosts these companies' reviews with its own place metadata, so no place is shown.
  assert.equal(reporter.describeReporter(taro('tesla', 'front-end-developer-fremont-ca-january-1-2024-no-offer-neutral-9e5d4e3f')), 'Front-end developer');
  assert.equal(reporter.describeReporter({ ...taro('elevenlabs', 'growth-engineer-february-1-2026-accepted-offer-positive-b700cab8'), role: 'Growth engineer (product)' }), 'Growth engineer (product)');
  assert.equal(reporter.describeReporter(account('x', '2025-01')), 'Role not stated');
  assert.equal(reporter.describeReporter(account('x', '2025-01', { role: 'Senior frontend engineer', location: 'Canada' })), 'Senior frontend engineer, Canada');
  assert.equal(reporter.describeReporter(BANK), 'Candidate question bank');
  assert.equal(reporter.describeReporter(OFFICIAL), null);
});

test('every Taro source in the process data parses to a job title, and every place to a country', () => {
  const sources = new Map();
  for (const process of Object.values(COMPANY_INTERVIEW_PROCESSES)) {
    for (const variant of process.variants) for (const stage of variant.stages) for (const source of stage.sources) sources.set(source.url, source);
    for (const question of [...(process.questions ?? []), ...(process.behaviouralQuestions ?? [])]) {
      for (const source of question.sources) sources.set(source.url, source);
    }
  }
  const taro = [...sources.values()].filter((source) => source.url.includes('jointaro.com'));
  assert.ok(taro.length > 150);
  const countries = new Set(['United States', 'United Kingdom', 'India', 'Poland', 'Spain', 'Germany', 'France', 'Canada', 'Australia', 'Singapore', 'Netherlands', 'Portugal', 'Brazil', 'Israel', 'Serbia', 'Mexico', 'Denmark', 'Romania', 'Turkey', 'Bangladesh', 'Georgia', 'Finland', 'Sweden', 'Ireland', 'Cyprus', 'Paraguay', 'Italy', 'Nigeria', 'Belgium']);
  for (const source of taro) {
    const { role, location, outcome } = reporter.sourceReporter(source);
    // A place missing from the dictionary would stay in the role, which then ends in a city instead of a job word. An
    // authored role replaces the URL's, so only a role read from the URL is checked.
    if (!source.role) {
      assert.match(role, /(engineer|developer|intern|internship|lead|specialist|\((frontend|front-end|React)\)|I{1,3})$/i, `${source.url} gives the role "${role}"`);
    }
    if (location) assert.ok(countries.has(location), `${source.url} gives the place "${location}"`);
    assert.ok(outcome, `${source.url} gives no outcome`);
  }
});
