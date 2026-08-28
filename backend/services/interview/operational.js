'use strict';

const INTERVIEW_OPERATIONAL_STATES = Object.freeze(['normal', 'drain', 'halt']);
const DEFAULT_SHUTDOWN_NOTICES = Object.freeze({
  drain: 'Interview Mode is temporarily not accepting new sessions. Active sessions can continue.',
  halt: 'Interview Mode is temporarily unavailable. Active sessions cannot continue.',
});

function normalizeOperationalState(value, { missing = 'normal' } = {}) {
  if (value === undefined || value === null) return missing;
  const configured = String(value).trim().toLowerCase();
  return INTERVIEW_OPERATIONAL_STATES.includes(configured) ? configured : 'halt';
}

function interviewOperationalState(env = process.env) {
  return normalizeOperationalState(env.INTERVIEW_OPERATIONAL_STATE);
}

function interviewShutdownNotice(state = interviewOperationalState(), env = process.env) {
  const normalizedState = normalizeOperationalState(state);
  if (normalizedState === 'normal') return null;

  const configured = String(env.INTERVIEW_SHUTDOWN_NOTICE || '').trim();
  return configured
    ? configured.slice(0, 500)
    : DEFAULT_SHUTDOWN_NOTICES[normalizedState];
}

function interviewOperationalPolicy(options = {}) {
  const env = options.env || process.env;
  const state = options.state === undefined
    ? interviewOperationalState(env)
    : normalizeOperationalState(options.state);
  const canStartNew = state === 'normal';
  const activeSessionPolicy = state === 'halt' ? 'halted' : 'continue';

  return {
    state,
    canStartNew,
    activeSessionPolicy,
    shutdownNotice: interviewShutdownNotice(state, env),
    routePolicy: {
      discovery: state === 'normal',
      create: canStartNew,
      activeSession: activeSessionPolicy === 'continue',
      adminRecovery: true,
    },
  };
}

module.exports = {
  DEFAULT_SHUTDOWN_NOTICES,
  INTERVIEW_OPERATIONAL_STATES,
  interviewOperationalPolicy,
  interviewOperationalState,
  interviewShutdownNotice,
  normalizeOperationalState,
};
