import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { parseTemplate } from '@angular/compiler';
import ts from 'typescript';
import {
  cssSemanticAst,
  formatCss,
  runFrameworkCssFormatter,
} from './format-framework-css.mjs';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(frontendRoot, '..');

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
}

function json(relative) {
  return JSON.parse(read(relative));
}

function fileCode(asset, file) {
  const value = asset.files[file];
  assert.ok(value, `Missing ${file}`);
  return typeof value === 'string' ? value : value.code;
}

function assertMirror(relative, label = relative) {
  const cdnPath = `cdn/${relative}`;
  const fallbackPath = `frontend/src/assets/${relative}`;
  assert.ok(fs.existsSync(path.join(repoRoot, cdnPath)), `${label}: missing canonical CDN asset ${cdnPath}`);
  assert.ok(fs.existsSync(path.join(repoRoot, fallbackPath)), `${label}: missing frontend fallback asset ${fallbackPath}`);
  const cdn = read(cdnPath);
  const fallback = read(fallbackPath);
  assert.equal(fallback, cdn, `${label}: frontend fallback drifted from CDN (${relative})`);
}

function normalizedAssetFiles(asset, label) {
  const files = {};
  for (const [pathRaw, value] of Object.entries(asset?.files ?? {})) {
    const normalizedPath = String(pathRaw).replace(/^\/+/, '');
    const source = typeof value === 'string' ? value : value?.code;
    assert.equal(
      typeof source,
      'string',
      `${label}: ${normalizedPath} must contain string source`
    );
    files[normalizedPath] = source;
  }
  return files;
}

function assertFrameworkCssFormatting() {
  const compact = [
    ':root{--focus:#facc15;/* keep contrast */color-scheme:dark}',
    '.button{border:1px solid #374151}',
    '@media(max-width:640px){.button{display:block;color:var(--focus)}}',
    '.badge::before{content:"•"}',
  ].join('');
  const formatted = [
    ':root {',
    '  --focus: #facc15;',
    '  /* keep contrast */',
    '  color-scheme: dark;',
    '}',
    '',
    '.button {',
    '  border: 1px solid #374151;',
    '}',
    '',
    '@media (max-width:640px) {',
    '  .button {',
    '    display: block;',
    '    color: var(--focus);',
    '  }',
    '}',
    '',
    '.badge::before {',
    '  content: "•";',
    '}',
    '',
  ].join('\n');

  assert.equal(formatCss(compact, 'compact.css'), formatted);
  assert.equal(formatCss('', 'empty.css'), '\n', 'Even empty CSS must end with a newline');
  assert.equal(formatCss(formatted, 'formatted.css'), formatted, 'CSS formatting must be idempotent');
  assert.deepEqual(
    cssSemanticAst(compact, 'compact.css'),
    cssSemanticAst(formatted, 'formatted.css'),
    'CSS formatting must preserve the semantic PostCSS AST'
  );

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'frontendatlas-framework-css-'));
  const canonicalRoot = path.join(temporaryRoot, 'cdn', 'sb');
  const mirrorRoot = path.join(temporaryRoot, 'frontend', 'src', 'assets', 'sb');
  fs.mkdirSync(canonicalRoot, { recursive: true });
  fs.mkdirSync(mirrorRoot, { recursive: true });

  try {
    const encodedCompact = JSON.stringify(compact).replace('•', '\\u2022');
    const nestedCompact = '@media(max-width:1px){body{margin:0}}';
    const fixtureRaw = [
      '{',
      '  "label": "preserve \\u2022 and outer formatting",',
      '  "files": {',
      `    "src/App.css": ${encodedCompact},`,
      `    "/src/styles.css": { "code": ${JSON.stringify(nestedCompact)} },`,
      '    "src/App.tsx": "const untouched = \\u0027yes\\u0027;"',
      '  }',
      '}',
    ].join('\n');
    const fixturePath = path.join(canonicalRoot, 'fixture.json');
    const mirrorPath = path.join(mirrorRoot, 'fixture.json');
    fs.writeFileSync(fixturePath, fixtureRaw);
    fs.writeFileSync(mirrorPath, fixtureRaw);

    const writeSummary = runFrameworkCssFormatter({
      mode: 'write',
      canonicalRoot,
      mirrorRoot,
    });
    assert.deepEqual(writeSummary, {
      assets: 1,
      cssSources: 2,
      changedAssets: 1,
      changedCssSources: 2,
    });
    const written = fs.readFileSync(fixturePath, 'utf8');
    assert.equal(fs.readFileSync(mirrorPath, 'utf8'), written, 'write mode must mirror exact bytes');
    assert.equal(
      written,
      fixtureRaw
        .replace(encodedCompact, JSON.stringify(formatted).replace('•', '\\u2022'))
        .replace(JSON.stringify(nestedCompact), JSON.stringify(formatCss(nestedCompact))),
      'Write mode must replace only the embedded CSS string tokens'
    );
    assert.ok(written.includes('"label": "preserve \\u2022 and outer formatting"'));
    assert.ok(written.includes('"src/App.tsx": "const untouched = \\u0027yes\\u0027;"'));
    assert.ok(written.includes('content: \\"\\u2022\\";'), 'CSS Unicode escape representation must be preserved');
    assert.equal(runFrameworkCssFormatter({ mode: 'check', canonicalRoot, mirrorRoot }).changedCssSources, 0);

    fs.writeFileSync(fixturePath, fixtureRaw);
    fs.writeFileSync(mirrorPath, fixtureRaw);
    const beforeMalformedRun = fixtureRaw;
    const malformedRaw = JSON.stringify({ files: { 'src/App.css': '.broken { color: red;' } }, null, 2);
    fs.writeFileSync(path.join(canonicalRoot, 'malformed.json'), malformedRaw);
    fs.writeFileSync(path.join(mirrorRoot, 'malformed.json'), malformedRaw);
    assert.throws(
      () => runFrameworkCssFormatter({ mode: 'write', canonicalRoot, mirrorRoot }),
      /malformed\.json.*Unclosed block/s
    );
    assert.equal(
      fs.readFileSync(fixturePath, 'utf8'),
      beforeMalformedRun,
      'validation errors must prevent every planned corpus write'
    );
    assert.equal(
      fs.readFileSync(mirrorPath, 'utf8'),
      beforeMalformedRun,
      'validation errors must prevent every planned mirror write'
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }

  assert.deepEqual(
    runFrameworkCssFormatter({
      mode: 'check',
      canonicalRoot: path.join(repoRoot, 'cdn', 'sb'),
      mirrorRoot: path.join(repoRoot, 'frontend', 'src', 'assets', 'sb'),
    }),
    { assets: 193, cssSources: 258, changedAssets: 0, changedCssSources: 0 },
    'The full framework CSS corpus must stay canonical and exactly mirrored'
  );
}

const frameworkStarterTaskMarker =
  /\b(?:TODO|FIXME|BUG)\b|\bImplement in the solution\b|\bNot implemented\b|throw new Error\s*\(/i;

function assertFrameworkStarterCorpus() {
  const assetOwners = new Map();

  for (const technology of ['react', 'angular', 'vue']) {
    const questions = json(`cdn/questions/${technology}/coding.json`);

    for (const question of questions) {
      const starterReference = question.sdk?.asset;
      const solutionReference = question.solutionAsset;
      const questionLabel = `${technology}:${question.id}`;

      assert.equal(
        typeof starterReference,
        'string',
        `${questionLabel}: missing sdk.asset starter reference`
      );
      assert.equal(
        typeof solutionReference,
        'string',
        `${questionLabel}: missing solutionAsset reference`
      );
      assert.match(
        starterReference,
        new RegExp(`^assets/sb/${technology}/question/.+\\.json$`),
        `${questionLabel}: starter must reference assets/sb/${technology}/question/*.json`
      );
      assert.match(
        solutionReference,
        new RegExp(`^assets/sb/${technology}/solution/.+\\.json$`),
        `${questionLabel}: solution must reference assets/sb/${technology}/solution/*.json`
      );
      assert.notEqual(
        starterReference,
        solutionReference,
        `${questionLabel}: starter and solution references must be distinct`
      );

      for (const [kind, reference] of [
        ['starter', starterReference],
        ['solution', solutionReference],
      ]) {
        const previousOwner = assetOwners.get(reference);
        assert.equal(
          previousOwner,
          undefined,
          `${questionLabel}: ${kind} asset ${reference} is already owned by ${previousOwner}`
        );
        assetOwners.set(reference, `${questionLabel}:${kind}`);
      }

      const starterRelative = starterReference.replace(/^assets\//, '');
      const solutionRelative = solutionReference.replace(/^assets\//, '');
      assertMirror(starterRelative, `${questionLabel}:starter`);
      assertMirror(solutionRelative, `${questionLabel}:solution`);

      const starterFiles = normalizedAssetFiles(
        json(`cdn/${starterRelative}`),
        `${questionLabel}:starter`
      );
      const solutionFiles = normalizedAssetFiles(
        json(`cdn/${solutionRelative}`),
        `${questionLabel}:solution`
      );
      const sourcePaths = [...new Set([
        ...Object.keys(starterFiles),
        ...Object.keys(solutionFiles),
      ])]
        .filter((file) => file.startsWith('src/'))
        .sort();

      assert.ok(
        sourcePaths.length > 0,
        `${questionLabel}: starter and solution assets must contain src/ files`
      );

      const differingSourcePaths = sourcePaths.filter(
        (file) => starterFiles[file] !== solutionFiles[file]
      );
      assert.ok(
        differingSourcePaths.length > 0,
        `${questionLabel}: starter ${starterReference} exposes the canonical solution; at least one src/ file must differ`
      );

      const starterSource = Object.entries(starterFiles)
        .filter(([file]) => file.startsWith('src/'))
        .map(([file, source]) => `${file}\n${source}`)
        .join('\n');
      assert.match(
        starterSource,
        frameworkStarterTaskMarker,
        `${questionLabel}: starter ${starterReference} must contain an explicit TODO/FIXME/BUG or equivalent task placeholder`
      );
    }
  }

  for (const relative of [
    'sb/vue/question/vue-todo-list.v1.json',
    'sb/vue/question/vue-todo-list.v2.json',
  ]) {
    assertMirror(relative, `vue:vue-todo-list:${relative}`);
  }
  assert.equal(
    read('cdn/sb/vue/question/vue-todo-list.v1.json'),
    read('cdn/sb/vue/question/vue-todo-list.v2.json'),
    'vue:vue-todo-list: legacy v1 and current v2 starter copies must stay synchronized'
  );
}

const deprecatedAngularControlFlow =
  /\*ng(?:If|For|SwitchCase|SwitchDefault)\b|\[(?:ngIf|ngForOf|ngSwitch)\]|\bng(?:If|For(?:Of)?|Switch(?:Case|Default)?)\b|\bNgIf\b|\bNgFor(?:Of)?\b|\bNgSwitch(?:Case|Default)?\b|\bng-(?:if|for|switch)\b/;
const malformedAngularControlFlow = /[A-Za-z]@(?:if|for|switch)/;
const angularLegacyMigrationAllowlist = new Set();
const angularIndexTrackAllowlist = new Set([
  'sb/angular/question/angular-nested-checkboxes.v1.json',
  'sb/angular/question/angular-tictactoe.v1.json',
  'sb/angular/solution/angular-tictactoe-solution.v1.json'
]);

function referencedAngularAsset(question, assetReference) {
  assert.match(
    assetReference,
    /^assets\/sb\/angular\/(?:question|solution)\/.+\.json$/,
    `${question.id}: invalid Angular sandbox asset reference`
  );
  return assetReference.replace(/^assets\//, '');
}

function parseAngularTemplate(template, label) {
  const parsed = parseTemplate(template, label);
  assert.deepEqual(
    parsed.errors,
    null,
    `${label}: Angular template must parse (${parsed.errors?.map((error) => error.msg).join('; ')})`
  );
}

function inlineAngularTemplates(source) {
  const templates = [];
  const pattern = /\btemplate\s*:\s*`([\s\S]*?)`/g;
  let match;
  while ((match = pattern.exec(source)) !== null) templates.push(match[1]);
  return templates;
}

function assertModernAngularCodingCorpus() {
  assert.equal(
    angularLegacyMigrationAllowlist.size,
    0,
    'The modern Angular corpus must start with an empty legacy-migration allowlist'
  );

  const questions = json('cdn/questions/angular/coding.json');
  const referencedAssets = new Set();

  for (const question of questions) {
    const legacyAllowed =
      question.legacyMigration === true && angularLegacyMigrationAllowlist.has(question.id);
    if (!legacyAllowed) {
      assert.doesNotMatch(
        JSON.stringify(question),
        deprecatedAngularControlFlow,
        `${question.id}: modern Angular prompt content must not teach deprecated structural directives`
      );
      assert.doesNotMatch(
        JSON.stringify(question),
        malformedAngularControlFlow,
        `${question.id}: control-flow migration must not corrupt surrounding prose`
      );
    }

    for (const [approachIndex, approach] of (question.solutionBlock?.approaches ?? []).entries()) {
      if (!approach.codeTs) continue;
      for (const [templateIndex, template] of inlineAngularTemplates(approach.codeTs).entries()) {
        parseAngularTemplate(
          template,
          `cdn/questions/angular/coding.json#${question.id}.approaches[${approachIndex}].template[${templateIndex}]`
        );
      }
    }

    for (const reference of [question.sdk?.asset, question.solutionAsset].filter(Boolean)) {
      const relative = referencedAngularAsset(question, reference);
      referencedAssets.add(relative);
      assertMirror(relative);
      const asset = json(`cdn/${relative}`);
      const serialized = JSON.stringify(asset);

      if (!legacyAllowed) {
        assert.doesNotMatch(
          serialized,
          deprecatedAngularControlFlow,
          `${relative}: modern Angular asset must not use deprecated structural directives`
        );
        assert.doesNotMatch(
          serialized,
          malformedAngularControlFlow,
          `${relative}: control-flow migration must not corrupt surrounding text`
        );
      }
      if (serialized.includes('track $index')) {
        assert.ok(
          angularIndexTrackAllowlist.has(relative),
          `${relative}: $index tracking is reserved for fixed primitive collections`
        );
      }

      for (const [file, value] of Object.entries(asset.files ?? {})) {
        const source = typeof value === 'string' ? value : value.code;
        if (file.endsWith('.html') && file !== '/src/index.html') {
          parseAngularTemplate(source, `${relative}${file}`);
        }
        if (file.endsWith('.ts')) {
          for (const [templateIndex, template] of inlineAngularTemplates(source).entries()) {
            parseAngularTemplate(template, `${relative}${file}#template-${templateIndex}`);
          }
        }
      }
    }
  }

  assert.equal(
    referencedAssets.size,
    questions.length * 2,
    'Every Angular coding prompt must own distinct starter and solution assets'
  );
}

function assertCounterPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-counter',
      starter: 'assets/sb/react/question/react-counter.v1.json',
      solution: 'assets/sb/react/solution/react-counter-solution.v1.json',
    },
    angular: {
      id: 'angular-counter-starter',
      starter: 'assets/sb/angular/question/angular-counter.v2.json',
      solution: 'assets/sb/angular/solution/angular-counter-solution.v2.json',
    },
    vue: {
      id: 'vue-counter',
      starter: 'assets/sb/vue/question/vue-counter.v1.json',
      solution: 'assets/sb/vue/solution/vue-counter-solution.v1.json',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Counter question must exist`);
    assert.equal(question.sdk?.asset, expected.starter, `${framework}: normal Counter starter changed`);
    assert.equal(question.solutionAsset, expected.solution, `${framework}: normal Counter solution changed`);
    assert.deepEqual(
      (question.frameworkTests ?? []).map((test) => test.id),
      ['counter-basic-flow'],
      `${framework}: normal Counter checks must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/counter.v1.json',
      `${framework}: Counter must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(pressureRefs.size, 1, 'All Counter frameworks must share one pressure scenario');
  const scenario = json('cdn/questions/pressure-modes/counter.v1.json');
  assert.equal(scenario.id, 'counter-pressure-v1');
  assert.equal(scenario.access, 'free');
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-counter',
    angular: 'angular-counter-starter',
    vue: 'vue-counter',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    ['base-correctness', 'configurable-step', 'keyboard-accessibility', 'auto-lifecycle']
  );
  const pressureCheckCount = scenario.rounds.reduce(
    (total, round) => total + (round.frameworkTests?.length ?? 0),
    0
  );
  assert.equal(pressureCheckCount, 5, 'Counter pressure mode must stay within the six-check runner budget');
  assert.ok(
    scenario.rounds
      .flatMap((round) => round.frameworkTests ?? [])
      .flatMap((test) => test.steps ?? [])
      .some((step) => step.type === 'expectNoPreviewTimers'),
    'Counter pressure lifecycle must assert that component teardown clears its interval'
  );

  const solutionMarkers = {
    react: [/useEffect/, /clearInterval/, /aria-live/],
    angular: [/implements OnDestroy/, /clearInterval/, /aria-live/],
    vue: [/onUnmounted/, /clearInterval/, /aria-live/],
  };
  for (const framework of Object.keys(expectedQuestions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.match(
      reference,
      new RegExp(`^assets/sb/${framework}/solution/.+\\.json$`),
      `${framework}: invalid pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:counter-pressure-solution`);
    const files = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:counter-pressure-solution`
    );
    const source = Object.entries(files)
      .filter(([file]) => file.startsWith('src/'))
      .map(([file, code]) => `${file}\n${code}`)
      .join('\n');
    for (const marker of solutionMarkers[framework]) {
      assert.match(source, marker, `${framework}: pressure solution is missing ${marker}`);
    }
  }

  for (const builder of [
    'frontend/src/app/core/utils/react-preview-builder.ts',
    'frontend/src/app/core/utils/angular-preview-builder.ts',
    'frontend/src/app/core/utils/vue-preview-builder.ts',
  ]) {
    const source = read(builder);
    assert.match(source, /__FA_UNMOUNT_PREVIEW/, `${builder}: missing preview teardown hook`);
    assert.match(source, /__FA_GET_PREVIEW_LEAKS/, `${builder}: missing preview leak instrumentation`);
    assert.match(source, /__FA_MARK_PREVIEW_TIMER_BASELINE/, `${builder}: missing timer baseline hook`);
    assert.match(source, /__FA_GET_PREVIEW_TIMER_LEAKS/, `${builder}: missing scoped timer leak hook`);
    assert.match(source, /setInterval/, `${builder}: interval leaks must be instrumented`);
  }
}

function assertDebouncedSearchPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-debounced-search',
      starter: 'assets/sb/react/question/react-debounced-search.v1.json',
      solution: 'assets/sb/react/solution/react-debounced-search-solution.v1.json',
    },
    angular: {
      id: 'angular-debounced-search',
      starter: 'assets/sb/angular/question/angular-debounced-search.v2.json',
      solution: 'assets/sb/angular/solution/angular-debounced-search-solution.v2.json',
    },
    vue: {
      id: 'vue-debounced-search',
      starter: 'assets/sb/vue/question/vue-debounced-search.v1.json',
      solution: 'assets/sb/vue/solution/vue-debounced-search-solution.v1.json',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Debounced Search question must exist`);
    assert.equal(
      question.access,
      'premium',
      `${framework}: Debounced Search pressure entry must stay premium`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Debounced Search starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Debounced Search solution changed`
    );
    assert.deepEqual(
      (question.frameworkTests ?? []).map((test) => test.id),
      ['debounced-search-results'],
      `${framework}: normal Debounced Search checks must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/debounced-search.v1.json',
      `${framework}: Debounced Search must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Debounced Search frameworks must share one pressure scenario'
  );
  const scenario = json('cdn/questions/pressure-modes/debounced-search.v1.json');
  assert.equal(scenario.id, 'debounced-search-pressure-v1');
  assert.equal(scenario.family, 'debounced-search');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-debounced-search',
    angular: 'angular-debounced-search',
    vue: 'vue-debounced-search',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    ['base-debounce', 'state-recovery', 'latest-query-wins', 'accessible-lifecycle']
  );
  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Debounced Search pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.equal(checks.length, 5);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-debounce-base',
      'pressure-debounce-recovery',
      'pressure-debounce-latest-query',
      'pressure-debounce-aria',
      'pressure-debounce-cleanup',
    ]
  );
  const checksById = Object.fromEntries(checks.map((test) => [test.id, test]));
  const baseSteps = checksById['pressure-debounce-base'].steps;
  assert.deepEqual(
    baseSteps.filter((step) => step.type === 'setValue').map((step) => step.value),
    ['Bob', 'Alice'],
    'Base debounce must distinguish the stale and final result sets'
  );
  assert.deepEqual(
    baseSteps.filter((step) => step.type === 'wait').map((step) => step.durationMs),
    [150, 900],
    'Base debounce must sample after the stale response but before the final response'
  );

  const recoverySteps = checksById['pressure-debounce-recovery'].steps;
  const whitespaceStepIndex = recoverySteps.findIndex(
    (step) => step.type === 'setValue' && step.value.trim() === ''
  );
  assert.equal(
    recoverySteps[whitespaceStepIndex + 1]?.type,
    'expectText',
    'Whitespace input must reset the status immediately without a debounce allowance'
  );

  const latestSteps = checksById['pressure-debounce-latest-query'].steps;
  assert.deepEqual(
    latestSteps.filter((step) => step.type === 'wait').map((step) => step.durationMs),
    [850, 350],
    'Latest-query check must inspect the stale-response window before Bob starts'
  );
  const staleAliceAssertion = latestSteps.findIndex(
    (step) => step.type === 'expectNoText' && step.text === 'Alice Johnson'
  );
  const bobResultAssertion = latestSteps.findIndex(
    (step) => step.type === 'waitForText' && step.text === 'Bob'
  );
  assert.ok(
    staleAliceAssertion > 0 && staleAliceAssertion < bobResultAssertion,
    'Latest-query check must prove Alice never renders before waiting for Bob'
  );

  const cleanupSteps = checksById['pressure-debounce-cleanup'].steps;
  assert.deepEqual(
    cleanupSteps.map((step) => step.type),
    ['setValue', 'wait', 'setValue', 'unmountPreview', 'expectNoPreviewTimers'],
    'Cleanup must cover an active request and a pending replacement debounce together'
  );
  assert.deepEqual(
    cleanupSteps.filter((step) => step.type === 'setValue').map((step) => step.value),
    ['Alice', 'Bob']
  );
  const serializedChecks = JSON.stringify(checks);
  for (const requiredSignal of [
    'Alice',
    'Bob',
    'Fake API error',
    'No results found',
    'aria-describedby',
    'aria-controls',
    'aria-busy',
    'aria-live',
    'aria-atomic',
    'alert',
    'unmountPreview',
    'expectNoPreviewTimers',
  ]) {
    assert.ok(
      serializedChecks.includes(requiredSignal),
      `Debounced Search pressure checks are missing ${requiredSignal}`
    );
  }

  const solutionMarkers = {
    react: [/useEffect/, /AbortController/, /clearTimeout/, /aria-controls/, /aria-busy/, /aria-live/, /aria-atomic/],
    angular: [/implements OnDestroy/, /tap\(\(rawTerm\)/, /debounceTime/, /switchMap/, /takeUntil/, /aria-controls/, /aria-busy/, /aria-live/, /aria-atomic/],
    vue: [/watch/, /onUnmounted/, /AbortController/, /clearTimeout/, /aria-controls/, /aria-busy/, /aria-live/, /aria-atomic/],
  };
  for (const framework of Object.keys(expectedQuestions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      `assets/sb/${framework}/solution/${framework}-debounced-search-pressure-solution.v1.json`,
      `${framework}: invalid Debounced Search pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:debounced-search-pressure-solution`);
    const files = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:debounced-search-pressure-solution`
    );
    const source = Object.entries(files)
      .filter(([file]) => file.startsWith('src/'))
      .map(([file, code]) => `${file}\n${code}`)
      .join('\n');
    for (const marker of solutionMarkers[framework]) {
      assert.match(
        source,
        marker,
        `${framework}: Debounced Search pressure solution is missing ${marker}`
      );
    }
  }

  const angularPreviewBuilder = read(
    'frontend/src/app/core/utils/angular-preview-builder.ts'
  );
  const pinnedRxjsBundle = 'https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm';
  assert.equal(
    angularPreviewBuilder.split(pinnedRxjsBundle).length - 1,
    2,
    'Angular preview must share one pinned RxJS bundle across both import specifiers'
  );
  assert.doesNotMatch(
    angularPreviewBuilder,
    /esm\.sh\/rxjs/,
    'Angular preview must not fan RxJS out through esm.sh submodule requests'
  );
}

function assertTodoListPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-todo-list',
      starter: 'assets/sb/react/question/react-todo-list.v1.json',
      solution: 'assets/sb/react/solution/react-todo-list-solution.v1.json',
    },
    angular: {
      id: 'angular-todo-list-starter',
      starter: 'assets/sb/angular/question/angular-todo-list.v2.json',
      solution: 'assets/sb/angular/solution/angular-todo-list-solution.v2.json',
    },
    vue: {
      id: 'vue-todo-list',
      starter: 'assets/sb/vue/question/vue-todo-list.v2.json',
      solution: 'assets/sb/vue/solution/vue-todo-list-solution.v1.json',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Todo List question must exist`);
    assert.equal(
      question.access,
      'free',
      `${framework}: Todo List pressure entry must stay free`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Todo List starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Todo List solution changed`
    );
    assert.deepEqual(
      (question.frameworkTests ?? []).map((test) => test.id),
      ['todo-add-item'],
      `${framework}: normal Todo List checks must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/todo-list.v1.json',
      `${framework}: Todo List must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Todo List frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/todo-list.v1.json');
  assert.equal(scenario.id, 'todo-list-pressure-v1');
  assert.equal(scenario.family, 'todo-list');
  assert.equal(scenario.access, 'free');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-todo-list',
    angular: 'angular-todo-list-starter',
    vue: 'vue-todo-list',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    ['core-transitions', 'derived-filters', 'keyboard-editing', 'undo-lifecycle']
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Todo List pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.equal(checks.length, 5);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-todo-core',
      'pressure-todo-filters',
      'pressure-todo-editing',
      'pressure-todo-undo',
      'pressure-todo-cleanup',
    ]
  );
  const checksById = Object.fromEntries(checks.map((test) => [test.id, test]));

  const coreSteps = checksById['pressure-todo-core'].steps;
  assert.deepEqual(
    coreSteps.filter((step) => step.type === 'setValue').map((step) => step.value),
    ['   ', '  Buy milk  ', 'Walk dog'],
    'Core Todo List flow must cover whitespace rejection and trimmed task creation'
  );
  assert.ok(
    coreSteps.some(
      (step) =>
        step.type === 'key' && step.selector === '.input' && step.key === 'Enter'
    ),
    'Core Todo List flow must add through the form keyboard path'
  );
  assert.ok(
    coreSteps.some(
      (step) =>
        step.type === 'expectDisabled' &&
        step.selector === '.primary' &&
        step.disabled === true
    ),
    'Core Todo List flow must keep Add disabled for invalid input'
  );
  assert.ok(
    coreSteps.some(
      (step) =>
        step.type === 'expectValue' && step.selector === '.input' && step.value === ''
    ),
    'Core Todo List flow must clear the input after adding'
  );

  const filterSteps = checksById['pressure-todo-filters'].steps;
  assert.deepEqual(
    filterSteps
      .filter((step) => step.type === 'click' && step.selector.startsWith('.filter-'))
      .map((step) => step.selector),
    ['.filter-active', '.filter-completed', '.filter-all'],
    'Todo filters must exercise Active, Completed, and All in order'
  );
  assert.ok(
    filterSteps.some(
      (step) =>
        step.type === 'expectAttribute' &&
        step.selector === '.filter-active' &&
        step.attribute === 'aria-pressed' &&
        step.expected === 'true'
    ),
    'Active Todo filter must expose its pressed state'
  );
  assert.ok(
    filterSteps.some(
      (step) => step.type === 'click' && step.selector === '.clear-completed'
    ),
    'Todo filter flow must clear completed tasks without removing active tasks'
  );

  const editingSteps = checksById['pressure-todo-editing'].steps;
  assert.deepEqual(
    editingSteps.filter((step) => step.type === 'key').map((step) => step.key),
    ['Enter', 'Escape'],
    'Todo editing must commit with Enter and cancel with Escape'
  );
  assert.ok(
    editingSteps.some(
      (step) => step.type === 'expectFocused' && step.selector === '.edit-input'
    ),
    'Todo editing must focus the edit input when editing starts'
  );
  assert.ok(
    editingSteps.filter(
      (step) => step.type === 'expectFocused' && step.selector === '.edit-task'
    ).length >= 2,
    'Todo editing must restore focus after both commit and cancel'
  );

  const undoSteps = checksById['pressure-todo-undo'].steps;
  assert.ok(
    undoSteps.some(
      (step) =>
        step.type === 'expectText' &&
        step.selector === '.todo-text' &&
        step.index === 0 &&
        step.text === 'One'
    ),
    'Todo undo must restore the removed task at its original index'
  );
  assert.ok(
    undoSteps.some(
      (step) =>
        step.type === 'expectNoText' && step.selector === '.card' && step.text === 'One'
    ),
    'A newer removal must replace the prior undo opportunity'
  );
  assert.ok(
    undoSteps.some(
      (step) => step.type === 'wait' && step.durationMs === 5200
    ),
    'Todo undo must verify that the five-second recovery window expires'
  );
  const undoTimerAssertionIndexes = undoSteps
    .map((step, index) => step.type === 'expectNoPreviewTimers' ? index : -1)
    .filter((index) => index >= 0);
  const expiryWaitIndex = undoSteps.findIndex(
    (step) => step.type === 'wait' && step.durationMs === 5200
  );
  assert.equal(
    undoTimerAssertionIndexes.length,
    2,
    'Todo undo must check timers after replacement cancellation and after expiry'
  );
  assert.ok(
    undoTimerAssertionIndexes[0] < expiryWaitIndex,
    'Todo replacement timer must be checked before the expiry case can mask a leak'
  );
  assert.equal(
    undoSteps.at(-1)?.type,
    'expectNoPreviewTimers',
    'Todo replacement and expiry flow must finish with no retained timer'
  );

  const cleanupSteps = checksById['pressure-todo-cleanup'].steps;
  assert.deepEqual(
    cleanupSteps.slice(-2).map((step) => step.type),
    ['unmountPreview', 'expectNoPreviewTimers'],
    'Todo teardown must prove that the undo timer is cleared'
  );

  const serializedChecks = JSON.stringify(checks);
  for (const requiredSignal of [
    '#new-task',
    '#todo-items',
    '.todo-checkbox',
    '.todo-text',
    '.items-left',
    '.filters',
    '.filter-all',
    '.filter-active',
    '.filter-completed',
    '.edit-task',
    '.edit-input',
    '.remove-task',
    '.clear-completed',
    '.undo-bar',
    '.undo-button',
    'aria-label',
    'aria-controls',
    'aria-describedby',
    'aria-pressed',
    'aria-live',
    'aria-atomic',
    'unmountPreview',
    'expectNoPreviewTimers',
  ]) {
    assert.ok(
      serializedChecks.includes(requiredSignal),
      `Todo List pressure checks are missing ${requiredSignal}`
    );
  }

  const solutionMarkers = {
    react: [
      /useEffect/,
      /useRef/,
      /clearTimeout/,
      /pendingUndo/,
      /aria-controls/,
      /aria-describedby/,
      /aria-live/,
      /aria-atomic/,
    ],
    angular: [
      /implements OnDestroy/,
      /clearTimeout/,
      /queueMicrotask/,
      /@for\s*\([^;]+;\s*track todo\.id/,
      /aria-controls/,
      /aria-describedby/,
      /aria-live/,
      /aria-atomic/,
    ],
    vue: [
      /computed/,
      /nextTick/,
      /import \{[^}]*nextTick[^}]*\} from 'vue'/,
      /onUnmounted/,
      /clearTimeout/,
      /aria-controls/,
      /aria-describedby/,
      /aria-live/,
      /aria-atomic/,
    ],
  };
  for (const framework of Object.keys(expectedQuestions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      `assets/sb/${framework}/solution/${framework}-todo-list-pressure-solution.v1.json`,
      `${framework}: invalid Todo List pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:todo-list-pressure-solution`);
    const files = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:todo-list-pressure-solution`
    );
    const source = Object.entries(files)
      .filter(([file]) => file.startsWith('src/'))
      .map(([file, code]) => `${file}\n${code}`)
      .join('\n');
    for (const marker of solutionMarkers[framework]) {
      assert.match(
        source,
        marker,
        `${framework}: Todo List pressure solution is missing ${marker}`
      );
    }
    if (framework === 'vue') {
      assert.doesNotMatch(
        source,
        /Vue\.nextTick/,
        'Vue Todo List pressure solution must stay valid outside the custom preview runtime'
      );
    }
  }

  const vuePreviewBuilder = read('frontend/src/app/core/utils/vue-preview-builder.ts');
  assert.equal(
    (vuePreviewBuilder.match(/const \{[^}\n]*\bnextTick\b[^}\n]*\} = Vue;/g) ?? []).length,
    2,
    'Vue preview must expose nextTick for both script-setup and module-style imports'
  );
}

function assertShoppingCartPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-shopping-cart',
      starter: 'assets/sb/react/question/react-shopping-cart.v1.json',
      solution: 'assets/sb/react/solution/react-shopping-cart-solution.v1.json',
      updatedAt: '2026-01-30',
    },
    angular: {
      id: 'angular-shopping-cart-mini',
      starter: 'assets/sb/angular/question/angular-shopping-cart.v2.json',
      solution: 'assets/sb/angular/solution/angular-shopping-cart-solution.v2.json',
      updatedAt: '2026-07-15',
    },
    vue: {
      id: 'vue-shopping-cart',
      starter: 'assets/sb/vue/question/vue-shopping-cart.v1.json',
      solution: 'assets/sb/vue/solution/vue-shopping-cart-solution.v1.json',
      updatedAt: '2026-01-30',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Shopping Cart question must exist`);
    assert.equal(question.access, 'premium', `${framework}: Shopping Cart must stay premium`);
    assert.equal(
      question.difficulty,
      'intermediate',
      `${framework}: Shopping Cart difficulty changed`
    );
    assert.equal(
      question.updatedAt,
      expected.updatedAt,
      `${framework}: pressure coverage must not rewrite normal Shopping Cart updatedAt`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Shopping Cart starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Shopping Cart solution changed`
    );
    assert.deepEqual(
      (question.frameworkTests ?? []).map((test) => test.id),
      ['cart-adds-product'],
      `${framework}: normal Shopping Cart checks must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/shopping-cart.v1.json',
      `${framework}: Shopping Cart must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Shopping Cart frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/shopping-cart.v1.json');
  assert.equal(scenario.id, 'shopping-cart-pressure-v1');
  assert.equal(scenario.family, 'shopping-cart');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-shopping-cart',
    angular: 'angular-shopping-cart-mini',
    vue: 'vue-shopping-cart',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    ['core-cart-transitions', 'quantity-boundaries', 'inventory-guard', 'promo-and-checkout']
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Shopping Cart pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-cart-core',
      'pressure-cart-quantity',
      'pressure-cart-inventory',
      'pressure-cart-promo',
      'pressure-cart-checkout',
    ]
  );

  const serializedChecks = JSON.stringify(checks);
  for (const requiredSignal of [
    '.product-card',
    '.cart-row',
    '.cart-header .subtitle',
    '.qty',
    '.line-total',
    '.stock-count',
    '.cart-status',
    '2 in stock',
    'Wireless Headphones reached its stock limit.',
    '.promo-input',
    '.apply-promo',
    '.promo-feedback',
    'Promo code is invalid.',
    '10% discount applied.',
    '.subtotal',
    '.discount',
    '.grand-total',
    '$8.95',
    '$80.55',
    '.checkout-button',
    '.checkout-status',
    'Order placed.',
    'aria-describedby',
    'aria-live',
    'aria-atomic',
  ]) {
    assert.ok(
      serializedChecks.includes(requiredSignal),
      `Shopping Cart pressure checks are missing ${requiredSignal}`
    );
  }

  const coreCheck = checks.find((test) => test.id === 'pressure-cart-core');
  assert.ok(
    coreCheck.steps.some(
      (step) =>
        (step.type === 'expectCount' || step.type === 'waitForCount') &&
        step.selector === '.cart-row' &&
        step.count === 2
    ),
    'Shopping Cart core flow must prove that duplicate products merge while distinct products do not'
  );
  assert.ok(
    coreCheck.steps.some(
      (step) => step.type === 'expectText' && step.text === '$259.98'
    ),
    'Shopping Cart core flow must verify the duplicated Headphones line total'
  );

  const inventoryCheck = checks.find((test) => test.id === 'pressure-cart-inventory');
  assert.ok(
    inventoryCheck.steps.filter(
      (step) => step.type === 'expectDisabled' && step.disabled === true
    ).length >= 2,
    'Shopping Cart inventory flow must disable both Add and Increase at the stock limit'
  );
  assert.ok(
    inventoryCheck.steps.filter(
      (step) => step.type === 'expectDisabled' && step.disabled === false
    ).length >= 2,
    'Shopping Cart inventory flow must re-enable both controls after decreasing quantity'
  );

  const promoCheck = checks.find((test) => test.id === 'pressure-cart-promo');
  assert.deepEqual(
    promoCheck.steps
      .filter((step) => step.type === 'setValue' && step.selector === '.promo-input')
      .map((step) => step.value),
    ['NOPE', '  save10  '],
    'Shopping Cart promo flow must cover invalid input and trimmed case normalization'
  );
  assert.ok(
    promoCheck.steps.filter(
      (step) =>
        step.type === 'expectText' && step.selector === '.grand-total' && step.text === '$80.55'
    ).length >= 2,
    'Shopping Cart promo flow must prove that repeated application does not stack the discount'
  );

  const checkoutCheck = checks.find((test) => test.id === 'pressure-cart-checkout');
  assert.ok(
    checkoutCheck.steps.some(
      (step) =>
        step.type === 'expectDisabled' &&
        step.selector === '.checkout-button' &&
        step.disabled === true
    ),
    'Shopping Cart checkout must stay disabled while the cart is empty'
  );
  assert.ok(
    checkoutCheck.steps.some(
      (step) =>
        step.type === 'expectValue' && step.selector === '.promo-input' && step.value === ''
    ),
    'Shopping Cart checkout must clear the applied promo input'
  );

  const commonSolutionMarkers = [
    /SAVE10/,
    /Promo code is invalid\./,
    /10% discount applied\./,
    /Order placed\./,
    /stock-count/,
    /cart-status/,
    /promo-input/,
    /promo-feedback/,
    /checkout-button/,
    /checkout-status/,
    /aria-describedby/,
    /aria-live/,
    /aria-atomic/,
  ];
  const frameworkSolutionMarkers = {
    react: [/useMemo/, /setCartItems/],
    angular: [/@for\s*\(product of products;\s*track product\.id/, /get totalQty/],
    vue: [/computed/, /ref<CartItem\[\]>/],
  };
  for (const framework of Object.keys(expectedQuestions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      `assets/sb/${framework}/solution/${framework}-shopping-cart-pressure-solution.v1.json`,
      `${framework}: invalid Shopping Cart pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:shopping-cart-pressure-solution`);
    const files = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:shopping-cart-pressure-solution`
    );
    const source = Object.entries(files)
      .filter(([file]) => file.startsWith('src/'))
      .map(([file, code]) => `${file}\n${code}`)
      .join('\n');
    for (const marker of [
      ...commonSolutionMarkers,
      ...frameworkSolutionMarkers[framework],
    ]) {
      assert.match(
        source,
        marker,
        `${framework}: Shopping Cart pressure solution is missing ${marker}`
      );
    }
  }
}

function assertChipsInputPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-chips-input-autocomplete',
      starter: 'assets/sb/react/question/react-chips-input-autocomplete.v1.json',
      solution: 'assets/sb/react/solution/react-chips-input-autocomplete-solution.v1.json',
      updatedAt: '2026-02-09',
    },
    angular: {
      id: 'angular-chips-input-autocomplete',
      starter: 'assets/sb/angular/question/angular-chips-input-autocomplete.v1.json',
      solution: 'assets/sb/angular/solution/angular-chips-input-autocomplete-solution.v1.json',
      updatedAt: '2026-07-15',
    },
    vue: {
      id: 'vue-chips-input-autocomplete',
      starter: 'assets/sb/vue/question/vue-chips-input-autocomplete.v1.json',
      solution: 'assets/sb/vue/solution/vue-chips-input-autocomplete-solution.v1.json',
      updatedAt: '2026-02-09',
    },
  };
  const expectedNormalChecks = [
    {
      id: 'chips-add-suggestion',
      name: 'Chips input adds suggestion',
      steps: [
        {
          type: 'setValue',
          selector: '.chip-input input',
          value: 'Alice',
        },
        {
          type: 'waitForCount',
          selector: '.suggestion',
          count: 1,
          timeoutMs: 800,
        },
        {
          type: 'mouseDown',
          selector: '.suggestion',
        },
        {
          type: 'waitForCount',
          selector: '.chip',
          count: 1,
        },
      ],
    },
  ];
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Invite Chips Input question must exist`);
    assert.equal(question.access, 'premium', `${framework}: Invite Chips Input must stay premium`);
    assert.equal(
      question.difficulty,
      'intermediate',
      `${framework}: Invite Chips Input difficulty changed`
    );
    assert.equal(
      question.updatedAt,
      expected.updatedAt,
      `${framework}: pressure coverage must not rewrite normal Invite Chips Input updatedAt`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Invite Chips Input starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Invite Chips Input solution changed`
    );
    assert.deepEqual(
      question.frameworkTests,
      expectedNormalChecks,
      `${framework}: normal Invite Chips Input check must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/chips-input-autocomplete.v1.json',
      `${framework}: Invite Chips Input must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Invite Chips Input frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/chips-input-autocomplete.v1.json');
  assert.equal(scenario.id, 'chips-input-autocomplete-pressure-v1');
  assert.equal(scenario.family, 'chips-input-autocomplete');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-chips-input-autocomplete',
    angular: 'angular-chips-input-autocomplete',
    vue: 'vue-chips-input-autocomplete',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    [
      'core-suggestion-selection',
      'token-normalization',
      'keyboard-lifecycle',
      'invite-limit-and-accessibility',
    ]
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Invite Chips Input pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-chips-core',
      'pressure-chips-normalization',
      'pressure-chips-keyboard',
      'pressure-chips-limit',
      'pressure-chips-accessibility',
    ]
  );

  const serializedChecks = JSON.stringify(checks);
  for (const requiredSignal of [
    '.chip-input',
    '.suggestion',
    '.chip',
    '.chip-remove',
    '.invite-limit',
    '.invite-status',
    'Ada Lovelace',
    'Team@Example.com is already invited.',
    'invite-option-ethan',
    'invite-option-ada',
    'Invite limit reached (5 of 5).',
    'Invite limit reached. Remove a person to add another.',
    'aria-activedescendant',
    'aria-autocomplete',
    'aria-controls',
    'aria-describedby',
    'aria-live',
    'aria-atomic',
    'unmountPreview',
    'expectNoPreviewTimers',
  ]) {
    assert.ok(
      serializedChecks.includes(requiredSignal),
      `Invite Chips Input pressure checks are missing ${requiredSignal}`
    );
  }

  const coreCheck = checks.find((test) => test.id === 'pressure-chips-core');
  assert.ok(
    coreCheck.steps.some(
      (step) =>
        step.type === 'click' &&
        step.selector === '.suggestion'
    ),
    'Invite Chips Input core flow must prove that the unchanged click contract selects a suggestion'
  );
  assert.deepEqual(
    coreCheck.steps
      .filter((step) => step.type === 'setValue' && step.selector === '.chip-input')
      .map((step) => step.value),
    ['ADA', 'ada@'],
    'Invite Chips Input core flow must cover case-insensitive filtering and selected-user exclusion'
  );

  const normalizationCheck = checks.find(
    (test) => test.id === 'pressure-chips-normalization'
  );
  assert.ok(
    normalizationCheck.steps.some(
      (step) => step.type === 'key' && step.key === ','
    ),
    'Invite Chips Input normalization must cover comma tokenization'
  );
  assert.ok(
    normalizationCheck.steps.some(
      (step) =>
        step.type === 'click' &&
        step.selector === '.chip-remove' &&
        step.index === 0
    ),
    'Invite Chips Input normalization must prove targeted removal'
  );

  const keyboardCheck = checks.find((test) => test.id === 'pressure-chips-keyboard');
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'key')
      .map((step) => step.key),
    ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Backspace'],
    'Invite Chips Input keyboard flow must cover wrapping, selection, dismissal, and deletion'
  );
  assert.ok(
    keyboardCheck.steps.filter((step) => step.type === 'expectFocused').length >= 2,
    'Invite Chips Input keyboard flow must keep focus on the actual input'
  );

  const limitCheck = checks.find((test) => test.id === 'pressure-chips-limit');
  assert.deepEqual(
    limitCheck.steps
      .filter((step) => step.type === 'setValue' && step.selector === '.chip-input')
      .map((step) => step.value),
    ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Six'],
    'Invite Chips Input limit flow must prove the ceiling and re-enable path'
  );
  assert.ok(
    limitCheck.steps.some(
      (step) => step.type === 'expectDisabled' && step.disabled === true
    ),
    'Invite Chips Input must disable entry at five chips'
  );
  assert.ok(
    limitCheck.steps.some(
      (step) => step.type === 'expectDisabled' && step.disabled === false
    ),
    'Invite Chips Input must re-enable entry after removal'
  );

  const accessibilityCheck = checks.find(
    (test) => test.id === 'pressure-chips-accessibility'
  );
  assert.ok(
    accessibilityCheck.steps.some((step) => step.type === 'unmountPreview') &&
      accessibilityCheck.steps.some((step) => step.type === 'expectNoPreviewTimers'),
    'Invite Chips Input accessibility flow must unmount cleanly without timers'
  );

  const commonSolutionMarkers = [
    /Ada Lovelace/,
    /MAX_(?:CHIPS|INVITES)\s*=\s*5/,
    /MAX_SUGGESTIONS\s*=\s*6/,
    /invite-option-/,
    /chip-input/,
    /chip-remove/,
    /invite-limit/,
    /invite-status/,
    /aria-autocomplete/,
    /aria-controls/,
    /aria-describedby/,
    /aria-live/,
    /aria-atomic/,
    /Invite limit reached/,
  ];
  const frameworkSolutionMarkers = {
    react: [
      /useMemo/,
      /useEffect/,
      /document\.removeEventListener/,
      /onMouseDown/,
      /onClick/,
    ],
    angular: [
      /get suggestions/,
      /(?:@HostListener|Renderer2)/,
      /ngOnDestroy/,
      /removeDocumentMouseDown/,
      /\(mousedown\)/,
      /\(click\)/,
    ],
    vue: [
      /computed/,
      /onBeforeUnmount/,
      /document\.removeEventListener/,
      /@mousedown/,
      /@click/,
    ],
  };
  for (const framework of Object.keys(expectedQuestions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      `assets/sb/${framework}/solution/${framework}-chips-input-autocomplete-pressure-solution.v1.json`,
      `${framework}: invalid Invite Chips Input pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:chips-input-autocomplete-pressure-solution`);
    const files = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:chips-input-autocomplete-pressure-solution`
    );
    const source = Object.entries(files)
      .filter(([file]) => file.startsWith('src/'))
      .map(([file, code]) => `${file}\n${code}`)
      .join('\n');
    for (const marker of [
      ...commonSolutionMarkers,
      ...frameworkSolutionMarkers[framework],
    ]) {
      assert.match(
        source,
        marker,
        `${framework}: Invite Chips Input pressure solution is missing ${marker}`
      );
    }
    assert.match(
      source,
      /<input[\s\S]{0,700}class(?:Name)?="chip-input"/,
      `${framework}: .chip-input must be the actual input in the pressure solution`
    );
  }
}

function assertAccordionFaqPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-accordion-faq',
      starter: 'assets/sb/react/question/react-accordion-faq.v1.json',
      solution: 'assets/sb/react/solution/react-accordion-faq-solution.v1.json',
      updatedAt: '2026-01-30',
    },
    angular: {
      id: 'angular-faq-accordion',
      starter: 'assets/sb/angular/question/angular-faq-accordion.v2.json',
      solution: 'assets/sb/angular/solution/angular-faq-accordion-solution.v2.json',
      updatedAt: '2026-07-15',
    },
    vue: {
      id: 'vue-accordion-faq',
      starter: 'assets/sb/vue/question/vue-accordion-faq.v1.json',
      solution: 'assets/sb/vue/solution/vue-accordion-faq-solution.v1.json',
      updatedAt: '2026-01-30',
    },
  };
  const expectedNormalChecks = [
    {
      id: 'accordion-toggle-answer',
      name: 'Accordion toggles answer',
      steps: [
        {
          type: 'expectCount',
          selector: '.faq-body',
          count: 0,
        },
        {
          type: 'click',
          selector: '.faq-header',
        },
        {
          type: 'waitForCount',
          selector: '.faq-body',
          count: 1,
        },
      ],
    },
  ];
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Accordion FAQ question must exist`);
    assert.equal(question.access, 'premium', `${framework}: Accordion FAQ must stay premium`);
    assert.equal(
      question.difficulty,
      'intermediate',
      `${framework}: Accordion FAQ difficulty changed`
    );
    assert.equal(
      question.updatedAt,
      expected.updatedAt,
      `${framework}: pressure coverage must not rewrite normal Accordion FAQ updatedAt`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Accordion FAQ starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Accordion FAQ solution changed`
    );
    assert.deepEqual(
      question.frameworkTests,
      expectedNormalChecks,
      `${framework}: normal Accordion FAQ check must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/accordion-faq.v1.json',
      `${framework}: Accordion FAQ must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Accordion FAQ frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/accordion-faq.v1.json');
  assert.equal(scenario.id, 'accordion-faq-pressure-v1');
  assert.equal(scenario.family, 'accordion-faq');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-accordion-faq',
    angular: 'angular-faq-accordion',
    vue: 'vue-accordion-faq',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    [
      'core-disclosure',
      'mode-transition-invariant',
      'keyboard-focus-navigation',
      'accessible-disclosure-contract',
    ]
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Accordion FAQ pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-accordion-toggle',
      'pressure-accordion-modes',
      'pressure-accordion-keyboard',
      'pressure-accordion-aria',
      'pressure-accordion-native-buttons',
    ]
  );
  for (const check of checks) {
    assert.ok(check.steps?.length, `${check.id}: pressure check must be independently runnable`);
  }

  const modeCheck = checks.find((test) => test.id === 'pressure-accordion-modes');
  assert.equal(
    modeCheck.steps.filter(
      (step) => step.type === 'click' && step.selector === '.mode-toggle input'
    ).length,
    2,
    'Accordion FAQ mode flow must enter and leave multi-open mode'
  );
  assert.ok(
    modeCheck.steps.some(
      (step) =>
        step.type === 'waitForCount' &&
        step.selector === '.faq-body' &&
        step.count === 2
    ),
    'Accordion FAQ mode flow must prove that multi-open mode can show two panels'
  );
  const finalModeSteps = modeCheck.steps.slice(-3);
  assert.deepEqual(
    finalModeSteps,
    [
      {
        type: 'waitForCount',
        selector: '.faq-body',
        count: 1,
        timeoutMs: 700,
      },
      {
        type: 'expectAttribute',
        selector: '.faq-header',
        index: 0,
        attribute: 'aria-expanded',
        expected: 'false',
      },
      {
        type: 'expectAttribute',
        selector: '.faq-header',
        index: 1,
        attribute: 'aria-expanded',
        expected: 'true',
      },
    ],
    'Accordion FAQ multi-to-single normalization must retain first-opened faq-2'
  );

  const keyboardCheck = checks.find((test) => test.id === 'pressure-accordion-keyboard');
  const keyboardSteps = keyboardCheck.steps.filter((step) => step.type === 'key');
  assert.deepEqual(
    keyboardSteps.map((step) => ({ selector: step.selector, index: step.index, key: step.key })),
    [
      { selector: '.faq-header', index: 0, key: 'ArrowUp' },
      { selector: '.faq-header', index: 3, key: 'ArrowDown' },
      { selector: '.faq-header', index: 0, key: 'ArrowDown' },
      { selector: '.faq-header', index: 1, key: 'Home' },
      { selector: '.faq-header', index: 0, key: 'End' },
    ],
    'Accordion FAQ keyboard flow must cover wrapping arrows and Home/End on question triggers'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'expectFocused')
      .map((step) => ({ selector: step.selector, index: step.index })),
    [
      { selector: '.faq-header', index: 3 },
      { selector: '.faq-header', index: 0 },
      { selector: '.faq-header', index: 1 },
      { selector: '.faq-header', index: 0 },
      { selector: '.faq-header', index: 3 },
    ],
    'Accordion FAQ keyboard flow must assert the exact wrapped focus destinations'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'expectCount' && step.selector === '.faq-body')
      .map((step) => step.count),
    [0, 0],
    'Accordion FAQ focus navigation must leave disclosure state unchanged'
  );

  const ariaCheck = checks.find((test) => test.id === 'pressure-accordion-aria');
  for (let itemNumber = 1; itemNumber <= 4; itemNumber += 1) {
    const itemIndex = itemNumber - 1;
    assert.ok(
      ariaCheck.steps.some(
        (step) =>
          step.type === 'expectAttribute' &&
          step.selector === '.faq-header' &&
          step.index === itemIndex &&
          step.attribute === 'id' &&
          step.expected === `faq-trigger-faq-${itemNumber}`
      ),
      `Accordion FAQ ARIA flow must keep stable trigger id faq-trigger-faq-${itemNumber}`
    );
    assert.ok(
      ariaCheck.steps.some(
        (step) =>
          step.type === 'expectAttribute' &&
          step.selector === '.faq-header' &&
          step.index === itemIndex &&
          step.attribute === 'aria-controls' &&
          step.expected === `faq-panel-faq-${itemNumber}`
      ),
      `Accordion FAQ ARIA flow must connect faq-${itemNumber} to faq-panel-faq-${itemNumber}`
    );
  }
  for (const expectedStep of [
    {
      type: 'expectCount',
      selector: '.indicator[aria-hidden="true"]',
      count: 4,
    },
    {
      type: 'expectAttribute',
      selector: '.faq-body',
      attribute: 'id',
      expected: 'faq-panel-faq-1',
    },
    {
      type: 'expectAttribute',
      selector: '.faq-body',
      attribute: 'role',
      expected: 'region',
    },
    {
      type: 'expectAttribute',
      selector: '.faq-body',
      attribute: 'aria-labelledby',
      expected: 'faq-trigger-faq-1',
    },
  ]) {
    assert.ok(
      ariaCheck.steps.some((step) =>
        Object.entries(expectedStep).every(([key, value]) => step[key] === value)
      ),
      `Accordion FAQ ARIA flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  const nativeButtonCheck = checks.find(
    (test) => test.id === 'pressure-accordion-native-buttons'
  );
  assert.ok(
    nativeButtonCheck.steps.some(
      (step) =>
        step.type === 'expectCount' &&
        step.selector === 'button.faq-header' &&
        step.count === 4
    ),
    'Accordion FAQ native-button flow must prove every trigger is a button'
  );
  assert.equal(
    nativeButtonCheck.steps.filter(
      (step) =>
        step.type === 'expectAttribute' &&
        step.selector === 'button.faq-header' &&
        step.attribute === 'type' &&
        step.expected === 'button'
    ).length,
    4,
    'Accordion FAQ native-button flow must guard the type of every trigger'
  );

  const expectedPressureSolutions = {
    react: 'assets/sb/react/solution/react-accordion-faq-pressure-solution.v1.json',
    angular: 'assets/sb/angular/solution/angular-faq-accordion-pressure-solution.v1.json',
    vue: 'assets/sb/vue/solution/vue-accordion-faq-pressure-solution.v1.json',
  };
  for (const [framework, expectedReference] of Object.entries(expectedPressureSolutions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      expectedReference,
      `${framework}: invalid Accordion FAQ pressure solution reference`
    );
    assertMirror(
      reference.replace(/^assets\//, ''),
      `${framework}:accordion-faq-pressure-solution`
    );
  }
}

function assertTicTacToePressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-tictactoe',
      starter: 'assets/sb/react/question/react-tictactoe.v1.json',
      solution: 'assets/sb/react/solution/react-tictactoe-solution.v1.json',
      updatedAt: '2026-01-30',
    },
    angular: {
      id: 'angular-tictactoe-starter',
      starter: 'assets/sb/angular/question/angular-tictactoe.v1.json',
      solution: 'assets/sb/angular/solution/angular-tictactoe-solution.v1.json',
      updatedAt: '2026-07-15',
    },
    vue: {
      id: 'vue-tictactoe',
      starter: 'assets/sb/vue/question/vue-tictactoe.v1.json',
      solution: 'assets/sb/vue/solution/vue-tictactoe-solution.v1.json',
      updatedAt: '2026-01-30',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Tic-Tac-Toe question must exist`);
    assert.equal(question.access, 'premium', `${framework}: Tic-Tac-Toe must stay premium`);
    assert.equal(question.difficulty, 'easy', `${framework}: Tic-Tac-Toe difficulty changed`);
    assert.equal(
      question.updatedAt,
      expected.updatedAt,
      `${framework}: pressure coverage must not rewrite normal Tic-Tac-Toe updatedAt`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Tic-Tac-Toe starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Tic-Tac-Toe solution changed`
    );
    assert.equal(
      Object.hasOwn(question, 'frameworkTests'),
      false,
      `${framework}: pressure coverage must not introduce or rewrite normal Tic-Tac-Toe checks`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/tic-tac-toe.v1.json',
      `${framework}: Tic-Tac-Toe must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Tic-Tac-Toe frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/tic-tac-toe.v1.json');
  assert.equal(scenario.id, 'tic-tac-toe-pressure-v1');
  assert.equal(scenario.family, 'tic-tac-toe');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-tictactoe',
    angular: 'angular-tictactoe-starter',
    vue: 'vue-tictactoe',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    [
      'core-turn-invariants',
      'outcome-and-reset',
      'branching-history',
      'accessible-grid-navigation',
    ]
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Tic-Tac-Toe pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-tictactoe-core-play',
      'pressure-tictactoe-outcomes-reset',
      'pressure-tictactoe-history',
      'pressure-tictactoe-keyboard-grid',
      'pressure-tictactoe-aria',
    ]
  );
  for (const check of checks) {
    assert.ok(check.steps?.length, `${check.id}: pressure check must be independently runnable`);
  }

  const coreCheck = checks.find((test) => test.id === 'pressure-tictactoe-core-play');
  assert.deepEqual(
    coreCheck.steps
      .filter((step) => step.type === 'click' && step.selector === '.cell')
      .map((step) => step.index),
    [0, 0, 4],
    'Tic-Tac-Toe core flow must prove occupied-cell rejection without advancing the turn'
  );
  assert.ok(
    coreCheck.steps.some(
      (step) =>
        step.type === 'expectAttribute' &&
        step.selector === '.cell' &&
        step.index === 0 &&
        step.attribute === 'data-mark' &&
        step.expected === 'X'
    ) &&
      coreCheck.steps.some(
        (step) =>
          step.type === 'expectAttribute' &&
          step.selector === '.cell' &&
          step.index === 4 &&
          step.attribute === 'data-mark' &&
          step.expected === 'O'
      ),
    'Tic-Tac-Toe core flow must verify alternating X and O marks'
  );

  const outcomeCheck = checks.find(
    (test) => test.id === 'pressure-tictactoe-outcomes-reset'
  );
  assert.deepEqual(
    outcomeCheck.steps
      .filter((step) => step.type === 'click' && step.selector === '.cell')
      .map((step) => step.index),
    [0, 3, 1, 4, 2, 8, 0, 1, 2, 4, 3, 5, 7, 6, 8],
    'Tic-Tac-Toe outcome flow must cover a win, rejected terminal move, and deterministic draw'
  );
  assert.equal(
    outcomeCheck.steps.filter(
      (step) => step.type === 'click' && step.selector === '.reset'
    ).length,
    2,
    'Tic-Tac-Toe outcome flow must reset after both terminal outcomes'
  );
  assert.deepEqual(
    outcomeCheck.steps
      .filter(
        (step) =>
          step.type === 'expectDisabled' &&
          (step.selector === '.undo' || step.selector === '.redo')
      )
      .map((step) => ({ selector: step.selector, disabled: step.disabled })),
    [
      { selector: '.undo', disabled: true },
      { selector: '.redo', disabled: true },
      { selector: '.undo', disabled: true },
      { selector: '.redo', disabled: true },
      { selector: '.undo', disabled: true },
      { selector: '.redo', disabled: true },
    ],
    'Tic-Tac-Toe reset flow must clear history and restore both native disabled boundaries'
  );
  for (const status of ['Winner: X', 'Draw', 'Next: X']) {
    assert.ok(
      outcomeCheck.steps.some(
        (step) =>
          (step.type === 'expectText' || step.type === 'waitForText') &&
          step.selector === '#game-status' &&
          step.text === status
      ),
      `Tic-Tac-Toe outcome flow must expose ${status}`
    );
  }
  assert.ok(
    outcomeCheck.steps.some(
      (step) =>
        step.type === 'expectCount' &&
        step.selector === '.cell.winning' &&
        step.count === 3
    ),
    'Tic-Tac-Toe outcome flow must expose exactly three winning cells'
  );
  assert.ok(
    outcomeCheck.steps.some(
      (step) =>
        step.type === 'expectCount' &&
        step.selector === 'button.cell:not([disabled])' &&
        step.count === 9
    ),
    'Tic-Tac-Toe terminal lockout must not natively disable grid buttons'
  );

  const historyCheck = checks.find((test) => test.id === 'pressure-tictactoe-history');
  assert.equal(
    historyCheck.steps.filter(
      (step) => step.type === 'click' && step.selector === '.undo'
    ).length,
    2,
    'Tic-Tac-Toe history flow must undo the terminal state twice'
  );
  assert.equal(
    historyCheck.steps.filter(
      (step) => step.type === 'click' && step.selector === '.redo'
    ).length,
    1,
    'Tic-Tac-Toe history flow must restore the terminal state through redo'
  );
  assert.ok(
    historyCheck.steps.some(
      (step) =>
        step.type === 'expectAttribute' &&
        step.selector === '.cell' &&
        step.index === 8 &&
        step.attribute === 'data-mark' &&
        step.expected === 'X'
    ) &&
      historyCheck.steps.some(
        (step) =>
          step.type === 'expectAttribute' &&
          step.selector === '.cell' &&
          step.index === 2 &&
          step.attribute === 'data-mark' &&
          step.expected === false
      ),
    'Tic-Tac-Toe history flow must replace the abandoned winning move with a divergent branch'
  );
  assert.deepEqual(
    historyCheck.steps
      .filter((step) => step.type === 'expectDisabled' && step.selector === '.redo')
      .map((step) => step.disabled),
    [true, true, false, true, true],
    'Tic-Tac-Toe redo boundaries must close, reopen after undo, and close after divergence'
  );

  const keyboardCheck = checks.find(
    (test) => test.id === 'pressure-tictactoe-keyboard-grid'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'key')
      .map((step) => ({ index: step.index, key: step.key })),
    [
      { index: 0, key: 'ArrowLeft' },
      { index: 2, key: 'ArrowRight' },
      { index: 0, key: 'ArrowUp' },
      { index: 6, key: 'ArrowDown' },
      { index: 0, key: 'End' },
      { index: 2, key: 'Home' },
    ],
    'Tic-Tac-Toe keyboard flow must cover row and column wrapping plus row boundaries'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'expectFocused')
      .map((step) => step.index),
    [2, 0, 6, 0, 2, 0],
    'Tic-Tac-Toe keyboard flow must assert every wrapped focus destination'
  );
  assert.ok(
    keyboardCheck.steps.some(
      (step) =>
        step.type === 'expectCount' &&
        step.selector === '.cell[data-mark]' &&
        step.count === 0
    ),
    'Tic-Tac-Toe navigation must not place a mark'
  );

  const ariaCheck = checks.find((test) => test.id === 'pressure-tictactoe-aria');
  for (let index = 0; index < 9; index += 1) {
    assert.ok(
      ariaCheck.steps.some(
        (step) =>
          step.type === 'expectAttribute' &&
          step.selector === '.cell' &&
          step.index === index &&
          step.attribute === 'id' &&
          step.expected === `tic-tac-toe-cell-${index}`
      ),
      `Tic-Tac-Toe ARIA flow must keep stable cell id tic-tac-toe-cell-${index}`
    );
  }
  for (const expectedStep of [
    {
      type: 'expectAttribute',
      selector: '.board',
      attribute: 'role',
      expected: 'grid',
    },
    {
      type: 'expectAttribute',
      selector: '.board',
      attribute: 'aria-describedby',
      expected: 'game-status',
    },
    {
      type: 'expectCount',
      selector: '.cell-slot[role="gridcell"]',
      count: 9,
    },
    {
      type: 'expectCount',
      selector: 'button.cell[type="button"]',
      count: 9,
    },
    {
      type: 'expectAttribute',
      selector: '#game-status',
      attribute: 'role',
      expected: 'status',
    },
    {
      type: 'expectAttribute',
      selector: '#game-status',
      attribute: 'aria-live',
      expected: 'polite',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-label',
      expected: 'Row 1, column 1: empty',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-label',
      expected: 'Row 1, column 1: X',
    },
  ]) {
    assert.ok(
      ariaCheck.steps.some((step) =>
        Object.entries(expectedStep).every(([key, value]) => step[key] === value)
      ),
      `Tic-Tac-Toe ARIA flow is missing ${JSON.stringify(expectedStep)}`
    );
  }
  assert.deepEqual(
    ariaCheck.steps
      .filter(
        (step) =>
          step.type === 'expectAttribute' &&
          step.selector === '.cell' &&
          step.index === 0 &&
          step.attribute === 'aria-disabled'
      )
      .map((step) => step.expected),
    ['false', 'true'],
    'Tic-Tac-Toe cell availability must move from playable to occupied through aria-disabled'
  );

  assert.equal(
    scenario.debrief?.title,
    'You kept branching game state correct under pressure',
    'Tic-Tac-Toe debrief title changed'
  );

  const expectedPressureSolutions = {
    react: 'assets/sb/react/solution/react-tictactoe-pressure-solution.v1.json',
    angular: 'assets/sb/angular/solution/angular-tictactoe-pressure-solution.v1.json',
    vue: 'assets/sb/vue/solution/vue-tictactoe-pressure-solution.v1.json',
  };
  for (const [framework, expectedReference] of Object.entries(expectedPressureSolutions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      expectedReference,
      `${framework}: invalid Tic-Tac-Toe pressure solution reference`
    );
    assertMirror(
      reference.replace(/^assets\//, ''),
      `${framework}:tic-tac-toe-pressure-solution`
    );
  }
}

function assertChessboardClickHighlightPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-chessboard-click-highlight',
      starter: 'assets/sb/react/question/react-chessboard-click-highlight.v1.json',
      solution: 'assets/sb/react/solution/react-chessboard-click-highlight-solution.v1.json',
      updatedAt: '2026-02-09',
    },
    angular: {
      id: 'angular-chessboard-click-highlight',
      starter: 'assets/sb/angular/question/angular-chessboard-click-highlight.v1.json',
      solution: 'assets/sb/angular/solution/angular-chessboard-click-highlight-solution.v1.json',
      updatedAt: '2026-07-15',
    },
    vue: {
      id: 'vue-chessboard-click-highlight',
      starter: 'assets/sb/vue/question/vue-chessboard-click-highlight.v1.json',
      solution: 'assets/sb/vue/solution/vue-chessboard-click-highlight-solution.v1.json',
      updatedAt: '2026-02-09',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Chessboard Click / Highlight question must exist`);
    assert.equal(
      question.access,
      'premium',
      `${framework}: Chessboard Click / Highlight must stay premium`
    );
    assert.equal(
      question.difficulty,
      'easy',
      `${framework}: Chessboard Click / Highlight difficulty changed`
    );
    assert.equal(
      question.updatedAt,
      expected.updatedAt,
      `${framework}: pressure coverage must not rewrite normal Chessboard updatedAt`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Chessboard starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Chessboard solution changed`
    );
    assert.equal(
      Object.hasOwn(question, 'frameworkTests'),
      false,
      `${framework}: pressure coverage must not introduce normal Chessboard checks`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/chessboard-click-highlight.v1.json',
      `${framework}: Chessboard must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Chessboard frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/chessboard-click-highlight.v1.json');
  assert.equal(scenario.id, 'chessboard-click-highlight-pressure-v1');
  assert.equal(scenario.family, 'chessboard-click-highlight');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-chessboard-click-highlight',
    angular: 'angular-chessboard-click-highlight',
    vue: 'vue-chessboard-click-highlight',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    [
      'core-single-selection',
      'dynamic-size-boundaries',
      'queen-reachable-highlights',
      'accessible-grid-navigation',
    ]
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Chessboard pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-chessboard-core-selection',
      'pressure-chessboard-resize-boundaries',
      'pressure-chessboard-queen-reachability',
      'pressure-chessboard-keyboard-grid',
      'pressure-chessboard-aria',
    ]
  );
  for (const check of checks) {
    assert.ok(check.steps?.length, `${check.id}: pressure check must be independently runnable`);
  }

  const hasStep = (check, expectedStep) => check.steps.some((step) =>
    Object.entries(expectedStep).every(([key, value]) => step[key] === value)
  );

  const coreCheck = checks.find(
    (test) => test.id === 'pressure-chessboard-core-selection'
  );
  for (const expectedStep of [
    { type: 'expectValue', selector: '#board-size', value: '8' },
    { type: 'expectCount', selector: 'button.cell', count: 64 },
    { type: 'expectCount', selector: '.cell--light', count: 32 },
    { type: 'expectCount', selector: '.cell--dark', count: 32 },
    { type: 'expectCount', selector: '.cell--active', count: 0 },
    { type: 'expectText', selector: '.selection-status', text: 'Selected: none' },
    { type: 'expectCount', selector: '.reachability-status', count: 0 },
    {
      type: 'expectText',
      selector: '.selection-status',
      text: 'Selected: row 1, column 1',
    },
    {
      type: 'expectText',
      selector: '.selection-status',
      text: 'Selected: row 2, column 3',
    },
  ]) {
    assert.ok(
      hasStep(coreCheck, expectedStep),
      `Chessboard core flow is missing ${JSON.stringify(expectedStep)}`
    );
  }
  assert.deepEqual(
    coreCheck.steps
      .filter((step) => step.type === 'click' && step.selector === '.cell')
      .map((step) => step.index),
    [0, 10],
    'Chessboard core flow must replace the first selection with a second one'
  );
  assert.deepEqual(
    coreCheck.steps
      .filter(
        (step) =>
          step.type === 'expectAttribute' &&
          step.selector === '.cell' &&
          step.attribute === 'aria-pressed'
      )
      .map((step) => ({ index: step.index, expected: step.expected })),
    [
      { index: 0, expected: 'true' },
      { index: 0, expected: 'false' },
      { index: 10, expected: 'true' },
    ],
    'Chessboard core flow must keep exactly one pressed cell as selection moves'
  );

  const resizeCheck = checks.find(
    (test) => test.id === 'pressure-chessboard-resize-boundaries'
  );
  assert.deepEqual(
    resizeCheck.steps
      .filter((step) => step.type === 'setValue' && step.selector === '#board-size')
      .map((step) => step.value),
    ['1', '21'],
    'Chessboard resize flow must exercise both clamp boundaries'
  );
  assert.deepEqual(
    resizeCheck.steps
      .filter((step) => step.type === 'expectValue' && step.selector === '#board-size')
      .map((step) => step.value),
    ['2', '20'],
    'Chessboard resize flow must clamp to 2 and 20'
  );
  assert.deepEqual(
    resizeCheck.steps
      .filter((step) => step.type === 'waitForCount' && step.selector === '.cell')
      .map((step) => ({ count: step.count, timeoutMs: step.timeoutMs })),
    [
      { count: 4, timeoutMs: 1500 },
      { count: 400, timeoutMs: 1500 },
    ],
    'Chessboard resize flow must wait for bounded 2x2 and 20x20 grids'
  );
  for (const expectedStep of [
    { type: 'expectCount', selector: '.cell--light', count: 2 },
    { type: 'expectCount', selector: '.cell--dark', count: 2 },
    { type: 'expectCount', selector: '.cell--light', count: 200 },
    { type: 'expectCount', selector: '.cell--dark', count: 200 },
  ]) {
    assert.ok(
      hasStep(resizeCheck, expectedStep),
      `Chessboard resize parity is missing ${JSON.stringify(expectedStep)}`
    );
  }
  assert.equal(
    resizeCheck.steps.filter(
      (step) =>
        step.type === 'expectCount' &&
        step.selector === '.cell--active' &&
        step.count === 0
    ).length,
    2,
    'Every Chessboard resize must clear selection'
  );
  assert.equal(
    resizeCheck.steps.filter(
      (step) =>
        step.type === 'expectCount' &&
        step.selector === '.cell--reachable' &&
        step.count === 0
    ).length,
    2,
    'Every Chessboard resize must clear derived reachability'
  );

  const queenCheck = checks.find(
    (test) => test.id === 'pressure-chessboard-queen-reachability'
  );
  assert.deepEqual(
    queenCheck.steps
      .filter((step) => step.type === 'click' && step.selector === '.cell')
      .map((step) => step.index),
    [27, 0],
    'Chessboard queen flow must cover a central square and a corner'
  );
  assert.deepEqual(
    queenCheck.steps
      .filter(
        (step) =>
          step.type === 'waitForCount' &&
          step.selector === '.cell--reachable[data-reachable="true"]'
      )
      .map((step) => step.count),
    [27, 21],
    'Chessboard queen flow must derive the correct center and corner move counts'
  );
  for (const expectedStep of [
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 27,
      attribute: 'data-reachable',
      expected: false,
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'data-reachable',
      expected: 'true',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'data-reachable',
      expected: false,
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 27,
      attribute: 'data-reachable',
      expected: 'true',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 10,
      attribute: 'data-reachable',
      expected: false,
    },
    {
      type: 'expectText',
      selector: '.selection-status',
      text: 'Selected: row 4, column 4',
    },
    { type: 'expectText', selector: '.reachability-status', text: 'Queen moves: 27' },
    {
      type: 'expectText',
      selector: '.selection-status',
      text: 'Selected: row 1, column 1',
    },
    { type: 'expectText', selector: '.reachability-status', text: 'Queen moves: 21' },
  ]) {
    assert.ok(
      hasStep(queenCheck, expectedStep),
      `Chessboard queen flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  const keyboardCheck = checks.find(
    (test) => test.id === 'pressure-chessboard-keyboard-grid'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'key')
      .map((step) => ({ index: step.index, key: step.key })),
    [
      { index: 0, key: 'ArrowLeft' },
      { index: 7, key: 'ArrowRight' },
      { index: 0, key: 'ArrowUp' },
      { index: 56, key: 'ArrowDown' },
      { index: 10, key: 'Home' },
      { index: 8, key: 'End' },
    ],
    'Chessboard keyboard flow must cover both wrapped axes and row boundaries'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'expectFocused')
      .map((step) => step.index),
    [7, 0, 56, 0, 8, 15],
    'Chessboard keyboard flow must assert every focus destination'
  );
  for (const expectedStep of [
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'tabindex',
      expected: '0',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 15,
      attribute: 'tabindex',
      expected: '0',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 8,
      attribute: 'tabindex',
      expected: '-1',
    },
    { type: 'expectCount', selector: '.cell--active', count: 0 },
    { type: 'expectCount', selector: '.cell--reachable', count: 0 },
    { type: 'expectText', selector: '.selection-status', text: 'Selected: none' },
    { type: 'expectCount', selector: '.reachability-status', count: 0 },
  ]) {
    assert.ok(
      hasStep(keyboardCheck, expectedStep),
      `Chessboard keyboard flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  const ariaCheck = checks.find((test) => test.id === 'pressure-chessboard-aria');
  for (const expectedStep of [
    { type: 'expectAttribute', selector: '#board-size', attribute: 'type', expected: 'number' },
    { type: 'expectAttribute', selector: '#board-size', attribute: 'min', expected: '2' },
    { type: 'expectAttribute', selector: '#board-size', attribute: 'max', expected: '20' },
    { type: 'expectAttribute', selector: '.board', attribute: 'role', expected: 'grid' },
    {
      type: 'expectAttribute',
      selector: '.board',
      attribute: 'aria-label',
      expected: 'Interactive chessboard',
    },
    {
      type: 'expectAttribute',
      selector: '.board',
      attribute: 'aria-describedby',
      expected: 'board-status',
    },
    { type: 'expectAttribute', selector: '.board', attribute: 'aria-rowcount', expected: '8' },
    { type: 'expectAttribute', selector: '.board', attribute: 'aria-colcount', expected: '8' },
    {
      type: 'expectAttribute',
      selector: '#board-status',
      attribute: 'role',
      expected: 'status',
    },
    {
      type: 'expectAttribute',
      selector: '#board-status',
      attribute: 'aria-live',
      expected: 'polite',
    },
    {
      type: 'expectCount',
      selector: 'button.cell[type="button"][role="gridcell"]',
      count: 64,
    },
    { type: 'expectCount', selector: 'button.cell:not([disabled])', count: 64 },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'id',
      expected: 'chessboard-cell-0-0',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'data-row',
      expected: '0',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'data-col',
      expected: '0',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-rowindex',
      expected: '1',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-colindex',
      expected: '1',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-pressed',
      expected: 'false',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-label',
      expected: 'Row 1, column 1',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 63,
      attribute: 'id',
      expected: 'chessboard-cell-7-7',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 63,
      attribute: 'data-row',
      expected: '7',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 63,
      attribute: 'data-col',
      expected: '7',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 63,
      attribute: 'aria-rowindex',
      expected: '8',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 63,
      attribute: 'aria-colindex',
      expected: '8',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-pressed',
      expected: 'true',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'aria-label',
      expected: 'Row 1, column 1, selected',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 0,
      attribute: 'data-reachable',
      expected: false,
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 1,
      attribute: 'data-reachable',
      expected: 'true',
    },
    {
      type: 'expectAttribute',
      selector: '.cell',
      index: 1,
      attribute: 'aria-label',
      expected: 'Row 1, column 2, reachable by queen',
    },
  ]) {
    assert.ok(
      hasStep(ariaCheck, expectedStep),
      `Chessboard ARIA flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  assert.equal(
    scenario.debrief?.title,
    'You kept dynamic board state predictable under pressure',
    'Chessboard pressure debrief title changed'
  );

  const expectedPressureSolutions = {
    react: 'assets/sb/react/solution/react-chessboard-click-highlight-pressure-solution.v1.json',
    angular: 'assets/sb/angular/solution/angular-chessboard-click-highlight-pressure-solution.v1.json',
    vue: 'assets/sb/vue/solution/vue-chessboard-click-highlight-pressure-solution.v1.json',
  };
  const frameworkSourceMarkers = {
    react: [
      /useRef<Array<HTMLButtonElement \| null>>/,
      /cellRefs\.current\[index\]\?\.focus\(\)/,
    ],
    angular: [
      /@ViewChildren\('cellButton'\)/,
      /QueryList<ElementRef<HTMLButtonElement>>/,
      /cellButtons\.get\(index\)\?\.nativeElement\.focus\(\)/,
    ],
    vue: [
      /new Map<string, HTMLButtonElement>/,
      /cellRefs\.get\(cellId\(row, col\)\)\?\.focus\(\)/,
    ],
  };

  for (const [framework, expectedReference] of Object.entries(expectedPressureSolutions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      expectedReference,
      `${framework}: invalid Chessboard pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:chessboard-pressure-solution`);

    const starterFiles = normalizedAssetFiles(
      json(`cdn/${expectedQuestions[framework].starter.replace(/^assets\//, '')}`),
      `${framework}:chessboard-starter`
    );
    const pressureFiles = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:chessboard-pressure-solution`
    );
    assert.deepEqual(
      Object.keys(pressureFiles).sort(),
      Object.keys(starterFiles).sort(),
      `${framework}: Chessboard pressure solution tree must exactly match its normal starter`
    );

    const source = Object.values(pressureFiles).join('\n');
    for (const marker of [
      /isQueenReachable/,
      /Math\.abs\(/,
      /rowDistance === 0 \|\| colDistance === 0 \|\| rowDistance === colDistance/,
      /cell--reachable/,
      /data-reachable/,
      /Queen moves:/,
      /chessboard-cell-/,
      /ArrowLeft/,
      /ArrowRight/,
      /ArrowUp/,
      /ArrowDown/,
      /Home/,
      /End/,
      /aria-rowcount/,
      /aria-colcount/,
    ]) {
      assert.match(
        source,
        marker,
        `${framework}: Chessboard pressure solution is missing ${marker}`
      );
    }
    for (const marker of frameworkSourceMarkers[framework]) {
      assert.match(
        source,
        marker,
        `${framework}: Chessboard pressure solution must use framework-native focus refs (${marker})`
      );
    }
  }
}

function assertDynamicCounterButtonsPressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-dynamic-counter-buttons',
      starter: 'assets/sb/react/question/react-dynamic-counter-buttons.v1.json',
      solution: 'assets/sb/react/solution/react-dynamic-counter-buttons-solution.v1.json',
      openFile: '/src/App.tsx',
      storageKey: 'v1:ui:react:react-dynamic-counter-buttons',
      updatedAt: '2026-01-30',
    },
    angular: {
      id: 'angular-dynamic-counter-buttons',
      starter: 'assets/sb/angular/question/angular-dynamic-counter-buttons.v2.json',
      solution: 'assets/sb/angular/solution/angular-dynamic-counter-buttons-solution.v2.json',
      openFile: '/src/app/app.component.ts',
      storageKey: 'v2:ui:angular:angular-dynamic-counter-buttons',
      updatedAt: '2026-07-15',
    },
    vue: {
      id: 'vue-dynamic-counter-buttons',
      starter: 'assets/sb/vue/question/vue-dynamic-counter-buttons.v1.json',
      solution: 'assets/sb/vue/solution/vue-dynamic-counter-buttons-solution.v1.json',
      openFile: '/src/App.vue',
      storageKey: 'v1:ui:vue:vue-dynamic-counter-buttons',
      updatedAt: '2026-01-30',
    },
  };
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Dynamic Counter Buttons question must exist`);
    assert.equal(
      question.access,
      'premium',
      `${framework}: Dynamic Counter Buttons must stay premium`
    );
    assert.equal(
      question.difficulty,
      'intermediate',
      `${framework}: Dynamic Counter Buttons difficulty changed`
    );
    assert.equal(
      question.updatedAt,
      expected.updatedAt,
      `${framework}: pressure coverage must not rewrite normal Dynamic Counter updatedAt`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Dynamic Counter starter changed`
    );
    assert.equal(
      question.sdk?.openFile,
      expected.openFile,
      `${framework}: normal Dynamic Counter open file changed`
    );
    assert.equal(
      question.sdk?.storageKey,
      expected.storageKey,
      `${framework}: normal Dynamic Counter draft key changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Dynamic Counter solution changed`
    );
    assert.equal(
      Object.hasOwn(question, 'frameworkTests'),
      false,
      `${framework}: pressure coverage must not introduce normal Dynamic Counter checks`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/dynamic-counter-buttons.v1.json',
      `${framework}: Dynamic Counter Buttons must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Dynamic Counter frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/dynamic-counter-buttons.v1.json');
  assert.equal(scenario.schemaVersion, '1.0.0');
  assert.equal(scenario.id, 'dynamic-counter-buttons-pressure-v1');
  assert.equal(scenario.family, 'dynamic-counter-buttons');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-dynamic-counter-buttons',
    angular: 'angular-dynamic-counter-buttons',
    vue: 'vue-dynamic-counter-buttons',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    [
      'core-grow-invariants',
      'stable-removal-boundaries',
      'bounded-growth-reset',
      'accessible-list-navigation',
    ]
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Dynamic Counter pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-dynamic-counters-core',
      'pressure-dynamic-counters-removal',
      'pressure-dynamic-counters-limit-reset',
      'pressure-dynamic-counters-keyboard',
      'pressure-dynamic-counters-aria',
    ]
  );
  for (const check of checks) {
    assert.ok(check.steps?.length, `${check.id}: pressure check must be independently runnable`);
  }

  const hasStep = (check, expectedStep) => check.steps.some((step) =>
    Object.entries(expectedStep).every(([key, value]) => step[key] === value)
  );

  const coreCheck = checks.find((test) => test.id === 'pressure-dynamic-counters-core');
  assert.deepEqual(
    coreCheck.steps
      .filter((step) => step.type === 'click' && step.selector === '.counter-button')
      .map((step) => step.index),
    [0, 1, 1],
    'Dynamic Counter core flow must increment the first counter once and second twice'
  );
  assert.deepEqual(
    coreCheck.steps
      .filter((step) =>
        step.type === 'expectAttribute' &&
        step.selector === '.counter-row' &&
        step.attribute === 'data-counter-id'
      )
      .map((step) => step.expected),
    ['1', '1', '2', '3', '4'],
    'Dynamic Counter core flow must prove monotonic ids 1 through 4'
  );
  for (const expectedStep of [
    { type: 'expectValue', selector: '#counter-limit', value: '5' },
    { type: 'expectText', selector: '.counter-value', index: 0, text: '1' },
    { type: 'expectText', selector: '.counter-value', index: 1, text: '2' },
    { type: 'expectText', selector: '.counter-value', index: 2, text: '0' },
    { type: 'expectText', selector: '.counter-value', index: 3, text: '0' },
    {
      type: 'expectText',
      selector: '#counter-status',
      text: 'Counters: 4 of 5. Combined value: 3.',
    },
  ]) {
    assert.ok(
      hasStep(coreCheck, expectedStep),
      `Dynamic Counter core flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  const removalCheck = checks.find(
    (test) => test.id === 'pressure-dynamic-counters-removal'
  );
  assert.deepEqual(
    removalCheck.steps
      .filter((step) => step.type === 'click' && step.selector === '.remove-button')
      .map((step) => step.index),
    [1, 2, 1, 1],
    'Dynamic Counter removal flow must cover middle, last, and final-boundary removal'
  );
  assert.deepEqual(
    removalCheck.steps
      .filter((step) => step.type === 'expectFocused')
      .map((step) => ({ selector: step.selector, index: step.index })),
    [
      { selector: '.counter-button', index: 1 },
      { selector: '.counter-button', index: 1 },
      { selector: '.counter-button', index: 0 },
    ],
    'Dynamic Counter removal flow must restore focus to next or previous survivors'
  );
  for (const expectedStep of [
    {
      type: 'expectAttribute',
      selector: '.counter-row',
      index: 1,
      attribute: 'data-counter-id',
      expected: '3',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-row',
      index: 2,
      attribute: 'data-counter-id',
      expected: '4',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-row',
      index: 2,
      attribute: 'data-counter-id',
      expected: '5',
    },
    {
      type: 'expectDisabled',
      selector: '.remove-button',
      index: 0,
      disabled: true,
    },
    {
      type: 'expectText',
      selector: '#counter-status',
      text: 'Counters: 3 of 5. Combined value: 1.',
    },
  ]) {
    assert.ok(
      hasStep(removalCheck, expectedStep),
      `Dynamic Counter removal flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  const limitCheck = checks.find(
    (test) => test.id === 'pressure-dynamic-counters-limit-reset'
  );
  assert.deepEqual(
    limitCheck.steps
      .filter((step) => step.type === 'setValue' && step.selector === '#counter-limit')
      .map((step) => step.value),
    ['3', '12', '0'],
    'Dynamic Counter limit flow must cover truncation and both clamp boundaries'
  );
  assert.deepEqual(
    limitCheck.steps
      .filter((step) => step.type === 'expectValue' && step.selector === '#counter-limit')
      .map((step) => step.value),
    ['3', '10', '1', '5'],
    'Dynamic Counter limit flow must clamp to 1 and 10 before reset restores 5'
  );
  for (const expectedStep of [
    { type: 'expectCount', selector: '.counter-row', count: 5 },
    { type: 'expectText', selector: '.counter-value', index: 4, text: '2' },
    {
      type: 'expectText',
      selector: '#counter-status',
      text: 'Counters: 5 of 5. Combined value: 6.',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 2,
      attribute: 'tabindex',
      expected: '0',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-row',
      index: 1,
      attribute: 'data-counter-id',
      expected: '2',
    },
    {
      type: 'expectText',
      selector: '#counter-status',
      text: 'Counters: 1 of 5. Combined value: 0.',
    },
  ]) {
    assert.ok(
      hasStep(limitCheck, expectedStep),
      `Dynamic Counter limit/reset flow is missing ${JSON.stringify(expectedStep)}`
    );
  }
  assert.equal(
    limitCheck.steps.filter(
      (step) => step.type === 'expectFocused' && step.selector === '#counter-limit'
    ).length,
    2,
    'Dynamic Counter limit and reset normalization must not steal DOM focus from the limit control'
  );
  assert.deepEqual(
    limitCheck.steps
      .filter((step) => step.type === 'expectDisabled' && step.selector === '#reset-counters')
      .map((step) => step.disabled),
    [true, false, true],
    'Dynamic Counter reset must be enabled only away from the initial model'
  );

  const keyboardCheck = checks.find(
    (test) => test.id === 'pressure-dynamic-counters-keyboard'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'key')
      .map((step) => ({ index: step.index, key: step.key })),
    [
      { index: 0, key: 'ArrowUp' },
      { index: 3, key: 'ArrowDown' },
      { index: 2, key: 'Home' },
      { index: 0, key: 'End' },
    ],
    'Dynamic Counter keyboard flow must cover wrapped vertical navigation and boundaries'
  );
  assert.deepEqual(
    keyboardCheck.steps
      .filter((step) => step.type === 'expectFocused')
      .map((step) => step.index),
    [3, 0, 0, 3],
    'Dynamic Counter keyboard flow must assert every focus destination'
  );
  for (const expectedStep of [
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 3,
      attribute: 'tabindex',
      expected: '0',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 0,
      attribute: 'tabindex',
      expected: '-1',
    },
    {
      type: 'expectText',
      selector: '#counter-status',
      text: 'Counters: 4 of 5. Combined value: 3.',
    },
  ]) {
    assert.ok(
      hasStep(keyboardCheck, expectedStep),
      `Dynamic Counter keyboard flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  const ariaCheck = checks.find((test) => test.id === 'pressure-dynamic-counters-aria');
  for (const expectedStep of [
    { type: 'expectAttribute', selector: '#counter-limit', attribute: 'type', expected: 'number' },
    { type: 'expectAttribute', selector: '#counter-limit', attribute: 'min', expected: '1' },
    { type: 'expectAttribute', selector: '#counter-limit', attribute: 'max', expected: '10' },
    { type: 'expectAttribute', selector: '.counter-list', attribute: 'role', expected: 'list' },
    {
      type: 'expectAttribute',
      selector: '.counter-list',
      attribute: 'aria-label',
      expected: 'Dynamic counter buttons',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-list',
      attribute: 'aria-describedby',
      expected: 'counter-status',
    },
    {
      type: 'expectAttribute',
      selector: '#counter-status',
      attribute: 'role',
      expected: 'status',
    },
    {
      type: 'expectAttribute',
      selector: '#counter-status',
      attribute: 'aria-live',
      expected: 'polite',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-row',
      index: 0,
      attribute: 'id',
      expected: 'counter-row-1',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 0,
      attribute: 'id',
      expected: 'counter-button-1',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 0,
      attribute: 'aria-label',
      expected: 'Counter 1, value 0',
    },
    {
      type: 'expectAttribute',
      selector: '.remove-button',
      index: 0,
      attribute: 'id',
      expected: 'remove-counter-1',
    },
    {
      type: 'expectAttribute',
      selector: '.remove-button',
      index: 0,
      attribute: 'aria-controls',
      expected: 'counter-row-1',
    },
    {
      type: 'expectAttribute',
      selector: '.remove-button',
      index: 0,
      attribute: 'aria-label',
      expected: 'Remove counter 1',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 0,
      attribute: 'aria-label',
      expected: 'Counter 1, value 1',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 1,
      attribute: 'id',
      expected: 'counter-button-2',
    },
    {
      type: 'expectAttribute',
      selector: '.counter-button',
      index: 1,
      attribute: 'aria-label',
      expected: 'Counter 2, value 0',
    },
    { type: 'expectCount', selector: 'button#reset-counters[type="button"]', count: 1 },
  ]) {
    assert.ok(
      hasStep(ariaCheck, expectedStep),
      `Dynamic Counter ARIA flow is missing ${JSON.stringify(expectedStep)}`
    );
  }

  assert.equal(
    scenario.debrief?.title,
    'You kept dynamic counter state predictable under pressure',
    'Dynamic Counter pressure debrief title changed'
  );

  const expectedPressureSolutions = {
    react: 'assets/sb/react/solution/react-dynamic-counter-buttons-pressure-solution.v1.json',
    angular: 'assets/sb/angular/solution/angular-dynamic-counter-buttons-pressure-solution.v1.json',
    vue: 'assets/sb/vue/solution/vue-dynamic-counter-buttons-pressure-solution.v1.json',
  };
  const frameworkSourceMarkers = {
    react: [/useRef/, /Map<number, HTMLButtonElement/, /setCounters\(\(current\)/],
    angular: [/@ViewChildren/, /QueryList<ElementRef<HTMLButtonElement>>/, /onClick\(id: number\)/],
    vue: [/nextTick/, /Map<number, HTMLButtonElement/, /setCounterRef/],
  };

  for (const [framework, expectedReference] of Object.entries(expectedPressureSolutions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      expectedReference,
      `${framework}: invalid Dynamic Counter pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:dynamic-counter-pressure-solution`);

    const starterFiles = normalizedAssetFiles(
      json(`cdn/${expectedQuestions[framework].starter.replace(/^assets\//, '')}`),
      `${framework}:dynamic-counter-starter`
    );
    const pressureFiles = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:dynamic-counter-pressure-solution`
    );
    assert.deepEqual(
      Object.keys(pressureFiles).sort(),
      Object.keys(starterFiles).sort(),
      `${framework}: Dynamic Counter pressure solution tree must exactly match its normal starter`
    );

    const source = Object.values(pressureFiles).join('\n');
    for (const marker of [
      /nextId/,
      /counter-row-/,
      /counter-button-/,
      /remove-counter-/,
      /Counters:/,
      /Combined value:/,
      /ArrowUp/,
      /ArrowDown/,
      /Home/,
      /End/,
      /aria-describedby/,
    ]) {
      assert.match(
        source,
        marker,
        `${framework}: Dynamic Counter pressure solution is missing ${marker}`
      );
    }
    for (const marker of frameworkSourceMarkers[framework]) {
      assert.match(
        source,
        marker,
        `${framework}: Dynamic Counter pressure solution must use framework-native state and focus (${marker})`
      );
    }
  }
}

function assertPaginationTablePressureMode() {
  const expectedQuestions = {
    react: {
      id: 'react-pagination-table',
      starter: 'assets/sb/react/question/react-pagination-table.v1.json',
      solution: 'assets/sb/react/solution/react-pagination-table-solution.v1.json',
      updatedAt: '2026-01-30',
    },
    angular: {
      id: 'angular-pagination-table',
      starter: 'assets/sb/angular/question/angular-pagination-table.v2.json',
      solution: 'assets/sb/angular/solution/angular-pagination-table-solution.v2.json',
      updatedAt: '2026-07-15',
    },
    vue: {
      id: 'vue-pagination-table',
      starter: 'assets/sb/vue/question/vue-pagination-table.v1.json',
      solution: 'assets/sb/vue/solution/vue-pagination-table-solution.v1.json',
      updatedAt: '2026-01-30',
    },
  };
  const expectedNormalChecks = [
    {
      id: 'pagination-next-page',
      name: 'Pagination moves to next page',
      steps: [
        {
          type: 'expectCount',
          selector: 'tbody tr',
          count: 5,
        },
        {
          type: 'expectText',
          selector: '.page-info',
          text: '1',
          match: 'contains',
        },
        {
          type: 'click',
          selector: '.footer button',
          index: 1,
        },
        {
          type: 'waitForText',
          selector: '.page-info',
          text: '2',
          match: 'contains',
        },
      ],
    },
  ];
  const pressureRefs = new Set();

  for (const [framework, expected] of Object.entries(expectedQuestions)) {
    const question = json(`cdn/questions/${framework}/coding.json`).find(
      (entry) => entry.id === expected.id
    );
    assert.ok(question, `${framework}: Paginated Table question must exist`);
    assert.equal(question.access, 'premium', `${framework}: Paginated Table must stay premium`);
    assert.equal(
      question.difficulty,
      'intermediate',
      `${framework}: Paginated Table difficulty changed`
    );
    assert.equal(
      question.updatedAt,
      expected.updatedAt,
      `${framework}: pressure coverage must not rewrite normal Paginated Table updatedAt`
    );
    assert.equal(
      question.sdk?.asset,
      expected.starter,
      `${framework}: normal Paginated Table starter changed`
    );
    assert.equal(
      question.solutionAsset,
      expected.solution,
      `${framework}: normal Paginated Table solution changed`
    );
    assert.deepEqual(
      question.frameworkTests,
      framework === 'angular'
        ? expectedNormalChecks.map((check) => ({
            ...check,
            steps: check.steps.map((step) => ({
              ...step,
              selector: step.selector === '.page-info'
                ? '.pagination span'
                : step.selector === '.footer button'
                  ? '.pagination button'
                  : step.selector,
            })),
          }))
        : expectedNormalChecks,
      `${framework}: normal Paginated Table check must stay unchanged`
    );
    assert.equal(
      question.pressureModeAsset,
      'assets/questions/pressure-modes/pagination-table.v1.json',
      `${framework}: Paginated Table must reference the shared pressure scenario`
    );
    pressureRefs.add(question.pressureModeAsset);
  }

  assert.equal(
    pressureRefs.size,
    1,
    'All Paginated Table frameworks must share one pressure scenario'
  );

  const scenario = json('cdn/questions/pressure-modes/pagination-table.v1.json');
  assert.equal(scenario.id, 'pagination-table-pressure-v1');
  assert.equal(scenario.family, 'pagination-table');
  assert.equal(scenario.access, 'premium');
  assert.equal(scenario.estimatedMinutes, 45);
  assert.deepEqual(scenario.supportedQuestions, {
    react: 'react-pagination-table',
    angular: 'angular-pagination-table',
    vue: 'vue-pagination-table',
  });
  assert.deepEqual(
    scenario.rounds.map((round) => round.id),
    [
      'core-page-window',
      'filter-and-page-reset',
      'sort-and-page-size',
      'selection-and-accessibility',
    ]
  );

  const cumulativeCheckCounts = scenario.rounds.reduce((counts, round) => {
    const previous = counts[counts.length - 1] ?? 0;
    counts.push(previous + (round.frameworkTests?.length ?? 0));
    return counts;
  }, []);
  assert.deepEqual(
    cumulativeCheckCounts,
    [1, 2, 3, 5],
    'Paginated Table pressure checks must stay within the cumulative runner budget'
  );

  const checks = scenario.rounds.flatMap((round) => round.frameworkTests ?? []);
  assert.deepEqual(
    checks.map((test) => test.id),
    [
      'pressure-table-pagination',
      'pressure-table-filtering',
      'pressure-table-sorting',
      'pressure-table-selection',
      'pressure-table-accessibility',
    ]
  );

  const serializedChecks = JSON.stringify(checks);
  for (const requiredSignal of [
    '.table',
    '.data-row',
    '.search-input',
    '.page-size',
    '.sort-id',
    '.sort-name',
    '.sort-role',
    '.row-select',
    '.select-page',
    '.clear-selection',
    '.previous',
    '.next',
    '.footer',
    '.page-info',
    '.result-summary',
    '.selection-summary',
    '.empty-state',
    '.table-status',
    'Page 3 of 3',
    'No users found.',
    'LEO@EXAMPLE.COM',
    'aria-sort',
    'aria-checked',
    'aria-describedby',
    'aria-live',
    'aria-atomic',
    'Search cleared. 13 users found.',
    'unmountPreview',
    'expectNoPreviewTimers',
  ]) {
    assert.ok(
      serializedChecks.includes(requiredSignal),
      `Paginated Table pressure checks are missing ${requiredSignal}`
    );
  }

  const paginationCheck = checks.find(
    (test) => test.id === 'pressure-table-pagination'
  );
  assert.ok(
    paginationCheck.steps.some(
      (step) =>
        step.type === 'click' &&
        step.selector === '.footer button' &&
        step.index === 1
    ),
    'Paginated Table pressure core must preserve the normal Next-button selector contract'
  );
  assert.ok(
    paginationCheck.steps.some(
      (step) =>
        step.type === 'expectCount' &&
        step.selector === 'tbody tr' &&
        step.count === 5
    ),
    'Paginated Table pressure core must preserve the normal five-row contract'
  );

  const filteringCheck = checks.find(
    (test) => test.id === 'pressure-table-filtering'
  );
  assert.deepEqual(
    filteringCheck.steps
      .filter((step) => step.type === 'setValue' && step.selector === '.search-input')
      .map((step) => step.value),
    ['  VIEWER  ', '  LEO@EXAMPLE.COM  ', 'nobody', ''],
    'Paginated Table filtering must cover normalization, empty state, and recovery'
  );
  assert.ok(
    filteringCheck.steps.some(
      (step) =>
        (step.type === 'expectCount' || step.type === 'waitForCount') &&
        step.selector === '.data-row' &&
        step.count === 0
    ),
    'Paginated Table filtering must prove that no data rows survive an empty result'
  );

  const sortingCheck = checks.find((test) => test.id === 'pressure-table-sorting');
  assert.deepEqual(
    sortingCheck.steps
      .filter((step) => step.type === 'click' && step.selector.startsWith('.sort-'))
      .map((step) => step.selector),
    ['.sort-name', '.sort-name', '.sort-role', '.sort-id', '.sort-id'],
    'Paginated Table sorting must cover ascending, descending, stable role, and numeric id order'
  );
  assert.ok(
    sortingCheck.steps.some(
      (step) =>
        step.type === 'setValue' &&
        step.selector === '.page-size' &&
        step.value === '10'
    ),
    'Paginated Table sorting flow must cover the ten-row page size'
  );

  const selectionCheck = checks.find(
    (test) => test.id === 'pressure-table-selection'
  );
  assert.deepEqual(
    [...new Set(
      selectionCheck.steps
        .filter(
          (step) =>
            step.type === 'expectAttribute' &&
            step.selector === '.select-page' &&
            step.attribute === 'aria-checked'
        )
        .map((step) => step.expected)
    )],
    ['false', 'mixed', 'true'],
    'Paginated Table selection must expose false, mixed, and true page states'
  );
  assert.ok(
    selectionCheck.steps.some(
      (step) =>
        step.type === 'expectText' &&
        step.selector === '.selection-summary' &&
        step.text === '7 users selected.'
    ),
    'Paginated Table selection must persist ids while selecting another page'
  );

  const accessibilityCheck = checks.find(
    (test) => test.id === 'pressure-table-accessibility'
  );
  assert.ok(
    accessibilityCheck.steps.some(
      (step) => step.type === 'key' && step.key === 'Escape'
    ) &&
      accessibilityCheck.steps.some((step) => step.type === 'expectFocused') &&
      accessibilityCheck.steps.some((step) => step.type === 'unmountPreview') &&
      accessibilityCheck.steps.some((step) => step.type === 'expectNoPreviewTimers'),
    'Paginated Table accessibility must cover keyboard recovery, focus, and timer cleanup'
  );

  const commonSolutionMarkers = [
    /Alice Johnson/,
    /Leo Walker/,
    /search-input/,
    /page-size/,
    /sort-id/,
    /sort-name/,
    /sort-role/,
    /row-select/,
    /select-page/,
    /clear-selection/,
    /result-summary/,
    /selection-summary/,
    /empty-state/,
    /table-status/,
    /aria-sort/,
    /aria-checked/,
    /aria-describedby/,
    /aria-live/,
    /aria-atomic/,
    /Search cleared\. 13 users found\./,
  ];
  const frameworkSolutionMarkers = {
    react: [/useMemo/, /useState/, /Set<number>/],
    angular: [/get filteredUsers/, /Set<number>/],
    vue: [/computed/, /ref/, /Set<number>/],
  };
  for (const framework of Object.keys(expectedQuestions)) {
    const reference = scenario.solutionAssets?.[framework];
    assert.equal(
      reference,
      `assets/sb/${framework}/solution/${framework}-pagination-table-pressure-solution.v1.json`,
      `${framework}: invalid Paginated Table pressure solution reference`
    );
    const relative = reference.replace(/^assets\//, '');
    assertMirror(relative, `${framework}:pagination-table-pressure-solution`);
    const files = normalizedAssetFiles(
      json(`cdn/${relative}`),
      `${framework}:pagination-table-pressure-solution`
    );
    const source = Object.entries(files)
      .filter(([file]) => file.startsWith('src/'))
      .map(([file, code]) => `${file}\n${code}`)
      .join('\n');
    for (const marker of [
      ...commonSolutionMarkers,
      ...frameworkSolutionMarkers[framework],
    ]) {
      assert.match(
        source,
        marker,
        `${framework}: Paginated Table pressure solution is missing ${marker}`
      );
    }
  }
}

async function drainMicrotasks() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  function schedule(callback, delay, interval) {
    const id = nextId;
    nextId += 1;
    const normalizedDelay = Math.max(interval ? 1 : 0, Number(delay) || 0);
    timers.set(id, { callback, due: now + normalizedDelay, interval: interval ? normalizedDelay : null });
    return id;
  }

  function nextTimerBefore(target) {
    return [...timers.entries()]
      .filter(([, timer]) => timer.due <= target)
      .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0] ?? null;
  }

  return {
    setTimeout(callback, delay) { return schedule(callback, delay, false); },
    clearTimeout(id) { timers.delete(id); },
    setInterval(callback, delay) { return schedule(callback, delay, true); },
    clearInterval(id) { timers.delete(id); },
    activeIntervals() {
      return [...timers.values()].filter((timer) => timer.interval !== null).length;
    },
    async advanceBy(duration) {
      const target = now + duration;
      let next;
      while ((next = nextTimerBefore(target)) !== null) {
        const [id, timer] = next;
        now = timer.due;
        if (timer.interval === null) timers.delete(id);
        else timer.due += timer.interval;
        timer.callback();
        await drainMicrotasks();
      }
      now = target;
      await drainMicrotasks();
    }
  };
}

function createFakeBrowser(clock) {
  const windowListeners = new Map();
  const documentListeners = new Map();

  function add(listeners, type, listener) {
    const registered = listeners.get(type) ?? new Set();
    registered.add(listener);
    listeners.set(type, registered);
  }

  function remove(listeners, type, listener) {
    listeners.get(type)?.delete(listener);
  }

  const window = {
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    addEventListener(type, listener) { add(windowListeners, type, listener); },
    removeEventListener(type, listener) { remove(windowListeners, type, listener); },
    dispatch(type, event) {
      for (const listener of windowListeners.get(type) ?? []) listener(event);
    }
  };

  const document = {
    addEventListener(type, listener) { add(documentListeners, type, listener); },
    removeEventListener(type, listener) { remove(documentListeners, type, listener); }
  };

  return { window, document };
}

function createReactHarness(source, fileName, browser, modules, globals = {}) {
  const slots = [];
  const effects = new Map();
  let hookIndex = 0;
  let pendingEffects = [];
  let dirty = true;
  let component = null;
  let tree = null;

  function sameDependencies(previous, next) {
    return previous !== undefined && next !== undefined &&
      previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
  }

  const React = {
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      return {
        type,
        props: {
          ...(props ?? {}),
          children: children.length <= 1 ? children[0] : children
        }
      };
    },
    useRef(initialValue) {
      const index = hookIndex;
      hookIndex += 1;
      if (!slots[index]) slots[index] = { kind: 'ref', current: initialValue };
      return slots[index];
    },
    useState(initialValue) {
      const index = hookIndex;
      hookIndex += 1;
      if (!slots[index]) {
        const state = {
          kind: 'state',
          value: typeof initialValue === 'function' ? initialValue() : initialValue,
          set(nextValue) {
            const resolved = typeof nextValue === 'function' ? nextValue(state.value) : nextValue;
            if (Object.is(resolved, state.value)) return;
            state.value = resolved;
            dirty = true;
          }
        };
        slots[index] = state;
      }
      return [slots[index].value, slots[index].set];
    },
    useMemo(factory, dependencies) {
      const index = hookIndex;
      hookIndex += 1;
      const memo = slots[index];
      if (!memo || !sameDependencies(memo.dependencies, dependencies)) {
        slots[index] = { kind: 'memo', value: factory(), dependencies };
      }
      return slots[index].value;
    },
    useCallback(callback, dependencies) {
      return React.useMemo(() => callback, dependencies);
    },
    useEffect(effect, dependencies) {
      const index = hookIndex;
      hookIndex += 1;
      const previous = effects.get(index);
      if (!previous || !sameDependencies(previous.dependencies, dependencies)) {
        pendingEffects.push({ index, effect, dependencies });
      }
    }
  };

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      strict: true
    },
    reportDiagnostics: true,
    fileName
  });
  assert.deepEqual(
    (transpiled.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
    ),
    [],
    `${fileName} must transpile for the deterministic component harness`
  );

  const reactModule = { __esModule: true, default: React, ...React };
  const module = { exports: {} };
  const require = (specifier) => {
    if (specifier === 'react') return reactModule;
    if (specifier.endsWith('.css')) return {};
    if (Object.prototype.hasOwnProperty.call(modules, specifier)) return modules[specifier];
    throw new Error(`Unexpected ${fileName} dependency: ${specifier}`);
  };
  const sandbox = {
    AbortController,
    DOMException,
    console,
    document: browser.document,
    window: browser.window,
    ...globals
  };
  const execute = vm.runInNewContext(
    `(function (require, module, exports) { ${transpiled.outputText}\n})`,
    sandbox,
    { filename: fileName }
  );
  execute(require, module, module.exports);

  function renderOnce() {
    hookIndex = 0;
    pendingEffects = [];
    dirty = false;
    tree = component();
    for (const pending of pendingEffects) {
      effects.get(pending.index)?.cleanup?.();
      const cleanup = pending.effect();
      effects.set(pending.index, {
        dependencies: pending.dependencies,
        cleanup: typeof cleanup === 'function' ? cleanup : null
      });
    }
  }

  return {
    mount() {
      component = module.exports.default;
      assert.equal(typeof component, 'function', `${fileName} must export a component`);
      this.flush();
    },
    flush() {
      let renders = 0;
      while (dirty) {
        renderOnce();
        renders += 1;
        assert.ok(renders < 20, `${fileName} entered a render loop in the deterministic harness`);
      }
    },
    get tree() { return tree; },
    state(index) {
      assert.equal(slots[index]?.kind, 'state', `${fileName} hook ${index} must be state`);
      return slots[index].value;
    },
    unmount() {
      for (const effect of effects.values()) effect.cleanup?.();
      effects.clear();
    }
  };
}

function findElement(node, predicate) {
  if (node === null || node === undefined || typeof node === 'boolean') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  if (predicate(node)) return node;
  return findElement(node.props?.children, predicate);
}

function renderedText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(renderedText).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return renderedText(node.props?.children);
}

const solutionAssets = [
  {
    name: 'Angular',
    relative: 'sb/angular/solution/angular-snake-game-solution.v1.json',
    component: '/src/app/app.component.ts',
    engine: '/src/app/snake-engine.ts'
  },
  {
    name: 'React',
    relative: 'sb/react/solution/react-snake-game-solution.v1.json',
    component: 'src/App.tsx',
    engine: 'src/snake-engine.ts'
  },
  {
    name: 'Vue v1',
    relative: 'sb/vue/solution/vue-snake-game-solution.v1.json',
    component: 'src/App.vue',
    engine: 'src/snake-engine.ts'
  },
  {
    name: 'Vue v2',
    relative: 'sb/vue/solution/vue-snake-game-solution.v2.json',
    component: 'src/App.vue',
    engine: 'src/snake-engine.ts'
  }
];

for (const relative of [
  'sb/angular/question/angular-snake-game.v1.json',
  'sb/angular/solution/angular-snake-game-solution.v1.json',
  'sb/react/question/react-snake-game.v1.json',
  'sb/react/solution/react-snake-game-solution.v1.json',
  'sb/vue/question/vue-snake-game.v1.json',
  'sb/vue/question/vue-snake-game.v2.json',
  'sb/vue/solution/vue-snake-game-solution.v1.json',
  'sb/vue/solution/vue-snake-game-solution.v2.json'
]) {
  assertMirror(relative);
}

assert.equal(
  read('cdn/sb/vue/question/vue-snake-game.v1.json'),
  read('cdn/sb/vue/question/vue-snake-game.v2.json'),
  'Vue Snake starter v1/v2 copies must stay synchronized'
);
assert.equal(
  read('cdn/sb/vue/solution/vue-snake-game-solution.v1.json'),
  read('cdn/sb/vue/solution/vue-snake-game-solution.v2.json'),
  'Vue Snake solution v1/v2 copies must stay synchronized'
);

const engines = solutionAssets.map(({ name, relative, component, engine }) => {
  const asset = json(`cdn/${relative}`);
  const componentCode = fileCode(asset, component);
  const engineCode = fileCode(asset, engine);

  assert.match(componentCode, /from '\.\/snake-engine'/);
  assert.match(componentCode, /bufferTurn\(/);
  assert.match(componentCode, /stepSnake\(/);
  assert.match(componentCode, /bufferedDirection/);
  assert.match(componentCode, /outcome === 'won'/);
  assert.match(componentCode, /You win/);
  assert.match(engineCode, /food: Point \| null/);
  assert.match(engineCode, /bufferedDirection: Direction \| null/);
  assert.match(engineCode, /food === null \? 'won' : 'moved'/);
  assert.doesNotMatch(componentCode, /pendingDirection/);

  if (name === 'Angular') {
    assert.match(componentCode, /this\.bufferedDirection = null/);
    assert.match(componentCode, /this\.isWon = false/);
    assert.match(componentCode, /ngOnDestroy\(\): void \{[\s\S]*this\.clearTimer\(\)/);
    assert.match(componentCode, /outcome === 'won'[\s\S]*this\.pause\(\)/);
  } else if (name === 'React') {
    assert.match(componentCode, /bufferedDirection: null/);
    assert.match(componentCode, /terminal: 'none'/);
    assert.match(componentCode, /return \(\) => window\.clearInterval\(timerId\)/);
    assert.match(componentCode, /isRunning: terminal === 'none'/);
  } else {
    assert.match(componentCode, /bufferedDirection\.value = null/);
    assert.match(componentCode, /isWon\.value = false/);
    assert.match(componentCode, /onBeforeUnmount\([\s\S]*clearTimer\(\)/);
    assert.match(componentCode, /outcome === 'won'[\s\S]*pauseLoop\(\)/);
  }

  const transpiled = ts.transpileModule(engineCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      strict: true
    },
    reportDiagnostics: true,
    fileName: `${name.toLowerCase()}-snake-engine.ts`
  });
  const errors = (transpiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  assert.deepEqual(errors, [], `${name} Snake engine must transpile without syntax errors`);
  return { name, engineCode, outputText: transpiled.outputText };
});

const importedEngines = new Map();

assert.equal(engines[1].engineCode, engines[0].engineCode, 'React and Angular must share one engine contract');
assert.equal(engines[2].engineCode, engines[0].engineCode, 'Vue v1 and Angular must share one engine contract');
assert.equal(engines[3].engineCode, engines[0].engineCode, 'Vue v2 and Angular must share one engine contract');

function reproduceLegacySameTickBug() {
  const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
  const direction = 'RIGHT';
  let pendingDirection = 'RIGHT';
  for (const requested of ['UP', 'LEFT']) {
    const activeDirection = pendingDirection || direction;
    if (opposite[activeDirection] !== requested) pendingDirection = requested;
  }
  return pendingDirection;
}

assert.equal(
  reproduceLegacySameTickBug(),
  'LEFT',
  'The previous pending-direction algorithm must reproduce RIGHT -> UP -> LEFT before guarding it'
);

for (const { name, outputText } of engines) {
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  const moduleKey = name.toLowerCase().replace(/\s+/g, '-');
  const engine = await import(`${moduleUrl}#${moduleKey}`);
  importedEngines.set(name, engine);

  assert.equal(engine.bufferTurn('RIGHT', null, 'LEFT'), null, `${name}: opposite input is ignored`);
  assert.equal(engine.bufferTurn('RIGHT', null, 'RIGHT'), null, `${name}: same input is ignored`);

  const afterInvalid = engine.bufferTurn('RIGHT', null, 'LEFT');
  assert.equal(
    engine.bufferTurn('RIGHT', afterInvalid, 'UP'),
    'UP',
    `${name}: invalid input must not consume the buffer`
  );

  let buffered = engine.bufferTurn('RIGHT', null, 'UP');
  buffered = engine.bufferTurn('RIGHT', buffered, 'LEFT');
  assert.equal(buffered, 'UP', `${name}: RIGHT -> UP -> LEFT must retain UP`);

  const turned = engine.stepSnake({
    snake: [{ x: 1, y: 1 }, { x: 0, y: 1 }],
    direction: 'RIGHT',
    bufferedDirection: buffered,
    food: { x: 2, y: 2 },
    score: 0
  }, 3, () => 0);
  assert.equal(turned.direction, 'UP', `${name}: the tick commits the first buffered turn`);
  assert.equal(turned.bufferedDirection, null, `${name}: the tick clears the buffer`);
  assert.deepEqual(turned.snake[0], { x: 1, y: 0 });

  const won = engine.stepSnake({
    snake: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    direction: 'RIGHT',
    bufferedDirection: null,
    food: { x: 1, y: 0 },
    score: 7
  }, 2, () => 0);
  assert.equal(won.outcome, 'won', `${name}: eating the final free cell wins`);
  assert.equal(won.food, null, `${name}: a full board has no food`);
  assert.equal(won.snake.length, 4);
  assert.equal(won.score, 8);
}

function finalCellEngine(engine) {
  return {
    ...engine,
    placeFood() { return { x: 8, y: 7 }; },
    stepSnake() {
      return engine.stepSnake({
        snake: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
        direction: 'RIGHT',
        bufferedDirection: null,
        food: { x: 1, y: 0 },
        score: 7
      }, 2, () => 0);
    }
  };
}

{
  const clock = createFakeClock();
  const browser = createFakeBrowser(clock);
  const reactSolution = json('cdn/sb/react/solution/react-snake-game-solution.v1.json');
  const reactCode = fileCode(reactSolution, 'src/App.tsx');
  const harness = createReactHarness(
    reactCode,
    'react-snake-component.tsx',
    browser,
    { './snake-engine': finalCellEngine(importedEngines.get('React')) }
  );
  harness.mount();

  browser.window.dispatch('keydown', { key: ' ', preventDefault() {} });
  harness.flush();
  assert.equal(clock.activeIntervals(), 1, 'React Snake starts one component interval');

  await clock.advanceBy(140);
  harness.flush();
  assert.equal(clock.activeIntervals(), 0, 'React Snake clears its interval after the final-cell win');
  assert.match(renderedText(harness.tree), /Score: 8[\s\S]*Length: 4[\s\S]*You win/);
  assert.equal(
    findElement(harness.tree, (element) => String(element.props?.className).includes('cell--food')),
    null,
    'React Snake renders no food cell on a full board'
  );

  browser.window.dispatch('keydown', { key: 'Enter', preventDefault() {} });
  harness.flush();
  assert.equal(clock.activeIntervals(), 0, 'React Snake reset remains paused with no retained timer');
  assert.match(renderedText(harness.tree), /Score: 0[\s\S]*Length: 3[\s\S]*Paused/);
  assert.ok(
    findElement(harness.tree, (element) => String(element.props?.className).includes('cell--food')),
    'React Snake reset places food again'
  );
  harness.unmount();
}

for (const version of ['Vue v1', 'Vue v2']) {
  const asset = json(`cdn/sb/vue/solution/vue-snake-game-solution.${version === 'Vue v1' ? 'v1' : 'v2'}.json`);
  const componentCode = fileCode(asset, 'src/App.vue');
  const script = componentCode.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, `${version}: component script must be extractable`);

  const augmentedScript = `${script}\nexport { food, isRunning, isGameOver, isWon, score, snake, resetGame, toggleRunning };`;
  const transpiled = ts.transpileModule(augmentedScript, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      strict: true
    },
    reportDiagnostics: true,
    fileName: `${version.toLowerCase().replace(/\s+/g, '-')}-snake-component.ts`
  });
  assert.deepEqual(
    (transpiled.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
    ),
    [],
    `${version}: component script must transpile for deterministic integration testing`
  );

  const clock = createFakeClock();
  const browser = createFakeBrowser(clock);
  const mounted = [];
  const beforeUnmount = [];
  const vue = {
    ref(value) { return { value }; },
    computed(getter) { return { get value() { return getter(); } }; },
    onMounted(callback) { mounted.push(callback); },
    onBeforeUnmount(callback) { beforeUnmount.push(callback); }
  };
  const module = { exports: {} };
  const require = (specifier) => {
    if (specifier === 'vue') return vue;
    if (specifier === './snake-engine') return finalCellEngine(importedEngines.get(version));
    throw new Error(`${version}: unexpected dependency ${specifier}`);
  };
  const execute = vm.runInNewContext(
    `(function (require, module, exports) { ${transpiled.outputText}\n})`,
    {
      clearInterval: clock.clearInterval,
      console,
      window: browser.window
    },
    { filename: `${version.toLowerCase().replace(/\s+/g, '-')}-snake-component.ts` }
  );
  execute(require, module, module.exports);
  for (const callback of mounted) callback();

  module.exports.toggleRunning();
  assert.equal(clock.activeIntervals(), 1, `${version}: component starts one interval`);
  await clock.advanceBy(140);
  assert.equal(clock.activeIntervals(), 0, `${version}: final-cell win clears the interval`);
  assert.equal(module.exports.isWon.value, true);
  assert.equal(module.exports.isGameOver.value, false);
  assert.equal(module.exports.isRunning.value, false);
  assert.equal(module.exports.food.value, null);
  assert.equal(module.exports.score.value, 8);
  assert.equal(module.exports.snake.value.length, 4);

  module.exports.resetGame();
  assert.equal(clock.activeIntervals(), 0, `${version}: reset remains paused with no retained timer`);
  assert.equal(module.exports.isWon.value, false);
  assert.equal(module.exports.isGameOver.value, false);
  assert.equal(module.exports.isRunning.value, false);
  assert.equal(module.exports.score.value, 0);
  assert.equal(module.exports.snake.value.length, 3);
  assert.deepEqual(module.exports.food.value, { x: 8, y: 7 });

  for (const callback of beforeUnmount) callback();
  assert.equal(clock.activeIntervals(), 0, `${version}: unmount leaves no interval behind`);
}

const angularSolution = json('cdn/sb/angular/solution/angular-snake-game-solution.v1.json');
const angularSpec = fileCode(angularSolution, '/src/app/app.component.spec.ts');
assert.match(angularSpec, /RIGHT -> UP -> LEFT during one tick/);
assert.match(angularSpec, /wins and stops with no food when the final free cell is eaten/);
assert.match(angularSpec, /does not let an invalid key consume the one-turn buffer/);

const reactStarter = json('cdn/sb/react/question/react-snake-game.v1.json');
const reactStarterCode = fileCode(reactStarter, 'src/App.tsx');
assert.match(reactStarterCode, /useRef/);
assert.match(reactStarterCode, /directionRef = useRef\('RIGHT'\)/);
assert.match(reactStarterCode, /bufferedDirectionRef = useRef\(null\)/);
assert.match(reactStarterCode, /multiple keydown events can arrive before React commits state/);

for (const [technology, id] of [
  ['angular', 'angular-snake-game'],
  ['react', 'react-snake-game'],
  ['vue', 'vue-snake-game']
]) {
  const question = json(`cdn/questions/${technology}/coding.json`).find((entry) => entry.id === id);
  assert.ok(question, `Missing ${id}`);
  assert.equal(question.updatedAt, technology === 'angular' ? '2026-07-15' : '2026-07-14');
  const renderedContract = JSON.stringify(question);
  assert.match(renderedContract, /at most one valid perpendicular turn per tick/);
  assert.match(renderedContract, /full board|final free cell/);
  if (technology === 'react') {
    assert.match(renderedContract, /synchronous refs/);
    assert.match(renderedContract, /before React commits/);
  }
}

const decisionGraph = json('cdn/questions/angular/decision-graphs/angular-snake-game.v1.json');
const graphVariant = decisionGraph.variants.approach1;
assert.match(graphVariant.code, /bufferedDirection/);
assert.match(graphVariant.code, /result\.outcome === 'won'/);
const graphLines = graphVariant.code.split('\n');
for (const node of graphVariant.nodes) {
  const { lineStart, lineEnd, snippet } = node.anchor;
  assert.ok(lineStart >= 1 && lineEnd >= lineStart && lineEnd <= graphLines.length, `${node.id}: invalid anchor range`);
  assert.ok(
    graphLines.slice(lineStart - 1, lineEnd).join('\n').includes(snippet),
    `${node.id}: anchor range must contain its snippet`
  );
}

for (const relative of [
  'sb/react/question/react-use-effect-once.v1.json',
  'sb/react/solution/react-use-effect-once-solution.v1.json'
]) {
  assertMirror(relative);
}

const strictEffectQuestion = json('cdn/questions/react/coding.json').find(
  (entry) => entry.id === 'react-use-effect-once'
);
assert.ok(strictEffectQuestion);
assert.equal(strictEffectQuestion.access, 'premium');
assert.equal(strictEffectQuestion.sdk.asset, 'assets/sb/react/question/react-use-effect-once.v1.json');
assert.equal(strictEffectQuestion.solutionAsset, 'assets/sb/react/solution/react-use-effect-once-solution.v1.json');
assert.equal(strictEffectQuestion.updatedAt, '2026-07-15');
const strictEffectContract = JSON.stringify(strictEffectQuestion);
assert.match(strictEffectContract, /setup → cleanup → setup/);
assert.match(strictEffectContract, /one active connection/);
assert.match(strictEffectContract, /SSR requests/);
assert.match(strictEffectContract, /multiple roots/);
assert.match(strictEffectContract, /hydration/);
assert.match(strictEffectContract, /HMR/);
assert.doesNotMatch(strictEffectContract, /effect callback must run only once/i);
assert.doesNotMatch(strictEffectContract, /cleanup exactly once/i);

const strictEffectStarter = json('cdn/sb/react/question/react-use-effect-once.v1.json');
const strictEffectSolution = json('cdn/sb/react/solution/react-use-effect-once-solution.v1.json');
const strictEffectStarterCode = fileCode(strictEffectStarter, 'src/App.tsx');
const strictEffectSolutionCode = fileCode(strictEffectSolution, 'src/App.tsx');
const strictEffectIndex = fileCode(strictEffectSolution, 'src/index.tsx');
assert.match(strictEffectIndex, /<React\.StrictMode>/);
for (const code of [strictEffectStarterCode, strictEffectSolutionCode]) {
  assert.doesNotMatch(code, /useRef/);
  assert.doesNotMatch(code, /didRun|hasRun|cleanupRef/);
  assert.doesNotMatch(code, /eslint-disable/);
  assert.match(code, /setup → cleanup → setup/);
  assert.match(code, /active-count/);
}
assert.match(strictEffectStarterCode, /TODO: Create a connection/);
assert.match(strictEffectSolutionCode, /useEffect\(\(\) =>/);
assert.match(strictEffectSolutionCode, /const connection = createConnection\(roomId, setStatus, onActiveCount\)/);
assert.match(strictEffectSolutionCode, /connection\.connect\(\)/);
assert.match(strictEffectSolutionCode, /return \(\) => connection\.disconnect\(\)/);
assert.match(strictEffectSolutionCode, /\[roomId, onActiveCount\]/);

assertFrameworkStarterCorpus();
assertFrameworkCssFormatting();
assertModernAngularCodingCorpus();
assertCounterPressureMode();
assertDebouncedSearchPressureMode();
assertTodoListPressureMode();
assertShoppingCartPressureMode();
assertChipsInputPressureMode();
assertAccordionFaqPressureMode();
assertTicTacToePressureMode();
assertChessboardClickHighlightPressureMode();
assertDynamicCounterButtonsPressureMode();
assertPaginationTablePressureMode();

const angularCodingQuestions = json('cdn/questions/angular/coding.json');
const nestedCheckboxStarter = json('cdn/sb/angular/question/angular-nested-checkboxes.v1.json');
const nestedCheckboxTemplate = fileCode(nestedCheckboxStarter, '/src/app/app.component.html');
assert.match(
  nestedCheckboxTemplate,
  /@for \(child of children; track \$index; let i = \$index\)/,
  'angular-nested-checkboxes: the fixed boolean collection must declare the index used by its controls'
);
assert.doesNotMatch(
  nestedCheckboxTemplate,
  /track child\.label/,
  'angular-nested-checkboxes: boolean children do not have a label identity'
);
const modernizedAngularIds = [
  'angular-contact-form-starter',
  'angular-todo-list-starter',
  'angular-image-slider-starter',
  'angular-tabs-switcher',
  'angular-filterable-user-list',
  'angular-faq-accordion',
  'angular-pagination-table',
  'angular-multi-step-form-starter',
  'angular-shopping-cart-mini',
  'angular-debounced-search',
  'angular-star-rating',
  'angular-dynamic-table-starter',
  'angular-nested-checkboxes',
  'angular-autocomplete-search-starter',
  'angular-transfer-list',
  'angular-tictactoe-starter',
  'angular-nested-comments',
  'angular-dynamic-counter-buttons',
  'angular-chips-input-autocomplete',
  'angular-chessboard-click-highlight',
  'angular-snake-game'
];
for (const id of modernizedAngularIds) {
  const question = angularCodingQuestions.find((entry) => entry.id === id);
  assert.ok(question, `Missing modernized Angular question ${id}`);
  assert.equal(question.updatedAt, '2026-07-15', `${id}: stale Angular update date`);
}
for (const id of [
  'angular-image-slider-starter',
  'angular-tabs-switcher',
  'angular-filterable-user-list',
  'angular-faq-accordion',
  'angular-pagination-table',
  'angular-multi-step-form-starter',
  'angular-shopping-cart-mini',
  'angular-star-rating',
  'angular-dynamic-table-starter',
  'angular-transfer-list',
  'angular-tictactoe-starter',
  'angular-dynamic-counter-buttons',
  'angular-chessboard-click-highlight'
]) {
  assert.ok(
    angularCodingQuestions.find((entry) => entry.id === id)?.tags.includes('control-flow'),
    `${id}: modern control-flow content must carry the control-flow tag`
  );
}

for (const relative of [
  'sb/angular/question/angular-todo-list.v2.json',
  'sb/angular/solution/angular-todo-list-solution.v2.json'
]) {
  const asset = json(`cdn/${relative}`);
  const template = fileCode(asset, '/src/app/app.component.html');
  const component = fileCode(asset, '/src/app/app.component.ts');
  assert.match(template, /@for \(todo of todos; track todo\.id\)/);
  assert.match(template, /@if \(hasTodos\)/);
  assert.doesNotMatch(template, deprecatedAngularControlFlow);
  assert.doesNotMatch(component, /CommonModule|trackById/);
}

const todoQuestion = angularCodingQuestions.find(
  (entry) => entry.id === 'angular-todo-list-starter'
);
assert.ok(todoQuestion);
assert.equal(todoQuestion.access, 'free');
assert.equal(todoQuestion.sdk.asset, 'assets/sb/angular/question/angular-todo-list.v2.json');
assert.equal(todoQuestion.solutionAsset, 'assets/sb/angular/solution/angular-todo-list-solution.v2.json');
assert.equal(todoQuestion.updatedAt, '2026-07-15');
const todoContract = JSON.stringify(todoQuestion);
assert.match(todoContract, /@for \(todo of todos; track todo\.id\)/);
assert.doesNotMatch(todoContract, deprecatedAngularControlFlow);
const foundationsTrackPreview = read(
  'frontend/src/app/features/tracks/track-preview/track-preview.component.ts'
);
assert.match(foundationsTrackPreview, /Todo List \(Standalone Component with @for\)/);
assert.doesNotMatch(foundationsTrackPreview, /Todo List \(Standalone Component with ngFor\)/);

const tabsQuestion = angularCodingQuestions.find((entry) => entry.id === 'angular-tabs-switcher');
assert.ok(tabsQuestion);
assert.equal(tabsQuestion.sdk.storageKey, 'v2:ui:angular:angular-tabs-starter');
assert.equal(tabsQuestion.access, 'premium');
assert.ok(tabsQuestion.tags.includes('control-flow'));
assert.deepEqual(tabsQuestion.premiumPreview, {
  summary: 'Build an accessible Angular tab switcher driven by a single active-tab state. Use modern template control flow so exactly one panel is rendered as the selection changes.',
  learningOutcomes: [
    'Model the selected tab with one typed active-state value.',
    'Render the active panel with Angular @if control flow.',
    'Keep exactly one content panel visible after every tab change.',
    'Connect accessible tab controls to active styling and labelled panels.'
  ],
  unlockDescription: 'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.'
});
const tabsPanelCounts = tabsQuestion.frameworkTests[0].steps.filter(
  (step) => step.type === 'expectCount' && step.selector === '.panel' && step.count === 1
);
assert.equal(tabsPanelCounts.length, 3, 'Tabs must assert exactly one panel initially and after both tab changes');
for (const relative of [
  'sb/angular/question/angular-tabs.v2.json',
  'sb/angular/solution/angular-tabs-solution.v2.json'
]) {
  const asset = json(`cdn/${relative}`);
  const component = fileCode(asset, '/src/app/app.component.ts');
  const template = fileCode(asset, '/src/app/app.component.html');
  assert.doesNotMatch(component, /CommonModule/);
  assert.match(template, /@if \(isActive\('overview'\)\)/);
  assert.match(template, /role="tablist"/);
  assert.match(template, /role="tabpanel"/);
  assert.doesNotMatch(template, /placeholders/i);
}

for (const relative of [
  'sb/react/question/react-autocomplete-search.v2.json',
  'sb/react/solution/react-autocomplete-search-solution.v2.json'
]) {
  assertMirror(relative);
}

const autocompleteQuestion = json('cdn/questions/react/coding.json').find(
  (entry) => entry.id === 'react-autocomplete-search-starter'
);
assert.ok(autocompleteQuestion);
assert.equal(autocompleteQuestion.access, 'free');
assert.equal(
  autocompleteQuestion.sdk.asset,
  'assets/sb/react/question/react-autocomplete-search.v2.json'
);
assert.equal(
  autocompleteQuestion.sdk.storageKey,
  'v3:ui:react:react-autocomplete-search-starter'
);
assert.equal(
  autocompleteQuestion.solutionAsset,
  'assets/sb/react/solution/react-autocomplete-search-solution.v2.json'
);
assert.equal(autocompleteQuestion.updatedAt, '2026-07-14');

const autocompleteStarter = json('cdn/sb/react/question/react-autocomplete-search.v2.json');
const autocompleteSolution = json('cdn/sb/react/solution/react-autocomplete-search-solution.v2.json');
const autocompleteStarterCode = fileCode(autocompleteStarter, '/src/App.tsx');
const autocompleteSolutionCode = fileCode(autocompleteSolution, '/src/App.tsx');

for (const code of [autocompleteStarterCode, autocompleteSolutionCode]) {
  assert.match(code, /<label id=\{labelId\} className="label" htmlFor="autocomplete-query">/);
  assert.match(code, /aria-labelledby=\{labelId\}/);
  assert.match(code, /onPointerDown=/);
  assert.doesNotMatch(code, /onMouseDown=/);
  assert.match(code, /const visibleResults = status === 'success' \? results : \[\]/);
  assert.match(code, /\{visibleResults\.map\(/);
}

assert.match(autocompleteStarterCode, /create an AbortController/);
assert.match(autocompleteStarterCode, /While status is loading, no result may become active or selectable/);

const starterInputTransitionStart = autocompleteStarterCode.indexOf('function handleInputChange');
const starterInputTransitionEnd = autocompleteStarterCode.indexOf(
  '\n  function handleKeyDown',
  starterInputTransitionStart
);
assert.ok(starterInputTransitionStart >= 0 && starterInputTransitionEnd > starterInputTransitionStart);
const starterInputTransition = autocompleteStarterCode.slice(
  starterInputTransitionStart,
  starterInputTransitionEnd
);
assert.match(starterInputTransition, /requestSeqRef\.current \+= 1/);
assert.match(starterInputTransition, /setResults\(\[\]\)/);
assert.match(starterInputTransition, /setActiveIndex\(-1\)/);
assert.match(starterInputTransition, /setStatus\('loading'\)/);

const inputTransitionStart = autocompleteSolutionCode.indexOf('function handleInputChange');
const inputTransitionEnd = autocompleteSolutionCode.indexOf('\n  function handleFocus', inputTransitionStart);
assert.ok(inputTransitionStart >= 0 && inputTransitionEnd > inputTransitionStart);
const inputTransition = autocompleteSolutionCode.slice(inputTransitionStart, inputTransitionEnd);
assert.match(inputTransition, /requestSeqRef\.current \+= 1/);
assert.match(inputTransition, /setResults\(\[\]\)/);
assert.match(inputTransition, /setActiveIndex\(-1\)/);
assert.match(inputTransition, /setStatus\('loading'\)/);

assert.match(autocompleteSolutionCode, /const controller = new AbortController\(\)/);
assert.match(autocompleteSolutionCode, /searchCities\(trimmed, controller\.signal\)/);
assert.match(autocompleteSolutionCode, /requestSeqRef\.current !== requestId/);
assert.match(autocompleteSolutionCode, /controller\.abort\(\)/);
assert.match(autocompleteSolutionCode, /status !== 'success' \|\| !results\.length/);
assert.match(autocompleteSolutionCode, /status !== 'success' \|\| !results\.includes\(value\)/);

const autocompleteTests = new Map(
  autocompleteQuestion.frameworkTests.map((test) => [test.id, test])
);
const pendingAutocompleteTest = autocompleteTests.get('autocomplete-pending-clears-stale-options');
assert.ok(pendingAutocompleteTest);
const pendingSteps = pendingAutocompleteTest.steps;
const newQueryStep = pendingSteps.findIndex(
  (step) => step.type === 'setValue' && step.value === 'se'
);
assert.ok(newQueryStep > 0);
assert.deepEqual(pendingSteps.slice(newQueryStep + 1, newQueryStep + 3), [
  { type: 'expectCount', selector: '.option', count: 0 },
  {
    type: 'expectText',
    selector: '.status',
    text: 'Loading suggestions for "se"',
    match: 'contains'
  }
]);
assert.ok(
  pendingSteps.some((step) => step.type === 'expectValue' && step.value === 'se'),
  'Pending ArrowDown/Enter must not select an option from the previous query'
);

const staleAutocompleteTest = autocompleteTests.get('autocomplete-stale-response-ignored');
assert.ok(staleAutocompleteTest);
assert.ok(
  staleAutocompleteTest.steps
    .filter((step) => step.text === 'Seattle')
    .every((step) => step.selector === '#autocomplete-option-seattle'),
  'Stale-response checks must target the stable Seattle option instead of the first matching option'
);
assert.ok(
  staleAutocompleteTest.steps.some(
    (step) => step.type === 'expectNoText' && step.text === 'San Francisco'
  ),
  'The slower stale request must be proved unable to overwrite the current results'
);
assert.ok(
  pendingSteps.some(
    (step) => step.text === 'Seattle' && step.selector === '#autocomplete-option-seattle'
  ),
  'Pending-query checks must wait for the stable Seattle option'
);

for (const id of ['autocomplete-outside-pointer-closes', 'autocomplete-pointer-selects-option']) {
  const test = autocompleteTests.get(id);
  assert.ok(test);
  assert.ok(test.steps.some((step) => step.type === 'pointerDown'));
  assert.ok(test.steps.every((step) => step.type !== 'mouseDown'));
}

const ariaAutocompleteTest = autocompleteTests.get('autocomplete-aria-contract');
assert.ok(ariaAutocompleteTest);
assert.ok(
  ariaAutocompleteTest.steps.some(
    (step) => step.selector === 'label[for="autocomplete-query"]' && step.text === 'Search cities'
  )
);
assert.ok(
  ariaAutocompleteTest.steps.some(
    (step) => step.attribute === 'aria-labelledby' && step.expected === 'autocomplete-label'
  )
);

const abortHelpersStart = autocompleteSolutionCode.indexOf('function abortError');
const abortHelpersEnd = autocompleteSolutionCode.indexOf('\nfunction isAbortError', abortHelpersStart);
assert.ok(abortHelpersStart >= 0 && abortHelpersEnd > abortHelpersStart);
const abortHelpers = ts.transpileModule(
  `${autocompleteSolutionCode.slice(abortHelpersStart, abortHelpersEnd)}\nexport { sleep };`,
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      strict: true
    },
    reportDiagnostics: true,
    fileName: 'autocomplete-abort-helpers.ts'
  }
);
assert.deepEqual(
  (abortHelpers.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  ),
  [],
  'Autocomplete abort helpers must transpile without syntax errors'
);
const abortModuleUrl = `data:text/javascript;base64,${Buffer.from(abortHelpers.outputText).toString('base64')}`;
const { sleep: abortableSleep } = await import(`${abortModuleUrl}#autocomplete-abort-helpers`);
const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
const previousWindow = globalThis.window;
globalThis.window = globalThis;
try {
  const inFlightController = new AbortController();
  const inFlightSleep = abortableSleep(10_000, inFlightController.signal);
  inFlightController.abort();
  await assert.rejects(inFlightSleep, (error) => error?.name === 'AbortError');

  const alreadyAbortedController = new AbortController();
  alreadyAbortedController.abort();
  await assert.rejects(
    abortableSleep(10_000, alreadyAbortedController.signal),
    (error) => error?.name === 'AbortError'
  );
} finally {
  if (hadWindow) globalThis.window = previousWindow;
  else delete globalThis.window;
}

{
  class UncancellableAbortController {
    signal = {
      aborted: false,
      addEventListener() {},
      removeEventListener() {}
    };

    abort() {
      // Deliberately ignored: request identity must still protect the latest query.
    }
  }

  const clock = createFakeClock();
  const browser = createFakeBrowser(clock);
  const harness = createReactHarness(
    autocompleteSolutionCode,
    'react-autocomplete-component.tsx',
    browser,
    {},
    { AbortController: UncancellableAbortController }
  );
  harness.mount();

  let input = findElement(harness.tree, (element) => element.type === 'input');
  assert.ok(input);
  input.props.onChange({ target: { value: 'san' } });
  harness.flush();
  await clock.advanceBy(300);

  input = findElement(harness.tree, (element) => element.type === 'input');
  input.props.onChange({ target: { value: 'se' } });
  assert.equal(harness.state(4), 'se');
  assert.equal(harness.state(5), 'loading');
  assert.deepEqual(Array.from(harness.state(8)), []);

  // Do not flush the query render yet. The old request cannot be cancelled and its
  // effect cleanup has not run, so requestSeqRef is the only active stale-result guard.
  await clock.advanceBy(450);
  assert.equal(harness.state(5), 'loading');
  assert.deepEqual(
    Array.from(harness.state(8)),
    [],
    'An uncancellable late completion must be rejected by request identity before effect cleanup'
  );

  harness.flush();
  await clock.advanceBy(300);
  await clock.advanceBy(80);
  harness.flush();
  assert.equal(harness.state(5), 'success');
  assert.deepEqual(Array.from(harness.state(8)), ['Brussels', 'San Jose', 'Seattle', 'Seoul']);
  assert.doesNotMatch(renderedText(harness.tree), /San Francisco/);
  harness.unmount();
}

const autocompleteDecisionGraph = json(
  'cdn/questions/react/decision-graphs/react-autocomplete-search.v1.json'
);
const autocompleteGraphVariant = autocompleteDecisionGraph.variants.approach1;
assert.match(autocompleteGraphVariant.code, /setResults\(\[\]\)/);
assert.match(autocompleteGraphVariant.code, /new AbortController\(\)/);
assert.match(autocompleteGraphVariant.code, /status === 'success'/);
assert.match(autocompleteGraphVariant.code, /onPointerDown/);
assert.match(autocompleteGraphVariant.code, /aria-labelledby="autocomplete-label"/);
const autocompleteGraphLines = autocompleteGraphVariant.code.split('\n');
for (const node of autocompleteGraphVariant.nodes) {
  const { lineStart, lineEnd, snippet } = node.anchor;
  assert.ok(
    lineStart >= 1 && lineEnd >= lineStart && lineEnd <= autocompleteGraphLines.length,
    `${node.id}: invalid autocomplete anchor range`
  );
  assert.ok(
    autocompleteGraphLines.slice(lineStart - 1, lineEnd).join('\n').includes(snippet),
    `${node.id}: autocomplete anchor range must contain its snippet`
  );
}

const themeQuestion = json('cdn/questions/css/coding.json').find(
  (entry) => entry.id === 'css-theme-variables-dark-mode'
);
assert.ok(themeQuestion);
assert.equal(themeQuestion.updatedAt, '2026-07-14');
const themeContract = JSON.stringify(themeQuestion);
assert.match(themeContract, /:root:where\(\.theme-dark\)/);
assert.match(themeContract, /equal specificity/i);
assert.match(themeContract, /source order/i);
assert.doesNotMatch(themeContract, /html\.theme-dark/);
assert.ok(
  themeQuestion.webSolutionCss.indexOf(':root:where(.theme-dark)')
    > themeQuestion.webSolutionCss.indexOf('@media (prefers-color-scheme: dark)'),
  'Equal-specificity manual theme rule must follow the OS media query'
);

const progressQuestion = json('cdn/questions/react/coding.json').find(
  (entry) => entry.id === 'react-progress-bar-thresholds'
);
assert.ok(progressQuestion);
assert.equal(progressQuestion.updatedAt, '2026-07-14');
assert.equal(progressQuestion.access, 'premium');
assert.equal(progressQuestion.sdk.asset, 'assets/sb/react/question/react-progress-bar-thresholds.v1.json');
assert.equal(progressQuestion.solutionAsset, 'assets/sb/react/solution/react-progress-bar-thresholds-solution.v1.json');
const progressContract = JSON.stringify(progressQuestion);
assert.match(progressContract, /&lt;34/);
assert.match(progressContract, /&gt;66/);

const reactTiming = json('cdn/questions/react/trivia.json').find(
  (entry) => entry.id === 'react-useeffect-vs-uselayouteffect'
);
assert.ok(reactTiming);
assert.equal(reactTiming.updatedAt, '2026-07-14');
const reactTimingContract = JSON.stringify(reactTiming);
assert.match(reactTimingContract, /generally run after paint for non-interaction updates/i);
assert.match(reactTimingContract, /interaction-caused effect before paint/i);
assert.match(reactTimingContract, /does not provide a pre-paint guarantee/i);
assert.doesNotMatch(reactTimingContract, /useEffect runs after paint and is non-blocking/i);

const vueWatch = json('cdn/questions/vue/trivia.json').find(
  (entry) => entry.id === 'vue-watch-vs-watcheffect-differences-infinite-loops'
);
assert.ok(vueWatch);
assert.equal(vueWatch.updatedAt, '2026-07-14');
const vueWatchContract = JSON.stringify(vueWatch);
assert.match(vueWatchContract, /watch\(count, \(\) =>/);
assert.match(vueWatchContract, /direct synchronous.*watchEffect.*suppressed/i);
assert.doesNotMatch(vueWatchContract, /\/\/ ❌ Infinite loop\\nwatchEffect/);

const vueRuntimeSource = read('frontend/src/assets/vendor/vue/vue.global.prod.js');
const vueContext = vm.createContext({
  console,
  setTimeout,
  clearTimeout,
  queueMicrotask,
  performance: { now: () => 0 }
});
vm.runInContext(vueRuntimeSource, vueContext, {
  filename: 'frontend/src/assets/vendor/vue/vue.global.prod.js'
});
const { ref, watch, watchEffect, version: vueVersion } = vueContext.Vue;
assert.match(vueVersion, /^3\./, 'The checked-in Vue 3 runtime must load in the VM');

const effectCount = ref(0);
let effectRuns = 0;
const stopEffect = watchEffect(() => {
  effectRuns += 1;
  effectCount.value += 1;
}, { flush: 'sync' });
assert.equal(effectRuns, 1, 'A direct synchronous watchEffect self-mutation is self-trigger-suppressed');
assert.equal(effectCount.value, 1);
stopEffect();

const watchedCount = ref(0);
let watchRuns = 0;
const stopWatch = watch(watchedCount, () => {
  watchRuns += 1;
  if (watchedCount.value < 4) watchedCount.value += 1;
}, { flush: 'sync' });
watchedCount.value += 1;
assert.equal(watchRuns, 4, 'A watch callback can recursively trigger itself when it mutates its source');
assert.equal(watchedCount.value, 4, 'The explicit guard must bound the recursion deterministically');
stopWatch();

const angularForms = json('cdn/questions/angular/trivia.json').find(
  (entry) => entry.id === 'angular-template-driven-vs-reactive-forms-which-scales'
);
assert.ok(angularForms);
assert.equal(angularForms.updatedAt, '2026-08-27');
assert.equal(angularForms.access, 'free');
assert.equal(
  angularForms.seo?.title,
  'Template-Driven vs Reactive Forms: Angular Interview'
);
assert.equal(
  angularForms.seo?.description,
  'Angular interview answer comparing template-driven and reactive forms by state, validation, dynamic controls, testing, and when ngModel stops scaling.'
);
const angularFormsContract = JSON.stringify(angularForms);
assert.match(angularFormsContract, /Signal Forms are stable|stable Signal Forms/i);
assert.match(angularFormsContract, /production option/i);
assert.doesNotMatch(angularFormsContract, /Signal Forms[^.]{0,80}experimental/i);
const angularFormsAnswer = (angularForms.answer?.blocks || [])
  .map((block) => block?.text || '')
  .join('\n');
assert.match(angularForms.description, /Template-driven forms fit small, mostly static Angular forms\./);
assert.match(angularForms.description, /Reactive Forms scale better when dynamic controls, cross-field or async validation/i);
assert.match(angularFormsAnswer, /Migration threshold checklist/i);
assert.match(angularFormsAnswer, /Same form, three changes later/i);
assert.match(angularFormsAnswer, /Testable proof/i);
assert.match(angularFormsAnswer, /Angular 22 note: where Signal Forms fit/i);
assert.match(angularFormsAnswer, /Verify the comparison/i);
assert.doesNotMatch(angularFormsAnswer, /Large-form tradeoffs/i);
assert.doesNotMatch(angularFormsAnswer, /Interactive form flow comparator/i);
const angularFormsOfficialSources = Array.from(
  angularFormsAnswer.matchAll(/href="(https:\/\/(?:angular\.dev|blog\.angular\.dev)[^"]+)"/g),
  (match) => match[1]
);
assert.equal(new Set(angularFormsOfficialSources).size, 4);
const angularFormsInternalLinks = Array.from(
  angularFormsAnswer.matchAll(/href="(\/[^"]+)"/g),
  (match) => match[1]
);
assert.ok(new Set(angularFormsInternalLinks).size >= 2);
assert.ok(angularForms.incidentCard, 'Angular forms pilot must retain its incident card');
const angularPrepGuide = read(
  'frontend/src/app/features/guides/playbook/framework-prep-path-article.component.ts'
);
assert.match(
  angularPrepGuide,
  /Compare template-driven, Reactive Forms, and stable Signal Forms, then choose one for a concrete Angular 22 form\./
);
assert.match(
  angularPrepGuide,
  /label: 'Reactive vs template-driven forms', route: \['\/', 'angular', 'trivia', 'angular-template-driven-vs-reactive-forms-which-scales'\]/
);

const imageLinkTrivia = json('cdn/questions/html/trivia.json').find(
  (entry) => entry.id === 'html-clickable-image'
);
const imageLinkCoding = json('cdn/questions/html/coding.json').find(
  (entry) => entry.id === 'html-links-and-images'
);
for (const [label, question] of [
  ['HTML clickable-image trivia', imageLinkTrivia],
  ['HTML links-and-images coding', imageLinkCoding]
]) {
  assert.ok(question, `${label} must exist`);
  assert.equal(question.updatedAt, '2026-07-14');
  assert.equal(question.access, 'free');
  const contract = JSON.stringify(question);
  assert.match(contract, /anchor without href is not a hyperlink/i);
  assert.match(contract, /<a (?:href=|href\\=)/i);
}
const interviewHubSource = read(
  'frontend/src/app/features/interview-questions/interview-questions-landing.component.ts'
);
assert.match(interviewHubSource, /cta: 'Compare template-driven vs reactive forms'/);
assert.match(interviewHubSource, /label: 'Compare template-driven vs reactive forms'/);
assert.match(interviewHubSource, /<a href="\/pricing"><img alt="arrow"><\/a>/);
assert.match(interviewHubSource, /anchor without href is not a hyperlink/i);
assert.doesNotMatch(interviewHubSource, /<a><img alt="arrow"><\/a>/);

console.log('Framework content regressions: PASS');
console.log('Legacy RIGHT -> UP -> LEFT reproduction: pending direction became LEFT');
console.log(`Vue ${vueVersion} watcher semantics: watchEffect=1 run, bounded watch=4 runs`);
