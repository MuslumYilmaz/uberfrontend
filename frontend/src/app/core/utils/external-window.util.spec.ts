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

  it('opens a placeholder tab, nulls the opener, and then navigates it', () => {
    const fakeWindow = {
      opener: window,
      location: { href: '' },
      close: jasmine.createSpy('close'),
    } as unknown as Window;
    const openSpy = spyOn(window, 'open').and.returnValue(fakeWindow);

    expect(openExternalWindow('https://example.com/manage')).toBe('opened');
    expect(openSpy).toHaveBeenCalledWith('', '_blank');
    expect((fakeWindow as any).opener).toBeNull();
    expect(fakeWindow.location.href).toBe('https://example.com/manage');
  });
});
