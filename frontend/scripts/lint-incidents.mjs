#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src', 'assets', 'incidents');
const INDEX_PATH = path.join(ROOT, 'index.json');
const CDN_ROOT = path.resolve('../cdn', 'incidents');
const CDN_INDEX_PATH = path.join(CDN_ROOT, 'index.json');
const VALID_TECH = new Set(['javascript', 'react', 'angular', 'vue']);
const VALID_DIFFICULTY = new Set(['easy', 'intermediate', 'hard']);
const VALID_ACCESS = new Set(['free', 'premium']);
const VALID_STAGE_TYPES = new Set(['single-select', 'multi-select', 'priority-order']);
const VALID_RELATED_KINDS = new Set(['coding', 'trivia', 'debug', 'system-design']);

function fail(message) {
  console.error(`[lint-incidents] ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertMirrorMatches(sourcePath, mirrorPath, label) {
  assert(fs.existsSync(mirrorPath), `${label}: missing CDN mirror file ${path.relative(process.cwd(), mirrorPath)}`);
  if (!fs.existsSync(mirrorPath)) return;

  const source = fs.readFileSync(sourcePath, 'utf8');
  const mirror = fs.readFileSync(mirrorPath, 'utf8');
  assert(source === mirror, `${label}: CDN mirror is out of sync for ${path.basename(sourcePath)}`);
}

function validateMeta(meta, sourceLabel) {
  assert(meta && typeof meta === 'object', `${sourceLabel}: meta must be an object`);
  if (!meta || typeof meta !== 'object') return;

  assert(isNonEmptyString(meta.id), `${sourceLabel}: meta.id is required`);
  assert(isNonEmptyString(meta.title), `${sourceLabel}: meta.title is required`);
  assert(VALID_TECH.has(String(meta.tech)), `${sourceLabel}: meta.tech must be javascript, react, angular, or vue`);
  assert(VALID_DIFFICULTY.has(String(meta.difficulty)), `${sourceLabel}: invalid difficulty`);
  assert(isNonEmptyString(meta.summary), `${sourceLabel}: meta.summary is required`);
  assert(Array.isArray(meta.signals) && meta.signals.length > 0, `${sourceLabel}: meta.signals must be a non-empty array`);
  assert(typeof meta.estimatedMinutes === 'number', `${sourceLabel}: meta.estimatedMinutes must be numeric`);
  assert(Array.isArray(meta.tags), `${sourceLabel}: meta.tags must be an array`);
  assert(isNonEmptyString(meta.updatedAt), `${sourceLabel}: meta.updatedAt is required`);
  assert(VALID_ACCESS.has(String(meta.access)), `${sourceLabel}: invalid access level`);
}

function validateOption(option, sourceLabel) {
  assert(option && typeof option === 'object', `${sourceLabel}: option must be an object`);
  if (!option || typeof option !== 'object') return;
  assert(isNonEmptyString(option.id), `${sourceLabel}: option.id is required`);
  assert(isNonEmptyString(option.label), `${sourceLabel}: option.label is required`);
  assert(typeof option.points === 'number', `${sourceLabel}: option.points must be numeric`);
  assert(isNonEmptyString(option.feedback), `${sourceLabel}: option.feedback is required`);
}

function validateStage(stage, sourceLabel) {
  assert(stage && typeof stage === 'object', `${sourceLabel}: stage must be an object`);
  if (!stage || typeof stage !== 'object') return;

  assert(isNonEmptyString(stage.id), `${sourceLabel}: stage.id is required`);
  assert(isNonEmptyString(stage.title), `${sourceLabel}: stage.title is required`);
  assert(isNonEmptyString(stage.prompt), `${sourceLabel}: stage.prompt is required`);
  assert(VALID_STAGE_TYPES.has(String(stage.type)), `${sourceLabel}: invalid stage.type`);

  if (stage.type === 'single-select' || stage.type === 'multi-select') {
    assert(Array.isArray(stage.options) && stage.options.length > 0, `${sourceLabel}: options are required`);
    if (Array.isArray(stage.options)) {
      stage.options.forEach((option, index) => validateOption(option, `${sourceLabel}: option[${index}]`));
    }
  }

  if (stage.type === 'priority-order') {
    assert(Array.isArray(stage.candidates) && stage.candidates.length > 0, `${sourceLabel}: candidates are required`);
    assert(Array.isArray(stage.expectedOrder) && stage.expectedOrder.length > 0, `${sourceLabel}: expectedOrder is required`);
    assert(Array.isArray(stage.slotWeights) && stage.slotWeights.length > 0, `${sourceLabel}: slotWeights are required`);
    const candidateIds = new Set(
      Array.isArray(stage.candidates)
        ? stage.candidates
            .filter((candidate) => candidate && typeof candidate === 'object')
            .map((candidate) => String(candidate.id || ''))
        : [],
    );
    assert(
      Array.isArray(stage.expectedOrder)
      && Array.isArray(stage.slotWeights)
      && stage.expectedOrder.length === stage.slotWeights.length,
      `${sourceLabel}: expectedOrder and slotWeights must be the same length`,
    );
    if (Array.isArray(stage.expectedOrder)) {
      stage.expectedOrder.forEach((id, index) => {
        assert(candidateIds.has(String(id)), `${sourceLabel}: expectedOrder[${index}] is not in candidates`);
      });
    }
  }
}

function validateScenarioFile(indexItem) {
  const filePath = path.join(ROOT, indexItem.id, 'scenario.json');
  assert(fs.existsSync(filePath), `missing scenario file for ${indexItem.id}`);
  if (!fs.existsSync(filePath)) return;
  assertMirrorMatches(filePath, path.join(CDN_ROOT, indexItem.id, 'scenario.json'), indexItem.id);

  const scenario = readJson(filePath);
  validateMeta(scenario.meta, `${indexItem.id}: meta`);
  assert(scenario?.meta?.id === indexItem.id, `${indexItem.id}: scenario meta.id must match index id`);

  assert(scenario.context && typeof scenario.context === 'object', `${indexItem.id}: context is required`);
  assert(Array.isArray(scenario.context?.evidence), `${indexItem.id}: context.evidence must be an array`);

  assert(Array.isArray(scenario.stages) && scenario.stages.length > 0, `${indexItem.id}: stages are required`);
  if (Array.isArray(scenario.stages)) {
    const stageIds = new Set();
    scenario.stages.forEach((stage, index) => {
      validateStage(stage, `${indexItem.id}: stages[${index}]`);
      const stageId = String(stage?.id || '');
      assert(!stageIds.has(stageId), `${indexItem.id}: duplicate stage id "${stageId}"`);
      stageIds.add(stageId);
    });
  }

  assert(scenario.debrief && typeof scenario.debrief === 'object', `${indexItem.id}: debrief is required`);
  assert(Array.isArray(scenario.debrief?.scoreBands), `${indexItem.id}: debrief.scoreBands must be an array`);
  assert(Array.isArray(scenario.debrief?.idealRunbook), `${indexItem.id}: debrief.idealRunbook must be an array`);
  assert(Array.isArray(scenario.debrief?.teachingBlocks), `${indexItem.id}: debrief.teachingBlocks must be an array`);

  assert(Array.isArray(scenario.relatedPractice), `${indexItem.id}: relatedPractice must be an array`);
  if (Array.isArray(scenario.relatedPractice)) {
    scenario.relatedPractice.forEach((item, index) => {
      assert(item && typeof item === 'object', `${indexItem.id}: relatedPractice[${index}] must be an object`);
      assert(isNonEmptyString(item?.id), `${indexItem.id}: relatedPractice[${index}].id is required`);
      assert(VALID_RELATED_KINDS.has(String(item?.kind)), `${indexItem.id}: invalid relatedPractice kind`);
    });
  }
}

if (!fs.existsSync(INDEX_PATH)) {
  fail('index.json not found');
} else {
  assertMirrorMatches(INDEX_PATH, CDN_INDEX_PATH, 'index');
  const index = readJson(INDEX_PATH);
  assert(Array.isArray(index), 'index.json must be an array');

  if (Array.isArray(index)) {
    const ids = new Set();
    index.forEach((item, indexPosition) => {
      validateMeta(item, `index[${indexPosition}]`);
      const id = String(item?.id || '');
      assert(!ids.has(id), `duplicate incident id "${id}" in index.json`);
      ids.add(id);
      validateScenarioFile(item);
    });
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('[lint-incidents] incident assets look valid');
