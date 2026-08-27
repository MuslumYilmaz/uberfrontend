'use strict';

const InterviewContentExposure = require('../models/InterviewContentExposure');

describe('InterviewContentExposure schema', () => {
  test('stores only selection identities and has target/history/TTL indexes', () => {
    const paths = Object.keys(InterviewContentExposure.schema.paths);
    expect(paths).toEqual(expect.arrayContaining([
      'userId',
      'sessionId',
      'format',
      'track',
      'level',
      'selectionPolicyVersion',
      'mcq',
      'coding',
      'systemDesign',
      'exposedAt',
      'expiresAt',
    ]));
    expect(paths).not.toEqual(expect.arrayContaining([
      'answerKey',
      'codingDraft',
      'systemDesignDraft',
      'resultSnapshot',
    ]));

    const indexes = InterviewContentExposure.schema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      [{ sessionId: 1 }, expect.objectContaining({ unique: true })],
      [
        { userId: 1, format: 1, track: 1, level: 1, exposedAt: -1 },
        expect.any(Object),
      ],
      [{ userId: 1, exposedAt: -1 }, expect.any(Object)],
      [{ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })],
    ]));
  });

  test('requires semantic identities without storing prompt text', () => {
    const doc = new InterviewContentExposure({
      userId: '507f1f77bcf86cd799439011',
      sessionId: '507f191e810c19729de860ea',
      format: 'coding',
      track: 'react',
      level: 'mid',
      selectionPolicyVersion: 2,
      mcq: [{
        id: 'mcq-1',
        revision: 1,
        contentHash: 'hash-1',
        conceptId: 'mcq:javascript:event-loop-ordering',
      }],
      coding: {
        id: 'coding-1',
        conceptId: 'coding:abortable-search',
        sourceContentId: 'source-1',
        contentHash: 'hash-2',
      },
      artifacts: {
        bank: { id: 'bank', version: '1.2.0', contentHash: 'hash-bank' },
        coding: { id: 'coding', version: '2.0.0', contentHash: 'hash-coding' },
      },
      exposedAt: new Date('2026-08-24T00:00:00.000Z'),
      expiresAt: new Date('2027-08-24T00:00:00.000Z'),
    });

    const error = doc.validateSync();
    expect(error).toBeUndefined();
    const serialized = doc.toObject();
    expect(JSON.stringify(serialized)).not.toMatch(/prompt|answer|draft|resultSnapshot/i);
    expect(serialized.mcq[0].conceptId).toBe('mcq:javascript:event-loop-ordering');
  });
});
