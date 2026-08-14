import { HttpHeaders } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { apiUrl } from '../utils/api-base';
import { BugReportService } from './bug-report.service';

describe('BugReportService', () => {
  let service: BugReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BugReportService],
    });

    service = TestBed.inject(BugReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('submits bug report with appended context and auto closes after success', fakeAsync(() => {
    service.open({
      source: 'trivia_detail',
      url: 'https://frontendatlas.com/react/trivia/q1',
      route: '/react/trivia/q1',
      tech: 'react',
      questionId: 'q1',
      questionTitle: 'What is state?',
    });

    service.note.set('Button click does nothing');
    service.verificationToken.set('turnstile-token');

    void service.submit(service.note());

    const req = httpMock.expectOne(apiUrl('/bug-report'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.url).toBe('https://frontendatlas.com/react/trivia/q1');
    expect(req.request.body.note).toContain('Button click does nothing');
    expect(req.request.body.note).toContain('source: trivia_detail');
    expect(req.request.body.note).toContain('route: /react/trivia/q1');
    expect(req.request.body.note).toContain('tech: react');
    expect(req.request.body.note).toContain('questionId: q1');
    expect(req.request.body.note).toContain('questionTitle: What is state?');
    expect(req.request.body.verificationToken).toBe('turnstile-token');
    expect(req.request.body.website).toBe('');

    req.flush('ok');
    tick();

    expect(service.submitOk()).toBeTrue();
    expect(service.visible()).toBeTrue();
    expect(service.verificationToken()).toBe('');

    tick(900);

    expect(service.visible()).toBeFalse();
    expect(service.note()).toBe('');
    expect(service.submitOk()).toBeFalse();
    discardPeriodicTasks();
  }));

  it('keeps modal open and sets error on submit failure', fakeAsync(() => {
    service.open({
      source: 'sidebar',
      url: 'https://frontendatlas.com/dashboard',
      route: '/dashboard',
    });

    service.note.set('Cannot open filters');
    service.verificationToken.set('turnstile-token');
    const originalContext = service.context();
    void service.submit(service.note());

    const req = httpMock.expectOne(apiUrl('/bug-report'));
    req.flush('fail', { status: 500, statusText: 'Server Error' });
    tick();

    expect(service.visible()).toBeTrue();
    expect(service.submitOk()).toBeFalse();
    expect(service.error()).toBe('Failed to send bug report. Please try again.');
    expect(service.submitting()).toBeFalse();
    expect(service.note()).toBe('Cannot open filters');
    expect(service.context()).toBe(originalContext);
    expect(service.verificationToken()).toBe('');
  }));

  it('enforces cooldown after success and blocks further submit requests during cooldown', fakeAsync(() => {
    service.open({
      source: 'sidebar',
      url: 'https://frontendatlas.com/dashboard',
      route: '/dashboard',
    });
    service.note.set('The dashboard cards overlap on small screens.');
    service.verificationToken.set('turnstile-token');

    void service.submit(service.note());
    const req = httpMock.expectOne(apiUrl('/bug-report'));
    req.flush('ok');
    tick();

    expect(service.cooldownSeconds()).toBeGreaterThan(0);
    expect(service.canSubmit()).toBeFalse();

    service.verificationToken.set('replacement-token');
    void service.submit(service.note());
    httpMock.expectNone(apiUrl('/bug-report'));
    expect(service.error()).toContain('Please wait');
    tick(900);
    discardPeriodicTasks();
  }));

  it('maps 429 responses to a retry-after aware error message', fakeAsync(() => {
    service.open({
      source: 'sidebar',
      url: 'https://frontendatlas.com/dashboard',
      route: '/dashboard',
    });

    service.note.set('Cannot open the bug report modal from sidebar.');
    service.verificationToken.set('turnstile-token');
    void service.submit(service.note());

    const req = httpMock.expectOne(apiUrl('/bug-report'));
    req.flush(
      { error: 'Too many requests' },
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: new HttpHeaders({ 'Retry-After': '42' }),
      }
    );
    tick();

    expect(service.error()).toBe('Too many reports right now. Please wait 42s and try again.');
    expect(service.cooldownSeconds()).toBe(42);
    expect(service.note()).toBe('Cannot open the bug report modal from sidebar.');
    expect(service.verificationToken()).toBe('');

    tick(1000);
    expect(service.cooldownSeconds()).toBe(41);
    discardPeriodicTasks();
  }));

  it('requires a fresh verification token before making a request', fakeAsync(() => {
    service.open({
      source: 'sidebar',
      url: 'https://frontendatlas.com/dashboard',
    });
    service.note.set('The filters do not open from the dashboard.');

    void service.submit(service.note());
    tick();

    httpMock.expectNone(apiUrl('/bug-report'));
    expect(service.error()).toBe('Please complete the verification check before sending your report.');
    expect(service.canSubmit()).toBeFalse();
  }));

  it('shows the support fallback when form protection is unavailable', fakeAsync(() => {
    service.open({
      source: 'sidebar',
      url: 'https://frontendatlas.com/dashboard',
    });
    service.note.set('The dashboard does not finish loading.');
    service.verificationToken.set('turnstile-token');

    void service.submit(service.note());

    const req = httpMock.expectOne(apiUrl('/bug-report'));
    req.flush(
      JSON.stringify({
        code: 'FORM_PROTECTION_UNAVAILABLE',
        error: 'Form protection is temporarily unavailable.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
    tick();

    expect(service.visible()).toBeTrue();
    expect(service.note()).toBe('The dashboard does not finish loading.');
    expect(service.supportFallbackVisible()).toBeTrue();
    expect(service.error()).toContain('temporarily unavailable');
    expect(service.verificationToken()).toBe('');
  }));

  it('maps a rejected verification response and preserves the report for retry', fakeAsync(() => {
    service.open({
      source: 'sidebar',
      url: 'https://frontendatlas.com/dashboard',
    });
    service.note.set('The navigation freezes after opening a track.');
    service.verificationToken.set('rejected-token');

    void service.submit(service.note());

    const req = httpMock.expectOne(apiUrl('/bug-report'));
    req.flush(
      JSON.stringify({
        code: 'FORM_VERIFICATION_FAILED',
        error: 'Verification failed.',
      }),
      {
        status: 403,
        statusText: 'Forbidden',
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
    tick();

    expect(service.note()).toBe('The navigation freezes after opening a track.');
    expect(service.error()).toContain('could not verify');
    expect(service.verificationToken()).toBe('');
    expect(service.supportFallbackVisible()).toBeFalse();
  }));
});
