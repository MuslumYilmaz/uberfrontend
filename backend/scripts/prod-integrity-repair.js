#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_DB_NAME = 'frontendatlas';
const REPAIR_ACTOR = 'prod-integrity-repair';
const SOLVED_KINDS = new Set(['coding', 'trivia', 'debug']);

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    apply: false,
    pendingMinAgeHours: 24,
  };

  for (const arg of argv) {
    if (arg === '--apply') {
      options.apply = true;
      continue;
    }
    if (arg.startsWith('--pending-min-age-hours=')) {
      const raw = arg.slice('--pending-min-age-hours='.length);
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error('--pending-min-age-hours must be a non-negative number');
      }
      options.pendingMinAgeHours = value;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseDbName(uri) {
  try {
    const parsed = new URL(uri);
    const raw = (parsed.pathname || '').replace(/^\//, '');
    return raw ? decodeURIComponent(raw.split('/')[0]) : '';
  } catch {
    const withoutQuery = String(uri || '').split('?')[0];
    const slash = withoutQuery.lastIndexOf('/');
    return slash >= 0 ? withoutQuery.slice(slash + 1) : '';
  }
}

function requireProductionMongoConfig(env = process.env) {
  if (env.MONGO_TARGET !== 'production') {
    throw new Error(`Refusing to run without MONGO_TARGET=production; received ${env.MONGO_TARGET || '<unset>'}`);
  }

  const uri = env.MONGO_URL || env.MONGODB_URI || env.DATABASE_URL;
  if (!uri) throw new Error('Missing MongoDB URI');

  const expectedDbName = env.EXPECTED_MONGO_DB_NAME || DEFAULT_DB_NAME;
  const dbName = parseDbName(uri);
  if (dbName !== expectedDbName) {
    throw new Error(`Refusing to run against DB ${dbName || '<missing>'}; expected ${expectedDbName}`);
  }

  return { uri, dbName };
}

function userRef(id) {
  const value = String(id || '');
  const digest = crypto.createHash('sha256').update(value).digest('hex').slice(0, 10);
  return `${digest}:${value.slice(-6)}`;
}

function asNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function asDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : fallback;
}

function dayUTC(date) {
  return asDate(date).toISOString().slice(0, 10);
}

function sameId(left, right) {
  return String(left || '') === String(right || '');
}

function objectIdFrom(value) {
  const text = String(value || '').trim();
  if (!ObjectId.isValid(text)) return null;
  return new ObjectId(text);
}

function extractUserIdFromPayload(payload) {
  const custom =
    payload?.meta?.custom_data ||
    payload?.meta?.customData ||
    payload?.data?.attributes?.custom_data ||
    payload?.data?.attributes?.customData ||
    payload?.data?.attributes?.custom ||
    payload?.custom_data ||
    payload?.customData ||
    payload?.custom;
  if (!custom || typeof custom !== 'object') return '';
  return String(
    custom.fa_user_id ||
    custom.faUserId ||
    custom.user_id ||
    custom.userId ||
    ''
  ).trim();
}

function resolvePendingBindingUserId(item) {
  return String(item?.userId || extractUserIdFromPayload(item?.payload) || '').trim();
}

function eventSort(left, right) {
  const leftTime = asDate(left?.completedAt || left?.createdAt, new Date(0)).getTime();
  const rightTime = asDate(right?.completedAt || right?.createdAt, new Date(0)).getTime();
  if (leftTime !== rightTime) return leftTime - rightTime;
  return String(left?._id || '').localeCompare(String(right?._id || ''));
}

function buildCompletionDoc({ credit, event, now = new Date() }) {
  const completedAt = asDate(event.completedAt || credit.firstCompletedAt || event.createdAt, now);
  return {
    userId: credit.userId,
    kind: String(credit.kind || event.kind),
    itemId: String(credit.itemId || event.itemId),
    tech: String(event.tech || credit.tech || ''),
    source: String(event.source || 'tech'),
    durationMin: asNumber(event.durationMin),
    difficultySnapshot: 'intermediate',
    xpAwarded: asNumber(event.xp),
    completedAt,
    dayUTC: event.dayUTC || dayUTC(completedAt),
    active: true,
    createdFromLegacyCredit: true,
    lastAttemptAt: completedAt,
    createdAt: now,
    updatedAt: now,
  };
}

function summarizeCompletions(completions, bonuses = []) {
  const orderedCompletions = [...completions].sort(eventSort);
  const perTech = {};
  const solvedQuestionIds = [];
  const solvedSet = new Set();
  let completionXp = 0;

  for (const completion of orderedCompletions) {
    completionXp += asNumber(completion.xpAwarded);
    const tech = String(completion.tech || '');
    if (tech) {
      if (!perTech[tech]) perTech[tech] = { completed: 0, xp: 0 };
      perTech[tech].completed += 1;
      perTech[tech].xp += asNumber(completion.xpAwarded);
    }
    if (SOLVED_KINDS.has(String(completion.kind)) && completion.itemId && !solvedSet.has(String(completion.itemId))) {
      solvedSet.add(String(completion.itemId));
      solvedQuestionIds.push(String(completion.itemId));
    }
  }

  const bonusXp = bonuses.reduce((sum, bonus) => sum + asNumber(bonus.xp), 0);
  return {
    xpTotal: completionXp + bonusXp,
    completedTotal: orderedCompletions.length,
    perTech,
    solvedQuestionIds,
  };
}

async function buildLegacyGamificationRepairPlan(db, { now = new Date() } = {}) {
  const firstCredits = await db.collection('firstcompletioncredits')
    .find({})
    .sort({ firstCompletedAt: 1, createdAt: 1, _id: 1 })
    .toArray();

  const plannedCompletions = [];
  const manualReview = [];
  const affectedUserIds = new Map();
  const seenKeys = new Set();

  for (const credit of firstCredits) {
    const key = `${credit.userId}:${credit.kind}:${credit.itemId}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const existing = await db.collection('activitycompletions').findOne({
      userId: credit.userId,
      kind: credit.kind,
      itemId: credit.itemId,
    });
    if (existing) continue;

    const user = await db.collection('users').findOne(
      { _id: credit.userId },
      { projection: { _id: 1 } }
    );
    if (!user) {
      manualReview.push({
        reason: 'missing_user',
        userRef: userRef(credit.userId),
        kind: credit.kind,
        itemId: credit.itemId,
      });
      continue;
    }

    const events = await db.collection('activityevents')
      .find({ userId: credit.userId, kind: credit.kind, itemId: credit.itemId })
      .sort({ completedAt: 1, createdAt: 1, _id: 1 })
      .toArray();
    if (!events.length) {
      manualReview.push({
        reason: 'missing_matching_activity_event',
        userRef: userRef(credit.userId),
        kind: credit.kind,
        itemId: credit.itemId,
      });
      continue;
    }

    const event = events[0];
    if (!event.tech) {
      manualReview.push({
        reason: 'matching_activity_event_missing_tech',
        userRef: userRef(credit.userId),
        kind: credit.kind,
        itemId: credit.itemId,
      });
      continue;
    }

    const completion = buildCompletionDoc({ credit, event, now });
    plannedCompletions.push({
      filter: { userId: credit.userId, kind: credit.kind, itemId: credit.itemId },
      doc: completion,
      duplicateEventCount: Math.max(0, events.length - 1),
    });
    affectedUserIds.set(String(credit.userId), credit.userId);
  }

  const userAggregateUpdates = [];
  for (const userId of affectedUserIds.values()) {
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { _id: 1, stats: 1, solvedQuestionIds: 1 } }
    );
    if (!user) continue;

    const existingActive = await db.collection('activitycompletions')
      .find({ userId, active: true })
      .toArray();
    const plannedForUser = plannedCompletions
      .filter((entry) => sameId(entry.doc.userId, userId))
      .map((entry) => entry.doc);
    const bonuses = await db.collection('weeklygoalbonuscredits')
      .find({ userId })
      .toArray();
    const expected = summarizeCompletions([...existingActive, ...plannedForUser], bonuses);

    userAggregateUpdates.push({
      userId,
      userRef: userRef(userId),
      current: {
        xpTotal: asNumber(user.stats?.xpTotal),
        completedTotal: asNumber(user.stats?.completedTotal),
        perTech: user.stats?.perTech || {},
        solvedQuestionIds: Array.isArray(user.solvedQuestionIds) ? user.solvedQuestionIds.map(String) : [],
      },
      expected,
    });
  }

  return {
    plannedCompletions,
    userAggregateUpdates,
    manualReview,
  };
}

async function buildPendingEntitlementIgnorePlan(db, { now = new Date(), minAgeHours = 24 } = {}) {
  const pending = await db.collection('pendingentitlements')
    .find({ provider: 'lemonsqueezy', appliedAt: null, ignoredAt: null })
    .sort({ receivedAt: 1, createdAt: 1, _id: 1 })
    .toArray();

  const staleCutoffMs = now.getTime() - minAgeHours * 60 * 60 * 1000;
  const ignored = [];
  const manualReview = [];

  for (const item of pending) {
    const receivedAt = asDate(item.receivedAt || item.createdAt, now);
    if (receivedAt.getTime() > staleCutoffMs) continue;

    const email = String(item.email || '').trim().toLowerCase();
    const emailUser = email
      ? await db.collection('users').findOne({ email }, { projection: { _id: 1 } })
      : null;
    const bindingUserId = resolvePendingBindingUserId(item);
    const boundObjectId = objectIdFrom(bindingUserId);
    const boundUser = boundObjectId
      ? await db.collection('users').findOne({ _id: boundObjectId }, { projection: { _id: 1 } })
      : null;

    let reason = '';
    if (!bindingUserId) {
      reason = 'lemonsqueezy_user_binding_missing';
    } else if (!boundObjectId || !boundUser) {
      reason = 'lemonsqueezy_user_binding_missing_user';
    } else if (emailUser && !sameId(emailUser._id, boundUser._id)) {
      reason = 'lemonsqueezy_user_binding_mismatch';
    } else if (!emailUser) {
      manualReview.push({
        reason: 'stale_pending_without_email_user_but_valid_binding',
        eventId: item.eventId,
        boundUserRef: userRef(boundUser._id),
      });
      continue;
    } else {
      continue;
    }

    ignored.push({
      _id: item._id,
      eventId: item.eventId,
      eventType: item.eventType,
      reason,
      emailUserRef: emailUser ? userRef(emailUser._id) : null,
      bindingUserRef: bindingUserId ? userRef(bindingUserId) : null,
      ageHours: Math.round(((now.getTime() - receivedAt.getTime()) / 36e5) * 10) / 10,
    });
  }

  return { ignored, manualReview };
}

async function buildRepairPlan(db, options = {}) {
  const now = options.now || new Date();
  const [legacy, pending] = await Promise.all([
    buildLegacyGamificationRepairPlan(db, { now }),
    buildPendingEntitlementIgnorePlan(db, {
      now,
      minAgeHours: options.pendingMinAgeHours ?? 24,
    }),
  ]);
  return { legacy, pending };
}

async function applyRepairPlan(db, plan, { now = new Date(), actor = REPAIR_ACTOR } = {}) {
  const completionResults = [];
  for (const entry of plan.legacy.plannedCompletions) {
    const result = await db.collection('activitycompletions').updateOne(
      entry.filter,
      { $setOnInsert: entry.doc },
      { upsert: true }
    );
    completionResults.push({
      userRef: userRef(entry.doc.userId),
      kind: entry.doc.kind,
      itemId: entry.doc.itemId,
      inserted: Boolean(result.upsertedCount),
    });
  }

  const aggregateResults = [];
  for (const entry of plan.legacy.userAggregateUpdates) {
    const result = await db.collection('users').updateOne(
      { _id: entry.userId },
      {
        $set: {
          'stats.xpTotal': entry.expected.xpTotal,
          'stats.completedTotal': entry.expected.completedTotal,
          'stats.perTech': entry.expected.perTech,
          solvedQuestionIds: entry.expected.solvedQuestionIds,
          updatedAt: now,
        },
      }
    );
    aggregateResults.push({
      userRef: entry.userRef,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  }

  const pendingResults = [];
  for (const entry of plan.pending.ignored) {
    const result = await db.collection('pendingentitlements').updateOne(
      { _id: entry._id, appliedAt: null, ignoredAt: null },
      {
        $set: {
          ignoredAt: now,
          ignoredReason: entry.reason,
          ignoredBy: actor,
          updatedAt: now,
        },
      }
    );
    pendingResults.push({
      eventId: entry.eventId,
      reason: entry.reason,
      modified: result.modifiedCount,
    });
  }

  return {
    completions: completionResults,
    aggregates: aggregateResults,
    pendingEntitlements: pendingResults,
  };
}

function summarizePlan(plan) {
  return {
    legacy: {
      plannedCompletionBackfills: plan.legacy.plannedCompletions.length,
      affectedUsers: plan.legacy.userAggregateUpdates.length,
      manualReview: plan.legacy.manualReview,
      examples: plan.legacy.userAggregateUpdates.slice(0, 10).map((entry) => ({
        userRef: entry.userRef,
        current: {
          xpTotal: entry.current.xpTotal,
          completedTotal: entry.current.completedTotal,
          solvedCount: entry.current.solvedQuestionIds.length,
        },
        expected: {
          xpTotal: entry.expected.xpTotal,
          completedTotal: entry.expected.completedTotal,
          solvedCount: entry.expected.solvedQuestionIds.length,
          perTech: entry.expected.perTech,
        },
      })),
    },
    pendingEntitlements: {
      plannedIgnores: plan.pending.ignored.length,
      manualReview: plan.pending.manualReview,
      examples: plan.pending.ignored.slice(0, 10).map((entry) => ({
        eventType: entry.eventType || null,
        reason: entry.reason,
        ageHours: entry.ageHours,
        emailUserRef: entry.emailUserRef,
        bindingUserRef: entry.bindingUserRef,
      })),
    },
  };
}

async function main() {
  const options = parseArgs();
  const { uri, dbName } = requireProductionMongoConfig();
  const client = new MongoClient(uri, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 8000,
    readPreference: 'primaryPreferred',
  });
  await client.connect();
  try {
    const db = client.db(dbName);
    const now = new Date();
    const plan = await buildRepairPlan(db, {
      now,
      pendingMinAgeHours: options.pendingMinAgeHours,
    });
    const output = {
      mode: options.apply ? 'apply' : 'dry-run',
      dbName,
      readOnly: !options.apply,
      generatedAt: now.toISOString(),
      plan: summarizePlan(plan),
    };
    if (options.apply) {
      output.applyResult = await applyRepairPlan(db, plan, { now });
    }
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  REPAIR_ACTOR,
  parseArgs,
  parseDbName,
  requireProductionMongoConfig,
  extractUserIdFromPayload,
  resolvePendingBindingUserId,
  buildCompletionDoc,
  summarizeCompletions,
  buildLegacyGamificationRepairPlan,
  buildPendingEntitlementIgnorePlan,
  buildRepairPlan,
  applyRepairPlan,
  summarizePlan,
};
