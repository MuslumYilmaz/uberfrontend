'use strict';

const { buildResultSnapshot } = require('./scoring');

const TERMINAL_STATUSES = new Set([
  'completed',
  'abandoned',
  'voided_technical',
]);

function addSeconds(date, seconds) {
  return new Date(new Date(date).getTime() + seconds * 1000);
}

function finalizeCompleted(session, at, outcome) {
  session.status = 'completed';
  session.active = false;
  if ((session.format || 'coding') === 'system-design') {
    session.systemDesignOutcome = outcome;
    if (outcome === 'submitted') session.systemDesignSubmittedAt = new Date(at);
  } else {
    session.codingOutcome = outcome;
  }
  session.completedAt = new Date(at);
  session.resultSnapshot = buildResultSnapshot(session, { finalizedAt: at });
}

function timingSeconds(session, key, fallback) {
  const snapshotted = Number(session.timingPolicy?.[key]);
  if (Number.isFinite(snapshotted) && snapshotted > 0) return snapshotted;
  return Number(fallback);
}

function enterCodingReady(session, at, config) {
  const codingReadySeconds = timingSeconds(
    session,
    'codingReadySeconds',
    config?.codingReadySeconds
  );
  session.status = 'coding_ready';
  session.mcqSubmittedAt = new Date(at);
  session.codingReadyAt = new Date(at);
  session.codingReadyDeadlineAt = addSeconds(at, codingReadySeconds);
}

function evaluateMcqMutationAdmission(session, {
  requestReceivedAt,
  requestCompletedAt,
  config,
} = {}) {
  const receivedAt = new Date(requestReceivedAt);
  const completedAt = new Date(requestCompletedAt);
  const deadlineAt = new Date(session.mcqDeadlineAt);
  const receivedMs = receivedAt.getTime();
  const completedMs = completedAt.getTime();
  const deadlineMs = deadlineAt.getTime();
  const maxIngressSeconds = timingSeconds(
    session,
    'mcqMaxIngressSeconds',
    config?.mcqMaxIngressSeconds
  );
  const maxIngressMs = maxIngressSeconds * 1000;

  if (
    !Number.isFinite(receivedMs)
    || !Number.isFinite(completedMs)
    || !Number.isFinite(deadlineMs)
    || !Number.isFinite(maxIngressMs)
    || maxIngressMs <= 0
    || completedMs < receivedMs
    || completedMs - receivedMs > maxIngressMs
  ) {
    return {
      accepted: false,
      code: 'INTERVIEW_MCQ_INGRESS_TIMEOUT',
      deadlineAt,
      maxIngressSeconds,
      requestCompletedAt: completedAt,
      requestReceivedAt: receivedAt,
    };
  }
  if (receivedMs > deadlineMs) {
    return {
      accepted: false,
      code: 'INTERVIEW_MCQ_DEADLINE_PASSED',
      deadlineAt,
      maxIngressSeconds,
      requestCompletedAt: completedAt,
      requestReceivedAt: receivedAt,
    };
  }
  return {
    accepted: true,
    // A bounded request that straddles the deadline is admitted at the
    // deadline, while a normally completed request uses its server completion
    // time. Client clocks never participate in this decision.
    acceptedAt: new Date(Math.min(completedMs, deadlineMs)),
    deadlineAt,
    maxIngressSeconds,
    requestCompletedAt: completedAt,
    requestReceivedAt: receivedAt,
  };
}

function reconcileSession(session, now, config) {
  const nowDate = new Date(now);
  let changed = false;
  let keepReconciling = true;

  while (keepReconciling && !TERMINAL_STATUSES.has(session.status)) {
    keepReconciling = false;
    if (
      session.status === 'system_design_active'
      && new Date(session.systemDesignDeadlineAt).getTime() <= nowDate.getTime()
    ) {
      finalizeCompleted(session, new Date(session.systemDesignDeadlineAt), 'timed_out');
      changed = true;
      continue;
    }
    if (
      session.status === 'mcq_active'
      && new Date(session.mcqDeadlineAt).getTime() <= nowDate.getTime()
    ) {
      enterCodingReady(session, new Date(session.mcqDeadlineAt), config);
      changed = true;
      keepReconciling = true;
      continue;
    }
    if (
      session.status === 'coding_ready'
      && new Date(session.codingReadyDeadlineAt).getTime() <= nowDate.getTime()
    ) {
      finalizeCompleted(
        session,
        new Date(session.codingReadyDeadlineAt),
        'not_started_timeout'
      );
      changed = true;
      continue;
    }
    if (
      session.status === 'coding_active'
      && new Date(session.codingDeadlineAt).getTime() <= nowDate.getTime()
    ) {
      finalizeCompleted(session, new Date(session.codingDeadlineAt), 'timed_out');
      changed = true;
    }
  }
  return changed;
}

function submitMcq(session, now, config) {
  if (session.status !== 'mcq_active') return false;
  enterCodingReady(session, now, config);
  return true;
}

function startCoding(session, now) {
  if (session.status !== 'coding_ready') return false;
  session.status = 'coding_active';
  session.codingStartedAt = new Date(now);
  session.codingDeadlineAt = addSeconds(
    now,
    timingSeconds(session, 'codingSeconds', session.codingVariant.timeLimitSeconds)
  );
  return true;
}

function submitCoding(session, now, draftHash) {
  if (session.status !== 'coding_active') return false;
  session.codingSubmittedAt = new Date(now);
  session.submittedDraftHash = draftHash;
  finalizeCompleted(session, now, 'submitted');
  return true;
}

function submitSystemDesign(session, now) {
  if (session.status !== 'system_design_active') return false;
  finalizeCompleted(session, now, 'submitted');
  return true;
}

function abandonSession(session, now) {
  if (TERMINAL_STATUSES.has(session.status)) return false;
  session.status = 'abandoned';
  session.active = false;
  if ((session.format || 'coding') === 'system-design') {
    session.systemDesignOutcome = 'abandoned';
  } else {
    session.codingOutcome = 'abandoned';
  }
  session.abandonedAt = new Date(now);
  session.resultSnapshot = buildResultSnapshot(session, { finalizedAt: now });
  return true;
}

function voidSessionTechnical(session, now) {
  if (TERMINAL_STATUSES.has(session.status)) return false;
  session.status = 'voided_technical';
  session.active = false;
  session.completedAt = new Date(now);
  return true;
}

module.exports = {
  TERMINAL_STATUSES,
  abandonSession,
  addSeconds,
  evaluateMcqMutationAdmission,
  reconcileSession,
  startCoding,
  submitCoding,
  submitSystemDesign,
  submitMcq,
  voidSessionTechnical,
};
