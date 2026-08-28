'use strict';

const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.setTimeout(180000);

const TRACKS = ['core-web', 'react', 'angular', 'vue'];
const LEVELS = ['junior', 'mid', 'senior'];
const ATTEMPTS_PER_CELL = 10;
const RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

const ENV_KEYS = [
  'INTERVIEW_ALLOW_CANDIDATE_BANK',
  'INTERVIEW_BANK_PRIVATE_PATH',
  'INTERVIEW_BANK_PUBLIC_PATH',
  'INTERVIEW_BANK_RELEASE_PATH',
  'INTERVIEW_MODE_ACCESS',
  'INTERVIEW_OPERATIONAL_STATE',
  'INTERVIEW_SYSTEM_DESIGN_ACCESS',
  'MONGO_TARGET',
  'MONGO_URL_TEST',
  'EXPECTED_MONGO_DB_NAME_TEST',
];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

let mongoServer;
let connectToMongo;
let disconnectMongo;
let createSession;
let loadSelectionContext;
let User;
let InterviewSession;
let InterviewContentExposure;

function restoreEnvironment() {
  for (const key of ENV_KEYS) {
    if (ORIGINAL_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = ORIGINAL_ENV[key];
  }
}

function literalIdentity(item) {
  return `${item.id}@${item.revision || 1}:${item.contentHash || ''}`;
}

function semanticIdentity(item) {
  return item.conceptId || item.sourceContentId || item.id;
}

function intersectionSize(left, right) {
  const rightSet = new Set(right);
  return new Set(left.filter((value) => rightSet.has(value))).size;
}

function firstRepeatAttempt(attempts, field) {
  const seen = new Set();
  for (let index = 0; index < attempts.length; index += 1) {
    const current = attempts[index][field];
    if (current.some((value) => seen.has(value))) return index + 1;
    current.forEach((value) => seen.add(value));
  }
  return null;
}

function summarizeAttempts(track, level, attempts) {
  const adjacentLiteral = [];
  const adjacentSemantic = [];
  for (let index = 1; index < attempts.length; index += 1) {
    adjacentLiteral.push(intersectionSize(
      attempts[index - 1].allLiteral,
      attempts[index].allLiteral,
    ));
    adjacentSemantic.push(intersectionSize(
      attempts[index - 1].allSemantic,
      attempts[index].allSemantic,
    ));
  }
  const unique = (field) => new Set(attempts.flatMap((attempt) => attempt[field])).size;
  return {
    track,
    level,
    mcqLiteralFirstRepeat: firstRepeatAttempt(attempts, 'mcqLiteral'),
    mcqSemanticFirstRepeat: firstRepeatAttempt(attempts, 'mcqSemantic'),
    codingLiteralFirstRepeat: firstRepeatAttempt(attempts, 'codingLiteral'),
    codingSemanticFirstRepeat: firstRepeatAttempt(attempts, 'codingSemantic'),
    firstAdjacentLiteralOverlap: adjacentLiteral[0] || 0,
    maxAdjacentLiteralOverlap: Math.max(0, ...adjacentLiteral),
    firstAdjacentSemanticOverlap: adjacentSemantic[0] || 0,
    maxAdjacentSemanticOverlap: Math.max(0, ...adjacentSemantic),
    uniqueMcq: unique('mcqLiteral'),
    uniqueMcqConcepts: unique('mcqSemantic'),
    uniqueCoding: unique('codingLiteral'),
    uniqueCodingConcepts: unique('codingSemantic'),
  };
}

async function createPremiumUser(suffix) {
  return User.create({
    email: `repeat-policy-${suffix}@example.com`,
    username: `repeat_policy_${suffix}`,
    passwordHash: 'not-used-by-repeat-policy-test',
    role: 'user',
    accessTier: 'free',
    entitlements: { pro: { status: 'lifetime', validUntil: null } },
  });
}

async function closeSessionForNextAttempt(sessionId, attempt, now) {
  const terminal = attempt % 3;
  if (terminal === 0) {
    await InterviewSession.updateOne(
      { _id: sessionId },
      {
        $set: {
          active: false,
          status: 'abandoned',
          codingOutcome: 'abandoned',
          abandonedAt: now,
        },
      },
    );
    return;
  }
  if (terminal === 1) {
    await InterviewSession.updateOne(
      { _id: sessionId },
      {
        $set: {
          active: false,
          status: 'voided_technical',
          'technicalVoid.reasonCode': 'repeat_policy_simulation',
          'technicalVoid.verifiedAt': now,
        },
      },
    );
    return;
  }
  await InterviewSession.updateOne(
    { _id: sessionId },
    {
      $set: {
        active: false,
        status: 'completed',
        codingOutcome: 'timed_out',
        completedAt: now,
      },
    },
  );
}

async function runAttempt({
  user,
  track,
  level,
  attempt,
  clockOffset = 0,
  seedOverride = null,
}) {
  // Mongo sorts the exposure ledger by exposedAt. Give every sequential mock a
  // strictly increasing timestamp so the harness models real consecutive
  // sessions instead of manufacturing an ambiguous equal-time ordering.
  const now = new Date(Date.UTC(2026, 7, 24, 12, 0, clockOffset + attempt));
  const requestId = `repeat-${track}-${level}-${attempt}`;
  const created = await createSession(user._id, {
    requestId,
    format: 'coding',
    level,
    track,
    timingMode: 'standard',
  }, {
    now,
    seed: seedOverride || `repeat-policy:${track}:${level}:${attempt}`,
    allowCandidateArtifacts: true,
  });
  expect(created.created).toBe(true);

  const exposure = await InterviewContentExposure.findOne({
    sessionId: created.session._id,
  }).lean();
  expect(exposure).not.toBeNull();
  expect(exposure.mcq).toHaveLength(5);
  expect(exposure.coding).toEqual(expect.objectContaining({
    id: expect.any(String),
    conceptId: expect.any(String),
  }));
  expect(exposure.expiresAt.getTime() - exposure.exposedAt.getTime())
    .toBe(RETENTION_MS);

  const mcqLiteral = exposure.mcq.map(literalIdentity);
  const mcqSemantic = exposure.mcq.map(semanticIdentity);
  const codingLiteral = [literalIdentity(exposure.coding)];
  const codingSemantic = [semanticIdentity(exposure.coding)];
  await closeSessionForNextAttempt(created.session._id, attempt, now);
  return {
    mcqLiteral,
    mcqSemantic,
    codingLiteral,
    codingSemantic,
    allLiteral: [...mcqLiteral, ...codingLiteral],
    allSemantic: [...mcqSemantic, ...codingSemantic],
  };
}

beforeAll(async () => {
  process.env.INTERVIEW_MODE_ACCESS = 'internal';
  process.env.INTERVIEW_SYSTEM_DESIGN_ACCESS = 'off';
  process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
  process.env.INTERVIEW_OPERATIONAL_STATE = 'normal';
  process.env.MONGO_TARGET = 'test';
  process.env.EXPECTED_MONGO_DB_NAME_TEST = 'interview_repeat_policy';

  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  process.env.MONGO_URL_TEST = mongoServer.getUri('interview_repeat_policy');

  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  InterviewSession = require('../models/InterviewSession');
  InterviewContentExposure = require('../models/InterviewContentExposure');
  ({ createSession } = require('../services/interview/session-service'));
  ({ loadSelectionContext } = require('../services/interview/exposure'));

  await connectToMongo(process.env.MONGO_URL_TEST);
  await Promise.all([
    InterviewSession.syncIndexes(),
    InterviewContentExposure.syncIndexes(),
  ]);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
  restoreEnvironment();
});

describe('Interview content repeat policy with persisted exposure history', () => {
  test('runs 12 track/level cells for ten attempts without first-five or adjacent overlap', async () => {
    const report = [];
    for (const track of TRACKS) {
      for (const level of LEVELS) {
        const user = await createPremiumUser(`${track.replace('-', '_')}_${level}`);
        const attempts = [];
        for (let attempt = 1; attempt <= ATTEMPTS_PER_CELL; attempt += 1) {
          attempts.push(await runAttempt({ user, track, level, attempt }));
        }
        const summary = summarizeAttempts(track, level, attempts);
        report.push(summary);

        for (const repeatField of [
          'mcqLiteralFirstRepeat',
          'mcqSemanticFirstRepeat',
          'codingLiteralFirstRepeat',
          'codingSemanticFirstRepeat',
        ]) {
          expect(summary[repeatField] === null || summary[repeatField] >= 6).toBe(true);
        }
        expect(summary.maxAdjacentLiteralOverlap).toBe(0);
        expect(summary.maxAdjacentSemanticOverlap).toBe(0);
        expect(summary.uniqueMcq).toBeGreaterThanOrEqual(25);
        expect(summary.uniqueMcqConcepts).toBeGreaterThanOrEqual(25);
        expect(summary.uniqueCoding).toBeGreaterThanOrEqual(5);
        expect(summary.uniqueCodingConcepts).toBeGreaterThanOrEqual(5);

        expect(await InterviewContentExposure.countDocuments({
          userId: user._id,
          format: 'coding',
          track,
          level,
        })).toBe(ATTEMPTS_PER_CELL);
      }
    }

    if (process.env.INTERVIEW_REPEAT_REPORT === '1') {
      console.table(report);
    }
    expect(report).toHaveLength(TRACKS.length * LEVELS.length);
  });

  test('blocks adjacent semantic coding overlap when the same user switches tracks', async () => {
    const user = await createPremiumUser('cross_track');
    const trackSequence = ['react', 'angular', 'vue', 'react', 'angular', 'vue'];
    let previousCodingConcept = null;
    const seenIdsByConcept = new Map();

    for (let index = 0; index < trackSequence.length; index += 1) {
      const track = trackSequence[index];
      const attempt = index + 1;
      const sample = await runAttempt({
        user,
        track,
        level: 'mid',
        attempt,
        clockOffset: 100 + index,
      });
      const conceptId = sample.codingSemantic[0];
      const variantId = sample.codingLiteral[0];
      expect(conceptId).not.toBe(previousCodingConcept);
      previousCodingConcept = conceptId;
      const ids = seenIdsByConcept.get(conceptId) || new Set();
      ids.add(variantId);
      seenIdsByConcept.set(conceptId, ids);
    }

    // Cross-framework semantic families may intentionally use different
    // variant IDs. The policy invariant is zero overlap with the immediately
    // preceding coding task, which the assertions above enforce.
    expect(seenIdsByConcept.size).toBeGreaterThan(1);
  });

  test('keeps terminal outcomes in history and documents the absence of an expired status', async () => {
    const user = await createPremiumUser('terminal_history');
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await runAttempt({
        user,
        track: 'core-web',
        level: 'junior',
        attempt,
        clockOffset: 200 + attempt,
      });
    }
    const context = await loadSelectionContext(user._id, {
      format: 'coding',
      track: 'core-web',
      level: 'junior',
    });
    expect(context.targetExposureCount).toBe(3);
    expect(context.mcq.excludedIds.size).toBe(15);
    expect(context.coding.excludedConceptIds.size).toBe(3);
    expect(InterviewSession.schema.path('status').enumValues).not.toContain('expired');
  });

  test('forgets only identity history after the 365-day exposure TTL elapses', async () => {
    const user = await createPremiumUser('ttl_forgetting');
    const fixedSeed = 'repeat-policy:ttl-forgetting:fixed';
    const first = await runAttempt({
      user,
      track: 'react',
      level: 'mid',
      attempt: 1,
      clockOffset: 300,
      seedOverride: fixedSeed,
    });

    // Mongo's TTL monitor is asynchronous. Deleting the expired identity-only
    // ledger row directly models its eventual effect without sleeping for the
    // monitor cycle; the 90-day response-bearing session remains separate.
    await InterviewContentExposure.deleteMany({ userId: user._id });
    const resetContext = await loadSelectionContext(user._id, {
      format: 'coding',
      track: 'react',
      level: 'mid',
    });
    expect(resetContext.targetExposureCount).toBe(0);

    const second = await runAttempt({
      user,
      track: 'react',
      level: 'mid',
      attempt: 2,
      clockOffset: 300,
      seedOverride: fixedSeed,
    });
    expect(second.mcqLiteral).toEqual(first.mcqLiteral);
    expect(second.mcqSemantic).toEqual(first.mcqSemantic);
    expect(second.codingLiteral).toEqual(first.codingLiteral);
    expect(second.codingSemantic).toEqual(first.codingSemantic);
  });
});
