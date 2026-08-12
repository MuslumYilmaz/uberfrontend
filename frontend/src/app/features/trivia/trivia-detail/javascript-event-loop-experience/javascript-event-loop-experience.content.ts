export type PredictionChoiceId = 'timer-first' | 'promise-first' | 'source-order';
export type CheckpointChoiceId = 'microtask' | 'timer' | 'render';
export type PaintChoiceId = 'after-each-microtask' | 'when-queue-empties' | 'timer-deadline';

export interface ExperienceChoice<Id extends string> {
  readonly id: Id;
  readonly label: string;
}

export interface EventLoopSnapshot {
  readonly lastTransition: string;
  readonly currentTask: string;
  readonly microtasks: readonly string[];
  readonly timerTasks: readonly string[];
  readonly renderOpportunity: string;
  readonly consoleOutput: readonly string[];
}

export const EVENT_LOOP_CODE = `console.log('start');

setTimeout(() => console.log('timer'), 0);

Promise.resolve().then(() => console.log('promise'));

console.log('end');`;

export const PREDICTION_CHOICES: readonly ExperienceChoice<PredictionChoiceId>[] = [
  { id: 'timer-first', label: 'start → timer → promise → end' },
  { id: 'promise-first', label: 'start → end → promise → timer' },
  { id: 'source-order', label: 'start → end → timer → promise' },
];

export const CHECKPOINT_CHOICES: readonly ExperienceChoice<CheckpointChoiceId>[] = [
  { id: 'microtask', label: 'The Promise microtask' },
  { id: 'timer', label: 'The zero-delay timer task' },
  { id: 'render', label: 'A guaranteed browser paint' },
];

export const PAINT_CHOICES: readonly ExperienceChoice<PaintChoiceId>[] = [
  { id: 'after-each-microtask', label: 'After every microtask callback' },
  { id: 'when-queue-empties', label: 'Only if the microtask queue eventually becomes empty' },
  { id: 'timer-deadline', label: 'As soon as the zero-delay timer becomes eligible' },
];

export const CORRECT_PREDICTION_ID: PredictionChoiceId = 'promise-first';
export const CORRECT_CHECKPOINT_ID: CheckpointChoiceId = 'microtask';
export const CORRECT_PAINT_ID: PaintChoiceId = 'when-queue-empties';

export const EVENT_LOOP_SNAPSHOTS: readonly EventLoopSnapshot[] = [
  {
    lastTransition: 'Waiting for you to start the trace',
    currentTask: 'Initial script is ready',
    microtasks: [],
    timerTasks: [],
    renderOpportunity: 'Not evaluated yet',
    consoleOutput: [],
  },
  {
    lastTransition: "console.log('end')",
    currentTask: 'Initial script has run to completion',
    microtasks: ['Promise callback → log promise'],
    timerTasks: ['setTimeout callback → log timer'],
    renderOpportunity: 'Waits for the microtask checkpoint',
    consoleOutput: ['start', 'end'],
  },
  {
    lastTransition: "Promise callback → console.log('promise')",
    currentTask: 'No JavaScript task is running',
    microtasks: [],
    timerTasks: ['setTimeout callback → log timer'],
    renderOpportunity: 'The browser may render before choosing another task',
    consoleOutput: ['start', 'end', 'promise'],
  },
  {
    lastTransition: "Timer callback → console.log('timer')",
    currentTask: 'Timer task has run to completion',
    microtasks: [],
    timerTasks: [],
    renderOpportunity: 'A later render opportunity may follow',
    consoleOutput: ['start', 'end', 'promise', 'timer'],
  },
];

export const FINAL_TAKEAWAY =
  'current task → drain microtasks → browser may render → next task';
