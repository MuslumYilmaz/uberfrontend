'use strict';

const fs = require('fs');
const path = require('path');

process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';

const {
  loadInterviewArtifacts,
  loadSystemDesignArtifacts,
  resetInterviewArtifactsCache,
} = require(
  '../services/interview/artifacts'
);
const {
  bandProfileFor,
  buildSystemDesignPresentationOrder,
  deterministicShuffle,
  eligibleQuestionForms,
  selectCodingVariant,
  selectQuestions,
  selectSystemDesignScenario,
} = require('../services/interview/selection');

function countsBy(rows, field) {
  return rows.reduce((counts, row) => {
    counts[row[field]] = (counts[row[field]] || 0) + 1;
    return counts;
  }, {});
}

function loadAuthoringQuestions() {
  const itemsRoot = path.resolve(
    __dirname,
    '../../content-drafts/interview-mcq/items'
  );
  return fs.readdirSync(itemsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((technologyDirectory) => {
      const technologyRoot = path.join(itemsRoot, technologyDirectory.name);
      return fs.readdirSync(technologyRoot)
        .filter((fileName) => fileName.endsWith('.authoring.json'))
        .map((fileName) => {
          const item = JSON.parse(fs.readFileSync(
            path.join(technologyRoot, fileName),
            'utf8'
          ));
          return {
            id: item.id,
            revision: item.revision,
            authoredAt: item.author.authoredAt,
            ...item.public,
            correctOptionId: item.private.correctOptionId,
          };
        });
    });
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

  test('every candidate-bank question is reachable and each track/level has a rich form pool', () => {
    const questions = loadAuthoringQuestions();
    const reachableIds = new Set();

    expect(questions).toHaveLength(120);
    for (const level of ['junior', 'mid', 'senior']) {
      for (const track of ['core-web', 'react', 'angular', 'vue']) {
        const forms = eligibleQuestionForms({ questions, track, level });
        expect(forms.length).toBeGreaterThanOrEqual(100);
        forms.flat().forEach((question) => reachableIds.add(question.id));
      }
    }

    expect([...questions]
      .filter((question) => !reachableIds.has(question.id))
      .map((question) => question.id))
      .toEqual([]);
  });

  test('prioritizes newly added unseen questions when they can form a valid interview', () => {
    const candidateQuestions = loadAuthoringQuestions();
    const expansionIds = new Set(
      candidateQuestions
        .filter((question) => question.authoredAt === '2026-07-29')
        .map((question) => question.id)
    );
    const priorCorpusIds = candidateQuestions
      .filter((question) => !expansionIds.has(question.id))
      .map((question) => question.id);
    const selected = selectQuestions({
      questions: candidateQuestions,
      track: 'react',
      level: 'mid',
      seed: 'candidate-unseen-priority',
      seenCounts: new Map(
        priorCorpusIds.map((id) => [
          id,
          { count: 3, lastSeenAt: '2026-07-28T12:00:00.000Z' },
        ])
      ),
    });

    expect(selected).toHaveLength(5);
    expect(expansionIds.size).toBe(60);
    expect(selected.every((question) => expansionIds.has(question.id))).toBe(true);
  });

  test('the 60-question expansion rotates source answer positions per technology', () => {
    const expansion = loadAuthoringQuestions()
      .filter((question) => question.authoredAt === '2026-07-29');
    const positionCounts = [0, 0, 0];

    expect(expansion).toHaveLength(60);
    for (const technology of ['javascript', 'html', 'css', 'react', 'angular', 'vue']) {
      const technologyItems = expansion
        .filter((question) => question.technology === technology)
        .sort((left, right) => left.id.localeCompare(right.id));
      technologyItems.forEach((question, index) => {
        const position = question.options.findIndex(
          (option) => option.id === question.correctOptionId
        );
        expect(position).toBe(index % 3);
        positionCounts[position] += 1;
      });
    }

    expect(positionCounts).toEqual([20, 20, 20]);
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

  test('selects the enabled framework-independent System Design scenario by level', () => {
    const registry = loadSystemDesignArtifacts({ force: true });
    for (const level of ['junior', 'mid', 'senior']) {
      const react = selectSystemDesignScenario({
        scenarios: registry.scenarios,
        level,
        seed: `design:react:${level}`,
      });
      const vue = selectSystemDesignScenario({
        scenarios: registry.scenarios,
        level,
        seed: `design:vue:${level}`,
      });
      expect(react).toEqual(vue);
      expect(react).toEqual(expect.objectContaining({
        enabled: true,
        level,
        frameworkLenses: expect.objectContaining({
          'core-web': expect.any(Object),
          react: expect.any(Object),
          angular: expect.any(Object),
          vue: expect.any(Object),
        }),
      }));
    }
  });

  test('pins a stable System Design presentation permutation without changing ids', () => {
    const registry = loadSystemDesignArtifacts();
    const scenario = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'mid',
      seed: 'system-design-scenario',
    });
    const privateScenario = registry.privateByKey.get(
      `${scenario.id}@${scenario.revision}`
    );
    const build = (seed) => buildSystemDesignPresentationOrder({
      scenario,
      privateScenario,
      seed,
    });
    const first = build('stable-presentation-seed');
    expect(build('stable-presentation-seed')).toEqual(first);
    expect(first).toEqual(expect.objectContaining({
      schemaVersion: '1.0.0',
      clarificationIds: expect.any(Array),
      requirementIds: expect.any(Array),
      cardIds: expect.any(Array),
      decisions: expect.any(Array),
      twistActionIds: expect.any(Array),
    }));
    expect(new Set(first.clarificationIds)).toEqual(
      new Set(scenario.clarifications.map((entry) => entry.id))
    );
    expect(new Set(first.requirementIds)).toEqual(
      new Set(scenario.requirements.map((entry) => entry.id))
    );
    expect(new Set(first.cardIds)).toEqual(
      new Set(scenario.cards.map((entry) => entry.id))
    );
    expect(new Set(first.twistActionIds)).toEqual(
      new Set(privateScenario.twist.responseActions.map((entry) => entry.id))
    );
    for (const decision of scenario.decisions) {
      const order = first.decisions.find((entry) => entry.decisionId === decision.id);
      expect(new Set(order.optionIds)).toEqual(
        new Set(decision.options.map((entry) => entry.id))
      );
      expect(new Set(order.rationaleIds)).toEqual(
        new Set(decision.rationales.map((entry) => entry.id))
      );
    }

    const presentations = Array.from({ length: 32 }, (_, index) =>
      build(`presentation-seed-${index}`)
    );
    const signatures = presentations.map((presentation) =>
      JSON.stringify(presentation)
    );
    expect(new Set(signatures).size).toBeGreaterThan(1);
    const expectShuffledAcrossSessions = (project) => {
      expect(new Set(presentations.map((presentation) =>
        JSON.stringify(project(presentation))
      )).size).toBeGreaterThan(1);
    };
    expectShuffledAcrossSessions((presentation) => presentation.clarificationIds);
    expectShuffledAcrossSessions((presentation) => presentation.requirementIds);
    expectShuffledAcrossSessions((presentation) => presentation.cardIds);
    expectShuffledAcrossSessions((presentation) => presentation.twistActionIds);
    for (const decision of scenario.decisions) {
      expectShuffledAcrossSessions((presentation) =>
        presentation.decisions.find(
          (entry) => entry.decisionId === decision.id
        ).optionIds
      );
      expectShuffledAcrossSessions((presentation) =>
        presentation.decisions.find(
          (entry) => entry.decisionId === decision.id
        ).rationaleIds
      );
    }
  });
});
