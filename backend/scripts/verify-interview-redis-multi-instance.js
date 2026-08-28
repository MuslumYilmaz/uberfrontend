#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const express = require('express');
const { spawn } = require('child_process');
const { rateLimit } = require('../middleware/rateLimit');
const { runUpstashPipeline, upstashConfigured } = require('../services/upstash-pipeline');

const VERIFY_TTL_SECONDS = 30;
const VERIFY_MAX = 2;
const WORKER_START_TIMEOUT_MS = 10_000;
const WORKER_REQUEST_TIMEOUT_MS = 10_000;
const EXECUTE_ACK = 'non-production-staging';
const VERIFY_LIMIT_CODE = 'INTERVIEW_REDIS_VERIFY_RATE_LIMITED';
const VERIFY_SUBJECT = 'shared-verification-subject';

function argument(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.find((value) => value.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : '';
}

function safeVerificationKey(value, namespace) {
  const key = String(value || '');
  if (!key.startsWith(`rl:${namespace}:verify:`) || key.length > 240) {
    throw new Error('invalid_verification_key');
  }
  return key;
}

function safeRunId(value) {
  const runId = String(value || '').trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(runId)) {
    throw new Error('invalid_verification_run');
  }
  return runId;
}

function digest(value) {
  return crypto
    .createHash('sha256')
    .update(String(value))
    .digest('hex')
    .slice(0, 32);
}

function verificationKeys(namespace, runId) {
  const limiterName = `verify:${runId}`;
  const counterKey = safeVerificationKey(
    `rl:${namespace}:${limiterName}:${digest(VERIFY_SUBJECT)}`,
    namespace,
  );
  return {
    limiterName,
    counterKey,
    keys: [
      counterKey,
      ...['unique-1', 'unique-2', 'unique-3'].map((requestId) => safeVerificationKey(
        `${counterKey}:dedupe:${digest(requestId)}`,
        namespace,
      )),
    ],
  };
}

async function worker() {
  const namespace = assertExecutionSafety();
  const mode = argument('worker');
  if (mode !== 'http') throw new Error('invalid_worker_mode');
  const runId = safeRunId(argument('run-id'));
  process.env.RATE_LIMIT_STORE = 'redis';
  process.env.RATE_LIMIT_NAMESPACE = namespace;
  const { limiterName } = verificationKeys(namespace, runId);
  const app = express();
  app.disable('x-powered-by');
  app.get('/verify', rateLimit({
    name: limiterName,
    windowMs: VERIFY_TTL_SECONDS * 1000,
    max: VERIFY_MAX,
    keyGenerator: () => VERIFY_SUBJECT,
    dedupeKeyGenerator: (req) => req.get('Idempotency-Key') || '',
    code: VERIFY_LIMIT_CODE,
    message: 'Interview Redis verification limit reached',
    redisFailureMode: 'closed',
  }), (_req, res) => res.status(200).json({
    ok: true,
    rateLimit: res.locals.rateLimit,
  }));

  const server = await new Promise((resolve, reject) => {
    const candidate = app.listen(0, '127.0.0.1');
    candidate.once('listening', () => resolve(candidate));
    candidate.once('error', () => reject(new Error('worker_start_failed')));
  });
  const port = server.address()?.port;
  if (!Number.isSafeInteger(port) || port < 1) throw new Error('worker_start_failed');
  process.stdout.write(`${JSON.stringify({ ready: true, port })}\n`);

  const stop = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 2_000).unref();
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}

function runWorker({ runId }) {
  const args = [
    __filename,
    '--worker=http',
    `--run-id=${runId}`,
  ];
  const child = spawn(process.execPath, args, {
    env: process.env,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  let stdout = '';
  let settled = false;
  let exited = false;
  let exitCode = null;
  let resolveExit;
  const exitPromise = new Promise((resolve) => {
    resolveExit = resolve;
  });
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('worker_start_timeout'));
      }
    }, WORKER_START_TIMEOUT_MS);
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };
    child.once('error', () => {
      exited = true;
      exitCode = 1;
      resolveExit(1);
      rejectOnce(new Error('worker_start_failed'));
    });
    child.once('exit', (code) => {
      exited = true;
      exitCode = code;
      resolveExit(code);
      if (!settled) rejectOnce(new Error('worker_failed'));
    });
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
      const lines = stdout.split(/\r?\n/);
      stdout = lines.pop() || '';
      for (const line of lines.filter(Boolean)) {
        try {
          const payload = JSON.parse(line);
          if (payload.ready !== true || !Number.isSafeInteger(payload.port) || payload.port < 1) {
            rejectOnce(new Error('worker_invalid_response'));
            continue;
          }
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ port: payload.port });
          }
        } catch {
          rejectOnce(new Error('worker_invalid_response'));
        }
      }
    });
  });

  return {
    ready,
    async stop() {
      if (!exited) child.kill('SIGTERM');
      const code = exited ? exitCode : await exitPromise;
      if (code !== 0 && code !== null) throw new Error('worker_failed');
    },
  };
}

function assertExecutionSafety() {
  if (String(process.env.INTERVIEW_REDIS_VERIFY_ACK || '') !== EXECUTE_ACK) {
    throw new Error('verification_ack_required');
  }
  if (!upstashConfigured(process.env)) throw new Error('redis_not_configured');
  const namespace = String(process.env.INTERVIEW_REDIS_VERIFY_NAMESPACE || '')
    .trim()
    .toLowerCase();
  if (!/^(staging|preview|test|ci)[a-z0-9:_-]*$/.test(namespace)) {
    throw new Error('non_production_namespace_required');
  }
  return namespace;
}

async function cleanup(keys) {
  if (!keys.length) return;
  await runUpstashPipeline([['DEL', ...keys]]);
}

async function requestWorker(worker, idempotencyKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WORKER_REQUEST_TIMEOUT_MS);
  try {
    let response;
    try {
      response = await fetch(`http://127.0.0.1:${worker.port}/verify`, {
        headers: { 'Idempotency-Key': idempotencyKey },
        signal: controller.signal,
      });
    } catch {
      throw new Error('worker_request_failed');
    }
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error('worker_invalid_response');
    }
    return {
      status: response.status,
      retryAfter: response.headers.get('retry-after'),
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function execute() {
  const namespace = assertExecutionSafety();
  const runId = crypto.randomUUID();
  const { keys } = verificationKeys(namespace, runId);
  const workers = [runWorker({ runId }), runWorker({ runId })];
  try {
    const [firstWorker, secondWorker] = await Promise.all(workers.map((entry) => entry.ready));
    const first = await requestWorker(firstWorker, 'unique-1');
    const retryAcrossProcess = await requestWorker(secondWorker, 'unique-1');
    const secondUnique = await requestWorker(secondWorker, 'unique-2');
    const thirdUnique = await requestWorker(firstWorker, 'unique-3');

    if (first.status !== 200 || retryAcrossProcess.status !== 200) {
      throw new Error('idempotency_check_failed');
    }
    if (secondUnique.status !== 200) throw new Error('shared_counter_check_failed');
    if (
      thirdUnique.status !== 429
      || thirdUnique.body?.code !== VERIFY_LIMIT_CODE
      || !/^\d+$/.test(String(thirdUnique.retryAfter || ''))
    ) {
      throw new Error('http_rate_limit_check_failed');
    }

    process.stdout.write(`${JSON.stringify({
      ok: true,
      dryRun: false,
      databaseUsed: false,
      applicationProcesses: workers.length,
      sharedCounterAcrossProcesses: true,
      idempotentRetryChargedOnce: true,
      uniqueRequestStatuses: [first.status, secondUnique.status, thirdUnique.status],
      thirdUniqueRequestHttpStatus: thirdUnique.status,
      thirdUniqueRequestDenied: true,
      retryAfterPresent: true,
      ttlSeconds: VERIFY_TTL_SECONDS,
    })}\n`);
  } finally {
    await Promise.allSettled(workers.map((entry) => entry.stop()));
    await cleanup(keys);
  }
}

async function main() {
  if (argument('worker')) return worker();
  if (!process.argv.includes('--execute')) {
    process.stdout.write(`${JSON.stringify({
      ok: true,
      dryRun: true,
      networkUsed: false,
      databaseUsed: false,
      executeFlag: '--execute',
      proofs: [
        'two-process-shared-counter',
        'cross-process-idempotent-retry',
        'third-unique-request-http-429',
      ],
      requiredEnvironment: [
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
        'INTERVIEW_REDIS_VERIFY_NAMESPACE=staging-interview',
        `INTERVIEW_REDIS_VERIFY_ACK=${EXECUTE_ACK}`,
      ],
    })}\n`);
    return undefined;
  }
  return execute();
}

main().catch((error) => {
  const allowedCodes = new Set([
    'verification_ack_required',
    'redis_not_configured',
    'non_production_namespace_required',
    'worker_start_failed',
    'worker_start_timeout',
    'worker_failed',
    'worker_request_failed',
    'worker_invalid_response',
    'invalid_worker_mode',
    'invalid_verification_run',
    'shared_counter_check_failed',
    'idempotency_check_failed',
    'http_rate_limit_check_failed',
  ]);
  const code = allowedCodes.has(error?.message) ? error.message : 'verification_failed';
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`);
  process.exitCode = 1;
});
