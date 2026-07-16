#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(frontendRoot, 'src', 'app');
const legalRoot = path.join(appRoot, 'features', 'legal');
const trackRegistryPath = path.resolve(frontendRoot, '..', 'cdn', 'questions', 'track-registry.json');

async function sourceFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    if (!/\.(?:ts|html)$/.test(entry.name) || entry.name.endsWith('.spec.ts')) return [];
    return [fullPath];
  }));
  return files.flat();
}

const files = await sourceFiles(appRoot);
const publicSource = (await Promise.all(files.map(async (filePath) => ({
  filePath,
  text: await fs.readFile(filePath, 'utf8'),
}))));

const forbiddenPublicClaims = [
  /FrontendAtlas Team/i,
  /FrontendAtlas Editor(?!ial)/i,
  /internal review/i,
  /reviewedBy/,
  /Reviewed by FrontendAtlas/i,
  /8\+ years/i,
  /interviewer-side experience/i,
  /inflated user counts/i,
  /invented customer logos/i,
  /anonymous praise/i,
  /direct feedback loop with the person building it/i,
  /trusted by 100 developers/i,
  /100 active learners/i,
  /loved by developers/i,
  /helping 100 developers land jobs/i,
  /a community of 100 developers/i,
  /and counting/i,
];

for (const { filePath, text } of publicSource) {
  for (const pattern of forbiddenPublicClaims) {
    assert.doesNotMatch(text, pattern, `${path.relative(frontendRoot, filePath)} contains unsupported public trust copy: ${pattern}`);
  }
}

const legalFiles = (await sourceFiles(legalRoot)).map((filePath) => ({
  filePath,
  text: publicSource.find((file) => file.filePath === filePath)?.text ?? '',
}));
const legalPlaceholderPatterns = [
  /Add a/i,
  /TODO/i,
  /TBD/i,
  /\[insert/i,
  /placeholder/i,
  /your company/i,
  /your jurisdiction/i,
];
for (const { filePath, text } of legalFiles) {
  for (const pattern of legalPlaceholderPatterns) {
    assert.doesNotMatch(
      text,
      pattern,
      `${path.relative(frontendRoot, filePath)} contains unfinished legal copy: ${pattern}`,
    );
  }
}

const showcaseHtml = await fs.readFile(
  path.join(appRoot, 'features', 'showcase', 'showcase.page.html'),
  'utf8',
);
for (const authorizedLine of [
  'Built for credible practice',
  'Frontend interview practice that shows its work.',
  'Hands-on coding, runnable examples, regression tests, and transparent editorial updates—inside one focused workflow.',
  'FrontendAtlas accounts created',
  'Early milestone <span aria-hidden="true">·</span> July 2026',
]) {
  assert.equal(
    showcaseHtml.split(authorizedLine).length - 1,
    1,
    `homepage must render the authorized milestone line exactly once: ${authorizedLine}`,
  );
}
assert.match(
  showcaseHtml,
  /data-testid="trust-milestone-value">100<\/strong>/,
  'homepage must render the authorized account milestone as a secondary metric',
);
assert.doesNotMatch(
  showcaseHtml,
  /100 FrontendAtlas accounts have been created\./,
  'homepage account count must not remain the primary trust headline',
);

const registry = JSON.parse(await fs.readFile(trackRegistryPath, 'utf8'));
const foundations = registry.tracks.find((track) => track.slug === 'foundations-30d');
assert.ok(foundations, 'canonical foundations-30d track must exist');

const refKey = (ref) => `${String(ref.tech || 'none').toLowerCase()}::${ref.kind}::${ref.id}`;
const keys = foundations.featured.map(refKey);
assert.equal(new Set(keys).size, keys.length, 'Foundations must not contain duplicate tech+kind+id refs');

const refs = foundations.featured;
const metrics = {
  uniquePrompts: new Set(keys).size,
  javascript: refs.filter((ref) => ref.tech === 'javascript').length,
  frameworkCoding: refs.filter((ref) => ref.kind === 'coding' && ['react', 'angular', 'vue'].includes(ref.tech)).length,
  htmlCss: refs.filter((ref) => ['html', 'css'].includes(ref.tech)).length,
  conceptQuestions: refs.filter((ref) => ref.kind === 'trivia').length,
  systemDesign: refs.filter((ref) => ref.kind === 'system-design').length,
};
assert.deepEqual(metrics, {
  uniquePrompts: 113,
  javascript: 51,
  frameworkCoding: 27,
  htmlCss: 30,
  conceptQuestions: 39,
  systemDesign: 5,
});
assert.ok(
  metrics.javascript + metrics.frameworkCoding + metrics.htmlCss + metrics.conceptQuestions + metrics.systemDesign > metrics.uniquePrompts,
  'Foundations category counts must be presented as overlapping',
);

const trackPreviewSource = await fs.readFile(
  path.join(appRoot, 'features', 'tracks', 'track-preview', 'track-preview.component.ts'),
  'utf8',
);
const showcaseSource = await fs.readFile(
  path.join(appRoot, 'features', 'showcase', 'showcase.page.ts'),
  'utf8',
);
assert.doesNotMatch(trackPreviewSource, /113-question|value:\s*['"]113['"]/, 'track preview must derive the unique total');
assert.doesNotMatch(showcaseSource, /113-question|['"]113['"]/, 'homepage must derive Foundations totals');

const companyDisclaimer = 'Editorial practice groupings, not verified official interview questions or endorsements.';
const editorialFactsSource = await fs.readFile(
  path.join(appRoot, 'core', 'content', 'public-editorial-facts.ts'),
  'utf8',
);
assert.match(
  editorialFactsSource,
  new RegExp(companyDisclaimer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  'the canonical editorial facts source must own the exact company-practice disclaimer',
);

const codingListTemplate = await fs.readFile(
  path.join(appRoot, 'features', 'coding', 'coding-list', 'coding-list.component.html'),
  'utf8',
);
const codingListSource = await fs.readFile(
  path.join(appRoot, 'features', 'coding', 'coding-list', 'coding-list.component.ts'),
  'utf8',
);
assert.doesNotMatch(codingListTemplate, /\[companies\]/, '/coding rows must not render internal company tags as badges');
const publicQuestionRowConsumers = publicSource
  .filter(({ filePath }) => !filePath.endsWith(path.join('shared', 'ui', 'question-row', 'fa-question-row.component.ts')))
  .map(({ text }) => text)
  .join('\n');
assert.doesNotMatch(
  publicQuestionRowConsumers,
  /\[companies\]/,
  'public question-row consumers must not render internal company tags as per-question badges',
);
assert.match(codingListTemplate, />Practice priority</, '/coding must label the public control as Practice priority');
assert.match(
  codingListTemplate,
  /Practice priority is relative FrontendAtlas editorial ordering—not measured interview frequency\./,
  '/coding must explain the editorial priority methodology',
);
assert.match(codingListSource, /Practice priority: High to Low/, '/coding sort labels must use Practice priority');
assert.doesNotMatch(codingListSource, /label:\s*['"]Importance:/, '/coding must not expose Importance sort labels');

const companyDetailTemplate = await fs.readFile(
  path.join(appRoot, 'features', 'company', 'company-detail', 'company-detail.component.html'),
  'utf8',
);
for (const unsupportedCompanyClaim of [
  /known questions/i,
  /candidate reports/i,
  /How\s+\w+\s+Evaluates/i,
  /questions used in this company/i,
]) {
  assert.doesNotMatch(
    companyDetailTemplate,
    unsupportedCompanyClaim,
    `company detail must not claim unsupported provenance: ${unsupportedCompanyClaim}`,
  );
}

console.log('[public-trust-regressions] legal copy, attribution, milestone, track-count, priority, and company checks passed');
