import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import type { Question } from '../../../../core/models/question.model';
import type { Tech } from '../../../../core/models/user.model';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { UserCodeSandboxService } from '../../../../core/services/user-code-sandbox.service';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../../console-logger/console-logger.component';

declare const monaco: any;

export type JsLang = 'js' | 'ts';

@Component({
  selector: 'app-coding-js-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, ConsoleLoggerComponent],
  templateUrl: './coding-js-panel.component.html',
  styleUrls: ['./coding-js-panel.component.css']
})
export class CodingJsPanelComponent implements OnChanges {
  /* ---------- Inputs ---------- */
  @Input() question: Question | null = null;   // <- allow null until bound
  @Input() tech: Tech = 'javascript';         // for future-proofing
  @Input() kind: 'coding' | 'debug' = 'coding';

  // optional UI options (pass from parent to keep look consistent)
  @Input() editorOptions: any = {
    fontSize: 12,
    lineHeight: 18,
    minimap: { enabled: false },
    tabSize: 2,
    wordWrap: 'on' as const,
    wordWrapColumn: 100,
    scrollBeyondLastColumn: 2,
    automaticLayout: true,
  };

  // initial language
  @Input() set initialLang(v: JsLang) {
    this.jsLang.set(v);
  }

  /* ---------- Outputs to parent ---------- */
  @Output() solvedChange = new EventEmitter<boolean>();
  @Output() testResultsChange = new EventEmitter<TestResult[]>();
  @Output() consoleEntriesChange = new EventEmitter<ConsoleEntry[]>();
  @Output() codeChange = new EventEmitter<{ lang: JsLang, code: string }>();
  @Output() langChange = new EventEmitter<JsLang>();

  /* ---------- Local state ---------- */
  jsLang = signal<JsLang>('js');                       // 'js' | 'ts'
  topTab = signal<'code' | 'tests'>('code');
  subTab = signal<'tests' | 'console'>('tests');

  editorContent = signal<string>('');                  // user code
  testCode = signal<string>('');                       // test code
  hasRunTests = signal(false);
  testResults = signal<TestResult[]>([]);
  consoleEntries = signal<ConsoleEntry[]>([]);
  editorRatio = signal(0.65); // top editors take 65% of the vertical space
  private _draggingSplit = signal(false);
  isDraggingSplit = this._draggingSplit.asReadonly();
  private _hydrating = true;

  private endHydrationSoon() {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { this._hydrating = false; })
    );
  }

  // --- restore banner state ---
  restoredFromStorage = signal(false);
  restoreDismissed = signal(false);

  dismissRestoreBanner() { this.restoreDismissed.set(true); }

  resetToDefault() {
    const q = this.question; if (!q) return;
    const lang = this.jsLang();

    const { js: starterJs, ts: starterTs } = this.startersForBoth(q);

    // persist reset for BOTH langs (also updates baselines)
    this.codeStore.resetJsBoth(q.id, { js: starterJs, ts: starterTs });

    // update visible editor to current tab's starter
    const currentStarter = (lang === 'ts') ? starterTs : starterJs;
    this.editorContent.set(currentStarter);

    // clear banner
    this.restoredFromStorage.set(false);
    this.restoreDismissed.set(true);

    // notify parent
    this.codeChange.emit({ lang, code: currentStarter });
  }

  passedCount = computed(() => this.testResults().filter(r => r.passed).length);
  totalCount = computed(() => this.testResults().length);
  allPassing = computed(() => this.totalCount() > 0 && this.passedCount() === this.totalCount());

  startSplitDrag(ev: PointerEvent) {
    ev.preventDefault();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    this._draggingSplit.set(true);

    // Host column that holds the whole editors/results stack
    const host = (ev.currentTarget as HTMLElement).closest('.flex-1.flex.flex-col') as HTMLElement;
    const rect = host?.getBoundingClientRect();

    const onMove = (e: PointerEvent) => {
      if (!rect) return;
      const y = e.clientY - rect.top;
      const ratio = Math.min(0.9, Math.max(0.2, y / rect.height)); // clamp 20%–90%
      this.editorRatio.set(ratio);
      // nudge Monaco to relayout
      window.dispatchEvent(new Event('resize'));
    };

    const onUp = () => {
      (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      this._draggingSplit.set(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  constructor(
    private runner: UserCodeSandboxService,
    public codeStore: CodeStorageService,
  ) { }

  ngOnChanges(ch: SimpleChanges) {
    if (ch['question'] && this.question) {
      this.initFromQuestion();                 // inputs are ready, initialize
    }
  }

  /* ---------- Lifecycle-ish setup API (call once from parent) ---------- */
  initFromQuestion() {
    const q = this.question as Question; if (!q) return;
    this._hydrating = true;

    const global = this.codeStore.getJs(q.id);
    const preferred: JsLang =
      (global?.code?.trim()?.length && (global.language === 'ts' || global.language === 'js'))
        ? global.language
        : this.jsLang();
    this.jsLang.set(preferred);

    // 🔔 notify parent about the resolved current language
    this.langChange.emit(preferred);

    // safe starters
    const { js: starterJs, ts: starterTs } = this.startersForBoth(q);
    const starter = preferred === 'ts' ? starterTs : starterJs;

    const { initial, restored } = this.codeStore.initJs(q.id, preferred, starter);
    this.editorContent.set(initial);
    this.testCode.set(this.pickTests(q as any, preferred));

    this.restoredFromStorage.set(restored);
    this.restoreDismissed.set(false);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => { this._hydrating = false; })
    );
  }

  setLanguage(lang: string) {
    const v: JsLang = (lang === 'ts') ? 'ts' : 'js';
    if (v === this.jsLang()) return;
    const q = this.question; if (!q) return;

    // persist current lang before switching (user-initiated)
    if (!this._hydrating) {
      this.codeStore.saveJs(q.id, this.editorContent(), this.jsLang());
    }

    this._hydrating = true;

    // remember banner state
    const bannerWasRestored = this.restoredFromStorage();
    const bannerWasDismissed = this.restoreDismissed();

    // switch
    this.jsLang.set(v);

    // 🔔 notify parent immediately
    this.langChange.emit(v);

    const { js: starterJs, ts: starterTs } = this.startersForBoth(q as Question);
    const starterNext = v === 'ts' ? starterTs : starterJs;

    const perLang = this.codeStore.getJsForLang(q.id, v);
    const next = (typeof perLang === 'string' && perLang.trim().length)
      ? perLang
      : starterNext;

    this.editorContent.set(next);

    // restore banner state
    this.restoredFromStorage.set(bannerWasRestored);
    this.restoreDismissed.set(bannerWasDismissed);

    this.testCode.set(this.pickTests(q as any, v));
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);

    this.endHydrationSoon();
  }

  /* ---------- Handlers ---------- */
  onCodeChange(code: string) {
    if (this._hydrating) return;           // 🛡️ ignore editor’s initial emissions
    const q = this.question; if (!q) return;

    // avoid redundant writes when nothing changed
    if (code === this.editorContent()) return;

    this.editorContent.set(code);
    this.codeStore.saveJs(q.id, code, this.jsLang());
    this.codeChange.emit({ lang: this.jsLang(), code });
  }

  // Tests change is fine – it doesn't touch question
  onTestsChange = (code: string) => { this.testCode.set(code); };

  // Run tests
  async runTests() {
    this.subTab.set('console');
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);

    const q = this.question; if (!q) return;

    const userSrc = await this.ensureJs(this.editorContent(), `${q.id}.ts`);
    const testsSrc = await this.ensureJs(this.testCode(), `${q.id}.tests.ts`);
    const wrapped = this.wrapExportDefault(userSrc);
    const prepared = this.transformTestCode(testsSrc);

    try {
      const out = await this.runner.runWithTests({ userCode: wrapped, testCode: prepared, timeoutMs: 1500 });
      this.consoleEntries.set(this.sanitizeLogs(out?.entries));
      this.testResults.set(out?.results || []);
    } catch (e: any) {
      this.testResults.set([{ name: 'Test runner error', passed: false, error: this.short(e) }]);
    }

    /* ---------- LOCAL FALLBACK if sandbox produced no cases ---------- */
    if ((this.testResults() || []).length === 0 && prepared.trim()) {
      try {
        const results: TestResult[] = [];
        const logs: ConsoleEntry[] = [];
        const push = (level: 'log' | 'info' | 'warn' | 'error', args: any[]) => {
          const msg = args.map(a => { try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); } }).join(' ');
          logs.push({ level, message: msg, timestamp: Date.now() });
        };
        const consoleProxy = {
          log: (...a: any[]) => push('log', a),
          info: (...a: any[]) => push('info', a),
          warn: (...a: any[]) => push('warn', a),
          error: (...a: any[]) => push('error', a),
        };

        const isObj = (v: any) => v !== null && typeof v === 'object';
        const deepEqual = (a: any, b: any): boolean => {
          if (Object.is(a, b)) return true;
          if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
          if (isObj(a) && isObj(b)) {
            const ka = Object.keys(a), kb = Object.keys(b);
            if (ka.length !== kb.length) return false;
            for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
            return true;
          }
          return false;
        };
        const expect = (received: any) => ({
          toBe: (exp: any) => { if (!Object.is(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to be ${JSON.stringify(exp)}`); },
          toEqual: (exp: any) => { if (!deepEqual(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to equal ${JSON.stringify(exp)}`); },
          toStrictEqual: (exp: any) => { if (!deepEqual(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to strictly equal ${JSON.stringify(exp)}`); },
        });

        const it = async (name: string, fn: () => any | Promise<any>) => {
          try { await fn(); results.push({ name, passed: true }); }
          catch (e: any) { results.push({ name, passed: false, error: String(e?.message ?? e) }); }
        };
        const test = it;
        const describe = (_: string, fn: () => void) => { try { fn(); } catch { } };

        const prevConsole = (globalThis as any).console;
        (globalThis as any).console = consoleProxy;
        try {
          new Function(wrapped)(); // define user default on global
          await new Function('describe', 'test', 'it', 'expect', 'console', prepared)(
            describe as any, test as any, it as any, expect as any, consoleProxy as any
          );
        } finally {
          (globalThis as any).console = prevConsole;
        }

        this.consoleEntries.set(this.sanitizeLogs(logs));
        this.testResults.set(results);
      } catch (e: any) {
        this.testResults.set([{ name: 'Local runner error', passed: false, error: this.short(e) }]);
      }
    }
    /* ---------- end fallback ---------- */

    this.hasRunTests.set(true);
    const passing = this.allPassing();
    this.solvedChange.emit(passing);
    this.testResultsChange.emit(this.testResults());
    this.consoleEntriesChange.emit(this.consoleEntries());
    this.subTab.set('tests');
  }

  /* ---------- Helpers (trimmed copies of your originals) ---------- */
  private pickTests(q: any, lang: JsLang): string {
    const keysJs = ['tests', 'testsJs', 'unitTests', 'spec', 'specs', 'testCode'];
    const keysTs = ['testsTs', 'tests', 'unitTestsTs', 'specTs', 'specsTs', 'testCodeTs'];
    const pick = (obj: any, keys: string[]) => {
      for (const k of keys) {
        const v = obj?.[k];
        if (typeof v === 'string' && v.trim()) return v;
      }
      return '';
    };
    return lang === 'ts' ? pick(q, keysTs) : pick(q, keysJs);
  }

  private async ensureJs(code: string, fileName: string): Promise<string> {
    if (!code) return '';

    const looksTs =
      /:\s*[A-Za-z_$][\w$<>\[\]\|&\s,]*/.test(code) ||
      /\sas\s+[A-Za-z_$][\w$<>\[\]\|&\s,]*/.test(code) ||
      /\binterface\b|\btype\s+[^=]+\=/.test(code) ||
      /\benum\s+[A-Za-z_$]/.test(code);

    const stripTypes = (s: string) =>
      s
        .replace(/:\s*[^=;,)]+(?=[=;,)])/g, '')
        .replace(/\sas\s+[A-Za-z_$][\w$<>\[\]\|&\s,]*/g, '')
        .replace(/\binterface\b[\s\S]*?\{[\s\S]*?\}\s*/g, '')
        .replace(/\btype\s+[A-Za-z_$][\w$]*\s*=\s*[\s\S]*?;/g, '')
        .replace(/\benum\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\}\s*/g, '');

    if (this.jsLang() === 'ts' || looksTs) {
      try {
        const uri = monaco.Uri.parse(`inmemory://model/${fileName}`);
        const model = monaco.editor.createModel(code, 'typescript', uri);
        try {
          const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
          const svc = await getWorker(uri);
          const out = await svc.getEmitOutput(uri.toString());
          const js = out?.outputFiles?.[0]?.text ?? '';
          if (js && js.trim()) return js;        // ✅ only trust non-empty emit
        } finally {
          // always dispose
          model.dispose();
        }
      } catch {
        // ignore and fall through to strip
      }
      // ✅ fallback when emit was empty or worker failed
      return stripTypes(code);
    }

    return code;
  }

  private wrapExportDefault(src: string): string {
    let name: string | null = null;
    let s = src;
    s = s.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m, (_m, n) => {
      name = n || '__UF_DefaultFn__';
      return `function ${name}`;
    });
    s = s.replace(/\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m, (_m, n) => {
      name = n || '__UF_DefaultClass__';
      return `class ${name}`;
    });
    if (!/\b__UF_Default(Fn|Class)__\b/.test(s)) {
      const before = s;
      s = s.replace(/\bexport\s+default\s+/m, 'const __UF_Default__ = ');
      if (s !== before) name = name || '__UF_Default__';
    }
    s += `
      ;globalThis.__UF_USER_DEFAULT__ = (typeof ${name} !== "undefined") ? ${name} : undefined;
      ;try { if (${JSON.stringify(name)} && typeof ${name} !== "undefined") { globalThis[${JSON.stringify(name)}] = ${name}; } } catch {}
    `;
    return s;
  }

  private transformTestCode(src: string): string {
    const REL_DEFAULT = /import\s+([A-Za-z0-9_$*\s{},]+)\s+from\s+['"]\.\/[A-Za-z0-9_\-./]+['"];?/g;
    let out = src.replace(REL_DEFAULT, (_m, bindings) => {
      const first = bindings.includes('{')
        ? bindings.replace(/[{}*\s]/g, '').split(',')[0] || '__user'
        : bindings.trim();
      return `const ${first} = globalThis.__UF_USER_DEFAULT__;`;
    });
    out = out.replace(/^\s*import\s+[^;]+from\s+['"](jest|vitest)['"];\s*$/mg, '');
    return out;
  }

  private sanitizeLogs(raw: any[]): ConsoleEntry[] {
    const now = Date.now();
    const toStr = (v: any) => { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); } };
    return (raw || []).slice(-500).map((r: any) => {
      if (r?.level && r?.message) return { level: r.level, message: r.message, timestamp: r.timestamp ?? now };
      if (r?.type) {
        const level = (['info', 'warn', 'error'].includes(r.type) ? r.type : 'log') as ConsoleEntry['level'];
        const msg = Array.isArray(r.args) ? r.args.map(toStr).join(' ') : toStr(r.args);
        return { level, message: msg, timestamp: now };
      }
      return { level: 'log', message: toStr(r), timestamp: now };
    });
  }

  private short(e: any) {
    const raw = e?.stack || e?.message || String(e);
    return raw.split('\n')[0]?.trim() || raw;
  }

  // inside CodingJsPanelComponent
  public setCode(code: string) {
    this.editorContent.set(code);
    const q = this.question;
    if (q) this.codeStore.saveJs(q.id, code, this.jsLang());
    this.codeChange.emit({ lang: this.jsLang(), code });
  }

  private startersForBoth(q: Question): { js: string; ts: string } {
    const anyQ = q as any;
    const js = (anyQ?.starterCode ?? '') as string;
    const ts = (anyQ?.starterCodeTs ?? anyQ?.starterCode ?? '') as string;
    return { js, ts };
  }

  public async applySolution(raw: string) {
    let code = raw ?? '';
    if (this.jsLang() === 'js') {
      // convert if it looks like TS (ensureJs already handles detection + fallbacks)
      code = await this.ensureJs(code, 'solution.ts');
    }
    this.setCode(code);
  }

}
