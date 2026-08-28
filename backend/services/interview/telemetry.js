'use strict';

const { captureMetric } = require('../../config/sentry');

const EVENT_NAMES = new Set([
  'availability_checked',
  'create_started',
  'create_succeeded',
  'create_failed',
  'resumed',
  'save_conflict',
  'deadline_rejected',
  'mcq_submitted',
  'timed_out',
  'abandoned',
  'completed',
  'technical_voided',
  'quota_denied',
  'rate_denied',
  'rate_limit_unavailable',
  'rate_limit_fallback',
  'artifact_unavailable',
  'inventory_exhausted',
  'selection_overlap',
  'readiness_checked',
  'request_failed',
]);

const BOOLEAN_FIELDS = new Set(['protectedWindow', 'quotaRestored', 'replayed', 'storeFallback']);
const NUMBER_FIELDS = new Set([
  'count',
  'httpStatus',
  'literalOverlap',
  'semanticOverlap',
  'selectionPolicyVersion',
  'targetExposureCount',
]);
const STRING_FIELDS = new Set([
  'accessMode',
  'artifactKind',
  'artifactStatus',
  'code',
  'format',
  'level',
  'limiter',
  'operation',
  'operationalState',
  'outcome',
  'reasonCode',
  'readinessCode',
  'redisCode',
  'statusFrom',
  'statusTo',
  'track',
]);

const STRING_VALUE_ALLOWLISTS = Object.freeze({
  accessMode: new Set(['off', 'internal', 'cohort', 'public']),
  artifactKind: new Set(['mcq', 'coding', 'system-design']),
  artifactStatus: new Set(['candidate', 'editorial-gold', 'calibrated-gold']),
  code: new Set([
    'not_configured', 'timeout', 'network_error', 'http_error', 'invalid_response',
    'command_error', 'ready', 'probe_not_run', 'rate_limit_allowed',
    'rate_limit_unavailable', 'test_rate_limited',
    'interview_artifacts_blocked', 'interview_dependencies_blocked',
    'interview_release_ready', 'interview_content_unavailable',
    'interview_create_ip_rate_limited', 'interview_create_user_rate_limited',
    'interview_desktop_required', 'interview_idempotency_conflict',
    'interview_invalid_check_phase', 'interview_json_required',
    'interview_mcq_deadline_passed', 'interview_mcq_ingress_timeout',
    'interview_mode_disabled', 'interview_monthly_quota_exhausted',
    'interview_mutation_rate_limited', 'interview_outer_rate_limited',
    'interview_release_not_ready', 'interview_request_failed',
    'interview_request_too_large', 'interview_selection_unavailable',
    'interview_twist_reveal_rate_limited', 'interview_version_conflict',
  ]),
  format: new Set(['coding', 'system-design']),
  level: new Set(['junior', 'mid', 'senior']),
  limiter: new Set([
    'interview-create-ip', 'interview-create-user', 'interview-launch-readiness',
    'interview-mutations', 'interview-outer-ip',
    'interview-system-design-twist-reveal',
  ]),
  operation: new Set([
    'abandon', 'active-resume', 'availability', 'bulk-technical-void',
    'coding-check', 'coding-draft', 'coding-start', 'coding-submit', 'control',
    'create', 'mcq-answer', 'mcq-submit', 'release-gate', 'results',
    'session-resume', 'system-design-draft', 'system-design-submit',
    'system-design-twist', 'technical-void', 'unknown',
  ]),
  operationalState: new Set(['normal', 'drain', 'halt']),
  outcome: new Set([
    'abandoned', 'available', 'blocked', 'not_started_timeout', 'pending', 'ready',
    'submitted', 'timed_out', 'unavailable',
  ]),
  reasonCode: new Set([
    'content_integrity', 'platform_outage', 'preview_runtime',
    'runner_unavailable', 'starter_unavailable',
  ]),
  readinessCode: new Set([
    'interview_artifacts_blocked', 'interview_dependencies_blocked',
    'interview_release_disabled', 'interview_release_ready',
  ]),
  redisCode: new Set([
    'not_configured', 'timeout', 'network_error', 'http_error', 'invalid_response',
    'command_error', 'ready', 'probe_not_run',
  ]),
  statusFrom: new Set([
    'mcq_active', 'coding_ready', 'coding_active', 'system_design_active',
    'completed', 'abandoned', 'voided_technical',
  ]),
  statusTo: new Set([
    'mcq_active', 'coding_ready', 'coding_active', 'system_design_active',
    'completed', 'abandoned', 'voided_technical',
  ]),
  track: new Set(['core-web', 'react', 'angular', 'vue']),
});

function telemetryEnabled(env = process.env) {
  const raw = String(env.INTERVIEW_TELEMETRY_ENABLED || '').trim().toLowerCase();
  if (raw) return ['1', 'true', 'yes', 'on'].includes(raw);
  return String(env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function sanitizeFields(fields) {
  const source = fields && typeof fields === 'object' ? fields : {};
  const safe = {};
  for (const [key, value] of Object.entries(source)) {
    if (BOOLEAN_FIELDS.has(key) && typeof value === 'boolean') {
      safe[key] = value;
      continue;
    }
    if (NUMBER_FIELDS.has(key)) {
      const number = Number(value);
      if (Number.isFinite(number)) safe[key] = Math.max(0, Math.min(1_000_000, number));
      continue;
    }
    if (STRING_FIELDS.has(key)) {
      const text = String(value || '').trim().toLowerCase();
      if (STRING_VALUE_ALLOWLISTS[key]?.has(text)) safe[key] = text;
    }
  }
  return safe;
}

function recordInterviewMetric(entry) {
  const attributes = { event: entry.name };
  for (const [key, value] of Object.entries(entry)) {
    if (
      ['at', 'count', 'literalOverlap', 'name', 'semanticOverlap', 'targetExposureCount', 'type']
        .includes(key)
    ) continue;
    attributes[key] = value;
  }
  captureMetric('count', 'interview.lifecycle', 1, { attributes });

  if (entry.name !== 'selection_overlap') return;
  captureMetric('distribution', 'interview.selection.literal_overlap', entry.literalOverlap || 0, {
    attributes,
  });
  captureMetric('distribution', 'interview.selection.semantic_overlap', entry.semanticOverlap || 0, {
    attributes,
  });
  captureMetric(
    'distribution',
    'interview.selection.target_exposure_count',
    entry.targetExposureCount || 0,
    { attributes }
  );
}

function emitInterviewEvent(nameRaw, fields = {}, {
  env = process.env,
  now = new Date(),
  sink = (entry) => console.log(JSON.stringify(entry)),
  metricSink = recordInterviewMetric,
} = {}) {
  if (!telemetryEnabled(env)) return false;
  const name = String(nameRaw || '').trim().toLowerCase();
  if (!EVENT_NAMES.has(name)) return false;
  const entry = {
    type: 'interview_event',
    name,
    at: now.toISOString(),
    ...sanitizeFields(fields),
  };
  try {
    sink(entry);
  } catch {
    // Telemetry must never change request behavior.
  }
  try {
    metricSink(entry);
  } catch {
    // Metrics are best-effort and contain no user payload.
  }
  return true;
}

module.exports = {
  EVENT_NAMES,
  emitInterviewEvent,
  recordInterviewMetric,
  sanitizeFields,
  telemetryEnabled,
};
