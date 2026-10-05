import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TransferState, makeStateKey } from '@angular/core';
import { convertToParamMap } from '@angular/router';
import { firstValueFrom, Observable, of, Subject, throwError } from 'rxjs';
import { Question } from '../models/question.model';
import { ASSET_READER, AssetReader } from '../services/asset-reader';
import { QuestionService } from '../services/question.service';
import {
  codingDetailResolver,
  normalizeSystemDesignDetail,
  QuestionDetailResolved,
  SolutionSnapshot,
  triviaDetailResolver,
} from './question-detail.resolver';

describe('normalizeSystemDesignDetail', () => {
  const indexEntry = {
    id: 'offline-email-client',
    title: 'Gmail-Style Offline Email Client Frontend System Design',
    description: 'Catalog description.',
    tags: ['email', 'offline-first'],
    type: 'system-design',
    access: 'free',
    difficulty: 'hard',
    publishedAt: '2026-07-29',
    updatedAt: '2026-07-30',
  };

  it('keeps index metadata authoritative while retaining detail content', () => {
    const detail = {
      title: 'Stale detail title',
      description: 'Stale detail description.',
      tags: ['stale'],
      access: 'premium',
      difficulty: 'intermediate',
      publishedAt: '2026-07-01',
      updatedAt: '2026-07-01',
      seo: { title: 'SEO title' },
      guideSlug: 'state-data',
      radio: [{ key: 'R', title: 'Requirements', blocks: [] }],
      contentLoadState: 'ready',
    };

    const resolved = normalizeSystemDesignDetail(
      indexEntry.id,
      [indexEntry],
      detail,
    );

    expect(resolved).toEqual(jasmine.objectContaining({
      id: indexEntry.id,
      title: indexEntry.title,
      description: indexEntry.description,
      tags: indexEntry.tags,
      access: 'free',
      difficulty: 'hard',
      publishedAt: '2026-07-29',
      updatedAt: '2026-07-30',
      seo: detail.seo,
      guideSlug: 'state-data',
      radio: detail.radio,
      contentLoadState: 'ready',
    }));
  });

  it('marks a catalog question as unavailable when its detail bundle does not load', () => {
    const resolved = normalizeSystemDesignDetail(
      indexEntry.id,
      [indexEntry],
      null,
    );

    expect(resolved).toEqual(jasmine.objectContaining({
      id: indexEntry.id,
      difficulty: 'hard',
      contentLoadState: 'error',
      practice: jasmine.objectContaining({
        targetLevel: 'senior',
        timeboxMinutes: 20,
        candidatePrompt: indexEntry.description,
      }),
    }));
  });

  it('returns null only when neither catalog nor detail knows the id', () => {
    expect(normalizeSystemDesignDetail('unknown', [], null)).toBeNull();
  });
});

describe('codingDetailResolver solution snapshots', () => {
  const assetPath = 'assets/sb/react/solution/react-free-solution.v2.json';
  const freeQuestion = {
    id: 'react-free',
    title: 'Free React challenge',
    type: 'coding',
    technology: 'react',
    access: 'free',
    difficulty: 'easy',
    tags: ['react'],
    importance: 3,
    solutionAsset: assetPath,
  } as Question & { solutionAsset: string };
  const sdkAsset = {
    files: {
      '/src/App.tsx': { code: 'export default function App() { return <h1>Solution</h1>; }' },
      '/src/App.css': { code: 'h1 { color: rebeccapurple; }' },
      '/package.json': { code: '{"dependencies":{"react":"latest"}}' },
    },
    openFile: '/src/App.tsx',
  };
  const snapshot: SolutionSnapshot = {
    files: Object.fromEntries(Object.entries(sdkAsset.files).map(([path, file]) => [path.slice(1), file.code])),
    initialPath: 'src/App.tsx',
  };

  function configure(
    platformId: 'server' | 'browser',
    questions: Array<Question & { solutionAsset?: string }> = [freeQuestion],
  ) {
    const questionService = jasmine.createSpyObj<QuestionService>('QuestionService', ['loadQuestions']);
    questionService.loadQuestions.and.returnValue(of(questions));
    const assetReader = jasmine.createSpyObj<AssetReader>('AssetReader', ['readJson']);
    assetReader.readJson.and.returnValue(of(sdkAsset));
    TestBed.configureTestingModule({
      providers: [
        TransferState,
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: QuestionService, useValue: questionService },
        { provide: ASSET_READER, useValue: assetReader },
      ],
    });
    return { questionService, assetReader, transferState: TestBed.inject(TransferState) };
  }

  function route(options: { tech?: string; kind?: 'coding' | 'debug'; id?: string; mode?: string } = {}) {
    return {
      parent: { paramMap: convertToParamMap({ tech: options.tech ?? 'react' }) },
      paramMap: convertToParamMap({ id: options.id ?? freeQuestion.id }),
      routeConfig: { path: `${options.kind ?? 'coding'}/:id` },
      queryParamMap: options.mode ? convertToParamMap({ mode: options.mode }) : null,
    } as any;
  }

  function resolve(options: Parameters<typeof route>[0] = {}) {
    return TestBed.runInInjectionContext(() =>
      codingDetailResolver(route(options), {} as any),
    ) as Observable<QuestionDetailResolved>;
  }

  function stateKey(tech = 'react', kind = 'coding', id = freeQuestion.id, asset = assetPath) {
    return makeStateKey<SolutionSnapshot>(`question-solution:${tech}:${kind}:${id}:${asset}`);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('waits for local files, normalizes every file, and transfers only the current free solution', () => {
    const otherQuestion = { ...freeQuestion, id: 'react-other', solutionAsset: 'assets/sb/react/solution/other.json' };
    const { questionService, assetReader, transferState } = configure('server', [freeQuestion, otherQuestion]);
    const assetResult = new Subject<unknown>();
    assetReader.readJson.and.returnValue(assetResult);
    const emitted: QuestionDetailResolved[] = [];

    resolve().subscribe((value) => emitted.push(value));
    expect(emitted).toEqual([]);
    expect(assetReader.readJson).toHaveBeenCalledOnceWith(assetPath);
    expect(transferState.hasKey(stateKey())).toBeFalse();

    assetResult.next(sdkAsset);
    assetResult.complete();

    expect(questionService.loadQuestions).toHaveBeenCalledOnceWith('react', 'coding', { transferState: false });
    expect(emitted.length).toBe(1);
    expect(emitted[0].solutionSnapshot).toEqual(snapshot);
    expect(emitted[0].list).toEqual([freeQuestion, otherQuestion]);
    expect(JSON.parse(transferState.toJson())).toEqual({
      [`question-solution:react:coding:${freeQuestion.id}:${assetPath}`]: snapshot,
    });
  });

  it('uses normalized free access for Angular debug and legacy string file values', async () => {
    const angularAsset = 'assets/sb/angular/solution/ng-debug-counter.solution.json';
    // QuestionService has already normalized missing catalog access to free.
    const question = { ...freeQuestion, id: 'ng-debug-counter', technology: 'angular', access: 'free', solutionAsset: angularAsset } as Question;
    const { assetReader, transferState } = configure('server', [question]);
    assetReader.readJson.and.returnValue(of({
      files: { 'src/app/app.component.ts': 'inc() { this.count += 1; }', 'src/styles.css': '' },
      openFile: 'src/app/app.component.ts',
    }));

    const result = await firstValueFrom(resolve({ tech: 'angular', kind: 'debug', id: question.id }));

    expect(assetReader.readJson).toHaveBeenCalledOnceWith(angularAsset);
    expect(result.solutionSnapshot).toEqual({
      files: { 'src/app/app.component.ts': 'inc() { this.count += 1; }', 'src/styles.css': '' },
      initialPath: 'src/app/app.component.ts',
    });
    expect(transferState.hasKey(stateKey('angular', 'debug', question.id, angularAsset))).toBeTrue();
  });

  it('consumes the current solution once on the browser without reading any asset', async () => {
    const { assetReader, transferState } = configure('browser');
    transferState.set(stateKey(), snapshot);

    const first = await firstValueFrom(resolve());
    const second = await firstValueFrom(resolve());

    expect(first.solutionSnapshot).toEqual(snapshot);
    expect(second.solutionSnapshot).toBeUndefined();
    expect(transferState.hasKey(stateKey())).toBeFalse();
    expect(assetReader.readJson).not.toHaveBeenCalled();
  });

  it('does not reuse a transferred snapshot after the catalog asset path changes', async () => {
    const changedQuestion = { ...freeQuestion, solutionAsset: 'assets/sb/react/solution/react-free-solution.v3.json' };
    const { assetReader, transferState } = configure('browser', [changedQuestion]);
    transferState.set(stateKey(), snapshot);

    const result = await firstValueFrom(resolve());

    expect(result.solutionSnapshot).toBeUndefined();
    expect(assetReader.readJson).not.toHaveBeenCalled();
  });

  it('does not read another question solution when the requested question is missing', async () => {
    const { assetReader, transferState } = configure('server');

    const result = await firstValueFrom(resolve({ id: 'missing-question' }));

    expect(result.question).toBeNull();
    expect(result.solutionSnapshot).toBeUndefined();
    expect(assetReader.readJson).not.toHaveBeenCalled();
    expect(transferState.toJson()).toBe('{}');
  });

  it('keeps inline JavaScript solutions out of framework asset loading', async () => {
    const question = { ...freeQuestion, technology: 'javascript' } as Question;
    const { assetReader, transferState } = configure('server', [question]);

    const result = await firstValueFrom(resolve({ tech: 'javascript' }));

    expect(result.solutionSnapshot).toBeUndefined();
    expect(assetReader.readJson).not.toHaveBeenCalled();
    expect(transferState.toJson()).toBe('{}');
  });

  for (const platform of ['server', 'browser'] as const) {
    it(`does not read a premium solution property or snapshot on ${platform}`, async () => {
      let solutionReads = 0;
      const premium = { ...freeQuestion, access: 'premium' } as Question;
      Object.defineProperty(premium, 'solutionAsset', { get: () => {
        solutionReads += 1;
        throw new Error('Premium solution property must remain unread');
      } });
      const { assetReader, transferState } = configure(platform, [premium]);
      if (platform === 'browser') transferState.set(stateKey(), snapshot);

      const result = await firstValueFrom(resolve());

      expect(result.solutionSnapshot).toBeUndefined();
      expect(solutionReads).toBe(0);
      expect(assetReader.readJson).not.toHaveBeenCalled();
      if (platform === 'server') expect(transferState.toJson()).toBe('{}');
    });

    it(`does not preload a normal solution for pressure mode on ${platform}`, async () => {
      const { assetReader, transferState } = configure(platform);
      if (platform === 'browser') transferState.set(stateKey(), snapshot);

      const result = await firstValueFrom(resolve({ mode: ' Pressure ' }));

      expect(result.solutionSnapshot).toBeUndefined();
      expect(assetReader.readJson).not.toHaveBeenCalled();
      if (platform === 'server') expect(transferState.toJson()).toBe('{}');
    });
  }

  for (const invalidPath of [
    '',
    'https://assets.example/solution.json',
    '/assets/sb/react/solution/solution.json',
    'assets/sb/react/solution/../../private.json',
    'assets/sb/react/solution/%2e%2e%2fprivate.json',
    'assets/sb/react/question/starter.json',
    'assets/sb/angular/solution/solution.json',
    'assets/sb/react/solution/solution.json?version=1',
  ]) {
    it(`rejects an unsupported local asset path: ${invalidPath || '(empty)'}`, async () => {
      const { assetReader, transferState } = configure('server', [{ ...freeQuestion, solutionAsset: invalidPath }]);

      const result = await firstValueFrom(resolve());

      expect(result.solutionSnapshot).toBeUndefined();
      expect(assetReader.readJson).not.toHaveBeenCalled();
      expect(transferState.toJson()).toBe('{}');
    });
  }

  for (const [label, asset] of [
    ['missing', null],
    ['primitive', 'not JSON object'],
    ['missing files', { title: 'Malformed asset' }],
    ['empty map', { files: {} }],
    ['empty code', { files: { 'src/App.tsx': '  ' } }],
    ['invalid file code', { files: { 'src/App.tsx': { code: 42 } } }],
    ['invalid file path', { files: { '/': 'code' } }],
    ['invalid openFile', { files: { 'src/App.tsx': 'code' }, openFile: 42 }],
  ] as const) {
    it(`leaves browser fallback available when the server asset has ${label}`, async () => {
      const { assetReader, transferState } = configure('server');
      assetReader.readJson.and.returnValue(of(asset));

      const result = await firstValueFrom(resolve());

      expect(result.solutionSnapshot).toBeUndefined();
      expect(transferState.toJson()).toBe('{}');
    });
  }

  it('keeps the question usable when reading the server asset fails', async () => {
    const { assetReader, transferState } = configure('server');
    assetReader.readJson.and.returnValue(throwError(() => new Error('Unreadable asset')));

    const result = await firstValueFrom(resolve());

    expect(result.question).toBe(freeQuestion);
    expect(result.solutionSnapshot).toBeUndefined();
    expect(transferState.toJson()).toBe('{}');
  });

  it('discards malformed browser transfer data and leaves asset loading to the component', async () => {
    const { assetReader, transferState } = configure('browser');
    transferState.set(stateKey(), { files: {}, initialPath: '' });

    const result = await firstValueFrom(resolve());

    expect(result.solutionSnapshot).toBeUndefined();
    expect(transferState.hasKey(stateKey())).toBeFalse();
    expect(assetReader.readJson).not.toHaveBeenCalled();
  });
});

describe('triviaDetailResolver', () => {
  const fullQuestion = {
    id: 'js-escape-vs-sanitize',
    title: 'Escaping vs Sanitizing: What is the Difference?',
    type: 'trivia',
    technology: 'javascript',
    access: 'free',
    difficulty: 'medium',
    tags: ['xss', 'security'],
    importance: 4,
    companies: ['Meta'],
    description: 'Escaping encodes output. Sanitizing filters allowed markup.',
    questionFormat: 'output',
    outputChallenge: {
      language: 'javascript',
      runtime: 'browser',
      responseType: 'single-choice',
      prompt: 'What is logged?',
      code: "console.log('A')",
      options: [
        { id: 'a', lines: ['A'] },
        { id: 'b', lines: ['B'] },
        { id: 'c', lines: ['C'] },
      ],
      correctOptionId: 'a',
      explanation: 'The synchronous log runs immediately.',
    },
    answer: {
      blocks: [
        {
          type: 'text',
          text: 'Escaping is context-specific encoding; sanitizing removes unsafe markup.',
        },
      ],
    },
  } as unknown as Question;

  const otherQuestion = {
    ...fullQuestion,
    id: 'event-delegation',
    title: 'Event delegation',
    answer: { blocks: [{ type: 'text', text: 'Delegate bubbling events.' }] },
  } as unknown as Question;

  function configure(platformId: 'browser' | 'server', questions: Question[] = [fullQuestion, otherQuestion]) {
    const questionService = jasmine.createSpyObj<QuestionService>('QuestionService', ['loadQuestions']);
    questionService.loadQuestions.and.returnValue(of(questions));

    TestBed.configureTestingModule({
      providers: [
        TransferState,
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: QuestionService, useValue: questionService },
      ],
    });

    return questionService;
  }

  function route(id = fullQuestion.id) {
    return {
      parent: { paramMap: convertToParamMap({ tech: 'javascript' }) },
      paramMap: convertToParamMap({ id }),
    } as any;
  }

  function stateKey(id = fullQuestion.id) {
    return makeStateKey<QuestionDetailResolved>(`question-detail:javascript:trivia:${id}`);
  }

  function resolve(id = fullQuestion.id): Promise<QuestionDetailResolved> {
    const result = TestBed.runInInjectionContext(() =>
      triviaDetailResolver(route(id), {} as any),
    );
    return firstValueFrom(result as Observable<QuestionDetailResolved>);
  }

  function resolveCoding(id = fullQuestion.id): Promise<QuestionDetailResolved> {
    const result = TestBed.runInInjectionContext(() =>
      codingDetailResolver(route(id), {} as any),
    );
    return firstValueFrom(result as Observable<QuestionDetailResolved>);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses lightweight TransferState on the browser without fetching the full trivia bank', async () => {
    const questionService = configure('browser');
    const transferState = TestBed.inject(TransferState);
    transferState.set(stateKey(), {
      tech: 'javascript',
      kind: 'trivia',
      id: fullQuestion.id,
      list: [],
      listSummaries: [{
        id: fullQuestion.id,
        title: fullQuestion.title,
        type: fullQuestion.type,
        technology: fullQuestion.technology,
        access: fullQuestion.access,
        difficulty: fullQuestion.difficulty,
        tags: fullQuestion.tags,
        importance: fullQuestion.importance,
        companies: fullQuestion.companies,
        questionFormat: fullQuestion.questionFormat,
        description: undefined,
      }],
      question: fullQuestion,
    });

    const resolved = await resolve();

    expect(questionService.loadQuestions).not.toHaveBeenCalled();
    expect(resolved.list).toEqual([]);
    expect(resolved.listSummaries?.length).toBe(1);
    expect(resolved.listSummaries?.[0]?.questionFormat).toBe('output');
    expect((resolved.listSummaries?.[0] as any).answer).toBeUndefined();
    expect((resolved.listSummaries?.[0] as any).outputChallenge).toBeUndefined();
    expect(resolved.question?.answer).toBe(fullQuestion.answer);
    expect(resolved.question?.outputChallenge).toBe(fullQuestion.outputChallenge);
    expect(transferState.hasKey(stateKey())).toBeFalse();
  });

  it('stores only the current full trivia question plus list summaries during prerender', async () => {
    const questionService = configure('server');
    const transferState = TestBed.inject(TransferState);

    const resolved = await resolve();
    const cached = transferState.get(stateKey(), null as QuestionDetailResolved | null);

    expect(questionService.loadQuestions).toHaveBeenCalledOnceWith('javascript' as any, 'trivia', { transferState: false });
    expect(resolved.list).toEqual([]);
    expect(resolved.listSummaries?.map((q) => q.id)).toEqual([fullQuestion.id, otherQuestion.id]);
    expect(resolved.listSummaries?.[0]?.questionFormat).toBe('output');
    expect((resolved.listSummaries?.[0] as any).answer).toBeUndefined();
    expect((resolved.listSummaries?.[0] as any).outputChallenge).toBeUndefined();
    expect(resolved.question?.answer).toBe(fullQuestion.answer);
    expect(cached?.list).toEqual([]);
    expect(cached?.question?.id).toBe(fullQuestion.id);
  });

  it('keeps reference-only review blocks out of public trivia route data and TransferState', async () => {
    const sourceBlock = {
      type: 'text',
      text: '## Source check\n\nCompare this answer with the official reference.',
    };
    const sourceQuestion = {
      ...fullQuestion,
      answer: {
        blocks: [...(fullQuestion.answer as any).blocks, sourceBlock],
      },
    } as unknown as Question;
    configure('server', [sourceQuestion]);
    const transferState = TestBed.inject(TransferState);

    const resolved = await resolve();
    const cached = transferState.get(stateKey(), null as QuestionDetailResolved | null);

    expect((resolved.question?.answer as any).blocks).toEqual((fullQuestion.answer as any).blocks);
    expect((cached?.question?.answer as any).blocks).toEqual((fullQuestion.answer as any).blocks);
    expect((sourceQuestion.answer as any).blocks).toContain(sourceBlock);
  });

  it('does not embed the full coding bank in custom detail TransferState during prerender', async () => {
    const questionService = configure('server');
    const transferState = TestBed.inject(TransferState);

    const resolved = await resolveCoding();
    const codingStateKey = makeStateKey<QuestionDetailResolved>(
      `question-detail:javascript:coding:${fullQuestion.id}`,
    );

    expect(questionService.loadQuestions).toHaveBeenCalledOnceWith('javascript' as any, 'coding', { transferState: false });
    expect(resolved.list.map((q) => q.id)).toEqual([fullQuestion.id, otherQuestion.id]);
    expect(resolved.listSummaries).toBeUndefined();
    expect(transferState.hasKey(codingStateKey)).toBeFalse();
  });
});
