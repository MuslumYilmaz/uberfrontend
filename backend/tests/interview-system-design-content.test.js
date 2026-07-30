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
        const targetId = changedDecisionId(fixture)
          || (privateScenario.id === 'int-sd-ai-chat-composer-mid-v1'
            ? 'chat-send-identity'
            : undefined);
        expect(targetId).toBeDefined();
        const currentDecision = fixture.draft.decisions.find(
          (entry) => entry.decisionId === targetId
        );
        const decisionDefinition = publicScenario.decisions.find(
          (entry) => entry.id === targetId
        );
        const wrongOption = decisionDefinition.options.find(
          (entry) => entry.id !== currentDecision.optionId
        );
        expect(wrongOption).toBeDefined();

        const deletedDraft = {
          ...fixture.draft,
          decisions: fixture.draft.decisions.filter(
            (entry) => entry.decisionId !== targetId
          ),
        };
        const wrongDraft = {
          ...fixture.draft,
          decisions: fixture.draft.decisions.map((entry) => (
            entry.decisionId === targetId
              ? {
                decisionId: targetId,
                optionId: wrongOption.id,
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

  test('does not infer post-twist change evidence without a captured baseline', () => {
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
      expect(adaptation.status).toBe('needs-focus');
      expect(adaptation.evidence.join(' ')).not.toMatch(/changed/i);
      expect(result.systemDesign.practiceSignal)
        .not.toBe('strong-system-design-session');
      expect(result.systemDesign.partialEvidence).toBe(true);
    }
  });

  test('does not treat adding a rationale to the same decision as a design change', () => {
    for (const privateScenario of privatePackage.scenarios) {
      const publicScenario = publicPackage.scenarios.find(
        (scenario) => scenario.id === privateScenario.id
      );
      for (const fixture of privateScenario.validationFixtures.filter(
        (entry) => entry.kind === 'strong'
      )) {
        const targetId = changedDecisionId(fixture);
        if (!targetId) continue;
        const currentDecision = fixture.draft.decisions.find(
          (entry) => entry.decisionId === targetId
        );
        const rationaleOnlyBaseline = {
          ...fixture.baseline,
          decisions: fixture.baseline.decisions.map((entry) => (
            entry.decisionId === targetId
              ? {
                decisionId: targetId,
                optionId: currentDecision.optionId,
                rationaleIds: [],
              }
              : entry
          )),
        };
        const result = runtimeFixtureResult(
          publicScenario,
          privateScenario,
          fixture,
          fixture.draft,
          { baseline: rationaleOnlyBaseline }
        );
        const adaptation = result.systemDesign.axes.find(
          (axis) => axis.id === 'adaptation-tradeoffs'
        );
        expect(adaptation.status).toBe('needs-focus');
        expect(adaptation.evidence.join(' ')).not.toMatch(/changed/i);
        expect(result.systemDesign.practiceSignal)
          .not.toBe('strong-system-design-session');
      }
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
    expect(release.scenarioRefs).toHaveLength(4);
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
