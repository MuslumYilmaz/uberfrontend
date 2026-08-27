'use strict';

/**
 * Interview Mock API full-stack correctness and micro-benchmark harness.
 *
 * The harness intentionally owns an ephemeral MongoMemoryReplSet and refuses
 * any non-memory MongoDB URI. It exercises the bound Express HTTP server,
 * cookie auth + CSRF, Interview routes, and persistence without request
 * interception. It is not an Angular/browser E2E test and does not define an
 * SLO; latency output is evidence for release review, not a pass threshold.
 */

const crypto = require('crypto');
const http = require('http');
const jwt = require('jsonwebtoken');
const { monitorEventLoopDelay, performance } = require('perf_hooks');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const DB_NAME = 'interview_fullstack_perf';
const JWT_SECRET = 'interview_fullstack_perf_jwt_secret_48_chars_minimum';
const CONCURRENCY_LEVELS = [1, 10, 25];
const MIN_SAMPLES = boundedInteger(
  process.env.INTERVIEW_PERF_MIN_SAMPLES,
  30,
  { min: 25, max: 200 }
);

let httpAgent;

function boundedInteger(value, fallback, { min, max }) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function assert(condition, message, details = undefined) {
  if (condition) return;
  const error = new Error(message);
  if (details !== undefined) error.details = details;
  throw error;
}

function authHeader(userId) {
  return `Bearer ${jwt.sign(
    { sub: String(userId), role: 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  )}`;
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { unparsedBody: text };
  }
}

function httpJson({ port, method = 'GET', path, headers = {}, body }) {
  const payload = body === undefined ? null : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const requestStartedAt = performance.now();
    const req = http.request({
      agent: httpAgent,
      hostname: '127.0.0.1',
      port,
      method,
      path,
      headers: {
        accept: 'application/json',
        ...(payload === null ? {} : {
          'content-length': Buffer.byteLength(payload),
          'content-type': 'application/json',
        }),
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const durationMs = performance.now() - requestStartedAt;
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          body: parseJson(text),
          durationMs,
          headers: res.headers,
          status: res.statusCode,
        });
      });
    });
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

function cookieValue(setCookie, name) {
  const lines = Array.isArray(setCookie) ? setCookie : [setCookie].filter(Boolean);
  const prefix = `${name}=`;
  const line = lines.find((entry) => String(entry).startsWith(prefix));
  if (!line) return null;
  return String(line).slice(prefix.length).split(';')[0];
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function percentile(sorted, fraction) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1);
  return sorted[index];
}

function summarizeDurations(durations, elapsedMs, errors, eventLoop) {
  const sorted = [...durations].sort((left, right) => left - right);
  const nanosecondsToMs = (value) => Number.isFinite(value) ? value / 1e6 : 0;
  return {
    samples: sorted.length,
    errors,
    errorRate: sorted.length ? round(errors / sorted.length, 4) : 0,
    throughputPerSecond: elapsedMs > 0 ? round(sorted.length / (elapsedMs / 1000)) : 0,
    latencyMs: {
      min: round(sorted[0] || 0),
      p50: round(percentile(sorted, 0.5)),
      p95: round(percentile(sorted, 0.95)),
      p99: round(percentile(sorted, 0.99)),
      max: round(sorted[sorted.length - 1] || 0),
    },
    eventLoopDelayMs: {
      mean: round(nanosecondsToMs(eventLoop.mean)),
      p95: round(nanosecondsToMs(eventLoop.percentile(95))),
      p99: round(nanosecondsToMs(eventLoop.percentile(99))),
      max: round(nanosecondsToMs(eventLoop.max)),
    },
  };
}

async function runConcurrent({ concurrency, count, operation, isSuccess }) {
  const durations = new Array(count);
  let errors = 0;
  let nextIndex = 0;
  const eventLoop = monitorEventLoopDelay({ resolution: 10 });
  eventLoop.enable();
  const startedAt = performance.now();

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= count) return;
      const response = await operation(index);
      durations[index] = response.durationMs;
      if (!isSuccess(response, index)) errors += 1;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, count) }, worker));
  const elapsedMs = performance.now() - startedAt;
  eventLoop.disable();
  return summarizeDurations(durations, elapsedMs, errors, eventLoop);
}

function configureEnvironment(mongoUri) {
  assert(
    /^mongodb:\/\/127\.0\.0\.1:\d+\//.test(mongoUri)
      || /^mongodb:\/\/localhost:\d+\//.test(mongoUri),
    'Refusing to run against a non-local MongoDB URI'
  );
  assert(mongoUri.includes(`/${DB_NAME}`), 'Ephemeral MongoDB URI has the wrong database');

  for (const name of [
    'INTERVIEW_BANK_PRIVATE_PATH',
    'INTERVIEW_BANK_PUBLIC_PATH',
    'INTERVIEW_BANK_RELEASE_PATH',
    'INTERVIEW_CODING_PRIVATE_PATH',
    'INTERVIEW_CODING_PUBLIC_PATH',
    'INTERVIEW_CODING_RELEASE_PATH',
  ]) delete process.env[name];

  Object.assign(process.env, {
    API_RATE_LIMIT_MAX: '1000000',
    EXPECTED_MONGO_DB_NAME_TEST: DB_NAME,
    INTERVIEW_ALLOW_CANDIDATE_BANK: 'false',
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
    MONGO_URL_TEST: mongoUri,
    NODE_ENV: 'production',
    RATE_LIMIT_NAMESPACE: `interview-fullstack-perf-${process.pid}`,
    RATE_LIMIT_STORE: 'redis',
    REQUEST_METRICS_ENABLED: 'false',
    SENTRY_ENABLED: 'false',
    UPSTASH_REDIS_REST_TOKEN: 'ephemeral-test-token',
    UPSTASH_REDIS_REST_URL: 'https://redis.interview.invalid',
  });
}

function installHealthyRedisStub() {
  global.fetch = async (_url, options) => {
    const commands = parseJson(String(options?.body || '[]'));
    return {
      ok: true,
      status: 200,
      json: async () => (Array.isArray(commands) ? commands : []).map((command) => {
        if (String(command?.[0] || '').toUpperCase() === 'EVAL') {
          const ttlSeconds = Number(command.at(-1));
          return {
            result: [
              1,
              Number.isSafeInteger(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 30,
            ],
          };
        }
        return { result: 1 };
      }),
    };
  };
}

async function createPremiumUsers(User, label, count) {
  const nonce = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const users = await User.insertMany(Array.from({ length: count }, (_, index) => ({
    email: `${label}_${nonce}_${index}@example.com`,
    username: `${label}_${nonce}_${index}`,
    passwordHash: 'benchmark-only-hash',
    role: 'user',
    accessTier: 'free',
    entitlements: {
      pro: {
        status: 'active',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  })));
  return users.map((user) => ({
    auth: authHeader(user._id),
    user,
  }));
}

async function verifyCookieLifecycle({ port, User }) {
  const signup = await httpJson({
    port,
    method: 'POST',
    path: '/api/auth/signup',
    body: {
      email: 'interview-fullstack-cookie@example.com',
      username: 'interview_fullstack_cookie',
      password: 'safePassword123',
    },
  });
  assert(signup.status === 201, 'Cookie-auth signup failed', signup);

  const accessToken = cookieValue(signup.headers['set-cookie'], 'access_token');
  const csrfToken = cookieValue(signup.headers['set-cookie'], 'csrf_token');
  assert(accessToken && csrfToken, 'Signup did not establish access + CSRF cookies');
  await User.updateOne(
    { email: 'interview-fullstack-cookie@example.com' },
    {
      $set: {
        'entitlements.pro.status': 'active',
        'entitlements.pro.validUntil': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }
  );

  const cookie = `access_token=${accessToken}; csrf_token=${csrfToken}`;
  const readHeaders = { cookie };
  const mutationHeaders = { cookie, 'x-csrf-token': csrfToken };
  const createBody = {
    format: 'coding',
    level: 'mid',
    track: 'react',
    timingMode: 'standard',
    viewportWidth: 1366,
  };

  const availability = await httpJson({
    port,
    path: '/api/interviews/availability',
    headers: readHeaders,
  });
  assert(availability.status === 200, 'Availability failed', availability);

  const missingCsrf = await httpJson({
    port,
    method: 'POST',
    path: '/api/interviews',
    headers: { cookie, 'idempotency-key': 'fullstack-csrf-missing-0001' },
    body: createBody,
  });
  assert(
    missingCsrf.status === 403 && missingCsrf.body?.code === 'AUTH_CSRF_INVALID',
    'Interview create did not enforce CSRF',
    missingCsrf
  );

  const createHeaders = {
    ...mutationHeaders,
    'idempotency-key': 'fullstack-cookie-create-0001',
  };
  const created = await httpJson({
    port,
    method: 'POST',
    path: '/api/interviews',
    headers: createHeaders,
    body: createBody,
  });
  assert(created.status === 201, 'Interview create failed', created);
  assert(created.body?.session?.questions?.length === 5, 'Create did not pin five MCQs');
  assert(!/answerKey|correctOptionId|codingPrivate/.test(JSON.stringify(created.body)), (
    'Create leaked private answer material'
  ));

  const createReplay = await httpJson({
    port,
    method: 'POST',
    path: '/api/interviews',
    headers: createHeaders,
    body: createBody,
  });
  assert(
    createReplay.status === 200
      && createReplay.body?.replayed === true
      && createReplay.body?.session?.id === created.body.session.id,
    'Create retry was not idempotent',
    createReplay
  );

  const conflictingCreate = await httpJson({
    port,
    method: 'POST',
    path: '/api/interviews',
    headers: createHeaders,
    body: { ...createBody, track: 'angular' },
  });
  assert(
    conflictingCreate.status === 409
      && conflictingCreate.body?.code === 'INTERVIEW_IDEMPOTENCY_CONFLICT',
    'Conflicting create retry was not rejected',
    conflictingCreate
  );

  const session = created.body.session;
  const question = session.questions[0];
  const saveBody = {
    protocolVersion: 2,
    mutationId: 'fullstack-cookie-save-0001',
    expectedVersion: session.version,
    optionId: question.options[0].id,
    responseDurationMs: 7_500,
  };
  const saved = await httpJson({
    port,
    method: 'PUT',
    path: `/api/interviews/${session.id}/mcq/${question.id}`,
    headers: mutationHeaders,
    body: saveBody,
  });
  assert(saved.status === 200, 'MCQ save failed', saved);

  const saveReplay = await httpJson({
    port,
    method: 'PUT',
    path: `/api/interviews/${session.id}/mcq/${question.id}`,
    headers: mutationHeaders,
    body: saveBody,
  });
  assert(
    saveReplay.status === 200 && saveReplay.body?.replayed === true,
    'Lost-response MCQ save retry did not replay',
    saveReplay
  );

  const staleSave = await httpJson({
    port,
    method: 'PUT',
    path: `/api/interviews/${session.id}/mcq/${question.id}`,
    headers: mutationHeaders,
    body: {
      ...saveBody,
      mutationId: 'fullstack-cookie-save-stale-0002',
    },
  });
  assert(
    staleSave.status === 409 && staleSave.body?.code === 'INTERVIEW_VERSION_CONFLICT',
    'Stale MCQ save did not return a version conflict',
    staleSave
  );

  const responses = session.questions.map((entry, index) => ({
    questionId: entry.id,
    optionId: entry.options[index % entry.options.length].id,
    responseDurationMs: 8_000 + index,
  }));
  const mcqSubmit = await httpJson({
    port,
    method: 'POST',
    path: `/api/interviews/${session.id}/mcq/submit`,
    headers: mutationHeaders,
    body: {
      protocolVersion: 2,
      mutationId: 'fullstack-cookie-mcq-submit-0001',
      expectedVersion: saved.body.session.version,
      responses,
    },
  });
  assert(mcqSubmit.status === 200, 'MCQ submit failed', mcqSubmit);

  const codingStartBody = {
    protocolVersion: 2,
    mutationId: 'fullstack-cookie-coding-start-0001',
    expectedVersion: mcqSubmit.body.session.version,
  };
  const codingStart = await httpJson({
    port,
    method: 'POST',
    path: `/api/interviews/${session.id}/coding/start`,
    headers: mutationHeaders,
    body: codingStartBody,
  });
  assert(codingStart.status === 200, 'Coding start failed', codingStart);

  const codingStartReplay = await httpJson({
    port,
    method: 'POST',
    path: `/api/interviews/${session.id}/coding/start`,
    headers: mutationHeaders,
    body: codingStartBody,
  });
  assert(
    codingStartReplay.status === 200 && codingStartReplay.body?.replayed === true,
    'Coding start retry did not replay',
    codingStartReplay
  );

  const codingDraftBody = {
    protocolVersion: 2,
    mutationId: 'fullstack-cookie-coding-draft-0001',
    expectedVersion: codingStart.body.session.version,
    language: 'typescript',
    files: [{ path: 'src/App.tsx', content: 'export default function App(){return null;}' }],
  };
  const codingDraft = await httpJson({
    port,
    method: 'PUT',
    path: `/api/interviews/${session.id}/coding/draft`,
    headers: mutationHeaders,
    body: codingDraftBody,
  });
  assert(codingDraft.status === 200, 'Coding draft save failed', codingDraft);

  const codingDraftReplay = await httpJson({
    port,
    method: 'PUT',
    path: `/api/interviews/${session.id}/coding/draft`,
    headers: mutationHeaders,
    body: codingDraftBody,
  });
  assert(
    codingDraftReplay.status === 200 && codingDraftReplay.body?.replayed === true,
    'Coding draft retry did not replay',
    codingDraftReplay
  );

  const codingSubmitBody = {
    protocolVersion: 2,
    mutationId: 'fullstack-cookie-coding-submit-0001',
    expectedVersion: codingDraft.body.session.version,
    draftHash: codingDraft.body.session.coding.draft.hash,
  };
  const codingSubmit = await httpJson({
    port,
    method: 'POST',
    path: `/api/interviews/${session.id}/coding/submit`,
    headers: mutationHeaders,
    body: codingSubmitBody,
  });
  assert(
    codingSubmit.status === 200 && codingSubmit.body?.session?.status === 'completed',
    'Coding submit did not complete the session',
    codingSubmit
  );

  const codingSubmitReplay = await httpJson({
    port,
    method: 'POST',
    path: `/api/interviews/${session.id}/coding/submit`,
    headers: mutationHeaders,
    body: codingSubmitBody,
  });
  assert(
    codingSubmitReplay.status === 200 && codingSubmitReplay.body?.replayed === true,
    'Coding submit retry did not replay',
    codingSubmitReplay
  );

  const results = await httpJson({
    port,
    path: `/api/interviews/${session.id}/results`,
    headers: readHeaders,
  });
  assert(results.status === 200, 'Results retrieval failed', results);
  assert(results.body?.results?.coding?.authoritativeEvaluation === false, (
    'Coding result was presented as authoritative'
  ));

  return {
    statuses: {
      signup: signup.status,
      availability: availability.status,
      missingCsrf: missingCsrf.status,
      create: created.status,
      createReplay: createReplay.status,
      createConflict: conflictingCreate.status,
      save: saved.status,
      saveReplay: saveReplay.status,
      staleSave: staleSave.status,
      mcqSubmit: mcqSubmit.status,
      codingStart: codingStart.status,
      codingStartReplay: codingStartReplay.status,
      codingDraft: codingDraft.status,
      codingDraftReplay: codingDraftReplay.status,
      codingSubmit: codingSubmit.status,
      codingSubmitReplay: codingSubmitReplay.status,
      results: results.status,
    },
    firstObservedLatencyMs: {
      availability: round(availability.durationMs),
      create: round(created.durationMs),
      save: round(saved.durationMs),
      mcqSubmit: round(mcqSubmit.durationMs),
      codingDraft: round(codingDraft.durationMs),
      codingSubmit: round(codingSubmit.durationMs),
      results: round(results.durationMs),
    },
    persistedResult: {
      sessionStatus: codingSubmit.body.session.status,
      mcqResponses: codingSubmit.body.session.responses.length,
      codingSubmitted: results.body.results.coding.submitted,
      codingAuthoritative: results.body.results.coding.authoritativeEvaluation,
    },
  };
}

async function verifyConcurrentCorrectness({ port, User, InterviewSession, InterviewMonthlyQuota }) {
  const [sameKeySubject, mutationSubject] = await createPremiumUsers(User, 'correctness', 2);
  const createBody = {
    format: 'coding',
    level: 'junior',
    track: 'core-web',
    timingMode: 'standard',
    viewportWidth: 1366,
  };
  const sameKeyHeaders = {
    authorization: sameKeySubject.auth,
    'idempotency-key': 'fullstack-concurrent-create-0001',
  };
  const duplicateCreates = await Promise.all([
    httpJson({ port, method: 'POST', path: '/api/interviews', headers: sameKeyHeaders, body: createBody }),
    httpJson({ port, method: 'POST', path: '/api/interviews', headers: sameKeyHeaders, body: createBody }),
  ]);
  assert(
    duplicateCreates.map((entry) => entry.status).sort().join(',') === '200,201',
    'Concurrent duplicate create did not resolve as create + replay',
    duplicateCreates
  );
  assert(
    duplicateCreates[0].body.session.id === duplicateCreates[1].body.session.id,
    'Concurrent duplicate create persisted different sessions'
  );
  assert(
    await InterviewSession.countDocuments({ userId: sameKeySubject.user._id }) === 1,
    'Concurrent duplicate create persisted more than one session'
  );
  assert(
    await InterviewMonthlyQuota.countDocuments({ userId: sameKeySubject.user._id }) === 0,
    'Premium duplicate create unexpectedly consumed free quota'
  );

  const created = await httpJson({
    port,
    method: 'POST',
    path: '/api/interviews',
    headers: {
      authorization: mutationSubject.auth,
      'idempotency-key': 'fullstack-save-submit-race-create-0001',
    },
    body: createBody,
  });
  assert(created.status === 201, 'Race fixture create failed', created);
  const session = created.body.session;
  const question = session.questions[0];
  const optionId = question.options[0].id;
  const saveBody = {
    protocolVersion: 2,
    mutationId: 'fullstack-save-submit-race-save-0001',
    expectedVersion: session.version,
    optionId,
    responseDurationMs: 12_000,
  };
  const submitBody = {
    protocolVersion: 2,
    mutationId: 'fullstack-save-submit-race-submit-0001',
    expectedVersion: session.version,
    responses: [{ questionId: question.id, optionId, responseDurationMs: 12_000 }],
  };
  const [saved, submitted] = await Promise.all([
    httpJson({
      port,
      method: 'PUT',
      path: `/api/interviews/${session.id}/mcq/${question.id}`,
      headers: { authorization: mutationSubject.auth },
      body: saveBody,
    }),
    httpJson({
      port,
      method: 'POST',
      path: `/api/interviews/${session.id}/mcq/submit`,
      headers: { authorization: mutationSubject.auth },
      body: submitBody,
    }),
  ]);
  assert(
    [saved.status, submitted.status].sort().join(',') === '200,409',
    'Concurrent save + submit did not produce one commit and one conflict',
    { saved, submitted }
  );

  let canonicalSubmit = submitted;
  if (submitted.status === 409) {
    canonicalSubmit = await httpJson({
      port,
      method: 'POST',
      path: `/api/interviews/${session.id}/mcq/submit`,
      headers: { authorization: mutationSubject.auth },
      body: {
        ...submitBody,
        expectedVersion: submitted.body.details.currentVersion,
      },
    });
  }
  assert(canonicalSubmit.status === 200, 'Conflict reconciliation submit failed', canonicalSubmit);
  const stored = await InterviewSession.findById(session.id).lean();
  assert(
    stored.mcqResponses.some((entry) => (
      entry.questionId === question.id && entry.selectedOptionId === optionId
    )),
    'Concurrent save + submit lost the selected response'
  );

  return {
    duplicateCreateStatuses: duplicateCreates.map((entry) => entry.status).sort(),
    duplicateCreateSessionCount: 1,
    saveSubmitStatuses: [saved.status, submitted.status].sort(),
    reconciledSubmitStatus: canonicalSubmit.status,
    responsePersisted: true,
  };
}

async function benchmarkWarmEndpoints({ port, User }) {
  const results = [];
  for (const concurrency of CONCURRENCY_LEVELS) {
    const count = Math.max(MIN_SAMPLES, concurrency * 2);
    const subjects = await createPremiumUsers(User, `perf_c${concurrency}`, count);

    const availability = await runConcurrent({
      concurrency,
      count,
      operation: (index) => httpJson({
        port,
        path: '/api/interviews/availability',
        headers: { authorization: subjects[index].auth },
      }),
      isSuccess: (response) => response.status === 200,
    });
    results.push({ endpoint: 'availability', concurrency, ...availability });

    const createdSessions = new Array(count);
    const create = await runConcurrent({
      concurrency,
      count,
      operation: async (index) => {
        const response = await httpJson({
          port,
          method: 'POST',
          path: '/api/interviews',
          headers: {
            authorization: subjects[index].auth,
            'idempotency-key': `perf-c${concurrency}-create-${String(index).padStart(4, '0')}`,
          },
          body: {
            format: 'coding',
            level: ['junior', 'mid', 'senior'][index % 3],
            track: ['core-web', 'react', 'angular', 'vue'][index % 4],
            timingMode: 'standard',
            viewportWidth: 1366,
          },
        });
        if (response.status === 201) createdSessions[index] = response.body.session;
        return response;
      },
      isSuccess: (response) => response.status === 201,
    });
    results.push({ endpoint: 'create', concurrency, ...create });
    assert(create.errors === 0, `Create benchmark had ${create.errors} errors`, create);

    const savedSessions = new Array(count);
    const save = await runConcurrent({
      concurrency,
      count,
      operation: async (index) => {
        const session = createdSessions[index];
        const question = session.questions[0];
        const response = await httpJson({
          port,
          method: 'PUT',
          path: `/api/interviews/${session.id}/mcq/${question.id}`,
          headers: { authorization: subjects[index].auth },
          body: {
            protocolVersion: 2,
            mutationId: `perf-c${concurrency}-save-${String(index).padStart(4, '0')}`,
            expectedVersion: session.version,
            optionId: question.options[0].id,
            responseDurationMs: 5_000,
          },
        });
        if (response.status === 200) savedSessions[index] = response.body.session;
        return response;
      },
      isSuccess: (response) => response.status === 200,
    });
    results.push({ endpoint: 'save', concurrency, ...save });
    assert(save.errors === 0, `Save benchmark had ${save.errors} errors`, save);

    const submit = await runConcurrent({
      concurrency,
      count,
      operation: (index) => {
        const session = savedSessions[index];
        return httpJson({
          port,
          method: 'POST',
          path: `/api/interviews/${session.id}/mcq/submit`,
          headers: { authorization: subjects[index].auth },
          body: {
            protocolVersion: 2,
            mutationId: `perf-c${concurrency}-submit-${String(index).padStart(4, '0')}`,
            expectedVersion: session.version,
            responses: [],
          },
        });
      },
      isSuccess: (response) => response.status === 200,
    });
    results.push({ endpoint: 'submit', concurrency, ...submit });
    assert(submit.errors === 0, `Submit benchmark had ${submit.errors} errors`, submit);
  }
  return results;
}

async function main() {
  const originalFetch = global.fetch;
  let mongoServer;
  let server;
  let disconnectMongo;
  try {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const mongoUri = mongoServer.getUri(DB_NAME);
    configureEnvironment(mongoUri);
    installHealthyRedisStub();

    const app = require('../index');
    ({ disconnectMongo } = require('../config/mongo'));
    const User = require('../models/User');
    const InterviewSession = require('../models/InterviewSession');
    const InterviewMonthlyQuota = require('../models/InterviewMonthlyQuota');

    httpAgent = new http.Agent({ keepAlive: true, maxSockets: 64 });
    await new Promise((resolve, reject) => {
      server = app.listen(0, '127.0.0.1', resolve);
      server.once('error', reject);
    });
    const port = server.address().port;

    const lifecycle = await verifyCookieLifecycle({ port, User });
    const concurrencyCorrectness = await verifyConcurrentCorrectness({
      port,
      User,
      InterviewSession,
      InterviewMonthlyQuota,
    });
    const benchmarks = await benchmarkWarmEndpoints({ port, User });

    const report = {
      schemaVersion: '1.0.0',
      scope: 'real Express HTTP + auth/CSRF + Interview API + isolated Mongo persistence',
      browserFullStack: false,
      environment: {
        nodeEnv: 'production',
        mongo: 'ephemeral MongoMemoryReplSet',
        database: DB_NAME,
        accessMode: 'public',
        systemDesignAccess: 'off',
        artifacts: 'canonical pinned editorial-gold runtime artifacts; no candidate override',
        redis: 'deterministic healthy in-process Upstash protocol stub',
      },
      correctness: {
        cookieLifecycle: lifecycle.statuses,
        persistedResult: lifecycle.persistedResult,
        concurrency: concurrencyCorrectness,
      },
      coldLatencyMs: {
        availability: lifecycle.firstObservedLatencyMs.availability,
      },
      firstObservedLatencyMs: lifecycle.firstObservedLatencyMs,
      warmBenchmarks: benchmarks,
      interpretation: [
        'No SLO or pass/fail latency threshold is asserted by this harness.',
        'Only availability is artifact-cache cold; later first-observed operations follow the availability warm-up.',
        'Zero benchmark HTTP errors is a correctness invariant, not a production capacity claim.',
        'Results do not represent Angular, a real browser, native Safari, a real Redis service, or production infrastructure.',
      ],
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (httpAgent) httpAgent.destroy();
    if (disconnectMongo) await disconnectMongo();
    if (mongoServer) await mongoServer.stop();
    global.fetch = originalFetch;
  }
}

main().catch((error) => {
  const details = error?.details ? `\n${JSON.stringify(error.details, null, 2)}` : '';
  process.stderr.write(`Interview full-stack performance audit failed: ${error.stack || error}${details}\n`);
  process.exitCode = 1;
});
