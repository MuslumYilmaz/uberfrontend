'use strict';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

let app;
let User;
let BillingEvent;
let CheckoutAttempt;
let PendingEntitlement;
let connectToMongo;
let disconnectMongo;
let mongoServer;
let expectedDbName;

const JWT_SECRET = 'test_jwt_secret_admin_route';

function authHeader(userId, role = 'admin') {
  const token = jwt.sign({ sub: userId.toString(), role }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

function daysFromNowIso(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCMilliseconds(0);
  return date.toISOString();
}

function withDbName(uri, dbName) {
  const base = String(uri || '');
  return base.endsWith('/') ? `${base}${dbName}` : `${base}/${dbName}`;
}

function parseDbName(uri) {
  const match = String(uri || '').match(/\/([^/?]+)(?:\?|$)/);
  return match ? match[1] : null;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = withDbName(mongoServer.getUri(), 'admin_route_test');
  expectedDbName = parseDbName(process.env.MONGO_URL_TEST);
  process.env.EXPECTED_MONGO_DB_NAME_TEST = expectedDbName;
  process.env.JWT_SECRET = JWT_SECRET;

  jest.resetModules();
  app = require('../index');
  ({ connectToMongo, disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  BillingEvent = require('../models/BillingEvent');
  CheckoutAttempt = require('../models/CheckoutAttempt');
  PendingEntitlement = require('../models/PendingEntitlement');

  await connectToMongo(process.env.MONGO_URL_TEST);
  await BillingEvent.init();
  await CheckoutAttempt.init();
});

afterAll(async () => {
  delete process.env.EXPECTED_MONGO_DB_NAME_TEST;
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await BillingEvent.deleteMany({});
  await CheckoutAttempt.deleteMany({});
  await PendingEntitlement.deleteMany({});
});

describe('Admin DB diagnostics', () => {
  test('returns current db info and model-to-collection mapping for admin users', async () => {
    const admin = await User.create({
      email: 'admin@example.com',
      username: 'admin_user',
      passwordHash: 'hash',
      role: 'admin',
    });

    const res = await request(app)
      .get('/api/admin/diagnostics/db')
      .set('Authorization', authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      readyState: 1,
      name: expectedDbName,
      expectedName: expectedDbName,
      matchesExpected: true,
      models: expect.arrayContaining([
        expect.objectContaining({
          model: 'User',
          collection: 'users',
        }),
      ]),
    }));
  });

  test('rejects non-admin users', async () => {
    const user = await User.create({
      email: 'user@example.com',
      username: 'plain_user',
      passwordHash: 'hash',
      role: 'user',
    });

    const res = await request(app)
      .get('/api/admin/diagnostics/db')
      .set('Authorization', authHeader(user._id, 'user'));

    expect(res.status).toBe(403);
    expect(res.body?.error).toBe('Admin only');
  });
});

describe('Admin billing simulator', () => {
  test('returns retryable 503 when the simulated event already has an active lease', async () => {
    const admin = await User.create({
      email: 'admin-busy@example.com',
      username: 'admin_busy_user',
      passwordHash: 'hash',
      role: 'admin',
    });
    const user = await User.create({
      email: 'subscriber-busy@example.com',
      username: 'subscriber_busy_user',
      passwordHash: 'hash',
    });
    const input = {
      userId: String(user._id),
      scenario: 'activate',
      externalId: 'sim_busy_event',
      validUntil: daysFromNowIso(30),
    };
    const { buildLemonSqueezySimulationPayload } = require('../services/billing/providers/lemonsqueezy-simulator');
    const { normalizeLemonSqueezyEvent } = require('../services/billing/providers/lemonsqueezy');
    const simulation = buildLemonSqueezySimulationPayload({ user, input });
    const rawBody = JSON.stringify(simulation.payload);
    const normalized = normalizeLemonSqueezyEvent(simulation.payload, rawBody);
    const eventId = `simulate:${simulation.mode}:${normalized.eventId}`;
    await BillingEvent.create({
      provider: 'lemonsqueezy',
      eventId,
      eventType: normalized.eventType,
      email: user.email,
      payload: simulation.payload,
      processingStatus: 'processing',
      attemptCount: 1,
      leaseToken: 'busy-simulator-lease',
      leaseExpiresAt: new Date(Date.now() + 60_000),
    });

    const response = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send(input);

    expect(response.status).toBe(503);
    expect(response.headers['retry-after']).toBe('5');
    expect(response.body).toEqual(expect.objectContaining({
      ok: false,
      duplicate: true,
      retryable: true,
      eventId,
    }));
  });

  test('simulates activate, renew, cancel, and refund scenarios for LemonSqueezy', async () => {
    const admin = await User.create({
      email: 'admin@example.com',
      username: 'admin_user',
      passwordHash: 'hash',
      role: 'admin',
    });

    const user = await User.create({
      email: 'subscriber@example.com',
      username: 'subscriber_user',
      passwordHash: 'hash',
      role: 'user',
      accessTier: 'free',
      entitlements: {
        pro: { status: 'none', validUntil: null },
        projects: { status: 'none', validUntil: null },
      },
    });
    const startedAt = daysFromNowIso(-1);
    const activatedValidUntil = daysFromNowIso(30);
    const renewedValidUntil = daysFromNowIso(60);
    await CheckoutAttempt.create({
      attemptId: 'chk_sim_activate_123',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_sim_activate_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_sim_activate_123',
      customerEmail: user.email,
      customerUserId: String(user._id),
    });

    const activate = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        attemptId: 'chk_sim_activate_123',
        scenario: 'activate',
        validUntil: activatedValidUntil,
        startedAt,
        customerId: 'cust_sim',
        subscriptionId: 'sub_sim',
        manageUrl: 'https://example.com/manage',
      });

    expect(activate.status).toBe(200);
    expect(activate.body.scenario).toBe('activate');
    expect(activate.body.user.accessTier).toBe('premium');
    expect(activate.body.user.entitlements.pro.status).toBe('active');
    expect(new Date(activate.body.user.entitlements.pro.validUntil).toISOString()).toBe(activatedValidUntil);
    expect(activate.body.user.billing.providers.lemonsqueezy.customerId).toBe('cust_sim');
    expect(activate.body.user.billing.providers.lemonsqueezy.subscriptionId).toBe('sub_sim');
    expect(activate.body.user.billing.providers.lemonsqueezy.manageUrl).toBe('https://example.com/manage');
    const activatedAttempt = await CheckoutAttempt.findOne({ attemptId: 'chk_sim_activate_123' }).lean();
    expect(activatedAttempt).toEqual(expect.objectContaining({
      status: 'applied',
      billingEventId: activate.body.eventId,
      providerSubscriptionId: 'sub_sim',
      customerEmail: user.email,
      customerUserId: String(user._id),
    }));
    expect(activatedAttempt.completedAt).toBeTruthy();

    const renew = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'renew',
        validUntil: renewedValidUntil,
      });

    expect(renew.status).toBe(200);
    expect(renew.body.user.entitlements.pro.status).toBe('active');
    expect(new Date(renew.body.user.entitlements.pro.validUntil).toISOString()).toBe(renewedValidUntil);

    const cancel = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'cancel',
      });

    expect(cancel.status).toBe(200);
    expect(cancel.body.user.entitlements.pro.status).toBe('cancelled');
    expect(new Date(cancel.body.user.entitlements.pro.validUntil).toISOString()).toBe(renewedValidUntil);
    expect(cancel.body.user.accessTier).toBe('premium');

    const refund = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'refund',
      });

    expect(refund.status).toBe(200);
    expect(refund.body.user.entitlements.pro.status).toBe('none');
    expect(refund.body.user.entitlements.pro.validUntil).toBeNull();
    expect(refund.body.user.accessTier).toBe('free');

    const simulatedEvent = await BillingEvent.findOne({
      provider: 'lemonsqueezy',
      eventId: refund.body.eventId,
    }).lean();

    expect(simulatedEvent).toEqual(expect.objectContaining({
      provider: 'lemonsqueezy',
      processingStatus: 'processed_simulated',
    }));
    expect(String(simulatedEvent.userId)).toBe(String(user._id));
  });

  test('rejects invalid simulator input with supported scenarios', async () => {
    const admin = await User.create({
      email: 'admin2@example.com',
      username: 'admin_user_2',
      passwordHash: 'hash',
      role: 'admin',
    });

    const user = await User.create({
      email: 'subscriber2@example.com',
      username: 'subscriber_user_2',
      passwordHash: 'hash',
      role: 'user',
    });

    const res = await request(app)
      .post('/api/admin/billing/simulate/lemonsqueezy')
      .set('Authorization', authHeader(admin._id))
      .send({
        userId: user._id.toString(),
        scenario: 'activate',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('validUntil');
    expect(res.body.supportedScenarios).toEqual(
      expect.arrayContaining(['activate', 'renew', 'cancel', 'refund', 'lifetime', 'expire'])
    );
  });
});

describe('Admin billing reconciliation', () => {
  test('returns unresolved checkout attempts, pending entitlements, and unresolved billing events', async () => {
    const admin = await User.create({
      email: 'billing-admin@example.com',
      username: 'billing_admin_user',
      passwordHash: 'hash',
      role: 'admin',
    });

    const user = await User.create({
      email: 'billing-subscriber@example.com',
      username: 'billing_subscriber_user',
      passwordHash: 'hash',
      role: 'user',
    });

    await CheckoutAttempt.create({
      attemptId: 'chk_reconcile_123',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      analyticsSurface: 'pricing_card',
      analyticsSource: 'campaign_admin',
      status: 'pending_user_match',
      billingEventId: 'test:event_reconcile_123',
      customerEmail: user.email,
      lastErrorCode: 'PENDING_USER_MATCH',
      lastErrorMessage: 'Payment received, but we could not safely match it to this account yet.',
    });

    await PendingEntitlement.create({
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'test:event_reconcile_123',
      eventType: 'subscription_created',
      email: user.email,
      userId: String(user._id),
      entitlement: { status: 'active', validUntil: null },
      payload: {
        data: {
          attributes: {
            custom_data: {
              fa_checkout_attempt_id: 'chk_reconcile_123',
            },
          },
        },
      },
    });

    await PendingEntitlement.create({
      provider: 'lemonsqueezy',
      scope: 'pro',
      eventId: 'test:event_ignored_789',
      eventType: 'subscription_created',
      email: user.email,
      userId: 'stale-invalid-user-id',
      entitlement: { status: 'active', validUntil: null },
      ignoredAt: new Date(),
      ignoredReason: 'lemonsqueezy_user_binding_missing_user',
      ignoredBy: 'prod-integrity-repair',
    });

    await BillingEvent.create({
      provider: 'lemonsqueezy',
      eventId: 'test:event_unresolved_456',
      eventType: 'subscription_created',
      email: 'unknown@example.com',
      processingStatus: 'pending_user',
      payload: {},
    });

    const res = await request(app)
      .get('/api/admin/billing/reconciliation')
      .set('Authorization', authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual({
      pendingAttempts: 1,
      pendingEntitlements: 1,
      unresolvedEvents: 1,
      verifiedPurchaseCandidates: 0,
      verifiedPurchaseMismatches: 0,
    });
    expect(res.body.checkoutAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attemptId: 'chk_reconcile_123',
          supportReference: 'chk_reconcile_123',
          status: 'pending_user_match',
          analyticsSurface: 'pricing_card',
          analyticsSource: 'campaign_admin',
          billingEventId: 'test:event_reconcile_123',
          lastErrorCode: 'PENDING_USER_MATCH',
        }),
      ])
    );
    expect(res.body.pendingEntitlements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: 'test:event_reconcile_123',
          attemptId: 'chk_reconcile_123',
          supportReference: 'chk_reconcile_123',
          bindingStatus: 'exact_user_required',
        }),
      ])
    );
    expect(res.body.pendingEntitlements).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: 'test:event_ignored_789',
        }),
      ])
    );
    expect(res.body.billingEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: 'test:event_unresolved_456',
          supportReference: 'test:event_unresolved_456',
          processingStatus: 'pending_user',
        }),
      ])
    );
  });

  test('flags missing entitlement and a campaign purchase whose discount was not applied', async () => {
    const admin = await User.create({
      email: 'reconciliation-admin@example.com',
      username: 'reconciliation_admin',
      passwordHash: 'hash',
      role: 'admin',
    });
    const user = await User.create({
      email: 'missing-entitlement@example.com',
      username: 'missing_entitlement',
      passwordHash: 'hash',
      role: 'user',
      accessTier: 'free',
      entitlements: { pro: { status: 'none', validUntil: null } },
    });
    const eventId = 'test:subscription_created:missing_entitlement';
    await BillingEvent.create({
      provider: 'lemonsqueezy',
      eventId,
      eventType: 'subscription_created',
      processingStatus: 'processed',
      userId: user._id,
      payload: {},
    });
    await CheckoutAttempt.create({
      attemptId: 'chk_verified_missing_entitlement',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      campaignId: 'partner_august',
      providerDiscountId: 'discount_123',
      status: 'applied',
      billingEventId: eventId,
      paymentEventId: 'test:order_created:missing_entitlement',
      paymentCurrency: 'USD',
      paymentSubtotalCents: 1200,
      paymentDiscountCents: 0,
      paymentTaxCents: 0,
      paymentTotalCents: 1200,
      paymentVerifiedAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    const res = await request(app)
      .get('/api/admin/billing/reconciliation?mode=test')
      .set('Authorization', authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.summary.verifiedPurchaseCandidates).toBe(1);
    expect(res.body.summary.verifiedPurchaseMismatches).toBe(1);
    expect(res.body.verifiedPurchases.mismatches).toEqual([
      expect.objectContaining({
        attemptId: 'chk_verified_missing_entitlement',
        campaignId: 'partner_august',
        providerDiscountId: 'discount_123',
        paymentDiscountCents: 0,
        reasons: expect.arrayContaining([
          'campaign_discount_not_applied',
          'entitlement_inactive',
          'access_tier_not_premium',
        ]),
      }),
    ]);
    expect(res.body.verifiedPurchases.campaigns).toEqual([
      expect.objectContaining({
        campaignId: 'partner_august',
        providerDiscountId: 'discount_123',
        purchases: 1,
        includedPurchases: 1,
        discountAppliedPurchases: 0,
        discountMissingPurchases: 1,
        subtotalCents: 1200,
        discountCents: 0,
        totalCents: 1200,
        recordedRevenueExcludingTaxCents: 1200,
      }),
    ]);
    expect(JSON.stringify(res.body.verifiedPurchases)).not.toContain(user.email);
  });

  test('optionally reconciles provider orders missing a verified backend purchase and entitlement', async () => {
    const admin = await User.create({
      email: 'provider-reconciliation-admin@example.com',
      username: 'provider_reconciliation_admin',
      passwordHash: 'hash',
      role: 'admin',
    });
    const user = await User.create({
      email: 'provider-order-user@example.com',
      username: 'provider_order_user',
      passwordHash: 'hash',
      role: 'user',
      accessTier: 'free',
      entitlements: { pro: { status: 'none', validUntil: null } },
    });
    await CheckoutAttempt.create({
      attemptId: 'chk_unverified_provider_order',
      userId: user._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'created',
      providerOrderId: '1002',
    });
    const activeUser = await User.create({
      email: 'provider-order-active@example.com',
      username: 'provider_order_active',
      passwordHash: 'hash',
      role: 'user',
      accessTier: 'premium',
      entitlements: { pro: { status: 'active', validUntil: null } },
    });
    const verifiedEventId = 'test:subscription_created:provider_amount_mismatch';
    await BillingEvent.create({
      provider: 'lemonsqueezy',
      eventId: verifiedEventId,
      eventType: 'subscription_created',
      processingStatus: 'processed',
      userId: activeUser._id,
      payload: {},
    });
    await CheckoutAttempt.create({
      attemptId: 'chk_provider_amount_mismatch',
      userId: activeUser._id,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      status: 'applied',
      providerOrderId: '1003',
      billingEventId: verifiedEventId,
      paymentEventId: 'test:order_created:provider_amount_mismatch',
      paymentCurrency: 'EUR',
      paymentSubtotalCents: 999,
      paymentDiscountCents: 0,
      paymentTaxCents: 0,
      paymentTotalCents: 999,
      paymentVerifiedAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    const originalFetch = global.fetch;
    const originalApiKey = process.env.LEMONSQUEEZY_API_KEY;
    const originalTestApiKey = process.env.LEMONSQUEEZY_API_KEY_TEST;
    const originalStoreId = process.env.LEMONSQUEEZY_STORE_ID;
    process.env.LEMONSQUEEZY_API_KEY = 'test_read_only_key';
    process.env.LEMONSQUEEZY_API_KEY_TEST = 'test_read_only_key';
    process.env.LEMONSQUEEZY_STORE_ID = '12345';
    const createdAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'provider-order-id-1',
            attributes: {
              order_number: 1001,
              status: 'paid',
              total: 1200,
              discount_total: 0,
              currency: 'USD',
              created_at: createdAt,
              test_mode: true,
            },
          },
          {
            id: 'provider-order-id-2',
            attributes: {
              order_number: 1002,
              status: 'paid',
              total: 1200,
              discount_total: 0,
              currency: 'USD',
              created_at: createdAt,
              test_mode: true,
            },
          },
          {
            id: 'provider-order-id-3',
            attributes: {
              order_number: 1003,
              status: 'paid',
              total: 1200,
              discount_total: 100,
              currency: 'USD',
              created_at: createdAt,
              test_mode: true,
            },
          },
        ],
      }),
    });

    try {
      const res = await request(app)
        .get('/api/admin/billing/reconciliation?mode=test&includeProviderOrders=true')
        .set('Authorization', authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.summary.providerOrders).toBe(3);
      expect(res.body.summary.providerOrderMismatches).toBe(3);
      expect(res.body.verifiedPurchases.providerOrders).toEqual(expect.objectContaining({
        status: 'checked',
        truncated: false,
        mismatches: expect.arrayContaining([
          expect.objectContaining({
            orderId: '1001',
            reasons: ['checkout_attempt_missing'],
          }),
          expect.objectContaining({
            orderId: '1002',
            attemptId: 'chk_unverified_provider_order',
            reasons: expect.arrayContaining([
              'purchase_unverified',
              'entitlement_not_applied',
              'entitlement_inactive',
              'entitlement_access_tier_mismatch',
            ]),
          }),
          expect.objectContaining({
            orderId: '1003',
            attemptId: 'chk_provider_amount_mismatch',
            reasons: expect.arrayContaining([
              'purchase_amount_mismatch',
              'purchase_discount_mismatch',
              'purchase_currency_mismatch',
            ]),
          }),
        ]),
      }));
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [providerUrl, providerOptions] = global.fetch.mock.calls[0];
      expect(providerUrl).toContain('filter%5Bstore_id%5D=12345');
      expect(providerUrl).not.toContain('test-mode');
      expect(providerOptions.headers.Authorization).toBe('Bearer test_read_only_key');
      expect(JSON.stringify(res.body)).not.toContain(user.email);
      expect(JSON.stringify(res.body)).not.toContain('test_read_only_key');
    } finally {
      global.fetch = originalFetch;
      if (originalApiKey === undefined) delete process.env.LEMONSQUEEZY_API_KEY;
      else process.env.LEMONSQUEEZY_API_KEY = originalApiKey;
      if (originalTestApiKey === undefined) delete process.env.LEMONSQUEEZY_API_KEY_TEST;
      else process.env.LEMONSQUEEZY_API_KEY_TEST = originalTestApiKey;
      if (originalStoreId === undefined) delete process.env.LEMONSQUEEZY_STORE_ID;
      else process.env.LEMONSQUEEZY_STORE_ID = originalStoreId;
    }
  });
});
