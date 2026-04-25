#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from './content-paths.mjs';

const LINTER_PATH = path.join(repoRoot, 'frontend', 'scripts', 'lint-indexability-readiness.mjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'indexability-readiness-'));
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
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
  summary = 'A neutral guide summary that stays broad and introductory.',
  importPath,
  seoTitle,
  description = 'A broad summary that stays generic and high level.',
  primaryKeyword,
  draftSource = '',
  searchIntent = '',
  readerPromise = '',
  uniqueAngle = '',
}) {
  const lines = [
    `  {`,
    `    slug: '${slug}',`,
    `    title: '${title}',`,
    `    summary: '${summary}',`,
    `    seo: {`,
    `      title: '${seoTitle || title}',`,
    `      description: '${description}',`,
    `      primaryKeyword: '${primaryKeyword}',`,
  ];
  if (draftSource) lines.push(`      draftSource: '${draftSource}',`);
  if (searchIntent) lines.push(`      searchIntent: '${searchIntent}',`);
  if (readerPromise) lines.push(`      readerPromise: '${readerPromise}',`);
  if (uniqueAngle) lines.push(`      uniqueAngle: '${uniqueAngle}',`);
  lines.push(
    `    },`,
    `    load: () =>`,
    `      import('${importPath}')`,
    `        .then((m) => m.TestGuideArticle),`,
    `  },`,
  );
  return lines.join('\n');
}

function guideComponent() {
  return `import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: '<fa-guide-shell title="Guide"></fa-guide-shell>',
})
export class TestGuideArticle {}
`;
}

function triviaEntry(overrides = {}) {
  return {
    id: 'generic-question',
    title: 'What is memoization in JavaScript?',
    technology: 'javascript',
    difficulty: 'easy',
    description: 'Memoization stores the result of a function so repeated calls can reuse earlier work.',
    answer: {
      blocks: [
        {
          type: 'text',
          text: 'Memoization stores results and returns them later when the same input appears again.',
        },
      ],
    },
    seo: {
      title: 'What is memoization in JavaScript?',
      description: 'Learn what memoization means and how it works.',
    },
    ...overrides,
  };
}

function goodHubIntentProfiles() {
  return `const HUB_INTENT_PROFILES = {
  master: {
    heading: 'What frontend interview rounds test',
    lead: 'Frontend interview rounds combine JavaScript, UI, browser, framework, and system design reasoning.',
    tests: [
      'JavaScript coding and UI prompt execution under time pressure.',
      'Browser and framework explanations with state management trade-offs.',
      'System design follow-up judgment for frontend constraints.',
    ],
    usage: [
      'Start with JavaScript coding prompts before system design drills.',
    ],
    credibility: 'FrontendAtlas practice routes are reviewed for frontend interview coverage.',
    relatedPrep: {
      label: 'Frontend interview preparation guide',
      summary: 'A frontend guide for JavaScript, UI, browser, and system design rounds.',
    },
  },
  angular: {
    heading: 'What Angular interview rounds test',
    lead: 'Angular interviews test RxJS flow control, HttpClient cancellation, change detection, dependency injection, forms, and testing judgment.',
    tests: [
      'RxJS operators, HttpClient cancellation, and request race prevention.',
      'Change detection, DI scope, standalone boundaries, and template binding.',
      'Reactive forms, async cleanup, and production Angular bug explanation.',
    ],
    usage: [
      'Open the Angular prep path when RxJS or change detection misses repeat.',
    ],
    credibility: 'Angular prompts are reviewed for framework-specific production pitfalls.',
    relatedPrep: {
      label: 'Angular interview prep path',
      summary: 'A focused path for RxJS, change detection, DI boundaries, forms, and tests.',
    },
  },
};\n`;
}

function setupFixture({ guideEntries = [], guideFiles = {}, triviaByTech = {}, invalidTriviaJson = false, hubProfileSource = goodHubIntentProfiles() } = {}) {
  const tempRoot = makeTempRoot();
  writeFile(tempRoot, 'src/app/shared/guides/guide.registry.ts', guideRegistry(guideEntries.join('\n')));
  writeFile(
    tempRoot,
    'src/app/features/interview-questions/interview-questions-landing.component.ts',
    hubProfileSource,
  );
  writeFile(
    tempRoot,
    'src/app/features/trivia/trivia-detail/trivia-detail.component.html',
    '<a>Continue with Angular Interview Questions</a>',
  );
  fs.mkdirSync(path.join(tempRoot, 'cdn', 'questions'), { recursive: true });
  Object.entries(guideFiles).forEach(([relativePath, source]) => {
    writeFile(tempRoot, relativePath, source);
  });
  Object.entries(triviaByTech).forEach(([tech, entries]) => {
    writeJson(tempRoot, `cdn/questions/${tech}/trivia.json`, entries);
  });
  if (invalidTriviaJson) {
    writeFile(tempRoot, 'cdn/questions/javascript/trivia.json', '{ invalid json\n');
  }
  return tempRoot;
}

function runLinter(tempRoot) {
  return spawnSync('node', [LINTER_PATH], {
    cwd: path.join(repoRoot, 'frontend'),
    encoding: 'utf8',
    env: {
      ...process.env,
      GUIDE_REGISTRY_PATH: path.join(tempRoot, 'src/app/shared/guides/guide.registry.ts'),
      CDN_QUESTIONS_DIR: path.join(tempRoot, 'cdn', 'questions'),
      TRIVIA_DETAIL_TEMPLATE_PATH: path.join(tempRoot, 'src/app/features/trivia/trivia-detail/trivia-detail.component.html'),
      INTERVIEW_HUB_COMPONENT_PATH: path.join(tempRoot, 'src/app/features/interview-questions/interview-questions-landing.component.ts'),
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
  assert.notEqual(result.status, 0, 'Expected lint-indexability-readiness to fail');
  return `${result.stdout}${result.stderr}`;
}

{
  const tempRoot = setupFixture({
    triviaByTech: {
      javascript: [triviaEntry()],
    },
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /\[generic-query-risk\]/);
  assert.match(output, /indexability readiness scan completed/);
}

{
  const tempRoot = setupFixture({
    hubProfileSource: `const HUB_INTENT_PROFILES = {
  react: {
    heading: 'What React interview rounds test',
    lead: 'Use this hub to prepare for interview questions.',
    tests: [
      'Use these questions to prepare faster.',
      'Use these questions to prepare faster.',
      'Open the prep path when ready.',
    ],
    usage: [
      'Use these questions to prepare faster.',
      'Open the prep path when ready.',
    ],
    credibility: 'Questions are curated.',
    relatedPrep: {
      label: 'React prep path',
      summary: 'Open the prep path when ready.',
    },
  },
};\n`,
    triviaByTech: {
      javascript: [
        triviaEntry({
          id: 'distinct-question',
          description: 'Explain memoization with interview tradeoffs, wrong assumptions, and production debugging constraints.',
          answer: {
            blocks: [
              {
                type: 'text',
                text: 'Interview answer with pitfall, debug, and production constraint framing.',
              },
            ],
          },
          seo: {
            title: 'JavaScript Memoization Interview Question',
            description: 'Practice a JavaScript memoization interview answer with pitfalls and production debugging constraints.',
          },
        }),
      ],
    },
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /\[hub-profile-low-specificity\].*hub:react/);
  assert.match(output, /\[hub-profile-generic-phrase-ratio\].*hub:react/);
  assert.match(output, /\[hub-profile-duplicate-sentence-ratio\].*hub:react/);
}

{
  const tempRoot = setupFixture({
    triviaByTech: {
      javascript: [
        triviaEntry({
          id: 'distinct-question',
          title: 'What is memoization in JavaScript?',
          description: 'Explain memoization with interview tradeoffs, wrong assumptions, and production debugging constraints.',
          answer: {
            blocks: [
              {
                type: 'text',
                text: 'Interview answer: memoization helps only when work repeats. Common mistake: add it everywhere. Debug stale caches before celebrating the optimization.',
              },
            ],
          },
          seo: {
            title: 'What is memoization in JavaScript?',
            description: 'Interview-focused memoization explanation with pitfall, debug, and production constraint framing.',
          },
        }),
      ],
    },
  });
  const output = expectSuccess(tempRoot);
  assert.doesNotMatch(output, /\[generic-query-risk\].*distinct-question/);
  assert.doesNotMatch(output, /\[weak-distinct-angle\].*distinct-question/);
}

{
  const tempRoot = setupFixture({
    triviaByTech: {
      javascript: [
        triviaEntry({
          id: 'one',
          title: 'How do JavaScript closures work?',
          description: 'Understand JavaScript closures with lexical scope outer variables callback state and function factory examples.',
          seo: {
            title: 'How do JavaScript closures work?',
            description: 'Understand JavaScript closures with lexical scope outer variables callback state and function factory examples.',
          },
        }),
        triviaEntry({
          id: 'two',
          title: 'How do closures work in JS?',
          description: 'Understand JavaScript closures with lexical scope outer variables callback state and function factory examples behavior.',
          seo: {
            title: 'How do closures work in JS?',
            description: 'Understand JavaScript closures with lexical scope outer variables callback state and function factory examples behavior.',
          },
        }),
      ],
    },
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /\[near-duplicate-trivia\]/);
}

{
  const tempRoot = setupFixture({
    guideEntries: [
      guideEntry({
        slug: 'guide-one',
        title: 'React Prep Path',
        importPath: '../../features/guides/playbook/shared-guide',
        primaryKeyword: 'react prep path',
      }),
      guideEntry({
        slug: 'guide-two',
        title: 'Angular Prep Path',
        importPath: '../../features/guides/playbook/shared-guide',
        primaryKeyword: 'angular prep path',
      }),
    ],
    guideFiles: {
      'src/app/features/guides/playbook/shared-guide.ts': guideComponent(),
    },
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /\[shared-guide-component\]/);
  assert.match(output, /PLAYBOOK:guide-one/);
  assert.match(output, /PLAYBOOK:guide-two/);
}

{
  const tempRoot = setupFixture({
    guideEntries: [
      guideEntry({
        slug: 'guide-one',
        title: 'React Guide',
        importPath: '../../features/guides/playbook/guide-one',
        primaryKeyword: 'react guide',
        seoTitle: 'React Guide',
        draftSource: '../../../../content-drafts/playbooks/guide-one.md',
        searchIntent: 'react guide search intent',
        readerPromise: 'Teach the reader exactly what to practice next.',
        uniqueAngle: 'Compares recruiter expectations against production tradeoffs.',
      }),
    ],
    guideFiles: {
      'src/app/features/guides/playbook/guide-one.ts': guideComponent(),
    },
  });
  const output = expectSuccess(tempRoot);
  assert.doesNotMatch(output, /\[generic-query-risk\].*PLAYBOOK:guide-one/);
  assert.doesNotMatch(output, /\[weak-distinct-angle\].*PLAYBOOK:guide-one/);
}

{
  const tempRoot = setupFixture({
    guideEntries: [
      guideEntry({
        slug: 'guide-one',
        title: 'Guide One',
        importPath: '../../features/guides/playbook/guide-one',
        primaryKeyword: 'guide one',
      }),
    ],
    guideFiles: {
      'src/app/features/guides/playbook/guide-one.ts': guideComponent(),
    },
  });
  const output = expectSuccess(tempRoot);
  assert.match(output, /\[generic-query-risk\]|\[weak-distinct-angle\]/);
}

{
  const tempRoot = setupFixture({
    guideEntries: [
      guideEntry({
        slug: 'guide-one',
        title: 'Guide One',
        importPath: '../../features/guides/playbook/guide-one',
        primaryKeyword: 'guide one',
      }),
    ],
    guideFiles: {
      'src/app/features/guides/playbook/guide-one.ts': guideComponent(),
    },
    invalidTriviaJson: true,
  });
  const output = expectFailure(tempRoot);
  assert.match(output, /could not be parsed/);
}

console.log('[lint-indexability-readiness.test] ok');
