'use strict';

const mongoose = require('mongoose');

const InterviewAbandonWindow = require('../../models/InterviewAbandonWindow');

const ABANDON_WINDOW_MS = 24 * 60 * 60 * 1000;

function objectId(value) {
  return value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(String(value));
}

async function ensureWindow(userId, cutoff, expiresAt) {
  try {
    await InterviewAbandonWindow.updateOne(
      { userId },
      {
        $pull: { events: { abandonedAt: { $lt: cutoff } } },
        $set: { expiresAt },
        $setOnInsert: { userId },
      },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    await InterviewAbandonWindow.updateOne(
      { userId },
      {
        $pull: { events: { abandonedAt: { $lt: cutoff } } },
        $set: { expiresAt },
      }
    );
  }
}

async function claimAbandonSlot(userIdRaw, sessionIdRaw, {
  limit,
  now = new Date(),
} = {}) {
  const userId = objectId(userIdRaw);
  const sessionId = objectId(sessionIdRaw);
  const max = Math.max(1, Number(limit) || 3);
  const abandonedAt = new Date(now);
  const cutoff = new Date(abandonedAt.getTime() - ABANDON_WINDOW_MS);
  const expiresAt = new Date(abandonedAt.getTime() + ABANDON_WINDOW_MS);

  await ensureWindow(userId, cutoff, expiresAt);
  const claimed = await InterviewAbandonWindow.findOneAndUpdate(
    {
      userId,
      'events.sessionId': { $ne: sessionId },
      $expr: {
        $lt: [
          { $size: { $ifNull: ['$events', []] } },
          max,
        ],
      },
    },
    {
      $push: { events: { sessionId, abandonedAt } },
      $set: { expiresAt },
    },
    { new: true }
  ).lean();
  if (claimed) {
    return { accepted: true, replayed: false, retryAfter: null };
  }

  const current = await InterviewAbandonWindow.findOne({ userId }).lean();
  if (current?.events?.some((entry) => String(entry.sessionId) === String(sessionId))) {
    return { accepted: true, replayed: true, retryAfter: null };
  }
  const oldest = (current?.events || [])
    .map((entry) => new Date(entry.abandonedAt).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];
  return {
    accepted: false,
    replayed: false,
    retryAfter: Number.isFinite(oldest)
      ? new Date(oldest + ABANDON_WINDOW_MS)
      : expiresAt,
  };
}

async function releaseAbandonSlot(userIdRaw, sessionIdRaw) {
  const userId = objectId(userIdRaw);
  const sessionId = objectId(sessionIdRaw);
  await InterviewAbandonWindow.updateOne(
    { userId },
    { $pull: { events: { sessionId } } }
  );
}

module.exports = {
  ABANDON_WINDOW_MS,
  claimAbandonSlot,
  releaseAbandonSlot,
};
