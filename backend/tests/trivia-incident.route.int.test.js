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

  test('returns public incident card for javascript closures trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-closures/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-closures',
      tech: 'javascript',
      title: 'Closure Scope Debug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript this keyword trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-this-keyword/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-this-keyword',
      tech: 'javascript',
      title: 'this Binding Debug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript hoisting tdz trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-hoisting-tdz/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-hoisting-tdz',
      tech: 'javascript',
      title: 'TDZ Runtime Failure Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript var let const hoisting trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-var-let-const-hoisting/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-var-let-const-hoisting',
      tech: 'javascript',
      title: 'var/let/const Hoisting Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript block scoped or function scoped trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-block-scoped-or-function-scoped/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-block-scoped-or-function-scoped',
      tech: 'javascript',
      title: 'Scope Bug Root-Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript promises async await trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-promises-async-await/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-promises-async-await',
      tech: 'javascript',
      title: 'Async Flow Performance Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript promise fundamental understanding trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-promise-fundamental-understanding/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-promise-fundamental-understanding',
      tech: 'javascript',
      title: 'Promise Chain Propagation Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript async await example when promise preferred trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-async-await-example-when-promise-is-preferred/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-async-await-example-when-promise-is-preferred',
      tech: 'javascript',
      title: 'Promise vs Await Design Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript event delegation trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-event-delegation/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-event-delegation',
      tech: 'javascript',
      title: 'Delegation Targeting Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript null undefined undeclared trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-null-undefined-undeclared/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-null-undefined-undeclared',
      tech: 'javascript',
      title: 'Missing Value Debug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript undefined vs not defined trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-undefined-vs-not-defined/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-undefined-vs-not-defined',
      tech: 'javascript',
      title: 'ReferenceError Triage Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript use strict trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-use-strict-describe/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-use-strict-describe',
      tech: 'javascript',
      title: 'Strict Mode Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript eval danger trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-why-eval-function-considered-dangerous/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-why-eval-function-considered-dangerous',
      tech: 'javascript',
      title: 'Dynamic Code Safety Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript nullish coalescing trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-null-coalescing-operator/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-null-coalescing-operator',
      tech: 'javascript',
      title: 'Fallback Logic Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript equality vs strict equality trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-equality-vs-strict-equality/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-equality-vs-strict-equality',
      tech: 'javascript',
      title: 'Coercion Bug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript compare two objects trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-compare-two-objects/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-compare-two-objects',
      tech: 'javascript',
      title: 'Object Equality Strategy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript combined truthy equality reference trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-truthy-falsy-pass-by-value-reference-strict-equality-use-case/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-truthy-falsy-pass-by-value-reference-strict-equality-use-case',
      tech: 'javascript',
      title: 'Combined Debugging Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript hoisting trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-hoisting/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-hoisting',
      tech: 'javascript',
      title: 'Hoisting Symptom Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript higher order function trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-higher-order-function/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-higher-order-function',
      tech: 'javascript',
      title: 'Higher-Order Function Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript event bubbling capturing trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-event-bubbling-capturing/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-event-bubbling-capturing',
      tech: 'javascript',
      title: 'Event Propagation Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript call apply bind trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-call-apply-bind/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-call-apply-bind',
      tech: 'javascript',
      title: 'this Binding Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript foreach vs map trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-foreach-vs-map/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-foreach-vs-map',
      tech: 'javascript',
      title: 'Array Method Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript cookie storage trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-cookie-sessionstorage-localstorage/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-cookie-sessionstorage-localstorage',
      tech: 'javascript',
      title: 'Browser Storage Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript cookie options trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-cookie-options/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-cookie-options',
      tech: 'javascript',
      title: 'Cookie Attribute Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript prototypal inheritance trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-prototypal-inheritance/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-prototypal-inheritance',
      tech: 'javascript',
      title: 'Prototype Chain Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript data types trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-data-types/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-data-types',
      tech: 'javascript',
      title: 'Data Type Reality Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript typeof trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-check-data-type-with-typeof/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-check-data-type-with-typeof',
      tech: 'javascript',
      title: 'typeof Edge-Case Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript bigint trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-bigint-data-type/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-bigint-data-type',
      tech: 'javascript',
      title: 'BigInt Boundary Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript static vs dynamic typing trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-static-vs-dynamic-typing/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-static-vs-dynamic-typing',
      tech: 'javascript',
      title: 'Typing Model Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript type coercion trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-type-coercion/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-type-coercion',
      tech: 'javascript',
      title: 'Coercion Control Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript pass by value reference trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-passing-by-value-and-by-reference/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-passing-by-value-and-by-reference',
      tech: 'javascript',
      title: 'Mutation vs Reassignment Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript nan trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-nan-property/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-nan-property',
      tech: 'javascript',
      title: 'NaN Validation Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript currying trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-currying/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-currying',
      tech: 'javascript',
      title: 'Currying Use-Case Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript callbacks trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-callbacks/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-callbacks',
      tech: 'javascript',
      title: 'Callback Pattern Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript promise resolves callback hell trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-calback-hell-resolved-with-promise/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-calback-hell-resolved-with-promise',
      tech: 'javascript',
      title: 'Promise Refactor Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript arrow functions trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-arrow-functions/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-arrow-functions',
      tech: 'javascript',
      title: 'Arrow Function Reality Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript arrow vs regular functions trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-arrow-vs-regular-functions/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-arrow-vs-regular-functions',
      tech: 'javascript',
      title: 'Function Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript object destructuring trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-object-destructuring/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-object-destructuring',
      tech: 'javascript',
      title: 'Destructuring Debug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript spread vs rest parameters trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-spread-vs-rest-parameters/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-spread-vs-rest-parameters',
      tech: 'javascript',
      title: 'Spread or Rest Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript design patterns trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-design-patterns/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-design-patterns',
      tech: 'javascript',
      title: 'Pattern Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript deferred scripts trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-deferred-scripts/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-deferred-scripts',
      tech: 'javascript',
      title: 'Defer Behavior Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript classes trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-classes/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-classes',
      tech: 'javascript',
      title: 'Class Model Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript object creation methods trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-object-creation-methods/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-object-creation-methods',
      tech: 'javascript',
      title: 'Object Creation Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript memoization trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-memoization/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-memoization',
      tech: 'javascript',
      title: 'Memoization Tradeoff Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript microtasks vs macrotasks trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-microtasks-vs-macrotasks/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-microtasks-vs-macrotasks',
      tech: 'javascript',
      title: 'Event Loop Priority Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript promise combinators trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-promise-combinators-all-allsettled-race-any/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-promise-combinators-all-allsettled-race-any',
      tech: 'javascript',
      title: 'Promise Combinator Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript object create vs new trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-object-create-vs-new/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-object-create-vs-new',
      tech: 'javascript',
      title: 'Creation Path Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript prototype vs proto trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-prototype-vs-proto/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-prototype-vs-proto',
      tech: 'javascript',
      title: 'Prototype Link Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript shallow vs deep copy trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-shallow-vs-deep-copy/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-shallow-vs-deep-copy',
      tech: 'javascript',
      title: 'Copy Bug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript map filter reduce trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-map-filter-reduce/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-map-filter-reduce',
      tech: 'javascript',
      title: 'Array Method Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript array sort pitfalls trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-array-sort-pitfalls/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-array-sort-pitfalls',
      tech: 'javascript',
      title: 'Sort Trap Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript mutability vs immutability trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-mutability-vs-immutability/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-mutability-vs-immutability',
      tech: 'javascript',
      title: 'State Update Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript secure cors handling trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-secure-cors-handling/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-secure-cors-handling',
      tech: 'javascript',
      title: 'CORS Fix Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript content delivery caching trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/content-delivery-caching-strategies-streaming/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'content-delivery-caching-strategies-streaming',
      tech: 'javascript',
      title: 'Caching Strategy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript debounce vs throttle trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/debounce-vs-throttle-search-input/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'debounce-vs-throttle-search-input',
      tech: 'javascript',
      title: 'Search Input Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript map vs object trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-map-vs-object/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-map-vs-object',
      tech: 'javascript',
      title: 'Key-Value Structure Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript map set get trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-map-set-get/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-map-set-get',
      tech: 'javascript',
      title: 'Map Lookup Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript http caching basics trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/http-caching-basics/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'http-caching-basics',
      tech: 'javascript',
      title: 'HTTP Cache Policy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript web performance load time trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/web-performance-optimize-load-time/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'web-performance-optimize-load-time',
      tech: 'javascript',
      title: 'Load-Time Priority Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript repaint reflow trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-repaint-reflow/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-repaint-reflow',
      tech: 'javascript',
      title: 'Layout Jank Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript current trends trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-current-trends/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-current-trends',
      tech: 'javascript',
      title: 'Trend Evaluation Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript ai streaming data handling trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/ai-streaming-data-handling/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'ai-streaming-data-handling',
      tech: 'javascript',
      title: 'Streaming UI Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript chat conversation state management trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/chat-conversation-state-management/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'chat-conversation-state-management',
      tech: 'javascript',
      title: 'Conversation Timeline Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript sse vs websocket real time trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/sse-vs-websocket-real-time/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'sse-vs-websocket-real-time',
      tech: 'javascript',
      title: 'Realtime Transport Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript ai ux integration challenges trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/ai-ux-integration-challenges/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'ai-ux-integration-challenges',
      tech: 'javascript',
      title: 'AI UX Reliability Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript prompt engineering frontend trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/prompt-engineering-frontend/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'prompt-engineering-frontend',
      tech: 'javascript',
      title: 'Prompt Shaping Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript queue vs stack trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-queue-vs-stack/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-queue-vs-stack',
      tech: 'javascript',
      title: 'Processing Order Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript big o notation trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-big-o-notation/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-big-o-notation',
      tech: 'javascript',
      title: 'Growth Rate Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript async race conditions trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-async-race-conditions/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-async-race-conditions',
      tech: 'javascript',
      title: 'Stale Results Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript web workers basics trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-web-workers-basics/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-web-workers-basics',
      tech: 'javascript',
      title: 'Main Thread Relief Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript escape vs sanitize trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-escape-vs-sanitize/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-escape-vs-sanitize',
      tech: 'javascript',
      title: 'Safe Rendering Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript xss dom sinks trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-xss-dom-sinks/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-xss-dom-sinks',
      tech: 'javascript',
      title: 'DOM Sink Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript testing edge cases strategy trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-testing-edge-cases-strategy/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-testing-edge-cases-strategy',
      tech: 'javascript',
      title: 'Edge-Case Coverage Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript performance profiling workflow trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-performance-profiling-workflow/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-performance-profiling-workflow',
      tech: 'javascript',
      title: 'Measure First Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript memory leaks common sources trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-memory-leaks-common-sources/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-memory-leaks-common-sources',
      tech: 'javascript',
      title: 'Leak Source Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript esm vs cjs trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-esm-vs-cjs/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-esm-vs-cjs',
      tech: 'javascript',
      title: 'Module Interop Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript tree shaking trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-tree-shaking/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-tree-shaking',
      tech: 'javascript',
      title: 'Bundle Pruning Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript intl datetime timezone trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-intl-datetime-timezone/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-intl-datetime-timezone',
      tech: 'javascript',
      title: 'Timezone Correctness Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript mock vs stub vs spy trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-mock-vs-stub-vs-spy/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-mock-vs-stub-vs-spy',
      tech: 'javascript',
      title: 'Test Double Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for javascript garbage collection and gc pauses trivia question', async () => {
    const res = await request(app).get('/api/trivia/javascript/js-garbage-collection-and-gc-pauses/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'js-garbage-collection-and-gc-pauses',
      tech: 'javascript',
      title: 'GC Jank Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular lifecycle hook trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-lifecycle-constructor-oninit-afterviewinit-dom/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-lifecycle-constructor-oninit-afterviewinit-dom',
      tech: 'angular',
      title: 'Lifecycle Hook Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular vs angularjs trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-vs-angularjs/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-vs-angularjs',
      tech: 'angular',
      title: 'Rewrite vs Upgrade Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular component vs service responsibilities trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-component-vs-service-responsibilities/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-component-vs-service-responsibilities',
      tech: 'angular',
      title: 'Boundary Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular component metadata trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-component-metadata/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-component-metadata',
      tech: 'angular',
      title: 'Decorator Contract Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngmodules vs standalone trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-ngmodules-vs-standalone/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-ngmodules-vs-standalone',
      tech: 'angular',
      title: 'Standalone Migration Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular appmodule standalone changes trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-appmodule-standalone-changes/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-appmodule-standalone-changes',
      tech: 'angular',
      title: 'Standalone Migration Wiring Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular template compilation and binding trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-template-compilation-and-binding/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-template-compilation-and-binding',
      tech: 'angular',
      title: 'Binding Update Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular data binding trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-data-binding/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-data-binding',
      tech: 'angular',
      title: 'Binding Direction Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular interpolation vs property binding trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-interpolation-vs-property-binding/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-interpolation-vs-property-binding',
      tech: 'angular',
      title: 'DOM State Binding Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular event binding dom vs output change detection trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-event-binding-dom-vs-output-change-detection/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-event-binding-dom-vs-output-change-detection',
      tech: 'angular',
      title: 'Event Source Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular directives trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-directives/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-directives',
      tech: 'angular',
      title: 'Directive Type Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular structural vs attribute directives trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-structural-vs-attribute-directives/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-structural-vs-attribute-directives',
      tech: 'angular',
      title: 'Tree Change Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngif dom lifecycle trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-ngif-dom-lifecycle/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-ngif-dom-lifecycle',
      tech: 'angular',
      title: 'View Teardown Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngfor trackby trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-ngfor-trackby/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-ngfor-trackby',
      tech: 'angular',
      title: 'List Identity Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular services trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-services/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-services',
      tech: 'angular',
      title: 'Service Ownership Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular dependency injection trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-dependency-injection/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-dependency-injection',
      tech: 'angular',
      title: 'Injector Scope Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngoninit vs constructor trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-ngoninit-vs-constructor/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-ngoninit-vs-constructor',
      tech: 'angular',
      title: 'Init Timing Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular pipes trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-pipes/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-pipes',
      tech: 'angular',
      title: 'Pure Pipe Update Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular custom two way binding trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-custom-two-way-binding/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-custom-two-way-binding',
      tech: 'angular',
      title: 'Two-Way Binding Wiring Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular lifecycle hooks trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-lifecycle-hooks/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-lifecycle-hooks',
      tech: 'angular',
      title: 'Hook Placement Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular input output trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-input-output/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-input-output',
      tech: 'angular',
      title: 'Input/Output Ownership Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular observables rxjs trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-observables-rxjs/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-observables-rxjs',
      tech: 'angular',
      title: 'Stream Cancellation Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular routing trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-routing/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-routing',
      tech: 'angular',
      title: 'Route Mapping Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular lazy loading trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-lazy-loading/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-lazy-loading',
      tech: 'angular',
      title: 'Load Timing Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular change detection strategies trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-change-detection-strategies/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-change-detection-strategies',
      tech: 'angular',
      title: 'OnPush Trigger Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular zonejs change detection trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-zonejs-change-detection/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-zonejs-change-detection',
      tech: 'angular',
      title: 'NgZone Boundary Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngonchanges vs ngdocheck trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-ngonchanges-vs-ngdocheck/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-ngonchanges-vs-ngdocheck',
      tech: 'angular',
      title: 'Change Hook Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular forroot forchild trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-forroot-forchild/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-forroot-forchild',
      tech: 'angular',
      title: 'Module Scope Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular performance optimization trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-performance-optimization/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-performance-optimization',
      tech: 'angular',
      title: 'Optimization Strategy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular onpush change detection debugging real bug trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-onpush-change-detection-debugging-real-bug/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-onpush-change-detection-debugging-real-bug',
      tech: 'angular',
      title: 'Stale UI Debug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular rxjs operator choice trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
      tech: 'angular',
      title: 'Autocomplete Race Condition Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular prevent memory leaks trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-prevent-memory-leaks-unsubscribe-patterns/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-prevent-memory-leaks-unsubscribe-patterns',
      tech: 'angular',
      title: 'Leaking Subscription Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular control value accessor trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-controlvalueaccessor-vs-custom-two-way-binding/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-controlvalueaccessor-vs-custom-two-way-binding',
      tech: 'angular',
      title: 'Custom Input Integration Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular template driven vs reactive forms trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-template-driven-vs-reactive-forms-which-scales/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-template-driven-vs-reactive-forms-which-scales',
      tech: 'angular',
      title: 'Form Strategy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular share replay trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/rxjs-sharereplay-angular-how-it-breaks-your-app/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'rxjs-sharereplay-angular-how-it-breaks-your-app',
      tech: 'angular',
      title: 'Sticky Stream Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular http cancellation trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-http-what-actually-cancels-request/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-http-what-actually-cancels-request',
      tech: 'angular',
      title: 'Request Cancellation Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular hierarchical dependency injection trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/angular-hierarchical-dependency-injection-real-bug/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'angular-hierarchical-dependency-injection-real-bug',
      tech: 'angular',
      title: 'Duplicate Service Instance Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular subject variants trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/rxjs-subject-vs-behaviorsubject-vs-replaysubject-vs-asyncsubject/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'rxjs-subject-vs-behaviorsubject-vs-replaysubject-vs-asyncsubject',
      tech: 'angular',
      title: 'Late Subscriber State Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular tap vs map trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/rxjs-tap-vs-map-angular-when-to-use/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'rxjs-tap-vs-map-angular-when-to-use',
      tech: 'angular',
      title: 'Operator Intent Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngrx data flow trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/ngrx-data-flow-end-to-end-angular/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'ngrx-data-flow-end-to-end-angular',
      tech: 'angular',
      title: 'NgRx Flow Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngrx store vs component state trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/ngrx-store-vs-component-state-angular-when-to-use/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'ngrx-store-vs-component-state-angular-when-to-use',
      tech: 'angular',
      title: 'State Ownership Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngrx reducer purity trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/ngrx-reducer-pure-function-immutability-side-effects/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'ngrx-reducer-pure-function-immutability-side-effects',
      tech: 'angular',
      title: 'Reducer Purity Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for angular ngrx selectors memoization trivia question', async () => {
    const res = await request(app).get('/api/trivia/angular/ngrx-selectors-memoization-derived-state-performance/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'ngrx-selectors-memoization-derived-state-performance',
      tech: 'angular',
      title: 'Selector Memoization Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue reactivity vs react concepts trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-reactivity-vs-react-concepts/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-reactivity-vs-react-concepts',
      tech: 'vue',
      title: 'Reactivity Model Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue internal rendering pipeline trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-internal-rendering-pipeline/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-internal-rendering-pipeline',
      tech: 'vue',
      title: 'Render Pipeline Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue data must be function trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-data-must-be-function/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-data-must-be-function',
      tech: 'vue',
      title: 'Shared State Leak Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue reactive interpolation trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-reactive-interpolation-into-dom/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-reactive-interpolation-into-dom',
      tech: 'vue',
      title: 'Interpolation Update Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue v-bind reactive attributes trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-v-bind-reactive-attributes/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-v-bind-reactive-attributes',
      tech: 'vue',
      title: 'Binding Patch Logic Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue v-if component lifecycle trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-v-if-component-creation-destruction/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-v-if-component-creation-destruction',
      tech: 'vue',
      title: 'Toggle Lifecycle Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue v-for keys trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-v-for-keys/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-v-for-keys',
      tech: 'vue',
      title: 'List Identity Bug Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue v-model syntax sugar trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-v-model-syntax-sugar-expansion/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-v-model-syntax-sugar-expansion',
      tech: 'vue',
      title: 'Model Expansion Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue v-show vs v-if trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-v-show-vs-v-if-dom-lifecycle/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-v-show-vs-v-if-dom-lifecycle',
      tech: 'vue',
      title: 'Visibility Strategy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue computed properties trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-computed-properties/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-computed-properties',
      tech: 'vue',
      title: 'Derived State Caching Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue methods in templates trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-methods-in-templates/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-methods-in-templates',
      tech: 'vue',
      title: 'Template Method Cost Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue native vs component events trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-native-vs-component-events/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-native-vs-component-events',
      tech: 'vue',
      title: 'Event Boundary Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue architecture scalability trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-architecture-decisions-scalability/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-architecture-decisions-scalability',
      tech: 'vue',
      title: 'Scalability Architecture Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue computed vs watchers trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-computed-vs-watchers/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-computed-vs-watchers',
      tech: 'vue',
      title: 'Derived Value vs Effect Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue lifecycle hooks trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-lifecycle-hooks/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-lifecycle-hooks',
      tech: 'vue',
      title: 'Hook Timing Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue directives trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-directives/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-directives',
      tech: 'vue',
      title: 'Directive Behavior Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue v-bind v-on template syntax trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-v-bind-v-on-fundamental-template-syntax/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-v-bind-v-on-fundamental-template-syntax',
      tech: 'vue',
      title: 'Template Binding Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue child mutates prop directly trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-child-mutates-prop-directly/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-child-mutates-prop-directly',
      tech: 'vue',
      title: 'Prop Ownership Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue composition api vs mixins trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-composition-api-vs-mixins/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-composition-api-vs-mixins',
      tech: 'vue',
      title: 'Logic Reuse Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue sfc vs global components trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-sfc-vs-global-components/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-sfc-vs-global-components',
      tech: 'vue',
      title: 'Component Scope Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue conditional list rendering trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-conditional-list-rendering/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-conditional-list-rendering',
      tech: 'vue',
      title: 'Render Strategy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue router navigation trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-router-navigation/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-router-navigation',
      tech: 'vue',
      title: 'Navigation Flow Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue reactivity system trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-reactivity-system/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-reactivity-system',
      tech: 'vue',
      title: 'Reactivity Model Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue composition api trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-composition-api/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-composition-api',
      tech: 'vue',
      title: 'Composition API Reasoning Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vuex state management trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vuex-state-management/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vuex-state-management',
      tech: 'vue',
      title: 'Shared State Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue virtual dom diffing trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-virtual-dom-diffing/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-virtual-dom-diffing',
      tech: 'vue',
      title: 'Diffing Strategy Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue slots trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-slots-default-named-scoped-slot-props/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-slots-default-named-scoped-slot-props',
      tech: 'vue',
      title: 'Slot Design Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue provide inject tradeoffs trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-provide-inject-vs-prop-drilling-tradeoffs/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-provide-inject-vs-prop-drilling-tradeoffs',
      tech: 'vue',
      title: 'Dependency Wiring Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue declare emits trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-why-declare-emits-type-safety-maintenance/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-why-declare-emits-type-safety-maintenance',
      tech: 'vue',
      title: 'Emit Contract Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for vue ref vs reactive trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-ref-vs-reactive-difference-traps/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'vue-ref-vs-reactive-difference-traps',
      tech: 'vue',
      title: 'State Primitive Choice Check',
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

  test('returns public incident card for react core problem and non goals trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-core-problem-and-non-goals/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-core-problem-and-non-goals',
      tech: 'react',
      title: 'React Scope Decision Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react pure function of props and state trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-pure-function-of-props-and-state/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-pure-function-of-props-and-state',
      tech: 'react',
      title: 'Render Purity Reality Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react functional vs class components trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-functional-vs-class-components/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-functional-vs-class-components',
      tech: 'react',
      title: 'Hooks vs Class Migration Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react jsx transform and why not required trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-jsx-transform-and-why-not-required/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-jsx-transform-and-why-not-required',
      tech: 'react',
      title: 'JSX Runtime Config Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react function treated as component rules trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-function-treated-as-component-rules/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-function-treated-as-component-rules',
      tech: 'react',
      title: 'Component Invocation Rules Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react rerender decision and render trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-rerender-decision-and-render/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-rerender-decision-and-render',
      tech: 'react',
      title: 'Render vs Commit Reality Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react render nothing return value trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-render-nothing-return-value/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-render-nothing-return-value',
      tech: 'react',
      title: 'Render Nothing Edge Case Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react one way data flow trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-one-way-data-flow/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-one-way-data-flow',
      tech: 'react',
      title: 'One-Way Data Flow Ownership Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react why props immutable trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-why-props-immutable/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-why-props-immutable',
      tech: 'react',
      title: 'Props Immutability Bug Check',
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

  test('returns public incident card for react higher order components trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-higher-order-components/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-higher-order-components',
      tech: 'react',
      title: 'HOC Composition Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react usememo vs usecallback trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-usememo-vs-usecallback/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-usememo-vs-usecallback',
      tech: 'react',
      title: 'Memo Hook Choice Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react prevent unnecessary rerenders trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-prevent-unnecessary-rerenders/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-prevent-unnecessary-rerenders',
      tech: 'react',
      title: 'Rerender Scope Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react strictmode purpose trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-strictmode-purpose/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-strictmode-purpose',
      tech: 'react',
      title: 'StrictMode Dev Signal Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react reconciliation trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-reconciliation/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-reconciliation',
      tech: 'react',
      title: 'Reconciliation Reset Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react diffing algorithm trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-diffing-algorithm/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-diffing-algorithm',
      tech: 'react',
      title: 'Diffing Identity Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react render props vs hocs trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-render-props-vs-hocs/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-render-props-vs-hocs',
      tech: 'react',
      title: 'Render Control Pattern Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react portals trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-portals/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-portals',
      tech: 'react',
      title: 'Portal Event Path Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react concurrent rendering trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-concurrent-rendering/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-concurrent-rendering',
      tech: 'react',
      title: 'Concurrent Priority Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react why hooks have rules trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-why-hooks-have-rules/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-why-hooks-have-rules',
      tech: 'react',
      title: 'Hook Order Drift Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react stale state closures trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-stale-state-closures/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-stale-state-closures',
      tech: 'react',
      title: 'Stale Closure Snapshot Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react useref vs usestate trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-useref-vs-usestate/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-useref-vs-usestate',
      tech: 'react',
      title: 'Ref vs State Ownership Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react batching state updates trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-why-batching-state-updates/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-why-batching-state-updates',
      tech: 'react',
      title: 'Batching Snapshot Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react derived state anti pattern trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-derived-state-anti-pattern/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-derived-state-anti-pattern',
      tech: 'react',
      title: 'Derived State Drift Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react context performance issues trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-context-performance-issues/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-context-performance-issues',
      tech: 'react',
      title: 'Context Fan-out Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react error boundaries trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-error-boundaries-what-they-solve/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-error-boundaries-what-they-solve',
      tech: 'react',
      title: 'Error Boundary Coverage Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react strictmode double invoke effects trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-strictmode-double-invoke-effects/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-strictmode-double-invoke-effects',
      tech: 'react',
      title: 'StrictMode Cleanup Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react useeffect vs uselayouteffect trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-useeffect-vs-uselayouteffect/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-useeffect-vs-uselayouteffect',
      tech: 'react',
      title: 'Layout Flicker Timing Root Cause Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react hooks youve used trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-hooks-youve-used/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-hooks-youve-used',
      tech: 'react',
      title: 'Hook Choice Under Pressure Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns public incident card for react 18 whats new trivia question', async () => {
    const res = await request(app).get('/api/trivia/react/react-18-whats-new/incident');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      questionId: 'react-18-whats-new',
      tech: 'react',
      title: 'React 18 Responsiveness Choice Check',
      scenario: expect.any(String),
      options: expect.any(Array),
    }));
    expect(res.body.options).toHaveLength(3);
    expect(res.body.correctOptionId).toBeUndefined();
  });

  test('returns 404 when incident card is not configured for a trivia question', async () => {
    const res = await request(app).get('/api/trivia/vue/vue-destructuring-breaks-reactivity-torefs-toref/incident');
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
