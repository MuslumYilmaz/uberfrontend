import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DecisionGraphService } from './decision-graph.service';

describe('DecisionGraphService', () => {
  let service: DecisionGraphService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DecisionGraphService],
    });

    service = TestBed.inject(DecisionGraphService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns parsed document for a valid sidecar asset', () => {
    let out: any = 'unset';
    service.load('assets/questions/javascript/decision-graphs/js-debounce.v1.json').subscribe((value) => {
      out = value;
    });

    const req = httpMock.expectOne('assets/questions/javascript/decision-graphs/js-debounce.v1.json');
    req.flush({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
      code: 'export default function debounce() {}',
      nodes: [
        {
          id: 'd1',
          title: 'Leading gate',
          anchor: { lineStart: 3 },
          why: 'Avoid repeated immediate calls.',
          alternative: 'Use a timestamp gate.',
          tradeoff: 'Simpler but less precise timing control.',
        },
      ],
    });

    expect(out).toEqual(jasmine.objectContaining({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
    }));
    expect(out.nodes.length).toBe(1);
    expect(out.nodes[0].anchor.lineEnd).toBe(3);
  });

  it('returns null when the asset is malformed', () => {
    let out: any = 'unset';
    service.load('assets/questions/javascript/decision-graphs/bad.json').subscribe((value) => {
      out = value;
    });

    const req = httpMock.expectOne('assets/questions/javascript/decision-graphs/bad.json');
    req.flush({ questionId: 'bad', nodes: [] });

    expect(out).toBeNull();
  });

  it('returns null when asset request fails', () => {
    let out: any = 'unset';
    service.load('assets/questions/javascript/decision-graphs/missing.json').subscribe((value) => {
      out = value;
    });

    const req = httpMock.expectOne('assets/questions/javascript/decision-graphs/missing.json');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(out).toBeNull();
  });

  it('returns null when nodes array is empty', () => {
    let out: any = 'unset';
    service.load('assets/questions/javascript/decision-graphs/empty.json').subscribe((value) => {
      out = value;
    });

    const req = httpMock.expectOne('assets/questions/javascript/decision-graphs/empty.json');
    req.flush({
      questionId: 'js-empty',
      version: 1,
      language: 'javascript',
      code: 'export default function empty() {}',
      nodes: [],
    });

    expect(out).toBeNull();
  });

  it('parses bundle sidecar and selects requested approach key', () => {
    let out: any = 'unset';
    service
      .load('assets/questions/javascript/decision-graphs/js-debounce.v1.json', 'approach2')
      .subscribe((value) => {
        out = value;
      });

    const req = httpMock.expectOne('assets/questions/javascript/decision-graphs/js-debounce.v1.json');
    req.flush({
      questionId: 'js-debounce',
      version: 1,
      defaultKey: 'approach1',
      variants: {
        approach1: {
          language: 'javascript',
          code: 'export default function debounce(fn, delay) {}',
          nodes: [
            {
              id: 'd1',
              title: 'One',
              anchor: { lineStart: 1 },
              why: 'why',
              alternative: 'alt',
              tradeoff: 'tradeoff',
            },
          ],
        },
        approach2: {
          language: 'javascript',
          code: 'export default function debounce(fn, delay) { return fn; }',
          nodes: [
            {
              id: 'd2',
              title: 'Two',
              anchor: { lineStart: 1 },
              why: 'why',
              alternative: 'alt',
              tradeoff: 'tradeoff',
            },
          ],
        },
      },
    });

    expect(out).toEqual(jasmine.objectContaining({
      questionId: 'js-debounce',
      key: 'approach2',
      code: 'export default function debounce(fn, delay) { return fn; }',
    }));
  });

  it('parses bundle sidecar and falls back to default key when no key requested', () => {
    let out: any = 'unset';
    service
      .load('assets/questions/javascript/decision-graphs/js-debounce.v1.json')
      .subscribe((value) => {
        out = value;
      });

    const req = httpMock.expectOne('assets/questions/javascript/decision-graphs/js-debounce.v1.json');
    req.flush({
      questionId: 'js-debounce',
      version: 1,
      defaultKey: 'approach3',
      variants: {
        approach1: {
          language: 'javascript',
          code: 'one',
          nodes: [
            {
              id: 'd1',
              title: 'One',
              anchor: { lineStart: 1 },
              why: 'why',
              alternative: 'alt',
              tradeoff: 'tradeoff',
            },
          ],
        },
        approach3: {
          language: 'javascript',
          code: 'three',
          nodes: [
            {
              id: 'd3',
              title: 'Three',
              anchor: { lineStart: 1 },
              why: 'why',
              alternative: 'alt',
              tradeoff: 'tradeoff',
            },
          ],
        },
      },
    });

    expect(out).toEqual(jasmine.objectContaining({
      key: 'approach3',
      code: 'three',
    }));
  });

  it('returns null when requested bundle approach key is missing', () => {
    let out: any = 'unset';
    service
      .load('assets/questions/javascript/decision-graphs/js-debounce.v1.json', 'approach9')
      .subscribe((value) => {
        out = value;
      });

    const req = httpMock.expectOne('assets/questions/javascript/decision-graphs/js-debounce.v1.json');
    req.flush({
      questionId: 'js-debounce',
      version: 1,
      defaultKey: 'approach1',
      variants: {
        approach1: {
          language: 'javascript',
          code: 'one',
          nodes: [
            {
              id: 'd1',
              title: 'One',
              anchor: { lineStart: 1 },
              why: 'why',
              alternative: 'alt',
              tradeoff: 'tradeoff',
            },
          ],
        },
      },
    });

    expect(out).toBeNull();
  });
});
