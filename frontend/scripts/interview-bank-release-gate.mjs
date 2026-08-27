#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalJson,
  interviewBankDefaults,
  loadAuthoringItems,
  projectPrivateSelectionItem,
  readJson,
  selectionMetadataHash,
} from "./interview-bank-lib.mjs";

export const INTERVIEW_LEVELS = Object.freeze(["junior", "mid", "senior"]);
export const INTERVIEW_TRACKS = Object.freeze(["core-web", "react", "angular", "vue"]);

function positiveEntries(counts) {
  return Object.entries(counts).filter(([, count]) => count > 0);
}

function countBy(values, key) {
  const counts = Object.create(null);
  for (const value of values) counts[value[key]] = (counts[value[key]] || 0) + 1;
  return counts;
}

function exactPositiveCounts(values, key, expected) {
  const actual = countBy(values, key);
  const positive = Object.fromEntries(positiveEntries(expected));
  return Object.keys(actual).every((value) => Object.hasOwn(positive, value))
    && Object.entries(positive).every(([value, count]) => (actual[value] || 0) === count);
}

function combinations(values, count, start = 0, prefix = [], output = []) {
  if (prefix.length === count) {
    output.push(prefix);
    return output;
  }
  const needed = count - prefix.length;
  for (let index = start; index <= values.length - needed; index += 1) {
    combinations(values, count, index + 1, [...prefix, values[index]], output);
  }
  return output;
}

function cartesianProduct(groups, index = 0, prefix = [], output = []) {
  if (index === groups.length) {
    output.push(prefix);
    return output;
  }
  for (const group of groups[index]) {
    cartesianProduct(groups, index + 1, [...prefix, ...group], output);
  }
  return output;
}

function formKey(items) {
  return items.map((item) => item.id).sort().join("|");
}

export function enumerateInterviewMcqForms({ items, blueprint, track, level }) {
  const releasePolicy = blueprint.releaseReadiness;
  const technologyCounts = releasePolicy.formProfiles.technologyCountsByTrack[track];
  const bandCounts = releasePolicy.formProfiles
    .difficultyBandCountsByLevelAndTrack[level]?.[track];
  if (!technologyCounts || !bandCounts) {
    throw new Error(`Unsupported MCQ release-gate profile ${track}/${level}.`);
  }
  const selectionItems = items.map(projectPrivateSelectionItem);
  const eligible = selectionItems.filter((item) => (
    item.level === level && (technologyCounts[item.technology] || 0) > 0
  ));
  const groups = positiveEntries(technologyCounts).map(([technology, count]) => combinations(
    eligible.filter((item) => item.technology === technology),
    count,
  ));
  if (groups.some((group) => group.length === 0)) return [];

  const minimumProduction = releasePolicy.formProfiles.minimumProductionScenarioCount;
  const maximumCodeOutput = releasePolicy.formProfiles.maximumCodeOutputCount;
  return cartesianProduct(groups)
    .filter((form) => exactPositiveCounts(form, "difficultyBand", bandCounts))
    .filter((form) => (
      form.filter((item) => item.format === "production-scenario").length >= minimumProduction
      && form.filter((item) => item.format === "code-output").length <= maximumCodeOutput
    ))
    .filter((form) => new Set(form.map((item) => item.conceptId)).size === form.length)
    .map((form) => ({
      key: formKey(form),
      itemIds: form.map((item) => item.id).sort(),
      conceptIds: form.map((item) => item.conceptId).sort(),
      totalEstimatedSeconds: form.reduce((sum, item) => sum + item.estimatedSeconds, 0),
    }))
    .sort((left, right) => (
      left.totalEstimatedSeconds - right.totalEstimatedSeconds
      || left.key.localeCompare(right.key)
    ));
}

function maskFor(values, indexes) {
  return values.reduce((mask, value) => mask | (1n << BigInt(indexes.get(value))), 0n);
}

export function findExactDisjointFormPack(forms, count) {
  if (count === 0) return [];
  if (forms.length < count) return null;
  const idIndexes = new Map();
  const conceptIndexes = new Map();
  for (const form of forms) {
    for (const id of form.itemIds) {
      if (!idIndexes.has(id)) idIndexes.set(id, idIndexes.size);
    }
    for (const conceptId of form.conceptIds) {
      if (!conceptIndexes.has(conceptId)) conceptIndexes.set(conceptId, conceptIndexes.size);
    }
  }
  const candidates = forms.map((form) => ({
    ...form,
    idMask: maskFor(form.itemIds, idIndexes),
    conceptMask: maskFor(form.conceptIds, conceptIndexes),
  }));
  const memo = new Set();
  function search(start, remaining, usedIds, usedConcepts) {
    if (remaining === 0) return [];
    if (candidates.length - start < remaining) return null;
    const memoKey = `${start}/${remaining}/${usedIds.toString(16)}/${usedConcepts.toString(16)}`;
    if (memo.has(memoKey)) return null;
    for (let index = start; index <= candidates.length - remaining; index += 1) {
      const candidate = candidates[index];
      if ((candidate.idMask & usedIds) !== 0n
        || (candidate.conceptMask & usedConcepts) !== 0n) continue;
      const tail = search(
        index + 1,
        remaining - 1,
        usedIds | candidate.idMask,
        usedConcepts | candidate.conceptMask,
      );
      if (tail) return [candidate, ...tail];
    }
    memo.add(memoKey);
    return null;
  }
  const pack = search(0, count, 0n, 0n);
  return pack?.map(({ idMask: _idMask, conceptMask: _conceptMask, ...form }) => form) || null;
}

function deficitsFor(values, key, expectedPerForm, attempts, distinctSelector = null) {
  return Object.fromEntries(Object.entries(expectedPerForm).map(([value, perForm]) => {
    if (!perForm) return [value, 0];
    const matching = values.filter((item) => item[key] === value);
    const available = distinctSelector
      ? new Set(matching.map(distinctSelector)).size
      : matching.length;
    return [value, Math.max(0, attempts * perForm - available)];
  }));
}

function sum(values) {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

export function capacityDeficitsForCombination({ items, blueprint, track, level }) {
  const policy = blueprint.releaseReadiness;
  const attempts = policy.attemptsWithoutLiteralOrSemanticRepeat;
  const technologyCounts = policy.formProfiles.technologyCountsByTrack[track];
  const bandCounts = policy.formProfiles.difficultyBandCountsByLevelAndTrack[level][track];
  const pool = items.map(projectPrivateSelectionItem).filter((item) => (
    item.level === level && (technologyCounts[item.technology] || 0) > 0
  ));
  const technologyDeficits = deficitsFor(pool, "technology", technologyCounts, attempts);
  const semanticTechnologyDeficits = deficitsFor(
    pool,
    "technology",
    technologyCounts,
    attempts,
    (item) => item.conceptId,
  );
  const difficultyBandDeficits = deficitsFor(pool, "difficultyBand", bandCounts, attempts);
  const semanticBandDeficits = deficitsFor(
    pool,
    "difficultyBand",
    bandCounts,
    attempts,
    (item) => item.conceptId,
  );
  const requiredItems = attempts * blueprint.selectionPolicy.sessionQuestionCount;
  const literalItemDeficit = Math.max(0, requiredItems - pool.length);
  const semanticConceptDeficit = Math.max(
    0,
    requiredItems - new Set(pool.map((item) => item.conceptId)).size,
  );
  const productionScenarioDeficit = Math.max(
    0,
    attempts * policy.formProfiles.minimumProductionScenarioCount
      - pool.filter((item) => item.format === "production-scenario").length,
  );
  const minimumNetNewItems = Math.max(
    literalItemDeficit,
    semanticConceptDeficit,
    sum(technologyDeficits),
    sum(semanticTechnologyDeficits),
    sum(difficultyBandDeficits),
    sum(semanticBandDeficits),
    productionScenarioDeficit,
  );
  return {
    poolSize: pool.length,
    distinctConceptCount: new Set(pool.map((item) => item.conceptId)).size,
    literalItemDeficit,
    semanticConceptDeficit,
    technologyDeficits,
    semanticTechnologyDeficits,
    difficultyBandDeficits,
    semanticBandDeficits,
    productionScenarioDeficit,
    minimumNetNewItems,
  };
}

export function candidateCapacityPlanFor(items, blueprint) {
  const byLevel = Object.fromEntries(INTERVIEW_LEVELS.map((level) => {
    const deficits = capacityDeficitsForCombination({
      items,
      blueprint,
      track: "core-web",
      level,
    });
    return [level, {
      minimumNetNewItems: deficits.minimumNetNewItems,
      minimumByTechnology: deficits.technologyDeficits,
      minimumByDifficultyBand: deficits.difficultyBandDeficits,
    }];
  }));
  const minimumNetNewItems = Object.values(byLevel)
    .reduce((total, entry) => total + entry.minimumNetNewItems, 0);
  return {
    scope: "literal-and-semantic-repeat-capacity-only",
    baselineQuestionCount: items.length,
    minimumTargetQuestionCount: items.length + minimumNetNewItems,
    minimumNetNewItems,
    byLevel,
  };
}

export function validateMcqConceptMetadata(items) {
  const errors = [];
  const pattern = /^mcq-[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const byConcept = new Map();
  for (const item of items) {
    if (!pattern.test(String(item.conceptId || ""))) {
      errors.push(`${item.id}: missing or invalid private conceptId.`);
      continue;
    }
    const group = byConcept.get(item.conceptId) || [];
    group.push(item);
    byConcept.set(item.conceptId, group);
  }
  for (const [conceptId, group] of byConcept) {
    if (new Set(group.map((item) => item.public.level)).size > 1) {
      errors.push(`${conceptId}: conceptId collision spans multiple levels.`);
    }
  }
  return errors;
}

export function analyzeInterviewBankReleaseReadiness({ items, blueprint }) {
  const errors = validateMcqConceptMetadata(items);
  const attempts = blueprint.releaseReadiness.attemptsWithoutLiteralOrSemanticRepeat;
  const matrix = [];
  for (const track of INTERVIEW_TRACKS) {
    for (const level of INTERVIEW_LEVELS) {
      const budgetSeconds = blueprint.releaseReadiness.sessionBudgetSecondsByLevel[level];
      const eligibleForms = enumerateInterviewMcqForms({ items, blueprint, track, level });
      const selectableForms = eligibleForms.filter(
        (form) => form.totalEstimatedSeconds <= budgetSeconds,
      );
      const overBudgetForms = eligibleForms.filter(
        (form) => form.totalEstimatedSeconds > budgetSeconds,
      );
      const deficits = capacityDeficitsForCombination({ items, blueprint, track, level });
      const pack = deficits.minimumNetNewItems > 0
        ? null
        : findExactDisjointFormPack(selectableForms, attempts);
      const entry = {
        track,
        level,
        budgetSeconds,
        eligibleFormCount: eligibleForms.length,
        selectableFormCount: selectableForms.length,
        overBudgetFormCount: overBudgetForms.length,
        minimumFormSeconds: eligibleForms[0]?.totalEstimatedSeconds ?? null,
        maximumFormSeconds: eligibleForms.reduce(
          (maximum, form) => Math.max(maximum, form.totalEstimatedSeconds),
          0,
        ) || null,
        deficits,
        firstFivePack: pack?.map((form) => ({
          itemIds: form.itemIds,
          conceptIds: form.conceptIds,
          totalEstimatedSeconds: form.totalEstimatedSeconds,
        })) || null,
      };
      entry.ready = entry.overBudgetFormCount === 0 && entry.firstFivePack !== null;
      matrix.push(entry);
      if (entry.overBudgetFormCount > 0) {
        errors.push(
          `${track}/${level}: ${entry.overBudgetFormCount} eligible forms exceed the `
          + `${budgetSeconds}s session budget; over-budget forms must not remain selectable.`,
        );
      }
      if (!entry.firstFivePack) {
        errors.push(
          `${track}/${level}: no exact pack of ${attempts} pairwise literal- and `
          + `concept-disjoint selectable forms exists (minimum net-new capacity `
          + `${deficits.minimumNetNewItems}).`,
        );
      }
    }
  }

  const expectedPlan = blueprint.releaseReadiness.candidateCapacityPlan;
  if (items.length === expectedPlan.baselineQuestionCount) {
    const actualPlan = candidateCapacityPlanFor(items, blueprint);
    if (canonicalJson(actualPlan) !== canonicalJson(expectedPlan)) {
      errors.push(
        `blueprint.releaseReadiness.candidateCapacityPlan is stale; expected `
        + `${canonicalJson(actualPlan)}.`,
      );
    }
  }
  return {
    ready: errors.length === 0,
    errors,
    matrix,
    selectionMetadataHash: selectionMetadataHash(items),
  };
}

export function formatInterviewBankReleaseMatrix(matrix) {
  const header = [
    "track/level",
    "eligible",
    "selectable",
    "overBudget",
    "min/maxSeconds",
    "netNewCapacity",
    "fivePack",
  ].join("\t");
  const rows = matrix.map((entry) => [
    `${entry.track}/${entry.level}`,
    entry.eligibleFormCount,
    entry.selectableFormCount,
    entry.overBudgetFormCount,
    `${entry.minimumFormSeconds ?? "-"}/${entry.maximumFormSeconds ?? "-"}`,
    entry.deficits.minimumNetNewItems,
    entry.firstFivePack ? "yes" : "no",
  ].join("\t"));
  return [header, ...rows].join("\n");
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const argument of args) {
    if (argument !== "--json") throw new Error(`Unknown argument: ${argument}`);
  }
  const items = loadAuthoringItems(interviewBankDefaults.itemsDir).map(({ item }) => item);
  const blueprint = readJson(interviewBankDefaults.blueprintPath);
  const result = analyzeInterviewBankReleaseReadiness({ items, blueprint });
  if (args.has("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(formatInterviewBankReleaseMatrix(result.matrix));
    result.errors.forEach((error) => console.error(`- ${error}`));
  }
  if (!result.ready) process.exitCode = 1;
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[interview-bank-release-gate] ERROR: ${error.message}`);
    process.exit(1);
  });
}
