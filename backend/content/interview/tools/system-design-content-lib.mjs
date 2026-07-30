import fs from "node:fs";
import path from "node:path";
import {
  canonicalJson,
  readJson,
  repoRoot,
  sha256,
} from "./interview-content-lib.mjs";

export const systemDesignAuthoringPath = path.join(
  repoRoot,
  "backend",
  "content",
  "interview",
  "authoring",
  "interview-system-design-registry-v1.authoring.json",
);

const systemDesignArtifactNames = Object.freeze({
  public: "interview-system-design-registry-v1.public.json",
  private: "interview-system-design-registry-v1.private.json",
  release: "interview-system-design-registry-v1.release.json",
});
const expectedScenarios = Object.freeze({
  "int-sd-toast-lifecycle-jr-v1": { level: "junior", timeLimitSeconds: 600 },
  "int-sd-autocomplete-race-mid-v1": { level: "mid", timeLimitSeconds: 900 },
  "int-sd-ai-chat-composer-mid-v1": { level: "mid", timeLimitSeconds: 900 },
  "int-sd-ranked-feed-sr-v1": { level: "senior", timeLimitSeconds: 1200 },
});
const expectedScenarioCount = Object.keys(expectedScenarios).length;
const expectedAxisIds = Object.freeze([
  "requirement-discovery",
  "architecture-ownership",
  "data-interface-contracts",
  "resilience-performance",
  "accessibility-product-ux",
  "adaptation-tradeoffs",
]);
const expectedLaneIds = Object.freeze(["ui", "state", "data", "external"]);
const expectedStepIds = Object.freeze([
  "clarifications",
  "requirements",
  "architecture",
  "decisions",
  "twist",
]);
const tracks = Object.freeze(["core-web", "react", "angular", "vue"]);
const sourceFiles = Object.freeze([
  "meta.json",
  "requirements.json",
  "architecture.json",
  "data.json",
  "interfaces.json",
  "optimizations.json",
]);
const forbiddenPublicKeys = new Set([
  "allowedLaneIds",
  "clarificationAnswers",
  "contradictions",
  "finalApproval",
  "provenance",
  "remediationTopics",
  "responseActions",
  "review",
  "rubric",
  "rule",
  "sourceContentId",
  "sourceEvidence",
  "twist",
  "validationFixtures",
]);
const forbiddenChoiceAbsolutePattern = /\b(?:always|every|never|unlimited|whatever|whenever)\b/i;
const maxChoiceLengthDeviation = 0.25;
const compositeOperators = new Set(["allOf", "anyOf", "not", "when"]);
const predicates = new Set([
  "clarificationSelected",
  "requirementPrioritized",
  "cardInLane",
  "connectionExists",
  "decisionSelected",
  "rationaleSelected",
  "twistActionSelected",
  "changedFromBaseline",
]);
const changedTargets = new Set(["placement", "connections", "decision"]);

function sourceDefinition(authoring) {
  return {
    schemaVersion: authoring.schemaVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    defaults: authoring.defaults,
    scenarios: authoring.scenarios,
  };
}

export function systemDesignDefinitionHash(authoring) {
  return sha256(sourceDefinition(authoring));
}

export function loadSystemDesignSourceEvidence(spec) {
  const sourceContentId = spec.private.sourceContentId;
  const sourceDir = path.join(
    repoRoot,
    "cdn",
    "questions",
    "system-design",
    sourceContentId,
  );
  const files = sourceFiles.map((name) => {
    const filePath = path.join(sourceDir, name);
    if (!fs.existsSync(filePath)) {
      throw new Error(`${spec.id}: missing pinned source ${path.relative(repoRoot, filePath)}.`);
    }
    const parsed = readJson(filePath);
    return {
      file: path.relative(repoRoot, filePath),
      sha256: sha256(parsed),
      parsed,
    };
  });
  const meta = files.find((entry) => entry.file.endsWith("/meta.json"))?.parsed;
  if (meta?.id !== sourceContentId || !meta?.updatedAt) {
    throw new Error(`${spec.id}: source metadata ID or updatedAt is invalid.`);
  }
  const publicFiles = files.map(({ file, sha256: fileHash }) => ({
    file,
    sha256: fileHash,
  }));
  const bundleHash = sha256({ sourceContentId, files: publicFiles });
  if (bundleHash !== spec.private.expectedSourceBundleHash) {
    throw new Error(
      `${spec.id}: source bundle drifted; expected `
      + `${spec.private.expectedSourceBundleHash}, received ${bundleHash}.`,
    );
  }
  return {
    sourceContentId,
    sourceUpdatedAt: meta.updatedAt,
    files: publicFiles,
    bundleHash,
  };
}

function reviewForScenario(authoring, spec, contentHash) {
  const batch = authoring.reviewBatch;
  return {
    contentHash,
    reviewedRevision: spec.revision,
    reviewedAt: batch.reviewedAt,
    definitionHash: batch.reviewedDefinitionHash,
    technical: batch.technical,
    blind: batch.blind,
    editorial: batch.editorial,
  };
}

function reviewPassed(review) {
  return review.technical?.status === "passed"
    && review.blind?.status === "passed"
    && review.editorial?.status === "passed";
}

function buildScenario(authoring, spec) {
  const sourceEvidence = loadSystemDesignSourceEvidence(spec);
  const publicSpec = {
    ...authoring.defaults,
    ...spec.public,
  };
  const publicContent = {
    id: spec.id,
    revision: spec.revision,
    level: spec.level,
    title: publicSpec.title,
    prompt: publicSpec.prompt,
    timeLimitSeconds: spec.timeLimitSeconds,
    steps: publicSpec.steps,
    selectionLimits: publicSpec.selectionLimits,
    lanes: publicSpec.lanes,
    clarifications: publicSpec.clarifications,
    requirements: publicSpec.requirements,
    cards: publicSpec.cards,
    connectionTypes: publicSpec.connectionTypes,
    decisions: publicSpec.decisions,
    frameworkLenses: publicSpec.frameworkLenses,
  };
  const privateContent = {
    clarificationAnswers: spec.private.clarificationAnswers,
    twist: spec.private.twist,
    rubric: spec.private.rubric,
    validationFixtures: spec.private.validationFixtures,
    provenance: spec.private.provenance,
    sourceEvidence,
  };
  const contentHash = sha256({
    schemaVersion: authoring.schemaVersion,
    id: spec.id,
    revision: spec.revision,
    public: publicContent,
    private: privateContent,
  });
  const review = reviewForScenario(authoring, spec, contentHash);
  const enabled = reviewPassed(review);
  return {
    public: { ...publicContent, contentHash, enabled },
    private: {
      id: spec.id,
      revision: spec.revision,
      contentHash,
      ...privateContent,
      review,
    },
  };
}

export function buildSystemDesignContent() {
  const authoring = readJson(systemDesignAuthoringPath);
  const computedDefinitionHash = systemDesignDefinitionHash(authoring);
  if (authoring.definitionHash !== computedDefinitionHash) {
    throw new Error(
      `System-design registry definitionHash is stale; expected ${computedDefinitionHash}, `
      + `received ${authoring.definitionHash}.`,
    );
  }
  if (authoring.reviewBatch.reviewedDefinitionHash !== computedDefinitionHash) {
    throw new Error(
      "System-design registry review batch is not bound to the current definitionHash.",
    );
  }

  const built = authoring.scenarios.map((spec) => buildScenario(authoring, spec));
  const publicScenarios = built
    .map((entry) => entry.public)
    .sort((left, right) => left.id.localeCompare(right.id));
  const privateScenarios = built
    .map((entry) => entry.private)
    .sort((left, right) => left.id.localeCompare(right.id));
  const privateById = new Map(privateScenarios.map((entry) => [entry.id, entry]));
  const scenarioRefs = publicScenarios.map((scenario) => ({
    id: scenario.id,
    revision: scenario.revision,
    level: scenario.level,
    contentHash: scenario.contentHash,
    enabled: scenario.enabled,
    sourceBundleHash: privateById.get(scenario.id).sourceEvidence.bundleHash,
  }));
  const registryContentHash = sha256(
    scenarioRefs.map(({
      id,
      revision,
      level,
      contentHash,
      sourceBundleHash,
    }) => ({
      id,
      revision,
      level,
      contentHash,
      sourceBundleHash,
    })),
  );
  const publicPackage = {
    schemaVersion: authoring.schemaVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    status: authoring.status,
    scenarios: publicScenarios,
  };
  const privatePackage = {
    schemaVersion: authoring.schemaVersion,
    registryId: authoring.registryId,
    registryVersion: authoring.registryVersion,
    status: authoring.status,
    finalApproval: authoring.finalApproval,
    definitionHash: computedDefinitionHash,
    scenarios: privateScenarios,
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
    scenarioCount: scenarioRefs.length,
    enabledScenarioCount: scenarioRefs.filter((entry) => entry.enabled).length,
    contentHash: registryContentHash,
    registryContentHash,
    scenarioRefs,
    artifacts: {
      public: {
        file: systemDesignArtifactNames.public,
        sha256: sha256(publicText),
      },
      private: {
        file: systemDesignArtifactNames.private,
        sha256: sha256(privateText),
      },
    },
  };
  return {
    authoring,
    publicPackage,
    privatePackage,
    release,
    files: {
      [systemDesignArtifactNames.public]: publicText,
      [systemDesignArtifactNames.private]: privateText,
      [systemDesignArtifactNames.release]: canonicalJson(release, true),
    },
  };
}

function collectLeakPaths(value, pathParts = [], findings = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectLeakPaths(entry, [...pathParts, String(index)], findings);
    });
    return findings;
  }
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenPublicKeys.has(key)) findings.push([...pathParts, key].join("."));
    collectLeakPaths(child, [...pathParts, key], findings);
  }
  return findings;
}

function uniqueIds(entries) {
  const ids = (entries || []).map((entry) => entry?.id);
  return ids.length === new Set(ids).size && ids.every(Boolean);
}

function choiceWordCount(entry) {
  return `${String(entry?.label || "")} ${String(entry?.description || "")}`
    .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length || 0;
}

function validateChoiceQuality(entries, location, errors) {
  const counts = entries.map(choiceWordCount);
  const sorted = [...counts].sort((left, right) => left - right);
  const median = sorted[Math.floor(sorted.length / 2)] || 0;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const text = `${String(entry?.label || "")} ${String(entry?.description || "")}`.trim();
    if (forbiddenChoiceAbsolutePattern.test(text)) {
      errors.push(
        `${location}[${index}]: choice wording contains an avoidable absolute-language clue.`,
      );
    }
    if (
      median > 0
      && Math.abs(counts[index] - median) / median > maxChoiceLengthDeviation
    ) {
      errors.push(
        `${location}[${index}]: choice length differs from its peer median by more than 25%.`,
      );
    }
  }
}

function fourWordSignatures(value) {
  const words = String(value || "")
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .match(/[\p{L}\p{N}]+/gu) || [];
  return words.slice(0, -3).map((_, index) => (
    words.slice(index, index + 4).join(" ")
  ));
}

function validateClarificationChoiceOverlap(
  clarificationAnswers,
  decisions,
  location,
  errors,
) {
  const choices = decisions.flatMap((decision) => (
    [...decision.options, ...decision.rationales].map((entry) => ({
      decisionId: decision.id,
      choiceId: entry.id,
      signatures: new Set(
        fourWordSignatures(`${entry.label || ""} ${entry.description || ""}`),
      ),
    }))
  ));
  for (const answer of clarificationAnswers) {
    const answerSignatures = fourWordSignatures(answer.answer);
    for (const choice of choices) {
      const overlap = answerSignatures.find((entry) => choice.signatures.has(entry));
      if (!overlap) continue;
      errors.push(
        `${location}/${answer.clarificationId}: clarification answer repeats `
        + `a four-word solution signature from ${choice.decisionId}/${choice.choiceId}.`,
      );
    }
  }
}

function scenarioIndex(publicScenario, privateScenario) {
  const decisions = new Map(publicScenario.decisions.map((decision) => [
    decision.id,
    {
      optionIds: new Set(decision.options.map((entry) => entry.id)),
      rationaleIds: new Set(decision.rationales.map((entry) => entry.id)),
    },
  ]));
  return {
    clarificationIds: new Set(publicScenario.clarifications.map((entry) => entry.id)),
    requirementIds: new Set(publicScenario.requirements.map((entry) => entry.id)),
    laneIds: new Set(publicScenario.lanes.map((entry) => entry.id)),
    cardIds: new Set(publicScenario.cards.map((entry) => entry.id)),
    connectionTypeIds: new Set(publicScenario.connectionTypes.map((entry) => entry.id)),
    decisions,
    twistActionIds: new Set(privateScenario.twist.responseActions.map((entry) => entry.id)),
  };
}

function predicateIdentity(rule) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(rule).sort(([left], [right]) => left.localeCompare(right))),
  );
}

function guaranteedPositivePredicates(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return [];
  if (Object.hasOwn(rule, "predicate")) {
    return rule.predicate === "changedFromBaseline" ? [] : [rule];
  }
  if (Array.isArray(rule.allOf)) {
    return rule.allOf.flatMap(guaranteedPositivePredicates);
  }
  if (Array.isArray(rule.anyOf) && rule.anyOf.length) {
    const branches = rule.anyOf.map(guaranteedPositivePredicates);
    return branches[0].filter((candidate) => {
      const identity = predicateIdentity(candidate);
      return branches.slice(1).every((branch) => (
        branch.some((entry) => predicateIdentity(entry) === identity)
      ));
    });
  }
  // Negation and conditional activation are not guaranteed positive post-state
  // evidence for a sibling change predicate.
  return [];
}

function isAcceptedChangeGuard(change, candidate) {
  if (change.target === "decision") {
    return (
      candidate.predicate === "decisionSelected"
      && candidate.decisionId === change.id
    );
  }
  if (change.target === "placement") {
    return candidate.predicate === "cardInLane" && candidate.cardId === change.id;
  }
  if (change.target === "connections" && candidate.predicate === "connectionExists") {
    const signature = `${candidate.fromCardId}>${candidate.toCardId}:${candidate.typeId}`;
    return (
      !change.id
      || change.id === signature
      || change.id === candidate.fromCardId
      || change.id === candidate.toCardId
    );
  }
  return false;
}

function validateChangedFromBaselineGuards(
  rule,
  location,
  errors,
  inheritedGuards = [],
) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return;
  if (rule.predicate === "changedFromBaseline") {
    if (!inheritedGuards.some((candidate) => isAcceptedChangeGuard(rule, candidate))) {
      errors.push(
        `${location}: changedFromBaseline must be gated by an accepted positive post-state.`,
      );
    }
    return;
  }
  if (Array.isArray(rule.allOf)) {
    rule.allOf.forEach((child, index) => {
      const siblingGuards = rule.allOf
        .filter((_, siblingIndex) => siblingIndex !== index)
        .flatMap(guaranteedPositivePredicates);
      validateChangedFromBaselineGuards(
        child,
        `${location}.allOf[${index}]`,
        errors,
        [...inheritedGuards, ...siblingGuards],
      );
    });
    return;
  }
  if (Array.isArray(rule.anyOf)) {
    rule.anyOf.forEach((child, index) => {
      validateChangedFromBaselineGuards(
        child,
        `${location}.anyOf[${index}]`,
        errors,
        inheritedGuards,
      );
    });
    return;
  }
  if (rule.when) {
    validateChangedFromBaselineGuards(
      rule.when.if,
      `${location}.when.if`,
      errors,
      inheritedGuards,
    );
    validateChangedFromBaselineGuards(
      rule.when.then,
      `${location}.when.then`,
      errors,
      inheritedGuards,
    );
    return;
  }
  if (rule.not) {
    validateChangedFromBaselineGuards(
      rule.not,
      `${location}.not`,
      errors,
      inheritedGuards,
    );
  }
}

function validateRule(rule, index, location, errors, depth = 0) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    errors.push(`${location}: rule must be an object.`);
    return;
  }
  if (depth > 12) {
    errors.push(`${location}: rule nesting exceeds 12 levels.`);
    return;
  }
  const operatorKeys = Object.keys(rule).filter((key) => compositeOperators.has(key));
  const hasPredicate = Object.hasOwn(rule, "predicate");
  if (operatorKeys.length + Number(hasPredicate) !== 1) {
    errors.push(`${location}: rule must declare exactly one allowlisted operator or predicate.`);
    return;
  }
  if (hasPredicate) {
    if (!predicates.has(rule.predicate)) {
      errors.push(`${location}: unknown predicate ${String(rule.predicate)}.`);
      return;
    }
    const allowedKeysByPredicate = {
      clarificationSelected: ["predicate", "clarificationId"],
      requirementPrioritized: ["predicate", "requirementId", "maxRank"],
      cardInLane: ["predicate", "cardId", "laneId"],
      connectionExists: ["predicate", "fromCardId", "toCardId", "typeId"],
      decisionSelected: ["predicate", "decisionId", "optionId"],
      rationaleSelected: ["predicate", "decisionId", "rationaleId"],
      twistActionSelected: ["predicate", "actionId"],
      changedFromBaseline: ["predicate", "target", "id"],
    };
    const allowedKeys = new Set(allowedKeysByPredicate[rule.predicate]);
    const unknownKeys = Object.keys(rule).filter((key) => !allowedKeys.has(key));
    if (unknownKeys.length) {
      errors.push(`${location}: predicate contains unknown keys ${unknownKeys.join(", ")}.`);
    }
    const requireId = (set, key) => {
      if (!set.has(rule[key])) errors.push(`${location}: unknown ${key} ${String(rule[key])}.`);
    };
    switch (rule.predicate) {
      case "clarificationSelected":
        requireId(index.clarificationIds, "clarificationId");
        break;
      case "requirementPrioritized":
        requireId(index.requirementIds, "requirementId");
        if (
          rule.maxRank != null
          && (!Number.isInteger(rule.maxRank) || rule.maxRank < 1 || rule.maxRank > 3)
        ) {
          errors.push(`${location}: maxRank must be an integer from 1 to 3.`);
        }
        break;
      case "cardInLane":
        requireId(index.cardIds, "cardId");
        requireId(index.laneIds, "laneId");
        break;
      case "connectionExists":
        requireId(index.cardIds, "fromCardId");
        requireId(index.cardIds, "toCardId");
        requireId(index.connectionTypeIds, "typeId");
        if (rule.fromCardId === rule.toCardId) {
          errors.push(`${location}: connection predicate cannot use a self-edge.`);
        }
        break;
      case "decisionSelected": {
        const decision = index.decisions.get(rule.decisionId);
        if (!decision) errors.push(`${location}: unknown decisionId ${String(rule.decisionId)}.`);
        else if (!decision.optionIds.has(rule.optionId)) {
          errors.push(`${location}: unknown optionId ${String(rule.optionId)}.`);
        }
        break;
      }
      case "rationaleSelected": {
        const decision = index.decisions.get(rule.decisionId);
        if (!decision) errors.push(`${location}: unknown decisionId ${String(rule.decisionId)}.`);
        else if (!decision.rationaleIds.has(rule.rationaleId)) {
          errors.push(`${location}: unknown rationaleId ${String(rule.rationaleId)}.`);
        }
        break;
      }
      case "twistActionSelected":
        requireId(index.twistActionIds, "actionId");
        break;
      case "changedFromBaseline":
        if (!changedTargets.has(rule.target)) {
          errors.push(`${location}: changedFromBaseline target is not allowlisted.`);
        }
        if (typeof rule.id !== "string" || !rule.id) {
          errors.push(`${location}: changedFromBaseline requires a stable id.`);
        } else if (rule.target === "placement" && !index.cardIds.has(rule.id)) {
          errors.push(`${location}: changed placement references an unknown card.`);
        } else if (rule.target === "decision" && !index.decisions.has(rule.id)) {
          errors.push(`${location}: changed decision references an unknown decision.`);
        }
        break;
      default:
        break;
    }
    return;
  }
  const operator = operatorKeys[0];
  const unknownOperatorKeys = Object.keys(rule).filter((key) => key !== operator);
  if (unknownOperatorKeys.length) {
    errors.push(`${location}: ${operator} contains unknown keys ${unknownOperatorKeys.join(", ")}.`);
  }
  if (operator === "allOf" || operator === "anyOf") {
    const children = rule[operator];
    if (!Array.isArray(children) || children.length < 2) {
      errors.push(`${location}: ${operator} requires at least two rules.`);
      return;
    }
    children.forEach((child, indexValue) => {
      validateRule(child, index, `${location}.${operator}[${indexValue}]`, errors, depth + 1);
    });
    return;
  }
  if (operator === "not") {
    validateRule(rule.not, index, `${location}.not`, errors, depth + 1);
    return;
  }
  const conditional = rule.when;
  if (
    !conditional
    || typeof conditional !== "object"
    || !Object.hasOwn(conditional, "if")
    || !Object.hasOwn(conditional, "then")
    || Object.keys(conditional).some((key) => !["if", "then"].includes(key))
  ) {
    errors.push(`${location}: when requires exactly if and then rules.`);
    return;
  }
  validateRule(conditional.if, index, `${location}.when.if`, errors, depth + 1);
  validateRule(conditional.then, index, `${location}.when.then`, errors, depth + 1);
}

function findDecision(draft, decisionId) {
  return (draft.decisions || []).find((entry) => entry.decisionId === decisionId);
}

function connectionSignature(connection) {
  return `${connection.fromCardId}>${connection.toCardId}:${connection.typeId}`;
}

export function evaluateSystemDesignRule(rule, draft, baseline = null) {
  if (Object.hasOwn(rule, "allOf") || Object.hasOwn(rule, "anyOf")) {
    const operator = Object.hasOwn(rule, "allOf") ? "allOf" : "anyOf";
    const results = rule[operator].map((child) => (
      evaluateSystemDesignRule(child, draft, baseline)
    ));
    const activeResults = results.filter((entry) => entry.active);
    if (!activeResults.length) return { active: false, passed: false };
    return {
      active: true,
      passed: operator === "allOf"
        ? activeResults.every((entry) => entry.passed)
        : activeResults.some((entry) => entry.passed),
    };
  }
  if (Object.hasOwn(rule, "not")) {
    const result = evaluateSystemDesignRule(rule.not, draft, baseline);
    return { active: result.active, passed: result.active && !result.passed };
  }
  if (Object.hasOwn(rule, "when")) {
    const condition = evaluateSystemDesignRule(rule.when.if, draft, baseline);
    if (!condition.active || !condition.passed) return { active: false, passed: false };
    return evaluateSystemDesignRule(rule.when.then, draft, baseline);
  }

  let passed = false;
  switch (rule.predicate) {
    case "clarificationSelected":
      passed = (draft.clarificationIds || []).includes(rule.clarificationId);
      break;
    case "requirementPrioritized": {
      const position = (draft.priorityRequirementIds || []).indexOf(rule.requirementId);
      passed = position >= 0 && (rule.maxRank == null || position + 1 <= rule.maxRank);
      break;
    }
    case "cardInLane":
      passed = (draft.placements || []).some(
        (entry) => entry.cardId === rule.cardId && entry.laneId === rule.laneId,
      );
      break;
    case "connectionExists":
      passed = (draft.connections || []).some(
        (entry) => entry.fromCardId === rule.fromCardId
          && entry.toCardId === rule.toCardId
          && entry.typeId === rule.typeId,
      );
      break;
    case "decisionSelected":
      passed = findDecision(draft, rule.decisionId)?.optionId === rule.optionId;
      break;
    case "rationaleSelected":
      passed = Boolean(
        findDecision(draft, rule.decisionId)?.rationaleIds?.includes(rule.rationaleId),
      );
      break;
    case "twistActionSelected":
      passed = (draft.twistResponseActionIds || []).includes(rule.actionId);
      break;
    case "changedFromBaseline": {
      if (!baseline) break;
      if (rule.target === "placement") {
        const current = (draft.placements || []).find((entry) => entry.cardId === rule.id);
        const previous = (baseline.placements || []).find((entry) => entry.cardId === rule.id);
        passed = Boolean(
          current
          && (
            !previous
            || current.cardId !== previous.cardId
            || current.laneId !== previous.laneId
            || Number(current.order) !== Number(previous.order)
          ),
        );
      } else if (rule.target === "decision") {
        const current = findDecision(draft, rule.id);
        const previous = findDecision(baseline, rule.id);
        passed = Boolean(current && current.optionId !== previous?.optionId);
      } else {
        const relevantSignatures = (value) => (value.connections || [])
          .filter((entry) => (
            !rule.id
            || entry.fromCardId === rule.id
            || entry.toCardId === rule.id
            || connectionSignature(entry) === rule.id
          ))
          .map(connectionSignature)
          .sort();
        passed = JSON.stringify(relevantSignatures(draft))
          !== JSON.stringify(relevantSignatures(baseline));
      }
      break;
    }
    default:
      break;
  }
  return { active: true, passed };
}

export function scoreSystemDesignFixture(privateScenario, fixture) {
  const axisResults = privateScenario.rubric.axes.map((axis) => {
    const results = axis.criteria.map((criterion) => ({
      criterion,
      result: evaluateSystemDesignRule(
        criterion.rule,
        fixture.draft,
        fixture.baseline || null,
      ),
    }));
    const active = results.filter((entry) => entry.result.active);
    const activeWeight = active.reduce((total, entry) => total + entry.criterion.weight, 0);
    const passedWeight = active
      .filter((entry) => entry.result.passed)
      .reduce((total, entry) => total + entry.criterion.weight, 0);
    const ratio = activeWeight ? passedWeight / activeWeight : 0;
    return {
      id: axis.id,
      activeWeight,
      passedWeight,
      status: activeWeight <= 0
        ? "not-evaluated"
        : ratio >= 0.75
          ? "strong-evidence"
          : ratio >= 0.4
            ? "developing"
            : "needs-focus",
    };
  });
  const contradictions = privateScenario.rubric.contradictions
    .filter((entry) => evaluateSystemDesignRule(
      entry.rule,
      fixture.draft,
      fixture.baseline || null,
    ).passed);
  for (const contradiction of contradictions) {
    for (const axisId of contradiction.axisIds) {
      const result = axisResults.find((entry) => entry.id === axisId);
      if (!result) continue;
      if (contradiction.severity === "critical") result.status = "needs-focus";
      else if (result.status === "strong-evidence") result.status = "developing";
    }
  }
  const demonstratedAxes = axisResults.filter((entry) => entry.passedWeight > 0).length;
  const strongCount = axisResults.filter((entry) => entry.status === "strong-evidence").length;
  const developingOrBetter = axisResults.filter(
    (entry) => ["developing", "strong-evidence"].includes(entry.status),
  ).length;
  const needsFocusCount = axisResults.filter(
    (entry) => entry.status === "needs-focus",
  ).length;
  const hasCritical = contradictions.some((entry) => entry.severity === "critical");
  let practiceSignal = "Needs Focus";
  if (demonstratedAxes < 3) {
    practiceSignal = "Not enough evidence";
  } else if (strongCount >= 4 && needsFocusCount === 0 && !hasCritical) {
    practiceSignal = "Strong System Design Session";
  } else if (developingOrBetter >= 4 && needsFocusCount <= 1 && !hasCritical) {
    practiceSignal = "On Track";
  }
  return {
    practiceSignal,
    axes: axisResults,
    contradictions: contradictions.map(({ id, severity }) => ({ id, severity })),
  };
}

function validateDraft(draft, baseline, scenario, index, location, errors) {
  const arrays = [
    "clarificationIds",
    "priorityRequirementIds",
    "placements",
    "connections",
    "decisions",
    "twistResponseActionIds",
  ];
  for (const key of arrays) {
    if (!Array.isArray(draft?.[key])) errors.push(`${location}.${key} must be an array.`);
  }
  if (!draft || arrays.some((key) => !Array.isArray(draft[key]))) return;
  if (!expectedStepIds.includes(draft.currentStep)) {
    errors.push(`${location}: currentStep is invalid.`);
  }
  if (draft.scratchpad != null && (
    typeof draft.scratchpad !== "string"
    || draft.scratchpad.length > scenario.selectionLimits.scratchpadChars
  )) {
    errors.push(`${location}: scratchpad exceeds the public limit.`);
  }
  if (
    draft.clarificationIds.length > scenario.selectionLimits.clarifications
    || new Set(draft.clarificationIds).size !== draft.clarificationIds.length
    || draft.clarificationIds.some((id) => !index.clarificationIds.has(id))
  ) {
    errors.push(`${location}: clarification selection is invalid.`);
  }
  if (
    draft.priorityRequirementIds.length > scenario.selectionLimits.priorities
    || new Set(draft.priorityRequirementIds).size !== draft.priorityRequirementIds.length
    || draft.priorityRequirementIds.some((id) => !index.requirementIds.has(id))
  ) {
    errors.push(`${location}: requirement priority selection is invalid.`);
  }
  const placementCards = new Set();
  const placementOrdersByLane = new Map();
  for (const placement of draft.placements) {
    const card = scenario.cards.find((entry) => entry.id === placement.cardId);
    if (
      !card
      || !index.laneIds.has(placement.laneId)
      || !Number.isInteger(placement.order)
      || placement.order < 0
      || placementCards.has(placement.cardId)
    ) {
      errors.push(`${location}: card placement is invalid.`);
    }
    placementCards.add(placement.cardId);
    if (!placementOrdersByLane.has(placement.laneId)) {
      placementOrdersByLane.set(placement.laneId, []);
    }
    placementOrdersByLane.get(placement.laneId).push(placement.order);
  }
  for (const [laneId, orders] of placementOrdersByLane) {
    const sorted = [...orders].sort((left, right) => left - right);
    if (sorted.some((order, indexValue) => order !== indexValue)) {
      errors.push(
        `${location}: ${laneId} lane placement order must be unique and contiguous from zero.`,
      );
    }
  }
  const connectionSignatures = new Set();
  for (const connection of draft.connections) {
    const signature = connectionSignature(connection);
    if (
      !index.cardIds.has(connection.fromCardId)
      || !index.cardIds.has(connection.toCardId)
      || !placementCards.has(connection.fromCardId)
      || !placementCards.has(connection.toCardId)
      || connection.fromCardId === connection.toCardId
      || !index.connectionTypeIds.has(connection.typeId)
      || connectionSignatures.has(signature)
    ) {
      errors.push(`${location}: connection is invalid.`);
    }
    connectionSignatures.add(signature);
  }
  if (draft.connections.length > scenario.selectionLimits.connections) {
    errors.push(`${location}: connection limit exceeded.`);
  }
  const decisionIds = new Set();
  for (const decision of draft.decisions) {
    const known = index.decisions.get(decision.decisionId);
    if (
      !known
      || !known.optionIds.has(decision.optionId)
      || !Array.isArray(decision.rationaleIds)
      || decision.rationaleIds.length
        > scenario.selectionLimits.rationalesPerDecision
      || decision.rationaleIds.some((id) => !known.rationaleIds.has(id))
      || new Set(decision.rationaleIds).size !== decision.rationaleIds.length
      || decisionIds.has(decision.decisionId)
    ) {
      errors.push(`${location}: decision selection is invalid.`);
    }
    decisionIds.add(decision.decisionId);
  }
  if (
    draft.twistResponseActionIds.length > scenario.selectionLimits.twistActions
    || new Set(draft.twistResponseActionIds).size !== draft.twistResponseActionIds.length
    || draft.twistResponseActionIds.some((id) => !index.twistActionIds.has(id))
  ) {
    errors.push(`${location}: twist action selection is invalid.`);
  }
  if (baseline) validateDraft(
    baseline,
    null,
    scenario,
    index,
    `${location}.baseline`,
    errors,
  );
}

export function validateSystemDesignDraft({
  scenario,
  privateScenario,
  draft,
  baseline = null,
}) {
  const errors = [];
  validateDraft(
    draft,
    baseline,
    scenario,
    scenarioIndex(scenario, privateScenario),
    `${scenario.id}.draft`,
    errors,
  );
  return errors;
}

export function validateBuiltSystemDesignContent(built) {
  const errors = [];
  const {
    authoring,
    publicPackage,
    privatePackage,
    release,
  } = built;
  if (
    publicPackage.registryId !== "interview-system-design-registry-v1"
    || privatePackage.registryId !== publicPackage.registryId
  ) {
    errors.push("System-design registry ID must be interview-system-design-registry-v1.");
  }
  const publicIds = publicPackage.scenarios.map((entry) => entry.id);
  if (
    publicIds.length !== expectedScenarioCount
    || new Set(publicIds).size !== expectedScenarioCount
    || Object.keys(expectedScenarios).some((id) => !publicIds.includes(id))
  ) {
    errors.push("System-design registry must contain the approved scenario IDs.");
  }
  const privateById = new Map(privatePackage.scenarios.map((entry) => [entry.id, entry]));
  for (const scenario of publicPackage.scenarios) {
    const expected = expectedScenarios[scenario.id];
    const privateScenario = privateById.get(scenario.id);
    if (!expected) continue;
    if (
      scenario.level !== expected.level
      || scenario.timeLimitSeconds !== expected.timeLimitSeconds
    ) {
      errors.push(`${scenario.id}: level or time limit differs from the approved matrix.`);
    }
    if (
      !privateScenario
      || privateScenario.revision !== scenario.revision
      || privateScenario.contentHash !== scenario.contentHash
    ) {
      errors.push(`${scenario.id}: public/private identity does not match.`);
      continue;
    }
    if (!scenario.enabled) errors.push(`${scenario.id}: passed candidate scenario must be enabled.`);
    if (
      scenario.selectionLimits.clarifications !== 3
      || scenario.selectionLimits.priorities !== 3
      || scenario.selectionLimits.rationalesPerDecision !== 2
      || scenario.selectionLimits.twistActions !== 2
      || scenario.selectionLimits.scratchpadChars !== 200
    ) {
      errors.push(`${scenario.id}: selection limits differ from the V1 contract.`);
    }
    if (
      scenario.steps.map((entry) => entry.id).join(",") !== expectedStepIds.join(",")
      || scenario.lanes.map((entry) => entry.id).join(",") !== expectedLaneIds.join(",")
    ) {
      errors.push(`${scenario.id}: step or lane contract is invalid.`);
    }
    if (
      scenario.clarifications.length < 6
      || scenario.requirements.length !== 6
      || scenario.cards.length < 8
      || scenario.decisions.length < 3
      || !uniqueIds(scenario.steps)
      || !uniqueIds(scenario.lanes)
      || !uniqueIds(scenario.clarifications)
      || !uniqueIds(scenario.requirements)
      || !uniqueIds(scenario.cards)
      || !uniqueIds(scenario.connectionTypes)
      || !uniqueIds(scenario.decisions)
    ) {
      errors.push(`${scenario.id}: public collections or IDs do not meet V1 bounds.`);
    }
    if (
      Object.keys(scenario.frameworkLenses).sort().join(",")
      !== [...tracks].sort().join(",")
    ) {
      errors.push(`${scenario.id}: framework lenses must cover all four tracks.`);
    }
    for (const decision of scenario.decisions) {
      if (
        decision.options.length < 3
        || decision.rationales.length < 3
        || !uniqueIds(decision.options)
        || !uniqueIds(decision.rationales)
      ) {
        errors.push(`${scenario.id}/${decision.id}: options or rationales are invalid.`);
      }
      validateChoiceQuality(
        decision.options,
        `${scenario.id}/${decision.id}.options`,
        errors,
      );
      validateChoiceQuality(
        decision.rationales,
        `${scenario.id}/${decision.id}.rationales`,
        errors,
      );
    }
    if (
      privateScenario.clarificationAnswers.length !== scenario.clarifications.length
      || !uniqueIds(privateScenario.twist.responseActions)
    ) {
      errors.push(`${scenario.id}: private clarification or twist projection is invalid.`);
    }
    validateChoiceQuality(
      privateScenario.twist.responseActions,
      `${scenario.id}.twist.responseActions`,
      errors,
    );
    const answerIds = new Set(
      privateScenario.clarificationAnswers.map((entry) => entry.clarificationId),
    );
    if (scenario.clarifications.some((entry) => !answerIds.has(entry.id))) {
      errors.push(`${scenario.id}: clarification answers do not cover public prompts.`);
    }
    validateClarificationChoiceOverlap(
      privateScenario.clarificationAnswers,
      scenario.decisions,
      scenario.id,
      errors,
    );
    const axisIds = privateScenario.rubric.axes.map((axis) => axis.id);
    if (
      axisIds.join(",") !== expectedAxisIds.join(",")
      || !uniqueIds(privateScenario.rubric.contradictions)
    ) {
      errors.push(`${scenario.id}: rubric axes or contradiction IDs are invalid.`);
    }
    const index = scenarioIndex(scenario, privateScenario);
    for (const axis of privateScenario.rubric.axes) {
      if (
        !Array.isArray(axis.criteria)
        || axis.criteria.length < 2
        || !uniqueIds(axis.criteria)
        || !Array.isArray(axis.remediationTopics)
        || !axis.remediationTopics.length
      ) {
        errors.push(`${scenario.id}/${axis.id}: rubric criteria are incomplete.`);
        continue;
      }
      for (const criterion of axis.criteria) {
        if (!Number.isFinite(criterion.weight) || criterion.weight <= 0) {
          errors.push(`${scenario.id}/${axis.id}/${criterion.id}: weight must be positive.`);
        }
        validateRule(
          criterion.rule,
          index,
          `${scenario.id}.${axis.id}.${criterion.id}`,
          errors,
        );
        validateChangedFromBaselineGuards(
          criterion.rule,
          `${scenario.id}.${axis.id}.${criterion.id}`,
          errors,
        );
      }
    }
    for (const contradiction of privateScenario.rubric.contradictions) {
      if (
        !["major", "critical"].includes(contradiction.severity)
        || !Array.isArray(contradiction.axisIds)
        || !contradiction.axisIds.length
        || contradiction.axisIds.some((id) => !expectedAxisIds.includes(id))
      ) {
        errors.push(`${scenario.id}/${contradiction.id}: contradiction metadata is invalid.`);
      }
      validateRule(
        contradiction.rule,
        index,
        `${scenario.id}.contradictions.${contradiction.id}`,
        errors,
      );
    }
    const fixtures = privateScenario.validationFixtures;
    const fixtureKinds = fixtures.map((entry) => entry.kind);
    if (
      fixtures.length !== 4
      || fixtureKinds.filter((kind) => kind === "strong").length !== 2
      || fixtureKinds.filter((kind) => kind === "developing").length !== 1
      || fixtureKinds.filter((kind) => kind === "critical-conflict").length !== 1
      || !uniqueIds(fixtures)
    ) {
      errors.push(`${scenario.id}: fixtures must include two strong and one of each fallback path.`);
    }
    const strongFingerprints = new Set();
    for (const fixture of fixtures) {
      validateDraft(
        fixture.draft,
        fixture.baseline || null,
        scenario,
        index,
        `${scenario.id}.fixtures.${fixture.id}`,
        errors,
      );
      const scored = scoreSystemDesignFixture(privateScenario, fixture);
      if (fixture.baseline && (
        JSON.stringify(fixture.baseline.clarificationIds) !== JSON.stringify(
          fixture.draft.clarificationIds,
        )
        || JSON.stringify(fixture.baseline.priorityRequirementIds) !== JSON.stringify(
          fixture.draft.priorityRequirementIds,
        )
      )) {
        errors.push(
          `${scenario.id}/${fixture.id}: twist must not change locked clarifications or priorities.`,
        );
      }
      if (scored.practiceSignal !== fixture.expectedSignal) {
        errors.push(
          `${scenario.id}/${fixture.id}: expected ${fixture.expectedSignal}, `
          + `received ${scored.practiceSignal}.`,
        );
      }
      if (fixture.kind === "critical-conflict" && !scored.contradictions.some(
        (entry) => entry.severity === "critical",
      )) {
        errors.push(`${scenario.id}/${fixture.id}: critical fixture did not trigger a critical rule.`);
      }
      if (fixture.kind === "strong") {
        strongFingerprints.add(sha256({
          placements: fixture.draft.placements,
          connections: fixture.draft.connections,
          decisions: fixture.draft.decisions,
        }));
      }
    }
    if (strongFingerprints.size !== 2) {
      errors.push(`${scenario.id}: strong fixtures must exercise distinct architectures.`);
    }
    if (
      privateScenario.review.contentHash !== scenario.contentHash
      || privateScenario.review.reviewedRevision !== scenario.revision
      || privateScenario.review.definitionHash !== authoring.definitionHash
      || !reviewPassed(privateScenario.review)
    ) {
      errors.push(`${scenario.id}: review is stale or incomplete.`);
    }
    if (
      privateScenario.review.technical.reviewerType !== "ai"
      || privateScenario.review.blind.reviewerType !== "ai"
      || privateScenario.review.editorial.reviewerType !== "ai"
    ) {
      errors.push(`${scenario.id}: AI review records must be explicitly labelled.`);
    }
    if (
      privateScenario.sourceEvidence.files.length !== sourceFiles.length
      || !uniqueIds(privateScenario.sourceEvidence.files.map((entry) => ({
        id: entry.file,
      })))
      || !privateScenario.sourceEvidence.sourceUpdatedAt
      || !privateScenario.sourceEvidence.bundleHash
    ) {
      errors.push(`${scenario.id}: pinned source evidence is incomplete.`);
    }
    if (
      privateScenario.provenance.copiedText !== false
      || !Array.isArray(privateScenario.provenance.references)
      || !privateScenario.provenance.references.length
      || privateScenario.provenance.references.some((reference) => (
        !reference.url
        || !reference.license
        || !reference.role
        || !reference.accessedAt
      ))
    ) {
      errors.push(`${scenario.id}: provenance or source-license metadata is incomplete.`);
    }
  }
  const leakPaths = collectLeakPaths(publicPackage);
  if (leakPaths.length) {
    errors.push(`Public system-design registry leaked private keys: ${leakPaths.join(", ")}.`);
  }
  if (
    release.scenarioCount !== expectedScenarioCount
    || release.enabledScenarioCount !== expectedScenarioCount
    || release.registryContentHash !== release.contentHash
  ) {
    errors.push("System-design release counts or content hash are invalid.");
  }
  for (const reference of release.scenarioRefs) {
    const scenario = publicPackage.scenarios.find((entry) => entry.id === reference.id);
    const privateScenario = privateById.get(reference.id);
    if (
      !scenario
      || !privateScenario
      || reference.revision !== scenario.revision
      || reference.level !== scenario.level
      || reference.contentHash !== scenario.contentHash
      || reference.enabled !== scenario.enabled
      || reference.sourceBundleHash !== privateScenario.sourceEvidence.bundleHash
    ) {
      errors.push(`${reference.id}: release reference is stale or incomplete.`);
    }
  }
  if (authoring.status === "candidate" && authoring.finalApproval !== null) {
    errors.push("Candidate system-design registry finalApproval must be null.");
  }
  if (authoring.status !== "candidate") {
    const approval = authoring.finalApproval;
    if (
      !approval
      || approval.registryVersion !== authoring.registryVersion
      || approval.registryContentHash !== release.registryContentHash
    ) {
      errors.push("Gold system-design approval must bind registryVersion and content hash.");
    }
  }
  return errors;
}

export function systemDesignReleasePath(interviewContentDir) {
  return path.join(interviewContentDir, systemDesignArtifactNames.release);
}
