const { recordPendingEntitlement } = require('../services/billing/pending-entitlements');

describe('pending entitlement binding invariants', () => {
  test('accepts a LemonSqueezy record bound only by immutable user id', async () => {
    const model = { create: jest.fn().mockResolvedValue({}) };

    await expect(recordPendingEntitlement(model, {
      provider: 'lemonsqueezy',
      eventId: 'evt_user_only',
      userId: '507f1f77bcf86cd799439011',
      email: '',
    })).resolves.toEqual({ duplicate: false });
    expect(model.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: '507f1f77bcf86cd799439011',
      email: '',
    }));
  });

  test('rejects a LemonSqueezy record without either safe binding', async () => {
    await expect(recordPendingEntitlement({ create: jest.fn() }, {
      provider: 'lemonsqueezy',
      eventId: 'evt_unbound_ls',
    })).rejects.toMatchObject({ code: 'PENDING_ENTITLEMENT_BINDING_REQUIRED' });
  });

  test('rejects Gumroad records without an email binding', async () => {
    await expect(recordPendingEntitlement({ create: jest.fn() }, {
      provider: 'gumroad',
      eventId: 'evt_unbound_gumroad',
      userId: '507f1f77bcf86cd799439011',
    })).rejects.toMatchObject({ code: 'PENDING_ENTITLEMENT_BINDING_REQUIRED' });
  });
});
