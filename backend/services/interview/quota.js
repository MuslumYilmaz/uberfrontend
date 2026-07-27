'use strict';

const InterviewMonthlyQuota = require('../../models/InterviewMonthlyQuota');
const { APP_TIMEZONE } = require('../gamification/constants');

const QUOTA_AUDIT_RETENTION_DAYS = 90;

function monthKeyInTimezone(date = new Date(), timeZone = APP_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  });
  const values = Object.create(null);
  for (const part of formatter.formatToParts(date)) values[part.type] = part.value;
  return `${values.year}-${values.month}`;
}

function nextMonthResetAt(monthKey) {
  const match = String(monthKey || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  let year = Number(match[1]);
  let month = Number(match[2]) + 1;
  if (month === 13) {
    year += 1;
    month = 1;
  }
  return new Date(
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01T00:00:00+03:00`
  );
}

function quotaExpiresAt(monthKey) {
  const resetAt = nextMonthResetAt(monthKey);
  if (!resetAt) return null;
  return new Date(
    resetAt.getTime() + (QUOTA_AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  );
}

function quotaPublicState({ monthKey, used, limit }) {
  return {
    monthKey,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: nextMonthResetAt(monthKey)?.toISOString() || null,
    timeZone: APP_TIMEZONE,
  };
}

async function readQuota(userId, { now = new Date(), limit }) {
  const monthKey = monthKeyInTimezone(now);
  const record = await InterviewMonthlyQuota.findOne({ userId, monthKey }).lean();
  const used = Array.isArray(record?.requestIds) ? record.requestIds.length : 0;
  return quotaPublicState({ monthKey, used, limit });
}

async function reserveQuota(userId, requestId, {
  now = new Date(),
  limit,
  session = null,
}) {
  const monthKey = monthKeyInTimezone(now);
  const selector = { userId, monthKey };
  const expiresAt = quotaExpiresAt(monthKey);
  const existingQuery = InterviewMonthlyQuota.findOne(selector);
  if (session) existingQuery.session(session);
  const existing = await existingQuery.lean();
  if (existing?.requestIds?.includes(requestId)) {
    return {
      granted: true,
      alreadyReserved: true,
      ...quotaPublicState({ monthKey, used: existing.requestIds.length, limit }),
    };
  }

  const lastAllowedIndex = Math.max(0, limit - 1);
  const firstUpdate = InterviewMonthlyQuota.findOneAndUpdate(
    {
      ...selector,
      requestIds: { $ne: requestId },
      [`requestIds.${lastAllowedIndex}`]: { $exists: false },
    },
    {
      $addToSet: { requestIds: requestId },
      $set: { expiresAt },
    },
    { new: true, session: session || undefined }
  );
  let updated = await firstUpdate.lean();

  if (!updated && !existing) {
    try {
      const created = new InterviewMonthlyQuota({
        userId,
        monthKey,
        requestIds: [requestId],
        expiresAt,
      });
      await created.save(session ? { session } : undefined);
      updated = created.toObject();
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }

  if (!updated) {
    const racedQuery = InterviewMonthlyQuota.findOne(selector);
    if (session) racedQuery.session(session);
    const raced = await racedQuery.lean();
    if (raced?.requestIds?.includes(requestId)) {
      return {
        granted: true,
        alreadyReserved: true,
        ...quotaPublicState({ monthKey, used: raced.requestIds.length, limit }),
      };
    }
    if (raced) {
      updated = await InterviewMonthlyQuota.findOneAndUpdate(
        {
          ...selector,
          requestIds: { $ne: requestId },
          [`requestIds.${lastAllowedIndex}`]: { $exists: false },
        },
        {
          $addToSet: { requestIds: requestId },
          $set: { expiresAt },
        },
        { new: true, session: session || undefined }
      ).lean();
    }
  }

  let current = updated;
  if (!current) {
    const currentQuery = InterviewMonthlyQuota.findOne(selector);
    if (session) currentQuery.session(session);
    current = await currentQuery.lean();
  }
  const requestIds = Array.isArray(current?.requestIds) ? current.requestIds : [];
  const granted = requestIds.includes(requestId);
  return {
    granted,
    alreadyReserved: false,
    ...quotaPublicState({ monthKey, used: requestIds.length, limit }),
  };
}

async function releaseQuota(userId, monthKey, requestId, { session = null } = {}) {
  if (!userId || !monthKey || !requestId) return;
  await InterviewMonthlyQuota.updateOne(
    { userId, monthKey },
    { $pull: { requestIds: requestId } },
    session ? { session } : undefined
  );
}

module.exports = {
  monthKeyInTimezone,
  nextMonthResetAt,
  quotaExpiresAt,
  readQuota,
  releaseQuota,
  reserveQuota,
};
