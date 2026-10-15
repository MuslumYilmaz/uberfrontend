import { TestBed } from '@angular/core/testing';
import { ConversionContextService } from './conversion-context.service';

const FIRST_TOUCH_KEY = 'fa:conversion:first-touch:v1';

describe('ConversionContextService', () => {
  let service: ConversionContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConversionContextService] });
    service = TestBed.inject(ConversionContextService);
    sessionStorage.removeItem('fa:conversion:pricing-context:v1');
    localStorage.removeItem(FIRST_TOUCH_KEY);
  });

  afterEach(() => {
    sessionStorage.removeItem('fa:conversion:pricing-context:v1');
    localStorage.removeItem(FIRST_TOUCH_KEY);
  });

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

  describe('first touch', () => {
    it('captures the landing path and external referrer once and keeps the first record', () => {
      const first = service.captureFirstTouch({
        path: '/companies/waymo?utm_source=newsletter#prompts',
        referrer: 'https://www.Google.com/search?q=waymo+frontend+interview',
        host: 'frontendatlas.com',
      });

      expect(first).toEqual(jasmine.objectContaining({
        version: 1,
        landingPath: '/companies/waymo',
        referrerHost: 'www.google.com',
      }));

      const second = service.captureFirstTouch({
        path: '/pricing',
        referrer: 'https://news.ycombinator.com/',
        host: 'frontendatlas.com',
      });

      expect(second?.landingPath).toBe('/companies/waymo');
      expect(second?.referrerHost).toBe('www.google.com');
      expect(service.resolveFirstTouch()).toEqual(jasmine.objectContaining({
        landingPath: '/companies/waymo',
        referrerHost: 'www.google.com',
      }));
    });

    it('drops a same-site referrer and a path that is not an absolute route', () => {
      const touch = service.captureFirstTouch({
        path: 'companies/waymo',
        referrer: 'https://frontendatlas.com/pricing',
        host: 'frontendatlas.com',
      });

      expect(touch).toEqual(jasmine.objectContaining({ landingPath: null, referrerHost: null }));
    });

    it('drops oversized or malformed values instead of storing them', () => {
      const touch = service.captureFirstTouch({
        path: `/${'a'.repeat(260)}`,
        referrer: 'not a host name!',
        host: 'frontendatlas.com',
      });

      expect(touch).toEqual(jasmine.objectContaining({ landingPath: null, referrerHost: null }));
    });

    it('does not reuse an expired first touch', () => {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify({
        version: 1,
        landingPath: '/old',
        referrerHost: 'old.example',
        createdAt: Date.now() - (31 * 24 * 60 * 60 * 1000),
      }));

      expect(service.resolveFirstTouch()).toBeNull();
      expect(localStorage.getItem(FIRST_TOUCH_KEY)).toBeNull();
    });

    it('ignores a corrupt stored record', () => {
      localStorage.setItem(FIRST_TOUCH_KEY, '{not json');

      expect(service.resolveFirstTouch()).toBeNull();
      expect(localStorage.getItem(FIRST_TOUCH_KEY)).toBeNull();
    });
  });
});
