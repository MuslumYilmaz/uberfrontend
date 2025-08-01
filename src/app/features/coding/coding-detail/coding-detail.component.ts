import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import type { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import {
  ConsoleLoggerComponent,
  TestResult,
} from '../console-logger/console-logger.component';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    ButtonModule,
    MonacoEditorComponent,
    ConsoleLoggerComponent,
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss'],
})
export class CodingDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tech!: string;
  question = signal<Question | null>(null);
  editorContent = signal<string>('');
  activePanel = signal<number>(0);
  subTab = signal<'tests' | 'console'>('tests');

  allQuestions: Question[] = [];
  currentIndex = 0;

  testResults: TestResult[] = [];
  hasRunTests = false;
  private testsSub?: Subscription;

  // ViewChild via setter to subscribe when available
  private _consoleLogger?: ConsoleLoggerComponent;
  @ViewChild(ConsoleLoggerComponent)
  set consoleLogger(c: ConsoleLoggerComponent | undefined) {
    this._consoleLogger = c;
    if (c) {
      this.testsSub?.unsubscribe();
      this.testsSub = c.testsFinished.subscribe((results) => {
        this.testResults = results;
      });
    }
  }
  get consoleLogger() {
    return this._consoleLogger;
  }

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe((pm) => {
      this.tech = pm.get('tech')! || 'javascript';
      this.qs.loadQuestions(this.tech, 'coding').subscribe((list) => {
        this.allQuestions = list;
        const id = pm.get('id')!;
        this.loadQuestion(id);
      });
    });
  }

  ngAfterViewInit() {
    // nothing extra; setter handles subscription
  }

  ngOnDestroy() {
    this.testsSub?.unsubscribe();
  }

  private loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);
    this.editorContent.set(q.starterCode ?? '');
    this.activePanel.set(0);
    this.hasRunTests = false;
    this.testResults = [];
    this.subTab.set('tests');
  }

  showSolution() {
    const q = this.question();
    if (!q) return;
    this.editorContent.set(q.solution ?? '');
    this.activePanel.set(1);
  }

  showProblem() {
    const q = this.question();
    if (!q) return;
    this.editorContent.set(q.starterCode ?? '');
    this.activePanel.set(0);
  }

  prev() {
    if (this.currentIndex > 0) {
      const prevId = this.allQuestions[this.currentIndex - 1].id;
      location.pathname = `/${this.tech}/coding/${prevId}`;
    }
  }

  next() {
    if (this.currentIndex + 1 < this.allQuestions.length) {
      const nextId = this.allQuestions[this.currentIndex + 1].id;
      location.pathname = `/${this.tech}/coding/${nextId}`;
    }
  }

  private waitForConsoleLogger(timeoutMs = 2000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.consoleLogger) {
        resolve();
        return;
      }
      const start = Date.now();
      const interval = setInterval(() => {
        if (this.consoleLogger) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error('ConsoleLoggerComponent not available'));
        }
      }, 50);
    });
  }

  private waitForSandboxReady(timeoutMs = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.consoleLogger?.ready && this.consoleLogger.ready()) {
        resolve();
        return;
      }
      const start = Date.now();
      const interval = setInterval(() => {
        if (this.consoleLogger?.ready && this.consoleLogger.ready()) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error('Sandbox not ready after timeout'));
        }
      }, 50);
    });
  }

  async runTests() {
    const q = this.question();
    try {
      await this.waitForConsoleLogger();
    } catch (e) {
      console.warn('Console logger not available', e);
      return;
    }
    if (!q || !this.consoleLogger) return;

    try {
      await this.waitForSandboxReady();
    } catch (e) {
      console.warn('Sandbox not ready', e);
      return;
    }

    const rawTestCode = (q as any).tests ?? '';
    const testCode = this.transformTestCode(rawTestCode, q.id);
    const wrappedUserCode = this.wrapExportDefault(this.editorContent(), q.id);

    this.consoleLogger.runWithTests(wrappedUserCode, testCode);
    this.hasRunTests = true;
    this.subTab.set('tests');
  }

  submitCode() {
    console.log('Submit:', this.editorContent());
  }

  get progressText() {
    return `${this.currentIndex + 1} / ${this.allQuestions.length}`;
  }

  get passedCount() {
    return this.testResults.filter((r) => r.passed).length;
  }

  get totalCount() {
    return this.testResults.length;
  }

  get failedCount() {
    return this.testResults.filter((r) => !r.passed).length;
  }

  get allPassing() {
    return this.totalCount > 0 && this.failedCount === 0;
  }

  get isTestsTab() {
    return this.subTab() === 'tests';
  }

  get isConsoleTab() {
    return this.subTab() === 'console';
  }

  // -------------- helpers -----------------

  private sanitizeGlobalName(id: string) {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private wrapExportDefault(code: string, id: string) {
    const globalName = this.sanitizeGlobalName(id);
    let transformed = code;

    transformed = transformed.replace(
      /export\s+default\s+function\s+([\w$]+)\s*\(/,
      (_m, name) => `function ${name}(`
    );

    const namedDefaultMatch = code.match(/export\s+default\s+function\s+([\w$]+)\s*\(/);
    if (namedDefaultMatch) {
      const fnName = namedDefaultMatch[1];
      transformed = transformed.replace(
        /export\s+default\s+function\s+([\w$]+)\s*\(/,
        (_m, name) => `function ${name}(`
      );
      transformed += `\nif (typeof ${fnName} !== 'undefined') { globalThis.${globalName} = ${fnName}; }`;
      return transformed;
    }

    transformed = transformed.replace(
      /export\s+default\s+async\s+function\s+([\w$]+)\s*\(/,
      (_m, name) => `async function ${name}(`
    );
    const asyncNamedMatch = code.match(/export\s+default\s+async\s+function\s+([\w$]+)\s*\(/);
    if (asyncNamedMatch) {
      const fnName = asyncNamedMatch[1];
      transformed += `\nif (typeof ${fnName} !== 'undefined') { globalThis.${globalName} = ${fnName}; }`;
      return transformed;
    }

    if (/export\s+default/.test(transformed)) {
      transformed = transformed.replace(/export\s+default\s+/, `globalThis.${globalName} = `);
    }

    return transformed;
  }

  private transformTestCode(raw: string, questionId: string) {
    let code = raw.replace(/^import\s+([\w$]+)\s+from\s+['"][^'"]+['"];?\s*$/gm, () => '');
    const globalName = this.sanitizeGlobalName(questionId);
    code = code.replace(/\b([A-Za-z_$][\w$]*)\b/g, (identifier) => {
      if (identifier === questionId || identifier === this.toCamelCase(questionId)) {
        return `globalThis.${globalName}`;
      }
      return identifier;
    });
    return code;
  }

  private toCamelCase(str: string) {
    return str.replace(/[-_](\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
  }

  private stripExportDefault(code: string) {
    let transformed = code;
    transformed = transformed.replace(/export\s+default\s+function\s+([\w$]+)\s*\(/, 'function $1(');
    transformed = transformed.replace(/export\s+default\s+async\s+function\s+([\w$]+)\s*\(/, 'async function $1(');
    transformed = transformed.replace(/export\s+default\s+/, '');
    return transformed;
  }

  private inferAndAutoInvoke(code: string, questionId: string) {
    let transformed = this.stripExportDefault(code);
    const fnMatch = transformed.match(/(?:function\s+([\w$]+)\s*\(|async\s+function\s+([\w$]+)\s*\()/);
    let fnName: string | null = null;
    if (fnMatch) {
      fnName = fnMatch[1] || fnMatch[2] || null;
    } else {
      fnName = this.sanitizeGlobalName(questionId);
    }

    if (fnName && new RegExp(`\\b${fnName}\\s*\\(`).test(transformed)) {
      return transformed;
    }

    if (fnName) {
      transformed += `\ntry { if (typeof ${fnName} === 'function') { ${fnName}(); } } catch (e) { console.error('Auto-invoke error:', e); }`;
    }

    return transformed;
  }
}