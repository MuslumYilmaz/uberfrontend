#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { buildTradeoffBattleAccessMap } from './tradeoff-battle-access-policy.mjs';
import {
  cdnTradeoffBattlesDir as ROOT,
  cdnTradeoffBattlesIndexPath as INDEX_PATH,
} from './content-paths.mjs';

function fail(message) {
  console.error(`[lint-tradeoff-battles] ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function assertString(value, message) {
  assert(typeof value === 'string' && value.trim().length > 0, message);
}

if (!fs.existsSync(INDEX_PATH)) {
  fail('missing tradeoff-battles/index.json');
} else {
  const index = readJson(INDEX_PATH);
  assert(Array.isArray(index), 'index.json must be an array');
  const expectedAccess = buildTradeoffBattleAccessMap(index);

  const seen = new Set();
  safeArray(index).forEach((item, indexPos) => {
    const label = `index[${indexPos}]`;
    assertString(item?.id, `${label}: id is required`);
    assertString(item?.title, `${label}: title is required`);
    assertString(item?.summary, `${label}: summary is required`);
    assert(Array.isArray(item?.tags) && item.tags.length > 0, `${label}: tags must be a non-empty array`);

    const id = String(item.id || '').trim();
    assert(!seen.has(id), `${label}: duplicate id "${id}"`);
    seen.add(id);
    assert(
      String(item?.access || 'premium') === (expectedAccess.get(id) || 'premium'),
      `${label}: access must match tradeoff access policy`,
    );

    const scenarioPath = path.join(ROOT, id, 'scenario.json');
    assert(fs.existsSync(scenarioPath), `${label}: missing scenario.json for "${id}"`);
    if (!fs.existsSync(scenarioPath)) return;

    const scenario = readJson(scenarioPath);
    assertString(scenario?.meta?.id, `${id}: meta.id is required`);
    assert(String(scenario?.meta?.id || '') === id, `${id}: meta.id must match index id`);
    assertString(scenario?.meta?.title, `${id}: meta.title is required`);
    assert(
      String(scenario?.meta?.access || 'premium') === (expectedAccess.get(id) || 'premium'),
      `${id}: meta.access must match tradeoff access policy`,
    );
    assertString(scenario?.scenario, `${id}: scenario is required`);
    assertString(scenario?.prompt, `${id}: prompt is required`);

    const options = safeArray(scenario?.options);
    assert(options.length >= 2, `${id}: at least 2 options are required`);
    options.forEach((option, optionIndex) => {
      const optionLabel = `${id}: options[${optionIndex}]`;
      assertString(option?.id, `${optionLabel}: id is required`);
      assertString(option?.label, `${optionLabel}: label is required`);
      assertString(option?.summary, `${optionLabel}: summary is required`);
      assert(Array.isArray(option?.whenItWins) && option.whenItWins.length > 0, `${optionLabel}: whenItWins must be a non-empty array`);
      assert(Array.isArray(option?.watchOutFor) && option.watchOutFor.length > 0, `${optionLabel}: watchOutFor must be a non-empty array`);
    });

    const dimensions = safeArray(scenario?.evaluationDimensions);
    assert(dimensions.length >= 3, `${id}: at least 3 evaluationDimensions are required`);
    dimensions.forEach((dimension, dimensionIndex) => {
      const dimensionLabel = `${id}: evaluationDimensions[${dimensionIndex}]`;
      assertString(dimension?.id, `${dimensionLabel}: id is required`);
      assertString(dimension?.title, `${dimensionLabel}: title is required`);
      assertString(dimension?.description, `${dimensionLabel}: description is required`);
    });

    const matrix = safeArray(scenario?.decisionMatrix);
    assert(matrix.length >= 2, `${id}: decisionMatrix must have at least 2 rows`);
    matrix.forEach((row, rowIndex) => {
      const rowLabel = `${id}: decisionMatrix[${rowIndex}]`;
      assertString(row?.id, `${rowLabel}: id is required`);
      assertString(row?.title, `${rowLabel}: title is required`);
      assertString(row?.prompt, `${rowLabel}: prompt is required`);
      const cells = safeArray(row?.cells);
      assert(cells.length === options.length, `${rowLabel}: cells must match options length`);
      cells.forEach((cell, cellIndex) => {
        const cellLabel = `${rowLabel}: cells[${cellIndex}]`;
        assertString(cell?.optionId, `${cellLabel}: optionId is required`);
        assertString(cell?.note, `${cellLabel}: note is required`);
        assert(['best-fit', 'reasonable', 'stretch'].includes(String(cell?.verdict || '')), `${cellLabel}: verdict must be best-fit, reasonable, or stretch`);
      });
    });

    assertString(scenario?.strongAnswer?.title, `${id}: strongAnswer.title is required`);
    assertString(scenario?.strongAnswer?.summary, `${id}: strongAnswer.summary is required`);
    assert(Array.isArray(scenario?.strongAnswer?.reasoning) && scenario.strongAnswer.reasoning.length > 0, `${id}: strongAnswer.reasoning must be a non-empty array`);
    const pushback = safeArray(scenario?.interviewerPushback);
    assert(pushback.length >= 2, `${id}: interviewerPushback must have at least 2 items`);
    pushback.forEach((item, itemIndex) => {
      const itemLabel = `${id}: interviewerPushback[${itemIndex}]`;
      assertString(item?.question, `${itemLabel}: question is required`);
      assertString(item?.answer, `${itemLabel}: answer is required`);
    });
    const examples = safeArray(scenario?.answerExamples);
    assert(examples.length >= 3, `${id}: answerExamples must have at least 3 items`);
    examples.forEach((item, itemIndex) => {
      const itemLabel = `${id}: answerExamples[${itemIndex}]`;
      assert(['weak', 'decent', 'strong'].includes(String(item?.level || '')), `${itemLabel}: level must be weak, decent, or strong`);
      assertString(item?.title, `${itemLabel}: title is required`);
      assertString(item?.answer, `${itemLabel}: answer is required`);
      assertString(item?.whyItWorks, `${itemLabel}: whyItWorks is required`);
    });
    assert(Array.isArray(scenario?.answerFramework) && scenario.answerFramework.length >= 3, `${id}: answerFramework must have at least 3 items`);
    assert(Array.isArray(scenario?.antiPatterns) && scenario.antiPatterns.length >= 2, `${id}: antiPatterns must have at least 2 items`);
  });
}

if (!process.exitCode) {
  console.log('[lint-tradeoff-battles] tradeoff battle assets look valid');
}
