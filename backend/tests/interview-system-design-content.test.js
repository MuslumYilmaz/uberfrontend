'use strict';

const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { buildResultSnapshot } = require('../services/interview/scoring');

const interviewContentDir = path.resolve(__dirname, '../content/interview');
const publicPackage = require('../content/interview/interview-system-design-registry-v1.public.json');
const privatePackage = require('../content/interview/interview-system-design-registry-v1.private.json');
const release = require('../content/interview/interview-system-design-registry-v1.release.json');
const contentModuleUrl = pathToFileURL(
  path.join(interviewContentDir, 'tools/system-design-content-lib.mjs')
).href;
const sharedModuleUrl = pathToFileURL(
  path.join(interviewContentDir, 'tools/interview-content-lib.mjs')
).href;

function runContentProbe(body) {
  const source = `
    import * as content from ${JSON.stringify(contentModuleUrl)};
    import * as shared from ${JSON.stringify(sharedModuleUrl)};
    ${body}
  `;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  }));
}

function fileSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function runtimeFixtureResult(
  publicScenario,
  privateScenario,
  fixture,
  draft = fixture.draft,
  overrides = {}
) {
  const startedAt = new Date('2026-07-29T10:00:00.000Z');
  const finalizedAt = new Date('2026-07-29T10:08:00.000Z');
  const baseline = Object.hasOwn(overrides, 'baseline')
    ? overrides.baseline
    : fixture.baseline;
  const twistRevealedAt = Object.hasOwn(overrides, 'twistRevealedAt')
    ? overrides.twistRevealedAt
    : new Date('2026-07-29T10:06:00.000Z');
  return buildResultSnapshot({
    _id: `${privateScenario.id}-${fixture.id}`,
    format: 'system-design',
    level: publicScenario.level,
    track: 'core-web',
    timingMode: 'standard',
    timingPolicy: { systemDesignSeconds: publicScenario.timeLimitSeconds },
    systemDesignScenario: publicScenario,
    systemDesignPrivate: privateScenario,
    systemDesignDraft: draft,
    systemDesignBaseline: baseline,
    systemDesignStartedAt: startedAt,
    systemDesignSubmittedAt: finalizedAt,
    systemDesignTwistRevealedAt: twistRevealedAt,
    systemDesignOutcome: 'submitted',
  }, { finalizedAt });
}

function changedDecisionId(fixture) {
  return fixture.draft.decisions.find((decision) => {
    const baselineDecision = fixture.baseline.decisions.find(
      (entry) => entry.decisionId === decision.decisionId
    );
    return baselineDecision && baselineDecision.optionId !== decision.optionId;
  })?.decisionId;
}

describe('guided system-design interview content', () => {
  test('builds the exact candidate scenario matrix without private-answer leakage', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual([]);
    expect(publicPackage.status).toBe('candidate');
    expect(publicPackage.scenarios.map((scenario) => [
      scenario.id,
      scenario.level,
      scenario.timeLimitSeconds,
    ])).toEqual([
      ['int-sd-ai-chat-composer-mid-v1', 'mid', 900],
      ['int-sd-autocomplete-race-mid-v1', 'mid', 900],
      ['int-sd-checkout-recovery-mid-v1', 'mid', 900],
      ['int-sd-dashboard-layout-sr-v1', 'senior', 1200],
      ['int-sd-image-upload-lifecycle-jr-v1', 'junior', 600],
      ['int-sd-live-chart-pipeline-mid-v1', 'mid', 900],
      ['int-sd-ranked-feed-sr-v1', 'senior', 1200],
      ['int-sd-toast-lifecycle-jr-v1', 'junior', 600],
    ]);

    const serialized = JSON.stringify(publicPackage);
    for (const privateMarker of [
      'allowedLaneIds',
      'clarificationAnswers',
      'responseActions',
      'sourceEvidence',
      'validationFixtures',
      'remediationTopics',
      '"rubric"',
    ]) {
      expect(serialized).not.toContain(privateMarker);
    }
    for (const scenario of publicPackage.scenarios) {
      expect(scenario.selectionLimits.rationalesPerDecision).toBe(2);
      expect(scenario.cards.every((card) => !Object.hasOwn(card, 'allowedLaneIds')))
        .toBe(true);
    }
  });

  test('rejects option-length and absolute-language answer clues', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const firstDecision = built.publicPackage.scenarios[0].decisions[0];
      firstDecision.options[0].description = [
        firstDecision.options[0].description,
        "This deliberately overexplains one choice with several unnecessary implementation details.",
      ].join(" ");
      firstDecision.options[1].description = "Always accept the simplest path.";
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('choice length differs from its peer median by more than 25%'),
      expect.stringContaining('choice wording contains an avoidable absolute-language clue'),
    ]));
  });

  test('rejects four-word solution signatures leaked through clarification answers', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-ai-chat-composer-mid-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const sendDecision = scenario.decisions.find(
        (entry) => entry.id === "chat-send-identity"
      );
      const option = sendDecision.options.find(
        (entry) => entry.id === "chat-send-command-message"
      );
      const rationale = sendDecision.rationales.find(
        (entry) => entry.id === "chat-rationale-one-turn"
      );
      privateScenario.clarificationAnswers.find(
        (entry) => entry.clarificationId === "chat-send-uncertainty"
      ).answer = \`The API constraint is: \${option.label}. \${option.description}\`;
      privateScenario.clarificationAnswers.find(
        (entry) => entry.clarificationId === "chat-draft-scope"
      ).answer = \`The product constraint is to \${rationale.label}.\`;
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining(
        'clarification answer repeats a four-word solution signature '
        + 'from chat-send-identity/chat-send-command-message'
      ),
      expect.stringContaining(
        'clarification answer repeats a four-word solution signature '
        + 'from chat-send-identity/chat-rationale-one-turn'
      ),
    ]));
  });

  test('rejects contradiction metadata that runtime artifact loading requires', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-image-upload-lifecycle-jr-v1"
      );
      delete scenario.rubric.contradictions[0].summary;
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining(
        'int-sd-image-upload-lifecycle-jr-v1/upload-critical-preview-as-asset: '
        + 'contradiction metadata is invalid'
      ),
    ]));
  });

  test('keeps generated public, private, and release artifacts deterministic', () => {
    const filesMatch = runContentProbe(`
      import fs from 'node:fs';
      import path from 'node:path';
      const built = content.buildSystemDesignContent();
      console.log(JSON.stringify(Object.entries(built.files).every(([name, text]) => (
        fs.readFileSync(path.join(shared.interviewContentDir, name), 'utf8') === text
      ))));
    `);
    expect(filesMatch).toBe(true);

    for (const visibility of ['public', 'private']) {
      const artifact = release.artifacts[visibility];
      expect(fileSha256(path.join(interviewContentDir, artifact.file))).toBe(artifact.sha256);
    }
  });

  test('executes two strong paths plus developing and critical paths per scenario', () => {
    const scoresByScenario = runContentProbe(`
      const built = content.buildSystemDesignContent();
      console.log(JSON.stringify(built.privatePackage.scenarios.map((scenario) => ({
        id: scenario.id,
        scores: scenario.validationFixtures.map((fixture) => ({
          kind: fixture.kind,
          signal: content.scoreSystemDesignFixture(scenario, fixture).practiceSignal,
          contradictions: content.scoreSystemDesignFixture(scenario, fixture).contradictions,
        })),
      }))));
    `);
    for (const scenario of scoresByScenario) {
      expect(scenario.scores.filter(({ kind }) => kind === 'strong')).toEqual([
        {
          kind: 'strong',
          signal: 'Strong System Design Session',
          contradictions: [],
        },
        {
          kind: 'strong',
          signal: 'Strong System Design Session',
          contradictions: [],
        },
      ]);
      expect(scenario.scores).toContainEqual(expect.objectContaining({
        kind: 'developing',
        signal: 'On Track',
      }));
      expect(scenario.scores).toContainEqual(expect.objectContaining({
        kind: 'critical-conflict',
        signal: 'Needs Focus',
        contradictions: expect.arrayContaining([
          expect.objectContaining({ severity: 'critical' }),
        ]),
      }));
    }
  });

  test('calibrates resilient checkout across hosted, embedded, and unsafe recovery paths', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-checkout-recovery-mid-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const decision = (fixture, decisionId) => fixture.draft.decisions.find(
        (entry) => entry.decisionId === decisionId
      )?.optionId;
      console.log(JSON.stringify({
        publicShape: {
          level: scenario.level,
          timeLimitSeconds: scenario.timeLimitSeconds,
          clarifications: scenario.clarifications.length,
          requirements: scenario.requirements.length,
          cards: scenario.cards.length,
          decisions: scenario.decisions.length,
          lenses: Object.keys(scenario.frameworkLenses).sort(),
        },
        source: privateScenario.sourceEvidence,
        twist: privateScenario.twist,
        adaptationRules: privateScenario.rubric.axes.find(
          (axis) => axis.id === "adaptation-tradeoffs"
        ).criteria.map((criterion) => criterion.rule),
        strong: privateScenario.validationFixtures
          .filter((entry) => entry.kind === "strong")
          .map((fixture) => ({
            id: fixture.id,
            signal: content.scoreSystemDesignFixture(
              privateScenario,
              fixture
            ).practiceSignal,
            surface: decision(fixture, "checkout-payment-surface"),
            placedCards: fixture.draft.placements.map((entry) => entry.cardId),
            changedDecisionIds: fixture.draft.decisions
              .filter((entry) => fixture.baseline.decisions.some(
                (baseline) => baseline.decisionId === entry.decisionId
                  && baseline.optionId !== entry.optionId
              ))
              .map((entry) => entry.decisionId),
          })),
        critical: (() => {
          const fixture = privateScenario.validationFixtures.find(
            (entry) => entry.kind === "critical-conflict"
          );
          const score = content.scoreSystemDesignFixture(privateScenario, fixture);
          return {
            signal: score.practiceSignal,
            contradictions: score.contradictions,
          };
        })(),
      }));
    `);

    expect(result.publicShape).toEqual({
      level: 'mid',
      timeLimitSeconds: 900,
      clarifications: 7,
      requirements: 6,
      cards: 14,
      decisions: 4,
      lenses: ['angular', 'core-web', 'react', 'vue'],
    });
    expect(result.source).toEqual(expect.objectContaining({
      sourceContentId: 'resilient-checkout-payment-flow',
      bundleHash: '7054f4b19f21f8940ee778874c8d2b3f4ab44874d0ff400f237d651ddc5b13ea',
      files: expect.any(Array),
    }));
    expect(result.source.files).toHaveLength(6);
    expect(result.twist.id).toBe('checkout-cross-tab-return');
    expect(result.twist.prompt).toMatch(/BroadcastChannel/);
    expect(JSON.stringify(result.adaptationRules)).not.toContain('changedFromBaseline');
    expect(result.strong).toEqual([
      expect.objectContaining({
        id: 'checkout-strong-hosted',
        signal: 'Strong System Design Session',
        surface: 'checkout-surface-hosted',
        placedCards: expect.arrayContaining(['checkout-hosted-payment']),
        changedDecisionIds: [],
      }),
      expect.objectContaining({
        id: 'checkout-strong-embedded',
        signal: 'Strong System Design Session',
        surface: 'checkout-surface-embedded',
        placedCards: expect.arrayContaining(['checkout-embedded-fields']),
        changedDecisionIds: [],
      }),
    ]);
    expect(result.critical.signal).toBe('Needs Focus');
    expect(result.critical.contradictions).toEqual(expect.arrayContaining([
      { id: 'checkout-critical-redirect-success', severity: 'critical' },
      { id: 'checkout-critical-direct-card-data', severity: 'critical' },
      { id: 'checkout-critical-return-retry', severity: 'critical' },
      { id: 'checkout-critical-tab-lock', severity: 'critical' },
    ]));
  });

  test('scores both dashboard ownership paths as distinct revision-safe architectures', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-dashboard-layout-sr-v1"
      );
      console.log(JSON.stringify({
        sourceContentId: scenario.sourceEvidence.sourceContentId,
        sourceBundleHash: scenario.sourceEvidence.bundleHash,
        fixtures: scenario.validationFixtures
          .filter((entry) => entry.kind === "strong")
          .map((fixture) => ({
            signal: content.scoreSystemDesignFixture(scenario, fixture).practiceSignal,
            contradictions: content.scoreSystemDesignFixture(scenario, fixture).contradictions,
            ownershipOptionId: fixture.draft.decisions.find(
              (entry) => entry.decisionId === "dash-state-ownership"
            )?.optionId,
            responsiveOptionId: fixture.draft.decisions.find(
              (entry) => entry.decisionId === "dash-coordinate-model"
            )?.optionId,
            previewOptionId: fixture.draft.decisions.find(
              (entry) => entry.decisionId === "dash-preview-model"
            )?.optionId,
            conflictOptionId: fixture.draft.decisions.find(
              (entry) => entry.decisionId === "dash-conflict-policy"
            )?.optionId,
            changedDecisionIds: fixture.draft.decisions
              .filter((decision) => fixture.baseline.decisions.some(
                (baseline) => baseline.decisionId === decision.decisionId
                  && baseline.optionId !== decision.optionId
              ))
              .map((entry) => entry.decisionId),
            twistActionIds: [...fixture.draft.twistResponseActionIds].sort(),
          })),
      }));
    `);

    expect(result.sourceContentId).toBe('dashboard-widgets-draggable-resizable');
    expect(result.sourceBundleHash).toBe(
      '88be64af7409aa5b4f35d9de8109cbd30554d1396de31a0a59216e13cd2d57ee'
    );
    expect(result.fixtures).toHaveLength(2);
    expect(new Set(result.fixtures.map((entry) => entry.ownershipOptionId)).size).toBe(2);
    expect(new Set(result.fixtures.map((entry) => entry.responsiveOptionId)).size).toBe(2);
    expect(new Set(result.fixtures.map((entry) => entry.previewOptionId)).size).toBe(2);
    for (const fixture of result.fixtures) {
      expect(fixture).toEqual(expect.objectContaining({
        signal: 'Strong System Design Session',
        contradictions: [],
        conflictOptionId: 'dash-conflict-revision-rebase',
        changedDecisionIds: ['dash-conflict-policy'],
        twistActionIds: [
          'dash-twist-preserve-preview',
          'dash-twist-rebase-commit',
        ],
      }));
    }
  });

  test('accepts an already revision-aware dashboard decision before the twist', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-dashboard-layout-sr-v1"
      );
      const fixture = structuredClone(scenario.validationFixtures.find(
        (entry) => entry.kind === "strong"
      ));
      const accepted = fixture.draft.decisions.find(
        (entry) => entry.decisionId === "dash-conflict-policy"
      );
      fixture.baseline.decisions = fixture.baseline.decisions.map((entry) => (
        entry.decisionId === accepted.decisionId ? structuredClone(accepted) : entry
      ));
      const score = content.scoreSystemDesignFixture(scenario, fixture);
      console.log(JSON.stringify({
        signal: score.practiceSignal,
        adaptation: score.axes.find(
          (axis) => axis.id === "adaptation-tradeoffs"
        ).status,
        rules: scenario.rubric.axes.find(
          (axis) => axis.id === "adaptation-tradeoffs"
        ).criteria.map((criterion) => criterion.rule),
      }));
    `);

    expect(result.signal).toBe('Strong System Design Session');
    expect(result.adaptation).toBe('strong-evidence');
    expect(JSON.stringify(result.rules)).not.toContain('changedFromBaseline');
  });

  test('requires the dashboard engine, controller, and accessible controls for strong axes', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-dashboard-layout-sr-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const targets = [
        ["dash-layout-engine", "architecture-ownership"],
        ["dash-interaction-controller", "architecture-ownership"],
        ["dash-accessible-layout-controls", "accessibility-product-ux"],
      ];
      const removeCard = (draft, cardId) => {
        draft.placements = draft.placements.filter(
          (entry) => entry.cardId !== cardId
        );
        draft.connections = draft.connections.filter(
          (entry) => entry.fromCardId !== cardId && entry.toCardId !== cardId
        );
        const nextOrder = new Map();
        for (const placement of draft.placements) {
          const order = nextOrder.get(placement.laneId) || 0;
          placement.order = order;
          nextOrder.set(placement.laneId, order + 1);
        }
      };
      const outcomes = [];
      for (const strong of privateScenario.validationFixtures.filter(
        (entry) => entry.kind === "strong"
      )) {
        for (const [cardId, axisId] of targets) {
          const fixture = structuredClone(strong);
          removeCard(fixture.draft, cardId);
          const score = content.scoreSystemDesignFixture(privateScenario, fixture);
          outcomes.push({
            fixtureId: strong.id,
            cardId,
            validation: content.validateSystemDesignDraft({
              scenario,
              privateScenario,
              draft: fixture.draft,
              baseline: fixture.baseline,
            }),
            signal: score.practiceSignal,
            axisStatus: score.axes.find((axis) => axis.id === axisId).status,
          });
        }
      }
      console.log(JSON.stringify(outcomes));
    `);

    expect(outcomes).toHaveLength(6);
    for (const outcome of outcomes) {
      expect(outcome.validation).toEqual([]);
      expect(outcome.signal).not.toBe('Strong System Design Session');
      expect(outcome.axisStatus).toBe('needs-focus');
    }
  });

  test('caps the dashboard hot-path overwrite conflict as critical', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-dashboard-layout-sr-v1"
      );
      const fixture = scenario.validationFixtures.find(
        (entry) => entry.kind === "critical-conflict"
      );
      const score = content.scoreSystemDesignFixture(scenario, fixture);
      console.log(JSON.stringify({
        signal: score.practiceSignal,
        contradictions: score.contradictions,
        axisStatuses: Object.fromEntries(score.axes.map((axis) => [axis.id, axis.status])),
        previewOptionId: fixture.draft.decisions.find(
          (entry) => entry.decisionId === "dash-preview-model"
        )?.optionId,
        conflictOptionId: fixture.draft.decisions.find(
          (entry) => entry.decisionId === "dash-conflict-policy"
        )?.optionId,
      }));
    `);

    expect(result).toEqual(expect.objectContaining({
      signal: 'Needs Focus',
      contradictions: expect.arrayContaining([
        expect.objectContaining({
          id: 'dash-critical-hot-overwrite',
          severity: 'critical',
        }),
        expect.objectContaining({
          id: 'dash-critical-widget-pointer',
          severity: 'critical',
        }),
        expect.objectContaining({
          id: 'dash-critical-twist-overwrite',
          severity: 'critical',
        }),
      ]),
      previewOptionId: 'dash-preview-per-event-commit',
      conflictOptionId: 'dash-conflict-force-overwrite',
      axisStatuses: expect.objectContaining({
        'data-interface-contracts': 'needs-focus',
        'resilience-performance': 'needs-focus',
      }),
    }));
  });

  test('scores both live-chart pipelines as distinct burst-safe architectures', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-live-chart-pipeline-mid-v1"
      );
      const decision = (draft, decisionId) => draft.decisions.find(
        (entry) => entry.decisionId === decisionId
      )?.optionId;
      console.log(JSON.stringify({
        sourceContentId: scenario.sourceEvidence.sourceContentId,
        sourceBundleHash: scenario.sourceEvidence.bundleHash,
        fixtures: scenario.validationFixtures
          .filter((entry) => entry.kind === "strong")
          .map((fixture) => ({
            id: fixture.id,
            signal: content.scoreSystemDesignFixture(scenario, fixture).practiceSignal,
            contradictions: content.scoreSystemDesignFixture(scenario, fixture).contradictions,
            ownershipOptionId: decision(fixture.draft, "chart-flow-ownership"),
            retentionOptionId: decision(fixture.draft, "chart-retention-projection"),
            baselinePaintOptionId: decision(fixture.baseline, "chart-paint-policy"),
            paintOptionId: decision(fixture.draft, "chart-paint-policy"),
            baselineRecoveryOptionId: decision(fixture.baseline, "chart-gap-recovery"),
            recoveryOptionId: decision(fixture.draft, "chart-gap-recovery"),
            changedDecisionIds: fixture.draft.decisions
              .filter((entry) => decision(fixture.baseline, entry.decisionId) !== entry.optionId)
              .map((entry) => entry.decisionId),
            twistActionIds: [...fixture.draft.twistResponseActionIds].sort(),
          })),
      }));
    `);

    expect(result.sourceContentId).toBe('live-chart-high-frequency-updates');
    expect(result.sourceBundleHash).toBe(
      'fdfa012254e114f85ba50919653dc2a80255413ee4ff2c0e6e06160838f33a1c'
    );
    expect(result.fixtures).toHaveLength(2);
    expect(new Set(result.fixtures.map((entry) => [
      entry.ownershipOptionId,
      entry.retentionOptionId,
      entry.paintOptionId,
      entry.recoveryOptionId,
    ].join(':'))).size).toBe(2);

    const controllerPath = result.fixtures.find(
      (entry) => entry.id === 'chart-strong-controller-raw'
    );
    const featureStorePath = result.fixtures.find(
      (entry) => entry.id === 'chart-strong-store-aggregate'
    );
    expect(controllerPath).toEqual(expect.objectContaining({
      signal: 'Strong System Design Session',
      contradictions: [],
      ownershipOptionId: 'chart-owner-controller',
      retentionOptionId: 'chart-retention-bounded-raw',
      baselinePaintOptionId: 'chart-paint-per-ingress',
      paintOptionId: 'chart-paint-dirty-frame',
      baselineRecoveryOptionId: 'chart-recovery-next-live',
      recoveryOptionId: 'chart-recovery-resume-gap',
      changedDecisionIds: [
        'chart-paint-policy',
        'chart-gap-recovery',
      ],
      twistActionIds: [
        'chart-twist-catch-up-projection',
        'chart-twist-reconcile-gap',
      ],
    }));
    expect(featureStorePath).toEqual(expect.objectContaining({
      signal: 'Strong System Design Session',
      contradictions: [],
      ownershipOptionId: 'chart-owner-feature-store',
      retentionOptionId: 'chart-retention-bounded-aggregate',
      baselinePaintOptionId: 'chart-paint-bounded-commit',
      paintOptionId: 'chart-paint-bounded-commit',
      baselineRecoveryOptionId: 'chart-recovery-snapshot',
      recoveryOptionId: 'chart-recovery-snapshot',
      changedDecisionIds: [],
      twistActionIds: [
        'chart-twist-catch-up-projection',
        'chart-twist-reconcile-gap',
      ],
    }));
  });

  test('requires the live-chart pipeline boundaries for strong axes', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-live-chart-pipeline-mid-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const targets = [
        ["live-chart-coordinator", "architecture-ownership"],
        ["paint-scheduler", "resilience-performance"],
        ["series-window", "data-interface-contracts"],
        ["viewport-projector", "data-interface-contracts"],
        ["accessible-chart-inspector", "accessibility-product-ux"],
      ];
      const removeCard = (draft, cardId) => {
        draft.placements = draft.placements.filter(
          (entry) => entry.cardId !== cardId
        );
        draft.connections = draft.connections.filter(
          (entry) => entry.fromCardId !== cardId && entry.toCardId !== cardId
        );
        const nextOrder = new Map();
        for (const placement of draft.placements) {
          const order = nextOrder.get(placement.laneId) || 0;
          placement.order = order;
          nextOrder.set(placement.laneId, order + 1);
        }
      };
      const outcomes = [];
      for (const strong of privateScenario.validationFixtures.filter(
        (entry) => entry.kind === "strong"
      )) {
        for (const [cardId, axisId] of targets) {
          const fixture = structuredClone(strong);
          removeCard(fixture.draft, cardId);
          const score = content.scoreSystemDesignFixture(privateScenario, fixture);
          outcomes.push({
            fixtureId: strong.id,
            cardId,
            validation: content.validateSystemDesignDraft({
              scenario,
              privateScenario,
              draft: fixture.draft,
              baseline: fixture.baseline,
            }),
            signal: score.practiceSignal,
            axisStatus: score.axes.find((axis) => axis.id === axisId).status,
          });
        }
      }
      console.log(JSON.stringify(outcomes));
    `);

    expect(outcomes).toHaveLength(10);
    for (const outcome of outcomes) {
      expect(outcome.validation).toEqual([]);
      expect(outcome.signal).not.toBe('Strong System Design Session');
      expect(outcome.axisStatus).not.toBe('strong-evidence');
    }
  });

  test('requires accepted gap recovery and a catch-up projection after the chart twist', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-live-chart-pipeline-mid-v1"
      );
      const outcomes = [];
      for (const strong of scenario.validationFixtures.filter(
        (entry) => entry.kind === "strong"
      )) {
        const deletedRecovery = structuredClone(strong);
        deletedRecovery.draft.decisions = deletedRecovery.draft.decisions.filter(
          (entry) => entry.decisionId !== "chart-gap-recovery"
        );
        const wrongRecovery = structuredClone(strong);
        wrongRecovery.draft.decisions = wrongRecovery.draft.decisions.map((entry) => (
          entry.decisionId === "chart-gap-recovery"
            ? {
              decisionId: entry.decisionId,
              optionId: "chart-recovery-next-live",
              rationaleIds: ["chart-rationale-fast-live"],
            }
            : entry
        ));
        const missingGapReconciliation = structuredClone(strong);
        missingGapReconciliation.draft.twistResponseActionIds = (
          missingGapReconciliation.draft.twistResponseActionIds.filter(
            (id) => id !== "chart-twist-reconcile-gap"
          )
        );
        const wrongGapReconciliation = structuredClone(strong);
        wrongGapReconciliation.draft.twistResponseActionIds = (
          wrongGapReconciliation.draft.twistResponseActionIds.map((id) => (
            id === "chart-twist-reconcile-gap"
              ? "chart-twist-mark-live"
              : id
          ))
        );
        const missingCatchUp = structuredClone(strong);
        missingCatchUp.draft.twistResponseActionIds = (
          missingCatchUp.draft.twistResponseActionIds.filter(
            (id) => id !== "chart-twist-catch-up-projection"
          )
        );
        const wrongCatchUp = structuredClone(strong);
        wrongCatchUp.draft.twistResponseActionIds = (
          wrongCatchUp.draft.twistResponseActionIds.map((id) => (
            id === "chart-twist-catch-up-projection"
              ? "chart-twist-replay-paints"
              : id
          ))
        );
        for (const [mutation, fixture] of [
          ["deleted-recovery", deletedRecovery],
          ["wrong-recovery", wrongRecovery],
          ["missing-gap-reconciliation", missingGapReconciliation],
          ["wrong-gap-reconciliation", wrongGapReconciliation],
          ["missing-catch-up", missingCatchUp],
          ["wrong-catch-up", wrongCatchUp],
        ]) {
          const score = content.scoreSystemDesignFixture(scenario, fixture);
          outcomes.push({
            fixtureId: strong.id,
            mutation,
            signal: score.practiceSignal,
            adaptation: score.axes.find(
              (axis) => axis.id === "adaptation-tradeoffs"
            ).status,
          });
        }
      }
      console.log(JSON.stringify(outcomes));
    `);

    expect(outcomes).toHaveLength(12);
    for (const outcome of outcomes) {
      expect(outcome.signal).not.toBe('Strong System Design Session');
      expect(outcome.adaptation).toBe('needs-focus');
    }
  });

  test('caps each isolated live-chart conflict as critical', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-live-chart-pipeline-mid-v1"
      );
      const strong = scenario.validationFixtures.find(
        (entry) => entry.id === "chart-strong-controller-raw"
      );
      const withDecision = (fixture, decisionId, optionId, rationaleId) => {
        fixture.draft.decisions = fixture.draft.decisions.map((entry) => (
          entry.decisionId === decisionId
            ? { decisionId, optionId, rationaleIds: [rationaleId] }
            : entry
        ));
      };

      const paintRetentionGap = structuredClone(strong);
      withDecision(
        paintRetentionGap,
        "chart-retention-projection",
        "chart-retention-paint-driven",
        "chart-rationale-display-memory"
      );
      withDecision(
        paintRetentionGap,
        "chart-gap-recovery",
        "chart-recovery-next-live",
        "chart-rationale-fast-live"
      );

      const ingressReplay = structuredClone(strong);
      withDecision(
        ingressReplay,
        "chart-paint-policy",
        "chart-paint-per-ingress",
        "chart-rationale-lowest-latency"
      );
      ingressReplay.draft.twistResponseActionIds = [
        "chart-twist-reconcile-gap",
        "chart-twist-replay-paints",
      ];

      const inaccessibleFreshGap = structuredClone(strong);
      inaccessibleFreshGap.draft.placements = inaccessibleFreshGap.draft.placements.filter(
        (entry) => entry.cardId !== "accessible-chart-inspector"
      );
      inaccessibleFreshGap.draft.connections = inaccessibleFreshGap.draft.connections.filter(
        (entry) => entry.fromCardId !== "accessible-chart-inspector"
          && entry.toCardId !== "accessible-chart-inspector"
      );
      withDecision(
        inaccessibleFreshGap,
        "chart-gap-recovery",
        "chart-recovery-next-live",
        "chart-rationale-fast-live"
      );
      inaccessibleFreshGap.draft.twistResponseActionIds = [
        "chart-twist-catch-up-projection",
        "chart-twist-mark-live",
      ];

      console.log(JSON.stringify([
        ["paint-retention-gap", paintRetentionGap],
        ["ingress-replay", ingressReplay],
        ["inaccessible-fresh-gap", inaccessibleFreshGap],
      ].map(([mutation, fixture]) => {
        const score = content.scoreSystemDesignFixture(scenario, fixture);
        return {
          mutation,
          signal: score.practiceSignal,
          contradictions: score.contradictions,
        };
      })));
    `);

    expect(outcomes).toEqual([
      expect.objectContaining({
        mutation: 'paint-retention-gap',
        signal: 'Needs Focus',
        contradictions: expect.arrayContaining([
          { id: 'chart-critical-paint-retention-gap', severity: 'critical' },
        ]),
      }),
      expect.objectContaining({
        mutation: 'ingress-replay',
        signal: 'Needs Focus',
        contradictions: expect.arrayContaining([
          { id: 'chart-critical-ingress-replay', severity: 'critical' },
        ]),
      }),
      expect.objectContaining({
        mutation: 'inaccessible-fresh-gap',
        signal: 'Needs Focus',
        contradictions: expect.arrayContaining([
          { id: 'chart-critical-inaccessible-fresh-gap', severity: 'critical' },
        ]),
      }),
    ]);
  });

  test('caps the combined live-chart replay, retention, and freshness conflicts as critical', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-live-chart-pipeline-mid-v1"
      );
      const fixture = scenario.validationFixtures.find(
        (entry) => entry.kind === "critical-conflict"
      );
      const score = content.scoreSystemDesignFixture(scenario, fixture);
      console.log(JSON.stringify({
        fixtureId: fixture.id,
        signal: score.practiceSignal,
        contradictions: score.contradictions,
      }));
    `);

    expect(result).toEqual(expect.objectContaining({
      fixtureId: 'chart-critical-surface-replay',
      signal: 'Needs Focus',
      contradictions: expect.arrayContaining([
        { id: 'chart-critical-paint-retention-gap', severity: 'critical' },
        { id: 'chart-critical-ingress-replay', severity: 'critical' },
        { id: 'chart-critical-inaccessible-fresh-gap', severity: 'critical' },
      ]),
    }));
  });

  test('scores both image-upload ownership and transfer paths as reliable architectures', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-image-upload-lifecycle-jr-v1"
      );
      console.log(JSON.stringify({
        sourceContentId: scenario.sourceEvidence.sourceContentId,
        sourceBundleHash: scenario.sourceEvidence.bundleHash,
        fixtures: scenario.validationFixtures
          .filter((entry) => entry.kind === "strong")
          .map((fixture) => {
            const decision = (draft, decisionId) => draft.decisions.find(
              (entry) => entry.decisionId === decisionId
            )?.optionId;
            return {
              signal: content.scoreSystemDesignFixture(scenario, fixture).practiceSignal,
              contradictions: content.scoreSystemDesignFixture(scenario, fixture).contradictions,
              ownershipOptionId: decision(fixture.draft, "upload-workflow-ownership"),
              transferOptionId: decision(fixture.draft, "upload-transfer-contract"),
              baselineReplacementOptionId: decision(
                fixture.baseline,
                "upload-replacement-policy"
              ),
              replacementOptionId: decision(fixture.draft, "upload-replacement-policy"),
              changedReplacement: decision(fixture.baseline, "upload-replacement-policy")
                !== decision(fixture.draft, "upload-replacement-policy"),
              twistActionIds: [...fixture.draft.twistResponseActionIds].sort(),
            };
          }),
      }));
    `);

    expect(result.sourceContentId).toBe('image-upload-preview');
    expect(result.sourceBundleHash).toBe(
      '11d34dacf26a451d6cd1bef95a5855ad8c529e70f6237b4b6869962f50e462f1'
    );
    expect(result.fixtures).toHaveLength(2);
    expect(new Set(result.fixtures.map((entry) => entry.ownershipOptionId))).toEqual(new Set([
      'upload-owner-controller',
      'upload-owner-feature-store',
    ]));
    expect(new Set(result.fixtures.map((entry) => entry.transferOptionId))).toEqual(new Set([
      'upload-transfer-direct-asset',
      'upload-transfer-session-finalize',
    ]));

    const controllerPath = result.fixtures.find(
      (entry) => entry.ownershipOptionId === 'upload-owner-controller'
    );
    const featureStorePath = result.fixtures.find(
      (entry) => entry.ownershipOptionId === 'upload-owner-feature-store'
    );
    expect(controllerPath).toEqual(expect.objectContaining({
      signal: 'Strong System Design Session',
      contradictions: [],
      transferOptionId: 'upload-transfer-direct-asset',
      replacementOptionId: 'upload-replace-attempt-identity',
      changedReplacement: true,
      twistActionIds: [
        'upload-twist-cleanup-a',
        'upload-twist-obsolete-a',
      ],
    }));
    expect(featureStorePath).toEqual(expect.objectContaining({
      signal: 'Strong System Design Session',
      contradictions: [],
      transferOptionId: 'upload-transfer-session-finalize',
      baselineReplacementOptionId: 'upload-replace-attempt-identity',
      replacementOptionId: 'upload-replace-attempt-identity',
      changedReplacement: false,
      twistActionIds: [
        'upload-twist-cleanup-a',
        'upload-twist-obsolete-a',
      ],
    }));
  });

  test('requires the acceptance-critical image-upload boundaries for strong axes', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-image-upload-lifecycle-jr-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const targets = [
        ["accessible-upload-status", "accessibility-product-ux"],
        ["upload-attempt-controller", "architecture-ownership"],
        ["upload-client", "data-interface-contracts"],
      ];
      const removeCard = (draft, cardId) => {
        draft.placements = draft.placements.filter(
          (entry) => entry.cardId !== cardId
        );
        draft.connections = draft.connections.filter(
          (entry) => entry.fromCardId !== cardId && entry.toCardId !== cardId
        );
        const nextOrder = new Map();
        for (const placement of draft.placements) {
          const order = nextOrder.get(placement.laneId) || 0;
          placement.order = order;
          nextOrder.set(placement.laneId, order + 1);
        }
      };
      const outcomes = [];
      for (const strong of privateScenario.validationFixtures.filter(
        (entry) => entry.kind === "strong"
      )) {
        for (const [cardId, axisId] of targets) {
          const fixture = structuredClone(strong);
          removeCard(fixture.draft, cardId);
          const score = content.scoreSystemDesignFixture(privateScenario, fixture);
          outcomes.push({
            fixtureId: strong.id,
            cardId,
            validation: content.validateSystemDesignDraft({
              scenario,
              privateScenario,
              draft: fixture.draft,
              baseline: fixture.baseline,
            }),
            signal: score.practiceSignal,
            axisStatus: score.axes.find((axis) => axis.id === axisId).status,
          });
        }
      }
      console.log(JSON.stringify(outcomes));
    `);

    expect(outcomes).toHaveLength(6);
    for (const outcome of outcomes) {
      expect(outcome.validation).toEqual([]);
      expect(outcome.signal).not.toBe('Strong System Design Session');
      expect(outcome.axisStatus).toBe('needs-focus');
    }
  });

  test('requires an accepted image replacement policy after the twist', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-image-upload-lifecycle-jr-v1"
      );
      const outcomes = [];
      for (const strong of scenario.validationFixtures.filter(
        (entry) => entry.kind === "strong"
      )) {
        const deleted = structuredClone(strong);
        deleted.draft.decisions = deleted.draft.decisions.filter(
          (entry) => entry.decisionId !== "upload-replacement-policy"
        );
        const stale = structuredClone(strong);
        stale.draft.decisions = stale.draft.decisions.map((entry) => (
          entry.decisionId === "upload-replacement-policy"
            ? {
              decisionId: entry.decisionId,
              optionId: "upload-replace-callback-order",
              rationaleIds: [],
            }
            : entry
        ));
        for (const [mutation, fixture] of [["deleted", deleted], ["stale", stale]]) {
          const score = content.scoreSystemDesignFixture(scenario, fixture);
          outcomes.push({
            fixtureId: strong.id,
            mutation,
            signal: score.practiceSignal,
            adaptation: score.axes.find(
              (axis) => axis.id === "adaptation-tradeoffs"
            ).status,
          });
        }
      }
      console.log(JSON.stringify(outcomes));
    `);

    expect(outcomes).toHaveLength(4);
    for (const outcome of outcomes) {
      expect(outcome.signal).not.toBe('Strong System Design Session');
      expect(outcome.adaptation).toBe('needs-focus');
    }
  });

  test('caps isolated preview-as-asset and stale-overwrite mutations as critical', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-image-upload-lifecycle-jr-v1"
      );
      const strong = scenario.validationFixtures.find(
        (entry) => entry.id === "upload-strong-controller-direct"
      );
      const previewAsAsset = structuredClone(strong);
      previewAsAsset.draft.decisions = previewAsAsset.draft.decisions.map((entry) => (
        entry.decisionId === "upload-transfer-contract"
          ? {
            decisionId: entry.decisionId,
            optionId: "upload-transfer-preview-complete",
            rationaleIds: ["upload-rationale-early-value"],
          }
          : entry
      ));
      const staleOverwrite = structuredClone(strong);
      staleOverwrite.draft.decisions = staleOverwrite.draft.decisions.map((entry) => (
        entry.decisionId === "upload-replacement-policy"
          ? {
            decisionId: entry.decisionId,
            optionId: "upload-replace-callback-order",
            rationaleIds: ["upload-rationale-response-order"],
          }
          : entry
      ));
      staleOverwrite.draft.twistResponseActionIds = [
        "upload-twist-commit-a",
        "upload-twist-latest-callback",
      ];
      console.log(JSON.stringify([
        ["preview", content.scoreSystemDesignFixture(scenario, previewAsAsset)],
        ["stale", content.scoreSystemDesignFixture(scenario, staleOverwrite)],
      ].map(([mutation, score]) => ({
        mutation,
        signal: score.practiceSignal,
        contradictions: score.contradictions,
      }))));
    `);

    expect(outcomes).toEqual([
      expect.objectContaining({
        mutation: 'preview',
        signal: 'Needs Focus',
        contradictions: expect.arrayContaining([
          { id: 'upload-critical-preview-as-asset', severity: 'critical' },
        ]),
      }),
      expect.objectContaining({
        mutation: 'stale',
        signal: 'Needs Focus',
        contradictions: expect.arrayContaining([
          { id: 'upload-critical-stale-overwrite', severity: 'critical' },
        ]),
      }),
    ]);
  });

  test('caps preview-as-asset, stale overwrite, and inaccessible leaks as critical', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-image-upload-lifecycle-jr-v1"
      );
      const fixture = scenario.validationFixtures.find(
        (entry) => entry.kind === "critical-conflict"
      );
      const score = content.scoreSystemDesignFixture(scenario, fixture);
      console.log(JSON.stringify({
        signal: score.practiceSignal,
        contradictions: score.contradictions,
        axisStatuses: Object.fromEntries(score.axes.map((axis) => [axis.id, axis.status])),
        cardIds: fixture.draft.placements.map((placement) => placement.cardId),
      }));
    `);

    expect(result).toEqual(expect.objectContaining({
      signal: 'Needs Focus',
      contradictions: expect.arrayContaining([
        expect.objectContaining({
          id: 'upload-critical-preview-as-asset',
          severity: 'critical',
        }),
        expect.objectContaining({
          id: 'upload-critical-stale-overwrite',
          severity: 'critical',
        }),
        expect.objectContaining({
          id: 'upload-critical-leak-inaccessible',
          severity: 'critical',
        }),
      ]),
      axisStatuses: expect.objectContaining({
        'data-interface-contracts': 'needs-focus',
        'resilience-performance': 'needs-focus',
        'accessibility-product-ux': 'needs-focus',
        'adaptation-tradeoffs': 'needs-focus',
      }),
      cardIds: expect.not.arrayContaining([
        'image-picker',
        'accessible-upload-status',
        'browser-file-runtime',
      ]),
    }));
  });

  test('requires an inaccessible picker path before preview leaks become a critical accessibility contradiction', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-image-upload-lifecycle-jr-v1"
      );
      const strong = scenario.validationFixtures.find(
        (entry) => entry.id === "upload-strong-controller-direct"
      );
      const inaccessibleLeak = structuredClone(strong);
      inaccessibleLeak.draft.decisions = inaccessibleLeak.draft.decisions.map((entry) => {
        if (entry.decisionId === "upload-workflow-ownership") {
          return {
            decisionId: entry.decisionId,
            optionId: "upload-owner-ui-handlers",
            rationaleIds: ["upload-rationale-local-handlers"],
          };
        }
        if (entry.decisionId === "upload-preview-lifecycle") {
          return {
            decisionId: entry.decisionId,
            optionId: "upload-preview-shared-retained",
            rationaleIds: ["upload-rationale-reuse-retained"],
          };
        }
        return entry;
      });
      const removeCards = (fixture, cardIds) => {
        fixture.draft.placements = fixture.draft.placements.filter(
          (placement) => !cardIds.includes(placement.cardId)
        );
        fixture.draft.connections = fixture.draft.connections.filter(
          (connection) => (
            !cardIds.includes(connection.fromCardId)
            && !cardIds.includes(connection.toCardId)
          )
        );
      };
      removeCards(inaccessibleLeak, [
        "browser-file-runtime",
        "accessible-upload-status",
      ]);
      const labeledPicker = content.scoreSystemDesignFixture(scenario, inaccessibleLeak);
      removeCards(inaccessibleLeak, ["image-picker"]);
      const dropOnly = content.scoreSystemDesignFixture(scenario, inaccessibleLeak);
      console.log(JSON.stringify({
        labeledPicker: labeledPicker.contradictions,
        dropOnly: dropOnly.contradictions,
      }));
    `);

    expect(outcomes.labeledPicker).not.toContainEqual(expect.objectContaining({
      id: 'upload-critical-leak-inaccessible',
    }));
    expect(outcomes.dropOnly).toContainEqual(expect.objectContaining({
      id: 'upload-critical-leak-inaccessible',
      severity: 'critical',
    }));
  });

  test('requires every scored composer boundary before the chat fixture can remain strong', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-ai-chat-composer-mid-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const strong = privateScenario.validationFixtures.find(
        (entry) => entry.id === "chat-strong-split-owners"
      );
      const targets = [
        ["chat-composer-view", "accessibility-product-ux"],
        ["chat-message-list", "accessibility-product-ux"],
        ["chat-draft-store", "architecture-ownership"],
        ["chat-attachment-coordinator", "architecture-ownership"],
        ["chat-browser-storage", "architecture-ownership"],
      ];
      const removeCard = (draft, cardId) => {
        draft.placements = draft.placements.filter(
          (entry) => entry.cardId !== cardId
        );
        draft.connections = draft.connections.filter(
          (entry) => entry.fromCardId !== cardId && entry.toCardId !== cardId
        );
        const nextOrder = new Map();
        for (const placement of draft.placements) {
          const order = nextOrder.get(placement.laneId) || 0;
          placement.order = order;
          nextOrder.set(placement.laneId, order + 1);
        }
      };
      console.log(JSON.stringify(targets.map(([cardId, axisId]) => {
        const fixture = structuredClone(strong);
        removeCard(fixture.draft, cardId);
        const score = content.scoreSystemDesignFixture(privateScenario, fixture);
        return {
          cardId,
          validation: content.validateSystemDesignDraft({
            scenario,
            privateScenario,
            draft: fixture.draft,
            baseline: fixture.baseline,
          }),
          signal: score.practiceSignal,
          axisStatus: score.axes.find((axis) => axis.id === axisId).status,
        };
      })));
    `);
    for (const outcome of outcomes) {
      expect(outcome.validation).toEqual([]);
      expect(outcome.signal).toBe('On Track');
      expect(outcome.axisStatus).toBe('needs-focus');
    }
  });

  test('accepts already-correct chat decisions without change-from-baseline evidence', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-ai-chat-composer-mid-v1"
      );
      const adaptation = privateScenario.rubric.axes.find(
        (entry) => entry.id === "adaptation-tradeoffs"
      );
      console.log(JSON.stringify({
        rules: adaptation.criteria.map((entry) => entry.rule),
        strong: privateScenario.validationFixtures
          .filter((entry) => entry.kind === "strong")
          .map((fixture) => ({
            signal: content.scoreSystemDesignFixture(privateScenario, fixture).practiceSignal,
            baseline: fixture.baseline.decisions
              .filter((entry) => [
                "chat-send-identity",
                "chat-stream-terminal",
              ].includes(entry.decisionId))
              .map((entry) => entry.optionId),
            draft: fixture.draft.decisions
              .filter((entry) => [
                "chat-send-identity",
                "chat-stream-terminal",
              ].includes(entry.decisionId))
              .map((entry) => entry.optionId),
          })),
      }));
    `);
    expect(JSON.stringify(result.rules)).not.toContain('changedFromBaseline');
    expect(result.strong).toEqual([
      {
        signal: 'Strong System Design Session',
        baseline: ['chat-send-command-message', 'chat-stream-correlated-terminal'],
        draft: ['chat-send-command-message', 'chat-stream-correlated-terminal'],
      },
      {
        signal: 'Strong System Design Session',
        baseline: ['chat-send-command-message', 'chat-stream-correlated-terminal'],
        draft: ['chat-send-command-message', 'chat-stream-correlated-terminal'],
      },
    ]);
  });

  test('accepts already-correct toast, autocomplete, and feed designs after the twist', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const cases = [
        ["int-sd-toast-lifecycle-jr-v1", "toast-strong-persistent"],
        ["int-sd-autocomplete-race-mid-v1", "search-strong-generation"],
        ["int-sd-ranked-feed-sr-v1", "feed-strong-page-window"],
      ];
      console.log(JSON.stringify(cases.map(([scenarioId, fixtureId]) => {
        const scenario = built.privatePackage.scenarios.find(
          (entry) => entry.id === scenarioId
        );
        const fixture = scenario.validationFixtures.find(
          (entry) => entry.id === fixtureId
        );
        const score = content.scoreSystemDesignFixture(scenario, fixture);
        return {
          scenarioId,
          signal: score.practiceSignal,
          adaptation: score.axes.find(
            (axis) => axis.id === "adaptation-tradeoffs"
          ).status,
          changedDecisionIds: fixture.draft.decisions
            .filter((decision) => fixture.baseline.decisions.some(
              (baseline) => baseline.decisionId === decision.decisionId
                && baseline.optionId !== decision.optionId
            ))
            .map((entry) => entry.decisionId),
          rules: scenario.rubric.axes.find(
            (axis) => axis.id === "adaptation-tradeoffs"
          ).criteria.map((criterion) => criterion.rule),
        };
      })));
    `);

    expect(outcomes.map((entry) => entry.scenarioId)).toEqual([
      'int-sd-toast-lifecycle-jr-v1',
      'int-sd-autocomplete-race-mid-v1',
      'int-sd-ranked-feed-sr-v1',
    ]);
    for (const outcome of outcomes) {
      expect(outcome.signal).toBe('Strong System Design Session');
      expect(outcome.adaptation).toBe('strong-evidence');
      expect(outcome.changedDecisionIds).toEqual([]);
      expect(JSON.stringify(outcome.rules)).not.toContain('changedFromBaseline');
    }
  });

  test('requires autocomplete UI and feed model boundaries for a strong architecture', () => {
    const outcomes = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const cases = [
        {
          scenarioId: "int-sd-autocomplete-race-mid-v1",
          cardIds: ["search-input", "search-results"],
        },
        {
          scenarioId: "int-sd-ranked-feed-sr-v1",
          cardIds: ["feed-view", "feed-entities", "feed-pages"],
        },
      ];
      const removeCard = (draft, cardId) => {
        draft.placements = draft.placements.filter(
          (entry) => entry.cardId !== cardId
        );
        draft.connections = draft.connections.filter(
          (entry) => entry.fromCardId !== cardId && entry.toCardId !== cardId
        );
        const nextOrder = new Map();
        for (const placement of draft.placements) {
          const order = nextOrder.get(placement.laneId) || 0;
          placement.order = order;
          nextOrder.set(placement.laneId, order + 1);
        }
      };
      const outcomes = [];
      for (const { scenarioId, cardIds } of cases) {
        const scenario = built.publicPackage.scenarios.find(
          (entry) => entry.id === scenarioId
        );
        const privateScenario = built.privatePackage.scenarios.find(
          (entry) => entry.id === scenarioId
        );
        for (const strong of privateScenario.validationFixtures.filter(
          (entry) => entry.kind === "strong"
        )) {
          for (const cardId of cardIds) {
            const fixture = structuredClone(strong);
            removeCard(fixture.draft, cardId);
            const score = content.scoreSystemDesignFixture(privateScenario, fixture);
            outcomes.push({
              scenarioId,
              fixtureId: fixture.id,
              cardId,
              validation: content.validateSystemDesignDraft({
                scenario,
                privateScenario,
                draft: fixture.draft,
                baseline: fixture.baseline,
              }),
              signal: score.practiceSignal,
              architecture: score.axes.find(
                (axis) => axis.id === "architecture-ownership"
              ).status,
            });
          }
        }
      }
      console.log(JSON.stringify(outcomes));
    `);

    expect(outcomes).toHaveLength(10);
    for (const outcome of outcomes) {
      expect(outcome.validation).toEqual([]);
      expect(outcome.signal).not.toBe('Strong System Design Session');
      expect(outcome.architecture).toBe('needs-focus');
    }
  });

  test('recovers a removed feed anchor through a surviving neighbor', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === "int-sd-ranked-feed-sr-v1"
      );
      const critical = scenario.validationFixtures.find(
        (entry) => entry.kind === "critical-conflict"
      );
      console.log(JSON.stringify({
        twistId: scenario.twist.id,
        prompt: scenario.twist.prompt,
        actionIds: scenario.twist.responseActions.map((entry) => entry.id),
        strongActions: scenario.validationFixtures
          .filter((entry) => entry.kind === "strong")
          .map((entry) => entry.draft.twistResponseActionIds),
        critical: content.scoreSystemDesignFixture(scenario, critical),
      }));
    `);

    expect(result.twistId).toBe('feed-anchor-removal');
    expect(result.prompt).toMatch(/removes the item currently anchoring/i);
    expect(result.actionIds).toEqual([
      'feed-twist-neighbor-anchor',
      'feed-twist-reconcile-removal',
      'feed-twist-retain-removed',
      'feed-twist-reset',
    ]);
    expect(result.strongActions).toEqual([
      ['feed-twist-neighbor-anchor', 'feed-twist-reconcile-removal'],
      ['feed-twist-neighbor-anchor', 'feed-twist-reconcile-removal'],
    ]);
    expect(result.critical.practiceSignal).toBe('Needs Focus');
    expect(result.critical.contradictions).toContainEqual({
      id: 'feed-critical-retained-anchor',
      severity: 'critical',
    });
  });

  test('keeps generated validation fixtures in parity with runtime scoring', () => {
    const expectedSignals = {
      strong: 'strong-system-design-session',
      developing: 'on-track',
      'critical-conflict': 'needs-focus',
    };
    for (const privateScenario of privatePackage.scenarios) {
      const publicScenario = publicPackage.scenarios.find(
        (scenario) => scenario.id === privateScenario.id
      );
      for (const fixture of privateScenario.validationFixtures) {
        const result = runtimeFixtureResult(publicScenario, privateScenario, fixture);
        expect(result.systemDesign.practiceSignal).toBe(expectedSignals[fixture.kind]);
        expect(result.systemDesign.sourceContentId)
          .toBe(privateScenario.sourceEvidence.sourceContentId);
      }
    }
  });

  test('keeps card-scoped and signature-scoped connection changes in evaluator parity', () => {
    const cases = [
      {
        id: 'card-edge-replaced',
        ruleId: 'controller',
        baseline: [{
          fromCardId: 'controller',
          toCardId: 'view',
          typeId: 'event-flow',
        }],
        current: [{
          fromCardId: 'controller',
          toCardId: 'cache',
          typeId: 'event-flow',
        }],
        expected: true,
      },
      {
        id: 'unrelated-edge-changed',
        ruleId: 'controller',
        baseline: [
          { fromCardId: 'controller', toCardId: 'view', typeId: 'event-flow' },
          { fromCardId: 'cache', toCardId: 'network', typeId: 'data-flow' },
        ],
        current: [
          { fromCardId: 'controller', toCardId: 'view', typeId: 'event-flow' },
          { fromCardId: 'cache', toCardId: 'view', typeId: 'data-flow' },
        ],
        expected: false,
      },
      {
        id: 'exact-edge-removed',
        ruleId: 'controller>view:event-flow',
        baseline: [{
          fromCardId: 'controller',
          toCardId: 'view',
          typeId: 'event-flow',
        }],
        current: [],
        expected: true,
      },
    ];
    const authoringResults = runContentProbe(`
      const cases = ${JSON.stringify(cases)};
      console.log(JSON.stringify(cases.map((entry) => (
        content.evaluateSystemDesignRule(
          {
            predicate: "changedFromBaseline",
            target: "connections",
            id: entry.ruleId,
          },
          { connections: entry.current },
          { connections: entry.baseline },
        ).passed
      ))));
    `);
    const runtimeResults = cases.map((entry) => {
      const startedAt = new Date('2026-07-29T10:00:00.000Z');
      const rule = {
        predicate: 'changedFromBaseline',
        target: 'connections',
        id: entry.ruleId,
      };
      const result = buildResultSnapshot({
        _id: `connection-parity-${entry.id}`,
        format: 'system-design',
        level: 'mid',
        track: 'core-web',
        timingMode: 'standard',
        timingPolicy: { systemDesignSeconds: 900 },
        systemDesignScenario: {
          id: 'connection-parity',
          title: 'Connection parity',
          timeLimitSeconds: 900,
          selectionLimits: { priorities: 0 },
          decisions: [],
        },
        systemDesignPrivate: {
          rubric: {
            axes: [{
              id: 'connection-change',
              title: 'Connection change',
              remediationTopics: ['Connection contracts'],
              criteria: [{
                id: 'connection-changed',
                weight: 1,
                evidence: 'Changed the targeted connection.',
                rule,
              }],
            }],
            contradictions: [],
          },
        },
        systemDesignDraft: {
          connections: entry.current,
        },
        systemDesignBaseline: {
          connections: entry.baseline,
        },
        systemDesignStartedAt: startedAt,
        systemDesignSubmittedAt: new Date('2026-07-29T10:01:00.000Z'),
        systemDesignTwistRevealedAt: startedAt,
        systemDesignOutcome: 'submitted',
      }, {
        finalizedAt: new Date('2026-07-29T10:01:00.000Z'),
      });
      return result.systemDesign.axes[0].status === 'strong-evidence';
    });
    expect(authoringResults).toEqual(cases.map((entry) => entry.expected));
    expect(runtimeResults).toEqual(authoringResults);
  });

  test('keeps placement comparison canonical when object key order differs', () => {
    const cases = [
      {
        current: { order: 0, laneId: 'state', cardId: 'controller' },
        baseline: { cardId: 'controller', laneId: 'state', order: 0 },
        expected: false,
      },
      {
        current: { order: 0, laneId: 'data', cardId: 'controller' },
        baseline: { cardId: 'controller', laneId: 'state', order: 0 },
        expected: true,
      },
    ];
    const authoringResults = runContentProbe(`
      const cases = ${JSON.stringify(cases)};
      console.log(JSON.stringify(cases.map((entry) => (
        content.evaluateSystemDesignRule(
          {
            predicate: "changedFromBaseline",
            target: "placement",
            id: "controller",
          },
          { placements: [entry.current] },
          { placements: [entry.baseline] },
        ).passed
      ))));
    `);
    const runtimeResults = cases.map((entry) => {
      const result = buildResultSnapshot({
        _id: 'placement-parity',
        format: 'system-design',
        level: 'mid',
        track: 'core-web',
        timingMode: 'standard',
        timingPolicy: { systemDesignSeconds: 900 },
        systemDesignScenario: {
          id: 'placement-parity',
          title: 'Placement parity',
          timeLimitSeconds: 900,
          selectionLimits: { priorities: 0 },
          decisions: [],
        },
        systemDesignPrivate: {
          rubric: {
            axes: [{
              id: 'placement-change',
              title: 'Placement change',
              remediationTopics: [],
              criteria: [{
                id: 'placement-changed',
                weight: 1,
                evidence: 'Changed the target placement.',
                rule: {
                  predicate: 'changedFromBaseline',
                  target: 'placement',
                  id: 'controller',
                },
              }],
            }],
            contradictions: [],
          },
        },
        systemDesignDraft: { placements: [entry.current] },
        systemDesignBaseline: { placements: [entry.baseline] },
        systemDesignStartedAt: new Date('2026-07-29T10:00:00.000Z'),
        systemDesignSubmittedAt: new Date('2026-07-29T10:01:00.000Z'),
        systemDesignTwistRevealedAt: new Date('2026-07-29T10:00:30.000Z'),
        systemDesignOutcome: 'submitted',
      }, {
        finalizedAt: new Date('2026-07-29T10:01:00.000Z'),
      });
      return result.systemDesign.axes[0].status === 'strong-evidence';
    });
    expect(authoringResults).toEqual(cases.map((entry) => entry.expected));
    expect(runtimeResults).toEqual(authoringResults);
  });

  test('keeps zero-active axes and major contradiction caps in score parity', () => {
    const passRule = {
      predicate: 'clarificationSelected',
      clarificationId: 'selected',
    };
    const failRule = {
      predicate: 'clarificationSelected',
      clarificationId: 'not-selected',
    };
    const criterion = (id, rule) => ({
      id,
      weight: 1,
      evidence: id,
      rule,
    });
    const rubric = {
      axes: [
        {
          id: 'strong-major',
          title: 'Strong then major',
          remediationTopics: [],
          criteria: [criterion('strong-major-pass', passRule)],
        },
        {
          id: 'strong',
          title: 'Strong',
          remediationTopics: [],
          criteria: [criterion('strong-pass', passRule)],
        },
        {
          id: 'developing-one',
          title: 'Developing one',
          remediationTopics: [],
          criteria: [
            criterion('developing-one-pass', passRule),
            criterion('developing-one-fail', failRule),
          ],
        },
        {
          id: 'developing-two',
          title: 'Developing two',
          remediationTopics: [],
          criteria: [
            criterion('developing-two-pass', passRule),
            criterion('developing-two-fail', failRule),
          ],
        },
        {
          id: 'needs-focus',
          title: 'Needs focus',
          remediationTopics: [],
          criteria: [criterion('needs-focus-fail', failRule)],
        },
        {
          id: 'zero-active',
          title: 'Zero active',
          remediationTopics: [],
          criteria: [criterion('zero-active-conditional', {
            when: {
              if: failRule,
              then: passRule,
            },
          })],
        },
      ],
      contradictions: [{
        id: 'major-cap',
        severity: 'major',
        axisIds: ['strong-major'],
        summary: 'Cap one otherwise strong axis.',
        rule: passRule,
      }],
    };
    const fixture = {
      id: 'score-parity',
      draft: {
        clarificationIds: ['selected'],
      },
      baseline: {
        clarificationIds: ['selected'],
      },
    };
    const authoring = runContentProbe(`
      console.log(JSON.stringify(content.scoreSystemDesignFixture(
        { rubric: ${JSON.stringify(rubric)} },
        ${JSON.stringify(fixture)},
      )));
    `);
    const runtime = buildResultSnapshot({
      _id: 'score-parity',
      format: 'system-design',
      level: 'mid',
      track: 'core-web',
      timingMode: 'standard',
      timingPolicy: { systemDesignSeconds: 900 },
      systemDesignScenario: {
        id: 'score-parity',
        title: 'Score parity',
        timeLimitSeconds: 900,
        selectionLimits: { priorities: 0 },
        decisions: [],
      },
      systemDesignPrivate: { rubric },
      systemDesignDraft: fixture.draft,
      systemDesignBaseline: fixture.baseline,
      systemDesignStartedAt: new Date('2026-07-29T10:00:00.000Z'),
      systemDesignSubmittedAt: new Date('2026-07-29T10:01:00.000Z'),
      systemDesignTwistRevealedAt: new Date('2026-07-29T10:00:30.000Z'),
      systemDesignOutcome: 'submitted',
    }, {
      finalizedAt: new Date('2026-07-29T10:01:00.000Z'),
    });
    expect(authoring.axes.map((axis) => axis.status)).toEqual([
      'developing',
      'strong-evidence',
      'developing',
      'developing',
      'needs-focus',
      'not-evaluated',
    ]);
    expect(runtime.systemDesign.axes.map((axis) => axis.status))
      .toEqual(authoring.axes.map((axis) => axis.status));
    expect(authoring.practiceSignal).toBe('On Track');
    expect(runtime.systemDesign.practiceSignal).toBe('on-track');
  });

  test('does not credit deleted or wrong post-twist decisions as strong adaptation', () => {
    for (const privateScenario of privatePackage.scenarios) {
      const publicScenario = publicPackage.scenarios.find(
        (scenario) => scenario.id === privateScenario.id
      );
      for (const fixture of privateScenario.validationFixtures.filter(
        (entry) => entry.kind === 'strong'
      )) {
        const adaptationDecisionIds = {
          'int-sd-ai-chat-composer-mid-v1': ['chat-send-identity'],
          'int-sd-autocomplete-race-mid-v1': [
            'search-async-control',
            'search-cache-identity',
          ],
          'int-sd-checkout-recovery-mid-v1': ['checkout-result-authority'],
          'int-sd-dashboard-layout-sr-v1': ['dash-conflict-policy'],
          'int-sd-image-upload-lifecycle-jr-v1': ['upload-replacement-policy'],
          'int-sd-live-chart-pipeline-mid-v1': ['chart-gap-recovery'],
          'int-sd-ranked-feed-sr-v1': ['feed-order-change'],
          'int-sd-toast-lifecycle-jr-v1': ['toast-timing', 'toast-overflow'],
        };
        const explicitWrongOptionIds = {
          'chat-send-identity': 'chat-send-fresh-retry',
          'search-async-control': 'search-async-debounce',
          'search-cache-identity': 'search-key-term',
          'checkout-result-authority': 'checkout-result-redirect',
          'dash-conflict-policy': 'dash-conflict-force-overwrite',
          'upload-replacement-policy': 'upload-replace-callback-order',
          'chart-gap-recovery': 'chart-recovery-next-live',
          'feed-order-change': 'feed-order-immediate',
          'toast-timing': 'toast-time-reset',
          'toast-overflow': 'toast-overflow-drop',
        };
        const targetIds = adaptationDecisionIds[privateScenario.id];
        expect(targetIds).toBeDefined();
        expect(targetIds.length).toBeGreaterThan(0);
        for (const targetId of targetIds) {
          expect(fixture.draft.decisions.some(
            (entry) => entry.decisionId === targetId
          )).toBe(true);
          expect(publicScenario.decisions.find(
            (entry) => entry.id === targetId
          )?.options.some(
            (entry) => entry.id === explicitWrongOptionIds[targetId]
          )).toBe(true);
        }

        const deletedDraft = {
          ...fixture.draft,
          decisions: fixture.draft.decisions.filter(
            (entry) => !targetIds.includes(entry.decisionId)
          ),
        };
        const wrongDraft = {
          ...fixture.draft,
          decisions: fixture.draft.decisions.map((entry) => (
            targetIds.includes(entry.decisionId)
              ? {
                decisionId: entry.decisionId,
                optionId: explicitWrongOptionIds[entry.decisionId],
                rationaleIds: [],
              }
              : entry
          )),
        };

        for (const draft of [deletedDraft, wrongDraft]) {
          const result = runtimeFixtureResult(
            publicScenario,
            privateScenario,
            fixture,
            draft
          );
          const adaptation = result.systemDesign.axes.find(
            (axis) => axis.id === 'adaptation-tradeoffs'
          );
          expect(adaptation.status).toBe('needs-focus');
          expect(result.systemDesign.practiceSignal)
            .not.toBe('strong-system-design-session');
        }
      }
    }
  });

  test('marks twist evidence partial without a captured baseline', () => {
    for (const privateScenario of privatePackage.scenarios) {
      const publicScenario = publicPackage.scenarios.find(
        (scenario) => scenario.id === privateScenario.id
      );
      const fixture = privateScenario.validationFixtures.find(
        (entry) => entry.kind === 'strong'
      );
      const unrevealedDraft = {
        ...fixture.draft,
        twistResponseActionIds: [],
      };
      const result = runtimeFixtureResult(
        publicScenario,
        privateScenario,
        fixture,
        unrevealedDraft,
        {
          baseline: null,
          twistRevealedAt: null,
        }
      );
      const adaptation = result.systemDesign.axes.find(
        (axis) => axis.id === 'adaptation-tradeoffs'
      );
      expect(adaptation.status).not.toBe('strong-evidence');
      expect(adaptation.evidence.join(' ')).not.toMatch(/changed/i);
      expect(result.systemDesign.practiceSignal)
        .not.toBe('strong-system-design-session');
      expect(result.systemDesign.partialEvidence).toBe(true);
    }
  });

  test('keeps adaptation scoring independent of performative baseline changes', () => {
    const adaptationDefinitions = privatePackage.scenarios.map((scenario) => ({
      scenarioId: scenario.id,
      definition: scenario.rubric.axes.find(
        (entry) => entry.id === 'adaptation-tradeoffs'
      ),
    }));
    expect(adaptationDefinitions).toHaveLength(8);
    for (const { definition } of adaptationDefinitions) {
      expect(JSON.stringify(definition)).not.toContain('changedFromBaseline');
    }
  });

  test('rejects unknown rule operators instead of interpreting executable content', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      built.privatePackage.scenarios[0].rubric.axes[0].criteria[0].rule = {
        execute: 'return true',
      };
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('exactly one allowlisted operator or predicate'),
    ]));
  });

  test('rejects a bare changedFromBaseline criterion without accepted post-state evidence', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const axis = built.privatePackage.scenarios[0].rubric.axes
        .find((entry) => entry.id === "adaptation-tradeoffs");
      axis.criteria[0].rule = {
        predicate: "changedFromBaseline",
        target: "decision",
        id: built.publicPackage.scenarios[0].decisions[0].id,
      };
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining(
        'changedFromBaseline must be gated by an accepted positive post-state'
      ),
    ]));
  });

  test('rejects rationale-only and optional-anyOf guards for decision changes', () => {
    const errors = runContentProbe(`
      const rationaleOnly = content.buildSystemDesignContent();
      const rationaleScenario = rationaleOnly.publicPackage.scenarios[0];
      const rationaleDecision = rationaleScenario.decisions[0];
      const rationaleAxis = rationaleOnly.privatePackage.scenarios[0].rubric.axes
        .find((entry) => entry.id === "adaptation-tradeoffs");
      rationaleAxis.criteria[0].rule = {
        allOf: [
          {
            predicate: "changedFromBaseline",
            target: "decision",
            id: rationaleDecision.id,
          },
          {
            predicate: "rationaleSelected",
            decisionId: rationaleDecision.id,
            rationaleId: rationaleDecision.rationales[0].id,
          },
        ],
      };

      const optionalGuard = content.buildSystemDesignContent();
      const optionalScenario = optionalGuard.publicPackage.scenarios[0];
      const optionalDecision = optionalScenario.decisions[0];
      const optionalAxis = optionalGuard.privatePackage.scenarios[0].rubric.axes
        .find((entry) => entry.id === "adaptation-tradeoffs");
      optionalAxis.criteria[0].rule = {
        allOf: [
          {
            predicate: "changedFromBaseline",
            target: "decision",
            id: optionalDecision.id,
          },
          {
            anyOf: [
              {
                predicate: "decisionSelected",
                decisionId: optionalDecision.id,
                optionId: optionalDecision.options[0].id,
              },
              {
                predicate: "clarificationSelected",
                clarificationId: optionalScenario.clarifications[0].id,
              },
            ],
          },
        ],
      };
      console.log(JSON.stringify({
        rationaleOnly: content.validateBuiltSystemDesignContent(rationaleOnly),
        optionalGuard: content.validateBuiltSystemDesignContent(optionalGuard),
      }));
    `);
    expect(errors.rationaleOnly).toEqual(expect.arrayContaining([
      expect.stringContaining(
        'changedFromBaseline must be gated by an accepted positive post-state'
      ),
    ]));
    expect(errors.optionalGuard).toEqual(expect.arrayContaining([
      expect.stringContaining(
        'changedFromBaseline must be gated by an accepted positive post-state'
      ),
    ]));
  });

  test('treats an unmet when condition as inactive rather than failed evidence', () => {
    const result = runContentProbe(`
      const rule = {
        when: {
          if: {
            predicate: 'clarificationSelected',
            clarificationId: 'feed-row-geometry',
          },
          then: {
            predicate: 'requirementPrioritized',
            requirementId: 'feed-reading-anchor',
          },
        },
      };
      console.log(JSON.stringify(content.evaluateSystemDesignRule(rule, {
        clarificationIds: [],
        priorityRequirementIds: [],
      })));
    `);
    expect(result).toEqual({ active: false, passed: false });
  });

  test('pins every source bundle and invalidates candidate approval by default', () => {
    expect(release.finalApproval).toBeNull();
    expect(release.registryVersion).toBe('1.2.0');
    expect(publicPackage.registryVersion).toBe('1.2.0');
    expect(privatePackage.registryVersion).toBe('1.2.0');
    expect(release.scenarioRefs).toHaveLength(8);
    expect(Object.fromEntries(release.scenarioRefs.map((scenario) => [
      scenario.id,
      scenario.revision,
    ]))).toEqual({
      'int-sd-ai-chat-composer-mid-v1': 3,
      'int-sd-autocomplete-race-mid-v1': 5,
      'int-sd-checkout-recovery-mid-v1': 1,
      'int-sd-dashboard-layout-sr-v1': 2,
      'int-sd-image-upload-lifecycle-jr-v1': 2,
      'int-sd-live-chart-pipeline-mid-v1': 2,
      'int-sd-ranked-feed-sr-v1': 5,
      'int-sd-toast-lifecycle-jr-v1': 6,
    });
    expect(
      privatePackage.scenarios.find(
        (scenario) => scenario.id === 'int-sd-ai-chat-composer-mid-v1'
      )?.sourceEvidence.sourceContentId
    ).toBe('ai-chat-textarea-design');
    for (const reference of release.scenarioRefs) {
      expect(reference.sourceBundleHash).toMatch(/^[a-f0-9]{64}$/);
      const privateScenario = privatePackage.scenarios.find(
        (scenario) => scenario.id === reference.id
      );
      expect(privateScenario.sourceEvidence.bundleHash).toBe(reference.sourceBundleHash);
      expect(privateScenario.sourceEvidence.files).toHaveLength(6);
      expect(privateScenario.review.definitionHash).toBe(release.definitionHash);
      expect(privateScenario.provenance.copiedText).toBe(false);
      expect(privateScenario.provenance.references).toEqual(expect.arrayContaining([
        expect.objectContaining({
          license: expect.any(String),
          accessedAt: expect.any(String),
        }),
      ]));
    }
  });

  test('rejects source-content drift before generating runtime artifacts', () => {
    const message = runContentProbe(`
      const authoring = shared.readJson(content.systemDesignAuthoringPath);
      const scenario = structuredClone(authoring.scenarios[0]);
      scenario.private.expectedSourceBundleHash = '0'.repeat(64);
      let message = '';
      try {
        content.loadSystemDesignSourceEvidence(scenario);
      } catch (error) {
        message = error.message;
      }
      console.log(JSON.stringify(message));
    `);
    expect(message).toContain('source bundle drifted');
    expect(message).toContain('expected');
  });

  test('rejects fixture connections whose endpoints are not placed on the board', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const fixture = built.privatePackage.scenarios[0].validationFixtures[0];
      const endpoint = fixture.draft.connections[0].toCardId;
      fixture.draft.placements = fixture.draft.placements.filter(
        (placement) => placement.cardId !== endpoint
      );
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('connection is invalid'),
    ]));
  });

  test('rejects duplicate or non-contiguous order values inside a lane', () => {
    const errors = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const fixture = built.privatePackage.scenarios[0].validationFixtures[0];
      const laneId = fixture.draft.placements[0].laneId;
      const sameLane = fixture.draft.placements.filter(
        (placement) => placement.laneId === laneId
      );
      if (sameLane.length < 2) throw new Error('fixture must exercise a multi-card lane');
      sameLane[1].order = sameLane[0].order;
      console.log(JSON.stringify(content.validateBuiltSystemDesignContent(built)));
    `);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('lane placement order must be unique and contiguous from zero'),
    ]));
  });

  test('accepts a wrong public lane while withholding its private placement evidence', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-autocomplete-race-mid-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const fixture = structuredClone(
        privateScenario.validationFixtures.find((entry) => entry.kind === "strong")
      );
      const before = content.scoreSystemDesignFixture(privateScenario, fixture);
      const placement = fixture.draft.placements.find(
        (entry) => entry.cardId === "search-controller"
      );
      placement.laneId = "ui";
      const nextOrder = new Map();
      for (const entry of fixture.draft.placements) {
        const order = nextOrder.get(entry.laneId) || 0;
        entry.order = order;
        nextOrder.set(entry.laneId, order + 1);
      }
      const validation = content.validateSystemDesignDraft({
        scenario,
        privateScenario,
        draft: fixture.draft,
        baseline: fixture.baseline,
      });
      const after = content.scoreSystemDesignFixture(privateScenario, fixture);
      const axis = (score) => score.axes.find(
        (entry) => entry.id === "architecture-ownership"
      );
      console.log(JSON.stringify({
        validation,
        before: axis(before),
        after: axis(after),
      }));
    `);
    expect(result.validation).toEqual([]);
    expect(result.before.passedWeight).toBeGreaterThan(result.after.passedWeight);
    expect(result.after.status).toBe('developing');
  });

  test('rejects selecting every rationale instead of granting free evidence', () => {
    const result = runContentProbe(`
      const built = content.buildSystemDesignContent();
      const scenario = built.publicPackage.scenarios.find(
        (entry) => entry.id === "int-sd-autocomplete-race-mid-v1"
      );
      const privateScenario = built.privatePackage.scenarios.find(
        (entry) => entry.id === scenario.id
      );
      const fixture = structuredClone(
        privateScenario.validationFixtures.find((entry) => entry.kind === "strong")
      );
      const decision = scenario.decisions.find(
        (entry) => entry.id === "search-async-control"
      );
      const answer = fixture.draft.decisions.find(
        (entry) => entry.decisionId === decision.id
      );
      answer.rationaleIds = decision.rationales.map((entry) => entry.id);
      console.log(JSON.stringify({
        limit: scenario.selectionLimits.rationalesPerDecision,
        validation: content.validateSystemDesignDraft({
          scenario,
          privateScenario,
          draft: fixture.draft,
          baseline: fixture.baseline,
        }),
      }));
    `);
    expect(result.limit).toBe(2);
    expect(result.validation).toEqual(expect.arrayContaining([
      expect.stringContaining('decision selection is invalid'),
    ]));
  });
});
