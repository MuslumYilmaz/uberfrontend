import {
  TRACK_LOOKUP,
  deriveTrackMetrics,
  trackQuestionRefKey,
} from './track.data';

describe('track metrics', () => {
  it('derives Foundations counts from unique canonical question references', () => {
    const track = TRACK_LOOKUP.get('foundations-30d');
    expect(track).toBeTruthy();

    const keys = (track?.featured || []).map(trackQuestionRefKey);
    expect(new Set(keys).size).toBe(keys.length);

    expect(deriveTrackMetrics(track!)).toEqual({
      uniquePrompts: 113,
      javascript: 51,
      frameworkCoding: 27,
      htmlCss: 30,
      conceptQuestions: 39,
      systemDesign: 5,
      categoryTotal: 152,
      categoriesOverlap: true,
    });
  });

  it('deduplicates repeated refs by tech, kind, and id before counting', () => {
    const track = TRACK_LOOKUP.get('foundations-30d')!;
    const duplicate = track.featured[0];
    const metrics = deriveTrackMetrics({
      ...track,
      featured: [...track.featured, { ...duplicate }],
    });

    expect(metrics.uniquePrompts).toBe(113);
    expect(metrics.categoryTotal).toBe(152);
  });
});
