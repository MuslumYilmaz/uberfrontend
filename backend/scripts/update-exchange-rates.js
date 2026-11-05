#!/usr/bin/env node
// Refreshes data/exchange-rates.json, the dated table behind the pricing page's local-currency
// estimates (services/billing/local-currency.js). Source: the open endpoint of
// exchangerate-api.com, daily rates against the US dollar, free with attribution (the pricing
// page links the provider). Run from backend/: `npm run update:exchange-rates`, then commit the
// file. Estimates stop after MAX_RATE_AGE_DAYS without a refresh.

const fs = require('node:fs');
const path = require('node:path');
const { estimateCurrencies } = require('../services/billing/local-currency');

const SOURCE = 'https://open.er-api.com/v6/latest/USD';
const RATES_FILE = path.join(__dirname, '..', 'data', 'exchange-rates.json');

async function main() {
  const response = await fetch(SOURCE, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${SOURCE} answered ${response.status}`);
  const body = await response.json();
  if (body?.result !== 'success' || body.base_code !== 'USD' || !body.rates || typeof body.rates !== 'object') {
    throw new Error('unexpected response shape');
  }
  const updated = Number(body.time_last_update_unix);
  if (!Number.isFinite(updated) || updated <= 0) throw new Error('missing update time');
  const asOf = new Date(updated * 1000).toISOString().slice(0, 10);

  const rates = {};
  const missing = [];
  for (const code of estimateCurrencies()) {
    const rate = body.rates[code];
    if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) rates[code] = Number(rate.toFixed(4));
    else missing.push(code);
  }
  if (missing.length) throw new Error(`no rate for ${missing.join(', ')}`);

  const table = {
    source: 'https://www.exchangerate-api.com',
    terms: 'https://www.exchangerate-api.com/terms',
    asOf,
    base: 'USD',
    rates,
  };
  fs.mkdirSync(path.dirname(RATES_FILE), { recursive: true });
  fs.writeFileSync(RATES_FILE, `${JSON.stringify(table, null, 2)}\n`);
  console.log(`[exchange-rates] ${Object.keys(rates).length} rates as of ${asOf} written to ${path.relative(process.cwd(), RATES_FILE)}`);
}

main().catch((error) => {
  console.error(`[exchange-rates] ${error.message}`);
  process.exit(1);
});
