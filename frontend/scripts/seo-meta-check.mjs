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
};

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const route = toRoute(file);
  for (const [key, rule] of Object.entries(rules)) {
    if (!check(html, rule)) failures[key].push(route);
  }
  if (!hasNonEmptyH1(html)) failures.h1.push(route);
}

const requiredKeys = ['title', 'description', 'robots', 'canonical', 'ogTitle', 'ogUrl', 'twitterTitle', 'jsonLd'];
const requiredMissing = requiredKeys.reduce((count, key) => count + failures[key].length, 0);
const h1Missing = failures.h1.length;

console.log(`[seo:meta-check] pages scanned: ${files.length}`);
for (const key of requiredKeys) {
  console.log(`[seo:meta-check] missing ${key}: ${failures[key].length}`);
}
console.log(`[seo:meta-check] missing h1: ${h1Missing}`);

if (h1Missing) {
  console.log(`[seo:meta-check] sample routes without h1: ${failures.h1.slice(0, 10).join(', ')}`);
}

if (requiredMissing > 0 || (STRICT_H1 && h1Missing > 0)) {
  for (const key of requiredKeys) {
    if (!failures[key].length) continue;
    console.log(`[seo:meta-check] sample missing ${key}: ${failures[key].slice(0, 10).join(', ')}`);
  }
  process.exit(1);
}
