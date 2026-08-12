import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SeoAdminService } from './seo-admin.service';

describe('SeoAdminService', () => {
  let service: SeoAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SeoAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('caches a successful owner capability without exposing an email client-side', () => {
    let firstAllowed = false;
    service.ensureAccess().subscribe((access) => firstAllowed = access.allowed);

    const request = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'));
    expect(request.request.withCredentials).toBeTrue();
    request.flush({
      allowed: true,
      enabled: true,
      capabilities: { contractVersion: 'seo-admin.v2', manualAnalysis: true },
    });

    let cachedAllowed = false;
    service.ensureAccess().subscribe((access) => cachedAllowed = access.allowed);
    http.expectNone((candidate) => candidate.url.endsWith('/api/admin/seo/access'));
    expect(firstAllowed).toBeTrue();
    expect(cachedAllowed).toBeTrue();
    expect(service.ownerAllowed()).toBeTrue();
    expect(service.manualAnalysisAvailable()).toBeTrue();
  });

  it('ignores an allowed response that arrives after the account cache is cleared', () => {
    service.checkAccess().subscribe({ error: () => undefined });
    const oldRequest = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'));

    service.clearAccess();
    service.checkAccess().subscribe();
    const currentRequest = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'));
    currentRequest.flush({ allowed: false, enabled: true, reason: 'owner_required' });
    oldRequest.flush({ allowed: true, enabled: true });

    expect(service.ownerAllowed()).toBeFalse();
    expect(service.ownerAccess()?.reason).toBe('owner_required');
  });

  it('does not invalidate an in-flight access probe when header and guard bind the same owner', () => {
    service.bindOwnerPrincipal('owner-1');
    let guardAllowed = false;
    let headerAllowed = false;

    service.checkAccess(true).subscribe((access) => guardAllowed = access.allowed);
    service.bindOwnerPrincipal('owner-1');
    service.ensureAccess().subscribe((access) => headerAllowed = access.allowed);

    const probes = http.match((candidate) => candidate.url.endsWith('/api/admin/seo/access'));
    expect(probes.length).toBe(1);
    probes[0].flush({
      allowed: true,
      enabled: true,
      capabilities: { contractVersion: 'seo-admin.v2', manualAnalysis: true },
    });

    expect(guardAllowed).toBeTrue();
    expect(headerAllowed).toBeTrue();
    expect(service.ownerAllowed()).toBeTrue();
  });

  it('invalidates cached access and stale probes when the authenticated account changes', () => {
    service.bindOwnerPrincipal('owner-1');
    service.checkAccess().subscribe({ error: () => undefined });
    const staleProbe = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'));

    service.bindOwnerPrincipal('owner-2');
    service.checkAccess().subscribe();
    const currentProbe = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'));
    currentProbe.flush({ allowed: false, enabled: true, reason: 'owner_required' });
    staleProbe.flush({ allowed: true, enabled: true });

    expect(service.ownerAllowed()).toBeFalse();
    expect(service.ownerAccess()?.reason).toBe('owner_required');
  });

  it('forces a new capability request instead of reusing an in-flight request', () => {
    service.checkAccess().subscribe({ error: () => undefined });
    const firstRequest = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'));

    service.checkAccess(true).subscribe();
    const forcedRequest = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'));
    firstRequest.flush({ allowed: true, enabled: true });
    forcedRequest.flush({ allowed: false, enabled: true });

    expect(service.ownerAllowed()).toBeFalse();
  });

  it('revokes cached owner capability when any SEO request returns 401 or 403', () => {
    service.checkAccess().subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });
    expect(service.ownerAllowed()).toBeTrue();

    const overviewError = jasmine.createSpy('overviewError');
    service.getOverview(28, 'all').subscribe({
      error: overviewError,
    });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/overview'))
      .flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(overviewError).toHaveBeenCalledWith(jasmine.objectContaining({ status: 403 }));
    expect(service.accessChecked()).toBeTrue();
    expect(service.ownerAllowed()).toBeFalse();

    service.checkAccess(true).subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });
    expect(service.ownerAllowed()).toBeTrue();

    const syncError = jasmine.createSpy('syncError');
    service.requestSync().subscribe({
      error: syncError,
    });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/sync'))
      .flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(syncError).toHaveBeenCalledWith(jasmine.objectContaining({ status: 401 }));
    expect(service.accessChecked()).toBeTrue();
    expect(service.ownerAllowed()).toBeFalse();
  });

  it('keeps a valid owner capability on ordinary non-authorization failures', () => {
    service.checkAccess().subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });

    const responseError = jasmine.createSpy('responseError');
    service.getOverview(28, 'all').subscribe({
      error: responseError,
    });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/overview'))
      .flush({ error: 'SEO request failed.' }, { status: 500, statusText: 'Server Error' });

    expect(responseError).toHaveBeenCalledWith(jasmine.objectContaining({ status: 500 }));
    expect(service.ownerAllowed()).toBeTrue();
  });

  it('rechecks an ambiguous resource 404 and revokes only when the access probe is also hidden', () => {
    service.checkAccess().subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });

    service.getOverview(28, 'all').subscribe({ error: () => undefined });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/overview'))
      .flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(service.ownerAllowed()).toBeTrue();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(service.accessChecked()).toBeTrue();
    expect(service.ownerAllowed()).toBeFalse();
  });

  it('keeps the owner on the dashboard when a stale backend lacks the analyze route', () => {
    service.checkAccess().subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({
        allowed: true,
        enabled: true,
        capabilities: { contractVersion: 'seo-admin.v2', manualAnalysis: true },
      });
    expect(service.manualAnalysisAvailable()).toBeTrue();

    const analyzeError = jasmine.createSpy('analyzeError');
    service.requestAnalysis().subscribe({ error: analyzeError });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/analyze'))
      .flush('Cannot POST /api/admin/seo/analyze', { status: 404, statusText: 'Not Found' });

    expect(analyzeError).toHaveBeenCalledWith(jasmine.objectContaining({ status: 404 }));
    expect(service.ownerAllowed()).toBeTrue();

    // An older but still owner-authorized backend answers /access without the
    // capability handshake. Keep the session, but disable Analyze now.
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });

    expect(service.ownerAllowed()).toBeTrue();
    expect(service.manualAnalysisAvailable()).toBeFalse();
  });

  it('deduplicates access probes for simultaneous ambiguous 404 responses', () => {
    service.checkAccess().subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });

    service.getOverview(28, 'all').subscribe({ error: () => undefined });
    service.requestAnalysis().subscribe({ error: () => undefined });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/overview'))
      .flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/analyze'))
      .flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

    const probes = http.match((candidate) => candidate.url.endsWith('/api/admin/seo/access'));
    expect(probes.length).toBe(1);
    probes[0].flush({ allowed: true, enabled: true });
    expect(service.ownerAllowed()).toBeTrue();
  });

  it('retains a previously verified owner when the ambiguous-404 access probe fails transiently', () => {
    service.checkAccess().subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });

    service.requestAnalysis().subscribe({ error: () => undefined });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/analyze'))
      .flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ error: 'Temporary failure' }, { status: 503, statusText: 'Unavailable' });

    expect(service.ownerAllowed()).toBeTrue();
  });

  it('keeps owner capability when an authorized SEO resource is simply missing', () => {
    service.checkAccess().subscribe();
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/access'))
      .flush({ allowed: true, enabled: true });

    service.getPage('missing-page').subscribe({ error: () => undefined });
    http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/pages/missing-page'))
      .flush(
        { code: 'SEO_PAGE_NOT_FOUND', error: 'Page not found' },
        { status: 404, statusText: 'Not Found' },
      );

    expect(service.ownerAllowed()).toBeTrue();
  });

  it('requests an owner-authorized balanced analysis without starting a sync', () => {
    let status: string | undefined;
    service.requestAnalysis().subscribe((response) => status = response.status);

    const request = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/analyze'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBeTrue();
    request.flush({
      accepted: true,
      runId: 'analysis-1',
      status: 'not_ready',
      analysis: {
        status: 'not_ready',
        reason: 'analysis_deadline',
        completedDays: 56,
        requiredDays: 56,
      },
    });

    expect(status).toBe('not_ready');
  });

  it('uses owner-only opportunity endpoints and unwraps an explicitly promoted action', () => {
    const inputHash = 'assessment-input-hash';
    const opportunityKey = 'a'.repeat(64);
    let promotedAction: { id?: string } | undefined;

    service.getOpportunities('investigate', 'cursor-1', 12).subscribe();
    const list = http.expectOne((candidate) => candidate.url.endsWith('/api/admin/seo/opportunities'));
    expect(list.request.method).toBe('GET');
    expect(list.request.withCredentials).toBeTrue();
    expect(list.request.params.get('lane')).toBe('investigate');
    expect(list.request.params.get('cursor')).toBe('cursor-1');
    expect(list.request.params.get('limit')).toBe('12');
    list.flush({ lane: 'investigate', items: [], total: 0, nextCursor: null });

    service.getQueryOpportunityExamples('page/key', opportunityKey, inputHash, 99).subscribe();
    const examples = http.expectOne((candidate) => candidate.url.includes('/query-opportunities/'));
    expect(examples.request.url).toContain('/pages/page%2Fkey/query-opportunities/');
    expect(examples.request.params.get('assessmentInputHash')).toBe(inputHash);
    expect(examples.request.params.get('limit')).toBe('10');
    expect(examples.request.withCredentials).toBeTrue();
    examples.flush({ opportunityKey, assessmentInputHash: inputHash, items: [] });

    service.saveOpportunityReview('page/key', opportunityKey, {
      assessmentInputHash: inputHash,
      observedAt: '2026-08-10T08:00:00.000Z',
      locale: 'en-US',
      device: 'mobile',
      dominantResultType: 'mixed',
      serpFeatures: ['people_also_ask'],
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      reasonCode: 'snippet_not_specific',
    }).subscribe();
    const review = http.expectOne((candidate) => candidate.url.endsWith('/serp-review'));
    expect(review.request.method).toBe('PUT');
    expect(review.request.body).toEqual(jasmine.objectContaining({
      assessmentInputHash: inputHash,
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      reasonCode: 'snippet_not_specific',
    }));
    expect(review.request.body.notes).toBeUndefined();
    review.flush({ review: review.request.body });

    service.promoteOpportunity('page/key', opportunityKey, {
      assessmentInputHash: inputHash,
    }).subscribe((action) => promotedAction = action);
    const promotion = http.expectOne((candidate) => candidate.url.endsWith('/promote'));
    expect(promotion.request.method).toBe('POST');
    expect(promotion.request.body).toEqual({ assessmentInputHash: inputHash });
    promotion.flush({
      assessmentInputHash: inputHash,
      opportunityKey,
      action: { id: 'promoted-action' },
    });
    expect(promotedAction?.id).toBe('promoted-action');
  });
});
