const crypto = require('crypto');

const DEFAULT_LEASE_MS = 120 * 1000;
const TERMINAL_STATUSES = new Set([
  'pending_user',
  'processed',
  'processed_unknown_type',
  'processed_no_entitlement',
  'processed_stale',
  'processed_simulated',
]);
const RETRYABLE_STATUSES = [
  'failed_retryable',
  // Rolling-deploy compatibility for pre-lease event documents.
  'received',
  'received_unknown_type',
  'received_simulated',
];

function isDuplicateKeyError(err) {
  return !!err && (err.code === 11000 || err.code === 11001);
}

function truncate(value, maxLength) {
  const normalized = String(value || '');
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

function buildEventOrderKey(event) {
  if (!event?.receivedAt || !event?._id) return '';
  const receivedAt = new Date(event.receivedAt);
  if (Number.isNaN(receivedAt.getTime())) return '';
  return `${receivedAt.toISOString()}:${String(event._id)}`;
}

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.has(String(status || ''));
}

function createBillingEventStore(model, { leaseMs = DEFAULT_LEASE_MS, now = () => new Date() } = {}) {
  async function acquireEvent({ provider, eventId, eventType, email, payload }) {
    const acquiredAt = now();
    const leaseToken = crypto.randomBytes(24).toString('hex');
    const leaseExpiresAt = new Date(acquiredAt.getTime() + leaseMs);

    try {
      const event = await model.create({
        provider,
        eventId,
        eventType,
        email,
        payload,
        processingStatus: 'processing',
        attemptCount: 1,
        leaseToken,
        leaseExpiresAt,
        lastAttemptAt: acquiredAt,
        receivedAt: acquiredAt,
      });
      return {
        acquired: true,
        duplicate: false,
        leaseToken,
        event,
        eventOrderKey: buildEventOrderKey(event),
      };
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }

    const event = await model.findOneAndUpdate(
      {
        provider,
        eventId,
        $or: [
          { processingStatus: { $in: RETRYABLE_STATUSES } },
          { processingStatus: 'processing', leaseExpiresAt: { $lte: acquiredAt } },
          { processingStatus: 'processing', leaseExpiresAt: { $exists: false } },
          { processingStatus: 'processing', leaseExpiresAt: null },
        ],
      },
      {
        $set: {
          processingStatus: 'processing',
          leaseToken,
          leaseExpiresAt,
          lastAttemptAt: acquiredAt,
        },
        $inc: { attemptCount: 1 },
        $unset: {
          processedAt: '',
          lastErrorCode: '',
          lastErrorMessage: '',
          lastErrorAt: '',
        },
      },
      { new: true }
    );

    if (event) {
      return {
        acquired: true,
        duplicate: true,
        leaseToken,
        event,
        eventOrderKey: buildEventOrderKey(event),
      };
    }

    const existing = await model.findOne({ provider, eventId });
    if (existing && isTerminalStatus(existing.processingStatus)) {
      return { acquired: false, duplicate: true, terminal: true, event: existing };
    }
    return {
      acquired: false,
      duplicate: true,
      busy: true,
      retryAfterSeconds: 5,
      event: existing || undefined,
    };
  }

  async function completeEvent({ provider, eventId, leaseToken, processingStatus, userId }) {
    if (!isTerminalStatus(processingStatus)) {
      throw new TypeError(`Invalid terminal billing event status: ${processingStatus}`);
    }
    const result = await model.updateOne(
      { provider, eventId, processingStatus: 'processing', leaseToken },
      {
        $set: {
          processingStatus,
          processedAt: now(),
          ...(userId ? { userId } : {}),
        },
        $unset: {
          leaseToken: '',
          leaseExpiresAt: '',
          lastErrorCode: '',
          lastErrorMessage: '',
          lastErrorAt: '',
        },
      }
    );
    return { completed: (result.modifiedCount || result.nModified || 0) === 1 };
  }

  async function failEvent({ provider, eventId, leaseToken, error }) {
    const result = await model.updateOne(
      { provider, eventId, processingStatus: 'processing', leaseToken },
      {
        $set: {
          processingStatus: 'failed_retryable',
          lastErrorCode: truncate(error?.code || error?.name || 'WEBHOOK_PROCESSING_FAILED', 128),
          lastErrorMessage: truncate(error?.message || error || 'Webhook processing failed', 1000),
          lastErrorAt: now(),
        },
        $unset: { leaseToken: '', leaseExpiresAt: '', processedAt: '' },
      }
    );
    return { failed: (result.modifiedCount || result.nModified || 0) === 1 };
  }

  return { acquireEvent, completeEvent, failEvent };
}

module.exports = {
  DEFAULT_LEASE_MS,
  TERMINAL_STATUSES,
  buildEventOrderKey,
  createBillingEventStore,
  isDuplicateKeyError,
  isTerminalStatus,
};
