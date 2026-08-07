'use strict';

const crypto = require('crypto');

const DEFAULT_BAND_PROFILE = { foundation: 1, core: 3, stretch: 1 };
const SENIOR_BAND_PROFILES = {
  'core-web': { foundation: 1, core: 1, stretch: 3 },
  react: DEFAULT_BAND_PROFILE,
  angular: { foundation: 1, core: 2, stretch: 2 },
  vue: DEFAULT_BAND_PROFILE,
};

const TRACK_TECH_COUNTS = {
  'core-web': { javascript: 3, html: 1, css: 1 },
  react: { javascript: 1, html: 1, css: 1, react: 2 },
  angular: { javascript: 1, html: 1, css: 1, angular: 2 },
  vue: { javascript: 1, html: 1, css: 1, vue: 2 },
};

class InterviewSelectionError extends Error {
  constructor(message, {
    code = 'INTERVIEW_SELECTION_UNAVAILABLE',
    statusCode = 503,
  } = {}) {
    super(message);
    this.name = 'InterviewSelectionError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function targetedSystemDesignError(code, message) {
  throw new InterviewSelectionError(message, { code, statusCode: 400 });
}

function seededRank(seed, value) {
  const digest = crypto
    .createHash('sha256')
    .update(`${seed}\0${value}`)
    .digest();
  return digest.readUInt32BE(0);
}

function deterministicShuffle(values, seed, namespace) {
  return values
    .map((value, index) => ({
      value,
      index,
      rank: seededRank(seed, `${namespace}:${index}:${JSON.stringify(value)}`),
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((entry) => entry.value);
}

function combinations(values, count, start = 0, prefix = [], out = []) {
  if (prefix.length === count) {
    out.push(prefix);
    return out;
  }
  const needed = count - prefix.length;
  for (let index = start; index <= values.length - needed; index += 1) {
    combinations(values, count, index + 1, [...prefix, values[index]], out);
  }
  return out;
}

function cartesianProduct(groups, index = 0, prefix = [], out = []) {
  if (index === groups.length) {
    out.push(prefix);
    return out;
  }
  for (const group of groups[index]) {
    cartesianProduct(groups, index + 1, [...prefix, ...group], out);
  }
  return out;
}

function exactCounts(values, field, expected) {
  const counts = Object.create(null);
  for (const value of values) {
    const key = value[field];
    counts[key] = (counts[key] || 0) + 1;
  }
  const expectedKeys = Object.keys(expected);
  if (Object.keys(counts).some((key) => !(key in expected))) return false;
  return expectedKeys.every((key) => (counts[key] || 0) === expected[key]);
}

function bandProfileFor(track, level) {
  return level === 'senior'
    ? SENIOR_BAND_PROFILES[track]
    : DEFAULT_BAND_PROFILE;
}

function questionCombinationEligible(combo, track, level) {
  if (!exactCounts(combo, 'technology', TRACK_TECH_COUNTS[track])) return false;
  if (!exactCounts(combo, 'difficultyBand', bandProfileFor(track, level))) return false;
  const productionCount = combo.filter((item) => item.format === 'production-scenario').length;
  const outputCount = combo.filter((item) => item.format === 'code-output').length;
  return productionCount >= 1 && outputCount <= 1;
}

function eligibleQuestionForms({ questions, track, level }) {
  const expectedTech = TRACK_TECH_COUNTS[track];
  const expectedBands = bandProfileFor(track, level);
  if (!expectedTech || !expectedBands) {
    throw new InterviewSelectionError('Unsupported interview selection');
  }
  const eligible = questions.filter(
    (question) => question.level === level && question.technology in expectedTech
  );
  const sourceOrder = new Map(eligible.map((question, index) => [question, index]));
  const technologyGroups = Object.entries(expectedTech).map(([technology, count]) =>
    combinations(
      eligible.filter((question) => question.technology === technology),
      count
    )
  );
  if (technologyGroups.some((group) => group.length === 0)) return [];
  return cartesianProduct(technologyGroups)
    .map((combo) => combo.sort(
      (left, right) => sourceOrder.get(left) - sourceOrder.get(right)
    ))
    .filter((combo) => questionCombinationEligible(combo, track, level))
    .sort((left, right) => {
      for (let index = 0; index < left.length; index += 1) {
        const difference = sourceOrder.get(left[index]) - sourceOrder.get(right[index]);
        if (difference !== 0) return difference;
      }
      return 0;
    });
}

function compareCandidateScores(left, right) {
  if (left.totalSeen !== right.totalSeen) return left.totalSeen - right.totalSeen;
  if (left.maxSeen !== right.maxSeen) return left.maxSeen - right.maxSeen;
  if (left.repeatCount !== right.repeatCount) return left.repeatCount - right.repeatCount;
  if (left.newestSeenAt !== right.newestSeenAt) return left.newestSeenAt - right.newestSeenAt;
  if (left.recencySum !== right.recencySum) return left.recencySum - right.recencySum;
  return left.tieRank - right.tieRank;
}

function seenStat(value) {
  if (value && typeof value === 'object') {
    const timestamp = new Date(value.lastSeenAt || 0).getTime();
    return {
      count: Math.max(0, Number(value.count || 0)),
      lastSeenAt: Number.isFinite(timestamp) ? timestamp : 0,
    };
  }
  return { count: Math.max(0, Number(value || 0)), lastSeenAt: 0 };
}

function selectQuestions({ questions, track, level, seenCounts = new Map(), seed }) {
  const candidates = eligibleQuestionForms({ questions, track, level })
    .map((combo) => {
      const stats = combo.map((item) => seenStat(seenCounts.get(item.id)));
      const counts = stats.map((stat) => stat.count);
      const recencies = stats.map((stat) => stat.lastSeenAt);
      const key = combo.map((item) => item.id).sort().join('|');
      return {
        combo,
        totalSeen: counts.reduce((sum, count) => sum + count, 0),
        maxSeen: Math.max(...counts),
        repeatCount: counts.filter((count) => count > 0).length,
        newestSeenAt: Math.max(...recencies),
        recencySum: recencies.reduce((sum, timestamp) => sum + timestamp, 0),
        tieRank: seededRank(seed, `questions:${key}`),
      };
    })
    .sort(compareCandidateScores);

  if (!candidates.length) {
    throw new InterviewSelectionError(
      `No approved five-question form satisfies ${track}/${level}`
    );
  }

  return deterministicShuffle(candidates[0].combo, seed, 'question-order').map((question) => ({
    ...question,
    options: deterministicShuffle(question.options, seed, `options:${question.id}`),
  }));
}

function selectCodingVariant({ variants, track, level, seenCounts = new Map(), seed }) {
  const eligible = variants
    .filter((variant) => variant.enabled && variant.track === track && variant.level === level)
    .map((variant) => {
      const stat = seenStat(seenCounts.get(variant.id));
      return {
        variant,
        seen: stat.count,
        lastSeenAt: stat.lastSeenAt,
        tieRank: seededRank(seed, `coding:${variant.id}`),
      };
    })
    .sort(
      (left, right) =>
        left.seen - right.seen
        || left.lastSeenAt - right.lastSeenAt
        || left.tieRank - right.tieRank
    );
  if (!eligible.length) {
    throw new InterviewSelectionError(
      `No approved coding variant is enabled for ${track}/${level}`
    );
  }
  return eligible[0].variant;
}

function selectSystemDesignScenario({
  scenarios,
  level,
  seenCounts = new Map(),
  seed,
  sourceContentId = null,
  privateByKey = null,
}) {
  if (sourceContentId) {
    const privateMatches = privateByKey instanceof Map
      ? [...privateByKey.entries()].filter(([, privateScenario]) => (
        privateScenario?.sourceEvidence?.sourceContentId === sourceContentId
      ))
      : [];
    if (!privateMatches.length) {
      targetedSystemDesignError(
        'INTERVIEW_SYSTEM_DESIGN_SOURCE_INVALID',
        'The requested System Design source question is invalid'
      );
    }

    const matchingKeys = new Set(privateMatches.map(([key]) => key));
    const linkedScenarios = scenarios.filter((scenario) => (
      matchingKeys.has(`${scenario.id}@${scenario.revision}`)
    ));
    const enabledScenarios = linkedScenarios.filter((scenario) => scenario.enabled);
    if (enabledScenarios.length !== 1) {
      targetedSystemDesignError(
        'INTERVIEW_SYSTEM_DESIGN_SOURCE_UNAVAILABLE',
        'The requested System Design case is unavailable'
      );
    }

    const selected = enabledScenarios[0];
    if (selected.level !== level) {
      targetedSystemDesignError(
        'INTERVIEW_SYSTEM_DESIGN_SOURCE_LEVEL_MISMATCH',
        'The requested System Design case does not match the selected level'
      );
    }
    return selected;
  }

  const eligible = scenarios
    .filter((scenario) => scenario.enabled && scenario.level === level)
    .map((scenario) => {
      const stat = seenStat(seenCounts.get(scenario.id));
      return {
        scenario,
        seen: stat.count,
        lastSeenAt: stat.lastSeenAt,
        tieRank: seededRank(seed, `system-design:${scenario.id}`),
      };
    })
    .sort(
      (left, right) =>
        left.seen - right.seen
        || left.lastSeenAt - right.lastSeenAt
        || left.tieRank - right.tieRank
    );
  if (!eligible.length) {
    throw new InterviewSelectionError(
      `No approved System Design scenario is enabled for ${level}`
    );
  }
  return eligible[0].scenario;
}

function buildSystemDesignPresentationOrder({
  scenario,
  privateScenario,
  seed,
}) {
  if (!scenario || !privateScenario || !seed) {
    throw new InterviewSelectionError(
      'System Design presentation order requires a pinned scenario and seed'
    );
  }
  const shuffleIds = (values, namespace) => deterministicShuffle(
    (values || []).map((entry) => entry.id),
    seed,
    namespace
  );
  return {
    schemaVersion: '1.0.0',
    clarificationIds: shuffleIds(
      scenario.clarifications,
      `system-design:${scenario.id}:clarifications`
    ),
    requirementIds: shuffleIds(
      scenario.requirements,
      `system-design:${scenario.id}:requirements`
    ),
    cardIds: shuffleIds(
      scenario.cards,
      `system-design:${scenario.id}:cards`
    ),
    decisions: (scenario.decisions || []).map((decision) => ({
      decisionId: decision.id,
      optionIds: shuffleIds(
        decision.options,
        `system-design:${scenario.id}:decision:${decision.id}:options`
      ),
      rationaleIds: shuffleIds(
        decision.rationales,
        `system-design:${scenario.id}:decision:${decision.id}:rationales`
      ),
    })),
    twistActionIds: shuffleIds(
      privateScenario.twist?.responseActions,
      `system-design:${scenario.id}:twist-actions`
    ),
  };
}

module.exports = {
  DEFAULT_BAND_PROFILE,
  SENIOR_BAND_PROFILES,
  TRACK_TECH_COUNTS,
  InterviewSelectionError,
  bandProfileFor,
  buildSystemDesignPresentationOrder,
  deterministicShuffle,
  eligibleQuestionForms,
  selectCodingVariant,
  selectQuestions,
  selectSystemDesignScenario,
};
