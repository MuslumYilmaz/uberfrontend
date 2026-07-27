#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { repoRoot } from "./content-paths.mjs";

const REFERENCE_DIR = path.join(repoRoot, "content-drafts", "interview-mcq");
const DEFAULT_PUBLIC_PATH = path.join(REFERENCE_DIR, "reference-set-v1.public.json");
const DEFAULT_PRIVATE_PATH = path.join(REFERENCE_DIR, "reference-set-v1.private.json");
const PUBLIC_SCHEMA_PATH = path.join(REFERENCE_DIR, "reference-set-v1.public.schema.json");
const PRIVATE_SCHEMA_PATH = path.join(REFERENCE_DIR, "reference-set-v1.private.schema.json");

const EXPECTED_SET_ID = "frontend-interview-reference-v1";
const EXPECTED_SCHEMA_VERSION = "1.0.0";
const EXPECTED_TOTAL_SECONDS = 600;
const LENGTH_CLUE_THRESHOLD = 0.25;
const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const POSITIONAL_OPTION_ID_REGEX = /^(?:option-?)?(?:a|b|c|1|2|3|first|second|third|correct|incorrect)$/;
const BANNED_COMPOSITE_OPTION_REGEX = /\b(?:all|none)\s+of\s+(?:the\s+)?(?:above|these)\b/i;
const UNNECESSARY_ABSOLUTE_REGEX = /\b(?:always|never)\b/i;
const OPEN_LICENSE_REGEX = /\b(?:MIT|CC\s+BY(?:-SA)?(?:\s+\d(?:\.\d)?)?|Apache(?:\s+License)?|BSD)\b/i;
const PROHIBITED_PUBLIC_KEYS = new Set([
  "answer",
  "answerkey",
  "approvedat",
  "approvedby",
  "correct",
  "correctanswer",
  "correctoptionid",
  "expectedoutput",
  "explanation",
  "lengthcluewaiver",
  "misconceptiontag",
  "optionrationales",
  "provenance",
  "rationale",
  "rationales",
  "remediationtopics",
  "review",
  "sources",
  "summaryexplanation",
  "verification",
  "verdict",
]);

const EXPECTED_ITEMS = new Map([
  [
    "int-html-native-button-jr-v1",
    {
      technology: "html",
      level: "junior",
      format: "conceptual",
      estimatedSeconds: 60,
      verificationDomain: "developer.mozilla.org",
    },
  ],
  [
    "int-js-nested-microtask-mid-v1",
    {
      technology: "javascript",
      level: "mid",
      format: "code-output",
      estimatedSeconds: 120,
      verificationDomain: "developer.mozilla.org",
    },
  ],
  [
    "int-vue-computed-watch-mid-v1",
    {
      technology: "vue",
      level: "mid",
      format: "conceptual",
      estimatedSeconds: 90,
      verificationDomain: "vuejs.org",
    },
  ],
  [
    "int-react-stale-search-sr-v1",
    {
      technology: "react",
      level: "senior",
      format: "production-scenario",
      estimatedSeconds: 180,
      verificationDomain: "react.dev",
    },
  ],
  [
    "int-angular-onpush-reference-sr-v1",
    {
      technology: "angular",
      level: "senior",
      format: "production-scenario",
      estimatedSeconds: 150,
      verificationDomain: "angular.dev",
    },
  ],
]);

const SANDBOX_RUNNER = String.raw`
  const vm = require("node:vm");
  const source = Buffer.from(process.argv[1], "base64").toString("utf8");
  const activeTimers = new Set();
  const sandbox = Object.create(null);

  sandbox.console = Object.freeze({
    log: (...values) => process.stdout.write(values.map(String).join(" ") + "\n"),
  });
  sandbox.queueMicrotask = queueMicrotask;
  sandbox.setTimeout = (callback, delay = 0, ...args) => {
    if (typeof callback !== "function") throw new TypeError("setTimeout callback must be a function");
    if (!Number.isFinite(Number(delay)) || Number(delay) < 0 || Number(delay) > 50) {
      throw new RangeError("Interview verification timers must be between 0 and 50ms");
    }
    const handle = setTimeout(() => {
      activeTimers.delete(handle);
      callback(...args);
    }, Number(delay));
    activeTimers.add(handle);
    return handle;
  };
  sandbox.clearTimeout = (handle) => {
    activeTimers.delete(handle);
    clearTimeout(handle);
  };

  const context = vm.createContext(sandbox, {
    codeGeneration: { strings: false, wasm: false },
  });
  new vm.Script(source, { filename: "interview-code-output.js" })
    .runInContext(context, { timeout: 250 });

  setTimeout(() => {
    for (const handle of activeTimers) clearTimeout(handle);
  }, 100);
`;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function createSchemaValidators() {
  const ajv = new Ajv2020({
    allErrors: true,
    allowUnionTypes: true,
    strict: true,
    strictRequired: false,
  });
  ajv.addFormat("date", isValidDate);
  ajv.addFormat("uri", isValidHttpsUrl);

  return {
    validatePublic: ajv.compile(readJson(PUBLIC_SCHEMA_PATH)),
    validatePrivate: ajv.compile(readJson(PRIVATE_SCHEMA_PATH)),
  };
}

function formatSchemaErrors(label, validationErrors = []) {
  return validationErrors.map((issue) => {
    const location = issue.instancePath || "/";
    const detail = issue.params?.additionalProperty
      ? ` (${issue.params.additionalProperty})`
      : "";
    return `${label}${location}: ${issue.message}${detail}`;
  });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function optionVisibleLength(value) {
  return normalizeText(value).replace(/\s/g, "").length;
}

function findProhibitedPublicKeys(value, currentPath = "public", findings = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findProhibitedPublicKeys(entry, `${currentPath}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== "object") return findings;

  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_PUBLIC_KEYS.has(key.toLowerCase())) {
      findings.push(`${currentPath}.${key}`);
    }
    findProhibitedPublicKeys(child, `${currentPath}.${key}`, findings);
  }
  return findings;
}

function permutations(values) {
  if (values.length <= 1) return [values.slice()];
  return values.flatMap((value, index) => {
    const remainder = values.filter((_, candidateIndex) => candidateIndex !== index);
    return permutations(remainder).map((tail) => [value, ...tail]);
  });
}

export function evaluateAnswerById(options, correctOptionId, selectedOptionId) {
  const selectedExists = options.some((option) => option.id === selectedOptionId);
  const correctExists = options.some((option) => option.id === correctOptionId);
  return selectedExists && correctExists && selectedOptionId === correctOptionId;
}

function validateOptionPermutations(item, privateItem, errors) {
  const allPermutations = permutations(item.options);
  if (allPermutations.length !== 6) {
    errors.push(`${item.id}: expected exactly 6 permutations for three options.`);
    return;
  }

  for (const ordering of allPermutations) {
    const correctMatches = ordering.filter((option) =>
      evaluateAnswerById(ordering, privateItem.correctOptionId, option.id));
    if (correctMatches.length !== 1 || correctMatches[0].id !== privateItem.correctOptionId) {
      errors.push(`${item.id}: option-ID answer resolution changed under permutation.`);
      return;
    }

    const incorrectlyAccepted = ordering
      .filter((option) => option.id !== privateItem.correctOptionId)
      .some((option) => evaluateAnswerById(ordering, privateItem.correctOptionId, option.id));
    if (incorrectlyAccepted) {
      errors.push(`${item.id}: an incorrect option was accepted under permutation.`);
      return;
    }
  }
}

function validateOptionText(item, privateItem, errors, warnings) {
  const normalizedLabels = item.options.map((option) => normalizeText(option.label));
  const optionIds = item.options.map((option) => option.id);

  if (new Set(optionIds).size !== item.options.length) {
    errors.push(`${item.id}: option IDs must be unique.`);
  }
  if (new Set(normalizedLabels).size !== item.options.length) {
    errors.push(`${item.id}: option labels must be unique after normalization.`);
  }

  item.options.forEach((option) => {
    if (!KEBAB_CASE_REGEX.test(option.id)) {
      errors.push(`${item.id}/${option.id}: option ID must be kebab-case.`);
    }
    if (POSITIONAL_OPTION_ID_REGEX.test(option.id)) {
      errors.push(`${item.id}/${option.id}: option ID must describe the answer, not its position or correctness.`);
    }
    if (BANNED_COMPOSITE_OPTION_REGEX.test(option.label)) {
      errors.push(`${item.id}/${option.id}: "all/none of the above" options are not allowed.`);
    }
    if (UNNECESSARY_ABSOLUTE_REGEX.test(option.label)) {
      errors.push(`${item.id}/${option.id}: avoid the answer-clue words "always" and "never".`);
    }
  });

  for (let left = 0; left < normalizedLabels.length; left += 1) {
    for (let right = left + 1; right < normalizedLabels.length; right += 1) {
      const shorter = normalizedLabels[left].length <= normalizedLabels[right].length
        ? normalizedLabels[left]
        : normalizedLabels[right];
      const longer = normalizedLabels[left].length > normalizedLabels[right].length
        ? normalizedLabels[left]
        : normalizedLabels[right];
      if (shorter.length >= 20 && longer.includes(shorter)) {
        errors.push(
          `${item.id}: options ${optionIds[left]} and ${optionIds[right]} overlap by full-text containment.`,
        );
      }
    }
  }

  const correctOption = item.options.find((option) => option.id === privateItem.correctOptionId);
  if (!correctOption) return;
  const distractors = item.options.filter((option) => option.id !== privateItem.correctOptionId);
  const correctLength = optionVisibleLength(correctOption.label);
  const distractorAverage = distractors.reduce(
    (sum, option) => sum + optionVisibleLength(option.label),
    0,
  ) / distractors.length;
  if (!distractorAverage) return;

  const difference = Math.abs(correctLength - distractorAverage) / distractorAverage;
  if (difference > LENGTH_CLUE_THRESHOLD) {
    const percentage = Math.round(difference * 100);
    warnings.push(
      `${item.id}: correct-option length differs from the distractor average by ${percentage}% (limit 25%).`,
    );
    if (!privateItem.review.lengthClueWaiver) {
      errors.push(`${item.id}: the >25% answer-length clue requires review.lengthClueWaiver.`);
    }
  } else if (privateItem.review.lengthClueWaiver) {
    errors.push(`${item.id}: remove the stale lengthClueWaiver; the current difference is within 25%.`);
  }
}

function validateRationales(item, privateItem, errors) {
  const optionIds = new Set(item.options.map((option) => option.id));
  const rationaleIds = privateItem.optionRationales.map((rationale) => rationale.optionId);
  const rationaleIdSet = new Set(rationaleIds);

  if (rationaleIdSet.size !== rationaleIds.length) {
    errors.push(`${item.id}: option rationale IDs must be unique.`);
  }
  for (const optionId of optionIds) {
    if (!rationaleIdSet.has(optionId)) {
      errors.push(`${item.id}: missing rationale for option ${optionId}.`);
    }
  }
  for (const rationaleId of rationaleIdSet) {
    if (!optionIds.has(rationaleId)) {
      errors.push(`${item.id}: rationale references unknown option ${rationaleId}.`);
    }
  }

  const correctRationales = privateItem.optionRationales.filter(
    (rationale) => rationale.verdict === "correct",
  );
  if (correctRationales.length !== 1) {
    errors.push(`${item.id}: exactly one rationale must have verdict "correct".`);
  } else if (correctRationales[0].optionId !== privateItem.correctOptionId) {
    errors.push(`${item.id}: correct rationale and correctOptionId do not match.`);
  }

  const misconceptionTags = privateItem.optionRationales
    .filter((rationale) => rationale.verdict === "incorrect")
    .map((rationale) => rationale.misconceptionTag);
  if (new Set(misconceptionTags).size !== misconceptionTags.length) {
    errors.push(`${item.id}: each distractor must represent a distinct misconception tag.`);
  }
}

function urlHostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function validateProvenance(item, privateItem, expected, errors) {
  const provenance = privateItem.provenance;
  if (provenance.wordingOrigin !== "original") {
    errors.push(`${item.id}: provenance.wordingOrigin must be "original".`);
  }
  if (provenance.copiedText !== false) {
    errors.push(`${item.id}: provenance.copiedText must remain false.`);
  }

  const technicalSources = provenance.sources.filter(
    (source) => source.role === "technical-verification",
  );
  if (!technicalSources.length) {
    errors.push(`${item.id}: at least one technical-verification source is required.`);
  }
  if (!technicalSources.some((source) => urlHostname(source.url) === expected.verificationDomain)) {
    errors.push(`${item.id}: an official ${expected.verificationDomain} verification source is required.`);
  }

  provenance.sources.forEach((source, index) => {
    const label = `${item.id}/source[${index}]`;
    if (!isValidHttpsUrl(source.url) || !isValidHttpsUrl(source.licenseUrl)) {
      errors.push(`${label}: source and license URLs must use HTTPS.`);
    }
    if (source.copiedText !== false) {
      errors.push(`${label}: copiedText must remain false.`);
    }
    if (/^(?:unknown|none|unlicensed|proprietary)$/i.test(source.license.trim())) {
      errors.push(`${label}: source license must be explicitly identified.`);
    }
    if (source.role === "format-inspiration" && !OPEN_LICENSE_REGEX.test(source.license)) {
      errors.push(`${label}: format-inspiration sources must have a recognized open license.`);
    }
  });

  if (item.id === "int-js-nested-microtask-mid-v1") {
    const hasLicensedSeed = provenance.sources.some((source) =>
      source.role === "format-inspiration"
      && /github\.com\/lydiahallie\/javascript-questions/i.test(source.url)
      && /\bMIT\b/i.test(source.license));
    if (!hasLicensedSeed) {
      errors.push(`${item.id}: the Lydia Hallie MIT format-inspiration record is required.`);
    }
  }

  const sourceUrls = new Set(provenance.sources.map((source) => source.url));
  for (const link of privateItem.learnMore) {
    if (!sourceUrls.has(link.url)) {
      errors.push(`${item.id}: learnMore URL must also appear in provenance.sources (${link.url}).`);
    }
  }
}

function normalizeOutputLines(lines) {
  return lines.map((line) => String(line).trim().replace(/[\t ]+/g, " "));
}

export function executeJavaScriptOutput(source) {
  const encodedSource = Buffer.from(source, "utf8").toString("base64");
  const result = spawnSync(
    process.execPath,
    ["--input-type=commonjs", "-e", SANDBOX_RUNNER, encodedSource],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024,
      timeout: 1500,
    },
  );

  if (result.error) {
    throw new Error(result.error.code === "ETIMEDOUT"
      ? "execution exceeded the 1500ms safety limit"
      : result.error.message);
  }
  if (result.status !== 0) {
    const detail = String(result.stderr || "").trim() || `process exited with status ${result.status}`;
    throw new Error(detail);
  }
  if (String(result.stderr || "").trim()) {
    throw new Error(`execution wrote to stderr: ${String(result.stderr).trim()}`);
  }

  const output = String(result.stdout || "").replace(/\r/g, "").replace(/\n$/, "");
  return output ? normalizeOutputLines(output.split("\n")) : [];
}

function validateCodeOutput(item, privateItem, errors, { executeCode }) {
  if (!executeCode) return;

  const expectedOutput = normalizeOutputLines(privateItem.verification.expectedOutput);
  let actualOutput;
  try {
    actualOutput = executeJavaScriptOutput(item.code.source);
  } catch (error) {
    errors.push(`${item.id}: JavaScript verification failed: ${error.message}`);
    return;
  }

  if (JSON.stringify(actualOutput) !== JSON.stringify(expectedOutput)) {
    errors.push(
      `${item.id}: executed output ${JSON.stringify(actualOutput)} does not match expectedOutput ${JSON.stringify(expectedOutput)}.`,
    );
  }

  const correctOption = item.options.find((option) => option.id === privateItem.correctOptionId);
  const expectedLabel = expectedOutput.join(" → ");
  if (correctOption && correctOption.label !== expectedLabel) {
    errors.push(
      `${item.id}: correct option label must exactly match expectedOutput joined with " → ".`,
    );
  }
}

function validateDistribution(publicSet, errors) {
  const expectedCounts = {
    level: { junior: 1, mid: 2, senior: 2 },
    format: { conceptual: 2, "code-output": 1, "production-scenario": 2 },
  };

  for (const [field, counts] of Object.entries(expectedCounts)) {
    const actual = publicSet.items.reduce((result, item) => {
      result[item[field]] = (result[item[field]] || 0) + 1;
      return result;
    }, {});
    const matches = Object.keys(actual).length === Object.keys(counts).length
      && Object.entries(counts).every(([name, expectedCount]) => actual[name] === expectedCount);
    if (!matches) {
      errors.push(
        `public.items: ${field} distribution must be ${JSON.stringify(counts)}; received ${JSON.stringify(actual)}.`,
      );
    }
  }

  const technologyCounts = publicSet.items.reduce((result, item) => {
    result[item.technology] = (result[item.technology] || 0) + 1;
    return result;
  }, {});
  const expectedTechnologyCounts = { html: 1, javascript: 1, vue: 1, react: 1, angular: 1 };
  const technologyMatches = Object.keys(technologyCounts).length === Object.keys(expectedTechnologyCounts).length
    && Object.entries(expectedTechnologyCounts)
      .every(([name, expectedCount]) => technologyCounts[name] === expectedCount);
  if (!technologyMatches) {
    errors.push(
      `public.items: technology distribution must be ${JSON.stringify(expectedTechnologyCounts)}; received ${JSON.stringify(technologyCounts)}.`,
    );
  }
}

export function validateInterviewReferenceSet(
  publicSet,
  privateSet,
  { executeCode = true, schemaValidators = createSchemaValidators() } = {},
) {
  const errors = [];
  const warnings = [];
  const publicSchemaValid = schemaValidators.validatePublic(publicSet);
  const privateSchemaValid = schemaValidators.validatePrivate(privateSet);

  if (!publicSchemaValid) {
    errors.push(...formatSchemaErrors("public", schemaValidators.validatePublic.errors));
  }
  if (!privateSchemaValid) {
    errors.push(...formatSchemaErrors("private", schemaValidators.validatePrivate.errors));
  }

  const leakedKeys = findProhibitedPublicKeys(publicSet);
  leakedKeys.forEach((keyPath) => errors.push(`${keyPath}: private answer/review key leaked into public data.`));

  if (!publicSchemaValid || !privateSchemaValid) {
    return { errors, warnings };
  }

  if (publicSet.schemaVersion !== privateSet.schemaVersion
    || publicSet.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
    errors.push("public/private schemaVersion values must match the v1 contract.");
  }
  if (publicSet.setId !== privateSet.setId || publicSet.setId !== EXPECTED_SET_ID) {
    errors.push("public/private setId values must match the v1 contract.");
  }
  if (publicSet.items.length !== 5 || privateSet.items.length !== 5) {
    errors.push("public and private packages must each contain exactly 5 items.");
  }

  const publicIds = publicSet.items.map((item) => item.id);
  const privateIds = privateSet.items.map((item) => item.id);
  if (new Set(publicIds).size !== publicIds.length) {
    errors.push("public.items IDs must be unique.");
  }
  if (new Set(privateIds).size !== privateIds.length) {
    errors.push("private.items IDs must be unique.");
  }
  const expectedIds = [...EXPECTED_ITEMS.keys()].sort();
  if (JSON.stringify([...publicIds].sort()) !== JSON.stringify(expectedIds)) {
    errors.push("public.items must contain exactly the five approved reference IDs.");
  }
  if (JSON.stringify([...privateIds].sort()) !== JSON.stringify(expectedIds)) {
    errors.push("private.items must contain exactly the five approved reference IDs.");
  }

  validateDistribution(publicSet, errors);
  const totalSeconds = publicSet.items.reduce((sum, item) => sum + item.estimatedSeconds, 0);
  if (totalSeconds !== EXPECTED_TOTAL_SECONDS) {
    errors.push(`public.items estimatedSeconds must total ${EXPECTED_TOTAL_SECONDS}; received ${totalSeconds}.`);
  }

  const privateById = new Map(privateSet.items.map((item) => [item.id, item]));
  for (const item of publicSet.items) {
    const expected = EXPECTED_ITEMS.get(item.id);
    const privateItem = privateById.get(item.id);
    if (!expected || !privateItem) continue;

    for (const field of ["technology", "level", "format", "estimatedSeconds"]) {
      if (item[field] !== expected[field]) {
        errors.push(`${item.id}: ${field} must be ${JSON.stringify(expected[field])}.`);
      }
    }
    if (item.revision !== privateItem.revision) {
      errors.push(`${item.id}: public/private revisions must match.`);
    }
    if (!item.options.some((option) => option.id === privateItem.correctOptionId)) {
      errors.push(`${item.id}: correctOptionId must reference a public option ID.`);
    }
    if (privateItem.review.status !== publicSet.status) {
      errors.push(`${item.id}: private review status must match public set status.`);
    }
    if ([privateItem.review.technicalReview, privateItem.review.editorialReview].includes("failed")
      || privateItem.review.blindReview.status === "failed") {
      errors.push(`${item.id}: a package with a failed review cannot pass validation.`);
    }

    validateOptionText(item, privateItem, errors, warnings);
    validateRationales(item, privateItem, errors);
    validateOptionPermutations(item, privateItem, errors);
    validateProvenance(item, privateItem, expected, errors);
    if (item.format === "code-output") {
      validateCodeOutput(item, privateItem, errors, { executeCode });
    }
  }

  if (publicSet.status === "gold") {
    for (const privateItem of privateSet.items) {
      const review = privateItem.review;
      if (review.technicalReview !== "passed"
        || review.editorialReview !== "passed"
        || review.blindReview.status !== "passed"
        || !review.approvedBy
        || !review.approvedAt) {
        errors.push(`${privateItem.id}: gold items require all reviews passed and final approval metadata.`);
      }
    }
  }

  return { errors, warnings };
}

function main() {
  const publicPath = path.resolve(process.env.INTERVIEW_REFERENCE_PUBLIC_PATH || DEFAULT_PUBLIC_PATH);
  const privatePath = path.resolve(process.env.INTERVIEW_REFERENCE_PRIVATE_PATH || DEFAULT_PRIVATE_PATH);
  const publicSet = readJson(publicPath);
  const privateSet = readJson(privatePath);
  const { errors, warnings } = validateInterviewReferenceSet(publicSet, privateSet);

  for (const warning of warnings) {
    console.warn(`[interview-reference-set] WARN: ${warning}`);
  }

  if (errors.length) {
    console.error(`Interview reference set validation failed with ${errors.length} error(s).`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(
    `Interview reference set validation passed (${publicSet.items.length} items, ${EXPECTED_TOTAL_SECONDS} seconds).`,
  );
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(
      `[validate-interview-reference-set] ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
