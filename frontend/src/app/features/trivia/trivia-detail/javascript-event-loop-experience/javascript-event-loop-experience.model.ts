import {
  CORRECT_CHECKPOINT_ID,
  CORRECT_PAINT_ID,
  CORRECT_PREDICTION_ID,
  CheckpointChoiceId,
  PaintChoiceId,
  PredictionChoiceId,
} from './javascript-event-loop-experience.content';

export type ExperiencePhase =
  | 'prediction'
  | 'trace-ready'
  | 'checkpoint'
  | 'microtask-ready'
  | 'paint'
  | 'next-task-ready'
  | 'complete';

export interface EventLoopExperienceState {
  readonly attempt: number;
  readonly phase: ExperiencePhase;
  readonly traceStep: 0 | 1 | 2 | 3;
  readonly predictionSelection: PredictionChoiceId | null;
  readonly checkpointSelection: CheckpointChoiceId | null;
  readonly paintSelection: PaintChoiceId | null;
  readonly predictionCorrect: boolean | null;
  readonly checkpointCorrect: boolean | null;
  readonly paintCorrect: boolean | null;
}

export type EventLoopExperienceAction =
  | { readonly type: 'select-prediction'; readonly choice: PredictionChoiceId }
  | { readonly type: 'submit-prediction' }
  | { readonly type: 'start-trace' }
  | { readonly type: 'select-checkpoint'; readonly choice: CheckpointChoiceId }
  | { readonly type: 'submit-checkpoint' }
  | { readonly type: 'drain-microtasks' }
  | { readonly type: 'select-paint'; readonly choice: PaintChoiceId }
  | { readonly type: 'submit-paint' }
  | { readonly type: 'finish-trace' }
  | { readonly type: 'replay' };

export function createEventLoopExperienceState(attempt = 1): EventLoopExperienceState {
  return {
    attempt,
    phase: 'prediction',
    traceStep: 0,
    predictionSelection: null,
    checkpointSelection: null,
    paintSelection: null,
    predictionCorrect: null,
    checkpointCorrect: null,
    paintCorrect: null,
  };
}

export function reduceEventLoopExperience(
  state: EventLoopExperienceState,
  action: EventLoopExperienceAction,
): EventLoopExperienceState {
  switch (action.type) {
    case 'select-prediction':
      return state.phase === 'prediction'
        ? { ...state, predictionSelection: action.choice }
        : state;
    case 'submit-prediction':
      return state.phase === 'prediction' && state.predictionSelection
        ? {
            ...state,
            phase: 'trace-ready',
            predictionCorrect: state.predictionSelection === CORRECT_PREDICTION_ID,
          }
        : state;
    case 'start-trace':
      return state.phase === 'trace-ready'
        ? { ...state, phase: 'checkpoint', traceStep: 1 }
        : state;
    case 'select-checkpoint':
      return state.phase === 'checkpoint'
        ? { ...state, checkpointSelection: action.choice }
        : state;
    case 'submit-checkpoint':
      return state.phase === 'checkpoint' && state.checkpointSelection
        ? {
            ...state,
            phase: 'microtask-ready',
            checkpointCorrect: state.checkpointSelection === CORRECT_CHECKPOINT_ID,
          }
        : state;
    case 'drain-microtasks':
      return state.phase === 'microtask-ready'
        ? { ...state, phase: 'paint', traceStep: 2 }
        : state;
    case 'select-paint':
      return state.phase === 'paint'
        ? { ...state, paintSelection: action.choice }
        : state;
    case 'submit-paint':
      return state.phase === 'paint' && state.paintSelection
        ? {
            ...state,
            phase: 'next-task-ready',
            paintCorrect: state.paintSelection === CORRECT_PAINT_ID,
          }
        : state;
    case 'finish-trace':
      return state.phase === 'next-task-ready'
        ? { ...state, phase: 'complete', traceStep: 3 }
        : state;
    case 'replay':
      return state.phase === 'complete'
        ? createEventLoopExperienceState(state.attempt + 1)
        : state;
  }
}

export function eventLoopExperienceScore(state: EventLoopExperienceState): number {
  return [state.predictionCorrect, state.checkpointCorrect, state.paintCorrect]
    .filter((result) => result === true).length;
}
