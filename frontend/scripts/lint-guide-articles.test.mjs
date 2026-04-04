#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-guide-articles.mjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'guide-articles-lint-'));
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function guideComponent({
  bodyText = 'A strong shipped guide should still explain the concept clearly with enough detail for readers to learn the model and apply it in interviews.',
  bindReaderPromise = true,
} = {}) {
  return `import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  template: \`
    <fa-guide-shell
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      ${bindReaderPromise ? '[readerPromise]="readerPromise || undefined"' : ''}
      title="Guide title"
    >
      <p>${bodyText}</p>
    </fa-guide-shell>
  \`,
})
export class TestGuideArticle {
  @Input() prev?: any[] | null;
  @Input() next?: any[] | null;
  @Input() leftNav?: any;
  @Input() readerPromise?: string | null;
}
`;
}

function guideRegistry(entriesSource) {
  return `import { Type } from '@angular/core';

export type GuideEntry = {
  slug: string;
  title: string;
  summary?: string;
  seo?: Record<string, unknown>;
  load: () => Promise<Type<any>>;
};

export const PLAYBOOK: GuideEntry[] = [
${entriesSource}
];

export const SYSTEM: GuideEntry[] = [];
export const BEHAVIORAL: GuideEntry[] = [];
`;
}

function guideEntry({
  slug,
  title,
  primaryKeyword,
  keywords,
  publishedAt = '2025-01-01',
  updatedAt = '2025-02-01',
  description,
  importPath,
  draftSource = '',
  searchIntent = '',
  readerPromise = '',
  uniqueAngle = '',
  factCheckedAt = '',
  reviewedBy = '',
}) {
  const lines = [
    `  {`,
    `    slug: '${slug}',`,
    `    title: '${title}',`,
    `    summary: '${title} summary.',`,
    `    seo: {`,
    `      title: '${title}',`,
    `      description: '${description || `${title} description.`}',`,
    `      primaryKeyword: '${primaryKeyword}',`,
    `      keywords: ${JSON.stringify(keywords)},`,
    `      publishedAt: '${publishedAt}',`,
    `      updatedAt: '${updatedAt}',`,
  ];
  if (draftSource) lines.push(`      draftSource: '${draftSource}',`);
  if (searchIntent) lines.push(`      searchIntent: '${searchIntent}',`);
  if (readerPromise) lines.push(`      readerPromise: '${readerPromise}',`);
  if (uniqueAngle) lines.push(`      uniqueAngle: '${uniqueAngle}',`);
  if (factCheckedAt) lines.push(`      factCheckedAt: '${factCheckedAt}',`);
  if (reviewedBy) lines.push(`      reviewedBy: '${reviewedBy}',`);
  lines.push(
    `    },`,
    `    load: () =>`,
    `      import('${importPath}')`,
    `        .then((m) => m.TestGuideArticle),`,
    `  },`,
  );
  return lines.join('\n');
}

function writeShell(root) {
  writeFile(
    root,
    'src/app/shared/components/guide/guide-shell.component.ts',
    `template = \`
      <section>
        <h2>Continue Exploring</h2>
        <a [routerLink]="item.link">Related guide</a>
      </section>
    \`;
    `,
  );
}

function guideWrapper(targetImport = './guide-one') {
  return `export { TestGuideArticle } from '${targetImport}';\n`;
}

function draftFrontmatter(overrides = {}) {
  const values = {
    title: 'Guide One',
    slug: 'guide-one',
    family: 'playbook',
    tech: 'frontend',
    audience: 'Readers',
    intent: 'Teach the concept.',
    target_words: 1200,
    primary_keyword: 'guide one keyword',
    status: 'approved',
    notes_for_conversion: ['Ship it.'],
    search_intent: 'guide one search intent',
    reader_promise: 'Help readers explain the concept with a stronger interview-ready decision boundary.',
    unique_angle: 'Connects the concept to interviewer scoring signals instead of generic blog advice.',
    what_this_adds_beyond_basics: 'Shows how the answer changes under interview pressure and tradeoff constraints.',
    competitor_query: 'guide one query',
    competitor_takeaways: ['Competitors explain the basic model.', 'Competitors include a generic example.'],
    competitor_gaps: ['Competitors skip the interview scoring angle.', 'Competitors do not show when the answer changes.'],
    sources: ['https://example.com/source-one'],
    last_fact_checked_at: '2026-04-01',
    reviewed_by: 'FrontendAtlas Editor',
    confidence: 'high',
    ...overrides,
  };
  return `---
title: "${values.title}"
slug: "${values.slug}"
family: "${values.family}"
tech: "${values.tech}"
audience: "${values.audience}"
intent: "${values.intent}"
target_words: ${values.target_words}
primary_keyword: "${values.primary_keyword}"
status: "${values.status}"
notes_for_conversion:
  - "${values.notes_for_conversion[0]}"
search_intent: "${values.search_intent}"
reader_promise: "${values.reader_promise}"
unique_angle: "${values.unique_angle}"
what_this_adds_beyond_basics: "${values.what_this_adds_beyond_basics}"
competitor_query: "${values.competitor_query}"
competitor_takeaways:
  - "${values.competitor_takeaways[0]}"
  - "${values.competitor_takeaways[1]}"
competitor_gaps:
  - "${values.competitor_gaps[0]}"
  - "${values.competitor_gaps[1]}"
sources:
  - "${values.sources[0]}"
last_fact_checked_at: "${values.last_fact_checked_at}"
reviewed_by: "${values.reviewed_by}"
confidence: "${values.confidence}"
---

# Hook

${'This draft explains the concept in depth with examples and decision points. '.repeat(80)}
`;
}

function runLinter(tempFrontendRoot, tempDraftRoot, extraEnv = {}) {
  return execFileSync('node', [LINTER_PATH], {
    cwd: path.join(repoRoot, 'frontend'),
    encoding: 'utf8',
    env: {
      ...process.env,
      GUIDE_REGISTRY_PATH: path.join(tempFrontendRoot, 'src/app/shared/guides/guide.registry.ts'),
      GUIDE_SHELL_PATH: path.join(tempFrontendRoot, 'src/app/shared/components/guide/guide-shell.component.ts'),
      CONTENT_DRAFTS_DIR: tempDraftRoot,
      ...extraEnv,
    },
    stdio: 'pipe',
  });
}

function expectFailure(tempFrontendRoot, tempDraftRoot, extraEnv = {}) {
  try {
    runLinter(tempFrontendRoot, tempDraftRoot, extraEnv);
    assert.fail('Expected lint-guide-articles to fail');
  } catch (error) {
    return error;
  }
}

function setupDraftBackedGuide({ entryOverrides = {}, componentOptions = {}, draftOverrides = {} } = {}) {
  const tempRoot = makeTempRoot();
  const tempDrafts = path.join(tempRoot, 'content-drafts');
  writeShell(tempRoot);
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-one.ts', guideComponent(componentOptions));
  writeFile(
    tempRoot,
    'src/app/shared/guides/guide.registry.ts',
    guideRegistry(
      guideEntry({
        slug: 'guide-one',
        title: 'Guide One',
        primaryKeyword: 'guide one keyword',
        keywords: ['guide one keyword', 'guide one supporting phrase'],
        importPath: '../../features/guides/playbook/guide-one',
        draftSource: '../../../../content-drafts/playbooks/guide-one.md',
        searchIntent: 'guide one search intent',
        readerPromise: 'Help readers explain the concept with a stronger interview-ready decision boundary.',
        uniqueAngle: 'Connects the concept to interviewer scoring signals instead of generic blog advice.',
        factCheckedAt: '2026-04-02',
        reviewedBy: 'FrontendAtlas Editor',
        ...entryOverrides,
      }),
    ),
  );
  writeFile(tempDrafts, 'playbooks/guide-one.md', draftFrontmatter(draftOverrides));
  return { tempRoot, tempDrafts };
}

function testValidGuideRegistryPasses() {
  const tempRoot = makeTempRoot();
  const tempDrafts = path.join(tempRoot, 'content-drafts');
  writeShell(tempRoot);
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-one.ts', guideComponent());
  writeFile(
    tempRoot,
    'src/app/shared/guides/guide.registry.ts',
    guideRegistry(
      guideEntry({
        slug: 'guide-one',
        title: 'Guide One',
        primaryKeyword: 'guide one keyword',
        keywords: ['guide one keyword', 'guide one supporting phrase'],
        importPath: '../../features/guides/playbook/guide-one',
      }),
    ),
  );

  const output = runLinter(tempRoot, tempDrafts);
  assert.match(output, /1 guide\(s\) checked/);
}

function testDuplicatePrimaryKeywordFails() {
  const tempRoot = makeTempRoot();
  const tempDrafts = path.join(tempRoot, 'content-drafts');
  writeShell(tempRoot);
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-one.ts', guideComponent());
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-two.ts', guideComponent());
  writeFile(
    tempRoot,
    'src/app/shared/guides/guide.registry.ts',
    guideRegistry(
      [
        guideEntry({
          slug: 'guide-one',
          title: 'Guide One',
          primaryKeyword: 'same keyword',
          keywords: ['same keyword', 'one supporting phrase'],
          importPath: '../../features/guides/playbook/guide-one',
        }),
        guideEntry({
          slug: 'guide-two',
          title: 'Guide Two',
          primaryKeyword: 'same keyword',
          keywords: ['same keyword', 'two supporting phrase'],
          importPath: '../../features/guides/playbook/guide-two',
        }),
      ].join('\n'),
    ),
  );

  const failure = expectFailure(tempRoot, tempDrafts);
  assert.match(String(failure.stderr || ''), /keyword cannibalization risk/);
}

function testDraftParityFailsWhenShippedArticleIsTooThin() {
  const { tempRoot, tempDrafts } = setupDraftBackedGuide({
    componentOptions: {
      bodyText: 'Too short.',
    },
  });
  const failure = expectFailure(tempRoot, tempDrafts);
  assert.match(String(failure.stderr || ''), /shipped article is too thin vs draft/);
}

function testDraftBackedGuideRequiresSearchIntent() {
  const { tempRoot, tempDrafts } = setupDraftBackedGuide({
    entryOverrides: {
      searchIntent: '',
    },
  });
  const failure = expectFailure(tempRoot, tempDrafts);
  assert.match(String(failure.stderr || ''), /missing seo.searchIntent/);
}

function testDraftBackedGuideRequiresReaderPromise() {
  const { tempRoot, tempDrafts } = setupDraftBackedGuide({
    entryOverrides: {
      readerPromise: '',
    },
  });
  const failure = expectFailure(tempRoot, tempDrafts);
  assert.match(String(failure.stderr || ''), /missing seo.readerPromise/);
}

function testDraftBackedGuideFailsOnMismatchedUniqueAngle() {
  const { tempRoot, tempDrafts } = setupDraftBackedGuide({
    entryOverrides: {
      uniqueAngle: 'Different angle entirely.',
    },
  });
  const failure = expectFailure(tempRoot, tempDrafts);
  assert.match(String(failure.stderr || ''), /seo.uniqueAngle does not match draft unique_angle/);
}

function testDraftBackedGuideFailsWhenFactCheckedAtIsOlderThanDraft() {
  const { tempRoot, tempDrafts } = setupDraftBackedGuide({
    entryOverrides: {
      factCheckedAt: '2026-03-01',
    },
  });
  const failure = expectFailure(tempRoot, tempDrafts);
  assert.match(String(failure.stderr || ''), /seo.factCheckedAt cannot be earlier than draft last_fact_checked_at/);
}

function testDraftBackedGuideRequiresReaderPromiseBinding() {
  const { tempRoot, tempDrafts } = setupDraftBackedGuide({
    componentOptions: {
      bindReaderPromise: false,
    },
  });
  const failure = expectFailure(tempRoot, tempDrafts);
  assert.match(String(failure.stderr || ''), /guide article must pass readerPromise into <fa-guide-shell>/);
}

function testShallowHistorySkipsGitDateFloorChecks() {
  const tempRoot = makeTempRoot();
  const tempDrafts = path.join(tempRoot, 'content-drafts');
  writeShell(tempRoot);
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-one.ts', guideComponent());
  writeFile(
    tempRoot,
    'src/app/shared/guides/guide.registry.ts',
    guideRegistry(
      guideEntry({
        slug: 'guide-one',
        title: 'Guide One',
        primaryKeyword: 'guide one keyword',
        keywords: ['guide one keyword', 'guide one supporting phrase'],
        importPath: '../../features/guides/playbook/guide-one',
        publishedAt: '2020-01-01',
        updatedAt: '2020-02-01',
      }),
    ),
  );

  const output = runLinter(tempRoot, tempDrafts, {
    GUIDE_ARTICLES_SKIP_GIT_HISTORY_CHECKS: '1',
  });
  assert.match(output, /guide articles look valid/);
}

function testReExportWrapperResolvesUnderlyingGuideTemplate() {
  const tempRoot = makeTempRoot();
  const tempDrafts = path.join(tempRoot, 'content-drafts');
  writeShell(tempRoot);
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-one.ts', guideComponent());
  writeFile(tempRoot, 'src/app/features/guides/playbook/guide-wrapper.ts', guideWrapper('./guide-one'));
  writeFile(
    tempRoot,
    'src/app/shared/guides/guide.registry.ts',
    guideRegistry(
      guideEntry({
        slug: 'guide-one',
        title: 'Guide One',
        primaryKeyword: 'guide one keyword',
        keywords: ['guide one keyword', 'guide one supporting phrase'],
        importPath: '../../features/guides/playbook/guide-wrapper',
      }),
    ),
  );

  const output = runLinter(tempRoot, tempDrafts, {
    GUIDE_ARTICLES_SKIP_GIT_HISTORY_CHECKS: '1',
  });
  assert.match(output, /guide articles look valid/);
}

testValidGuideRegistryPasses();
testDuplicatePrimaryKeywordFails();
testDraftParityFailsWhenShippedArticleIsTooThin();
testDraftBackedGuideRequiresSearchIntent();
testDraftBackedGuideRequiresReaderPromise();
testDraftBackedGuideFailsOnMismatchedUniqueAngle();
testDraftBackedGuideFailsWhenFactCheckedAtIsOlderThanDraft();
testDraftBackedGuideRequiresReaderPromiseBinding();
testShallowHistorySkipsGitDateFloorChecks();
testReExportWrapperResolvesUnderlyingGuideTemplate();

console.log('[lint-guide-articles.test] ok');
