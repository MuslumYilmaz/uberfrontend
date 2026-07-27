import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { chromium } from "@playwright/test";
import {
  bankContentHash,
  canonicalJson,
  contentHashForItem,
  interviewBankRoot,
  loadAuthoringItems,
  projectPublicItem,
  readJson,
} from "./interview-bank-lib.mjs";

const schemaRoot = path.join(interviewBankRoot, "schemas", "v2");
const policyRoot = path.join(interviewBankRoot, "policies");

export const interviewBankSchemaPaths = Object.freeze({
  item: path.join(schemaRoot, "interview-item.schema.json"),
  reviews: path.join(schemaRoot, "bank-reviews.schema.json"),
  manifest: path.join(schemaRoot, "bank-manifest.schema.json"),
  blueprint: path.join(schemaRoot, "bank-blueprint.schema.json"),
});

export const interviewBankPolicyPaths = Object.freeze({
  quality: path.join(policyRoot, "quality-policy.json"),
  sources: path.join(policyRoot, "source-policy.json"),
  runtimes: path.join(policyRoot, "runtime-profiles.json"),
});

const EXPECTED_BLUEPRINT = Object.freeze({
  questionCount: 60,
  level: { junior: 20, mid: 20, senior: 20 },
  technology: { javascript: 12, html: 6, css: 6, react: 12, angular: 12, vue: 12 },
  technologyByLevel: {
    junior: { javascript: 4, html: 2, css: 2, react: 4, angular: 4, vue: 4 },
    mid: { javascript: 4, html: 2, css: 2, react: 4, angular: 4, vue: 4 },
    senior: { javascript: 4, html: 2, css: 2, react: 4, angular: 4, vue: 4 },
  },
  difficultyBandByLevel: {
    junior: { foundation: 5, core: 10, stretch: 5 },
    mid: { foundation: 5, core: 10, stretch: 5 },
    senior: { foundation: 5, core: 10, stretch: 5 },
  },
  formatByLevel: {
    junior: { conceptual: 11, "code-output": 2, "production-scenario": 7 },
    mid: { conceptual: 8, "code-output": 2, "production-scenario": 10 },
    senior: { conceptual: 5, "code-output": 2, "production-scenario": 13 },
  },
  correctOptionPosition: { first: 20, second: 20, third: 20 },
  competencyDistinctByTechnology: {
    javascript: 12,
    html: 6,
    css: 6,
    react: 12,
    angular: 12,
    vue: 12,
  },
  selectionPolicy: {
    sessionQuestionCount: 5,
    coreQuestionsPerSession: 3,
    frameworkQuestionsPerSession: 2,
    coreTechnologies: ["javascript", "html", "css"],
    frameworkTechnologies: ["react", "angular", "vue"],
    eligiblePoolPerLevel: { core: 8, selectedFramework: 4, total: 12 },
  },
  codeOutputConstraint: {
    count: 6,
    technology: "javascript",
    codeLanguage: "javascript",
    runtime: "browser",
    verificationKind: "browser-console-output",
  },
});

const APPROVED_BANK_STATUSES = Object.freeze([
  "candidate",
  "editorial-gold",
  "calibrated-gold",
]);
const APPROVED_OFFICIAL_SOURCE_LICENSES = Object.freeze([
  Object.freeze({
    hostname: "developer.mozilla.org",
    freshnessDays: 365,
    licenseId: "CC-BY-SA-2.5",
    licenseUrl: "https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license",
  }),
  Object.freeze({
    hostname: "react.dev",
    freshnessDays: 180,
    licenseId: "CC-BY-4.0",
    licenseUrl: "https://github.com/reactjs/react.dev/blob/main/LICENSE-DOCS.md",
  }),
  Object.freeze({
    hostname: "angular.dev",
    freshnessDays: 180,
    licenseId: "CC-BY-4.0",
    licenseUrl: "https://angular.dev/license",
  }),
  Object.freeze({
    hostname: "v17.angular.io",
    freshnessDays: 180,
    licenseId: "CC-BY-4.0",
    licenseUrl: "https://angular.dev/license",
  }),
  Object.freeze({
    hostname: "vuejs.org",
    freshnessDays: 180,
    licenseId: "CC-BY-4.0",
    licenseUrl: "https://github.com/vuejs/docs/blob/main/LICENSE",
  }),
]);
const APPROVED_SOURCE_LICENSE_IDS = Object.freeze([
  "BSD-3-Clause",
  "CC-BY-3.0",
  "CC-BY-4.0",
  "CC-BY-SA-2.5",
  "CC-BY-SA-3.0",
  "CC-BY-SA-4.0",
  "CC0-1.0",
  "MIT",
  "W3C-20150513",
]);
const REQUIRED_QUALITY_RULES = Object.freeze([
  "optionLengthClue",
  "absoluteWording",
  "stemEchoClue",
  "optionSimilarity",
]);
const MAX_BROWSER_TIMEOUT_MS = 1500;
const MAX_BROWSER_OUTPUT_BYTES = 65_536;

const POSITION_NAMES = ["first", "second", "third"];
const POSITIONAL_OPTION_ID = /^(?:option-?)?(?:a|b|c|1|2|3|first|second|third|correct|incorrect)$/i;
const COMPOSITE_CLUE = /\b(?:all|none)\s+of\s+(?:the\s+)?(?:above|these)\b/i;
const LEXICAL_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by",
  "can", "could", "each", "every", "for", "from", "had", "has", "have", "how",
  "if", "in", "into", "is", "it", "its", "may", "might", "must", "of", "on",
  "only", "or", "should", "so", "than", "that", "the", "then", "these", "this",
  "those", "to", "was", "were", "what", "when", "which", "while", "with",
  "without", "would",
]);
const PUBLIC_LEAK_KEYS = new Set([
  "answerproof",
  "calibration",
  "contenthash",
  "copiedtext",
  "correctoptionid",
  "expectedoutput",
  "falsifyingconstraint",
  "finalapproval",
  "misconceptiontag",
  "optionrationales",
  "plausibility",
  "provenance",
  "remediationtopics",
  "review",
  "reviews",
  "sources",
  "verification",
  "verdict",
]);

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactStringMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.every((value) => typeof value === "string")
    && sameStringSet(actual, expected);
}

function addPolicyError(errors, pathLabel, message) {
  errors.push(`policies.${pathLabel}: ${message}`);
}

export function validatePolicyInvariants(policies, errors = []) {
  const initialErrorCount = errors.length;
  if (!isPlainObject(policies)) {
    addPolicyError(errors, "root", "quality, source, and runtime policies are required objects.");
    return false;
  }

  const quality = policies.quality;
  const sources = policies.sources;
  const runtimes = policies.runtimes;
  if (!isPlainObject(quality)) {
    addPolicyError(errors, "quality", "must be an object.");
  }
  if (!isPlainObject(sources)) {
    addPolicyError(errors, "sources", "must be an object.");
  }
  if (!isPlainObject(runtimes)) {
    addPolicyError(errors, "runtimes", "must be an object.");
  }
  if (!isPlainObject(quality) || !isPlainObject(sources) || !isPlainObject(runtimes)) {
    return false;
  }

  if (quality.schemaVersion !== "2.0.0"
    || quality.policyId !== "interview-quality-policy-v1") {
    addPolicyError(errors, "quality", "must use the approved v2 quality policy identity.");
  }
  if (!/^\d+\.\d+\.\d+$/.test(String(quality.checklistVersion || ""))) {
    addPolicyError(errors, "quality.checklistVersion", "must be a semantic version.");
  }
  if (!isPlainObject(quality.options)) {
    addPolicyError(errors, "quality.options", "must be an object.");
  } else {
    if (quality.options.count !== 3) {
      addPolicyError(errors, "quality.options.count", "must remain exactly 3.");
    }
    if (quality.options.permutationsRequired !== 6) {
      addPolicyError(errors, "quality.options.permutationsRequired", "must remain exactly 6.");
    }
    if (quality.options.publicIdsMustBeOpaque !== true) {
      addPolicyError(errors, "quality.options.publicIdsMustBeOpaque", "must remain true.");
    }
  }

  if (!isPlainObject(quality.reviewRules)) {
    addPolicyError(errors, "quality.reviewRules", "must be an object.");
  } else {
    for (const ruleName of REQUIRED_QUALITY_RULES) {
      const rule = quality.reviewRules[ruleName];
      if (!isPlainObject(rule)) {
        addPolicyError(errors, `quality.reviewRules.${ruleName}`, "must be an object.");
        continue;
      }
      if (rule.severity !== "blocker") {
        addPolicyError(errors, `quality.reviewRules.${ruleName}.severity`, "must remain blocker.");
      }
      if (rule.waivable !== false) {
        addPolicyError(errors, `quality.reviewRules.${ruleName}.waivable`, "must remain false.");
      }
      if (!hasExactStringMembers(rule.appliesToStatuses, APPROVED_BANK_STATUSES)) {
        addPolicyError(
          errors,
          `quality.reviewRules.${ruleName}.appliesToStatuses`,
          "must cover candidate, editorial-gold, and calibrated-gold.",
        );
      }
    }
    if (quality.reviewRules.optionLengthClue?.relativeDeviationFromDistractorMedian !== 0.15) {
      addPolicyError(
        errors,
        "quality.reviewRules.optionLengthClue.relativeDeviationFromDistractorMedian",
        "must remain exactly 0.15.",
      );
    }
    if (quality.reviewRules.optionSimilarity?.reviewThreshold !== 0.8) {
      addPolicyError(
        errors,
        "quality.reviewRules.optionSimilarity.reviewThreshold",
        "must remain exactly 0.8.",
      );
    }
    if (!hasExactStringMembers(
      quality.reviewRules.absoluteWording?.terms,
      ["always", "never"],
    )) {
      addPolicyError(
        errors,
        "quality.reviewRules.absoluteWording.terms",
        "must remain exactly always and never.",
      );
    }
    if (quality.reviewRules.stemEchoClue?.minimumContentWordNgram !== 3) {
      addPolicyError(
        errors,
        "quality.reviewRules.stemEchoClue.minimumContentWordNgram",
        "must remain exactly 3.",
      );
    }
  }

  const calibration = quality.calibration;
  if (!isPlainObject(calibration)) {
    addPolicyError(errors, "quality.calibration", "must be an object.");
  } else {
    if (!Number.isInteger(calibration.minimumMatchingLevelAttempts)
      || calibration.minimumMatchingLevelAttempts < 100) {
      addPolicyError(
        errors,
        "quality.calibration.minimumMatchingLevelAttempts",
        "must remain at least 100.",
      );
    }
    if (!Number.isFinite(calibration.discriminationIndex?.minimum)
      || calibration.discriminationIndex.minimum < 0.2) {
      addPolicyError(
        errors,
        "quality.calibration.discriminationIndex.minimum",
        "must remain at least 0.2.",
      );
    }
    if (!Number.isFinite(calibration.distractorSelectionRate?.minimum)
      || calibration.distractorSelectionRate.minimum < 0.05) {
      addPolicyError(
        errors,
        "quality.calibration.distractorSelectionRate.minimum",
        "must remain at least 0.05.",
      );
    }
    const difficultyMinimum = calibration.difficultyIndex?.minimum;
    const difficultyMaximum = calibration.difficultyIndex?.maximum;
    if (!Number.isFinite(difficultyMinimum) || !Number.isFinite(difficultyMaximum)
      || difficultyMinimum < 0.2 || difficultyMaximum > 0.9
      || difficultyMinimum > difficultyMaximum) {
      addPolicyError(
        errors,
        "quality.calibration.difficultyIndex",
        "must retain a valid range no wider than 0.2 through 0.9.",
      );
    }
    if (calibration.optionSelectionRateSum?.target !== 1
      || !Number.isFinite(calibration.optionSelectionRateSum?.absoluteTolerance)
      || calibration.optionSelectionRateSum.absoluteTolerance <= 0
      || calibration.optionSelectionRateSum.absoluteTolerance > 0.001) {
      addPolicyError(
        errors,
        "quality.calibration.optionSelectionRateSum",
        "must target 1 with a positive tolerance no greater than 0.001.",
      );
    }
  }

  if (sources.schemaVersion !== "2.0.0"
    || sources.policyId !== "interview-source-policy-v1") {
    addPolicyError(errors, "sources", "must use the approved v2 source policy identity.");
  }
  if (sources.requireHttps !== true) {
    addPolicyError(errors, "sources.requireHttps", "must remain true.");
  }
  if (!Number.isInteger(sources.minimumOfficialTechnicalSourcesPerItem)
    || sources.minimumOfficialTechnicalSourcesPerItem < 1) {
    addPolicyError(
      errors,
      "sources.minimumOfficialTechnicalSourcesPerItem",
      "must remain at least 1.",
    );
  }
  if (!hasExactStringMembers(
    sources.allowedRoles,
    ["technical-verification", "format-inspiration"],
  )) {
    addPolicyError(
      errors,
      "sources.allowedRoles",
      "must remain exactly technical-verification and format-inspiration.",
    );
  }
  if (!hasExactStringMembers(sources.allowedLicenseIds, APPROVED_SOURCE_LICENSE_IDS)) {
    addPolicyError(
      errors,
      "sources.allowedLicenseIds",
      "must contain exactly the approved open-license identifiers.",
    );
  }

  if (!Array.isArray(sources.officialDomains)
    || sources.officialDomains.some((entry) => !isPlainObject(entry))) {
    addPolicyError(errors, "sources.officialDomains", "must be an array of domain policy objects.");
  } else {
    const expectedHosts = APPROVED_OFFICIAL_SOURCE_LICENSES.map((entry) => entry.hostname);
    const actualHosts = sources.officialDomains.map((entry) => entry.hostname);
    if (!hasExactStringMembers(actualHosts, expectedHosts)) {
      addPolicyError(
        errors,
        "sources.officialDomains",
        "must contain exactly the approved MDN, React, Angular, Angular v17, and Vue hosts.",
      );
    }
    const domainsByHost = new Map(
      sources.officialDomains.map((entry) => [entry.hostname, entry]),
    );
    if (domainsByHost.size !== sources.officialDomains.length) {
      addPolicyError(errors, "sources.officialDomains", "hostnames must be unique.");
    }
    for (const expected of APPROVED_OFFICIAL_SOURCE_LICENSES) {
      const domain = domainsByHost.get(expected.hostname);
      if (!domain) continue;
      const rules = domain.licenseRules;
      if (!Array.isArray(rules) || rules.length !== 1 || !isPlainObject(rules[0])
        || rules[0].licenseId !== expected.licenseId
        || rules[0].licenseUrl !== expected.licenseUrl) {
        addPolicyError(
          errors,
          `sources.officialDomains.${expected.hostname}.licenseRules`,
          "must match the approved official license mapping exactly.",
        );
      }
      if (!Number.isInteger(domain.freshnessDays) || domain.freshnessDays <= 0
        || domain.freshnessDays > expected.freshnessDays) {
        addPolicyError(
          errors,
          `sources.officialDomains.${expected.hostname}.freshnessDays`,
          `must be a positive integer no greater than ${expected.freshnessDays}.`,
        );
      }
    }
  }
  if (!isPlainObject(sources.unofficialSourceRules)
    || sources.unofficialSourceRules.allowedRole !== "format-inspiration"
    || sources.unofficialSourceRules.copiedText !== false) {
    addPolicyError(
      errors,
      "sources.unofficialSourceRules",
      "must restrict unofficial sources to uncopied format inspiration.",
    );
  }

  if (runtimes.schemaVersion !== "2.0.0"
    || runtimes.policyId !== "interview-runtime-profiles-v1") {
    addPolicyError(errors, "runtimes", "must use the approved v2 runtime policy identity.");
  }
  if (!Array.isArray(runtimes.profiles)
    || runtimes.profiles.some((profile) => !isPlainObject(profile))) {
    addPolicyError(errors, "runtimes.profiles", "must be an array of runtime profile objects.");
  } else {
    const browserProfiles = runtimes.profiles.filter((profile) => profile.id === "browser");
    if (browserProfiles.length !== 1) {
      addPolicyError(errors, "runtimes.profiles", "must contain exactly one browser profile.");
    } else {
      const browser = browserProfiles[0];
      if (browser.kind !== "browser" || browser.engine !== "chromium"
        || browser.versionPolicy !== "runner-pinned"
        || browser.execution !== "verified") {
        addPolicyError(
          errors,
          "runtimes.profiles.browser",
          "must remain a verified Chromium browser profile.",
        );
      }
      for (const [field, label] of [
        ["networkAccess", "network"],
        ["fileSystemAccess", "filesystem"],
        ["dynamicCodeGeneration", "dynamic-code generation"],
      ]) {
        if (browser[field] !== false) {
          addPolicyError(
            errors,
            `runtimes.profiles.browser.${field}`,
            `${label} must remain disabled.`,
          );
        }
      }
      if (!Number.isInteger(browser.timeoutMs) || browser.timeoutMs <= 0
        || browser.timeoutMs > MAX_BROWSER_TIMEOUT_MS) {
        addPolicyError(
          errors,
          "runtimes.profiles.browser.timeoutMs",
          `must be a positive integer no greater than ${MAX_BROWSER_TIMEOUT_MS}.`,
        );
      }
      if (!Number.isInteger(browser.maxOutputBytes) || browser.maxOutputBytes <= 0
        || browser.maxOutputBytes > MAX_BROWSER_OUTPUT_BYTES) {
        addPolicyError(
          errors,
          "runtimes.profiles.browser.maxOutputBytes",
          `must be a positive integer no greater than ${MAX_BROWSER_OUTPUT_BYTES}.`,
        );
      }
      if (!Number.isInteger(browser.maxParallel) || browser.maxParallel <= 0) {
        addPolicyError(
          errors,
          "runtimes.profiles.browser.maxParallel",
          "must be a positive integer.",
        );
      }
    }
  }
  if (!Array.isArray(runtimes.runtimePatterns)
    || runtimes.runtimePatterns.some((profile) => (
      !isPlainObject(profile)
      || typeof profile.pattern !== "string"
      || typeof profile.technology !== "string"
    ))) {
    addPolicyError(
      errors,
      "runtimes.runtimePatterns",
      "must be an array of typed runtime-pattern objects.",
    );
  } else {
    for (const profile of runtimes.runtimePatterns) {
      try {
        new RegExp(profile.pattern);
      } catch {
        addPolicyError(
          errors,
          `runtimes.runtimePatterns.${profile.id || "unknown"}.pattern`,
          "must be a valid regular expression.",
        );
      }
    }
  }

  return errors.length === initialErrorCount;
}

function hostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function createSchemaValidators() {
  const ajv = new Ajv2020({
    allErrors: true,
    allowUnionTypes: true,
    strict: true,
    strictRequired: false,
    strictTypes: false,
  });
  ajv.addFormat("date", isValidDate);
  ajv.addFormat("uri", isHttpsUrl);
  return Object.fromEntries(
    Object.entries(interviewBankSchemaPaths).map(([name, filePath]) => [
      name,
      ajv.compile(readJson(filePath)),
    ]),
  );
}

function schemaErrors(label, validator) {
  return (validator.errors || []).map((issue) => {
    const detail = issue.params?.additionalProperty
      ? ` (${issue.params.additionalProperty})`
      : "";
    return `${label}${issue.instancePath || "/"}: ${issue.message}${detail}`;
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

function visibleLength(value) {
  return normalizeText(value).replace(/\s/g, "").length;
}

function tokenJaccard(left, right) {
  const leftTokens = new Set(normalizeText(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeText(right).split(" ").filter(Boolean));
  if (!leftTokens.size && !rightTokens.size) return 1;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
}

function contentNgrams(value, size) {
  const tokens = normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !LEXICAL_STOP_WORDS.has(token));
  const result = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function exactCounts(actual, expected) {
  return Object.keys(actual).length === Object.keys(expected).length
    && Object.entries(expected).every(([key, count]) => actual[key] === count);
}

function sameStringSet(actual, expected) {
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  return sortedActual.length === sortedExpected.length
    && sortedActual.every((value, index) => value === sortedExpected[index]);
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function findPublicLeaks(value, currentPath = "public", findings = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findPublicLeaks(entry, `${currentPath}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    if (PUBLIC_LEAK_KEYS.has(key.toLowerCase())) findings.push(`${currentPath}.${key}`);
    findPublicLeaks(child, `${currentPath}.${key}`, findings);
  }
  return findings;
}

function permutations(values) {
  if (values.length <= 1) return [values.slice()];
  return values.flatMap((value, index) => permutations(
    values.filter((_, candidateIndex) => candidateIndex !== index),
  ).map((tail) => [value, ...tail]));
}

export function evaluateInterviewAnswer(options, correctOptionId, selectedOptionId) {
  return options.some((option) => option.id === correctOptionId)
    && options.some((option) => option.id === selectedOptionId)
    && correctOptionId === selectedOptionId;
}

function validateBlueprint(blueprint, errors) {
  if (blueprint.questionCount !== EXPECTED_BLUEPRINT.questionCount) {
    errors.push(`blueprint.questionCount must be ${EXPECTED_BLUEPRINT.questionCount}.`);
  }
  for (const field of ["level", "technology", "correctOptionPosition"]) {
    if (!exactCounts(blueprint.distributions[field], EXPECTED_BLUEPRINT[field])) {
      errors.push(`blueprint.distributions.${field} does not match the approved 60-item plan.`);
    }
  }
  for (const level of Object.keys(EXPECTED_BLUEPRINT.level)) {
    if (!exactCounts(
      blueprint.distributions.technologyByLevel[level],
      EXPECTED_BLUEPRINT.technologyByLevel[level],
    )) {
      errors.push(`blueprint technology quotas for ${level} do not match the approved plan.`);
    }
    if (!exactCounts(
      blueprint.distributions.difficultyBandByLevel[level],
      EXPECTED_BLUEPRINT.difficultyBandByLevel[level],
    )) {
      errors.push(`blueprint difficulty-band quotas for ${level} do not match the approved plan.`);
    }
    if (!exactCounts(
      blueprint.distributions.formatByLevel[level],
      EXPECTED_BLUEPRINT.formatByLevel[level],
    )) {
      errors.push(`blueprint format quotas for ${level} do not match the approved plan.`);
    }
  }
  if (canonicalJson(blueprint.codeOutputConstraint)
    !== canonicalJson(EXPECTED_BLUEPRINT.codeOutputConstraint)) {
    errors.push("blueprint.codeOutputConstraint does not match the approved browser-output plan.");
  }
  if (!exactCounts(
    blueprint.competencyConstraint.distinctByTechnology,
    EXPECTED_BLUEPRINT.competencyDistinctByTechnology,
  )) {
    errors.push("blueprint competency coverage does not match the approved 60-item plan.");
  }
  if (canonicalJson(blueprint.selectionPolicy)
    !== canonicalJson(EXPECTED_BLUEPRINT.selectionPolicy)) {
    errors.push("blueprint selectionPolicy does not match the approved 3-core/2-framework plan.");
  }
}

function validateItemPath(entry, errors) {
  const { item, filePath } = entry;
  if (!filePath) return;
  const expectedName = `${item.id}.authoring.json`;
  if (path.basename(filePath) !== expectedName) {
    errors.push(`${item.id}: authoring filename must be ${expectedName}.`);
  }
  if (path.basename(path.dirname(filePath)) !== item.public.technology) {
    errors.push(`${item.id}: authoring directory must match technology ${item.public.technology}.`);
  }
}

function validateOptions(item, review, qualityPolicy, errors, warnings) {
  const options = item.public.options;
  const optionIds = options.map((option) => option.id);
  const normalizedLabels = options.map((option) => normalizeText(option.label));
  const correctOption = options.find((option) => option.id === item.private.correctOptionId);

  if (new Set(optionIds).size !== 3) errors.push(`${item.id}: option IDs must be unique.`);
  if (new Set(normalizedLabels).size !== 3) errors.push(`${item.id}: option labels must be unique.`);
  for (const option of options) {
    if (POSITIONAL_OPTION_ID.test(option.id)) {
      errors.push(`${item.id}/${option.id}: option IDs may not encode position or correctness.`);
    }
    if (COMPOSITE_CLUE.test(option.label)) {
      errors.push(`${item.id}/${option.id}: all/none-of-the-above clues are prohibited.`);
    }
    for (const term of qualityPolicy.reviewRules.absoluteWording.terms) {
      if (new RegExp(`\\b${term}\\b`, "i").test(option.label)) {
        errors.push(`${item.id}/${option.id}: prohibited absolute clue word "${term}".`);
      }
    }
  }

  for (let left = 0; left < options.length; left += 1) {
    for (let right = left + 1; right < options.length; right += 1) {
      const first = normalizedLabels[left];
      const second = normalizedLabels[right];
      const shorter = first.length <= second.length ? first : second;
      const longer = first.length > second.length ? first : second;
      if (shorter.length >= 20 && longer.includes(shorter)) {
        errors.push(`${item.id}: options ${optionIds[left]} and ${optionIds[right]} overlap by containment.`);
      }
      if (item.public.format !== "code-output") {
        const similarity = tokenJaccard(options[left].label, options[right].label);
        const threshold = qualityPolicy.reviewRules.optionSimilarity.reviewThreshold;
        if (similarity >= threshold) {
          errors.push(
            `${item.id}: options ${optionIds[left]} and ${optionIds[right]} have ${(similarity * 100).toFixed(0)}% token overlap.`,
          );
        }
      }
    }
  }

  if (!correctOption) {
    errors.push(`${item.id}: correctOptionId must reference a public option.`);
    return;
  }
  const stemEchoSize = qualityPolicy.reviewRules.stemEchoClue.minimumContentWordNgram;
  const correctNgrams = contentNgrams(correctOption.label, stemEchoSize);
  const distractorNgrams = new Set(
    options
      .filter((option) => option.id !== item.private.correctOptionId)
      .flatMap((option) => [...contentNgrams(option.label, stemEchoSize)]),
  );
  const correctOnlyStemEcho = [...contentNgrams(item.public.prompt, stemEchoSize)]
    .find((ngram) => correctNgrams.has(ngram) && !distractorNgrams.has(ngram));
  if (correctOnlyStemEcho) {
    errors.push(
      `${item.id}: correct option uniquely echoes the stem phrase "${correctOnlyStemEcho}".`,
    );
  }
  const distractorLengths = options
    .filter((option) => option.id !== item.private.correctOptionId)
    .map((option) => visibleLength(option.label));
  const distractorMedian = median(distractorLengths);
  const deviation = distractorMedian
    ? Math.abs(visibleLength(correctOption.label) - distractorMedian) / distractorMedian
    : 0;
  const limit = qualityPolicy.reviewRules.optionLengthClue.relativeDeviationFromDistractorMedian;
  if (deviation > limit) {
    errors.push(
      `${item.id}: correct-option length differs from distractor median by ${(deviation * 100).toFixed(1)}% (maximum ${(limit * 100).toFixed(0)}%).`,
    );
  }

  const orderings = permutations(options);
  if (orderings.length !== qualityPolicy.options.permutationsRequired) {
    errors.push(`${item.id}: exactly six option permutations must be testable.`);
  }
  for (const ordering of orderings) {
    const accepted = ordering.filter((option) => evaluateInterviewAnswer(
      ordering,
      item.private.correctOptionId,
      option.id,
    ));
    if (accepted.length !== 1 || accepted[0].id !== item.private.correctOptionId) {
      errors.push(`${item.id}: ID-based answer resolution changes under permutation.`);
      break;
    }
  }
}

function validateRationalesAndProof(item, errors) {
  const optionIds = new Set(item.public.options.map((option) => option.id));
  const rationales = item.private.optionRationales;
  const rationaleIds = rationales.map((rationale) => rationale.optionId);
  if (new Set(rationaleIds).size !== 3
    || [...optionIds].some((optionId) => !rationaleIds.includes(optionId))
    || rationaleIds.some((optionId) => !optionIds.has(optionId))) {
    errors.push(`${item.id}: rationales must cover each public option exactly once.`);
  }
  const correct = rationales.filter((rationale) => rationale.verdict === "correct");
  if (correct.length !== 1 || correct[0].optionId !== item.private.correctOptionId) {
    errors.push(`${item.id}: exactly one correct rationale must match correctOptionId.`);
  }
  const misconceptionTags = rationales
    .filter((rationale) => rationale.verdict === "incorrect")
    .map((rationale) => rationale.misconceptionTag);
  if (new Set(misconceptionTags).size !== misconceptionTags.length) {
    errors.push(`${item.id}: distractors must use distinct misconception tags.`);
  }

  const sourceById = new Map(
    item.private.provenance.sources.map((source) => [source.id, source]),
  );
  for (const claim of item.private.answerProof.claims) {
    const resolvedSources = [];
    for (const sourceId of claim.sourceIds) {
      const source = sourceById.get(sourceId);
      if (!source) {
        errors.push(`${item.id}: answer-proof claim references unknown source ${sourceId}.`);
      } else {
        resolvedSources.push(source);
      }
    }
    if (!resolvedSources.some(
      (source) => source.official && source.role === "technical-verification",
    )) {
      errors.push(
        `${item.id}: every answer-proof claim must cite at least one official technical-verification source.`,
      );
    }
  }
}

function dayDifference(later, earlier) {
  return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}

function validateSources(item, sourcePolicy, errors, now) {
  const sources = item.private.provenance.sources;
  const sourceIds = sources.map((source) => source.id);
  if (new Set(sourceIds).size !== sourceIds.length) {
    errors.push(`${item.id}: provenance source IDs must be unique.`);
  }
  const domainPolicies = new Map(
    sourcePolicy.officialDomains.map((entry) => [entry.hostname.replace(/^www\./, ""), entry]),
  );
  let officialTechnicalCount = 0;

  for (const source of sources) {
    const label = `${item.id}/source:${source.id}`;
    if (!isHttpsUrl(source.url) || !isHttpsUrl(source.licenseUrl)) {
      errors.push(`${label}: source and license URLs must use HTTPS.`);
    }
    if (!sourcePolicy.allowedRoles.includes(source.role)) {
      errors.push(`${label}: unsupported source role ${source.role}.`);
    }
    if (!sourcePolicy.allowedLicenseIds.includes(source.licenseId)) {
      errors.push(`${label}: unsupported licenseId ${source.licenseId}.`);
    }
    if (source.copiedText !== false) errors.push(`${label}: copiedText must be false.`);
    const sourceDomain = hostname(source.url);
    const domainPolicy = domainPolicies.get(sourceDomain);
    if (source.official) {
      if (!domainPolicy) {
        errors.push(`${label}: official source host ${sourceDomain} is not allowlisted.`);
      } else {
        const licenseAllowedForDomain = domainPolicy.licenseRules?.some(
          (rule) => rule.licenseId === source.licenseId && rule.licenseUrl === source.licenseUrl,
        );
        if (!licenseAllowedForDomain) {
          errors.push(
            `${label}: license ${source.licenseId} (${source.licenseUrl}) is not allowed for official host ${sourceDomain}.`,
          );
        }
      }
      if (source.role === "technical-verification") officialTechnicalCount += 1;
    } else if (source.role !== sourcePolicy.unofficialSourceRules.allowedRole) {
      errors.push(`${label}: unofficial sources may only be used for format inspiration.`);
    }
    const retrievedAt = new Date(`${source.retrievedAt}T00:00:00.000Z`);
    if (retrievedAt > now) errors.push(`${label}: retrievedAt may not be in the future.`);
    if (domainPolicy && dayDifference(now, retrievedAt) > domainPolicy.freshnessDays) {
      errors.push(`${label}: source verification is stale after ${domainPolicy.freshnessDays} days.`);
    }
    if (!String(source.revision || "").trim()) errors.push(`${label}: source revision is required.`);
  }

  if (officialTechnicalCount < sourcePolicy.minimumOfficialTechnicalSourcesPerItem) {
    errors.push(`${item.id}: at least one official technical-verification source is required.`);
  }
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  for (const link of item.private.learnMore) {
    const source = sourceById.get(link.sourceId);
    if (!source || source.url !== link.url) {
      errors.push(`${item.id}: learnMore ${link.url} must match its provenance sourceId.`);
    }
  }
}

function validateCodeContract(item, runtimeProfiles, errors) {
  const { code, format, technology } = item.public;
  if (format === "code-output") {
    if (!code || technology !== "javascript"
      || code.language !== "javascript" || code.runtime !== "browser") {
      errors.push(`${item.id}: code-output items require JavaScript code in the browser runtime.`);
    }
    if (item.private.verification?.kind !== "browser-console-output") {
      errors.push(`${item.id}: code-output item requires browser-console-output verification.`);
    }
    return;
  }
  if (item.private.verification) {
    errors.push(`${item.id}: verification is only supported for code-output items.`);
  }
  if (!code) return;
  const exactProfile = runtimeProfiles.profiles.find((profile) => profile.id === code.runtime);
  const patternProfile = runtimeProfiles.runtimePatterns?.find((profile) =>
    profile.technology === technology && new RegExp(profile.pattern).test(code.runtime));
  const exactTechnologyMatches = code.runtime === "browser"
    || !exactProfile?.engine
    || exactProfile.engine === technology;
  const validRuntime = (Boolean(exactProfile) && exactTechnologyMatches) || Boolean(patternProfile);
  if (!validRuntime) errors.push(`${item.id}: code runtime ${code.runtime} does not match its technology.`);
}

function validateReviews(items, reviews, manifest, qualityPolicy, errors, warnings, now) {
  const reviewsById = new Map(reviews.items.map((entry) => [entry.id, entry]));
  if (reviewsById.size !== reviews.items.length) errors.push("reviews.items IDs must be unique.");
  if (reviews.items.length !== items.length) errors.push("reviews must contain exactly one entry per bank item.");
  const itemRefs = [];

  for (const item of items) {
    const review = reviewsById.get(item.id);
    const contentHash = contentHashForItem(item);
    itemRefs.push({ id: item.id, revision: item.revision, contentHash });
    if (!review) {
      errors.push(`${item.id}: consolidated review entry is missing.`);
      continue;
    }
    if (review.revision !== item.revision || review.contentHash !== contentHash) {
      errors.push(`${item.id}: review entry is not bound to the current revision/contentHash.`);
    }
    for (const stageName of ["technical", "editorial", "blind"]) {
      const stage = review[stageName];
      if (stage.status !== "passed") {
        errors.push(`${item.id}: ${stageName} review must be passed for ${manifest.status}.`);
      }
      if (stage.reviewedRevision !== item.revision || stage.contentHash !== contentHash) {
        errors.push(`${item.id}: ${stageName} review is stale for the current content.`);
      }
      if (stage.checklistVersion !== qualityPolicy.checklistVersion) {
        errors.push(`${item.id}: ${stageName} review does not use the current quality checklist.`);
      }
      if (stage.reviewedAt && new Date(`${stage.reviewedAt}T00:00:00.000Z`) > now) {
        errors.push(`${item.id}: ${stageName} review date may not be in the future.`);
      }
    }

    const optionIds = item.public.options.map((option) => option.id);
    const distractorIds = optionIds.filter((optionId) => optionId !== item.private.correctOptionId);
    if (review.technical.verifiedCorrectOptionId !== item.private.correctOptionId) {
      errors.push(`${item.id}: technical review verifiedCorrectOptionId does not match the answer key.`);
    }
    if (!sameStringSet(review.technical.rejectedDistractorOptionIds, distractorIds)) {
      errors.push(`${item.id}: technical review must reject exactly the two keyed distractors.`);
    }
    const sourceById = new Map(
      item.private.provenance.sources.map((source) => [source.id, source]),
    );
    const proofTechnicalSourceIds = [...new Set(
      item.private.answerProof.claims.flatMap((claim) => claim.sourceIds),
    )].filter((sourceId) => {
      const source = sourceById.get(sourceId);
      return source?.official && source.role === "technical-verification";
    });
    if (!sameStringSet(review.technical.verifiedSourceIds, proofTechnicalSourceIds)) {
      errors.push(
        `${item.id}: technical review must verify every official source cited by the answer proof.`,
      );
    }
    for (const sourceId of review.technical.verifiedSourceIds) {
      const source = sourceById.get(sourceId);
      if (!source) {
        errors.push(`${item.id}: technical review references unknown source ${sourceId}.`);
      } else if (source.role !== "technical-verification") {
        errors.push(`${item.id}: technical review source ${sourceId} is not technical verification evidence.`);
      }
    }

    if (review.editorial.status === "passed") {
      if (!review.editorial.originalityConfirmed
        || !review.editorial.oneBestAnswerConfirmed
        || !review.editorial.parallelOptionsConfirmed) {
        errors.push(`${item.id}: passed editorial review requires all quality confirmations.`);
      }
      if (review.editorial.clueFlags.length) {
        errors.push(`${item.id}: passed editorial review may not retain clue flags.`);
      }
    }

    if (review.blind.status === "passed") {
      if (review.blind.selectedOptionId !== item.private.correctOptionId) {
        errors.push(`${item.id}: passed blind review must independently select the keyed option.`);
      }
      if (review.blind.alternativeValidOptionIds.length) {
        errors.push(`${item.id}: passed blind review may not identify alternative valid options.`);
      }
      if (review.blind.clueFlags.length) {
        errors.push(`${item.id}: passed blind review may not retain clue flags.`);
      }
      if (review.blind.confidence === "low") {
        errors.push(`${item.id}: passed blind review may not retain low confidence.`);
      }
      if (review.blind.assessedLevel !== item.public.level) {
        errors.push(`${item.id}: blind assessedLevel must match the authored level.`);
      }
      if (review.blind.assessedDifficultyBand !== item.public.difficultyBand) {
        warnings.push(
          `${item.id}: blind assessedDifficultyBand ${review.blind.assessedDifficultyBand} differs from authored ${item.public.difficultyBand}; retain for comparative editorial calibration.`,
        );
      }
    }
    if (review.blind.reviewer === item.author.id) {
      errors.push(`${item.id}: blind reviewer must differ from the author.`);
    }
    if (review.blind.reviewer === review.editorial.reviewer) {
      errors.push(`${item.id}: blind reviewer must differ from the editorial reviewer.`);
    }
    for (const waiver of review.waivers) {
      if (waiver.revision !== item.revision || waiver.contentHash !== contentHash) {
        errors.push(`${item.id}: waiver ${waiver.ruleId} is stale.`);
      }
      if (new Date(`${waiver.reviewedAt}T00:00:00.000Z`) > now) {
        errors.push(`${item.id}: waiver ${waiver.ruleId} date may not be in the future.`);
      }
    }
  }

  const expectedBankHash = bankContentHash(itemRefs);
  if (manifest.status === "candidate") {
    if (reviews.finalApproval !== null) {
      errors.push("candidate bank finalApproval must remain null.");
    }
  } else {
    const approval = reviews.finalApproval;
    if (!approval || approval.bankVersion !== manifest.bankVersion
      || approval.bankContentHash !== expectedBankHash) {
      errors.push(`${manifest.status}: final approval must bind the current bankVersion and bank content hash.`);
    } else if (new Date(`${approval.approvedAt}T00:00:00.000Z`) > now) {
      errors.push("final approval date may not be in the future.");
    } else {
      const approvalDate = new Date(`${approval.approvedAt}T00:00:00.000Z`);
      const laterReview = reviews.items.flatMap((review) => [
        review.technical,
        review.editorial,
        review.blind,
      ]).find((stage) => (
        stage.reviewedAt
        && new Date(`${stage.reviewedAt}T00:00:00.000Z`) > approvalDate
      ));
      if (laterReview) {
        errors.push(`${manifest.status}: final approval may not predate an item review.`);
      }
    }
  }
  return { reviewsById, expectedBankHash };
}

function validateCalibration(item, qualityPolicy, errors, now, finalApproval) {
  const calibration = item.private.calibration;
  const policy = qualityPolicy.calibration;
  if (!calibration || calibration.status !== "measured") {
    errors.push(`${item.id}: calibrated-gold requires measured calibration data.`);
    return;
  }
  if (calibration.matchingLevelAttempts < policy.minimumMatchingLevelAttempts) {
    errors.push(`${item.id}: calibration requires at least ${policy.minimumMatchingLevelAttempts} matching-level attempts.`);
  }
  if (calibration.difficultyIndex < policy.difficultyIndex.minimum
    || calibration.difficultyIndex > policy.difficultyIndex.maximum) {
    errors.push(`${item.id}: difficultyIndex is outside the calibrated range.`);
  }
  if (calibration.discriminationIndex < policy.discriminationIndex.minimum) {
    errors.push(`${item.id}: discriminationIndex is below the calibrated minimum.`);
  }
  const optionIds = new Set(item.public.options.map((option) => option.id));
  const rateIds = calibration.optionSelectionRates.map((entry) => entry.optionId);
  if (new Set(rateIds).size !== optionIds.size
    || rateIds.some((optionId) => !optionIds.has(optionId))) {
    errors.push(`${item.id}: calibration rates must cover each option exactly once.`);
  }
  const rateSum = calibration.optionSelectionRates.reduce((sum, entry) => sum + entry.rate, 0);
  if (Math.abs(rateSum - policy.optionSelectionRateSum.target)
    > policy.optionSelectionRateSum.absoluteTolerance) {
    errors.push(`${item.id}: option selection rates must sum to 1 within policy tolerance.`);
  }
  const correctRate = calibration.optionSelectionRates.find(
    (entry) => entry.optionId === item.private.correctOptionId,
  )?.rate;
  if (correctRate !== undefined
    && Math.abs(correctRate - calibration.difficultyIndex)
      > policy.optionSelectionRateSum.absoluteTolerance) {
    errors.push(`${item.id}: difficultyIndex must equal the keyed option selection rate.`);
  }
  for (const rate of calibration.optionSelectionRates) {
    if (rate.optionId === item.private.correctOptionId) continue;
    if (rate.rate < policy.distractorSelectionRate.minimum) {
      errors.push(`${item.id}/${rate.optionId}: distractor selection rate is below 5%.`);
    }
  }
  if (new Date(`${calibration.measuredAt}T00:00:00.000Z`) > now) {
    errors.push(`${item.id}: calibration measuredAt may not be in the future.`);
  }
  if (finalApproval
    && new Date(`${calibration.measuredAt}T00:00:00.000Z`)
      < new Date(`${finalApproval.approvedAt}T00:00:00.000Z`)) {
    errors.push(`${item.id}: calibration must be measured on or after editorial approval.`);
  }
}

function validateBankDistributions(items, blueprint, errors) {
  const levels = countBy(items, (item) => item.public.level);
  const technologies = countBy(items, (item) => item.public.technology);
  if (!exactCounts(levels, blueprint.distributions.level)) {
    errors.push(`bank level distribution mismatch: ${JSON.stringify(levels)}.`);
  }
  if (!exactCounts(technologies, blueprint.distributions.technology)) {
    errors.push(`bank technology distribution mismatch: ${JSON.stringify(technologies)}.`);
  }
  for (const level of Object.keys(blueprint.distributions.level)) {
    const levelItems = items.filter((item) => item.public.level === level);
    const technologiesByLevel = countBy(levelItems, (item) => item.public.technology);
    const bands = countBy(levelItems, (item) => item.public.difficultyBand);
    const formats = countBy(levelItems, (item) => item.public.format);
    if (!exactCounts(
      technologiesByLevel,
      blueprint.distributions.technologyByLevel[level],
    )) {
      errors.push(`${level}: technology distribution mismatch: ${JSON.stringify(technologiesByLevel)}.`);
    }
    if (!exactCounts(bands, blueprint.distributions.difficultyBandByLevel[level])) {
      errors.push(`${level}: difficulty-band distribution mismatch: ${JSON.stringify(bands)}.`);
    }
    if (!exactCounts(formats, blueprint.distributions.formatByLevel[level])) {
      errors.push(`${level}: format distribution mismatch: ${JSON.stringify(formats)}.`);
    }
  }
  const positions = countBy(items, (item) => {
    const index = item.public.options.findIndex(
      (option) => option.id === item.private.correctOptionId,
    );
    return POSITION_NAMES[index] || "missing";
  });
  if (!exactCounts(positions, blueprint.distributions.correctOptionPosition)) {
    errors.push(`correct-option position distribution mismatch: ${JSON.stringify(positions)}.`);
  }
  const outputItems = items.filter((item) => item.public.format === "code-output");
  if (outputItems.length !== blueprint.codeOutputConstraint.count) {
    errors.push(`bank must contain exactly ${blueprint.codeOutputConstraint.count} code-output items.`);
  }
  for (const [technology, expectedDistinct] of Object.entries(
    blueprint.competencyConstraint.distinctByTechnology,
  )) {
    const distinct = new Set(
      items
        .filter((item) => item.public.technology === technology)
        .map((item) => item.public.competency),
    ).size;
    if (distinct !== expectedDistinct) {
      errors.push(
        `${technology}: distinct competency coverage is ${distinct}; expected ${expectedDistinct}.`,
      );
    }
  }
  const { selectionPolicy } = blueprint;
  for (const level of Object.keys(blueprint.distributions.level)) {
    const levelItems = items.filter((item) => item.public.level === level);
    const coreCount = levelItems.filter((item) =>
      selectionPolicy.coreTechnologies.includes(item.public.technology)).length;
    if (coreCount !== selectionPolicy.eligiblePoolPerLevel.core) {
      errors.push(`${level}: eligible core pool is ${coreCount}; expected 8.`);
    }
    for (const framework of selectionPolicy.frameworkTechnologies) {
      const frameworkCount = levelItems.filter(
        (item) => item.public.technology === framework,
      ).length;
      if (frameworkCount !== selectionPolicy.eligiblePoolPerLevel.selectedFramework
        || coreCount + frameworkCount !== selectionPolicy.eligiblePoolPerLevel.total) {
        errors.push(
          `${level}/${framework}: eligible interview pool must be 8 core + 4 framework = 12.`,
        );
      }
    }
  }
}

function validateCrossItemDuplicates(items, qualityPolicy, errors) {
  const questionMaterial = (item) => item.public.format === "code-output"
    ? `${item.public.prompt}\n${item.public.code?.source || ""}`
    : item.public.prompt;
  const normalizedQuestions = new Map();
  for (const item of items) {
    const normalized = normalizeText(questionMaterial(item));
    const duplicate = normalizedQuestions.get(normalized);
    if (duplicate) errors.push(`${item.id}: question material duplicates ${duplicate}.`);
    else normalizedQuestions.set(normalized, item.id);
  }
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      const similarity = tokenJaccard(
        questionMaterial(items[left]),
        questionMaterial(items[right]),
      );
      if (similarity >= 0.85) {
        errors.push(
          `${items[left].id} and ${items[right].id}: question material is near-duplicate (${(similarity * 100).toFixed(0)}%).`,
        );
      }
    }
  }

  const options = items.flatMap((item) => item.public.options.map((option) => ({
    item,
    option,
    normalized: normalizeText(option.label),
  })));
  const optionThreshold = qualityPolicy.reviewRules.optionSimilarity.reviewThreshold;
  for (let left = 0; left < options.length; left += 1) {
    for (let right = left + 1; right < options.length; right += 1) {
      const first = options[left];
      const second = options[right];
      if (first.item.id === second.item.id) continue;
      if (first.normalized === second.normalized) {
        errors.push(
          `${first.item.id}/${first.option.id} duplicates option wording from ${second.item.id}/${second.option.id}.`,
        );
        continue;
      }
      if (first.item.public.format === "code-output"
        || second.item.public.format === "code-output") continue;
      const similarity = tokenJaccard(first.option.label, second.option.label);
      if (similarity >= optionThreshold) {
        errors.push(
          `${first.item.id}/${first.option.id} and ${second.item.id}/${second.option.id}: option wording is near-duplicate (${(similarity * 100).toFixed(0)}%).`,
        );
      }
    }
  }
}

async function runBrowserQuestion(browser, item, runtimePolicy) {
  const context = await browser.newContext({ javaScriptEnabled: true });
  await context.route("**/*", (route) => route.abort());
  const page = await context.newPage();
  await page.setContent(
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'">`,
  );
  const output = [];
  const pageErrors = [];
  let outputBytes = 0;
  page.on("console", (message) => {
    if (message.type() !== "log") return;
    const text = message.text().trim().replace(/[\t ]+/g, " ");
    outputBytes += Buffer.byteLength(text, "utf8");
    output.push(text);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  let timeoutHandle;
  try {
    await Promise.race([
      page.addScriptTag({ content: item.public.code.source })
        .then(() => page.waitForTimeout(100)),
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error(`execution exceeded ${runtimePolicy.timeoutMs}ms`)),
          runtimePolicy.timeoutMs,
        );
      }),
    ]);
    if (pageErrors.length) throw new Error(pageErrors.join("; "));
    if (outputBytes > runtimePolicy.maxOutputBytes) {
      throw new Error(`console output exceeded ${runtimePolicy.maxOutputBytes} bytes`);
    }
    return output;
  } finally {
    clearTimeout(timeoutHandle);
    await context.close().catch(() => {});
  }
}

export async function verifyBrowserConsoleOutputs(items, runtimeProfiles, errors) {
  const outputItems = items.filter((item) => item.public.format === "code-output");
  if (!outputItems.length) return;
  const runtimePolicy = runtimeProfiles.profiles.find((profile) => profile.id === "browser");
  if (!runtimePolicy) {
    errors.push("runtime policy is missing the browser profile.");
    return;
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const item of outputItems) {
      let actual;
      try {
        actual = await runBrowserQuestion(browser, item, runtimePolicy);
      } catch (error) {
        errors.push(`${item.id}: browser verification failed: ${error.message}`);
        continue;
      }
      const expected = item.private.verification.expectedOutput.map(
        (line) => String(line).trim().replace(/[\t ]+/g, " "),
      );
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        errors.push(
          `${item.id}: browser output ${JSON.stringify(actual)} does not match ${JSON.stringify(expected)}.`,
        );
      }
      const correctOption = item.public.options.find(
        (option) => option.id === item.private.correctOptionId,
      );
      if (correctOption && correctOption.label !== expected.join(" → ")) {
        errors.push(`${item.id}: correct output option must equal expectedOutput joined with " → ".`);
      }
    }
  } catch (error) {
    errors.push(`browser-console-output runner could not start: ${error.message}`);
  } finally {
    await browser?.close().catch(() => {});
  }
}

export function loadInterviewBankPolicies() {
  return Object.fromEntries(
    Object.entries(interviewBankPolicyPaths).map(([name, filePath]) => [name, readJson(filePath)]),
  );
}

export function loadInterviewBankContext(paths) {
  return {
    itemEntries: loadAuthoringItems(paths.itemsDir),
    manifest: readJson(paths.manifestPath),
    reviews: readJson(paths.reviewsPath),
    blueprint: readJson(paths.blueprintPath),
    policies: loadInterviewBankPolicies(),
  };
}

export async function validateInterviewBank(
  context,
  {
    executeBrowser = true,
    requireGold = false,
    now = new Date(),
    schemaValidators = createSchemaValidators(),
  } = {},
) {
  const errors = [];
  const warnings = [];
  const { itemEntries, manifest, reviews, blueprint, policies } = context;

  if (!validatePolicyInvariants(policies, errors)) {
    return { errors, warnings };
  }

  const blueprintValid = schemaValidators.blueprint(blueprint);
  if (!blueprintValid) errors.push(...schemaErrors("blueprint", schemaValidators.blueprint));
  const manifestValid = schemaValidators.manifest(manifest);
  if (!manifestValid) errors.push(...schemaErrors("manifest", schemaValidators.manifest));
  const reviewsValid = schemaValidators.reviews(reviews);
  if (!reviewsValid) errors.push(...schemaErrors("reviews", schemaValidators.reviews));
  let itemSchemasValid = true;
  for (const entry of itemEntries) {
    if (!schemaValidators.item(entry.item)) {
      itemSchemasValid = false;
      errors.push(...schemaErrors(path.relative(interviewBankRoot, entry.filePath), schemaValidators.item));
    }
  }
  if (!blueprintValid || !manifestValid || !reviewsValid || !itemSchemasValid) {
    return { errors, warnings };
  }

  const items = itemEntries.map((entry) => entry.item);
  validateBlueprint(blueprint, errors);
  if (manifest.blueprintId !== blueprint.blueprintId || manifest.bankId !== blueprint.bankId) {
    errors.push("manifest must reference the validated blueprint and bankId.");
  }
  if (reviews.bankId !== manifest.bankId
    || reviews.bankVersion !== manifest.bankVersion
    || reviews.status !== manifest.status) {
    errors.push("manifest and consolidated reviews must share bankId, bankVersion, and status.");
  }
  if (requireGold && manifest.status === "candidate") {
    errors.push("gold lint requires editorial-gold or calibrated-gold status.");
  }

  const itemIds = items.map((item) => item.id);
  const refs = manifest.itemRefs.map((reference) => reference.id);
  const bankOptionIds = items.flatMap((item) => item.public.options.map((option) => option.id));
  if (new Set(itemIds).size !== itemIds.length) errors.push("authoring item IDs must be unique.");
  if (new Set(refs).size !== refs.length) errors.push("manifest itemRefs IDs must be unique.");
  if (new Set(bankOptionIds).size !== bankOptionIds.length) {
    errors.push("public option IDs must be globally unique across the bank.");
  }
  if (items.length !== blueprint.questionCount || manifest.itemRefs.length !== blueprint.questionCount) {
    errors.push(`bank and manifest must contain exactly ${blueprint.questionCount} items.`);
  }
  if (JSON.stringify([...itemIds].sort()) !== JSON.stringify([...refs].sort())) {
    errors.push("manifest itemRefs must contain every authoring item exactly once.");
  }
  const itemById = new Map(items.map((item) => [item.id, item]));
  for (const reference of manifest.itemRefs) {
    if (itemById.get(reference.id)?.revision !== reference.revision) {
      errors.push(`${reference.id}: manifest revision does not match authoring revision.`);
    }
  }

  const { reviewsById } = validateReviews(
    items,
    reviews,
    manifest,
    policies.quality,
    errors,
    warnings,
    now,
  );
  for (const entry of itemEntries) {
    const item = entry.item;
    const review = reviewsById.get(item.id);
    validateItemPath(entry, errors);
    findPublicLeaks(projectPublicItem(item), item.id).forEach(
      (keyPath) => errors.push(`${keyPath}: private key leaked into public projection.`),
    );
    validateOptions(item, review, policies.quality, errors, warnings);
    validateRationalesAndProof(item, errors);
    validateSources(item, policies.sources, errors, now);
    validateCodeContract(item, policies.runtimes, errors);
    if (manifest.status === "calibrated-gold") {
      validateCalibration(
        item,
        policies.quality,
        errors,
        now,
        reviews.finalApproval,
      );
    }
  }

  validateBankDistributions(items, blueprint, errors);
  validateCrossItemDuplicates(items, policies.quality, errors);
  if (executeBrowser) {
    await verifyBrowserConsoleOutputs(items, policies.runtimes, errors);
  }
  return { errors, warnings };
}
