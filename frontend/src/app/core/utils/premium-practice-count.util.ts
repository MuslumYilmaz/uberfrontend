export function resolvePremiumPracticeCount(value: unknown, fallback: unknown): number | null {
  const valid = (candidate: unknown): candidate is number =>
    typeof candidate === 'number' && Number.isSafeInteger(candidate) && candidate > 0;
  return valid(value) ? value : valid(fallback) ? fallback : null;
}

export function premiumPracticeLabel(count: number | null): string {
  return count === null ? 'Premium practice library' : `${count} Premium practice prompts`;
}
