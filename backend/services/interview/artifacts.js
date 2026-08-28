'use strict';

const crypto = require('crypto');
const fs = require('fs');

const { interviewConfig } = require('./config');
const INTERVIEW_ARTIFACT_PINS = require('../../content/interview/interview-artifact-pins-v1.json');

const GOLD_STATUSES = new Set(['editorial-gold', 'calibrated-gold']);
const PUBLIC_FORBIDDEN_KEYS = new Set([
  'answer',
  'answerKey',
  'answerProof',
  'correctOptionId',
  'explanation',
  'misconceptionTag',
  'optionRationales',
  'private',
  'provenance',
  'rationale',
  'remediationTopics',
  'review',
  'rubric',
  'sourceEvidence',
  'solution',
  'solutionAsset',
  'solutionBlock',
  'tests',
  'twist',
  'validationFixtures',
]);

let artifactCache = new Map();
let systemDesignArtifactCache = new Map();

class InterviewContentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InterviewContentError';
    this.code = 'INTERVIEW_CONTENT_UNAVAILABLE';
    this.statusCode = 503;
  }
}

function fail(message) {
  throw new InterviewContentError(message);
}

function readJsonWithRaw(filePath, label) {
  let raw;
  try {
    raw = fs.readFileSync(filePath);
  } catch {
    fail(`${label} artifact is unavailable`);
  }
  try {
    return {
      raw,
      json: JSON.parse(raw.toString('utf8')),
      sha256: crypto.createHash('sha256').update(raw).digest('hex'),
      signature: `${filePath}:${raw.length}:${fs.statSync(filePath).mtimeMs}`,
    };
  } catch {
    fail(`${label} artifact is invalid JSON`);
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])])
  );
}

function canonicalSha256(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function cacheKey(paths, allowCandidate) {
  return JSON.stringify({
    allowCandidate: Boolean(allowCandidate),
    paths: Object.values(paths).map((value) => String(value)),
  });
}

function assertSafeStatus(status, label, config) {
  if (GOLD_STATUSES.has(status)) return;
  if (status === 'candidate' && config.allowCandidate) return;
  fail(`${label} artifact is not approved for runtime use`);
}

function assertFinalApproval({
  release,
  privateDoc,
  label,
  versionField,
  expectedVersion,
  hashField,
  expectedHash,
}) {
  if (!GOLD_STATUSES.has(release?.status)) return;
  const approval = release?.finalApproval;
  if (!approval || typeof approval !== 'object') {
    fail(`${label} release is gold without final approval`);
  }
  if (!String(approval.approvedBy || '').trim()) {
    fail(`${label} final approval is missing approvedBy`);
  }
  const approvedAt = new Date(String(approval.approvedAt || ''));
  if (Number.isNaN(approvedAt.getTime())) {
    fail(`${label} final approval has an invalid approvedAt`);
  }
  if (String(approval?.[versionField] || '') !== expectedVersion) {
    fail(`${label} final approval version does not match its release`);
  }
  if (String(approval?.[hashField] || '') !== expectedHash) {
    fail(`${label} final approval hash does not match its release`);
  }
  const privateApproval = privateDoc?.finalApproval;
  if (
    !privateApproval
    || privateApproval.approvedBy !== approval.approvedBy
    || privateApproval.approvedAt !== approval.approvedAt
    || privateApproval[versionField] !== approval[versionField]
    || privateApproval[hashField] !== approval[hashField]
  ) {
    fail(`${label} private approval does not match its release`);
  }
}

function assertPinnedArtifactFiles({ release, pin, artifacts, label }) {
  if (!GOLD_STATUSES.has(release?.status)) return;
  for (const kind of ['public', 'private', 'release']) {
    const expected = String(pin?.artifactSha256?.[kind] || '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(expected) || artifacts?.[kind]?.sha256 !== expected) {
      fail(`${label} ${kind} artifact does not match the approved artifact pins`);
    }
  }
}

function assertPinnedBankRelease(release, artifacts) {
  if (!GOLD_STATUSES.has(release?.status)) return;
  const pin = INTERVIEW_ARTIFACT_PINS?.mcq || {};
  const approval = release?.finalApproval || {};
  if (
    INTERVIEW_ARTIFACT_PINS?.schemaVersion !== '1.0.0'
    || release.bankId !== pin.bankId
    || release.bankVersion !== pin.bankVersion
    || release.status !== pin.status
    || release.contentHash !== pin.bankContentHash
    || approval.approvedBy !== INTERVIEW_ARTIFACT_PINS.approvedBy
    || approval.approvedAt !== INTERVIEW_ARTIFACT_PINS.approvedAt
    || approval.selectionMetadataHash !== pin.selectionMetadataHash
  ) {
    fail('bank release does not match the approved artifact pins');
  }
  assertPinnedArtifactFiles({
    release,
    pin,
    artifacts,
    label: 'bank',
  });
}

function assertPinnedCodingRelease(release, artifacts) {
  if (!GOLD_STATUSES.has(release?.status)) return;
  const pin = INTERVIEW_ARTIFACT_PINS?.coding || {};
  const approval = release?.finalApproval || {};
  if (
    INTERVIEW_ARTIFACT_PINS?.schemaVersion !== '1.0.0'
    || release.registryId !== pin.registryId
    || release.registryVersion !== pin.registryVersion
    || release.status !== pin.status
    || release.registryContentHash !== pin.registryContentHash
    || release.selectionDefinitionHash !== pin.selectionDefinitionHash
    || release.definitionHash !== pin.definitionHash
    || approval.approvedBy !== INTERVIEW_ARTIFACT_PINS.approvedBy
    || approval.approvedAt !== INTERVIEW_ARTIFACT_PINS.approvedAt
    || approval.selectionDefinitionHash !== pin.selectionDefinitionHash
  ) {
    fail('coding registry release does not match the approved artifact pins');
  }
  assertPinnedArtifactFiles({
    release,
    pin,
    artifacts,
    label: 'coding registry',
  });
}

function assertArtifactHash(release, kind, artifact, label) {
  const expected = String(release?.artifacts?.[kind]?.sha256 || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) {
    fail(`${label} release is missing the ${kind} artifact hash`);
  }
  if (artifact.sha256 !== expected) {
    fail(`${label} ${kind} artifact hash does not match its release`);
  }
}

function findForbiddenKey(value, path = '$') {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const hit = findForbiddenKey(value[index], `${path}[${index}]`);
      if (hit) return hit;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value)) {
    if (PUBLIC_FORBIDDEN_KEYS.has(key)) return `${path}.${key}`;
    const hit = findForbiddenKey(child, `${path}.${key}`);
    if (hit) return hit;
  }
  return null;
}

function requiredString(value, label) {
  const text = String(value == null ? '' : value).trim();
  if (!text) fail(`${label} is required`);
  return text;
}

function requiredRevision(value, label) {
  const revision = Number(value);
  if (!Number.isInteger(revision) || revision < 1) fail(`${label} must be a positive revision`);
  return revision;
}

function normalizeQuestionCode(rawCode, rawLanguage, label) {
  if (rawCode == null || rawCode === '') return {};
  if (typeof rawCode === 'string') {
    const codeLanguage = typeof rawLanguage === 'string' ? rawLanguage.trim() : '';
    return {
      code: rawCode,
      ...(codeLanguage ? { codeLanguage } : {}),
    };
  }
  if (!rawCode || typeof rawCode !== 'object' || Array.isArray(rawCode)) {
    fail(`${label} must be a string or a structured snippet`);
  }
  const source = typeof rawCode.source === 'string' ? rawCode.source : '';
  if (!source.trim()) fail(`${label}.source is required`);
  if (typeof rawCode.language !== 'string' || !rawCode.language.trim()) {
    fail(`${label}.language must be a non-empty string`);
  }
  const language = rawCode.language.trim();
  if (!/^[a-z][a-z0-9-]*$/.test(language)) {
    fail(`${label}.language must be a lowercase language identifier`);
  }
  if (typeof rawCode.runtime !== 'string' || !rawCode.runtime.trim()) {
    fail(`${label}.runtime must be a non-empty string`);
  }
  return {
    code: source,
    codeLanguage: language,
  };
}

function normalizeQuestion(raw, index) {
  const label = `bank question[${index}]`;
  const optionsRaw = Array.isArray(raw?.options) ? raw.options : [];
  if (optionsRaw.length !== 3) fail(`${label} must have exactly three options`);
  const options = optionsRaw.map((option, optionIndex) => ({
    id: requiredString(option?.id, `${label}.options[${optionIndex}].id`),
    label: requiredString(option?.label, `${label}.options[${optionIndex}].label`),
  }));
  if (new Set(options.map((option) => option.id)).size !== options.length) {
    fail(`${label} contains duplicate option ids`);
  }

  const technology = requiredString(raw?.technology, `${label}.technology`);
  if (!['javascript', 'html', 'css', 'react', 'angular', 'vue'].includes(technology)) {
    fail(`${label} has an unsupported technology`);
  }
  const level = requiredString(raw?.level, `${label}.level`);
  if (!['junior', 'mid', 'senior'].includes(level)) fail(`${label} has an unsupported level`);
  const difficultyBand = requiredString(raw?.difficultyBand, `${label}.difficultyBand`);
  if (!['foundation', 'core', 'stretch'].includes(difficultyBand)) {
    fail(`${label} has an unsupported difficulty band`);
  }
  const format = requiredString(raw?.format, `${label}.format`);
  if (!['conceptual', 'code-output', 'production-scenario'].includes(format)) {
    fail(`${label} has an unsupported format`);
  }
  const estimatedSeconds = Number(raw?.estimatedSeconds);
  if (!Number.isFinite(estimatedSeconds) || estimatedSeconds <= 0) {
    fail(`${label}.estimatedSeconds must be positive`);
  }

  return {
    id: requiredString(raw?.id, `${label}.id`),
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
    technology,
    level,
    difficultyBand,
    format,
    competency: requiredString(raw?.competency, `${label}.competency`),
    prompt: requiredString(raw?.prompt, `${label}.prompt`),
    ...normalizeQuestionCode(raw?.code, raw?.codeLanguage || raw?.language, `${label}.code`),
    estimatedSeconds: Math.floor(estimatedSeconds),
    options,
  };
}

function normalizePrivateQuestion(raw, label) {
  const id = requiredString(raw?.id, `${label}.id`);
  const correctOptionId = requiredString(raw?.correctOptionId, `${label}.correctOptionId`);
  const answerProofSummary = String(raw?.answerProof?.summary || '').trim();
  const explanation = String(raw?.explanation || answerProofSummary || '').trim();
  return {
    id,
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
    conceptId: String(raw?.conceptId || '').trim() || id,
    correctOptionId,
    explanation,
    optionRationales: Array.isArray(raw?.optionRationales)
      ? raw.optionRationales.map((entry) => ({
        optionId: String(entry?.optionId || '').trim(),
        verdict: String(entry?.verdict || '').trim(),
        explanation: String(entry?.explanation || '').trim(),
      }))
      : [],
    remediationTopics: Array.isArray(raw?.remediationTopics)
      ? raw.remediationTopics.map((topic) => String(topic || '').trim()).filter(Boolean)
      : [],
  };
}

function normalizeBank(publicArtifact, privateArtifact, releaseArtifact, config) {
  const publicDoc = publicArtifact.json;
  const privateDoc = privateArtifact.json;
  const release = releaseArtifact.json;
  const status = requiredString(release?.status, 'bank release.status');
  assertSafeStatus(status, 'bank', config);
  assertArtifactHash(release, 'public', publicArtifact, 'bank');
  assertArtifactHash(release, 'private', privateArtifact, 'bank');

  const publicForbidden = findForbiddenKey(publicDoc);
  if (publicForbidden) fail(`bank public artifact contains a private field at ${publicForbidden}`);

  const bankId = requiredString(release?.bankId, 'bank release.bankId');
  const bankVersion = requiredString(release?.bankVersion, 'bank release.bankVersion');
  const contentHash = requiredString(release?.contentHash, 'bank release.contentHash');
  assertFinalApproval({
    release,
    privateDoc,
    label: 'bank',
    versionField: 'bankVersion',
    expectedVersion: bankVersion,
    hashField: 'bankContentHash',
    expectedHash: contentHash,
  });
  assertPinnedBankRelease(release, {
    public: publicArtifact,
    private: privateArtifact,
    release: releaseArtifact,
  });
  for (const [label, document] of [['public', publicDoc], ['private', privateDoc]]) {
    if (document?.bankId !== bankId || document?.bankVersion !== bankVersion) {
      fail(`bank ${label} identity does not match its release`);
    }
    if (document?.status !== status) fail(`bank ${label} status does not match its release`);
  }

  const questionsRaw = Array.isArray(publicDoc?.items)
    ? publicDoc.items
    : (Array.isArray(publicDoc?.questions) ? publicDoc.questions : []);
  const privateRaw = Array.isArray(privateDoc?.items)
    ? privateDoc.items
    : (Array.isArray(privateDoc?.questions) ? privateDoc.questions : []);
  if (questionsRaw.length !== Number(release?.itemCount) || questionsRaw.length !== privateRaw.length) {
    fail('bank artifact item counts do not match');
  }

  const refs = Array.isArray(release?.itemRefs) ? release.itemRefs : [];
  if (refs.length !== questionsRaw.length) fail('bank release item refs do not match the bank');
  const refByKey = new Map(
    refs.map((ref) => [`${ref?.id}@${ref?.revision}`, ref])
  );
  const questions = questionsRaw.map((question, index) => {
    const ref = refByKey.get(`${question?.id}@${question?.revision}`);
    if (!ref?.contentHash) fail(`bank release does not pin question[${index}]`);
    return normalizeQuestion({ ...question, contentHash: ref.contentHash }, index);
  });
  const privateByKey = new Map(
    privateRaw.map((item, index) => {
      const normalized = normalizePrivateQuestion(item, `bank private item[${index}]`);
      return [`${normalized.id}@${normalized.revision}`, normalized];
    })
  );
  const answerByKey = new Map();
  for (const question of questions) {
    const key = `${question.id}@${question.revision}`;
    const privateItem = privateByKey.get(key);
    if (!privateItem || privateItem.contentHash !== question.contentHash) {
      fail(`bank private item does not match ${key}`);
    }
    if (!question.options.some((option) => option.id === privateItem.correctOptionId)) {
      fail(`bank answer key is not an option for ${key}`);
    }
    question.conceptId = privateItem.conceptId;
    answerByKey.set(key, privateItem);
  }

  if (GOLD_STATUSES.has(status)) {
    const selectionMetadataHash = canonicalSha256(
      questions
        .map((question) => ({
          id: question.id,
          revision: question.revision,
          conceptId: question.conceptId,
          technology: question.technology,
          level: question.level,
          difficultyBand: question.difficultyBand,
          format: question.format,
          estimatedSeconds: question.estimatedSeconds,
        }))
        .sort((left, right) => left.id.localeCompare(right.id))
    );
    if (selectionMetadataHash !== INTERVIEW_ARTIFACT_PINS?.mcq?.selectionMetadataHash) {
      fail('bank selection metadata does not match the approved artifact pins');
    }
  }

  const refKeys = new Set(
    refs.map((ref) => `${ref?.id}@${ref?.revision}@${ref?.contentHash}`)
  );
  for (const question of questions) {
    if (!refKeys.has(`${question.id}@${question.revision}@${question.contentHash}`)) {
      fail(`bank release does not pin ${question.id}`);
    }
  }

  return {
    id: bankId,
    version: bankVersion,
    contentHash,
    status,
    questions,
    answerByKey,
  };
}

function normalizeTrack(value) {
  const track = String(value || '').trim().toLowerCase();
  return track === 'javascript' ? 'core-web' : track;
}

function normalizeCodingVariant(raw, index) {
  const label = `coding variant[${index}]`;
  const track = normalizeTrack(requiredString(raw?.track, `${label}.track`));
  if (!['core-web', 'react', 'angular', 'vue'].includes(track)) {
    fail(`${label} has an unsupported track`);
  }
  const level = requiredString(raw?.level, `${label}.level`);
  if (!['junior', 'mid', 'senior'].includes(level)) fail(`${label} has an unsupported level`);
  const timeLimitSeconds = Number(raw?.timeLimitSeconds);
  if (!Number.isFinite(timeLimitSeconds) || timeLimitSeconds < 60) {
    fail(`${label}.timeLimitSeconds must be at least 60`);
  }
  const roundLimitRaw = raw?.roundLimit;
  const roundLimit = roundLimitRaw == null ? null : Number(roundLimitRaw);
  if (roundLimit != null && (!Number.isInteger(roundLimit) || roundLimit < 1)) {
    fail(`${label}.roundLimit must be null or a positive integer`);
  }
  const starterFilesRaw = Array.isArray(raw?.starterFiles) ? raw.starterFiles : [];
  const starterFiles = starterFilesRaw.map((file, fileIndex) => ({
    path: requiredString(file?.path, `${label}.starterFiles[${fileIndex}].path`),
    content: String(file?.content == null ? '' : file.content),
  }));
  const starterAsset = String(raw?.starterAsset || '').trim() || null;
  if (!starterAsset && starterFiles.length === 0) {
    fail(`${label} requires starterAsset or starterFiles`);
  }
  const runner = requiredString(raw?.runner, `${label}.runner`);
  if (!['javascript', 'framework-preview'].includes(runner)) {
    fail(`${label} has an unsupported runner`);
  }
  if (runner === 'framework-preview' && starterFiles.length === 0) {
    fail(`${label} must embed framework starter files for fail-closed runtime use`);
  }
  return {
    id: requiredString(raw?.id, `${label}.id`),
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
    enabled: raw?.enabled === true,
    track,
    level,
    sourceQuestionId: requiredString(raw?.sourceQuestionId, `${label}.sourceQuestionId`),
    sourceContentVersion: requiredString(
      raw?.sourceContentVersion,
      `${label}.sourceContentVersion`
    ),
    title: requiredString(raw?.title, `${label}.title`),
    prompt: requiredString(raw?.prompt, `${label}.prompt`),
    runner,
    timeLimitSeconds: Math.floor(timeLimitSeconds),
    roundLimit,
    starterAsset,
    starterFiles,
    publicRequirements: Array.isArray(raw?.publicRequirements)
      ? raw.publicRequirements.map((entry, requirementIndex) => {
        const requirementLabel = `${label}.publicRequirements[${requirementIndex}]`;
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          fail(`${requirementLabel} must be a structured requirement`);
        }
        return {
          id: requiredString(entry.id, `${requirementLabel}.id`),
          title: requiredString(entry.title, `${requirementLabel}.title`),
          prompt: String(entry.prompt || '').trim(),
          constraints: Array.isArray(entry.constraints)
            ? entry.constraints.map((value) => String(value || '').trim()).filter(Boolean)
            : [],
        };
      })
      : [],
  };
}

function normalizeCodingPrivate(raw, label) {
  const id = requiredString(raw?.id, `${label}.id`);
  return {
    id,
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
    conceptId: String(raw?.conceptId || '').trim() || id,
    rubric: raw?.rubric && typeof raw.rubric === 'object' ? raw.rubric : {},
    remediationTopics: Array.isArray(raw?.remediationTopics)
      ? raw.remediationTopics.map((topic) => String(topic || '').trim()).filter(Boolean)
      : [],
    runnerConfig: raw?.runnerConfig && typeof raw.runnerConfig === 'object'
      ? raw.runnerConfig
      : {},
  };
}

function normalizeCodingRegistry(publicArtifact, privateArtifact, releaseArtifact, config) {
  const publicDoc = publicArtifact.json;
  const privateDoc = privateArtifact.json;
  const release = releaseArtifact.json;
  const status = requiredString(release?.status, 'coding release.status');
  assertSafeStatus(status, 'coding registry', config);
  assertArtifactHash(release, 'public', publicArtifact, 'coding registry');
  assertArtifactHash(release, 'private', privateArtifact, 'coding registry');

  const publicForbidden = findForbiddenKey(publicDoc);
  if (publicForbidden) {
    fail(`coding public artifact contains a private field at ${publicForbidden}`);
  }

  const registryId = requiredString(release?.registryId, 'coding release.registryId');
  const registryVersion = requiredString(
    release?.registryVersion,
    'coding release.registryVersion'
  );
  const contentHash = requiredString(release?.contentHash, 'coding release.contentHash');
  assertFinalApproval({
    release,
    privateDoc,
    label: 'coding registry',
    versionField: 'registryVersion',
    expectedVersion: registryVersion,
    hashField: 'registryContentHash',
    expectedHash: contentHash,
  });
  assertPinnedCodingRelease(release, {
    public: publicArtifact,
    private: privateArtifact,
    release: releaseArtifact,
  });
  for (const [label, document] of [['public', publicDoc], ['private', privateDoc]]) {
    if (document?.registryId !== registryId || document?.registryVersion !== registryVersion) {
      fail(`coding ${label} identity does not match its release`);
    }
    if (document?.status !== status) {
      fail(`coding ${label} status does not match its release`);
    }
  }

  const variantsRaw = Array.isArray(publicDoc?.variants) ? publicDoc.variants : [];
  const privateRaw = Array.isArray(privateDoc?.variants) ? privateDoc.variants : [];
  if (
    variantsRaw.length !== Number(release?.variantCount)
    || variantsRaw.length !== privateRaw.length
  ) {
    fail('coding registry artifact counts do not match');
  }
  const variants = variantsRaw.map(normalizeCodingVariant);
  const privateByKey = new Map(
    privateRaw.map((item, index) => {
      const normalized = normalizeCodingPrivate(item, `coding private variant[${index}]`);
      return [`${normalized.id}@${normalized.revision}`, normalized];
    })
  );
  for (const variant of variants) {
    const key = `${variant.id}@${variant.revision}`;
    const privateVariant = privateByKey.get(key);
    if (!privateVariant || privateVariant.contentHash !== variant.contentHash) {
      fail(`coding private variant does not match ${key}`);
    }
    variant.conceptId = privateVariant.conceptId;
  }

  if (GOLD_STATUSES.has(status)) {
    const selectionDefinitionHash = canonicalSha256({
      schemaVersion: privateDoc.schemaVersion,
      registryId,
      registryVersion,
      variants: variants
        .map((variant) => ({
          id: variant.id,
          conceptId: variant.conceptId,
          track: variant.track,
          level: variant.level,
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    });
    if (selectionDefinitionHash !== INTERVIEW_ARTIFACT_PINS?.coding?.selectionDefinitionHash) {
      fail('coding selection metadata does not match the approved artifact pins');
    }
  }

  const refs = Array.isArray(release?.variantRefs) ? release.variantRefs : [];
  if (refs.length !== variants.length) fail('coding release refs do not match the registry');
  const refKeys = new Set(
    refs.map((ref) => `${ref?.id}@${ref?.revision}@${ref?.contentHash}@${ref?.enabled === true}`)
  );
  for (const variant of variants) {
    if (!refKeys.has(
      `${variant.id}@${variant.revision}@${variant.contentHash}@${variant.enabled}`
    )) {
      fail(`coding release does not pin ${variant.id}`);
    }
  }

  return {
    id: registryId,
    version: registryVersion,
    contentHash,
    status,
    variants,
    privateByKey,
  };
}

function normalizedUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    fail(`${label} contains missing or duplicate ids`);
  }
}

function normalizeSystemDesignScenario(raw, index) {
  const label = `system design scenario[${index}]`;
  const level = requiredString(raw?.level, `${label}.level`);
  if (!['junior', 'mid', 'senior'].includes(level)) {
    fail(`${label} has an unsupported level`);
  }
  const timeLimitSeconds = Number(raw?.timeLimitSeconds);
  if (!Number.isInteger(timeLimitSeconds) || timeLimitSeconds < 60) {
    fail(`${label}.timeLimitSeconds must be at least 60`);
  }
  const limitsRaw = raw?.selectionLimits || {};
  const limits = {
    clarifications: Number(limitsRaw.clarifications),
    priorities: Number(limitsRaw.priorities),
    connections: Number(limitsRaw.connections),
    rationalesPerDecision: Number(limitsRaw.rationalesPerDecision),
    twistActions: Number(limitsRaw.twistActions),
    scratchpadChars: Number(limitsRaw.scratchpadChars),
  };
  if (Object.values(limits).some((value) => !Number.isInteger(value) || value < 0)) {
    fail(`${label}.selectionLimits must contain non-negative integers`);
  }
  if (
    limits.clarifications > 10
    || limits.priorities > 10
    || limits.connections > 100
    || limits.rationalesPerDecision > 3
    || limits.twistActions > 10
    || limits.scratchpadChars > 200
  ) {
    fail(`${label}.selectionLimits exceeds the runtime bounds`);
  }

  const normalizeEntries = (rawItems, field, mapper) => {
    const values = Array.isArray(rawItems) ? rawItems.map(mapper) : [];
    normalizedUniqueIds(values, `${label}.${field}`);
    return values;
  };
  const steps = normalizeEntries(raw?.steps, 'steps', (entry, itemIndex) => ({
    id: requiredString(entry?.id, `${label}.steps[${itemIndex}].id`),
    title: requiredString(entry?.title, `${label}.steps[${itemIndex}].title`),
  }));
  const lanes = normalizeEntries(raw?.lanes, 'lanes', (entry, itemIndex) => ({
    id: requiredString(entry?.id, `${label}.lanes[${itemIndex}].id`),
    title: requiredString(entry?.title, `${label}.lanes[${itemIndex}].title`),
    description: String(entry?.description || '').trim(),
  }));
  const clarifications = normalizeEntries(
    raw?.clarifications,
    'clarifications',
    (entry, itemIndex) => ({
      id: requiredString(entry?.id, `${label}.clarifications[${itemIndex}].id`),
      prompt: requiredString(entry?.prompt, `${label}.clarifications[${itemIndex}].prompt`),
    })
  );
  const requirements = normalizeEntries(
    raw?.requirements,
    'requirements',
    (entry, itemIndex) => ({
      id: requiredString(entry?.id, `${label}.requirements[${itemIndex}].id`),
      title: requiredString(entry?.title, `${label}.requirements[${itemIndex}].title`),
      description: String(entry?.description || '').trim(),
    })
  );
  const cards = normalizeEntries(raw?.cards, 'cards', (entry, itemIndex) => ({
    id: requiredString(entry?.id, `${label}.cards[${itemIndex}].id`),
    title: requiredString(entry?.title, `${label}.cards[${itemIndex}].title`),
    description: String(entry?.description || '').trim(),
  }));
  const connectionTypes = normalizeEntries(
    raw?.connectionTypes,
    'connectionTypes',
    (entry, itemIndex) => ({
      id: requiredString(entry?.id, `${label}.connectionTypes[${itemIndex}].id`),
      title: requiredString(entry?.title, `${label}.connectionTypes[${itemIndex}].title`),
      description: String(entry?.description || '').trim(),
    })
  );
  const decisions = normalizeEntries(raw?.decisions, 'decisions', (entry, itemIndex) => {
    const decisionLabel = `${label}.decisions[${itemIndex}]`;
    const options = normalizeEntries(entry?.options, 'decision options', (option, optionIndex) => ({
      id: requiredString(option?.id, `${decisionLabel}.options[${optionIndex}].id`),
      label: requiredString(option?.label, `${decisionLabel}.options[${optionIndex}].label`),
      description: String(option?.description || '').trim(),
    }));
    const rationales = normalizeEntries(
      entry?.rationales,
      'decision rationales',
      (rationale, rationaleIndex) => ({
        id: requiredString(
          rationale?.id,
          `${decisionLabel}.rationales[${rationaleIndex}].id`
        ),
        label: requiredString(
          rationale?.label,
          `${decisionLabel}.rationales[${rationaleIndex}].label`
        ),
      })
    );
    return {
      id: requiredString(entry?.id, `${decisionLabel}.id`),
      title: requiredString(entry?.title, `${decisionLabel}.title`),
      prompt: requiredString(entry?.prompt, `${decisionLabel}.prompt`),
      options,
      rationales,
    };
  });
  const frameworkLenses = {};
  for (const track of ['core-web', 'react', 'angular', 'vue']) {
    const lens = raw?.frameworkLenses?.[track];
    frameworkLenses[track] = {
      title: requiredString(lens?.title, `${label}.frameworkLenses.${track}.title`),
      prompt: requiredString(lens?.prompt, `${label}.frameworkLenses.${track}.prompt`),
    };
  }

  if (
    steps.length !== 5
    || clarifications.length < limits.clarifications
    || requirements.length < limits.priorities
  ) {
    fail(`${label} does not satisfy its guided-round limits`);
  }
  return {
    id: requiredString(raw?.id, `${label}.id`),
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
    enabled: raw?.enabled === true,
    level,
    title: requiredString(raw?.title, `${label}.title`),
    prompt: requiredString(raw?.prompt, `${label}.prompt`),
    timeLimitSeconds,
    steps,
    selectionLimits: limits,
    lanes,
    clarifications,
    requirements,
    cards,
    connectionTypes,
    decisions,
    frameworkLenses,
  };
}

const SYSTEM_DESIGN_RULE_KEYS = new Set(['allOf', 'anyOf', 'not', 'when', 'predicate']);
const SYSTEM_DESIGN_PREDICATES = new Set([
  'clarificationSelected',
  'requirementPrioritized',
  'cardInLane',
  'connectionExists',
  'decisionSelected',
  'rationaleSelected',
  'twistActionSelected',
  'changedFromBaseline',
]);

function assertSystemDesignRule(rule, label, depth = 0) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule) || depth > 12) {
    fail(`${label} contains an invalid rule`);
  }
  const operatorKeys = Object.keys(rule).filter((key) => SYSTEM_DESIGN_RULE_KEYS.has(key));
  if (operatorKeys.length !== 1) fail(`${label} must contain exactly one rule operator`);
  const operator = operatorKeys[0];
  if (operator === 'allOf' || operator === 'anyOf') {
    if (Object.keys(rule).some((key) => key !== operator)) {
      fail(`${label} contains an unsupported rule field`);
    }
    if (!Array.isArray(rule[operator]) || !rule[operator].length) {
      fail(`${label}.${operator} must be a non-empty array`);
    }
    rule[operator].forEach((child, index) => (
      assertSystemDesignRule(child, `${label}.${operator}[${index}]`, depth + 1)
    ));
    return;
  }
  if (operator === 'not') {
    if (Object.keys(rule).some((key) => key !== 'not')) {
      fail(`${label} contains an unsupported rule field`);
    }
    assertSystemDesignRule(rule.not, `${label}.not`, depth + 1);
    return;
  }
  if (operator === 'when') {
    if (
      Object.keys(rule).some((key) => key !== 'when')
      || !rule.when
      || typeof rule.when !== 'object'
      || Array.isArray(rule.when)
      || Object.keys(rule.when).some((key) => !['if', 'then'].includes(key))
    ) {
      fail(`${label} contains an unsupported when field`);
    }
    assertSystemDesignRule(rule.when?.if, `${label}.when.if`, depth + 1);
    assertSystemDesignRule(rule.when?.then, `${label}.when.then`, depth + 1);
    return;
  }
  const predicate = String(rule.predicate || '');
  if (!SYSTEM_DESIGN_PREDICATES.has(predicate)) {
    fail(`${label} contains an unsupported predicate`);
  }
  const fieldsByPredicate = {
    clarificationSelected: ['predicate', 'clarificationId'],
    requirementPrioritized: ['predicate', 'requirementId', 'maxRank'],
    cardInLane: ['predicate', 'cardId', 'laneId'],
    connectionExists: ['predicate', 'fromCardId', 'toCardId', 'typeId'],
    decisionSelected: ['predicate', 'decisionId', 'optionId'],
    rationaleSelected: ['predicate', 'decisionId', 'rationaleId'],
    twistActionSelected: ['predicate', 'actionId'],
    changedFromBaseline: ['predicate', 'target', 'id'],
  };
  const allowedFields = new Set(fieldsByPredicate[predicate]);
  if (Object.keys(rule).some((key) => !allowedFields.has(key))) {
    fail(`${label} contains an unsupported predicate field`);
  }
  const requiredFields = fieldsByPredicate[predicate]
    .filter((key) => !['predicate', 'maxRank', 'id'].includes(key));
  if (requiredFields.some((key) => !String(rule[key] || '').trim())) {
    fail(`${label} is missing a predicate field`);
  }
  if (
    predicate === 'requirementPrioritized'
    && rule.maxRank != null
    && (!Number.isInteger(Number(rule.maxRank)) || Number(rule.maxRank) < 1)
  ) {
    fail(`${label}.maxRank is invalid`);
  }
  if (
    predicate === 'changedFromBaseline'
    && !['placement', 'connections', 'decision'].includes(rule.target)
  ) {
    fail(`${label}.target is invalid`);
  }
}

function normalizeSystemDesignPrivate(raw, index) {
  const label = `system design private scenario[${index}]`;
  const twistActions = Array.isArray(raw?.twist?.responseActions)
    ? raw.twist.responseActions.map((entry, actionIndex) => ({
      id: requiredString(entry?.id, `${label}.twist.responseActions[${actionIndex}].id`),
      label: requiredString(entry?.label, `${label}.twist.responseActions[${actionIndex}].label`),
      description: String(entry?.description || '').trim(),
    }))
    : [];
  normalizedUniqueIds(twistActions, `${label}.twist.responseActions`);
  const axes = Array.isArray(raw?.rubric?.axes)
    ? raw.rubric.axes.map((axis, axisIndex) => {
      const axisLabel = `${label}.rubric.axes[${axisIndex}]`;
      const criteria = Array.isArray(axis?.criteria)
        ? axis.criteria.map((criterion, criterionIndex) => {
          const criterionLabel = `${axisLabel}.criteria[${criterionIndex}]`;
          const weight = Number(criterion?.weight);
          if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
            fail(`${criterionLabel}.weight is invalid`);
          }
          assertSystemDesignRule(criterion?.rule, `${criterionLabel}.rule`);
          return {
            id: requiredString(criterion?.id, `${criterionLabel}.id`),
            weight,
            evidence: requiredString(criterion?.evidence, `${criterionLabel}.evidence`),
            rule: JSON.parse(JSON.stringify(criterion.rule)),
          };
        })
        : [];
      normalizedUniqueIds(criteria, `${axisLabel}.criteria`);
      return {
        id: requiredString(axis?.id, `${axisLabel}.id`),
        title: requiredString(axis?.title, `${axisLabel}.title`),
        remediationTopics: Array.isArray(axis?.remediationTopics)
          ? axis.remediationTopics.map((topic) => String(topic || '').trim()).filter(Boolean)
          : [],
        criteria,
      };
    })
    : [];
  normalizedUniqueIds(axes, `${label}.rubric.axes`);
  const contradictions = Array.isArray(raw?.rubric?.contradictions)
    ? raw.rubric.contradictions.map((entry, contradictionIndex) => {
      const contradictionLabel = `${label}.rubric.contradictions[${contradictionIndex}]`;
      const severity = String(entry?.severity || '').trim();
      if (!['major', 'critical'].includes(severity)) {
        fail(`${contradictionLabel}.severity is invalid`);
      }
      assertSystemDesignRule(entry?.rule, `${contradictionLabel}.rule`);
      return {
        id: requiredString(entry?.id, `${contradictionLabel}.id`),
        severity,
        axisIds: Array.isArray(entry?.axisIds)
          ? entry.axisIds.map((id) => requiredString(id, `${contradictionLabel}.axisIds`))
          : [],
        summary: requiredString(entry?.summary, `${contradictionLabel}.summary`),
        rule: JSON.parse(JSON.stringify(entry.rule)),
      };
    })
    : [];
  normalizedUniqueIds(contradictions, `${label}.rubric.contradictions`);
  return {
    id: requiredString(raw?.id, `${label}.id`),
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
    clarificationAnswers: Array.isArray(raw?.clarificationAnswers)
      ? raw.clarificationAnswers.map((entry, answerIndex) => ({
        clarificationId: requiredString(
          entry?.clarificationId,
          `${label}.clarificationAnswers[${answerIndex}].clarificationId`
        ),
        answer: requiredString(
          entry?.answer,
          `${label}.clarificationAnswers[${answerIndex}].answer`
        ),
      }))
      : [],
    twist: {
      id: requiredString(raw?.twist?.id, `${label}.twist.id`),
      title: requiredString(raw?.twist?.title, `${label}.twist.title`),
      prompt: requiredString(raw?.twist?.prompt, `${label}.twist.prompt`),
      responseActions: twistActions,
    },
    rubric: { axes, contradictions },
    sourceEvidence: raw?.sourceEvidence && typeof raw.sourceEvidence === 'object'
      ? JSON.parse(JSON.stringify(raw.sourceEvidence))
      : {},
  };
}

function normalizeSystemDesignRegistry(
  publicArtifact,
  privateArtifact,
  releaseArtifact,
  config
) {
  const publicDoc = publicArtifact.json;
  const privateDoc = privateArtifact.json;
  const release = releaseArtifact.json;
  const status = requiredString(release?.status, 'system design release.status');
  assertSafeStatus(status, 'system design registry', config);
  assertArtifactHash(release, 'public', publicArtifact, 'system design registry');
  assertArtifactHash(release, 'private', privateArtifact, 'system design registry');
  const publicForbidden = findForbiddenKey(publicDoc);
  if (publicForbidden) {
    fail(`system design public artifact contains a private field at ${publicForbidden}`);
  }
  const registryId = requiredString(release?.registryId, 'system design release.registryId');
  const registryVersion = requiredString(
    release?.registryVersion,
    'system design release.registryVersion'
  );
  const contentHash = requiredString(
    release?.registryContentHash || release?.contentHash,
    'system design release.registryContentHash'
  );
  assertFinalApproval({
    release,
    privateDoc,
    label: 'system design registry',
    versionField: 'registryVersion',
    expectedVersion: registryVersion,
    hashField: 'registryContentHash',
    expectedHash: contentHash,
  });
  for (const [label, document] of [['public', publicDoc], ['private', privateDoc]]) {
    if (document?.registryId !== registryId || document?.registryVersion !== registryVersion) {
      fail(`system design ${label} identity does not match its release`);
    }
    if (document?.status !== status) {
      fail(`system design ${label} status does not match its release`);
    }
  }
  const publicScenarios = Array.isArray(publicDoc?.scenarios) ? publicDoc.scenarios : [];
  const privateScenarios = Array.isArray(privateDoc?.scenarios) ? privateDoc.scenarios : [];
  if (
    publicScenarios.length !== Number(release?.scenarioCount)
    || privateScenarios.length !== publicScenarios.length
  ) {
    fail('system design registry artifact counts do not match');
  }
  const scenarios = publicScenarios.map(normalizeSystemDesignScenario);
  normalizedUniqueIds(scenarios, 'system design scenarios');
  const privateByKey = new Map(
    privateScenarios.map((scenario, index) => {
      const normalized = normalizeSystemDesignPrivate(scenario, index);
      return [`${normalized.id}@${normalized.revision}`, normalized];
    })
  );
  const refs = Array.isArray(release?.scenarioRefs) ? release.scenarioRefs : [];
  if (refs.length !== scenarios.length) fail('system design release refs do not match registry');
  for (const scenario of scenarios) {
    const key = `${scenario.id}@${scenario.revision}`;
    const privateScenario = privateByKey.get(key);
    if (!privateScenario || privateScenario.contentHash !== scenario.contentHash) {
      fail(`system design private scenario does not match ${key}`);
    }
    scenario.sourceContentId = String(
      privateScenario.sourceEvidence?.sourceContentId || '',
    ).trim() || null;
    scenario.conceptId = String(
      privateScenario.sourceEvidence?.conceptId
      || privateScenario.sourceEvidence?.sourceContentId
      || '',
    ).trim() || scenario.id;
    const ref = refs.find((entry) => (
      entry?.id === scenario.id
      && Number(entry?.revision) === scenario.revision
    ));
    if (
      !ref
      || ref.contentHash !== scenario.contentHash
      || ref.level !== scenario.level
      || Boolean(ref.enabled) !== scenario.enabled
    ) {
      fail(`system design release does not pin ${scenario.id}`);
    }
    const answerIds = new Set(
      privateScenario.clarificationAnswers.map((entry) => entry.clarificationId)
    );
    if (scenario.clarifications.some((entry) => !answerIds.has(entry.id))) {
      fail(`system design private clarification answers do not cover ${scenario.id}`);
    }
  }
  return {
    id: registryId,
    version: registryVersion,
    contentHash,
    status,
    scenarios,
    privateByKey,
  };
}

function loadInterviewArtifacts({
  force = false,
  allowInternalCandidate = false,
} = {}) {
  const baseConfig = interviewConfig();
  const config = {
    ...baseConfig,
    // The standalone env override is limited to development/test. Production
    // candidate access requires both internal mode and an authenticated admin
    // capability passed by the route.
    allowCandidate: (
      baseConfig.allowCandidate
      || (allowInternalCandidate === true && baseConfig.accessMode === 'internal')
    ),
  };
  const key = cacheKey({
    bankPublic: config.bankPaths.public,
    bankPrivate: config.bankPaths.private,
    bankRelease: config.bankPaths.release,
    codingPublic: config.codingPaths.public,
    codingPrivate: config.codingPaths.private,
    codingRelease: config.codingPaths.release,
  }, config.allowCandidate);
  if (!force && artifactCache.has(key)) return artifactCache.get(key);

  const bankPublic = readJsonWithRaw(config.bankPaths.public, 'bank public');
  const bankPrivate = readJsonWithRaw(config.bankPaths.private, 'bank private');
  const bankRelease = readJsonWithRaw(config.bankPaths.release, 'bank release');
  const codingPublic = readJsonWithRaw(config.codingPaths.public, 'coding public');
  const codingPrivate = readJsonWithRaw(config.codingPaths.private, 'coding private');
  const codingRelease = readJsonWithRaw(config.codingPaths.release, 'coding release');
  const value = {
    bank: normalizeBank(bankPublic, bankPrivate, bankRelease, config),
    coding: normalizeCodingRegistry(codingPublic, codingPrivate, codingRelease, config),
  };
  artifactCache.set(key, value);
  return value;
}

function loadSystemDesignArtifacts({
  force = false,
  allowInternalCandidate = false,
} = {}) {
  const baseConfig = interviewConfig();
  const config = {
    ...baseConfig,
    allowCandidate: (
      baseConfig.allowCandidate
      || (
        allowInternalCandidate === true
        && baseConfig.systemDesignAccessMode === 'internal'
      )
    ),
  };
  const key = cacheKey(config.systemDesignPaths, config.allowCandidate);
  if (!force && systemDesignArtifactCache.has(key)) {
    return systemDesignArtifactCache.get(key);
  }

  const publicArtifact = readJsonWithRaw(
    config.systemDesignPaths.public,
    'system design public'
  );
  const privateArtifact = readJsonWithRaw(
    config.systemDesignPaths.private,
    'system design private'
  );
  const releaseArtifact = readJsonWithRaw(
    config.systemDesignPaths.release,
    'system design release'
  );
  const value = normalizeSystemDesignRegistry(
    publicArtifact,
    privateArtifact,
    releaseArtifact,
    config
  );
  systemDesignArtifactCache.set(key, value);
  return value;
}

function resetInterviewArtifactsCache() {
  artifactCache = new Map();
  systemDesignArtifactCache = new Map();
}

module.exports = {
  GOLD_STATUSES,
  InterviewContentError,
  loadInterviewArtifacts,
  loadSystemDesignArtifacts,
  resetInterviewArtifactsCache,
};
