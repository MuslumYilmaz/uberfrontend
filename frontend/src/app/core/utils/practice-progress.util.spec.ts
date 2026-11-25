import {
  editedAgoLabel,
  isProgressFilter,
  lastRunLabel,
  matchesProgressFilter,
  pickContinueTarget,
  practiceStatus,
} from './practice-progress.util';

describe('practice progress', () => {
  const solved = new Set(['js-once']);
  const edited = new Map<string, number>([
    ['js-once', 300],
    ['js-debounce', 200],
    ['js-throttle', 400],
    ['js-clamp', 100],
  ]);

  it('counts a solved task as solved even with a draft, and a draft alone as in progress', () => {
    expect(practiceStatus('js-once', solved, edited)).toBe('solved');
    expect(practiceStatus('js-debounce', solved, edited)).toBe('in-progress');
    expect(practiceStatus('js-new', solved, edited)).toBe('todo');
  });

  it('keeps unsolved tasks, drafts or solved tasks for each progress view', () => {
    expect(['solved', 'in-progress', 'todo'].filter((s) => matchesProgressFilter(s as any, 'all')).length).toBe(3);
    expect(matchesProgressFilter('in-progress', 'unsolved')).toBeTrue();
    expect(matchesProgressFilter('todo', 'unsolved')).toBeTrue();
    expect(matchesProgressFilter('solved', 'unsolved')).toBeFalse();
    expect(matchesProgressFilter('todo', 'in-progress')).toBeFalse();
    expect(matchesProgressFilter('solved', 'solved')).toBeTrue();
    expect(isProgressFilter('unsolved')).toBeTrue();
    expect(isProgressFilter('done')).toBeFalse();
  });

  it('continues the newest draft the viewer can open and has not solved', () => {
    const rows = [{ id: 'js-once' }, { id: 'js-debounce' }, { id: 'js-throttle' }, { id: 'js-clamp' }];
    const locked = new Set(['js-throttle']);

    const target = pickContinueTarget(rows, solved, edited, (row) => !locked.has(row.id));

    // js-throttle is newer but locked, js-once is newer but solved.
    expect(target).toEqual({ row: { id: 'js-debounce' }, editedAt: 200 });
    expect(pickContinueTarget(rows, solved, new Map(), () => true)).toBeNull();
    expect(pickContinueTarget([{ id: 'gone' }], solved, edited, () => true)).toBeNull();
  });

  it('names the last run and how long ago the draft changed', () => {
    expect(lastRunLabel({ passCount: 2, totalCount: 4, ts: 1 })).toBe('2 of 4 passed');
    expect(lastRunLabel({ passCount: 0, totalCount: 0, ts: 1 })).toBeNull();
    expect(lastRunLabel(undefined)).toBeNull();

    const now = Date.UTC(2026, 10, 24, 12);
    expect(editedAgoLabel(now - 30_000, now)).toBe('just now');
    expect(editedAgoLabel(now - 5 * 60_000, now)).toBe('5 minutes ago');
    expect(editedAgoLabel(now - 3 * 3_600_000, now)).toBe('3 hours ago');
    expect(editedAgoLabel(now - 30 * 3_600_000, now)).toBe('yesterday');
    expect(editedAgoLabel(now - 9 * 86_400_000, now)).toBe('last week');
  });
});
