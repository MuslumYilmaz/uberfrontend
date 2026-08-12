'use strict';

const {
  ACTIVE_ACTION_STATES,
  istanbulIsoWeekKey,
  sendWeeklySeoDigest,
} = require('../services/seo/digest');

const NOW = new Date('2026-08-10T06:00:00.000Z'); // Monday 09:00 Europe/Istanbul
const VALID_CONFIG = Object.freeze({
  enabled: true,
  configured: true,
  siteUrl: 'sc-domain:frontendatlas.com',
});
const VALID_OWNER = Object.freeze({
  available: true,
  ownerUserId: '507f1f77bcf86cd799439011',
  ownerEmail: 'mslmyilmaz34@gmail.com',
});

function queryResult(getValue, { applyLimit = false } = {}) {
  let limit = null;
  const query = {
    select: jest.fn(() => query),
    sort: jest.fn(() => query),
    limit: jest.fn((value) => {
      limit = value;
      return query;
    }),
    lean: jest.fn(async () => {
      const value = getValue();
      return applyLimit && Array.isArray(value) && Number.isInteger(limit)
        ? value.slice(0, limit)
        : value;
    }),
  };
  return query;
}

function createInMemoryDeliveryModel() {
  const records = new Map();
  const keyFor = ({ siteUrl, weekKey }) => `${siteUrl}|${weekKey}`;
  return {
    records,
    create: jest.fn(async (document) => {
      const key = keyFor(document);
      if (records.has(key)) {
        const error = new Error('duplicate');
        error.code = 11000;
        throw error;
      }
      records.set(key, { ...document });
      return records.get(key);
    }),
    findOne: jest.fn((filter) => queryResult(() => records.get(keyFor(filter)) || null)),
    updateOne: jest.fn(async (filter, update) => {
      const key = keyFor(filter);
      const current = records.get(key);
      if (!current || (filter.status && current.status !== filter.status)) {
        return { matchedCount: 0, modifiedCount: 0 };
      }
      records.set(key, { ...current, ...(update.$set || {}) });
      return { matchedCount: 1, modifiedCount: 1 };
    }),
  };
}

function createDependencies({
  actions = [],
  state = null,
  mailer,
  owner = {
    _id: VALID_OWNER.ownerUserId,
    email: VALID_OWNER.ownerEmail,
    emailVerifiedAt: NOW,
    role: 'admin',
  },
} = {}) {
  const deliveryModel = createInMemoryDeliveryModel();
  const actionQuery = queryResult(() => actions, { applyLimit: true });
  const stateQuery = queryResult(() => state);
  const actionModel = { find: jest.fn(() => actionQuery) };
  const syncStateModel = { findOne: jest.fn(() => stateQuery) };
  const userQuery = queryResult(() => owner);
  const userModel = { findById: jest.fn(() => userQuery) };
  const sendMail = mailer || jest.fn(async () => ({ accepted: [VALID_OWNER.ownerEmail] }));
  return {
    dependencies: { actionModel, syncStateModel, deliveryModel, userModel, sendMail },
    actionModel,
    actionQuery,
    deliveryModel,
    sendMail,
    syncStateModel,
    userModel,
  };
}

function action(index, overrides = {}) {
  return {
    type: 'content_decay',
    state: 'proposed',
    canonicalUrl: `https://frontendatlas.com/page-${index}`,
    priorityScore: 100 - index,
    expectedAdditionalClicks: index,
    createdAt: NOW,
    ...overrides,
  };
}

describe('weekly SEO digest', () => {
  test('uses an Istanbul ISO week claim to send no more than once', async () => {
    const fixtures = createDependencies({
      actions: [action(1)],
      state: {
        lastSuccessfulSyncAt: new Date('2026-08-10T05:00:00.000Z'),
        lastFinalizedDate: '2026-08-07',
        storageLevel: 'ok',
        recentBackfillComplete: true,
      },
    });

    const first = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    const duplicate = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: new Date('2026-08-12T12:00:00.000Z'),
      dependencies: fixtures.dependencies,
    });

    expect(first).toMatchObject({ status: 'sent', sent: true, weekKey: '2026-W33' });
    expect(duplicate).toMatchObject({ status: 'already_sent', sent: false, reason: 'duplicate_week' });
    expect(fixtures.sendMail).toHaveBeenCalledTimes(1);
    expect(fixtures.deliveryModel.create).toHaveBeenCalledTimes(2);
  });

  test('renders only allowlisted action fields and escapes dynamic HTML', async () => {
    const fixtures = createDependencies({
      actions: [action(1, {
        type: '<img src=x onerror=alert(1)>',
        state: '<script>steal()</script>',
        canonicalUrl: 'https://frontendatlas.com/guides/a&b?raw=do-not-copy',
        summary: '<img src=x onerror=credential-theft>',
        hypothesis: '-----BEGIN PRIVATE KEY-----',
        evidence: {
          query: 'ultra secret raw search phrase',
          queryClusters: [{ label: 'another raw query' }],
        },
      })],
      state: {
        lastSuccessfulSyncAt: new Date('2026-08-09T06:00:00.000Z'),
        lastFinalizedDate: '2026-08-06',
        storageLevel: 'ok',
        recentBackfillComplete: false,
        lastError: '<script>credentials and stack trace</script>',
      },
    });

    const result = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    const message = fixtures.sendMail.mock.calls[0][0];
    const serialized = JSON.stringify(message);

    expect(result.status).toBe('sent');
    expect(message.to).toBe(VALID_OWNER.ownerEmail);
    expect(message.html).toContain('/guides/a&amp;b');
    expect(message.text).toContain('/guides/a&b');
    expect(message.html).not.toContain('<img');
    expect(message.html).not.toContain('<script');
    expect(serialized).not.toContain('ultra secret raw search phrase');
    expect(serialized).not.toContain('another raw query');
    expect(serialized).not.toContain('PRIVATE KEY');
    expect(serialized).not.toContain('credentials and stack trace');
    expect(serialized).not.toContain('raw=do-not-copy');
    expect(fixtures.actionModel.find).toHaveBeenCalledWith({
      state: { $in: ACTIVE_ACTION_STATES },
    });
  });

  test('skips safely before persistence or mail when disabled or misconfigured', async () => {
    const fixtures = createDependencies();

    const disabled = await sendWeeklySeoDigest({
      config: { ...VALID_CONFIG, enabled: false },
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    const missingGscConfig = await sendWeeklySeoDigest({
      config: { ...VALID_CONFIG, configured: false },
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    const invalidOwner = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: { available: true, ownerEmail: 'not-an-email' },
      now: NOW,
      dependencies: fixtures.dependencies,
    });

    expect(disabled).toMatchObject({ status: 'skipped', reason: 'disabled' });
    expect(missingGscConfig).toMatchObject({ status: 'skipped', reason: 'misconfigured' });
    expect(invalidOwner).toMatchObject({ status: 'skipped', reason: 'misconfigured' });
    expect(fixtures.deliveryModel.create).not.toHaveBeenCalled();
    expect(fixtures.actionModel.find).not.toHaveBeenCalled();
    expect(fixtures.sendMail).not.toHaveBeenCalled();
  });

  test.each([
    ['different id', { _id: '507f1f77bcf86cd799439012', email: VALID_OWNER.ownerEmail, emailVerifiedAt: NOW, role: 'admin' }],
    ['different email', { _id: VALID_OWNER.ownerUserId, email: 'other@example.com', emailVerifiedAt: NOW, role: 'admin' }],
    ['unverified email', { _id: VALID_OWNER.ownerUserId, email: VALID_OWNER.ownerEmail, emailVerifiedAt: null, role: 'admin' }],
    ['non-admin role', { _id: VALID_OWNER.ownerUserId, email: VALID_OWNER.ownerEmail, emailVerifiedAt: NOW, role: 'user' }],
  ])('does not claim or send when the fresh owner tuple has a %s', async (_label, owner) => {
    const fixtures = createDependencies({ owner });
    const result = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    expect(result).toMatchObject({ status: 'skipped', sent: false, reason: 'owner_mismatch' });
    expect(fixtures.userModel.findById).toHaveBeenCalledWith(VALID_OWNER.ownerUserId);
    expect(fixtures.deliveryModel.create).not.toHaveBeenCalled();
    expect(fixtures.actionModel.find).not.toHaveBeenCalled();
    expect(fixtures.sendMail).not.toHaveBeenCalled();
  });

  test('bounds the digest to the top ten active actions', async () => {
    const names = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    const actions = names.map((name, index) => action(index + 1, {
      canonicalUrl: `https://frontendatlas.com/${name}`,
    }));
    const fixtures = createDependencies({ actions });

    const result = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    const message = fixtures.sendMail.mock.calls[0][0];

    expect(result.actionCount).toBe(10);
    expect(fixtures.actionQuery.limit).toHaveBeenCalledWith(10);
    expect(message.text).toContain('/ten');
    expect(message.text).not.toContain('/eleven');
    expect(message.text).not.toContain('/twelve');
  });

  test('does not present an unmodeled structural opportunity as zero click impact', async () => {
    const fixtures = createDependencies({
      actions: [action(1, {
        type: 'internal_link',
        queueKind: 'structural',
        impactKind: 'structural',
        expectedAdditionalClicks: 0,
        expectedImpact: {
          metric: 'clicks',
          low: null,
          point: null,
          high: null,
          windowDays: 28,
          quality: 'not_estimated',
        },
      })],
    });

    await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    const message = fixtures.sendMail.mock.calls[0][0];

    expect(message.text).toContain('Impact not estimated');
    expect(message.text).not.toContain('Potential clicks +0');
    expect(message.html).toContain('Impact not estimated');
    expect(message.html).not.toContain('Potential clicks +0');
  });

  test('treats an unavailable SMTP configuration as a safe, non-retried skip', async () => {
    const smtpError = Object.assign(new Error('secret provider detail'), { code: 'SMTP_NOT_CONFIGURED' });
    const fixtures = createDependencies({
      mailer: jest.fn(async () => { throw smtpError; }),
    });

    const first = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });
    const duplicate = await sendWeeklySeoDigest({
      config: VALID_CONFIG,
      ownerConfig: VALID_OWNER,
      now: NOW,
      dependencies: fixtures.dependencies,
    });

    expect(first).toMatchObject({ status: 'skipped', reason: 'smtp_unavailable' });
    expect(duplicate).toMatchObject({ status: 'already_attempted', reason: 'duplicate_week' });
    expect(first).not.toHaveProperty('error');
    expect(fixtures.sendMail).toHaveBeenCalledTimes(1);
  });

  test('derives the week from Istanbul local time around the UTC Sunday boundary', () => {
    expect(istanbulIsoWeekKey(new Date('2026-01-04T20:30:00.000Z'))).toBe('2026-W01');
    expect(istanbulIsoWeekKey(new Date('2026-01-04T22:30:00.000Z'))).toBe('2026-W02');
  });
});
