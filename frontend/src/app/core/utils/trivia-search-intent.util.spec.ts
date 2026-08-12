import { Question } from '../models/question.model';
import {
  isTriviaReferenceOnlyBlock,
  stripTriviaReferenceOnlyBlocks,
} from './trivia-search-intent.util';

function questionWithBlocks(blocks: unknown[]): Question {
  return {
    id: 'reference-intent-test',
    title: 'How does the browser event loop work?',
    answer: { blocks } as unknown as Question['answer'],
    type: 'trivia',
    technology: 'javascript',
    access: 'free',
    difficulty: 'intermediate',
    tags: ['javascript'],
    importance: 3,
  };
}

describe('trivia search intent utilities', () => {
  it('recognizes reference-only sections without matching ordinary technical prose', () => {
    expect(isTriviaReferenceOnlyBlock({ type: 'text', text: '## Source check\n\nRead MDN.' })).toBeTrue();
    expect(isTriviaReferenceOnlyBlock({ type: 'text', text: '## Primary sources\n\nRead the specification.' })).toBeTrue();
    expect(isTriviaReferenceOnlyBlock({ type: 'text', text: '## Source of truth\n\nKeep one owner.' })).toBeFalse();
    expect(isTriviaReferenceOnlyBlock({ type: 'text', text: '## References vs values\n\nCompare identity.' })).toBeFalse();
    expect(isTriviaReferenceOnlyBlock({
      type: 'text',
      text: '## Absolute vs relative URLs\n\nAn example may link to MDN.',
    })).toBeFalse();
  });

  it('removes only reference-only blocks and leaves the catalog object untouched', () => {
    const sourceBlock = { type: 'text', text: '## Source check\n\nRead the official guide.' };
    const answerBlock = { type: 'text', text: '## Interview answer\n\nExplain ownership first.' };
    const question = questionWithBlocks([answerBlock, sourceBlock]);

    const publicQuestion = stripTriviaReferenceOnlyBlocks(question);

    expect((publicQuestion.answer as any).blocks).toEqual([answerBlock]);
    expect((question.answer as any).blocks).toEqual([answerBlock, sourceBlock]);
  });

  it('preserves questions that do not contain a reference-only section', () => {
    const question = questionWithBlocks([
      { type: 'text', text: '## Full interview answer\n\nUse a concrete example.' },
    ]);

    expect(stripTriviaReferenceOnlyBlocks(question)).toBe(question);
  });
});
