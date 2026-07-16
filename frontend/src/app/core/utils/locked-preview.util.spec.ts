import {
  buildLockedPreviewForCoding,
  CodingLockedPreviewQuestion,
  buildLockedPreviewForIncident,
  buildLockedPreviewForTradeoff,
  buildLockedPreviewForTrivia,
  buildLockedPreviewForSystemDesign,
  normalizeEditorialPlainText,
} from './locked-preview.util';
import { Question } from '../models/question.model';

describe('locked preview builder', () => {
  it('strips known editorial markup while preserving comparator, generic, and JSX-like text', () => {
    expect(normalizeEditorialPlainText(
      '<strong>Thresholds:</strong> &lt;34 red, 34–66 orange, &gt;66 green; Array<T>; <ProgressBar /> &amp; ready.'
    )).toBe('Thresholds: <34 red, 34–66 orange, >66 green; Array<T>; <ProgressBar /> & ready.');

    expect(normalizeEditorialPlainText(
      '<p><em>Literal:</em> <34, >66, &#60;T&#62;, and &lt;Widget /&gt;.</p>'
    )).toBe('Literal: <34, >66, <T>, and <Widget />.');
  });

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
      premiumPreview: {
        summary: 'Sum numeric values without mutating the input collection. Account for empty input and mixed value types.',
        learningOutcomes: [
          'Recognize numeric values safely.',
          'Preserve the original collection.',
          'Handle empty input predictably.',
        ],
        unlockDescription: 'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.',
      },
      starterCode: 'export default function sumNumbers(arr) {\n  // TODO\n}',
      solution: 'SOLUTION_SENTINEL',
    };

    const candidates = [
      { id: 'js-count-vowels', title: 'Count Vowels', access: 'free' as const, technology: 'javascript', type: 'coding', tags: ['strings'] },
      { id: 'js-unique-array', title: 'Remove Duplicates', access: 'premium' as const, technology: 'javascript', type: 'coding', tags: ['arrays'] },
    ];

    const preview = buildLockedPreviewForCoding(q, { candidates, tech: 'javascript', kind: 'coding' });
    if (!preview) throw new Error('Expected authored coding preview');

    expect(preview.what.length).toBeGreaterThan(30);
    expect(preview.what).not.toContain('Expect');
    expect(preview.what).not.toContain('….');
    expect(preview.unlockDescription).toBe(
      'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.',
    );
    expect(JSON.stringify(preview)).not.toContain('SOLUTION_SENTINEL');
    expect(preview.unlockBullets?.length || 0).toBeGreaterThanOrEqual(2);
    expect(preview.learningGoals.length).toBeGreaterThanOrEqual(3);
    expect(preview.keyDecisions?.length || 0).toBeGreaterThanOrEqual(2);
    expect(preview.rubric?.length || 0).toBeGreaterThanOrEqual(3);
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
      premiumPreview: {
        summary: 'Explain how the CSS cascade resolves competing declarations. Connect specificity to a concrete browser outcome.',
        learningOutcomes: [
          'Explain how specificity contributes to the cascade.',
          'Compare selectors using their specificity components.',
          'Apply the rules to a concrete styling conflict.',
        ],
        unlockDescription: 'Premium unlocks the complete explanation, worked examples, follow-up questions, and common-mistake discussion.',
      },
    };

    const candidates = [
      { id: 'css-cascade', title: 'What is the CSS cascade?', access: 'free' as const, technology: 'css', type: 'trivia', tags: ['css', 'cascade'] },
    ];

    const preview = buildLockedPreviewForTrivia(q, { candidates, tech: 'css', kind: 'trivia' });
    if (!preview) throw new Error('Expected authored trivia preview');

    expect(preview.learningGoals.length).toBeGreaterThanOrEqual(3);
    expect(preview.keyDecisions?.length || 0).toBeGreaterThanOrEqual(2);
    expect(preview.rubric?.length || 0).toBeGreaterThanOrEqual(3);
    expect(preview.constraints.length).toBeGreaterThanOrEqual(4);
    expect(preview.snippet.lines.length).toBeGreaterThanOrEqual(8);
  });

  it('builds a system design preview with related links', () => {
    const q = {
      id: 'live-comments',
      title: 'Live Comments for Global Streams',
      description: 'Design a real-time comment system for a global live stream UI.',
      tags: ['realtime', 'websocket', 'moderation'],
      premiumPreview: {
        summary: 'Design a resilient real-time comments experience for a global live stream. Keep the interface responsive while updates arrive in bursts.',
        learningOutcomes: [
          'Define ownership for comment and connection state.',
          'Keep rendering work bounded during traffic spikes.',
          'Plan recovery for disconnects and failed updates.',
        ],
        unlockDescription: 'Premium unlocks the full architecture walkthrough, evaluation rubric, trade-offs, and failure-mode analysis.',
      },
    };

    const candidates = [
      { id: 'endless-feed', title: 'Endless Short-Video Feed', access: 'free' as const, type: 'system-design', tags: ['feeds', 'pagination'] },
      { id: 'notif-feed', title: 'Scalable Notifications Feed', access: 'premium' as const, type: 'system-design', tags: ['notifications'] },
    ];

    const preview = buildLockedPreviewForSystemDesign(q, { candidates });
    if (!preview) throw new Error('Expected authored system-design preview');

    expect(preview.what.length).toBeGreaterThan(30);
    expect(preview.keyDecisions?.length || 0).toBeGreaterThanOrEqual(2);
    expect(preview.rubric?.length || 0).toBeGreaterThanOrEqual(3);
    expect(preview.related.length).toBeGreaterThan(0);
    expect(preview.related[0].to[1]).toBe('system-design');
  });

  it('keeps fallback summaries at sentence boundaries and capitalizes technology names', () => {
    const preview = buildLockedPreviewForCoding({
      id: 'fallback-react',
      title: 'Fallback React Exercise',
      type: 'coding',
      technology: 'react',
      access: 'premium',
      difficulty: 'intermediate',
      tags: ['react'],
      importance: 3,
      description: {
        summary: 'Practice react state transitions. Keep vue and angular comparisons accurate. This third sentence is intentionally omitted.',
        specs: {
          requirements: [
            'Model each state transition explicitly.',
            'Keep the rendered status consistent with current state.',
            'Handle an empty initial state safely.',
          ],
        },
      },
    }, { candidates: [], tech: 'react', kind: 'coding' });

    if (!preview) throw new Error('Expected complete fallback preview');
    expect(preview.what).toBe('Practice React state transitions. Keep Vue and Angular comparisons accurate.');
    expect(preview.what).not.toContain('…');
    expect(preview.learningGoals.length).toBeGreaterThanOrEqual(3);
    expect(preview.learningGoals).not.toContain('Practice React state transitions.');
  });

  it('rejects fallback content that cannot produce three complete public outcomes', () => {
    const question: CodingLockedPreviewQuestion = {
      id: 'unsafe-fallback',
      title: 'Unsafe fallback',
      type: 'coding',
      technology: 'react',
      access: 'premium',
      difficulty: 'intermediate',
      tags: ['react'],
      importance: 3,
      description: {
        summary: 'Build a React component. Keep its state predictable.',
        specs: {
          requirements: [
            'Work in `src/App.tsx`.',
            'public/index.html is already wired up',
          ],
        },
      },
    };
    Object.defineProperty(question, 'solution', {
      enumerable: true,
      get: () => {
        throw new Error('Locked preview must not read solution fields.');
      },
    });

    const preview = buildLockedPreviewForCoding(question, { candidates: [], tech: 'react', kind: 'coding' });

    expect(preview).toBeNull();
  });

  it('accepts an authored Angular control-flow outcome without Markdown fencing', () => {
    const preview = buildLockedPreviewForCoding({
      id: 'angular-tabs-switcher',
      title: 'Tabs Switcher',
      type: 'coding',
      technology: 'angular',
      access: 'premium',
      difficulty: 'intermediate',
      tags: ['angular', 'control-flow'],
      importance: 4,
      description: 'Build an accessible tabs component.',
      premiumPreview: {
        summary: 'Build an accessible Angular tab switcher driven by one active state.',
        learningOutcomes: [
          'Model one typed active-state value.',
          'Render the active panel with Angular @if control flow.',
          'Keep exactly one content panel visible.',
        ],
        unlockDescription: 'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.',
      },
    }, { candidates: [], tech: 'angular', kind: 'coding' });

    expect(preview?.learningGoals).toContain('Render the active panel with Angular @if control flow.');
  });

  it('rejects entity-encoded HTML from fallback summaries', () => {
    const preview = buildLockedPreviewForCoding({
      id: 'encoded-html',
      title: 'Accessible Dialog',
      type: 'coding',
      technology: 'html',
      access: 'premium',
      difficulty: 'easy',
      tags: ['html'],
      importance: 2,
      description: {
        summary: 'Build a confirm flow with the HTML &lt;dialog&gt; element. Keep the interaction accessible. Preserve native close behavior.',
        specs: {
          requirements: [
            'Provide an accessible name for the dialog.',
            'Connect descriptive text for screen readers.',
            'Return the selected action when the dialog closes.',
          ],
        },
      },
    }, { candidates: [], tech: 'html', kind: 'coding' });

    expect(preview?.what).toBe('Keep the interaction accessible. Preserve native close behavior.');
    expect(preview?.what).not.toContain('<dialog>');
  });

  it('builds incident and tradeoff teasers from public index fields without title repetition', () => {
    const incident = buildLockedPreviewForIncident({
      id: 'stale-search',
      title: 'Stale search response replaces current results',
      tech: 'react',
      difficulty: 'intermediate',
      summary: 'A slower old request replaces the results for the query the user can currently see.',
      signals: ['The result list changes after the loading state clears'],
      estimatedMinutes: 12,
      tags: ['async'],
      updatedAt: '2026-07-15',
      access: 'premium',
    }, []);
    const tradeoff = buildLockedPreviewForTradeoff({
      id: 'debounce-vs-throttle',
      title: 'Debounce vs throttle',
      tech: 'javascript',
      difficulty: 'intermediate',
      summary: 'A search field must stay responsive without sending a request for every keypress.',
      tags: ['events'],
      access: 'premium',
      estimatedMinutes: 12,
      updatedAt: '2026-07-15',
    }, []);

    expect(incident.what).toBe('A slower old request replaces the results for the query the user can currently see.');
    expect(tradeoff.what).toBe('A search field must stay responsive without sending a request for every keypress.');
    expect(incident.what.startsWith('Stale search response replaces current results:')).toBeFalse();
    expect(tradeoff.what.startsWith('Debounce vs throttle:')).toBeFalse();
    expect(incident.learningGoals.every((outcome) => /[.!?]$/.test(outcome))).toBeTrue();
    expect(tradeoff.learningGoals.every((outcome) => /[.!?]$/.test(outcome))).toBeTrue();
    expect(JSON.stringify([incident, tradeoff])).not.toContain('…');
  });
});
