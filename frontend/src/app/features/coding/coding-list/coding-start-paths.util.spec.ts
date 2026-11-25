import { interviewPath, warmupPath } from './coding-start-paths.util';

describe('coding start paths', () => {
  const row = (id: string, overrides: Record<string, unknown> = {}) => ({
    id,
    title: id,
    tech: 'javascript',
    access: 'free',
    difficulty: 'easy',
    importance: 3,
    __kind: 'coding',
    ...overrides,
  });

  it('starts a newcomer on five free Easy tasks, JavaScript by priority first with the warm-ups between', () => {
    const rows = [
      row('js-low', { importance: 1 }),
      row('js-high', { importance: 5 }),
      row('css-warmup', { title: 'Selectors (Interview Warm-up)', tech: 'css' }),
      row('html-warmup', { title: 'Warm-Up: Basic Structure', tech: 'html', importance: 2 }),
      row('js-premium', { access: 'premium', importance: 5 }),
      row('js-intermediate', { difficulty: 'intermediate', importance: 5 }),
      row('js-debug', { __debug: true, importance: 5 }),
      row('css-easy', { tech: 'css', importance: 5 }),
      row('js-mid', { importance: 3 }),
      row('js-mid-2', { importance: 3 }),
    ];

    expect(warmupPath(rows).map((r) => r.id)).toEqual(['js-high', 'css-warmup', 'js-mid', 'html-warmup', 'js-mid-2']);
    // Without the warm-ups the path is the JavaScript tasks alone.
    expect(warmupPath(rows.filter((r) => !r.id.endsWith('warmup'))).map((r) => r.id))
      .toEqual(['js-high', 'js-mid', 'js-mid-2', 'js-low']);
  });

  it('starts an interview candidate on Debounce, then the JavaScript tasks in Essential 60 order', () => {
    const rows = [
      row('js-plain', { importance: 5 }),
      row('js-throttle', { access: 'premium' }),
      row('js-debounce', { difficulty: 'intermediate' }),
      row('react-counter', { tech: 'react' }),
      row('js-take-latest'),
      row('js-debug-x', { __debug: true }),
    ];
    const ranks = new Map([['coding:js-debounce', 1], ['coding:js-throttle', 3], ['coding:js-take-latest', 9]]);

    expect(interviewPath(rows, ranks, 'js-debounce').map((r) => r.id))
      .toEqual(['js-debounce', 'js-throttle', 'js-take-latest', 'js-plain']);
    // Before the ranks arrive the path still opens on Debounce, then follows priority.
    expect(interviewPath(rows, new Map(), 'js-debounce')[0].id).toBe('js-debounce');
  });
});
