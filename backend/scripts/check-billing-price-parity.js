require('dotenv').config();

const {
  checkLemonSqueezyPriceParity,
  checkPolarPriceParity,
} = require('../services/billing/price-parity');
const {
  resolveCheckoutConfig,
} = require('../services/billing/checkout-start');
const {
  resolveLemonSqueezyApiKey,
} = require('../services/billing/providers/lemonsqueezy-orders');
const { resolvePolarAccessToken } = require('../services/billing/providers/polar-config');

async function main() {
  const config = resolveCheckoutConfig();
  if (config.provider !== 'lemonsqueezy' && config.provider !== 'polar') {
    throw new Error('The configured checkout provider has no price parity check');
  }
  if (!config.enabled) {
    throw new Error(`No ${config.provider} checkout plans are enabled in ${config.mode} mode`);
  }

  const report = config.provider === 'polar'
    ? await checkPolarPriceParity({
      accessToken: resolvePolarAccessToken(config.mode),
      mode: config.mode,
      enabledPlans: config.plans,
    })
    : await checkLemonSqueezyPriceParity({
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
