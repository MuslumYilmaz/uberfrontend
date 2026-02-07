import { CvIssue, CvIssueEvidence, CvSeverity } from '../../../core/models/cv-linter.model';
import { ROLE_KEYWORD_SUGGESTIONS, RoleKeywordSuggestion } from './role-keyword-suggestions';

export const EXTRACTION_SENSITIVE_ISSUE_IDS = new Set([
  'keyword_missing',
  'keyword_missing_critical',
  'no_outcome_language',
  'merged_bullets_suspected',
]);

const SEVERITY_BASE_CONFIDENCE: Record<CvSeverity, number> = {
  critical: 0.93,
  warn: 0.82,
  info: 0.72,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncateText(value: string, max = 140): string {
  const compact = normalizeText(value);
  if (compact.length <= max) return compact;
  if (max <= 3) return '.'.repeat(max);
  return `${compact.slice(0, max - 3).trimEnd()}...`;
}

export function normalizeIssueEvidence(issue: CvIssue): CvIssueEvidence[] {
  const entries = Array.isArray(issue?.evidence) ? issue.evidence : [];
  const normalized = entries.map((entry): CvIssueEvidence | null => {
      if (!entry) return null;
      const reason = normalizeText(String(entry.reason || ''));
      const excerptBase = normalizeText(String(entry.excerpt || entry.snippet || ''));
      const excerpt = reason && excerptBase ? `${reason} — ${excerptBase}` : excerptBase;
      if (!excerpt) return null;

      const lineFromLegacy = Number.isFinite(entry.lineStart) ? entry.lineStart : undefined;
      const line = Number.isFinite(entry.line) ? entry.line : lineFromLegacy;
      const details = normalizeText(String(entry.details || entry.snippet || ''));

      return {
        excerpt: truncateText(excerpt, 140),
        details: details && details !== excerpt ? details : undefined,
        line,
        source: entry.source,
        confidence: Number.isFinite(entry.confidence) ? clamp(Number(entry.confidence), 0, 1) : undefined,
      };
    });
  return normalized
    .filter((entry): entry is CvIssueEvidence => entry !== null)
    .slice(0, 3);
}

export function formatEvidenceLineSuffix(entry?: CvIssueEvidence): string {
  if (!entry || !Number.isFinite(entry.line)) return '';
  return `(line ${entry.line})`;
}

export function shouldShowDocxBanner(issues: CvIssue[], extractionLevel?: 'high' | 'medium' | 'low'): boolean {
  const ids = new Set((issues || []).map((issue) => String(issue.id || '').trim()));
  return ids.has('merged_bullets_suspected')
    || ids.has('low_extraction_quality')
    || extractionLevel === 'low';
}

export function buildRegexEvidence(
  line: string,
  regex: RegExp,
  lineNumber?: number,
  source: 'pdf' | 'docx' | 'raw_text' = 'raw_text',
  confidence = 0.84
): CvIssueEvidence | null {
  const text = normalizeText(line);
  if (!text) return null;

  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const re = new RegExp(regex.source, flags);
  const match = re.exec(text);
  if (!match || match.index < 0) return null;

  const start = Math.max(0, match.index - 40);
  const end = Math.min(text.length, match.index + match[0].length + 40);
  const context = text.slice(start, end).trim();

  return {
    line: Number.isFinite(lineNumber) ? lineNumber : undefined,
    excerpt: truncateText(context, 140),
    details: text.length > context.length ? text : undefined,
    source,
    confidence: clamp(confidence, 0, 1),
  };
}

export function buildHeuristicEvidence(
  candidates: Array<{ text: string; score: number; line?: number; source?: 'pdf' | 'docx' | 'raw_text' }>
): CvIssueEvidence | null {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const sorted = [...candidates].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return (left.line || Number.MAX_SAFE_INTEGER) - (right.line || Number.MAX_SAFE_INTEGER);
  });

  const strongest = sorted[0];
  const fullText = normalizeText(strongest.text);
  if (!fullText) return null;

  return {
    line: Number.isFinite(strongest.line) ? strongest.line : undefined,
    excerpt: truncateText(fullText, 140),
    details: fullText.length > 140 ? fullText : undefined,
    source: strongest.source || 'raw_text',
    confidence: clamp(strongest.score, 0, 1),
  };
}

export function computeIssueConfidence(issue: CvIssue, hasLowExtractionQuality: boolean): number {
  if (Number.isFinite(issue?.confidence)) {
    return clamp(Number(issue.confidence), 0, 1);
  }
  const normalizedEvidence = normalizeIssueEvidence(issue);
  const evidenceConfidence = normalizedEvidence.find((entry) => Number.isFinite(entry.confidence))?.confidence;
  const base = Number.isFinite(evidenceConfidence) ? Number(evidenceConfidence) : SEVERITY_BASE_CONFIDENCE[issue.severity] ?? 0.7;
  if (hasLowExtractionQuality && EXTRACTION_SENSITIVE_ISSUE_IDS.has(issue.id)) {
    return Math.min(base, 0.45);
  }
  return clamp(base, 0, 1);
}

export function isLowConfidenceIssue(issue: CvIssue, hasLowExtractionQuality: boolean): boolean {
  return computeIssueConfidence(issue, hasLowExtractionQuality) < 0.6;
}

export function sortIssuesByConfidence(issues: CvIssue[], hasLowExtractionQuality: boolean): CvIssue[] {
  if (!hasLowExtractionQuality) return [...issues];
  return [...issues].sort((left, right) => {
    const confidenceDelta = computeIssueConfidence(right, hasLowExtractionQuality)
      - computeIssueConfidence(left, hasLowExtractionQuality);
    if (confidenceDelta !== 0) return confidenceDelta;
    const impactDelta = Math.abs(Number(right.scoreDelta || 0)) - Math.abs(Number(left.scoreDelta || 0));
    if (impactDelta !== 0) return impactDelta;
    return String(left.id || '').localeCompare(String(right.id || ''));
  });
}

export function buildRoleKeywordSuggestions(
  role: keyof typeof ROLE_KEYWORD_SUGGESTIONS,
  issueId: string,
  missingKeywords?: { critical?: string[]; strong?: string[] }
): RoleKeywordSuggestion[] {
  const suggestions = ROLE_KEYWORD_SUGGESTIONS[role] || [];
  const prioritizeCritical = issueId === 'keyword_missing_critical';
  const missingCritical = new Set((missingKeywords?.critical || []).map((item) => normalizeText(item.toLowerCase())));
  const missingStrong = new Set((missingKeywords?.strong || []).map((item) => normalizeText(item.toLowerCase())));

  const priorityOf = (suggestion: RoleKeywordSuggestion): number => {
    const hasCriticalMatch = suggestion.tokens.some((token) => missingCritical.has(normalizeText(token.toLowerCase())));
    const hasStrongMatch = suggestion.tokens.some((token) => missingStrong.has(normalizeText(token.toLowerCase())));
    if (hasCriticalMatch) return 100;
    if (hasStrongMatch) return 90;
    if (prioritizeCritical && suggestion.tier === 'critical') return 80;
    return suggestion.tier === 'critical' ? 70 : 50;
  };

  return [...suggestions]
    .sort((left, right) => {
      const priorityDelta = priorityOf(right) - priorityOf(left);
      if (priorityDelta !== 0) return priorityDelta;
      return left.label.localeCompare(right.label);
    })
    .slice(0, 6);
}
