import { TestBed } from '@angular/core/testing';
import { ConversionContextService } from './conversion-context.service';

describe('ConversionContextService', () => {
  let service: ConversionContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConversionContextService] });
    service = TestBed.inject(ConversionContextService);
    sessionStorage.removeItem('fa:conversion:pricing-context:v1');
  });

  afterEach(() => sessionStorage.removeItem('fa:conversion:pricing-context:v1'));

  it('preserves a clean-url pricing source for a later route render', () => {
    service.rememberPricingContext('marketing_header', 'marketing_header_utility');

    expect(service.resolvePricingContext()).toEqual(jasmine.objectContaining({
      src: 'marketing_header',
      surface: 'marketing_header_utility',
    }));
    expect(service.resolvePricingContext()).toEqual(jasmine.objectContaining({
      src: 'pricing_page',
      surface: 'pricing_page',
    }));
  });

  it('accepts a legacy src query as a migration fallback and normalizes it', () => {
    expect(service.resolvePricingContext('SYSTEM_DESIGN_LOCKED')).toEqual(jasmine.objectContaining({
      src: 'system_design_locked',
      surface: 'pricing_page',
    }));
    expect(sessionStorage.getItem('fa:conversion:pricing-context:v1')).toBeNull();
  });

  it('does not reuse an expired navigation context', () => {
    sessionStorage.setItem('fa:conversion:pricing-context:v1', JSON.stringify({
      version: 1,
      src: 'old_source',
      surface: 'old_surface',
      createdAt: Date.now() - (31 * 60 * 1000),
    }));

    expect(service.resolvePricingContext()).toEqual(jasmine.objectContaining({
      src: 'pricing_page',
      surface: 'pricing_page',
    }));
  });
});
