import {
  IncidentMultiSelectStage,
  IncidentOption,
  IncidentPriorityOrderStage,
  IncidentSingleSelectStage,
  IncidentStage,
} from '../models/incident.model';

export interface IncidentOptionFeedback {
  id: string;
  label: string;
  feedback: string;
  points: number;
  isHarmful: boolean;
}

export interface IncidentPriorityFeedback {
  slot: number;
  weight: number;
  expectedId: string;
  expectedLabel: string;
  actualId: string | null;
  actualLabel: string | null;
  matched: boolean;
}

export interface IncidentStageEvaluation {
  stageId: string;
  rawScore: number;
  maxScore: number;
  scorePercent: number;
  optionFeedback: IncidentOptionFeedback[];
  priorityFeedback: IncidentPriorityFeedback[];
}

export interface IncidentAttemptEvaluation {
  rawScore: number;
  maxScore: number;
  score: number;
  passed: boolean;
  stageResults: Record<string, IncidentStageEvaluation>;
}

function clampScore(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > max) return max;
  return Math.round(value);
}

function calculateMaxOptionScore(options: IncidentOption[]): number {
  return options.reduce((sum, option) => sum + Math.max(0, option.points), 0);
}

function optionFeedbackForSelection(
  options: IncidentOption[],
  selectedIds: string[],
): IncidentOptionFeedback[] {
  const selectedSet = new Set(selectedIds);
  return options
    .filter((option) => selectedSet.has(option.id))
    .map((option) => ({
      id: option.id,
      label: option.label,
      feedback: option.feedback,
      points: option.points,
      isHarmful: option.isHarmful === true,
    }));
}

function evaluateSingleSelectStage(
  stage: IncidentSingleSelectStage,
  answer: string | string[] | undefined,
): IncidentStageEvaluation {
  const selectedId = typeof answer === 'string' ? answer : '';
  const selectedOption = stage.options.find((option) => option.id === selectedId) ?? null;
  const maxScore = calculateMaxOptionScore(stage.options);
  const rawScore = clampScore(selectedOption?.points ?? 0, maxScore);

  return {
    stageId: stage.id,
    rawScore,
    maxScore,
    scorePercent: maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0,
    optionFeedback: selectedOption ? optionFeedbackForSelection(stage.options, [selectedId]) : [],
    priorityFeedback: [],
  };
}

function evaluateMultiSelectStage(
  stage: IncidentMultiSelectStage,
  answer: string | string[] | undefined,
): IncidentStageEvaluation {
  const selectedIds = Array.isArray(answer)
    ? Array.from(new Set(answer.filter((value) => typeof value === 'string' && value.trim())))
    : [];
  const maxScore = calculateMaxOptionScore(stage.options);
  const rawScore = clampScore(
    stage.options
      .filter((option) => selectedIds.includes(option.id))
      .reduce((sum, option) => sum + option.points, 0),
    maxScore,
  );

  return {
    stageId: stage.id,
    rawScore,
    maxScore,
    scorePercent: maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0,
    optionFeedback: optionFeedbackForSelection(stage.options, selectedIds),
    priorityFeedback: [],
  };
}

function evaluatePriorityOrderStage(
  stage: IncidentPriorityOrderStage,
  answer: string | string[] | undefined,
): IncidentStageEvaluation {
  const ranking = Array.isArray(answer) ? answer : [];
  const candidateMap = new Map(stage.candidates.map((candidate) => [candidate.id, candidate.label] as const));
  const slotCount = Math.min(stage.expectedOrder.length, stage.slotWeights.length);
  const maxScore = stage.slotWeights.slice(0, slotCount).reduce((sum, weight) => sum + Math.max(0, weight), 0);

  const priorityFeedback: IncidentPriorityFeedback[] = [];
  let raw = 0;

  for (let index = 0; index < slotCount; index += 1) {
    const expectedId = stage.expectedOrder[index] ?? '';
    const actualId = ranking[index] ?? null;
    const weight = stage.slotWeights[index] ?? 0;
    const matched = actualId === expectedId;
    if (matched) raw += weight;
    priorityFeedback.push({
      slot: index + 1,
      weight,
      expectedId,
      expectedLabel: candidateMap.get(expectedId) ?? expectedId,
      actualId,
      actualLabel: actualId ? candidateMap.get(actualId) ?? actualId : null,
      matched,
    });
  }

  const rawScore = clampScore(raw, maxScore);
  return {
    stageId: stage.id,
    rawScore,
    maxScore,
    scorePercent: maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0,
    optionFeedback: [],
    priorityFeedback,
  };
}

export function evaluateIncidentStage(
  stage: IncidentStage,
  answer: string | string[] | undefined,
): IncidentStageEvaluation {
  switch (stage.type) {
    case 'single-select':
      return evaluateSingleSelectStage(stage, answer);
    case 'multi-select':
      return evaluateMultiSelectStage(stage, answer);
    case 'priority-order':
      return evaluatePriorityOrderStage(stage, answer);
    default: {
      const exhaustive: never = stage;
      return exhaustive;
    }
  }
}

export function evaluateIncidentAttempt(
  stages: IncidentStage[],
  answers: Record<string, string | string[]>,
): IncidentAttemptEvaluation {
  const stageResults = stages.reduce<Record<string, IncidentStageEvaluation>>((acc, stage) => {
    acc[stage.id] = evaluateIncidentStage(stage, answers[stage.id]);
    return acc;
  }, {});

  const rawScore = Object.values(stageResults).reduce((sum, result) => sum + result.rawScore, 0);
  const maxScore = Object.values(stageResults).reduce((sum, result) => sum + result.maxScore, 0);
  const score = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

  return {
    rawScore,
    maxScore,
    score,
    passed: score >= 70,
    stageResults,
  };
}
