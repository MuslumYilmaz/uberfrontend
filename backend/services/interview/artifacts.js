'use strict';

const crypto = require('crypto');
const fs = require('fs');

const { interviewConfig } = require('./config');

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
  'solution',
  'solutionAsset',
  'solutionBlock',
  'tests',
]);

let artifactCache = null;

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
    ...(typeof raw?.code === 'string' && raw.code ? { code: raw.code } : {}),
    estimatedSeconds: Math.floor(estimatedSeconds),
    options,
  };
}

function normalizePrivateQuestion(raw, label) {
  const correctOptionId = requiredString(raw?.correctOptionId, `${label}.correctOptionId`);
  const answerProofSummary = String(raw?.answerProof?.summary || '').trim();
  const explanation = String(raw?.explanation || answerProofSummary || '').trim();
  return {
    id: requiredString(raw?.id, `${label}.id`),
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
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
    answerByKey.set(key, privateItem);
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
  return {
    id: requiredString(raw?.id, `${label}.id`),
    revision: requiredRevision(raw?.revision, `${label}.revision`),
    contentHash: requiredString(raw?.contentHash, `${label}.contentHash`),
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
  const bankPublic = readJsonWithRaw(config.bankPaths.public, 'bank public');
  const bankPrivate = readJsonWithRaw(config.bankPaths.private, 'bank private');
  const bankRelease = readJsonWithRaw(config.bankPaths.release, 'bank release');
  const codingPublic = readJsonWithRaw(config.codingPaths.public, 'coding public');
  const codingPrivate = readJsonWithRaw(config.codingPaths.private, 'coding private');
  const codingRelease = readJsonWithRaw(config.codingPaths.release, 'coding release');
  const signature = [
    bankPublic.signature,
    bankPrivate.signature,
    bankRelease.signature,
    codingPublic.signature,
    codingPrivate.signature,
    codingRelease.signature,
    config.allowCandidate,
  ].join('|');
  if (!force && artifactCache?.signature === signature) return artifactCache.value;

  const value = {
    bank: normalizeBank(bankPublic, bankPrivate, bankRelease, config),
    coding: normalizeCodingRegistry(codingPublic, codingPrivate, codingRelease, config),
  };
  artifactCache = { signature, value };
  return value;
}

function resetInterviewArtifactsCache() {
  artifactCache = null;
}

module.exports = {
  GOLD_STATUSES,
  InterviewContentError,
  loadInterviewArtifacts,
  resetInterviewArtifactsCache,
};
