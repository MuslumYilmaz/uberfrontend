// Local-currency estimates next to a regional price (docs/references/pricing-plan-2026-10.md,
// Step 7; company-plan step 9, 2.8). The checkout charges US dollars; the pricing page may add
// "about ₹840 a month" so a visitor can judge the price in their own money. The rates come from
// a dated table in data/exchange-rates.json, refreshed by `npm run update:exchange-rates`
// (open.er-api.com, attribution required, the page links the provider). A table older than
// MAX_RATE_AGE_DAYS publishes no estimate: a wrong number costs more trust than none.

const MAX_RATE_AGE_DAYS = 120;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

// The regional launch table's countries and the money each one pays in. Ecuador uses the US
// dollar, so it is left out and gets no estimate; Slovakia, Croatia, Lithuania, Latvia and
// Bulgaria (euro since 2026-01-01) are priced in euros. A country missing here gets none.
const COUNTRY_CURRENCY = Object.freeze({
  IN: 'INR', PK: 'PKR', BD: 'BDT', NP: 'NPR', NG: 'NGN', EG: 'EGP', UZ: 'UZS', ET: 'ETB', GH: 'GHS', TZ: 'TZS',
  TR: 'TRY', VN: 'VND', UA: 'UAH', LK: 'LKR', ID: 'IDR', TH: 'THB', MY: 'MYR', KE: 'KES', PH: 'PHP', CO: 'COP',
  KZ: 'KZT', GE: 'GEL', AM: 'AMD', AZ: 'AZN', MA: 'MAD', ZA: 'ZAR', TN: 'TND', DZ: 'DZD', BO: 'BOB', PY: 'PYG',
  MK: 'MKD', BA: 'BAM', DO: 'DOP', BR: 'BRL', AR: 'ARS', MX: 'MXN', CL: 'CLP', PE: 'PEN', GT: 'GTQ', PL: 'PLN',
  RO: 'RON', HU: 'HUF', CZ: 'CZK', SK: 'EUR', HR: 'EUR', RS: 'RSD', AL: 'ALL', MD: 'MDL', BG: 'EUR', LT: 'EUR',
  LV: 'EUR', JO: 'JOD',
});

let staleWarned = false;

function estimateCurrencies() {
  return [...new Set(Object.values(COUNTRY_CURRENCY))].sort();
}

// {asOf: "2026-11-05", base: "USD", rates: {INR: 88.12, ...}}; anything else reads as no table.
function normalizeRateTable(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const asOf = String(raw.asOf || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(Date.parse(`${asOf}T00:00:00Z`))) return null;
  if (raw.base !== 'USD' || !raw.rates || typeof raw.rates !== 'object') return null;
  const rates = {};
  for (const [code, rate] of Object.entries(raw.rates)) {
    if (CURRENCY_PATTERN.test(code) && typeof rate === 'number' && Number.isFinite(rate) && rate > 0) rates[code] = rate;
  }
  return { asOf, base: 'USD', rates };
}

// A static require, so the deployment bundles the table with the function.
function loadExchangeRates() {
  try {
    return normalizeRateTable(require('../../data/exchange-rates.json'));
  } catch {
    return null;
  }
}

function rateAgeDays(asOf, today) {
  return Math.floor((today - Date.parse(`${asOf}T00:00:00Z`)) / DAY_MS);
}

// null when the country pays in US dollars or is unknown, when the table lacks its currency,
// or when the table is older than MAX_RATE_AGE_DAYS.
function resolveLocalEstimate(countryCode, { table = loadExchangeRates(), today = Date.now() } = {}) {
  const currency = COUNTRY_CURRENCY[String(countryCode || '').trim().toUpperCase()];
  if (!currency || !table) return null;
  const age = rateAgeDays(table.asOf, today);
  if (!Number.isFinite(age) || age > MAX_RATE_AGE_DAYS) {
    if (!staleWarned) {
      staleWarned = true;
      console.warn(`[billing] exchange-rates.json is dated ${table.asOf}; no local estimates until \`npm run update:exchange-rates\``);
    }
    return null;
  }
  const rate = table.rates[currency];
  if (!rate) return null;
  return { currency, rate, asOf: table.asOf };
}

module.exports = {
  COUNTRY_CURRENCY,
  MAX_RATE_AGE_DAYS,
  estimateCurrencies,
  normalizeRateTable,
  loadExchangeRates,
  resolveLocalEstimate,
};
