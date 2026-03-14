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
        id: 'sub_lifecycle_monthly_cancelled',
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
        id: 'sub_payment_failed_flow_retry_1',
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
        id: 'sub_cancel_then_renew_cancelled',
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
        id: 'sub_cancel_then_renew_success',
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
        id: 'sub_out_of_order_created',
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
        id: 'sub_out_of_order_renewed',
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
        id: 'sub_out_of_order_cancelled_old',
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
        id: 'sub_late_renewal_success',
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
});
