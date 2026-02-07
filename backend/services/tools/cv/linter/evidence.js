'use strict';

const EMAIL_RE = /\b([A-Z0-9._%+-])([A-Z0-9._%+-]*)([A-Z0-9._%+-])@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const PHONE_RE = /(?:\+?\d[\d().\s-]{6,}\d)/g;

function makeSnippet(text, maxLen = 140) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  if (compact.length <= maxLen) return compact;
  if (maxLen <= 3) return '.'.repeat(Math.max(1, maxLen));
  return `${compact.slice(0, maxLen - 3).trimEnd()}...`;
}

function maskEmail(source) {
  return String(source || '').replace(EMAIL_RE, (_, first, middle, last, domain) => {
    const maskedMiddle = middle.length > 0 ? '***' : '';
    return `${first}${maskedMiddle}${last}@${domain}`;
  });
}

function maskPhone(source) {
  return String(source || '').replace(PHONE_RE, (match) => {
    const digitMatches = match.match(/\d/g) || [];
    const totalDigits = digitMatches.length;
    if (totalDigits <= 3) return match;
    let seenDigits = 0;
    const keepAfter = totalDigits - 3;
    return match.replace(/\d/g, (digit) => {
      seenDigits += 1;
      return seenDigits > keepAfter ? digit : '*';
    });
  });
}

function maskPII(snippet) {
  return maskPhone(maskEmail(snippet));
}

function normalizeEvidenceEntry(entry) {
  if (!entry) return null;

  if (typeof entry === 'string') {
    const safe = makeSnippet(maskPII(entry));
    return safe ? { snippet: safe } : null;
  }

  if (typeof entry !== 'object') return null;

  const rawSnippet = String(entry.snippet || entry.text || '').trim();
  const snippet = makeSnippet(maskPII(rawSnippet));
  if (!snippet) return null;

  const normalized = { snippet };
  if (Number.isFinite(entry.lineStart)) normalized.lineStart = entry.lineStart;
  if (Number.isFinite(entry.lineEnd)) normalized.lineEnd = entry.lineEnd;
  if (!normalized.lineStart && Number.isFinite(entry.lineNumber)) {
    normalized.lineStart = entry.lineNumber;
    normalized.lineEnd = entry.lineNumber;
  }
  if (entry.reason) normalized.reason = makeSnippet(String(entry.reason), 96);
  return normalized;
}

function addEvidence(issue, evidenceEntries) {
  if (!issue || typeof issue !== 'object') return issue;
  const entries = Array.isArray(evidenceEntries) ? evidenceEntries : [evidenceEntries];
  const normalized = entries
    .map((entry) => normalizeEvidenceEntry(entry))
    .filter(Boolean)
    .slice(0, 3);
  if (normalized.length === 0) return issue;
  return {
    ...issue,
    evidence: normalized,
  };
}

module.exports = {
  makeSnippet,
  maskPII,
  addEvidence,
};
