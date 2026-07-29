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

function designCollections(draft) {
  const value = draft || {};
  return {
    clarificationIds: new Set(value.clarificationIds || []),
    priorityRanks: new Map(
      (value.priorityRequirementIds || []).map((id, index) => [id, index + 1])
    ),
    placements: new Map(
      (value.placements || []).map((entry) => [entry.cardId, entry])
    ),
    connections: value.connections || [],
    decisions: new Map(
      (value.decisions || []).map((entry) => [entry.decisionId, entry])
    ),
    twistActionIds: new Set(value.twistResponseActionIds || []),
  };
}

function stableComparable(value) {
  if (Array.isArray(value)) {
    return value
      .map(stableComparable)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stableComparable(value[key])])
  );
}

function changedFromBaseline(target, id, draft, baseline) {
  if (!baseline) return false;
  const current = designCollections(draft);
  const previous = designCollections(baseline);
  if (target === 'placement') {
    const currentPlacement = current.placements.get(id);
    if (!currentPlacement) return false;
    return JSON.stringify(stableComparable(currentPlacement))
      !== JSON.stringify(stableComparable(previous.placements.get(id) || null));
  }
  if (target === 'decision') {
    const currentDecision = current.decisions.get(id);
    if (!currentDecision) return false;
    return currentDecision.optionId !== previous.decisions.get(id)?.optionId;
  }
  if (target === 'connections') {
    const relevant = (values) => {
      if (!id) return values;
      return values.filter((entry) => (
        entry.fromCardId === id
        || entry.toCardId === id
        || `${entry.fromCardId}>${entry.toCardId}:${entry.typeId}` === id
      ));
    };
    return JSON.stringify(stableComparable(relevant(current.connections)))
      !== JSON.stringify(stableComparable(relevant(previous.connections)));
  }
  return false;
}

function evaluateDesignRule(rule, draft, baseline) {
  if (!rule || typeof rule !== 'object') return { active: true, matched: false };
  if (Array.isArray(rule.allOf)) {
    const children = rule.allOf.map((child) => evaluateDesignRule(child, draft, baseline));
    const active = children.filter((child) => child.active);
    return {
      active: active.length > 0,
      matched: active.length > 0 && active.every((child) => child.matched),
    };
  }
  if (Array.isArray(rule.anyOf)) {
    const children = rule.anyOf.map((child) => evaluateDesignRule(child, draft, baseline));
    const active = children.filter((child) => child.active);
    return {
      active: active.length > 0,
      matched: active.some((child) => child.matched),
    };
  }
  if (rule.not) {
    const child = evaluateDesignRule(rule.not, draft, baseline);
    return { active: child.active, matched: child.active && !child.matched };
  }
  if (rule.when) {
    const condition = evaluateDesignRule(rule.when.if, draft, baseline);
    if (!condition.active || !condition.matched) return { active: false, matched: false };
    return evaluateDesignRule(rule.when.then, draft, baseline);
  }

  const collections = designCollections(draft);
  let matched = false;
  switch (rule.predicate) {
    case 'clarificationSelected':
      matched = collections.clarificationIds.has(rule.clarificationId);
      break;
    case 'requirementPrioritized': {
      const rank = collections.priorityRanks.get(rule.requirementId);
      matched = Boolean(rank) && (
        rule.maxRank == null
        || rank <= Number(rule.maxRank)
      );
      break;
    }
    case 'cardInLane':
      matched = collections.placements.get(rule.cardId)?.laneId === rule.laneId;
      break;
    case 'connectionExists':
      matched = collections.connections.some((entry) => (
        entry.fromCardId === rule.fromCardId
        && entry.toCardId === rule.toCardId
        && entry.typeId === rule.typeId
      ));
      break;
    case 'decisionSelected':
      matched = collections.decisions.get(rule.decisionId)?.optionId === rule.optionId;
      break;
    case 'rationaleSelected':
      matched = (
        collections.decisions.get(rule.decisionId)?.rationaleIds || []
      ).includes(rule.rationaleId);
      break;
    case 'twistActionSelected':
      matched = collections.twistActionIds.has(rule.actionId);
      break;
    case 'changedFromBaseline':
      matched = changedFromBaseline(rule.target, rule.id, draft, baseline);
      break;
    default:
      matched = false;
  }
  return { active: true, matched };
}

function axisStatus(earnedWeight, activeWeight) {
  if (activeWeight <= 0) return 'not-evaluated';
  const ratio = earnedWeight / activeWeight;
  if (ratio >= 0.75) return 'strong-evidence';
  if (ratio >= 0.4) return 'developing';
  return 'needs-focus';
}

function capAxisStatus(status, cap) {
  const order = ['not-evaluated', 'needs-focus', 'developing', 'strong-evidence'];
  return order[Math.min(order.indexOf(status), order.indexOf(cap))];
}

function designPracticeSignal(axes, contradictions) {
  const evidenced = axes.filter((axis) => axis.earnedWeight > 0).length;
  if (evidenced < 3) return 'not-enough-evidence';
  const strong = axes.filter((axis) => axis.status === 'strong-evidence').length;
  const developingOrBetter = axes.filter(
    (axis) => ['developing', 'strong-evidence'].includes(axis.status)
  ).length;
  const needsFocus = axes.filter((axis) => axis.status === 'needs-focus').length;
  const critical = contradictions.some((entry) => entry.severity === 'critical');
  if (strong >= 4 && needsFocus === 0 && !critical) {
    return 'strong-system-design-session';
  }
  if (developingOrBetter >= 4 && needsFocus <= 1 && !critical) return 'on-track';
  return 'needs-focus';
}

function publicDesignDraft(draft) {
  if (!draft) return null;
  return {
    currentStep: String(draft.currentStep || 'clarifications'),
    clarificationIds: [...(draft.clarificationIds || [])],
    priorityRequirementIds: [...(draft.priorityRequirementIds || [])],
    placements: (draft.placements || []).map((entry) => ({
      cardId: entry.cardId,
      laneId: entry.laneId,
      order: entry.order,
    })),
    connections: (draft.connections || []).map((entry) => ({
      fromCardId: entry.fromCardId,
      toCardId: entry.toCardId,
      typeId: entry.typeId,
    })),
    decisions: (draft.decisions || []).map((entry) => ({
      decisionId: entry.decisionId,
      optionId: entry.optionId,
      rationaleIds: [...(entry.rationaleIds || [])],
    })),
    twistResponseActionIds: [...(draft.twistResponseActionIds || [])],
  };
}

function systemDesignSummary(scenario, privateScenario, draft) {
  const requirementById = new Map(
    (scenario.requirements || []).map((entry) => [entry.id, entry])
  );
  const cardById = new Map((scenario.cards || []).map((entry) => [entry.id, entry]));
  const connectionTypeById = new Map(
    (scenario.connectionTypes || []).map((entry) => [entry.id, entry])
  );
  const decisionById = new Map(
    (scenario.decisions || []).map((entry) => [entry.id, entry])
  );
  const twistActionById = new Map(
    (privateScenario.twist?.responseActions || []).map((entry) => [entry.id, entry])
  );
  return {
    priorities: draft.priorityRequirementIds.map((requirementId, index) => ({
      id: requirementId,
      title: requirementById.get(requirementId)?.title || requirementId,
      rank: index + 1,
    })),
    lanes: (scenario.lanes || []).map((lane) => ({
      id: lane.id,
      title: lane.title,
      cards: draft.placements
        .filter((placement) => placement.laneId === lane.id)
        .sort((left, right) => left.order - right.order)
        .map((placement) => ({
          id: placement.cardId,
          title: cardById.get(placement.cardId)?.title || placement.cardId,
          order: placement.order,
        })),
    })).filter((lane) => lane.cards.length > 0),
    connections: draft.connections.map((connection) => ({
      fromCardId: connection.fromCardId,
      fromTitle: cardById.get(connection.fromCardId)?.title || connection.fromCardId,
      toCardId: connection.toCardId,
      toTitle: cardById.get(connection.toCardId)?.title || connection.toCardId,
      typeId: connection.typeId,
      typeTitle: connectionTypeById.get(connection.typeId)?.title || connection.typeId,
    })),
    decisions: draft.decisions.map((selection) => {
      const decision = decisionById.get(selection.decisionId);
      const option = decision?.options?.find((entry) => entry.id === selection.optionId);
      const rationaleById = new Map(
        (decision?.rationales || []).map((entry) => [entry.id, entry])
      );
      return {
        id: selection.decisionId,
        title: decision?.title || selection.decisionId,
        option: {
          id: selection.optionId,
          label: option?.label || selection.optionId,
        },
        rationales: selection.rationaleIds.map((rationaleId) => ({
          id: rationaleId,
          label: rationaleById.get(rationaleId)?.label || rationaleId,
        })),
      };
    }),
    twistActions: draft.twistResponseActionIds.map((actionId) => ({
      id: actionId,
      label: twistActionById.get(actionId)?.label || actionId,
    })),
  };
}

function buildSystemDesignResult(plain, finalizedAt) {
  const scenario = plain.systemDesignScenario || {};
  const privateScenario = plain.systemDesignPrivate || {};
  const draft = publicDesignDraft(plain.systemDesignDraft) || publicDesignDraft({});
  const baseline = publicDesignDraft(plain.systemDesignBaseline);
  const axes = (privateScenario.rubric?.axes || []).map((axis) => {
    let activeWeight = 0;
    let earnedWeight = 0;
    const evidence = [];
    for (const criterion of axis.criteria || []) {
      const result = evaluateDesignRule(criterion.rule, draft, baseline);
      if (!result.active) continue;
      activeWeight += Number(criterion.weight || 0);
      if (result.matched) {
        earnedWeight += Number(criterion.weight || 0);
        evidence.push(criterion.evidence);
      }
    }
    return {
      id: axis.id,
      title: axis.title,
      status: axisStatus(earnedWeight, activeWeight),
      evidence,
      activeWeight,
      earnedWeight,
      remediationTopics: [...(axis.remediationTopics || [])],
    };
  });
  const contradictions = (privateScenario.rubric?.contradictions || [])
    .filter((entry) => evaluateDesignRule(entry.rule, draft, baseline).matched)
    .map((entry) => ({
      id: entry.id,
      severity: entry.severity,
      axisIds: [...(entry.axisIds || [])],
      summary: entry.summary,
    }));
  for (const contradiction of contradictions) {
    for (const axis of axes) {
      if (contradiction.axisIds.includes(axis.id)) {
        axis.status = contradiction.severity === 'critical'
          ? 'needs-focus'
          : capAxisStatus(axis.status, 'developing');
      }
    }
  }
  const remediation = aggregateRemediation(
    axes
      .filter((axis) => axis.status !== 'strong-evidence')
      .flatMap((axis) => axis.remediationTopics)
  );
  const allowedSeconds = Number(
    plain.timingPolicy?.systemDesignSeconds
    || scenario.timeLimitSeconds
    || 0
  );
  const endedAt = plain.systemDesignSubmittedAt
    || plain.completedAt
    || plain.abandonedAt
    || plain.systemDesignDeadlineAt
    || finalizedAt;
  const incomplete = (
    draft.clarificationIds.length === 0
    || draft.priorityRequirementIds.length < Number(scenario.selectionLimits?.priorities || 0)
    || draft.placements.length === 0
    || draft.connections.length === 0
    || draft.decisions.length < (scenario.decisions || []).length
    || draft.decisions.some((decision) => decision.rationaleIds.length === 0)
    || draft.twistResponseActionIds.length === 0
    || !plain.systemDesignTwistRevealedAt
  );
  const practiceSignal = designPracticeSignal(axes, contradictions);
  const publicAxes = axes.map((axis) => ({
    id: axis.id,
    title: axis.title,
    status: axis.status,
    evidence: axis.evidence,
    remediationTopics: axis.remediationTopics,
  }));
  return {
    schemaVersion: '1.0.0',
    sessionId: String(plain._id),
    finalizedAt: new Date(finalizedAt).toISOString(),
    interviewFormat: 'system-design',
    level: plain.level,
    track: plain.track,
    timingMode: plain.timingMode,
    xpAwarded: 0,
    mcq: null,
    coding: null,
    systemDesign: {
      scenarioId: scenario.id || null,
      scenarioTitle: scenario.title || '',
      sourceContentId: privateScenario.sourceEvidence?.sourceContentId || null,
      outcome: plain.systemDesignOutcome,
      practiceSignal,
      timing: {
        usedSeconds: durationSeconds(plain.systemDesignStartedAt, endedAt, allowedSeconds),
        allowedSeconds,
      },
      frameworkLens: scenario.frameworkLenses?.[plain.track] || null,
      axes: publicAxes,
      contradictions,
      remediation,
      design: draft,
      summary: systemDesignSummary(scenario, privateScenario, draft),
      partialEvidence: incomplete || plain.systemDesignOutcome !== 'submitted',
    },
    reviewNext: remediation,
    employmentPrediction: null,
    evidenceNotice: (
      'This guided mock reports deterministic practice evidence, not an '
      + 'employment prediction or a calibrated hiring decision.'
    ),
  };
}

function buildResultSnapshot(session, { finalizedAt = new Date() } = {}) {
  const plain = asPlain(session);
  if ((plain.format || 'coding') === 'system-design') {
    return buildSystemDesignResult(plain, finalizedAt);
  }
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
      ...(question.code && question.codeLanguage
        ? { codeLanguage: question.codeLanguage }
        : {}),
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
    interviewFormat: 'coding',
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
    systemDesign: null,
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
  evaluateDesignRule,
};
