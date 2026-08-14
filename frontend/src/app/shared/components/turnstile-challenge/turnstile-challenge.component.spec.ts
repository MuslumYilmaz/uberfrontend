import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { TurnstileChallengeComponent } from './turnstile-challenge.component';
import { TurnstileLoaderService } from './turnstile-loader.service';
import {
  TurnstileApi,
  TurnstileChallengeState,
  TurnstileWidgetOptions,
} from './turnstile-challenge.types';

describe('TurnstileChallengeComponent', () => {
  let api: jasmine.SpyObj<TurnstileApi>;
  let loader: jasmine.SpyObj<TurnstileLoaderService>;
  let renderOptions: TurnstileWidgetOptions;
  let originalSiteKey: string;

  beforeEach(async () => {
    originalSiteKey = environment.turnstileSiteKey;
    environment.turnstileSiteKey = '1x00000000000000000000AA';

    api = jasmine.createSpyObj<TurnstileApi>('TurnstileApi', ['render', 'reset', 'remove']);
    api.render.and.callFake((_container, options) => {
      renderOptions = options;
      return 'widget-1';
    });
    loader = jasmine.createSpyObj<TurnstileLoaderService>(
      'TurnstileLoaderService',
      ['load'],
      { isBrowser: true },
    );
    loader.load.and.resolveTo(api);

    await TestBed.configureTestingModule({
      imports: [TurnstileChallengeComponent],
      providers: [{ provide: TurnstileLoaderService, useValue: loader }],
    }).compileComponents();
  });

  afterEach(() => {
    environment.turnstileSiteKey = originalSiteKey;
  });

  it('renders explicitly with the managed responsive widget settings', fakeAsync(() => {
    const fixture = TestBed.createComponent(TurnstileChallengeComponent);
    const component = fixture.componentInstance;
    const states: TurnstileChallengeState[] = [];
    const tokens: string[] = [];
    component.stateChange.subscribe((state) => states.push(state));
    component.tokenChange.subscribe((token) => tokens.push(token));

    fixture.componentRef.setInput('action', 'contact');
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(api.render).toHaveBeenCalledTimes(1);
    expect(renderOptions).toEqual(jasmine.objectContaining({
      sitekey: '1x00000000000000000000AA',
      action: 'contact',
      appearance: 'interaction-only',
      size: 'flexible',
      theme: 'auto',
      'refresh-expired': 'auto',
      'refresh-timeout': 'auto',
    }));
    expect(states).toEqual(['loading', 'ready']);
    expect(tokens).toEqual(['']);

    renderOptions.callback('verified-token');
    expect(states.at(-1)).toBe('verified');
    expect(tokens.at(-1)).toBe('verified-token');

    component.reset();
    expect(api.reset).toHaveBeenCalledOnceWith('widget-1');
    expect(states.at(-1)).toBe('ready');
    expect(tokens.at(-1)).toBe('');

    fixture.destroy();
    expect(api.remove).toHaveBeenCalledOnceWith('widget-1');
  }));

  it('invalidates tokens on expiry and accepts the provider-issued replacement', fakeAsync(() => {
    const fixture = TestBed.createComponent(TurnstileChallengeComponent);
    const component = fixture.componentInstance;
    const states: TurnstileChallengeState[] = [];
    const tokens: string[] = [];
    component.stateChange.subscribe((state) => states.push(state));
    component.tokenChange.subscribe((token) => tokens.push(token));

    fixture.componentRef.setInput('action', 'bug_report');
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    flushMicrotasks();

    renderOptions.callback('first-token');
    renderOptions['expired-callback']();
    expect(states.at(-1)).toBe('expired');
    expect(tokens.at(-1)).toBe('');

    renderOptions.callback('replacement-token');
    expect(states.at(-1)).toBe('verified');
    expect(tokens.at(-1)).toBe('replacement-token');
  }));

  it('ignores a pending script load after the challenge is deactivated', fakeAsync(() => {
    let resolveApi!: (value: TurnstileApi) => void;
    loader.load.and.returnValue(new Promise<TurnstileApi>((resolve) => {
      resolveApi = resolve;
    }));
    const fixture = TestBed.createComponent(TurnstileChallengeComponent);

    fixture.componentRef.setInput('action', 'contact');
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.currentState).toBe('loading');

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(fixture.componentInstance.currentState).toBe('idle');

    resolveApi(api);
    flushMicrotasks();
    expect(api.render).not.toHaveBeenCalled();
  }));

  it('stays browser-only during server rendering', () => {
    Object.defineProperty(loader, 'isBrowser', { value: false });
    const fixture = TestBed.createComponent(TurnstileChallengeComponent);

    fixture.componentRef.setInput('action', 'contact');
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    expect(loader.load).not.toHaveBeenCalled();
    expect(api.render).not.toHaveBeenCalled();
    expect(fixture.componentInstance.currentState).toBe('idle');
  });

  it('fails closed when a production sitekey was not generated', () => {
    environment.turnstileSiteKey = '';
    const fixture = TestBed.createComponent(TurnstileChallengeComponent);
    const states: TurnstileChallengeState[] = [];
    fixture.componentInstance.stateChange.subscribe((state) => states.push(state));

    fixture.componentRef.setInput('action', 'contact');
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    expect(loader.load).not.toHaveBeenCalled();
    expect(states.at(-1)).toBe('error');
  });
});
