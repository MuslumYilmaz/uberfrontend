import {
  normalizeSystemDesignQuestion,
  resolveSystemDesignPractice,
  SystemDesignPracticeMetadata,
} from './system-design.model';

describe('resolveSystemDesignPractice', () => {
  it('maps legacy difficulty to level and timebox and uses the description as the prompt', () => {
    const cases = [
      { difficulty: 'easy', level: 'junior', minutes: 10 },
      { difficulty: 'intermediate', level: 'mid', minutes: 15 },
      { difficulty: 'hard', level: 'senior', minutes: 20 },
    ] as const;

    for (const testCase of cases) {
      const practice = resolveSystemDesignPractice({
        description: `${testCase.level} candidate prompt`,
        difficulty: testCase.difficulty,
        tags: ['state-management', 'accessibility'],
      });
      expect(practice.targetLevel).toBe(testCase.level);
      expect(practice.timeboxMinutes).toBe(testCase.minutes);
      expect(practice.candidatePrompt).toBe(`${testCase.level} candidate prompt`);
    }
  });

  it('preserves a valid V2 practice contract without sharing mutable arrays', () => {
    const source: SystemDesignPracticeMetadata = {
      targetLevel: 'mid',
      timeboxMinutes: 15,
      candidatePrompt: 'Design the interaction boundary.',
      constraints: ['Keep one active request.', 'Ignore stale events.'],
      expectedDecisions: ['Ownership', 'Identity', 'Recovery'],
      prerequisites: ['Async state', 'Accessible feedback'],
      coreSkills: ['State ownership', 'Race handling'],
      guidedMock: true,
      evaluationSpine: {
        mustCover: ['Keep one active request.', 'Reject stale events.'],
        strongSignals: ['Recover a lost response.', 'Announce status accessibly.'],
        expertStretch: 'Coordinate the same draft across tabs.',
        redFlag: 'Treat a local abort as confirmed server cancellation.',
      },
    };

    const resolved = resolveSystemDesignPractice({
      description: 'Legacy prompt',
      difficulty: 'hard',
      practice: source,
      tags: [],
    });

    expect(resolved).toEqual(source);
    expect(resolved).not.toBe(source);
    expect(resolved.constraints).not.toBe(source.constraints);
    expect(resolved.expectedDecisions).not.toBe(source.expectedDecisions);
    expect(resolved.evaluationSpine).not.toBe(source.evaluationSpine);
    expect(resolved.evaluationSpine?.mustCover).not.toBe(source.evaluationSpine?.mustCover);
  });

  it('ignores an invalid optional evaluation spine without accepting a partial V2 contract', () => {
    const resolved = resolveSystemDesignPractice({
      description: 'Legacy fallback prompt',
      difficulty: 'easy',
      tags: [],
      practice: {
        targetLevel: 'junior',
        timeboxMinutes: 10,
        candidatePrompt: 'Invalid V2 prompt',
        constraints: ['One constraint.', 'Another constraint.'],
        expectedDecisions: ['One', 'Two', 'Three'],
        prerequisites: ['State', 'Events'],
        coreSkills: ['Ownership', 'Recovery'],
        evaluationSpine: {
          mustCover: ['Only one item'] as unknown as [string, string],
          strongSignals: ['One', 'Two'],
          expertStretch: 'Stretch.',
          redFlag: 'Red flag.',
        },
      },
    });

    expect(resolved.targetLevel).toBe('junior');
    expect(resolved.candidatePrompt).toBe('Legacy fallback prompt');
    expect(resolved.evaluationSpine).toBeUndefined();
  });
});

describe('normalizeSystemDesignQuestion discovery', () => {
  it('clones valid discovery metadata and drops a partial discovery contract', () => {
    const discovery = {
      teaser: 'A stale result must not replace the active view.',
      guideLabel: 'Trace stale results',
    };
    const normalized = normalizeSystemDesignQuestion({
      id: 'search',
      title: 'Search',
      description: 'Search prompt',
      discovery,
    });

    expect(normalized?.discovery).toEqual(discovery);
    expect(normalized?.discovery).not.toBe(discovery);
    expect(normalizeSystemDesignQuestion({
      id: 'invalid',
      title: 'Invalid',
      discovery: { teaser: 'Missing guide label' },
    })?.discovery).toBeUndefined();
  });
});
