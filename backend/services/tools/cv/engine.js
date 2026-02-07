'use strict';

const { CATEGORY_LABELS, CATEGORY_MAX_SCORES, SEVERITY_ORDER } = require('./constants');
const { addEvidence } = require('./linter/evidence');
const {
  applyExtractionPenaltyAdjustments,
  EXTRACTION_PENALTY_WEIGHTS,
  KEYWORD_EXPERIENCE_DEPENDENT_SHARE,
} = require('./linter/scoring/penalty-adjustments');

const EXTRACTION_SENSITIVE_ISSUE_IDS = new Set([
  'no_outcome_language',
  'low_bullet_count',
  'low_numeric_density',
  'keyword_missing',
  'keyword_missing_critical',
  'merged_bullets_suspected',
]);

const BASE_CONFIDENCE_BY_SEVERITY = Object.freeze({
  critical: 0.93,
  warn: 0.82,
  info: 0.72,
});

const EXTRACTION_CONFIDENCE_MULTIPLIERS = Object.freeze({
  high: 1,
  medium: 0.82,
  low: 0.56,
});

const NON_CV_CATEGORY_CAPS = Object.freeze({
  high: Object.freeze({ impact: 6, consistency: 5 }),
  medium: Object.freeze({ impact: 8, consistency: 6 }),
  low: Object.freeze({ impact: 12, consistency: 8 }),
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundConfidence(value) {
  return Number(clamp(value, 0, 1).toFixed(2));
}

function defaultIssueEvidence(ctx, issue) {
  if (!ctx || !issue) return [];

  if (issue.id === 'merged_bullets_suspected') {
    return (ctx.mergedBullets?.evidence || []).slice(0, 2);
  }

  if (issue.id === 'stack_contradiction') {
    return (ctx.stackContradictions || []).slice(0, 2).map((item) => ({
      lineStart: item.lineStart,
      lineEnd: item.lineEnd,
      snippet: item.snippet,
      reason: item.reason,
    }));
  }

  if (issue.id === 'inconsistent_date_format') {
    return (ctx.dateFormats?.usedFormats || [])
      .flatMap((format) => (ctx.dateFormats.evidence?.[format] || []).slice(0, 1))
      .slice(0, 2);
  }

  if (issue.category === 'impact' && (ctx.bulletLines || []).length > 0) {
    return ctx.bulletLines.slice(0, 2).map((bullet) => ({
      lineStart: bullet.lineNumber,
      lineEnd: bullet.lineNumber,
      snippet: bullet.line,
      reason: 'impact bullet sample',
    }));
  }

  return (ctx.lineEntries || [])
    .filter((line) => !line.isHeading)
    .slice(0, 2)
    .map((line) => ({
      lineStart: line.lineNumber,
      lineEnd: line.lineNumber,
      snippet: line.text,
      reason: 'source line sample',
    }));
}

function issueFromRule(rule, override = null, ctx = null) {
  const merged = override && typeof override === 'object' ? { ...rule, ...override } : rule;
  const issue = {
    id: merged.id,
    severity: merged.severity,
    category: merged.category,
    scoreDelta: Number(merged.scoreDelta || 0),
    title: merged.title,
    message: merged.message,
    explanation: merged.explanation || merged.message,
    why: merged.why,
    fix: merged.fix,
  };

  const withRuleEvidence = addEvidence(issue, merged.evidence);
  if (withRuleEvidence.evidence && withRuleEvidence.evidence.length > 0) return withRuleEvidence;
  return addEvidence(withRuleEvidence, defaultIssueEvidence(ctx, merged));
}

function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 999;
    const sb = SEVERITY_ORDER[b.severity] ?? 999;
    if (sa !== sb) return sa - sb;
    return String(a.id).localeCompare(String(b.id));
  });
}

function ensureIssueEvidence(issues, ctx) {
  return (issues || []).map((issue) => {
    if (!issue || typeof issue !== 'object') return issue;
    const shouldEnforce = issue.severity === 'warn' || issue.severity === 'info';
    if (!shouldEnforce) return issue;
    if (Array.isArray(issue.evidence) && issue.evidence.length > 0) return issue;
    return addEvidence(issue, defaultIssueEvidence(ctx, issue));
  });
}

function confidenceFromEvidence(issue) {
  const entries = Array.isArray(issue?.evidence) ? issue.evidence : [];
  const numeric = entries
    .map((entry) => Number(entry?.confidence))
    .filter((value) => Number.isFinite(value));
  if (!numeric.length) return null;
  const average = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
  return roundConfidence(average);
}

function attachIssueConfidence(issues, extractionQuality) {
  const extractionLevel = extractionQuality?.level || 'high';
  const extractionMultiplier = EXTRACTION_CONFIDENCE_MULTIPLIERS[extractionLevel] ?? 1;

  return (issues || []).map((issue) => {
    if (!issue || typeof issue !== 'object') return issue;
    const baseConfidence = BASE_CONFIDENCE_BY_SEVERITY[issue.severity] ?? 0.7;
    const evidenceConfidence = confidenceFromEvidence(issue);
    const blendedBase = evidenceConfidence == null
      ? baseConfidence
      : ((baseConfidence * 0.45) + (evidenceConfidence * 0.55));
    const adjusted = EXTRACTION_SENSITIVE_ISSUE_IDS.has(issue.id)
      ? (blendedBase * extractionMultiplier)
      : blendedBase;
    return {
      ...issue,
      confidence: roundConfidence(adjusted),
    };
  });
}

function lowExtractionQualityIssue(ctx) {
  const evidence = (ctx?.mergedBullets?.evidence || []).slice(0, 1);
  return addEvidence({
    id: 'low_extraction_quality',
    severity: 'info',
    category: 'ats',
    scoreDelta: 0,
    title: 'PDF extraction quality is low; some scores may be undercounted',
    message: 'Bullet and line parsing quality is low, so some impact-related checks are softened.',
    explanation: 'Extraction artifacts can affect bullet parsing, outcome detection, and keyword signals.',
    why: 'Score accuracy depends on reliable text extraction.',
    fix: 'Try re-exporting PDF (avoid columns/text boxes), or upload DOCX for best results.',
  }, evidence);
}

function applyNonCvCategoryCaps(categoryScores, ctx) {
  if (!ctx?.likelyNonCv) return categoryScores;
  const extractionLevel = ctx?.extractionQuality?.level || 'high';
  const caps = NON_CV_CATEGORY_CAPS[extractionLevel] || NON_CV_CATEGORY_CAPS.high;
  return {
    ...categoryScores,
    impact: Math.min(categoryScores.impact, caps.impact),
    consistency: Math.min(categoryScores.consistency, caps.consistency),
  };
}

function scoreCvContext(ctx, rules) {
  const issues = [];
  for (const rule of rules) {
    let result = null;
    try {
      if (typeof rule.evaluate === 'function') {
        result = rule.evaluate(ctx);
      } else if (typeof rule.check === 'function') {
        result = rule.check(ctx) ? true : null;
      }
    } catch {
      result = null;
    }

    if (!result) continue;
    if (result === true) {
      issues.push(issueFromRule(rule, null, ctx));
      continue;
    }
    if (typeof result === 'object') {
      issues.push(issueFromRule(rule, result, ctx));
    }
  }

  if (ctx?.extractionQuality?.level === 'low') {
    issues.push(lowExtractionQualityIssue(ctx));
  }

  const orderedIssues = sortIssues(issues);
  const normalizedIssues = ensureIssueEvidence(orderedIssues, ctx);
  const confidentIssues = attachIssueConfidence(normalizedIssues, ctx?.extractionQuality);
  const adjustedIssues = applyExtractionPenaltyAdjustments(confidentIssues, ctx?.extractionQuality);

  const categoryScores = {
    ats: CATEGORY_MAX_SCORES.ats,
    structure: CATEGORY_MAX_SCORES.structure,
    impact: CATEGORY_MAX_SCORES.impact,
    consistency: CATEGORY_MAX_SCORES.consistency,
    keywords: CATEGORY_MAX_SCORES.keywords,
  };

  for (const issue of adjustedIssues) {
    const category = issue.category;
    if (!Object.prototype.hasOwnProperty.call(categoryScores, category)) continue;
    const appliedDelta = Number(issue.appliedScoreDelta ?? issue.scoreDelta ?? 0);
    categoryScores[category] += appliedDelta;
  }

  for (const [category, max] of Object.entries(CATEGORY_MAX_SCORES)) {
    categoryScores[category] = clamp(Math.round(categoryScores[category]), 0, max);
  }

  const cappedCategoryScores = applyNonCvCategoryCaps(categoryScores, ctx);

  const overall = Object.values(cappedCategoryScores).reduce((sum, value) => sum + value, 0);
  const breakdown = Object.keys(CATEGORY_MAX_SCORES).map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    score: cappedCategoryScores[id],
    max: CATEGORY_MAX_SCORES[id],
  }));

  return {
    scores: {
      overall,
      ats: cappedCategoryScores.ats,
      structure: cappedCategoryScores.structure,
      impact: cappedCategoryScores.impact,
      consistency: cappedCategoryScores.consistency,
      keywords: cappedCategoryScores.keywords,
    },
    breakdown,
    issues: adjustedIssues,
    keywordCoverage: {
      role: ctx.keywordCoverage.role,
      roleLabel: ctx.keywordCoverage.roleLabel,
      total: ctx.keywordCoverage.total,
      criticalTotal: ctx.keywordCoverage.criticalTotal,
      strongTotal: ctx.keywordCoverage.strongTotal,
      found: ctx.keywordCoverage.found,
      missing: ctx.keywordCoverage.missing,
      missingCritical: ctx.keywordCoverage.missingCritical,
      missingStrong: ctx.keywordCoverage.missingStrong,
      missingByTier: ctx.keywordCoverage.missingByTier,
      skillsOnly: ctx.keywordCoverage.skillsOnly,
      foundInExperienceCount: ctx.keywordCoverage.foundInExperienceCount,
      foundInSkillsCount: ctx.keywordCoverage.foundInSkillsCount,
      coveragePct: ctx.keywordCoverage.coveragePct,
      weightedCoveragePct: ctx.keywordCoverage.weightedCoveragePct,
      keywordStuffingSuspected: ctx.keywordCoverage.keywordStuffingSuspected,
    },
    debug: {
      extractionQuality: ctx.extractionQuality,
      missingKeywords: {
        critical: ctx.keywordCoverage.missingByTier.critical,
        strong: ctx.keywordCoverage.missingByTier.strong,
        nice: ctx.keywordCoverage.missingByTier.nice,
      },
      penaltyWeights: EXTRACTION_PENALTY_WEIGHTS,
      keywordExperienceDependentShare: KEYWORD_EXPERIENCE_DEPENDENT_SHARE,
    },
  };
}

module.exports = {
  scoreCvContext,
};
