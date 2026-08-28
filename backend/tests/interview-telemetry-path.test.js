'use strict';

const {
  interviewOperation,
  interviewPathContract,
  isInterviewHttpPath,
  isInterviewPath,
} = require('../services/interview/telemetry-path');

describe('Interview telemetry path contracts', () => {
  test.each([
    ['/api/interviews/session-secret/mcq/question-secret?answer=private', 'PUT', '/api/interviews/:sessionId/mcq/:questionId', 'mcq-answer'],
    ['/api/interviews/session-secret/coding/draft', 'PUT', '/api/interviews/:sessionId/coding/draft', 'coding-draft'],
    ['/api/interviews/session-secret/system-design/twist/reveal', 'POST', '/api/interviews/:sessionId/system-design/twist/reveal', 'system-design-twist'],
    ['/api/interviews/session-secret/results', 'GET', '/api/interviews/:sessionId/results', 'results'],
    ['/api/interviews', 'POST', '/api/interviews', 'create'],
    ['/API/INTERVIEWS/SESSION-SECRET/MCQ/QUESTION-SECRET?answer=private', 'PUT', '/api/interviews/:sessionId/mcq/:questionId', 'mcq-answer'],
  ])('redacts identifiers for %s', (raw, method, contract, operation) => {
    expect(isInterviewPath(raw)).toBe(true);
    expect(interviewPathContract(raw)).toBe(contract);
    expect(interviewOperation(raw, method)).toBe(operation);
  });

  test('fully redacts unknown Interview subpaths and supports Sentry transaction names', () => {
    const raw = 'POST /api/interviews/session-secret/private/debug/value';
    expect(isInterviewPath(raw)).toBe(true);
    expect(interviewPathContract(raw)).toBe('/api/interviews/[redacted]');
    expect(interviewOperation(raw, 'POST')).toBe('unknown');
  });

  test('treats absolute and transaction-style mixed-case paths as Interview traffic', () => {
    expect(isInterviewPath('https://api.example.test/API/INTERVIEWS/SESSION-SECRET/results'))
      .toBe(true);
    expect(interviewPathContract('GET /Api/Interviews/SESSION-SECRET/private/value'))
      .toBe('/api/interviews/[redacted]');
  });

  test('uses an exact pathname predicate for HTTP middleware exemptions', () => {
    expect(isInterviewHttpPath('/API/INTERVIEWS/session-secret/results?x=1')).toBe(true);
    expect(isInterviewHttpPath('https://api.example.test/api/interviews/active')).toBe(true);
    expect(isInterviewHttpPath('POST /api/interviews/session-secret/results')).toBe(false);
    expect(isInterviewHttpPath('/api/auth/foo/api/interviews/bar')).toBe(false);
    expect(isInterviewHttpPath('/api/interviews-not-really')).toBe(false);
    expect(isInterviewHttpPath('//api/interviews/active')).toBe(false);
    expect(isInterviewHttpPath('/api//interviews/active')).toBe(false);
  });
});
