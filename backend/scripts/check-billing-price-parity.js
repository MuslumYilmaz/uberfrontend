require('dotenv').config();

const {
  checkLemonSqueezyPriceParity,
} = require('../services/billing/price-parity');
const {
  resolveCheckoutConfig,
} = require('../services/billing/checkout-start');
const {
  resolveLemonSqueezyApiKey,
} = require('../services/billing/providers/lemonsqueezy-orders');

async function main() {
  const config = resolveCheckoutConfig();
  if (config.provider !== 'lemonsqueezy') {
    throw new Error('The configured checkout provider is not LemonSqueezy');
  }
  if (!config.enabled) {
    throw new Error(`No LemonSqueezy checkout plans are enabled in ${config.mode} mode`);
  }

  const report = await checkLemonSqueezyPriceParity({
    apiKey: resolveLemonSqueezyApiKey(config.mode),
    mode: config.mode,
    enabledPlans: config.plans,
  });
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[billing-price-parity] ${error.message}`);
  process.exitCode = 1;
});
