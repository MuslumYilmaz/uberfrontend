#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const STRICT_H1 = process.env.STRICT_H1 === '1';

function toRoute(filePath) {
  const dir = path.dirname(filePath);
  const rel = path.relative(BUILD_DIR, dir).replace(/\\/g, '/');
  if (!rel || rel === '.') return '/';
  return `/${rel}`;
}

function collectHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(full, out);
      continue;
    }
    if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

function check(html, rule) {
  return rule.test(html);
}

function hasNonEmptyH1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return false;
  const text = match[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 0;
}

const rules = {
  title: /<title>[^<]+<\/title>/i,
  description: /<meta\s+name="description"\s+content="[^"]*"/i,
  robots: /<meta\s+name="robots"\s+content="[^"]*"/i,
  canonical: /<link\s+rel="canonical"\s+href="[^"]+"/i,
  ogTitle: /<meta\s+property="og:title"\s+content="[^"]*"/i,
  ogUrl: /<meta\s+property="og:url"\s+content="[^"]*"/i,
  twitterTitle: /<meta\s+name="twitter:title"\s+content="[^"]*"/i,
  jsonLd: /<script[^>]+id="seo-jsonld"[^>]*>/i,
};

const criticalRouteContracts = [
  {
    route: '/',
    title: 'Frontend Interview Prep Platform',
    h1: 'Practice frontend interviews',
    descriptionTerms: ['frontend interviews', 'real editor', 'checks'],
  },
  {
    route: '/coding',
    title: 'Frontend Interview Questions Bank',
    h1: 'Frontend Interview Questions Bank',
    descriptionTerms: ['frontend interview questions', 'coding', 'system design', 'concept'],
  },
  {
    route: '/interview-questions',
    title: 'Frontend Interview Questions',
    h1: 'Frontend Interview Questions',
    descriptionTerms: ['coding', 'concept', 'explanations'],
  },
  {
    route: '/javascript/interview-questions',
    title: 'JavaScript Interview Questions',
    h1: 'JavaScript Interview Questions',
    descriptionTerms: ['coding', 'concept', 'explanations'],
  },
  {
    route: '/react/interview-questions',
    title: 'React Interview Questions',
    h1: 'React Interview Questions',
    descriptionTerms: ['coding', 'concept', 'explanations'],
  },
  {
    route: '/system-design',
    title: 'Frontend System Design Interview Questions',
    h1: 'Frontend System Design Interview Questions',
    descriptionTerms: ['ui architecture', 'state', 'api contracts', 'performance', 'tradeoffs'],
  },
  {
    route: '/guides/interview-blueprint',
    title: 'Frontend Interview Playbook',
    h1: 'Frontend Interview Playbook',
    descriptionTerms: ['coding', 'ui', 'system design', 'behavioral'],
  },
  {
    route: '/tracks',
    title: 'Frontend Interview Study Plans',
    h1: 'Frontend Interview Study Plans',
    descriptionTerms: ['coding', 'concept', 'system design'],
  },
  {
    route: '/companies',
    title: 'Company Frontend Interview Questions',
    h1: 'Company Frontend Interview Questions',
    descriptionTerms: ['coding', 'concept', 'system design'],
  },
];

function normalizeText(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function includesPhrase(value, phrase) {
  return normalizeText(value).toLowerCase().includes(String(phrase || '').toLowerCase());
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return normalizeText(match?.[1] || '');
}

function extractMetaDescription(html) {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return normalizeText(match?.[1] || '');
}

function extractH1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return normalizeText(match?.[1] || '');
}

const files = collectHtmlFiles(BUILD_DIR);
if (!files.length) {
  console.error(`[seo:meta-check] No prerendered HTML files found under ${BUILD_DIR}`);
  process.exit(1);
}

const failures = {
  title: [],
  description: [],
  robots: [],
  canonical: [],
  ogTitle: [],
  ogUrl: [],
  twitterTitle: [],
  jsonLd: [],
  h1: [],
  keywordContract: [],
};
const htmlByRoute = new Map();

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const route = toRoute(file);
  htmlByRoute.set(route, html);
  for (const [key, rule] of Object.entries(rules)) {
    if (!check(html, rule)) failures[key].push(route);
  }
  if (!hasNonEmptyH1(html)) failures.h1.push(route);
}

for (const contract of criticalRouteContracts) {
  const html = htmlByRoute.get(contract.route);
  if (!html) {
    failures.keywordContract.push(`${contract.route}: missing prerendered HTML`);
    continue;
  }

  const title = extractTitle(html);
  const h1 = extractH1(html);
  const description = extractMetaDescription(html);
  const missing = [];

  if (!includesPhrase(title, contract.title)) missing.push(`title lacks "${contract.title}"`);
  if (!includesPhrase(h1, contract.h1)) missing.push(`h1 lacks "${contract.h1}"`);
  if (description.length < 70) missing.push('description is too short');
  for (const term of contract.descriptionTerms || []) {
    if (!includesPhrase(description, term)) missing.push(`description lacks "${term}"`);
  }

  if (missing.length) failures.keywordContract.push(`${contract.route}: ${missing.join('; ')}`);
}

const requiredKeys = ['title', 'description', 'robots', 'canonical', 'ogTitle', 'ogUrl', 'twitterTitle', 'jsonLd'];
const requiredMissing = requiredKeys.reduce((count, key) => count + failures[key].length, 0);
const h1Missing = failures.h1.length;
const keywordContractMissing = failures.keywordContract.length;

console.log(`[seo:meta-check] pages scanned: ${files.length}`);
for (const key of requiredKeys) {
  console.log(`[seo:meta-check] missing ${key}: ${failures[key].length}`);
}
console.log(`[seo:meta-check] missing h1: ${h1Missing}`);
console.log(`[seo:meta-check] keyword contract failures: ${keywordContractMissing}`);

if (h1Missing) {
  console.log(`[seo:meta-check] sample routes without h1: ${failures.h1.slice(0, 10).join(', ')}`);
}

if (keywordContractMissing) {
  console.log(`[seo:meta-check] sample keyword contract failures: ${failures.keywordContract.slice(0, 10).join(' | ')}`);
}

if (requiredMissing > 0 || keywordContractMissing > 0 || (STRICT_H1 && h1Missing > 0)) {
  for (const key of requiredKeys) {
    if (!failures[key].length) continue;
    console.log(`[seo:meta-check] sample missing ${key}: ${failures[key].slice(0, 10).join(', ')}`);
  }
  process.exit(1);
}
