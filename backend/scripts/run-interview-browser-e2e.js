'use strict';

/**
 * Owns the complete local Interview browser-E2E environment:
 * ephemeral MongoMemoryReplSet, production Angular static output, Express with
 * NODE_ENV=production, and one Playwright project. It refuses non-memory/
 * non-local Mongo and never reads the machine's normal frontendatlas database.
 */

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const REPO_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_ROOT = path.join(REPO_ROOT, 'frontend');
const DB_NAME = 'interview_browser_e2e';
const API_PORT = 3001;
const WEB_PORT = 4237;
const WEB_ORIGIN = `http://127.0.0.1:${WEB_PORT}`;
const API_ORIGIN = `http://127.0.0.1:${API_PORT}`;
const JWT_SECRET = 'interview_browser_e2e_jwt_secret_48_chars_minimum';
const BROWSER = String(process.env.E2E_INTERVIEW_BROWSER || 'chromium').trim().toLowerCase();
const SUPPORTED_BROWSERS = new Set(['chromium', 'firefox', 'webkit']);

let frontendBuildChild = null;
let playwrightChild = null;
let expressServer = null;
let staticServer = null;
let productionBuildRoot = null;
let mongoServer = null;
let disconnectMongo = null;
let cleanupPromise = null;
const originalFetch = global.fetch;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEphemeralMongoUri(uri) {
  const parsed = new URL(uri);
  assert(
    parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost',
    `Refusing non-local MongoDB host: ${parsed.hostname || '(empty)'}`
  );
  const dbName = parsed.pathname.replace(/^\/+/, '').split('/')[0];
  assert(dbName === DB_NAME, `Refusing unexpected MongoDB database: ${dbName || '(empty)'}`);
  assert(!/frontendatlas/i.test(dbName), 'Refusing any frontendatlas database name');
}

function configureEnvironment(mongoUri) {
  assertEphemeralMongoUri(mongoUri);
  assert(SUPPORTED_BROWSERS.has(BROWSER), `Unsupported browser project: ${BROWSER || '(empty)'}`);
  Object.assign(process.env, {
    API_RATE_LIMIT_MAX: '1000000',
    COOKIE_SAMESITE: 'lax',
    COOKIE_SECURE: 'false',
    EXPECTED_MONGO_DB_NAME_TEST: DB_NAME,
    FRONTEND_BASE: WEB_ORIGIN,
    FRONTEND_ORIGIN: WEB_ORIGIN,
    FRONTEND_ORIGINS: WEB_ORIGIN,
    // Empty overrides prevent dotenv or the parent shell from selecting a
    // preview artifact. Production must exercise the canonical backend paths.
    INTERVIEW_ALLOW_CANDIDATE_BANK: 'false',
    INTERVIEW_BANK_PRIVATE_PATH: '',
    INTERVIEW_BANK_PUBLIC_PATH: '',
    INTERVIEW_BANK_RELEASE_PATH: '',
    INTERVIEW_CODING_PRIVATE_PATH: '',
    INTERVIEW_CODING_PUBLIC_PATH: '',
    INTERVIEW_CODING_RELEASE_PATH: '',
    INTERVIEW_CREATE_IP_RATE_LIMIT_MAX: '1000000',
    INTERVIEW_CREATE_USER_RATE_LIMIT_MAX: '1000',
    INTERVIEW_MODE_ACCESS: 'public',
    INTERVIEW_MONITORING_READY: 'true',
    INTERVIEW_NATIVE_SAFARI_READY: 'true',
    INTERVIEW_OPERATIONAL_STATE: 'normal',
    INTERVIEW_SYSTEM_DESIGN_ACCESS: 'off',
    INTERVIEW_TELEMETRY_ENABLED: 'false',
    JWT_SECRET,
    MONGO_TARGET: 'test',
    // Keep dotenv from hydrating any machine-local production connection or
    // SMTP credentials into this child process.
    MONGO_URL: '',
    MONGO_URL_TEST: mongoUri,
    NODE_ENV: 'production',
    PORT: String(API_PORT),
    RATE_LIMIT_NAMESPACE: `interview-browser-e2e-${process.pid}`,
    RATE_LIMIT_REDIS_TIMEOUT_MS: '1500',
    RATE_LIMIT_STORE: 'redis',
    SENTRY_ENABLED: 'false',
    SERVER_BASE: API_ORIGIN,
    SMTP_PASS: '',
    SMTP_USER: '',
    UPSTASH_REDIS_REST_TOKEN: 'ephemeral-test-token',
    UPSTASH_REDIS_REST_URL: 'https://redis.interview.invalid',
  });
}

function installHealthyRedisStub() {
  // Browser contract fixture only: this proves production launch/readiness and
  // request wiring without external network access. The separate staging CLI
  // remains the authority for real multi-instance Upstash behavior.
  global.fetch = async (url, options) => {
    if (!String(url).startsWith('https://redis.interview.invalid')) {
      return originalFetch(url, options);
    }
    let payload = [];
    try {
      payload = JSON.parse(String(options?.body || '[]'));
    } catch {
      payload = [];
    }
    const result = Array.isArray(payload)
      ? payload.map((command) => {
        const name = String(command?.[0] || '').toUpperCase();
        if (name === 'EVAL') {
          const ttlSeconds = Number(command.at(-1));
          return { result: [1, Number.isSafeInteger(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 30] };
        }
        if (name === 'PING') return { result: 'PONG' };
        return { result: 1 };
      })
      : [];
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

function executable(root, name) {
  return path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
}

function pipeOutput(child, prefix) {
  child.stdout?.on('data', (chunk) => process.stdout.write(`[${prefix}] ${chunk}`));
  child.stderr?.on('data', (chunk) => process.stderr.write(`[${prefix}] ${chunk}`));
}

function requestStatus(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode || 0);
    });
    req.setTimeout(1_000, () => req.destroy());
    req.on('error', () => resolve(0));
  });
}

async function waitForHttp(url, child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) {
      throw new Error(`Child process exited before ${url} became ready (code ${child.exitCode})`);
    }
    const status = await requestStatus(url);
    if (status >= 200 && status < 500) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function waitForExit(child) {
  if (!child || child.exitCode !== null) return Promise.resolve(child?.exitCode ?? 0);
  return new Promise((resolve) => child.once('exit', (code) => resolve(code ?? 1)));
}

async function runOwnedCommand(command, args, { cwd, env, prefix }) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  frontendBuildChild = child;
  pipeOutput(child, prefix);
  const code = await waitForExit(child);
  frontendBuildChild = null;
  if (code !== 0) throw new Error(`${prefix} exited with code ${code}`);
}

async function stopOwnedChild(child) {
  if (!child || child.exitCode !== null || child.killed) return;
  const exited = waitForExit(child);
  child.kill('SIGTERM');
  const result = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (!result && child.exitCode === null) {
    child.kill('SIGKILL');
    await waitForExit(child);
  }
}

async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    await stopOwnedChild(playwrightChild);
    await stopOwnedChild(frontendBuildChild);
    if (staticServer) {
      await staticServer.close();
      staticServer = null;
    }
    if (productionBuildRoot) {
      const tempPrefix = path.join(os.tmpdir(), 'frontendatlas-interview-e2e-');
      assert(
        path.resolve(productionBuildRoot).startsWith(path.resolve(tempPrefix)),
        `Refusing to remove unexpected build directory: ${productionBuildRoot}`
      );
      fs.rmSync(productionBuildRoot, { recursive: true, force: true });
      productionBuildRoot = null;
    }
    if (expressServer) {
      await new Promise((resolve) => expressServer.close(resolve));
      expressServer = null;
    }
    if (disconnectMongo) await disconnectMongo();
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
    global.fetch = originalFetch;
  })();
  return cleanupPromise;
}

async function main() {
  try {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const mongoUri = mongoServer.getUri(DB_NAME);
    configureEnvironment(mongoUri);
    installHealthyRedisStub();

    const app = require('../index');
    const mongo = require('../config/mongo');
    const { interviewModeAccessMode } = require('../services/interview/config');
    const { loadInterviewArtifacts } = require('../services/interview/artifacts');
    assert(
      process.env.INTERVIEW_MODE_ACCESS === 'public',
      `Interview access env changed unexpectedly: ${process.env.INTERVIEW_MODE_ACCESS || '(empty)'}`
    );
    assert(
      process.env.INTERVIEW_SYSTEM_DESIGN_ACCESS === 'off',
      `System Design access env changed unexpectedly: ${process.env.INTERVIEW_SYSTEM_DESIGN_ACCESS || '(empty)'}`
    );
    assert(
      interviewModeAccessMode() === 'public',
      `Loaded Interview config is not public: ${interviewModeAccessMode()}`
    );
    assert(
      process.env.NODE_ENV === 'production',
      `Backend runtime is not production: ${process.env.NODE_ENV || '(empty)'}`
    );
    const artifacts = loadInterviewArtifacts({ force: true, allowInternalCandidate: false });
    assert(
      artifacts.bank.status === 'editorial-gold' && artifacts.bank.version === '1.3.0',
      `Canonical MCQ artifact is not editorial-gold v1.3.0: ${artifacts.bank.status} ${artifacts.bank.version}`
    );
    assert(
      artifacts.coding.status === 'editorial-gold' && artifacts.coding.version === '1.1.0',
      `Canonical coding artifact is not editorial-gold v1.1.0: ${artifacts.coding.status} ${artifacts.coding.version}`
    );
    disconnectMongo = mongo.disconnectMongo;
    await mongo.connectToMongo(mongoUri);

    await new Promise((resolve, reject) => {
      expressServer = app.listen(API_PORT, '127.0.0.1', resolve);
      expressServer.once('error', reject);
    });
    expressServer.prependListener('request', (request) => {
      if (String(request.url || '').startsWith('/api/interviews/availability')) {
        process.stdout.write(
          `[interview-browser-e2e] availability host=${request.headers.host || '(none)'}`
          + ` access=${interviewModeAccessMode()}\n`
        );
      }
    });
    process.stdout.write(`[interview-browser-e2e] Express ready at ${API_ORIGIN}; MongoDB=${DB_NAME}\n`);

    productionBuildRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'frontendatlas-interview-e2e-')
    );
    await runOwnedCommand(
      executable(FRONTEND_ROOT, 'ng'),
      [
        'build',
        '--configuration', 'production',
        '--output-path', productionBuildRoot,
      ],
      { cwd: FRONTEND_ROOT, env: process.env, prefix: 'angular-production-build' }
    );
    const staticServerModule = pathToFileURL(
      path.join(FRONTEND_ROOT, 'scripts/seo-static-server.mjs')
    ).href;
    const { startSeoStaticServer } = await import(staticServerModule);
    staticServer = await startSeoStaticServer({
      buildDir: path.join(productionBuildRoot, 'browser'),
      host: '127.0.0.1',
      port: WEB_PORT,
      logPrefix: '[interview-browser-e2e:static]',
    });
    await waitForHttp(`${WEB_ORIGIN}/interview`, null);
    process.stdout.write(
      `[interview-browser-e2e] Production Angular output ready at ${WEB_ORIGIN}\n`
    );

    playwrightChild = spawn(
      executable(FRONTEND_ROOT, 'playwright'),
      [
        'test',
        'e2e/interview-mode.fullstack.spec.ts',
        `--project=${BROWSER}`,
        '--workers=1',
        '--retries=0',
        '--trace=retain-on-failure',
        '--reporter=list',
      ],
      {
        cwd: FRONTEND_ROOT,
        env: {
          ...process.env,
          CI: '1',
          E2E_INTERVIEW_FULLSTACK: '1',
          E2E_INTERVIEW_API_BASE: API_ORIGIN,
          PLAYWRIGHT_BASE_URL: WEB_ORIGIN,
          PLAYWRIGHT_ENABLE_FIREFOX: BROWSER === 'firefox' ? '1' : '0',
          PLAYWRIGHT_ENABLE_WEBKIT: BROWSER === 'webkit' ? '1' : '0',
          PLAYWRIGHT_WEB_SERVER: '0',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    pipeOutput(playwrightChild, 'playwright');
    const code = await waitForExit(playwrightChild);
    playwrightChild = null;
    if (code !== 0) {
      throw new Error(`Playwright Interview full-stack E2E (${BROWSER}) exited with code ${code}`);
    }
  } finally {
    await cleanup();
  }
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    cleanup()
      .finally(() => process.exit(signal === 'SIGINT' ? 130 : 1));
  });
}

main().catch((error) => {
  process.stderr.write(`[interview-browser-e2e] ${error.stack || error}\n`);
  process.exitCode = 1;
});
