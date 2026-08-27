'use strict';

const {
  InterviewSelectionError,
  eligibleQuestionForms,
  selectCodingVariant,
  selectQuestions,
  selectSystemDesignScenario,
} = require('../services/interview/selection');

function question(id, technology, difficultyBand, format, estimatedSeconds, conceptId = id) {
  return {
    id,
    conceptId,
    revision: 1,
    contentHash: `${id}-hash`,
    level: 'junior',
    technology,
    difficultyBand,
    format,
    competency: id,
    prompt: id,
    estimatedSeconds,
    options: [
      { id: `${id}-a`, label: 'A' },
      { id: `${id}-b`, label: 'B' },
      { id: `${id}-c`, label: 'C' },
    ],
  };
}

function form(prefix, seconds = 100, conceptOverrides = {}) {
  const rows = [
    ['js-foundation', 'javascript', 'foundation', 'conceptual'],
    ['js-core', 'javascript', 'core', 'production-scenario'],
    ['js-stretch', 'javascript', 'stretch', 'conceptual'],
    ['html-core', 'html', 'core', 'conceptual'],
    ['css-core', 'css', 'core', 'conceptual'],
  ];
  return rows.map(([slot, technology, band, format]) => question(
    `${prefix}-${slot}`,
    technology,
    band,
    format,
    seconds,
    conceptOverrides[slot] || `${prefix}-concept-${slot}`,
  ));
}

describe('interview selection release guardrails', () => {
  test('filters every selectable MCQ form by the target time budget', () => {
    const questions = [...form('fast', 100), ...form('slow', 130)];
    const forms = eligibleQuestionForms({
      questions,
      track: 'core-web',
      level: 'junior',
      maxEstimatedSeconds: 600,
    });

    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every((candidate) => candidate.reduce(
      (sum, item) => sum + item.estimatedSeconds,
      0,
    ) <= 600)).toBe(true);
    expect(() => selectQuestions({
      questions,
      track: 'core-web',
      level: 'junior',
      maxEstimatedSeconds: 400,
      seed: 'too-short',
    })).toThrow(InterviewSelectionError);
  });

  test('enforces literal and semantic MCQ exclusions before seeded ranking', () => {
    const firstForm = form('first');
    const firstConcepts = new Set(firstForm.map((item) => item.conceptId));
    const secondForm = form('second', 100, {
      'css-core': firstForm.find((item) => item.id === 'first-css-core').conceptId,
    });
    const questions = [...firstForm, ...secondForm];

    const literalOnly = selectQuestions({
      questions,
      track: 'core-web',
      level: 'junior',
      excludedIds: new Set(firstForm.map((item) => item.id)),
      seed: 'literal-exclusion',
    });
    expect(literalOnly.every((item) => item.id.startsWith('second-'))).toBe(true);

    expect(() => selectQuestions({
      questions,
      track: 'core-web',
      level: 'junior',
      excludedIds: new Set(firstForm.map((item) => item.id)),
      excludedConceptIds: firstConcepts,
      seed: 'semantic-exclusion',
    })).toThrow(InterviewSelectionError);
  });

  test('never selects two MCQ ids that represent one semantic concept', () => {
    const duplicateConceptForm = form('duplicate-concept', 100, {
      'html-core': 'duplicate-concept-concept-js-foundation',
    });
    const safeForm = form('semantic-safe');
    const forms = eligibleQuestionForms({
      questions: [...duplicateConceptForm, ...safeForm],
      track: 'core-web',
      level: 'junior',
      maxEstimatedSeconds: 600,
    });

    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every((candidate) => (
      new Set(candidate.map((item) => item.conceptId || item.id)).size === 5
    ))).toBe(true);
    const selected = selectQuestions({
      questions: [...duplicateConceptForm, ...safeForm],
      track: 'core-web',
      level: 'junior',
      maxEstimatedSeconds: 600,
      seed: 'semantic-identity-invariant',
    });
    expect(new Set(selected.map((item) => item.conceptId || item.id)).size).toBe(5);
  });

  test('looks ahead past a greedy trap and preserves a five-form disjoint pack', () => {
    const packs = Array.from({ length: 5 }, (_, index) => form(`pack${index + 1}`));
    const duplicatedJavascriptConcept = packs[1][0];
    const trap = question(
      'trap-html-core',
      'html',
      'core',
      'conceptual',
      100,
      duplicatedJavascriptConcept.conceptId,
    );
    const questions = [...packs.flat(), trap];
    const seed = 'trap-2';

    // The old greedy choice consumes an extra JavaScript concept through the
    // HTML trap, leaving fewer than the 12 JavaScript identities needed by the
    // following four core-web forms.
    const greedy = selectQuestions({
      questions,
      track: 'core-web',
      level: 'junior',
      maxEstimatedSeconds: 600,
      seed,
    });
    expect(greedy.map((item) => item.id)).toContain(trap.id);
    expect(greedy.map((item) => item.id)).not.toContain(duplicatedJavascriptConcept.id);

    const excludedIds = new Set();
    const excludedConceptIds = new Set();
    const selections = [];
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const selected = selectQuestions({
        questions,
        track: 'core-web',
        level: 'junior',
        excludedIds,
        excludedConceptIds,
        maxEstimatedSeconds: 600,
        seed: attempt === 1 ? seed : `trap-follow-up-${attempt}`,
        targetExposureCount: attempt - 1,
        remainingHardExclusionMocks: 5 - attempt,
      });
      expect(selected.some((item) => excludedIds.has(item.id))).toBe(false);
      expect(selected.some((item) => (
        excludedConceptIds.has(item.conceptId || item.id)
      ))).toBe(false);
      selections.push(selected);
      for (const item of selected) {
        excludedIds.add(item.id);
        excludedConceptIds.add(item.conceptId || item.id);
      }
    }

    expect(selections[0].map((item) => item.id)).not.toContain(trap.id);
    expect(excludedIds.size).toBe(25);
    expect(excludedConceptIds.size).toBe(25);
    expect(selectQuestions({
      questions,
      track: 'core-web',
      level: 'junior',
      maxEstimatedSeconds: 600,
      seed,
      targetExposureCount: 0,
      remainingHardExclusionMocks: 4,
    })).toEqual(selections[0]);
    expect(selectQuestions({
      questions,
      track: 'core-web',
      level: 'junior',
      maxEstimatedSeconds: 600,
      seed,
      targetExposureCount: 0,
    })).toEqual(selections[0]);

    const firstFormSignatures = new Set(Array.from({ length: 16 }, (_, index) => (
      selectQuestions({
        questions,
        track: 'core-web',
        level: 'junior',
        maxEstimatedSeconds: 600,
        seed: `capacity-diversity-${index}`,
        targetExposureCount: 0,
      }).map((item) => item.id).sort().join('|')
    )));
    expect(firstFormSignatures.size).toBeGreaterThan(5);
  });

  test('rejects inconsistent hard-exclusion capacity inputs', () => {
    expect(() => selectQuestions({
      questions: form('capacity-contract'),
      track: 'core-web',
      level: 'junior',
      seed: 'capacity-contract',
      targetExposureCount: 2,
      remainingHardExclusionMocks: 4,
    })).toThrow(/conflicts with the remaining hard-exclusion/i);
  });

  test('blocks same-concept coding tasks even when their ids differ', () => {
    const variants = ['react-counter-a', 'react-counter-b'].map((id) => ({
      id,
      conceptId: 'counter-state-machine',
      enabled: true,
      track: 'react',
      level: 'junior',
    }));

    expect(() => selectCodingVariant({
      variants,
      track: 'react',
      level: 'junior',
      excludedConceptIds: new Set(['counter-state-machine']),
      seed: 'semantic-coding-exclusion',
    })).toThrow(InterviewSelectionError);
  });

  test('uses source/content concept identity for System Design exclusions', () => {
    const scenarios = [{
      id: 'sd-a',
      sourceContentId: 'toast-system',
      conceptId: 'toast-lifecycle',
      enabled: true,
      level: 'mid',
    }, {
      id: 'sd-b',
      sourceContentId: 'notification-system',
      conceptId: 'toast-lifecycle',
      enabled: true,
      level: 'mid',
    }];

    expect(() => selectSystemDesignScenario({
      scenarios,
      level: 'mid',
      excludedConceptIds: new Set(['toast-lifecycle']),
      seed: 'semantic-design-exclusion',
    })).toThrow(InterviewSelectionError);
  });
});
