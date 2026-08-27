'use strict';

const crypto = require('crypto');

const INTERVIEW_ACCESS_MODES = Object.freeze(['off', 'internal', 'cohort', 'public']);
const INTERVIEW_AUDIENCES = Object.freeze([
  'disabled',
  'internal-preview',
  'cohort',
  'public',
]);

function normalizeAccessMode(value) {
  const configured = String(value ?? '').trim().toLowerCase();
  return INTERVIEW_ACCESS_MODES.includes(configured) ? configured : 'off';
}

function normalizeCohortBasisPoints(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10_000
    ? parsed
    : 0;
}

function stableCohortBucket(salt, userId) {
  const normalizedSalt = String(salt ?? '').trim();
  const normalizedUserId = String(userId ?? '').trim();
  if (!normalizedSalt || !normalizedUserId) return null;

  const digest = crypto
    .createHash('sha256')
    .update(`${normalizedSalt}:${normalizedUserId}`, 'utf8')
    .digest('hex');
  return Number(BigInt(`0x${digest}`) % 10_000n);
}

function resolveInterviewAudience({
  mode,
  role,
  userId,
  cohortBasisPoints,
  cohortSalt,
} = {}) {
  const normalizedMode = normalizeAccessMode(mode);
  const admin = String(role || '').trim().toLowerCase() === 'admin';
  const basisPoints = normalizeCohortBasisPoints(cohortBasisPoints);

  if (normalizedMode === 'off') {
    return {
      mode: normalizedMode,
      audience: 'disabled',
      enabled: false,
      internalPreview: false,
      cohortBucket: null,
      cohortBasisPoints: basisPoints,
      reason: 'mode_off',
    };
  }

  if (normalizedMode === 'internal') {
    return {
      mode: normalizedMode,
      audience: admin ? 'internal-preview' : 'disabled',
      enabled: admin,
      internalPreview: admin,
      cohortBucket: null,
      cohortBasisPoints: basisPoints,
      reason: admin ? 'admin_preview' : 'internal_only',
    };
  }

  if (normalizedMode === 'public') {
    return {
      mode: normalizedMode,
      audience: 'public',
      enabled: true,
      internalPreview: false,
      cohortBucket: null,
      cohortBasisPoints: basisPoints,
      reason: 'public',
    };
  }

  // Admin preview stays available during a cohort rollout even when the
  // rollout salt is intentionally absent. Non-admin access always fails
  // closed when either side of the stable hash input is unavailable.
  if (admin) {
    return {
      mode: normalizedMode,
      audience: 'internal-preview',
      enabled: true,
      internalPreview: true,
      cohortBucket: null,
      cohortBasisPoints: basisPoints,
      reason: 'admin_preview',
    };
  }

  const cohortBucket = stableCohortBucket(cohortSalt, userId);
  const enabled = cohortBucket !== null && cohortBucket < basisPoints;
  return {
    mode: normalizedMode,
    audience: enabled ? 'cohort' : 'disabled',
    enabled,
    internalPreview: false,
    cohortBucket,
    cohortBasisPoints: basisPoints,
    reason: cohortBucket === null
      ? 'cohort_identity_unavailable'
      : (enabled ? 'cohort_included' : 'cohort_excluded'),
  };
}

module.exports = {
  INTERVIEW_ACCESS_MODES,
  INTERVIEW_AUDIENCES,
  normalizeAccessMode,
  normalizeCohortBasisPoints,
  resolveInterviewAudience,
  stableCohortBucket,
};
