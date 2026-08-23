require('dotenv').config();

const { connectToMongo, disconnectMongo, resolveMongoConnectionConfig } = require('../config/mongo');
const BillingEvent = require('../models/BillingEvent');
const CheckoutAttempt = require('../models/CheckoutAttempt');
const User = require('../models/User');
const {
  findProviderOrderMismatches,
  findVerifiedPurchaseEntitlementMismatches,
} = require('../services/billing/reconciliation');
const {
  fetchRecentLemonSqueezyOrders,
  resolveLemonSqueezyApiKey,
} = require('../services/billing/providers/lemonsqueezy-orders');

async function main() {
  const mongoConfig = resolveMongoConnectionConfig();
  if (mongoConfig.target !== 'test') {
    throw new Error('Refusing reconciliation CLI against production; set MONGO_TARGET=test and MONGO_URL_TEST');
  }
  await connectToMongo(mongoConfig.uri);
  const report = await findVerifiedPurchaseEntitlementMismatches({
    CheckoutAttempt,
    User,
    BillingEvent,
    mode: process.env.PAYMENTS_MODE === 'live' ? 'live' : 'test',
    lookbackDays: process.env.BILLING_RECONCILIATION_LOOKBACK_DAYS,
    graceMinutes: process.env.BILLING_RECONCILIATION_GRACE_MINUTES,
  });
  let providerOrders = { status: 'not_configured' };
  const providerApiKey = resolveLemonSqueezyApiKey(report.mode);
  if (providerApiKey && process.env.LEMONSQUEEZY_STORE_ID) {
    const fetched = await fetchRecentLemonSqueezyOrders({
      apiKey: providerApiKey,
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
      mode: report.mode,
      createdAfter: report.window.verifiedAfter,
      createdBefore: report.window.verifiedBefore,
    });
    const reconciliation = await findProviderOrderMismatches({
      CheckoutAttempt,
      User,
      orders: fetched.orders,
      mode: report.mode,
    });
    providerOrders = {
      status: 'checked',
      pagesFetched: fetched.pagesFetched,
      truncated: fetched.truncated,
      ...reconciliation,
    };
  }
  report.providerOrders = providerOrders;
  console.log(JSON.stringify(report, null, 2));
  if (
    report.summary.mismatches > 0
    || providerOrders.summary?.mismatches > 0
    || providerOrders.truncated === true
  ) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`[billing-reconciliation] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
