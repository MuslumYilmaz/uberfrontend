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
const { fetchRecentPolarOrders } = require('../services/billing/providers/polar-orders');
const { resolvePolarAccessToken } = require('../services/billing/providers/polar-config');

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
  // Every provider with read credentials is reconciled; the others are reported as not configured.
  const providerOrders = {};
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
      provider: 'lemonsqueezy',
    });
    providerOrders.lemonsqueezy = {
      status: 'checked',
      pagesFetched: fetched.pagesFetched,
      truncated: fetched.truncated,
      ...reconciliation,
    };
  } else {
    providerOrders.lemonsqueezy = { status: 'not_configured' };
  }
  const polarToken = resolvePolarAccessToken(report.mode);
  if (polarToken) {
    const fetched = await fetchRecentPolarOrders({
      accessToken: polarToken,
      mode: report.mode,
      createdAfter: report.window.verifiedAfter,
      createdBefore: report.window.verifiedBefore,
    });
    const reconciliation = await findProviderOrderMismatches({
      CheckoutAttempt,
      User,
      orders: fetched.orders,
      mode: report.mode,
      provider: 'polar',
    });
    providerOrders.polar = {
      status: 'checked',
      pagesFetched: fetched.pagesFetched,
      truncated: fetched.truncated,
      ...reconciliation,
    };
  } else {
    providerOrders.polar = { status: 'not_configured' };
  }
  report.providerOrders = providerOrders;
  console.log(JSON.stringify(report, null, 2));
  const providerProblems = Object.values(providerOrders)
    .some((entry) => entry.summary?.mismatches > 0 || entry.truncated === true);
  if (report.summary.mismatches > 0 || providerProblems) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`[billing-reconciliation] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
