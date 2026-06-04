import { findPrepRoadmapSwitcherItem } from './prep-roadmap-sequence';

describe('prep roadmap switcher route matching', () => {
  it('does not invent a prep step for dashboard', () => {
    expect(findPrepRoadmapSwitcherItem('/dashboard')).toBeNull();
  });

  it('maps interview question surfaces to Essential 60', () => {
    expect(findPrepRoadmapSwitcherItem('/interview-questions')?.id).toBe('essential_60');
    expect(findPrepRoadmapSwitcherItem('/interview-questions/essential')?.id).toBe('essential_60');
  });

  it('maps question library and study routes to their explicit steps', () => {
    expect(findPrepRoadmapSwitcherItem('/coding')?.id).toBe('question_library');
    expect(findPrepRoadmapSwitcherItem('/tracks')?.id).toBe('study_plans');
  });

  it('maps final-round routes to system design instead of a query-param coding view', () => {
    expect(findPrepRoadmapSwitcherItem('/system-design')?.id).toBe('final_rounds');
    expect(findPrepRoadmapSwitcherItem('/coding?view=formats&category=system')?.id).toBe('final_rounds');
  });
});
