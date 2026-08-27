'use strict';

const mongoose = require('mongoose');

const InterviewSession = require('../../models/InterviewSession');
const InterviewMonthlyQuota = require('../../models/InterviewMonthlyQuota');
const InterviewConsumedRunToken = require('../../models/InterviewConsumedRunToken');
const InterviewContentExposure = require('../../models/InterviewContentExposure');
const InterviewAbandonWindow = require('../../models/InterviewAbandonWindow');

function defaultCollections() {
  const collections = {
    sessions: InterviewSession,
    monthlyQuotas: InterviewMonthlyQuota,
    consumedRunTokens: InterviewConsumedRunToken,
    contentExposures: InterviewContentExposure,
    abandonWindows: InterviewAbandonWindow,
  };
  return collections;
}

function normalizeUserId(userId) {
  const value = String(userId || '').trim();
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error('A valid user id is required to purge Interview data');
    error.code = 'INTERVIEW_PURGE_INVALID_USER_ID';
    throw error;
  }
  return new mongoose.Types.ObjectId(value);
}

function operationOptions(mongoSession) {
  return mongoSession ? { session: mongoSession } : undefined;
}

async function countInterviewUserData(userId, {
  collections = defaultCollections(),
  mongoSession = null,
} = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const counts = {};
  for (const [name, model] of Object.entries(collections)) {
    counts[name] = await model.countDocuments(
      { userId: normalizedUserId },
      operationOptions(mongoSession)
    );
  }
  return counts;
}

async function purgeInterviewUserData(userId, {
  dryRun = true,
  collections = defaultCollections(),
  mongoSession = null,
} = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const before = await countInterviewUserData(normalizedUserId, {
    collections,
    mongoSession,
  });

  if (dryRun) {
    return {
      dryRun: true,
      before,
      deleted: Object.fromEntries(Object.keys(before).map((name) => [name, 0])),
      remaining: { ...before },
    };
  }

  const deleted = {};
  for (const [name, model] of Object.entries(collections)) {
    const result = await model.deleteMany(
      { userId: normalizedUserId },
      operationOptions(mongoSession)
    );
    deleted[name] = Number(result?.deletedCount || 0);
  }

  const remaining = await countInterviewUserData(normalizedUserId, {
    collections,
    mongoSession,
  });
  return { dryRun: false, before, deleted, remaining };
}

module.exports = {
  countInterviewUserData,
  defaultCollections,
  normalizeUserId,
  purgeInterviewUserData,
};
