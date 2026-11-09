const {
  COUNTRY_CURRENCY,
  MAX_RATE_AGE_DAYS,
  estimateCurrencies,
  loadExchangeRates,
  normalizeRateTable,
  resolveLocalEstimate,
} = require('../services/billing/local-currency');

const DAY_MS = 24 * 60 * 60 * 1000;
const TABLE = { asOf: '2026-11-05', base: 'USD', rates: { INR: 94.62, TRY: 50.03, EUR: 0.89 } };
const day = (iso) => Date.parse(`${iso}T12:00:00Z`);

describe('local-currency estimates', () => {
  test('the committed rate table parses and carries every currency the country map needs', () => {
    const table = loadExchangeRates();
    expect(table).not.toBeNull();
    expect(table.base).toBe('USD');
    expect(table.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const missing = estimateCurrencies().filter((code) => !(table.rates[code] > 0));
    expect(missing).toEqual([]);
  });

  test('maps a regional country to its money and the table rate, case-insensitively', () => {
    expect(resolveLocalEstimate('in', { table: TABLE, today: day('2026-11-10') })).toEqual({ currency: 'INR', rate: 94.62, asOf: '2026-11-05' });
    expect(resolveLocalEstimate('TR', { table: TABLE, today: day('2026-11-10') })).toEqual({ currency: 'TRY', rate: 50.03, asOf: '2026-11-05' });
    // Euro countries estimate in euros; Bulgaria has used the euro since 2026.
    expect(COUNTRY_CURRENCY.BG).toBe('EUR');
    expect(resolveLocalEstimate('BG', { table: TABLE, today: day('2026-11-10') })).toEqual({ currency: 'EUR', rate: 0.89, asOf: '2026-11-05' });
  });

  test('gives no estimate for a dollar country, an unknown country or a currency the table lacks', () => {
    expect(COUNTRY_CURRENCY.EC).toBeUndefined();
    expect(resolveLocalEstimate('EC', { table: TABLE, today: day('2026-11-10') })).toBeNull();
    expect(resolveLocalEstimate('DE', { table: TABLE, today: day('2026-11-10') })).toBeNull();
    expect(resolveLocalEstimate(undefined, { table: TABLE, today: day('2026-11-10') })).toBeNull();
    expect(resolveLocalEstimate('NG', { table: TABLE, today: day('2026-11-10') })).toBeNull();
  });

  test('stops at the age limit rather than publishing a stale rate', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const asOf = Date.parse('2026-11-05T00:00:00Z');
    expect(resolveLocalEstimate('IN', { table: TABLE, today: asOf + MAX_RATE_AGE_DAYS * DAY_MS })).not.toBeNull();
    expect(resolveLocalEstimate('IN', { table: TABLE, today: asOf + (MAX_RATE_AGE_DAYS + 1) * DAY_MS })).toBeNull();
    expect(resolveLocalEstimate('IN', { table: null, today: asOf })).toBeNull();
    warn.mockRestore();
  });

  test('reads only a well-formed dollar table', () => {
    expect(normalizeRateTable(null)).toBeNull();
    expect(normalizeRateTable({ asOf: '2026-11-05', base: 'EUR', rates: { INR: 1 } })).toBeNull();
    expect(normalizeRateTable({ asOf: 'yesterday', base: 'USD', rates: { INR: 1 } })).toBeNull();
    expect(normalizeRateTable({ asOf: '2026-11-05', base: 'USD', rates: { INR: 94.62, bad: 1, NGN: -1, TRY: '50' } })).toEqual({
      asOf: '2026-11-05',
      base: 'USD',
      rates: { INR: 94.62 },
    });
  });
});
