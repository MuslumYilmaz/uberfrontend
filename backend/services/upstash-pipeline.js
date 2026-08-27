'use strict';

const UPSTASH_ERROR_CODES = Object.freeze({
  notConfigured: 'not_configured',
  timeout: 'timeout',
  network: 'network_error',
  http: 'http_error',
  invalidResponse: 'invalid_response',
  command: 'command_error',
});

const DEFAULT_TIMEOUT_MS = 1500;
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 10_000;

class UpstashPipelineError extends Error {
  constructor(code) {
    super(`Upstash pipeline unavailable (${code})`);
    this.name = 'UpstashPipelineError';
    this.code = Object.values(UPSTASH_ERROR_CODES).includes(code)
      ? code
      : UPSTASH_ERROR_CODES.invalidResponse;
  }
}

function pipelineError(code) {
  return new UpstashPipelineError(code);
}

function resolveUpstashTimeoutMs(env = process.env, configuredTimeoutMs) {
  const raw = configuredTimeoutMs === undefined
    ? env.RATE_LIMIT_REDIS_TIMEOUT_MS
    : configuredTimeoutMs;
  if (raw === undefined || raw === null || raw === '') return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= MIN_TIMEOUT_MS && parsed <= MAX_TIMEOUT_MS
    ? parsed
    : DEFAULT_TIMEOUT_MS;
}

function upstashConfigured(env = process.env) {
  return Boolean(
    String(env.UPSTASH_REDIS_REST_URL || '').trim()
    && String(env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  );
}

function validCommands(commands) {
  return Array.isArray(commands)
    && commands.length > 0
    && commands.every((command) => Array.isArray(command) && command.length > 0);
}

async function runUpstashPipeline(commands, {
  env = process.env,
  fetchImpl,
  timeoutMs,
} = {}) {
  if (!validCommands(commands)) throw pipelineError(UPSTASH_ERROR_CODES.invalidResponse);

  const baseUrl = String(env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
  const token = String(env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  const request = fetchImpl || global.fetch;
  if (!baseUrl || !token || typeof request !== 'function') {
    throw pipelineError(UPSTASH_ERROR_CODES.notConfigured);
  }

  const controller = new AbortController();
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(pipelineError(UPSTASH_ERROR_CODES.timeout));
    }, resolveUpstashTimeoutMs(env, timeoutMs));
  });
  const requestPromise = (async () => {
    let response;
    try {
      response = await request(`${baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(commands),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') {
        throw pipelineError(UPSTASH_ERROR_CODES.timeout);
      }
      throw pipelineError(UPSTASH_ERROR_CODES.network);
    }

    if (!response?.ok) throw pipelineError(UPSTASH_ERROR_CODES.http);

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') {
        throw pipelineError(UPSTASH_ERROR_CODES.timeout);
      }
      throw pipelineError(UPSTASH_ERROR_CODES.invalidResponse);
    }

    if (!Array.isArray(payload) || payload.length !== commands.length) {
      throw pipelineError(UPSTASH_ERROR_CODES.invalidResponse);
    }
    for (const entry of payload) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw pipelineError(UPSTASH_ERROR_CODES.invalidResponse);
      }
      if (Object.prototype.hasOwnProperty.call(entry, 'error')) {
        throw pipelineError(UPSTASH_ERROR_CODES.command);
      }
      if (!Object.prototype.hasOwnProperty.call(entry, 'result')) {
        throw pipelineError(UPSTASH_ERROR_CODES.invalidResponse);
      }
    }

    return payload;
  })();

  try {
    return await Promise.race([requestPromise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  UPSTASH_ERROR_CODES,
  UpstashPipelineError,
  resolveUpstashTimeoutMs,
  runUpstashPipeline,
  upstashConfigured,
};
