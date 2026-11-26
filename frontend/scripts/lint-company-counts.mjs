#!/usr/bin/env node
/**
 * Every number an authored company guide states about its evidence comes from one place. The page counts its sources
 * once (src/app/shared/company-previews/company-evidence.ts) and the authored text writes a total as a token:
 * "{reports} public accounts" renders as "twelve public accounts". This lint fails when a guide:
 *   - writes a total by hand ("nine public accounts", "six self-reported loops", "two official pages"),
 *   - names a prompt count that is not the number of prompts on the page ("5 practice prompts" with six prompts),
 *   - names a sub-count larger than the page's evidence ("twenty of the accounts" with ten),
 *   - carries a token the page cannot fill,
 *   - models a prompt on a report the page's sources do not list, or
 *   - names no source by its process (`sourceDisplay: 'year'`) yet lists sources, lacks a method note, models a prompt
 *     on a named report or names a source's site in its text; a guide that lists sources carries no method note.
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
const NOUN = '(?:accounts?|reports?|sources?|loops?|candidates?|prompts|pages|questions)';
const CLAIM = new RegExp(`\\b(${NUMBER})\\s+((?:[A-Za-z][a-z-]*\\s+){0,3}?)(${NOUN})\\b`, 'gi');
/** A number followed by one of these is a statement about the whole evidence base, so it must be a token. */
const TOTAL_QUALIFIERS = new Set(['public', 'self-reported', 'frontend-titled', 'frontend-focused']);
const PAGE_QUALIFIERS = new Set(['official', 'public']);
const TOKEN = /\{#?[a-z]+\}/g;
/** Prompts a visitor reads in full on an authored guide; the rest keep their answer guides for Premium (company-preview.component.ts). */
const OPEN_PROMPTS = 3;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every string an authored guide renders, by its path in the content module. */
function authoredStrings(value, field = '') {
  if (typeof value === 'string') return [{ field, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => authoredStrings(item, `${field}[${index}]`));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, item]) => authoredStrings(item, field ? `${field}.${key}` : key));
}

/** The process text a guide renders: summary, caveat, stages and questions, never the sources themselves. */
function processStrings(process) {
  const strings = [{ field: 'process.summary', text: process.summary }, { field: 'process.caveat', text: process.caveat }];
  if (process.title) strings.push({ field: 'process.title', text: process.title });
  process.variants.forEach((variant, v) => {
    strings.push({ field: `process.variants[${v}].title`, text: variant.title });
    if (variant.note) strings.push({ field: `process.variants[${v}].note`, text: variant.note });
    variant.stages.forEach((stage, i) => {
      for (const key of ['stage', 'format', 'appliesTo']) strings.push({ field: `process.variants[${v}].stages[${i}].${key}`, text: stage[key] });
    });
  });
  for (const question of process.questions ?? []) {
    strings.push({ field: `process.questions.${question.id}.topic`, text: question.topic }, { field: `process.questions.${question.id}.question`, text: question.question });
  }
  for (const question of process.behaviouralQuestions ?? []) strings.push({ field: `process.behaviouralQuestions.${question.id}`, text: question.question });
  return strings;
}

/**
 * How a page could name a process's report sources: each site's host ("jointaro.com") and each label word that the
 * host spells ("Taro", "FrontendLead", "Blind"), the word matched whole and in its own capitals.
 */
export function sourceNames(process) {
  const all = [
    ...process.variants.flatMap((variant) => variant.stages.flatMap((stage) => stage.sources)),
    ...(process.questions ?? []).flatMap((question) => question.sources),
    ...(process.behaviouralQuestions ?? []).flatMap((question) => question.sources),
  ].filter((source) => source.kind === 'report');
  const names = new Map();
  for (const source of all) {
    let host = '';
    try { host = new URL(source.url).hostname.replace(/^www\./, ''); } catch { continue; }
    names.set(host, new RegExp(escapeRegExp(host), 'i'));
    const brand = host.split('.').slice(0, -1).join('.').toLowerCase();
    for (const word of source.label.match(/[A-Za-z0-9]{3,}/g) ?? []) {
      if (brand.includes(word.toLowerCase())) names.set(word, new RegExp(`\\b${escapeRegExp(word)}\\b`));
    }
  }
  return names;
}

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
    for (const token of filled.match(TOKEN) ?? []) errors.push(`[${field}] unknown count token ${token}; use {reports}, {official}, {sources}, {prompts} or {questions}, with # for digits`);
    for (const claim of countClaims(text)) {
      const { phrase, value, noun, adjectives } = claim;
      if (noun === 'prompts') {
        if (value !== counts.prompts) errors.push(`[${field}] says "${phrase}" but the page has ${counts.prompts} prompts`);
        continue;
      }
      // "19 reported questions" is the list's total, so it is a token; "two algorithm questions" describes one loop.
      if (noun === 'questions') {
        if (adjectives[0] === 'reported') errors.push(`[${field}] write {questions} instead of "${phrase}": the list has ${counts.questions}`);
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

  // The page counts a source once by its exact URL, so one post written in two letter cases, or with and without a
  // trailing slash, would be listed and counted twice.
  const spellings = new Map();
  for (const { url } of sources) {
    const key = url.toLowerCase().replace(/\/+$/, '');
    const other = spellings.get(key);
    if (other) errors.push(`[sources] ${other} and ${url} are one page spelled two ways; use one URL in the guide and the process table`);
    else spellings.set(key, url);
  }

  const urls = new Set(sources.map((source) => source.url));
  for (const prompt of preview.prompts.items) {
    const url = prompt.reportedRound?.url;
    if (url && !urls.has(url)) errors.push(`[prompts.items.${prompt.id}] modelled on ${url}, which the sources do not list`);
  }

  // A guide whose process names no source ends with a method note instead of a sources list, and its text names no
  // source either: not a site, not a host, not a report a prompt is modelled on.
  if (process?.sourceDisplay === 'year') {
    if (preview.sources) errors.push('[sources] the process names no source (sourceDisplay: \'year\'), so the guide ends with a methodNote, not a sources list');
    if (!preview.methodNote?.paragraphs?.length) errors.push('[methodNote] a guide that names no source says how its questions were collected');
    for (const prompt of preview.prompts.items) {
      if (prompt.reportedRound) errors.push(`[prompts.items.${prompt.id}] a guide that names no source models no prompt on a named report`);
    }
    const names = sourceNames(process);
    for (const { field, text } of [...authoredStrings(preview), ...processStrings(process)]) {
      for (const [name, pattern] of names) if (pattern.test(text)) errors.push(`[${field}] names the source ${name} on a guide that names none`);
    }
  } else if (preview.methodNote) {
    errors.push('[methodNote] only a guide whose process names no source (sourceDisplay: \'year\') carries a method note');
  } else if (!preview.sources) {
    errors.push('[sources] a guide lists its sources unless its process names none (sourceDisplay: \'year\')');
  }

  // A round decoder's "Rehearse…" call must land on something a visitor can open: one of the open prompts or a page,
  // never a prompt whose answer guide sits under the blur.
  for (const spotlight of preview.roundSpotlights ?? []) {
    const fragment = spotlight.practiceLink?.fragment;
    if (!fragment) continue;
    const index = preview.prompts.items.findIndex((prompt) => prompt.id === fragment);
    if (index < 0) errors.push(`[roundSpotlights.${spotlight.id}] practice link points at #${fragment}, which is not a prompt`);
    else if (index >= OPEN_PROMPTS) errors.push(`[roundSpotlights.${spotlight.id}] practice link leads to prompt ${index + 1}, which a visitor cannot open; link an open prompt or a free page`);
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
    console.error(`[lint-company-counts] ${failures.length} problem(s) in ${guides} guides. Totals are tokens ({reports}, {official}, {sources}, {prompts}, {questions}); prompt counts must match the page.`);
    process.exit(1);
  }
  console.log(`[lint-company-counts] ${guides} guides state their counts from the page's evidence.`);
}
