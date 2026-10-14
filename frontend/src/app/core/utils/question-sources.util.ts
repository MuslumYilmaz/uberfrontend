import type { QuestionSource } from '../models/question.model';

const HTTPS_RE = /^https:\/\//i;
const DATE_RE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Keeps only well-formed https sources; everything else is dropped silently. */
export function normalizeQuestionSources(value: unknown): QuestionSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const label = typeof record['label'] === 'string' ? record['label'].trim() : '';
    const url = typeof record['url'] === 'string' ? record['url'].trim() : '';
    const publisher = typeof record['publisher'] === 'string' ? record['publisher'].trim() : '';
    const date = typeof record['date'] === 'string' ? record['date'].trim() : '';
    const note = typeof record['note'] === 'string' ? record['note'].trim() : '';
    if (!label || !HTTPS_RE.test(url)) return [];
    return [{ label, url, publisher, date, ...(note ? { note } : {}) }];
  });
}

/** "2026-05" becomes "May 2026"; "2026-05-12" becomes "May 12, 2026"; anything else is empty. */
export function formatQuestionSourceDate(date: string | undefined | null): string {
  const match = DATE_RE.exec((date || '').trim());
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return '';
  const monthName = MONTH_NAMES[month - 1];
  if (!match[3]) return `${monthName} ${year}`;
  const day = Number(match[3]);
  if (day < 1 || day > 31) return '';
  return `${monthName} ${day}, ${year}`;
}

/** schema.org `citation` entries for a question's public interview reports. */
export function buildQuestionSourceCitations(
  sources: QuestionSource[] | null | undefined,
): Array<Record<string, unknown>> {
  return normalizeQuestionSources(sources).map((source) => ({
    '@type': 'CreativeWork',
    name: source.label,
    url: source.url,
    ...(source.publisher ? { publisher: { '@type': 'Organization', name: source.publisher } } : {}),
    ...(source.date ? { datePublished: source.date } : {}),
  }));
}
