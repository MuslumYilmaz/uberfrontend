import { openExternalWindow } from './external-window.util';

describe('external-window util', () => {
  afterEach(() => {
    delete (window as any).__faCheckoutRedirect;
  });

  it('uses the checkout test hook when present', () => {
    const hook = jasmine.createSpy('hook');
    (window as any).__faCheckoutRedirect = hook;

    expect(openExternalWindow('https://example.com/manage')).toBe('hooked');
    expect(hook).toHaveBeenCalledWith('https://example.com/manage');
  });

  it('detects blocked popup windows', () => {
    spyOn(window, 'open').and.returnValue(null);

    expect(openExternalWindow('https://example.com/manage')).toBe('blocked');
  });
});
