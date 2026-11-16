#!/usr/bin/env node
/**
 * Two checks for company guide copy, run after writing a guide (report only, not part of the lint chain):
 *
 *   bait     A locked reported question must not be readable anywhere else on the guide. Reads each guide as a visitor
 *            gets it from a running server and lists the word pairs of a locked question that also appear in the page's
 *            open text (the question list and every Premium-locked part left out).
 *   repeats  Hand-written prose must not be one template across guides. Lists every run of 8 words that appears in the
 *            prose of 3 or more companies: content modules, process tables, reported questions and editorial notes.
 *
 * Usage: node scripts/audit-company-guides.mjs bait --base http://127.0.0.1:4310 [slug ...]
 *        node scripts/audit-company-guides.mjs repeats [--min-words 8] [--min-companies 3]
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { loadTsModule } from './load-ts-module.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const previewsRoot = path.resolve(here, '../src/app/shared/company-previews');
const QUESTION_LISTS = path.resolve(here, '../../cdn/questions/company-question-lists.json');

// Words too common in interview copy to make a pair distinctive.
const COMMON = new Set(`a an and or of in on with to for from by at as is are was were be been it its that this these those which
while into than then there their they them you your one two three four five first second last other another each every some
most more less about after before over under during within without not no yes can could would should will may might must
account accounts round rounds question questions candidate candidates interview interviews interviewer task tasks live timed
assessment problem problems small given check whether find return using use used build write make work working report
reported reports react component components app javascript typescript frontend front-end code coding engineer engineers
loop loops time minutes hour stage stages the what how when why who same say says like start started ran run runs
then also just only through talk fix front end page improve open html css test tests asked asks ask role team`.split(/\s+/));

const words = (text) => String(text).toLowerCase().replace(/[“”"'’()]/g, ' ').match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
const content = (text) => words(text).filter((word) => !COMMON.has(word) && word.length > 2);

/** The distinctive pairs of a text: neighbouring content words. */
export function wordPairs(text) {
  const kept = content(text);
  return new Set(kept.slice(1).map((word, index) => `${kept[index]} ${word}`));
}

/** Pairs of a locked question that the open text also holds. */
export function baitPairs(question, openText) {
  const open = wordPairs(openText);
  return [...wordPairs(question)].filter((pair) => open.has(pair));
}

const attrsOf = (node) => Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'svg']);

/** A guide's text as a visitor reads it, without the question list and without anything under a Premium lock. */
export function openText(html) {
  const parts = [];
  const visit = (node) => {
    if (SKIP_TAGS.has(node.tagName)) return;
    const attrs = attrsOf(node);
    const classes = (attrs.class ?? '').split(/\s+/);
    if (classes.includes('premium-locked') || attrs['data-testid'] === 'company-question-list') return;
    if (node.nodeName === '#text') parts.push(node.value);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parse(html));
  return parts.join(' ').replace(/\s+/g, ' ');
}

/**
 * A guide as a visitor's browser renders it: the dev server sends an empty shell, so the page is rendered in Chromium
 * with every API call answered as for a signed-out visitor.
 */
async function renderedPages(base, slugs) {
  const { chromium } = createRequire(import.meta.url)('@playwright/test');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.route((url) => url.pathname.startsWith('/api/'), (route) =>
    route.fulfill({ status: route.request().url().includes('/auth/me') ? 401 : 200, contentType: 'application/json', body: '{}' }));
  const pages = new Map();
  try {
    for (const slug of slugs) {
      const page = await context.newPage();
      await page.goto(`${base.replace(/\/+$/, '')}/companies/${slug}/preview`, { waitUntil: 'load' });
      // A guide whose list never renders would pass every check, so its absence is an error, not a pass.
      await page.locator('[data-testid="company-question-list"]').waitFor({ timeout: 20000 });
      pages.set(slug, await page.content());
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return pages;
}

async function bait(base, slugs) {
  const lists = JSON.parse(fs.readFileSync(QUESTION_LISTS, 'utf8')).companies;
  const { COMPANY_INTERVIEW_PROCESSES } = loadTsModule(path.join(previewsRoot, 'company-interview-processes.ts'));
  const chosen = slugs.length ? slugs : Object.keys(lists);
  const pages = await renderedPages(base, chosen);
  let findings = 0;
  for (const slug of chosen) {
    const process = COMPANY_INTERVIEW_PROCESSES[slug];
    const html = pages.get(slug);
    const text = openText(html);
    const locked = (process?.questions ?? []).slice(1);
    for (const question of locked) {
      const pairs = baitPairs(question.question, text);
      if (pairs.length) {
        findings += 1;
        console.log(`${slug} · ${question.id}: ${pairs.join(', ')}`);
        // Where the open text says it, so a reader can judge a shared topic from a leak.
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          if (pairs.some((pair) => wordPairs(sentence).has(pair))) console.log(`    open: ${sentence.trim().slice(0, 220)}`);
        }
      }
    }
    console.log(`[bait] ${slug}: ${locked.length} locked questions checked`);
  }
  console.log(`[bait] ${findings} locked question(s) with word pairs in the open text; read each one, a shared topic word pair can be fine.`);
}

/** Every string in a value, with the path it sits at. */
function strings(value, at = '') {
  if (typeof value === 'string') return [[at, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${at}[${index}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => strings(item, at ? `${at}.${key}` : key));
  return [];
}

// Fields that are labels, ids, links or dates rather than prose.
const NOT_PROSE = /(^|\.)(id|slug|url|path|fragment|route|date|kind|canonicalPath|src|label|buttonLabel|kicker|day|role|location|outcome|reportForm|checkedAt|stage|appliesTo|resourcePath)$/;

/** The hand-written prose of every company guide, as [company, field, text]. */
export function companyProse(root = previewsRoot) {
  const cache = new Map();
  const rows = [];
  for (const file of fs.readdirSync(root).filter((name) => name.endsWith('-preview-content.ts'))) {
    const preview = Object.values(loadTsModule(path.join(root, file), cache)).find((value) => value?.slug && value?.prompts);
    if (preview) for (const [field, text] of strings(preview)) rows.push([preview.slug, `content.${field}`, text]);
  }
  const { COMPANY_INTERVIEW_PROCESSES } = loadTsModule(path.join(root, 'company-interview-processes.ts'), cache);
  for (const [slug, process] of Object.entries(COMPANY_INTERVIEW_PROCESSES)) {
    for (const [field, text] of strings({ summary: process.summary, caveat: process.caveat, variants: process.variants, questions: process.questions })) {
      if (!/\.sources\[/.test(field)) rows.push([slug, `process.${field}`, text]);
    }
  }
  const { COMPANY_EDITORIAL_NOTES } = loadTsModule(path.join(root, 'company-editorial-notes.ts'), cache);
  for (const [slug, notes] of Object.entries(COMPANY_EDITORIAL_NOTES)) {
    for (const [field, text] of strings(notes)) rows.push([slug, `notes.${field}`, text]);
  }
  return rows.filter(([, field, text]) => !NOT_PROSE.test(field) && text.split(/\s+/).length >= 6);
}

/** Runs of `size` words shared by `minCompanies` or more companies, with where they occur. */
export function repeatedRuns(rows, { size = 8, minCompanies = 3 } = {}) {
  const runs = new Map();
  for (const [company, field, text] of rows) {
    const list = words(text);
    for (let index = 0; index + size <= list.length; index += 1) {
      const run = list.slice(index, index + size).join(' ');
      const entry = runs.get(run) ?? new Map();
      if (!entry.has(company)) entry.set(company, field);
      runs.set(run, entry);
    }
  }
  return [...runs].filter(([, companies]) => companies.size >= minCompanies)
    .map(([run, companies]) => ({ run, companies: [...companies].map(([company, field]) => `${company} (${field})`) }))
    .sort((a, b) => b.companies.length - a.companies.length || a.run.localeCompare(b.run));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [mode, ...rest] = process.argv.slice(2);
  const option = (name, fallback) => {
    const index = rest.indexOf(`--${name}`);
    return index >= 0 ? rest.splice(index, 2)[1] : fallback;
  };
  if (mode === 'bait') {
    const base = option('base', 'http://127.0.0.1:4310');
    await bait(base, rest);
  } else if (mode === 'repeats') {
    const size = Number(option('min-words', 8));
    const minCompanies = Number(option('min-companies', 3));
    const found = repeatedRuns(companyProse(), { size, minCompanies });
    for (const { run, companies } of found) console.log(`${companies.length}× "${run}"\n    ${companies.join('\n    ')}`);
    console.log(`[repeats] ${found.length} run(s) of ${size} words in ${minCompanies}+ companies.`);
  } else {
    console.error('Usage: audit-company-guides.mjs bait --base <url> [slug ...] | repeats [--min-words 8] [--min-companies 3]');
    process.exit(1);
  }
}
