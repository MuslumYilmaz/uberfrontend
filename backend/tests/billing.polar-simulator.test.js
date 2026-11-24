const { buildPolarSimulationPayload, SUPPORTED_SCENARIOS } = require('../services/billing/providers/polar-simulator');
const { normalizePolarEvent } = require('../services/billing/providers/polar');

const user = { _id: '507f1f77bcf86cd799439011', email: 'sim@example.com', username: 'sim_user' };

function run(input) {
  const simulation = buildPolarSimulationPayload({ user, input });
  const normalized = normalizePolarEvent(simulation.payload, JSON.stringify(simulation.payload), { webhookId: simulation.webhookId });
  return { simulation, normalized };
}

describe('polar simulator payloads', () => {
  test('every scenario normalizes to the entitlement the operator expects', () => {
    const validUntil = '2026-12-23T08:07:07.262Z';
    const activate = run({ scenario: 'activate', validUntil, attemptId: 'chk_sim' });
    expect(activate.simulation.payload.type).toBe('subscription.updated');
    expect(activate.normalized.entitlement).toEqual({ status: 'active', validUntil: new Date(validUntil) });
    expect(activate.normalized.userId).toBe(user._id);
    expect(activate.normalized.attemptId).toBe('chk_sim');
    expect(activate.normalized.email).toBe('sim@example.com');
    expect(activate.normalized.eventId).toMatch(/^sim_sim_/);

    expect(run({ scenario: 'renew', validUntil }).normalized.entitlement.status).toBe('active');
    const cancel = run({ scenario: 'cancel', validUntil });
    expect(cancel.normalized.entitlement).toEqual({ status: 'cancelled', validUntil: new Date(validUntil) });
    expect(run({ scenario: 'expire' }).normalized.entitlement.status).toBe('none');
    expect(run({ scenario: 'revoke' }).normalized.entitlement.status).toBe('none');
    const refund = run({ scenario: 'refund' });
    expect(refund.simulation.payload.type).toBe('order.refunded');
    expect(refund.normalized.entitlement.status).toBe('none');
    expect(refund.normalized.shouldApplyEntitlement).toBe(true);
    const lifetime = run({ scenario: 'lifetime' });
    expect(lifetime.simulation.payload.type).toBe('order.paid');
    expect(lifetime.normalized.entitlement).toEqual({ status: 'lifetime', validUntil: null });
    expect(lifetime.normalized.orderPayment.verified).toBe(true);
    expect(lifetime.normalized.orderPayment.totalCents).toBe(17900);
  });

  test('rejects unknown scenarios, bad dates and missing paid-through dates', () => {
    expect(() => buildPolarSimulationPayload({ user, input: { scenario: 'teleport' } })).toThrow(/Unsupported scenario/);
    expect(() => buildPolarSimulationPayload({ user, input: { scenario: 'activate' } })).toThrow(/validUntil/);
    expect(() => buildPolarSimulationPayload({ user, input: { scenario: 'activate', validUntil: 'not-a-date' } })).toThrow(/Invalid "validUntil"/);
    expect(Array.from(SUPPORTED_SCENARIOS)).toEqual(['activate', 'renew', 'cancel', 'refund', 'lifetime', 'expire', 'revoke']);
  });

  test('a live flag produces a live-mode simulation', () => {
    expect(buildPolarSimulationPayload({ user, input: { scenario: 'expire', testMode: 'false' } }).mode).toBe('live');
    expect(buildPolarSimulationPayload({ user, input: { scenario: 'expire' } }).mode).toBe('test');
  });
});
