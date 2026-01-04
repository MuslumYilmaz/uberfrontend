export type NormalizeMode = 'prod' | 'dev';

export type NormalizedError = {
  message: string;
  stack?: string;
  name?: string;
};

const firstLine = (value: string) => value.split(/\r?\n/)[0]?.trim() || '';

const withNamePrefix = (name: string | undefined, message: string) => {
  if (!name) return message;
  const trimmed = message.trim();
  if (!trimmed) return name;
  const lower = trimmed.toLowerCase();
  const nameLower = name.toLowerCase();
  if (lower.startsWith(`${nameLower}:`)) return trimmed;
  return `${name}: ${trimmed}`;
};

export function normalizeError(err: unknown, opts: { mode: NormalizeMode }): NormalizedError {
  let name: string | undefined;
  let message = '';
  let stack: string | undefined;

  if (err && typeof err === 'object') {
    const e = err as { name?: unknown; message?: unknown; stack?: unknown; toString?: () => string };
    if (typeof e.name === 'string') name = e.name;
    if (typeof e.message === 'string') message = e.message;
    else if (typeof e.toString === 'function') message = String(err);
    if (typeof e.stack === 'string') stack = e.stack;
  } else {
    message = String(err);
  }

  const msgLine = withNamePrefix(name, firstLine(message)) || (name ? `${name}` : 'Error');
  const normalized: NormalizedError = { message: msgLine };
  if (name) normalized.name = name;
  if (opts.mode === 'dev' && stack) normalized.stack = stack;
  return normalized;
}

export function normalizeMessageLine(message: string): string {
  return String(message).replace(/\s*[\r\n]+\s*/g, ' ↵ ').trim();
}
