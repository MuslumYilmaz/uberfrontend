import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { INLINE_COMPANY_GUIDES, buildCompanyPlanData, loadCompanyPlanSources, renderCompanyPlanData } from './gen-company-plan-data.mjs';

const realSources = loadCompanyPlanSources();
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const reportUrl = (name) => `https://www.jointaro.com/interviews/companies/acme/experiences/${name}/`;
const tableSource = (name, date) => ({ label: `Taro ${name}`, url: reportUrl(name), kind: 'report', date });
const catalogSource = (name, date, publisher = 'Taro') => ({ label: `Taro: ${name}`, url: reportUrl(name), company: 'acme', publisher, date });

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'company-plan-data-'));
  for (const [relative, value] of Object.entries(files)) {
    const filePath = path.join(dir, 'questions', relative);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value));
  }
  return dir;
}

const baseCatalog = {
  'javascript/coding.json': [
    { id: 'js-old', title: 'Old', difficulty: 'easy', companies: ['acme'], sources: [catalogSource('old', '2020-01')] },
    { id: 'js-new', title: 'New', difficulty: 'hard', access: 'premium', companies: ['acme'], sources: [catalogSource('new', '2026-05')] },
    { id: 'js-linked', title: 'Linked', difficulty: 'intermediate' },
    { id: 'js-tag-low', title: 'Tag low', importance: 1, companies: ['acme'] },
    { id: 'js-tag-high', title: 'Tag high', importance: 5, companies: ['acme'] },
    { id: 'js-starter', title: 'Starter' },
  ],
  'react/coding.json': [
    { id: 'react-star-rating', title: 'React stars', access: 'premium', companies: ['acme'], sources: [catalogSource('stars', '2021-01')] },
    { id: 'react-file-explorer', title: 'Explorer', companies: ['acme'] },
  ],
  'angular/coding.json': [{ id: 'angular-star-rating', title: 'Angular stars', companies: ['acme'], sources: [catalogSource('stars-newer', '2023-03')] }],
  'vue/coding.json': [{ id: 'vue-star-rating', title: 'Vue stars', companies: ['acme'], sources: [catalogSource('stars', '2021-01')] }],
  'javascript/trivia.json': [
    { id: 'concept-a', title: 'Concept A', importance: 4, companies: ['acme'] },
    { id: 'concept-b', title: 'Concept B', importance: 2, companies: ['acme'] },
  ],
  'react/trivia.json': [{ id: 'react-concept', title: 'React concept', importance: 5, companies: ['acme'] }],
  'system-design/index.json': [{ id: 'case-a', title: 'Case A', access: 'premium', companies: ['acme'] }],
  'system-design/case-a/meta.json': { id: 'case-a', title: 'Case A', companies: ['acme'], sources: [catalogSource('case', '2024-02')] },
};

const baseProcess = () => ({
  checkedAt: '2026-10-20',
  variants: [
    {
      title: 'Engineers',
      stages: [
        { stage: 'Recruiter call', format: 'A short call. It covers logistics.', sources: [{ label: 'Acme hiring page', url: 'https://acme.example/jobs', kind: 'official', date: '2026-10' }] },
        {
          stage: 'Coding',
          format: 'Two problems.',
          sources: [tableSource('new', '2026-04'), tableSource('stars', '2021-02'), tableSource('other-a', '2025-01'), tableSource('other-b', '2024-01'), tableSource('other-c', '2023-01')],
          practice: { label: 'Linked', path: '/javascript/coding/js-linked' },
        },
        { stage: 'Design', format: 'A design round.', sources: [tableSource('case', '2024-02')], practice: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' } },
      ],
    },
    { title: 'Interns', stages: [{ stage: 'Coding', format: 'One problem.', sources: [tableSource('old', '2020-01')] }, { stage: 'Decision', format: 'An offer.', sources: [tableSource('old', '2020-01')] }] },
  ],
});

const baseRounds = () => ({
  reportVariants: { 'angular-star-rating': ['engineers'] },
  variants: [
    {
      id: 'engineers',
      title: 'Engineers',
      from: 'engineers',
      ask: 'Interviewing as an engineer?',
      default: true,
      rounds: [
        { id: 'recruiter-call', stage: 'Recruiter call', kinds: ['recruiter'] },
        { id: 'coding', stage: 'Coding', kinds: ['coding'] },
        { id: 'design', stage: 'Design', kinds: ['design'], note: 'A short design line.' },
      ],
    },
    {
      id: 'interns',
      title: 'Interns',
      from: 'interns',
      ask: 'Interviewing as an intern?',
      rounds: [
        { id: 'coding', stage: 'Coding', kinds: ['coding'] },
        { id: 'decision', stage: 'Decision', kinds: ['outcome'] },
      ],
    },
  ],
});

function sources(overrides = {}) {
  return {
    ...realSources,
    processes: { acme: baseProcess() },
    rounds: { acme: baseRounds() },
    profiles: { acme: { framework: 'javascript', mixed: true, evidence: 'Fixture.', aliases: ['Acme Corp'] } },
    signatures: { acme: 'Coding' },
    brands: { acme: { label: 'Acme' } },
    starters: ['js-starter'],
    formatPractice: { javascript: ['js-starter'] },
    designPractice: [],
    guides: { design: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' } },
    ...overrides,
  };
}

const build = (overrides, files = baseCatalog) => buildCompanyPlanData(fixture(files), sources(overrides));

test('company facts and rounds carry what the form and the plan show', () => {
  const company = build().companies.acme;
  assert.equal(company.name, 'Acme');
  assert.equal(company.framework, 'javascript');
  assert.equal(company.mixed, true);
  assert.deepEqual(company.aliases, ['Acme Corp']);
  assert.equal(company.checkedAt, '2026-10-20');
  const [engineers, interns] = company.variants;
  assert.equal(engineers.ask, 'Interviewing as an engineer?');
  assert.equal(engineers.default, true);
  assert.equal(interns.default, undefined);
  assert.equal(engineers.sourceCount, 7);
  assert.equal(engineers.rounds[0].note, 'A short call.');
  assert.equal(engineers.rounds[2].note, 'A short design line.');
});

test('a round shows official pages first, then the three newest, and counts the rest', () => {
  const coding = build().companies.acme.variants[0].rounds[1];
  assert.deepEqual(coding.sources.map((source) => source.date), ['2026-04', '2025-01', '2024-01']);
  assert.equal(coding.moreSources, 2);
  const recruiter = build().companies.acme.variants[0].rounds[0];
  assert.deepEqual(recruiter.sources, [{ label: 'Acme hiring page', date: '2026-10' }]);
  assert.equal(recruiter.moreSources, undefined);
});

test('a widget reported in three frameworks is one task in the company framework, dated by its newest source', () => {
  const payload = build();
  const rows = payload.companies.acme.variants[0].tasks.filter((task) => payload.tasks[task.id].family === 'star-rating');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'react-star-rating');
  assert.deepEqual(rows[0].report, { publisher: 'Taro', date: '2023-03' });
  assert.equal(rows.filter((row) => row.id !== 'react-star-rating').length, 0);
});

test('a company framework decides which member of a family enters', () => {
  const payload = build({ profiles: { acme: { framework: 'vue', evidence: 'Fixture.' } } }, {
    ...baseCatalog,
    'react/coding.json': baseCatalog['react/coding.json'].filter((entry) => entry.id !== 'react-file-explorer'),
    'react/trivia.json': [],
  });
  const rows = payload.companies.acme.variants[0].tasks.filter((task) => payload.tasks[task.id].family === 'star-rating');
  assert.deepEqual(rows.map((row) => row.id), ['vue-star-rating']);
  assert.equal(payload.companies.acme.mixed, undefined);
});

test('every member of a family in the plan is published and listed by framework, so a chosen framework can swap the task', () => {
  const payload = build();
  assert.deepEqual(payload.general.familyMembers, { 'star-rating': { react: 'react-star-rating', angular: 'angular-star-rating', vue: 'vue-star-rating' } });
  assert.equal(payload.tasks['angular-star-rating'].family, 'star-rating');
  assert.equal(payload.tasks['angular-star-rating'].companies, undefined);
  assert.equal(payload.tasks['vue-star-rating'].tech, 'vue');

  // A member the catalog lacks is left out rather than invented, and the row keeps its own task.
  const thin = build({}, { ...baseCatalog, 'vue/coding.json': [] });
  assert.deepEqual(thin.general.familyMembers['star-rating'], { react: 'react-star-rating', angular: 'angular-star-rating' });
  assert.equal(thin.tasks['vue-star-rating'], undefined);
});

test('the practice links of the stages lead, then reported tasks newest first, then other links, then tags by importance, with concept questions last', () => {
  const ids = build().companies.acme.variants[0].tasks.map((task) => task.id);
  assert.deepEqual(ids.slice(0, 2), ['js-linked', '/guides/system-design-blueprint']);
  assert.deepEqual(ids.slice(2, 5), ['js-new', 'case-a', 'react-star-rating']);
  assert.ok(ids.indexOf('js-tag-high') > ids.indexOf('react-star-rating'));
  assert.ok(ids.indexOf('js-tag-high') < ids.indexOf('js-tag-low'));
  assert.ok(ids.indexOf('concept-a') > ids.indexOf('js-tag-low'));
  assert.ok(ids.indexOf('concept-a') < ids.indexOf('concept-b'));
});

test('a reported practice link leads its round ahead of a newer report, so the plan opens the round where the guide does', () => {
  const process = baseProcess();
  // The coding stage's practice link is the old report; the newer one stays a report of the same round.
  process.variants[0].stages[1] = { ...process.variants[0].stages[1], sources: [tableSource('new', '2026-04'), tableSource('old', '2020-01')], practice: { label: 'Old', path: '/javascript/coding/js-old' } };
  const ids = build({ processes: { acme: process } }).companies.acme.variants[0].tasks.map((task) => task.id);
  assert.ok(ids.indexOf('js-old') < ids.indexOf('js-new'));
  const old = build({ processes: { acme: process } }).companies.acme.variants[0].tasks.find((task) => task.id === 'js-old');
  assert.deepEqual(old.rounds, ['coding']);
  assert.deepEqual(old.report, { publisher: 'Taro', date: '2020-01' });
});

test('a design task reported by a list with no design round stays on the round whose account mentioned it', () => {
  const rounds = baseRounds();
  rounds.variants[0].rounds = rounds.variants[0].rounds.filter((round) => round.id !== 'design');
  const process = baseProcess();
  process.variants[0].stages = process.variants[0].stages.filter((stage) => stage.stage !== 'Design');
  process.variants[0].stages[1] = { ...process.variants[0].stages[1], sources: [...process.variants[0].stages[1].sources, tableSource('case', '2024-02')] };
  const tasks = build({ rounds: { acme: rounds }, processes: { acme: process } }).companies.acme.variants[0].tasks;
  assert.deepEqual(tasks.find((task) => task.id === 'case-a').rounds, ['coding']);
  // Cited nowhere, the same task stays unbound for the engine to place.
  process.variants[0].stages[1] = { ...process.variants[0].stages[1], sources: process.variants[0].stages[1].sources.filter((source) => source.url !== reportUrl('case')) };
  const unbound = build({ rounds: { acme: rounds }, processes: { acme: process } }).companies.acme.variants[0].tasks;
  assert.equal(unbound.find((task) => task.id === 'case-a').rounds, undefined);
});

test('a source cited by both files shows the date in the process table', () => {
  const payload = build();
  const row = payload.companies.acme.variants[0].tasks.find((task) => task.id === 'js-new');
  assert.deepEqual(row.report, { publisher: 'Taro', date: '2026-04' });
});

test('a task binds to the rounds that cite its source and test its kind', () => {
  const tasks = build().companies.acme.variants[0].tasks;
  assert.deepEqual(tasks.find((task) => task.id === 'js-new').rounds, ['coding']);
  assert.deepEqual(tasks.find((task) => task.id === 'case-a').rounds, ['design']);
  assert.deepEqual(tasks.find((task) => task.id === 'js-linked').rounds, ['coding']);
  assert.equal(tasks.find((task) => task.id === 'js-tag-high').rounds, undefined);
});

test('the practice links of the guide prompts join the round whose report they follow, else the first round of their kind', () => {
  const prompts = {
    acme: [
      { path: '/javascript/coding/js-tag-low', reportUrl: reportUrl('new') },
      { path: '/system-design/case-a', reportUrl: null },
      { path: '/react/coding/react-file-explorer', reportUrl: null },
      { path: '/javascript/coding/js-tag-high', reportUrl: reportUrl('old') },
      { path: '/guides/system-design-blueprint', reportUrl: null },
    ],
  };
  const [engineers, interns] = build({ prompts }).companies.acme.variants;
  // A tag with a report the Coding stage cites lands there; a task already bound by its own report keeps its round.
  assert.deepEqual(engineers.tasks.find((task) => task.id === 'js-tag-low').rounds, ['coding']);
  assert.deepEqual(engineers.tasks.find((task) => task.id === 'case-a').rounds, ['design']);
  // No report: the first round of the task's kind.
  assert.deepEqual(engineers.tasks.find((task) => task.id === 'react-file-explorer').rounds, ['coding']);
  // A report only the interns' list cites binds the task there and nowhere else.
  assert.equal(engineers.tasks.find((task) => task.id === 'js-tag-high').rounds, undefined);
  assert.deepEqual(interns.tasks.find((task) => task.id === 'js-tag-high').rounds, ['coding']);
});

test('rounds the editor names for a reported task win over the stages that cite its report', () => {
  const rounds = { ...baseRounds(), reportRounds: { 'js-new': ['design'] } };
  const tasks = build({ rounds: { acme: rounds } }).companies.acme.variants[0].tasks;
  assert.deepEqual(tasks.find((task) => task.id === 'js-new').rounds, ['design']);
});

test('a list that gives its rounds no order says so', () => {
  const rounds = baseRounds();
  rounds.variants[0] = { ...rounds.variants[0], unordered: true };
  const [engineers, interns] = build({ rounds: { acme: rounds } }).companies.acme.variants;
  assert.equal(engineers.unordered, true);
  assert.equal(interns.unordered, undefined);
});

test('the practice link of a stage carries the lead flag; reports, picks and tags do not', () => {
  const rounds = baseRounds();
  rounds.variants[0].rounds[1] = { ...rounds.variants[0].rounds[1], picks: ['/javascript/coding/js-starter'] };
  const tasks = build({ rounds: { acme: rounds } }).companies.acme.variants[0].tasks;
  assert.equal(tasks.find((task) => task.id === 'js-linked').lead, true);
  assert.equal(tasks.find((task) => task.id === '/guides/system-design-blueprint').lead, true);
  assert.equal(tasks.find((task) => task.id === 'js-starter').lead, undefined);
  assert.equal(tasks.find((task) => task.id === 'js-new').lead, undefined);
  assert.equal(tasks.find((task) => task.id === 'js-tag-high').lead, undefined);
});

test('a stage that links a section of the company guide leads its round with that section', () => {
  const withSection = (practice) => {
    const process = baseProcess();
    process.variants[0].stages[0] = { ...process.variants[0].stages[0], practice };
    return build({ processes: { acme: process } });
  };
  const payload = withSection({ label: 'Acme values questions', path: '/companies/acme/preview', fragment: 'acme-values' });
  const row = payload.companies.acme.variants[0].tasks.find((task) => task.id === '/companies/acme/preview#acme-values');
  assert.deepEqual(row, { id: '/companies/acme/preview#acme-values', lead: true, rounds: ['recruiter-call'] });
  assert.deepEqual(payload.tasks['/companies/acme/preview#acme-values'], {
    id: '/companies/acme/preview#acme-values',
    title: 'Acme values questions',
    route: '/companies/acme/preview',
    fragment: 'acme-values',
    kind: 'guide',
    access: 'free',
    minutes: 15,
  });
  // Another company's guide, or a whole guide without a section, is a link the plan cannot open on the round.
  assert.throws(() => withSection({ label: 'Other', path: '/companies/other/preview', fragment: 'x' }), /own guide/);
  assert.throws(() => withSection({ label: 'Whole guide', path: '/companies/acme/preview' }), /own guide/);
});

// One list, so a report no stage cites still dates its task, plus a task whose only report no stage cites.
const singleList = () => {
  const process = baseProcess();
  process.variants = [process.variants[0]];
  return process;
};
const withHidden = {
  ...baseCatalog,
  'javascript/coding.json': [
    ...baseCatalog['javascript/coding.json'],
    { id: 'js-hidden', title: 'Hidden', difficulty: 'easy', companies: ['acme'], sources: [catalogSource('hidden', '2025-05')] },
  ],
};
const planRow = (payload, id) => payload.companies.acme.variants[0].tasks.find((task) => task.id === id);

test('a guide without a reports card names the newest report it shows, and an unshown report gives no line', () => {
  // A catalog guide lists every report in its reports card, so the newest one dates the line.
  const catalogGuide = build({ processes: { acme: singleList() } }, withHidden);
  assert.deepEqual(planRow(catalogGuide, 'react-star-rating').report, { publisher: 'Taro', date: '2023-03' });
  assert.deepEqual(planRow(catalogGuide, 'js-hidden').report, { publisher: 'Taro', date: '2025-05' });
  // An inline guide without a sources list, as Google: the table's report dates the line, an unshown one is dropped.
  const inlineGuide = build({ processes: { acme: singleList() }, prompts: { acme: [] } }, withHidden);
  assert.deepEqual(planRow(inlineGuide, 'react-star-rating').report, { publisher: 'Taro', date: '2021-02' });
  assert.equal(planRow(inlineGuide, 'js-hidden').report, undefined);
  assert.ok(planRow(inlineGuide, 'js-hidden'), 'the task stays as a pick');
});

test('a guide with a sources list must list the report a plan line names', () => {
  const listed = (...urls) => build({ processes: { acme: singleList() }, sources: { acme: urls } }, withHidden);
  assert.throws(
    () => listed('https://acme.example/jobs'),
    /js-hidden is modelled on https:\/\/www\.jointaro\.com\/interviews\/companies\/acme\/experiences\/hidden\/, which neither the acme guide's sources nor its process table list/,
  );
  assert.doesNotThrow(() => listed(reportUrl('hidden'), reportUrl('old')));
  // The guide's own list counts as shown, so the newer listed report dates the stars widget.
  assert.deepEqual(planRow(listed(reportUrl('hidden'), reportUrl('old'), reportUrl('stars-newer')), 'react-star-rating').report, { publisher: 'Taro', date: '2023-03' });
});

test('the inline guides are the ones the preview renders without the catalog', () => {
  const service = fs.readFileSync(path.join(repoRoot, 'frontend/src/app/core/services/company-public-data.service.ts'), 'utf8');
  const literal = /LEGACY_EDITORIAL_COMPANIES = new Set\(\[([^\]]*)\]\)/.exec(service)?.[1] ?? '';
  const slugs = [...literal.matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]).sort();
  assert.deepEqual(slugs, [...INLINE_COMPANY_GUIDES].sort());
});

test('a report belongs to the list citing it, and elsewhere is only a pick without a report line', () => {
  const [engineers, interns] = build().companies.acme.variants;
  assert.ok(interns.tasks.find((task) => task.id === 'js-old').report);
  assert.equal(engineers.tasks.find((task) => task.id === 'js-old').report, undefined);
  assert.equal(interns.tasks.find((task) => task.id === 'js-new').report, undefined);
  assert.ok(interns.tasks.find((task) => task.id === 'js-new'));
});

test('a question no list cites joins the list named by hand', () => {
  const payload = build({
    rounds: { acme: { ...baseRounds(), reportVariants: { 'js-new': ['interns'] } } },
    processes: { acme: { ...baseProcess(), variants: baseProcess().variants.map((variant) => ({ ...variant, stages: variant.stages.map((stage) => ({ ...stage, sources: stage.sources.filter((source) => source.url !== reportUrl('new')) })) })) } },
  });
  const [engineers, interns] = payload.companies.acme.variants;
  assert.equal(interns.tasks.find((task) => task.id === 'js-new').report.date, '2026-05');
  assert.equal(engineers.tasks.find((task) => task.id === 'js-new').report, undefined);
});

test('a hand pick binds to its round, comes after links and carries no report line', () => {
  const rounds = baseRounds();
  rounds.variants[0].rounds[1] = { ...rounds.variants[0].rounds[1], picks: ['/javascript/coding/js-starter'] };
  const tasks = build({ rounds: { acme: rounds } }).companies.acme.variants[0].tasks;
  const pick = tasks.find((task) => task.id === 'js-starter');
  assert.deepEqual(pick.rounds, ['coding']);
  assert.equal(pick.report, undefined);
  assert.ok(tasks.indexOf(pick) > tasks.findIndex((task) => task.id === 'js-linked'));
  assert.ok(tasks.indexOf(pick) < tasks.findIndex((task) => task.id === 'js-tag-high'));

  rounds.variants[0].rounds[1] = { ...rounds.variants[0].rounds[1], picks: ['/javascript/coding/js-gone'] };
  assert.throws(() => build({ rounds: { acme: rounds } }), /links \/javascript\/coding\/js-gone/);
});

test('a round says what it tests in its own words, and a task says what it practises', () => {
  const process = baseProcess();
  process.variants[0].stages[1].stage = 'Onsite: bug squash';
  process.variants[0].stages[1].format = 'Fix bugs in a React app, then an algorithm problem.';
  const rounds = baseRounds();
  rounds.variants[0].rounds[1] = { id: 'bug-squash', stage: 'Onsite: bug squash', kinds: ['coding'] };
  const payload = build({ processes: { acme: process }, rounds: { acme: rounds } }, {
    ...baseCatalog,
    'javascript/coding.json': [
      ...baseCatalog['javascript/coding.json'],
      { id: 'js-sort-it', title: 'Sort it', tags: ['arrays', 'sorting'], companies: ['acme'] },
    ],
    'javascript/debug.json': [{ id: 'js-debug-race', title: 'Race', companies: ['acme'] }],
    'react/coding.json': [
      ...baseCatalog['react/coding.json'],
      { id: 'react-debug-render', title: 'Debug a render', companies: ['acme'] },
      { id: 'react-review-cart', title: 'Review a cart', companies: ['acme'], reviewModeAsset: 'assets/questions/review-modes/cart.v1.json' },
    ],
    'css/coding.json': [{ id: 'css-grid', title: 'Grid', companies: ['acme'] }],
    'review-modes/cart.v1.json': { sessionMinutes: 75 },
  });
  const [recruiter, bugSquash] = payload.companies.acme.variants[0].rounds;
  assert.equal(recruiter.focus, undefined);
  assert.deepEqual(bugSquash.focus, ['debug', 'algo', 'ui']);
  assert.deepEqual(payload.tasks['js-tag-low'].focus, ['js', 'algo']);
  assert.deepEqual(payload.tasks['js-sort-it'].focus, ['algo', 'js']);
  assert.deepEqual(payload.tasks['js-debug-race'].focus, ['debug', 'js']);
  assert.deepEqual(payload.tasks['react-debug-render'].focus, ['debug', 'ui']);
  // A merge request review is read for its bugs before it is fixed, and the plan counts the session its page runs.
  assert.deepEqual(payload.tasks['react-review-cart'].focus, ['debug', 'ui']);
  assert.equal(payload.tasks['react-review-cart'].minutes, 75);
  assert.equal(payload.tasks['react-debug-render'].minutes, 30);
  assert.deepEqual(payload.tasks['react-star-rating'].focus, ['ui']);
  assert.deepEqual(payload.tasks['css-grid'].focus, ['css', 'ui']);
  assert.deepEqual(build().tasks['concept-a'].focus, ['concepts', 'js']);
  assert.equal(payload.tasks['case-a'].focus, undefined);
});

test('a merge request review without a session length stops the generator', () => {
  const files = {
    ...baseCatalog,
    'react/coding.json': [
      ...baseCatalog['react/coding.json'],
      { id: 'react-review-gone', title: 'Review', companies: ['acme'], reviewModeAsset: 'assets/questions/review-modes/gone.v1.json' },
    ],
  };
  assert.throws(() => build(undefined, files), /react-review-gone: assets\/questions\/review-modes\/gone\.v1\.json gives no session length/);
});

test('a review sent ahead of the interview adds its own clock to the plan, as the page runs both', () => {
  const files = (review) => ({
    ...baseCatalog,
    'react/coding.json': [
      ...baseCatalog['react/coding.json'],
      { id: 'react-review-cart', title: 'Review a cart', companies: ['acme'], reviewModeAsset: 'assets/questions/review-modes/cart.v1.json' },
    ],
    'review-modes/cart.v1.json': review,
  });
  assert.equal(build(undefined, files({ sessionMinutes: 90, reviewMinutes: 60 })).tasks['react-review-cart'].minutes, 150);
  assert.throws(() => build(undefined, files({ sessionMinutes: 90, reviewMinutes: 'an hour' })), /gives no valid review length/);
});

test('a task with an author\'s estimate counts it, as its page and timed practice do', () => {
  const files = { ...baseCatalog, 'javascript/coding.json': [...baseCatalog['javascript/coding.json'], { id: 'js-estimated', title: 'Estimated', difficulty: 'intermediate', estimatedMinutes: 40, companies: ['acme'] }] };
  const tasks = build(undefined, files).tasks;
  assert.equal(tasks['js-estimated'].minutes, 40);
  assert.equal(tasks['js-new'].minutes, 45);
  assert.equal(tasks['js-old'].minutes, 15);
});

test('the summary counts what Premium opens from the catalog', () => {
  const counts = build({ formatPractice: { javascript: ['js-starter'], react: ['js-starter'] } }).general.premiumCounts;
  assert.deepEqual(counts, { javascript: 1, react: 1, systemDesign: 1 });
});

test('the general design cases are published for the design round a senior or staff person faces next', () => {
  const payload = build({ designPractice: ['case-a'] });
  assert.deepEqual(payload.general.designPractice, ['case-a']);
  assert.equal(payload.tasks['case-a'].kind, 'system-design');
  assert.equal(build().general.designPractice, undefined);
  assert.throws(() => build({ designPractice: ['missing-case'] }), /design practice case missing-case is not in the catalog/);
});

test('a job posting is marked as one', () => {
  const payload = build({}, {
    ...baseCatalog,
    'javascript/coding.json': [
      ...baseCatalog['javascript/coding.json'],
      { id: 'js-posted', title: 'Posted', companies: ['acme'], sources: [{ ...catalogSource('new', '2026-06', 'Built In'), label: 'Acme posting: Frontend Engineer, Built In, June 2026' }] },
    ],
  });
  const [engineers] = payload.companies.acme.variants;
  assert.equal(engineers.tasks.find((task) => task.id === 'js-posted').report.posting, true);
  assert.equal(engineers.tasks.find((task) => task.id === 'js-old')?.report?.posting, undefined);
});

test('a report whose month the process table marks as approximate keeps the mark', () => {
  const process = baseProcess();
  const approximate = {
    ...process,
    variants: process.variants.map((variant) => ({
      ...variant,
      stages: variant.stages.map((stage) => ({
        ...stage,
        sources: stage.sources.map((source) => (source.url === reportUrl('new') ? { ...source, label: 'Taro (approx.)' } : source)),
      })),
    })),
  };
  const [engineers] = build({ processes: { acme: approximate } }).companies.acme.variants;
  assert.equal(engineers.tasks.find((task) => task.id === 'js-new').report.approx, true);
  assert.equal(engineers.tasks.find((task) => task.id === 'js-old')?.report?.approx, undefined);
});

test('tasks carry real access and minutes, and a linked guide is a free 15-minute task', () => {
  const { tasks } = build();
  assert.equal(tasks['js-new'].access, 'premium');
  assert.equal(tasks['js-new'].minutes, 45);
  assert.equal(tasks['js-old'].access, 'free');
  assert.equal(tasks['js-old'].minutes, 15);
  assert.equal(tasks['js-linked'].minutes, 30);
  assert.equal(tasks['case-a'].minutes, 45);
  assert.equal(tasks['concept-a'].minutes, 10);
  assert.deepEqual(tasks['/guides/system-design-blueprint'], { id: '/guides/system-design-blueprint', title: 'Frontend system design blueprint', route: '/guides/system-design-blueprint', kind: 'guide', access: 'free', minutes: 15 });
});

test('concept questions stop at the largest budget and never leave the company framework', () => {
  const concepts = Array.from({ length: 20 }, (_, index) => ({ id: `concept-${index}`, title: `Concept ${index}`, companies: ['acme'] }));
  const payload = build({}, { ...baseCatalog, 'javascript/trivia.json': concepts });
  assert.equal(payload.companies.acme.variants[0].tasks.length, 12);
  const vue = build({ profiles: { acme: { framework: 'vue', evidence: 'Fixture.' } } }, { ...baseCatalog, 'react/coding.json': [], 'angular/coding.json': [], 'vue/coding.json': [{ id: 'vue-star-rating', title: 'Vue stars', companies: ['acme'] }] });
  assert.equal(vue.tasks['react-concept'], undefined);
  assert.ok(vue.tasks['concept-a']);
});

test('each list dates its own reports and ignores official pages', () => {
  const onlyOfficial = baseProcess();
  onlyOfficial.variants = [{ title: 'Engineers', stages: [onlyOfficial.variants[0].stages[0]] }];
  const company = build({
    processes: { acme: onlyOfficial },
    rounds: { acme: { variants: [{ ...baseRounds().variants[0], rounds: [baseRounds().variants[0].rounds[0]] }] } },
  }, { 'javascript/coding.json': [{ id: 'js-starter', title: 'Starter' }] }).companies.acme;
  assert.equal(company.variants[0].newestReport, undefined);
  const [engineers, interns] = build().companies.acme.variants;
  assert.equal(engineers.newestReport, '2026-04');
  assert.equal(interns.newestReport, '2020-01');
});

test('broken joins fail with a message that names the problem', () => {
  const brokenLink = baseProcess();
  brokenLink.variants[0].stages[1].practice = { label: 'Gone', path: '/javascript/coding/js-gone' };
  assert.throws(() => build({ processes: { acme: brokenLink } }), /links \/javascript\/coding\/js-gone/);

  const renamedStage = baseProcess();
  renamedStage.variants[0].stages[0].stage = 'Renamed';
  assert.throws(() => build({ processes: { acme: renamedStage } }), /no plan data for the stage "Renamed"/);

  const renamedList = baseProcess();
  renamedList.variants[0].title = 'Renamed';
  assert.throws(() => build({ processes: { acme: renamedList } }), /no plan data for the list "Renamed"/);

  assert.throws(() => build({ starters: ['js-gone'] }), /general task js-gone/);

  const wrongFramework = baseProcess();
  wrongFramework.variants[0].stages[1].practice = { label: 'Explorer', path: '/react/coding/react-file-explorer' };
  assert.throws(() => build({ processes: { acme: wrongFramework }, profiles: { acme: { framework: 'vue', evidence: 'Fixture.' } } }), /outside its framework/);
});

test('the real data joins cleanly, ships no source link and never repeats a family in a list', () => {
  const payload = buildCompanyPlanData(path.join(repoRoot, 'cdn'), realSources);
  const text = renderCompanyPlanData(payload);
  assert.doesNotMatch(text, /https?:/);
  assert.deepEqual(Object.keys(payload.companies).sort(), Object.keys(realSources.processes).sort());

  for (const id of [...payload.general.starters, ...Object.values(payload.general.formatPractice).flat(), ...Object.values(payload.general.guides)]) {
    assert.ok(payload.tasks[id], id);
  }

  for (const [slug, company] of Object.entries(payload.companies)) {
    const expected = company.framework === 'javascript' ? 'react' : company.framework;
    company.variants.forEach((variant, index) => {
      const stages = realSources.processes[slug].variants[index].stages;
      assert.deepEqual(variant.rounds.map((round) => round.name), stages.map((stage) => stage.stage), `${slug}/${variant.id}`);
      const roundIds = new Set(variant.rounds.map((round) => round.id));
      const families = new Set();
      assert.ok(variant.tasks.length > 0, `${slug}/${variant.id} has no tasks`);
      for (const row of variant.tasks) {
        const task = payload.tasks[row.id];
        assert.ok(task, `${slug}: ${row.id} is not in the task table`);
        for (const round of row.rounds ?? []) assert.ok(roundIds.has(round), `${slug}/${variant.id}: ${row.id} binds to ${round}`);
        if (['react', 'angular', 'vue'].includes(task.tech)) assert.equal(task.tech, expected, `${slug}: ${row.id}`);
        if (task.family) {
          assert.ok(!families.has(task.family), `${slug}/${variant.id} repeats ${task.family}`);
          families.add(task.family);
        }
        if (row.report) assert.match(row.report.date, /^\d{4}-\d{2}$/);
      }
    });
  }
});

test('rendering the same input twice gives the same bytes', () => {
  const dir = fixture(baseCatalog);
  assert.equal(renderCompanyPlanData(buildCompanyPlanData(dir, sources())), renderCompanyPlanData(buildCompanyPlanData(dir, sources())));
});

const rehearsalDefinition = {
  id: 'acme-coding',
  access: 'premium',
  company: 'acme',
  title: 'Acme coding round',
  round: 'coding',
  summary: 'Two problems.',
  minutes: 40,
  order: 'sequential',
  items: [{ path: '/javascript/coding/js-linked', title: 'Linked' }, { path: '/javascript/coding/js-old', title: 'Old' }],
};
const withRehearsal = (patch = {}) => ({ ...baseCatalog, 'rehearsals/rehearsals.v1.json': { schemaVersion: 1, rehearsals: [{ ...rehearsalDefinition, ...patch }] } });

test('a timed rehearsal is one Premium task on its round, standing for its problems, after the list\'s own rows', () => {
  const data = build({}, withRehearsal());
  assert.deepEqual(data.tasks['rehearsal-acme-coding'], {
    id: 'rehearsal-acme-coding',
    title: 'Rehearse the Acme coding round',
    route: '/javascript/coding/js-linked',
    kind: 'rehearsal',
    access: 'premium',
    minutes: 40,
    members: ['js-linked', 'js-old'],
  });
  // Both lists hold a coding round, so both carry the rehearsal there, as one more row: the concept questions the
  // list counts toward the largest plan stay as they were.
  const plain = build().companies.acme.variants;
  data.companies.acme.variants.forEach((list, index) => {
    assert.deepEqual(list.tasks.at(-1), { id: 'rehearsal-acme-coding', rounds: ['coding'] });
    assert.deepEqual(list.tasks.slice(0, -1), plain[index].tasks);
  });
});

test('a rehearsal on a company, round or problem the plan cannot place stops the generator', () => {
  assert.throws(() => build({}, withRehearsal({ company: 'globex' })), /names globex, which has no company plan/);
  assert.throws(() => build({}, withRehearsal({ round: 'onsite' })), /names the round onsite, which no acme list has/);
  assert.throws(
    () => build({}, withRehearsal({ items: [rehearsalDefinition.items[0], { path: '/javascript/coding/js-missing', title: 'Missing' }] })),
    /holds \/javascript\/coding\/js-missing, which is not in the catalog/,
  );
});
