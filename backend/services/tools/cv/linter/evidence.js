'use strict';

const EMAIL_RE = /\b([A-Z0-9._%+-])([A-Z0-9._%+-]*)([A-Z0-9._%+-])@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const PHONE_RE = /(?:\+?\d[\d().\s-]{6,}\d)/g;
const ALLOWED_EVIDENCE_SOURCES = new Set(['pdf', 'docx', 'raw_text']);

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeEvidenceEntry(entry) {
  if (!entry) return null;

  if (typeof entry === 'string') {
    const safe = makeSnippet(maskPII(entry));
    return safe
      ? {
          snippet: safe,
          excerpt: safe,
        }
      : null;
  }

  if (typeof entry !== 'object') return null;

  const rawSnippet = String(entry.snippet || entry.excerpt || entry.text || '').trim();
  const snippet = makeSnippet(maskPII(rawSnippet));
  if (!snippet) return null;
  const rawDetails = String(entry.details || '').trim();
  const normalizedDetails = rawDetails ? makeSnippet(maskPII(rawDetails), 280) : undefined;
  const rawReason = String(entry.reason || '').trim();
  const lineStart = Number.isFinite(entry.lineStart)
    ? Number(entry.lineStart)
    : (Number.isFinite(entry.line) ? Number(entry.line) : (Number.isFinite(entry.lineNumber) ? Number(entry.lineNumber) : undefined));
  const lineEnd = Number.isFinite(entry.lineEnd) ? Number(entry.lineEnd) : lineStart;
  const source = ALLOWED_EVIDENCE_SOURCES.has(String(entry.source || '').toLowerCase())
    ? String(entry.source).toLowerCase()
    : undefined;
  const confidence = Number.isFinite(entry.confidence)
    ? Number(clamp(Number(entry.confidence), 0, 1).toFixed(2))
    : undefined;

  const normalized = {
    snippet,
    excerpt: snippet,
  };
  if (lineStart) {
    normalized.line = lineStart;
    normalized.lineStart = lineStart;
    normalized.lineEnd = lineEnd;
  }
  if (rawReason) normalized.reason = makeSnippet(rawReason, 96);
  if (normalizedDetails && normalizedDetails !== snippet) normalized.details = normalizedDetails;
  if (source) normalized.source = source;
  if (confidence !== undefined) normalized.confidence = confidence;
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
