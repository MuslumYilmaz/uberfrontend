import { Question } from '../models/question.model';

const REFERENCE_ONLY_HEADING_RE =
  /^\s*#{1,6}\s*(?:source\s+check|primary\s+sources?|official\s+sources?|references?|further\s+reading)\s*#*\s*(?:\r?\n|$)/i;

export function isTriviaReferenceOnlyBlock(block: unknown): boolean {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return false;
  const candidate = block as { type?: unknown; text?: unknown };
  return candidate.type === 'text'
    && typeof candidate.text === 'string'
    && REFERENCE_ONLY_HEADING_RE.test(candidate.text);
}

/**
 * Keep source-review material in the editorial catalog while excluding
 * reference-only sections from the public trivia route and TransferState.
 */
export function stripTriviaReferenceOnlyBlocks(question: Question): Question {
  const answer = (question as Question & { answer?: unknown }).answer;
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return question;

  const blocks = (answer as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks)) return question;

  const publicBlocks = blocks.filter((block) => !isTriviaReferenceOnlyBlock(block));
  if (publicBlocks.length === blocks.length) return question;

  return {
    ...question,
    answer: {
      ...(answer as Record<string, unknown>),
      blocks: publicBlocks,
    } as unknown as Question['answer'],
  };
}
