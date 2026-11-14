#!/usr/bin/env node
/**
 * Generates cdn/questions/company-question-lists.json: for every company whose process lists reported questions, the
 * counts a guide shows (per stage, round not stated, newest account) and each row's id, round, kind, frequency, the
 * last day it shows as new, its practice task and whether the one free unlock can open it. The question text stays out:
 * the backend checks an unlock against this file and needs only ids. Run with --check in the lint chain to fail on drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REGISTRY_AUTHORED_COMPANIES } from './authored-companies.mjs';
import { loadTsModule } from './load-ts-module.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const previewsRoot = path.resolve(here, '..', 'src', 'app', 'shared', 'company-previews');
const inlineRoot = path.resolve(here, '..', 'src', 'app', 'features', 'company', 'company-preview');
/** The guides the preview renders from its own branch, with the export that holds their prompts. */
const INLINE_PROMPTS = { google: 'GOOGLE_PRACTICE_PROMPTS', netflix: 'NETFLIX_PRACTICE_PROMPTS', openai: 'OPENAI_PRACTICE_PROMPTS' };
export const COMPANY_QUESTION_LISTS_RELATIVE_PATH = path.join('questions', 'company-question-lists.json');
const TECHS = ['javascript', 'react', 'angular', 'vue', 'css', 'html'];

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Every catalog route with its access; a missing access field is free, as the app treats it. */
export function readCatalogAccess(cdnRoot) {
  const access = new Map();
  for (const tech of TECHS) {
    for (const kind of ['coding', 'debug', 'trivia']) {
      const list = readJsonIfExists(path.join(cdnRoot, 'questions', tech, `${kind}.json`));
      for (const entry of Array.isArray(list) ? list : []) {
        if (entry && typeof entry.id === 'string') access.set(`/${tech}/${kind}/${entry.id}`, entry.access === 'premium' ? 'premium' : 'free');
      }
    }
  }
  const index = readJsonIfExists(path.join(cdnRoot, 'questions', 'system-design', 'index.json'));
  for (const entry of Array.isArray(index) ? index : []) {
    if (!entry || typeof entry.id !== 'string') continue;
    const meta = readJsonIfExists(path.join(cdnRoot, 'questions', 'system-design', entry.id, 'meta.json')) ?? {};
    access.set(`/system-design/${entry.id}`, (meta.access ?? entry.access) === 'premium' ? 'premium' : 'free');
  }
  return access;
}

/** The practice prompt ids of each authored guide, from its content module, and of the inline guides from theirs. */
export function readAnswerGuides(slugs = REGISTRY_AUTHORED_COMPANIES, inline = INLINE_PROMPTS) {
  const guides = new Map();
  for (const slug of slugs) {
    const content = loadTsModule(path.join(previewsRoot, `${slug}-preview-content.ts`));
    const preview = Object.values(content).find((value) => value && typeof value === 'object' && value.slug === slug && value.prompts);
    if (!preview) throw new Error(`[gen-company-question-lists] ${slug}-preview-content.ts exports no preview for ${slug}.`);
    guides.set(slug, new Set(preview.prompts.items.map((prompt) => prompt.id)));
  }
  for (const [slug, name] of Object.entries(inline)) {
    const prompts = loadTsModule(path.join(inlineRoot, `${slug}-preview-content.ts`))[name];
    if (!Array.isArray(prompts)) throw new Error(`[gen-company-question-lists] ${slug}-preview-content.ts exports no ${name}.`);
    guides.set(slug, new Set(prompts.map((prompt) => prompt.id)));
  }
  return guides;
}

export function buildCompanyQuestionLists({ processes, questionList, catalogAccess, answerGuides }) {
  const problems = [];
  const companies = {};
  for (const slug of Object.keys(processes).sort()) {
    const process = processes[slug];
    if (!process.questions?.length) continue;
    for (const problem of questionList.questionListProblems(process)) problems.push(`${slug}: ${problem}`);
    const summary = questionList.summariseQuestionList(process);
    const questions = process.questions.map((question, index) => {
      const row = summary.rows[index];
      if (question.practice && !catalogAccess.has(question.practice.path)) {
        problems.push(`${slug}: question ${question.id}: no catalog task at ${question.practice.path}`);
      }
      if (question.answerGuide && !answerGuides.get(slug)?.has(question.answerGuide)) {
        problems.push(`${slug}: question ${question.id}: the guide has no practice prompt "${question.answerGuide}"`);
      }
      return {
        ...row,
        practice: question.practice ? { route: question.practice.path, access: catalogAccess.get(question.practice.path) ?? 'free' } : null,
        answerGuide: question.answerGuide ?? null,
      };
    });
    companies[slug] = {
      total: summary.total,
      rounds: summary.rounds,
      roundNotStated: summary.roundNotStated,
      newestAccount: summary.newestAccount,
      questions,
    };
  }
  if (problems.length) throw new Error(`[gen-company-question-lists] ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  return { schemaVersion: 1, companies };
}

export function renderCompanyQuestionLists(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function buildFromRepo(cdnRoot = path.join(repoRoot, 'cdn')) {
  const { COMPANY_INTERVIEW_PROCESSES } = loadTsModule(path.join(previewsRoot, 'company-interview-processes.ts'));
  return buildCompanyQuestionLists({
    processes: COMPANY_INTERVIEW_PROCESSES,
    questionList: loadTsModule(path.join(previewsRoot, 'company-question-list.ts')),
    catalogAccess: readCatalogAccess(cdnRoot),
    answerGuides: readAnswerGuides(),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const outputPath = path.join(repoRoot, 'cdn', COMPANY_QUESTION_LISTS_RELATIVE_PATH);
  const next = renderCompanyQuestionLists(buildFromRepo());
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (check) {
    if (current !== next) {
      console.error(`[gen-company-question-lists] ${path.relative(repoRoot, outputPath)} is stale; run \`node scripts/gen-company-question-lists.mjs\`.`);
      process.exit(1);
    }
    console.log('[gen-company-question-lists] company-question-lists.json is current.');
  } else {
    fs.writeFileSync(outputPath, next);
    const companies = Object.values(JSON.parse(next).companies);
    const total = companies.reduce((sum, company) => sum + company.total, 0);
    console.log(`[gen-company-question-lists] wrote ${path.relative(repoRoot, outputPath)} (${companies.length} companies, ${total} reported questions).`);
  }
}
