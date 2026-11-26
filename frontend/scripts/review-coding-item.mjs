#!/usr/bin/env node
// Reviews one coding or debug item against docs/ai-context/coding-item-checks.md and writes the review record
// (content-reviews/coding/<tech>/<id>.json) that the pre-push gate asks for. This is the only place a model is called:
// blind solvers that see only the page and the starter, and one reviewer that reads the checklist's rules, each through
// `claude -p` from an empty folder with no tools. Everything a model writes is run through the item's real checks.
// Local evidence (solver code, variants, the full report) stays in reports/coding-reviews/<tech>/<id>/.
//
//   npm run review:coding-item -- <tech>/<id> [--skip "<reason>"] [--accept A4,B2 "<reason>"]
//     [--solver-models sonnet,sonnet,haiku] [--reviewer-model sonnet] [--new-solvers] [--force] [--build]
//
// A `review` finding blocks the push until it is fixed (new content, new review) or accepted with --accept, which
// records the reason and calls no model. A record that already exists for the same content ends the run with no model
// call unless --force. While the page text and the starter are unchanged, the stored blind solutions are rerun instead
// of asking for new ones, so a fix to the checks costs one reviewer call. CODING_REVIEW_MODEL_CMD replaces `claude`.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RULE_IDS,
  assetSourcePath,
  formatRecord,
  itemHashes,
  openReviewRules,
  readCatalogItems,
  recordPath,
  recordProblem,
} from './coding-review-lib.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const frontendRoot = path.resolve(path.dirname(scriptPath), '..');
const repoRoot = path.resolve(frontendRoot, '..');
const checklistPath = path.join(repoRoot, 'docs/ai-context/coding-item-checks.md');
const MODEL_TIMEOUT_MS = 20 * 60_000;
const JS_CANDIDATE_TIMEOUT_MS = 120_000;
const REVIEWER_RULES = ['A3', 'A4', 'A5', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4'];

const readWorkingTree = (relative) => {
  try {
    return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
  } catch {
    return null;
  }
};

function fail(message) {
  console.error(`[review] ERROR: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------------------------------------------------
// JavaScript candidates run one per child process, so an endless loop or a frozen prototype stays in that child.

async function runJsWorker(inputPath, outputPath) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const entry = readCatalogItems(readWorkingTree).find(
    (candidate) => candidate.tech === 'javascript' && candidate.kind === input.kind && candidate.id === input.id,
  );
  const { importSolution, runTaskTests } = await import('./js-task-test-lib.mjs');
  let result;
  try {
    const solution = await importSolution(input.code, input.language, input.label);
    const results = await runTaskTests(entry.item, input.language, solution);
    result = {
      label: input.label,
      checks: results.map((test) => ({
        name: test.fullName,
        passed: test.passed,
        error: test.passed ? '' : String(test.error?.message ?? test.error),
      })),
    };
  } catch (error) {
    result = { label: input.label, runnerError: String(error?.message ?? error) };
  }
  fs.writeFileSync(outputPath, JSON.stringify(result));
}

function runJsCandidates(entry, candidates, workDir) {
  const runDir = path.join(workDir, 'runs');
  fs.mkdirSync(runDir, { recursive: true });
  return candidates.map((candidate) => {
    const inputPath = path.join(runDir, `${candidate.label}.input.json`);
    const outputPath = path.join(runDir, `${candidate.label}.result.json`);
    fs.rmSync(outputPath, { force: true });
    fs.writeFileSync(inputPath, JSON.stringify({
      kind: entry.kind,
      id: entry.id,
      label: candidate.label,
      language: candidate.language ?? 'js',
      code: candidate.files?.['solution.js'] ?? '',
    }));
    const child = spawnSync(process.execPath, [scriptPath, '--js-worker', inputPath, outputPath], {
      cwd: frontendRoot,
      encoding: 'utf8',
      timeout: JS_CANDIDATE_TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024,
    });
    if (fs.existsSync(outputPath)) return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const reason = child.error?.code === 'ETIMEDOUT' ? `timed out after ${JS_CANDIDATE_TIMEOUT_MS / 1000} s` : (child.stderr || '').trim().slice(-400);
    return { label: candidate.label, runnerError: reason || `exited with ${child.status}` };
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Framework and HTML/CSS candidates run in the built app through e2e/coding-review-candidates.prod.spec.ts.

const distBrowser = path.join(frontendRoot, 'dist/frontendatlas/browser');

function distProblems(entry) {
  if (!fs.existsSync(distBrowser)) return ['there is no production build'];
  const problems = [];
  let built = null;
  try {
    built = JSON.parse(fs.readFileSync(path.join(distBrowser, `assets/questions/${entry.tech}/${entry.kind}.json`), 'utf8'));
  } catch {
    // Reported below.
  }
  const builtItem = Array.isArray(built) ? built.find((item) => item.id === entry.id) : null;
  if (JSON.stringify(builtItem) !== JSON.stringify(entry.item)) problems.push('the built catalog entry differs from cdn/');
  for (const ref of [entry.item.sdk?.asset, entry.item.solutionAsset].filter(Boolean)) {
    const builtAsset = (() => {
      try {
        return fs.readFileSync(path.join(distBrowser, ref.replace(/^\/+/, '')), 'utf8');
      } catch {
        return null;
      }
    })();
    if (builtAsset !== readWorkingTree(assetSourcePath(ref))) problems.push(`the built ${ref} differs from cdn/`);
  }
  return problems;
}

function ensureFreshBuild(entry, build) {
  const problems = distProblems(entry);
  if (!problems.length) return;
  if (!build) {
    fail(`${problems.join('; ')}. Rebuild first (rm -rf dist && npm run build in frontend/) or pass --build. No model was called.`);
  }
  console.log('[review] Building the app, since the checks run in the production build...');
  fs.rmSync(path.join(frontendRoot, 'dist'), { recursive: true, force: true });
  const result = spawnSync('npm', ['run', 'build'], { cwd: frontendRoot, stdio: 'inherit' });
  if (result.status !== 0) fail('npm run build failed. No model was called.');
  const after = distProblems(entry);
  if (after.length) fail(`the fresh build still differs: ${after.join('; ')}`);
}

function runPlaywrightCandidates(entry, surface, candidates, workDir, runName) {
  const runDir = path.join(workDir, runName);
  const resultsDir = path.join(runDir, 'results');
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.mkdirSync(resultsDir, { recursive: true });
  const candidatesPath = path.join(runDir, 'candidates.json');
  const checkCount = entry.item.frameworkTests.length;
  fs.writeFileSync(candidatesPath, JSON.stringify(candidates.map((candidate) => ({
    label: candidate.label,
    tech: entry.tech,
    kind: entry.kind,
    id: entry.id,
    surface,
    checkCount,
    source: candidate.source ?? (candidate.files ? 'files' : 'starter'),
    files: candidate.files ?? null,
  })), null, 2));
  const logPath = path.join(runDir, 'playwright.log');
  const log = fs.openSync(logPath, 'w');
  console.log(`[review] Running ${candidates.length} candidate(s) through the checks in the built app (log: ${path.relative(repoRoot, logPath)})...`);
  spawnSync('npx', [
    'playwright', 'test', 'e2e/coding-review-candidates.prod.spec.ts', '--project=chromium', '--workers=2', '--reporter=line',
  ], {
    cwd: frontendRoot,
    stdio: ['ignore', log, log],
    timeout: 45 * 60_000,
    env: {
      ...process.env,
      PLAYWRIGHT_SSR: '1',
      PLAYWRIGHT_WEB_SERVER: '1',
      PLAYWRIGHT_REUSE_SERVER: '0',
      PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT || '4310',
      CODING_REVIEW_CANDIDATES: candidatesPath,
      CODING_REVIEW_RESULTS: resultsDir,
    },
  });
  fs.closeSync(log);
  return candidates.map((candidate) => {
    const resultPath = path.join(resultsDir, `${candidate.label}.json`);
    if (fs.existsSync(resultPath)) return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    return { label: candidate.label, runnerError: `no result; see ${path.relative(repoRoot, logPath)}` };
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// What the page shows, rendered as text for the solvers and the reviewer.

const decode = (text) => String(text)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const unescapeWeb = (value) => String(value ?? '').replace(/\\n/g, '\n');
const heading = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase()).replace(/ ([A-Z])/g, (_m, letter) => ` ${letter.toLowerCase()}`);

function fence(language, code) {
  const longest = Math.max(0, ...(String(code).match(/`+/g) ?? []).map((run) => run.length));
  const marks = '`'.repeat(Math.max(3, longest + 1));
  return `${marks}${language}\n${code}\n${marks}`;
}

function renderValue(value, indent = '') {
  if (value == null) return '';
  if (typeof value === 'string') return decode(value);
  if (Array.isArray(value)) return value.map((item) => `${indent}- ${renderValue(item, `${indent}  `).trimStart()}`).join('\n');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, inner]) => (inner && typeof inner === 'object'
        ? `${indent}${key}:\n${renderValue(inner, `${indent}  `)}`
        : `${indent}${key}: ${renderValue(inner)}`))
      .join('\n');
  }
  return String(value);
}

function renderDescription(description) {
  if (typeof description === 'string') return decode(description);
  const parts = [];
  if (description?.text) parts.push(decode(description.text));
  if (description?.summary) parts.push(decode(description.summary));
  if (description?.arguments?.length) {
    parts.push(`Arguments:\n${description.arguments.map((arg) => `- ${arg.name} (${arg.type}): ${decode(arg.desc ?? '')}`).join('\n')}`);
  }
  if (description?.returns) parts.push(`Returns:\n${renderValue(description.returns)}`);
  for (const [key, value] of Object.entries(description?.specs ?? {})) parts.push(`${heading(key)}:\n${renderValue(value)}`);
  if (description?.examples?.length) {
    parts.push(`Examples:\n${description.examples.map((example) => fence('js', typeof example === 'string' ? example : renderValue(example))).join('\n')}`);
  }
  return parts.join('\n\n');
}

function assetFiles(ref) {
  if (!ref) return {};
  const asset = JSON.parse(readWorkingTree(assetSourcePath(ref)) ?? '{}');
  return Object.fromEntries(Object.entries(asset.files ?? {}).flatMap(([filePath, value]) => {
    const code = typeof value === 'string' ? value : value?.code;
    return typeof code === 'string' ? [[filePath.replace(/^\/+/, ''), code]] : [];
  }));
}

const languageOf = (filePath) => (filePath.match(/\.([a-z]+)$/)?.[1] ?? '');
const renderFiles = (files) => Object.entries(files).map(([filePath, code]) => `File: ${filePath}\n${fence(languageOf(filePath), code)}`).join('\n\n');

function checkTargets(checks) {
  const seen = new Set();
  for (const check of checks ?? []) {
    for (const step of check?.steps ?? []) {
      for (const part of [step, step?.among, step?.than]) {
        if (part?.by) seen.add(JSON.stringify(part.by));
        else if (part?.selector) seen.add(String(part.selector).trim());
      }
    }
  }
  return [...seen];
}

function describeItem(entry, surface) {
  const { item } = entry;
  const page = [`# ${item.title}`, renderDescription(item.description)];
  let starter;
  if (surface === 'js') {
    starter = { 'solution.js': item.starterCode };
    page.push(`## Tests shown on the page\n${fence('js', item.tests)}`);
  } else if (surface === 'web') {
    starter = { 'index.html': unescapeWeb(item.web?.starterHtml), 'styles.css': unescapeWeb(item.web?.starterCss) };
  } else {
    starter = Object.fromEntries(Object.entries(assetFiles(item.sdk?.asset)).filter(([filePath]) => filePath.startsWith('src/')));
  }
  if (surface !== 'js') {
    const targets = checkTargets(item.frameworkTests).map((target) => `\`${target}\``).join(', ');
    page.push(`## Checks the page lists\n${item.frameworkTests.map((check) => `- ${check.name}`).join('\n')}${targets ? `\n\nElements the checks find: ${targets}` : ''}`);
  }
  return { pageText: page.join('\n\n'), starter };
}

function referenceCandidates(entry, surface) {
  const { item } = entry;
  if (surface === 'js') {
    if (entry.kind === 'debug') return [{ label: 'reference-fix', files: { 'solution.js': item.solution } }];
    return (item.solutionBlock?.approaches ?? []).flatMap((approach, index) => [
      approach?.codeJs ? { label: `reference-${index + 1}-js`, files: { 'solution.js': approach.codeJs } } : null,
      approach?.codeTs ? { label: `reference-${index + 1}-ts`, language: 'ts', files: { 'solution.js': approach.codeTs } } : null,
    ].filter(Boolean));
  }
  if (surface === 'web') {
    return [{ label: 'reference', files: { 'index.html': unescapeWeb(item.webSolutionHtml), 'styles.css': unescapeWeb(item.webSolutionCss) } }];
  }
  const starterFiles = assetFiles(item.sdk?.asset);
  const changed = Object.fromEntries(Object.entries(assetFiles(item.solutionAsset)).filter(([filePath, code]) => starterFiles[filePath] !== code));
  return [{ label: 'reference', source: 'solution', files: changed }];
}

// ---------------------------------------------------------------------------------------------------------------------
// Models.

function cleanEnv() {
  const keep = ['HOME', 'USER', 'LOGNAME', 'SHELL', 'PATH', 'TMPDIR'];
  const env = Object.fromEntries(keep.filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
  return { ...env, LANG: process.env.LANG || 'en_US.UTF-8', TERM: 'dumb' };
}

let modelCalls = 0;
function callModel({ model, system, prompt, label, workDir }) {
  modelCalls += 1;
  const command = process.env.CODING_REVIEW_MODEL_CMD || 'claude';
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'coding-review-'));
  const args = ['-p', '--model', model, '--system-prompt', system, '--tools', '', '--setting-sources', 'project',
    '--strict-mcp-config', '--no-chrome', '--no-session-persistence'];
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: cleanEnv(), stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), MODEL_TIMEOUT_MS);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { stderr += String(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      fs.rmSync(cwd, { recursive: true, force: true });
      const rawDir = path.join(workDir, 'raw');
      fs.mkdirSync(rawDir, { recursive: true });
      fs.writeFileSync(path.join(rawDir, `${label}.txt`), `${stdout}\n--- stderr ---\n${stderr}`);
      resolve(code === 0 ? { text: stdout } : { error: `${command} exited with ${code}: ${stderr.trim().slice(-300)}` });
    });
    child.stdin.end(prompt);
  });
}

/** `File: <path>` lines each followed by a fenced block; without any, the first fenced block as `defaultPath`. */
function parseFiles(text, defaultPath) {
  const files = {};
  const pattern = /^[ \t]*(?:\*\*)?File:[ \t]*`?([^\s`*]+)`?(?:\*\*)?[ \t]*\n(`{3,})[^\n]*\n([\s\S]*?)\n\2[ \t]*(?:\n|$)/gm;
  for (const match of text.matchAll(pattern)) files[match[1].replace(/^\/+/, '')] = match[3];
  if (!Object.keys(files).length && defaultPath) {
    const block = /(`{3,})[^\n]*\n([\s\S]*?)\n\1/.exec(text);
    if (block) files[defaultPath] = block[2];
  }
  return files;
}

function keepAnswerFiles(files, surface) {
  if (surface === 'js') return files['solution.js'] ? { 'solution.js': files['solution.js'] } : {};
  if (surface === 'web') {
    return Object.fromEntries(['index.html', 'styles.css'].filter((name) => name in files).map((name) => [name, files[name]]));
  }
  return Object.fromEntries(Object.entries(files).filter(([filePath]) => filePath.startsWith('src/')));
}

const ANSWER_FORMAT = {
  js: 'Reply with the complete solution file in one ```js code block. Keep the default export the starter has.',
  web: 'Write a line `File: index.html` followed by the whole HTML in one fenced code block, then a line `File: styles.css` followed by the whole CSS in one fenced code block.',
  framework: 'For every file you change, write a line `File: <path>` followed by the whole file in one fenced code block. Change only files under src/.',
};
const DEFAULT_PATH = { js: 'solution.js', web: null, framework: null };

function solverPrompt(described, surface) {
  return [
    'Solve this frontend coding exercise. You see exactly what the exercise page shows; nothing else about it is available.',
    described.pageText,
    `## Starter code\n${renderFiles(described.starter)}`,
    `## Your answer\n${ANSWER_FORMAT[surface]} No explanation.`,
  ].join('\n\n');
}

function extractSection(markdown, title) {
  const start = markdown.indexOf(`\n## ${title}`);
  if (start < 0) return '';
  const end = markdown.indexOf('\n## ', start + 4);
  return markdown.slice(start + 1, end < 0 ? undefined : end).trim();
}

const summarize = (result) => {
  if (result.runnerError) return `could not run: ${result.runnerError.slice(0, 300)}`;
  const failed = result.checks.filter((check) => !check.passed);
  const head = `${result.checks.length - failed.length}/${result.checks.length} passed`;
  return failed.length
    ? `${head}; failed: ${failed.map((check) => `${check.name}${check.error ? ` (${check.error.slice(0, 160)})` : ''}`).join('; ')}`
    : head;
};

function reviewerPrompt({ entry, surface, described, references, starterResult, solverResults }) {
  const checklist = fs.readFileSync(checklistPath, 'utf8');
  const rules = [extractSection(checklist, 'Rules at a glance')];
  if (surface !== 'js') rules.push(extractSection(checklist, 'Runner limits (framework and web checks)'));
  const checks = surface === 'js'
    ? `## Tests (JavaScript; a TypeScript copy also exists)\n${fence('js', entry.item.tests)}`
    : `## Checks (JSON, as the runner reads them)\n${fence('json', JSON.stringify(entry.item.frameworkTests, null, 2))}`;
  const ran = [
    ...references.map(({ candidate, result }) => `- Reference ${candidate.label}: ${summarize(result)}`),
    `- Starter: ${summarize(starterResult)}`,
    ...solverResults.map(({ solver, result }) => `- Blind solver ${solver.label} (${solver.model}; saw only the page and the starter): ${summarize(result)}`),
  ];
  const variantPath = { js: 'solution.js', web: 'index.html and styles.css', framework: 'only the src/ files you change, each whole' }[surface];
  return [
    'Review this frontend coding exercise before it ships. The rules come from the repository checklist; cite their IDs.',
    `## Rules\n${rules.join('\n\n')}`,
    `## The exercise page\n${described.pageText}`,
    `## Catalog metadata (for B5)\nDifficulty: ${entry.item.difficulty ?? 'not set'}. Estimated minutes: ${entry.item.estimatedMinutes ?? 'not set, so the site uses the default for the difficulty (easy 15, intermediate 30, hard 45)'}.`,
    `## Starter\n${renderFiles(described.starter)}`,
    `## Reference solution\n${references.map(({ candidate }) => `### ${candidate.label}\n${renderFiles(candidate.files ?? {})}`).join('\n\n')}`,
    checks,
    `## What already ran through the real checks\n${ran.join('\n')}`,
    [
      '## Your answer',
      `First one JSON block: {"rules": {"<id>": {"status": "pass" | "concern", "note": "..."}}, "findings": [{"rule": "<id>", "text": "..."}]} with an entry for each of ${REVIEWER_RULES.join(', ')}. "pass" means you found no problem for that rule; "concern" means you did, and the note says what.`,
      'Then up to three A3 variants (correct solutions written differently from the reference, which fair checks must accept) and up to three A4 variants (plausible wrong solutions you suspect pass every check). Each variant starts with a heading line, then its files:',
      '### Variant A4: <one line: what is wrong and which requirement it breaks>',
      `File: <path>, then the whole file in one fenced code block. Files: ${variantPath}.`,
      'Every variant is run through the real checks, so write complete, runnable code.',
    ].join('\n'),
  ].join('\n\n');
}

function parseReview(text, surface) {
  let verdict = null;
  const json = /```json[^\n]*\n([\s\S]*?)\n```/.exec(text);
  if (json) {
    try {
      verdict = JSON.parse(json[1]);
    } catch {
      verdict = null;
    }
  }
  const variants = [];
  const headings = [...text.matchAll(/^###[ \t]*Variant[ \t]+(A3|A4)[ \t]*:?[ \t]*(.*)$/gm)];
  headings.forEach((match, index) => {
    const body = text.slice(match.index + match[0].length, headings[index + 1]?.index ?? text.length);
    const files = keepAnswerFiles(parseFiles(body, DEFAULT_PATH[surface]), surface);
    if (Object.keys(files).length) variants.push({ rule: match[1], why: match[2].trim(), files });
  });
  return { verdict, variants };
}

// ---------------------------------------------------------------------------------------------------------------------
// Rules.

const allPassed = (result) => !result.runnerError && result.checks.length > 0 && result.checks.every((check) => check.passed);
const worse = (a, b) => {
  const order = ['pass', 'not-run', 'review', 'fail'];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
};

function decideRules({ references, starterResult, solverResults, variantResults, verdict }) {
  const rules = Object.fromEntries(RULE_IDS.map((id) => [id, { status: 'not-run', note: '' }]));
  const set = (id, status, note = '') => { rules[id] = { status, note }; };

  const broken = references.filter(({ result }) => result.runnerError);
  const failing = references.filter(({ result }) => !result.runnerError && !allPassed(result));
  if (!references.length) set('A1', 'not-run', 'no reference solution found');
  else if (failing.length) set('A1', 'fail', failing.map(({ candidate, result }) => `${candidate.label}: ${summarize(result)}`).join(' | '));
  else if (broken.length) set('A1', 'not-run', broken.map(({ candidate, result }) => `${candidate.label}: ${summarize(result)}`).join(' | '));
  else set('A1', 'pass', `${references.length} reference run(s) passed every check`);

  // A starter can pass a check fairly (one that only rules out a wrong behavior), so a partial pass is for a person.
  if (!starterResult || starterResult.runnerError) set('A2', 'not-run', starterResult ? summarize(starterResult) : 'not run');
  else {
    const passing = starterResult.checks.filter((check) => check.passed);
    if (!passing.length) set('A2', 'pass', 'the starter fails every check');
    else if (passing.length === starterResult.checks.length) set('A2', 'fail', 'the starter passes every check');
    else set('A2', 'review', `the starter passes: ${passing.map((check) => check.name).join('; ')}`);
  }

  if (solverResults.length) {
    const failed = solverResults.filter(({ result }) => !allPassed(result));
    set('B1', failed.length ? 'review' : 'pass', solverResults.map(({ solver, result }) => `${solver.label} (${solver.model}): ${summarize(result)}`).join(' | '));
  }

  const fromReviewer = (id) => {
    const entry = verdict?.rules?.[id];
    if (!entry) return null;
    return { status: entry.status === 'pass' ? 'pass' : 'review', note: String(entry.note ?? '') };
  };
  for (const id of REVIEWER_RULES) {
    const reviewer = fromReviewer(id);
    if (reviewer) set(id, reviewer.status, reviewer.note);
  }

  const evidence = (rule, isBad) => {
    const runs = variantResults.filter(({ variant }) => variant.rule === rule);
    if (!runs.length) return;
    const bad = runs.filter(isBad);
    const status = bad.length ? 'review' : 'pass';
    const note = runs.map(({ variant, result }) => `${variant.label} (${variant.why}): ${summarize(result)}`).join(' | ');
    const reviewer = fromReviewer(rule);
    set(rule, reviewer ? worse(status, reviewer.status) : status, [reviewer?.note, note].filter(Boolean).join(' | '));
  };
  // A correct variant that fails points at an over-strict check; a wrong one that passes everything, at a missing one.
  evidence('A3', ({ result }) => !allPassed(result));
  evidence('A4', ({ result }) => allPassed(result));

  set('C5', 'not-run', 'type-checking is not automated yet');
  return rules;
}

function decideResult(rules, { reviewerRan, solversRan, accepted }) {
  const statuses = Object.values(rules).map((rule) => rule.status);
  if (statuses.includes('fail')) return 'fail';
  if (rules.A1.status === 'not-run' || rules.A2.status === 'not-run' || !reviewerRan || !solversRan) return 'incomplete';
  const open = Object.entries(rules).filter(([rule, { status }]) => status === 'review' && !accepted[rule]);
  return open.length ? 'needs-attention' : 'pass';
}

/** Records a person's decision on `review` findings; calls no model. */
function acceptFindings(entry, hashes, accepts) {
  const target = recordPath(entry.tech, entry.id);
  const text = readWorkingTree(target);
  if (!text) fail(`${target} does not exist; review the item first.`);
  const record = JSON.parse(text);
  if (record.mode !== 'full') fail(`${target} is a ${record.mode} record; there is nothing to accept.`);
  if (record.hash !== hashes.hash) fail('the item changed since its review, so the findings may not apply any more; review it again.');
  for (const { rules, reason } of accepts) {
    if (!String(reason ?? '').trim()) fail('--accept needs a reason after the rule list.');
    for (const rule of rules) {
      if (record.rules?.[rule] !== 'review') fail(`${rule} is "${record.rules?.[rule] ?? 'unknown'}"; only review findings can be accepted.`);
      record.accepted = { ...record.accepted, [rule]: String(reason).trim() };
    }
  }
  if (record.result === 'needs-attention' && !openReviewRules(record).length) record.result = 'pass';
  fs.writeFileSync(path.join(repoRoot, target), formatRecord(record));
  const open = openReviewRules(record);
  console.log(`[review] Accepted ${accepts.flatMap((accept) => accept.rules).join(', ')} without a model call; result: ${record.result}${open.length ? `; still open: ${open.join(', ')}` : ''}.`);
  console.log(`[review] Record: ${target} (commit it with the change).`);
  if (record.result !== 'pass') process.exitCode = 1;
}

// ---------------------------------------------------------------------------------------------------------------------

function parseArgs(argv) {
  // Sonnet reviews: the user's usage limit is scarce, and Opus costs the most of it.
  const options = { solverModels: ['sonnet', 'sonnet', 'haiku'], reviewerModel: 'sonnet', newSolvers: false, force: false, build: false, accept: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--skip') options.skip = argv[++index] ?? '';
    else if (arg === '--accept') {
      const rules = String(argv[++index] ?? '').split(',').map((rule) => rule.trim().toUpperCase()).filter(Boolean);
      options.accept.push({ rules, reason: argv[++index] });
    }
    else if (arg === '--solver-models') options.solverModels = String(argv[++index] ?? '').split(',').map((model) => model.trim()).filter(Boolean);
    else if (arg === '--reviewer-model') options.reviewerModel = argv[++index];
    else if (arg === '--new-solvers') options.newSolvers = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--build') options.build = true;
    else if (arg.startsWith('--')) fail(`unknown option ${arg}`);
    else options.target = arg;
  }
  return options;
}

function writeRecord(entry, hashes, fields) {
  const record = {
    id: entry.id,
    tech: entry.tech,
    kind: entry.kind,
    hashVersion: hashes.hashVersion,
    hash: hashes.hash,
    pageHash: hashes.pageHash,
    checksHash: hashes.checksHash,
    reviewedAt: new Date().toISOString().slice(0, 10),
    ...fields,
  };
  const target = path.join(repoRoot, recordPath(entry.tech, entry.id));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, formatRecord(record));
  return path.relative(repoRoot, target);
}

async function main() {
  const workerIndex = process.argv.indexOf('--js-worker');
  if (workerIndex >= 0) {
    await runJsWorker(process.argv[workerIndex + 1], process.argv[workerIndex + 2]);
    return;
  }

  const options = parseArgs(process.argv.slice(2));
  const [tech, id] = String(options.target ?? '').split('/');
  if (!tech || !id) fail('usage: npm run review:coding-item -- <tech>/<id> [--skip "<reason>"]');
  const entry = readCatalogItems(readWorkingTree).find((candidate) => candidate.tech === tech && candidate.id === id);
  if (!entry) fail(`no coding or debug item ${tech}/${id} in cdn/questions/${tech}/`);
  const hashes = itemHashes(entry.item, readWorkingTree);

  if (options.accept.length) {
    acceptFindings(entry, hashes, options.accept);
    return;
  }

  const existingText = readWorkingTree(recordPath(tech, id));
  const existing = existingText ? JSON.parse(existingText) : null;
  const sameContent = existing?.hash === hashes.hash;
  if (!options.force && options.skip === undefined && sameContent) {
    if (!recordProblem({ hashes }, existingText)) {
      console.log(`[review] ${recordPath(tech, id)} already covers this content; no model was called. Pass --force to review again.`);
      return;
    }
    // Reviewing unchanged content again would give the same answer: fix the item, or accept the findings.
    if (existing.mode === 'full' && (existing.result === 'needs-attention' || existing.result === 'fail')) {
      const open = openReviewRules(existing);
      fail(`the last review of this exact content is "${existing.result}"${open.length ? ` (open: ${open.join(', ')})` : ''}. Read reports/coding-reviews/${tech}/${id}/report.md, then change the item or run --accept <rules> "<reason>". No model was called; --force reviews again.`);
    }
  }
  // Decisions recorded for this exact content stay with it through a --force rerun.
  const carriedAccepted = sameContent ? existing?.accepted ?? {} : {};

  if (options.skip !== undefined) {
    if (!String(options.skip).trim()) fail('--skip needs a reason');
    const written = writeRecord(entry, hashes, {
      mode: 'skip',
      skipReason: String(options.skip).trim(),
      result: 'skipped',
      rules: Object.fromEntries(RULE_IDS.map((rule) => [rule, 'not-run'])),
    });
    console.log(`[review] Skipped without a model call; wrote ${written}. Commit it with the change.`);
    return;
  }

  const surface = tech === 'javascript' ? 'js' : tech === 'html' || tech === 'css' ? 'web' : 'framework';
  if (surface !== 'js' && !entry.item.frameworkTests?.length) fail(`${tech}/${id} has no checks to run`);
  if (surface === 'js' && entry.kind === 'debug') {
    const { loadTsModule } = await import('./load-ts-module.mjs');
    const { parseFileBundle } = loadTsModule(path.join(frontendRoot, 'src/app/core/utils/file-bundle.util.ts'));
    if (parseFileBundle(entry.item.starterCode)) fail('multi-file debug tasks are not supported yet; run node scripts/debug-bundle-regressions.test.mjs');
  }
  if (!options.solverModels.length) fail('--solver-models needs at least one model');
  if (surface !== 'js') ensureFreshBuild(entry, options.build);

  const workDir = path.join(repoRoot, 'reports/coding-reviews', tech, id);
  fs.mkdirSync(workDir, { recursive: true });
  const statePath = path.join(workDir, 'state.json');
  const previous = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
  const samePage = previous?.pageHash === hashes.pageHash;
  const described = describeItem(entry, surface);
  const run = (candidates, runName) => (surface === 'js'
    ? runJsCandidates(entry, candidates, workDir)
    : runPlaywrightCandidates(entry, surface, candidates, workDir, runName));

  // Blind solvers: reuse what they wrote for this same page, or ask for new solutions.
  let solvers = [];
  const reused = samePage && !options.newSolvers && previous.solvers?.length > 0;
  if (reused) {
    solvers = previous.solvers;
    console.log(`[review] Page and starter unchanged: rerunning ${solvers.length} stored blind solution(s), no solver call.`);
  } else {
    console.log(`[review] Asking ${options.solverModels.length} blind solver(s): ${options.solverModels.join(', ')}...`);
    const prompt = solverPrompt(described, surface);
    const answers = await Promise.all(options.solverModels.map((model, index) => callModel({
      model,
      system: 'You are a frontend engineer solving a coding exercise. Answer with code only.',
      prompt,
      label: `solver-${index + 1}`,
      workDir,
    })));
    solvers = answers.flatMap((answer, index) => {
      const label = `solver-${index + 1}`;
      const model = options.solverModels[index];
      if (answer.error) {
        console.warn(`[review] WARN: ${label} (${model}) failed: ${answer.error}`);
        return [];
      }
      const files = keepAnswerFiles(parseFiles(answer.text, DEFAULT_PATH[surface]), surface);
      if (!Object.keys(files).length) {
        console.warn(`[review] WARN: ${label} (${model}) returned no code block; see raw/${label}.txt`);
        return [];
      }
      return [{ label, model, files }];
    });
  }
  const storedVariants = samePage ? previous?.variants ?? [] : [];

  const references = referenceCandidates(entry, surface);
  // A framework variant holds only the files it changes from the reference; the candidate run starts from the starter,
  // so the reference's other files go in with it (a variant of a CSS task would otherwise run on the starter's CSS).
  const referenceFiles = surface === 'framework' ? references[0]?.files ?? {} : {};
  const variantFiles = (variant) => ({ ...referenceFiles, ...variant.files });
  const firstRun = run([
    ...references,
    { label: 'starter', files: surface === 'js' ? { 'solution.js': entry.item.starterCode } : null },
    ...solvers.map((solver) => ({ label: solver.label, files: solver.files })),
    ...storedVariants.map((variant) => ({ label: variant.label, files: variantFiles(variant) })),
  ], 'run-1');
  const byLabel = new Map(firstRun.map((result) => [result.label, result]));
  const referenceRuns = references.map((candidate) => ({ candidate, result: byLabel.get(candidate.label) }));
  const starterResult = byLabel.get('starter');
  const solverResults = solvers.map((solver) => ({ solver, result: byLabel.get(solver.label) }));

  // The reviewer reads the checklist's rules and everything that ran; its variants then run through the checks too.
  console.log(`[review] Asking the reviewer (${options.reviewerModel})...`);
  const answer = await callModel({
    model: options.reviewerModel,
    system: 'You are a senior frontend engineer who reviews coding exercises and their automated checks before they ship. Be concrete and cite rule IDs.',
    prompt: reviewerPrompt({ entry, surface, described, references: referenceRuns, starterResult, solverResults }),
    label: 'reviewer',
    workDir,
  });
  const review = answer.error ? { verdict: null, variants: [] } : parseReview(answer.text, surface);
  if (answer.error) console.warn(`[review] WARN: the reviewer failed: ${answer.error}`);
  else if (!review.verdict) console.warn('[review] WARN: the reviewer gave no readable JSON block; see raw/reviewer.txt');
  const known = new Set(storedVariants.map((variant) => JSON.stringify(variant.files)));
  const newVariants = review.variants
    .filter((variant) => !known.has(JSON.stringify(variant.files)) && known.add(JSON.stringify(variant.files)))
    .map((variant, index) => ({ ...variant, label: `variant-${variant.rule.toLowerCase()}-${storedVariants.length + index + 1}` }));
  const newRuns = newVariants.length ? run(newVariants.map((variant) => ({ label: variant.label, files: variantFiles(variant) })), 'run-2') : [];
  for (const result of newRuns) byLabel.set(result.label, result);
  const variants = [...storedVariants, ...newVariants];
  const variantResults = variants.map((variant) => ({ variant, result: byLabel.get(variant.label) }));

  const rules = decideRules({ references: referenceRuns, starterResult, solverResults, variantResults, verdict: review.verdict });
  const accepted = Object.fromEntries(Object.entries(carriedAccepted).filter(([rule]) => rules[rule]?.status === 'review'));
  const result = decideResult(rules, { reviewerRan: Boolean(review.verdict), solversRan: solverResults.length > 0, accepted });
  fs.writeFileSync(statePath, JSON.stringify({ pageHash: hashes.pageHash, solvers, variants }, null, 2));

  const written = writeRecord(entry, hashes, {
    mode: 'full',
    result,
    rules: Object.fromEntries(Object.entries(rules).map(([rule, value]) => [rule, value.status])),
    ...(Object.keys(accepted).length ? { accepted } : {}),
    solvers: { count: solverResults.length, passedAllChecks: solverResults.filter(({ result: run }) => allPassed(run)).length, reused },
    variants: Object.fromEntries(['A3', 'A4'].map((rule) => {
      const runs = variantResults.filter(({ variant }) => variant.rule === rule);
      return [rule, { count: runs.length, passedAllChecks: runs.filter(({ result: run }) => allPassed(run)).length }];
    })),
    models: { solvers: solvers.map((solver) => solver.model), reviewer: options.reviewerModel },
  });

  const reportPath = path.join(workDir, 'report.md');
  const findings = (review.verdict?.findings ?? []).map((finding) => `- ${finding.rule ?? '?'}: ${finding.text ?? ''}`);
  fs.writeFileSync(reportPath, [
    `# Review of ${tech}/${id} (${entry.kind})`,
    `Result: **${result}**. Hash ${hashes.hash.slice(0, 12)}. Model calls this run: ${modelCalls}. Record: ${written}.`,
    '## Rules',
    ...RULE_IDS.map((rule) => `- **${rule}** ${rules[rule].status}${rules[rule].note ? `: ${rules[rule].note}` : ''}`),
    '## Reviewer findings',
    ...(findings.length ? findings : ['- none']),
    '## Variants',
    ...(variantResults.length ? variantResults.map(({ variant, result: run }) => `- ${variant.label} [${variant.rule}] ${variant.why}: ${summarize(run)}`) : ['- none']),
    '',
  ].join('\n\n'));

  console.log(`\n[review] ${tech}/${id}: ${result.toUpperCase()} (model calls this run: ${modelCalls})`);
  for (const rule of RULE_IDS) console.log(`  ${rule.padEnd(3)} ${rules[rule].status.padEnd(8)} ${rules[rule].note.slice(0, 160)}`);
  console.log(`[review] Record: ${written} (commit it with the change). Full report: ${path.relative(repoRoot, reportPath)}`);
  if (result === 'needs-attention') {
    const open = RULE_IDS.filter((rule) => rules[rule].status === 'review' && !accepted[rule]);
    console.log(`[review] The push stays blocked until each of ${open.join(', ')} is fixed in the item (then review again) or accepted: npm run review:coding-item -- ${tech}/${id} --accept ${open.join(',')} "<reason>"`);
  }
  if (result !== 'pass') process.exitCode = 1;
}

await main();
