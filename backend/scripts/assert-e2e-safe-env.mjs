import 'dotenv/config';

const REQUIRED_EXACT = {
  NODE_ENV: 'test',
  MONGO_TARGET: 'test',
  EXPECTED_MONGO_DB_NAME_TEST: 'frontendatlas_ci',
  PAYMENTS_MODE: 'test',
  BILLING_PROVIDER: 'lemonsqueezy',
};

const SAFE_DB_NAME = 'frontendatlas_ci';
const REJECTED_DB_NAMES = new Set([
  'frontendatlas',
  'frontendatlas_prod',
  'frontendatlas-production',
  'frontendatlasproduction',
  'myapp',
  'prod',
  'production',
  'live',
]);

const REJECTED_ENV_NAMES = [
  'MONGO_URL',
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
  'LEMONSQUEEZY_WEBHOOK_SECRET_LIVE',
  'LEMONSQUEEZY_MONTHLY_URL_LIVE',
  'LEMONSQUEEZY_QUARTERLY_URL_LIVE',
  'LEMONSQUEEZY_ANNUAL_URL_LIVE',
  'LEMONSQUEEZY_LIFETIME_URL_LIVE',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_MONTHLY_URL',
  'STRIPE_QUARTERLY_URL',
  'STRIPE_ANNUAL_URL',
  'STRIPE_LIFETIME_URL',
  'GUMROAD_WEBHOOK_SECRET',
];

function valueOf(name) {
  return String(process.env[name] || '').trim();
}

function addFailure(failures, message) {
  failures.push(`- ${message}`);
}

function parseMongoDbName(uri) {
  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
    return dbName.trim();
  } catch {
    return '';
  }
}

function parseMongoHost(uri) {
  try {
    return new URL(uri).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isLocalMongoHost(host) {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

function assertSafeEnvironment() {
  const failures = [];

  for (const [name, expected] of Object.entries(REQUIRED_EXACT)) {
    const actual = valueOf(name);
    if (actual !== expected) {
      addFailure(failures, `${name} must be "${expected}" for full-stack E2E (got "${actual || '(empty)'}").`);
    }
  }

  const mongoUrlTest = valueOf('MONGO_URL_TEST');
  if (!mongoUrlTest) {
    addFailure(failures, 'MONGO_URL_TEST is required and must point at the isolated CI database.');
  } else {
    const dbName = parseMongoDbName(mongoUrlTest);
    const host = parseMongoHost(mongoUrlTest);

    if (dbName !== SAFE_DB_NAME) {
      addFailure(failures, `MONGO_URL_TEST database must be "${SAFE_DB_NAME}" (got "${dbName || '(empty)'}").`);
    }

    if (REJECTED_DB_NAMES.has(dbName.toLowerCase())) {
      addFailure(failures, `MONGO_URL_TEST database "${dbName}" is not allowed for E2E.`);
    }

    if (!isLocalMongoHost(host)) {
      addFailure(failures, `MONGO_URL_TEST host must be local CI MongoDB (got "${host || '(empty)'}").`);
    }
  }

  const monthlyTestUrl = valueOf('LEMONSQUEEZY_MONTHLY_URL_TEST');
  if (monthlyTestUrl !== 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly') {
    addFailure(
      failures,
      'LEMONSQUEEZY_MONTHLY_URL_TEST must be the non-billable E2E placeholder buy link.'
    );
  }

  for (const name of REJECTED_ENV_NAMES) {
    if (valueOf(name)) {
      addFailure(failures, `${name} must not be set for full-stack E2E.`);
    }
  }

  if (failures.length) {
    console.error('[assert-e2e-safe-env] Refusing to start unsafe E2E backend environment:');
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log('[assert-e2e-safe-env] E2E backend environment is isolated and safe.');
}

assertSafeEnvironment();
