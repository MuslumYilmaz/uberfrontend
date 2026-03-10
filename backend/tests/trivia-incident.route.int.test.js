'use strict';

const request = require('supertest');

let app;

beforeAll(() => {
  process.env.MONGO_URL_TEST = process.env.MONGO_URL_TEST || 'mongodb://127.0.0.1:27017/backend-test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_trivia_incident_route';
  jest.resetModules();
  app = require('../index');
});

describe('Trivia incident routes', () => {
  test('returns public incident card for configured trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-event-loop/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-event-loop',
      tech: 'javascript',
      title: 'Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns 404 when incident card is not configured for a trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-closures/incident');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.stringContaining('Incident card not found'),
    }));
  });

  test('returns 400 for unsupported tech slug', async () => {
    const res = await request(app).get('/api/trivia/svelte/js-event-loop/incident');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Invalid tech' }));
  });

  test('returns 404 when question id is not available under the requested tech', async () => {
    const res = await request(app).get('/api/trivia/react/js-event-loop/incident');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.stringContaining('Incident card not found'),
    }));
  });

  test('validates a correct incident answer', async () => {
    const res = await request(app)
      .post('/api/trivia/javascript/js-event-loop/incident/answer')
      .send({ optionId: 'microtask-loop' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-event-loop',
      tech: 'javascript',
      correct: true,
      rereadRecommended: false,
    }));
  });

  test('returns reread guidance for a wrong incident answer', async () => {
    const res = await request(app)
      .post('/api/trivia/javascript/js-event-loop/incident/answer')
      .send({ optionId: 'dom-heavy' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      correct: false,
      rereadRecommended: true,
      feedback: expect.stringContaining('Re-read'),
    }));
  });

  test('rejects unknown option id for incident answer', async () => {
    const res = await request(app)
      .post('/api/trivia/javascript/js-event-loop/incident/answer')
      .send({ optionId: 'unknown-option' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.stringContaining('Invalid optionId'),
    }));
  });
});
