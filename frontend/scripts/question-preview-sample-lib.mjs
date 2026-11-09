// Shared validation for the optional `previewSample` on a Premium task: one short quote its lock page shows, so a
// visitor can judge the format before paying. Kept outside lint-questions.mjs so it can be unit-tested without the CLI.

const FIELDS = [
  ['label', 80, true],
  ['quote', 500, true],
  ['note', 300, false],
];
// Visitors and search read the sample, so it stays prose, as the authored premium preview does: no markup, paths,
// file names or code.
const VISIBLE_SYNTAX = /(?:`|\*\*|<\/?[a-z][^>]*>|\[[^\]]+\]\([^)]*\)|(?:^|\s)(?:src|public|app|assets)\/|\b[\w-]+\.(?:html?|tsx?|jsx?|css|scss|json)\b|\{[^}]*\}|=>)/i;

/** Returns error messages for a `previewSample` value; an empty list means it is valid or absent. */
export function validatePreviewSample(sample, { access } = {}) {
  if (sample === undefined) return [];
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
    return ['previewSample must be an object with a label, a quote and an optional note.'];
  }
  const errors = [];
  if (access !== 'premium') errors.push("previewSample belongs on a Premium task's lock page.");
  for (const key of Object.keys(sample)) {
    if (!FIELDS.some(([field]) => field === key)) errors.push(`previewSample has an unknown key: ${key}`);
  }
  for (const [field, max, required] of FIELDS) {
    const value = sample[field];
    if (value === undefined && !required) continue;
    if (typeof value !== 'string' || !value.trim() || value.length > max) {
      errors.push(`previewSample.${field} must be text of at most ${max} characters.`);
    } else if (VISIBLE_SYNTAX.test(value)) {
      errors.push(`previewSample.${field} must read as prose: no markup, paths, file names or code.`);
    }
  }
  return errors;
}
