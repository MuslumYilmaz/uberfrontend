const STACK_SEGMENT_RE = /\s+at\s+.+$/i;
const URL_SEGMENT_RE = /\b(?:https?|file|blob):\/\/\S+/gi;
const FILE_LINE_RE = /\b[a-zA-Z0-9_.-]+(?:\.[a-zA-Z0-9_.-]+)+:\d+(?::\d+)?\b/g;
const WS_RE = /\s+/g;

function normalizeFailName(value: unknown): string {
  const text = String(value || '').trim();
  return text ? text.replace(WS_RE, ' ') : 'unknown-test';
}

export function normalizeErrorLine(value: unknown): string {
  const raw = String(value || '')
    .split('\n')[0]
    .trim();
  if (!raw) return 'unknown-error';

  const cleaned = raw
    .replace(STACK_SEGMENT_RE, '')
    .replace(URL_SEGMENT_RE, '[url]')
    .replace(FILE_LINE_RE, '[file]')
    .replace(WS_RE, ' ')
    .trim();

  return cleaned || 'unknown-error';
}

export function createFailureSignature(input: {
  firstFailName?: unknown;
  errorLine?: unknown;
  failCount?: number;
}): string {
  const failName = normalizeFailName(input.firstFailName);
  const line = normalizeErrorLine(input.errorLine);
  const failCount = Number.isFinite(input.failCount) ? Math.max(0, Number(input.failCount)) : 0;
  return `${failName}|${line}|${failCount}`;
}

export function stableHash(input: unknown): string {
  const text = String(input ?? '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}
