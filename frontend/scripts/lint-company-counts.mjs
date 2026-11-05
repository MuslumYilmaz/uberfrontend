#!/usr/bin/env node
/**
 * Every number an authored company guide states about its evidence comes from one place. The page counts its sources
 * once (src/app/shared/company-previews/company-evidence.ts) and the authored text writes a total as a token:
 * "{reports} public accounts" renders as "twelve public accounts". This lint fails when a guide:
 *   - writes a total by hand ("nine public accounts", "six self-reported loops", "two official pages"),
 *   - names a prompt count that is not the number of prompts on the page ("5 practice prompts" with six prompts),
 *   - names a sub-count larger than the page's evidence ("twenty of the accounts" with ten),
 *   - carries a token the page cannot fill, or
 *   - models a prompt on a report the page's sources do not list.
 * Usage: node scripts/lint-company-counts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadTsModule } from './load-ts-module.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SHARED_ROOT = path.resolve(here, '../src/app/shared/company-previews');
export const EVIDENCE_MODULE = path.resolve(here, '../src/app/features/company/company-preview/company-evidence.ts');

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50 };
const NUMBER = `(?:(?:twenty|thirty|forty|fifty)(?:-(?:one|two|three|four|five|six|seven|eight|nine))?|${WORDS.join('|')}|[0-9]{1,3})`;
const NOUN = '(?:accounts?|reports?|sources?|loops?|candidates?|prompts|pages)';
const CLAIM = new RegExp(`\\b(${NUMBER})\\s+((?:[A-Za-z][a-z-]*\\s+){0,3}?)(${NOUN})\\b`, 'gi');
/** A number followed by one of these is a statement about the whole evidence base, so it must be a token. */
const TOTAL_QUALIFIERS = new Set(['public', 'self-reported', 'frontend-titled', 'frontend-focused']);
const PAGE_QUALIFIERS = new Set(['official', 'public']);
const TOKEN = /\{#?[a-z]+\}/g;

export function toNumber(word) {
  const lower = word.toLowerCase();
  if (/^[0-9]+$/.test(lower)) return Number(lower);
  if (lower.includes('-')) {
    const [tens, ones] = lower.split('-');
    return TENS[tens] + WORDS.indexOf(ones);
  }
  return TENS[lower] ?? WORDS.indexOf(lower);
}

/**
 * Number phrases about evidence in a text: "nine public accounts", "four of the accounts" is not one (no noun within
 * three words), "2024 account" is not one (a year), and "Capital One careers pages" is not one (a capitalised number
 * word inside a sentence is a name).
 */
export function countClaims(text) {
  const claims = [];
  for (const match of text.matchAll(CLAIM)) {
    const [phrase, number, between, noun] = match;
    const before = text.slice(0, match.index).trimEnd();
    const sentenceStart = before === '' || /[.!?:;(]$/.test(before) || /["“]$/.test(before);
    if (/^[A-Z]/.test(number) && !/^[0-9]/.test(number) && !sentenceStart) continue;
    if (/^[0-9]{4}$/.test(number)) continue;
    const adjectives = between.trim().split(/\s+/).filter(Boolean).map((word) => word.toLowerCase());
    claims.push({ phrase, value: toNumber(number), noun: noun.toLowerCase(), adjectives });
  }
  return claims;
}

/** Errors for one guide, as "[field] message" strings; empty when the guide's numbers all come from the page. */
export function checkGuide(preview, process, evidenceModule) {
  const { companyEvidence, fillCompanyCounts, authoredCountFields } = evidenceModule;
  const { counts, sources } = companyEvidence(preview, process);
  const errors = [];
  const limitFor = (noun) => (noun.startsWith('source') ? counts.sources : counts.reports);
  const tokenFor = (noun) => (noun.startsWith('source') ? '{sources}' : '{reports}');

  for (const { field, text } of authoredCountFields(preview)) {
    const filled = fillCompanyCounts(text, counts);
    for (const token of filled.match(TOKEN) ?? []) errors.push(`[${field}] unknown count token ${token}; use {reports}, {official}, {sources} or {prompts}, with # for digits`);
    for (const claim of countClaims(text)) {
      const { phrase, value, noun, adjectives } = claim;
      if (noun === 'prompts') {
        if (value !== counts.prompts) errors.push(`[${field}] says "${phrase}" but the page has ${counts.prompts} prompts`);
        continue;
      }
      if (noun === 'pages') {
        if (PAGE_QUALIFIERS.has(adjectives[0])) errors.push(`[${field}] write {official} instead of "${phrase}": the page counts ${counts.official}`);
        continue;
      }
      if (TOTAL_QUALIFIERS.has(adjectives[0])) {
        errors.push(`[${field}] write ${tokenFor(noun)} instead of "${phrase}": the page counts ${limitFor(noun)}`);
      } else if (value > limitFor(noun)) {
        errors.push(`[${field}] "${phrase}" counts more than the page has (${limitFor(noun)})`);
      }
    }
  }

  const urls = new Set(sources.map((source) => source.url));
  for (const prompt of preview.prompts.items) {
    const url = prompt.reportedRound?.url;
    if (url && !urls.has(url)) errors.push(`[prompts.items.${prompt.id}] modelled on ${url}, which the sources do not list`);
  }
  return errors;
}

export function lintCompanyCounts(sharedRoot = SHARED_ROOT) {
  const cache = new Map();
  const evidenceModule = loadTsModule(EVIDENCE_MODULE, cache);
  const processes = Object.values(loadTsModule(path.join(sharedRoot, 'company-interview-processes.ts'), cache))
    .find((value) => value && typeof value === 'object' && Object.values(value).some((entry) => Array.isArray(entry?.variants))) ?? {};
  const failures = [];
  let guides = 0;
  for (const file of fs.readdirSync(sharedRoot).filter((name) => name.endsWith('-preview-content.ts')).sort()) {
    const preview = Object.values(loadTsModule(path.join(sharedRoot, file), cache))
      .find((value) => value && typeof value === 'object' && Array.isArray(value.prompts?.items));
    if (!preview) continue;
    guides += 1;
    for (const error of checkGuide(preview, processes[preview.slug] ?? null, evidenceModule)) failures.push(`${file} ${error}`);
  }
  return { guides, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { guides, failures } = lintCompanyCounts();
  for (const failure of failures) console.error(`[lint-company-counts] ${failure}`);
  if (failures.length) {
    console.error(`[lint-company-counts] ${failures.length} problem(s) in ${guides} guides. Totals are tokens ({reports}, {official}, {sources}, {prompts}); prompt counts must match the page.`);
    process.exit(1);
  }
  console.log(`[lint-company-counts] ${guides} guides state their counts from the page's evidence.`);
}
