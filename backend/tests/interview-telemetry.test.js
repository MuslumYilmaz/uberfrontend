'use strict';

const {
  emitInterviewEvent,
  sanitizeFields,
  telemetryEnabled,
} = require('../services/interview/telemetry');

describe('Interview telemetry', () => {
  test('defaults on only in production and honors an explicit switch', () => {
    expect(telemetryEnabled({ NODE_ENV: 'production' })).toBe(true);
    expect(telemetryEnabled({ NODE_ENV: 'test' })).toBe(false);
    expect(telemetryEnabled({ NODE_ENV: 'production', INTERVIEW_TELEMETRY_ENABLED: 'false' }))
      .toBe(false);
    expect(telemetryEnabled({ NODE_ENV: 'test', INTERVIEW_TELEMETRY_ENABLED: 'true' }))
      .toBe(true);
  });

  test('drops identifiers, prompts, answers, code and drafts from event fields', () => {
    expect(sanitizeFields({
      format: 'coding',
      track: 'react',
      level: 'mid',
      targetExposureCount: 2,
      protectedWindow: true,
      userId: '507f1f77bcf86cd799439011',
      sessionId: 'session-secret',
      prompt: 'Private question text',
      answer: 'option-b',
      draft: 'const secret = true;',
      codeSource: 'private source',
    })).toEqual({
      format: 'coding',
      track: 'react',
      level: 'mid',
      targetExposureCount: 2,
      protectedWindow: true,
    });
  });

  test('drops user-controlled values that are not exact product enums', () => {
    expect(sanitizeFields({
      format: 'customeremail123',
      track: 'react-private-cohort-42',
      level: 'mid-user-123',
      operation: 'create-user-secret',
      formatFallback: 'coding',
    })).toEqual({});
  });

  test('emits an allowlisted low-cardinality lifecycle event', () => {
    const sink = jest.fn();
    const emitted = emitInterviewEvent('save_conflict', {
      format: 'coding',
      operation: 'mcq-answer',
      httpStatus: 409,
      replayed: false,
      sessionId: 'must-not-log',
    }, {
      env: { INTERVIEW_TELEMETRY_ENABLED: 'true' },
      now: new Date('2026-08-24T10:00:00.000Z'),
      sink,
    });
    expect(emitted).toBe(true);
    expect(sink).toHaveBeenCalledWith({
      type: 'interview_event',
      name: 'save_conflict',
      at: '2026-08-24T10:00:00.000Z',
      format: 'coding',
      operation: 'mcq-answer',
      httpStatus: 409,
      replayed: false,
    });
  });

  test('refuses unregistered event names', () => {
    const sink = jest.fn();
    expect(emitInterviewEvent('raw_debug_dump', {}, {
      env: { INTERVIEW_TELEMETRY_ENABLED: 'true' },
      sink,
    })).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  test('keeps request behavior independent from logging and metric sink failures', () => {
    expect(emitInterviewEvent('rate_limit_unavailable', {
      operation: 'create',
      code: 'RATE_LIMIT_UNAVAILABLE',
    }, {
      env: { INTERVIEW_TELEMETRY_ENABLED: 'true' },
      sink: () => { throw new Error('log unavailable'); },
      metricSink: () => { throw new Error('metrics unavailable'); },
    })).toBe(true);
  });
});
