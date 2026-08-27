'use strict';

const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const script = path.resolve(__dirname, '../scripts/verify-interview-redis-multi-instance.js');

function safeEnv() {
  const env = { ...process.env };
  delete env.UPSTASH_REDIS_REST_URL;
  delete env.UPSTASH_REDIS_REST_TOKEN;
  delete env.INTERVIEW_REDIS_VERIFY_NAMESPACE;
  delete env.INTERVIEW_REDIS_VERIFY_ACK;
  return env;
}

function startFakeUpstash() {
  const counters = new Map();
  const dedupeKeys = new Set();
  const server = http.createServer((req, res) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      let commands;
      try {
        commands = JSON.parse(raw);
      } catch {
        res.writeHead(400).end();
        return;
      }
      const result = commands.map((command) => {
        if (command[0] === 'EVAL' && command[2] === 2) {
          const counterKey = command[3];
          const dedupeKey = command[4];
          const ttl = Number(command[5]);
          if (!dedupeKeys.has(dedupeKey)) {
            dedupeKeys.add(dedupeKey);
            counters.set(counterKey, (counters.get(counterKey) || 0) + 1);
          }
          return { result: [counters.get(counterKey) || 1, ttl] };
        }
        if (command[0] === 'DEL') {
          let deleted = 0;
          for (const key of command.slice(1)) {
            if (counters.delete(key)) deleted += 1;
            if (dedupeKeys.delete(key)) deleted += 1;
          }
          return { result: deleted };
        }
        return { error: 'unsupported command' };
      });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      remainingKeys: () => counters.size + dedupeKeys.size,
      close: () => new Promise((closeResolve, closeReject) => {
        server.close((error) => (error ? closeReject(error) : closeResolve()));
      }),
    }));
  });
}

function executeVerifier(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, '--execute'], {
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('verifier test timed out'));
    }, 20_000);
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

describe('Interview multi-instance Redis verifier safety', () => {
  test('is network-free dry-run by default', () => {
    const result = spawnSync(process.execPath, [script], {
      encoding: 'utf8',
      env: safeEnv(),
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(expect.objectContaining({
      ok: true,
      dryRun: true,
      networkUsed: false,
    }));
  });

  test('refuses execution without the explicit non-production acknowledgement', () => {
    const result = spawnSync(process.execPath, [script, '--execute'], {
      encoding: 'utf8',
      env: safeEnv(),
    });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      code: 'verification_ack_required',
    });
  });

  test('refuses a production namespace before making a Redis request', () => {
    const result = spawnSync(process.execPath, [script, '--execute'], {
      encoding: 'utf8',
      env: {
        ...safeEnv(),
        UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:1',
        UPSTASH_REDIS_REST_TOKEN: 'unused-test-token',
        INTERVIEW_REDIS_VERIFY_NAMESPACE: 'production-interview',
        INTERVIEW_REDIS_VERIFY_ACK: 'non-production-staging',
      },
    });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      code: 'non_production_namespace_required',
    });
  });

  test('uses two HTTP worker processes, preserves idempotency, and returns a real 429', async () => {
    const redis = await startFakeUpstash();
    try {
      const result = await executeVerifier({
        ...safeEnv(),
        RATE_LIMIT_STORE: 'redis',
        UPSTASH_REDIS_REST_URL: redis.url,
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
        INTERVIEW_REDIS_VERIFY_NAMESPACE: 'test-interview-verifier',
        INTERVIEW_REDIS_VERIFY_ACK: 'non-production-staging',
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(JSON.parse(result.stdout)).toEqual(expect.objectContaining({
        ok: true,
        dryRun: false,
        applicationProcesses: 2,
        sharedCounterAcrossProcesses: true,
        idempotentRetryChargedOnce: true,
        uniqueRequestStatuses: [200, 200, 429],
        thirdUniqueRequestHttpStatus: 429,
        thirdUniqueRequestDenied: true,
        retryAfterPresent: true,
      }));
      expect(redis.remainingKeys()).toBe(0);
    } finally {
      await redis.close();
    }
  }, 30_000);
});
