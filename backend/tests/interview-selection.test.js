'use strict';

process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';

const { loadInterviewArtifacts, resetInterviewArtifactsCache } = require(
  '../services/interview/artifacts'
);
const {
  bandProfileFor,
  deterministicShuffle,
  selectCodingVariant,
  selectQuestions,
} = require('../services/interview/selection');

function countsBy(rows, field) {
  return rows.reduce((counts, row) => {
    counts[row[field]] = (counts[row[field]] || 0) + 1;
    return counts;
  }, {});
}

describe('interview form selection', () => {
  beforeAll(() => {
    resetInterviewArtifactsCache();
  });

  test('constructs every track/level form with exact cross-slot constraints', () => {
    const artifacts = loadInterviewArtifacts({ force: true });
    for (const level of ['junior', 'mid', 'senior']) {
      for (const track of ['core-web', 'react', 'angular', 'vue']) {
        const questions = selectQuestions({
          questions: artifacts.bank.questions,
          track,
          level,
          seed: `matrix:${track}:${level}`,
        });
        const coding = selectCodingVariant({
          variants: artifacts.coding.variants,
          track,
          level,
          seed: `matrix:${track}:${level}`,
        });

        expect(questions).toHaveLength(5);
        expect(new Set(questions.map((question) => question.id)).size).toBe(5);
        expect(countsBy(questions, 'difficultyBand')).toEqual(
          bandProfileFor(track, level)
        );
        expect(questions.filter((question) => question.format === 'production-scenario').length)
          .toBeGreaterThanOrEqual(1);
        expect(questions.filter((question) => question.format === 'code-output').length)
          .toBeLessThanOrEqual(1);

        const technologyCounts = countsBy(questions, 'technology');
        if (track === 'core-web') {
          expect(technologyCounts).toEqual({ javascript: 3, html: 1, css: 1 });
        } else {
          expect(technologyCounts).toEqual(
            expect.objectContaining({
              javascript: 1,
              html: 1,
              css: 1,
              [track]: 2,
            })
          );
        }
        expect(coding).toEqual(expect.objectContaining({ enabled: true, track, level }));
      }
    }
  });

  test('same seed is stable while option ids remain tied to their labels', () => {
    const artifacts = loadInterviewArtifacts();
    const first = selectQuestions({
      questions: artifacts.bank.questions,
      track: 'react',
      level: 'mid',
      seed: 'stable-seed',
    });
    const second = selectQuestions({
      questions: artifacts.bank.questions,
      track: 'react',
      level: 'mid',
      seed: 'stable-seed',
    });
    expect(second).toEqual(first);
    for (const question of first) {
      expect(question.options).toHaveLength(3);
      expect(new Set(question.options.map((option) => option.id)).size).toBe(3);
    }
  });

  test('different session seeds can permute stable option ids', () => {
    const options = [
      { id: 'option-a', label: 'First answer' },
      { id: 'option-b', label: 'Second answer' },
      { id: 'option-c', label: 'Third answer' },
    ];
    const signatures = Array.from({ length: 12 }, (_, index) =>
      deterministicShuffle(options, `session-seed-${index}`, 'options:question-1')
        .map((option) => option.id)
        .join('|')
    );

    expect(new Set(signatures).size).toBeGreaterThan(1);
    for (const signature of signatures) {
      expect(new Set(signature.split('|'))).toEqual(
        new Set(options.map((option) => option.id))
      );
    }
  });

  test('coding selection prefers least-seen, then oldest-seen, before seed tie-break', () => {
    const artifacts = loadInterviewArtifacts();
    const variants = artifacts.coding.variants.filter(
      (variant) => variant.enabled && variant.track === 'react' && variant.level === 'junior'
    );
    expect(variants).toHaveLength(2);

    const leastSeen = selectCodingVariant({
      variants,
      track: 'react',
      level: 'junior',
      seed: 'any-seed',
      seenCounts: new Map([
        [variants[0].id, { count: 4, lastSeenAt: '2026-07-01T00:00:00Z' }],
        [variants[1].id, { count: 1, lastSeenAt: '2026-07-25T00:00:00Z' }],
      ]),
    });
    expect(leastSeen.id).toBe(variants[1].id);

    const oldest = selectCodingVariant({
      variants,
      track: 'react',
      level: 'junior',
      seed: 'different-seed',
      seenCounts: new Map([
        [variants[0].id, { count: 2, lastSeenAt: '2026-05-01T00:00:00Z' }],
        [variants[1].id, { count: 2, lastSeenAt: '2026-07-25T00:00:00Z' }],
      ]),
    });
    expect(oldest.id).toBe(variants[0].id);
  });
});
