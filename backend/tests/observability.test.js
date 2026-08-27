'use strict';

const EventEmitter = require('events');

function loadObservability() {
  jest.resetModules();
  const captureMetric = jest.fn();
  jest.doMock('../config/sentry', () => ({ captureMetric }));
  return {
    captureMetric,
    observability: require('../middleware/observability'),
  };
}

describe('request observability privacy', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.restoreAllMocks();
    jest.dontMock('../config/sentry');
    jest.resetModules();
  });

  test('logs and measures an Interview request using only its route contract', () => {
    process.env.REQUEST_METRICS_ENABLED = 'true';
    const { captureMetric, observability } = loadObservability();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const req = {
      method: 'PUT',
      originalUrl: '/api/interviews/session-secret/mcq/question-secret?answer=private',
    };
    const res = new EventEmitter();
    res.statusCode = 200;
    res.locals = {};

    observability.createRequestMetricsMiddleware()(req, res, jest.fn());
    res.emit('finish');

    const entry = JSON.parse(log.mock.calls[0][0]);
    expect(entry).toMatchObject({
      type: 'interview_http',
      path: '/api/interviews/:sessionId/mcq/:questionId',
      operation: 'mcq-answer',
      status: 200,
    });
    expect(JSON.stringify(entry)).not.toContain('session-secret');
    expect(JSON.stringify(entry)).not.toContain('question-secret');
    expect(JSON.stringify(entry)).not.toContain('private');
    expect(captureMetric).toHaveBeenCalledWith(
      'count',
      'interview.http.requests',
      1,
      expect.objectContaining({ attributes: expect.objectContaining({ operation: 'mcq-answer' }) })
    );
    expect(captureMetric).toHaveBeenCalledWith(
      'distribution',
      'interview.http.duration_ms',
      expect.any(Number),
      expect.objectContaining({ unit: 'millisecond' })
    );
  });

  test('redacts mixed-case Interview paths before error logging', () => {
    process.env.REQUEST_METRICS_ENABLED = 'true';
    const { observability } = loadObservability();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const req = {
      method: 'PUT',
      originalUrl: '/API/INTERVIEWS/SESSION-SECRET/mcq/QUESTION-SECRET?answer=private',
    };
    const res = new EventEmitter();
    res.statusCode = 500;
    res.locals = {};

    observability.createRequestMetricsMiddleware()(req, res, jest.fn());
    res.emit('finish');

    const entry = JSON.parse(log.mock.calls[0][0]);
    expect(entry).toMatchObject({
      type: 'interview_http',
      path: '/api/interviews/:sessionId/mcq/:questionId',
      operation: 'mcq-answer',
      status: 500,
    });
    expect(JSON.stringify(entry)).not.toMatch(/SESSION-SECRET|QUESTION-SECRET|private/);
  });
});
