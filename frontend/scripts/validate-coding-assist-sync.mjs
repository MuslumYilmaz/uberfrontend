#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ZERO_SHA = '0000000000000000000000000000000000000000';
const CODING_JSON_RE = /^(?:frontend\/src\/assets\/questions|cdn\/questions)\/[^/]+\/coding\.json$/;
const DECISION_GRAPH_RE = /^cdn\/questions\/[^/]+\/decision-graphs\/.+\.json$/;
const EXPLAIN_ARTIFACT_FILES = [
  'frontend/src/app/core/utils/failure-explain-rules.ts',
  'frontend/src/app/core/utils/failure-explain-content.json',
];

function readArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  return value || null;
}

function readLines(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items)];
}

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function parseQuestions(text, refLabel) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('Expected top-level array');
    }
    return parsed;
  } catch (error) {
    console.error(
      `[assist-sync] ERROR: Failed to parse ${refLabel} as JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exit(1);
  }
}

function toMapById(questions) {
  const map = new Map();
  for (const q of questions) {
    const id = typeof q?.id === 'string' ? q.id.trim() : '';
    if (!id) continue;
    map.set(id, q);
  }
  return map;
}

function normalizeApproaches(question) {
  const approaches = Array.isArray(question?.solutionBlock?.approaches)
    ? question.solutionBlock.approaches
    : [];
  return approaches.map((approach) => ({
    title: typeof approach?.title === 'string' ? approach.title : '',
    decisionGraphKey: typeof approach?.decisionGraphKey === 'string' ? approach.decisionGraphKey : '',
    decisionGraphAsset: typeof approach?.decisionGraphAsset === 'string' ? approach.decisionGraphAsset : '',
    codeJs: typeof approach?.codeJs === 'string' ? approach.codeJs : '',
    codeTs: typeof approach?.codeTs === 'string' ? approach.codeTs : '',
  }));
}

function extractRelevantShape(question) {
  return {
    starterCode: typeof question?.starterCode === 'string' ? question.starterCode : '',
    starterCodeTs: typeof question?.starterCodeTs === 'string' ? question.starterCodeTs : '',
    tests: typeof question?.tests === 'string' ? question.tests : '',
    testsTs: typeof question?.testsTs === 'string' ? question.testsTs : '',
    approaches: normalizeApproaches(question),
  };
}

function hasCodeOrTestPayload(question) {
  const shape = extractRelevantShape(question);
  if (shape.starterCode || shape.starterCodeTs || shape.tests || shape.testsTs) return true;
  return shape.approaches.some((item) => item.codeJs || item.codeTs);
}

function hasCodeOrTestsChanged(prevQuestion, nextQuestion) {
  if (!prevQuestion && nextQuestion) return hasCodeOrTestPayload(nextQuestion);
  if (prevQuestion && !nextQuestion) return false;
  const prevShape = extractRelevantShape(prevQuestion);
  const nextShape = extractRelevantShape(nextQuestion);
  return JSON.stringify(prevShape) !== JSON.stringify(nextShape);
}

function parentCommit(commit) {
  const line = git(['rev-list', '--parents', '-n', '1', commit]);
  if (!line) return null;
  const parts = line.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return parts[1] || null;
}

function listChangedFilesForCommit(commit) {
  const out = git(['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', commit]);
  if (!out) return [];
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function safeGitShow(spec) {
  try {
    return execFileSync('git', ['show', spec], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

function resolveRepoAssetPaths(assetValue) {
  const raw = String(assetValue || '').trim();
  if (!raw) return [];
  if (raw.startsWith('frontend/')) return [raw];
  if (raw.startsWith('assets/questions/')) {
    const rel = raw.slice('assets/'.length);
    return [path.posix.join('cdn', rel), path.posix.join('frontend/src', raw)];
  }
  if (raw.startsWith('assets/')) return [path.posix.join('frontend/src', raw)];
  return [];
}

function resolveCurrentCatalogPath(filePath) {
  const canonical = filePath.replace(/^frontend\/src\/assets\/questions\//, 'cdn/questions/');
  if (fs.existsSync(canonical)) return canonical;
  return filePath;
}

function collectDecisionGraphPaths(question) {
  const paths = new Set();

  const topLevelAssets = resolveRepoAssetPaths(question?.decisionGraphAsset);
  for (const assetPath of topLevelAssets) paths.add(assetPath);

  const approaches = Array.isArray(question?.solutionBlock?.approaches)
    ? question.solutionBlock.approaches
    : [];
  for (const approach of approaches) {
    const explicitAssets = resolveRepoAssetPaths(approach?.decisionGraphAsset);
    if (explicitAssets.length > 0) {
      for (const assetPath of explicitAssets) paths.add(assetPath);
      continue;
    }
    for (const assetPath of topLevelAssets) paths.add(assetPath);
  }

  return [...paths];
}

function collectFailures({ changedFiles, impactedQuestionIds, latestQuestionById }) {
  const explainTouched = EXPLAIN_ARTIFACT_FILES.some((file) => changedFiles.has(file));
  const failures = [];

  for (const questionId of [...impactedQuestionIds].sort()) {
    const reasons = [];
    const question = latestQuestionById.get(questionId);

    if (!question) {
      reasons.push(
        'Question changed, but the final question object could not be loaded from the current catalog state.',
      );
      failures.push({ questionId, reasons });
      continue;
    }

    const decisionGraphPaths = collectDecisionGraphPaths(question);
    if (decisionGraphPaths.length === 0) {
      reasons.push('No `decisionGraphAsset` is configured for this question.');
    } else {
      const decisionGraphTouched = decisionGraphPaths.some((assetPath) => changedFiles.has(assetPath));
      if (!decisionGraphTouched) {
        reasons.push(
          `Decision graph was not updated. Expected one of: ${decisionGraphPaths.join(', ')}`,
        );
      }
    }

    if (!explainTouched) {
      reasons.push(
        `Hint/explain-failure assets were not updated. Expected one of: ${EXPLAIN_ARTIFACT_FILES.join(', ')}`,
      );
    }

    if (reasons.length > 0) {
      failures.push({ questionId, reasons });
    }
  }

  return failures;
}

function reportFailures(failures) {
  if (failures.length === 0) return;
  console.error('[assist-sync] ERROR: Assist artifacts are stale for changed coding question code/tests:');
  for (const failure of failures) {
    console.error(`  - ${failure.questionId}`);
    for (const reason of failure.reasons) {
      console.error(`      * ${reason}`);
    }
  }
  process.exit(1);
}

function runCommitMode(changedFilesArg, commitsArg) {
  const changedFiles = new Set(readLines(changedFilesArg));
  const commits = unique(readLines(commitsArg)).filter((sha) => sha && sha !== ZERO_SHA);

  if (commits.length === 0) {
    console.log('[assist-sync] No pushed commits to inspect. Skipping assist sync check.');
    return;
  }

  const codingFilesInPush = [...changedFiles].filter((file) => CODING_JSON_RE.test(file));
  if (codingFilesInPush.length === 0) {
    console.log('[assist-sync] No coding question catalog changes detected. Skipping assist sync check.');
    return;
  }

  const impactedQuestionIds = new Set();

  for (const commit of commits) {
    const commitFiles = listChangedFilesForCommit(commit).filter((file) => CODING_JSON_RE.test(file));
    if (commitFiles.length === 0) continue;

    const parent = parentCommit(commit);
    for (const file of commitFiles) {
      const prevText = parent ? safeGitShow(`${parent}:${file}`) : null;
      const nextText = safeGitShow(`${commit}:${file}`);
      if (!nextText) continue;

      const prevQuestions = parseQuestions(prevText, `${parent ?? '<root>'}:${file}`);
      const nextQuestions = parseQuestions(nextText, `${commit}:${file}`);
      const prevById = toMapById(prevQuestions);
      const nextById = toMapById(nextQuestions);
      const unionIds = new Set([...prevById.keys(), ...nextById.keys()]);

      for (const id of unionIds) {
        if (hasCodeOrTestsChanged(prevById.get(id), nextById.get(id))) {
          impactedQuestionIds.add(id);
        }
      }
    }
  }

  if (impactedQuestionIds.size === 0) {
    console.log('[assist-sync] No code/tests key changes detected in coding question objects.');
    return;
  }

  const latestQuestionById = new Map();
  for (const file of codingFilesInPush) {
    const currentFile = resolveCurrentCatalogPath(file);
    if (!fs.existsSync(currentFile)) continue;
    const text = fs.readFileSync(currentFile, 'utf8');
    const questions = parseQuestions(text, currentFile);
    for (const question of questions) {
      const id = typeof question?.id === 'string' ? question.id.trim() : '';
      if (!id) continue;
      if (!impactedQuestionIds.has(id)) continue;
      latestQuestionById.set(id, question);
    }
  }

  const failures = collectFailures({ changedFiles, impactedQuestionIds, latestQuestionById });
  reportFailures(failures);

  console.log('[assist-sync] OK: Code/tests changes are paired with assist artifact updates.');
}

function runStagedMode(stagedFilesArg) {
  const changedFiles = new Set(readLines(stagedFilesArg));
  const assistRelevant = [...changedFiles].some(
    (file) => CODING_JSON_RE.test(file) || DECISION_GRAPH_RE.test(file) || EXPLAIN_ARTIFACT_FILES.includes(file),
  );

  if (!assistRelevant) {
    console.log('[assist-sync] No staged assist-related files detected. Skipping assist sync check.');
    return;
  }

  const stagedCodingFiles = [...changedFiles].filter((file) => CODING_JSON_RE.test(file));
  if (stagedCodingFiles.length === 0) {
    console.log('[assist-sync] No staged coding question catalog changes detected. Skipping assist sync check.');
    return;
  }

  const impactedQuestionIds = new Set();

  for (const file of stagedCodingFiles) {
    const prevText = safeGitShow(`HEAD:${file}`);
    const nextText = safeGitShow(`:${file}`);
    if (!nextText) continue;

    const prevQuestions = parseQuestions(prevText, `HEAD:${file}`);
    const nextQuestions = parseQuestions(nextText, `INDEX:${file}`);
    const prevById = toMapById(prevQuestions);
    const nextById = toMapById(nextQuestions);
    const unionIds = new Set([...prevById.keys(), ...nextById.keys()]);

    for (const id of unionIds) {
      if (hasCodeOrTestsChanged(prevById.get(id), nextById.get(id))) {
        impactedQuestionIds.add(id);
      }
    }
  }

  if (impactedQuestionIds.size === 0) {
    console.log('[assist-sync] No staged code/tests key changes detected in coding question objects.');
    return;
  }

  const latestQuestionById = new Map();
  for (const file of stagedCodingFiles) {
    const text = safeGitShow(`:${file}`);
    if (!text) continue;
    const questions = parseQuestions(text, `INDEX:${file}`);
    for (const question of questions) {
      const id = typeof question?.id === 'string' ? question.id.trim() : '';
      if (!id) continue;
      if (!impactedQuestionIds.has(id)) continue;
      latestQuestionById.set(id, question);
    }
  }

  const failures = collectFailures({ changedFiles, impactedQuestionIds, latestQuestionById });
  reportFailures(failures);

  console.log('[assist-sync] OK: Staged code/tests changes are paired with assist artifact updates.');
}

function main() {
  const changedFilesArg = readArg('--changed-files');
  const commitsArg = readArg('--commits-file');
  const stagedFilesArg = readArg('--staged-files');

  if (stagedFilesArg) {
    runStagedMode(stagedFilesArg);
    return;
  }

  if (!changedFilesArg || !commitsArg) {
    console.error(
      '[assist-sync] ERROR: Missing arguments. Usage: node scripts/validate-coding-assist-sync.mjs --changed-files <path> --commits-file <path> OR --staged-files <path>',
    );
    process.exit(1);
  }

  runCommitMode(changedFilesArg, commitsArg);
}

main();
