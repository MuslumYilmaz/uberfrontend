/**
 * Where an opening tag (`head`, `html`) ends in a document's source, past its attributes, skipping comments: a
 * starter that says `<!-- Edit only the <head> -->` before its real head must not get styles or scripts put inside
 * that comment, where they never apply. -1 when the source has no such tag.
 */
export function openingTagEnd(source: string, tag: string): number {
  const pattern = new RegExp(`<!--[\\s\\S]*?(?:-->|$)|<${tag}(?:\\s[^>]*)?>`, 'gi');
  for (const match of source.matchAll(pattern)) {
    if (!match[0].startsWith('<!--')) return (match.index ?? 0) + match[0].length;
  }
  return -1;
}

/** `insert` placed right after the opening tag, or null when the source has none outside comments. */
export function afterOpeningTag(source: string, tag: string, insert: string): string | null {
  const end = openingTagEnd(source, tag);
  return end < 0 ? null : `${source.slice(0, end)}${insert}${source.slice(end)}`;
}
