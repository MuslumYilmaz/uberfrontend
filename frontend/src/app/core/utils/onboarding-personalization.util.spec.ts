import { nextFreeDrill, roleLabel } from './onboarding-personalization.util';

describe('nextFreeDrill', () => {
  it('skips the task just passed and the ones solved before', () => {
    expect(nextFreeDrill('javascript', new Set())?.id).toBe('js-is-object-empty');
    expect(nextFreeDrill('javascript', new Set(['js-is-object-empty']))?.id).toBe('js-debounce');
    expect(nextFreeDrill('react', new Set(['react-counter', 'react-todo-list']))?.route)
      .toEqual(['/react', 'coding', 'react-fetch-list-states']);
  });

  it('runs out instead of offering a drill again', () => {
    expect(nextFreeDrill('vue', new Set(['vue-counter', 'vue-todo-list', 'vue-autocomplete-search']))).toBeNull();
  });
});

describe('roleLabel', () => {
  it('names the junior and mid-level roles', () => {
    expect(roleLabel('junior_frontend')).toBe('Junior Frontend');
    expect(roleLabel('mid_frontend')).toBe('Mid-level Frontend');
  });
});
