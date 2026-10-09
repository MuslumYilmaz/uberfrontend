'use strict';

const {
  applyOrderedProviderEvent,
  classifyProviderEvent,
} = require('../services/billing/ordered-user-event');

const PROVIDER = 'lemonsqueezy';
const KEY_1 = '2026-01-01T00:00:00.000Z#1';
const KEY_2 = '2026-01-02T00:00:00.000Z#2';

function makeModel() {
  const updateOne = jest.fn(async () => ({ modifiedCount: 1 }));
  const findById = jest.fn(async () => null);
  class User {
    constructor(doc) { Object.assign(this, doc); }
  }
  User.updateOne = updateOne;
  User.findById = findById;
  return { User, updateOne, findById };
}

// Provider metadata is a Mongoose subdocument in the real model, so snapshots
// taken through toObject() must not alias the live object.
function providerMetadata(initial) {
  const metadata = { ...initial };
  Object.defineProperty(metadata, 'toObject', { value: () => ({ ...metadata }), enumerable: false });
  return metadata;
}

function makeUser(User, initialMetadata = {}, overrides = {}) {
  return new User({
    _id: 'user_1',
    accessTier: 'free',
    entitlements: { pro: { status: 'none', validUntil: null } },
    billing: { providers: { [PROVIDER]: providerMetadata(initialMetadata) } },
    ...overrides,
  });
}

function activatePro(eventId, orderKey) {
  return (user) => {
    user.accessTier = 'premium';
    user.entitlements.pro.status = 'active';
    user.billing.providers[PROVIDER].lastEventId = eventId;
    user.billing.providers[PROVIDER].lastEventOrderKey = orderKey;
  };
}

describe('ordered billing provider events', () => {
  test('a repeated webhook delivery is reported as already applied without touching the user', async () => {
    const { User, updateOne } = makeModel();
    const user = makeUser(User, { lastEventId: 'evt_1', lastEventOrderKey: KEY_1 });
    const mutate = jest.fn();

    const result = await applyOrderedProviderEvent({
      user, provider: PROVIDER, eventId: 'evt_1', eventOrderKey: KEY_1, mutate,
    });

    expect(result).toMatchObject({ outcome: 'already_applied', attempts: 1 });
    expect(mutate).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
  });

  test('an event that arrives after a newer one is rejected as stale', async () => {
    const { User, updateOne } = makeModel();
    const user = makeUser(User, { lastEventId: 'evt_2', lastEventOrderKey: KEY_2 });
    const mutate = jest.fn();

    const result = await applyOrderedProviderEvent({
      user, provider: PROVIDER, eventId: 'evt_1', eventOrderKey: KEY_1, mutate,
    });

    expect(result).toMatchObject({ outcome: 'stale', attempts: 1 });
    expect(mutate).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
    expect(classifyProviderEvent(user, PROVIDER, 'evt_x', KEY_2)).toBe('stale');
  });

  test('a fresh event is applied with a compare-and-set filter on the previous marker and entitlement state', async () => {
    const { User, updateOne } = makeModel();
    const user = makeUser(User, { lastEventId: 'evt_1', lastEventOrderKey: KEY_1 });

    const result = await applyOrderedProviderEvent({
      user, provider: PROVIDER, eventId: 'evt_2', eventOrderKey: KEY_2,
      mutate: activatePro('evt_2', KEY_2),
    });

    expect(result).toMatchObject({ outcome: 'applied', attempts: 1 });
    expect(updateOne).toHaveBeenCalledTimes(1);
    const [filter, update] = updateOne.mock.calls[0];
    expect(filter._id).toBe('user_1');
    expect(filter[`billing.providers.${PROVIDER}.lastEventId`]).toEqual({ $ne: 'evt_2' });
    expect(filter.$and).toEqual(expect.arrayContaining([
      { [`billing.providers.${PROVIDER}.lastEventOrderKey`]: KEY_1 },
      { $or: [{ 'entitlements.pro.status': 'none' }, { 'entitlements.pro.status': { $exists: false } }] },
      { $or: [{ accessTier: 'free' }, { accessTier: { $exists: false } }] },
    ]));
    expect(update.$set).toMatchObject({
      accessTier: 'premium',
      'entitlements.pro.status': 'active',
      [`billing.providers.${PROVIDER}.lastEventId`]: 'evt_2',
      [`billing.providers.${PROVIDER}.lastEventOrderKey`]: KEY_2,
    });
  });

  test('a lost compare-and-set race re-reads the user and does not apply the event twice', async () => {
    const { User, updateOne, findById } = makeModel();
    const user = makeUser(User, {});
    updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
    findById.mockResolvedValueOnce(makeUser(User, { lastEventId: 'evt_1', lastEventOrderKey: KEY_1 }, {
      accessTier: 'premium',
      entitlements: { pro: { status: 'active', validUntil: null } },
    }));
    const mutate = jest.fn(activatePro('evt_1', KEY_1));

    const result = await applyOrderedProviderEvent({
      user, provider: PROVIDER, eventId: 'evt_1', eventOrderKey: KEY_1, mutate,
    });

    expect(result).toMatchObject({ outcome: 'already_applied', attempts: 2 });
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(updateOne).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith('user_1');
  });

  test('persistent contention fails loudly instead of silently dropping the event', async () => {
    const { User, updateOne, findById } = makeModel();
    updateOne.mockResolvedValue({ modifiedCount: 0 });
    findById.mockImplementation(async () => makeUser(User, {}));

    await expect(applyOrderedProviderEvent({
      user: makeUser(User, {}), provider: PROVIDER, eventId: 'evt_1', eventOrderKey: KEY_1,
      mutate: activatePro('evt_1', KEY_1), maxAttempts: 2,
    })).rejects.toMatchObject({ code: 'BILLING_EVENT_CAS_EXHAUSTED' });
    expect(updateOne).toHaveBeenCalledTimes(2);
  });

  test('events without an order key are refused before any mutation', async () => {
    const { User, updateOne } = makeModel();
    const mutate = jest.fn();

    await expect(applyOrderedProviderEvent({
      user: makeUser(User, {}), provider: PROVIDER, eventId: 'evt_1', eventOrderKey: '', mutate,
    })).rejects.toMatchObject({ code: 'BILLING_EVENT_ORDER_KEY_MISSING' });
    expect(mutate).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
  });
});
