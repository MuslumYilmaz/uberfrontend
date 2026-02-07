'use strict';

const MIDLINE_BULLET_RE = /\S\s+[•●◦▪‣]\s+\S/g;
const BULLET_TOKEN_RE = /(?:^|\s)([•●◦▪‣]|\d+[.)]|[-*])\s+/g;

const EXTRACTION_QUALITY_WEIGHTS = Object.freeze({
  midlineBulletToken: 0.12,
  mergedBulletLine: 0.08,
  veryLongLineRatio: 0.25,
  veryShortLineRatio: 0.18,
  suspiciousHyphenWrap: 0.03,
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wordCount(line) {
  return String(line || '').trim().split(/\s+/).filter(Boolean).length;
}

function analyzeExtractionQuality(lineEntries = [], mergedBulletLines = []) {
  const lines = (lineEntries || [])
    .map((entry) => String(entry?.text || '').trim())
    .filter(Boolean);
  const lineCount = Math.max(1, lines.length);

  let midlineBulletTokens = 0;
  let veryLongLines = 0;
  let veryShortLines = 0;
  let suspiciousHyphenWraps = 0;
  let totalLineLength = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    totalLineLength += line.length;

    if (line.length > 180) veryLongLines += 1;
    if (wordCount(line) <= 2) veryShortLines += 1;

    BULLET_TOKEN_RE.lastIndex = 0;
    let match = BULLET_TOKEN_RE.exec(line);
    let tokenCount = 0;
    while (match) {
      tokenCount += 1;
      if (match.index > 0) midlineBulletTokens += 1;
      match = BULLET_TOKEN_RE.exec(line);
    }

    const midlineMatches = line.match(MIDLINE_BULLET_RE);
    if (midlineMatches && tokenCount <= 1) {
      midlineBulletTokens += midlineMatches.length;
    }

    if (index < lines.length - 1) {
      const next = lines[index + 1];
      if (/-$/.test(line) && /^[a-z]/.test(next)) suspiciousHyphenWraps += 1;
    }
  }

  const mergedBulletSet = new Set((mergedBulletLines || []).map((item) => Number(item?.lineNumber || -1)));
  const mergedBulletCount = mergedBulletSet.size;
  const avgLineLength = totalLineLength / lineCount;

  const veryLongRatio = veryLongLines / lineCount;
  const veryShortRatio = veryShortLines / lineCount;

  const scorePenalty = (
    (midlineBulletTokens * EXTRACTION_QUALITY_WEIGHTS.midlineBulletToken)
    + (mergedBulletCount * EXTRACTION_QUALITY_WEIGHTS.mergedBulletLine)
    + (veryLongRatio * EXTRACTION_QUALITY_WEIGHTS.veryLongLineRatio)
    + (veryShortRatio * EXTRACTION_QUALITY_WEIGHTS.veryShortLineRatio)
    + (suspiciousHyphenWraps * EXTRACTION_QUALITY_WEIGHTS.suspiciousHyphenWrap)
  );

  const score = clamp(Number((1 - scorePenalty).toFixed(3)), 0, 1);
  const level = score >= 0.75 ? 'high' : (score >= 0.5 ? 'medium' : 'low');

  const notes = [];
  if (midlineBulletTokens > 0) {
    notes.push('Detected bullet tokens in mid-line positions; PDF line merging is likely.');
  }
  if (mergedBulletCount > 0) {
    notes.push('Some lines appear to contain multiple merged bullet statements.');
  }
  if (veryLongLines >= 3) {
    notes.push('Multiple very long lines reduce parser reliability.');
  }
  if (veryShortRatio > 0.2) {
    notes.push('Many very short lines suggest extraction noise.');
  }
  if (suspiciousHyphenWraps > 0) {
    notes.push('Detected suspicious hyphen line wraps from PDF extraction.');
  }

  return {
    score,
    level,
    signals: {
      mergedBulletLines: mergedBulletCount,
      midlineBulletTokens,
      avgLineLength: Number(avgLineLength.toFixed(1)),
      veryLongLines,
      veryShortLines,
      suspiciousHyphenWraps,
    },
    notes,
  };
}

module.exports = {
  EXTRACTION_QUALITY_WEIGHTS,
  analyzeExtractionQuality,
};
