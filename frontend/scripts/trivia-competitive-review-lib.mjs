#!/usr/bin/env node

import path from 'path';

export const COMPETITIVE_CRITERIA = ['realWorldUseCases', 'actionableExamples', 'followUpConfusion'];
export const COMPETITIVE_VERDICTS = new Set(['ours', 'theirs', 'tie']);
export const COMPETITOR_CATEGORIES = new Set([
  'canonical_docs',
  'interview_prep',
  'tutorial_reference',
  'community_qna',
]);
export const COMPETITIVE_QUERY_SOURCES = new Set(['seo_primary_keyword', 'manual']);
export const HARD_COMPETITOR_DOMAINS = new Set(['developer.mozilla.org', 'greatfrontend.com', 'javascript.info']);
export const REVIEW_STALE_DAYS = 180;

export function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeRepoRelativePath(value) {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
}

export function validateDateOnly(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function reviewPathForTrivia(contentReviewsDir, tech, contentId) {
  return path.join(contentReviewsDir, 'trivia', String(tech || '').trim(), `${String(contentId || '').trim()}.json`);
}

export function collectTriviaText(entry) {
  const parts = [];

  function visit(value) {
    if (typeof value === 'string') {
      parts.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item));
      return;
    }
    if (!value || typeof value !== 'object') return;

    Object.entries(value).forEach(([key, child]) => {
      if (key === 'editorial') return;
      visit(child);
    });
  }

  visit(entry);
  return parts.join(' ');
}

function normalizeDomain(rawUrl) {
  const parsed = new URL(rawUrl);
  return parsed.hostname.replace(/^www\./i, '').toLowerCase();
}

function normalizeCompetitorUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  return `${parsed.origin.toLowerCase()}${pathname}`;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function warning(code, message) {
  return { code, message };
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function validateCompetitiveReview({
  review,
  label,
  reviewPath,
  contentId,
  tech,
  shippedText,
  updatedAt,
  today,
  requireThreeCompetitors = false,
  requireRelevantGreatFrontend = false,
}) {
  const errors = [];
  const warnings = [];
  const reviewLabel = normalizeRepoRelativePath(reviewPath);
  const normalizedShippedText = normalizeText(shippedText);
  const validUpdatedAt = validateDateOnly(updatedAt);
  const validToday = validateDateOnly(today);

  if (!isObject(review)) {
    errors.push(`${label}: competitor review must be a JSON object in ${reviewLabel}`);
    return { errors, warnings };
  }

  if (String(review.contentId || '').trim() !== String(contentId || '').trim()) {
    errors.push(`${label}: competitor review contentId must match "${contentId}" in ${reviewLabel}`);
  }

  if (String(review.tech || '').trim() !== String(tech || '').trim()) {
    errors.push(`${label}: competitor review tech must match "${tech}" in ${reviewLabel}`);
  }

  if (!String(review.query || '').trim()) {
    errors.push(`${label}: competitor review query is required in ${reviewLabel}`);
  }

  const selection = review.selection;
  if (!isObject(selection)) {
    errors.push(`${label}: competitor review selection metadata is required in ${reviewLabel}`);
  } else {
    const querySource = String(selection.querySource || '').trim();
    if (!COMPETITIVE_QUERY_SOURCES.has(querySource)) {
      errors.push(`${label}: competitor review selection.querySource must be one of: seo_primary_keyword, manual in ${reviewLabel}`);
    }

    if (typeof selection.greatFrontendRelevant !== 'boolean') {
      errors.push(`${label}: competitor review selection.greatFrontendRelevant must be true or false in ${reviewLabel}`);
    } else if (
      selection.greatFrontendRelevant === false
      && !String(selection.greatFrontendReasonIfOmitted || '').trim()
    ) {
      errors.push(`${label}: competitor review selection.greatFrontendReasonIfOmitted is required when GreatFrontEnd is marked irrelevant in ${reviewLabel}`);
    }
  }

  const reviewedAt = validateDateOnly(review.reviewedAt);
  if (!reviewedAt) {
    errors.push(`${label}: competitor review reviewedAt must use YYYY-MM-DD in ${reviewLabel}`);
  }

  if (!String(review.reviewedBy || '').trim()) {
    errors.push(`${label}: competitor review reviewedBy is required in ${reviewLabel}`);
  }

  if (!Array.isArray(review.competitors) || !review.competitors.length) {
    errors.push(`${label}: competitor review competitors must contain at least 1 item in ${reviewLabel}`);
    return { errors, warnings };
  }

  if (requireThreeCompetitors && review.competitors.length !== 3) {
    errors.push(`${label}: competitor review must contain exactly 3 competitors in ${reviewLabel}`);
  }

  const seenUrls = new Set();
  const seenDomains = new Set();
  const categorySet = new Set();
  let includesGreatFrontend = false;
  let totalOurs = 0;
  let totalTheirs = 0;

  review.competitors.forEach((competitor, index) => {
    const competitorLabel = `${label}: competitor #${index + 1}`;
    if (!isObject(competitor)) {
      errors.push(`${competitorLabel} must be an object in ${reviewLabel}`);
      return;
    }

    if (!String(competitor.label || '').trim()) {
      errors.push(`${competitorLabel} label is required in ${reviewLabel}`);
    }

    const category = String(competitor.category || '').trim();
    if (!COMPETITOR_CATEGORIES.has(category)) {
      errors.push(
        `${competitorLabel} category must be one of: canonical_docs, interview_prep, tutorial_reference, community_qna in ${reviewLabel}`,
      );
    } else {
      categorySet.add(category);
    }

    if (!String(competitor.selectionReason || '').trim()) {
      errors.push(`${competitorLabel} selectionReason is required in ${reviewLabel}`);
    }

    let competitorDomain = '';
    const rawUrl = String(competitor.url || '').trim();
    if (!rawUrl) {
      errors.push(`${competitorLabel} url is required in ${reviewLabel}`);
    } else {
      try {
        const normalizedUrl = normalizeCompetitorUrl(rawUrl);
        competitorDomain = normalizeDomain(rawUrl);
        if (seenUrls.has(normalizedUrl) || seenDomains.has(competitorDomain)) {
          errors.push(`${label}: competitor review cannot repeat the same competitor URL/domain in ${reviewLabel}`);
        }
        seenUrls.add(normalizedUrl);
        seenDomains.add(competitorDomain);
        if (competitorDomain === 'greatfrontend.com') includesGreatFrontend = true;
      } catch (error) {
        errors.push(`${competitorLabel} url must be a valid absolute URL in ${reviewLabel}`);
      }
    }

    if (!Array.isArray(competitor.theirStrengths)) {
      errors.push(`${competitorLabel} theirStrengths must be an array in ${reviewLabel}`);
    }
    if (!Array.isArray(competitor.theirGaps)) {
      errors.push(`${competitorLabel} theirGaps must be an array in ${reviewLabel}`);
    }

    const verdicts = competitor.verdicts;
    if (!isObject(verdicts)) {
      errors.push(`${competitorLabel} verdicts must be an object in ${reviewLabel}`);
      return;
    }

    const theirEvidence = competitor.theirEvidence;
    if (!isObject(theirEvidence)) {
      errors.push(`${competitorLabel} theirEvidence must be an object in ${reviewLabel}`);
      return;
    }

    const ourEvidence = isObject(competitor.ourEvidence) ? competitor.ourEvidence : {};
    const nextActions = isObject(competitor.nextActions) ? competitor.nextActions : {};

    let oursCount = 0;

    COMPETITIVE_CRITERIA.forEach((criterion) => {
      const verdict = String(verdicts[criterion] || '').trim();
      if (!COMPETITIVE_VERDICTS.has(verdict)) {
        errors.push(`${competitorLabel} verdicts.${criterion} must be one of: ours, theirs, tie in ${reviewLabel}`);
        return;
      }

      if (verdict === 'ours') {
        oursCount += 1;
        totalOurs += 1;
      } else if (verdict === 'theirs') {
        totalTheirs += 1;
      }

      const competitorEvidence = normalizeStringArray(theirEvidence[criterion]);
      if (!competitorEvidence.length) {
        errors.push(`${competitorLabel} theirEvidence.${criterion} must contain at least 1 note in ${reviewLabel}`);
      }

      const ourEvidenceSnippets = normalizeStringArray(ourEvidence[criterion]);
      if (verdict === 'ours' && !ourEvidenceSnippets.length) {
        errors.push(`${competitorLabel} ourEvidence.${criterion} must contain at least 1 shipped snippet in ${reviewLabel}`);
      }

      ourEvidenceSnippets.forEach((snippet) => {
        if (!normalizedShippedText.includes(normalizeText(snippet))) {
          errors.push(`${competitorLabel} ourEvidence.${criterion} does not appear in shipped trivia text (${reviewLabel})`);
        }
      });

      if (verdict === 'theirs' || verdict === 'tie') {
        const actions = normalizeStringArray(nextActions[criterion]);
        if (!actions.length) {
          warnings.push(
            warning(
              'missing-next-actions',
              `${competitorLabel} is "${verdict}" on ${criterion} but nextActions.${criterion} is missing in ${reviewLabel}`,
            ),
          );
        }
      }
    });

    if (oursCount < 2) {
      warnings.push(
        warning(
          'competitor-threshold-not-met',
          `${label}: ${String(competitor.label || `competitor #${index + 1}`).trim()} only gives us ${oursCount}/3 wins in ${reviewLabel}`,
        ),
      );
    } else if (!String(competitor.winReason || '').trim()) {
      errors.push(`${competitorLabel} winReason is required when we claim at least 2/3 wins in ${reviewLabel}`);
    }

    if (competitorDomain && HARD_COMPETITOR_DOMAINS.has(competitorDomain) && oursCount === 3) {
      warnings.push(
        warning(
          'hard-competitor-clean-sweep',
          `${label}: ${String(competitor.label || competitorDomain).trim()} is a hard competitor but the review claims a 3/3 sweep in ${reviewLabel}`,
        ),
      );
    }
  });

  if (selection?.greatFrontendRelevant === true && !includesGreatFrontend) {
    const code = 'missing-greatfrontend-competitor';
    const message = `${label}: GreatFrontEnd is marked relevant but no greatfrontend.com competitor is present in ${reviewLabel}`;
    if (requireRelevantGreatFrontend) {
      errors.push(message);
    } else {
      warnings.push(warning(code, message));
    }
  }

  if (categorySet.size > 0 && categorySet.size < 2) {
    warnings.push(
      warning(
        'narrow-competitor-mix',
        `${label}: competitor set only covers ${categorySet.size} category in ${reviewLabel}; use at least 2 categories for calibration`,
      ),
    );
  }

  if (totalOurs >= 7 && totalTheirs === 0) {
    warnings.push(
      warning(
        'overconfident-review-calibration',
        `${label}: review claims ${totalOurs} ours verdicts and 0 theirs verdicts in ${reviewLabel}; re-check for generosity bias`,
      ),
    );
  }

  if (reviewedAt && validUpdatedAt && reviewedAt < validUpdatedAt) {
    warnings.push(
      warning(
        'review-older-than-content',
        `${label}: competitor review (${reviewedAt}) is older than trivia updatedAt (${validUpdatedAt}) in ${reviewLabel}`,
      ),
    );
  }

  if (reviewedAt && validToday) {
    const daysSinceReview = Math.floor(
      (new Date(`${validToday}T00:00:00.000Z`).getTime() - new Date(`${reviewedAt}T00:00:00.000Z`).getTime())
      / 86400000,
    );
    if (daysSinceReview > REVIEW_STALE_DAYS) {
      warnings.push(
        warning(
          'stale-competitor-review',
          `${label}: competitor review is ${daysSinceReview} days old (${reviewedAt}) in ${reviewLabel}`,
        ),
      );
    }
  }

  return { errors, warnings };
}
