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
  TRACK_TECH_COUNTS,
  bandProfileFor,
  buildSystemDesignPresentationOrder,
  deterministicShuffle,
  eligibleQuestionForms,
  selectCodingVariant,
  selectQuestions,
  selectSystemDesignScenario,
} = require('../services/interview/selection');

function bruteCombinations(values, count, start = 0, prefix = [], out = []) {
  if (prefix.length === count) {
    out.push(prefix);
    return out;
  }
  for (let index = start; index <= values.length - (count - prefix.length); index += 1) {
    bruteCombinations(values, count, index + 1, [...prefix, values[index]], out);
  }
  return out;
}

function exactCountsFor(rows, field, expected) {
  return Object.keys(expected).every(
    (key) => rows.filter((row) => row[field] === key).length === expected[key]
  ) && rows.every((row) => Object.hasOwn(expected, row[field]));
}

function bruteEligibleQuestionForms({ questions, track, level }) {
  const expectedTech = TRACK_TECH_COUNTS[track];
  const expectedBands = bandProfileFor(track, level);
  return bruteCombinations(
    questions.filter(
      (question) => question.level === level && Object.hasOwn(expectedTech, question.technology)
    ),
    5
  ).filter((combo) =>
    exactCountsFor(combo, 'technology', expectedTech)
    && exactCountsFor(combo, 'difficultyBand', expectedBands)
    && combo.some((item) => item.format === 'production-scenario')
    && combo.filter((item) => item.format === 'code-output').length <= 1
  );
}

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

    expect(questions).toHaveLength(170);
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

  test('optimized form enumeration matches the brute-force contract for the 170-item bank', () => {
    const questions = loadAuthoringQuestions();
    for (const level of ['junior', 'mid', 'senior']) {
      for (const track of ['core-web', 'react', 'angular', 'vue']) {
        const signature = (forms) => forms.map(
          (form) => form.map((question) => question.id).join('|')
        );
        expect(signature(eligibleQuestionForms({ questions, track, level })))
          .toEqual(signature(bruteEligibleQuestionForms({ questions, track, level })));
      }
    }
  });

  test('prioritizes newly added unseen questions when they can form a valid interview', () => {
    const candidateQuestions = loadAuthoringQuestions();
    const expansionIds = new Set(
      candidateQuestions
        .filter((question) => question.authoredAt === '2026-08-05')
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
    expect(expansionIds.size).toBe(50);
    expect(selected.every((question) => expansionIds.has(question.id))).toBe(true);
  });

  test('prefers the minimum-seen valid MCQ form before applying seeded ties', () => {
    const questions = loadAuthoringQuestions();
    const target = eligibleQuestionForms({
      questions,
      track: 'react',
      level: 'mid',
    })[0];
    const targetIds = new Set(target.map((question) => question.id));
    const seenCounts = new Map(questions.map((question) => [
      question.id,
      {
        count: targetIds.has(question.id) ? 1 : 4,
        lastSeenAt: '2026-08-01T12:00:00.000Z',
      },
    ]));

    const selected = selectQuestions({
      questions,
      track: 'react',
      level: 'mid',
      seed: 'candidate-minimum-seen',
      seenCounts,
    });
    expect(new Set(selected.map((question) => question.id))).toEqual(targetIds);
  });

  test('prefers the oldest-seen valid MCQ form when seen counts are equal', () => {
    const questions = loadAuthoringQuestions();
    const target = eligibleQuestionForms({
      questions,
      track: 'vue',
      level: 'senior',
    })[0];
    const targetIds = new Set(target.map((question) => question.id));
    const seenCounts = new Map(questions.map((question) => [
      question.id,
      {
        count: 2,
        lastSeenAt: targetIds.has(question.id)
          ? '2026-05-01T12:00:00.000Z'
          : '2026-08-01T12:00:00.000Z',
      },
    ]));

    const selected = selectQuestions({
      questions,
      track: 'vue',
      level: 'senior',
      seed: 'candidate-oldest-seen',
      seenCounts,
    });
    expect(new Set(selected.map((question) => question.id))).toEqual(targetIds);
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

  test('the 50-question candidate expansion preserves the approved source-position quotas', () => {
    const expansion = loadAuthoringQuestions()
      .filter((question) => question.authoredAt === '2026-08-05');
    const positionCounts = [0, 0, 0];

    expect(expansion).toHaveLength(50);
    for (const question of expansion) {
      const position = question.options.findIndex(
        (option) => option.id === question.correctOptionId
      );
      positionCounts[position] += 1;
    }

    expect(positionCounts).toEqual([17, 17, 16]);
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
      const selected = selectSystemDesignScenario({
        scenarios: registry.scenarios,
        level,
        seed: `design:shared:${level}`,
      });
      const repeated = selectSystemDesignScenario({
        scenarios: registry.scenarios,
        level,
        seed: `design:shared:${level}`,
      });
      expect(selected).toEqual(repeated);
      expect(selected).toEqual(expect.objectContaining({
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

  test('rotates the three Mid System Design scenarios by least-seen and deterministic ties', () => {
    const registry = loadSystemDesignArtifacts({ force: true });
    const midScenarios = registry.scenarios.filter((scenario) => scenario.level === 'mid');
    expect(midScenarios.map((scenario) => scenario.id).sort()).toEqual([
      'int-sd-ai-chat-composer-mid-v1',
      'int-sd-autocomplete-race-mid-v1',
      'int-sd-live-chart-pipeline-mid-v1',
    ]);

    const newlyUnseen = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'mid',
      seed: 'design:mid:newly-unseen',
      seenCounts: new Map([
        ['int-sd-autocomplete-race-mid-v1', {
          count: 1,
          lastSeenAt: '2026-07-28T12:00:00.000Z',
        }],
        ['int-sd-ai-chat-composer-mid-v1', {
          count: 1,
          lastSeenAt: '2026-07-29T12:00:00.000Z',
        }],
      ]),
    });
    expect(newlyUnseen.id).toBe('int-sd-live-chart-pipeline-mid-v1');

    const leastSeen = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'mid',
      seed: 'design:mid:least-seen',
      seenCounts: new Map([
        ['int-sd-ai-chat-composer-mid-v1', {
          count: 4,
          lastSeenAt: '2026-05-01T00:00:00.000Z',
        }],
        ['int-sd-autocomplete-race-mid-v1', {
          count: 2,
          lastSeenAt: '2026-07-25T00:00:00.000Z',
        }],
        ['int-sd-live-chart-pipeline-mid-v1', {
          count: 3,
          lastSeenAt: '2026-04-01T00:00:00.000Z',
        }],
      ]),
    });
    expect(leastSeen.id).toBe('int-sd-autocomplete-race-mid-v1');

    const oldestSeen = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'mid',
      seed: 'design:mid:oldest-seen',
      seenCounts: new Map([
        ['int-sd-ai-chat-composer-mid-v1', {
          count: 2,
          lastSeenAt: '2026-05-01T00:00:00.000Z',
        }],
        ['int-sd-autocomplete-race-mid-v1', {
          count: 2,
          lastSeenAt: '2026-07-25T00:00:00.000Z',
        }],
        ['int-sd-live-chart-pipeline-mid-v1', {
          count: 2,
          lastSeenAt: '2026-06-15T00:00:00.000Z',
        }],
      ]),
    });
    expect(oldestSeen.id).toBe('int-sd-ai-chat-composer-mid-v1');

    const tieSelections = Array.from({ length: 32 }, (_, index) =>
      selectSystemDesignScenario({
        scenarios: registry.scenarios,
        level: 'mid',
        seed: `design:mid:tie:${index}`,
      }).id
    );
    expect(new Set(tieSelections)).toEqual(new Set([
      'int-sd-ai-chat-composer-mid-v1',
      'int-sd-autocomplete-race-mid-v1',
      'int-sd-live-chart-pipeline-mid-v1',
    ]));
    expect(selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'mid',
      seed: 'design:mid:stable-tie',
    }).id).toBe(selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'mid',
      seed: 'design:mid:stable-tie',
    }).id);
  });

  test('rotates the two Junior System Design scenarios by least-seen and deterministic ties', () => {
    const registry = loadSystemDesignArtifacts({ force: true });
    const juniorScenarios = registry.scenarios.filter(
      (scenario) => scenario.level === 'junior'
    );
    expect(juniorScenarios.map((scenario) => scenario.id).sort()).toEqual([
      'int-sd-image-upload-lifecycle-jr-v1',
      'int-sd-toast-lifecycle-jr-v1',
    ]);

    const newlyUnseen = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'junior',
      seed: 'design:junior:newly-unseen',
      seenCounts: new Map([
        ['int-sd-toast-lifecycle-jr-v1', {
          count: 1,
          lastSeenAt: '2026-07-28T12:00:00.000Z',
        }],
      ]),
    });
    expect(newlyUnseen.id).toBe('int-sd-image-upload-lifecycle-jr-v1');

    const oldestSeen = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'junior',
      seed: 'design:junior:oldest-seen',
      seenCounts: new Map([
        ['int-sd-image-upload-lifecycle-jr-v1', {
          count: 2,
          lastSeenAt: '2026-05-01T00:00:00.000Z',
        }],
        ['int-sd-toast-lifecycle-jr-v1', {
          count: 2,
          lastSeenAt: '2026-07-25T00:00:00.000Z',
        }],
      ]),
    });
    expect(oldestSeen.id).toBe('int-sd-image-upload-lifecycle-jr-v1');

    const tieSelections = Array.from({ length: 32 }, (_, index) =>
      selectSystemDesignScenario({
        scenarios: registry.scenarios,
        level: 'junior',
        seed: `design:junior:tie:${index}`,
      }).id
    );
    expect(new Set(tieSelections)).toEqual(new Set([
      'int-sd-image-upload-lifecycle-jr-v1',
      'int-sd-toast-lifecycle-jr-v1',
    ]));
    expect(selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'junior',
      seed: 'design:junior:stable-tie',
    }).id).toBe(selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'junior',
      seed: 'design:junior:stable-tie',
    }).id);
  });

  test('rotates the two Senior System Design scenarios by least-seen and deterministic ties', () => {
    const registry = loadSystemDesignArtifacts({ force: true });
    const seniorScenarios = registry.scenarios.filter(
      (scenario) => scenario.level === 'senior'
    );
    expect(seniorScenarios.map((scenario) => scenario.id).sort()).toEqual([
      'int-sd-dashboard-layout-sr-v1',
      'int-sd-ranked-feed-sr-v1',
    ]);

    const newlyUnseen = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'senior',
      seed: 'design:senior:newly-unseen',
      seenCounts: new Map([
        ['int-sd-ranked-feed-sr-v1', {
          count: 1,
          lastSeenAt: '2026-07-28T12:00:00.000Z',
        }],
      ]),
    });
    expect(newlyUnseen.id).toBe('int-sd-dashboard-layout-sr-v1');

    const oldestSeen = selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'senior',
      seed: 'design:senior:oldest-seen',
      seenCounts: new Map([
        ['int-sd-dashboard-layout-sr-v1', {
          count: 2,
          lastSeenAt: '2026-05-01T00:00:00.000Z',
        }],
        ['int-sd-ranked-feed-sr-v1', {
          count: 2,
          lastSeenAt: '2026-07-25T00:00:00.000Z',
        }],
      ]),
    });
    expect(oldestSeen.id).toBe('int-sd-dashboard-layout-sr-v1');

    const tieSelections = Array.from({ length: 32 }, (_, index) =>
      selectSystemDesignScenario({
        scenarios: registry.scenarios,
        level: 'senior',
        seed: `design:senior:tie:${index}`,
      }).id
    );
    expect(new Set(tieSelections)).toEqual(new Set([
      'int-sd-dashboard-layout-sr-v1',
      'int-sd-ranked-feed-sr-v1',
    ]));
    expect(selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'senior',
      seed: 'design:senior:stable-tie',
    }).id).toBe(selectSystemDesignScenario({
      scenarios: registry.scenarios,
      level: 'senior',
      seed: 'design:senior:stable-tie',
    }).id);
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
