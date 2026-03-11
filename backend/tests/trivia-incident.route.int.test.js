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
      title: 'Event Loop Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for configured react trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-usestate-purpose/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-usestate-purpose',
      tech: 'react',
      title: 'useState Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for another configured react trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-why-event-delegation/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-why-event-delegation',
      tech: 'react',
      title: 'Event Delegation Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react keys trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-keys-in-lists/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-keys-in-lists',
      tech: 'react',
      title: 'List Keys Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react controlled vs uncontrolled trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-controlled-vs-uncontrolled/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-controlled-vs-uncontrolled',
      tech: 'react',
      title: 'Form State Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react default vs named exports trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-default-vs-named-exports-runtime-break/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-default-vs-named-exports-runtime-break',
      tech: 'react',
      title: 'Import Crash Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react conditional rendering trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-conditional-rendering/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-conditional-rendering',
      tech: 'react',
      title: 'Conditional UI Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react useeffect trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-useeffect-purpose/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-useeffect-purpose',
      tech: 'react',
      title: 'useEffect Race Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react fragments trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-fragments-dom-and-reconciliation/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-fragments-dom-and-reconciliation',
      tech: 'react',
      title: 'Fragment Identity Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react virtual dom trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-virtual-dom/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-virtual-dom',
      tech: 'react',
      title: 'Render vs DOM Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react component rerendering trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-component-rerendering/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-component-rerendering',
      tech: 'react',
      title: 'Re-render Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react state and props ownership trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-mixing-state-and-props-responsibilities/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-mixing-state-and-props-responsibilities',
      tech: 'react',
      title: 'Ownership Drift Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react lifting state up trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-lifting-state-up/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-lifting-state-up',
      tech: 'react',
      title: 'Shared State Sync Root Cause Check',
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
