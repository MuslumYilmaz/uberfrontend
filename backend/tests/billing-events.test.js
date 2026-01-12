const { createBillingEventStore } = require('../services/billing/billing-events');

describe('billing events', () => {
  test('recordEvent returns duplicate=true on duplicate key error', async () => {
    let calls = 0;
    const fakeModel = {
      async create() {
        calls += 1;
        if (calls > 1) {
          const err = new Error('duplicate');
          err.code = 11000;
          throw err;
        }
        return { ok: true };
      },
    };

    const store = createBillingEventStore(fakeModel);
    const first = await store.recordEvent({ provider: 'gumroad', eventId: 'evt_1' });
    const second = await store.recordEvent({ provider: 'gumroad', eventId: 'evt_1' });

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
  });
});
