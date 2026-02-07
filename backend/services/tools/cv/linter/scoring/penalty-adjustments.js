'use strict';

const EXTRACTION_PENALTY_WEIGHTS = Object.freeze({
  high: 1,
  medium: 0.7,
  low: 0.4,
});

const BULLET_DEPENDENT_ISSUE_IDS = new Set([
  'no_outcome_language',
  'low_bullet_count',
  'low_numeric_density',
  'keyword_missing',
]);

const KEYWORD_EXPERIENCE_DEPENDENT_SHARE = 0.65;

function roundDelta(value) {
  return Number(value.toFixed(2));
}

function applyKeywordAdjustment(baseDelta, extractionWeight) {
  const stableShare = 1 - KEYWORD_EXPERIENCE_DEPENDENT_SHARE;
  return (
    (baseDelta * stableShare)
    + (baseDelta * KEYWORD_EXPERIENCE_DEPENDENT_SHARE * extractionWeight)
  );
}

function applyExtractionPenaltyAdjustments(issues = [], extractionQuality) {
  const level = extractionQuality?.level || 'high';
  const extractionWeight = EXTRACTION_PENALTY_WEIGHTS[level] ?? 1;

  if (extractionWeight >= 1) {
    return issues.map((issue) => ({
      ...issue,
      appliedScoreDelta: Number(issue.scoreDelta || 0),
      scoreAdjustment: 1,
    }));
  }

  return issues.map((issue) => {
    const baseDelta = Number(issue.scoreDelta || 0);
    if (baseDelta >= 0 || !BULLET_DEPENDENT_ISSUE_IDS.has(issue.id)) {
      return {
        ...issue,
        appliedScoreDelta: baseDelta,
        scoreAdjustment: 1,
      };
    }

    const adjustedDelta = issue.id === 'keyword_missing'
      ? applyKeywordAdjustment(baseDelta, extractionWeight)
      : (baseDelta * extractionWeight);

    return {
      ...issue,
      appliedScoreDelta: roundDelta(adjustedDelta),
      scoreAdjustment: extractionWeight,
    };
  });
}

module.exports = {
  EXTRACTION_PENALTY_WEIGHTS,
  BULLET_DEPENDENT_ISSUE_IDS,
  KEYWORD_EXPERIENCE_DEPENDENT_SHARE,
  applyExtractionPenaltyAdjustments,
};
