'use strict';

function asPlain(value) {
  if (value && typeof value.toObject === 'function') {
    return value.toObject({ depopulate: true });
  }
  return value;
}

function aggregateRemediation(topics) {
  const counts = new Map();
  for (const topicRaw of topics) {
    const topic = String(topicRaw || '').trim();
    if (!topic) continue;
    counts.set(topic, (counts.get(topic) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, evidenceCount]) => ({ topic, evidenceCount }))
    .sort(
      (left, right) =>
        right.evidenceCount - left.evidenceCount
        || left.topic.localeCompare(right.topic)
    )
    .slice(0, 3);
}

function emptyBreakdown() {
  return { total: 0, correct: 0, incorrect: 0, unanswered: 0 };
}

function durationSeconds(start, end, allowedSeconds) {
  if (!start || !end) return 0;
  const elapsed = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  );
  return Math.min(Math.max(0, Number(allowedSeconds) || elapsed), elapsed);
}

function practiceRubric(codingVariant) {
  const requirements = Array.isArray(codingVariant?.publicRequirements)
    ? codingVariant.publicRequirements
    : [];
  return requirements.map((requirement) => {
    const criteria = [
      String(requirement.prompt || '').trim(),
      ...(Array.isArray(requirement.constraints) ? requirement.constraints : []),
    ].map((entry) => String(entry || '').trim()).filter(Boolean);
    return {
      id: String(requirement.id || ''),
      title: String(requirement.title || requirement.id || ''),
      criteria,
      checkIds: [],
      // Browser checks are intentionally self-reported practice evidence. A
      // backend sandbox is required before any rubric item can be evaluated.
      status: 'not_evaluated',
    };
  });
}

function buildResultSnapshot(session, { finalizedAt = new Date() } = {}) {
  const plain = asPlain(session);
  const responses = new Map(
    (plain.mcqResponses || []).map((entry) => [entry.questionId, entry.selectedOptionId || null])
  );
  const answerKeys = new Map(
    (plain.answerKey || []).map((entry) => [entry.id, entry])
  );
  const missedTopics = [];
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const breakdown = {
    core: emptyBreakdown(),
    framework: emptyBreakdown(),
  };

  const questions = (plain.questions || []).map((question) => {
    const answer = answerKeys.get(question.id);
    if (!answer) throw new Error(`Missing answer key for ${question.id}`);
    const selectedOptionId = responses.get(question.id) || null;
    const isUnanswered = !selectedOptionId;
    const isCorrect = !isUnanswered && selectedOptionId === answer.correctOptionId;
    if (isUnanswered) unanswered += 1;
    else if (isCorrect) correct += 1;
    else incorrect += 1;
    const bucket = ['javascript', 'html', 'css'].includes(question.technology)
      ? breakdown.core
      : breakdown.framework;
    bucket.total += 1;
    if (isUnanswered) bucket.unanswered += 1;
    else if (isCorrect) bucket.correct += 1;
    else bucket.incorrect += 1;
    if (!isCorrect) missedTopics.push(...(answer.remediationTopics || []));

    const selectedRationale = (answer.optionRationales || [])
      .find((entry) => entry.optionId === selectedOptionId);
    return {
      id: question.id,
      revision: question.revision,
      technology: question.technology,
      competency: question.competency,
      prompt: question.prompt,
      ...(question.code ? { code: question.code } : {}),
      options: question.options,
      selectedOptionId,
      correctOptionId: answer.correctOptionId,
      outcome: isUnanswered ? 'unanswered' : (isCorrect ? 'correct' : 'incorrect'),
      explanation: answer.explanation || '',
      selectedOptionExplanation: selectedRationale?.explanation || '',
      remediationTopics: isCorrect ? [] : (answer.remediationTopics || []),
    };
  });

  const submittedHash = plain.submittedDraftHash || plain.codingDraft?.hash || null;
  const matchingRuns = (plain.codingCheckRuns || []).filter(
    (run) => submittedHash && run.draftHash === submittedHash
  );
  const latestMatchingRun = matchingRuns.length ? matchingRuns[matchingRuns.length - 1] : null;
  const codingRubric = practiceRubric(plain.codingVariant);

  const mcqAllowedSeconds = Math.max(
    0,
    Math.round(
      (new Date(plain.mcqDeadlineAt).getTime() - new Date(plain.mcqStartedAt).getTime()) / 1000
    )
  );
  const codingAllowedSeconds = Number(
    plain.timingPolicy?.codingSeconds
    || plain.codingVariant?.timeLimitSeconds
    || 0
  );
  const codingEndedAt = plain.codingSubmittedAt
    || plain.completedAt
    || plain.abandonedAt
    || plain.codingDeadlineAt
    || finalizedAt;

  return {
    schemaVersion: '1.0.0',
    sessionId: String(plain._id),
    finalizedAt: new Date(finalizedAt).toISOString(),
    level: plain.level,
    track: plain.track,
    timingMode: plain.timingMode,
    xpAwarded: 0,
    mcq: {
      total: questions.length,
      correct,
      incorrect,
      unanswered,
      breakdown,
      timing: {
        usedSeconds: durationSeconds(
          plain.mcqStartedAt,
          plain.mcqSubmittedAt || finalizedAt,
          mcqAllowedSeconds
        ),
        allowedSeconds: mcqAllowedSeconds,
      },
      questions,
    },
    coding: {
      variantId: plain.codingVariant?.id || null,
      sourceQuestionId: plain.codingVariant?.sourceQuestionId || null,
      outcome: plain.codingOutcome,
      submitted: plain.codingOutcome === 'submitted',
      draftHash: submittedHash,
      locallyVerified: Boolean(latestMatchingRun),
      authoritativeEvaluation: false,
      evidenceMode: 'client-self-report',
      timing: {
        usedSeconds: durationSeconds(
          plain.codingStartedAt,
          codingEndedAt,
          codingAllowedSeconds
        ),
        allowedSeconds: codingAllowedSeconds,
      },
      checkRun: latestMatchingRun
        ? {
          draftHash: latestMatchingRun.draftHash,
          passedCount: latestMatchingRun.passedCount,
          totalCount: latestMatchingRun.totalCount,
          checks: latestMatchingRun.checks || [],
          ranAt: new Date(latestMatchingRun.ranAt).toISOString(),
          evidenceSource: 'client-self-report',
          authoritative: false,
        }
        : null,
      rubric: codingRubric,
    },
    reviewNext: aggregateRemediation(missedTopics),
    employmentPrediction: null,
    evidenceNotice: (
      'Browser checks are self-reported practice evidence, not an authoritative '
      + 'evaluation or employment prediction.'
    ),
  };
}

module.exports = {
  aggregateRemediation,
  buildResultSnapshot,
};
