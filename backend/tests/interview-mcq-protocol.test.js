'use strict';

const {
  evaluateMcqMutationAdmission,
} = require('../services/interview/state-machine');

describe('Interview MCQ protocol V2 admission', () => {
  const deadline = new Date('2026-08-24T12:00:10.000Z');

  function session(maxIngressSeconds = 5) {
    return {
      mcqDeadlineAt: deadline,
      timingPolicy: { mcqMaxIngressSeconds: maxIngressSeconds },
    };
  }

  test('admits a request received before the deadline when its body completes within 5 seconds', () => {
    const admission = evaluateMcqMutationAdmission(session(), {
      requestReceivedAt: new Date('2026-08-24T12:00:09.000Z'),
      requestCompletedAt: new Date('2026-08-24T12:00:12.000Z'),
      config: { mcqMaxIngressSeconds: 30 },
    });

    expect(admission).toEqual(expect.objectContaining({
      accepted: true,
      maxIngressSeconds: 5,
    }));
    expect(admission.acceptedAt).toEqual(deadline);
  });

  test('rejects a request that first arrives after the server deadline', () => {
    const admission = evaluateMcqMutationAdmission(session(), {
      requestReceivedAt: new Date('2026-08-24T12:00:10.001Z'),
      requestCompletedAt: new Date('2026-08-24T12:00:10.100Z'),
      config: { mcqMaxIngressSeconds: 5 },
    });

    expect(admission).toEqual(expect.objectContaining({
      accepted: false,
      code: 'INTERVIEW_MCQ_DEADLINE_PASSED',
    }));
  });

  test('rejects slow ingress using the session snapshot instead of mutable config', () => {
    const admission = evaluateMcqMutationAdmission(session(2), {
      requestReceivedAt: new Date('2026-08-24T12:00:06.000Z'),
      requestCompletedAt: new Date('2026-08-24T12:00:08.001Z'),
      config: { mcqMaxIngressSeconds: 5 },
    });

    expect(admission).toEqual(expect.objectContaining({
      accepted: false,
      code: 'INTERVIEW_MCQ_INGRESS_TIMEOUT',
      maxIngressSeconds: 2,
    }));
  });
});
