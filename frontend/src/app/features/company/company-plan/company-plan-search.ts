/** Folds case, accents, spaces and punctuation, so "x.ai" finds xAI and "Eleven Labs" finds ElevenLabs. */
export function companyPlanSearchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** True when a typed query is part of the company name or one of its other names. */
export function companyMatchesSearch(query: string, name: string, aliases: readonly string[] = []): boolean {
  const key = companyPlanSearchKey(query);
  if (!key) return true;
  return [name, ...aliases].some((candidate) => companyPlanSearchKey(candidate).includes(key));
}
