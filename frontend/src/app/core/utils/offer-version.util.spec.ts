import {
  PRICING_BASELINE_OFFER_VERSION,
  PRICING_V2_OFFER_VERSION,
  PRICING_V3_OFFER_VERSION,
  isSprintOfferVersion,
} from './offer-version.util';

describe('isSprintOfferVersion', () => {
  it('treats v2 and every later sprint version as the sprint layout', () => {
    expect(isSprintOfferVersion(PRICING_V2_OFFER_VERSION)).toBeTrue();
    expect(isSprintOfferVersion(PRICING_V3_OFFER_VERSION)).toBeTrue();
    expect(isSprintOfferVersion('interview_sprint_v10')).toBeTrue();
    expect(isSprintOfferVersion(' Interview_Sprint_V3 ')).toBeTrue();
  });

  it('keeps the baseline and unknown versions on the baseline layout', () => {
    expect(isSprintOfferVersion(PRICING_BASELINE_OFFER_VERSION)).toBeFalse();
    expect(isSprintOfferVersion('interview_sprint_v1')).toBeFalse();
    expect(isSprintOfferVersion('interview_sprint_v0')).toBeFalse();
    expect(isSprintOfferVersion('interview_sprint_v2_beta')).toBeFalse();
    expect(isSprintOfferVersion('')).toBeFalse();
    expect(isSprintOfferVersion(undefined)).toBeFalse();
    expect(isSprintOfferVersion(null)).toBeFalse();
  });
});
