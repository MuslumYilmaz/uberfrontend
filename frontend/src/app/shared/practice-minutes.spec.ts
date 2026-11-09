import { practiceMinutes, timedPracticeStep } from './practice-minutes';

describe('practiceMinutes', () => {
  it("takes an author's estimate, else the difficulty", () => {
    expect(practiceMinutes({ difficulty: 'intermediate', estimatedMinutes: 40 })).toBe(40);
    expect(practiceMinutes({ difficulty: 'easy' })).toBe(15);
    expect(practiceMinutes({ difficulty: 'hard' })).toBe(45);
    expect(practiceMinutes({ difficulty: 'unknown' })).toBe(30);
    expect(practiceMinutes({ difficulty: 'hard', estimatedMinutes: 0 })).toBe(45);
    expect(practiceMinutes(null)).toBe(30);
  });

  it('starts timed practice at the step nearest the task', () => {
    expect([10, 15, 20, 30, 40, 45, 90].map(timedPracticeStep)).toEqual([15, 15, 15, 30, 45, 45, 45]);
  });
});
