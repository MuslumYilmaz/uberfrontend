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
  assert.deepEqual(counts, { reports: 3, official: 1, sources: 4, prompts: 2 });
  assert.equal(sources[3].label, 'LeetCode account, March 2025');
  assert.match(sources[3].note, /Phone screen and Onsite/);
});

test('flags hand-written totals, wrong prompt counts, impossible sub-counts, unknown tokens and unlisted reports', () => {
  const errors = checkGuide(guide({
    description: 'Prepare with 5 practice prompts.',
    hero: { kicker: 'Guide', subtitle: 'Shaped by nine public accounts and two official pages.', caveat: 'Thin.', chips: ['{#prompt}'] },
    sourceBoundary: { kicker: 'k', title: 't', paragraphs: ['Six self-reported loops inform this guide; twelve accounts are on Taro.'] },
    prompts: { kicker: 'k', title: 't', intro: 'Intro.', itemListName: 'n', items: [{ id: 'a', reportedRound: { label: 'r', url: 'https://r.example/9' } }, { id: 'b' }] },
  }), table, evidence);
  assert.deepEqual(errors, [
    '[description] says "5 practice prompts" but the page has 2 prompts',
    '[hero.subtitle] write {reports} instead of "nine public accounts": the page counts 3',
    '[hero.subtitle] write {official} instead of "two official pages": the page counts 1',
    '[hero.chips[0]] unknown count token {#prompt}; use {reports}, {official}, {sources} or {prompts}, with # for digits',
    '[sourceBoundary.paragraphs[0]] write {reports} instead of "Six self-reported loops": the page counts 3',
    '[sourceBoundary.paragraphs[0]] "twelve accounts" counts more than the page has (3)',
    '[prompts.items.a] modelled on https://r.example/9, which the sources do not list',
  ]);
});

test('every authored guide states its counts from the page', () => {
  const { guides, failures } = lintCompanyCounts();
  assert.ok(guides >= 17, `expected the authored guides, found ${guides}`);
  assert.deepEqual(failures, []);
});
