#!/usr/bin/env node
// Read-only billing attribution report: checkout attempts joined to verified
// payments and refund events, grouped by week, plan, offer version, campaign,
// analytics source, landing path and country.
//
//   node scripts/report-billing-attribution.js [--since=YYYY-MM-DD] [--until=YYYY-MM-DD]
//                                              [--mode=live|test] [--top=20] [--json]
//                                              [--allow-production]
//
// The default MongoDB target follows config/mongo.js. A non-test target is
// refused unless --allow-production is passed; the script never writes.
require('dotenv').config({ quiet: true });

const { connectToMongo, disconnectMongo, resolveMongoConnectionConfig } = require('../config/mongo');
const BillingEvent = require('../models/BillingEvent');
const CheckoutAttempt = require('../models/CheckoutAttempt');
const {
  TERMINAL_EVENT_PATTERN,
  buildAttributionReport,
  formatAttributionReport,
} = require('../services/billing/attribution-report');

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK_DAYS = 90;

function parseArgs(argv) {
  const args = { json: false, allowProduction: false, help: false };
  for (const entry of argv) {
    if (entry === '--json') args.json = true;
    else if (entry === '--allow-production') args.allowProduction = true;
    else if (entry === '--help' || entry === '-h') args.help = true;
    else if (entry.startsWith('--since=')) args.since = entry.slice('--since='.length);
    else if (entry.startsWith('--until=')) args.until = entry.slice('--until='.length);
    else if (entry.startsWith('--mode=')) args.mode = entry.slice('--mode='.length);
    else if (entry.startsWith('--top=')) args.top = entry.slice('--top='.length);
    else throw new Error(`Unknown argument: ${entry}`);
  }
  return args;
}

function parseDate(value, name) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`${name} must be a valid date, received "${value}"`);
  return date;
}

function usage() {
  return [
    'Usage: node scripts/report-billing-attribution.js [options]',
    '  --since=YYYY-MM-DD      start of the attempt window (default: 90 days ago)',
    '  --until=YYYY-MM-DD      end of the attempt window (default: now)',
    '  --mode=live|test        payments mode to report (default: live)',
    '  --top=N                 rows kept per limited dimension (default: 20)',
    '  --json                  print the raw report as JSON',
    '  --allow-production      permit a non-test MongoDB target (read-only)',
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const mongoConfig = resolveMongoConnectionConfig();
  if (mongoConfig.target !== 'test' && !args.allowProduction) {
    throw new Error(
      'Refusing to read a non-test MongoDB target; pass --allow-production to run this read-only report against production'
    );
  }

  const now = new Date();
  const since = args.since ? parseDate(args.since, '--since') : new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS);
  const until = args.until ? parseDate(args.until, '--until') : now;
  if (since.getTime() > until.getTime()) throw new Error('--since must not be after --until');
  const mode = args.mode === 'test' ? 'test' : 'live';

  // config/mongo.js prints connection diagnostics with console.log; keep stdout
  // clean when the caller asked for JSON so the output stays pipeable.
  const originalLog = console.log;
  if (args.json) console.log = (...rest) => console.error(...rest);
  try {
    await connectToMongo(mongoConfig.uri);
  } finally {
    console.log = originalLog;
  }

  const attempts = await CheckoutAttempt.find({
    mode,
    startedAt: { $gte: since, $lte: until },
  })
    .select(
      'userId planId offerVersion campaignId analyticsSource landingPath countryCode startedAt createdAt paymentVerifiedAt paymentTotalCents paymentCurrency'
    )
    .lean();

  const userIds = Array.from(new Set(attempts.map((attempt) => String(attempt.userId || '')).filter(Boolean)));
  const terminalEvents = userIds.length
    ? await BillingEvent.find({
      userId: { $in: userIds },
      eventType: { $regex: TERMINAL_EVENT_PATTERN },
      receivedAt: { $gte: since },
    })
      .select('eventId eventType userId receivedAt')
      .lean()
    : [];

  const report = buildAttributionReport({ attempts, terminalEvents, now, top: args.top });
  report.window = { since, until, mode, target: mongoConfig.target };
  console.log(args.json ? JSON.stringify(report, null, 2) : formatAttributionReport(report));
}

main()
  .catch((error) => {
    console.error(`[billing-attribution] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
