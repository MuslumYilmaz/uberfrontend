export interface CssStickySanitizedSource {
  readonly css: string;
  readonly blockedNetworkReference: boolean;
}

/**
 * Keeps the lab deterministic and offline. CSP remains the second line of defence,
 * but this gate prevents browsers from initiating even a blocked CSS fetch.
 */
export function sanitizeCssStickyPreviewSource(
  source: string,
  trustedFallback: string,
): CssStickySanitizedSource {
  const input = String(source ?? '');
  const withoutComments = input.replace(/\/\*[\s\S]*?\*\//g, '');
  const decoded = withoutComments
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_match, digits: string) => {
      const codePoint = Number.parseInt(digits, 16);
      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return '';
      return String.fromCodePoint(codePoint);
    })
    .replace(/\\([^\r\n])/g, '$1')
    .toLowerCase();
  const compact = decoded.replace(/\s+/g, '');
  let hasBlockedUrl = false;
  let recognizedUrlCount = 0;
  decoded.replace(
    /url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,
    (_match, doubleQuoted: string | undefined, singleQuoted: string | undefined, unquoted: string | undefined) => {
      recognizedUrlCount += 1;
      const reference = String(doubleQuoted ?? singleQuoted ?? unquoted ?? '').trim();
      if (!reference.toLowerCase().startsWith('data:')) hasBlockedUrl = true;
      return 'url()';
    },
  );
  const urlTokenCount = decoded.match(/url\s*\(/gi)?.length ?? 0;
  const hasNetworkCapableSyntax = compact.includes('@import')
    || hasBlockedUrl
    || recognizedUrlCount !== urlTokenCount
    || compact.includes('image-set(')
    || compact.includes('-webkit-image-set(');

  return hasNetworkCapableSyntax
    ? { css: trustedFallback, blockedNetworkReference: true }
    : { css: input, blockedNetworkReference: false };
}
