import catalog from './premium-preview-catalog.json';
import { PremiumPreviewContent } from '../models/question.model';

const previews = catalog as Record<string, PremiumPreviewContent>;

export function premiumPreviewForQuestion(
  technology: string,
  kind: 'coding' | 'trivia',
  id: string,
): PremiumPreviewContent | undefined {
  return previews[`${technology}/${kind}/${id}`];
}

export function premiumPreviewForSystemDesign(id: string): PremiumPreviewContent | undefined {
  return previews[`system-design/${id}`];
}
