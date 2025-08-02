import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
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
export class CodingDetailComponent implements OnInit, OnDestroy {
  tech!: string;
  question = signal<Question | null>(null);
  editorContent = signal<string>(''); // user code
  testCode = signal<string>(''); // test code editable
  topTab = signal<'code' | 'tests'>('code'); // top editor tabs
  activePanel = signal<number>(0);
  subTab = signal<'tests' | 'console'>('tests');

  allQuestions: Question[] = [];
  currentIndex = 0;

  testResults: TestResult[] = [];
  hasRunTests = false;
  private testsSub?: Subscription;

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

  // computed for template
  passedCount = computed(() => this.testResults.filter((r) => r.passed).length);
  totalCount = computed(() => this.testResults.length);
  failedCount = computed(() => this.testResults.filter((r) => !r.passed).length);
  allPassing = computed(() => this.totalCount() > 0 && this.failedCount() === 0);
  isTestsTab = computed(() => this.subTab() === 'tests');
  isConsoleTab = computed(() => this.subTab() === 'console');
  isTopCodeTab = computed(() => this.topTab() === 'code');
  isTopTestsTab = computed(() => this.topTab() === 'tests');

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
    this.testCode.set(((q as any).tests as string) ?? '');
    this.activePanel.set(0);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults = [];
  }

  showSolution() {
    const q = this.question();
    if (!q) return;
    this.editorContent.set(q.solution ?? '');
    this.activePanel.set(1);
    this.topTab.set('code');
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
    if (!q) return;

    // Ensure console logger is mounted by activating console tab first.
    this.subTab.set('console');

    // Wait a tick so the console logger child actually instantiates and setter fires.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    if (!this.consoleLogger) {
      console.warn('Console logger not available');
      return;
    }

    try {
      await this.waitForSandboxReady();
    } catch (e) {
      console.warn('Sandbox not ready', e);
      return;
    }

    const rawTestCode = this.testCode();
    const testCodeTransformed = this.transformTestCode(rawTestCode, q.id);
    const wrappedUserCode = this.wrapExportDefault(this.editorContent(), q.id);

    this.consoleLogger.runWithTests(wrappedUserCode, testCodeTransformed);
    this.hasRunTests = true;

    // Show test summary panel
    this.subTab.set('tests');
  }

  submitCode() {
    console.log('Submit:', this.editorContent());
  }

  get progressText() {
    return `${this.currentIndex + 1} / ${this.allQuestions.length}`;
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
}