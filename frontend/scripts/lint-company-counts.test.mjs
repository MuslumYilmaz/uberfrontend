import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTsModule } from './load-ts-module.mjs';
import { EVIDENCE_MODULE, checkGuide, countClaims, lintCompanyCounts, toNumber } from './lint-company-counts.mjs';

const evidence = loadTsModule(EVIDENCE_MODULE);

const source = (url, kind = 'report') => ({ label: url, url, note: 'A note.', kind });
const guide = (overrides = {}) => ({
  slug: 'acme',
  title: 'Acme Frontend Interview Questions: 2 Prompts',
  description: 'Prepare with 2 practice prompts.',
  trustNote: 'Practice versions, not leaked questions.',
  hero: { kicker: 'Guide', subtitle: 'Prepare with two practice prompts shaped by {reports} public accounts.', caveat: 'Thin evidence.', chips: ['2 practice prompts'] },
  studyPriorities: { kicker: 'k', title: 't', paragraphs: ['Two of the accounts describe a tree filter.'] },
  sourceBoundary: { kicker: 'k', title: 't', paragraphs: ['{reports} self-reported accounts inform this guide, two of them described here.'] },
  prompts: { kicker: 'k', title: 't', intro: 'Intro.', itemListName: 'n', items: [{ id: 'a', reportedRound: { label: 'r', url: 'https://r.example/1' } }, { id: 'b' }] },
  sources: { kicker: 'k', title: 't', intro: 'Intro.', items: [source('https://r.example/1'), source('https://r.example/2'), source('https://acme.example/careers', 'official')] },
  ...overrides,
});
const table = {
  summary: '', caveat: '', checkedAt: '2026-10-20',
  variants: [{ title: 'Engineers', stages: [
    { stage: 'Phone screen', format: '', appliesTo: '', sources: [{ label: 'LeetCode', url: 'https://r.example/3', kind: 'report', date: '2025-03' }, { label: 'LeetCode', url: 'https://r.example/1', kind: 'report', date: '2024-01' }] },
    { stage: 'Onsite', format: '', appliesTo: '', sources: [{ label: 'LeetCode', url: 'https://r.example/3', kind: 'report', date: '2025-03' }] },
  ] }],
};

test('reads number words, digits and compounds', () => {
  assert.equal(toNumber('nine'), 9);
  assert.equal(toNumber('Twenty-three'), 23);
  assert.equal(toNumber('12'), 12);
});

test('finds evidence claims and skips years, names and sub-counts without a noun', () => {
  const claims = countClaims('Nine public accounts from 2021 inform this guide; four of the nine are on Taro, a 2024 account and Capital One careers pages add context. Two public pages anchor it.');
  assert.deepEqual(claims.map((claim) => claim.phrase), ['Nine public accounts', 'Two public pages']);
  assert.deepEqual(claims[0], { phrase: 'Nine public accounts', value: 9, noun: 'accounts', adjectives: ['public'] });
});

test('a guide whose totals are tokens and whose sub-counts fit passes, with the table sources counted', () => {
  assert.deepEqual(checkGuide(guide(), table, evidence), []);
  const { counts, sources } = evidence.companyEvidence(guide(), table);
  assert.deepEqual(counts, { reports: 3, official: 1, sources: 4, prompts: 2, questions: 0 });
  assert.equal(sources[3].label, 'LeetCode account, March 2025');
  assert.match(sources[3].note, /Phone screen and Onsite/);
});

test('flags hand-written totals, wrong prompt counts, impossible sub-counts, unknown tokens and unlisted reports', () => {
  const errors = checkGuide(guide({
    description: 'Prepare with 5 practice prompts and 19 reported questions.',
    hero: { kicker: 'Guide', subtitle: 'Shaped by nine public accounts and two official pages.', caveat: 'Thin.', chips: ['{#prompt}'] },
    sourceBoundary: { kicker: 'k', title: 't', paragraphs: ['Six self-reported loops inform this guide; twelve accounts are on Taro.'] },
    prompts: { kicker: 'k', title: 't', intro: 'Intro.', itemListName: 'n', items: [{ id: 'a', reportedRound: { label: 'r', url: 'https://r.example/9' } }, { id: 'b' }] },
  }), table, evidence);
  assert.deepEqual(errors, [
    '[description] says "5 practice prompts" but the page has 2 prompts',
    '[description] write {questions} instead of "19 reported questions": the list has 0',
    '[hero.subtitle] write {reports} instead of "nine public accounts": the page counts 3',
    '[hero.subtitle] write {official} instead of "two official pages": the page counts 1',
    '[hero.chips[0]] unknown count token {#prompt}; use {reports}, {official}, {sources}, {prompts} or {questions}, with # for digits',
    '[sourceBoundary.paragraphs[0]] write {reports} instead of "Six self-reported loops": the page counts 3',
    '[sourceBoundary.paragraphs[0]] "twelve accounts" counts more than the page has (3)',
    '[prompts.items.a] modelled on https://r.example/9, which the sources do not list',
  ]);
});

test('flags one source spelled two ways across the guide and the table, which the page would count twice', () => {
  const spelled = { ...table, variants: [{ title: 'Engineers', stages: [
    { stage: 'Onsite', format: '', appliesTo: '', sources: [{ label: 'Blind', url: 'https://R.example/2/', kind: 'report', date: '2022-04' }] },
  ] }] };
  assert.deepEqual(checkGuide(guide(), spelled, evidence).filter((error) => error.startsWith('[sources]')), [
    '[sources] https://r.example/2 and https://R.example/2/ are one page spelled two ways; use one URL in the guide and the process table',
  ]);
});

test('a round decoder may rehearse on an open prompt or a page, never on a locked prompt', () => {
  const spotlights = (fragment) => [{ id: 'screen', kicker: 'k', title: 't', lede: [], facts: [], practiceLink: { label: 'Rehearse it', fragment } }];
  const open = guide({ prompts: { kicker: 'k', title: 't', intro: 'Intro.', itemListName: 'n', items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] }, roundSpotlights: spotlights('c') });
  assert.deepEqual(checkGuide(open, null, evidence).filter((error) => error.includes('roundSpotlights')), []);
  const locked = guide({ prompts: open.prompts, roundSpotlights: spotlights('d') });
  assert.deepEqual(checkGuide(locked, null, evidence).filter((error) => error.includes('roundSpotlights')), [
    '[roundSpotlights.screen] practice link leads to prompt 4, which a visitor cannot open; link an open prompt or a free page',
  ]);
  const missing = guide({ prompts: open.prompts, roundSpotlights: spotlights('zzz') });
  assert.deepEqual(checkGuide(missing, null, evidence).filter((error) => error.includes('roundSpotlights')), [
    '[roundSpotlights.screen] practice link points at #zzz, which is not a prompt',
  ]);
  const page = guide({ prompts: open.prompts, roundSpotlights: [{ ...spotlights('d')[0], practiceLink: { label: 'Rehearse it', path: '/javascript/trivia/js-closures' } }] });
  assert.deepEqual(checkGuide(page, null, evidence).filter((error) => error.includes('roundSpotlights')), []);
});

test('every authored guide states its counts from the page', () => {
  const { guides, failures } = lintCompanyCounts();
  assert.ok(guides >= 17, `expected the authored guides, found ${guides}`);
  assert.deepEqual(failures, []);
});
