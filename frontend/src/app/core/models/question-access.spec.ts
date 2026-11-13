import { isQuestionLockedForTier } from './question.model';

describe('isQuestionLockedForTier', () => {
  const FREE = { accessTier: 'free' as const };
  const MEMBER = { accessTier: 'premium' as const };
  const unlocked = (practiceId: string | null) => ({ ...FREE, freeUnlock: { practiceId } });

  it('locks a Premium question for a visitor and a free account, and opens it for a member', () => {
    expect(isQuestionLockedForTier({ access: 'premium', id: 'react-x' }, null)).toBeTrue();
    expect(isQuestionLockedForTier({ access: 'premium', id: 'react-x' }, FREE)).toBeTrue();
    expect(isQuestionLockedForTier({ access: 'premium', id: 'react-x' }, MEMBER)).toBeFalse();
    expect(isQuestionLockedForTier({ access: 'free', id: 'react-y' }, null)).toBeFalse();
  });

  it('opens only the practice task a free account opened with its free unlock', () => {
    expect(isQuestionLockedForTier({ access: 'premium', id: 'react-x' }, unlocked('react-x'))).toBeFalse();
    expect(isQuestionLockedForTier({ access: 'premium', id: 'react-y' }, unlocked('react-x'))).toBeTrue();
    // A caller that does not know the question cannot open it, and an unlock without a practice task opens none.
    expect(isQuestionLockedForTier({ access: 'premium' }, unlocked('react-x'))).toBeTrue();
    expect(isQuestionLockedForTier({ access: 'premium', id: 'react-x' }, unlocked(null))).toBeTrue();
  });
});
