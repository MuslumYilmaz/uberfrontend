const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const WEBHOOK_SECRET = 'test_ls_lifecycle_secret';
const JWT_SECRET = 'test_ls_lifecycle_jwt_secret';

jest.setTimeout(120000);

let app;
let User;
let BillingEvent;
let PendingEntitlement;
let connectToMongo;
let disconnectMongo;
let mongoServer;
let dateNowSpy;

function setNow(value) {
  if (dateNowSpy) {
    dateNowSpy.mockRestore();
  }
  dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date(value).getTime());
}

function restoreNow() {
  if (dateNowSpy) {
    dateNowSpy.mockRestore();
    dateNowSpy = null;
  }
}

function signWebhookPayload(rawBody) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
}

function signAuthToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role || 'user' },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

async function createUser(overrides = {}) {
  return User.create({
    email: 'lifecycle@example.com',
    username: 'lifecycle_user',
    passwordHash: 'hash',
    accessTier: 'free',
    entitlements: {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    },
    ...overrides,
  });
}

async function postWebhook(payload) {
  const rawBody = JSON.stringify(payload);
  return request(app)
    .post('/api/billing/webhooks/lemonsqueezy')
    .set('Content-Type', 'application/json')
    .set('x-signature', signWebhookPayload(rawBody))
    .send(rawBody);
}

async function getMe(user) {
  return request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${signAuthToken(user)}`);
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = mongoServer.getUri();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = WEBHOOK_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = '';

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  BillingEvent = require('../models/BillingEvent');
  PendingEntitlement = require('../models/PendingEntitlement');

  await connectToMongo(process.env.MONGO_URL_TEST);
  await BillingEvent.init();
  await PendingEntitlement.init();
});

afterAll(async () => {
  restoreNow();
  if (disconnectMongo) {
    await disconnectMongo();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  restoreNow();
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST = WEBHOOK_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE = '';
  await User.deleteMany({});
  await BillingEvent.deleteMany({});
  await PendingEntitlement.deleteMany({});
});

afterEach(() => {
  restoreNow();
});

describe('LemonSqueezy billing lifecycle', () => {
  test('cancelled subscription stays premium until validUntil, then becomes free on /api/auth/me', async () => {
    const startedAt = '2026-03-01T00:00:00.000Z';
    const validUntil = '2026-04-01T00:00:00.000Z';
    const user = await createUser();

    setNow(startedAt);

    const createdRes = await postWebhook({
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_lifecycle_monthly',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: validUntil,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(createdRes.status).toBe(200);

    const duringActive = await getMe(user);
    expect(duringActive.status).toBe(200);
    expect(duringActive.body.entitlements.pro.status).toBe('active');
    expect(duringActive.body.accessTierEffective).toBe('premium');
    expect(duringActive.body.effectiveProActive).toBe(true);

    const cancelledRes = await postWebhook({
      meta: {
        event_name: 'subscription_cancelled',
        test_mode: true,
      },
      data: {
        id: 'sub_lifecycle_monthly',
        attributes: {
          user_email: user.email,
          status: 'cancelled',
          ends_at: validUntil,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(cancelledRes.status).toBe(200);

    const beforeExpiry = await getMe(user);
    expect(beforeExpiry.status).toBe(200);
    expect(beforeExpiry.body.entitlements.pro.status).toBe('cancelled');
    expect(new Date(beforeExpiry.body.entitlements.pro.validUntil).toISOString()).toBe(validUntil);
    expect(beforeExpiry.body.accessTierEffective).toBe('premium');
    expect(beforeExpiry.body.effectiveProActive).toBe(true);

    setNow('2026-04-01T00:00:01.000Z');

    const afterExpiry = await getMe(user);
    expect(afterExpiry.status).toBe(200);
    expect(afterExpiry.body.entitlements.pro.status).toBe('cancelled');
    expect(new Date(afterExpiry.body.entitlements.pro.validUntil).toISOString()).toBe(validUntil);
    expect(afterExpiry.body.accessTierEffective).toBe('free');
    expect(afterExpiry.body.effectiveProActive).toBe(false);
  });

  test('refund revokes premium immediately even when original period end was in the future', async () => {
    const startedAt = '2026-05-01T00:00:00.000Z';
    const validUntil = '2026-06-01T00:00:00.000Z';
    const user = await createUser({
      email: 'refund@example.com',
      username: 'refund_user',
    });

    setNow(startedAt);

    const createdRes = await postWebhook({
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_refund_flow',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: validUntil,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(createdRes.status).toBe(200);

    const refundedRes = await postWebhook({
      meta: {
        event_name: 'order_refunded',
        test_mode: true,
      },
      data: {
        id: 'order_refund_flow',
        attributes: {
          user_email: user.email,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(refundedRes.status).toBe(200);

    const afterRefund = await getMe(user);
    expect(afterRefund.status).toBe(200);
    expect(afterRefund.body.entitlements.pro.status).toBe('none');
    expect(afterRefund.body.entitlements.pro.validUntil).toBeNull();
    expect(afterRefund.body.accessTierEffective).toBe('free');
    expect(afterRefund.body.effectiveProActive).toBe(false);
  });

  test('exact duplicate webhook delivery is recorded once and skipped on retry', async () => {
    const validUntil = '2026-05-01T00:00:00.000Z';
    const user = await createUser({
      email: 'duplicate-retry@example.com',
      username: 'duplicate_retry_user',
    });
    const payload = {
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_duplicate_retry',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: validUntil,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    };

    const firstRes = await postWebhook(payload);
    const retryRes = await postWebhook(payload);

    expect(firstRes.status).toBe(200);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body).toEqual({ ok: true, duplicate: true });

    const events = await BillingEvent.find({
      provider: 'lemonsqueezy',
      eventType: 'subscription_created',
      email: user.email,
    }).lean();
    expect(events).toHaveLength(1);

    const updated = await getMe(user);
    expect(updated.status).toBe(200);
    expect(updated.body.entitlements.pro.status).toBe('active');
    expect(new Date(updated.body.entitlements.pro.validUntil).toISOString()).toBe(validUntil);
  });

  test('lifetime purchase remains premium years later without relying on renewal dates', async () => {
    const user = await createUser({
      email: 'lifetime@example.com',
      username: 'lifetime_user',
    });

    setNow('2026-01-15T00:00:00.000Z');

    const lifetimeRes = await postWebhook({
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_lifetime_persist',
        attributes: {
          user_email: user.email,
          status: 'active',
          product_name: 'FrontendAtlas Premium - Lifetime',
          variant_name: 'Lifetime',
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(lifetimeRes.status).toBe(200);

    setNow('2031-01-15T00:00:00.000Z');

    const afterYears = await getMe(user);
    expect(afterYears.status).toBe(200);
    expect(afterYears.body.entitlements.pro.status).toBe('lifetime');
    expect(afterYears.body.entitlements.pro.validUntil).toBeNull();
    expect(afterYears.body.accessTierEffective).toBe('premium');
    expect(afterYears.body.effectiveProActive).toBe(true);
  });

  test('payment failure keeps premium access until the existing paid-through date, then expires', async () => {
    const startedAt = '2026-06-01T00:00:00.000Z';
    const validUntil = '2026-07-01T00:00:00.000Z';
    const user = await createUser({
      email: 'failed-payment@example.com',
      username: 'failed_payment_user',
    });

    setNow(startedAt);

    const createdRes = await postWebhook({
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_payment_failed_flow',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: validUntil,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(createdRes.status).toBe(200);

    const failedRes = await postWebhook({
      meta: {
        event_name: 'subscription_payment_failed',
        test_mode: true,
      },
      data: {
        id: 'sub_payment_failed_flow',
        attributes: {
          user_email: user.email,
          status: 'failed',
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(failedRes.status).toBe(200);

    const beforeExpiry = await getMe(user);
    expect(beforeExpiry.status).toBe(200);
    expect(beforeExpiry.body.entitlements.pro.status).toBe('cancelled');
    expect(new Date(beforeExpiry.body.entitlements.pro.validUntil).toISOString()).toBe(validUntil);
    expect(beforeExpiry.body.accessTierEffective).toBe('premium');
    expect(beforeExpiry.body.effectiveProActive).toBe(true);

    setNow('2026-07-01T00:00:01.000Z');

    const afterExpiry = await getMe(user);
    expect(afterExpiry.status).toBe(200);
    expect(afterExpiry.body.accessTierEffective).toBe('free');
    expect(afterExpiry.body.effectiveProActive).toBe(false);
  });

  test('renewal after cancel extends access and restores active status', async () => {
    const startedAt = '2026-07-01T00:00:00.000Z';
    const firstPeriodEnd = '2026-08-01T00:00:00.000Z';
    const renewedPeriodEnd = '2026-09-01T00:00:00.000Z';
    const user = await createUser({
      email: 'renew-after-cancel@example.com',
      username: 'renew_after_cancel_user',
    });

    setNow(startedAt);

    await postWebhook({
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_cancel_then_renew',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: firstPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    await postWebhook({
      meta: {
        event_name: 'subscription_cancelled',
        test_mode: true,
      },
      data: {
        id: 'sub_cancel_then_renew',
        attributes: {
          user_email: user.email,
          status: 'cancelled',
          ends_at: firstPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    const renewedRes = await postWebhook({
      meta: {
        event_name: 'subscription_payment_success',
        test_mode: true,
      },
      data: {
        id: 'sub_cancel_then_renew',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: renewedPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(renewedRes.status).toBe(200);

    setNow('2026-08-15T00:00:00.000Z');

    const afterRenewal = await getMe(user);
    expect(afterRenewal.status).toBe(200);
    expect(afterRenewal.body.entitlements.pro.status).toBe('active');
    expect(new Date(afterRenewal.body.entitlements.pro.validUntil).toISOString()).toBe(renewedPeriodEnd);
    expect(afterRenewal.body.accessTierEffective).toBe('premium');
    expect(afterRenewal.body.effectiveProActive).toBe(true);
  });

  test('older cancel event does not shorten a later renewed paid-through date', async () => {
    const startedAt = '2026-08-01T00:00:00.000Z';
    const firstPeriodEnd = '2026-09-01T00:00:00.000Z';
    const renewedPeriodEnd = '2026-10-01T00:00:00.000Z';
    const user = await createUser({
      email: 'out-of-order@example.com',
      username: 'out_of_order_user',
    });

    setNow(startedAt);

    await postWebhook({
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_out_of_order',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: firstPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    await postWebhook({
      meta: {
        event_name: 'subscription_payment_success',
        test_mode: true,
      },
      data: {
        id: 'sub_out_of_order',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: renewedPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    const staleCancelRes = await postWebhook({
      meta: {
        event_name: 'subscription_cancelled',
        test_mode: true,
      },
      data: {
        id: 'sub_out_of_order',
        attributes: {
          user_email: user.email,
          status: 'cancelled',
          ends_at: firstPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(staleCancelRes.status).toBe(200);

    setNow('2026-09-15T00:00:00.000Z');

    const afterStaleCancel = await getMe(user);
    expect(afterStaleCancel.status).toBe(200);
    expect(afterStaleCancel.body.entitlements.pro.status).toBe('active');
    expect(new Date(afterStaleCancel.body.entitlements.pro.validUntil).toISOString()).toBe(renewedPeriodEnd);
    expect(afterStaleCancel.body.accessTierEffective).toBe('premium');
    expect(afterStaleCancel.body.effectiveProActive).toBe(true);
  });

  test('late renewal restores premium after the user has already temporarily expired', async () => {
    const startedAt = '2026-09-01T00:00:00.000Z';
    const firstPeriodEnd = '2026-10-01T00:00:00.000Z';
    const renewedPeriodEnd = '2026-11-01T00:00:00.000Z';
    const user = await createUser({
      email: 'late-renewal@example.com',
      username: 'late_renewal_user',
    });

    setNow(startedAt);

    const createdRes = await postWebhook({
      meta: {
        event_name: 'subscription_created',
        test_mode: true,
      },
      data: {
        id: 'sub_late_renewal_created',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: firstPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(createdRes.status).toBe(200);

    setNow('2026-10-02T00:00:01.000Z');

    const expiredView = await getMe(user);
    expect(expiredView.status).toBe(200);
    expect(expiredView.body.entitlements.pro.status).toBe('active');
    expect(new Date(expiredView.body.entitlements.pro.validUntil).toISOString()).toBe(firstPeriodEnd);
    expect(expiredView.body.accessTierEffective).toBe('free');
    expect(expiredView.body.effectiveProActive).toBe(false);

    const renewedRes = await postWebhook({
      meta: {
        event_name: 'subscription_payment_success',
        test_mode: true,
      },
      data: {
        id: 'sub_late_renewal_created',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: renewedPeriodEnd,
          custom_data: {
            fa_user_id: user._id.toString(),
            fa_user_email: user.email,
          },
        },
      },
    });

    expect(renewedRes.status).toBe(200);

    const recoveredView = await getMe(user);
    expect(recoveredView.status).toBe(200);
    expect(recoveredView.body.entitlements.pro.status).toBe('active');
    expect(new Date(recoveredView.body.entitlements.pro.validUntil).toISOString()).toBe(renewedPeriodEnd);
    expect(recoveredView.body.accessTierEffective).toBe('premium');
    expect(recoveredView.body.effectiveProActive).toBe(true);
  });

  test('a retryable user write failure is reacquired and grants exactly once on retry', async () => {
    const user = await createUser({
      email: 'lease-retry@example.com',
      username: 'lease_retry_user',
    });
    const payload = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_lease_retry',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: '2099-01-01T00:00:00.000Z',
          custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
        },
      },
    };
    const saveSpy = jest
      .spyOn(User, 'updateOne')
      .mockRejectedValueOnce(Object.assign(new Error('synthetic write failure'), { code: 'DB_TEMPORARY' }));

    const first = await postWebhook(payload);
    saveSpy.mockRestore();

    expect(first.status).toBe(500);
    let event = await BillingEvent.findOne({ provider: 'lemonsqueezy', eventType: 'subscription_created' }).lean();
    expect(event.processingStatus).toBe('failed_retryable');
    expect(event.attemptCount).toBe(1);
    expect(event.lastErrorCode).toBe('DB_TEMPORARY');

    const retry = await postWebhook(payload);
    expect(retry.status).toBe(200);
    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('active');
    event = await BillingEvent.findById(event._id).lean();
    expect(event.processingStatus).toBe('processed');
    expect(event.attemptCount).toBe(2);
  });

  test('an older activation retry is processed stale after a newer refund completes', async () => {
    const user = await createUser({
      email: 'stale-lease@example.com',
      username: 'stale_lease_user',
    });
    const activation = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_stale_activation',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: '2099-01-01T00:00:00.000Z',
          custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
        },
      },
    };

    setNow('2026-01-01T00:00:00.000Z');
    const saveSpy = jest
      .spyOn(User, 'updateOne')
      .mockRejectedValueOnce(new Error('synthetic activation interruption'));
    const interrupted = await postWebhook(activation);
    saveSpy.mockRestore();
    expect(interrupted.status).toBe(500);

    setNow('2026-01-02T00:00:00.000Z');
    const refund = await postWebhook({
      meta: { event_name: 'order_refunded', test_mode: true },
      data: {
        id: 'order_newer_refund',
        attributes: {
          user_email: user.email,
          custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
        },
      },
    });
    expect(refund.status).toBe(200);

    setNow('2026-01-03T00:00:00.000Z');
    const retriedActivation = await postWebhook(activation);
    expect(retriedActivation.status).toBe(200);

    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('none');
    expect(updated.accessTier).toBe('free');
    const staleEvent = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventType: 'subscription_created',
    }).lean();
    expect(staleEvent.processingStatus).toBe('processed_stale');
    expect(staleEvent.attemptCount).toBe(2);
  });

  test('CAS prevents a concurrently resumed older activation from overwriting a newer refund', async () => {
    const user = await createUser({
      email: 'concurrent-order@example.com',
      username: 'concurrent_order_user',
    });
    const activation = {
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_concurrent_activation',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: '2099-01-01T00:00:00.000Z',
          custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
        },
      },
    };
    const refund = {
      meta: { event_name: 'order_refunded', test_mode: true },
      data: {
        id: 'order_concurrent_refund',
        attributes: {
          user_email: user.email,
          custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
        },
      },
    };

    const initialWriteFailure = jest
      .spyOn(User, 'updateOne')
      .mockRejectedValueOnce(new Error('synthetic pre-concurrency interruption'));
    expect((await postWebhook(activation)).status).toBe(500);
    initialWriteFailure.mockRestore();

    const originalUpdateOne = User.updateOne.bind(User);
    const queued = [];
    const updateGate = jest.spyOn(User, 'updateOne').mockImplementation((...args) => {
      const marker = String(args[1]?.$set?.['billing.providers.lemonsqueezy.lastEventId'] || '');
      if (!marker.includes('sub_concurrent_activation') && !marker.includes('order_concurrent_refund')) {
        return originalUpdateOne(...args);
      }
      return new Promise((resolve, reject) => {
        queued.push({ args, marker, resolve, reject });
        if (queued.length !== 2) return;
        queueMicrotask(async () => {
          const refundWrite = queued.find((entry) => entry.marker.includes('order_concurrent_refund'));
          const activationWrite = queued.find((entry) => entry.marker.includes('sub_concurrent_activation'));
          try {
            refundWrite.resolve(await originalUpdateOne(...refundWrite.args));
            activationWrite.resolve(await originalUpdateOne(...activationWrite.args));
          } catch (error) {
            refundWrite.reject(error);
            activationWrite.reject(error);
          }
        });
      });
    });

    let responses;
    try {
      responses = await Promise.all([postWebhook(activation), postWebhook(refund)]);
    } finally {
      updateGate.mockRestore();
    }

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('none');
    expect(updated.accessTier).toBe('free');
    const events = await BillingEvent.find({ provider: 'lemonsqueezy' }).lean();
    const activationEvent = events.find((event) => event.eventType === 'subscription_created');
    const refundEvent = events.find((event) => event.eventType === 'order_refunded');
    expect(activationEvent.processingStatus).toBe('processed_stale');
    expect(activationEvent.attemptCount).toBe(2);
    expect(refundEvent.processingStatus).toBe('processed');
  });

  test('CAS retries from fresh entitlement state and preserves unrelated project access', async () => {
    const user = await createUser({
      email: 'cross-state-cas@example.com',
      username: 'cross_state_cas_user',
    });
    const originalUpdateOne = User.updateOne.bind(User);
    let injectedConcurrentWrite = false;
    const updateSpy = jest.spyOn(User, 'updateOne').mockImplementation(async (...args) => {
      const marker = String(args[1]?.$set?.['billing.providers.lemonsqueezy.lastEventId'] || '');
      if (!injectedConcurrentWrite && marker.includes('sub_cross_state_cas')) {
        injectedConcurrentWrite = true;
        await originalUpdateOne(
          { _id: user._id },
          {
            $set: {
              'entitlements.pro.status': 'lifetime',
              'entitlements.pro.validUntil': null,
              'entitlements.projects.status': 'active',
              'entitlements.projects.validUntil': new Date('2099-06-01T00:00:00Z'),
              accessTier: 'premium',
              'billing.providers.gumroad.lastEventId': 'gumroad_concurrent_lifetime',
              'billing.providers.gumroad.lastEventOrderKey': '2099-01-01T00:00:00.000Z:ffffffffffffffffffffffff',
            },
          }
        );
      }
      return originalUpdateOne(...args);
    });

    let response;
    try {
      response = await postWebhook({
        meta: { event_name: 'subscription_created', test_mode: true },
        data: {
          id: 'sub_cross_state_cas',
          attributes: {
            user_email: user.email,
            status: 'active',
            renews_at: '2099-01-01T00:00:00.000Z',
            custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
          },
        },
      });
    } finally {
      updateSpy.mockRestore();
    }

    expect(response.status).toBe(200);
    expect(injectedConcurrentWrite).toBe(true);
    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('lifetime');
    expect(updated.entitlements.projects.status).toBe('active');
    expect(new Date(updated.entitlements.projects.validUntil).toISOString())
      .toBe('2099-06-01T00:00:00.000Z');
    expect(updated.accessTier).toBe('premium');
  });

  test('CAS accepts legacy documents with absent default entitlement fields', async () => {
    const user = await createUser({
      email: 'legacy-cas-defaults@example.com',
      username: 'legacy_cas_defaults_user',
    });
    await User.collection.updateOne(
      { _id: user._id },
      {
        $unset: {
          'entitlements.pro.status': '',
          'entitlements.pro.validUntil': '',
          accessTier: '',
        },
      }
    );

    const response = await postWebhook({
      meta: { event_name: 'subscription_created', test_mode: true },
      data: {
        id: 'sub_legacy_cas_defaults',
        attributes: {
          user_email: user.email,
          status: 'active',
          renews_at: '2099-01-01T00:00:00.000Z',
          custom_data: { fa_user_id: String(user._id), fa_user_email: user.email },
        },
      },
    });

    expect(response.status).toBe(200);
    const updated = await User.findById(user._id).lean();
    expect(updated.entitlements.pro.status).toBe('active');
    expect(updated.accessTier).toBe('premium');
    const event = await BillingEvent.findOne({ eventType: 'subscription_created' }).lean();
    expect(event.processingStatus).toBe('processed');
    expect(event.attemptCount).toBe(1);
  });
});
