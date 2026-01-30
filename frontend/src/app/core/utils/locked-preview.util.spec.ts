import { buildLockedPreviewForCoding, buildLockedPreviewForTrivia, buildLockedPreviewForSystemDesign } from './locked-preview.util';
import { Question } from '../models/question.model';

describe('locked preview builder', () => {
  it('builds a rich coding preview with required sections', () => {
    const q: Question = {
      id: 'js-sum-numbers',
      title: 'Sum Numbers',
      type: 'coding',
      technology: 'javascript',
      access: 'premium',
      difficulty: 'easy',
      tags: ['arrays', 'numbers', 'immutability'],
      importance: 3,
      description: {
        summary: 'Sum only numeric values in an array without mutating it.',
        arguments: [{ name: 'arr' }],
      },
      starterCode: 'export default function sumNumbers(arr) {\n  // TODO\n}',
    };

    const candidates = [
      { id: 'js-count-vowels', title: 'Count Vowels', access: 'free' as const, technology: 'javascript', type: 'coding', tags: ['strings'] },
      { id: 'js-unique-array', title: 'Remove Duplicates', access: 'premium' as const, technology: 'javascript', type: 'coding', tags: ['arrays'] },
    ];

    const preview = buildLockedPreviewForCoding(q, { candidates, tech: 'javascript', kind: 'coding' });

    expect(preview.what.length).toBeGreaterThan(30);
    expect(preview.learningGoals.length).toBeGreaterThanOrEqual(3);
    expect(preview.constraints.length).toBeGreaterThanOrEqual(4);
    expect(preview.snippet.lines.length).toBeGreaterThanOrEqual(8);
    expect(preview.snippet.lines.length).toBeLessThanOrEqual(20);
    expect(preview.pitfalls.length).toBeGreaterThanOrEqual(3);
    expect(preview.related.length).toBeGreaterThan(0);
    expect(preview.related[0].title).toBe('Count Vowels');
  });

  it('builds a trivia preview without relying on answers', () => {
    const q: Question = {
      id: 'css-specificity',
      title: 'What is CSS specificity?',
      type: 'trivia',
      technology: 'css',
      access: 'premium',
      difficulty: 'easy',
      tags: ['css', 'specificity', 'selectors'],
      importance: 2,
      description: 'Explain how browsers decide which CSS rule wins.',
    };

    const candidates = [
      { id: 'css-cascade', title: 'What is the CSS cascade?', access: 'free' as const, technology: 'css', type: 'trivia', tags: ['css', 'cascade'] },
    ];

    const preview = buildLockedPreviewForTrivia(q, { candidates, tech: 'css', kind: 'trivia' });

    expect(preview.learningGoals.length).toBeGreaterThanOrEqual(3);
    expect(preview.constraints.length).toBeGreaterThanOrEqual(4);
    expect(preview.snippet.lines.length).toBeGreaterThanOrEqual(8);
  });

  it('builds a system design preview with related links', () => {
    const q = {
      id: 'live-comments',
      title: 'Live Comments for Global Streams',
      description: 'Design a real-time comment system for a global live stream UI.',
      tags: ['realtime', 'websocket', 'moderation'],
    };

    const candidates = [
      { id: 'endless-feed', title: 'Endless Short-Video Feed', access: 'free' as const, type: 'system-design', tags: ['feeds', 'pagination'] },
      { id: 'notif-feed', title: 'Scalable Notifications Feed', access: 'premium' as const, type: 'system-design', tags: ['notifications'] },
    ];

    const preview = buildLockedPreviewForSystemDesign(q, { candidates });

    expect(preview.what.length).toBeGreaterThan(30);
    expect(preview.related.length).toBeGreaterThan(0);
    expect(preview.related[0].to[1]).toBe('system-design');
  });
});
