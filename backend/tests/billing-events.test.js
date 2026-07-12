const { createBillingEventStore } = require('../services/billing/billing-events');

describe('billing event lease store', () => {
  function createFakeModel() {
    let row = null;
    return {
      async create(data) {
        if (row) throw Object.assign(new Error('duplicate'), { code: 11000 });
        row = { _id: '507f1f77bcf86cd799439011', ...data };
        return row;
      },
      async findOneAndUpdate(filter, update) {
        if (!row) return null;
        const retryable = filter.$or.some((clause) => {
          if (clause.processingStatus?.$in) return clause.processingStatus.$in.includes(row.processingStatus);
          if (clause.processingStatus !== row.processingStatus) return false;
          if (clause.leaseExpiresAt?.$lte) return row.leaseExpiresAt <= clause.leaseExpiresAt.$lte;
          if (clause.leaseExpiresAt?.$exists === false) return row.leaseExpiresAt === undefined;
          return clause.leaseExpiresAt === null && row.leaseExpiresAt == null;
        });
        if (!retryable) return null;
        Object.assign(row, update.$set);
        row.attemptCount += update.$inc.attemptCount;
        for (const key of Object.keys(update.$unset || {})) delete row[key];
        return row;
      },
      async findOne() {
        return row;
      },
      async updateOne(filter, update) {
        if (!row || row.processingStatus !== filter.processingStatus || row.leaseToken !== filter.leaseToken) {
          return { modifiedCount: 0 };
        }
        Object.assign(row, update.$set);
        for (const key of Object.keys(update.$unset || {})) delete row[key];
        return { modifiedCount: 1 };
      },
      get row() {
        return row;
      },
    };
  }

  test('leases a new event and returns terminal duplicates without reacquiring', async () => {
    const fakeModel = createFakeModel();
    const store = createBillingEventStore(fakeModel);
    const first = await store.acquireEvent({ provider: 'gumroad', eventId: 'evt_1' });
    await store.completeEvent({
      provider: 'gumroad',
      eventId: 'evt_1',
      leaseToken: first.leaseToken,
      processingStatus: 'processed',
    });
    const second = await store.acquireEvent({ provider: 'gumroad', eventId: 'evt_1' });

    expect(first).toMatchObject({ acquired: true, duplicate: false });
    expect(first.eventOrderKey).toContain('507f1f77bcf86cd799439011');
    expect(second).toMatchObject({ acquired: false, duplicate: true, terminal: true });
  });

  test('returns busy for an active lease and reacquires a failed event', async () => {
    const fakeModel = createFakeModel();
    const store = createBillingEventStore(fakeModel);
    const first = await store.acquireEvent({ provider: 'gumroad', eventId: 'evt_2' });
    const busy = await store.acquireEvent({ provider: 'gumroad', eventId: 'evt_2' });
    await store.failEvent({
      provider: 'gumroad',
      eventId: 'evt_2',
      leaseToken: first.leaseToken,
      error: Object.assign(new Error('temporary database failure'), { code: 'DB_TEMPORARY' }),
    });
    const retry = await store.acquireEvent({ provider: 'gumroad', eventId: 'evt_2' });

    expect(busy).toMatchObject({ acquired: false, busy: true, retryAfterSeconds: 5 });
    expect(retry).toMatchObject({ acquired: true, duplicate: true });
    expect(fakeModel.row.attemptCount).toBe(2);
    expect(fakeModel.row.lastErrorMessage).toBeUndefined();
  });

  test('completion and failure require the current lease token', async () => {
    const fakeModel = createFakeModel();
    const store = createBillingEventStore(fakeModel);
    await store.acquireEvent({ provider: 'lemonsqueezy', eventId: 'evt_3' });

    await expect(store.completeEvent({
      provider: 'lemonsqueezy', eventId: 'evt_3', leaseToken: 'wrong', processingStatus: 'processed',
    })).resolves.toEqual({ completed: false });
    await expect(store.failEvent({
      provider: 'lemonsqueezy', eventId: 'evt_3', leaseToken: 'wrong', error: new Error('nope'),
    })).resolves.toEqual({ failed: false });
  });
});
