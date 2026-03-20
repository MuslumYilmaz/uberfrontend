import {
  IncidentMultiSelectStage,
  IncidentPriorityOrderStage,
  IncidentSingleSelectStage,
} from '../models/incident.model';
import { evaluateIncidentAttempt, evaluateIncidentStage } from './incident-scoring.util';

describe('incident-scoring.util', () => {
  it('scores a single-select stage from the selected option points', () => {
    const stage: IncidentSingleSelectStage = {
      id: 'root-cause',
      type: 'single-select',
      title: 'Root cause',
      prompt: 'Pick one',
      options: [
        { id: 'a', label: 'A', points: 25, feedback: 'correct' },
        { id: 'b', label: 'B', points: 0, feedback: 'nope' },
      ],
    };

    const result = evaluateIncidentStage(stage, 'a');

    expect(result.rawScore).toBe(25);
    expect(result.maxScore).toBe(25);
    expect(result.scorePercent).toBe(100);
    expect(result.optionFeedback[0]?.feedback).toBe('correct');
  });

  it('applies harmful multi-select choices and clamps the stage score at zero', () => {
    const stage: IncidentMultiSelectStage = {
      id: 'fix-set',
      type: 'multi-select',
      title: 'Fixes',
      prompt: 'Pick all',
      options: [
        { id: 'safe', label: 'Safe', points: 10, feedback: 'good' },
        { id: 'harmful', label: 'Harmful', points: -20, feedback: 'bad', isHarmful: true },
      ],
    };

    const result = evaluateIncidentStage(stage, ['safe', 'harmful']);

    expect(result.rawScore).toBe(0);
    expect(result.maxScore).toBe(10);
    expect(result.optionFeedback.some((item) => item.isHarmful)).toBeTrue();
  });

  it('scores priority-order slots only when the correct item is in the correct slot', () => {
    const stage: IncidentPriorityOrderStage = {
      id: 'debug-order',
      type: 'priority-order',
      title: 'Order',
      prompt: 'Sort',
      candidates: [
        { id: 'one', label: 'One' },
        { id: 'two', label: 'Two' },
        { id: 'three', label: 'Three' },
      ],
      expectedOrder: ['one', 'two', 'three'],
      slotWeights: [12, 8, 5],
    };

    const result = evaluateIncidentStage(stage, ['two', 'one', 'three']);

    expect(result.rawScore).toBe(5);
    expect(result.priorityFeedback[0]?.matched).toBeFalse();
    expect(result.priorityFeedback[2]?.matched).toBeTrue();
  });

  it('calculates total score and pass threshold for a full attempt', () => {
    const stages = [
      {
        id: 's1',
        type: 'single-select',
        title: 'One',
        prompt: 'One',
        options: [
          { id: 'right', label: 'Right', points: 25, feedback: 'ok' },
          { id: 'wrong', label: 'Wrong', points: 0, feedback: 'no' },
        ],
      } satisfies IncidentSingleSelectStage,
      {
        id: 's2',
        type: 'priority-order',
        title: 'Two',
        prompt: 'Two',
        candidates: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
          { id: 'c', label: 'C' },
        ],
        expectedOrder: ['a', 'b', 'c'],
        slotWeights: [12, 8, 5],
      } satisfies IncidentPriorityOrderStage,
      {
        id: 's3',
        type: 'multi-select',
        title: 'Three',
        prompt: 'Three',
        options: [
          { id: 'x', label: 'X', points: 10, feedback: 'x' },
          { id: 'y', label: 'Y', points: 10, feedback: 'y' },
          { id: 'z', label: 'Z', points: 5, feedback: 'z' },
        ],
      } satisfies IncidentMultiSelectStage,
      {
        id: 's4',
        type: 'single-select',
        title: 'Four',
        prompt: 'Four',
        options: [
          { id: 'yes', label: 'Yes', points: 25, feedback: 'yes' },
          { id: 'no', label: 'No', points: 0, feedback: 'no' },
        ],
      } satisfies IncidentSingleSelectStage,
    ];

    const result = evaluateIncidentAttempt(stages, {
      s1: 'right',
      s2: ['a', 'b', 'c'],
      s3: ['x', 'y'],
      s4: 'yes',
    });

    expect(result.score).toBe(95);
    expect(result.passed).toBeTrue();
  });
});
