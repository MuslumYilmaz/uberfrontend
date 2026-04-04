#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-guide-editorial-quality.mjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'guide-editorial-quality-'));
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function guideRegistry(entrySource) {
  return `import { Type } from '@angular/core';

export type GuideEntry = {
  slug: string;
  title: string;
  summary?: string;
  seo?: Record<string, unknown>;
  load: () => Promise<Type<any>>;
};

export const PLAYBOOK: GuideEntry[] = [
${entrySource}
];

export const SYSTEM: GuideEntry[] = [];
export const BEHAVIORAL: GuideEntry[] = [];
`;
}

function guideEntry({
  slug = 'guide-one',
  title = 'Guide One',
  importPath = '../../features/guides/playbook/guide-one',
  primaryKeyword = 'guide one keyword',
  updatedAt = '2026-04-02',
} = {}) {
  return `  {
    slug: '${slug}',
    title: '${title}',
    summary: 'Guide one summary with enough detail to explain the purpose of this article clearly.',
    seo: {
      title: '${title}',
      description: '${title} description.',
      primaryKeyword: '${primaryKeyword}',
      keywords: ['${primaryKeyword}', '${primaryKeyword} support'],
      publishedAt: '2026-04-01',
      updatedAt: '${updatedAt}',
    },
    load: () =>
      import('${importPath}')
        .then((m) => m.TestGuideArticle),
  },`;
}

function guideComponent({
  title = 'Guide title',
  intro = 'Guide one keyword helps readers understand the concept, the decision boundary, and the way to apply it under interview pressure.',
  body = '',
} = {}) {
  return `import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: \`
    <fa-guide-shell title="${title}" [prev]="prev" [next]="next" [leftNav]="leftNav">
      <p>${intro}</p>
      ${body}
    </fa-guide-shell>
  \`,
})
export class TestGuideArticle {
  prev?: any[] | null;
  next?: any[] | null;
  leftNav?: any;
}
`;
}

function guideWrapper(targetImport = './guide-one') {
  return `export { TestGuideArticle } from '${targetImport}';\n`;
}

function runLinter(tempRoot) {
  return spawnSync('node', [LINTER_PATH], {
    cwd: path.join(repoRoot, 'frontend'),
    encoding: 'utf8',
    env: {
      ...process.env,
      GUIDE_REGISTRY_PATH: path.join(tempRoot, 'src/app/shared/guides/guide.registry.ts'),
    },
  });
}

function expectSuccess(tempRoot) {
  const result = runLinter(tempRoot);
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Expected success');
  }
  return `${result.stdout}${result.stderr}`;
}

function expectFailure(tempRoot) {
  const result = runLinter(tempRoot);
  assert.notEqual(result.status, 0, 'Expected lint-guide-editorial-quality to fail');
  return `${result.stdout}${result.stderr}`;
}

function setupSingleGuide(componentSource, entryOverrides = {}) {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'src/app/shared/guides/guide.registry.ts', guideRegistry(guideEntry(entryOverrides)));
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-one.ts', componentSource);
  return tempRoot;
}

{
  const tempRoot = setupSingleGuide(
    guideComponent({
      body: `
        <h2>Concept</h2>
        <p>${'This section explains the model with interview framing, user impact, concrete constraints, and the way a candidate should communicate the answer. '.repeat(30)}</p>
        <h2>Decision points</h2>
        <p>${'Trade-offs matter because the first answer is rarely the final answer in production, and the article should show how those trade-offs move under pressure. '.repeat(24)}</p>
        <h2>Worked example</h2>
        <blockquote>Example: choose the simpler version first, then extend after measuring risk.</blockquote>
        <h2>Next moves</h2>
        <p><a routerLink="/guides/interview-blueprint/next">Next guide</a></p>
      `,
    }),
  );
  const output = expectSuccess(tempRoot);
  assert.match(output, /editorial quality checks passed/);
}

{
  const tempRoot = setupSingleGuide(
    guideComponent({
      body: `
        <h2>Concept</h2>
        <p>Too short.</p>
        <h2>Decision points</h2>
        <p>Still short.</p>
        <h2>Next moves</h2>
        <p>Not enough depth.</p>
        <h2>Wrap</h2>
        <p>Ends quickly.</p>
      `,
    }),
  );
  const output = expectFailure(tempRoot);
  assert.match(output, /too thin for the shipped editorial floor/);
}

{
  const tempRoot = setupSingleGuide(
    guideComponent({
      body: `
        <h2>Concept</h2>
        <p>${'This article has depth but collapses all teaching into too few sections. '.repeat(30)}</p>
        <h2>Wrap</h2>
        <p>${'The article still keeps talking, but the structure is not staged enough. '.repeat(30)}</p>
      `,
    }),
  );
  const output = expectFailure(tempRoot);
  assert.match(output, /needs at least 4 H2 sections/);
}

{
  const tempRoot = setupSingleGuide(
    guideComponent({
      intro: 'This guide introduces the topic in broad terms and stays intentionally generic from the first sentence.',
      body: `
        <h2>Concept</h2>
        <p>${'This article keeps describing the topic in abstract terms and never shows the reader how the idea changes in practice. '.repeat(22)}</p>
        <h2>Scope</h2>
        <p>${'The language stays generic, skips concrete artifacts, and keeps flattening the topic into broad statements. '.repeat(20)}</p>
        <h2>Delivery</h2>
        <p>${'It continues in the same abstract style and never gives the reader a crisp teaching hook or a practical anchor. '.repeat(22)}</p>
        <h2>Wrap</h2>
        <p>${'The article finishes with more abstraction instead of practical instruction or a concrete learning aid. '.repeat(18)}</p>
      `,
    }),
  );
  const output = expectFailure(tempRoot);
  assert.match(output, /missing an editorial teaching signal/);
}

{
  const tempRoot = setupSingleGuide(
    guideComponent({
      intro: 'This guide explains the concept clearly, but the keyword is only implied in the lead sentence for readers.',
      body: `
        <h2>Concept</h2>
        <p>${'This section explains the model with depth and enough support for a real article that teaches the concept instead of only summarizing it. '.repeat(28)}</p>
        <h2>Trade-offs</h2>
        <p>${'Trade-offs appear here, so the guide still has judgment even without inline links, and the reader can see when the decision changes. '.repeat(24)}</p>
        <h2>Checklist</h2>
        <blockquote>Use this checklist to avoid vague answers.</blockquote>
        <h2>Wrap</h2>
        <p>${'The ending still gives the reader a clear next move and a sharper sense of what to practice next. '.repeat(24)}</p>
      `,
    }),
  );
  const output = expectSuccess(tempRoot);
  assert.match(output, /warning: PLAYBOOK:guide-one has no inline body links/);
}

{
  const tempRoot = setupSingleGuide(
    guideComponent({
      body: `
        <h2>Concept</h2>
        <p>${'This section explains the model with interview framing, user impact, and enough detail for a proper long-form article. '.repeat(30)}</p>
        <h2>Decision points</h2>
        <p>${'Trade-offs matter because the first answer is rarely the final answer in production, and the article should keep showing why. '.repeat(24)}</p>
        <h2>Worked example</h2>
        <blockquote>Example: choose the simpler version first, then extend after measuring risk.</blockquote>
        <h2>Next moves</h2>
        <p>${'The closing paragraph stays actionable, concrete, and useful enough to justify an editorial refresh reminder. '.repeat(24)}</p>
      `,
    }),
    { updatedAt: '2024-01-01' },
  );
  const output = expectSuccess(tempRoot);
  assert.match(output, /has not been updated in/);
}

{
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'src/app/shared/guides/guide.registry.ts', guideRegistry(guideEntry({
    importPath: '../../features/guides/playbook/guide-wrapper',
  })));
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-one.ts', guideComponent({
    body: `
      <h2>Concept</h2>
      <p>${'This section explains the model with interview framing, user impact, concrete constraints, and the way a candidate should communicate the answer. '.repeat(30)}</p>
      <h2>Decision points</h2>
      <p>${'Trade-offs matter because the first answer is rarely the final answer in production, and the article should show how those trade-offs move under pressure. '.repeat(24)}</p>
      <h2>Worked example</h2>
      <blockquote>Example: choose the simpler version first, then extend after measuring risk.</blockquote>
      <h2>Next moves</h2>
      <p><a routerLink="/guides/interview-blueprint/next">Next guide</a></p>
    `,
  }));
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-wrapper.ts', guideWrapper('./guide-one'));
  const output = expectSuccess(tempRoot);
  assert.match(output, /editorial quality checks passed/);
}

console.log('[lint-guide-editorial-quality.test] ok');
