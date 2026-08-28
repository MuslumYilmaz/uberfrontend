import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const interviewContentDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const repoRoot = path.resolve(interviewContentDir, "..", "..", "..");
export const authoringPath = path.join(
  interviewContentDir,
  "authoring",
  "interview-coding-registry-v1.authoring.json",
);
export const artifactPinsPath = path.join(
  interviewContentDir,
  "interview-artifact-pins-v1.json",
);

const levels = Object.freeze(["junior", "mid", "senior"]);
const tracks = Object.freeze(["core-web", "react", "angular", "vue"]);
const expectedTimes = Object.freeze({ junior: 1500, mid: 2100, senior: 2700 });
const expectedRoundLimits = Object.freeze({ junior: 2, mid: 3, senior: 4 });
const forbiddenPublicKeys = new Set([
  "answer",
  "conceptId",
  "correctOptionId",
  "debrief",
  "hint",
  "private",
  "pressureAsset",
  "remediationTopics",
  "review",
  "rubric",
  "selectionDefinitionHash",
  "solution",
  "solutionAsset",
  "solutionBlock",
  "tests",
  "testImplementation",
  "frameworkTests",
]);

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function canonicalJson(value, pretty = false) {
  return `${JSON.stringify(canonicalize(value), null, pretty ? 2 : undefined)}${pretty ? "\n" : ""}`;
}

export function sha256(value) {
  const input = typeof value === "string" || Buffer.isBuffer(value)
    ? value
    : canonicalJson(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function loadInterviewArtifactPins() {
  return readJson(artifactPinsPath);
}

function validatePinnedValue(errors, label, actual, expected) {
  if (String(actual ?? "") !== String(expected ?? "")) {
    errors.push(`${label} does not match interview-artifact-pins-v1.json.`);
  }
}

function validatePinnedArtifactFiles(errors, label, artifacts, pin) {
  for (const kind of ["public", "private", "release"]) {
    const expected = String(pin?.artifactSha256?.[kind] || "").trim().toLowerCase();
    const text = artifacts?.[kind];
    if (!/^[a-f0-9]{64}$/.test(expected) || typeof text !== "string" || sha256(text) !== expected) {
      errors.push(
        `${label} ${kind} artifact SHA-256 does not match interview-artifact-pins-v1.json.`,
      );
    }
  }
}

export function validateInterviewArtifactPins({
  codingArtifacts,
  codingRelease,
  mcqArtifacts,
  mcqRelease,
  pins = loadInterviewArtifactPins(),
} = {}) {
  const errors = [];
  if (pins?.schemaVersion !== "1.0.0" || !String(pins?.releaseId || "").trim()) {
    errors.push("Interview artifact pin manifest identity is invalid.");
    return errors;
  }
  if (!String(pins.approvedBy || "").trim()
    || !/^\d{4}-\d{2}-\d{2}$/.test(String(pins.approvedAt || ""))) {
    errors.push("Interview artifact pin manifest approval is invalid.");
  }

  if (mcqRelease) {
    const pin = pins.mcq || {};
    validatePinnedValue(errors, "MCQ bankId", mcqRelease.bankId, pin.bankId);
    validatePinnedValue(errors, "MCQ bankVersion", mcqRelease.bankVersion, pin.bankVersion);
    validatePinnedValue(errors, "MCQ status", mcqRelease.status, pin.status);
    validatePinnedValue(errors, "MCQ contentHash", mcqRelease.contentHash, pin.bankContentHash);
    validatePinnedValue(
      errors,
      "MCQ approval approvedBy",
      mcqRelease.finalApproval?.approvedBy,
      pins.approvedBy,
    );
    validatePinnedValue(
      errors,
      "MCQ approval approvedAt",
      mcqRelease.finalApproval?.approvedAt,
      pins.approvedAt,
    );
    validatePinnedValue(
      errors,
      "MCQ approval selectionMetadataHash",
      mcqRelease.finalApproval?.selectionMetadataHash,
      pin.selectionMetadataHash,
    );
    if (["editorial-gold", "calibrated-gold"].includes(mcqRelease.status)) {
      validatePinnedArtifactFiles(errors, "MCQ", mcqArtifacts, pin);
    }
  }

  if (codingRelease) {
    const pin = pins.coding || {};
    validatePinnedValue(errors, "Coding registryId", codingRelease.registryId, pin.registryId);
    validatePinnedValue(
      errors,
      "Coding registryVersion",
      codingRelease.registryVersion,
      pin.registryVersion,
    );
    validatePinnedValue(errors, "Coding status", codingRelease.status, pin.status);
    validatePinnedValue(
      errors,
      "Coding registryContentHash",
      codingRelease.registryContentHash,
      pin.registryContentHash,
    );
    validatePinnedValue(
      errors,
      "Coding selectionDefinitionHash",
      codingRelease.selectionDefinitionHash,
      pin.selectionDefinitionHash,
    );
    validatePinnedValue(
      errors,
      "Coding definitionHash",
      codingRelease.definitionHash,
      pin.definitionHash,
    );
    validatePinnedValue(
      errors,
      "Coding approval approvedBy",
      codingRelease.finalApproval?.approvedBy,
      pins.approvedBy,
    );
    validatePinnedValue(
      errors,
      "Coding approval approvedAt",
      codingRelease.finalApproval?.approvedAt,
      pins.approvedAt,
    );
    if (["editorial-gold", "calibrated-gold"].includes(codingRelease.status)) {
      validatePinnedArtifactFiles(errors, "Coding", codingArtifacts, pin);
    }
  }
  return errors;
}

function runtimeAssetToFile(asset) {
  if (typeof asset !== "string" || !asset.startsWith("assets/")) {
    throw new Error(`Invalid runtime asset path: ${String(asset)}`);
  }
  const filePath = path.resolve(repoRoot, "cdn", asset.slice("assets/".length));
  const relative = path.relative(path.join(repoRoot, "cdn"), filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Runtime asset escapes cdn/: ${asset}`);
  }
  return filePath;
}

function pressureAssetToFile(asset) {
  const authoringPrefix = "authoring://pressure-modes/";
  if (!String(asset || "").startsWith(authoringPrefix)) {
    return runtimeAssetToFile(asset);
  }
  const root = path.join(interviewContentDir, "authoring", "pressure-modes");
  const filePath = path.resolve(root, asset.slice(authoringPrefix.length));
  const relative = path.relative(root, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Authoring pressure asset escapes pressure-modes/: ${asset}`);
  }
  return filePath;
}

function sourceDefinition(authoring) {
  return {
    schemaVersion: authoring.schemaVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    // Selection taxonomy is versioned and hashed independently so adding private-only
    // semantic metadata cannot mutate an already generated candidate artifact.
    variants: authoring.variants.map((variant) => Object.fromEntries(
      Object.entries(variant).filter(([key]) => key !== "conceptId"),
    )),
  };
}

export function definitionHash(authoring) {
  return sha256(sourceDefinition(authoring));
}

function codingSelectionRefs(authoring) {
  return authoring.variants
    .map((variant) => ({
      id: variant.id,
      conceptId: variant.conceptId,
      track: variant.track,
      level: variant.level,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function selectionDefinitionHash(authoring) {
  return sha256({
    schemaVersion: authoring.selectionMetadataVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    variants: codingSelectionRefs(authoring),
  });
}

export function buildCodingSelectionMetadata(authoring) {
  return {
    schemaVersion: authoring.selectionMetadataVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    selectionDefinitionHash: selectionDefinitionHash(authoring),
    variants: codingSelectionRefs(authoring),
  };
}

function loadCatalog(catalog, cache) {
  if (cache.has(catalog)) return cache.get(catalog);
  const catalogPath = path.join(repoRoot, "cdn", "questions", catalog, "coding.json");
  const entries = readJson(catalogPath);
  if (!Array.isArray(entries)) throw new Error(`${catalogPath} must contain an array.`);
  const loaded = { entries, catalogPath };
  cache.set(catalog, loaded);
  return loaded;
}

function assertPinnedSource(spec, question, catalogPath) {
  const actual = sha256(question);
  if (actual !== spec.expectedQuestionHash) {
    throw new Error(
      `${spec.id}: source question drifted in ${path.relative(repoRoot, catalogPath)}; `
      + `expected ${spec.expectedQuestionHash}, received ${actual}.`,
    );
  }
}

function descriptionSummary(question) {
  if (typeof question.description === "string") return question.description.trim();
  return String(question.description?.summary || "").trim();
}

function javascriptRequirements(question) {
  const description = question.description;
  const constraints = [];
  if (description && typeof description === "object") {
    for (const argument of description.arguments || []) {
      constraints.push(
        `Input ${argument.name} (${argument.type}): ${argument.desc}`,
      );
    }
    if (description.returns?.type || description.returns?.desc) {
      constraints.push(
        `Return ${description.returns?.type || "the documented result"}: ${description.returns?.desc || ""}`.trim(),
      );
    }
  }
  return [{
    id: "implementation-contract",
    title: question.title,
    prompt: descriptionSummary(question),
    constraints,
  }];
}

function javascriptModulePath(question) {
  const match = question.tests.match(/\bfrom\s+["']\.\/([^"']+)["']/);
  return `${match?.[1] || "index"}.js`;
}

function javascriptChecks(question, spec) {
  const names = [...question.tests.matchAll(/\b(?:test|it)\s*\(\s*(["'`])([^\n]+?)\1\s*,/g)]
    .map((match) => match[2]);
  if (!names.length || new Set(names).size !== names.length) {
    throw new Error(`${spec.id}: JavaScript test names must be present and unique.`);
  }
  const byName = new Map(names.map((name) => [
    name,
    {
      id: `js-check-${sha256(`${question.id}:${name}`).slice(0, 12)}`,
      name,
    },
  ]));
  const assigned = new Set();
  const groups = spec.rubric.map(({ checkNames = [], ...group }) => {
    const checks = checkNames.map((name) => {
      const check = byName.get(name);
      if (!check) throw new Error(`${spec.id}/${group.id}: unknown JavaScript check "${name}".`);
      if (assigned.has(name)) {
        throw new Error(`${spec.id}: JavaScript check "${name}" is assigned more than once.`);
      }
      assigned.add(name);
      return check;
    });
    return {
      ...group,
      checkIds: checks.map((check) => check.id),
      checkContractHash: sha256({
        tests: question.tests,
        testsTs: question.testsTs || null,
        checkNames,
      }),
    };
  });
  const unassigned = names.filter((name) => !assigned.has(name));
  if (unassigned.length) {
    throw new Error(`${spec.id}: unassigned JavaScript checks: ${unassigned.join(", ")}.`);
  }
  return { checks: [...byName.values()], groups };
}

function frameworkContext(spec, question) {
  const starterAsset = question.sdk?.asset;
  const pressureAsset = spec.pressureAsset || question.pressureModeAsset;
  if (!starterAsset || !pressureAsset) {
    throw new Error(
      `${spec.id}: framework source must declare sdk.asset and a catalog or authoring pressure asset.`,
    );
  }

  const starterFile = runtimeAssetToFile(starterAsset);
  const pressureFile = pressureAssetToFile(pressureAsset);
  const starter = readJson(starterFile);
  const pressure = readJson(pressureFile);
  const starterHash = sha256(starter);
  const pressureHash = sha256(pressure);
  if (starterHash !== spec.expectedStarterAssetHash) {
    throw new Error(
      `${spec.id}: starter asset drifted; expected ${spec.expectedStarterAssetHash}, received ${starterHash}.`,
    );
  }
  if (pressureHash !== spec.expectedPressureAssetHash) {
    throw new Error(
      `${spec.id}: pressure asset drifted; expected ${spec.expectedPressureAssetHash}, received ${pressureHash}.`,
    );
  }
  if (pressure.supportedQuestions?.[spec.track] !== spec.sourceQuestionId) {
    throw new Error(`${spec.id}: pressure scenario does not support its source question.`);
  }
  if (!Array.isArray(pressure.rounds) || pressure.rounds.length < spec.roundLimit) {
    throw new Error(`${spec.id}: pressure scenario has fewer than ${spec.roundLimit} rounds.`);
  }
  const starterFiles = Object.entries(starter.files || {})
    .map(([filePathRaw, rawContent]) => {
      const filePath = String(filePathRaw || "").replace(/^\/+/, "");
      let content = typeof rawContent === "string"
        ? rawContent
        : String(rawContent?.code || "");
      if (
        !filePath
        || filePath.split("/").some((part) => !part || part === "." || part === "..")
      ) {
        throw new Error(`${spec.id}: starter asset contains an invalid public file.`);
      }
      if (filePath === "src/main.ts" && content && !/zone\.js/.test(content)) {
        content = `import 'zone.js';\n${content}`;
      }
      return { path: filePath, content };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
  if (new Set(starterFiles.map((file) => file.path)).size !== starterFiles.length) {
    throw new Error(`${spec.id}: starter asset contains duplicate public file paths.`);
  }
  if (!starterFiles.length) {
    throw new Error(`${spec.id}: starter asset does not contain public files.`);
  }
  const rounds = pressure.rounds.slice(0, spec.roundLimit);
  if (new Set(rounds.map((round) => round.id)).size !== rounds.length) {
    throw new Error(`${spec.id}: framework round IDs must be unique.`);
  }
  const frameworkCheckIds = new Set();
  for (const round of rounds) {
    if (!round.id || !round.title || !round.interviewerPrompt) {
      throw new Error(`${spec.id}: framework round identity or prompt is missing.`);
    }
    if (!Array.isArray(round.constraints) || !round.constraints.length
      || round.constraints.some((constraint) => !String(constraint || "").trim())) {
      throw new Error(`${spec.id}/${round.id}: public constraints are missing.`);
    }
    if (!Array.isArray(round.frameworkTests) || !round.frameworkTests.length) {
      throw new Error(`${spec.id}/${round.id}: framework check contract is missing.`);
    }
    for (const check of round.frameworkTests) {
      if (!check?.id || !check?.name || !Array.isArray(check.steps) || !check.steps.length) {
        throw new Error(`${spec.id}/${round.id}: framework check is incomplete.`);
      }
      if (frameworkCheckIds.has(check.id)) {
        throw new Error(`${spec.id}: framework check IDs must be unique across selected rounds.`);
      }
      frameworkCheckIds.add(check.id);
      if (check.steps.some((step) => !step || typeof step !== "object" || !step.type)) {
        throw new Error(`${spec.id}/${round.id}/${check.id}: framework check step is invalid.`);
      }
    }
  }
  return {
    starterAsset,
    starterFile,
    starter,
    starterFiles,
    starterHash,
    pressureAsset,
    pressureFile,
    pressure,
    pressureHash,
    rounds,
  };
}

function reviewForVariant(authoring, spec, hash) {
  const batch = authoring.reviewBatch;
  const seniorReview = spec.level === "senior"
    ? batch.seniorLevelReviews.find((entry) => entry.variantId === spec.id)
    : null;
  const levelReview = seniorReview || {
    variantId: spec.id,
    reviewer: "codex-interview-coding-level-v1",
    reviewerType: "ai",
    status: "passed",
    notes: [
      `${spec.level} time and requirement scope match the approved V1 level matrix.`,
    ],
  };
  return {
    contentHash: hash,
    reviewedRevision: spec.revision,
    reviewedAt: batch.reviewedAt,
    definitionHash: batch.reviewedDefinitionHash,
    technical: batch.technical,
    editorial: batch.editorial,
    level: levelReview,
  };
}

function isPassed(review) {
  return review.technical?.status === "passed"
    && review.editorial?.status === "passed"
    && review.level?.status === "passed";
}

function buildVariant(authoring, spec, catalogCache) {
  const { entries, catalogPath } = loadCatalog(spec.catalog, catalogCache);
  const matches = entries.filter((entry) => entry?.id === spec.sourceQuestionId);
  if (matches.length !== 1) {
    throw new Error(
      `${spec.id}: expected one top-level source question ${spec.sourceQuestionId}, found ${matches.length}.`,
    );
  }
  const question = matches[0];
  assertPinnedSource(spec, question, catalogPath);
  if (!question.updatedAt || !question.title || !descriptionSummary(question)) {
    throw new Error(`${spec.id}: source question lacks version, title, or prompt metadata.`);
  }

  const commonPublic = {
    id: spec.id,
    revision: spec.revision,
    track: spec.track,
    level: spec.level,
    sourceQuestionId: spec.sourceQuestionId,
    sourceContentVersion: question.updatedAt,
    title: question.title,
    prompt: descriptionSummary(question),
    runner: spec.runner,
    timeLimitSeconds: spec.timeLimitSeconds,
    roundLimit: spec.roundLimit,
  };

  let publicContent;
  let privateContent;
  if (spec.track === "core-web") {
    if (typeof question.starterCode !== "string" || !question.starterCode.trim()) {
      throw new Error(`${spec.id}: JavaScript starterCode is missing.`);
    }
    if (typeof question.tests !== "string" || !question.tests.trim()) {
      throw new Error(`${spec.id}: JavaScript check contract is missing.`);
    }
    const javascriptCheckContract = javascriptChecks(question, spec);
    publicContent = {
      ...commonPublic,
      starterAsset: `catalog://cdn/questions/javascript/coding.json#${question.id}.starterCode`,
      starterFiles: [{
        path: javascriptModulePath(question),
        content: question.starterCode,
      }],
      publicRequirements: javascriptRequirements(question),
    };
    privateContent = {
      rubric: {
        groups: javascriptCheckContract.groups,
      },
      remediationTopics: spec.remediationTopics,
      runnerConfig: {
        kind: "javascript",
        language: "javascript",
        checks: javascriptCheckContract.checks,
        tests: question.tests,
        ...(typeof question.testsTs === "string" && question.testsTs.trim()
          ? { testsTs: question.testsTs }
          : {}),
      },
      sourceEvidence: {
        catalogFile: path.relative(repoRoot, catalogPath),
        catalogAccess: question.access,
        sourceQuestionHash: spec.expectedQuestionHash,
        starterContentHash: sha256(question.starterCode),
        checkContractHash: sha256(question.tests),
      },
    };
  } else {
    const context = frameworkContext(spec, question);
    publicContent = {
      ...commonPublic,
      starterAsset: context.starterAsset,
      starterFiles: context.starterFiles,
      publicRequirements: context.rounds.map((round) => ({
        id: round.id,
        title: round.title,
        prompt: round.interviewerPrompt,
        constraints: round.constraints,
      })),
    };
    privateContent = {
      rubric: {
        groups: context.rounds.map((round) => ({
          id: round.id,
          title: round.title,
          criteria: round.constraints,
          checkIds: round.frameworkTests.map((check) => check.id),
          checkContractHash: sha256(round.frameworkTests),
        })),
      },
      remediationTopics: spec.remediationTopics,
      runnerConfig: {
        kind: "framework-preview",
        framework: spec.track,
        groups: context.rounds.map((round) => ({
          id: round.id,
          title: round.title,
          checks: round.frameworkTests,
        })),
      },
      sourceEvidence: {
        catalogFile: path.relative(repoRoot, catalogPath),
        catalogAccess: question.access,
        sourceQuestionHash: spec.expectedQuestionHash,
        starterAsset: context.starterAsset,
        starterAssetHash: context.starterHash,
        pressureAsset: context.pressureAsset,
        pressureAssetHash: context.pressureHash,
        selectedCheckContractHash: sha256(
          context.rounds.map((round) => round.frameworkTests),
        ),
      },
    };
  }

  const hash = sha256({
    schemaVersion: authoring.schemaVersion,
    id: spec.id,
    revision: spec.revision,
    public: publicContent,
    private: privateContent,
  });
  const review = reviewForVariant(authoring, spec, hash);
  const enabled = isPassed(review);
  return {
    public: { ...publicContent, contentHash: hash, enabled },
    private: {
      id: spec.id,
      revision: spec.revision,
      conceptId: spec.conceptId,
      contentHash: hash,
      ...privateContent,
      review,
    },
  };
}

export function buildInterviewContent() {
  const authoring = readJson(authoringPath);
  const computedDefinitionHash = definitionHash(authoring);
  if (authoring.definitionHash !== computedDefinitionHash) {
    throw new Error(
      `Coding registry definitionHash is stale; expected ${computedDefinitionHash}, `
      + `received ${authoring.definitionHash}.`,
    );
  }
  if (authoring.reviewBatch.reviewedDefinitionHash !== computedDefinitionHash) {
    throw new Error("Coding registry review batch is not bound to the current definitionHash.");
  }
  const computedSelectionDefinitionHash = selectionDefinitionHash(authoring);
  if (authoring.selectionDefinitionHash !== computedSelectionDefinitionHash) {
    throw new Error(
      `Coding registry selectionDefinitionHash is stale; expected `
      + `${computedSelectionDefinitionHash}, received ${authoring.selectionDefinitionHash}.`,
    );
  }

  const catalogCache = new Map();
  const built = authoring.variants.map((spec) => buildVariant(authoring, spec, catalogCache));
  const publicVariants = built.map((entry) => entry.public).sort((a, b) => a.id.localeCompare(b.id));
  const privateVariants = built.map((entry) => entry.private).sort((a, b) => a.id.localeCompare(b.id));
  const variantRefs = publicVariants.map(({ id, revision, contentHash, enabled }) => ({
    id,
    revision,
    contentHash,
    enabled,
  }));
  const registryContentHash = sha256(variantRefs.map(({ id, revision, contentHash }) => ({
    id,
    revision,
    contentHash,
  })));
  const publicPackage = {
    schemaVersion: authoring.schemaVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    status: authoring.status,
    variants: publicVariants,
  };
  const privatePackage = {
    schemaVersion: authoring.schemaVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    status: authoring.status,
    finalApproval: authoring.finalApproval,
    definitionHash: computedDefinitionHash,
    selectionDefinitionHash: computedSelectionDefinitionHash,
    variants: privateVariants,
  };
  const publicText = canonicalJson(publicPackage, true);
  const privateText = canonicalJson(privatePackage, true);
  const release = {
    schemaVersion: authoring.schemaVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    status: authoring.status,
    finalApproval: authoring.finalApproval,
    definitionHash: computedDefinitionHash,
    selectionDefinitionHash: computedSelectionDefinitionHash,
    variantCount: variantRefs.length,
    enabledVariantCount: variantRefs.filter((entry) => entry.enabled).length,
    contentHash: registryContentHash,
    registryContentHash,
    variantRefs,
    artifacts: {
      public: {
        file: "interview-coding-registry-v1.public.json",
        sha256: sha256(publicText),
      },
      private: {
        file: "interview-coding-registry-v1.private.json",
        sha256: sha256(privateText),
      },
    },
  };
  return {
    authoring,
    selectionMetadata: buildCodingSelectionMetadata(authoring),
    publicPackage,
    privatePackage,
    release,
    files: {
      "interview-coding-registry-v1.public.json": publicText,
      "interview-coding-registry-v1.private.json": privateText,
      "interview-coding-registry-v1.release.json": canonicalJson(release, true),
    },
  };
}

export function codingReleaseReadinessReport(
  built,
  { minimumVariantsPerCombination = 5 } = {},
) {
  const conceptsById = new Map(
    built.authoring.variants.map((variant) => [variant.id, variant.conceptId]),
  );
  const matrix = [];
  const errors = [];
  for (const track of tracks) {
    for (const level of levels) {
      const variants = built.publicPackage.variants.filter(
        (variant) => variant.track === track && variant.level === level,
      );
      const enabled = variants.filter((variant) => variant.enabled);
      const distinctConceptCount = new Set(
        enabled.map((variant) => conceptsById.get(variant.id)).filter(Boolean),
      ).size;
      const entry = {
        track,
        level,
        requiredVariantCount: minimumVariantsPerCombination,
        variantCount: variants.length,
        enabledVariantCount: enabled.length,
        distinctConceptCount,
        minimumNetNewVariants: Math.max(
          0,
          minimumVariantsPerCombination - Math.min(enabled.length, distinctConceptCount),
        ),
      };
      entry.ready = entry.enabledVariantCount >= minimumVariantsPerCombination
        && entry.distinctConceptCount >= minimumVariantsPerCombination;
      matrix.push(entry);
      if (!entry.ready) {
        errors.push(
          `${track}/${level}: coding release gate requires at least `
          + `${minimumVariantsPerCombination} enabled variants with `
          + `${minimumVariantsPerCombination} distinct conceptIds; received `
          + `${entry.enabledVariantCount} enabled and ${entry.distinctConceptCount} concepts `
          + `(minimum ${entry.minimumNetNewVariants} net-new variants).`,
        );
      }
    }
  }
  return { ready: errors.length === 0, errors, matrix };
}

function walkKeys(value, pathParts = [], findings = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkKeys(entry, [...pathParts, String(index)], findings));
    return findings;
  }
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenPublicKeys.has(key)) findings.push([...pathParts, key].join("."));
    walkKeys(child, [...pathParts, key], findings);
  }
  return findings;
}

export function validateBuiltInterviewContent(built) {
  const errors = [];
  const {
    authoring,
    selectionMetadata,
    publicPackage,
    privatePackage,
    release,
  } = built;
  const ids = publicPackage.variants.map((variant) => variant.id);
  if (!ids.length || new Set(ids).size !== ids.length) {
    errors.push(`Registry variant IDs must be present and unique; received ${ids.length}.`);
  }
  for (const track of tracks) {
    for (const level of levels) {
      const matches = publicPackage.variants.filter(
        (variant) => variant.track === track && variant.level === level,
      );
      if (!matches.length) {
        errors.push(`${track}/${level} must contain at least one candidate variant.`);
      }
    }
  }
  const conceptPattern = /^coding-[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const authoringById = new Map(authoring.variants.map((variant) => [variant.id, variant]));
  for (const variant of authoring.variants) {
    if (!conceptPattern.test(String(variant.conceptId || ""))) {
      errors.push(`${variant.id}: missing or invalid private conceptId.`);
    }
  }
  const conceptGroups = new Map();
  for (const variant of authoring.variants) {
    const group = conceptGroups.get(variant.conceptId) || [];
    group.push(variant);
    conceptGroups.set(variant.conceptId, group);
  }
  for (const [conceptId, variants] of conceptGroups) {
    if (!conceptId) continue;
    const levelsForConcept = new Set(variants.map((variant) => variant.level));
    if (levelsForConcept.size > 1) {
      errors.push(`${conceptId}: conceptId collision spans multiple levels.`);
    }
    const combinationKeys = variants.map((variant) => `${variant.track}/${variant.level}`);
    if (new Set(combinationKeys).size !== combinationKeys.length) {
      errors.push(`${conceptId}: conceptId collision repeats within a track/level combination.`);
    }
  }
  if (selectionMetadata?.schemaVersion !== authoring.selectionMetadataVersion
    || selectionMetadata?.selectionDefinitionHash !== authoring.selectionDefinitionHash) {
    errors.push("Coding private selection metadata is absent or stale.");
  }
  if (privatePackage.selectionDefinitionHash !== authoring.selectionDefinitionHash
    || release.selectionDefinitionHash !== authoring.selectionDefinitionHash) {
    errors.push("Coding artifacts do not pin the private selectionDefinitionHash.");
  }
  const selectionById = new Map(
    (selectionMetadata?.variants || []).map((variant) => [variant.id, variant]),
  );
  for (const variant of publicPackage.variants) {
    const authoringVariant = authoringById.get(variant.id);
    const selectionVariant = selectionById.get(variant.id);
    if (!authoringVariant || !selectionVariant
      || selectionVariant.conceptId !== authoringVariant.conceptId
      || selectionVariant.track !== variant.track
      || selectionVariant.level !== variant.level) {
      errors.push(`${variant.id}: private selection metadata does not match authoring.`);
    }
  }
  for (const variant of publicPackage.variants) {
    if (variant.timeLimitSeconds !== expectedTimes[variant.level]) {
      errors.push(`${variant.id}: unexpected time limit ${variant.timeLimitSeconds}.`);
    }
    const expectedRounds = variant.track === "core-web" ? 1 : expectedRoundLimits[variant.level];
    if (variant.roundLimit !== expectedRounds) {
      errors.push(`${variant.id}: expected ${expectedRounds} round(s), received ${variant.roundLimit}.`);
    }
    if (variant.publicRequirements.length !== expectedRounds) {
      errors.push(`${variant.id}: public requirement groups do not match roundLimit.`);
    }
    if (!variant.enabled) errors.push(`${variant.id}: review-complete V1 variant must be enabled.`);
    if (variant.level === "senior" && variant.track !== "core-web") {
      const review = authoring.reviewBatch.seniorLevelReviews.find(
        (entry) => entry.variantId === variant.id,
      );
      if (!review || review.status !== "passed") {
        errors.push(`${variant.id}: senior framework variant lacks a passed level review.`);
      }
    }
  }
  const publicLeakPaths = walkKeys(publicPackage);
  if (publicLeakPaths.length) {
    errors.push(`Public coding registry leaked private keys: ${publicLeakPaths.join(", ")}.`);
  }
  const privateSerialized = JSON.stringify(privatePackage);
  for (const forbidden of ["solutionBlock", "solutionAsset", "\"debrief\"", "\"hint\""]) {
    if (privateSerialized.includes(forbidden)) {
      errors.push(`Private registry must not embed ${forbidden}.`);
    }
  }
  const privateById = new Map(privatePackage.variants.map((variant) => [variant.id, variant]));
  for (const variant of publicPackage.variants) {
    const privateVariant = privateById.get(variant.id);
    if (!privateVariant
      || privateVariant.revision !== variant.revision
      || privateVariant.contentHash !== variant.contentHash
      || privateVariant.conceptId !== authoringById.get(variant.id)?.conceptId) {
      errors.push(`${variant.id}: public/private revision, contentHash, or conceptId mismatch.`);
    }
    const rubricCheckIds = new Set(
      privateVariant?.rubric?.groups?.flatMap((group) => group.checkIds || []) || [],
    );
    const runnerCheckIds = new Set(
      privateVariant?.runnerConfig?.kind === "framework-preview"
        ? privateVariant.runnerConfig.groups.flatMap(
          (group) => group.checks.map((check) => check.id),
        )
        : (privateVariant?.runnerConfig?.checks || []).map((check) => check.id),
    );
    for (const checkId of rubricCheckIds) {
      if (!runnerCheckIds.has(checkId)) {
        errors.push(`${variant.id}: rubric check ${checkId} is absent from runnerConfig.`);
      }
    }
    if (!runnerCheckIds.size) errors.push(`${variant.id}: runnerConfig has no executable checks.`);
  }
  const enabledCount = publicPackage.variants.filter((variant) => variant.enabled).length;
  if (release.variantCount !== ids.length || release.enabledVariantCount !== enabledCount) {
    errors.push("Release counts must match the generated variants.");
  }
  if (release.registryContentHash !== release.contentHash) {
    errors.push("release.registryContentHash must equal release.contentHash.");
  }
  if (authoring.status === "candidate" && authoring.finalApproval !== null) {
    errors.push("Candidate coding registry finalApproval must be null.");
  }
  if (authoring.status !== "candidate") {
    errors.push(...codingReleaseReadinessReport(built).errors);
    const approval = authoring.finalApproval;
    if (!approval
      || approval.registryVersion !== authoring.registryVersion
      || approval.registryContentHash !== release.registryContentHash
      || approval.selectionDefinitionHash !== authoring.selectionDefinitionHash) {
      errors.push(
        "Gold coding registry approval must bind registryVersion, registryContentHash, "
        + "and selectionDefinitionHash.",
      );
    }
  }
  errors.push(...validateInterviewArtifactPins({
    codingRelease: release,
    codingArtifacts: {
      public: built.files["interview-coding-registry-v1.public.json"],
      private: built.files["interview-coding-registry-v1.private.json"],
      release: built.files["interview-coding-registry-v1.release.json"],
    },
  }));
  return errors;
}

export function syncFiles(files, outputDir, check) {
  const mismatches = [];
  for (const [name, text] of Object.entries(files)) {
    const filePath = path.join(outputDir, name);
    if (check) {
      if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== text) {
        mismatches.push(filePath);
      }
      continue;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, text, "utf8");
    fs.renameSync(temporary, filePath);
  }
  return mismatches;
}

export function mcqSourceFiles() {
  const sourceDir = path.join(repoRoot, "content-drafts", "interview-mcq", "generated");
  const names = [
    "frontend-interview-bank-v1.public.json",
    "frontend-interview-bank-v1.private.json",
    "frontend-interview-bank-v1.release.json",
  ];
  return Object.fromEntries(
    names.map((name) => [name, fs.readFileSync(path.join(sourceDir, name), "utf8")]),
  );
}

export function validateMcqRuntimeCopies(checkFiles = true) {
  const errors = [];
  const sourceFiles = mcqSourceFiles();
  const sourceRelease = JSON.parse(sourceFiles["frontend-interview-bank-v1.release.json"]);
  if (!["editorial-gold", "calibrated-gold"].includes(sourceRelease.status)) {
    errors.push(`MCQ source release is not gold: ${sourceRelease.status}.`);
  }
  errors.push(...validateInterviewArtifactPins({
    mcqRelease: sourceRelease,
    mcqArtifacts: {
      public: sourceFiles["frontend-interview-bank-v1.public.json"],
      private: sourceFiles["frontend-interview-bank-v1.private.json"],
      release: sourceFiles["frontend-interview-bank-v1.release.json"],
    },
  }));
  if (sourceRelease.finalApproval?.approvedBy !== "project-owner"
    || sourceRelease.finalApproval?.bankContentHash !== sourceRelease.contentHash) {
    errors.push("MCQ source approval is absent or stale.");
  }
  const publicPackage = JSON.parse(sourceFiles["frontend-interview-bank-v1.public.json"]);
  const privatePackage = JSON.parse(sourceFiles["frontend-interview-bank-v1.private.json"]);
  const leaks = walkKeys(publicPackage);
  if (leaks.length) errors.push(`MCQ public package leaked private keys: ${leaks.join(", ")}.`);
  const privateByKey = new Map(
    (privatePackage.items || []).map((item) => [`${item.id}@${item.revision}`, item]),
  );
  const selectionItems = [];
  for (const item of publicPackage.items || []) {
    const privateItem = privateByKey.get(`${item.id}@${item.revision}`);
    if (!privateItem?.conceptId) {
      errors.push(`MCQ private selection metadata is missing for ${item.id}@${item.revision}.`);
      continue;
    }
    selectionItems.push({
      id: item.id,
      revision: item.revision,
      conceptId: privateItem.conceptId,
      technology: item.technology,
      level: item.level,
      difficultyBand: item.difficultyBand,
      format: item.format,
      estimatedSeconds: item.estimatedSeconds,
    });
  }
  const computedSelectionMetadataHash = sha256(
    selectionItems.sort((left, right) => left.id.localeCompare(right.id)),
  );
  if (computedSelectionMetadataHash
    !== loadInterviewArtifactPins().mcq.selectionMetadataHash) {
    errors.push("MCQ selection metadata does not match interview-artifact-pins-v1.json.");
  }
  for (const kind of ["public", "private"]) {
    const file = sourceRelease.artifacts[kind].file;
    if (sha256(sourceFiles[file]) !== sourceRelease.artifacts[kind].sha256) {
      errors.push(`MCQ ${kind} artifact SHA-256 does not match its release.`);
    }
  }
  if (checkFiles) {
    for (const [name, sourceText] of Object.entries(sourceFiles)) {
      const runtimePath = path.join(interviewContentDir, name);
      if (!fs.existsSync(runtimePath) || fs.readFileSync(runtimePath, "utf8") !== sourceText) {
        errors.push(`Backend MCQ artifact is stale or missing: ${name}.`);
      }
    }
  }
  return errors;
}
