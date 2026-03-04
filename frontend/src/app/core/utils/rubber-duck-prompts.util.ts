import type { FailureCategory } from '../models/editor-assist.model';

const CATEGORY_FOCUS: Record<FailureCategory, string> = {
  'missing-return': 'return path coverage',
  'undefined-access': 'null/undefined guarding',
  'wrong-function-call': 'symbol wiring and invocation target',
  'type-mismatch': 'input/output type normalization',
  'off-by-one': 'index boundaries and loop limits',
  'async-promise-mismatch': 'promise lifecycle and awaiting',
  'reference-error': 'declaration scope and naming',
  'assertion-mismatch': 'expected vs actual output shape',
  'syntax-error': 'parsing correctness and bracket balance',
  'timeout': 'termination and algorithmic complexity',
  'mutability-side-effect': 'immutable updates vs shared references',
  'edge-case': 'empty/boundary/sentinel inputs',
  unknown: 'core control flow',
};

export function buildRubberDuckPrompts(input: {
  category: FailureCategory;
  questionTitle?: string;
  tags?: string[];
  errorLine?: string;
}): string[] {
  const focus = CATEGORY_FOCUS[input.category] || CATEGORY_FOCUS.unknown;
  const title = String(input.questionTitle || 'this question');
  const tagHint = Array.isArray(input.tags) && input.tags.length
    ? ` (tags: ${input.tags.slice(0, 3).join(', ')})`
    : '';
  const errorLine = String(input.errorLine || '').trim();

  return [
    `Step 1 · Clarify: In one sentence, what should your function do for ${title}${tagHint}?`,
    `Step 2 · Isolate: Which line likely triggers the failure related to ${focus}?`,
    `Step 3 · Inspect state: What are the key variable values right before that line executes?`,
    `Step 4 · Minimal fix: What is the smallest code change that addresses this without rewriting everything?`,
    `Step 5 · Validate: Which edge case will you run next to confirm the fix?${errorLine ? ` (Current error: ${errorLine})` : ''}`,
  ];
}
